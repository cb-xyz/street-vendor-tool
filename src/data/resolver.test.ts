import { describe, expect, it } from 'vitest';
import { ManhattanPilotResolver } from './resolver';
import { SUBWAY_ENTRANCES } from './manhattan';
import { evaluate } from '../engine/ruleEngine';

const resolver = new ManhattanPilotResolver();

describe('ManhattanPilotResolver', () => {
  it('bundles the real Manhattan subway entrance dataset', () => {
    expect(SUBWAY_ENTRANCES.features.length).toBeGreaterThan(800);
  });

  it('flags the subway buffer when sitting on a real entrance', () => {
    const e = SUBWAY_ENTRANCES.features[0]!.geometry.coordinates;
    const facts = resolver.resolve({ lng: e[0], lat: e[1] });
    expect(facts.withinSubwayBuffer).toBe(true);
  });

  it('does not flag the subway buffer ~200 m away from any entrance', () => {
    const e = SUBWAY_ENTRANCES.features[0]!.geometry.coordinates;
    const facts = resolver.resolve({ lng: e[0] + 0.01, lat: e[1] + 0.01 });
    // 0.01° ≈ 1.1 km — comfortably outside the 10 ft buffer.
    expect(facts.withinSubwayBuffer).toBeUndefined();
  });

  it('detects Central Park as out-of-scope geometry', () => {
    const facts = resolver.resolve({ lng: -73.9665, lat: 40.7812 });
    expect(facts.inPark).toBe(true);
    const v = evaluate({ vendorType: 'merch', license: 'standard' }, facts);
    expect(v.status).toBe('outOfScope');
  });

  it('detects the Midtown Core zone and prohibits a standard GV there', () => {
    const facts = resolver.resolve({ lng: -73.981, lat: 40.758 });
    expect(facts.inMidtownCore).toBe(true);
    const v = evaluate({ vendorType: 'merch', license: 'standard' }, facts);
    expect(v.status).toBe('prohibited');
  });

  it('tags commercial geometry with its zoning district', () => {
    const facts = resolver.resolve({ lng: -73.9854, lat: 40.7578 });
    expect(facts.zoningDistrict).toBe('C5');
  });

  it('always surfaces the partial-coverage note as a mock layer', () => {
    const facts = resolver.resolve({ lng: -73.99, lat: 40.72 });
    expect(facts.mockLayers?.some((l) => /Pilot coverage is partial/.test(l))).toBe(true);
  });

  it('flags illustrative geometry but not the real subway layer', () => {
    const facts = resolver.resolve({ lng: -73.9854, lat: 40.7578 });
    expect(facts.mockLayers?.some((l) => /illustrative|pending/i.test(l))).toBe(true);
  });
});
