// scripts/gen-mow.mjs: deals the bank for Mow (app/mow/puzzles.js), the daily
// mow-every-square lawn puzzle, Mop's outdoor sibling (owner, 2026-11-16: "same
// concept as Mop, but outside of the house mowing the lawn with trees, bushes,
// water features, maybe a shed, fence"). Nothing is authored; every yard is
// generated and solved here, and scripts/verify-mow.mjs re-walks the route.
//
//   node scripts/gen-mow.mjs --until 2026-12-31
//
// APPEND ONLY: rows already in the bank are kept byte for byte, so a yard that
// has gone live is never re-dealt. The bank opens 2026-11-17.
//
// A yard is ONE floor of the Mop model (lib/mop-engine.js): its "rooms" are the
// fenced sections of the yard (Front Yard, Back Yard, Garden ...), its "doors"
// are the gates in those fences, and its "pieces" are what the mower has to go
// round: trees, bushes, hedges, flower beds, rocks, a birdbath, a pond, a shed,
// a trampoline, and on the bigger days the house itself. A piece is
// [x, y, w, h, type]; the engine reads only the first four.
//
// The ramp (owner, 2026-11-16: "similar size ramp for mow, maybe make mow
// slightly larger each day"), one size step a day:
//   Mon 6x6  Tue 7x6  Gentle       Wed 7x7  Thu 8x7  Moderate
//   Fri 8x8  Sat 9x8  Tough        Sun 9x9  the Sunday Edition, the Estate
// The house varies (see yard()): none, a whole house to mow round, or the
// corner of one in a back corner; more often a house on the bigger days. About one weekday in three comes and
// goes by the same street gate, two squares wide; the rest come in from the
// street (bottom) and leave by the back gate (top). Sunday always runs front to
// back. A yard is kept only if EXACTLY ONE route mows every square once.
//
// THE RAMP FROM 2026-11-18 (owner, 2026-11-17: "rework both mop and mow so that
// earlier week days are harder. today's difficulty should be as easy as it gets
// and only run on Mondays"). Today was a Tuesday 7x6, so that is Monday now and
// every day after it climbs a size:
//   Mon 7x6  Gentle       Tue 8x7  Wed 8x8  Moderate
//   Thu 9x8  Fri 9x9  Sat 10x9  Tough      Sun 10x10  the Sunday Edition
// Rows before 2026-11-18 stay as dealt under the old ramp.
//   --redeal-from <date>  drops the rows from that day on and deals them again;
//                         refused unless the day is still in the future (Eastern).
import fs from 'fs';
import { mopModel, countRoutes, checkRoute, furnOf } from '../lib/mop-engine.js';

