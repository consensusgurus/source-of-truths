#!/usr/bin/env node
// Build the Docket bank. Deterministic: same seed, byte-identical puzzles.js.
//
//   node scripts/gen-docket.mjs [days] [--seed N] [--start YYYY-MM-DD]
//
// HOW A DAY IS BUILT. Sample a constraint set for the weekday's archetype and
// size, enumerate every arrangement it allows, and keep the sample only if the
// count lands in that shape's window AND the measured difficulty lands in the
// weekday's band. Then mint five questions FROM the enumeration, so no answer is
// ever asserted, only counted. A day that cannot fill all five is thrown away
// whole rather than shipped with a weak question.
//
// The generator chooses; scripts/verify-docket.mjs proves, using its own
// independent solver. Neither trusts the other, and the bank stores no key.
//
// DIFFICULTY is measured, not guessed: `free` counts how many of a day's
// assignments actually vary across the valid arrangements (how much is still
// open after you diagram the rules) and `bits` is log2 of the arrangement count.
// It is a proxy for diagramming load, not a claim about how hard anyone finds
// it, and it exists so the week ramps instead of wandering.

import { writeFileSync, readFileSync } from 'node:fs';
import { solutions, solveQuestion, renderSetup, renderRules, renderChoices, enPred, testPred, showSolution, brokenRules, combos, WORD, ORD, series } from '../app/docket/engine.js';
import { THEMES, letterRun } from './docket-themes.mjs';

