import { useState } from 'react';
import archetypes from '../data/archetypes.json';

function PitchBlock({ label, color, title, pitch, includes }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 6,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color, marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, color: '#e6edf3', fontWeight: 600, marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 13, color: '#7ee787', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 4,
      }}>
        {pitch}
      </div>
      <div style={{ fontSize: 12, color: '#484f58' }}>
        {includes}
      </div>
    </div>
  );
}

function ArchButton({ archKey, isActive, onClick }) {
  const a = archetypes[archKey];
  if (!a) return null;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        background: isActive ? a.bg : '#21262d',
        border: isActive ? `2px solid ${a.color}` : `2px solid #30363d`,
        borderRadius: 8, padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer', transition: 'all 0.15s ease',
        outline: 'none',
      }}
    >
      <span style={{ fontSize: isActive ? 18 : 16 }}>{a.icon}</span>
      <span style={{
        fontSize: isActive ? 16 : 14, fontWeight: isActive ? 700 : 600,
        color: isActive ? a.color : '#8b949e',
      }}>
        {a.label}
      </span>
    </button>
  );
}

export default function PitchStrategy({ arch, arch2 }) {
  const [active, setActive] = useState(null);
  const activeKey = active || arch;
  const current = archetypes[activeKey];
  if (!current) return null;

  const hasTwoOptions = arch2 && arch2 !== arch;

  return (
    <div style={{
      background: '#161b22', borderRadius: 10, padding: 14,
      border: '1px solid #21262d',
    }}>
      {/* Archetype selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <ArchButton archKey={arch} isActive={activeKey === arch} onClick={() => setActive(null)} />
        {hasTwoOptions && (
          <ArchButton archKey={arch2} isActive={activeKey === arch2} onClick={() => setActive(arch2)} />
        )}
      </div>

      <div style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.4, marginBottom: 10 }}>
        {current.desc}
      </div>

      {/* Primary offers: Internet + Mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PitchBlock
          label="Nonsub — Internet Pitch"
          color="#6138f5"
          title={current.nonsub.title}
          pitch={current.nonsub.pitch}
          includes={current.nonsub.includes}
        />
        <PitchBlock
          label="XM — Mobile Pitch"
          color="#00b894"
          title={current.xm.title}
          pitch={current.xm.pitch}
          includes={current.xm.includes}
        />
      </div>

      {/* Cross-sells */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#484f58', marginBottom: 6 }}>
          Cross-sell by priority
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {current.crosssell.map((cs, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '6px 10px', background: '#1a2332', borderRadius: 4,
              fontSize: 13, lineHeight: 1.4,
            }}>
              <span style={{
                color: current.color, fontWeight: 700, fontSize: 12,
                minWidth: 14, textAlign: 'center', marginTop: 1,
              }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#e6edf3', fontWeight: 600 }}>{cs.product}</span>
                <span style={{ color: '#484f58' }}> · {cs.price}</span>
                <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2 }}>{cs.hook}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance */}
      <div style={{
        marginTop: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
        borderRadius: 4, fontSize: 10, color: '#8b949e', lineHeight: 1.3,
      }}>
        Compliance: Offer broadband labels (xfinity.com/labels) before plan details
      </div>
    </div>
  );
}
