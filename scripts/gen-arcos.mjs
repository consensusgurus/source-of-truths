#!/usr/bin/env node
// Generator for Arcos, the daily set of acrostics. Writes app/arcos/puzzles.js.
//
//   node scripts/gen-arcos.mjs --until 2026-11-30           append days, keep every board
//   node scripts/gen-arcos.mjs --rebuild --until <date>     only before launch
//
// A day is three acrostics and a finale:
//   front     the FIRST letters of the answers spell a hidden word
//   back      the LAST letters spell a hidden word
//   diag      letter N of row N spells a hidden word (every row one length)
//   finale    one word that pairs with all three hidden words (FLASH, SPOT,
//             MOON + LIGHT), from scripts/hinge-pairs.txt
//
// Clues are NEVER invented: every answer comes from the hand-written clue banks
// scripts/emcee-wordbank.txt and scripts/encore-wordbank.txt (the Emcee and
// Encore rule, the clue comes first). Deterministic from the date.
//
// Rules (checked again, independently, by scripts/verify-arcos.mjs):
//  - the finale has at least three partners on its side; the three hidden
//    words are partners; NO other word pairs with all three (either side)
//  - hidden words: Mon-Wed 4 letters; Thu-Sat 4 or 5 with at least one 5;
//    Sunday Edition 5 or 6
//  - answers: front/back Mon 4-5, Tue-Sat 4-6, Sunday 5-7; diag rows are all
//    one length, the hidden word's length plus one
//  - a clue never contains its answer; an answer never contains or sits inside
//    a hidden word or the finale; nothing repeats inside a day
//  - no answer, hidden word or finale ever repeats in the bank
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const OUT = path.join(ROOT, 'app/arcos/puzzles.js');
const LAUNCH = '2026-10-18';

const args = process.argv.slice(2);
const argv = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const UNTIL = argv('--until') || '2026-11-30';
const REBUILD = args.includes('--rebuild');

// ---- word data ----
const FREQ = JSON.parse(readFileSync(path.join(HERE, '.lode-freq.json'), 'utf8'));
const zipf = (w) => FREQ[w.toLowerCase()] || 0;

const CLUES = new Map();
for (const f of ['emcee-wordbank.txt', 'encore-wordbank.txt']) {
  for (const line of readFileSync(path.join(HERE, f), 'utf8').split('\n')) {
    const i = line.indexOf('|');
    if (i < 0) continue;
    const w = line.slice(0, i).trim().toUpperCase();
    const c = line.slice(i + 1).trim();
    if (!/^[A-Z]{3,8}$/.test(w) || !c || CLUES.has(w)) continue;
    if (/[—–]|--/.test(c) || c.length > 48) continue;
    const lc = c.toLowerCase();
    if (lc.includes(w.toLowerCase())) continue;
    if (lc.includes(w.toLowerCase().slice(0, Math.max(4, w.length - 2)))) continue;
    CLUES.set(w, c);
  }
}
const POOL = [...CLUES.keys()].filter((w) => zipf(w) >= 3.0);

const PAIRS = readFileSync(path.join(HERE, 'hinge-pairs.txt'), 'utf8').split('\n')
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/));
const PRE = new Map(); const POST = new Map(); // PRE.get(F) = words W with "F W"; POST.get(F) = words W with "W F"
for (const [a, b] of PAIRS) {
  if (!PRE.has(a)) PRE.set(a, new Set()); PRE.get(a).add(b);
  if (!POST.has(b)) POST.set(b, new Set()); POST.get(b).add(a);
}
function partners(f, side) { return side === 'post' ? (POST.get(f) || new Set()) : (PRE.get(f) || new Set()); }
// every word (either side) that pairs with all of hs
function sharers(hs) {
  const out = [];
  for (const side of ['post', 'pre']) {
    const M = side === 'post' ? POST : PRE;
    for (const [f, set] of M) if (hs.every((h) => set.has(h))) out.push(f + ':' + side);
  }
  return out;
}

// ---- dates and rng ----
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function dow(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }
function quizIdOf(iso) { const [y, m, d] = iso.split('-').map(Number); return `arcos-${m}-${d}-${String(y).slice(2)}`; }
function labelOf(iso) { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; }
function rngFor(seed) {
  let h = 2166136261 >>> 0;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function specFor(iso) {
  const d = dow(iso);
  if (d === 0) return { sunday: true, hid: [5, 6], need: 5, len: [5, 7], zmin: 3.0 };
  if (d === 1) return { hid: [4, 4], len: [4, 5], zmin: 3.6 };
  if (d === 2 || d === 3) return { hid: [4, 4], len: [4, 6], zmin: 3.3 };
  return { hid: [4, 5], need: 5, len: [4, 6], zmin: 3.1 };
}

// ---- building ----
function clash(ans, words) {
  for (const w of words) if (ans === w || ans.includes(w) || w.includes(ans)) return true;
  return false;
}
const toks = (c) => c.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
function clueHits(c, words) { const t = toks(c); return words.some((w) => t.some((x) => x === w || x === w + 'S' || x + 'S' === w)); }
function pickRows(kind, word, spec, rnd, used, dayWords, taken) {
  const n = word.length;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const ch = word[i];
    let cands;
    if (kind === 'diag') {
      cands = POOL.filter((w) => w.length === n + 1 && w[i] === ch);
    } else {
      const [lo, hi] = spec.len;
      cands = POOL.filter((w) => w.length >= lo && w.length <= hi && (kind === 'front' ? w[0] === ch : w[w.length - 1] === ch));
    }
    const takenClues = [...taken].map((t) => CLUES.get(t));
    cands = cands.filter((w) => zipf(w) >= spec.zmin && !used.has(w) && !taken.has(w) && !clash(w, dayWords)
      && !clueHits(CLUES.get(w), [...dayWords, ...taken]) && !takenClues.some((c) => clueHits(c, [w])));
    if (!cands.length) return null;
    // favour common words, a little randomness
    cands.sort((a, b) => zipf(b) - zipf(a));
    const top = cands.slice(0, Math.max(8, Math.ceil(cands.length * 0.35)));
    const w = top[Math.floor(rnd() * top.length)];
    taken.add(w);
    rows.push({ a: w, c: CLUES.get(w) });
  }
  return rows;
}

