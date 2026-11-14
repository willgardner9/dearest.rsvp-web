import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { meKeys, meQueryOptions } from "./api/auth";
import type { Me } from "./api/types";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { InvitePage } from "./pages/InvitePage";
import { LoginPage } from "./pages/LoginPage";
import { MembersPage } from "./pages/MembersPage";
import { NewWeddingPage } from "./pages/NewWeddingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignupPage } from "./pages/SignupPage";
import { VerifyEmailConfirmPage } from "./pages/VerifyEmailConfirmPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { WeddingHomePage } from "./pages/WeddingHomePage";
import { WeddingLayout } from "./components/WeddingLayout";
import { queryClient } from "./queryClient";
import { readLastTenant, resolveHome, safeRedirect, writeLastTenant } from "./routing";

export interface RouterContext {
  queryClient: QueryClient;
}

interface GuardArgs {
  context: RouterContext;
  location: { href: string };
  search?: { redirect?: string };
}

// Returns the path for a user who has a session, and keeps the redirect target.
function homeOrRedirect(me: Me, search: GuardArgs["search"]): string {
  return search?.redirect ? safeRedirect(search.redirect) : resolveHome(me, readLastTenant());
}

function loadMe(context: RouterContext): Promise<Me | null> {
  return context.queryClient.ensureQueryData(meQueryOptions);
}

// A logged-in user does not see the logged-out pages.
async function requireLoggedOut({ context, search }: GuardArgs) {
  const me = await loadMe(context);
  if (me) throw redirect({ href: homeOrRedirect(me, search) });
}

async function requireUnverified({ context, search }: GuardArgs) {
  const me = await loadMe(context);
  if (!me) throw redirect({ to: "/login", search: { redirect: search?.redirect } });
  if (me.user.email_verified) throw redirect({ href: homeOrRedirect(me, search) });
}

async function requireVerified({ context, location }: GuardArgs): Promise<{ me: Me }> {
  const me = await loadMe(context);
  if (!me) throw redirect({ to: "/login", search: { redirect: location.href } });
  if (!me.user.email_verified) {
    throw redirect({ to: "/verify-email", search: { redirect: location.href } });
  }
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
  validateSearch: (search: Record<string, unknown>): { redirect?: string; reset?: 1 } => ({
    redirect: optionalString(search.redirect),
    reset: search.reset === 1 || search.reset === "1" ? 1 : undefined,
  }),
  beforeLoad: requireLoggedOut,
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: optionalString(search.redirect),
  }),
  beforeLoad: requireLoggedOut,
  component: SignupPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: optionalString(search.redirect),
  }),
  beforeLoad: requireUnverified,
  component: VerifyEmailPage,
});

const verifyEmailConfirmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email/confirm",
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: optionalString(search.token) ?? "",
  }),
  component: VerifyEmailConfirmPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  beforeLoad: requireLoggedOut,
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: optionalString(search.token) ?? "",
  }),
  component: ResetPasswordPage,
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/$token",
  component: InvitePage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  beforeLoad: requireNoTenants,
  component: OnboardingPage,
});

const newWeddingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-wedding",
  beforeLoad: requireVerified,
  component: NewWeddingPage,
});

const weddingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$tenantId",
  beforeLoad: requireMember,
  component: WeddingLayout,
});

const weddingHomeRoute = createRoute({
  getParentRoute: () => weddingRoute,
  path: "/",
  component: WeddingHomePage,
});

const membersRoute = createRoute({
  getParentRoute: () => weddingRoute,
  path: "/members",
  component: MembersPage,
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

// When the me query changes to null (logout, or a 401 from the API), run the
// route guards again. A protected page then goes to the login page.
queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === "updated" &&
    event.query.queryKey[0] === meKeys.all[0] &&
    event.query.state.data === null
  ) {
    void router.invalidate();
  }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
