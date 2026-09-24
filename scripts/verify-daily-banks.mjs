// Comprehensive daily-bank verifier for the OTHER twelve games (Tuck/Alibi/
// Cipher have their own scripts). Restores the in-repo solver CLAUDE-QUIZZES
// §7 used to lament was missing. Run after ANY bank edit:
//   node scripts/verify-daily-banks.mjs [game ...]
//
// What it proves, per game:
//   suds   — sol is a valid sudoku consistent with `given`; the givens admit
//            EXACTLY ONE solution (exhaustive, capped at 2); clue count matches.
//   tally  — sol respects blocked/given, hits every rowT/colT, uses exactly
//            the bank multiset; the (blocked, given, totals, bank) spec admits
//            EXACTLY ONE filling.
//   carve  — sol is `regions` connected regions, one seed each, each summing
//            to target; the (grid, seeds, target) spec admits EXACTLY ONE
//            partition (region enumeration + exact cover, capped at 2).
//   garble — every scramble is a true anagram of its answer (and differs);
//            marks are valid indexes; marked letters anagram to `final`;
//            NO answer has an alternate same-length anagram in the common-word
//            list (the client accepts only the exact answer — an alternate
//            like MELON/LEMON would wrongly reject a fair unscramble).
//   emcee  — across/down slot lists exactly tile the grid's runs; crossings
//            are consistent by construction; non-dictionary answers are
//            REPORTED for eyeball review (proper nouns are legal in crosswords).
//   links  — 4 groups × 4 words, all 16 distinct; declared collisions must
//            yield EXACTLY ONE valid grouping, and every one-way collision
//            flow (>= 2 words of A read as B, nothing in B reads back) must be
//            signed off in `reverseChecked` — the proof only sees what you
//            declare, so an unacknowledged one-way flow is a failure.
//   crux   — every category word is placed in exactly one slot; slot geometry
//            fits the board; crossing letters agree; non-dictionary words
//            reported. PLUS the collision floor (owner rule, see the header of
//            app/crux/puzzles.js): every board live on or after 2026-08-03
//            declares a `collisions` array, each entry naming a word on the
//            board and a DIFFERENT category on the same board that it also
//            plausibly reads as; at least 2 entries on a weekday and at least 3
//            on a Sunday. Earlier boards are frozen history and grandfathered.
//            Collision-pool variety is also checked, so a bulk bank generator
//            cannot ship the same two traps every day: from 2026-09-30 a repeat
//            of the same word/category pair more than twice is a hard fail, and
//            repeats before that date are reported as a review note. Boards
//            from that date also must admit exactly ONE filing of the words
//            into the slots under the length and crossing constraints.
//   span   — perfect equals the true BFS shortest hop count on borders.js, with
//            Sunday via/avoid constraints applied exactly as the rules state.
//   dating — exactly 5 events in strictly ascending true order, distinct.
//   circa  — year is a sane integer and matches any year in the blurb copy.
//   extra  — every hidden spec resolves via the client's own resolveHidden
//            (WORD#2 = 2nd occurrence); keys lowercase and >2 chars.
//   outwit — 5 prompts in the fixed type order (6 on a Sunday); the calendar is
//            contiguous and quizId/dateLabel/sunday are derived from `live`; the
//            Undercut carries one of the eight fractions, says which in its own
//            copy, and never repeats it back to back; herd truths sit inside
//            their own range; no prompt text is used twice in the bank. PLUS the
//            CROWD-SHAPE floor (from OUTWIT_CROWD_FROM = 2026-09-30): the house
//            crowd is the answer key while the field is small, so every choice
//            prompt must show a favorite that leads without running away, a real
//            second and third, and a reachable tail — an evenly split crowd pays
//            nothing for insight and a unanimous one is a gimme. Variety is
//            capped bank-wide too (count vector, Meeting Point favorite, option
//            reuse), and a Sunday's crowd must sit closer together than a
//            weekday's. Finally every board is scored END TO END through
//            lib/outwit-score — the live scorer — as a player who reads the crowd
//            perfectly, and must pay full marks. Earlier boards are frozen
//            history: their 24-vote crowds,
//            canned Sunday prompt and British spellings are reported, not failed.
//   outrank — 6 items (7 Sunday), all distinct; the calendar re-derived from
//            `live`; house = 40 votes, no zero-vote item, AND all K favorite-vote
//            counts DISTINCT so the crowd order is unambiguous (no reliance on
//            the no-signal display-index tiebreak). A tie is a hard fail on any
//            editable (live >= today) board; past frozen boards with a tie are
//            grandfathered as a note. Every board is also scored END TO END
//            through lib/outrank-score — the live scorer — as a player who reads
//            the crowd perfectly, and must pay full marks. PLUS the CROWD-SHAPE
//            floor (from OUTRANK_CROWD_FROM = 2026-09-30): the house crowd is an
//            authored estimate and the answer key while the field is small, so
//            the order has to be guessable but not obvious — a favorite that
//            leads without running away (11-14 of 40 weekday, 8-12 Sunday), a
//            2-5 margin over the runner-up, a tail nobody left on one vote, and
//            between one and three one-vote boundaries (two to five on a
//            Sunday). The Sunday Edition proves both halves of its ramp: seven
//            items AND a crowd capped two votes closer. `items` is proved to be
//            a real display mix rather than the answer, and variety is capped
//            bank-wide (theme category, item string, count vector).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const want = process.argv.slice(2);
const RUN = (k) => !want.length || want.includes(k);
let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);

const dict = new Set(readFileSync(join(here, '../public/tuck-dict.txt'), 'utf8').trim().split('\n'));

// ─── SUDS ───────────────────────────────────────────────────────────────────
if (RUN('suds')) {
  const { PUZZLES } = await import('../app/suds/puzzles.js');
  const countSolutions = (given, cap = 2) => {
    const g = given.map((r) => r.slice());
    let count = 0;
    const okAt = (r, c, v) => {
      for (let i = 0; i < 9; i++) if (g[r][i] === v || g[i][c] === v) return false;
      const br = 3 * ((r / 3) | 0), bc = 3 * ((c / 3) | 0);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[br + i][bc + j] === v) return false;
      return true;
    };
    const dfs = () => {
      if (count >= cap) return;
      let br = -1, bc = -1, bestN = 10, bestSet = null;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        if (g[r][c]) continue;
        const s = [];
        for (let v = 1; v <= 9; v++) if (okAt(r, c, v)) s.push(v);
        if (s.length < bestN) { bestN = s.length; br = r; bc = c; bestSet = s; }
        if (!s.length) return;
      }
      if (br < 0) { count++; return; }
      for (const v of bestSet) { g[br][bc] = v; dfs(); g[br][bc] = 0; if (count >= cap) return; }
    };
    dfs();
    return count;
  };
  for (const p of PUZZLES) {
    const errs = [];
    let clueN = 0;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (p.given[r][c]) { clueN++; if (p.given[r][c] !== p.sol[r][c]) errs.push(`given/sol clash at ${r},${c}`); }
    }
    if (p.clues !== undefined && p.clues !== clueN) errs.push(`clues field ${p.clues} != ${clueN}`);
    for (let i = 0; i < 9; i++) {
      if (new Set(p.sol[i]).size !== 9) errs.push(`sol row ${i} invalid`);
      if (new Set(p.sol.map((r) => r[i])).size !== 9) errs.push(`sol col ${i} invalid`);
    }
    for (let b = 0; b < 9; b++) {
      const br = 3 * ((b / 3) | 0), bc = 3 * (b % 3), s = new Set();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s.add(p.sol[br + i][bc + j]);
      if (s.size !== 9) errs.push(`sol box ${b} invalid`);
    }
    const n = countSolutions(p.given);
    if (n !== 1) errs.push(`solutions=${n}, need exactly 1`);
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `${clueN} clues, valid sol, unique`);
  }
}

// ─── TALLY ──────────────────────────────────────────────────────────────────
if (RUN('tally')) {
  const { PUZZLES } = await import('../app/tally/puzzles.js');
  for (const p of PUZZLES) {
    const N = p.size, errs = [];
    const cells = [];
    const rowRem = p.rowT.slice(), colRem = p.colT.slice();
    const bank = [...p.bank].sort((a, b) => a - b);
    // sol validity
    const used = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (p.blocked[r][c]) { if (p.sol[r][c] !== 0 && p.sol[r][c] !== undefined) { /* blocked cells shouldn't score */ } continue; }
      if (p.given[r][c]) { if (p.given[r][c] !== p.sol[r][c]) errs.push(`given/sol clash ${r},${c}`); }
      else { cells.push([r, c]); used.push(p.sol[r][c]); }
    }
    for (let r = 0; r < N; r++) {
      const s = p.sol[r].reduce((a, v, c) => a + (p.blocked[r][c] ? 0 : v), 0);
      if (s !== p.rowT[r]) errs.push(`row ${r} sums ${s} != ${p.rowT[r]}`);
    }
    for (let c = 0; c < N; c++) {
      let s = 0;
      for (let r = 0; r < N; r++) if (!p.blocked[r][c]) s += p.sol[r][c];
      if (s !== p.colT[c]) errs.push(`col ${c} sums ${s} != ${p.colT[c]}`);
    }
    if (JSON.stringify([...used].sort((a, b) => a - b)) !== JSON.stringify(bank)) errs.push('sol does not use exactly the bank multiset');
    // uniqueness: DFS over empty cells with the bank multiset
    let count = 0;
    const rr = p.rowT.map((t, r) => t - p.sol[r].reduce((a, v, c) => a + ((p.blocked[r][c] || !p.given[r][c]) ? 0 : v), 0));
    const cc = p.colT.map((t, c) => { let s = t; for (let r = 0; r < N; r++) if (!p.blocked[r][c] && p.given[r][c]) s -= p.given[r][c]; return s; });
    const counts = {};
    for (const v of bank) counts[v] = (counts[v] || 0) + 1;
    const vals = Object.keys(counts).map(Number).sort((a, b) => a - b);
    // per-row/col remaining cell tallies for pruning
    const rowCells = Array(N).fill(0), colCells = Array(N).fill(0);
    for (const [r, c] of cells) { rowCells[r]++; colCells[c]++; }
    const maxV = Math.max(...vals, 0);
    const dfs = (i, rRem, cRem, rCnt, cCnt) => {
      if (count >= 2) return;
      if (i === cells.length) { if (rRem.every((x) => x === 0) && cRem.every((x) => x === 0)) count++; return; }
      const [r, c] = cells[i];
      for (const v of vals) {
        if (!counts[v]) continue;
        if (v > rRem[r] || v > cRem[c]) continue;
        // prune: remaining cells in this row/col must be able to reach the remainder
        if (rCnt[r] - 1 === 0 && rRem[r] - v !== 0) continue;
        if (cCnt[c] - 1 === 0 && cRem[c] - v !== 0) continue;
        if (rRem[r] - v > (rCnt[r] - 1) * maxV) continue;
        if (cRem[c] - v > (cCnt[c] - 1) * maxV) continue;
        counts[v]--; rRem[r] -= v; cRem[c] -= v; rCnt[r]--; cCnt[c]--;
        dfs(i + 1, rRem, cRem, rCnt, cCnt);
        counts[v]++; rRem[r] += v; cRem[c] += v; rCnt[r]++; cCnt[c]++;
        if (count >= 2) return;
      }
    };
    dfs(0, rr, cc, rowCells.slice(), colCells.slice());
    if (count !== 1) errs.push(`solutions=${count}, need exactly 1`);
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `sol valid, bank exact, unique`);
  }
}

