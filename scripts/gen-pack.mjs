// scripts/gen-pack.mjs: deals the Pack bank (app/pack/puzzles.js). APPEND ONLY:
// every row already in the file is kept byte for byte, and new days are added
// up to --until. A board that has gone live is never re-dealt.
//   node scripts/gen-pack.mjs --until 2026-12-31
//
// Owner, 2026-11-14: "a 3D packing puzzle. Trunk of a car, by Sunday it's a
// moving van." The vehicle grows through the week (wide x deep x high, in cells):
//   Mon  gentle    Hatchback       3 x 3 x 2    5 items, room to spare
//   Tue  gentle    Sedan           3 x 4 x 2    7 items, one of them shaped
//   Wed  moderate  Station Wagon   3 x 4 x 3    8 items, one shaped
//   Thu  moderate  Minivan         4 x 4 x 3    9 items, one shaped
//   Fri  tough     Pickup          4 x 5 x 3   11 items, two shaped, an exact fit
//   Sat  tough     Cargo Van       4 x 6 x 3   13 items, two shaped, an exact fit
//   Sun  sunday    Moving Van      4 x 7 x 4   16 items, four shaped (the Sunday Edition)
// THE BANK OPENS WITH TWO INTRO BOARDS (owner, 2026-11-14: "Saturday and Sunday are too hard as an
// intro ... put some early early week versions in place for today and tomorrow"): a Hatchback on
// 2026-11-14 as on a Monday and a Sedan on 2026-11-15 as on a Tuesday, both band `intro`. The moving
// van first dealt for 11-15 was not thrown away: it is dealt again, from the same seed, as the Sunday
// Edition of 2027-01-03 (SEED_AS).
//   node scripts/gen-pack.mjs --redeal 2026-11-15     re-deals ONE day that has not gone live yet
//
// HOW A BOARD IS MADE. The whole space is cut into boxes, biggest first and near
// the middle. Some boxes two cells high are then carved into a SHAPED item and
// the plain box that fits against it: a sofa and the thing that rides on its
// seat, a table and the thing under it. So a packing exists by construction.
// On the days with room to spare the smallest box is left on the curb.
// A loading order is found by peeling items off the top (an item comes out when
// nothing is above it) and reversing; the stored packing is then loaded through
// the real drop (lib/pack-engine.js) and a deal is thrown away unless every item
// lands exactly where it was cut. `sol` is that order. The page strips `sol`.
// Every board is dealt from its date, so a re-run deals the same day.
import fs from 'fs';
import { ROTS, orient, occOf, dropAt, clearAbove, replay } from '../lib/pack-engine.js';
import { shapeOf } from '../lib/pack-art.js';
import { MONTHS } from './six-verify-common.mjs';

const FILE = new URL('../app/pack/puzzles.js', import.meta.url);
const START = '2026-11-14';
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const UNTIL = arg('--until') || '2027-01-03';
const REDEAL = arg('--redeal');
// The intro days deal a weekday's board whatever day they fall on; a day in SEED_AS deals from another day's seed.
const INTRO = { '2026-11-14': 1, '2026-11-15': 2 };
const SEED_AS = { '2027-01-03': '2026-11-15' };
const etToday = () => { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return new Date().toISOString().slice(0, 10); } };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

