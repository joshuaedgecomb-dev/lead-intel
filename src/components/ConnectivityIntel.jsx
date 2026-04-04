import connectivity from '../data/connectivity.json';

export default function ConnectivityIntel({ zip5 }) {
  const data = connectivity[zip5];
  if (!data) return null;

  const { xfDown, xfUp, pctBB, pctNo } = data;

  // Speed tier label
  let speedLabel = '';
  let speedColor = '#8b949e';
  if (xfDown >= 1000) { speedLabel = 'Gig+'; speedColor = '#a855f7'; }
  else if (xfDown >= 500) { speedLabel = 'Fast'; speedColor = '#3b82f6'; }
  else if (xfDown >= 200) { speedLabel = 'Standard'; speedColor = '#22c55e'; }
  else { speedLabel = 'Basic'; speedColor = '#f59e0b'; }

  // Insights
  const insights = [];

  if (pctNo != null && pctNo >= 10) {
    insights.push({
      color: '#22c55e',
      label: 'OPPORTUNITY',
      text: `${pctNo}% of households have NO internet — potential new subscribers in this ZIP`,
    });
  }

  if (pctBB != null && pctBB < 75) {
    insights.push({
      color: '#ffa657',
      label: 'UNDERSERVED',
      text: `Only ${pctBB}% have broadband — many may be on mobile-only or DSL. Speed upgrade opportunity.`,
    });
  } else if (pctBB != null && pctBB >= 90) {
    insights.push({
      color: '#8b949e',
      label: 'SATURATED',
      text: `${pctBB}% already have broadband — focus on speed upgrades and cross-sell, not new subscribers.`,
    });
  }

  if (xfDown && xfDown >= 1000) {
    const gigLabel = (xfDown / 1000).toFixed(1) + ' Gig';
    insights.push({
      color: '#a855f7',
      label: 'GIG TERRITORY',
      text: `Xfinity offers up to ${gigLabel} here — lead with speed, pitch Xfinity Pro ($15/mo) for gaming households.`,
    });
  }

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Connectivity Intel
      </div>

      {/* Xfinity speed badge */}
      {xfDown && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            background: speedColor, borderRadius: 6, padding: '4px 10px',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            {speedLabel}
          </div>
          <div style={{ fontSize: 15, color: '#e6edf3' }}>
            <span style={{ fontWeight: 700 }}>Xfinity offers up to {xfDown >= 1000 ? (xfDown / 1000).toFixed(1) + ' Gig' : xfDown + ' Mbps'}</span>
            <span style={{ color: '#484f58' }}> / {xfUp} Mbps up</span>
          </div>
        </div>
      )}

      {/* Internet access stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {pctBB != null && (
          <div style={{
            flex: 1, background: '#1c2128', borderRadius: 6, padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 23, fontWeight: 700, color: pctBB >= 85 ? '#7ee787' : pctBB >= 70 ? '#ffa657' : '#f85149' }}>
              {pctBB}%
            </div>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              have broadband
            </div>
          </div>
        )}
        {pctNo != null && (
          <div style={{
            flex: 1, background: '#1c2128', borderRadius: 6, padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 23, fontWeight: 700, color: pctNo >= 15 ? '#f85149' : pctNo >= 5 ? '#ffa657' : '#7ee787' }}>
              {pctNo}%
            </div>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              no internet
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              padding: '5px 8px', background: '#1a2332', borderRadius: 4,
              borderLeft: `3px solid ${ins.color}`,
              fontSize: 13, lineHeight: 1.4,
            }}>
              <span style={{ color: ins.color, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {ins.label}
              </span>
              <div style={{ color: '#c9d1d9', marginTop: 2 }}>{ins.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
