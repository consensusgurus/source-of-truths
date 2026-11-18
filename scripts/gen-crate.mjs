// scripts/gen-crate.mjs: deals the Crate bank (app/crate/puzzles.js).
//
//   node scripts/gen-crate.mjs --until 2027-01-31
//
// Keeps every row already in the bank byte for byte and appends days after the
// last one. Each day is seeded by its date, so a re-run deals the same boards.
//
// HOW A WAREHOUSE IS MADE
//   1. A room: a rectangle with random wall blocks and a corner or two cut off,
//      kept only if every floor square joins up and no floor square is a
//      one-square dead end.
//   2. Spots: random floor squares, one per crate, crates sitting on them.
//   3. Pulled apart: a breadth-first search from that solved warehouse that only
//      PULLS crates (Sokoban run backwards), so every state it reaches can be
//      pushed back home. The deal is the state farthest from home by pulls,
//      ties going to the one with the most crates off their spots.
//   4. Solved forward: lib/crate-engine.js solve() finds the exact fewest-moves
//      line from the deal. The board is kept only if that line falls in the
//      day's band (THE WEEK below) and no crate starts on a spot.
//
// THE WEEK (the ramp, by weekday)
//   Mon, Tue  gentle    three crates, best 22 to 55 moves
//   Wed, Thu  moderate  four crates, best 45 to 95 moves
//   Fri, Sat  tough     four crates, best 75 to 150 moves
//   Sun       sunday    the Sunday Edition: five crates in a bigger warehouse,
//                       best 90 to 220 moves
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseMap, DIRS, DIR_KEYS, exactDistances, bestLine, stateCount } from '../lib/crate-engine.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BANK = path.join(HERE, '..', 'app', 'crate', 'puzzles.js');

export const BANDS = {
  gentle: { n: 3, sizes: [[6, 5], [6, 6], [7, 5]], moves: [22, 55], pushes: 8, maxF: 30 },
  moderate: { n: 4, sizes: [[7, 6], [6, 6], [7, 7]], moves: [45, 95], pushes: 14, maxF: 36 },
  tough: { n: 4, sizes: [[7, 7], [8, 6], [8, 7]], moves: [75, 150], pushes: 20, maxF: 42 },
  sunday: { n: 5, sizes: [[7, 7], [8, 6], [8, 7]], moves: [90, 220], pushes: 26, maxF: 42 },
};
export const bandFor = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00Z').getUTCDay();
  return d === 0 ? 'sunday' : d === 1 || d === 2 ? 'gentle' : d === 3 || d === 4 ? 'moderate' : 'tough';
};
const NAMES = ['Loading Dock', 'Cold Store', 'Mailroom', 'Stockroom', 'Cellar', 'Depot', 'Boathouse', 'Granary', 'Back Room',
  'Freight Bay', 'Storeroom', 'Shipping Floor', 'Attic', 'Garage', 'Bakery Store', 'Book Depot', 'Toy Shop Stores', 'Rail Shed',
  'Feed Store', 'Print Shop', 'Hardware Store', 'Dairy', 'Fish Market', 'Flower Market', 'Wine Cellar', 'Tea Warehouse', 'Hangar',
  'Customs House', 'Supply Closet', 'Harbor Shed', 'Mill', 'Loading Bay', 'Packing Room', 'Cannery', 'Pharmacy Stores', 'Theater Stores'];

function rng(seed) {
  let s = 0; for (const ch of String(seed)) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 1. a room: returns { W, H, floor:Uint8Array } or null
function makeRoom(r, iw, ih) {
  const W = iw + 2, H = ih + 2, floor = new Uint8Array(W * H);
  for (let y = 1; y <= ih; y++) for (let x = 1; x <= iw; x++) floor[y * W + x] = 1;
  // cut a corner or two
  const cuts = Math.floor(r() * 3);
  for (let c = 0; c < cuts; c++) {
    const cw = 1 + Math.floor(r() * 2), ch = 1 + Math.floor(r() * 2), right = r() < 0.5, bottom = r() < 0.5;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) floor[(bottom ? ih - y : 1 + y) * W + (right ? iw - x : 1 + x)] = 0;
  }
  // wall blocks inside
  const blocks = Math.round(iw * ih * (0.08 + r() * 0.08));
  for (let b = 0; b < blocks; b++) {
    const x = 2 + Math.floor(r() * (iw - 2)), y = 2 + Math.floor(r() * (ih - 2));
    floor[y * W + x] = 0;
    if (r() < 0.35) { const h = r() < 0.5; const x2 = x + (h ? 1 : 0), y2 = y + (h ? 0 : 1); if (x2 <= iw - 1 && y2 <= ih - 1) floor[y2 * W + x2] = 0; }
  }
  // connected, and no one-square dead ends
  const cells = []; for (let i = 0; i < W * H; i++) if (floor[i]) cells.push(i);
  if (!cells.length) return null;
  const seen = new Set([cells[0]]), q = [cells[0]];
  while (q.length) { const c = q.pop(); for (const k of DIR_KEYS) { const n = c + DIRS[k][0] + DIRS[k][1] * W; if (floor[n] && !seen.has(n)) { seen.add(n); q.push(n); } } }
  if (seen.size !== cells.length) return null;
  for (const c of cells) { let deg = 0; for (const k of DIR_KEYS) if (floor[c + DIRS[k][0] + DIRS[k][1] * W]) deg++; if (deg <= 1) return null; }
  return { W, H, floor, cells };
}

