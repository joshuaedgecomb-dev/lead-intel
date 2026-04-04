export default function HouseholdIntel({ data }) {
  if (!data || data.partial) return null;

  const { hhSize, medAge, pctRenter, pctWfh, pctSpanish, pctForeignBorn, pctKids } = data;

  // Generate discovery hints based on the data
  const hints = [];

  // Household size → mobile lines
  if (hhSize) {
    if (hhSize >= 3) hints.push({ icon: '👥', text: `Avg ${hhSize} people — pitch ${Math.round(hhSize)}+ mobile lines, higher speed tier` });
    else if (hhSize < 2) hints.push({ icon: '👤', text: `Small households (${hhSize} avg) — 1-2 lines, 300-500M may suffice` });
  }

  // Kids → streaming, gaming, devices, security
  if (pctKids != null && pctKids >= 25) {
    hints.push({ icon: '🧒', text: `${pctKids}% households with kids — gaming, streaming, device deals for teens, Smart Home` });
  }

  // Renters vs owners → Home Security vs Smart Home
  if (pctRenter != null) {
    if (pctRenter >= 60) hints.push({ icon: '🏢', text: `${pctRenter}% renters — lead with Smart Home ($10/mo), not full Security` });
    else if (pctRenter < 40) hints.push({ icon: '🏠', text: `${100 - pctRenter}% homeowners — Home Security opportunity ($55/mo)` });
  }

  // WFH → speed positioning
  if (pctWfh != null && pctWfh >= 15) {
    hints.push({ icon: '💻', text: `${pctWfh}% work from home — emphasize speed reliability, pitch 500M+ minimum` });
  }

  // Spanish-speaking → NOW TV Latino
  if (pctSpanish != null && pctSpanish >= 10) {
    hints.push({ icon: '🗣️', text: `${pctSpanish}% Spanish-speaking — NOW TV Latino opportunity` });
  }

  // Foreign-born → Voice Premier international
  if (pctForeignBorn != null && pctForeignBorn >= 15) {
    hints.push({ icon: '🌎', text: `${pctForeignBorn}% foreign-born — Voice Premier international calling (90+ countries)` });
  }

  // Median age → product mix
  if (medAge != null) {
    if (medAge < 30) hints.push({ icon: '📱', text: `Young area (median ${medAge}) — lead with streaming, Premium Unlimited, device deals` });
    else if (medAge >= 55) hints.push({ icon: '📞', text: `Older area (median ${medAge}) — emphasize simplicity, Voice Premier, value` });
  }

  // Stat bar helper
  const StatPill = ({ label, value, unit = '' }) => (
    value != null ? (
      <div style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 3,
        padding: '2px 8px', background: '#1c2128', borderRadius: 4,
        fontSize: 13,
      }}>
        <span style={{ color: '#e6edf3', fontWeight: 600 }}>{value}{unit}</span>
        <span style={{ color: '#484f58', fontSize: 10 }}>{label}</span>
      </div>
    ) : null
  );

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 8 }}>
        Household Intel
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        <StatPill label="avg hh" value={hhSize} />
        <StatPill label="med age" value={medAge} />
        <StatPill label="renters" value={pctRenter} unit="%" />
        <StatPill label="WFH" value={pctWfh} unit="%" />
        <StatPill label="kids" value={pctKids} unit="%" />
        {pctSpanish >= 5 && <StatPill label="Spanish" value={pctSpanish} unit="%" />}
        {pctForeignBorn >= 5 && <StatPill label="foreign-born" value={pctForeignBorn} unit="%" />}
      </div>

      {/* Discovery hints */}
      {hints.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hints.map((h, i) => (
            <div key={i} style={{
              fontSize: 13, color: '#c9d1d9', lineHeight: 1.4,
              padding: '4px 8px', background: '#1a2332', borderRadius: 4,
            }}>
              <span style={{ marginRight: 4 }}>{h.icon}</span>
              {h.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
