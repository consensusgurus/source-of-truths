// Docket engine — the formal side of the daily deduction game.
//
// A Docket day is a SPEC (entities, slots, formal constraints) plus questions
// whose choices are formal predicates. Nothing about a day is authored twice:
// every sentence a player reads is RENDERED from the same object the solver
// evaluates, so the prose can never drift from the logic it describes. That is
// the one failure mode this format has, and it is closed by construction.
//
// NO ANSWER KEY IS STORED, anywhere. Not as a secret-keeping measure: a logic
// game is by definition solvable from its own premises, so a player with the
// conditions already has everything the solver has, and pretending otherwise
// would be theatre. The reason is integrity. A stored key is a second copy of the
// truth, and second copies drift; deriving the answer from the same conditions
// the player is reading means the game cannot disagree with itself. What gets
// proved instead is stronger than a letter: for every question EXACTLY ONE choice
// satisfies its criterion and the other four provably fail, which is what
// scripts/verify-docket.mjs asserts with its own independent solver.
//
// FOUR ARCHETYPES, one per solution shape:
//   seq    n entities into n ordered slots            perms, n! <= 5040
//   sel    exactly `pick` of n entities chosen        C(n, pick)
//   match  each entity assigned one of m groups       m^n, bounded by group sizes
//   hyb    an order AND a per-entity binary attribute perms x C(n,k), needs `avc`
//
// A solution is one flat object so a predicate can read whatever it needs:
//   { pos: [], sel: [], grp: [], att: [] }   (unused arrays stay empty)
// pos[e] is a 1-based slot, sel[e] is 0/1, grp[e] a group index, att[e] is 0/1.
//
// GRAMMAR. Every rule sentence is "<Letter> is <participle> ...", one shape for
// the whole bank, so negation is always "is not <participle>" and no theme needs
// a verb-form branch. What DOES vary is the preposition: a temporal game reads
// "at some time before" and a spatial one "somewhere to the left of", carried on
// the theme as befWord / aftWord / immWord. A spatial theme that borrowed the
// temporal wording would be the tell that these sentences are generated.

// ─────────────────────────── small helpers ───────────────────────────────────
export const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
export const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E'];

export function series(items, conj = 'and') {
  const a = items.slice();
  if (a.length <= 1) return a[0] || '';
  if (a.length === 2) return `${a[0]} ${conj} ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, ${conj} ${a[a.length - 1]}`;
}

export function combos(n, k) {
  const out = []; const cur = [];
  (function rec(start) {
    if (cur.length === k) { out.push(cur.slice()); return; }
    for (let i = start; i < n; i++) { cur.push(i); rec(i + 1); cur.pop(); }
  })(0);
  return out;
}

export function perms(n) {
  const out = []; const a = Array.from({ length: n }, (_, i) => i);
  (function rec(k) {
    if (k === n) { out.push(a.slice()); return; }
    for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(k + 1); [a[k], a[i]] = [a[i], a[k]]; }
  })(0);
  return out;
}

// ─────────────────────────── theme accessors ─────────────────────────────────
const L = (sp, i) => sp.ents[i];
const IS = (sp, i) => `${L(sp, i)} is ${sp.theme.verb}`;          // "A is hung"
const ISN = (sp, i) => `${L(sp, i)} is not ${sp.theme.verb}`;
const BEF = (sp) => sp.theme.befWord || 'at some time before';
const AFT = (sp) => sp.theme.aftWord || 'at some time after';
const IMM = (sp) => sp.theme.immWord || 'immediately before';
const SLOT = (sp) => sp.theme.slot || 'position';
const SLOTS = (sp) => sp.theme.slots || 'positions';
const ONE = (sp) => sp.theme.singular;
const MANY = (sp) => sp.theme.plural;
const G = (sp, g) => sp.groups[g];
const PREP = (sp) => sp.theme.prep || 'to';
const A = (sp, v) => sp.attrs[v];

// "Exactly three cases are" / "Exactly one case is"
const count = (sp, k) => `${WORD[k]} ${k === 1 ? ONE(sp) : MANY(sp)} ${k === 1 ? 'is' : 'are'}`;

