import type { Database } from "@/integrations/supabase/types";

type RequestType = Database["public"]["Enums"]["request_type"];
type RecommendationType = Database["public"]["Enums"]["recommendation_type"];
type SpendClass = Database["public"]["Enums"]["spend_class"];

export interface SpendClassResult {
  recommendedClass: SpendClass;
  confidence: "high" | "medium" | "low";
  factors: string[];
}

export interface AnalysisResult {
  recommendation: RecommendationType | null;
  reasons: string[];
  discountPercent: number | null;
  dollarLossPerUnit: number | null;
  totalMarginLoss: number | null;
  discountFormula: string | null;
  lossFormula: string | null;
  totalFormula: string | null;
  approvers: string[];
  escalationNotes: string | null;
  evidenceQuality: string | null;
  suggestedResponse: string | null;
  spendClassResult: SpendClassResult | null;
}

export function runAnalysis(requestType: RequestType, data: Record<string, unknown>): AnalysisResult {
  switch (requestType) {
    case "existing_deviation": return analyzeExistingDeviation(data);
    case "new_deviation": return analyzeNewDeviation(data);
    case "spend_class_new": return analyzeSpendClassNew(data);
    case "spend_class_existing": return analyzeSpendClassExisting(data);
    case "market_price_change": return analyzeMarketPriceChange(data);
    default: return emptyResult();
  }
}

function analyzeExistingDeviation(d: Record<string, unknown>): AnalysisResult {
  const targetPrice = n(d.target_price);
  const requestedPrice = n(d.requested_price);
  const quantity = n(d.quantity);
  const currentDevPct = n(d.current_deviation_percent);

  const result = emptyResult();

  if (targetPrice && requestedPrice) {
    const discountPct = ((targetPrice - requestedPrice) / targetPrice) * 100;
    const lossPerUnit = targetPrice - requestedPrice;
    const totalLoss = lossPerUnit * (quantity ?? 1);

    result.discountPercent = discountPct;
    result.dollarLossPerUnit = lossPerUnit;
    result.totalMarginLoss = totalLoss;
    result.discountFormula = `(Target $${targetPrice} - Requested $${requestedPrice}) / Target $${targetPrice} × 100`;
    result.lossFormula = `Target $${targetPrice} - Requested $${requestedPrice}`;
    result.totalFormula = `$${lossPerUnit.toFixed(2)} × ${quantity ?? 1} units`;

    // Governance
    if (discountPct > 3) {
      result.approvers = ["RVP", "Sales Director"];
      result.escalationNotes = `Discount of ${discountPct.toFixed(1)}% exceeds 3% threshold — RVP and SD approval required`;
    } else {
      result.approvers = ["Pricing Manager"];
    }

    // Recommendation logic
    const hasEvidence = Boolean(d.competitor_bid || d.evidence_provided);
    const isDeeperThanCurrent = currentDevPct != null && discountPct > currentDevPct;

    if (!hasEvidence && isDeeperThanCurrent) {
      result.recommendation = "push_back";
      result.reasons = [
        "No evidence of competitive pressure or business case provided",
        `Requested discount (${discountPct.toFixed(1)}%) is deeper than current deviation (${currentDevPct}%)`,
        "Recommend maintaining current deviation level",
      ];
    } else if (discountPct > 5) {
      result.recommendation = "escalate";
      result.reasons = [
        `Significant discount of ${discountPct.toFixed(1)}% below target`,
        `Total margin loss of $${totalLoss.toLocaleString()}`,
        "Requires senior leadership review",
      ];
    } else {
      result.recommendation = "agree";
      result.reasons = [
        `Discount of ${discountPct.toFixed(1)}% is within acceptable range`,
        `Margin impact of $${totalLoss.toLocaleString()} is manageable`,
      ];
      if (hasEvidence) result.reasons.push("Supporting evidence provided");
    }
  }

  result.suggestedResponse = generateResponse(result, d);
  return result;
}

