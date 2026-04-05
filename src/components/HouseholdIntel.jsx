export default function HouseholdIntel({ data }) {
  if (!data || data.partial) return null;

  const { hhSize, medAge, pctRenter, pctWfh, pctSpanish, pctForeignBorn, pctKids } = data;

  // Build cards — each stat becomes a self-contained talking-point card
  const cards = [];

  if (hhSize != null) {
    cards.push({
      icon: '👥', value: hhSize, label: 'People per Home',
      tip: hhSize >= 3
        ? `Pitch ${Math.round(hhSize)}+ mobile lines, higher speed tier`
        : hhSize < 2
          ? '1-2 lines, 300-500M likely enough'
          : 'Standard household — match lines to family size',
      accent: '#58a6ff',
    });
  }

  if (medAge != null) {
    const ageLabel = medAge < 30 ? 'Young area' : medAge >= 55 ? 'Older area' : 'Prime earning years';
    const ageTip = medAge < 30
      ? 'Lead with streaming, Unlimited, device deals'
      : medAge >= 55
        ? 'Emphasize simplicity, Voice Premier, value'
        : 'Full bundle opportunity — Internet + Mobile + TV';
    cards.push({ icon: '🎂', value: medAge, label: `Median Age — ${ageLabel}`, tip: ageTip, accent: '#d2a8ff' });
  }

  if (pctRenter != null) {
    const ownerPct = 100 - pctRenter;
    cards.push({
      icon: pctRenter >= 60 ? '🏢' : '🏠',
      value: `${pctRenter}%`, label: `Renters / ${ownerPct}% Owners`,
      tip: pctRenter >= 60
        ? 'Lead with Smart Home ($10/mo), skip full Security'
        : pctRenter < 40
          ? `${ownerPct}% homeowners — Home Security opportunity ($55/mo)`
          : 'Mixed — qualify ownership before pitching Security',
      accent: '#a371f7',
    });
  }

  if (pctWfh != null) {
    cards.push({
      icon: '💻', value: `${pctWfh}%`, label: 'Work from Home',
      tip: pctWfh >= 15
        ? 'Stress speed reliability, pitch 500M+ minimum'
        : 'Low remote work — standard speed tiers fine',
      accent: '#3fb950',
    });
  }

  if (pctKids != null) {
    cards.push({
      icon: '🧒', value: `${pctKids}%`, label: 'Households with Kids',
      tip: pctKids >= 25
        ? 'Gaming, streaming, device deals for teens, Smart Home'
        : 'Fewer kids — focus on adult use cases',
      accent: '#f0883e',
    });
  }

  if (pctSpanish != null && pctSpanish >= 5) {
    cards.push({
      icon: '🗣️', value: `${pctSpanish}%`, label: 'Spanish-Speaking',
      tip: pctSpanish >= 10
        ? 'NOW TV Latino opportunity — mention bilingual support'
        : 'Some Spanish speakers — note Latino packages if relevant',
      accent: '#f778ba',
    });
  }

  if (pctForeignBorn != null && pctForeignBorn >= 5) {
    cards.push({
      icon: '🌎', value: `${pctForeignBorn}%`, label: 'Foreign-Born',
      tip: pctForeignBorn >= 15
        ? 'Voice Premier international calling (90+ countries)'
        : 'Some international ties — mention Voice international add-on',
      accent: '#79c0ff',
    });
  }

  if (cards.length === 0) return null;

  // Use 3 columns — fills evenly for 3, 6, or wraps nicely for other counts
  const cols = cards.length <= 4 ? 2 : 3;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 16,
      border: '1px solid #21262d',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8b949e', marginBottom: 12 }}>
        Household Intel
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
      }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            background: '#1c2128', borderRadius: 8, padding: '12px 14px',
            borderLeft: `3px solid ${c.accent}`,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {/* Top row: icon + big number */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', lineHeight: 1 }}>
                {c.value}
              </span>
            </div>
            {/* Label */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2 }}>
              {c.label}
            </div>
            {/* Talking point */}
            <div style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.35, marginTop: 2 }}>
              {c.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
