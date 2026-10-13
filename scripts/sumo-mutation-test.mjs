#!/usr/bin/env node
// Breaks the Sumo bank several ways and requires scripts/verify-sumo.mjs to
// catch each one, for the right reason. A checker nobody has seen fail is not
// evidence of anything.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BANK = process.env.VERIFY_SUMO_BANK || path.join(process.cwd(), 'app/sumo/puzzles.js');
const VERIFIER = path.join(process.cwd(), 'scripts/verify-sumo.mjs');
const { PUZZLES } = await import(pathToFileURL(BANK).href);
const emit = (list) => 'export const PUZZLES = ' + JSON.stringify(list, null, 1) + ';\n';
function runOn(list) {
  const tmp = `/tmp/sumo-mutant-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`;
  fs.writeFileSync(tmp, emit(list));
  try { execFileSync(process.execPath, [VERIFIER], { env: { ...process.env, VERIFY_SUMO_BANK: tmp }, stdio: 'pipe' }); return { failed: false, out: '' }; }
  catch (e) { return { failed: true, out: String(e.stdout || '') + String(e.stderr || '') }; }
  finally { try { fs.unlinkSync(tmp); } catch (err) {} }
}
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
const firstGiven = (p) => { for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p.given[r][c]) return [r, c]; return null; };
const flipH = (s, k) => s.slice(0, k) + (s[k] === '<' ? '>' : '<') + s.slice(k + 1);
const cases = [
  ['clue contradicts the solution', () => { const b = clone(); const [r, c] = firstGiven(b[0]); b[0].given[r][c] = (b[0].given[r][c] % 9) + 1; return b; }, /not in the solution|exactly one|unsound/i],
  ['a clue removed', () => { const b = clone(); const [r, c] = firstGiven(b[1]); b[1].given[r][c] = 0; return b; }, /printed/],
  ['solution grid broken', () => { const b = clone(); b[2].sol[0][0] = b[2].sol[0][1]; return b; }, /legal sudoku/],
  ['a sign flipped', () => { const b = clone(); b[3].h[4] = flipH(b[3].h[4], 2); return b; }, /disagrees with the solution/],
  ['a sign string malformed', () => { const b = clone(); b[4].v[1] = b[4].v[1].slice(1); return b; }, /malformed/],
  ['stored level wrong', () => { const b = clone(); b[5].level = b[5].level === 1 ? 2 : 1; return b; }, /needs level/],
  ['sunday flag on a weekday', () => { const b = clone(); const i = b.findIndex((p) => !p.sunday); b[i].sunday = true; return b; }, /sunday flag/],
  ['a date skipped', () => { const b = clone(); b[6].live = '2026-12-25'; return b; }, /not consecutive|dateLabel|quizId/],
  ['duplicate solution', () => { const b = clone(); b[8] = { ...JSON.parse(JSON.stringify(b[1])), num: b[8].num, live: b[8].live, dateLabel: b[8].dateLabel, quizId: b[8].quizId, sunday: b[8].sunday }; return b; }, /repeated solution|printed|level/],
  ['a whole box of signs reversed', () => { const b = clone(); const p = b.find((q) => q.printed === 0); for (const k of [0, 1]) p.v[k] = p.v[k].slice(0, 3).split('').map((x) => (x === '^' ? 'v' : '^')).join('') + p.v[k].slice(3); return b; }, /disagrees/],
];
const clean = runOn(clone());
if (clean.failed) { console.error('MUTATION TEST: the UNMODIFIED bank fails\n' + clean.out); process.exit(1); }
console.log('baseline: clean bank passes');
let bad = 0;
for (const [name, mutate, re] of cases) {
  const r = runOn(mutate());
  if (!r.failed) { console.error(`NOT CAUGHT: ${name}`); bad++; continue; }
  if (!re.test(r.out)) { console.error(`CAUGHT FOR THE WRONG REASON: ${name}\n${r.out.split('\n').filter((l) => l.includes('FAIL')).slice(0, 3).join('\n')}`); bad++; continue; }
  console.log(`caught: ${name}`);
}
if (bad) { console.error(`\nMUTATION TEST: ${bad} of ${cases.length} slipped through.`); process.exit(1); }
console.log(`\nMUTATION TEST ok: all ${cases.length} mutations caught.`);
