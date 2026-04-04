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
  if (income === null || income <= 0) return 2;
  if (income < TIER_THRESHOLDS.low) return 1;
  if (income > TIER_THRESHOLDS.high) return 3;
  return 2;
}

// Archetype classification from combined Census fields
function getArchetype(acs) {
  const income = acs.income || 60000;
  const age = acs.medAge || 40;
  const renter = acs.pctRenter || 30;
  const kids = acs.pctKids || 20;
  const wfh = acs.pctWfh || 10;
  const spanish = acs.pctSpanish || 0;
  const foreignBorn = acs.pctForeignBorn || 0;
  const hhSize = acs.hhSize || 2.5;

  // Score each archetype 0-100 based on how well the data fits
  const scores = {};

  // Suburban Family: mid-age owners with kids, mid-to-high income
  scores.suburban_family = 0;
  if (age >= 30 && age <= 55) scores.suburban_family += 25;
  if (renter < 40) scores.suburban_family += 25;
  if (kids >= 20) scores.suburban_family += 25;
  if (income >= 55000 && income <= 130000) scores.suburban_family += 15;
  if (hhSize >= 2.5) scores.suburban_family += 10;

  // Affluent Professional: high income, WFH, fewer kids or older kids
  scores.affluent_pro = 0;
  if (income >= 100000) scores.affluent_pro += 30;
  else if (income >= 85000) scores.affluent_pro += 15;
  if (wfh >= 15) scores.affluent_pro += 25;
  if (age >= 35 && age <= 55) scores.affluent_pro += 15;
  if (renter < 40) scores.affluent_pro += 15;
  if (income >= 150000) scores.affluent_pro += 15;

  // Young Urban: young, renter, smaller households
  scores.young_urban = 0;
  if (age < 35) scores.young_urban += 30;
  if (renter >= 50) scores.young_urban += 25;
  if (hhSize < 2.2) scores.young_urban += 20;
  if (kids < 15) scores.young_urban += 15;
  if (wfh >= 15) scores.young_urban += 10;

  // Budget Family: lower income, kids, renters
  scores.budget_family = 0;
  if (income < 45000) scores.budget_family += 30;
  else if (income < 55000) scores.budget_family += 15;
  if (kids >= 20) scores.budget_family += 25;
  if (renter >= 45) scores.budget_family += 20;
  if (hhSize >= 2.5) scores.budget_family += 15;

  // Mature Value: older, owner, moderate income
  scores.mature_value = 0;
  if (age >= 50) scores.mature_value += 30;
  else if (age >= 45) scores.mature_value += 15;
  if (renter < 35) scores.mature_value += 20;
  if (income >= 40000 && income < 85000) scores.mature_value += 20;
  if (kids < 20) scores.mature_value += 15;
  if (foreignBorn >= 10) scores.mature_value += 10;

  // Multicultural Family: Spanish-speaking or high foreign-born, families
  scores.multicultural = 0;
  if (spanish >= 15) scores.multicultural += 35;
  else if (spanish >= 8) scores.multicultural += 15;
  if (foreignBorn >= 20) scores.multicultural += 20;
  if (kids >= 20) scores.multicultural += 20;
  if (hhSize >= 2.5) scores.multicultural += 15;

  // Pick top two
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], secondary: sorted[1][0] };
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

