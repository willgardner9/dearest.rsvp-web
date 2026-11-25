import { Loader, Stack, Title } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";
import { useTenant } from "../api";
import { WeddingGuide } from "../components/WeddingGuide";

const route = getRouteApi("/w/$tenantId/");

export function WeddingHomePage() {
  const { tenantId } = route.useParams();
  const { data: tenant, isPending } = useTenant(tenantId);

  if (isPending) return <Loader />;
  return (
    <Stack>
      <Title order={2}>{tenant?.name}</Title>
      <WeddingGuide />
    </Stack>
  );
}
