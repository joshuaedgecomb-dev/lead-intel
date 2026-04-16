import { useState, useEffect, useRef } from 'react';
import { lookupZip } from './utils/lookupZip.js';
import { useWeather } from './hooks/useWeather.js';
import MapCard from './components/MapCard.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import PitchStrategy from './components/PitchStrategy.jsx';
import CompetitorIntel from './components/CompetitorIntel.jsx';
import HouseholdIntel from './components/HouseholdIntel.jsx';
import ConnectivityIntel from './components/ConnectivityIntel.jsx';
import ZipSearch from './components/ZipSearch.jsx';
import connectivity from './data/connectivity.json';

function getInitialZipFromUrl() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const z = (params.get('zip') || '').replace(/\D/g, '');
  return z.length === 5 ? z : '';
}

export default function App() {
  const [zip, setZip] = useState('');
  const [data, setData] = useState(null);
  const initialZip = getInitialZipFromUrl();
  const [localTime, setLocalTime] = useState('');
  const timerRef = useRef(null);
  const { weather, fetchWeather, resetWeather } = useWeather();

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
      padding: '20px 24px',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse-dot { 0%, 100% { r: 5; opacity: 1; } 50% { r: 9; opacity: 0.5; } }
        @keyframes pulse-ring { 0% { r: 8; opacity: 0.6; } 100% { r: 22; opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .intel-card { animation: fade-in 0.25s ease-out; }
        .zip-input {
          background: #161b22; border: 2px solid #30363d; color: #e6edf3;
          font-family: 'IBM Plex Sans', sans-serif; font-size: 18px; font-weight: 500;
          padding: 10px 14px; width: 280px; border-radius: 8px; outline: none;
          transition: border-color 0.2s;
        }
        .zip-input:focus { border-color: #58a6ff; }
        .zip-input::placeholder { color: #484f58; font-size: 16px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8b949e', marginBottom: 4 }}>Lead Intel</div>
          <ZipSearch onSelect={setZip} initialZip={initialZip} />
        </div>
        {data && !data.partial && (
          <div className="intel-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: '#fff' }}>
                {data.city}{data.state ? `, ${data.state}` : ''}
              </div>
              <div style={{ fontSize: 16, color: '#8b949e', marginTop: 3 }}>
                {data.metro} Metro{data.approx ? ' (approx)' : ''}
              </div>
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 35, fontWeight: 600,
              color: '#58a6ff', letterSpacing: 1,
            }}>
              {localTime}
            </div>
          </div>
        )}
        {!data && zip.length >= 5 && (
          <div style={{ color: '#f85149', fontSize: 16, fontWeight: 500 }}>
            Zip not found in lookup table
          </div>
        )}
      </div>

      {/* Row 1: Map + Weather + Connectivity */}
      {data && !data.partial && data.lat && data.lon && (
        <div className="intel-card" style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <MapCard lat={data.lat} lon={data.lon} />
          <WeatherCard
            weather={weather}
            city={data.city}
            zip3={data.zip3}
            isCached={!!weather.cached}
            tz={data.tz}
          />
          <ConnectivityIntel zip5={data.zip5} />
        </div>
      )}

      {/* Row 2: Competition + Household Intel */}
      {data && !data.partial && (
        <div className="intel-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <CompetitorIntel carrier={data.carrier} metro={data.metro} state={data.state} xfSpeed={connectivity[data.zip5]?.xfDown} />
          <HouseholdIntel data={data} />
        </div>
      )}

      {/* Row 3: Pitch Strategy — full width */}
      {data && !data.partial && (
        <div className="intel-card">
          <PitchStrategy arch={data.arch} arch2={data.arch2} />
        </div>
      )}
    </div>
  );
}
