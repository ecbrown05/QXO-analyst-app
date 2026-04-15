
-- Create enum types
CREATE TYPE public.spend_class AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE public.request_type AS ENUM ('existing_deviation', 'new_deviation', 'spend_class_new', 'spend_class_existing', 'market_price_change');
CREATE TYPE public.case_status AS ENUM ('draft', 'in_review', 'completed', 'escalated', 'blocked');
CREATE TYPE public.recommendation_type AS ENUM ('agree', 'push_back', 'escalate');

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  current_spend_class spend_class NOT NULL DEFAULT 'D',
  branch TEXT NOT NULL,
  region TEXT NOT NULL,
  annual_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  weeks_ordered INTEGER NOT NULL DEFAULT 0,
  growth_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  account_status TEXT NOT NULL DEFAULT 'active',
  is_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SKUs table
CREATE TABLE public.skus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'EA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Target prices
CREATE TABLE public.target_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  price_zone TEXT NOT NULL,
  target_price NUMERIC(10,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sku_id, price_zone)
);

-- Market prices
CREATE TABLE public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  price_zone TEXT NOT NULL,
  spend_class spend_class NOT NULL,
  market_price NUMERIC(10,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sku_id, price_zone, spend_class)
);

-- Existing deviations
CREATE TABLE public.deviations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  deviation_percent NUMERIC(5,2) NOT NULL,
  deviation_price NUMERIC(10,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, sku_id)
);

-- Spend class thresholds
CREATE TABLE public.spend_class_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class spend_class NOT NULL UNIQUE,
  min_revenue NUMERIC(12,2) NOT NULL,
  max_revenue NUMERIC(12,2) NOT NULL,
  avg_revenue NUMERIC(12,2) NOT NULL,
  min_weeks INTEGER NOT NULL,
  max_weeks INTEGER NOT NULL,
  avg_weeks INTEGER NOT NULL,
  growth_threshold NUMERIC(5,2) NOT NULL DEFAULT 0,
  weighted_score_min NUMERIC(5,2),
  weighted_score_max NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Governance thresholds
CREATE TABLE public.governance_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type request_type NOT NULL,
  threshold_band TEXT NOT NULL,
  threshold_min NUMERIC(5,2),
  threshold_max NUMERIC(5,2),
  required_approvers TEXT[] NOT NULL,
  escalation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_type, threshold_band)
);

-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  request_type request_type NOT NULL,
  status case_status NOT NULL DEFAULT 'draft',
  customer_name TEXT,
  customer_id_ref TEXT,
  sku_code TEXT,
  item_description TEXT,
  price_zone TEXT,
  branch TEXT,
  region TEXT,
  requester TEXT,
  current_price NUMERIC(10,2),
  requested_price NUMERIC(10,2),
  target_price NUMERIC(10,2),
  market_price NUMERIC(10,2),
  current_deviation_percent NUMERIC(5,2),
  requested_deviation_percent NUMERIC(5,2),
  quantity NUMERIC(12,2),
  expected_revenue NUMERIC(12,2),
  historical_revenue NUMERIC(12,2),
  order_frequency INTEGER,
  growth_rate NUMERIC(5,2),
  current_spend_class spend_class,
  requested_spend_class spend_class,
  competitor_bid TEXT,
  reason_for_request TEXT,
  evidence_provided TEXT,
  evidence_quality TEXT,
  source_type TEXT,
  source_text TEXT,
  discount_percent NUMERIC(5,2),
  dollar_loss_per_unit NUMERIC(10,2),
  total_margin_loss NUMERIC(12,2),
  recommendation recommendation_type,
  recommendation_reasons TEXT[],
  required_approvers TEXT[],
  suggested_response TEXT,
  analyst_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case audit log
CREATE TABLE public.case_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by TEXT DEFAULT 'analyst',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spend_class_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_audit_log ENABLE ROW LEVEL SECURITY;

-- Phase 1: open access (no auth yet)
CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to skus" ON public.skus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to target_prices" ON public.target_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to market_prices" ON public.market_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to deviations" ON public.deviations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to spend_class_thresholds" ON public.spend_class_thresholds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to governance_thresholds" ON public.governance_thresholds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cases" ON public.cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to case_audit_log" ON public.case_audit_log FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_customers_customer_id ON public.customers(customer_id);
CREATE INDEX idx_customers_spend_class ON public.customers(current_spend_class);
CREATE INDEX idx_target_prices_sku ON public.target_prices(sku_id);
CREATE INDEX idx_market_prices_sku ON public.market_prices(sku_id);
CREATE INDEX idx_deviations_customer ON public.deviations(customer_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_request_type ON public.cases(request_type);
CREATE INDEX idx_case_audit_log_case ON public.case_audit_log(case_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_spend_class_thresholds_updated_at BEFORE UPDATE ON public.spend_class_thresholds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
