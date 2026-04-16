const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const apiClientId = import.meta.env.VITE_AZURE_API_CLIENT_ID as string | undefined;

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required frontend env: ${name}`);
  }
  return value;
}

export const azureAuthConfig = {
  tenantId: required("VITE_AZURE_TENANT_ID", tenantId),
  clientId: required("VITE_AZURE_CLIENT_ID", clientId),
  apiScope:
    (import.meta.env.VITE_AZURE_API_SCOPE as string | undefined) ||
    `api://${apiClientId || clientId}/user_impersonation`,
  postLogoutRedirectUri:
    (import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI as string | undefined) || window.location.origin,
  apiBaseUrl:
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api",
};
