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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method: rest.method ?? (json !== undefined ? "POST" : undefined),
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    // The session is an HttpOnly cookie. Send it on every call.
    credentials: "include",
    headers: { ...headers, ...(rest.headers as Record<string, string> | undefined) },
  });
  const body = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}