const FILE = new URL('../app/mow/puzzles.js', import.meta.url);
const START = '2026-11-17';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const until = (() => { const i = process.argv.indexOf('--until'); return i > 0 ? process.argv[i + 1] : '2026-12-31'; })();

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (R, a) => a[Math.floor(R() * a.length)];
const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// By day of the week (0 = Sunday).
export const WEEK = {
  1: { band: 'gentle', w: 6, h: 6, sections: [2, 3], pieces: [4, 5], house: false },
  2: { band: 'gentle', w: 7, h: 6, sections: [2, 3], pieces: [5, 6], house: false },
  3: { band: 'moderate', w: 7, h: 7, sections: [3, 4], pieces: [6, 7], house: false },
  4: { band: 'moderate', w: 8, h: 7, sections: [3, 4], pieces: [7, 8], house: false },
  5: { band: 'tough', w: 8, h: 8, sections: [3, 4], pieces: [7, 8], house: true },
  6: { band: 'tough', w: 9, h: 8, sections: [3, 5], pieces: [8, 9], house: true },
  0: { band: 'sunday', w: 9, h: 9, sections: [4, 5], pieces: [9, 10], house: true },
};
export const RAMP_FROM = '2026-11-18';
export const NEW_WEEK = {
  1: { band: 'gentle', w: 7, h: 6, sections: [2, 3], pieces: [5, 6], house: false },
  2: { band: 'moderate', w: 8, h: 7, sections: [3, 4], pieces: [7, 8], house: false },
  3: { band: 'moderate', w: 8, h: 8, sections: [3, 4], pieces: [8, 9], house: false },
  4: { band: 'tough', w: 9, h: 8, sections: [3, 5], pieces: [8, 9], house: true },
  5: { band: 'tough', w: 9, h: 9, sections: [4, 5], pieces: [9, 10], house: true },
  6: { band: 'tough', w: 10, h: 9, sections: [4, 5], pieces: [10, 11], house: true, routeFirst: true },
  0: { band: 'sunday', w: 10, h: 10, sections: [5, 6], pieces: [13, 15], house: true, routeFirst: true },
};
const YARDS = { gentle: ['Lawn', 'Yard', 'Green'], moderate: ['Park', 'Paddock', 'Common'], tough: ['Grounds', 'Homestead', 'Acre'], sunday: ['Estate'] };
const OTHER = ['Side Yard', 'Garden', 'Orchard', 'Veg Patch', 'Dog Run', 'Meadow'];
// What can stand in a section: [type, w, h]. Two-square pieces turn either way.
const KIT = {
  'Front Yard': [['tree', 1, 1], ['bush', 1, 1], ['flowers', 1, 1], ['flowers', 2, 1], ['rock', 1, 1], ['birdbath', 1, 1], ['hedge', 2, 1]],
  'Back Yard': [['tree', 1, 1], ['bush', 1, 1], ['pond', 2, 1], ['pond', 2, 2], ['shed', 2, 2], ['shed', 2, 1], ['trampoline', 2, 2], ['birdbath', 1, 1]],
  'Side Yard': [['bush', 1, 1], ['hedge', 2, 1], ['rock', 1, 1], ['tree', 1, 1], ['shed', 2, 1]],
  Garden: [['flowers', 1, 1], ['flowers', 2, 1], ['bush', 1, 1], ['fountain', 1, 1], ['pond', 2, 1], ['hedge', 2, 1], ['birdbath', 1, 1]],
  Orchard: [['tree', 1, 1], ['tree', 1, 1], ['tree', 1, 1], ['bush', 1, 1]],
  'Veg Patch': [['veg', 1, 1], ['veg', 2, 1], ['bush', 1, 1], ['rock', 1, 1]],
  'Dog Run': [['kennel', 1, 1], ['tree', 1, 1], ['rock', 1, 1], ['bush', 1, 1]],
  Meadow: [['rock', 1, 1], ['flowers', 1, 1], ['tree', 1, 1], ['pond', 2, 1]],
};

// Cut a w x h yard into `want` rectangles, every side at least 2.
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