// Is the order of two entities fixed by the STATED conditions? Transitive closure
// over the explicit ordering rules only (bef, imm, bef2, aft2), i.e. what a reader
// can see on the page, never a deeper deduction the wording would then give away.
// Returns 1 when a must come before b, -1 when b must come before a, 0 if open.
const ORDER_CACHE = new WeakMap();
function orderClosure(sp) {
  if (ORDER_CACHE.has(sp)) return ORDER_CACHE.get(sp);
  const n = sp.ents.length;
  const lt = Array.from({ length: n }, () => new Array(n).fill(false));
  for (const c of sp.cons || []) {
    if (c[0] === 'bef' || c[0] === 'imm') lt[c[1]][c[2]] = true;
    else if (c[0] === 'bef2') { lt[c[1]][c[2]] = true; lt[c[1]][c[3]] = true; }
    else if (c[0] === 'aft2') { lt[c[2]][c[1]] = true; lt[c[3]][c[1]] = true; }
  }
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (lt[i][k]) for (let j = 0; j < n; j++) if (lt[k][j]) lt[i][j] = true;
  ORDER_CACHE.set(sp, lt);
  return lt;
}
export function fixedOrder(sp, a, b) {
  if (!sp || !sp.cons) return 0;
  const lt = orderClosure(sp);
  return lt[a][b] ? 1 : lt[b][a] ? -1 : 0;
}

