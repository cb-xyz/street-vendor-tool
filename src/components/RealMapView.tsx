import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { evaluate } from '../engine/ruleEngine';
import type { EvalTime, VendorConfig, Verdict } from '../engine/types';
import { ManhattanPilotResolver, type LngLat } from '../data/resolver';
import { SUBWAY_ENTRANCES, ZONES } from '../data/manhattan';
import { fromDateTimeInputs, nycNow } from '../state/evalTime';
import { ResultCard } from './ResultCard';

// OpenFreeMap — open vector tiles, no API key (good for the pilot per CLAUDE.md).
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const MANHATTAN_CENTER: [number, number] = [-73.9785, 40.7549];

const ZONE_COLORS: Record<string, string> = {
  park: '#9b958a',
  midtownCore: '#1e40af',
  commercial: '#e8821a',
};

interface Props {
  config: VendorConfig;
  typeEmoji: string;
  licenseTitle: string;
}

interface Selected {
  at: LngLat;
  verdict: Verdict;
  nearestSubwayFt: number;
}

function todayInputs() {
  const now = nycNow();
  return {
    date: `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')}`,
    time: '12:00',
  };
}

export function RealMapView({ config, typeEmoji, licenseTitle }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const resolver = useMemo(() => new ManhattanPilotResolver(), []);

  const isFood = config.vendorType === 'food';
  const [mode, setMode] = useState<'live' | 'planning'>('live');
  const initial = todayInputs();
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [selected, setSelected] = useState<Selected | null>(null);

  const at: EvalTime = useMemo(() => {
    if (!isFood) return nycNow();
    return mode === 'live' ? nycNow() : fromDateTimeInputs(date, time);
  }, [isFood, mode, date, time]);

  // Keep the freshest evaluate() inputs available to the (stable) map click handler.
  const evalRef = useRef({ config, at, resolver });
  evalRef.current = { config, at, resolver };

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: MANHATTAN_CENTER,
      zoom: 13.2,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('zones', { type: 'geojson', data: ZONES as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'kind'],
            'park',
            ZONE_COLORS.park!,
            'midtownCore',
            ZONE_COLORS.midtownCore!,
            'commercial',
            ZONE_COLORS.commercial!,
            '#888',
          ],
          'fill-opacity': 0.22,
        },
      });
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones',
        paint: { 'line-color': '#444', 'line-width': 1, 'line-dasharray': [2, 2] },
      });
      map.addSource('subway', { type: 'geojson', data: SUBWAY_ENTRANCES as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'subway-dots',
        type: 'circle',
        source: 'subway',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 4],
          'circle-color': '#0a3d62',
          'circle-opacity': 0.55,
        },
      });
    });

    map.on('click', (e) => {
      const ll: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const { config: cfg, at: when, resolver: res } = evalRef.current;
      const facts = res.resolve(ll);
      const verdict = evaluate(cfg, facts, when);
      const nearestSubwayFt = res.nearestSubwayMeters(ll) / 0.3048;
      setSelected({ at: ll, verdict, nearestSubwayFt });

      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: '#b42318' });
      }
      markerRef.current.setLngLat(ll).addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Re-evaluate the already-selected point when the config or time changes.
  useEffect(() => {
    if (!selected) return;
    const facts = resolver.resolve(selected.at);
    const verdict = evaluate(config, facts, at);
    setSelected((prev) => (prev ? { ...prev, verdict } : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, at]);

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

      <div className="map" ref={containerRef} style={{ aspectRatio: '1 / 1.15' }} />
      <p className="tap-hint">Tap anywhere on the map to check that spot for your license.</p>

      {selected && (
        <ResultCard
          verdict={selected.verdict}
          config={config}
          locationLabel={`Dropped pin · ${Math.round(selected.nearestSubwayFt)} ft from nearest subway`}
          typeEmoji={typeEmoji}
          licenseTitle={licenseTitle}
        />
      )}

      <LayerProvenance resolver={resolver} />

      <div className="disc">
        <b>Manhattan pilot.</b> Subway-entrance buffers use real MTA data (DS-034). Zoning and park
        overlays are statutory/illustrative pending licensed City layers, and several rules are not
        yet integrated — see the data notes on each result. Always confirm with 311 or the agency.
      </div>
    </>
  );
}

function LayerProvenance({ resolver }: { resolver: ManhattanPilotResolver }) {
  return (
    <div className="opcard" style={{ marginTop: 14 }}>
      <h4>Data layers in this pilot</h4>
      {resolver.layers().map((l) => (
        <div className="rule" key={l.label}>
          <span className="ic">{/real/i.test(l.provenance) ? '✅' : '🧪'}</span>
          <span className="tx">
            <b>{l.label}</b>
            <span>{l.provenance}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
