// lib/curb-engine.js: Curb, the daily parking puzzle (owner, 2026-11-28).
// Weekdays you parallel park a car between two parked cars; the Sunday Edition
// backs a tractor-trailer into a loading-dock bay. Ranked on a single time:
// the driving clock plus seconds for every inch and degree you leave on the
// table, plus five seconds a bump.
//
// One module for the client (app/curb/CurbClient.jsx), the generator
// (scripts/gen-curb.mjs) and the checker (scripts/verify-curb.mjs), so the
// car the player drives is the car the checker proves can be parked.
//
// Units are metres and radians. y grows DOWN the screen. A heading of -PI/2
// points up. The reference point of every vehicle is the middle of its rear
// axle (the tractor's drive axle for a truck); a trailer hangs off a hitch at
// that point.
//
// NEVER CHANGE A LIVE BOARD. A day is buildDay(settings) from the settings
// stored in app/curb/puzzles.js, and the checker rebuilds the settings from
// the stored seed (daySettings) and fails on any difference. A rule change
// must be date-gated so past days keep their layout.

export const PI = Math.PI;
export const IN_PER_M = 39.37;
export const BUMP_SEC = 5;

export const CARS = {
  compact: { name: 'Compact', len: 3.7, wb: 2.35, back: 0.7, hw: 0.85, max: 3.0, steer: 0.66 },
  sedan:   { name: 'Sedan', len: 4.5, wb: 2.7, back: 1.0, hw: 0.9, max: 3.0, steer: 0.62 },
  suv:     { name: 'SUV', len: 4.9, wb: 2.9, back: 1.0, hw: 1.0, max: 2.9, steer: 0.58 },
  minivan: { name: 'Minivan', len: 5.1, wb: 3.0, back: 1.0, hw: 1.0, max: 2.8, steer: 0.58 },
  pickup:  { name: 'Pickup', len: 5.7, wb: 3.5, back: 1.3, hw: 1.0, max: 2.8, steer: 0.55, bed: true },
  van:     { name: 'Van with a ladder rack', len: 5.4, wb: 3.3, back: 1.0, hw: 1.0, max: 2.8, steer: 0.56, rack: true },
};
export const CAR_KEYS = Object.keys(CARS);
// Parked neighbours: a length and a look. The player's car is always sky blue
// and no neighbour ever is, so the car you drive never blends in.
export const NEIGHBOURS = [
  { len: 3.6, kind: 'car' }, { len: 4.4, kind: 'car' }, { len: 4.7, kind: 'car' },
  { len: 5.6, kind: 'pickup' }, { len: 6.8, kind: 'box' },
];
export const TRAILERS = {
  long: { name: '53 ft trailer', lt: 12.5, tf: 1.0, tb: 2.5 },
  pup:  { name: '28 ft pup trailer', lt: 6.4, tf: 1.0, tb: 1.6 },
};
export const CABS = {
  day:     { name: 'Day cab', wb: 4.0, back: 1.0, front: 5.3, hw: 1.25 },
  sleeper: { name: 'Sleeper cab', wb: 5.2, back: 1.0, front: 6.6, hw: 1.25 },
};
export const TRUCK_MAX = 2.0;
export const TRUCK_STEER = 0.6;
export const JACKKNIFE = 1.45; // radians between cab and trailer

// The weekday ramp. spare is the room in the legal space beyond the car's own length.
export const BANDS = {
  gentle:   { label: 'Gentle', spare: [1.9, 2.3], traffic: 0, hydrant: 0.25 },
  moderate: { label: 'Moderate', spare: [1.45, 1.75], traffic: 0.4, hydrant: 0.35 },
  tough:    { label: 'Tough', spare: [1.05, 1.25], traffic: 0.7, hydrant: 0.4 },
  sunday:   { label: 'Sunday Edition' },
};
export function bandOf(live) {
  const d = new Date(`${live}T12:00:00Z`).getUTCDay();
  if (d === 0) return 'sunday';
  if (d === 1 || d === 2) return 'gentle';
  if (d === 6) return 'tough';
  return 'moderate';
}

// ── a seeded generator ─────────────────────────────────────────────────────
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (x) => Math.round(x * 100) / 100;

