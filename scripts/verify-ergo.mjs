// Verify app/ergo/puzzles.js. Shares NO code with scripts/gen-ergo.mjs:
// wording, the possible-worlds enumeration and every proof step are re-derived
// here from the raw rule kinds.
//
//   node scripts/verify-ergo.mjs
//
// Checks, per board:
//   - dates contiguous from day 1, num sequential, quizId and dateLabel match
//     the live date, sunday flag exactly on Sundays
//   - cast size, rule count and allowed wordings match the weekday ramp
//   - every rule's text and flip text match an independent renderer, and each
//     rule's clause matches its wording kind
//   - the rules alone decide nobody; today's fact leaves 2+ people forced and
//     2+ free; at least one world survives
//   - statement count (9, or 12 on Sunday), every verdict at least twice
//     (three times on Sunday), no repeated statement, single-person statements
//     name different people, none restates a rule as written
//   - at least one "if" trap (could, with a rule chain running the other way)
//     and at least one must-be-true "if" whose proof uses a flipped rule
//   - an "if" statement is judged only over the lineups where its first half
//     happens, and that first half must be possible today
//   - every 'why' chain: each step is a real edge of the rules, labelled with
//     the right rule and the right direction, and the chain proves exactly the
//     verdict the enumeration gives
// Across the bank: no theme twice inside four days.

import { PUZZLES } from '../app/ergo/puzzles.js';

const fails = [];
const fail = (p, m) => fails.push(`${p ? p.quizId : 'bank'}: ${m}`);

const RAMP = {
  1: [5, 4, ['if', 'never']],
  2: [6, 5, ['if', 'never', 'onlyif']],
  3: [6, 5, ['if', 'never', 'onlyif', 'unless']],
  4: [6, 6, ['if', 'never', 'onlyif', 'unless', 'least']],
  5: [7, 6, ['if', 'never', 'onlyif', 'unless', 'least']],
  6: [7, 7, ['if', 'never', 'onlyif', 'unless', 'least']],
  0: [7, 7, ['if', 'never', 'onlyif', 'unless', 'least']],
};
const THEMES = {
  hearing: ['testifies', 'stays silent', 'testify', 'stay silent'],
  dinner: ['comes', 'stays home', 'come', 'stay home'],
  regatta: ['races', 'sits out', 'race', 'sit out'],
  gig: ['plays', 'sits out', 'play', 'sit out'],
  summit: ['goes up', 'stays at camp', 'go up', 'stay at camp'],
  vote: ['votes yes', 'votes no', 'vote yes', 'vote no'],
  roadtrip: ['rides along', 'stays behind', 'ride along', 'stay behind'],
  lineup: ['starts', 'sits', 'start', 'sit'],
};

const isLit = (l, n) => Array.isArray(l) && l.length === 2 && Number.isInteger(l[0]) && l[0] >= 0 && l[0] < n && (l[1] === 0 || l[1] === 1);
const flipLit = (l) => [l[0], 1 - l[1]];
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const truth = (w, l) => ((w >>> l[0]) & 1) === l[1];

function phrase(T, N, l) { return `${N[l[0]]} ${l[1] ? T[0] : T[1]}`; }
function ruleWords(T, N, r) {
  // r.a -> r.b is the clause; the wording depends on the kind.
  switch (r.k) {
    case 'if': return `If ${phrase(T, N, r.a)}, ${phrase(T, N, r.b)}.`;
    case 'onlyif': return `${cap(phrase(T, N, r.a))} only if ${phrase(T, N, r.b)}.`;
    case 'unless': return `Unless ${phrase(T, N, flipLit(r.a))}, ${phrase(T, N, r.b)}.`;
    case 'never': return `${N[r.a[0]]} and ${N[r.b[0]]} never both ${T[2]}.`;
    case 'least': return `At least one of ${N[r.a[0]]} and ${N[r.b[0]]} ${T[0]}.`;
    default: return null;
  }
}
function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function kindShapeOk(r) {
  if (r.k === 'never') return r.a[1] === 1 && r.b[1] === 0;
  if (r.k === 'least' || r.k === 'unless') return r.a[1] === 0 && r.b[1] === 1;
  if (r.k === 'onlyif') return r.a[1] === 1;
  return r.k === 'if';
}
function stmtWords(T, N, s) {
  if (s.k === 'lit') return `${phrase(T, N, s.a)}.`;
  if (s.k === 'if') return `If ${phrase(T, N, s.a)}, ${phrase(T, N, s.b)}.`;
  const p = s.a[1] >= s.b[1] ? s.a : s.b; const q = p === s.a ? s.b : s.a;
  if (p[1] && q[1]) return `${N[p[0]]} and ${N[q[0]]} both ${T[2]}.`;
  if (!p[1] && !q[1]) return `${N[p[0]]} and ${N[q[0]]} both ${T[3]}.`;
  return `${phrase(T, N, p)}, but ${phrase(T, N, q)}.`;
}

