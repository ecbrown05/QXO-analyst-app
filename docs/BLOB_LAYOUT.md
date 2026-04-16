# Azure Blob Layout

The Azure refactor stores all application state and lookups inside a single blob container.

## Paths

- `cases/index.json`
  - searchable case summary list used by the case grid
- `cases/items/<caseId>.json`
  - full saved case document
- `audit/<caseId>/<timestamp>.json`
  - immutable audit entries for case creation and future edits
- `reference/customers.json`
  - customer master records
- `reference/skus.json`
  - SKU master records loaded from the price-grid import
- `reference/spend-class-thresholds.json`
  - spend class rules used by the UI and analysis logic
- `reference/governance-thresholds.json`
  - approval and escalation thresholds
- `reference/market-prices/index.json`
  - market-price zone summary
- `reference/market-prices/by-zone/<zone>.json`
  - price-zone partition for lookup by zone and spend class
- `reference/market-prices/by-sku/<skuCode>.json`
  - per-SKU partition for focused SKU lookups

## Writers

- `scripts/upload-reference-data.mjs`
  - uploads seed customers, governance thresholds, spend-class thresholds, and initializes `cases/index.json`
- `scripts/import-price-grid.mjs`
  - converts the CSV market grid into blob JSON partitions and `reference/skus.json`
- `api/src/functions/index.ts`
  - writes cases and audit entries at runtime

## Readers

- `api/src/functions/index.ts`
  - exposes blob-backed HTTP endpoints for the React app
- `src/api/*.ts`
  - frontend API client modules that call the Azure Functions API
