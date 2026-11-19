// gen-machine-bank: restock the Machine bank (app/machine/puzzles.js) in one
// repeatable, checked command. Owner, 2026-11-18: "Build out machine now ...
// Need to make this error proof and repeatable."
//
//   node scripts/gen-machine-bank.mjs --through 2026-12-06            build + write
//   node scripts/gen-machine-bank.mjs --through 2026-12-06 --dry      build, print, write nothing
//   node scripts/gen-machine-bank.mjs --replace 2026-11-22,2026-11-29  rebuild future boards in place
//   node scripts/gen-machine-bank.mjs --replace D --pin D=SEED       rebuild a board from its recorded seed
//   node scripts/gen-machine-bank.mjs --one 2026-11-22                one date, JSON to stdout
//
// What it does, and the guards that make it safe to rerun:
//   * Appends one board per missing date after the bank's last board, through
//     --through. It NEVER edits or reorders a board already in the bank, and it
//     refuses any date that is not after today in New York (a live board is
//     frozen: the physics would replay it differently).
//   * Each date has a fixed seed sequence (hash of the date, then +1, +2 ...),
//     and the winning seed is stored on the board (`seed`, `gen`). Same script
//     version + same date = same board, so a rerun reproduces the bank exactly.
//   * Every candidate is a random layout from a small set of motifs (kick ball on
//     a top shelf, trapdoor cage + button, pits, shelves, crates, walls,
//     bumpers, one-way gates) run through the REAL engine (lib/machine-engine.js)
//     and kept only if it meets every verify-machine rule:
//       - the empty board does not win;
//       - no single tray part wins anywhere (10px, both ways round);
//       - a two-part machine wins (that becomes the stored `sol`);
//       - at least one tray part is spare;
//       - plus FAIRNESS (also enforced by verify-machine from 2026-11-20): nudging
//         any one part of the stored machine 10px in any direction still wins at
//         least FAIR_MIN of the time, so a solution is findable by eye, not a
//         pixel hunt.
//   * Band by weekday: Mon/Tue gentle, Wed/Thu moderate, Fri/Sat tough, Sun the
//     Sunday Edition. THE LADDER (owner, 2026-11-19: "today's machine is far too
//     easy for a thursday. need more machine elements and steps"): what is built
//     behind each label is set by recipeFor below. Monday and Tuesday are the
//     boards described here (v1, two parts), built to the old Wednesday and
//     Friday recipes. Wednesday to Sunday are v2 CHAIN boards from
//     scripts/gen-machine-v2.mjs: three balls and three needed parts midweek,
//     four on Friday, Saturday and Sunday. A board stores the recipe it was
//     built to as `lay` when that differs from its band.
//   * Titles and goal lines are written from the board's own features, never
//     repeating a title already in the bank, with no em dashes.
//   * After writing, it runs scripts/verify-machine.mjs on the whole bank and
//     exits non-zero if anything fails. A failed run leaves the file untouched:
//     the new bank is written to a temp file, verified, then moved into place.
// Two dates build in parallel (--jobs, default 2).
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn, spawnSync } from 'child_process';
import { run, makeState, pieceSegs, C } from '../lib/machine-engine.js';
import { GEN2, build2, check2, goalText2, titlePools2 } from './gen-machine-v2.mjs';

const GEN = 'v1';
export const FAIR_MIN = 0.25;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANK = path.join(ROOT, 'app/machine/puzzles.js');
const MAXT = 1800;

