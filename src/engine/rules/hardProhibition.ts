/**
 * §10 step 2 — Hard prohibition zones (WTC absolute, no-exception MFV segments, §17-315(k)(1)).
 *
 * ⚠️ BLOCKED — CONFLICT C-1 (see Open_Questions_Log.docx).
 * The WTC zone's north border is disputed (internal docs: Barclay St; official 2023 DCWP guide:
 * Vesey St). We do NOT commit WTC boundary geometry. The rule STRUCTURE lives here so precedence
 * is testable, but any WTC-derived verdict is flagged `unverified` and these facts are only ever
 * set from clearly-labeled mock fixtures — never from a shipped boundary layer.
 */
import { CITES } from '../citations';
import type { Rule } from '../types';

const WTC_C1_NOTE =
  'WTC boundary is pending legal confirmation (conflict C-1: Barclay vs Vesey St north border). This result is provisional and must be verified with SBS Legal / DCWP before relied upon.';

export const hardProhibition: Rule = ({ facts }) => {
  if (facts.inWtcAbsoluteSegment) {
    return {
      stop: true,
      status: 'prohibited',
      title: 'World Trade Center — no-exception street',
      unverified: true,
      mockLayers: ['WTC boundary (C-1 unverified)'],
      reasons: [
        {
          icon: '⛔',
          code: 'WTC_ABSOLUTE',
          title: 'Vending banned with no exceptions',
          detail: `This segment is an absolute no-vending street in the WTC area. ${WTC_C1_NOTE}`,
          citation: CITES.WTC_ZONE,
        },
      ],
    };
  }

  return { stop: false };
};
