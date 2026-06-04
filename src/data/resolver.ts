/**
 * FactResolver — the seam between geometry and the rule engine.
 *
 * Turns a clicked map coordinate into the `LocationFacts` the engine consumes. This is exactly the
 * interface that authoritative datasets (DS-001, DS-005, DS-007, DS-012, …) drop in behind — the
 * engine never changes. Per conflict C-6 (unresolved), the production design is to CONSUME City
 * data/services rather than own the rules; a federated resolver that queries the live DCWP/DOHMH
 * services would implement this same interface.
 *
 * The NycPilotResolver below reads the bundled citywide layers (see ./nyc) and reports per-layer
 * provenance + a partial-coverage note from the layer registry, so a green verdict is never
 * overstated while gated layers remain stubs.
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import { point, polygon, multiPolygon } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { LocationFacts } from '../engine/types';
import { BOROUGHS, HYDRANTS, PARKS, SUBWAY_ENTRANCES, ZONES } from './nyc';
import { LAYER_REGISTRY, PENDING_LAYERS, type LayerInfo } from './layerRegistry';

export interface LngLat {
  lng: number;
  lat: number;
}

export interface FactResolver {
  resolve(at: LngLat): LocationFacts;
  layers(): LayerInfo[];
}

const SUBWAY_BUFFER_METERS = 3.048; // 10 ft
const HYDRANT_BUFFER_METERS = 3.048; // 10 ft (distance still pending legal confirmation)

function toFeature(f: { geometry: { type: string; coordinates: unknown } }): Feature<Polygon | MultiPolygon> {
  return (
    f.geometry.type === 'MultiPolygon'
      ? multiPolygon(f.geometry.coordinates as number[][][][])
      : polygon(f.geometry.coordinates as number[][][])
  ) as Feature<Polygon | MultiPolygon>;
}

const COVERAGE_NOTE = `Pilot coverage is partial — these rules are not yet integrated: ${PENDING_LAYERS.map(
  (l) => l.label.replace(/\s*\(.*\)$/, ''),
).join(', ')}.`;

export class NycPilotResolver implements FactResolver {
  private readonly boroughPolys = BOROUGHS.features.map((f) => ({ borough: f.properties.borough, geom: toFeature(f) }));
  private readonly zonePolys = ZONES.features.map((f) => ({ props: f.properties, geom: toFeature(f) }));
  private readonly parkPolys = PARKS.features.map((f) => toFeature(f));

  resolve(at: LngLat): LocationFacts {
    const pt = point([at.lng, at.lat]);
    const mockLayers: string[] = [COVERAGE_NOTE];

    // --- Borough (live) ---
    const hit = this.boroughPolys.find((b) => booleanPointInPolygon(pt, b.geom));
    const facts: LocationFacts = { borough: hit ? hit.borough : 'Manhattan', mockLayers };
    if (!hit) {
      // Water / New Jersey / Long Island — out of scope (handled by the engine).
      facts.outsideNyc = true;
      return facts;
    }

    // --- Special zones (statutory) + illustrative placeholders ---
    for (const { props, geom } of this.zonePolys) {
      if (!booleanPointInPolygon(pt, geom)) continue;
      switch (props.kind) {
        case 'park':
          facts.inPark = true;
          break;
        case 'midtownCore':
          facts.inMidtownCore = true;
          break;
        case 'flushing':
          facts.inFlushingZone = true;
          break;
        case 'dykerHeights':
          facts.inDykerHeights = true;
          break;
        case 'commercial':
          if (props.zonedist) facts.zoningDistrict = props.zonedist;
          break;
        case 'greenCart':
          if (props.precinct) facts.greenCartPrecinct = props.precinct;
          break;
        case 'mfvRestricted':
          if (props.restriction) facts.mfvRestriction = props.restriction;
          break;
        case 'hydrant':
          facts.withinHydrantBuffer = true;
          break;
        case 'scaffolding':
          facts.atScaffolding = true;
          break;
      }
      if (props.provenance !== 'real') mockLayers.push(`${props.label} — ${props.source}`);
    }

    // --- Parks (real, citywide) → out of scope ---
    if (this.parkPolys.some((g) => booleanPointInPolygon(pt, g))) facts.inPark = true;

    // --- Subway entrance buffer (real DS-034) ---
    for (const f of SUBWAY_ENTRANCES.features) {
      if (distance(pt, point(f.geometry.coordinates), { units: 'meters' }) <= SUBWAY_BUFFER_METERS) {
        facts.withinSubwayBuffer = true;
        break;
      }
    }

    // --- Fire hydrant buffer (real NYCDEP, pilot subset) ---
    for (const f of HYDRANTS.features) {
      if (distance(pt, point(f.geometry.coordinates), { units: 'meters' }) <= HYDRANT_BUFFER_METERS) {
        facts.withinHydrantBuffer = true;
        break;
      }
    }

    return facts;
  }

  /** Distance in meters to the nearest subway entrance (for UI display). */
  nearestSubwayMeters(at: LngLat): number {
    const pt = point([at.lng, at.lat]);
    let nearest = Infinity;
    for (const f of SUBWAY_ENTRANCES.features) {
      const d = distance(pt, point(f.geometry.coordinates), { units: 'meters' });
      if (d < nearest) nearest = d;
    }
    return nearest;
  }

  layers(): LayerInfo[] {
    return LAYER_REGISTRY;
  }
}
