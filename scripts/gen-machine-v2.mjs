// gen-machine-v2: the longer Machine boards (owner, 2026-11-19: "today's machine
// is far too easy for a thursday. need more machine elements and steps").
//
// A v1 board (scripts/gen-machine-bank.mjs) is one link: kick ball, a trapdoor
// button, a goal, and a machine of TWO parts. A v2 board is a CHAIN of three
// links (four on a Sunday), each link a different ball and a different part:
//   link 1  the kicked ball has to reach the first trigger
//   link 2  the ball that trigger lets go has to reach the next trigger
//   link N  the last ball has to reach the goal
// A trigger is a button (side on, or face up where a ball lands), a seesaw
// with the next ball on its low end, or a row of dominoes that topples into a
// button. A button opens a trapdoor cage or fires a loaded cannon.
//
// The board is BUILT ALONG THE PHYSICS, not laid out blind: for each link the
// builder drops one tray part on the ball's path, runs the real engine, and
// puts the trigger (or the goal) somewhere the ball only goes because of that
// part. So every link needs its part by construction, and the stored machine
// is the three (or four) parts the builder used. The same seed and band always
// build the same board (verify-machine rebuilds each one and compares).
//
// What a v2 board must pass (check2), on top of the v1 rules:
//   - the stored machine wins; dropping any one part of it does not;
//   - no single tray part wins (10px, every way round);
//   - NO TWO tray parts win: every pair on the 60px grid, and on the 30px grid
//     every pair whose first part sets off a link on its own. Only pairs where
//     the second part can be touched on the path the first one makes are run:
//     any other pair plays out as a run already covered. (verify-machine --deep
//     runs every pair on the 30px grid, 20 to 30 minutes a board.);
//   - the winning run shows a step (press, seesaw throw, topple, cannon shot)
//     for every link but the last;
//   - no single part sets off anything past the first link (the skip scan);
//   - fairness (10px nudges) at the band's floor.
import { run, makeState, step, rebuild, pieceSegs, C } from '../lib/machine-engine.js';

export const GEN2 = 'v2';
// v3 (owner, 2026-11-21: "wouldnt multiple of some items make it more dynamic?", then "Change the
// generator ... they would just show a 2 or 3 or 4 instead of the 1 in the item tray image"): the
// same chain builder, but the tray is STACKS. A tray entry may carry `qty` (2 to 4): that many
// copies of the part, placed one by one, each flipped on its own. The builder reaches for a part
// it already used before a new one, every v3 machine uses at least one part twice, and spare
// copies on a stack are decoys too. A stored part's `ti` is its stack, so a stack used twice
// shows up twice in `sol`. Mon/Tue get a two-link chain (two copies of one part, as a rule).
export const GEN3 = 'v3';
const MAXT = 1800;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// tray size, parts the machine must need, chain steps the winning run must show,
// obstacles, and how forgiving the stored machine must be
export const BAND2 = {
  moderate: { tray: [5, 5], links: 3, obst: [3, 5], fair: 0.3 },
  tough: { tray: [6, 6], links: 4, obst: [3, 5], fair: 0.25 },
  sunday: { tray: [6, 6], links: 4, obst: [6, 9], fair: 0.25 },
};
// v3: `tray` is the number of stacks, `parts` the copies across them
export const BAND3 = {
  gentle: { tray: [3, 4], parts: [4, 5], links: 2, obst: [2, 4], fair: 0.3 },
  moderate: { tray: [3, 5], parts: [5, 6], links: 3, obst: [3, 5], fair: 0.3 },
  tough: { tray: [4, 5], parts: [6, 7], links: 4, obst: [3, 5], fair: 0.25 },
  sunday: { tray: [4, 6], parts: [7, 8], links: 4, obst: [6, 9], fair: 0.25 },
};
export const qtyOf = (t) => t.qty || 1;
export const trayParts = (L) => L.tray.reduce((a, t) => a + qtyOf(t), 0);
// a tray entry as a part on the board (the stack size is the tray's business, not the engine's)
export const asPart = (t) => { const { qty, ...p } = t; return p; };
const bandOf = (band, gen) => (gen === GEN3 ? BAND3 : BAND2)[band];

/* ---------- placement rules (the same as verify-machine and lib/machine-ui) ---------- */
function segBox(segs) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of segs) { x0 = Math.min(x0, s.ax - s.th, s.bx - s.th); y0 = Math.min(y0, s.ay - s.th, s.by - s.th); x1 = Math.max(x1, s.ax + s.th, s.bx + s.th); y1 = Math.max(y1, s.ay + s.th, s.by + s.th); } return [x0, y0, x1, y1]; }
export function rules2(L) {
  const fixed = L.pieces.filter((p) => p.t !== 'hoop').map((p) => segBox(pieceSegs({ ...p, tilt: p.tilt || -1, fall: -1 })));
  for (const p of L.pieces) if (p.t === 'hoop') fixed.push([p.x * C, p.y * C, p.x * C + C, p.y * C + C]);
  for (const b of makeState(L, []).balls) if (b.live) fixed.push([b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r]);
  const hits = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const box = (p) => { const b = segBox(pieceSegs(p)); return [b[0] + 1, b[1] + 1, b[2] - 1, b[3] - 1]; };
  const fits = (p, others) => { const b = box(p); if (b[0] < 0 || b[1] < 0 || b[2] > L.w * C || p.py + C > L.h * C + 2) return false; if (fixed.some((f) => hits(f, b))) return false; return !others.some((o) => hits(box(o), b)); };
  return { box, fits, hits };
}
const reach = (t) => (t.dir ? [...new Set([t.dir, 'l', 'r'])] : [undefined]);
const STEP_EVENTS = new Set(['press', 'seesaw', 'topple', 'fire']);
export function stepsOf(s) { const k = new Set(); for (const e of s.events) if (STEP_EVENTS.has(e.type)) k.add(e.type + ':' + e.k); return k; }
const placedOf = (L, sol) => sol.map((q) => ({ ...asPart(L.tray[q.ti]), dir: q.dir || L.tray[q.ti].dir, px: q.px, py: q.py, ti: q.ti }));
function fairness(L, sol) {
  const R = rules2(L); const parts = placedOf(L, sol); let ok = 0, tot = 0;
  parts.forEach((p, i) => {
    for (const dx of [-10, 0, 10]) for (const dy of [-10, 0, 10]) {
      if (!dx && !dy) continue;
      const q = { ...p, px: p.px + dx, py: p.py + dy }; const rest = parts.filter((_, j) => j !== i);
      if (!R.fits(q, rest)) continue; tot++; if (run(L, rest.concat([q]), MAXT).won) ok++;
    }
  });
  return tot ? ok / tot : 0;
}

