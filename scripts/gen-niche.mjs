#!/usr/bin/env node
// gen-niche — build the Niche puzzle bank and write app/niche/puzzles.js.
//
//   node scripts/gen-niche.mjs [--from YYYY-MM-DD] [--days N] [--startnum N] [--seed N]
//   node scripts/gen-niche.mjs --existing app/niche/puzzles.js --days N   (extend a bank)
//
// EXTENDING an existing bank (--existing <path>): boards already banked are
// live or already played, and the past is frozen, so a full regenerate is the
// wrong shipping mechanism. --existing loads that bank, re-emits its boards
// BYTE-IDENTICALLY, and generates only the days after it, seeding every
// bank-wide rule from the banked boards first: the per-universe attribute
// usage counts (ATTR_CAP), each universe's most recent board (MAX_ECHO), and
// every earlier board of each universe (the 4-attribute overlap rule). --from
// and --startnum default to the day and number after the last banked board;
// passing them explicitly is checked against that. Without --existing the
// script behaves exactly as before.
//
// A board is three row attributes and three column attributes from that day's
// universe (four each on the Sunday Edition, always Countries). The generator
// PROVES each board before banking it:
//   - every cell has at least three valid answers (the same floor the
//     verifier holds),
//   - the whole board admits a perfect matching of DISTINCT answers
//     (boardMatchable in app/niche/facts.js), because answers cannot repeat,
//   - at least one tight cell (<= TIGHT answers) per board, two on Sunday, so
//     every day has a corner worth bragging about,
//   - at most two LETTER attributes per board, one in launch week (a board
//     of letter fills is a word game, not trivia). A letter attribute is any
//     attribute about the FIRST letter of the name: the generated n-/cap-
//     fills and the "starts with a vowel" attribute added 2026-09-06, which
//     is the same gimmick spelled differently and so counts against the same
//     cap,
//   - no two attributes on a board are exact COMPLEMENTS of each other over
//     that universe's members (Released before 2000 against Released in 2000
//     or later, A band against A solo act). A complementary pair splits the
//     universe down the middle and tells the player nothing, and growing the
//     pool on 2026-09-06 added enough deliberate complements to make the pair
//     likely rather than rare. Scoped from COMPLEMENT_FROM, since board #17
//     shipped band-against-solo on 2026-09-05 and the past is frozen,
//   - no board shares more than 4 of its attributes with ANY earlier board of
//     its universe (the echo rule alone let two boards two weeks apart ship
//     as the same six attributes with rows and columns swapped),
//   - no attribute repeats within a board, at most MAX_ECHO attributes carry
//     over from that universe's PREVIOUS board (a seven-day echo, since
//     universes run weekly), and none appears more than ATTR_CAP times per
//     universe across the bank (a floor is not a target: variety is checked
//     bank-wide).
//
// ATTR_CAP IS AN ABSOLUTE, NOT A RATE, so it sets a hard floor under the
// attribute pool: a universe running B boards of S attributes each needs at
// least ceil(B * S / ATTR_CAP) attributes, and in practice roughly twice that,
// because attributes only pair into a legal cell with the partners they
// actually overlap. Extending the bank therefore means GROWING THE POOL in
// app/niche/facts.js, never raising the cap: a bigger pool ships better boards
// every day, a looser cap ships worse ones. The 2026-11-30 extension is what
// forced this: at 103 boards US States needed 90 attribute slots against a
// pool of 20 (a ceiling of 80), which is arithmetically impossible, and the
// generator said so by failing on 2026-11-23. The pool grew instead.
//
// Deterministic: a seeded RNG, so a re-run with the same arguments reproduces
// the same bank. Do NOT hand-edit boards in puzzles.js; regenerate and re-run
// scripts/verify-niche.mjs.
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { UNIVERSE_MAP, universeForDate, cellMembers, boardMatchable } from '../app/niche/facts.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const EXISTING = arg('--existing', null);
const SEED = Number(arg('--seed', '20260820'));

