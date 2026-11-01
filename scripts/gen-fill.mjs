// scripts/gen-fill.mjs: deals Fill's bank into app/fill/puzzles.js.
//
//   node scripts/gen-fill.mjs                     # 2026-11-01 .. --until
//   node scripts/gen-fill.mjs --until 2027-03-31  # EXTEND: rows already in the
//                                                 # bank are kept byte for byte
//
// Fill is the daily fill-in (criss-cross): an empty crossword-shaped grid, a list
// of words from one theme, and every word has to go in. The only clues are the
// lengths and the crossings. The vocabulary is Scram's (scripts/scram-pools.mjs),
// the same pool Scour deals from, so a theme is only as deep as that pool.
//
// THE RAMP (owner, 2026-11-01: "bigger / harder even on easy days"), in words
// placed on a board of at most size x size:
//   Mon, Tue 16   Wed, Thu 17   Fri, Sat 18, all on a board of at most 15x15
//   Sun 22 on a board of at most 17x17, the Sunday Edition
// Lengths run 4 to 11 letters, and the word list is printed in alphabetical
// order inside each length, so lengths are the only way in.
//
// Rules (re-checked by scripts/verify-fill.mjs):
//   1. every word crosses at least one other, and no two letters touch unless
//      they belong to a word that runs through both (no stray two-letter runs)
//   2. the board has EXACTLY ONE fill given the starting letters (`given`):
//      one whole word is printed to start, plus any single letters the
//      uniqueness proof needed (at most three)
//   3. no word comes back inside 30 days; the theme waits at least 3 days, and
//      never matches that day's Scour or Scram theme
//   4. slots are [r, c, dir ('a' across, 'd' down), length] in reading order, never
//      paired with the words; words are the list
//      as printed (a space marks two words; the grid carries the letters without it)
//
// Deterministic: same pools, same seed, same bank.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { THEMES } from './scram-pools.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app', 'fill', 'puzzles.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const START = '2026-11-01';
const UNTIL = opt('--until', '2027-01-31');
export const SPEC = { 1: [16, 15], 2: [16, 15], 3: [17, 15], 4: [17, 15], 5: [18, 15], 6: [18, 15], 0: [22, 17] };
export const WORD_GAP = 30, THEME_GAP = 3;
const MIN_LEN = 4, MAX_LEN = 11;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function days(from, to) { const o = []; for (let t = Date.parse(from + 'T12:00:00Z'); t <= Date.parse(to + 'T12:00:00Z'); t += 86400000) o.push(new Date(t).toISOString().slice(0, 10)); return o; }
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const qid = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `fill-${m}-${d}-${String(y).slice(2)}`; };
const dayDiff = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const norm = (w) => w.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
const letters = (w) => w.replace(/ /g, '');

// ---- the solver: count fills of `slots` with `words` agreeing with `given` ----
export function countFill({ rows, cols, slots, words, given }, cap = 2) {
  const L = words.map(letters);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const [r, c, ch] of given) grid[r][c] = ch;
  const used = new Array(L.length).fill(false);
  const cellsOf = slots.map(([r, c, d, n]) => Array.from({ length: n }, (_, i) => (d === 'a' ? [r, c + i] : [r + i, c])));
  const filled = new Array(slots.length).fill(false);
  const sols = [];
  function cands(s) {
    const cs = cellsOf[s], out = [];
    const seen = new Set();
    for (let w = 0; w < L.length; w++) {
      if (used[w] || L[w].length !== cs.length || seen.has(L[w])) continue;
      let ok = true;
      for (let i = 0; i < cs.length; i++) { const g = grid[cs[i][0]][cs[i][1]]; if (g && g !== L[w][i]) { ok = false; break; } }
      if (ok) { out.push(w); seen.add(L[w]); }
    }
    return out;
  }
  function rec() {
    if (sols.length >= cap) return;
    let best = -1, bc = null;
    for (let s = 0; s < slots.length; s++) {
      if (filled[s]) continue;
      const c = cands(s);
      if (!c.length) return;
      if (!bc || c.length < bc.length) { best = s; bc = c; if (c.length === 1) break; }
    }
    if (best < 0) { sols.push(grid.map((row) => row.slice())); return; }
    const cs = cellsOf[best];
    for (const w of bc) {
      const prev = cs.map(([r, c]) => grid[r][c]);
      cs.forEach(([r, c], i) => { grid[r][c] = L[w][i]; });
      used[w] = true; filled[best] = true;
      rec();
      used[w] = false; filled[best] = false;
      cs.forEach(([r, c], i) => { grid[r][c] = prev[i]; });
      if (sols.length >= cap) return;
    }
  }
  rec();
  return sols;
}

