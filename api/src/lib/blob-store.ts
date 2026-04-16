import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  BlockBlobClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { apiConfig, requireConfig } from "./config.js";

let containerPromise: Promise<ReturnType<BlobServiceClient["getContainerClient"]>> | null = null;

function createBlobServiceClient() {
  if (apiConfig.storageConnectionString) {
    return BlobServiceClient.fromConnectionString(apiConfig.storageConnectionString);
  }

  if (apiConfig.storageAccountUrl && apiConfig.storageAccountName && apiConfig.storageAccountKey) {
    return new BlobServiceClient(
      apiConfig.storageAccountUrl,
      new StorageSharedKeyCredential(apiConfig.storageAccountName, apiConfig.storageAccountKey),
    );
  }

  return new BlobServiceClient(
    requireConfig("AZURE_STORAGE_ACCOUNT_URL", apiConfig.storageAccountUrl),
    new DefaultAzureCredential(),
  );
}

async function getContainer() {
  if (!containerPromise) {
    containerPromise = (async () => {
      const client = createBlobServiceClient().getContainerClient(apiConfig.storageContainer);
      await client.createIfNotExists();
      return client;
    })();
  }

  return containerPromise;
}

async function getBlockBlob(path: string): Promise<BlockBlobClient> {
  const container = await getContainer();
  return container.getBlockBlobClient(path);
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  const blob = await getBlockBlob(path);
  if (!(await blob.exists())) {
    return fallback;
  }

  const download = await blob.download();
  const text = await streamToString(download.readableStreamBody ?? null);
  return JSON.parse(text) as T;
}

export async function writeJson(path: string, value: unknown) {
  const blob = await getBlockBlob(path);
  const body = JSON.stringify(value, null, 2);
  await blob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json; charset=utf-8" },
  });
}

async function streamToString(stream: NodeJS.ReadableStream | null): Promise<string> {
  if (!stream) return "";

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