/* ---------- rng ---------- */
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 1e7; }
function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- placement rules: the same as verify-machine and lib/machine-ui ---------- */
function segBox(segs) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of segs) { x0 = Math.min(x0, s.ax - s.th, s.bx - s.th); y0 = Math.min(y0, s.ay - s.th, s.by - s.th); x1 = Math.max(x1, s.ax + s.th, s.bx + s.th); y1 = Math.max(y1, s.ay + s.th, s.by + s.th); } return [x0, y0, x1, y1]; }
export function rules(L) {
  const fixed = L.pieces.filter((p) => p.t !== 'hoop').map((p) => segBox(pieceSegs({ ...p, tilt: p.tilt || -1, fall: -1 })));
  for (const p of L.pieces) if (p.t === 'hoop') fixed.push([p.x * C, p.y * C, p.x * C + C, p.y * C + C]);
  for (const b of makeState(L, []).balls) if (b.live) fixed.push([b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r]);
  const hits = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const box = (p) => { const b = segBox(pieceSegs(p)); return [b[0] + 1, b[1] + 1, b[2] - 1, b[3] - 1]; };
  const fits = (p, others) => { const b = box(p); if (b[0] < 0 || b[1] < 0 || b[2] > L.w * C || p.py + C > L.h * C + 2) return false; if (fixed.some((f) => hits(f, b))) return false; return !others.some((o) => hits(box(o), b)); };
  return { box, fits, hits };
}
// Every way round a player can set a part: Flip turns any dir into l or r (an
// upward fan flips to l, then r), so a part with a dir can sit as itself, l or r.
export const reach = (t) => (t.dir ? [...new Set([t.dir, 'l', 'r'])] : [undefined]);
function kindsOf(L) { const k = []; L.tray.forEach((t, ti) => { for (const d of reach(t)) k.push(d ? { ...t, dir: d, ti } : { ...t, ti }); }); return k; }
function cands(L, R, V, others, STEP, pad) {
  const out = [];
  for (const k of kindsOf(L)) {
    if (others.some((o) => o.ti === k.ti)) continue;
    for (let py = 0; py <= L.h * C - C; py += STEP) for (let px = 0; px <= L.w * C - C; px += STEP) {
      const p = { ...k, px, py }; if (!R.fits(p, others)) continue;
      const b = R.box(p); let rel = (k.t === 'fan' || k.t === 'magnet');
      if (!rel) for (const v of V) { const x = Math.floor(v / 100), y = v % 100; if (R.hits(b, [x * C - pad, y * C - pad, x * C + C + pad, y * C + C + pad])) { rel = true; break; } }
      if (rel) out.push(p);
    }
  }
  return out;
}
const placed = (L, sol) => sol.map((q) => ({ ...L.tray[q.ti], dir: q.dir || L.tray[q.ti].dir, px: q.px, py: q.py, ti: q.ti }));

// Fairness: nudge one part at a time by 10px in each of 8 directions; the share that still wins.
export function fairness(L, sol) {
  const R = rules(L); const parts = placed(L, sol); let ok = 0, tot = 0;
  parts.forEach((p, i) => {
    for (const dx of [-10, 0, 10]) for (const dy of [-10, 0, 10]) {
      if (!dx && !dy) continue;
      const q = { ...p, px: p.px + dx, py: p.py + dy }; const rest = parts.filter((_, j) => j !== i);
      if (!R.fits(q, rest)) continue; tot++; if (run(L, rest.concat([q]), MAXT).won) ok++;
    }
  });
  return tot ? ok / tot : 0;
}