// The settings of a day, from its seed and band. Everything a board is built from.
export function daySettings(seed, band, live) {
  const R = rng(seed);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const month = Number(live.slice(5, 7));
  const snowy = month === 12 || month <= 2;
  if (band === 'sunday') {
    const trailer = R() < 0.3 ? 'pup' : 'long';
    const cab = R() < 0.35 ? 'sleeper' : 'day';
    const from = R() < 0.5 ? 'L' : 'R';
    // the bay is never one of the two at the end on the side you come from
    const bays = from === 'L' ? [2, 3, 4] : [1, 2, 3];
    const target = pick(bays);
    return { kind: 'truck', trailer, cab, from, target, scene: snowy && R() < 0.4 ? 'snow' : 'yard' };
  }
  const B = BANDS[band];
  const car = pick(CAR_KEYS);
  const spare = r2(B.spare[0] + R() * (B.spare[1] - B.spare[0]));
  const side = R() < 0.4 ? 'L' : 'R';
  const ahead = pick(NEIGHBOURS).len, behind = pick(NEIGHBOURS).len;
  const hydrant = R() < B.hydrant ? (R() < 0.5 ? 'front' : 'back') : null;
  const traffic = R() < B.traffic ? 1 : 0;
  const scene = snowy && R() < 0.45 ? 'snow' : 'street';
  return { kind: 'car', car, spare, side, ahead, behind, hydrant, traffic, scene };
}

// ── geometry ───────────────────────────────────────────────────────────────
export function box(x0, y0, x1, y1) {
  const a = Math.min(x0, x1), b = Math.max(x0, x1);
  return [[a, y0], [b, y0], [b, y1], [a, y1]];
}
export function poly(x, y, h, back, front, hw) {
  const c = Math.cos(h), s = Math.sin(h);
  const P = (f, l) => [x + c * f - s * l, y + s * f + c * l];
  return [P(front, -hw), P(front, hw), P(-back, hw), P(-back, -hw)];
}
export function overlap(A, B) {
  for (const p of [A, B]) for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    const nx = q[1] - p[i][1], ny = p[i][0] - q[0];
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const v of A) { const d = v[0] * nx + v[1] * ny; if (d < a0) a0 = d; if (d > a1) a1 = d; }
    for (const v of B) { const d = v[0] * nx + v[1] * ny; if (d < b0) b0 = d; if (d > b1) b1 = d; }
    if (a1 < b0 || b1 < a0) return false;
  }
  return true;
}
export function wrap(a) { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; }

export const HYDRANT_ZONE = 1.4; // metres of red curb you may not park beside
const LANE_X = 8.2, CURB_X = 12, PARK_X = 10.9, LINE_X = 9.6;

// Build the board for a day's settings.
export function buildDay(set) {
  if (set.kind === 'truck') return buildTruck(set);
  const v = CARS[set.car];
  const R = set.side === 'R';
  const m = (x) => (R ? x : 14 - x);
  const legal = v.len + set.spare;
  const zone = set.hydrant ? HYDRANT_ZONE : 0;
  const aheadY0 = 1.0, aheadY1 = aheadY0 + set.ahead;
  const gapY0 = aheadY1, gapY1 = gapY0 + legal + zone;
  const behindY1 = gapY1 + set.behind;
  const H = Math.ceil(behindY1 + v.len + 2.2);
  const legalY0 = set.hydrant === 'front' ? gapY0 + zone : gapY0;
  const legalY1 = set.hydrant === 'back' ? gapY1 - zone : gapY1;
  const parked = [
    { x: m(PARK_X), y0: aheadY0, y1: aheadY1, len: set.ahead, col: 'rose' },
    { x: m(PARK_X), y0: gapY1, y1: behindY1, len: set.behind, col: 'lime' },
  ];
  // the far side of the street is full of parked cars too
  const far = [];
  for (let y = 1.4, i = 0; y + 4.4 < H - 0.5; y += 6.2, i++) far.push({ x: m(1.55), y0: y, y1: y + 4.4, len: 4.4, col: ['butter', 'lav', 'peach', 'mint'][i % 4] });
  const obs = [
    ...parked.map((p) => box(p.x - 0.9, p.y0, p.x + 0.9, p.y1)),
    ...far.map((p) => box(p.x - 0.9, p.y0, p.x + 0.9, p.y1)),
    box(m(CURB_X + 0.15), -9, m(40), H + 9), // the curb face
    box(m(-9), -9, m(0.45), H + 9),          // the far curb
    box(-9, -9, 40, -0.6), box(-9, H + 0.6, 40, H + 9),
  ];
  const back = v.back, front = v.len - v.back;
  return {
    kind: 'car', set, W: 14, H, R, m, v,
    wb: v.wb, back, front, hw: v.hw, max: v.max, steer: v.steer,
    start: { x: m(LANE_X), y: H - 0.6 - back, h: -PI / 2, p: 0 },
    spot: { x0: Math.min(m(LINE_X), m(CURB_X + 0.15)), x1: Math.max(m(LINE_X), m(CURB_X + 0.15)), y0: legalY0, y1: legalY1, gapY0, gapY1, curb: m(CURB_X) },
    hydrant: set.hydrant ? { y0: set.hydrant === 'front' ? gapY0 : gapY1 - zone, y1: set.hydrant === 'front' ? gapY0 + zone : gapY1 } : null,
    parked, far, obs, laneX: m(LANE_X),
  };
}

