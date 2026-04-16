import { LogOut } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Button } from "@/components/ui/button";
import { useSignedInUser } from "@/auth/useSignedInUser";

export function UserBadge() {
  const { instance } = useMsal();
  const user = useSignedInUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 ml-auto">
      <div className="text-right hidden sm:block">
        <div className="text-sm font-medium leading-none">{user.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{user.email}</div>
      </div>
      <Button variant="outline" size="sm" onClick={() => instance.logoutRedirect()}>
        <LogOut className="h-4 w-4 mr-1" />
        Sign out
      </Button>
    </div>
  );
}
