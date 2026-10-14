// HOLD — the daily video poker hold. Shared by the generator
// (scripts/gen-hold.mjs) and the browser (app/hold/HoldClient.jsx). The
// verifier (scripts/verify-hold.mjs) deliberately does NOT import this file:
// it carries its own hand classifier and its own way of counting draws, so a
// bug here cannot agree with itself.
//
// A card is an integer 0..51: rank = card % 13 (0 = ace ... 12 = king),
// suit = floor(card / 13) (0 clubs, 1 diamonds, 2 hearts, 3 spades). The same
// encoding Crib uses.
//
// The game is Jacks or Better on the 9/6 "full pay" table, paid per credit:
// royal flush 800, straight flush 50, four of a kind 25, full house 9,
// flush 6, straight 4, three of a kind 3, two pair 2, a pair of jacks or
// better 1, anything else 0.
//
// A HOLD is a 5-bit mask over the dealt hand: bit i set keeps cards[i]. Its
// value is its EXPECTED RETURN, the average payout over every possible draw of
// the replacement cards from the 47 cards not dealt, all equally likely. That
// is a count, not a simulation: holding k cards there are C(47, 5 - k) draws
// and every one of them is scored.

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['♣', '♦', '♥', '♠'];
export const SUIT_NAMES = ['clubs', 'diamonds', 'hearts', 'spades'];
export const RANK_NAMES = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
export const rankOf = (c) => c % 13;
export const suitOf = (c) => (c / 13) | 0;
export const isRed = (c) => { const s = suitOf(c); return s === 1 || s === 2; };
export const cardName = (c) => `${RANKS[rankOf(c)]}${SUITS[suitOf(c)]}`;
export const cardWords = (c) => `${RANK_NAMES[rankOf(c)]} of ${SUIT_NAMES[suitOf(c)]}`;

// The pay table, best first. `key` is what classify() returns.
export const PAYTABLE = [
  { key: 'royal', name: 'Royal flush', pay: 800 },
  { key: 'sf', name: 'Straight flush', pay: 50 },
  { key: 'quads', name: 'Four of a kind', pay: 25 },
  { key: 'fh', name: 'Full house', pay: 9 },
  { key: 'flush', name: 'Flush', pay: 6 },
  { key: 'straight', name: 'Straight', pay: 4 },
  { key: 'trips', name: 'Three of a kind', pay: 3 },
  { key: 'twopair', name: 'Two pair', pay: 2 },
  { key: 'jacks', name: 'Jacks or better', pay: 1 },
];
export const PAY = Object.fromEntries(PAYTABLE.map((p) => [p.key, p.pay]));
export const HAND_LABEL = Object.fromEntries(PAYTABLE.map((p) => [p.key, p.name]));
HAND_LABEL.nothing = 'No pay';

// Ranks that make a paying pair: jack, queen, king, ace.
export const HIGH = [true, false, false, false, false, false, false, false, false, false, true, true, true];

// STRAIGHT[m] for a 13-bit rank mask (bit r = rank r present): true when the
// five ranks run in sequence, the ace playing low (A2345) or high (10JQKA).
const STRAIGHT = new Uint8Array(8192);
for (let lo = 0; lo <= 8; lo++) STRAIGHT[0x1f << lo] = 1; // A2345 .. 9TJQK
const ROYAL_MASK = (1 << 0) | (1 << 9) | (1 << 10) | (1 << 11) | (1 << 12);
STRAIGHT[ROYAL_MASK] = 1;

// Classify five cards. Returns a PAYTABLE key or 'nothing'.
export function classify(cards) {
  const cnt = new Int8Array(13);
  let m = 0, flush = true;
  const s0 = suitOf(cards[0]);
  for (const c of cards) { const r = rankOf(c); cnt[r]++; m |= 1 << r; if (suitOf(c) !== s0) flush = false; }
  let sq = 0, highPair = false;
  for (let r = 0; r < 13; r++) { sq += cnt[r] * cnt[r]; if (cnt[r] >= 2 && HIGH[r]) highPair = true; }
  if (sq === 5) {
    const st = STRAIGHT[m] === 1;
    if (st && flush) return m === ROYAL_MASK ? 'royal' : 'sf';
    if (flush) return 'flush';
    if (st) return 'straight';
    return 'nothing';
  }
  if (sq === 7) return highPair ? 'jacks' : 'nothing';
  if (sq === 9) return 'twopair';
  if (sq === 11) return 'trips';
  if (sq === 13) return 'fh';
  return 'quads';
}
export const payOf = (cards) => { const k = classify(cards); return k === 'nothing' ? 0 : PAY[k]; };

// Masks: bit i keeps cards[i].
export const MASKS = Array.from({ length: 32 }, (_, i) => i);
export const popcount = (m) => ((m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1) + ((m >> 4) & 1));
export const heldCards = (cards, mask) => cards.filter((_, i) => (mask >> i) & 1);

// C(n, k) for the small numbers this game needs.
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

// ---- the exact expected return of all 32 holds ----------------------------
// One recursive walk per hold over the 47 undealt cards, carrying the hand's
// shape incrementally: S is the sum of the squared rank counts (5 all
// different, 7 one pair, 9 two pair, 11 trips, 13 full house, 17 quads), HP the
// high-pair indicator, M the rank mask, FS the flush suit (-2 empty, -1 mixed).
const cnt = new Int8Array(13);
let DECK_R = null, DECK_S = null, DECK_N = 0, TOTAL = 0;

function leaf(S, HP, M, FS) {
  if (S === 5) {
    const st = STRAIGHT[M] === 1;
    if (FS >= 0) return st ? (M === ROYAL_MASK ? 800 : 50) : 6;
    return st ? 4 : 0;
  }
  if (S === 7) return HP > 0 ? 1 : 0;
  if (S === 9) return 2;
  if (S === 11) return 3;
  if (S === 13) return 9;
  return 25;
}

