# Street Vendor Site Selection Tool

A public, mobile-first web map that tells any NYC street vendor **where they can legally vend**,
configured to their specific vendor type and license. Built for the NYC Office of Street Vendor
Services (SBS), in partnership between Live XYZ and the Street Vendor Project.

> See [CLAUDE.md](CLAUDE.md) for the full project orientation and [docs/](docs/) for the
> spec of record, open-questions log, and data inventory.

## Status — v0.1 (first scaffold)

This is the initial scaffold delivering **build-order steps 1–5 and 7** from CLAUDE.md:

- ✅ Repo + stack + test runner
- ✅ Pure, fully-tested **rule engine** (`src/engine/ruleEngine.ts`) implementing the §10
  precedence order
- ✅ Two-level vendor configuration UI (vendor type → license sub-type → map)
- ✅ A runnable map surface that drives the **real engine** (currently over a clearly-labeled
  **mock** grid — no production geometry yet)
- ✅ Live-vs-planning time view for food vendors
- ✅ i18n scaffold (Local Law 30 languages + Wolof; English populated, others fall back)
- 🔜 Step 6: production data layer (CSCL joins + pre-computed turf buffers over the P1 datasets)

## Architecture

```
src/
├── engine/              ← the heart: pure, framework-independent, unit-tested
│   ├── ruleEngine.ts    ← evaluate(vendorConfig, locationFacts, evalTime?) → Verdict
│   ├── types.ts         ← VendorConfig, LocationFacts, Verdict, …
│   ├── rules/           ← one module per §10 precedence step (ordered in rules/index.ts)
│   ├── citations.ts     ← legal citations, one place
│   ├── time.ts          ← pure seasonal / hour-of-day helpers
│   └── reminders.ts     ← operational ("on-the-day") reminders
├── config/catalog.ts    ← display metadata for the two-level vendor picker
├── data/mockSurface.ts  ← ⚠️ MOCK grid → LocationFacts (replaced by production data layer)
├── state/               ← URL-based config (shareable, no localStorage) + EvalTime resolution
├── components/          ← MapView, ResultCard
└── i18n/                ← Local Law 30 language scaffold
```

The **engine takes resolved spatial facts, not geometry**. A separate data layer joins a map
point to `LocationFacts` (zoning, pre-computed buffers, restricted-street hours…) and feeds those
in. This keeps the legal logic pure, deterministic, and auditable — and lets the mock surface and
the future production surface share the exact same engine, with **no rule logic duplicated in the UI**.

### Rule precedence (§10 — implemented exactly, stop at first match)

1. Out of scope (parks / plazas) → gray
2. Hard prohibition (WTC absolute) → red *(C-1 — see below)*
3. Zone exclusion by SKU (C4/C5/C6, Midtown Core, Flushing, WTC; food borough/Green-Cart geography)
4. Time / seasonal (DOHMH restricted streets, Dyker Heights, seasonal permits) → yellow
5. Distance buffers & placement prohibitions → red
6. Sidewalk width (<12 ft red, 12–15 ft yellow)
7. Otherwise → green + operational reminders

## Blocked conflicts — flagged, not encoded

Per CLAUDE.md and `docs/Open_Questions_Log.docx`, the following are **deliberately not encoded**.
Verdicts that touch them are flagged `unverified` and the UI shows a provisional-result banner:

- **C-1** — WTC north border (Barclay vs Vesey). No WTC boundary geometry is committed.
- **C-2** — First Amendment treatment (Blue-equivalent vs general-vendor). FA in contested zones
  returns an explicit "undetermined" result rather than a guess.
- **C-3** — 853 license cap. The engine has **no cap logic** and is cap-agnostic.
- **C-6** — relationship to existing City maps. The data layer is modeled as a consumer of
  DS-007/DS-001 services, not an owner of the rules.

### Known precedence tension

The spec evaluates time restrictions (step 4, yellow) *before* distance buffers (step 5, red) and
stops at first match — so a yellow time restriction can return before a redder buffer on the same
point is checked. This is implemented **as specified** and called out in the code; it is worth
confirming with SBS whether most-restrictive-wins is preferred.

## Develop

```bash
npm install
npm test          # rule-engine + helper unit tests (Vitest)
npm run dev       # local dev server
npm run build     # typecheck + production build
npm run typecheck
```

## Stack

React + Vite + TypeScript · MapLibre GL JS (NYC Planning vector tiles, no paid token) ·
turf.js (offline-precomputed buffers) · Vitest · react-i18next.

---

**This tool is a guide, not a legal guarantee.** Rules change and some situations need human
judgment. Vendors should confirm with 311 or the relevant agency. All encoded rules trace to a
primary source (NYC Admin Code §17-315 / §20-465 and agency guidance); anything unconfirmable is
flagged and left unencoded.