// The banked past. Its boards are re-emitted from their own source lines, so
// extending a bank cannot rewrite a board that has already been played.
let banked = [];
let bankedLines = [];
if (EXISTING) {
  const path = isAbsolute(EXISTING) ? EXISTING : join(ROOT, EXISTING);
  banked = (await import(pathToFileURL(path).href)).PUZZLES;
  if (!Array.isArray(banked) || !banked.length) throw new Error(`--existing ${EXISTING}: no PUZZLES found`);
  bankedLines = readFileSync(path, 'utf8').split('\n').filter((l) => /^\s*\{"num":/.test(l));
  if (bankedLines.length !== banked.length) {
    throw new Error(`--existing: parsed ${banked.length} boards but matched ${bankedLines.length} source lines; the file is not in generator format`);
  }
}
const lastBanked = banked.length ? banked[banked.length - 1] : null;

const FROM = arg('--from', lastBanked ? isoPlus(lastBanked.live, 1) : '2026-08-21');
const DAYS = Number(arg('--days', '38'));
const START_NUM = Number(arg('--startnum', lastBanked ? String(lastBanked.num + 1) : '1'));
if (lastBanked) {
  const wantFrom = isoPlus(lastBanked.live, 1);
  if (FROM !== wantFrom) throw new Error(`--from ${FROM} does not continue the banked bank (last board ${lastBanked.live}, expected ${wantFrom})`);
  if (START_NUM !== lastBanked.num + 1) throw new Error(`--startnum ${START_NUM} does not continue the banked bank (last num ${lastBanked.num})`);
}

const MIN_CELL = 3;      // the promised floor: every cell holds at least three answers
const TIGHT = 8;         // a "tight" cell has at most this many valid answers
// Max appearances of one attribute per universe across the bank (about seven
// boards per universe in a 45-day bank). Every universe leans on a handful of
// anchor attributes (the four leagues, the continents, the decades) that most
// boards need one of, so the cap is 4 rather than 3; week-on-week repetition
// is separately held down by MAX_ECHO.
const ATTR_CAP = 4;
const MAX_ECHO = 2;      // attrs allowed to carry over from the universe's previous board
const TRIES = 50000;
// The complement rule starts here: board #17 (2026-09-05) shipped a band /
// solo pair before the rule existed, and the past is frozen.
const COMPLEMENT_FROM = '2026-10-05';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// The seed is OFFSET by the starting board number, so a continuation cannot
// replay the RNG stream that produced the frozen segment. A from-scratch
// generate starts at board 1 and so takes offset 0, reproducing byte for byte.
const rnd = mulberry32(SEED + START_NUM - 1);

function weightedPick(pool, n, rand) {
  const out = [];
  const bag = pool.slice();
  while (out.length < n && bag.length) {
    const total = bag.reduce((s, a) => s + (a.w || 1), 0);
    let roll = rand() * total;
    let idx = 0;
    for (let i = 0; i < bag.length; i++) { roll -= (bag[i].w || 1); if (roll <= 0) { idx = i; break; } }
    out.push(bag[idx]);
    bag.splice(idx, 1);
  }
  return out;
}

function isoPlus(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function quizIdFor(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `niche-${m}-${d}-${String(y).slice(2)}`;
}
function dateLabelFor(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
}
function isSunday(iso) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
}

// Two attributes are complements when no member answers both and every member
// answers one: together they say only "this universe, split in two".
const setOf = (() => {
  const cache = new Map();
  return (universe, id) => {
    const k = `${universe.id}:${id}`;
    if (!cache.has(k)) {
      const a = universe.attrs.find((x) => x.id === id);
      cache.set(k, new Set(universe.members.filter((m) => a.test(m)).map((m) => m.t)));
    }
    return cache.get(k);
  };
})();
// A row x column cell where one attribute's members all carry the other is a
// single attribute wearing two labels. Refused from NESTED_FROM (2026-11-12,
// lane-d restock; verify-niche.mjs holds the same rule).
const NESTED_FROM = '2026-12-01';
// TWIN CELLS (2026-11-12, dec-g fix round): two cells in one row or one column
// holding the very same answers make two clues behave as one there. Every board
// carries a few by chance (the bank's worst before this was 2); more than two
// reads as a repeated board.
const MAX_TWINS = 2;
function twinCells(universe, rows, cols) {
  const k = (r, c) => cellMembers(universe, r, c).map((m) => m.t).sort().join('|');
  let n = 0;
  for (const r of rows) for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) if (k(r, cols[i]) === k(r, cols[j])) n++;
  for (const c of cols) for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) if (k(rows[i], c) === k(rows[j], c)) n++;
  return n;
}
// From the same date (review fix 2026-11-12): nested is checked over EVERY pair
// on the board (two columns where one implies the other repeat each row's
// cells), and at most one BROAD attribute (true of BROAD or more of the
// universe, e.g. Not in NATO, Did not win Best Picture) may sit on a board,
// since a cell against a near-universal attribute is just its other attribute.
const BROAD = 0.7;
const coverage = (universe, id) => setOf(universe, id).size / universe.members.length;
const keyOf = (universe, id) => (universe.attrs.find((a) => a.id === id)?.capKey || id);
function nestedPair(universe, idA, idB) {
  const A = setOf(universe, idA), B = setOf(universe, idB);
  const [S, L] = A.size <= B.size ? [A, B] : [B, A];
  // near-nested counts too (late review): a cell holding 90% or more of the
  // smaller attribute (Mammal x Does not lay eggs, 77 of 78) asks for nothing.
  let hit = 0;
  for (const n of S) if (L.has(n)) hit++;
  return hit / S.size >= NEAR_NESTED;
}
const NEAR_NESTED = 0.85;
// NEAR-COMPLEMENT (late review): two attributes that almost never overlap and
// together cover almost the universe (Does not lay eggs / Not a mammal) split it
// in two like an exact complement. Refused from NESTED_FROM.
function nearComplement(universe, idA, idB) {
  const A = setOf(universe, idA), B = setOf(universe, idB);
  let both = 0; for (const n of A) if (B.has(n)) both++;
  const union = A.size + B.size - both;
  return both <= 0.1 * Math.min(A.size, B.size) && union >= 0.9 * universe.members.length;
}
// CELL REPEATS (late review): the same row x column pair may not come back
// within CELL_GAP days in its universe (12-22 repeated four cells of 12-08,
// two weeks earlier), so a weekly universe never repeats its last two boards.
const CELL_GAP = 15;   // 22 was tried (late review) and left Friday teams and 12-29 animals unbuildable
const recentCells = new Map();
function complementary(universe, idA, idB) {
  const A = setOf(universe, idA);
  const B = setOf(universe, idB);
  if (A.size + B.size !== universe.members.length) return false;
  for (const n of A) if (B.has(n)) return false;
  return true;
}

