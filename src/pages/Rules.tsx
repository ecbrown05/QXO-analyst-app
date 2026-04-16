import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getGovernanceThresholds, getSpendClassThresholds } from "@/api/reference";

export default function Rules() {
  const { data: thresholds } = useQuery({
    queryKey: ["rules-thresholds"],
    queryFn: getSpendClassThresholds,
  });

  const { data: governance } = useQuery({
    queryKey: ["rules-governance"],
    queryFn: getGovernanceThresholds,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Rules & Thresholds</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Governance rules, escalation triggers, and spend class classification logic
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend Class Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Weighted Score Logic:</strong> Revenue (60%) + Order Frequency (25%) + Growth (15%)
              </p>
              <div className="flex gap-2">
                <Badge>Simple Thresholds</Badge>
                <Badge variant="outline">Weighted Score</Badge>
                <Badge variant="outline">Hybrid</Badge>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Revenue Range</TableHead>
                  <TableHead>Avg Revenue</TableHead>
                  <TableHead>Weeks Range</TableHead>
                  <TableHead>Avg Weeks</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholds?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><Badge>{t.class}</Badge></TableCell>
                    <TableCell>${Number(t.min_revenue).toLocaleString()} – ${Number(t.max_revenue).toLocaleString()}</TableCell>
                    <TableCell>${Number(t.avg_revenue).toLocaleString()}</TableCell>
                    <TableCell>{t.min_weeks} – {t.max_weeks}</TableCell>
                    <TableCell>{t.avg_weeks}</TableCell>
                    <TableCell>{t.growth_threshold}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Governance & Escalation Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Required Approvers</TableHead>
                  <TableHead>Escalation Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {governance?.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="capitalize text-sm">{g.request_type.replace(/_/g, " ")}</TableCell>
                    <TableCell><Badge variant="outline">{g.threshold_band}</Badge></TableCell>
                    <TableCell>
                      {g.threshold_min != null && g.threshold_max != null
                        ? `${g.threshold_min}% – ${g.threshold_max}%`
                        : g.threshold_min != null ? `> ${g.threshold_min}%` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {g.required_approvers?.map((a, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px]">{g.escalation_notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Business Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
              <strong className="text-destructive">Hard Stop:</strong> D → A spend class change is <strong>not allowed</strong>
            </div>
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-md">
              <strong>Escalation:</strong> D → B and any 2-level spend class change requires higher approvals
            </div>
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-md">
              <strong>Escalation:</strong> Deviations {">"} 3% off target by line item require RVP and SD approval
            </div>
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-md">
              <strong>Escalation:</strong> Market price changes {">"} 5% require DP review
            </div>
            <div className="p-3 bg-muted rounded-md">
              <strong>Principle:</strong> Spend class changes face the highest scrutiny — if the case is temporary or narrow, recommend deviation or override instead
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
