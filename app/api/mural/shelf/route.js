import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { MURAL_KINDS, muralDateLabel } from '@/lib/mural-shared';

// GET /api/mural/shelf
//
// The murals the Jigsaw Puzzle Shelf may offer: every one that is complete or
// has closed, newest first (mural_shelf(), migration 70). A finished mural is
// built alone there, with no points and nothing saved to the server.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { data, error } = await supabaseAdmin.rpc('mural_shelf');
  if (error) { console.error('mural shelf', error); return NextResponse.json({ murals: [] }, { headers: { 'Cache-Control': 'no-store' } }); }
  const murals = (Array.isArray(data) ? data : []).map((b) => ({
    id: b.id,
    kind: b.kind,
    name: (MURAL_KINDS[b.kind] || {}).name || 'Mural',
    route: (MURAL_KINDS[b.kind] || {}).route || '/mural',
    date: muralDateLabel(b.id),
    title: b.name || null,
    by: b.by || null,
    lic: b.lic || null,
    placed: Number(b.placed) || 0,
    complete: !!b.completed_at,
  }));
  return NextResponse.json({ murals }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=300' } });
}
