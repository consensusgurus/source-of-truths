// Trophy engine for player profiles (server only: pulls in the full quiz data
// libs, so never import this from a client component; clients read
// lib/trophy-defs.js instead). Everything is computed AT READ TIME from the
// same quiz_results rows the stats routes already load: no trophies table, no
// migration, and every player's case is retroactively complete on day one.
//
// computeTrophies(rows, players[, { duelWinsByAnon }]) evaluates every trophy
// for every player in one extra pass over rows (plus the cross-player standings
// the definitions need), and counts holders per trophy so rarity is a live
// percentage rather than a guess. `players` is the map computeXp returns; the
// routes have already built it, so nothing here recomputes IQ.
//
// Duel trophies need the quiz_duels tally, which only /api/quiz/player pays
// for (a per-profile-view query). Routes that skip it (me, iq-standing) simply
// exclude the duels group from their payload via buildTrophyList's flag.

import { quizDept } from './quiz-departments.js';
import { correctAnswersOf, answeredOf, dailyKeyOf } from './quiz-scoring.js';
import { computeQuizDifficulty, rankPlayers } from './quiz-xp.js';
import { liveDailyKeys } from './daily-games.js';
import { ALL_CIRCUITS, circuitKeysFor, isSoloCircuit } from './circuits.js';
import { isoOfSuffix } from './daily-five.js';
import { QUIZZES } from './quizzes.js';
import { TROPHIES } from './trophy-defs.js';

// Daily games that are retired (kept in DAILY_KEYS so archived days still
// score) are NOT required for the Completionist trophy. Retirement is dated in
// lib/daily-games and this module lives in a long-running server process, so
// read the count per evaluation rather than freezing it at import time.
const liveDailyCount = () => liveDailyKeys().length;

// A quiz leaderboard (or daily board) only crowns a winner once at least this
// many players have played it; a top score in a field of one means nothing.
const CROWN_MIN_FIELD = 3;

// Dq at or above this counts as one of the hardest quizzes on the site
// (matches the Giant Slayer trophy copy; Dq caps at 2000).
const BRUTAL_DQ = 1900;

const QUIZ_BY_ID = new Map((QUIZZES || []).map((q) => [q.id, q]));
const DAY = 86400000;

function playerKey(row) {
  if (row.user_id) return `u:${row.user_id}`;
  if (row.anon_id) return `a:${row.anon_id}`;
  return `r:${row.id}`;
}

function categoryOf(quizId) {
  return quizDept(QUIZ_BY_ID.get(quizId) || { id: quizId });
}

// Longest run of consecutive UTC days in a set of 'YYYY-MM-DD' keys.
function bestStreakOf(daySet) {
  if (!daySet.size) return 0;
  const keys = [...daySet].sort();
  let best = 1;
  let run = 1;
  let prev = Date.parse(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const t = Date.parse(keys[i]);
    run = t - prev === DAY ? run + 1 : 1;
    prev = t;
    if (run > best) best = run;
  }
  return best;
}