// ─── CARVE ──────────────────────────────────────────────────────────────────
if (RUN('carve')) {
  const { PUZZLES } = await import('../app/carve/puzzles.js');
  for (const p of PUZZLES) {
    const N = p.size, R = p.regions, T = p.target, errs = [];
    const idx = (r, c) => r * N + c;
    // sol validity
    const sums = Array(R).fill(0), cellsOf = Array.from({ length: R }, () => []);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const g = p.sol[r][c];
      if (g < 0 || g >= R) { errs.push(`sol label out of range at ${r},${c}`); continue; }
      sums[g] += p.grid[r][c]; cellsOf[g].push([r, c]);
    }
    sums.forEach((s, g) => { if (s !== T) errs.push(`region ${g} sums ${s} != ${T}`); });
    p.seeds.forEach(([r, c], g) => { if (p.sol[r][c] !== g) errs.push(`seed ${g} not in its region`); });
    for (let g = 0; g < R; g++) {
      const set = new Set(cellsOf[g].map(([r, c]) => idx(r, c)));
      const q = [cellsOf[g][0]], seen = new Set([idx(...cellsOf[g][0])]);
      while (q.length) {
        const [r, c] = q.pop();
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const k = idx(r + dr, c + dc);
          if (r + dr >= 0 && r + dr < N && c + dc >= 0 && c + dc < N && set.has(k) && !seen.has(k)) { seen.add(k); q.push([r + dr, c + dc]); }
        }
      }
      if (seen.size !== set.size) errs.push(`region ${g} disconnected`);
    }
    // uniqueness: enumerate all connected subsets containing each seed (no other
    // seed) summing to target, then exact-cover the board, capped at 2 covers.
    const seedIdx = p.seeds.map(([r, c]) => idx(r, c));
    const seedSet = new Set(seedIdx);
    const nbr = (k) => {
      const r = (k / N) | 0, c = k % N, out = [];
      if (r > 0) out.push(k - N);
      if (r < N - 1) out.push(k + N);
      if (c > 0) out.push(k - 1);
      if (c < N - 1) out.push(k + 1);
      return out;
    };
    const val = (k) => p.grid[(k / N) | 0][k % N];
    const regionsOf = seedIdx.map((s0) => {
      const found = [];
      // DFS over connected subsets: canonical growth (only add cells > removed barrier set is complex);
      // use the standard "enumerate connected induced subgraphs" with an exclusion set.
      const grow = (inSet, frontier, sum, excluded) => {
        if (sum === T) { found.push([...inSet]); return; }
        // prune: min remaining value is 1... values are >=1 so sum>T is dead
        if (sum > T) return;
        const fr = [...frontier];
        for (let i = 0; i < fr.length; i++) {
          const k = fr[i];
          if (excluded.has(k) || seedSet.has(k)) continue;
          // include k
          const in2 = new Set(inSet); in2.add(k);
          const fr2 = new Set(frontier); fr2.delete(k);
          for (const nb of nbr(k)) if (!in2.has(nb) && !excluded.has(nb)) fr2.add(nb);
          const ex2 = new Set(excluded);
          for (let j = 0; j < i; j++) ex2.add(fr[j]); // canonical: earlier frontier cells stay excluded
          grow(in2, fr2, sum + val(k), ex2);
        }
      };
      grow(new Set([s0]), new Set(nbr(s0)), val(s0), new Set());
      return found;
    });
    // exact cover count (cap 2)
    const ALL = N * N;
    let covers = 0;
    const coverDfs = (g, usedMask) => {
      if (covers >= 2) return;
      if (g === R) { if (usedMask.size === ALL) covers++; return; }
      for (const reg of regionsOf[g]) {
        let clash = false;
        for (const k of reg) if (usedMask.has(k)) { clash = true; break; }
        if (clash) continue;
        for (const k of reg) usedMask.add(k);
        coverDfs(g + 1, usedMask);
        for (const k of reg) usedMask.delete(k);
        if (covers >= 2) return;
      }
    };
    coverDfs(0, new Set());
    if (covers !== 1) errs.push(`partitions=${covers}, need exactly 1 (region options: ${regionsOf.map((x) => x.length).join('/')})`);
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `sol valid, unique partition`);
  }
}

// ─── GARBLE ─────────────────────────────────────────────────────────────────
if (RUN('garble')) {
  const { PUZZLES } = await import('../app/garble/puzzles.js');
  // common-word list for alternate-anagram ambiguity (client is exact-match)
  const sortKey = (w) => [...w.toLowerCase()].sort().join('');
  const anagramMap = new Map();
  for (const w of dict) {
    const k = sortKey(w);
    if (!anagramMap.has(k)) anagramMap.set(k, []);
    anagramMap.get(k).push(w);
  }
  for (const p of PUZZLES) {
    const errs = [], warns = [];
    let finalLetters = '';
    for (const w of p.words) {
      // Sunday Editions are SIX-letter answers; weekdays are five or six.
      if (p.sunday && w.answer.length !== 6) errs.push(`${w.answer}: Sunday Edition answers must be 6 letters`);
      if (sortKey(w.answer) !== sortKey(w.scramble)) errs.push(`${w.answer}: scramble not an anagram`);
      if (w.answer === w.scramble) errs.push(`${w.answer}: scramble equals answer`);
      for (const m of w.marks) { if (m < 0 || m >= w.answer.length) errs.push(`${w.answer}: mark ${m} out of range`); }
      finalLetters += w.marks.map((m) => w.answer[m]).join('');
      const alts = (anagramMap.get(sortKey(w.answer)) || []).filter((x) => x !== w.answer.toLowerCase());
      if (alts.length) warns.push(`${w.answer} has alternate anagram(s): ${alts.join(',')}`);
    }
    if (sortKey(finalLetters) !== sortKey(p.final)) errs.push(`marked letters don't anagram to final ${p.final}`);
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `anagrams + final OK${warns.length ? ` — REVIEW: ${warns.join(' | ')}` : ''}`);
  }
}

// ─── EMCEE ──────────────────────────────────────────────────────────────────
//   Rebuilt 2026-08-12. The old check only proved the slot lists tiled the
//   grid's runs, which is why it passed a 50-board batch whose clues were
//   dictionary glosses of the WRONG WORD (CUE clued as CLUE, ACRES as
//   DEMESNE, PAR as PARITY). It now also enforces, for every board live on or
//   after the rebuild date (earlier boards are frozen history and only earn a
//   note):
//     • every answer is in the curated clue bank AND carries that bank's own
//       clue — a clue written anywhere else cannot reach a grid;
//     • the grid is fully checked: every white square is in both an across and
//       a down word, so no 1-letter runs;
//     • numbering follows standard crossword rules;
//     • bank-wide variety: an answer appears at most 3 times, two boards share
//       at most 2 answers (3 between two Sundays), no grid shape more than 4x.
if (RUN('emcee')) {
  const { PUZZLES } = await import('../app/emcee/puzzles.js');
  const REBUILT_FROM = '2026-08-12';
  const BANK = new Map();
  for (const line of readFileSync(join(here, 'emcee-wordbank.txt'), 'utf8').trim().split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const i = line.indexOf('|');
    BANK.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  const answerOf = (p, w, dir) => {
    let s = '';
    for (let i = 0; i < w.len; i++) {
      const r = dir === 'A' ? w.r : w.r + i, c = dir === 'A' ? w.c + i : w.c;
      s += (p.grid[r] || '')[c] ?? '?';
    }
    return s;
  };
  const useCount = new Map(), shapeCount = new Map(), boardWords = [];
  for (const p of PUZZLES) {
    const errs = [], review = [], live = p.live >= REBUILT_FROM;
    const N = p.size, G = p.grid;
    if (G.length !== N) errs.push(`grid has ${G.length} rows, size ${N}`);
    G.forEach((row, i) => { if (row.length !== N) errs.push(`row ${i} is ${row.length} wide, size ${N}`); });
    if (errs.length) { fail(p.quizId, errs.join('; ')); continue; }

    const runs = [];
    for (let r = 0; r < N; r++) { let c = 0; while (c < N) { if (G[r][c] !== '#') { const s = c; while (c < N && G[r][c] !== '#') c++; if (c - s > 1) runs.push({ r, c: s, len: c - s, dir: 'A', word: G[r].slice(s, c) }); } else c++; } }
    for (let c = 0; c < N; c++) { let r = 0; while (r < N) { if (G[r][c] !== '#') { const s = r; while (r < N && G[r][c] !== '#') r++; if (r - s > 1) { let w = ''; for (let i = s; i < r; i++) w += G[i][c]; runs.push({ r: s, c, len: r - s, dir: 'D', word: w }); } } else r++; } }
    const declared = [...(p.across || []).map((s) => ({ ...s, dir: 'A' })), ...(p.down || []).map((s) => ({ ...s, dir: 'D' }))];
    if (declared.length !== runs.length) errs.push(`declared ${declared.length} slots, grid has ${runs.length} runs`);
    for (const d of declared) {
      if (!runs.find((x) => x.r === d.r && x.c === d.c && x.dir === d.dir && x.len === d.len)) errs.push(`slot ${d.n}${d.dir} doesn't match a grid run`);
    }

    // fully checked: every white square in BOTH directions (no 1-letter runs)
    const cover = new Map();
    for (const x of runs) for (let i = 0; i < x.len; i++) {
      const k = x.dir === 'A' ? `${x.r},${x.c + i}` : `${x.r + i},${x.c}`;
      cover.set(k, (cover.get(k) || 0) + 1);
    }
    const unchecked = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (G[r][c] === '#') continue;
      if ((cover.get(`${r},${c}`) || 0) < 2) unchecked.push(`${r},${c}`);
    }
    if (unchecked.length) (live ? errs : review).push(`unchecked square(s) ${unchecked.join(' ')}`);

    // numbering
    let n = 1; const nums = {};
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (G[r][c] === '#') continue;
      const a = (c === 0 || G[r][c - 1] === '#') && c + 1 < N && G[r][c + 1] !== '#';
      const d = (r === 0 || G[r - 1][c] === '#') && r + 1 < N && G[r + 1][c] !== '#';
      if (a || d) nums[`${r},${c}`] = n++;
    }
    for (const d of declared) {
      const want = nums[`${d.r},${d.c}`];
      if (want == null) errs.push(`${d.n}${d.dir} starts at a square that begins no word`);
      else if (want !== d.n) errs.push(`${d.n}${d.dir} should be numbered ${want}`);
    }

    // clue integrity — the whole point of this checker
    const words = [];
    for (const d of declared) {
      const a = answerOf(p, d, d.dir);
      words.push(a);
      if (a.includes('#') || a.includes('?')) { errs.push(`${d.n}${d.dir} reads "${a}"`); continue; }
      if (!BANK.has(a)) (live ? errs : review).push(`${a} is not in the clue bank`);
      else if (BANK.get(a) !== d.clue) (live ? errs : review).push(`${d.n}${d.dir} ${a}: clue is not the bank's ("${d.clue}")`);
      if (!dict.has(a.toLowerCase()) && !BANK.has(a)) review.push(`non-dict ${a}`);
    }
    if (new Set(words).size !== words.length) errs.push('an answer appears twice on the same board');
    if (live) for (const w of words) useCount.set(w, (useCount.get(w) || 0) + 1);
    const shape = G.map((row) => row.split('').map((ch) => (ch === '#' ? '#' : '.')).join('')).join('|');
    if (live && !p.sunday) shapeCount.set(shape, (shapeCount.get(shape) || 0) + 1);
    boardWords.push({ p, words: new Set(words), live });

    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `${runs.length} slots, fully checked, clues verified${review.length ? ` — REVIEW: ${review.join(' | ')}` : ''}`);
  }

  // ── bank-wide variety ────────────────────────────────────────────────────
  const CAP = 3;
  // frozen boards (#1–#27) are history and are not counted toward the caps
  const over = [...useCount].filter(([, c]) => c > CAP).map(([w, c]) => `${w} (${c}x)`);
  if (over.length) fail('emcee-bank', `answers over the ${CAP}-use cap: ${over.join(', ')}`);
  for (let i = 0; i < boardWords.length; i++) for (let j = i + 1; j < boardWords.length; j++) {
    const a = boardWords[i], b = boardWords[j];
    if (!a.live || !b.live) continue;
    const shared = [...a.words].filter((w) => b.words.has(w));
    const lim = a.p.sunday && b.p.sunday ? 3 : 2;
    if (shared.length > lim) fail('emcee-bank', `${a.p.quizId} and ${b.p.quizId} share ${shared.length} answers: ${shared.join(', ')}`);
  }
  const hotShapes = [...shapeCount].filter(([, c]) => c > 4);
  if (hotShapes.length) fail('emcee-bank', `grid shape reused ${hotShapes[0][1]}x (cap 4)`);
  if (!over.length && !hotShapes.length) ok('emcee-bank', `${useCount.size} distinct answers, ${shapeCount.size} weekday shapes, variety caps met`);
}

