import { describe, expect, it } from "vite-plus/test";
import { weddingSlug } from "./slug";

describe("weddingSlug", () => {
  it("weddingSlug_spells_out_ampersand", () => {
    expect(weddingSlug("Alex & Sam")).toBe("alex-and-sam");
  });

  it("weddingSlug_removes_accents", () => {
    expect(weddingSlug("Zoë & José")).toBe("zoe-and-jose");
  });

  it("weddingSlug_joins_other_characters_with_one_dash", () => {
    expect(weddingSlug("  Will + Julia's   Wedding!! 2027 ")).toBe("will-julia-s-wedding-2027");
  });

  it("weddingSlug_of_only_symbols_is_empty", () => {
    expect(weddingSlug("💍 ✨")).toBe("");
  });
});
