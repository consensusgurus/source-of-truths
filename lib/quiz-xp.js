// Additive IQ Points progression for quiz players, computed from the existing
// quiz_results table (no DB migration) in a single pass. This replaced the
// Elo skill rating (lib/quiz-elo.js, retired 2026-07-08): Elo punished good
// players for playing (sub-expected scores LOST points, replays were nearly
// worthless, inactivity decayed the rating), which is the opposite of what an
// engagement metric should do. IQ Points only ever go UP.
//
// Per completed game:
//   xp = round( correct × (Dq / 1000) × perfectBonus × replayFactor )
// where Dq is the quiz difficulty (1000 easy .. 2000 brutal — same formula the
// Elo engine used: harder quizzes pay up to 2×), perfectBonus = 1.25 for a
// 100% game, and replays of a quiz already played earn XP_REPLAY_FACTOR (the
// first attempt pays full, so grinding one quiz can't farm the board).
//
// Levels: cumulative IQ Points to REACH level L grows 25 IQ Points per step,
//   xpForLevel(L) = 12.5 · L · (L − 1)
//   → L2 = 25, L3 = 75, L5 = 250, L10 = 1,125, L14 = 2,275, L18 = 3,825.
// Tiers map from level: Bronze 1–4, Silver 5–8, Gold 9–13, Diamond 14–17,
// Master 18+ (calibrated 2026-07-08 against the live board: the top player
// lands Master, an engaged regular lands Gold, one quiz reaches L2).
//
// Players are keyed by user_id when signed up, else anon_id, else the row id
// (an unattributable one-off play). Per-category IQ Points uses the same per-game
// values restricted to that category's games; quizDept() supplies the category.

import { quizDept } from './quiz-departments.js';
import { correctAnswersOf, answeredOf, isDailyGame, dailyKeyOf } from './quiz-scoring.js';
import { QUIZZES } from './quizzes.js';
import { T } from '@/lib/theme';

export const XP_REPLAY_FACTOR = 0.25; // replays of the same quiz earn 25%

// An ABANDONED row is not an attempt at the quiz. The abandon-flush posts a real
// result row (score 0) whenever a player leaves a game in progress, and those
// rows were counting toward the replay tariff: a player who opened Parker, walked
// away twice, then came back and solved it perfectly was paid 25% because their
// own two abandons were attempts 1 and 2 (owner-reported 2026-08-01, 5 IQ Points
// for a perfect solve that should have paid 21). So an abandon no longer ADVANCES
// the attempt counter. It still pays the replay rate itself when it follows a
// real attempt, so half-playing a quiz over and over can never farm IQ Points.
//
// Dated, so no historical IQ is re-graded: rows abandoned BEFORE this moment keep
// counting exactly as they did when they were scored, leaving every total, rank
// and trophy already on the board untouched. Owner ruling 2026-08-01: fix the
// rule going forward rather than rewrite the past.
export const ABANDON_ATTEMPT_FREE_FROM = Date.parse('2026-08-01T23:59:00Z');
export const XP_PERFECT_BONUS = 1.25; // a 100% game earns a 25% bonus

// A daily puzzle asks a single question ("did you solve it?"), so paying IQ Points per
// correct answer earned a solved daily 1-2 IQ Points against 50+ for a large
// name-them-all quiz. Each daily is instead worth a FLAT answer-equivalent,
// scaled by how much of it you solved and by the day's difficulty exactly like
// any other game. 12 puts a full daily slate at roughly four large quizzes.
export const XP_DAILY_ANSWERS = 12;

