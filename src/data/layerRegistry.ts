/**
 * Layer registry — the catalog of EVERY data layer relevant to the rule engine, with its
 * integration status and dataset provenance. This is the "step 7" deliverable: gated layers are
 * present as clearly-labeled stubs so they can be dropped in the moment SBS/agencies provide them.
 *
 * status:
 *  - 'live'         → real authoritative data is wired in and affects verdicts.
 *  - 'statutory'    → geometry encoded from Admin Code boundary text (approximate).
 *  - 'illustrative' → placeholder geometry pending the licensed/acquired dataset.
 *  - 'pending'      → not yet integrated at all; its rule cannot fire until data arrives.
 *
 * To promote a layer: supply its GeoJSON, point the resolver at it, and flip status to 'live'.
 */
export type LayerStatus = 'live' | 'statutory' | 'illustrative' | 'pending';

export interface LayerInfo {
  id: string;
  label: string;
  status: LayerStatus;
  dataset?: string;
  /** Rules this layer feeds, for traceability against the engine. */
  feeds: string;
}

export const LAYER_REGISTRY: LayerInfo[] = [
  // --- Live ---
  { id: 'boroughs', label: 'Borough boundaries', status: 'live', dataset: 'gthc-hcne', feeds: 'Borough (food borough-permit geography)' },
  { id: 'subway', label: 'Subway entrances (10 ft buffer)', status: 'live', dataset: 'DS-034', feeds: '§10 step 5 — subway buffer' },
  { id: 'parks', label: 'Parks (out of scope)', status: 'live', dataset: 'DS-032', feeds: '§10 step 1 — out of scope (citywide)' },
  { id: 'sidewalks', label: 'Allowed sidewalks (green)', status: 'live', dataset: 'DS-041', feeds: 'Real DCP sidewalk polygons, citywide' },
  { id: 'hydrant', label: 'Fire hydrants (10 ft buffer)', status: 'live', dataset: 'DS-036', feeds: '§10 step 5 — hydrant buffer, citywide (distance unverified)' },
  { id: 'commercial', label: 'C4/C5/C6 commercial zoning', status: 'live', dataset: 'DS-012', feeds: '§10 step 3 — zoning exclusion, citywide' },

  // --- Statutory special zones (encoded from the Admin Code) ---
  { id: 'midtownCore', label: 'Midtown Core zone', status: 'statutory', dataset: '§20-465(g)(1)', feeds: '§10 step 3 — Midtown Core (Blue)' },
  { id: 'flushing', label: 'Downtown Flushing zone', status: 'statutory', dataset: '§20-465(g)(4)', feeds: '§10 step 3 — Flushing exclusion' },
  { id: 'dykerHeights', label: 'Dyker Heights zone', status: 'statutory', dataset: '§20-465(g)(5)', feeds: '§10 step 4 — Dyker Heights seasonal' },

  // --- Illustrative placeholders (real data drops in here) ---
  { id: 'greenCart', label: 'Green Cart precincts', status: 'illustrative', dataset: 'DS-005', feeds: '§10 step 3 — Green Cart geography' },
  { id: 'mfvRestricted', label: 'DOHMH restricted streets', status: 'illustrative', dataset: 'DS-001', feeds: '§10 step 4 — MFV time/day limits' },
  { id: 'scaffolding', label: 'Scaffolding / sidewalk sheds', status: 'illustrative', dataset: 'DOB', feeds: '§10 step 5b — obstruction advisory' },

  // --- Pending (not yet integrated; rule stays dormant until data arrives) ---
  { id: 'gvStreets', label: 'DCWP General Vendor street restrictions', status: 'pending', dataset: 'DS-007', feeds: '§10 step 3 — authoritative GV permitted/prohibited streets' },
  { id: 'sidewalkWidth', label: 'Sidewalk widths', status: 'pending', dataset: 'DS-040/041', feeds: '§10 step 6 — 12 ft clearance' },
  { id: 'pedPlazas', label: 'Pedestrian plazas', status: 'pending', dataset: 'DS-026', feeds: '§10 step 1 — out of scope' },
  { id: 'buffersOther', label: 'Other buffers (crosswalk, corner, driveway, building entrance, café, bus shelter, newsstand, ADA ramp, bus stop, hospital)', status: 'pending', dataset: 'DS-015/027/029/031/035…', feeds: '§10 step 5 — distance buffers' },
  { id: 'bikeMedian', label: 'Bike lanes & medians', status: 'pending', dataset: 'DOT', feeds: '§10 step 5 — placement prohibitions' },
];

/** Layers whose rules cannot fire yet — used to build the honest coverage note. */
export const PENDING_LAYERS = LAYER_REGISTRY.filter((l) => l.status === 'pending');
