#!/usr/bin/env node
// verify-arcos: checks app/arcos/puzzles.js, sharing no code with gen-arcos.mjs.
//
//  1. dates contiguous from No. 1, quizId and dateLabel match the live date,
//     Sunday flag exactly on Sundays
//  2. three rounds in the order front, back, diag; each spells its hidden word
//     (first letters, last letters, letter N of row N); diag rows one length,
//     the word's length plus one
//  3. lengths by weekday: hidden words Mon-Wed 4, Thu-Sat 4-5 with a 5,
//     Sunday 5-6; front/back answers Mon 4-5, Tue-Sat 4-6, Sunday 5-7
//  4. every answer has the clue the clue banks give it, and no clue contains
//     its own answer or any other word of the day
//  5. the finale pairs with all three hidden words on its side (hinge-pairs),
//     and `also` lists EXACTLY the other words that fit all three on either
//     side, recomputed here word by word from the dictionary, the hinge pairs
//     and the WordNet phrases under scripts/arcos-accept-rules.json (the game
//     accepts every one, so a missing real fit is the failure; owner,
//     2026-10-18)
//  6. no answer sits inside, or holds, a hidden word or the finale; no answer
//     twice in a day
//  7. no answer, hidden word or finale repeats anywhere in the bank
//  8. no em dash in any clue
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { PUZZLES } = await import(process.env.VERIFY_ARCOS_BANK || path.join(HERE, '../app/arcos/puzzles.js'));

const fails = [];
const fail = (p, m) => fails.push(`${p ? p.live : '-'}: ${m}`);

const bank = new Map();
for (const f of ['emcee-wordbank.txt', 'encore-wordbank.txt']) {
  for (const raw of readFileSync(path.join(HERE, f), 'utf8').split(/\r?\n/)) {
    const k = raw.indexOf('|');
    if (k < 1) continue;
    const w = raw.slice(0, k).trim().toUpperCase();
    if (!bank.has(w)) bank.set(w, new Set());
    bank.get(w).add(raw.slice(k + 1).trim());
  }
}
const pairs = new Set();
for (const raw of readFileSync(path.join(HERE, 'hinge-pairs.txt'), 'utf8').split(/\r?\n/)) {
  const t = raw.trim();
  if (!t || t[0] === '#') continue;
  const [a, b] = t.split(/\s+/);
  pairs.add(a + ' ' + b);
}

// the finale check, written separately from scripts/arcos-accept.mjs: walk
// every candidate word and test it against each hidden word directly
const RULES = JSON.parse(readFileSync(path.join(HERE, 'arcos-accept-rules.json'), 'utf8'));
const DICT = new Set();
for (const f of ['tuck-dict.txt', 'tuck-dict-long.txt']) {
  for (const w of readFileSync(path.join(HERE, '../public', f), 'utf8').split(/\r?\n/)) {
    const t = w.trim().toUpperCase();
    if (/^[A-Z]+$/.test(t)) DICT.add(t);
  }
}
const PHRASE = new Set(pairs);
const CAND = new Set(DICT);
for (const f of ['hinge-pairs.txt', 'arcos-phrases.txt']) {
  for (const raw of readFileSync(path.join(HERE, f), 'utf8').split(/\r?\n/)) {
    const t = raw.trim();
    if (!t || t[0] === '#') continue;
    const [a, b] = t.toUpperCase().split(/\s+/);
    if (!a || !b) continue;
    PHRASE.add(a + ' ' + b); CAND.add(a); CAND.add(b);
  }
}
const AFFIX = new Set(RULES.affixes);
function goesWith(a, b) { return DICT.has(a + b) || PHRASE.has(a + ' ' + b); }
function realFits(hid) {
  const hit = [];
  for (const w of CAND) {
    if (w.length < RULES.minLength || w.length > RULES.maxLength || AFFIX.has(w) || hid.includes(w)) continue;
    if (hid.every((h) => goesWith(h, w)) || hid.every((h) => goesWith(w, h))) hit.push(w);
  }
  const all = new Set(hit);
  return hit.filter((w) => !RULES.inflections.some((x) => w.length > x.length && w.endsWith(x) && all.has(w.slice(0, -x.length)))).sort();
}

const DAY = 864e5;
const isoAdd = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const words = (c) => c.toUpperCase().split(/[^A-Z]+/).filter(Boolean);

