export type RequestType =
  | "existing_deviation"
  | "new_deviation"
  | "spend_class_new"
  | "spend_class_existing"
  | "market_price_change";

export type SpendClass = "A" | "B" | "C" | "D";
export type CaseStatus = "draft" | "in_review" | "completed" | "escalated" | "blocked";
export type RecommendationType = "agree" | "push_back" | "escalate";

export interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
  current_spend_class: SpendClass;
  branch: string;
  region: string;
  annual_revenue: number;
  weeks_ordered: number;
  growth_rate: number;
  account_status: string;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sku {
  id: string;
  sku_code: string;
  description: string;
  category: string;
  unit_of_measure: string;
  created_at: string;
}

export interface MarketPriceRecord {
  sku_id: string;
  sku_code: string;
  price_zone: string;
  spend_class: SpendClass;
  market_price: number;
  effective_date: string;
  created_at?: string;
}

export interface SpendClassThreshold {
  id: string;
  class: SpendClass;
  min_revenue: number;
  max_revenue: number;
  avg_revenue: number;
  min_weeks: number;
  max_weeks: number;
  avg_weeks: number;
  growth_threshold: number;
  weighted_score_min: number | null;
  weighted_score_max: number | null;
  created_at: string;
  updated_at: string;
}

export interface GovernanceThreshold {
  id: string;
  request_type: RequestType;
  threshold_band: string;
  threshold_min: number | null;
  threshold_max: number | null;
  required_approvers: string[];
  escalation_notes: string | null;
  created_at: string;
}

export interface CaseRecord {
  id: string;
  case_number: string;
  request_type: RequestType;
  status: CaseStatus;
  customer_name: string | null;
  customer_id_ref: string | null;
  sku_code: string | null;
  item_description: string | null;
  price_zone: string | null;
  branch: string | null;
  region: string | null;
  requester: string | null;
  current_price: number | null;
  requested_price: number | null;
  target_price: number | null;
  market_price: number | null;
  current_deviation_percent: number | null;
  requested_deviation_percent: number | null;
  quantity: number | null;
  expected_revenue: number | null;
  historical_revenue: number | null;
  order_frequency: number | null;
  growth_rate: number | null;
  current_spend_class: SpendClass | null;
  requested_spend_class: SpendClass | null;
  competitor_bid: string | null;
  reason_for_request: string | null;
  evidence_provided: string | null;
  evidence_quality: string | null;
  source_type: string | null;
  source_text: string | null;
  discount_percent: number | null;
  dollar_loss_per_unit: number | null;
  total_margin_loss: number | null;
  recommendation: RecommendationType | null;
  recommendation_reasons: string[] | null;
  required_approvers: string[] | null;
  suggested_response: string | null;
  analyst_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CaseSummary {
  id: string;
  case_number: string;
  request_type: RequestType;
  status: CaseStatus;
  customer_name: string | null;
  requester: string | null;
  recommendation: RecommendationType | null;
  total_margin_loss: number | null;
  created_at: string;
  updated_at: string;
}

export interface CaseAuditEntry {
  id: string;
  case_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface ParseIntakeResponse {
  fields: Record<string, string | null>;
}

export interface ReferenceDataBundle {
  customers: Customer[];
  skus: Sku[];
  spendClassThresholds: SpendClassThreshold[];
  governanceThresholds: GovernanceThreshold[];
}

export interface UserProfileSummary {
  oid: string;
  name: string;
  email: string;
}
