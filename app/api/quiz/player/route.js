import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { displayHandle } from '@/lib/quiz-xp';
import { computeXpCached } from '@/lib/quiz-derived-cache';
import { buildProfile } from '@/lib/quiz-profile';
import { computeTrophies, buildTrophyList } from '@/lib/quiz-trophies';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Viewer-independent answer, so the CDN may hold it briefly (Vercel cost fix,
// 2026-10-27): repeat reads within the window never start a function.
const EDGE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180' };


// Completed-duel win tally per anon, for the duel trophies. One extra query,
// paid only on profile views (this route), never on the per-game /me calls.
async function duelWins() {
  try {
    const { data, error } = await supabaseAdmin
      .from('quiz_duels')
      .select('challenger_anon, opponent_anon, winner')
      .eq('status', 'complete')
      .limit(10000);
    if (error || !data) return null;
    const wins = new Map();
    for (const d of data) {
      const anon = d.winner === 'challenger' ? d.challenger_anon : d.winner === 'opponent' ? d.opponent_anon : null;
      if (anon) wins.set(anon, (wins.get(anon) || 0) + 1);
    }
    return wins;
  } catch (e) { return null; }
}

// GET /api/quiz/player?key=u:123 | a:<anon>   (or ?username=Name)
// Any player's full XP profile, same shape as /api/quiz/me, PLUS the trophy
// case (all groups including duels). Lets the UI link a player name to their
// stat detail and powers /player/<name>. Anonymous guests are addressable by
// a:<anon>.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = (searchParams.get('key') || '').trim() || null;
  const uname = (searchParams.get('username') || '').trim() || null;
  try {
    const { data, error } = await loadQuizResults(supabaseAdmin);
    if (error) { console.error('quiz player error', error); return NextResponse.json({ found: false }); }
    // recentN large so a viewed player's Activity log shows their FULL history.
    const { players } = computeXpCached(data || [], { recentN: 100000, rankFor: key });

    let myKey = key;
    if (!myKey && uname) {
      // Resolve a (registered) display name to its key.
      for (const [k, p] of players) {
        if (!p.isAnon && ((p.username || displayHandle(p)).toLowerCase() === uname.toLowerCase())) { myKey = k; break; }
      }
    }
    const profile = buildProfile(players, myKey);
    if (profile.found) {
      const duelWinsByAnon = await duelWins();
      const res = computeTrophies(data || [], players, { duelWinsByAnon });
      profile.trophies = buildTrophyList(res, myKey, { includeDuels: duelWinsByAnon != null });
    }
    return NextResponse.json(profile, { headers: profile && profile.found ? EDGE : undefined });
  } catch (e) {
    console.error('quiz player exception', e);
    return NextResponse.json({ found: false });
  }
}
