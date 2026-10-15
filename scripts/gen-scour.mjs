// scripts/gen-scour.mjs — deals Scour's bank into app/scour/puzzles.js.
//
//   node scripts/gen-scour.mjs                     # whole bank, 2026-10-15 .. --until
//   node scripts/gen-scour.mjs --until 2027-03-31  # EXTEND: boards already in the
//                                                  # bank are kept byte for byte
//
// Scour is the daily themed word search: one theme, a 15x15 grid every day
// (owner, 2026-10-15: "make even the normal day large"), an 18x18 Sunday
// Edition. The vocabulary is Scram's (scripts/scram-pools.mjs), so a theme is
// only as deep as Scram's pool for it. The rules it deals by, all re-checked
// independently by scripts/verify-scour.mjs:
//
//   1. THE RAMP IS DIRECTIONS, WORD COUNT AND DECOYS, by weekday:
//        Mon  14 words, across and down only, no decoys
//        Tue  15 words, + diagonal down, no decoys
//        Wed  16 words, + diagonal up, 2 decoys
//        Thu  16 words, + backwards across, 3 decoys
//        Fri  17 words, + up, 4 decoys
//        Sat  18 words, all eight directions, 6 decoys
//        Sun  26 words on an 18x18 board, all eight directions, 8 decoys
//      Every direction the board says it uses carries at least one word, so the
//      "Words run" line on the board never lies. A DECOY is the start of a list
//      word planted on its own (CAPET where CAPETOWN is the answer), the classic
//      way to make a search hard without making it unfair.
//   2. EVERY WORD IS IN THE GRID EXACTLY ONCE, counting all eight directions,
//      so any line a player drags that spells a list word IS that word, and the
//      client can check a find from the letters alone. No list word sits inside
//      another (or inside another's reverse).
//   3. NO WORD COMES BACK INSIDE 35 DAYS, a theme waits at least 4 days, and a
//      board never shares its theme with that day's Scram or a word with any
//      Scram board within three days of it.
//   4. THE FILLER IS SCREENED: no profanity or slur reads anywhere in the grid,
//      in any direction, except where it lies wholly inside a list word.
//
// Deterministic: same pools, same seed, same bank.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { THEMES } from './scram-pools.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app', 'scour', 'puzzles.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
export const START = '2026-10-15';
const UNTIL = opt('--until', '2026-12-31');
const SEED = Number(opt('--seed', '20261015'));
export const THEME_GAP = 4;
export const WORD_GAP = 35;
export const SCRAM_NEAR = 3;

export const DIRS = { E: [0, 1], W: [0, -1], S: [1, 0], N: [-1, 0], SE: [1, 1], NW: [-1, -1], NE: [-1, 1], SW: [1, -1] };
// Weekday spec. dow: 0 Sunday .. 6 Saturday.
export const SPEC = {
  1: { size: 15, words: 14, dirs: ['E', 'S'], decoys: 0, lens: [5, 11], overlap: 0, mix: 0 },
  2: { size: 15, words: 15, dirs: ['E', 'S', 'SE'], decoys: 0, lens: [5, 11], overlap: 1, mix: 0 },
  3: { size: 15, words: 16, dirs: ['E', 'S', 'SE', 'NE'], decoys: 2, lens: [5, 12], overlap: 2, mix: 0.5 },
  4: { size: 15, words: 16, dirs: ['E', 'S', 'SE', 'NE', 'W'], decoys: 3, lens: [5, 12], overlap: 3, mix: 0.55 },
  5: { size: 15, words: 17, dirs: ['E', 'S', 'SE', 'NE', 'W', 'N'], decoys: 4, lens: [5, 12], overlap: 4, mix: 0.6 },
  6: { size: 15, words: 18, dirs: ['E', 'S', 'SE', 'NE', 'W', 'N', 'NW', 'SW'], decoys: 6, lens: [5, 12], overlap: 5, mix: 0.65 },
  0: { size: 18, words: 26, dirs: ['E', 'S', 'SE', 'NE', 'W', 'N', 'NW', 'SW'], decoys: 8, lens: [5, 13], overlap: 5, mix: 0.65 },
};