// ---- laying the words ------------------------------------------------------
function layWords(pool, want, size, r) {
  const G = Array.from({ length: size }, () => Array(size).fill(null));
  const dirAt = Array.from({ length: size }, () => Array(size).fill('')); // which directions run through
  const placed = [];
  const at = (rr, cc) => (rr >= 0 && cc >= 0 && rr < size && cc < size ? G[rr][cc] : null);
  function fits(w, rr, cc, d) {
    const dr = d === 'd' ? 1 : 0, dc = d === 'a' ? 1 : 0, n = w.length;
    const er = rr + dr * (n - 1), ec = cc + dc * (n - 1);
    if (rr < 0 || cc < 0 || er >= size || ec >= size) return -1;
    if (at(rr - dr, cc - dc) || at(er + dr, ec + dc)) return -1;
    let cross = 0;
    for (let i = 0; i < n; i++) {
      const y = rr + dr * i, x = cc + dc * i, g = G[y][x];
      if (g) {
        if (g !== w[i] || dirAt[y][x].includes(d)) return -1;
        cross++;
      } else if (d === 'a' ? (at(y - 1, x) || at(y + 1, x)) : (at(y, x - 1) || at(y, x + 1))) return -1;
    }
    return cross;
  }
  function put(word, rr, cc, d) {
    const w = letters(word), dr = d === 'd' ? 1 : 0, dc = d === 'a' ? 1 : 0;
    for (let i = 0; i < w.length; i++) { G[rr + dr * i][cc + dc * i] = w[i]; dirAt[rr + dr * i][cc + dc * i] += d; }
    placed.push({ word, r: rr, c: cc, d, n: w.length });
  }
  const first = pool[0];
  put(first, Math.floor(size / 2), Math.floor((size - letters(first).length) / 2), 'a');
  // Several passes over the pool: a word with nowhere to cross early often has
  // somewhere once more words are down. Among the legal spots, more crossings
  // win, with noise so the board does not clump around its first word.
  const left = pool.slice(1);
  for (let pass = 0; pass < 4 && placed.length < want; pass++) {
    for (let k = 0; k < left.length && placed.length < want; k++) {
      const word = left[k];
      if (!word) continue;
      const w = letters(word);
      const opts = [];
      for (const d of ['a', 'd']) for (let rr = 0; rr < size; rr++) for (let cc = 0; cc < size; cc++) {
        const x = fits(w, rr, cc, d);
        if (x > 0) opts.push([x + r() * 1.6, rr, cc, d]);
      }
      if (!opts.length) continue;
      opts.sort((a, b) => b[0] - a[0]);
      const [, rr, cc, d] = opts[0];
      put(word, rr, cc, d);
      left[k] = null;
    }
  }
  return placed.length >= want ? placed : null;
}

export function makeBoard(themeWords, want, size, r) {
  for (let tries = 0; tries < 600; tries++) {
    const pool = shuffle(themeWords.slice(), r);
    pool.sort((a, b) => letters(b).length - letters(a).length + (r() - 0.5) * 6);
    const placed = layWords(pool, want, size, r);
    if (!placed) continue;
    // trim to the bounding box
    let r0 = 99, c0 = 99, r1 = -1, c1 = -1;
    for (const p of placed) {
      const er = p.r + (p.d === 'd' ? p.n - 1 : 0), ec = p.c + (p.d === 'a' ? p.n - 1 : 0);
      r0 = Math.min(r0, p.r); c0 = Math.min(c0, p.c); r1 = Math.max(r1, er); c1 = Math.max(c1, ec);
    }
    const rows = r1 - r0 + 1, cols = c1 - c0 + 1;
    const ps = placed.map((p) => ({ ...p, r: p.r - r0, c: p.c - c0 }));
    const slots = ps.map((p) => [p.r, p.c, p.d, p.n]);
    const words = ps.map((p) => p.word);
    const sol = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (const p of ps) for (let i = 0; i < p.n; i++) sol[p.r + (p.d === 'd' ? i : 0)][p.c + (p.d === 'a' ? i : 0)] = letters(p.word)[i];
    // the starter: a word whose length is shared by as many others as possible
    const lenCount = {}; for (const p of ps) lenCount[p.n] = (lenCount[p.n] || 0) + 1;
    const starter = ps.slice().sort((a, b) => lenCount[b.n] - lenCount[a.n] || b.n - a.n)[0];
    const given = [];
    for (let i = 0; i < starter.n; i++) { const y = starter.r + (starter.d === 'd' ? i : 0), x = starter.c + (starter.d === 'a' ? i : 0); given.push([y, x, sol[y][x]]); }
    let extra = 0, ok = false;
    for (;;) {
      const sols = countFill({ rows, cols, slots, words, given }, 2);
      if (sols.length === 1) { ok = true; break; }
      if (sols.length === 0 || extra >= 3) break;
      // reveal one square where the two fills disagree
      const diff = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (sols[0][y][x] && sols[0][y][x] !== sols[1][y][x]) diff.push([y, x]);
      const [y, x] = diff[Math.floor(r() * diff.length)];
      given.push([y, x, sol[y][x]]); extra++;
    }
    if (!ok) continue;
    // Slots in reading order and words by length then alphabet: the two lists are
    // NOT paired, or the page source would hand over the answer.
    const slotsOut = slots.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : 1));
    const wordsOut = words.slice().sort((a, b) => letters(a).length - letters(b).length || a.localeCompare(b));
    return { rows, cols, slots: slotsOut, words: wordsOut, given, starter: starter.word, extra, tries };
  }
  return null;
}