/* ---------- a run that remembers where each ball went ---------- */
function trace(L, placed) {
  const s = makeState(L, placed); s.maxT = MAXT;
  const path = s.balls.map(() => []), cells = s.balls.map(() => new Set()), all = new Set();
  while (!s.done) {
    step(s);
    s.balls.forEach((b, i) => {
      if (!b.live) return;
      path[i].push([b.x, b.y, b.vx, b.vy, b.contact ? 1 : 0]);
      const x0 = Math.floor((b.x - b.r - 4) / C), x1 = Math.floor((b.x + b.r + 4) / C), y0 = Math.floor((b.y - b.r - 4) / C), y1 = Math.floor((b.y + b.r + 4) / C);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { cells[i].add(x * 100 + y); all.add(x * 100 + y); }
    });
  }
  return { s, path, cells, all, steps: stepsOf(s) };
}
const sameSet = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));
const TRAY_KINDS = [{ t: 'ramp', dir: 'l' }, { t: 'ramp', dir: 'r' }, { t: 'ramp', dir: 'l' }, { t: 'ramp', dir: 'r' }, { t: 'spring' }, { t: 'spring' }, { t: 'belt', dir: 'l' }, { t: 'belt', dir: 'r' }, { t: 'bumper' }, { t: 'bumper' }, { t: 'fan', dir: 'u' }, { t: 'fan', dir: 'l' }, { t: 'fan', dir: 'r' }, { t: 'pipe', dir: 'l' }, { t: 'pipe', dir: 'r' }, { t: 'magnet' }];
const cap = (t) => (t === 'ramp' ? 2 : 1);
const cap3 = (t) => (t === 'ramp' ? 3 : t === 'magnet' ? 1 : 2);