function analyzeNewDeviation(d: Record<string, unknown>): AnalysisResult {
  const marketPrice = n(d.market_price);
  const requestedPrice = n(d.requested_price);
  const quantity = n(d.quantity);
  const expectedRevenue = n(d.expected_revenue);

  const result = emptyResult();

  if (marketPrice && requestedPrice) {
    const discountPct = ((marketPrice - requestedPrice) / marketPrice) * 100;
    const lossPerUnit = marketPrice - requestedPrice;
    const totalLoss = lossPerUnit * (quantity ?? 1);

    result.discountPercent = discountPct;
    result.dollarLossPerUnit = lossPerUnit;
    result.totalMarginLoss = totalLoss;
    result.discountFormula = `(Market $${marketPrice} - Requested $${requestedPrice}) / Market $${marketPrice} × 100`;
    result.lossFormula = `Market $${marketPrice} - Requested $${requestedPrice}`;
    result.totalFormula = `$${lossPerUnit.toFixed(2)} × ${quantity ?? 1} units`;

    const hasEvidence = Boolean(d.competitor_bid || d.evidence_provided);
    const isSmallRevenue = expectedRevenue != null && expectedRevenue < 50000;

    if (discountPct > 3) {
      result.approvers = ["RVP", "Sales Director"];
      result.escalationNotes = `Discount of ${discountPct.toFixed(1)}% exceeds 3% threshold`;
    } else {
      result.approvers = ["Pricing Manager"];
    }

    if (isSmallRevenue) {
      result.recommendation = "push_back";
      result.reasons = [
        `Expected revenue of $${expectedRevenue!.toLocaleString()} is too small to justify a permanent deviation`,
        "Recommend using market price for this customer",
        "Deviation should be reserved for strategic accounts with significant volume",
      ];
    } else if (!hasEvidence) {
      result.recommendation = "push_back";
      result.reasons = [
        "No documented competitor bid or credible evidence of competitive pressure",
        "New deviations require tangible evidence — high bar for permanent pricing concessions",
        "Request field team to provide documented competitive intelligence",
      ];
    } else if (discountPct > 5) {
      result.recommendation = "escalate";
      result.reasons = [
        `Large discount of ${discountPct.toFixed(1)}% below market price`,
        `Total margin impact of $${totalLoss.toLocaleString()}`,
        "Requires escalation to senior leadership for approval",
      ];
    } else {
      result.recommendation = "agree";
      result.reasons = [
        `Discount of ${discountPct.toFixed(1)}% below market is within range`,
        "Competitive evidence supports the request",
        `Expected revenue of $${(expectedRevenue ?? 0).toLocaleString()} justifies the concession`,
      ];
    }
  }

  result.suggestedResponse = generateResponse(result, d);
  return result;
}

function analyzeSpendClassNew(d: Record<string, unknown>): AnalysisResult {
  const revenue = n(d.expected_revenue) ?? 0;
  const frequency = n(d.order_frequency) ?? 0;
  const growth = n(d.growth_rate) ?? 0;

  const result = emptyResult();

  // Weighted score: Revenue 60%, Frequency 25%, Growth 15%
  const revenueScore = scoreRevenue(revenue);
  const freqScore = scoreFrequency(frequency);
  const growthScore = scoreGrowth(growth);
  const weightedScore = revenueScore * 0.6 + freqScore * 0.25 + growthScore * 0.15;

  const recommendedClass = classFromScore(weightedScore);
  const confidence = getConfidence(weightedScore);

  result.spendClassResult = {
    recommendedClass,
    confidence,
    factors: [
      `Revenue: $${revenue.toLocaleString()} → score ${revenueScore.toFixed(1)} (weight 60%)`,
      `Order frequency: ${frequency} weeks → score ${freqScore.toFixed(1)} (weight 25%)`,
      `Growth: ${growth}% → score ${growthScore.toFixed(1)} (weight 15%)`,
      `Weighted score: ${weightedScore.toFixed(2)} → Class ${recommendedClass}`,
    ],
  };

  result.recommendation = "agree";
  result.reasons = [
    `Recommended spend class: ${recommendedClass}`,
    `Based on weighted score of ${weightedScore.toFixed(2)}`,
    confidence === "medium" ? "Near class boundary — analyst should validate" : `Confidence: ${confidence}`,
  ];
  result.approvers = ["Pricing Manager"];

  result.suggestedResponse = `Based on the customer profile (Revenue: $${revenue.toLocaleString()}, Order Frequency: ${frequency} weeks/year, Growth: ${growth}%), the recommended spend class assignment is Class ${recommendedClass} with ${confidence} confidence.`;
  return result;
}

