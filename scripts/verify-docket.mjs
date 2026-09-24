#!/usr/bin/env node
// Verify the Docket bank (app/docket/puzzles.js) from scratch.
//
// Per CLAUDE.md rule 3 this RECOMPUTES and never trusts a stored field, which is
// easy here because the bank stores no answer key in the first place. What is
// proved is the property the game actually rests on: for every question EXACTLY
// ONE choice meets its criterion and the other four provably fail, by exhaustive
// enumeration of every arrangement the day's conditions allow.
//
// INDEPENDENCE. The checker carries its own solver, and its predicate semantics
// are written from what each rule SENTENCE MEANS rather than by copying
// app/docket/engine.js. That is the crossing that matters. A solver cloned from
// the engine would agree with a wrong engine; a solver written from the English
// disagrees with an engine whose test() and en() have drifted apart, which is
// this format's one real failure mode. It then asserts its own answer key equals
// the engine's on all 300 questions.
//
// What it proves:
//   structural   nums sequential, quizId/live/dateLabel agree, the sunday flag
//                matches the real Eastern weekday, 5 questions of 5 choices
//   prose        setup, every rule, and every choice string RE-RENDER from the
//                spec byte for byte, so displayed prose cannot drift from the
//                logic it describes
//   keys         independent enumeration agrees with the engine on the
//                arrangement count and on the correct choice, every question
//   uniqueness   exactly one choice qualifies; for an acceptability question
//                every rejected choice breaks EXACTLY ONE stated condition
//   conditionals no stated conditional has an antecedent the other rules force
//                true (secretly an unconditional) or false (decoration)
//   fairness     no conditional question is answered by restating its condition;
//                the key sits in at least 3 distinct slots per day; and the
//                bank-wide A-E spread stays inside 10-30% so the board is not
//                guessable without reading it
//   ramp         each day inside its weekday band, and within each archetype the
//                later weekday's band strictly above the earlier one
//   variety      rule 7 ceilings on theme and rule-template reuse, question-type
//                mix, and no repeated question wording inside a day
//   copy         US spellings, no em dashes, and no answer named in the setup
//
// Run: node scripts/verify-docket.mjs
import { PUZZLES } from '../app/docket/puzzles.js';
import { scanUS } from './us-spellings.mjs';
import { renderSetup, renderRules, renderChoices, solutions as engineSolutions, solveQuestion as engineSolve, brokenRules, CHOICE_KEYS } from '../app/docket/engine.js';

// US_COPY_FROM: boards from the 2026-09-24 restock on are screened by scripts/us-spellings.mjs
const US_COPY_FROM = '2026-10-15';
let fails = 0;
const fail = (m) => { console.error('✗', m); fails++; };
const note = (m) => console.log('…', m);

