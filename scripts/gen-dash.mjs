// scripts/gen-dash.mjs: deals the Dash bank (app/dash/puzzles.js). APPEND ONLY:
// every row already in the file is kept byte for byte, and new days are added up
// to --until. A board that has gone live is never re-dealt.
//   node scripts/gen-dash.mjs --until 2027-01-31
//
// Owner, 2026-11-15: "a DoorDash/delivery driver puzzle where user has to maximize
// tips across large grid with 10 or so restaurants", named Dash by him, then
// "Build and implement". One shift, more orders than there is time for, a bag that
// holds two or three, and tips that shrink once the food goes cold.
// The week (scripts/gen-dash-spec.mjs):
//   Mon  gentle    Quiet Night     5 orders, one hour, bag of two
//   Tue  gentle    Dinner Shift    6 orders
//   Wed  gentle    Midweek Run     6 orders, one not ready at six
//   Thu  moderate  Busy Night      7 orders, 90 minutes, two not ready
//   Fri  tough     Friday Rush     8 orders, three not ready
//   Sat  tough     Saturday Night  9 orders, bag of three, a wider town
//   Sun  sunday    The Big Night   10 orders, two hours, bag of three, the biggest town
// THE BANK OPENS WITH AN INTRO BOARD (the owner's standing rule for these launches:
// start gentle): Sunday 2026-11-15 is a Quiet Night, band `intro`. The first Big
// Night is Sunday 2026-11-22.
//
// HOW A BOARD IS MADE. Restaurants and houses are drawn onto corners of the grid
// with a tip, a hot-until time and (later in the week) a ready time. Then the best
// shift is found by search over every state (lib/dash-engine.js) and the deal is
// kept only if
//   - there is not time for everything: the best shift delivers a number of
//     orders inside the day's range, fewer than are on offer,
//   - stacking pays: the best shift with a bag of one makes less,
//   - the two plain plans (always the biggest tip left, always the nearest
//     pickup, one order at a time) both fall short by the day's margin, and
//   - the best shift is at least 60% of the money on offer, so the night is
//     not mostly leftovers.
// The best total is stored as `best` and one shift that makes it as `sol`.
import fs from 'fs';
import { solve, walk, next, offer, PER, STAY } from '../lib/dash-engine.js';
import { SPEC, PLACES } from './gen-dash-spec.mjs';
import { MONTHS } from './six-verify-common.mjs';

const FILE = new URL('../app/dash/puzzles.js', import.meta.url);
const START = '2026-11-15';
const INTRO = { '2026-11-15': 1 };
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const UNTIL = arg('--until') || '2027-01-03';
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

// one order at a time, chosen by `pick` from the orders that can still be run
export function plain(P, pick) {
  const taps = []; let w = walk(P, taps);
  for (;;) {
    const can = P.orders.map((_, i) => i).filter((i) => next(P, w, i).kind === 'pick');
    if (!can.length) break;
    const i = pick(can, w); taps.push(i, i); w = walk(P, taps);
  }
  return w.earn;
}
export const biggestFirst = (P) => plain(P, (can) => can.slice().sort((a, b) => P.orders[b].tip - P.orders[a].tip || a - b)[0]);
export const nearestFirst = (P) => plain(P, (can, w) => can.slice().sort((a, b) => dist(w.pos, P.orders[a].r) - dist(w.pos, P.orders[b].r) || a - b)[0]);

export function deal(spec, rnd) {
  const [band, , [W, H], N, end, cap, late, range, margin] = spec;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const used = new Set(), spot = () => { for (;;) { const p = [ri(0, W - 1), ri(0, H - 1)]; if (!used.has(p.join())) { used.add(p.join()); return p; } } };
  const start = [ri(1, W - 2), ri(1, H - 2)]; used.add(start.join());
  const names = PLACES.slice(); for (let i = names.length - 1; i > 0; i--) { const j = ri(0, i); [names[i], names[j]] = [names[j], names[i]]; }
  const lateSet = new Set(); while (lateSet.size < late) lateSet.add(ri(0, N - 1));
  const orders = [];
  for (let i = 0; i < N; i++) {
    const r = spot(); let h = spot(), guard = 0;
    while ((dist(r, h) < 2 || dist(r, h) > Math.ceil((W + H) * 0.6)) && guard++ < 40) { used.delete(h.join()); h = spot(); }
    const run = dist(r, h) * PER + STAY;
    const ready = lateSet.has(i) ? 2 * ri(6, Math.floor(end / 4)) : 0;
    const by = Math.min(end - 2, Math.max(ready + run + 6, 2 * ri(10, Math.floor(end / 2) - 2)));
    orders.push({ n: names[i][0], e: names[i][1], r, h, tip: ri(4, 12), ready, by });
  }
  const P = { W, H, start, end, cap, orders };
  const { best, sol } = solve(P);
  const w = walk(P, sol);
  if (w.earn !== best || w.skipped) throw new Error('the stored shift does not make the best');
  if (w.count < range[0] || w.count > range[1] || w.count >= N) return null;
  if (best < 0.6 * offer(P)) return null;
  if (solve(P, 1).best >= best) return null;
  if (best - biggestFirst(P) < margin || best - nearestFirst(P) < margin) return null;
  // every late-ready order should matter: at least one of them is delivered in the best shift
  if (late && !orders.some((o, i) => o.ready && w.del[i])) return null;
  return { W, H, start, end, cap, orders, best, sol, delivered: w.count };
}

if (process.argv[1] && import.meta.url === (await import('url')).pathToFileURL(process.argv[1]).href) {
const HEAD = `// Puzzle data for Dash, the daily delivery puzzle.
// GENERATED by scripts/gen-dash.mjs; do not edit by hand. Extend with
// \`node scripts/gen-dash.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-dash.mjs. Imported only by the server
// page, which strips days not yet live AND the stored shift (\`sol\`) before
// anything reaches a browser. The week's ramp is in scripts/gen-dash-spec.mjs.
//   band    intro | gentle | moderate | tough | sunday     day  the night's name
//   W, H    corners across and down     start  [x, y], where the car waits at 6:00
//   end     minutes the shift lasts     cap  orders the bag holds
//   orders  { n: restaurant, e: picture, r: [x, y] restaurant, h: [x, y] house, tip, ready, by }
//           ready and by are minutes after 6:00 (lib/dash-engine.js)
//   best    the most a shift can make, in dollars     sol  the taps that make it
//   sunday  the row falls on a Sunday
export const PUZZLES = [
`;
const save = (rows) => fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
let rows = [];
if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
const kept = rows.length;
const iso = (d) => d.toISOString().slice(0, 10);
const day = new Date(`${START}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + rows.length);
while (iso(day) <= UNTIL) {
  const live = iso(day), dow = day.getUTCDay(), [y, m, dd] = live.split('-').map(Number);
  const intro = INTRO[live], spec = SPEC[intro || dow];
  let got = null, salt = 0;
  for (; !got && salt < 20000; salt++) got = deal(spec, rng(hash(`dash-${live}-${salt}`)));
  if (!got) throw new Error(`${live}: no board found`);
  const { delivered, ...board } = got;
  const row = { num: rows.length + 1, quizId: `dash-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  Object.assign(row, { band: intro ? 'intro' : spec[0], day: spec[1], ...board });
  console.log(`${live} ${row.band.padEnd(8)} ${spec[1].padEnd(14)} ${board.orders.length} orders  best $${board.best} of $${offer(board)}  delivers ${delivered}  (deal ${salt})`);
  rows.push(row); save(rows);
  day.setUTCDate(day.getUTCDate() + 1);
}
console.log(`dash: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
}
