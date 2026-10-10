// Shared "correct answers" scoring for quiz leaderboards.
//
// Most quizzes store quiz_results.score as the COUNT of correct answers, so for
// them "correct answers" = score. But timed multiple-choice quizzes
// (format 'timed-mcq': the lightning rounds, the daily market quiz, etc.) store
// score as a time-decayed POINTS total (0..questions*maxPerQuestion), NOT a
// count, so summing it into "correct answers" wildly inflates the metric (a
// single 226-point game showed as 226 correct answers).
//
// Those games never recorded a true correct count, and the count can't be
// recovered exactly from the points (a correct answer is worth 1..maxPerQuestion
// depending on speed). So for timed-mcq rows we ESTIMATE the count as the
// fraction of a perfect game achieved, scaled to the number of questions, and
// clamp it to [0, questions]. This is applied uniformly to past and future
// timed plays so the metric is consistent everywhere.

import { QUIZZES } from './quizzes.js';
import { DAILY_KEYS } from './daily-combined.js';

// quiz_id -> { questions, max } for every points-based (timed-mcq) quiz.
const POINTS_QUIZZES = new Map();
for (const q of QUIZZES) {
  // A quiz is points-based if it is a timed-mcq lightning round, a place-the-map
  // city quiz (score is a 0..N*maxPerCity proximity-points total), OR any quiz
  // that can award more than one point per answer (maxPerQuestion > 1). All
  // store score as a POINTS total, not a correct-answer count, so "correct" is
  // estimated as round(score/total * questions) instead of the raw points.
  const proximityFmt = q && (q.format === 'place-map' || q.format === 'globe' || q.format === 'geo-aerial');
  if (q && (q.format === 'timed-mcq' || proximityFmt || Number(q.maxPerQuestion) > 1)) {
    POINTS_QUIZZES.set(q.id, {
      questions: proximityFmt
        ? (Array.isArray(q.cities) ? q.cities.length : 0)
        : (Array.isArray(q.questions) ? q.questions.length : 0),
      max: proximityFmt ? (Number(q.maxPerCity) || 0) : (Number(q.maxPerQuestion) || 0),
    });
  }
}

// ---- Daily games -----------------------------------------------------------
// The daily puzzles post on a POINTS scale: `total` is the point maximum (100
// for Warmer, 8 for Links, 10 for most) while `correct` is a 0/1 SOLVED flag,
// or an item count for the few games built from several sub-puzzles. So the
// generic `answeredOf` fallback of `total` is wrong for them: a solved Warmer
// read as 1 correct out of 100 answered, which scored a clean solve as 1%
// accuracy, dragged every daily player's average down, and made a perfect
// daily (what the "Completed" star counts) mathematically impossible.
//
// Answer count each daily is graded out of:
//   binary games (solved / not solved)        -> 1
//   links, garble, outrank (2 points an item) -> total / 2
//   crux (correct IS the raw point score)     -> total, i.e. unchanged
const DAILY_KEY_SET = new Set(DAILY_KEYS);
const DAILY_HALF = new Set(['links', 'garble', 'outrank']);
const DAILY_ID_RE = /^([a-z]+)-\d{1,2}-\d{1,2}-\d{2}$/;

// The daily game key behind a quiz id ('warmer-7-21-26' -> 'warmer'), else null.
export function dailyKeyOf(quizId) {
  const m = DAILY_ID_RE.exec(String(quizId || ''));
  return m && DAILY_KEY_SET.has(m[1]) ? m[1] : null;
}

export function isDailyGame(quizId) {
  return dailyKeyOf(quizId) != null;
}

// Answers a daily row is graded out of, or 0 when the row is not a daily.
function dailyAnswered(row) {
  const key = dailyKeyOf(row.quiz_id);
  if (!key) return 0;
  const total = Number(row.total) || 0;
  if (key === 'crux' || key === 'potluck') return total;
  if (key === 'streak' || key === 'atlas' || key === 'sport' || key === 'biz' || key === 'script' || key === 'quotes') {
    // Streak, Atlas and Sport post correct = questions cleared; the player also
    // faced the one that killed them, so grade out of cleared + 1 (a perfect
    // run stays at its full count). Streak asks 40, the other two ask 25.
    const asked = key === 'streak' ? 40 : 25;
    const cc = row.correct_count != null ? (Number(row.correct_count) || 0) : Math.round(((Number(row.score) || 0) / (total || asked)) * asked);
    return Math.max(1, Math.min(total || asked, cc + 1));
  }
  // feud: 15 free-text answers (5 prompts x 3), points = crowd shares.
  if (key === 'feud') return 15;
  if (DAILY_HALF.has(key)) return Math.max(1, Math.round(total / 2));
  return 1;
}

function clampInt(n, cap) {
  const v = Number(n) || 0;
  return Math.max(0, Math.min(cap, v));
}

export function isPointsQuiz(quizId) {
  return POINTS_QUIZZES.has(quizId);
}

// Correct-answer contribution of one quiz_results row.
//   count-based quiz -> the raw score (already a correct count)
//   timed-mcq quiz   -> estimated count = round(score / total * questions),
//                       clamped to [0, questions]
export function correctAnswersOf(row) {
  if (!row) return 0;
  const dAns = dailyAnswered(row);
  if (dAns > 0) {
    // Daily rows carry the solved flag / solved-item count in correct_count.
    // A legacy row without one predates the column, so fall back to the same
    // proportional estimate the points quizzes use.
    if (row.correct_count != null) return clampInt(row.correct_count, dAns);
    const dTotal = Number(row.total) || 0;
    if (!dTotal) return 0;
    return clampInt(Math.round(((Number(row.score) || 0) / dTotal) * dAns), dAns);
  }
  const p = POINTS_QUIZZES.get(row.quiz_id);
  // Exact count when the client recorded it (timed-mcq rows, post-migration 24).
  if (row.correct_count != null) {
    const cc = Number(row.correct_count) || 0;
    const cap = p ? (p.questions || cc) : (Number(row.total) || cc);
    return Math.max(0, Math.min(cap, cc));
  }
  const score = Number(row.score) || 0;
  if (!p) return score;
  const questions = p.questions;
  const total = Number(row.total) || (questions * p.max) || 0;
  if (!questions || !total) return 0;
  const est = Math.round((score / total) * questions);
  return Math.max(0, Math.min(questions, est));
}

// Denominator (answer count) for one row, in CORRECT-ANSWER terms:
//   count-based quiz -> total (already a question/answer count)
//   timed-mcq quiz   -> the quiz's question count (NOT the points maximum)
export function answeredOf(row) {
  if (!row) return 0;
  const dAns = dailyAnswered(row);
  if (dAns > 0) return dAns;
  const p = POINTS_QUIZZES.get(row.quiz_id);
  if (!p) return Number(row.total) || 0;
  return p.questions || 0;
}
