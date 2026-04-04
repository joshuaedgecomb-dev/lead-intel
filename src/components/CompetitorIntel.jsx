import carriers from '../data/carriers.json';
import competition from '../data/competition.json';

const ISP_COLORS = ['#6138f5', '#e67e22', '#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#f39c12'];
const COMCAST_COLOR = '#6138f5';

function PieChart({ providers, size = 100 }) {
  if (!providers || providers.length === 0) return null;

  const r = size / 2;
  const cx = r;
  const cy = r;
  const innerR = r * 0.55; // donut hole

  let startAngle = -90; // start at top
  const slices = [];
  const labels = [];

  providers.forEach((p, i) => {
    const angle = (p.pct / 100) * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
    const ix1 = cx + innerR * Math.cos((endAngle * Math.PI) / 180);
    const iy1 = cy + innerR * Math.sin((endAngle * Math.PI) / 180);
    const ix2 = cx + innerR * Math.cos((startAngle * Math.PI) / 180);
    const iy2 = cy + innerR * Math.sin((startAngle * Math.PI) / 180);

    const color = p.isXf ? COMCAST_COLOR : ISP_COLORS[(i + 1) % ISP_COLORS.length];

    slices.push(
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`}
        fill={color}
        opacity={p.isXf ? 1 : 0.7}
        stroke="#161b22"
        strokeWidth="1"
      />
    );

    startAngle = endAngle;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e6edf3" fontSize="11" fontWeight="700">
        {providers.find(p => p.isXf)?.pct || 0}%
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize="7">
        Xfinity
      </text>
    </svg>
  );
}

export default function CompetitorIntel({ carrier, metro, state }) {
  const config = carriers[carrier];
  if (!config) return null;

  const providers = competition[state] || [];

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Market Landscape
      </div>

      {/* Pie chart + provider list side by side */}
      {providers.length > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <PieChart providers={providers} size={80} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {providers.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: p.isXf ? COMCAST_COLOR : ISP_COLORS[(i + 1) % ISP_COLORS.length],
                  opacity: p.isXf ? 1 : 0.7,
                }} />
                <span style={{ color: p.isXf ? '#e6edf3' : '#8b949e', fontWeight: p.isXf ? 700 : 400, flex: 1 }}>
                  {p.isXf ? 'Xfinity' : p.name}
                </span>
                <span style={{
                  color: p.isXf ? COMCAST_COLOR : '#484f58',
                  fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                }}>
                  {p.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile carrier intel */}
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 4, marginTop: 4 }}>
        Likely Mobile: {config.name}
      </div>
      <div style={{
        padding: '6px 10px', background: '#1c2128', borderRadius: 6,
        fontSize: 11, color: '#79c0ff', lineHeight: 1.4,
        borderLeft: `3px solid ${config.color}`,
      }}>
        <span style={{ fontWeight: 600, color: '#e6edf3' }}>Angle:</span> {config.angle}
      </div>
      {config.compliance && (
        <div style={{
          marginTop: 6, padding: '5px 10px', background: '#2a1a1a',
          borderRadius: 6, fontSize: 10, color: '#f85149', fontWeight: 600,
          letterSpacing: 0.3, lineHeight: 1.4,
          borderLeft: '3px solid #f85149',
        }}>
          ⚠ {config.compliance}
        </div>
      )}
      {config.ifAsked && (
        <div style={{
          marginTop: 4, padding: '5px 10px', background: '#1a2332',
          borderRadius: 6, fontSize: 10, color: '#58a6ff', lineHeight: 1.4,
          fontStyle: 'italic',
        }}>
          {config.ifAsked}
        </div>
      )}
    </div>
  );
}
