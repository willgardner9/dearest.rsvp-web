import { defineConfig } from "@hey-api/openapi-ts";

// The generator reads the spec from the deployed API. This repository keeps no
// copy of the spec and no copy of the generated code.
// Set OPENAPI_URL to read the spec from another API, for example
// http://localhost:3000/openapi.json.
export default defineConfig({
  input: process.env.OPENAPI_URL ?? "https://api.dearest.rsvp/openapi.json",
  output: "src/api/generated",
  plugins: [
    // The generated functions throw on a non-2xx response.
    // `configureApiClient` changes the thrown value to an `ApiError`.
    { name: "@hey-api/client-fetch", throwOnError: true },
    "@hey-api/sdk",
    "@hey-api/typescript",
    "@tanstack/react-query",
  ],
});
