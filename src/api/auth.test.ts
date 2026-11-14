import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "./client";
import { QueryClient } from "@tanstack/react-query";
import { fetchMe, meKeys, refreshMe } from "./auth";
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
