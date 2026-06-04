import { describe, expect, it } from 'vitest';
import { NycPilotResolver } from './resolver';
import { BOROUGHS, SUBWAY_ENTRANCES } from './nyc';
import { LAYER_REGISTRY } from './layerRegistry';
import { evaluate } from '../engine/ruleEngine';
import type { EvalTime } from '../engine/types';

const resolver = new NycPilotResolver();

describe('NycPilotResolver — citywide', () => {
  it('bundles the real citywide subway dataset and all five boroughs', () => {
    expect(SUBWAY_ENTRANCES.features.length).toBeGreaterThan(2000);
    expect(BOROUGHS.features.map((f) => f.properties.borough).sort()).toEqual([
      'Bronx',
      'Brooklyn',
      'Manhattan',
      'Queens',
      'Staten Island',
    ]);
  });

  it('resolves the correct borough by point-in-polygon', () => {
    expect(resolver.resolve({ lng: -73.9857, lat: 40.7484 }).borough).toBe('Manhattan'); // Empire State
    expect(resolver.resolve({ lng: -73.9442, lat: 40.6782 }).borough).toBe('Brooklyn'); // Brooklyn
    expect(resolver.resolve({ lng: -73.8648, lat: 40.7282 }).borough).toBe('Queens'); // Queens
    expect(resolver.resolve({ lng: -73.8801, lat: 40.8448 }).borough).toBe('Bronx'); // Bronx
    expect(resolver.resolve({ lng: -74.1502, lat: 40.5795 }).borough).toBe('Staten Island');
  });

  it('flags the subway buffer when sitting on a real entrance, not 1 km away', () => {
    const e = SUBWAY_ENTRANCES.features[0]!.geometry.coordinates;
    expect(resolver.resolve({ lng: e[0], lat: e[1] }).withinSubwayBuffer).toBe(true);
    expect(resolver.resolve({ lng: e[0] + 0.01, lat: e[1] + 0.01 }).withinSubwayBuffer).toBeUndefined();
  });

  it('detects Midtown Core (Manhattan) and prohibits a standard GV', () => {
    const facts = resolver.resolve({ lng: -73.981, lat: 40.758 });
    expect(facts.inMidtownCore).toBe(true);
    expect(evaluate({ vendorType: 'merch', license: 'standard' }, facts).status).toBe('prohibited');
  });

  it('detects the Flushing zone (Queens)', () => {
    const facts = resolver.resolve({ lng: -73.836, lat: 40.7595 });
    expect(facts.inFlushingZone).toBe(true);
    expect(evaluate({ vendorType: 'merch', license: 'standard' }, facts).status).toBe('prohibited');
    expect(evaluate({ vendorType: 'merch', license: 'blue' }, facts).status).toBe('permitted');
  });

  it('detects Dyker Heights (Brooklyn) and restricts standard merch in season', () => {
    const facts = resolver.resolve({ lng: -74.0155, lat: 40.6165 });
    expect(facts.inDykerHeights).toBe(true);
    const dec: EvalTime = { dayOfWeek: 2, minutesIntoDay: 900, month: 12, day: 15, year: 2026 };
    expect(evaluate({ vendorType: 'merch', license: 'standard' }, facts, dec).status).toBe('restricted');
  });

  it('detects the illustrative Green Cart precinct (Bronx)', () => {
    const facts = resolver.resolve({ lng: -73.9215, lat: 40.8165 });
    expect(facts.greenCartPrecinct).toBe('40');
    const cfg = { vendorType: 'food' as const, license: 'greenCart' as const, greenCartPrecinct: '40' };
    expect(evaluate(cfg, facts).reasons.some((r) => r.code === 'GREEN_CART_OK')).toBe(true);
  });

  it('detects the illustrative DOHMH restricted street for food vendors', () => {
    const facts = resolver.resolve({ lng: -73.9845, lat: 40.7637 });
    expect(facts.mfvRestriction).toBeDefined();
    expect(evaluate({ vendorType: 'food', license: 'citywide' }, facts).status).toBe('restricted');
  });

  it('always surfaces the partial-coverage note listing pending layers', () => {
    const facts = resolver.resolve({ lng: -73.99, lat: 40.72 });
    expect(facts.mockLayers?.some((l) => /Pilot coverage is partial/.test(l))).toBe(true);
  });

  it('exposes a layer registry that includes live, statutory, illustrative, and pending layers', () => {
    const statuses = new Set(resolver.layers().map((l) => l.status));
    expect(statuses).toContain('live');
    expect(statuses).toContain('statutory');
    expect(statuses).toContain('illustrative');
    expect(statuses).toContain('pending');
    expect(LAYER_REGISTRY.find((l) => l.dataset === 'DS-007')?.status).toBe('pending');
  });
});
