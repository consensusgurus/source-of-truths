// scripts/verify-trawl.mjs: checks Trawl's bank (app/trawl/puzzles.js).
//
// Per board: num runs 1..n by date, quizId and dateLabel agree with the date,
// a theme and a noun, a square grid of capital letters, at least 300 entries,
// every entry's letters are its title folded by lib/trawl.js (recomputed, never
// trusted), 4 to 24 letters, no palindromes, no duplicates, no entry inside
// another or inside another's reverse, and every entry occurs in the grid
// EXACTLY once across all eight directions. No dashes in any shown copy.
//   node scripts/verify-trawl.mjs
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { PUZZLES } = await import('../app/trawl/puzzles.js');
const { trawlLetters, trawlLines, trawlCount, trawlQuizId } = await import('../lib/trawl.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DASH = /[–—]/;

if (!PUZZLES.length) fail('bank is empty');
// TOPICS ARE POP CULTURE AND TRIVIA, AND A TOPIC MAY COME BACK ONLY A MONTH OR
// MORE LATER (owner, 2026-11-20: "they can repeat maybe 1 month apart? or longer
// ideally"). A repeat is a fresh grid, so a returning player is not replaying it.
const MIN_REPEAT_DAYS = 30;
const lastSeen = new Map();
const dayNo = (iso) => Math.round(Date.parse(iso + 'T12:00:00Z') / 86400000);
let prev = null;
PUZZLES.forEach((p, i) => {
  const was = lastSeen.get(p.theme);
  if (was != null && dayNo(p.live) - was < MIN_REPEAT_DAYS) fail(`#${p.num} ${p.live}: "${p.theme}" was used ${dayNo(p.live) - was} days earlier (minimum ${MIN_REPEAT_DAYS})`);
  lastSeen.set(p.theme, dayNo(p.live));
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (prev && p.live <= prev) fail(`${tag}: dates out of order`);
  if (prev) {
    const next = new Date(prev + 'T12:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    if (next.toISOString().slice(0, 10) !== p.live) fail(`${tag}: a gap after ${prev}`);
  }
  prev = p.live;
  if (p.quizId !== trawlQuizId(p.live)) fail(`${tag}: quizId ${p.quizId}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel ${p.dateLabel}`);
  if (!p.theme || DASH.test(p.theme)) fail(`${tag}: theme`);
  if (!p.noun) fail(`${tag}: noun`);
  const n = p.grid.length;
  if (p.size !== n) fail(`${tag}: size ${p.size} vs ${n}`);
  if (!p.grid.every((row) => row.length === n && /^[A-Z]+$/.test(row))) fail(`${tag}: grid not a square of capitals`);
  if (p.items.length < 300) fail(`${tag}: only ${p.items.length} entries`);
  const lines = trawlLines(p.grid);
  const seen = new Set();
  for (const it of p.items) {
    const w = trawlLetters(it.t);
    if (w !== it.w) fail(`${tag}: "${it.t}" letters ${it.w} should be ${w}`);
    if (w.length < 4 || w.length > 24) fail(`${tag}: "${it.t}" length ${w.length}`);
    const rw = w.split('').reverse().join('');
    if (w === rw) fail(`${tag}: "${it.t}" is a palindrome`);
    if (seen.has(w)) fail(`${tag}: "${it.t}" twice`);
    seen.add(w);
    if (DASH.test(it.t)) fail(`${tag}: "${it.t}" has a dash`);
    const c = trawlCount(lines, w);
    if (c !== 1) fail(`${tag}: "${it.t}" occurs ${c} times`);
  }
  const ws = p.items.map((it) => it.w);
  for (let a = 0; a < ws.length; a++) {
    const ra = ws[a].split('').reverse().join('');
    for (let b = 0; b < ws.length; b++) {
      if (a !== b && (ws[b].includes(ws[a]) || ws[b].includes(ra))) fail(`${tag}: ${ws[a]} sits inside ${ws[b]}`);
    }
  }
  console.log(`${tag} ${p.theme}: ${p.items.length} ${p.noun}, ${n}x${n}`);
});

if (fails) { console.log(`verify-trawl: ${fails} failure(s)`); process.exit(1); }
console.log(`verify-trawl: ${PUZZLES.length} board(s) clean`);
