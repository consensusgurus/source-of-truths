// Verify the Junkyard (8x8 sliding-block jam, the top rung of the family) bank.
//
// This is verify-impound.mjs's twin, bound to Junkyard's board. It checks the
// same claims because Junkyard makes the same claims, and it asserts two more:
// that Junkyard is genuinely the BIGGEST game, so every weekday rung sits above
// the Impound rung it corresponds to, and that the FAMILY LADDER the end card
// hands players along is intact in every roster that reads it (check 10).
//
// Junkyard's own header (app/junkyard/puzzles.js) and its solver binding
// (app/junkyard/solver.js) promise, per puzzle:
//   - the board is eight by eight with the exit on row 4. Eight is even, so
//     there is no true middle rank and the lane has to lean: four ranks of
//     traffic above it and three below, the opposite lean to Parker's 6x6.
//     Eight is also the LAST rung possible, because lib/jam-core packs
//     occupancy into two 32-bit words and 64 cells is the ceiling;
//   - block 0 is always RED: two long, horizontal, fixed on the exit row,
//     escaping through the gap in the right-hand wall on that row;
//   - `par` (the field's old name, kept so it matches Impound's shape; the game
//     calls this PERFECT) is the EXACT minimum number of moves, found by
//     breadth-first search over the whole reachable state space, not an
//     estimate;
//   - the week climbs in two rungs, each dialed differently: Monday to
//     Wednesday run perfect 22-35, Thursday to Saturday 31-47, and Sundays
//     44-80, with par non-decreasing across the whole Mon->Sat run of a week.
//
//   1. Structural: `grid(pieces)` is non-null (no overlapping or off-board
//      blocks); block 0 has len 2, is horizontal, and is fixed on row
//      EXIT_ROW (4); the start position is not already solved.
//   2. Full independent BFS solve via `solve()`: the recomputed minimum move
//      count must equal the stored `par` exactly. This alone proves both "not
//      fewer" and "not more", since solve() returns the true shortest path
//      length. Note that every banked board was ACCEPTED by the generator only
//      because its search reached the goal inside a 40,000-state cap, so this
//      re-solve is cheap by construction; a board that needs a big search here
//      did not come from the generator.
//   3. Rung bounds, and the sunday flag matching the real day of week.
//   4. Within-week ramp: par is non-decreasing across consecutive weekdays in
//      the same week (never wrapping Sat to Mon, skipping Sundays, which run
//      their own track). A flat step is a note rather than a failure.
//   5. quizId/num/live/dateLabel mutually consistent and sequential.
//   6. No duplicate boards (identical `pieces`).
//   7. Pool variety: the non-red blocks are hashed into a position-independent
//      signature, and any repeat is a hard fail. That space is huge (about
//      twenty blocks each with a length, an orientation, a row-or-column and an
//      offset), so a collision is real evidence of a copy-pasted board.
//   8. JUNKYARD IS BIGGER THAN IMPOUND, checked rather than asserted: every rung
//      band sits strictly above Impound's matching band, Junkyard's easiest
//      board is harder than Impound's Monday CEILING so the two weeks do not
//      overlap at the bottom, and Junkyard's MEDIAN board beats Impound's on
//      both tracks.
//
//      NOTE WHICH CLAIM THIS IS, because it is deliberately weaker than the one
//      verify-impound makes and the difference is a finding rather than a
//      slackening. Impound could assert "my Monday opens where Parker's week
//      ends" because its Monday floor (16) equals the floor of Parker's hardest
//      weekday rung (16) exactly. Junkyard cannot: repeating that step would put
//      its Monday at 28 and, compounding through the within-week floor, its
//      Saturday in the mid forties and its Sunday floor near 50 against a
//      MEASURED climb ceiling of about 54. Impound's bank already taught this
//      lesson from the other end, where a Sunday floor set near the ceiling made
//      each Sunday a coin toss and had to be measured down twice. So the ladder's
//      step shortens at the third rung, on purpose, and this check asserts what
//      is true of the bank rather than what would have been tidy.
//      Note what this deliberately does NOT claim: that every Junkyard board
//      beats every Impound board. Junkyard's Monday band overlaps Impound's
//      Thu-Sat band by design, because opening the week where the other game
//      finishes its is the whole point of a ladder. The Impound version of this
//      check was written too strong TWICE and failed a good bank both times;
//      it compares like with like, median against median.
//   9. US spelling: no reader-facing prose fields exist on a Junkyard puzzle
//      today, so this is a no-op scan kept for parity and for any future field.
//  10. THE FAMILY LADDER IS INTACT. Parker, Impound and Junkyard are handed to
//      each other as "up next" through GAME_FAMILIES in lib/daily-games.js, and
//      the pick resolves each key against a roster before offering it. A key
//      missing from a roster is therefore dropped SILENTLY: the ladder just
//      skips that rung, with no error anywhere, which is the exact failure mode
//      the daily-game registries checklist exists for. So every family member
//      must be present in lib/daily-games.js AND in app/DailyEndCard.jsx (the
//      second, independent roster that app/useNextUnplayed.js actually reads),
//      and the ladder must be in ascending board size, since that ordering is
//      what makes it a ramp rather than a set.
//
// Run: node scripts/verify-junkyard.mjs
import { PUZZLES } from '../app/junkyard/puzzles.js';
import { fromData, grid, solved, solve, EXIT_ROW, N } from '../app/junkyard/solver.js';
import { PUZZLES as IMPOUND } from '../app/impound/puzzles.js';
import { GAME_FAMILIES, DAILY_KEYS, familyAfter } from '../lib/daily-games.js';
import fs from 'node:fs';

