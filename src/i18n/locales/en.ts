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

  vt_food: 'Food Vendor',
  vt_merch: 'General Vendor',
  vt_firstAmendment: 'First Amendment Vendor',
  vt_food_desc: 'Licensed by the Department of Health and Mental Hygiene',
  vt_merch_desc: 'Licensed by the Department of Consumer and Worker Protection',
  vt_firstAmendment_desc: 'Books, art, and written matter · No license required',
};

export type Strings = typeof en;
export default en;
