// verify-machine: the Machine bank (app/machine/puzzles.js), discovered by
// scripts/verify-all.mjs. Runs every board through the real engine
// (lib/machine-engine.js, the same code the page plays) and checks the rules in
// the bank's header:
//   - ranges and shape (dates in order, quiz ids, sizes, tray, goal);
//   - the stored machine fits and WINS, and the empty board does not;
//   - NO SINGLE TRAY PART WINS: every part (both ways round when it flips) is
//     tried at every 10px spot whose box touches a cell a ball passed through
//     in the empty run. A part nowhere near a ball cannot change the run, so the
//     pruning loses nothing;
//   - at least one tray part is not in the stored machine;
//   - a Sunday board is on a Sunday and is bigger (more tray parts or cells).
// Shown to fail on a board whose stored machine misses, and on one a single
// spring solves.
// Boards from 2026-11-20 follow THE LADDER (scripts/gen-machine-bank.mjs
// recipeFor): Monday and Tuesday are v1 boards built to the old Wednesday and
// Friday recipes, Wednesday to Sunday are v2 CHAIN boards (gen-machine-v2.mjs:
// three balls and three needed parts midweek, four on Friday, Saturday and
// Sunday). A chain board must win, must miss when any one stored part is taken
// away, must show a step for every link, and must be exactly what its seed
// builds. --deep also re-proves that no two parts can win one (30px grid).
// Shown to fail on a chain board with a part nudged off, on one with a fixed
// piece edited, and on a Thursday carrying a v1 board.
//   node scripts/verify-machine.mjs [--fast] [--deep] [--only 9,10]
//   (--fast: 20px instead of 10px; --deep: the full two-part sweep on chain
//   boards; --only: just those board numbers, for iterating, never the gate)
import { PUZZLES } from '../app/machine/puzzles.js';
import { run, makeState, pieceSegs, C } from '../lib/machine-engine.js';
import { fairness, FAIR_MIN, sense, layout, recipesFor } from './gen-machine-bank.mjs';
import { GEN2, GEN3, build2, check2cheap, twoPartWin, qtyOf, trayParts, asPart } from './gen-machine-v2.mjs';

const STEP = process.argv.includes('--fast') ? 20 : 10;
const DEEP = process.argv.includes('--deep'); // also re-prove that no two parts win a v2 board (minutes a board)
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i >= 0 ? new Set(process.argv[i + 1].split(',').map(Number)) : null; })(); // --only 9,10: just those board numbers (for iterating; not the gate)
const LADDER_FROM = '2026-11-20'; // boards from here follow recipeFor (the 2026-11-19 ladder)
let fails = 0;
const bad = (n, m) => { fails++; console.log(`✗ #${n}: ${m}`); };
const TYPES = new Set(['shelf', 'crate', 'wall', 'post', 'floor', 'door', 'button', 'plunger', 'hoop', 'bucket', 'bell', 'balloon', 'ramp', 'spring', 'belt', 'bumper', 'fan', 'seesaw', 'pipe', 'magnet', 'dominoes', 'cannon', 'glue', 'gate']);
const TRAY = new Set(['ramp', 'spring', 'belt', 'bumper', 'fan', 'pipe', 'magnet', 'glue', 'gate']);
const KINDS = new Set(['bowling', 'basket', 'tennis', 'steel']);

