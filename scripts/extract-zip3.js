import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('lead-intel.jsx', 'utf8');

const match = src.match(/const Z = \{([\s\S]*?)\n\};/);
if (!match) {
  console.error('Could not find Z object in lead-intel.jsx');
  process.exit(1);
}

const entries = {};
const lineRegex = /"(\d{3})":\{c:"([^"]+)",s:"([^"]+)",[^}]*cr:"(\w+)",m:"([^"]+)"/g;
let m;
while ((m = lineRegex.exec(match[1])) !== null) {
  entries[m[1]] = { city: m[2], state: m[3], carrier: m[4], metro: m[5] };
}

writeFileSync('src/data/zip3-carriers.json', JSON.stringify(entries, null, 2));
console.log(`Extracted ${Object.keys(entries).length} ZIP3 entries`);
