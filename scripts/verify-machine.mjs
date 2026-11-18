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
//   node scripts/verify-machine.mjs [--fast]   (--fast: 20px instead of 10px)
import { PUZZLES } from '../app/machine/puzzles.js';
import { run, makeState, pieceSegs, C } from '../lib/machine-engine.js';
import { fairness, FAIR_MIN, sense, layout } from './gen-machine-bank.mjs';

const STEP = process.argv.includes('--fast') ? 20 : 10;
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
  for (const p of P.pieces) if (p.wires) for (const id of p.wires) if (!P.pieces.some((q) => q.id === id)) bad(n, `wire to missing ${id}`);
  // Sunday
  if (P.sunday) {
    if (dow(P.live) !== 0) bad(n, 'sunday flag on a weekday');
    const wk = PUZZLES.filter((q) => !q.sunday && q.live < P.live).slice(-6);
    if (wk.length && !(P.tray.length > Math.max(...wk.map((q) => q.tray.length)) || P.w * P.h > Math.max(...wk.map((q) => q.w * q.h)))) bad(n, 'Sunday is not bigger than its week');
  } else if (dow(P.live) === 0 && PUZZLES.some((q) => q.sunday)) bad(n, 'a Sunday board without the sunday flag');
  // the stored machine
  const R = rules(P);
  const sol = (P.sol || []).map((q) => ({ ...P.tray[q.ti], dir: q.dir || P.tray[q.ti].dir, px: q.px, py: q.py }));
  if (!sol.length) bad(n, 'no stored machine');
  if (new Set((P.sol || []).map((q) => q.ti)).size !== sol.length) bad(n, 'stored machine uses a tray part twice');
  sol.forEach((p, i) => { if (!R.fits(p, sol.filter((_, j) => j !== i))) bad(n, `stored part ${i} (${p.t}) does not fit`); });
  if (!run(P, sol).won) bad(n, 'the stored machine does not win');
  if (P.tray.every((t, i) => (P.sol || []).some((q) => q.ti === i))) bad(n, 'every tray part is used: the copy promises a spare');
  // the empty board, and every single part
  const s0 = run(P, [], 1800, true);
  if (s0.won) bad(n, 'the empty board wins');
  const kinds = [];
  for (const t of P.tray) for (const d of (t.dir ? [...new Set([t.dir, 'l', 'r'])] : [undefined])) kinds.push(d ? { ...t, dir: d } : { ...t }); // every way Flip can set it (an upward fan flips to l, then r)
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
    const why = sense(P, P.band); if (why) bad(n, why);
    // a generated board must be exactly what its seed lays out: no hand edits behind the generator's back
    if (P.seed !== undefined) {
      const G = layout(P.seed, P.band); const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      if (!G || !same(G.pieces, P.pieces) || !same(G.balls, P.balls) || !same(G.goal, P.goal) || !same(G.tray, P.tray) || G.w !== P.w || G.h !== P.h) bad(n, `does not match seed ${P.seed} (edited by hand, or the generator changed without a GEN bump)`);
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
