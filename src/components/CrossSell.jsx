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
            <div style={{ color: '#d2a8ff', fontWeight: 600, marginBottom: 4 }}>STREAMSAVER + HOME</div>
            <div>Premium area. Push full bundle: Premium Unlimited + StreamSaver + Smart Home. Maximize ARPU. Lead with convenience and exclusivity.</div>
          </>
        ) : tier === 2 ? (
          <>
            <div style={{ color: '#d2a8ff', fontWeight: 600, marginBottom: 4 }}>STREAMSAVER FOCUS</div>
            <div>Strong StreamSaver candidate. "Instead of paying for Netflix, Disney+, and Hulu separately, bundle them and save 25-41%." Mention Home if they own.</div>
          </>
        ) : (
          <>
            <div style={{ color: '#7ee787', fontWeight: 600, marginBottom: 4 }}>MOBILE FIRST</div>
            <div>Focus on the mobile sale and savings. StreamSaver is secondary. Lead with the $0 first line offer and monthly bill reduction.</div>
          </>
        )}
      </div>
    </div>
  );
}