/* ---------- the builder ---------- */
export function build2(seed, band, gen = GEN2) {
  const v3 = gen === GEN3, B = bandOf(band, gen); if (!B) return null;
  const capOf = v3 ? cap3 : cap;
  const N = B.links, sunday = band === 'sunday';
  const rng = mulberry(seed);
  const R = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const W = sunday ? 18 : 14, H = sunday ? 12 : 10, fy = H - 1;
  let occ = new Set(); const key = (x, y) => x + ',' + y;
  const free = (cells) => !cells.some(([x, y]) => x < 0 || y < 0 || x >= W || y >= H || occ.has(key(x, y)));
  const take = (cells) => { if (!free(cells)) return false; cells.forEach(([x, y]) => occ.add(key(x, y))); return true; };
  let pieces = [], balls = [], goal = { type: 'pending' };
  let floor = new Array(W).fill(true);
  // start
  const sw = R(3, 5);
  take([[0, 1], [1, 1]]); for (let i = 0; i < sw; i++) take([[i, 2]]);
  pieces.push({ t: 'plunger', x: 0, y: 1 }, { t: 'shelf', x: 0, y: 2, w: sw });
  let kinds = shuffle(['bowling', 'basket', 'steel', 'tennis'], rng);
  const kickKind = kinds.find((k) => k !== 'tennis'); kinds = kinds.filter((k) => k !== kickKind);
  balls.push({ id: 'red', kind: kickKind, role: 'kick', x: 1, y: 1, vx: pick([2.0, 2.2, 2.4]) });
  const takeKind = (want) => { const i = kinds.findIndex((k) => !want || want.includes(k)); if (i < 0) return null; return kinds.splice(i, 1)[0]; };
  // floor, pits
  for (let i = R(0, 2); i > 0; i--) { const pw = R(1, 2); const px = R(3, W - 3); for (let j = 0; j < pw; j++) if (px + j < W) floor[px + j] = false; }
  for (let x = 0; x < W;) { if (!floor[x]) { x++; continue; } let e = x; while (e < W && floor[e]) e++; take(Array.from({ length: e - x }, (_, i) => [x + i, fy])); pieces.push({ t: 'floor', x, y: fy, w: e - x }); x = e; }
  // furniture: what the balls will run into
  for (let i = R(B.obst[0], B.obst[1]); i > 0; i--) {
    const o = pick(['shelf', 'shelf', 'shelf', 'shelf', 'crate', 'wall', 'bumper', 'gate', 'spring', 'belt']);
    if (o === 'shelf') { const y = R(4, fy - 1), w = R(2, 5), x = R(0, W - w); if (!take(Array.from({ length: w }, (_, j) => [x + j, y]))) continue; pieces.push({ t: 'shelf', x, y, w }); if (rng() < 0.25) { const cx = x + R(0, w - 1); if (take([[cx, y - 1]])) pieces.push({ t: 'crate', x: cx, y: y - 1 }); } }
    else if (o === 'crate') { const x = R(3, W - 2); if (floor[x] && take([[x, fy - 1]])) pieces.push({ t: 'crate', x, y: fy - 1 }); }
    else if (o === 'wall') { const h = R(2, 3), x = R(4, W - 3), y = R(3, fy - h); if (take(Array.from({ length: h }, (_, j) => [x, y + j]))) pieces.push({ t: 'wall', x, y, h }); }
    else if (o === 'bumper') { const x = R(3, W - 2), y = R(4, fy - 1); if (take([[x, y]])) pieces.push({ t: 'bumper', x, y }); }
    else if (o === 'gate') { const x = R(3, W - 2), y = fy - 1; if (floor[x] && take([[x, y]])) pieces.push({ t: 'gate', x, y, dir: pick(['l', 'r']) }); }
    else if (o === 'spring') { const x = R(2, W - 2); if (floor[x] && take([[x, fy - 1]])) pieces.push({ t: 'spring', x, y: fy - 1 }); }
    else { const x = R(2, W - 2); if (floor[x] && take([[x, fy - 1]])) pieces.push({ t: 'belt', x, y: fy - 1, dir: pick(['l', 'r']) }); }
  }
  const solid = (x, y) => (y === fy ? !!floor[x] && !pieces.some((p) => p.t === 'hoop' && p.x === x) : pieces.some((p) => (p.t === 'shelf' && p.y === y && x >= p.x && x < p.x + p.w) || (p.t === 'crate' && p.x === x && p.y === y)));
  const LV = () => ({ w: W, h: H, pieces, balls, goal, tray: [] });
  const snap = () => JSON.stringify({ pieces, balls, goal, floor, occ: [...occ], kinds });
  const restore = (j) => { const o = JSON.parse(j); pieces = o.pieces; balls = o.balls; goal = o.goal; floor = o.floor; occ = new Set(o.occ); kinds = o.kinds; };
  const gt = pick(['hoop', 'hoop', 'bucket', 'bell', 'bell', 'balloon']);
  let nTrap = 0, hasGun = false;

  // what a trigger sets off: a trapdoor cage or a loaded cannon. Returns the wire id.
  function effect(avoid) {
    const kind = (!hasGun && rng() < 0.4) ? 'cannon' : 'cage';
    if (kind === 'cannon') {
      for (let g = 0; g < 30; g++) {
        const x = R(1, W - 2), y = rng() < 0.6 ? fy - 1 : R(4, fy - 2);
        if (!solid(x, y + 1) || !free([[x, y]]) || avoid.has(x * 100 + y)) continue;
        const dir = x < W / 2 ? 'r' : 'l', ax = x + (dir === 'r' ? 1 : -1);
        if (!free([[ax, y], [ax, y - 1]])) continue;
        const k = takeKind(['tennis', 'basket', 'steel']) || takeKind(); if (!k) return null;
        take([[x, y]]); hasGun = true;
        pieces.push({ t: 'cannon', x, y, dir, id: 'gun' });
        balls.push({ id: 'b' + balls.length, kind: k, cannon: 'gun', x, y });
        return 'gun';
      }
      return null;
    }
    for (let g = 0; g < 40; g++) {
      const dy = rng() < 0.75 ? 2 : R(3, 4), dx = R(2, W - 2);
      const cells = [[dx - 1, dy - 1], [dx - 1, dy], [dx + 1, dy - 1], [dx + 1, dy], [dx, dy - 1], [dx, dy]];
      if (!free(cells.concat([[dx, dy + 1]])) || cells.some(([x, y]) => avoid.has(x * 100 + y))) continue;
      const k = takeKind(); if (!k) return null;
      take(cells); nTrap++; const id = nTrap === 1 ? 'trap' : 'trap' + nTrap;
      pieces.push({ t: 'post', x: dx - 1, y: dy - 1, h: 2, side: 'r' }, { t: 'post', x: dx + 1, y: dy - 1, h: 2, side: 'l' }, { t: 'door', x: dx, y: dy, id });
      balls.push({ id: 'b' + balls.length, kind: k, x: dx, y: dy - 1 });
      return id;
    }
    return null;
  }

  // where on its new path could ball `bi` set something off (or score)?
  function options(tr, base, bi, last) {
    const out = new Map(); const r = BALLS_R[balls[bi].kind]; const P = tr.path[bi];
    const add = (o) => { const k = o.k + ':' + o.x + ',' + o.y + (o.s || ''); if (!out.has(k)) out.set(k, o); };
    for (let j = 1; j < P.length; j++) {
      const [x, y, vx, vy, c] = P[j], pv = P[j - 1];
      const cx = Math.floor(x / C), cyAir = Math.floor(y / C);
      const rb = Math.round((y + r) / C), onRow = c && Math.abs(y + r - rb * C) <= 6, cy = rb - 1;
      const rolling = onRow && Math.abs(vy) < 0.6, landing = onRow && !pv[4] && pv[3] > 2.5;
      const fresh = (X, Y) => !base.all.has(X * 100 + Y);
      if (!last) {
        if (rolling && Math.abs(vx) > 1 && fresh(cx, cy)) add({ k: 'side', x: cx, y: cy, s: vx > 0 ? 'l' : 'r' });
        if (rolling && Math.abs(vx) > 1.2 && fresh(cx, cy)) add({ k: 'domino', x: cx, y: cy, s: vx > 0 ? 'r' : 'l' });
        if (landing && fresh(cx, cy)) { add({ k: 'up', x: cx, y: cy }); add({ k: 'seesaw', x: cx, y: cy, s: 'a' }); add({ k: 'seesaw', x: cx, y: cy, s: 'b' }); }
      } else if (gt === 'bell') { if (vx * vx + vy * vy > 6 && fresh(cx, cyAir)) add({ k: 'bell', x: cx, y: cyAir }); }
      else if (gt === 'balloon') { if (fresh(cx, cyAir) && cyAir >= 1) add({ k: 'balloon', x: cx, y: cyAir }); }
      else if (gt === 'hoop') { if ((rolling || landing) && cy === fy - 1 && fresh(cx, cy)) add({ k: 'hoop', x: cx, y: fy }); }
      else if (gt === 'bucket') { if (landing && r <= 15 && fresh(cx, cy)) add({ k: 'bucket', x: cx, y: cy }); }
    }
    return [...out.values()];
  }
  // put the trigger or the goal on the board. Returns the step keys the run must now show, or null.
  function apply(o, tr, bi) {
    const avoid = tr.all;
    if (o.k === 'bell' || o.k === 'balloon') { if (o.y < 1 || !take([[o.x, o.y]])) return null; pieces.push({ t: o.k, x: o.x, y: o.y }); goal = { type: o.k, ball: balls[bi].id }; return []; }
    if (o.k === 'bucket') { if (!take([[o.x, o.y]])) return null; pieces.push({ t: 'bucket', x: o.x, y: o.y }); goal = { type: 'bucket', ball: balls[bi].id }; return []; }
    if (o.k === 'hoop') {
      if (!floor[o.x] || !free([[o.x, fy - 1]])) return null;
      const f = pieces.find((p) => p.t === 'floor' && o.x >= p.x && o.x < p.x + p.w); if (!f) return null;
      const left = o.x - f.x, right = f.x + f.w - o.x - 1; if (!left && !right) return null;
      if (left) { f.w = left; if (right) pieces.push({ t: 'floor', x: o.x + 1, y: fy, w: right }); } else { f.x = o.x + 1; f.w = right; }
      floor[o.x] = false; pieces.push({ t: 'hoop', x: o.x, y: fy }); goal = { type: 'hoop', ball: balls[bi].id }; return [];
    }
    if (o.k === 'seesaw') {
      const tilt = o.s === 'a' ? -1 : 1, sx = tilt < 0 ? o.x - 1 : o.x, lowX = tilt < 0 ? sx : sx + 1;
      if (!free([[sx, o.y], [sx + 1, o.y]]) || !solid(sx, o.y + 1) || !solid(sx + 1, o.y + 1) || avoid.has(lowX * 100 + o.y)) return null;
      const k = takeKind(['tennis', 'basket']); if (!k) return null;
      take([[sx, o.y], [sx + 1, o.y]]);
      pieces.push({ t: 'seesaw', x: sx, y: o.y, tilt });
      balls.push({ id: 'b' + balls.length, kind: k, px: tilt < 0 ? sx * C + 34 : sx * C + 2 * C - 34, py: (o.y + 1) * C - 14 - BALLS_R[k] });
      return ['seesaw:' + (pieces.length - 1)];
    }
    if (o.k === 'side' || o.k === 'up') {
      if (!free([[o.x, o.y]]) || !solid(o.x, o.y + 1)) return null; // a button stands on a shelf, a crate or the floor
      const at = pieces.length; take([[o.x, o.y]]);
      pieces.push({ t: 'button', x: o.x, y: o.y, face: o.k === 'up' ? 'u' : o.s, wires: [] });
      const id = effect(avoid); if (!id) return null;
      pieces[at].wires = [id];
      return ['press:' + at].concat(id === 'gun' ? ['fire:' + pieces.findIndex((q) => q.t === 'cannon')] : []);
    }
    if (o.k === 'domino') {
      const s = o.s === 'r' ? 1 : -1, cells = [[o.x, o.y], [o.x + s, o.y], [o.x + 2 * s, o.y]];
      if (!free(cells) || cells.some(([x, y]) => !solid(x, y + 1) || base0.has(x * 100 + y))) return null;
      const at = pieces.length; take(cells);
      pieces.push({ t: 'dominoes', x: o.x, y: o.y, n: 3, dir: o.s }, { t: 'button', x: o.x + 2 * s, y: o.y, face: s > 0 ? 'l' : 'r', wires: [] });
      const id = effect(avoid); if (!id) return null;
      pieces[at + 1].wires = [id];
      return ['topple:' + at, 'press:' + (at + 1)].concat(id === 'gun' ? ['fire:' + pieces.findIndex((q) => q.t === 'cannon')] : []);
    }
    return null;
  }

  // v3: the tray as stacks. One stack per part the machine uses (its copies), then decoy
  // stacks and spare copies, shuffled; a stored part's ti is its stack.
  function finish3() {
    if (!Object.values(used).some((n) => n >= 2)) return null; // every v3 machine uses a part twice
    const stacks = [];
    for (const p of sol) {
      let s = stacks.find((q) => q.t === p.t);
      if (!s) { s = { t: p.t, qty: 0 }; stacks.push(s); }
      s.qty++;
      if (p.t === 'fan') { if (p.dir === 'u' || !s.dir) s.dir = p.dir; } // an upward fan flips to l and r, not back
      else if (p.dir && !s.dir) s.dir = pick(['l', 'r']);
    }
    const pool = ['ramp', 'spring', 'belt', 'bumper', 'fan', 'glue', 'gate', 'pipe', 'magnet', 'glue', 'gate'];
    const nStacks = R(B.tray[0], B.tray[1]), nParts = R(B.parts[0], B.parts[1]);
    for (let g = 0; stacks.length < nStacks && g < 500; g++) {
      const t = pick(pool); if (t === 'magnet' && !balls.some((b) => b.kind === 'steel')) continue;
      if (stacks.some((q) => q.t === t)) continue;
      const e = { t, qty: 1 }; if (['ramp', 'belt', 'pipe', 'gate'].includes(t)) e.dir = pick(['l', 'r']); if (t === 'fan') e.dir = pick(['l', 'r', 'u']); stacks.push(e);
    }
    if (stacks.length < nStacks) return null;
    const total = () => stacks.reduce((a, q) => a + q.qty, 0);
    for (let g = 0; total() < nParts && g < 200; g++) { const s = pick(stacks); if (s.t !== 'magnet' && s.qty < 4) s.qty++; }
    if (total() <= sol.length) return null; // a spare, as ever
    const tray = stacks.map((q) => { const { qty, ...e } = q; return qty > 1 ? { ...e, qty } : e; });
    const order = shuffle(tray.map((_, i) => i), rng);
    const tray2 = order.map((i) => tray[i]);
    let stored = sol.map((p) => ({ ti: order.indexOf(stacks.findIndex((q) => q.t === p.t)), px: p.px, py: p.py, ...(p.dir ? { dir: p.dir } : {}) }));
    let L = { w: W, h: H, pieces, balls, goal, tray: tray2 };
    if (rng() < 0.5) {
      const M = mirror2(L), f = (d) => (d === 'l' ? 'r' : d === 'r' ? 'l' : d);
      const ms = stored.map((q) => ({ ...q, px: W * C - q.px - C, ...(q.dir ? { dir: f(q.dir) } : {}) }));
      const RM = rules2(M), mp = placedOf(M, ms);
      if (mp.every((p, i) => RM.fits(p, mp.filter((_, j2) => j2 !== i))) && run(M, mp, MAXT).won) { L = M; stored = ms; }
    }
    return { L, sol: stored };
  }

  let base0 = new Set();
  const sol = [], used = {}; let cur = 0;
  for (let link = 1; link <= N; link++) {
    const base = trace(LV(), sol); if (base.s.won) return null;
    base0 = base.all;
    if (!base.cells[cur].size) return null;
    const RR = rules2(LV()); let done = false;
    let kindsTry = shuffle(TRAY_KINDS.slice(), rng);
    if (v3) kindsTry = kindsTry.filter((k) => used[k.t]).concat(kindsTry.filter((k) => !used[k.t])); // a part already in the machine first
    const pref = shuffle(['seesaw', 'seesaw', 'domino', 'domino', 'up', 'side'], rng).filter((k, i, a) => a.indexOf(k) === i);
    outer: for (const k of kindsTry) {
      if ((used[k.t] || 0) >= capOf(k.t)) continue;
      if (k.t === 'magnet' && balls[cur].kind !== 'steel') continue;
      const spots = shuffle(spotsFor(LV(), RR, k, base.cells[cur], sol), rng).slice(0, 10);
      for (const p of spots) {
        const tr = trace(LV(), sol.concat([p]));
        if (tr.s.won || !sameSet(tr.steps, base.steps)) continue;
        const opts = prefer(shuffle(options(tr, base, cur, link === N), rng), pref).slice(0, 6);
        for (const o of opts) {
          const j = snap(), nb = balls.length;
          const want = apply(o, tr, cur);
          if (want) {
            const a = trace(LV(), sol.concat([p])), b = trace(LV(), sol);
            const okPrev = !b.s.won && sameSet(b.steps, base.steps);
            const okNow = link === N ? a.s.won : (!a.s.won && a.steps.size === base.steps.size + want.length && want.every((w) => a.steps.has(w)) && a.path[nb] && a.path[nb].length > 10);
            if (okPrev && okNow) { sol.push(p); used[k.t] = (used[k.t] || 0) + 1; cur = nb; done = true; for (const X of [Math.floor(p.px / C), Math.floor((p.px + C - 1) / C)]) for (const Y of [Math.floor(p.py / C), Math.floor((p.py + C - 1) / C)]) occ.add(key(X, Y)); break outer; }
          }
          restore(j);
        }
      }
    }
    if (!done) return null;
  }
  if (goal.type === 'pending') return null;
  if (v3) return finish3();
  // the tray: the parts the machine uses, plus decoys, shuffled
  const tray = sol.map((p) => (p.dir ? { t: p.t, dir: p.t === 'fan' ? p.dir : pick(['l', 'r']) } : { t: p.t }));
  const pool = ['ramp', 'spring', 'belt', 'bumper', 'fan', 'glue', 'gate', 'pipe', 'magnet', 'glue', 'gate'];
  const ntray = R(B.tray[0], B.tray[1]);
  for (let g = 0; tray.length < ntray && g < 500; g++) {
    const t = pick(pool); if (t === 'magnet' && !balls.some((b) => b.kind === 'steel')) continue;
    if (tray.filter((q) => q.t === t).length >= cap(t)) continue;
    const e = { t }; if (['ramp', 'belt', 'pipe', 'gate'].includes(t)) e.dir = pick(['l', 'r']); if (t === 'fan') e.dir = pick(['l', 'r', 'u']); tray.push(e);
  }
  if (tray.length < ntray) return null;
  const order = shuffle(tray.map((_, i) => i), rng);
  const tray2 = order.map((i) => tray[i]);
  let stored = sol.map((p, i) => ({ ti: order.indexOf(i), px: p.px, py: p.py, ...(p.dir ? { dir: p.dir } : {}) }));
  let L = { w: W, h: H, pieces, balls, goal, tray: tray2 };
  if (rng() < 0.5) { // mirrored, when the mirrored machine plays out the same way
    const M = mirror2(L), f = (d) => (d === 'l' ? 'r' : d === 'r' ? 'l' : d);
    const ms = stored.map((q) => ({ ...q, px: W * C - q.px - C, ...(q.dir ? { dir: f(q.dir) } : {}) }));
    const RM = rules2(M), mp = placedOf(M, ms);
    if (mp.every((p, i) => RM.fits(p, mp.filter((_, j2) => j2 !== i))) && run(M, mp, MAXT).won) { L = M; stored = ms; }
  }
  return { L, sol: stored };
}
// the link's favourite mechanisms first, two of a kind at most
function prefer(opts, pref) {
  const out = [];
  for (const k of pref) out.push(...opts.filter((o) => o.k === k).slice(0, 2));
  return out.concat(opts.filter((o) => !pref.includes(o.k)));
}
const BALLS_R = { bowling: 24, basket: 22, steel: 15, tennis: 15 };
// where a part of this kind fits and can touch the cells a ball crossed
function laneBox(p) {
  const cx = p.px + C / 2, cy = p.py + C / 2;
  if (p.t === 'magnet') return [cx - 3 * C, cy - 3 * C, cx + 3 * C, cy + 3 * C];
  if (p.dir === 'u') return [p.px - 6, cy - 4 * C, p.px + C + 6, cy];
  return p.dir === 'r' ? [cx, p.py - 10, cx + 4 * C, p.py + C + 4] : [cx - 4 * C, p.py - 10, cx, p.py + C + 4];
}
function touches(R, p, cellBoxes) {
  const b = R.box(p);
  for (const c of cellBoxes) if (R.hits(b, c)) return true;
  if (p.t === 'fan' || p.t === 'magnet') { const l = laneBox(p); for (const c of cellBoxes) if (R.hits(l, c)) return true; }
  return false;
}
const boxesOf = (V) => [...V].map((v) => { const x = Math.floor(v / 100), y = v % 100; return [x * C, y * C, x * C + C, y * C + C]; });
function spotsFor(L, R, k, V, others) {
  const out = [], cb = boxesOf(V);
  for (let py = 0; py <= L.h * C - C; py += 30) for (let px = 0; px <= L.w * C - C; px += 30) {
    const p = { ...k, px, py }; if (!R.fits(p, others)) continue; if (touches(R, p, cb)) out.push(p);
  }
  return out;
}
// every way round, every STEP px, every tray part not yet used
function candsExact(L, R, V, others, STEP) {
  const out = [], cb = boxesOf(V), usedTi = new Set(others.map((o) => o.ti)), seen = new Set();
  L.tray.forEach((t, ti) => {
    if (usedTi.has(ti)) return;
    for (const d of reach(t)) {
      const sig = t.t + (d || ''); if (seen.has(sig)) continue; seen.add(sig);
      const k = d ? { ...asPart(t), dir: d, ti } : { ...asPart(t), ti };
      for (let py = 0; py <= L.h * C - C; py += STEP) for (let px = 0; px <= L.w * C - C; px += STEP) {
        const p = { ...k, px, py }; if (!R.fits(p, others)) continue; if (touches(R, p, cb)) out.push(p);
      }
    }
  });
  return out;
}
function mirror2(L) {
  const W = L.w, f = (d) => (d === 'l' ? 'r' : d === 'r' ? 'l' : d);
  const pieces = L.pieces.map((p) => { const w = p.t === 'shelf' || p.t === 'floor' ? p.w : p.t === 'seesaw' ? 2 : 1; const q = { ...p, x: W - p.x - w }; if (q.dir) q.dir = f(q.dir); if (q.face) q.face = f(q.face); if (q.side) q.side = f(q.side); if (q.t === 'seesaw') q.tilt = -q.tilt; return q; });
  const balls = L.balls.map((b) => (b.px !== undefined ? { ...b, px: W * C - b.px } : { ...b, x: W - 1 - b.x, ...(b.vx ? { vx: -b.vx } : {}) }));
  return { ...L, pieces, balls, tray: L.tray.map((t) => (t.dir ? { ...t, dir: f(t.dir) } : t)) };
}

