// Mutation test for scripts/verify-arrow.mjs: break the real bank one way at a
// time and require the verifier to FAIL on every break. A checker that has
// never been shown to fail has not been tested.
//
//   node scripts/arrow-mutation-test.mjs
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUZZLES } from '../app/arrow/puzzles.js';

const dir = mkdtempSync(join(tmpdir(), 'arrow-mut-'));
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
const MUTATIONS = {
  'circle digit changed in sol': (b) => { const [r, c] = b[3].arrows[0][0]; b[3].sol[r][c] = b[3].sol[r][c] === 9 ? 8 : b[3].sol[r][c] + 1; },
  'a printed digit removed': (b) => { const p = b[5]; outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p.given[r][c]) { p.given[r][c] = 0; break outer; } },
  'a printed digit made wrong': (b) => { const p = b[8]; outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p.given[r][c]) { p.given[r][c] = p.given[r][c] === 9 ? 1 : p.given[r][c] + 1; break outer; } },
  'two arrows share a square': (b) => { const p = b[10]; p.arrows[1][p.arrows[1].length - 1] = p.arrows[0][0]; },
  'an arrow jumps a square': (b) => { const p = b[12]; const [r, c] = p.arrows[0][0]; p.arrows[0][1] = [r, c >= 2 ? c - 2 : c + 2]; },
  'an arrow dropped': (b) => { b[15].arrows.pop(); },
  'sunday flag on a weekday': (b) => { const p = b.find((x) => !x.sunday); p.sunday = true; },
  'quizId does not match its date': (b) => { b[20].quizId = b[21].quizId; },
  'every square printed': (b) => { const p = b[25]; p.given = p.sol.map((r) => r.slice()); p.printed = 81; },
  'dates not contiguous': (b) => { b[30].live = b[29].live; },
  'solution breaks a box': (b) => { const p = b[33]; const t = p.sol[0][0]; p.sol[0][0] = p.sol[0][1]; p.sol[0][1] = t; },
};

let caught = 0;
const missed = [];
for (const [name, fn] of Object.entries(MUTATIONS)) {
  const bank = clone();
  fn(bank);
  const file = join(dir, `${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(file, `export const PUZZLES = ${JSON.stringify(bank)};\n`);
  const res = spawnSync(process.execPath, [new URL('./verify-arrow.mjs', import.meta.url).pathname], { env: { ...process.env, VERIFY_ARROW_BANK: file }, encoding: 'utf8' });
  if (res.status !== 0) caught++; else missed.push(name);
}
console.log(`${caught}/${Object.keys(MUTATIONS).length} mutations caught`);
for (const m of missed) console.log(`MISSED  ${m}`);
process.exit(missed.length ? 1 : 0);
