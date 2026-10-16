// Verify the Gift bank (app/gift/puzzles.js) with its OWN solver. Nothing here
// is imported from lib/gift-core.js or scripts/gen-gift.mjs: the rules, the
// piece codes, the lines and the search are all written again below, so a bug
// in the shipped engine cannot vouch for itself.
//
// What it proves, per board:
//   shape     num and date contiguous from launch, quizId and dateLabel match
//             the date, sunday exactly on Sundays, sixteen squares of valid
//             codes, no piece twice, the gift not on the board
//   ramp      pieces on the board and winIn match the weekday (launch day takes
//             Monday's shape)
//   start     no finished line, and the gift wins nowhere on the spot
//   value     the player forces a win on placement winIn, and not sooner
//   unique    every first move searched to the end of the game: the stored key
//             forces a win, and every other first move loses or draws
//   counts    safe and total recomputed
// and, bank-wide, that no position repeats and the bank runs to 2027-01-31.
//
//   node scripts/verify-gift.mjs            (a few seconds)
//   VERIFY_GIFT_BANK=<file> VERIFY_GIFT_ONLY=<num> for the mutation test.
import { pathToFileURL } from 'node:url';

const bankFile = process.env.VERIFY_GIFT_BANK;
const { PUZZLES } = bankFile ? await import(pathToFileURL(bankFile).href) : await import('../app/gift/puzzles.js');
const ONLY = process.env.VERIFY_GIFT_ONLY ? Number(process.env.VERIFY_GIFT_ONLY) : null;

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL ' + msg); };

// ─── pieces and lines, written fresh ───────────────────────────────────────
// A piece is an array of four booleans: [tall, dark, square, hollow].
const LETTERS = [['T', 'S'], ['D', 'L'], ['Q', 'R'], ['H', 'O']];
function decode(code) {
  if (typeof code !== 'string' || code.length !== 4) return null;
  const out = [];
  for (let i = 0; i < 4; i++) {
    if (code[i] === LETTERS[i][0]) out.push(1);
    else if (code[i] === LETTERS[i][1]) out.push(0);
    else return null;
  }
  return out[0] + out[1] * 2 + out[2] * 4 + out[3] * 8; // an index 0..15 for the search
}
const ROWS = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => r * 4 + c));
const COLS = [0, 1, 2, 3].map((c) => [0, 1, 2, 3].map((r) => r * 4 + c));
const DIAG = [[0, 1, 2, 3].map((i) => i * 5), [0, 1, 2, 3].map((i) => 3 + i * 3)];
const ALL_LINES = [...ROWS, ...COLS, ...DIAG];
const traitsOf = (p) => [p & 1, (p >> 1) & 1, (p >> 2) & 1, (p >> 3) & 1];
function lineShares(ps) {
  for (let t = 0; t < 4; t++) {
    const v = traitsOf(ps[0])[t];
    if (ps.every((p) => traitsOf(p)[t] === v)) return true;
  }
  return false;
}
// Would placing p on empty square s finish a line?
function finishes(sq, s, p) {
  for (const line of ALL_LINES) {
    if (!line.includes(s)) continue;
    const ps = line.map((x) => (x === s ? p : sq[x]));
    if (ps.every((q) => q !== null) && lineShares(ps)) return true;
  }
  return false;
}
const anyLine = (sq) => ALL_LINES.some((l) => l.every((x) => sq[x] !== null) && lineShares(l.map((x) => sq[x])));

