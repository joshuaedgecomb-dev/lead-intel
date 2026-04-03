import { useState, useEffect, useRef } from 'react';
import { lookupZip } from './utils/lookupZip.js';
import { useWeather, weatherCache } from './hooks/useWeather.js';
import zip5Data from './data/zip5.json';
import MapCard from './components/MapCard.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import PitchStrategy from './components/PitchStrategy.jsx';
import CompetitorIntel from './components/CompetitorIntel.jsx';
import QuickRapport from './components/QuickRapport.jsx';
import NetworkPositioning from './components/NetworkPositioning.jsx';
import CrossSell from './components/CrossSell.jsx';
import PreloadPanel from './components/PreloadPanel.jsx';

export default function App() {
  const [zip, setZip] = useState('');
  const [data, setData] = useState(null);
  const [localTime, setLocalTime] = useState('');
  const timerRef = useRef(null);
  const { weather, fetchWeather, resetWeather } = useWeather();

  // ZIP lookup effect
  useEffect(() => {
    if (zip.length >= 5) {
      const d = lookupZip(zip);
      setData(d);
      if (d && d.lat && d.lon) {
        fetchWeather(d.lat, d.lon, d.zip3);
      }
    } else {
      setData(null);
      resetWeather();
    }
  }, [zip, fetchWeather, resetWeather]);

  // Live clock
  useEffect(() => {
    if (!data?.tz) { setLocalTime(''); return; }
    const tick = () => {
      try {
        const now = new Date();
        setLocalTime(now.toLocaleTimeString('en-US', { timeZone: data.tz, hour: 'numeric', minute: '2-digit', hour12: true }));
      } catch { setLocalTime('--'); }
    };
    tick();
    timerRef.current = setInterval(tick, 15000);
    return () => clearInterval(timerRef.current);
  }, [data?.tz]);

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
      background: '#0d1117',
      color: '#e6edf3',
      minHeight: '100vh',
      padding: '16px',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse-dot { 0%, 100% { r: 5; opacity: 1; } 50% { r: 9; opacity: 0.5; } }
        @keyframes pulse-ring { 0% { r: 8; opacity: 0.6; } 100% { r: 22; opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .intel-card { animation: fade-in 0.25s ease-out; }
        .zip-input {
          background: #161b22; border: 2px solid #30363d; color: #e6edf3;
          font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 600;
          padding: 10px 14px; width: 140px; border-radius: 8px; outline: none;
          letter-spacing: 3px; text-align: center; transition: border-color 0.2s;
        }
        .zip-input:focus { border-color: #58a6ff; }
        .zip-input::placeholder { color: #484f58; letter-spacing: 2px; font-size: 16px; }
        .preload-btn {
          border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px;
          font-weight: 600; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif;
          transition: all 0.2s; letter-spacing: 0.3px;
        }
        .preload-btn:hover { filter: brightness(1.15); }
        .preload-btn:active { transform: scale(0.97); }
      `}</style>

      {/* Pre-load Panel */}
      <PreloadPanel zip5Data={zip5Data} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8b949e', marginBottom: 4 }}>Lead Intel</div>
          <input
            className="zip-input"
            type="text"
            placeholder="ZIP"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        {data && !data.partial && (
          <div className="intel-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: '#fff' }}>
                {data.city}{data.state ? `, ${data.state}` : ''}
              </div>
              <div style={{ fontSize: 13, color: '#8b949e', marginTop: 2 }}>
                {data.metro} Metro{data.approx ? ' (approx)' : ''}
              </div>
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 600,
              color: '#58a6ff', letterSpacing: 1,
            }}>
              {localTime}
            </div>
          </div>
        )}
        {!data && zip.length >= 5 && (
          <div style={{ color: '#f85149', fontSize: 14, fontWeight: 500 }}>
            Zip not found in lookup table
          </div>
        )}
      </div>

      {/* Intel Cards — 4 column grid */}
      {data && !data.partial && data.lat && data.lon && (
        <div className="intel-card" style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr', gap: 12 }}>
          <MapCard lat={data.lat} lon={data.lon} />
          <WeatherCard
            weather={weather}
            city={data.city}
            zip3={data.zip3}
            isCached={!!weatherCache[data.zip3]}
          />
          <PitchStrategy tier={data.tier} />
          <CompetitorIntel carrier={data.carrier} metro={data.metro} />
        </div>
      )}

      {/* Quick Reference — 3 column grid */}
      {data && !data.partial && (
        <div className="intel-card" style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <QuickRapport city={data.city} state={data.state} metro={data.metro} />
          <NetworkPositioning carrier={data.carrier} />
          <CrossSell tier={data.tier} />
        </div>
      )}
    </div>
  );
}
