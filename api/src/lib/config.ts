export const apiConfig = {
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  storageContainer: process.env.AZURE_STORAGE_CONTAINER || "qxo-analyst-data",
  storageAccountUrl: process.env.AZURE_STORAGE_ACCOUNT_URL,
  storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureApiAudience: process.env.AZURE_API_AUDIENCE || process.env.AZURE_CLIENT_ID,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicMessagesUrl: process.env.ANTHROPIC_MESSAGES_URL,
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
  anthropicVersion: process.env.ANTHROPIC_VERSION || "2023-06-01",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  disableAuth: process.env.API_DISABLE_AUTH === "true",
};

export function requireConfig(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required API setting: ${name}`);
  }
  return value;
}
