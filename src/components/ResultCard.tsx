import { useTranslation } from 'react-i18next';
import type { Verdict } from '../engine/types';

const STATUS_STYLE: Record<Verdict['status'], { color: string; badge: string }> = {
  permitted: { color: 'var(--green)', badge: '✅' },
  restricted: { color: 'var(--yellow)', badge: '⚠️' },
  prohibited: { color: 'var(--red)', badge: '⛔' },
  outOfScope: { color: 'var(--gray)', badge: '➖' },
};

interface Props {
  verdict: Verdict;
  locationLabel: string;
  typeEmoji: string;
  licenseTitle: string;
}

export function ResultCard({ verdict, locationLabel, typeEmoji, licenseTitle }: Props) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[verdict.status];

  return (
    <div className="result">
      <div className="top" style={{ background: style.color }}>
        <span className="badge">{style.badge}</span>
        <span>
          <span className="verdict">{verdict.title}</span>
          <span className="loc">
            {locationLabel} · {typeEmoji} {licenseTitle}
          </span>
        </span>
      </div>
      <div className="body">
        {verdict.unverified && <div className="unverified">{t('unverifiedBanner')}</div>}

        {verdict.reasons.map((r) => (
          <div className="rule" key={r.code}>
            <span className="ic">{r.icon}</span>
            <span className="tx">
              <b>{r.title}</b>
              <span>{r.detail}</span>
              {r.citation && <cite>{r.citation}</cite>}
            </span>
          </div>
        ))}

        {verdict.reminders.length > 0 && (
          <div className="opcard">
            <h4>{t('remindersHeading')}</h4>
            {verdict.reminders.map((r) => (
              <div className="rule" key={r.code}>
                <span className="ic">{r.icon}</span>
                <span className="tx">
                  <b>{r.title}</b>
                  <span>{r.detail}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {verdict.mockLayers.length > 0 && (
          <div className="mocknote">
            <b>Data note:</b> this verdict uses approximated or mock layers — {verdict.mockLayers.join('; ')}.
          </div>
        )}
      </div>
    </div>
  );
}
