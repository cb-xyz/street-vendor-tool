/**
 * Loads the bundled Manhattan pilot layers. Data provenance:
 *  - subwayEntrances.geojson — REAL: MTA Subway Entrances & Exits (NY Open Data i9wp-a4ja),
 *    Manhattan subset (DS-034, a P1 public-now dataset). 868 points.
 *  - zones.geojson — mixed: Midtown Core is the statutory boundary; commercial zones are
 *    illustrative pending licensed DS-012; Central Park is illustrative out-of-scope.
 *
 * `.geojson` is imported as a raw string (Vite `?raw`) and parsed once at module load, which
 * keeps the files as plain data artifacts that a build script or analyst can regenerate.
 */
import subwayRaw from './subwayEntrances.geojson?raw';
import zonesRaw from './zones.geojson?raw';

export type ZoneKind = 'park' | 'midtownCore' | 'commercial';

export interface ZoneProperties {
  kind: ZoneKind;
  zonedist?: string;
  label: string;
  provenance: 'real' | 'statutory' | 'illustrative';
  source: string;
}

export interface PointFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'Point'; coordinates: [number, number] };
}

export interface PolygonFeature {
  type: 'Feature';
  properties: ZoneProperties;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

interface FC<F> {
  type: 'FeatureCollection';
  meta?: Record<string, unknown>;
  features: F[];
}

export const SUBWAY_ENTRANCES = JSON.parse(subwayRaw) as FC<PointFeature>;
export const ZONES = JSON.parse(zonesRaw) as FC<PolygonFeature>;
