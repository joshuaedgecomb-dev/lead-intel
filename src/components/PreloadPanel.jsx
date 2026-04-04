import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import comcastZips from '../data/comcast-zips.json';
import { fetchOneWeather, weatherCache, sleep, getGridKey } from '../hooks/useWeather.js';

export default function PreloadPanel({ zip5Data }) {
  const [preload, setPreload] = useState({ active: false, done: 0, total: 0, loaded: 0, failed: 0, finished: false });
  const preloadAbort = useRef(false);
  const started = useRef(false);

  // Build set of Comcast ZIP3 prefixes from the full ZIP5 list
  const comcastZip3Set = useMemo(() => {
    const set = new Set();
    for (const z5 of comcastZips) {
      set.add(z5.substring(0, 3));
    }
    return set;
  }, []);

  const cachedCount = Object.keys(weatherCache).filter(k => comcastZip3Set.has(k)).length;
  const comcastTotal = comcastZip3Set.size;

  const startPreload = useCallback(async () => {
    preloadAbort.current = false;

    // Build deduplication map: gridKey -> [zip3 codes]
    const gridMap = {};
    for (const z3 of comcastZip3Set) {
      if (weatherCache[z3]) continue;
      // Find a representative ZIP5 for this ZIP3 to get coordinates
      const repZip = zip5Data ? Object.keys(zip5Data).find(z5 => z5.startsWith(z3)) : null;
      if (!repZip || !zip5Data[repZip]) continue;
      const { lat, lon } = zip5Data[repZip];
      const gk = getGridKey(lat, lon);
      if (!gridMap[gk]) gridMap[gk] = { lat, lon, zips: [] };
      gridMap[gk].zips.push(z3);
    }

    const gridPoints = Object.values(gridMap);
    if (gridPoints.length === 0) {
      setPreload({ active: false, done: 0, total: 0, loaded: comcastTotal, failed: 0, finished: true });
      return;
    }

    setPreload({ active: true, done: 0, total: gridPoints.length, loaded: 0, failed: 0, finished: false });

    let loaded = 0;
    let failed = 0;

    for (let i = 0; i < gridPoints.length; i++) {
      if (preloadAbort.current) break;

      const gp = gridPoints[i];
      const result = await fetchOneWeather(gp.lat, gp.lon);

      if (result) {
        for (const z3 of gp.zips) {
          weatherCache[z3] = result;
        }
        loaded += gp.zips.length;
      } else {
        failed += gp.zips.length;
      }

      setPreload(prev => ({ ...prev, done: i + 1, loaded, failed }));

      if (i < gridPoints.length - 1) {
        await sleep(600);
      }
    }

    setPreload(prev => ({ ...prev, active: false, finished: true }));
  }, [comcastZip3Set, comcastTotal, zip5Data]);

  // Auto-start weather loading when the app opens
  useEffect(() => {
    if (!started.current && zip5Data) {
      started.current = true;
      startPreload();
    }
  }, [zip5Data, startPreload]);

  const preloadPct = preload.total > 0 ? Math.round((preload.done / preload.total) * 100) : 0;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: '12px 16px',
      border: '1px solid #21262d', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cachedCount >= comcastTotal ? '#7ee787' : cachedCount > 0 ? '#ffa657' : '#484f58',
        }} />
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e' }}>
          Weather Cache
        </div>
      </div>

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#e6edf3' }}>
        <span style={{ color: cachedCount >= comcastTotal ? '#7ee787' : '#ffa657', fontWeight: 700 }}>{cachedCount}</span>
        <span style={{ color: '#484f58' }}> / </span>
        <span>{comcastTotal}</span>
        <span style={{ color: '#8b949e', marginLeft: 4 }}>service area zips cached</span>
      </div>

      {preload.active && (
        <div style={{ flex: '1 1 200px', minWidth: 200 }}>
          <div style={{ background: '#21262d', borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(90deg, #238636, #7ee787)',
              height: '100%', width: `${preloadPct}%`,
              transition: 'width 0.3s ease', borderRadius: 4,
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#8b949e', marginTop: 3 }}>
            Grid point {preload.done}/{preload.total} ({preloadPct}%)
            {preload.loaded > 0 && <span style={{ color: '#7ee787' }}> | {preload.loaded} zips loaded</span>}
            {preload.failed > 0 && <span style={{ color: '#f85149' }}> | {preload.failed} failed</span>}
          </div>
        </div>
      )}

      {preload.finished && (
        <span style={{ fontSize: 12, color: '#7ee787', fontWeight: 600 }}>
          {cachedCount >= comcastTotal ? 'All cached' : 'Partial cache'}
        </span>
      )}

      {(cachedCount > 0 && !preload.active) && (
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#484f58' }}>
          {weatherCache[Object.keys(weatherCache)[0]]?.ts
            ? `Loaded ${new Date(weatherCache[Object.keys(weatherCache)[0]].ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
            : ''}
        </div>
      )}
    </div>
  );
}