// Is from -> to a step licensed by rule i, and in which direction?
function stepLabel(rules, from, to) {
  const out = [];
  rules.forEach((r, i) => {
    const sym = r.k === 'never' || r.k === 'least';
    if (eq(from, r.a) && eq(to, r.b)) out.push(`R${i + 1}`);
    if (eq(from, flipLit(r.b)) && eq(to, flipLit(r.a))) out.push(sym ? `R${i + 1}` : `R${i + 1} flip`);
  });
  return out;
}
function chainOk(p, rules, steps, startBy, start) {
  if (!Array.isArray(steps) || steps.length < 2) return 'chain too short';
  if (steps[0].by !== startBy) return `chain starts with "${steps[0].by}", want "${startBy}"`;
  if (!eq(steps[0].l, start)) return 'chain starts at the wrong literal';
  for (let i = 1; i < steps.length; i++) {
    const labels = stepLabel(rules, steps[i - 1].l, steps[i].l);
    if (!labels.length) return `step ${i} is not a rule`;
    if (!labels.includes(steps[i].by)) return `step ${i} labelled ${steps[i].by}, rules say ${labels.join('/')}`;
  }
  return null;
}
const last = (steps) => steps[steps.length - 1].l;

const firstDate = PUZZLES[0] && PUZZLES[0].live;
const themeSeen = new Map();
PUZZLES.forEach((p, idx) => {
  // dates
  const d = new Date(`${firstDate}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + idx);
  const iso = d.toISOString().slice(0, 10);
  if (p.live !== iso) fail(p, `live ${p.live}, expected ${iso}`);
  if (p.num !== idx + 1) fail(p, `num ${p.num}, expected ${idx + 1}`);
  const [y, m, dd] = iso.split('-').map(Number);
  if (p.quizId !== `ergo-${m}-${dd}-${String(y).slice(2)}`) fail(p, 'quizId does not match the date');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (p.dateLabel !== label) fail(p, `dateLabel "${p.dateLabel}"`);
  const dow = d.getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(p, 'sunday flag does not match the weekday');
  if ('sunday' in p && p.sunday !== true) fail(p, 'sunday present but not true');

  // theme spacing
  const T = THEMES[p.theme];
  if (!T) { fail(p, `unknown theme ${p.theme}`); return; }
  if (themeSeen.has(p.theme) && idx - themeSeen.get(p.theme) < 4) fail(p, `theme ${p.theme} again inside four days`);
  themeSeen.set(p.theme, idx);
  if (p.verbs.pos !== T[0] || p.verbs.neg !== T[1]) fail(p, 'verbs do not match theme');

  // ramp
  const [n, r, kinds] = RAMP[dow];
  const N = p.names;
  if (!Array.isArray(N) || N.length !== n || new Set(N).size !== n) fail(p, `cast should be ${n} distinct names`);
  if (p.rules.length !== r) fail(p, `${p.rules.length} rules, want ${r}`);
  const list = `${N.slice(0, -1).join(', ')} and ${N[N.length - 1]}`;
  if (typeof p.setup !== 'string' || !p.setup.includes(`: ${list}. Each one either `) || !p.setup.endsWith(`${T[0]} or ${T[1]}. These rules always hold.`)) fail(p, 'setup line does not name the cast and the two choices');
  const pairs = new Set();
  p.rules.forEach((ru, i) => {
    if (!isLit(ru.a, n) || !isLit(ru.b, n) || ru.a[0] === ru.b[0]) { fail(p, `rule ${i + 1} malformed`); return; }
    if (!kinds.includes(ru.k)) fail(p, `rule ${i + 1} kind ${ru.k} not allowed on this weekday`);
    if (!kindShapeOk(ru)) fail(p, `rule ${i + 1} clause does not fit its kind`);
    const pr = [ru.a[0], ru.b[0]].sort().join('-');
    if (pairs.has(pr)) fail(p, `two rules on the same pair (${pr})`);
    pairs.add(pr);
    if (ru.text !== ruleWords(T, N, ru)) fail(p, `rule ${i + 1} text "${ru.text}" should be "${ruleWords(T, N, ru)}"`);
    const flip = `If ${phrase(T, N, flipLit(ru.b))}, ${phrase(T, N, flipLit(ru.a))}.`;
    if (ru.flip !== flip) fail(p, `rule ${i + 1} flip text wrong`);
  });
  const rules = p.rules;
  if (!isLit(p.given, n)) { fail(p, 'given malformed'); return; }
  if (p.givenText !== `${phrase(T, N, p.given)}.`) fail(p, 'givenText wrong');

  // worlds
  const ok = (w) => rules.every((ru) => !truth(w, ru.a) || truth(w, ru.b));
  const all = []; for (let w = 0; w < (1 << n); w++) if (ok(w)) all.push(w);
  const W = all.filter((w) => truth(w, p.given));
  if (!W.length) { fail(p, 'no world survives the fact'); return; }
  for (let v = 0; v < n; v++) {
    const on = all.filter((w) => (w >>> v) & 1).length;
    if (on === 0 || on === all.length) fail(p, `${N[v]} is decided by the rules alone`);
  }
  let forced = 0, free = 0;
  for (let v = 0; v < n; v++) {
    if (v === p.given[0]) continue;
    const on = W.filter((w) => (w >>> v) & 1).length;
    if (on === 0 || on === W.length) forced++; else free++;
  }
  if (forced < 2 || free < 2) fail(p, `fact leaves ${forced} forced, ${free} free`);

  // statements
  const want = dow === 0 ? 12 : 9;
  if (p.statements.length !== want) fail(p, `${p.statements.length} statements, want ${want}`);
  const counts = { must: 0, could: 0, cannot: 0 };
  const seen = new Set(); const litVars = new Set();
  let traps = 0, flipMust = 0;
  p.statements.forEach((s, i) => {
    const tag = `statement ${i + 1}`;
    if (!['lit', 'if', 'and'].includes(s.k) || !isLit(s.a, n) || (s.k !== 'lit' && (!isLit(s.b, n) || s.b[0] === s.a[0]))) { fail(p, `${tag} malformed`); return; }
    if (s.a[0] === p.given[0] || (s.b && s.b[0] === p.given[0])) fail(p, `${tag} is about the person in the fact`);
    if (s.text !== stmtWords(T, N, s)) fail(p, `${tag} text "${s.text}" should be "${stmtWords(T, N, s)}"`);
    const key = s.k === 'and' ? `and|${[String(s.a), String(s.b)].sort().join('|')}` : `${s.k}|${s.a}|${s.b || ''}`;
    if (seen.has(key)) fail(p, `${tag} repeats another`);
    seen.add(key);
    if (s.k === 'lit') { if (litVars.has(s.a[0])) fail(p, `${tag} names a person already asked about`); litVars.add(s.a[0]); }
    if (s.k === 'if' && rules.some((ru, ri) => stepLabel([ru], s.a, s.b).some((x) => !x.endsWith('flip') && eq(s.a, ru.a)))) fail(p, `${tag} restates a rule`);
    if (s.k === 'and' && rules.some((ru) => ru.k === 'never' && ((eq(s.a, ru.a) && eq(s.b, flipLit(ru.b))) || (eq(s.b, ru.a) && eq(s.a, flipLit(ru.b)))))) fail(p, `${tag} restates a never-both rule`);
    // verdict by enumeration. "If A, B" is judged only over the lineups where
    // A happens (the conditional reading), and A must be possible today.
    const V = s.k === 'if' ? W.filter((w) => truth(w, s.a)) : W;
    if (!V.length) { fail(p, `${tag} has a first half that cannot happen today`); return; }
    const val = (w) => (s.k === 'lit' ? truth(w, s.a) : s.k === 'if' ? truth(w, s.b) : (truth(w, s.a) && truth(w, s.b)));
    const t = V.filter(val).length;
    const v = t === V.length ? 'must' : t === 0 ? 'cannot' : 'could';
    counts[v]++;
    // the proof
    const why = s.why || {};
    let claimed = null, err = null;
    if (why.t === 'free') claimed = 'could';
    else if (why.t === 'chain') {
      const st = why.steps;
      if (s.k === 'lit') {
        err = chainOk(p, rules, st, 'given', p.given);
        if (!err) claimed = eq(last(st), s.a) ? 'must' : eq(last(st), flipLit(s.a)) ? 'cannot' : null;
      } else if (s.k === 'if' && st && st[0] && st[0].by === 'given') {
        // today's fact rules the second half out (the first half is possible,
        // checked above), so no lineup with the first half has the second
        err = chainOk(p, rules, st, 'given', p.given);
        if (!err) claimed = eq(last(st), flipLit(s.b)) ? 'cannot' : null;
      } else if (s.k === 'if') {
        err = chainOk(p, rules, st, 'if', s.a);
        if (!err) claimed = eq(last(st), s.b) ? 'must' : eq(last(st), flipLit(s.b)) ? 'cannot' : null;
        if (claimed === 'must' && st.some((x) => String(x.by).endsWith('flip'))) flipMust++;
      } else if (st && st[0] && st[0].by === 'and') {
        err = chainOk(p, rules, st, 'and', s.a);
        if (!err) claimed = eq(last(st), flipLit(s.b)) ? 'cannot' : null;
      } else {
        err = chainOk(p, rules, st, 'given', p.given);
        if (!err) claimed = (eq(last(st), flipLit(s.a)) || eq(last(st), flipLit(s.b))) ? 'cannot' : null;
      }
    } else if (why.t === 'pair') {
      const e1 = chainOk(p, rules, why.a, 'given', p.given), e2 = chainOk(p, rules, why.b, 'given', p.given);
      err = e1 || e2;
      if (!err) {
        if (s.k === 'and' && eq(last(why.a), s.a) && eq(last(why.b), s.b)) claimed = 'must';
        if (s.k === 'if' && eq(last(why.a), s.a) && eq(last(why.b), flipLit(s.b))) claimed = 'cannot';
      }
    } else if (why.t === 'trap') {
      if (s.k !== 'if') err = 'trap on a non-if statement';
      else {
        const back = !chainOk(p, rules, why.steps, 'if', s.b) && eq(last(why.steps), s.a);
        const inv = !chainOk(p, rules, why.steps, 'if', flipLit(s.a)) && eq(last(why.steps), flipLit(s.b));
        if (!back && !inv) err = 'trap chain is neither the converse nor the inverse';
        else { claimed = 'could'; traps++; }
      }
    } else err = `unknown why type ${why.t}`;
    if (err) fail(p, `${tag} proof: ${err}`);
    else if (claimed !== v) fail(p, `${tag} proof says ${claimed}, enumeration says ${v}`);
  });
  const minEach = dow === 0 ? 3 : 2;
  for (const [k, c] of Object.entries(counts)) if (c < minEach) fail(p, `only ${c} ${k} statements`);
  if (!traps) fail(p, 'no converse/inverse trap');
  if (!flipMust) fail(p, 'no must-be-true conditional that needs a flipped rule');
});

if (fails.length) {
  console.error(`verify-ergo: ${fails.length} failure(s)`);
  fails.slice(0, 60).forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log(`verify-ergo: ${PUZZLES.length} boards ok, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);
