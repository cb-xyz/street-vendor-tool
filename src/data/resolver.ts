/**
 * FactResolver — the seam between geometry and the rule engine.
 *
 * A resolver turns a clicked map coordinate into the `LocationFacts` the engine consumes. This is
 * exactly the interface that future authoritative datasets (DS-001 DOHMH restricted streets,
 * DS-007 DCWP GV restrictions, DS-012 zoning, …) drop in behind — the engine never changes.
 *
 * Per conflict C-6 (unresolved), the production design is to CONSUME City data/services rather
 * than assume we own the rules. This pilot resolver reads bundled public-now layers; a federated
 * resolver that queries the live DCWP/DOHMH services implements the same interface.
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import { point, polygon } from '@turf/helpers';
import type { LocationFacts } from '../engine/types';
import { SUBWAY_ENTRANCES, ZONES, type PolygonFeature } from './manhattan';

export interface LngLat {
  lng: number;
  lat: number;
}

export interface FactResolver {
  /** Resolve a coordinate into engine-ready facts. */
  resolve(at: LngLat): LocationFacts;
  /** Human-readable provenance of every layer this resolver checks (for the UI). */
  layers(): { label: string; provenance: string }[];
}

/** Standing note: rules NOT yet integrated into the pilot. Surfaced so green is never overstated. */
const COVERAGE_NOTE =
  'Pilot coverage is partial: only subway 10 ft buffers and zoning overlays are checked here. Sidewalk width, other distance buffers, DOHMH restricted streets, and Green Cart precincts are not yet integrated.';

const SUBWAY_BUFFER_METERS = 3.048; // 10 ft

export class ManhattanPilotResolver implements FactResolver {
  private readonly zonePolys: { feature: PolygonFeature; geom: ReturnType<typeof polygon> }[];

  constructor() {
    this.zonePolys = ZONES.features.map((f) => ({
      feature: f,
      geom: polygon(f.geometry.coordinates),
    }));
  }

  resolve(at: LngLat): LocationFacts {
    const pt = point([at.lng, at.lat]);
    const mockLayers: string[] = [COVERAGE_NOTE];
    const facts: LocationFacts = { borough: 'Manhattan', mockLayers };

    // --- Zone polygons (point-in-polygon) ---
    for (const { feature, geom } of this.zonePolys) {
      if (!booleanPointInPolygon(pt, geom)) continue;
      const p = feature.properties;
      if (p.kind === 'park') facts.inPark = true;
      else if (p.kind === 'midtownCore') facts.inMidtownCore = true;
      else if (p.kind === 'commercial' && p.zonedist) facts.zoningDistrict = p.zonedist;
      // Flag any verdict that leans on non-authoritative geometry.
      if (p.provenance !== 'real') mockLayers.push(`${p.label} — ${p.source}`);
    }

    // --- Subway entrance buffer (real DS-034 data) ---
    let nearestM = Infinity;
    for (const f of SUBWAY_ENTRANCES.features) {
      const d = distance(pt, point(f.geometry.coordinates), { units: 'meters' });
      if (d < nearestM) nearestM = d;
      if (d <= SUBWAY_BUFFER_METERS) {
        facts.withinSubwayBuffer = true;
        break;
      }
    }

    return facts;
  }

  /** Distance in meters to the nearest subway entrance — handy for the UI / debugging. */
  nearestSubwayMeters(at: LngLat): number {
    const pt = point([at.lng, at.lat]);
    let nearest = Infinity;
    for (const f of SUBWAY_ENTRANCES.features) {
      const d = distance(pt, point(f.geometry.coordinates), { units: 'meters' });
      if (d < nearest) nearest = d;
    }
    return nearest;
  }

  layers() {
    return [
      {
        label: 'Subway entrances (10 ft buffer)',
        provenance: 'Real — MTA Subway Entrances & Exits (NY Open Data i9wp-a4ja), DS-034',
      },
      { label: 'Midtown Core zone', provenance: 'Statutory boundary §20-465(g)(1) (approximate)' },
      { label: 'Commercial C4/C5/C6 zones', provenance: 'Illustrative — pending licensed DS-012' },
      { label: 'Central Park (out of scope)', provenance: 'Illustrative — pending DS-032' },
    ];
  }
}