// Screened in every direction. Kept to words that read as offensive on sight;
// three-letter strings that occur inside ordinary English (ASS) are left out.
export const BLOCK = ['FUCK', 'SHIT', 'CUNT', 'COCK', 'DICK', 'PISS', 'TWAT', 'SLUT', 'WHORE', 'BITCH', 'FAG', 'NIGGER', 'NIGGA', 'KIKE', 'SPIC', 'CHINK', 'GOOK', 'WANK', 'PUSSY', 'TITS', 'RAPE', 'DYKE', 'HOMO', 'PORN', 'JIZZ', 'CUM', 'NAZI', 'KKK', 'POOP', 'BOOB', 'ANUS', 'PENIS', 'SEX', 'DAMN', 'HELL', 'CRAP', 'TURD', 'ARSE', 'PUBE', 'NIPPLE', 'VAGINA', 'SEMEN', 'ORGASM'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const norm = (w) => w.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
const letters = (w) => w.replace(/ /g, '');
const rev = (s) => s.split('').reverse().join('');
// English letter frequency for the plain filler.
const FREQ = 'EEEEEEEEEEEETTTTTTTTTAAAAAAAAOOOOOOOIIIIIIINNNNNNNSSSSSSHHHHHHRRRRRRDDDDLLLLCCCUUUMMMWWFFGGYYPPBVKJXQZ';

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function loadPools() {
  return THEMES.map((t) => {
    const words = [...new Set(t.words.split(/\s+/).filter(Boolean).map(norm))]
      .filter((w) => /^[A-Z]+( [A-Z]+)*$/.test(w));
    return { id: t.id, label: t.label, sunday: !!t.sunday, words };
  });
}

// ---- the grid -------------------------------------------------------------
// Count every occurrence of `word` in the grid, all eight directions, a
// palindrome's forward and backward reading of the same squares counted once.
export function occurrences(grid, word) {
  const n = grid.length, seen = new Set(), hits = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] !== word[0]) continue;
    for (const [dr, dc] of Object.values(DIRS)) {
      const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
      if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
      let ok = true;
      for (let k = 1; k < word.length; k++) if (grid[r + dr * k][c + dc * k] !== word[k]) { ok = false; break; }
      if (!ok) continue;
      const cells = []; for (let k = 0; k < word.length; k++) cells.push((r + dr * k) * n + (c + dc * k));
      const key = cells.slice().sort((a, b) => a - b).join(',');
      if (seen.has(key)) continue;
      seen.add(key); hits.push(cells);
    }
  }
  return hits;
}

function tryBuild(spec, words, r) {
  const n = spec.size;
  const g = Array.from({ length: n }, () => Array(n).fill(''));
  const own = Array.from({ length: n }, () => Array(n).fill(0)); // how many words use each cell
  // Every listed direction gets a word: deal the directions round-robin over a
  // shuffle, longest words first so the long ones get room.
  const order = words.slice().sort((a, b) => letters(b).length - letters(a).length);
  const dirSeq = [];
  const ds = spec.dirs.slice();
  while (dirSeq.length < order.length) { const sh = ds.slice().sort(() => r() - 0.5); dirSeq.push(...sh); }
  const placed = [];
  for (let i = 0; i < order.length; i++) {
    const w = letters(order[i]);
    // Try the dealt direction first, then any other allowed one.
    const tryDirs = [dirSeq[i], ...spec.dirs.filter((d) => d !== dirSeq[i]).sort(() => r() - 0.5)];
    let best = null;
    for (const dn of tryDirs) {
      const [dr, dc] = DIRS[dn];
      const cands = [];
      for (let r0 = 0; r0 < n; r0++) for (let c0 = 0; c0 < n; c0++) {
        const er = r0 + dr * (w.length - 1), ec = c0 + dc * (w.length - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        let ok = true, over = 0;
        for (let k = 0; k < w.length; k++) {
          const ch = g[r0 + dr * k][c0 + dc * k];
          if (ch && ch !== w[k]) { ok = false; break; }
          if (ch) over++;
        }
        if (!ok || over === w.length) continue;
        cands.push({ r0, c0, over });
      }
      if (!cands.length) continue;
      // Weighted pick: later days lean toward crossings.
      const wts = cands.map((c) => Math.pow(1 + c.over, spec.overlap) * (0.5 + r()));
      let tot = wts.reduce((a, b) => a + b, 0), x = r() * tot, k = 0;
      while (k < cands.length - 1 && x > wts[k]) { x -= wts[k]; k++; }
      best = { ...cands[k], dn };
      break;
    }
    if (!best) return null;
    const [dr, dc] = DIRS[best.dn];
    for (let k = 0; k < w.length; k++) { g[best.r0 + dr * k][best.c0 + dc * k] = w[k]; own[best.r0 + dr * k][best.c0 + dc * k]++; }
    placed.push({ w, dn: best.dn, r0: best.r0, c0: best.c0 });
  }
  const used = new Set(placed.map((p) => p.dn));
  if (spec.dirs.some((d) => !used.has(d))) return null;

  // Decoys: the first few letters of a list word, planted somewhere else.
  const decoys = [];
  for (let t = 0; t < spec.decoys * 30 && decoys.length < spec.decoys; t++) {
    const src = placed[Math.floor(r() * placed.length)].w;
    const L = Math.max(3, Math.min(src.length - 2, 3 + Math.floor(r() * 3)));
    const d = src.slice(0, L);
    const dn = spec.dirs[Math.floor(r() * spec.dirs.length)];
    const [dr, dc] = DIRS[dn];
    const r0 = Math.floor(r() * n), c0 = Math.floor(r() * n);
    const er = r0 + dr * (L - 1), ec = c0 + dc * (L - 1);
    if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
    let ok = true;
    for (let k = 0; k < L; k++) if (g[r0 + dr * k][c0 + dc * k]) { ok = false; break; }
    if (!ok) continue;
    // The square after the decoy must not continue the word.
    const nr = r0 + dr * L, nc = c0 + dc * L;
    if (nr >= 0 && nr < n && nc >= 0 && nc < n && g[nr][nc] === src[L]) continue;
    for (let k = 0; k < L; k++) g[r0 + dr * k][c0 + dc * k] = d[k];
    decoys.push(d);
  }
  if (decoys.length < spec.decoys) return null;

  const pool = words.map(letters).join('');
  const fillOnce = () => {
    const out = g.map((row) => row.slice());
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!out[i][j]) {
      out[i][j] = r() < spec.mix ? pool[Math.floor(r() * pool.length)] : FREQ[Math.floor(r() * FREQ.length)];
    }
    return out;
  };
  for (let attempt = 0; attempt < 40; attempt++) {
    const out = fillOnce();
    if (!wordsUnique(out, words.map(letters))) continue;
    if (blockedHit(out, placed)) continue;
    return { grid: out.map((row) => row.join('')), placed, decoys };
  }
  return null;
}