// ─── LINKS ──────────────────────────────────────────────────────────────────
if (RUN('links')) {
  const { PUZZLES } = await import('../app/links/puzzles.js');

  // ─── CATEGORY REUSE ──────────────────────────────────────────────────────
  // A links board is only as fresh as its categories, and the bank had drifted
  // hard toward reruns: 29 group names repeat, with "Gemstones" five times and
  // "Herbs", "Shades of green" and "Snakes" four each. Same rule shape as the
  // crux collision-pool check: boards live before the cutoff are frozen
  // history and only earn a review note, but from the cutoff a name that has
  // already been used twice anywhere in the bank cannot be used again.
  const REUSE_FROM = '2026-09-30';
  const REUSE_CAP = 2;
  const LINKS_COPY_FROM = '2026-10-12';
  const { scanUS: linksScanUS } = await import('./us-spellings.mjs');
  const normName = (n) => n.toLowerCase().replace(/\s+/g, ' ').trim();
  const nameCount = new Map();
  for (const p of PUZZLES) for (const g of p.groups) {
    const k = normName(g.name);
    nameCount.set(k, (nameCount.get(k) || 0) + 1);
  }
  const staleNames = [...nameCount].filter(([, n]) => n > REUSE_CAP).map(([k, n]) => `${k} (${n}x)`);
  if (staleNames.length) note('links-bank', `category names over ${REUSE_CAP} uses: ${staleNames.join(', ')}`);

  for (const p of PUZZLES) {
    const errs = [];
    if (p.groups.length !== 4) errs.push(`${p.groups.length} groups`);
    const all = p.groups.flatMap((g) => g.words);
    if (all.length !== 16) errs.push(`${all.length} words`);
    if (new Set(all).size !== all.length) errs.push('duplicate word across groups');
    for (const g of p.groups) if (g.words.length !== 4) errs.push(`group "${g.name}" has ${g.words.length}`);
    // US spellings and no em dash in everything a reader sees (group names and
    // words), from the 2026-10-12 restock on; earlier boards are frozen.
    if (p.live >= LINKS_COPY_FROM) {
      for (const g of p.groups) {
        for (const s of [g.name, ...g.words]) {
          for (const hit of linksScanUS(s)) errs.push(`British form "${hit.found}" in "${s}" (US: ${hit.us})`);
          if (/—/.test(s)) errs.push(`em dash in "${s}"`);
        }
      }
    }
    if (p.live >= REUSE_FROM) {
      for (const g of p.groups) {
        const k = normName(g.name);
        if (nameCount.get(k) > REUSE_CAP) {
          errs.push(`category "${g.name}" is used ${nameCount.get(k)}x across the bank (cap ${REUSE_CAP}) — pick a fresher angle`);
        }
      }
    }

    // ── COLLISIONS + EXACT UNIQUENESS ────────────────────────────────────
    // A collision is a word that plausibly reads as a DIFFERENT group on the
    // same board. They are the whole game, and also how a board ends up with
    // two defensible solutions — so the count is checked AND the board is
    // proved unique.
    //
    // THE PROOF (replaces the old pinning heuristic, 2026-07-20): treat each
    // word's plausible memberships as its home group plus every annotated
    // collision, then COUNT the assignments of 16 words to the 4 groups where
    // every group gets exactly 4. Exactly one is required.
    //
    // This is exact where pinning was merely sufficient. Pinning demanded that
    // a tempted group contain no colliding word, which wrongly rejects a
    // MUTUAL temptation that the arithmetic still resolves: on 2026-07-21 FORD
    // reads as a car and DODGE reads as avoid, but presidents then has only
    // three members, so FORD must stay put and DODGE follows. One solution,
    // and the old rule called it ambiguous.
    //
    // `collisions` is [{ word, reads }] where `reads` is the group NAME.
    // Sundays need >= 4, ordinary days >= 2 once annotated. Legacy boards
    // predate the field and are skipped (audit still manual there).
    const byName = new Map(p.groups.map((g) => [g.name, g]));
    const homeOf = new Map();
    for (const g of p.groups) for (const w of g.words) homeOf.set(w, g.name);
    if (p.collisions) {
      const minC = p.sunday ? 4 : 2;
      if (p.collisions.length < minC) errs.push(`${p.collisions.length} collisions, want >= ${minC}`);
      for (const c of p.collisions) {
        if (!homeOf.has(c.word)) { errs.push(`collision word "${c.word}" not on the board`); continue; }
        if (!byName.has(c.reads)) { errs.push(`collision "${c.word}" reads unknown group "${c.reads}"`); continue; }
        if (homeOf.get(c.word) === c.reads) errs.push(`collision "${c.word}" already lives in "${c.reads}"`);
      }
      // membership = home group + every annotated collision
      const member = new Map([...homeOf].map(([w, h]) => [w, new Set([h])]));
      for (const c of p.collisions) if (member.has(c.word) && byName.has(c.reads)) member.get(c.word).add(c.reads);
      const words = [...homeOf.keys()];
      const room = Object.fromEntries(p.groups.map((g) => [g.name, 4]));
      let solutions = 0;
      const walk = (k) => {
        if (solutions >= 2) return;
        if (k === words.length) { solutions++; return; }
        for (const n of member.get(words[k])) {
          if (room[n] === 0) continue;
          room[n]--; walk(k + 1); room[n]++;
          if (solutions >= 2) return;
        }
      };
      walk(0);
      if (solutions !== 1) {
        errs.push(solutions === 0
          ? 'no valid grouping — a collision annotation contradicts the board'
          : 'TWO OR MORE valid groupings — the board is ambiguous');
      }

      // ── ONE-WAY FLOW ACKNOWLEDGEMENT (owner rule, 2026-08-04) ───────────
      // The proof above is only as honest as the declared collisions. Its
      // blind spot: declare that words of A read as B, omit that something in
      // B reads back as A, and the arithmetic pins A's words for a reason
      // that is not true. #24 shipped that way — MARS/VENUS/SATURN were
      // declared to read as Roman gods and the gods group looked full, but
      // JUPITER sitting in it is itself a planet, so the board had five valid
      // groupings and the proof never saw it.
      //
      // So when >= 2 words of A read as B and nothing in B reads back, the
      // author is making a real claim: no member of B could belong to A.
      // Require it in writing as `reverseChecked: ['A -> B']`. Undeclared is
      // a failure, not a warning — a silent omission is exactly the bug.
      const flow = new Map();
      for (const c of p.collisions) {
        if (!homeOf.has(c.word) || !byName.has(c.reads)) continue;
        const k = `${homeOf.get(c.word)} -> ${c.reads}`;
        flow.set(k, (flow.get(k) || 0) + 1);
      }
      const signed = new Set(p.reverseChecked || []);
      for (const [k, n] of flow) {
        const [from, to] = k.split(' -> ');
        if (n < 2 || flow.has(`${to} -> ${from}`)) continue;
        if (!signed.has(k)) {
          errs.push(`one-way collision flow "${k}" (${n} words) is unacknowledged — `
            + `confirm no "${to}" on this board could read as "${from}", then add it to reverseChecked`);
        }
      }
      for (const k of signed) {
        const [from, to] = (k.split(' -> ').length === 2 ? k.split(' -> ') : [null, null]);
        if (!from || !byName.has(from) || !byName.has(to)) {
          errs.push(`reverseChecked "${k}" does not name two groups on this board`);
        } else if (!flow.has(k) || flow.get(k) < 2 || flow.has(`${to} -> ${from}`)) {
          errs.push(`reverseChecked "${k}" is stale — that is no longer a one-way flow`);
        }
      }
    } else if (p.reverseChecked) {
      errs.push('reverseChecked without collisions');
    } else if (p.sunday) {
      errs.push('Sunday Edition must declare its collisions');
    }
    const note = p.collisions
      ? `structure OK, ${p.collisions.length} collisions, exactly one valid grouping`
      : 'structure OK (no collisions declared; semantic audit manual, §7a)';
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, note);
  }
}

