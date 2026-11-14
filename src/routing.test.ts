import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { Me } from "./api/types";
import {
  afterVerifyTarget,
  readLastTenant,
  resolveHome,
  safeRedirect,
  showSwitcher,
  writeLastTenant,
} from "./routing";

function makeMe(verified: boolean, tenantIds: string[]): Me {
  return {
    user: { id: "u1", email: "a@example.com", name: "A", email_verified: verified },
    memberships: tenantIds.map((id) => ({ tenant_id: id, tenant_name: `Wedding ${id}` })),
  };
}

describe("resolveHome", () => {
  it("resolveHome_without_me_goes_to_login", () => {
    expect(resolveHome(null, null)).toBe("/login");
  });

  it("resolveHome_unverified_goes_to_verify_email", () => {
    expect(resolveHome(makeMe(false, ["a"]), null)).toBe("/verify-email");
  });

  it("resolveHome_without_tenants_goes_to_onboarding", () => {
    expect(resolveHome(makeMe(true, []), null)).toBe("/onboarding");
  });

  it("resolveHome_one_tenant_goes_to_it", () => {
    expect(resolveHome(makeMe(true, ["a"]), null)).toBe("/w/a");
  });

  it("resolveHome_uses_last_tenant_when_member", () => {
    expect(resolveHome(makeMe(true, ["a", "b"]), "b")).toBe("/w/b");
  });

  it("resolveHome_ignores_unknown_last_tenant", () => {
    expect(resolveHome(makeMe(true, ["a", "b"]), "gone")).toBe("/w/a");
  });
});

describe("safeRedirect", () => {
  it("safeRedirect_rejects_targets_that_the_url_parser_makes_external", () => {
    // The URL parser removes tab and newline characters, and reads "\\" as "/".
    for (const target of [
      "/\t/evil.example",
      "/\n/evil.example",
      "/\r\n/evil.example",
      "\\/evil.example",
    ]) {
      expect(safeRedirect(target)).toBe("/");
    }
    expect(new URL(safeRedirect("/\t/evil.example"), "https://app.example").origin).toBe(
      "https://app.example",
    );
  });

  it("safeRedirect_accepts_local_path", () => {
    expect(safeRedirect("/w/a/members")).toBe("/w/a/members");
  });

  it("safeRedirect_rejects_external_targets", () => {
    for (const target of [
      "//evil.example",
      "/\\evil.example",
      "https://evil.example",
      "",
      undefined,
    ]) {
      expect(safeRedirect(target)).toBe("/");
    }
  });
});

describe("afterVerifyTarget", () => {
  it("afterVerifyTarget_without_session_goes_to_login", () => {
    expect(afterVerifyTarget("ok", null)).toEqual({ status: "verified", next: "/login" });
    expect(afterVerifyTarget("ok", makeMe(true, []))).toEqual({ status: "verified", next: "/" });
  });

  it("afterVerifyTarget_treats_invalid_token_as_success_when_verified", () => {
    expect(afterVerifyTarget("invalid_token", makeMe(true, []))).toEqual({
      status: "verified",
      next: "/",
    });
  });

  it("afterVerifyTarget_invalid_token_unverified_is_invalid", () => {
    expect(afterVerifyTarget("invalid_token", makeMe(false, []))).toEqual({
      status: "invalid",
      next: "/verify-email",
    });
    expect(afterVerifyTarget("invalid_token", null)).toEqual({ status: "invalid", next: "/login" });
  });
});

describe("showSwitcher", () => {
  it("showSwitcher_false_for_0_and_1_true_for_2", () => {
    expect(showSwitcher(null)).toBe(false);
    expect(showSwitcher(makeMe(true, []))).toBe(false);
    expect(showSwitcher(makeMe(true, ["a"]))).toBe(false);
    expect(showSwitcher(makeMe(true, ["a", "b"]))).toBe(true);
  });
});

describe("last tenant storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lastTenant_storage_survives_throwing_localStorage", () => {
    const fail = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", { getItem: fail, setItem: fail });
    expect(readLastTenant()).toBeNull();
    expect(() => writeLastTenant("a")).not.toThrow();
  });

  it("lastTenant_storage_round_trips", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    });
    writeLastTenant("b");
    expect(store.get("dearest.lastTenantId")).toBe("b");
    expect(readLastTenant()).toBe("b");
  });
});
