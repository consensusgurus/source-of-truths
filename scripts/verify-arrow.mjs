// Verify the Arrow bank (the daily arrow sudoku).
//
//   node scripts/verify-arrow.mjs
//
// THIS FILE RECOMPUTES, IT DOES NOT TRUST. NOTHING is imported from
// scripts/arrow-core.mjs (the Cages/Sando rule): the solvers here are
// independent implementations.
//
//   - the LOGICAL solver works on candidate Sets: arrow bounds (circle against
//     the low and high sums of its shaft, each shaft square against the circle
//     less the others), then a full support walk per arrow, then singles,
//     locked candidates and pairs. It POLICES itself: every digit it removes
//     is checked against `sol`, so an unsound rule is reported, not trusted.
//   - the UNIQUENESS counter walks each arrow shaft first (the generator walks
//     circle first) and branches on the last fewest-candidate square in index
//     order (the generator takes the first).
//
// WHAT IS CHECKED
//   Shape       nums sequential from 1, dates contiguous ISO, dateLabel and
//               quizId (arrow-M-D-YY) derived from `live`, no duplicates.
//   Solution    `sol` is a legal 9x9 sudoku filling.
//   Arrows      steps to neighbouring squares, no cell in two arrows, no turn
//               of 90 degrees or more, no two diagonal steps crossing, shaft
//               sum equals the circle along `sol`, a repeated shaft digit never
//               shares a unit; counts and shaft lengths pinned per weekday
//               (Mon-Thu nine of 2-3, Fri-Sat ten of 2-3, Sunday twelve of 2-4).
//   Givens      every printed digit equals `sol`; the count is pinned per
//               weekday: Mon 28, Tue 25, Wed 22, Thu 19, Fri 16, Sat 13, Sun 8.
//   Uniqueness  EXACTLY one solution, from the independent counter.
//   Necessity   the printed digits alone, read as a plain sudoku, admit more
//               than one grid, so the arrows are never decoration.
//   No guessing the board falls to the independent graded solver.
//   Sunday      sunday:true exactly on real Sundays.
//   Variety     no solution grid and no arrow layout repeats.
//
// Mutation-tested by scripts/arrow-mutation-test.mjs (set VERIFY_ARROW_BANK
// to point this file at a mutated copy).
const BANK = process.env.VERIFY_ARROW_BANK
  ? `file://${process.env.VERIFY_ARROW_BANK}`
  : new URL('../app/arrow/puzzles.js', import.meta.url).href;
const { PUZZLES } = await import(BANK);

const fails = [];
const note = [];
const TARGET = { 1: 28, 2: 25, 3: 22, 4: 19, 5: 16, 6: 13, 0: 8 };
const SHAPE = (dow) => dow === 0 ? { count: 12, min: 2, max: 4 } : dow >= 5 ? { count: 10, min: 2, max: 3 } : { count: 9, min: 2, max: 3 };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dowOf = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const addDays = (iso, n) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const boxOf = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
const sees = (a, b) => a[0] === b[0] || a[1] === b[1] || boxOf(a[0], a[1]) === boxOf(b[0], b[1]);

const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push(Array.from({ length: 9 }, (_, c) => [r, c]));
for (let c = 0; c < 9; c++) UNITS.push(Array.from({ length: 9 }, (_, r) => [r, c]));
for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
  const u = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) u.push([br * 3 + r, bc * 3 + c]);
  UNITS.push(u);
}

