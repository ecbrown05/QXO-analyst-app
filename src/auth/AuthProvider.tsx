import { PropsWithChildren, useEffect } from "react";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";
import { msalInstance } from "./msal";

export function AzureAuthProvider({ children }: PropsWithChildren) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

export function ActiveAccountProvider({ children }: PropsWithChildren) {
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const callbackId = instance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload && "account" in event.payload) {
        const payload = event.payload as { account?: unknown };
        if (payload.account) {
          instance.setActiveAccount(payload.account as never);
        }
      }
    });

    const active = instance.getActiveAccount();
    if (!active && accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
    }

    return () => {
      if (callbackId) instance.removeEventCallback(callbackId);
    };
  }, [accounts, instance]);

  return <>{children}</>;
}
