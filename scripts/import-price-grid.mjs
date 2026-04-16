import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadDotEnvLocal();

const csvPath = resolveCsvPath(process.argv[2]);
const containerName = process.env.AZURE_STORAGE_CONTAINER || "qxo-analyst-data";
const containerClient = createBlobServiceClient().getContainerClient(containerName);
const effectiveDefaultDate = new Date().toISOString().slice(0, 10);

await containerClient.createIfNotExists();

const skuMap = new Map();
const zoneMap = new Map();
const skuPriceMap = new Map();
const zoneCounts = new Map();

await streamCsv(csvPath);

const skus = [...skuMap.values()].sort((a, b) => a.sku_code.localeCompare(b.sku_code));
await uploadJson("reference/skus.json", skus);

for (const [zoneKey, records] of zoneMap.entries()) {
  await uploadJson(`reference/market-prices/by-zone/${zoneKey}.json`, records);
}

for (const [skuCode, records] of skuPriceMap.entries()) {
  await uploadJson(`reference/market-prices/by-sku/${skuCode}.json`, records);
}

await uploadJson(
  "reference/market-prices/index.json",
  [...zoneCounts.entries()].map(([zone, count]) => ({ zone, count })).sort((a, b) => a.zone.localeCompare(b.zone)),
);

console.log(`Imported ${skus.length} SKUs and ${[...skuPriceMap.values()].reduce((sum, records) => sum + records.length, 0)} market-price rows into '${containerName}'.`);

function loadDotEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function createBlobServiceClient() {
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    return BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  }

  if (
    process.env.AZURE_STORAGE_ACCOUNT_URL &&
    process.env.AZURE_STORAGE_ACCOUNT_NAME &&
    process.env.AZURE_STORAGE_ACCOUNT_KEY
  ) {
    return new BlobServiceClient(
      process.env.AZURE_STORAGE_ACCOUNT_URL,
      new StorageSharedKeyCredential(
        process.env.AZURE_STORAGE_ACCOUNT_NAME,
        process.env.AZURE_STORAGE_ACCOUNT_KEY,
      ),
    );
  }

  if (!process.env.AZURE_STORAGE_ACCOUNT_URL) {
    throw new Error("Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL before importing.");
  }

  return new BlobServiceClient(process.env.AZURE_STORAGE_ACCOUNT_URL, new DefaultAzureCredential());
}

function resolveCsvPath(arg) {
  if (arg) return path.resolve(arg);
  const defaultPath = path.join(__dirname, "..", "data", "PFX Grid Data_Price_Grid_Data_041426.csv");
  return defaultPath;
}

async function streamCsv(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`CSV not found: ${filePath}`);
  }

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true,
      trim: true,
    }),
  );

  for await (const row of parser) {
    ingestRow(row);
  }
}

function ingestRow(row) {
  const record = lowerKeyMap(row);
  const skuCode = normalizeItemNo(pick(record, "Item_No", "item_no"));
  const description = text(pick(record, "Item_Description", "description"));
  const category = text(pick(record, "Category", "category")) || "Unassigned";
  const priceZone = text(pick(record, "Price_Zone", "price_zone"));
  const effectiveDate = parseDate(pick(record, "Last_Update_Date", "last_update_date")) || effectiveDefaultDate;

  if (!skuCode || !priceZone) return;

  skuMap.set(skuCode, {
    id: skuCode,
    sku_code: skuCode,
    description: description || skuCode,
    category,
    unit_of_measure: text(pick(record, "UOM", "Unit_Of_Measure", "unit_of_measure")) || "EA",
    created_at: new Date().toISOString(),
  });

  const zoneKey = slugify(priceZone);
  if (!zoneMap.has(zoneKey)) zoneMap.set(zoneKey, []);
  if (!skuPriceMap.has(skuCode)) skuPriceMap.set(skuCode, []);

  for (const [spendClass, columns] of SPEND_COLUMNS) {
    const price = firstNumber(record, columns);
    if (price == null) continue;

    const priceRecord = {
      sku_id: skuCode,
      sku_code: skuCode,
      price_zone: priceZone,
      spend_class: spendClass,
      market_price: roundMoney(price),
      effective_date: effectiveDate,
      created_at: new Date().toISOString(),
    };

    upsert(zoneMap.get(zoneKey), `${skuCode}:${spendClass}`, priceRecord);
    upsert(skuPriceMap.get(skuCode), `${zoneKey}:${spendClass}`, priceRecord);
    zoneCounts.set(priceZone, (zoneCounts.get(priceZone) || 0) + 1);
  }
}

function upsert(records, key, value) {
  const existingIndex = records.findIndex((record) =>
    `${slugify(record.price_zone)}:${record.spend_class}` === key ||
    `${record.sku_code}:${record.spend_class}` === key,
  );
  if (existingIndex >= 0) {
    records[existingIndex] = value;
    return;
  }
  records.push(value);
}

function lowerKeyMap(row) {
  const mapped = Object.create(null);
  for (const key of Object.keys(row)) {
    mapped[key.trim().toLowerCase()] = row[key];
  }
  return mapped;
}

function pick(mapped, ...aliases) {
  for (const alias of aliases) {
    const value = mapped[String(alias).trim().toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function firstNumber(mapped, columns) {
  for (const column of columns) {
    const value = pick(mapped, column);
    const parsed = parseNumber(value);
    if (parsed != null) return parsed;
  }
  return null;
}

function parseNumber(value) {
  if (value == null) return null;
  const normalized = String(value).trim().replace(/,/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function parseDate(value) {
  const normalized = text(value);
  if (!normalized) return null;
  const firstTen = normalized.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(firstTen) ? firstTen : null;
}

function normalizeItemNo(value) {
  const digits = text(value).replace(/\D/g, "");
  return digits ? digits.padStart(6, "0") : "";
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function slugify(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uploadJson(blobName, value) {
  const blob = containerClient.getBlockBlobClient(blobName);
  const body = JSON.stringify(value, null, 2);
  await blob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json; charset=utf-8" },
  });
}

const SPEND_COLUMNS = [
  ["A", ["Current_A_Price", "Current_A"]],
  ["B", ["Current_B_Price", "Current_B"]],
  ["C", ["Current_C_Price", "Current_C"]],
  ["D", ["Current_D_Price", "Current_D"]],
];
