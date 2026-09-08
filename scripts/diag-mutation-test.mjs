#!/usr/bin/env node
// Breaks the Diag bank several ways and requires the verifier to catch each
// one. A checker nobody has seen fail is not evidence of anything.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BANK = process.env.VERIFY_DIAG_BANK || path.join(process.cwd(), 'app/diag/puzzles.js');
const VERIFIER = process.env.DIAG_VERIFIER || path.join(process.cwd(), 'scripts/verify-diag.mjs');
const { PUZZLES } = await import(pathToFileURL(BANK).href);

const emit = (list) => 'export const PUZZLES = ' + JSON.stringify(list, null, 1) + ';\n';
function runOn(list) {
  const tmp = `/tmp/diag-mutant-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`;
  fs.writeFileSync(tmp, emit(list));
  try {
    execFileSync(process.execPath, [VERIFIER], { env: { ...process.env, VERIFY_DIAG_BANK: tmp }, stdio: 'pipe' });
    return { failed: false, out: '' };
  } catch (e) {
    return { failed: true, out: String(e.stdout || '') + String(e.stderr || '') };
  } finally { try { fs.unlinkSync(tmp); } catch (err) {} }
}
const clone = () => JSON.parse(JSON.stringify(PUZZLES));

const cases = [];
// 1. a clue that disagrees with its own solution
cases.push(['clue contradicts the solution', () => {
  const b = clone(); const g = b[0].given;
  outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { g[r][c] = (g[r][c] % 9) + 1; break outer; }
  return b;
}, /disagrees with the solution|more than one solution|no solution|unsound/]);
// 2. a clue quietly removed, so the printed count lies
cases.push(['a clue removed', () => {
  const b = clone(); const g = b[1].given;
  outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { g[r][c] = 0; break outer; }
  return b;
}, /printed says|wants \d+ clues/]);
// 3. the solution grid made illegal
cases.push(['solution grid broken', () => {
  const b = clone(); b[2].sol[0][0] = b[2].sol[0][1]; return b;
}, /not a legal diagonal grid|repeats/]);
// 4. a diagonal repeat planted in an otherwise legal-looking solution: r1c1
//    and r2c2 share the main diagonal but no row, column or box
cases.push(['diagonal repeat in the solution', () => {
  const b = clone(); const s = b[3].sol;
  const d = s[0][0]; s[1][1] = d; return b;
}, /diagonal/]);
// 5. the stored level does not match what the board demands
cases.push(['stored level wrong', () => {
  const b = clone(); b[4].level = b[4].level === 1 ? 2 : 1; return b;
}, /level says/]);
// 6. the Sunday flag on a weekday
cases.push(['sunday flag on a weekday', () => {
  const b = clone(); const i = b.findIndex((p) => !p.sunday); b[i].sunday = true; return b;
}, /sunday flag/]);
// 7. dates out of sequence
cases.push(['a date skipped', () => {
  const b = clone(); b[5].live = '2026-12-25'; return b;
}, /is not day \d+ after|dateLabel|quizId/]);
// 8. the diagonal rule reduced to decoration by over-cluing
cases.push(['diagonal rule made redundant', () => {
  const b = clone();
  const p = b[6];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) p.given[r][c] = p.sol[r][c];
  p.printed = 81;
  return b;
}, /WITHOUT the diagonal rule/]);
// 9. two boards sharing a solution grid
cases.push(['duplicate solution grid', () => {
  const b = clone(); b[8].sol = JSON.parse(JSON.stringify(b[7].sol)); return b;
}, /repeats the solution grid|disagrees with the solution|not a legal|more than one solution|no solution|unsound|logic reached/]);

let bad = 0;
// the untouched bank must pass, or nothing below means anything
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
