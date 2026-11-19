import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralPlayer } from '@/lib/mural';
import { parseMuralId } from '@/lib/mural-shared';

// POST /api/mural/credit { id, anonId, email? }
//
// Files the player's running Mural total for the Eastern day as a daily result
// NOW (mural_credit() with p_force, migration 70). The place route files one at
// most every ten minutes; the page calls this when the player goes idle or
// leaves, so the tail of a session always reaches the day's board. It writes
// nothing unless the total has grown since the last row.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function POST(request) {
  let body = null;
  try { body = JSON.parse(await request.text()); } catch (e) { body = null; }
  const id = str(body && body.id, 40);
  if (!parseMuralId(id)) return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  const anon = str(body.anonId, 64) || null;
  const who = await muralPlayer(supabaseAdmin, { anonId: anon, email: str(body.email) || null });
  if (!who) return NextResponse.json({ error: 'No player' }, { status: 400, headers: NO_STORE });
  const { data, error } = await supabaseAdmin.rpc('mural_credit', {
    p_mural: id, p_player: who.player, p_user: who.userId, p_name: who.name, p_anon: anon, p_force: true,
  });
  if (error) { console.error('mural credit', error); return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE }); }
  return NextResponse.json(data || {}, { headers: NO_STORE });
}
