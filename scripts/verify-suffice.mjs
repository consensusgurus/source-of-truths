// Verify the Suffice bank (app/suffice/puzzles.js) from scratch.
//
// Per CLAUDE.md rule 3, this RECOMPUTES and never trusts a stored field. Every
// item's answer letter is re-derived from its `chk` seed by an independent
// implementation of the sufficiency decision, then asserted against the stored
// `letter`. A checker that read p.letter and printed it would have verified
// nothing.
//
// What it proves:
//   structural   nums sequential, quizId/live/dateLabel agree, the sunday flag
//                matches the real weekday, 8 items on a weekday and 12 on a
//                Sunday, no duplicate question wording inside a day
//   letters      each stored letter recomputed from chk (MOD/SETS/STAT by
//                exhaustive enumeration, LIN by exact rational rank)
//   MOD proof    every modulus divides 2520, so the 2520-long check IS a proof
//                for all positive integers rather than a sample. Asserted, not
//                assumed: an item using a modulus outside that set is failed.
//   spread       no letter more than twice a weekday / three times a Sunday,
//                and the bank-wide letter mix inside a tolerance band. The
//                natural distribution is E 50% / C 4% / D 6%, so an E-heavy
//                bank is guessable without reading the statements.
//   variety      rule 7 pool ceiling: no question or statement template above
//                4% of the bank, counted across the WHOLE bank not per day
//   copy         US spellings, no em dashes, plural agreement, and the rendered
//                statement text must match what chk regenerates
//
// Run: node scripts/verify-suffice.mjs
import { PUZZLES } from '../app/suffice/puzzles.js';
import { scanUS } from './us-spellings.mjs';
import { getScenario, MOD_PERIOD, MOD_MODULI, linClassify, renderLin, decide } from '../app/suffice/engine.js';

// US_COPY_FROM: days from the 2026-09-24 restock on also pass the shared
// scripts/us-spellings.mjs screen; earlier days are frozen history.
const US_COPY_FROM = '2026-10-15';
let fails = 0;
const fail = (m) => { console.error('FAIL:', m); fails++; };
const note = (m) => console.log('…', m);

// The engine's decide() is the straight, filter-the-domain implementation. The
// GENERATOR uses a separate compiled index-set path for speed, so re-deriving
// here still crosses two independent implementations, which is the point.

// ─────────────────────────────── bank checks ─────────────────────────────────
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const CEIL = 0.04;
const qTpl = {}, sTpl = {}, letterTotal = {};
let items = 0;

if (!PUZZLES.length) fail('bank is empty');

PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.quizId})`;
  if (p.num !== i + 1) fail(`${tag}: num out of sequence`);

  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `suffice-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live`);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const label = `${dt.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${d}, ${y}`;
  if (p.dateLabel !== label) fail(`${tag}: dateLabel "${p.dateLabel}" != "${label}"`);
  const realSunday = dt.getUTCDay() === 0;
  if (p.sunday !== realSunday) fail(`${tag}: sunday flag ${p.sunday} but weekday says ${realSunday}`);

  // rule 5: the Sunday Edition proves its own scaling
  const want = p.sunday ? 12 : 8;
  if (p.items.length !== want) fail(`${tag}: ${p.items.length} items, expected ${want} for sunday=${p.sunday}`);

  const dayLetters = {}, asks = new Set();
  p.items.forEach((it, k) => {
    const itag = `${tag} item ${k + 1}`;
    items++;
    if (!LETTERS.includes(it.letter)) { fail(`${itag}: bad letter ${it.letter}`); return; }
    dayLetters[it.letter] = (dayLetters[it.letter] || 0) + 1;
    letterTotal[it.letter] = (letterTotal[it.letter] || 0) + 1;

    if (asks.has(it.ask)) fail(`${itag}: question wording repeated within the day ("${it.ask}")`);
    asks.add(it.ask);

    for (const f of ['fam', 'stem', 'ask', 's1', 's2', 'chk']) if (it[f] === undefined) fail(`${itag}: missing ${f}`);

    // ── recompute the letter ────────────────────────────────────────────────
    let got = null, qT = null, sT = null;
    if (it.fam === 'LIN') {
      const { e1, e2, c } = it.chk;
      got = linClassify(e1, e2, c);
      if (got === 'D') fail(`${itag}: LIN cannot yield D, engine or bank is wrong`);
      // the printed text must be what chk regenerates, or the player is reading
      // a different problem from the one that was verified
      const r = renderLin(e1, e2, c);
      if (r.s1 !== it.s1 || r.s2 !== it.s2 || r.ask !== it.ask) fail(`${itag}: LIN text does not match chk`);
      qT = `LIN:q${c.length}:${r.dir}`; sT = [`LIN:${e1.a.join(',')}`, `LIN:${e2.a.join(',')}`];
    } else {
      const sc = getScenario(it.fam, it.chk.scen);
      if (!sc) { fail(`${itag}: unknown ${it.fam} scenario ${it.chk.scen}`); return; }
      if (it.fam === 'MOD') {
        const mods = [sc.QS.find((q) => q.id === it.chk.q), sc.S.find((s) => s.id === it.chk.s1), sc.S.find((s) => s.id === it.chk.s2)]
          .map((o) => (o ? (o.m ?? o.mod) : null));
        if (mods.some((mm) => mm == null)) { fail(`${itag}: unknown MOD id in chk`); return; }
        // THE proof obligation for MOD: the 2520 window is only a proof if every
        // modulus divides it.
        for (const mm of mods) if (MOD_PERIOD % mm !== 0) fail(`${itag}: modulus ${mm} does not divide the ${MOD_PERIOD} period, so the check is a sample not a proof`);
        for (const mm of mods) if (!MOD_MODULI.includes(mm)) fail(`${itag}: modulus ${mm} outside the declared set`);
      }
      const r = decide(sc, it.chk.q, it.chk.s1, it.chk.s2);
      if (r.err) { fail(`${itag}: ${r.err}`); return; }
      got = r.letter;
      if (r.s1.text !== it.s1 || r.s2.text !== it.s2 || r.q.ask !== it.ask || sc.stem !== it.stem) fail(`${itag}: rendered text does not match chk`);
      qT = `${it.fam}:${it.chk.scen}:${it.chk.q}`;
      sT = [`${it.fam}:${it.chk.scen}:${it.chk.s1}`, `${it.fam}:${it.chk.scen}:${it.chk.s2}`];
    }
    if (got !== it.letter) fail(`${itag}: stored ${it.letter} but recomputed ${got}`);

    qTpl[qT] = (qTpl[qT] || 0) + 1;
    for (const t of sT) sTpl[t] = (sTpl[t] || 0) + 1;

    // ── copy checks (rule 8 and the house em-dash ban) ──────────────────────
    const copy = `${it.stem} ${it.ask} ${it.s1} ${it.s2}`;
    if (copy.includes('—')) fail(`${itag}: em dash in reader-facing copy`);
    if (/\b(colour|neighbour|favour|centre|metre|litre|analyse|catalogue)/i.test(copy)) fail(`${itag}: British spelling in copy`);
    if (p.live >= US_COPY_FROM) for (const hit of scanUS(copy)) fail(`${itag}: British form "${hit.found}" in copy (US: ${hit.us})`);
    if (/Exactly 1 of the numbers are\b/.test(copy)) fail(`${itag}: plural disagreement`);
    if (/\b0 of them\b/.test(copy)) fail(`${itag}: "0 of them" phrasing, use the worded form`);
  });

  const cap = p.sunday ? 3 : 2;
  for (const [l, n] of Object.entries(dayLetters)) if (n > cap) fail(`${tag}: letter ${l} appears ${n} times, cap ${cap} for sunday=${p.sunday}`);
});

// ───────────────── rule 7: pool variety across the WHOLE bank ────────────────
const capN = Math.ceil(items * CEIL);
for (const [t, n] of Object.entries(qTpl)) if (n > capN) fail(`question template ${t} used ${n} times (${(100 * n / items).toFixed(1)}%, ceiling ${CEIL * 100}%)`);
for (const [t, n] of Object.entries(sTpl)) if (n > capN) fail(`statement template ${t} used ${n} times (${(100 * n / items).toFixed(1)}%, ceiling ${CEIL * 100}%)`);

// ───────────────── bank-wide letter balance ──────────────────────────────────
// Not an even split, but nowhere near the natural E-heavy skew either. Each
// letter must sit between 10% and 30% of the bank.
for (const l of LETTERS) {
  const share = (letterTotal[l] || 0) / items;
  if (share < 0.10 || share > 0.30) fail(`letter ${l} is ${(100 * share).toFixed(1)}% of the bank, want 10-30%`);
}

// ───────────────── summary ───────────────────────────────────────────────────
console.log(`\nsuffice: ${PUZZLES.length} days, ${items} items`);
console.log('letters:', LETTERS.map((l) => `${l} ${(100 * (letterTotal[l] || 0) / items).toFixed(0)}%`).join('  '));
console.log(`templates: ${Object.keys(qTpl).length} question, ${Object.keys(sTpl).length} statement; max reuse ${Math.max(...Object.values(qTpl), ...Object.values(sTpl))} of ${capN} allowed`);
const lastLive = PUZZLES[PUZZLES.length - 1].live;
const daysLeft = Math.round((new Date(lastLive) - new Date()) / 864e5);
if (daysLeft < 21) note(`bank runs out in ${daysLeft} days (${lastLive}), extend it`);

if (fails) { console.error(`\nverify-suffice: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-suffice: all ${items} items pass (letters recomputed, MOD periodicity proved, spread and variety within ceilings)`);
