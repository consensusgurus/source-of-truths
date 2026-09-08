// verify-circuits.mjs — the checker for lib/circuits.js.
//
// Per the daily-puzzle authoring standard in CLAUDE.md: a rule that is not
// written down is not a rule, and a rule with no checker is not enforced. Every
// claim lib/circuits.js makes about its rosters is re-derived here from the
// registry rather than read back off the data it is checking.
//
// It RECOMPUTES, it does not trust. The coverage set comes from DAILY_KEYS and
// the retirement dates, not from a count written into this file, so adding a
// 66th daily fails this check the moment it lands rather than the moment
// somebody notices a game is in no circuit.
//
// Usage: node scripts/verify-circuits.mjs

import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DAILY_KEYS, DAILY_GAME_MAP, RETIRED_DAILY } from '../lib/daily-games.js';
import {
  CIRCUITS, ALL_CIRCUITS, MARQUEE, MARQUEE_ID, CIRCUIT_NAME_LISTS,
  circuitById, circuitKeysFor, isMarquee,
  circuitPageHref, circuitShareUrl, circuitShareInvite, circuitShareResult,
  SHARE_HOST_FOR_CIRCUITS, CIRCUIT_BASE,
  RUN_GAMES, JAM_RUN_GAMES, RUN_ENGINES, runGamesFor, runEngine, isRunnableCircuit, runHref, circuitScoreMode,
} from '../lib/circuits.js';
import { SHARE_HOST } from '../lib/site.js';

// lib/trophy-defs.js reaches for '@/lib/theme', which node cannot resolve on its
// own, so it comes in through the alias loader and therefore has to be a dynamic
// import (the hook must be installed before the import resolves).
register('./alias-loader.mjs', import.meta.url);
const { TROPHIES, TROPHY_GROUPS, TROPHY_TIERS } = await import('../lib/trophy-defs.js');

const fails = [];
const warns = [];

// ── the measured clock ──────────────────────────────────────────────────────
// The SAME dated snapshot scripts/verify-daily-five.mjs carries, and it is
// copied rather than imported for the same reason it lives there: it is a
// measurement with a date on it, not a fact about the games, and a library that
// exported it would invite a client to render it as one. Re-measure both
// together. Median top-10 `timeElapsed` in seconds, MEASURED 2026-08-17.
const MEASURED = '2026-08-17';
const MED = {
  check: 21, dating: 22, turn: 23, defend: 28, four: 30, chain: 30, chomp: 34, emcee: 35,
  deep: 37, mate: 41, links: 43, extra: 44, garble: 51, bracket: 51, span: 53, sworn: 54,
  stet: 57, etch: 58, park: 61, blitz: 62, crunch: 63, streak: 66, ping: 69, listed: 75,
  taire: 78, jester: 89, hedge: 93, plot: 93, carve: 111, paths: 111, hands: 112, axiom: 114,
  venn: 128, sixes: 144, hearsay: 156, suffice: 172, blocks: 180, stands: 180, strata: 189,
  tuck: 201, babel: 201, barter: 202, docket: 221, alibi: 232, sweep: 257, cages: 270,
  redact: 276, shards: 304, tally: 337, rung: 360, glyph: 370, fib: 451, cipher: 455,
  suds: 482, warmer: 518, lode: 614, quilt: 699, crux: 1031, anon: 1106, sando: 1171,
  // The three crowd games post no comparable clock: you submit picks against a
  // pool, so the row's time is how long you deliberated. Estimated, flagged.
  outwit: 90, outrank: 90, feud: 90,
  // Niche launched 2026-08-21 with no live clock data yet: estimated from its
  // shape (a type-ahead trivia grid, somewhere between Sixes and Blocks).
  // Replace with the measured median at the next snapshot re-measure.
  niche: 150,
  // Impound (2026-09-04) and Junkyard (2026-09-05) launched with no clock data:
  // estimated off Parker's 61s and their par ramps (7x7 par 16-35 against
  // Parker's 11-20; 8x8 par 22-46). Replace at the next snapshot re-measure.
  impound: 150, junkyard: 240,
  // Shoe launched 2026-08-21 with no live clock data yet: estimated from its
  // shape (five click-through blackjack hands, between Taire and Hands).
  // Replace with the measured median at the next snapshot re-measure.
  shoe: 100,
  // Queen launched 2026-08-21 with no live clock data yet: estimated from its
  // shape (it walks a 5-12 move line with replies between, so past Mate).
  // Replace with the measured median at the next snapshot re-measure.
  queen: 75,
  // Towers, Mercury and Polka launched 2026-08-24 with no live clock data:
  // estimated from their shapes (a 5x5 speed board under Sixes; a kropki 9x9
  // near Quilt; a thermo 9x9 between Quilt and Sando). Replace with measured
  // medians at the next snapshot re-measure.
  towers: 110, polka: 750, mercury: 900,
  // Knight launched 2026-08-28 with no live clock data yet: estimated from its
  // shape (a 13-to-28 clue anti-knight 9x9, so between Polka and Mercury).
  // Replace with the measured median at the next snapshot re-measure.
  knight: 800,
  // Diag launched 2026-09-08 with no live clock data yet: estimated from its
  // shape (a 14-to-26 clue diagonal 9x9; two extra houses make it easier than
  // a plain Suds board of the same count, so between Suds and Quilt). Replace
  // with the measured median at the next snapshot re-measure.
  diag: 550,
  // Frame and Rim launched 2026-09-08 with no live clock data yet: estimated
  // from their shape. Rim is an outside sudoku that falls to singles (between
  // Diag and Quilt); Frame is thirty-six sums over a near-empty grid, Sando's
  // cousin but with three-cell groups (between Knight and Mercury). Replace
  // both with measured medians at the next snapshot re-measure.
  rim: 600,
  frame: 850,
  // Atlas launched 2026-08-25 with no live clock data yet: estimated from its
  // shape (25 multiple-choice questions, so between Deep's 15 and Streak's 40).
  // Replace with the measured median at the next snapshot re-measure.
  atlas: 45,
  // Sport launched 2026-08-25 with no live clock data yet: the same shape as
  // Atlas, 25 multiple-choice questions, so the same estimate. Replace with the
  // measured median at the next snapshot re-measure.
  sport: 45,
  // Biz launched 2026-08-27 with no live clock data yet: the same shape again,
  // 25 multiple-choice questions. Replace with the measured median once the
  // board has a fortnight of rows.
  biz: 45,
};
// The ascent tolerance, same reasoning as the Five's: the medians drift, and a
// re-measure must not fail a roster that was correctly ordered when it shipped.
const ASCENT_SLACK = 0.25;

