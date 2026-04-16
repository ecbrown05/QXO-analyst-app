import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { randomUUID } from "node:crypto";
import type {
  CaseAuditEntry,
  CaseRecord,
  CaseSummary,
  Customer,
  GovernanceThreshold,
  MarketPriceRecord,
  ParseIntakeResponse,
  RequestType,
  Sku,
  SpendClassThreshold,
} from "../../../shared/domain.js";
import { requireUser } from "../lib/auth.js";
import { readJson, writeJson } from "../lib/blob-store.js";
import { apiConfig } from "../lib/config.js";

const CASE_INDEX_PATH = "cases/index.json";
const CASE_ITEM_PREFIX = "cases/items";
const AUDIT_PREFIX = "audit";
const CUSTOMERS_PATH = "reference/customers.json";
const SKUS_PATH = "reference/skus.json";
const THRESHOLDS_PATH = "reference/spend-class-thresholds.json";
const RULES_PATH = "reference/governance-thresholds.json";

const FIELDS_BY_TYPE: Record<RequestType, string[]> = {
  existing_deviation: [
    "customer_name", "sku_code", "target_price", "requested_price",
    "quantity", "requester", "branch", "region", "price_zone",
    "current_deviation_percent", "competitor_bid", "reason_for_request",
  ],
  new_deviation: [
    "customer_name", "sku_code", "market_price", "requested_price",
    "expected_revenue", "quantity", "requester", "branch", "region",
    "price_zone", "competitor_bid", "reason_for_request",
  ],
  spend_class_new: [
    "customer_name", "expected_revenue", "order_frequency", "growth_rate",
    "requester", "branch", "region", "reason_for_request",
  ],
  spend_class_existing: [
    "customer_name", "current_spend_class", "requested_spend_class",
    "expected_revenue", "order_frequency", "growth_rate",
    "requester", "branch", "region", "reason_for_request",
  ],
  market_price_change: [
    "sku_code", "current_price", "requested_price", "price_zone",
    "quantity", "requester", "branch", "region",
    "evidence_provided", "reason_for_request",
  ],
};

const FIELD_DESCRIPTIONS: Record<string, string> = {
  customer_name: "Full company / customer name",
  sku_code: "SKU, item number, or product code",
  target_price: "Current target price in dollars (number only)",
  requested_price: "Price the requester is asking for in dollars (number only)",
  market_price: "Current market price in dollars (number only)",
  current_price: "Current market price in dollars (number only)",
  quantity: "Number of units or volume (number only)",
  expected_revenue: "Expected annual revenue in dollars (number only)",
  requester: "Name of the person making the request",
  branch: "Branch or location name",
  region: "Geographic region",
  price_zone: "Price zone identifier",
  current_deviation_percent: "Current deviation percentage (number only)",
  current_spend_class: "Current spend class letter: A, B, C, or D",
  requested_spend_class: "Requested spend class letter: A, B, C, or D",
  order_frequency: "How many weeks per year the customer orders (number only)",
  growth_rate: "Growth rate as a percentage (number only)",
  competitor_bid: "Competitor bid or competitive evidence text",
  evidence_provided: "Override evidence or supporting documentation text",
  reason_for_request: "Stated reason or business justification for the request",
};

function json(body: unknown, status = 200): HttpResponseInit {
  return {
    status,
    jsonBody: body,
    headers: {
      "Content-Type": "application/json",
    },
  };
}

function errorResponse(error: unknown, status = 500): HttpResponseInit {
  return json(
    { error: error instanceof Error ? error.message : String(error) },
    status,
  );
}

function casePath(id: string) {
  return `${CASE_ITEM_PREFIX}/${id}.json`;
}

function auditPath(caseId: string) {
  return `${AUDIT_PREFIX}/${caseId}/${Date.now()}.json`;
}

