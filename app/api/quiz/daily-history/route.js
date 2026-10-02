import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { scoreGame, combineDaily, rankByCorrect, rankByTime, DAILY_KEYS, GAME_MAX, bestNForSuffix, etDayEndMs } from '@/lib/daily-combined';
import { CIRCUIT_PARAM, circuitById, circuitKeysFor, circuitScoreMode, isMarquee } from '@/lib/circuits';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Same numbers for every visitor (no per-player fold), so the CDN can absorb
// repeat hits. Winner history only changes at the Eastern day boundary.
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' };

// Only true daily-game quizIds (`<game>-M-D-YY`); a normal quiz sharing a prefix
// can't leak in. Built from DAILY_KEYS so new dailies are picked up automatically
// (no more drift). Mirrors DAILY_RE in /api/quiz/daily-status.
const DAILY_RE = new RegExp(`^(${DAILY_KEYS.join('|')})-(\\d+)-(\\d+)-(\\d+)$`);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HISTORY_DAYS = 30;

// A crown is FINAL at Eastern midnight (see the day freeze in lib/daily-combined).
// Rows that land later still count on their game's own leaderboard; they just
// never re-open a day that is already crowned. Cutoffs are memoized per day, so
// this is one Intl format per day rather than one per row.
const dayEndCache = new Map();
function dayEndFor(iso) {
  let end = dayEndCache.get(iso);
  if (end === undefined) { end = etDayEndMs(iso); dayEndCache.set(iso, end); }
  return end;
}

