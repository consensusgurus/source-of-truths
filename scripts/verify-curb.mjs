// verify-curb: the checker for Curb (app/curb/puzzles.js), discovered by
// scripts/verify-all.mjs. Rebuilds every day with the page's own engine
// (lib/curb-engine.js) and proves it can be parked:
//   - one day a day from 2026-11-28, num in order, quizId and dateLabel read
//     off `live`, the band from the weekday, `sunday` exactly on Sundays and
//     a truck exactly on Sundays;
//   - the stored seed is one the generator could have tried for that date,
//     and `set` equals daySettings(seed, band, live), so a hand edit fails;
//   - the weekday's room in the gap sits inside its band;
//   - the board is clean at the start (nothing touches the vehicle);
//   - PARKABLE: the planner (plan()) finds a path into the spot using the
//     same steering and collision code the page drives with. Planning every
//     day takes a few minutes, so by default it plans the next 21 days from
//     today; --all plans every day.
// Shown to fail on a car swapped, a spare widened past its band, a Sunday
// turned into a car, and a bay moved behind a parked trailer.
//   node scripts/verify-curb.mjs [--all]
import { PUZZLES } from '../app/curb/puzzles.js';
import { BANDS, bandOf, daySettings, buildDay, hits, plan } from '../lib/curb-engine.js';
import { FIRST, baseSeed, PLAN_NODES } from './gen-curb.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ALL = process.argv.includes('--all');
let fails = 0, planned = 0;
const bad = (p, m) => { fails++; console.log(`  FAIL No. ${p.num} (${p.live}): ${m}`); };
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const horizon = new Date(new Date(`${today}T12:00:00Z`).getTime() + 21 * 86400000).toISOString().slice(0, 10);

let expect = FIRST;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) bad(p, `num ${p.num}, expected ${i + 1}`);
  if (p.live !== expect) bad(p, `live ${p.live}, expected ${expect}`);
  expect = new Date(new Date(`${p.live}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `curb-${m}-${d}-${String(y).slice(2)}`) bad(p, `quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(p, `dateLabel ${p.dateLabel}`);
  const band = bandOf(p.live);
  if (p.band !== band) bad(p, `band ${p.band}, the weekday says ${band}`);
  if (p.sunday !== (band === 'sunday')) bad(p, `sunday flag ${p.sunday}`);
  if ((p.set.kind === 'truck') !== (band === 'sunday')) bad(p, `a ${p.set.kind} on a ${band} day`);
  let k = 0; while (k < 40 && ((baseSeed(p.live) + k * 7919) >>> 0) !== p.seed) k++;
  if (k === 40) bad(p, `seed ${p.seed} is not one the generator tries for this date`);
  const re = daySettings(p.seed, band, p.live);
  if (JSON.stringify(re) !== JSON.stringify(p.set)) bad(p, `set differs from its seed: ${JSON.stringify(p.set)} vs ${JSON.stringify(re)}`);
  if (p.set.kind === 'car') {
    const [lo, hi] = BANDS[band].spare;
    if (p.set.spare < lo - 1e-9 || p.set.spare > hi + 1e-9) bad(p, `spare ${p.set.spare} outside ${lo}..${hi}`);
  }
  const L = buildDay(p.set);
  if (hits(L, L.start)) bad(p, 'the vehicle starts touching something');
  if (ALL || (p.live >= today && p.live <= horizon)) {
    const r = plan(L, { maxNodes: PLAN_NODES[p.set.kind] });
    planned++;
    if (!r.found) bad(p, `the planner could not park it in ${r.nodes} nodes`);
  }
});

console.log(`verify-curb: ${PUZZLES.length} days, ${planned} planned${ALL ? '' : ' (next 21; --all for every day)'}, ${fails} failure${fails === 1 ? '' : 's'}`);
process.exit(fails ? 1 : 0);