// ─── the search ────────────────────────────────────────────────────────────
// Two bounded questions, written over per-line state rather than the board:
// each line carries how many pieces it holds and the AND of its pieces' trait
// bits and of their complements, so "does p finish a line through s" is a
// lookup. Answers are memoised per board with the bound they were proved at.
//   canWin(n)   the side to move forces a win on its own n-th placement or sooner
//   mustLose(m) whatever the side to move does, the other side wins on ITS m-th
//               placement or sooner
const LINES_OF = Array.from({ length: 16 }, (_, s) => ALL_LINES.map((l, i) => (l.includes(s) ? i : -1)).filter((i) => i >= 0));
function makeSearch(sq0) {
  const cnt = new Array(10).fill(0), hi = new Array(10).fill(15), lo = new Array(10).fill(15);
  const sq = sq0.slice();
  for (let s = 0; s < 16; s++) if (sq[s] !== null) for (const li of LINES_OF[s]) { cnt[li]++; hi[li] &= sq[s]; lo[li] &= ~sq[s] & 15; }
  const finishesAt = (s, p) => { for (const li of LINES_OF[s]) if (cnt[li] === 3 && ((hi[li] & p) | (lo[li] & ~p & 15))) return true; return false; };
  const put = (s, p) => { sq[s] = p; const saved = []; for (const li of LINES_OF[s]) { saved.push([li, hi[li], lo[li]]); cnt[li]++; hi[li] &= p; lo[li] &= ~p & 15; } return saved; };
  const take = (s, saved) => { sq[s] = null; for (const [li, h, l] of saved) { cnt[li]--; hi[li] = h; lo[li] = l; } };
  const memoW = new Map(), memoL = new Map();
  const keyOf = (hand) => sq.map((p) => (p === null ? '-' : 'abcdefghijklmnop'[p])).join('') + hand;
  const winsSomewhere = (g) => { for (let t = 0; t < 16; t++) if (sq[t] === null && finishesAt(t, g)) return true; return false; };
  const offBoard = (hand) => { const o = []; for (let p = 0; p < 16; p++) if (p !== hand && !sq.includes(p)) o.push(p); return o; };
  function canWin(hand, n) {
    if (n < 1) return false;
    const k = keyOf(hand), e = memoW.get(k);
    if (e && ((e.yes !== undefined && n >= e.yes) || (e.no !== undefined && n <= e.no))) return n >= (e.yes ?? 99);
    const open = []; for (let s = 0; s < 16; s++) if (sq[s] === null) open.push(s);
    let ans = open.some((s) => finishesAt(s, hand));
    if (!ans && n > 1 && open.length > 1) {
      const off = offBoard(hand);
      for (const s of open) {
        const sv = put(s, hand);
        for (const g of off) { if (!winsSomewhere(g) && mustLose(g, n - 1)) { ans = true; break; } }
        take(s, sv);
        if (ans) break;
      }
    }
    const r = memoW.get(k) || {};
    if (ans) r.yes = Math.min(r.yes ?? 99, n); else r.no = Math.max(r.no ?? -1, n);
    memoW.set(k, r);
    return ans;
  }
  function mustLose(hand, m) {
    if (m < 1) return false;
    const k = keyOf(hand), e = memoL.get(k);
    if (e && ((e.yes !== undefined && m >= e.yes) || (e.no !== undefined && m <= e.no))) return m >= (e.yes ?? 99);
    const open = []; for (let s = 0; s < 16; s++) if (sq[s] === null) open.push(s);
    let ans = open.length > 1 && !open.some((s) => finishesAt(s, hand));
    if (ans) {
      const off = offBoard(hand);
      outer: for (const s of open) {
        const sv = put(s, hand);
        for (const g of off) { if (!winsSomewhere(g) && !canWin(g, m)) { ans = false; take(s, sv); break outer; } }
        take(s, sv);
      }
    }
    const r = memoL.get(k) || {};
    if (ans) r.yes = Math.min(r.yes ?? 99, m); else r.no = Math.max(r.no ?? -1, m);
    memoL.set(k, r);
    return ans;
  }
  return { canWin, mustLose, put, take, winsSomewhere };
}
const DEEP = 9;