if (process.argv[1] && process.argv[1].endsWith('gen-fill.mjs')) {
  const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('  {"num"')).map((l) => JSON.parse(l.trim().replace(/,$/, ''))) : []);
  const scour = read(path.join(ROOT, 'app', 'scour', 'puzzles.js'));
  const scramSrc = fs.existsSync(path.join(ROOT, 'app', 'scram', 'puzzles.js')) ? fs.readFileSync(path.join(ROOT, 'app', 'scram', 'puzzles.js'), 'utf8') : '';
  const scramTheme = {};
  for (const m of scramSrc.matchAll(/"live":"(\d{4}-\d\d-\d\d)"[^\n]*?"themeId":"([a-z]+)"/g)) scramTheme[m[1]] = m[2];
  const scourTheme = Object.fromEntries(scour.map((p) => [p.live, p.themeId]));
  const kept = read(OUT);
  const have = new Set(kept.map((p) => p.live));
  const rows = [...kept];
  const pools = Object.fromEntries(THEMES.map((t) => [t.id, [...new Set(t.words.trim().split(/\s+/).map(norm))].filter((w) => letters(w).length >= MIN_LEN && letters(w).length <= MAX_LEN && /^[A-Z ]+$/.test(w))]));
  for (const d of days(START, UNTIL)) {
    if (have.has(d)) continue;
    const num = rows.length + 1, [want, size] = SPEC[dow(d)];
    const r = rng(20261101 + num * 7919);
    const recent = rows.filter((p) => dayDiff(p.live, d) < WORD_GAP);
    const usedW = new Set(recent.flatMap((p) => p.words));
    const recentTheme = new Set(rows.filter((p) => dayDiff(p.live, d) < THEME_GAP).map((p) => p.themeId));
    const themes = shuffle(THEMES.filter((t) => !recentTheme.has(t.id) && t.id !== scourTheme[d] && t.id !== scramTheme[d]
      && pools[t.id].filter((w) => !usedW.has(w)).length >= want * 2.2), r);
    let b = null, th = null;
    for (const t of themes) {
      b = makeBoard(pools[t.id].filter((w) => !usedW.has(w)), want, size, r);
      if (b) { th = t; break; }
    }
    if (!b) throw new Error(`fill: no board for ${d}`);
    rows.push({ num, quizId: qid(d), live: d, dateLabel: label(d), ...(dow(d) === 0 ? { sunday: true } : {}), themeId: th.id, theme: th.label, rows: b.rows, cols: b.cols, slots: b.slots, words: b.words, given: b.given });
    process.stdout.write(`  #${num} ${d} ${th.id} ${b.words.length} words ${b.rows}x${b.cols}, ${b.given.length} given (+${b.extra}), ${b.tries} tries\n`);
  }
  const head = `// Puzzle data for Fill, the daily fill-in (criss-cross).
// GENERATED by scripts/gen-fill.mjs from scripts/scram-pools.mjs; do not edit by
// hand. Extend with \`node scripts/gen-fill.mjs --until <date>\`, which keeps every
// row here byte for byte. Checked by scripts/verify-fill.mjs. Imported only by the
// server page, which strips days not yet live.
//   theme      the day's theme, printed above the list
//   rows/cols  the grid
//   slots      [r, c, 'a'|'d', length], one per word, in reading order (NOT paired
//              with \`words\`, which would give the answer away)
//   words      the list as printed, by length then alphabetically. The fill is
//              UNIQUE given \`given\`, so the client checks a finished grid from
//              the list alone (every slot spells a list word, each used once)
//   given      [r, c, letter] squares printed at the start: one whole word, plus
//              any single letters the uniqueness proof needed (at most three)
//   sunday     the Sunday Edition, 22 words on a board up to 17x17
export const PUZZLES = [
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, head + rows.map((p) => '  ' + JSON.stringify(p) + ',').join('\n') + '\n];\n');
  console.log(`fill: ${rows.length} rows`);
}
