// gen-series.mjs — the Series problem bank (launched 2026-10-09).
//
// Series is the next-number sibling of Blitz: five or six terms of a sequence,
// 3, 7, 11, 15, 19, ?, and the player picks what comes next. Twenty a day in
// five rounds of four, twenty seconds each, one life.
//
// THE RULE THAT MAKES A SERIES FAIR: the shown terms must point at ONE answer
// among the four options. Five numbers fit infinitely many rules, so "one
// answer" is defined against a fixed library of the rules a person reaches for
// (constant step, constant ratio, a growing step, steps that alternate, two
// series interleaved, each term the sum of the two before, x times p plus q,
// alternating x p and + q, constant second or third differences, steps that
// double). Every library rule that fits the shown terms must either predict
// the answer or predict nothing on the board. The generator throws away any
// line that fails this; scripts/verify-series.mjs re-checks it with its own
// rule code and requires at least one library rule to predict the answer.
//
// The named mistakes: adding the last gap again when the gap is growing,
// carrying on the wrong half of an interleaved pair, doubling when the rule was
// doubling plus one, stopping a step short, the neighbouring square or cube.
//
//   node scripts/gen-series.mjs --force            (whole bank, scratch only)

import { makeRng, makeChooser, buildDays, emitBank, parseArgs } from './mathrun-core.mjs';

const A = parseArgs(process.argv.slice(2), { from: '2026-10-09', days: 78, out: 'app/series', seed: 20261010 });
const { R, ri, pick } = makeRng(A.seed);
const choose = makeChooser();
const F = {};

// Builds a family result from a list of terms: all but the last are shown, the
// last is the answer. Extra named mistakes come in `ds`.
function seq(sig, terms, ds) {
  if (terms.some((t) => !Number.isInteger(t) || t <= 0 || t > 9999)) return null;
  const shown = terms.slice(0, -1);
  const a = terms[terms.length - 1];
  const last = shown[shown.length - 1];
  const gap = last - shown[shown.length - 2];
  const base = [last + gap, a + 1, a - 1, a + 2, a - 2];
  return { sig, shown, a, ds: [...ds, ...base] };
}
const arith = (s, d, n) => Array.from({ length: n }, (_, i) => s + d * i);

// ---- tier 1, Warm-up -----------------------------------------------------------
F.arUp = () => { const s = ri(1, 20), d = ri(2, 9); const t = arith(s, d, 6); return seq('ar', t, [t[5] + d, t[5] - d + 1]); };
F.arDown = () => { const d = ri(2, 9), e = ri(1, 20); const s = e + 5 * d; const t = arith(s, -d, 6); return seq('down', t, [t[5] - d, t[5] + 1]); };
F.dbl = () => { const s = ri(1, 25), o = 0; const t = Array.from({ length: 6 }, (_, i) => s * 2 ** (i + o)); if (t[5] > 9999) return null; return seq('geo', t, [t[4] + (t[4] - t[3]), t[5] + 2, t[5] - 4]); };
F.sq = () => { const s = ri(1, 12); const t = Array.from({ length: 6 }, (_, i) => (s + i) ** 2); return seq('sq', t, [(s + 6) ** 2, t[4] + (t[4] - t[3])]); };
F.big = () => { const d = pick([25, 50, 100, 250]), s = d * ri(1, 6) + pick([0, 0, 5, 10, 15, 20]); const t = arith(s, d, 6); return seq('big', t, [t[5] + d, t[5] - 10, t[5] + 10]); };
F.arTens = () => { const s = ri(2, 30), d = pick([10, 11, 12, 15, 20, 25]); const t = arith(s, d, 6); return seq('step', t, [t[5] + 10, t[5] - 10]); };

