import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralPlayer } from '@/lib/mural';
import { parseMuralId } from '@/lib/mural-shared';

// GET /api/mural/me?id=<mural id>&anonId=&email=
// My own copy of a mural: the pieces I have placed, my points, firsts and place.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '');
  if (!parseMuralId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const who = await muralPlayer(supabaseAdmin, { anonId: str(searchParams.get('anonId'), 64) || null, email: str(searchParams.get('email')) || null });
  if (!who) return NextResponse.json({ pieces: [], points: 0, firsts: 0, rank: null, name: null }, { headers: NO_STORE });
  const { data, error } = await supabaseAdmin.rpc('mural_me', { p_mural: id, p_player: who.player });
  if (error) return NextResponse.json({ pieces: [], points: 0, firsts: 0, rank: null, name: who.name, error: 'Unavailable' }, { status: 503, headers: NO_STORE });
  return NextResponse.json({ ...(data || {}), name: who.name, player: who.player }, { headers: NO_STORE });
}
