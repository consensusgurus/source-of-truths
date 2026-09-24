// Verify the Cipher bank: every equation must have EXACTLY ONE solution
// (distinct digits, leading letters nonzero), <= 10 distinct letters, ids/dates
// consistent, sunday flags matching the real weekday, and (from the
// addition-only launch on) op "add" with the addend count its weekday calls
// for: 2 on Mon/Tue/Wed, 3 on Thu/Fri/Sat, 4 in the Sunday Edition. Run after
// ANY edit:
//   node scripts/verify-cipher.mjs
import { PUZZLES } from '../app/cipher/puzzles.js';

// Linear ops (add/sub) — signed-coefficient DFS with bound pruning. `signs`
// gives the coefficient sign per word: addition is [1,1,...,-1] (addends minus
// the sum), subtraction A - B = C is [1,-1,-1] (minuend minus subtrahend minus
// difference), each == 0.
function linearCount(words, signs, cap = 2) {
  const letters = [...new Set(words.join(''))];
  if (letters.length > 10) return -1;
  const coef = Object.fromEntries(letters.map((c) => [c, 0]));
  for (let w = 0; w < words.length; w++) {
    let m = 1;
    for (let i = words[w].length - 1; i >= 0; i--) { coef[words[w][i]] += signs[w] * m; m *= 10; }
  }
  const firsts = new Set(words.map((w) => w[0]));
  const order = letters.slice().sort((a, b) => Math.abs(coef[b]) - Math.abs(coef[a]));
  const cs = order.map((c) => coef[c]);
  const fs = order.map((c) => firsts.has(c));
  const n = order.length;
  const used = new Array(10).fill(false);
  let count = 0;
  const bounds = (i) => {
    const pos = [], neg = [];
    for (let k = i; k < n; k++) (cs[k] > 0 ? pos : cs[k] < 0 ? neg : pos).push(cs[k]);
    pos.sort((a, b) => b - a); neg.sort((a, b) => a - b);
    const avail = []; for (let d = 0; d < 10; d++) if (!used[d]) avail.push(d);
    const desc = avail.slice().sort((a, b) => b - a);
    let mx = 0, mn = 0;
    for (let k = 0; k < pos.length; k++) { mx += pos[k] * (desc[k] ?? 0); mn += pos[k] * (avail[k] ?? 0); }
    for (let k = 0; k < neg.length; k++) { mx += neg[k] * (avail[k] ?? 0); mn += neg[k] * (desc[k] ?? 0); }
    return [mn, mx];
  };
  const dfs = (i, acc) => {
    if (count >= cap) return;
    if (i === n) { if (acc === 0) count++; return; }
    const [mn, mx] = bounds(i);
    if (acc + mn > 0 || acc + mx < 0) return;
    for (let d = 0; d < 10; d++) {
      if (used[d] || (d === 0 && fs[i])) continue;
      used[d] = true;
      dfs(i + 1, acc + cs[i] * d);
      used[d] = false;
      if (count >= cap) return;
    }
  };
  dfs(0, 0);
  return count;
}

function solveCount(p, cap = 2) {
  const op = p.op || 'add';
  // Subtraction A - B - ... = C is linear: minuend +1, each subtrahend -1, the
  // difference -1. Two-term and three-term (Sunday) both fall out of this.
  if (op === 'sub') return linearCount([...p.lhs, p.rhs], [1, ...p.lhs.slice(1).map(() => -1), -1], cap);
  return linearCount([...p.lhs, p.rhs], [...p.lhs.map(() => 1), -1], cap);
}

