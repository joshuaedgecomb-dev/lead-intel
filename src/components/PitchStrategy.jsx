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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          fontSize: 10, color: '#e6edf3', padding: '3px 8px',
          background: 'rgba(255,255,255,0.06)', borderRadius: 4,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          WiFi: {config.internet}
        </div>
        <div style={{
          fontSize: 10, color: '#e6edf3', padding: '3px 8px',
          background: 'rgba(255,255,255,0.06)', borderRadius: 4,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          Mobile: {config.mobile}
        </div>
        {config.promo && (
          <div style={{
            fontSize: 10, color: '#ffa657', padding: '3px 8px',
            background: 'rgba(255,165,87,0.08)', borderRadius: 4,
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            Promo: {config.promo}
          </div>
        )}
      </div>
      <div style={{
        marginTop: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
        borderRadius: 4, fontSize: 9, color: '#8b949e', lineHeight: 1.3,
      }}>
        Compliance: Offer broadband labels (xfinity.com/labels) before plan details
      </div>
    </div>
  );
}
