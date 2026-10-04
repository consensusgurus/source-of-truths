// scripts/gen-lamps.mjs: deals the Lamps calendar into app/lamps/puzzles.js.
//
//   node scripts/gen-lamps.mjs > app/lamps/puzzles.js
//
// Deterministic: every day is generated from a seed off its own date, so a
// re-run reproduces the bank byte for byte and any one day can be redone.
// The engine is scripts/lamps-core.mjs; scripts/verify-lamps.mjs re-proves
// the bank with its own solvers and imports nothing from either file.
import { rng, makeBoard } from './lamps-core.mjs';

const FIRST = '2026-10-04';
const DAYS = 78;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// size and the look-ahead band [lo, hi] by weekday (0 = Sunday)
export const SPEC = {
  1: { n: 7, lo: 0, hi: 0 },
  2: { n: 7, lo: 1, hi: 2 },
  3: { n: 7, lo: 3, hi: 9 },
  4: { n: 8, lo: 0, hi: 1 },
  5: { n: 8, lo: 2, hi: 5 },
  6: { n: 8, lo: 6, hi: 16 },
  0: { n: 10, lo: 6, hi: 40 },
};
const DENSITY = 0.2;

function addDays(iso, k) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }
function seedOf(iso) { let h = 2166136261; for (const ch of `lamps:${iso}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const seen = new Set();
const out = [];
for (let k = 0; k < DAYS; k++) {
  const live = addDays(FIRST, k);
  const d = new Date(`${live}T12:00:00Z`);
  const dow = d.getUTCDay();
  const spec = SPEC[dow];
  const rnd = rng(seedOf(live));
  let board = null;
  for (let tries = 0; tries < 200000 && !board; tries++) {
    const b = makeBoard(spec.n, DENSITY, rnd, spec.hi);
    if (!b || b.cost < spec.lo || b.cost > spec.hi) continue;
    if (b.walls < Math.round(spec.n * spec.n * 0.14)) continue;
    const key = b.grid.join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    board = b;
  }
  if (!board) throw new Error(`no board for ${live}`);
  const [y, m, dd] = live.split('-').map(Number);
  out.push({ num: k + 1, quizId: `lamps-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, sunday: dow === 0, n: board.n, cost: board.cost, grid: board.grid, sol: board.sol });
  process.stderr.write(`${live} ${board.n}x${board.n} cost ${board.cost} clues ${board.clues}\n`);
}

const head = `// Puzzle data for Lamps, the daily light-placement puzzle. Imported ONLY by
// the server page (app/lamps/page.js), which filters live<=today before
// handing puzzles to the client, so future boards and their solutions never
// reach a browser.
//
// A board is an n x n grid (7, 8 or 10). grid[r] is a string: '.' is a white
// square, '#' a blank wall, '0' to '4' a numbered wall. A LAMP lights its own
// square and every white square it can see along its row and column, up to
// the first wall. Every white square must be lit, no lamp may shine on
// another lamp, and a numbered wall touches exactly that many lamps (up, down,
// left, right). sol lists the lamp squares as r * n + c.
//
// DIFFICULTY IS A MEASURED COST (scripts/lamps-core.mjs): squares first
// settled by one look ahead (suppose a lamp or a cross, follow the pencil
// rules, see the board break). Mon 7x7 cost 0, Tue 7x7 1-2, Wed 7x7 3+,
// Thu 8x8 0-1, Fri 8x8 2-5, Sat 8x8 6+, Sunday Edition 10x10 6+.
//
// EVERY board has exactly one solution, reachable with the pencil rules and
// single look aheads, re-proved by the independent solvers in
// scripts/verify-lamps.mjs. No board repeats.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-lamps.mjs and
// re-run scripts/verify-lamps.mjs.
export const PUZZLES = [
`;
process.stdout.write(head + out.map((p) => '  ' + JSON.stringify(p) + ',').join('\n') + '\n];\n');
