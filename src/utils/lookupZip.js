import zip5Data from '../data/zip5.json';
import zip3Carriers from '../data/zip3-carriers.json';

/**
 * Look up a 5-digit ZIP code.
 * Returns full data if ZIP5 is found, partial carrier/metro data if only ZIP3 matches, or null.
 */
export function lookupZip(zip) {
  if (!zip || zip.length < 5) return null;

  const z5 = zip.substring(0, 5);
  const z3 = zip.substring(0, 3);
  const z3Data = zip3Carriers[z3] || {};

  // Try exact ZIP5 match
  if (zip5Data[z5]) {
    const entry = zip5Data[z5];
    return {
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
  }

  // Fallback: ZIP3 carrier/metro only (partial result)
  if (z3Data.carrier) {
    return {
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
  }

  return null;
}
