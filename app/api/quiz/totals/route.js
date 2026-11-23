import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { correctAnswersOf } from '@/lib/quiz-scoring';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// 60s -> 300s (egress fix 2026-07-12): identical for every visitor, so let the
// CDN hold it longer; the counters tolerate five minutes of staleness.
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET /api/quiz/totals -> { total, byQuiz, recent7, recent12h, trendingByQuiz, trendingWindowH }
// Aggregate play counts across every quiz (all completed games, signed-up or
// not), for the /quizzes index counter and the Popular / Trending sorts.
//
// `trendingByQuiz` powers the upper "Trending Now" board only (NOT the tiled
// grid's Trending sort, which stays on the 7-day `recent7` basis). It uses a
// dynamic, self-widening window: start at the last 3 hours and, if fewer than
// 3 distinct quizzes have plays, widen by 3 hours at a time (6h, 9h, ...) until
// at least 3 quizzes qualify or the 7-day cap is reached. `trendingWindowH` is
// the chosen window size in hours, so the UI can note how far back it reached.
const TREND_BUCKET_H = 3;            // widen the window in 3-hour steps
const TREND_MAX_BUCKETS = 56;        // cap at 56 * 3h = 7 days
const TREND_MIN_QUIZZES = 3;         // widen until at least this many quizzes have plays

// Midnight "today" in US Eastern (handles EST/EDT) as a UTC epoch ms, matching
// /api/quiz/today so the index's two "today" counters roll over together
// (previously this route used UTC midnight, which reset hours earlier).
function startOfEasternTodayUTC() {
  const tz = 'America/New_York';
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(new Date(guess))
      .reduce((a, x) => { a[x.type] = x.value; return a; }, {});
    if (`${p.year}-${p.month}-${p.day}` === ymd && p.hour === '00') return guess;
  }
  return Date.parse(`${ymd}T04:00:00.000Z`);
}