// ─────────────────────────── deterministic rng ───────────────────────────────
let SEED = 20260810;
function rng() { SEED |= 0; SEED = (SEED + 0x6D2B79F5) | 0; let t = Math.imul(SEED ^ (SEED >>> 15), 1 | SEED); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const ri = (n) => Math.floor(rng() * n);
const pick = (a) => a[ri(a.length)];
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickN = (a, n) => shuffle(a).slice(0, n);
const eqP = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ─────────────────────────── shape table ─────────────────────────────────────
// weekday -> archetype, size, arrangement-count window, difficulty band.
// Monday is the gentlest board of the week and Sunday the hardest; the bands
// were fitted to what the samplers actually produce, then held.
const SHAPES = {
  1: { k: 'seq',   n: 6,            win: [6, 30],  diff: [25, 30] },  // Mon
  2: { k: 'sel',   n: 6, pick: 3,   win: [4, 11],  diff: [22, 26] },  // Tue
  3: { k: 'match', n: 5, m: 3,      win: [6, 30],  diff: [24, 30] },  // Wed
  4: { k: 'seq',   n: 7,            win: [8, 44],  diff: [33, 39] },  // Thu
  5: { k: 'sel',   n: 7, pick: 4,   win: [5, 13],  diff: [27, 31] },  // Fri (alternates with match)
  6: { k: 'hyb',   n: 6,            win: [8, 50],  diff: [37, 41] },  // Sat
  0: { k: 'hyb',   n: 7,            win: [16, 80], diff: [38, 44] },  // Sun — the stacked board
};
// THE RAMP, and what is actually being claimed. `diff` (see measure()) is a proxy
// for diagramming load and it is only comparable WITHIN an archetype, because the
// terms scale with the number of dimensions a shape has. So the week ramps on
// three claims the verifier can prove rather than one it would have to fudge:
//
//   1. every day sits inside its weekday band (bands fitted to the measured
//      achievable range of each shape, sampled 1500 deep per shape)
//   2. within each archetype the later weekday's band is strictly ABOVE the
//      earlier one, with no overlap: seq Mon 25-30 < Thu 33-39, sel Tue 22-26 <
//      Fri 27-31, match Wed 24-30 < Fri 31-37
//   3. the Sunday Edition scales STRUCTURALLY, not by score: 7 entities over 7
//      slots plus the attribute, so 14 open cells against a Saturday's 12, and
//      one extra condition. The hybrid bands overlap and pretending otherwise
//      would be the kind of fitted number that means nothing.
export const SHAPE_BANDS = Object.fromEntries(Object.entries(SHAPES).map(([d, s]) => [d, s.diff]));
const FRI_ALT = { k: 'match', n: 6, m: 3, win: [8, 40], diff: [31, 37] };

// ─────────────────────────── constraint samplers ─────────────────────────────
function sampleSeq(n, hard) {
  const E = Array.from({ length: n }, (_, i) => i);
  const cons = [];
  // a spine of 2-3 orderings, which is what makes a sequencing game deducible
  const spine = pickN(E, 3 + (hard ? 1 : 0));
  for (let i = 0; i + 1 < spine.length; i++) cons.push(['bef', spine[i], spine[i + 1]]);
  const rest = E.filter((e) => !spine.includes(e));
  // one block or spacing rule
  if (rest.length >= 2) {
    const [a, b] = pickN(rest, 2);
    cons.push(pick([['imm', a, b], ['adj', a, b], ['gap', a, b, 1 + ri(2)], ['nadj', a, b]]));
  }
  // one anchor
  const anchor = pick(E);
  cons.push(pick([['ends', anchor], ['nat', anchor, 1 + ri(n)], ['at', anchor, 1 + ri(n)]]));
  // harder days get a conditional, the rule that forces case-splitting
  if (hard) {
    const [a, b, c, d] = pickN(E, 4);
    cons.push(pick([['cbef', a, b, c, d], ['cat', a, 1 + ri(n), c, 1 + ri(n)], ['bef2', a, b, c], ['aft2', a, b, c]]));
  }
  return cons;
}

function sampleSel(n, hard) {
  const E = Array.from({ length: n }, (_, i) => i);
  const cons = [];
  const kinds = ['imp', 'impn', 'onlyif', 'nboth', 'atl1', 'xor1', 'iff', 'nimp'];
  const used = new Set();
  const want = hard ? 5 : 4;
  let guard = 0;
  while (cons.length < want && guard++ < 200) {
    const [a, b] = pickN(E, 2);
    const t = pick(kinds);
    const key = `${t}:${Math.min(a, b)}:${Math.max(a, b)}`;
    if (used.has(key)) continue;
    used.add(key);
    cons.push([t, a, b]);
  }
  if (rng() < 0.45) cons.unshift(pick([['in', pick(E)], ['out', pick(E)]]));
  return cons;
}

function sampleMatch(n, m, hard) {
  const E = Array.from({ length: n }, (_, i) => i);
  const G = Array.from({ length: m }, (_, i) => i);
  const cons = [];
  // a size rule keeps the space from collapsing to noise
  cons.push(pick([['gsize', pick(G), 1 + ri(2)], ['gmin', pick(G), 1 + ri(2)], ['gmax', pick(G), 1 + ri(2)]]));
  const [a, b] = pickN(E, 2);
  cons.push(pick([['same', a, b], ['diff', a, b]]));
  const [c, d] = pickN(E, 2);
  cons.push(pick([['to', c, pick(G)], ['nto', c, pick(G)], ['diff', c, d]]));
  cons.push(['cto', pick(E), pick(G), pick(E), pick(G)]);
  if (hard) {
    const [e, f] = pickN(E, 2);
    cons.push(pick([['nto', e, pick(G)], ['same', e, f], ['gmax', pick(G), 1 + ri(2)]]));
  }
  return cons;
}

function sampleHyb(n, hard) {
  const E = Array.from({ length: n }, (_, i) => i);
  const cons = [];
  const spine = pickN(E, 3);
  for (let i = 0; i + 1 < spine.length; i++) cons.push(['bef', spine[i], spine[i + 1]]);
  const rest = E.filter((e) => !spine.includes(e));
  if (rest.length >= 2) { const [a, b] = pickN(rest, 2); cons.push(pick([['imm', a, b], ['adj', a, b], ['nadj', a, b]])); }
  // avc is MANDATORY: it is what bounds the attribute space, so the engine can
  // enumerate a hybrid at all
  cons.push(['avc', 0, n === 7 ? 3 + ri(2) : 3]);
  // the second dimension
  cons.push(pick([['av', pick(E), ri(2)], ['sameav', ...pickN(E, 2)], ['diffav', ...pickN(E, 2)]]));
  // and at least one CROSS rule, or it is two puzzles side by side rather than
  // one two-dimensional puzzle
  const [x, y] = pickN(E, 2);
  cons.push(pick([['avbef', x, ri(2), y], ['avaft', x, ri(2), y], ['norun', 0]]));
  if (hard) {
    const [p, q] = pickN(E, 2);
    cons.push(pick([['diffav', p, q], ['ends', pick(E)], ['avbef', p, ri(2), q], ['nat', pick(E), 1 + ri(n)]]));
  }
  return cons;
}

// A stated conditional has to be doing conditional work. If the rest of the rules
// force its antecedent TRUE it is secretly an unconditional; if they force it
// FALSE it is decoration. Either way a player who spots it learns the puzzle was
// generated, so the day is thrown away.
const ANTECEDENT = {
  cbef: (c) => ['bef', c[1], c[2]],
  cat: (c) => ['at', c[1], c[2]],
  cto: (c) => ['to', c[1], c[2]],
  imp: (c) => ['in', c[1]],
  impn: (c) => ['in', c[1]],
  onlyif: (c) => ['in', c[1]],
  nimp: (c) => ['out', c[1]],
  avbef: (c) => ['av', c[1], c[2]],
  avaft: (c) => ['av', c[1], c[2]],
};
function conditionalsAreLive(spec) {
  for (let i = 0; i < spec.cons.length; i++) {
    const mk = ANTECEDENT[spec.cons[i][0]];
    if (!mk) continue;
    const ant = mk(spec.cons[i]);
    const others = { ...spec, cons: spec.cons.filter((_, j) => j !== i) };
    let rest;
    try { rest = solutions(others); } catch (e) { return false; }
    if (!rest.length) return false;
    const n = rest.filter((s) => testPred(ant, s, spec)).length;
    if (n === 0 || n === rest.length) return false;      // vacuous, or not a conditional
  }
  return true;
}

// ─────────────────────────── difficulty ──────────────────────────────────────
function measure(spec, sols) {
  const nE = spec.ents.length;
  let free = 0, dims = nE;
  const varies = (get) => { const v = new Set(sols.map(get)); return v.size > 1; };
  for (let e = 0; e < nE; e++) {
    if (spec.k === 'sel') { if (varies((s) => s.sel[e])) free++; }
    else if (spec.k === 'match') { if (varies((s) => s.grp[e])) free++; }
    else if (varies((s) => s.pos[e])) free++;
  }
  if (spec.k === 'hyb') { dims = nE * 2; for (let e = 0; e < nE; e++) if (varies((s) => s.att[e])) free++; }
  const bits = Math.log2(Math.max(1, sols.length));
  return Math.round(10 * (free / dims) + 4 * bits + 1.5 * spec.cons.length);
}

// ─────────────────────────── choice pools ────────────────────────────────────
function claimPool(spec) {
  const nE = spec.ents.length;
  const E = Array.from({ length: nE }, (_, i) => i);
  const out = [];
  if (spec.k === 'seq' || spec.k === 'hyb') {
    for (const e of E) for (let i = 1; i <= spec.n; i++) out.push(['at', e, i]);
    for (const a of E) for (const b of E) if (a !== b) { out.push(['bef', a, b]); out.push(['imm', a, b]); }
    for (const a of E) for (const b of E) if (a < b) out.push(['adj', a, b]);
    if (spec.k === 'hyb') for (const e of E) for (const v of [0, 1]) out.push(['av', e, v]);
  } else if (spec.k === 'sel') {
    for (const e of E) { out.push(['in', e]); out.push(['out', e]); }
    for (const a of E) for (const b of E) if (a !== b) out.push(['butnot', a, b]);
    for (const a of E) for (const b of E) if (a < b) { out.push(['both', a, b]); out.push(['neither', a, b]); }
  } else if (spec.k === 'match') {
    for (const e of E) for (let g = 0; g < spec.groups.length; g++) { out.push(['to', e, g]); out.push(['nto', e, g]); }
    for (const a of E) for (const b of E) if (a < b) { out.push(['same', a, b]); out.push(['diff', a, b]); }
  }
  // never offer a verbatim restatement of a stated rule
  return out.filter((p) => !spec.cons.some((c) => eqP(c, p)));
}

function condPool(spec) {
  const nE = spec.ents.length;
  const E = Array.from({ length: nE }, (_, i) => i);
  const out = [];
  if (spec.k === 'seq' || spec.k === 'hyb') {
    for (const e of E) for (let i = 1; i <= spec.n; i++) out.push(['at', e, i]);
    for (const a of E) for (const b of E) if (a !== b) out.push(['bef', a, b]);
    if (spec.k === 'hyb') for (const e of E) for (const v of [0, 1]) out.push(['av', e, v]);
  } else if (spec.k === 'sel') {
    for (const e of E) { out.push(['in', e]); out.push(['out', e]); }
    for (const a of E) for (const b of E) if (a < b) { out.push(['both', a, b]); out.push(['neither', a, b]); }
  } else {
    for (const e of E) for (let g = 0; g < spec.groups.length; g++) out.push(['to', e, g]);
    for (const a of E) for (const b of E) if (a < b) out.push(['same', a, b]);
  }
  return out;
}

// ─────────────────────────── the acceptability question ──────────────────────
// LSAT convention: one choice works and each of the other four breaks EXACTLY
// one stated condition. Foils are built by perturbing real arrangements, so a
// foil is always near-miss plausible rather than obviously broken.
function mintAccept(spec, sols) {
  const nE = spec.ents.length;
  const asChoice = (sol) => {
    if (spec.k === 'sel') return ['set', spec.ents.map((_, e) => e).filter((e) => sol.sel[e])];
    if (spec.k === 'match') return ['asg', sol.grp.slice()];
    const bySlot = []; for (let e = 0; e < nE; e++) bySlot[sol.pos[e] - 1] = e;
    return spec.k === 'hyb' ? ['full', bySlot, sol.att.slice()] : ['ord', bySlot];
  };
  const good = asChoice(pick(sols));
  const foils = [];
  const byRule = new Set();
  let guard = 0;
  while (foils.length < 4 && guard++ < 4000) {
    const base = pick(sols);
    let cand = null;
    if (spec.k === 'sel') {
      const inn = spec.ents.map((_, e) => e).filter((e) => base.sel[e]);
      const out = spec.ents.map((_, e) => e).filter((e) => !base.sel[e]);
      if (!inn.length || !out.length) continue;
      const s = new Set(inn); s.delete(pick(inn)); s.add(pick(out));
      cand = ['set', [...s].sort((a, b) => a - b)];
    } else if (spec.k === 'match') {
      const g = base.grp.slice(); const e = ri(nE);
      const alt = [...Array(spec.groups.length).keys()].filter((x) => x !== g[e]);
      g[e] = pick(alt); cand = ['asg', g];
    } else {
      const bySlot = []; for (let e = 0; e < nE; e++) bySlot[base.pos[e] - 1] = e;
      const o = bySlot.slice(); const i = ri(nE); let j = ri(nE);
      if (i === j) j = (j + 1) % nE;
      [o[i], o[j]] = [o[j], o[i]];
      cand = spec.k === 'hyb' ? ['full', o, base.att.slice()] : ['ord', o];
    }
    const broken = brokenRules(cand, spec);
    if (broken.length !== 1) continue;                       // exactly one rule
    if (foils.some((f) => eqP(f, cand)) || eqP(cand, good)) continue;
    if (byRule.has(broken[0]) && byRule.size < Math.min(4, spec.cons.length)) continue;  // spread across rules
    byRule.add(broken[0]);
    foils.push(cand);
  }
  if (foils.length < 4) return null;
  return shuffle([good, ...foils]);
}

// ─────────────────────────── must / could / cannot ───────────────────────────
function mintClaim(kind, spec, sols, pool, cond) {
  const sub = cond ? sols.filter((s) => testPred(cond, s, spec)) : sols;
  if (sub.length < 2) return null;
  const hit = (p) => sub.filter((s) => testPred(p, s, spec)).length;
  const shuffled = shuffle(pool);
  const globalHit = (p) => sols.filter((s) => testPred(p, s, spec)).length;
  let good = null;
  for (const p of shuffled) {
    if (cond && eqP(p, cond)) continue;                 // never restate the condition
    const h = hit(p);
    // under a condition the answer has to DEPEND on it, or the condition is scenery
    if (kind === 'must' && h === sub.length && (!cond || globalHit(p) < sols.length)) { good = p; break; }
    if (kind === 'could' && h > 0 && h < sub.length && (!cond || globalHit(p) > h || h < sols.length)) { good = p; break; }
    if (kind === 'cannot' && h === 0 && (!cond || globalHit(p) > 0)) { good = p; break; }
  }
  if (!good) return null;
  // foils: for `must` prefer could-but-not-must, which is the LSAT trap; for
  // `could` they must be outright impossible; for `cannot` they must be possible
  const bad = [];
  for (const p of shuffled) {
    if (bad.length >= 4) break;
    if (eqP(p, good) || bad.some((b) => eqP(b, p))) continue;
    if (cond && eqP(p, cond)) continue;
    const h = hit(p);
    if (kind === 'must' && h > 0 && h < sub.length) bad.push(p);
    else if (kind === 'could' && h === 0) bad.push(p);
    else if (kind === 'cannot' && h > 0 && h < sub.length) bad.push(p);
  }
  if (bad.length < 4 && kind === 'must') {           // top up with impossibles
    for (const p of shuffled) {
      if (bad.length >= 4) break;
      if (eqP(p, good) || bad.some((b) => eqP(b, p))) continue;
      if (hit(p) === 0) bad.push(p);
    }
  }
  if (bad.length < 4) return null;
  // distinct English, or two choices read identically
  const all = shuffle([good, ...bad.slice(0, 4)]);
  const txt = all.map((p) => enPred(p, spec));
  if (new Set(txt).size !== 5) return null;
  return all;
}

// ─────────────────────────── the list question ───────────────────────────────
function mintList(spec, sols) {
  const nE = spec.ents.length;
  const cands = [];
  for (let e = 0; e < nE; e++) {
    const real = [...new Set(sols.map((s) => s.pos[e]))].sort((a, b) => a - b);
    if (real.length >= 2 && real.length <= spec.n - 1) cands.push({ e, real });
  }
  if (!cands.length) return null;
  const { e, real } = pick(cands);
  const all = Array.from({ length: spec.n }, (_, i) => i + 1);
  const sets = [real];
  const add = (s) => {
    const t = [...new Set(s)].sort((a, b) => a - b);
    if (!t.length || t.length > spec.n) return;
    if (sets.some((x) => x.length === t.length && x.every((v, i) => v === t[i]))) return;
    sets.push(t);
  };
  add(real.slice(0, -1));
  add([...real, pick(all.filter((x) => !real.includes(x)))].filter(Boolean));
  add(real.slice(1));
  add(all.filter((x) => x >= real[0] && x <= real[real.length - 1]));
  let guard = 0;
  while (sets.length < 5 && guard++ < 200) add(pickN(all, Math.max(2, real.length + (ri(3) - 1))));
  if (sets.length < 5) return null;
  return { e, sets: shuffle(sets.slice(0, 5)) };
}

// ─────────────────────────── question text ───────────────────────────────────
function qText(kind, spec, extra) {
  const t = spec.theme;
  const many = t.plural;
  if (kind === 'accept') {
    if (spec.k === 'sel') return `Which one of the following could be the complete list of ${many} ${t.verb}?`;
    if (spec.k === 'match') return `Which one of the following could be an accurate matching of the ${many} to their ${t.groupNouns}?`;
    if (spec.k === 'hyb') return `Which one of the following could be an accurate list of the ${many}, from ${t.slot} 1 to ${t.slot} ${spec.n}, with an asterisk marking each one ${t.attrs[0]}?`;
    return `Which one of the following could be an acceptable order of the ${many}, from ${t.slot} 1 to ${t.slot} ${spec.n}?`;
  }
  if (kind === 'must') return extra ? `If ${extra}, then which one of the following must be true?` : 'Which one of the following must be true?';
  if (kind === 'could') return extra ? `If ${extra}, then which one of the following could be true?` : 'Which one of the following could be true?';
  if (kind === 'cannot') return extra ? `If ${extra}, then which one of the following CANNOT be true?` : 'Which one of the following CANNOT be true?';
  if (kind === 'list') return `Which one of the following is a complete and accurate list of the ${spec.theme.slots} in which ${extra} could be ${spec.theme.verb}?`;
  throw new Error(kind);
}

// A condition rendered as a clause: "A is heard third" (no closing period).
const condClause = (p, spec) => enPred(p, spec).replace(/\.$/, '');

// ─────────────────────────── explanatory note ────────────────────────────────
// Machine-derived, never asserted. For an acceptability question it names the one
// condition each wrong choice breaks; otherwise it cites a concrete arrangement.
function noteFor(kind, q, spec, sols, key) {
  const T = spec.theme;
  const q_ = (s) => `\u201c${String(s).replace(/\.$/, '')}\u201d`;   // quote it rather than re-case it
  if (kind === 'accept') {
    const parts = q.chk.preds.map((p, i) => {
      if (i === key.correct) return null;
      const n = brokenRules(p, spec)[0];
      return `${enPred(p, spec)} breaks condition (${n + 1}), ${q_(enPred(spec.cons[n], spec))}`;
    }).filter(Boolean);
    return `Exactly one choice obeys every condition, and each of the others breaks a single one. ${parts.join('. ')}.`;
  }
  if (kind === 'list') {
    return `Across the ${key.count} arrangement${key.count === 1 ? '' : 's'} the conditions allow, ${spec.ents[q.chk.ent]} can be ${T.verb} in ${series(key.real.map((r) => `${T.slot} ${r}`))}, and nowhere else.`;
  }
  const good = q_(enPred(q.chk.preds[key.correct], spec));
  const fi = key.foils.findIndex((f, i) => f && i !== key.correct);
  const ex = fi >= 0 ? showSolution(key.foils[fi], spec) : null;
  const other = fi >= 0 ? q_(enPred(q.chk.preds[fi], spec)) : null;
  const scope = q.chk.cond ? `the ${key.count} arrangement${key.count === 1 ? '' : 's'} that also satisfy the condition` : `all ${key.count} arrangements the conditions allow`;
  if (kind === 'must') {
    return `${good} holds in ${scope}, so it must be true.` +
      (ex ? ` None of the others has to: ${ex} is legal, and in it ${other} is false.` : '');
  }
  if (kind === 'could') {
    const w = key.witness ? showSolution(key.witness, spec) : null;
    return `${good} is possible.` + (w ? ` ${w} is legal and has it.` : '') +
      ` Each of the other four appears in no legal arrangement at all.`;
  }
  return `${good} appears in none of ${scope}, so it cannot be true.` + (ex ? ` Each of the others can happen: ${ex} is legal, and in it ${other} is true.` : '');
}

// ─────────────────────────── build one day ───────────────────────────────────
// q1 is always an acceptability question. That is deliberate and not a variety
// failure: every real game in the format opened with one, and it is the question
// that teaches a new player to read the conditions. q2-q5 rotate.
const MENUS_POS = [                       // seq / hyb: a list question is available
  ['must', 'could', 'list', 'cond-must'],
  ['cannot', 'must', 'cond-could', 'list'],
  ['must', 'list', 'cannot', 'cond-must'],
  ['could', 'cannot', 'cond-must', 'list'],
  ['must', 'cond-cannot', 'could', 'list'],
  ['cannot', 'cond-must', 'list', 'could'],
];
const MENUS_FLAT = [                      // sel / match: no positions, so no list
  ['must', 'could', 'cannot', 'cond-must'],
  ['cannot', 'must', 'cond-could', 'could'],
  ['could', 'cannot', 'cond-must', 'must'],
  ['must', 'cond-cannot', 'could', 'cannot'],
  ['cannot', 'cond-must', 'must', 'could'],
  ['must', 'could', 'cond-cannot', 'cannot'],
];

function buildDay(shape, theme, letters, menu, hard) {
  const nE = shape.n;
  const spec = {
    k: shape.k, n: shape.n, ents: letters, theme,
    ...(shape.pick ? { pick: shape.pick } : {}),
    ...(theme.groups ? { groups: theme.groups } : {}),
    ...(theme.attrs ? { attrs: theme.attrs } : {}),
    cons: [],
  };
  spec.cons = shape.k === 'seq' ? sampleSeq(nE, hard)
    : shape.k === 'sel' ? sampleSel(nE, hard)
      : shape.k === 'match' ? sampleMatch(nE, shape.m, hard)
        : sampleHyb(nE, hard);

  let sols;
  try { sols = solutions(spec); } catch (e) { return null; }
  if (sols.length < shape.win[0] || sols.length > shape.win[1]) return null;
  if (!conditionalsAreLive(spec)) return null;
  const diff = measure(spec, sols);
  if (diff < shape.diff[0] || diff > shape.diff[1]) return null;

  const questions = [];
  const pool = claimPool(spec);
  const conds = shuffle(condPool(spec));

  const acc = mintAccept(spec, sols);
  if (!acc) return null;
  questions.push({ kind: 'accept', q: qText('accept', spec), chk: { preds: acc } });

  for (const want of menu) {
    if (want === 'list') {
      if (spec.k === 'sel' || spec.k === 'match') return null;
      const L = mintList(spec, sols);
      if (!L) return null;
      questions.push({ kind: 'list', q: qText('list', spec, spec.ents[L.e]), chk: { ent: L.e, sets: L.sets } });
      continue;
    }
    if (want.startsWith('cond-')) {
      const kind = want.slice(5);
      let done = false;
      for (const c of conds) {
        const sub = sols.filter((s) => testPred(c, s, spec));
        if (sub.length < 2 || sub.length >= sols.length) continue;
        const ch = mintClaim(kind, spec, sols, pool, c);
        if (!ch) continue;
        questions.push({ kind, q: qText(kind, spec, condClause(c, spec)), chk: { preds: ch, cond: c } });
        done = true; break;
      }
      if (!done) return null;
      continue;
    }
    const ch = mintClaim(want, spec, sols, pool, null);
    if (!ch) return null;
    questions.push({ kind: want, q: qText(want, spec), chk: { preds: ch } });
  }

  // ── the gate: exactly one correct choice per question, nothing degenerate ──
  const keys = [];
  for (const q of questions) {
    const key = solveQuestion(q, spec, sols);
    if (key.correct < 0) return null;
    if (q.kind === 'accept') {
      const n = q.chk.preds.filter((p) => sols.some((s) => testPred(p, s, spec))).length;
      if (n !== 1) return null;
      if (q.chk.preds.some((p, i) => i !== key.correct && brokenRules(p, spec).length !== 1)) return null;
    } else if (q.kind === 'list') {
      const n = q.chk.sets.filter((s) => s.length === key.real.length && s.every((v, i) => v === key.real[i])).length;
      if (n !== 1) return null;
    } else {
      const sub = q.chk.cond ? sols.filter((s) => testPred(q.chk.cond, s, spec)) : sols;
      const hits = q.chk.preds.map((p) => sub.filter((s) => testPred(p, s, spec)).length);
      const nOk = hits.filter((h) => q.kind === 'must' ? h === sub.length : q.kind === 'could' ? h > 0 : h === 0).length;
      if (nOk !== 1) return null;
    }
    keys.push(key);
  }
  // never let the key sit in the same slot five times
  const spread = new Set(keys.map((k) => k.correct));
  if (spread.size < 3) return null;

  questions.forEach((q, i) => {
    q.choices = q.kind === 'list' ? q.chk.sets.map((s) => s.join(', ')) : renderChoices(q, spec);
    q.note = noteFor(q.kind, q, spec, sols, keys[i]);
  });

  return { spec, questions, sols: sols.length, diff, setup: renderSetup(spec), rules: renderRules(spec) };
}

// ─────────────────────────── assemble the bank ───────────────────────────────
const args = process.argv.slice(2);
const DAYS = Number(args.find((a) => /^\d+$/.test(a)) || 60);
const seedArg = args.indexOf('--seed');
if (seedArg >= 0) SEED = Number(args[seedArg + 1]);
const startArg = args.indexOf('--start');
const START = startArg >= 0 ? args[startArg + 1] : '2026-08-10';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const out = [];
const themeUse = {};
const ruleUse = {};
let attempts = 0;

// APPEND MODE (2026-09-24 restock). `--append` keeps every banked board exactly
// as it is and builds only days num+1..DAYS, where DAYS is the TOTAL run length
// from START. A full regeneration can no longer reproduce the frozen boards once
// docket-themes.mjs grows (a longer theme list changes every pick), so the bank
// is extended by appending instead. The theme and rule-template ceilings are
// seeded from the banked boards, and each new day reseeds the rng off its own
// board number, so the new segment never replays a frozen day and one day's
// retries cannot shift the next day's draw.
//   node scripts/gen-docket.mjs 113 --append
const APPEND = args.includes('--append');
let firstDay = 0;
if (APPEND) {
  const { PUZZLES: BANKED } = await import('../app/docket/puzzles.js');
  BANKED.forEach((p, i) => {
    if (p.num !== i + 1) { console.error(`banked board ${i + 1} carries num ${p.num}`); process.exit(1); }
    out.push(p);
    themeUse[p.spec.theme.id] = (themeUse[p.spec.theme.id] || 0) + 1;
    const sig = p.spec.cons.map((c) => c[0]).sort().join('+');
    ruleUse[sig] = (ruleUse[sig] || 0) + 1;
  });
  firstDay = BANKED.length;
  if (firstDay >= DAYS) { console.log(`docket: bank already holds ${firstDay} days`); process.exit(0); }
}
const APPEND_SEED_BASE = 20260924;

for (let d = firstDay; d < DAYS; d++) {
  if (APPEND) SEED = APPEND_SEED_BASE + 1000003 * (d + 1);
  const dt = new Date(Date.UTC(...START.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))), 12));
  dt.setUTCDate(dt.getUTCDate() + d);
  const y = dt.getUTCFullYear(), mo = dt.getUTCMonth() + 1, da = dt.getUTCDate();
  const dow = dt.getUTCDay();
  const sunday = dow === 0;
  let shape = SHAPES[dow];
  if (dow === 5 && Math.floor(d / 7) % 2 === 1) shape = FRI_ALT;
  const hard = dow === 0 || dow === 4 || dow === 5 || dow === 6;

  let day = null, tries = 0;
  while (!day && tries++ < 60000) {
    attempts++;
    const avail = THEMES[shape.k].filter((t) => (themeUse[t.id] || 0) < 2);
    if (APPEND && !avail.length) { console.error(`day ${d + 1}: every ${shape.k} theme is at its ceiling of 2, grow scripts/docket-themes.mjs`); process.exit(1); }
    const theme = pick(avail.length ? avail : THEMES[shape.k]);
    const letters = letterRun(ri(20), shape.n);
    const pool = (shape.k === 'seq' || shape.k === 'hyb') ? MENUS_POS : MENUS_FLAT;
    const menu = pool[(d + ri(pool.length)) % pool.length];
    const cand = buildDay(shape, theme, letters, menu, hard);
    if (!cand) continue;
    // rule-template ceiling (CLAUDE.md rule 7): count across the whole bank
    const sig = cand.spec.cons.map((c) => c[0]).sort().join('+');
    if ((ruleUse[sig] || 0) >= 4) continue;
    ruleUse[sig] = (ruleUse[sig] || 0) + 1;
    themeUse[theme.id] = (themeUse[theme.id] || 0) + 1;
    day = cand;
  }
  if (!day) { console.error(`could not build day ${d + 1} (${dow})`); process.exit(1); }

  out.push({
    num: d + 1,
    quizId: `docket-${mo}-${da}-${String(y).slice(2)}`,
    live: `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`,
    dateLabel: `${MONTHS[mo - 1]} ${da}, ${y}`,
    sunday,
    title: day.spec.theme.title,
    setup: day.setup,
    rules: day.rules,
    spec: day.spec,
    questions: day.questions,
    meta: { sols: day.sols, diff: day.diff },
  });
}

