import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import zip5Data from '../data/zip5.json';
import zip3Carriers from '../data/zip3-carriers.json';
import zip5Cities from '../data/zip5-cities.json';
import zip5Aliases from '../data/zip5-aliases.json';

const MAX_RESULTS = 8;

export default function ZipSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  // Build search index once — each ZIP5 with municipality-level city + USPS alias
  const index = useMemo(() => {
    const entries = [];
    for (const zip5 of Object.keys(zip5Data)) {
      const z3 = zip5.substring(0, 3);
      const z3d = zip3Carriers[z3];
      if (!z3d) continue;
      const city = zip5Cities[zip5] || z3d.city || '';
      const alias = zip5Aliases[zip5] || '';
      entries.push({
        zip: zip5,
        city,
        state: z3d.state || '',
        cityLow: city.toLowerCase(),
        stateLow: (z3d.state || '').toLowerCase(),
        aliasLow: alias.toLowerCase(),
      });
    }
    return entries;
  }, []);

  // Filter matches based on query, grouping by city
  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const isAllDigits = /^\d+$/.test(q);

    if (isAllDigits) {
      // ZIP search — group by city so "770" shows "Houston, TX (187 ZIPs)" not 8 rows
      const cityMap = new Map(); // "city|state" → { entry, zips[] }
      for (const e of index) {
        if (!e.zip.startsWith(q)) continue;
        const key = `${e.cityLow}|${e.stateLow}`;
        if (!cityMap.has(key)) {
          cityMap.set(key, { entry: e, zips: [e.zip] });
        } else {
          cityMap.get(key).zips.push(e.zip);
        }
        if (cityMap.size >= MAX_RESULTS && cityMap.has(key)) continue;
        if (cityMap.size > 50) break;
      }
      return [...cityMap.values()]
        .sort((a, b) => b.zips.length - a.zips.length || a.entry.city.localeCompare(b.entry.city))
        .slice(0, MAX_RESULTS)
        .map(g => ({ ...g.entry, zipCount: g.zips.length }));
    }

    // City/text search — group all matching ZIPs under each unique city
    const tokens = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const digitTokens = tokens.filter(t => /^\d+$/.test(t));
    const letterTokens = tokens.filter(t => !/^\d+$/.test(t));

    const cityMap = new Map();
    for (const e of index) {
      let ok = true;

      for (const t of letterTokens) {
        if (!e.cityLow.includes(t) && !e.stateLow.includes(t) && !e.aliasLow.includes(t)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      for (const t of digitTokens) {
        if (!e.zip.startsWith(t)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      const key = `${e.cityLow}|${e.stateLow}`;
      if (!cityMap.has(key)) {
        // Score: city starts with first token > alias starts with > contains
        let bonus = 0;
        if (letterTokens.length > 0) {
          if (e.cityLow.startsWith(letterTokens[0])) bonus = 2;
          else if (e.aliasLow.startsWith(letterTokens[0])) bonus = 1;
        }
        cityMap.set(key, { entry: e, zips: [e.zip], score: bonus });
      } else {
        cityMap.get(key).zips.push(e.zip);
      }
    }

    return [...cityMap.values()]
      .sort((a, b) =>
        b.score - a.score ||
        b.zips.length - a.zips.length ||
        a.entry.city.localeCompare(b.entry.city)
      )
      .slice(0, MAX_RESULTS)
      .map(g => ({ ...g.entry, zipCount: g.zips.length }));
  }, [query, index]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset highlighted index when results change
  useEffect(() => { setActiveIdx(0); }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[activeIdx];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const handleSelect = useCallback((entry) => {
    setQuery(`${entry.city}, ${entry.state} ${entry.zip}`);
    setIsOpen(false);
    onSelect(entry.zip);
  }, [onSelect]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    // If the user typed exactly 5 digits, auto-select that ZIP
    const digits = val.replace(/\D/g, '');
    if (digits.length === 5 && val.trim() === digits) {
      if (zip5Data[digits]) {
        const z3 = digits.substring(0, 3);
        const z3d = zip3Carriers[z3] || {};
        const city = zip5Cities[digits] || z3d.city || digits;
        const state = z3d.state || '';
        setQuery(`${city}, ${state} ${digits}`);
        setIsOpen(false);
        onSelect(digits);
        return;
      }
    }

    setIsOpen(true);
    onSelect('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx(i => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(i => (i - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(results[activeIdx]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <input
        className="zip-input"
        type="text"
        placeholder="ZIP or City"
        value={query}
        onChange={handleChange}
        onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      {isOpen && results.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#1c2128',
            border: '1px solid #30363d',
            borderRadius: 8,
            overflow: 'auto',
            maxHeight: 320,
            zIndex: 100,
            minWidth: 280,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {results.map((r, i) => (
            <div
              key={`${r.city}-${r.state}-${r.zip}`}
              onMouseDown={() => handleSelect(r)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '9px 14px',
                cursor: 'pointer',
                background: i === activeIdx ? '#30363d' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 15,
                fontFamily: "'IBM Plex Sans', sans-serif",
                transition: 'background 0.1s',
              }}
            >
              <span style={{ color: '#e6edf3', fontWeight: 500 }}>
                {r.city}, {r.state}
              </span>
              <span style={{
                color: '#8b949e',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                marginLeft: 16,
              }}>
                {r.zipCount > 1 ? `${r.zipCount} ZIPs` : r.zip}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
