// scripts/gen-kids-mop.mjs: deals the bank for kids Mop (app/kids/mop/puzzles.js).
// Owner, 2026-11-15: "make a kids version of our mop game". The same rule as
// the grown-up Mop (mop every tile once, never step on a wet tile, finish on
// the tile inside the way out), on a little one-floor house: 4x4, 5x4 or 5x5,
// two to four rooms, one to three pieces of furniture. Nothing is authored;
// every board is generated and solved here, and scripts/verify-kids.mjs
// re-walks the stored route with lib/mop-engine.js checkRoute.
//
//   node scripts/gen-kids-mop.mjs
//
// The bank CYCLES over kids days (lib/kids-daily.js), so it is dealt once, 60
// boards, seeded by board number: running it again writes the same file.
// Boards go small, medium, big in turn, so a lap is a gentle ramp that
// starts over every three days. A board may have more than one route (no
// leaderboard here, any route that cleans the house is a win); `sol` is one of
// them and is what "Show me" walks.
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { mopModel, countRoutes, checkRoute, furnOf } from '../lib/mop-engine.js';

const FILE = new URL('../app/kids/mop/puzzles.js', import.meta.url);
const COUNT = 60;

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (R, a) => a[Math.floor(R() * a.length)];
const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// small 4x4, medium 5x4, big 5x5
export const SIZES = [
  { w: 4, h: 4, rooms: [2, 3], pieces: [1, 2], house: 'Tiny House' },
  { w: 5, h: 4, rooms: [2, 3], pieces: [1, 2], house: 'Cottage' },
  { w: 5, h: 5, rooms: [3, 4], pieces: [2, 3], house: 'Little House' },
];
const NAMES = { big: 'Living', rest: ['Kitchen', 'Bedroom', 'Bath', 'Nursery', 'Hall'] };

function cut(R, w, h, want) {
  let rects = [[0, 0, w, h]];
  for (let guard = 0; rects.length < want && guard < 200; guard++) {
    const order = rects.map((r, i) => [r[2] * r[3] * (0.6 + R()), i]).sort((a, b) => b[0] - a[0]);
    let done = false;
    for (const [, i] of order) {
      const [x, y, rw, rh] = rects[i];
      const vert = rw > rh ? true : rh > rw ? false : R() < 0.5;
      const len = vert ? rw : rh;
      if (len < 4) continue;
      const at = 2 + Math.floor(R() * (len - 3));
      rects.splice(i, 1, vert ? [x, y, at, rh] : [x, y, rw, at], vert ? [x + at, y, rw - at, rh] : [x, y + at, rw, rh - at]);
      done = true; break;
    }
    if (!done) break;
  }
  return rects;
}

function house(R, S) {
  const { w, h } = S, N = w * h;
  const want = S.rooms[0] + Math.floor(R() * (S.rooms[1] - S.rooms[0] + 1));
  const rects = cut(R, w, h, want);
  if (rects.length < 2) return null;
  const letters = 'ABCDEF', room = new Array(N), names = {};
  const byArea = rects.map((r, i) => [r[2] * r[3], i]).sort((a, b) => b[0] - a[0]).map((a) => a[1]);
  const pool = shuffle(R, NAMES.rest.slice());
  byArea.forEach((ri, rank) => { names[letters[ri]] = rank === 0 ? NAMES.big : pool[rank - 1]; });
  rects.forEach(([x, y, rw, rh], ri) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) room[(y + j) * w + x + i] = letters[ri]; });
  const rooms = Array.from({ length: h }, (_, y) => room.slice(y * w, y * w + w).join(''));
  const wantP = S.pieces[0] + Math.floor(R() * (S.pieces[1] - S.pieces[0] + 1));
  const taken = new Set(), pieces = [];
  for (let t = 0; pieces.length < wantP && t < 200; t++) {
    const [pw, ph] = pick(R, [[1, 1], [1, 1], [2, 1], [1, 2]]);
    const x = Math.floor(R() * (w - pw + 1)), y = Math.floor(R() * (h - ph + 1));
    const cs = []; for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) cs.push((y + j) * w + x + i);
    if (cs.some((c) => taken.has(c)) || new Set(cs.map((c) => room[c])).size > 1) continue;
    // keep the front and back walls clear so there is always a door to use
    if (cs.some((c) => c < w || c >= N - w) && R() < 0.7) continue;
    cs.forEach((c) => taken.add(c)); pieces.push([x, y, pw, ph]);
  }
  if (pieces.length < wantP) return null;
  const F = { name: 'House', w, h, rooms, names, pieces, doors: [], stairs: [], labels: [] };
  const furn = furnOf(F), segs = {};
  for (let c = 0; c < N; c++) for (const d of [1, w]) {
    const q = c + d;
    if ((d === 1 && c % w === w - 1) || q >= N || room[c] === room[q]) continue;
    const k = [room[c], room[q]].sort().join('');
    (segs[k] = segs[k] || []).push([c, q]);
  }
  for (const k of Object.keys(segs).sort()) {
    const v = shuffle(R, segs[k].filter(([a, b]) => !furn.has(a) && !furn.has(b)));
    if (!v.length) continue;
    F.doors.push(v[0]);
    if (v.length > 1 && R() < 0.5) F.doors.push(v[1]);
  }
  F.doors.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return F;
}

