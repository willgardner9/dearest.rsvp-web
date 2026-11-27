import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refreshMeAfterSuccess } from "./auth";
import {
  acceptInvite,
  cancelInvite,
  createInvite,
  getInvitePreview,
  listInvites,
  type NewAccountBody,
} from "./generated";

export const inviteKeys = {
  list: (tenantId: string) => ["tenants", tenantId, "invites"] as const,
  preview: (token: string) => ["invites", token] as const,
};

export async function fetchInvites(tenantId: string) {
  const { data } = await listInvites({ path: { tenant_id: tenantId } });
  return data;
}

export async function fetchInvitePreview(token: string) {
  const { data } = await getInvitePreview({ path: { token } });
  return data;
}

export function useInvites(tenantId: string) {
  return useQuery({
    queryKey: inviteKeys.list(tenantId),
    queryFn: () => fetchInvites(tenantId),
  });
}

export function useCreateInvite(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const { data } = await createInvite({ path: { tenant_id: tenantId }, body: input });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inviteKeys.list(tenantId) }),
  });
}

export function useCancelInvite(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      cancelInvite({ path: { tenant_id: tenantId, invite_id: inviteId } }).then(() => null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inviteKeys.list(tenantId) }),
  });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: inviteKeys.preview(token),
    queryFn: () => fetchInvitePreview(token),
    retry: false,
  });
}

// A signed-in user sends no body. A new user sends the name and the password.
export async function acceptInviteRequest(token: string, input: NewAccountBody | undefined) {
  const { data } = await acceptInvite({ path: { token }, body: input });
  return data;
}

export function useAcceptInvite(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewAccountBody | undefined) => acceptInviteRequest(token, input),
    onSuccess: () => refreshMeAfterSuccess(queryClient),
  });
}
