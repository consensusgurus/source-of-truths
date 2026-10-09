// verify-series.mjs — the checker for app/series (launched 2026-10-09).
//
// THE FAIRNESS PROOF. Five or six numbers fit infinitely many rules, so "one
// answer" is defined against a fixed library of the rules a person reaches
// for, written here from scratch (scripts/gen-series.mjs has its own copy and
// this file imports nothing from it):
//
//   constant step · constant ratio (whole or a whole fraction) · constant
//   second difference · constant third difference (only with five or more
//   differences to test it on) · steps that alternate · two series interleaved
//   (only with six or more terms) · each term the sum of the two before ·
//   the sum of the three before · x times p plus q · alternating times p and
//   plus q · steps that grow by a constant ratio
//
// For every problem: at least one library rule must fit the shown terms and
// predict the marked answer, and NO fitting rule may predict a different
// option on the board. Then the structural rules and Blitzed's anti-sieve rules.
//
//   node scripts/verify-series.mjs

import { loadBank, sieveFindings, structural, report } from './mathrun-check-lib.mjs';

const { PROBLEMS, PROBLEM_MAP, PUZZLES } = await loadBank('app/series');
const fails = structural({ key: 'series', prefix: 's', PROBLEMS, PROBLEM_MAP, PUZZLES, firstLive: '2026-10-09' });

const step = (xs) => xs.slice(1).map((x, i) => x - xs[i]);
const same = (xs) => xs.length > 0 && xs.every((x) => x === xs[0]);
const LIB = {
  constant_step(t) { const d = step(t); return same(d) ? t[t.length - 1] + d[0] : null; },
  constant_ratio(t) {
    if (t.some((x) => x === 0)) return null;
    for (let i = 2; i < t.length; i++) if (t[i] * t[i - 2] !== t[i - 1] * t[i - 1]) return null;
    const nx = (t[t.length - 1] * t[1]) / t[0];
    return Number.isInteger(nx) ? nx : null;
  },
  second_difference(t) { const d2 = step(step(t)); return d2.length >= 2 && same(d2) ? t[t.length - 1] + step(t).at(-1) + d2[0] : null; },
  third_difference(t) { const d1 = step(t), d2 = step(d1), d3 = step(d2); return d3.length >= 2 && same(d3) ? t.at(-1) + d1.at(-1) + d2.at(-1) + d3[0] : null; },
  alternating_steps(t) { const d = step(t); if (d.length < 4 || d[0] === d[1]) return null; for (let i = 2; i < d.length; i++) if (d[i] !== d[i - 2]) return null; return t.at(-1) + d[d.length - 2]; },
  interleaved(t) {
    if (t.length < 6) return null;
    const a = t.filter((_, i) => i % 2 === 0), b = t.filter((_, i) => i % 2 === 1);
    if (!same(step(a)) || !same(step(b))) return null;
    const nxt = t.length % 2 === 0 ? a : b;
    return nxt.at(-1) + step(nxt)[0];
  },
  sum_of_two(t) { for (let i = 2; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2]) return null; return t.at(-1) + t.at(-2); },
  sum_of_three(t) { if (t.length < 5) return null; for (let i = 3; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2] + t[i - 3]) return null; return t.at(-1) + t.at(-2) + t.at(-3); },
  times_p_plus_q(t) {
    // solve p and q from the first three terms, then test the rest
    if (t[1] === t[0]) return null;
    const p = (t[2] - t[1]) / (t[1] - t[0]);
    if (!Number.isInteger(p) || p < 2) return null;
    const q = t[1] - p * t[0];
    for (let i = 1; i < t.length; i++) if (t[i] !== p * t[i - 1] + q) return null;
    return p * t.at(-1) + q;
  },
  alternating_times_plus(t) {
    for (const start of ['times', 'plus']) {
      let p = null, q = null, ok = true;
      for (let i = 1; i < t.length; i++) {
        const isTimes = (i % 2 === 1) === (start === 'times');
        if (isTimes) {
          if (t[i - 1] === 0 || t[i] % t[i - 1] !== 0) { ok = false; break; }
          const r = t[i] / t[i - 1];
          if (r < 2 || (p !== null && r !== p)) { ok = false; break; }
          p = r;
        } else {
          const d = t[i] - t[i - 1];
          if (q !== null && d !== q) { ok = false; break; }
          q = d;
        }
      }
      if (ok && p !== null && q !== null) {
        const nextTimes = (t.length % 2 === 1) === (start === 'times');
        return nextTimes ? t.at(-1) * p : t.at(-1) + q;
      }
    }
    return null;
  },
  growing_steps_by_ratio(t) {
    const d = step(t);
    if (d.some((x) => x === 0)) return null;
    for (let i = 2; i < d.length; i++) if (d[i] * d[i - 2] !== d[i - 1] * d[i - 1]) return null;
    const r = d[1] / d[0];
    if (!Number.isInteger(r) || r < 2) return null;
    return t.at(-1) + d.at(-1) * r;
  },
};

const seenQ = new Map();
const used = {};
for (const p of PROBLEMS) {
  const m = /^((?:\d+, )+)\?$/.exec(p.q);
  if (!m) { fails.push(`${p.id}: q should be terms then ?, no thousands separators (got "${p.q}")`); continue; }
  const t = m[1].split(', ').filter(Boolean).map(Number);
  if (t.length < 5 || t.length > 6) fails.push(`${p.id}: shows ${t.length} terms, expected five or six`);
  if (seenQ.has(p.q)) fails.push(`${p.id}: same series as ${seenQ.get(p.q)}`);
  seenQ.set(p.q, p.id);
  if (!p.choices.every((c) => Number.isInteger(c) && c > 0)) { fails.push(`${p.id}: options must be positive whole numbers`); continue; }
  const ans = p.choices[p.correct];
  let named = false;
  for (const [name, rule] of Object.entries(LIB)) {
    const pr = rule(t);
    if (pr === null) continue;
    if (pr === ans) { named = true; used[name] = (used[name] || 0) + 1; }
    else if (p.choices.includes(pr)) fails.push(`${p.id}: "${p.q}" also fits ${name.replace(/_/g, ' ')}, which predicts ${pr}, an option on the board`);
  }
  if (!named) fails.push(`${p.id}: no library rule predicts the marked answer ${ans} from "${p.q}"`);
  fails.push(...sieveFindings(p.id, ans, p.choices));
}
report('series', fails, ` — ${PROBLEMS.length} problems over ${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES.at(-1).live}; rules: ${Object.entries(used).map(([k, v]) => `${k} ${v}`).join(', ')}`);
