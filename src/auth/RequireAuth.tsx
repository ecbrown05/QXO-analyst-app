import { PropsWithChildren } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Button } from "@/components/ui/button";
import { loginRequest } from "@/auth/msal";

export function RequireAuth({ children }: PropsWithChildren) {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full border rounded-lg p-8 bg-card text-card-foreground shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">Sign in required</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Use your Microsoft Entra account to access the Azure-backed Pricing Copilot.
          </p>
          <Button className="w-full" onClick={() => instance.loginRedirect(loginRequest)}>
            Sign in with Microsoft
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