function buildBoard(universe, size, prevAttrIds, history, usage, maxLetters, rand, banned, nestedOn, iso) {
  const used = (id) => (usage[id] || 0);
  const pool = universe.attrs.filter((a) => used(a.capKey || a.id) < ATTR_CAP && !(a.retiredFrom && iso >= a.retiredFrom));
  // Rows are drawn at random; columns are then chosen GREEDILY so every cell
  // against every row clears the floor (a blind draw of six attrs almost never
  // makes all nine cells compatible — continent versus continent is empty).
  for (let t = 0; t < TRIES; t++) {
    const rowPicks = weightedPick(pool, size, rand);
    if (rowPicks.length < size) return null;
    const rows = rowPicks.map((a) => a.id);
    const rest = weightedPick(pool.filter((a) => !rows.includes(a.id)), pool.length, rand);
    const cols = [];
    for (const a of rest) {
      if (cols.length === size) break;
      if (rows.every((r) => cellMembers(universe, r, a.id).length >= MIN_CELL)) cols.push(a.id);
    }
    if (cols.length < size) continue;
    // Name-shape attributes (letter counts, last letter, double letters; 2026-11-12):
// with the letter fills, at most half of a board from GIMMICK_FROM, so a board
// stays trivia rather than a word game.
const NAME_SHAPE = new Set(['short5', 'mid67', 'long8', 'long9', 'long12', 'long14', 'short8', 'endvowel', 'dbl', 'dblw',
  'the', 'one', 'multi', 'w2', 'w3', 'w4', 'colon', 'num', 'hasz', 'endsa']);
const isLetter = (id) => /^(n|cap)-[a-z]$/.test(id) || id === 'vowel';
    const all = [...rows, ...cols];
    if (all.filter(isLetter).length > maxLetters) continue;
    if (nestedOn && all.filter((id) => isLetter(id) || NAME_SHAPE.has(id)).length > size * 2 / 2) continue;
    if (nestedOn && all.filter((id) => /^b[0-5]$/.test(id)).length > 1) continue; // one border count per board
    if (nestedOn && all.some((x, i) => all.slice(i + 1).some((y) => nearComplement(universe, x, y)))) continue;
    if (nestedOn && rows.some((r) => cols.some((c) => recentCells.has(`${universe.id}|${[r, c].sort().join('|')}`)))) continue;
    const allK = all.map((id) => keyOf(universe, id));
    if (allK.filter((id) => prevAttrIds.has(id)).length > MAX_ECHO) continue;
    if (history.some((h) => allK.filter((id) => h.has(id)).length > 4)) continue;
    if (banned && all.some((a, i) => all.slice(i + 1).some((b) => complementary(universe, a, b)))) continue;
    if (nestedOn && all.some((x, i) => all.slice(i + 1).some((y) => nestedPair(universe, x, y)))) continue;
    if (nestedOn && all.filter((x) => coverage(universe, x) >= BROAD).length > 1) continue;
    let tight = 0;
    for (const r of rows) for (const c of cols) {
      if (cellMembers(universe, r, c).length <= TIGHT) tight++;
    }
    if (tight < (size === 4 ? 2 : 1)) continue;
    if (nestedOn && twinCells(universe, rows, cols) > MAX_TWINS) continue;
    if (!boardMatchable(universe, rows, cols)) continue;
    return { rows, cols };
  }
  return null;
}

