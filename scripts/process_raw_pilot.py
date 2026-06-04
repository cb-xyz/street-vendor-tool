"""Process raw City GIS files into small shippable layers under src/data/nyc/.
- Sidewalks (538MB) -> clipped to East Village pilot, minus 10ft subway+hydrant buffers = green allowed areas.
- Hydrants -> pilot subset points.
- Parks -> citywide, simplified, props stripped.
Run from repo root: python3 scripts/process_raw_pilot.py
"""
import json, csv
from shapely.geometry import shape, box, Point, mapping
from shapely.ops import unary_union

W, S, E, N = -73.9905, 40.7188, -73.9755, 40.7300  # East Village pilot
PILOT = box(W, S, E, N)
MARGIN = 0.002


def inbox(lng, lat):
    return W <= lng <= E and S <= lat <= N


def first_coord(geom):
    c = geom.get('coordinates')
    while isinstance(c, list) and c and isinstance(c[0], list):
        c = c[0]
    return c if isinstance(c, list) and len(c) >= 2 and isinstance(c[0], (int, float)) else None


def rnd(c):
    if isinstance(c, (int, float)):
        return round(c, 6)
    return [rnd(x) for x in c]


# 1. Sidewalks — stream line-delimited features, clip near pilot
sw = []
with open('src/data/raw/sidewalks.geojson') as f:
    for line in f:
        line = line.strip().rstrip(',')
        if not line.startswith('{"type":"Feature"'):
            continue
        try:
            feat = json.loads(line)
            g = feat.get('geometry')
            fc0 = first_coord(g) if g else None
        except Exception:
            continue
        if not fc0:
            continue
        lng, lat = fc0[0], fc0[1]
        if not (W - MARGIN <= lng <= E + MARGIN and S - MARGIN <= lat <= N + MARGIN):
            continue
        try:
            clipped = shape(g).buffer(0).intersection(PILOT)
        except Exception:
            continue
        if not clipped.is_empty:
            sw.append(clipped)
print('sidewalk polys in pilot:', len(sw))
sidewalks = unary_union(sw) if sw else None

# 2. Subway entrances in pilot
sub = json.load(open('src/data/nyc/subwayEntrances.geojson'))
subpts = [Point(*f['geometry']['coordinates']) for f in sub['features'] if inbox(*f['geometry']['coordinates'])]

# 3. Hydrants in pilot from CSV
hyd = []
with open('src/data/raw/hydrants.csv') as f:
    for row in csv.DictReader(f):
        try:
            lat = float(row['LATITUDE']); lng = float(row['LONGITUDE'])
        except (ValueError, KeyError, TypeError):
            continue
        if inbox(lng, lat):
            hyd.append((lng, lat))
print('subway in pilot:', len(subpts), '| hydrants in pilot:', len(hyd))

# 4. Allowed = sidewalks minus ~10ft (≈0.000035°) buffers around subway + hydrants
R = 0.000035
buffers = [p.buffer(R) for p in subpts] + [Point(lng, lat).buffer(R) for lng, lat in hyd]
excl = unary_union(buffers) if buffers else None
allowed = sidewalks.difference(excl) if (sidewalks and excl) else sidewalks
ga = mapping(allowed); ga['coordinates'] = rnd(ga['coordinates'])
open('src/data/nyc/sidewalksAllowed.geojson', 'w').write(json.dumps({
    'type': 'FeatureCollection',
    'meta': {'note': 'REAL sidewalk polygons (DCP planimetric vfx9-tbb6) clipped to the East Village pilot, minus 10 ft buffers around subway entrances + fire hydrants. Green = allowed to vend.'},
    'features': [{'type': 'Feature', 'properties': {}, 'geometry': ga}],
}))

# 5. Hydrant pilot points
hfeats = [{'type': 'Feature', 'properties': {}, 'geometry': {'type': 'Point', 'coordinates': [round(lng, 6), round(lat, 6)]}} for lng, lat in hyd]
open('src/data/nyc/hydrants.geojson', 'w').write(json.dumps({
    'type': 'FeatureCollection',
    'meta': {'source': 'NYCDEP Citywide Hydrants (6pui-xhxz), East Village pilot subset'},
    'features': hfeats,
}))

# 6. Parks citywide, simplified, props stripped
parks = json.load(open('src/data/raw/parks.geojson'))
pf = []
for f in parks['features']:
    g = f.get('geometry')
    if not g:
        continue
    try:
        geom = shape(g).buffer(0).simplify(0.0001, preserve_topology=True)
    except Exception:
        continue
    if geom.is_empty:
        continue
    gm = mapping(geom); gm['coordinates'] = rnd(gm['coordinates'])
    pf.append({'type': 'Feature', 'properties': {}, 'geometry': gm})
open('src/data/nyc/parks.geojson', 'w').write(json.dumps({
    'type': 'FeatureCollection',
    'meta': {'source': 'NYC Parks Properties (enfh-gkve), simplified'},
    'features': pf,
}))
print('parks features:', len(pf))
print('done')
