#!/usr/bin/env node
// Breaks a line-sudoku bank several ways and requires its verifier to catch
// each one. A checker nobody has seen fail is not evidence of anything.
//
//   node scripts/lines-mutation-test.mjs five
//   node scripts/lines-mutation-test.mjs racecar
//
// Works on the first eight boards (a full Sunday-to-Saturday week and then
// some), so each verifier pass takes seconds rather than minutes.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const key = process.argv[2];
if (!['five', 'racecar'].includes(key)) { console.error('usage: lines-mutation-test.mjs five|racecar'); process.exit(1); }
const ENV = `VERIFY_${key.toUpperCase()}_BANK`;
const BANK = process.env[ENV] || path.join(process.cwd(), `app/${key}/puzzles.js`);
const VERIFIER = path.join(process.cwd(), `scripts/verify-${key}.mjs`);
const { PUZZLES } = await import(pathToFileURL(BANK).href);
const BASE = PUZZLES.slice(0, 8);

const emit = (list) => 'export const PUZZLES = ' + JSON.stringify(list, null, 1) + ';\n';
function runOn(list) {
  const tmp = `/tmp/${key}-mutant-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`;
  fs.writeFileSync(tmp, emit(list));
  try {
    execFileSync(process.execPath, [VERIFIER], { env: { ...process.env, [ENV]: tmp }, stdio: 'pipe' });
    return { failed: false, out: '' };
  } catch (e) {
    return { failed: true, out: String(e.stdout || '') + String(e.stderr || '') };
  } finally { try { fs.unlinkSync(tmp); } catch (err) { /* gone */ } }
}
const clone = () => JSON.parse(JSON.stringify(BASE));

const cases = [
  ['clue contradicts the solution', () => {
    const b = clone(); const g = b[0].given;
    outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { g[r][c] = (g[r][c] % 9) + 1; break outer; }
    return b;
  }, /disagrees with the solution/],
  ['a clue removed', () => {
    const b = clone(); const g = b[1].given;
    outer: for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { g[r][c] = 0; break outer; }
    return b;
  }, /printed says|wants \d+ clues/],
  ['solution grid broken', () => { const b = clone(); b[2].sol[0][0] = b[2].sol[0][1]; return b; }, /not a legal sudoku/],
  ['a line made illegal for its own solution', () => {
    const b = clone(); const p = b[3];
    // swap two squares of the first line out to a pair that breaks the rule:
    // move the line's last square onto the first square's row neighbour chain
    const ln = p.lines[0];
    const [r0, c0] = ln[0];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = r0 + dr, c = c0 + dc;
      if ((dr || dc) && r >= 0 && r < 9 && c >= 0 && c < 9 && !p.lines.some((l) => l.some(([a, bb]) => a === r && bb === c))) {
        const x = p.sol[r0][c0], y = p.sol[r][c];
        const breaks = key === 'five' ? Math.abs(x - y) < 5 : x !== y;
        if (breaks) { p.lines.push([[r0, c0], [r, c]].slice(0)); p.lines[0] = ln.slice(1); if (p.lines[0].length < 2) p.lines.shift(); return b; }
      }
    }
    return b;
  }, /breaks a line|malformed/],
  ['a line that is not king steps', () => {
    const b = clone(); const ln = b[4].lines[0];
    ln.push([ln[ln.length - 1][0], (ln[ln.length - 1][1] + 4) % 9]); return b;
  }, /malformed/],
  ['stored level wrong', () => { const b = clone(); b[5].level = b[5].level === 1 ? 2 : 1; return b; }, /level says/],
  ['sunday flag on a weekday', () => { const b = clone(); const i = b.findIndex((p) => !p.sunday); b[i].sunday = true; return b; }, /sunday flag/],
  ['a date skipped', () => { const b = clone(); b[6].live = '2026-12-25'; return b; }, /is not day \d+ after|dateLabel|quizId/],
  ['lines made redundant', () => {
    const b = clone(); const p = b[7];
    p.given = JSON.parse(JSON.stringify(p.sol)); p.printed = 81; return b;
  }, /WITHOUT the lines/],
];

const clean = runOn(clone());
if (clean.failed) { console.error('MUTATION TEST: the UNMODIFIED bank fails the verifier\n' + clean.out); process.exit(1); }
console.log('baseline: clean bank passes');
let bad = 0;
for (const [name, mutate, re] of cases) {
  const r = runOn(mutate());
  if (!r.failed) { console.error(`NOT CAUGHT: ${name}`); bad++; continue; }
  if (!re.test(r.out)) { console.error(`CAUGHT BUT FOR THE WRONG REASON: ${name}\n${r.out.split('\n').filter((l) => l.includes('FAIL')).slice(0, 3).join('\n')}`); bad++; continue; }
  console.log(`caught: ${name}`);
}
if (bad) { console.error(`\nMUTATION TEST: ${bad} of ${cases.length} mutations slipped through.`); process.exit(1); }
console.log(`\nMUTATION TEST ok: all ${cases.length} mutations caught.`);