// ─────────────────────────── predicates ──────────────────────────────────────
// Each predicate is a compact array: [type, ...args]; entity args are indices
// into spec.ents. Every entry has test() for the solver and en() for the page,
// and nothing else in the codebase is allowed to phrase these sentences.
export const PREDS = {
  // ── sequencing / hybrid, positional ────────────────────────────────────────
  bef: { test: (p, s) => s.pos[p[1]] < s.pos[p[2]],
    en: (p, sp) => `${IS(sp, p[1])} ${BEF(sp)} ${L(sp, p[2])}.` },
  imm: { test: (p, s) => s.pos[p[2]] === s.pos[p[1]] + 1,
    en: (p, sp) => `${IS(sp, p[1])} in the ${SLOT(sp)} ${IMM(sp)} ${L(sp, p[2])}.` },
  // "in either order" is only honest when the order is open. Where the stated
  // conditions already fix which comes first (R before S, say), the phrase sends
  // a reader hunting for an S-then-R case that cannot exist, so the sentence is
  // rendered as the one adjacency still possible. Same test either way: with the
  // order forced, adjacent and immediately-before are the same predicate.
  adj: { test: (p, s) => Math.abs(s.pos[p[1]] - s.pos[p[2]]) === 1,
    en: (p, sp) => {
      const f = fixedOrder(sp, p[1], p[2]);
      if (f) { const [a, b] = f > 0 ? [p[1], p[2]] : [p[2], p[1]]; return `${IS(sp, a)} in the ${SLOT(sp)} ${IMM(sp)} ${L(sp, b)}.`; }
      return `${L(sp, p[1])} and ${L(sp, p[2])} are ${sp.theme.verb} in consecutive ${SLOTS(sp)}, in either order.`;
    } },
  nadj: { test: (p, s) => Math.abs(s.pos[p[1]] - s.pos[p[2]]) !== 1,
    en: (p, sp) => `${L(sp, p[1])} and ${L(sp, p[2])} are not ${sp.theme.verb} in consecutive ${SLOTS(sp)}.` },
  at: { test: (p, s) => s.pos[p[1]] === p[2],
    en: (p, sp) => `${IS(sp, p[1])} ${ORD[p[2]]}.` },
  nat: { test: (p, s) => s.pos[p[1]] !== p[2],
    en: (p, sp) => `${ISN(sp, p[1])} ${ORD[p[2]]}.` },
  ends: { test: (p, s, sp) => s.pos[p[1]] === 1 || s.pos[p[1]] === sp.n,
    en: (p, sp) => `${IS(sp, p[1])} either first or last.` },
  gap: { test: (p, s) => Math.abs(s.pos[p[1]] - s.pos[p[2]]) - 1 === p[3],
    en: (p, sp) => `Exactly ${count(sp, p[3])} ${sp.theme.verb} between ${L(sp, p[1])} and ${L(sp, p[2])}.` },
  bef2: { test: (p, s) => s.pos[p[1]] < s.pos[p[2]] && s.pos[p[1]] < s.pos[p[3]],
    en: (p, sp) => `${IS(sp, p[1])} ${BEF(sp)} both ${L(sp, p[2])} and ${L(sp, p[3])}.` },
  aft2: { test: (p, s) => s.pos[p[1]] > s.pos[p[2]] && s.pos[p[1]] > s.pos[p[3]],
    en: (p, sp) => `${IS(sp, p[1])} ${AFT(sp)} both ${L(sp, p[2])} and ${L(sp, p[3])}.` },
  cbef: { test: (p, s) => !(s.pos[p[1]] < s.pos[p[2]]) || s.pos[p[3]] < s.pos[p[4]],
    en: (p, sp) => `If ${IS(sp, p[1])} ${BEF(sp)} ${L(sp, p[2])}, then ${IS(sp, p[3])} ${BEF(sp)} ${L(sp, p[4])}.` },
  cat: { test: (p, s) => s.pos[p[1]] !== p[2] || s.pos[p[3]] === p[4],
    en: (p, sp) => `If ${IS(sp, p[1])} ${ORD[p[2]]}, then ${IS(sp, p[3])} ${ORD[p[4]]}.` },
  ord: { test: (p, s) => p[1].every((e, i) => s.pos[e] === i + 1),
    en: (p, sp) => p[1].map((e) => L(sp, e)).join(', ') },

  // ── selection ──────────────────────────────────────────────────────────────
  in: { test: (p, s) => !!s.sel[p[1]], en: (p, sp) => `${IS(sp, p[1])}.` },
  out: { test: (p, s) => !s.sel[p[1]], en: (p, sp) => `${ISN(sp, p[1])}.` },
  imp: { test: (p, s) => !s.sel[p[1]] || !!s.sel[p[2]],
    en: (p, sp) => `If ${IS(sp, p[1])}, then ${IS(sp, p[2])}.` },
  onlyif: { test: (p, s) => !s.sel[p[1]] || !!s.sel[p[2]],   // same logic, different English
    en: (p, sp) => `${IS(sp, p[1])} only if ${IS(sp, p[2])}.` },
  impn: { test: (p, s) => !s.sel[p[1]] || !s.sel[p[2]],
    en: (p, sp) => `If ${IS(sp, p[1])}, then ${ISN(sp, p[2])}.` },
  nimp: { test: (p, s) => !!s.sel[p[1]] || !!s.sel[p[2]],
    en: (p, sp) => `If ${ISN(sp, p[1])}, then ${IS(sp, p[2])}.` },
  nboth: { test: (p, s) => !(s.sel[p[1]] && s.sel[p[2]]),
    en: (p, sp) => `${L(sp, p[1])} and ${L(sp, p[2])} are not both ${sp.theme.verb}.` },
  atl1: { test: (p, s) => !!s.sel[p[1]] || !!s.sel[p[2]],
    en: (p, sp) => `At least one of ${L(sp, p[1])} and ${L(sp, p[2])} is ${sp.theme.verb}.` },
  xor1: { test: (p, s) => !!s.sel[p[1]] !== !!s.sel[p[2]],
    en: (p, sp) => `Exactly one of ${L(sp, p[1])} and ${L(sp, p[2])} is ${sp.theme.verb}.` },
  iff: { test: (p, s) => !!s.sel[p[1]] === !!s.sel[p[2]],
    en: (p, sp) => `${IS(sp, p[1])} if and only if ${IS(sp, p[2])}.` },
  both: { test: (p, s) => !!s.sel[p[1]] && !!s.sel[p[2]],
    en: (p, sp) => `Both ${L(sp, p[1])} and ${L(sp, p[2])} are ${sp.theme.verb}.` },
  neither: { test: (p, s) => !s.sel[p[1]] && !s.sel[p[2]],
    en: (p, sp) => `Neither ${L(sp, p[1])} nor ${L(sp, p[2])} is ${sp.theme.verb}.` },
  butnot: { test: (p, s) => !!s.sel[p[1]] && !s.sel[p[2]],
    en: (p, sp) => `${IS(sp, p[1])} but ${L(sp, p[2])} is not.` },
  set: { test: (p, s, sp) => sp.ents.every((_, e) => !!s.sel[e] === p[1].includes(e)),
    en: (p, sp) => p[1].map((e) => L(sp, e)).join(', ') },

  // ── matching / assignment ──────────────────────────────────────────────────
  to: { test: (p, s) => s.grp[p[1]] === p[2],
    en: (p, sp) => `${IS(sp, p[1])} ${PREP(sp)} ${G(sp, p[2])}.` },
  nto: { test: (p, s) => s.grp[p[1]] !== p[2],
    en: (p, sp) => `${ISN(sp, p[1])} ${PREP(sp)} ${G(sp, p[2])}.` },
  same: { test: (p, s) => s.grp[p[1]] === s.grp[p[2]],
    en: (p, sp) => `${L(sp, p[1])} and ${L(sp, p[2])} are ${sp.theme.verb} ${PREP(sp)} the same ${sp.theme.groupNoun}.` },
  diff: { test: (p, s) => s.grp[p[1]] !== s.grp[p[2]],
    en: (p, sp) => `${L(sp, p[1])} and ${L(sp, p[2])} are ${sp.theme.verb} ${PREP(sp)} different ${sp.theme.groupNouns}.` },
  gsize: { test: (p, s, sp) => sp.ents.reduce((c, _, e) => c + (s.grp[e] === p[1] ? 1 : 0), 0) === p[2],
    en: (p, sp) => `Exactly ${count(sp, p[2])} ${sp.theme.verb} ${PREP(sp)} ${G(sp, p[1])}.` },
  gmin: { test: (p, s, sp) => sp.ents.reduce((c, _, e) => c + (s.grp[e] === p[1] ? 1 : 0), 0) >= p[2],
    en: (p, sp) => `At least ${count(sp, p[2])} ${sp.theme.verb} ${PREP(sp)} ${G(sp, p[1])}.` },
  gmax: { test: (p, s, sp) => sp.ents.reduce((c, _, e) => c + (s.grp[e] === p[1] ? 1 : 0), 0) <= p[2],
    en: (p, sp) => `At most ${count(sp, p[2])} ${sp.theme.verb} ${PREP(sp)} ${G(sp, p[1])}.` },
  cto: { test: (p, s) => s.grp[p[1]] !== p[2] || s.grp[p[3]] === p[4],
    en: (p, sp) => `If ${IS(sp, p[1])} ${PREP(sp)} ${G(sp, p[2])}, then ${IS(sp, p[3])} ${PREP(sp)} ${G(sp, p[4])}.` },
  asg: { test: (p, s, sp) => sp.ents.every((_, e) => s.grp[e] === p[1][e]),
    en: (p, sp) => sp.ents.map((l, e) => `${l}–${(sp.theme.groupsShort || sp.groups)[p[1][e]]}`).join(', ') },

  // ── hybrid, the second dimension ───────────────────────────────────────────
  av: { test: (p, s) => s.att[p[1]] === p[2], en: (p, sp) => `${L(sp, p[1])} is ${A(sp, p[2])}.` },
  nav: { test: (p, s) => s.att[p[1]] !== p[2], en: (p, sp) => `${L(sp, p[1])} is not ${A(sp, p[2])}.` },
  sameav: { test: (p, s) => s.att[p[1]] === s.att[p[2]],
    en: (p, sp) => `${L(sp, p[1])} and ${L(sp, p[2])} are both ${A(sp, 0)} or both ${A(sp, 1)}.` },
  diffav: { test: (p, s) => s.att[p[1]] !== s.att[p[2]],
    en: (p, sp) => `Exactly one of ${L(sp, p[1])} and ${L(sp, p[2])} is ${A(sp, 0)}.` },
  avc: { test: (p, s, sp) => sp.ents.reduce((c, _, e) => c + (s.att[e] === p[1] ? 1 : 0), 0) === p[2],
    en: (p, sp) => `Exactly ${WORD[p[2]]} of the ${MANY(sp)} are ${A(sp, p[1])}.` },
  avbef: { test: (p, s) => s.att[p[1]] !== p[2] || s.pos[p[1]] < s.pos[p[3]],
    en: (p, sp) => `If ${L(sp, p[1])} is ${A(sp, p[2])}, then ${IS(sp, p[1])} ${BEF(sp)} ${L(sp, p[3])}.` },
  avaft: { test: (p, s) => s.att[p[1]] !== p[2] || s.pos[p[1]] > s.pos[p[3]],
    en: (p, sp) => `If ${L(sp, p[1])} is ${A(sp, p[2])}, then ${IS(sp, p[1])} ${AFT(sp)} ${L(sp, p[3])}.` },
  norun: {
    test: (p, s, sp) => {
      const bySlot = [];
      for (let e = 0; e < sp.ents.length; e++) bySlot[s.pos[e] - 1] = s.att[e];
      for (let i = 1; i < bySlot.length; i++) if (bySlot[i] === p[1] && bySlot[i - 1] === p[1]) return false;
      return true;
    },
    en: (p, sp) => `No two ${MANY(sp)} in consecutive ${SLOTS(sp)} are both ${A(sp, p[1])}.`,
  },
  full: { test: (p, s, sp) => p[1].every((e, i) => s.pos[e] === i + 1) && sp.ents.every((_, e) => s.att[e] === p[2][e]),
    en: (p, sp) => p[1].map((e) => `${L(sp, e)}${p[2][e] === 0 ? '*' : ''}`).join(', ') },
};