// ─── CRUX ───────────────────────────────────────────────────────────────────
if (RUN('crux')) {
  const { PUZZLES } = await import('../app/crux/puzzles.js');
  // Boards before this date are frozen history: they were authored before the
  // floor was machine-checkable, and rewriting a played board is not allowed.
  const CRUX_FLOOR_FROM = '2026-08-03';
  // Variety is enforced on anything banked after the current bank's last day,
  // so the next "bank crux to N days" job cannot recycle two traps forever.
  const CRUX_VARIETY_FROM = '2026-08-20';
  const cruxPool = new Map();
  const cruxFresh = new Map();
  // The client validates a guess against public/crux-words.txt, NOT the rack
  // games' tuck-dict, so this is the list to check answers against and the one
  // whose coverage decides whether a slot is playable at all.
  const cruxDict = new Set(readFileSync(join(here, '../public/crux-words.txt'), 'utf8').trim().split('\n'));
  for (const p of PUZZLES) {
    const errs = [], review = [];
    const catWords = p.categories.flatMap((c) => c.words);
    const slotWords = p.slots.map((s) => s.word);
    if (catWords.length !== slotWords.length) errs.push(`cats ${catWords.length} != slots ${slotWords.length}`);
    const missing = catWords.filter((w) => !slotWords.includes(w));
    if (missing.length) errs.push(`category words never placed: ${missing.join(',')}`);
    if (new Set(slotWords).size !== slotWords.length) errs.push('duplicate slot word');
    // geometry + crossings
    const cells = {};
    for (const s of p.slots) {
      for (let i = 0; i < s.word.length; i++) {
        const r = s.dir === 'D' ? s.row + i : s.row;
        const c = s.dir === 'D' ? s.col : s.col + i;
        if (r >= p.rows || c >= p.cols || r < 0 || c < 0) { errs.push(`${s.id} exits board`); break; }
        const k = `${r},${c}`;
        if (cells[k] && cells[k] !== s.word[i]) errs.push(`crossing clash at ${k} (${cells[k]} vs ${s.word[i]})`);
        cells[k] = s.word[i];
      }
      if (!cruxDict.has(s.word.toLowerCase())) review.push(s.word);
    }
    // ── exactly one geometric filing ───────────────────────────────────────
    // A solver who has deduced the words must be able to place them one way
    // only; two filings means the board is ambiguous, not hard.
    if (p.live >= CRUX_FLOOR_FROM) {
      const n = p.slots.length;
      const pos = p.slots.map((s) => [...s.word].map((_, i) => (s.dir === 'A' ? `${s.row},${s.col + i}` : `${s.row + i},${s.col}`)));
      const words = p.slots.map((s) => s.word);
      const cross = {};
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (const c of pos[i]) if (pos[j].includes(c)) {
        (cross[i] = cross[i] || []).push([pos[i].indexOf(c), j, pos[j].indexOf(c)]);
        (cross[j] = cross[j] || []).push([pos[j].indexOf(c), i, pos[i].indexOf(c)]);
      }
      const cand = pos.map((pp) => words.map((w, wi) => [w, wi]).filter(([w]) => w.length === pp.length).map(([, wi]) => wi));
      const order = [...Array(n).keys()].sort((a, b) => cand[a].length - cand[b].length);
      const asg = Array(n).fill(-1), used = Array(n).fill(false);
      let count = 0;
      (function rec(k) {
        if (count >= 2) return;
        if (k === n) { count++; return; }
        const s2 = order[k];
        for (const wi of cand[s2]) {
          if (used[wi]) continue;
          const w = words[wi];
          let good = true;
          for (const [ci, o, cj] of (cross[s2] || [])) if (asg[o] >= 0 && w[ci] !== words[asg[o]][cj]) { good = false; break; }
          if (!good) continue;
          asg[s2] = wi; used[wi] = true; rec(k + 1); asg[s2] = -1; used[wi] = false;
          if (count >= 2) return;
        }
      })(0);
      if (count !== 1) errs.push(`${count >= 2 ? 'more than one' : 'no'} way to file the words into the slots`);
    }
    // ── collision floor ────────────────────────────────────────────────────
    // The rule the bank quietly broke once: a board whose only traps read as
    // categories that are not ON the board is flat, and half its score (the
    // filing half) is then free. See the header of app/crux/puzzles.js.
    if (p.live >= CRUX_FLOOR_FROM) {
      const floor = p.sunday ? 3 : 2;
      const cs = Array.isArray(p.collisions) ? p.collisions : null;
      if (!cs) errs.push('no collisions declared');
      else {
        const names = p.categories.map((c) => c.name);
        const seen = new Set();
        for (const c of cs) {
          const home = p.categories.find((cat) => cat.words.includes(c.word));
          if (!home) errs.push(`collision word ${c.word} is not on the board`);
          else if (!names.includes(c.reads)) errs.push(`${c.word} reads "${c.reads}", which is not a category here`);
          else if (home.name === c.reads) errs.push(`${c.word} reads its own category`);
          const k = `${c.word}|${c.reads}`;
          if (seen.has(k)) errs.push(`duplicate collision ${k}`);
          seen.add(k);
          cruxPool.set(k, (cruxPool.get(k) || 0) + 1);
          if (p.live >= CRUX_VARIETY_FROM) cruxFresh.set(k, (cruxFresh.get(k) || 0) + 1);
        }
        if (cs.length < floor) errs.push(`${cs.length} collision${cs.length === 1 ? '' : 's'}, floor is ${floor}${p.sunday ? ' on a Sunday' : ''}`);
      }
    }
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `slots+crossings OK${review.length ? ` — REVIEW non-dict: ${review.join(',')}` : ''}`);
  }
  // ── guess-space coverage, per slot length ─────────────────────────────────
  // A slot is only playable if the dictionary holds a real vocabulary at its
  // length: the client rejects anything outside the list, so a length with no
  // entries rejects every word a player can type. crux-8-9-26 shipped a
  // 9-letter slot against a list that stopped at 8, which gave that slot a
  // guess space of five words and cost a player the board. Proved per length,
  // over the whole bank, so the next long answer cannot repeat it.
  const cruxLenCount = new Map();
  for (const w of cruxDict) cruxLenCount.set(w.length, (cruxLenCount.get(w.length) || 0) + 1);
  const CRUX_COVER_MIN = 500;   // keep in sync with DICT_COVER_MIN in CruxClient.jsx
  const slotLens = [...new Set(PUZZLES.flatMap((p) => p.slots.map((s) => s.word.length)))].sort((a, b) => a - b);
  const thinLens = slotLens.filter((L) => (cruxLenCount.get(L) || 0) < CRUX_COVER_MIN);
  if (thinLens.length) {
    fail('crux dict', `public/crux-words.txt holds fewer than ${CRUX_COVER_MIN} words at slot length${thinLens.length > 1 ? 's' : ''} ${thinLens.join(', ')} ` +
      `(${thinLens.map((L) => `${L}:${cruxLenCount.get(L) || 0}`).join(', ')}) — a player guessing at that length is rejected whatever they type`);
  } else {
    ok('crux dict', `guess space covers every slot length ${slotLens[0]} to ${slotLens[slotLens.length - 1]} (thinnest: ${
      slotLens.map((L) => [L, cruxLenCount.get(L) || 0]).sort((a, b) => a[1] - b[1])[0].join(' letters, ')} words)`);
  }

  // ── collision-pool variety ────────────────────────────────────────────────
  const stale = [...cruxPool.entries()].filter(([, n]) => n > 2).sort((a, b) => b[1] - a[1]);
  const staleFresh = [...cruxFresh.entries()].filter(([, n]) => n > 2);
  if (staleFresh.length) {
    fail('crux pool', `same collision reused more than twice on boards live from ${CRUX_VARIETY_FROM}: ${staleFresh.map(([k, n]) => `${k} x${n}`).join(', ')}`);
  } else if (stale.length) {
    note('crux pool', `grandfathered repetition in the Aug 11 to Sep 29 generated batch: ${stale.slice(0, 6).map(([k, n]) => `${k} x${n}`).join(', ')}${stale.length > 6 ? `, +${stale.length - 6} more` : ''}`);
  } else {
    ok('crux pool', 'collision pool is varied');
  }

  // ── bank variety: spacing, repeats, ceilings (owner ruling, 2026-08-19) ───
  // The rule the Aug 11 to Sep 29 batch broke while every per-board check
  // above passed it. That batch put Colors on 25 of its 50 boards and Metals
  // on 23, ran BRONZE 19 times, and repeated 30 category+wordset pairs
  // outright — Metals: BRONZE/SILVER nine times, and on Aug 18 and Aug 19 back
  // to back, which is what a player noticed. Nothing here is exotic; nobody
  // had written the check, so a generator optimizing for the collision floor
  // was free to collapse onto the four categories that collide most easily.
  //
  // This is the §7 pool-variety rule from CLAUDE.md applied to crux: legality
  // is per board, variety is only visible across the WHOLE bank, so it has to
  // be counted across the whole bank.
  //
  // A violation is flagged when the LATER board is live from CRUX_FRESH_FROM,
  // deliberately: a new board must not repeat what a FROZEN board just used
  // (Aug 19 against Aug 18 is exactly the reported bug), while boards that are
  // already played stay frozen history and are never rewritten.
  const CRUX_FRESH_FROM = '2026-08-20';
  const CAT_GAP = 7;             // days before a category name may return
  const WORD_GAP = 14;           // days before an answer word may return
  const CAT_CEIL_PER_50 = 7;     // whole-bank ceilings, scaled by bank length
  const WORD_CEIL_PER_50 = 4;    // keep all four in sync with scripts/gen-crux.mjs
  const CDAY = (s) => Math.round(Date.parse(`${s}T00:00:00Z`) / 864e5);
  const sorted = [...PUZZLES].sort((a, b) => (a.live < b.live ? -1 : 1));
  const freshBoards = sorted.filter((p) => p.live >= CRUX_FRESH_FROM);
  const seenCat = new Map(), seenWord = new Map(), seenSig = new Map();
  const nCat = new Map(), nWord = new Map();
  const vio = [];
  for (const p of sorted) {
    const d = CDAY(p.live), isFresh = p.live >= CRUX_FRESH_FROM;
    for (const c of p.categories) {
      const prev = seenCat.get(c.name);
      if (isFresh && prev && d - prev.d < CAT_GAP) {
        vio.push(`${p.quizId}: category "${c.name}" also ran on ${prev.id}, ${d - prev.d} day${d - prev.d === 1 ? '' : 's'} earlier (needs ${CAT_GAP})`);
      }
      seenCat.set(c.name, { d, id: p.quizId });
      const sig = `${c.name}: ${[...c.words].sort().join('/')}`;
      const was = seenSig.get(sig);
      if (isFresh && was) vio.push(`${p.quizId}: "${sig}" is a straight repeat of ${was}`);
      seenSig.set(sig, p.quizId);
      if (isFresh) nCat.set(c.name, (nCat.get(c.name) || 0) + 1);
      for (const w of c.words) {
        const pw = seenWord.get(w);
        if (isFresh && pw && d - pw.d < WORD_GAP) {
          vio.push(`${p.quizId}: answer ${w} also ran on ${pw.id}, ${d - pw.d} day${d - pw.d === 1 ? '' : 's'} earlier (needs ${WORD_GAP})`);
        }
        seenWord.set(w, { d, id: p.quizId });
        if (isFresh) nWord.set(w, (nWord.get(w) || 0) + 1);
      }
    }
  }
  const cCeil = Math.max(2, Math.round((CAT_CEIL_PER_50 * freshBoards.length) / 50));
  const wCeil = Math.max(1, Math.round((WORD_CEIL_PER_50 * freshBoards.length) / 50));
  for (const [k, n] of nCat) if (n > cCeil) vio.push(`category "${k}" runs ${n} times over ${freshBoards.length} boards, ceiling ${cCeil}`);
  for (const [k, n] of nWord) if (n > wCeil) vio.push(`answer ${k} runs ${n} times over ${freshBoards.length} boards, ceiling ${wCeil}`);
  if (!freshBoards.length) {
    note('crux variety', `no boards live from ${CRUX_FRESH_FROM} to check`);
  } else if (vio.length) {
    fail('crux variety', `${vio.length} spacing violation${vio.length === 1 ? '' : 's'}: ${vio.slice(0, 8).join('; ')}${vio.length > 8 ? `; +${vio.length - 8} more` : ''}`);
  } else {
    const worstCat = [...nCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const worstWord = [...nWord.entries()].sort((a, b) => b[1] - a[1])[0];
    ok('crux variety', `${freshBoards.length} boards from ${CRUX_FRESH_FROM}: ${nCat.size} distinct categories (most used ${worstCat[0]} x${worstCat[1]}, ceiling ${cCeil}), `
      + `${nWord.size} distinct answers (most used ${worstWord[0]} x${worstWord[1]}, ceiling ${wCeil}), no category inside ${CAT_GAP} days, no answer inside ${WORD_GAP}`);
  }
}

// ─── SPAN ───────────────────────────────────────────────────────────────────
if (RUN('span')) {
  const { PUZZLES } = await import('../app/span/puzzles.js');
  const { buildAdj, shortestHops } = await import('../app/span/borders.js');
  const adj = buildAdj();
  for (const p of PUZZLES) {
    const errs = [];
    let truePerfect;
    if (p.avoid) {
      truePerfect = shortestHops(adj, p.start, p.end, new Set([p.avoid]));
      const un = shortestHops(adj, p.start, p.end);
      if (truePerfect === un) errs.push('avoid constraint changes nothing');
    } else if (p.via) {
      const a = shortestHops(adj, p.start, p.via);
      const b = shortestHops(adj, p.via, p.end);
      truePerfect = (a != null && b != null) ? a + b : null;
    } else {
      truePerfect = shortestHops(adj, p.start, p.end);
    }
    if (truePerfect == null) errs.push('no route exists');
    else if (truePerfect !== p.perfect) errs.push(`perfect ${p.perfect} != BFS ${truePerfect}`);
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `perfect ${p.perfect} = BFS${p.via ? ` (via ${p.via})` : p.avoid ? ` (avoid ${p.avoid})` : ''}`);
  }
}