/* ---------- board sense (no physics) ---------- */
export function sense2(L, band, gen = GEN2) {
  const B = bandOf(band, gen); if (!B) return `band ${band} has no ${gen} recipe`;
  if (L.goal.ball) { const g = L.balls.find((b) => b.id === L.goal.ball); if (!g) return 'goal ball missing'; if (L.balls.some((b) => b !== g && b.kind === g.kind)) return 'two balls of the goal kind'; }
  if (L.balls.length < B.links) return `a ${band} v2 board carries ${B.links} balls`;
  if (L.tray.length < B.tray[0] || L.tray.length > B.tray[1]) return 'tray size';
  if (gen === GEN3) {
    const n = trayParts(L); if (n < B.parts[0] || n > B.parts[1]) return `${n} parts in the tray, a ${band} v3 board carries ${B.parts[0]} to ${B.parts[1]}`;
    if (!L.tray.some((t) => qtyOf(t) >= 2)) return 'a v3 tray has a stack';
  } else if (L.tray.some((t) => t.qty)) return 'only a v3 board has stacks';
  return null;
}

/* ---------- the two-part rule: exhaustive on the 30px grid ---------- */
// A pair can only win if one of its parts changes the empty run on its own (call
// it the first) and the other is touched on the path that follows. Any other
// pair plays out exactly as the empty run or as a one-part run, and those are
// covered by the single-part sweep. "Touched" is tested against where the balls
// really were, step by step, with room for the half-step the engine moves
// between samples; a part no ball comes near cannot change the run, so nothing
// is skipped that could matter. Returns the winning pair, or null.
const SNAP = 30; // steps between the saved states of a first-part run
function freeze(s) { const { segs, cells, ...rest } = s; return structuredClone(rest); }
export function samples(L, placed, keep) { // [x, y, reach, step] for every ball at every step, the outcome, and saved states
  const s = makeState(L, placed); s.maxT = MAXT; const pts = [], snaps = keep ? [freeze(s)] : null;
  for (const b of s.balls) if (b.live) pts.push(b.x, b.y, b.r + 2, 0);
  while (!s.done) {
    step(s);
    for (const b of s.balls) if (b.live || b.fired) pts.push(b.x, b.y, b.r + 2 + Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 0.5 + 0.11, s.t);
    if (keep && !s.done && s.t % SNAP === 0) snaps.push(freeze(s));
  }
  return { s, pts, snaps };
}
// The first step at which a ball could have touched this part, or -1.
export function nearAt(p, pts) {
  let best = -1; const hit = (i) => { if (best < 0 || pts[i + 3] < best) best = pts[i + 3]; };
  if (p.t === 'fan' || p.t === 'magnet') { const l = laneBox(p); for (let i = 0; i < pts.length; i += 4) { const m = pts[i + 2]; if (pts[i] > l[0] - m && pts[i] < l[2] + m && pts[i + 1] > l[1] - m && pts[i + 1] < l[3] + m) { hit(i); break; } } }
  if (p.t === 'pipe') { for (let i = 0; i < pts.length; i += 4) { const m = pts[i + 2]; if (pts[i] > p.px - m && pts[i] < p.px + C + m && pts[i + 1] > p.py - m && pts[i + 1] < p.py + C + m) { hit(i); break; } } return best; }
  for (const sg of pieceSegs(p)) {
    const ex = sg.bx - sg.ax, ey = sg.by - sg.ay, L2 = ex * ex + ey * ey;
    for (let i = 0; i < pts.length; i += 4) {
      if (best >= 0 && pts[i + 3] >= best) break;
      const x = pts[i], y = pts[i + 1]; let u = L2 > 0 ? ((x - sg.ax) * ex + (y - sg.ay) * ey) / L2 : 0; if (u < 0) u = 0; else if (u > 1) u = 1;
      const dx = x - (sg.ax + ex * u), dy = y - (sg.ay + ey * u), rr = pts[i + 2] + sg.th;
      if (dx * dx + dy * dy < rr * rr) { hit(i); break; }
    }
  }
  return best;
}
const near = (p, pts) => nearAt(p, pts) >= 0;
// Carry on a saved first-part run with one more part on the board. Until a ball can touch the
// new part the run is the saved one, step for step, so starting from the save before that is exact.
export function resumeWon(snaps, q, at) {
  const s = structuredClone(snaps[Math.max(0, Math.min(snaps.length - 1, Math.floor((at - 2) / SNAP)))]);
  const piece = { ...q, placed: true, k: s.pieces.length }; if (piece.t === 'fan') piece.on = true;
  s.pieces.push(piece); rebuild(s);
  while (!s.done) step(s);
  return s;
}
export function gridParts(L, R, others, STEP) { // every tray part not yet used, every way round, every STEP px where it fits
  const out = [], usedTi = new Set(others.map((o) => o.ti)), seen = new Set();
  L.tray.forEach((t, ti) => {
    if (usedTi.has(ti)) return;
    for (const d of reach(t)) {
      const sig = t.t + (d || ''); if (seen.has(sig)) continue; seen.add(sig);
      const k = d ? { ...asPart(t), dir: d, ti } : { ...asPart(t), ti };
      for (let py = 0; py <= L.h * C - C; py += STEP) for (let px = 0; px <= L.w * C - C; px += STEP) { const p = { ...k, px, py }; if (R.fits(p, others)) out.push(p); }
    }
  });
  return out;
}
// THE SKIP SCAN (cheap, and it throws out most boards with a shortcut): on its
// own, no tray part may set off anything but the first link. A part that lets
// the kicked ball press the third button has skipped a link, and a board like
// that tends to fall to two parts. Returns the offending part, or null.
export function skipScan(L, sol) {
  const R = rules2(L), e = samples(L, []), first = placedOf(L, sol)[0];
  const allowed = stepsOf(run(L, [first], MAXT)); for (const k of stepsOf(e.s)) allowed.add(k);
  for (const p of gridParts(L, R, [], 30)) {
    if (!near(p, e.pts)) continue;
    const s = run(L, [p], MAXT); if (s.won) return { p, why: 'wins' };
    for (const k of stepsOf(s)) if (!allowed.has(k)) return { p, why: k };
  }
  return null;
}
export function onePartWin(L, STEP) {
  const R = rules2(L), e = samples(L, []);
  if (e.s.won) return { pair: [] };
  for (const p of gridParts(L, R, [], STEP)) if (near(p, e.pts) && run(L, [p], MAXT).won) return { pair: [p] };
  return null;
}
export function twoPartWin(L, STEP = 30, steppingOnly = false, STEP2 = STEP) {
  const R = rules2(L), e = samples(L, []), n0 = stepsOf(e.s).size; let sims = 0;
  const all = gridParts(L, R, [], STEP), seconds = STEP2 === STEP ? all : gridParts(L, R, [], STEP2), firsts = [], idx = new Map(); const kk = (p) => p.t + (p.dir || '') + ':' + p.px + ',' + p.py;
  for (const p of all) if (near(p, e.pts)) { idx.set(kk(p), firsts.length); firsts.push(p); }
  for (let i = 0; i < firsts.length; i++) {
    const p = firsts[i], r = samples(L, [p], true); sims++;
    if (r.s.won) return { pair: [p], sims };
    if (steppingOnly && stepsOf(r.s).size <= n0) continue; // the quick 30px pass: first parts that set something off
    const pb = R.box(p);
    for (const q of seconds) {
      if ((q.ti === p.ti && qtyOf(L.tray[p.ti]) < 2) || R.hits(R.box(q), pb)) continue; // two copies of one stack are a pair too
      const j = idx.get(kk(q)); if (!steppingOnly && j !== undefined && j < i) continue; // that pair was run with q first
      const at = nearAt(q, r.pts); if (at < 0) continue;
      sims++;
      if (resumeWon(r.snaps, q, at).won) return { pair: [p, q], sims };
    }
  }
  return null;
}

