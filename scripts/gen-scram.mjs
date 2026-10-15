// scripts/gen-scram.mjs — deals Scram's bank into app/scram/puzzles.js.
//
//   node scripts/gen-scram.mjs                     # whole bank, 2026-10-14 .. --until
//   node scripts/gen-scram.mjs --until 2027-03-31  # EXTEND: boards already in the
//                                                  # bank are kept byte for byte
//
// One theme a day, ten answers, every answer scrambled. The rules it deals by,
// all re-checked independently by scripts/verify-scram.mjs:
//
//   1. THE RAMP IS ANSWER LENGTH (letters, spaces not counted), by weekday:
//        Mon 5-6, Tue 5-7, Wed 6-7, Thu 6-8, Fri 7-8, Sat 7-9, Sun 8-12.
//      The Sunday Edition is the long day and only deals themes flagged
//      `sunday` in scram-pools.mjs (the names pools have too few long names).
//   2. NO ANSWER IS EVER DEALT TWICE in the bank, and a theme waits at least
//      MIN_GAP days before it comes back.
//   3. ONE RIGHT ANSWER PER SCRAMBLE. A word whose letters also spell another
//      member of its theme (pool words plus alsoValid) is never dealt.
//   4. THE SCRAMBLE HIDES THE ANSWER: never the answer itself, never the same
//      first letter, at most a quarter of the letters left in place, and (from
//      five letters) no three-letter run of the answer left intact.
//
// Deterministic: same pools, same seed, same bank.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { THEMES } from './scram-pools.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app', 'scram', 'puzzles.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const START = '2026-10-14';
const UNTIL = opt('--until', '2026-12-31');
const SEED = Number(opt('--seed', '20261014'));
export const MIN_GAP = 5;
export const BANDS = { 1: [5, 6], 2: [5, 7], 3: [6, 7], 4: [6, 8], 5: [7, 8], 6: [7, 9], 0: [8, 12] };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const norm = (w) => w.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
const letters = (w) => w.replace(/ /g, '');
const key = (w) => letters(w).split('').sort().join('');

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---- pools ----------------------------------------------------------------
export function loadPools() {
  return THEMES.map((t) => {
    const words = [...new Set(t.words.split(/\s+/).filter(Boolean).map(norm))];
    const also = (t.alsoValid || '').split(/\s+/).filter(Boolean).map(norm);
    for (const w of [...words, ...also]) if (!/^[A-Z]+( [A-Z]+)*$/.test(w)) throw new Error(`${t.id}: bad entry "${w}"`);
    const byKey = new Map();
    for (const w of new Set([...words, ...also])) { const k = key(w); byKey.set(k, (byKey.get(k) || new Set()).add(w)); }
    const clash = words.filter((w) => byKey.get(key(w)).size > 1);
    // A word with so many repeated letters that no shuffle can hide it (REFEREE)
    // is dropped rather than dealt with a weak scramble.
    const hard = words.filter((w) => !canScramble(w));
    const ok = words.filter((w) => byKey.get(key(w)).size === 1 && canScramble(w));
    return { ...t, words: ok, clash, hard, all: new Set([...words, ...also]) };
  });
}

// ---- scramble -------------------------------------------------------------
export function scrambleOk(ans, s) {
  const L = letters(ans);
  if (s === L || s.length !== L.length || key(s) !== key(L)) return false;
  if (s[0] === L[0]) return false;
  let fixed = 0; for (let i = 0; i < L.length; i++) if (s[i] === L[i]) fixed++;
  if (fixed > Math.floor(L.length / 4)) return false;
  if (L.length >= 5) for (let i = 0; i + 3 <= L.length; i++) if (s.includes(L.slice(i, i + 3))) return false;
  return true;
}
function canScramble(ans) { try { scramble(ans, rng(7)); return true; } catch (e) { return false; } }
function scramble(ans, r) {
  const L = letters(ans).split('');
  for (let tries = 0; tries < 5000; tries++) {
    const a = L.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const s = a.join('');
    if (scrambleOk(ans, s)) return s;
  }
  throw new Error(`no legal scramble for ${ans}`);
}