// ── independent graded logical solver on Sets, policed against sol ─────────
function logicSolve(p) {
  const cand = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set([1,2,3,4,5,6,7,8,9])));
  let unsound = null;
  const drop = (r, c, d) => {
    if (!cand[r][c].has(d)) return false;
    if (p.sol[r][c] === d && !unsound) unsound = `eliminated the true digit ${d} from r${r + 1}c${c + 1}`;
    cand[r][c].delete(d);
    return true;
  };
  const settle = (r, c, d) => { for (const x of [...cand[r][c]]) if (x !== d) drop(r, c, x); };
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p.given[r][c]) settle(r, c, p.given[r][c]);

  const arrowRules = () => {
    let any = false;
    for (const a of p.arrows) {
      const [circle, ...shaft] = a;
      if (a.some(([r, c]) => !cand[r][c].size)) return any;
      const cs = cand[circle[0]][circle[1]];
      const lo = shaft.map(([r, c]) => Math.min(...cand[r][c]));
      const hi = shaft.map(([r, c]) => Math.max(...cand[r][c]));
      const sLo = lo.reduce((x, y) => x + y, 0), sHi = hi.reduce((x, y) => x + y, 0);
      for (const d of [...cs]) if (d < sLo || d > sHi) any = drop(circle[0], circle[1], d) || any;
      if (!cand[circle[0]][circle[1]].size) return any;
      const cLo = Math.min(...cand[circle[0]][circle[1]]), cHi = Math.max(...cand[circle[0]][circle[1]]);
      shaft.forEach(([r, c], k) => {
        const othersLo = sLo - lo[k], othersHi = sHi - hi[k];
        for (const d of [...cand[r][c]]) if (d + othersLo > cHi || d + othersHi < cLo) any = drop(r, c, d) || any;
      });
      const ok = a.map(() => new Set());
      const vals = [];
      const walk = (k) => {
        if (k === a.length) {
          const s = vals.slice(1).reduce((x, y) => x + y, 0);
          if (s === vals[0]) vals.forEach((v, j) => ok[j].add(v));
          return;
        }
        const [r, c] = a[k];
        for (const d of cand[r][c]) {
          let clash = false;
          for (let j = 1; j < k; j++) if (vals[j] === d && sees(a[j], a[k])) { clash = true; break; }
          if (clash) continue;
          vals.push(d); walk(k + 1); vals.pop();
        }
      };
      walk(0);
      a.forEach(([r, c], j) => { for (const d of [...cand[r][c]]) if (!ok[j].has(d)) any = drop(r, c, d) || any; });
    }
    return any;
  };
  const nakedSingles = () => {
    let any = false;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (cand[r][c].size !== 1) continue;
      const d = [...cand[r][c]][0];
      for (let r2 = 0; r2 < 9; r2++) for (let c2 = 0; c2 < 9; c2++) {
        if ((r2 !== r || c2 !== c) && sees([r, c], [r2, c2])) any = drop(r2, c2, d) || any;
      }
    }
    return any;
  };
  const hiddenSingle = () => {
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      const spots = u.filter(([r, c]) => cand[r][c].has(d));
      if (spots.length === 1 && cand[spots[0][0]][spots[0][1]].size > 1) { settle(spots[0][0], spots[0][1], d); return true; }
    }
    return false;
  };
  const lockedCands = () => {
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      const spots = u.filter(([r, c]) => cand[r][c].has(d));
      if (spots.length < 2) continue;
      for (const v of UNITS) {
        if (v === u) continue;
        if (!spots.every(([r, c]) => v.some(([r2, c2]) => r2 === r && c2 === c))) continue;
        let any = false;
        for (const [r, c] of v) if (!u.some(([r2, c2]) => r2 === r && c2 === c)) any = drop(r, c, d) || any;
        if (any) return true;
      }
    }
    return false;
  };
  const pairs = () => {
    for (const u of UNITS) {
      for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) {
        const A = cand[u[i][0]][u[i][1]], B = cand[u[j][0]][u[j][1]];
        if (A.size !== 2 || B.size !== 2 || [...A].some((x) => !B.has(x))) continue;
        let any = false;
        for (let k = 0; k < 9; k++) if (k !== i && k !== j) for (const x of A) any = drop(u[k][0], u[k][1], x) || any;
        if (any) return true;
      }
      for (let a = 1; a <= 9; a++) for (let b = a + 1; b <= 9; b++) {
        const sa = u.filter(([r, c]) => cand[r][c].has(a)), sb = u.filter(([r, c]) => cand[r][c].has(b));
        if (sa.length !== 2 || sb.length !== 2 || sa.some(([r, c], k) => sb[k][0] !== r || sb[k][1] !== c)) continue;
        let any = false;
        for (const [r, c] of sa) for (const x of [...cand[r][c]]) if (x !== a && x !== b) any = drop(r, c, x) || any;
        if (any) return true;
      }
    }
    return false;
  };
  for (let guard = 0; guard < 5000; guard++) {
    if (arrowRules() || nakedSingles()) continue;
    if (hiddenSingle() || lockedCands() || pairs()) continue;
    break;
  }
  const solved = cand.every((row, r) => row.every((s, c) => s.size === 1 && [...s][0] === p.sol[r][c]));
  return { solved, unsound };
}

