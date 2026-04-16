import type { HttpRequest } from "@azure/functions";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { apiConfig, requireConfig } from "./config.js";

export interface AuthenticatedUser {
  oid: string;
  name: string;
  email: string;
}

const jwks = !apiConfig.disableAuth && apiConfig.azureTenantId
  ? createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${apiConfig.azureTenantId}/discovery/v2.0/keys`),
    )
  : null;

export async function requireUser(request: HttpRequest): Promise<AuthenticatedUser> {
  if (apiConfig.disableAuth) {
    return {
      oid: "local-dev-user",
      name: "Local Developer",
      email: "local.dev@example.com",
    };
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const token = authorization.slice("Bearer ".length);
  const tenantId = requireConfig("AZURE_TENANT_ID", apiConfig.azureTenantId);
  const audience = requireConfig("AZURE_API_AUDIENCE", apiConfig.azureApiAudience);

  const verified = await jwtVerify(token, jwks!, {
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    audience,
  });

  const payload = verified.payload;
  return {
    oid: String(payload.oid || payload.sub || ""),
    name: String(payload.name || payload.preferred_username || "Unknown user"),
    email: String(payload.preferred_username || payload.email || ""),
  };
}
