import archetypes from '../data/archetypes.json';

function RecCard({ rec, color, num }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 6,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color, marginBottom: 4,
      }}>
        Rec {num}: {rec.title}
      </div>
      <div style={{
        fontSize: 11, color: '#e6edf3', lineHeight: 1.4, marginBottom: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4,
      }}>
        {rec.products}
      </div>
      <div style={{
        fontSize: 11, color: '#7ee787', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 4,
      }}>
        {rec.hook}
      </div>
      <div style={{ fontSize: 10, color: '#484f58' }}>
        {rec.addons}
      </div>
    </div>
  );
}

export default function PitchStrategy({ arch, arch2 }) {
  const primary = archetypes[arch];
  const secondary = archetypes[arch2];
  if (!primary) return null;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      {/* Archetype header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          background: primary.bg, border: `2px solid ${primary.color}`,
          borderRadius: 8, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>{primary.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: primary.color }}>
            {primary.label}
          </span>
        </div>
        {secondary && secondary !== primary && (
          <div style={{
            background: secondary.bg, border: `1px solid ${secondary.color}`,
            borderRadius: 8, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7,
          }}>
            <span style={{ fontSize: 12 }}>{secondary.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: secondary.color }}>
              {secondary.label}
            </span>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.4, marginBottom: 12 }}>
        {primary.desc}
      </div>

      {/* Two recommendations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <RecCard rec={primary.rec1} color={primary.color} num={1} />
        <RecCard rec={primary.rec2} color={primary.color} num={2} />
      </div>

      {/* Secondary archetype hint */}
      {secondary && arch2 !== arch && (
        <div style={{
          marginTop: 10, padding: '6px 10px', background: secondary.bg,
          borderRadius: 6, border: `1px solid ${secondary.color}`,
          fontSize: 10, color: secondary.color, lineHeight: 1.4,
        }}>
          <span style={{ fontWeight: 600 }}>{secondary.icon} Also consider {secondary.label}:</span>{' '}
          <span style={{ color: '#8b949e' }}>{secondary.rec1.title}</span>
        </div>
      )}

      {/* Compliance */}
      <div style={{
        marginTop: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
        borderRadius: 4, fontSize: 9, color: '#8b949e', lineHeight: 1.3,
      }}>
        Compliance: Offer broadband labels (xfinity.com/labels) before plan details
      </div>
    </div>
  );
}
