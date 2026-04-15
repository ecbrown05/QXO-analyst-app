import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, AlertTriangle, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type RequestType = Database["public"]["Enums"]["request_type"];
type SpendClass = Database["public"]["Enums"]["spend_class"];

interface CaseIntakeFormProps {
  requestType: RequestType;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onBack: () => void;
  onComplete: (data: Record<string, unknown>) => void;
}

const REQUIRED_FIELDS: Record<RequestType, string[]> = {
  existing_deviation: ["customer_name", "sku_code", "target_price", "requested_price", "quantity", "requester"],
  new_deviation: ["customer_name", "sku_code", "market_price", "requested_price", "expected_revenue", "quantity", "requester"],
  spend_class_new: ["customer_name", "expected_revenue", "order_frequency", "growth_rate", "requester"],
  spend_class_existing: ["customer_name", "current_spend_class", "requested_spend_class", "expected_revenue", "order_frequency", "growth_rate", "requester"],
  market_price_change: ["sku_code", "current_price", "requested_price", "price_zone", "quantity", "requester"],
};

const TYPE_TITLES: Record<RequestType, string> = {
  existing_deviation: "Existing Deviation Review",
  new_deviation: "New Deviation Review",
  spend_class_new: "Spend Class — New Customer",
  spend_class_existing: "Spend Class — Existing Customer",
  market_price_change: "Market Price Change",
};

