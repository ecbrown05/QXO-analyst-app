import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, FileText, GitCompare, DollarSign, Users, TrendingUp } from "lucide-react";
import { CaseIntakeForm } from "@/components/case/CaseIntakeForm";
import { CaseAnalysis } from "@/components/case/CaseAnalysis";

const REQUEST_TYPES = [
  {
    id: "existing_deviation" as const,
    title: "Existing Deviation",
    description: "Review a request to extend or deepen an existing customer deviation",
    icon: GitCompare,
    color: "text-primary",
  },
  {
    id: "new_deviation" as const,
    title: "New Deviation",
    description: "Evaluate a new deviation request for a customer without one",
    icon: FileText,
    color: "text-info",
  },
  {
    id: "spend_class_new" as const,
    title: "Spend Class — New Customer",
    description: "Assign a spend class to a new customer based on revenue, frequency, and growth",
    icon: Users,
    color: "text-success",
  },
  {
    id: "spend_class_existing" as const,
    title: "Spend Class — Existing Customer",
    description: "Evaluate a request to change an existing customer's spend class",
    icon: TrendingUp,
    color: "text-warning",
  },
  {
    id: "market_price_change" as const,
    title: "Market Price Change",
    description: "Review a request to adjust the market price for a SKU in a price zone",
    icon: DollarSign,
    color: "text-destructive",
  },
];

type RequestType = typeof REQUEST_TYPES[number]["id"];

export default function NewCase() {
  const [step, setStep] = useState<"select" | "intake" | "analysis">("select");
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [caseData, setCaseData] = useState<Record<string, unknown>>({});

  const handleTypeSelect = (type: RequestType) => {
    setSelectedType(type);
    setStep("intake");
  };

  const handleIntakeComplete = (data: Record<string, unknown>) => {
    setCaseData(data);
    setStep("analysis");
  };

  if (step === "select") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">New Case</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select the type of pricing request to begin analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REQUEST_TYPES.map((type) => (
            <Card
              key={type.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <type.icon className={cn("h-5 w-5", type.color)} />
                  <CardTitle className="text-base">{type.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
                <div className="mt-4 flex justify-end">
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (step === "intake" && selectedType) {
    return (
      <CaseIntakeForm
        requestType={selectedType}
        sourceText={sourceText}
        onSourceTextChange={setSourceText}
        onBack={() => setStep("select")}
        onComplete={handleIntakeComplete}
      />
    );
  }

  if (step === "analysis" && selectedType) {
    return (
      <CaseAnalysis
        requestType={selectedType}
        caseData={caseData}
        onBack={() => setStep("intake")}
      />
    );
  }

  return null;
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
