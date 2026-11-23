import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { guestHandleFromAnon } from '@/lib/quiz-xp';
import { QUIZZES } from '@/lib/quizzes';

const HIDDEN_QUIZ_IDS = new Set((QUIZZES || []).filter((q) => q && (q.unlisted || q.mobilePreview)).map((q) => q.id));

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };

// Midnight "today" in US Eastern (handles EST/EDT) as a UTC epoch ms. Mirrors
// the helper in /api/quiz/today: Eastern midnight is 05:00Z under EST and
// 04:00Z under EDT, so pick whichever candidate renders as 00:00 Eastern.
function startOfEasternTodayUTC() {
  const tz = 'America/New_York';
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(new Date(guess))
      .reduce((acc, x) => { acc[x.type] = x.value; return acc; }, {});
    if (`${p.year}-${p.month}-${p.day}` === ymd && p.hour === '00') return guess;
  }
  return Date.parse(`${ymd}T04:00:00.000Z`);
}

// GET /api/quiz/recent -> { plays: [{quizId, username, score, total, playedAt,
//   isAnon, attempt, dayIndex}], todayByQuiz: { <quizId>: <plays since ET midnight> } }
// The 1000 most recent completed games, newest first (a deep window so the
// Last Played board can still surface 5 distinct quizzes when the newest plays
// are dominated by a single quiz). Powers the /quizzes live
// feed + Last Played board. `attempt` is that PLAYER's chronological attempt
// number of that quiz (1 = first time), computed by counting their earlier rows
// for the same quiz; `isAnon` flags a play with no signed account.
export async function GET(request) {
  // ?limit=N (data audit, 2026-11-23): the home shows ten plays and was
  // downloading a thousand. Rows kept are computed exactly as before.
  let limit = 1000;
  try { const n = parseInt(new URL(request.url).searchParams.get('limit') || '', 10); if (n > 0) limit = Math.min(1000, n); } catch (e) { limit = 1000; }
  try {
    // Egress fix (2026-07-12): both reads below now come from the shared
    // in-process quiz_results cache instead of fresh Supabase queries.
    const { data: cached, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) {
      console.error('quiz recent error', error);
      return NextResponse.json({ plays: [] });
    }
    // The 1000 most recent completed games, newest first. Cached rows are in
    // id (insertion) order, which tracks created_at; sort the tail slice by
    // created_at to keep the previous ordering exactly.
    const data = (cached || [])
      .slice(-1200)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 1000);
    const recent = data.filter((r) => !HIDDEN_QUIZ_IDS.has(r.quiz_id)).slice(0, limit);

    // Today's play count per quiz id, so the live feed can show "(x25)" beside
    // each game (owner, 2026-08-04). Cached rows are in id (insertion) order,
    // which tracks created_at, so walk backwards and stop at the Eastern
    // midnight cutoff instead of scanning the whole table. A daily game's id
    // already carries today's date (<key>-M-D-YY), so the raw quiz_id count IS
    // that game's count for the day, with no rollup needed.
    //
    // The same walk also numbers each row WITHIN that count (owner,
    // 2026-08-25). Stamping the day total on every row made ten Jesters rows
    // all read the same "15 plays" and told the reader nothing about the row
    // it sat on; the feed now counts up, so the oldest Jesters play on screen
    // is play #6 and the newest is #15. Walking backwards visits the newest
    // play first, so the n-th row seen for a quiz is the n-th from the END of
    // its day; that becomes a 1-based position once the total is known.
    const dayCutoff = startOfEasternTodayUTC();
    const todayByQuiz = {};
    const fromEnd = new Map(); // row id -> { q, n } (n = n-th newest today)
    for (let i = (cached || []).length - 1; i >= 0; i -= 1) {
      const r = cached[i];
      const t = r && r.created_at ? Date.parse(r.created_at) : 0;
      if (!t) continue;
      if (t < dayCutoff) break;
      if (!r.quiz_id || HIDDEN_QUIZ_IDS.has(r.quiz_id)) continue;
      const n = (todayByQuiz[r.quiz_id] || 0) + 1;
      todayByQuiz[r.quiz_id] = n;
      if (r.id != null) fromEnd.set(r.id, { q: r.quiz_id, n });
    }
    const dayIndexById = new Map();
    for (const [id, v] of fromEnd) dayIndexById.set(id, (todayByQuiz[v.q] || 0) - v.n + 1);

    // Compute the per-(player, quiz) attempt number for each recent row by
    // counting that player's earlier rows for the same quiz, over the full
    // cached table (id order = chronological).
    const quizIds = [...new Set(recent.map((r) => r.quiz_id).filter(Boolean))];
    const priorCount = new Map(); // `${playerKey}::${quizId}::${rowId}` -> attempt
    const fracsByQuiz = new Map(); // quiz_id -> score fractions (crowd distribution)
    if (quizIds.length) {
      const quizIdSet = new Set(quizIds);
      const all = (cached || []).filter((r) => quizIdSet.has(r.quiz_id));
      const seen = new Map(); // `${playerKey}::${quizId}` -> running count
      for (const r of (all || [])) {
        const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`);
        const k = pk + '::' + r.quiz_id;
        const n = (seen.get(k) || 0) + 1;
        seen.set(k, n);
        priorCount.set(pk + '::' + r.quiz_id + '::' + r.id, n);
        const tot = Number(r.total) || 0;
        if (tot > 0) { let arr = fracsByQuiz.get(r.quiz_id); if (!arr) { arr = []; fracsByQuiz.set(r.quiz_id, arr); } arr.push(Math.min(1, (Number(r.score) || 0) / tot)); }
      }
      for (const arr of fracsByQuiz.values()) arr.sort((a, b) => a - b);
    }
    // Anonymous crowd percentile (midrank method): the share of a quiz's plays
    // this score ranks above, counting tied scores as half. Ties count as half
    // so a top score in an all-perfect field lands near 50% (you tied the field)
    // instead of the old strict-below math, which showed a perfect run "beat 0%"
    // whenever no one scored strictly lower.
    // Needs a real sample (>= 5 plays) else null (the chip is hidden).
    const pctOf = (qid, frac) => {
      const arr = fracsByQuiz.get(qid);
      if (!arr || arr.length < 5) return null;
      let below = 0, equal = 0;
      for (const x of arr) {
        if (x < frac - 1e-9) below += 1;
        else if (x <= frac + 1e-9) equal += 1;
      }
      return Math.round(((below + 0.5 * equal) / arr.length) * 100);
    };

    const plays = recent.map((r) => {
      const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`);
      const attempt = priorCount.get(pk + '::' + r.quiz_id + '::' + r.id) || 1;
      const isAnon = !r.user_id;
      const name = isAnon
        ? (r.username || guestHandleFromAnon(r.anon_id || `r:${r.id}`))
        : (r.username || 'Player');
      return {
        quizId: r.quiz_id,
        username: r.username || null,
        name,
        // Linkable player key (u:<id> / a:<anon>) so the live feed can link a
        // name to its Stat Hub profile. Null for an unattributable one-off row.
        userKey: (r.user_id || r.anon_id) ? pk : null,
        score: r.score,
        total: r.total,
        playedAt: r.created_at || null,
        isAnon,
        attempt,
        // This play's own place in its quiz's day: 1 = the day's first play,
        // and todayByQuiz[quizId] = the newest. 0 for a row from an earlier day.
        dayIndex: dayIndexById.get(r.id) || 0,
        pct: (Number(r.total) > 0) ? pctOf(r.quiz_id, Math.min(1, (Number(r.score) || 0) / Number(r.total))) : null,
      };
    });
    return NextResponse.json({ plays, todayByQuiz }, { headers: CACHE_HEADERS });
  } catch (e) {
    return NextResponse.json({ plays: [] });
  }
}