export function testPred(p, sol, spec) {
  const d = PREDS[p[0]];
  if (!d) throw new Error(`unknown predicate ${p[0]}`);
  return !!d.test(p, sol, spec);
}
export function enPred(p, spec) {
  const d = PREDS[p[0]];
  if (!d) throw new Error(`unknown predicate ${p[0]}`);
  return d.en(p, spec);
}

// ─────────────────────────── rendered prose ──────────────────────────────────
// {N} entity count as a word, {n} as a digit, {L} the entity letters,
// {K} the chosen count as a word, {G} the group list, {A0}/{A1} attribute names.
export function renderSetup(spec) {
  const t = spec.theme;
  return (t.setupTpl || '')
    .replace(/\{N\}/g, WORD[spec.ents.length])
    .replace(/\{n\}/g, String(spec.n || spec.ents.length))
    .replace(/\{L\}/g, series(spec.ents))
    .replace(/\{K\}/g, WORD[spec.pick || 0])
    .replace(/\{G\}/g, series(spec.groups || []))
    .replace(/\{A0\}/g, (spec.attrs || [])[0] || '')
    .replace(/\{A1\}/g, (spec.attrs || [])[1] || '')
    .trim();
}
export function renderRules(spec) { return spec.cons.map((c) => enPred(c, spec)); }
export function renderChoices(q, spec) { return (q.chk.preds || []).map((p) => enPred(p, spec)); }