// ─────────────────────────── emit ────────────────────────────────────────────
const HEADER = `// Puzzle data for Docket, the daily deduction game. Imported ONLY by the server
// page (app/docket/page.js), which filters live<=today. The bank stores NO answer
// key: app/docket/engine.js enumerates every arrangement each day's conditions
// allow and derives which choice is correct, in the browser, from the same spec
// the player is reading (the Sworn/Suffice leak-guard pattern).
//
// GENERATED by scripts/gen-docket.mjs, PROVED by scripts/verify-docket.mjs.
// Do not hand-edit a day: regenerate, or the rendered prose and the formal spec
// can drift apart and the game becomes unfair in a way no test would catch.
//
// AUTHORING RULES
//
//   questions  5 every day. q1 is ALWAYS an acceptability question ("which could
//              be an acceptable order"), which is deliberate rather than a
//              variety failure: every real game in this format opened with one,
//              and it is the question that teaches a new player how to read the
//              conditions. q2-q5 rotate over must / could / cannot / complete-
//              and-accurate-list / conditional variants of the first three.
//   archetype  one per weekday, so the week covers all four shapes:
//                Mon seq(6)   Tue sel(6 of 3)   Wed match(5->3)   Thu seq(7)
//                Fri sel(7 of 4) alternating with match(6->3)     Sat hyb(6)
//                Sun hyb(7), the Sunday Edition: an order AND a second
//                    per-entity dimension, stacked, on the biggest board
//   spec       the formal puzzle: k (archetype), ents (letters), cons
//              (constraints as compact predicate arrays), plus pick/groups/attrs
//              where the archetype needs them. \`theme\` carries ONLY prose.
//   setup      RENDERED from theme.setupTpl; \`rules\` RENDERED from \`cons\`;
//              each question's \`choices\` RENDERED from its chk predicates. The
//              verifier re-renders all three and fails on any mismatch, which is
//              what makes prose/logic drift impossible rather than unlikely.
//   sunday     matches the real weekday, asserted by the verifier.
//   meta       sols = how many arrangements the conditions allow; diff = the
//              measured difficulty proxy (open assignments + log2 arrangements +
//              condition count) that the weekday ramp is held against.
//
// Every day satisfies, by exhaustive enumeration: exactly ONE choice per question
// meets its criterion and the other four provably fail; every rejected
// acceptability choice breaks EXACTLY ONE stated condition; and no key sits in
// fewer than three distinct positions across the five questions.
export const PUZZLES = `;

