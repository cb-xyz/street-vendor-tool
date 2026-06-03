# CLAUDE.md — Street Vendor Site Selection Tool

> This file orients Claude Code on the project. Keep it at the repo root. Claude Code reads it automatically at the start of every session. Update it as decisions get made.

## What we're building

A public, mobile-first web map that tells any NYC street vendor **where they can legally vend**, configured to their specific vendor type and license. Built for the NYC Office of Street Vendor Services (SBS), in partnership between Live XYZ and the Street Vendor Project. Used by vendors AND enforcement/agency staff — one public tool, no separate logged-in views (decision from kickoff).

The core job: translate dispersed NYC vending rules into a color-coded map — **Permitted (green) / Restricted (yellow) / Prohibited (red) / Out-of-scope (gray)** — that updates based on who the vendor is and (for food) what time it is.

## The non-negotiable UX model: vendor-type configuration

The map is **configured per vendor**, in two levels. This drives the rule engine, not just the display — several sub-types change which geometry is drawn, not merely what's shown.

**Level 1 — Vendor type:**
- **Food (Mobile Food Vendor / MFV)** — regulated by DOHMH
- **General / Merchandise (GV)** — regulated by DCWP
- **First Amendment** — no license required, but follows placement rules

**Level 2 — License sub-type (this is the part that matters most):**
- MFV: **Citywide** | **Borough-specific (outer-borough, not Manhattan)** | **Green Cart (precinct-level)** | **Seasonal (Apr 1–Oct 31)**
- GV: **Standard (White)** | **Specialized Yellow (citywide, disabled veterans)** | **Specialized Blue (Midtown Core, disabled veterans)**
- First Amendment: single profile, but SEE CONFLICT C-2 below — it follows Blue-licensee rules per DSNY, not GV rules.

**Architecture implication:** each license sub-type effectively needs its own pre-computed legal-surface layer. Borough-only flips Manhattan to prohibited. Green Cart swaps in the assigned-precinct layer. Blue vs. standard flips Midtown Core and C4/C5/C6 between red and green. Do NOT build this as one map with a front-end filter on top — build it as a rule engine that takes (vendorType, licenseSubType, location, datetime) and returns a verdict + reasons.

**Time dimension (food only, but first-class):** the DOHMH restricted-streets list is hours/days-based. Support both a "live view" (now) and a "planning view" (pick a day + time) — this was explicitly requested at kickoff as the live-vs-planning distinction.

## Rule engine — precedence order (implement exactly)

Evaluate location against the configured vendor in this order; stop at first match:
1. **Out of scope** (parks/plazas/concessions) → gray, stop. NOT "prohibited."
2. **Hard prohibition zone** (WTC absolute streets) → red, stop.
3. **Zone exclusion by SKU** (C4/C5/C6, Midtown Core, Flushing, WTC-with-exceptions) → red for standard; permitted/restricted for specialized.
4. **Time/seasonal restriction** (DOHMH restricted streets, Dyker Heights seasonal) → yellow + hours.
5. **Distance buffers** (subway 10ft, crosswalk, driveway, building entrance, bus shelter, etc.) → red at buffered segment.
6. **Sidewalk width** (<12 ft clear) → red/restricted.
7. **Otherwise** → green, with operational reminders (curb placement, no touching furniture, size limits).

Full rule text, legal citations, and per-rule data sources are in the engineering requirements doc (Street_Vendor_Site_Selection.docx, "Engineer Team" section). That doc is the spec of record for rule logic.

## HARD blockers — do NOT encode these until resolved (see Open_Questions_Log.docx)

- **C-1 WTC north border:** internal docs say Barclay St; official 2023 DCWP guide says Vesey St. Confirm against §20-465(g)(2) before encoding. Mislabels a full Lower Manhattan block.
- **C-2 First Amendment treatment:** transcript says "same as general vendors"; DSNY says "same as Blue licensees." These differ (Blue can enter Midtown Core). Lock this before building the First Amendment profile.
- **C-3 License cap:** do NOT hardcode the 853 GV cap. LL54/2026 + Intro 431-B dismantle it starting Jan 2027 — inside the contract window. All license logic must be cap-agnostic.
- **C-6 Scope (biggest):** the City ALREADY publishes a DCWP General Vendor map (ArcGIS) and a DOHMH Mobile Food Vending map. Confirm with SBS whether this tool REPLACES, FEDERATES, or LINKS to them. This decides the data architecture. Until decided, build the engine to consume those services rather than assuming we own the rules.