// ---- dates ----------------------------------------------------------------
function* days(from, until) {
  const d = new Date(from + 'T12:00:00Z');
  while (d.toISOString().slice(0, 10) <= until) { yield new Date(d); d.setUTCDate(d.getUTCDate() + 1); }
}
const iso = (d) => d.toISOString().slice(0, 10);
const quizId = (d) => `scram-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
const dateLabel = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;

// ---- deal -----------------------------------------------------------------
async function existing() {
  if (!fs.existsSync(OUT)) return [];
  const mod = await import(pathToFileURL(OUT).href + '?t=' + Date.now());
  return mod.PUZZLES || [];
}

function deal(pools, kept, seed) {
  const r = rng(seed);
  const used = new Set(kept.flatMap((p) => p.words.map((w) => w.a)));
  const last = {}, uses = {};
  for (const p of kept) { last[p.themeId] = p.live; uses[p.themeId] = (uses[p.themeId] || 0) + 1; }
  const from = kept.length ? iso(new Date(new Date(kept[kept.length - 1].live + 'T12:00:00Z').getTime() + 864e5)) : START;
  const out = [];
  let num = kept.length ? kept[kept.length - 1].num + 1 : 1;
  for (const d of days(from, UNTIL)) {
    const dow = d.getUTCDay(), [lo, hi] = BANDS[dow], live = iso(d);
    const gap = (id) => (last[id] ? (d - new Date(last[id] + 'T12:00:00Z')) / 864e5 : 999);
    const cands = pools
      .filter((t) => (dow !== 0 || t.sunday) && gap(t.id) >= MIN_GAP)
      .map((t) => ({ t, avail: t.words.filter((w) => !used.has(w) && letters(w).length >= lo && letters(w).length <= hi) }))
      .filter((c) => c.avail.length >= 10);
    if (!cands.length) return null;
    const pick = cands
      .map((c) => ({ ...c, score: (c.avail.length / ((uses[c.t.id] || 0) + 1)) * (0.6 + 0.8 * r()) }))
      .sort((a, b) => b.score - a.score)[0];
    // Spread the ten across the band: shuffle, then take the shortest-first
    // mix by bucketing each length so a Thursday is not ten six-letter words.
    const avail = pick.avail.slice().sort(() => r() - 0.5);
    const byLen = {};
    for (const w of avail) (byLen[letters(w).length] ||= []).push(w);
    const lens = Object.keys(byLen).map(Number).sort((a, b) => a - b);
    const chosen = [];
    while (chosen.length < 10) {
      let moved = false;
      for (const L of lens) { if (chosen.length < 10 && byLen[L].length) { chosen.push(byLen[L].shift()); moved = true; } }
      if (!moved) break;
    }
    if (chosen.length < 10) return null;
    chosen.sort((a, b) => letters(a).length - letters(b).length || (r() - 0.5));
    for (const w of chosen) used.add(w);
    last[pick.t.id] = live; uses[pick.t.id] = (uses[pick.t.id] || 0) + 1;
    const p = { num: num++, quizId: quizId(d), live, dateLabel: dateLabel(d), themeId: pick.t.id, theme: pick.t.label };
    if (dow === 0) p.sunday = true;
    p.words = chosen.map((a) => ({ a, s: scramble(a, r) }));
    out.push(p);
  }
  return out;
}

const HEADER = `// Puzzle data for Scram, the daily themed word scramble. Imported ONLY by the
// server page (app/scram/page.js), which filters live<=today before handing
// puzzles to the client, so future boards never reach a browser.
//
// GENERATED by scripts/gen-scram.mjs from scripts/scram-pools.mjs. Do not edit
// by hand: extend with \`node scripts/gen-scram.mjs --until <date>\`, which keeps
// every board already here byte for byte. Check with scripts/verify-scram.mjs.
//
//   theme / themeId  the day's one theme, printed as "Today's theme"
//   words[].a        the answer (a space marks a multi-word answer)
//   words[].s        the scramble shown, the answer's letters with no spaces
//   sunday           the Sunday Edition: the long-answer day (8 to 12 letters)
`;

const pools = loadPools();
if (process.argv[1] && process.argv[1].endsWith('gen-scram.mjs')) {
  const all = await existing();
  const kept = all.filter((p) => p.live < (args.includes('--rebuild') ? START : '9999'));
  const keepUpTo = kept.length && !args.includes('--rebuild') ? kept : [];
  let fresh = null, seed = SEED;
  for (let k = 0; k < 400 && !fresh; k++) fresh = deal(pools, keepUpTo, seed + k * 7919);
  if (!fresh) { console.error('could not deal the bank: pools too thin for the dates asked'); process.exit(1); }
  const bank = [...keepUpTo, ...fresh];
  const body = 'export const PUZZLES = [\n' + bank.map((p) => '  ' + JSON.stringify(p)).join(',\n') + ',\n];\n';
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, HEADER + body);
  const themes = {}; for (const p of bank) themes[p.theme] = (themes[p.theme] || 0) + 1;
  console.log(`gen-scram: ${bank.length} boards (${fresh.length} new), ${bank[0].live} to ${bank[bank.length - 1].live}`);
  console.log('themes:', JSON.stringify(themes));
  for (const t of pools) if (t.clash.length || t.hard.length) console.log(`  ${t.id}: dropped (anagram clash) ${t.clash.join(', ') || '-'}; (cannot hide) ${t.hard.join(', ') || '-'}; usable ${t.words.length}`);
}
