import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralTableMissing } from '@/lib/mural';
import { parseMuralId, muralIdAllowed } from '@/lib/mural-shared';

// GET /api/mural/wall?id=<mural id>
//
// THE WALL (owner, 2026-11-19: the closing screen "will be immortalized"). Who
// placed each piece of a mural first, in the order the site placed them. The
// closing screen (app/mural/memorial.js) builds the picture from it and sizes
// one block a player. It reads the placement rows themselves, which are never
// deleted, so a mural's wall is the same on the day it finishes and a year on.
//
//   who    the members, most pieces first: [{ n: name, f: firsts }]
//   guests every guest together: { players, f }
//   order  piece ids, oldest placement first
//   own    for each of those, 0 for a guest or 1 + its index in `who`
//
// A finished mural cannot change (mural_place refuses it), so its answer is
// held at the edge for a month. An open one is held for two minutes, like the
// board's own snapshot. No player id leaves the server.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PAGE = 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '');
  if (!parseMuralId(id) || !muralIdAllowed(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const fail = (error) => {
    const gone = muralTableMissing(error);
    if (!gone) console.error('mural wall', error);
    return NextResponse.json({ error: 'Unavailable', available: !gone }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  };
  const b = await supabaseAdmin.from('mural_boards').select('id, cols, rows, opens_at, completed_at').eq('id', id).maybeSingle();
  if (b.error) return fail(b.error);
  if (!b.data) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=30' } });
  const total = b.data.cols * b.data.rows;

  // Only first placements are on the shared wall, so there are at most `total` rows.
  const rows = [];
  for (let from = 0; from < total + PAGE; from += PAGE) {
    const r = await supabaseAdmin.from('mural_places')
      .select('piece, player, user_id, username, placed_at')
      .eq('mural_id', id).eq('first', true)
      .order('placed_at', { ascending: true }).order('piece', { ascending: true })
      .range(from, from + PAGE - 1);
    if (r.error) return fail(r.error);
    rows.push(...(r.data || []));
    if (!r.data || r.data.length < PAGE) break;
  }

  const per = new Map();
  for (const r of rows) {
    let p = per.get(r.player);
    if (!p) { p = { member: false, name: null, f: 0 }; per.set(r.player, p); }
    if (r.user_id) p.member = true;
    if (r.username) p.name = r.username;
    p.f += 1;
  }
  const members = [...per.entries()].filter(([, p]) => p.member).sort((a, c) => c[1].f - a[1].f || (a[0] < c[0] ? -1 : 1));
  const index = new Map(members.map(([player], i) => [player, i + 1]));
  let guestPlayers = 0, guestFirsts = 0;
  for (const [, p] of per) if (!p.member) { guestPlayers += 1; guestFirsts += p.f; }

  const seen = new Set();
  const order = [], own = [];
  for (const r of rows) {
    if (!Number.isInteger(r.piece) || r.piece < 0 || r.piece >= total || seen.has(r.piece)) continue;
    seen.add(r.piece);
    order.push(r.piece);
    own.push(index.get(r.player) || 0);
  }

  const done = !!b.data.completed_at;
  return NextResponse.json({
    id, cols: b.data.cols, rows: b.data.rows, total, n: order.length,
    opens: Date.parse(b.data.opens_at),
    completed: done ? Date.parse(b.data.completed_at) : null,
    who: members.map(([, p]) => ({ n: p.name || 'Player', f: p.f })),
    guests: { players: guestPlayers, f: guestFirsts },
    order, own,
  }, {
    headers: { 'Cache-Control': done ? 'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=86400' : 'public, max-age=30, s-maxage=120, stale-while-revalidate=60' },
  });
}
