// EXTENSION IS REQUIRED on this relative import. Webpack resolves it either
// way, but scripts/verify-daily-five.mjs imports this file directly under node,
// where ESM does not do extension guessing. lib/daily-games.js carries the same
// './sunday-editions.js' for the same reason. Do not drop it.
import { DAILY_GAME_MAP, isRetiredDaily, etTodayISO } from './daily-games.js';

// THE DAILY FIVE — five dailies, one from each of five different categories,
// played as one sitting, with a single leaderboard that ranks on the COMBINED
// placement across all five (owner, 2026-08-17).
//
// It is a LENS OVER THE ROSTER, never a second content stream. The five are the
// same puzzles everybody else plays, on the same dates, scored by the same
// engine. Nothing here stores a result, and a game played on its own still
// counts toward the run: there is nothing to opt into and no way to be locked
// out of it by playing in the wrong order.
//
// WHY COMBINED PLACEMENT AND NOT SCORE. The five games do not share a unit: a
// mini crossword is 25 squares, a mini sudoku is a clock, Dating is five events
// in order, Four is binary. Raw scores are not comparable, so the run converts
// each game's FINISH into the fixed ladder lib/daily-combined already pays
// (15/12/10/8/7/6/5/4/3/2/1 by position, see gamePoints) and adds the five up.
// Max 75. That is why the board is served by /api/quiz/daily-combined?five=1
// rather than by a route of its own: it is the existing combined board over a
// five-game slate with bestN 5. No new scoring, no new storage, no new mirror
// of a comparator that this file would then have to keep in step.
//
// FOUR RULES FOR THE BANK, all of them load-bearing:
//
//   1. FIVE DIFFERENT CATEGORIES, every day. That is what makes the run a
//      spread rather than a genre, what gives it five different boards and five
//      different end screens, and what makes the combined board a test of range
//      instead of a second copy of one game's leaderboard. Enforced by
//      scripts/verify-daily-five.mjs, which fails a day with a repeated cat.
//
//   2. A TIME BUDGET, NOT A GAME COUNT, and the day is ORDERED SHORTEST FIRST,
//      LONGEST LAST (owner, 2026-08-17). Two separate things, both measured
//      rather than guessed:
//
//      The budget. Games are not interchangeable: measured over 14 days of
//      leaderboard rows, Dating's median is 22 seconds and Sando's is 1,171.
//      A weekday five is banked to 600-1000 seconds of TOP-10 median, which is
//      the fast end of the field, so an ordinary player lands around 12 to 18
//      minutes. Monday runs shorter (420-820). Without a budget the generator
//      cheerfully produced 30-minute Sundays, which is a run people stop
//      starting.
//
//      The order. Each day's five ascends by that same median, so the run opens
//      with something you finish in half a minute and closes with the one that
//      takes real time. A player who has already banked four games has a reason
//      to start the fifth; the same five with the long one first loses people
//      before they have anything invested. This is why the array order here is
//      NOT the category order (Word, Numbers, Logic, then the two rotating) that
//      an earlier draft used: the categories decide MEMBERSHIP, the clock
//      decides SEQUENCE. scripts/verify-daily-five.mjs checks the ascent against
//      a dated snapshot of those medians.
//
//   3. AT LEAST SEVEN DAYS BETWEEN REPEATS of any one game, so a fortnight of
//      runs does not read as the same five wearing different dates. That floor
//      alone is not enough, and the phrase is meant literally: satisfy it
//      EXACTLY and a bank can legally emit the same five games seven days
//      apart, which is one week of content on a fortnightly loop. The first
//      generated extension did exactly that (09-14 and 09-21 came out
//      identical, three other pairs shared four of five), so NO TWO RUNS MAY
//      SHARE MORE THAN TWO GAMES, counted against every other run in the bank
//      and not just the neighbouring ones. scripts/gen-daily-five.mjs aims at
//      one; scripts/verify-daily-five.mjs fails above two, from 2026-09-14
//      onward, because 08-20 and 08-27 already share three and the past is
//      frozen.
//
//   4. THE BANK IS DATED AND HAND-PICKED, never derived at read time. A derived
//      five cannot be reviewed before it ships, and it would happily pick a game
//      that published no puzzle that day. A date with no entry simply has no
//      run: fiveFor returns [], every consumer renders nothing, and the site is
//      exactly as it was. That is the correct degrade, so do NOT add a
//      computed fallback. Check the runway instead.
//
// RUNWAY: banked through 2026-10-31 (10-05 to 10-07 have no run). Extend it before it runs out.
//
// AND THE RUNWAY IS PINNED BY THE SHALLOWEST CATEGORY, not by this file. A run
// needs five different categories every day, and the gap rule means a category
// can only fill a day once every seven, so over k consecutive days a category
// supplies at most min(games * ceil(k / 7), k) slots. When that sum falls under
// 5k those days CANNOT be banked, whatever is written here.
//
// Extending past 2026-10-04 was attempted on 2026-08-21, and re-attempted the
// same day once Shoe (a THIRD Cards game, banked to 2026-11-19) had a measured
// median and so became placeable at all. The answer did not move. Shoe helps
// and does not help enough: it lifts the window bound for 10-05..10-10 from 27
// slots to 28, against the 30 those six days need.
//
// AND THE REAL WALL IS SHARPER THAN THAT BOUND, AND IT IS NOT CARDS. Thirty-one
// games stop publishing on 2026-09-29, and the last six banked days (09-29 to
// 10-04) spend THIRTY DISTINCT GAMES between them, every one of which the
// seven-day gap rule then blocks on 10-05 and again on 10-06. Both days come
// out with FOUR live categories against the five a run needs: 10-05 has Cards
// (shoe), Logic (venn, chomp), Numbers (sando, which alone busts the budget)
// and Word (links), and nothing else at all. A day short of five categories
// cannot be filled at any budget, on any seed, so 10-05 is the wall and there
// is no contiguous extension. Skipping it does not help either: 10-07 is the
// first day carrying five live categories, and it cannot reach the 540s budget
// floor without lode, which is in the frozen 09-30 run along with the only End
// Game and Trivia games it has left.
//
// The fix is always to extend the underlying puzzle banks, never to loosen a
// rule here. scripts/gen-daily-five.mjs reports BOTH bounds: the smallest
// window it cannot cover, and any single day that is dead on its own.
//
// RETIREMENT RESIZES A DAY ON ITS OWN. Keys are filtered through isRetiredDaily
// at read time rather than being written down anywhere, so when Extra retires
// (2026-09-29) any day still naming it comes back as a four. Never cache a
// day's size, and never assume fiveFor returns exactly five.
// THE FIVE SLOTS ARE Word, Numbers, Logic, then TWO ROTATING, and that shape is
// deliberate. Word, Numbers and Logic hold 15, 10 and 16 games between them, so
// anchoring on those three guarantees the run always reads as a puzzle sitting
// and guarantees the bank can always be filled. The last two slots rotate over
// Trivia, End Game, Geography, Cards, Arcade and Crowd, shared IN PROPORTION TO
// POOL SIZE: Geography, Cards and Arcade hold two games each, so giving them a
// slot as often as Trivia would put the same two games in the run every seventh
// day forever. Trivia and End Game therefore carry most of the rotation and the
// thin categories are the occasional guest.
//
// Generated against real publication data and then reviewed, never typed from
// memory: an earlier hand-written bank named four games (listed, deep, chain,
// babel) on dates their own puzzle banks do not reach, which does not fail
// anywhere at runtime. gamesForSuffix simply skips a game with no puzzle, so
// the run would have become a silent four with a 60-point ceiling and nothing
// on any surface saying so. scripts/verify-daily-five.mjs now checks exactly
// that, and it is the check to run before extending this bank.
//
// Pricer is excluded on purpose: it is pulled from the server slate (see
// GAME_PUZZLES in lib/daily-slate), so it has no board, no field and no points.
// A run cannot contain a game the scoring engine cannot see.
// Each row is IN RUN ORDER, shortest first. The trailing comment is the day's
// total and the per-game medians, both in top-10 seconds, so a reviewer can see
// the ramp and the budget without re-deriving either.
const RAW = {
  // ── week 1 ────────────────────────────────────────────────────────────────
  // 08-17 is the launch day and it is deliberately the SHORTEST five in the
  // bank at 5:42 of top-10 clock, against the 10 to 16 a normal weekday runs.
  // The run shipped mid-afternoon Eastern, so anyone starting it had a part-gone
  // day to fit it into.
  '2026-08-17': ['dating', 'four', 'emcee', 'paths', 'sixes'],     // Mon   5:42  22/30/35/111/144
  '2026-08-18': ['etch', 'outrank', 'hands', 'tuck', 'cages'],     // Tue  12:11  58/90/112/201/270
  '2026-08-19': ['ping', 'carve', 'blocks', 'docket', 'rung'],     // Wed  15:41  69/111/180/221/360
  '2026-08-20': ['chain', 'extra', 'garble', 'venn', 'quilt'],     // Thu  15:52  30/44/51/128/699
  '2026-08-21': ['mate', 'listed', 'hedge', 'shards', 'suds'],     // Fri  16:35  41/75/93/304/482
  '2026-08-22': ['streak', 'feud', 'suffice', 'babel', 'tally'],   // Sat  14:26  66/90/172/201/337
  '2026-08-23': ['turn', 'blitz', 'taire', 'hearsay', 'lode'],     // Sun  15:33  23/62/78/156/614
  // ── week 2 ────────────────────────────────────────────────────────────────
  '2026-08-24': ['deep', 'stet', 'crunch', 'jester', 'sweep'],     // Mon   8:23  37/57/63/89/257
  '2026-08-25': ['check', 'span', 'plot', 'glyph', 'cipher'],      // Tue  16:32  21/53/93/370/455
  '2026-08-26': ['etch', 'outwit', 'sixes', 'tuck', 'redact'],     // Wed  12:49  58/90/144/201/276
  '2026-08-27': ['chain', 'chomp', 'links', 'extra', 'quilt'],     // Thu  14:10  30/34/43/44/699
  '2026-08-28': ['mate', 'ping', 'stands', 'barter', 'suds'],      // Fri  16:14  41/69/180/202/482
  '2026-08-29': ['sworn', 'listed', 'feud', 'tally', 'rung'],      // Sat  15:16  54/75/90/337/360
  '2026-08-30': ['park', 'blitz', 'hands', 'blocks', 'warmer'],    // Sun  15:33  61/62/112/180/518
  // ── week 3 ────────────────────────────────────────────────────────────────
  '2026-08-31': ['dating', 'four', 'carve', 'axiom', 'strata'],    // Mon   7:46  22/30/111/114/189
  '2026-09-01': ['check', 'deep', 'jester', 'babel', 'cages'],     // Tue  10:18  21/37/89/201/270
  '2026-09-02': ['emcee', 'streak', 'outwit', 'sixes', 'fib'],     // Wed  13:06  35/66/90/144/451
  '2026-09-03': ['defend', 'stet', 'taire', 'alibi', 'cipher'],    // Thu  14:10  28/57/78/232/455
  '2026-09-04': ['extra', 'span', 'etch', 'crunch', 'lode'],       // Fri  13:52  44/53/58/63/614
  '2026-09-05': ['turn', 'paths', 'barter', 'sweep', 'tally'],     // Sat  15:30  23/111/202/257/337
  '2026-09-06': ['links', 'blitz', 'outrank', 'suffice', 'redact'],// Sun  10:43  43/62/90/172/276
  // ── week 4 ────────────────────────────────────────────────────────────────
  '2026-09-07': ['chain', 'bracket', 'plot', 'carve', 'strata'],   // Mon   7:54  30/51/93/111/189
  '2026-09-08': ['mate', 'hands', 'stands', 'cages', 'glyph'],     // Tue  16:13  41/112/180/270/370
  '2026-09-09': ['dating', 'chomp', 'emcee', 'outwit', 'suds'],    // Wed  11:03  22/34/35/90/482
  '2026-09-10': ['stet', 'ping', 'hearsay', 'blocks', 'cipher'],   // Thu  15:17  57/69/156/180/455
  '2026-09-11': ['four', 'streak', 'jester', 'sixes', 'shards'],   // Fri  10:33  30/66/89/144/304
  '2026-09-12': ['check', 'extra', 'sworn', 'crunch', 'warmer'],   // Sat  11:40  21/44/54/63/518
  '2026-09-13': ['links', 'outrank', 'hedge', 'redact', 'tally'],  // Sun  13:59  43/90/93/276/337
  // ── week 5 ────────────────────────────────────────────────────────────────
  '2026-09-14': ['defend', 'garble', 'listed', 'carve', 'fib'],    // Mon  11:56  28/51/75/111/451
  '2026-09-15': ['mate', 'span', 'park', 'tuck', 'quilt'],         // Tue  17:35  41/53/61/201/699
  '2026-09-16': ['bracket', 'outwit', 'alibi', 'cages', 'rung'],   // Wed  16:43  51/90/232/270/360
  '2026-09-17': ['emcee', 'feud', 'axiom', 'sweep', 'cipher'],     // Thu  15:51  35/90/114/257/455
  '2026-09-18': ['stet', 'streak', 'paths', 'hands', 'suds'],      // Fri  13:48  57/66/111/112/482
  '2026-09-19': ['check', 'dating', 'blitz', 'stands', 'shards'],  // Sat   9:49  21/22/62/180/304
  '2026-09-20': ['four', 'etch', 'ping', 'tally', 'warmer'],       // Sun  16:52  30/58/69/337/518
  // ── week 6 ────────────────────────────────────────────────────────────────
  '2026-09-21': ['turn', 'extra', 'outrank', 'strata', 'fib'],     // Mon  13:17  23/44/90/189/451
  '2026-09-22': ['mate', 'garble', 'crunch', 'hearsay', 'redact'], // Tue   9:47  41/51/63/156/276
  '2026-09-23': ['span', 'outwit', 'hedge', 'carve', 'barter'],    // Wed   9:09  53/90/93/111/202
  '2026-09-24': ['defend', 'emcee', 'bracket', 'sworn', 'quilt'],  // Thu  14:27  28/35/51/54/699
  '2026-09-25': ['park', 'taire', 'sixes', 'sweep', 'rung'],       // Fri  15:00  61/78/144/257/360
  '2026-09-26': ['deep', 'links', 'axiom', 'blocks', 'suds'],      // Sat  14:16  37/43/114/180/482
  '2026-09-27': ['check', 'streak', 'ping', 'tuck', 'alibi'],      // Sun   9:49  21/66/69/201/232
  // ── week 7 ────────────────────────────────────────────────────────────────
  '2026-09-28': ['four', 'extra', 'stet', 'feud', 'stands'],       // Mon   6:41  30/44/57/90/180
  '2026-09-29': ['dating', 'garble', 'jester', 'outrank', 'cipher'],// Tue  11:47  22/51/89/90/455
  '2026-09-30': ['chain', 'listed', 'hands', 'suffice', 'lode'],   // Wed  16:43  30/75/112/172/614
  '2026-10-01': ['defend', 'paths', 'strata', 'cages', 'redact'],  // Thu  14:34  28/111/189/270/276
  '2026-10-02': ['bracket', 'blitz', 'docket', 'sweep', 'glyph'],  // Fri  16:01  51/62/221/257/370
  '2026-10-03': ['deep', 'etch', 'taire', 'barter', 'quilt'],      // Sat  17:54  37/58/78/202/699
  '2026-10-04': ['turn', 'plot', 'sixes', 'blocks', 'babel'],      // Sun  10:41  23/93/144/180/201
  // 10-05 to 10-07 carry no run (the wall described above). Extended 2026-10-07 from
  // 10-08 once the underlying banks were restocked; generated by gen-daily-five.mjs.
  // ── week 8 ────────────────────────────────────────────────────────────────
  '2026-10-08': ['mate', 'links', 'carve', 'venn', 'niche'],       // Thu   9:18  41/43/111/128/235
  '2026-10-09': ['defend', 'park', 'crunch', 'outrank', 'shards'], // Fri   9:06  28/61/63/90/304
  '2026-10-10': ['blitz', 'shoe', 'feud', 'barter', 'alibi'],      // Sat  10:59  62/73/90/202/232
  '2026-10-11': ['four', 'chomp', 'listed', 'babel', 'cipher'],    // Sun  13:15  30/34/75/201/455
  '2026-10-12': ['garble', 'span', 'sixes', 'docket', 'tally'],    // Mon  13:26  51/53/144/221/337
  '2026-10-13': ['turn', 'bracket', 'suffice', 'tuck', 'suds'],    // Tue  15:29  23/51/172/201/482
  '2026-10-14': ['emcee', 'taire', 'jester', 'blocks', 'redact'],  // Wed  10:58  35/78/89/180/276
  // ── week 9 ────────────────────────────────────────────────────────────────
  '2026-10-15': ['chain', 'streak', 'hearsay', 'cages', 'warmer'], // Thu  17:20  30/66/156/270/518
  '2026-10-16': ['deep', 'mate', 'outrank', 'paths', 'rung'],      // Fri  10:39  37/41/90/111/360
  '2026-10-17': ['crunch', 'feud', 'hands', 'venn', 'strata'],     // Sat   9:42  63/90/112/128/189
  '2026-10-18': ['defend', 'blitz', 'axiom', 'babel', 'niche'],    // Sun  10:40  28/62/114/201/235
  '2026-10-19': ['links', 'sworn', 'ping', 'shoe', 'sixes'],       // Mon   6:23  43/54/69/73/144
  '2026-10-20': ['check', 'stet', 'listed', 'docket', 'quilt'],    // Tue  17:53  21/57/75/221/699
  '2026-10-21': ['chomp', 'bracket', 'blocks', 'shards', 'tally'], // Wed  15:06  34/51/180/304/337
  // ── week 10 ───────────────────────────────────────────────────────────────
  '2026-10-22': ['four', 'garble', 'alibi', 'sweep', 'suds'],      // Thu  17:32  30/51/232/257/482
  '2026-10-23': ['turn', 'deep', 'outwit', 'stands', 'warmer'],    // Fri  14:08  23/37/90/180/518
  '2026-10-24': ['dating', 'span', 'hands', 'hearsay', 'rung'],    // Sat  11:43  22/53/112/156/360
  '2026-10-25': ['chain', 'park', 'barter', 'niche', 'cipher'],    // Sun  16:23  30/61/202/235/455
  '2026-10-26': ['emcee', 'crunch', 'shoe', 'suffice', 'cages'],   // Mon  10:13  35/63/73/172/270
  '2026-10-27': ['listed', 'outrank', 'axiom', 'sixes', 'glyph'],  // Tue  13:13  75/90/114/144/370
  '2026-10-28': ['check', 'chomp', 'carve', 'redact', 'lode'],     // Wed  17:36  21/34/111/276/614
  // ── week 11 ───────────────────────────────────────────────────────────────
  '2026-10-29': ['defend', 'feud', 'hedge', 'blocks', 'tuck'],     // Thu   9:52  28/90/93/180/201
  '2026-10-30': ['mate', 'bracket', 'taire', 'babel', 'fib'],      // Fri  13:42  41/51/78/201/451
  '2026-10-31': ['deep', 'ping', 'plot', 'hands', 'shards'],       // Sat  10:15  37/69/93/112/304
};

