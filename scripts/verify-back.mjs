// verify-back.mjs — the checker for app/back (launched 2026-10-09).
//
// Recomputes, it does not trust. Every option is evaluated with its own parser
// (scripts/mathrun-check-lib.mjs, which shares no code with scripts/
// gen-back.mjs), every step whole: a division exact, a root of a square, a
// percentage of a whole number. Exactly one option must equal the target, and
// it must be the one marked correct. The four options must share ONE shape
// (the same operators in the same order), so the answer is never spotted by
// its length. Then Blitzed's anti-sieve rules on the four VALUES, the
// structural rules every bank owes, and a count of the trap lines (a misread
// that makes the target), which the generator prefers wherever a shape has one.
//
//   node scripts/verify-back.mjs

import { loadBank, evalStr, shapeOf, fracNum, sieveFindings, structural, report } from './mathrun-check-lib.mjs';

const { PROBLEMS, PROBLEM_MAP, PUZZLES } = await loadBank('app/back');
const fails = structural({ key: 'back', prefix: 'b', PROBLEMS, PROBLEM_MAP, PUZZLES, firstLive: '2026-10-09' });
const seen = new Map();
let traps = 0;
// The left-to-right reading of a line, brackets and powers ignored: the
// commonest way to get a two-operation line wrong.
function ltr(s) {
  const nums = String(s).replace(/[()]/g, '').split(/[^0-9]+/).filter(Boolean).map(Number);
  const ops = String(s).replace(/[()]/g, '').match(/[+−×÷]/g) || [];
  if (/[²³√%]/.test(s) || nums.length !== ops.length + 1) return null;
  let v = nums[0];
  ops.forEach((o, i) => { const b = nums[i + 1]; v = o === '+' ? v + b : o === '−' ? v - b : o === '×' ? v * b : v / b; });
  return v;
}
for (const p of PROBLEMS) {
  const m = /^\? = (\d+)$/.exec(p.q);
  if (!m) { fails.push(`${p.id}: q should read "? = <number>"`); continue; }
  const T = Number(m[1]);
  if (!p.choices.every((c) => typeof c === 'string')) { fails.push(`${p.id}: options must be lines`); continue; }
  const vals = p.choices.map((c) => fracNum(evalStr(c)));
  if (vals.some((v) => !Number.isInteger(v) || v <= 0)) { fails.push(`${p.id}: an option is not a whole positive number every step of the way (${p.choices.join(' | ')})`); continue; }
  const hits = vals.filter((v) => v === T).length;
  if (hits !== 1) fails.push(`${p.id}: ${hits} options make ${T}`);
  else if (vals[p.correct] !== T) fails.push(`${p.id}: the option that makes ${T} is not the one marked correct`);
  const shapes = new Set(p.choices.map(shapeOf));
  if (shapes.size !== 1) fails.push(`${p.id}: options do not share one shape (${[...shapes].join(' | ')})`);
  const k = p.choices[p.correct];
  if (seen.has(k)) fails.push(`${p.id}: the same answer line as ${seen.get(k)}`);
  seen.set(k, p.id);
  if (p.choices.some((c, i) => i !== p.correct && ltr(c) === T)) traps++;
  fails.push(...sieveFindings(p.id, T, vals));
}
report('back', fails, ` — ${PROBLEMS.length} problems over ${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES.at(-1).live}, ${traps} with a left-to-right trap`);