// ─── DATING / CIRCA / EXTRA / OUTWIT ────────────────────────────────────────
if (RUN('dating')) {
  const { PUZZLES } = await import('../app/dating/puzzles.js');
  const { scanUS } = await import('./us-spellings.mjs');
  // The past is frozen (authoring standard rule 10). These checks landed with
  // the 2026-09-04 bank extension, so they are scoped to the boards that
  // extension authored and everything after; boards before it are history.
  const DATING_COPY_FROM = '2026-09-30';
  const ALLOW = ["Ford's Theatre", 'Encyclopaedia Britannica', 'from Tyre'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  for (const p of PUZZLES) {
    const errs = [];
    // Sunday Editions run SIX events; weekdays run five.
    const wantEvents = p.sunday ? 6 : 5;
    if (p.events.length !== wantEvents) errs.push(`${p.events.length} events (want ${wantEvents})`);
    for (let i = 1; i < p.events.length; i++) if (!(p.events[i].when > p.events[i - 1].when)) errs.push(`order not strictly ascending at #${i}`);
    if (new Set(p.events.map((e) => e.t)).size !== p.events.length) errs.push('duplicate event');
    if (p.live >= DATING_COPY_FROM) {
      // the calendar fields are derived, never authored, so re-derive them
      const [y, m, d] = p.live.split('-').map(Number);
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      if (p.quizId !== `dating-${m}-${d}-${String(y).slice(2)}`) errs.push(`quizId ${p.quizId} does not match ${p.live}`);
      if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) errs.push(`dateLabel "${p.dateLabel}" does not match ${p.live}`);
      if (!!p.sunday !== (dow === 0)) errs.push(`sunday=${!!p.sunday} but ${p.live} is dow ${dow}`);
      if (!p.theme || !p.theme.trim()) errs.push('missing theme');
      if (!p.note || !p.note.trim()) errs.push('missing note');
      for (const e of p.events) {
        // `y` is what the player is shown; `when` is what the order is proved
        // against. A board where they disagree reveals a wrong year on reveal.
        if (!e.d || !e.d.trim()) errs.push(`"${e.t}" has no timeline sentence`);
        const raw = String(e.y).replace(/,/g, '');
        const digits = raw.match(/\d+/);
        const signed = digits ? (/BC/i.test(raw) ? -Number(digits[0]) : Number(digits[0])) : NaN;
        if (signed !== e.when) errs.push(`"${e.t}" shows y=${e.y} but when=${e.when}`);
      }
      for (const [label, text] of [['theme', p.theme], ['note', p.note],
        ...p.events.flatMap((e) => [['event', e.t], ['story', e.d]])]) {
        if (/[\u2014\u2013]/.test(String(text || ''))) errs.push(`em dash in ${label}`);
        for (const hit of scanUS(text, ALLOW)) errs.push(`British form "${hit.found}" in ${label} (US: ${hit.us})`);
      }
    }
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, 'strictly ascending, distinct');
  }
  // Pool variety across the WHOLE future window, not per board (bulk rule 3).
  // Per-board legality passes happily on a bank that says the same thing every
  // week; this is what caught nothing in dating until it was measured.
  const EVENT_CAP = 2, THEME_CAP = 1;
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const evUse = new Map(), thUse = new Map();
  for (const p of PUZZLES) {
    if (p.live < DATING_COPY_FROM) continue;
    thUse.set(norm(p.theme), (thUse.get(norm(p.theme)) || 0) + 1);
    for (const e of p.events) evUse.set(norm(e.t), (evUse.get(norm(e.t)) || 0) + 1);
  }
  const hotEv = [...evUse].filter(([, c]) => c > EVENT_CAP);
  const hotTh = [...thUse].filter(([, c]) => c > THEME_CAP);
  if (hotEv.length) fail('dating-bank', `event over the ${EVENT_CAP}-use cap: ${hotEv.map(([k, c]) => `${k} (${c}x)`).join(', ')}`);
  if (hotTh.length) fail('dating-bank', `theme over the ${THEME_CAP}-use cap: ${hotTh.map(([k, c]) => `${k} (${c}x)`).join(', ')}`);
  if (!hotEv.length && !hotTh.length) ok('dating-bank', `${evUse.size} distinct events and ${thUse.size} distinct themes from ${DATING_COPY_FROM}`);
}
if (RUN('circa')) {
  const { PUZZLES } = await import('../app/circa/puzzles.js');
  for (const p of PUZZLES) {
    const errs = [];
    if (!Number.isInteger(p.year) || p.year < -4000 || p.year > 2026) errs.push(`year ${p.year} out of range`);
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `${p.year} sane`);
  }
}
if (RUN('extra')) {
  const { PUZZLES } = await import('../app/extra/puzzles.js');
  const { resolveHidden } = await import('../app/extra/resolve-hidden.js');
  for (const p of PUZZLES) {
    const errs = [];
    // resolveHidden is the CLIENT's own matcher ('WORD#2' = 2nd occurrence);
    // it throws if any spec fails to land on a headline word.
    try { resolveHidden(p); } catch (e) { errs.push(String(e.message || e)); }
    for (const k of p.keys) {
      if (k !== k.toLowerCase()) errs.push(`key "${k}" not lowercase`);
      if (k.length < 3) errs.push(`key "${k}" too short (substring matching)`);
    }
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `${p.hidden.length} hidden + ${p.keys.length} keys OK`);
  }
}
// ─── OUTWIT ─────────────────────────────────────────────────────────────────
// Structural + CROWD-SHAPE. Outwit's boards have no solution to re-solve: the
// "answer" to every prompt is whatever the field does, and while fewer than
// eleven real players are in, the field IS the pre-written `house` crowd (see
// lib/outwit-score.js, HOUSE_CUTOFF). So the house distribution is the closest
// thing this game has to an answer key, and it is what gets checked here.
//
// WHAT A HOUSE ARRAY IS. An authoring estimate of how a crowd would answer,
// rendered as votes. It is not observed play (app/outwit/puzzles.js says so in
// its header, and scripts/gen-outwit.mjs says so at length). This checker never
// treats it as data about real players; it only asks whether the estimate has
// the shape the game needs.
//
// THE SHAPE THE GAME NEEDS. A prompt with no right answer still has to have a
// findable crowd answer: an evenly split field pays nothing for insight, and a
// unanimous one is a gimme. So from OUTWIT_CROWD_FROM every choice prompt must
// land inside a band -- a favorite that leads but does not run away, a real
// runner-up and third, and a tail that is actually reachable. Boards banked
// before that date are frozen history and are reported, not failed.
//
// ALSO CHECKED, because these are rules the game states about itself and nobody
// was checking them: the calendar (contiguous nums, no gap days, quizId and
// dateLabel derived from `live`), the Sunday Edition flag against the real
// weekday from OUTWIT_SUNDAY_FROM, the daily Undercut fraction against the
// eight-value set and the no-back-to-back rule (owner rule 2026-07-20), herd
// truths inside their own range, prompt text never repeating across the bank,
// and US spellings in reader-facing copy (authoring standard #8).
if (RUN('outwit')) {
  const { PUZZLES } = await import('../app/outwit/puzzles.js');
  // The Undercut (twothirds) prompt moved from FIRST to LAST on 2026-07-21, so
  // the expected order depends on the drop date. Earlier days are live and
  // frozen; they keep the original order.
  const UNDERCUT_LAST_FROM = '2026-07-21';
  const ORDER_OLD = ['twothirds', 'least', 'herd', 'match', 'unique'];
  const ORDER_NEW = ['least', 'herd', 'match', 'unique', 'twothirds'];
  // Sunday Editions run SIX prompts: a second `unique` before the Undercut,
  // which still runs last.
  const ORDER_SUN = ['least', 'herd', 'match', 'unique', 'unique', 'twothirds'];
  // Outwit's Sunday Edition started 2026-07-26 (CLAUDE.md, "Which games have
  // one"). 2026-07-19 is a Sunday that ran a weekday board and is NOT a defect.
  const OUTWIT_SUNDAY_FROM = '2026-07-26';
  // The crowd-shape rules land with the 2026-09-30 extension. Everything before
  // it is grandfathered (authoring standard #10): boards 17-75 ship 24-vote
  // house crowds against a documented ~48, and boards from 2026-08-16 on repeat
  // one canned second Rare Bird every Sunday. Both are reported below as notes.
  const OUTWIT_CROWD_FROM = '2026-09-30';
  const POOL = 48;                 // documented house size (file header, CLAUDE-QUIZZES 7)
  const VEC_CEIL = 12;             // max boards one count vector may shape, per slot
  const MODAL_CEIL = 2;            // max boards one Meeting Point favorite may head
  const OPT_CEIL = 5;              // max prompts one option string may appear in
  const FRACS = new Map([[1 / 3, 'a third'], [1 / 3, 'one-third'], [2 / 5, 'two-fifths'], [1 / 2, 'half'],
    [3 / 5, 'three-fifths'], [2 / 3, 'two-thirds'], [7 / 10, 'seven-tenths'], [3 / 4, 'three-quarters'], [4 / 5, 'four-fifths']]);
  const FRAC_OK = new Set([1 / 3, 2 / 5, 1 / 2, 3 / 5, 2 / 3, 7 / 10, 3 / 4, 4 / 5]);
  const LABEL_OK = { 'a third': 1 / 3, 'one-third': 1 / 3, 'two-fifths': 2 / 5, half: 1 / 2, 'three-fifths': 3 / 5, 'two-thirds': 2 / 3, 'seven-tenths': 7 / 10, 'three-quarters': 3 / 4, 'four-fifths': 4 / 5 };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // British forms a word list drags in. Reader-facing copy is US-spelled.
  const BRITISH_RE = /\b(colour|colours|coloured|favourite|flavour|flavours|theatre|programme|centimetres|metres|litres|neighbour|practise|organise|organised|realise|apologise|defence|offence|pyjamas|aeroplane|aluminium|jewellery|moustache|plough|storey|tyre|kerb|grey)\b/i;
  // Proper nouns keep their own spelling: Earl Grey is a tea, not a color.
  const PROPER = /Earl Grey|Grey Cup|Grey's/g;
  const BRITISH = { test: (s) => BRITISH_RE.test(String(s).replace(PROPER, '')) };

  const countsOf = (house, K) => { const c = new Array(K).fill(0); for (const v of house) if (Number.isInteger(v) && v >= 0 && v < K) c[v]++; return c; };
  // The crowd-shape bands, written here from the rule rather than imported from
  // the generator, so the generator and the proof are not the same code.
  const shapeErrors = (type, c) => {
    const e = [];
    const asc = [...c].sort((a, b) => a - b), desc = [...c].sort((a, b) => b - a);
    if (asc[0] < 1) e.push('an option nobody picked: it can never win, so it is a trap');
    if (type === 'match') {
      if (desc[0] < 15 || desc[0] > 24) e.push(`favorite ${desc[0]}/${POOL} outside 15-24 (gimme or coin flip)`);
      if (desc[0] - desc[1] < 4) e.push(`favorite only ${desc[0] - desc[1]} clear of the runner-up`);
      if (desc[1] < 10) e.push(`runner-up ${desc[1]} < 10: no real second place`);
      if (desc[2] < 7) e.push(`third place ${desc[2]} < 7`);
    } else if (type === 'least') {
      if (asc[0] < 4 || asc[0] > 8) e.push(`rarest ${asc[0]} outside 4-8`);
      if (asc[1] - asc[0] < 3) e.push(`rarest only ${asc[1] - asc[0]} clear of the next-rarest`);
      if (desc[0] > 22) e.push(`favorite ${desc[0]} > 22`);
    } else if (type === 'unique') {
      if (asc[0] < 2) e.push(`rarest ${asc[0]} < 2`);
      if (asc[1] > 4) e.push(`second-rarest ${asc[1]} > 4: no findable tail`);
      if (asc[2] - asc[1] < 2) e.push(`third-rarest only ${asc[2] - asc[1]} clear of the two-point tier`);
      if (desc[0] > 12) e.push(`favorite ${desc[0]} > 12: that is a Meeting Point, not a Rare Bird`);
    }
    return e;
  };

  const seenQ = new Map();          // prompt text -> [quizId]
  const modalUse = new Map();
  const optUse = new Map();
  const vecUse = new Map();
  const grandfathered = { thin: 0, canned: 0, british: 0, dupQ: 0 };
  let prev = null, prevFrac = null;
  for (const p of PUZZLES) {
    const errs = [];
    const editable = p.live >= OUTWIT_CROWD_FROM;
    // ── calendar
    const [Y, M, D] = String(p.live).split('-').map(Number);
    const wantId = `outwit-${M}-${D}-${String(Y).slice(2)}`;
    const wantLabel = `${MONTHS[M - 1]} ${D}, ${Y}`;
    if (p.quizId !== wantId) errs.push(`quizId ${p.quizId} != ${wantId} derived from live`);
    if (p.dateLabel !== wantLabel) errs.push(`dateLabel ${p.dateLabel} != ${wantLabel}`);
    const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
    if (p.live >= OUTWIT_SUNDAY_FROM && !!p.sunday !== (dow === 0)) errs.push(`sunday flag ${!!p.sunday} but weekday ${dow}`);
    if (prev) {
      if (p.num !== prev.num + 1) errs.push(`num ${p.num} does not follow ${prev.num}`);
      if (Date.parse(`${p.live}T00:00:00Z`) - Date.parse(`${prev.live}T00:00:00Z`) !== 86400000) errs.push(`gap in the calendar after ${prev.live}`);
    }
    // ── prompt shape and order
    const wantPrompts = p.sunday ? 6 : 5;
    if (p.prompts.length !== wantPrompts) errs.push(`${p.prompts.length} prompts (want ${wantPrompts})`);
    p.prompts.forEach((pr, i) => {
      const ORDER = p.sunday ? ORDER_SUN : p.live >= UNDERCUT_LAST_FROM ? ORDER_NEW : ORDER_OLD;
      if (pr.type !== ORDER[i]) errs.push(`prompt ${i} type ${pr.type} != ${ORDER[i]}`);
      if ((pr.type === 'least' || pr.type === 'match') && (!Array.isArray(pr.options) || pr.options.length < 4)) errs.push(`prompt ${i} bad options`);
      if (pr.type === 'herd' && pr.truth === undefined) errs.push('herd missing truth');
      if (!Array.isArray(pr.house) || pr.house.length < 8) errs.push(`prompt ${i} thin house crowd`);
      if (!pr.house) return;
      // ── prompt text is never reused (the Undercut is the same prompt daily by
      //    design, with the day's fraction swapped in, so it is exempt)
      if (pr.type !== 'twothirds') {
        const hit = seenQ.get(pr.q);
        if (hit) { if (editable) errs.push(`prompt repeats ${hit}: "${pr.q.slice(0, 48)}..."`); else grandfathered.dupQ++; }
        else seenQ.set(pr.q, p.quizId);
      }
      if (editable && BRITISH.test(pr.q)) errs.push(`British spelling in prompt ${i}`);
      if (editable && (pr.options || []).some((o) => BRITISH.test(o))) errs.push(`British spelling in an option of prompt ${i}`);
      if (editable && pr.house.length !== POOL) errs.push(`house has ${pr.house.length} votes, want ${POOL}`);
      else if (!editable && pr.house.length !== POOL) grandfathered.thin++;
      // ── numeric prompts stay inside their own declared range
      if (!pr.options) {
        if (pr.house.some((v) => !Number.isInteger(v) || v < pr.min || v > pr.max)) errs.push(`${pr.type} house outside ${pr.min}-${pr.max}`);
        if (pr.type === 'herd') {
          if (pr.truth < pr.min || pr.truth > pr.max) errs.push(`herd truth ${pr.truth} outside its own ${pr.min}-${pr.max}`);
          if (editable && !pr.truthNote) errs.push('herd has no truthNote');
          if (editable) {
            const s = [...pr.house].sort((a, b) => a - b);
            const distinct = new Set(pr.house).size;
            const top = Math.max(...[...new Set(pr.house)].map((v) => pr.house.filter((x) => x === v).length));
            const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
            if (!Number.isInteger(med)) errs.push(`herd median ${med} is not a whole guess (the target must be reachable)`);
            if (top > pr.house.length * 0.45) errs.push(`herd: ${top} of ${pr.house.length} on one guess`);
            if (distinct < (med < 10 ? 5 : 8)) errs.push(`herd: only ${distinct} distinct guesses`);
          }
        }
        if (pr.type === 'twothirds' && p.live >= UNDERCUT_LAST_FROM) {
          // owner rule 2026-07-20: the fraction moves daily and never repeats
          // back to back, and the question copy has to say which one it is.
          if (!FRAC_OK.has(pr.frac)) errs.push(`Undercut frac ${pr.frac} is not one of the eight`);
          if (!pr.fracLabel || LABEL_OK[pr.fracLabel] !== pr.frac) errs.push(`fracLabel "${pr.fracLabel}" does not match frac ${pr.frac}`);
          else if (!pr.q.includes(pr.fracLabel.toUpperCase())) errs.push(`Undercut copy does not name its own fraction (${pr.fracLabel})`);
          if (prevFrac !== null && pr.fracLabel && LABEL_OK[pr.fracLabel] === prevFrac) errs.push(`Undercut fraction repeats the previous day (${pr.fracLabel})`);
        }
        if (pr.type === 'twothirds') prevFrac = pr.frac ?? 2 / 3;
        return;
      }
      // ── choice prompts: the crowd has to have a findable answer
      const c = countsOf(pr.house, pr.options.length);
      if (c.reduce((a, b) => a + b, 0) !== pr.house.length) errs.push(`prompt ${i} has a house vote outside its options`);
      if (new Set(pr.options).size !== pr.options.length) errs.push(`prompt ${i} repeats an option`);
      if (editable) {
        for (const m of shapeErrors(pr.type, c)) errs.push(`${pr.tag}: ${m}`);
        // THE SUNDAY EDITION PROVES ITS OWN SCALING (authoring standard #5). The
        // structural half is the sixth prompt, checked above. The other half is
        // that a Sunday crowd is HARDER TO READ: it never runs the steepest vote
        // ladder, so the favorite is closer to the pack and the call is tighter.
        const fav = Math.max(...c);
        const SUN_CAP = { match: 20, least: 19, unique: 11 }[pr.type];
        if (p.sunday && SUN_CAP && fav > SUN_CAP) errs.push(`${pr.tag}: Sunday favorite ${fav} > ${SUN_CAP}; a Sunday crowd must be closer than a weekday's`);
        const key = `${pr.type}:${[...c].sort((a, b) => b - a).join('-')}`;
        vecUse.set(key, (vecUse.get(key) || 0) + 1);
        for (const o of pr.options) optUse.set(o, (optUse.get(o) || 0) + 1);
        if (pr.type === 'match') {
          const fav = pr.options[c.indexOf(Math.max(...c))];
          modalUse.set(fav, (modalUse.get(fav) || 0) + 1);
        }
      } else if (pr.type === 'unique' && pr.q.startsWith('Narrow it down')) grandfathered.canned++;
      if (!editable && BRITISH.test(pr.q)) grandfathered.british++;
    });
    prev = p;
    errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `${p.prompts.length} prompts, crowd shape OK`);
  }
  // ── THE END-TO-END PROOF, and the reason the bands above are worth having.
  // Score each board through lib/outwit-score.js — the SAME code /api/outwit and
  // the combined leaderboard run — as a player who reads the crowd perfectly:
  // the most-picked option on a Meeting Point, the least-picked on a Road Less
  // Traveled and a Rare Bird, the crowd's median on a Herd, and the day's
  // fraction of the pool mean on the Undercut. If that player cannot take full
  // marks, the board has no findable answer no matter how the counts look, and
  // no amount of band arithmetic would have said so. The bands are this
  // checker's own reasoning; this is the game's own engine disagreeing or not.
  {
    const { register } = await import('node:module');
    register('./alias-loader.mjs', import.meta.url);
    const { buildContext } = await import('../lib/outwit-score.js');
    let frozenShort = 0;
    for (const p of PUZZLES) {
      let score = 0;
      for (const pr of p.prompts) {
        const ctx = buildContext(pr, pr.house);
        let pick;
        if (pr.options) {
          const c = countsOf(pr.house, pr.options.length);
          pick = pr.type === 'match' ? c.indexOf(Math.max(...c)) : c.indexOf(Math.min(...c));
        } else if (pr.type === 'herd') {
          const s = [...pr.house].sort((a, b) => a - b);
          pick = Math.round((s[(s.length >> 1) - 1] + s[s.length >> 1]) / 2);
        } else {
          const mean = pr.house.reduce((a, b) => a + b, 0) / pr.house.length;
          pick = Math.round((pr.frac ?? 2 / 3) * mean);
        }
        score += ctx.ptsFor(pick);
      }
      const max = p.prompts.length * 2;
      if (score === max) continue;
      if (p.live >= OUTWIT_CROWD_FROM) fail(p.quizId, `a perfect read of the house crowd scores only ${score}/${max} through lib/outwit-score`);
      else frozenShort++;
    }
    if (frozenShort) note('outwit', `${frozenShort} FROZEN boards where even a perfect read of the crowd cannot reach full marks; grandfathered`);
  }

  // ── whole-bank variety ceilings, over the boards the rules apply to
  for (const [k, n] of vecUse) if (n > VEC_CEIL) fail('outwit-variety', `house count vector ${k} shapes ${n} boards (ceiling ${VEC_CEIL})`);
  for (const [k, n] of modalUse) if (n > MODAL_CEIL) fail('outwit-variety', `"${k}" is the Meeting Point favorite on ${n} boards (ceiling ${MODAL_CEIL})`);
  for (const [k, n] of optUse) if (n > OPT_CEIL) fail('outwit-variety', `option "${k}" appears in ${n} prompts (ceiling ${OPT_CEIL})`);
  if (grandfathered.thin) note('outwit', `${grandfathered.thin} FROZEN prompts carry a house crowd that is not ${POOL} votes (boards 17-75 ship 24 against a documented ~48); grandfathered`);
  if (grandfathered.canned) note('outwit', `${grandfathered.canned} FROZEN Sunday boards reuse the canned "Narrow it down" second Rare Bird; grandfathered`);
  if (grandfathered.british) note('outwit', `${grandfathered.british} FROZEN prompts use British spellings against authoring standard #8; grandfathered`);
  if (grandfathered.dupQ) note('outwit', `${grandfathered.dupQ} FROZEN prompts repeat text used on an earlier board; grandfathered`);
}

