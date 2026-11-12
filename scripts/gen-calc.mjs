// Generates the Calc bank. Time-boxed and checkpointed: run it repeatedly and it
// resumes, because a hard Saturday can take a minute of searching on its own.
//
//   node --stack-size=12000 scripts/gen-calc.mjs <from YYYY-MM-DD> <days> <startNum> [seconds]
//
// Difficulty is TWO dials, and neither is the grid alone:
//   routes  how many of the board's legal routes hit the target. This is the
//           main ramp: 100-ish on a Monday, 2 on a Saturday.
//   minLen  the length of the SHORTEST route that hits it. Capped per weekday,
//           because without a cap the search happily returns unique targets that
//           need a 27-button snake, which no player will ever find by hand.
// Sunday is the Edition: THREE targets on the one board, easiest first.
//
// DETERMINISTIC AND APPEND-ONLY (December 2026 restock, 2026-11-12). The first
// version drew on Math.random and wrote bank.json into the working directory,
// so no run could be reproduced. Now every day draws from a PRNG seeded off its
// own board NUMBER (SEED_BASE + num * 7919), so a re-run, or a resume after a
// timebox, rebuilds the identical board, and a new segment can never replay a
// frozen one. The checkpoint lives under /tmp/build (CALC_CKPT overrides it),
// days the live bank already holds are refused, and --splice appends the
// checkpoint's boards after the bank's last day, refusing any date or num that
// is already banked or out of sequence:
//
//   rm -f /tmp/build/calc-ckpt.json
//   node --stack-size=12000 scripts/gen-calc.mjs 2026-12-01 31 99 600   (repeat until ALL DONE)
//   node scripts/gen-calc.mjs --splice
//   node scripts/verify-calc.mjs
//
// VARIETY: a target number may appear at most TARGET_CEILING times across the
// whole bank (scripts/verify-calc.mjs enforces the same ceiling), and no board
// may repeat a banked grid.
import fs from 'fs';
import { enumerate, solveFor } from './calc-core.mjs';

const OPS = ['+', '-', '*', '/'];
const SEED_BASE = 0x43414c43; // "CALC"
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
let rand = null;
const rnd = (a) => a[(rand() * a.length) | 0];
const mkBoard = (n) => {
  const v = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
    v.push((r + c) % 2 === 0 ? String(1 + ((rand() * 9) | 0)) : rnd(OPS));
  return v;
};
const TARGET_CEILING = 3;
// A 7x7 past this many routes is dense enough that every target has hundreds of
// solutions, so it is useless AND slow. Rejecting early costs a fraction of a second.
const CAP = { 6: 1500000, 7: 400000 };
// weekday index (0=Sun) -> { n, bands: [[minRoutes, maxRoutes, maxShortest], ...] }
export const SPEC = {
  1: { n: 6, bands: [[40, 400, 13]] },
  2: { n: 6, bands: [[15, 39, 13]] },
  3: { n: 6, bands: [[5, 14, 15]] },
  4: { n: 7, bands: [[25, 300, 15]] },
  5: { n: 7, bands: [[8, 24, 17]] },
  6: { n: 7, bands: [[2, 7, 17]] },
  0: { n: 7, bands: [[25, 300, 17], [8, 24, 19], [1, 4, 19]] },
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtLabel = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
const fmtQuiz = (d) => `calc-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
const iso = (d) => d.toISOString().slice(0, 10);

const FILE = process.env.CALC_CKPT || '/tmp/build/calc-ckpt.json';
const BANK = new URL('../app/calc/puzzles.js', import.meta.url);
const { PUZZLES: LIVE } = await import(BANK.href);
const lastLive = LIVE[LIVE.length - 1];

if (process.argv[2] === '--splice') {
  // Append the checkpoint's boards after the bank's last day, in the bank's own
  // textual shape. Every banked row is left byte-identical.
  const ck = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const rows = Object.keys(ck).sort().map((k) => ck[k]);
  let prev = lastLive;
  for (const p of rows) {
    const want = new Date(`${prev.live}T12:00:00Z`); want.setUTCDate(want.getUTCDate() + 1);
    if (p.live !== want.toISOString().slice(0, 10) || p.num !== prev.num + 1) { console.error(`splice: ${p.live} #${p.num} does not follow ${prev.live} #${prev.num}; nothing written`); process.exit(1); }
    prev = p;
  }
  const q = (v) => `'${v}'`;
  const text = rows.map((p) => `  {
    num: ${p.num},
    quizId: ${q(p.quizId)},
    live: ${q(p.live)},
    dateLabel: ${q(p.dateLabel)},
    sunday: ${p.sunday},
    n: ${p.n},
    boardRoutes: ${p.boardRoutes},
    cells: [${p.cells.map(q).join(',')}],
    targets: [
${p.targets.map((t) => `      { target: ${t.target}, routes: ${t.routes}, minLen: ${t.minLen}, path: [${t.path.join(',')}] },`).join('\n')}
    ],
  },`).join('\n');
  const src = fs.readFileSync(BANK, 'utf8');
  const close = src.lastIndexOf('];');
  fs.writeFileSync(BANK, src.slice(0, close) + text + '\n' + src.slice(close));
  console.log(`calc: +${rows.length} boards, ${rows[0].live} -> ${rows.at(-1).live}`);
  process.exit(0);
}

