// EXTENSION IS REQUIRED on this relative import, for the same reason
// lib/daily-five.js carries it: scripts/verify-circuits.mjs imports this file
// directly under node, where ESM does not do extension guessing. Do not drop it.
import { DAILY_GAME_MAP, isRetiredDaily, etTodayISO } from './daily-games.js';
import { FIVE_NAME, fiveFor, FIVE_PARAM } from './daily-five.js';

// CIRCUITS — one family, seventeen members (owner, 2026-08-18; the chess split
// of 2026-08-21 added the sixteenth, and Gauntlet the seventeenth on
// 2026-08-24).
//
// A circuit is five dailies played as one sitting, scored on the COMBINED
// placement across them, exactly like the Daily Five. The Five is circuit #1
// and it is the MARQUEE: gold, always first, always the default selection.
// The other sixteen are SKILL circuits.
//
// THE DAILY FIVE DOES NOT CHANGE. Its roster, selection rules (one game from
// each of five different categories, Word + Numbers + Logic plus two rotating
// in proportion to pool size), ordering (shortest median first), time budget,
// seven-day repeat gap, hand-banked review and scripts/verify-daily-five.mjs
// gate are all untouched and all still live in lib/daily-five.js. This module
// does not import its roster, generate it, or wrap it: it names it as the
// marquee and otherwise leaves it alone. The only thing that changed is that
// the console band now has a way to reach the other fifteen.
//
// WHY THE TWO KINDS DIFFER, and why that is fine:
//
//   The MARQUEE is a hand-banked DAILY roster — a different five every day,
//   chosen for spread across categories and reviewed before it ships. It can
//   run out (banked through 2026-09-13) and it has to be extended.
//
//   A SKILL circuit is a FIXED roster — the same games every day, chosen for
//   what they exercise rather than for spread. There is nothing to bank,
//   nothing to review and nothing to expire: the games change because their
//   puzzles change, not because the roster does. That is the whole reason the
//   sixteen cost no maintenance. (Sudoku is the one exception, a rotating pool;
//   see its entry.)
//
// NO NEW SCORING, NO NEW STORAGE. Every circuit is served by
// /api/quiz/daily-combined?circuit=<id>, which is the same route with a
// narrowed slate and bestN 5, exactly as ?five=1 already works. One comparator,
// one table. See the block comment in that route.
//
// NEITHER EXCLUSIVE NOR EXHAUSTIVE (owner ruling, 2026-08-24). Both constraints
// are gone on the same day, and they were the same constraint wearing two hats:
// between them they decided rosters by arithmetic instead of by meaning.
//
//   A GAME MAY SIT IN SEVERAL CIRCUITS. Exclusivity was argued as a scoring
//   rule, that one play must not pay into two skill boards. It never was one:
//   the marquee already overlaps every skill circuit it draws from, and each
//   circuit is its own narrowed board rather than a share of a pot. What it
//   actually did was force a single answer where two were true, so Four and
//   Chain could be filed under Table Games or Board Games but not both, and
//   Rung sat in Word Building because Wordplay was full.
//
//   A GAME NEED NOT SIT IN ANY. Where no circuit's title describes a game, it
//   stays out. Exhaustiveness is what produced the five-game Arcade (see its
//   note below), which took three quiz games because the cap said five.
//
// scripts/verify-circuits.mjs reports both as WARNINGS now and fails on neither.
// What is still enforced: the cap of five on a fixed roster (a run is one
// sitting, and a pool bigger than that needs `rotate`, which only Sudoku uses),
// the floor of two, shortest-median-first order, and the trophy tier.
//
// The count comes out at 69 of 69 eligible games over 16 circuits, five of them
// carrying a second membership (Blitz, Dating, Four, Chain, Listed). Sizes run
// from a pair to the Sudoku pool of eight. The no-tiny-circuits floor still holds in general, a
// circuit's whole score being 15 points per game, so a three tops out at 45 and
// a pair at 30 against a five's 75. The owner retired that floor as a rule on
// 2026-08-24 ("circuits can be less than 5") after sanctioning it case by case
// three times running: the chess three on 2026-08-21, because chess is its own
// discipline and filing Queen somewhere it does not belong was the worse lie;
// the Board Games pair when Race went; and the Arcade pair, where a five
// assembled out of three games the title does not describe is worth less than
// an honest pair. A short circuit pays less, and that is the whole cost.
// Against the 68 in the registry:
//
//   - Circa retired 2026-07-20, so it is not in a circuit. Retirement is
//     handled at READ time (circuitKeysFor filters through isRetiredDaily), so
//     Extra can stay in Recall and simply drops out of it on 2026-09-29,
//     leaving a four. Never assume a circuit returns exactly five.
//   - Pricer is excluded on purpose, the same reason it is out of the Daily
//     Five: it is pulled from the server slate (GAME_PUZZLES in
//     lib/daily-slate), so it has no board, no field and no points. A run
//     cannot contain a game the scoring engine cannot see.
//
// A CIRCUIT MAY DECLARE ITS OWN ORDER instead, with `order` (owner,
// 2026-08-30). The Gauntlet does: Deep closes the run, Streak sits second to
// last, and everything between them is shuffled fresh each ET day. Two reasons
// it earns the exception. Ending on Deep ends the run on the day's one topic
// rather than on the forty-question grind, and Deep is the shortest bank, so
// the run finishes on a sprint instead of petering out. And a fixed middle
// meant Atlas was the second quiz every single day forever; shuffled, the run
// has a different shape each morning without any new content.
//
// THE SHUFFLE IS A PURE FUNCTION OF THE DATE, never of the player. Everyone
// gets the same order on the same day, which is what lets one leaderboard
// compare runs at all, and it is derived rather than banked so it needs no
// storage and never runs out. It lives inside circuitKeysFor with the rotate
// rule, so there is still exactly one copy of "what is today's roster, in what
// order" anywhere in the codebase.
//
// ORDER IS THE MARQUEE'S RULE, applied to a fixed roster: SHORTEST FIRST,
// LONGEST LAST, by the measured top-10 median clock. A circuit opens with
// something you finish in half a minute and closes with the one that takes real
// time, so a player who has banked four games has a reason to start the fifth.
// The medians are the dated snapshot in scripts/verify-daily-five.mjs (measured
// 2026-08-17); the ORDER derived from them is baked into the arrays below
// rather than computed here, because a snapshot is a measurement with a date on
// it and does not belong in a library. scripts/verify-circuits.mjs re-derives
// the ascent from that same snapshot and fails a roster that is out of order.
//
// These sixteen REPLACE the fourteen ad-hoc groups that used to live inline in
// app/DailyStrip.jsx. What was wrong with those was that they were a SECOND
// list: they drifted from the runnable rosters the moment either changed. It
// was never their shape. They ran from 2 to 7 games, left games in no circuit
// and put games in two, all three of which are allowed again as of 2026-08-24.
// DailyStrip now derives its filter
// strip from CIRCUIT_NAME_LISTS below, so the thing you filter by and the thing
// you can run are the same sixteen. Renamed on the way: Anagrams became
// Wordplay (it was never only anagrams), Chess and Board Games merged into
// Chess & Board, History became Recall (it holds the whole trivia recall pool,
// not only dated events), and Survival was dissolved into Arcade. That last one
// was undone on 2026-08-24: Arcade went back to the two games that share its
// name and the survival games went into no circuit at all.
//
// A CIRCUIT'S TITLE HAS TO DESCRIBE ITS ROSTER, and where the two disagree it is
// the ROSTER that moves (owner ruling, 2026-08-24). Arcade is the case that
// produced the rule. It ran five games because a five scores 75 and a pair
// scores 30, so Blitz (Numbers) and Streak and Deep (Trivia) were filed under a
// title none of them wears, purely to reach the cap: they are quiz games, and
// the argument for them was that they share a SHAPE with an arcade game rather
// than a subject. Reaching a points total is not a reason to call a trivia quiz
// an arcade game. Arcade is a PAIR now, Blocks and Sweep, which is exactly the
// registry's Arcade category, and the three quiz games are in no circuit.
//
// This is NOT a ban on crossing categories, which is the whole point of the
// axis: Spatial still reaches into Geography, Ranking into Crowd Psychology,
// Deduction across Logic and Numbers alike. Those rosters cross a category and
// still answer to their own name. What a circuit may not do is take in a game
// its own name does not describe.
//
// It is also why the strip on the console dedupes: a category and a circuit
// sharing a name put the same word in the filter twice pointing at two
// different sets. See the strip's block comment in app/DailyStrip.jsx.

