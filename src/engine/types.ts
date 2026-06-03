/**
 * Core types for the Street Vendor rule engine.
 *
 * The engine is a PURE function: (VendorConfig, LocationFacts, EvalTime?) -> Verdict.
 * It performs NO geometry math and NO I/O. A separate data layer resolves a point on
 * the map into `LocationFacts` (joins to CSCL, pre-computed turf buffers, zoning, etc.)
 * and feeds those facts in. This keeps legal logic framework-independent and unit-testable.
 *
 * Spec of record: Street_Vendor_Site_Selection.docx, "Engineer Team" section, §10 precedence.
 * Open conflicts that MUST NOT be encoded yet: C-1, C-2, C-3, C-6 (see Open_Questions_Log.docx).
 */

export type Borough =
  | 'Manhattan'
  | 'Bronx'
  | 'Brooklyn'
  | 'Queens'
  | 'Staten Island';

// ---- Level 1: vendor type ----
export type VendorType = 'food' | 'merch' | 'firstAmendment';

// ---- Level 2: license sub-type (this is what drives the legal surface) ----
export type FoodLicense = 'citywide' | 'borough' | 'greenCart' | 'seasonal';
export type MerchLicense = 'standard' | 'yellow' | 'blue';
export type FirstAmendmentLicense = 'firstAmendment';
export type LicenseSubType = FoodLicense | MerchLicense | FirstAmendmentLicense;

export interface VendorConfig {
  vendorType: VendorType;
  license: LicenseSubType;
  /** Required for food `borough` permits — the single borough the permit is valid in. */
  permittedBorough?: Borough;
  /** Required for food `greenCart` permits — the assigned police-precinct identifier. */
  greenCartPrecinct?: string;
}

/**
 * Time of evaluation, expressed in explicit America/New_York wall-clock components so the
 * engine stays pure and timezone-unambiguous. The caller (live view = now, planning view =
 * picked day/time) is responsible for resolving these in the NYC timezone.
 */
export interface EvalTime {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  /** Minutes from local midnight (0–1439). */
  minutesIntoDay: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  /** Full year, e.g. 2026. Needed to compute Thanksgiving (4th Thursday of November). */
  year: number;
}

/** A window during which MFV vending is RESTRICTED (not allowed) on a given street. */
export interface DayWindow {
  /** Days the window applies to. 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Minutes from midnight the restriction starts (inclusive). */
  startMinutes: number;
  /** Minutes from midnight the restriction ends (exclusive). */
  endMinutes: number;
}

/** DOHMH Restricted Streets entry for a Mobile Food Vendor segment (DS-001). */
export interface MfvStreetRestriction {
  yearRound: boolean;
  /** Seasonal bounds as 'MM-DD' when not year-round. */
  seasonalStart?: string;
  seasonalEnd?: string;
  /** Windows during which food vending is NOT allowed on this street. */
  restrictedWindows: DayWindow[];
}

/**
 * Pre-resolved spatial facts about a single location, produced by the data layer.
 * Every field is optional and defaults to "rule does not apply here". The engine never
 * infers geometry — if a fact is absent, the corresponding rule is treated as not triggered.
 */
export interface LocationFacts {
  borough: Borough;

  // 1. Out of scope (gray) — separate licensing regimes, NOT prohibitions.
  inPark?: boolean;
  inPedestrianPlaza?: boolean;

  // 2. Hard prohibition — WTC absolute no-exception MFV segments, §17-315(k)(1).
  //    BLOCKED (C-1): WTC boundary geometry is unverified (Barclay vs Vesey north border).
  //    Only ever set from clearly-labeled mock fixtures; verdicts are flagged `unverified`.
  inWtcAbsoluteSegment?: boolean;

  // 3. Zone exclusion by SKU.
  inWtcZone?: boolean; // BLOCKED (C-1) — see above.
  wtcMfvException?: boolean; // on one of the named MFV-exception streets within the WTC zone.
  /** Zoning district label from DS-012, e.g. 'C5-3'. C4/C5/C6 exclude standard GV. */
  zoningDistrict?: string;
  inMidtownCore?: boolean;
  inFlushingZone?: boolean;

  // 4. Time / seasonal.
  inDykerHeights?: boolean;
  /** DOHMH restricted-street entry for this segment (food vendors only). */
  mfvRestriction?: MfvStreetRestriction;

  // License geography (evaluated within the zone step).
  /** The Green Cart precinct this location falls in, if any (DS-005). */
  greenCartPrecinct?: string;

  // 5. Distance buffers & placement prohibitions (pre-computed polygons).
  withinSubwayBuffer?: boolean; // 10 ft, both
  withinCrosswalkBuffer?: boolean; // 10 ft, MFV only
  withinCornerBuffer?: boolean; // 10 ft, GV only
  withinDrivewayBuffer?: boolean; // 10 ft, both (approximated — GAP-001)
  withinBuildingEntranceBuffer?: boolean; // 20 ft, both
  withinSidewalkCafeBuffer?: boolean; // 20 ft, both
  withinBusShelterBuffer?: boolean; // 5 ft, GV only
  withinNewsstandBuffer?: boolean; // 5 ft, GV only
  withinAdaRampBuffer?: boolean; // 5 ft, GV only
  withinBusStopOrTaxiStand?: boolean; // entire stop, both
  abutsHospitalNoStanding?: boolean; // both
  inBikeLane?: boolean; // both
  onMedian?: boolean; // both (non-plaza median)

  // 6. Sidewalk width — clear pedestrian path in feet.
  sidewalkClearFt?: number;

  /** Human-readable labels of any mock/approximated layer used to derive these facts.
   *  Surfaced in the UI so vendors know which inputs are not yet authoritative. */
  mockLayers?: string[];
}

export type VerdictStatus = 'permitted' | 'restricted' | 'prohibited' | 'outOfScope';

export interface Reason {
  /** Emoji/icon hint for the UI. */
  icon: string;
  /** Stable machine code, e.g. 'WTC_ZONE'. Used for i18n keys and tests. */
  code: string;
  title: string;
  detail: string;
  /** Legal citation, when the reason maps to a specific code section. */
  citation?: string;
}

export interface Verdict {
  status: VerdictStatus;
  title: string;
  /** Ordered explanations for the verdict (why it is green/yellow/red/gray). */
  reasons: Reason[];
  /** Operational reminders shown for permitted/restricted spots (curb, furniture, size…). */
  reminders: Reason[];
  /**
   * True when the verdict depends on a rule touching an unresolved conflict
   * (C-1 WTC border, C-2 First Amendment treatment). The UI MUST surface a caveat
   * and not present these as authoritative.
   */
  unverified: boolean;
  /** Labels of mock/approximated layers that contributed to this verdict. */
  mockLayers: string[];
}

// ---- Internal rule plumbing ----

export interface RuleContext {
  config: VendorConfig;
  facts: LocationFacts;
  at?: EvalTime;
  /** Non-terminal reasons accumulated by earlier rules (e.g. "exempt because Blue license"). */
  acc: Reason[];
}

/** A rule either STOPS evaluation with a terminal verdict, or CONTINUEs to the next rule. */
export type RuleResult =
  | {
      stop: true;
      status: VerdictStatus;
      title: string;
      reasons: Reason[];
      unverified?: boolean;
      mockLayers?: string[];
    }
  | {
      stop: false;
      reasons?: Reason[];
      unverified?: boolean;
      mockLayers?: string[];
    };

export type Rule = (ctx: RuleContext) => RuleResult;
