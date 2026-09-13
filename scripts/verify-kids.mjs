#!/usr/bin/env node
// verify-kids: the checker for the six kids dailies (lib/kids-daily.js).
// Discovered by scripts/verify-all.mjs as `kids`. Shares NO solver code with
// the generators (scripts/gen-kids-*.mjs); every proof below is re-derived.
//
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
//   fitit   5x5 mask with 2 or 3 holes, a connected region, 4 or 5 pieces of
//           3 to 6 squares each normalised and pairwise distinct as printed,
//           areas summing to the region, sol tiling it exactly, and EXACTLY
//           ONE fixed-orientation tiling (no rotation on the kids board) by a
//           piece-driven solver; no two boards share a region
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

// ---------------------------------------------------------------- fitit
{
  const { PUZZLES } = await load('app/kids/fitit/puzzles.js');
  const N = 5;
  const masks = new Set();
  const tile = (mask, pieces) => {
    // Piece-driven: place piece 0 everywhere it fits, then piece 1, ... Cap 2.
    const grid = mask.map((row) => [...row].map((ch) => (ch === '1' ? 0 : 1)));
    let count = 0;
    (function rec(i) {
      if (count >= 2) return;
      if (i === pieces.length) { if (grid.every((row) => row.every((v) => v !== 0))) count++; return; }
      for (let dr = 0; dr < N; dr++) for (let dc = 0; dc < N; dc++) {
        let good = true;
        for (const [r, c] of pieces[i]) { const rr = r + dr, cc = c + dc; if (rr >= N || cc >= N || grid[rr][cc] !== 0) { good = false; break; } }
        if (!good) continue;
        for (const [r, c] of pieces[i]) grid[r + dr][c + dc] = 2;
        rec(i + 1);
        for (const [r, c] of pieces[i]) grid[r + dr][c + dc] = 0;
        if (count >= 2) return;
      }
    })(0);
    return count;
  };
  for (const p of PUZZLES) {
    const id = `fitit #${p.num}`;
    if (!Array.isArray(p.mask) || p.mask.length !== N || p.mask.some((r) => r.length !== N || /[^01]/.test(r))) { bad(`${id}: malformed mask`); continue; }
    const cells = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (p.mask[r][c] === '1') cells.push([r, c]);
    const holes = N * N - cells.length;
    if (holes < 2 || holes > 3) bad(`${id}: ${holes} holes, want 2 or 3`);
    const seen = new Set([cells[0].join(',')]); const st = [cells[0]];
    while (st.length) { const [r, c] = st.pop(); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < N && cc < N && p.mask[rr][cc] === '1' && !seen.has(`${rr},${cc}`)) { seen.add(`${rr},${cc}`); st.push([rr, cc]); } } }
    if (seen.size !== cells.length) bad(`${id}: region not connected`);
    const mk = p.mask.join('/');
    if (masks.has(mk)) bad(`${id}: repeats a region`); masks.add(mk);
    if (!Array.isArray(p.pieces) || p.pieces.length < 4 || p.pieces.length > 5) { bad(`${id}: ${p.pieces && p.pieces.length} pieces, want 4 or 5`); continue; }
    let area = 0; const sigs = new Set();
    p.pieces.forEach((pc, j) => {
      area += pc.length;
      if (pc.length < 3 || pc.length > 6) bad(`${id}: piece ${j} has ${pc.length} squares`);
      const mr = Math.min(...pc.map((q) => q[0])), mc = Math.min(...pc.map((q) => q[1]));
      if (mr !== 0 || mc !== 0) bad(`${id}: piece ${j} not normalised`);
      const sg = pc.map((q) => q.join(':')).join(',');
      if (sigs.has(sg)) bad(`${id}: piece ${j} duplicates another as printed`); sigs.add(sg);
    });
    if (area !== cells.length) bad(`${id}: pieces cover ${area}, region is ${cells.length}`);
    if (!Array.isArray(p.sol) || p.sol.length !== p.pieces.length) bad(`${id}: sol length`);
    else {
      const g = p.mask.map((row) => [...row].map((ch) => (ch === '1' ? 0 : 1))); let clash = false;
      p.pieces.forEach((pc, j) => { for (const [r, c] of pc) { const rr = r + p.sol[j][0], cc = c + p.sol[j][1]; if (rr < 0 || cc < 0 || rr >= N || cc >= N || g[rr][cc] !== 0) { clash = true; break; } g[rr][cc] = 2; } });
      if (clash || g.some((row) => row.some((v) => v === 0))) bad(`${id}: sol does not tile the board exactly`);
    }
    const n = tile(p.mask, p.pieces);
    if (n !== 1) bad(`${id}: ${n >= 2 ? 'two or more' : 'no'} fixed-orientation tilings`);
  }
  ok(`fitit: ${PUZZLES.length} boards, every one unique as printed`);
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
    if (!page.includes('resolveKidsDay(searchParams')) bad(`hub: ${g.key} page does not resolve ?p through resolveKidsDay (the archive strip would open today's board)`);
    if (!page.includes('todayNum={day.todayNum}')) bad(`hub: ${g.key} page does not pass todayNum (the archive strip would not render)`);
    if (!page.includes('key={day.dateIso}')) bad(`hub: ${g.key} page does not key its client by date (state would carry over between archive days)`);
    if (!page.includes(`alternates: { canonical: '${g.href}' }`)) bad(`hub: ${g.key} canonical is not ${g.href}`);
  }
  ok(`hub: ${KIDS_DAILIES.length} dailies registered, paged, and counted`);
}

console.log(fails ? `\n${fails} failure(s)` : '\nkids: all clean');
process.exit(fails ? 1 : 0);
