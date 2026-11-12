// THE DEFUSE ENGINE: what the manual's rules mean. Shared by the client (which
// prints the rules and judges each cut), the generator and the verifier, so the
// words a player reads and the test their cut is held to come from one place.
//
// A board P is { wires: [color, ...] left to right, serial: 'MX-4827',
// batteries: 1..3, light: { label, on }, rules: [rule, ...], solution: [wire
// index, ...] }. Wire indexes are 0-based in data and 1-based in every word a
// player reads.
//
// THE BASE RULE, printed above the manual: every wire is cut, in the one safe
// order, unless a rule protects it. A rule is { type, cond?, ...params }:
//   keep    { color } | { pos: 'first' | 'last' }   those wires are never cut
//   first   { color, which: 'only' | 'first' | 'last' } | { idx }   the opening cut
//   last    { color }            that color's one wire is the final cut
//   before  { a, b }             every cut a-wire comes before any cut b-wire
//   noAdj   {}                   never cut right beside the wire just cut
//   noSame  { color? }           never two of one color (or of any color) in a row
//   nth     { k, color }         the k-th cut is a wire of that color
//   dir     { color, side }      right after that color, the next cut is on that side
// cond, when present, gates the rule on the device: { c: 'serialOdd' |
// 'serialEven' } | { c: 'batt', n } | { c: 'battMore' } | { c: 'light', on } |
// { c: 'many', color } | { c: 'none', color }. A rule whose condition is false
// does nothing at all: it is a decoy the player has to rule out by reading the
// device.

export const WIRE_COLORS = { red: '#f87171', blue: '#7dd3fc', yellow: '#fde047', white: '#ffffff', black: '#1f2937', green: '#86efac' };
export const WIRE_NAMES = Object.keys(WIRE_COLORS);
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
const NUM = ['no', 'one', 'two', 'three'];

const serialDigit = (P) => Number(String(P.serial).slice(-1));
export function condTrue(P, cond) {
  if (!cond) return true;
  switch (cond.c) {
    case 'serialOdd': return serialDigit(P) % 2 === 1;
    case 'serialEven': return serialDigit(P) % 2 === 0;
    case 'batt': return P.batteries === cond.n;
    case 'battMore': return P.batteries > 1;
    case 'light': return !!P.light.on === !!cond.on;
    case 'many': return P.wires.filter((w) => w === cond.color).length > 1;
    case 'none': return !P.wires.includes(cond.color);
    default: throw new Error(`unknown condition ${cond.c}`);
  }
}
export const activeRules = (P) => P.rules.filter((r) => condTrue(P, r.cond));

// The wire a 'first' rule points at, or -1 when the board has no such wire.
export function pickWire(P, r) {
  if (r.idx != null) return r.idx < P.wires.length ? r.idx : -1;
  const at = P.wires.map((w, i) => (w === r.color ? i : -1)).filter((i) => i >= 0);
  if (!at.length) return -1;
  if (r.which === 'only') return at.length === 1 ? at[0] : -1;
  return r.which === 'last' ? at[at.length - 1] : at[0];
}
const kept = (P, r, i) => (r.color ? P.wires[i] === r.color : r.pos === 'first' ? i === 0 : i === P.wires.length - 1);

// The wires that must be cut: every wire no active keep rule protects.
export function cutSet(P) {
  const keeps = activeRules(P).filter((r) => r.type === 'keep');
  return P.wires.map((_, i) => i).filter((i) => !keeps.some((r) => kept(P, r, i)));
}

// Does rule r hold over the whole order `seq`? (Order rules only.)
function holds(P, r, seq) {
  const col = (i) => P.wires[i];
  switch (r.type) {
    case 'keep': return !seq.some((i) => kept(P, r, i));
    case 'first': return seq[0] === pickWire(P, r);
    case 'last': { const at = seq.filter((i) => col(i) === r.color); return at.length === 1 && seq[seq.length - 1] === at[0]; }
    case 'before': { let seenB = false; for (const i of seq) { if (col(i) === r.b) seenB = true; else if (col(i) === r.a && seenB) return false; } return true; }
    case 'noAdj': return seq.every((i, k) => k === 0 || Math.abs(i - seq[k - 1]) !== 1);
    case 'noSame': return seq.every((i, k) => k === 0 || col(i) !== col(seq[k - 1]) || (r.color && col(i) !== r.color));
    case 'nth': return seq.length >= r.k && col(seq[r.k - 1]) === r.color;
    case 'dir': return seq.every((i, k) => k === 0 || col(seq[k - 1]) !== r.color || (r.side === 'right' ? i > seq[k - 1] : i < seq[k - 1]));
    default: throw new Error(`unknown rule ${r.type}`);
  }
}

