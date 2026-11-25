// The copy for the guide on the wedding home page. Every member sees the same guide.
// The steps form a graph, not a sequence: a couple can start at any step.
// So the guide groups the steps and does not number them.

export type GuideStepId = "events" | "website" | "guest_list" | "save_the_dates" | "rsvps";

export type GuideStep = {
  id: GuideStepId;
  title: string;
  // The name that a "Needs" line uses for this step.
  shortName: string;
  // The label of this step in the navigation.
  navLabel: string;
  description: string;
  // The steps that this step needs first. The guide states them. It does not enforce them.
  needs: readonly GuideStepId[];
};

export type GuideGroup = {
  id: string;
  title: string;
  // The title of this group in the navigation.
  navTitle: string;
  steps: readonly GuideStep[];
};

export const GUIDE_GROUPS: readonly GuideGroup[] = [
  {
    id: "wedding",
    title: "Your wedding",
    navTitle: "Wedding",
    steps: [
      {
        id: "events",
        title: "Add your events",
        shortName: "events",
        navLabel: "Events",
        description:
          "The ceremony, the reception, the golf the day after. Add the questions guests answer, such as meal choice and dietary needs.",
        needs: [],
      },
      {
        id: "website",
        title: "Build your website",
        shortName: "website",
        navLabel: "Website",
        description:
          "Put your details online. Choose open, password or PIN to protect it. PIN is recommended.",
        needs: [],
      },
    ],
  },
  {
    id: "guests",
    title: "Your guests",
    navTitle: "Guests",
    steps: [
      {
        id: "guest_list",
        title: "Build your guest list",
        shortName: "guest list",
        navLabel: "Guest list",
        description:
          "Import your guests, or collect their contact details with a form. Choose who is invited to which event, and see their replies.",
        needs: [],
      },
    ],
  },
  {
    id: "messages",
    title: "Messages to your guests",
    navTitle: "Messages",
    steps: [
      {
        id: "save_the_dates",
        title: "Send save the dates",
        shortName: "save the dates",
        navLabel: "Save the dates",
        description: "Guests do not need to reply. Send by email or WhatsApp.",
        needs: ["guest_list"],
      },
      {
        id: "rsvps",
        title: "Send RSVP requests",
        shortName: "RSVPs",
        navLabel: "RSVPs",
        description:
          "Ask guests to reply on your website for each event, and remind the ones who have not.",
        needs: ["events", "guest_list", "website"],
      },
    ],
  },
];

export function guideStep(id: GuideStepId): GuideStep {
  for (const group of GUIDE_GROUPS) {
    const step = group.steps.find((s) => s.id === id);
    if (step) return step;
  }
  throw new Error(`Unknown guide step: ${id}`);
}
