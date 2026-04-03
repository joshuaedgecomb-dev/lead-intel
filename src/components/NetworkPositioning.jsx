export default function NetworkPositioning({ carrier }) {
  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Network Positioning
      </div>
      <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.6 }}>
        {carrier === 'VZ' ? (
          <>
            <div style={{ color: '#7ee787', fontWeight: 600, marginBottom: 4 }}>STRONGEST POSITION</div>
            <div>Customer is already on Verizon. XM uses the same network. Zero coverage change, just savings.</div>
          </>
        ) : carrier === 'ATT' ? (
          <>
            <div style={{ color: '#ffa657', fontWeight: 600, marginBottom: 4 }}>UPGRADE OPPORTUNITY</div>
            <div>Customer likely on AT&T. Position Verizon network as more reliable with better rural reach. Plus millions of Xfinity WiFi hotspots.</div>
          </>
        ) : (
          <>
            <div style={{ color: '#ffa657', fontWeight: 600, marginBottom: 4 }}>COMPETITIVE SWITCH</div>
            <div>Customer likely on T-Mobile. Emphasize Verizon's broader coverage and network reliability. WiFi offloading with Xfinity hotspots is a bonus.</div>
          </>
        )}
      </div>
    </div>
  );
}
