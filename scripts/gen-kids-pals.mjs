#!/usr/bin/env node
// gen-kids-pals: build app/kids/pals/puzzles.js, the Pixel Pals bank.
//
// Pixel Pals is Etch for kids: a 5x5 nonogram whose answer is a picture. The
// shapes below are hand-drawn ('#' filled). The generator derives the clues
// and keeps ONLY the shapes a line solver finishes on its own, i.e. boards
// that are unique AND solvable with no guessing, one line at a time. A shape
// that fails is dropped, never nudged (the same rule Etch runs under).
//
//   node scripts/gen-kids-pals.mjs        writes the bank
//   node scripts/gen-kids-pals.mjs --dry  prints the verdict per shape only
//
// scripts/verify-kids.mjs re-proves every committed board with its own solver.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// name, 5 rows. Keep every clue to at most two runs so a kid reads "2" or
// "1 1", never a three-number clue.
const ART = [
  ['a heart', ['.#.#.', '#####', '#####', '.###.', '..#..']],
  ['a diamond', ['..#..', '.###.', '#####', '.###.', '..#..']],
  ['a plus sign', ['..#..', '..#..', '#####', '..#..', '..#..']],
  ['a house', ['..#..', '.###.', '#####', '.#.#.', '.#.#.']],
  ['a tree', ['..#..', '.###.', '#####', '..#..', '..#..']],
  ['an arrow pointing up', ['..#..', '.###.', '#.#.#', '..#..', '..#..']],
  ['a cup', ['#...#', '####.', '####.', '####.', '.###.']],
  ['a boat', ['..#..', '..##.', '..#..', '#####', '.###.']],
  ['a letter T', ['#####', '..#..', '..#..', '..#..', '..#..']],
  ['a letter L', ['#....', '#....', '#....', '#....', '#####']],
  ['a mushroom', ['.###.', '#####', '#####', '..#..', '..#..']],
  ['a smiley face', ['.#.#.', '.#.#.', '.....', '#...#', '.###.']],
  ['a cat face', ['#...#', '#####', '#.#.#', '#####', '.###.']],
  ['a letter X', ['#...#', '.#.#.', '..#..', '.#.#.', '#...#']],
  ['a picture frame', ['#####', '#...#', '#...#', '#...#', '#####']],
  ['a ladder', ['#...#', '#####', '#...#', '#####', '#...#']],
  ['stairs', ['#....', '##...', '###..', '####.', '#####']],
  ['a rocket', ['..#..', '.###.', '.###.', '#####', '#.#.#']],
  ['a bell', ['..#..', '.###.', '.###.', '#####', '..#..']],
  ['an umbrella', ['.###.', '#####', '..#..', '..#..', '.##..']],
  ['a lollipop', ['.###.', '#####', '.###.', '..#..', '..#..']],
  ['an arrow pointing right', ['..#..', '...#.', '#####', '...#.', '..#..']],
  ['a letter H', ['#...#', '#...#', '#####', '#...#', '#...#']],
  ['a letter U', ['#...#', '#...#', '#...#', '#...#', '.###.']],
  ['a butterfly', ['##.##', '#####', '..#..', '#####', '##.##']],
  ['a bow tie', ['#...#', '##.##', '#####', '##.##', '#...#']],
  ['a flower', ['.#.#.', '#####', '.###.', '..#..', '..#..']],
  ['a fish', ['...#.', '.###.', '####.', '.###.', '...#.']],
  ['a crown', ['#.#.#', '#####', '#####', '#####', '.....']],
  ['an hourglass', ['#####', '.###.', '..#..', '.###.', '#####']],
  ['a pyramid', ['..#..', '..#..', '.###.', '.###.', '#####']],
  ['a candle', ['..#..', '.....', '.###.', '.###.', '.###.']],
  ['a snowman', ['..#..', '.###.', '..#..', '.###.', '#####']],
  ['a key', ['.###.', '#...#', '.###.', '..#..', '..##.']],
  ['a bird', ['.##..', '###..', '.####', '.###.', '..#..']],
  ['a turtle', ['.....', '.###.', '#####', '#.#.#', '.....']],
  ['a car', ['.....', '.###.', '#####', '#####', '.#.#.']],
  ['a robot', ['#####', '#.#.#', '#####', '.###.', '.#.#.']],
  ['a chick', ['.##..', '.###.', '#####', '.###.', '.#.#.']],
  ['a bunny', ['#...#', '#...#', '#####', '#####', '.###.']],
  ['a whale', ['....#', '####.', '#####', '#####', '.###.']],
  ['a kite', ['..#..', '.###.', '#####', '.###.', '..#..']],
  ['a pot', ['#####', '.###.', '.###.', '.###.', '..#..']],
  ['a cross', ['.###.', '.###.', '#####', '.###.', '.###.']],
  ['a duck', ['.##..', '###..', '.#...', '####.', '.###.']],
  ['a letter A', ['..#..', '.#.#.', '#####', '#...#', '#...#']],
  ['a letter E', ['#####', '#....', '####.', '#....', '#####']],
  ['a letter M', ['#...#', '##.##', '#.#.#', '#...#', '#...#']],
  ['a letter W', ['#...#', '#...#', '#.#.#', '##.##', '#...#']],
  ['a letter Y', ['#...#', '.#.#.', '..#..', '..#..', '..#..']],
  ['a letter Z', ['#####', '...#.', '..#..', '.#...', '#####']],
  ['a number 8', ['.###.', '#...#', '.###.', '#...#', '.###.']],
  ['a bowl of soup', ['#####', '#####', '.###.', '..#..', '.###.']],
  ['a sailboat', ['..#..', '.##..', '###..', '#####', '.###.']],
  ['a letter I', ['#####', '..#..', '..#..', '..#..', '#####']],
  ['a letter C', ['#####', '#....', '#....', '#....', '#####']],
  ['a chair', ['#....', '#....', '####.', '#..#.', '#..#.']],
  ['a table', ['#####', '#...#', '#...#', '#...#', '.....']],
  ['a door', ['.###.', '.###.', '.#.#.', '.###.', '.###.']],
  ['a tent', ['..#..', '.###.', '#####', '#...#', '#...#']],
  ['a trophy', ['#####', '.###.', '..#..', '..#..', '.###.']],
  ['a t-shirt', ['##.##', '#####', '.###.', '.###.', '.###.']],
  ['a mountain', ['..#..', '.###.', '.###.', '#####', '#####']],
  ['a bridge', ['#####', '#.#.#', '#.#.#', '.....', '#####']],
  ['a rainbow', ['.###.', '#...#', '#...#', '.....', '.....']],
  ['a mouse', ['##.##', '#####', '.###.', '..#..', '.....']],
  ['an ice cream cone', ['.###.', '#####', '.###.', '.###.', '..#..']],
];

