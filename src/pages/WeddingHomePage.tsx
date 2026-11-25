import { Loader } from "@mantine/core";
import { getRouteApi } from "@tanstack/react-router";
import { useTenant } from "../api";
import { WeddingGuide } from "../components/WeddingGuide";

const route = getRouteApi("/w/$tenantId/");

// The header shows which wedding is open, so this page shows only the guide.
export function WeddingHomePage() {
  const { tenantId } = route.useParams();
  const { isPending } = useTenant(tenantId);

  if (isPending) return <Loader />;
  return <WeddingGuide />;
}
