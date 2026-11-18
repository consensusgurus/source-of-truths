// lib/machine-engine.js: the physics of Machine, the daily contraption puzzle
// (owner, 2026-11-17: "look up the game the incredible machine. could we build a
// daily puzzle like that?", then "the physics dont work. ball doesnt carry
// momentum", then "push and implement immediately").
//
// Deterministic 2D ball physics on a fixed timestep. The simulation itself uses
// only + - * / and Math.sqrt, which IEEE 754 rounds the same way on every
// device, so a machine plays out identically in every browser and the verifier
// (scripts/verify-machine.mjs) proves exactly what a player will see. Do NOT
// add Math.sin, Math.cos, Math.atan2, Math.hypot or Math.pow to anything the
// simulation reads: those are allowed to differ between engines.
//
// A level is a list of PIECES on a 60px grid (fixed ones in cell units, placed
// parts in pixels), the BALLS and the GOAL. Each piece contributes colliders
// (segments, some with thickness) and behaviour: springs and bumpers throw,
// belts carry, fans blow, magnets pull the steel ball, seesaws flip, pipes
// redirect, dominoes topple in turn, buttons fire whatever their wires name
// (open a trapdoor, start a fan, fire a cannon), and the hoop, bucket, bell or
// balloon is the day's goal.
export const C = 60;
export const PX = p => p.px !== undefined ? p.px : p.x * C;
export const PY = p => p.py !== undefined ? p.py : p.y * C;
export const PHYS = { g: 0.2, e: 0.35, spring: 9.4, bumper: 7.5, belt: 3.4, roll: 0.998, maxV: 17 };
export const BALLS = {
  bowling: { r: 24, m: 3 },
  basket: { r: 22, m: 1 },
  steel: { r: 15, m: 2, steel: true },
  tennis: { r: 15, m: 0.6 },
};

/* ---------- collider helpers ---------- */
function seg(ax, ay, bx, by, tag, p, th) { return { ax, ay, bx, by, th: th || 0, tag, p }; }
function rect(x, y, w, h, tag, p) {
  return [seg(x, y, x + w, y, tag, p), seg(x + w, y, x + w, y + h, tag, p), seg(x + w, y + h, x, y + h, tag, p), seg(x, y + h, x, y, tag, p)];
}
function poly(pts, tag, p) { return pts.map((a, i) => { const b = pts[(i + 1) % pts.length]; return seg(a[0], a[1], b[0], b[1], tag, p); }); }

