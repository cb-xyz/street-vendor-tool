# Rules Checklist — Where Can I Vend? (Prototype)

What the rule engine incorporates, with status. Distances/conditions come from NYC Admin Code
§17-315 (Mobile Food Vendors) and §20-465 (General Vendors) and agency guidance.
**Last updated: 2026-06-04.**

**Status key:**
- ✅ **Live** — real City data wired in; affects verdicts and shows on the map.
- 📐 **Statutory** — geometry encoded from the Admin Code boundary text (approximate; no file needed).
- 🧪 **Illustrative** — sample geometry standing in until the gated dataset arrives.
- ⏳ **Pending** — rule is built; dormant until the City data layer is supplied.
- ⚠️ **Unverified / blocked** — needs a legal or policy decision, not just data.

---

## At-a-glance summary

- **✅ Live on real City data:** allowed **sidewalks** (green, citywide), **C4/C5/C6 commercial zoning**, **parks**, **subway** 10 ft buffers, **fire-hydrant** 10 ft buffers, borough boundaries.
- **📐 Statutory (encoded from the code):** Midtown Core, Downtown Flushing, Dyker Heights.
- **🧪 Illustrative (awaiting gated data):** DOHMH restricted streets, Green Cart precincts, scaffolding/sheds.
- **⏳ Pending data:** DCWP General Vendor street list, sidewalk widths, and most secondary buffers (crosswalk, corner, driveway, building entrance, café, bus shelter, newsstand, ADA ramp, bus stop, hospital), bike lanes, pedestrian plazas.
- **⚠️ Blocked on a decision:** WTC boundary (C-1), First Amendment treatment (C-2), tool-vs-agency-maps scope (C-6).

---

## A. Stay-away distances (buffers)

| Rule | Distance | Applies to | Status |
|---|---|---|---|
| Subway entrance / exit | **10 ft** | Both | ✅ Live (MTA data, citywide) |
| Fire hydrant | **10 ft** *(distance unverified)* | Both | ✅ Live (NYCDEP data, citywide); exact distance ⚠️ pending legal confirmation |
| Crosswalk | **10 ft** | Food only | ⏳ Pending (CSCL/crosswalks) |
| Street corner / intersection | **10 ft** | General only | ⏳ Pending (CSCL) |
| Driveway / curb cut | **10 ft** | Both | ⏳ Pending (no clean City layer) |
| Building / store entrance *(incl. grocery, theatre, assembly, residential service exit)* | **20 ft** | Both | ⏳ Pending (building footprints) |
| Sidewalk café / stoop-line stand | **20 ft** | Both | ⏳ Pending (DCWP licensed premises) |
| Bus shelter | **5 ft** | General only | ⏳ Pending (DOT shelters) |
| Newsstand | **5 ft** | General only | ⏳ Pending (DCWP newsstands) |
| Disabled-access (ADA) ramp | **5 ft** | General only | ⏳ Pending |
| Bus stop / taxi stand | **Whole stop** | Both | ⏳ Pending (MTA/DOT) |
| Hospital no-standing zone | **Abutting sidewalk** | Both | ⏳ Pending |
| Metered parking space (vending from roadway) | Not permitted | Food (roadway) | 🟡 Reminder |

## B. Where vending is allowed, placement & footprint

