"""Generate docs/Rules_Checklist.pdf from the rules status (mirrors Rules_Checklist.md)."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable)

NAVY = colors.HexColor('#0a3d62')
ACCENT = colors.HexColor('#e8821a')
GRAY = colors.HexColor('#5c6670')
LINE = colors.HexColor('#d8d2c4')

STATUS = {
    'Live':         (colors.HexColor('#1a7f37'), colors.HexColor('#e6f4ea')),
    'Statutory':    (colors.HexColor('#1e40af'), colors.HexColor('#e7edfb')),
    'Illustrative': (colors.HexColor('#9a6b00'), colors.HexColor('#fcefc7')),
    'Pending':      (colors.HexColor('#5c6670'), colors.HexColor('#eceae3')),
    'Reminder':     (colors.HexColor('#5c6670'), colors.HexColor('#eceae3')),
    'Blocked':      (colors.HexColor('#b42318'), colors.HexColor('#fbe3df')),
}

ss = getSampleStyleSheet()
body = ParagraphStyle('body', parent=ss['Normal'], fontName='Helvetica', fontSize=8.5, leading=11)
cellb = ParagraphStyle('cellb', parent=body, fontName='Helvetica-Bold')
h1 = ParagraphStyle('h1', parent=ss['Heading1'], fontName='Helvetica-Bold', fontSize=20, textColor=NAVY, spaceAfter=2)
h2 = ParagraphStyle('h2', parent=ss['Heading2'], fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor('#11181c'), spaceBefore=12, spaceAfter=4)
sub = ParagraphStyle('sub', parent=body, textColor=GRAY)


def P(t, st=body):
    return Paragraph(t, st)


def badge(label):
    fg, _ = STATUS[label]
    return Paragraph(f'<font color="#{fg.hexval()[2:]}"><b>{label}</b></font>', body)


def status_para(label, extra=''):
    return badge(label) if not extra else Paragraph(
        f'<font color="#{STATUS[label][0].hexval()[2:]}"><b>{label}</b></font> {extra}', body)


def make_table(headers, rows, widths):
    data = [[P(h, cellb) for h in headers]]
    for r in rows:
        data.append([c if hasattr(c, 'wrap') else P(str(c)) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, LINE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7f4ed')]),
    ]
    for hi in (0,):
        data[0][hi].textColor = colors.white
    t.setStyle(TableStyle(style))
    return t


doc = SimpleDocTemplate('docs/Rules_Checklist.pdf', pagesize=letter,
                        leftMargin=0.6 * inch, rightMargin=0.6 * inch, topMargin=0.6 * inch, bottomMargin=0.6 * inch,
                        title='Rules Checklist — Where Can I Vend?')
W = letter[0] - 1.2 * inch
el = []
el.append(P('Rules Checklist', h1))
el.append(P('Where Can I Vend? (Prototype) - what the rule engine incorporates. Last updated 2026-06-04.', sub))
el.append(HRFlowable(width='100%', thickness=1.4, color=ACCENT, spaceBefore=4, spaceAfter=8))

el.append(P('Status key', h2))
key = [
    ['Live', 'Real City data wired in; affects verdicts and shows on the map.'],
    ['Statutory', 'Geometry encoded from the Admin Code boundary text (approximate; no file needed).'],
    ['Illustrative', 'Sample geometry standing in until the gated dataset arrives.'],
    ['Pending', 'Rule is built; dormant until the City data layer is supplied.'],
    ['Blocked', 'Needs a legal or policy decision, not just data. (Reminder = on-site only, cannot be mapped.)'],
]
el.append(make_table(['Status', 'Meaning'], [[badge(k), P(v)] for k, v in key], [1.1 * inch, W - 1.1 * inch]))

el.append(P('A. Stay-away distances (buffers)', h2))
A = [
    ['Subway entrance / exit', '10 ft', 'Both', status_para('Live', '(MTA, citywide)')],
    ['Fire hydrant', '10 ft (distance unverified)', 'Both', status_para('Live', '(NYCDEP; distance pending legal confirm)')],
    ['Crosswalk', '10 ft', 'Food', badge('Pending')],
    ['Street corner / intersection', '10 ft', 'General', badge('Pending')],
    ['Driveway / curb cut', '10 ft', 'Both', status_para('Pending', '(no clean City layer)')],
    ['Building / store entrance (incl. grocery)', '20 ft', 'Both', badge('Pending')],
    ['Sidewalk cafe / stoop-line stand', '20 ft', 'Both', badge('Pending')],
    ['Bus shelter', '5 ft', 'General', badge('Pending')],
    ['Newsstand', '5 ft', 'General', badge('Pending')],
    ['Disabled-access (ADA) ramp', '5 ft', 'General', badge('Pending')],
    ['Bus stop / taxi stand', 'Whole stop', 'Both', badge('Pending')],
    ['Hospital no-standing zone', 'Abutting sidewalk', 'Both', badge('Pending')],
    ['Metered parking (vending from roadway)', 'Not permitted', 'Food', badge('Reminder')],
]
el.append(make_table(['Rule', 'Distance', 'Applies', 'Status'],
                     [[P(a), P(b), P(c), d] for a, b, c, d in A],
                     [2.5 * inch, 1.5 * inch, 0.7 * inch, W - 4.7 * inch]))

el.append(P('B. Where vending is allowed, placement & footprint', h2))
B = [
    ['On a public sidewalk (allowed surface)', 'Sidewalk only', status_para('Live', '(real DCP sidewalks, citywide - the green areas)')],
    ['Clear sidewalk path', '>= 12 ft clear', status_para('Pending', '(sidewalk widths)')],
    ['Curb placement', 'Curb side only', badge('Reminder')],
    ['No touching street furniture', 'No contact', badge('Reminder')],
    ['No vending over grates / manholes', '-', status_para('Reminder', '(no citywide layer)')],
    ['No bike lanes', 'Not in a bike lane', badge('Pending')],
    ['No medians (unless plaza)', '-', status_para('Live', '(when flagged)')],
    ['Scaffolding / sidewalk shed', 'May obstruct', status_para('Illustrative', '(advisory; DOB pending)')],
    ['General Vendor footprint', '8x3 ft, 5 ft tall; no electricity', badge('Reminder')],
    ['Mobile Food Vendor footprint', 'Parallel to curb; covered', badge('Reminder')],
]
el.append(make_table(['Rule', 'Condition', 'Status'],
                     [[P(a), P(b), c] for a, b, c in B],
                     [2.6 * inch, 1.9 * inch, W - 4.5 * inch]))

el.append(P('C. Zone-based prohibitions and veteran exemptions', h2))
C = [
    ['C4 / C5 / C6 commercial zoning', 'Prohibited for Standard GV', 'Yellow & Blue exempt', status_para('Live', '(real DCP zoning)')],
    ['Midtown Core (30-65 St, 2nd-9th/Columbus)', 'Prohibited for Standard & Yellow', 'Blue only', badge('Statutory')],
    ['Downtown Flushing', 'Prohibited for Standard', 'Yellow & Blue exempt', badge('Statutory')],
    ['Dyker Heights (holiday hours)', 'Restricted for Standard, Thanksgiving-New Year', 'Yellow & Blue exempt', badge('Statutory')],
    ['World Trade Center zone', 'Prohibited (limited food-street exceptions)', '-', status_para('Blocked', '(C-1 border)')],
]
el.append(make_table(['Zone', 'Base rule', 'Veteran exemption', 'Status'],
                     [[P(a), P(b), P(c), d] for a, b, c, d in C],
                     [1.9 * inch, 2.0 * inch, 1.4 * inch, W - 5.3 * inch]))
el.append(Spacer(1, 4))
el.append(P('<b>Veteran summary:</b> Yellow = Citywide Specialized (disabled vets) -> exempt from C4/C5/C6, Flushing, Dyker Heights. '
            'Blue = Midtown Core Specialized -> all of the above plus the only license allowed in the Midtown Core. '
            'The map recolors these zones green for Yellow/Blue.', sub))

el.append(P('D. Time & seasonal', h2))
D = [
    ['DOHMH restricted streets', 'Per-street hours/days', 'Food', status_para('Illustrative', '(logic live; DS-001 pending)')],
    ['Dyker Heights holiday hours', 'See zone table', 'General', badge('Statutory')],
    ['Seasonal permit validity', 'April 1 - October 31 only', 'Food', badge('Live')],
]
el.append(make_table(['Rule', 'Condition', 'Applies', 'Status'],
                     [[P(a), P(b), P(c), d] for a, b, c, d in D],
                     [2.2 * inch, 1.9 * inch, 0.7 * inch, W - 4.8 * inch]))

el.append(P('E. License geography & F. Out of scope', h2))
EF = [
    ['Borough-specific food permit', 'One borough; never Manhattan', badge('Live')],
    ['Green Cart permit', 'Assigned precinct; produce only', status_para('Illustrative', '(logic live; DS-005 pending)')],
    ['Citywide food permit', 'All five boroughs', badge('Live')],
    ['Parks', 'Out of scope (DPR concessions)', status_para('Live', '(real Parks Properties)')],
    ['Pedestrian plazas', 'Out of scope (DOT concessions)', badge('Pending')],
    ['Outside the five boroughs / water', 'Not a vending location', badge('Live')],
]
el.append(make_table(['Rule', 'Condition', 'Status'],
                     [[P(a), P(b), c] for a, b, c in EF],
                     [2.4 * inch, 2.1 * inch, W - 4.5 * inch]))

el.append(P('G. Blocked / not encoded (decisions, not data)', h2))
for code, txt in [
    ('C-1', 'WTC zone boundary (Barclay vs. Vesey St) - needs SBS Legal.'),
    ('C-2', 'First Amendment vendor treatment (Blue-equivalent vs. general vendor) - app returns "undetermined."'),
    ('C-3', '853 license cap - intentionally not encoded (engine is cap-agnostic).'),
    ('C-6', 'Replace / federate / link the existing agency maps - gates the data architecture.'),
]:
    el.append(P(f'<b>{code}</b> &nbsp; {txt}', body))

el.append(Spacer(1, 8))
el.append(HRFlowable(width='100%', thickness=0.6, color=LINE, spaceAfter=4))
el.append(P('Precedence: rules evaluate top-to-bottom, stopping at the first match - out of scope -> hard prohibition -> '
            'zone-by-license -> time/seasonal -> distance buffers -> scaffolding -> sidewalk width -> otherwise permitted. '
            'Citations in src/engine/citations.ts; data status in docs/Data_Sources_and_Gaps.xlsx.', sub))

doc.build(el)
print('wrote docs/Rules_Checklist.pdf')
