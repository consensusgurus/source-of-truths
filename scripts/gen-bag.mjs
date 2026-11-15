// scripts/gen-bag.mjs: deals the Bag bank (app/bag/puzzles.js). APPEND ONLY: every
// row already in the file is kept byte for byte, and new days are added up to
// --until. A board that has gone live is never re-dealt.
//   node scripts/gen-bag.mjs --until 2027-01-31
//
// Owner, 2026-11-14: a "practical puzzle" beside Mop, Chef, Pack and Seated; of the
// week's ramp, "ok i like it but start gentle". The shop grows through the week
// (scripts/gen-bag-spec.mjs):
//   Mon  gentle    Corner Shop    8 items, 3 bags, reach 3: weight, crushing, cold together
//   Tue  gentle    Quick Stop     9 items, 3 bags, reach 3, one hot item (never with cold; owner, 2026-11-14)
//   Wed  moderate  Midweek Shop  11 items, 4 bags, reach 3, cleaning products (never with food)
//   Thu  moderate  Stock Up      13 items, 4 bags, reach 3
//   Fri  tough     Friday Rush   13 items, 4 bags, reach 2
//   Sat  tough     Party Shop    13 items, 4 bags (one small: 3 items, 6 lb), reach 2
//   Sun  sunday    The Big Shop  18 items, 6 bags, reach 3, and a melon that rides alone
// THE BANK OPENS WITH TWO INTRO BOARDS ("start gentle"): a Corner Shop on Saturday
// 2026-11-14 and a Quick Stop on Sunday 2026-11-15, both band `intro`. The first
// Big Shop is Sunday 2026-11-22.
//
// HOW A BOARD IS MADE. Items are drawn from the shelf (a few cold, a few fragile,
// the day's cleaning products, something heavy) and shuffled onto the belt. A deal
// is kept only if (1) the solver in lib/bag-engine.js bags all of it with nothing
// coming back out, that packing being stored as `sol`, and (2) it is as forgiving
// as the day's band allows: along the stored answer, the average share of the moves
// on offer that still leave everything baggable must fall inside `ease`.
// Every board is dealt from its date, so a re-run deals the same day.
import fs from 'fs';
import { why, solve, fresh, replay } from '../lib/bag-engine.js';
import { SPEC, SHELF } from './gen-bag-spec.mjs';
import { MONTHS } from './six-verify-common.mjs';

const FILE = new URL('../app/bag/puzzles.js', import.meta.url);
const START = '2026-11-14';
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const UNTIL = arg('--until') || '2027-01-03';
const INTRO = { '2026-11-14': 1, '2026-11-15': 2 };
export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// How forgiving a board is: walk the stored answer, and at each step take the share of the moves on
// offer (a reachable item into a bag that takes it) that still leave everything baggable.
export function easeOf(P, sol) {
  const s = fresh(P); let sum = 0;
  for (const [si, sb] of sol) {
    let legal = 0, good = 0;
    for (const i of s.belt.slice(0, P.reach)) for (let b = 0; b < s.bags.length; b++) {
      if (why(P, s.bags, b, i)) continue;
      legal++;
      const belt = s.belt.filter((x) => x !== i), bags = s.bags.map((st, j) => (j === b ? st.concat(i) : st));
      if (solve(P, belt, bags, new Set(), { n: 3000 })) good++;
    }
    sum += good / legal;
    s.belt.splice(s.belt.indexOf(si), 1); s.bags[sb].push(si);
  }
  return sum / sol.length;
}

export function deal(spec, R) {
  const [, , N, bagSpec, reach, nHot, nChem, nSolo, ease] = spec;
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const take = (list, n) => shuf(list).slice(0, n);
  const food = SHELF.filter((x) => !x.cold && !x.hot && !x.chem && !x.solo);
  const nCold = 2 + Math.floor(R() * (N >= 13 ? 3 : 2)), nFrag = 2 + Math.floor(R() * 2), nHeavy = N >= 13 ? 3 : 2;
  const picked = [
    ...take(SHELF.filter((x) => x.cold), nCold), ...take(SHELF.filter((x) => x.hot), nHot), ...take(SHELF.filter((x) => x.chem), nChem), ...take(SHELF.filter((x) => x.solo), nSolo),
    ...take(food.filter((x) => x.c === 0), nFrag), ...take(food.filter((x) => x.w >= 3), nHeavy),
  ];
  const rest = shuf(food.filter((x) => !picked.includes(x)));
  while (picked.length < N) picked.push(rest.pop());
  const items = shuf(picked.slice(0, N));
  const P = { reach, bags: bagSpec.map(([slots, limit]) => ({ slots, limit })), items };
  if (items.reduce((a, x) => a + x.w, 0) > P.bags.reduce((a, b) => a + b.limit, 0)) return null;
  const s = fresh(P), sol = solve(P, s.belt, s.bags, new Set(), { n: 12000 });
  if (!sol || !replay(P, sol)) return null;
  const e = easeOf(P, sol);
  if (e < ease[0] || e > ease[1]) return null;
  return { reach, bags: P.bags, items, sol, ease: e };
}

if (process.argv[1] && import.meta.url === (await import('url')).pathToFileURL(process.argv[1]).href) {
const HEAD = `// Puzzle data for Bag, the daily grocery-bagging puzzle.
// GENERATED by scripts/gen-bag.mjs; do not edit by hand. Extend with
// \`node scripts/gen-bag.mjs --until <date>\`, which keeps every row here byte for
// byte. Checked by scripts/verify-bag.mjs. Imported only by the server page, which
// strips days not yet live AND the stored answer (\`sol\`) before anything reaches a
// browser. The week's ramp is in scripts/gen-bag-spec.mjs.
//   band    intro | gentle | moderate | tough | sunday     shop  the day's shop
//   reach   how many items at the head of the belt can be picked up
//   bags    { slots, limit: pounds }
//   items   in belt order: { n, w: pounds, c: pounds it takes on top (99 = anything), k: picture, hue, cold / chem / solo }
//   sol     one way to bag it all with nothing coming back out: [item, bag] in order
//   sunday  the row falls on a Sunday
export const PUZZLES = [
`;
const save = (rows) => fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
let rows = [];
if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
const kept = rows.length;
const iso = (d) => d.toISOString().slice(0, 10);
const day = new Date(`${START}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + rows.length);
while (iso(day) <= UNTIL) {
  const live = iso(day), dow = day.getUTCDay(), [y, m, dd] = live.split('-').map(Number);
  const intro = INTRO[live], spec = SPEC[intro || dow];
  let got = null, salt = 0;
  for (; !got && salt < 20000; salt++) got = deal(spec, rng(hash(`bag-${live}-${salt}`)));
  if (!got) throw new Error(`${live}: no board found`);
  const row = { num: rows.length + 1, quizId: `bag-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  Object.assign(row, { band: intro ? 'intro' : spec[0], shop: spec[1], reach: got.reach, bags: got.bags, items: got.items, sol: got.sol });
  console.log(`${live} ${row.band.padEnd(8)} ${spec[1].padEnd(13)} ${String(got.items.length).padStart(2)} items ${got.items.reduce((a, x) => a + x.w, 0)}/${got.bags.reduce((a, b) => a + b.limit, 0)} lb  forgiving ${(got.ease * 100).toFixed(0)}%  (deal ${salt})`);
  rows.push(row); save(rows);
  day.setUTCDate(day.getUTCDate() + 1);
}
console.log(`bag: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
}