const body = JSON.stringify(out, null, 1)
  .replace(/\n\s+/g, (m) => (m.length > 40 ? '\n  ' : m));
const BANK_URL = new URL('../app/docket/puzzles.js', import.meta.url);
const text = `${HEADER}${JSON.stringify(out)};\n`;
if (APPEND) {
  // the frozen prefix must come back byte for byte: the old file minus its
  // closing `];` has to be a prefix of the new one, or nothing is written
  const old = readFileSync(BANK_URL, 'utf8');
  const frozen = old.replace(/\];\s*$/, '');
  if (!text.startsWith(frozen) || text[frozen.length] !== ',') { console.error('append would rewrite a banked board; nothing written'); process.exit(1); }
}
writeFileSync(BANK_URL, text);

// ─────────────────────────── report ─────────────────────────────────────────
const byK = {};
out.forEach((p) => { byK[p.spec.k] = (byK[p.spec.k] || 0) + 1; });
console.log(`docket: ${out.length} days, ${START} to ${out[out.length - 1].live}  (${attempts} samples)`);
console.log('archetypes:', Object.entries(byK).map(([k, v]) => `${k} ${v}`).join('  '));
console.log('themes used:', Object.keys(themeUse).length, '| max reuse', Math.max(...Object.values(themeUse)));
console.log('rule sigs:', Object.keys(ruleUse).length, '| max reuse', Math.max(...Object.values(ruleUse)));
const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
for (let w = 0; w < 7; w++) {
  const g = out.filter((p) => new Date(`${p.live}T12:00:00Z`).getUTCDay() === w);
  if (!g.length) continue;
  const ds = g.map((p) => p.meta.diff);
  console.log(`  ${dows[w]}  n=${g.length}  diff ${Math.min(...ds)}-${Math.max(...ds)} (avg ${(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(1)})  sols ${Math.min(...g.map((p) => p.meta.sols))}-${Math.max(...g.map((p) => p.meta.sols))}`);
}
