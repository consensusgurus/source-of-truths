// scripts/gen-mega.mjs: builds boards for Colossus (9x9) and Mammoth (6x6), the
// massive sudokus, and the site-day lists their results are filed under.
//
//   node scripts/gen-mega.mjs colossus --boards 4     append boards until the bank holds 4
//   node scripts/gen-mega.mjs mammoth --boards 4
//   node scripts/gen-mega.mjs colossus --days 2027-06-30   extend the site days
//
// APPEND-ONLY: a board already in app/<game>/boards.js is never rewritten (it may
// have opened). Each new board is seeded from its number, so a re-run rebuilds
// nothing and adds the same boards.
//
// THE FILL solves the whole weave at once. The weave has loops (four sudokus
// meet around every gap), so sudokus cannot be generated one after another: a
// corner box fixed by one neighbor can make another unsolvable. Every square
// carries a candidate mask over all the rows, columns and boxes it sits in
// (two sudokus' worth in a shared corner); the search always takes the square
// with the fewest candidates and tries its digits in random order.
//
// THE CLUES are carved so EVERY sudoku is solvable from its own printed digits
// alone by naked and hidden singles (so it has one solution and never needs a
// neighbor), and a square shared by two sudokus stays printed unless both can
// spare it. Mammoth carves its unshared middle rows first (owner, 2026-11-21:
// "fewer givens in middle rows, like Sunday Sixes"), so the squares a solved
// neighbor can never hand you are the ones left to work out.
import fs from 'fs';
import path from 'path';
import { MEGA, megaLayout, megaHouses, megaSingles, megaQuizId } from '../lib/mega.js';

const game = process.argv[2];
if (!MEGA[game]) { console.error('usage: node scripts/gen-mega.mjs colossus|mammoth [--boards n] [--days YYYY-MM-DD] [dir]'); process.exit(1); }
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const root = process.argv.find((a, i) => i > 2 && !a.startsWith('--') && process.argv[i - 1] !== '--boards' && process.argv[i - 1] !== '--days') || '.';
const SIZE = { colossus: { A: 11, B: 11, floor: 26, midFirst: false }, mammoth: { A: 27, B: 19, floor: 8, midFirst: true } }[game];
const want = Number(arg('--boards', 0));
const daysTo = arg('--days', null);

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffled(a, rnd) { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }

function fill(L, rnd) {
  const { N, T } = L;
  const peerSets = Array.from({ length: T }, () => new Set());
  L.grids.forEach((_, id) => { for (const h of megaHouses(L, id)) for (const x of h) for (const y of h) if (x !== y) peerSets[x].add(y); });
  const peers = peerSets.map((s) => Int32Array.from(s));
  const covered = []; for (let i = 0; i < T; i++) if (L.cellGrids[i].length) covered.push(i);
  const FULL = ((1 << N) - 1) << 1;
  const cand = new Uint16Array(T), val = new Uint8Array(T);
  for (const i of covered) cand[i] = FULL;
  const pop = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
  const trail = [];
  const assign = (i, d) => {
    val[i] = d; const bit = 1 << d; let ok = true;
    for (const p of peers[i]) if (!val[p] && (cand[p] & bit)) { cand[p] &= ~bit; trail.push(p, bit); if (!cand[p]) ok = false; }
    return ok;
  };
  const undo = (mark) => { while (trail.length > mark) { const bit = trail.pop(), p = trail.pop(); cand[p] |= bit; } };
  const stack = [];
  let nodes = 0, left = covered.length;
  for (;;) {
    // descend: pick the tightest open square
    let best = -1, bn = 99;
    if (left) for (const i of covered) { if (val[i]) continue; const n = pop(cand[i]); if (n < bn) { bn = n; best = i; if (n <= 1) break; } }
    if (best < 0) return val;
    const opts = []; for (let d = 1; d <= N; d++) if (cand[best] & (1 << d)) opts.push(d);
    stack.push({ i: best, opts: shuffled(opts, rnd), k: 0, mark: trail.length });
    // try options, backing up as needed
    for (;;) {
      const f = stack[stack.length - 1];
      if (!f) return null;
      if (val[f.i]) { val[f.i] = 0; left++; undo(f.mark); }
      if (f.k >= f.opts.length) { stack.pop(); continue; }
      if (++nodes > 4000000) return null;
      const d = f.opts[f.k++];
      left--;
      if (assign(f.i, d)) break;
    }
  }
}

