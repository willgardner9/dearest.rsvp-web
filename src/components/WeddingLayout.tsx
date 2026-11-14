import { AppShell, Avatar, Group, Menu, Text, Title, UnstyledButton } from "@mantine/core";
import { getRouteApi, Outlet, useNavigate } from "@tanstack/react-router";
import { useLogout, useMe } from "../api";
import { showSwitcher } from "../routing";
import { AnchorLink } from "./AnchorLink";
import { TenantSwitcher } from "./TenantSwitcher";

const route = getRouteApi("/w/$tenantId");

export function WeddingLayout() {
  const { tenantId } = route.useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const logout = useLogout();
  const current = me?.memberships.find((m) => m.tenant_id === tenantId);

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap" gap="lg">
            <Title order={4} lineClamp={1}>
              {current?.tenant_name}
            </Title>
            {me && showSwitcher(me) && (
              <TenantSwitcher memberships={me.memberships} currentId={tenantId} />
            )}
            <AnchorLink to="/w/$tenantId/members" params={{ tenantId }}>
              Members
            </AnchorLink>
          </Group>
          <Menu position="bottom-end">
            <Menu.Target>
              <UnstyledButton aria-label="User menu">
                <Avatar name={me?.user.name} color="initials" />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Text size="sm" fw={500}>
                  {me?.user.name}
                </Text>
                <Text size="xs">{me?.user.email}</Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item
                onClick={() =>
                  logout.mutate(undefined, { onSuccess: () => void navigate({ href: "/login" }) })
                }
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
