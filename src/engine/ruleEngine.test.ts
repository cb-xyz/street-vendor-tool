import { describe, expect, it } from 'vitest';
import { evaluate } from './ruleEngine';
import type { EvalTime, LocationFacts, VendorConfig } from './types';

// ---- Helpers ----
const foodCitywide: VendorConfig = { vendorType: 'food', license: 'citywide' };
const gvStandard: VendorConfig = { vendorType: 'merch', license: 'standard' };
const gvYellow: VendorConfig = { vendorType: 'merch', license: 'yellow' };
const gvBlue: VendorConfig = { vendorType: 'merch', license: 'blue' };
const firstAmd: VendorConfig = { vendorType: 'firstAmendment', license: 'firstAmendment' };

const base: LocationFacts = { borough: 'Manhattan' };

// A clearly-permissive set of facts: nothing triggers.
const clearSpot: LocationFacts = { borough: 'Manhattan', sidewalkClearFt: 20 };

// Tuesday, June 3 2026, 12:00 noon.
const noonTuesday: EvalTime = {
  dayOfWeek: 2,
  minutesIntoDay: 720,
  month: 6,
  day: 3,
  year: 2026,
};

describe('precedence — stop at first match', () => {
  it('1. parks are out of scope (gray), not prohibited', () => {
    const v = evaluate(gvStandard, { ...base, inPark: true });
    expect(v.status).toBe('outOfScope');
    expect(v.reasons[0]?.code).toBe('PARK');
  });

  it('1. pedestrian plazas are out of scope', () => {
    const v = evaluate(foodCitywide, { ...base, inPedestrianPlaza: true });
    expect(v.status).toBe('outOfScope');
  });

  it('out-of-scope beats a prohibition lower in the order', () => {
    const v = evaluate(gvStandard, { ...base, inPark: true, withinSubwayBuffer: true });
    expect(v.status).toBe('outOfScope');
  });
});

describe('2. WTC hard prohibition (C-1 — flagged unverified)', () => {
  it('absolute segment → prohibited and unverified', () => {
    const v = evaluate(foodCitywide, { ...base, inWtcAbsoluteSegment: true });
    expect(v.status).toBe('prohibited');
    expect(v.unverified).toBe(true);
    expect(v.mockLayers).toContain('WTC boundary (C-1 unverified)');
  });
});

describe('3. zone exclusions by SKU', () => {
  it('WTC zone → prohibited + unverified for everyone without exception', () => {
    const v = evaluate(gvStandard, { ...base, inWtcZone: true });
    expect(v.status).toBe('prohibited');
    expect(v.unverified).toBe(true);
  });

  it('WTC zone exception street → does not prohibit, but flags unverified', () => {
    const v = evaluate(foodCitywide, {
      ...clearSpot,
      inWtcZone: true,
      wtcMfvException: true,
    });
    expect(v.status).toBe('permitted');
    expect(v.unverified).toBe(true);
    expect(v.reasons.some((r) => r.code === 'WTC_EXCEPTION')).toBe(true);
  });

  it('Midtown Core: standard GV prohibited', () => {
    const v = evaluate(gvStandard, { ...base, inMidtownCore: true });
    expect(v.status).toBe('prohibited');
    expect(v.reasons[0]?.code).toBe('MIDTOWN_CORE');
  });

  it('Midtown Core: Yellow still prohibited (needs Blue)', () => {
    const v = evaluate(gvYellow, { ...base, inMidtownCore: true });
    expect(v.status).toBe('prohibited');
  });

  it('Midtown Core: Blue permitted', () => {
    const v = evaluate(gvBlue, { ...clearSpot, inMidtownCore: true });
    expect(v.status).toBe('permitted');
    expect(v.reasons.some((r) => r.code === 'MIDTOWN_CORE_BLUE')).toBe(true);
  });

  it('Midtown Core checked before C-zone (Yellow in both → prohibited)', () => {
    const v = evaluate(gvYellow, { ...base, inMidtownCore: true, zoningDistrict: 'C5-3' });
    expect(v.status).toBe('prohibited');
    expect(v.reasons[0]?.code).toBe('MIDTOWN_CORE');
  });

  it('C4/C5/C6: standard GV prohibited', () => {
    const v = evaluate(gvStandard, { ...base, zoningDistrict: 'C6-2' });
    expect(v.status).toBe('prohibited');
    expect(v.reasons[0]?.code).toBe('COMMERCIAL_ZONE');
  });

  it('C4/C5/C6: Yellow exempt → permitted', () => {
    const v = evaluate(gvYellow, { ...clearSpot, zoningDistrict: 'C4-1' });
    expect(v.status).toBe('permitted');
  });

  it('non-commercial zoning (C1/C2/R) does not exclude', () => {
    const v = evaluate(gvStandard, { ...clearSpot, zoningDistrict: 'C1-9' });
    expect(v.status).toBe('permitted');
  });

  it('Flushing: standard prohibited, Blue exempt', () => {
    expect(evaluate(gvStandard, { ...base, borough: 'Queens', inFlushingZone: true }).status).toBe(
      'prohibited',
    );
    expect(
      evaluate(gvBlue, { ...clearSpot, borough: 'Queens', inFlushingZone: true }).status,
    ).toBe('permitted');
  });

  it('food vendors are not subject to GV zoning rules', () => {
    const v = evaluate(foodCitywide, { ...clearSpot, zoningDistrict: 'C6-2', inMidtownCore: true });
    expect(v.status).toBe('permitted');
  });
});

