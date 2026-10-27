import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { rankPlayers } from '@/lib/quiz-xp';
import { iqSnapshot } from '@/lib/quiz-derived-cache';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Same board for every visitor (per scope/full URL): let Vercel's CDN absorb
// repeat hits instead of hitting Supabase per request (egress fix 2026-07-12).
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET /api/quiz/xp[?scope=<dept>][&full=1][&sort=xp30d]
// XP-RANKED leaderboard for the /quizzes page — every player gets a numbered
// rank. Returns, per ranked player, the per-metric values FOR THE REQUESTED
// SCOPE (xp, level, correct, completed, days played, accuracy) so the page can
// re-sort the board by whichever slide is showing without another round trip.
// `scope` filters to one department; omit/`all` for overall. ALL anonymous
// players are included. full=1 returns up to FULL_N rows plus trend7d = XP
// earned in the last 7 days (null = the player's first game is newer than the
// cutoff, shown as NEW). sort=xp30d re-ranks by XP earned in the last 30
// days instead of all-time (the Top SoT Player tile on /quizzes), and every
// row carries xp30d either way. sort=xpToday re-ranks by IQ Points earned so
// far in the current EASTERN day (the "Today's Top IQ Gainers" face of the
// Daily Puzzle Leaderboard); every row carries xpToday either way.
const TOP_N = 12;
// full=1 page size. `total` in the response is ALWAYS the real ranked-player
// count, never this cap: the Stat Hub board prints it as "Top 2,000 of N
// players", and reporting the truncated length there made the page claim the
// whole player base was 2,000 once we passed 2,000 players (2026-08-08).
const FULL_N = 2000;
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get('scope') || 'all').trim() || 'all';
  const full = searchParams.get('full') === '1';
  const sort = (searchParams.get('sort') || '').trim();
  try {
    const { data, error } = await loadQuizResults(supabaseAdmin);
    if (error) {
      console.error('quiz xp error', error);
      return NextResponse.json({ scope, total: 0, players: [] });
    }
    // The shared IQ field (up to ten minutes old) rather than a fresh pass over
    // every row: this is a public board, cached at the CDN anyway (2026-10-27).
    const { players } = await iqSnapshot(data || []);
    let ranked = rankPlayers(players, scope);
    // Recent-window board. Ties fall back to all-time XP so the order is stable
    // for the (many) players sitting at 0 for the window.
    if (sort === 'xp30d') {
      ranked = ranked
        .slice()
        .sort((a, b) => (b.xp30d || 0) - (a.xp30d || 0) || b.xp - a.xp || (a.name || '').localeCompare(b.name || ''));
    }
    // Today's board. Same shape as the 30-day one: ties fall back to the wider
    // windows so the many players sitting at 0 for today keep a stable order.
    if (sort === 'xpToday') {
      ranked = ranked
        .slice()
        .sort((a, b) => (b.xpToday || 0) - (a.xpToday || 0) || (b.xp30d || 0) - (a.xp30d || 0) || b.xp - a.xp || (a.name || '').localeCompare(b.name || ''));
    }
    const out = ranked.slice(0, full ? FULL_N : TOP_N).map((p, i) => ({
      rank: i + 1,
      name: p.name,
      isAnon: p.isAnon,
      userKey: p.key,
      xp: p.xp,
      xp30d: p.xp30d == null ? 0 : p.xp30d,
      xpToday: p.xpToday == null ? 0 : p.xpToday,
      level: p.level,
      correct: p.correct,
      completed: p.completed,
      daysPlayed: p.daysPlayed,
      accuracy: p.accuracy,
      played: p.played,
      ...(full && scope === 'all' ? { trend7d: p.xp7d == null ? null : p.xp7d } : {}),
    }));
    return NextResponse.json({ scope, total: ranked.length, players: out }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('quiz xp exception', e);
    return NextResponse.json({ scope, total: 0, players: [] });
  }
}
