/**
 * §10 step 1 — Out-of-scope mask (parks, pedestrian plazas).
 *
 * These surfaces are governed by separate licensing regimes (DPR concessions, DOT plaza
 * concessions), NOT by §17-315/§20-465. They are masked GRAY ("out of scope"), never RED —
 * a vendor with the right concession permit may be allowed there; this tool just doesn't cover it.
 */
import { CITES } from '../citations';
import type { Rule } from '../types';

export const outOfScope: Rule = ({ facts }) => {
  if (facts.outsideNyc) {
    return {
      stop: true,
      status: 'outOfScope',
      title: 'Outside New York City',
      reasons: [
        {
          icon: '🗺️',
          code: 'OUTSIDE_NYC',
          title: 'Not covered by this tool',
          detail:
            'This spot is outside the five boroughs (or in the water). This tool only covers vending on NYC public sidewalks.',
        },
      ],
    };
  }

  if (facts.inPark) {
    return {
      stop: true,
      status: 'outOfScope',
      title: 'Park — separate permit system',
      reasons: [
        {
          icon: '🌳',
          code: 'PARK',
          title: 'Not covered by this tool',
          detail:
            'Vending in NYC parks uses a separate Parks Department concession permit. A vendor with that permit may be allowed here — this tool does not cover that arrangement.',
          citation: CITES.PARKS_OUT_OF_SCOPE,
        },
      ],
    };
  }

  if (facts.inPedestrianPlaza) {
    return {
      stop: true,
      status: 'outOfScope',
      title: 'Pedestrian plaza — concession only',
      reasons: [
        {
          icon: '🟫',
          code: 'PLAZA',
          title: 'Not covered by this tool',
          detail:
            'DOT pedestrian plazas are concession-only and governed separately. This tool does not cover plaza concessions.',
          citation: CITES.PARKS_OUT_OF_SCOPE,
        },
      ],
    };
  }

  return { stop: false };
};
