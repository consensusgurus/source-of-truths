// WHERE THE CURSOR GOES NEXT in Anon, and the passage split into words.
//
// Pure, and in its own file for one reason: `move` used to live inside
// AnonClient, so the only thing a checker could do about it was grep the source
// for a regex. Everything here runs against a real board in
// scripts/verify-anon-typing.mjs instead.
//
// THE TWO HALVES READ IN TWO DIFFERENT ORDERS, and that is the whole point.
// Anon shows every letter twice. A bank row is a WORD: its cells are scattered
// through the passage and its own order is the only one that spells anything,
// so typing there walks the answer. The passage is a SENTENCE: its order is
// left to right, and the answer that owns one letter is almost never the answer
// that owns the letter beside it.
//
// Both halves used to advance the same way — along the answer — so a player
// reading the passage typed one letter and the cursor leapt to wherever that
// answer's next cell happened to be, usually a line away. Filling in a word he
// could SEE cost a click per letter (Rookie, 2026-09-11). Direction now follows
// the half being worked, which is what every acrostic does and what the old
// comment on `move` already half-said: "you are reading a sentence, so that is
// the direction the eye is already going."

// The cell the cursor lands on when it moves by `d` (+1 typing, -1 deleting)
// from cell `n`, in half `h` ('q' passage, 'b' bank).
//
// Passage: the next letter of the passage, full stop. Cells are numbered in
// passage order and spaces take no cell, so +1 runs to the end of a word and
// then into the first letter of the next one, which is where the eye already
// is. Clamped at both ends rather than wrapping: a passage has a last letter.
//
// Bank: the next letter of the ANSWER, and when that runs out it falls into the
// passage exactly as it always did, so walking off the end of a bank row still
// lands somewhere real instead of stopping dead.
export function nextCell(h, n, d, { A, owner, oidx, N }) {
  const clamp = (i) => Math.max(0, Math.min(N - 1, i));
  if (h === 'q') return clamp(n + d);
  const a = A[owner[n]];
  const i = oidx[n] + d;
  return (i >= 0 && i < a.c.length) ? a.c[i] : clamp(n + d);
}

// The passage split into words: each word a list of { n } letter cells and
// { p } punctuation marks, in order. Lifted out of AnonClient unchanged so the
// word index below is built from the same tokens the passage renders from.
export function passageTokens(q) {
  const tokens = [];
  let word = null, ci = 0;
  for (const ch of q) {
    if (ch === ' ') { word = null; continue; }
    if (!word) { word = []; tokens.push(word); }
    if (/[a-z]/i.test(ch)) word.push({ n: ci++ });
    else word.push({ p: ch });
  }
  return tokens;
}

// Which word each cell sits in, and each word's first cell. The dock's stepper
// moves by ANSWER while the bank is the half being worked and by WORD while the
// passage is, because a control that says "next" should step the thing on
// screen. A token carrying nothing but punctuation (an em dash standing alone)
// is not a word and takes no index, so `first` and `of` agree on the count.
export function wordIndex(tokens) {
  const first = [], of = [];
  for (const tk of tokens) {
    const cells = tk.filter((t) => t.p === undefined);
    if (!cells.length) continue;
    const wi = first.length;
    first.push(cells[0].n);
    for (const t of cells) of[t.n] = wi;
  }
  return { first, of };
}
