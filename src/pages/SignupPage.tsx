import { Alert, Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { errorCode, errorMessage, useSignup } from "../api";
import { AnchorLink } from "../components/AnchorLink";
import { AuthCard } from "../components/AuthCard";

const route = getRouteApi("/signup");

export function SignupPage() {
  const { redirect } = route.useSearch();
  const navigate = useNavigate();
  const signup = useSignup();
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { name: "", email: "", password: "" },
  });

  const onSubmit = form.onSubmit((values) => {
    signup.mutate(values, {
      onSuccess: () => void navigate({ href: "/verify-email" }),
    });
  });

  return (
    <AuthCard title="Create an account">
      <form onSubmit={onSubmit}>
        <Stack>
          {signup.isError && (
            <Alert color="red">
              {errorMessage(signup.error)}{" "}
              {errorCode(signup.error) === "email_taken" && (
                <AnchorLink to="/login" search={{ redirect }}>
                  Log in
                </AnchorLink>
              )}
            </Alert>
          )}
          <TextInput
            label="Name"
            autoComplete="name"
            required
            key={form.key("name")}
            {...form.getInputProps("name")}
          />
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
            autoComplete="new-password"
            required
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Button type="submit" loading={signup.isPending}>
            Create account
          </Button>
          <Text size="sm">
            Do you have an account?{" "}
            <AnchorLink to="/login" search={{ redirect }}>
              Log in
            </AnchorLink>
          </Text>
        </Stack>
      </form>
    </AuthCard>
  );
}
