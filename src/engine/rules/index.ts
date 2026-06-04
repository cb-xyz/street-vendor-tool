/**
 * The ordered rule pipeline — the §10 precedence list, top to bottom.
 * The engine runs these in order and STOPS at the first rule that returns a terminal verdict.
 * Steps that do not apply return `{ stop: false }` (optionally accumulating non-terminal reasons).
 */
import { distanceBuffers } from './distanceBuffers';
import { hardProhibition } from './hardProhibition';
import { obstructions } from './obstructions';
import { outOfScope } from './outOfScope';
import { sidewalkWidth } from './sidewalkWidth';
import { timeRestriction } from './timeRestriction';
import { zoneExclusion } from './zoneExclusion';
import type { Rule } from '../types';

/** Precedence order — do not reorder without legal review (CLAUDE.md working agreements). */
export const RULE_PIPELINE: Rule[] = [
  outOfScope, //       1. outside NYC / parks / plazas → gray
  hardProhibition, //  2. WTC absolute        → red   (C-1 unverified)
  zoneExclusion, //    3. zone by SKU         → red/green (C-1, C-2 unverified)
  timeRestriction, //  4. time / seasonal     → yellow
  distanceBuffers, //  5. buffers / placement → red
  obstructions, //     5b. scaffolding/sheds  → yellow advisory
  sidewalkWidth, //    6. sidewalk width      → red/yellow
  // 7. default permitted is applied by the engine if no rule stops.
];
