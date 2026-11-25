import {
  AddressBookIcon,
  CalendarDotsIcon,
  EnvelopeSimpleIcon,
  GlobeIcon,
  PaperPlaneTiltIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { GuideStepId } from "./guideContent";

// One icon for each step. The guide and the navigation use the same icon.
export const STEP_ICONS: Record<GuideStepId, Icon> = {
  events: CalendarDotsIcon,
  website: GlobeIcon,
  guest_list: AddressBookIcon,
  save_the_dates: EnvelopeSimpleIcon,
  rsvps: PaperPlaneTiltIcon,
};
