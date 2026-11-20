import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "./client";
import {
  confirmPasswordReset,
  getMe,
  login,
  logout,
  requestPasswordReset,
  resendVerificationEmail,
  signup,
  verifyEmail,
  type Me,
} from "./generated";

export const meKeys = {
  all: ["me"] as const,
};

// Returns null when there is no session.
export async function fetchMe(): Promise<Me | null> {
  try {
    const { data } = await getMe();
    return data;
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
      signup({ body: input }).then(({ data }) => data),
    onSuccess: (me) => queryClient.setQueryData(meKeys.all, me),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      login({ body: input }).then(({ data }) => data),
    onSuccess: (me) => queryClient.setQueryData(meKeys.all, me),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout().then(() => null),
    onSuccess: () => clearSession(queryClient),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { token: string }) => verifyEmail({ body: input }).then(() => null),
    onSuccess: () => refreshMeAfterSuccess(queryClient),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => resendVerificationEmail().then(() => null),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      requestPasswordReset({ body: input }).then(() => null),
  });
}

export function useConfirmPasswordReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      confirmPasswordReset({ body: input }).then(() => null),
    // The API deletes all sessions of the user.
    onSuccess: () => clearSession(queryClient),
  });
}

// Fetch me again, also when no component observes it. The route guards read the
// cache, so a change to the memberships or the verified state must be in the cache first.
export function refreshMe(queryClient: QueryClient): Promise<Me | null> {
  return queryClient.fetchQuery({ ...meQueryOptions, staleTime: 0 });
}

// Use this after a mutation that the server accepted. A failed refresh must not
// change the mutation to an error, because the change on the server is done.
export async function refreshMeAfterSuccess(queryClient: QueryClient): Promise<void> {
  await refreshMe(queryClient).catch(() => undefined);
}

// Forget the old user after logout. Keep the me query itself, so that the
// components that observe it get null. Remove all other data of the old user.
export function clearSession(queryClient: QueryClient) {
  queryClient.setQueryData(meKeys.all, null);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== meKeys.all[0] });
}