export async function GET(request) {
  // SLIM VIEWS (data audit, 2026-11-23). The full payload is 2.1 MB, and the home
  // reads about 1% of it. view=home is the day's figures only; view=leaders is
  // the all-time leader for the ids asked for. Same numbers, same cache rules.
  let view = '';
  let wantIds = null;
  try {
    const sp = new URL(request.url).searchParams;
    view = sp.get('view') || '';
    if (view === 'leaders') wantIds = (sp.get('ids') || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 200);
  } catch (e) { view = ''; }
  try {
    // Shared in-process cache (egress fix 2026-07-12); the single pass below
    // is order-independent, so id order instead of quiz_id order is fine.
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) {
      console.error('quiz totals error', error);
      return NextResponse.json({ total: 0, byQuiz: {}, recent7: {}, recent12h: {}, trendingByQuiz: {}, trendingWindowH: 0, leaders: {} });
    }
    const rows = data || [];
    const byQuiz = {};
    // First attempt per (registered user, quiz), keyed user_id::quiz_id, keeping
    // the lowest row id. The crown and the homepage top-3 are ranked from these
    // first attempts AFTER the pass, using the same tiebreak as the quiz-page
    // leaderboard (score desc, fewest guesses, fastest time, then name) so the
    // "leader" always matches the #1 row players see in the list.
    const firstByPair = new Map();
    const recent7 = {};
    const recent12h = {};
    const todayByQuiz = {};
    const todayAgg = {};
    const now = Date.now();
    const cutoff7 = now - 7 * 24 * 60 * 60 * 1000;
    const cutoff12h = now - 12 * 60 * 60 * 1000;
    const cutoffToday = startOfEasternTodayUTC();
    let today = 0;
    // Distinct PLAYERS today, guests included (owner, 2026-08-12). The Loft's
    // live slab printed the day's plays and the day's time and nothing about how
    // many people that was, which is the figure that says whether the site is
    // busy or one person is on a run. Keyed the same way every other player
    // count on the site is: the account where there is one, the browser's anon
    // id where there is not, so a guest counts exactly once and a signed-in
    // player is never double-counted against their own anon id. Free: this loop
    // already walks every row, and anon_id is already in the cached columns.
    const todayPlayers = new Set();
    let totalTime = 0;
    let todayTime = 0;
    let totalCorrect = 0;
    let totalPerfect = 0;
    const bucketMs = TREND_BUCKET_H * 60 * 60 * 1000;
    // Per quiz, plays bucketed by how many 3h steps back they fall (0 = newest).
    const buckets = new Map();
    for (const r of rows) {
      byQuiz[r.quiz_id] = (byQuiz[r.quiz_id] || 0) + 1;
      if (r.user_id && r.username) {
        // Keep only the earliest attempt per (user, quiz). Rows arrive in id
        // order, but compare ids explicitly so this holds regardless of order.
        const pairKey = r.user_id + '::' + r.quiz_id;
        const prevF = firstByPair.get(pairKey);
        if (!prevF || (r.id || 0) < (prevF.id || 0)) firstByPair.set(pairKey, r);
      }
      totalCorrect += correctAnswersOf(r);
      const te = Number(r.time_elapsed);
      if (Number.isFinite(te) && te > 0) totalTime += te;
      if (r.total > 0 && Number(r.score) === Number(r.total)) totalPerfect += 1;
      if (r.created_at) {
        const t = new Date(r.created_at).getTime();
        if (t >= cutoff7) recent7[r.quiz_id] = (recent7[r.quiz_id] || 0) + 1;
        if (t >= cutoff12h) recent12h[r.quiz_id] = (recent12h[r.quiz_id] || 0) + 1;
        if (t >= cutoffToday) { today += 1; todayByQuiz[r.quiz_id] = (todayByQuiz[r.quiz_id] || 0) + 1; if (r.user_id) todayPlayers.add(`u:${r.user_id}`); else if (r.anon_id) todayPlayers.add(`a:${r.anon_id}`); if (Number.isFinite(te) && te > 0) todayTime += te; if (r.total > 0) { let a = todayAgg[r.quiz_id]; if (!a) { a = { plays: 0, sumFrac: 0, perfect: 0 }; todayAgg[r.quiz_id] = a; } a.plays += 1; a.sumFrac += (Number(r.score) || 0) / Number(r.total); if (Number(r.score) === Number(r.total)) a.perfect += 1; } }
        const idx = Math.floor((now - t) / bucketMs);
        if (idx >= 0 && idx < TREND_MAX_BUCKETS) {
          let arr = buckets.get(r.quiz_id);
          if (!arr) { arr = new Array(TREND_MAX_BUCKETS).fill(0); buckets.set(r.quiz_id, arr); }
          arr[idx] += 1;
        }
      }
    }
    // Widen the window 3h at a time until >= 3 quizzes have any plays in it.
    const cum = {};
    let trendingWindowH = TREND_MAX_BUCKETS * TREND_BUCKET_H;
    for (let k = 0; k < TREND_MAX_BUCKETS; k++) {
      for (const [qid, arr] of buckets) { if (arr[k]) cum[qid] = (cum[qid] || 0) + arr[k]; }
      if (Object.keys(cum).length >= TREND_MIN_QUIZZES) { trendingWindowH = (k + 1) * TREND_BUCKET_H; break; }
    }
    const trendingByQuiz = { ...cum };
    // Rank the per-quiz leader crown and the homepage top-3 from FIRST attempts
    // only. Tiebreak matches the quiz-page leaderboard: score desc, then fewest
    // guesses, then fastest time, then name. guesses_used may be absent on older
    // rows (or when the cache drops the column) -> Infinity, so it degrades to
    // the time tiebreak just like before.
    const bestLeader = {};       // quiz_id -> best first attempt
    const byUserPerQuiz = {};    // quiz_id -> Map(username -> { score, guesses, time })
    for (const r of firstByPair.values()) {
      const sc = Number(r.score) || 0;
      const gu = Number.isFinite(Number(r.guesses_used)) ? Number(r.guesses_used) : Infinity;
      const tm = Number.isFinite(Number(r.time_elapsed)) ? Number(r.time_elapsed) : Infinity;
      const cur = bestLeader[r.quiz_id];
      if (!cur
        || sc > cur.score
        || (sc === cur.score && gu < cur.guesses)
        || (sc === cur.score && gu === cur.guesses && tm < cur.time)
        || (sc === cur.score && gu === cur.guesses && tm === cur.time && r.username.localeCompare(cur.name) < 0)) {
        bestLeader[r.quiz_id] = { score: sc, guesses: gu, time: tm, name: r.username, userId: r.user_id };
      }
      let um = byUserPerQuiz[r.quiz_id];
      if (!um) { um = new Map(); byUserPerQuiz[r.quiz_id] = um; }
      const prevU = um.get(r.username);
      if (!prevU
        || sc > prevU.score
        || (sc === prevU.score && gu < prevU.guesses)
        || (sc === prevU.score && gu === prevU.guesses && tm < prevU.time)) {
        um.set(r.username, { score: sc, guesses: gu, time: tm });
      }
    }
    const leaders = {};
    const leaderKeys = {};
    for (const qid of Object.keys(bestLeader)) { leaders[qid] = bestLeader[qid].name; if (bestLeader[qid].userId) leaderKeys[qid] = `u:${bestLeader[qid].userId}`; }
    // Top 3 distinct players per quiz (gold/silver/bronze) from first attempts:
    // best score, then fewest guesses, then fastest time, then name.
    const topLeaders = {};
    for (const qid of Object.keys(byUserPerQuiz)) {
      topLeaders[qid] = [...byUserPerQuiz[qid].entries()]
        .sort((a, b) => b[1].score - a[1].score || (a[1].guesses - b[1].guesses) || a[1].time - b[1].time || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([name]) => name);
    }
    // Toughest quiz TODAY: lowest average score fraction among quizzes with a
    // real sample of today's plays (>= 8, relax to 4, then 1). Anonymous.
    let toughest = null;
    for (const th of [8, 4, 1]) {
      let best = null;
      for (const qid of Object.keys(todayAgg)) {
        const a = todayAgg[qid];
        if (a.plays < th) continue;
        const avgFrac = a.sumFrac / a.plays;
        if (!best || avgFrac < best.avgFrac || (avgFrac === best.avgFrac && a.plays > best.plays)) {
          best = { quizId: qid, avgFrac, aceRate: a.perfect / a.plays, plays: a.plays };
        }
      }
      if (best) { toughest = best; break; }
    }
    if (view === 'home') {
      return NextResponse.json({ total: rows.length, today, todayPlayers: todayPlayers.size, totalTime, todayTime, todayByQuiz }, { headers: CACHE_HEADERS });
    }
    if (view === 'leaders') {
      const sub = {};
      for (const id of wantIds || []) if (leaders[id]) sub[id] = leaders[id];
      return NextResponse.json({ leaders: sub }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json({ total: rows.length, today, todayPlayers: todayPlayers.size, totalCorrect, totalPerfect, totalTime, todayTime, byQuiz, recent7, recent12h, todayByQuiz, trendingByQuiz, trendingWindowH, leaders, leaderKeys, topLeaders, toughest }, { headers: CACHE_HEADERS });
  } catch (e) {
    return NextResponse.json({ total: 0, byQuiz: {}, recent7: {}, recent12h: {}, trendingByQuiz: {}, trendingWindowH: 0, leaders: {} });
  }
}
