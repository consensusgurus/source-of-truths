// mathrun-check-lib.mjs — the checks the three Math Gauntlet verifiers share
// (scripts/verify-gap.mjs, verify-series.mjs, verify-back.mjs).
//
// It imports NOTHING from scripts/mathrun-core.mjs or the generators: the
// structural rules, the anti-sieve rules and the expression parser are written
// again here from the documented rules, so a generator bug cannot be agreed
// with. It is not named verify-*.mjs on purpose, so scripts/verify-all.mjs does
// not run it as a checker of its own.

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function loadBank(dir) {
  const { PROBLEMS, PROBLEM_MAP } = await import(pathToFileURL(resolve(dir, 'problems.js')).href);
  const { PUZZLES } = await import(pathToFileURL(resolve(dir, 'puzzles.js')).href);
  return { PROBLEMS, PROBLEM_MAP, PUZZLES };
}

// ---- exact arithmetic on fractions -------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const add = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
const sub = (x, y) => fr(x.n * y.d - y.n * x.d, x.d * y.d);
const mul = (x, y) => fr(x.n * y.n, x.d * y.d);
const div = (x, y) => (y.n === 0 ? null : fr(x.n * y.d, x.d * y.n));
const isInt = (x) => x && x.d === 1;

// Tokens: numbers (thousands commas allowed), + − × ÷ ( ) ² ³ √ % of ?
export function tokenize(src) {
  const out = [];
  let i = 0;
  const s = String(src);
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ') { i++; continue; }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9,]/.test(s[j])) {
        if (s[j] === ',' && !/[0-9]{3}/.test(s.slice(j + 1, j + 4))) break;
        j++;
      }
      out.push({ t: 'num', v: Number(s.slice(i, j).replace(/,/g, '')) });
      i = j; continue;
    }
    if (s.startsWith('of', i)) { out.push({ t: 'op', v: 'of' }); i += 2; continue; }
    if ('+−×÷()%√?=²³'.includes(ch)) { out.push({ t: ch === '?' ? 'gap' : 'op', v: ch }); i++; continue; }
    if (ch === '-') { out.push({ t: 'op', v: '−' }); i++; continue; }
    throw new Error(`unexpected character ${JSON.stringify(ch)} in ${JSON.stringify(s)}`);
  }
  return out;
}

// The operator signature of a line: every operator in order, numbers dropped.
export const shapeOf = (src) => tokenize(src).filter((t) => t.t === 'op').map((t) => t.v).join(' ');

// Evaluate with the usual precedence: brackets, then the postfix powers and
// the root, then × ÷ and "% of", then + −. Returns a fraction, or null for an
// illegal step (a division that is not exact when `strict`, a root of a
// non-square, a percentage that is not a whole number when `strict`).
export function evaluate(tokens, { strict = true, gapValue = null } = {}) {
  let p = 0;
  const peek = () => tokens[p];
  const eat = () => tokens[p++];
  let bad = false;
  function atom() {
    const t = eat();
    if (!t) { bad = true; return fr(0); }
    let v;
    if (t.t === 'num') v = fr(t.v);
    else if (t.t === 'gap') { if (gapValue == null) { bad = true; return fr(0); } v = fr(gapValue); }
    else if (t.v === '(') { v = sum(); if (!peek() || peek().v !== ')') bad = true; eat(); }
    else if (t.v === '√') {
      const x = atom();
      if (!isInt(x) || x.n < 0) { bad = true; return fr(0); }
      const r = Math.round(Math.sqrt(x.n));
      if (r * r !== x.n) { bad = true; return fr(0); }
      v = fr(r);
    } else { bad = true; return fr(0); }
    while (peek() && (peek().v === '²' || peek().v === '³' || peek().v === '%')) {
      const o = eat().v;
      if (o === '²') v = mul(v, v);
      else if (o === '³') v = mul(mul(v, v), v);
      else {
        // a% is only legal as "a% of b"
        if (!peek() || peek().v !== 'of') { bad = true; return v; }
        eat();
        const b = atom();
        v = div(mul(v, b), fr(100));
        if (strict && !isInt(v)) bad = true;
      }
    }
    return v;
  }
  function prod() {
    let v = atom();
    while (peek() && (peek().v === '×' || peek().v === '÷')) {
      const o = eat().v;
      const r = atom();
      if (o === '×') v = mul(v, r);
      else { const q = div(v, r); if (!q || (strict && !isInt(q))) { bad = true; return fr(0); } v = q; }
    }
    return v;
  }
  function sum() {
    let v = prod();
    while (peek() && (peek().v === '+' || peek().v === '−')) {
      const o = eat().v;
      const r = prod();
      v = o === '+' ? add(v, r) : sub(v, r);
    }
    return v;
  }
  const v = sum();
  if (p !== tokens.length) bad = true;
  return bad ? null : v;
}
export const evalStr = (s, opts) => evaluate(tokenize(s), opts);
export const fracEq = (a, b) => a && b && a.n === b.n && a.d === b.d;
export const fracNum = (x) => (x ? x.n / x.d : NaN);