function analyzeSpendClassExisting(d: Record<string, unknown>): AnalysisResult {
  const currentClass = s(d.current_spend_class) as SpendClass | null;
  const requestedClass = s(d.requested_spend_class) as SpendClass | null;
  const revenue = n(d.expected_revenue) ?? 0;
  const frequency = n(d.order_frequency) ?? 0;
  const growth = n(d.growth_rate) ?? 0;

  const result = emptyResult();
  const classOrder: SpendClass[] = ["D", "C", "B", "A"];

  if (currentClass && requestedClass) {
    const currentIdx = classOrder.indexOf(currentClass);
    const requestedIdx = classOrder.indexOf(requestedClass);
    const levels = requestedIdx - currentIdx;

    // Hard stop: D → A
    if (currentClass === "D" && requestedClass === "A") {
      result.recommendation = "push_back";
      result.reasons = [
        "D → A spend class change is not allowed per governance policy",
        "Maximum allowed change is incremental or 1-level at a time",
        "Recommend starting with a D → C change if metrics support it",
      ];
      result.approvers = [];
      result.escalationNotes = "HARD STOP: D → A not permitted";
      result.suggestedResponse = `The requested spend class change from D to A is not permitted under current governance policy. D → A changes are a hard stop. Please consider an incremental approach (D → C first) if the customer's metrics support it.`;
      return result;
    }

    // D → B or 2-level change
    if ((currentClass === "D" && requestedClass === "B") || levels >= 2) {
      result.approvers = ["RVP", "Sales VP", "Pricing Director"];
      result.escalationNotes = levels >= 2 ? "2-level spend class change requires higher approvals" : "D → B change requires higher approvals";
    } else {
      result.approvers = ["Pricing Manager", "RVP"];
    }

    // Score the customer
    const revenueScore = scoreRevenue(revenue);
    const freqScore = scoreFrequency(frequency);
    const growthScore = scoreGrowth(growth);
    const weightedScore = revenueScore * 0.6 + freqScore * 0.25 + growthScore * 0.15;
    const metricsClass = classFromScore(weightedScore);

    result.spendClassResult = {
      recommendedClass: metricsClass,
      confidence: getConfidence(weightedScore),
      factors: [
        `Revenue: $${revenue.toLocaleString()} → score ${revenueScore.toFixed(1)}`,
        `Frequency: ${frequency} weeks → score ${freqScore.toFixed(1)}`,
        `Growth: ${growth}% → score ${growthScore.toFixed(1)}`,
        `Weighted score: ${weightedScore.toFixed(2)} → metrics support Class ${metricsClass}`,
        `Requested: ${requestedClass}, Current: ${currentClass} (${levels}-level change)`,
      ],
    };

    if (metricsClass !== requestedClass) {
      result.recommendation = "push_back";
      result.reasons = [
        `Customer metrics support Class ${metricsClass}, not the requested Class ${requestedClass}`,
        "Spend class changes face the highest scrutiny",
        "If the business case is temporary, recommend a deviation or override instead",
      ];
    } else {
      result.recommendation = levels >= 2 ? "escalate" : "agree";
      result.reasons = [
        `Customer metrics support Class ${requestedClass}`,
        `Weighted score of ${weightedScore.toFixed(2)} aligns with requested class`,
        levels >= 2 ? `${levels}-level change requires senior leadership approval` : "1-level change within normal escalation path",
      ];
    }
  }

  result.suggestedResponse = generateResponse(result, d);
  return result;
}

