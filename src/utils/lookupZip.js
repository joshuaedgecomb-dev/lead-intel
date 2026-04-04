import zip5Data from '../data/zip5.json';
import zip3Carriers from '../data/zip3-carriers.json';

const CACHE_KEY = 'leadintel_zip_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const cache = JSON.parse(raw);
    // Purge expired entries
    const now = Date.now();
    let changed = false;
    for (const key of Object.keys(cache)) {
      if (now - cache[key].ts > CACHE_TTL) {
        delete cache[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return cache;
  } catch {
    return {};
  }
}

function setCache(zip, data) {
  try {
    const cache = getCache();
    cache[zip] = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/**
 * Look up a 5-digit ZIP code.
 * Checks localStorage cache first (1hr TTL), then falls back to JSON data.
 */
export function lookupZip(zip) {
  if (!zip || zip.length < 5) return null;

  const z5 = zip.substring(0, 5);

  // Check cache first
  const cache = getCache();
  if (cache[z5]) return cache[z5].data;

  const z3 = zip.substring(0, 3);
  const z3Data = zip3Carriers[z3] || {};

  // Try exact ZIP5 match
  if (zip5Data[z5]) {
    const entry = zip5Data[z5];
    const result = {
      city: z3Data.city || null,
      state: z3Data.state || null,
      lat: entry.lat,
      lon: entry.lon,
      tz: entry.tz,
      tier: entry.tier,
      carrier: entry.carrier || z3Data.carrier || null,
      metro: entry.metro || z3Data.metro || null,
      zip3: z3,
      zip5: z5,
      approx: false,
      hhSize: entry.hhSize,
      medAge: entry.medAge,
      pctRenter: entry.pctRenter,
      pctWfh: entry.pctWfh,
      pctSpanish: entry.pctSpanish,
      pctForeignBorn: entry.pctForeignBorn,
      pctKids: entry.pctKids,
      arch: entry.arch || null,
      arch2: entry.arch2 || null,
    };
    setCache(z5, result);
    return result;
  }

  // Fallback: ZIP3 carrier/metro only (partial result)
  if (z3Data.carrier) {
    const result = {
      city: z3Data.city || null,
      state: z3Data.state || null,
      lat: null,
      lon: null,
      tz: null,
      tier: null,
      carrier: z3Data.carrier,
      metro: z3Data.metro || null,
      zip3: z3,
      zip5: z5,
      approx: true,
      partial: true,
    };
    setCache(z5, result);
    return result;
  }

  return null;
}