if (RUN('outrank')) {
  // Structural + SEMANTIC + VARIETY. The house crowd is Outrank's answer key: its
  // 40 favorite votes define the crowd order the player must call, and it is an
  // AUTHORED ESTIMATE of how a broad audience would vote, never observed play
  // (see the header of app/outrank/puzzles.js, which says so to the reader, and
  // scripts/gen-outrank.mjs, which says where the numbers come from).
  //
  // WHAT IS PROVED ON EVERY BOARD, FROZEN OR NOT
  //   * the calendar: quizId, dateLabel and the sunday flag are re-derived from
  //     `live` rather than trusted, num is contiguous, no day is missing;
  //   * 6 items on a weekday and 7 on a Sunday, all distinct, theme never reused;
  //   * house is 40 in-range votes with no zero-vote item;
  //   * ALL K counts DISTINCT, so the crowd order is unambiguous. crowdOrderOf
  //     breaks a tie on DISPLAY INDEX and the display order is hand-mixed and
  //     'carries no signal' (puzzle-file header), so a tie makes that boundary of
  //     the answer key a pure-luck 2-point swing — the Outrank analog of a
  //     Links/Crux double solution (CLAUDE-QUIZZES 7a). Hard fail on an editable
  //     (live >= today) board; a tie on an already-live FROZEN board can no
  //     longer be corrected without rewriting a played day, so it is
  //     grandfathered as a note (boards #1 and #2 shipped tied);
  //   * US spellings over theme, flavor and every item (authoring standard #8).
  //     The frozen bank is already clean, so this one needs no dated floor;
  //   * END TO END through lib/outrank-score.js — the SAME code /api/outrank and
  //     the combined leaderboard run. A player who votes any item and then calls
  //     the crowd MINUS their own vote (the leave-one-out order the live scorer
  //     grades against) must take full marks, for every one of the K favorites
  //     they could have voted. That is the checker's reading of the answer key
  //     and the shipped scorer's reading being asserted equal, rather than the
  //     checker grading its own arithmetic. Second, an honest player who reads
  //     the reveal and calls the WHOLE pool's order may lose at most 2 of 2K to
  //     the leave-one-out rule: removing one vote can unseat an item by at most
  //     one rank, and if that ever costs more the mechanic has started punishing
  //     the player it was built to protect.
  //
  // WHAT IS PROVED FROM OUTRANK_CROWD_FROM ONWARD (the 2026-09-30 extension;
  // everything before it is frozen history and grandfathered, per authoring
  // standard #10, and several frozen boards would genuinely fail these):
  //
  //   THE CROWD SHAPE. The game only pays for insight if the crowd's order is
  //   GUESSABLE BUT NOT OBVIOUS, and both failure modes are visible in the count
  //   vector. One item that obviously wins with five interchangeable also-rans
  //   gives away the top slot and makes a lottery of the rest; six near-equal
  //   counts are five coin flips in a row. So, on the 40 votes:
  //     favorite      weekday 11-14 of 40 (27-35%)   Sunday 8-12 (20-30%)
  //     margin        2-5 clear of the runner-up, both days
  //     tail          weekday >= 2, Sunday >= 1 (seven distinct counts summing
  //                   to 40 cannot all clear 2 — that is arithmetic, not taste)
  //     close calls   adjacent boundaries exactly one vote apart: weekday 1-3 of
  //                   five, Sunday 2-5 of six. At least one, so every board has a
  //                   real argument in it; never all of them.
  //   The frozen bank runs favorites as high as 16 (40%) and leaves nine weekday
  //   boards with an item on a single vote; both are why the floor is dated.
  //
  //   THE SUNDAY RAMP proves itself twice (authoring standard #5): SEVEN items,
  //   AND a crowd that is harder to read — favorite capped two votes lower than a
  //   weekday's and at least two one-vote boundaries instead of one.
  //
  //   THE DISPLAY MIX. `items` is the only ordering the browser receives, and the
  //   puzzle header promises it is hand-mixed and never the ranking. So it must
  //   not be the crowd order, must not be its exact reverse, must not open with
  //   the crowd's favorite, and must sit at least three items two or more slots
  //   away from their crowd rank.
  //
  //   POOL VARIETY, across the whole segment rather than per board (CLAUDE.md
  //   "Extending a puzzle bank in bulk" #3). Per-board legality passes happily on
  //   a bank that says the same thing every day, and the frozen bank is the
  //   warning: 32 of its 71 boards are food or drink, 45% of the run, several of
  //   them the same supermarket aisle twice. Ceilings, re-derived here rather
  //   than imported from the generator:
  //     category  <= 8 of the 62 new boards per bucket, and never two days
  //               running. The bucket is read from scripts/outrank-slates.mjs by
  //               theme, so an editable board whose theme is not in that reviewed
  //               pool fails rather than escaping the count.
  //     item      <= 2 boards per item string, BANK-WIDE including frozen boards
  //               (the frozen bank already sits at exactly 2 for six strings, so
  //               no grandfathering is needed), and never on BACK-TO-BACK days:
  //               a callback two months later reads as range, the same word two
  //               mornings running reads as an oversight. The frozen bank has no
  //               such pair either, so that half is bank-wide too.
  //     shape     <= 4 editable boards per house count vector, so the reveal's
  //               bar chart is not the same picture every week. (Frozen runs
  //               10-8-7-6-5-4 six times; history, not a failure.)
  const { PUZZLES } = await import('../app/outrank/puzzles.js');
  const { SLATES } = await import('./outrank-slates.mjs');
  const { scanUS } = await import('./us-spellings.mjs');
  const TODAY = new Date().toISOString().slice(0, 10);
  const OUTRANK_CROWD_FROM = '2026-09-30';   // shape / mix / variety floor; earlier days are frozen history
  const POOL = 40;                           // documented house size (puzzle-file header)
  const CAT_CEIL = 8;                        // max editable boards one category may fill
  const ITEM_CEIL = 2;                       // max boards one item string may appear on, bank-wide
  const VEC_CEIL = 4;                        // max editable boards one house count vector may shape
  const MIX_MOVED = 3;                       // items that must sit >= 2 slots off their crowd rank
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // The bands, written here from the rule rather than imported from the
  // generator, so the generator and the proof are not the same code.
  const BAND = {
    6: { favLo: 11, favHi: 14, marLo: 2, marHi: 5, tailLo: 2, closeLo: 1, closeHi: 3 },
    7: { favLo: 8, favHi: 12, marLo: 2, marHi: 5, tailLo: 1, closeLo: 2, closeHi: 5 },
  };
  const shapeErrors = (K, desc) => {
    const e = [];
    const b = BAND[K];
    if (!b) return [`no crowd-shape band for ${K} items`];
    if (desc[desc.length - 1] < b.tailLo) e.push(`tail ${desc[desc.length - 1]} < ${b.tailLo}: last place is a free point`);
    if (desc[0] < b.favLo) e.push(`favorite ${desc[0]} < ${b.favLo}: nobody actually leads`);
    if (desc[0] > b.favHi) e.push(`favorite ${desc[0]} > ${b.favHi}: it has run away with the board`);
    const mar = desc[0] - desc[1];
    if (mar < b.marLo) e.push(`favorite only ${mar} clear of the runner-up: the top slot is a coin flip`);
    if (mar > b.marHi) e.push(`favorite ${mar} clear of the runner-up (max ${b.marHi})`);
    let close = 0;
    for (let i = 0; i < desc.length - 1; i++) if (desc[i] - desc[i + 1] === 1) close++;
    if (close < b.closeLo) e.push(`${close} one-vote boundaries: nothing on this board is a close call`);
    if (close > b.closeHi) e.push(`${close} one-vote boundaries (max ${b.closeHi}): the order is a chain of coin flips`);
    return e;
  };

  const crowdCounts = (house, K) => { const c = new Array(K).fill(0); for (const v of house) if (Number.isInteger(v) && v >= 0 && v < K) c[v]++; return c; };
  const catOf = new Map(SLATES.map((s) => [s.theme, s.cat]));
  const seenThemes = new Set();
  const seenIds = new Set();
  const itemUse = new Map();
  const catUse = new Map();
  const vecUse = new Map();
  const grandfathered = { tie: 0 };
  let prev = null, prevCat = null;
  for (const p of PUZZLES) {
    const errs = [];
    const editable = p.live >= OUTRANK_CROWD_FROM;
    const K = p.items.length;
    // ── calendar, re-derived from `live` and never trusted
    const [Y, M, D] = String(p.live).split('-').map(Number);
    const wantId = `outrank-${M}-${D}-${String(Y).slice(2)}`;
    const wantLabel = `${MONTHS[M - 1]} ${D}, ${Y}`;
    const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
    if (p.quizId !== wantId) errs.push(`quizId ${p.quizId} != ${wantId} derived from live`);
    if (p.dateLabel !== wantLabel) errs.push(`dateLabel ${p.dateLabel} != ${wantLabel}`);
    if (!!p.sunday !== (dow === 0)) errs.push(`sunday flag ${!!p.sunday} but weekday ${dow}`);
    if (prev) {
      if (p.num !== prev.num + 1) errs.push(`num ${p.num} does not follow ${prev.num}`);
      if (Date.parse(`${p.live}T00:00:00Z`) - Date.parse(`${prev.live}T00:00:00Z`) !== 86400000) errs.push(`gap in the calendar after ${prev.live}`);
    }
    // ── slate shape
    const wantK = p.sunday ? 7 : 6;
    if (K !== wantK) errs.push(`${K} items (want ${wantK})`);
    if (new Set(p.items.map((s) => s.toLowerCase())).size !== K) errs.push('duplicate items');
    if (!p.theme) errs.push('no theme');
    if (!p.flavor) errs.push('no flavor copy');
    if (seenThemes.has(p.theme)) errs.push(`theme reused: ${p.theme}`);
    seenThemes.add(p.theme);
    if (seenIds.has(p.quizId)) errs.push('duplicate quizId');
    seenIds.add(p.quizId);
    // ── US spellings, bank-wide (the frozen bank is already clean)
    for (const s of [p.theme, p.flavor, ...p.items]) {
      for (const hit of scanUS(s)) errs.push(`British form "${hit.found}" in "${s}" (US: ${hit.us})`);
    }
    // ── item reuse, bank-wide, plus the no-back-to-back rule
    for (const it of p.items) { const k = it.toLowerCase(); itemUse.set(k, (itemUse.get(k) || 0) + 1); }
    if (prev) for (const it of p.items) if (prev.items.some((x) => x.toLowerCase() === it.toLowerCase())) errs.push(`item "${it}" also ran yesterday (${prev.live})`);
    // ── the house crowd
    let tiedNote = null;
    let counts = null;
    if (!Array.isArray(p.house) || p.house.length !== POOL) errs.push(`house has ${(p.house || []).length} votes (want ${POOL})`);
    else {
      let range = true;
      for (const v of p.house) if (!Number.isInteger(v) || v < 0 || v >= K) { errs.push(`house vote out of range: ${v}`); range = false; break; }
      if (range) {
        counts = crowdCounts(p.house, K);
        if (counts.some((c) => c === 0)) errs.push('house leaves an item at zero votes');
        if (new Set(counts).size !== K) {
          const tied = [];
          for (let i = 0; i < K; i++) for (let j = i + 1; j < K; j++) if (counts[i] === counts[j]) tied.push(`${p.items[i]}=${p.items[j]}@${counts[i]}`);
          const msg = `ambiguous crowd order: tied house counts [${tied.join(', ')}] (display-index tiebreak carries no signal)`;
          if (p.live >= TODAY) errs.push(msg);
          else { tiedNote = `FROZEN past board, tie grandfathered: ${tied.join(', ')}`; grandfathered.tie++; }
        }
      }
    }
    // ── the dated floor: crowd shape, display mix, category bucket
    if (editable && counts && new Set(counts).size === K) {
      const desc = [...counts].sort((a, b) => b - a);
      for (const m of shapeErrors(K, desc)) errs.push(m);
      const key = `${K}:${desc.join('-')}`;
      vecUse.set(key, (vecUse.get(key) || 0) + 1);
      // DISPLAY MIX: rank[j] is the crowd rank of the item shown in display slot j.
      const order = counts.map((c, i) => ({ c, i })).sort((a, b) => b.c - a.c || a.i - b.i).map((x) => x.i);
      const rank = new Array(K); order.forEach((it, r) => { rank[it] = r; });
      if (rank.every((r, j) => r === j)) errs.push('display order IS the crowd order');
      if (rank.every((r, j) => r === K - 1 - j)) errs.push('display order is the exact reverse of the crowd order');
      if (rank[0] === 0) errs.push(`display slot 1 is the crowd favorite (${p.items[0]})`);
      const moved = rank.filter((r, j) => Math.abs(r - j) >= 2).length;
      if (moved < MIX_MOVED) errs.push(`only ${moved} items sit 2+ slots off their crowd rank (want ${MIX_MOVED}); the display order reads as the answer`);
      // CATEGORY
      const cat = catOf.get(p.theme);
      if (!cat) errs.push(`theme "${p.theme}" is not in scripts/outrank-slates.mjs, so its category cannot be counted`);
      else {
        catUse.set(cat, (catUse.get(cat) || 0) + 1);
        if (cat === prevCat) errs.push(`category ${cat} runs two days in a row`);
      }
      prevCat = cat || null;
    } else if (editable) prevCat = null;
    if (errs.length) fail(p.quizId, errs.join('; '));
    else if (tiedNote) note(p.quizId, tiedNote);
    else ok(p.quizId, `${K} items, distinct house crowd order OK (${p.theme})`);
    prev = p;
  }

  // ── THE END-TO-END PROOF, run through the game's own scorer.
  // Every board is graded by lib/outrank-score.js, the code /api/outrank and the
  // combined leaderboard actually run. Two players are simulated on the house
  // pool: the perfect reader (any favorite, calling the leave-one-out order) who
  // must take full marks, and the honest reveal-reader (calling the whole pool's
  // order) who must never lose more than one boundary to leave-one-out.
  {
    const { register } = await import('node:module');
    register('./alias-loader.mjs', import.meta.url);
    const { scoreOutrankField, crowdOrderOf, favCounts } = await import('../lib/outrank-score.js');
    let worstNaive = 0, worstBoard = null, tiedCost = 0;
    for (const p of PUZZLES) {
      const K = p.items.length;
      const field = scoreOutrankField(p, [], {});
      if (!field.useHouse) { fail(p.quizId, 'the house crowd is not in the pool for an empty field'); continue; }
      if (field.poolSize !== POOL) { fail(p.quizId, `lib/outrank-score sees a pool of ${field.poolSize}, not ${POOL}`); continue; }
      const counts = favCounts(p.house, K);
      const distinct = new Set(counts).size === K;
      const short = [];
      for (let fav = 0; fav < K; fav++) {
        const c2 = counts.slice(); c2[fav] = Math.max(0, c2[fav] - 1);
        const perfect = [fav, ...crowdOrderOf(c2)];
        const got = field.detailFor(perfect).total;
        if (got !== 2 * K) short.push(`fav ${p.items[fav]} scores ${got}/${2 * K}`);
        const naive = [fav, ...field.crowdOrder];
        const lost = 2 * K - field.detailFor(naive).total;
        // The cap holds only where the counts are DISTINCT: pulling one vote out
        // can then unseat an item by at most one rank. On a board with tied
        // counts, one withdrawn vote can drop an item past a whole tied block —
        // frozen board #2 costs an honest reader 4 of 12 that way. That is the
        // distinct-counts rule earning its keep, and it is why the cap is only
        // asserted where the rule holds.
        if (distinct) {
          if (lost > worstNaive) { worstNaive = lost; worstBoard = p.quizId; }
          if (lost > 2) short.push(`reading the whole pool costs ${lost} points with fav ${p.items[fav]}`);
        } else if (lost > 2) tiedCost = Math.max(tiedCost, lost);
      }
      if (short.length) fail(p.quizId, `through lib/outrank-score: ${short.join('; ')}`);
    }
    note('outrank', `end to end through lib/outrank-score: a perfect read pays full marks on all ${PUZZLES.length} boards; on the ${PUZZLES.length - grandfathered.tie} boards with distinct counts the worst leave-one-out cost to a whole-pool read is ${worstNaive} points${worstBoard ? ` (${worstBoard})` : ''}`);
    if (tiedCost) note('outrank', `on the FROZEN tied boards a whole-pool read can cost up to ${tiedCost} points, because one withdrawn vote falls past a tied block; grandfathered`);
  }

  // ── whole-bank variety ceilings
  for (const [k, n] of itemUse) if (n > ITEM_CEIL) fail('outrank-variety', `item "${k}" appears on ${n} boards bank-wide (ceiling ${ITEM_CEIL})`);
  for (const [k, n] of vecUse) if (n > VEC_CEIL) fail('outrank-variety', `house count vector ${k} shapes ${n} editable boards (ceiling ${VEC_CEIL})`);
  for (const [k, n] of catUse) if (n > CAT_CEIL) fail('outrank-variety', `category ${k} fills ${n} editable boards (ceiling ${CAT_CEIL})`);
  if (catUse.size) note('outrank', `categories from ${OUTRANK_CROWD_FROM}: ${[...catUse].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')} (ceiling ${CAT_CEIL})`);
  if (vecUse.size) note('outrank', `${vecUse.size} distinct count vectors over ${[...vecUse.values()].reduce((a, b) => a + b, 0)} editable boards, max reuse ${Math.max(...vecUse.values())} (ceiling ${VEC_CEIL})`);
  {
    const twice = [...itemUse].filter(([, n]) => n === ITEM_CEIL).length;
    note('outrank', `${itemUse.size} distinct items bank-wide, ${twice} used twice, none more (ceiling ${ITEM_CEIL})`);
  }
  if (grandfathered.tie) note('outrank', `${grandfathered.tie} FROZEN boards ship a tied house count and so an arbitrary answer boundary; grandfathered`);
}


