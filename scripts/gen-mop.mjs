// scripts/gen-mop.mjs: deals the bank for Mop (app/mop/puzzles.js), the daily
// mop-every-tile puzzle. Nothing is authored; every board is generated and
// solved here, and scripts/verify-mop.mjs re-walks the stored route.
//
//   node scripts/gen-mop.mjs --until 2026-12-31
//
// APPEND ONLY: rows already in the bank are kept byte for byte, so a board that
// has gone live is never re-dealt. The bank opens 2026-11-13.
//
// The week (owner, 2026-11-13):
//   Mon, Tue   Gentle    one floor, 6x6
//   Wed, Thu   Moderate  one floor, 7x7
//   Fri, Sat   Tough     one floor, 8x8
//   Sunday     the Sunday Edition: three 6x6 floors (Upstairs, Ground Floor,
//              Basement) joined by two staircases up and two down
// A weekday comes in the front (bottom wall) and leaves by the back (top wall),
// or, about one day in three, comes and goes by a front door two tiles wide.
// Sunday always comes in the front and leaves by the back.
//
// A floor is cut into rooms by random splits, doorways are opened between
// neighbouring rooms, and furniture of one or two tiles is set down, some of it
// in the middle of a room (owner: "more items in middle of room like couch").
// A board is kept only if EXACTLY ONE route stands on every open tile once (the
// solver counts to two and throws the board away if it gets there). On a Sunday
// each floor is proved on its own: the ground floor with each staircase pair
// standing in for the floor behind it, then each of the other two between its
// two staircases.
import fs from 'fs';
import { mopModel, countRoutes, checkRoute, furnOf } from '../lib/mop-engine.js';

const FILE = new URL('../app/mop/puzzles.js', import.meta.url);
const START = '2026-11-13';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const until = (() => { const i = process.argv.indexOf('--until'); return i > 0 ? process.argv[i + 1] : '2026-12-31'; })();

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (R, a) => a[Math.floor(R() * a.length)];
const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const BANDS = {
  gentle: { size: 6, rooms: [4, 5], pieces: [4, 5], cap: 1, houses: ['Cottage', 'Bungalow', 'Cabin'] },
  moderate: { size: 7, rooms: [5, 6], pieces: [6, 7], cap: 1, houses: ['Townhouse', 'Farmhouse', 'Rowhouse'] },
  tough: { size: 8, rooms: [6, 8], pieces: [7, 9], cap: 1, houses: ['Manor', 'Villa', 'Lodge'] },
};
const NAMES = {
  house: { big: ['Living'], rest: ['Kitchen', 'Bedroom', 'Dining', 'Bath', 'Hall', 'Study', 'Laundry', 'Pantry'] },
  ground: { big: ['Living'], rest: ['Kitchen', 'Dining', 'Hall', 'Study', 'Pantry'] },
  up: { big: ['Bedroom'], rest: ['Bath', 'Nursery', 'Guest Room', 'Office'] },
  down: { big: ['Rec Room'], rest: ['Laundry', 'Storage', 'Workshop'] },
};

// Cut a w x h floor into `want` rectangles, every side at least 2.
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

function floor(R, kind, size, wantRooms, wantPieces, keep = []) {
  const w = size, h = size, N = w * h;
  const rects = cut(R, w, h, wantRooms);
  if (rects.length < Math.min(wantRooms, 3)) return null;
  const letters = 'ABCDEFGHIJ';
  const byArea = rects.map((r, i) => [r[2] * r[3], i]).sort((a, b) => b[0] - a[0]).map((a) => a[1]);
  const pool = shuffle(R, NAMES[kind].rest.slice());
  if (rects.length - 1 > pool.length) return null;
  const names = {}, room = new Array(N);
  byArea.forEach((ri, rank) => { names[letters[ri]] = rank === 0 ? NAMES[kind].big[0] : pool[rank - 1]; });
  rects.forEach(([x, y, rw, rh], ri) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) room[(y + j) * w + x + i] = letters[ri]; });
  const rooms = Array.from({ length: h }, (_, y) => room.slice(y * w, y * w + w).join(''));
  // furniture: islands first (clear of the room's walls), then the rest anywhere
  const taken = new Set(keep), pieces = [];
  const place = (x, y, pw, ph, island) => {
    const cs = []; for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) cs.push((y + j) * w + x + i);
    if (cs.some((c) => taken.has(c)) || new Set(cs.map((c) => room[c])).size > 1) return false;
    cs.forEach((c) => taken.add(c)); pieces.push(island ? [x, y, pw, ph, 1] : [x, y, pw, ph]); return true;
  };
  for (const ri of byArea) {
    if (pieces.length >= wantPieces) break;
    const [x, y, rw, rh] = rects[ri];
    if (rw < 3 || rh < 3 || R() < 0.25) continue;
    const big = (rw >= 4 || rh >= 4) && R() < 0.75;
    let pw = 1, ph = 1;
    if (big) { if (rw >= 4 && (rh < 4 || R() < 0.5)) pw = 2; else ph = 2; }
    if (rw - 2 < pw || rh - 2 < ph) { pw = 1; ph = 1; }
    place(x + 1 + Math.floor(R() * (rw - 1 - pw)), y + 1 + Math.floor(R() * (rh - 1 - ph)), pw, ph, true);
  }
  for (let t = 0; pieces.length < wantPieces && t < 300; t++) {
    const [pw, ph] = pick(R, [[1, 1], [1, 1], [2, 1], [1, 2]]);
    place(Math.floor(R() * (w - pw + 1)), Math.floor(R() * (h - ph + 1)), pw, ph, false);
  }
  if (pieces.length < wantPieces) return null;
  const F = { w, h, rooms, names, pieces, doors: [], stairs: [], labels: [] };
  const furn = furnOf(F);
  // doorways: one between every pair of touching rooms, sometimes two
  const segs = {};
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
    if (v.length > 2 && R() < 0.35) F.doors.push(v[1]);
  }
  F.doors.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return F;
}

