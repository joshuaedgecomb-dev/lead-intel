import carriers from '../data/carriers.json';

export default function CompetitorIntel({ carrier, metro }) {
  const config = carriers[carrier];
  if (!config) return null;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Likely Carrier
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: config.color, flexShrink: 0,
        }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
          {config.name}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5, marginBottom: 10 }}>
        Dominant carrier in the {metro} area
      </div>
      <div style={{
        padding: '8px 10px', background: '#1c2128', borderRadius: 6,
        fontSize: 11, color: '#79c0ff', lineHeight: 1.4,
        borderLeft: `3px solid ${config.color}`,
      }}>
        <span style={{ fontWeight: 600, color: '#e6edf3' }}>Angle:</span> {config.angle}
      </div>
      {carrier === 'VZ' && (
        <div style={{
          marginTop: 8, padding: '6px 10px', background: '#1a2332',
          borderRadius: 6, fontSize: 10, color: '#58a6ff', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center',
        }}>
          SAME NETWORK OBJECTION KILLER
        </div>
      )}
    </div>
  );
}
