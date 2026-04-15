import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const FIELDS_BY_TYPE: Record<string, string[]> = {
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

function buildPrompt(requestType: string, sourceText: string): string {
  const fields = FIELDS_BY_TYPE[requestType] ?? [];
  const fieldList = fields
    .map((f) => `- "${f}": ${FIELD_DESCRIPTIONS[f] ?? f}`)
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { source_text, request_type } = await req.json();

    if (!source_text || !request_type) {
      return new Response(
        JSON.stringify({ error: "source_text and request_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!FIELDS_BY_TYPE[request_type]) {
      return new Response(
        JSON.stringify({ error: `Unknown request_type: ${request_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(request_type, source_text) }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Anthropic API error", detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData?.content?.[0]?.text ?? "{}";

    // Extract JSON from the response (Claude may wrap it in markdown fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(
      JSON.stringify({ fields: extracted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("parse-intake error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
