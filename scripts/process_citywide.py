"""Citywide processing:
- zoning.shp (EPSG:2263) -> C4/C5/C6 polygons, reprojected to WGS84 -> src/data/nyc/zoning.geojson (bundled)
- sidewalks (538MB) -> ALL sidewalk polygons simplified -> public/data/sidewalks.geojson (fetched asset)
- hydrants.csv -> ALL hydrants citywide -> public/data/hydrants.geojson (fetched asset)
"""
import json, csv, re, os
import shapefile
from pyproj import Transformer
from shapely.geometry import shape, mapping

os.makedirs('public/data', exist_ok=True)


def rnd(c, n=6):
    if isinstance(c, (int, float)):
        return round(c, n)
    return [rnd(x, n) for x in c]


# ---------- ZONING (C4/C5/C6) ----------
tr = Transformer.from_crs(2263, 4326, always_xy=True)


def reproject(coords):
    if isinstance(coords[0], (int, float)):
        x, y = tr.transform(coords[0], coords[1])
        return [x, y]
    return [reproject(c) for c in coords]


r = shapefile.Reader('src/data/raw/zoning.shp')
zfeats = []
for sr in r.iterShapeRecords():
    zd = sr.record[0]
    if not zd or not re.match(r'^C[456]', str(zd)):
        continue
    gj = sr.shape.__geo_interface__
    gj = {'type': gj['type'], 'coordinates': reproject(gj['coordinates'])}
    try:
        geom = shape(gj).buffer(0).simplify(0.00003, preserve_topology=True)
    except Exception:
        continue
    if geom.is_empty:
        continue
    gm = mapping(geom); gm['coordinates'] = rnd(gm['coordinates'])
    zfeats.append({'type': 'Feature', 'properties': {'zonedist': str(zd)}, 'geometry': gm})
open('src/data/nyc/zoning.geojson', 'w').write(json.dumps({
    'type': 'FeatureCollection',
    'meta': {'source': 'DCP NYC GIS Zoning Features (nyzd), C4/C5/C6 only, reprojected to WGS84'},
    'features': zfeats,
}))
print('zoning C4/C5/C6 features:', len(zfeats))

# ---------- SIDEWALKS citywide (simplified) ----------
n = 0
with open('public/data/sidewalks.geojson', 'w') as out:
    out.write('{"type":"FeatureCollection","features":[')
    first = True
    with open('src/data/raw/sidewalks.geojson') as f:
        for line in f:
            line = line.strip().rstrip(',')
            if not line.startswith('{"type":"Feature"'):
                continue
            try:
                feat = json.loads(line)
                g = feat.get('geometry')
                geom = shape(g).buffer(0).simplify(0.000025, preserve_topology=True)
            except Exception:
                continue
            if geom.is_empty:
                continue
            gm = mapping(geom); gm['coordinates'] = rnd(gm['coordinates'])
            out.write(('' if first else ',') + json.dumps({'type': 'Feature', 'properties': {}, 'geometry': gm}))
            first = False
            n += 1
    out.write(']}')
print('sidewalk polys citywide:', n)

# ---------- HYDRANTS citywide ----------
hf = []
with open('src/data/raw/hydrants.csv') as f:
    for row in csv.DictReader(f):
        try:
            lat = float(row['LATITUDE']); lng = float(row['LONGITUDE'])
        except (ValueError, KeyError, TypeError):
            continue
        hf.append({'type': 'Feature', 'properties': {}, 'geometry': {'type': 'Point', 'coordinates': [round(lng, 6), round(lat, 6)]}})
open('public/data/hydrants.geojson', 'w').write(json.dumps({'type': 'FeatureCollection', 'features': hf}))
print('hydrants citywide:', len(hf))
print('done')
