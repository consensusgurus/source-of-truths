// THE QUIZ STAGE. The quiz twin of lib/stage.js.
//
// The eighty dailies went sitewide on the stage on 2026-08-31 and the ~1,200
// quizzes did not move, so the two halves of the site read as two products: a
// daily is a near-black sitting with one line of chrome, and a quiz was still
// the cream magazine page with a masthead over it, a ribbon under that and a
// footer below. This is the switch that moves the quiz half over.
//
// WHY THIS IS A SEPARATE MODULE FROM lib/stage.js. That one answers "is THIS
// GAME on the stage", keyed by a registry key, and a quiz has no registry row
// to be keyed by. The two also roll out on different clocks and will retire on
// different ones. Same shape and same query contract, so there is one mental
// model for both surfaces:
//
//   '?stage=1' is the REVIEW path, for looking at a quiz before the switch is
//   flipped. '?stage=0' is the matching way OUT, checked FIRST so it overrides
//   everything, which is what makes a bad report actionable in the minute it
//   arrives ("does the old page do this too?") rather than after a revert.
//
// WHY THERE IS NO PER-QUIZ LIST, and why the holdout set is keyed by CLIENT.
// A daily is a hand-written client, so LOFT_GAMES and STAGE_GAMES earned their
// per-game lists. Every quiz renders through one of about twenty shared
// clients, so the unit of rollout is the CLIENT: converting QuizClient moves
// roughly a thousand quizzes at once and there is nothing per-id to gate. The
// same reasoning app/useQuizLoft.js wrote down for the Loft rollout, and it
// held.

// THE ROLLOUT SWITCH, ON since 2026-09-04: every one of the twelve quiz clients
// is converted, so the whole quiz half of the site is on the stage and the two
// halves read as one product again. '?stage=0' is still the way out, per page,
// and QUIZ_STAGE_HOLDOUTS below is the way to put ONE client back on the old
// page without reverting anything else.
export const QUIZ_STAGE_ON = true;

// Who is OUT once the switch above is on. Named by CLIENT, not by quiz id, for
// the reason in the header: it is the place to put a single client back on the
// old page in a hurry without reverting anything else. Each client passes its
// own name (the string it hands isQuizStage), so a client that is not listed
// here does not have to know this file exists.
export const QUIZ_STAGE_HOLDOUTS = new Set([]);

/**
 * Is this quiz page on the stage?
 *
 * @param client  the quiz CLIENT's name ('QuizClient', 'TimedMcqClient', ...),
 *                which is the unit of rollout. Anything falsy is treated as an
 *                unconverted client and stays off.
 * @param search  the page's URLSearchParams, or null.
 *
 * THE QUERY IS READ FROM A VALUE THE CALLER ALREADY HAS, never from
 * window.location during render. The server has no search params, so a render
 * that reads the URL makes the server's first paint disagree with the client's
 * and React throws. Every caller on this surface already holds useSearchParams'
 * result for its own reasons, which is why this takes it rather than reading it.
 */
export function isQuizStage(client, search) {
  let q = '';
  try { q = search ? String(search.get ? search.get('stage') : '') : ''; } catch (e) {}
  // The way out wins over everything, including the review flag.
  if (q === '0') return false;
  if (!client) return false;
  // Review: any converted client can be looked at before the switch is flipped.
  if (q === '1') return true;
  if (!QUIZ_STAGE_ON) return false;
  return !QUIZ_STAGE_HOLDOUTS.has(client);
}

// -- THE QUIZ'S ACCENT: TRIVIA, OR GEOGRAPHY ---------------------------------
//
// TWO SUBJECT COLOURS, TAKEN FROM THE DAILY RAMP (owner, 2026-11-12, "Quiz
// Stage Restyle", option 2). This used to be one neutral slate for every quiz
// (2026-08-31 / 09-01), on the reasoning that a quiz is found rather than
// returned to and a department ramp of sixteen hues would mean nothing. The
// owner then had the quizzes restyled to match the dailies, and chose the
// middle road: a quiz IS trivia, so it wears the Trivia step, and a geography
// quiz (maps, places, flags, capitals) wears the Geography step, the same
// colours the Trivia and Geography dailies wear. No other department gets its
// own colour, on purpose: the ten ramp colours already MEAN a daily category,
// and a Movies quiz in violet would read as a Crowd Psychology game.
//
// The values are the ramp's own (lib/category-ramp.js, CATEGORY_RAMP and
// CATEGORY_RAMP_LIGHT, the ink tables and the light accent-ink table), written
// literally so this module stays free of that file's DAILY_GAME_MAP import.
// scripts/verify-quiz-stage.mjs checks every one of them against the ramp, so
// the two cannot drift apart.
//
// TWO REGISTERS, PUBLISHED TOGETHER, exactly as a daily client publishes its
// category step: --stg-acc-dk and --stg-acc-lt, with the ink that rides on the
// light step and the light step's text ink beside them. The warm Trivia step
// keeps its pastel in light and carries the near-black (the warm-steps rule).
import { quizDept } from './quiz-departments';

export const QUIZ_SUBJECTS = {
  trivia: {
    label: 'Trivia',
    dk: '#fb923c',     // CATEGORY_RAMP, Trivia
    lt: '#fb923c',     // CATEGORY_RAMP_LIGHT, Trivia (warm step keeps its pastel)
    onLt: '#08222e',   // RAMP_INK_LIGHT, Trivia (dark ink)
    inkLt: '#a3480d',  // the light accent-ink table, Trivia
  },
  geography: {
    label: 'Geography',
    dk: '#bef264',     // CATEGORY_RAMP, Geography
    lt: '#1a7f37',     // CATEGORY_RAMP_LIGHT, Geography
    onLt: '#ffffff',   // RAMP_INK_LIGHT, Geography
    inkLt: '#176e2f',  // the light accent-ink table, Geography
  },
};

// A map board is geography whatever department its quiz was filed under.
const GEO_FORMATS = new Set(['map', 'place-map', 'globe-place', 'street-map']);

/** 'geography' or 'trivia', for a quiz object (null reads as trivia). */
export function quizSubject(q) {
  if (!q) return 'trivia';
  if (GEO_FORMATS.has(q.format)) return 'geography';
  try { if (quizDept(q) === 'geography') return 'geography'; } catch (e) {}
  return 'trivia';
}

/** The subject's dark-register step: the colour StageChrome softens into the
 *  page's dot and tint, and the hand-off's ground. */
export function quizTint(q) { return QUIZ_SUBJECTS[quizSubject(q)].dk; }

const varsFor = (s) => ({
  '--stg-acc-dk': s.dk,
  '--stg-acc-lt': s.lt,
  '--stg-onramp-lt': s.onLt,
  '--stg-acc-ink-lt': s.inkLt,
});
const VARS = { trivia: varsFor(QUIZ_SUBJECTS.trivia), geography: varsFor(QUIZ_SUBJECTS.geography) };

/** What a converted quiz client spreads onto its root element. ONE object, so
 *  a client cannot publish half of it. */
export function quizAccVars(q) { return VARS[quizSubject(q)]; }

// The Trivia set, for a surface with no quiz object in hand (kept under the old
// name so nothing that imported it breaks).
export const QUIZ_ACC_VARS = VARS.trivia;