// Partial credit on a daily that was NOT solved.
//
// Most dailies are graded pass/fail: the client posts `correct` as a 0/1 solved
// flag, so an unsolved game earned ZERO IQ Points no matter how close it came (a
// 30-of-32 Bracket paid exactly what an untouched one did). The games that do
// track progress already report it as `score` out of `total`, the same
// completion axis lib/daily-combined scores at 5 x score/total, so the
// completion fraction is max(solved fraction, points fraction).
//
// That fraction is then raised to a CONVEX curve, because a half-finished
// puzzle has not actually solved anything: half pays ONE answer-equivalent of
// the twelve (0.5 ^ XP_PARTIAL_CURVE = 1/12 by construction), a quarter pays
// ~0, and only a near-solve pays near-full. Worked shares of the 12:
//   1.00 -> 12    0.94 -> 9.5    0.75 -> 4.6    0.50 -> 1.0    0.25 -> 0.1
//
// The curve applies to every daily that is ONE PUZZLE, whether it reports a
// solved flag (Bracket, Park, Suds ...) or a count of finished sub-goals
// (Links, Garble, Crux, Outrank). Half is half: two of four Links groups pays
// the same as sixteen of thirty-two Bracket picks, since the player failed the
// puzzle either way. Whether the client happens to post a count or a flag is an
// implementation detail and must not change what a share is worth (owner rule,
// 2026-07-31).
//
// XP_LINEAR_DAILIES is the exception: a daily that is a BATTERY OF INDEPENDENT
// QUESTIONS rather than one puzzle. Streak is forty trivia questions and Feud
// is fifteen free-text answers, so thirty right really is thirty correct
// answers; an ordinary quiz pays those linearly and these must match it, or the
// same performance would score differently for having been the daily.
//
// A game that reports score 0 on a loss (Park, Suds, Span, Extra, and most of
// the roster) has fraction 0 and still earns nothing, which is intended: not
// finishing a binary puzzle is worth zero, not a consolation point. There is no
// floor for the same reason.
export const XP_PARTIAL_CURVE = Math.log(1 / XP_DAILY_ANSWERS) / Math.log(0.5); // ~3.585
export const XP_LINEAR_DAILIES = new Set(['streak', 'atlas', 'sport', 'biz', 'script', 'quotes', 'potluck', 'feud']);

// A hard per-game ceiling on what one day's row can pay, in IQ Points.
//
// Every other daily is one puzzle with an end, so the time it takes is bounded
// and the curve above is the whole story. An ARCADE game is not: it is endless by
// design, one life that a player can pause and return to all day, so the only
// thing standing between a patient player and a big number is patience. Paying
// that on the normal daily scale would make IQ Points a measure of free time on
// the arcade shelf alone. They are capped at 1 each instead (owner, 2026-08-08):
// still worth playing, still on the daily leaderboard where the real
// competition lives, but it cannot be farmed. The cap is applied AFTER the
// difficulty and bonus multipliers, so it is a true ceiling and not a scale.
//
// It is a ceiling on the DAY, not on each row: an arcade game accepts unlimited
// submissions (see isArcade in lib/daily-games), so capping per row would pay
// the ceiling again on every run and make IQ a count of replays.
export const XP_DAILY_CAP = { blocks: 1, sweep: 1, snake: 1, dario: 1 };

// Share of a daily's XP_DAILY_ANSWERS this row earned, 0..1.
function dailyShare(row, correct, answered) {
  const solved = answered > 0 ? clamp(correct / answered, 0, 1) : 0;
  if (solved >= 1) return 1;
  if (XP_LINEAR_DAILIES.has(dailyKeyOf(row.quiz_id))) return solved;
  const total = Number(row.total) || 0;
  const pts = total > 0 ? clamp((Number(row.score) || 0) / total, 0, 1) : 0;
  const frac = Math.max(solved, pts);
  return frac > 0 ? Math.pow(frac, XP_PARTIAL_CURVE) : 0;
}

const DQ_MIN = 1000;
const DQ_MAX = 2000;

const QUIZ_BY_ID = new Map((QUIZZES || []).map((q) => [q.id, q]));

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

function scoreFraction(row) {
  // CORRECTNESS fraction, not points: for timed-mcq the stored score is a
  // time-decayed points total, so use the (estimated) correct-answer count
  // over the question count. For ordinary quizzes this is score/total.
  const a = answeredOf(row);
  if (a <= 0) return 0;
  return clamp(correctAnswersOf(row) / a, 0, 1);
}

function playerKey(row) {
  if (row.user_id) return `u:${row.user_id}`;
  if (row.anon_id) return `a:${row.anon_id}`;
  return `r:${row.id}`;
}

