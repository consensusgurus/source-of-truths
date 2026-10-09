// verify-gap.mjs — the checker for app/gap (launched 2026-10-09).
//
// Recomputes, it does not trust. For every problem it substitutes ALL FOUR
// options into the printed equation with its own parser (scripts/
// mathrun-check-lib.mjs, which shares no code with scripts/gen-gap.mjs) and
// requires exactly one to make the two sides equal, and that one to be the
// option marked correct. Then the structural rules (twenty a day, four a
// round, a different operation in each slot of a round, five answers in each
// column and never three running, contiguous dates) and Blitzed's anti-sieve
// rules on the option values.
//
//   node scripts/verify-gap.mjs

import { loadBank, tokenize, evaluate, fracEq, sieveFindings, structural, report } from './mathrun-check-lib.mjs';

const { PROBLEMS, PROBLEM_MAP, PUZZLES } = await loadBank('app/gap');
const fails = structural({ key: 'gap', prefix: 'g', PROBLEMS, PROBLEM_MAP, PUZZLES, firstLive: '2026-10-09' });
const seenQ = new Map();
for (const p of PROBLEMS) {
  const toks = tokenize(p.q);
  if (toks.filter((t) => t.t === 'gap').length !== 1) { fails.push(`${p.id}: needs exactly one ?`); continue; }
  const eq = toks.findIndex((t) => t.v === '=');
  if (eq < 0 || toks.filter((t) => t.v === '=').length !== 1) { fails.push(`${p.id}: needs exactly one =`); continue; }
  const L = toks.slice(0, eq), Rt = toks.slice(eq + 1);
  if (seenQ.has(p.q)) fails.push(`${p.id}: same line as ${seenQ.get(p.q)}`);
  seenQ.set(p.q, p.id);
  if (!p.choices.every((c) => Number.isInteger(c) && c > 0)) { fails.push(`${p.id}: options must be positive whole numbers`); continue; }
  const holds = p.choices.map((c) => {
    const a = evaluate(L, { gapValue: c, strict: false });
    const b = evaluate(Rt, { gapValue: c, strict: false });
    return fracEq(a, b);
  });
  const n = holds.filter(Boolean).length;
  if (n !== 1) fails.push(`${p.id}: ${n} options make "${p.q}" true`);
  else if (!holds[p.correct]) fails.push(`${p.id}: the option that makes "${p.q}" true is not the one marked correct`);
  // the marked answer must also be a clean solve: every step whole
  const strictL = evaluate(L, { gapValue: p.choices[p.correct] });
  const strictR = evaluate(Rt, { gapValue: p.choices[p.correct] });
  if (!fracEq(strictL, strictR)) fails.push(`${p.id}: the answer needs a fraction somewhere along the line`);
  fails.push(...sieveFindings(p.id, p.choices[p.correct], p.choices));
}
report('gap', fails, ` — ${PROBLEMS.length} problems over ${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES.at(-1).live}`);
