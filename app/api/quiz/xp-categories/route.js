import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { rankPlayers } from '@/lib/quiz-xp';
import { iqSnapshot } from '@/lib/quiz-derived-cache';
import { DEPT_NAV } from '@/lib/quiz-departments';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Same boards for every visitor: let Vercel's CDN absorb repeat hits instead
// of hitting Supabase per request (egress fix 2026-07-12).
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET /api/quiz/xp-categories
// One XP computation, then the XP-ranked top players for EVERY department, so
// the /quizzes leaderboard can cycle an "XP Leaders <Category>" slide per
// category without a round trip each. Only departments with at least
// MIN_PLAYERS ranked players are returned.
const TOP_N = 10;
const MIN_PLAYERS = 3;

export async function GET() {
  try {
    const { data, error } = await loadQuizResults(supabaseAdmin);
    if (error) {
      console.error('quiz xp-categories error', error);
      return NextResponse.json({ boards: {} });
    }
    // The shared IQ field (up to ten minutes old), see /api/quiz/xp (2026-10-27).
    const { players } = await iqSnapshot(data || []);
    const boards = {};
    for (const d of DEPT_NAV) {
      const ranked = rankPlayers(players, d.id);
      // Prefer named players; fall back to including guests only when there
      // aren't enough named ones to fill the top three.
      const named = ranked.filter((p) => !p.isAnon);
      const list = named.length >= MIN_PLAYERS ? named : ranked;
      if (list.length < MIN_PLAYERS) continue;
      boards[d.id] = list.slice(0, TOP_N).map((p, i) => ({
        rank: i + 1,
        name: p.name,
        isAnon: p.isAnon,
        userKey: p.key,
        xp: p.xp,
        level: p.level,
        played: p.played,
      }));
    }
    return NextResponse.json({ boards }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('quiz xp-categories exception', e);
    return NextResponse.json({ boards: {} });
  }
}
