# Project Handoff — Where Can I Vend? (NYC Street Vendor Site Selection Tool)

**For:** the design/engineering team taking ownership of the production build, deployment, and
customer-feedback iteration.
**From:** the prototype phase (Live XYZ × NYC SBS Office of Street Vendor Services × Street Vendor Project).
**Live prototype:** https://cb-xyz.github.io/street-vendor-tool/
**Last updated:** 2026-06-04.

---

## 1. What this is

A public, mobile-first web map that tells a NYC street vendor **where they can legally vend**,
configured to their **vendor type + license + location + time**. The core is a pure, tested
**rule engine** that turns NYC vending law into a color-coded verdict (Permitted / Restricted /
Prohibited / Out-of-scope). The map shows real allowed sidewalks (green) and exclusion zones, and
tapping any spot returns a plain-language verdict with legal citations, in 12 languages.

It is a **working prototype**, not a production system. Several data layers are real; some are
illustrative samples pending gated agency data; a few rules are blocked on legal/policy decisions
(see §6). The app carries a "PROTOTYPE — sample data" banner by design.

---

## 2. Key documents (read these first)

All in `docs/`:

| File | What it is |
|---|---|
| **`Data_Sources_and_Gaps.xlsx`** | ⭐ **The inventory of every data file/source used to build the map** — per layer: owning agency, what rule it feeds, status (live / illustrative / pending), and where it was sourced. **This is the file that lists all data files used.** Also lists what's still missing from the City. |
| `Rules_Checklist.pdf` / `Rules_Checklist.md` | Every rule the engine incorporates, color-coded by status; includes the veteran exemptions and precedence order. |
| `Release_Notes.docx` | Narrative status: what's built, conflicts, missing data, remaining work. *(Note: predates the citywide real-data integration — cross-check against this handoff + the xlsx.)* |
| `Open_Questions_Log.docx` | The source-of-record for the C-1…C-6 conflicts and per-agency open questions. **Read before encoding any new rule.** |
| `Street Vendor Site Selection.docx` | The PM rules doc + full **engineering requirements** (the spec of record for rule logic, §10 precedence, dataset mapping). |
| `Build_Log_README.md` | Provenance of the original kickoff artifacts (what was verified vs. mock at the start). |
| `Data_Acquisition_Tracker_v2.xlsx` | The original 41-dataset acquisition tracker (priorities, owners). |
| `vendor_prototype.html` | The original clickable UX prototype (historical reference). |

Also at repo root: **`CLAUDE.md`** (project orientation + working agreements) and **`README.md`**
(stack, scripts, architecture).

---

## 3. Repo map

```
street-vendor-tool/
├── HANDOFF.md            ← you are here
├── CLAUDE.md             ← project orientation + working agreements (rules engineers must follow)
├── README.md             ← stack, scripts, architecture overview
├── index.html            ← entry; <title>, favicon, social-share (OG) tags
├── docs/                 ← all deliverable documents (see §2)
├── public/
│   └── data/             ← large FETCHED map assets (served by URL, not bundled)
│       ├── sidewalks.geojson   (21 MB — citywide allowed sidewalks)
│       └── hydrants.geojson    (11 MB — citywide fire hydrants)
├── scripts/              ← offline data-prep + document generators (Python/Node; see §5)
└── src/
    ├── engine/           ← THE HEART: pure, framework-independent rule engine (heavily tested)
    │   ├── ruleEngine.ts        evaluate(config, facts, time) → Verdict
    │   ├── types.ts             VendorConfig, LocationFacts, Verdict, …
    │   ├── rules/               one module per §10 precedence step (ordered in rules/index.ts)
    │   ├── citations.ts         legal citations, one place
    │   ├── time.ts              pure seasonal / hour-of-day helpers
    │   ├── reminders.ts         operational reminders
    │   └── *.test.ts            unit tests
    ├── data/
    │   ├── resolver.ts          FactResolver: map coordinate → LocationFacts (the data seam)
    │   ├── layerRegistry.ts     catalog of every layer + integration status
    │   ├── nyc/                 BUNDLED small layers (boroughs, mask, parks, subway, zones, zoning)
    │   └── raw/                 raw City source files (gitignored; README lists expected names)
    ├── components/       ← React UI (RealMapView = the MapLibre map; ResultCard; VendorResources; …)
    ├── config/catalog.ts ← vendor-type / license display catalog
    ├── i18n/             ← 12 languages (en + 10 Local Law 30 + Wolof); RTL for ar/ur
    ├── state/            ← URL-based vendor config (shareable) + EvalTime resolution
    └── App.tsx, main.tsx, styles.css
```

