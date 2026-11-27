import { useQuery } from "@tanstack/react-query";
import { getHealth, type Health } from "./generated";

export type HealthResponse = Health;

export const healthKeys = {
  all: ["health"] as const,
};

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await getHealth();
  return data;
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
