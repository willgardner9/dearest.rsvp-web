import { describe, expect, it } from "vite-plus/test";
import { GUIDE_GROUPS, guideStep } from "./guideContent";

const allSteps = GUIDE_GROUPS.flatMap((g) => g.steps);

describe("guideContent", () => {
  it("guide_groups_have_the_spec_titles", () => {
    expect(GUIDE_GROUPS.map((g) => g.title)).toEqual([
      "Your wedding",
      "Your guests",
      "Messages to your guests",
    ]);
  });

  it("guide_groups_hold_the_spec_steps", () => {
    expect(GUIDE_GROUPS.map((g) => g.steps.map((s) => s.id))).toEqual([
      ["events", "website"],
      ["guest_list"],
      ["save_the_dates", "rsvps"],
    ]);
  });

  it("guide_nav_labels_are_short", () => {
    expect(GUIDE_GROUPS.map((g) => g.navTitle)).toEqual(["Wedding", "Guests", "Messages"]);
    expect(allSteps.map((s) => s.navLabel)).toEqual([
      "Events",
      "Website",
      "Guest list",
      "Save the dates",
      "RSVPs",
    ]);
  });

  it("guide_needs_match_the_spec", () => {
    const needs = Object.fromEntries(allSteps.map((s) => [s.id, [...s.needs]]));
    expect(needs).toEqual({
      events: [],
      website: [],
      guest_list: [],
      save_the_dates: ["guest_list"],
      rsvps: ["events", "guest_list", "website"],
    });
  });

  it("guide_step_finds_each_step_by_id", () => {
    for (const step of allSteps) expect(guideStep(step.id)).toBe(step);
  });

  it("guide_website_names_security_levels_and_recommends_pin", () => {
    const d = guideStep("website").description;
    expect(d.toLowerCase()).toContain("open");
    expect(d.toLowerCase()).toContain("password");
    expect(d).toMatch(/PIN[^.]*recommended/);
  });

  it("guide_events_hold_the_rsvp_questions", () => {
    const d = guideStep("events").description.toLowerCase();
    expect(d).toContain("meal");
    expect(d).toContain("dietary");
  });

  it("guide_guest_list_holds_invitations_and_replies", () => {
    const d = guideStep("guest_list").description.toLowerCase();
    expect(d).toContain("invited to which event");
    expect(d).toContain("replies");
  });

  it("guide_save_the_dates_needs_no_reply_and_names_channels", () => {
    const d = guideStep("save_the_dates").description.toLowerCase();
    expect(d).toContain("reply");
    expect(d).toContain("email");
    expect(d).toContain("whatsapp");
  });

  it("guide_rsvps_ask_for_replies_on_the_website", () => {
    expect(guideStep("rsvps").description.toLowerCase()).toContain("website");
  });

  it("guide_copy_never_says_tenant", () => {
    const all = [
      ...GUIDE_GROUPS.map((g) => g.title),
      ...allSteps.flatMap((s) => [s.title, s.shortName, s.description]),
    ];
    for (const text of all) expect(text.toLowerCase()).not.toContain("tenant");
  });
});
