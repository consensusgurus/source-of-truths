#!/usr/bin/env node
// Bank generator for THE DAILY FIVE, the five-game run in lib/daily-five.js.
//
// The bank is hand-picked and dated by design (rule 4 in that file's header), so
// this does NOT replace review: it produces a candidate bank against REAL
// publication data, prints it for a human to read, and writes a splice-ready
// fragment. It exists because the one thing a hand-typed bank cannot check is
// the one thing that fails silently. A game with no puzzle on the date it is
// banked for is not an error anywhere: gamesForSuffix skips it, the run becomes
// a four, the board's ceiling drops to 60, and no surface says so. The first
// hand-written bank named four games on dates their own banks do not reach.
//
// WHAT IT READS, and why each source is where it is:
//
//   lib/daily-games.js        the roster: key, cat, href, RETIRED_DAILY. The
//                             href matters because the puzzle directory is not
//                             always the key (jester -> jesters, park ->
//                             parker), which is the same correction the app
//                             makes.
//   app/<dir>/puzzles.js      which dates each game actually published. The
//                             banks are NOT written in one style: hand-authored
//                             ones read `quizId: 'lode-8-2-26'` while every
//                             GENERATED one is JSON-stringified as
//                             `"quizId":"lode-8-2-26"`. A regex that assumes
//                             one form finds ZERO puzzles in the other kind of
//                             bank, which reports as "published no puzzle" on
//                             every date rather than as a parse failure. Match
//                             both, and treat an empty set as UNREADABLE (the
//                             game is dropped from the pool) rather than empty.
//   scripts/verify-daily-five the per-game medians and the budget, parsed out of
//                             MED / BUDGET rather than duplicated here. Those
//                             numbers are a MEASUREMENT WITH A DATE ON IT, not
//                             a fact about the games, which is why they live in
//                             the checker and not in the library. One copy, and
//                             the generator cannot drift from the checker.
//   lib/daily-five.js         the existing bank, read for two reasons: the
//                             seven-day repeat rule has to see the frozen tail
//                             (a game used on 09-13 cannot run again before
//                             09-20), and the first unbanked date is where the
//                             extension starts.
//
// THE CONSTRAINTS IT SOLVES, which are exactly the checker's failures:
//
//   * five games, five DIFFERENT categories (rule 1);
//   * every game PUBLISHED that day, and not retired by it (RETIRED_DAILY);
//   * at least seven days between repeats of any one game (rule 3);
//   * the day's total inside the budget, Monday shorter (rule 2, the budget);
//   * the day ORDERED shortest first (rule 2, the ramp). This one is free: the
//     five are emitted sorted by median, so the ascent can never fail.
//
// And two soft preferences, which are the bank's character rather than its
// legality:
//
//   * the WORD + NUMBERS + LOGIC anchor plus two rotating, because those three
//     pools are the deep ones and anchoring on them is what makes the run read
//     as a puzzle sitting. It is a preference and not a law: late in a bank a
//     pool can thin out to fewer games than the gap rule needs, and a day with
//     no legal Numbers game is still a legal run.
//   * the rotating slots shared IN PROPORTION TO POOL SIZE. Implemented by
//     weighting each category's draw by how many of its games are AVAILABLE
//     that day, so the thin categories (Geography, Cards, Arcade: two games
//     each) are the occasional guest rather than a fixture, and the proportion
//     re-derives itself as pools shrink instead of being a hardcoded table.
//
// A GAME WITH NO MEASURED MEDIAN IS EXCLUDED. The checker warns "no timing for
// X — order and budget unchecked" for such a game, which would be a new warning
// on a bank that is supposed to ship clean, and an unmeasured game cannot be
// placed on the ramp anyway. Re-measure and add it to MED to bring it in.
//
// HOW FAR IT CAN GO. Before searching it runs a Hall-type bound: over any k
// consecutive days a category can supply at most min(games * ceil(k/7), k)
// slots, because the gap rule allows one appearance per seven days and a day
// takes at most one game per category. When that sum falls under 5k the bank
// CANNOT be filled for those days, whatever the search does, and the generator
// says so and stops rather than emitting a bank with a hole in it. That is the
// honest failure: a Daily Five day is only as long-lived as the shallowest
// category still publishing, so the fix is always to extend the underlying
// puzzle banks, never to loosen a rule here.
//
// Usage:
//   node scripts/gen-daily-five.mjs --end 2026-11-19
//   node scripts/gen-daily-five.mjs --end 2026-10-04 --out /tmp/five-new.js
//   node scripts/gen-daily-five.mjs --end 2026-10-04 --seed 7 --report
//
//   --start ISO   first day to bank. Defaults to the day after the last dated
//                 entry already in lib/daily-five.js, which is what an
//                 extension wants: the live bank is FROZEN and this only ever
//                 appends.
//   --end ISO     last day to try for. The generator stops at the deepest day
//                 it can legally reach and tells you where that was.
//   --out PATH    write the splice-ready rows here (default /tmp/five-new.js).
//                 It writes ROWS, not a whole file, because the live bank is
//                 frozen and the rows are appended to it by hand.
//   --seed N      RNG seed, so a reviewed bank can be reproduced exactly.
//   --report      print the category-share table and the per-day ramp.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(k);

