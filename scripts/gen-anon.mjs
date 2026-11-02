#!/usr/bin/env node
// Generator for Anon's bank (app/anon/puzzles.js). Written 2026-11-02 for the
// Nov 7-30 restock; the bank had no committed generator before this.
//
// scripts/verify-anon.mjs is the SPECIFICATION. Everything it checks is built in
// here by construction and then re-checked by this file's own copy of the same
// measures before a board is emitted, so a board this prints should pass the
// verifier unchanged:
//
//   partition   the passage's letters split EXACTLY into the answers, and every
//               answer lists the cells its letters occupy.
//   spine       the first `spine` answers' initials spell the author.
//   sharpness   every printed category comes from lib/anon-categories.js and
//               admits at most 4 words at the answer's length.
//   closed      10 to 16 closed answers. The target is drawn from a per-weekday
//               range (Monday 12-15 down to Saturday 10-13, Sunday 12-16) and
//               drifts up when a board keeps landing under its band, so the
//               bank does not sit on the floor of 10 (a floor is not a target).
//   cold start  the share of passage words forced by the closed answers alone
//               lands inside the weekday's BAND_WARM window. The generator aims
//               at a random point inside the band, not at its edge, so the week
//               keeps its ramp and boards do not pile up at a bound.
//   spelling    no British form (the verifier's BRIT list and -ise regex, plus
//               scripts/us-spellings.mjs) in any answer.
//   variety     answers distinct on the board, and no near-twins either (HEAD
//               and HEADED); no answer past the bank cap of 3 uses, counting
//               every board already banked AND every board generated earlier in
//               the same run; no author past the cap of 6.
//   sunday      a Sunday carries the flag and runs more answers than the weekday
//               median (24 to 28 against a median of 21). Weekdays run 19 to 21,
//               or 22 for a passage past 126 letters.
//
// THE SEARCH. Spine first (scarcest initials first), then a scored greedy walk
// that seats words holding the most over-represented letter left, keeps the
// remainder's letter mix and letters-per-slot word-shaped, and finishes the
// last two or three words exhaustively through an anagram index; then a
// hill-climb over which occurrence of each letter the closed answers take, to
// land the cold start on a random target inside the band. Each board tries its
// seed and two neighbours, then a closed-first walk, before widening the open
// vocabulary (see below). Everything is seeded from date+author+title, so a
// run is reproducible.
//
// PASSAGE CHOICE MATTERS MORE THAN SEEDS. Only passage words in
// lib/anon-common.txt can ever be forced, so a passage's share of common words
// caps its cold start: put the most common-worded passages on Monday and the
// least on Saturday. Passages much past 125 letters crowd the answer slots on a
// weekday; the warm-era bank ran 108 to 124.
//
// OPEN ANSWERS come from lib/anon-common.txt (the list the cold-start measure
// reads against) intersected with the hand-clued crossword banks, 4 to 8
// letters, minus OPEN_BLOCK below as a last screen for anything unpleasant.
// Only when that vocabulary cannot cover a passage does a board widen to the
// whole common list, and the log then marks each such answer (UNCLUED) for a
// human read. An open answer never repeats a word of its passage or title (or
// its plural or past form), which would be a free gift the cold-start measure
// does not count.
//
// USAGE
//   node scripts/gen-anon.mjs --in boards.json [--out new-boards.js] [--append]
//
// boards.json is an array of { date, author, title, q, seed? } in date order.
// `num` continues from the bank's last board. --out writes the board objects as
// JS (two-space indented, same shape as the bank) for review; --append splices
// each board onto app/anon/puzzles.js before the closing `];` as soon as it is
// built, asserting every byte before it is unchanged. A rerun skips specs that
// are already banked, so an interrupted run resumes. --debug (40 attempts) and
// --hist print where failed walks died.
//
// Passages must be VERBATIM public-domain text, checked against the source
// edition before they go into boards.json; this script cannot check that.

import { readFileSync, writeFileSync } from 'node:fs';
import { CLOSED, LEGACY } from '../lib/anon-categories.js';
import { scanUS } from './us-spellings.mjs';

const BANK = new URL('../app/anon/puzzles.js', import.meta.url);
const { PUZZLES } = await import(BANK.href);

// ---- the verifier's constants, mirrored --------------------------------------
const CAND_CAP = 4;
const WORD_CAP = 3;
const AUTHOR_CAP = 6;
const BAND_WARM = {
  1: [0.66, 0.81], 2: [0.61, 0.69], 3: [0.56, 0.63], 4: [0.52, 0.59],
  5: [0.48, 0.56], 6: [0.42, 0.52], 0: [0.56, 0.79],
};
const BRIT = new Set('colour honour favour labour humour neighbour behaviour odour rumour vapour harbour parlour saviour splendour endeavour centre theatre fibre litre metre calibre sombre spectre defence offence pretence jewellery programme aluminium moustache storey whilst amongst learnt spelt dreamt travelled cancelled plough draught tyre kerb grey'.split(' '));
const BRIT_RE = /(ise|ised|ises|ising|isation|isations|yse|ysed|ysing)$/;