// --only DATE (2026-11-12, late review): rebuild ONE board in the middle of the
// bank, leaving every other board byte for byte. Every bank-wide rule is held
// against the boards on BOTH sides: the usage cap and the 4-attribute overlap
// over all other boards of the universe, the echo rule against the previous and
// the next board of the universe, and the cell-repeat rules within CELL_GAP days
// either way. Use with --existing app/niche/puzzles.js.
const ONLY = arg('--only', null);
if (ONLY) {
  const t = banked.findIndex((p) => p.live === ONLY);
  if (t < 0) throw new Error(`--only ${ONLY}: no such board`);
  const target = banked[t], universe = UNIVERSE_MAP[target.universe];
  const others = banked.filter((_, i) => i !== t);
  const key = (U, x) => keyOf(U, x);
  const uUsage = {};
  for (const p of others) if (p.universe === universe.id) for (const id of [...p.rows, ...p.cols].map((x) => key(universe, x))) uUsage[id] = (uUsage[id] || 0) + 1;
  const same = others.filter((p) => p.universe === universe.id);
  const before = same.filter((p) => p.live < ONLY), after = same.filter((p) => p.live > ONLY);
  const prev = before.length ? new Set([...before.at(-1).rows, ...before.at(-1).cols].map((x) => key(universe, x))) : new Set();
  const next = after.length ? new Set([...after[0].rows, ...after[0].cols].map((x) => key(universe, x))) : new Set();
  const hist = same.map((p) => new Set([...p.rows, ...p.cols].map((x) => key(universe, x))));
  for (const p of same) {
    if (Math.abs(Date.parse(p.live) - Date.parse(ONLY)) / 864e5 >= CELL_GAP) continue;
    for (const r of p.rows) for (const c of p.cols) {
      recentCells.set(`${p.universe}|${[r, c].sort().join('|')}`, p.live);
    }
  }
  let board = null;
  for (let attempt = 0; attempt < 40 && !board; attempt++) {
    const r2 = mulberry32(SEED + target.num * 7919 + attempt);
    const b = buildBoard(universe, target.sunday ? 4 : 3, prev, hist, uUsage, 2, r2, ONLY >= COMPLEMENT_FROM, ONLY >= NESTED_FROM, ONLY);
    if (b && [...b.rows, ...b.cols].map((x) => key(universe, x)).filter((id) => next.has(id)).length <= MAX_ECHO) board = b;
  }
  if (!board) throw new Error(`--only ${ONLY}: no board found`);
  const fresh = { ...target, rows: board.rows, cols: board.cols };
  const lines = bankedLines.slice(); lines[t] = `  ${JSON.stringify(fresh)},`;
  const src = readFileSync(isAbsolute(EXISTING) ? EXISTING : join(ROOT, EXISTING), 'utf8');
  const i0 = src.indexOf(bankedLines[t]);
  writeFileSync(join(ROOT, 'app/niche/puzzles.js'), src.slice(0, i0) + lines[t] + src.slice(i0 + bankedLines[t].length));
  console.log(`rebuilt ${ONLY} (${universe.id}): rows ${board.rows.join(',')} cols ${board.cols.join(',')}`);
  process.exit(0);
}