/* ---------- piece definitions: colliders ---------- */
// Every piece: {t, x, y, ...}. x, y are cells. Returns an array of segments.
function seesawSegs(p) {
  const a = PX(p), b = PY(p), w = 2 * C;
  const lo = b + C - 10, hi = b + C - 46;
  const ly = p.tilt < 0 ? lo : hi, ry = p.tilt < 0 ? hi : lo;
  return [seg(a + 4, ly, a + w - 4, ry, 'seesaw', p, 5), seg(a + 6, ly - 12, a + 6, ly - 12, 'seesaw', p, 4), seg(a + w - 6, ry - 12, a + w - 6, ry - 12, 'seesaw', p, 4)];
}
export function pieceSegs(p) {
  const a = PX(p), b = PY(p);
  switch (p.t) {
    case 'shelf': return rect(a + 1, b, p.w * C - 2, 20, 'shelf', p);
    case 'crate': return rect(a + 3, b + 3, C - 6, C - 3, 'crate', p);
    case 'post': return rect(p.side === 'r' ? a + C - 16 : a + 2, b + 4, 14, (p.h || 2) * C - 4, 'post', p);
    case 'floor': return rect(a, b, p.w * C, C + 80, 'floor', p);
    case 'door': return rect(a + 1, b, C - 2, 18, 'door', p);
    case 'button': {
      const f = p.face || 'l';
      if (f === 'u') return rect(a + 8, b + C - 18, C - 16, 18, 'buttonbox', p).concat(rect(a + 16, b + C - 28, C - 32, 10, 'button', p));
      const box = f === 'l' ? rect(a + 18, b + 8, C - 22, C - 8, 'buttonbox', p) : rect(a + 4, b + 8, C - 22, C - 8, 'buttonbox', p);
      const cap = f === 'l' ? rect(a + 6, b + 20, 14, 26, 'button', p) : rect(a + C - 20, b + 20, 14, 26, 'button', p);
      return box.concat(cap);
    }
    case 'plunger': return rect(a + 2, b + 12, 42, 36, 'plunger', p);
    case 'hoop': return [seg(a + 3, b, a + 3, b, 'rim', p, 3.5), seg(a + C - 3, b, a + C - 3, b, 'rim', p, 3.5)];
    case 'bucket': return [seg(a + 6, b + 10, a + 10, b + C - 2, 'bucket', p, 3), seg(a + 10, b + C - 2, a + C - 10, b + C - 2, 'bucket', p, 3), seg(a + C - 10, b + C - 2, a + C - 6, b + 10, 'bucket', p, 3)];
    case 'ramp': return p.dir === 'r' ? poly([[a, b + 4], [a + C, b + C], [a, b + C]], 'ramp', p) : poly([[a + C, b + 4], [a + C, b + C], [a, b + C]], 'ramp', p);
    case 'spring': return rect(a + 4, b + 6, C - 8, C - 6, 'spring', p);
    case 'belt': return rect(a + 2, b + 2, C - 4, 30, 'belt', p);
    case 'bumper': return [seg(a + C / 2, b + C / 2, a + C / 2, b + C / 2, 'bumper', p, 17)];
    case 'fan': return p.dir === 'u' ? rect(a + 8, b + C - 24, C - 16, 24, 'fanbody', p) : rect(p.dir === 'r' ? a + 4 : a + C - 28, b + 10, 24, C - 10, 'fanbody', p);
    case 'seesaw': return seesawSegs(p).concat(poly([[a + C - 12, b + C], [a + C, b + C - 26], [a + C + 12, b + C]], 'pivot', p));
    case 'pipe': {
      // elbow: opening on top, exit to the side. Closed side and bottom are solid.
      const out = p.dir === 'r';
      return [seg(out ? a + 4 : a + C - 4, b, out ? a + 4 : a + C - 4, b + C - 4, 'pipe', p, 4), seg(a + 4, b + C - 4, a + C - 4, b + C - 4, 'pipe', p, 4)];
    }
    case 'magnet': return rect(a + 10, b + 10, C - 20, C - 20, 'magnet', p);
    case 'dominoes': {
      const out = [];
      for (let i = 0; i < p.n; i++) {
        const dx = a + 14 + i * 26 * (p.dir === 'l' ? -1 : 1) + (p.dir === 'l' ? C - 28 : 0);
        out.push(...rect(dx, b + C - 46, 10, 46, 'domino', { ...p, i, ref: p }));
      }
      return out;
    }
    case 'cannon': return rect(a + 6, b + 24, C - 12, C - 24, 'cannon', p);
    case 'bell': return [seg(a + C / 2, b + 30, a + C / 2, b + 30, 'bell', p, 18)];
    case 'balloon': return [seg(a + C / 2, b + 24, a + C / 2, b + 24, 'balloon', p, 20)];
    case 'glue': return rect(a + 2, b + C - 10, C - 4, 10, 'glue', p);
    case 'gate': return [seg(a + C / 2, b + 2, a + C / 2, b + C, 'gate', p, 3)];
    case 'wall': return rect(a, b, C, (p.h || 1) * C, 'wall', p);
  }
  return [];
}

