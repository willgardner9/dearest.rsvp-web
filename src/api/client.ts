const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type ApiFetchInit = RequestInit & { json?: unknown };

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { json, ...rest } = init ?? {};
  const headers: Record<string, string> = { Accept: "application/json" };
  if (json !== undefined) headers["Content-Type"] = "application/json";
  // The Headers class accepts all three header forms. Its keys are in lower case.
  // A caller header replaces a default header with the same name.
  const extra = Object.fromEntries(new Headers(rest.headers));
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() in extra) delete headers[name];
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method: rest.method ?? (json !== undefined ? "POST" : undefined),
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    // The session is an HttpOnly cookie. Send it on every call.
    credentials: "include",
    headers: { ...headers, ...extra },
  });
  const body = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}
