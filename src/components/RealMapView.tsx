import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { evaluate } from '../engine/ruleEngine';
import type { EvalTime, VendorConfig, Verdict } from '../engine/types';
import { NycPilotResolver, type LngLat } from '../data/resolver';
import { BOROUGHS, SUBWAY_ENTRANCES, ZONES } from '../data/nyc';
import type { LayerStatus } from '../data/layerRegistry';
import { fromDateTimeInputs, nycNow } from '../state/evalTime';
import { ResultCard } from './ResultCard';
import { VendorResources } from './VendorResources';

// OpenFreeMap — open vector tiles, no API key (good for the pilot per CLAUDE.md).
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const NYC_CENTER: [number, number] = [-73.95, 40.7];
// Bounding box that keeps the map over NYC (no New Jersey / Long Island / far-out zoom).
const NYC_BOUNDS: maplibregl.LngLatBoundsLike = [
  [-74.33, 40.46], // SW
  [-73.65, 40.94], // NE
];

const ZONE_COLORS: Record<string, string> = {
  park: '#9b958a',
  midtownCore: '#1e40af',
  flushing: '#0e7490',
  dykerHeights: '#7c3aed',
  commercial: '#e8821a',
  greenCart: '#1a7f37',
  mfvRestricted: '#9a6b00',
  hydrant: '#b42318',
  scaffolding: '#7c3aed',
};

const STATUS_ICON: Record<LayerStatus, string> = {
  live: '✅',
  statutory: '📐',
  illustrative: '🧪',
  pending: '⏳',
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
  const resolver = useMemo(() => new NycPilotResolver(), []);

  // Time applies to all vendors (food restricted streets/seasonal; merch Dyker Heights).
  const [mode, setMode] = useState<'live' | 'planning'>('live');
  const initial = todayInputs();
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [selected, setSelected] = useState<Selected | null>(null);

  const at: EvalTime = useMemo(
    () => (mode === 'live' ? nycNow() : fromDateTimeInputs(date, time)),
    [mode, date, time],
  );

  const evalRef = useRef({ config, at, resolver });
  evalRef.current = { config, at, resolver };

  const checkPoint = (ll: LngLat, map: maplibregl.Map) => {
    const { config: cfg, at: when, resolver: res } = evalRef.current;
    const facts = res.resolve(ll);
    const verdict = evaluate(cfg, facts, when);
    const nearestSubwayFt = res.nearestSubwayMeters(ll) / 0.3048;
    setSelected({ at: ll, verdict, nearestSubwayFt });
    if (!markerRef.current) markerRef.current = new maplibregl.Marker({ color: '#b42318' });
    markerRef.current.setLngLat(ll).addTo(map);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: NYC_CENTER,
      zoom: 9.7,
      minZoom: 9.3,
      maxZoom: 18,
      maxBounds: NYC_BOUNDS,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap' }),
      'bottom-left',
    );
    // "Find my location" — bottom-right per request.
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
    });
    map.addControl(geolocate, 'bottom-right');
    geolocate.on('geolocate', (e: GeolocationPosition) => {
      checkPoint({ lng: e.coords.longitude, lat: e.coords.latitude }, map);
    });

    map.on('load', () => {
      // Collapse the attribution to a discrete "ⓘ" (expands on click) instead of a long line.
      containerRef.current
        ?.querySelector('.maplibregl-ctrl-attrib')
        ?.classList.remove('maplibregl-compact-show');

      map.addSource('boroughs', { type: 'geojson', data: BOROUGHS as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'boroughs-outline',
        type: 'line',
        source: 'boroughs',
        paint: { 'line-color': '#0a3d62', 'line-width': 1, 'line-opacity': 0.4 },
      });
      map.addSource('zones', { type: 'geojson', data: ZONES as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'kind'],
            'park', ZONE_COLORS.park!,
            'midtownCore', ZONE_COLORS.midtownCore!,
            'flushing', ZONE_COLORS.flushing!,
            'dykerHeights', ZONE_COLORS.dykerHeights!,
            'commercial', ZONE_COLORS.commercial!,
            'greenCart', ZONE_COLORS.greenCart!,
            'mfvRestricted', ZONE_COLORS.mfvRestricted!,
            'hydrant', ZONE_COLORS.hydrant!,
            'scaffolding', ZONE_COLORS.scaffolding!,
            '#888',
          ],
          'fill-opacity': 0.28,
        },
      });
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones',
        paint: { 'line-color': '#444', 'line-width': 1, 'line-dasharray': [2, 2] },
      });
      map.addSource('subway', { type: 'geojson', data: SUBWAY_ENTRANCES as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'subway-dots',
        type: 'circle',
        source: 'subway',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4],
          'circle-color': '#0a3d62',
          'circle-opacity': 0.5,
        },
      });
    });

    map.on('click', (e) => checkPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat }, map));

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Re-evaluate the selected point when config or time changes.
  useEffect(() => {
    if (!selected) return;
    const facts = resolver.resolve(selected.at);
    const verdict = evaluate(config, facts, at);
    setSelected((prev) => (prev ? { ...prev, verdict } : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, at]);

  return (
    <>
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
        <span className="timecap">Some rules change by day &amp; time</span>
      </div>

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
      <p className="tap-hint">Tap anywhere in the five boroughs — or use the locate button — to check a spot.</p>

      {selected && (
        <ResultCard
          verdict={selected.verdict}
          locationLabel={`Dropped pin · ${Math.round(selected.nearestSubwayFt)} ft from nearest subway`}
          typeEmoji={typeEmoji}
          licenseTitle={licenseTitle}
        />
      )}

      <VendorResources vendorType={config.vendorType} />

      <details className="layers-details">
        <summary>Data layers &amp; coverage (for reviewers)</summary>
        <div className="opcard">
          {resolver.layers().map((l) => (
            <div className="rule" key={l.id}>
              <span className="ic">{STATUS_ICON[l.status]}</span>
              <span className="tx">
                <b>
                  {l.label} <span className="pill">{l.status}</span>
                </b>
                <span>
                  {l.feeds}
                  {l.dataset ? ` · ${l.dataset}` : ''}
                </span>
              </span>
            </div>
          ))}
          <p className="mocknote">
            Subway buffers and borough boundaries use real City data; special zones are encoded from
            the Admin Code; commercial zoning, parks, Green Cart, DOHMH restricted streets, hydrants
            and scaffolding are illustrative samples pending licensed City layers. Citywide hydrant
            and sidewalk coverage needs a spatial-query service in production.
          </p>
        </div>
      </details>
    </>
  );
}