/* ---------- state ---------- */
export function makeState(level, placed) {
  const pieces = level.pieces.map(p => ({ ...p })).concat((placed || []).map(p => ({ ...p, placed: true })));
  pieces.forEach((p, i) => { p.k = i; if (p.t === 'seesaw') p.tilt = p.tilt || -1; if (p.t === 'dominoes') { p.fall = -1; } if (p.t === 'fan' && p.on === undefined) p.on = !p.id || !level.pieces.some(q => q.wires && q.wires.includes(p.id)); });
  const s = {
    W: level.w, H: level.h, pieces, t: 0, won: false, done: false, events: [], quiet: 0, endAt: -1, triggered: {},
    goal: level.goal,
    balls: level.balls.map(b => {
      const k = BALLS[b.kind];
      const x = b.px !== undefined ? b.px : b.x * C + C / 2;
      const y = b.py !== undefined ? b.py : (b.y + 1) * C - k.r;
      return { id: b.id, kind: b.kind, role: b.role, r: k.r, m: k.m, steel: !!k.steel, x, y, vx: b.vx || 0, vy: b.vy || 0, live: !b.cannon, cannon: b.cannon, ang: 0, contact: false, px: x, py: y };
    }),
  };
  rebuild(s);
  return s;
}
function rebuild(s) {
  const W = s.W * C, H = s.H * C;
  s.segs = [seg(0, -300, 0, H + 80, 'wall'), seg(W, -300, W, H + 80, 'wall'), seg(0, 0, W, 0, 'wall')];
  for (const p of s.pieces) {
    if (p.dead) continue;
    let ss = pieceSegs(p);
    if (p.t === 'dominoes') ss = ss.filter(sg => !(p.fall >= 0 && sg.p.i <= dominoesDown(s, p)));
    s.segs.push(...ss);
    if (p.t === 'dominoes') s.segs.push(...dominoFallen(s, p));
  }
  s.cells = new Map();
  const pad = 46;
  s.segs.forEach((sg, i) => {
    const x0 = Math.floor((Math.min(sg.ax, sg.bx) - pad) / C), x1 = Math.floor((Math.max(sg.ax, sg.bx) + pad) / C);
    const y0 = Math.floor((Math.min(sg.ay, sg.by) - pad) / C), y1 = Math.floor((Math.max(sg.ay, sg.by) + pad) / C);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = x * 1000 + y; let l = s.cells.get(k); if (!l) { l = []; s.cells.set(k, l); } l.push(i); }
  });
}
const DOMINO_GAP = 7;
function dominoesDown(s, p) { return p.fall < 0 ? -1 : Math.min(p.n - 1, Math.floor((s.t - p.fall) / DOMINO_GAP)); }
function dominoFallen(s, p) {
  const k = dominoesDown(s, p), out = [];
  if (k < 0) return out;
  const a = PX(p), b = PY(p);
  const left = p.dir === 'l';
  const x0 = left ? a + C - 14 - (k) * 26 - 46 : a + 14, x1 = left ? a + C - 14 : a + 14 + k * 26 + 46;
  out.push(...rect(Math.min(x0, x1), b + C - 10, Math.abs(x1 - x0), 10, 'dominoflat', p));
  return out;
}

/* ---------- triggers ---------- */
function trigger(s, src) {
  if (s.triggered[src.k]) return;
  s.triggered[src.k] = true;
  s.events.push({ t: s.t, type: 'press', k: src.k });
  for (const id of src.wires || []) {
    for (const p of s.pieces) {
      if (p.id !== id) continue;
      if (p.t === 'door') { p.dead = true; s.events.push({ t: s.t, type: 'open', k: p.k }); }
      if (p.t === 'fan') { p.on = true; s.events.push({ t: s.t, type: 'fanon', k: p.k }); }
      if (p.t === 'cannon') fire(s, p);
    }
  }
  rebuild(s);
}
function fire(s, p) {
  const b = s.balls.find(q => q.cannon === p.id && !q.live && !q.fired);
  if (!b) return;
  const dir = p.dir === 'l' ? -1 : 1;
  b.live = true; b.fired = true;
  b.x = PX(p) + C / 2 + dir * 26; b.y = PY(p) + 22;
  b.vx = dir * (p.power || 7.5); b.vy = -(p.lift || 5.5);
  s.events.push({ t: s.t, type: 'fire', k: p.k });
}

