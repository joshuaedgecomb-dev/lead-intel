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

function getTempColor(temp, min, max) {
  // Blue (cold) → Cyan → Green → Yellow → Orange → Red (hot)
  const range = max - min || 1;
  const t = (temp - min) / range; // 0 to 1
  if (t < 0.25) return `rgb(${Math.round(80 + t * 4 * 40)}, ${Math.round(150 + t * 4 * 105)}, 255)`;
  if (t < 0.5) return `rgb(${Math.round(120 + (t - 0.25) * 4 * 135)}, ${Math.round(220 + (t - 0.25) * 4 * 35)}, ${Math.round(255 - (t - 0.25) * 4 * 130)})`;
  if (t < 0.75) return `rgb(255, ${Math.round(255 - (t - 0.5) * 4 * 80)}, ${Math.round(125 - (t - 0.5) * 4 * 125)})`;
  return `rgb(255, ${Math.round(175 - (t - 0.75) * 4 * 105)}, ${Math.round((1 - t) * 4 * 30)})`;
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

  // Compute sparkline data
  const hourly = weather.hourly || [];
  const temps = hourly.map(h => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;
  const chartH = 40;
  const barW = 100 / hourly.length;

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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {weather.temp}
            </div>
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              {weather.icon} {weather.text}
            </div>
          </div>

          <div style={{
            marginTop: 10, padding: '6px 10px', background: '#1c2128', borderRadius: 6,
            fontSize: 11, color: '#7ee787', fontStyle: 'italic', lineHeight: 1.4,
          }}>
            Rapport: "How's the weather out there{city ? ` in ${city}` : ''}? {rapportLine}"
          </div>

          {/* Hourly Forecast with temperature bars */}
          {hourly.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#484f58', marginBottom: 6 }}>
                Upcoming
              </div>

              {/* Temperature bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: chartH }}>
                {hourly.map((h, i) => {
                  const pct = ((h.temp - minTemp) / tempRange) * 0.75 + 0.25; // min 25% height
                  const color = getTempColor(h.temp, minTemp, maxTemp);
                  return (
                    <div key={i} style={{
                      flex: 1,
                      height: `${pct * 100}%`,
                      background: color,
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.8,
                      transition: 'height 0.3s ease',
                    }} />
                  );
                })}
              </div>

              {/* Labels below bars */}
              <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                {hourly.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, textAlign: 'center', minWidth: 0,
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: getTempColor(h.temp, minTemp, maxTemp),
                    }}>
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
