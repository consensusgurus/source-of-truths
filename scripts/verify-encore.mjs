#!/usr/bin/env node
// Verifier for the Encore bank (app/encore/puzzles.js).
//
// It RECOMPUTES rather than trusting: the grid geometry, the numbering, the
// slot list and every answer are derived here from the raw `grid` rows with
// this file's own code, and then checked against what the bank stores. Nothing
// is imported from build-encore-bank.mjs on purpose, so a bug in the generator
// cannot certify itself, which is the same discipline Cages and Quilt use.
//
// From COPY_FROM (2026-10-26, the first board of the gen-encore-extend
// restock) every answer and clue must also pass the shared US-spelling screen
// and carry no em dash. The clue banks are shared and hold a few British clues
// ("Storeys", "Grey matter"), so the check keeps them out of new grids rather
// than editing the banks. Boards before COPY_FROM are frozen and grandfathered.
//
//   node scripts/verify-encore.mjs
import { readFileSync, existsSync } from 'node:fs';
import { scanUS } from './us-spellings.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PUZZLES } from '../app/encore/puzzles.js';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0, warns = 0;
const fail = (m) => { console.error(`FAIL ${m}`); fails++; };
const warn = (m) => { console.warn(`warn ${m}`); warns++; };

// ── the clue bank, read the same way the game's author would ───────────────
const CLUE = new Map();
for (const f of ['emcee-wordbank.txt', 'encore-wordbank.txt']) {
  const p = join(here, f);
  if (!existsSync(p)) { fail(`missing clue bank ${f}`); continue; }
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('|');
    if (i < 1) continue;
    const w = t.slice(0, i).trim(), c = t.slice(i + 1).trim();
    if (!/^[A-Z]+$/.test(w) || !c) continue;
    if (!CLUE.has(w)) CLUE.set(w, c);
  }
}

const MIN_LEN = 3, MAX_LEN = 7;
const COPY_FROM = '2026-10-26';
const CAP = 3;                 // an answer may appear in at most 3 boards
const SUNDAY_SIZE = 11, WEEKDAY_SIZE = 9;

// geometry, recomputed here
function runsOf(g) {
  const N = g.length, out = [];
  for (let r = 0; r < N; r++) { let c = 0; while (c < N) { if (g[r][c] === '#') { c++; continue; } const s = c; while (c < N && g[r][c] !== '#') c++; out.push({ dir: 'A', r, c: s, len: c - s }); } }
  for (let c = 0; c < N; c++) { let r = 0; while (r < N) { if (g[r][c] === '#') { r++; continue; } const s = r; while (r < N && g[r][c] !== '#') r++; out.push({ dir: 'D', r: s, c, len: r - s }); } }
  return out;
}
function numbering(g) {
  const N = g.length, m = {}; let n = 1;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (g[r][c] === '#') continue;
    const a = (c === 0 || g[r][c - 1] === '#') && c + 1 < N && g[r][c + 1] !== '#';
    const d = (r === 0 || g[r - 1][c] === '#') && r + 1 < N && g[r + 1][c] !== '#';
    if (a || d) m[`${r},${c}`] = n++;
  }
  return m;
}
function connected(g) {
  const N = g.length;
  let start = -1, white = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] !== '#') { white++; if (start < 0) start = r * N + c; }
  if (start < 0) return false;
  const seen = new Set([start]), q = [start];
  while (q.length) {
    const i = q.pop(), r = (i / N) | 0, c = i % N;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) continue;
      const j = r2 * N + c2;
      if (g[r2][c2] === '#' || seen.has(j)) continue;
      seen.add(j); q.push(j);
    }
  }
  return seen.size === white;
}
const wordAt = (g, w, dir) => {
  let s = '';
  for (let i = 0; i < w.len; i++) s += dir === 'A' ? g[w.r][w.c + i] : g[w.r + i][w.c];
  return s;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const seenAnswers = new Map();   // answer -> [quizId]
const boards = [];

for (const p of PUZZLES) {
  const id = p.quizId;
  const N = p.grid.length;

  // ── shape and identity ──────────────────────────────────────────────────
  if (p.size !== N) fail(`${id}: size ${p.size} but grid is ${N} rows`);
  if (p.grid.some((r) => r.length !== N)) fail(`${id}: grid is not square`);
  const dt = new Date(`${p.live}T12:00:00Z`);
  const isSun = dt.getUTCDay() === 0;
  if (!!p.sunday !== isSun) fail(`${id}: sunday flag ${!!p.sunday} but ${p.live} is day ${dt.getUTCDay()}`);
  if (N !== (p.sunday ? SUNDAY_SIZE : WEEKDAY_SIZE)) fail(`${id}: ${p.sunday ? 'Sunday' : 'weekday'} board should be ${p.sunday ? SUNDAY_SIZE : WEEKDAY_SIZE} wide, is ${N}`);
  const want = `encore-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}-${String(dt.getUTCFullYear()).slice(2)}`;
  if (id !== want) fail(`${id}: quizId should be ${want} for live ${p.live}`);
  const label = `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  if (p.dateLabel !== label) fail(`${id}: dateLabel "${p.dateLabel}" should be "${label}"`);

  // ── 180 degree rotational symmetry ──────────────────────────────────────
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const a = p.grid[r][c] === '#', b = p.grid[N - 1 - r][N - 1 - c] === '#';
    if (a !== b) { fail(`${id}: not symmetric at ${r},${c}`); r = N; break; }
  }

  // ── fully checked: every run 3..7 in BOTH directions, all white joined ──
  const runs = runsOf(p.grid);
  for (const w of runs) {
    if (w.len < MIN_LEN) fail(`${id}: ${w.dir} run of ${w.len} at ${w.r},${w.c} - grid is not fully checked`);
    if (w.len > MAX_LEN) fail(`${id}: ${w.dir} run of ${w.len} at ${w.r},${w.c} exceeds the ${MAX_LEN} letter ceiling`);
  }
  if (!connected(p.grid)) fail(`${id}: white squares are not all connected`);

  // ── the stored across/down must BE the runs, numbered correctly ─────────
  const nums = numbering(p.grid);
  for (const [dir, list] of [['A', p.across], ['D', p.down]]) {
    const mine = runs.filter((w) => w.dir === dir).sort((a, b) => nums[`${a.r},${a.c}`] - nums[`${b.r},${b.c}`]);
    if (mine.length !== list.length) { fail(`${id}: ${dir} has ${list.length} entries, grid has ${mine.length}`); continue; }
    list.forEach((w, i) => {
      const m = mine[i];
      if (w.r !== m.r || w.c !== m.c || w.len !== m.len) fail(`${id}: ${dir}${w.n} is ${w.r},${w.c}/${w.len}, grid says ${m.r},${m.c}/${m.len}`);
      if (w.n !== nums[`${m.r},${m.c}`]) fail(`${id}: ${dir} entry at ${m.r},${m.c} numbered ${w.n}, should be ${nums[`${m.r},${m.c}`]}`);
    });
  }

  // ── EVERY CLUE IS THE BANK'S CLUE FOR ITS OWN ANSWER ────────────────────
  const answers = [];
  for (const [dir, list] of [['A', p.across], ['D', p.down]]) {
    for (const w of list) {
      const a = wordAt(p.grid, w, dir);
      answers.push(a);
      if (!/^[A-Z]+$/.test(a)) { fail(`${id}: ${dir}${w.n} reads "${a}"`); continue; }
      const c = CLUE.get(a);
      if (!c) fail(`${id}: ${dir}${w.n} answer ${a} is not in any clue bank - a clue was invented`);
      else if (c !== w.clue) fail(`${id}: ${dir}${w.n} answer ${a} carries "${w.clue}" but the bank's clue is "${c}"`);
      if (/\bIGNORE\b/.test(w.clue)) fail(`${id}: ${dir}${w.n} clue is a placeholder`);
      if (p.live >= COPY_FROM) {
        for (const hit of [...scanUS(a.toLowerCase()), ...scanUS(w.clue)]) fail(`${id}: ${dir}${w.n} British form "${hit.found}" (US: ${hit.us})`);
        if (/\u2014/.test(w.clue)) fail(`${id}: ${dir}${w.n} clue carries an em dash`);
      }
    }
  }
  const dup = answers.filter((a, i) => answers.indexOf(a) !== i);
  if (dup.length) fail(`${id}: answer repeated within the grid: ${[...new Set(dup)].join(', ')}`);
  for (const a of new Set(answers)) {
    if (!seenAnswers.has(a)) seenAnswers.set(a, []);
    seenAnswers.get(a).push(id);
  }
  boards.push({ p, answers: new Set(answers), shape: p.grid.map((r) => r.replace(/[A-Z]/g, '.')).join('|') });
}