## Data — what to pull now vs. what is gated

**Pull now (public, no contract needed) — start here:**
- DS-013 NYC Street Centerline (CSCL) — base join key for everything
- DS-012 NYC GIS Zoning Features — C4/C5/C6 exclusion
- DS-034 MTA Subway Entrances & Exits — 10ft buffers, 5,000+ points
- DS-007 DCWP General Vendor Street Restrictions (ArcGIS Experience — verified live; written license preferred before production)
- DOHMH public Mobile Food Vending map (a816-dohbesp.nyc.gov/IndicatorPublic/mobilefoodvending)

**Gated behind contract execution + SBS agency intros (P1 blockers):**
- DS-001 DOHMH Restricted Streets GIS, DS-003 Restricted Area zones, DS-005 Green Cart precincts (request from DOHMH)
- DS-023 DSNY ECB citation records (for evaluation metrics)

Full inventory with URLs, priorities, owners, and verification status: **Data_Acquisition_Tracker_v2.xlsx**.

## Recommended stack (propose alternatives if you disagree)

- **Framework:** React + Vite + TypeScript
- **Map:** MapLibre GL JS (open-source, no token) with NYC basemap; or Leaflet if simpler. Avoid anything needing a paid key for the pilot.
- **Geometry:** load NYC layers as GeoJSON/vector tiles; pre-compute prohibition polygons offline (turf.js for buffers) rather than at query time, per engineer doc.
- **Rule engine:** a pure, testable TS module `ruleEngine.ts` that takes (vendorConfig, location, datetime) → verdict. Unit-tested against every rule path. This is the heart of the app — keep it framework-independent.
- **i18n:** scaffold for 10 NYC Local Law 30 languages + Wolof from day one (don't retrofit). DSNY already has 12-language vendor guides — reuse that terminology.
- **Accessibility & mobile:** designed for a phone, not a desktop, per kickoff. WCAG AA, large tap targets, works on low-end devices.
- **No browser localStorage dependency** for core function; vendor config can live in URL params so a spot is shareable.

## Build order

1. Scaffold repo, stack, CLAUDE.md, README, test runner.
2. Build `ruleEngine.ts` + full unit tests against the §10 precedence logic, using the existing prototype's mock fixtures as initial test cases.
3. Wire the vendor-type/sub-type configuration UI (Level 1 → Level 2 → map).
4. Integrate the public-now datasets (CSCL, zoning, subway) over a real basemap for ONE borough (Manhattan) as the pilot surface.
5. Add the time/planning view for food vendors.
6. Stub the gated datasets behind a clean interface so they drop in when acquired; clearly label any mock layer in the UI.
7. i18n scaffold + resource links to verified City pages.

## Reference files (in this repo's /docs)

- `vendor_prototype.html` — the clickable prototype; the UX + rule-precedence reference. Production should match its flow and exceed its fidelity. Its map data is MOCK.
- `Street_Vendor_Site_Selection.docx` — PM rules doc + full engineering requirements (spec of record for rules).
- `Open_Questions_Log.docx` — conflicts and per-agency questions; check before encoding any rule.
- `Data_Acquisition_Tracker_v2.xlsx` — dataset inventory, priorities, verification status.
- `Build_Log_README.md` — provenance: what's verified vs. mock.

## Working agreements for Claude Code

- Always check Open_Questions_Log before encoding a rule that touches C-1, C-2, C-3, or C-6.
- Never invent rule text or boundaries; if a rule isn't confirmable from the engineer doc or an official source, flag it and leave it unencoded.
- Label every mock/approximated layer visibly in the UI (the prototype's banner pattern).
- Keep the rule engine pure and tested; UI changes must not silently change legal logic.
- Commit in small, reviewable steps with clear messages; this work gets audited by SBS and agency partners.
