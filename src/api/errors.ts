import { ApiError } from "./client";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "The email or password is not correct.",
  email_taken: "An account with this email already exists. Log in instead.",
  invalid_input: "Check the fields and try again.",
  invalid_token: "This link is not valid or has expired.",
  already_member: "This person is already a member of the wedding.",
  invite_email_mismatch: "This invite is for a different email address.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
  not_found: "We could not find that.",
};

const FALLBACK = "Something went wrong. Try again.";

// Returns the `error` code from an API error body, or null.
export function errorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body;
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return null;
}

// Returns user-facing copy for an error. Never shows the raw code.
export function errorMessage(error: unknown): string {
  const code = errorCode(error);
  return (code && Object.hasOwn(MESSAGES, code) && MESSAGES[code]) || FALLBACK;
}