// The marquee's id. It is the ONLY id that does not name a fixed roster, and
// every consumer branches on it rather than on a name.
export const MARQUEE_ID = 'five';
export const CIRCUIT_PARAM = 'circuit';

// ── RUNNABLE CIRCUITS ──────────────────────────────────────────────────────
// A circuit flagged `run: true` can be played as ONE LONG QUIZ at
// /circuits/<id>/run: no hand-off between games, no start gate on each, no end
// card between them. One board deals every game's questions in turn, tells you
// in a line when a quiz has ended for you, and starts the next.
//
// IT IS A PRESENTATION, NOT A SCORING CHANGE. The run files exactly the rows
// the games' own clients file, one per game, with that game's quizId, score,
// total and clock. Every per-game board, the circuit board, IQ Points and the
// trophies see a player who played those games, because they did.
//
// RUN_GAMES is the whole of what makes it possible: a game can be dealt into a
// continuous board only if its day is a bank of four-choice questions in play
// order. It is plain data here so scripts/verify-circuits.mjs can assert that a
// circuit flagged `run` holds only games the run page can serve, without
// importing a page component or a question bank. Adding a sixth quiz of the
// same shape means adding its key HERE and to the BANKS map in
// app/circuits/[id]/run/page.js, and nothing else.
export const RUN_GAMES = ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'streak'];

// A SECOND RUN ENGINE (owner, 2026-09-05). The Valet Gauntlet plays the three
// sliding-block lots back to back on one clock, and a jam board is not a
// question bank, so the quiz run page cannot deal it. A circuit names its
// engine with `engine` ('quiz' is the default and what RUN_GAMES covers;
// 'jam' is the lib/jam-core family). RUN_ENGINES maps each engine to the only
// games it can serve, so scripts/verify-circuits.mjs can prove a runnable
// circuit holds nothing its engine cannot deal, whichever engine it names.
export const JAM_RUN_GAMES = ['park', 'impound', 'junkyard'];
export const RUN_ENGINES = { quiz: RUN_GAMES, jam: JAM_RUN_GAMES };

export function isRunnableCircuit(id) {
  const c = circuitById(id);
  return !!(c && c.run && !isMarquee(id));
}

// Which engine deals a runnable circuit, or null for a circuit with no run.
export function runEngine(id) {
  const c = circuitById(id);
  if (!c || !c.run || isMarquee(id)) return null;
  return c.engine || 'quiz';
}

// The games a circuit's run engine can serve. Empty for a circuit with no run.
export function runGamesFor(id) {
  return RUN_ENGINES[runEngine(id)] || [];
}

export function runHref(id) {
  return `${CIRCUIT_BASE}/${encodeURIComponent(id)}/run`;
}