// Quiz difficulty Dq from the average score fraction across ALL completed games
// of that quiz. An easy quiz (everyone near 100%) -> low Dq; a brutal one
// (everyone near 0%) -> high Dq. Dq = 1500 + (0.5 - avgFrac) * 800, clamped.
// Doubles as the IQ Points multiplier: Dq / 1000 = 1.0× (easy) .. 2.0× (brutal).
export function computeQuizDifficulty(rows) {
  const sum = new Map();
  const cnt = new Map();
  for (const r of rows) {
    if (!(Number(r.total) > 0)) continue;
    const q = r.quiz_id;
    sum.set(q, (sum.get(q) || 0) + scoreFraction(r));
    cnt.set(q, (cnt.get(q) || 0) + 1);
  }
  const dq = new Map();
  for (const [q, n] of cnt) {
    const avg = n ? sum.get(q) / n : 0.5;
    dq.set(q, clamp(Math.round(1500 + (0.5 - avg) * 800), DQ_MIN, DQ_MAX));
  }
  return dq;
}

function categoryOf(quizId) {
  return quizDept(QUIZ_BY_ID.get(quizId) || { id: quizId });
}

// Cumulative IQ Points needed to REACH level L (level 1 = 0 IQ Points). The step from L to
// L+1 costs 25·L, so thresholds are 12.5·L·(L−1).
export function xpForLevel(L) {
  return Math.round(12.5 * L * (L - 1));
}

export function levelOf(xp) {
  const v = Math.max(0, Number(xp) || 0);
  let L = 1;
  while (L < 500 && v >= xpForLevel(L + 1)) L++;
  return L;
}

// Tier label for a LEVEL (display only). Same names/colors as the old rating
// tiers so existing chips keep their look.
export function xpTier(level) {
  const L = Math.max(1, Number(level) || 1);
  if (L >= 18) return { label: 'Master Tier', bg: '#e8effb', fg: T.accent };
  if (L >= 14) return { label: 'Diamond Tier', bg: '#e8effb', fg: T.accent };
  if (L >= 9) return { label: 'Gold Tier', bg: '#f3e3c8', fg: '#8a5a00' };
  if (L >= 5) return { label: 'Silver Tier', bg: T.paper, fg: '#6b7280' };
  return { label: 'Bronze Tier', bg: '#f0e2d8', fg: '#9a5b3f' };
}

export function tierNameOfLevel(level) {
  return xpTier(level).label.replace(' Tier', '');
}

// Main entry point. `rows` = quiz_results rows. Returns:
//   { players: Map(key -> player), difficulty: Map(quizId -> Dq) }
// Each player: {
//   key, userId, anonId, isAnon, username,
//   xp, level, matches, xp7d (IQ Points earned in the last 7 days; null = every game
//   is newer than the 7-day cutoff, i.e. a NEW player),
//   byCategory: { [cat]: { xp, level, matches, correct, completed, daysPlayed, accuracy, played } },
//   recent: [{ quizId, dq, scorePct, xp, attempt, abandoned, perfect, createdAt, rankDelta, catRankDelta }], // newest first
//   correct, played(distinct), completed(perfect distinct), answered,
//   accuracy(percent), playedIds, completedIds,
// }
// Start of the current EASTERN day in ms. "Today" everywhere on the site is
// an Eastern day (the dailies roll at ET midnight), so the today-window IQ
// board has to use the same boundary rather than UTC or the viewer's zone.
// Derived from a single Intl read of the current ET wall clock, so it stays
// correct across DST without a per-row date format.
const XP_ET_TZ = 'America/New_York';
let ET_CLOCK = null;
let ET_DAY = null;
export function etDayStartMs(nowMs = Date.now()) {
  try {
    if (!ET_CLOCK) ET_CLOCK = new Intl.DateTimeFormat('en-US', { timeZone: XP_ET_TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (!ET_DAY) ET_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: XP_ET_TZ });
    const parts = ET_CLOCK.formatToParts(new Date(nowMs));
    const val = (t) => Number((parts.find((p) => p.type === t) || {}).value || 0);
    const h = val('hour') % 24; // some ICU builds report midnight as 24
    let start = nowMs - (h * 3600000 + val('minute') * 60000 + val('second') * 1000);
    // DST Sundays: the wall clock and the elapsed time disagree by an hour, so
    // the plain subtraction lands either in the previous ET day (spring
    // forward) or an hour into today (fall back). Walk it onto the real
    // boundary. Both loops are no-ops on all other days.
    const day = ET_DAY.format(new Date(nowMs));
    for (let i = 0; i < 2 && ET_DAY.format(new Date(start + 60000)) !== day; i++) start += 3600000;
    for (let i = 0; i < 2 && ET_DAY.format(new Date(start - 60000)) === day; i++) start -= 3600000;
    return start;
  } catch (e) {
    return nowMs - (nowMs % 86400000);
  }
}

