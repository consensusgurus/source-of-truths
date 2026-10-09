// mathrun-core.mjs — the shared engine behind the three Math Gauntlet banks
// (Gap, Series and Back, launched 2026-10-09).
//
// All three are Blitz-family dailies: twenty four-choice problems a day in five
// rounds of four, one life, a twenty-second clock. They keep Blitzed's bank
// shape exactly (problems.js with PROBLEMS and PROBLEM_MAP, puzzles.js with one
// day per entry listing twenty ids in play order), so the game page, the run
// page and every shared daily consumer read them with no new code.
//
// What lives here is only the machinery the three generators share: the PRNG,
// the anti-sieve choice picker, the balanced answer-position bag, the calendar,
// the day loop and the file writer. Each generator owns its own families.
// The verifiers (scripts/verify-gap.mjs, verify-series.mjs, verify-back.mjs)
// import NOTHING from here or from the generators, per the authoring standard:
// a checker that shares the generator's code can agree with it while both are
// wrong.

import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export function parseArgs(argv, dflt) {
  const arg = (name, d) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] != null ? argv[i + 1] : d;
  };
  return {
    from: arg('from', dflt.from),
    days: Number(arg('days', dflt.days)),
    startNum: Number(arg('startnum', 1)),
    out: arg('out', dflt.out),
    seed: Number(arg('seed', dflt.seed)),
    force: argv.includes('--force'),
  };
}

// mulberry32, as in every other bank generator here.
export function makeRng(seed) {
  let a = seed >>> 0;
  const R = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  };
  return { R, ri, pick, shuffle };
}

// THE ANTI-SIEVE RULES, Blitzed's own, re-checked by every verifier:
//   tight  at least 2 distractors within 0.6x-1.4x of the answer (or within
//          +/-max(4, half) under 30)
//   sane   nothing outside 0.25x-4x of the answer, every value a positive integer
//   digit  for answers of 100 or more, at least one distractor ends in the same digit
export const DIGIT_RULE_FROM = 100;
export const isTight = (a, v) => (a < 30
  ? Math.abs(v - a) <= Math.max(4, Math.round(a * 0.5))
  : v >= a * 0.6 && v <= a * 1.4);
export const isSane = (a, v) => Number.isInteger(v) && v > 0 && v >= a * 0.25 && v <= a * 4;

function* triples(n) {
  const idx = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) idx.push([i, j, k]);
  idx.sort((p, q) => (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]));
  yield* idx;
}

// Picks three distractors from candidates listed IN PREFERENCE ORDER (each one a
// named mistake), honouring the three rules, and balancing where the answer
// sits once the four values are sorted (so "pick the middle one" never pays).
// `val` maps a candidate to its numeric value (identity for a number; Back's
// candidates are expressions carrying their value).
export function makeChooser() {
  const rankUsed = [0, 0, 0, 0];
  return function buildChoices(a, cands, val = (x) => x, key = (x) => String(x)) {
    const seen = new Set([String(a)]);
    const seenVal = new Set([a]);
    const pool = [];
    for (const d of cands) {
      const v = val(d);
      if (!isSane(a, v) || v === a) continue;
      const k = key(d);
      if (seen.has(k)) continue;
      if (seenVal.has(v)) continue;   // distinct values, so no two options are the same answer
      seen.add(k); seenVal.add(v);
      pool.push(d);
    }
    if (pool.length < 3) return null;
    let best = null, bestKey = null, pref = 0;
    for (const [i, j, k] of triples(pool.length)) {
      pref++;
      const trio = [pool[i], pool[j], pool[k]];
      const vs = trio.map(val);
      if (vs.filter((v) => isTight(a, v)).length < 2) continue;
      if (a >= DIGIT_RULE_FROM && !vs.some((v) => v % 10 === a % 10)) continue;
      const rank = [a, ...vs].sort((x, y) => x - y).indexOf(a);
      const score = rankUsed[rank] * 10000 + pref;
      if (bestKey === null || score < bestKey) { bestKey = score; best = { trio, rank }; }
    }
    if (!best) return null;
    rankUsed[best.rank]++;
    return best.trio;
  };
}

