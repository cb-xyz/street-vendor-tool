import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from './i18n';
import { OUTER_BOROUGHS, VENDOR_CATALOG, findLicense, findVendorType } from './config/catalog';
import { useVendorConfig } from './state/useVendorConfig';
import { MapView } from './components/MapView';
import { RealMapView } from './components/RealMapView';
import type { Borough, LicenseSubType, VendorType } from './engine/types';

type Surface = 'manhattan' | 'demo';

// Demo Green Cart precincts (the mock surface uses precinct "40").
const DEMO_PRECINCTS = ['40', '52', '73', '101'];

export default function App() {
  const { t, i18n } = useTranslation();
  const { config, complete, update, reset } = useVendorConfig();
  const [surface, setSurface] = useState<Surface>('manhattan');

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
        <div className="kicker">{t('agency')}</div>
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
        <div className="step-dots">
          {[0, 1, 2].map((d) => (
            <i key={d} className={d <= step ? 'on' : ''} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="q">{t('step_whatSell')}</h2>
            <p className="qs">{t('step_whatSell_hint')}</p>
            {VENDOR_CATALOG.map((v) => (
              <button key={v.id} className="opt" onClick={() => reset({ vendorType: v.id })}>
                <span className="emoji">{v.emoji}</span>
                <span>
                  <span className="ttl">{v.title}</span>
                  <span className="dsc">{v.desc}</span>
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
            currentLicense={config.license}
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
                  {typeOpt.emoji} {licOpt.title}
                  {config.permittedBorough ? ` · ${config.permittedBorough}` : ''}
                  {config.greenCartPrecinct ? ` · Precinct ${config.greenCartPrecinct}` : ''}
                </b>
              </div>
              <div className="toggle">
                <button className={surface === 'manhattan' ? 'on' : ''} onClick={() => setSurface('manhattan')}>
                  NYC map
                </button>
                <button className={surface === 'demo' ? 'on' : ''} onClick={() => setSurface('demo')}>
                  Demo grid
                </button>
              </div>
            </div>
            {surface === 'manhattan' ? (
              <RealMapView config={complete} typeEmoji={typeOpt.emoji} licenseTitle={licOpt.title} />
            ) : (
              <MapView config={complete} typeEmoji={typeOpt.emoji} licenseTitle={licOpt.title} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

interface StepLicenseProps {
  typeId: VendorType;
  currentLicense?: LicenseSubType;
  needsBorough: boolean;
  needsPrecinct: boolean;
  onPickLicense: (id: LicenseSubType) => void;
  onPickBorough: (b: Borough) => void;
  onPickPrecinct: (p: string) => void;
  onBackToType: () => void;
}

function StepLicense({
  typeId,
  currentLicense,
  needsBorough,
  needsPrecinct,
  onPickLicense,
  onPickBorough,
  onPickPrecinct,
  onBackToType,
}: StepLicenseProps) {
  const { t } = useTranslation();
  const type = findVendorType(typeId)!;

  if (needsBorough) {
    return (
      <>
        <button className="back" onClick={() => onPickLicense(currentLicense!)}>
          ‹ {t('back')}
        </button>
        <h2 className="q">{t('step_pickBorough')}</h2>
        <p className="qs">{type.emoji} {type.title}</p>
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
        <button className="back" onClick={() => onPickLicense(currentLicense!)}>
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
              {l.title}
              {l.chip && <span className={`chip ${l.chip.tone}`}>{l.chip.label}</span>}
            </span>
            <span className="dsc">{l.desc}</span>
          </span>
        </button>
      ))}
    </>
  );
}
