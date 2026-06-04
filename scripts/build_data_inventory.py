"""Generate docs/Data_Sources_and_Gaps.xlsx — the data inventory + gap list."""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

NAVY = '0A3D62'
WHITE = 'FFFFFF'
HEADER_FONT = Font(name='Arial', bold=True, color=WHITE, size=11)
HEADER_FILL = PatternFill('solid', fgColor=NAVY)
BASE_FONT = Font(name='Arial', size=10)
WRAP_TOP = Alignment(wrap_text=True, vertical='top')
THIN = Side(style='thin', color='D8D2C4')
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

STATUS_FILL = {
    'In use (live)': 'CDEBD0',
    'Encoded from statute': 'DDE7F0',
    'Illustrative placeholder': 'FCEFC7',
    'Missing — needed': 'FBE3DF',
    'Blocked (legal)': 'E4E2DA',
}

# Dataset ID | Layer | Owner | Feeds (rule) | Status | Source / how obtained | Notes
INVENTORY = [
    ['DS-034', 'Subway Entrances & Exits (2,120 pts citywide)', 'MTA / NY State', '10 ft no-vend buffer (both vendor types)', 'In use (live)',
     'NY Open Data resource i9wp-a4ja — data.ny.gov (fetched 2026-06-04, bundled)', 'Real data, all five boroughs. Drives the subway exclusion.'],
    ['—', 'Borough Boundaries', 'NYC DCP', 'Determines which borough a point is in (food borough permits)', 'In use (live)',
     'NYC Open Data resource gthc-hcne — data.cityofnewyork.us (fetched + simplified, bundled)', 'Real data; simplified for fast point-in-polygon.'],
    ['—', 'Basemap (streets, labels)', 'OpenStreetMap / OpenFreeMap', 'Visual base layer', 'In use (live)',
     'OpenFreeMap Positron vector tiles (no key, no usage limits)', 'Open data; not a City source. Could swap to a City basemap later.'],

    ['§20-465(g)(1)', 'Midtown Core zone', 'DCWP (NYC Admin Code)', 'Blue-license-only area (GV)', 'Encoded from statute',
     'Boundary text in the Admin Code — encoded as an approximate polygon', 'No file needed; geometry is approximate, confirm exact lines.'],
    ['§20-465(g)(4)', 'Downtown Flushing zone', 'DCWP (NYC Admin Code)', 'Standard-GV exclusion', 'Encoded from statute',
     'Boundary text in the Admin Code — encoded as an approximate polygon', 'No file needed; approximate.'],
    ['§20-465(g)(5)', 'Dyker Heights zone (seasonal)', 'DCWP (NYC Admin Code)', 'Holiday-hours GV restriction', 'Encoded from statute',
     'Boundary text in the Admin Code — encoded as an approximate polygon', 'No file needed; approximate.'],

    ['DS-012', 'Zoning — C4 / C5 / C6 districts', 'DCP', 'Commercial-zone exclusion (GV)', 'Illustrative placeholder',
     'Map-type dataset; not exportable as queryable GeoJSON. Using sample polygons.', 'NEED the licensed GIS Zoning Features export to be accurate.'],
    ['DS-032', 'Parks Properties', 'DPR', 'Out-of-scope mask (parks)', 'Illustrative placeholder',
     'Using sample polygons (Central Park, Prospect Park)', 'NEED DPR parks polygons for full coverage.'],
    ['DS-005', 'Green Cart precincts', 'DOHMH', 'Green Cart authorized geography', 'Illustrative placeholder',
     'Using one sample precinct polygon', 'NEED DOHMH Green Cart precinct polygons (or a precinct list to convert).'],
    ['DS-001', 'DOHMH Restricted Streets (hours/days)', 'DOHMH', 'Food time/day restrictions (the #1 food input)', 'Illustrative placeholder',
     'Using one sample restricted street', 'NEED DOHMH GIS layer with per-segment hours/days (or PDF to geocode).'],
    ['DS-036', 'Fire hydrants', 'FDNY / DEP', 'Hydrant no-vend buffer', 'Illustrative placeholder',
     'Map-type dataset, ~100k points — too large to bundle. Using sample point.', 'NEED a hydrant layer via a spatial service. Stay-away DISTANCE also unverified.'],
    ['—', 'Scaffolding / sidewalk sheds', 'DOB', 'Obstruction advisory', 'Illustrative placeholder',
     'Using sample point', 'NEED DOB active sidewalk-shed permits (updates frequently).'],

    ['DS-007', 'General Vendor street restrictions', 'DCWP', 'Authoritative GV permitted/prohibited streets', 'Missing — needed',
     'Public ArcGIS map exists but not ingested', 'NEED a written license to use in production. This IS the existing DCWP map; required to replace it.'],
    ['DS-041', 'Sidewalk polygons (planimetrics)', 'DCP / DOT', 'Confines vending to actual sidewalks; green "allowed" areas', 'Missing — needed',
     'Not exposed as a client-usable service; full layer is very large', 'NEED the sidewalk shapefile + a spatial backend. Blocker for the green allowed-area map.'],
    ['DS-040', 'Sidewalk widths', 'DOT / community', '12 ft clearance rule', 'Missing — needed', 'Not yet sourced', 'NEED widths per segment (or derive from DS-041).'],
    ['DS-013', 'Street Centerline (CSCL)', 'DCP', 'Base join key for every street-level rule', 'Missing — needed',
     'Public, refreshes daily', 'NEED to ingest as the production base layer.'],
    ['DS-014', 'LION street network', 'DCP', 'Partial-block "from X to Y" segments', 'Missing — needed', 'Public', 'NEED for sub-segment encoding of restricted streets.'],
    ['DS-015', 'Building Footprints', 'DCP', '20 ft building-entrance buffer', 'Missing — needed', 'Public', 'NEED (entrances approximated from footprint edge).'],
    ['DS-026', 'Pedestrian Plazas', 'DOT', 'Out-of-scope mask (plazas)', 'Missing — needed', 'Public', 'NEED plaza polygons.'],
    ['DS-027', 'Bus Stop Shelters', 'DOT', '5 ft GV buffer', 'Missing — needed', 'Public', 'NEED shelter locations.'],
    ['DS-028', 'No-Standing signs', 'DOT', 'Hospital no-standing zones', 'Missing — needed', 'Public', 'NEED sign data (paired with hospital locations).'],
    ['DS-029', 'Curb cuts / driveways', 'DOT', '10 ft driveway buffer', 'Missing — needed', 'No clean citywide layer found', 'GAP — may need OSM/footprint approximation; flag to vendors.'],
    ['DS-031', 'Crosswalks (derived)', 'DOT / from CSCL', '10 ft MFV crosswalk buffer', 'Missing — needed', 'Derive from CSCL', 'NEED CSCL first.'],
    ['DS-035', 'MTA Bus Stops', 'MTA', 'No vending within a bus stop', 'Missing — needed', 'Public', 'NEED stop boundaries.'],
    ['DS-003', 'Restricted Area Permit zones', 'DOHMH', 'Separate food SKU (high-traffic zones)', 'Missing — needed', 'Confirm scope', 'NEED to confirm if in scope + boundaries.'],
    ['DS-023', 'ECB / OATH citation records', 'DSNY', 'Evaluation metrics (not map logic)', 'Missing — needed', 'Gated', 'NEED for measuring impact (Deliverable metrics).'],

    ['C-1', 'World Trade Center zone', 'DCWP / DOHMH (Admin Code)', 'Hard prohibition + MFV street exceptions', 'Blocked (legal)',
     'Conflict C-1: docs say Barclay St; 2023 DCWP guide says Vesey St', 'NOT a file — needs SBS Legal to confirm the controlling boundary before encoding.'],
]

