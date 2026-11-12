#!/usr/bin/env node
// Build new Outrank boards. Deterministic: same flags in, byte-identical boards out.
//
//   node scripts/gen-outrank.mjs --from 2026-09-30 --days 62 --startnum 72 \
//        --avoid app/outrank/puzzles.js --out /tmp/outrank-new.js --seed 20260930
//
// or, the house one-liner that splices without ever touching a frozen board:
//
//   node scripts/_append.mjs outrank gen-outrank.mjs 2026-11-30
//
// WHAT IT BUILDS. One themed slate a day: six items on a weekday, SEVEN on a
// Sunday Edition. Themes, flavor copy and the authored crowd ranking come from
// scripts/outrank-slates.mjs; this file decides which slate lands on which day,
// turns each authored ranking into a 40-vote `house` crowd, and hand-mixes the
// display order so `items` never leaks the answer.
//
// ══════════════════════════════════════════════════════════════════════════════
// WHERE THE NUMBERS COME FROM. READ THIS BEFORE CHANGING A LADDER.
// ══════════════════════════════════════════════════════════════════════════════
// `house` IS THE ANSWER KEY, AND IT IS AN AUTHORED ESTIMATE OF CROWD BEHAVIOR.
// It is not observed play, it has never been observed play, and nothing in this
// pipeline turns it into observed play. Concretely:
//
//   * the author writes each slate's items in the order they believe a broad,
//     international crowd would vote them, most-popular first, and tags the
//     slate steep / mid / flat for how lopsided they think that crowd is
//     (scripts/outrank-slates.mjs);
//   * this generator lays one of a set of enumerated VOTE LADDERS over that
//     ranking — 40 favorite votes split, say, 12/9/7/5/4/3 — and emits the
//     result as 40 item indices.
//
// So a house array is a guess with a shape, dressed as 40 ballots. That is a
// legitimate thing for this game to ship, because `house` exists only to give
// the day's first players a plausible field to be scored against:
// lib/outrank-score.js retires it POOL-WIDE the moment an eleventh real player
// locks in (HOUSE_CUTOFF), and from then on the crowd order is real votes only.
// What would NOT be legitimate is presenting it as measurement, so the puzzle
// file's header says the same thing this comment does. If someone later seeds a
// board from real `outrank_picks` rows, that board should say so and this note
// should stop covering it.
//
// The one thing the numbers are checked against is the AUTHORED RANKING: after
// apportionment the generator asserts that the emitted crowd still ranks the
// items in exactly the order the author wrote them.
//
// ══════════════════════════════════════════════════════════════════════════════
// THE DESIGN QUESTION THIS GENERATOR EXISTS TO ANSWER
// ══════════════════════════════════════════════════════════════════════════════
// The player votes a favorite and then calls the order the rest of the room put
// the slate in. That only pays for insight if the crowd's order is GUESSABLE BUT
// NOT OBVIOUS. Two ways to fail, and both are visible in the count vector:
//
//   * ONE ITEM OBVIOUSLY WINS AND THE REST ARE INTERCHANGEABLE. The top slot is
//     free and the other five are a lottery. Guarded by capping the favorite at
//     14 of 40 (35%) and requiring at least two boundaries below it to be worth
//     more than a coin flip.
//   * NOBODY HAS A FEELING ABOUT ANY OF IT. Six near-equal counts, five coin
//     flips in a row, and reading the room is worth nothing. Guarded by
//     requiring a real favorite (2-5 clear of the runner-up) and by capping how
//     many one-vote boundaries a board may carry.
//
// The bands, on the 40 favorite votes, weekday (K=6) then Sunday (K=7):
//
//   ALL COUNTS DISTINCT   the standing rule (CLAUDE-QUIZZES 7a). crowdOrderOf
//                         breaks a tie on DISPLAY INDEX, and the display order
//                         is hand-mixed and carries no signal, so a tie makes
//                         that boundary of the answer key a coin toss — the
//                         Outrank analog of a Links/Crux double solution.
//   NO ZERO-VOTE ITEM     an item nobody picked is dead weight, not a slate
//                         member.
//   FAVORITE   weekday 11-14 of 40 (27-35%)   Sunday 8-12 (20-30%)
//   MARGIN     2-5 clear of the runner-up, both days. Under 2 the top slot is a
//              coin flip; over 5 the favorite has run away with it.
//   TAIL       weekday >= 2, Sunday >= 1. Seven distinct counts summing to 40
//              simply cannot all clear 2, which is why the Sunday floor is 1.
//   CLOSE CALLS  the number of adjacent boundaries exactly ONE vote apart:
//              weekday 1-3 of five, Sunday 2-5 of six. At least one, so every
//              board has a genuine argument in it; never so many that the whole
//              order is a chain of coin flips.
//
//   THE SUNDAY RAMP is both halves at once: SEVEN items (14 points instead of
//   12) AND a crowd that is harder to read — the favorite is capped two votes
//   lower (12 vs 14) and the board must carry at least two one-vote boundaries
//   instead of one. verify-daily-banks re-derives both from the emitted counts.
//
// Ladders are not hand-written: LADDERS below ENUMERATES every count vector
// that satisfies the band for its K, then buckets by favorite size into
// flat / mid / steep. A slate's authored `shape` picks the bucket. That way the
// band is stated once and no ladder can drift out of it.
//
// ══════════════════════════════════════════════════════════════════════════════
// POOL VARIETY CEILINGS (CLAUDE.md "Extending a puzzle bank in bulk" #3). Per-
// board legality passes happily on a bank that says the same thing every day.
// Enforced here and re-checked independently in scripts/verify-daily-banks.mjs:
//
//   * THEME     no theme may repeat one already in the bank or another new one.
//               (The verifier has always enforced this bank-wide.)
//   * CATEGORY  a slate carries a `cat` (food, animals, places, nature, screen,
//               music, words, sport, science, home, life, time, games, craft,
//               myth, drink). One category may fill at most CAT_CEIL = 8 of the
//               62 new boards (13%), and never two days running. This is the
//               ceiling that matters most here: the FROZEN bank is 32 food-or-
//               drink boards out of 71 (45%), five of them variations on the
//               same supermarket aisle. New boards hold food to the same 8 as
//               everything else.
//   * ITEM      one item string may appear on at most ITEM_CEIL = 2 boards
//               across the WHOLE bank, frozen boards included. The frozen bank
//               already sits at exactly 2 for six strings (pineapple, sausage,
//               Chick-fil-A, watermelon, Australia, fish), so those are spent
//               and the generator refuses to reuse them. An item may also never
//               run on BACK-TO-BACK days: a callback two months later reads as
//               range, the same word two mornings running reads as an oversight.
//   * SHAPE     one house count vector may shape at most VEC_CEIL = 4 of the 62
//               new boards, so the reveal's bar chart is not the same picture
//               every week. (The frozen bank runs 10-8-7-6-5-4 six times; that
//               is history and the verifier grandfathers it.)
//
// ══════════════════════════════════════════════════════════════════════════════
// THE DISPLAY MIX. `items` is what the browser receives, and the header of
// app/outrank/puzzles.js promises it is hand-mixed and never the expected
// ranking. So the emitted order must not be readable as the answer:
//
//   * it is never the crowd order, and never its exact reverse;
//   * the crowd's favorite never sits in display slot 0;
//   * at least three items sit two or more slots away from their crowd rank.
//
// ══════════════════════════════════════════════════════════════════════════════
// WHAT THE FROZEN BANK TAUGHT ME, so the next person does not re-derive it:
//
//   * `house` is emitted SORTED ASCENDING in the frozen bank (all the 0s, then
//     all the 1s...), not shuffled. It is read only as a multiset, so order
//     carries nothing; matching the existing shape keeps the diff readable.
//   * Two frozen boards (#1 Breakfast classics, #2 Pizza toppings) carry TIED
//     house counts and so have an arbitrary boundary in their answer key. They
//     went live before the distinct-counts rule existed and are grandfathered
//     as notes; never repair them.
//   * The frozen bank's weekday favorite runs as high as 16 of 40 (Amusement
//     park rides, Household chores, Pets). At 40% the top slot is free. New
//     boards cap at 14.
//   * Nine frozen weekday boards leave an item on ONE vote, which makes last
//     place free as well. New weekday boards floor the tail at 2; Sunday cannot,
//     for the arithmetic reason above.
//   * The frozen bank never reuses an item string more than twice, so a bank-
//     wide ceiling of 2 needs no grandfathering.
//
// SEEDING. --seed is offset by the starting board number before use, so a
// segment banked at num 72 cannot replay the stream that produced num 1.
import fs from 'node:fs';
import { SLATES } from './outrank-slates.mjs';