// Each entry: { id, name, blurb, keys, trophy } with keys IN RUN ORDER,
// shortest first. The trailing comment is that game's measured top-10 median in
// seconds, so a reviewer can see the ramp without re-deriving it; the one after
// the roster is the circuit's TOTAL, which is what sets its trophy tier.
//
// `trophy` is the metadata for that circuit's entry in the trophy case. It
// lives here, beside the roster it is earned by, but the trophy ROWS are listed
// literally in lib/trophy-defs.js, which is client-safe and deliberately has no
// data imports. scripts/verify-circuits.mjs asserts the two agree 1:1, so they
// cannot drift even though neither imports the other.
//
// `share` is the circuit's SHARE COPY, two strings, and it lives here for the
// same reason `trophy` does: it is a fact about that roster, and a copy deck
// kept in a component drifts from the roster it describes the first time a
// circuit is renamed.
//
//   invite — the evergreen line for sharing the CIRCUIT. It never mentions a
//            score or a date, so it does not go stale and a recipient who has
//            never played is not handed somebody else's result.
//   result — a short tag under the figures when sharing a FINISHED run. The
//            numbers are built by circuitShareResult; this is only the line
//            that says which circuit those numbers are from.
//
// NO EM DASHES in either, per the house copy rule. Both are checked for length,
// for em dashes, and for uniqueness by scripts/verify-circuits.mjs.
//
// TIER IS THE CIRCUIT'S LENGTH, not a guess at difficulty: bronze under 6
// minutes of top-10 clock, silver to 20, gold beyond. Board Games is three
// games totalling under two minutes and Crosswords is five totalling
// forty-seven, and a trophy case that called those the same thing would be
// lying about which one is the achievement.
export const CIRCUITS = [
  {
    id: 'crosswords',
    name: 'Crosswords',
    blurb: 'Five crosswords, the mini first and the clueless ones last.',
    share: {
      invite: "Five crosswords in one sitting: the mini, one in pieces, and three with no clues at all.",
      result: "Five crosswords, three of them clueless.",
    },
    keys: ['emcee', 'shards', 'glyph', 'crux', 'anon'],          // 35/304/370/1031/1106 = 2846
    trophy: { name: 'Fully Crossed', tier: 'gold', icon: 'Grid3x3' },
  },
  {
    id: 'word-building',
    name: 'Word Building',
    blurb: 'Build the highest-scoring words you can out of a fixed set of letters.',
    share: {
      invite: "Four sets of letters and four different ways to spend them. Highest score takes each one.",
      result: "Four sets of letters, four ways to spend them.",
    },
    // RUNG LEFT on 2026-08-24, for the blurb directly above it: a word ladder is
    // not built out of a fixed set of letters and is not scored on what the
    // words are worth, so it was the one game here the title did not describe.
    // It is in Wordplay now. 1218s still tiers gold, with nothing to spare.
    keys: ['babel', 'tuck', 'barter', 'lode'],                   // 201/201/202/614 = 1218
    trophy: { name: 'Master Builder', tier: 'gold', icon: 'Hammer' },
  },
  {
    id: 'wordplay',
    name: 'Wordplay',
    blurb: 'Scrambles, hidden errors, buried words, ladders and words you close in on.',
    share: {
      invite: "Five games that hide a word in plain sight: scrambled, misspelled, buried, one rung at a time, or just out of reach.",
      result: "Five games, five ways to hide a word.",
    },
    keys: ['garble', 'stet', 'strata', 'rung', 'warmer'],        // 51/57/189/360/518 = 1175
    trophy: { name: 'Wordsmith', tier: 'silver', icon: 'Feather' },
  },
  {
    id: 'sudoku',
    lead: 3,
    name: 'Sudoku',
    // THE COPY SAYS FIVE, NOT NINE (owner, 2026-09-05: "why does our Sudoku
    // circuit refer to 9 sudokus when it is 5?"). Nine is the size of the pool
    // below, a fact about the rotation; five is what a player is handed and
    // what the board ranks, and leading with the pool made the card read as a
    // nine-grid run. The pool stays a footnote ("from a rotating pool") so
    // tomorrow's different mix is still explained.
    blurb: 'Five sudokus a day, easiest grid first, from a rotating pool.',
    share: {
      invite: "Five sudokus on the day's card, easiest grid first, drawn from a rotating pool. A different mix tomorrow.",
      result: "Five sudokus, easiest grid first.",
    },
    // THE ONE ROTATING SKILL CIRCUIT (owner, 2026-08-23). The sudoku family
    // outgrew a fixed five when Towers, Mercury and Polka landed, so this
    // roster is a POOL of twelve and the circuit plays FIVE of them a day,
    // Daily Five style: a sliding window over the pool advances one game at
    // Eastern midnight (deterministic from the date, no bank, no storage),
    // every pool member plays five days in every twelve, and the day's five
    // still run shortest first because the pool below is stored in ascending
    // measured order and the window re-sorts to it. `rotate` is the window
    // size; circuitKeysFor owns the selection, so the board route, the
    // trophies, the band and the landing page all follow with no edits of
    // their own. Pool medians: towers ~110 est / sixes 144 / cages 270 /
    // suds 482 / diag ~550 est / rim ~600 est / quilt 699 / polka ~750 est /
    // knight ~800 est / frame ~850 est / mercury ~900 est / sando 1171. Every
    // 5-window totals 1705s or more, so the trophy stays gold on every day's
    // mix (scripts/verify-circuits.mjs recomputes all twelve windows).
    rotate: 5,
    keys: ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'mercury', 'sando'],
    trophy: { name: 'Grid Locked', tier: 'gold', icon: 'Grid2x2' },
  },
  {
    id: 'mental-math',
    name: 'Mental Math',
    blurb: 'Arithmetic under a clock, from quick sums to a full cryptarithm.',
    share: {
      invite: "Five rounds of arithmetic against a clock, from one quick target to a full cryptarithm. No calculator.",
      result: "Five rounds of arithmetic, no calculator.",
    },
    // BLITZ JOINED on 2026-08-24: twenty arithmetic problems against a clock is
    // exactly what this circuit says it is. It is also in Gauntlet, which is the
    // other true thing about it, and since 2026-08-24 a game may be in both.
    keys: ['blitz', 'crunch', 'carve', 'tally', 'cipher'],       // 62/63/111/337/455 = 1028
    trophy: { name: 'Quick Reckoner', tier: 'silver', icon: 'Calculator' },
  },
  {
    id: 'deduction',
    name: 'Deduction',
    blurb: 'Testimony, alibis and case files that narrow to exactly one answer.',
    share: {
      invite: "Five cases with one answer each. Liars, alibis, and just enough testimony to get there.",
      result: "Five cases, one answer each.",
    },
    keys: ['sworn', 'hearsay', 'suffice', 'docket', 'alibi'],    // 54/156/172/221/232 = 835
    trophy: { name: 'Case Closed', tier: 'silver', icon: 'Search' },
  },
  {
    id: 'pencil',
    name: 'Pencil Puzzles',
    blurb: 'Loops, pictures and seating plans drawn out of pure constraint.',
    share: {
      invite: "Loops, pictures and seating plans, drawn out of nothing but the constraints. Five puzzles, back to back.",
      result: "Five puzzles drawn out of pure constraint.",
    },
    keys: ['etch', 'jester', 'hedge', 'paths', 'fib'],           // 58/89/93/111/451 = 802
    trophy: { name: 'Sharpened', tier: 'silver', icon: 'PenTool' },
  },
  {
    id: 'spatial',
    name: 'Spatial Puzzles',
    blurb: 'Routes, shapes and places, on a board and on the map.',
    share: {
      invite: "Routes, shapes and places, on a board and on the map. Five games, and none of them take long.",
      result: "Five games of routes, shapes and places.",
    },
    keys: ['chomp', 'span', 'park', 'ping', 'plot'],             // 34/53/61/69/93 = 310
    trophy: { name: 'Way Finder', tier: 'bronze', icon: 'Compass' },
  },
  {
    id: 'sorting',
    name: 'Sorting',
    blurb: 'Put things in the right group, the right set, or the right order.',
    share: {
      invite: "Five games about putting things where they belong: the right group, the right overlap, the right order.",
      result: "Five games, five ways to be sorted.",
    },
    // DATING JOINED on 2026-08-24. "Put history in order" is the whole game, and
    // the right order is a third of what this circuit's own blurb promises. It
    // stays in Recall, where it is equally at home.
    keys: ['dating', 'links', 'axiom', 'venn', 'stands'],        // 22/43/114/128/180 = 487
    trophy: { name: 'Sorted', tier: 'silver', icon: 'ArrowDownUp' },
  },
  {
    id: 'chess-board',
    name: 'Board Games',
    blurb: 'Won positions on a board, and one move that throws each of them away.',
    share: {
      invite: "Four games, each a position already won, and one move that throws it away. The least forgiving circuit on the site.",
      result: "Four games, four ways to throw a win away.",
    },
    // Renamed from Chess & Board on 2026-08-21, when the chess games moved out
    // into the all-chess circuit below (owner ruling) and Race arrived. Race was
    // deleted from the roster later the same day, leaving a pair. The id stays
    // chess-board on purpose: it is the URL and the trophy key, and the circuit
    // boards already played hang off it.
    //
    // FOUR AND CHAIN JOINED on 2026-08-24, which is the change overlap was
    // wanted for. Both are a board position already won and one move from
    // thrown away, which is this circuit's whole definition; they were in Table
    // Games alone only because a game could not be in two. They still are in
    // Table Games, where "cards and counters across a table" is just as true of
    // them. 104s still tiers bronze.
    keys: ['check', 'turn', 'four', 'chain'],                    // 21/23/30/30 = 104
    trophy: { name: 'Endgame Sweep', tier: 'bronze', icon: 'Swords' },
  },
  {
    id: 'chess',
    name: 'Chess',
    blurb: 'The chess table: save the king, mate the king, queen the pawn.',
    share: {
      invite: "Three games at the chess table: save the king, mate the king, and walk a pawn to its crown. Perfect play punishes everything else.",
      result: "Three games at the chess table.",
    },
    // The chess-only circuit (owner ruling, 2026-08-21). Three games sits
    // under the usual floor, and is sanctioned: chess is its own discipline,
    // and filing Queen in a circuit it does not belong to was the worse lie.
    keys: ['defend', 'mate', 'queen'],                           // 28/41/~75 est = 144
    trophy: { name: 'Grandmaster', tier: 'bronze', icon: 'Crown' },
  },
  {
    id: 'table',
    name: 'Table Games',
    blurb: 'Cards and counters, the games you would play across a table.',
    share: {
      invite: "Five games you would play across a table: two solitaires, a blackjack shoe, and two boards a move away from won.",
      result: "Five games across a table.",
    },
    keys: ['chain', 'four', 'taire', 'shoe', 'hands'],           // 30/30/78/~100 est/112 = 350
    trophy: { name: 'Full Table', tier: 'bronze', icon: 'Spade' },
  },
  {
    id: 'recall',
    name: 'Recall',
    blurb: 'What happened, when it happened, and how much of it you can name.',
    share: {
      invite: "What happened, when it happened, and how much of it you can still name. Nothing multiple choice.",
      result: "Recall, start to finish, and no multiple choice.",
    },
    keys: ['dating', 'extra', 'listed', 'niche', 'redact'],      // 22/44/75/~150 est/276 = 567
    trophy: { name: 'Long Memory', tier: 'silver', icon: 'History' },
  },
  {
    id: 'ranking',
    name: 'Ranking',
    blurb: 'Call the order, and call what everybody else is going to say.',
    share: {
      invite: "Five games: three score you against what everybody else said today, two against an answer key. Call the crowd first.",
      result: "Three crowd calls and two answer keys.",
    },
    // LISTED JOINED on 2026-08-24: ranking a list top to bottom is calling the
    // order, which is the first half of this circuit's blurb. It stays in
    // Recall. The extra game takes the roster past six minutes, so the trophy
    // moves bronze to silver, which is computed rather than chosen.
    keys: ['bracket', 'listed', 'feud', 'outrank', 'outwit'],    // 51/75/90/90/90 = 396
    trophy: { name: 'Called It', tier: 'silver', icon: 'ListOrdered' },
  },
  {
    id: 'arcade',
    name: 'Arcade',
    blurb: 'One life, a running clock, and a score you are trying to beat.',
    share: {
      invite: "One life, a running clock, and a score to chase. Two games that do not let you take it back.",
      result: "Two games, one life each.",
    },
    // THE PAIR THAT MATCHES THE NAME (owner, 2026-08-24). This held five by
    // taking Blitz off Numbers and Streak and Deep off Trivia; all three are
    // quiz games, and the roster was built to reach the cap rather than to
    // describe the title. What those three actually share is a SHAPE, one life
    // and no way back, and that shape now has its own circuit under its own
    // name (Gauntlet, below) rather than borrowing this one's. 437s still tiers
    // silver, so the trophy is unchanged.
    keys: ['blocks', 'sweep'],                                   // 180/257 = 437
    trophy: { name: 'High Score', tier: 'silver', icon: 'Gamepad2' },
  },
  {
    id: 'gauntlet',
    name: 'Trivia Gauntlet',
    // LEAD: leftmost on the browse surfaces (owner, 2026-08-29). See
    // DISPLAY_CIRCUITS below. It does NOT move in ALL_CIRCUITS, which is the
    // cycle order and has the marquee as its head by rule.
    lead: 1,
    blurb: 'Seven trivia games back to back. One wrong answer ends that game and starts the next.',
    share: {
      // ALL SEVEN ARE NAMED (2026-08-30). This listed six areas for a seven
      // quiz run, so the line quietly dropped Streak, and it is the line that
      // becomes the landing page's meta description and every share's second
      // row. Keep it under about 150 characters for that reason.
      invite: "Seven trivia quizzes, one life in each: a topic in depth, the map, sport, business, the screen, who said it, and forty questions of anything at all.",
      result: "Seven quizzes, one life in each. How far do you get?",
    },
    // NEW on 2026-08-24, and it is the honest half of what the old five-game
    // Arcade was grouping. Every member is multiple choice, one life, and ends
    // on the first miss. Atlas joined at its launch on 2026-08-25, and it is a
    // Geography game in the registry, which is the other true thing about it.
    //
    // BLITZ LEFT AND BIZ JOINED on 2026-08-27, when this became the first
    // RUNNABLE circuit. Blitz ends on a miss like the rest, but it is mental
    // arithmetic against a clock rather than a bank of questions, so it is the
    // one member that could not be dealt into a continuous board. It keeps its
    // home in Mental Math and simply stops being double listed. Biz is the same
    // twenty-five question shape as Atlas and Sport, so the roster is now
    // exactly the five one-life trivia quizzes, which is both what the title
    // says and what the run needs.
    run: true,
    // THE BOARD IS QUESTIONS RIGHT, NOT PLACEMENT POINTS (owner, 2026-08-30),
    // and this circuit is the only one that says so. See circuitScoreMode
    // below for why it is the one, and lib/daily-combined rankByCorrect for
    // what it changes (the board's order and the number on it, nothing else).
    score: 'correct',
    // SEVEN, not five (owner, 2026-08-29). See the cap note above; Script and
    // Quotes are the same twenty-five question shape as Atlas, Sport and Biz,
    // so they sit with them in the middle of the ramp.
    cap: 7,
    // `keys` stays in ASCENT order. It is the canonical list: the ladder takes
    // each game's colour from its slot here, so a game keeps the same colour
    // whatever slot the shuffle drops it into today, and the verifier checks
    // the ascent against this rather than against a shuffled day.
    keys: ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'streak'],   // 37/45/45/45/45/45/66 = 328
    // Deep closes, Streak second to last, the other five shuffled daily.
    order: { tail: ['streak', 'deep'] },
    trophy: { name: 'Last One Standing', tier: 'bronze', icon: 'Shield' },
  },
  {
    id: 'valet',
    name: 'Valet Gauntlet',
    blurb: 'Parker, Impound and Junkyard back to back on one clock. Fastest out of all three lots wins.',
    share: {
      invite: "Three jammed lots, one clock: a six by six, a seven by seven and an eight by eight. The fastest valet out of all three takes the day.",
      result: "Three lots, one clock. Fastest out wins.",
    },
    // NEW on 2026-09-05 (owner). The jam family is a ladder (GAME_FAMILIES in
    // lib/daily-games.js: Parker 6x6, Impound 7x7, Junkyard 8x8), and this is
    // that ladder played as one sitting, the way the Trivia Gauntlet plays the
    // question banks. It is a circuit in the code and "the Valet Gauntlet" to
    // a reader, exactly as the Trivia Gauntlet is.
    //
    // THE BOARD IS THE CLOCK, NOT THE MOVE COUNT (owner, 2026-09-05). Each lot
    // still grades its own board on moves against par, exactly as before, and
    // that is what the three games pay into best-N, the crown and IQ Points.
    // This circuit's board ranks on the COMBINED CLOCK across the three, and
    // only a run that parked all three takes a rank. See circuitScoreMode.
    run: true,
    engine: 'jam',
    score: 'time',
    // Ascending board size, which is also ascending measured clock, so the
    // ladder and the shortest-first rule agree without a declared order.
    keys: ['park', 'impound', 'junkyard'],   // 61/~150 est/~240 est = 451
    trophy: { name: 'Keys, Please', tier: 'silver', icon: 'Car' },
  },
];

