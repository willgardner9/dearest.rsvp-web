import { Alert, Button, Group, Loader, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { errorMessage, useCancelInvite, useCreateInvite, useInvites, useMembers } from "../api";
import type { Invite } from "../api/types";

const route = getRouteApi("/w/$tenantId/members");

export function MembersPage() {
  const { tenantId } = route.useParams();
  return (
    <Stack gap="xl" maw={800}>
      <MembersSection tenantId={tenantId} />
      <InviteForm tenantId={tenantId} />
      <PendingInvites tenantId={tenantId} />
    </Stack>
  );
}

function MembersSection({ tenantId }: { tenantId: string }) {
  const { data: members, isPending, isError, error } = useMembers(tenantId);
  return (
    <section>
      <Title order={2} mb="md">
        Members
      </Title>
      {isPending && <Loader />}
      {isError && <Alert color="red">{errorMessage(error)}</Alert>}
      {members && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {members.map((m) => (
              <Table.Tr key={m.user_id}>
                <Table.Td>{m.name}</Table.Td>
                <Table.Td>{m.email}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </section>
  );
}

function InviteForm({ tenantId }: { tenantId: string }) {
  const create = useCreateInvite(tenantId);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({ mode: "uncontrolled", initialValues: { email: "" } });

  const onSubmit = form.onSubmit(({ email }) => {
    setSentTo(null);
    create.mutate(
      { email },
      {
        onSuccess: () => {
          setSentTo(email);
          form.reset();
        },
      },
    );
  });

  return (
    <section>
      <Title order={3} mb="md">
        Invite someone
      </Title>
      <form onSubmit={onSubmit}>
        <Stack>
          {sentTo && <Alert color="green">Invite sent to {sentTo}.</Alert>}
          {create.isError && <Alert color="red">{errorMessage(create.error)}</Alert>}
          <Group align="flex-end">
            <TextInput
              label="Email"
              type="email"
              required
              style={{ flex: 1 }}
              key={form.key("email")}
              {...form.getInputProps("email")}
            />
            <Button type="submit" loading={create.isPending}>
              Send invite
            </Button>
          </Group>
        </Stack>
      </form>
    </section>
  );
}

function PendingInvites({ tenantId }: { tenantId: string }) {
  const { data: invites } = useInvites(tenantId);
  if (!invites || invites.length === 0) return null;

  return (
    <section>
      <Title order={3} mb="md">
        Pending invites
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Email</Table.Th>
            <Table.Th>Invited by</Table.Th>
            <Table.Th>Expires</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invites.map((invite) => (
            <InviteRow key={invite.email} tenantId={tenantId} invite={invite} />
          ))}
        </Table.Tbody>
      </Table>
    </section>
  );
}

function InviteRow({ tenantId, invite }: { tenantId: string; invite: Invite }) {
  const resend = useCreateInvite(tenantId);
  const cancel = useCancelInvite(tenantId);
  const [confirming, setConfirming] = useState(false);
  const error = resend.error ?? cancel.error;

  return (
    <Table.Tr>
      <Table.Td>{invite.email}</Table.Td>
      <Table.Td>{invite.invited_by_name}</Table.Td>
      <Table.Td>{new Date(invite.expires_at).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          {resend.isSuccess && (
            <Text size="sm" c="green">
              Sent
            </Text>
          )}
          {error && (
            <Text size="sm" c="red">
              {errorMessage(error)}
            </Text>
          )}
          {confirming ? (
            <>
              <Text size="sm">Cancel this invite?</Text>
              <Button
                size="xs"
                color="red"
                loading={cancel.isPending}
                onClick={() => cancel.mutate(invite.id)}
              >
                Yes, cancel
              </Button>
              <Button size="xs" variant="default" onClick={() => setConfirming(false)}>
                No
              </Button>
            </>
          ) : (
            <>
              <Button
                size="xs"
                variant="default"
                loading={resend.isPending}
                onClick={() => resend.mutate({ email: invite.email })}
              >
                Send again
              </Button>
              <Button size="xs" variant="subtle" color="red" onClick={() => setConfirming(true)}>
                Cancel
              </Button>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
