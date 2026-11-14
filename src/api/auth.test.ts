import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "./client";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { clearSession, fetchMe, meKeys, meQueryOptions, refreshMe } from "./auth";
import type { Me } from "./types";

function mockFetch(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

describe("fetchMe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchMe_returns_null_on_401", async () => {
    mockFetch(new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }));
    await expect(fetchMe()).resolves.toBeNull();
  });

  it("fetchMe_throws_on_500", async () => {
    mockFetch(new Response(JSON.stringify({ error: "internal" }), { status: 500 }));
    const error = await fetchMe().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });
});

describe("refreshMe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refreshMe_updates_cache_without_observer", async () => {
    const before: Me = {
      user: { id: "u", email: "a@example.com", name: "A", email_verified: true },
      memberships: [],
    };
    const after: Me = { ...before, memberships: [{ tenant_id: "t1", tenant_name: "A & B" }] };
    const queryClient = new QueryClient();
    queryClient.setQueryData(meKeys.all, before);
    mockFetch(new Response(JSON.stringify(after), { status: 200 }));

    await refreshMe(queryClient);

    expect(queryClient.getQueryData(meKeys.all)).toEqual(after);
  });
});

describe("clearSession", () => {
  it("clearSession_notifies_me_observer_and_removes_other_data", () => {
    const me: Me = {
      user: { id: "u", email: "a@example.com", name: "A", email_verified: true },
      memberships: [],
    };
    const queryClient = new QueryClient();
    queryClient.setQueryData(meKeys.all, me);
    queryClient.setQueryData(["tenants", "t1"], { id: "t1", name: "A & B" });
    const observer = new QueryObserver(queryClient, { ...meQueryOptions, enabled: false });
    const seen: unknown[] = [];
    const unsubscribe = observer.subscribe((result) => seen.push(result.data));

    clearSession(queryClient);

    expect(seen.at(-1)).toBeNull();
    expect(queryClient.getQueryData(["tenants", "t1"])).toBeUndefined();
    unsubscribe();
  });
});
