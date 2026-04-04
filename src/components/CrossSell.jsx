export default function CrossSell({ tier }) {
  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Cross-sell Priority
      </div>
      <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.6 }}>
        {tier === 3 ? (
          <>
            <div style={{ color: '#d2a8ff', fontWeight: 600, marginBottom: 4 }}>FULL BUNDLE — PREMIUM + STREAMSAVER + HOME</div>
            <div style={{ marginBottom: 6 }}>Premium area. Lead with Premium Unlimited ($50/line, 4K, 100GB, Global Pass). Push StreamSaver at $30/mo for Netflix+Disney++Hulu+HBO Max+Peacock — saves 25%+.</div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>
              Smart Home $10/mo for camera monitoring. iPhone 17e on us with trade-in.
            </div>
          </>
        ) : tier === 2 ? (
          <>
            <div style={{ color: '#d2a8ff', fontWeight: 600, marginBottom: 4 }}>STREAMSAVER FOCUS</div>
            <div style={{ marginBottom: 6 }}>"Instead of paying for Netflix, Disney+, and Hulu separately — bundle them through Xfinity for $15/mo and save over 25%." 1G+ includes Disney+/Hulu/Peacock free for 36 months.</div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>
              StreamSaver bundles: $15 (3 apps) · $22 (4 apps) · $30 (5 apps). Mention Smart Home if they own.
            </div>
          </>
        ) : (
          <>
            <div style={{ color: '#7ee787', fontWeight: 600, marginBottom: 4 }}>MOBILE FIRST — LEAD WITH FREE LINE</div>
            <div style={{ marginBottom: 6 }}>Focus on the free Unlimited mobile line for 12 months ($480 value). "You mentioned you're paying [provider] $___ for your lines — with Xfinity Mobile you could start at $40/line."</div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>
              No contract, no ETF. NOW Mobile $25/line if no credit check needed. 300M Internet at $45/mo locks for 5 years.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
