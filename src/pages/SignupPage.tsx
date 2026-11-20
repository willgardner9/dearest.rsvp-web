import {
  ActionIcon,
  Alert,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
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
      onSuccess: () => void navigate({ to: "/verify-email", search: { redirect } }),
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
            label={
              <Group gap={6} component="span" display="inline-flex">
                Your name
                <Tooltip
                  label="This names you, not your wedding. It shows in the app and in the list of people who help plan the wedding. You can name your wedding later."
                  events={{ hover: true, focus: true, touch: true }}
                  multiline
                  w={260}
                  withArrow
                >
                  <ActionIcon
                    component="span"
                    role="img"
                    tabIndex={0}
                    aria-label="Why we ask for your name"
                    variant="transparent"
                    c="gray.5"
                    size="sm"
                    radius="xl"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            description="This identifies your account in the app. It is not your wedding name."
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