/* ---------- layout ---------- */
export function layout(seed, band) {
  const sunday = band === 'sunday';
  const rng = mulberry(seed);
  const R = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const W = sunday ? 18 : 14, H = sunday ? 12 : 10;
  const occ = new Set(); const key = (x, y) => x + ',' + y;
  const take = (cells) => { if (cells.some(([x, y]) => x < 0 || y < 0 || x >= W || y >= H || occ.has(key(x, y)))) return false; cells.forEach(([x, y]) => occ.add(key(x, y))); return true; };
  const pieces = [], balls = [];
  const sw = R(3, 5);
  take([[0, 1], [1, 1]]); for (let i = 0; i < sw; i++) take([[i, 2]]);
  pieces.push({ t: 'plunger', x: 0, y: 1 }, { t: 'shelf', x: 0, y: 2, w: sw });
  balls.push({ id: 'red', kind: pick(['bowling', 'bowling', 'basket', 'steel', 'tennis', 'basket']), role: 'kick', x: 1, y: 1, vx: pick([2.0, 2.2, 2.4]) });
  const fy = H - 1; const floor = new Array(W).fill(true);
  for (let i = R(0, 2); i > 0; i--) { const pw = R(1, 2); const px = R(3, W - 3); for (let j = 0; j < pw; j++) if (px + j < W) floor[px + j] = false; }
  const trap = sunday || rng() < 0.55; // a Sunday always runs the trapdoor chain
  const goalBall = trap ? 'blue' : 'red';
  const gt = pick(['hoop', 'hoop', 'bucket', 'bell', 'bell', 'balloon']);
  if (gt === 'hoop' || gt === 'bucket') {
    const gx = pick([0, W - 1, R(2, W - 3)]);
    if (gt === 'hoop') { floor[gx] = false; pieces.push({ t: 'hoop', x: gx, y: fy }); take([[gx, fy]]); }
    else if (rng() < 0.4) { const sy = R(5, fy - 1); const sx = Math.max(0, Math.min(W - 2, gx)); if (!take([[sx, sy], [sx + 1, sy], [sx, sy - 1]])) return null; pieces.push({ t: 'shelf', x: sx, y: sy, w: 2 }, { t: 'bucket', x: sx, y: sy - 1 }); }
    else { if (!take([[gx, fy - 1]])) return null; pieces.push({ t: 'bucket', x: gx, y: fy - 1 }); }
  } else if (gt === 'bell') { const bx = pick([W - 1, R(4, W - 2)]), by = R(3, fy - 2); if (!take([[bx, by]])) return null; pieces.push({ t: 'bell', x: bx, y: by }); }
  else { const bx = R(4, W - 2), by = R(2, fy - 3); if (!take([[bx, by]])) return null; pieces.push({ t: 'balloon', x: bx, y: by }); }
  const goal = { type: gt }; if (gt === 'hoop' || gt === 'bucket') goal.ball = goalBall;
  for (let x = 0; x < W;) { if (!floor[x]) { x++; continue; } let e = x; while (e < W && floor[e]) e++; if (!take(Array.from({ length: e - x }, (_, i) => [x + i, fy]))) return null; pieces.push({ t: 'floor', x, y: fy, w: e - x }); x = e; }
  if (trap) {
    const cx = R(7, W - 2); if (cx + 1 >= W) return null;
    if (!take([[cx - 1, 1], [cx - 1, 2], [cx + 1, 1], [cx + 1, 2], [cx, 1], [cx, 2]])) return null;
    pieces.push({ t: 'post', x: cx - 1, y: 1, h: 2, side: 'r' }, { t: 'post', x: cx + 1, y: 1, h: 2, side: 'l' }, { t: 'door', x: cx, y: 2, id: 'trap' });
    let kind = pick(['basket', 'tennis', 'basket', 'steel']);
    // the goal names this ball by kind, so it may not match the kick ball (redraw only then, so
    // every layout that never collided is exactly what it was)
    if (goal.ball === 'blue') for (let g = 0; kind === balls[0].kind && g < 20; g++) kind = pick(['basket', 'tennis', 'basket', 'steel']);
    balls.push({ id: 'blue', kind, x: cx, y: 1 });
    const by = R(4, fy - 2), bxs = R(2, W - 4), bw = R(2, 5);
    const face = rng() < 0.5 ? 'l' : 'r'; const bx = face === 'l' ? Math.min(W - 1, bxs + bw - 1) : bxs;
    if (!take(Array.from({ length: bw }, (_, i) => [bxs + i, by + 1]).concat([[bx, by]]))) return null;
    pieces.push({ t: 'shelf', x: bxs, y: by + 1, w: bw }, { t: 'button', x: bx, y: by, face, wires: ['trap'] });
  }
  for (let i = sunday ? R(4, 7) : R(1, 3); i > 0; i--) {
    const o = pick(['shelf', 'shelf', 'shelf', 'crate', 'wall', 'bumper', 'gate']);
    if (o === 'shelf') { const y = R(3, fy - 1), w = R(2, 5), x = R(0, W - w); if (!take(Array.from({ length: w }, (_, j) => [x + j, y]))) continue; pieces.push({ t: 'shelf', x, y, w }); if (rng() < 0.35) { const cx = x + R(0, w - 1); if (take([[cx, y - 1]])) pieces.push({ t: 'crate', x: cx, y: y - 1 }); } }
    else if (o === 'crate') { const x = R(3, W - 2); if (floor[x] && take([[x, fy - 1]])) pieces.push({ t: 'crate', x, y: fy - 1 }); }
    else if (o === 'wall') { const h = R(2, 4), x = R(4, W - 3), y = R(3, fy - h); if (take(Array.from({ length: h }, (_, j) => [x, y + j]))) pieces.push({ t: 'wall', x, y, h }); }
    else if (o === 'bumper') { const x = R(3, W - 2), y = R(3, fy - 1); if (take([[x, y]])) pieces.push({ t: 'bumper', x, y }); }
    else { const x = R(3, W - 2), y = R(3, fy - 1); if (take([[x, y]])) pieces.push({ t: 'gate', x, y, dir: pick(['l', 'r']) }); }
  }
  const pool = ['ramp', 'ramp', 'spring', 'spring', 'belt', 'belt', 'bumper', 'fan', 'glue', 'gate', 'pipe', 'magnet'];
  const ntray = R(BAND[band].tray[0], BAND[band].tray[1]); const tray = [];
  for (let guard = 0; tray.length < ntray && guard < 500; guard++) {
    const t = pick(pool); if (t === 'magnet' && !balls.some((b) => b.kind === 'steel')) continue;
    if (tray.filter((q) => q.t === t).length >= (t === 'ramp' ? 2 : 1)) continue;
    const e = { t }; if (['ramp', 'belt', 'pipe', 'gate'].includes(t)) e.dir = pick(['l', 'r']); if (t === 'fan') e.dir = pick(['l', 'r', 'u']); tray.push(e);
  }
  let L = { w: W, h: H, pieces, balls, goal, tray };
  if (rng() < 0.5) L = mirror(L);
  return L;
}
function mirror(L) {
  const W = L.w, f = (d) => d === 'l' ? 'r' : d === 'r' ? 'l' : d;
  const pieces = L.pieces.map((p) => { const w = p.t === 'shelf' || p.t === 'floor' ? p.w : p.t === 'seesaw' ? 2 : 1; const q = { ...p, x: W - p.x - w }; if (q.dir) q.dir = f(q.dir); if (q.face) q.face = f(q.face); if (q.side) q.side = f(q.side); return q; });
  const balls = L.balls.map((b) => ({ ...b, x: W - 1 - b.x, ...(b.vx ? { vx: -b.vx } : {}) }));
  return { ...L, pieces, balls, tray: L.tray.map((t) => (t.dir ? { ...t, dir: f(t.dir) } : t)) };
}

