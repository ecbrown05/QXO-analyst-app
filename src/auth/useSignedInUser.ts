import { useMemo } from "react";
import { useMsal } from "@azure/msal-react";

export function useSignedInUser() {
  const { accounts, instance } = useMsal();
  const account = instance.getActiveAccount() || accounts[0] || null;

  return useMemo(() => {
    if (!account) return null;
    return {
      name: account.name || "Unknown user",
      email: account.username || "",
      oid: account.localAccountId || account.homeAccountId,
    };
  }, [account]);
}