// ---- tier 2, Steady --------------------------------------------------------------
F.grow = () => { const s = ri(1, 40), d0 = ri(1, 9); const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] + d0 + i); return seq('grow', t, [t[4] + (t[4] - t[3]) + 2]); };
F.alt = () => { const p = ri(5, 12), q = ri(2, p - 2), s = ri(3, 20); const t = [s]; for (let i = 0; i < 6; i++) t.push(t[i] + (i % 2 === 0 ? p : -q)); return seq('alt', t, [t[5] - q, t[5] + p - q, t[5] + q]); };
F.tri = () => { const s = ri(1, 40), o = ri(0, 2); const t = Array.from({ length: 6 }, (_, i) => s * 3 ** (i + o)); if (t[5] > 9999) return null; return seq('geo', t, [t[4] * 2, t[4] + 2 * (t[4] - t[3])]); };
F.halve = () => { const r = pick([2, 2, 3]), e = ri(3, 60); const t = Array.from({ length: 6 }, (_, i) => e * r ** (5 - i)); if (t[0] > 9999) return null; return seq('halve', t, [t[4] - 10, e + Math.round(e / 2)]); };
F.arDown2 = () => { const d = ri(11, 19), e = ri(3, 30); const t = arith(e + 5 * d, -d, 6); return seq('down', t, [t[5] - 10, t[5] + 10]); };

// ---- tier 3, Quick ---------------------------------------------------------------
F.sqPlus = () => { const s = ri(2, 12), k = ri(1, 12); const t = Array.from({ length: 6 }, (_, i) => (s + i) ** 2 + k); return seq('sq', t, [t[5] - k + 1, t[4] + (t[4] - t[3])]); };
F.fib = () => { const a = ri(1, 12), b = ri(1, 15); const t = [a, b]; while (t.length < 7) t.push(t[t.length - 1] + t[t.length - 2]); return seq('fib', t, [t[5] * 2, t[6] - 1]); };
F.dblPlus = () => { const s = ri(1, 12), k = pick([1, 1, 2, 3, -1]); const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] * 2 + k); return seq('rec', t, [t[4] * 2, t[4] * 2 + 2 * k]); };
F.grow2 = () => { const s = ri(1, 30), d0 = ri(1, 9), k = ri(2, 3); const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] + d0 + k * i); return seq('grow', t, [t[4] + (t[4] - t[3]) + 1]); };
F.altBig = () => { const p = ri(12, 25), q = ri(4, p - 4), s = ri(5, 30); const t = [s]; for (let i = 0; i < 6; i++) t.push(t[i] + (i % 2 === 0 ? p : -q)); return seq('alt', t, [t[5] - q, t[5] + q]); };

// ---- tier 4, Sharp ------------------------------------------------------------------
F.geoDiff = () => { const s = ri(1, 40), d0 = ri(1, 5), r = pick([2, 2, 3]); const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] + d0 * r ** i); return seq('dgeo', t, [t[4] * 2, t[4] + 3 * (t[4] - t[3])]); };
F.cubes = () => { const s = ri(1, 8), k = ri(-2, 6); const t = Array.from({ length: 6 }, (_, i) => (s + i) ** 3 + k); return seq('cube', t, [(s + 5) ** 2, (s + 6) ** 2, t[5] - 10, t[5] + 10]); };
F.interleave = () => { const a = ri(1, 15), d = ri(2, 6), b = ri(20, 40), e = ri(2, 5);
  const t = []; for (let i = 0; i < 7; i++) t.push(i % 2 === 0 ? a + d * (i / 2) : b - e * ((i - 1) / 2));
  return seq('inter', t, [t[5] - e, t[4] - d + 1]); };
F.triMinus = () => { const p = pick([2, 3]), s = ri(2, 15), k = pick([-5, -4, -3, -2, -1, 4, 5, 6, 7, 8, 9]); if (p === 2 && k > -3 && k < 4) return null;
  const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] * p + k); if (t[5] > 9999) return null; return seq('rec', t, [t[4] * p, t[4] * p + 2 * k, t[5] - k]); };
F.quadr = () => { const r = pick([4, 5, 6]), s = ri(1, 12), o = ri(0, 1); const t = Array.from({ length: 6 }, (_, i) => s * r ** (i + o)); if (t[5] > 9999) return null; return seq('geo', t, [t[4] * 3, t[4] * 2, t[5] - 10]); };

