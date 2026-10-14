// Mutation test for scripts/verify-cell.mjs: break the real bank one way at a
// time and require the verifier to FAIL on every break. A checker that has
// never been shown to fail has not been tested.
//
//   node scripts/cell-mutation-test.mjs
//
// Each run re-proves the minimum on the first three boards only (--prove 3), so
// every mutation that touches a minimum lands on one of those.
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUZZLES } from '../app/cell/puzzles.js';

const dir = mkdtempSync(join(tmpdir(), 'cell-mut-'));
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
const MUTATIONS = {
  'perfect one too many (still in band or not, the proof disagrees)': (b) => { b[0].perfect += 1; },
  'perfect one too few': (b) => { b[1].perfect -= 1; },
  // Reversing column 3 of board 3 moves its minimum from 19 to 14 (measured).
  'deal changed under a stored perfect (a column reversed)': (b) => { b[2].deal[2].reverse(); },
  'a card dealt twice': (b) => { const d = b[6].deal; d[1][2] = d[0][0]; },
  'a card from outside the deck': (b) => { const p = b[7]; p.deal[2][1] = (p.deal[2][1] & ~15) | (p.ranks + 1); },
  'columns not dealt round robin': (b) => { const d = b[8].deal; d[5].push(d[0].shift()); },
  'sunday flag on a weekday': (b) => { const p = b.find((x) => !x.sunday); p.sunday = true; },
  'quizId does not match its date': (b) => { b[20].quizId = b[21].quizId; },
  'dates not contiguous': (b) => { b[30].live = b[29].live; },
  'wrong number of free cells for the weekday': (b) => { const p = b.find((x) => x.cells === 4); p.cells = 2; },
  'a solution shipped in the bank': (b) => { b[11].line = [[1, 1, 200]]; },
  'a deal repeated': (b) => { const src = b[12]; const p = b.find((x, i) => i > 12 && x.live > src.live && new Date(`${x.live}T12:00:00Z`).getUTCDay() === new Date(`${src.live}T12:00:00Z`).getUTCDay()); p.deal = JSON.parse(JSON.stringify(src.deal)); p.perfect = src.perfect; },
  'perfect falls inside a week': (b) => { const p = b.find((x) => new Date(`${x.live}T12:00:00Z`).getUTCDay() === 6 && x.live > b[0].live); p.perfect = 12; },
  'Sunday Edition on the small deck': (b) => { const p = b.find((x) => x.sunday); p.ranks = 8; },
};

let caught = 0;
const missed = [];
for (const [name, fn] of Object.entries(MUTATIONS)) {
  const bank = clone();
  fn(bank);
  const file = join(dir, `${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(file, `export const PUZZLES = ${JSON.stringify(bank)};\n`);
  const res = spawnSync(process.execPath, [new URL('./verify-cell.mjs', import.meta.url).pathname, '--prove', '3'], { env: { ...process.env, VERIFY_CELL_BANK: file }, encoding: 'utf8' });
  if (res.status !== 0) { caught++; console.log(`caught  ${name}`); } else { missed.push(name); console.log(`MISSED  ${name}`); }
}
console.log(`${caught}/${Object.keys(MUTATIONS).length} mutations caught`);
process.exit(missed.length ? 1 : 0);