// A full order is safe when it cuts exactly the cut set, once each, and every
// active rule holds.
export function safe(P, seq) {
  const need = cutSet(P);
  if (seq.length !== need.length || new Set(seq).size !== seq.length || seq.some((i) => !need.includes(i))) return false;
  return activeRules(P).every((r) => holds(P, r, seq));
}

// Every safe order, up to `cap` of them, by trying each ordering of the cut
// set. `skip` leaves one rule (by its index in P.rules) out, which is how the
// generator and verifier ask whether that rule is doing any work.
export function solutions(P, cap = 2, skip = -1) {
  const need = cutSet(P), rules = P.rules.filter((r, i) => i !== skip && r.type !== 'keep' && condTrue(P, r.cond));
  const out = [], seq = [], used = new Set();
  (function walk() {
    if (out.length >= cap) return;
    if (seq.length === need.length) { if (rules.every((r) => holds(P, r, seq))) out.push(seq.slice()); return; }
    for (const i of need) { if (used.has(i)) continue; used.add(i); seq.push(i); walk(); seq.pop(); used.delete(i); }
  }());
  return out;
}

// THE CUT THE PLAYER JUST MADE: the index in P.rules of the first rule that
// cut breaks on the spot, or -1 when it breaks none outright. `prefix` is every
// cut so far, the new one last. A cut can break nothing outright and still be
// wrong (it leaves no safe way to finish); the client says so in those words.
export function breach(P, prefix) {
  const need = cutSet(P), k = prefix.length, cut = prefix[k - 1], prev = prefix[k - 2], col = (i) => P.wires[i];
  const left = need.filter((i) => !prefix.includes(i));
  for (let x = 0; x < P.rules.length; x++) {
    const r = P.rules[x];
    if (!condTrue(P, r.cond)) continue;
    let bad = false;
    if (r.type === 'keep') bad = kept(P, r, cut);
    else if (r.type === 'first') bad = k === 1 && cut !== pickWire(P, r);
    else if (r.type === 'last') bad = col(cut) === r.color && left.length > 0;
    else if (r.type === 'before') bad = col(cut) === r.b && left.some((i) => col(i) === r.a);
    else if (r.type === 'noAdj') bad = k > 1 && Math.abs(cut - prev) === 1;
    else if (r.type === 'noSame') bad = k > 1 && col(cut) === col(prev) && (!r.color || col(cut) === r.color);
    else if (r.type === 'nth') bad = k === r.k && col(cut) !== r.color;
    else if (r.type === 'dir') bad = k > 1 && col(prev) === r.color && (r.side === 'right' ? cut < prev : cut > prev);
    if (bad) return x;
  }
  return -1;
}

// The rule in the manual's own words. Counts decide singular or plural, so the
// sentence always matches the board it is printed on.
export function ruleText(P, r) {
  const n = (color) => P.wires.filter((w) => w === color).length;
  const the = (color) => (n(color) === 1 ? `the ${color} wire` : `every ${color} wire`);
  let pre = '';
  if (r.cond) {
    const c = r.cond;
    pre = c.c === 'serialOdd' ? 'If the serial ends in an odd digit, '
      : c.c === 'serialEven' ? 'If the serial ends in an even digit, '
      : c.c === 'batt' ? `With exactly ${NUM[c.n]} ${c.n === 1 ? 'battery' : 'batteries'}, `
      : c.c === 'battMore' ? 'With more than one battery, '
      : c.c === 'light' ? `While the ${P.light.label} light is ${c.on ? 'on' : 'off'}, `
      : c.c === 'many' ? `If there is more than one ${c.color} wire, `
      : `If there is no ${c.color} wire, `;
  }
  let body;
  switch (r.type) {
    case 'keep': body = r.color ? `leave ${the(r.color)} uncut` : `leave the ${r.pos} wire uncut`; break;
    case 'first': body = r.idx != null ? `cut wire ${r.idx + 1} first` : r.which === 'only' ? `cut the ${r.color} wire first` : `cut the ${r.which} ${r.color} wire first`; break;
    case 'last': body = `the ${r.color} wire is the final cut`; break;
    case 'before': body = `cut ${the(r.a)} before ${n(r.b) === 1 ? `the ${r.b} wire` : `any ${r.b} wire`}`; break;
    case 'noAdj': body = 'never cut a wire right beside the one you just cut'; break;
    case 'noSame': body = r.color ? `never cut two ${r.color} wires in a row` : 'never cut two wires of the same color in a row'; break;
    case 'nth': body = `the ${ORD[r.k]} cut is a ${r.color} wire`; break;
    case 'dir': body = `right after cutting a ${r.color} wire, the next cut is somewhere to its ${r.side}`; break;
    default: throw new Error(`unknown rule ${r.type}`);
  }
  const s = pre + body + '.';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
