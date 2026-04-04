/**
 * Build Comcast/Xfinity serviceable ZIP codes list.
 *
 * Data flow:
 *   1. Pull all Comcast census blocks from FCC Form 477 SODA API
 *   2. Extract unique census tracts (first 11 digits of each block code)
 *   3. Download HUD USPS tract-to-ZIP crosswalk
 *   4. Map tracts → ZIP codes, deduplicate
 *   5. Output src/data/comcast-zips.json
 *
 * Sources:
 *   - FCC Form 477 (June 2021): opendata.fcc.gov dataset jdr4-3q4p
 *   - HUD USPS Crosswalk: huduser.gov
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

const FCC_API = 'https://opendata.fcc.gov/resource/jdr4-3q4p.json';
const PROVIDER = 'COMCAST CABLE COMMUNICATIONS, LLC';
const PAGE_SIZE = 50000;

async function fetchWithTimeout(url, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function fetchAllComcastBlocks() {
  console.log('\n--- Step 1: Fetching Comcast census blocks from FCC ---');

  // Get total count first
  const countUrl = `${FCC_API}?$select=count(*) as total&$where=upper(providername)='${PROVIDER}'`;
  const countRes = await fetchWithTimeout(countUrl);
  const [{ total }] = await countRes.json();
  console.log(`  Total Comcast blocks: ${total}`);

  const totalPages = Math.ceil(parseInt(total) / PAGE_SIZE);
  console.log(`  Fetching in ${totalPages} pages of ${PAGE_SIZE}...`);

  const allTracts = new Set();
  let fetched = 0;

  for (let page = 0; page < totalPages; page++) {
    const offset = page * PAGE_SIZE;
    const url = `${FCC_API}?$select=blockcode&$where=upper(providername)='${PROVIDER}'&$limit=${PAGE_SIZE}&$offset=${offset}`;
    const res = await fetchWithTimeout(url);
    const rows = await res.json();

    for (const row of rows) {
      // Census tract = first 11 digits of 15-digit block code
      allTracts.add(row.blockcode.substring(0, 11));
    }

    fetched += rows.length;
    process.stdout.write(`\r  Page ${page + 1}/${totalPages} — ${fetched.toLocaleString()} blocks, ${allTracts.size.toLocaleString()} unique tracts`);
  }

  console.log('\n  Done fetching.');
  return allTracts;
}

async function fetchHUDCrosswalk() {
  console.log('\n--- Step 2: Fetching HUD tract-to-ZIP crosswalk ---');

  // HUD USPS crosswalk API — tract to ZIP
  // Documentation: https://www.huduser.gov/portal/dataset/uspszip-api.html
  // The API requires a token, but we can try the public endpoint
  // Alternative: use the Excel/CSV download

  // Try the HUD API first
  const url = 'https://www.huduser.gov/hudapi/public/usps?type=2&query=All';
  console.log('  Trying HUD API...');

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + (process.env.HUD_API_KEY || '') }
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  Got ${data.data?.results?.length || 0} crosswalk records`);
      return data;
    }
  } catch (e) {
    // API requires auth, fall back to alternative approach
  }

  console.log('  HUD API requires auth key. Using alternative approach...');
  console.log('  Deriving ZIP codes from census tract FIPS → ZIP mapping via Census Gazetteer.');
  return null;
}

async function deriveZipsFromTracts(comcastTracts) {
  console.log('\n--- Step 3: Mapping tracts to ZIP codes ---');

  // Alternative approach: since we have zip5.json with state info, and we know
  // which states+counties Comcast serves, we can match at the county level.
  // Census tract first 5 digits = state FIPS (2) + county FIPS (3).
  // Our zip5.json doesn't have FIPS, but we can use the Census Gazetteer
  // which maps ZCTAs (ZIP codes) to geographic coordinates.
  //
  // Better approach: Census publishes a ZCTA-to-tract relationship file.
  // Let's use that.

  console.log('  Downloading Census ZCTA-to-tract relationship file...');

  const url = 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_tract20_natl.txt';
  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    // Try 2010 version
    console.log('  2020 file not found, trying alternative...');
    const url2 = 'https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_tract_rel_10.txt';
    const res2 = await fetchWithTimeout(url2);
    if (!res2.ok) throw new Error('Cannot download Census ZCTA-tract crosswalk');
    return processRelFile(await res2.text(), comcastTracts, '2010');
  }

  return processRelFile(await res.text(), comcastTracts, '2020');
}

function processRelFile(text, comcastTracts, vintage) {
  const lines = text.trim().split('\n');
  const header = lines[0].split('|').map(h => h.trim());

  // Find relevant column indices
  let zcCol, tractCol;
  if (vintage === '2020') {
    // 2020 format: GEOID_ZCTA5_20|GEOID_TRACT_20|...
    zcCol = header.findIndex(h => h.includes('ZCTA5') && h.includes('GEOID'));
    tractCol = header.findIndex(h => h.includes('TRACT') && h.includes('GEOID'));
    if (zcCol === -1) zcCol = 0;
    if (tractCol === -1) tractCol = 1;
  } else {
    // 2010 format: ZCTA5|STATE|COUNTY|TRACT|...
    zcCol = header.findIndex(h => h === 'ZCTA5');
    // For 2010, tract is state+county+tract combined
    tractCol = -1; // Will build from components
  }

  console.log(`  Processing ${vintage} crosswalk (${lines.length - 1} rows)...`);
  console.log(`  Header: ${header.slice(0, 6).join(' | ')}`);

  const comcastZips = new Set();

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split('|').map(f => f.trim());

    let zcta, tract;
    if (vintage === '2020') {
      zcta = fields[zcCol];
      tract = fields[tractCol];
    } else {
      zcta = fields[zcCol];
      const stCol = header.findIndex(h => h === 'STATE');
      const coCol = header.findIndex(h => h === 'COUNTY');
      const trCol = header.findIndex(h => h === 'TRACT');
      tract = fields[stCol] + fields[coCol] + fields[trCol];
    }

    if (zcta && tract && comcastTracts.has(tract)) {
      comcastZips.add(zcta);
    }
  }

  return comcastZips;
}

async function main() {
  console.log('=== Comcast/Xfinity ZIP Code Builder ===');

  // Step 1: Get all Comcast census blocks → unique tracts
  const comcastTracts = await fetchAllComcastBlocks();
  console.log(`\n  Total unique tracts: ${comcastTracts.size.toLocaleString()}`);

  // Step 2-3: Map tracts to ZIP codes
  const comcastZips = await deriveZipsFromTracts(comcastTracts);
  console.log(`\n  Total Comcast-serviceable ZIP codes: ${comcastZips.size.toLocaleString()}`);

  // Step 4: Write output
  const sorted = [...comcastZips].sort();
  writeFileSync(join(DATA_DIR, 'comcast-zips.json'), JSON.stringify(sorted));

  const sizKb = (Buffer.byteLength(JSON.stringify(sorted)) / 1024).toFixed(1);
  console.log(`\n  Written to src/data/comcast-zips.json (${sizKb} KB, ${sorted.length} ZIPs)`);
  console.log('\n=== Done ===');
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
