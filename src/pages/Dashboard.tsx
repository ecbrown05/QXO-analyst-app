import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analytics and insights — coming in Phase 2
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Dashboard Coming Soon</p>
          <p className="text-sm mt-1">Case volume, margin at risk, turnaround metrics, and behavioral insights</p>
        </CardContent>
      </Card>
    </div>
  );
}