// The /iq tests post result rows (for the admin's Quiz Plays) but pay NO IQ
// Points: they are standalone by owner ruling, so iq- ids are skipped here.
export function computeXp(rows, { recentN = 20, rankFor = null, nowMs = Date.now() } = {}) {
  // Chronological order: created_at, then row id as a stable tiebreak.
  const ordered = (rows || []).filter((r) => { if (/^iq-/.test(r.quiz_id || '')) return false; const q = QUIZ_BY_ID.get(r.quiz_id); return !(q && (q.unlisted || q.mobilePreview)); }).slice().sort((a, b) => {
    const ta = Date.parse(a.created_at || '') || 0;
    const tb = Date.parse(b.created_at || '') || 0;
    if (ta !== tb) return ta - tb;
    return (a.id || 0) - (b.id || 0);
  });

  const difficulty = computeQuizDifficulty(ordered);
  const players = new Map();
  const weekCut = nowMs - 7 * 86400000;
  // 30-day window: powers the Top SoT Player tile on /quizzes, which ranks by
  // IQ Points earned recently rather than all-time so the spot stays winnable.
  const monthCut = nowMs - 30 * 86400000;
  // Today window (Eastern day): powers the "Today's Top IQ Gainers" face of the
  // Daily Puzzle Leaderboard on /quizzes.
  const todayCut = etDayStartMs(nowMs);

  // Per-player first attempt of each quiz (lowest row id), for the
  // first-attempt accuracy metric (mirrors the champions route).
  const firstByPair = new Map(); // key::quizId -> row
  for (const r of ordered) {
    if (!(Number(r.total) > 0)) continue;
    const pk = playerKey(r);
    const pairKey = pk + '::' + r.quiz_id;
    const prev = firstByPair.get(pairKey);
    if (!prev || (r.id || 0) < (prev.id || 0)) firstByPair.set(pairKey, r);
  }

  function ensure(r) {
    const key = playerKey(r);
    let p = players.get(key);
    if (!p) {
      p = {
        key,
        userId: r.user_id || null,
        anonId: r.anon_id || null,
        isAnon: !r.user_id,
        username: r.user_id ? (r.username || 'Player') : null,
        xp: 0,
        matches: 0,
        xpWeek: 0,
        xpMonth: 0,
        xpToday: 0,
        hadPriorWeek: false,
        byCategory: {},
        recent: [],
        correct: 0,
        answered: 0,
        playedSet: new Set(),
        perfectSet: new Set(),
        daySet: new Set(),
        accSum: 0,
        accN: 0,
        lastRowId: -1,
        lastPlayedMs: 0,
      };
      players.set(key, p);
    }
    // Keep the most recent username for signed players.
    if (r.user_id && (r.id || 0) >= p.lastRowId) {
      p.lastRowId = r.id || 0;
      if (r.username) p.username = r.username;
    }
    return p;
  }

  const attemptSeen = new Map(); // `${playerKey}::${quizId}` -> times scored so far
  const capPaid = new Map();     // `${playerKey}::${quizId}` -> IQ already paid under XP_DAILY_CAP
  for (const r of ordered) {
    if (!(Number(r.total) > 0)) continue;
    const p = ensure(r);
    const dq = difficulty.get(r.quiz_id) ?? 1500;
    const S = scoreFraction(r);
    const correct = correctAnswersOf(r);
    const answered = answeredOf(r);
    const perfect = answered > 0 && correct === answered;
    const ts = Date.parse(r.created_at || '') || 0;
    if (ts > p.lastPlayedMs) p.lastPlayedMs = ts;

    const attKey = p.key + '::' + r.quiz_id;
    const attemptNo = (attemptSeen.get(attKey) || 0) + 1;
    // A recent abandon does not advance the counter, so the finish that follows
    // it is still attempt 1 and earns full rate. `attemptNo` above is this row's
    // own position either way, so an abandon that follows a real attempt still
    // pays the replay rate. See ABANDON_ATTEMPT_FREE_FROM.
    const freeAbandon = r.abandoned === true && ts >= ABANDON_ATTEMPT_FREE_FROM;
    if (!freeAbandon) attemptSeen.set(attKey, attemptNo);

    // Dailies earn the flat answer-equivalent above, pro-rated by how much of
    // the puzzle was solved (see dailyShare: an unsolved-but-nearly-there game
    // now earns curved partial credit instead of a flat zero); every other quiz
    // earns per correct answer.
    const credit = isDailyGame(r.quiz_id)
      ? XP_DAILY_ANSWERS * dailyShare(r, correct, answered)
      : correct;
    let gained = credit * (dq / 1000);
    if (perfect) gained *= XP_PERFECT_BONUS;
    if (attemptNo > 1) gained *= XP_REPLAY_FACTOR;
    gained = Math.max(0, Math.round(gained));
    if (isDailyGame(r.quiz_id)) {
      const capped = XP_DAILY_CAP[dailyKeyOf(r.quiz_id)];
      if (capped != null) {
        // The ceiling is on the DAY, not on the row (owner, 2026-08-08). An
        // arcade game takes unlimited submissions, so a per-row cap paid the
        // whole ceiling again on every run and turned a day's IQ into a count
        // of how many times somebody pressed Play again, which is the exact
        // farming this cap exists to prevent. Pay only the remainder of what
        // this player has already been paid for this puzzle.
        const capKey = p.key + '::' + r.quiz_id;
        const paid = capPaid.get(capKey) || 0;
        gained = Math.max(0, Math.min(gained, capped - paid));
        capPaid.set(capKey, paid + gained);
      }
    }

    p.xp += gained;
    p.matches += 1;
    if (ts > weekCut) p.xpWeek += gained; else p.hadPriorWeek = true;
    if (ts > monthCut) p.xpMonth += gained;
    if (ts >= todayCut) p.xpToday += gained;

    const cat = categoryOf(r.quiz_id);
    let cr = p.byCategory[cat];
    if (!cr) {
      cr = {
        xp: 0, matches: 0,
        correct: 0, answered: 0,
        playedSet: new Set(), perfectSet: new Set(), daySet: new Set(),
        accSum: 0, accN: 0,
        lastPlayedMs: 0,
      };
      p.byCategory[cat] = cr;
    }
    cr.xp += gained;
    cr.matches += 1;
    if (ts > cr.lastPlayedMs) cr.lastPlayedMs = ts;
    cr.correct += correct;
    cr.answered += answered;
    cr.playedSet.add(r.quiz_id);
    if (perfect) cr.perfectSet.add(r.quiz_id);
    if (r.created_at) { const dkc = String(r.created_at).slice(0, 10); if (dkc) cr.daySet.add(dkc); }

    // Per-play rank movement, computed ONLY for the player being profiled
    // (rankFor). Rank = count of others currently with more IQ Points; delta =
    // (#ahead before) − (#ahead after), so positive = moved UP. IQ Points are
    // additive, so this is never negative.
    let rankDelta = null, catRankDelta = null;
    if (rankFor && p.key === rankFor && p.matches > 1) {
      const after = p.xp, before = p.xp - gained;
      let gtA = 0, gtB = 0;
      for (const q of players.values()) {
        if (q === p) continue;
        if (q.xp > after) gtA++;
        if (q.xp > before) gtB++;
      }
      rankDelta = gtB - gtA;
      const ca = cr.xp, cb = cr.xp - gained;
      let cgA = 0, cgB = 0;
      for (const q of players.values()) {
        if (q === p) continue;
        const qc = q.byCategory[cat];
        if (!qc) continue;
        if (qc.xp > ca) cgA++;
        if (qc.xp > cb) cgB++;
      }
      catRankDelta = cgB - cgA;
    }
    p.recent.push({
      quizId: r.quiz_id,
      dq,
      scorePct: Math.round(S * 100),
      xp: gained,
      attempt: attemptNo,
      // The abandon-flush's row rather than a played attempt. /api/quiz/iq-standing
      // reads this to tell "the row for the game you just finished has not landed
      // yet" apart from "you finished and earned nothing".
      abandoned: r.abandoned === true,
      perfect,
      rankDelta,
      catRankDelta,
      createdAt: r.created_at || null,
    });

    // Running totals (every completed game, replays included).
    p.correct += correct;
    p.answered += answered;
    p.playedSet.add(r.quiz_id);
    if (perfect) p.perfectSet.add(r.quiz_id);
    if (r.created_at) { const dk = String(r.created_at).slice(0, 10); if (dk) p.daySet.add(dk); }
  }

  // First-attempt accuracy across distinct quizzes.
  for (const [pairKey, r] of firstByPair) {
    const key = pairKey.slice(0, pairKey.indexOf('::'));
    const p = players.get(key);
    if (!p) continue;
    const f = scoreFraction(r);
    p.accSum += f;
    p.accN += 1;
    const cat = categoryOf(r.quiz_id);
    const cr = p.byCategory[cat];
    if (cr) { cr.accSum += f; cr.accN += 1; }
  }

  // Finalize each player.
  for (const p of players.values()) {
    p.level = levelOf(p.xp);
    p.xp7d = p.hadPriorWeek ? p.xpWeek : null;
    // xp30d is a plain total (0, never null): the tile ranks by it, so an
    // absent value would have to be coerced anyway.
    p.xp30d = p.xpMonth;
    delete p.xpWeek;
    delete p.xpMonth;
    delete p.hadPriorWeek;
    p.played = p.playedSet.size;
    p.completed = p.perfectSet.size;
    p.daysPlayed = p.daySet.size;
    p.accuracy = p.accN ? Math.round((p.accSum / p.accN) * 100) : 0;
    for (const cat of Object.keys(p.byCategory)) {
      const cr = p.byCategory[cat];
      cr.level = levelOf(cr.xp);
      cr.played = cr.playedSet.size;
      cr.completed = cr.perfectSet.size;
      cr.daysPlayed = cr.daySet.size;
      cr.accuracy = cr.accN ? Math.round((cr.accSum / cr.accN) * 100) : 0;
      delete cr.playedSet;
      delete cr.perfectSet;
      delete cr.daySet;
      delete cr.accSum;
      delete cr.accN;
    }
    p.recent = p.recent.slice(-recentN).reverse(); // newest first
    p.playedIds = [...p.playedSet];
    p.completedIds = [...p.perfectSet];
    delete p.playedSet;
    delete p.perfectSet;
    delete p.daySet;
    delete p.accSum;
    delete p.accN;
    delete p.lastRowId;
  }

  return { players, difficulty };
}

