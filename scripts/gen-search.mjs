// scripts/gen-search.mjs: builds one Search board (the enormous daily word
// search) from a topic list and appends it to app/search/puzzles.js.
//
//   node scripts/gen-search.mjs <list.json> --theme "Actors" --noun "names" [--seed 7] [--replace N]
//
// <list.json> is an array of { t: 'Shown title', y?: 1994 } in the order to
// keep (best known first). Entries are folded to letters (lib/search.js), and
// any entry that is a palindrome, shorter than 4 or longer than 24 letters,
// a duplicate, or inside another entry (or its reverse) is dropped, keeping
// the earlier one. The rest are written into a square grid with as much
// crossing as fits, the gaps are filled with letters, and the board is
// repaired until every entry occurs exactly once in all eight directions.
// Appends the next board to app/search/boards.js. --replace N rebuilds board N,
// and only a board that cannot have opened yet (each board runs at least 24
// hours, so board N opens no sooner than N - 1 days after launch).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchLetters, searchLines, searchCount, SEARCH_DIRS, SEARCH_LAUNCH, SEARCH_MIN_MS } from '../lib/search.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const BANK = path.join(here, '..', 'app', 'search', 'boards.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const listFile = args[0];
const theme = opt('--theme');
const noun = opt('--noun', 'entries');
const maxN = Number(opt('--max', '700'));
let seed = Number(opt('--seed', '1'));
if (!listFile || !theme) {
  console.error('usage: node scripts/gen-search.mjs <list.json> --theme "Movies" --noun titles [--replace N]');
  process.exit(1);
}

function rng(s) {
  let x = s >>> 0;
  return () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---- the list -------------------------------------------------------------
const raw = JSON.parse(fs.readFileSync(listFile, 'utf8'));
const items = [];
const seen = new Set();
for (const e of raw) {
  const w = searchLetters(e.t);
  if (w.length < 4 || w.length > 24) continue;
  const rw = w.split('').reverse().join('');
  if (w === rw || seen.has(w)) continue;
  if (items.some((k) => k.w.includes(w) || k.w.includes(rw) || w.includes(k.w) || rw.includes(k.w))) continue;
  seen.add(w);
  const it = { t: String(e.t).trim(), w };
  if (e.y) it.y = e.y;
  items.push(it);
  if (items.length >= maxN) break;
}

// ---- the grid ---------------------------------------------------------------
// English-ish letter weights for the filler, so the gaps look like text.
const FREQ = 'EEEEEEEEEEEETTTTTTTTTAAAAAAAAOOOOOOOIIIIIIINNNNNNNSSSSSSHHHHHHRRRRRRDDDDLLLLCCCUUUMMMWWFFGGYYPPBVKJXQZ';

function build(n, rand) {
  const g = Array.from({ length: n }, () => new Array(n).fill(''));
  const used = Array.from({ length: n }, () => new Array(n).fill(false));
  const order = items.map((it, i) => i).sort((a, b) => items[b].w.length - items[a].w.length || a - b);
  const at = new Array(items.length);
  for (const i of order) {
    const w = items[i].w, L = w.length;
    let best = null, bestScore = -1;
    for (let t = 0; t < 260; t++) {
      const [dr, dc] = SEARCH_DIRS[Math.floor(rand() * 8)];
      const r0 = Math.floor(rand() * n), c0 = Math.floor(rand() * n);
      const r1 = r0 + dr * (L - 1), c1 = c0 + dc * (L - 1);
      if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
      let ov = 0, ok = true;
      for (let k = 0; k < L; k++) {
        const ch = g[r0 + dr * k][c0 + dc * k];
        if (ch === '') continue;
        if (ch !== w[k]) { ok = false; break; }
        ov++;
      }
      if (!ok || ov === L) continue;
      const sc = ov * 10 + rand();
      if (sc > bestScore) { bestScore = sc; best = [r0, c0, dr, dc]; }
    }
    if (!best) {
      // Crowded late in the fill: try every square and direction before giving up.
      for (let r0 = 0; r0 < n && !best; r0++) for (let c0 = 0; c0 < n; c0++) {
        for (const [dr, dc] of SEARCH_DIRS) {
          const r1 = r0 + dr * (L - 1), c1 = c0 + dc * (L - 1);
          if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
          let ok = true, ov = 0;
          for (let k = 0; k < L; k++) { const ch = g[r0 + dr * k][c0 + dc * k]; if (ch === '') continue; if (ch !== w[k]) { ok = false; break; } ov++; }
          if (ok && ov < L) { best = [r0, c0, dr, dc]; break; }
        }
        if (best) break;
      }
    }
    if (!best) return null;
    const [r0, c0, dr, dc] = best;
    for (let k = 0; k < L; k++) { g[r0 + dr * k][c0 + dc * k] = w[k]; used[r0 + dr * k][c0 + dc * k] = true; }
    at[i] = best;
  }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) g[r][c] = FREQ[Math.floor(rand() * FREQ.length)];
  return { g, used, at };
}