const out = [];
const usage = {};          // `${universeId}:${attrId}` -> count
const prevByUniverse = {}; // universeId -> Set of last board's attr ids
const histByUniverse = {}; // universeId -> [Set of each board's attr ids]
// Seed every bank-wide rule from the boards already banked, so an extension is
// held to the same caps, echo and overlap limits as a full generate.
for (const p of banked) {
  const all = [...p.rows, ...p.cols];
  const U0 = UNIVERSE_MAP[p.universe];
  for (const id of all.map((x) => keyOf(U0, x))) usage[`${p.universe}:${id}`] = (usage[`${p.universe}:${id}`] || 0) + 1;
  prevByUniverse[p.universe] = new Set(all.map((x) => keyOf(U0, x)));
  for (const r of p.rows) for (const c of p.cols) recentCells.set(`${p.universe}|${[r, c].sort().join('|')}`, p.live);
  (histByUniverse[p.universe] = histByUniverse[p.universe] || []).push(prevByUniverse[p.universe]);
}
for (let i = 0; i < DAYS; i++) {
  const iso = isoPlus(FROM, i);
  const universe = universeForDate(iso);
  const sunday = isSunday(iso);
  const size = sunday ? 4 : 3;
  if (sunday && universe.id !== 'countries') throw new Error(`Sunday must be countries, got ${universe.id} on ${iso}`);
  const uUsage = Object.fromEntries(Object.entries(usage)
    .filter(([k]) => k.startsWith(`${universe.id}:`))
    .map(([k, v]) => [k.split(':')[1], v]));
  const board = buildBoard(universe, size, prevByUniverse[universe.id] || new Set(),
    histByUniverse[universe.id] || [], uUsage, banked.length + i < 7 ? 1 : 2, rnd,
    iso >= COMPLEMENT_FROM, iso >= NESTED_FROM, iso);
  if (!board) throw new Error(`no board found for ${iso} (${universe.id}); loosen constraints or grow the attribute pool`);
  for (const id of [...board.rows, ...board.cols].map((x) => keyOf(universe, x))) {
    usage[`${universe.id}:${id}`] = (usage[`${universe.id}:${id}`] || 0) + 1;
  }
  prevByUniverse[universe.id] = new Set([...board.rows, ...board.cols].map((x) => keyOf(universe, x)));
  for (const [k, d] of [...recentCells]) if ((Date.parse(iso) - Date.parse(d)) / 864e5 >= CELL_GAP) recentCells.delete(k);
  for (const r of board.rows) for (const c of board.cols) recentCells.set(`${universe.id}|${[r, c].sort().join('|')}`, iso);
  (histByUniverse[universe.id] = histByUniverse[universe.id] || []).push(prevByUniverse[universe.id]);
  out.push({
    num: START_NUM + i,
    quizId: quizIdFor(iso),
    live: iso,
    dateLabel: dateLabelFor(iso),
    sunday,
    universe: universe.id,
    rows: board.rows,
    cols: board.cols,
  });
}

const header = `// Puzzle data for Niche, the daily trivia grid. Imported ONLY by the server
// page (app/niche/page.js), which filters live<=today before handing puzzles
// to the client, so future boards never reach a browser.
//
// A board is three row attributes and three column attributes (four each on
// the Sunday Edition) from one universe in app/niche/facts.js; the ids here
// resolve against that file's attribute registry, which is also what the
// client judges picks by. The universe follows the day of the week: Sunday
// Countries (the 4x4 Edition), Monday US States, Tuesday Animals, Wednesday
// Movies, Thursday TV Shows, Friday Pro Sports Teams, Saturday Musicians.
//
// EVERY board is proven before banking: each cell holds at least 3 valid
// answers (a floor, not a target: most cells hold far more), the whole board
// admits a full set of DISTINCT answers, at least one cell is tight, meaning
// 8 or fewer answers (two such cells on Sunday), no more than 2 letter-fill
// attributes appear on a board, at most 2 attributes carry over from that
// universe's previous board, no board shares more than 4 attributes with ANY
// earlier board of its universe, no two attributes on a board are exact
// complements of each other (boards from 2026-10-05 on; #17 predates the
// rule), and no attribute appears more than 4 times per universe across the
// whole bank. That last cap is an ABSOLUTE, not a rate, so it is what sets
// the floor under the attribute pool in app/niche/facts.js: when the
// generator runs out of boards, grow that pool, never raise the cap.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-niche.mjs and
// re-run scripts/verify-niche.mjs.
export const PUZZLES = [
`;
const body = [...bankedLines, ...out.map((p) => `  ${JSON.stringify(p)},`)].join('\n');
writeFileSync(join(ROOT, 'app/niche/puzzles.js'), `${header}${body}\n];\n`);
if (banked.length) console.log(`kept ${banked.length} banked boards: ${banked[0].live} through ${lastBanked.live}`);
console.log(`wrote ${out.length} new board(s): ${out[0].live} through ${out[out.length - 1].live}`);
const byU = {};
for (const p of [...banked, ...out]) byU[p.universe] = (byU[p.universe] || 0) + 1;
console.log('per universe (whole bank):', JSON.stringify(byU));