// Deterministic RNG so a bank a human reviewed can be reproduced byte for byte.
let SEED = Number(arg('--seed', 20260821)) >>> 0;
const rnd = () => { SEED = (SEED * 1664525 + 1013904223) >>> 0; return SEED / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffled = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const isoRange = (a, b) => { const out = []; for (let t = Date.parse(a); t <= Date.parse(b); t += DAY) out.push(iso(t)); return out; };

// ── the roster ──────────────────────────────────────────────────────────────
const gamesSrc = readFileSync(join(ROOT, 'lib/daily-games.js'), 'utf8');
const CAT = {}, NAME = {}, HREF = {};
for (const m of gamesSrc.matchAll(/\{ key: '([a-z]+)',([^\n]*)\}/g)) {
  const key = m[1], rest = m[2];
  const c = /cat: '([A-Za-z ]+)'/.exec(rest);
  const n = /name: '([^']+)'/.exec(rest);
  const h = /href: '([^']+)'/.exec(rest);
  if (!c) continue;                       // a commented-out row (Pricer) has no cat here
  CAT[key] = c[1];
  NAME[key] = n ? n[1] : key;
  HREF[key] = h ? h[1] : `/${key}`;
}
const RETIRED = {};
for (const m of gamesSrc.matchAll(/RETIRED_DAILY = \{([^}]*)\}/g)) {
  for (const r of m[1].matchAll(/(\w+):\s*'([\d-]+)'/g)) RETIRED[r[1]] = r[2];
}

// ── the medians and the budget, off the checker ─────────────────────────────
const vfySrc = readFileSync(join(ROOT, 'scripts/verify-daily-five.mjs'), 'utf8');
// The medians moved to lib/game-medians.js on 2026-09-26 (the finish card reads
// them too); the checker imports them from there, so read the same copy.
import { GAME_MEDIANS } from '../lib/game-medians.js';
const MED = { ...GAME_MEDIANS };
if (!Object.keys(MED).length) throw new Error('lib/game-medians.js exported no medians');
const BUDGET = {};
{
  const b = /const BUDGET = \{([^}]*)\}/.exec(vfySrc);
  if (!b) throw new Error('could not find BUDGET in scripts/verify-daily-five.mjs');
  for (const m of b[1].matchAll(/(\w+):\s*(\d+)/g)) BUDGET[m[1]] = Number(m[2]);
}
const isMonday = (d) => new Date(Date.parse(d)).getUTCDay() === 1;
const budgetOf = (d) => (isMonday(d) ? [BUDGET.monLo, BUDGET.monHi] : [BUDGET.lo, BUDGET.hi]);

