import carriers from '../data/carriers.json';
import competition from '../data/competition.json';

const ISP_COLORS = ['#6138f5', '#e67e22', '#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#f39c12'];
const COMCAST_COLOR = '#6138f5';

// National mobile market share (FCC 2024 Communications Marketplace Report)
const MOBILE_SHARE = {
  VZ: { name: 'Verizon', pct: 34, color: '#e00' },
  TMO: { name: 'T-Mobile', pct: 35, color: '#e20074' },
  ATT: { name: 'AT&T', pct: 27, color: '#00a8e0' },
  OTH: { name: 'Other', pct: 4, color: '#484f58' },
};

function DonutChart({ slices, centerLabel, centerSub, size = 80 }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const innerR = r * 0.55;

  let startAngle = -90;
  const paths = [];

  slices.forEach((s, i) => {
    const angle = (s.pct / 100) * 360;
    if (angle <= 0) return;
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

    paths.push(
      <path key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`}
        fill={s.color} opacity={s.highlight ? 1 : 0.6} stroke="#161b22" strokeWidth="1"
      />
    );
    startAngle = endAngle;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <text x={cx} y={cy - 3} textAnchor="middle" fill="#e6edf3" fontSize="11" fontWeight="700">{centerLabel}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize="6.5">{centerSub}</text>
    </svg>
  );
}

function Legend({ slices }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {slices.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: s.color, opacity: s.highlight ? 1 : 0.6 }} />
          <span style={{ color: s.highlight ? '#e6edf3' : '#8b949e', fontWeight: s.highlight ? 700 : 400, flex: 1 }}>
            {s.name}
          </span>
          <span style={{ color: s.highlight ? s.color : '#484f58', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
            {s.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CompetitorIntel({ carrier, metro, state }) {
  const config = carriers[carrier];
  if (!config) return null;

  // Broadband ISP pie data
  const ispProviders = (competition[state] || []).map((p, i) => ({
    name: p.isXf ? 'Xfinity' : p.name,
    pct: p.pct,
    color: p.isXf ? COMCAST_COLOR : ISP_COLORS[(i + 1) % ISP_COLORS.length],
    highlight: p.isXf,
  }));
  const xfPct = ispProviders.find(p => p.highlight)?.pct || 0;

  // Mobile carrier pie data — highlight the dominant one for this area
  const mobileSlices = ['TMO', 'VZ', 'ATT', 'OTH'].map(k => ({
    name: MOBILE_SHARE[k].name,
    pct: MOBILE_SHARE[k].pct,
    color: MOBILE_SHARE[k].color,
    highlight: k === carrier,
  }));
  const dominantMobilePct = MOBILE_SHARE[carrier]?.pct || 0;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 10 }}>
        Market Landscape
      </div>

      {/* Two pie charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Broadband ISPs */}
        {ispProviders.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#484f58', marginBottom: 6 }}>
              Broadband ISPs
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <DonutChart slices={ispProviders} centerLabel={`${xfPct}%`} centerSub="Xfinity" size={70} />
              <Legend slices={ispProviders} />
            </div>
          </div>
        )}

        {/* Mobile Carriers */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#484f58', marginBottom: 6 }}>
            Mobile Carriers
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DonutChart slices={mobileSlices} centerLabel={`${dominantMobilePct}%`} centerSub={config.name} size={70} />
            <Legend slices={mobileSlices} />
          </div>
        </div>
      </div>

      {/* Sales angle */}
      <div style={{
        padding: '6px 10px', background: '#1c2128', borderRadius: 6,
        fontSize: 11, color: '#79c0ff', lineHeight: 1.4,
        borderLeft: `3px solid ${config.color}`,
      }}>
        <span style={{ fontWeight: 600, color: '#e6edf3' }}>Mobile angle:</span> {config.angle}
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
