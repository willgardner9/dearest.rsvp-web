import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "./client";
import { configureApiClient } from "./clientConfig";
import { getHealth, logout, requestPasswordReset } from "./generated";

const BASE_URL = "http://api.test";

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentRequest(fetchMock: ReturnType<typeof mockFetch>): Request {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return fetchMock.mock.calls[0][0] as Request;
}

describe("configureApiClient", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
    configureApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends credentials include", async () => {
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ status: "ok", db: "up" }), { status: 200 }),
    );

    await getHealth();

    expect(sentRequest(fetchMock).credentials).toBe("include");
  });

  it("puts the base URL from VITE_API_BASE_URL before the path", async () => {
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ status: "ok", db: "up" }), { status: 200 }),
    );

    await getHealth();

    expect(sentRequest(fetchMock).url).toBe(`${BASE_URL}/health`);
  });

  it("returns the parsed JSON body as data", async () => {
    mockFetch(new Response(JSON.stringify({ status: "ok", db: "up" }), { status: 200 }));

    const { data } = await getHealth();

    expect(data).toEqual({ status: "ok", db: "up" });
  });

  it("throws an ApiError with the status and body on a failed response", async () => {
    mockFetch(new Response(JSON.stringify({ error: "internal" }), { status: 500 }));

    const error = await getHealth().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).body).toEqual({ error: "internal" });
  });

  it("throws an ApiError with a null body on an empty failed response", async () => {
    mockFetch(new Response(null, { status: 401 }));

    const error = await logout().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).body).toBeNull();
  });

  it("returns null data for a 204 response", async () => {
    mockFetch(new Response(null, { status: 204 }));

    const { data } = await logout();

    expect(data).toBeNull();
  });

  it("returns null data for a 202 response with an empty body", async () => {
    mockFetch(new Response(null, { status: 202 }));

    const { data } = await requestPasswordReset({ body: { email: "a@example.com" } });

    expect(data).toBeNull();
  });
});
