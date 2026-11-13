import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface HealthResponse {
  status: string;
  db: string;
}

export const healthKeys = {
  all: ["health"] as const,
};

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

// Manual query: it runs only when the caller runs `refetch`.
export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: fetchHealth,
    enabled: false,
    retry: false,
  });
}
