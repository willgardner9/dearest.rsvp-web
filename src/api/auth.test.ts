import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "./client";
import { fetchMe } from "./auth";

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