---

## 4. Run / build / test / deploy

```bash
npm install
npm run dev          # local dev → http://localhost:5173
npm test             # 69 unit tests (rule engine + resolver + time helpers)
npm run build        # typecheck + production build → dist/
npm run typecheck
npm run lint
```

**Deployment (current):** GitHub Pages via `.github/workflows/deploy.yml` — every push to `main`
runs the tests, builds, and deploys. `vite.config.ts` reads `VITE_BASE` so assets resolve under
the `/street-vendor-tool/` project path. The large `public/data` files ship as static assets.

---

## 5. Architecture & how the pieces connect

- **The rule engine is pure and framework-independent.** `evaluate(vendorConfig, locationFacts,
  evalTime?) → Verdict`. It does **no geometry math and no I/O** — it consumes already-resolved
  `LocationFacts`. This is deliberate: legal logic stays testable and is never entangled with the
  map. **Do not move rule logic into the UI.**
- **The `FactResolver` is the seam between geometry and the engine.** `resolve(lngLat) →
  LocationFacts` does the point-in-polygon / buffer work over the bundled layers. Authoritative
  datasets drop in *behind this interface* without touching the engine.
- **Data flow:** user taps map → `resolver.resolve()` builds facts → `evaluate()` returns a verdict
  → `ResultCard` renders it. The map's colored overlays are computed from the same engine.
- **`layerRegistry.ts`** is the single source of truth for which layers are live vs. pending; the
  app surfaces it in the "Data sources & coverage" panel.

**Regenerating data** (offline scripts in `scripts/`, require Python with `shapely`, `pyshp`,
`pyproj`):
- `process_citywide.py` → produces `public/data/sidewalks.geojson`, `public/data/hydrants.geojson`,
  and `src/data/nyc/zoning.geojson` from the raw files in `src/data/raw/`.
- `build_data_inventory.py` → `docs/Data_Sources_and_Gaps.xlsx`
- `build_rules_pdf.py` → `docs/Rules_Checklist.pdf`
- `build_release_notes.cjs` → `docs/Release_Notes.docx` (Node + `docx`)

---

## 6. Key decisions & open conflicts (MUST own these)

These are tracked in `Open_Questions_Log.docx`. They gate correctness and architecture:

- **C-1 — WTC zone boundary** (internal docs say Barclay St; 2023 DCWP guide says Vesey St).
  **Not encoded.** Needs SBS Legal to confirm §20-465(g)(2) before drawing the WTC zone.
- **C-2 — First Amendment vendor treatment** (Blue-equivalent per DSNY vs. general-vendor per
  transcript). The app returns "undetermined" in contested zones rather than guessing. Lock before
  building the FA profile.
- **C-3 — 853 license cap.** Intentionally **not** hardcoded — LL54/2026 + Intro 431-B dismantle it
  in 2027, inside the contract window. Keep all license logic cap-agnostic.
- **C-6 — Relationship to existing City maps** (DCWP General Vendor map + DOHMH Mobile Food map).
  **The single biggest decision.** Does this tool *replace*, *federate*, or *link to* them? It
  determines the data architecture (own the data vs. consume agency services).