/* ---------- the checks a v2 board must pass ---------- */
// cheap: everything but the 10px single-part sweep and the pair sweep
export function check2cheap(L, band, sol, gen = GEN2) {
  const B = bandOf(band, gen); const why = sense2(L, band, gen); if (why) return { why };
  const useOf = (ti) => sol.filter((q) => q.ti === ti).length;
  if (L.tray.some((t, i) => useOf(i) > qtyOf(t))) return { why: 'the stored machine uses more copies than a stack holds' };
  if (gen === GEN3 && !L.tray.some((t, i) => useOf(i) >= 2)) return { why: 'a v3 machine uses one part twice' };
  const R = rules2(L), parts = placedOf(L, sol);
  if (parts.length !== B.links) return { why: `stored machine has ${parts.length} parts, the band wants ${B.links}` };
  if (!parts.every((p, i) => R.fits(p, parts.filter((_, j) => j !== i)))) return { why: 'a stored part does not fit' };
  if (run(L, [], MAXT).won) return { why: 'empty wins' };
  const s = run(L, parts, MAXT); if (!s.won) return { why: 'the stored machine does not win' };
  const steps = stepsOf(s).size; if (steps < B.links - 1) return { why: `the winning run shows ${steps} step(s), needs ${B.links - 1}` };
  for (let i = 0; i < parts.length; i++) if (run(L, parts.filter((_, j) => j !== i), MAXT).won) return { why: `the machine still wins without part ${i}` };
  if (L.tray.every((t, i) => useOf(i) >= qtyOf(t))) return { why: 'no spare part' };
  const fair = fairness(L, sol); if (fair < B.fair) return { why: `fairness ${fair.toFixed(2)} under ${B.fair}` };
  return { ok: true, fair, steps };
}
export function check2(L, band, sol, gen = GEN2) {
  const c = check2cheap(L, band, sol, gen); if (!c.ok) return c;
  if (skipScan(L, sol)) return { why: 'one part skips a link' };
  // every pair on the 60px grid, then on the 30px grid every pair whose first part sets off a
  // link on its own (the pairs a real shortcut is made of). The full 30px sweep is 20 to 30
  // minutes a board; verify-machine --deep runs it.
  // (a two-link v3 board IS a two-part machine, so the pair rule starts at three links)
  if (bandOf(band, gen).links >= 3 && twoPartWin(L, 60)) return { why: 'two parts win (60px)' };
  if (bandOf(band, gen).links >= 3 && twoPartWin(L, 30, true, band === 'sunday' ? 60 : 30)) return { why: 'two parts win' }; // the 18 x 12 board: second parts on the 60px grid, or one board is an hour
  if (onePartWin(L, 10)) return { why: 'one part wins at 10px' };
  return c;
}

