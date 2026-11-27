import { Text } from "@mantine/core";
import { AnchorLink } from "../components/AnchorLink";
import { AuthCard } from "../components/AuthCard";

export function NotFoundPage() {
  return (
    <AuthCard title="Page not found">
      <Text mb="md">We could not find this page.</Text>
      <AnchorLink to="/">Go to the start page</AnchorLink>
    </AuthCard>
  );
}
