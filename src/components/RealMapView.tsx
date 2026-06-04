import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { evaluate } from '../engine/ruleEngine';
import type { EvalTime, VendorConfig, Verdict } from '../engine/types';
import { NycPilotResolver, type LngLat } from '../data/resolver';
import { BOROUGHS, NYC_MASK, SUBWAY_ENTRANCES, ZONES } from '../data/nyc';
import type { LayerStatus } from '../data/layerRegistry';
import type { LocationFacts, EvalTime as EvalTimeT, VendorConfig as VendorConfigT, VerdictStatus } from '../engine/types';
import type { ZoneKind } from '../data/nyc';
import { fromDateTimeInputs, nycNow } from '../state/evalTime';
import { ResultCard } from './ResultCard';
import { VendorResources } from './VendorResources';

// OpenFreeMap Positron — clean, modern, minimal vector tiles, no API key / no usage limits.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const NYC_CENTER: [number, number] = [-73.95, 40.7];
// Bounding box that keeps the map over NYC (no New Jersey / Long Island / far-out zoom).
const NYC_BOUNDS: maplibregl.LngLatBoundsLike = [
  [-74.27, 40.48], // SW
  [-73.68, 40.92], // NE
];
// Soft neutral fill for everything outside the five boroughs (the mask).
const MASK_COLOR = '#dbe2ea';

const PIN_COLOR: Record<VerdictStatus, string> = {
  permitted: '#1a7f37',
  restricted: '#c98a00',
  prohibited: '#d8362a',
  outOfScope: '#6b7682',
};

// Translucent fills by verdict — so the map shows, at a glance, what each zone means for THIS
// vendor. Permitted areas are left clear (the base map = "generally allowed, still check").
const ZONE_FILL: Record<VerdictStatus, string> = {
  prohibited: 'rgba(216,54,42,0.45)',
  restricted: 'rgba(201,138,0,0.45)',
  outOfScope: 'rgba(120,130,140,0.40)',
  permitted: 'rgba(26,127,55,0.38)',
};
const CLEAR = 'rgba(0,0,0,0)';

const SAMPLE_MFV_RESTRICTION = {
  yearRound: true,
  restrictedWindows: [{ days: [0, 1, 2, 3, 4, 5, 6], startMinutes: 720, endMinutes: 1380 }],
};

/** Representative facts for a zone kind, so we can ask the engine what colour it should be. */
function zoneFacts(kind: ZoneKind, config: VendorConfigT): LocationFacts {
  switch (kind) {
    case 'park':
      return { borough: 'Manhattan', inPark: true };
    case 'midtownCore':
      return { borough: 'Manhattan', inMidtownCore: true };
    case 'flushing':
      return { borough: 'Queens', inFlushingZone: true };
    case 'dykerHeights':
      return { borough: 'Brooklyn', inDykerHeights: true };
    case 'commercial':
      return { borough: 'Manhattan', zoningDistrict: 'C5' };
    case 'greenCart':
      return { borough: 'Bronx', greenCartPrecinct: config.greenCartPrecinct ?? '40' };
    case 'mfvRestricted':
      return { borough: 'Manhattan', mfvRestriction: SAMPLE_MFV_RESTRICTION };
    case 'hydrant':
      return { borough: 'Manhattan', withinHydrantBuffer: true };
    case 'scaffolding':
      return { borough: 'Manhattan', atScaffolding: true };
  }
}

const ZONE_KINDS: ZoneKind[] = [
  'park', 'midtownCore', 'flushing', 'dykerHeights', 'commercial', 'greenCart', 'mfvRestricted', 'hydrant', 'scaffolding',
];

