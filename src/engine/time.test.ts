import { describe, expect, it } from 'vitest';
import {
  dayOfWeekFor,
  formatMinutes,
  isDykerHeightsSeason,
  isWithinAnyWindow,
  isWithinSeason,
  thanksgivingDay,
} from './time';
import type { EvalTime } from './types';

describe('dayOfWeekFor (Sakamoto)', () => {
  it('knows real weekdays', () => {
    expect(dayOfWeekFor(2026, 6, 3)).toBe(3); // Wed June 3 2026
    expect(dayOfWeekFor(2026, 1, 1)).toBe(4); // Thu Jan 1 2026
    expect(dayOfWeekFor(2000, 1, 1)).toBe(6); // Sat Jan 1 2000
  });
});

describe('thanksgivingDay (4th Thursday of November)', () => {
  it('matches known years', () => {
    expect(thanksgivingDay(2026)).toBe(26); // Nov 26 2026
    expect(thanksgivingDay(2025)).toBe(27); // Nov 27 2025
    expect(thanksgivingDay(2024)).toBe(28); // Nov 28 2024
  });
});

describe('isWithinSeason', () => {
  it('handles a normal range (Apr 1 – Oct 31)', () => {
    expect(isWithinSeason({ month: 6, day: 15 }, '04-01', '10-31')).toBe(true);
    expect(isWithinSeason({ month: 11, day: 1 }, '04-01', '10-31')).toBe(false);
    expect(isWithinSeason({ month: 4, day: 1 }, '04-01', '10-31')).toBe(true);
  });

  it('handles a wrapping range (Nov 22 – Jan 1)', () => {
    expect(isWithinSeason({ month: 12, day: 25 }, '11-22', '01-01')).toBe(true);
    expect(isWithinSeason({ month: 1, day: 1 }, '11-22', '01-01')).toBe(true);
    expect(isWithinSeason({ month: 1, day: 2 }, '11-22', '01-01')).toBe(false);
  });
});

describe('isDykerHeightsSeason', () => {
  const at = (month: number, day: number, year = 2026): EvalTime => ({
    dayOfWeek: 0,
    minutesIntoDay: 0,
    month,
    day,
    year,
  });
  it('is active from Thanksgiving through Jan 1', () => {
    expect(isDykerHeightsSeason(at(11, 26))).toBe(true); // Thanksgiving 2026
    expect(isDykerHeightsSeason(at(11, 25))).toBe(false);
    expect(isDykerHeightsSeason(at(12, 31))).toBe(true);
    expect(isDykerHeightsSeason(at(1, 1))).toBe(true);
    expect(isDykerHeightsSeason(at(1, 2))).toBe(false);
  });
});

describe('isWithinAnyWindow', () => {
  const at: EvalTime = { dayOfWeek: 2, minutesIntoDay: 800, month: 6, day: 3, year: 2026 };
  it('matches an overlapping window on the right day', () => {
    expect(isWithinAnyWindow(at, [{ days: [2], startMinutes: 720, endMinutes: 1380 }])).toBe(true);
  });
  it('excludes the wrong day', () => {
    expect(isWithinAnyWindow(at, [{ days: [3], startMinutes: 720, endMinutes: 1380 }])).toBe(false);
  });
  it('end is exclusive', () => {
    expect(isWithinAnyWindow({ ...at, minutesIntoDay: 1380 }, [{ days: [2], startMinutes: 720, endMinutes: 1380 }])).toBe(
      false,
    );
  });
});

describe('formatMinutes', () => {
  it('formats 12-hour clock', () => {
    expect(formatMinutes(0)).toBe('12am');
    expect(formatMinutes(720)).toBe('12pm');
    expect(formatMinutes(840)).toBe('2pm');
    expect(formatMinutes(1380)).toBe('11pm');
    expect(formatMinutes(390)).toBe('6:30am');
  });
});
