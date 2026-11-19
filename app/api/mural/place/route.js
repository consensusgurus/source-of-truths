import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralPlayer } from '@/lib/mural';
import { parseMuralId } from '@/lib/mural-shared';

// POST /api/mural/place { id, piece, anonId, email? }
//
// One placement. mural_place() (migration 69) settles it in one call: whether
// this player is the first on the site to place the piece, and what it is
// worth at this moment. The answer is { points, first, dup }; `dup` means this
// player had already placed the piece and nothing changed.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function POST(request) {
  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const id = str(body && body.id, 40);
  const piece = Number(body && body.piece);
  if (!parseMuralId(id) || !Number.isInteger(piece) || piece < 0) return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  const who = await muralPlayer(supabaseAdmin, { anonId: str(body.anonId, 64) || null, email: str(body.email) || null });
  if (!who) return NextResponse.json({ error: 'No player' }, { status: 400, headers: NO_STORE });
  const { data, error } = await supabaseAdmin.rpc('mural_place', {
    p_mural: id, p_piece: piece, p_player: who.player, p_user: who.userId, p_name: who.name,
  });
  if (error) { console.error('mural place', error); return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE }); }
  if (data && data.error) return NextResponse.json({ error: data.error }, { status: data.error === 'closed' ? 409 : 400, headers: NO_STORE });
  return NextResponse.json(data || {}, { headers: NO_STORE });
}
