import { PublicClientApplication } from "@azure/msal-browser";
import { azureAuthConfig } from "./config";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: azureAuthConfig.clientId,
    authority: `https://login.microsoftonline.com/${azureAuthConfig.tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: azureAuthConfig.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
});

export const loginRequest = {
  scopes: ["openid", "profile", "email", azureAuthConfig.apiScope],
};