// The marquee, in the same shape as a skill circuit so every surface can render
// one list. `keys` is null on purpose: the marquee's roster is a DAILY read out
// of lib/daily-five, not a fixed array, and a caller that reaches for .keys
// instead of circuitKeysFor would silently get yesterday's run. Use the
// accessors.
export const MARQUEE = {
  id: MARQUEE_ID,
  lead: 2,
  name: FIVE_NAME,
  blurb: 'One game from each of five categories, shortest first. A new five at midnight.',
  share: {
    invite: "One game from each of five categories, shortest first, and a different five every day. Today's is up.",
    result: "Five categories, one run, a new five tomorrow.",
  },
  keys: null,
  marquee: true,
  // Gold, and never anything else: the roster is different every day, so
  // finishing it is a different feat from finishing a fixed five, and it is the
  // one circuit whose trophy cannot be farmed by picking an easy day.
  trophy: { name: 'The Full Five', tier: 'gold', icon: 'Star' },
};

// The whole family, marquee first. This is the cycle order: stepping right from
// the last skill circuit wraps back to the marquee, and stepping left from the
// marquee wraps to the last, so the Five is the HEAD of the list rather than
// something sitting beside it.
export const ALL_CIRCUITS = [MARQUEE, ...CIRCUITS];

// THE BROWSE ORDER, which is deliberately NOT the cycle order above (owner,
// 2026-08-29). ALL_CIRCUITS is the family's STRUCTURE: the marquee is its
// head, stepping left from it wraps to the last skill circuit, and
// scripts/verify-circuits.mjs asserts that head, so nothing may reorder it.
// What a browse surface wants is different, a FEATURED slot: the Trivia
// Gauntlet reads leftmost on the home page's circuits shelf and first on
// /circuits, ahead of the Five.
//
// It is a `lead: true` flag on the circuit rather than a second hand-kept
// array, for the reason this file keeps repeating about CIRCUIT_NAME_LISTS: a
// display list written out by hand is a second roster, and it drifts from this
// one the moment either changes. Flag more than one and they lead in the order
// they already sit in; flag none and this is ALL_CIRCUITS exactly.
// THE LEADS ARE ORDERED BY ID (owner, 2026-08-31: the third card should be the
// sudokus). Flagging three circuits `lead` made all three lead, but "in the
// order they already sit in" — which is ALL_CIRCUITS order, and that put the
// Gauntlet last. Which three lead is still the flag's job; the ORDER among them
// is an editorial call and is written here.
const LEAD_ORDER = ['gauntlet', MARQUEE_ID, 'sudoku'];
const leadRank = (c) => {
  const i = LEAD_ORDER.indexOf(c.id);
  return i < 0 ? LEAD_ORDER.length : i;
};
export const DISPLAY_CIRCUITS = [
  ...ALL_CIRCUITS.filter((c) => c.lead).sort((a, b) => leadRank(a) - leadRank(b)),
  ...ALL_CIRCUITS.filter((c) => !c.lead),
];

