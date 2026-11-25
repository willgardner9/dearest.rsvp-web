import { describe, expect, it } from "vite-plus/test";
import { GUIDE_INTRO, GUIDE_PATHS, GUIDE_STEPS } from "./guideContent";

describe("guideContent", () => {
  it("guide_intro_says_steps_are_optional", () => {
    expect(GUIDE_INTRO).toBe("Each step is optional. Do the ones that fit you.");
  });

  it("guide_steps_are_in_order", () => {
    expect(GUIDE_STEPS.map((s) => s.id)).toEqual(["guest_list", "save_the_dates", "rsvp"]);
  });

  it("guide_guest_list_mentions_import_and_contact_form", () => {
    const d = GUIDE_STEPS[0].description.toLowerCase();
    expect(d).toContain("import");
    expect(d).toContain("contact");
  });

  it("guide_save_the_dates_needs_no_reply_and_names_channels", () => {
    const d = GUIDE_STEPS[1].description.toLowerCase();
    expect(d).toContain("reply");
    expect(d).toContain("email");
    expect(d).toContain("whatsapp");
  });

  it("guide_rsvp_names_security_levels_and_recommends_pin", () => {
    const d = GUIDE_STEPS[2].description;
    expect(d.toLowerCase()).toContain("open");
    expect(d.toLowerCase()).toContain("password");
    expect(d).toMatch(/PIN[^.]*recommended/);
  });

  it("guide_has_three_example_paths", () => {
    expect(GUIDE_PATHS).toHaveLength(3);
  });

  it("guide_copy_never_says_tenant", () => {
    const all = [
      GUIDE_INTRO,
      ...GUIDE_PATHS,
      ...GUIDE_STEPS.flatMap((s) => [s.title, s.description]),
    ];
    for (const text of all) expect(text.toLowerCase()).not.toContain("tenant");
  });
});
