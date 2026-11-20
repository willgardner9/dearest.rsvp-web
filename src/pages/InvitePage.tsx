import { Alert, Button, Loader, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  ApiError,
  errorCode,
  errorMessage,
  useAcceptInvite,
  useInvitePreview,
  useLogout,
  useMe,
} from "../api";
import type { InvitePreview, Me } from "../api";
import { AnchorLink } from "../components/AnchorLink";
import { AuthCard } from "../components/AuthCard";

const route = getRouteApi("/invite/$token");

export function InvitePage() {
  const { token } = route.useParams();
  const preview = useInvitePreview(token);
  const me = useMe();

  if (preview.isPending || me.isPending) {
    return (
      <AuthCard title="Invite">
        <Loader />
      </AuthCard>
    );
  }

  // Without me, the page cannot tell if the user has a session. Do not show the
  // logged-out choices to a user who has a session.
  if (me.isError) {
    return (
      <AuthCard title="Invite">
        <Text>{errorMessage(me.error)}</Text>
      </AuthCard>
    );
  }

  if (preview.isError) {
    const notFound = preview.error instanceof ApiError && preview.error.status === 404;
    return (
      <AuthCard title="Invite">
        <Stack>
          <Text>
            {notFound ? "This invite is not valid or has expired." : errorMessage(preview.error)}
          </Text>
          <AnchorLink to="/">Go to the start page</AnchorLink>
        </Stack>
      </AuthCard>
    );
  }

  const invite = preview.data;
  return (
    <AuthCard title={`${invite.inviter_name} invited you to ${invite.tenant_name}`}>
      <InviteAction token={token} invite={invite} me={me.data ?? null} />
    </AuthCard>
  );
}

function sameEmail(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function InviteAction({
  token,
  invite,
  me,
}: {
  token: string;
  invite: InvitePreview;
  me: Me | null;
}) {
  if (!me) {
    if (invite.account_exists) {
      return (
        <Stack>
          <Text>You already have an account. Log in to accept.</Text>
          <LoginButton token={token} />
        </Stack>
      );
    }
    return <JoinForm token={token} invite={invite} />;
  }
  if (sameEmail(me.user.email, invite.email)) {
    return <AcceptButton token={token} invite={invite} />;
  }
  return <EmailMismatch invite={invite} me={me} />;
}

function LoginButton({ token }: { token: string }) {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => void navigate({ to: "/login", search: { redirect: `/invite/${token}` } })}
    >
      Log in
    </Button>
  );
}

function JoinForm({ token, invite }: { token: string; invite: InvitePreview }) {
  const navigate = useNavigate();
  const accept = useAcceptInvite(token);
  const form = useForm({ mode: "uncontrolled", initialValues: { name: "", password: "" } });

  const onSubmit = form.onSubmit((values) => {
    accept.mutate(values, {
      onSuccess: ({ tenant_id }) =>
        void navigate({ to: "/w/$tenantId", params: { tenantId: tenant_id } }),
    });
  });

  // 401 here means that an account for this email exists now. The user must log in.
  const needsLogin = errorCode(accept.error) === "unauthenticated";

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        {accept.isError &&
          (needsLogin ? (
            <Alert color="red">
              You already have an account.{" "}
              <AnchorLink to="/login" search={{ redirect: `/invite/${token}` }}>
                Log in to accept
              </AnchorLink>
            </Alert>
          ) : (
            <Alert color="red">{errorMessage(accept.error)}</Alert>
          ))}
        <TextInput label="Email" value={invite.email} readOnly />
        <TextInput
          label="Name"
          autoComplete="name"
          required
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          required
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" loading={accept.isPending}>
          Join
        </Button>
      </Stack>
    </form>
  );
}

function AcceptButton({ token, invite }: { token: string; invite: InvitePreview }) {
  const navigate = useNavigate();
  const accept = useAcceptInvite(token);

  const onAccept = () =>
    accept.mutate(undefined, {
      onSuccess: ({ tenant_id }) =>
        void navigate({ to: "/w/$tenantId", params: { tenantId: tenant_id } }),
      onError: (error) => {
        if (errorCode(error) !== "already_member") return;
        // The user is a member already. Open the wedding of this invite.
        void navigate({ to: "/w/$tenantId", params: { tenantId: invite.tenant_id } });
      },
    });

  return (
    <Stack>
      {accept.isError && errorCode(accept.error) !== "already_member" && (
        <Alert color="red">{errorMessage(accept.error)}</Alert>
      )}
      <Button onClick={onAccept} loading={accept.isPending}>
        Accept
      </Button>
    </Stack>
  );
}

function EmailMismatch({ invite, me }: { invite: InvitePreview; me: Me }) {
  const logout = useLogout();
  return (
    <Stack>
      <Text>
        This invite is for <strong>{invite.email}</strong>. You are logged in as{" "}
        <strong>{me.user.email}</strong>.
      </Text>
      {/* Log out and stay on this page. The page then shows the logged-out choices. */}
      <Button variant="default" loading={logout.isPending} onClick={() => logout.mutate()}>
        Log out
      </Button>
    </Stack>
  );
}