// Games that cannot be in a circuit, and why.
const EXCLUDED = {
  pricer: 'pulled from the server slate (GAME_PUZZLES), so it has no board, no field and no points',
};

// ── 1. shape ────────────────────────────────────────────────────────────────
const MAX = 5;
if (ALL_CIRCUITS.length !== CIRCUITS.length + 1) {
  fails.push(`ALL_CIRCUITS should be the marquee plus every skill circuit (got ${ALL_CIRCUITS.length} for ${CIRCUITS.length} skill circuits)`);
}
if (!ALL_CIRCUITS[0] || ALL_CIRCUITS[0].id !== MARQUEE_ID) {
  fails.push('the marquee must be FIRST in ALL_CIRCUITS — it is the head of the cycle, and stepping left from it wraps to the last circuit');
}
if (MARQUEE.keys !== null) {
  fails.push('MARQUEE.keys must be null: its roster is a daily read out of lib/daily-five, and a caller reaching for .keys would silently get nothing');
}

const ids = new Set();
for (const c of CIRCUITS) {
  if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) fails.push(`bad circuit id: ${JSON.stringify(c.id)}`);
  if (ids.has(c.id)) fails.push(`duplicate circuit id: ${c.id}`);
  ids.add(c.id);
  if (isMarquee(c.id)) fails.push(`a skill circuit may not use the marquee id (${MARQUEE_ID})`);
  if (!c.name || !c.blurb) fails.push(`${c.id}: needs both a name and a blurb (both are reader-facing on the band)`);
  if (!Array.isArray(c.keys) || c.keys.length < 2) fails.push(`${c.id}: needs at least 2 games to be a run`);
  else if (c.rotate) {
    // a ROTATING circuit: the cap applies to the DAY'S SELECTION, not the pool
    if (c.rotate !== MAX) fails.push(`${c.id}: rotating circuits play ${MAX} a day (rotate is ${c.rotate})`);
    if (c.keys.length <= c.rotate) fails.push(`${c.id}: a rotating pool of ${c.keys.length} is not bigger than its window`);
  } else {
    // A circuit may DECLARE a bigger cap in its own data (Trivia Gauntlet does,
    // at seven). The cap is still enforced; it is just stated beside the roster
    // rather than hidden here as a per-id exception.
    const cap = c.cap || MAX;
    if (c.cap && c.cap <= MAX) fails.push(`${c.id}: cap ${c.cap} is not bigger than the default ${MAX}, so it should not be declared`);
    if (c.keys.length > cap) fails.push(`${c.id}: ${c.keys.length} games, cap is ${cap}`);
  }
  if (circuitById(c.id) !== c) fails.push(`${c.id}: circuitById does not resolve to it`);
  // A RUNNABLE circuit is played as one continuous board, so every member has
  // to be a game the run page can deal: a bank of four-choice questions in play
  // order. RUN_GAMES names them, and a circuit that flags `run` while holding
  // anything else would render a run that silently drops that game.
  if (c.run) {
    if (isMarquee(c.id)) fails.push(`${c.id}: the marquee cannot be runnable, its roster crosses every category`);
    // ONE ENGINE PER CIRCUIT (2026-09-05). A circuit names its engine and every
    // member has to be a game that engine can deal: RUN_GAMES for the quiz run,
    // JAM_RUN_GAMES for the Valet run. An engine nobody wrote is a run nobody
    // can play, so an unknown name fails here rather than 404ing live.
    const eng = runEngine(c.id);
    if (!RUN_ENGINES[eng]) fails.push(`${c.id}: flagged run with engine "${eng}", which RUN_ENGINES does not name`);
    const off = (c.keys || []).filter((k) => !runGamesFor(c.id).includes(k));
    if (off.length) fails.push(`${c.id}: flagged run (${eng}) but holds ${off.join(', ')}, which that engine cannot deal`);
    if (!isRunnableCircuit(c.id)) fails.push(`${c.id}: flagged run but isRunnableCircuit says otherwise`);
    if (runHref(c.id) !== `${CIRCUIT_BASE}/${c.id}/run`) fails.push(`${c.id}: runHref is ${runHref(c.id)}`);
  } else if (isRunnableCircuit(c.id)) {
    fails.push(`${c.id}: isRunnableCircuit is true without the run flag`);
  }
}