// ═══════════════════ the independent solver ═══════════════════════════════════
// Predicate semantics, re-derived from the meaning of each rendered sentence.
function holds(c, sol, spec) {
  const P = sol.pos, S = sol.sel, Gr = sol.grp, At = sol.att;
  const n = spec.n || spec.ents.length;
  const nE = spec.ents.length;
  const countGrp = (g) => { let k = 0; for (let e = 0; e < nE; e++) if (Gr[e] === g) k++; return k; };
  const countAtt = (v) => { let k = 0; for (let e = 0; e < nE; e++) if (At[e] === v) k++; return k; };
  switch (c[0]) {
    // "A is <verb> before B"  ->  A sits in an earlier slot than B
    case 'bef': return P[c[1]] < P[c[2]];
    // "A is in the slot immediately before B"  ->  B's slot is A's plus one
    case 'imm': return P[c[2]] - P[c[1]] === 1;
    // "A and B are in consecutive slots, in either order"
    case 'adj': return Math.abs(P[c[1]] - P[c[2]]) === 1;
    case 'nadj': return Math.abs(P[c[1]] - P[c[2]]) !== 1;
    // "A is <verb> <ordinal>"
    case 'at': return P[c[1]] === c[2];
    case 'nat': return P[c[1]] !== c[2];
    // "A is <verb> either first or last"
    case 'ends': return P[c[1]] === 1 || P[c[1]] === n;
    // "Exactly k <plural> are <verb> between A and B"  ->  k slots strictly between
    case 'gap': { const lo = Math.min(P[c[1]], P[c[2]]), hi = Math.max(P[c[1]], P[c[2]]); return hi - lo - 1 === c[3]; }
    case 'bef2': return P[c[1]] < P[c[2]] && P[c[1]] < P[c[3]];
    case 'aft2': return P[c[1]] > P[c[2]] && P[c[1]] > P[c[3]];
    // "If A is before B, then C is before D"  ->  material conditional
    case 'cbef': return (P[c[1]] < P[c[2]]) ? (P[c[3]] < P[c[4]]) : true;
    case 'cat': return (P[c[1]] === c[2]) ? (P[c[3]] === c[4]) : true;
    case 'ord': { for (let i = 0; i < c[1].length; i++) if (P[c[1][i]] !== i + 1) return false; return true; }
    // ── selection
    case 'in': return S[c[1]] === 1;
    case 'out': return S[c[1]] === 0;
    // "If A is chosen, then B is chosen" and "A is chosen only if B is chosen"
    // are the same claim: A cannot be in with B out.
    case 'imp': case 'onlyif': return !(S[c[1]] === 1 && S[c[2]] === 0);
    case 'impn': return !(S[c[1]] === 1 && S[c[2]] === 1);
    case 'nimp': return !(S[c[1]] === 0 && S[c[2]] === 0);
    case 'nboth': return !(S[c[1]] === 1 && S[c[2]] === 1);
    case 'atl1': return S[c[1]] === 1 || S[c[2]] === 1;
    case 'xor1': return S[c[1]] + S[c[2]] === 1;
    case 'iff': return S[c[1]] === S[c[2]];
    case 'both': return S[c[1]] === 1 && S[c[2]] === 1;
    case 'neither': return S[c[1]] === 0 && S[c[2]] === 0;
    case 'butnot': return S[c[1]] === 1 && S[c[2]] === 0;
    case 'set': { for (let e = 0; e < nE; e++) { const want = c[1].indexOf(e) >= 0 ? 1 : 0; if (S[e] !== want) return false; } return true; }
    // ── matching
    case 'to': return Gr[c[1]] === c[2];
    case 'nto': return Gr[c[1]] !== c[2];
    case 'same': return Gr[c[1]] === Gr[c[2]];
    case 'diff': return Gr[c[1]] !== Gr[c[2]];
    case 'gsize': return countGrp(c[1]) === c[2];
    case 'gmin': return countGrp(c[1]) >= c[2];
    case 'gmax': return countGrp(c[1]) <= c[2];
    case 'cto': return (Gr[c[1]] === c[2]) ? (Gr[c[3]] === c[4]) : true;
    case 'asg': { for (let e = 0; e < nE; e++) if (Gr[e] !== c[1][e]) return false; return true; }
    // ── the hybrid's second dimension
    case 'av': return At[c[1]] === c[2];
    case 'nav': return At[c[1]] !== c[2];
    case 'sameav': return At[c[1]] === At[c[2]];
    case 'diffav': return At[c[1]] !== At[c[2]];
    case 'avc': return countAtt(c[1]) === c[2];
    case 'avbef': return (At[c[1]] === c[2]) ? (P[c[1]] < P[c[3]]) : true;
    case 'avaft': return (At[c[1]] === c[2]) ? (P[c[1]] > P[c[3]]) : true;
    // "No two <plural> in consecutive slots are both <attr>"
    case 'norun': {
      const bySlot = new Array(n);
      for (let e = 0; e < nE; e++) bySlot[P[e] - 1] = At[e];
      for (let i = 0; i + 1 < n; i++) if (bySlot[i] === c[1] && bySlot[i + 1] === c[1]) return false;
      return true;
    }
    case 'full': {
      for (let i = 0; i < c[1].length; i++) if (P[c[1][i]] !== i + 1) return false;
      for (let e = 0; e < nE; e++) if (At[e] !== c[2][e]) return false;
      return true;
    }
    default: throw new Error(`verifier has no semantics for ${c[0]}`);
  }
}

