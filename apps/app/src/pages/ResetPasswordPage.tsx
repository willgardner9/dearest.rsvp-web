import { Button, PasswordInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { errorCode, errorMessage, useConfirmPasswordReset } from "../api";
import { AnchorLink } from "../components/AnchorLink";
import { AppAlert } from "../components/AppAlert";
import { AuthCard } from "../components/AuthCard";

const route = getRouteApi("/reset-password");

export function ResetPasswordPage() {
  const { token } = route.useSearch();
  const navigate = useNavigate();
  const confirm = useConfirmPasswordReset();
  const form = useForm({ mode: "uncontrolled", initialValues: { password: "" } });

  const onSubmit = form.onSubmit(({ password }) => {
    confirm.mutate(
      { token, password },
      { onSuccess: () => void navigate({ to: "/login", search: { reset: 1 } }) },
    );
  });

  return (
    <AuthCard title="Set a new password">
      <form onSubmit={onSubmit}>
        <Stack>
          {confirm.isError && (
            <AppAlert kind="error" title="Could not reset the password">
              {errorMessage(confirm.error)}
              {errorCode(confirm.error) === "invalid_token" && (
                <>
                  {" "}
                  <AnchorLink to="/forgot-password" fz="inherit" fw={500}>
                    Get a new link
                  </AnchorLink>
                </>
              )}
            </AppAlert>
          )}
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            required
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Button type="submit" loading={confirm.isPending}>
            Change password
          </Button>
        </Stack>
      </form>
    </AuthCard>
  );
}