/* ---------- collisions ---------- */
function collide(s, b) {
  const k = Math.floor(b.x / C) * 1000 + Math.floor(b.y / C);
  const list = s.cells.get(k), segs = s.segs;
  if (!list) return;
  for (const i of list) {
    const sg = segs[i];
    if (sg.p && sg.p.dead) continue;
    const ex = sg.bx - sg.ax, ey = sg.by - sg.ay;
    const L2 = ex * ex + ey * ey;
    let u = L2 > 0 ? ((b.x - sg.ax) * ex + (b.y - sg.ay) * ey) / L2 : 0;
    if (u < 0) u = 0; else if (u > 1) u = 1;
    const qx = sg.ax + ex * u, qy = sg.ay + ey * u;
    const dx = b.x - qx, dy = b.y - qy;
    const d2 = dx * dx + dy * dy, R = b.r + sg.th;
    if (d2 >= R * R || d2 === 0) continue;
    const p = sg.p;
    // one-way gate: only blocks balls moving against its direction
    if (sg.tag === 'gate') { const dir = p.dir === 'l' ? -1 : 1; if (b.vx * dir >= 0) continue; }
    if (sg.tag === 'balloon') { if (!p.dead) { p.dead = true; s.events.push({ t: s.t, type: 'pop', k: p.k }); if (s.goal && s.goal.type === 'balloon') s.won = true; } continue; }
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    b.x += nx * (R - d); b.y += ny * (R - d);
    const vn = b.vx * nx + b.vy * ny;
    b.contact = true;
    if (sg.tag === 'button') trigger(s, p);
    if (sg.tag === 'bell' && vn < -0.8) { s.events.push({ t: s.t, type: 'ring', k: p.k }); if (s.goal && s.goal.type === 'bell') s.won = true; }
    if (sg.tag === 'domino' && p.ref.fall < 0 && Math.abs(b.vx) > 0.6 && (p.dir === 'l' ? b.vx < 0 : b.vx > 0)) { p.ref.fall = s.t; s.events.push({ t: s.t, type: 'topple', k: p.ref.k }); }
    if (sg.tag === 'seesaw' && vn < -1.8 && seesawHit(s, p, b, vn, u)) continue;
    if (vn < 0) {
      if (sg.tag === 'spring' && ny < -0.6 && vn < -1.2) {
        const tx = b.vx - vn * nx, ty = b.vy - vn * ny;
        b.vx = tx + nx * PHYS.spring; b.vy = ty + ny * PHYS.spring;
        s.events.push({ t: s.t, type: 'boing', k: p.k });
        continue;
      }
      if (sg.tag === 'bumper') {
        const tx = b.vx - vn * nx, ty = b.vy - vn * ny;
        b.vx = tx * 0.8 + nx * PHYS.bumper; b.vy = ty * 0.8 + ny * PHYS.bumper;
        s.events.push({ t: s.t, type: 'bump', k: p.k });
        continue;
      }
      const e = sg.tag === 'glue' ? 0 : (vn < -1.6 ? PHYS.e : 0);
      b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    }
    if (sg.tag === 'belt' && ny < -0.6) { const dir = p.dir === 'l' ? -1 : 1; b.vx += (dir * PHYS.belt - b.vx) * 0.06; }
    if (sg.tag === 'glue' && ny < -0.6) { b.vx *= 0.6; }
  }
}
function seesawHit(s, p, b, vn, u) {
  // the end that was struck goes down; the other end throws whatever sits on it
  const hitRight = b.x > PX(p) + C;
  const want = hitRight ? 1 : -1;
  if (p.tilt === want) return false;
  p.tilt = want;
  s.events.push({ t: s.t, type: 'seesaw', k: p.k });
  const a = PX(p);
  for (const o of s.balls) {
    if (!o.live || o === b) continue;
    const onOther = hitRight ? (o.x < a + C - 6) : (o.x > a + C + 6);
    if (onOther && o.x > a - 10 && o.x < a + 2 * C + 10 && o.y > PY(p) - 40 && o.y < PY(p) + C) {
      const kick = Math.min(10, -vn * 1.25 * b.m / o.m + 2);
      o.vy = -kick; o.vx += hitRight ? -2.4 : 2.4;
      const lo = PY(p) + C - 10, hi = PY(p) + C - 46, f = (o.x - (a + 4)) / (2 * C - 8);
      const ly = p.tilt < 0 ? lo : hi, ry = p.tilt < 0 ? hi : lo, py = ly + (ry - ly) * Math.min(1, Math.max(0, f));
      if (o.y > py - o.r - 6) o.y = py - o.r - 6;
    }
  }
  // the striking ball settles onto the end it pushed down
  b.vx *= 0.2; b.vy = 0;
  rebuild(s);
  return true;
}
function ballBall(s, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, R = a.r + b.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= R * R || d2 === 0) return;
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = R - d, M = a.m + b.m;
  a.x -= nx * over * b.m / M; a.y -= ny * over * b.m / M;
  b.x += nx * over * a.m / M; b.y += ny * over * a.m / M;
  const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rv >= 0) return;
  const j = -(1 + 0.6) * rv / (1 / a.m + 1 / b.m);
  a.vx -= j * nx / a.m; a.vy -= j * ny / a.m;
  b.vx += j * nx / b.m; b.vy += j * ny / b.m;
  if (rv < -1.5) s.events.push({ t: s.t, type: 'clack' });
}
function fields(s, b) {
  b.inFan = false;
  for (const p of s.pieces) {
    if (p.dead) continue;
    if (p.t === 'fan' && p.on) {
      const reach = (p.reach || 4) * C;
      const cx = PX(p) + C / 2, cy = PY(p) + C / 2;
      if (p.dir === 'u') {
        const d = cy - b.y;
        if (d > 0 && d < reach && b.x > PX(p) - 6 && b.x < PX(p) + C + 6) { b.vy -= 0.4 * (1 - d / reach) / b.m; b.vy *= 0.97; b.inFan = true; }
      } else {
        const dir = p.dir === 'l' ? -1 : 1, d = (b.x - cx) * dir;
        if (d > 0 && d < reach && b.y > PY(p) - 10 && b.y < PY(p) + C + 4) b.vx += dir * 0.14 * (1 - d / reach) / b.m;
      }
    }
    if (p.t === 'magnet' && b.steel) {
      const cx = PX(p) + C / 2, cy = PY(p) + C / 2, dx = cx - b.x, dy = cy - b.y;
      const d2 = dx * dx + dy * dy, R = (p.reach || 3) * C;
      if (d2 < R * R && d2 > 1) { const d = Math.sqrt(d2), f = 0.5 * (1 - d / R); b.vx += dx / d * f; b.vy += dy / d * f; }
    }
  }
}

