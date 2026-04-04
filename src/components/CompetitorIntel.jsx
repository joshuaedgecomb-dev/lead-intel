import carriers from '../data/carriers.json';
import competition from '../data/competition.json';

const ISP_COLORS = ['#e67e22', '#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#1abc9c'];
const COMCAST_COLOR = '#6138f5';

const MOBILE_SHARE = {
  VZ: { name: 'Verizon', pct: 34, color: '#e00' },
  TMO: { name: 'T-Mobile', pct: 35, color: '#e20074' },
  ATT: { name: 'AT&T', pct: 27, color: '#00a8e0' },
  OTH: { name: 'Other', pct: 4, color: '#484f58' },
};

function DonutChart({ slices, centerLabel, centerSub, size = 90 }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const innerR = r * 0.52;

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
        fill={s.color} opacity={s.highlight ? 1 : 0.5} stroke="#161b22" strokeWidth="1.5"
      />
    );
    startAngle = endAngle;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e6edf3" fontSize="18" fontWeight="700">{centerLabel}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#8b949e" fontSize="10">{centerSub}</text>
    </svg>
  );
}

function formatSpeed(mbps) {
  if (!mbps) return '';
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)}G`;
  return `${mbps}M`;
}

export default function CompetitorIntel({ carrier, metro, state, xfSpeed }) {
  const config = carriers[carrier];
  if (!config) return null;

  // Broadband ISP data — use ZIP-specific speed for Comcast
  const ispProviders = (competition[state] || []).map((p, i) => ({
    name: p.isXf ? 'Xfinity' : p.name,
    pct: p.pct,
    down: p.isXf && xfSpeed ? xfSpeed : p.down,
    color: p.isXf ? COMCAST_COLOR : ISP_COLORS[i % ISP_COLORS.length],
    highlight: p.isXf,
  }));
  const xfPct = ispProviders.find(p => p.highlight)?.pct || 0;

  // Mobile carrier data
  const mobileSlices = ['TMO', 'VZ', 'ATT', 'OTH'].map(k => ({
    name: MOBILE_SHARE[k].name,
    pct: MOBILE_SHARE[k].pct,
    color: MOBILE_SHARE[k].color,
    highlight: k === carrier,
  }));
  const dominantPct = MOBILE_SHARE[carrier]?.pct || 0;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 18,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 14 }}>
        Competition · {state}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Broadband ISPs */}
        {ispProviders.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#484f58', marginBottom: 8 }}>
              Internet Providers
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <DonutChart slices={ispProviders} centerLabel={`${xfPct}%`} centerSub="Xfinity" size={110} />
            </div>
            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#30363d', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 2px' }}>
              <div style={{ width: 9 }} />
              <span style={{ flex: 1 }}>Provider</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Speed</span>
              <span style={{ minWidth: 30, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>Share</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ispProviders.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '2px' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: p.color, opacity: p.highlight ? 1 : 0.5 }} />
                  <span style={{ color: p.highlight ? '#e6edf3' : '#8b949e', fontWeight: p.highlight ? 700 : 400, flex: 1 }}>
                    {p.name}
                  </span>
                  <span style={{
                    color: p.highlight ? '#7ee787' : '#484f58',
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                  }}>
                    {p.down ? formatSpeed(p.down) : '—'}
                  </span>
                  <span style={{
                    color: p.highlight ? COMCAST_COLOR : '#484f58',
                    fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                    minWidth: 30, textAlign: 'right',
                  }}>
                    {p.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Carriers */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#484f58', marginBottom: 8 }}>
            Mobile Carriers
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <DonutChart slices={mobileSlices} centerLabel={`${dominantPct}%`} centerSub={config.name} size={110} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {mobileSlices.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '2px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: s.color, opacity: s.highlight ? 1 : 0.5 }} />
                <span style={{ color: s.highlight ? '#e6edf3' : '#8b949e', fontWeight: s.highlight ? 700 : 400, flex: 1 }}>
                  {s.name}
                </span>
                <span style={{
                  color: s.highlight ? s.color : '#484f58',
                  fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                  minWidth: 30, textAlign: 'right',
                }}>
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
          {config.compliance && (
            <div style={{
              marginTop: 8, padding: '6px 10px', background: '#2a1a1a',
              borderRadius: 4, fontSize: 13, color: '#f85149', fontWeight: 600, lineHeight: 1.4,
            }}>
              ⚠ {config.compliance}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
