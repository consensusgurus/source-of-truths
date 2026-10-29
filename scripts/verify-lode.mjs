// Verify the Lode bank. The boards are generated (scripts/gen-lode.mjs), so
// this is the gate that proves the generator's output is actually playable
// before it ships: every field is re-derived from the word list and compared,
// and the day-to-day shape is checked for anything a player would notice.
//
//   node scripts/verify-lode.mjs
//
// Run it after ANY regeneration. Exits non-zero on the first failure so it can
// sit in front of a deploy.
import { readFileSync as __rf } from 'node:fs';
const LODE_FREQ = JSON.parse(__rf(new URL('./.lode-freq.json', import.meta.url), 'utf8'));
import { PUZZLES } from '../app/lode/puzzles.js';

const MIN_LEN = 4;
const fail = [];
const warn = [];
const bad = (p, msg) => fail.push(`${p ? p.quizId : '?'}: ${msg}`);

const seenNum = new Set();
const seenId = new Set();
const seenLive = new Set();
const seenBoard = new Set();
let prevLive = '';

for (const p of PUZZLES) {
  // ── identity ────────────────────────────────────────────────────────────
  if (seenNum.has(p.num)) bad(p, `duplicate num ${p.num}`);
  if (seenId.has(p.quizId)) bad(p, 'duplicate quizId');
  if (seenLive.has(p.live)) bad(p, `two boards share the live date ${p.live}`);
  seenNum.add(p.num); seenId.add(p.quizId); seenLive.add(p.live);
  if (p.live < prevLive) bad(p, `live date ${p.live} goes backwards`);
  prevLive = p.live;

  // The daily plumbing derives the date suffix from the quizId, so a mismatch
  // silently detaches the board from every leaderboard that day.
  const [Y, M, D] = p.live.split('-').map(Number);
  const wantId = `lode-${M}-${D}-${String(Y).slice(2)}`;
  if (p.quizId !== wantId) bad(p, `quizId should be ${wantId} for live ${p.live}`);
  const isSun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
  if (!!p.sunday !== isSun) bad(p, `sunday flag ${p.sunday} but ${p.live} is ${isSun ? '' : 'not '}a Sunday`);

  // ── letters ─────────────────────────────────────────────────────────────
  const letters = [p.core, ...p.outer];
  if (!/^[A-Z]$/.test(p.core)) bad(p, `core "${p.core}" is not a single letter`);
  if (new Set(letters).size !== letters.length) bad(p, 'a letter is repeated on the board');
  if (letters.length !== (p.sunday ? 8 : 7)) bad(p, `${letters.length} letters on a ${p.sunday ? 'Sunday' : 'weekday'} board`);
  if (letters.includes('S')) bad(p, 'S is on the board (plurals would pad the list)');
  const board = letters.slice().sort().join('') + '/' + p.core;
  if (seenBoard.has(board)) warn.push(`${p.quizId}: repeats the board ${board}`);
  seenBoard.add(board);
  const allowed = new Set(letters);

  // ── word list ───────────────────────────────────────────────────────────
  if (!Array.isArray(p.words) || !p.words.length) { bad(p, 'no words'); continue; }
  const seenW = new Set();
  let sum = 0, pangrams = 0, rare = 0;
  for (const x of p.words) {
    if (seenW.has(x.w)) bad(p, `duplicate word ${x.w}`);
    seenW.add(x.w);
    if (x.w.length < MIN_LEN) bad(p, `${x.w} is under ${MIN_LEN} letters`);
    if (!x.w.includes(p.core)) bad(p, `${x.w} does not use the core ${p.core}`);
    for (const ch of x.w) if (!allowed.has(ch)) bad(p, `${x.w} uses ${ch}, which is not on the board`);
    if (![1, 2, 3].includes(x.t)) bad(p, `${x.w} has tier ${x.t}`);
    const isPan = new Set(x.w).size === letters.length;
    if (!!x.g !== isPan) bad(p, `${x.w} pangram flag ${x.g} is wrong`);
    // The scoring formula is the game's whole promise; re-derive it exactly.
    const want = (x.w.length - 2) * x.t + (isPan ? 10 : 0);
    if (x.p !== want) bad(p, `${x.w} scores ${x.p}, should be ${want}`);
    sum += x.p;
    if (isPan) pangrams++;
    if (x.t === 3) rare++;
  }
  if (sum !== p.max) bad(p, `max is ${p.max}, words total ${sum}`);
  if (pangrams !== p.pangrams) bad(p, `pangrams is ${p.pangrams}, found ${pangrams}`);
  if (pangrams < 1) bad(p, 'no pangram — the board has no top prize');
  if (!rare) bad(p, 'no rare words — the whole scoring twist is inert');

  // ── ranks and the vein ──────────────────────────────────────────────────
  if (!Array.isArray(p.ranks) || p.ranks.length < 2) { bad(p, 'no rank ladder'); continue; }
  let prev = 0;
  for (const r of p.ranks) {
    if (!(r.at > prev)) bad(p, `rank ${r.n} at ${r.at} does not exceed the one below (${prev})`);
    prev = r.at;
  }
  const top = p.ranks[p.ranks.length - 1];
  // Mother Lode is every EVERYDAY word (owner, 2026-10-29): its cutoff is the
  // points of the words with recorded usage, never the obscure ones marked o.
  for (const x of p.words) {
    const z = LODE_FREQ[x.w.toLowerCase()];
    if (z === 0 && x.o !== 1) bad(p, `${x.w} has no recorded usage and is not marked o`);
    if (z !== 0 && x.o) bad(p, `${x.w} is marked o but has recorded usage`);
  }
  const everyday = p.words.filter((x) => !x.o).reduce((a, x) => a + x.p, 0);
  const lodeAt = (p.ranks.find((r) => r.n === 'Lode') || {}).at || 0;
  const wantTop = Math.max(lodeAt + 1, everyday);
  if (top.n !== 'Mother Lode') bad(p, `top rank is ${top.n}, should be Mother Lode`);
  if (top.at !== wantTop) bad(p, `Mother Lode is ${top.at}, should be the everyday words' ${wantTop}`);
  const lode = p.ranks.find((r) => r.n === 'Lode');
  if (!lode) bad(p, 'no Lode rank');
  else if (lode.at !== p.vein) bad(p, `vein ${p.vein} does not match the Lode rank ${lode.at}`);

  // ── playability ─────────────────────────────────────────────────────────
  // Best case: how few words could reach the vein? One or two would mean the
  // day is over before it starts.
  const desc = p.words.slice().sort((a, b) => b.p - a.p);
  let s = 0, n = 0;
  for (const x of desc) { if (s >= p.vein) break; s += x.p; n++; }
  if (n < 3) bad(p, `the vein falls in ${n} best words — too cheap`);
  if (n > 26) warn.push(`${p.quizId}: needs ${n} words at best to reach the vein — a grind`);
  if (p.words.length < 18) warn.push(`${p.quizId}: only ${p.words.length} words on the board`);
}

// Gap days would leave the daily slate short without anyone noticing.
const days = PUZZLES.map((p) => Date.parse(`${p.live}T12:00:00Z`)).sort((a, b) => a - b);
for (let i = 1; i < days.length; i++) {
  const gap = Math.round((days[i] - days[i - 1]) / 86400000);
  if (gap !== 1) fail.push(`gap of ${gap} days before ${new Date(days[i]).toISOString().slice(0, 10)}`);
}

for (const w of warn) console.warn('warn  ' + w);
if (fail.length) {
  console.error(`\n${fail.length} problem${fail.length === 1 ? '' : 's'}:`);
  for (const f of fail.slice(0, 40)) console.error('  ' + f);
  process.exit(1);
}
console.log(`All ${PUZZLES.length} Lode boards verified (${warn.length} warning${warn.length === 1 ? '' : 's'}).`);
