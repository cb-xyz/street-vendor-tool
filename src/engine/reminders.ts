/**
 * Operational ("on-the-day") reminders that cannot be pre-encoded per segment but must be
 * surfaced whenever a vendor lands on a permitted or restricted spot. Spec §3, §6.
 */
import { CITES } from './citations';
import type { Reason, VendorConfig } from './types';

export function buildReminders(config: VendorConfig): Reason[] {
  const common: Reason[] = [
    {
      icon: '📍',
      code: 'ON_SIDEWALK',
      title: 'Only on the public sidewalk',
      detail: 'Not the roadway, a driveway, a building entrance, a plaza, or a park. Make sure your spot is the sidewalk.',
      citation: CITES.SIDEWALK_CLEARANCE,
    },
    {
      icon: '🛞',
      code: 'CURB_PLACEMENT',
      title: 'Set up at the curb',
      detail: 'Curb side of the sidewalk — never against the building.',
      citation: CITES.CURB_PLACEMENT,
    },
    {
      icon: '🚫',
      code: 'NO_FURNITURE_CONTACT',
      title: "Don't touch street furniture",
      detail: 'Keep clear of lampposts, meters, hydrants, tree boxes, benches, bus shelters, and trash cans.',
      citation: CITES.NO_FURNITURE_CONTACT,
    },
    {
      icon: '🕳️',
      code: 'NO_GRATES',
      title: 'Avoid grates & manholes',
      detail: "Don't set up over a grate, cellar door, manhole, or subway grating.",
      citation: CITES.NO_GRATES,
    },
  ];

  if (config.vendorType === 'food') {
    common.push(
      {
        icon: '📐',
        code: 'MFV_FOOTPRINT',
        title: 'Cart alignment & cover',
        detail: 'Longest side parallel to the curb; keep a cover (umbrella) over the food.',
        citation: CITES.MFV_FOOTPRINT,
      },
      {
        icon: '🅿️',
        code: 'METERED_PARKING',
        title: 'No metered spaces',
        detail: "If vending from the roadway, don't use a metered parking space.",
        citation: CITES.METERED_PARKING,
      },
    );
  } else {
    // Merchandise and First Amendment vendors share the GV footprint/display rules.
    common.push({
      icon: '📐',
      code: 'GV_FOOTPRINT',
      title: 'Stay within size limits',
      detail: 'Max 8 ft × 3 ft, 5 ft tall. Use a table or rack — no goods on the ground. No electricity.',
      citation: CITES.GV_FOOTPRINT,
    });
  }

  return common;
}
