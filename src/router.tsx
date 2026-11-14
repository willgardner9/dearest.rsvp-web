import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Title } from "@mantine/core";
import { meQueryOptions } from "./api/auth";
import type { Me } from "./api/types";
import { NotFoundPage } from "./pages/NotFoundPage";
import { queryClient } from "./queryClient";
import { readLastTenant, resolveHome, writeLastTenant } from "./routing";

export interface RouterContext {
  queryClient: QueryClient;
}

interface GuardArgs {
  context: RouterContext;
  location: { href: string };
}

function loadMe(context: RouterContext): Promise<Me | null> {
  return context.queryClient.ensureQueryData(meQueryOptions);
}

// A logged-in user does not see the logged-out pages.
async function requireLoggedOut({ context }: GuardArgs) {
  const me = await loadMe(context);
  if (me) throw redirect({ href: resolveHome(me, readLastTenant()) });
}

async function requireUnverified({ context }: GuardArgs) {
  const me = await loadMe(context);
  if (!me) throw redirect({ href: "/login" });
  if (me.user.email_verified) throw redirect({ href: "/" });
}

async function requireVerified({ context, location }: GuardArgs): Promise<{ me: Me }> {
  const me = await loadMe(context);
  if (!me) throw redirect({ to: "/login", search: { redirect: location.href } });
  if (!me.user.email_verified) throw redirect({ href: "/verify-email" });
  return { me };
}

async function requireNoTenants(args: GuardArgs) {
  const { me } = await requireVerified(args);
  if (me.memberships.length > 0) throw redirect({ href: "/" });
  return { me };
}

async function requireMember(args: GuardArgs & { params: { tenantId: string } }) {
  const { me } = await requireVerified(args);
  const { tenantId } = args.params;
  if (!me.memberships.some((m) => m.tenant_id === tenantId)) throw redirect({ href: "/" });
  writeLastTenant(tenantId);
  return { me };
}

function placeholder(name: string) {
  return function Placeholder() {
    return <Title p="xl">{name}</Title>;
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async ({ context }) => {
    const me = await loadMe(context);
    throw redirect({ href: resolveHome(me, readLastTenant()) });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: optionalString(search.redirect),
  }),
  beforeLoad: requireLoggedOut,
  component: placeholder("Log in"),
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: optionalString(search.redirect),
  }),
  beforeLoad: requireLoggedOut,
  component: placeholder("Sign up"),
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  beforeLoad: requireUnverified,
  component: placeholder("Verify your email"),
});

const verifyEmailConfirmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email/confirm",
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: optionalString(search.token) ?? "",
  }),
  component: placeholder("Confirm your email"),
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  beforeLoad: requireLoggedOut,
  component: placeholder("Forgot password"),
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: optionalString(search.token) ?? "",
  }),
  component: placeholder("Reset password"),
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/$token",
  component: placeholder("Invite"),
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  beforeLoad: requireNoTenants,
  component: placeholder("Create your wedding"),
});

const newWeddingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-wedding",
  beforeLoad: requireVerified,
  component: placeholder("Create another wedding"),
});

const weddingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$tenantId",
  beforeLoad: requireMember,
  component: Outlet,
});

const weddingHomeRoute = createRoute({
  getParentRoute: () => weddingRoute,
  path: "/",
  component: placeholder("Wedding"),
});

const membersRoute = createRoute({
  getParentRoute: () => weddingRoute,
  path: "/members",
  component: placeholder("Members"),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  verifyEmailRoute,
  verifyEmailConfirmRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  inviteRoute,
  onboardingRoute,
  newWeddingRoute,
  weddingRoute.addChildren([weddingHomeRoute, membersRoute]),
]);

export const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
