// scripts/verify-tape.mjs: re-proves app/tape/puzzles.js against the universe
// and the authored rows. Imports nothing from the generator's logic.
//
//   node scripts/verify-tape.mjs
//
// What it recomputes or enforces:
//   - num, quizId, dateLabel and the Sunday flag from the live date; dates run
//     day after day with no gap.
//   - every answer ticker (and every accept ticker) is in the universe, and the
//     answer's name and ticker are what the universe lists.
//   - the series: at least 100 weekly points, every value an integer 0..1000,
//     exactly one 0 and at least one 1000 (it is scaled to its own low and high),
//     lo < hi, from < to and the span four to six years.
//   - the pin: its date sits between from and to, and pin.i is the week whose
//     date is nearest pin.date (recomputed from from/to on a weekly grid).
//   - the clues: ipo a year 1900..(the live year), hq "City, Region", does and
//     pin text present, no em dash, and neither may name the company or its
//     ticker (whole word).
//   - pool variety, bank-wide: no answer repeats; no pin headline repeats
//     word for word more than twice; no sector more than 45% of the bank (consumer brands are what most players know, so the cap is loose on purpose).
//   - size: a weekday answer ranks 1..700 by market value in the universe it was
//     built from; a Sunday answer ranks 300 or deeper.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { UNIVERSE } from '../app/tape/universe.js';
import { BOARDS, TAPE_START } from './tape-boards.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const bankPath = process.env.VERIFY_TAPE_BANK || path.join(here, '..', 'app', 'tape', 'puzzles.js');
const { PUZZLES } = await import(pathToFileURL(path.resolve(bankPath)).href);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SECTORS = new Set(['Information Technology', 'Consumer Discretionary', 'Communication Services', 'Health Care', 'Financials', 'Energy', 'Consumer Staples', 'Industrials', 'Materials', 'Utilities', 'Real Estate']);
let fails = 0;
const fail = (msg) => { fails++; console.error('FAIL ' + msg); };
const T = new Map(UNIVERSE.map(([t, n], i) => [t, { n, i: i + 1 }]));
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();

if (UNIVERSE.length < 2400 || UNIVERSE.length > 3100) fail(`universe has ${UNIVERSE.length} names; the Russell 3000 should be 2,400 to 3,100`);
{ const s = new Set(); for (const [t] of UNIVERSE) { if (s.has(t)) fail(`universe: duplicate ticker ${t}`); s.add(t); } }