// Twenty answer positions, five of each, never three alike in a row.
export function positionsFor(R, total) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const bag = [];
    for (let k = 0; k < 4; k++) for (let j = 0; j < total / 4; j++) bag.push(k);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    let ok = true;
    for (let i = 2; i < bag.length; i++) if (bag[i] === bag[i - 1] && bag[i] === bag[i - 2]) { ok = false; break; }
    if (ok) return bag;
  }
  throw new Error('no balanced position sequence');
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function dayInfo(key, from, i) {
  const [yy, mm, dd0] = from.split('-').map(Number);
  const d = new Date(Date.UTC(yy, mm - 1, dd0 + i));
  return {
    live: d.toISOString().slice(0, 10),
    dateLabel: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
    quizId: `${key}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`,
  };
}

// The day loop. `tiers` is [{ fams: [...] }] five long; `makeOne(fam, usedSigs)`
// returns { q, a, ds, fam, sig, id? } with ds already the three chosen
// distractors, or null. `prefix` is the id letter.
export function buildDays({ key, prefix, R, tiers, makeOne, from, days, startNum, perTier = 4 }) {
  const total = tiers.length * perTier;
  const problems = [];
  const puzzles = [];
  for (let step = 0; step < days; step++) {
    const day = startNum + step;
    const dd = String(day).padStart(2, '0');
    const pos = positionsFor(R, total);
    const qids = [];
    let slot = 0;
    for (let t = 0; t < tiers.length; t++) {
      const usedSigs = new Set();
      let used = 0;
      let guard = 0;
      while (used < perTier) {
        if (++guard > 2000) throw new Error(`${key}: tier ${t + 1} could not fill day ${day}`);
        const bag = tiers[t].fams;
        const fam = bag[Math.floor(R() * bag.length)];
        const made = makeOne(fam, usedSigs);
        if (!made) continue;
        usedSigs.add(made.sig);
        const k = pos[slot];
        const choices = [...made.ds];
        choices.splice(k, 0, made.a);
        const id = `${prefix}${dd}p${String(slot + 1).padStart(2, '0')}`;
        problems.push({ id, tier: t + 1, fam: made.fam, sig: made.sig, q: made.q, choices, correct: k });
        qids.push(id);
        used++; slot++;
      }
    }
    puzzles.push({ num: day, ...dayInfo(key, from, step), qids });
  }
  return { problems, puzzles };
}

const lit = (c) => (typeof c === 'number' ? String(c) : `'${String(c).replace(/'/g, "\\'")}'`);

export function emitBank({ outDir, force, head, phead, problems, puzzles }) {
  const pPath = resolve(outDir, 'problems.js');
  const zPath = resolve(outDir, 'puzzles.js');
  for (const p of [pPath, zPath]) {
    if (!force && existsSync(p)) throw new Error(`${p} already exists. Extend a live bank with a range and a splice, never a rebuild. Pass --force only for scratch.`);
  }
  const body = problems.map((p) =>
    `  { id: '${p.id}', tier: ${p.tier}, fam: '${p.fam}', sig: '${p.sig}', q: ${lit(p.q)}, choices: [${p.choices.map(lit).join(', ')}], correct: ${p.correct} },`
  ).join('\n');
  writeFileSync(pPath, `${head}export const PROBLEMS = [\n${body}\n];\n\nexport const PROBLEM_MAP = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));\n`);
  const pbody = puzzles.map((p) => `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    qids: [${p.qids.map((q) => `'${q}'`).join(', ')}],
  },`).join('\n');
  writeFileSync(zPath, `${phead}export const PUZZLES = [\n${pbody}\n];\n`);
  void dirname;
}