export function CaseIntakeForm({ requestType, sourceText, onSourceTextChange, onBack, onComplete }: CaseIntakeFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"source" | "form">("source");
  const [parsing, setParsing] = useState(false);

  const set = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const requiredFields = REQUIRED_FIELDS[requestType];
  const missingFields = requiredFields.filter((f) => !formData[f]?.trim());

  const handleProceedToForm = async () => {
    if (sourceText.trim()) {
      setParsing(true);
      try {
        const { data, error } = await supabase.functions.invoke("parse-intake", {
          body: { source_text: sourceText, request_type: requestType },
        });
        if (!error && data?.fields) {
          const extracted = data.fields as Record<string, string | null>;
          setFormData((prev) => {
            const merged = { ...prev };
            for (const [key, val] of Object.entries(extracted)) {
              if (val != null && val !== "" && !prev[key]?.trim()) {
                merged[key] = String(val);
              }
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn("Auto-fill extraction failed, proceeding with blank form:", err);
      } finally {
        setParsing(false);
      }
    }
    setStep("form");
  };

  const handleSubmit = () => {
    if (missingFields.length > 0) {
      toast({ title: "Missing required fields", description: missingFields.join(", "), variant: "destructive" });
      return;
    }
    onComplete({ ...formData, source_text: sourceText });
  };

  if (step === "source") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-semibold">{TYPE_TITLES[requestType]}</h1>
            <p className="text-sm text-muted-foreground">Step 1: Provide source material</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Intake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste email text, Teams/chat messages, or type the request details manually. You can also upload files.
            </p>
            <Textarea
              placeholder="Paste email, chat message, or type request details here..."
              value={sourceText}
              onChange={(e) => onSourceTextChange(e.target.value)}
              className="min-h-[200px]"
            />
            <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-sm">Drag & drop files here or click to upload (Excel, CSV, screenshots)</span>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleProceedToForm} disabled={parsing}>
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Extracting fields...
                  </>
                ) : (
                  <>
                    Continue to Form <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setStep("source")} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-semibold">{TYPE_TITLES[requestType]}</h1>
          <p className="text-sm text-muted-foreground">Step 2: Review and complete required fields</p>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/5 border border-destructive/20 rounded-md text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{missingFields.length} required field(s) missing: {missingFields.join(", ")}</span>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Common fields */}
          {requestType !== "market_price_change" && (
            <FieldRow label="Customer Name" field="customer_name" required value={formData.customer_name} onChange={set} />
          )}
          {["existing_deviation", "new_deviation", "market_price_change"].includes(requestType) && (
            <FieldRow label="SKU / Item" field="sku_code" required value={formData.sku_code} onChange={set} />
          )}
          <FieldRow label="Requester" field="requester" required value={formData.requester} onChange={set} />
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Branch" field="branch" value={formData.branch} onChange={set} />
            <FieldRow label="Region" field="region" value={formData.region} onChange={set} />
          </div>
          <FieldRow label="Price Zone" field="price_zone" value={formData.price_zone} onChange={set}
            required={requestType === "market_price_change"} />

          {/* Pricing fields */}
          {requestType === "existing_deviation" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Target Price ($)" field="target_price" required type="number" value={formData.target_price} onChange={set} />
                <FieldRow label="Requested Price ($)" field="requested_price" required type="number" value={formData.requested_price} onChange={set} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Current Deviation %" field="current_deviation_percent" type="number" value={formData.current_deviation_percent} onChange={set} />
                <FieldRow label="Quantity" field="quantity" required type="number" value={formData.quantity} onChange={set} />
              </div>
            </>
          )}

          {requestType === "new_deviation" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Market Price ($)" field="market_price" required type="number" value={formData.market_price} onChange={set} />
                <FieldRow label="Requested Price ($)" field="requested_price" required type="number" value={formData.requested_price} onChange={set} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Expected Revenue ($)" field="expected_revenue" required type="number" value={formData.expected_revenue} onChange={set} />
                <FieldRow label="Quantity" field="quantity" required type="number" value={formData.quantity} onChange={set} />
              </div>
              <FieldRow label="Competitor Bid / Evidence" field="competitor_bid" value={formData.competitor_bid} onChange={set} />
            </>
          )}

          {requestType === "spend_class_new" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Expected Annual Revenue ($)" field="expected_revenue" required type="number" value={formData.expected_revenue} onChange={set} />
                <FieldRow label="Order Frequency (weeks/year)" field="order_frequency" required type="number" value={formData.order_frequency} onChange={set} />
              </div>
              <FieldRow label="Growth Rate (%)" field="growth_rate" required type="number" value={formData.growth_rate} onChange={set} />
            </>
          )}

          {requestType === "spend_class_existing" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">
                    Current Spend Class <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.current_spend_class ?? ""} onValueChange={(v) => set("current_spend_class", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(["A", "B", "C", "D"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">
                    Requested Spend Class <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.requested_spend_class ?? ""} onValueChange={(v) => set("requested_spend_class", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(["A", "B", "C", "D"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FieldRow label="Annual Revenue ($)" field="expected_revenue" required type="number" value={formData.expected_revenue} onChange={set} />
                <FieldRow label="Order Frequency" field="order_frequency" required type="number" value={formData.order_frequency} onChange={set} />
                <FieldRow label="Growth Rate (%)" field="growth_rate" required type="number" value={formData.growth_rate} onChange={set} />
              </div>
            </>
          )}

          {requestType === "market_price_change" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Current Market Price ($)" field="current_price" required type="number" value={formData.current_price} onChange={set} />
                <FieldRow label="Requested Market Price ($)" field="requested_price" required type="number" value={formData.requested_price} onChange={set} />
              </div>
              <FieldRow label="Quantity / Revenue Basis" field="quantity" required type="number" value={formData.quantity} onChange={set} />
              <FieldRow label="Override Evidence" field="evidence_provided" value={formData.evidence_provided} onChange={set} />
            </>
          )}

          {/* Common evidence/reason */}
          <FieldRow label="Reason for Request" field="reason_for_request" value={formData.reason_for_request} onChange={set} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setStep("source")}>Back</Button>
            <Button onClick={handleSubmit} disabled={missingFields.length > 0}>
              Run Analysis <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldRow({
  label, field, value, onChange, required, type = "text",
}: {
  label: string; field: string; value?: string; onChange: (f: string, v: string) => void;
  required?: boolean; type?: string;
}) {
  const isMissing = required && !value?.trim();
  return (
    <div>
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        className={isMissing ? "border-destructive/50 bg-destructive/5" : ""}
      />
    </div>
  );
}