// ---- the anti-sieve rules, from the documented text --------------------------
const tight = (a, v) => (a < 30 ? Math.abs(v - a) <= Math.max(4, Math.round(a * 0.5)) : v >= a * 0.6 && v <= a * 1.4);
const sane = (a, v) => Number.isInteger(v) && v > 0 && v >= a * 0.25 && v <= a * 4;
export function sieveFindings(id, a, vals) {
  const out = [];
  const others = vals.filter((v, i) => i !== vals.indexOf(a) || false);
  void others;
  const ds = vals.slice();
  const ai = ds.indexOf(a);
  ds.splice(ai, 1);
  if (ds.length !== 3) out.push(`${id}: expected three distractor values`);
  if (new Set(vals).size !== 4) out.push(`${id}: two options share a value`);
  for (const v of ds) if (!sane(a, v)) out.push(`${id}: distractor ${v} is outside 0.25x-4x of ${a} or not a positive integer`);
  if (ds.filter((v) => tight(a, v)).length < 2) out.push(`${id}: fewer than two distractors near ${a}`);
  if (a >= 100 && !ds.some((v) => v % 10 === a % 10)) out.push(`${id}: no distractor ends in the same digit as ${a}`);
  return out;
}

// ---- the structural checks every bank owes -------------------------------------
export function structural({ key, prefix, PROBLEMS, PROBLEM_MAP, PUZZLES, firstLive }) {
  const fails = [];
  const ids = new Set();
  for (const p of PROBLEMS) {
    if (ids.has(p.id)) fails.push(`duplicate id ${p.id}`);
    ids.add(p.id);
    if (!new RegExp(`^${prefix}\\d{2,}p\\d{2}$`).test(p.id)) fails.push(`${p.id}: bad id`);
    if (!Array.isArray(p.choices) || p.choices.length !== 4) fails.push(`${p.id}: needs four choices`);
    if (!(p.correct >= 0 && p.correct <= 3 && Number.isInteger(p.correct))) fails.push(`${p.id}: bad correct index`);
    if (new Set(p.choices.map(String)).size !== 4) fails.push(`${p.id}: repeated choice`);
    if (!(p.tier >= 1 && p.tier <= 5)) fails.push(`${p.id}: bad tier`);
    if (/—/.test(p.q) || p.choices.some((c) => /—/.test(String(c)))) fails.push(`${p.id}: em dash in a line`);
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const used = new Set();
  let prevLive = null, prevNum = null;
  for (const d of PUZZLES) {
    if ('sunday' in d) fails.push(`${d.quizId}: carries a sunday field; this game has no Sunday Edition`);
    const dt = new Date(d.live + 'T12:00:00Z');
    const want = `${key}-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}-${String(dt.getUTCFullYear()).slice(2)}`;
    if (d.quizId !== want) fails.push(`${d.quizId}: quizId should be ${want}`);
    const label = `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
    if (d.dateLabel !== label) fails.push(`${d.quizId}: dateLabel should be ${label}`);
    if (prevLive) {
      const gap = (Date.parse(d.live) - Date.parse(prevLive)) / 86400000;
      if (gap !== 1) fails.push(`${d.quizId}: not the day after ${prevLive}`);
      if (d.num !== prevNum + 1) fails.push(`${d.quizId}: num ${d.num} does not follow ${prevNum}`);
    } else if (firstLive && d.live !== firstLive) fails.push(`first day is ${d.live}, expected ${firstLive}`);
    prevLive = d.live; prevNum = d.num;
    if (!Array.isArray(d.qids) || d.qids.length !== 20) { fails.push(`${d.quizId}: needs twenty problems`); continue; }
    const pos = [0, 0, 0, 0];
    let run = 0, last = -1;
    const sigs = {};
    d.qids.forEach((qid, i) => {
      const p = PROBLEM_MAP[qid];
      if (!p) { fails.push(`${d.quizId}: unknown problem ${qid}`); return; }
      if (used.has(qid)) fails.push(`${qid}: used on two days`);
      used.add(qid);
      const wantTier = Math.floor(i / 4) + 1;
      if (p.tier !== wantTier) fails.push(`${qid}: slot ${i + 1} should be tier ${wantTier}`);
      const sk = `${p.tier}:${p.sig}`;
      if (sigs[sk]) fails.push(`${qid}: round ${p.tier} takes sig ${p.sig} twice`);
      sigs[sk] = 1;
      pos[p.correct]++;
      run = p.correct === last ? run + 1 : 1;
      last = p.correct;
      if (run >= 3) fails.push(`${d.quizId}: the answer sits in column ${p.correct + 1} three times running at slot ${i + 1}`);
    });
    if (pos.some((n) => n !== 5)) fails.push(`${d.quizId}: answer columns ${pos.join('/')} are not five each`);
  }
  for (const p of PROBLEMS) if (!used.has(p.id)) fails.push(`${p.id}: in the bank but on no day`);
  return fails;
}

export function report(name, fails, extra = '') {
  for (const f of fails.slice(0, 60)) console.log(`FAIL  ${f}`);
  if (fails.length > 60) console.log(`... and ${fails.length - 60} more`);
  console.log(fails.length ? `\n${name}: ${fails.length} failure(s).` : `${name}: OK${extra}`);
  process.exit(fails.length ? 1 : 0);
}
