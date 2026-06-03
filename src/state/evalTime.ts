/**
 * UI-side helpers that resolve a wall-clock moment into the engine's EvalTime, always in the
 * America/New_York timezone. Kept out of the engine so the engine stays pure/deterministic.
 */
import type { EvalTime } from '../engine/types';

const NYC_TZ = 'America/New_York';

/** Current NYC time as EvalTime (the "live" view). */
export function nycNow(): EvalTime {
  return fromDate(new Date());
}

function fromDate(d: Date): EvalTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NYC_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // some environments emit 24 for midnight
  const minute = Number(get('minute'));

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
    minutesIntoDay: hour * 60 + minute,
  };
}

/** Build EvalTime from `<input type="date">` (YYYY-MM-DD) + `<input type="time">` (HH:MM). */
export function fromDateTimeInputs(dateStr: string, timeStr: string): EvalTime {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  const [hh, mm] = timeStr.split(':').map(Number) as [number, number];
  // Construct at noon to avoid DST edge weirdness when only the date matters; derive weekday.
  const dow = dayOfWeek(y, m, d);
  return { year: y, month: m, day: d, dayOfWeek: dow, minutesIntoDay: hh * 60 + mm };
}

function dayOfWeek(year: number, month: number, day: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const y = month < 3 ? year - 1 : year;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1]! + day) % 7;
}