// ─────────────────────────── args ────────────────────────────────────────────
// Accepts both house spellings: --days=62 and --days 62 (scripts/_append.mjs
// passes the second form).
const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const s = argv[i];
  if (!s.startsWith('--')) continue;
  const eq = s.indexOf('=');
  if (eq !== -1) args[s.slice(2, eq)] = s.slice(eq + 1);
  else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) args[s.slice(2)] = argv[++i];
  else args[s.slice(2)] = true;
}
const FROM = String(args.from || '2026-09-30');
const DAYS = +(args.days || 62);
const STARTNUM = +(args.startnum || 72);
const OUT = args.out || null;
const AVOID = args.avoid ? String(args.avoid).split(',') : [];
// HARD RULE: offset the seed by the starting board number so a new segment can
// never replay the frozen one.
const SEED0 = (+(args.seed || 20260930) ^ Math.imul(STARTNUM, 2654435761)) >>> 0;

// ─────────────────────────── deterministic rng ───────────────────────────────
let SEED = SEED0 | 0;
const reseed = (n) => { SEED = (SEED0 ^ Math.imul(n + 1, 0x9e3779b1)) | 0; };
const rng = () => { SEED |= 0; SEED = (SEED + 0x6D2B79F5) | 0; let t = Math.imul(SEED ^ (SEED >>> 15), 1 | SEED); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (n) => Math.floor(rng() * n);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ─────────────────────────── constants ───────────────────────────────────────
const POOL = 40;                 // house favorite votes per board (documented size)
const CAT_CEIL = Math.ceil(8 * DAYS / 62);   // max new boards one category may fill: 8 of 62, as a rate (lane-d, 2026-11-12)
const ITEM_CEIL = 2;             // max boards one item string may appear on, BANK-WIDE
const VEC_CEIL = Math.ceil(4 * DAYS / 62);   // max new boards one house count vector may shape: 4 of 62, as a rate
const MIX_MOVED = 3;             // items that must sit >= 2 slots off their crowd rank
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The band, written once. `K` is the slate size.
const BAND = {
  6: { favLo: 11, favHi: 14, marLo: 2, marHi: 5, tailLo: 2, closeLo: 1, closeHi: 3 },
  7: { favLo: 8, favHi: 12, marLo: 2, marHi: 5, tailLo: 1, closeLo: 2, closeHi: 5 },
};

// Band checks, expressed on the emitted counts and nothing else, so the same
// reasoning can be (and is) restated in the verifier from the rule rather than
// imported from here.
function bandErrors(K, desc) {
  const e = [];
  const b = BAND[K];
  if (!b) return [`no band for ${K} items`];
  if (desc.length !== K) e.push(`${desc.length} counts for ${K} items`);
  if (desc.reduce((a, x) => a + x, 0) !== POOL) e.push(`votes != ${POOL}`);
  if (new Set(desc).size !== desc.length) e.push('tied counts: the crowd order would be ambiguous');
  if (desc[desc.length - 1] < b.tailLo) e.push(`tail ${desc[desc.length - 1]} < ${b.tailLo}`);
  if (desc[0] < b.favLo || desc[0] > b.favHi) e.push(`favorite ${desc[0]} outside ${b.favLo}-${b.favHi}`);
  const mar = desc[0] - desc[1];
  if (mar < b.marLo || mar > b.marHi) e.push(`favorite ${mar} clear of the runner-up, want ${b.marLo}-${b.marHi}`);
  let close = 0;
  for (let i = 0; i < desc.length - 1; i++) if (desc[i] - desc[i + 1] === 1) close++;
  if (close < b.closeLo || close > b.closeHi) e.push(`${close} one-vote boundaries, want ${b.closeLo}-${b.closeHi}`);
  return e;
}

// ─────────────────────────── vote ladders ────────────────────────────────────
// Enumerate every count vector inside the band, then bucket by favorite size.
// Bucketing by the favorite is what makes 'steep' mean steep: a slate the author
// believes has one clear winner gets the largest favorite the band allows.
function enumerateLadders(K) {
  const out = [];
  const rec = (rem, slots, prev, acc) => {
    if (!slots) { if (!rem) out.push([...acc].reverse()); return; }
    for (let v = prev + 1; ; v++) {
      let minRest = 0;
      for (let i = 0; i < slots; i++) minRest += v + i;
      if (minRest > rem) break;
      acc.push(v); rec(rem - v, slots - 1, v, acc); acc.pop();
    }
  };
  rec(POOL, K, 0, []);                      // ascending, strictly increasing
  return out.filter((desc) => !bandErrors(K, desc).length);
}
const LADDERS = {};
for (const K of [6, 7]) {
  const all = enumerateLadders(K);
  const tops = [...new Set(all.map((v) => v[0]))].sort((a, b) => a - b);
  // Three families across the band's favorite range: flattest third, middle,
  // steepest third. With K=7 the arithmetic squeezes the range to 10-12, which
  // is itself the Sunday ramp: a Sunday crowd cannot run away from the pack.
  const cut = (lo, hi) => all.filter((v) => v[0] >= lo && v[0] <= hi);
  const n = tops.length;
  const flatTop = tops[0];
  const steepTop = tops[n - 1];
  LADDERS[K] = {
    flat: cut(flatTop, flatTop),
    mid: cut(tops[1] ?? flatTop, tops[n - 2] ?? steepTop),
    steep: cut(steepTop, steepTop),
  };
  for (const [fam, list] of Object.entries(LADDERS[K])) {
    if (!list.length) { console.error(`gen-outrank: no ${fam} ladder for K=${K}`); process.exit(1); }
    for (const l of list) {
      const e = bandErrors(K, l);
      if (e.length) { console.error(`ladder K=${K} ${fam} [${l}]: ${e.join('; ')}`); process.exit(1); }
    }
  }
}

// ─────────────────────────── the frozen bank ─────────────────────────────────
// Read the themes and item strings already spent, so nothing new collides.
const usedThemes = new Set();
const itemUse = new Map();                  // lowercased item -> boards it is on
for (const f of AVOID) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/^\s*theme:\s*"((?:[^"\\]|\\.)*)"/gm)) usedThemes.add(JSON.parse(`"${m[1]}"`));
  for (const m of txt.matchAll(/^\s*items:\s*\[(.*)\]\s*,\s*$/gm)) {
    for (const it of JSON.parse(`[${m[1]}]`)) itemUse.set(it.toLowerCase(), (itemUse.get(it.toLowerCase()) || 0) + 1);
  }
}