/* ---------- the checks a board must pass ---------- */
// Bands: tray size and how forgiving the stored machine must be.
const BAND = {
  gentle: { tray: [3, 3], fair: [0.5, 1] },
  moderate: { tray: [3, 4], fair: [0.35, 1] },
  tough: { tray: [4, 4], fair: [FAIR_MIN, 1] },
  sunday: { tray: [5, 6], fair: [FAIR_MIN, 1] },
};
// Board sense, before any physics (verify-machine checks both too):
//   - the goal ball is the only ball of its kind, so "Sink the basketball" names one ball;
//   - a Sunday carries the trapdoor chain and at least four obstacles, so the
//     bigger board is a bigger machine, not a big empty room.
const OBSTACLE = new Set(['shelf', 'crate', 'wall', 'bumper', 'gate']);
export function sense(L, band) {
  if (L.goal.ball) { const g = L.balls.find((b) => b.id === L.goal.ball); if (L.balls.some((b) => b !== g && b.kind === g.kind)) return 'two balls of the goal kind'; }
  if (band === 'sunday') {
    if (!L.pieces.some((p) => p.t === 'door')) return 'sunday without the trapdoor chain';
    const startShelf = L.pieces.find((p) => p.t === 'shelf' && p.y === 2 && (p.x === 0 || p.x + p.w === L.w));
    const btnShelves = L.pieces.filter((p) => p.t === 'button').map((b) => L.pieces.find((q) => q.t === 'shelf' && q.y === b.y + 1));
    const n = L.pieces.filter((p) => OBSTACLE.has(p.t) && p !== startShelf && !btnShelves.includes(p) && !(p.t === 'shelf' && L.pieces.some((q) => q.t === 'bucket' && q.y === p.y - 1))).length;
    if (n < 4) return `sunday with ${n} obstacles`;
  }
  return null;
}
export function check(L, band) {
  const B = BAND[band];
  if (L.tray.length < B.tray[0] || L.tray.length > B.tray[1]) return { why: 'tray size' };
  const why = sense(L, band); if (why) return { why };
  const R = rules(L);
  const s0 = run(L, [], MAXT, true);
  if (s0.won) return { why: 'empty wins' };
  // single part, coarse first (cheap reject), then the real 10px check
  const one30 = cands(L, R, s0.visited, [], 30, 40);
  for (const p of one30) if (run(L, [p], MAXT).won) return { why: 'one part wins' };
  // Two-part search. After the first win keep looking a little (another 1500
  // runs, up to 4 machines) and store the most forgiving one found.
  let sims = 0, stopAt = 9000; const found = [];
  const firstPart = shuffle(one30.slice(), mulberry(7));
  for (const p of firstPart) {
    const s = run(L, [p], MAXT, true); sims++;
    for (const q of cands(L, R, s.visited, [p], 30, 30)) {
      sims++;
      if (run(L, [p, q], MAXT).won) { found.push([p, q]); if (found.length === 1) stopAt = Math.min(stopAt, sims + 1500); break; }
      if (sims > stopAt) break;
    }
    if (found.length >= 4 || sims > stopAt) break;
  }
  if (!found.length) return { why: 'no 2-part' };
  let st = null, fair = -1;
  for (const sol of found) {
    const cand = sol.map((p) => ({ ti: p.ti, px: p.px, py: p.py, ...(p.dir ? { dir: p.dir } : {}) }));
    const f = fairness(L, cand); if (f > fair) { fair = f; st = cand; }
  }
  if (fair < B.fair[0] || fair > B.fair[1]) return { why: `fairness ${fair.toFixed(2)} outside ${band}` };
  for (const p of cands(L, R, s0.visited, [], 10, 40)) if (run(L, [p], MAXT).won) return { why: 'one part wins at 10px' };
  return { ok: true, sol: st, fair };
}

