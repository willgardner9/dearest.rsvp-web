import { Select } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import type { MembershipSummary } from "../api";

export function TenantSwitcher({
  memberships,
  currentId,
}: {
  memberships: MembershipSummary[];
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