let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);

// Junkyard launched with this bank, so there is no frozen history to grandfather
// yet. The constant exists so the first retrofit has somewhere to go, per the
// standing rule that a rule change scopes to future boards with a dated floor.
const JUNKYARD_FLOOR_FROM = '2026-09-04';
const POOL_CEILING = 1; // a non-red board signature may repeat at most this many times (i.e. never)

const BRITISH_RE = /\b(colour|flavour|favourite|centre|theatre|organis(e|ing|ation)|recognis(e|ed|ing)|realis(e|ed|ing)|travell(ed|ing|er)|programme|metre|litre|kerb|tyre|analys(e|ed|ing)|catalogue|dialogue|jewellery|labour|neighbour|honour|armour|cheque|defence|licence|practise|whilst|amongst|learnt|aluminium|aeroplane)\b/i;
function scanBritish(id, label, s) {
  if (typeof s !== 'string') return;
  const m = s.match(BRITISH_RE);
  if (m) fail(id, `British spelling "${m[0]}" in ${label}: "${s}"`);
}

const RUNG = {
  1: { name: 'Monday', lo: 22, hi: 28 },
  2: { name: 'Tuesday', lo: 25, hi: 32 },
  3: { name: 'Wednesday', lo: 28, hi: 35 },
  4: { name: 'Thursday', lo: 31, hi: 39 },
  5: { name: 'Friday', lo: 34, hi: 43 },
  6: { name: 'Saturday', lo: 37, hi: 47 },
  0: { name: 'Sunday', lo: 44, hi: 80 },
};
// Impound's own documented bands, from app/impound/puzzles.js. Used only by check 8.
const IMPOUND_RUNG = { 1: [16, 20], 2: [18, 23], 3: [20, 25], 4: [23, 28], 5: [25, 31], 6: [28, 35], 0: [34, 50] };

const seenPieces = new Map();
const sigPool = new Map();
const byLive = [];

