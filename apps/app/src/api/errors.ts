import { ApiError } from "./client";
import type { ErrorCode } from "./generated";

// Every value of the generated `ErrorCode` type.
const ERROR_CODES = [
  "invalid_input",
  "invalid_token",
  "unauthenticated",
  "invalid_credentials",
  "email_not_verified",
  "forbidden_origin",
  "invite_email_mismatch",
  "not_found",
  "email_taken",
  "already_member",
  "rate_limited",
  "internal",
] as const satisfies readonly ErrorCode[];

// This line is a compile error if a generated code is not in `ERROR_CODES`.
const _exhaustive: ErrorCode extends (typeof ERROR_CODES)[number] ? true : never = true;
void _exhaustive;

const MESSAGES: Partial<Record<ErrorCode, string>> = {
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
// An unknown code gives null.
export function errorCode(error: unknown): ErrorCode | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body;
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    const code = body.error;
    return (ERROR_CODES as readonly string[]).includes(code) ? (code as ErrorCode) : null;
  }
  return null;
}

// Returns user-facing copy for an error. Never shows the raw code.
export function errorMessage(error: unknown): string {
  const code = errorCode(error);
  return (code && MESSAGES[code]) || FALLBACK;
}
