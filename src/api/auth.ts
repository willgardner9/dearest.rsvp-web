import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, apiFetch } from "./client";
import type { Me } from "./types";

export const meKeys = {
  all: ["me"] as const,
};

// Returns null when there is no session.
export async function fetchMe(): Promise<Me | null> {
  try {
    return await apiFetch<Me>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const meQueryOptions = queryOptions({
  queryKey: meKeys.all,
  queryFn: fetchMe,
  staleTime: 30_000,
});

export function useMe(options?: { refetchOnWindowFocus?: boolean; refetchInterval?: number }) {
  return useQuery({ ...meQueryOptions, ...options });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; name: string }) =>
      apiFetch<Me>("/auth/signup", { json: input }),
    onSuccess: (me) => queryClient.setQueryData(meKeys.all, me),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiFetch<Me>("/auth/login", { json: input }),
    onSuccess: (me) => queryClient.setQueryData(meKeys.all, me),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<null>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      // Remove the data of the old user, then keep a known "no session" state.
      queryClient.clear();
      queryClient.setQueryData(meKeys.all, null);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { token: string }) => apiFetch<null>("/auth/verify-email", { json: input }),
    onSuccess: () => refreshMe(queryClient),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => apiFetch<null>("/auth/verify-email/resend", { method: "POST" }),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      apiFetch<null>("/auth/password-reset", { json: input }),
  });
}

export function useConfirmPasswordReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      apiFetch<null>("/auth/password-reset/confirm", { json: input }),
    // The API deletes all sessions of the user.
    onSuccess: () => queryClient.setQueryData(meKeys.all, null),
  });
}

// Fetch me again, also when no component observes it. The route guards read the
// cache, so a change to the memberships or the verified state must be in the cache first.
export function refreshMe(queryClient: QueryClient): Promise<Me | null> {
  return queryClient.fetchQuery({ ...meQueryOptions, staleTime: 0 });
}
