import { Button, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ApiError, errorCode, errorMessage, useRequestPasswordReset } from "../api";
import { AnchorLink } from "../components/AnchorLink";
import { AppAlert } from "../components/AppAlert";
import { AuthCard } from "../components/AuthCard";

export function ForgotPasswordPage() {
  const request = useRequestPasswordReset();
  const form = useForm({ mode: "uncontrolled", initialValues: { email: "" } });

  const onSubmit = form.onSubmit((values) => request.mutate(values));
  // Show an error if the request failed: no response, a server error, rate_limited,
  // or invalid_input. Other 4xx results do not tell if an account exists.
  const code = errorCode(request.error);
  const failed =
    request.isError &&
    (!(request.error instanceof ApiError) ||
      request.error.status >= 500 ||
      code === "rate_limited" ||
      code === "invalid_input");
  const done = request.isSuccess || (request.isError && !failed);

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
            {failed && (
              <AppAlert kind="error" title="Could not send the email">
                {errorMessage(request.error)}
              </AppAlert>
            )}
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