const BY_ID = ALL_CIRCUITS.reduce((m, c) => { m[c.id] = c; return m; }, {});

// HOW A CIRCUIT'S BOARD IS RANKED, and there are exactly two answers.
//
//   'points'  (the default, and every circuit but one) sums the 0..15 ladder
//             each game already pays by finishing position, best-N over the
//             roster. It is the only rule that can combine a sudoku, a
//             crossword and a word ladder, because their raw scores are three
//             different units and adding them would be arithmetic on nothing.
//
//   'correct' ranks on the RAW number of questions answered right across the
//             whole run, shortest combined clock taking a tie.
//
// The Trivia Gauntlet is 'correct' because it is the one circuit whose members
// all score the SAME unit: seven banks of four-choice questions, one life
// each, where the score IS the number you got right. On a roster like that the
// ladder is a translation nobody asked for. A player who answered 61 questions
// correctly read a board that said 74.5, and the only way to learn whether
// 74.5 was good was to go and read the scoring rules, which is the definition
// of a confusing leaderboard.
//
// A SECOND CIRCUIT MAY ONLY TAKE THIS RULE IF ITS MEMBERS SHARE A UNIT. Seven
// games all scored out of their own question count can be added up; five games
// scored out of squares, letters, shapes, moves and seconds cannot, and a
// board that added them would rank whoever happened to play the game with the
// biggest numbers. scripts/verify-circuits.mjs enforces exactly that: a
// circuit declaring 'correct' must hold only RUN_GAMES members.
//
//   'time'    (the Valet Gauntlet, 2026-09-05) ranks on the COMBINED CLOCK,
//             fastest first, among rows that solved every member; a row with
//             a lot unsolved sorts below every full run. Only a circuit whose
//             members are solve-or-nothing races on the clock may take it: the
//             verifier requires every member to be in JAM_RUN_GAMES, whose
//             scores are a grade against par and are NOT the thing added up.
export function circuitScoreMode(id) {
  const c = circuitById(id);
  if (!c) return 'points';
  if (c.score === 'correct') return 'correct';
  if (c.score === 'time') return 'time';
  return 'points';
}

