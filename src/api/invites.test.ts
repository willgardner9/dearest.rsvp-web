import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { configureApiClient } from "./clientConfig";
import { acceptInviteRequest, fetchInvitePreview, fetchInvites } from "./invites";

function mockFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof mockFetch>): string {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return (fetchMock.mock.calls[0][0] as Request).url;
}

describe("invites", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.test");
    configureApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("list_invites_accepts_null_inviter", async () => {
    const invites = [
      {
        id: "i1",
        email: "a@example.com",
        invited_by_name: null,
        expires_at: "2030-01-01T00:00:00Z",
      },
    ];
    mockFetch(invites);
    await expect(fetchInvites("t1")).resolves.toEqual(invites);
  });

  it("invite_path_parameters_are_encoded", async () => {
    const fetchMock = mockFetch({});
    await fetchInvitePreview("a/b c");
    expect(requestedUrl(fetchMock)).toBe("http://api.test/invites/a%2Fb%20c");
  });

  it("accept_without_body_sends_no_body", async () => {
    const fetchMock = mockFetch({ tenant_id: "t1" });
    await acceptInviteRequest("tok", undefined);
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toBe("http://api.test/invites/tok/accept");
    expect(request.method).toBe("POST");
    expect(await request.text()).toBe("");
  });

  it("accept_with_account_sends_json_body", async () => {
    const fetchMock = mockFetch({ tenant_id: "t1" });
    await acceptInviteRequest("tok", { name: "A", password: "p" });
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(await request.text()).toBe('{"name":"A","password":"p"}');
  });
});
