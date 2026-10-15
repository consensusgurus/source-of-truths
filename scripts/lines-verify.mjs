// scripts/lines-verify.mjs: the INDEPENDENT bank checker for the two line
// sudokus, Five (German whispers) and Racecar (palindrome). Wrapped by
// scripts/verify-five.mjs and scripts/verify-racecar.mjs.
//
// It recomputes everything, trusts no stored field, and imports nothing from
// the generator (lines-core.mjs / lines-bank.mjs): candidates here are Sets,
// the counter branches on the HOUSE-and-digit with the fewest places rather
// than the emptiest square, and the line rule is written as a per-digit test
// rather than a mask table. The logical solver is POLICED against the stored
// solution: a step that removes the true digit or writes a false one is
// reported as unsound rather than trusted.
//
// Proves, per board:
//   1  the lines are well formed: in range, king steps, no square on two lines
//   2  the solution is a legal sudoku AND obeys every line
//   3  the clues are a subset of the solution, and the printed count and level
//      match the weekday ramp
//   4  exactly one solution under the lines
//   5  it falls to logic with no guessing, at exactly the pinned level
//   6  LINE NECESSITY: with the lines switched off the clues fit more than one
//      grid
// and across the bank: contiguous nums, consecutive dates, labels, quizIds and
// Sunday flags derived from the date, no repeated solution or clue pattern.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function verifyLines({ kind, key, name, PRINTED_BY_DOW, LEVEL_BY_DOW }) {
  const BANK = process.env[`VERIFY_${key.toUpperCase()}_BANK`] || path.join(process.cwd(), `app/${key}/puzzles.js`);
  const { PUZZLES } = await import(pathToFileURL(BANK).href);
  const TAG = name.toUpperCase();
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fails = [], warns = [];
  const fail = (m) => fails.push(m);

  const at = (r, c) => r * 9 + c;
  const R = (i) => Math.floor(i / 9), C = (i) => i % 9, B = (i) => Math.floor(R(i) / 3) * 3 + Math.floor(C(i) / 3);
  const HOUSES = [];
  for (let k = 0; k < 9; k++) {
    HOUSES.push([...Array(9).keys()].map((c) => at(k, c)));
    HOUSES.push([...Array(9).keys()].map((r) => at(r, k)));
    HOUSES.push([...Array(9).keys()].map((n) => at(Math.floor(k / 3) * 3 + Math.floor(n / 3), (k % 3) * 3 + (n % 3))));
  }
  const SEE = Array.from({ length: 81 }, (_, i) => [...Array(81).keys()].filter((j) => j !== i && (R(j) === R(i) || C(j) === C(i) || B(j) === B(i))));

  // the rule, as "may digit x at one end of a bond sit with digit y at the other"
  const fits = kind === 'five' ? (x, y) => Math.abs(x - y) >= 5 : (x, y) => x === y;
  const bondsOf = (lines) => {
    const out = [];
    for (const ln of lines) {
      if (kind === 'five') for (let k = 1; k < ln.length; k++) out.push([ln[k - 1], ln[k]]);
      else for (let k = 0, m = ln.length - 1; k < m; k++, m--) out.push([ln[k], ln[m]]);
    }
    return out;
  };

  // ---- counter ----
  // Plain backtracking over row/column/box occupancy arrays (no propagation),
  // branching on the house-and-digit with the fewest legal places.
  function count(given, lines, cap) {
    const bonds = bondsOf(lines);
    const bondAt = Array.from({ length: 81 }, () => []);
    for (const [a, b] of bonds) { bondAt[a].push(b); bondAt[b].push(a); }
    const g = given.slice();
    const usedR = Array.from({ length: 9 }, () => new Array(10).fill(false));
    const usedC = Array.from({ length: 9 }, () => new Array(10).fill(false));
    const usedB = Array.from({ length: 9 }, () => new Array(10).fill(false));
    const put = (i, d, on) => { usedR[R(i)][d] = on; usedC[C(i)][d] = on; usedB[B(i)][d] = on; g[i] = on ? d : 0; };
    for (let i = 0; i < 81; i++) if (g[i]) { if (usedR[R(i)][g[i]] || usedC[C(i)][g[i]] || usedB[B(i)][g[i]]) return 0; put(i, g[i], true); }
    let n = 0;
    const legal = (i, d) => !usedR[R(i)][d] && !usedC[C(i)][d] && !usedB[B(i)][d] && bondAt[i].every((j) => !g[j] || fits(d, g[j]));
    (function go() {
      if (n >= cap) return;
      let best = null;
      for (let h = 0; h < 27 && !(best && best.places.length === 1); h++) {
        const house = HOUSES[h];
        for (let d = 1; d <= 9; d++) {
          const k = h % 3, x = Math.floor(h / 3);
          if ((k === 0 ? usedR[x] : k === 1 ? usedC[x] : usedB[x])[d]) continue;
          const places = [];
          for (const i of house) if (!g[i] && legal(i, d)) places.push(i);
          if (!places.length) return;
          if (!best || places.length < best.places.length) { best = { d, places }; if (places.length === 1) break; }
        }
      }
      if (!best) { n++; return; }
      for (const i of best.places) { put(i, best.d, true); go(); put(i, best.d, false); if (n >= cap) return; }
    })();
    return n;
  }

  // ---- policed logic ----
  function logic(given, lines, sol) {
    const bonds = bondsOf(lines);
    const cand = given.map((v) => new Set(v ? [v] : [1, 2, 3, 4, 5, 6, 7, 8, 9]));
    const done = given.slice();
    let level = 1;
    const cut = (i, d) => {
      if (!cand[i].has(d)) return false;
      if (d === sol[i]) throw new Error(`unsound: removed the true ${d} at r${R(i) + 1}c${C(i) + 1}`);
      cand[i].delete(d); return true;
    };
    const fix = (i, d) => {
      if (d !== sol[i]) throw new Error(`unsound: wrote ${d} at r${R(i) + 1}c${C(i) + 1}`);
      done[i] = d; cand[i] = new Set([d]);
      for (const j of SEE[i]) if (!done[j]) cut(j, d);
    };
    for (let i = 0; i < 81; i++) if (given[i]) for (const j of SEE[i]) if (!done[j]) cut(j, given[i]);
    const lineRead = () => {
      let moved = false;
      for (const [a, b] of bonds) for (const [x, y] of [[a, b], [b, a]]) {
        for (const d of [...cand[x]]) if (![...cand[y]].some((e) => fits(d, e))) moved = cut(x, d) || moved;
      }
      return moved;
    };
    const singles = () => {
      for (let i = 0; i < 81; i++) if (!done[i] && cand[i].size === 1) { fix(i, [...cand[i]][0]); return true; }
      for (const h of HOUSES) for (let d = 1; d <= 9; d++) {
        if (h.some((i) => done[i] === d)) continue;
        const p = h.filter((i) => !done[i] && cand[i].has(d));
        if (p.length === 1) { fix(p[0], d); return true; }
      }
      return false;
    };
    const harder = () => {
      let moved = false;
      // locked candidates: the places of d in one house all lie in another
      for (const h of HOUSES) for (let d = 1; d <= 9; d++) {
        const p = h.filter((i) => !done[i] && cand[i].has(d));
        if (p.length < 2) continue;
        for (const h2 of HOUSES) {
          if (h2 === h || !p.every((i) => h2.includes(i))) continue;
          for (const j of h2) if (!p.includes(j) && !done[j]) moved = cut(j, d) || moved;
        }
      }
      // naked pairs and triples
      for (const h of HOUSES) {
        const open = h.filter((i) => !done[i]);
        const pick = (start, chosen) => {
          if (chosen.length >= 2) {
            const u = new Set(chosen.flatMap((i) => [...cand[i]]));
            if (u.size === chosen.length) for (const j of open) if (!chosen.includes(j)) for (const d of u) moved = cut(j, d) || moved;
          }
          if (chosen.length === 3) return;
          for (let k = start; k < open.length; k++) pick(k + 1, chosen.concat(open[k]));
        };
        pick(0, []);
      }
      return moved;
    };
    for (;;) {
      if (lineRead()) continue;
      if (singles()) continue;
      if (harder()) { level = 2; continue; }
      break;
    }
    return { solved: done.every((v, i) => v === sol[i]), level };
  }

  // ---- the sweep ----
  const asDate = (iso) => new Date(iso + 'T00:00:00Z');
  const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  if (!Array.isArray(PUZZLES) || !PUZZLES.length) { console.error(`${TAG}: no puzzles`); process.exit(1); }
  const first = PUZZLES[0].live;
  const seenSol = new Map(), seenMask = new Map();
  PUZZLES.forEach((p, n) => {
    const tag = `#${p.num}`;
    const d = asDate(p.live), dow = d.getUTCDay();
    if (p.num !== n + 1) fail(`${tag}: num out of sequence`);
    if (p.live !== addDays(first, n)) fail(`${tag}: live date is not day ${n} after ${first}`);
    if (p.dateLabel !== `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`) fail(`${tag}: dateLabel does not match the date`);
    if (p.quizId !== `${key}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`) fail(`${tag}: quizId does not match the date`);
    if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag is ${!!p.sunday} on weekday ${dow}`);
    const given = p.given.flat(), sol = p.sol.flat();
    // 1. lines
    const lines = [];
    const onLine = new Set();
    let shapeOk = Array.isArray(p.lines) && p.lines.length > 0;
    for (const ln of p.lines || []) {
      if (!Array.isArray(ln) || ln.length < 2) { shapeOk = false; break; }
      const cells = ln.map(([r, c]) => at(r, c));
      for (let k = 0; k < ln.length; k++) {
        const [r, c] = ln[k];
        if (!(r >= 0 && r < 9 && c >= 0 && c < 9)) shapeOk = false;
        if (k && (Math.max(Math.abs(r - ln[k - 1][0]), Math.abs(c - ln[k - 1][1])) !== 1)) shapeOk = false;
        if (onLine.has(cells[k])) shapeOk = false;
        onLine.add(cells[k]);
      }
      lines.push(cells);
    }
    if (!shapeOk) { fail(`${tag}: a line is malformed (off the grid, not king steps, or a square on two lines)`); return; }
    // 2. solution
    if (sol.length !== 81 || given.length !== 81) { fail(`${tag}: grid is not 9x9`); return; }
    if (HOUSES.some((h) => new Set(h.map((i) => sol[i])).size !== 9) || sol.some((v) => v < 1 || v > 9)) { fail(`${tag}: solution is not a legal sudoku`); return; }
    for (const [a, b] of bondsOf(lines)) if (!fits(sol[a], sol[b])) { fail(`${tag}: solution breaks a line at r${R(a) + 1}c${C(a) + 1}`); return; }
    // 3. clues
    for (let i = 0; i < 81; i++) if (given[i] && given[i] !== sol[i]) { fail(`${tag}: clue at r${R(i) + 1}c${C(i) + 1} disagrees with the solution`); return; }
    const printed = given.filter(Boolean).length;
    if (printed !== p.printed) fail(`${tag}: printed says ${p.printed}, the board shows ${printed}`);
    if (printed !== PRINTED_BY_DOW[dow]) fail(`${tag}: weekday ${dow} wants ${PRINTED_BY_DOW[dow]} clues, board has ${printed}`);
    // 4. unique
    const nSol = count(given, lines, 2);
    if (nSol !== 1) fail(`${tag}: ${nSol === 0 ? 'no solution' : 'more than one solution'} under the lines`);
    // 5. logic
    let res;
    try { res = logic(given, lines, sol); } catch (e) { fail(`${tag}: ${e.message}`); return; }
    if (!res.solved) fail(`${tag}: does not fall to logic, it would need a guess`);
    if (res.level !== p.level) fail(`${tag}: level says ${p.level}, the board demands ${res.level}`);
    if (res.level !== LEVEL_BY_DOW[dow]) fail(`${tag}: weekday ${dow} pins level ${LEVEL_BY_DOW[dow]}, the board demands ${res.level}`);
    // 6. necessity
    if (count(given, [], 2) < 2) fail(`${tag}: the clues pin a single grid WITHOUT the lines, so the lines are decoration`);
    const sk = sol.join(''), mk = given.map((v) => (v ? 1 : 0)).join('');
    if (seenSol.has(sk)) fail(`${tag}: repeats the solution grid of #${seenSol.get(sk)}`);
    if (seenMask.has(mk)) fail(`${tag}: repeats the clue pattern of #${seenMask.get(mk)}`);
    seenSol.set(sk, p.num); seenMask.set(mk, p.num);
  });
  const last = PUZZLES[PUZZLES.length - 1];
  const left = Math.round((asDate(last.live) - asDate(new Date().toISOString().slice(0, 10))) / 86400000);
  if (left < 0) fail(`the bank ran out on ${last.live}`);
  else if (left < 14) warns.push(`only ${left} days of bank left (ends ${last.live})`);
  for (const w of warns) console.warn(`${TAG} warn: ${w}`);
  if (fails.length) {
    for (const f of fails) console.error(`${TAG} FAIL: ${f}`);
    console.error(`\n${TAG}: ${fails.length} failure(s) across ${PUZZLES.length} boards.`);
    process.exit(1);
  }
  console.log(`${TAG} ok: ${PUZZLES.length} boards ${PUZZLES[0].live} to ${last.live}, ${PUZZLES.filter((p) => p.sunday).length} Sunday Editions, every board unique, logic-only at its pinned level, and impossible without its lines.`);
}
