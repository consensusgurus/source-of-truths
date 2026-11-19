import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { ensureBoard, publicBoard } from '@/lib/mural';
import { parseMuralId } from '@/lib/mural-shared';

// GET /api/mural/board?id=<kind>-<YYYY-MM-DD>
//
// The board of one mural: its window, its cut and the grade of every piece.
// Made on first ask (lib/mural.js picks and grades the photo), then it never
// changes, so it is cached at the edge for a day. A mural that has not opened
// yet is a 404, and so is everything while migration 69 is not applied.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '');
  if (!parseMuralId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let out;
  try { out = await ensureBoard(supabaseAdmin, id); }
  catch (e) { console.error('mural board', e); return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
  if (!out.board) {
    return NextResponse.json({ error: 'Not open', available: !out.unavailable, why: out.why || undefined }, { status: 404, headers: { 'Cache-Control': out.why ? 'no-store' : 'public, s-maxage=30' } });
  }
  return NextResponse.json(publicBoard(out.board), { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=86400' } });
}
