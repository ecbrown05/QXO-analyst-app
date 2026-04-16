-- Starter seed data for local/prototype setup.
-- Safe to run multiple times because inserts use upsert patterns where possible.

-- Spend class thresholds
insert into public.spend_class_thresholds (
  class,
  min_revenue,
  max_revenue,
  avg_revenue,
  min_weeks,
  max_weeks,
  avg_weeks,
  growth_threshold,
  weighted_score_min,
  weighted_score_max
)
values
  ('A', 650000, 5000000, 1200000, 40, 52, 46, 15, 3.5, 4.0),
  ('B', 250000, 649999, 400000, 22, 39, 30, 8, 2.5, 3.49),
  ('C', 100000, 249999, 150000, 8, 21, 14, 3, 1.5, 2.49),
  ('D', 0, 99999, 50000, 0, 7, 4, 0, 0.0, 1.49)
on conflict (class) do update
set
  min_revenue = excluded.min_revenue,
  max_revenue = excluded.max_revenue,
  avg_revenue = excluded.avg_revenue,
  min_weeks = excluded.min_weeks,
  max_weeks = excluded.max_weeks,
  avg_weeks = excluded.avg_weeks,
  growth_threshold = excluded.growth_threshold,
  weighted_score_min = excluded.weighted_score_min,
  weighted_score_max = excluded.weighted_score_max;

-- Governance thresholds
insert into public.governance_thresholds (
  request_type,
  threshold_band,
  threshold_min,
  threshold_max,
  required_approvers,
  escalation_notes
)
values
  ('existing_deviation', 'standard', 0, 3, array['Pricing Manager'], 'Standard approval path for deviations up to 3% off target.'),
  ('existing_deviation', 'escalation', 3.01, null, array['RVP', 'Sales Director'], 'Deviations above 3% require RVP and Sales Director approval.'),
  ('new_deviation', 'standard', 0, 3, array['Pricing Manager'], 'New deviations up to 3% can follow the standard review path with evidence.'),
  ('new_deviation', 'escalation', 3.01, null, array['RVP', 'Sales Director'], 'New deviations above 3% require escalation.'),
  ('spend_class_new', 'standard', null, null, array['Pricing Manager'], 'New customer spend class assignment follows the weighted score model.'),
  ('spend_class_existing', 'standard', null, null, array['Pricing Manager', 'RVP'], 'Existing customer spend class changes require business justification.'),
  ('spend_class_existing', 'escalation', null, null, array['RVP', 'Sales VP', 'Pricing Director'], 'D to B and any two-level spend class change requires senior approval.'),
  ('market_price_change', 'standard', 0, 5, array['Pricing Manager'], 'Market price changes up to 5% can follow the standard review path.'),
  ('market_price_change', 'escalation', 5.01, null, array['Director of Pricing', 'RVP', 'Sales VP'], 'Market price changes above 5% require Director of Pricing review.')
on conflict (request_type, threshold_band) do update
set
  threshold_min = excluded.threshold_min,
  threshold_max = excluded.threshold_max,
  required_approvers = excluded.required_approvers,
  escalation_notes = excluded.escalation_notes;

-- Customers
insert into public.customers (
  customer_id,
  customer_name,
  current_spend_class,
  branch,
  region,
  annual_revenue,
  weeks_ordered,
  growth_rate,
  account_status,
  is_new
)
values
  ('CUST-1001', 'Acme Builders Supply', 'A', 'Seattle', 'West', 1250000, 48, 16.5, 'active', false),
  ('CUST-1002', 'North Ridge Contractors', 'B', 'Portland', 'West', 410000, 30, 9.2, 'active', false),
  ('CUST-1003', 'Summit Roofing & Lumber', 'C', 'Phoenix', 'Southwest', 180000, 16, 4.5, 'active', false),
  ('CUST-1004', 'Pioneer Home Services', 'D', 'Denver', 'Mountain', 72000, 6, 1.5, 'active', false),
  ('CUST-1005', 'Blue Harbor Construction', 'D', 'Los Angeles', 'West', 0, 0, 0, 'prospect', true)
on conflict (customer_id) do update
set
  customer_name = excluded.customer_name,
  current_spend_class = excluded.current_spend_class,
  branch = excluded.branch,
  region = excluded.region,
  annual_revenue = excluded.annual_revenue,
  weeks_ordered = excluded.weeks_ordered,
  growth_rate = excluded.growth_rate,
  account_status = excluded.account_status,
  is_new = excluded.is_new;

-- SKUs
insert into public.skus (
  sku_code,
  description,
  category,
  unit_of_measure
)
values
  ('SKU-1001', '2x4x8 SPF Stud', 'Lumber', 'EA'),
  ('SKU-1002', '7/16 OSB Sheathing Panel', 'Sheet Goods', 'EA'),
  ('SKU-1003', '80 lb Concrete Mix', 'Concrete', 'BAG'),
  ('SKU-1004', 'Architectural Shingle Bundle', 'Roofing', 'BDL'),
  ('SKU-1005', '1/2 in Drywall Panel', 'Drywall', 'EA')
on conflict (sku_code) do update
set
  description = excluded.description,
  category = excluded.category,
  unit_of_measure = excluded.unit_of_measure;