// ── independent uniqueness counter ─────────────────────────────────────────
function countSolutions(p, withArrows, cap = 2) {
  const start = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) start.push(p.given[r][c] ? new Set([p.given[r][c]]) : new Set([1,2,3,4,5,6,7,8,9]));
  const at = (r, c) => r * 9 + c;
  const arrows = withArrows ? p.arrows : [];
  const settleOk = (cand) => {
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < 81; i++) {
        if (cand[i].size === 0) return false;
        if (cand[i].size !== 1) continue;
        const d = cand[i].values().next().value, r = Math.floor(i / 9), c = i % 9;
        for (let j = 0; j < 81; j++) {
          if (j === i) continue;
          if (!sees([r, c], [Math.floor(j / 9), j % 9]) || !cand[j].has(d)) continue;
          cand[j].delete(d); changed = true;
          if (!cand[j].size) return false;
        }
      }
      for (const a of arrows) {
        const shaft = a.slice(1), circle = a[0];
        const support = a.map(() => new Set());
        const pick = [];
        const walk = (k, sum) => {
          if (k === shaft.length) {
            if (!cand[at(circle[0], circle[1])].has(sum)) return;
            support[0].add(sum);
            pick.forEach((v, j) => support[j + 1].add(v));
            return;
          }
          const [r, c] = shaft[k];
          for (const d of cand[at(r, c)]) {
            if (sum + d > 9) continue;
            if (pick.some((v, j) => v === d && sees(shaft[j], shaft[k]))) continue;
            pick.push(d); walk(k + 1, sum + d); pick.pop();
          }
        };
        walk(0, 0);
        a.forEach(([r, c], j) => {
          const s0 = cand[at(r, c)];
          for (const d of [...s0]) if (!support[j].has(d)) { s0.delete(d); changed = true; }
        });
        if (a.some(([r, c]) => !cand[at(r, c)].size)) return false;
      }
    }
    return true;
  };
  let found = 0;
  const rec = (cand) => {
    if (found >= cap) return;
    if (!settleOk(cand)) return;
    let best = -1;
    for (let i = 0; i < 81; i++) if (cand[i].size > 1 && (best < 0 || cand[i].size <= cand[best].size)) best = i;
    if (best < 0) { found++; return; }
    for (const d of [...cand[best]]) {
      if (found >= cap) return;
      const next = cand.map((s) => new Set(s));
      next[best] = new Set([d]);
      rec(next);
    }
  };
  rec(start);
  return found;
}

const ids = new Set();
const solSeen = new Map();
const layoutSeen = new Map();
const segKey = (a, b) => { const x = a[0] * 9 + a[1], y = b[0] * 9 + b[1]; return x < y ? `${x}-${y}` : `${y}-${x}`; };

