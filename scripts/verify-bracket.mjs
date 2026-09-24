// Verify the Bracket bank (app/bracket/puzzles.js) from scratch:
//   - structural: nums sequential, quizId/live/dateLabel agree, sunday flag
//     matches the real weekday, 16 items on weekdays and 32 on Sundays, names
//     distinct, VALUES distinct (a tie would make a matchup unanswerable)
//   - the field is a power of two and the bracket resolves cleanly
//   - the true champion is the global extreme under the day's direction
//   - the difficulty curve the game depends on: every first-round matchup is a
//     rout, and the true final is close enough to be a coin flip
//   - seed position must not leak the answer: the champion is not always in the
//     same slot across the bank
// The board carries no answer: the winner of every matchup is recomputed here
// from the values, exactly as the client recomputes it.
//   - from COPY_FROM (the 2026-10-14 extension, made by scripts/gen-bracket.mjs):
//     US spellings and no em dash in any reader-facing string (proper nouns such
//     as "Ping An Finance Centre" and "Sydney Harbour Bridge" are allowed), and
//     no live sports board: every sport unit on these boards must be a RETIRED
//     player's final total, which the metric says in so many words
// Run: node scripts/verify-bracket.mjs
import { PUZZLES } from '../app/bracket/puzzles.js';
import { scanUS } from './us-spellings.mjs';

const COPY_FROM = '2026-10-14';
const PROPER = ['Ping An Finance Centre', 'Lakhta Centre', 'CTF Finance Centre', 'Sydney Harbour Bridge'];

let fails = 0;
const fail = (m) => { console.error('FAIL:', m); fails++; };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const seen = new Set();
const championSlots = [];

PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.live})`;
  if (p.num !== i + 1) fail(`${tag}: num out of sequence`);
  if (seen.has(p.quizId)) fail(`${tag}: duplicate quizId`);
  seen.add(p.quizId);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `bracket-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live date`);
  if (p.dateLabel !== `${MONTHS[m-1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match live date`);
  if (!!p.sunday !== (new Date(Date.UTC(y, m-1, d)).getUTCDay() === 0)) fail(`${tag}: sunday flag wrong`);

  const n = p.items.length;
  const want = p.sunday ? 32 : 16;
  if (n !== want) fail(`${tag}: ${n} items (want ${want})`);
  if ((n & (n - 1)) !== 0) fail(`${tag}: field is not a power of two`);
  if (new Set(p.items.map((x) => x.name)).size !== n) fail(`${tag}: duplicate item name`);
  if (new Set(p.items.map((x) => x.value)).size !== n) fail(`${tag}: two items share a value, so a matchup has no answer`);
  if (p.items.some((x) => typeof x.value !== 'number' || !isFinite(x.value))) fail(`${tag}: a value is not a finite number`);
  if (!p.metric || !p.metricShort || !p.unit) fail(`${tag}: missing metric labelling`);
  if (p.dir !== 'max' && p.dir !== 'min') fail(`${tag}: bad direction`);

  const better = (a, b) => (p.dir === 'max' ? p.items[a].value > p.items[b].value : p.items[a].value < p.items[b].value) ? a : b;
  let live = p.items.map((_, k) => k);
  const rounds = [];
  while (live.length > 1) {
    const next = [];
    for (let k = 0; k < live.length; k += 2) next.push(better(live[k], live[k + 1]));
    rounds.push(next); live = next;
  }
  const champ = live[0];
  championSlots.push(champ);

  const extreme = p.items.reduce((best, it, k) => (p.dir === 'max' ? it.value > p.items[best].value : it.value < p.items[best].value) ? k : best, 0);
  if (champ !== extreme) fail(`${tag}: the bracket champion is not the true extreme, so the seeding is broken`);

  // curve: routs first, coin flip last
  const finalists = rounds[rounds.length - 2];
  if (p.unit === 'lat') {
    for (let k = 0; k < n; k += 2) {
      const g = Math.abs(p.items[k].value - p.items[k + 1].value);
      if (g < 8) fail(`${tag}: first-round matchup ${k / 2 + 1} is only ${g.toFixed(1)} degrees apart`);
    }
    const fg = Math.abs(p.items[finalists[0]].value - p.items[finalists[1]].value);
    if (fg > 6) fail(`${tag}: the final is ${fg.toFixed(1)} degrees apart, not a coin flip`);
  } else {
    const rel = (a, b) => Math.abs(p.items[a].value - p.items[b].value) / Math.max(Math.abs(p.items[a].value), Math.abs(p.items[b].value), 1);
    for (let k = 0; k < n; k += 2) {
      if (rel(k, k + 1) < 0.35) fail(`${tag}: first-round matchup ${k / 2 + 1} is too close for a warm-up`);
    }
    if (rel(finalists[0], finalists[1]) > 0.22) fail(`${tag}: the final is not close enough to be a coin flip`);
  }

  if (p.live >= COPY_FROM) {
    for (const t of [p.metric, p.metricShort, ...p.items.map((x) => x.name)]) {
      for (const hit of scanUS(t, PROPER)) fail(`${tag}: British form "${hit.found}" (US: ${hit.us}) in "${t}"`);
      if (/\u2014/.test(t)) fail(`${tag}: em dash in "${t}"`);
    }
    if (['hr', 'k', 'yards', 'golds', 'seats'].includes(p.unit) && !/RETIRED/.test(p.metric)) fail(`${tag}: a ${p.unit} board after ${COPY_FROM} must be a RETIRED-players board (frozen totals)`);
  }

  // scoring shape: every round is worth the same in total
  const perRound = [];
  let m2 = n;
  for (let r = 0; m2 > 1; r++) { m2 /= 2; perRound.push(m2 * Math.pow(2, r)); }
  if (new Set(perRound).size !== 1) fail(`${tag}: rounds are not worth the same in total`);
  if (perRound[0] !== n / 2) fail(`${tag}: round total is not half the field`);
});

// the champion must not sit in the same slot every day, or seed position leaks it
if (new Set(championSlots).size < Math.min(6, PUZZLES.length)) {
  fail(`the champion lands in only ${new Set(championSlots).size} distinct slots across the bank, so position leaks the answer`);
}

if (fails) { console.error(`\nverify-bracket: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-bracket: all ${PUZZLES.length} brackets pass (unique values, true champion, routs first, coin-flip final, slots scrambled)`);