// Open answers the common list carries but a reader should not meet as a
// solution: proper nouns, brands, slang, abbreviations-as-words, and the rude.
const OPEN_BLOCK = new Set(`
abba bigfoot chico carbs ligand cartels yang ying hijack bunnies castor
asshole bitch bastard damn hell shit fuck crap piss slut whore sexy sexual sex porn nude naked
penis vagina boobs breast breasts nipple rape raped rapist kill killer killed killing murder
nazi nazis drug drugs cocaine heroin meth weed stoned drunk suicide terror terrorist
dick cock butt butts anal oral erotic fetish horny lust kinky dildo
hottie batman yuck mini fiat anyways alright gonna wanna kinda iphone ipad google yahoo ebay amazon twitter facebook nike adidas pepsi cola
aids hiv covid ebola cancer tumor
`.trim().split(/\s+/));

// ---- dictionaries ------------------------------------------------------------
const COMMON_LIST = readFileSync(new URL('../lib/anon-common.txt', import.meta.url), 'utf8')
  .split('\n').map((s) => s.trim()).filter(Boolean);
const COMMON = new Set(COMMON_LIST);
const COMMON_BY_LEN = new Map();
for (const w of COMMON_LIST) {
  if (!COMMON_BY_LEN.has(w.length)) COMMON_BY_LEN.set(w.length, []);
  COMMON_BY_LEN.get(w.length).push(w);
}

