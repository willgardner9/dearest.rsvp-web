import { Button, Group, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { errorMessage, useLogin } from "../api";
import { AnchorLink } from "../components/AnchorLink";
import { AppAlert } from "../components/AppAlert";
import { AuthCard } from "../components/AuthCard";
import { readLastTenant, resolveHome, safeRedirect } from "../routing";

const route = getRouteApi("/login");

export function LoginPage() {
  const { redirect, reset } = route.useSearch();
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "", password: "" },
  });

  const onSubmit = form.onSubmit((values) => {
    login.mutate(values, {
      onSuccess: (me) => {
        const target = redirect ? safeRedirect(redirect) : resolveHome(me, readLastTenant());
        void navigate({ href: target });
      },
    });
  });

  return (
    <AuthCard title="Log in">
      <form onSubmit={onSubmit}>
        <Stack>
          {reset && (
            <AppAlert kind="success" title="Password changed">
              Log in with the new password.
            </AppAlert>
          )}
          {login.isError && (
            <AppAlert kind="error" title="Could not log in">
              {errorMessage(login.error)}
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
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            required
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Button type="submit" loading={login.isPending}>
            Log in
          </Button>
          <Group justify="space-between">
            <AnchorLink to="/signup" search={{ redirect }} size="sm">
              Create an account
            </AnchorLink>
            <AnchorLink to="/forgot-password" size="sm">
              Forgot your password?
            </AnchorLink>
          </Group>
        </Stack>
      </form>
    </AuthCard>
  );
}
