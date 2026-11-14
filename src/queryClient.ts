import { QueryCache, QueryClient } from "@tanstack/react-query";
import { clearSession } from "./api/auth";
import { ApiError } from "./api/client";

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // A 401 means that the session ended on the server. Forget the user, so
    // that the route guards send the user to the login page.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) clearSession(queryClient);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