// ─────────────────────────── enumeration ─────────────────────────────────────
const EMPTY = { pos: [], sel: [], grp: [], att: [] };

export function solutions(spec) {
  const ok = (sol) => spec.cons.every((c) => testPred(c, sol, spec));
  const out = [];
  const nE = spec.ents.length;

  if (spec.k === 'seq') {
    for (const perm of perms(nE)) {
      const pos = new Array(nE);
      for (let i = 0; i < nE; i++) pos[perm[i]] = i + 1;
      const sol = { ...EMPTY, pos, order: perm };
      if (ok(sol)) out.push(sol);
    }
  } else if (spec.k === 'sel') {
    for (const c of combos(nE, spec.pick)) {
      const sel = new Array(nE).fill(0);
      for (const e of c) sel[e] = 1;
      const sol = { ...EMPTY, sel, chosen: c };
      if (ok(sol)) out.push(sol);
    }
  } else if (spec.k === 'match') {
    const m = spec.groups.length;
    const grp = new Array(nE).fill(0);
    (function rec(e) {
      if (e === nE) {
        const sol = { ...EMPTY, grp: grp.slice() };
        if (ok(sol)) out.push(sol);
        return;
      }
      for (let g = 0; g < m; g++) { grp[e] = g; rec(e + 1); }
    })(0);
  } else if (spec.k === 'hyb') {
    const avc = spec.cons.find((c) => c[0] === 'avc');
    if (!avc) throw new Error('hybrid spec needs an avc constraint to bound enumeration');
    const kZero = avc[1] === 0 ? avc[2] : nE - avc[2];
    const attSets = combos(nE, kZero);
    for (const perm of perms(nE)) {
      const pos = new Array(nE);
      for (let i = 0; i < nE; i++) pos[perm[i]] = i + 1;
      for (const zeros of attSets) {
        const att = new Array(nE).fill(1);
        for (const e of zeros) att[e] = 0;
        const sol = { ...EMPTY, pos, att, order: perm };
        if (ok(sol)) out.push(sol);
      }
    }
  } else {
    throw new Error(`unknown archetype ${spec.k}`);
  }
  return out;
}