function carve(L, sol, rnd) {
  const given = Array.from(sol);
  const count = (id) => L.grids[id].reduce((a, x) => a + (given[x] ? 1 : 0), 0);
  let order = shuffled([...Array(L.T).keys()].filter((i) => L.cellGrids[i].length), rnd);
  if (SIZE.midFirst) order.sort((x, y) => L.cellGrids[x].length - L.cellGrids[y].length);
  for (let pass = 0; pass < 2; pass++) for (const i of order) {
    if (!given[i]) continue;
    if (L.cellGrids[i].some((g) => count(g) <= SIZE.floor)) continue;
    const keep = given[i]; given[i] = 0;
    if (!L.cellGrids[i].every((g) => megaSingles(L, g, given).ok)) given[i] = keep;
  }
  return given;
}

function build(num) {
  const L = megaLayout(game, SIZE.A, SIZE.B);
  for (let attempt = 0; attempt < 40; attempt++) {
    const rnd = rng((game === 'mammoth' ? 6000000 : 9000000) + num * 7919 + attempt * 104729);
    const sol = fill(L, rnd);
    if (!sol) continue;
    const given = carve(L, sol, rnd);
    return { num, key: `${game}-b${num}`, A: SIZE.A, B: SIZE.B, given: given.join(''), sol: Array.from(sol).join('') };
  }
  throw new Error('no fill found for board ' + num);
}

const dir = path.join(root, 'app', game);
fs.mkdirSync(dir, { recursive: true });
const boardsFile = path.join(dir, 'boards.js');
const HEAD = `// The boards for ${MEGA[game].name}, the massive ${MEGA[game].N}x${MEGA[game].N} sudoku (launched 2026-11-21), in the order
// they open. A board opens when the one before it closes: it runs until every
// sudoku on it has been solved by at least one player, at least 24 hours and at
// most 72 (lib/mega.js megaWindows). So boards are numbered, not dated; the
// Eastern days a player's results are filed under are in ./puzzles.js.
//
// \`key\` is where a board's solves are stored (outwit_picks.quiz_id). \`given\`
// is the board row by row, one character a square: the printed digit, or 0 for
// a square the player fills or a gap between sudokus. \`sol\` is the same with
// every square filled (0 only in the gaps).
//
// Written by scripts/gen-mega.mjs (append-only; a board that may have opened is
// never rewritten) and checked by scripts/verify-mega.mjs. SERVER-ONLY: the page
// hands the browser the open board WITHOUT its \`sol\`.

export const BOARDS = [
`;
let boards = [];
if (fs.existsSync(boardsFile)) {
  const src = fs.readFileSync(boardsFile, 'utf8');
  boards = src.split('\n').filter((l) => l.startsWith('  {"num"')).map((l) => JSON.parse(l.replace(/,$/, '')));
}
let added = 0;
for (let n = boards.length + 1; n <= want; n++) {
  const t = Date.now();
  boards.push(build(n)); added++;
  const b = boards[boards.length - 1];
  console.log(`${game} board ${n}: ${megaLayout(game, b.A, b.B).grids.length} sudokus, ${[...b.given].filter((c) => c !== '0').length} printed digits, ${Date.now() - t} ms`);
}
if (added || !fs.existsSync(boardsFile)) fs.writeFileSync(boardsFile, HEAD + boards.map((b) => '  ' + JSON.stringify(b) + ',').join('\n') + '\n];\n');

// the site days
const daysFile = path.join(dir, 'puzzles.js');
if (daysTo || !fs.existsSync(daysFile)) {
  const end = Date.parse((daysTo || '2027-06-30') + 'T00:00:00Z');
  const rows = [];
  for (let t = Date.parse('2026-11-21T00:00:00Z'), n = 1; t <= end; t += 86400000, n++) {
    const iso = new Date(t).toISOString().slice(0, 10);
    const label = new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    rows.push(`  ${JSON.stringify({ num: n, quizId: megaQuizId(game, iso), live: iso, dateLabel: label })},`);
  }
  fs.writeFileSync(daysFile, `// The site days for ${MEGA[game].name}: one row per Eastern day, the day a player's
// ${MEGA[game].name} points are filed under (as Search's day list). There are no boards
// here; the boards are in ./boards.js and open one after another as each is solved.
// GENERATED by scripts/gen-mega.mjs --days; extend the dates as needed.
export const PUZZLES = [
${rows.join('\n')}
];
`);
  console.log(`${game}: ${rows.length} site days through ${daysTo || '2027-06-30'}`);
}