// Every occurrence of w (either way round) as [r, c, dr, dc].
function occurrences(g, w) {
  const n = g.length, out = [];
  const rw = w.split('').reverse().join('');
  for (const s of rw === w ? [w] : [w, rw]) {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (g[r][c] !== s[0]) continue;
      for (const [dr, dc] of SEARCH_DIRS) {
        const er = r + dr * (s.length - 1), ec = c + dc * (s.length - 1);
        if (er < 0 || ec < 0 || er >= n || ec >= n) continue;
        let ok = true;
        for (let k = 1; k < s.length; k++) if (g[r + dr * k][c + dc * k] !== s[k]) { ok = false; break; }
        if (ok) out.push([r, c, dr, dc, s.length]);
      }
    }
  }
  return out;
}

const letters = items.reduce((a, it) => a + it.w.length, 0);
let n = Math.ceil(Math.sqrt(letters / 0.78));
let board = null;
for (let attempt = 0; attempt < 40 && !board; attempt++) {
  const rand = rng(seed * 7919 + attempt);
  const b = build(n, rand);
  if (!b) { if (process.env.SEARCH_DEBUG) console.error("place fail n=" + n); if (attempt % 3 === 2) n++; continue; }
  // Repair: an entry the filler spelled a second time loses a filler letter.
  let clean = false;
  for (let pass = 0; pass < 60; pass++) {
    const rows = b.g.map((row) => row.join(''));
    const lines = searchLines(rows);
    const bad = items.map((it, i) => i).filter((i) => searchCount(lines, items[i].w) !== 1);
    if (!bad.length) { clean = true; break; }
    for (const i of bad) {
      const [pr, pc, pdr, pdc] = b.at[i];
      for (const [r, c, dr, dc, L] of occurrences(b.g, items[i].w)) {
        const same = (r === pr && c === pc && dr === pdr && dc === pdc)
          || (r === pr + pdr * (L - 1) && c === pc + pdc * (L - 1) && dr === -pdr && dc === -pdc);
        if (same) continue;
        const free = [];
        for (let k = 0; k < L; k++) if (!b.used[r + dr * k][c + dc * k]) free.push([r + dr * k, c + dc * k]);
        if (!free.length) continue; // made only of placed letters: a rebuild fixes it
        const [fr, fc] = free[Math.floor(rand() * free.length)];
        b.g[fr][fc] = FREQ[Math.floor(rand() * FREQ.length)];
      }
    }
  }
  if (clean) board = b; else if (process.env.SEARCH_DEBUG) console.error("repair fail n=" + n);
}
if (!board) { console.error('could not build a clean board; try another --seed'); process.exit(1); }

const grid = board.g.map((row) => row.join(''));

// ---- append ---------------------------------------------------------------
const src = fs.readFileSync(BANK, 'utf8');
const m = src.match(/export const BOARDS = (\[[\s\S]*\]);\s*$/);
if (!m) { console.error('bank shape not recognised'); process.exit(1); }
const bank = JSON.parse(m[1]);
const rep = Number(opt('--replace', '0'));
let num;
if (rep) {
  if (!bank.find((b) => b.num === rep)) { console.error(`no board ${rep}`); process.exit(1); }
  if (Date.now() >= SEARCH_LAUNCH + (rep - 1) * SEARCH_MIN_MS) { console.error(`board ${rep} may have opened; a board that may be live is never rewritten`); process.exit(1); }
  num = rep;
} else num = bank.length + 1;
const entry = { num, key: `search-b${num}`, theme, noun, size: grid.length, grid, items };
if (rep) bank[rep - 1] = entry; else bank.push(entry);
const head = src.slice(0, m.index);
fs.writeFileSync(BANK, head + 'export const BOARDS = [\n' + bank.map((b) => '  ' + JSON.stringify(b)).join(',\n') + '\n];\n');
console.log(`gen-search: board ${num} ${theme}: ${items.length} ${noun}, ${grid.length}x${grid.length}, ${letters} letters (${Math.round((letters / grid.length ** 2) * 100)}% before crossings)`);
