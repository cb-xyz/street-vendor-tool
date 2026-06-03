/**
 * Operational ("on-the-day") reminders that cannot be pre-encoded per segment but must be
 * surfaced whenever a vendor lands on a permitted or restricted spot. Spec §3, §6.
 */
import { CITES } from './citations';
import type { Reason, VendorConfig } from './types';

export function buildReminders(config: VendorConfig): Reason[] {
  const common: Reason[] = [
    {
      icon: '🛞',
      code: 'CURB_PLACEMENT',
      title: 'Set up at the curb',
      detail: 'Place your cart or stand on the street side of the sidewalk — never against the building line.',
      citation: CITES.CURB_PLACEMENT,
    },
    {
      icon: '🚫',
      code: 'NO_FURNITURE_CONTACT',
      title: "Don't touch street furniture",
      detail:
        'Nothing of yours may touch or lean on lampposts, parking meters, mailboxes, hydrants, tree boxes, benches, bus shelters, trash cans, or barriers.',
      citation: CITES.NO_FURNITURE_CONTACT,
    },
    {
      icon: '🕳️',
      code: 'NO_GRATES',
      title: 'Avoid grates & manholes',
      detail:
        'Do not set up over any ventilation grate, cellar door, manhole, or subway grating. (No citywide map exists for these — check on site.)',
      citation: CITES.NO_GRATES,
    },
  ];

  if (config.vendorType === 'food') {
    common.push(
      {
        icon: '📐',
        code: 'MFV_FOOTPRINT',
        title: 'Cart alignment & cover',
        detail:
          'The longest side of the cart must be parallel to the curb, and you must keep a cover (e.g. umbrella) over the food.',
        citation: CITES.MFV_FOOTPRINT,
      },
      {
        icon: '🅿️',
        code: 'METERED_PARKING',
        title: 'No metered spaces',
        detail: 'If vending from the roadway, you may not operate from a metered parking space.',
        citation: CITES.METERED_PARKING,
      },
    );
  } else {
    // Merchandise and First Amendment vendors share the GV footprint/display rules.
    common.push({
      icon: '📐',
      code: 'GV_FOOTPRINT',
      title: 'Stay within size limits',
      detail:
        'Max 8 ft along the curb, 3 ft deep, 5 ft tall (umbrella may be higher). Use a table/rack — no goods on the ground. No electricity or fuel-powered equipment.',
      citation: CITES.GV_FOOTPRINT,
    });
  }

  return common;
}
