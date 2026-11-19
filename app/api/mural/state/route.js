import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralTableMissing } from '@/lib/mural';
import { parseMuralId } from '@/lib/mural-shared';

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
  return NextResponse.json({ ...(data || {}), at: Date.now() }, {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=60' },
  });
}
