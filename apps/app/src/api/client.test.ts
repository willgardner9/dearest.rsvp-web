import { describe, expect, it } from "vite-plus/test";
import { ApiError, parseBody } from "./client";

describe("parseBody", () => {
  it("returns the parsed JSON body", async () => {
    const response = new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    await expect(parseBody(response)).resolves.toEqual({ status: "ok" });
  });

  it("returns the text if the body is not JSON", async () => {
    await expect(parseBody(new Response("oops", { status: 502 }))).resolves.toBe("oops");
  });

  it("returns null for an empty body", async () => {
    await expect(parseBody(new Response(null, { status: 204 }))).resolves.toBeNull();
  });
});

describe("ApiError", () => {
  it("keeps the status and the body", () => {
    const error = new ApiError(503, { error: "internal" });
    expect(error.status).toBe(503);
    expect(error.body).toEqual({ error: "internal" });
    expect(error.name).toBe("ApiError");
  });
});
