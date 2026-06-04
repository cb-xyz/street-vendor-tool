import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from './i18n';
import { OUTER_BOROUGHS, VENDOR_CATALOG, findLicense, findVendorType } from './config/catalog';
import { useVendorConfig } from './state/useVendorConfig';
import { SbsLogo } from './components/SbsLogo';
import type { Borough, LicenseSubType, VendorType } from './engine/types';

// Lazy-load the map (MapLibre + bundled GeoJSON) so the opening screen loads fast — it's only
// fetched once the user reaches the map step.
const RealMapView = lazy(() => import('./components/RealMapView').then((m) => ({ default: m.RealMapView })));

// Green Cart precincts offered in the picker (the illustrative layer uses precinct "40").
const DEMO_PRECINCTS = ['40', '52', '73', '101'];

export default function App() {
  const { t, i18n } = useTranslation();
  const { config, complete, update, reset } = useVendorConfig();

  const typeOpt = config.vendorType ? findVendorType(config.vendorType) : undefined;
  const licOpt =
    config.vendorType && config.license ? findLicense(config.vendorType, config.license) : undefined;

  // Derive which step we're on from the config completeness.
  const needsBorough = licOpt?.needsBorough && !config.permittedBorough;
  const needsPrecinct = licOpt?.needsPrecinct && !config.greenCartPrecinct;
  const step = !config.vendorType ? 0 : !config.license || needsBorough || needsPrecinct ? 1 : 2;

  return (
    <div className="wrap">
      <div className="mockban">{t('mockBanner')}</div>
      <header>
        <div className="brandrow">
          <SbsLogo />
          <div className="kicker">{t('agency')}</div>
        </div>
        <h1>{t('appTitle')}</h1>
        <div className="sub">{t('appSubtitle')}</div>
        <div className="langbar">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={i18n.language === l.code ? 'on' : ''}
              onClick={() => void i18n.changeLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main>
        {i18n.language !== 'en' && <p className="draft-note">{t('draftNote')}</p>}
        <nav className="stepper" aria-label="Progress">
          {[t('nav_vendor'), t('nav_license'), t('nav_map')].map((label, i) => (
            <div
              key={label}
              className={`step ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`}
            >
              <span className="step-num">{i < step ? '✓' : i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </nav>

        {step === 0 && (
          <>
            <section className="intro">
              <h2 className="intro-title">{t('intro_title')}</h2>
              <ol className="intro-steps">
                <li>{t('intro_step1')}</li>
                <li>{t('intro_step2')}</li>
                <li>{t('intro_step3')}</li>
              </ol>
            </section>
            <h2 className="q">{t('step_whatSell')}</h2>
            <p className="qs">{t('step_whatSell_hint')}</p>
            {VENDOR_CATALOG.map((v) => (
              <button key={v.id} className="opt vt-opt" onClick={() => reset({ vendorType: v.id })}>
                <span className="emoji">{v.emoji}</span>
                <span>
                  <span className="ttl">{t(`vt_${v.id}`)}</span>
                  <span className="dsc">{t(`vt_${v.id}_desc`)}</span>
                </span>
              </button>
            ))}
          </>
        )}

        {step === 1 && typeOpt && (
          <StepLicense
            typeId={typeOpt.id}
            needsBorough={!!needsBorough}
            needsPrecinct={!!needsPrecinct}
            onPickLicense={(id) => update({ license: id, permittedBorough: undefined, greenCartPrecinct: undefined })}
            onPickBorough={(b) => update({ permittedBorough: b })}
            onPickPrecinct={(p) => update({ greenCartPrecinct: p })}
            onBackToType={() => reset({})}
            onBackToLicenseList={() => reset({ vendorType: typeOpt.id })}
          />
        )}

        {step === 2 && complete && typeOpt && licOpt && (
          <>
            <button className="back" onClick={() => reset({ vendorType: config.vendorType })}>
              ‹ {t('changeLicense')}
            </button>
            <div className="maphead">
              <div className="who">
                {t('showingRulesFor')}
                <br />
                <b>
                  {typeOpt.emoji} {t(`lt_${config.license}`)}
                  {config.permittedBorough ? ` · ${config.permittedBorough}` : ''}
                  {config.greenCartPrecinct ? ` · Precinct ${config.greenCartPrecinct}` : ''}
                </b>
              </div>
            </div>
            <Suspense
              fallback={
                <div className="maploading" role="status" aria-live="polite">
                  <span className="spinner" aria-hidden="true" />
                  <span>{t('map_loading')}</span>
                </div>
              }
            >
              <RealMapView config={complete} typeEmoji={typeOpt.emoji} licenseTitle={t(`lt_${config.license}`)} />
            </Suspense>
          </>
        )}
      </main>

      <footer className="appfoot">
        {/* TODO: replace with the real SBS feedback intake (form or monitored inbox). */}
        <a
          className="feedback-btn"
          href="mailto:streetvendorservices@sbs.nyc.gov?subject=Where%20Can%20I%20Vend%3F%20feedback&body=What%20worked%2C%20what%20didn%27t%2C%20or%20a%20spot%20that%20looked%20wrong%3A%0A%0A"
        >
          💬 {t('feedback')}
        </a>
      </footer>
    </div>
  );
}

interface StepLicenseProps {
  typeId: VendorType;
  needsBorough: boolean;
  needsPrecinct: boolean;
  onPickLicense: (id: LicenseSubType) => void;
  onPickBorough: (b: Borough) => void;
  onPickPrecinct: (p: string) => void;
  onBackToType: () => void;
  onBackToLicenseList: () => void;
}

function StepLicense({
  typeId,
  needsBorough,
  needsPrecinct,
  onPickLicense,
  onPickBorough,
  onPickPrecinct,
  onBackToType,
  onBackToLicenseList,
}: StepLicenseProps) {
  const { t } = useTranslation();
  const type = findVendorType(typeId)!;

  if (needsBorough) {
    return (
      <>
        <button className="back" onClick={onBackToLicenseList}>
          ‹ {t('back')}
        </button>
        <h2 className="q">{t('step_pickBorough')}</h2>
        <p className="qs">{t('step_pickBorough_hint')}</p>
        {OUTER_BOROUGHS.map((b) => (
          <button key={b} className="opt" onClick={() => onPickBorough(b)}>
            <span className="emoji">🗽</span>
            <span>
              <span className="ttl">{b}</span>
            </span>
          </button>
        ))}
      </>
    );
  }

  if (needsPrecinct) {
    return (
      <>
        <button className="back" onClick={onBackToLicenseList}>
          ‹ {t('back')}
        </button>
        <h2 className="q">{t('step_pickPrecinct')}</h2>
        <p className="qs">{type.emoji} {type.title}</p>
        {DEMO_PRECINCTS.map((p) => (
          <button key={p} className="opt" onClick={() => onPickPrecinct(p)}>
            <span className="emoji">🥬</span>
            <span>
              <span className="ttl">Precinct {p}</span>
              <span className="dsc">{p === '40' ? 'Demo precinct with a mapped Green Cart zone' : 'Demo precinct'}</span>
            </span>
          </button>
        ))}
      </>
    );
  }

  return (
    <>
      <button className="back" onClick={onBackToType}>
        ‹ {t('back')}
      </button>
      <h2 className="q">
        {type.emoji} {t('step_whatLicense')}
      </h2>
      <p className="qs">{t('step_whatLicense_hint')}</p>
      {type.licenses.map((l) => (
        <button key={l.id} className="opt" onClick={() => onPickLicense(l.id)}>
          <span>
            <span className="ttl">
              {t(`lt_${l.id}`)}
              {l.chip && <span className={`chip ${l.chip.tone}`}>{t(`chip_${l.id}`)}</span>}
            </span>
            <span className="dsc">{t(`ld_${l.id}`)}</span>
          </span>
        </button>
      ))}
    </>
  );
}