PUZZLES.forEach((p, i) => {
  const errs = [];

  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = p.quizId.match(/^junkyard-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId (must be junkyard-M-D-YY)');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
  }
  const wantDateLabel = p.live ? new Date(`${p.live}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
  if (wantDateLabel && p.dateLabel !== wantDateLabel) errs.push(`dateLabel "${p.dateLabel}" != "${wantDateLabel}"`);
  scanBritish(p.quizId, 'dateLabel', p.dateLabel);
  let dow = null;
  if (p.live) {
    dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
    const isSun = dow === 0;
    if (!!p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live} (real weekday)`);
  }

  // -- rung bounds --
  if (dow !== null) {
    const rung = RUNG[dow];
    if (typeof p.par !== 'number' || p.par < rung.lo || p.par > rung.hi) {
      errs.push(`par ${p.par} outside the ${rung.name} rung's documented band [${rung.lo}, ${rung.hi}]`);
    }
  }

  // -- structural --
  let ps = null, g = null;
  if (!Array.isArray(p.pieces) || !p.pieces.length) {
    errs.push('missing/empty pieces');
  } else {
    ps = fromData(p.pieces);
    g = grid(ps);
    if (!g) errs.push(`pieces overlap or hang off the ${N}x${N} board`);
    const b0 = ps[0];
    if (b0.len !== 2) errs.push(`block 0 (red) len ${b0.len} != 2`);
    if (!b0.horiz) errs.push('block 0 (red) must be horizontal');
    if (b0.fixed !== EXIT_ROW) errs.push(`block 0 (red) fixed row ${b0.fixed} != EXIT_ROW ${EXIT_ROW}`);
    if (g && solved(ps)) errs.push('the board is already solved at the start');
  }

  // -- independent BFS solve --
  let solveNote = '';
  if (!errs.length) {
    const r = solve(ps);
    if (r.min === -1) errs.push('solve() could not find a solution within its cap -- board may be unsolvable');
    else if (r.min !== p.par) errs.push(`recomputed true minimum ${r.min} != stated par ${p.par}`);
    else solveNote = `, recomputed minimum ${r.min} confirmed by independent BFS over ${r.seen.toLocaleString()} states`;
  }

  if (p.pieces) {
    const key = JSON.stringify(p.pieces);
    seenPieces.set(key, (seenPieces.get(key) || []).concat(p.quizId));
  }
  if (Array.isArray(p.pieces) && p.pieces.length > 1) {
    const sig = p.pieces.slice(1).map((x) => x.join(',')).sort().join('|');
    const arr = sigPool.get(sig) || [];
    arr.push({ id: p.quizId, live: p.live });
    sigPool.set(sig, arr);
  }
  if (p.live && dow !== null) byLive.push({ id: p.quizId, live: p.live, dow, par: p.par });

  errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `perfect ${p.par}${p.sunday ? ' (Sunday)' : ''}${solveNote}`);
});

for (const [, ids] of seenPieces) {
  if (ids.length > 1) fail('junkyard pool', `identical board shipped on ${ids.length} boards: ${ids.join(', ')}`);
}

// ─── within-week ramp ───────────────────────────────────────────────────────
byLive.sort((a, b) => (a.live < b.live ? -1 : a.live > b.live ? 1 : 0));
for (let i = 1; i < byLive.length; i++) {
  const prev = byLive[i - 1], cur = byLive[i];
  if (prev.dow >= 1 && prev.dow <= 5 && cur.dow === prev.dow + 1) {
    if (cur.par < prev.par) {
      fail('junkyard pool', `ramp broken: ${prev.id} (par ${prev.par}) -> ${cur.id} (par ${cur.par}) goes DOWN within the same week`);
    } else if (cur.par === prev.par) {
      note('junkyard pool', `flat step: ${prev.id} -> ${cur.id} both par ${cur.par} (ramp promises real variety, not just non-decreasing)`);
    }
  }
}