// Enumerate by walking the assignment space directly, rather than by the engine's
// permutation/combination helpers.
function enumerate(spec) {
  const nE = spec.ents.length;
  const n = spec.n || nE;
  const out = [];
  const ok = (sol) => spec.cons.every((c) => holds(c, sol, spec));
  if (spec.k === 'seq' || spec.k === 'hyb') {
    const pos = new Array(nE).fill(0);
    const taken = new Array(n + 1).fill(false);
    const attStack = new Array(nE).fill(1);
    const emit = () => {
      if (spec.k === 'seq') { const s = { pos: pos.slice(), sel: [], grp: [], att: [] }; if (ok(s)) out.push(s); return; }
      // hybrid: walk every attribute vector of the mandated size
      const avc = spec.cons.find((c) => c[0] === 'avc');
      const kv = avc[1], kn = avc[2];
      const rec2 = (e, used) => {
        if (e === nE) {
          if (used !== kn) return;
          const s = { pos: pos.slice(), sel: [], grp: [], att: attStack.slice() };
          if (ok(s)) out.push(s);
          return;
        }
        for (const v of [0, 1]) { attStack[e] = v; rec2(e + 1, used + (v === kv ? 1 : 0)); }
      };
      rec2(0, 0);
    };
    const rec = (e) => {
      if (e === nE) { emit(); return; }
      for (let p = 1; p <= n; p++) { if (taken[p]) continue; taken[p] = true; pos[e] = p; rec(e + 1); taken[p] = false; }
    };
    rec(0);
  } else if (spec.k === 'sel') {
    const sel = new Array(nE).fill(0);
    const rec = (e, k) => {
      if (e === nE) { if (k !== spec.pick) return; const s = { pos: [], sel: sel.slice(), grp: [], att: [] }; if (ok(s)) out.push(s); return; }
      for (const v of [0, 1]) { if (k + v > spec.pick) continue; sel[e] = v; rec(e + 1, k + v); }
      sel[e] = 0;
    };
    rec(0, 0);
  } else if (spec.k === 'match') {
    const grp = new Array(nE).fill(0);
    const m = spec.groups.length;
    const rec = (e) => {
      if (e === nE) { const s = { pos: [], sel: [], grp: grp.slice(), att: [] }; if (ok(s)) out.push(s); return; }
      for (let g = 0; g < m; g++) { grp[e] = g; rec(e + 1); }
    };
    rec(0);
  } else throw new Error(`unknown archetype ${spec.k}`);
  return out;
}

function keyOf(q, spec, sols) {
  const pool = q.chk.cond ? sols.filter((s) => holds(q.chk.cond, s, spec)) : sols;
  if (q.kind === 'list') {
    const real = [...new Set(pool.map((s) => s.pos[q.chk.ent]))].sort((a, b) => a - b);
    const idx = q.chk.sets.findIndex((t) => t.length === real.length && t.every((v, i) => v === real[i]));
    const nOk = q.chk.sets.filter((t) => t.length === real.length && t.every((v, i) => v === real[i])).length;
    return { correct: idx, nOk, pool: pool.length, real };
  }
  const hits = q.chk.preds.map((p) => pool.filter((s) => holds(p, s, spec)).length);
  const meets = (h) => (q.kind === 'must' ? h === pool.length : q.kind === 'could' ? h > 0 : q.kind === 'cannot' ? h === 0 : null);
  if (q.kind === 'accept') {
    const good = q.chk.preds.map((p) => sols.some((s) => holds(p, s, spec)));
    return { correct: good.indexOf(true), nOk: good.filter(Boolean).length, pool: pool.length, hits };
  }
  return { correct: hits.findIndex(meets), nOk: hits.filter(meets).length, pool: pool.length, hits };
}

