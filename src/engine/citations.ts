/**
 * Legal citations referenced by the rule engine, kept in one place so every rule cites a
 * primary source. Sources: NYC Administrative Code §17-315 (MFV) and §20-465 (GV), plus
 * the agency rules noted inline. Do not invent citations — if a rule cannot be tied to a
 * confirmable source, it should not be encoded (see CLAUDE.md working agreements).
 */
export const CITES = {
  SIDEWALK_CLEARANCE: 'NYC Admin Code §17-315(a) / §20-465(a)',
  CURB_PLACEMENT: 'NYC Admin Code §17-315(a) / §20-465(a)',
  NO_FURNITURE_CONTACT: 'NYC Admin Code §17-315(b) / §20-465(c)',
  NO_GRATES: 'NYC Admin Code §20-465(m)',
  NO_BIKE_LANE: 'NYC Admin Code §17-315(g) / §20-465(h)',
  NO_MEDIAN: 'NYC Admin Code §17-315(h) / §20-465(i)',
  SUBWAY_BUFFER: 'NYC Admin Code §17-315(e) / §20-465(e)',
  CROSSWALK_BUFFER: 'NYC Admin Code §17-315(e)',
  CORNER_BUFFER: 'NYC Admin Code §20-465(e)',
  DRIVEWAY_BUFFER: 'NYC Admin Code §17-315(e) / §20-465(e)',
  BUILDING_ENTRANCE_BUFFER: 'NYC Admin Code §17-315(d) / §20-465(d)',
  SIDEWALK_CAFE_BUFFER: 'NYC Admin Code §17-315(d) / §20-465(q)',
  BUS_SHELTER_BUFFER: 'NYC Admin Code §20-465(q)',
  NEWSSTAND_BUFFER: 'NYC Admin Code §20-465(q)',
  ADA_RAMP_BUFFER: 'NYC Admin Code §20-465(q)',
  BUS_STOP: 'NYC Admin Code §17-315(e) / §20-465(e)',
  HOSPITAL_NO_STANDING: 'NYC Admin Code §17-315(e) / §20-465(e)',
  METERED_PARKING: '34 RCNY §4-08(h)(7)',
  HYDRANT: 'No-contact rule §17-315(b)/§20-465(c); distance buffer pending confirmation (DS-036)',
  SCAFFOLDING: 'DOB sidewalk shed permits (advisory — may obstruct the sidewalk)',
  ZONING_EXCLUSION: 'NYC Admin Code §20-465(g)(1)',
  MIDTOWN_CORE: 'NYC Admin Code §20-465(g)(1)',
  WTC_ZONE: 'NYC Admin Code §17-315(k)(1) / §20-465(g)(2)',
  FLUSHING_ZONE: 'NYC Admin Code §20-465(g)(4)',
  DYKER_HEIGHTS: 'NYC Admin Code §20-465(g)(5)',
  MFV_RESTRICTED_STREETS: 'DOHMH Restricted Streets Guide EHS334503E-4.23 / §17-315(k)(l)',
  GREEN_CART: 'NYC Admin Code §17-307(b)(1)(c) / Local Law 9 of 2008',
  SEASONAL_PERMIT: 'NYC Admin Code §17-307(b)(1)',
  BOROUGH_PERMIT: 'NYC Admin Code §17-307(b)(1)',
  PARKS_OUT_OF_SCOPE: 'NYC Admin Code §17-315(i) / §20-465(j)',
  GV_FOOTPRINT: 'NYC Admin Code §20-465(a)(b)(n)(p)',
  MFV_FOOTPRINT: 'NYC Admin Code §17-315(a)(c) / 24 RCNY §6-04(o)',
} as const;
