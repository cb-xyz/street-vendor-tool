/**
 * Pure time helpers for seasonal and hour-of-day rules. No Date.now() / no I/O —
 * everything operates on the explicit components in EvalTime.
 */
import type { DayWindow, EvalTime } from './types';

/** Parse 'MM-DD' into a comparable day-of-year ordinal (month*100 + day). */
function monthDayOrdinal(month: number, day: number): number {
  return month * 100 + day;
}

/**
 * Is (month, day) within an inclusive [start, end] seasonal range expressed as 'MM-DD'?
 * Handles ranges that wrap across the new year (e.g. Nov 22 – Jan 1).
 */
export function isWithinSeason(
  at: Pick<EvalTime, 'month' | 'day'>,
  startMmDd: string,
  endMmDd: string,
): boolean {
  const [sM, sD] = startMmDd.split('-').map(Number) as [number, number];
  const [eM, eD] = endMmDd.split('-').map(Number) as [number, number];
  const now = monthDayOrdinal(at.month, at.day);
  const start = monthDayOrdinal(sM, sD);
  const end = monthDayOrdinal(eM, eD);
  if (start <= end) return now >= start && now <= end;
  // Wrapping range (e.g. start in Nov, end in Jan).
  return now >= start || now <= end;
}

/** Date of Thanksgiving (4th Thursday of November) for a given year, as day-of-month. */
export function thanksgivingDay(year: number): number {
  // Nov 1's weekday: 0=Sun..6=Sat. Zeller-free via UTC Date construction is unavailable
  // (engine must stay pure), so compute with a known anchor.
  // Use the well-known algorithm: weekday of Nov 1.
  const nov1Weekday = dayOfWeekFor(year, 11, 1); // 0=Sun..6=Sat
  // First Thursday (weekday 4) on/after Nov 1:
  const offsetToThursday = (4 - nov1Weekday + 7) % 7;
  const firstThursday = 1 + offsetToThursday;
  return firstThursday + 21; // 4th Thursday
}

/**
 * Day of week for a calendar date using Sakamoto's algorithm. 0=Sun..6=Sat.
 * Pure arithmetic — no Date object.
 */
export function dayOfWeekFor(year: number, month: number, day: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const y = month < 3 ? year - 1 : year;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1]! + day) % 7;
}

/**
 * The Dyker Heights holiday season runs Thanksgiving through New Year's Day.
 * Computed from the actual Thanksgiving date for the year.
 */
export function isDykerHeightsSeason(at: EvalTime): boolean {
  const tDay = thanksgivingDay(at.year);
  if (at.month === 11) return at.day >= tDay;
  if (at.month === 12) return true;
  if (at.month === 1 && at.day === 1) return true;
  return false;
}

/** Does the given time fall inside any of the restricted day/time windows? */
export function isWithinAnyWindow(at: EvalTime, windows: DayWindow[]): boolean {
  return windows.some(
    (w) =>
      w.days.includes(at.dayOfWeek) &&
      at.minutesIntoDay >= w.startMinutes &&
      at.minutesIntoDay < w.endMinutes,
  );
}

/** Format minutes-from-midnight as a friendly 'h:mm am/pm'. */
export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}