// ── bank-wide variety ──────────────────────────────────────────────────────
for (const [a, ids] of seenAnswers) if (ids.length > CAP) fail(`answer ${a} used ${ids.length} times (cap ${CAP}): ${ids.join(', ')}`);
for (let i = 0; i < boards.length; i++) for (let j = i + 1; j < boards.length; j++) {
  const both = boards[i].p.sunday && boards[j].p.sunday;
  let n = 0; for (const a of boards[i].answers) if (boards[j].answers.has(a)) n++;
  const lim = both ? 4 : 3;
  if (n > lim) fail(`${boards[i].p.quizId} and ${boards[j].p.quizId} share ${n} answers (limit ${lim})`);
}
for (let i = 0; i < boards.length; i++) for (let j = i + 1; j < Math.min(boards.length, i + 7); j++) {
  if (boards[i].shape === boards[j].shape) warn(`${boards[i].p.quizId} and ${boards[j].p.quizId} reuse a grid shape inside a week`);
}

// ── the calendar itself ────────────────────────────────────────────────────
const nums2 = PUZZLES.map((p) => p.num);
if (new Set(nums2).size !== nums2.length) fail('duplicate puzzle numbers');
for (let i = 1; i < PUZZLES.length; i++) {
  if (PUZZLES[i].num !== PUZZLES[i - 1].num + 1) fail(`${PUZZLES[i].quizId}: num jumps from ${PUZZLES[i - 1].num}`);
  const gap = (new Date(PUZZLES[i].live) - new Date(PUZZLES[i - 1].live)) / 86400000;
  if (gap !== 1) fail(`${PUZZLES[i].quizId}: ${gap} day gap after ${PUZZLES[i - 1].live}`);
}

const wordCounts = PUZZLES.map((p) => p.across.length + p.down.length);
console.error(`encore: ${PUZZLES.length} boards, ${PUZZLES.filter((p) => p.sunday).length} Sundays, ` +
  `${seenAnswers.size} distinct answers, words ${Math.min(...wordCounts)}-${Math.max(...wordCounts)}, ` +
  `${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);
console.error(fails ? `${fails} FAILURES, ${warns} warnings` : `all checks passed (${warns} warnings)`);
process.exit(fails ? 1 : 0);
