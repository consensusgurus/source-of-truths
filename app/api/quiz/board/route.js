import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { buildLeaderboardMatrix, playerStanding } from '@/lib/quiz-anon';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { resolvePlayerKeys } from '@/lib/quiz-identity';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' };
// A response carrying the caller's OWN placement is per-player, so it never goes
// in a shared cache.
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const AXES = new Set([
  'registered:all', 'registered:mobile', 'registered:first',
  'all:all', 'all:mobile', 'all:first',
]);

// Summarize completed games for a quiz into play count, average correct, and
// the leaderboard (each signed-up user's best attempt, ranked by score desc
// then time asc). Computed in JS over service-role rows so it is fully
// deterministic and RLS-independent.
export function summarize(rows) {
  const plays = rows.length;
  const best = plays ? Math.max(...rows.map((r) => r.score)) : null;
  // Fastest time recorded AT the best score, across ALL completed plays
  // (anonymous included, not just the signed-up leaderboard). Lets the client
  // tell whether a finished run is the outright #1 (top score, fastest time).
  const topTime = best != null
    ? Math.min(...rows.filter((r) => r.score === best).map((r) => (r.time_elapsed ?? Infinity)))
    : null;
  // Two composable leaderboard axes (population x filter) -> 6 boards, keyed
  // "<population>:<filter>" in `leaderboards`. Anonymous players appear in every
  // view EXCEPT 'registered:*'; in particular 'all:first' lists everyone's first
  // attempt (anon included), which the "All players + First try" toggle shows.
  // Legacy flat keys are kept for the compact strip/snippet and older clients:
  // leaderboardFirst now resolves to 'all:first' so anonymous first plays are
  // no longer dropped.
  const leaderboards = buildLeaderboardMatrix(rows);
  const leaderboard = leaderboards['registered:all'];
  const leaderboardMobile = leaderboards['all:mobile'];
  const leaderboardFirst = leaderboards['all:first'];
  const leaderboardAll = leaderboards['all:all'];
  // Exact score distribution over ALL completed attempts, so the client can
  // report the real share of attempts a finished run beat (no modeled curve).
  const scoreDist = {};
  for (const r of rows) { const sv = Number(r.score) || 0; scoreDist[sv] = (scoreDist[sv] || 0) + 1; }
  // THE FIELD'S CLOCK (2026-09-26): twelve bins over the times recorded AT the
  // best score, all attempts, so the finish can draw the day's distribution
  // with the finisher's own bar lit. Linear from the fastest run to the 95th
  // percentile; anything slower lands in the last bin. Null under five runs.
  const timeDist = timeDistOf(rows, best);
  return { plays, best, topTime: Number.isFinite(topTime) ? topTime : null, leaderboard, leaderboardMobile, leaderboardFirst, leaderboardAll, leaderboards, scoreDist, timeDist };
}

const DIST_BINS = 12;
function timeDistOf(rows, best) {
  if (best == null) return null;
  const ts = rows.filter((r) => r.score === best && r.time_elapsed != null && !r.abandoned)
    .map((r) => Number(r.time_elapsed)).filter((t) => Number.isFinite(t) && t >= 0).sort((a, b) => a - b);
  if (ts.length < 5) return null;
  const lo = ts[0];
  const hi = Math.max(lo + 1, ts[Math.min(ts.length - 1, Math.floor(ts.length * 0.95))]);
  const bins = new Array(DIST_BINS).fill(0);
  for (const t of ts) bins[Math.min(DIST_BINS - 1, Math.floor(((t - lo) / (hi - lo)) * DIST_BINS))] += 1;
  return { n: ts.length, lo, hi, bins };
}

// GET /api/quiz/board?quizId=...                       -> { plays, avg, leaderboard }
// GET /api/quiz/board?quizId=&anonId=&email=&placeOn=  -> ...plus { me }
//
// THE CALLER'S OWN PLACEMENT (owner, 2026-08-16). Every board above is capped at
// TEN rows, and the Loft end card was ranking the player by their INDEX in those
// ten (`myRank` in LoftFinish). A player who finished outside the top ten was
// simply not in the payload, so the rank tile printed a dash rather than a
// number: an owner report on Crux, 20/24 in a field of 108, is what surfaced it.
// The rows are already in this process's shared cache, so answering honestly
// costs one more pass over ONE quiz's rows, not a second request.
//
// `placeOn` names the board the caller is PRINTING, because a rank from a
// different axis than the rows shown underneath it is the same class of bug in a
// new coat. It defaults to 'registered:first', which is what the end card and
// DailyBoardPanel render.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const quizId = (searchParams.get('quizId') || '').trim();
  if (!quizId || quizId.length > 100) {
    return NextResponse.json({ error: 'quizId required' }, { status: 400 });
  }
  try {
    // Egress fix (2026-07-12): filter the shared in-process quiz_results cache
    // instead of re-reading every row for this quiz from Supabase per request.
    // The cache column superset includes everything summarize() needs
    // (time_elapsed, is_mobile, guesses_used, correct_count) and handles the
    // missing-column fallbacks internally. Rows are already in id order.
    const { data: all, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) {
      console.error('quiz board error', error);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    const data = (all || []).filter((r) => r.quiz_id === quizId);
    const anonId = (searchParams.get('anonId') || '').trim() || null;
    const email = (searchParams.get('email') || '').trim() || null;
    // No identity means the old, shared-cacheable answer, byte for byte.
    if (!anonId && !email) return NextResponse.json(summarize(data), { headers: CACHE_HEADERS });
    const asked = searchParams.get('placeOn');
    const axis = AXES.has(asked) ? asked : 'registered:first';
    const [population, filter] = axis.split(':');
    let me = null;
    try {
      // resolvePlayerKeys, not a username match: one person's rows carry BOTH
      // `u:<id>` and `a:<anon>` shapes, and matching on the display name is what
      // the row-index approach was already doing.
      const who = await resolvePlayerKeys(supabaseAdmin, { anonId, email });
      const st = playerStanding(data, who.keys, { population, filter });
      me = { key: who.primary, axis, placement: st.placement, field: st.field, row: st.row };
      // WHERE A GUEST WOULD RANK (owner, 2026-09-01). A guest has no placement
      // on the registered board, and the end card's claim tile has to say what
      // registering would buy: their own rows dealt in among the registered
      // ones, and nobody else's guest rows. Same comparator, same filter, so
      // the number is exactly what the board would print the moment they join.
      if (st.placement == null && population === 'registered' && who.keys && who.keys.size) {
        const keyOf = (r) => (r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`));
        const pool = data.filter((r) => r.user_id || who.keys.has(keyOf(r)));
        const wb = playerStanding(pool, who.keys, { population: 'all', filter });
        if (wb.placement != null) me.wouldBe = { placement: wb.placement, field: wb.field };
      }
    } catch (e) {
      me = null; // the boards themselves are still worth returning
    }
    return NextResponse.json({ ...summarize(data), me }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    return NextResponse.json({ error: 'db error' }, { status: 500 });
  }
}
