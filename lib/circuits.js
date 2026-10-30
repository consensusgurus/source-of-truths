// EXTENSION IS REQUIRED on this relative import, for the same reason
// lib/daily-five.js carries it: scripts/verify-circuits.mjs imports this file
// directly under node, where ESM does not do extension guessing. Do not drop it.
import { DAILY_GAME_MAP, isRetiredDaily, etTodayISO } from './daily-games.js';
import { CROSSED_KEYS, CROSSED_KEYS_BEFORE, crossedScorerFor, CROSSED_MAX } from './crossed.js';
import { lawScorerFor, LAW_MAX } from './law-school.js';
import { dojoScorerFor, DOJO_MAX, DOJO_FIXED, DOJO_POOL, DOJO_POOL_BEFORE, DOJO_ALL_POOLS, dojoVariantFor } from './dojo.js';
import { roomScorerFor, ROOM_MAX, ROOM_KEYS } from './read-room.js';
import { passportScorerFor } from './passport.js';

// CIRCUITS: the designed daily RUNS (owner, 2026-10-20). Reader-facing they
// are "runs"; the code and the /circuits URLs keep the old word.
//
// A circuit is a fixed set of dailies played as one sitting on one page (each
// run's own client: the gauntlet run page, Judged, the Dojo, Crossed Up, Read the
// Room, Price Check, Passport), scored either by summing the placement ladder
// or by the run's own scorer (SCORERS below). The game rows are the ordinary
// rows each daily files, so a run invents no score of its own.
//
// RETIRED 2026-10-20 (owner): the Daily Five marquee and every circuit that
// was a plain list of games rather than a designed run (crosswords,
// word-building, wordplay, mental-math, pencil, spatial, sorting, chess-board,
// chess, table, recall, ranking, arcade), with their trophies and landing
// pages. Their old /circuits/<id> addresses redirect in next.config.js.
//
// circuitKeysFor is the ONLY place a roster is read, so a dated roster
// (`before`), a split roster (the Trivia Gauntlet and Encore) and a dealt slot
// (the Dojo's variant) are all invisible to every caller.

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
export const RUN_GAMES = ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'sci', 'art', 'history', 'foodie', 'streak', 'gram', 'vocab', 'spell', 'origin', 'idiom', 'pulse', 'gene', 'orbit', 'eureka', 'bond'];

// A SECOND RUN ENGINE (owner, 2026-09-05). The Valet Gauntlet plays the three
// sliding-block lots back to back on one clock, and a jam board is not a
// question bank, so the quiz run page cannot deal it. A circuit names its
// engine with `engine` ('quiz' is the default and what RUN_GAMES covers;
// 'jam' is the lib/jam-core family). RUN_ENGINES maps each engine to the only
// games it can serve, so scripts/verify-circuits.mjs can prove a runnable
// circuit holds nothing its engine cannot deal, whichever engine it names.
export const JAM_RUN_GAMES = ['park', 'impound', 'junkyard'];
// The Price Check family (owner, 2026-10-01): five price guesses on one engine
// (app/price/PriceGame.jsx), each scored 0 to 10, so the run adds them up.
export const PRICE_RUN_GAMES = ['pricer', 'dealer', 'realtor', 'agent', 'curator'];
// Passport (owner, 2026-10-03): ONE daily that is already a five-round run
// (app/passport/PassportClient.jsx), scored out of 50, so its engine serves
// exactly itself. It is the one SOLO circuit: a tile on the shelf like Price
// Check, with a roster of one. isSoloCircuit is what lets the two-game floors
// (the verifier, the trophy roster, /circuits) admit it and nothing else.
// From 2026-10-15 (owner, 2026-10-14) Passport is the day's Span, Flank and
// Ping played back to back, then nine bigger-or-smaller calls on their
// countries, filed as the passport row. Each game is scaled to 10 and the
// sizes leg to 20 by lib/passport.js passportScorer, so the sum is still out
// of 50. Days up to 2026-10-14 keep the one five-round row.
export const PASSPORT_RUN_GAMES = ['span', 'flank', 'ping', 'passport'];
// Judged (owner, 2026-10-08): the five deduction dailies played on ONE page
// (app/judged/JudgedClient.jsx), each client mounted inside the run
// through app/RunEmbed.jsx, so every game files its own ordinary row.
// Stands left the run on 2026-10-11 when Ergo joined (owner, 2026-10-10); it
// stays in this list because days before then still score with it.
export const LAW_RUN_GAMES = ['ergo', 'sworn', 'hearsay', 'docket', 'alibi', 'stands'];
// The Math Gauntlet (owner, 2026-10-09): five Blitz-family dailies dealt as
// one continuous run on the same engine as the Trivia Gauntlet. Every member is
// twenty four-choice problems a day, one life, so a score is problems right,
// the same unit as the trivia banks. Its own engine name only so the run page
// can pick the number banks (PROBLEM_MAP) and each game's own clock.
export const MATH_RUN_GAMES = ['blitz', 'gap', 'series', 'back', 'blitzed'];
// Enter the Dojo (owner, 2026-10-12): Sixes and Suds every day plus ONE
// variant from lib/dojo.js DOJO_POOL, played on one page
// (app/dojo/DojoClient.jsx) through app/RunEmbed.jsx exactly as Judged is.
export const DOJO_RUN_GAMES = [...new Set([...DOJO_FIXED, ...DOJO_ALL_POOLS])];
// Read the Room (owner, 2026-10-13): the three crowd games on one page
// (app/room/RoomClient.jsx) through app/RunEmbed.jsx, exactly as Judged is.
export const ROOM_RUN_GAMES = ROOM_KEYS.slice();

