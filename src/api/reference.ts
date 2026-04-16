import type {
  Customer,
  GovernanceThreshold,
  MarketPriceRecord,
  Sku,
  SpendClassThreshold,
} from "../../shared/domain";
import { apiFetch } from "./client";

export async function listCustomers(search = "", limit = 100) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  return apiFetch<Customer[]>(`reference/customers?${params.toString()}`);
}

export async function listSkus(search = "", limit = 100) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  return apiFetch<Sku[]>(`reference/skus?${params.toString()}`);
}

export async function getSpendClassThresholds() {
  return apiFetch<SpendClassThreshold[]>("reference/thresholds");
}

export async function getGovernanceThresholds() {
  return apiFetch<GovernanceThreshold[]>("reference/rules");
}

export async function getMarketPrice(skuCode: string, priceZone: string, spendClass: string) {
  const params = new URLSearchParams({ skuCode, priceZone, spendClass });
  return apiFetch<MarketPriceRecord | null>(`reference/market-price?${params.toString()}`);
}
