// scripts/carmen-trip-block.mjs: the places a Carmen case may not visit on a
// day because that day's Passport trip asks about them (review, 2026-11-12).
//
// The Passport trip (app/passport/trips.js) starts at a secret Ping city, runs
// a Span road from that city's country to a destination, names the
// destination's Flank ring, and then asks for the CAPITAL of every country the
// road touched after the start ("Stamps", with a big non-capital city as the
// decoy). A Carmen leg in one of those countries hands the Stamps answer over
// (Ankara on 11-24, Windhoek on 11-29: the Carmen tip even says Ankara has
// been Turkey's capital since 1923), and a Carmen leg in the trip's own city
// hands over Ping (Kazan on 11-27). So from TRIP_BLOCK_FROM no city in a case,
// start or leg, may be the trip's city or lie in a country on ANY shortest
// road of the trip (the player may take any of them) or in the destination's
// ring. The start country itself is not stamped and stays allowed.
//
// Used by scripts/gen-carmen.mjs (to deal around it) and
// scripts/verify-carmen.mjs (to fail it). Named without a verify- prefix so
// verify-all does not run it as a game.
import { buildAdj, distancesFrom } from '../app/span/borders.js';
import { TRIPS } from '../app/passport/trips.js';

export const TRIP_BLOCK_FROM = '2026-11-13';

const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const adj = buildAdj();
const byDate = new Map(TRIPS.map((t) => [t.live, t]));
const cache = new Map();

// { city, countries } for the trip on `iso`, or null when there is none.
export function tripBlock(iso) {
  if (iso < TRIP_BLOCK_FROM) return null;
  if (cache.has(iso)) return cache.get(iso);
  const t = byDate.get(iso);
  let out = null;
  if (t) {
    const dA = distancesFrom(adj, t.from), dB = distancesFrom(adj, t.to);
    const hops = dA[t.to];
    const countries = new Set();
    for (const v of Object.keys(dA)) if (v !== t.from && dB[v] != null && dA[v] + dB[v] === hops) countries.add(fold(v));
    for (const n of adj[t.to] || []) countries.add(fold(n));
    out = { city: fold(t.city), countries };
  }
  cache.set(iso, out);
  return out;
}

// Same-day clashes with OTHER games that a reviewer found (2026-11-12 late
// check): a Carmen city that is another game's answer that day, or whose tip
// answers another game's question. Cities are kept off those dates.
export const SAME_DAY_AVOID = {
  '2026-11-14': ['sydney', 'antananarivo'],   // Atlas: capital of New South Wales; Focus: Madagascar
  '2026-11-15': ['wellington'],               // Atlas: Wellington is the capital of which country
  '2026-11-18': ['bangkok'],                  // Atlas: Grand Palace and Wat Phra Kaew
  '2026-11-23': ['london'],                   // Atlas: served by Heathrow
  '2026-11-25': ['venice'],                   // Deep: the Rialto Bridge
  '2026-11-26': ['amman'],                    // tip names Philadelphia, the Passport trip city
  '2026-12-04': ['dubrovnik'],                // Quotes: "Winter is coming"; tip names Game of Thrones
  '2026-12-06': ['montreal'],                 // Sport: hosted the 1976 Summer Olympics
  '2026-12-10': ['venice'],                   // Atlas: capital of Veneto
};

// True when a 'City, Country' name is off limits on `iso`.
export function blockedOn(iso, name) {
  const parts = String(name).split(', ');
  const city = fold(parts[0]), country = fold(parts[parts.length - 1]);
  if ((SAME_DAY_AVOID[iso] || []).includes(city)) return true;
  const b = tripBlock(iso);
  if (!b) return false;
  return city === b.city || b.countries.has(country);
}
