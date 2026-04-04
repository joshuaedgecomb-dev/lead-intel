export default function NetworkPositioning({ carrier }) {
  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Mobile Pitch
      </div>
      <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.6 }}>
        <div style={{ color: '#7ee787', fontWeight: 600, marginBottom: 4 }}>FREE LINE 12 MONTHS ($480 VALUE)</div>
        <div style={{ marginBottom: 8 }}>"With your Internet plan, you get an Xfinity Mobile line included at no extra cost for 12 months."</div>

        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6 }}>
          <strong style={{ color: '#e6edf3' }}>Plans:</strong> Unlimited $40/line · Premium Unlimited $50/line
        </div>

        {carrier === 'VZ' ? (
          <div style={{
            padding: '6px 10px', background: '#1a2332', borderRadius: 6,
            fontSize: 11, lineHeight: 1.4, marginBottom: 6,
          }}>
            <span style={{ color: '#ffa657', fontWeight: 600 }}>VZ AREA — </span>
            <span style={{ color: '#c9d1d9' }}>Lead with savings + free line. If they say they're on Verizon: </span>
            <span style={{ color: '#58a6ff', fontStyle: 'italic' }}>"Same network, fraction of the cost."</span>
          </div>
        ) : carrier === 'ATT' ? (
          <div style={{
            padding: '6px 10px', background: '#1a2332', borderRadius: 6,
            fontSize: 11, lineHeight: 1.4, marginBottom: 6,
          }}>
            <span style={{ color: '#ffa657', fontWeight: 600 }}>ATT AREA — </span>
            <span style={{ color: '#c9d1d9' }}>Position: consistent speeds, never deprioritized. Save up to $1,500. WiFi hotspot access they don't get with AT&T.</span>
          </div>
        ) : (
          <div style={{
            padding: '6px 10px', background: '#1a2332', borderRadius: 6,
            fontSize: 11, lineHeight: 1.4, marginBottom: 6,
          }}>
            <span style={{ color: '#ffa657', fontWeight: 600 }}>TMO AREA — </span>
            <span style={{ color: '#c9d1d9' }}>Position: 99.9% reliable, not deprioritized like 5G home internet. WiFi hotspot access they don't get with T-Mobile.</span>
          </div>
        )}

        <div style={{ fontSize: 10, color: '#484f58', marginTop: 4 }}>
          Device deals: iPhone 17e on us w/ trade-in (Premium) · Up to $1,100 off Samsung · $25 activation waived thru 4/21
        </div>
      </div>
    </div>
  );
}