// ─── non-red board signature pool variety ──────────────────────────────────
let staleFound = false;
for (const [, entries] of sigPool) {
  const freshCount = entries.filter((e) => e.live >= JUNKYARD_FLOOR_FROM).length;
  if (entries.length > POOL_CEILING) {
    const msg = `near-identical board (same non-red blocks) shipped on ${entries.length} boards (ceiling ${POOL_CEILING}): ${entries.map((e) => e.id).join(', ')}`;
    if (freshCount > 0) { fail('junkyard pool', msg); staleFound = true; }
    else note('junkyard pool', `grandfathered: ${msg}`);
  }
}

// ─── check 8: Junkyard really is the bigger game ─────────────────────────────
// The whole claim of this game, in reader-facing copy and in its own name, is
// that it starts where Impound leaves off. That is a checkable statement, so it
// is checked rather than trusted.
for (const dow of [0, 1, 2, 3, 4, 5, 6]) {
  const mine = RUNG[dow], theirs = IMPOUND_RUNG[dow];
  if (mine.lo <= theirs[0] || mine.hi <= theirs[1]) {
    fail('junkyard vs impound', `the ${mine.name} rung [${mine.lo},${mine.hi}] does not sit above Impound's [${theirs[0]},${theirs[1]}]`);
  }
}
// Junkyard's EASIEST board must still be harder than Impound's easiest rung can
// ever get. That is the honest version of "the biggest game": not that it opens
// where Impound's week ends (see the note above), but that the two weeks do not
// overlap at all at the bottom.
const IMPOUND_MONDAY_CEILING = IMPOUND_RUNG[1][1];
if (RUNG[1].lo <= IMPOUND_MONDAY_CEILING) {
  fail('junkyard vs impound', `Junkyard's Monday floor (${RUNG[1].lo}) does not clear Impound's Monday ceiling (${IMPOUND_MONDAY_CEILING}), so the two weeks overlap at their easiest`);
} else if (PUZZLES.length && IMPOUND.length) {
  // The bank-level claim, compared LIKE WITH LIKE: median weekday against
  // median weekday, and median Sunday against median Sunday. Comparing one
  // game's easiest board against the other's median is not a claim anybody
  // makes, and the first two drafts of this check did exactly that and failed
  // a good bank twice, once on 16 vs 20 and once on 16 vs 16.
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const mine = { wk: med(PUZZLES.filter((p) => !p.sunday).map((p) => p.par)), su: med(PUZZLES.filter((p) => p.sunday).map((p) => p.par)) };
  const theirs = { wk: med(IMPOUND.filter((p) => !p.sunday).map((p) => p.par)), su: med(IMPOUND.filter((p) => p.sunday).map((p) => p.par)) };
  if (mine.wk <= theirs.wk) fail('junkyard vs impound', `median weekday ${mine.wk} does not beat Impound's ${theirs.wk}`);
  else if (mine.su <= theirs.su) fail('junkyard vs impound', `median Sunday ${mine.su} does not beat Impound's ${theirs.su}`);
  else ok('junkyard vs impound', `every rung sits above Impound's, the easiest Junkyard board (${RUNG[1].lo}) clears Impound's Monday ceiling (${IMPOUND_MONDAY_CEILING}), and the median board beats Impound's on both tracks (weekday ${mine.wk} v ${theirs.wk}, Sunday ${mine.su} v ${theirs.su})`);
}

if (!staleFound && BAD === 0) ok('junkyard pool', `${PUZZLES.length} boards, ${sigPool.size} distinct non-red board signatures, no signature over the ${POOL_CEILING}x ceiling on editable boards`);

