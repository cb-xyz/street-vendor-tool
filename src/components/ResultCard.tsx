import { useTranslation } from 'react-i18next';
import type { VendorConfig, Verdict, VendorType } from '../engine/types';

const STATUS_STYLE: Record<Verdict['status'], { color: string; badge: string }> = {
  permitted: { color: 'var(--green)', badge: '✅' },
  restricted: { color: 'var(--yellow)', badge: '⚠️' },
  prohibited: { color: 'var(--red)', badge: '⛔' },
  outOfScope: { color: 'var(--gray)', badge: '➖' },
};

interface Props {
  verdict: Verdict;
  config: VendorConfig;
  locationLabel: string;
  typeEmoji: string;
  licenseTitle: string;
}

export function ResultCard({ verdict, config, locationLabel, typeEmoji, licenseTitle }: Props) {
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
      <ResourceLinks vendorType={config.vendorType} />
    </div>
  );
}

function ResourceLinks({ vendorType }: { vendorType: VendorType }) {
  const { t } = useTranslation();
  const isFood = vendorType === 'food';
  return (
    <div className="res-links" style={{ padding: '0 15px 14px' }}>
      <a
        href="https://www.nyc.gov/site/dsny/what-we-do/cleaning/street-vending-enforcement.page"
        target="_blank"
        rel="noopener"
      >
        📍{' '}
        <span>
          {t('link_officialMaps')}
          <small>{t('link_officialMaps_sub')}</small>
        </span>
        <span className="arr">↗</span>
      </a>
      <a
        href={
          isFood
            ? 'https://www.nyc.gov/site/doh/business/food-operators/mobile-and-temporary-food-vendors.page'
            : 'https://www.nyc.gov/site/dca/businesses/license-checklist-general-vendor.page'
        }
        target="_blank"
        rel="noopener"
      >
        📝{' '}
        <span>
          {isFood ? t('link_apply_food') : t('link_apply_merch')}
          <small>{isFood ? t('link_apply_food_sub') : t('link_apply_merch_sub')}</small>
        </span>
        <span className="arr">↗</span>
      </a>
      <a href="https://portal.311.nyc.gov/article/?kanumber=KA-02152" target="_blank" rel="noopener">
        ☎️{' '}
        <span>
          {t('link_311')}
          <small>{t('link_311_sub')}</small>
        </span>
        <span className="arr">↗</span>
      </a>
    </div>
  );
}