const seenAns = new Map(); const seenHid = new Map(); const seenFin = new Map();
PUZZLES.forEach((p, i) => {
  const first = PUZZLES[0].live;
  if (p.num !== i + 1) fail(p, `num ${p.num} should be ${i + 1}`);
  if (p.live !== isoAdd(first, i)) fail(p, 'dates not contiguous');
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `arcos-${m}-${d}-${String(y).slice(2)}`) fail(p, 'quizId');
  if (p.dateLabel !== `${MON[m - 1]} ${d}, ${y}`) fail(p, 'dateLabel');
  const wd = new Date(p.live + 'T12:00:00Z').getUTCDay();
  if (!!p.sunday !== (wd === 0)) fail(p, 'sunday flag');

  const kinds = (p.rounds || []).map((r) => r.kind).join(',');
  if (kinds !== 'front,back,diag') { fail(p, 'rounds ' + kinds); return; }
  const hid = p.rounds.map((r) => r.word);
  const hl = hid.map((h) => h.length);
  if (wd === 0) { if (!hl.every((n) => n >= 5 && n <= 6)) fail(p, 'Sunday hidden lengths'); }
  else if (wd <= 3) { if (!hl.every((n) => n === 4)) fail(p, 'Mon-Wed hidden lengths'); }
  else if (!hl.every((n) => n >= 4 && n <= 5) || !hl.includes(5)) fail(p, 'Thu-Sat hidden lengths');
  const [lo, hi] = wd === 0 ? [5, 7] : wd === 1 ? [4, 5] : [4, 6];

  const dayAns = [];
  for (const r of p.rounds) {
    const w = r.word;
    if (!/^[A-Z]+$/.test(w)) fail(p, 'hidden ' + w);
    if (r.rows.length !== w.length) fail(p, `${r.kind}: ${r.rows.length} rows for ${w}`);
    r.rows.forEach((row, k) => {
      const a = row.a;
      dayAns.push(a);
      const ch = r.kind === 'front' ? a[0] : r.kind === 'back' ? a[a.length - 1] : a[k];
      if (ch !== w[k]) fail(p, `${r.kind} row ${k + 1} ${a} does not give ${w[k]}`);
      if (r.kind === 'diag') { if (a.length !== w.length + 1) fail(p, `diag ${a} length`); }
      else if (a.length < lo || a.length > hi) fail(p, `${r.kind} ${a} length ${a.length}`);
      const cl = bank.get(a);
      if (!cl || !cl.has(row.c)) fail(p, `${a}: clue not in the banks`);
      if (/[—–]/.test(row.c)) fail(p, `${a}: dash in clue`);
    });
  }
  const dayWords = [...dayAns, ...hid, p.finale];
  if (new Set(dayAns).size !== dayAns.length) fail(p, 'answer twice in a day');
  for (const r of p.rounds) for (const row of r.rows) {
    const t = words(row.c);
    for (const dw of dayWords) {
      if (t.some((x) => x === dw || x === dw + 'S' || x + 'S' === dw)) fail(p, `clue for ${row.a} carries ${dw}`);
    }
    for (const x of [...hid, p.finale]) {
      if (row.a === x || row.a.includes(x) || x.includes(row.a)) fail(p, `${row.a} clashes with ${x}`);
    }
  }

  const f = p.finale;
  for (const h of hid) {
    const key = p.side === 'post' ? h + ' ' + f : f + ' ' + h;
    if (!pairs.has(key)) fail(p, `"${key}" is not in hinge-pairs`);
  }
  const fits = realFits(hid);
  if (!fits.includes(f)) fail(p, `finale ${f} fails the finale check`);
  const want = fits.filter((w) => w !== f);
  const also = p.also;
  if (!Array.isArray(also)) fail(p, 'no also list');
  else {
    if (also.includes(f)) fail(p, 'also repeats the finale');
    if ([...also].sort().join(',') !== also.join(',') || new Set(also).size !== also.length) fail(p, 'also not sorted and unique');
    const missing = want.filter((w) => !also.includes(w));
    const extra = also.filter((w) => !want.includes(w));
    if (missing.length) fail(p, `also is missing real fits: ${missing.join(', ')}`);
    if (extra.length) fail(p, `also lists words that do not fit: ${extra.join(', ')}`);
  }
  if (new Set([...hid, f]).size !== 4) fail(p, 'hidden words and finale not distinct');

  for (const a of dayAns) { if (seenAns.has(a)) fail(p, `${a} repeats ${seenAns.get(a)}`); seenAns.set(a, p.live); }
  for (const h of hid) { if (seenHid.has(h)) fail(p, `hidden ${h} repeats ${seenHid.get(h)}`); seenHid.set(h, p.live); }
  if (seenFin.has(f)) fail(p, `finale ${f} repeats ${seenFin.get(f)}`); seenFin.set(f, p.live);
});

if (fails.length) {
  console.log(`verify-arcos: ${fails.length} failure(s)`);
  for (const m of fails.slice(0, 60)) console.log('  FAIL ' + m);
  process.exit(1);
}
console.log(`verify-arcos: ok (${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live})`);
