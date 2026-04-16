import type { CaseRecord, CaseSummary } from "../../shared/domain";
import { apiFetch } from "./client";

export interface CaseFilters {
  status?: string;
  requestType?: string;
}

export async function listCases(filters: CaseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.requestType && filters.requestType !== "all") params.set("requestType", filters.requestType);
  const qs = params.toString();
  return apiFetch<CaseSummary[]>(`cases${qs ? `?${qs}` : ""}`);
}

export async function getCaseById(id: string) {
  return apiFetch<CaseRecord>(`cases/${encodeURIComponent(id)}`);
}

export async function createCase(payload: Omit<CaseRecord, "id" | "created_at" | "updated_at">) {
  return apiFetch<CaseRecord>("cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