function walk(start, left, S, HP, M, FS) {
  if (left === 0) { TOTAL += leaf(S, HP, M, FS); return; }
  const last = DECK_N - left;
  for (let i = start; i <= last; i++) {
    const r = DECK_R[i], s = DECK_S[i], c0 = cnt[r];
    cnt[r] = c0 + 1;
    walk(i + 1, left - 1, S + 2 * c0 + 1, HIGH[r] ? HP + 2 * c0 : HP, M | (1 << r), FS === -2 ? s : (FS === s ? s : -1));
    cnt[r] = c0;
  }
}

// Exact EV of every hold (index = mask), as plain floats.
export function holdEVs(cards) {
  const dealt = new Set(cards);
  const deck = [];
  for (let c = 0; c < 52; c++) if (!dealt.has(c)) deck.push(c);
  DECK_N = deck.length;
  DECK_R = Int8Array.from(deck.map(rankOf));
  DECK_S = Int8Array.from(deck.map(suitOf));
  const ev = new Float64Array(32);
  for (let mask = 0; mask < 32; mask++) {
    cnt.fill(0);
    let S = 0, HP = 0, M = 0, FS = -2, k = 0;
    for (let i = 0; i < 5; i++) {
      if (!((mask >> i) & 1)) continue;
      const c = cards[i], r = rankOf(c), s = suitOf(c), c0 = cnt[r];
      cnt[r] = c0 + 1;
      S += 2 * c0 + 1;
      if (HIGH[r]) HP += 2 * c0;
      M |= 1 << r;
      FS = FS === -2 ? s : (FS === s ? s : -1);
      k++;
    }
    TOTAL = 0;
    walk(0, 5 - k, S, HP, M, FS);
    ev[mask] = TOTAL / choose(DECK_N, 5 - k);
  }
  return ev;
}

// The best hold: highest EV; a tie (within 1e-9) goes to the fewest cards,
// then the lowest mask.
export const TIE = 1e-9;
export function bestMask(ev) {
  let best = 0;
  for (let m = 1; m < 32; m++) {
    const d = ev[m] - ev[best];
    if (d > TIE) best = m;
    else if (Math.abs(d) <= TIE) {
      const pm = popcount(m), pb = popcount(best);
      if (pm < pb || (pm === pb && m < best)) best = m;
    }
  }
  return best;
}
// Every hold within 1e-9 of the best: all of them score.
export const isBest = (ev, mask) => ev[mask] >= Math.max(...ev) - TIE;

// ---- the documented naive rule (what makes a hand a TRAP) -----------------
// The rule of thumb most casual players use, written down exactly:
//   1. a paying hand: keep the cards that pay (all five for a straight or
//      better, the four of a kind, the three of a kind, the two pairs, the
//      high pair);
//   2. else any pair: keep it;
//   3. else four to a flush: keep them;
//   4. else four to an outside straight (four in a row that can be finished
//      at either end, so not A234 and not JQKA): keep them;
//   5. else every jack, queen, king and ace; else nothing.
// A hand is a trap when the best hold scores more than this rule's hold.
export function naiveMask(cards) {
  const ranks = cards.map(rankOf);
  const suits = cards.map(suitOf);
  const byRank = new Map();
  ranks.forEach((r, i) => { if (!byRank.has(r)) byRank.set(r, []); byRank.get(r).push(i); });
  const kind = classify(cards);
  const maskOf = (idx) => idx.reduce((m, i) => m | (1 << i), 0);
  if (kind === 'royal' || kind === 'sf' || kind === 'fh' || kind === 'flush' || kind === 'straight') return 31;
  const groups = [...byRank.values()].filter((g) => g.length >= 2);
  if (kind === 'quads' || kind === 'trips' || kind === 'twopair' || kind === 'jacks') return maskOf(groups.flat());
  if (groups.length) return maskOf(groups[0]); // a low pair (a hand with no pay holds exactly one pair)
  for (let s = 0; s < 4; s++) {
    const idx = suits.map((x, i) => (x === s ? i : -1)).filter((i) => i >= 0);
    if (idx.length === 4) return maskOf(idx);
  }
  // Four in a row, open at both ends: lowest rank 2..9 (2345 .. 9TJQ), ace
  // counted as high only, so A234 and JQKA never qualify.
  const hi = ranks.map((r) => (r === 0 ? 13 : r)); // 1..13 with 13 = ace high
  for (let lo = 1; lo <= 8; lo++) {
    const need = [lo, lo + 1, lo + 2, lo + 3];
    if (need.every((r) => hi.includes(r))) return maskOf(need.map((r) => hi.indexOf(r)));
  }
  return maskOf(ranks.map((r, i) => (HIGH[r] ? i : -1)).filter((i) => i >= 0));
}

// Gap: best EV minus the best EV of any hold not tied with it.
export function gapOf(ev) {
  const top = Math.max(...ev);
  let second = -Infinity;
  for (let m = 0; m < 32; m++) if (ev[m] < top - TIE && ev[m] > second) second = ev[m];
  return top - second;
}

// A short description of a hold, for the reveal: "Hold K♥ Q♥", "Draw five".
export function holdLabel(cards, mask) {
  if (mask === 0) return 'Draw five';
  if (mask === 31) return 'Keep all five';
  return `Hold ${heldCards(cards, mask).map(cardName).join(' ')}`;
}

// The flavor draw: the discarded positions fill in order from `draw`, the
// day's fixed replacement order. Luck, scored nothing.
export function drawFor(cards, mask, draw) {
  let k = 0;
  return cards.map((c, i) => ((mask >> i) & 1 ? c : draw[k++]));
}
