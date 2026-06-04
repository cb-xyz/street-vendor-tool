/** English base strings. Other Local Law 30 languages fall back to these until translated. */
const en = {
  mockBanner: 'PROTOTYPE · sample data — not official vending locations yet',
  agency: 'NYC Office of Street Vendor Services',
  appTitle: 'Where can I vend?',
  appSubtitle: 'Tap anywhere to see if you can legally vend there.',

  intro_title: 'Vend legally in New York City',
  intro_body:
    'NYC’s vending rules are spread across several agencies and hard to read on the street. This map brings them into one place — set up your vendor profile and see where you can legally vend, configured to your license and the time of day.',
  intro_step1: 'Tell us your vendor type and license',
  intro_step2: 'See a map made for your rules',
  intro_step3: 'Tap any spot — or use your location — to check it',
  intro_cta: 'Get started',

  step_whatSell: 'What do you sell?',
  step_whatSell_hint: 'This determines which rules apply to you.',
  step_whatLicense: "What's your license?",
  step_whatLicense_hint: 'Each license opens up different places.',
  step_pickBorough: 'Which borough is your permit for?',
  step_pickPrecinct: 'Which precinct is your Green Cart permit for?',

  back: 'Back',
  changeLicense: 'Change license',

  legend_permitted: 'Permitted',
  legend_restricted: 'Restricted',
  legend_prohibited: 'Prohibited',
  legend_outOfScope: 'Out of scope',

  tapBlock: 'Tap a block',
  tapHint: "Tap any block to see why it's green, yellow, or red.",
  showingRulesFor: 'Showing rules for',

  view_live: 'Now',
  view_planning: 'Day & time',

  unverifiedBanner: 'Provisional — this rule is still being confirmed with City legal staff.',
  remindersHeading: 'Before you set up',

  disclaimerTitle: 'This is a prototype.',
  disclaimer:
    'The map uses illustrative mock blocks, not real NYC streets. The real tool draws on official City data (street centerline, DOHMH restricted streets, DCWP restrictions, zoning, subway entrances, and more). Rules can change — always confirm with 311 or the agency before vending.',

  link_officialMaps: 'Official City vending maps & guides',
  link_officialMaps_sub: 'DSNY — General Vendor & Mobile Food maps, 12 languages',
  link_apply_food: 'Apply for your food vending permit',
  link_apply_merch: 'Apply for your vendor license',
  link_apply_food_sub: 'DOHMH application checklist',
  link_apply_merch_sub: 'DCWP application checklist',
  link_311: 'Questions about a specific spot?',
  link_311_sub: 'Check with 311 or the agency',
};

export type Strings = typeof en;
export default en;
