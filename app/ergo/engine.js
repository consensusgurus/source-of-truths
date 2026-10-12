// Ergo's browser engine. The bank carries no answer key: the verdict for each
// statement is derived here by enumerating every way the cast can split that
// the rules and today's fact allow (at most 2^7 = 128), exactly as
// scripts/verify-ergo.mjs does it with its own code.

// The three bins wear the stage's own accent family, told apart by FILL rather
// than by three unrelated hues (owner, 2026-10-11): must is the solid category
// step, could its tint, cannot an outline. The CSS lives in ErgoClient (.b-*).
export const BINS = [
  { key: 'must', label: 'Must be true', short: 'Must' },
  { key: 'could', label: 'Could be true', short: 'Could' },
  { key: 'cannot', label: 'Cannot be true', short: 'Cannot' },
];
export const BIN_LABEL = { must: 'Must be true', could: 'Could be true', cannot: 'Cannot be true' };

const holds = (w, l) => ((w >>> l[0]) & 1) === l[1];

export function worldsFor(p) {
  const n = p.names.length;
  const out = [];
  for (let w = 0; w < (1 << n); w++) {
    if (!holds(w, p.given)) continue;
    if (p.rules.every((r) => !holds(w, r.a) || holds(w, r.b))) out.push(w);
  }
  return out;
}

// "If A, B" is judged ONLY over the lineups where A happens (owner fix,
// 2026-10-12). The plain material reading counted it true in every lineup
// without A, so "If Eva sits, Bram sits" came out could on a day Bram must
// start. The bank never asks an "if" whose first half is impossible today.
function truthOf(s, w) {
  if (s.k === 'lit') return holds(w, s.a);
  if (s.k === 'if') return holds(w, s.b);
  return holds(w, s.a) && holds(w, s.b);
}

export function solveDay(p) {
  const W = worldsFor(p);
  const keys = p.statements.map((s) => {
    const V = s.k === 'if' ? W.filter((w) => holds(w, s.a)) : W;
    let t = 0;
    for (const w of V) if (truthOf(s, w)) t++;
    return t === V.length ? 'must' : t === 0 ? 'cannot' : 'could';
  });
  return { worlds: W.length, keys };
}

// "Ellis testifies" / "Ellis stays silent".
export function litText(p, l) {
  return `${p.names[l[0]]} ${l[1] ? p.verbs.pos : p.verbs.neg}`;
}

// One plain sentence on top of the chain, so the proof reads as an argument.
export function whyLine(p, s, verdict) {
  const w = s.why || {};
  if (w.t === 'trap') return 'This runs a rule chain backwards. The rules only lead the other way, so when the first half happens the second can, but nothing makes it.';
  if (w.t === 'free') {
    if (s.k === 'if') return 'Nothing ties the two halves together. When the first half happens, the second sometimes does and sometimes does not.';
    if (s.k === 'and') return 'Both halves can happen together, and need not.';
    return 'Nothing forces it either way.';
  }
  if (w.t === 'pair') {
    if (s.k === 'if') return 'The first half is forced, and the second half is ruled out.';
    return 'Both halves are forced.';
  }
  if (s.k === 'lit') return verdict === 'must' ? 'Forced by today’s fact.' : 'Today’s fact rules it out.';
  if (s.k === 'if') {
    const st0 = (w.steps || [])[0];
    if (st0 && st0.by === 'given') return 'The first half can still happen today, but today’s fact rules out the second half.';
    return verdict === 'cannot' ? 'Follow the rules from the first half and you arrive at the opposite of the second.' : 'Follow the rules from the first half and you arrive at the second.';
  }
  const st = w.steps || [];
  if (st[0] && st[0].by === 'and') return 'The first half rules the second out, so never both.';
  return `Today’s fact rules out ${litText(p, [st[st.length - 1].l[0], st[st.length - 1].l[1] ? 0 : 1])}.`;
}