export function yard(R, spec, same) {
  const { w, h } = spec, N = w * h;
  const want = spec.sections[0] + Math.floor(R() * (spec.sections[1] - spec.sections[0] + 1));
  const rects = cut(R, w, h, want);
  if (rects.length < spec.sections[0]) return null;
  const letters = 'ABCDEFGHIJ', room = new Array(N);
  rects.forEach(([x, y, rw, rh], ri) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) room[(y + j) * w + x + i] = letters[ri]; });
  const rooms = Array.from({ length: h }, (_, y) => room.slice(y * w, y * w + w).join(''));
  // names: the section on the street is the Front Yard, the one on the back
  // fence the Back Yard (the biggest of each), the rest from OTHER
  const touches = (ri, y) => rects[ri][1] === y || rects[ri][1] + rects[ri][3] - 1 === y;
  const area = (ri) => rects[ri][2] * rects[ri][3];
  const byArea = (list) => list.sort((a, b) => area(b) - area(a));
  const names = {};
  const front = byArea(rects.map((_, i) => i).filter((i) => touches(i, h - 1)))[0];
  names[letters[front]] = 'Front Yard';
  const backs = byArea(rects.map((_, i) => i).filter((i) => i !== front && (same || touches(i, 0))));
  if (backs.length) names[letters[backs[0]]] = 'Back Yard';
  else if (!same) return null;
  const pool = shuffle(R, OTHER.slice());
  rects.forEach((_, i) => { if (!names[letters[i]]) names[letters[i]] = pool.pop(); });
  // the house first, on the big days, in a section with room round it
  const taken = new Set(), pieces = [];
  const cells = (x, y, pw, ph) => { const cs = []; for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) cs.push((y + j) * w + x + i); return cs; };
  const place = (x, y, pw, ph, type) => {
    if (x < 0 || y < 0 || x + pw > w || y + ph > h) return false;
    const cs = cells(x, y, pw, ph);
    if (cs.some((c) => taken.has(c)) || new Set(cs.map((c) => room[c])).size > 1) return false;
    cs.forEach((c) => taken.add(c)); pieces.push([x, y, pw, ph, type]); return true;
  };
  // THE HOUSE VARIES (owner, 2026-11-16: "Mow can go all the way around a house
  // or maybe there's no house on some, maybe house is just a corner of a house in
  // a corner - it should vary"). Three ways, by the day's own draw:
  //   none     no house in the yard
  //   house    a whole house standing clear of every fence, grass all round it
  //   corner   the corner of a house that sits off the yard, filling one of the
  //            two back corners (its walls stand in for the fence there)
  const mode = (() => { const r = R(), [a, b] = spec.house ? [0.2, 0.6] : [0.45, 0.75]; return r < a ? 'none' : r < b ? 'house' : 'corner'; })();
  if (mode === 'house') {
    const [hw, hh] = pick(R, spec.w >= 8 ? [[3, 2], [2, 3], [2, 2]] : [[2, 2], [2, 1], [1, 2]]);
    const fits = rects.map((r, i) => i).filter((i) => rects[i][2] >= hw + 2 && rects[i][3] >= hh + 2);
    if (!fits.length) return null;
    const ri = pick(R, fits), [x, y, rw, rh] = rects[ri];
    if (!place(x + 1 + Math.floor(R() * (rw - hw - 1)), y + 1 + Math.floor(R() * (rh - hh - 1)), hw, hh, 'house')) return null;
  } else if (mode === 'corner') {
    const [hw, hh] = pick(R, spec.w >= 8 ? [[3, 2], [2, 2], [3, 3], [2, 3]] : [[2, 2], [2, 1], [3, 2]]);
    const right = R() < 0.5, x = right ? w - hw : 0;
    if (!place(x, 0, hw, hh, 'corner')) return null;
  }
  const wantPieces = spec.pieces[0] + Math.floor(R() * (spec.pieces[1] - spec.pieces[0] + 1));
  for (let t = 0; pieces.length < wantPieces && t < 400; t++) {
    const ri = Math.floor(R() * rects.length), [rx, ry, rw, rh] = rects[ri];
    let [type, pw, ph] = pick(R, KIT[names[letters[ri]]]);
    if (pw !== ph && R() < 0.5) [pw, ph] = [ph, pw];
    if (pw > rw || ph > rh) continue;
    if (['shed', 'trampoline'].includes(type) && pieces.some((p) => p[4] === type)) continue;
    if (type === 'pond' && pieces.some((p) => p[4] === 'pond')) continue;
    place(rx + Math.floor(R() * (rw - pw + 1)), ry + Math.floor(R() * (rh - ph + 1)), pw, ph, type);
  }
  if (pieces.length < wantPieces) return null;
  const F = { name: 'Yard', w, h, rooms, names, pieces, doors: [], stairs: [], labels: [] };
  const furn = furnOf(F);
  if (!spec.routeFirst) {
    // gates: one in every fence between two sections, sometimes two
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
  }
  // the gates in and out
  const bot = [], top = [];
  for (let x = 0; x < w; x++) { if (!furn.has((h - 1) * w + x)) bot.push((h - 1) * w + x); if (!furn.has(x)) top.push(x); }
  let s, e, sides;
  if (same) {
    const pr = bot.filter((c) => bot.includes(c + 1) && c % w !== w - 1);
    if (!pr.length) return null;
    s = pick(R, pr); e = s + 1; if (R() < 0.5) [s, e] = [e, s]; sides = ['S', 'S'];
  } else {
    // the back gate opens off the Back Yard
    const back = top.filter((c) => names[room[c]] === 'Back Yard');
    if (!bot.length || !back.length) return null;
    s = pick(R, bot); e = pick(R, back); sides = ['S', 'N'];
  }
  if (spec.routeFirst) {
    // ROUTE FIRST (the two biggest yards of the new ramp, 2026-11-17). With
    // gates dealt at random a 10x9 yard almost never has a route at all (one
    // in several million deals), so draw a route across the open lawn first,
    // fences ignored, put a gate wherever it crosses a fence, and keep the
    // yard only if that route is the ONLY one (counted below, as every day).
    const open = [], idx = new Int32Array(N).fill(-1);
    for (let c = 0; c < N; c++) if (!furn.has(c)) { idx[c] = open.length; open.push(c); }
    const adj = open.map((c) => {
      const out = [], x = c % w;
      for (const q of [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, c - w, c + w]) if (q >= 0 && q < N && idx[q] >= 0) out.push(idx[q]);
      return shuffle(R, out);
    });
    // a path over every open square needs the checkerboard to balance: with
    // equal counts the two ends differ in colour, with one extra both ends
    // are on the colour that has it. Re-pick the gates in and out to fit.
    const col = (c) => ((c % w) + Math.floor(c / w)) & 1;
    const nb = open.filter((c) => col(c) === 0).length, nw = open.length - nb;
    const fits = (u, v) => (nb === nw ? col(u) !== col(v) : Math.abs(nb - nw) === 1 && col(u) === col(v) && col(u) === (nb > nw ? 0 : 1));
    if (!fits(s, e)) {
      if (same) return null;
      const back = top.filter((c) => names[room[c]] === 'Back Yard');
      const pairs = []; for (const u of bot) for (const v of back) if (fits(u, v)) pairs.push([u, v]);
      if (!pairs.length) return null;
      [s, e] = pick(R, pairs);
    }
    const g = countRoutes(adj, idx[s], idx[e], { cap: 1, nodeCap: 60000 });
    if (!g.first) return null;
    const route = g.first.map((i) => open[i]), per = {};
    for (let i = 1; i < route.length; i++) {
      const [c, q] = [route[i - 1], route[i]].sort((u, v) => u - v);
      if (room[c] === room[q]) continue;
      const k = [room[c], room[q]].sort().join('');
      if ((per[k] = (per[k] || 0) + 1) > 3) return null;
      F.doors.push([c, q]);
    }
    F.doors.sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  }
  const P = { floors: [F], start: [0, s], end: [0, e], sides };
  const M = mopModel(P);
  if (M.n < N * 0.6) return null;
  const r = countRoutes(M.adj, M.start, M.end, { cap: 2, nodeCap: 300000 });
  if (r.capped || r.count !== 1) return null;
  const cellOf = M.at.map((a) => a[0][1]);
  return { P, sol: r.first.map((id) => [0, cellOf[id]]) };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  let rows = [];
  if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
  const redeal = (() => { const i = process.argv.indexOf('--redeal-from'); return i > 0 ? process.argv[i + 1] : null; })();
  if (redeal) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (!(redeal > today)) throw new Error(`--redeal-from ${redeal} is not in the future (today is ${today}): a live yard is never re-dealt`);
    rows = rows.filter((r) => r.live < redeal);
  }
  const HEAD = `// Puzzle data for Mow, the daily mow-every-square lawn puzzle.
// GENERATED by scripts/gen-mow.mjs; do not edit by hand. Extend with
// \`node scripts/gen-mow.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-mow.mjs. Imported only by the server page,
// which strips days not yet live AND the stored route (\`sol\`) before anything
// reaches a browser. The rules and the week's ramp are in the generator.
//   band    gentle | moderate | tough | sunday        yard  the day's name for it
//   floors  one floor, the Yard (the shape of lib/mop-engine.js)
//     rooms   one string a row, a letter a fenced section    names  the section names
//     pieces  [x, y, w, h, type] what the mower goes round
//     doors   [a, b] the gates: pairs of squares joined through a fence
//   start, end  [0, square] inside the gate in and the gate out; sides, their fences
//   sol     one full route, [0, square] a step (server only)
//   sunday  the Sunday Edition
export const PUZZLES = [
`;
  const day0 = Date.parse(START + 'T12:00:00Z'), last = Date.parse(until + 'T12:00:00Z');
  const kept = rows.length;
  for (let i = rows.length; day0 + i * 86400000 <= last; i++) {
    const d = new Date(day0 + i * 86400000), iso = d.toISOString().slice(0, 10), dow = d.getUTCDay();
    const [y, m, dd] = iso.split('-').map(Number);
    const spec = (iso >= RAMP_FROM ? NEW_WEEK : WEEK)[dow];
    let got = null, tries = 0;
    const t0 = Date.now();
    for (let a = 0; a < 4000000 && !got; a++) {
      tries = a;
      const R = rng((y * 10000 + m * 100 + dd) * 1301 + a * 7919);
      got = yard(R, spec, dow !== 0 && R() < 0.34);
    }
    if (!got) throw new Error(`no yard for ${iso}`);
    const err = checkRoute(got.P, got.sol);
    if (err) throw new Error(`${iso}: ${err}`);
    const R2 = rng(i * 37 + 11);
    const row = { num: i + 1, quizId: `mow-${m}-${dd}-${String(y).slice(2)}`, live: iso, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
    if (dow === 0) row.sunday = true;
    row.band = spec.band; row.yard = pick(R2, YARDS[spec.band]);
    const F = got.P.floors[0];
    Object.assign(row, { floors: [{ name: F.name, w: F.w, h: F.h, rooms: F.rooms, names: F.names, pieces: F.pieces, doors: F.doors, stairs: [], labels: [] }], start: got.P.start, end: got.P.end, sides: got.P.sides, sol: got.sol });
    rows.push(row);
    console.log(`${iso} ${spec.band.padEnd(8)} ${F.w}x${F.h} ${mopModel(row).n} squares, ${tries + 1} deals, ${Date.now() - t0}ms`);
  }
  fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
  console.log(`mow: ${rows.length} yards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
}
