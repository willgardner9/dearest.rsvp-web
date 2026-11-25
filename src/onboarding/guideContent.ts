// The copy for the guide on the wedding home page. Every member sees the same guide.

export type GuideStepId = "guest_list" | "save_the_dates" | "rsvp";

export type GuideStep = { id: GuideStepId; title: string; description: string };

export const GUIDE_INTRO = "Each step is optional. Do the ones that fit you.";

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: "guest_list",
    title: "Build your guest list",
    description:
      "Import your guests, or send a contact form that anyone can fill in. You then sort the replies into your guest list.",
  },
  {
    id: "save_the_dates",
    title: "Send save the dates",
    description:
      "Tell guests the date early. They do not need to reply. Send by email or WhatsApp.",
  },
  {
    id: "rsvp",
    title: "Collect RSVPs",
    description:
      "Guests reply for each event. You choose the site security: open, password or PIN. PIN is recommended.",
  },
];

export const GUIDE_PATHS: readonly string[] = [
  "Import guests, then send RSVPs.",
  "Import guests, send save the dates, then send RSVPs months later.",
  "Collect contact details, send save the dates, then send RSVPs.",
];
