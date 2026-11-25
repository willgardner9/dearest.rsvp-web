# Onboarding Guide (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace "More is coming soon." on the wedding home page with a static guide that explains the three optional steps and the example paths.

**Architecture:** A pure data module holds the guide copy, so unit tests cover the copy without a browser. A `WeddingGuide` component renders that data with Mantine. `WeddingHomePage` shows the component under the wedding name. No API call, no state, no `localStorage`.

**Tech Stack:** React 19, Mantine 9 (`@mantine/core`), Vite+ (`vp`), Vitest through `vite-plus/test`.

**Spec:** `../dearest.rsvp-api/docs/superpowers/specs/2026-11-25-onboarding-design.md` (in the API repository). Background: `../dearest.rsvp-api/docs/product/vision.md`.

## Global Constraints

- Web only. No change to the API, to `src/api/`, to `/onboarding`, or to `WeddingNameForm`.
- The guide uses no state, no API call and no `localStorage`.
- Step order is exactly: guest list, save the dates, RSVP.
- Intro copy is exactly: "Each step is optional. Do the ones that fit you."
- Each step card shows a "Coming soon" badge. A card is not a link and is not clickable.
- The RSVP card names the three security levels (open, password, PIN) and says PIN is recommended.
- The "Example paths" section is collapsed by default.
- User-facing copy uses "wedding", not "tenant".
- Do not add a new dependency. There is no component test library in this repo; test the copy as data.
- Run `yarn fmt` before each commit. The pre-commit hook checks the format.

## Review Focus

1. **A couple reads a card as a working feature.** The card must have no link, no button and no hover style that suggests a click. Check: Task 2 manual step 3.
2. **Phone width (375 px).** The cards and the badge must wrap with no horizontal scroll. Check: Task 2 manual step 4.
3. **A long wedding name (200 characters, the API limit).** The `Title` on the home page must wrap and not push the guide off the screen. Check: Task 2 manual step 5.
4. **Keyboard use of "Example paths".** The toggle must be a real button that opens with Enter and Space and has `aria-expanded`. Check: Task 2 manual step 6.
5. **An invited member, not the creator.** The guide shows for every member. It must not depend on who made the wedding. Check: `WeddingGuide` takes no props and reads no query (Task 2 Interfaces). The reviewer rejects any prop or `useMe` call in it.

---

### Task 1: Guide copy as data

**Files:**

- Create: `src/onboarding/guideContent.ts`
- Test: `src/onboarding/guideContent.test.ts`
- Modify: `.gitignore` (add `.superpowers/` at the end)

**Interfaces:**

- Produces:

  ```ts
  export type GuideStepId = "guest_list" | "save_the_dates" | "rsvp";
  export type GuideStep = { id: GuideStepId; title: string; description: string };
  export const GUIDE_INTRO: string;
  export const GUIDE_STEPS: readonly GuideStep[];
  export const GUIDE_PATHS: readonly string[];
  ```

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `yarn test src/onboarding/guideContent.test.ts`
Expected: FAIL, the module `./guideContent` does not exist.

- [ ] **Step 3: Write `src/onboarding/guideContent.ts`**

Use this copy. The spec lets the builder change wording, but the tests pin the meaning.

| id               | title                 | description                                                                                                         |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `guest_list`     | Build your guest list | Import your guests, or send a contact form that anyone can fill in. You then sort the replies into your guest list. |
| `save_the_dates` | Send save the dates   | Tell guests the date early. They do not need to reply. Send by email or WhatsApp.                                   |
| `rsvp`           | Collect RSVPs         | Guests reply for each event. You choose the site security: open, password or PIN. PIN is recommended.               |

`GUIDE_PATHS`:

1. "Import guests, then send RSVPs."
2. "Import guests, send save the dates, then send RSVPs months later."
3. "Collect contact details, send save the dates, then send RSVPs."

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `yarn test src/onboarding/guideContent.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Add `.superpowers/` to `.gitignore`, format and commit**

```bash
yarn fmt
git add src/onboarding/guideContent.ts src/onboarding/guideContent.test.ts .gitignore
git commit -m "feat: add the onboarding guide copy"
```

---

### Task 2: `WeddingGuide` component on the home page

**Files:**

- Create: `src/components/WeddingGuide.tsx`
- Modify: `src/pages/WeddingHomePage.tsx` (replace `<Text>More is coming soon.</Text>`)

**Interfaces:**

- Consumes: `GUIDE_INTRO`, `GUIDE_STEPS`, `GUIDE_PATHS` from `src/onboarding/guideContent.ts` (Task 1).
- Produces: `export function WeddingGuide(): JSX.Element` with no props.

- [ ] **Step 1: Write `WeddingGuide`**

- `Text` for `GUIDE_INTRO`.
- One `Card` (`withBorder`) for each step in `GUIDE_STEPS` order. Each card has a `Group` (`justify="space-between"`, `wrap="nowrap"`, `align="flex-start"`) with a `Text fw={500}` title and a `Badge variant="light"` that says "Coming soon". Under it, a `Text size="sm" c="dimmed"` with the description. Use `key={step.id}`.
- A `Button variant="subtle"` labeled "See example paths" / "Hide example paths" that toggles a Mantine `Collapse`. Use `useDisclosure` from `@mantine/hooks`, default closed. Set `aria-expanded` on the button. Inside the `Collapse`, a `List` of `GUIDE_PATHS`.
- Wrap all of it in a `Stack`.

- [ ] **Step 2: Use it in `WeddingHomePage`**

Replace `<Text>More is coming soon.</Text>` with `<WeddingGuide />`. Remove the `Text` import if nothing else uses it.

- [ ] **Step 3: Run the checks**

Run: `yarn typecheck && yarn test && yarn fmt:check`
Expected: no type errors, all tests PASS, format check passes.

- [ ] **Step 4: Check it in the browser**

Start the API (`docker compose up --build` in `dearest.rsvp-api`) and `yarn dev`. Sign up with a new test user, verify the email, and create a wedding. Then check:

1. `/onboarding` is unchanged. After "Create wedding", the app goes to `/w/<id>`.
2. The home page shows the wedding name, the intro, three cards in order with "Coming soon", and a closed "See example paths" button.
3. No card is a link. The cursor does not change on a card.
4. At 375 px width, nothing scrolls sideways and the badges wrap or fit.
5. Rename is not in the app, so create a second wedding at `/new-wedding` with a 200-character name. The title wraps and the guide still shows.
6. Tab to "See example paths". Enter opens it and shows three paths. Space closes it. `aria-expanded` changes.

- [ ] **Step 5: Commit**

```bash
yarn fmt
git add src/components/WeddingGuide.tsx src/pages/WeddingHomePage.tsx
git commit -m "feat: show the onboarding guide on the wedding home page"
```