**Working agreements (from CLAUDE.md) — please keep:** never invent rule text/boundaries; if a rule
isn't confirmable from an official source, flag it and leave it unencoded; label every mock/
illustrative layer visibly; keep the rule engine pure and tested; commit in small reviewable steps
(this work gets audited by SBS).

---

## 7. Data status (what's real vs. what's missing)

Full detail in `docs/Data_Sources_and_Gaps.xlsx`. Summary:

- **✅ Live on real City data (citywide):** allowed **sidewalks** (DCP planimetric), **C4/C5/C6
  zoning** (DCP nyzd), **parks** (DPR), **subway** entrances (MTA), **fire hydrants** (NYCDEP),
  borough boundaries.
- **📐 Statutory (encoded from the Admin Code):** Midtown Core, Downtown Flushing, Dyker Heights —
  including the **veteran (Yellow/Blue) exemptions**.
- **🧪 Illustrative samples (logic built; real data pending):** DOHMH restricted streets (DS-001),
  Green Cart precincts (DS-005), scaffolding/sheds (DOB).
- **⏳ Pending (gated / not yet sourced):** DCWP General Vendor street list (**DS-007 — needs a
  written license; this is the existing DCWP map's data**), sidewalk **widths** (12 ft rule), and
  most secondary buffers (crosswalk, corner, driveway, building/store entrance, café, bus shelter,
  newsstand, ADA ramp, bus stop, hospital), bike lanes, pedestrian plazas.

---

## 8. Production to-dos & known limitations

**Architecture / scale**
- **Vector tiles.** Citywide GeoJSON is bundled/fetched today (sidewalks ~21 MB, hydrants ~11 MB →
  ~5 MB gzipped). This works but is heavy on mobile. Production should serve these as **vector
  tiles** (e.g. PMTiles/Tippecanoe) and/or a small **spatial-query backend** for point-in-polygon
  at scale. Per conflict C-6, consider consuming live agency services instead of bundling.
- **The resolver currently runs client-side** over bundled geometry. A backend resolver
  implementing the same `FactResolver` interface is the clean upgrade path.

**Data**
- Acquire the gated **P1** datasets (DS-007, DS-001, DS-005, plus the remaining buffers) and flip
  the illustrative/pending layers to live in `layerRegistry.ts` + `resolver.ts`.
- **Confirm the fire-hydrant stay-away distance** — code uses 10 ft but the spec only confirms a
  no-contact rule; flagged unverified.

**Content / UX**
- **Translations are DRAFT (AI-generated).** Replace with DSNY's official 12-language vendor-guide
  terminology, and localize the engine's per-verdict explanation text (still English). Files:
  `src/i18n/locales/*.ts`.
- **Feedback intake is a placeholder.** The "Feedback" button mailtos `streetvendorservices@
  sbs.nyc.gov` (a placeholder) — wire it to the real SBS intake / a form. Add the customer-
  notification sign-up (Deliverable #3).
- Accessibility: a focus/tap-target/contrast pass was done; do a full WCAG AA audit before launch.

**Use-case validation (the team's feedback mandate)**
- Validate against real vendor journeys (Deliverable #2 survey): each license sub-type, the
  live-vs-planning time view, geolocation in-field, and low-literacy/multilingual usability.
- A documented **precedence tension** is worth confirming with SBS: §10 evaluates time restrictions
  (yellow) before distance buffers (red) and stops at first match — see `rules/timeRestriction.ts`.

---

## 9. Quick orientation for the new owner

1. Read `CLAUDE.md` (agreements) and `docs/Open_Questions_Log.docx` (conflicts).
2. `npm install && npm test && npm run dev` — see it run; skim `src/engine/ruleEngine.ts` and
   `src/engine/rules/` to understand the legal logic.
3. Open `docs/Data_Sources_and_Gaps.xlsx` — understand what data exists and what's missing.
4. Decide **C-6** with SBS — it shapes everything downstream.
5. Stand up the data backend / vector tiles, drop in the gated datasets behind `FactResolver`, and
   keep the engine + its tests as the contract of record.
