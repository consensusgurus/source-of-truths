import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Viewer-independent answer, so the CDN may hold it briefly (Vercel cost fix,
// 2026-10-27): repeat reads within the window never start a function.
const EDGE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180' };


// GET /api/duel/ladder  -> standings from completed duels, by player (anon).
export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quiz_duels')
      .select('quiz_id, challenger_anon, challenger_name, challenger_score, opponent_anon, opponent_name, opponent_score, winner, created_at')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) return NextResponse.json({ ladder: [] });
    const by = new Map();
    // Records each completed duel from ONE player's perspective: bumps their
    // W/L/T tally and appends a match (result + who it was against + the quiz
    // and final scores) so the ladder row can expand to a game history.
    const bump = (anon, name, result, foeName, foeAnon, quizId, myScore, theirScore) => {
      if (!anon) return;
      let g = by.get(anon);
      if (!g) { g = { anon, name: name || 'Player', wins: 0, losses: 0, ties: 0, matches: [] }; by.set(anon, g); }
      if (name) g.name = name;
      g[result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'ties'] += 1;
      if (g.matches.length < 40) {
        g.matches.push({
          result, quizId: quizId || '', vs: foeName || 'Player', vsAnon: foeAnon || null,
          my: Number.isFinite(myScore) ? myScore : null,
          their: Number.isFinite(theirScore) ? theirScore : null,
        });
      }
    };
    for (const d of (data || [])) {
      const cw = d.winner === 'challenger', ow = d.winner === 'opponent', tie = d.winner === 'tie';
      bump(d.challenger_anon, d.challenger_name, tie ? 'tie' : cw ? 'win' : 'loss', d.opponent_name, d.opponent_anon, d.quiz_id, d.challenger_score, d.opponent_score);
      bump(d.opponent_anon, d.opponent_name, tie ? 'tie' : ow ? 'win' : 'loss', d.challenger_name, d.challenger_anon, d.quiz_id, d.opponent_score, d.challenger_score);
    }
    const ranked = [...by.values()].map((g) => {
      const played = g.wins + g.losses + g.ties;
      return { ...g, played, winPct: played ? Math.round((g.wins / played) * 100) : 0 };
    }).sort((a, b) => b.wins - a.wins || b.winPct - a.winPct || b.played - a.played || a.name.localeCompare(b.name)).slice(0, 50);
    // Resolve each player's Stat Hub profile key: a registered player's quiz
    // results carry a user_id (key u:<id>); guests are addressed as a:<anon>.
    // This lets the client link a ladder name straight to that player's profile.
    const anons = ranked.map((g) => g.anon).filter(Boolean);
    const userByAnon = new Map();
    if (anons.length) {
      const { data: rows } = await supabaseAdmin
        .from('quiz_results')
        .select('anon_id, user_id')
        .in('anon_id', anons)
        .not('user_id', 'is', null)
        .limit(20000);
      for (const r of (rows || [])) { if (r.anon_id && r.user_id != null) userByAnon.set(r.anon_id, r.user_id); }
    }
    const ladder = ranked.map((g) => ({ ...g, key: userByAnon.has(g.anon) ? `u:${userByAnon.get(g.anon)}` : `a:${g.anon}` }));
    return NextResponse.json({ ladder }, { headers: EDGE });
  } catch (e) {
    return NextResponse.json({ ladder: [] });
  }
}