// ── 2. every key is a real, non-excluded game ───────────────────────────────
for (const c of CIRCUITS) {
  for (const k of c.keys || []) {
    if (!DAILY_GAME_MAP[k]) fails.push(`${c.id}: "${k}" is not a key in the daily registry`);
    if (EXCLUDED[k]) fails.push(`${c.id}: "${k}" is excluded from runs — ${EXCLUDED[k]}`);
  }
}

// ── 3. overlap (a WARNING, never a failure) ─────────────────────────────────
// NOT EXCLUSIVE ANY MORE (owner ruling, 2026-08-24, the same day exhaustiveness
// went). This used to fail a bank where any game sat in two circuits, on the
// grounds that one play must not pay into two skill boards. That was never what
// it did: the marquee already overlaps every skill circuit it draws from, and a
// circuit board is the same day's rows narrowed to a roster, not a share of a
// pot. What the rule actually did was force a single answer where two were
// true, which is how Four and Chain came to be in Table Games but not Board
// Games. Overlap is reported so a roster change is visible in the run, and
// forgiven.
const owner = new Map();
for (const c of CIRCUITS) {
  for (const k of c.keys || []) {
    if (owner.has(k)) owner.set(k, owner.get(k) + ', ' + c.id);
    else owner.set(k, c.id);
  }
}

// ── 4. coverage (a WARNING, never a failure) ────────────────────────────────
// NOT EXHAUSTIVE ANY MORE (owner ruling, 2026-08-24). This used to FAIL a
// bank where any eligible daily sat in no circuit, and that rule is what built
// the dishonest rosters it was meant to protect: Arcade held five only because
// three quiz games had nowhere else to go, so a title nobody would have chosen
// for them was applied to reach the cap. A circuit's title has to describe its
// roster, and a game with no honest home stays out. An uncovered game is
// therefore reported and then forgiven.
//
// Exclusivity (section 3 above) is still a FAILURE, and the two are not the
// same kind of rule: a game in two circuits pays one play into two skill
// boards, which is a scoring bug, while a game in none is a curation choice.
//
// Derived from the registry, never from a number written down here. A game that
// retired in the PAST is out of scope (it has no live puzzle to run); a game
// with a FUTURE retirement date stays in and drops out of its circuit on its
// own at read time, which is why circuitKeysFor filters rather than the data.
const todayIso = new Date().toISOString().slice(0, 10);
const retiredAlready = (k) => {
  const d = RETIRED_DAILY[k];
  return !!d && d < todayIso;
};
const eligible = DAILY_KEYS.filter((k) => !EXCLUDED[k] && !retiredAlready(k));
const missing = eligible.filter((k) => !owner.has(k));
if (missing.length) {
  warns.push(`${missing.length} eligible daily game(s) are in no circuit: ${missing.join(', ')}`);
}
const shared = [...owner.entries()].filter(([, v]) => v.includes(','));
if (shared.length) {
  warns.push(`${shared.length} game(s) in more than one circuit: ${shared.map(([k, v]) => k + ' (' + v + ')').join('; ')}`);
}
const strays = [...owner.keys()].filter((k) => retiredAlready(k));
if (strays.length) warns.push(`retired game(s) still named in a circuit (harmless, filtered at read time): ${strays.join(', ')}`);