/* ---------- names ---------- */
const BALL_NAME = { bowling: 'bowling ball', basket: 'basketball', tennis: 'tennis ball', steel: 'steel ball' };
function goalText(L, gen) {
  if (gen === GEN2) return goalText2(L);
  const g = L.goal; const b = g.ball && L.balls.find((x) => x.id === g.ball);
  if (g.type === 'hoop') return `Sink the ${BALL_NAME[b.kind]} in the hoop`;
  if (g.type === 'bucket') return `Drop the ${BALL_NAME[b.kind]} in the bucket`;
  if (g.type === 'bell') return 'Ring the bell';
  return 'Pop the balloon';
}
function titleFor(L, used, seed, gen) {
  if (gen === GEN2) {
    const rng = mulberry(seed);
    for (const pool of titlePools2(L)) for (const t of shuffle(pool.slice(), rng)) if (!used.has(t)) { used.add(t); return t; }
    let i = 2; while (used.has(`The Contraption ${i}`)) i++; used.add(`The Contraption ${i}`); return `The Contraption ${i}`;
  }
  const has = (t) => L.pieces.some((p) => p.t === t);
  const pits = L.pieces.filter((p) => p.t === 'floor').length > 1 || L.pieces.some((p) => p.t === 'hoop' && p.x > 0 && p.x < L.w - 1);
  const pools = [];
  if (L.goal.type === 'balloon') pools.push(['The Balloon', 'The Party Popper', 'Pop Quiz', 'High Hopes', 'Up and Away']);
  if (L.goal.type === 'bell') pools.push(['The Bell Tower', 'Ring Once', 'The Doorbell', 'Last Call', 'Bell Ringer', 'Saved by the Bell']);
  if (L.goal.type === 'bucket') pools.push(['The Bucket', 'Bottom of the Bucket', 'Bucket List', 'The Catch', 'Fill the Pail']);
  if (L.goal.type === 'hoop') pools.push(['Nothing but Net', 'The Rebound', 'The Layup', 'The Long Shot', 'Swish', 'The Free Throw']);
  if (has('door')) pools.push(['The Hatch', 'The Release', 'The Cage', 'Open Sesame', 'The Latch', 'The Jailbreak']);
  if (has('gate')) pools.push(['One Way', 'The Turnstile', 'No Way Back', 'The Checkpoint']);
  if (has('bumper')) pools.push(['The Ricochet', 'Pinball', 'The Carom', 'Bank Shot']);
  if (has('wall')) pools.push(['Over the Wall', 'The Barrier', 'The Hurdle']);
  if (pits) pools.push(['Mind the Gap', 'The Crossing', 'Over the Pit', 'The Leap']);
  pools.push(['The Long Way Round', 'The Relay', 'Domino Effect', 'Chain Reaction', 'The Detour', 'Moving Parts', 'Rube Goldberg', 'The Shortcut', 'The Handoff', 'Small Steps']);
  const rng = mulberry(seed);
  for (const pool of pools) for (const t of shuffle(pool.slice(), rng)) if (!used.has(t)) { used.add(t); return t; }
  let i = 2; while (used.has(`Chain Reaction ${i}`)) i++; used.add(`Chain Reaction ${i}`); return `Chain Reaction ${i}`;
}

