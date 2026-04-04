import { useState, useCallback, useRef } from 'react';

const weatherCache = {};
const gridCache = {};

function getGridKey(lat, lon) {
  return `${(Math.round(lat * 4) / 4).toFixed(2)},${(Math.round(lon * 4) / 4).toFixed(2)}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchOneWeather(lat, lon) {
  const gk = getGridKey(lat, lon);
  try {
    let fUrl = gridCache[gk];
    if (!fUrl) {
      const r1 = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { Accept: 'application/geo+json' } }
      );
      if (!r1.ok) throw new Error(`NWS points ${r1.status}`);
      const p = await r1.json();
      fUrl = p?.properties?.forecast;
      if (!fUrl) throw new Error('No forecast URL');
      gridCache[gk] = fUrl;
    }
    const r2 = await fetch(fUrl, { headers: { Accept: 'application/geo+json' } });
    if (!r2.ok) throw new Error(`NWS forecast ${r2.status}`);
    const f = await r2.json();
    const period = f?.properties?.periods?.[0];
    if (!period) throw new Error('No period');
    return {
      text: period.shortForecast || 'N/A',
      temp: `${period.temperature}\u00B0${period.temperatureUnit}`,
      icon: period.isDaytime ? '\u2600' : '\uD83C\uDF19',
      ts: Date.now(),
    };
  } catch {
    return null;
  }
}

export function useWeather() {
  const [weather, setWeather] = useState({ status: 'idle', text: '', temp: '', icon: '' });
  const abortRef = useRef(null);

  const fetchWeather = useCallback(async (lat, lon, zip3) => {
    if (weatherCache[zip3]) {
      setWeather({ status: 'ok', ...weatherCache[zip3] });
      return;
    }
    setWeather({ status: 'loading', text: '', temp: '', icon: '' });
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const r1 = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, {
        signal: ctrl.signal,
        headers: { Accept: 'application/geo+json' },
      });
      if (!r1.ok) throw new Error('NWS points failed');
      const p = await r1.json();
      const fUrl = p?.properties?.forecast;
      const hUrl = p?.properties?.forecastHourly;
      if (!fUrl) throw new Error('No forecast URL');

      // Fetch regular forecast and hourly forecast in parallel
      const [r2, r3] = await Promise.all([
        fetch(fUrl, { signal: ctrl.signal, headers: { Accept: 'application/geo+json' } }),
        hUrl ? fetch(hUrl, { signal: ctrl.signal, headers: { Accept: 'application/geo+json' } }).catch(() => null) : null,
      ]);

      if (!r2.ok) throw new Error('NWS forecast failed');
      const f = await r2.json();
      const periods = f?.properties?.periods;
      if (!periods || periods.length === 0) throw new Error('No period data');
      const current = periods[0];

      // Parse hourly forecast — next 12 hours
      let hourly = [];
      if (r3 && r3.ok) {
        const h = await r3.json();
        const hPeriods = h?.properties?.periods || [];
        hourly = hPeriods.slice(0, 12).map(hp => ({
          time: hp.startTime,
          temp: hp.temperature,
          unit: hp.temperatureUnit,
          text: hp.shortForecast || '',
          isDaytime: hp.isDaytime,
        }));
      }

      const result = {
        text: current.shortForecast || 'N/A',
        temp: `${current.temperature}\u00B0${current.temperatureUnit}`,
        icon: current.isDaytime ? '\u2600' : '\uD83C\uDF19',
        hourly,
      };
      weatherCache[zip3] = result;
      setWeather({ status: 'ok', ...result });
    } catch (e) {
      if (e.name !== 'AbortError') {
        setWeather({ status: 'error', text: 'Unavailable', temp: '--', icon: '' });
      }
    }
  }, []);

  const resetWeather = useCallback(() => {
    setWeather({ status: 'idle', text: '', temp: '', icon: '' });
  }, []);

  return { weather, fetchWeather, resetWeather };
}

// Module-level export for cache checking
export { weatherCache };
