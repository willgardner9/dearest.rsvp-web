import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshMeAfterSuccess } from "./auth";
import { createTenant, getTenant, listMembers } from "./generated";

export const tenantKeys = {
  all: ["tenants"] as const,
  detail: (tenantId: string) => ["tenants", tenantId] as const,
  members: (tenantId: string) => ["tenants", tenantId, "members"] as const,
};

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.detail(tenantId),
    queryFn: async () => {
      const { data } = await getTenant({ path: { tenant_id: tenantId } });
      return data;
    },
  });
}

export function useMembers(tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.members(tenantId),
    queryFn: async () => {
      const { data } = await listMembers({ path: { tenant_id: tenantId } });
      return data;
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data } = await createTenant({ body: input });
      return data;
    },
    onSuccess: () => refreshMeAfterSuccess(queryClient),
  });
}