/* ---------- dates ---------- */
const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const nextDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
const bandFor = (iso) => ['sunday', 'gentle', 'gentle', 'moderate', 'moderate', 'tough', 'tough'][dow(iso)];
// THE LADDER (owner, 2026-11-19: "today's machine is far too easy for a thursday. need more machine
// elements and steps. use existing later week inventory to fill earlier days and create new harder
// thursdays and other days"). The band a player sees still goes by weekday, but what gets built moved
// up: Monday is built to the old Wednesday recipe and Tuesday to the old Friday one (v1, two parts),
// and Wednesday to Sunday are v2 chains (three parts midweek, four on Friday, Saturday and Sunday).
// `lay` is the recipe a board was built to; it is stored on the board when it differs from `band`.
export const recipeFor = (iso) => [
  { gen: GEN2, lay: 'sunday' }, { gen: GEN, lay: 'moderate' }, { gen: GEN, lay: 'tough' },
  { gen: GEN2, lay: 'moderate' }, { gen: GEN2, lay: 'moderate' }, { gen: GEN2, lay: 'tough' }, { gen: GEN2, lay: 'tough' },
][dow(iso)];
const todayNY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const label = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function buildDate(iso, maxTries = 4000, pin) {
  const band = bandFor(iso), { gen, lay } = recipeFor(iso); const base = hash(`machine:${gen}:${iso}`) * 1000;
  const one = (seed) => {
    if (gen === GEN2) { const b = build2(seed, lay); if (!b) return { why: 'no board' }; const r = check2(b.L, lay, b.sol); return r.ok ? { ok: true, L: b.L, sol: b.sol, fair: r.fair } : r; }
    const L = layout(seed, lay); if (!L) return { why: 'no layout' }; const r = check(L, lay); return r.ok ? { ok: true, L, sol: r.sol, fair: r.fair } : r;
  };
  if (pin) { // rebuild from a recorded seed: that seed and nothing else
    const r = one(pin);
    if (!r.ok) throw new Error(`${iso}: pinned seed ${pin} does not make a passing board (${r.why})`);
    return { iso, band, lay, gen, seed: pin, L: r.L, sol: r.sol, fair: r.fair, tries: 1 };
  }
  for (let i = 0; i < maxTries; i++) {
    const seed = base + i; const t0 = Date.now(); const r = one(seed);
    if (process.env.MACHINE_GEN_DEBUG) process.stderr.write(`${iso} seed ${seed}: ${r.ok ? 'ok' : r.why} ${Date.now() - t0}ms\n`);
    if (r.ok) return { iso, band, lay, gen, seed, L: r.L, sol: r.sol, fair: r.fair, tries: i + 1 };
  }
  throw new Error(`no board for ${iso} after ${maxTries} seeds`);
}
export function rowFor(r, num, used) {
  const [y, m, dd] = r.iso.split('-').map(Number);
  const row = { num, quizId: `machine-${m}-${dd}-${String(y).slice(2)}`, live: r.iso, dateLabel: label(r.iso), band: r.band };
  if (r.band === 'sunday') row.sunday = true;
  row.title = titleFor(r.L, used, r.seed, r.gen); row.goalText = goalText(r.L, r.gen);
  Object.assign(row, { w: r.L.w, h: r.L.h, pieces: r.L.pieces, balls: r.L.balls, goal: r.L.goal, tray: r.L.tray, sol: r.sol, gen: r.gen, seed: r.seed });
  if (r.lay !== r.band) row.lay = r.lay;
  return row;
}

