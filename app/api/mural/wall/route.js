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
//   who    every player, most pieces first: [{ n: name, f: firsts }], a guest
//          as { n: 'Guest 3', f, g: 1 } (owner, 2026-11-20: "do NOT group all
//          guests. group by individual identifier"), numbered by pieces
//   guests the guest count: { players, f: 0 } (f stays for old readers)
//   order  piece ids, oldest placement first
//   who[].c  ISO country code of the player, '' when unknown (owner,
//          2026-11-22: "show contributions by country"). Read from the
//          player's own play rows (quiz_results.country, set from Vercel's
//          edge geo header), the country they play from most often. No
//          migration: it works for murals already finished.
//   own    for each of those, 0 for a guest or 1 + its index in `who`
//
// A finished mural cannot change (mural_place refuses it), so its answer is
// held at the edge for a month. An open one is held for two minutes, like the
// board's own snapshot. No player id leaves the server.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PAGE = 1000;
const CODE = /^[A-Z]{2}$/;

// Each player's country: the one their play rows carry most often. One query
// per small batch of players, newest rows first; a player crowded out of a
// batch by heavier players is asked again on their own. Best effort: any
// failure leaves the country blank and never fails the wall.
async function countriesOf(players) {
  const out = new Map();
  const want = { user_id: [], anon_id: [] };
  const key = new Map();
  for (const pl of players) {
    if (typeof pl !== 'string') continue;
    if (pl.startsWith('u:')) { want.user_id.push(pl.slice(2)); key.set('user_id:' + pl.slice(2), pl); }
    else if (pl.startsWith('a:')) { want.anon_id.push(pl.slice(2)); key.set('anon_id:' + pl.slice(2), pl); }
  }
  for (const col of ['user_id', 'anon_id']) {
    let left = want[col];
    for (let pass = 0; pass < 3 && left.length; pass++) {
      const size = pass === 0 ? 20 : pass === 1 ? 4 : 1;
      const miss = [];
      for (let i = 0; i < left.length; i += size) {
        const chunk = left.slice(i, i + size);
        const r = await supabaseAdmin.from('quiz_results').select(col + ', country')
          .in(col, chunk).not('country', 'is', null)
          .order('created_at', { ascending: false }).limit(600);
        if (r.error) throw r.error;
        const tally = new Map();
        for (const row of r.data || []) {
          const c = String(row.country || '').toUpperCase();
          if (!CODE.test(c) || c === 'XX') continue;
          const id = row[col];
          let t = tally.get(id); if (!t) { t = new Map(); tally.set(id, t); }
          t.set(c, (t.get(c) || 0) + 1);
        }
        for (const id of chunk) {
          const t = tally.get(id);
          if (!t) { if ((r.data || []).length >= 600) miss.push(id); continue; }
          let best = '', n = 0;
          for (const [c, k] of t) if (k > n) { best = c; n = k; }
          out.set(key.get(col + ':' + id), best);
        }
      }
      // Only a full answer can have crowded someone out; a short one means they have no rows.
      left = miss;
    }
  }
  return out;
}

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
  const members = [...per.entries()].sort((a, c) => c[1].f - a[1].f || (a[0] < c[0] ? -1 : 1));
  const index = new Map(members.map(([player], i) => [player, i + 1]));
  let guestPlayers = 0;
  for (const [, p] of members) if (!p.member) { guestPlayers += 1; p.guestNo = guestPlayers; }

  const seen = new Set();
  const order = [], own = [];
  for (const r of rows) {
    if (!Number.isInteger(r.piece) || r.piece < 0 || r.piece >= total || seen.has(r.piece)) continue;
    seen.add(r.piece);
    order.push(r.piece);
    own.push(index.get(r.player) || 0);
  }

  let ctry = new Map();
  try { ctry = await countriesOf(members.map(([player]) => player)); } catch (e) { console.error('mural wall countries', e); }

  const done = !!b.data.completed_at;
  return NextResponse.json({
    id, cols: b.data.cols, rows: b.data.rows, total, n: order.length,
    opens: Date.parse(b.data.opens_at),
    completed: done ? Date.parse(b.data.completed_at) : null,
    who: members.map(([player, p]) => ({ ...(p.member ? { n: p.name || 'Player', f: p.f } : { n: 'Guest ' + p.guestNo, f: p.f, g: 1 }), c: ctry.get(player) || '' })),
    guests: { players: guestPlayers, f: 0 },
    order, own,
  }, {
    headers: { 'Cache-Control': done ? 'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=86400' : 'public, max-age=30, s-maxage=120, stale-while-revalidate=60' },
  });
}
