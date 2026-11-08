// Carmen: the daily globe chase (owner, 2026-11-08). The rules in one place,
// shared by the client (app/carmen), the generator (scripts/gen-carmen.mjs)
// and the verifier (scripts/verify-carmen.mjs), so the three can never
// disagree on a score.
//
// A case is a start city (the crime scene) and five legs, six on a Sunday.
// Each leg is one city with three tips (Evidence, Witness, Informant). The
// first tip is free; every extra tip costs TIP_COST. The player drops a pin on
// the globe and the leg scores on great-circle distance:
//   within BULLSEYE_KM          1000
//   otherwise                   round(1000 * exp(-km / DECAY_KM))
//   minus TIP_COST per extra tip, never below zero.
// The case is CAUGHT when the last leg's pin lands within CATCH_KM.

export const LEG_MAX = 1000;
export const TIP_COST = 150;
export const BULLSEYE_KM = 50;
export const DECAY_KM = 2000;
export const CATCH_KM = 500;
export const EARTH_KM = 6371;
export const TIP_TAGS = ['Evidence', 'Witness', 'Informant'];

// Weekday legs and the tiers they draw from (0 = Sunday). Tier 1 is a
// world-famous city, 2 well known, 3 harder. The Sunday Edition is a sixth
// leg drawn from the harder tiers.
export const LEGS_BY_DOW = [6, 5, 5, 5, 5, 5, 5];
export const TIERS_BY_DOW = [
  [2, 3, 3, 2, 3, 3], // Sun
  [1, 1, 1, 1, 1],    // Mon
  [1, 1, 2, 1, 1],    // Tue
  [1, 2, 1, 2, 1],    // Wed
  [2, 1, 2, 1, 2],    // Thu
  [2, 2, 1, 2, 3],    // Fri
  [2, 3, 2, 2, 3],    // Sat
];

export function kmBetween(a, b) {
  const toR = Math.PI / 180;
  const [lon1, lat1] = a, [lon2, lat2] = b;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function legPoints(km, tips) {
  const base = km <= BULLSEYE_KM ? LEG_MAX : Math.round(LEG_MAX * Math.exp(-km / DECAY_KM));
  return Math.max(0, base - TIP_COST * Math.max(0, (tips || 1) - 1));
}

export function maxPoints(legs) { return legs * LEG_MAX; }

export function grade(km) {
  if (km <= BULLSEYE_KM) return 'Bullseye';
  if (km <= 300) return 'Hot';
  if (km <= 1000) return 'Warm';
  if (km <= 3000) return 'Cold';
  return 'Lost her';
}

// The rank ladder on the ending. Thresholds are fifths of the day's maximum,
// so a six-leg Sunday asks for the same share as a weekday.
export const TITLES = ['Rookie', 'Beat Cop', 'Gumshoe', 'Inspector', 'Sherlock Holmes'];
export function titleSteps(legs) { return TITLES.map((t, i) => ({ title: t, min: Math.round((i * maxPoints(legs)) / 5) })); }
export function titleFor(points, legs) {
  const steps = titleSteps(legs);
  let at = 0;
  steps.forEach((s, i) => { if (points >= s.min) at = i; });
  return { index: at, title: steps[at].title, steps };
}

export function caught(lastKm) { return lastKm != null && lastKm <= CATCH_KM; }