// ─────────────────────────── the calendar ────────────────────────────────────
const dates = [];
{
  const d = new Date(`${FROM}T12:00:00Z`);
  for (let i = 0; i < DAYS; i++) { dates.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
}
const isSunday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;

// ─────────────────────────── slate pool ──────────────────────────────────────
const errors = [];
// SPENT SLATES (2026-11-12, lane-d restock). outrank-slates.mjs is the append-
// only record of every slate ever written, so on a second extension most of it
// is already banked. A slate whose theme is in the --avoid bank is SPENT and is
// dropped here before anything is checked or scheduled; it can never be dealt
// again. (Until this restock the pool held only unbanked slates, so a banked
// theme in it was an authoring error and failed the run; that stays true for a
// theme that repeats INSIDE the pool, checked below.)
const spent = SLATES.filter((s) => usedThemes.has(s.theme)).length;
const pool = SLATES.filter((s) => !usedThemes.has(s.theme)).map((s, i) => ({ ...s, id: i, K: s.ranked.length, sun: !!s.sunday }));
if (spent) process.stderr.write(`gen-outrank: ${spent} spent slates skipped, ${pool.length} in play\n`);
for (const s of pool) {
  if (s.K !== (s.sun ? 7 : 6)) errors.push(`${s.theme}: ${s.K} items on a ${s.sun ? 'Sunday' : 'weekday'} slate`);
  if (new Set(s.ranked.map((x) => x.toLowerCase())).size !== s.K) errors.push(`${s.theme}: duplicate item`);
  if (!LADDERS[s.K][s.shape]) errors.push(`${s.theme}: unknown shape ${s.shape}`);
}
{
  const seen = new Set();
  for (const s of pool) { if (seen.has(s.theme)) errors.push(`${s.theme}: theme repeats inside the pool`); seen.add(s.theme); }
}
if (errors.length) { console.error('gen-outrank: bad slate pool'); errors.forEach((e) => console.error('  ' + e)); process.exit(1); }

// ─────────────────────────── scheduling ──────────────────────────────────────
// Walk the calendar in order. Each day takes a slate of the right size whose
// category is not yesterday's, is not at CAT_CEIL, and whose items have room
// under the bank-wide ITEM_CEIL. Preference goes to the category placed FEWEST
// times so far, then to the one with the most unplaced slates left, rng breaking
// what remains. Round-robin first is what keeps the segment broad: the pool has
// 71 slates for 62 days, and a "biggest bucket first" rule spends the slack by
// stranding the small categories, which is the opposite of the point. The whole
// pass restarts with a fresh stream if it ever paints itself into a corner,
// which keeps it deterministic without a backtracking search.
function schedule() {
  for (let attempt = 0; attempt < 200; attempt++) {
    reseed(attempt);
    const left = new Set(pool.map((s) => s.id));
    const catCount = new Map();
    const itemNow = new Map(itemUse);
    const plan = [];
    let prevCat = null;
    let prevItems = new Set();
    let dead = false;
    for (const iso of dates) {
      const sun = isSunday(iso);
      const cands = [...left].map((id) => pool[id]).filter((s) => s.sun === sun
        && s.cat !== prevCat
        && (catCount.get(s.cat) || 0) < CAT_CEIL
        && s.ranked.every((it) => (itemNow.get(it.toLowerCase()) || 0) < ITEM_CEIL)
        && s.ranked.every((it) => !prevItems.has(it.toLowerCase())));
      if (!cands.length) { dead = true; break; }
      const remainingIn = (c) => [...left].filter((id) => pool[id].cat === c).length;
      const rank = (s) => (catCount.get(s.cat) || 0) * 1000 - remainingIn(s.cat);
      const best = Math.min(...cands.map(rank));
      const tier = cands.filter((s) => rank(s) === best);
      const pick = tier[ri(tier.length)];
      left.delete(pick.id);
      catCount.set(pick.cat, (catCount.get(pick.cat) || 0) + 1);
      for (const it of pick.ranked) itemNow.set(it.toLowerCase(), (itemNow.get(it.toLowerCase()) || 0) + 1);
      plan.push({ iso, sun, slate: pick });
      prevCat = pick.cat;
      prevItems = new Set(pick.ranked.map((it) => it.toLowerCase()));
    }
    if (!dead) return { plan, catCount, attempt };
  }
  console.error('gen-outrank: could not schedule the calendar inside the variety ceilings');
  process.exit(1);
}
const { plan, catCount, attempt: schedAttempt } = schedule();

// ─────────────────────────── boards ──────────────────────────────────────────
// Lay a ladder over the authored ranking, then hand-mix the display order.
const vecUse = new Map();
const boards = [];
plan.forEach((day, idx) => {
  reseed(1000 + idx);
  const s = day.slate;
  const K = s.K;
  const fam = LADDERS[K][s.shape];

  // Ladder: the least-used vector in this family, rng breaking ties, so a bank
  // cannot be read off its bar chart.
  const key = (v) => `${K}:${v.join('-')}`;
  const lo = Math.min(...fam.map((v) => vecUse.get(key(v)) || 0));
  const tier = shuffle(fam.filter((v) => (vecUse.get(key(v)) || 0) === lo));
  const desc = tier[0];
  if ((vecUse.get(key(desc)) || 0) >= VEC_CEIL) errors.push(`${s.theme}: count vector ${key(desc)} is at the ceiling ${VEC_CEIL}`);
  vecUse.set(key(desc), (vecUse.get(key(desc)) || 0) + 1);

  // DISPLAY MIX. `perm[j]` is the crowd rank of whatever sits in display slot j.
  let perm = null;
  for (let t = 0; t < 400 && !perm; t++) {
    const cand = shuffle([...Array(K).keys()]);
    if (cand.every((r, j) => r === j)) continue;                       // = crowd order
    if (cand.every((r, j) => r === K - 1 - j)) continue;               // = its reverse
    if (cand[0] === 0) continue;                                      // favorite in slot 0
    if (cand.filter((r, j) => Math.abs(r - j) >= 2).length < MIX_MOVED) continue;
    perm = cand;
  }
  if (!perm) { errors.push(`${s.theme}: could not mix a display order`); return; }

  const items = perm.map((r) => s.ranked[r]);
  const counts = perm.map((r) => desc[r]);                            // votes per DISPLAY slot
  const house = [];
  for (let j = 0; j < K; j++) for (let n = 0; n < counts[j]; n++) house.push(j);
  house.sort((a, b) => a - b);

  // ASSERT THE AUTHORED RANKING SURVIVED. The emitted crowd must rank the items
  // in exactly the order the author wrote them.
  const emitted = counts.map((c, j) => ({ c, j })).sort((a, b) => b.c - a.c || a.j - b.j).map((x) => items[x.j]);
  if (emitted.join('|') !== s.ranked.join('|')) errors.push(`${s.theme}: emitted crowd order does not match the authored ranking`);
  for (const e of bandErrors(K, [...counts].sort((a, b) => b - a))) errors.push(`${s.theme}: ${e}`);
  if (house.length !== POOL) errors.push(`${s.theme}: ${house.length} house votes`);

  const [Y, M, D] = day.iso.split('-').map(Number);
  boards.push({
    num: STARTNUM + idx,
    quizId: `outrank-${M}-${D}-${String(Y).slice(2)}`,
    live: day.iso,
    dateLabel: `${MON[M - 1]} ${D}, ${Y}`,
    sunday: day.sun,
    theme: s.theme,
    flavor: s.flavor,
    items,
    house,
    cat: s.cat,
  });
});

// ─────────────────────────── whole-bank ceilings ─────────────────────────────
{
  const itemNow = new Map(itemUse);
  for (const b of boards) for (const it of b.items) {
    const k = it.toLowerCase();
    itemNow.set(k, (itemNow.get(k) || 0) + 1);
  }
  for (const [k, n] of itemNow) if (n > ITEM_CEIL) errors.push(`item "${k}" appears on ${n} boards bank-wide (ceiling ${ITEM_CEIL})`);
  for (const [k, n] of vecUse) if (n > VEC_CEIL) errors.push(`count vector ${k} shapes ${n} boards (ceiling ${VEC_CEIL})`);
  for (const [k, n] of catCount) if (n > CAT_CEIL) errors.push(`category ${k} fills ${n} boards (ceiling ${CAT_CEIL})`);
  for (let i = 1; i < boards.length; i++) {
    if (boards[i].cat === boards[i - 1].cat) errors.push(`${boards[i].live}: category ${boards[i].cat} runs two days`);
    const prevSet = new Set(boards[i - 1].items.map((x) => x.toLowerCase()));
    for (const it of boards[i].items) if (prevSet.has(it.toLowerCase())) errors.push(`${boards[i].live}: item "${it}" also ran yesterday`);
  }
  const themes = new Set();
  for (const b of boards) { if (themes.has(b.theme) || usedThemes.has(b.theme)) errors.push(`theme reused: ${b.theme}`); themes.add(b.theme); }
  if (boards.length !== DAYS) errors.push(`${boards.length} boards for ${DAYS} days`);
}
if (errors.length) {
  console.error(`gen-outrank: ${errors.length} quality failures, nothing written`);
  errors.slice(0, 40).forEach((e) => console.error('  ' + e));
  process.exit(1);
}

// ─────────────────────────── emit ────────────────────────────────────────────
// Matches the bank's own text shape exactly: unquoted keys, double-quoted
// strings, items on one line, house on one line.
const jstr = (s) => JSON.stringify(s);
const body = boards.map((b) => [
  '  {',
  `    num: ${b.num},`,
  `    quizId: ${jstr(b.quizId)},`,
  `    live: ${jstr(b.live)},`,
  `    dateLabel: ${jstr(b.dateLabel)},`,
  `    sunday: ${b.sunday},`,
  `    theme: ${jstr(b.theme)},`,
  `    flavor: ${jstr(b.flavor)},`,
  `    items: [${b.items.map(jstr).join(', ')}],`,
  `    house: [${b.house.join(', ')}],`,
  '  }',
].join('\n')).join(',\n');
const text = `export const PUZZLES = [\n${body}\n];\n`;
if (OUT) fs.writeFileSync(OUT, text); else process.stdout.write(text);

// ─────────────────────────── report ──────────────────────────────────────────
const sundays = boards.filter((b) => b.sunday).length;
process.stderr.write(`outrank: ${boards.length} boards, ${boards[0].live} to ${boards[boards.length - 1].live}, ${sundays} Sunday Editions (schedule attempt ${schedAttempt})\n`);
process.stderr.write(`  categories  ${[...catCount].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')} (ceiling ${CAT_CEIL})\n`);
process.stderr.write(`  shapes      ${['flat', 'mid', 'steep'].map((f) => `${f} ${plan.filter((d) => d.slate.shape === f).length}`).join(', ')}\n`);
process.stderr.write(`  vectors     ${vecUse.size} distinct, max reuse ${Math.max(...vecUse.values())} (ceiling ${VEC_CEIL})\n`);
{
  const itemNow = new Map(itemUse);
  for (const b of boards) for (const it of b.items) itemNow.set(it.toLowerCase(), (itemNow.get(it.toLowerCase()) || 0) + 1);
  const twice = [...itemNow].filter(([, n]) => n === ITEM_CEIL).length;
  process.stderr.write(`  items       ${itemNow.size} distinct bank-wide, ${twice} used twice, none more (ceiling ${ITEM_CEIL})\n`);
}
process.stderr.write(`  favorites   ${boards.map((b) => { const c = {}; for (const v of b.house) c[v] = (c[v] || 0) + 1; return Math.max(...Object.values(c)); }).reduce((a, x) => a + x, 0) / boards.length} votes of ${POOL} on average\n`);
if (OUT) process.stderr.write(`wrote ${boards.length} boards to ${OUT}\n`);
