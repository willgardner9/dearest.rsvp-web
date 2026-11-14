import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meKeys } from "./auth";
import { apiFetch } from "./client";
import type { Member, Tenant } from "./types";

export const tenantKeys = {
  all: ["tenants"] as const,
  detail: (tenantId: string) => ["tenants", tenantId] as const,
  members: (tenantId: string) => ["tenants", tenantId, "members"] as const,
};

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.detail(tenantId),
    queryFn: () => apiFetch<Tenant>(`/tenants/${encodeURIComponent(tenantId)}`),
  });
}

export function useMembers(tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.members(tenantId),
    queryFn: () => apiFetch<Member[]>(`/tenants/${encodeURIComponent(tenantId)}/members`),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) => apiFetch<Tenant>("/tenants", { json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKeys.all }),
  });
}
