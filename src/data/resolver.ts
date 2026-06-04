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
import type { Borough, LocationFacts } from '../engine/types';
import { BOROUGHS, SUBWAY_ENTRANCES, ZONES } from './nyc';
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

  resolve(at: LngLat): LocationFacts {
    const pt = point([at.lng, at.lat]);
    const mockLayers: string[] = [COVERAGE_NOTE];

    // --- Borough (live) ---
    let borough: Borough = 'Manhattan';
    const hit = this.boroughPolys.find((b) => booleanPointInPolygon(pt, b.geom));
    if (hit) {
      borough = hit.borough;
    } else {
      mockLayers.push('Point is outside the five boroughs — borough-specific results may not apply.');
    }
    const facts: LocationFacts = { borough, mockLayers };

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
      }
      if (props.provenance !== 'real') mockLayers.push(`${props.label} — ${props.source}`);
    }

    // --- Subway entrance buffer (real DS-034) ---
    for (const f of SUBWAY_ENTRANCES.features) {
      if (distance(pt, point(f.geometry.coordinates), { units: 'meters' }) <= SUBWAY_BUFFER_METERS) {
        facts.withinSubwayBuffer = true;
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
