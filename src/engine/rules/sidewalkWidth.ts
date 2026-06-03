/**
 * §10 step 6 — Minimum sidewalk clearance (12 ft clear pedestrian path).
 *
 * <12 ft clear → PROHIBITED. 12–15 ft → RESTRICTED with a warning. ≥15 ft → continue.
 * Applies to all vendor types. Source: §17-315(a) / §20-465(a), engineer doc §3.1.
 */
import { CITES } from '../citations';
import type { Rule } from '../types';

export const sidewalkWidth: Rule = ({ facts }) => {
  const ft = facts.sidewalkClearFt;
  if (ft == null) return { stop: false };

  if (ft < 12) {
    return {
      stop: true,
      status: 'prohibited',
      title: 'Sidewalk too narrow',
      reasons: [
        {
          icon: '📏',
          code: 'SIDEWALK_TOO_NARROW',
          title: `Only ${ft} ft clear — under the 12 ft minimum`,
          detail: 'A vendor must always leave at least 12 ft of clear walkway for pedestrians.',
          citation: CITES.SIDEWALK_CLEARANCE,
        },
      ],
    };
  }

  if (ft < 15) {
    return {
      stop: true,
      status: 'restricted',
      title: 'Tight sidewalk — check clearance',
      reasons: [
        {
          icon: '📏',
          code: 'SIDEWALK_TIGHT',
          title: `${ft} ft clear — close to the 12 ft minimum`,
          detail:
            'You must still leave 12 ft of clear walkway after placing your cart. Measure carefully before setting up.',
          citation: CITES.SIDEWALK_CLEARANCE,
        },
      ],
    };
  }

  return { stop: false };
};
