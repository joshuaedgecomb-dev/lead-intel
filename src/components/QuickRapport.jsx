import rapport from '../data/rapport.json';

export default function QuickRapport({ city, state, metro }) {
  const defaultLines = rapport.default.map(line =>
    line.replace('{city}', city || 'your area').replace('{metro}', metro || 'your')
  );

  const stateLines = rapport.byState[state] || [];

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Quick Rapport Lines
      </div>
      <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.6 }}>
        {defaultLines.map((line, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            "{line}"
          </div>
        ))}
        {stateLines.map((line, i) => (
          <div key={`state-${i}`}>"{line}"</div>
        ))}
      </div>
    </div>
  );
}