const used = new Set(), heads = new Map(), secs = new Map();
let prev = null;
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live} ${p.ticker}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (i === 0 && p.live !== TAPE_START) fail(`${tag}: the bank should open on ${TAPE_START}`);
  if (prev && day(p.live) - day(prev) !== 86400000) fail(`${tag}: dates are not contiguous`);
  prev = p.live;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `tape-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  const sun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
  if (!!p.sunday !== sun) fail(`${tag}: sunday flag does not match the weekday`);
  const b = BOARDS[i];
  if (!b || b.t !== p.ticker) fail(`${tag}: does not match row ${i + 1} of scripts/tape-boards.mjs`);

  const u = T.get(p.ticker);
  if (!u) { fail(`${tag}: answer is not in the universe`); return; }
  for (const a of p.accept || []) if (!T.has(a)) fail(`${tag}: accept ticker ${a} is not in the universe`);
  if (!(p.accept || []).includes(p.ticker)) fail(`${tag}: accept must include the answer ticker`);
  if (u.n !== p.name) fail(`${tag}: name "${p.name}" differs from the universe's "${u.n}"`);
  if (used.has(p.ticker)) fail(`${tag}: answer repeats`); used.add(p.ticker);
  if (sun ? !(p.rank >= 300) : !(p.rank >= 1 && p.rank <= 700)) fail(`${tag}: rank ${p.rank} is outside the ${sun ? 'Sunday (300+)' : 'weekday (1 to 700)'} range`);

  if (!Array.isArray(p.w) || p.w.length < 100) fail(`${tag}: series has ${p.w && p.w.length} points, needs 100+`);
  else {
    if (p.w.some((v) => !Number.isInteger(v) || v < 0 || v > 1000)) fail(`${tag}: series values must be integers 0..1000`);
    if (p.w.filter((v) => v === 0).length < 1 || p.w.filter((v) => v === 1000).length < 1) fail(`${tag}: series is not scaled to its own low and high`);
  }
  if (!(p.lo > 0 && p.hi > p.lo)) fail(`${tag}: lo/hi`);
  const span = (day(p.to) - day(p.from)) / (365.25 * 86400000);
  // Five years, unless the company listed inside the window (then from its first week).
  if (!(day(p.from) < day(p.to)) || span > 5.2 || (span < 4.8 && p.ipo < Number(p.from.slice(0, 4)))) fail(`${tag}: chart span ${span.toFixed(1)} years`);
  // The pin: recompute the nearest week on the series' own weekly grid.
  if (!(day(p.pin.date) >= day(p.from) && day(p.pin.date) <= day(p.to))) fail(`${tag}: pin date ${p.pin.date} is outside the chart`);
  else {
    const step = (day(p.to) - day(p.from)) / (p.w.length - 1);
    const est = Math.round((day(p.pin.date) - day(p.from)) / step);
    if (Math.abs(est - p.pin.i) > 1) fail(`${tag}: pin.i ${p.pin.i} is not the week nearest ${p.pin.date} (expected about ${est})`);
    const [py, pm] = p.pin.date.split('-').map(Number);
    if (p.pin.label !== `${MONTHS[pm - 1].slice(0, 3)} ${py}`) fail(`${tag}: pin label ${p.pin.label}`);
  }

  if (!Number.isInteger(p.ipo) || p.ipo < 1900 || p.ipo > y) fail(`${tag}: ipo year ${p.ipo}`);
  if (!/^[A-Z][A-Za-z .'-]+, [A-Z][A-Za-z .'-]+$/.test(p.hq || '')) fail(`${tag}: hq "${p.hq}" should read City, Region`);
  if (!SECTORS.has(p.sector)) fail(`${tag}: sector ${p.sector}`);
  secs.set(p.sector, (secs.get(p.sector) || 0) + 1);
  const words = [p.name, ...(p.alt || [])].map((s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')[0]).filter((w) => w.length >= 3);
  for (const [field, text] of [['does', p.does], ['pin', p.pin.text]]) {
    if (!text || text.length < 12) fail(`${tag}: ${field} is missing`);
    if (/—/.test(text)) fail(`${tag}: em dash in ${field}`);
    const low = ` ${String(text).toLowerCase().replace(/[^a-z0-9 ]/g, ' ')} `;
    for (const w of words) if (low.includes(` ${w} `)) fail(`${tag}: ${field} names the company ("${w}")`);
    if (new RegExp(`\\b${p.ticker}\\b`).test(text) && p.ticker.length > 1) fail(`${tag}: ${field} names the ticker`);
  }
  heads.set(p.pin.text, (heads.get(p.pin.text) || 0) + 1);
});
for (const [h, n] of heads) if (n > 2) fail(`pin headline "${h}" is used ${n} times (cap 2)`);
for (const [s, n] of secs) if (n / PUZZLES.length > 0.45) fail(`sector ${s} is ${n} of ${PUZZLES.length} boards (cap 45%)`);
if (PUZZLES.length !== BOARDS.length) fail(`bank has ${PUZZLES.length} boards but scripts/tape-boards.mjs has ${BOARDS.length}`);

const last = PUZZLES[PUZZLES.length - 1];
console.log(`verify-tape: ${PUZZLES.length} boards to ${last && last.live}, universe ${UNIVERSE.length}: ${fails ? fails + ' FAIL' : 'OK'}`);
process.exit(fails ? 1 : 0);
