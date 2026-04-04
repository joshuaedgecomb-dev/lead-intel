import rapport from '../data/rapport.json';

function formatHour(isoTime, tz) {
  const d = new Date(isoTime);
  try {
    const h = parseInt(d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h > 12 ? `${h - 12}p` : `${h}a`;
  } catch {
    const h = d.getHours();
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h > 12 ? `${h - 12}p` : `${h}a`;
  }
}

function getTempColor(temp) {
  if (temp <= 32) return '#6ea6ff';
  if (temp <= 50) return '#58a6ff';
  if (temp <= 60) return '#56d4dd';
  if (temp <= 70) return '#7ee787';
  if (temp <= 80) return '#f0c040';
  if (temp <= 90) return '#e87040';
  return '#e05050';
}

// --- SVG Weather Icons ---
const Sun = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="5" fill="#f0a030" />
    {[0,45,90,135,180,225,270,315].map(a => (
      <line key={a} x1="12" y1="3" x2="12" y2="1" stroke="#f0a030" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${a} 12 12)`} />
    ))}
  </svg>
);

const Moon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#c8b060" />
  </svg>
);

const Cloud = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 19a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.5 10h.5a4 4 0 0 1 0 8H6z" fill="#9ca3af" />
  </svg>
);

const SunCloud = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 28 24" fill="none">
    <circle cx="10" cy="8" r="4" fill="#f0a030" />
    {[0,60,120,180,240,300].map(a => (
      <line key={a} x1="10" y1="2.5" x2="10" y2="1" stroke="#f0a030" strokeWidth="1.5" strokeLinecap="round"
        transform={`rotate(${a} 10 8)`} />
    ))}
    <path d="M8 19a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 18.5 10h.5a4 4 0 0 1 0 8H8z" fill="#c0c8d0" />
  </svg>
);

const MoonCloud = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 28 24" fill="none">
    <path d="M16 6.79A5 5 0 1 1 9.21 1 4 4 0 0 0 16 6.79z" fill="#c8b060" />
    <path d="M8 19a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 18.5 10h.5a4 4 0 0 1 0 8H8z" fill="#8090a0" />
  </svg>
);

const Rain = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 16a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.5 7h.5a4 4 0 0 1 0 8H6z" fill="#8090a0" />
    <line x1="8" y1="18" x2="7" y2="21" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="18" x2="11" y2="21" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="18" x2="15" y2="21" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Snow = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 16a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.5 7h.5a4 4 0 0 1 0 8H6z" fill="#8090a0" />
    <circle cx="8" cy="19" r="1" fill="#c8d8e8" />
    <circle cx="12" cy="20" r="1" fill="#c8d8e8" />
    <circle cx="16" cy="19" r="1" fill="#c8d8e8" />
  </svg>
);

const Storm = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.5 5h.5a4 4 0 0 1 0 8H6z" fill="#6b7280" />
    <path d="M13 14l-2 4h3l-2 5" stroke="#f0c040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Fog = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <line x1="4" y1="10" x2="20" y2="10" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="14" x2="18" y2="14" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" />
    <line x1="4" y1="18" x2="20" y2="18" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function getWeatherIcon(text, isDaytime, size = 20) {
  const t = (text || '').toLowerCase();
  if (t.includes('thunder') || t.includes('storm')) return <Storm size={size} />;
  if (t.includes('snow') || t.includes('sleet') || t.includes('ice') || t.includes('flurr')) return <Snow size={size} />;
  if (t.includes('rain') || t.includes('shower') || t.includes('drizzle')) return <Rain size={size} />;
  if (t.includes('fog') || t.includes('haze') || t.includes('mist')) return <Fog size={size} />;
  if (t.includes('cloudy') || t.includes('overcast')) {
    if (t.includes('partly') || t.includes('mostly sunny') || t.includes('mostly clear')) {
      return isDaytime ? <SunCloud size={size} /> : <MoonCloud size={size} />;
    }
    if (t.includes('mostly cloudy')) {
      return isDaytime ? <SunCloud size={size} /> : <MoonCloud size={size} />;
    }
    return <Cloud size={size} />;
  }
  if (t.includes('sunny') || t.includes('clear')) {
    return isDaytime ? <Sun size={size} /> : <Moon size={size} />;
  }
  // Default
  return isDaytime ? <SunCloud size={size} /> : <MoonCloud size={size} />;
}

export default function WeatherCard({ weather, city, zip3, isCached, tz }) {
  if (weather.status === 'idle' || weather.status === 'error') return null;

  let rapportLine = '';
  if (weather.status === 'ok') {
    const tempNum = parseInt(weather.temp);
    if (tempNum > 85) rapportLine = rapport.byWeatherTemp.hot;
    else if (tempNum < 40) rapportLine = rapport.byWeatherTemp.cold;
    else rapportLine = rapport.byWeatherTemp.mild;
  }

  const hourly = weather.hourly || [];
  const temps = hourly.map(h => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Weather
        {isCached && (
          <span style={{ marginLeft: 6, fontSize: 9, color: '#7ee787', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
            (cached)
          </span>
        )}
      </div>
      {weather.status === 'loading' && (
        <div style={{ color: '#8b949e', fontSize: 13 }}>Loading...</div>
      )}
      {weather.status === 'ok' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {getWeatherIcon(weather.text, !weather.icon.includes('\uD83C\uDF19'), 36)}
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {weather.temp}
            </div>
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              {weather.text}
            </div>
          </div>

          <div style={{
            marginTop: 10, padding: '6px 10px', background: '#1c2128', borderRadius: 6,
            fontSize: 11, color: '#7ee787', fontStyle: 'italic', lineHeight: 1.4,
          }}>
            Rapport: "How's the weather out there{city ? ` in ${city}` : ''}? {rapportLine}"
          </div>

          {/* Hourly Forecast */}
          {hourly.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#484f58', marginBottom: 6 }}>
                Upcoming
              </div>

              {/* Icons row */}
              <div style={{ display: 'flex', gap: 2 }}>
                {hourly.map((h, i) => (
                  <div key={`icon-${i}`} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    {getWeatherIcon(h.text, h.isDaytime, 18)}
                  </div>
                ))}
              </div>

              {/* Temperature bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginTop: 4 }}>
                {hourly.map((h, i) => {
                  const pct = ((h.temp - minTemp) / tempRange) * 0.75 + 0.25;
                  const color = getTempColor(h.temp);
                  return (
                    <div key={i} style={{
                      flex: 1,
                      height: `${pct * 100}%`,
                      background: color,
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.8,
                    }} />
                  );
                })}
              </div>

              {/* Labels below bars */}
              <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                {hourly.map((h, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: getTempColor(h.temp) }}>
                      {h.temp}°
                    </div>
                    <div style={{
                      fontSize: 8, color: '#8b949e',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {formatHour(h.time, tz)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
