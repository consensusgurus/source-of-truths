#!/usr/bin/env node
// verify-kids: the checker for the seven kids dailies (lib/kids-daily.js).
// Discovered by scripts/verify-all.mjs as `kids`. Shares NO solver code with
// the generators (scripts/gen-kids-*.mjs); every proof below is re-derived.
//
//   pals    every board is line-solvable (unique AND no guessing) by an
//           independent solver; every clue has at most two runs; the clues
//           stored match the art; no two boards share art; 8+ squares filled
//   mixup   five words a day in the documented length shape; each scramble is
//           a permutation of its word, not the word, no 3+ prefix intact; no
//           word inside 14 days, no word past 3 uses, no two words a day with
//           the same first letter and length; every word has an emoji
//   sortit  three groups of four, twelve distinct board words, board is a
//           permutation of the groups' words; every word belongs to exactly
//           one of the day's groups per the generator's CATS; no AVOID pair on
//           one day; category gap >= 6 days, word gap >= 12
//   ladder  `best` equals a fresh BFS over lib/kids-ladder-words.js; start and
//           end share no position; example is a real ladder of that length;
//           no pair repeats; endpoints spaced >= 20; the shipped vocabulary
//           equals the generator's list; only 3-letter lowercase words
//   mathdash the day generator is deterministic, every answer is a non-negative
//           integer within the documented ranges, ten questions, no repeats
//   sixes / unpark  the grown-up banks carry their own verifiers; here only
//           that the kid filters leave a non-empty pool as of today
//   hub     lib/kids.js lists every daily exactly once, with the registry href
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
let fails = 0;
const bad = (m) => { fails++; console.log(`✗ ${m}`); };
const ok = (m) => console.log(`✓ ${m}`);
const load = async (rel) => import(pathToFileURL(join(root, rel)).href);

// ---------------------------------------------------------------- pals
{
  const { PUZZLES } = await load('app/kids/pals/puzzles.js');
  const runs = (line) => { const o = []; let n = 0; for (const v of line) { if (v) n++; else if (n) { o.push(n); n = 0; } } if (n) o.push(n); return o; };
  const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  // Independent solver: enumerate all 2^25 grids? Too slow. Instead a
  // row-candidate product with column pruning, which is complete.
  const solveCount = (rows, cols) => {
    const cand = rows.map((clue) => { const out = []; for (let m = 0; m < 32; m++) { const line = [0, 1, 2, 3, 4].map((i) => (m >> i) & 1); if (eq(runs(line), clue)) out.push(line); } return out; });
    let count = 0;
    const g = [];
    const rec = (r) => {
      if (count > 1) return;
      if (r === 5) { for (let c = 0; c < 5; c++) if (!eq(runs(g.map((row) => row[c])), cols[c])) return; count++; return; }
      for (const line of cand[r]) {
        g[r] = line;
        // prune: a column's partial runs must be a prefix-compatible with its clue
        let fine = true;
        for (let c = 0; c < 5 && fine; c++) {
          const col = g.slice(0, r + 1).map((row) => row[c]);
          const pr = runs(col);
          const clue = cols[c];
          if (pr.length > clue.length) fine = false;
          else {
            for (let k = 0; k < pr.length - 1; k++) if (pr[k] !== clue[k]) fine = false;
            if (pr.length && col[col.length - 1] === 1 && pr[pr.length - 1] > clue[pr.length - 1]) fine = false;
            if (pr.length && col[col.length - 1] === 0 && pr[pr.length - 1] !== clue[pr.length - 1]) fine = false;
          }
        }
        if (fine) rec(r + 1);
      }
      g.length = r;
    };
    rec(0);
    return count;
  };
  // No-guessing: line propagation to a fixpoint must finish.
  const lineSolve = (rows, cols) => {
    const g = Array.from({ length: 5 }, () => Array(5).fill(null));
    const cands = (clue, known) => { const out = []; for (let m = 0; m < 32; m++) { const line = [0, 1, 2, 3, 4].map((i) => (m >> i) & 1); if (known.every((k, i) => k == null || k === line[i]) && eq(runs(line), clue)) out.push(line); } return out; };
    for (let pass = 0; pass < 40; pass++) {
      let changed = false;
      for (let r = 0; r < 5; r++) { const c = cands(rows[r], g[r]); if (!c.length) return false; for (let i = 0; i < 5; i++) if (g[r][i] == null && c.every((l) => l[i] === c[0][i])) { g[r][i] = c[0][i]; changed = true; } }
      for (let k = 0; k < 5; k++) { const c = cands(cols[k], g.map((row) => row[k])); if (!c.length) return false; for (let i = 0; i < 5; i++) if (g[i][k] == null && c.every((l) => l[i] === c[0][i])) { g[i][k] = c[0][i]; changed = true; } }
      if (!changed) break;
    }
    return g.every((row) => row.every((v) => v != null));
  };
  const seen = new Set();
  let n = 0;
  for (const p of PUZZLES) {
    const grid = p.art.map((s) => [...s].map((ch) => (ch === '#' ? 1 : 0)));
    if (grid.length !== 5 || grid.some((r) => r.length !== 5)) { bad(`pals #${p.num}: not 5x5`); continue; }
    const rows = grid.map(runs); const cols = [0, 1, 2, 3, 4].map((c) => runs(grid.map((r) => r[c])));
    if (!eq(rows.flat(), p.rows.flat()) || rows.some((r, i) => !eq(r, p.rows[i]))) bad(`pals #${p.num}: row clues do not match art`);
    if (cols.some((c, i) => !eq(c, p.cols[i]))) bad(`pals #${p.num}: column clues do not match art`);
    if ([...rows, ...cols].some((c) => c.length > 2)) bad(`pals #${p.num}: a clue has three runs`);
    if (grid.flat().filter(Boolean).length < 8) bad(`pals #${p.num}: too sparse`);
    if (solveCount(p.rows, p.cols) !== 1) bad(`pals #${p.num}: not unique`);
    if (!lineSolve(p.rows, p.cols)) bad(`pals #${p.num}: needs guessing`);
    const key = p.art.join('/');
    if (seen.has(key)) bad(`pals #${p.num}: duplicate art`); seen.add(key);
    if (!p.name) bad(`pals #${p.num}: no name`);
    n++;
  }
  ok(`pals: ${n} boards, unique and line-solvable`);
}

