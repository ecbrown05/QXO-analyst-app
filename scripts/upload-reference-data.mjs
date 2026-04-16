import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadDotEnvLocal();

const containerName = process.env.AZURE_STORAGE_CONTAINER || "qxo-analyst-data";
const blobServiceClient = createBlobServiceClient();
const containerClient = blobServiceClient.getContainerClient(containerName);

await containerClient.createIfNotExists();

await uploadJson("reference/customers.json", readJsonFile("customers.json"));
await uploadJson("reference/spend-class-thresholds.json", readJsonFile("spend-class-thresholds.json"));
await uploadJson("reference/governance-thresholds.json", readJsonFile("governance-thresholds.json"));

if (!(await containerClient.getBlockBlobClient("reference/skus.json").exists())) {
  await uploadJson("reference/skus.json", []);
}

if (!(await containerClient.getBlockBlobClient("cases/index.json").exists())) {
  await uploadJson("cases/index.json", []);
}

console.log(`Uploaded seed reference blobs to container '${containerName}'.`);

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
    throw new Error("Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL.");
  }

  return new BlobServiceClient(process.env.AZURE_STORAGE_ACCOUNT_URL, new DefaultAzureCredential());
}

function readJsonFile(fileName) {
  const fullPath = path.join(__dirname, "..", "data", "reference", fileName);
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

async function uploadJson(blobName, value) {
  const blob = containerClient.getBlockBlobClient(blobName);
  const body = JSON.stringify(value, null, 2);
  await blob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json; charset=utf-8" },
  });
}
