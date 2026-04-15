
# Pricing Analyst Copilot — Phase 1 Implementation Plan

## Overview
Build the core Pricing Analyst Copilot with all 5 request types, analysis engine, recommendation output, and full backend with realistic seed data. Dashboard and admin features come in Phase 2.

---

## 1. Database Setup & Seed Data
Create all reference data tables in Lovable Cloud (Supabase):
- **customers** — 250 records with revenue, frequency, growth, spend class (A/B/C/D distribution)
- **skus** — 500 SKUs with descriptions
- **target_prices** — SKU × price zone target prices
- **market_prices** — SKU × price zone × spend class market prices
- **deviations** — existing customer deviations (~100 records)
- **spend_class_thresholds** — A/B/C/D rules with min/max revenue, weeks, growth, weighted score cutoffs
- **governance_thresholds** — request type × threshold band → required approvers
- **cases** — analyst case records with status, type, all input fields, recommendation, approvers
- **case_audit_log** — track all changes

Seed with internally consistent fake data so calculations work end-to-end.

## 2. App Shell & Navigation
- Left sidebar navigation: New Case, Existing Cases, Reference Data, Rules & Thresholds, Dashboard (placeholder), Admin (placeholder)
- Clean enterprise design with status chips, warning banners, expandable panels
- Role-based nav visibility (Analyst, Director, Admin) — start with Analyst view

## 3. New Case Wizard (All 5 Request Types)

### Step 1: Select Request Type
Card-based selector for the 5 types: Existing Deviation, New Deviation, Spend Class (New), Spend Class (Existing), Market Price Change

### Step 2: Request Intake
- Multi-input zone: paste email/chat text, upload files (Excel, CSV, screenshots), type manually
- **Platform McKinsey AI Gateway** integration for extraction: parse unstructured text → structured fields (customer, SKU, prices, quantities, evidence, etc.)
- Show structured intake form with:
  - ✅ Green prefilled fields (high confidence)
  - ⚠️ Yellow fields (low confidence — analyst should verify)
  - 🔴 Red required fields that are blank
  - Blocker banner if required fields missing

### Step 3: Review & Enrich
- Analyst reviews/edits all extracted fields
- System lookups: auto-populate target price, market price, current deviation, customer spend class from reference tables
- Validation: cannot proceed until all required fields per request type are filled

### Step 4: Analysis & Recommendation
**Deterministic rules engine** (no AI for math):
- **Existing Deviation**: % below target, $/unit margin loss, total margin $ loss, deviation depth comparison, governance routing (>3% → RVP+SD approval)
- **New Deviation**: % below market, total margin $ loss, evidence quality check, revenue threshold check, escalation flags
- **Spend Class New**: weighted score (60% revenue, 25% frequency, 15% growth), threshold comparison, confidence level, benchmark table
- **Spend Class Existing**: gap analysis vs requested class, 1-level vs 2-level change detection, D→A hard stop, D→B escalation
- **Market Price Change**: % change, $/unit impact, total margin $ loss, >5% DP review flag, override evidence assessment

**AI-assisted** (via Platform McKinsey AI Gateway):
- Evidence quality summarization
- Analyst write-up drafting
- Suggested response email/Teams message

### Step 5: Case Summary Output
Clean case file with sections: Case Summary, Extracted Inputs, Calculated Impact (with visible formulas), Evidence Review, Benchmark Comparison, Recommendation (Agree/Push Back/Escalate), "Why" bullets, Required Approvers, Suggested Response Draft.

- Copy to clipboard button
- Export-ready formatting
- Save as draft at any stage
- Reopen completed cases

## 4. Existing Cases View
- Table of all cases with filters: status, request type, date, requester
- Status chips: Draft, In Review, Completed, Escalated, Blocked
- Quick view and full detail view
- Cases requiring escalation highlighted

## 5. Reference Data Viewer
- Read-only tables for: Target Prices, Market Prices, Deviations, Customer Master, Spend Class Thresholds, Governance Thresholds
- Search and filter
- Admin upload capability (CSV) for future phases

## 6. Rules & Thresholds Viewer
- Display current governance rules, spend class thresholds, escalation triggers
- Toggle between simple threshold / weighted score / hybrid logic for spend class
- Read-only for analysts, editable for admins

## 7. AI Integration — Platform McKinsey AI Gateway
- Edge function to call AI Gateway for text extraction (emails, chat messages → structured fields)
- Edge function for evidence summarization and response drafting
- All AI outputs clearly labeled as AI-generated
- Reference values (prices, thresholds) always from database, never AI-generated

---

## What's Deferred to Phase 2
- Full analyst dashboard with charts (case volume, margin at risk, turnaround time, behavioral insights)
- Admin settings and user management
- Audit log viewer
- OCR for screenshot/image parsing
- PDF export
- Similar customer benchmarking
- Login/authentication
