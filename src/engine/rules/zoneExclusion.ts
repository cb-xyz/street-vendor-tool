/**
 * §10 step 3 — Zone exclusions by license SKU.
 *
 * Covers: WTC zone (with MFV street exceptions), Midtown Core, C4/C5/C6 commercial zoning,
 * Flushing — for merchandise/First Amendment vendors; plus license-geography gates for food
 * (borough-specific and Green Cart precinct).
 *
 * ⚠️ BLOCKED — CONFLICT C-1: WTC boundary geometry (verdicts flagged `unverified`).
 * ⚠️ BLOCKED — CONFLICT C-2: First Amendment treatment in contested zones (Blue-equivalent vs
 *    general-vendor) is undetermined. We do NOT guess — FA in a contested zone returns an
 *    `unverified` result asking the vendor to confirm, rather than a confident green/red.
 * Note: no license-cap logic anywhere (CONFLICT C-3 — engine stays cap-agnostic).
 */
import { CITES } from '../citations';
import type { LicenseSubType, Rule } from '../types';

const C1_NOTE =
  'WTC boundary is pending legal confirmation (conflict C-1: Barclay vs Vesey St). Provisional — verify before relying.';
const C2_NOTE =
  'How First Amendment vendors are treated in this zone is not yet legally confirmed (conflict C-2: same as Blue licensees, or same as general vendors?). This is undetermined — confirm with DCWP / SBS Legal before vending.';

function isCommercialExclusionZone(zoningDistrict?: string): boolean {
  if (!zoningDistrict) return false;
  return /^C[456]/.test(zoningDistrict);
}

/** Yellow & Blue specialized licenses (disabled-veteran) are exempt from C4/C5/C6 + Flushing. */
function isSpecialized(license: LicenseSubType): boolean {
  return license === 'yellow' || license === 'blue';
}