function segBox(segs) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of segs) { x0 = Math.min(x0, s.ax - s.th, s.bx - s.th); y0 = Math.min(y0, s.ay - s.th, s.by - s.th); x1 = Math.max(x1, s.ax + s.th, s.bx + s.th); y1 = Math.max(y1, s.ay + s.th, s.by + s.th); }
  return [x0, y0, x1, y1];
}
// the same overlap rule as lib/machine-ui.js placementRules
function rules(L) {
  const fixed = L.pieces.filter((p) => p.t !== 'hoop').map((p) => segBox(pieceSegs({ ...p, tilt: p.tilt || -1, fall: -1 })));
  for (const p of L.pieces) if (p.t === 'hoop') fixed.push([p.x * C, p.y * C, p.x * C + C, p.y * C + C]);
  for (const b of makeState(L, []).balls) if (b.live) fixed.push([b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r]);
  const hits = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const box = (p) => { const b = segBox(pieceSegs(p)); return [b[0] + 1, b[1] + 1, b[2] - 1, b[3] - 1]; };
  const fits = (p, others) => { const b = box(p); if (b[0] < 0 || b[1] < 0 || b[2] > L.w * C || p.py + C > L.h * C + 2) return false; if (fixed.some((f) => hits(f, b))) return false; return !others.some((o) => hits(box(o), b)); };
  return { box, fits, hits };
}
const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const T0 = Date.now();
let prev = null;
for (const P of PUZZLES) {
  const n = P.num;
  if (ONLY && !ONLY.has(n)) { prev = P; continue; }
  // shape
  if (prev && P.num !== prev.num + 1) bad(n, `num follows ${prev.num}`);
  if (prev && !(P.live > prev.live)) bad(n, `live ${P.live} not after ${prev.live}`);
  const [y, m, d] = P.live.split('-').map(Number);
  if (P.quizId !== `machine-${m}-${d}-${String(y).slice(2)}`) bad(n, `quizId ${P.quizId} does not match live ${P.live}`);
  if (!['gentle', 'moderate', 'tough', 'sunday'].includes(P.band)) bad(n, `band ${P.band}`);
  if (!P.title || !P.goalText || /—/.test(P.title + P.goalText)) bad(n, 'title/goalText missing or has an em dash');
  if (!(P.w >= 10 && P.w <= 20 && P.h >= 7 && P.h <= 14)) bad(n, `size ${P.w}x${P.h} out of range`);
  for (const p of P.pieces) if (!TYPES.has(p.t)) bad(n, `unknown piece ${p.t}`);
  for (const b of P.balls) if (!KINDS.has(b.kind)) bad(n, `unknown ball ${b.kind}`);
  if (!P.goal || !['hoop', 'bucket', 'bell', 'balloon'].includes(P.goal.type)) bad(n, 'goal type');
  if (P.goal && P.goal.ball && !P.balls.some((b) => b.id === P.goal.ball)) bad(n, `goal ball ${P.goal.ball} missing`);
  if (!(P.tray.length >= 3 && P.tray.length <= 6)) bad(n, `tray of ${P.tray.length}`);
  for (const t of P.tray) if (!TRAY.has(t.t)) bad(n, `tray part ${t.t}`);
  // STACKS (v3, 2026-11-21): a tray entry may hold 2 to 4 copies (`qty`), shown as the count on its chip
  for (const t of P.tray) if (t.qty !== undefined && !(Number.isInteger(t.qty) && t.qty >= 2 && t.qty <= 4)) bad(n, `stack of ${t.qty} ${t.t}`);
  if (P.tray.some((t) => t.qty) && P.gen !== GEN3) bad(n, 'a stack in the tray of a board that is not v3');
  if (new Set(P.tray.map((t) => t.t)).size !== P.tray.length && P.gen === GEN3) bad(n, 'a v3 tray shows one part as two stacks');
  for (const p of P.pieces) if (p.wires) for (const id of p.wires) if (!P.pieces.some((q) => q.id === id)) bad(n, `wire to missing ${id}`);
  // Sunday
  if (P.sunday) {
    if (dow(P.live) !== 0) bad(n, 'sunday flag on a weekday');
    const wk = PUZZLES.filter((q) => !q.sunday && q.live < P.live).slice(-6);
    if (wk.length && !(trayParts(P) > Math.max(...wk.map((q) => trayParts(q))) || P.w * P.h > Math.max(...wk.map((q) => q.w * q.h)))) bad(n, 'Sunday is not bigger than its week');
  } else if (dow(P.live) === 0 && PUZZLES.some((q) => q.sunday)) bad(n, 'a Sunday board without the sunday flag');
  // the stored machine
  const R = rules(P);
  const sol = (P.sol || []).map((q) => ({ ...asPart(P.tray[q.ti]), dir: q.dir || P.tray[q.ti].dir, px: q.px, py: q.py }));
  if (!sol.length) bad(n, 'no stored machine');
  const useOf = (i) => (P.sol || []).filter((q) => q.ti === i).length;
  if ((P.sol || []).some((q) => !P.tray[q.ti])) bad(n, 'stored machine names a tray part that is not there');
  else if (P.tray.some((t, i) => useOf(i) > qtyOf(t))) bad(n, 'stored machine uses more copies of a part than the tray holds');
  sol.forEach((p, i) => { if (!R.fits(p, sol.filter((_, j) => j !== i))) bad(n, `stored part ${i} (${p.t}) does not fit`); });
  if (!run(P, sol).won) bad(n, 'the stored machine does not win');
  if (P.tray.every((t, i) => useOf(i) >= qtyOf(t))) bad(n, 'every tray part is used: the copy promises a spare');
  // the empty board, and every single part
  const s0 = run(P, [], 1800, true);
  if (s0.won) bad(n, 'the empty board wins');
  const kinds = [];
  for (const t0 of P.tray) { const t = asPart(t0); for (const d of (t.dir ? [...new Set([t.dir, 'l', 'r'])] : [undefined])) kinds.push(d ? { ...t, dir: d } : { ...t }); } // every way Flip can set it (an upward fan flips to l, then r)
  const seen = new Set(); let sims = 0;
  for (const k of kinds) {
    const sig = k.t + (k.dir || '');
    if (seen.has(sig)) continue; seen.add(sig);
    const field = k.t === 'fan' || k.t === 'magnet';
    for (let py = 0; py <= P.h * C - C; py += STEP) for (let px = 0; px <= P.w * C - C; px += STEP) {
      const p = { ...k, px, py };
      if (!R.fits(p, [])) continue;
      if (!field) {
        const b = R.box(p);
        let near = false;
        for (const v of s0.visited) { const x = Math.floor(v / 100), yy = v % 100; if (R.hits(b, [x * C - 40, yy * C - 40, x * C + C + 40, yy * C + C + 40])) { near = true; break; } }
        if (!near) continue;
      }
      sims++;
      if (run(P, [p], 1800).won) { bad(n, `one part wins: ${sig} at ${px},${py}`); break; }
    }
  }
  // FAIRNESS (boards from 2026-11-20, owner 2026-11-18: "error proof"): nudging any
  // one part of the stored machine 10px in any direction still wins at least
  // FAIR_MIN of the time, so the answer is findable by eye, not a pixel hunt.
  if (P.live >= '2026-11-20') {
    const lay = P.lay || P.band, v2 = P.gen === GEN2 || P.gen === GEN3;
    // THE LADDER (owner, 2026-11-19: Thursday was "far too easy"): each weekday is built to its recipe
    if (P.live >= LADDER_FROM) { const ok = recipesFor(P.live); if (!ok.some((w) => P.gen === w.gen && lay === w.lay)) bad(n, `built as ${P.gen || 'hand'}/${lay}, the ladder wants ${ok.map((w) => `${w.gen}/${w.lay}`).join(' or ')} on this weekday`); }
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (v2) {
      // a chain board: three or four links, every stored part needed, a step for every link
      const c = check2cheap(P, lay, P.sol || [], P.gen); if (!c.ok) bad(n, c.why);
      if (!P.goal.ball) bad(n, 'a chain board names the ball that has to finish the job');
      // and it must be exactly what its seed builds: no hand edits behind the generator's back
      const G = build2(P.seed, lay, P.gen);
      if (!G || !same(G.L.pieces, P.pieces) || !same(G.L.balls, P.balls) || !same(G.L.goal, P.goal) || !same(G.L.tray, P.tray) || !same(G.sol, P.sol) || G.L.w !== P.w || G.L.h !== P.h) bad(n, `does not match seed ${P.seed} (edited by hand, or the generator changed without a GEN2 bump)`);
      if (DEEP && (P.sol || []).length >= 3) { const two = twoPartWin(P, 30); if (two) bad(n, `two parts win: ${two.pair.map((q) => `${q.t}${q.dir || ''} at ${q.px},${q.py}`).join(' + ')}`); }
    } else {
      const why = sense(P, lay); if (why) bad(n, why);
      if (P.seed !== undefined) {
        const G = layout(P.seed, lay);
        if (!G || !same(G.pieces, P.pieces) || !same(G.balls, P.balls) || !same(G.goal, P.goal) || !same(G.tray, P.tray) || G.w !== P.w || G.h !== P.h) bad(n, `does not match seed ${P.seed} (edited by hand, or the generator changed without a GEN bump)`);
      }
    }
    const f = fairness(P, P.sol || []);
    if (f < FAIR_MIN) bad(n, `stored machine is a pixel hunt: ${(f * 100).toFixed(0)}% of 10px nudges still win (need ${FAIR_MIN * 100}%)`);
  }
  console.log(`  #${n} ${P.live} ${P.title}: stored machine wins, ${sims} single-part runs all miss`);
  prev = P;
}
{ // RUNWAY: say so loudly when the bank is about to run dry (restock: scripts/gen-machine-bank.mjs)
  const lastLive = PUZZLES[PUZZLES.length - 1].live;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const left = Math.round((Date.parse(lastLive) - Date.parse(today)) / 864e5);
  if (left < 10) console.log(`! the Machine bank ends ${lastLive} (${left} day(s) left): node scripts/gen-machine-bank.mjs --through <date>`);
}
console.log(fails ? `verify-machine: ${fails} failure(s)` : `verify-machine: ok (${PUZZLES.length} boards, ${((Date.now() - T0) / 1000).toFixed(0)}s, ${STEP}px)`);
process.exit(fails ? 1 : 0);