# Needed-from-city summary (subset): Dataset | Layer | Agency | Why we need it | Ask / blocker | Priority
NEEDED = [
    ['DS-001', 'DOHMH Restricted Streets (GIS, hours/days)', 'DOHMH', 'The single most important food input; powers the time view', 'Request GIS export with per-segment hours/days', 'P1'],
    ['DS-005', 'Green Cart precincts', 'DOHMH', 'Show Green Cart vendors their authorized area', 'Request precinct polygons (or list to convert)', 'P1'],
    ['DS-007', 'General Vendor street restrictions', 'DCWP', 'Authoritative GV legal streets; required to replace the DCWP map', 'Execute written license; confirm consume-live-vs-static', 'P1'],
    ['DS-012', 'GIS Zoning Features (C4/C5/C6)', 'DCP', 'Accurate commercial-zone exclusion for GV', 'Licensed GIS export (not the map-only service)', 'P1'],
    ['DS-013', 'Street Centerline (CSCL)', 'DCP', 'Base join key for every street rule', 'Confirm ingest cadence (daily refresh)', 'P1'],
    ['DS-034', 'Subway Entrances', 'MTA', 'Already in use — confirm we may use it in production', 'Confirm license/currency of the Open Data version', 'P1 (have data)'],
    ['DS-041', 'Sidewalk polygons (planimetrics)', 'DCP / DOT', 'Green "where you CAN vend" areas; confine vending to sidewalks', 'Provide shapefile + agree on a spatial backend/tiles', 'P1 (blocks green map)'],
    ['DS-040', 'Sidewalk widths', 'DOT', '12 ft clearance rule', 'Provide widths or confirm derive from DS-041', 'P2'],
    ['DS-015 / 027 / 028 / 035 / 026 / 031 / 029',
     'Buffers: building entrances, bus shelters, no-standing, bus stops, plazas, crosswalks, driveways', 'DCP / DOT / MTA',
     'Distance-buffer prohibitions (§10 step 5) and out-of-scope masks', 'Provide layers / confirm DOT-internal driveway data', 'P2'],
    ['DS-036', 'Fire hydrants', 'FDNY / DEP', 'Hydrant no-vend buffer', 'Provide hydrant layer; CONFIRM the legal stay-away distance', 'P2'],
    ['—', 'Active sidewalk-shed (scaffolding) permits', 'DOB', 'Flag spots physically blocked by scaffolding', 'Provide a feed (changes frequently)', 'P3'],
    ['DS-023', 'ECB / OATH citation records', 'DSNY', 'Evaluation metrics for the pilot', 'Provide aggregate citation data', 'P2'],
    ['C-1', 'WTC zone boundary', 'SBS Legal / DCWP', 'Encode the WTC hard-prohibition correctly', 'CONFIRM Barclay vs Vesey St north border (§20-465(g)(2))', 'P1 (legal, not data)'],
    ['C-6', 'Tool relationship to existing maps', 'SBS / DSNY', 'Decides whether we replace / federate / link agency maps', 'CONFIRM the intended relationship — gates the data architecture', 'P1 (decision)'],
]


