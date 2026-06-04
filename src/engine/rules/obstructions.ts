/**
 * §10 step 5b — Physical obstructions (sidewalk sheds / scaffolding).
 *
 * A sidewalk shed doesn't legally ban vending, but it occupies the sidewalk and can make a spot
 * unusable or reduce the clear path below 12 ft. We surface it as a RESTRICTED advisory ("check
 * on site"), not a hard prohibition — and only if no redder rule already stopped evaluation.
 */
import { CITES } from '../citations';
import type { Rule } from '../types';

export const obstructions: Rule = ({ facts }) => {
  if (facts.atScaffolding) {
    return {
      stop: true,
      status: 'restricted',
      title: 'Scaffolding / sidewalk shed here',
      reasons: [
        {
          icon: '🏗️',
          code: 'SCAFFOLDING',
          title: 'A sidewalk shed may block this spot',
          detail:
            'Scaffolding can occupy the sidewalk and leave less than the required 12 ft clear path. Check on site that you can still set up legally at the curb.',
          citation: CITES.SCAFFOLDING,
        },
      ],
    };
  }
  return { stop: false };
};
