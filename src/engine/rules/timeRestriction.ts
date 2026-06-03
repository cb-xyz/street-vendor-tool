/**
 * §10 step 4 — Time- and season-based restrictions.
 *
 * Covers: seasonal MFV permit validity (Apr 1–Oct 31), DOHMH Restricted Streets list (food,
 * hours/days), and the Dyker Heights holiday-season restriction (merch).
 *
 * ⚠️ PRECEDENCE NOTE: the spec (§10) evaluates time restrictions BEFORE distance buffers and
 * stops at first match. That means a yellow time restriction is returned before a red buffer on
 * the same point is checked. This is implemented as specified ("implement exactly"), but it is a
 * flagged tension — a redder buffer rule could otherwise apply. See summary / open questions.
 */
import { CITES } from '../citations';
import {
  formatMinutes,
  isDykerHeightsSeason,
  isWithinAnyWindow,
  isWithinSeason,
} from '../time';
import type { DayWindow, Rule } from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function summarizeWindows(windows: DayWindow[]): string {
  return windows
    .map((w) => {
      const days = w.days.length === 7 ? 'every day' : w.days.map((d) => DAY_NAMES[d]).join(', ');
      return `${formatMinutes(w.startMinutes)}–${formatMinutes(w.endMinutes)} (${days})`;
    })
    .join('; ');
}

export const timeRestriction: Rule = ({ config, facts, at }) => {
  const { vendorType, license } = config;

  // --- Seasonal MFV permit validity (Apr 1 – Oct 31) ---
  if (vendorType === 'food' && license === 'seasonal') {
    if (at && !isWithinSeason(at, '04-01', '10-31')) {
      return {
        stop: true,
        status: 'prohibited',
        title: 'Seasonal permit not valid on this date',
        reasons: [
          {
            icon: '📅',
            code: 'SEASONAL_OUT_OF_SEASON',
            title: 'Seasonal permits run April 1 – October 31',
            detail: 'Your permit is not valid on the selected date.',
            citation: CITES.SEASONAL_PERMIT,
          },
        ],
      };
    }
  }

  // --- DOHMH Restricted Streets (food vendors only) ---
  if (vendorType === 'food' && facts.mfvRestriction) {
    const r = facts.mfvRestriction;
    const seasonApplies =
      r.yearRound ||
      (r.seasonalStart != null &&
        r.seasonalEnd != null &&
        at != null &&
        isWithinSeason(at, r.seasonalStart, r.seasonalEnd));

    // If the restriction is seasonal and we know the date is out of season, it doesn't apply.
    const seasonallyInactive = !r.yearRound && at != null && !seasonApplies;

    if (!seasonallyInactive) {
      const hours = summarizeWindows(r.restrictedWindows);
      let detail = `DOHMH restricts food vending on this street: ${hours}.`;
      if (at) {
        const blockedNow = isWithinAnyWindow(at, r.restrictedWindows);
        detail += blockedNow
          ? ' Right now is a restricted time — no vending allowed at this moment.'
          : ' Right now is outside the restricted hours — vending is allowed at this moment.';
      }
      return {
        stop: true,
        status: 'restricted',
        title: 'Restricted street (time limits)',
        mockLayers: facts.mockLayers?.includes('DOHMH restricted streets (mock)')
          ? ['DOHMH restricted streets (mock)']
          : undefined,
        reasons: [
          {
            icon: '⏰',
            code: 'MFV_RESTRICTED_STREET',
            title: 'Food vending limited here by time/day',
            detail,
            citation: CITES.MFV_RESTRICTED_STREETS,
          },
        ],
      };
    }
  }

  // --- Dyker Heights holiday season (merch standard only; specialized exempt) ---
  if (vendorType === 'merch' && facts.inDykerHeights) {
    if (license === 'yellow' || license === 'blue') {
      return {
        stop: false,
        reasons: [
          {
            icon: '🎄',
            code: 'DYKER_EXEMPT',
            title: 'Dyker Heights — your specialized license is exempt',
            detail: 'Yellow and Blue licenses are exempt from the Dyker Heights holiday restriction.',
            citation: CITES.DYKER_HEIGHTS,
          },
        ],
      };
    }

    // Standard license. The restriction applies Thanksgiving–New Year's Day.
    const inSeason = at ? isDykerHeightsSeason(at) : true; // without a date, surface the rule.
    if (inSeason) {
      // Restricted hours: midnight–6am and 2pm–midnight.
      const windows: DayWindow[] = [
        { days: [0, 1, 2, 3, 4, 5, 6], startMinutes: 0, endMinutes: 360 },
        { days: [0, 1, 2, 3, 4, 5, 6], startMinutes: 840, endMinutes: 1440 },
      ];
      let detail =
        'From Thanksgiving through New Year’s Day, standard merchandise vending is banned 12am–6am and 2pm–midnight in Dyker Heights.';
      if (at) {
        const blockedNow = isWithinAnyWindow(at, windows);
        detail += blockedNow
          ? ' Right now falls in the restricted hours.'
          : ' Right now is within the allowed window (6am–2pm).';
      }
      return {
        stop: true,
        status: 'restricted',
        title: 'Dyker Heights (holiday hours)',
        reasons: [
          {
            icon: '🎄',
            code: 'DYKER_HEIGHTS',
            title: 'Holiday-season time restriction',
            detail,
            citation: CITES.DYKER_HEIGHTS,
          },
        ],
      };
    }
  }

  return { stop: false };
};
