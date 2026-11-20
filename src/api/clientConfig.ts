import { ApiError, parseBody } from "./client";
import { client } from "./generated/client.gen";

// The generated client calls this function in place of fetch.
// It gives the generated functions the same behavior as apiFetch:
// - A response that is not 2xx throws an ApiError(status, body).
// - A 2xx response with an empty body gives the data null.
async function apiClientFetch(request: Request): Promise<Response> {
  // Read globalThis.fetch at call time, so a test can replace it.
  const response = await globalThis.fetch(request);
  if (!response.ok) throw new ApiError(response.status, await parseBody(response));

  const text = await response.clone().text();
  if (text) return response;
  // The generated client gives {} for an empty body. A JSON "null" body makes
  // it give null. A 204 response cannot have a body, so the status becomes 200.
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "application/json");
  headers.delete("Content-Length");
  return new Response("null", { status: 200, statusText: response.statusText, headers });
}

// Configure the generated client. Call this one time in the app entry file,
// before the first request.
export function configureApiClient(): void {
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
    // The session is an HttpOnly cookie. Send it on every call.
    credentials: "include",
    fetch: apiClientFetch as typeof fetch,
    // The API always sends JSON. apiFetch also parses JSON and ignores the
    // Content-Type header.
    parseAs: "json",
    throwOnError: true,
  });
}