function pipes(s, b) {
  for (const p of s.pieces) {
    if (p.t === 'pipe' && !p.dead) {
      // a ball that drops into the mouth leaves through the side at the speed it came in with
      const a = PX(p), top = PY(p);
      if (b.py < top + 4 && b.y >= top + 4 && b.x > a + 6 && b.x < a + C - 6 && b.vy > 0) {
        const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), dir = p.dir === 'r' ? 1 : -1;
        b.x = a + C / 2 + dir * (C / 2 + b.r - 6); b.y = top + C - 4 - b.r - 4;
        b.vx = dir * Math.max(sp * 0.92, 3); b.vy = 0;
        s.events.push({ t: s.t, type: 'pipe', k: p.k });
      }
    }
  }
}

/* ---------- step ---------- */
export function step(s) {
  if (s.done) return s;
  s.t++;
  // dominoes topple one by one; the last one shoves what is in front of it
  let changed = false;
  for (const p of s.pieces) {
    if (p.t !== 'dominoes' || p.fall < 0) continue;
    const k = Math.floor((s.t - p.fall) / DOMINO_GAP);
    if ((s.t - p.fall) % DOMINO_GAP === 0 && k <= p.n - 1) changed = true;
    if (k === p.n && (s.t - p.fall) % DOMINO_GAP === 0) {
      const dir = p.dir === 'l' ? -1 : 1;
      const tipX = dir > 0 ? PX(p) + 14 + (p.n - 1) * 26 + 56 : PX(p) + C - 14 - (p.n - 1) * 26 - 56;
      for (const o of s.balls) if (o.live && Math.abs(o.x - tipX) < o.r + 10 && Math.abs(o.y - (PY(p) + C - o.r)) < 20) o.vx += dir * 3.6;
      for (const q of s.pieces) if (q.t === 'button' && Math.abs(q.x * C + (q.face === 'r' ? C - 12 : 12) - tipX) < 16 && q.y === p.y) trigger(s, q);
      s.events.push({ t: s.t, type: 'domino-end', k: p.k });
    }
  }
  if (changed) rebuild(s);
  const live = s.balls.filter(b => b.live);
  for (let sub = 0; sub < 2; sub++) {
    for (const b of live) {
      b.px = b.x; b.py = b.y;
      b.vy += PHYS.g * 0.5;
      fields(s, b);
      const sp2 = b.vx * b.vx + b.vy * b.vy;
      if (sp2 > PHYS.maxV * PHYS.maxV) { const k = PHYS.maxV / Math.sqrt(sp2); b.vx *= k; b.vy *= k; }
      b.x += b.vx * 0.5; b.y += b.vy * 0.5;
      pipes(s, b);
      b.contact = false;
      collide(s, b); collide(s, b);
    }
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) ballBall(s, live[i], live[j]);
  }
  for (const b of live) {
    if (s.visited) { const x0 = Math.floor((b.x - b.r - 4) / C), x1 = Math.floor((b.x + b.r + 4) / C), y0 = Math.floor((b.y - b.r - 4) / C), y1 = Math.floor((b.y + b.r + 4) / C); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s.visited.add(x * 100 + y); }
    if (b.contact) { b.vx *= PHYS.roll; }
    b.ang += b.vx / b.r;
    if (b.y > s.H * C + 40 || b.x < -60 || b.x > s.W * C + 60) { b.live = false; s.events.push({ t: s.t, type: 'lost', id: b.id }); }
    for (const p of s.pieces) {
      if (!b.live || (p.t !== 'hoop' && p.t !== 'bucket')) continue;
      const inside = p.t === 'hoop' ? (b.y > PY(p) + 26) : (b.y > PY(p) + 16 && b.contact && Math.abs(b.vy) < 0.5);
      if (b.x > PX(p) + 4 && b.x < PX(p) + C - 4 && inside && b.y < PY(p) + C + 10) {
        if (p.t === 'hoop') b.live = false;
        if (!b.scored) { b.scored = true; s.events.push({ t: s.t, type: p.t, id: b.id, k: p.k }); }
        if (s.goal && (s.goal.type === p.t) && (!s.goal.ball || s.goal.ball === b.id)) s.won = true;
      }
    }
  }
  const moving = s.balls.some(b => b.live && (b.vx * b.vx + b.vy * b.vy > 0.0025 || (!b.contact && !b.inFan))) || s.pieces.some(p => p.t === 'dominoes' && p.fall >= 0 && s.t - p.fall <= p.n * DOMINO_GAP + 2);
  s.quiet = moving ? 0 : s.quiet + 1;
  const gb = s.goal && s.goal.ball && s.balls.find(b => b.id === s.goal.ball);
  if (s.endAt < 0 && s.won) s.endAt = s.t + 50;
  if (s.endAt < 0 && gb && !gb.live && !gb.cannon && !gb.scored) s.endAt = s.t + 30;
  if (s.endAt < 0 && s.quiet > 50) s.endAt = s.t;
  if (s.endAt < 0 && s.t >= (s.maxT || 3000)) s.endAt = s.t;
  if (s.endAt >= 0 && s.t >= s.endAt) s.done = true;
  return s;
}
export function run(level, placed, maxT, track) {
  const s = makeState(level, placed);
  if (track) s.visited = new Set();
  if (maxT) s.maxT = maxT;
  while (!s.done) step(s);
  return s;
}