// Cipher's Sunday Edition launched on this date. Earlier drops are
// grandfathered: they are live, played, and on the leaderboard.
const SUNDAY_FROM = '2026-07-26';
// The subtraction variety launched here and was RETIRED on ADDITION_ONLY_FROM.
// Between the two dates the ops strictly alternated, so the "op never repeats
// two days running" rule applies only inside that window (the pre-launch
// addition run and the post-retirement addition run are both grandfathered).
const VARIETY_FROM = '2026-07-25';
// Subtraction retired here. From this date on every drop is addition and the
// ADDEND COUNT carries the week's ramp instead: 2 addends Mon/Tue/Wed, 3 on
// Thu/Fri/Sat, 4 in the Sunday Edition. Everything before it is grandfathered,
// including the eight live subtraction drops, which stay replayable from the
// archive. Never author another subtraction puzzle.
const ADDITION_ONLY_FROM = '2026-08-09';
// Addends owed per weekday from ADDITION_ONLY_FROM on (index = getUTCDay()).
const ADDENDS_BY_DOW = [4, 2, 2, 2, 3, 3, 3];
const OPS = new Set(['add', 'sub']);  // multiplication is banned: it cannot be solved by pure column logic

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let bad = 0;
const seen = new Set();
PUZZLES.forEach((p, i) => {
  const errs = [];
  const op = p.op || 'add';
  if (!OPS.has(op)) errs.push(`bad op ${op}`);
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = p.quizId.match(/^cipher-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
    // The Sunday flag must match the real weekday. GRANDFATHERED: drops before
    // SUNDAY_FROM shipped without the edition and are already played, so they
    // are never rewritten.
    const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
    const isSun = dow === 0 && p.live >= SUNDAY_FROM;
    if (p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live}`);
    if (p.live >= ADDITION_ONLY_FROM) {
      // Addition only, and the weekday dictates how many addends.
      if (op !== 'add') errs.push(`op ${op} — subtraction is retired, addition only from ${ADDITION_ONLY_FROM}`);
      const want = ADDENDS_BY_DOW[dow];
      if (p.lhs.length !== want) errs.push(`${DOW[dow]} needs ${want} addends, has ${p.lhs.length}`);
    } else if (isSun) {
      if (p.lhs.length !== 3) errs.push('Sunday Edition needs 3 operands');
    } else {
      if (p.lhs.length !== 2) errs.push('weekday needs exactly 2 operands');
    }
  }
  const key = op + ':' + (op === 'add' ? [...p.lhs].sort().join('+') : p.lhs.join(op === 'sub' ? '-' : 'x')) + '=' + p.rhs;
  if (seen.has(key)) errs.push('duplicate equation');
  seen.add(key);
  // Per-op length sanity: addition/subtraction produce a result no longer than
  // the longest operand (+1 carry for addition); a product spans lenA+lenB-1 or
  // lenA+lenB digits.
  if (op === 'sub') {
    if (p.rhs.length > p.lhs[0].length || p.rhs.length < 1) errs.push('difference length impossible');
  } else {
    const maxL = Math.max(...p.lhs.map((w) => w.length));
    if (p.rhs.length < maxL || p.rhs.length > maxL + 1) errs.push('sum length impossible');
  }
  const c = solveCount(p);
  if (c !== 1) errs.push(c === -1 ? '>10 letters' : `solutions=${c}, need exactly 1`);
  // Alternation: no two consecutive drops share an op, from the variety launch
  // on (the earlier all-addition run is grandfathered).
  if (i > 0 && p.live >= VARIETY_FROM && p.live < ADDITION_ONLY_FROM) {
    const prev = PUZZLES[i - 1];
    if ((prev.op || 'add') === op) errs.push(`op ${op} repeats the previous day (${prev.quizId})`);
  }
  const sym = op === 'sub' ? ' - ' : '+';
  if (errs.length) { bad++; console.error(`✗ ${p.quizId}: ${errs.join('; ')}`); }
  else console.log(`✓ ${p.quizId}  [${op}] ${p.lhs.join(sym)}=${p.rhs}  unique`);
});
// ── Bank-wide word variety and the weekly difficulty climb ──────────────────
// Added 2026-09-23 with the Nov 2026 restock (scripts/gen-cipher.mjs). These
// are the header's word rules and difficulty ladder, which nothing checked
// before. Scoped to boards live on or after WORD_VARIETY_FROM: everything
// earlier is played history (APPLE and GRAPE already sit at 4 uses there).
//   * no word more than 3 times across the whole bank;
//   * no two boards anywhere in the bank sharing 2+ words;
//   * no board holding two words that share a four-letter stem, or one word
//     inside another (DAY in TODAY);
//   * difficulty, measured by a right-to-left column solver counting search
//     nodes, climbs strictly Tue..Sat and into Sunday within each week.
const WORD_VARIETY_FROM = '2026-11-01';
{
  const uses = new Map();
  PUZZLES.forEach((p, i) => { for (const w of [...p.lhs, p.rhs]) { if (!uses.has(w)) uses.set(w, []); uses.get(w).push(i); } });
  for (const [w, at] of uses) if (at.length > 3 && at.some((i) => PUZZLES[i].live >= WORD_VARIETY_FROM)) { bad++; console.error(`✗ word ${w} used ${at.length} times (ceiling 3)`); }
  const sets = PUZZLES.map((p) => new Set([...p.lhs, p.rhs]));
  PUZZLES.forEach((p, i) => {
    if (p.live < WORD_VARIETY_FROM) return;
    for (let j = 0; j < i; j++) {
      let n = 0; for (const w of sets[i]) if (sets[j].has(w)) n++;
      if (n >= 2) { bad++; console.error(`✗ ${p.quizId} shares ${n} words with ${PUZZLES[j].quizId}`); }
    }
    const ws = [...p.lhs, p.rhs];
    for (let a = 0; a < ws.length; a++) for (let b = a + 1; b < ws.length; b++) {
      if ((ws[a].length >= 4 && ws[b].length >= 4 && ws[a].slice(0, 4) === ws[b].slice(0, 4)) || ws[a].includes(ws[b]) || ws[b].includes(ws[a])) { bad++; console.error(`✗ ${p.quizId}: ${ws[a]} and ${ws[b]} read as the same word`); }
    }
  });
  const colNodes = (lhs, rhs) => {
    const W = rhs.length, firsts = new Set([...lhs, rhs].map((w) => w[0]));
    const at = (w, c) => (c < w.length ? w[w.length - 1 - c] : null);
    const val = {}, taken = Array(10).fill(false); let nodes = 0;
    const put = (ls, k, go) => {
      if (k === ls.length) return go();
      if (ls[k] in val) return put(ls, k + 1, go);
      for (let d = 0; d < 10; d++) { if (taken[d] || (!d && firsts.has(ls[k]))) continue; nodes++; val[ls[k]] = d; taken[d] = true; put(ls, k + 1, go); delete val[ls[k]]; taken[d] = false; }
    };
    const col = (c, carry) => {
      if (c === W) return;
      const add = lhs.map((w) => at(w, c)).filter(Boolean);
      put([...new Set(add)], 0, () => {
        const sum = add.reduce((a, L) => a + val[L], carry), dg = sum % 10, R = at(rhs, c);
        if (R in val) { if (val[R] === dg) col(c + 1, Math.floor(sum / 10)); return; }
        if (taken[dg] || (!dg && firsts.has(R))) return;
        nodes++; val[R] = dg; taken[dg] = true; col(c + 1, Math.floor(sum / 10)); delete val[R]; taken[dg] = false;
      });
    };
    col(0, 0); return nodes;
  };
  let prev = null;
  for (const p of PUZZLES) {
    if (p.live < WORD_VARIETY_FROM) continue;
    const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay(), n = colNodes(p.lhs, p.rhs);
    if (prev && dow !== 1 && n <= prev.n) { bad++; console.error(`✗ ${p.quizId}: ${n} nodes, not harder than ${prev.id} (${prev.n})`); }
    prev = { id: p.quizId, n };
  }
  console.log(`word variety + weekly climb checked from ${WORD_VARIETY_FROM}`);
}
if (bad) { console.error(`\n${bad} bad puzzle(s)`); process.exit(1); }
console.log(`\nAll ${PUZZLES.length} Cipher puzzles verified unique.`);
