# Raw source data (not committed)

Drop the City source files here. They are gitignored (often large) — `scripts/process_citywide.py`
turns them into the small shipped layers under `src/data/nyc/` and `public/data/`.

**Download links** (full list + status in `docs/Data_Sources_and_Gaps.xlsx` → "Download Links" sheet):

| File to save | Source | Download URL |
|---|---|---|
| `sidewalks.geojson` | DCP Planimetric Sidewalk (vfx9-tbb6) | https://data.cityofnewyork.us/d/vfx9-tbb6 |
| `hydrants.csv` | NYCDEP Citywide Hydrants (6pui-xhxz) | https://data.cityofnewyork.us/d/6pui-xhxz |
| `parks.geojson` | Parks Properties (enfh-gkve) | https://data.cityofnewyork.us/d/enfh-gkve |
| `zoning.shp` (+ `.dbf/.shx/.prj`) | DCP NYC GIS Zoning Features → Zoning Districts (nyzd) | https://www.nyc.gov/content/planning/pages/resources/datasets/gis-zoning-features |
| (subway — already used) | MTA Subway Entrances & Exits (i9wp-a4ja) | https://data.ny.gov/d/i9wp-a4ja |
| (borough boundaries — already used) | NYC Borough Boundaries (gthc-hcne) | https://data.cityofnewyork.us/d/gthc-hcne |

On NYC Open Data pages, use the **Export** button (GeoJSON / CSV / Shapefile). For shapefiles,
keep all sidecar files together (`.shp` + `.dbf` + `.shx` + `.prj`).

After dropping files in, run: `python3 scripts/process_citywide.py`
