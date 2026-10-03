// scripts/gen-duet.mjs — deals the Duet calendar into app/duet/puzzles.js.
//
//   node scripts/gen-duet.mjs > app/duet/puzzles.js
//
// Deterministic: every day is drawn from a seed off its own date, so any day
// regenerates alone and a re-run reproduces the bank byte for byte.
//
// THE RAMP is size plus measured cost (scripts/duet-core.mjs: squares first
// settled by reading a whole line, after the pencil work runs dry). Measured
// on a few hundred boards per shape before the bands were cut:
//   Mon 6x6 cost 0      pencil work alone finishes it
//   Tue 6x6 cost 2-6
//   Wed 6x6 cost 7+
//   Thu 8x8 cost 0-6
//   Fri 8x8 cost 7-13
//   Sat 8x8 cost 14+    the top of a pool
//   Sun 10x10 cost 16+  the Sunday Edition
// Day 1 (2026-10-03, a Saturday) is the LAUNCH board and deliberately takes
// the Monday spec, so the first board anyone meets teaches the rules.
import { makeBoard } from './duet-core.mjs';

const FIRST = '2026-10-03';
const DAYS = 78;
const SIZES = { 6: [4, 4, 4, 2, 6], 8: [4, 4, 6, 2, 4], 10: [4, 6, 4, 6, 2] };
// dow: 0 Sun .. 6 Sat
const SPEC = {
  1: { n: 6, lvl: 0, lo: 0, hi: 0 },
  2: { n: 6, lvl: 1, lo: 2, hi: 6 },
  3: { n: 6, lvl: 1, lo: 7, hi: 99 },
  4: { n: 8, lvl: 'mix', lo: 0, hi: 6 },
  5: { n: 8, lvl: 1, lo: 7, hi: 13 },
  6: { n: 8, lvl: 1, lo: 14, hi: 99 },
  0: { n: 10, lvl: 1, lo: 16, hi: 99 },
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function addDays(iso, k) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}
function seedOf(iso, k) {
  let h = 2166136261;
  for (const ch of `${iso}#${k}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function specFor(iso, num) {
  if (num === 1) return SPEC[1];
  return SPEC[new Date(`${iso}T12:00:00Z`).getUTCDay()];
}

const seen = new Set();
const out = [];
for (let i = 0; i < DAYS; i++) {
  const iso = addDays(FIRST, i);
  const num = i + 1;
  const sp = specFor(iso, num);
  const sunday = new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
  let pick = null;
  // Saturday and Sunday take the hardest of a pool; every other day the first fit.
  const pool = [];
  for (let k = 0; k < 400 && !pick; k++) {
    const lvl = sp.lvl === 'mix' ? (k % 2) : sp.lvl;
    const b = makeBoard(sp.n, seedOf(iso, k), { sizes: SIZES[sp.n], maxLevel: lvl, edgeFrac: sp.n === 6 ? 0.35 : 0.3 });
    if (!b) continue;
    const key = JSON.stringify([b.rooms, b.givens, b.edges]);
    if (seen.has(key)) continue;
    if (b.cost < sp.lo || b.cost > sp.hi) continue;
    if (sp.hi === 99) { pool.push(b); if (pool.length >= 6) pick = pool.sort((a, c) => c.cost - a.cost)[0]; }
    else pick = b;
  }
  if (!pick && pool.length) pick = pool.sort((a, c) => c.cost - a.cost)[0];
  if (!pick) throw new Error(`no board for ${iso}`);
  seen.add(JSON.stringify([pick.rooms, pick.givens, pick.edges]));
  const [y, m, d] = iso.split('-').map(Number);
  out.push({
    num,
    quizId: `duet-${m}-${d}-${String(y).slice(2)}`,
    live: iso,
    dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`,
    sunday,
    n: pick.n,
    cost: pick.cost,
    rooms: pick.rooms,
    givens: pick.givens,
    edges: pick.edges,
    sol: pick.sol,
  });
}

const head = `// Puzzle data for Duet, the daily balanced-grid puzzle. Imported ONLY by the
// server page (app/duet/page.js), which filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.
//
// A board is an n x n grid (6, 8 or 10) filled with dots (1) and rings (0).
// Every row, every column and every walled ROOM holds half of each, never
// three alike in a line, '=' joins two squares that match and 'x' two that
// differ. rooms[r][c] is the room id; givens are printed squares [r, c, v];
// edges are marks [r1, c1, r2, c2, '=' | 'x'] between orthogonal neighbours.
//
// DIFFICULTY IS A MEASURED COST (scripts/duet-core.mjs): squares first
// settled by reading a whole line. Mon 6x6 cost 0, Tue 6x6 2-6, Wed 6x6 7+,
// Thu 8x8 0-6, Fri 8x8 7-13, Sat 8x8 14+, Sunday Edition 10x10 16+. Day 1 is
// the launch board and takes the Monday spec.
//
// EVERY board has exactly one solution, reachable by logic with no guessing,
// re-proved by the independent solver in scripts/verify-duet.mjs.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-duet.mjs and
// re-run scripts/verify-duet.mjs.
export const PUZZLES = [
`;
const body = out.map((p) => `  ${JSON.stringify(p)},`).join('\n');
process.stdout.write(`${head}${body}\n];\n`);