function deal(R, S) {
  const F = house(R, S);
  if (!F) return null;
  const furn = furnOf(F), { w, h } = F, bot = [], top = [];
  for (let x = 0; x < w; x++) { if (!furn.has((h - 1) * w + x)) bot.push((h - 1) * w + x); if (!furn.has(x)) top.push(x); }
  let s, e, sides;
  if (R() < 0.3) {
    const pr = bot.filter((c) => bot.includes(c + 1));
    if (!pr.length) return null;
    s = pick(R, pr); e = s + 1; if (R() < 0.5) [s, e] = [e, s]; sides = ['S', 'S'];
  } else { if (!bot.length || !top.length) return null; s = pick(R, bot); e = pick(R, top); sides = ['S', 'N']; }
  const P = { floors: [F], start: [0, s], end: [0, e], sides };
  const M = mopModel(P);
  if (M.n < w * h - 4) return null;
  const r = countRoutes(M.adj, M.start, M.end, { cap: 6, nodeCap: 200000 });
  if (r.capped || !r.count) return null;
  const cellOf = M.at.map((a) => a[0][1]);
  return { P, sol: r.first.map((id) => [0, cellOf[id]]), routes: r.count };
}

const HEAD = `// Kids Mop bank. GENERATED by scripts/gen-kids-mop.mjs; do not edit by hand.
// A one-floor house (the grown-up Mop's board shape, lib/mop-engine.js): rooms
// one string a row, names per room letter, pieces [x, y, w, h] furniture,
// doors [a, b] squares joined through a wall, start/end [floor, square] inside
// the way in and out, sides their walls, and sol one full route ([floor,
// square] a step) that "Show me" walks. A board may have more than one route;
// any route that mops every tile and ends at Out is a win. The bank CYCLES
// over kids days (lib/kids-daily.js). Checked by scripts/verify-kids.mjs.
export const PUZZLES = [
`;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const rows = [], seen = new Set();
  for (let i = 0; i < COUNT; i++) {
    const S = SIZES[i % 3];
    let got = null;
    for (let a = 0; a < 200000 && !got; a++) {
      const g = deal(rng((i + 1) * 104729 + a * 7919), S);
      if (!g) continue;
      const sig = JSON.stringify([g.P.floors[0].rooms, g.P.floors[0].pieces, g.P.start, g.P.end]);
      if (seen.has(sig)) continue;
      seen.add(sig); got = g;
    }
    if (!got) throw new Error(`no board for #${i + 1}`);
    const err = checkRoute(got.P, got.sol);
    if (err) throw new Error(`#${i + 1}: ${err}`);
    const F = got.P.floors[0];
    rows.push({ num: i + 1, house: S.house, floors: [{ name: F.name, w: F.w, h: F.h, rooms: F.rooms, names: F.names, pieces: F.pieces, doors: F.doors, stairs: [], labels: [] }], start: got.P.start, end: got.P.end, sides: got.P.sides, sol: got.sol });
    console.log(`#${i + 1} ${F.w}x${F.h} ${mopModel(got.P).n} tiles, ${got.routes}${got.routes >= 6 ? '+' : ''} route(s)`);
  }
  fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
  console.log(`kids mop: ${rows.length} boards`);
}