// THE SUDOKU FAMILY, as a plain list (2026-10-12). The rotating Sudoku circuit
// was retired the night Enter the Dojo launched (owner), but the home's Sudoku
// shelf, the daily cap's hue and the Dojo end-card pop still need the family,
// in this order (ascending measured length).
export const SUDOKU_POOL = ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'arrow', 'mercury', 'sando', 'giant', 'sumo', 'window', 'five', 'racecar'];
export const CROSSED_RUN_GAMES = CROSSED_KEYS.slice();
export const RUN_ENGINES = { crossed: CROSSED_RUN_GAMES, quiz: RUN_GAMES, math: MATH_RUN_GAMES, jam: JAM_RUN_GAMES, price: PRICE_RUN_GAMES, passport: PASSPORT_RUN_GAMES, law: LAW_RUN_GAMES, dojo: DOJO_RUN_GAMES, room: ROOM_RUN_GAMES };

// A SCORED board (Judged, 2026-10-08): each member row is turned into points
// by the circuit's own scorer before the points are added, because its games
// keep different totals and its board weighs the clock (lib/law-school.js:
// half accuracy, half speed, out of 100). Dated, so no day crowned before the
// run existed is ever re-ranked: before `scoreFrom` the circuit's board is the
// placement ladder it always was. Returns { fn, max } for that ET day, or null.
// Dojo's clocks are per DAY (lib/dojo.js, they adapt to measured times), so its
// entry builds the day's scorer; the caller primes that day first through
// lib/dojo-clocks.js primeCircuitClocks, or the seed clocks apply.
const SCORERS = { crossed: { forDay: (iso) => ({ fn: crossedScorerFor(iso), max: CROSSED_MAX }) }, passport: { forDay: (iso) => ({ fn: passportScorerFor(iso), max: 50 }) }, judged: { forDay: (iso) => ({ fn: lawScorerFor(iso), max: LAW_MAX }) }, dojo: { forDay: (iso) => ({ fn: dojoScorerFor(iso), max: DOJO_MAX }) }, room: { forDay: (iso) => ({ fn: roomScorerFor(iso), max: ROOM_MAX }) } };
export function circuitScorer(id, iso) {
  const c = circuitById(id);
  if (!c || !c.scorer || !SCORERS[c.scorer]) return null;
  if (c.scoreFrom && String(iso || '') < c.scoreFrom) return null;
  const s = SCORERS[c.scorer];
  return s.forDay ? s.forDay(iso) : s;
}
export function isSoloCircuit(id) {
  const c = circuitById(id);
  return !!(c && c.solo);
}

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
  // A run with its own address (Price Check lives at /pricecheck, owner
  // 2026-10-01) declares it as `path`; every other run is served under
  // /circuits/<id>/run.
  const c = circuitById(id);
  if (c && c.path) return c.path;
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
    id: 'deduction',
    // LAW SCHOOL (owner, 2026-10-08). The Deduction circuit became a run with
    // its own address: the five reasoning dailies a lawyer would pick, played
    // on one page, then an admissions verdict from Charleston to Yale
    // (lib/law-school.js). The id stays 'deduction' so the trophy and the
    // archive carry on unbroken.
    name: 'Judged',
    blurb: 'Five cases on one page, opening with if-then rules: a logic game, an alibi, testimony and hearsay. Right and fast picks your law school.',
    share: {
      invite: "Five cases: if-then rules, a logic game, an alibi, liars under oath and hearsay. Right and fast picks the law school that takes you.",
      result: "Five cases, one admissions letter.",
    },
    run: true,
    engine: 'law',
    path: '/judged',
    unit: '5 cases',
    // Half accuracy, half speed, out of 100, from launch day on (lib/law-school.js).
    scorer: 'judged',
    scoreFrom: '2026-10-08',
    // FIVE CASES (owner, 2026-10-08): Suffice and Axiom out, Stands in, and
    // Docket LEADS on purpose (the LSAT logic-games case), out of clock order.
    // ERGO IN, STANDS OUT (owner, 2026-10-10), from 2026-10-11: Ergo is the
    // conditional-reasoning case and it LEADS; the rest run shortest first.
    // `before` is the roster every day up to and including `until` ran, so
    // a day already played keeps scoring with the cases it actually had.
    opener: 'ergo',
    // ALIBI BACK (owner, 2026-10-17), from 2026-10-18: Ergo, Docket, Alibi,
    // Sworn, Hearsay, 20 each. 2026-10-17 alone ran four at 25.
    keys: ['ergo', 'docket', 'alibi', 'sworn', 'hearsay'],
    ownerOrder: true,
    before: { until: '2026-10-17', opener: 'ergo', keys: ['ergo', 'sworn', 'hearsay', 'docket'], before: { until: '2026-10-16', opener: 'ergo', keys: ['ergo', 'sworn', 'hearsay', 'docket', 'alibi'],
      before: { until: '2026-10-10', opener: 'docket', keys: ['docket', 'sworn', 'hearsay', 'alibi', 'stands'] } } },
    trophy: { name: 'Case Closed', tier: 'silver', icon: 'Search' },
  },
  {
    id: 'dojo',
    // AT THE TOP WITH THE OTHER POPULAR RUNS (owner, 2026-10-12).
    lead: 5,
    // ENTER THE DOJO (owner, 2026-10-12). Sixes, Suds, then one variant that
    // stays close to plain sudoku, on one page, then a belt from white to
    // black (lib/dojo.js). Half solving, half speed, out of 100, like Judged.
    name: 'Enter the Dojo',
    blurb: 'Three sudokus on one page: the six by six, the classic, then a variant. Solve them fast to earn your belt.',
    share: {
      invite: "Three sudokus, one sitting: a six by six, the classic nine by nine, then a variant. Fast and clean earns the black belt.",
      result: "Three sudokus, one belt.",
    },
    run: true,
    engine: 'dojo',
    path: '/dojo',
    unit: '3 grids',
    scorer: 'dojo',
    scoreFrom: '2026-10-12',
    // TWO FIXED, ONE DEALT. `keys` is the fixed head, shortest first; `slot`
    // is the pool the third grid is dealt from, one a day by the Eastern date
    // (lib/dojo.js dojoVariantFor). circuitKeysFor appends it, so the board,
    // the trophy and every surface see the day's three.
    keys: ['sixes', 'suds'],                                      // 144/482 + the variant
    slot: { pool: DOJO_POOL, before: DOJO_POOL_BEFORE },
    trophy: { name: 'Three Forms', tier: 'gold', icon: 'Medal' },
  },
  {
    id: 'crossed',
    lead: 7,
    // CROSSED (owner, 2026-10-20). Emcee, Encore, Arcos, then Glyph, in that
    // order, on one page (app/crossed). Most players finish every grid, so
    // speed is four fifths of the score: a rank from Monday solver up to
    // Solves in Pen (lib/crossed.js).
    name: 'Crossed Up',
    blurb: 'Five crosswords on one page: the mini, the big one, three acrostics, a grid with no clues and a hidden quote. Solve them fast to rank up the week.',
    share: {
      invite: "Five crosswords, one sitting: the mini, a nine by nine, three acrostics, a grid with no clues and a hidden quote. Fast enough and you solve in pen.",
      result: "Five crosswords, one rank.",
    },
    run: true,
    engine: 'crossed',
    path: '/crossed',
    unit: '5 crosswords',
    scorer: 'crossed',
    scoreFrom: '2026-10-20',
    ownerOrder: true,
    // ANON JOINS AS THE FINAL PUZZLE from 2026-10-24 (owner, 2026-10-23);
    // the days before deal the four they ran with.
    keys: CROSSED_KEYS.slice(),
    before: { keys: CROSSED_KEYS_BEFORE.slice(), until: '2026-10-23' },
    trophy: { name: 'In Pen', tier: 'gold', icon: 'PenTool' },
  },
  {
    id: 'room',
    // WITH THE OTHER POPULAR RUNS (owner, 2026-10-13).
    lead: 6,
    // READ THE ROOM (owner, 2026-10-13). Outwit, Outrank and Feud on one
    // page, then a verdict on how well you read the crowd: out of 100, a third
    // per room, paid on the share of the room you out-read in each
    // (lib/read-room.js). Crowd games keep moving until midnight, so the
    // verdict does too.
    name: 'Read the Room',
    blurb: 'The four crowd games on one page: run with the herd, dodge it, call its order, say what it said. No answer key, only the room.',
    share: {
      invite: "The crowd games in one sitting: run with the herd, dodge it, call its order, then say what it said. No answer key, only the room.",
      result: "Every crowd game, one read of the room.",
    },
    run: true,
    engine: 'room',
    path: '/room',
    unit: '4 rooms',
    scorer: 'room',
    scoreFrom: '2026-10-13',
    // Herd opens the room from 2026-10-17 (lib/read-room.js HERD_FROM).
    keys: ['herd', 'outwit', 'outrank', 'feud'],                  // 60/90/90/90 = 330
    before: { until: '2026-10-16', keys: ['outwit', 'outrank', 'feud'] },
    trophy: { name: 'Room Reader', tier: 'bronze', icon: 'Users' },
  },
  {
    id: 'gauntlet',
    name: 'Trivia Gauntlet',
    // LEAD: leftmost on the browse surfaces (owner, 2026-08-29). See
    // DISPLAY_CIRCUITS below. It does NOT move in ALL_CIRCUITS, which is the
    // cycle order and has the marquee as its head by rule.
    lead: 1,
    blurb: 'Seven trivia categories, one life each, five of them rotating daily. One wrong answer ends that category and starts the next.',
    share: {
      // ALL SEVEN ARE NAMED (2026-08-30). This listed six areas for a seven
      // quiz run, so the line quietly dropped Streak, and it is the line that
      // becomes the landing page's meta description and every share's second
      // row. Keep it under about 150 characters for that reason.
      // NO QUESTION COUNTS (owner, 2026-10-25): they read as daunting.
      invite: "Seven trivia categories, one life each: a topic in depth, a sudden-death round of anything, and five more that rotate through nine subjects.",
      result: "Seven categories, one life each. How far do you get?",
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
    // THE RUN LIVES AT /trivia (owner, 2026-10-12). next.config rewrites /trivia
    // onto the run page and 308s /circuits/gauntlet/run to /trivia, so there is
    // one page under one address, and every runHref link and every share hands
    // out the short one. The landing page stays at /circuits/gauntlet.
    path: '/trivia',
    shareHref: '/trivia',
    // THE BOARD IS QUESTIONS RIGHT, NOT PLACEMENT POINTS (owner, 2026-08-30),
    // and this circuit is the only one that says so. See circuitScoreMode
    // below for why it is the one, and lib/daily-combined rankByCorrect for
    // what it changes (the board's order and the number on it, nothing else).
    score: 'correct',
    // SEVEN, not five (owner, 2026-08-29). See the cap note above; Script and
    // Quotes are the same twenty-five question shape as Atlas, Sport and Biz,
    // so they sit with them in the middle of the ramp.
    // THE ROTATING ROSTER (owner, 2026-10-14). Seven a day still: Streak and
    // Deep every day, plus FIVE of the eight banks in TRIVIA_POOL on a sliding
    // eight-day cycle (triviaSplit below). The three left over that day are
    // the Trivia Encore. `keys` is the canonical list the ladder colours from,
    // ten long, and `cap` is that list; seven are dealt on any one day.
    // Days up to 2026-10-14 keep the fixed seven they were played with.
    // FOODIE joined the pool on 2026-10-27 (owner, 2026-10-26): eleven long.
    // It goes LAST so every other bank keeps its slot, and so its stage
    // colour, on the ladder ramp; Foodie takes the new eleventh step.
    cap: 11,
    keys: ['deep', 'atlas', 'sci', 'sport', 'art', 'script', 'history', 'biz', 'quotes', 'streak', 'foodie'],
    split: 'in',
    before: { until: '2026-10-14', keys: ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'streak'] },
    // Deep closes, Streak second to last, the other five shuffled daily.
    order: { tail: ['streak', 'deep'] },
    trophy: { name: 'Last One Standing', tier: 'bronze', icon: 'Shield' },
  },
  {
    id: 'triviaencore',
    name: 'Trivia Encore',
    // THE ENCORE (owner, 2026-10-14): the three trivia banks that sit out the
    // day's Gauntlet, played the same way, with its own board. Offered on the
    // Gauntlet's finish. Its board also shows the combined Gauntlet + Encore
    // total. Lives at /triviaencore (rewritten onto the run page).
    path: '/triviaencore',
    shareHref: '/triviaencore',
    blurb: 'The four trivia quizzes that sat out today\'s Gauntlet, back to back. One wrong answer ends that quiz and starts the next.',
    share: {
      invite: "Four more trivia quizzes, one life in each: the ones that sat out today's Gauntlet.",
      result: "Four quizzes, one life in each. How far do you get?",
    },
    run: true,
    score: 'correct',
    cap: 9,
    keys: ['atlas', 'sci', 'sport', 'art', 'script', 'history', 'biz', 'quotes', 'foodie'],
    split: 'out',
    before: { from: '2026-10-14', until: '2026-10-14', keys: ['sci', 'art', 'history'] },
    order: { tail: [] },
    trophy: { name: 'Curtain Call', tier: 'bronze', icon: 'Sparkles' },
  },
  {
    id: 'english',
    name: 'English Gauntlet',
    // THE ENGLISH GAUNTLET (owner, 2026-10-19): the five English dailies,
    // ten questions each, played back to back on the trivia run page. Lives at
    // /english (rewritten onto the run page, like /trivia and /math). Board is
    // questions right, clock as the tiebreak. Order is the owner's (2026-10-19:
    // the fastest read first, Origin, the hardest, last).
    path: '/english',
    shareHref: '/english',
    blurb: 'Five English quizzes back to back: spelling, vocabulary, idioms, grammar and word origins. One wrong answer ends that quiz and starts the next.',
    share: {
      invite: "Five English quizzes, one life in each: spelling, vocabulary, idioms, grammar and word origins.",
      result: "Five English quizzes, one life in each. How far do you get?",
    },
    run: true,
    score: 'correct',
    ownerOrder: true,
    keys: ['spell', 'vocab', 'idiom', 'gram', 'origin'],
    trophy: { name: 'Plain English', tier: 'bronze', icon: 'BookOpen' },
  },
  {
    id: 'science',
    name: 'Science Gauntlet',
    // THE SCIENCE GAUNTLET (owner, 2026-10-30): the five science dailies, ten
    // questions each, played back to back on the trivia run page. Lives at
    // /science (rewritten onto the run page, like /trivia and /english). Board
    // is questions right, clock as the tiebreak. Easiest read first, chemistry
    // last. Its ending is the filled flask (app/circuits/GauntletFinale.jsx).
    path: '/science',
    shareHref: '/science',
    blurb: 'Five science quizzes back to back: the human body, life science, physics and space, inventions and chemistry. One wrong answer ends that quiz and starts the next.',
    share: {
      invite: "Five science quizzes, one life in each: the human body, life science, physics and space, inventions and chemistry.",
      result: "Five science quizzes, one life in each. How far do you get?",
    },
    run: true,
    score: 'correct',
    ownerOrder: true,
    keys: ['pulse', 'gene', 'orbit', 'eureka', 'bond'],
    trophy: { name: 'Lab Coat', tier: 'bronze', icon: 'FlaskConical' },
  },
  {
    id: 'math',
    name: 'Math Gauntlet',
    // THE SHARE LIVES AT /math (owner, 2026-10-09): every share of this run
    // hands out mindloftdaily.com/math, which carries the run's own card.
    shareHref: '/math',
    // THE RUN LIVES AT /math too (owner, 2026-10-12): rewritten onto the run
    // page, with /circuits/math/run 308ing here. See the gauntlet's note.
    path: '/math',
    blurb: 'Five mental math games back to back. One wrong answer ends that game and starts the next.',
    share: {
      invite: "Five mental math games, one life in each: quick arithmetic, a missing number, what comes next, which line makes it, and three numbers a line.",
      result: "Five math games, one life in each. How far do you get?",
    },
    // NEW on 2026-10-09 (owner): the math answer to the Trivia Gauntlet. Blitz
    // and Blitzed plus three games built for it, Gap (the missing number),
    // Series (what comes next) and Back (which line makes the number). Same
    // run, same scorecard, same one-life rule, so the board is problems right
    // with the clock as the tiebreak, exactly like the trivia run.
    run: true,
    engine: 'math',
    score: 'correct',
    // BLITZ OPENS (owner, 2026-10-09): the familiar game leads, then the three
    // new ones, and Blitzed closes. Within the ascent slack (62 then ~60).
    keys: ['blitz', 'gap', 'series', 'back', 'blitzed'],   // 62/~60 est/~65 est/~75 est/~80 est = 342
    trophy: { name: 'Human Calculator', tier: 'bronze', icon: 'Zap' },
  },
  {
    id: 'pricecheck',
    name: 'Price Check',
    // NEW on 2026-10-01 (owner). Five price games back to back, one score out
    // of 50, at its own address (mindloftdaily.com/pricecheck). A tile in
    // circuits like the Trivia Gauntlet.
    lead: 3,
    blurb: 'Five real prices back to back: an Amazon find, a new vehicle, a home for sale, a trip and a luxury piece.',
    share: {
      invite: "Five real price tags, from pocket change to the auction block. Three guesses at each, the first counts most, and one score out of 50.",
      result: "Five prices, three guesses each. How good is your gut?",
    },
    run: true,
    engine: 'price',
    path: '/pricecheck',
    // THE BOARD IS THE SUM OF THE FIVE SCORES, clock as the tiebreak. Every
    // member scores 0 to 10 on the same ratio ladder, so the sum means
    // something; see check 12 in scripts/verify-circuits.mjs.
    score: 'correct',
    keys: ['pricer', 'dealer', 'realtor', 'agent', 'curator'],   // 60 x 5 est = 300
    trophy: { name: 'Sold', tier: 'bronze', icon: 'Tag' },
  },
  {
    id: 'passport',
    name: 'Passport',
    // NEW on 2026-10-03 (owner). One mystery country in five
    // rounds, at its own address (mindloftdaily.com/passport). It is a
    // Geography daily AND a circuit tile, and it takes the Daily Five's place
    // in the lead three on the home and in the first-visit pins.
    // From 2026-10-15 (owner, 2026-10-14): Span, Flank and Ping, then nine
    // bigger-or-smaller calls on the countries they were about.
    lead: 4,
    blurb: "The day's Ping, then nine pairs of countries called bigger or smaller, then Flank and Span. Score out of 50.",
    share: {
      invite: "Ping, nine size calls, then Flank and Span on one page: one score out of 50, and a real passport to travel home on.",
      result: "Ping, nine calls, Flank and Span. Which passport do you get?",
    },
    run: true,
    engine: 'passport',
    path: '/passport',
    solo: true,
    // What the shelf's eyebrow says in place of "4 games".
    unit: '4 legs',
    // The board is the score out of 50, clock as the tiebreak: before
    // scoreFrom the one passport row, from it the scorer's four legs.
    score: 'correct',
    scorer: 'passport',
    scoreFrom: '2026-10-15',
    before: { until: '2026-10-14', keys: ['passport'] },
    keys: ['span', 'flank', 'ping', 'passport'],   // 360 est
    trophy: { name: 'Frequent Flyer', tier: 'bronze', icon: 'Plane' },
  },
];