import { SPEC } from './gen-pack-spec.mjs';
const T = (n, k, c, x) => ({ n, k, c, x });
// What a plain box of each size can be, by its sides sorted small to large.
const TABLE = { car: {
  '1,1,1': [T('Shoebox', 'box', 'sand', 'red'), T('First Aid Kit', 'firstaid'), T('Toolbox', 'toolbox', 'red'), T('Lunch Cooler', 'cooler', 'coral')],
  '1,1,2': [T('Backpack', 'backpack', 'teal'), T('Picnic Basket', 'crate', 'sand', 'basket'), T('Duffel', 'roll', 'navy'), T('Boot Box', 'box', 'card', 'pine')],
  '1,1,3': [T('Tent Bag', 'roll', 'green'), T('Yoga Mat', 'roll', 'lilac'), T('Sleeping Bag', 'roll', 'coral')],
  '1,1,4': [T('Skis', 'suitcase', 'sky'), T('Golf Bag', 'roll', 'sage')],
  '1,1,5': [T('Kayak Paddle', 'roll', 'must')],
  '1,2,2': [T('Carry-On', 'suitcase', 'teal'), T('Cooler', 'cooler', 'sky'), T('Grocery Crate', 'crate', 'sand'), T('Toolbox', 'toolbox', 'red')],
  '1,2,3': [T('Suitcase', 'suitcase', 'rose'), T('Guitar Case', 'suitcase', 'navy'), T('Garment Bag', 'suitcase', 'lilac')],
  '1,2,4': [T('Surfboard Bag', 'suitcase', 'mint'), T('Lumber', 'lumber')], '1,2,5': [T('Lumber', 'lumber')],
  '1,3,3': [T('Plywood', 'slab', 'wood')], '1,3,4': [T('Plywood', 'slab', 'wood')],
  '2,2,2': [T('Big Cooler', 'cooler', 'coral'), T('Dog Crate', 'crate', 'slate', 'dog')],
  '2,2,3': [T('Steamer Trunk', 'suitcase', 'wood'), T('Camping Bin', 'cooler', 'green')],
  '*': T('Camping Bin', 'cooler', 'green') },
van: {
  '1,1,1': [T('Box', 'box', 'card', 'red'), T('Speaker', 'speaker'), T('Stool', 'drawers', 'red', true), T('Box', 'box', 'card', 'sky')],
  '1,1,2': [T('Nightstand', 'drawers', 'must', true), T('Microwave', 'microwave'), T('Speaker', 'speaker'), T('Box', 'box', 'card', 'pine')],
  '1,1,3': [T('Bookcase', 'bookcase', 'wood'), T('Rug', 'roll', 'coral'), T('Box', 'box', 'card', 'sky')],
  '1,1,4': [T('Rug', 'roll', 'coral'), T('Curtain Rods', 'roll', 'slate')],
  '1,2,2': [T('TV', 'tv'), T('Dresser', 'drawers', 'teal', false), T('Mirror', 'mirror', 'must'), T('Box', 'box', 'card', 'red')],
  '1,2,3': [T('Headboard', 'slab', 'navy'), T('Bookcase', 'bookcase', 'wood2'), T('TV', 'tv')],
  '1,2,4': [T('Bed Frame', 'slab', 'wood'), T('Box', 'box', 'card', 'pine')],
  '1,3,3': [T('Mattress', 'mattress', 'cream'), T('Box Spring', 'mattress', 'sky', true)],
  '1,3,4': [T('Mattress', 'mattress', 'cream'), T('Box Spring', 'mattress', 'sky', true)], '1,4,4': [T('Mattress', 'mattress', 'cream')],
  '2,2,2': [T('Washer', 'washer', 'white'), T('Dryer', 'washer', 'white', 'dryer'), T('Box', 'box', 'card', 'sky')],
  '2,2,3': [T('Fridge', 'fridge', 'mint'), T('Wardrobe', 'wardrobe', 'plum')], '2,2,4': [T('Wardrobe', 'wardrobe', 'plum')], '2,3,3': [T('Piano', 'piano')],
  '*': T('Box', 'box', 'card', 'red') } };
// What a box two cells high can be carved into, by its floor sorted small to large.
const CARVE = { van: {
  '2,3': [{ n: 'Dining Table', k: 'table', c: 'wood', x: { a: 2, b: 3 }, note: 'room underneath' }, { n: 'Sofa', k: 'sofa', c: 'sage', x: { n: 3 }, note: 'seat and back' }],
  '2,4': [{ n: 'Sofa', k: 'sofa', c: 'sage', x: { n: 4 }, note: 'seat and back' }],
  '2,2': [{ n: 'Loveseat', k: 'sofa', c: 'lilac', x: { n: 2 }, note: 'seat and back' }],
  '1,3': [{ n: 'Desk', k: 'table', c: 'wood2', x: { a: 3, b: 1 }, note: 'room underneath' }],
  '1,2': [{ n: 'Armchair', k: 'sofa', c: 'must', x: { n: 1 }, note: 'seat and back' }] },
car: {
  '2,3': [{ n: 'Picnic Table', k: 'table', c: 'wood', x: { a: 2, b: 3 }, note: 'room underneath' }],
  '1,3': [{ n: 'Camp Table', k: 'table', c: 'sage', x: { a: 3, b: 1 }, note: 'room underneath' }],
  '1,2': [{ n: 'Beach Chair', k: 'sofa', c: 'sky', x: { n: 1, stripe: true }, note: 'seat and back' }] } };

