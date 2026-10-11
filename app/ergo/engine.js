// Ergo's browser engine. The bank carries no answer key: the verdict for each
// statement is derived here by enumerating every way the cast can split that
// the rules and today's fact allow (at most 2^7 = 128), exactly as
// scripts/verify-ergo.mjs does it with its own code.

export const BINS = [
  { key: 'must', label: 'Must be true', short: 'Must', ground: '#1d4ed8' },
  { key: 'could', label: 'Could be true', short: 'Could', ground: '#475569' },
  { key: 'cannot', label: 'Cannot be true', short: 'Cannot', ground: '#b4410c' },
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

function truthOf(s, w) {
  if (s.k === 'lit') return holds(w, s.a);
  if (s.k === 'if') return !holds(w, s.a) || holds(w, s.b);
  return holds(w, s.a) && holds(w, s.b);
}

export function solveDay(p) {
  const W = worldsFor(p);
  const keys = p.statements.map((s) => {
    let t = 0;
    for (const w of W) if (truthOf(s, w)) t++;
    return t === W.length ? 'must' : t === 0 ? 'cannot' : 'could';
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
  if (w.t === 'trap') return 'This runs a rule chain backwards. The rules only lead the other way, so it can happen, but nothing makes it happen.';
  if (w.t === 'free') {
    if (s.k === 'if') return 'Nothing ties the two halves together. Some allowed lineups make it true, some do not.';
    if (s.k === 'and') return 'Both halves can happen together, and need not.';
    return 'Nothing forces it either way.';
  }
  if (w.t === 'pair') {
    if (s.k === 'if') return 'The first half is forced, and the second half is ruled out.';
    return 'Both halves are forced.';
  }
  if (s.k === 'lit') return verdict === 'must' ? 'Forced by today’s fact.' : 'Today’s fact rules it out.';
  if (s.k === 'if') return 'Follow the rules from the first half and you arrive at the second.';
  const st = w.steps || [];
  if (st[0] && st[0].by === 'and') return 'The first half rules the second out, so never both.';
  return `Today’s fact rules out ${litText(p, [st[st.length - 1].l[0], st[st.length - 1].l[1] ? 0 : 1])}.`;
}
