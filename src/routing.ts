import type { Me } from "./api";

const LAST_TENANT_KEY = "dearest.lastTenantId";

// Returns the path that `/` goes to for this user.
export function resolveHome(me: Me | null, lastTenantId: string | null): string {
  if (!me) return "/login";
  if (!me.user.email_verified) return "/verify-email";
  if (me.memberships.length === 0) return "/onboarding";
  const last = me.memberships.find((m) => m.tenant_id === lastTenantId);
  return `/w/${(last ?? me.memberships[0]).tenant_id}`;
}

// Returns the target only if it is a path in this app. This stops an open redirect.
export function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith("/")) return "/";
  if (target.startsWith("//") || target.startsWith("/\\")) return "/";
  // The URL parser removes tab and newline characters, so "/\t/x" becomes "//x".
  // Reject all control characters and all backslashes.
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return "/";
  return target;
}

export function afterVerifyTarget(
  result: "ok" | "invalid_token",
  me: Me | null,
): { status: "verified" | "invalid"; next: string } {
  if (result === "ok") return { status: "verified", next: me ? "/" : "/login" };
  // A second click on the same link gets invalid_token. The user is verified, so it is a success.
  if (me?.user.email_verified) return { status: "verified", next: "/" };
  return { status: "invalid", next: me ? "/verify-email" : "/login" };
}

export function showSwitcher(me: Me | null): boolean {
  return (me?.memberships.length ?? 0) >= 2;
}

export function readLastTenant(): string | null {
  try {
    return localStorage.getItem(LAST_TENANT_KEY);
  } catch {
    return null;
  }
}

export function writeLastTenant(id: string): void {
  try {
    localStorage.setItem(LAST_TENANT_KEY, id);
  } catch {
    // Storage is not available. The app still works without it.
  }
}