function buildDay(iso, used) {
  const spec = specFor(iso);
  const rnd = rngFor('arcos:' + iso);
  const finales = [];
  for (const side of ['post', 'pre']) {
    const M = side === 'post' ? POST : PRE;
    for (const [f, set] of M) {
      if (used.has('F:' + f)) continue;
      const ok = [...set].filter((h) => h.length >= spec.hid[0] && h.length <= spec.hid[1] && !used.has('H:' + h) && h !== f);
      if (ok.length >= 3 && f.length >= 3 && f.length <= 6) finales.push({ f, side, ok });
    }
  }
  for (const fin of shuffle(finales, rnd)) {
    const set = partners(fin.f, fin.side);
    if (set.size < 3) continue;
    for (let tries = 0; tries < 40; tries++) {
      const hs = shuffle(fin.ok, rnd).slice(0, 3);
      if (hs.length < 3) break;
      if (spec.need && !hs.some((h) => h.length >= spec.need)) continue;
      if (new Set(hs).size < 3) continue;
      if (hs.some((a) => hs.some((b) => a !== b && (a.includes(b))))) continue;
      const sh = sharers(hs);
      if (sh.length !== 1 || sh[0] !== fin.f + ':' + fin.side) continue;
      const dayWords = [...hs, fin.f];
      // assign kinds: try orders, back needs good ending letters
      for (const order of shuffle([[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]], rnd)) {
        const taken = new Set();
        const kinds = ['front', 'back', 'diag'];
        const rounds = [];
        let ok = true;
        for (let k = 0; k < 3; k++) {
          const word = hs[order[k]];
          const rows = pickRows(kinds[k], word, spec, rnd, used, dayWords, taken);
          if (!rows) { ok = false; break; }
          rounds.push({ kind: kinds[k], word, rows });
        }
        if (!ok) continue;
        return { finale: fin.f, side: fin.side, rounds, sunday: !!spec.sunday };
      }
    }
  }
  throw new Error('no day for ' + iso);
}

function usedFrom(days) {
  const used = new Set();
  for (const p of days) {
    used.add('F:' + p.finale);
    for (const r of p.rounds) { used.add('H:' + r.word); for (const row of r.rows) used.add(row.a); }
  }
  return used;
}

function serialize(days) {
  const head = `// Puzzle data for Arcos, the daily set of acrostics. Imported ONLY by the
// server page (app/arcos/page.js), which filters live<=today before handing
// puzzles to the client, so future boards never reach a browser.
//
// GENERATED by scripts/gen-arcos.mjs from the Emcee and Encore clue banks and
// scripts/hinge-pairs.txt. Do not edit by hand: extend with
// \`node scripts/gen-arcos.mjs --until <date>\`, which keeps every board already
// here byte for byte. Check with scripts/verify-arcos.mjs.
//
//   rounds[]   three acrostics, always in this order:
//     front    the FIRST letters of the answers spell \`word\`
//     back     the LAST letters spell \`word\`
//     diag     letter N of row N spells \`word\`; every row is word.length+1 long
//   rows[].a   the answer; rows[].c its clue, from the clue banks
//   finale     one word that goes with all three hidden words
//   side       'post': hidden word + finale (FLASH + LIGHT); 'pre': finale + hidden word
//   sunday     the Sunday Edition: five- and six-letter hidden words, longer answers
export const PUZZLES = [
`;
  return head + days.map((p) => '  ' + JSON.stringify(p)).join(',\n') + ',\n];\n';
}

async function main() {
  let days = [];
  if (!REBUILD) {
    try { days = (await import(OUT + '?t=' + Date.now())).PUZZLES.map((p) => ({ ...p })); } catch (e) { days = []; }
  }
  const used = usedFrom(days);
  let iso = days.length ? addDays(days[days.length - 1].live, 1) : LAUNCH;
  let num = days.length ? days[days.length - 1].num + 1 : 1;
  while (iso <= UNTIL) {
    const d = buildDay(iso, used);
    const p = { num, quizId: quizIdOf(iso), live: iso, dateLabel: labelOf(iso) };
    if (d.sunday) p.sunday = true;
    p.finale = d.finale; p.side = d.side; p.rounds = d.rounds;
    days.push(p);
    for (const k of usedFrom([p])) used.add(k);
    iso = addDays(iso, 1); num++;
  }
  writeFileSync(OUT, serialize(days));
  console.log(`arcos: ${days.length} boards, ${days[0].live} to ${days[days.length - 1].live}`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