// The whole family. With the Daily Five retired (2026-10-20) it is the runs alone.
export const ALL_CIRCUITS = [...CIRCUITS];

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
const LEAD_ORDER = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room'];   // owner, 2026-10-08: Judged fourth. 2026-10-03: Price Check leads; Passport takes the Five's third place
const leadRank = (c) => {
  const i = LEAD_ORDER.indexOf(c.id);
  return i < 0 ? LEAD_ORDER.length : i;
};
// THE SHELF SHOWS ONLY THE SEVEN BUILT RUNS (owner, 2026-10-13). Every other
// circuit (the Five, the skill circuits, Math Gauntlet) stays in ALL_CIRCUITS,
// so its board, its /circuits/<id> page, old links and trophies all keep
// working; it is simply no longer offered on a browse surface. Order is the
// owner's.
// MATH GAUNTLET BACK ON (owner, 2026-10-13, the same evening): it is a built run
// too, and the morning's list left it off by mistake. It sits beside the Trivia
// Gauntlet, its sibling.
// TRIVIA ENCORE beside the Gauntlet (owner, 2026-10-14).
const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'science', 'math', 'passport', 'deduction', 'dojo', 'crossed', 'room'];
export const DISPLAY_CIRCUITS = SHOWN
  .map((id) => ALL_CIRCUITS.find((c) => c.id === id))
  .filter(Boolean);

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