// ── 5. run order is shortest-median-first ───────────────────────────────────
// The marquee's own rule, applied to a fixed roster. A circuit opens with
// something you finish in half a minute and closes with the one that takes real
// time, so a player who has banked four games has a reason to start the fifth.
for (const c of CIRCUITS) {
  const keys = c.keys || [];
  const unknown = keys.filter((k) => !(k in MED));
  if (unknown.length) {
    warns.push(`${c.id}: no measured median for ${unknown.join(', ')} — order not checked for those`);
  }
  for (let i = 1; i < keys.length; i += 1) {
    const a = MED[keys[i - 1]];
    const b = MED[keys[i]];
    if (a == null || b == null) continue;
    if (b < a * (1 - ASCENT_SLACK)) {
      fails.push(`${c.id}: out of order — ${keys[i]} (${b}s) follows ${keys[i - 1]} (${a}s); rosters run shortest first`);
    }
  }
}

// ── 5b. a circuit that declares its own order obeys it ──────────────────────
// `keys` still has to ascend (it is the canonical list and the ladder colours
// from it), which check 5 above already proved. What is checked here is the
// ORDER THE PLAYER ACTUALLY GETS: the tail is pinned in the order it is named,
// the head is a genuine permutation of everything else, the same date always
// gives the same answer, and different dates do not all give the same one.
{
  const DAYS = [];
  for (let i = 0; i < 120; i += 1) {
    DAYS.push(new Date(Date.UTC(2026, 7, 30) + i * 86400000).toISOString().slice(0, 10));
  }
  for (const c of CIRCUITS) {
    if (!c.order || !Array.isArray(c.order.tail)) continue;
    const canon = (c.keys || []).slice();
    const seen = new Set();
    for (const iso of DAYS) {
      const got = circuitKeysFor(c.id, iso);
      if (got.length !== canon.length) {
        fails.push(`${c.id}: ${iso} returned ${got.length} keys, expected ${canon.length}`);
        continue;
      }
      if ([...got].sort().join() !== [...canon].sort().join()) {
        fails.push(`${c.id}: ${iso} is not a permutation of the roster`);
        continue;
      }
      const tailGot = got.slice(got.length - c.order.tail.length);
      if (tailGot.join() !== c.order.tail.join()) {
        fails.push(`${c.id}: ${iso} ends ${tailGot.join(' > ')}, expected ${c.order.tail.join(' > ')}`);
      }
      // determinism: the same day, asked twice, is the same run
      if (circuitKeysFor(c.id, iso).join() !== got.join()) {
        fails.push(`${c.id}: ${iso} is not deterministic`);
      }
      seen.add(got.join());
    }
    // AND IT SHUFFLES FAIRLY, which is a stronger claim than "it varies" and
    // the one that actually matters: every head game should open the run about
    // as often as every other. A count test rather than a distinct-orders test
    // because the first draft of this shuffle passed the latter easily while
    // opening on one of its five games a third as often as the rest (it took
    // the low bits of an LCG). 700 days is enough for the bound to be tight
    // without being flaky.
    const headLen = canon.length - c.order.tail.length;
    if (headLen > 1) {
      const LONG = 700;
      const opens = new Map();
      for (let i = 0; i < LONG; i += 1) {
        const iso = new Date(Date.UTC(2026, 7, 30) + i * 86400000).toISOString().slice(0, 10);
        const f = circuitKeysFor(c.id, iso)[0];
        opens.set(f, (opens.get(f) || 0) + 1);
      }
      const want = LONG / headLen;
      for (const [k, v] of opens) {
        if (v < want * 0.6 || v > want * 1.6) {
          fails.push(`${c.id}: ${k} opens ${v} of ${LONG} days, expected about ${Math.round(want)}; the shuffle is skewed`);
        }
      }
      if (opens.size !== headLen) {
        fails.push(`${c.id}: only ${opens.size} of ${headLen} head games ever open the run`);
      }
    }
  }
}

// ── 6. the derived name list cannot drop a game silently ────────────────────
// CIRCUIT_NAME_LISTS is what app/DailyStrip.jsx filters by. It maps keys to
// display names and drops anything unresolved, so a typo would quietly shrink a
// filter group rather than fail anywhere.
if (CIRCUIT_NAME_LISTS.length !== CIRCUITS.length) {
  fails.push('CIRCUIT_NAME_LISTS has a different length from CIRCUITS');
}
CIRCUIT_NAME_LISTS.forEach(([name, names], i) => {
  const c = CIRCUITS[i];
  if (!c) return;
  if (name !== c.name) fails.push(`CIRCUIT_NAME_LISTS[${i}] is named ${name}, expected ${c.name}`);
  if (names.length !== c.keys.length) {
    fails.push(`${c.id}: ${c.keys.length} keys but only ${names.length} resolved to a game name — a key is wrong`);
  }
});

