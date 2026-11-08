// scripts/gen-colour-twins.mjs: builds the banks of the seven COLOUR TWINS
// (SixesToo, SudsToo, DiagToo, WindowToo, KnightToo, RacecarToo, RimToo, plus MercuryToo
// and the 16x16 GiantToo) from their numbers
// originals. Owner, 2026-11-08: "duplicate our major sudokus with colors in
// place of numbers ... give them at least 2 weeks space".
//
// HOW A TWIN BOARD IS MADE. The twin's board on day D is the original's board
// from day D - 21 (OFFSET), so:
//   - it never shows on the same day as its numbers twin, and is 21 days clear
//     of it (the owner's floor is 14; scripts/colour-twins-verify.mjs enforces it);
//   - 21 is three whole weeks, so the weekday ramp and the Sunday Edition land on
//     the same weekday they were measured for;
//   - it is MOVED by a symmetry that keeps the game's rules (a turn or mirror for
//     the 9x9 variants, plus band and row shuffles for plain Suds and Sixes) and
//     its digits are RELABELLED, so it does not look like the board three weeks
//     earlier even to a player with the archive open. Uniqueness and the logic
//     level are invariant under both, so the original's verification carries over.
//
// Deterministic (seeded by game and number), append-safe: rerunning on the same
// originals reproduces the same banks, and an extended original simply yields
// more twin days.
//
//   node scripts/gen-colour-twins.mjs [<repo dir>] [<key> ...]
//
// CAUTION: the banks that went live on 2026-11-08 were seeded under their first
// names (sixes2, rainboku and so on), so rerunning WITHOUT keys rewrites them.
// Pass the keys you mean to (re)build, e.g. `node scripts/gen-colour-twins.mjs . gianttoo`.
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = process.argv[2] || process.cwd();
export const OFFSET = 21;
export const TWIN_START = '2026-11-08';
export const TWINS = [
  { key: 'sixestoo', src: 'sixes', n: 6, moves: 'mini' },
  { key: 'sudstoo', src: 'suds', n: 9, moves: 'full' },
  { key: 'diagtoo', src: 'diag', n: 9, moves: 'd4' },
  { key: 'windowtoo', src: 'window', n: 9, moves: 'd4' },
  { key: 'knighttoo', src: 'knight', n: 9, moves: 'd4' },
  { key: 'racecartoo', src: 'racecar', n: 9, moves: 'd4' },
  { key: 'rimtoo', src: 'rim', n: 9, moves: 'd4' },
  // MERCURYTOO (owner, 2026-11-08): Mercury's thermometers with the nine colours
  // in RAINBOW order, so "bigger" reads as "further along the rainbow". Order is
  // the rule here, so its digits are NOT relabelled; only the board is moved.
  { key: 'mercurytoo', src: 'mercury', n: 9, moves: 'd4', keepDigits: true },
  // GIANTTOO (owner, 2026-11-08: "trying a giant could be interesting with colors
  // only"): Giant's 16x16 in sixteen pastels, moved like Suds (band, row, stack and
  // column shuffles in 4x4 boxes, then a turn or mirror) and relabelled.
  { key: 'gianttoo', src: 'giant', n: 16, moves: 'full' },
];

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle(a, R) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// A move is a cell map (r, c) -> [r', c'] that is a bijection of the board.
// D4: the eight turns and mirrors of the square. A turn or mirror never maps
// to itself here: the identity is excluded so every twin is visibly moved.
const D4 = [
  (n) => (r, c) => [c, n - 1 - r],          // quarter turn
  (n) => (r, c) => [n - 1 - r, n - 1 - c],  // half turn
  (n) => (r, c) => [n - 1 - c, r],          // three-quarter turn
  (n) => (r, c) => [r, n - 1 - c],          // mirror left-right
  (n) => (r, c) => [n - 1 - r, c],          // mirror top-bottom
  (n) => (r, c) => [c, r],                  // main diagonal
  (n) => (r, c) => [n - 1 - c, n - 1 - r],  // anti-diagonal
];
export function makeMove(kind, n, R) {
  if (kind === 'd4') return D4[Math.floor(R() * D4.length)](n);
  if (kind === 'mini') {
    // 6x6 in 2x3 boxes: bands of two rows, stacks of three columns. No turn
    // (a quarter turn makes 3x2 boxes); mirrors, band and row-in-band and
    // stack and column-in-stack shuffles all keep rows, columns and boxes.
    const bands = shuffle([0, 1, 2], R), inBand = [0, 1, 2].map(() => shuffle([0, 1], R));
    const stacks = shuffle([0, 1], R), inStack = [0, 1].map(() => shuffle([0, 1, 2], R));
    const rowMap = Array(6), colMap = Array(6);
    for (let b = 0; b < 3; b++) for (let k = 0; k < 2; k++) rowMap[b * 2 + k] = bands[b] * 2 + inBand[b][k];
    for (let s = 0; s < 2; s++) for (let k = 0; k < 3; k++) colMap[s * 3 + k] = stacks[s] * 3 + inStack[s][k];
    return (r, c) => [rowMap[r], colMap[c]];
  }
  // full 9x9 (or 16x16 in 4x4 boxes): band, row-in-band, stack, column-in-stack
  // shuffles, then a D4 move. The 9x9 draw order is unchanged, so its banks
  // regenerate byte for byte.
  const b = n === 16 ? 4 : 3, idx = Array.from({ length: b }, (_, k) => k);
  const bands = shuffle(idx, R), inBand = idx.map(() => shuffle(idx, R));
  const stacks = shuffle(idx, R), inStack = idx.map(() => shuffle(idx, R));
  const rowMap = Array(n), colMap = Array(n);
  for (let x = 0; x < b; x++) for (let k = 0; k < b; k++) { rowMap[x * b + k] = bands[x] * b + inBand[x][k]; colMap[x * b + k] = stacks[x] * b + inStack[x][k]; }
  const d = D4[Math.floor(R() * D4.length)](n);
  return (r, c) => d(rowMap[r], colMap[c]);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function addDays(iso, k) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const qid = (key, iso) => { const [y, m, d] = iso.split('-').map(Number); return `${key}-${m}-${d}-${String(y).slice(2)}`; };

// Rim: an edge clue is the set of the first three squares in from that edge.
const SIDES = ['top', 'bottom', 'left', 'right'];
function edgeCells(side, k, n) {
  return [0, 1, 2].map((j) => side === 'top' ? [j, k] : side === 'bottom' ? [n - 1 - j, k] : side === 'left' ? [k, j] : [k, n - 1 - j]);
}
const cellKey = (cells) => cells.map(([r, c]) => r * 100 + c).sort((a, b) => a - b).join(',');

// The printed layout as a string: which squares carry a digit, which edges a
// Rim clue, which squares a Racecar line, after the move.
export function layout(p, n, move) {
  const g = Array(n * n).fill('.');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (p.given[r][c]) { const [r2, c2] = move(r, c); g[r2 * n + c2] = 'g'; }
  if (p.lines) for (const line of p.lines) for (const [r, c] of line) { const [r2, c2] = move(r, c); g[r2 * n + c2] += 'l'; }
  if (p.thermos) for (const th of p.thermos) th.forEach(([r, c], q) => { const [r2, c2] = move(r, c); g[r2 * n + c2] += 't' + q; });
  if (p.rim) for (const s of SIDES) (p.rim[s] || []).forEach((clue, k) => { if (clue) for (const [r, c] of edgeCells(s, k, n)) { const [r2, c2] = move(r, c); g[r2 * n + c2] += 'e'; } });
  return g.join('|');
}

export function twinBoard(t, p, num) {
  const n = t.n;
  const R = rng(hash(`${t.key}:${p.num}`));
  // The clue layout must CHANGE: a half turn of a symmetric layout (or a
  // mirror of a mirror-symmetric one) would print the same pattern of squares,
  // which is a giveaway beside the archive. Draw moves until the layout differs.
  let move = null;
  for (let tries = 0; tries < 64 && !move; tries++) {
    const m = makeMove(t.moves, n, R);
    if (layout(p, n, m) !== layout(p, n, (r, c) => [r, c])) move = m;
  }
  if (!move) throw new Error(`${t.key} #${p.num}: no move changes the clue layout`);
  const relabel = t.keepDigits ? Array.from({ length: n + 1 }, (_, k) => k) : [0, ...shuffle(Array.from({ length: n }, (_, k) => k + 1), R)]; // relabel[d] = new digit
  const grid = (g) => { const out = Array.from({ length: n }, () => Array(n).fill(0)); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const [r2, c2] = move(r, c); out[r2][c2] = g[r][c] ? relabel[g[r][c]] : 0; } return out; };
  const live = addDays(p.live, OFFSET);
  const out = { num, quizId: qid(t.key, live), live, dateLabel: label(live), sunday: !!p.sunday };
  for (const k of ['level', 'cost', 'clues', 'printed']) if (p[k] != null) out[k] = p[k];
  out.from = { num: p.num, live: p.live };
  if (p.lines) out.lines = p.lines.map((line) => line.map(([r, c]) => move(r, c)));
  if (p.thermos) out.thermos = p.thermos.map((t2) => t2.map(([r, c]) => move(r, c)));
  if (p.rim) {
    const src = {};
    for (const s of SIDES) (p.rim[s] || []).forEach((clue, k) => { src[cellKey(edgeCells(s, k, n).map(([r, c]) => move(r, c)))] = clue; });
    const rim = {};
    for (const s of SIDES) rim[s] = Array.from({ length: n }, (_, k) => {
      const clue = src[cellKey(edgeCells(s, k, n))];
      if (clue === undefined) throw new Error(`${t.key} #${p.num}: edge ${s}${k} has no preimage`);
      return clue == null ? null : clue.split('').map((ch) => relabel[Number(ch)]).sort((a, b) => a - b).join('');
    });
    out.rim = rim;
  }
  out.given = grid(p.given);
  out.sol = grid(p.sol);
  return out;
}