export const BAYS = [3, 6.8, 10.6, 14.4, 18.2, 22];
export const DOCK_Y = 1.2;
function buildTruck(set) {
  const T = TRAILERS[set.trailer], C = CABS[set.cab];
  const W = 26, H = 46;
  const startX = Math.min(4 + T.lt + T.tb + 0.6, W - 0.6 - C.front);
  const obs = [
    box(-9, -9, 40, DOCK_Y), box(-9, -9, 0, 60), box(W, -9, 40, 60), box(-9, H + 0.4, 40, 60),
    ...BAYS.filter((_, i) => i !== set.target).map((x) => box(x - 1.3, DOCK_Y + 0.05, x + 1.3, DOCK_Y + 16.05)),
  ];
  return {
    kind: 'truck', set, W, H, T, C,
    wb: C.wb, back: C.back, front: C.front, hw: C.hw, max: TRUCK_MAX, steer: TRUCK_STEER,
    lt: T.lt, tf: T.tf, tb: T.tb,
    start: set.from === 'L' ? { x: startX, y: H - 7, h: 0, p: 0 } : { x: W - startX, y: H - 7, h: PI, p: PI },
    bay: BAYS[set.target], bays: BAYS, target: set.target, obs,
  };
}

export function bodies(L, st) {
  const out = [poly(st.x, st.y, st.h, L.back, L.front, L.hw)];
  if (L.kind === 'truck') {
    const ax = st.x - Math.cos(st.p) * L.lt, ay = st.y - Math.sin(st.p) * L.lt;
    out.push(poly(ax, ay, st.p, L.tb, L.lt + L.tf, 1.3));
  }
  return out;
}
export function jackknifed(L, st) { return L.kind === 'truck' && Math.abs(wrap(st.h - st.p)) > JACKKNIFE; }
export function hits(L, st, extra) {
  const obs = extra ? L.obs.concat(extra) : L.obs;
  for (const b of bodies(L, st)) for (const o of obs) if (overlap(b, o)) return true;
  return jackknifed(L, st);
}

// Move the vehicle ds metres (negative is reverse) with the wheel at steer
// (-1 full left .. 1 full right). Pure: returns a new state.
export function advance(L, st, ds, steer) {
  const d = steer * L.steer;
  const n = { ...st };
  n.x += ds * Math.cos(st.h); n.y += ds * Math.sin(st.h);
  n.h = st.h + (ds / L.wb) * Math.tan(d);
  if (L.kind === 'truck') n.p = st.p + (ds / L.lt) * Math.sin(st.h - st.p);
  return n;
}

// ── the measurement ────────────────────────────────────────────────────────
// Free allowances and the seconds each unit past them costs.
export const RULES = {
  car:   [{ k: 'gap', label: 'From the curb', unit: 'in', free: 6, rate: 0.25 }, { k: 'ang', label: 'Off straight', unit: 'deg', free: 1, rate: 1 }, { k: 'off', label: 'Off center', unit: 'in', free: 12, rate: 0.1 }],
  truck: [{ k: 'gap', label: 'From the dock', unit: 'in', free: 6, rate: 0.1 }, { k: 'ang', label: 'Off straight', unit: 'deg', free: 0.5, rate: 1 }, { k: 'off', label: 'Off center', unit: 'in', free: 4, rate: 0.2 }],
};
// null when the vehicle is not in the spot; else the three measurements.
export function measure(L, st) {
  if (L.kind === 'car') {
    const c = bodies(L, st)[0], sp = L.spot;
    const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
    if (Math.min(...xs) < sp.x0 || Math.max(...xs) > sp.x1 || Math.min(...ys) < sp.y0 || Math.max(...ys) > sp.y1) return null;
    const near = L.R ? Math.max(...xs) : Math.min(...xs);
    const gap = Math.max(0, (L.R ? sp.curb - near : near - sp.curb)) * IN_PER_M;
    const ang = Math.abs(wrap(2 * (st.h + PI / 2)) / 2) * 180 / PI;
    const off = Math.abs((Math.min(...ys) - sp.y0) - (sp.y1 - Math.max(...ys))) / 2 * IN_PER_M;
    return { gap, ang, off };
  }
  const tr = bodies(L, st)[1], bx = L.bay;
  const xs = tr.map((p) => p[0]), ys = tr.map((p) => p[1]);
  if (Math.min(...xs) < bx - 1.9 || Math.max(...xs) > bx + 1.9 || Math.min(...ys) - DOCK_Y > 1.0) return null;
  const gap = (Math.min(...ys) - DOCK_Y) * IN_PER_M;
  const ang = Math.abs(wrap(st.p - PI / 2)) * 180 / PI;
  const off = Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - bx) * IN_PER_M;
  return { gap, ang, off };
}
export function penalties(L, m) {
  return RULES[L.kind].map((r) => ({ ...r, v: m[r.k], sec: Math.max(0, m[r.k] - r.free) * r.rate }));
}
// Whole seconds added for accuracy and bumps (the board posts whole seconds).
export function penaltySec(L, m, bumps) {
  const acc = m ? penalties(L, m).reduce((a, r) => a + r.sec, 0) : 0;
  return acc + BUMP_SEC * (bumps || 0);
}

