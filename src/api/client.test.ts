import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError, apiFetch } from "./client";

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed JSON body", async () => {
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ status: "ok", db: "up" }), { status: 200 }),
    );

    await expect(apiFetch("/health")).resolves.toEqual({ status: "ok", db: "up" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/health$/);
  });

  it("throws an ApiError with the status and body on a failed response", async () => {
    mockFetch(new Response(JSON.stringify({ status: "degraded" }), { status: 503 }));

    const error = await apiFetch("/health").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(503);
    expect((error as ApiError).body).toEqual({ status: "degraded" });
  });

  it("returns null for an empty body", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiFetch("/empty")).resolves.toBeNull();
  });
});