describe('3. First Amendment (C-2 — undetermined, never guessed)', () => {
  it('Midtown Core → unverified, not a confident verdict', () => {
    const v = evaluate(firstAmd, { ...base, inMidtownCore: true });
    expect(v.unverified).toBe(true);
    expect(v.reasons[0]?.code).toBe('MIDTOWN_CORE_FA');
  });

  it('C-zone → unverified', () => {
    const v = evaluate(firstAmd, { ...base, zoningDistrict: 'C5-2' });
    expect(v.unverified).toBe(true);
  });

  it('outside contested zones, FA is evaluated normally', () => {
    const v = evaluate(firstAmd, clearSpot);
    expect(v.status).toBe('permitted');
    expect(v.unverified).toBe(false);
  });

  it('FA follows GV placement buffers (corner)', () => {
    const v = evaluate(firstAmd, { ...clearSpot, withinCornerBuffer: true });
    expect(v.status).toBe('prohibited');
    expect(v.reasons[0]?.code).toBe('CORNER_BUFFER');
  });
});

describe('license geography (food)', () => {
  it('borough permit prohibited outside its borough', () => {
    const cfg: VendorConfig = { vendorType: 'food', license: 'borough', permittedBorough: 'Brooklyn' };
    expect(evaluate(cfg, { ...clearSpot, borough: 'Manhattan' }).status).toBe('prohibited');
    expect(evaluate(cfg, { ...clearSpot, borough: 'Brooklyn' }).status).toBe('permitted');
  });

  it('green cart prohibited outside assigned precinct, permitted inside', () => {
    const cfg: VendorConfig = { vendorType: 'food', license: 'greenCart', greenCartPrecinct: '40' };
    expect(evaluate(cfg, { ...clearSpot, greenCartPrecinct: '52' }).status).toBe('prohibited');
    expect(evaluate(cfg, { ...clearSpot, greenCartPrecinct: '40' }).reasons.some((r) => r.code === 'GREEN_CART_OK')).toBe(
      true,
    );
  });
});

describe('4. time / seasonal', () => {
  it('seasonal permit prohibited out of season (December)', () => {
    const cfg: VendorConfig = { vendorType: 'food', license: 'seasonal' };
    const dec: EvalTime = { ...noonTuesday, month: 12, day: 15 };
    expect(evaluate(cfg, clearSpot, dec).status).toBe('prohibited');
  });

  it('seasonal permit fine in season (June)', () => {
    const cfg: VendorConfig = { vendorType: 'food', license: 'seasonal' };
    expect(evaluate(cfg, clearSpot, noonTuesday).status).toBe('permitted');
  });

  it('DOHMH restricted street → restricted (yellow) for food', () => {
    const facts: LocationFacts = {
      ...clearSpot,
      mfvRestriction: {
        yearRound: true,
        restrictedWindows: [{ days: [1, 2, 3, 4, 5], startMinutes: 720, endMinutes: 1380 }],
      },
    };
    const v = evaluate(foodCitywide, facts, noonTuesday);
    expect(v.status).toBe('restricted');
    expect(v.reasons[0]?.detail).toMatch(/restricted time/i);
  });

  it('DOHMH restriction does not apply to merch vendors', () => {
    const facts: LocationFacts = {
      ...clearSpot,
      mfvRestriction: { yearRound: true, restrictedWindows: [{ days: [1], startMinutes: 0, endMinutes: 1440 }] },
    };
    expect(evaluate(gvStandard, facts).status).toBe('permitted');
  });

  it('Dyker Heights restricts standard merch in season, exempts specialized', () => {
    const dec: EvalTime = { ...noonTuesday, month: 12, day: 15, minutesIntoDay: 900 };
    expect(evaluate(gvStandard, { ...clearSpot, borough: 'Brooklyn', inDykerHeights: true }, dec).status).toBe(
      'restricted',
    );
    expect(evaluate(gvBlue, { ...clearSpot, borough: 'Brooklyn', inDykerHeights: true }, dec).status).toBe(
      'permitted',
    );
  });

  it('Dyker Heights does not restrict outside the holiday season', () => {
    expect(
      evaluate(gvStandard, { ...clearSpot, borough: 'Brooklyn', inDykerHeights: true }, noonTuesday).status,
    ).toBe('permitted');
  });
});

