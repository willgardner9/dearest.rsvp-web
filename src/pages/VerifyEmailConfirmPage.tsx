import { Alert, Button, Loader, Stack, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ApiError, errorCode, errorMessage, meQueryOptions, useVerifyEmail } from "../api";
import { AuthCard } from "../components/AuthCard";
import { afterVerifyTarget } from "../routing";

const route = getRouteApi("/verify-email/confirm");

type Outcome = { status: "verified" | "invalid"; next: string; error?: unknown };

export function VerifyEmailConfirmPage() {
  const { token } = route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const verify = useVerifyEmail();
  const started = useRef(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    // React StrictMode runs effects two times in development. Call the API one time only.
    if (started.current) return;
    started.current = true;

    const finish = async (result: "ok" | "invalid_token", error?: unknown) => {
      const me = await queryClient
        .fetchQuery({ ...meQueryOptions, staleTime: 0 })
        .catch(() => null);
      const target = afterVerifyTarget(result, me);
      // Only invalid_token can still be a success (the link was opened before).
      // Any other error stays an error.
      const otherError = error !== undefined && errorCode(error) !== "invalid_token";
      setOutcome(
        otherError ? { status: "invalid", next: target.next, error } : { ...target, error },
      );
    };

    if (!token) {
      void finish("invalid_token", new ApiError(400, { error: "invalid_token" }));
      return;
    }
    verify.mutate(
      { token },
      {
        onSuccess: () => void finish("ok"),
        onError: (error) => void finish("invalid_token", error),
      },
    );
  }, [token, verify, queryClient]);

  if (!outcome) {
    return (
      <AuthCard title="Verifying your email">
        <Loader />
      </AuthCard>
    );
  }

  const go = () => void navigate({ href: outcome.next });

  if (outcome.status === "verified") {
    return (
      <AuthCard title="Your email is verified">
        <Button onClick={go}>Continue</Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="We could not verify your email">
      <Stack>
        <Alert color="red">
          <Text size="sm">{errorMessage(outcome.error)}</Text>
        </Alert>
        <Button onClick={go}>Continue</Button>
      </Stack>
    </AuthCard>
  );
}