// ── who published when ──────────────────────────────────────────────────────
const dirs = new Set(readdirSync(join(ROOT, 'app'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name));
const PUB = {}, SKIPPED = [];
for (const key of Object.keys(CAT)) {
  const dir = (HREF[key] || `/${key}`).replace(/^\//, '');
  if (!dirs.has(dir)) { SKIPPED.push([key, 'no app directory']); continue; }
  let src;
  try { src = readFileSync(join(ROOT, 'app', dir, 'puzzles.js'), 'utf8'); }
  catch (e) { SKIPPED.push([key, 'no puzzles.js']); continue; }
  const set = new Set();
  // Both bank styles. See the note at the top: matching only one of them reads
  // as "published nothing", which is the most confidently wrong answer here.
  for (const m of src.matchAll(new RegExp(`["']?quizId["']?\\s*:\\s*['"]${key}-(\\d{1,2}-\\d{1,2}-\\d{2})['"]`, 'g'))) {
    const [M, D, Y] = m[1].split('-').map(Number);
    set.add(`20${String(Y).padStart(2, '0')}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`);
  }
  if (!set.size) { SKIPPED.push([key, 'puzzle bank unreadable (zero quizIds parsed)']); continue; }
  if (!MED[key]) { SKIPPED.push([key, 'no measured median in MED — would make the checker warn']); continue; }
  PUB[key] = set;
}
// Pricer is excluded on purpose: it is pulled from the server slate (GAME_PUZZLES
// in lib/daily-slate), so it has no board, no field and no points. A run cannot
// contain a game the scoring engine cannot see.
delete PUB.pricer;

const canRun = (key, d) => !!PUB[key] && PUB[key].has(d) && !(RETIRED[key] && d > RETIRED[key]);

// How many more consecutive days this game publishes from `day`, memoized. It is
// read once per game per candidate draw, and recomputing it by walking the
// calendar each time is what made a first cut of this script take minutes.
const runwayCache = new Map();
function runway(g, day) {
  const k = `${g}|${day}`;
  let v = runwayCache.get(k);
  if (v !== undefined) return v;
  v = 0;
  for (let x = Date.parse(day); canRun(g, iso(x)); x += DAY) v++;
  runwayCache.set(k, v);
  return v;
}

// ── the existing bank, for the gap history and the append point ─────────────
const fiveSrc = readFileSync(join(ROOT, 'lib/daily-five.js'), 'utf8');
const BANK = {};
for (const m of fiveSrc.matchAll(/'(\d{4}-\d{2}-\d{2})':\s*\[([^\]]*)\]/g)) {
  BANK[m[1]] = [...m[2].matchAll(/'([a-z]+)'/g)].map((x) => x[1]);
}
const banked = Object.keys(BANK).sort();
const START = arg('--start', banked.length ? iso(Date.parse(banked[banked.length - 1]) + DAY) : '2026-08-17');
const END = arg('--end', START);
const OUT = arg('--out', '/tmp/five-new.js');

// USED dates per game, seeded from the frozen tail so day one of the extension
// already obeys the seven-day rule against the bank it is being appended to.
// A SET of dates rather than a last-seen date, because the search does not run
// in calendar order (see solve) and the rule is symmetric: two appearances must
// be seven days apart whichever one was placed first.
const USED = new Map();
const markUsed = (m, g, d) => { let s = m.get(g); if (!s) { s = new Set(); m.set(g, s); } s.add(d); };
for (const d of banked) for (const k of BANK[d]) markUsed(USED, k, d);
const gapOk = (used, g, d) => {
  const s = used.get(g);
  if (!s) return true;
  for (const t of s) if (Math.abs(Date.parse(d) - Date.parse(t)) / DAY < GAP) return false;
  return true;
};

const ANCHORS = ['Word', 'Numbers', 'Logic'];
const GAP = 7;
// NO TWO RUNS MAY SHARE MORE THAN THIS MANY GAMES. The seven-day gap rule alone
// is not enough to stop a bank repeating itself: satisfy it exactly and the
// search happily emits the SAME FIVE seven days apart, which is legal and reads
// as one week of content on a fortnightly loop. A first cut of this generator
// did exactly that (2026-09-14 and 2026-09-21 came out identical, and three
// other pairs shared four of five), which is the pool-variety failure the daily
// authoring standard is about: per-day legality checks pass happily on a bank
// that says the same thing every week. Capped against EVERY other run in the
// bank, the frozen ones included.
const MAX_OVERLAP = Number(arg('--overlap', 1));

// ── the Hall-type bound ─────────────────────────────────────────────────────
// Over k consecutive days a category supplies at most min(games * ceil(k/7), k):
// the gap rule allows one appearance per seven days, and a day takes at most one
// game per category. Under 5k, no search can fill those days.
function firstImpossibleWindow(days) {
  const pool = Object.keys(PUB);
  for (let i = 0; i < days.length; i++) {
    // Counts are grown one day at a time rather than re-scanned per window, so
    // a two-month range is milliseconds instead of minutes.
    const hits = new Map();               // game -> days it publishes in [i, j]
    const byCat = new Map();              // cat  -> games with at least one
    for (let j = i; j < days.length; j++) {
      for (const g of pool) {
        if (!canRun(g, days[j])) continue;
        const n = (hits.get(g) || 0) + 1;
        hits.set(g, n);
        if (n === 1) {
          const c = CAT[g];
          if (!byCat.has(c)) byCat.set(c, []);
          byCat.get(c).push(g);
        }
      }
      const k = j - i + 1;
      const rep = Math.floor((k - 1) / 7) + 1;
      let cap = 0;
      for (const list of byCat.values()) cap += Math.min(list.length * rep, k);
      if (cap < 5 * k) {
        return { from: days[i], to: days[j], k, need: 5 * k, cap, byCat: Object.fromEntries(byCat) };
      }
    }
  }
  return null;
}

// ── the search ──────────────────────────────────────────────────────────────
// Depth-first over days with randomized candidate generation and backtracking.
// Ordering is not a constraint the search has to satisfy: a day is emitted
// sorted by median, so the ascent is true by construction.
const CANDS = Number(arg('--cands', 48));   // candidate sets tried per day
const NODES = Number(arg('--nodes', 400000));
// A day whose whole pool is this small is ENUMERATED rather than sampled; see
// candidates(). ENUM_CAP stops a merely-narrow day from producing a million sets.
const ENUM_MAX = Number(arg('--enum', 40));
const ENUM_CAP = Number(arg('--enumcap', 40000));

function candidates(day, used, catUse, dayGames) {
  const avail = {};
  for (const g of Object.keys(PUB)) {
    if (!canRun(g, day)) continue;
    if (!gapOk(used, g, day)) continue;
    (avail[CAT[g]] = avail[CAT[g]] || []).push(g);
  }
  const cats = Object.keys(avail);
  if (cats.length < 5) return [];
  const [lo, hi] = budgetOf(day);
  const total = cats.reduce((s, c) => s + avail[c].length, 0);
  // URGENCY is what makes a long extension possible at all. Most of the roster
  // stops publishing on one date and a handful of banks run months past it, so
  // a search that picks freely spends the long-lived games early and cannot
  // fill the tail, where they are the only thing left. Scoring every candidate
  // by how little runway its games have spends the expiring ones while they
  // exist and reserves the deep banks for the far end of the run.
  const urg = (g) => 1 / (1 + runway(g, day));
  const shareBonus = (set) => {
    // "In proportion to pool size", as a tie-break rather than a filter: a
    // category is preferred when it has more games available today relative to
    // how often it has already been spent, which keeps Geography / Cards /
    // Arcade (two games each) occasional guests without ever excluding them.
    let b = 0;
    for (const g of set) b += avail[CAT[g]].length / (5 + (catUse.get(CAT[g]) || 0));
    return b;
  };
  const out = [], seenSets = new Set();
  const overlaps = (set) => {
    for (const other of dayGames.values()) {
      let n = 0;
      for (const g of set) if (other.has(g)) n++;
      if (n > MAX_OVERLAP) return true;
    }
    return false;
  };
  const add = (set) => {
    const sum = set.reduce((s, g) => s + MED[g], 0);
    if (sum < lo || sum > hi) return;
    if (overlaps(set)) return;
    // The ramp is free: a day is emitted sorted by median, so "shortest first"
    // can never fail and the search never has to reason about order.
    const sorted = set.slice().sort((a, b) => MED[a] - MED[b] || a.localeCompare(b));
    const sig = sorted.join(',');
    if (seenSets.has(sig)) return;
    seenSets.add(sig);
    out.push({ set: sorted, score: sorted.reduce((s, g) => s + urg(g), 0) * 3 + shareBonus(sorted) + rnd() * 0.05 });
  };

  if (total <= ENUM_MAX) {
    // A NARROW DAY IS ENUMERATED, NOT SAMPLED. Late in the bank a day's whole
    // pool is thirty-odd games and the legal five-sets number in the thousands,
    // of which only a handful clear the budget. Sampling found roughly none of
    // them, which is why a sampled search stalled on the last five days every
    // time: the tail is close to an exact cover and has to be searched, not
    // guessed at.
    const combo = [];
    const walk = (ci, gi) => {
      if (out.length > ENUM_CAP) return;
      if (gi === 5) { add(combo.slice()); return; }
      for (let i = ci; i <= cats.length - (5 - gi); i++) {
        for (const g of avail[cats[i]]) { combo[gi] = g; walk(i + 1, gi + 1); }
      }
    };
    walk(0, 0);
  } else {
    for (let t = 0; t < CANDS * 20 && out.length < CANDS * 3; t++) {
      const chosen = [];
      for (const a of shuffled(ANCHORS)) if (avail[a] && chosen.length < 5) chosen.push(a);
      const rest = cats.filter((c) => !chosen.includes(c));
      const cw = (c) => avail[c].length / (1 + (catUse.get(c) || 0));
      while (chosen.length < 5 && rest.length) {
        let sum = rest.reduce((s, c) => s + cw(c), 0), r = rnd() * sum, idx = 0;
        for (; idx < rest.length - 1; idx++) { r -= cw(rest[idx]); if (r <= 0) break; }
        chosen.push(rest.splice(idx, 1)[0]);
      }
      if (chosen.length < 5) continue;
      const set = [];
      for (const c of chosen) {
        const pool = avail[c];
        let sum = 0; const w = pool.map((g) => { const v = urg(g) ** 3; sum += v; return v; });
        let r = rnd() * sum, idx = 0;
        for (; idx < pool.length - 1; idx++) { r -= w[idx]; if (r <= 0) break; }
        set.push(pool[idx]);
      }
      add(set);
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, CANDS).map((x) => x.set);
}

// How many DISTINCT categories can still supply a legal game on this day. Five
// is the floor: below it the day cannot be filled, whatever else happens.
function liveCats(day, used) {
  const cats = new Set();
  for (const g of Object.keys(PUB)) {
    if (cats.has(CAT[g])) continue;
    if (canRun(g, day) && gapOk(used, g, day)) cats.add(CAT[g]);
  }
  return cats.size;
}

// The same thing, itemised, for the message a dead day prints. Only ever called
// on a day that is already known to be short of five categories, so it can
// afford to build the map rather than count.
function liveByCat(day, used) {
  const out = new Map();
  for (const g of Object.keys(PUB)) {
    if (!canRun(g, day) || !gapOk(used, g, day)) continue;
    if (!out.has(CAT[g])) out.set(CAT[g], []);
    out.get(CAT[g]).push(g);
  }
  return out;
}

// A DAY CAN BE DEAD ON ITS OWN, and firstImpossibleWindow will not say so.
// That bound reasons about POOLS and knows nothing about the bank being
// extended, so it reports the smallest WINDOW it cannot cover and stays silent
// about the commonest way an extension actually dies: the last week of the live
// bank has already spent thirty distinct games, the seven-day gap rule blocks
// every one of them, and day one of the extension is left with four categories
// to fill five slots. That is exactly what happened on 2026-08-21 — the window
// bound pointed at a six-day stretch while the real wall was the FIRST day.
//
// Because placing a game only ever REMOVES options from the days around it,
// liveCats seeded with the frozen history is an upper bound: a day under five
// here cannot be filled by any search, at any budget, on any seed. Checked
// before searching, and the bank is contiguous, so the first dead day is the
// wall.
function deadDays(list) {
  const seeded = new Map();
  for (const [g, set] of USED) seeded.set(g, new Set(set));
  const out = [];
  for (const d of list) {
    const n = liveCats(d, seeded);
    if (n < 5) out.push([d, n, liveByCat(d, seeded)]);
  }
  return out;
}

function solve(days) {
  // MOST-CONSTRAINED DAY FIRST, with forward checking. Two things make a plain
  // calendar-order search fail here, and both are about the same fact: most of
  // the roster stops publishing on one date and a handful of banks run months
  // past it. Filling in date order spends those deep banks in the wide-open
  // first week and then cannot fill the last one (a calendar-order search
  // reached 19 of 21 days on every seed), and the tail is tight enough that a
  // day placed there has to be placed while the deep banks are unspent. The gap
  // rule is symmetric, so the order days are PLACED in is free, and placing the
  // day with the fewest legal games left is the standard answer. After each
  // placement every unplaced day is checked for five live categories, which
  // prunes a doomed branch at the point it goes wrong instead of at the far end.
  const chosen = new Array(days.length).fill(null);
  const used = new Map();
  for (const [g, set] of USED) used.set(g, new Set(set));
  const dayGames = new Map();
  for (const d of banked) dayGames.set(d, new Set(BANK[d]));
  const catUse = new Map();
  const stopAt = Date.now() + Number(arg('--seconds', 60)) * 1000;
  let nodes = 0, deepest = 0, deepestRun = null;
  function go(placed) {
    if (placed > deepest) { deepest = placed; deepestRun = chosen.slice(); }
    if (placed === days.length) return true;
    if (nodes++ > NODES || Date.now() > stopAt) return false;
    let pickI = -1, pickN = Infinity;
    for (let i = 0; i < days.length; i++) {
      if (chosen[i]) continue;
      let n = 0;
      for (const g of Object.keys(PUB)) if (canRun(g, days[i]) && gapOk(used, g, days[i])) n++;
      if (n < pickN) { pickN = n; pickI = i; }
    }
    const day = days[pickI];
    for (const set of candidates(day, used, catUse, dayGames)) {
      for (const g of set) { markUsed(used, g, day); catUse.set(CAT[g], (catUse.get(CAT[g]) || 0) + 1); }
      dayGames.set(day, new Set(set));
      chosen[pickI] = set;
      let ok = true;
      for (let i = 0; i < days.length && ok; i++) if (!chosen[i] && liveCats(days[i], used) < 5) ok = false;
      if (ok && go(placed + 1)) return true;
      chosen[pickI] = null;
      dayGames.delete(day);
      for (const g of set) { used.get(g).delete(day); catUse.set(CAT[g], catUse.get(CAT[g]) - 1); }
    }
    return false;
  }
  const ok = go(0);
  const rows = ok ? chosen : (deepestRun || chosen);
  return { ok, rows, reached: ok ? days.length : deepest };
}

// ── run ─────────────────────────────────────────────────────────────────────
const days = isoRange(START, END);
console.log(`gen-daily-five: ${days.length} day(s) to bank, ${START} to ${END}`);
console.log(`                ${Object.keys(PUB).length} games in the pool, seed ${arg('--seed', 20260821)}`);
for (const [k, why] of SKIPPED) console.log(`  skip  ${k}: ${why}`);

const dead = deadDays(days);
let live = days;
if (dead.length) {
  console.log(`\n  DEAD DAY${dead.length === 1 ? '' : 'S'}  fewer than five categories can supply a legal game, so no search can fill ${dead.length === 1 ? 'it' : 'them'}:`);
  for (const [d, n, byCat] of dead.slice(0, 8)) {
    const listed = [...byCat.entries()].sort().map(([c, gs]) => `${c}[${gs.join(' ')}]`).join('  ');
    console.log(`            ${d}  ${n} categor${n === 1 ? 'y' : 'ies'}  ${listed || '(nothing left)'}`);
  }
  if (dead.length > 8) console.log(`            ... and ${dead.length - 8} more`);
  const wall = dead[0][0];
  live = days.slice(0, days.indexOf(wall));
  console.log(`            The bank is contiguous, so ${wall} is the wall. Extend the underlying puzzle banks.`);
  if (!live.length) {
    console.log(`\nnothing to bank: ${wall} is the first day asked for and it cannot be filled.`);
    writeFileSync(OUT, '');
    process.exit(0);
  }
}

const bad = firstImpossibleWindow(live);
let target = live;
if (bad) {
  console.log(`\n  IMPOSSIBLE  ${bad.from} .. ${bad.to} (${bad.k} days) needs ${bad.need} slots and the pools can supply ${bad.cap}.`);
  for (const c of Object.keys(bad.byCat).sort()) console.log(`              ${c}: ${bad.byCat[c].length} game(s) still publishing — ${bad.byCat[c].join(', ')}`);
  console.log(`              Extend the underlying puzzle banks. Truncating the run to end before ${bad.to}.`);
  const cut = live.indexOf(bad.to);
  target = live.slice(0, Math.max(0, cut));
  // Walk back until the truncated range itself carries no impossible window.
  while (target.length && firstImpossibleWindow(target)) target = target.slice(0, -1);
}

const { ok, rows, reached } = solve(target);
if (!ok) console.log(`\n  SEARCH reached only ${reached} of ${target.length} day(s) — raise --nodes or --cands, or reseed.`);

// Rows are emitted in the live bank's own shape, padded to the column its
// trailing comments already sit in, so an extension can be pasted straight in
// and the file still reads as one document. The comment carries the day, the
// run's total and the per-game medians, all in top-10 seconds, so a reviewer
// can see the ramp and the budget without re-deriving either.
const out = [];
const WEEK0 = Number(arg('--week', Math.floor(banked.length / 7) + 1));
const COL = 67;
let prevWeek = null;
for (let i = 0; i < rows.length; i++) {
  const d = target[i], set = rows[i];
  if (!set) continue;
  const meds = set.map((g) => MED[g]);
  const total = meds.reduce((a, b) => a + b, 0);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.parse(d)).getUTCDay()];
  const week = Math.floor(i / 7);
  if (week !== prevWeek) { out.push(`  // ── week ${WEEK0 + week} `.padEnd(79, '─')); prevWeek = week; }
  const clock = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  const head = `  '${d}': [${set.map((g) => `'${g}'`).join(', ')}],`;
  out.push(`${head.padEnd(COL)}// ${dow}  ${clock.padStart(5)}  ${meds.join('/')}`);
}
writeFileSync(OUT, out.join('\n') + '\n');
const filled = rows.filter(Boolean).length;
console.log(`\nwrote ${filled} row(s) to ${OUT}${filled ? ` (${target[0]} .. ${target[target.length - 1]})` : ''}`);

if (flag('--report')) {
  const catCount = {}, gameCount = {};
  for (const set of rows.filter(Boolean)) for (const g of set) {
    catCount[CAT[g]] = (catCount[CAT[g]] || 0) + 1;
    gameCount[g] = (gameCount[g] || 0) + 1;
  }
  console.log(`\ncategory share over the new range (${filled} runs, ${filled * 5} slots):`);
  for (const [c, n] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(18)} ${String(n).padStart(3)}  ${(100 * n / (filled * 5)).toFixed(1)}%`);
  }
  console.log(`\n${Object.keys(gameCount).length} distinct games, most-used first:`);
  const list = Object.entries(gameCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  console.log('  ' + list.map(([g, n]) => `${g}×${n}`).join('  '));
}