// Today's date suffix ("M-D-YY") in US Eastern, matching the daily quizId scheme.
function etTodaySuffix() {
  let ymd;
  try { ymd = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { ymd = new Date().toISOString().slice(0, 10); }
  const [Y, M, D] = ymd.split('-').map(Number);
  return `${M}-${D}-${Y % 100}`;
}

// "M-D-YY" -> { iso:'YYYY-MM-DD' (sortable), label:'Jul 16' }.
function parseSuffix(suffix) {
  const [M, D, YY] = suffix.split('-').map(Number);
  const year = 2000 + YY;
  const iso = `${year}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
  return { iso, label: `${MONTHS[(M - 1) % 12] || '?'} ${D}` };
}

// GET /api/quiz/daily-history
//   -> { today, days, history:[{ date, dateISO, label, gameCount, maxTotal, field,
//        winner:{username,userKey,total,gamesPlayed}, runnerUp }], champions, games }
// The daily-games COMBINED-board champion for each completed Eastern day (the #1
// on that day's best-N-of-slate standings, same scoring the live board uses),
// plus an all-time per-game stat line. Today is excluded (still in progress).
export async function GET(req) {
  const todaySuffix = etTodaySuffix();
  // NARROWED TO ONE CIRCUIT, with ?circuit=<id>. Unnarrowed this route crowns
  // the whole daily slate, which is the wrong question for a circuit's own
  // archive: the Gauntlet's champion is whoever was best across ITS seven
  // banks, not whoever collected the most points across fifty games. The
  // narrowing reuses circuitKeysFor per day, so there is still exactly one
  // copy of "which games this circuit ran on that date", and an unknown or
  // marquee id simply falls through to the full-slate behaviour unchanged.
  let circuitId = '';
  try { circuitId = (new URL(req.url).searchParams.get(CIRCUIT_PARAM) || '').trim(); }
  catch (e) { circuitId = ''; }
  const circuitDef = circuitId && !isMarquee(circuitId) ? circuitById(circuitId) : null;
  const circuitOn = !!circuitDef;
  // Questions right rather than ladder points, for the one circuit that ranks
  // that way, so the archive is quoted in the same unit as its live board.
  const rawScore = circuitOn && circuitScoreMode(circuitId) === 'correct';
  // And the clock, for the one circuit that ranks that way (2026-09-05).
  const byTime = circuitOn && circuitScoreMode(circuitId) === 'time';
  const scoreMode = rawScore ? 'correct' : (byTime ? 'time' : 'points');
  // Eastern "today" as an ISO date. Used to drop today (still in progress) AND
  // any future-dated day, so a stray play on a pre-published future daily is
  // never crowned a champion.
  let todayISO;
  try { todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { todayISO = new Date().toISOString().slice(0, 10); }
  try {
    // WHEN each account was created. A day's crown is decided ONCE and never
    // re-decided (owner, 2026-08-13), but registering retroactively stamps a
    // player's name onto every play they ever made, which would otherwise let a
    // stranger signing up today rewrite a champion crowned three weeks ago:
    // either by winning it outright, or by joining the registered field and
    // shifting the points of everyone who was in it. Their points DO still
    // recompute on the combined board and their IQ total is unaffected; only the
    // crown is held. Cheap query (one row per player) and no migration.
    let acctMs = new Map();
    try {
      const { data: us } = await supabaseAdmin.from('quiz_users').select('id, created_at');
      for (const u of (us || [])) { const t = Date.parse(u.created_at); if (!Number.isNaN(t)) acctMs.set(u.id, t); }
    } catch (e) { /* unknown creation dates -> fail open, crowns compute as before */ }

    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) {
      console.error('daily-history error', error);
      return NextResponse.json({ today: todaySuffix, circuit: circuitOn ? circuitId : null, days: 0, history: [], champions: [], games: [] });
    }

    // One pass: bucket completed-day daily rows by day -> game, and accumulate
    // per-game all-time aggregates over EVERY population (guests included).
    const byDay = new Map();   // suffix -> Map(gameKey -> rows[])
    const gameAgg = new Map(); // gameKey -> aggregate
    for (const r of (data || [])) {
      const qid = r && r.quiz_id;
      if (!qid) continue;
      const m = qid.match(DAILY_RE);
      if (!m) continue;
      const key = m[1];
      const suffix = `${m[2]}-${m[3]}-${m[4]}`;

      let ga = gameAgg.get(key);
      if (!ga) { ga = { plays: 0, signedPlays: 0, players: new Set(), days: new Set(), correct: 0, totalDen: 0, best: 0 }; gameAgg.set(key, ga); }
      ga.plays += 1;
      if (r.user_id) ga.signedPlays += 1;
      ga.players.add(r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`));
      ga.days.add(suffix);
      const score = Number(r.score) || 0;
      const total = Number(r.total) || 0;
      ga.correct += score;
      ga.totalDen += total;
      if (score > ga.best) ga.best = score;

      const { iso: rowDayISO } = parseSuffix(suffix);
      if (rowDayISO >= todayISO) continue; // skip today (in progress) and any future-dated day
      // Posted after that Eastern day ended: counts for the game board, never
      // for the crown. A row with no usable created_at is kept (fail open).
      if (r.created_at) {
        const t = Date.parse(r.created_at);
        if (!Number.isNaN(t) && t >= dayEndFor(rowDayISO)) continue;
      }
      let dm = byDay.get(suffix);
      if (!dm) { dm = new Map(); byDay.set(suffix, dm); }
      let arr = dm.get(key);
      if (!arr) { arr = []; dm.set(key, arr); }
      arr.push(r);
    }

    // Per-day champion via the same scoreGame + combineDaily the live board uses.
    const history = [];
    for (const [suffix, dm] of byDay.entries()) {
      const gameResults = [];
      const { iso: dayISO, label: dayLabel } = parseSuffix(suffix);
      const dayEnd = dayEndFor(dayISO);
      // A player who registered AFTER this day ended was a guest that night, and
      // is scored as one here, so the registered field this crown was decided
      // against is exactly the one that existed at Eastern midnight. Only rows
      // that still carry an anon_id are demoted (a row posted while logged in
      // cannot predate its own account, so this never strips a genuine one).
      const asPlayed = (rows) => rows.map((r) => {
        if (!r.user_id || !r.anon_id) return r;
        const born = acctMs.get(r.user_id);
        return (born && born >= dayEnd) ? { ...r, user_id: null, username: null } : r;
      });
      // THE ROSTER AS IT STOOD ON THAT DAY, narrowed again to the banks that
      // actually RAN. circuitKeysFor answers "which games belong to this
      // circuit", which is the current answer even for a past date: a circuit
      // that GREW does not retroactively un-run the days before its newest
      // member existed. Requiring all seven on a day the Gauntlet had five
      // erased the whole archive (verified live: days 0). So a day is scored
      // over the intersection, and a day carrying less than half the roster is
      // not that circuit's day at all and is skipped.
      const rosterKeys = circuitOn ? circuitKeysFor(circuitId, dayISO) : null;
      const memberKeys = rosterKeys ? rosterKeys.filter((k) => dm.has(k)) : null;
      const dayFloor = rosterKeys ? Math.max(2, Math.ceil(rosterKeys.length / 2)) : 0;
      if (circuitOn && (!memberKeys || memberKeys.length < dayFloor)) continue;
      for (const [key, rows] of dm.entries()) {
        if (memberKeys && !memberKeys.includes(key)) continue;
        const gr = scoreGame(asPlayed(rows));
        if (gr.field <= 0) continue; // no registered field that day for this game
        gameResults.push({ key, quizId: `${key}-${suffix}`, field: gr.field, players: gr.players });
      }
      if (!gameResults.length) continue;
      // Every bank that ran needs a registered field, or the day's crown would
      // be decided over fewer games than the players were measured on.
      if (memberKeys && gameResults.length < memberKeys.length) continue;
      const dayBestN = memberKeys ? memberKeys.length : bestNForSuffix(suffix);
      const overall = combineDaily(gameResults, dayBestN);
      if (!overall.length) continue;
      // ONLY A WHOLE RUN IS RANKED, the same gate the live circuit board
      // applies: a combined placement across seven games means nothing from
      // somebody who played two of them.
      const eligible = memberKeys
        ? overall.filter((r) => {
            const pg = r.perGame || {};
            return memberKeys.every((k) => pg[k] && !pg[k].abandoned);
          })
        : overall;
      if (!eligible.length) continue;
      // Re-ranks in place, and rewrites each row's `total` to questions right
      // with the clock as the tiebreak, exactly as /api/quiz/daily-combined
      // does for the same circuit.
      if (rawScore) rankByCorrect(eligible, memberKeys);
      if (byTime) rankByTime(eligible, memberKeys);
      // A clock day is won by a FULL run only: a row with a lot unsolved is
      // below every full run already, and if nobody parked all three that day
      // there is no champion rather than the fastest partial one.
      const crownable = byTime ? eligible.filter((r) => r.parkedAll) : eligible;
      if (!crownable.length) continue;
      // Crown only REGISTERED players. A guest (anon userKey 'a:...') has no
      // account, profile, or stable identity, so it can't hold a Hall-of-Fame
      // crown or link to a player page. Guests still count on the live combined
      // board; they just aren't crowned as the day's champion here.
      const registered = crownable.filter((o) => String(o.userKey || '').startsWith('u:'));
      if (!registered.length) continue; // no registered player that day -> no champion, skip the day
      const gameCount = gameResults.length;
      // On a questions-right circuit the ceiling is that day's own question
      // count, read off the banks the way scoreGame reads a denominator: the
      // largest total any player recorded for each puzzle.
      const maxTotal = byTime ? gameCount : rawScore
        ? gameResults.reduce((sum, g) => {
            let t = 0;
            for (const p of g.players.values()) t = Math.max(t, Number(p.total) || 0);
            return sum + t;
          }, 0)
        : Math.min(dayBestN, gameCount) * GAME_MAX;
      const w = registered[0];
      const ru = registered[1] || null;
      history.push({
        date: suffix,
        dateISO: dayISO,
        label: dayLabel,
        gameCount,
        // How many of the circuit's CURRENT roster ran that day, so a client can
        // say a day was scored over five banks rather than seven.
        rosterCount: rosterKeys ? rosterKeys.length : null,
        maxTotal,
        field: eligible.length,
        winner: { username: w.username, userKey: w.userKey, total: w.total, gamesPlayed: w.gamesPlayed, timeTotal: w.timeTotal ?? null },
        runnerUp: ru ? { username: ru.username, userKey: ru.userKey, total: ru.total, timeTotal: ru.timeTotal ?? null } : null,
      });
    }
    history.sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0));
    const trimmed = history.slice(0, HISTORY_DAYS);

    // Crown tally over EVERY crowned day, not the 30-day window (fixed
    // 2026-10-02). The tab that renders this is labelled All time, and once the
    // Gauntlet passed its first month each night's rollover was quietly taking
    // a win off whoever took the oldest day (player report: 7 wins became 6).
    // Crowns are frozen at Eastern midnight, so an all-time tally only grows.
    // The day-by-day `history` stays trimmed; it is the archive strip.
    const crowns = new Map();
    for (const h of history) {
      const k = h.winner.userKey;
      const c = crowns.get(k) || { username: h.winner.username, userKey: k, wins: 0 };
      c.wins += 1;
      c.username = h.winner.username;
      crowns.set(k, c);
    }
    const champions = [...crowns.values()].sort((a, b) => b.wins - a.wins || String(a.username).localeCompare(String(b.username)));

    // All-time per-game stat line, in canonical daily order. Narrowed to the
    // circuit's CURRENT roster when one was asked for: a game it dropped is no
    // longer part of what this circuit is.
    const rosterNow = circuitOn ? new Set(circuitKeysFor(circuitId, todayISO)) : null;
    const games = DAILY_KEYS
      .filter((k) => gameAgg.has(k) && (!rosterNow || rosterNow.has(k)))
      .map((k) => {
      const g = gameAgg.get(k);
      return {
        key: k,
        plays: g.plays,
        signedPlays: g.signedPlays,
        players: g.players.size,
        days: g.days.size,
        avgCompletionPct: g.totalDen > 0 ? Math.round((g.correct / g.totalDen) * 100) : 0,
        bestScore: g.best,
      };
    });

    return NextResponse.json({
      today: todaySuffix,
      // Which circuit this archive is, or null for the full slate, so a client
      // cannot mistake one narrowed history for another.
      circuit: circuitOn ? circuitId : null,
      // What a winner's `total` IS: 'correct' is questions answered right,
      // 'points' is the 0..15 ladder summed over the roster.
      scoreMode,
      days: trimmed.length,
      history: trimmed,
      champions,
      // All-time companions to `champions`, for the All time tab: every day
      // ever crowned, and the highest winning total across all of them (the
      // same max-total test the clients ran over the trimmed history).
      crownedDays: history.length,
      bestRun: history.reduce((best, d) => (!best || (d.winner && d.winner.total > best.winner.total) ? d : best), null),
      games,
    }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('daily-history exception', e);
    return NextResponse.json({ today: todaySuffix, circuit: circuitOn ? circuitId : null, days: 0, history: [], champions: [], games: [] });
  }
}
