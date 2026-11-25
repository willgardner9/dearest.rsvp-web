import {
  AppShell,
  Avatar,
  Burger,
  Combobox,
  Group,
  Image,
  Menu,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { HouseIcon, UsersIcon } from "@phosphor-icons/react";
import { Link, getRouteApi, Outlet, useNavigate } from "@tanstack/react-router";
import { useLogout, useMe } from "../api";
import { showSwitcher } from "../routing";
import { NavItemLink } from "./NavItemLink";
import classes from "./WeddingLayout.module.css";

const route = getRouteApi("/w/$tenantId");

export function WeddingLayout() {
  const { tenantId } = route.useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const logout = useLogout();
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" wrap="nowrap">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
          <Link to="/" aria-label="Dearest home" style={{ display: "flex" }}>
            <Image src="/dearest-color.svg" alt="Dearest" h={20} w="auto" />
          </Link>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="white">
        <AppShell.Section grow p="md">
          <NavItemLink
            to="/w/$tenantId"
            params={{ tenantId }}
            label="Home"
            leftSection={<HouseIcon size={18} />}
            classNames={{ root: classes.navItem, section: classes.navIcon }}
            activeOptions={{ exact: true }}
            activeProps={{ active: true }}
            onClick={close}
          />
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="lg" mb="xs" px="sm">
            Settings
          </Text>
          <NavItemLink
            to="/w/$tenantId/members"
            params={{ tenantId }}
            label="Members"
            leftSection={<UsersIcon size={18} />}
            classNames={{ root: classes.navItem, section: classes.navIcon }}
            activeProps={{ active: true }}
            onClick={close}
          />
        </AppShell.Section>

        <AppShell.Section p="xs" style={{ borderTop: "1px solid var(--mantine-color-stone-2)" }}>
          <Menu position="top-start" width={220}>
            <Menu.Target>
              <UnstyledButton aria-label="User menu" className={classes.userButton}>
                <Group wrap="nowrap" gap="xs">
                  <Avatar
                    size="sm"
                    name={me?.user.name}
                    color="rose"
                    variant="light"
                    styles={{ placeholder: { color: "var(--mantine-color-rose-9)" } }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={500} truncate>
                      {me?.user.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {me?.user.email}
                    </Text>
                  </div>
                  <Combobox.Chevron />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              {me && showSwitcher(me) && (
                <>
                  <Menu.Label>Weddings</Menu.Label>
                  {me.memberships.map((m) => (
                    <Menu.Item
                      key={m.tenant_id}
                      fw={m.tenant_id === tenantId ? 600 : undefined}
                      rightSection={m.tenant_id === tenantId ? "✓" : undefined}
                      onClick={() => {
                        if (m.tenant_id !== tenantId) {
                          void navigate({ to: "/w/$tenantId", params: { tenantId: m.tenant_id } });
                        }
                      }}
                    >
                      {m.tenant_name}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                </>
              )}
              <Menu.Item
                onClick={() =>
                  logout.mutate(undefined, { onSuccess: () => void navigate({ href: "/login" }) })
                }
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
