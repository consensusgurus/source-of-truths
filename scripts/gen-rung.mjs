// scripts/gen-rung.mjs — Rung bank generator (added 2026-09-23 for the Nov 2026
// restock). Deterministic: each board is seeded off its own num, so a re-run
// reproduces the same output and never replays a frozen board.
//
//   node scripts/gen-rung.mjs --from 2026-11-01 --days 30 --startnum 95
//
// Prints board objects ready to splice before the closing `];` of PUZZLES in
// app/rung/puzzles.js. The rules it builds to are the header of that file and
// scripts/verify-rung.mjs:
//   * par is the EXACT BFS shortest ladder over VOCAB; weekdays land 10 to 12
//     (spread across all three, not parked on the floor), Sundays 15 or more;
//   * routes = number of distinct shortest ladders (cap 9999), kept small (<= 6)
//     so matching perfect stays a real find;
//   * start and target are familiar words (zipf >= MIN_ZIPF in the site's
//     frequency list, no names or slang), and NEITHER word has been used as a
//     start or target anywhere in the bank before, so the start/target pools
//     stay fully fresh (the start-word collapse verify-rung was written for);
//   * the example is one shortest ladder, choosing the most familiar word at
//     each step so the post-game reveal reads cleanly.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PUZZLES, VOCAB } from '../app/rung/puzzles.js';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-11-01');
const DAYS = +arg('--days', 30);
const STARTNUM = +arg('--startnum', 95);
const MIN_ZIPF = 3.8;
const MAX_ROUTES = 6;
// Names, nicknames and slang the vocabulary happens to carry: never a start or target.
const BLOCK = new Set(('benny billy bobby brent brock butch chico chino cisco daddy derry dixie dolly donna '
  + 'emery gemma gonna harry hogan hubby jenny jerry kelly kinda logan mamma maria marge merle missy molly '
  + 'mommy monte nancy nelly paddy patsy patty perry peter randy roger romeo sally sissy sonny tammy terry '
  + 'wally dutch swede roman booty pubic queer urine lynch mafia kraft conte monde hurst playa footy telly '
  + 'lorry intel inter admin login sighs pleas highs paths moths myths baths kinds goods woods specs '
  + 'crore firth fitch takin barre carte forte matte serge swain twain wight rowan seine stein padre pasha').split(' '));

const freq = JSON.parse(readFileSync(join(here, '.lode-freq.json'), 'utf8'));
const z = (w) => freq[w] ?? 0;

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// adjacency
const buckets = new Map();
for (const w of VOCAB) for (let i = 0; i < 5; i++) { const k = w.slice(0, i) + '_' + w.slice(i + 1); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(w); }
const ADJ = new Map(VOCAB.map((w) => [w, []]));
for (const l of buckets.values()) for (let a = 0; a < l.length; a++) for (let b = a + 1; b < l.length; b++) { ADJ.get(l[a]).push(l[b]); ADJ.get(l[b]).push(l[a]); }

function bfs(s) {
  const d = new Map([[s, 0]]); const q = [s];
  for (let h = 0; h < q.length; h++) { const u = q[h]; for (const v of ADJ.get(u)) if (!d.has(v)) { d.set(v, d.get(u) + 1); q.push(v); } }
  return d;
}
function routes(ds, t) {
  const order = [...ds.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
  const p = new Map([[order[0], 1]]);
  for (const u of order.slice(1)) { let s = 0; for (const v of ADJ.get(u)) if (ds.get(v) === ds.get(u) - 1) s += p.get(v) || 0; p.set(u, Math.min(s, 1e7)); }
  return Math.min(p.get(t), 9999);
}
function example(s, t, dt) {
  // walk from target back toward start through the most familiar predecessor
  const ds = bfs(s); const path = [t]; let u = t;
  while (u !== s) { const c = ADJ.get(u).filter((v) => ds.get(v) === ds.get(u) - 1 && dt.get(v) === dt.get(u) + 1); c.sort((a, b) => z(b) - z(a) || (a < b ? -1 : 1)); u = c[0]; path.push(u); }
  return path.reverse();
}

const used = new Set();
for (const p of PUZZLES) { used.add(p.start); used.add(p.target); }
const FAMILIAR = VOCAB.filter((w) => z(w) >= MIN_ZIPF && !BLOCK.has(w));

const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const out = [];
let wk = 0; // weekday counter to rotate par targets 10/11/12
for (let d = 0; d < DAYS; d++) {
  const live = addDays(FROM, d), num = STARTNUM + d;
  const sunday = new Date(live + 'T12:00:00Z').getUTCDay() === 0;
  const r = rng(num * 7907 + 3);
  const wantPar = sunday ? [15, 16, 17, 18][Math.floor(r() * 4)] : [11, 10, 12][wk++ % 3];
  let found = null;
  for (let t = 0; t < 400000 && !found; t++) {
    const s = FAMILIAR[Math.floor(r() * FAMILIAR.length)];
    if (used.has(s)) continue;
    const ds = bfs(s);
    const cands = FAMILIAR.filter((w) => !used.has(w) && w !== s && ds.get(w) === wantPar);
    if (!cands.length) continue;
    for (let k = 0; k < 8 && !found; k++) {
      const tg = cands[Math.floor(r() * cands.length)];
      const rt = routes(ds, tg);
      if (rt > MAX_ROUTES) continue;
      const ex = example(s, tg, bfs(tg));
      if (ex.some((w) => BLOCK.has(w))) continue;
      found = { s, tg, rt, ex };
    }
  }
  if (!found) throw new Error(`no ladder for ${live} at par ${wantPar}`);
  used.add(found.s); used.add(found.tg);
  const [y, m, dd] = live.split('-').map(Number);
  out.push(`  {
    num: ${num},
    quizId: 'rung-${m}-${dd}-${String(y).slice(2)}',
    live: '${live}',
    dateLabel: '${MONTHS[m - 1]} ${dd}, ${y}',
    sunday: ${sunday},
    par: ${wantPar},
    start: '${found.s}',
    target: '${found.tg}',
    routes: ${found.rt},
    example: ${JSON.stringify(found.ex)},
  },`);
}
process.stdout.write(out.join('\n') + '\n');