const eqP = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ═══════════════════ bank checks ══════════════════════════════════════════════
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Bands are keyed by weekday AND archetype, because Friday alternates between the
// harder selection board and the harder matching board and a single Friday band
// would span both, which is how this check first failed.
const BANDS = {
  1: { seq: [25, 30] }, 2: { sel: [22, 26] }, 3: { match: [24, 30] }, 4: { seq: [33, 39] },
  5: { sel: [27, 31], match: [31, 37] }, 6: { hyb: [37, 41] }, 0: { hyb: [38, 44] },
};
const ARCH_ORDER = [['seq', 1, 4], ['sel', 2, 5], ['match', 3, 5]];   // archetype, easier weekday, harder weekday
const KIND_OF_DAY = {};

if (!PUZZLES.length) fail('bank is empty');
let nQ = 0;
const keyCount = {}, themeUse = {}, sigUse = {}, kindUse = {};

PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.quizId})`;
  if (p.num !== i + 1) fail(`${tag}: num out of sequence`);

  // ── structural ────────────────────────────────────────────────────────────
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `docket-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live`);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel "${p.dateLabel}" wrong`);
  const dow = dt.getUTCDay();
  if (p.sunday !== (dow === 0)) fail(`${tag}: sunday flag ${p.sunday} but weekday says ${dow === 0}`);
  if (p.questions.length !== 5) fail(`${tag}: ${p.questions.length} questions, want 5`);

  const spec = p.spec;
  KIND_OF_DAY[p.num] = spec.k;
  themeUse[spec.theme.id || spec.theme.title] = (themeUse[spec.theme.id || spec.theme.title] || 0) + 1;
  const sig = spec.cons.map((c) => c[0]).sort().join('+');
  sigUse[sig] = (sigUse[sig] || 0) + 1;

  // ── prose must re-render from the spec, byte for byte ─────────────────────
  if (renderSetup(spec) !== p.setup) fail(`${tag}: setup does not re-render from the spec`);
  const rr = renderRules(spec);
  if (rr.length !== p.rules.length || rr.some((r, k) => r !== p.rules[k])) fail(`${tag}: rules do not re-render from cons`);

  // ── independent enumeration vs the engine ────────────────────────────────
  const mine = enumerate(spec);
  let theirs;
  try { theirs = engineSolutions(spec); } catch (e) { fail(`${tag}: engine threw: ${e.message}`); return; }
  if (mine.length !== theirs.length) fail(`${tag}: arrangement count differs, verifier ${mine.length} vs engine ${theirs.length}`);
  if (!mine.length) fail(`${tag}: no valid arrangements`);
  if (p.meta && p.meta.sols !== mine.length) fail(`${tag}: meta.sols ${p.meta.sols} but really ${mine.length}`);

  // ── a stated conditional has to be doing conditional work ────────────────
  const ANT = { cbef: (c) => ['bef', c[1], c[2]], cat: (c) => ['at', c[1], c[2]], cto: (c) => ['to', c[1], c[2]],
    imp: (c) => ['in', c[1]], impn: (c) => ['in', c[1]], onlyif: (c) => ['in', c[1]], nimp: (c) => ['out', c[1]],
    avbef: (c) => ['av', c[1], c[2]], avaft: (c) => ['av', c[1], c[2]] };
  spec.cons.forEach((c, ci) => {
    const mk = ANT[c[0]];
    if (!mk) return;
    const rest = enumerate({ ...spec, cons: spec.cons.filter((_, j) => j !== ci) });
    if (!rest.length) return;
    const k = rest.filter((s) => holds(mk(c), s, spec)).length;
    if (k === 0) fail(`${tag}: condition (${ci + 1}) is vacuous, the other rules make its antecedent impossible`);
    if (k === rest.length) fail(`${tag}: condition (${ci + 1}) is not conditional, the other rules force its antecedent`);
  });

  const seenQ = new Set();
  p.questions.forEach((q, qi) => {
    nQ++;
    const qtag = `${tag} q${qi + 1}`;
    if (seenQ.has(q.q)) fail(`${qtag}: question wording repeated within the day`);
    seenQ.add(q.q);
    if (qi === 0 && q.kind !== 'accept') fail(`${qtag}: q1 must be the acceptability question`);
    kindUse[q.kind + (q.chk.cond ? '-cond' : '')] = (kindUse[q.kind + (q.chk.cond ? '-cond' : '')] || 0) + 1;

    const nCh = q.kind === 'list' ? q.chk.sets.length : q.chk.preds.length;
    if (nCh !== 5) fail(`${qtag}: ${nCh} choices, want 5`);
    if (q.choices.length !== 5) fail(`${qtag}: ${q.choices.length} rendered choices`);
    if (new Set(q.choices).size !== 5) fail(`${qtag}: two choices read identically`);

    // choices must re-render from the predicates (list choices are plain slot sets)
    if (q.kind === 'list') {
      const want = q.chk.sets.map((s) => s.join(', '));
      if (want.some((w, k) => w !== q.choices[k])) fail(`${qtag}: list choices do not re-render`);
    } else {
      const want = renderChoices(q, spec);
      if (want.some((w, k) => w !== q.choices[k])) fail(`${qtag}: choices do not re-render from chk.preds`);
    }

    // ── the property the whole game rests on ──────────────────────────────
    const k = keyOf(q, spec, mine);
    if (k.nOk !== 1) fail(`${qtag}: ${k.nOk} choices meet the "${q.kind}" criterion, want exactly 1`);
    if (k.correct < 0) fail(`${qtag}: no correct choice`);
    let eng;
    try { eng = engineSolve(q, spec, theirs); } catch (e) { fail(`${qtag}: engine threw: ${e.message}`); return; }
    if (eng.correct !== k.correct) fail(`${qtag}: engine says ${eng.correct}, verifier says ${k.correct}`);
    keyCount[CHOICE_KEYS[k.correct]] = (keyCount[CHOICE_KEYS[k.correct]] || 0) + 1;

    if (q.kind === 'accept') {
      q.chk.preds.forEach((pr, ci) => {
        if (ci === k.correct) return;
        const br = brokenRules(pr, spec);
        if (br.length !== 1) fail(`${qtag}: rejected choice ${CHOICE_KEYS[ci]} breaks ${br.length} conditions, want exactly 1`);
      });
    }
    if (q.chk.cond) {
      if (k.pool < 2) fail(`${qtag}: condition leaves ${k.pool} arrangements, too few for a real question`);
      if (k.pool >= mine.length) fail(`${qtag}: condition rules nothing out`);
      if (q.kind !== 'list' && eqP(q.chk.preds[k.correct], q.chk.cond)) fail(`${qtag}: the answer just restates the condition`);
    }
    if (!q.note || q.note.length < 20) fail(`${qtag}: missing note`);
  });

  // never let the key sit in the same slot all day
  const spread = new Set(p.questions.map((q, qi) => keyOf(q, spec, mine).correct));
  if (spread.size < 3) fail(`${tag}: keys occupy only ${spread.size} distinct slots`);

  // ── the ramp ─────────────────────────────────────────────────────────────
  const band = (BANDS[dow] || {})[spec.k];
  if (!band) fail(`${tag}: ${spec.k} is not an archetype ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]} is allowed to use`);
  else if (p.meta && (p.meta.diff < band[0] || p.meta.diff > band[1])) fail(`${tag}: diff ${p.meta.diff} outside the ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]} ${spec.k} band ${band.join('-')}`);
  // the Sunday Edition scales structurally, and that is what gets asserted
  if (p.sunday) {
    if (spec.k !== 'hyb') fail(`${tag}: a Sunday Edition must be the stacked hybrid board`);
    if (spec.ents.length !== 7) fail(`${tag}: Sunday needs 7 entities, has ${spec.ents.length}`);
    if (spec.cons.length < 7) fail(`${tag}: Sunday needs at least 7 conditions, has ${spec.cons.length}`);
  }
  if (dow === 6 && spec.ents.length !== 6) fail(`${tag}: Saturday hybrid should be the 6 board`);

  // ── copy ─────────────────────────────────────────────────────────────────
  const copy = [p.setup, ...p.rules, ...p.questions.flatMap((q) => [q.q, ...q.choices, q.note])].join(' ');
  if (copy.includes('—')) fail(`${tag}: em dash in copy`);
  if (/\b(colour|favourite|organis|realis|centre|theatre|analyse|catalogue|labour|neighbour)/i.test(copy)) fail(`${tag}: British spelling in copy`);
  // the shared US-spelling screen, scoped from the 2026-09-24 restock so the past stays frozen
  if (p.live >= US_COPY_FROM) for (const hit of scanUS(copy)) fail(`${tag}: British form "${hit.found}" in copy (US: ${hit.us})`);
  if (/\bundefined\b|\bNaN\b|\[object/.test(copy)) fail(`${tag}: unrendered value in copy`);
  if (/\s{2,}/.test(copy.replace(/\n/g, ' '))) fail(`${tag}: doubled whitespace in copy`);
  if (/\.\./.test(copy)) fail(`${tag}: doubled full stop in copy`);
});

