// Passport (owner, 2026-10-03): one mystery country a day, played five ways,
// one score out of 50. This module is the rules every surface shares: the
// round list, the scoring of each round, and the passport ladder the run
// ends on. Client-safe, no data imports.

export const KEY = 'passport';
export const TOTAL = 50;

export const ROUNDS = [
  { k: 'landmark', n: 'Landmark' },
  { k: 'flag', n: 'Flag' },
  { k: 'borders', n: 'Borders' },
  { k: 'capital', n: 'Capital' },
  { k: 'numbers', n: 'Numbers' },
];

// Round 1: the photo starts tight and pulls back a frame per wrong country.
export const ZOOM = [5.2, 3.2, 1.9, 1];
export const LANDMARK_PTS = [10, 8, 5, 3];

// Round 2: three picks, three off the stamp per wrong pick, never below 1.
export const flagScore = (misses) => Math.max(1, 10 - 3 * misses);

// Round 3: share of the neighbors named, out of 10. Three strikes end it.
export const STRIKES = 3;
export const bordersScore = (found, of) => (of ? Math.round((10 * found) / of) : 0);

// Round 4: a full stamp inside one STEP of the capital, a point off for every
// step beyond. The step grows with the country, so a pin in China is judged
// on China's scale rather than Greece's.
export const capStep = (area) => Math.max(25, Math.round(Math.sqrt(area || 0) / 15));
export const capitalScore = (km, area) => {
  const step = capStep(area);
  return km <= step ? 10 : Math.max(0, 10 - Math.ceil((km - step) / step));
};

// Round 5: five bigger-or-smaller calls on land area, two points each.
export const NUMBER_PTS = 2;

const D2R = Math.PI / 180;
export function haversineKm(a, b) {
  const dLa = (b[1] - a[1]) * D2R, dLo = (b[0] - a[0]) * D2R;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * D2R) * Math.cos(b[1] * D2R) * Math.sin(dLo / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// The map is a rotated Mercator baked by scripts/gen-passport.mjs; these are
// its forward and inverse, so the page needs no map library.
export function project(map, lon, lat) {
  return [map.t[0] + map.k * ((lon - map.lon0) * D2R), map.t[1] - map.k * Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2))];
}
export function unproject(map, x, y) {
  return [((x - map.t[0]) / map.k) / D2R + map.lon0, (2 * Math.atan(Math.exp((map.t[1] - y) / map.k)) - Math.PI / 2) / D2R];
}

// THE PASSPORT LADDER (owner, 2026-10-03): one real passport per inhabited
// continent, in true order of the Henley Passport Index 2026 (visa-free
// destinations, frozen at that edition). Cuts weighted to the low end, like
// the Price Check cards, so most runs have a passport to come back for.
export const HENLEY_EDITION = 'Henley Passport Index 2026';
export const TIERS = [
  { min: 0, name: 'Sierra Leonean passport', short: 'Sierra Leone', where: 'Africa', vf: 62, cv: '#1f5236', cf: '#e3c77a', t1: 'ECOWAS · Republic of Sierra Leone', t2: 'Passport', line: 'Expect a few visa forms on this trip.' },
  { min: 30, name: 'Mexican passport', short: 'Mexico', where: 'North America', vf: 157, cv: '#1e4a35', cf: '#e3c77a', t1: 'Estados Unidos Mexicanos', t2: 'Pasaporte', line: 'Plenty of stamps, and a few long queues.' },
  { min: 38, name: 'Brazilian passport', short: 'Brazil', where: 'South America', vf: 169, cv: '#26458a', cf: '#e3c77a', t1: 'Mercosul · República Federativa do Brasil', t2: 'Passaporte', line: 'You get around, and it shows.' },
  { min: 44, name: 'Australian passport', short: 'Australia', where: 'Oceania', vf: 182, cv: '#1b2a4a', cf: '#e3c77a', t1: 'Australia', t2: 'Passport', line: 'Most doors open before you knock.' },
  { min: 48, name: 'Swiss passport', short: 'Switzerland', where: 'Europe', vf: 186, cv: '#d52b1e', cf: '#ffffff', t1: 'Schweizer Pass · Passeport suisse · Passaporto svizzero · Swiss passport', t2: '', swiss: true, line: 'Almost every border waves you through.' },
  { min: 50, name: 'Japanese passport', short: 'Japan', where: 'Asia', vf: 188, cv: '#7d1d2c', cf: '#e3c77a', t1: '日本国旅券 · Japan', t2: 'Passport', line: 'Every border waves you through.' },
];
export function tierIndex(total) {
  let k = 0;
  TIERS.forEach((t, i) => { if (total >= t.min) k = i; });
  return k;
}
export const tierOf = (total) => TIERS[tierIndex(total)];

export function shareLines(num, total, scores, clock, url) {
  const t = tierOf(total);
  return [
    `Passport No. ${num} · ${total}/50`,
    `I traveled on the ${t.name} (${t.vf} visa-free)`,
    ROUNDS.map((r, i) => `${r.n} ${scores[i] == null ? '-' : scores[i]}`).join(' · '),
    `${clock} · ${url}`,
  ].join('\n');
}