function toMap(room, goals, boxes, player) {
  const { W, H, floor } = room, gs = new Set(goals), bs = new Set(boxes);
  const rows = [];
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (floor[i]) row += bs.has(i) ? (gs.has(i) ? '*' : '$') : i === player ? (gs.has(i) ? '+' : '@') : gs.has(i) ? '.' : ' ';
      else {
        let near = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && floor[yy * W + xx]) near = true; }
        row += near ? '#' : '-';
      }
    }
    rows.push(row);
  }
  // trim rows and columns that are all outside
  while (rows.length && /^-*$/.test(rows[0])) rows.shift();
  while (rows.length && /^-*$/.test(rows[rows.length - 1])) rows.pop();
  let l = 0, rr = 0; const w = rows[0].length;
  while (rows.every((s) => s[l] === '-')) l++;
  while (rows.every((s) => s[w - 1 - rr] === '-')) rr++;
  return rows.map((s) => s.slice(l, w - rr));
}

export function deal(dateStr, band) {
  const B = BANDS[band], r = rng('crate:' + dateStr);
  for (let tries = 0; tries < 3000; tries++) {
    const [iw, ih] = B.sizes[Math.floor(r() * B.sizes.length)];
    const room = makeRoom(r, iw, ih);
    if (!room || room.cells.length < B.n * 4 + 6 || room.cells.length > B.maxF) continue;
    const pool = room.cells.slice(), goals = [];
    while (goals.length < B.n) goals.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    // the solved warehouse, worker anywhere: map it and run Sokoban backwards
    const M0 = parseMap(toMap(room, goals, goals, pool[0]));
    const X = exactDistances(M0);
    // the deal: for each set of crate squares, the worker goes where the job is
    // shortest (so the count is pushing, not a long walk in); then the farthest
    // such set inside the band with no crate on a spot
    const { F, n, combos, dist, cells, gset } = X;
    const C = dist.length / F;
    let top = -1, picks = [];
    for (let cr = 0; cr < C; cr++) {
      let md = 32767, mp = -1;
      for (let q = 0; q < F; q++) { const d = dist[cr * F + q]; if (d >= 0 && d < md) { md = d; mp = q; } }
      if (mp < 0 || md < B.moves[0] || md > B.moves[1] || md < top) continue;
      let onSpot = false;
      for (let i = 0; i < n; i++) if (gset.has(combos[cr * n + i])) { onSpot = true; break; }
      if (onSpot) continue;
      if (md > top) { top = md; picks = []; }
      picks.push([cr, mp]);
    }
    if (!picks.length) continue;
    const [cr, p] = picks[Math.floor(r() * picks.length)];
    const boxes = []; for (let i = 0; i < n; i++) boxes.push(cells[combos[cr * n + i]]);
    const map = toMap(room, goals, boxes, cells[p]);
    const M = parseMap(map);
    const line = bestLine(M);
    if (!line || line.moves !== top || line.pushes < B.pushes) continue;
    return { map, best: { moves: line.moves, pushes: line.pushes }, sol: line.path, tries };
  }
  throw new Error(`gen-crate: no ${band} board for ${dateStr}`);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function rowFor(num, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number), band = bandFor(dateStr);
  const b = deal(dateStr, band);
  const row = { num, quizId: `crate-${m}-${d}-${String(y).slice(2)}`, live: dateStr, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}` };
  if (band === 'sunday') row.sunday = true;
  Object.assign(row, { band, title: NAMES[(num * 7) % NAMES.length], map: b.map, best: b.best, sol: b.sol });
  return row;
}

if (process.argv[1] && process.argv[1].endsWith('gen-crate.mjs')) {
  const i = process.argv.indexOf('--until'); const until = i > 0 ? process.argv[i + 1] : null;
  if (!until) { console.error('usage: node scripts/gen-crate.mjs --until YYYY-MM-DD'); process.exit(1); }
  const src = fs.readFileSync(BANK, 'utf8');
  const rows = src.split('\n').filter((l) => l.startsWith('  {"num":'));
  const last = JSON.parse(rows[rows.length - 1].trim().replace(/,$/, ''));
  let num = last.num, day = new Date(last.live + 'T12:00:00Z');
  const add = [];
  for (;;) {
    day = new Date(day.getTime() + 86400000);
    const ds = day.toISOString().slice(0, 10);
    if (ds > until) break;
    num++;
    const t = Date.now(), row = rowFor(num, ds);
    console.log(`${ds} No. ${num} ${row.band.padEnd(8)} ${row.best.moves} moves ${row.best.pushes} pushes ${row.map[0].length}x${row.map.length} (${Date.now() - t}ms)`);
    add.push('  ' + JSON.stringify(row) + ',');
  }
  const out = src.replace(/\n\];\s*$/, () => '\n' + add.join('\n') + '\n];\n');
  fs.writeFileSync(BANK, out);
  console.log(`gen-crate: added ${add.length} days`);
}
