# Raw source data (not committed)

Drop the City source files here. They are gitignored (often large) — Claude processes them
offline into the small, clipped layers under `src/data/nyc/` that the app actually ships.

Expected files (any of these formats is fine — GeoJSON / CSV-with-lat-long / Shapefile .zip):

| What | Source | Suggested filename |
|------|--------|--------------------|
| Sidewalk polygons | NYC Planimetric Database: Sidewalk (vfx9-tbb6) | `sidewalks.*` |
| Fire hydrants | NYCDEP Citywide Hydrants (6pui-xhxz) | `hydrants.*` |
| Parks | Parks Properties (enfh-gkve) | `parks.*` |
| Zoning districts | DCP NYC GIS Zoning Features → Zoning Districts (nyzd) | `zoning.*` |

After dropping files in, tell Claude the exact filenames + extensions.