F.sqMinus = () => { const s = ri(8, 20), k = ri(1, 15); const t = Array.from({ length: 6 }, (_, i) => (s + i) ** 2 - k); return seq('sq', t, [t[5] + k, t[4] + (t[4] - t[3])]); };

// ---- tier 5, Flat out ------------------------------------------------------------------
F.quad = () => { const s = ri(2, 40), d0 = ri(2, 9), c = ri(3, 7); const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] + d0 + c * i); return seq('quad', t, [t[4] + (t[4] - t[3]) + 1]); };
F.trib = () => { const a = ri(1, 5), b = ri(1, 5), c = ri(1, 9); const t = [a, b, c]; while (t.length < 8) t.push(t[t.length - 1] + t[t.length - 2] + t[t.length - 3]); return seq('trib', t.slice(1), [t[6] + t[5]]); };
F.sqDiff = () => { const s = ri(1, 40), o = ri(1, 4); const t = [s]; for (let i = 0; i < 5; i++) t.push(t[i] + (o + i) ** 2); return seq('sqdiff', t, [t[4] + (o + 5) ** 2]); };
F.altMul = () => { const s = ri(2, 12), p = pick([2, 3]), q = ri(2, 9); const t = [s]; for (let i = 0; i < 6; i++) t.push(i % 2 === 0 ? t[i] * p : t[i] + q); return seq('altop', t, [t[5] * p, t[5] + 2 * q]); };
F.sqPlusN = () => { const s = ri(2, 20), c = pick([1, 2, 3, 4]); const t = Array.from({ length: 6 }, (_, i) => (s + i) ** 2 + c * (s + i)); return seq('sq', t, [(s + 5) ** 2, t[4] + (t[4] - t[3])]); };

const TIERS = [
  { fams: ['arUp', 'arDown', 'dbl', 'sq', 'arTens', 'big'] },
  { fams: ['grow', 'alt', 'tri', 'halve', 'arDown2'] },
  { fams: ['sqPlus', 'fib', 'dblPlus', 'grow2', 'altBig'] },
  { fams: ['geoDiff', 'cubes', 'interleave', 'triMinus', 'quadr', 'sqMinus'] },
  { fams: ['quad', 'trib', 'sqDiff', 'altMul', 'sqPlusN'] },
];

// ---- the generator's own ambiguity filter --------------------------------------------
// Each rule: returns the predicted next term if it fits every shown term, else
// null. Written separately from scripts/verify-series.mjs on purpose.
const diffs = (t) => t.slice(1).map((v, i) => v - t[i]);
const allEq = (a) => a.every((v) => v === a[0]);
const RULES = [
  (t) => { const d = diffs(t); return allEq(d) ? t.at(-1) + d[0] : null; },
  (t) => { const r = t[1] / t[0]; if (!Number.isInteger(r) && !Number.isInteger(1 / r)) return null;
    for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1] * r) return null; const n = t.at(-1) * r; return Number.isInteger(n) ? n : null; },
  (t) => { const d = diffs(diffs(t)); return d.length >= 2 && allEq(d) ? t.at(-1) + diffs(t).at(-1) + d[0] : null; },
  (t) => { const d1 = diffs(t), d2 = diffs(d1), d3 = diffs(d2); return d3.length >= 2 && allEq(d3) ? t.at(-1) + d1.at(-1) + d2.at(-1) + d3[0] : null; },
  (t) => { const d = diffs(t); if (d.length < 4) return null; for (let i = 2; i < d.length; i++) if (d[i] !== d[i - 2]) return null; return t.at(-1) + d[d.length - 2]; },
  (t) => { if (t.length < 6) return null; const ev = t.filter((_, i) => i % 2 === 0), od = t.filter((_, i) => i % 2 === 1);
    const nx = t.length % 2 === 0 ? ev : od; const ot = t.length % 2 === 0 ? od : ev;
    if (!allEq(diffs(ev)) || !allEq(diffs(od))) return null; void ot; return nx.at(-1) + diffs(nx)[0]; },
  (t) => { for (let i = 2; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2]) return null; return t.at(-1) + t.at(-2); },
  (t) => { if (t.length < 5) return null; for (let i = 3; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2] + t[i - 3]) return null; return t.at(-1) + t.at(-2) + t.at(-3); },
  (t) => { // x * p + q, integer p and q from the first three terms
    const den = t[1] - t[0]; if (den === 0) return null; const p = (t[2] - t[1]) / den; if (!Number.isInteger(p) || p === 1 || p === 0) return null;
    const q = t[1] - p * t[0]; for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1] * p + q) return null; return t.at(-1) * p + q; },
  (t) => { // alternating x p and + q, either phase
    for (const ph of [0, 1]) {
      let p = null, q = null, okay = true;
      for (let i = 1; i < t.length && okay; i++) {
        const mul = (i - 1) % 2 === ph;
        if (mul) { const r = t[i] / t[i - 1]; if (p === null) p = r; if (!Number.isInteger(p) || p < 2 || t[i] !== t[i - 1] * p) okay = false; }
        else { const d = t[i] - t[i - 1]; if (q === null) q = d; if (t[i] !== t[i - 1] + q) okay = false; }
      }
      if (okay && p !== null && q !== null) return ((t.length - 1) % 2 === ph) ? t.at(-1) * p : t.at(-1) + q;
    }
    return null; },
  (t) => { const d = diffs(t); const r = d[1] / d[0]; if (!Number.isInteger(r) || r < 2) return null; for (let i = 1; i < d.length; i++) if (d[i] !== d[i - 1] * r) return null; return t.at(-1) + d.at(-1) * r; },
];
function fair(shown, a, ds) {
  let hit = false;
  const opts = new Set(ds);
  for (const rule of RULES) {
    const p = rule(shown);
    if (p === null) continue;
    if (p === a) hit = true;
    else if (opts.has(p)) return false;
  }
  return hit;
}