const vol = (b) => b.dx * b.dy * b.dz;
function cut(W, D, H, n, R) {
  const boxes = [{ x: 0, y: 0, z: 0, dx: W, dy: D, dz: H }];
  for (let guard = 0; boxes.length < n && guard < 500; guard++) {
    boxes.sort((a, b) => vol(b) - vol(a));
    let i = R() < 0.7 ? 0 : Math.min(1, boxes.length - 1), b = boxes[i];
    let ax = ['x', 'y', 'z'].filter((k) => b['d' + k] > 1);
    if (!ax.length) { i = 0; b = boxes[0]; ax = ['x', 'y', 'z'].filter((k) => b['d' + k] > 1); if (!ax.length) break; }
    ax.sort((p, q) => b['d' + q] - b['d' + p]);
    const a = R() < 0.72 ? ax[0] : ax[Math.floor(R() * ax.length)], d = 'd' + a, len = b[d], at = Math.max(1, Math.min(len - 1, Math.round(len / 2 + (R() - 0.5) * 1.6)));
    const b1 = { ...b }, b2 = { ...b }; b1[d] = at; b2[a] = b[a] + at; b2[d] = len - at;
    boxes.splice(i, 1, b1, b2);
  }
  return boxes;
}
const findRot = (shape, ext) => ROTS.findIndex((_, r) => orient(shape, r).ext.join() === ext.join());
export function deal(spec, R) {
  const [, , W, D, H, n, spare, shaped, kind, big] = spec, P = { W, D, H };
  const boxes = cut(W, D, H, n, R);
  if (boxes.length !== n || Math.max(...boxes.map(vol)) > big) return null;
  if (boxes.filter((b) => vol(b) === 1).length > 1 + spare) return null;
  if (boxes.filter((b) => { const q = [b.dx, b.dy, b.dz].sort(); return q[1] === 1 && q[2] >= 3; }).length > 2) return null;
  boxes.sort((a, b) => vol(a) - vol(b)); boxes.splice(0, spare); boxes.reverse();
  const raw = [], used = {}; let nc = 0;
  for (const b of boxes) {
    const opts = (b.dz === 2 && nc < shaped ? CARVE[kind][[b.dx, b.dy].sort().join()] || [] : []).filter((t) => !used[t.n]);
    let done = false;
    for (const t of opts) {
      const sh = shapeOf({ ...t, d: [1, 1, 1] }), off = Math.floor(R() * 4);
      for (let q = 0; q < 4 && !done; q++) {
        const r = (q + off) % 4, o = orient(sh, r);
        if (o.ext[0] !== b.dx || o.ext[1] !== b.dy || o.ext[2] !== 2) continue;
        const has = new Set(o.cells.map(String)), rest = [];
        for (let x = 0; x < b.dx; x++) for (let y = 0; y < b.dy; y++) for (let z = 0; z < 2; z++) if (!has.has([x, y, z].join())) rest.push([x, y, z]);
        const mn = [0, 1, 2].map((i) => Math.min(...rest.map((c) => c[i]))), mx = [0, 1, 2].map((i) => Math.max(...rest.map((c) => c[i])));
        if ((mx[0] - mn[0] + 1) * (mx[1] - mn[1] + 1) * (mx[2] - mn[2] + 1) !== rest.length) continue;
        used[t.n] = 1; nc++; done = true;
        raw.push({ it: { n: t.n, k: t.k, d: orient(sh, 0).ext.slice().sort((a, c) => a - c), c: t.c, x: t.x, note: t.note }, r, p: [b.x, b.y, b.z] });
        raw.push({ box: { x: b.x + mn[0], y: b.y + mn[1], z: b.z + mn[2], dx: mx[0] - mn[0] + 1, dy: mx[1] - mn[1] + 1, dz: mx[2] - mn[2] + 1 } });
      }
      if (done) break;
    }
    if (!done) raw.push({ box: b });
  }
  if (nc < shaped) return null;
  const pool = {}; let fallback = 0;
  for (const e of raw) {
    if (!e.box) continue;
    const b = e.box, d = [b.dx, b.dy, b.dz].sort((a, c) => a - c), k = d.join();
    pool[k] = pool[k] || (TABLE[kind][k] || []).slice();
    let t = pool[k].shift(); if (!t) { t = TABLE[kind]['*']; fallback++; }
    e.it = { n: t.n, k: t.k, d }; if (t.c) e.it.c = t.c; if (t.x !== undefined) e.it.x = t.x;
    e.r = findRot(shapeOf(e.it), [b.dx, b.dy, b.dz]); e.p = [b.x, b.y, b.z];
    if (e.r < 0) return null;
  }
  if (fallback > (kind === 'van' ? 1 : 0)) return null;
  for (let i = raw.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [raw[i], raw[j]] = [raw[j], raw[i]]; }
  const seen = {};
  const items = raw.map((e) => { seen[e.it.n] = (seen[e.it.n] || 0) + 1; return seen[e.it.n] > 1 ? { ...e.it, n: `${e.it.n} ${seen[e.it.n]}` } : e.it; });
  const shapes = items.map(shapeOf);
  let left = raw.map((e, i) => ({ i, r: e.r, p: e.p })); const order = [];
  while (left.length) {
    const occ = occOf(P, left, shapes), at = left.findIndex((q) => clearAbove(P, occ, orient(shapes[q.i], q.r), q));
    if (at < 0) return null;
    order.unshift(left.splice(at, 1)[0]);
  }
  // every item must come to rest exactly where it was cut, or the day is re-dealt
  const placed = [];
  for (const q of order) {
    const d = dropAt(P, occOf(P, placed, shapes), orient(shapes[q.i], q.r), q.p[0], q.p[1]);
    if (!d || !d.ok) return null;
    placed.push({ i: q.i, r: q.r, p: [q.p[0], q.p[1], d.z] });
  }
  return { items, sol: placed };
}

