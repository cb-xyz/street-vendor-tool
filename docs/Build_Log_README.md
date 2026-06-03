# Build Log — Street Vendor Site Selection Tool (v1 kickoff work)

**Date:** 2026-06-03 · **Prepared by:** Live XYZ (kickoff session) · **For:** engineering + PM audit

This log documents every artifact produced in this session, what is real vs. mock, and what was independently verified vs. carried from internal documents. Treat it as the provenance record for the v1 deliverables.

---

## Artifacts produced

| File | What it is | Audience |
|---|---|---|
| `Data_Acquisition_Tracker_v2.xlsx` | Official rebuild of the 41-dataset inventory with verification status, deliverable-blocking map, P1 critical path, live status dashboard, change log | Data lead, engineering, PM |
| `Open_Questions_Log.docx` | All conflicts/corrections + open questions organized by agency (DOHMH, DCWP, DCP, DOT, DPR, DSNY, others) + cross-cutting SBS questions | PM, SBS, agency outreach |
| `vendor_prototype.html` | Clickable mobile-first UX prototype: vendor-type → license → color-coded map with the §10 rule-precedence engine, plain-language rule cards, real resource links | SBS demo, vendor testing, Deliverable #3 demo |
| `Build_Log_README.md` | This file | Everyone |

---

## What is REAL vs. MOCK in the prototype

**Real:**
- The rule-precedence logic follows the engineering doc §10 order exactly: out-of-scope → hard prohibition → SKU zone exclusion → time restriction → distance buffer → sidewalk width → permitted.
- The vendor-type / license SKU taxonomy matches engineer doc §2 (MFV citywide/borough/Green Cart/seasonal; GV standard/Yellow/Blue; First Amendment).
- The resource links are verified live City URLs (DSNY enforcement hub, DOHMH/DCWP application pages, 311 complaint article).
- The First Amendment profile is encoded as **Blue-equivalent** per the verified DSNY page (NOT GV-equivalent — see conflict C-2).

**Mock (clearly labeled in-app with a banner):**
- The map is a 5×6 fake grid, not real NYC streets. Block features (park, Midtown Core, C4/C5/C6, WTC, restricted street, Green Cart precinct, subway buffer, narrow sidewalk, bus stop) are planted by hand to exercise each rule path.
- No real geometry. The production version joins to CSCL (DS-013) and the P1 datasets.
- Languages: only header/subhead strings are translated as a demo of the multilingual requirement; full translation is Deliverable #3 scope (10 LL30 languages + Wolof).

---

## Verification performed this session (2026-06-03)

Independently confirmed against primary/public sources:
- **DSNY is lead enforcement agency since April 2023** and already publishes the General Vendor Street Restrictions Map (DCWP ArcGIS), the Mobile Food Vending Streets map (DOHMH), and educational guides in 12 languages incl. Wolof. → `nyc.gov/.../street-vending-enforcement.page`
- **DS-007 (DCWP ArcGIS Experience) is live** and IS the official public GV map. Reuse, don't rebuild.
- **DOHMH public MFV map** live at `a816-dohbesp.nyc.gov/IndicatorPublic/mobilefoodvending`. The DS-001 GIS export still requires an agency request.
- **Local Law 54 of 2026** opens new GV licenses after Jan 15, 2027; reform package (Intro 431-B) adds ~10,500 GV + 2,100–2,200 food permits/yr to 2031 → the 853 cap is being dismantled (conflict C-3).
- **DCWP testimony (5/2025):** ~1,900 licensed GVs exist; 853 is the *non-veteran* cap, not the total (conflict C-4).
- **E.D. Carina Kaufman-Gutierrez** appointed 3/25/2026 (Intro 408-A); office created within SBS.
- **SBS "Venture Forward" Challenge-Based Procurement** (12/19/2025) is the public challenge framing.

Could NOT verify this session (flagged, not assumed):
- The specific Live XYZ mapping-tool challenge statement (not found publicly; user confirms it was a mapping-tool response that won a contract).
- Individual ArcGIS/Socrata layers beyond those above — links carried from the internal inventory are marked "Unverified" in the tracker.

---

## Conflicts found (full detail in Open_Questions_Log.docx)

1. **C-1 (HARD):** WTC Zone north border — internal docs say *Barclay St*; official 2023 DCWP guide says *Vesey St*. Do not encode until §20-465(g)(2) is confirmed.
2. **C-2 (HARD):** First Amendment vendors — transcript says "same as general vendors"; DSNY says "same as Blue licensees." Encoded as Blue-equivalent in the prototype pending confirmation.
3. **C-3 (copy):** 853 cap is obsolete-by-design. Logic must be cap-agnostic.
4. **C-4 (copy):** 853 = non-veteran cap, not total licensed population.
5. **C-5 (admin):** Kickoff date discrepancy (June 10 prep doc vs. June 3 actual). Per instruction, June 3 is canonical.
6. **C-6 (scope):** Two official City maps already exist — confirm whether this tool replaces, federates, or links to them. Biggest open scope question.

---

## Data discrepancy between the two internal docs

- Engineer doc §9 lists **DS-040 as Community/OSM** and frames DS-034 as "top priority"; the spreadsheet's Critical-path tab lists **8 P1 blockers** and gives DS-012/013/034 the earliest target (June 7). The tracker v2 uses the spreadsheet's 8-dataset P1 set as canonical and records this in its Change Log.

---

## Recommended next steps (post-contract execution)

1. Get SBS to confirm the **map relationship** (C-6) — this gates the architecture.
2. Sequence agency intros to unblock P1 data: **DCP (DS-012/013, public, fastest) → MTA (DS-034) → DCWP (DS-007) → DOHMH (DS-001/003/005)**.
3. Resolve the two HARD conflicts (C-1, C-2) with DCWP/SBS Legal before any encoding.
4. Obtain the IBO and Cornell reports promised at kickoff.
5. Use this prototype for the Deliverable #2 vendor survey and SBS listening sessions to validate the entry-flow and verdict UX.