export const zoneExclusion: Rule = ({ config, facts }) => {
  const { vendorType, license } = config;

  // --- WTC zone (both vendor types) — C-1 unverified ---
  if (facts.inWtcZone) {
    const mock = ['WTC boundary (C-1 unverified)'];
    if (facts.wtcMfvException) {
      // Named exception street within the WTC zone. Allowed, but still provisional.
      return {
        stop: false,
        unverified: true,
        mockLayers: mock,
        reasons: [
          {
            icon: '⚠️',
            code: 'WTC_EXCEPTION',
            title: 'WTC zone — exception street',
            detail: `This is one of the named exception streets within the WTC zone. ${C1_NOTE}`,
            citation: CITES.WTC_ZONE,
          },
        ],
      };
    }
    return {
      stop: true,
      status: 'prohibited',
      title: 'World Trade Center Zone',
      unverified: true,
      mockLayers: mock,
      reasons: [
        {
          icon: '⛔',
          code: 'WTC_ZONE',
          title: 'No vending in this zone',
          detail: `Vending is prohibited throughout the WTC zone (limited named-street exceptions for food vendors). ${C1_NOTE}`,
          citation: CITES.WTC_ZONE,
        },
      ],
    };
  }

  // --- Food license geography (borough-specific, Green Cart precinct) ---
  if (vendorType === 'food') {
    if (license === 'borough') {
      if (config.permittedBorough && facts.borough !== config.permittedBorough) {
        return {
          stop: true,
          status: 'prohibited',
          title: `Borough permit not valid in ${facts.borough}`,
          reasons: [
            {
              icon: '🗽',
              code: 'BOROUGH_MISMATCH',
              title: `Your permit is for ${config.permittedBorough} only`,
              detail:
                'Borough-specific food permits are valid in a single outer borough and never in Manhattan.',
              citation: CITES.BOROUGH_PERMIT,
            },
          ],
        };
      }
    }

    if (license === 'greenCart') {
      const inAssignedPrecinct =
        !!facts.greenCartPrecinct &&
        !!config.greenCartPrecinct &&
        facts.greenCartPrecinct === config.greenCartPrecinct;
      if (!inAssignedPrecinct) {
        return {
          stop: true,
          status: 'prohibited',
          title: 'Outside your Green Cart precinct',
          reasons: [
            {
              icon: '🥬',
              code: 'GREEN_CART_OUT_OF_PRECINCT',
              title: 'Wrong precinct for this Green Cart permit',
              detail:
                'Green Cart permits are only valid in the police precinct printed on your decal.',
              citation: CITES.GREEN_CART,
            },
          ],
        };
      }
      // In the assigned precinct — allowed, with a product reminder.
      return {
        stop: false,
        reasons: [
          {
            icon: '🥬',
            code: 'GREEN_CART_OK',
            title: 'Inside your Green Cart precinct',
            detail: 'You may sell whole fresh fruits, vegetables, water, and raw single-ingredient nuts only.',
            citation: CITES.GREEN_CART,
          },
        ],
      };
    }
  }

  // --- GV zone exclusions (merchandise + First Amendment) ---
  // Food vendors are not subject to these zoning rules.
  if (vendorType === 'merch' || vendorType === 'firstAmendment') {
    // Midtown Core — requires Blue. Checked before C-zones because Yellow is exempt from
    // C4/C5/C6 citywide but NOT from the Midtown Core.
    if (facts.inMidtownCore) {
      if (vendorType === 'firstAmendment') {
        return faContested('MIDTOWN_CORE_FA', 'Midtown Core', CITES.MIDTOWN_CORE);
      }
      if (license === 'blue') {
        return {
          stop: false,
          reasons: [
            {
              icon: '🔵',
              code: 'MIDTOWN_CORE_BLUE',
              title: 'Midtown Core — your Blue license allows it',
              detail: 'Blue (Midtown Core) specialized licensees may vend within the Midtown Core.',
              citation: CITES.MIDTOWN_CORE,
            },
          ],
        };
      }
      return {
        stop: true,
        status: 'prohibited',
        title: 'Midtown Core Zone',
        reasons: [
          {
            icon: '⛔',
            code: 'MIDTOWN_CORE',
            title: 'Blue license required',
            detail:
              'Only Blue (Midtown Core) specialized licensees — reserved for disabled veterans — may vend in the Midtown Core. Standard and Yellow licenses cannot.',
            citation: CITES.MIDTOWN_CORE,
          },
        ],
      };
    }

    // C4/C5/C6 commercial zoning.
    if (isCommercialExclusionZone(facts.zoningDistrict)) {
      if (vendorType === 'firstAmendment') {
        return faContested('COMMERCIAL_ZONE_FA', `a ${facts.zoningDistrict} commercial zone`, CITES.ZONING_EXCLUSION);
      }
      if (isSpecialized(license)) {
        return {
          stop: false,
          reasons: [
            {
              icon: '🟡',
              code: 'COMMERCIAL_ZONE_EXEMPT',
              title: 'Commercial zone — your specialized license is exempt',
              detail: `Yellow and Blue specialized licenses may vend in C4/C5/C6 zones (here: ${facts.zoningDistrict}).`,
              citation: CITES.ZONING_EXCLUSION,
            },
          ],
        };
      }
      return {
        stop: true,
        status: 'prohibited',
        title: `Commercial zone (${facts.zoningDistrict})`,
        reasons: [
          {
            icon: '⛔',
            code: 'COMMERCIAL_ZONE',
            title: 'Standard license not allowed here',
            detail:
              'Standard general-vendor licenses cannot vend in C4, C5, or C6 commercial zones. Only Yellow or Blue specialized licenses may.',
            citation: CITES.ZONING_EXCLUSION,
          },
        ],
      };
    }

    // Flushing exclusion zone.
    if (facts.inFlushingZone) {
      if (vendorType === 'firstAmendment') {
        return faContested('FLUSHING_FA', 'the Downtown Flushing zone', CITES.FLUSHING_ZONE);
      }
      if (isSpecialized(license)) {
        return {
          stop: false,
          reasons: [
            {
              icon: '🟡',
              code: 'FLUSHING_EXEMPT',
              title: 'Flushing zone — your specialized license is exempt',
              detail: 'Yellow and Blue specialized licenses may vend in the Downtown Flushing zone.',
              citation: CITES.FLUSHING_ZONE,
            },
          ],
        };
      }
      return {
        stop: true,
        status: 'prohibited',
        title: 'Downtown Flushing Zone',
        reasons: [
          {
            icon: '⛔',
            code: 'FLUSHING',
            title: 'Standard license not valid here',
            detail:
              'Standard general-vendor licenses cannot vend in the Downtown Flushing zone. Yellow or Blue licenses are exempt.',
            citation: CITES.FLUSHING_ZONE,
          },
        ],
      };
    }
  }

  return { stop: false };
};

/** First Amendment vendor in a zone whose treatment is unresolved (conflict C-2). */
function faContested(code: string, zoneLabel: string, citation: string): ReturnType<Rule> {
  return {
    stop: true,
    status: 'restricted',
    title: `${zoneLabel} — needs confirmation`,
    unverified: true,
    reasons: [
      {
        icon: '❓',
        code,
        title: 'First Amendment placement here is undetermined',
        detail: C2_NOTE,
        citation,
      },
    ],
  };
}