// The bank is only dealt when this file is run, so the share-card baker can borrow deal() without touching it.
if (process.argv[1] && import.meta.url === (await import('url')).pathToFileURL(process.argv[1]).href) {
const HEAD = `// Puzzle data for Pack, the daily packing puzzle.
// GENERATED by scripts/gen-pack.mjs; do not edit by hand. Extend with
// \`node scripts/gen-pack.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-pack.mjs. Imported only by the server page,
// which strips days not yet live AND the stored packing (\`sol\`) before anything
// reaches a browser. The week's ramp is in the generator.
//   band     intro | gentle | moderate | tough | sunday     vehicle  what is being loaded
//   W D H    the space in cells: wide, deep, high
//   items    { n: name, k: kind (lib/pack-art.js K), d: its box sorted small to large, c: colour, x: extra, note: a shaped item }
//   sol      one packing, in loading order: { i: item, r: turn (lib/pack-engine.js ROTS), p: low corner }
//   sunday   the Sunday Edition
export const PUZZLES = [
`;
const save = (rows) => fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
let rows = [];
if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
const kept = rows.length;
const iso = (d) => d.toISOString().slice(0, 10);
const day = new Date(`${START}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + rows.length);
function rowFor(live, num) {
  const d = new Date(`${live}T12:00:00Z`), dow = d.getUTCDay(), [y, m, dd] = live.split('-').map(Number);
  const intro = INTRO[live], spec = SPEC[intro || dow], seedDay = SEED_AS[live] || live;
  let got = null, salt = 0;
  for (; !got && salt < 20000; salt++) got = deal(spec, rng(hash(`pack-${seedDay}-${salt}`)));
  if (!got) throw new Error(`${live}: no board found`);
  const P = { W: spec[2], D: spec[3], H: spec[4] };
  if (!replay(P, got.items.map(shapeOf), got.sol)) throw new Error(`${live}: the stored packing does not replay`);
  const row = { num, quizId: `pack-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  Object.assign(row, { band: intro ? 'intro' : spec[0], vehicle: spec[1], ...P, items: got.items, sol: got.sol });
  const cells = got.items.reduce((a, it) => a + shapeOf(it).cells.length, 0);
  console.log(`${live} ${row.band.padEnd(8)} ${spec[1].padEnd(14)} ${String(got.items.length).padStart(2)} items  ${cells}/${P.W * P.D * P.H} cells  ${got.items.filter((it) => it.note).map((it) => it.n).join(', ')}  (deal ${salt})`);
  return row;
}
if (REDEAL) {
  // ONE day, in place, and only a day nobody has been dealt yet. Every other row is kept byte for byte.
  const at = rows.findIndex((r) => r.live === REDEAL);
  if (at < 0) throw new Error(`${REDEAL} is not in the bank`);
  if (REDEAL <= etToday()) throw new Error(`${REDEAL} has gone live and is never re-dealt`);
  rows[at] = rowFor(REDEAL, rows[at].num); save(rows);
}
while (iso(day) <= UNTIL) {
  rows.push(rowFor(iso(day), rows.length + 1)); save(rows);
  day.setUTCDate(day.getUTCDate() + 1);
}
console.log(`pack: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
}