async function getCensusData() {
  console.log('\n--- Step 2: Census ACS Data ---');
  const apiKey = process.env.CENSUS_API_KEY || '';

  // All fields in one API call:
  // B19013_001E = median household income
  // B25010_001E = avg household size
  // B01002_001E = median age
  // B25003_002E = owner-occupied units
  // B25003_003E = renter-occupied units
  // B08006_017E = workers who work from home
  // B08006_001E = total workers (for WFH %)
  // B06007_001E = total pop 5+ (for language %)
  // B06007_003E = speaks Spanish
  // B05002_001E = total pop (for foreign-born %)
  // B05002_013E = foreign born
  // B11005_001E = total households
  // B11005_002E = households with children under 18
  const fields = 'B19013_001E,B25010_001E,B01002_001E,B25003_002E,B25003_003E,B08006_017E,B08006_001E,B06007_001E,B06007_003E,B05002_001E,B05002_013E,B11005_001E,B11005_002E';

  let url = `https://api.census.gov/data/2023/acs/acs5?get=${fields}&for=zip%20code%20tabulation%20area:*`;
  if (apiKey) url += `&key=${apiKey}`;

  const res = await downloadFile(url);
  const rows = await res.json();

  const data = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const zcta = r[13]; // last field is the ZCTA
    const income = parseInt(r[0], 10);
    const hhSize = parseFloat(r[1]);
    const medAge = parseFloat(r[2]);
    const owners = parseInt(r[3], 10);
    const renters = parseInt(r[4], 10);
    const wfh = parseInt(r[5], 10);
    const totalWorkers = parseInt(r[6], 10);
    const langPop = parseInt(r[7], 10);
    const spanish = parseInt(r[8], 10);
    const totalPop = parseInt(r[9], 10);
    const foreignBorn = parseInt(r[10], 10);
    const totalHH = parseInt(r[11], 10);
    const hhWithKids = parseInt(r[12], 10);

    const totalUnits = (owners || 0) + (renters || 0);
    data[zcta] = {
      income: (income && income > 0) ? income : null,
      hhSize: (hhSize && hhSize > 0) ? parseFloat(hhSize.toFixed(1)) : null,
      medAge: (medAge && medAge > 0) ? parseFloat(medAge.toFixed(0)) : null,
      pctRenter: totalUnits > 0 ? Math.round((renters / totalUnits) * 100) : null,
      pctWfh: totalWorkers > 0 ? Math.round((wfh / totalWorkers) * 100) : null,
      pctSpanish: langPop > 0 ? Math.round((spanish / langPop) * 100) : null,
      pctForeignBorn: totalPop > 0 ? Math.round((foreignBorn / totalPop) * 100) : null,
      pctKids: totalHH > 0 ? Math.round((hhWithKids / totalHH) * 100) : null,
    };
  }

  console.log(`  Parsed Census data for ${Object.keys(data).length} ZCTAs`);
  return data;
}

async function main() {
  console.log('=== Lead Intel ZIP5 Data Pipeline ===\n');

  const zip3Carriers = JSON.parse(readFileSync(join(DATA_DIR, 'zip3-carriers.json'), 'utf8'));
  console.log(`Loaded ${Object.keys(zip3Carriers).length} ZIP3 carrier entries`);

  const gazetteer = await getGazetteerData();
  const census = await getCensusData();

  console.log('\n--- Step 3: Combining data ---');
  const zip5 = {};
  let matched = 0;
  let noIncome = 0;
  let noTz = 0;

  for (const [zcta, geo] of Object.entries(gazetteer)) {
    const zip3 = zcta.substring(0, 3);
    const carrierData = zip3Carriers[zip3];
    const acs = census[zcta] || {};

    let tz = 'America/New_York';
    try {
      const tzResult = findTz(geo.lat, geo.lon);
      if (tzResult && tzResult.length > 0) tz = tzResult[0];
    } catch {
      noTz++;
    }

    const tier = getTier(acs.income);
    if (!acs.income) noIncome++;
    const arch = getArchetype(acs);

    zip5[zcta] = {
      lat: parseFloat(geo.lat.toFixed(4)),
      lon: parseFloat(geo.lon.toFixed(4)),
      tz,
      tier,
      carrier: carrierData?.carrier || null,
      metro: carrierData?.metro || null,
      state: carrierData?.state || null,
      hhSize: acs.hhSize || null,
      medAge: acs.medAge || null,
      pctRenter: acs.pctRenter || null,
      pctWfh: acs.pctWfh || null,
      pctSpanish: acs.pctSpanish || null,
      pctForeignBorn: acs.pctForeignBorn || null,
      pctKids: acs.pctKids || null,
      arch: arch.primary,
      arch2: arch.secondary,
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
