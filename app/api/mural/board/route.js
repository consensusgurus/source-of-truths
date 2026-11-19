import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { ensureBoard, currentBoard, publicBoard } from '@/lib/mural';
import { parseMuralId, MURAL_KINDS } from '@/lib/mural-shared';

// GET /api/mural/board?id=<kind>-<YYYY-MM-DD>
//
// The board of one mural: its window, its cut and the grade of every piece.
// Made on first ask (lib/mural.js picks and grades the photo), then it never
// changes, so it is cached at the edge for a day. A mural that has not opened
// yet is a 404, and so is everything while migration 69 is not applied.

export const dynamic = 'force-dynamic';
// Without this Next keeps the Supabase reads in its data cache, and a board
// read that came back empty once stays empty.
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // ?kind=mural|muraltoo is the board open now (run until finished); ?id= is one
  // board by id (a shelf copy). Only ?id= answers are cached long: the current
  // board changes the moment the last one is finished.
  const kind = String(searchParams.get('kind') || '');
  const id = String(searchParams.get('id') || '');
  const byKind = !!MURAL_KINDS[kind];
  if (!byKind && !parseMuralId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let out;
  try { out = byKind ? await currentBoard(supabaseAdmin, kind) : await ensureBoard(supabaseAdmin, id); }
  catch (e) { console.error('mural board', e); return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
  if (!out.board) {
    return NextResponse.json({ error: 'Not open', available: !out.unavailable, why: out.why || undefined }, { status: 404, headers: { 'Cache-Control': out.why ? 'no-store' : 'public, s-maxage=30' } });
  }
  const fin = !!out.board.completed_at;
  const cache = byKind ? 'public, max-age=20, s-maxage=30' : (fin ? 'public, max-age=300, s-maxage=86400' : 'public, max-age=30, s-maxage=60');
  return NextResponse.json(publicBoard(out.board), { headers: { 'Cache-Control': cache } });
}
