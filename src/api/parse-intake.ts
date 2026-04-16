import type { ParseIntakeResponse, RequestType } from "../../shared/domain";
import { apiFetch } from "./client";

export async function parseIntake(source_text: string, request_type: RequestType) {
  return apiFetch<ParseIntakeResponse>("parse-intake", {
    method: "POST",
    body: JSON.stringify({ source_text, request_type }),
  });
}
