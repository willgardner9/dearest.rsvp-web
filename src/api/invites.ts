import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshMe } from "./auth";
import { apiFetch } from "./client";
import type { Invite, InvitePreview } from "./types";

export const inviteKeys = {
  list: (tenantId: string) => ["tenants", tenantId, "invites"] as const,
  preview: (token: string) => ["invites", token] as const,
};

function invitesPath(tenantId: string) {
  return `/tenants/${encodeURIComponent(tenantId)}/invites`;
}

export function useInvites(tenantId: string) {
  return useQuery({
    queryKey: inviteKeys.list(tenantId),
    queryFn: () => apiFetch<Invite[]>(invitesPath(tenantId)),
  });
}

export function useCreateInvite(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string }) =>
      apiFetch<{ id: string; email: string; expires_at: string }>(invitesPath(tenantId), {
        json: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inviteKeys.list(tenantId) }),
  });
}

export function useCancelInvite(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      apiFetch<null>(`${invitesPath(tenantId)}/${encodeURIComponent(inviteId)}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inviteKeys.list(tenantId) }),
  });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: inviteKeys.preview(token),
    queryFn: () => apiFetch<InvitePreview>(`/invites/${encodeURIComponent(token)}`),
    retry: false,
  });
}

export function useAcceptInvite(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; password?: string }) =>
      apiFetch<{ tenant_id: string }>(`/invites/${encodeURIComponent(token)}/accept`, {
        json: input,
      }),
    onSuccess: () => refreshMe(queryClient),
  });
}