// A British stem with an English inflection on it (offences, colours,
// harboured) is as British as the stem, and neither list spells those out.
const BRIT_STEMS = new Set([...BRIT, 'defence', 'offence', 'pretence', 'licence', 'practise', 'catalogue', 'dialogue', 'analyse', 'paralyse', 'mould', 'smoulder', 'plough', 'cheque', 'sceptic', 'manoeuvre', 'aeroplane', 'gaol', 'kerb', 'pyjama']);
// The open vocabulary: common words that ALSO appear in the crossword clue
// banks (scripts/emcee-wordbank.txt, scripts/encore-wordbank.txt). Those banks
// were written by hand with a clue for every word, so the intersection drops
// what the raw common list carries (names, brands, slang like GOTCHA or
// HOTTIE) without a hand blocklist having to anticipate every one.
const CLUED = new Set();
for (const f of ['emcee-wordbank.txt', 'encore-wordbank.txt']) {
  for (const line of readFileSync(new URL(`./${f}`, import.meta.url), 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    CLUED.add(line.split('|')[0].trim().toLowerCase());
  }
}

const isBrit = (w) => {
  if (BRIT.has(w) || BRIT_RE.test(w) || scanUS(w).length > 0) return true;
  for (const cut of ['', 's', 'es', 'd', 'ed', 'ing', 'er', 'ers', 'ly']) {
    if (cut && !w.endsWith(cut)) continue;
    const stem = cut ? w.slice(0, -cut.length) : w;
    if (BRIT_STEMS.has(stem) || BRIT_STEMS.has(stem + 'e')) return true;
  }
  // -ll- doublings (travelled, cancelled) and -our forms not in any list
  if (/(ell|ill)(ed|ing|er|ers)$/.test(w) && /(travell|cancell|label|model|signall|fuell|level|marvell|quarrell|rivall|tunnell|counsell|jewell)/.test(w)) return true;
  return /(colour|honour|favour|labour|humour|neighbour|behaviour|odour|rumour|vapour|harbour|parlour|saviour|splendour|endeavour|armour|flavour|clamour|glamour|valour|vigour|rigour|ardour|fervour|candour|savour|tumour)/.test(w);
};

// Sharp (category, word) pairs: the category admits <= CAND_CAP at that length.
// A word in several sharp categories takes the one with the fewest candidates.
const SHARP = new Map();
const legacy = (cat, w) => (LEGACY[cat] || '').split(' ').includes(w);
for (const [cat, list] of Object.entries(CLOSED)) {
  const ws = list.split(' ');
  for (const w of ws) {
    if (legacy(cat, w)) continue;   // wrong label kept only for frozen boards
    if (!/^[a-z]+$/.test(w) || w.length < 4 || w.length > 8) continue;
    const k = ws.filter((x) => x.length === w.length).length;
    if (k > CAND_CAP || isBrit(w)) continue;
    const prev = SHARP.get(w);
    if (!prev || k < prev.k) SHARP.set(w, { cat, k });
  }
}

// ---- bank usage --------------------------------------------------------------
const wordUse = new Map();
const authorUse = new Map();
for (const p of PUZZLES) {
  for (const a of p.a) wordUse.set(a.w.toLowerCase(), (wordUse.get(a.w.toLowerCase()) || 0) + 1);
  authorUse.set(p.author, (authorUse.get(p.author) || 0) + 1);
}

// ---- seeded RNG ----------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function shuffle(arr, R) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
const hashStr = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---- letter multisets ------------------------------------------------------------
const A0 = 97;
const counts = (w) => { const c = new Array(26).fill(0); for (const ch of w) c[ch.charCodeAt(0) - A0]++; return c; };
const fits = (wc, R) => { for (let i = 0; i < 26; i++) if (wc[i] > R[i]) return false; return true; };
const sub = (R, wc) => { for (let i = 0; i < 26; i++) R[i] -= wc[i]; };
const add = (R, wc) => { for (let i = 0; i < 26; i++) R[i] += wc[i]; };
const total = (R) => R.reduce((s, x) => s + x, 0);

function letters(s) { return [...s].filter((c) => /[a-z]/i.test(c)).map((c) => c.toLowerCase()); }

// ---- the cold-start measure, same as the verifier ---------------------------------
function passageWords(q) {
  const words = q.split(' ').map((w) => w.replace(/[^a-zA-Z]/g, '').toLowerCase());
  const spans = [];
  let k = 0;
  for (const w of words) { spans.push([k, w]); k += w.length; }
  return spans;
}
const forcedCache = new Map();
const HIST = new Map();
function wordForced(w, idx) {
  if (!idx.length || !COMMON.has(w)) return false;
  const key = w + ':' + idx.join(',');
  if (forcedCache.has(key)) return forcedCache.get(key);
  let c = 0;
  for (const x of COMMON_BY_LEN.get(w.length) || []) {
    if (idx.every((i) => x[i] === w[i])) { c++; if (c > 1) break; }
  }
  forcedCache.set(key, c === 1);
  return c === 1;
}
function forcedOf(spans, known) {
  let f = 0;
  for (const [k, w] of spans) {
    const idx = [];
    for (let i = 0; i < w.length; i++) if (known.has(k + i)) idx.push(i);
    if (wordForced(w, idx)) f++;
  }
  return f;
}

// ---- one board ---------------------------------------------------------------------
function build(spec, usage, opts = {}) {
  const { date, author, title, q } = spec;
  const seed = spec.seed ?? hashStr(date + author + title);
  const R = rng(seed);
  const qs = letters(q);
  const N = qs.length;
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const sunday = dow === 0;
  const [lo, hi] = BAND_WARM[dow];
  const spineLetters = author.replace(/[^A-Z]/g, '').toLowerCase();
  const spans = passageWords(q);
  // An open answer may not repeat a word of the passage or of the title, plain
  // or with a plural/past ending: that would be a free gift.
  const passageSet = new Set();
  for (const w of [...spans.map(([, x]) => x), ...title.toLowerCase().split(/[^a-z]+/)]) {
    if (!w) continue;
    for (const v of [w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w.replace(/s$/, ''), w.replace(/e?d$/, '')]) passageSet.add(v);
  }
  const M = counts(qs.join(''));
  const usable = (w) => (usage.get(w) || 0) < WORD_CAP;

  const cc = new Map();
  const openPool = [];
  for (const w of COMMON_LIST) {
    if (w.length < 4 || w.length > 8 || !/^[a-z]+$/.test(w)) continue;
    if ((!opts.wide && !CLUED.has(w)) || OPEN_BLOCK.has(w) || isBrit(w) || passageSet.has(w) || !usable(w)) continue;
    if (SHARP.has(w)) continue;   // a sharp word is worth more seated as closed
    const c = counts(w);
    if (!fits(c, M)) continue;
    cc.set(w, c);
    openPool.push(w);
  }
  const closedPool = [...SHARP.keys()].filter((w) => usable(w) && !passageSet.has(w) && fits(counts(w), M));
  for (const w of closedPool) cc.set(w, counts(w));
  const byLetter = Array.from({ length: 26 }, () => []);
  for (const w of openPool) for (const i of new Set([...w].map((ch) => ch.charCodeAt(0) - A0))) byLetter[i].push(w);
  const byLetterC = Array.from({ length: 26 }, () => []);
  for (const w of closedPool) for (const i of new Set([...w].map((ch) => ch.charCodeAt(0) - A0))) byLetterC[i].push(w);
  // Branch on the letter the pools can least afford, rarest first.
  const rarity = byLetter.map((l, i) => [l.length + byLetterC[i].length, i]).sort((x, y) => x[0] - y[0]).map(([, i]) => i);
  const FREQ = new Array(26).fill(0);
  { let t = 0; for (const w of openPool) for (const ch of w) { FREQ[ch.charCodeAt(0) - A0]++; t++; } for (let i = 0; i < 26; i++) FREQ[i] /= t; }
  // Anagram index for the last word of a cover.
  const keyOf = (c) => c.map((x, i) => String.fromCharCode(A0 + i).repeat(x)).join('');
  const ANAG = new Map();
  for (const w of [...openPool, ...closedPool]) {
    const k = [...w].sort().join('');
    if (!ANAG.has(k)) ANAG.set(k, []);
    ANAG.get(k).push(w);
  }

  // Answer count: weekday ~5.8 letters an answer, Sunday must clear the median.
  // Weekdays run 18 to 21 answers like the banked ones; a passage past 126
  // letters may take 22, which keeps the letters per answer near the bank's
  // ceiling (132 letters in 21) and leaves the weekday median at 21.
  const ansHi = sunday ? Math.min(28, Math.max(24, Math.round(N / 5.3))) : Math.max(19, Math.min(N > 126 ? 22 : 21, Math.round(N / 5.4)));
  const ansLo = sunday ? 23 : Math.min(ansHi, Math.max(18, Math.round(N / 6.4)));
  const initials = counts(spineLetters);
  if (!fits(initials, M)) throw new Error(`${date}: the passage lacks a letter the author's initials need`);

  const why = { spine: 0, closed: 0, slots: 0, cover: 0, band: 0 };
  // The closed target starts from a per-weekday range (Monday, the warmest
  // band, needs the most known letters) and drifts with band misses: a board
  // that keeps landing below the band seats more closed answers next time.
  const BASE = { 1: [12, 15], 2: [11, 14], 3: [11, 14], 4: [11, 13], 5: [11, 13], 6: [10, 13], 0: [12, 16] }[dow];
  let drift = 0, lowMiss = 0, highMiss = 0;
  for (let attempt = 0; attempt < (opts.debug ? 40 : opts.attempts || 4000); attempt++) {
    const Rm = M.slice();
    const chosen = [];   // { w, cat|null }
    const used = new Set();
    // `used` also blocks a board's near-twins: THROAT and THROATS, HEAD and
    // HEADED, on one board read as the same answer twice.
    const forms = (w) => [w, w + 's', w + 'es', w + 'd', w + 'ed', w.replace(/e?s$/, ''), w.replace(/e?d$/, '')];
    const take = (w, cat) => { sub(Rm, cc.get(w)); chosen.push({ w, cat }); for (const f of forms(w)) used.add(f); };

    // closed target, varied upward from the floor
    // A tight board (many letters per answer) cannot carry as many short
    // closed words, so its target spans 10-12 rather than 10-14.
    const tight = N / ansHi > 5.7;
    const [b0, b1] = tight ? [BASE[0], BASE[1] - 1] : BASE;
    const closedTarget = Math.max(10, Math.min(16, b0 + Math.floor(R() * (b1 - b0 + 1)) + drift));

    // 1. spine: one word per author letter, closed when a sharp one fits
    let ok = true;
    const spine = [];
    // Seat the scarcest initials first, and never let a pick eat an initial a
    // later spine word still needs; the answers go back into author order below.
    const order = [...spineLetters].map((L, i) => [L, i]).sort((x, y) => M[x[0].charCodeAt(0) - A0] - M[y[0].charCodeAt(0) - A0]);
    const spineAt = new Array(spineLetters.length);
    const keeps = (w, k) => {
      const r = Rm.slice(); sub(r, cc.get(w));
      for (const [L2] of order.slice(k + 1)) { const i = L2.charCodeAt(0) - A0; if (--r[i] < 0) return false; }
      return true;
    };
    for (let k = 0; k < order.length; k++) {
      const [L, at] = order[k];
      const tryClosed = R() < 0.45;
      const cands = shuffle((tryClosed ? closedPool : openPool).filter((w) => w[0] === L && !used.has(w) && fits(cc.get(w), Rm) && keeps(w, k)), R);
      const longest = (arr) => (tight ? arr.slice(0, 40).sort((x, y) => y.length - x.length + (R() - 0.5) * 3) : arr);
      let w = longest(cands)[0];
      let cat = w && tryClosed ? SHARP.get(w).cat : null;
      if (!w) {
        const alt = shuffle((tryClosed ? openPool : closedPool).filter((x) => x[0] === L && !used.has(x) && fits(cc.get(x), Rm) && keeps(x, k)), R);
        w = longest(alt)[0];
        cat = w && !tryClosed ? SHARP.get(w).cat : null;
      }
      if (!w) { ok = false; if (opts.debug) console.error('  spine miss at', L, chosen.map((x) => x.w).join(' ')); break; }
      take(w, cat);
      spineAt[at] = chosen.pop();
    }
    spine.push(...spineAt);
    chosen.push(...spineAt);
    if (!ok) { why.spine++; continue; }

    // 2. exact cover of what is left, closed and open words together. A deep
    // backtracking search is hopeless at 15 words, so this is a scored greedy
    // walk with cheap restarts: each step seats a word holding the scarcest
    // letter left, preferring closed words until the closed target is met,
    // lengths that keep letters-per-slot in range, and a remainder whose vowel
    // share stays word-shaped. The last two words come from the anagram index.
    const left = total(Rm);
    const slotsLo = Math.max(1, ansLo - chosen.length), slotsHi = ansHi - chosen.length;
    if (slotsHi < 1 || left < 4 * slotsLo || left > 8 * slotsHi) { why.slots++; continue; }
    const closedMax = closedTarget + 2;
    const VOW = [0, 4, 8, 14, 20, 24];
    const vfrac = (r, t) => (t ? VOW.reduce((s, i) => s + r[i], 0) / t : 0.4);
    let fill = null;
    for (let walk = 0; walk < 60 && !fill; walk++) {
      const r = Rm.slice();
      const got = [];
      const u = new Set(used);
      let nc = chosen.filter((x) => x.cat).length;
      let dead = false;
      while (!dead) {
        const rem = total(r);
        const room = slotsHi - got.length;
        if (rem === 0) { if (got.length >= slotsLo && nc >= closedTarget) fill = got; break; }
        if (room <= 0 || rem > 8 * room) break;
        const okLen = (w) => {
          const r2 = rem - w.length;
          if (r2 === 0) return got.length + 1 >= slotsLo;
          return r2 >= 4 && r2 <= 8 * (room - 1);
        };
        // finish: one word, or two through the anagram index
        if (rem <= 8 && got.length + 1 >= slotsLo) {
          const fin = (ANAG.get(keyOf(r)) || []).filter((w) => !u.has(w) && nc + (SHARP.has(w) ? 1 : 0) >= closedTarget);
          if (fin.length) { fill = [...got, fin[Math.floor(R() * fin.length)]]; break; }
        }
        // Branch on the most over-represented letter left: the rare ones
        // (q, z, x) and any common one that has piled up.
        let li = -1, liBest = -1;
        for (let i = 0; i < 26; i++) if (r[i] > 0) { const v = r[i] / (FREQ[i] + 0.002); if (v > liBest) { liBest = v; li = i; } }
        // Exhaustive finish of the last two or three words: a word holding the
        // rarest letter, recursing down to the anagram index.
        const finish = (r0, k, nc0, u0) => {
          const t0 = total(r0);
          if (k === 1) {
            const xs = (ANAG.get(keyOf(r0)) || []).filter((x) => !u0.has(x));
            const x = xs.find((x2) => { const c = nc0 + (SHARP.has(x2) ? 1 : 0); return c >= closedTarget && c <= closedMax; });
            return x ? [x] : null;
          }
          const l0 = rarity.find((i) => r0[i] > 0);
          let n = 0;
          for (const w of [...byLetterC[l0], ...byLetter[l0]]) {
            const t2 = t0 - w.length;
            if (u0.has(w) || t2 < 4 * (k - 1) || t2 > 8 * (k - 1) || !fits(cc.get(w), r0)) continue;
            if (++n > (k === 3 ? 120 : 100000)) break;
            const r2 = r0.slice(); sub(r2, cc.get(w));
            const fw = forms(w).filter((f) => !u0.has(f));
            for (const f of fw) u0.add(f);
            const rest = finish(r2, k - 1, nc0 + (SHARP.has(w) ? 1 : 0), u0);
            for (const f of fw) u0.delete(f);
            if (rest) return [w, ...rest];
          }
          return null;
        };
        for (const k of [2, 3]) {
          if (room >= k && rem >= 4 * k && rem <= 8 * k && got.length + k >= slotsLo) {
            const tail = finish(r, k, nc, u);
            if (tail) { fill = [...got, ...tail]; break; }
          }
        }
        if (fill) break;
        const need = rem / room;
        const wantClosed = nc < closedTarget;
        const cands = [];
        // Behind on closed answers with few slots left: any closed word that
        // fits, not only those holding the scarcest letter.
        const urgent = closedTarget - nc >= room - 3;
        const pools = opts.closedFirst && wantClosed ? [closedPool] : urgent ? [closedPool, byLetterC[li], byLetter[li]] : nc < closedMax ? [byLetterC[li], byLetter[li]] : [byLetter[li]];
        for (const pool of pools) {
          // full scan (a fit test is cheap), starting at a random offset
          const off = Math.floor(R() * (pool.length || 1));
          for (let k = 0; k < pool.length; k++) {
            const w = pool[(off + k) % pool.length];
            if (u.has(w) || !fits(cc.get(w), r) || !okLen(w)) continue;
            const r2 = r.slice(); sub(r2, cc.get(w));
            const t2 = rem - w.length;
            let sc = -Math.abs(vfrac(r2, t2) - 0.39) * 10;
            // keep the remainder's letter mix close to the vocabulary's own,
            // so no letter piles up where no word can absorb it
            if (t2) { let d = 0; for (let i = 0; i < 26; i++) { const x = r2[i] / t2 - FREQ[i]; if (x > 0) d += x * x; } sc -= d * 60; }
            const per = t2 / Math.max(1, room - 1);   // letters per slot left after w
            sc -= Math.max(0, per - 6.2) * 4 + Math.max(0, 4.6 - per) * 2;
            if (SHARP.has(w)) sc += wantClosed ? (urgent ? 8 : 3) : -1;
            sc += R() * 1.5;
            cands.push([sc, w]);
          }
        }
        if (!cands.length) { dead = true; break; }
        cands.sort((x, y) => y[0] - x[0]);
        const w = cands[Math.floor(R() * Math.min(3, cands.length))][1];
        sub(r, cc.get(w)); for (const f of forms(w)) u.add(f); got.push(w); if (SHARP.has(w)) nc++;
      }
      if ((opts.debug || opts.hist) && !fill) { const k = `${total(r)}/${slotsHi - got.length}/${nc}${opts.debug ? ":" + keyOf(r) : ""}`; HIST.set(k, (HIST.get(k) || 0) + 1); }
    }
    if (!fill) { why.cover++; continue; }
    for (const w of fill) used.add(w);
    for (const w of fill) chosen.push({ w, cat: SHARP.has(w) ? SHARP.get(w).cat : null });

    // 4. cells: choose which occurrence of each letter the closed answers take,
    // hill-climbing the cold start toward a target inside the band.
    const closedWs = chosen.filter((x) => x.cat);
    const need = new Array(26).fill(0);
    for (const x of closedWs) for (const ch of x.w) need[ch.charCodeAt(0) - A0]++;
    const pos = Array.from({ length: 26 }, () => []);
    qs.forEach((ch, i) => pos[ch.charCodeAt(0) - A0].push(i));
    const known = new Set();
    for (let i = 0; i < 26; i++) for (const p of shuffle(pos[i].slice(), R).slice(0, need[i])) known.add(p);
    const words = spans.length;
    const margin = Math.min(0.02, (hi - lo) / 4);
    const target = lo + margin + R() * (hi - lo - 2 * margin);
    // incremental: a swap only touches the (at most two) words holding a and b
    const wordOf = new Array(N);
    spans.forEach(([k, w], wi) => { for (let i = 0; i < w.length; i++) wordOf[k + i] = wi; });
    const one = (wi) => {
      const [k, w] = spans[wi];
      const idx = [];
      for (let i = 0; i < w.length; i++) if (known.has(k + i)) idx.push(i);
      return wordForced(w, idx) ? 1 : 0;
    };
    const flag = spans.map((_, wi) => one(wi));
    let f = flag.reduce((s, x) => s + x, 0);
    let dist = Math.abs(f / words - target);
    for (let it = 0; it < 2500 && dist > 0.5 / words; it++) {
      const kArr = [...known];
      const a = kArr[Math.floor(R() * kArr.length)];
      const li = qs[a].charCodeAt(0) - A0;
      const outs = pos[li].filter((p) => !known.has(p));
      if (!outs.length) continue;
      const b = outs[Math.floor(R() * outs.length)];
      known.delete(a); known.add(b);
      const touched = [...new Set([wordOf[a], wordOf[b]])];
      const old = touched.map((wi) => flag[wi]);
      const nu = touched.map(one);
      const f2 = f - old.reduce((s, x) => s + x, 0) + nu.reduce((s, x) => s + x, 0);
      const d2 = Math.abs(f2 / words - target);
      if (d2 <= dist || R() < 0.02) { f = f2; dist = d2; touched.forEach((wi, j) => { flag[wi] = nu[j]; }); }
      else { known.delete(b); known.add(a); }
    }
    const share = f / words;
    if (share < lo || share > hi) {
      if (share < lo && ++lowMiss % 15 === 0) drift++;
      if (share > hi && ++highMiss % 15 === 0) drift--;
      why.band++; if (opts.debug) console.error(`  band miss ${f}/${words} target ${target.toFixed(2)}`); continue; }

    // 5. hand out the cells
    const kPool = Array.from({ length: 26 }, () => []);
    const oPool = Array.from({ length: 26 }, () => []);
    for (let i = 0; i < N; i++) (known.has(i) ? kPool : oPool)[qs[i].charCodeAt(0) - A0].push(i);
    kPool.forEach((l) => shuffle(l, R));
    oPool.forEach((l) => shuffle(l, R));
    const answers = chosen.map(({ w, cat }) => ({
      w: w.toUpperCase(), cat,
      c: [...w].map((ch) => (cat ? kPool : oPool)[ch.charCodeAt(0) - A0].pop()),
    }));
    const spineAns = answers.slice(0, spine.length);
    const rest = shuffle(answers.slice(spine.length), R);
    const a = [...spineAns, ...rest];

    const board = {
      date, author, title, q, sunday,
      spine: spine.length,
      closed: closedWs.length,
      forced: f,
      a, seed, attempt,
    };
    const problems = selfCheck(board);
    if (problems.length) throw new Error(`${date}: generator built a bad board: ${problems.join('; ')}`);
    return board;
  }
  throw new Error(`${date} (${author}): no board in budget (${JSON.stringify(why)}) ${opts.debug || opts.hist ? [...HIST].sort((x, y) => y[1] - x[1]).slice(0, 15).map((x) => x.join('x')).join(' ') : ''}; try another seed or passage`);
}

// The verifier's per-board rules, re-run on the finished board.
function selfCheck(b) {
  const out = [];
  const qs = letters(b.q);
  const seen = new Array(qs.length).fill(0);
  for (const a of b.a) {
    if (a.c.length !== a.w.length) out.push(`${a.w} cell count`);
    a.c.forEach((cell, i) => { seen[cell]++; if (qs[cell] !== a.w[i].toLowerCase()) out.push(`${a.w}[${i}] mismatch`); });
    if (a.cat) {
      const k = CLOSED[a.cat].split(' ').filter((x) => x.length === a.w.length);
      if (!k.includes(a.w.toLowerCase()) || k.length > CAND_CAP) out.push(`${a.w} category`);
    }
    if (isBrit(a.w.toLowerCase())) out.push(`${a.w} British`);
  }
  if (seen.some((x) => x !== 1)) out.push('partition');
  if (b.a.slice(0, b.spine).map((a) => a.w[0]).join('') !== b.author.replace(/[^A-Z]/g, '')) out.push('spine');
  if (new Set(b.a.map((a) => a.w)).size !== b.a.length) out.push('repeat');
  const known = new Set(b.a.filter((a) => a.cat).flatMap((a) => a.c));
  if (forcedOf(passageWords(b.q), known) !== b.forced) out.push('forced');
  return out;
}

// ---- output --------------------------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function render(b, num) {
  const [y, m, d] = b.date.split('-').map(Number);
  const lines = [
    '  {',
    `    num: ${num},`,
    `    quizId: "anon-${m}-${d}-${String(y).slice(2)}",`,
    `    live: "${b.date}",`,
    `    dateLabel: "${MONTHS[m - 1]} ${d}, ${y}",`,
    `    sunday: ${b.sunday},`,
    `    author: ${JSON.stringify(b.author)}, title: ${JSON.stringify(b.title)}, spine: ${b.spine},`,
    `    closed: ${b.closed}, forced: ${b.forced},`,
    `    q: ${JSON.stringify(b.q)},`,
    '    a: [',
    ...b.a.map((a) => `      { w: "${a.w}", cat: ${a.cat ? JSON.stringify(a.cat) : 'null'}, c: [${a.c.join(', ')}] },`),
    '    ],',
    '  },',
  ];
  return lines.join('\n');
}

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const inPath = arg('--in');
if (!inPath) { console.error('usage: gen-anon.mjs --in boards.json [--out file.js] [--append]'); process.exit(2); }
const specs = JSON.parse(readFileSync(inPath, 'utf8'));
const lastDate = PUZZLES[PUZZLES.length - 1].live;
let num = PUZZLES[PUZZLES.length - 1].num;
const out = [];
// --append writes each board to the bank as soon as it is built, so a long
// run can be resumed: specs dated on or before the bank's last board are
// skipped (and must already be banked with the same passage), and the next
// run reads every appended board's answers into the usage counts.
const appendOne = (text) => {
  const src = readFileSync(BANK, 'utf8');
  const close = src.lastIndexOf('];');
  const prefix = src.slice(0, close);
  const next = prefix + text + src.slice(close);
  if (next.slice(0, close) !== prefix) throw new Error('prefix drifted');
  writeFileSync(BANK, next);
};
// --replace DATE[,DATE...] re-seeds banks of boards already in the file, in
// place: same passage, same num, the rest of the file untouched. Usage counts
// leave the replaced board's own answers out, so it may reuse them.
const replaceDates = new Set((arg('--replace') || '').split(',').filter(Boolean));
for (const spec of specs) {
  if (replaceDates.has(spec.date)) {
    const have = PUZZLES.find((p) => p.live === spec.date);
    if (!have || have.q !== spec.q) throw new Error(`${spec.date}: --replace needs the banked board with the same passage`);
    for (const a of have.a) wordUse.set(a.w.toLowerCase(), wordUse.get(a.w.toLowerCase()) - 1);
    const flags = { debug: args.includes('--debug'), hist: args.includes('--hist') };
    const seed0 = (spec.seed ?? hashStr(spec.date + spec.author + spec.title)) + 1000;
    let b = null;
    outerR: for (const pass of [{ attempts: 600 }, { attempts: 600, closedFirst: true }]) {
      for (let k = 0; k < 3; k++) {
        try { b = build({ ...spec, seed: seed0 + k }, wordUse, { ...flags, ...pass }); break outerR; } catch (e) { /* next */ }
      }
    }
    if (!b) throw new Error(`${spec.date}: no replacement board`);
    for (const a of b.a) wordUse.set(a.w.toLowerCase(), (wordUse.get(a.w.toLowerCase()) || 0) + 1);
    const text = readFileSync(BANK, 'utf8');
    const head = `  {\n    num: ${have.num},\n`;
    const i = text.indexOf(head);
    const j = text.indexOf('\n  },\n', i) + '\n  },\n'.length;
    if (i < 0 || j <= i) throw new Error(`${spec.date}: board #${have.num} not found in the file`);
    writeFileSync(BANK, text.slice(0, i) + render(b, have.num) + '\n' + text.slice(j));
    const words = passageWords(b.q).length;
    console.error(`#${have.num} ${b.date} REPLACED ${b.author.padEnd(11)} answers ${b.a.length} closed ${b.closed} forced ${b.forced}/${words} = ${Math.round(100 * b.forced / words)}% (seed ${b.seed})`);
    console.error('   open: ' + b.a.filter((a) => !a.cat).map((a) => a.w).join(' '));
    continue;
  }
  if (spec.date <= lastDate) {
    const have = PUZZLES.find((p) => p.live === spec.date);
    if (!have || have.q !== spec.q) throw new Error(`${spec.date} is not after the bank's last date ${lastDate}, and the banked board differs`);
    console.error(`   ${spec.date} already banked, skipped`);
    continue;
  }
  if (PUZZLES.some((p) => p.q === spec.q)) throw new Error(`${spec.date}: passage already banked`);
  const au = (authorUse.get(spec.author) || 0) + 1;
  if (au > AUTHOR_CAP) throw new Error(`${spec.date}: ${spec.author} would be used ${au} times, cap ${AUTHOR_CAP}`);
  authorUse.set(spec.author, au);
  // Clued vocabulary first; a passage whose letters it cannot cover (a pile of
  // h, w, f and y, say) falls back to the whole common list, and every open
  // answer drawn from outside the clued banks is flagged in the log for a
  // human read before the board ships.
  const flags = { debug: args.includes('--debug'), hist: args.includes('--hist'), closedFirst: args.includes('--closed-first') || undefined };
  // Each pass tries the board's own seed and two neighbours before moving on:
  // clued vocabulary, then closed-first, then the wide common list.
  let b = null;
  const seed0 = spec.seed ?? hashStr(spec.date + spec.author + spec.title);
  const passes = [{ attempts: 600 }, { attempts: 600, closedFirst: true }];
  outer: for (const pass of passes) {
    for (let k = 0; k < 3; k++) {
      try { b = build({ ...spec, seed: seed0 + k }, wordUse, { ...flags, ...pass }); break outer; } catch (e) { /* next */ }
    }
  }
  if (!b) {
    console.error(`   ${spec.date}: clued vocabulary ran out, widening to the common list`);
    b = build({ ...spec, seed: seed0 }, wordUse, { ...flags, wide: true, closedFirst: true });
  }
  for (const a of b.a) wordUse.set(a.w.toLowerCase(), (wordUse.get(a.w.toLowerCase()) || 0) + 1);
  num += 1;
  const one = render(b, num) + '\n';
  out.push(one);
  if (args.includes('--append')) appendOne(one);
  const words = passageWords(b.q).length;
  console.error(`#${num} ${b.date} ${b.sunday ? 'SUN' : '   '} ${b.author.padEnd(11)} answers ${b.a.length} closed ${b.closed} forced ${b.forced}/${words} = ${Math.round(100 * b.forced / words)}% (seed ${b.seed}, attempt ${b.attempt})`);
  console.error('   open: ' + b.a.filter((a) => !a.cat).map((a) => (CLUED.has(a.w.toLowerCase()) ? a.w : `${a.w}(UNCLUED)`)).join(' '));
}
const text = out.join('');
if (arg('--out')) writeFileSync(arg('--out'), text);
if (!arg('--out') && !args.includes('--append')) process.stdout.write(text);