export function isMarquee() {
  return false;
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
  // OFF THE CATEGORY COLOURS (owner, 2026-10-30): the first eight steps were the
  // category colours verbatim, so Atlas played on the Numbers mint and Sci on
  // the Logic lime. Each step is now a near neighbour of the colour it replaced
  // ("familiar to existing"), moved far enough that no run stage reads as a
  // category: every step's stage pastel sits at least 7 delta-E (CIELAB) from
  // every category pastel, and every step still carries RAMP_INK at 6:1 or
  // better. scripts/verify-ladder-ramp.mjs is the gate.
  '#4cb8ee', // sky (was #7dd3fc, Word)
  '#55e195', // mint (was #6ee7b7, Numbers)
  '#93e44e', // lime (was #bef264, Logic)
  '#c8b84c', // gold (was #e8b43a, End Game)
  '#f8834a', // orange (was #fb923c, Trivia)
  '#ef7e73', // coral (was #fb7185, Geography)
  '#f76bd4', // magenta (was #e879f9, Cards)
  '#b997f4', // violet (was #c084fc, Crowd Psychology)
  '#5eead4', // teal, ninth and tenth steps since the rotating roster (2026-10-14)
  '#8797f4', // periwinkle (was #a5b4fc, Sudoku)
  '#fdba74', // peach, the eleventh step, Foodie's (2026-10-26)
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

// THE TRIVIA SPLIT (owner, 2026-10-14). Eight trivia banks rotate through
// the Gauntlet: five of them play there each day and the other three make the
// Trivia Encore. A sliding window over TRIVIA_POOL, advancing one bank per ET
// day from TRIVIA_SPLIT_FROM, so every bank is in the Gauntlet five days in
// eight and in the Encore three. Pure function of the date: no bank, no storage.
//
// FOODIE JOINS (owner, 2026-10-26). From 2026-10-27 the pool is NINE banks:
// Foodie (food and drink, lifted out of Art) leads the list, the Gauntlet
// still deals five and the Encore now takes the other FOUR. The window
// restarts from FOODIE_FROM over the nine, so every bank is in the Gauntlet
// five days in nine and in the Encore four. Days before keep the eight-bank
// cycle they were played with: an archived day never changes its lineup.
export const TRIVIA_POOL_V1 = ['atlas', 'sci', 'sport', 'art', 'script', 'history', 'biz', 'quotes'];
export const TRIVIA_POOL = ['foodie', 'atlas', 'sci', 'sport', 'art', 'script', 'history', 'biz', 'quotes'];
export const TRIVIA_SPLIT_FROM = '2026-10-15';
export const FOODIE_FROM = '2026-10-27';
export const TRIVIA_IN = 5;
export function triviaPoolFor(iso) {
  return (iso || etTodayISO()) < FOODIE_FROM ? TRIVIA_POOL_V1 : TRIVIA_POOL;
}
export function triviaSplit(iso) {
  const day = iso || etTodayISO();
  const pool = triviaPoolFor(day);
  const anchor = day < FOODIE_FROM ? TRIVIA_SPLIT_FROM : FOODIE_FROM;
  const live = pool.filter((k) => DAILY_GAME_MAP[k] && !isRetiredDaily(k, day));
  const n = live.length;
  if (!n) return { in: [], out: [] };
  const idx = Math.round((Date.parse(day + 'T12:00:00Z') - Date.parse(anchor + 'T12:00:00Z')) / 86400000);
  const start = ((idx % n) + n) % n;
  const pick = new Set();
  for (let i = 0; i < Math.min(TRIVIA_IN, n); i++) pick.add(live[(start + i) % n]);
  return { in: live.filter((k) => pick.has(k)), out: live.filter((k) => !pick.has(k)) };
}

export function circuitKeysFor(id, iso) {
  const day = iso || etTodayISO();
  const c0 = circuitById(id);
  if (!c0 || !Array.isArray(c0.keys)) return [];
  // A DATED ROSTER (Judged, 2026-10-11): days up to `before.until` deal the
  // roster they ran with, so an archived day never changes its cases.
  // The roster may be a CHAIN of befores (Judged: five cases to 10-16, Stands
  // to 10-10); the earliest one whose `until` covers the day wins.
  let c = c0;
  if (!c0.split) {
    for (let b = c0.before; b && Array.isArray(b.keys) && day <= b.until; b = b.before) c = { ...c0, keys: b.keys, opener: b.opener || c0.opener };
  } else if (c0.before && Array.isArray(c0.before.keys) && day <= c0.before.until) {
    c = { ...c0, keys: c0.before.keys, opener: c0.before.opener || c0.opener };
  }
  const live = c.keys.filter((k) => DAILY_GAME_MAP[k] && !isRetiredDaily(k, day));
  // A SPLIT ROSTER (Trivia Gauntlet and Trivia Encore, 2026-10-14): see
  // triviaSplit. The Gauntlet keeps its fixed games (anything not in the pool)
  // plus the day's five; the Encore is the three left over, and nothing before
  // the split began.
  if (c.split && c.split === 'out') {
    // Launch day (owner, 2026-10-14): the Encore opened a day before the
    // rotation, with the three new banks while the Gauntlet kept its old seven.
    if (day < TRIVIA_SPLIT_FROM) {
      const pre = c.before && Array.isArray(c.before.keys) && day >= c.before.from && day <= c.before.until ? c.before.keys : [];
      return applyOrder(c, pre.filter((k) => DAILY_GAME_MAP[k] && !isRetiredDaily(k, day)), day);
    }
    return applyOrder(c, triviaSplit(day).out, day);
  }
  if (c.split && c.split === 'in' && day >= TRIVIA_SPLIT_FROM) {
    const inn = new Set(triviaSplit(day).in);
    return applyOrder(c, live.filter((k) => !TRIVIA_POOL.includes(k) || inn.has(k)), day);
  }
  // A DEALT SLOT (Enter the Dojo, 2026-10-12): the fixed keys, then one game
  // from the slot's pool, chosen by the date alone (lib/dojo.js).
  if (c.slot && Array.isArray(c.slot.pool)) {
    const v = dojoVariantFor(day);
    return (DAILY_GAME_MAP[v] && !isRetiredDaily(v, day)) ? [...live, v] : live;
  }
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
  return `${base}${sep}${CIRCUIT_PARAM}=${encodeURIComponent(id)}`;
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
    return v && circuitById(v) ? v : null;
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
// should ask, and it answers with a circuit ID or null.
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
    const c = q.get(CIRCUIT_PARAM);
    return c && circuitById(c) ? c : null;
  } catch (e) { return null; }
}

// A run's display name, marquee included, so no surface has to branch on
// isMarquee just to write a heading.
export function circuitName(id) {
  const c = circuitById(id);
  return (c && c.name) || 'Run';
}

// Where a finished run LANDS. One page for all sixteen (owner, 2026-08-18):
// /daily-five takes ?circuit=<id> and narrows itself exactly as the board route
// does, rather than a second page component that would have to be kept in sync
// with the first. Same reasoning as the board: never a route of its own.
export function runSummaryHref(id) {
  return `/daily-five?${CIRCUIT_PARAM}=${encodeURIComponent(id)}`;
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
  return c ? `${CIRCUIT_BASE}/${encodeURIComponent(c.id)}` : CIRCUIT_BASE;
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
  const c = circuitById(id);
  return `${SHARE_HOST_FOR_CIRCUITS}${(c && c.shareHref) || circuitPageHref(id)}`;
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
      // A questions-right run shares the count alone (owner, 2026-10-15): the
      // total is far above a typical one-life score and read as discouraging.
      if (mode === 'correct') bits.push(`${Math.round(Number(s.points))} right`);
      else bits.push(`${Math.round(Number(s.points) * 10) / 10}/${s.maxTotal} pts`);
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
