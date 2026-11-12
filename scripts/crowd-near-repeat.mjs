// scripts/crowd-near-repeat.mjs — the NEAR-repeat screen for the crowd games'
// authored prompts (Feud, Outwit). Added 2026-11-12 with the December segment.
//
// Both generators already refuse an EXACT repeat (compared on a normalized
// string), and both verifiers refuse one bank-wide. Neither could see a prompt
// that says the same thing in different words: "Name a food people grill
// outdoors." and "Name something people grill." normalize to two different
// strings, so a pool authored against a 600-prompt bank could quietly re-ask
// it. This module compares CONTENT words instead.
//
//   contentKey(q)  lowercases, drops punctuation, drops the house template and
//                  filler words (STOP below), and folds a trailing plural, so
//                  "Name a reason people skip breakfast." is {reason, skip,
//                  breakfast}.
//   nearRepeat(a, b) is true when both content sets hold 2+ words and
//                  * are identical, or
//                  * overlap with Jaccard >= JACCARD (0.75), or
//                  * the smaller one has 2+ words and sits wholly inside the
//                    larger (a narrower prompt re-asking a broader one), and
//                    the larger has at most one word more.
//
// It is a SCREEN, deliberately conservative: it flags the pairs a careful editor
// would call the same question, and the author still reads every new prompt
// against its nearest banked neighbors (nearest() returns them for that). The
// thresholds were set by running it over the frozen banks: at these values it
// flags pairs like "Name a drink people order at a coffee shop." against "Name a
// drink people order at a bar." only when the content words truly coincide.
// Proved by injection (see the lane-f report of 2026-11-12).
const STOP = new Set([
  // template
  'name', 'something', 'people', 'person', 'thing', 'things', 'one', 'which', 'will', 'fewest', 'most',
  'players', 'player', 'pick', 'picked', 'answer', 'match', 'rarest', 'wins', 'win', 'everyone',
  'how', 'many', 'much', 'what', 'does', 'do', 'did', 'is', 'are', 'was', 'were', 'be', 'been',
  // filler
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'from', 'by', 'as',
  'that', 'this', 'these', 'those', 'their', 'they', 'them', 'there', 'it', 'its', 'you', 'your',
  'when', 'while', 'who', 'whose', 'than', 'then', 'into', 'out', 'up', 'off', 'over', 'about',
  'always', 'every', 'all', 'some', 'any', 'just', 'still', 'even', 'really', 'very', 'too', 'so',
  'can', 'cant', 'could', 'would', 'should', 'get', 'gets', 'got', 'have', 'has', 'had', 'make', 'makes',
  'say', 'says', 'use', 'uses', 'often', 'usually', 'never', 'ever', 'almost', 'way', 'not', 'no',
  'but', 'if', 'own', 'like', 'other', 'another', 'more', 'less', 'only', 'again', 'right',
  // contractions, after the apostrophe is dropped
  'youd', 'youll', 'youre', 'youve', 'theyd', 'theyll', 'theyre', 'theyve', 'dont', 'doesnt', 'didnt',
  'wont', 'isnt', 'arent', 'im', 'ive', 'id', 'its', 'thats', 'whats', 'theres', 'lets',
  // place words that carry no topic of their own
  'under', 'inside', 'around', 'during', 'before', 'after', 'without', 'instead', 'besides',
  // the verbs a crowd prompt hangs its noun on ("Everyone TAKES one cookie",
  // "Everyone PICKS one cookie"): added 2026-11-12 after that pair slipped past
  'take', 'takes', 'choose', 'chooses', 'picks', 'gets', 'grab', 'grabs', 'everyone',
]);

const fold = (w) => (w.length > 4 && /[^s]s$/.test(w) ? w.slice(0, -1) : w.replace(/ies$/, 'y'));

export function contentKey(q) {
  const words = String(q).toLowerCase().replace(/['’]/g, '')
    .replace(/\bwi[\s-]?fi\b/g, 'wifi').replace(/\be[\s-]mail/g, 'email')
    .replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(words.filter((w) => !STOP.has(w)).map(fold));
}

export const JACCARD = 0.75;

export function similarity(a, b) {
  const A = a instanceof Set ? a : contentKey(a);
  const B = b instanceof Set ? b : contentKey(b);
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return { inter, union, jac: union ? inter / union : 1, A, B };
}

export function nearRepeat(a, b) {
  const { inter, jac, A, B } = similarity(a, b);
  // One content word on either side is too little to call a repeat on.
  if (A.size < 2 || B.size < 2) return false;
  if (jac >= JACCARD) return true;
  const [S, L] = A.size <= B.size ? [A, B] : [B, A];
  return S.size >= 2 && inter === S.size && L.size - S.size <= 1;
}

// The k banked prompts most like q, for the author to read by eye.
export function nearest(q, bank, k = 3) {
  const A = contentKey(q);
  return bank.map((b) => ({ b, ...similarity(A, contentKey(b)) }))
    .sort((x, y) => y.jac - x.jac).slice(0, k).map((x) => ({ q: x.b, jac: +x.jac.toFixed(2) }));
}

// ── ANSWER overlap (Feud), added 2026-11-12 after review ─────────────────────
// Two prompts can share no content word and still be one question: "Name
// something people keep in the glove compartment." against "Name something
// you'd find in a car's glovebox.", or "a food that's messy to eat on a first
// date" against "a food that's impossible to eat gracefully". What gives them
// away is the answer board: seven of eight buckets land in each other. So for
// Feud, near-repeat also means: at least ANSWER_MIN labels of each prompt land
// in a bucket of the other (through the real matcher, both directions, the
// smaller count taken) AND that is at least ANSWER_SHARE of the smaller board.
// Calibrated on the 765-prompt bank: at 6 and 0.85 it flags the two December
// repeats the review found plus burrito/taco, and three frozen pairs.
export const ANSWER_MIN = 6;
export const ANSWER_SHARE = 0.85;
// a, b: { labels: string[], bucketOf(text) } ; bucketOf from lib/feud-match.js
export function answerNearRepeat(a, b) {
  const land = (labels, m) => labels.filter((l) => { const g = m.bucketOf(l); return g && g.startsWith('c'); }).length;
  const need = Math.max(ANSWER_MIN, Math.ceil(ANSWER_SHARE * Math.min(a.labels.length, b.labels.length)));
  if (a.labels.length < need || b.labels.length < need) return false;
  if (land(a.labels, b) < need) return false;   // cheap direction first
  return land(b.labels, a) >= need;
}
