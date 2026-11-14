import { Select } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import type { Membership } from "../api/types";

export function TenantSwitcher({
  memberships,
  currentId,
}: {
  memberships: Membership[];
  currentId: string;
}) {
  const navigate = useNavigate();
  return (
    <Select
      aria-label="Switch wedding"
      data={memberships.map((m) => ({ value: m.tenant_id, label: m.tenant_name }))}
      value={currentId}
      allowDeselect={false}
      onChange={(id) => {
        if (id && id !== currentId) void navigate({ to: "/w/$tenantId", params: { tenantId: id } });
      }}
      w={220}
    />
  );
}
