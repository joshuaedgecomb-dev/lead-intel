import rapport from '../data/rapport.json';

export default function WeatherCard({ weather, city, zip3, isCached }) {
  // Per spec: render nothing when offline, failed, or idle — no error states
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

          {/* Forecast */}
          {weather.forecast && weather.forecast.length > 1 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#484f58', marginBottom: 6 }}>
                Forecast
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {weather.forecast.slice(1).map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, lineHeight: 1.3,
                  }}>
                    <span style={{
                      color: p.isDaytime ? '#ffa657' : '#8b949e',
                      fontWeight: 600, minWidth: 80, flexShrink: 0,
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    }}>
                      {p.name}
                    </span>
                    <span style={{ color: '#e6edf3', fontWeight: 600, minWidth: 36 }}>
                      {p.temp}
                    </span>
                    <span style={{ color: '#8b949e', fontSize: 10 }}>
                      {p.text}
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