export function circuitById(id) {
  return BY_ID[String(id || '')] || null;
}

export function isMarquee(id) {
  return String(id || '') === MARQUEE_ID;
}

// A circuit's game keys for an ET 'YYYY-MM-DD', in run order. Unknown keys and
// retired games drop out HERE, the only place that filtering happens, exactly
// as fiveFor does it — so no caller has to know about either, and Extra's
// retirement on 2026-09-29 shortens Recall on its own with no edit anywhere.
// The marquee delegates straight to lib/daily-five, so the Five keeps its own
// rules and its own bank.
// A deterministic shuffle from a string. FNV-1a for the seed and an LCG
// Fisher-Yates for the permutation: no dependency, no Math.random, and the
// same answer in the browser, on the server and in the verifier, which is the
// whole requirement. scripts/verify-circuits.mjs carries a copy and asserts it
// agrees with this one.
export function orderSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function seededShuffle(arr, seed) {
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

// Apply a circuit's declared `order`. Games named in `tail` are pinned to the
// end in the order they are named there; everything else is shuffled by the
// day. A tail game that is retired or otherwise absent simply drops out, which
// is why the tail is filtered rather than appended blind.
function applyOrder(c, live, day) {
  if (!c.order || !Array.isArray(c.order.tail)) return live;
  const tail = c.order.tail.filter((k) => live.includes(k));
  const head = live.filter((k) => !tail.includes(k));
  return [...seededShuffle(head, orderSeed(`${day}:${c.id}`)), ...tail];
}

// A game's slot in its circuit's CANONICAL key list, which is stable whatever
// today's shuffle did. The ladder colours itself from this, so a game does not
// change colour from one morning to the next.
// THE GAUNTLET LADDER'S RAMP, cool to warm in canonical roster order.
//
// Deliberately NOT each game's registry colour. Those hues were each chosen for
// one game against a navy slate row and never as a set: Atlas (#4ade9c) and Biz
// (#4fbf8b) are the same colour at rung width, and at seven banks no single
// registry edit separates them all. Every game keeps its own colour everywhere
// else; on the ladder the tie back to identity is the label under the block.
//
// It lives HERE rather than in the ladder component because the share card is
// rendered on the server and needs the same colours, and app/circuits/
// GauntletLadder.jsx is a client module. That component re-exports these two so
// its callers did not have to move.
export const LADDER_RAMP = [
  '#7dd3fc', // sky
  '#6ee7b7', // mint
  '#bef264', // lime
  '#e8b43a', // gold
  '#fb923c', // orange
  '#fb7185', // rose
  '#e879f9', // magenta
  '#c084fc', // violet, the eighth step if the roster grows again
];

export function rampFor(i) {
  const n = LADDER_RAMP.length;
  return LADDER_RAMP[(((i | 0) % n) + n) % n];
}

export function circuitSlotFor(id, key) {
  const c = circuitById(id);
  if (!c || !Array.isArray(c.keys)) return 0;
  const i = c.keys.indexOf(key);
  return i < 0 ? 0 : i;
}

export function circuitKeysFor(id, iso) {
  const day = iso || etTodayISO();
  if (isMarquee(id)) return fiveFor(day);
  const c = circuitById(id);
  if (!c || !Array.isArray(c.keys)) return [];
  const live = c.keys.filter((k) => DAILY_GAME_MAP[k] && !isRetiredDaily(k, day));
  if (!c.rotate || live.length <= c.rotate) return applyOrder(c, live, day);
  // A ROTATING circuit (today only the Sudoku pool): a sliding window over
  // the live pool, advancing one game per ET day, then filtered back to pool
  // order so the run still opens shortest and closes longest. Deterministic
  // from the date alone - no bank, no storage - and every consumer (the
  // board route, the trophies, the band, the landing page) reads it through
  // here, so there is exactly one copy of this selection anywhere.
  const idx = Math.floor(Date.parse(day + 'T12:00:00Z') / 86400000);
  const n = live.length;
  const start = ((idx % n) + n) % n;
  const picked = new Set();
  for (let i = 0; i < c.rotate; i++) picked.add((start + i) % n);
  return applyOrder(c, live.filter((_, i) => picked.has(i)), day);
}

// Same, as registry rows ({ key, name, cat, tag, href, ... }), which is what
// every render surface actually wants.
export function circuitGamesFor(id, iso) {
  return circuitKeysFor(id, iso).map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
}

// A game's route WITH the run attached. The marquee keeps the ?five=1 flag it
// already uses — that flag is read by DailyFiveBar, LoftFinish and the end-card
// run branch, and repointing it at ?circuit=five would have meant touching all
// three for no gain. A skill circuit carries ?circuit=<id>.
export function circuitHref(key, id) {
  const g = DAILY_GAME_MAP[key];
  const base = (g && g.href) || `/${key}`;
  const sep = base.includes('?') ? '&' : '?';
  return isMarquee(id)
    ? `${base}${sep}${FIVE_PARAM}=1`
    : `${base}${sep}${CIRCUIT_PARAM}=${encodeURIComponent(id)}`;
}

// Read the active skill circuit off the URL. Window-based rather than
// useSearchParams for the reason spelled out in lib/daily-five's readFiveParam:
// useSearchParams forces a CSR bail-out that has to sit inside a <Suspense>
// boundary, and one page rendering a consumer outside one fails the whole
// build. Call it in an effect, never during render — it returns null on the
// server, so a render-time call disagrees with the server's paint.
export function readCircuitParam() {
  if (typeof window === 'undefined') return null;
  try {
    const v = new URLSearchParams(window.location.search).get(CIRCUIT_PARAM);
    return v && circuitById(v) && !isMarquee(v) ? v : null;
  } catch (e) { return null; }
}

// Which skill circuits contain this game key. Exclusive today, so this returns
// at most one — it returns an ARRAY anyway so a future deliberate overlap does
// not become a silent truncation at every call site.
export function circuitsOfKey(key) {
  return CIRCUITS.filter((c) => c.keys.includes(key)).map((c) => c.id);
}

// The filter strip in app/DailyStrip.jsx is keyed by DISPLAY NAME, because that
// is how its chips, its `circuit:<name>` filter value and its aria-label all
// read. Deriving it here rather than restating the rosters there is the whole
// point: the thing you filter by and the thing you can run are one list, and
// they cannot drift. Retired games are left IN — the strip is a browse surface
// over the full roster and does its own retirement filtering per row.
export const CIRCUIT_NAME_LISTS = CIRCUITS.map((c) => [
  c.name,
  c.keys.map((k) => (DAILY_GAME_MAP[k] || {}).name).filter(Boolean),
]);

// A circuit's state for one viewer, from a set of already-played game keys.
// Takes a Set rather than fetching, exactly like fiveProgress: every caller
// already holds the day's completions and a run must never cost a request of
// its own. `done` is PLAYED-AND-FINISHED, not SOLVED.
export function circuitProgress(id, iso, doneKeys) {
  const members = circuitKeysFor(id, iso);
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

// ── THE ACTIVE RUN ─────────────────────────────────────────────────────────
// Which run is the player inside? This is the ONLY function an in-run surface
// should ask, and it answers with a circuit ID (MARQUEE_ID for the Five) or
// null.
//
// IT EXISTS BECAUSE THE CIRCUITS LAUNCH SHIPPED WITHOUT IT (fixed 2026-08-18).
// The console band handed a player into a skill circuit with ?circuit=<id>
// while all three in-run surfaces — DailyFiveBar, LoftFinish and DailyEndCard —
// still read `?five=1` alone through readFiveParam. Nothing threw: each one
// simply concluded it was not in a run and rendered the ordinary page. So a
// skill circuit had no strip, no hand-off to the next game, no suppression of
// the end card's 30-second auto-advance to an unrelated daily, and nowhere to
// land at the end. A run reader that knows about one of the two flags IS the
// bug, so there is one function now and every surface calls it. Do not
// reintroduce a second URL read anywhere.
//
// The marquee keeps ?five=1 rather than being repointed at ?circuit=five, so
// every link already in the wild still works, and the precedence when both are
// present matches the daily-combined route's: the marquee is the marquee.
//
// Call it in an EFFECT, never during render — it returns null on the server, so
// a render-time call makes the first client paint disagree with the server's.
export function readRunParam() {
  if (typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get(FIVE_PARAM) === '1') return MARQUEE_ID;
    const c = q.get(CIRCUIT_PARAM);
    return c && circuitById(c) && !isMarquee(c) ? c : null;
  } catch (e) { return null; }
}

// A run's display name, marquee included, so no surface has to branch on
// isMarquee just to write a heading.
export function circuitName(id) {
  const c = circuitById(id);
  return (c && c.name) || FIVE_NAME;
}

// Where a finished run LANDS. One page for all sixteen (owner, 2026-08-18):
// /daily-five takes ?circuit=<id> and narrows itself exactly as the board route
// does, rather than a second page component that would have to be kept in sync
// with the first. Same reasoning as the board: never a route of its own.
export function runSummaryHref(id) {
  return isMarquee(id)
    ? '/daily-five'
    : `/daily-five?${CIRCUIT_PARAM}=${encodeURIComponent(id)}`;
}

// ── SHARING ────────────────────────────────────────────────────────────────
// A SHARED LINK LANDS ON THE CIRCUIT'S OWN PAGE, never on /daily-five (owner,
// 2026-08-18). /daily-five is the run SUMMARY: it is noindex, it is one
// viewer's own results and an hourly leaderboard, and it reads as an ending.
// A person who has just been handed a link has not played, so they need the
// thing the run IS — the five games, in order, with a button that starts it —
// which is what /circuits/<id> serves. The summary stays exactly where it is
// for the player who finished.
//
// The marquee has a landing page too (/circuits/five). It is the only circuit
// whose roster is a daily read, so that page renders today's five rather than a
// fixed list, but a share of the Five must not send somebody to a summary of a
// run they have not started either.
export const CIRCUIT_BASE = '/circuits';

export function circuitPageHref(id) {
  const c = circuitById(id);
  return `${CIRCUIT_BASE}/${encodeURIComponent((c && c.id) || MARQUEE_ID)}`;
}

// WHERE A BROWSE SURFACE SENDS A READER WHO PICKS A CIRCUIT (owner, 2026-08-30).
// A circuit that can be played as ONE LONG QUIZ has a run, and the run IS the
// thing: sending a reader to the landing page first asks them to read a page
// and press a button to reach a page that already opens with a start gate.
// So a runnable circuit hands them straight to /circuits/<id>/run, which is
// exactly what the /trivia front door does, and every other circuit still goes
// to its landing page, because there is nothing else for it to go to.
//
// It lives here rather than in the home page's component for the reason this
// file keeps repeating: /trivia, the circuits shelf and anything added later
// must agree about where the Gauntlet starts, and three call sites choosing
// for themselves is three chances to drift.
export function circuitEntryHref(id) {
  return isRunnableCircuit(id) ? runHref(id) : circuitPageHref(id);
}

// The link as it appears INSIDE share text: bare host, no scheme, exactly the
// form every daily client uses ('mindloftdaily.com/crux'). Two reasons it is
// bare rather than absolute. It reads as text in a message rather than as a
// pasted URL, and ShareCreditPop.restampResult swaps the link inside a result
// for the new member's referral link by matching BOTH the absolute and the
// scheme-stripped form, so the bare one survives a sign-up mid-share.
//
// The host is duplicated rather than imported: this module is imported by
// scripts/verify-circuits.mjs under plain node and by lib/daily-five's
// consumers, and lib/site.js is server-shaped config. It is one string and the
// checker asserts it against SHARE_HOST, so it cannot drift.
export const SHARE_HOST_FOR_CIRCUITS = 'mindloftdaily.com';

export function circuitShareUrl(id) {
  return `${SHARE_HOST_FOR_CIRCUITS}${circuitPageHref(id)}`;
}

function shareOf(id) {
  const c = circuitById(id);
  return (c && c.share) || { invite: '', result: '' };
}

export function circuitShareInvite(id, url) {
  const name = circuitName(id);
  const head = isMarquee(id) ? `${name} · Mind Loft` : `The ${name} circuit · Mind Loft`;
  return `${head}\n${shareOf(id).invite}\n${url || circuitShareUrl(id)}`;
}

// The finished-run share: a headline carrying the figures, the circuit's own
// tag line, then the link.
//
// NO EMOJI GRID (owner, 2026-08-30). It carried a row of coloured squares, one
// per game, in the Wordle idiom. Three lines of text and a link say the same
// thing without asking a reader to decode a legend they have never seen, and
// the squares rendered as a different width in every client they landed in.
// A `pips` field on `stats` is ignored rather than rejected, so an older caller
// still produces correct text.
//
// Every figure is optional, so a partial run still produces honest text rather
// than 'undefined of undefined'.

// m:ss for a share line, from whole seconds.
export function fmtClock(secs) {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function circuitShareResult(id, stats, url) {
  const s = stats || {};
  const name = circuitName(id);
  const bits = [isMarquee(id) ? name : `${name} circuit`];
  if (Number.isFinite(s.points) && Number.isFinite(s.maxTotal) && s.maxTotal > 0) {
    // The UNIT follows the circuit's own board rule, so a shared Gauntlet
    // result never quotes a points figure its own leaderboard does not use.
    const mode = circuitScoreMode(id);
    if (mode === 'time') {
      // A clock board shares the clock: lots parked, then the combined time.
      bits.push(`${Math.round(Number(s.points))}/${s.maxTotal} lots`);
      if (Number.isFinite(s.secs) && s.secs > 0) bits.push(fmtClock(s.secs));
    } else {
      const unit = mode === 'correct' ? 'right' : 'pts';
      bits.push(`${Math.round(Number(s.points) * 10) / 10}/${s.maxTotal} ${unit}`);
    }
  }
  if (Number.isFinite(s.rank) && s.rank > 0) {
    bits.push(Number.isFinite(s.field) && s.field > 0 ? `#${s.rank} of ${s.field}` : `#${s.rank}`);
  }
  if (Number.isFinite(s.done) && Number.isFinite(s.total) && s.total > 0 && s.done < s.total) {
    bits.push(`${s.done} of ${s.total} played`);
  }
  return [bits.join(' · '), shareOf(id).result, url || circuitShareUrl(id)]
    .filter(Boolean).join('\n');
}
