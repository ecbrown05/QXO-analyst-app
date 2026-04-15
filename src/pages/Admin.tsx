import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Admin() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          User management, audit log, and system configuration — coming in Phase 2
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Settings className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Admin Panel Coming Soon</p>
          <p className="text-sm mt-1">Role management, audit trail, and reference data uploads</p>
        </CardContent>
      </Card>
    </div>
  );
}
