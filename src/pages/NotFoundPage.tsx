import { Anchor, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { AuthCard } from "../components/AuthCard";

export function NotFoundPage() {
  return (
    <AuthCard title="Page not found">
      <Text mb="md">We could not find this page.</Text>
      <Anchor component={Link} to="/">
        Go to the start page
      </Anchor>
    </AuthCard>
  );
}