// ---------------------------------------------------------------- mixup
{
  const { PUZZLES } = await load('app/kids/mixup/puzzles.js');
  const last = new Map(); const uses = new Map();
  for (const p of PUZZLES) {
    const lens = p.words.map((w) => w.w.length).join('');
    const want = p.num % 3 === 0 ? '34455' : '33445';
    if (lens !== want) bad(`mixup #${p.num}: shape ${lens}, want ${want}`);
    const firsts = new Set();
    for (const w of p.words) {
      if (!w.e) bad(`mixup #${p.num}: ${w.w} has no emoji`);
      if ([...w.s].sort().join('') !== [...w.w].sort().join('')) bad(`mixup #${p.num}: ${w.s} is not a scramble of ${w.w}`);
      if (w.s === w.w) bad(`mixup #${p.num}: ${w.w} not scrambled`);
      for (let k = 3; k <= w.w.length; k++) if (w.s.slice(0, k) === w.w.slice(0, k)) bad(`mixup #${p.num}: ${w.s} keeps a ${k}-letter prefix of ${w.w}`);
      const fk = `${w.w[0]}${w.w.length}`;
      if (firsts.has(fk)) bad(`mixup #${p.num}: two words with first letter ${w.w[0]} and length ${w.w.length}`); firsts.add(fk);
      const lu = last.get(w.w);
      if (lu != null && p.num - lu < 14) bad(`mixup #${p.num}: ${w.w} returned after ${p.num - lu} days`);
      last.set(w.w, p.num); uses.set(w.w, (uses.get(w.w) || 0) + 1);
      if (uses.get(w.w) > 3) bad(`mixup: ${w.w} used more than 3 times`);
    }
  }
  ok(`mixup: ${PUZZLES.length} days, shapes, scrambles and spacing hold`);
}