export function wordsUnique(grid, ws) {
  for (const w of ws) if (occurrences(grid, w).length !== 1) return false;
  return true;
}
// A blocked string anywhere except wholly inside a placed list word.
export function blockedHit(grid, placed) {
  const n = grid.length;
  const inWord = (cells) => placed.some((p) => {
    const [dr, dc] = DIRS[p.dn];
    const set = new Set(); for (let k = 0; k < p.w.length; k++) set.add((p.r0 + dr * k) * n + (p.c0 + dc * k));
    return cells.every((c) => set.has(c));
  });
  for (const b of BLOCK) for (const cells of occurrences(grid, b)) if (!inWord(cells)) return b;
  return null;
}

// ---- dates ----------------------------------------------------------------
function* days(from, until) {
  const d = new Date(from + 'T12:00:00Z');
  while (d.toISOString().slice(0, 10) <= until) { yield new Date(d); d.setUTCDate(d.getUTCDate() + 1); }
}
const iso = (d) => d.toISOString().slice(0, 10);
export const quizIdOf = (d) => `scour-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
export const dateLabelOf = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
const dayDiff = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / 864e5);

// No chosen word inside another chosen word, either way round.
function nested(ws) {
  const L = ws.map(letters);
  for (let i = 0; i < L.length; i++) for (let j = 0; j < L.length; j++) {
    if (i !== j && (L[j].includes(L[i]) || rev(L[j]).includes(L[i]))) return true;
  }
  return false;
}

async function loadMod(file) {
  if (!fs.existsSync(file)) return [];
  const mod = await import(pathToFileURL(file).href + '?t=' + Date.now());
  return mod.PUZZLES || [];
}

function deal(pools, kept, scram) {
  const lastWord = new Map(), lastTheme = {}, uses = {};
  for (const p of kept) {
    for (const w of p.words) lastWord.set(w, p.live);
    lastTheme[p.themeId] = p.live; uses[p.themeId] = (uses[p.themeId] || 0) + 1;
  }
  const scramBy = new Map(scram.map((p) => [p.live, p]));
  const from = kept.length ? iso(new Date(new Date(kept[kept.length - 1].live + 'T12:00:00Z').getTime() + 864e5)) : START;
  const out = [];
  let num = kept.length ? kept[kept.length - 1].num + 1 : 1;
  for (const d of days(from, UNTIL)) {
    const live = iso(d), dow = d.getUTCDay(), spec = SPEC[dow];
    const r = rng(hashStr('scour:' + live) ^ SEED);
    const scramToday = scramBy.get(live);
    const nearScram = new Set();
    for (let k = -SCRAM_NEAR; k <= SCRAM_NEAR; k++) {
      const dd = iso(new Date(d.getTime() + k * 864e5)); const sp = scramBy.get(dd);
      if (sp) for (const w of sp.words) nearScram.add(letters(w.a));
    }
    const fresh = (w) => {
      const lw = lastWord.get(w);
      return (!lw || dayDiff(live, lw) >= WORD_GAP) && !nearScram.has(letters(w));
    };
    const cands = pools
      .filter((t) => (dow !== 0 || t.sunday) && (!lastTheme[t.id] || dayDiff(live, lastTheme[t.id]) >= THEME_GAP) && (!scramToday || scramToday.themeId !== t.id))
      .map((t) => ({ t, avail: t.words.filter((w) => fresh(w) && letters(w).length >= spec.lens[0] && letters(w).length <= spec.lens[1]) }))
      .filter((c) => c.avail.length >= spec.words + 4)
      .map((c) => ({ ...c, score: (c.avail.length / ((uses[c.t.id] || 0) + 1)) * (0.6 + 0.8 * r()) }))
      .sort((a, b) => b.score - a.score);
    let made = null;
    for (const c of cands) {
      for (let tryN = 0; tryN < 60 && !made; tryN++) {
        const sh = c.avail.slice().sort(() => r() - 0.5);
        // Spread the lengths: alternate short and long so a board is not all sixes.
        sh.sort((a, b) => (letters(a).length % 3) - (letters(b).length % 3) || (r() - 0.5));
        const chosen = [];
        for (const w of sh) {
          if (chosen.length >= spec.words) break;
          if (nested([...chosen, w])) continue;
          chosen.push(w);
        }
        if (chosen.length < spec.words) continue;
        const built = tryBuild(spec, chosen, r);
        if (!built) continue;
        made = { t: c.t, chosen, built };
      }
      if (made) break;
    }
    if (!made) throw new Error(`could not build ${live}`);
    for (const w of made.chosen) lastWord.set(w, live);
    lastTheme[made.t.id] = live; uses[made.t.id] = (uses[made.t.id] || 0) + 1;
    const p = { num: num++, quizId: quizIdOf(d), live, dateLabel: dateLabelOf(d), themeId: made.t.id, theme: made.t.label };
    if (dow === 0) p.sunday = true;
    p.size = spec.size;
    p.dirs = spec.dirs;
    p.words = made.chosen.slice().sort();
    p.grid = made.built.grid;
    out.push(p);
  }
  return out;
}

const HEADER = `// Puzzle data for Scour, the daily themed word search. Imported ONLY by the
// server page (app/scour/page.js), which filters live<=today before handing
// puzzles to the client, so future boards never reach a browser.
//
// GENERATED by scripts/gen-scour.mjs from scripts/scram-pools.mjs. Do not edit
// by hand: extend with \`node scripts/gen-scour.mjs --until <date>\`, which keeps
// every board already here byte for byte. Check with scripts/verify-scour.mjs.
//
//   theme / themeId  the day's one theme, printed above the word list
//   size             the grid is size x size (15, or 18 on the Sunday Edition)
//   dirs             the directions today's words run, every one used at least once
//   words            the list to find, as printed (a space marks two words; the
//                    grid carries the letters without it). Each is in the grid
//                    EXACTLY once counting all eight directions, so the client
//                    checks a find from the letters alone and no answer key ships.
//   grid             size rows of size letters
//   sunday           the Sunday Edition: 18x18, 26 words, every direction
`;

if (process.argv[1] && process.argv[1].endsWith('gen-scour.mjs')) {
  const pools = loadPools();
  const scram = await loadMod(path.join(ROOT, 'app', 'scram', 'puzzles.js'));
  const all = await loadMod(OUT);
  const kept = args.includes('--rebuild') ? [] : all;
  const fresh = deal(pools, kept, scram);
  const bank = [...kept, ...fresh];
  const body = 'export const PUZZLES = [\n' + bank.map((p) => '  ' + JSON.stringify(p)).join(',\n') + ',\n];\n';
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, HEADER + body);
  const themes = {}; for (const p of bank) themes[p.theme] = (themes[p.theme] || 0) + 1;
  console.log(`gen-scour: ${bank.length} boards (${fresh.length} new), ${bank[0].live} to ${bank[bank.length - 1].live}`);
  console.log('themes:', JSON.stringify(themes));
}
