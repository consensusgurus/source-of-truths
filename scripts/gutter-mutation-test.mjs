#!/usr/bin/env node
// Breaks the Frame or Rim bank several ways and requires its verifier to catch
// each one. A checker nobody has seen fail is not evidence of anything.
//
//   node scripts/gutter-mutation-test.mjs frame|rim
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const GAME = process.argv[2];
if (GAME !== 'frame' && GAME !== 'rim') { console.error('usage: node scripts/gutter-mutation-test.mjs frame|rim'); process.exit(1); }
const ENV = `VERIFY_${GAME.toUpperCase()}_BANK`;
const BANK = process.env[ENV] || path.join(process.cwd(), `app/${GAME}/puzzles.js`);
const VERIFIER = path.join(process.cwd(), `scripts/verify-${GAME}.mjs`);
const { PUZZLES } = await import(pathToFileURL(BANK).href);

const emit = (list) => 'export const PUZZLES = ' + JSON.stringify(list, null, 1) + ';\n';
function runOn(list) {
  const tmp = `/tmp/${GAME}-mutant-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`;
  fs.writeFileSync(tmp, emit(list));
  try { execFileSync(process.execPath, [VERIFIER], { env: { ...process.env, [ENV]: tmp }, stdio: 'pipe' }); return { failed: false, out: '' }; }
  catch (e) { return { failed: true, out: String(e.stdout || '') + String(e.stderr || '') }; }
  finally { try { fs.unlinkSync(tmp); } catch (err) {} }
}
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
const cases = [];
if (GAME === 'frame') {
  cases.push(['clue contradicts the solution', () => { const b = clone(); const g = b[0].given; outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { g[r][c] = (g[r][c] % 9) + 1; break outer; } return b; }, /disagrees with the solution|more than one solution|no solution|unsound/]);
  cases.push(['a printed digit removed', () => { const b = clone(); const g = b[1].given; outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { g[r][c] = 0; break outer; } return b; }, /clues says|wants \d+ digits/]);
  cases.push(['a sum off by one', () => { const b = clone(); b[2].sums.left[3] += 1; return b; }, /sum 4 says/]);
  cases.push(['sums blanked to make the board ambiguous', () => { const b = clone(); b[3].sums.top = b[3].sums.top.map(() => 15); return b; }, /says 15|no solution|more than one/]);
  cases.push(['gutter made redundant by printing every digit', () => { const b = clone(); const p = b[6]; for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) p.given[r][c] = p.sol[r][c]; p.clues = 81; return b; }, /WITHOUT the sums/]);
} else {
  cases.push(['a triple that lies', () => { const b = clone(); const side = ['top', 'bottom', 'left', 'right'].find((s) => b[0].rim[s].some(Boolean)); const k = b[0].rim[side].findIndex(Boolean); b[0].rim[side][k] = b[0].rim[side][k] === '123' ? '456' : '123'; return b; }, /entry \d+ says|no solution|more than one/]);
  cases.push(['a triple removed so the count lies', () => { const b = clone(); const side = ['top', 'bottom', 'left', 'right'].find((s) => b[1].rim[s].some(Boolean)); const k = b[1].rim[side].findIndex(Boolean); b[1].rim[side][k] = null; return b; }, /printed says|wants \d+ triples/]);
  cases.push(['a digit printed inside the grid', () => { const b = clone(); b[2].given[4][4] = b[2].sol[4][4]; return b; }, /printed inside the grid/]);
  cases.push(['too few triples to pin the grid', () => { const b = clone(); const p = b[3]; for (const s of ['top', 'bottom']) p.rim[s] = p.rim[s].map(() => null); return b; }, /wants \d+ triples|more than one solution|need a guess/]);
  cases.push(['duplicate gutter pattern', () => { const b = clone(); const donor = b.findIndex((p, i) => i !== 8 && p.printed === b[8].printed); const p = b[8]; for (const s of ['top', 'bottom', 'left', 'right']) p.rim[s] = p.rim[s].map((v, k) => (b[donor].rim[s][k] ? (['1','2','3','4','5','6','7','8','9'].filter((d) => cellsDigits(p.sol, s, k).includes(d)).join('')) : null)); return b; }, /repeats the gutter pattern|wants \d+ triples|printed says|more than one|need a guess/]);
}
function cellsDigits(sol, side, k) {
  const c = side === 'top' ? [[0, k], [1, k], [2, k]] : side === 'bottom' ? [[8, k], [7, k], [6, k]] : side === 'left' ? [[k, 0], [k, 1], [k, 2]] : [[k, 8], [k, 7], [k, 6]];
  return c.map(([r, cc]) => String(sol[r][cc]));
}
cases.push(['solution grid broken', () => { const b = clone(); b[4].sol[0][0] = b[4].sol[0][1]; return b; }, /not a legal sudoku grid|disagrees|says/]);
cases.push(['sunday flag on a weekday', () => { const b = clone(); const i = b.findIndex((p) => !p.sunday); b[i].sunday = true; return b; }, /sunday flag/]);
cases.push(['a date skipped', () => { const b = clone(); b[5].live = '2026-12-25'; return b; }, /is not day \d+ after|dateLabel|quizId/]);
cases.push(['duplicate solution grid', () => { const b = clone(); b[7].sol = JSON.parse(JSON.stringify(b[9].sol)); return b; }, /repeats the solution grid|disagrees|says|not a legal|more than one|no solution|unsound|logic reached/]);

let bad = 0;
const clean = runOn(clone());
if (clean.failed) { console.error('MUTATION TEST: the UNMODIFIED bank fails the verifier\n' + clean.out); process.exit(1); }
console.log('baseline: clean bank passes');
for (const [name, mutate, re] of cases) {
  const r = runOn(mutate());
  if (!r.failed) { console.error(`NOT CAUGHT: ${name}`); bad++; continue; }
  if (!re.test(r.out)) { console.error(`CAUGHT BUT FOR THE WRONG REASON: ${name}\n${r.out.split('\n').filter((l) => l.includes('FAIL')).slice(0, 3).join('\n')}`); bad++; continue; }
  console.log(`caught: ${name}`);
}
if (bad) { console.error(`\nMUTATION TEST: ${bad} of ${cases.length} mutations slipped through.`); process.exit(1); }
console.log(`\nMUTATION TEST ok: all ${cases.length} mutations caught.`);