function marketPriceZonePath(priceZone: string) {
  return `reference/market-prices/by-zone/${slugify(priceZone)}.json`;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toSummary(record: CaseRecord): CaseSummary {
  return {
    id: record.id,
    case_number: record.case_number,
    request_type: record.request_type,
    status: record.status,
    customer_name: record.customer_name,
    requester: record.requester,
    recommendation: record.recommendation,
    total_margin_loss: record.total_margin_loss,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

async function readCaseIndex() {
  const index = await readJson<CaseSummary[]>(CASE_INDEX_PATH, []);
  return index.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function writeCaseIndex(records: CaseSummary[]) {
  await writeJson(
    CASE_INDEX_PATH,
    records.sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

async function writeAuditEntry(entry: CaseAuditEntry) {
  await writeJson(auditPath(entry.case_id), entry);
}

function buildPrompt(requestType: RequestType, sourceText: string) {
  const fieldList = FIELDS_BY_TYPE[requestType]
    .map((field) => `- "${field}": ${FIELD_DESCRIPTIONS[field] ?? field}`)
    .join("\n");

  return `You are a data extraction assistant for a building-materials pricing team.
Extract structured fields from the provided text, which may be an email, chat message, or free-form notes.

Return ONLY a valid JSON object with exactly these keys. Use string values for all fields (including numeric ones — return the raw number as a string, e.g. "42.50" not 42.50). Use null for any field you cannot confidently extract from the text.

Fields to extract:
${fieldList}

Text:
"""
${sourceText}
"""`;
}

function getMessagesUrl() {
  if (apiConfig.anthropicMessagesUrl) return apiConfig.anthropicMessagesUrl;
  const trimmed = apiConfig.anthropicBaseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? `${trimmed}/messages` : `${trimmed}/v1/messages`;
}

async function parseModelOutput(requestType: RequestType, sourceText: string): Promise<ParseIntakeResponse> {
  if (!apiConfig.anthropicApiKey && !apiConfig.anthropicMessagesUrl) {
    throw new Error("Anthropic is not configured for parse-intake.");
  }

  const response = await fetch(getMessagesUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": apiConfig.anthropicVersion,
      ...(apiConfig.anthropicApiKey ? { "x-api-key": apiConfig.anthropicApiKey } : {}),
    },
    body: JSON.stringify({
      model: apiConfig.anthropicModel,
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(requestType, sourceText) }],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const body = (await response.json()) as { content?: Array<{ text?: string }> };
  const rawText = body.content?.[0]?.text ?? "{}";
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    return { fields: {} };
  }

  const parsed = JSON.parse(match[0]) as Record<string, string | null>;
  return { fields: parsed };
}

function applySearch<T>(records: T[], search: string | undefined, values: (record: T) => string[]) {
  if (!search) return records;
  const term = search.toLowerCase();
  return records.filter((record) =>
    values(record).some((value) => value.toLowerCase().includes(term)),
  );
}

function limitRecords<T>(records: T[], limitValue: string | undefined, fallback = 100) {
  const limit = Math.max(1, Math.min(500, Number.parseInt(limitValue || "", 10) || fallback));
  return records.slice(0, limit);
}

app.http("listCases", {
  route: "cases",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const status = request.query.get("status");
      const requestType = request.query.get("requestType");
      let cases = await readCaseIndex();
      if (status) {
        cases = cases.filter((item) => item.status === status);
      }
      if (requestType) {
        cases = cases.filter((item) => item.request_type === requestType);
      }
      return json(cases);
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("getCase", {
  route: "cases/{id}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const id = request.params.id;
      const record = await readJson<CaseRecord | null>(casePath(id), null);
      if (!record) return errorResponse("Case not found", 404);
      return json(record);
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("createCase", {
  route: "cases",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      const user = await requireUser(request);
      const payload = (await request.json()) as Omit<CaseRecord, "id" | "created_at" | "updated_at">;
      const now = new Date().toISOString();
      const record: CaseRecord = {
        ...payload,
        id: randomUUID(),
        created_at: now,
        updated_at: now,
        created_by: payload.created_by || user.email || user.oid,
      };

      await writeJson(casePath(record.id), record);

      const index = await readCaseIndex();
      const nextIndex = [toSummary(record), ...index.filter((item) => item.id !== record.id)];
      await writeCaseIndex(nextIndex);

      await writeAuditEntry({
        id: randomUUID(),
        case_id: record.id,
        action: "created",
        field_changed: null,
        old_value: null,
        new_value: null,
        performed_by: user.email || user.oid,
        created_at: now,
      });

      return json(record, 201);
    } catch (error) {
      return errorResponse(error, 400);
    }
  },
});

app.http("listCustomers", {
  route: "reference/customers",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const customers = await readJson<Customer[]>(CUSTOMERS_PATH, []);
      const filtered = applySearch(customers, request.query.get("search") || undefined, (customer) => [
        customer.customer_name,
        customer.customer_id,
      ]).sort((a, b) => a.customer_name.localeCompare(b.customer_name));
      return json(limitRecords(filtered, request.query.get("limit") || undefined));
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("listSkus", {
  route: "reference/skus",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const skus = await readJson<Sku[]>(SKUS_PATH, []);
      const filtered = applySearch(skus, request.query.get("search") || undefined, (sku) => [
        sku.sku_code,
        sku.description,
      ]).sort((a, b) => a.sku_code.localeCompare(b.sku_code));
      return json(limitRecords(filtered, request.query.get("limit") || undefined));
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("getThresholds", {
  route: "reference/thresholds",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const thresholds = await readJson<SpendClassThreshold[]>(THRESHOLDS_PATH, []);
      return json(thresholds.sort((a, b) => a.class.localeCompare(b.class)));
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("getRules", {
  route: "reference/rules",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const rules = await readJson<GovernanceThreshold[]>(RULES_PATH, []);
      return json(rules.sort((a, b) => a.request_type.localeCompare(b.request_type)));
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("getMarketPrice", {
  route: "reference/market-price",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      await requireUser(request);
      const skuCode = request.query.get("skuCode");
      const priceZone = request.query.get("priceZone");
      const spendClass = request.query.get("spendClass");
      if (!skuCode || !priceZone || !spendClass) {
        return errorResponse("skuCode, priceZone, and spendClass are required", 400);
      }

      const zoneRecords = await readJson<MarketPriceRecord[]>(marketPriceZonePath(priceZone), []);
      const match =
        zoneRecords.find(
          (record) =>
            record.sku_code === skuCode &&
            record.spend_class === spendClass,
        ) || null;

      return json(match);
    } catch (error) {
      return errorResponse(error, 401);
    }
  },
});

app.http("parseIntake", {
  route: "parse-intake",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest) => {
    try {
      await requireUser(request);
      const body = (await request.json()) as { source_text?: string; request_type?: RequestType };
      if (!body.source_text || !body.request_type) {
        return errorResponse("source_text and request_type are required", 400);
      }

      if (!(body.request_type in FIELDS_BY_TYPE)) {
        return errorResponse(`Unknown request_type: ${body.request_type}`, 400);
      }

      return json(await parseModelOutput(body.request_type, body.source_text));
    } catch (error) {
      return errorResponse(error, 400);
    }
  },
});
