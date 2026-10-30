// scripts/quiz-mix-rules.mjs: the shared rules for the three quiz-mix dailies,
// Potluck, Mixtape and Mishmash (owner, 2026-10-30: "same format as Potluck,
// but they pull three different daily quizzes", a variety of quizzes in each,
// including map quizzes at times). Imported by scripts/gen-quiz-mix.mjs and by
// scripts/verify-mixtape.mjs / verify-mishmash.mjs so the generator and the
// checkers cannot disagree. Not a verifier itself (no verify- prefix).
//
// THE RULES for Mixtape and Mishmash, on top of Potluck's own (eligible
// QuizClient formats, factual only, 8 to 50 answers, three FAMILIES and three
// DEPARTMENTS a day, no department repeated from the day before where avoidable):
//   1. NO SAME-DAY OVERLAP. On any date the nine quizzes across Potluck,
//      Mixtape and Mishmash are nine different quizzes.
//   2. TYPED and MATCH quizzes are FRESH: never used before by any of the three
//      banks. There are hundreds of each, so these never need recycling.
//   3. VISUAL quizzes are RECYCLED, because there are only ~94 of them and
//      Potluck alone spends one a day. A visual quiz may come back, but never
//      within MIN_GAP days of any other use of it in any of the three banks,
//      past or scheduled.
//   4. MAPS AT TIMES. Each game serves a map-format quiz at least once in
//      every MAP_WINDOW days (the generator leans to a map once a game has
//      gone MAP_NUDGE days without one).
export const MIX_GAMES = ['mixtape', 'mishmash'];
export const ALL_MIX = ['potluck', 'mixtape', 'mishmash'];
export const MIN_GAP = 21;
export const MAP_WINDOW = 14;
export const MAP_NUDGE = 6;
export const NAMES = { potluck: 'Potluck', mixtape: 'Mixtape', mishmash: 'Mishmash' };

export function dayNum(iso) { return Math.round(Date.parse(iso + 'T12:00:00Z') / 86400000); }
export function mixQuizId(game, iso) { const [y, m, d] = iso.split('-').map(Number); return `${game}-${m}-${d}-${String(y).slice(2)}`; }