// Runs of filled cells along a line.
export function runsOf(line) {
  const out = [];
  let n = 0;
  for (const ch of line) { if (ch) n++; else if (n) { out.push(n); n = 0; } }
  if (n) out.push(n);
  return out;
}

// All 2^5 fills of a line consistent with a clue and with what is already known
// (1 filled, 0 empty, null unknown).
function candidates(clue, known) {
  const out = [];
  for (let m = 0; m < 32; m++) {
    const line = [0, 1, 2, 3, 4].map((i) => (m >> i) & 1);
    let ok = true;
    for (let i = 0; i < 5; i++) if (known[i] != null && known[i] !== line[i]) { ok = false; break; }
    if (!ok) continue;
    const r = runsOf(line);
    if (r.length === clue.length && r.every((v, i) => v === clue[i])) out.push(line);
  }
  return out;
}

// Line-by-line propagation to a fixpoint. Returns the grid if fully
// determined (unique + no guessing), else null.
export function lineSolve(rows, cols) {
  const g = Array.from({ length: 5 }, () => Array(5).fill(null));
  for (let pass = 0; pass < 30; pass++) {
    let changed = false;
    for (let r = 0; r < 5; r++) {
      const c = candidates(rows[r], g[r]);
      if (!c.length) return null;
      for (let i = 0; i < 5; i++) if (g[r][i] == null && c.every((l) => l[i] === c[0][i])) { g[r][i] = c[0][i]; changed = true; }
    }
    for (let k = 0; k < 5; k++) {
      const known = g.map((row) => row[k]);
      const c = candidates(cols[k], known);
      if (!c.length) return null;
      for (let i = 0; i < 5; i++) if (g[i][k] == null && c.every((l) => l[i] === c[0][i])) { g[i][k] = c[0][i]; changed = true; }
    }
    if (!changed) break;
  }
  return g.every((row) => row.every((v) => v != null)) ? g : null;
}

export function cluesOf(grid) {
  const rows = grid.map((row) => runsOf(row));
  const cols = [0, 1, 2, 3, 4].map((k) => runsOf(grid.map((row) => row[k])));
  return { rows, cols };
}

const dry = process.argv.includes('--dry');
const bank = [];
const seen = new Set();
for (const [name, art] of ART) {
  const grid = art.map((s) => [...s].map((ch) => (ch === '#' ? 1 : 0)));
  const key = art.join('/');
  if (seen.has(key)) { console.log(`✗ ${name}: duplicate art`); continue; }
  seen.add(key);
  const { rows, cols } = cluesOf(grid);
  const big = [...rows, ...cols].some((c) => c.length > 2);
  const filled = grid.flat().filter(Boolean).length;
  const solved = lineSolve(rows, cols);
  const ok = solved && solved.every((row, r) => row.every((v, c) => v === grid[r][c]));
  if (big) { console.log(`✗ ${name}: a clue has three runs`); continue; }
  if (!ok) { console.log(`✗ ${name}: not line-solvable (drops)`); continue; }
  if (filled < 8) { console.log(`✗ ${name}: too sparse (${filled})`); continue; }
  console.log(`✓ ${name}`);
  bank.push({ name, art, rows, cols });
}
console.log(`${bank.length} of ${ART.length} shapes kept`);
if (dry) process.exit(0);

// Interleave so two letters or two animals are not back to back.
const num = bank.map((b, i) => ({ num: i + 1, ...b }));
const src = `// Pixel Pals bank. GENERATED by scripts/gen-kids-pals.mjs from the hand-drawn
// shapes in that file; do not edit by hand. Every board is a 5x5 picture whose
// row and column clues a line solver completes with no guessing, so the board
// is unique and a kid can always find the next square by counting.
//
// The bank CYCLES: today's board is PUZZLES[(kids day - 1) % PUZZLES.length]
// (lib/kids-daily.js). \`art\` is the answer and is imported only by the server
// page, which ships the clues and the name.
export const PUZZLES = [
${num.map((b) => `  { num: ${b.num}, name: ${JSON.stringify(b.name)}, art: ${JSON.stringify(b.art)}, rows: ${JSON.stringify(b.rows)}, cols: ${JSON.stringify(b.cols)} },`).join('\n')}
];
`;
writeFileSync(join(here, '..', 'app', 'kids', 'pals', 'puzzles.js'), src);
console.log('wrote app/kids/pals/puzzles.js');