/** Build a MapLibre `match` expression colouring each zone by its verdict for this vendor+time. */
function zoneColorExpr(config: VendorConfigT, at: EvalTimeT) {
  const pairs: string[] = [];
  for (const kind of ZONE_KINDS) {
    const status = evaluate(config, zoneFacts(kind, config), at).status;
    // Leave permitted zones clear, except Green Cart, where the precinct IS the allowed area.
    const color = status === 'permitted' ? (kind === 'greenCart' ? ZONE_FILL.permitted : CLEAR) : ZONE_FILL[status];
    pairs.push(kind, color);
  }
  return ['match', ['get', 'kind'], ...pairs, CLEAR] as unknown as maplibregl.ExpressionSpecification;
}

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
  const markerElRef = useRef<HTMLDivElement | null>(null);
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

    // Custom, modern pin: a colored dot + ring that reflects the verdict.
    if (!markerElRef.current) {
      markerElRef.current = document.createElement('div');
      markerElRef.current.className = 'svpin';
    }
    markerElRef.current.style.setProperty('--pin', PIN_COLOR[verdict.status]);
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ element: markerElRef.current, anchor: 'center' });
    }
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

      // Opaque mask over everything outside the five boroughs — no New Jersey / Long Island.
      map.addSource('mask', { type: 'geojson', data: NYC_MASK as unknown as GeoJSON.FeatureCollection });
      map.addLayer({ id: 'mask-fill', type: 'fill', source: 'mask', paint: { 'fill-color': MASK_COLOR } });

      map.addSource('boroughs', { type: 'geojson', data: BOROUGHS as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'boroughs-outline',
        type: 'line',
        source: 'boroughs',
        paint: { 'line-color': '#9aa7b4', 'line-width': 1.2 },
      });
      map.addSource('zones', { type: 'geojson', data: ZONES as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: { 'fill-color': zoneColorExpr(evalRef.current.config, evalRef.current.at), 'fill-opacity': 1 },
      });
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones',
        paint: { 'line-color': 'rgba(60,60,60,0.45)', 'line-width': 1, 'line-dasharray': [2, 2] },
      });

      // Subway entrances are no-vend areas (10 ft). Shown as soft red halos + a solid core.
      map.addSource('subway', { type: 'geojson', data: SUBWAY_ENTRANCES as unknown as GeoJSON.FeatureCollection });
      map.addLayer({
        id: 'subway-buffer',
        type: 'circle',
        source: 'subway',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 11, 17, 26],
          'circle-color': '#d8362a',
          'circle-opacity': 0.18,
        },
      });
      map.addLayer({
        id: 'subway-core',
        type: 'circle',
        source: 'subway',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1.4, 16, 4],
          'circle-color': '#d8362a',
          'circle-opacity': 0.9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0, 14, 1],
        },
      });

      // Hover a subway entrance → explain the no-vend rule.
      const subwayPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
      const showPop = (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        const name = (e.features?.[0]?.properties?.name as string) || '';
        subwayPopup
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>Subway entrance — no vending</strong>${name ? `<br><span class="pop-sub">${name}</span>` : ''}` +
              `<br><span class="pop-warn">Stay 10 ft away</span>`,
          )
          .addTo(map);
      };
      const hidePop = () => {
        map.getCanvas().style.cursor = '';
        subwayPopup.remove();
      };
      for (const layer of ['subway-core', 'subway-buffer']) {
        map.on('mouseenter', layer, showPop);
        map.on('mousemove', layer, showPop);
        map.on('mouseleave', layer, hidePop);
      }
    });

    map.on('click', (e) => checkPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat }, map));

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // When config or time changes: recolour the zones and re-evaluate the selected point.
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer('zones-fill')) {
      map.setPaintProperty('zones-fill', 'fill-color', zoneColorExpr(config, at));
    }
    if (selected) {
      const facts = resolver.resolve(selected.at);
      setSelected((prev) => (prev ? { ...prev, verdict: evaluate(config, facts, at) } : prev));
    }
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
        <span className="timecap">Some rules change by time</span>
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
      <p className="tap-hint">
        Colored areas show where you <b>can’t</b> vend (red), are <b>restricted</b> (yellow), or are
        <b> out of scope</b> (gray) for this license. Tap any spot for details.
      </p>

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
            Live: subway buffers, borough boundaries. Statutory: special zones (from the Admin Code).
            Illustrative samples pending licensed City data: zoning, parks, Green Cart, DOHMH
            restricted streets, hydrants, scaffolding. Citywide hydrant/sidewalk coverage needs a
            spatial service in production.
          </p>
        </div>
      </details>
    </>
  );
}
