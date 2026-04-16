import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { runAnalysis, type AnalysisResult } from "@/lib/analysis-engine";
import { createCase } from "@/api/cases";
import { useSignedInUser } from "@/auth/useSignedInUser";
import type { RequestType, SpendClass } from "../../../shared/domain";

interface CaseAnalysisProps {
  requestType: RequestType;
  caseData: Record<string, unknown>;
  onBack: () => void;
}

export function CaseAnalysis({ requestType, caseData, onBack }: CaseAnalysisProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSignedInUser();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = runAnalysis(requestType, caseData);

  const handleSave = async () => {
    setSaving(true);
    try {
      const caseNumber = `PRC-${Date.now().toString(36).toUpperCase()}`;
      await createCase({
        case_number: caseNumber,
        request_type: requestType,
        status: result.recommendation ? "completed" : "in_review",
        customer_name: str(caseData.customer_name),
        customer_id_ref: str(caseData.customer_id_ref),
        sku_code: str(caseData.sku_code),
        item_description: str(caseData.item_description),
        price_zone: str(caseData.price_zone),
        branch: str(caseData.branch),
        region: str(caseData.region),
        requester: str(caseData.requester),
        current_price: num(caseData.current_price),
        requested_price: num(caseData.requested_price),
        target_price: num(caseData.target_price),
        market_price: num(caseData.market_price),
        current_deviation_percent: num(caseData.current_deviation_percent),
        quantity: num(caseData.quantity),
        expected_revenue: num(caseData.expected_revenue),
        historical_revenue: num(caseData.historical_revenue),
        order_frequency: caseData.order_frequency ? parseInt(String(caseData.order_frequency)) : null,
        growth_rate: num(caseData.growth_rate),
        current_spend_class: caseData.current_spend_class as SpendClass | null ?? null,
        requested_spend_class: caseData.requested_spend_class as SpendClass | null ?? null,
        competitor_bid: str(caseData.competitor_bid),
        reason_for_request: str(caseData.reason_for_request),
        evidence_provided: str(caseData.evidence_provided),
        evidence_quality: result.evidenceQuality ?? null,
        source_text: str(caseData.source_text),
        source_type: str(caseData.source_type) ?? "manual",
        discount_percent: result.discountPercent ?? null,
        dollar_loss_per_unit: result.dollarLossPerUnit ?? null,
        total_margin_loss: result.totalMarginLoss ?? null,
        recommendation: result.recommendation ?? null,
        recommendation_reasons: result.reasons ?? null,
        required_approvers: result.approvers ?? null,
        suggested_response: result.suggestedResponse ?? null,
        analyst_notes: null,
        requested_deviation_percent: null,
        created_by: user?.email ?? user?.oid ?? null,
      });
      toast({ title: "Case saved", description: caseNumber });
      navigate("/cases");
    } catch (err) {
      toast({ title: "Error saving case", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const text = buildOutputText(requestType, caseData, result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Analysis & Recommendation</h1>
          <p className="text-sm text-muted-foreground">Review the analysis before saving</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Case"}
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Recommendation */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recommendation</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Badge
                className="text-lg px-5 py-1.5"
                variant={result.recommendation === "agree" ? "default" : result.recommendation === "push_back" ? "destructive" : "secondary"}
              >
                {result.recommendation?.replace("_", " ").toUpperCase() ?? "PENDING"}
              </Badge>
            </div>
            {result.reasons && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Calculated Impact */}
        <Card>
          <CardHeader><CardTitle className="text-base">Calculated Impact</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-6 text-sm">
              {result.discountPercent != null && (
                <div>
                  <dt className="text-muted-foreground">Discount %</dt>
                  <dd className="text-xl font-semibold">{result.discountPercent.toFixed(1)}%</dd>
                  <dd className="text-xs text-muted-foreground mt-1">{result.discountFormula}</dd>
                </div>
              )}
              {result.dollarLossPerUnit != null && (
                <div>
                  <dt className="text-muted-foreground">$/Unit Loss</dt>
                  <dd className="text-xl font-semibold">${result.dollarLossPerUnit.toFixed(2)}</dd>
                  <dd className="text-xs text-muted-foreground mt-1">{result.lossFormula}</dd>
                </div>
              )}
              {result.totalMarginLoss != null && (
                <div>
                  <dt className="text-muted-foreground">Total Margin Loss</dt>
                  <dd className="text-xl font-semibold text-destructive">${Math.abs(result.totalMarginLoss).toLocaleString()}</dd>
                  <dd className="text-xs text-muted-foreground mt-1">{result.totalFormula}</dd>
                </div>
              )}
            </dl>
            {result.spendClassResult && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">Spend Class: <Badge>{result.spendClassResult.recommendedClass}</Badge></p>
                <p className="text-muted-foreground">Confidence: {result.spendClassResult.confidence}</p>
                {result.spendClassResult.factors && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {result.spendClassResult.factors.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Governance */}
        {result.approvers && result.approvers.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Required Approvers</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.approvers.map((a, i) => <Badge key={i} variant="outline">{a}</Badge>)}
              </div>
              {result.escalationNotes && (
                <p className="text-sm text-warning mt-3">{result.escalationNotes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Suggested Response */}
        {result.suggestedResponse && (
          <Card>
            <CardHeader><CardTitle className="text-base">Suggested Response</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">{result.suggestedResponse}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function str(v: unknown): string | null {
  return v != null && String(v).trim() ? String(v).trim() : null;
}

function num(v: unknown): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function buildOutputText(type: RequestType, data: Record<string, unknown>, result: AnalysisResult): string {
  const lines = [
    `PRICING CASE ANALYSIS`,
    `Type: ${type.replace(/_/g, " ")}`,
    `Customer: ${data.customer_name ?? "N/A"}`,
    `SKU: ${data.sku_code ?? "N/A"}`,
    `Requester: ${data.requester ?? "N/A"}`,
    "",
    `RECOMMENDATION: ${result.recommendation?.replace("_", " ").toUpperCase() ?? "PENDING"}`,
  ];
  if (result.reasons) lines.push("", "Why:", ...result.reasons.map((r) => "• " + r));
  if (result.discountPercent != null) lines.push("", `Discount: ${result.discountPercent.toFixed(1)}%`);
  if (result.totalMarginLoss != null) lines.push(`Total Margin Loss: $${Math.abs(result.totalMarginLoss).toLocaleString()}`);
  if (result.approvers) lines.push("", `Approvers: ${result.approvers.join(", ")}`);
  if (result.suggestedResponse) lines.push("", "Suggested Response:", result.suggestedResponse);
  return lines.join("\n");
}