// ---------------------------------------------------------------- sortit
{
  const { PUZZLES } = await load('app/kids/sortit/puzzles.js');
  const { CATS, AVOID } = await load('scripts/gen-kids-sortit.mjs');
  const avoid = new Set(AVOID.map(([a, b]) => [a, b].sort().join('|')));
  const catLast = new Map(); const wordLast = new Map();
  const home = new Map();
  for (const [c, ws] of Object.entries(CATS)) for (const w of ws) { if (home.has(w)) bad(`sortit: ${w} is in ${home.get(w)} and ${c}`); home.set(w, c); }
  for (const p of PUZZLES) {
    if (p.groups.length !== 3) bad(`sortit #${p.num}: ${p.groups.length} groups`);
    const all = p.groups.flatMap((g) => g.words);
    if (new Set(all).size !== 12 || all.length !== 12) bad(`sortit #${p.num}: not twelve distinct words`);
    if (p.board.slice().sort().join() !== all.slice().sort().join()) bad(`sortit #${p.num}: board is not the groups' words`);
    for (const g of p.groups) {
      if (g.words.length !== 4) bad(`sortit #${p.num}: ${g.name} has ${g.words.length}`);
      for (const w of g.words) if (home.get(w) !== g.name) bad(`sortit #${p.num}: ${w} filed under ${g.name}, generator says ${home.get(w)}`);
      const lc = catLast.get(g.name); if (lc != null && p.num - lc < 6) bad(`sortit #${p.num}: ${g.name} returned after ${p.num - lc} days`);
      catLast.set(g.name, p.num);
      for (const w of g.words) { const lw = wordLast.get(w); if (lw != null && p.num - lw < 12) bad(`sortit #${p.num}: ${w} returned after ${p.num - lw} days`); wordLast.set(w, p.num); }
    }
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (avoid.has([p.groups[i].name, p.groups[j].name].sort().join('|'))) bad(`sortit #${p.num}: ${p.groups[i].name} beside ${p.groups[j].name}`);
  }
  ok(`sortit: ${PUZZLES.length} days, groups disjoint and spaced`);
}

// ---------------------------------------------------------------- ladder
{
  const { PUZZLES } = await load('app/kids/ladder/puzzles.js');
  const { LADDER_WORDS } = await load('lib/kids-ladder-words.js');
  const { WORDS } = await load('scripts/gen-kids-ladder.mjs');
  if (LADDER_WORDS.join() !== WORDS.join()) bad('ladder: shipped vocabulary differs from the generator list');
  for (const w of LADDER_WORDS) if (!/^[a-z]{3}$/.test(w)) bad(`ladder: bad word ${w}`);
  const set = new Set(LADDER_WORDS);
  if (set.size !== LADDER_WORDS.length) bad('ladder: duplicate vocabulary word');
  const diff1 = (a, b) => { let d = 0; for (let i = 0; i < 3; i++) if (a[i] !== b[i]) d++; return d === 1; };
  const bfs = (a, b) => { const dist = new Map([[a, 0]]); const q = [a]; while (q.length) { const w = q.shift(); if (w === b) return dist.get(w); for (const v of LADDER_WORDS) if (!dist.has(v) && diff1(w, v)) { dist.set(v, dist.get(w) + 1); q.push(v); } } return -1; };
  const pairs = new Set(); const last = new Map();
  for (const p of PUZZLES) {
    if ([0, 1, 2].some((i) => p.start[i] === p.end[i])) bad(`ladder #${p.num}: ${p.start}/${p.end} share a letter position`);
    const d = bfs(p.start, p.end);
    if (d !== p.best) bad(`ladder #${p.num}: best ${p.best}, BFS says ${d}`);
    if (![3, 4, 5].includes(p.best)) bad(`ladder #${p.num}: best ${p.best} out of range`);
    const ex = p.example;
    if (ex[0] !== p.start || ex[ex.length - 1] !== p.end || ex.length - 1 !== p.best) bad(`ladder #${p.num}: example does not fit`);
    for (let i = 1; i < ex.length; i++) if (!set.has(ex[i]) || !diff1(ex[i - 1], ex[i])) bad(`ladder #${p.num}: example step ${ex[i - 1]}->${ex[i]} illegal`);
    const key = [p.start, p.end].sort().join('-');
    if (pairs.has(key)) bad(`ladder #${p.num}: pair ${key} repeats`); pairs.add(key);
    for (const w of [p.start, p.end]) { const lu = last.get(w); if (lu != null && p.num - lu < 20) bad(`ladder #${p.num}: ${w} returned after ${p.num - lu}`); last.set(w, p.num); }
  }
  ok(`ladder: ${PUZZLES.length} ladders, every best re-proved by BFS over ${LADDER_WORDS.length} words`);
}

