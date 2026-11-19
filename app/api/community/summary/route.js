import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { guard, todayDay, talkCounts, ideasOf, publicIdea, gameOf } from '@/lib/community';

// /api/community/summary: the same for every reader, so the CDN holds it.
// Feeds the Community pill and bands (how many players are talking today, and
// about which puzzles) and The Commons (the busiest discussions, the top ideas).
//   GET ?game=<key>   -> also { game: { posts, players } } for that puzzle
// No post text and no names of posters leave this route: it is spoiler safe
// for a reader who has not played anything.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const CACHE = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = (searchParams.get('game') || '').trim().toLowerCase();
  const out = await guard(async () => {
    const day = todayDay();
    const talk = await talkCounts(supabaseAdmin, day);
    const players = new Set();
    let posts = 0;
    for (const t of talk) { posts += t.posts; }
    // talkers across every discussion (a player in two counts once)
    const { data } = await supabaseAdmin.from('community_posts').select('user_id').eq('day', day).eq('hidden', false).eq('maker', false).limit(20000);
    for (const r of (data || [])) if (r.user_id) players.add(r.user_id);
    const ideas = await ideasOf(supabaseAdmin, { stage: null, sort: 'top', limit: 40 });
    const { count: ideaCount } = await supabaseAdmin.from('community_ideas').select('id', { count: 'exact', head: true }).eq('hidden', false).neq('stage', 'built');
    const named = talk.map((t) => { const g = gameOf(t.game); return g ? { key: g.key, name: g.name, cat: g.cat, href: g.href, posts: t.posts, players: t.players } : null; }).filter(Boolean);
    const one = key ? (named.find((t) => t.key === key) || { key, posts: 0, players: 0 }) : null;
    return {
      day, posts, players: players.size, ideaCount: ideaCount || 0, talk: named.slice(0, 24),
      ideas: ideas.filter((i) => i.stage !== 'built').slice(0, 5).map((i) => publicIdea(i)),
      built: ideas.filter((i) => i.stage === 'built').slice(0, 3).map((i) => publicIdea(i)),
      game: one,
    };
  });
  return NextResponse.json(out, { status: out.status || 200, headers: out.available === false ? { 'Cache-Control': 'public, s-maxage=60' } : CACHE });
}
