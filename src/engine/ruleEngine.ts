/**
 * ruleEngine.ts — the heart of the app.
 *
 * A PURE, framework-independent function that takes a configured vendor, the resolved spatial
 * facts about a location, and (optionally) a time, and returns a color-coded verdict with reasons.
 *
 *     evaluate(vendorConfig, locationFacts, evalTime?) -> Verdict
 *
 * It runs the §10 precedence pipeline and stops at the first terminal rule. Non-terminal rules
 * accumulate reasons (e.g. "exempt because Blue license") and flags (unverified, mock layers)
 * that are folded into the final verdict. If no rule stops, the location is PERMITTED (green).
 *
 * See CLAUDE.md and Street_Vendor_Site_Selection.docx (Engineer Team §10) for the contract.
 * Conflicts C-1/C-2/C-3/C-6 are deliberately NOT encoded — verdicts touching them are flagged
 * `unverified` so the UI can present an appropriate caveat.
 */
import { buildReminders } from './reminders';
import { RULE_PIPELINE } from './rules';
import type {
  EvalTime,
  LocationFacts,
  Reason,
  RuleContext,
  VendorConfig,
  Verdict,
} from './types';

function uniqueLayers(layers: string[]): string[] {
  return [...new Set(layers.filter(Boolean))];
}

export function evaluate(
  config: VendorConfig,
  facts: LocationFacts,
  at?: EvalTime,
): Verdict {
  const acc: Reason[] = [];
  let unverified = false;
  const mockLayers: string[] = [...(facts.mockLayers ?? [])];

  const ctx: RuleContext = { config, facts, at, acc };

  for (const rule of RULE_PIPELINE) {
    const result = rule(ctx);

    if (result.unverified) unverified = true;
    if (result.mockLayers) mockLayers.push(...result.mockLayers);

    if (result.stop) {
      const showReminders = result.status === 'permitted' || result.status === 'restricted';
      return {
        status: result.status,
        title: result.title,
        reasons: [...acc, ...result.reasons],
        reminders: showReminders ? buildReminders(config) : [],
        unverified,
        mockLayers: uniqueLayers(mockLayers),
      };
    }

    if (result.reasons) acc.push(...result.reasons);
  }

  // 7. No rule stopped — permitted, with operational reminders.
  return {
    status: 'permitted',
    title: 'You can vend here',
    reasons: acc.length
      ? acc
      : [
          {
            icon: '✅',
            code: 'PERMITTED',
            title: 'No blocking rules at this spot',
            detail: 'This location passed every check for your license type. Follow the reminders below.',
          },
        ],
    reminders: buildReminders(config),
    unverified,
    mockLayers: uniqueLayers(mockLayers),
  };
}

export type { Verdict, VendorConfig, LocationFacts, EvalTime } from './types';