/* ---------- CLI ---------- */
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
if (process.argv[1] && process.argv[1].endsWith('gen-machine-bank.mjs')) {
  if (opt('--one')) {
    const r = buildDate(opt('--one'), 4000, opt('--pin') ? +opt('--pin') : undefined);
    process.stdout.write(JSON.stringify(r) + '\n');
    process.exit(0);
  }
  const replace = (opt('--replace') || '').split(',').filter(Boolean);
  const pins = Object.fromEntries((opt('--pin') || '').split(',').filter(Boolean).map((x) => x.split('=')));
  const through = opt('--through'); if (!replace.length && !/^\d{4}-\d{2}-\d{2}$/.test(through || '')) { console.error('usage: --through YYYY-MM-DD | --replace D1,D2 [--dry] [--jobs N]'); process.exit(2); }
  const jobs = +(opt('--jobs') || Math.max(1, Math.min(4, os.cpus().length)));
  const { PUZZLES } = await import(BANK + `?t=${Date.now()}`);
  const last = PUZZLES[PUZZLES.length - 1];
  const today = todayNY();
  const dates = [];
  if (replace.length) { for (const d of replace) { if (!PUZZLES.some((p) => p.live === d)) { console.error(`--replace ${d}: no board on that date`); process.exit(1); } dates.push(d); } }
  else for (let d = nextDay(last.live); d <= through; d = nextDay(d)) dates.push(d);
  if (!dates.length) { console.log(`bank already runs through ${last.live}; nothing to add`); process.exit(0); }
  const early = dates.filter((d) => d <= today); if (early.length) { console.error(`refusing: ${early.join(', ')} is not after today (${today}); a live day cannot get a new board`); process.exit(1); }
  console.log(`building ${dates.length} board(s), ${dates[0]} to ${dates[dates.length - 1]}, ${jobs} at a time`);
  const results = {}; const queue = dates.slice(); const self = fileURLToPath(import.meta.url);
  await new Promise((done, fail) => {
    let active = 0;
    const next = () => {
      if (!queue.length && !active) return done();
      while (active < jobs && queue.length) {
        const d = queue.shift(); active++; let out = '', err = '';
        const ch = spawn(process.execPath, [self, '--one', d, ...(pins[d] ? ['--pin', pins[d]] : [])], { stdio: ['ignore', 'pipe', 'pipe'] });
        ch.stdout.on('data', (b) => { out += b; }); ch.stderr.on('data', (b) => { err += b; });
        ch.on('close', (code) => {
          active--;
          if (code !== 0) return fail(new Error(`${d}: ${err.split('\n').filter((l) => !/Warning|trace-warnings|Reparsing|eliminate this/.test(l)).join(' ').trim()}`));
          const r = JSON.parse(out.trim().split('\n').pop()); results[d] = r;
          console.log(`  ${d} ${r.band.padEnd(8)} seed ${r.seed} (${r.tries} tried) fairness ${r.fair.toFixed(2)}`);
          next();
        });
      }
    };
    next();
  });
  // names and rows, in date order, titles unique across the whole bank
  const used = new Set(PUZZLES.filter((p) => !dates.includes(p.live)).map((p) => p.title));
  let num = last.num; const rows = [];
  for (const d of dates) {
    const r = results[d]; const old = PUZZLES.find((p) => p.live === d); num = old ? old.num : num + 1;
    const row = rowFor(r, num, used);
    rows.push(row);
  }
  if (args.includes('--dry')) { for (const r of rows) console.log(JSON.stringify(r)); process.exit(0); }
  const src = fs.readFileSync(BANK, 'utf8');
  let next;
  if (replace.length) {
    // swap each named future board's own line, and nothing else
    next = src;
    for (const r of rows) {
      const re = new RegExp(`^  \\{"num":${r.num},"quizId":"${r.quizId}".*$`, 'm');
      const m = next.match(re); if (!m) { console.error(`cannot find the line for ${r.live}`); process.exit(1); }
      next = next.replace(re, '  ' + JSON.stringify(r) + (m[0].endsWith(',') ? ',' : ''));
    }
    const keep = (t) => t.split('\n').filter((l) => !rows.some((r) => l.includes(`"quizId":"${r.quizId}"`)));
    if (keep(src).join('\n') !== keep(next).join('\n')) { console.error('replace would change another board; stopped'); process.exit(1); }
  } else {
    // splice before the closing ]; of PUZZLES, leaving every existing line byte-for-byte alone
    const end = src.lastIndexOf('\n];');
    if (end < 0) { console.error('cannot find the end of PUZZLES'); process.exit(1); }
    next = src.slice(0, end).replace(/,?\s*$/, ',') + '\n' + rows.map((r) => '  ' + JSON.stringify(r)).join(',\n') + src.slice(end);
    if (!next.startsWith(src.slice(0, end).replace(/,?\s*$/, ''))) { console.error('splice would change an existing board; stopped'); process.exit(1); }
  }
  const tmp = BANK + '.new';
  fs.writeFileSync(tmp, next);
  const backup = BANK + '.bak'; fs.copyFileSync(BANK, backup); fs.renameSync(tmp, BANK);
  console.log(`wrote ${rows.length} board(s); verifying the whole bank`);
  const v = spawnSync(process.execPath, [path.join(ROOT, 'scripts/verify-machine.mjs')], { stdio: 'inherit' });
  if (v.status !== 0) { fs.renameSync(backup, BANK); console.error('verify-machine failed; the bank was put back as it was'); process.exit(1); }
  fs.unlinkSync(backup);
  console.log(replace.length ? `Rebuilt ${dates.join(', ')}.` : `Machine bank now runs through ${dates[dates.length - 1]}.`);
}