export async function loadPuzzles(file) {
  const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  return mod.PUZZLES;
}

function fmt(p) {
  const L = [];
  L.push('  {');
  L.push(`    num: ${p.num},`);
  L.push(`    quizId: '${p.quizId}',`);
  L.push(`    live: '${p.live}',`);
  L.push(`    dateLabel: '${p.dateLabel}',`);
  L.push(`    sunday: ${p.sunday},`);
  for (const k of ['level', 'cost', 'clues', 'printed']) if (p[k] != null) L.push(`    ${k}: ${p[k]},`);
  L.push(`    from: { num: ${p.from.num}, live: '${p.from.live}' },`);
  if (p.lines) L.push(`    lines: ${JSON.stringify(p.lines)},`);
  if (p.thermos) L.push(`    thermos: ${JSON.stringify(p.thermos)},`);
  if (p.rim) L.push(`    rim: ${JSON.stringify(p.rim)},`);
  L.push(`    given: ${JSON.stringify(p.given)},`);
  L.push(`    sol: ${JSON.stringify(p.sol)},`);
  L.push('  },');
  return L.join('\n');
}

async function main() {
  const only = process.argv.slice(3);
  for (const t of TWINS) {
    if (only.length && !only.includes(t.key)) continue;
    const src = await loadPuzzles(path.join(ROOT, 'app', t.src, 'puzzles.js'));
    const picked = src.filter((p) => addDays(p.live, OFFSET) >= TWIN_START).sort((a, b) => a.live.localeCompare(b.live));
    const boards = picked.map((p, i) => twinBoard(t, p, i + 1));
    const name = t.key[0].toUpperCase() + t.key.slice(1, -3) + 'Too';
    const what = t.keepDigits ? 'the RAINBOW twin' : 'the COLOUR TWIN';
    const head = `// Puzzle data for ${name}, ${what} of ${t.src[0].toUpperCase() + t.src.slice(1)}: the same rules with
// colours in place of digits. GENERATED by scripts/gen-colour-twins.mjs from
// app/${t.src}/puzzles.js; do not edit by hand, rerun the script.
//
// Day D plays the ${t.src} board from day D - ${OFFSET} (\`from\`), moved by a
// symmetry that keeps the rules${t.keepDigits ? ' (digits kept: order is the rule)' : ' and with its digits relabelled'}, so it never
// shows on the same day as its twin and does not look like it. Digits here are
// still 1 to ${t.n}: the client paints digit d in colour d (lib/colour-sudoku.js).
// Imported ONLY by the server page, which filters live<=today before handing
// boards to the client. Checked by scripts/colour-twins-verify.mjs.
export const PUZZLES = [
`;
    const body = boards.map(fmt).join('\n');
    const dir = path.join(ROOT, 'app', t.key);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'puzzles.js'), head + body + '\n];\n');
    console.log(`${t.key}: ${boards.length} boards, ${boards[0].live} to ${boards[boards.length - 1].live}`);
  }
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