// Display name for a player on the ranked board: signed username, else a stable
// "Guest-XXXX" handle from the anon key.
export function displayHandle(p) {
  if (!p.isAnon && p.username) return p.username;
  const src = p.anonId || p.key || '';
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  return 'Guest-' + h.toString(16).toUpperCase().slice(0, 4).padStart(4, '0');
}

// Stable "Guest-XXXX" handle from a raw anon_id (same scheme as displayHandle),
// for routes that have an anon_id string but not a full player object.
export function guestHandleFromAnon(anonId) {
  const src = anonId || '';
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  return 'Guest-' + h.toString(16).toUpperCase().slice(0, 4).padStart(4, '0');
}

// Build the ranked leaderboard for a scope ('all' or a department key).
// EVERY player with at least minMatches games gets a numbered rank position:
// IQ Points desc, then correct answers desc, then accuracy desc, then handle.
export function rankPlayers(players, scope = 'all', { minMatches = 1 } = {}) {
  const list = [];
  for (const p of players.values()) {
    let xp, level, matches, correct, completed, daysPlayed, accuracy, played, xp7d, xp30d, xpToday;
    if (scope === 'all') {
      xp = p.xp; level = p.level; matches = p.matches; xp7d = p.xp7d; xp30d = p.xp30d; xpToday = p.xpToday;
      correct = p.correct; completed = p.completed; daysPlayed = p.daysPlayed; accuracy = p.accuracy; played = p.played;
    } else {
      const c = p.byCategory[scope];
      if (!c) continue;
      xp = c.xp; level = c.level; matches = c.matches; xp7d = undefined; xp30d = undefined; xpToday = undefined;
      correct = c.correct; completed = c.completed; daysPlayed = c.daysPlayed; accuracy = c.accuracy; played = c.played;
    }
    if (matches < minMatches) continue;
    list.push({
      key: p.key,
      userId: p.userId,
      anonId: p.anonId,
      isAnon: p.isAnon,
      name: displayHandle(p),
      xp,
      level,
      matches,
      xp7d,
      xp30d,
      xpToday,
      correct: correct || 0,
      completed: completed || 0,
      daysPlayed: daysPlayed || 0,
      accuracy: accuracy || 0,
      played: played || 0,
    });
  }
  list.sort((a, b) => b.xp - a.xp || b.correct - a.correct || b.accuracy - a.accuracy || (a.name || '').localeCompare(b.name || ''));
  return list;
}
