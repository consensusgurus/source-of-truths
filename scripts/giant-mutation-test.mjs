#!/usr/bin/env node
// Breaks the Giant bank several ways and requires the verifier to catch each
// one. A checker nobody has seen fail is not evidence of anything.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BANK = process.env.VERIFY_GIANT_BANK || path.join(process.cwd(), 'app/giant/puzzles.js');
const VERIFIER = process.env.GIANT_VERIFIER || path.join(process.cwd(), 'scripts/verify-giant.mjs');
const { PUZZLES } = await import(pathToFileURL(BANK).href);

const emit = (list) => 'export const PUZZLES = ' + JSON.stringify(list, null, 1) + ';\n';
function runOn(list) {
  const tmp = `/tmp/giant-mutant-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`;
  fs.writeFileSync(tmp, emit(list));
  try {
    execFileSync(process.execPath, [VERIFIER], { env: { ...process.env, VERIFY_GIANT_BANK: tmp }, stdio: 'pipe' });
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
  outer: for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) if (g[r][c]) { g[r][c] = (g[r][c] % 16) + 1; break outer; }
  return b;
}, /disagrees with the solution|more than one solution|no solution|unsound/]);
// 2. a clue quietly removed, so the printed count lies
cases.push(['a clue removed', () => {
  const b = clone(); const g = b[1].given;
  outer: for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) if (g[r][c]) { g[r][c] = 0; break outer; }
  return b;
}, /printed says|wants \d+ clues/]);
// 3. the solution grid made illegal
cases.push(['solution grid broken', () => {
  const b = clone(); b[2].sol[0][0] = b[2].sol[0][1]; return b;
}, /solution breaks|repeats/]);
// 4. a symbol out of range in the solution
cases.push(['symbol 17 in the solution', () => {
  const b = clone(); b[3].sol[2][2] = 17; return b;
}, /solution breaks/]);
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
// 8. a weekday board carrying the Sunday clue count (over-dug for its slot)
cases.push(['clue count off the weekday ramp', () => {
  const b = clone(); const p = b.find((x) => !x.sunday && x.printed === 128);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) if (!p.given[r][c]) { p.given[r][c] = p.sol[r][c]; p.printed = 129; r = 99; break; }
  return b;
}, /wants 128 clues/]);
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