function weekday(R, band, same) {
  const B = BANDS[band];
  const F = floor(R, 'house', B.size, B.rooms[0] + Math.floor(R() * (B.rooms[1] - B.rooms[0] + 1)), B.pieces[0] + Math.floor(R() * (B.pieces[1] - B.pieces[0] + 1)));
  if (!F) return null;
  F.name = 'House';
  const furn = furnOf(F), w = F.w, h = F.h;
  const bot = [], top = [];
  for (let x = 0; x < w; x++) { if (!furn.has((h - 1) * w + x)) bot.push((h - 1) * w + x); if (!furn.has(x)) top.push(x); }
  let s, e, sides;
  if (same) {
    const pr = bot.filter((c) => bot.includes(c + 1));
    if (!pr.length) return null;
    s = pick(R, pr); e = s + 1; if (R() < 0.5) [s, e] = [e, s]; sides = ['S', 'S'];
  } else { if (!bot.length || !top.length) return null; s = pick(R, bot); e = pick(R, top); sides = ['S', 'N']; }
  const P = { floors: [F], start: [0, s], end: [0, e], sides };
  const M = mopModel(P);
  const r = countRoutes(M.adj, M.start, M.end, { cap: B.cap + 1, nodeCap: 250000 });
  if (r.capped || !r.count || r.count > B.cap) return null;
  const cellOf = M.at.map((a) => a[0][1]);
  return { P, sol: r.first.map((id) => [0, cellOf[id]]), routes: r.count };
}

const dist = (a, b, w) => Math.abs((a % w) - (b % w)) + Math.abs(Math.floor(a / w) - Math.floor(b / w));
function sunday(R) {
  const S = 6, N = S * S;
  const st = shuffle(R, Array.from({ length: N }, (_, i) => i)).slice(0, 4);
  const [u1, u2, b1, b2] = st;
  if (dist(u1, u2, S) < 3 || dist(b1, b2, S) < 3) return null;
  const G = floor(R, 'ground', S, 4 + Math.floor(R() * 2), 3, st);
  if (!G) return null;
  G.name = 'Ground Floor'; G.stairs = st; G.labels = ['Up', 'Up', 'Down', 'Down'];
  const furn = furnOf(G), bot = [], top = [];
  for (let x = 0; x < S; x++) { const b = (S - 1) * S + x; if (!furn.has(b) && !st.includes(b)) bot.push(b); if (!furn.has(x) && !st.includes(x)) top.push(x); }
  if (!bot.length || !top.length) return null;
  const s = pick(R, bot), e = pick(R, top);
  // the ground floor alone, with each staircase pair standing in for its floor
  const solo = mopModel({ floors: [{ ...G, stairs: [] }], start: [0, s], end: [0, e] });
  const nd = (c) => solo.floors[0].node[c];
  const adj = solo.adj.map((a) => a.slice());
  for (const [a, b] of [[u1, u2], [b1, b2]]) { const x = nd(a), y = nd(b); if (!adj[x].includes(y)) { adj[x].push(y); adj[y].push(x); } }
  const rg = countRoutes(adj, solo.start, solo.end, { pairs: [[nd(u1), nd(u2)], [nd(b1), nd(b2)]], cap: 2, nodeCap: 250000 });
  if (rg.capped || rg.count !== 1) return null;
  const other = (kind, name, pair, labels) => {
    for (let t = 0; t < 2500; t++) {
      const F = floor(R, kind, S, 4 + Math.floor(R() * 2), 4 + Math.floor(R() * 2), pair);
      if (!F) continue;
      F.name = name;
      const M = mopModel({ floors: [F], start: [0, pair[0]], end: [0, pair[1]] });
      const r = countRoutes(M.adj, M.start, M.end, { cap: 2, nodeCap: 250000 });
      if (r.capped || r.count !== 1) continue;
      F.stairs = pair.slice(); F.labels = labels;
      const cellOf = M.at.map((a) => a[0][1]);
      return { F, route: r.first.map((id) => cellOf[id]), routes: r.count };
    }
    return null;
  };
  const up = other('up', 'Upstairs', [u1, u2], ['Down', 'Down']); if (!up) return null;
  const down = other('down', 'Basement', [b1, b2], ['Up', 'Up']); if (!down) return null;
  const cellOf = solo.at.map((a) => a[0][1]);
  const gp = rg.first.map((id) => cellOf[id]);
  const sol = [];
  for (let i = 0; i < gp.length; i++) {
    const c = gp[i];
    if (c === u1 || c === u2) { (c === u1 ? up.route : up.route.slice().reverse()).forEach((x) => sol.push([0, x])); i++; }
    else if (c === b1 || c === b2) { (c === b1 ? down.route : down.route.slice().reverse()).forEach((x) => sol.push([2, x])); i++; }
    else sol.push([1, c]);
  }
  const P = { floors: [up.F, G, down.F], start: [1, s], end: [1, e], sides: ['S', 'N'] };
  return { P, sol, routes: rg.count * up.routes * down.routes };
}