PUZZLES.forEach((p, idx) => {
  const tag = `#${p.num} (${p.live})`;
  if (p.num !== idx + 1) fails.push(`${tag}: num out of sequence`);
  if (idx > 0 && p.live !== addDays(PUZZLES[idx - 1].live, 1)) fails.push(`${tag}: date not contiguous with previous`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fails.push(`${tag}: dateLabel disagrees with live`);
  const wantId = `arrow-${m}-${d}-${String(y).slice(2)}`;
  if (p.quizId !== wantId) fails.push(`${tag}: quizId ${p.quizId}, expected ${wantId}`);
  if (ids.has(p.quizId)) fails.push(`${tag}: duplicate quizId`);
  ids.add(p.quizId);
  const dow = dowOf(p.live);
  if (p.sunday !== (dow === 0)) fails.push(`${tag}: sunday flag wrong for its date`);

  for (const u of UNITS) {
    const vals = u.map(([r, c]) => p.sol[r][c]);
    if (new Set(vals).size !== 9 || vals.some((v) => v < 1 || v > 9)) { fails.push(`${tag}: sol violates a unit`); break; }
  }

  const shape = SHAPE(dow);
  if (p.arrows.length !== shape.count) fails.push(`${tag}: ${p.arrows.length} arrows, expected ${shape.count}`);
  const used = new Set();
  const diag = [];
  for (const a of p.arrows) {
    const shaft = a.slice(1);
    if (shaft.length < shape.min || shaft.length > shape.max) fails.push(`${tag}: a shaft of ${shaft.length} squares is outside ${shape.min}-${shape.max}`);
    a.forEach(([r, c], k) => {
      const key = `${r},${c}`;
      if (r < 0 || r > 8 || c < 0 || c > 8) fails.push(`${tag}: arrow leaves the grid`);
      if (used.has(key)) fails.push(`${tag}: two arrows share r${r + 1}c${c + 1}`);
      used.add(key);
      if (k > 0) {
        const [pr, pc] = a[k - 1];
        const dr = r - pr, dc = c - pc;
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== 1) fails.push(`${tag}: an arrow step is not to a neighbouring square`);
        if (dr && dc) diag.push([[pr, pc], [r, c]]);
        if (k > 1) {
          const [qr, qc] = a[k - 2];
          if ((pr - qr) * dr + (pc - qc) * dc <= 0) fails.push(`${tag}: an arrow turns back on itself at r${pr + 1}c${pc + 1}`);
        }
      }
    });
    const sum = shaft.reduce((s, [r, c]) => s + p.sol[r][c], 0);
    if (sum !== p.sol[a[0][0]][a[0][1]]) fails.push(`${tag}: arrow at r${a[0][0] + 1}c${a[0][1] + 1} sums to ${sum}, circle is ${p.sol[a[0][0]][a[0][1]]}`);
    for (let i = 0; i < shaft.length; i++) for (let j = i + 1; j < shaft.length; j++) {
      if (sees(shaft[i], shaft[j]) && p.sol[shaft[i][0]][shaft[i][1]] === p.sol[shaft[j][0]][shaft[j][1]]) fails.push(`${tag}: a shaft repeats a digit within one unit`);
    }
  }
  const diagSet = new Set(diag.map(([a, b]) => segKey(a, b)));
  for (const [a, b] of diag) {
    if (diagSet.has(segKey([a[0], b[1]], [b[0], a[1]]))) { fails.push(`${tag}: two diagonal arrow steps cross`); break; }
  }

  let printed = 0;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (!p.given[r][c]) continue;
    printed++;
    if (p.given[r][c] !== p.sol[r][c]) fails.push(`${tag}: given at r${r + 1}c${c + 1} disagrees with sol`);
  }
  if (printed !== TARGET[dow]) fails.push(`${tag}: ${printed} givens, the ramp pins ${TARGET[dow]}`);
  if (p.printed !== printed) fails.push(`${tag}: printed field says ${p.printed}, board shows ${printed}`);

  const n = countSolutions(p, true, 2);
  if (n !== 1) fails.push(`${tag}: ${n} solutions (must be exactly 1)`);
  if (countSolutions(p, false, 2) < 2) fails.push(`${tag}: the printed digits alone pin the grid, the arrows do no work`);
  const lg = logicSolve(p);
  if (lg.unsound) fails.push(`${tag}: UNSOUND RULE - ${lg.unsound}`);
  if (!lg.solved) fails.push(`${tag}: not solvable by the graded technique set (guessing would be required)`);

  const sKey = p.sol.flat().join('');
  if (solSeen.has(sKey)) fails.push(`${tag}: solution grid repeats ${solSeen.get(sKey)}`);
  solSeen.set(sKey, tag);
  const lKey = p.arrows.map((a) => a.map(([r, c]) => `${r}${c}`).join('-')).sort().join('|');
  if (layoutSeen.has(lKey)) fails.push(`${tag}: arrow layout repeats ${layoutSeen.get(lKey)}`);
  layoutSeen.set(lKey, tag);
});

const today = new Date().toISOString().slice(0, 10);
note.push(`${PUZZLES.length} boards, ${PUZZLES.filter((p) => p.sunday).length} Sundays, ${PUZZLES.filter((p) => p.live > today).length} days of runway after ${today}`);
for (const n of note) console.log(`note  ${n}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(fails.length ? `\n${fails.length} failure(s).` : '\nOK');
process.exit(fails.length ? 1 : 0);