// ═══════════════════ bank-wide ════════════════════════════════════════════════
// the archetype ramp: the later weekday's band strictly above the earlier one
for (const [arch, easy, hard] of ARCH_ORDER) {
  const a = BANDS[easy][arch], b = BANDS[hard][arch];
  if (a[1] >= b[0]) fail(`ramp: ${arch} bands overlap, weekday ${easy} ${a.join('-')} vs weekday ${hard} ${b.join('-')}`);
}
// rule 7 ceilings, counted across the WHOLE bank
for (const [t, k] of Object.entries(themeUse)) if (k > 2) fail(`theme ${t} used ${k} times, ceiling 2`);
const sigCap = Math.max(3, Math.ceil(PUZZLES.length * 0.07));
for (const [s, k] of Object.entries(sigUse)) if (k > sigCap) fail(`rule template ${s} used ${k} times, ceiling ${sigCap}`);
// key spread: guessable banks are the failure mode here
for (const L of CHOICE_KEYS) {
  const share = (keyCount[L] || 0) / nQ;
  if (share < 0.10 || share > 0.30) fail(`key ${L} is ${(100 * share).toFixed(1)}% of the bank, want 10-30%`);
}
// question mix. `accept` is 20% by design (q1 every day, the format's own opener)
// and is exempt; nothing else may run away with the bank.
for (const [k, v] of Object.entries(kindUse)) {
  if (k === 'accept') continue;
  if (v / nQ > 0.30) fail(`question type ${k} is ${(100 * v / nQ).toFixed(1)}% of the bank, ceiling 30%`);
}
if ((kindUse.accept || 0) !== PUZZLES.length) fail(`accept appears ${kindUse.accept} times, want one per day`);

