/** English base strings. Other Local Law 30 languages provide the same keys; anything missing
 *  falls back to English. NOTE: non-English translations are DRAFT (AI-generated) and should be
 *  replaced with DSNY's official 12-language vendor-guide terminology before launch. */
const en = {
  mockBanner: 'PROTOTYPE · sample data — not official vending locations yet',
  agency: 'Office of Street Vendor Services',
  appTitle: 'Where can I vend?',
  appSubtitle: 'Tap anywhere to see if you can legally vend there.',

  nav_vendor: 'Vendor',
  nav_license: 'License',
  nav_map: 'Map',

  intro_title: 'Vend legally in New York City',
  intro_step1: 'Tell us your vendor type and license',
  intro_step2: 'See a map made for your rules',
  intro_step3: 'Tap any spot — or use your location — to check it',

  step_whatSell: 'What do you sell?',
  step_whatSell_hint: 'This determines which rules apply to you.',
  step_whatLicense: "What's your license?",
  step_whatLicense_hint: 'Each license opens up different places.',
  step_pickBorough: 'Which borough is your permit for?',
  step_pickBorough_hint: 'Borough permits are valid in one borough only — not Manhattan.',
  step_pickPrecinct: 'Which precinct is your Green Cart permit for?',

  back: 'Back',
  changeLicense: 'Change license',
  showingRulesFor: 'Showing rules for',

  view_live: 'Now',
  view_planning: 'Day & time',

  legend_allowed: 'Allowed to vend',
  legend_noVending: 'No vending',
  legend_restricted: 'Restricted',
  legend_outOfScope: 'Out of scope',

  map_tapHint:
    'Colored areas are where you can’t vend (red), are restricted (yellow), or out of scope (gray). Everywhere else is generally allowed — tap any spot to check.',
  map_loading: 'Loading map…',

  remindersHeading: 'Before you set up',
  unverifiedBanner: 'Provisional — this rule is still being confirmed with City legal staff.',

  feedback: 'Feedback',
  draftNote: 'Detailed rule explanations are shown in English while translations are being finalized.',
  geo_outside: 'You appear to be outside New York City — this tool only covers the five boroughs.',
  geo_denied: 'Location is turned off for this site. Allow location access, then tap the button again.',
  geo_error: 'Couldn’t get your location. Please try again.',

  vt_food: 'Food Vendor',
  vt_merch: 'General Vendor',
  vt_firstAmendment: 'First Amendment Vendor',
  vt_food_desc: 'Licensed by the Department of Health and Mental Hygiene',
  vt_merch_desc: 'Licensed by the Department of Consumer and Worker Protection',
  vt_firstAmendment_desc: 'Books, art, and written matter · No license required',

  lt_citywide: 'Citywide Permit',
  lt_borough: 'Borough-Specific Permit',
  lt_greenCart: 'Green Cart Permit',
  lt_seasonal: 'Seasonal Permit',
  lt_standard: 'Standard License',
  lt_yellow: 'Specialized License — Citywide',
  lt_blue: 'Specialized License — Midtown Core',
  lt_firstAmendment: 'First Amendment Vending',
  ld_citywide: 'All five boroughs, year-round',
  ld_borough: 'One borough, excluding Manhattan',
  ld_greenCart: 'Fresh produce only, in your assigned precinct',
  ld_seasonal: 'Valid April 1 – October 31',
  ld_standard: 'Most areas; not permitted in C4/C5/C6 zones or the Midtown Core',
  ld_yellow: 'Disabled veterans; valid citywide, including commercial zones',
  ld_blue: 'Disabled veterans; required to vend in the Midtown Core',
  ld_firstAmendment: 'Follows placement rules; treatment in certain zones is pending legal confirmation',
  chip_borough: 'Borough',
  chip_greenCart: 'Green Cart',
  chip_yellow: 'Yellow',
  chip_blue: 'Blue',
};

export type Strings = typeof en;
export default en;