export function computeTrophies(rows, players, { duelWinsByAnon = null } = {}) {
  const difficulty = computeQuizDifficulty(rows || []);

  // ── per-player facts, one pass ──
  const facts = new Map(); // key -> f
  const bests = new Map(); // quiz_id -> Map(key -> best score fraction)
  function factsFor(key) {
    let f = facts.get(key);
    if (!f) {
      f = {
        games: 0, correct: 0,
        perfects: new Set(),          // distinct quiz ids aced
        cats: new Set(),
        days: new Set(),
        perfectByDay: new Map(),      // day -> perfect count
        maxPerfectDay: 0,
        dailyGames: new Set(),        // distinct daily KEYS played
        dailyCount: 0,                // daily rows played
        // day suffix ('M-D-YY') -> Set of daily keys FINISHED that day. Keyed
        // by the PUZZLE's day off the quizId rather than by created_at,
        // because a daily rolls at Eastern midnight and a row posted at 00:30
        // UTC belongs to the previous ET puzzle. A circuit is finished when a
        // day's set covers its whole roster.
        dailyByDay: new Map(),
        circuitsDone: new Set(),      // circuit ids finished at least once
        brutalPerfect: false,
      };
      facts.set(key, f);
    }
    return f;
  }
  for (const r of rows || []) {
    if (!(Number(r.total) > 0)) continue;
    const key = playerKey(r);
    const f = factsFor(key);
    const answered = answeredOf(r);
    const correct = correctAnswersOf(r);
    const perfect = answered > 0 && correct === answered;
    const day = r.created_at ? String(r.created_at).slice(0, 10) : null;

    f.games += 1;
    f.correct += correct;
    if (day) f.days.add(day);
    f.cats.add(categoryOf(r.quiz_id));

    const dKey = dailyKeyOf(r.quiz_id);
    if (dKey) {
      f.dailyGames.add(dKey);
      f.dailyCount += 1;
      // ABANDONED IS NOT FINISHED. A pagehide row is a started-and-left run and
      // must not complete a circuit, which is the same test the console band
      // and the circuit leaderboard both use. The column defaults false on
      // every pre-migration row, so this is a no-op on old data.
      if (!r.abandoned) {
        const m = /-(\d+-\d+-\d+)$/.exec(String(r.quiz_id || ''));
        if (m) {
          let set = f.dailyByDay.get(m[1]);
          if (!set) { set = new Set(); f.dailyByDay.set(m[1], set); }
          set.add(dKey);
        }
      }
    }

    if (perfect) {
      f.perfects.add(r.quiz_id);
      if (day) {
        const n = (f.perfectByDay.get(day) || 0) + 1;
        f.perfectByDay.set(day, n);
        if (n > f.maxPerfectDay) f.maxPerfectDay = n;
      }
      if (!dKey && (difficulty.get(r.quiz_id) || 0) >= BRUTAL_DQ) f.brutalPerfect = true;
    }

    // Best result per player per quiz, for crowns and daily wins. Mirrors the
    // real leaderboard ordering: raw score DESC, then time ASC, so a daily
    // board (points-scored, most solvers tied on correct-count) still crowns
    // the actual day's winner rather than everyone who solved it.
    {
      const sc = Number(r.score) || 0;
      const tm = Number.isFinite(Number(r.time_elapsed)) ? Number(r.time_elapsed) : Infinity;
      let m = bests.get(r.quiz_id);
      if (!m) { m = new Map(); bests.set(r.quiz_id, m); }
      const cur = m.get(key);
      if (!cur || sc > cur.s || (sc === cur.s && tm < cur.t)) m.set(key, { s: sc, t: tm });
    }
  }

  // ── crowns (non-daily quiz leaderboards) and daily-board wins ──
  const crownsByKey = new Map();
  const dailyWinsByKey = new Map();
  for (const [quizId, m] of bests) {
    if (m.size < CROWN_MIN_FIELD) continue;
    let topS = 0;
    let topT = Infinity;
    for (const v of m.values()) {
      if (v.s > topS || (v.s === topS && v.t < topT)) { topS = v.s; topT = v.t; }
    }
    if (!(topS > 0)) continue;
    const isDaily = dailyKeyOf(quizId) != null;
    for (const [key, v] of m) {
      if (v.s !== topS || v.t !== topT) continue;
      const tgt = isDaily ? dailyWinsByKey : crownsByKey;
      tgt.set(key, (tgt.get(key) || 0) + 1);
    }
  }

  // ── cross-player standings ──
  const ranked = rankPlayers(players, 'all');
  const top10 = new Set(ranked.slice(0, 10).map((p) => p.key));
  const catTop3 = new Set();
  const allCats = new Set();
  for (const p of players.values()) for (const c of Object.keys(p.byCategory || {})) allCats.add(c);
  for (const cat of allCats) {
    for (const p of rankPlayers(players, cat).slice(0, 3)) catTop3.add(`${cat}::${p.key}`);
  }
  const isCatTop3 = (key) => {
    const p = players.get(key);
    if (!p) return false;
    for (const c of Object.keys(p.byCategory || {})) if (catTop3.has(`${c}::${key}`)) return true;
    return false;
  };
  const totalCats = allCats.size;

  // ── duels (optional) ──
  const duelWinsByKey = new Map();
  if (duelWinsByAnon && duelWinsByAnon.size) {
    const anonToKey = new Map();
    for (const p of players.values()) if (p.anonId) anonToKey.set(p.anonId, p.key);
    for (const [anon, wins] of duelWinsByAnon) {
      const key = anonToKey.get(anon) || `a:${anon}`;
      duelWinsByKey.set(key, (duelWinsByKey.get(key) || 0) + wins);
    }
  }

  // ── circuit completions ──
  // One pass per player-day rather than per row, and it short-circuits on a
  // circuit already earned, so the cost is bounded by (player-days x circuits)
  // and every circuit drops out of the loop the first time it is finished.
  // circuitKeysFor takes the roster for THAT day, so a retirement shortens the
  // requirement on the days after it and leaves earlier days alone.
  // Rosters are memoised per day: they are the same for every player, and
  // circuitKeysFor allocates a fresh array each call, so without this a bank of
  // ten thousand player-days would build a million throwaway arrays.
  const rosterMemo = new Map();
  const rostersFor = (suffix) => {
    let r = rosterMemo.get(suffix);
    if (r) return r;
    const iso = isoOfSuffix(suffix);
    r = iso
      ? ALL_CIRCUITS.map((c) => [c.id, circuitKeysFor(c.id, iso)]).filter(([id, k]) => k.length >= 2 || (k.length === 1 && isSoloCircuit(id)))
      : [];
    rosterMemo.set(suffix, r);
    return r;
  };
  for (const f of facts.values()) {
    if (!f.dailyByDay.size) continue;
    for (const [suffix, played] of f.dailyByDay) {
      if (f.circuitsDone.size >= ALL_CIRCUITS.length) break;
      for (const [id, keys] of rostersFor(suffix)) {
        if (f.circuitsDone.has(id)) continue;
        if (keys.every((k) => played.has(k))) f.circuitsDone.add(id);
      }
    }
  }

  // ── criteria ──
  const CRIT = {
    'first-quiz': (f) => f.games >= 1,
    'games-10': (f) => f.games >= 10,
    'games-50': (f) => f.games >= 50,
    'games-100': (f) => f.games >= 100,
    'games-500': (f) => f.games >= 500,
    'correct-1k': (f) => f.correct >= 1000,
    'correct-10k': (f) => f.correct >= 10000,
    'cats-5': (f) => f.cats.size >= 5,
    'cats-all': (f) => totalCats > 0 && f.cats.size >= totalCats,
    'perfect-1': (f) => f.perfects.size >= 1,
    'perfect-10': (f) => f.perfects.size >= 10,
    'perfect-50': (f) => f.perfects.size >= 50,
    'perfect-brutal': (f) => f.brutalPerfect,
    'perfect-day3': (f) => f.maxPerfectDay >= 3,
    'streak-7': (f) => f.bestStreak >= 7,
    'streak-30': (f) => f.bestStreak >= 30,
    'streak-100': (f) => f.bestStreak >= 100,
    'days-30': (f) => f.days.size >= 30,
    'days-100': (f) => f.days.size >= 100,
    'days-365': (f) => f.days.size >= 365,
    'daily-1': (f) => f.dailyCount >= 1,
    'daily-10games': (f) => f.dailyGames.size >= 10,
    'daily-all': (f) => f.dailyGames.size >= liveDailyCount(),
    'daily-100': (f) => f.dailyCount >= 100,
    'daily-win': (f, key) => (dailyWinsByKey.get(key) || 0) >= 1,
    'daily-win10': (f, key) => (dailyWinsByKey.get(key) || 0) >= 10,
    'crown-1': (f, key) => (crownsByKey.get(key) || 0) >= 1,
    'crown-5': (f, key) => (crownsByKey.get(key) || 0) >= 5,
    'top10': (f, key) => top10.has(key),
    'cat-top3': (f, key) => isCatTop3(key),
    'level-10': (f, key) => { const p = players.get(key); return !!p && (p.level || 1) >= 10; },
    'master': (f, key) => { const p = players.get(key); return !!p && (p.level || 1) >= 18; },
    'duel-1': (f, key) => (duelWinsByKey.get(key) || 0) >= 1,
    'duel-10': (f, key) => (duelWinsByKey.get(key) || 0) >= 10,
    'circuit-all': (f) => f.circuitsDone.size >= ALL_CIRCUITS.length,
  };
  // One criterion per circuit, generated from the roster rather than typed out,
  // so a new circuit needs no edit here. The trophy ROWS are still literal in
  // lib/trophy-defs (that file has to stay client-safe); the verifier is what
  // keeps the two lists in step.
  for (const c of ALL_CIRCUITS) CRIT['circuit-' + c.id] = (f) => f.circuitsDone.has(c.id);

  // ── evaluate every player ──
  const earnedByKey = new Map();
  const holders = {};
  for (const t of TROPHIES) holders[t.id] = 0;
  for (const [key, f] of facts) {
    f.bestStreak = bestStreakOf(f.days);
    const earned = new Set();
    for (const t of TROPHIES) {
      const fn = CRIT[t.id];
      if (fn && fn(f, key)) { earned.add(t.id); holders[t.id] += 1; }
    }
    earnedByKey.set(key, earned);
  }

  return { earnedByKey, holders, totalPlayers: facts.size, crownsByKey, dailyWinsByKey, duelWinsByKey };
}

// API payload: the full trophy list with earned flags and live rarity. Duel
// trophies are only meaningful when the caller supplied the duel tally, so
// routes without it exclude that group rather than show it falsely locked.
export function buildTrophyList(res, myKey, { includeDuels = false } = {}) {
  const earned = (myKey && res.earnedByKey.get(myKey)) || new Set();
  const list = TROPHIES
    .filter((t) => includeDuels || t.group !== 'duels')
    .map((t) => ({
      id: t.id, name: t.name, desc: t.desc, tier: t.tier, group: t.group, icon: t.icon,
      earned: earned.has(t.id),
      pct: res.totalPlayers ? Math.round(((res.holders[t.id] || 0) / res.totalPlayers) * 1000) / 10 : 0,
    }));
  return {
    earnedCount: list.filter((t) => t.earned).length,
    total: list.length,
    totalPlayers: res.totalPlayers,
    list,
  };
}

// Lightweight earned-ids array (no duels) for the end-card unlock toast.
export function earnedTrophyIds(res, myKey) {
  const earned = (myKey && res.earnedByKey.get(myKey)) || new Set();
  return TROPHIES.filter((t) => t.group !== 'duels' && earned.has(t.id)).map((t) => t.id);
}