// ─────────────────────────── question evaluation ─────────────────────────────
export function solveQuestion(q, spec, sols) {
  const pool = q.chk && q.chk.cond ? sols.filter((s) => testPred(q.chk.cond, s, spec)) : sols;

  if (q.kind === 'list') {
    const e = q.chk.ent;
    const real = [...new Set(pool.map((s) => s.pos[e]))].sort((a, b) => a - b);
    const idx = q.chk.sets.findIndex((set) => set.length === real.length && set.every((v, i) => v === real[i]));
    return { correct: idx, real, count: pool.length, foils: q.chk.sets.map(() => null) };
  }

  const hits = q.chk.preds.map((p) => pool.filter((s) => testPred(p, s, spec)).length);
  let correct = -1;
  if (q.kind === 'accept') correct = q.chk.preds.findIndex((p) => sols.some((s) => testPred(p, s, spec)));
  else if (q.kind === 'must') correct = hits.findIndex((h) => h === pool.length);
  else if (q.kind === 'could') correct = hits.findIndex((h) => h > 0);
  else if (q.kind === 'cannot') correct = hits.findIndex((h) => h === 0);
  else throw new Error(`unknown question kind ${q.kind}`);

  // one concrete arrangement per wrong choice, so the reveal can show WHY
  const foils = q.chk.preds.map((p, i) => {
    if (i === correct) return null;
    if (q.kind === 'must') return pool.find((s) => !testPred(p, s, spec)) || null;
    if (q.kind === 'cannot') return pool.find((s) => testPred(p, s, spec)) || null;
    return null;
  });
  // for could-be-true the teaching move is the arrangement that DOES it
  const witness = (q.kind === 'could' && correct >= 0)
    ? pool.find((s) => testPred(q.chk.preds[correct], s, spec)) || null : null;
  return { correct, hits, count: pool.length, foils, witness };
}

// Which conditions a rejected `accept` choice breaks. LSAT convention is exactly
// one, which the verifier enforces, so naming it is never ambiguous.
export function brokenRules(p, spec) {
  const sol = choiceToSolution(p, spec);
  if (!sol) return [];
  return spec.cons.map((c, i) => (testPred(c, sol, spec) ? -1 : i)).filter((i) => i >= 0);
}

export function choiceToSolution(p, spec) {
  const nE = spec.ents.length;
  if (p[0] === 'ord') { const pos = new Array(nE); p[1].forEach((e, i) => { pos[e] = i + 1; }); return { ...EMPTY, pos, order: p[1] }; }
  if (p[0] === 'set') { const sel = new Array(nE).fill(0); p[1].forEach((e) => { sel[e] = 1; }); return { ...EMPTY, sel, chosen: p[1] }; }
  if (p[0] === 'asg') return { ...EMPTY, grp: p[1].slice() };
  if (p[0] === 'full') { const pos = new Array(nE); p[1].forEach((e, i) => { pos[e] = i + 1; }); return { ...EMPTY, pos, att: p[2].slice(), order: p[1] }; }
  return null;
}

export function showSolution(sol, spec) {
  if (spec.k === 'sel') return spec.ents.filter((_, e) => sol.sel[e]).join(', ');
  if (spec.k === 'match') return spec.ents.map((l, e) => `${l}–${spec.groups[sol.grp[e]]}`).join(', ');
  const bySlot = [];
  for (let e = 0; e < spec.ents.length; e++) bySlot[sol.pos[e] - 1] = e;
  if (spec.k === 'hyb') return bySlot.map((e) => `${spec.ents[e]}${sol.att[e] === 0 ? '*' : ''}`).join(', ');
  return bySlot.map((e) => spec.ents[e]).join(', ');
}

// The whole day, solved. Enumeration is milliseconds; the client memoises it.
export function solveDay(p) {
  const spec = p.spec;
  const sols = solutions(spec);
  return { sols, keys: p.questions.map((q) => solveQuestion(q, spec, sols)) };
}
