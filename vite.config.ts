import { defineConfig } from "vite-plus";

// Settings for the commands that run from the repository root.
export default defineConfig({
  fmt: {
    // The generator writes this folder. Git does not track it. Do not format it.
    ignorePatterns: ["apps/app/src/api/generated/**"],
  },
});
