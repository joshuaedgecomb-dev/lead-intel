import { useState } from 'react';
import archetypes from '../data/archetypes.json';

function RecCard({ rec, color, num }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 6,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color, marginBottom: 4,
      }}>
        Rec {num}: {rec.title}
      </div>
      <div style={{
        fontSize: 11, color: '#e6edf3', lineHeight: 1.4, marginBottom: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4,
      }}>
        {rec.products}
      </div>
      <div style={{
        fontSize: 11, color: '#7ee787', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 4,
      }}>
        {rec.hook}
      </div>
      <div style={{ fontSize: 10, color: '#484f58' }}>
        {rec.addons}
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
      className="arch-btn"
      style={{
        background: isActive ? a.bg : '#21262d',
        border: isActive ? `2px solid ${a.color}` : `2px solid #30363d`,
        borderRadius: 8, padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer', transition: 'all 0.15s ease',
        outline: 'none',
      }}
    >
      <span style={{ fontSize: isActive ? 16 : 14 }}>{a.icon}</span>
      <span style={{
        fontSize: isActive ? 14 : 12, fontWeight: isActive ? 700 : 600,
        color: isActive ? a.color : '#8b949e',
      }}>
        {a.label}
      </span>
    </button>
  );
}

export default function PitchStrategy({ arch, arch2 }) {
  const [active, setActive] = useState(null); // null = use arch (primary)
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
        <ArchButton
          archKey={arch}
          isActive={activeKey === arch}
          onClick={() => setActive(null)}
        />
        {hasTwoOptions && (
          <ArchButton
            archKey={arch2}
            isActive={activeKey === arch2}
            onClick={() => setActive(arch2)}
          />
        )}
      </div>

      <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.4, marginBottom: 12 }}>
        {current.desc}
      </div>

      {/* Two recommendations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <RecCard rec={current.rec1} color={current.color} num={1} />
        <RecCard rec={current.rec2} color={current.color} num={2} />
      </div>

      {/* Compliance */}
      <div style={{
        marginTop: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
        borderRadius: 4, fontSize: 9, color: '#8b949e', lineHeight: 1.3,
      }}>
        Compliance: Offer broadband labels (xfinity.com/labels) before plan details
      </div>
    </div>
  );
}
