/**
 * Loads the bundled citywide pilot layers. Provenance:
 *  - subwayEntrances.geojson — REAL: MTA Subway Entrances & Exits (NY Open Data i9wp-a4ja),
 *    all five boroughs (DS-034). 2,120 points.
 *  - boroughs.geojson — REAL: NYC Borough Boundaries (Open Data gthc-hcne), simplified for
 *    point-in-borough lookup.
 *  - zones.geojson — mixed: statutory special zones (Midtown Core, Flushing, Dyker Heights) +
 *    illustrative placeholders for gated datasets (see each feature's `provenance`/`dataset`).
 *
 * `.geojson` is imported as a raw string (Vite `?raw`) and parsed once at module load.
 */
import subwayRaw from './subwayEntrances.geojson?raw';
import zonesRaw from './zones.geojson?raw';
import boroughsRaw from './boroughs.geojson?raw';
import type { Borough, DayWindow } from '../../engine/types';

export type ZoneKind =
  | 'park'
  | 'midtownCore'
  | 'flushing'
  | 'dykerHeights'
  | 'commercial'
  | 'greenCart'
  | 'mfvRestricted'
  | 'hydrant'
  | 'scaffolding';

export type Provenance = 'real' | 'statutory' | 'illustrative';

export interface ZoneProperties {
  kind: ZoneKind;
  label: string;
  provenance: Provenance;
  source: string;
  dataset?: string;
  zonedist?: string;
  precinct?: string;
  restriction?: { yearRound: boolean; seasonalStart?: string; seasonalEnd?: string; restrictedWindows: DayWindow[] };
}

export interface PointFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'Point'; coordinates: [number, number] };
}
export interface PolygonFeature<P> {
  type: 'Feature';
  properties: P;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
}
interface FC<F> {
  type: 'FeatureCollection';
  meta?: Record<string, unknown>;
  features: F[];
}

export const SUBWAY_ENTRANCES = JSON.parse(subwayRaw) as FC<PointFeature>;
export const ZONES = JSON.parse(zonesRaw) as FC<PolygonFeature<ZoneProperties>>;
export const BOROUGHS = JSON.parse(boroughsRaw) as FC<PolygonFeature<{ borough: Borough }>>;
