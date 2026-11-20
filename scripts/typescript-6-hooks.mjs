// The project uses TypeScript 7. TypeScript 7 has no JavaScript API.
// The generator @hey-api/openapi-ts imports that API from "typescript".
// This hook sends the "typescript" imports of @hey-api packages to the
// "typescript-6" package. .yarnrc.yml adds that package to the generator.
// Tested with @hey-api/openapi-ts 0.99.0.
// Load this file with `node --import` before the generator starts.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "typescript" && context.parentURL?.includes("/node_modules/@hey-api/")) {
      return nextResolve("typescript-6", context);
    }
    return nextResolve(specifier, context);
  },
});