// ─── check 10: the family ladder is intact in every roster that reads it ────
// A missing key here neither throws nor renders an error: the up-next pick just
// skips that rung, so the ladder quietly loses a game. Checked in BOTH rosters,
// because app/DailyEndCard.jsx keeps its own copy of the slate independent of
// lib/daily-games.js and useNextUnplayed resolves against THAT one.
{
  const SIZES = { park: 6, impound: 7, junkyard: 8 };
  const endCardSrc = fs.readFileSync(new URL('../app/DailyEndCard.jsx', import.meta.url), 'utf8');
  for (const [fam, members] of Object.entries(GAME_FAMILIES)) {
    let famBad = false;
    for (const k of members) {
      if (!DAILY_KEYS.includes(k)) { fail('family', `${fam}: '${k}' is not in lib/daily-games.js DAILY_KEYS`); famBad = true; }
      if (!endCardSrc.includes(`key: '${k}'`)) { fail('family', `${fam}: '${k}' is missing from app/DailyEndCard.jsx, so the up-next ladder skips it silently`); famBad = true; }
    }
    // Only the jam family is a size ladder; another family (jigsaw: Jig and Saw,
    // 2026-11-06) is two sibling games handing each other along, with no order.
    if (fam !== 'jam') { if (!famBad) ok('family', `${fam} in both rosters: ${members.join(', ')}`); continue; }
    const sizes = members.map((k) => SIZES[k]);
    if (sizes.some((v) => v === undefined)) {
      fail('family', `${fam}: a member has no known board size here, so the ladder cannot be checked for order`); famBad = true;
    } else if (sizes.some((v, i) => i && v <= sizes[i - 1])) {
      fail('family', `${fam}: the ladder [${members.join(', ')}] is not in ascending board size [${sizes.join(', ')}]`); famBad = true;
    }
    if (!famBad) ok('family', `${fam} ladder intact in both rosters, ascending: ${members.map((k, i) => `${k} ${sizes[i]}x${sizes[i]}`).join(' -> ')}`);
  }

  // The pick itself. app/useNextUnplayed.js is a React client module, so it is
  // not callable from here; what IS checkable is that it still reads the ladder
  // and still prefers it, and that familyAfter walks the order the copy claims.
  // Both halves matter: a hook that stopped importing familyAfter would leave
  // this file's ladder correct and the end card offering a random Logic game.
  const hookSrc = fs.readFileSync(new URL('../app/useNextUnplayed.js', import.meta.url), 'utf8');
  for (const need of [
    "import { familyAfter } from '@/lib/daily-games'",
    'const fam = familyAfter(self)',
    'setNext(fam[0] || sameCat[0] || open[0] || null)',
    'setList([...fam, ...sameCat, ...rest].slice(0, count))',
  ]) {
    if (!hookSrc.includes(need)) fail('family', `app/useNextUnplayed.js no longer contains \`${need}\`, so the up-next pick has stopped preferring the family`);
  }

  // Every combination of already-played family members, against what the pick
  // would offer. `familyAfter` supplies the order and the hook takes the first
  // member still unplayed, so this is the whole decision.
  {
    const members = GAME_FAMILIES.jam;
    const offer = (self, playedSet) => familyAfter(self).find((k) => !playedSet.has(k)) || null;
    const cases = [
      ['park', [], 'impound'],          // finished the smallest, offered the middle
      ['park', ['impound'], 'junkyard'], // middle already played, skip to the biggest
      ['park', ['impound', 'junkyard'], null], // family exhausted, fall through to category
      ['impound', [], 'junkyard'],      // THE LADDER GOES UP, not back to Parker
      ['impound', ['junkyard'], 'park'],  // top already played, wrap to the smallest
      ['junkyard', [], 'park'],         // top of the ladder wraps
      ['junkyard', ['park'], 'impound'],
      ['junkyard', ['park', 'impound'], null],
    ];
    let ladderBad = 0;
    for (const [self, played, want] of cases) {
      const got = offer(self, new Set(played));
      if (got !== want) {
        ladderBad++;
        fail('family', `finishing ${self} with [${played.join(', ') || 'nothing'}] played offers ${got}, expected ${want}`);
      }
    }
    if (!ladderBad) ok('family', `the ladder offers the right next size in all ${cases.length} played-combinations, wrapping at the top and falling through when ${members.length === 3 ? 'all three are' : 'all are'} done`);
  }
}

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll Junkyard boards verified.');
process.exit(BAD ? 1 : 0);
