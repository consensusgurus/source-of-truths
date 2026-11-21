import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralTableMissing } from '@/lib/mural';
import { parseMuralId, muralWhoKey } from '@/lib/mural-shared';

// GET /api/mural/state?id=<mural id>
//
// The shared mural: which pieces somebody has placed, the standings and who
// built it. One snapshot for everyone, cached at the edge for two minutes,
// which is the refresh the board polls on. Nothing here is per player.

export const dynamic = 'force-dynamic';
// Without this Next keeps the Supabase reads in its data cache, and a board
// read that came back empty once stays empty.
export const fetchCache = 'force-no-store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '');
  if (!parseMuralId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await supabaseAdmin.rpc('mural_state', { p_mural: id });
  if (error) {
    const gone = muralTableMissing(error);
    if (!gone) console.error('mural state', error);
    return NextResponse.json({ error: 'Unavailable', available: !gone }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  // Active players: distinct players with a placement in the last 15 minutes. Read here, not in
  // mural_state(), so it needs no migration; the response is edge-cached for two minutes anyway.
  // WHO (owner, 2026-11-20: the update note "should also show who is placing them"): the same read
  // also gives each player's first placements in that window, as times, so a page can count what each
  // player added between its last snapshot and this one. k is muralWhoKey(player); n the name, or
  // null for a guest.
  let active = 0, who = [];
  try {
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: rec } = await supabaseAdmin.from('mural_places').select('player, username, first, placed_at').eq('mural_id', id).gte('placed_at', since).limit(10000);
    const by = new Map();
    for (const x of rec || []) {
      let p = by.get(x.player);
      if (!p) { p = { k: muralWhoKey(x.player), n: (x.player || '').startsWith('u:') ? (x.username || 'Player') : null, t: [] }; by.set(x.player, p); }
      if (x.first) p.t.push(Math.floor(Date.parse(x.placed_at) / 1000));
    }
    active = by.size;
    who = [...by.values()].filter((p) => p.t.length);
  } catch (e) { active = 0; who = []; }
  return NextResponse.json({ ...(data || {}), active, who, at: Date.now() }, {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=60' },
  });
}