const seenQ = new Set();
function makeOne(fam, usedSigs) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const m = F[fam]();
    if (!m) continue;
    if (usedSigs.has(m.sig)) return null;
    const q = `${m.shown.join(', ')}, ?`;   // NO thousands separator: in a comma list it reads as two terms
    if (seenQ.has(q)) continue;
    const ds = choose(m.a, [...m.ds, m.a + 10, m.a - 10, m.a + 3, m.a - 3, m.a + 20, m.a - 20].filter((v) => Number.isInteger(v)));
    if (!ds) continue;
    if (!fair(m.shown, m.a, ds)) continue;
    seenQ.add(q);
    return { q, a: m.a, ds, fam, sig: m.sig };
  }
  return null;
}

const { problems, puzzles } = buildDays({ key: 'series', prefix: 's', R, tiers: TIERS, makeOne, from: A.from, days: A.days, startNum: A.startNum });

const head = `// Problem bank for Series, the daily next-number ladder (launched 2026-10-09).
// Imported ONLY by the server page (app/series/page.js) and the Math Gauntlet
// run page, which resolve the picked day's twenty and ship just that day.
//
//   id       's<day>p<slot>' — authored day and play order (slot 1..20)
//   tier     1 (warm-up) .. 5 (flat out); four per tier, each with a different sig
//   fam      the generator family; sig the kind of rule, taken once a round
//   q        five or six terms then ?, no thousands separators
//   choices  four numbers, exactly one the next term
//
// FAIRNESS: every rule in a fixed library that fits the shown terms predicts
// the answer or predicts nothing on the board, and at least one predicts the
// answer. scripts/verify-series.mjs re-checks this with its own rule code.
// Distractors are named mistakes, then Blitzed's anti-sieve rules.
//
// Generated by scripts/gen-series.mjs. Extend with a dated range and a splice,
// never a rebuild.
`;
const phead = `// Puzzle data for Series, the daily next-number ladder. Each day lists twenty
// problem ids from problems.js in play order: five rounds of four. No Sunday
// Edition, matching Blitz and Blitzed, so there is no sunday field at all.
`;
emitBank({ outDir: A.out, force: A.force, head, phead, problems, puzzles });
console.log(`series: ${problems.length} problems over ${puzzles.length} days, ${puzzles[0].live} to ${puzzles.at(-1).live}`);
