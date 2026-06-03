/**
 * MOCK map surface — a 5×6 grid of illustrative "blocks", each carrying real LocationFacts.
 *
 * ⚠️ THIS IS FAKE GEOMETRY. It exists so the UI can exercise the REAL rule engine end-to-end
 * before the production data layer (CSCL joins + pre-computed turf buffers over the P1 datasets)
 * is wired in. The blocks mirror the planted features from docs/vendor_prototype.html, but here
 * every block resolves to LocationFacts and the verdict comes from evaluate() — no rule logic
 * is duplicated in the UI. The production surface will replace this module wholesale.
 */
import type { LocationFacts } from '../engine/types';

export interface MockBlock {
  index: number;
  row: number;
  col: number;
  /** Short label for the result card. */
  label: string;
  facts: LocationFacts;
}

export const COLS = 5;
export const ROWS = 6;

const MOCK_LAYERS = ['Mock Manhattan grid (illustrative, not real streets)'];

function block(index: number, label: string, facts: Partial<LocationFacts>): MockBlock {
  return {
    index,
    row: Math.floor(index / COLS),
    col: index % COLS,
    label,
    facts: { borough: 'Manhattan', sidewalkClearFt: 18, mockLayers: MOCK_LAYERS, ...facts },
  };
}

/**
 * Hand-planted features (row, col → index = row*COLS + col):
 *  - Park (out of scope): (0,0)(0,1)(1,0)
 *  - Midtown Core band: rows 1–2, cols 2–4
 *  - C4/C5/C6 corridor: col 1, rows 2–4
 *  - WTC zone (C-1 unverified): (5,0)(5,1)
 *  - DOHMH restricted street (food): (3,3)
 *  - Green Cart precinct "40": (4,4)
 *  - Subway buffer: (2,0)(4,2)
 *  - Narrow sidewalk: (5,4)
 *  - Bus stop: (0,4)
 */
export const MOCK_SURFACE: MockBlock[] = (() => {
  const blocks: MockBlock[] = [];
  for (let i = 0; i < COLS * ROWS; i++) blocks.push(block(i, `Block #${i}`, {}));

  const set = (r: number, c: number, label: string, facts: Partial<LocationFacts>) => {
    const i = r * COLS + c;
    blocks[i] = block(i, label, facts);
  };

  set(0, 0, 'Riverside-style park', { inPark: true });
  set(0, 1, 'Park edge', { inPark: true });
  set(1, 0, 'Park edge', { inPark: true });

  for (const [r, c] of [[1, 2], [1, 3], [1, 4], [2, 2], [2, 3], [2, 4]] as const) {
    set(r, c, 'Midtown Core', { inMidtownCore: true });
  }

  for (const r of [2, 3, 4]) set(r, 1, 'C6 commercial corridor', { zoningDistrict: 'C6-2' });

  set(5, 0, 'WTC zone (border unverified)', { inWtcZone: true });
  set(5, 1, 'WTC zone (border unverified)', { inWtcZone: true });

  set(3, 3, 'Restricted food street', {
    mfvRestriction: {
      yearRound: true,
      restrictedWindows: [{ days: [1, 2, 3, 4, 5], startMinutes: 720, endMinutes: 1380 }],
    },
    mockLayers: [...MOCK_LAYERS, 'DOHMH restricted streets (mock)'],
  });

  set(4, 4, 'Green Cart precinct 40', { greenCartPrecinct: '40' });

  set(2, 0, 'Near subway entrance', { withinSubwayBuffer: true });
  set(4, 2, 'Near subway entrance', { withinSubwayBuffer: true });

  set(5, 4, 'Narrow sidewalk', { sidewalkClearFt: 9 });

  set(0, 4, 'Bus stop', { withinBusStopOrTaxiStand: true });

  return blocks;
})();
