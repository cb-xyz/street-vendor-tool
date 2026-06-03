import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { evaluate } from '../engine/ruleEngine';
import type { EvalTime, VendorConfig, Verdict } from '../engine/types';
import { COLS, MOCK_SURFACE, ROWS } from '../data/mockSurface';
import { fromDateTimeInputs, nycNow } from '../state/evalTime';
import { ResultCard } from './ResultCard';

const FILL: Record<Verdict['status'], string> = {
  permitted: '#9cd6a4',
  restricted: '#f4d98a',
  prohibited: '#e8a59c',
  outOfScope: '#c9c5ba',
};

interface Props {
  config: VendorConfig;
  typeEmoji: string;
  licenseTitle: string;
}

type Mode = 'live' | 'planning';

/** Default planning inputs: today's date and noon, so the food planning view starts somewhere sane. */
function todayInputs(): { date: string; time: string } {
  const now = nycNow();
  const date = `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')}`;
  return { date, time: '12:00' };
}

export function MapView({ config, typeEmoji, licenseTitle }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const isFood = config.vendorType === 'food';
  const [mode, setMode] = useState<Mode>('live');
  const initial = todayInputs();
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);

  const at: EvalTime = useMemo(() => {
    if (!isFood) return nycNow(); // time only matters for food rules; still pass a valid time.
    return mode === 'live' ? nycNow() : fromDateTimeInputs(date, time);
  }, [isFood, mode, date, time]);

  const verdicts = useMemo(
    () => MOCK_SURFACE.map((b) => ({ block: b, verdict: evaluate(config, b.facts, at) })),
    [config, at],
  );

  const W = 100;
  const H = 108;
  const gw = W / COLS;
  const gh = (H - 8) / ROWS;
  const top = 8;

  const selectedEntry = selected !== null ? verdicts[selected] : null;

  return (
    <>
      {isFood && (
        <div className="timebar">
          <div className="toggle">
            <button className={mode === 'live' ? 'on' : ''} onClick={() => setMode('live')}>
              {t('view_live')}
            </button>
            <button className={mode === 'planning' ? 'on' : ''} onClick={() => setMode('planning')}>
              {t('view_planning')}
            </button>
          </div>
          {mode === 'planning' && (
            <>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
            </>
          )}
        </div>
      )}

      <div className="legend">
        <span style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
          <i className="sw" style={{ background: 'var(--green)' }} />
          {t('legend_permitted')}
        </span>
        <span style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>
          <i className="sw" style={{ background: 'var(--yellow)' }} />
          {t('legend_restricted')}
        </span>
        <span style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
          <i className="sw" style={{ background: 'var(--red)' }} />
          {t('legend_prohibited')}
        </span>
        <span style={{ background: 'var(--gray-bg)', color: 'var(--gray)' }}>
          <i className="sw" style={{ background: '#9b958a' }} />
          {t('legend_outOfScope')}
        </span>
      </div>

      <div className="map">
        <svg viewBox="0 0 100 108" preserveAspectRatio="none" role="grid" aria-label="Mock vending map">
          {verdicts.map(({ block, verdict }) => {
            const x = block.col * gw;
            const y = top + block.row * gh;
            const isSel = selected === block.index;
            return (
              <rect
                key={block.index}
                className="cell"
                x={x + 0.6}
                y={y + 0.6}
                width={gw - 1.2}
                height={gh - 1.2}
                rx={1.5}
                fill={FILL[verdict.status]}
                stroke={isSel ? 'var(--ink)' : '#cfc9bb'}
                strokeWidth={isSel ? 2 : 0.5}
                onClick={() => setSelected(block.index)}
                role="gridcell"
                aria-label={`${block.label}: ${verdict.status}`}
              />
            );
          })}
          <text x={3} y={6} fontSize={4} fill="#7a7468" fontWeight={700}>
            MOCK MANHATTAN GRID (illustrative)
          </text>
        </svg>
      </div>
      <p className="tap-hint">{t('tapHint')}</p>

      {selectedEntry && (
        <ResultCard
          verdict={selectedEntry.verdict}
          config={config}
          locationLabel={selectedEntry.block.label}
          typeEmoji={typeEmoji}
          licenseTitle={licenseTitle}
        />
      )}

      <div className="disc">
        <b>{t('disclaimerTitle')}</b> {t('disclaimer')}
      </div>
    </>
  );
}
