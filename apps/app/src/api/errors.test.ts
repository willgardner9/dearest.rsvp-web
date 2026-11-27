import { describe, expect, it } from "vite-plus/test";
import { ApiError } from "./client";
import { errorCode, errorMessage } from "./errors";

describe("errors", () => {
  it("maps_known_code", () => {
    const error = new ApiError(401, { error: "invalid_credentials" });
    expect(errorMessage(error)).toBe("The email or password is not correct.");
  });

  it("falls_back_for_unknown_code", () => {
    const error = new ApiError(500, { error: "internal" });
    expect(errorMessage(error)).toBe("Something went wrong. Try again.");
  });

  it("falls_back_for_non_api_error", () => {
    expect(errorMessage(new Error("network"))).toBe("Something went wrong. Try again.");
  });

  it("errorCode_reads_body", () => {
    expect(errorCode(new ApiError(409, { error: "email_taken" }))).toBe("email_taken");
    expect(errorCode(new ApiError(500, "oops"))).toBeNull();
    expect(errorCode(new Error("x"))).toBeNull();
  });

  it("messages_cover_known_codes_and_fall_back", () => {
    const fallback = "Something went wrong. Try again.";
    expect(errorMessage(new ApiError(401, { error: "invalid_credentials" }))).toBe(
      "The email or password is not correct.",
    );
    expect(errorMessage(new ApiError(400, { error: "not_a_real_code" }))).toBe(fallback);
    expect(errorCode(new ApiError(400, { error: "not_a_real_code" }))).toBeNull();
    expect(errorMessage(new ApiError(400, { message: "no error field" }))).toBe(fallback);
  });
});