export const DAILY_FIVE = RAW;
export const FIVE_SIZE = 5;
// The run's name, in one place, because it appears on the console band, the
// in-game strip, the board header and the share text.
export const FIVE_NAME = 'The Daily Five';
// The query flag that marks a page as part of a run. It is the ONLY state a run
// carries: no cookie, no localStorage, no row in a table. A run therefore
// survives a reload, a share and a cold browser, and leaving one is just the
// same URL without the flag.
export const FIVE_PARAM = 'five';

// ── dates ────────────────────────────────────────────────────────────────────
// A local suffix/ISO pair rather than an import. lib/daily-slate carries the
// same conversion but pulls in all 63 puzzle banks, which would make this module
// server-only, and lib/daily-combined carries it too but is a much bigger module
// to drag into the client bundle for two lines of arithmetic. Keep these three
// in step; they are the same well-known 'M-D-YY' suffix every daily quizId ends
// in.
export function suffixOfIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  return `${Number(m[2])}-${Number(m[3])}-${Number(m[1]) % 100}`;
}

export function isoOfSuffix(suffix) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(String(suffix || ''));
  if (!m) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `20${m[3]}-${p(m[1])}-${p(m[2])}`;
}

// ── reads ────────────────────────────────────────────────────────────────────
// The run's game keys for an ET 'YYYY-MM-DD', in run order. Unknown keys and
// retired games drop out HERE, which is the only place that filtering happens,
// so no caller has to know about either. Returns [] for a date with no entry,
// which every consumer must treat as "there is no run today" rather than as an
// error.
export function fiveFor(iso) {
  const keys = RAW[iso];
  if (!Array.isArray(keys)) return [];
  return keys.filter((k) => DAILY_GAME_MAP[k] && !isRetiredDaily(k, iso));
}

