import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CASE_TYPE_LABELS: Record<string, string> = {
  existing_deviation: "Existing Deviation",
  new_deviation: "New Deviation",
  spend_class_new: "Spend Class (New)",
  spend_class_existing: "Spend Class (Existing)",
  market_price_change: "Market Price Change",
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cases").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleCopy = () => {
    if (!caseData) return;
    const lines = [
      `CASE: ${caseData.case_number}`,
      `Type: ${CASE_TYPE_LABELS[caseData.request_type] ?? caseData.request_type}`,
      `Customer: ${caseData.customer_name ?? "N/A"}`,
      `SKU: ${caseData.sku_code ?? "N/A"}`,
      `Requester: ${caseData.requester ?? "N/A"}`,
      `Branch/Region: ${caseData.branch ?? "N/A"} / ${caseData.region ?? "N/A"}`,
      "",
      "IMPACT:",
      `Discount: ${caseData.discount_percent != null ? caseData.discount_percent + "%" : "N/A"}`,
      `$/Unit Loss: ${caseData.dollar_loss_per_unit != null ? "$" + caseData.dollar_loss_per_unit.toFixed(2) : "N/A"}`,
      `Total Margin Loss: ${caseData.total_margin_loss != null ? "$" + Math.abs(caseData.total_margin_loss).toLocaleString() : "N/A"}`,
      "",
      `RECOMMENDATION: ${caseData.recommendation ? caseData.recommendation.replace("_", " ").toUpperCase() : "Pending"}`,
    ];
    if (caseData.recommendation_reasons) {
      lines.push("", "Why:", ...caseData.recommendation_reasons.map((r) => "• " + r));
    }
    if (caseData.required_approvers) {
      lines.push("", "Approvers: " + caseData.required_approvers.join(", "));
    }
    if (caseData.suggested_response) {
      lines.push("", "Suggested Response:", caseData.suggested_response);
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!caseData) return <div className="p-6 text-muted-foreground">Case not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cases")} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{caseData.case_number}</h1>
          <p className="text-sm text-muted-foreground">
            {CASE_TYPE_LABELS[caseData.request_type]} • {caseData.customer_name ?? "No customer"}
          </p>
        </div>
        <Badge variant={caseData.status === "completed" ? "default" : "outline"}>
          {caseData.status.replace("_", " ")}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "Copied" : "Copy Summary"}
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Case Summary</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-muted-foreground">Customer</dt><dd className="font-medium">{caseData.customer_name ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">SKU</dt><dd className="font-medium">{caseData.sku_code ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Requester</dt><dd className="font-medium">{caseData.requester ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Branch / Region</dt><dd className="font-medium">{caseData.branch ?? "—"} / {caseData.region ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Price Zone</dt><dd className="font-medium">{caseData.price_zone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Source</dt><dd className="font-medium">{caseData.source_type ?? "Manual"}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Calculated Impact</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Discount %</dt>
                <dd className="text-lg font-semibold">{caseData.discount_percent != null ? `${caseData.discount_percent}%` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">$/Unit Loss</dt>
                <dd className="text-lg font-semibold">{caseData.dollar_loss_per_unit != null ? `$${caseData.dollar_loss_per_unit.toFixed(2)}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total Margin Loss</dt>
                <dd className="text-lg font-semibold text-destructive">{caseData.total_margin_loss != null ? `$${Math.abs(caseData.total_margin_loss).toLocaleString()}` : "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {caseData.recommendation && (
          <Card>
            <CardHeader><CardTitle className="text-base">Recommendation</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Badge
                  className="text-base px-4 py-1"
                  variant={caseData.recommendation === "agree" ? "default" : caseData.recommendation === "push_back" ? "destructive" : "secondary"}
                >
                  {caseData.recommendation.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              {caseData.recommendation_reasons && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Why:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {caseData.recommendation_reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {caseData.required_approvers && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Required Approvers:</p>
                  <div className="flex flex-wrap gap-2">
                    {caseData.required_approvers.map((a, i) => <Badge key={i} variant="outline">{a}</Badge>)}
                  </div>
                </div>
              )}
              {caseData.suggested_response && (
                <div>
                  <p className="text-sm font-medium mb-2">Suggested Response:</p>
                  <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">{caseData.suggested_response}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