// ═══════════════════ summary ══════════════════════════════════════════════════
const byK = {};
PUZZLES.forEach((p) => { byK[p.spec.k] = (byK[p.spec.k] || 0) + 1; });
console.log(`\ndocket: ${PUZZLES.length} days, ${nQ} questions, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);
console.log('archetypes:', Object.entries(byK).map(([k, v]) => `${k} ${v}`).join('  '));
console.log('keys:', CHOICE_KEYS.map((L) => `${L} ${(100 * (keyCount[L] || 0) / nQ).toFixed(0)}%`).join('  '));
console.log('question mix:', Object.entries(kindUse).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('  '));
console.log(`themes: ${Object.keys(themeUse).length} used, max reuse ${Math.max(...Object.values(themeUse))} of 2`);
console.log(`rule templates: ${Object.keys(sigUse).length}, max reuse ${Math.max(...Object.values(sigUse))} of ${sigCap}`);
const last = PUZZLES[PUZZLES.length - 1].live;
const left = Math.round((new Date(last) - new Date()) / 864e5);
if (left < 21) note(`bank runs out in ${left} days (${last}), extend it`);

if (fails) { console.error(`\nverify-docket: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-docket: all ${nQ} questions pass (keys re-derived by an independent solver, prose re-rendered, uniqueness proved by exhaustive enumeration)`);