| Rule | Condition | Applies to | Status |
|---|---|---|---|
| **On a sidewalk** (allowed-area surface) | Vending only on the public sidewalk | Both | ✅ Live (real DCP sidewalk polygons, citywide — the green areas) |
| Clear sidewalk path | **≥ 12 ft** clear (<12 ft prohibited; 12–15 ft restricted) | Both | ⏳ Pending (sidewalk **widths**) |
| Curb placement | Curb side only, never the building line | Both | 🟡 Reminder |
| No touching street furniture | No contact with lampposts, meters, hydrants, benches, shelters, etc. | Both | 🟡 Reminder |
| No vending over grates / manholes | — | Both | 🟡 Reminder (no citywide layer) |
| No bike lanes | Not in a bicycle lane | Both | ⏳ Pending (DOT bike lanes) |
| No medians | Not on a road median unless a designated pedestrian mall/plaza | Both | ✅ Encoded (when flagged) |
| Scaffolding / sidewalk shed | May obstruct the spot — check on site | Both | 🧪 Advisory; data pending (DOB) |
| General Vendor footprint | Max 8 ft × 3 ft, 5 ft tall; table/rack; no electricity | General / 1st Amд. | 🟡 Reminder |
| Mobile Food Vendor footprint | Longest side parallel to curb; keep a cover over food | Food | 🟡 Reminder |

## C. Zone-based prohibitions — and veteran exemptions

| Zone | Standard / base rule | Veteran exemption | Status |
|---|---|---|---|
| **C4 / C5 / C6 commercial zoning** | Prohibited for **Standard** General Vendors | **Yellow & Blue exempt** (disabled vets) | ✅ Live (real DCP zoning, citywide) |
| **Midtown Core** (30th–65th St, 2nd Ave–9th/Columbus) | Prohibited for Standard **and Yellow** | **Blue only** may vend | 📐 Statutory |
| **Downtown Flushing** | Prohibited for **Standard** | **Yellow & Blue exempt** | 📐 Statutory |
| **Dyker Heights** (holiday hours) | Restricted for **Standard** merch, Thanksgiving–New Year's, 12am–6am & 2pm–12am | **Yellow & Blue exempt** | 📐 Statutory + time |
| **World Trade Center zone** | Prohibited (limited food-street exceptions) | — | ⚠️ Blocked (C-1: Barclay vs. Vesey border) |

> **Veteran summary:** *Yellow* = Citywide Specialized (disabled vets) → exempt from C4/C5/C6,
> Flushing, and Dyker Heights. *Blue* = Midtown Core Specialized → all of the above **and** the
> only license permitted in the Midtown Core. The map recolors these zones green for Yellow/Blue.

## D. Time & seasonal

| Rule | Condition | Applies to | Status |
|---|---|---|---|
| DOHMH restricted streets | Per-street hours/days limits | Food | 🧪 Illustrative (logic ✅; real DS-001 pending) |
| Dyker Heights holiday hours | See zone table above | General (Standard) | 📐 Statutory + time |
| Seasonal permit validity | Valid **April 1 – October 31** only | Food (Seasonal) | ✅ Encoded |

## E. License geography

| Rule | Condition | Status |
|---|---|---|
| Borough-specific food permit | Valid in one borough; **never Manhattan** | ✅ Encoded |
| Green Cart permit | Only in the assigned police precinct; produce only | 🧪 Illustrative precinct (logic ✅; real DS-005 pending) |
| Citywide food permit | All five boroughs | ✅ Encoded |

## F. Out of scope (gray, not "prohibited")

| Surface | Status |
|---|---|
| Parks (DPR concession system) | ✅ Live (real Parks Properties, citywide) |
| Pedestrian plazas (DOT concession) | ⏳ Pending |
| Outside the five boroughs / water | ✅ Encoded |

## G. Blocked / not encoded (see Open Questions log)

- **C-1** WTC zone boundary (Barclay vs. Vesey St) — needs SBS Legal.
- **C-2** First Amendment vendor treatment (Blue-equivalent vs. general vendor) — app returns "undetermined."
- **C-3** 853 license cap — intentionally not encoded (engine is cap-agnostic).
- **C-6** Replace / federate / link the existing agency maps — gates the data architecture.

---

*Precedence:* rules evaluate top-to-bottom and stop at the first match — out of scope → hard
prohibition → zone-by-license → time/seasonal → distance buffers → scaffolding → sidewalk width →
otherwise permitted. Citations: `src/engine/citations.ts`. Data sourcing/status:
`docs/Data_Sources_and_Gaps.xlsx`.
