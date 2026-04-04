/**
 * Build connectivity intelligence for Comcast service areas.
 *
 * Pulls:
 *   1. Comcast max advertised speeds per census block (from FCC 477)
 *   2. Competitor count per census tract (from FCC 477)
 *   3. Census internet access type data (from ACS B28002)
 *
 * Outputs: src/data/connectivity.json — keyed by ZIP5 (Comcast ZIPs only)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

const FCC_API = 'https://opendata.fcc.gov/resource/jdr4-3q4p.json';
const PROVIDER = 'COMCAST CABLE COMMUNICATIONS, LLC';
const PAGE_SIZE = 50000;

async function fetchWithTimeout(url, timeoutMs = 180000) {
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
        console.log(`\n  Retry ${attempt}/3 for ${url.substring(0, 80)}...`);
        await new Promise(r => setTimeout(r, 3000));
      } else throw e;
    }
  }
}

// ── Step 1: Comcast speeds per tract ────────────────────────────
async function getComcastSpeeds() {
  console.log('\n--- Step 1: Comcast advertised speeds (FCC 477) ---');

  const countUrl = `${FCC_API}?$select=count(*) as total&$where=upper(providername)='${PROVIDER}'`;
  const countRes = await fetchWithTimeout(countUrl);
  const [{ total }] = await countRes.json();
  const totalPages = Math.ceil(parseInt(total) / PAGE_SIZE);
  console.log(`  ${total} Comcast blocks, ${totalPages} pages`);

  // For each tract: store max download and max upload Comcast offers
  const tractSpeeds = {};
  let fetched = 0;

  for (let page = 0; page < totalPages; page++) {
    const url = `${FCC_API}?$select=blockcode,maxaddown,maxadup&$where=upper(providername)='${PROVIDER}'&$limit=${PAGE_SIZE}&$offset=${page * PAGE_SIZE}`;
    const res = await fetchWithTimeout(url);
    const rows = await res.json();

    for (const row of rows) {
      const tract = row.blockcode.substring(0, 11);
      const down = parseInt(row.maxaddown) || 0;
      const up = parseInt(row.maxadup) || 0;
      if (!tractSpeeds[tract] || down > tractSpeeds[tract].down) {
        tractSpeeds[tract] = { down, up };
      }
    }

    fetched += rows.length;
    process.stdout.write(`\r  Page ${page + 1}/${totalPages} — ${fetched.toLocaleString()} blocks`);
  }

  console.log(`\n  ${Object.keys(tractSpeeds).length} unique tracts with speed data`);
  return tractSpeeds;
}

// ── Step 2: Competitor count per tract ──────────────────────────
async function getCompetitorCounts() {
  console.log('\n--- Step 2: Competitor count per tract (FCC 477) ---');

  // Get distinct providers per tract for Comcast tracts
  // We'll sample by checking the Comcast tracts and counting other providers
  // Actually, let's get ALL providers in a simpler way:
  // Count distinct providers per tract for consumer broadband (>= 25 Mbps)

  // Load the ZCTA-tract crosswalk to know which tracts matter
  const comcastZips = JSON.parse(readFileSync(join(DATA_DIR, 'comcast-zips.json'), 'utf8'));
  console.log(`  Scoping to ${comcastZips.length} Comcast ZIPs`);

  // Get unique state FIPS from Comcast ZIPs to scope the query
  // Actually, the FCC API is slow for full scans. Let's use a different approach:
  // Count unique providers per tract from the blocks we already pulled from the Comcast query,
  // plus do a targeted query for competitor counts.

  // Simpler: query count of distinct providers per state for the top broadband states
  // Actually, let's just pull the tract-level counts directly using a group-by

  // The SODA API supports group-by. Let's get count of distinct providers per 11-digit tract
  // for tracts that have Comcast. But we need to query ALL providers for those tracts.

  // Most efficient: we already have Comcast tracts from step 1.
  // Query each state's providers and count per tract.
  // But that's too many queries.

  // Pragmatic approach: use the 477 data to count providers offering 25+ Mbps per census block
  // grouped by the first 11 digits (tract). Sample a few tracts first.

  console.log('  Querying provider counts (this uses a SODA aggregate)...');

  // Get count of distinct providers per state (2-digit FIPS) for broadband (25+ Mbps)
  // This gives us a rough competition metric per state which we can refine

  // Actually, let me try the most direct approach: distinct provider count per tract
  // We can't do this efficiently for all tracts, but we CAN pull total provider count
  // per ZIP by using Census data that already exists — the FCC publishes provider counts.

  // The FCC 477 Area Table has exactly this: provider count per geography
  const areaUrl = 'https://opendata.fcc.gov/resource/xvwq-qtaj.json';

  // Check what fields are available
  const sampleRes = await fetchWithTimeout(`${areaUrl}?$limit=3`);
  const sample = await sampleRes.json();
  console.log('  Area table fields:', Object.keys(sample[0]).join(', '));

  return sample;
}

// ── Step 3: Census internet access ──────────────────────────────
async function getCensusInternet() {
  console.log('\n--- Step 3: Census internet access (ACS B28002) ---');

  // B28002_001E = total households
  // B28002_002E = with internet subscription
  // B28002_004E = broadband (cable/fiber/DSL)
  // B28002_013E = no internet access
  const fields = 'B28002_001E,B28002_002E,B28002_004E,B28002_013E';
  const url = `https://api.census.gov/data/2023/acs/acs5?get=${fields}&for=zip%20code%20tabulation%20area:*`;

  console.log('  Downloading...');
  const res = await fetchWithTimeout(url);
  const rows = await res.json();

  const data = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const zcta = r[4];
    const totalHH = parseInt(r[0]) || 0;
    const withInternet = parseInt(r[1]) || 0;
    const broadband = parseInt(r[2]) || 0;
    const noInternet = parseInt(r[3]) || 0;

    if (totalHH > 0) {
      data[zcta] = {
        pctBroadband: Math.round((broadband / totalHH) * 100),
        pctNoInternet: Math.round((noInternet / totalHH) * 100),
        pctInternetOnly: Math.round(((withInternet - broadband) / totalHH) * 100), // has internet but not broadband (mobile-only, DSL, etc.)
      };
    }
  }

  console.log(`  Parsed internet access for ${Object.keys(data).length} ZCTAs`);
  return data;
}

async function main() {
  console.log('=== Connectivity Intelligence Builder ===');

  const comcastZips = JSON.parse(readFileSync(join(DATA_DIR, 'comcast-zips.json'), 'utf8'));
  const comcastSet = new Set(comcastZips);
  console.log(`Loaded ${comcastZips.length} Comcast ZIPs`);

  // Load ZCTA-tract crosswalk (already downloaded by build-comcast-zips)
  // We need tract → ZIP mapping to assign speeds to ZIPs
  console.log('Downloading ZCTA-tract crosswalk...');
  const crossRes = await fetchWithTimeout('https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_tract20_natl.txt');
  const crossText = await crossRes.text();
  const crossLines = crossText.trim().split('\n');
  const crossHeader = crossLines[0].split('|').map(h => h.trim());

  const zcCol = crossHeader.findIndex(h => h.includes('GEOID_ZCTA5'));
  const trCol = crossHeader.findIndex(h => h.includes('GEOID_TRACT'));
  if (zcCol === -1 || trCol === -1) {
    console.log('  Header:', crossHeader.slice(0, 6).join(', '));
    throw new Error('Cannot find ZCTA/TRACT columns');
  }

  // Build tract → ZIP mapping (one tract can span multiple ZIPs)
  const tractToZips = {};
  for (let i = 1; i < crossLines.length; i++) {
    const fields = crossLines[i].split('|').map(f => f.trim());
    const zcta = fields[zcCol];
    const tract = fields[trCol];
    if (!comcastSet.has(zcta)) continue; // only Comcast ZIPs
    if (!tractToZips[tract]) tractToZips[tract] = new Set();
    tractToZips[tract].add(zcta);
  }
  console.log(`  ${Object.keys(tractToZips).length} tracts mapped to Comcast ZIPs`);

  // Step 1: Comcast speeds
  const tractSpeeds = await getComcastSpeeds();

  // Step 2: Competition — let's check the Area Table format first
  console.log('\n--- Step 2: FCC Area Table for competition ---');
  const areaRes = await fetchWithTimeout('https://opendata.fcc.gov/resource/xvwq-qtaj.json?$limit=3');
  const areaSample = await areaRes.json();
  console.log('  Fields:', Object.keys(areaSample[0]).join(', '));

  // Step 3: Census internet access
  const censusInternet = await getCensusInternet();

  // ── Combine everything per ZIP ────────────────────────────────
  console.log('\n--- Combining data ---');
  const connectivity = {};

  for (const zip of comcastZips) {
    const entry = {};

    // Comcast speeds: find best speed from any tract in this ZIP
    let bestDown = 0, bestUp = 0;
    for (const [tract, zips] of Object.entries(tractToZips)) {
      if (zips.has(zip) && tractSpeeds[tract]) {
        if (tractSpeeds[tract].down > bestDown) {
          bestDown = tractSpeeds[tract].down;
          bestUp = tractSpeeds[tract].up;
        }
      }
    }
    if (bestDown > 0) {
      entry.xfDown = bestDown;
      entry.xfUp = bestUp;
    }

    // Census internet access
    const ci = censusInternet[zip];
    if (ci) {
      entry.pctBB = ci.pctBroadband;
      entry.pctNo = ci.pctNoInternet;
    }

    if (Object.keys(entry).length > 0) {
      connectivity[zip] = entry;
    }
  }

  console.log(`  ${Object.keys(connectivity).length} ZIPs with connectivity data`);

  // Write output
  writeFileSync(join(DATA_DIR, 'connectivity.json'), JSON.stringify(connectivity));
  const sizKb = (Buffer.byteLength(JSON.stringify(connectivity)) / 1024).toFixed(1);
  console.log(`\n  Written to src/data/connectivity.json (${sizKb} KB)`);
  console.log('\n=== Done ===');
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
