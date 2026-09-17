// CRIB — the cribbage scorer and the throw valuation, shared by the generator
// (scripts/gen-crib.mjs) and the browser (app/crib/CribClient.jsx). The
// verifier (scripts/verify-crib.mjs) deliberately does NOT import this file: it
// carries its own scorer and its own valuation, so a bug here cannot agree with
// itself.
//
// A card is an integer 0..51: rank = card % 13 (0 = ace ... 12 = king),
// suit = floor(card / 13) (0 clubs, 1 diamonds, 2 hearts, 3 spades).
//
// THE VALUE OF A THROW, which is the whole game and is stated to the player in
// exactly these words:
//   the points your four kept cards average over all 46 cut cards,
//   plus the crib's average if the crib is yours, minus it if it is theirs,
//   where the crib's average runs over every cut card AND every pair of the
//   45 cards your opponent might throw, all weighted equally.
// It is a definition, not a model of any particular opponent, and it is exact.

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['♣', '♦', '♥', '♠'];
export const SUIT_NAMES = ['clubs', 'diamonds', 'hearts', 'spades'];
export const rankOf = (c) => c % 13;
export const suitOf = (c) => (c / 13) | 0;
export const cardName = (c) => `${RANKS[rankOf(c)]}${SUITS[suitOf(c)]}`;
const PIPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
export const pipOf = (c) => PIPS[c % 13];

// Fifteens over five cards: every subset of 2..5 cards whose pips total 15
// scores 2. Counted by a subset-sum over the pip values.
function fifteens(pips) {
  // ways[t] = number of subsets (including the empty one) summing to t
  const ways = new Int32Array(16);
  ways[0] = 1;
  for (const p of pips) {
    for (let t = 15; t >= p; t--) ways[t] += ways[t - p];
  }
  return ways[15] * 2;
}

// Pairs and runs read off a rank histogram.
function pairsAndRuns(ranks) {
  const cnt = new Int32Array(13);
  for (const r of ranks) cnt[r]++;
  let pts = 0;
  for (let r = 0; r < 13; r++) if (cnt[r] > 1) pts += cnt[r] * (cnt[r] - 1); // n choose 2, times 2
  // Runs: the longest stretch of consecutive ranks of length >= 3, scored as
  // its length times the product of the multiplicities (double runs etc.).
  let r = 0;
  while (r < 13) {
    if (!cnt[r]) { r++; continue; }
    let len = 0, mult = 1;
    while (r + len < 13 && cnt[r + len]) { mult *= cnt[r + len]; len++; }
    if (len >= 3) pts += len * mult;
    r += len;
  }
  return pts;
}

// Score four kept cards plus the cut. `crib` changes only the flush rule: a
// hand flush counts with four cards (five if the cut matches), a crib flush
// needs all five.
export function scoreHand(four, cut, crib = false) {
  const ranks = [rankOf(four[0]), rankOf(four[1]), rankOf(four[2]), rankOf(four[3]), rankOf(cut)];
  const pips = [pipOf(four[0]), pipOf(four[1]), pipOf(four[2]), pipOf(four[3]), pipOf(cut)];
  let pts = fifteens(pips) + pairsAndRuns(ranks);
  const s0 = suitOf(four[0]);
  if (suitOf(four[1]) === s0 && suitOf(four[2]) === s0 && suitOf(four[3]) === s0) {
    if (suitOf(cut) === s0) pts += 5;
    else if (!crib) pts += 4;
  }
  // His nobs: the jack of the cut card's suit among the four.
  const cs = suitOf(cut);
  for (const c of four) if (rankOf(c) === 10 && suitOf(c) === cs) { pts += 1; break; }
  return pts;
}

// The breakdown the reveal prints under a hand, in the order a player counts.
export function scoreParts(four, cut, crib = false) {
  const ranks = [...four, cut].map(rankOf);
  const pips = [...four, cut].map(pipOf);
  const parts = [];
  const f = fifteens(pips);
  if (f) parts.push({ k: 'fifteens', v: f });
  const cnt = new Array(13).fill(0);
  for (const r of ranks) cnt[r]++;
  let pairs = 0;
  for (let r = 0; r < 13; r++) if (cnt[r] > 1) pairs += cnt[r] * (cnt[r] - 1);
  if (pairs) parts.push({ k: 'pairs', v: pairs });
  const pr = pairsAndRuns(ranks) - pairs;
  if (pr) parts.push({ k: 'runs', v: pr });
  const s0 = suitOf(four[0]);
  if (four.every((c) => suitOf(c) === s0)) {
    if (suitOf(cut) === s0) parts.push({ k: 'flush', v: 5 });
    else if (!crib) parts.push({ k: 'flush', v: 4 });
  }
  if (four.some((c) => rankOf(c) === 10 && suitOf(c) === suitOf(cut))) parts.push({ k: 'nobs', v: 1 });
  return parts;
}

// The fifteen ways to throw two of six, in a fixed order: pairs of indices
// (i, j) with i < j, lexicographic. A throw's id is its position here.
export const THROWS = (() => {
  const out = [];
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) out.push([i, j]);
  return out;
})();

// Value every throw of a six-card hand. Returns an array aligned with THROWS:
// { hand, crib, value } where hand and crib are the two averages and value is
// hand + crib (yours) or hand - crib (theirs). Exact to floating point.
export function valueThrows(six, yourCrib) {
  const inHand = new Uint8Array(52);
  for (const c of six) inHand[c] = 1;
  const rest = [];
  for (let c = 0; c < 52; c++) if (!inHand[c]) rest.push(c); // the 46 unseen
  const out = [];
  for (const [i, j] of THROWS) {
    const keep = six.filter((_, k) => k !== i && k !== j);
    const t1 = six[i], t2 = six[j];
    let handSum = 0;
    for (const s of rest) handSum += scoreHand(keep, s, false);
    // Crib: every cut s, then every unordered pair {a, b} of the other 45.
    let cribSum = 0, cribN = 0;
    const four = [t1, t2, 0, 0];
    for (let si = 0; si < rest.length; si++) {
      const s = rest[si];
      for (let ai = 0; ai < rest.length; ai++) {
        if (ai === si) continue;
        four[2] = rest[ai];
        for (let bi = ai + 1; bi < rest.length; bi++) {
          if (bi === si) continue;
          four[3] = rest[bi];
          cribSum += scoreHand(four, s, true);
          cribN++;
        }
      }
    }
    const hand = handSum / rest.length;
    const crib = cribSum / cribN;
    out.push({ hand, crib, value: yourCrib ? hand + crib : hand - crib });
  }
  return out;
}

// Points a throw earns on the day: 2 for the best, 1 within NEAR of it, else 0.
export const NEAR = 0.75;
export function throwPoints(values, t) {
  const best = Math.max(...values.map((v) => v.value));
  const d = best - values[t].value;
  if (d < 1e-9) return 2;
  if (d <= NEAR + 1e-9) return 1;
  return 0;
}

// A deterministic cut for the reveal, off the hand's own cards, so everybody who
// plays the day sees the same one. It is flavour and scores nothing.
export function cutFor(six, seed) {
  let h = 2166136261 >>> 0;
  const str = `${seed}:${six.join(',')}`;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const rest = [];
  for (let c = 0; c < 52; c++) if (!six.includes(c)) rest.push(c);
  return rest[h % rest.length];
}