const [from, daysArg, startNumArg, secsArg] = process.argv.slice(2);
const DAYS = +daysArg || 30, START = +startNumArg || 1, SECS = +secsArg || 95;
fs.mkdirSync('/tmp/build', { recursive: true });
const bank = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const DEADLINE = Date.now() + SECS * 1000;
// The past is frozen: refuse any day the live bank already holds, and any
// numbering that does not carry on from it.
if (from <= lastLive.live) { console.error(`gen-calc: ${from} is already banked (bank runs to ${lastLive.live}); THE PAST IS FROZEN`); process.exit(1); }
const gap = Math.round((Date.parse(`${from}T12:00:00Z`) - Date.parse(`${lastLive.live}T12:00:00Z`)) / 864e5);
if (START !== lastLive.num + gap) { console.error(`gen-calc: startNum ${START} should be ${lastLive.num + gap} after #${lastLive.num} ${lastLive.live}`); process.exit(1); }
// Variety ledger over the live bank plus whatever the checkpoint already holds.
const targetUse = new Map(); const grids = new Set();
for (const p of [...LIVE, ...Object.values(bank)]) {
  grids.add(p.cells.join(''));
  for (const t of p.targets) targetUse.set(t.target, (targetUse.get(t.target) || 0) + 1);
}

for (let k = 0; k < DAYS; k++) {
  const d = new Date(Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + k);
  const key = iso(d);
  if (bank[key]) continue;
  if (Date.now() > DEADLINE) { fs.writeFileSync(FILE, JSON.stringify(bank)); console.log(`TIMEBOX at ${key}, ${Object.keys(bank).length} banked`); process.exit(0); }
  const dow = d.getUTCDay(), { n, bands } = SPEC[dow];
  rand = mulberry32(SEED_BASE + (START + k) * 7919);
  let tries = 0, dense = 0; const t0 = Date.now();
  for (;;) {
    if (Date.now() > DEADLINE) { fs.writeFileSync(FILE, JSON.stringify(bank)); console.log(`TIMEBOX mid-${key} after ${tries} boards, ${Object.keys(bank).length} banked`); process.exit(0); }
    tries++;
    const cells = mkBoard(n);
    if (grids.has(cells.join(''))) continue;
    let res; try { res = enumerate(n, cells, CAP[n]); } catch (e) { dense++; continue; }
    if (res.routes < 800) continue;
    const ent = [...res.totals.entries()].filter(([t]) => t >= 12 && t <= 999);
    const picks = []; const used = new Set(); let ok = true;
    for (const [lo, hi, maxLen] of bands) {
      const c = ent.filter(([t, x]) => !used.has(t) && (targetUse.get(t) || 0) < TARGET_CEILING && x.count >= lo && x.count <= hi && x.minLen <= maxLen && x.minLen >= 9);
      if (!c.length) { ok = false; break; }
      const p = c[(rand() * c.length) | 0]; picks.push(p); used.add(p[0]);
    }
    if (!ok) continue;
    const targets = picks.map(([target, x]) => {
      const s = solveFor(n, cells, target);
      if (s.count !== x.count || s.best.length !== x.minLen) throw new Error('solver disagrees on ' + target);
      return { target, routes: s.count, minLen: s.best.length, path: s.best };
    }).sort((a, b) => b.routes - a.routes);
    bank[key] = {
      num: START + k, quizId: fmtQuiz(d), live: key, dateLabel: fmtLabel(d),
      sunday: dow === 0, n, cells, boardRoutes: res.routes, targets,
    };
    grids.add(cells.join('')); for (const t of targets) targetUse.set(t.target, (targetUse.get(t.target) || 0) + 1);
    console.log(`${key} ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]} n=${n} routes=${res.routes} ` +
      targets.map((t) => `${t.target}[${t.routes}/${t.minLen}]`).join(' ') + ` boards=${tries} dense=${dense} ${Date.now() - t0}ms`);
    fs.writeFileSync(FILE, JSON.stringify(bank));
    break;
  }
}
fs.writeFileSync(FILE, JSON.stringify(bank));
console.log(`ALL DONE — ${Object.keys(bank).length} boards banked`);