// ── the bank ────────────────────────────────────────────────────────────────
let rows = [];
if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
const HEAD = `// Puzzle data for Mop, the daily mop-every-tile puzzle.
// GENERATED by scripts/gen-mop.mjs; do not edit by hand. Extend with
// \`node scripts/gen-mop.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-mop.mjs. Imported only by the server page,
// which strips days not yet live AND the stored route (\`sol\`) before anything
// reaches a browser. The rules and the week's ramp are in the generator.
//   band    gentle | moderate | tough | sunday        house  the day's name for it
//   floors  one floor on a weekday; Upstairs, Ground Floor, Basement on a Sunday
//     rooms   one string a row, a letter a room      names   the letter's room name
//     pieces  [x, y, w, h] furniture (a fifth 1 = stands clear of the walls)
//     doors   [a, b] pairs of squares joined through a wall
//     stairs  squares that are staircases, shared with the floor they lead to
//   start, end  [floor, square] inside the way in and the way out; sides, their walls
//   sol     one full route, [floor, square] a step (server only)
//   sunday  the Sunday Edition
export const PUZZLES = [
`;
const day0 = Date.parse(START + 'T12:00:00Z'), last = Date.parse(until + 'T12:00:00Z');
const kept = rows.length;
for (let i = rows.length; day0 + i * 86400000 <= last; i++) {
  const d = new Date(day0 + i * 86400000), iso = d.toISOString().slice(0, 10), dow = d.getUTCDay();
  const [y, m, dd] = iso.split('-').map(Number);
  const band = dow === 0 ? 'sunday' : dow <= 2 ? 'gentle' : dow <= 4 ? 'moderate' : 'tough';
  let got = null, tries = 0;
  for (let a = 0; a < 4000000 && !got; a++) {
    tries = a;
    const R = rng((y * 10000 + m * 100 + dd) * 977 + a * 7919);
    got = band === 'sunday' ? sunday(R) : weekday(R, band, R() < 0.34);
  }
  if (!got) throw new Error(`no board for ${iso}`);
  const err = checkRoute(got.P, got.sol);
  if (err) throw new Error(`${iso}: ${err}`);
  const R2 = rng(i * 31 + 5);
  const row = { num: i + 1, quizId: `mop-${m}-${dd}-${String(y).slice(2)}`, live: iso, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  row.band = band; row.house = band === 'sunday' ? 'Three Floors' : pick(R2, BANDS[band].houses);
  Object.assign(row, { floors: got.P.floors.map((F) => ({ name: F.name, w: F.w, h: F.h, rooms: F.rooms, names: F.names, pieces: F.pieces, doors: F.doors, stairs: F.stairs, labels: F.labels })), start: got.P.start, end: got.P.end, sides: got.P.sides, sol: got.sol });
  rows.push(row);
  console.log(`${iso} ${band.padEnd(8)} ${mopModel(row).n} tiles, ${got.routes} route(s), ${tries + 1} deals`);
}
fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
console.log(`mop: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
