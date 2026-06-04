const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber,
  ExternalHyperlink,
} = require('docx');

const NAVY = '0A3D62', ACCENT = 'E8821A', GRAY = '5C6670';
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const H = (text, level) => new Paragraph({ heading: level, children: [new TextRun(text)] });
const P = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
const bullet = (text) => new Paragraph({ numbering: { reference: 'b', level: 0 }, children: textRuns(text) });
const num = (text) => new Paragraph({ numbering: { reference: 'n', level: 0 }, children: textRuns(text) });

// Allow simple **bold** segments.
function textRuns(text) {
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((seg) =>
    seg.startsWith('**') ? new TextRun({ text: seg.slice(2, -2), bold: true }) : new TextRun(seg));
}

function headerCell(t, w) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF' })] })] });
}
function cell(t, w, opts = {}) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, margins: cellMargins,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!opts.bold })] })] });
}

const CONTENT_W = 9360;

// ---- Missing data table ----
const dataCols = [1300, 1500, 4760, 1800];
const dataRows = [
  ['DS-007', 'DCWP', 'General Vendor street restrictions — authoritative legal streets; required to replace the DCWP map (needs written license)', 'P1'],
  ['DS-001', 'DOHMH', 'Restricted Streets GIS with hours/days — the #1 food input; powers the time view', 'P1'],
  ['DS-005', 'DOHMH', 'Green Cart precinct polygons — where Green Cart vendors may operate', 'P1'],
  ['DS-012', 'DCP', 'GIS Zoning Features (C4/C5/C6) — accurate commercial-zone exclusion (currently illustrative)', 'P1'],
  ['DS-013', 'DCP', 'Street Centerline (CSCL) — base join key for every street-level rule', 'P1'],
  ['DS-041', 'DCP / DOT', 'Sidewalk polygons — the green "where you can vend" map; confines vending to actual sidewalks', 'P1'],
  ['DS-040', 'DOT', 'Sidewalk widths — the 12 ft clearance rule', 'P2'],
  ['DS-015/026/027/028/029/031/035', 'DCP / DOT / MTA', 'Distance-buffer & out-of-scope layers: building entrances, plazas, bus shelters, no-standing, driveways, crosswalks, bus stops', 'P2'],
  ['DS-036', 'FDNY / DEP', 'Fire hydrants — hydrant buffer (stay-away distance also needs legal confirmation)', 'P2'],
  ['—', 'DOB', 'Active sidewalk-shed (scaffolding) permits', 'P3'],
  ['DS-023', 'DSNY', 'ECB / OATH citation records — evaluation metrics', 'P2'],
];

const conflictRows = [
  ['C-1', 'WTC zone boundary (Barclay vs. Vesey St). No boundary committed; WTC verdicts flagged provisional. Needs SBS Legal.'],
  ['C-2', 'First Amendment treatment (Blue-equivalent vs. general vendor). Returns "undetermined" rather than guessing.'],
  ['C-3', 'The 853 license cap. Engine is cap-agnostic (LL54/2026 dismantles it within the contract window).'],
  ['C-6', 'Relationship to existing agency maps (replace / federate / link). Data layer consumes services rather than owning rules.'],
];

