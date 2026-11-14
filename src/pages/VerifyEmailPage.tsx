import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { errorMessage, useLogout, useMe, useResendVerification } from "../api";
import { AuthCard } from "../components/AuthCard";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  // Poll and refetch on focus, so that a verification in another tab moves this tab on.
  const { data: me } = useMe({ refetchOnWindowFocus: true, refetchInterval: 10_000 });
  const resend = useResendVerification();
  const logout = useLogout();

  const verified = me?.user.email_verified ?? false;
  useEffect(() => {
    if (verified) void navigate({ href: "/" });
  }, [verified, navigate]);

  return (
    <AuthCard title="Check your inbox">
      <Stack>
        <Text>
          We sent a link to <strong>{me?.user.email}</strong>. Open the link to verify your email.
        </Text>
        {resend.isSuccess && <Alert color="green">Email sent.</Alert>}
        {resend.isError && <Alert color="red">{errorMessage(resend.error)}</Alert>}
        <Group>
          <Button onClick={() => resend.mutate()} loading={resend.isPending}>
            Send the email again
          </Button>
          <Button
            variant="default"
            loading={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, { onSuccess: () => void navigate({ href: "/login" }) })
            }
          >
            Log out
          </Button>
        </Group>
      </Stack>
    </AuthCard>
  );
}