// ---------------------------------------------------------------- mathdash
{
  // lib/kids-mathdash imports lib/kids-daily, which imports daily-games.js:
  // all plain ESM with extensions, so a direct import works.
  const { mathDashFor } = await load('lib/kids-mathdash.js');
  for (let day = 1; day <= 400; day++) {
    for (const weekend of [false, true]) {
      const a = mathDashFor(day, weekend); const b = mathDashFor(day, weekend);
      if (JSON.stringify(a) !== JSON.stringify(b)) bad(`mathdash day ${day}: not deterministic`);
      if (a.length !== 10) bad(`mathdash day ${day}: ${a.length} questions`);
      const keys = new Set();
      a.forEach((q, i) => {
        const key = `${q.a}${q.op}${q.b}`;
        if (keys.has(key)) bad(`mathdash day ${day}: repeat ${key}`); keys.add(key);
        const ans = q.op === '+' ? q.a + q.b : q.op === '-' ? q.a - q.b : q.a * q.b;
        if (ans !== q.ans || ans < 0 || !Number.isInteger(ans)) bad(`mathdash day ${day}: bad answer ${key}`);
        if (i < 4 && (q.op !== '+' || ans > 10)) bad(`mathdash day ${day} q${i + 1}: expected addition to 10`);
        if (i >= 4 && i < 7 && (q.op !== '-' || q.a > 10)) bad(`mathdash day ${day} q${i + 1}: expected subtraction within 10`);
        if (i >= 7 && ans > 20) bad(`mathdash day ${day} q${i + 1}: answer ${ans} over 20`);
      });
    }
  }
  ok('mathdash: 400 days x 2, deterministic and in range');
}

// ---------------------------------------------------------------- sixes / unpark pools
{
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const six = await load('app/sixes/puzzles.js');
  const gentle = six.PUZZLES.filter((p) => p.live <= today && p.level === 1 && !p.sunday);
  if (gentle.length < 7) bad(`sixes: only ${gentle.length} gentle live boards`);
  else ok(`sixes: ${gentle.length} gentle live boards in the kids pool`);
  const park = await load('app/parker/puzzles.js');
  const easy = park.PUZZLES.filter((p) => p.live <= today && !p.sunday && p.par <= 14);
  if (easy.length < 7) bad(`unpark: only ${easy.length} easy live boards`);
  else ok(`unpark: ${easy.length} easy live boards in the kids pool`);
}

// ---------------------------------------------------------------- hub + registry
{
  const { KIDS_DAILIES, KIDS_DAILY_MAP } = await load('lib/kids-daily.js');
  const { KIDS_GAMES } = await load('lib/kids.js');
  for (const g of KIDS_DAILIES) {
    const rows = KIDS_GAMES.filter((k) => k.id === g.key);
    if (rows.length !== 1) bad(`hub: ${g.key} listed ${rows.length} times in lib/kids.js`);
    else if (rows[0].href !== g.href || rows[0].title !== g.title) bad(`hub: ${g.key} href/title differ between lib/kids.js and lib/kids-daily.js`);
    if (!KIDS_DAILY_MAP[g.key]) bad(`registry: map missing ${g.key}`);
    let page;
    try { page = readFileSync(join(root, 'app', 'kids', g.key, 'page.js'), 'utf8'); } catch (e) { bad(`hub: no page for ${g.key}`); continue; }
    if (!page.includes("force-dynamic")) bad(`hub: ${g.key} page is not force-dynamic (today's board would be baked at build)`);
    if (!page.includes(`alternates: { canonical: '${g.href}' }`)) bad(`hub: ${g.key} canonical is not ${g.href}`);
  }
  ok(`hub: ${KIDS_DAILIES.length} dailies registered, paged, and counted`);
}

console.log(fails ? `\n${fails} failure(s)` : '\nkids: all clean');
process.exit(fails ? 1 : 0);