// ─── the ramp, restated ────────────────────────────────────────────────────
const RAMP = { 1: [9, 2], 2: [8, 2], 3: [8, 3], 4: [8, 4], 5: [7, 3], 6: [7, 4], 0: [7, 5] };
const LAUNCH = [9, 2];
const FIRST = '2026-10-16';
const LAST_AT_LEAST = '2027-01-31';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const seen = new Set();
const t0 = Date.now();
PUZZLES.forEach((p, i) => {
  const live = addDays(FIRST, i);
  if (p.num !== i + 1) fail(`#${i + 1}: num is ${p.num}`);
  if (p.live !== live) fail(`#${p.num}: live ${p.live}, expected ${live}`);
  const [y, m, d] = live.split('-').map(Number);
  if (p.quizId !== `gift-${m}-${d}-${String(y).slice(2)}`) fail(`#${p.num}: quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`#${p.num}: dateLabel ${p.dateLabel}`);
  const dow = new Date(live + 'T12:00:00Z').getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(`#${p.num}: sunday flag ${p.sunday} on a ${dow === 0 ? 'Sunday' : 'weekday'}`);
  const cells = typeof p.board === 'string' ? p.board.trim().split(/\s+/) : [];
  if (cells.length !== 16) { fail(`#${p.num}: board has ${cells.length} squares`); return; }
  const sq = cells.map((c) => (c === '....' ? null : decode(c)));
  if (cells.some((c, j) => c !== '....' && sq[j] === null)) { fail(`#${p.num}: a bad piece code`); return; }
  const hand = decode(p.hand);
  if (hand === null) { fail(`#${p.num}: bad gift code`); return; }
  const placed = sq.filter((x) => x !== null);
  if (new Set(placed).size !== placed.length) fail(`#${p.num}: a piece is on the board twice`);
  if (placed.includes(hand)) fail(`#${p.num}: the gift is already on the board`);
  const [k, n] = p.num === 1 ? LAUNCH : RAMP[dow];
  if (placed.length !== k) fail(`#${p.num}: ${placed.length} pieces on the board, the ${dow === 0 ? 'Sunday' : 'weekday'} ramp wants ${k}`);
  if (p.winIn !== n) fail(`#${p.num}: winIn ${p.winIn}, the ramp wants ${n}`);
  const id = p.board + '|' + p.hand;
  if (seen.has(id)) fail(`#${p.num}: position repeats`);
  seen.add(id);
  if (anyLine(sq)) fail(`#${p.num}: a line is already finished`);
  for (let s = 0; s < 16; s++) if (sq[s] === null && finishes(sq, s, hand)) { fail(`#${p.num}: the gift wins on the spot`); break; }
  if (!Number.isInteger(p.keySq) || p.keySq < 0 || p.keySq > 15 || sq[p.keySq] !== null) { fail(`#${p.num}: keySq ${p.keySq} is not an empty square`); return; }
  const give = decode(p.keyGive);
  if (give === null || give === hand || placed.includes(give)) { fail(`#${p.num}: keyGive ${p.keyGive} is not a piece still off the board`); return; }

  if (ONLY !== null && p.num !== ONLY) return;
  // ── the proofs
  const X = makeSearch(sq);
  if (!X.canWin(hand, p.winIn)) fail(`#${p.num}: no forced win by placement ${p.winIn}`);
  else if (p.winIn > 1 && X.canWin(hand, p.winIn - 1)) fail(`#${p.num}: a forced win lands sooner than placement ${p.winIn}`);
  let safe = 0, total = 0;
  const winners = [];
  for (let s = 0; s < 16; s++) {
    if (sq[s] !== null) continue;
    for (let g = 0; g < 16; g++) {
      if (g === hand || placed.includes(g)) continue;
      total++;
      const sv = X.put(s, hand);
      if (!X.winsSomewhere(g)) {
        safe++;
        if (X.mustLose(g, DEEP)) winners.push([s, g]);
      }
      X.take(s, sv);
    }
  }
  if (safe !== p.safe) fail(`#${p.num}: safe ${p.safe}, recomputed ${safe}`);
  if (total !== p.total) fail(`#${p.num}: total ${p.total}, recomputed ${total}`);
  if (winners.length !== 1) fail(`#${p.num}: ${winners.length} first moves force a win, the claim is exactly one`);
  else if (winners[0][0] !== p.keySq || winners[0][1] !== give) fail(`#${p.num}: the winning first move is square ${winners[0][0]}, not the stored key`);
});
if (PUZZLES.length && PUZZLES[PUZZLES.length - 1].live < LAST_AT_LEAST) fail(`the bank ends ${PUZZLES[PUZZLES.length - 1].live}, before ${LAST_AT_LEAST}`);

console.log(`verify-gift: ${PUZZLES.length} boards, ${failures} failures (${Math.round((Date.now() - t0) / 1000)}s)`);
process.exit(failures ? 1 : 0);