// ── the traffic car ────────────────────────────────────────────────────────
// It drives up the lane on a loop and waits behind you if you are in its way.
export const TRAFFIC_SPEED = 4.2;
export function trafficPoly(L, y) { return poly(L.laneX, y, -PI / 2, 1.0, 3.5, 0.9); }

// ── the planner: proves a day can be parked ───────────────────────────────
// A hybrid A* over (x, y, heading[, trailer]) with short arcs at five wheel
// positions, forward and back. Used by the checker, never by the page.
export function plan(L, { maxNodes = 400000 } = {}) {
  const truck = L.kind === 'truck';
  const step = truck ? 0.8 : 0.35;
  const sub = truck ? 4 : 3;
  const steers = [-1, -0.5, 0, 0.5, 1];
  const cell = truck ? 0.4 : 0.2, acell = (truck ? 6 : 5) * PI / 180;
  const key = (s) => `${Math.round(s.x / cell)},${Math.round(s.y / cell)},${Math.round(wrap(s.h) / acell)}${truck ? ',' + Math.round(wrap(s.h - s.p) / acell) : ''}`;
  let goal;
  if (truck) goal = { x: L.bay, y: DOCK_Y + L.tb + 0.3, h: PI / 2 };
  else goal = { x: (L.spot.x0 + L.spot.x1) / 2, y: (L.spot.y0 + L.spot.y1) / 2, h: -PI / 2 };
  const hOf = (s) => {
    if (truck) {
      const ax = s.x - Math.cos(s.p) * L.lt, ay = s.y - Math.sin(s.p) * L.lt;
      return Math.hypot(ax - goal.x, ay - goal.y) + 3 * Math.abs(wrap(s.p - goal.h));
    }
    return Math.hypot(s.x - goal.x, s.y - goal.y) + 1.5 * Math.abs(wrap(s.h - goal.h));
  };
  const ok = (s) => { const m = measure(L, s); return m && m.ang < 4 && (!truck || m.gap < 30); };
  // a small binary heap
  const heap = [];
  const push = (n) => { heap.push(n); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p].f <= heap[i].f) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l].f < heap[m].f) m = l; if (r < heap.length && heap[r].f < heap[m].f) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const seen = new Set();
  const s0 = { ...L.start };
  push({ s: s0, g: 0, f: hOf(s0), dir: 0, path: null });
  let n = 0;
  while (heap.length && n < maxNodes) {
    const cur = pop();
    const k = key(cur.s);
    if (seen.has(k)) continue;
    seen.add(k); n++;
    if (ok(cur.s)) {
      const moves = []; for (let c = cur; c.path; c = c.path.prev) moves.push(c.path.m);
      return { found: true, nodes: n, moves: moves.reverse(), end: cur.s };
    }
    for (const dir of [1, -1]) for (const st of steers) {
      let s = cur.s, bad = false;
      for (let i = 0; i < sub; i++) { s = advance(L, s, (dir * step) / sub, st); if (hits(L, s)) { bad = true; break; } }
      if (bad) continue;
      const cost = step * (dir < 0 ? 1.2 : 1) + (cur.dir && cur.dir !== dir ? 1.5 : 0) + Math.abs(st) * 0.05;
      const g = cur.g + cost;
      push({ s, g, f: g + (truck ? 3 : 1.4) * hOf(s), dir, path: { prev: cur, m: [dir, st] } });
    }
  }
  return { found: false, nodes: n };
}

// A plain sentence for screen readers and the gate.
export function dayLine(set) {
  if (set.kind === 'truck') {
    const T = TRAILERS[set.trailer];
    return `Back a ${T.name.replace(' trailer', '')} trailer into bay ${set.target + 1}, coming in from the ${set.from === 'L' ? 'left' : 'right'}.`;
  }
  const v = CARS[set.car];
  const bits = [`Parallel park a ${v.name.toLowerCase()} on the ${set.side === 'R' ? 'right' : 'left'}`];
  if (set.hydrant) bits.push('keeping clear of the hydrant');
  if (set.traffic) bits.push('with traffic coming up behind you');
  return bits.join(', ') + '.';
}
