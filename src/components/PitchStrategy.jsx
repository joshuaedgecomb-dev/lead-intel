import tiers from '../data/tiers.json';

export default function PitchStrategy({ tier }) {
  const config = tiers[String(tier)];
  if (!config) return null;

  return (
    <div style={{
      background: config.bg, borderRadius: 10, padding: 14,
      border: `2px solid ${config.color}`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
        color: config.color, marginBottom: 6,
      }}>
        Pitch Strategy
      </div>
      <div style={{
        fontSize: 16, fontWeight: 700, color: config.color,
        padding: '4px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: 6,
        display: 'inline-block', marginBottom: 8,
      }}>
        {config.label}
      </div>
      <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.5, marginBottom: 8 }}>
        {config.hook}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#e6edf3',
        padding: '4px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: 4,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        Rec: {config.rec}
      </div>
    </div>
  );
}
