// Verify the Ping bank: sequential nums, quizId date == live date, the `sunday`
// flag matches the real weekday, every answer city exists in lib/ping-cities.js
// with MATCHING coordinates, no city is banked twice, and blurbs are sane.
// Run after ANY edit to the bank or the atlas:
//   node scripts/verify-ping.mjs
import { PUZZLES } from '../app/ping/puzzles.js';
import { CITIES } from '../lib/ping-cities.js';
import { scanUS } from './us-spellings.mjs';

// US spellings and no em/en dash in blurbs, from PING_COPY_FROM (the December
// restock, 2026-11-12). Earlier boards are frozen and were never screened.
const PING_COPY_FROM = '2026-12-01';

const byKey = new Map();
for (const c of CITIES) byKey.set(`${c.name}|${c.country}`, c);

let bad = 0;
const seenCity = new Set();
const seenId = new Set();

PUZZLES.forEach((p, i) => {
  const errs = [];
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);

  const m = String(p.quizId).match(/^ping-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId (want ping-M-D-YY)');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
    // Weekday must line up with the sunday flag (noon UTC dodges tz edges).
    const wd = new Date(`${p.live}T12:00:00Z`).getUTCDay();
    const isSun = wd === 0;
    if (!!p.sunday !== isSun) errs.push(`sunday=${!!p.sunday} but ${p.live} is ${isSun ? 'a Sunday' : 'not a Sunday'}`);
  }

  if (seenId.has(p.quizId)) errs.push('duplicate quizId');
  seenId.add(p.quizId);

  const key = `${p.city}|${p.country}`;
  if (seenCity.has(key)) errs.push(`duplicate city ${key}`);
  seenCity.add(key);

  const atlas = byKey.get(key);
  if (!atlas) errs.push(`city not in ping-cities.js: ${key}`);
  else {
    if (Math.abs(atlas.lat - p.lat) > 1e-4) errs.push(`lat ${p.lat} != atlas ${atlas.lat}`);
    if (Math.abs(atlas.lng - p.lng) > 1e-4) errs.push(`lng ${p.lng} != atlas ${atlas.lng}`);
  }

  if (typeof p.blurb !== 'string' || p.blurb.length < 15 || p.blurb.length > 130) {
    errs.push(`blurb length ${p.blurb ? p.blurb.length : 0} (want 15-130)`);
  }
  if (!p.dateLabel) errs.push('missing dateLabel');
  if (p.live >= PING_COPY_FROM && typeof p.blurb === 'string') {
    const us = scanUS(p.blurb);
    if (us.length) errs.push(`British spelling in blurb: ${us.map((x) => x.found).join(', ')}`);
    if (/[\u2013\u2014]/.test(p.blurb)) errs.push('em or en dash in blurb');
  }

  if (errs.length) { bad++; console.error(`✗ ${p.quizId}: ${errs.join('; ')}`); }
  else console.log(`✓ ${p.quizId}  ${p.city}, ${p.country}${p.sunday ? '  (Sunday · tricky)' : ''}`);
});

// Atlas sanity: unique (name,country), coords in range.
const seenAtlas = new Set();
for (const c of CITIES) {
  const k = `${c.name}|${c.country}`;
  if (seenAtlas.has(k)) { bad++; console.error(`✗ atlas duplicate: ${k}`); }
  seenAtlas.add(k);
  if (!(c.lat >= -90 && c.lat <= 90) || !(c.lng >= -180 && c.lng <= 180)) {
    bad++; console.error(`✗ atlas bad coords: ${k}`);
  }
}

if (bad) { console.error(`\n${bad} problem(s)`); process.exit(1); }
console.log(`\nAll ${PUZZLES.length} Ping puzzles verified against ${CITIES.length} atlas cities.`);
