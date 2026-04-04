import rapport from '../data/rapport.json';

function formatHour(isoTime) {
  const d = new Date(isoTime);
  const h = d.getHours();
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h > 12 ? `${h - 12}p` : `${h}a`;
}

export default function WeatherCard({ weather, city, zip3, isCached }) {
  if (weather.status === 'idle' || weather.status === 'error') return null;

  let rapportLine = '';
  if (weather.status === 'ok') {
    const tempNum = parseInt(weather.temp);
    if (tempNum > 85) rapportLine = rapport.byWeatherTemp.hot;
    else if (tempNum < 40) rapportLine = rapport.byWeatherTemp.cold;
    else rapportLine = rapport.byWeatherTemp.mild;
  }

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

          {/* Hourly Forecast */}
          {weather.hourly && weather.hourly.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#484f58', marginBottom: 6 }}>
                Next 12 Hours
              </div>
              <div style={{
                display: 'flex', gap: 2, overflowX: 'auto',
              }}>
                {weather.hourly.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '4px 5px', borderRadius: 4, minWidth: 36,
                    background: i === 0 ? '#1c2128' : 'transparent',
                  }}>
                    <span style={{
                      fontSize: 9, color: '#8b949e',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {formatHour(h.time)}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: h.isDaytime ? '#e6edf3' : '#8b949e',
                      marginTop: 2,
                    }}>
                      {h.temp}°
                    </span>
                    <span style={{
                      fontSize: 8, color: '#484f58', marginTop: 1,
                      textAlign: 'center', lineHeight: 1.1,
                      maxWidth: 40, overflow: 'hidden',
                      whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {h.text}
                    </span>
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