// Same, keyed by the 'M-D-YY' suffix the scoring routes and quizIds speak.
export function fiveForSuffix(suffix) {
  const iso = isoOfSuffix(suffix);
  return iso ? fiveFor(iso) : [];
}

// Today's run, in ET, the timezone every daily rolls over on.
export function todayFive(today) {
  return fiveFor(today || etTodayISO());
}

// The run's games as registry rows ({ key, name, cat, tag, href, img, ... }),
// which is what every render surface actually wants. Same filtering as fiveFor.
export function fiveGamesFor(iso) {
  return fiveFor(iso).map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
}

// Is this game in that day's run? The guard every consumer wants before drawing
// a strip: a stale or hand-typed ?five=1 must not put Suds inside a run that
// does not contain it.
export function inFive(gameKey, iso) {
  return fiveFor(iso).includes(gameKey);
}

// A game's route WITH the run attached. No date is carried: a run is always
// today's, and the archive is reached by a game's own ?p=<num> instead.
// Reads href off the registry rather than deriving it, so /jesters and /parker
// (whose directories are not their keys) come out right.
export function fiveHref(key) {
  const g = DAILY_GAME_MAP[key];
  const base = (g && g.href) || `/${key}`;
  return `${base}${base.includes('?') ? '&' : '?'}${FIVE_PARAM}=1`;
}

// Read the active run off the URL. Window-based rather than useSearchParams on
// purpose: useSearchParams forces a CSR bail-out that has to sit inside a
// <Suspense> boundary, and a single page rendering a consumer outside one fails
// the whole `next build`. Every link that carries the flag is a plain <a>, so
// these are full navigations and window.location is always current on mount.
// Call it in an effect, never during render: it returns false on the server.
export function readFiveParam() {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get(FIVE_PARAM) === '1';
  } catch (e) { return false; }
}

// The run's state for one viewer, from a set of already-played game keys.
// Deliberately takes a Set rather than fetching: every caller already holds the
// day's completions, and a run must never cost a request of its own.
//
// `done` is PLAYED-AND-FINISHED, not SOLVED. Navigation only needs to know what
// is left, so that is all this answers; the four-state colouring belongs to the
// surfaces that hold the scoring data.
export function fiveProgress(iso, doneKeys) {
  const members = fiveFor(iso);
  const has = (k) => !!(doneKeys && doneKeys.has(k));
  const done = members.filter(has);
  return {
    members,
    done: done.length,
    total: members.length,
    next: members.find((k) => !has(k)) || null,
    complete: !!members.length && done.length === members.length,
  };
}