const doc = new Document({
  creator: 'NYC Office of Street Vendor Services · Live XYZ',
  title: 'Where Can I Vend? — Release Notes (Prototype v1)',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: 'Arial', color: NAVY },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '11181C' },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: 'n', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Where Can I Vend? · Prototype v1 · Page ', size: 16, color: GRAY }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY })] })] }) },
    children: [
      // Title block
      new Paragraph({ spacing: { after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
        children: [new TextRun({ text: 'Where Can I Vend?', bold: true, size: 44, color: NAVY })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Release Notes — Prototype v1', size: 24, color: GRAY })] }),
      P([new TextRun({ text: 'Project: ', bold: true }), new TextRun('NYC Street Vendor Site Selection Tool — Office of Street Vendor Services (SBS), with Live XYZ and the Street Vendor Project.')]),
      P([new TextRun({ text: 'Live demo: ', bold: true }), new ExternalHyperlink({ link: 'https://cb-xyz.github.io/street-vendor-tool/', children: [new TextRun({ text: 'cb-xyz.github.io/street-vendor-tool', style: 'Hyperlink' })] })]),
      P([new TextRun({ text: 'Companion data inventory: ', bold: true }), new TextRun('docs/Data_Sources_and_Gaps.xlsx')]),
      P([new TextRun({ text: 'Status: ', bold: true }), new TextRun('Working prototype — sample/illustrative data in places; not yet an official source.')]),

      H('Overview', HeadingLevel.HEADING_1),
      P('NYC vending rules are spread across several agencies and hard to read on the street. This tool brings them into one place: a vendor sets up their profile (vendor type + license) and sees a color-coded map of where they can legally vend, configured to their license and the time of day. The rule logic is a pure, tested engine — not a front-end filter.'),

      H('What is built and working', HeadingLevel.HEADING_1),
      H('Rule engine (the core)', HeadingLevel.HEADING_2),
      bullet('Implements the §10 precedence order: out of scope → hard prohibition → zone-by-SKU → time/seasonal → distance buffers → scaffolding → sidewalk width → permitted.'),
      bullet('Configured per **vendor type × license sub-type × location × date/time**.'),
      bullet('**67 passing unit tests** cover every precedence path and the conflict behaviors.'),
      H('Experience', HeadingLevel.HEADING_2),
      bullet('Two-level setup (vendor type → license, with borough / Green Cart precinct sub-steps) and a labeled progress stepper.'),
      bullet('Map recolors to the selected license: **red = no vending, yellow = restricted, gray = out of scope**; tap any spot — or use "find my location" — for a plain-language verdict with legal citations.'),
      bullet('Time dimension: "Now" vs. "pick a day & time" for time-based rules (DOHMH restricted streets, Dyker Heights holiday hours).'),
      H('Data, design & access', HeadingLevel.HEADING_2),
      bullet('Real data in use: MTA subway entrances citywide (10 ft buffers), NYC borough boundaries, NYC-only masked basemap (no New Jersey). Statutory zones (Midtown Core, Flushing, Dyker Heights) encoded from the Admin Code.'),
      bullet('Multilingual UI in 12 languages (English + 10 Local Law 30 languages + Wolof), with right-to-left support for Arabic and Urdu. (Non-English strings are draft AI translations pending official DSNY terminology.)'),
      bullet('Official SBS logo, clean label-free map, favicon + social-share card, accessibility pass (focus, tap targets, reduced motion), feedback button, and a transparent "Data sources & coverage" panel.'),
      bullet('Deployed on GitHub Pages with automatic redeploy on every change; vendor configuration lives in the URL, so a specific view is shareable.'),

      H('Conflicts deliberately not encoded', HeadingLevel.HEADING_1),
      P('These are flagged in the app and never guessed:'),
      new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [1100, 8260],
        rows: [ new TableRow({ tableHeader: true, children: [headerCell('Conflict', 1100), headerCell('Issue / resolution needed', 8260)] }),
          ...conflictRows.map((r) => new TableRow({ children: [cell(r[0], 1100, { bold: true }), cell(r[1], 8260)] })) ] }),

      H('Data sources still missing from the City', HeadingLevel.HEADING_1),
      P('Full detail and current sources are in docs/Data_Sources_and_Gaps.xlsx. P1 items unlock core functionality.'),
      new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: dataCols,
        rows: [ new TableRow({ tableHeader: true, children: [headerCell('Dataset', dataCols[0]), headerCell('Agency', dataCols[1]), headerCell('What it unlocks', dataCols[2]), headerCell('Priority', dataCols[3])] }),
          ...dataRows.map((r) => new TableRow({ children: [cell(r[0], dataCols[0], { bold: true }), cell(r[1], dataCols[1]), cell(r[2], dataCols[2]), cell(r[3], dataCols[3])] })) ] }),
      new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: 'Currently illustrative placeholders (clearly labeled sample geometry): zoning, parks, Green Cart, DOHMH restricted streets, hydrants, scaffolding.', italics: true, color: GRAY, size: 20 })] }),

      H('Key remaining work before production', HeadingLevel.HEADING_1),
      num('**Resolve C-1 and C-6** (legal/policy, not data). C-6 in particular gates the entire data architecture.'),
      num('**Acquire the P1 datasets** above, and execute the DCWP DS-007 written license.'),
      num('**Stand up a spatial backend / vector tiles.** Hydrants (~100k points), sidewalk polygons (hundreds of MB), and full zoning are too large to bundle client-side — the green "allowed areas" map and citywide hydrant coverage need a server-side spatial query.'),
      num('**Confirm the hydrant stay-away distance** (the no-contact rule is clear; a specific buffer distance is unverified).'),
      num('**Professional translations** — replace AI-draft strings with DSNY official terminology, and localize the engine verdict/explanation text (still English).'),
      num('**Wire the real feedback intake** (button currently uses a placeholder email) and the agency-notification sign-up.'),
      num('**Final legal/QA review** of every encoded rule against the current Administrative Code before any "official" labeling.'),

      new Paragraph({ spacing: { before: 220 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 8 } },
        children: [new TextRun({ text: 'Bottom line: the application, rule engine, and UX are in strong, demonstrable shape. The path to production is primarily data acquisition + two agency decisions (C-1, C-6) + a spatial backend — not further app development.', italics: true, color: GRAY })] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync('docs/Release_Notes.docx', buf); console.log('wrote docs/Release_Notes.docx', buf.length, 'bytes'); });