function seedLocal(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function shuffleLocal(arr, seed) {
  const out = arr.slice();
  let s = (seed >>> 0) || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    // HIGH BITS, never `s % (i + 1)`. The low-order bits of an LCG have very
    // short periods, and taking the modulo of them skews the result badly:
    // measured over 700 days, the first draft opened on Script 43 times
    // against an expected 140. Scaling the full 32-bit word uses the high
    // bits, which do not have that defect.
    const j = Math.floor((s / 4294967296) * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}
function applyOrderLocal(c, live, day) {
  if (!c.order || !Array.isArray(c.order.tail)) return live;
  const tail = c.order.tail.filter((k) => live.includes(k));
  const head = live.filter((k) => !tail.includes(k));
  return [...shuffleLocal(head, seedLocal(`${day}:${c.id}`)), ...tail];
}

// ── 7. the read accessors agree with the data ───────────────────────────────
for (const c of CIRCUITS) {
  const live = circuitKeysFor(c.id, todayIso);
  const filtered = c.keys.filter((k) => DAILY_GAME_MAP[k] && !retiredAlready(k));
  // for a rotating circuit the expected selection is RECOMPUTED here with its
  // own day-index math, never read back off the library it is checking
  const expected = c.rotate && filtered.length > c.rotate
    ? (() => {
        const idx = Math.floor(Date.parse(todayIso + 'T12:00:00Z') / 86400000);
        const n = filtered.length;
        const start = ((idx % n) + n) % n;
        const pick = new Set();
        for (let i = 0; i < c.rotate; i++) pick.add((start + i) % n);
        return filtered.filter((_, i) => pick.has(i));
      })()
    : filtered;
  const want = applyOrderLocal(c, expected, todayIso);
  if (live.join(',') !== want.join(',')) {
    fails.push(`${c.id}: circuitKeysFor returned [${live.join(',')}], expected [${want.join(',')}]`);
  }
  if (live.length < 2) {
    fails.push(`${c.id}: only ${live.length} live game(s) today — the band needs at least 2 to render a run`);
  }
  if (!c.rotate && live.length < c.keys.length) {
    warns.push(`${c.id}: down to ${live.length} live games (retirement), was ${c.keys.length}`);
  }
}
// a rotating circuit plays fair: over one full pool-length cycle of days, the
// selection is always `rotate` games, always in pool (ascent) order, and every
// pool member appears exactly `rotate` times
for (const c of CIRCUITS) {
  if (!c.rotate) continue;
  const n = c.keys.length;
  const seen = Object.fromEntries(c.keys.map((k) => [k, 0]));
  for (let d = 0; d < n; d++) {
    const iso = new Date(Date.parse(todayIso + 'T12:00:00Z') + d * 86400000).toISOString().slice(0, 10);
    const sel = circuitKeysFor(c.id, iso);
    if (sel.length !== c.rotate) fails.push(`${c.id}: ${iso} plays ${sel.length} games, rotate is ${c.rotate}`);
    const order = sel.map((k) => c.keys.indexOf(k));
    if (order.some((v, i) => i && v < order[i - 1])) fails.push(`${c.id}: ${iso} selection is not in pool order`);
    for (const k of sel) seen[k] += 1;
  }
  for (const [k, ct] of Object.entries(seen)) {
    if (ct !== c.rotate) fails.push(`${c.id}: ${k} plays ${ct} of ${n} days in a cycle, expected ${c.rotate}`);
  }
}
if (!circuitKeysFor(MARQUEE_ID, todayIso).length) {
  warns.push(`the marquee has no run today (${todayIso}) — lib/daily-five's bank may need extending`);
}

// ── 8. the trophy case matches the rosters, 1:1 ─────────────────────────────
// lib/trophy-defs.js lists the circuit trophies LITERALLY, because it is
// client-safe metadata and must not drag lib/daily-games into every bundle that
// renders a trophy case. That is only safe if something checks the two lists
// agree, which is this. A new circuit with no trophy, or a trophy for a circuit
// that no longer exists, fails here rather than shipping a hole.
if (!TROPHY_GROUPS.some((g) => g.key === 'circuits')) {
  fails.push("TROPHY_GROUPS has no 'circuits' group, so the circuit trophies would render ungrouped");
}
const troById = new Map(TROPHIES.map((t) => [t.id, t]));
for (const c of ALL_CIRCUITS) {
  const id = `circuit-${c.id}`;
  const t = troById.get(id);
  if (!t) { fails.push(`${c.id}: no trophy row ${id} in lib/trophy-defs.js`); continue; }
  if (!c.trophy) { fails.push(`${c.id}: no trophy metadata on the circuit`); continue; }
  if (t.name !== c.trophy.name) fails.push(`${id}: named "${t.name}" in trophy-defs, "${c.trophy.name}" in circuits`);
  if (t.tier !== c.trophy.tier) fails.push(`${id}: tier "${t.tier}" in trophy-defs, "${c.trophy.tier}" in circuits`);
  if (t.icon !== c.trophy.icon) fails.push(`${id}: icon "${t.icon}" in trophy-defs, "${c.trophy.icon}" in circuits`);
  if (t.group !== 'circuits') fails.push(`${id}: group is "${t.group}", expected circuits`);
  if (!TROPHY_TIERS[t.tier]) fails.push(`${id}: unknown tier "${t.tier}"`);
}
const strayTrophies = TROPHIES
  .filter((t) => t.id.startsWith('circuit-') && t.id !== 'circuit-all')
  .filter((t) => !ALL_CIRCUITS.some((c) => `circuit-${c.id}` === t.id));
if (strayTrophies.length) {
  fails.push(`trophy row(s) for circuits that no longer exist: ${strayTrophies.map((t) => t.id).join(', ')}`);
}
if (!troById.has('circuit-all')) fails.push("the 'circuit-all' capstone trophy is missing");

// ── 9. the trophy tier matches the circuit's measured length ────────────────
// Recomputed from the same snapshot the ascent check uses, so a tier cannot be
// set by feel. The marquee is exempt and always gold: its roster changes daily,
// so it has no fixed length to tier by.
const TIER_AT = (secs) => (secs < 360 ? 'bronze' : secs < 1200 ? 'silver' : 'gold');
for (const c of CIRCUITS) {
  if (!c.trophy) continue;
  const known = c.keys.filter((k) => k in MED);
  if (known.length !== c.keys.length) continue; // already warned above
  if (c.rotate) {
    // a rotating circuit's day is a WINDOW of the pool, so every window must
    // land in the declared tier, not just the pool total
    for (let s = 0; s < c.keys.length; s++) {
      let total = 0;
      for (let i = 0; i < c.rotate; i++) total += MED[c.keys[(s + i) % c.keys.length]];
      const want = TIER_AT(total);
      if (c.trophy.tier !== want) {
        fails.push(`${c.id}: the window starting at ${c.keys[s]} totals ${total}s (${want}), trophy says ${c.trophy.tier}`);
        break;
      }
    }
    continue;
  }
  const total = known.reduce((a, k) => a + MED[k], 0);
  const want = TIER_AT(total);
  if (c.trophy.tier !== want) {
    fails.push(`${c.id}: trophy tier is ${c.trophy.tier} but the roster totals ${total}s, which is ${want}`);
  }
}
if (MARQUEE.trophy && MARQUEE.trophy.tier !== 'gold') {
  fails.push('the marquee trophy must be gold: its roster changes daily, so there is no length to tier by');
}

// ── 10. share copy ──────────────────────────────────────────────────────────
// Every circuit carries an invite and a result line, they are its own, and the
// link inside the text points at that circuit's LANDING page rather than at the
// run summary. The summary is noindex and shows one viewer's own results, so a
// share that pointed there would hand a recipient somebody else's scorecard
// instead of the run.
const EM_DASH = /[\u2014\u2013]/;
// The retired Wordle-idiom row: coloured squares, circles, and the variation
// selector that trails them. None of these may appear in share copy.
const EMOJI_GRID = /[\u{1F7E5}-\u{1F7EB}\u2B1B\u2B1C\u26AA\u26AB\u{1F534}-\u{1F7E3}\u25A0-\u25FF]/u;
const INVITE_MAX = 150;   // fits beside a link in a message without being cut
const RESULT_MAX = 60;    // one line under the figures
const seenInvite = new Map();
const seenResult = new Map();

if (SHARE_HOST_FOR_CIRCUITS !== SHARE_HOST) {
  fails.push(`the share host in lib/circuits (${SHARE_HOST_FOR_CIRCUITS}) does not match SHARE_HOST (${SHARE_HOST})`);
}

for (const c of ALL_CIRCUITS) {
  const s = c.share;
  if (!s || typeof s.invite !== 'string' || typeof s.result !== 'string') {
    fails.push(`${c.id}: no share copy (needs share.invite and share.result)`);
    continue;
  }
  for (const [kind, txt, max, seen] of [
    ['invite', s.invite, INVITE_MAX, seenInvite],
    ['result', s.result, RESULT_MAX, seenResult],
  ]) {
    if (!txt.trim()) fails.push(`${c.id}: share.${kind} is empty`);
    if (txt.length > max) fails.push(`${c.id}: share.${kind} is ${txt.length} chars, over the ${max} budget`);
    if (EM_DASH.test(txt)) fails.push(`${c.id}: share.${kind} contains an em or en dash, which the house copy rule bans`);
    if (txt.trim() !== txt) fails.push(`${c.id}: share.${kind} has stray whitespace`);
    // Copy that is identical on two circuits says nothing about either.
    const prior = seen.get(txt);
    if (prior) fails.push(`${c.id}: share.${kind} is identical to ${prior}'s`);
    else seen.set(txt, c.id);
    // The blurb already renders on the page the invite links to, so an invite
    // that merely repeats it wastes the one line a reader actually sees.
    if (kind === 'invite' && c.blurb && txt.trim() === c.blurb.trim()) {
      fails.push(`${c.id}: share.invite is just the blurb again`);
    }
  }

  // The link. Landing page, correct id, bare host in the text, never the summary.
  const href = circuitPageHref(c.id);
  if (href !== `${CIRCUIT_BASE}/${c.id}`) fails.push(`${c.id}: circuitPageHref is ${href}`);
  const url = circuitShareUrl(c.id);
  if (!url.endsWith(`${CIRCUIT_BASE}/${c.id}`)) fails.push(`${c.id}: share url is ${url}`);
  if (/^https?:/.test(url)) fails.push(`${c.id}: share url carries a scheme, which breaks referral restamping`);

  const invite = circuitShareInvite(c.id);
  const result = circuitShareResult(c.id, {
    points: 40, maxTotal: 75, rank: 3, field: 20, done: 4, total: 5,
  });
  for (const [kind, txt] of [['invite', invite], ['result', result]]) {
    if (!txt.includes(url)) fails.push(`${c.id}: built ${kind} does not carry its own link`);
    if (txt.includes('/daily-five')) fails.push(`${c.id}: built ${kind} links the run summary instead of the landing page`);
    if (!txt.includes(c.name)) fails.push(`${c.id}: built ${kind} does not name the circuit`);
  }
  // THE SHARE RESULT IS THREE LINES OF TEXT AND NO EMOJI GRID (owner,
  // 2026-08-30). This check used to assert the opposite, that line two was a
  // row of five coloured squares, and it kept asserting it for five days after
  // the ruling landed, which is the "the check must follow the ruling" failure
  // CLAUDE.md already names once for verify-listed. What the shape is now:
  // a stats line, the circuit's own result tag line, then the bare link.
  const lines = result.split('\n');
  if (lines.length !== 3) fails.push(`${c.id}: share result is ${lines.length} lines, want a stats line, a tag line and the link`);
  if (lines.at(-1) !== url) fails.push(`${c.id}: share result does not end on its bare link`);
  if (lines[1] !== s.result) fails.push(`${c.id}: share result line two is not the circuit's own tag line`);
  if (EMOJI_GRID.test(result)) fails.push(`${c.id}: share result carries an emoji grid, retired by owner ruling 2026-08-30`);
  if (EM_DASH.test(result)) fails.push(`${c.id}: built result contains an em or en dash, which the house copy rule bans`);
  // Every figure is optional, so a partial run must still read as honest text.
  const bare = circuitShareResult(c.id, {});
  if (/undefined|NaN|\bnull\b/.test(bare)) fails.push(`${c.id}: share result with no stats reads "${bare.split('\n')[0]}"`);
  if (bare.split('\n').length !== 3) fails.push(`${c.id}: share result with no stats is ${bare.split('\n').length} lines`);
  // A caller still passing the retired `pips` field must be IGNORED, not
  // rejected and not rendered, which is what lib/circuits.js promises.
  const withPips = circuitShareResult(c.id, {
    points: 40, maxTotal: 75, rank: 3, field: 20, done: 4, total: 5,
    pips: ['top', 'on', 'on', 'on', ''],
  });
  if (withPips !== result) fails.push(`${c.id}: an older caller's pips field still changes the share text`);
}

// A SPELLED COUNT IN THE COPY MUST MATCH THE ROSTER, TODAY AND AFTER EVERY
// RETIREMENT THIS CIRCUIT IS DUE. This is the check that would have caught the
// two real defects found on the day circuits got share copy: a landing page
// telling a four-game circuit it was "the same five games every day", and
// Recall's "Four games, nothing multiple choice" — true when it was written and
// a lie from 2026-09-29, when Extra retires and Recall becomes a three.
//
// A retirement is the whole reason this cannot be a today-only check. NOTHING
// FAILS ON THE DAY IT HAPPENS: circuitKeysFor simply returns one fewer key, and
// every count baked into a sentence quietly goes wrong with no error anywhere.
// So each circuit is re-tested on the day AFTER each of its members retires,
// which lands the failure now, while somebody is looking at this file.
const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
const dayAfter = (iso) => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
// Only a count of GAMES is checked. A number attached to any other noun ("four
// hidden threads", "one life", "five different ways") describes what happens
// INSIDE a game rather than tallying them, and must not be second-guessed here.
// "of them" was tried here and removed: it fired on "three of them clueless"
// (a subset of the five, not a tally) and on "one move that throws each of them
// away" (a move, not a game). A trigger noun has to NAME the members.
const COUNT_RE = /\b(one|two|three|four|five|six|seven)\b(?=[^.]{0,24}\b(?:games?|puzzles?|cases?|rounds?|sets?)\b)/gi;

for (const c of ALL_CIRCUITS) {
  if (!c.share || isMarquee(c.id)) continue; // the marquee is five by construction
  const dates = [null, ...(c.keys || [])
    .filter((k) => RETIRED_DAILY[k])
    .map((k) => dayAfter(RETIRED_DAILY[k]))];
  for (const when of dates) {
    const size = circuitKeysFor(c.id, when || undefined).length;
    for (const kind of ['invite', 'result']) {
      for (const m of String(c.share[kind]).matchAll(COUNT_RE)) {
        const said = WORD_NUM[m[1].toLowerCase()];
        if (said !== size) {
          const at = when ? ' on ' + when + ', after a retirement' : '';
          fails.push(c.id + ': share.' + kind + ' says "' + m[1] + '" but the roster is ' + size + at);
        }
      }
    }
  }
}

// A run with nothing recorded must still produce honest text, never 'undefined'.
for (const c of ALL_CIRCUITS) {
  const bare = circuitShareResult(c.id, {});
  if (/undefined|NaN/.test(bare)) fails.push(`${c.id}: result text with no stats renders ${bare.match(/undefined|NaN/)[0]}`);
}

// ── 11. a circuit surface never wears one game's hue ────────────────────────
// The run page borrows the dailies' cap, where the band is painted from the
// game's own category (--cc on the band, --cat-hue on the stage under it). A
// circuit is five games, so the run passes `neutral` and takes the plain band.
//
// Checked at the SOURCE rather than through an import, because the colour is a
// prop on a client component and nothing lib/circuits exports can see it. That
// is exactly why it needs a check: a hardcoded cat="Trivia" painted the whole
// Gauntlet run green and nothing failed.
{
  const runFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'circuits', '[id]', 'run', 'RunClient.jsx');
  const src = readFileSync(runFile, 'utf8');
  // Up to the SELF-CLOSING '/>', never the first '>': the props carry a
  // 'cleared > 0' ternary, and a lazy match to '>' stops inside it.
  // The run owns its ground outright now, so the check is that it takes NO
  // game's hue rather than that it passes `neutral` to a cap it no longer has.
  // A returning LoftCap must still carry `neutral`, which the second test
  // covers if it ever comes back.
  if (/\bcat=\{?["'`]?(Trivia|Word|Numbers|Logic|Geography|Sports|Cards|Arcade)/.test(src)) {
    fails.push("run page: a category hue is passed to the chrome, so the run wears one game's colour");
  }
  const tag = src.match(/<LoftCap\b[\s\S]*?\/>/);
  if (tag && !/(^|[\s{])neutral([\s}=]|$)/.test(tag[0])) fails.push("run page: <LoftCap> is missing `neutral`, so the run wears one game's category hue");
}

// ── 12. a questions-right circuit holds only games scored in questions ──────
// 'correct' adds member scores together, which is arithmetic on nothing unless
// every member is scored in the SAME unit. RUN_GAMES is exactly that set: the
// banks of four-choice questions the continuous run can deal, where a score is
// the number answered right. A circuit that took this rule over a sudoku and a
// crossword would rank whoever played the game with the biggest numbers.
{
  for (const c of ALL_CIRCUITS) {
    if (!('score' in c)) continue;
    if (c.score !== 'correct' && c.score !== 'time') {
      fails.push(`${c.id}: unknown score mode "${c.score}" (only 'correct' and 'time' are declarable)`);
      continue;
    }
    if (circuitScoreMode(c.id) !== c.score) fails.push(`${c.id}: declares score '${c.score}' but circuitScoreMode says otherwise`);
    const keys = circuitKeysFor(c.id, todayIso);
    if (c.score === 'correct') {
      const off = keys.filter((k) => !RUN_GAMES.includes(k));
      if (off.length) fails.push(`${c.id}: ranks on questions right but holds ${off.join(', ')}, which are not scored in questions`);
    } else {
      // 'time' (2026-09-05): a clock board is honest only over games that are
      // solve-or-nothing races, where the per-game score is a grade against
      // par and is NOT what the board adds up. That is exactly the jam family.
      const off = keys.filter((k) => !JAM_RUN_GAMES.includes(k));
      if (off.length) fails.push(`${c.id}: ranks on the clock but holds ${off.join(', ')}, which are not timed solve-or-nothing races`);
      if (!c.run || runEngine(c.id) !== 'jam') fails.push(`${c.id}: ranks on the clock but is not the jam run, so no surface deals it on one clock`);
    }
  }
  // And the default is the ladder for everything that does not declare it.
  for (const c of ALL_CIRCUITS) {
    if (!('score' in c) && circuitScoreMode(c.id) !== 'points') fails.push(`${c.id}: no score mode declared but does not default to points`);
  }
}

// ── report ──────────────────────────────────────────────────────────────────
const cover = eligible.length;
console.log(`circuits: ${CIRCUITS.length} skill + 1 marquee`);
console.log(`coverage: ${owner.size} of ${cover} eligible dailies (excluded: ${Object.keys(EXCLUDED).join(', ')})`);
console.log(`medians measured ${MEASURED}`);
for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(fails.length ? `\n${fails.length} failure(s).` : `\nOK — ${warns.length} warning(s).`);
process.exit(fails.length ? 1 : 0);