function analyzeMarketPriceChange(d: Record<string, unknown>): AnalysisResult {
  const currentPrice = n(d.current_price);
  const requestedPrice = n(d.requested_price);
  const quantity = n(d.quantity);

  const result = emptyResult();

  if (currentPrice && requestedPrice) {
    const changePct = ((currentPrice - requestedPrice) / currentPrice) * 100;
    const impactPerUnit = currentPrice - requestedPrice;
    const totalLoss = Math.abs(impactPerUnit) * (quantity ?? 1);

    result.discountPercent = changePct;
    result.dollarLossPerUnit = impactPerUnit;
    result.totalMarginLoss = totalLoss;
    result.discountFormula = `(Current $${currentPrice} - Requested $${requestedPrice}) / Current $${currentPrice} × 100`;
    result.lossFormula = `Current $${currentPrice} - Requested $${requestedPrice}`;
    result.totalFormula = `$${Math.abs(impactPerUnit).toFixed(2)} × ${quantity ?? 1} units`;

    const hasEvidence = Boolean(d.evidence_provided);

    if (Math.abs(changePct) > 5) {
      result.approvers = ["Director of Pricing", "RVP", "Sales VP"];
      result.escalationNotes = `Price change of ${Math.abs(changePct).toFixed(1)}% exceeds 5% threshold — DP review required`;
    } else {
      result.approvers = ["Pricing Manager"];
    }

    if (!hasEvidence) {
      result.recommendation = "push_back";
      result.reasons = [
        "No override evidence provided",
        "Market price changes require evidence of genuine pricing mistake or broad pattern",
        "Very high bar — short-term changes only approved for genuine mistakes",
      ];
    } else if (Math.abs(changePct) > 5) {
      result.recommendation = "escalate";
      result.reasons = [
        `Significant market price change of ${Math.abs(changePct).toFixed(1)}%`,
        `Total margin impact of $${totalLoss.toLocaleString()}`,
        "Requires Director of Pricing review",
        "Long-term changes should be supported by high override rates across multiple price zones",
      ];
    } else {
      result.recommendation = "agree";
      result.reasons = [
        `Price change of ${Math.abs(changePct).toFixed(1)}% is within acceptable range`,
        "Override evidence supports the adjustment",
      ];
    }
  }

  result.suggestedResponse = generateResponse(result, d);
  return result;
}

// Scoring helpers
function scoreRevenue(rev: number): number {
  if (rev >= 650000) return 4;
  if (rev >= 250000) return 3;
  if (rev >= 100000) return 2;
  return 1;
}

function scoreFrequency(weeks: number): number {
  if (weeks >= 40) return 4;
  if (weeks >= 22) return 3;
  if (weeks >= 8) return 2;
  return 1;
}

function scoreGrowth(growth: number): number {
  if (growth >= 15) return 4;
  if (growth >= 8) return 3;
  if (growth >= 3) return 2;
  return 1;
}

function classFromScore(score: number): SpendClass {
  if (score >= 3.5) return "A";
  if (score >= 2.5) return "B";
  if (score >= 1.5) return "C";
  return "D";
}

function getConfidence(score: number): "high" | "medium" | "low" {
  const remainder = score % 1;
  if (remainder > 0.3 && remainder < 0.7) return "medium";
  return "high";
}

function generateResponse(result: AnalysisResult, data: Record<string, unknown>): string {
  const customer = s(data.customer_name) ?? "the customer";
  if (!result.recommendation) return "";
  if (result.recommendation === "agree") {
    return `Thank you for the pricing request for ${customer}. After reviewing the details and supporting evidence, we are aligned with the request. ${result.approvers.length > 0 ? `This has been routed to ${result.approvers.join(", ")} for final approval.` : ""}`;
  }
  if (result.recommendation === "push_back") {
    return `Thank you for the pricing request for ${customer}. After reviewing the details, we are unable to support the request as submitted.\n\nKey concerns:\n${result.reasons.map((r) => "• " + r).join("\n")}\n\nPlease provide additional documentation or consider the alternative approach recommended above.`;
  }
  return `Thank you for the pricing request for ${customer}. This request requires escalation to senior leadership for review.\n\nKey factors:\n${result.reasons.map((r) => "• " + r).join("\n")}\n\nThis has been routed to ${result.approvers.join(", ")} for review and approval.`;
}

function n(v: unknown): number | null {
  if (v == null || String(v).trim() === "") return null;
  const num = parseFloat(String(v));
  return isNaN(num) ? null : num;
}

function s(v: unknown): string | null {
  return v != null && String(v).trim() ? String(v).trim() : null;
}

function emptyResult(): AnalysisResult {
  return {
    recommendation: null,
    reasons: [],
    discountPercent: null,
    dollarLossPerUnit: null,
    totalMarginLoss: null,
    discountFormula: null,
    lossFormula: null,
    totalFormula: null,
    approvers: [],
    escalationNotes: null,
    evidenceQuality: null,
    suggestedResponse: null,
    spendClassResult: null,
  };
}
