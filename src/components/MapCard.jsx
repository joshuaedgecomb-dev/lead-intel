import mapPaths from '../data/map-paths.json';

export default function MapCard({ lat, lon }) {
  const dot = {
    x: 75 + ((lon + 125) / 58) * 370,
    y: 70 + ((49 - lat) / 25) * 210,
  };

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 10,
      border: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="60 55 400 235" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <radialGradient id="dotGlow">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={mapPaths.us} fill="#1a2332" stroke="#30363d" strokeWidth="1" />
        <path d={mapPaths.mi} fill="#1a2332" stroke="#30363d" strokeWidth="1" />
        <circle cx={dot.x} cy={dot.y} r="30" fill="url(#dotGlow)" />
        <circle cx={dot.x} cy={dot.y} r="18" fill="none" stroke="#58a6ff" strokeWidth="1.5" opacity="0">
          <animate attributeName="r" from="8" to="22" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx={dot.x} cy={dot.y} fill="#58a6ff" r="5">
          <animate attributeName="r" values="5;9;5" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
