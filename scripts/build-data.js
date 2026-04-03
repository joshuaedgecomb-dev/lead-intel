import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { find as findTz } from 'geo-tz';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

// Income tier thresholds
const TIER_THRESHOLDS = { low: 45000, high: 85000 };

function getTier(income) {
  if (income === null || income <= 0) return 2; // default to balanced for missing data
  if (income < TIER_THRESHOLDS.low) return 1;
  if (income > TIER_THRESHOLDS.high) return 3;
  return 2;
}

async function downloadFile(url) {
  console.log(`Downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res;
}

async function getGazetteerData() {
  console.log('\n--- Step 1: Census Gazetteer ---');
  let res;
  try {
    res = await downloadFile(
      'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip'
    );
  } catch {
    console.log('  2024 Gazetteer not available, falling back to 2023...');
    res = await downloadFile(
      'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip'
    );
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const txtEntry = entries.find(e => e.entryName.endsWith('.txt'));
  if (!txtEntry) throw new Error('No .txt file found in Gazetteer ZIP');

  const text = txtEntry.getData().toString('utf8');
  const lines = text.trim().split('\n');
  const header = lines[0].split('\t').map(h => h.trim());

  const cols = {
    geoid: header.findIndex(h => h === 'GEOID'),
    lat: header.findIndex(h => h === 'INTPTLAT'),
    lon: header.findIndex(h => h === 'INTPTLONG'),
  };

  const data = {};
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split('\t').map(f => f.trim());
    const geoid = fields[cols.geoid];
    if (!geoid || geoid.length !== 5) continue;

    data[geoid] = {
      lat: parseFloat(fields[cols.lat]),
      lon: parseFloat(fields[cols.lon]),
    };
  }

  console.log(`  Parsed ${Object.keys(data).length} ZCTAs`);
  return data;
}

async function getIncomeData() {
  console.log('\n--- Step 2: Census ACS Income ---');
  const apiKey = process.env.CENSUS_API_KEY || '';
  let url = 'https://api.census.gov/data/2023/acs/acs5?get=B19013_001E,NAME&for=zip%20code%20tabulation%20area:*';
  if (apiKey) url += `&key=${apiKey}`;

  const res = await downloadFile(url);
  const rows = await res.json();

  const data = {};
  for (let i = 1; i < rows.length; i++) {
    const [income, name, zcta] = rows[i];
    const val = parseInt(income, 10);
    data[zcta] = (val && val > 0) ? val : null;
  }

  console.log(`  Parsed income for ${Object.keys(data).length} ZCTAs`);
  return data;
}

async function main() {
  console.log('=== Lead Intel ZIP5 Data Pipeline ===\n');

  const zip3Carriers = JSON.parse(readFileSync(join(DATA_DIR, 'zip3-carriers.json'), 'utf8'));
  console.log(`Loaded ${Object.keys(zip3Carriers).length} ZIP3 carrier entries`);

  const gazetteer = await getGazetteerData();
  const income = await getIncomeData();

  console.log('\n--- Step 3: Combining data ---');
  const zip5 = {};
  let matched = 0;
  let noIncome = 0;
  let noTz = 0;

  for (const [zcta, geo] of Object.entries(gazetteer)) {
    const zip3 = zcta.substring(0, 3);
    const carrierData = zip3Carriers[zip3];

    let tz = 'America/New_York';
    try {
      const tzResult = findTz(geo.lat, geo.lon);
      if (tzResult && tzResult.length > 0) tz = tzResult[0];
    } catch {
      noTz++;
    }

    const incomeVal = income[zcta] || null;
    const tier = getTier(incomeVal);
    if (!incomeVal) noIncome++;

    zip5[zcta] = {
      lat: parseFloat(geo.lat.toFixed(4)),
      lon: parseFloat(geo.lon.toFixed(4)),
      tz,
      tier,
      carrier: carrierData?.carrier || null,
      metro: carrierData?.metro || null,
      state: carrierData?.state || null,
    };
    matched++;
  }

  console.log(`  Combined ${matched} ZIP5 entries`);
  console.log(`  ${noIncome} entries with missing income (defaulted to tier 2)`);
  console.log(`  ${noTz} entries with timezone lookup failures`);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, 'zip5.json'), JSON.stringify(zip5));
  const sizeMb = (Buffer.byteLength(JSON.stringify(zip5)) / 1024 / 1024).toFixed(1);
  console.log(`\n  Written to src/data/zip5.json (${sizeMb} MB)`);
  console.log('\n=== Pipeline complete ===');
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
