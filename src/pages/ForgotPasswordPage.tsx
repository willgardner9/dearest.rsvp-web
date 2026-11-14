import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { errorCode, errorMessage, useRequestPasswordReset } from "../api";
import { AnchorLink } from "../components/AnchorLink";
import { AuthCard } from "../components/AuthCard";

export function ForgotPasswordPage() {
  const request = useRequestPasswordReset();
  const form = useForm({ mode: "uncontrolled", initialValues: { email: "" } });

  const onSubmit = form.onSubmit((values) => request.mutate(values));
  // Only rate_limited shows. Other results do not tell if an account exists.
  const rateLimited = errorCode(request.error) === "rate_limited";
  const done = request.isSuccess || (request.isError && !rateLimited);

  return (
    <AuthCard title="Reset your password">
      {done ? (
        <Stack>
          <Text>If an account exists for this email, we sent a link to reset the password.</Text>
          <AnchorLink to="/login">Back to log in</AnchorLink>
        </Stack>
      ) : (
        <form onSubmit={onSubmit}>
          <Stack>
            {rateLimited && <Alert color="red">{errorMessage(request.error)}</Alert>}
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              required
              key={form.key("email")}
              {...form.getInputProps("email")}
            />
            <Button type="submit" loading={request.isPending}>
              Send the link
            </Button>
            <AnchorLink to="/login" size="sm">
              Back to log in
            </AnchorLink>
          </Stack>
        </form>
      )}
    </AuthCard>
  );
}
