# Rules Checklist — Where Can I Vend? (Prototype v1)

What the rule engine currently incorporates, with status. Distances and conditions are drawn
from NYC Admin Code §17-315 (Mobile Food Vendors) and §20-465 (General Vendors) and the agency
guidance in the engineering spec. **Statuses:**

- ✅ **Encoded** — implemented in the engine; changes the verdict.
- ⚠️ **Encoded, unverified** — logic exists but depends on an unresolved conflict; flagged provisional.
- 🟡 **Reminder only** — shown to the vendor; can't be checked on the map (no per-spot data possible).
- ⏳ **Encoded, data pending** — rule is built; won't trigger until the City data layer is supplied.
- 🚫 **Blocked / out of scope**

---

## A. Stay-away distances (buffers)

| Rule | Distance | Applies to | Status |
|---|---|---|---|
| Subway entrance / exit | **10 ft** | Both | ✅ Encoded (real MTA data) |
| Crosswalk | **10 ft** | Food only | ⏳ Data pending (CSCL/crosswalks) |
| Street corner / intersection | **10 ft** | General only | ⏳ Data pending (CSCL) |
| Driveway / curb cut | **10 ft** | Both | ⏳ Data pending (no clean City layer) |
| Building / store entrance *(incl. grocery, theatre, assembly, residential service exit)* | **20 ft** | Both | ⏳ Data pending (building footprints) |
| Sidewalk café / stoop-line stand | **20 ft** | Both | ⏳ Data pending (DCWP licensed premises) |
| Bus shelter | **5 ft** | General only | ⏳ Data pending (DOT shelters) |
| Newsstand | **5 ft** | General only | ⏳ Data pending (DCWP newsstands) |
| Disabled-access (ADA) ramp | **5 ft** | General only | ⏳ Data pending |
| Bus stop / taxi stand | **Whole stop** | Both | ⏳ Data pending (MTA/DOT) |
| Hospital no-standing zone | **Abutting sidewalk** | Both | ⏳ Data pending |
| Fire hydrant | No contact; **stay-away distance unverified** | Both | ⚠️ Encoded, unverified (distance pending legal confirmation) |
| Metered parking space (vending from roadway) | Not permitted | Food (roadway) | 🟡 Reminder |

> Engine note: distance buffers are pre-computed exclusion polygons. Subway is live today; the
> rest are wired but dormant until each City layer is supplied.

## B. Placement, footprint & operational

| Rule | Condition | Applies to | Status |
|---|---|---|---|
| Clear sidewalk path | **≥ 12 ft** clear (<12 ft prohibited; 12–15 ft restricted) | Both | ⏳ Data pending (sidewalk widths) |
| Curb placement | Cart/stand on the **curb side only**, never the building line | Both | 🟡 Reminder |
| No touching street furniture | No contact with lampposts, meters, hydrants, tree boxes, benches, shelters, etc. | Both | 🟡 Reminder |
| No vending over grates / manholes | Not over any ventilation grate, cellar door, manhole, subway grating | Both | 🟡 Reminder (no citywide layer) |
| No bike lanes | Not in a bicycle lane | Both | ⏳ Data pending (DOT bike lanes) |
| No medians | Not on a road median unless a designated pedestrian mall/plaza | Both | ✅ Encoded (when flagged) |
| Scaffolding / sidewalk shed | May obstruct the spot — check on site | Both | ⚠️ Advisory; data pending (DOB) |
| General Vendor footprint | Max **8 ft** along curb × **3 ft** deep × **5 ft** tall; table/rack; no electricity | General / 1st Amд. | 🟡 Reminder |
| Mobile Food Vendor footprint | Longest side parallel to curb; keep a cover over food | Food | 🟡 Reminder |

## C. Zone-based prohibitions — and veteran exemptions

| Zone | Standard / base rule | Veteran exemption | Status |
|---|---|---|---|
| **C4 / C5 / C6 commercial zoning** | Prohibited for **Standard** General Vendors | **Yellow & Blue exempt** (disabled vets) | ⏳ Data pending (DCP zoning) — *logic ✅* |
| **Midtown Core** (30th–65th St, 2nd Ave–9th/Columbus) | Prohibited for Standard **and Yellow** | **Blue only** may vend | ✅ Encoded (statutory boundary) |
| **Downtown Flushing** | Prohibited for **Standard** | **Yellow & Blue exempt** | ✅ Encoded (statutory boundary) |
| **Dyker Heights** (holiday hours) | Restricted for **Standard** merch, Thanksgiving–New Year's, 12am–6am & 2pm–12am | **Yellow & Blue exempt** | ✅ Encoded (statutory boundary + time) |
| **World Trade Center zone** | Prohibited (limited food-street exceptions) | — | ⚠️ Blocked (Conflict C-1: Barclay vs. Vesey border) |

> **Veteran summary:** *Yellow* = Citywide Specialized (disabled vets) → exempt from C4/C5/C6,
> Flushing, and Dyker Heights. *Blue* = Midtown Core Specialized (disabled vets) → all of the
> above **and** the only license permitted in the Midtown Core.

## D. Time & seasonal

| Rule | Condition | Applies to | Status |
|---|---|---|---|
| DOHMH restricted streets | Per-street hours/days limits | Food | ⏳ Data pending (DS-001) — *logic ✅, illustrative sample* |
| Dyker Heights holiday hours | See zone table above | General (Standard) | ✅ Encoded |
| Seasonal permit validity | Valid **April 1 – October 31** only | Food (Seasonal) | ✅ Encoded |

## E. License geography

| Rule | Condition | Status |
|---|---|---|
| Borough-specific food permit | Valid in one borough; **never Manhattan** | ✅ Encoded |
| Green Cart permit | Only in the assigned police precinct; produce only | ✅ Encoded (illustrative precinct) |
| Citywide food permit | All five boroughs | ✅ Encoded |

## F. Out of scope (gray, not "prohibited")

| Surface | Status |
|---|---|
| Parks (DPR concession system) | ✅ Encoded (illustrative); ⏳ full data pending |
| Pedestrian plazas (DOT concession) | ⏳ Data pending |
| Outside the five boroughs / water | ✅ Encoded |

## G. Blocked / not encoded (see Open Questions log)

- **C-1** WTC zone boundary (Barclay vs. Vesey St) — needs SBS Legal.
- **C-2** First Amendment vendor treatment (Blue-equivalent vs. general vendor) — returns "undetermined."
- **C-3** 853 license cap — intentionally not encoded (engine is cap-agnostic).
- **C-6** Replace/federate/link the existing agency maps — gates the data architecture.

---

*Precedence:* rules are evaluated top-to-bottom and stop at the first match — out of scope →
hard prohibition → zone-by-license → time/seasonal → distance buffers → scaffolding → sidewalk
width → otherwise permitted. Full legal citations live in `src/engine/citations.ts`; data
sourcing/status is in `docs/Data_Sources_and_Gaps.xlsx`.