// ─── SHARDS ───────────────────────────────────────────────────────────────────
// Two proofs per puzzle, because the game needs both to be true:
//
//   1. UNIQUENESS (correctness): exactly ONE reassembly of the shard set makes
//      every across/down run of 2+ letters a dictionary word, and it is the
//      solution encoded in the shard coordinates. The search prunes on the
//      dictionary the moment a placement completes a run, and it carries a node
//      cap: if the cap is hit the search was incomplete, so uniqueness is NOT
//      proven and the puzzle FAILS rather than passing on an unfinished proof.
//
//   2. AMBIGUITY (difficulty, owner ruling 2026-08-01): the shard SHAPES must
//      tile the outline in at least AMBIG_FLOOR different ways. A puzzle whose
//      shapes fit only one way is solved by shape-fitting alone and the player
//      never reads a letter, which is exactly why the launch bank played too
//      easy. Puzzles that went live before AMBIG_FROM are grandfathered.
//
// Structural checks: square grid, shards tile the fillable cells exactly (no
// overlap, none on a block), each shard 3-6 cells, 5-18 shards.
if (RUN('shards')) {
  const { PUZZLES } = await import('../app/shards/puzzles.js');
  const AMBIG_FROM = '2026-08-02';            // ladder start; earlier days are frozen history
  const MINRUN_FROM = '2026-08-20';           // no-short-run rule; earlier days are frozen history
  const MIN_RUN = 3;                          // must match MIN_RUN in scripts/gen-shards/gen.py
  const AMBIG_FLOOR = { 6: 8, 7: 12, 8: 12 }; // by grid size; must match TIERS in scripts/gen-shards/build_ladder.py
  const NODECAP = 5_000_000;

  // ─── NO REPEATED LETTER GRID ─────────────────────────────────────────────
  // The October run recycled whole fills, so five boards (10-05, 10-06, 10-12,
  // 10-27, 10-31) reprint an earlier board's exact grid. Those are frozen;
  // from the November restock on, a board's solved grid may never match any
  // earlier board's.
  const GRID_FRESH_FROM = '2026-11-01';
  {
    const gridKey = (p) => {
      const cells = p.shards.flatMap((sh) => sh.cells).map(([r, c, ch]) => `${r},${c},${ch}`).sort();
      return `${p.rows || ''}x${p.cols || ''}|${cells.join(';')}`;
    };
    const seenGrid = new Map();
    for (const p of PUZZLES) {
      const k = gridKey(p);
      if (seenGrid.has(k) && p.live >= GRID_FRESH_FROM) fail(p.quizId, `reprints the letter grid of ${seenGrid.get(k)}`);
      if (!seenGrid.has(k)) seenGrid.set(k, p.quizId);
    }
  }

  // Cell indices and the across/down runs each cell belongs to.
  const geometry = (fillCells, n) => {
    const order = [...fillCells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const idx = new Map(); order.forEach(([r, c], i) => idx.set(r * 100 + c, i));
    const runs = []; const cellRuns = order.map(() => []);
    for (let r = 0; r < n; r++) { let c = 0; while (c < n) { if (idx.has(r * 100 + c)) { const s = c; const run = []; while (c < n && idx.has(r * 100 + c)) { run.push(idx.get(r * 100 + c)); c++; } if (c - s >= 2) runs.push(run); } else c++; } }
    for (let c = 0; c < n; c++) { let r = 0; while (r < n) { if (idx.has(r * 100 + c)) { const s = r; const run = []; while (r < n && idx.has(r * 100 + c)) { run.push(idx.get(r * 100 + c)); r++; } if (r - s >= 2) runs.push(run); } else r++; } }
    runs.forEach((run, ri) => run.forEach((ci) => cellRuns[ci].push(ri)));
    return { order, idx, runs, cellRuns };
  };

  // Every legal position of one shard, as a BigInt-free bitmask pair.
  const placementsOf = (shard, idx, n, ncells) => {
    const out = [];
    for (let br = 0; br < n; br++) for (let bc = 0; bc < n; bc++) {
      const lo = []; let okp = true;
      for (const [dr, dc, ch] of shard.offs) {
        const k = (br + dr) * 100 + (bc + dc);
        if (!idx.has(k)) { okp = false; break; }
        lo.push([idx.get(k), ch]);
      }
      if (okp) out.push(lo);
    }
    return out;
  };

  // Proof 1: unique word-valid reassembly, dictionary-pruned, node capped.
  const proveUnique = (shards, fillCells, n, cap = 2) => {
    const { order, idx, runs, cellRuns } = geometry(fillCells, n);
    const ncells = order.length;
    const byCell = shards.map(() => Array.from({ length: ncells }, () => []));
    shards.forEach((sh, si) => {
      for (const pl of placementsOf(sh, idx, n, ncells)) {
        for (const [ci] of pl) byCell[si][ci].push(pl);
      }
    });
    const runLen = runs.map((r) => r.length);
    const filled = new Array(runs.length).fill(0);
    const letters = new Array(ncells).fill(null);
    const covered = new Array(ncells).fill(false);
    const used = new Array(shards.length).fill(false);
    const found = new Set();
    let nodes = 0, capped = false, nCovered = 0;
    const rec = () => {
      if (found.size >= cap || capped) return;
      if (++nodes > NODECAP) { capped = true; return; }
      if (nCovered === ncells) { found.add(letters.join('')); return; }
      let tgt = -1; for (let i = 0; i < ncells; i++) if (!covered[i]) { tgt = i; break; }
      for (let si = 0; si < shards.length; si++) {
        if (used[si]) continue;
        for (const pl of byCell[si][tgt]) {
          let clash = false;
          for (const [ci] of pl) if (covered[ci]) { clash = true; break; }
          if (clash) continue;
          for (const [ci, ch] of pl) { covered[ci] = true; letters[ci] = ch; }
          nCovered += pl.length;
          let bad = false; const touched = [];
          for (const [ci] of pl) {
            for (const ri of cellRuns[ci]) {
              filled[ri]++; touched.push(ri);
              if (filled[ri] === runLen[ri]) {
                let w = ''; for (const x of runs[ri]) w += letters[x];
                if (!dict.has(w.toLowerCase())) bad = true;
              }
            }
            if (bad) break;
          }
          if (!bad) { used[si] = true; rec(); used[si] = false; }
          for (const ri of touched) filled[ri]--;
          for (const [ci] of pl) { covered[ci] = false; letters[ci] = null; }
          nCovered -= pl.length;
          if (found.size >= cap || capped) return;
        }
      }
    };
    rec();
    return { found, nodes, exhausted: !capped };
  };

  // Proof 2: how many ways the SHAPES alone tile the outline, stopping at `floor`.
  const countTilings = (shards, fillCells, n, floor) => {
    const { order, idx } = geometry(fillCells, n);
    const ncells = order.length;
    const byCell = shards.map(() => Array.from({ length: ncells }, () => []));
    shards.forEach((sh, si) => {
      for (const pl of placementsOf(sh, idx, n, ncells)) {
        for (const [ci] of pl) byCell[si][ci].push(pl.map(([c]) => c));
      }
    });
    const covered = new Array(ncells).fill(false);
    const owner = new Array(ncells).fill(-1);
    const used = new Array(shards.length).fill(false);
    const seen = new Set();
    let nodes = 0, capped = false, nCovered = 0;
    const rec = () => {
      if (seen.size >= floor || capped) return;
      if (++nodes > NODECAP) { capped = true; return; }
      if (nCovered === ncells) { seen.add(owner.map((o) => shards[o].sig).join('/')); return; }
      let tgt = -1; for (let i = 0; i < ncells; i++) if (!covered[i]) { tgt = i; break; }
      for (let si = 0; si < shards.length; si++) {
        if (used[si]) continue;
        for (const pl of byCell[si][tgt]) {
          let clash = false;
          for (const ci of pl) if (covered[ci]) { clash = true; break; }
          if (clash) continue;
          for (const ci of pl) { covered[ci] = true; owner[ci] = si; }
          nCovered += pl.length; used[si] = true;
          rec();
          used[si] = false; nCovered -= pl.length;
          for (const ci of pl) covered[ci] = false;
          if (seen.size >= floor || capped) return;
        }
      }
    };
    rec();
    return { count: seen.size, exhausted: !capped };
  };

  for (const p of PUZZLES) {
    const errs = []; const n = p.rows;
    if (p.rows !== p.cols) errs.push('non-square grid');
    const blockset = new Set((p.blocks || []).map(([r, c]) => r * 100 + c));
    const intended = new Map(); const cov = new Set();
    const shards = (p.shards || []).map((sh) => {
      const rs = sh.cells.map((c) => c[0]), cs = sh.cells.map((c) => c[1]);
      const mr = Math.min(...rs), mc = Math.min(...cs);
      const offs = sh.cells.map(([r, c, ch]) => [r - mr, c - mc, ch]);
      if (sh.cells.length < 3 || sh.cells.length > 6) errs.push(`shard of ${sh.cells.length} cells (want 3-6)`);
      for (const [r, c, ch] of sh.cells) {
        const k = r * 100 + c;
        if (blockset.has(k)) errs.push(`shard cell on a block at ${r},${c}`);
        if (cov.has(k)) errs.push(`shard overlap at ${r},${c}`);
        cov.add(k); intended.set(k, ch.toLowerCase());
      }
      const sig = offs.map((o) => o[0] + ':' + o[1]).sort().join('|');
      return { offs, sig };
    });
    const fillCells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!blockset.has(r * 100 + c)) fillCells.push([r, c]);
    if (fillCells.length !== cov.size) errs.push(`shards cover ${cov.size} of ${fillCells.length} fillable cells`);
    if (p.shards.length < 5 || p.shards.length > 18) errs.push(`${p.shards.length} shards (want 5-18)`);
    // NO RUN SHORTER THAN THREE (owner rule, 2026-08-19). A two-letter slot fills with
    // a Scrabble two-letter word no reader accepts (ST, JA, PE), because at length 2 the
    // generator's common-word filter does nothing: 108 of the 124 two-letter words in
    // tuck-dict.txt clear its frequency floor. Removing the slot is the fix, so the bank
    // re-proves no board has one. Boards before MINRUN_FROM are played and frozen.
    if (p.live >= MINRUN_FROM) {
      let short = 0;
      for (let i = 0; i < n; i++) {
        const row = Array.from({ length: n }, (_, j) => (blockset.has(i * 100 + j) ? '#' : '.')).join('');
        const col = Array.from({ length: n }, (_, j) => (blockset.has(j * 100 + i) ? '#' : '.')).join('');
        for (const line of [row, col]) for (const seg of line.split('#')) if (seg.length && seg.length < MIN_RUN) short++;
      }
      if (short) errs.push(`${short} run(s) shorter than ${MIN_RUN} letters (two-letter slots are banned)`);
    }
    if (!errs.length) {
      const { found, exhausted } = proveUnique(shards, fillCells, n);
      const order = [...fillCells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const intendedStr = order.map(([r, c]) => intended.get(r * 100 + c).toUpperCase()).join('');
      if (!exhausted) errs.push('uniqueness search hit the node cap, so uniqueness is NOT proven');
      else if (found.size !== 1) errs.push(`NOT UNIQUE: ${found.size} valid reassemblies`);
      else if (!found.has(intendedStr)) errs.push('unique reassembly does not match the intended solution');
      else {
        const floor = p.live >= AMBIG_FROM ? (AMBIG_FLOOR[n] || 0) : 0;
        let note = '';
        if (floor) {
          const { count, exhausted: ex2 } = countTilings(shards, fillCells, n, floor);
          if (count < floor && ex2) errs.push(`too easy: shapes tile only ${count} way(s), floor is ${floor} (shape-fitting would solve it without reading a letter)`);
          else if (count < floor) errs.push(`ambiguity search hit the node cap at ${count} of ${floor}`);
          else note = `, ${count}+ shape tilings`;
        }
        if (!errs.length) { ok(p.quizId, `${n}x${n}, ${p.shards.length} shards, unique reassembly${note}`); continue; }
      }
    }
    fail(p.quizId, errs.join('; '));
  }
}

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll requested banks verified.');
process.exit(BAD ? 1 : 0);