/* ---------- words ---------- */
const BALL_NAME = { bowling: 'bowling ball', basket: 'basketball', tennis: 'tennis ball', steel: 'steel ball' };
export function goalText2(L) {
  const g = L.goal, b = BALL_NAME[L.balls.find((x) => x.id === g.ball).kind];
  if (g.type === 'hoop') return `Sink the ${b} in the hoop`;
  if (g.type === 'bucket') return `Drop the ${b} in the bucket`;
  if (g.type === 'bell') return `Ring the bell with the ${b}`;
  return `Pop the balloon with the ${b}`;
}
export function titlePools2(L) {
  const has = (t) => L.pieces.some((p) => p.t === t), pools = [];
  if (has('cannon')) pools.push(['Loose Cannon', 'Fire Away', 'The Broadside', 'Cannon Fodder', 'The Salute', 'Powder Keg', 'Shot in the Dark', 'The Long Gun']);
  if (has('seesaw')) pools.push(['The Tipping Point', 'Ups and Downs', 'The Seesaw', 'Teeter Totter', 'The Counterweight', 'In the Balance']);
  if (has('dominoes')) pools.push(['Falling in Line', 'Domino Theory', 'The Topple', 'Knock On', 'One After Another', 'The Pushover', 'Tumbling Down']);
  if (L.pieces.filter((p) => p.t === 'door').length >= 2) pools.push(['Double Lock', 'Two Keys', 'Cage Match', 'The Second Door', 'Both Hatches', 'Lock and Key', 'Twin Cages']);
  if (L.goal.type === 'balloon') pools.push(['The Party Popper', 'Pop Quiz', 'Up and Away', 'The Balloon', 'Burst']);
  if (L.goal.type === 'bell') pools.push(['Three Bells', 'The Dinner Bell', 'Ring Twice', 'For Whom It Tolls', 'The Bellhop', 'Alarm Bell']);
  if (L.goal.type === 'bucket') pools.push(['The Bucket', 'Bottom of the Bucket', 'The Catch', 'Fill the Pail', 'Drop in the Bucket']);
  if (L.goal.type === 'hoop') pools.push(['The Fast Break', 'The Alley Oop', 'The Buzzer Beater', 'The Assist', 'Full Court', 'The Hook Shot']);
  pools.push(['The Relay', 'The Handoff', 'Three Easy Pieces', 'The Long Way Round', 'Pass It On', 'The Baton', 'Clockwork', 'The Works', 'Cause and Effect', 'One Thing Leads to Another', 'The Contraption', 'Moving Parts', 'Rube Goldberg', 'The Daisy Chain']);
  return pools;
}