describe('5. distance buffers', () => {
  it('subway buffer prohibits both types', () => {
    expect(evaluate(foodCitywide, { ...clearSpot, withinSubwayBuffer: true }).status).toBe('prohibited');
    expect(evaluate(gvStandard, { ...clearSpot, withinSubwayBuffer: true }).status).toBe('prohibited');
  });

  it('crosswalk buffer is MFV-only', () => {
    expect(evaluate(foodCitywide, { ...clearSpot, withinCrosswalkBuffer: true }).status).toBe('prohibited');
    expect(evaluate(gvStandard, { ...clearSpot, withinCrosswalkBuffer: true }).status).toBe('permitted');
  });

  it('corner buffer is GV-only', () => {
    expect(evaluate(gvStandard, { ...clearSpot, withinCornerBuffer: true }).status).toBe('prohibited');
    expect(evaluate(foodCitywide, { ...clearSpot, withinCornerBuffer: true }).status).toBe('permitted');
  });

  it('driveway buffer flags the approximated mock layer', () => {
    const v = evaluate(gvStandard, { ...clearSpot, withinDrivewayBuffer: true });
    expect(v.status).toBe('prohibited');
    expect(v.mockLayers.some((l) => /approximated/i.test(l))).toBe(true);
  });

  it('bus shelter / newsstand / ADA ramp are GV-only', () => {
    expect(evaluate(gvStandard, { ...clearSpot, withinBusShelterBuffer: true }).status).toBe('prohibited');
    expect(evaluate(foodCitywide, { ...clearSpot, withinBusShelterBuffer: true }).status).toBe('permitted');
  });
});

describe('6. sidewalk width', () => {
  it('under 12 ft → prohibited', () => {
    expect(evaluate(gvStandard, { ...base, sidewalkClearFt: 8 }).status).toBe('prohibited');
  });
  it('12–15 ft → restricted warning', () => {
    expect(evaluate(gvStandard, { ...base, sidewalkClearFt: 13 }).status).toBe('restricted');
  });
  it('>= 15 ft → fine', () => {
    expect(evaluate(gvStandard, { ...base, sidewalkClearFt: 20 }).status).toBe('permitted');
  });
});

describe('7. permitted default + reminders', () => {
  it('clear spot → permitted with operational reminders', () => {
    const v = evaluate(gvStandard, clearSpot);
    expect(v.status).toBe('permitted');
    expect(v.reminders.length).toBeGreaterThan(0);
    expect(v.reminders.some((r) => r.code === 'CURB_PLACEMENT')).toBe(true);
  });

  it('food vendors get MFV-specific reminders, GV get footprint reminder', () => {
    expect(evaluate(foodCitywide, clearSpot).reminders.some((r) => r.code === 'METERED_PARKING')).toBe(true);
    expect(evaluate(gvStandard, clearSpot).reminders.some((r) => r.code === 'GV_FOOTPRINT')).toBe(true);
  });

  it('prohibited verdicts carry no operational reminders', () => {
    expect(evaluate(gvStandard, { ...base, withinSubwayBuffer: true }).reminders).toHaveLength(0);
  });
});

describe('precedence ordering interactions', () => {
  it('zone exclusion (red) beats a later sidewalk-width pass', () => {
    const v = evaluate(gvStandard, { ...base, inMidtownCore: true, sidewalkClearFt: 20 });
    expect(v.reasons[0]?.code).toBe('MIDTOWN_CORE');
  });

  it('time restriction (yellow) returns before buffers per spec §10 order', () => {
    // Documented tension: a redder buffer would otherwise apply. Spec evaluates time first.
    const facts: LocationFacts = {
      ...clearSpot,
      mfvRestriction: { yearRound: true, restrictedWindows: [{ days: [2], startMinutes: 0, endMinutes: 1440 }] },
      withinSubwayBuffer: true,
    };
    const v = evaluate(foodCitywide, facts, noonTuesday);
    expect(v.status).toBe('restricted');
  });

  it('non-terminal exemption reason is preserved on a later permitted verdict', () => {
    const v = evaluate(gvBlue, { ...clearSpot, inMidtownCore: true });
    expect(v.status).toBe('permitted');
    expect(v.reasons.some((r) => r.code === 'MIDTOWN_CORE_BLUE')).toBe(true);
  });
});
