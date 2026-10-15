// scripts/verify-scram.mjs — independent checker for Scram's bank.
//
//   node scripts/verify-scram.mjs
//   VERIFY_SCRAM_BANK=/path/to/puzzles.js node scripts/verify-scram.mjs
//
// Imports NOTHING from gen-scram.mjs on purpose: every rule is restated here,
// so a generator bug cannot certify itself. It reads the pools only to know
// each theme's full membership for the one-right-answer check.
//
// Fails on: a broken date chain, quizId or label; a Sunday flag on a weekday
// (or a Sunday without one); anything but ten answers; an answer outside the
// weekday's length band; a scramble that is not exactly the answer's letters,
// IS the answer, keeps its first letter, leaves more than a quarter of the
// letters in place, or (from five letters) keeps a three-letter run intact; an
// answer dealt twice anywhere in the bank; a theme back inside five days; a
// long Sunday on a theme not cleared for it; and, the one that matters most to
// a player, an answer whose letters also spell ANOTHER member of its theme.
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { THEMES } from './scram-pools.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANK = process.env.VERIFY_SCRAM_BANK || path.join(ROOT, 'app', 'scram', 'puzzles.js');
const { PUZZLES } = await import(pathToFileURL(BANK).href);

const FIRST = '2026-10-14';
const LENGTHS = ['8-12', '5-6', '5-7', '6-7', '6-8', '7-8', '7-9']; // by getUTCDay()
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const errs = [], warns = [];
const fail = (p, m) => errs.push(`${p ? p.quizId || '#' + p.num : 'bank'}: ${m}`);

const sortedLetters = (w) => w.replace(/[^A-Z]/g, '').split('').sort().join('');
const theme = {};
for (const t of THEMES) {
  const members = `${t.words} ${t.alsoValid || ''}`.split(/\s+/).filter(Boolean).map((w) => w.replace(/_/g, ' ').toUpperCase());
  theme[t.id] = { label: t.label, sunday: !!t.sunday, members: new Set(members) };
}

let prev = null;
const seenAnswer = new Map();
const lastTheme = {};
for (const p of PUZZLES) {
  const d = new Date(p.live + 'T12:00:00Z');
  // the chain
  if (!prev) { if (p.live !== FIRST) fail(p, `bank must open on ${FIRST}`); if (p.num !== 1) fail(p, 'first num must be 1'); }
  else {
    if (p.num !== prev.num + 1) fail(p, `num ${p.num} does not follow ${prev.num}`);
    if ((d - new Date(prev.live + 'T12:00:00Z')) / 864e5 !== 1) fail(p, `date gap after ${prev.live}`);
  }
  const qid = `scram-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
  if (p.quizId !== qid) fail(p, `quizId should be ${qid}`);
  const lab = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  if (p.dateLabel !== lab) fail(p, `dateLabel should be "${lab}"`);
  const dow = d.getUTCDay();
  if ((dow === 0) !== (p.sunday === true)) fail(p, dow === 0 ? 'Sunday without the sunday flag' : 'sunday flag on a weekday');

  // the theme
  const th = theme[p.themeId];
  if (!th) { fail(p, `unknown theme ${p.themeId}`); prev = p; continue; }
  if (p.theme !== th.label) fail(p, `theme label "${p.theme}" should be "${th.label}"`);
  if (dow === 0 && !th.sunday) fail(p, `${p.themeId} is not cleared for a Sunday Edition`);
  if (lastTheme[p.themeId]) {
    const gap = (d - new Date(lastTheme[p.themeId] + 'T12:00:00Z')) / 864e5;
    if (gap < 5) fail(p, `${p.themeId} back after ${gap} days (min 5)`);
  }
  lastTheme[p.themeId] = p.live;

  // the answers
  if (!Array.isArray(p.words) || p.words.length !== 10) { fail(p, 'needs exactly ten answers'); prev = p; continue; }
  const [lo, hi] = LENGTHS[dow].split('-').map(Number);
  const dayKeys = new Set();
  for (const w of p.words) {
    const a = w.a, s = w.s;
    if (typeof a !== 'string' || !/^[A-Z]+( [A-Z]+)*$/.test(a)) { fail(p, `bad answer "${a}"`); continue; }
    const L = a.replace(/ /g, '');
    if (L.length < lo || L.length > hi) fail(p, `${a} is ${L.length} letters, outside ${lo}-${hi}`);
    if (!th.members.has(a)) fail(p, `${a} is not in the ${p.themeId} pool`);
    if (seenAnswer.has(a)) fail(p, `${a} already dealt on ${seenAnswer.get(a)}`);
    seenAnswer.set(a, p.live);
    // one right answer
    const k = sortedLetters(a);
    if (dayKeys.has(k)) fail(p, `two answers share the letters of ${a}`);
    dayKeys.add(k);
    for (const m of th.members) if (m !== a && sortedLetters(m) === k) fail(p, `${a} also unscrambles to ${m}, another ${th.label} answer`);
    // the scramble
    if (typeof s !== 'string' || !/^[A-Z]+$/.test(s)) { fail(p, `${a}: bad scramble`); continue; }
    if (sortedLetters(s) !== k || s.length !== L.length) fail(p, `${a}: scramble ${s} is not its letters`);
    if (s === L) fail(p, `${a}: scramble is the answer`);
    if (s[0] === L[0]) fail(p, `${a}: scramble keeps the first letter`);
    let fixed = 0; for (let i = 0; i < L.length; i++) if (s[i] === L[i]) fixed++;
    if (fixed > Math.floor(L.length / 4)) fail(p, `${a}: ${fixed} letters left in place`);
    if (L.length >= 5) for (let i = 0; i + 3 <= L.length; i++) if (s.includes(L.slice(i, i + 3))) { fail(p, `${a}: scramble ${s} keeps "${L.slice(i, i + 3)}"`); break; }
  }
  prev = p;
}

// runway
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const lastLive = PUZZLES.length ? PUZZLES[PUZZLES.length - 1].live : FIRST;
const left = Math.round((new Date(lastLive + 'T12:00:00Z') - new Date(today + 'T12:00:00Z')) / 864e5);
if (left < 0) errs.push(`bank: exhausted, last board ${lastLive}`);
else if (left < 14) warns.push(`bank: only ${left} days of runway (last board ${lastLive}); extend with gen-scram.mjs --until`);

for (const w of warns) console.warn('WARN', w);
if (errs.length) { for (const e of errs) console.error('FAIL', e); console.error(`verify-scram: ${errs.length} failure(s)`); process.exit(1); }
console.log(`verify-scram: OK, ${PUZZLES.length} boards ${PUZZLES[0].live} to ${lastLive}, ${seenAnswer.size} answers, none twice`);
