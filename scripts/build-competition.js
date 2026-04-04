/**
 * Build ISP competition data for Comcast service areas.
 *
 * Queries FCC Form 477 for top wired broadband providers per state,
 * filtered to cable/fiber/DSL only (no satellite/wireless).
 *
 * Outputs: src/data/competition.json — keyed by 2-digit state FIPS
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

const FCC_API = 'https://opendata.fcc.gov/resource/jdr4-3q4p.json';

// State abbreviation → FIPS code
const STATE_FIPS = {
  AL:'01',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DC:'11',DE:'10',FL:'12',GA:'13',
  HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',LA:'22',ME:'23',MD:'24',
  MA:'25',MI:'26',MN:'27',MS:'28',MO:'29',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',
  NY:'36',NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',TN:'47',
  TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',WI:'55',WY:'56',
};

async function fetchWithTimeout(url, timeoutMs = 120000) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      if (attempt < 3) {
        console.log(`  Retry ${attempt}/3...`);
        await new Promise(r => setTimeout(r, 3000));
      } else throw e;
    }
  }
}

async function main() {
  console.log('=== ISP Competition Builder ===\n');

  // Get unique states from Comcast ZIPs
  const zip5Data = JSON.parse(readFileSync(join(DATA_DIR, 'zip5.json'), 'utf8'));
  const comcastZips = JSON.parse(readFileSync(join(DATA_DIR, 'comcast-zips.json'), 'utf8'));

  const comcastStates = new Set();
  for (const z of comcastZips) {
    const entry = zip5Data[z];
    if (entry && entry.state) comcastStates.add(entry.state);
  }

  // Map states to FIPS codes
  const stateFips = [...comcastStates]
    .filter(s => STATE_FIPS[s])
    .map(s => ({ state: s, fips: STATE_FIPS[s] }))
    .sort((a, b) => a.fips.localeCompare(b.fips));

  console.log(`Querying ${stateFips.length} Comcast states for wired ISP competition...\n`);

  const competition = {};
  for (let i = 0; i < stateFips.length; i++) {
    const { state, fips } = stateFips[i];
    const where = encodeURIComponent(
      `blockcode like '${fips}%' AND consumer='1' AND maxaddown>=25 AND (techcode='10' OR techcode='40' OR techcode='50')`
    );
    const url = `${FCC_API}?$select=${encodeURIComponent("providername,count(blockcode) as blocks")}` +
      `&$where=${where}` +
      `&$group=providername&$order=${encodeURIComponent("blocks DESC")}&$limit=4`;

    try {
      const res = await fetchWithTimeout(url);
      const text = await res.text();
      if (!text.startsWith('[')) {
        console.log(`\n  ${state}: API error, skipping`);
        continue;
      }
      const rows = JSON.parse(text);

      const total = rows.reduce((s, r) => s + parseInt(r.blocks), 0);
      const providers = rows.map(r => ({
        name: cleanName(r.providername),
        pct: Math.round((parseInt(r.blocks) / total) * 100),
        isXf: r.providername.toUpperCase().includes('COMCAST'),
      }));

      competition[state] = providers;
      process.stdout.write(`\r  ${i + 1}/${stateFips.length} ${state} — ${providers.length} ISPs (${providers[0]?.name} ${providers[0]?.pct}%)`);
    } catch (e) {
      console.log(`\n  ${state}: failed — ${e.message}`);
    }

    // Rate limit: 1 second between queries
    if (i < stateFips.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n');

  writeFileSync(join(DATA_DIR, 'competition.json'), JSON.stringify(competition, null, 2));
  const sizKb = (Buffer.byteLength(JSON.stringify(competition)) / 1024).toFixed(1);
  console.log(`Written to src/data/competition.json (${sizKb} KB)`);
  console.log('\n=== Done ===');
}

function cleanName(name) {
  // Shorten provider names for display
  return name
    .replace(', LLC', '').replace(', Inc.', '').replace(', Inc', '')
    .replace(' CABLE COMMUNICATIONS', '').replace(' Communications', '')
    .replace(' Telecom Services (Lehigh)', '').replace(' Telephone Company', '')
    .replace(' Telephone', '').replace(' Utilities', '')
    .replace('COMCAST', 'Comcast').replace('SECTV', 'Service Electric TV')
    .trim();
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
