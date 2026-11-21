// scripts/verify-search.mjs: checks Search's boards (app/search/boards.js), its
// site days (app/search/puzzles.js) and its pure rules (lib/search.js).
//
// Boards: num runs 1..n, key is search-11-20-26 for board 1 and search-b<n> after,
// a theme and a noun, a square grid of capital letters, at least 300 entries,
// every entry's letters are its title folded by lib/search.js (recomputed, never
// trusted), 4 to 24 letters, no palindromes, no duplicates, no entry inside
// another or inside another's reverse, and every entry occurs in the grid
// EXACTLY once across all eight directions. No dashes in any shown copy. A
// theme comes back no sooner than 30 boards later (each board runs at least a
// day, so at least 30 days; owner, 2026-11-20: "they can repeat maybe 1 month
// apart? or longer ideally").
// Site days: contiguous from 2026-11-20, quizId and dateLabel agree with the date.
// Rules: the 100 point split and the 24 to 72 hour window.
//   node scripts/verify-search.mjs
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { BOARDS } = await import('../app/search/boards.js');
const { PUZZLES } = await import('../app/search/puzzles.js');
const { searchLetters, searchLines, searchCount, searchQuizId, searchValue, searchWindows, SEARCH_LAUNCH, SEARCH_MIN_MS, SEARCH_MAX_MS } = await import('../lib/search.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DASH = /[–—]/;
const MIN_REPEAT = 30;

// ---- boards ----
if (!BOARDS.length) fail('no boards');
const lastSeen = new Map();
BOARDS.forEach((p, k) => {
  const tag = `board ${p.num}`;
  if (p.num !== k + 1) fail(`${tag}: num should be ${k + 1}`);
  if (p.key !== (p.num === 1 ? 'search-11-20-26' : `search-b${p.num}`)) fail(`${tag}: key ${p.key}`);
  if (!p.theme || DASH.test(p.theme)) fail(`${tag}: theme`);
  if (!p.noun) fail(`${tag}: noun`);
  const was = lastSeen.get(p.theme);
  if (was != null && p.num - was < MIN_REPEAT) fail(`${tag}: "${p.theme}" was board ${was}, only ${p.num - was} boards ago (minimum ${MIN_REPEAT})`);
  lastSeen.set(p.theme, p.num);
  const n = p.grid.length;
  if (p.size !== n) fail(`${tag}: size ${p.size} vs ${n}`);
  if (!p.grid.every((row) => row.length === n && /^[A-Z]+$/.test(row))) fail(`${tag}: grid not a square of capitals`);
  if (p.items.length < 300) fail(`${tag}: only ${p.items.length} entries`);
  const lines = searchLines(p.grid);
  const seen = new Set();
  for (const it of p.items) {
    const w = searchLetters(it.t);
    if (w !== it.w) fail(`${tag}: "${it.t}" letters ${it.w} should be ${w}`);
    if (w.length < 4 || w.length > 24) fail(`${tag}: "${it.t}" length ${w.length}`);
    if (w === w.split('').reverse().join('')) fail(`${tag}: "${it.t}" is a palindrome`);
    if (seen.has(w)) fail(`${tag}: "${it.t}" twice`);
    seen.add(w);
    if (DASH.test(it.t) || DASH.test(String(it.y || ''))) fail(`${tag}: "${it.t}" has a dash`);
    const c = searchCount(lines, w);
    if (c !== 1) fail(`${tag}: "${it.t}" occurs ${c} times`);
  }
  const ws = p.items.map((it) => it.w);
  for (let a = 0; a < ws.length; a++) {
    const ra = ws[a].split('').reverse().join('');
    for (let b = 0; b < ws.length; b++) if (a !== b && (ws[b].includes(ws[a]) || ws[b].includes(ra))) fail(`${tag}: ${ws[a]} sits inside ${ws[b]}`);
  }
  console.log(`${tag} ${p.theme}: ${p.items.length} ${p.noun}, ${n}x${n}`);
});

// ---- site days ----
PUZZLES.forEach((d, i) => {
  const iso = new Date(Date.parse('2026-11-20T12:00:00Z') + i * 86400000).toISOString().slice(0, 10);
  if (d.num !== i + 1 || d.live !== iso) fail(`site day ${i + 1}: ${d.live}, expected ${iso}`);
  if (d.quizId !== searchQuizId(d.live)) fail(`site day ${d.num}: quizId ${d.quizId}`);
  const [y, m, dd] = d.live.split('-').map(Number);
  if (d.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) fail(`site day ${d.num}: dateLabel`);
});

// ---- rules ----
if (searchValue(1) !== 100 || searchValue(2) !== 50 || searchValue(40) !== 3 || searchValue(3) !== 33) fail('the 100 point split');
const H = 3600000, L = SEARCH_LAUNCH;
const w1 = searchWindows(4, {}, L + 10 * H);
if (w1.length !== 1 || w1[0].closes !== null) fail('an unsolved board under 72 hours stays open');
const w2 = searchWindows(4, { 1: L + 5 * H }, L + 30 * H);
if (w2[0].closes !== L + SEARCH_MIN_MS || w2[1].opens !== L + SEARCH_MIN_MS) fail('a board solved early closes at 24 hours');
const w3 = searchWindows(4, { 1: L + 40 * H }, L + 41 * H);
if (w3[0].closes !== L + 40 * H) fail('a board solved after 24 hours closes when solved');
const w4 = searchWindows(4, {}, L + 80 * H);
if (w4[0].closes !== L + SEARCH_MAX_MS || w4.length !== 2) fail('an unsolved board closes at 72 hours');
const w5 = searchWindows(1, {}, L + 500 * H);
if (w5[0].closes !== null) fail('the last board in the bank stays open');

if (fails) { console.log(`verify-search: ${fails} failure(s)`); process.exit(1); }
console.log(`verify-search: ${BOARDS.length} board(s), ${PUZZLES.length} site days, rules clean`);