def style_header(ws, ncols, row=1):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(wrap_text=True, vertical='center')
        cell.border = BORDER


def write_sheet(ws, headers, rows, widths, status_col=None):
    ws.append(headers)
    style_header(ws, len(headers))
    for r in rows:
        ws.append(r)
    for ri in range(2, len(rows) + 2):
        for ci in range(1, len(headers) + 1):
            cell = ws.cell(row=ri, column=ci)
            cell.font = BASE_FONT
            cell.alignment = WRAP_TOP
            cell.border = BORDER
        if status_col:
            sval = ws.cell(row=ri, column=status_col).value
            if sval in STATUS_FILL:
                ws.cell(row=ri, column=status_col).fill = PatternFill('solid', fgColor=STATUS_FILL[sval])
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[chr(64 + i)].width = w
    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 30


wb = Workbook()

# Sheet 1 — full inventory
ws1 = wb.active
ws1.title = 'Data Inventory'
write_sheet(
    ws1,
    ['Dataset ID', 'Layer / Dataset', 'Owner (Agency)', 'Feeds (rule)', 'Status', 'Source / How obtained', 'Notes'],
    INVENTORY,
    [12, 34, 22, 34, 22, 40, 44],
    status_col=5,
)

# Sheet 2 — needed from City
ws2 = wb.create_sheet('Needed From City')
write_sheet(
    ws2,
    ['Dataset ID', 'Layer / Dataset', 'Agency', 'Why we need it', 'Ask / blocker', 'Priority'],
    NEEDED,
    [16, 38, 20, 40, 42, 14],
)

# Sheet 3 — status key
ws3 = wb.create_sheet('Status Key')
ws3.append(['Status', 'Meaning'])
style_header(ws3, 2)
keys = [
    ['In use (live)', 'Real authoritative data is wired in and affects results.'],
    ['Encoded from statute', 'Geometry encoded from the Admin Code boundary text (approximate). No file required.'],
    ['Illustrative placeholder', 'Sample geometry standing in until the licensed/acquired dataset arrives.'],
    ['Missing — needed', 'Not yet integrated; the rule cannot fully work until the City provides the data.'],
    ['Blocked (legal)', 'Needs a legal/policy decision, not just a file.'],
]
for r in keys:
    ws3.append(r)
for ri in range(2, len(keys) + 2):
    for ci in (1, 2):
        ws3.cell(row=ri, column=ci).font = BASE_FONT
        ws3.cell(row=ri, column=ci).alignment = WRAP_TOP
        ws3.cell(row=ri, column=ci).border = BORDER
    sval = ws3.cell(row=ri, column=1).value
    if sval in STATUS_FILL:
        ws3.cell(row=ri, column=1).fill = PatternFill('solid', fgColor=STATUS_FILL[sval])
ws3.column_dimensions['A'].width = 24
ws3.column_dimensions['B'].width = 70
ws3.freeze_panes = 'A2'

# Title note on sheet 1 — add a top note row? Keep header clean; add a note in A-after-last.
note_row = len(INVENTORY) + 3
ws1.cell(row=note_row, column=1, value='Compiled 2026-06-04 for the Street Vendor Site Selection Tool (prototype). '
         'Statuses reflect what the live app uses. "Missing — needed" + "Illustrative placeholder" rows are the asks for the City.').font = Font(
    name='Arial', size=9, italic=True, color='5C6670')
ws1.merge_cells(start_row=note_row, start_column=1, end_row=note_row, end_column=7)

wb.save('docs/Data_Sources_and_Gaps.xlsx')
print('wrote docs/Data_Sources_and_Gaps.xlsx')
