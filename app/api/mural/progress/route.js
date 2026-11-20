import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { currentBoard, muralTableMissing } from '@/lib/mural';
import { MURAL_KINDS } from '@/lib/mural-shared';

// GET /api/mural/progress?kind=mural|muraltoo
//
// How built the open mural is, for its home tile (owner, 2026-11-20, mockup A:
// "the jigsaw fills in"). A few hundred bytes: the count, the total and the
// board shrunk to a 10 by 8 grid, each cell a digit 0 to 4 for how much of
// that part of the picture is placed. The owner's condition was that it must
// not slow the page and that the figure "can be on a short lag", so it is one
// answer for everyone, held at the edge for ten minutes and served stale while
// it is rebuilt. The home asks for it after its own data, and the tile keeps
// its drawing until (and unless) this answers.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const GC = 10;
const GR = 8;
const MISS = { 'Cache-Control': 'public, max-age=120, s-maxage=300' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const kind = String(searchParams.get('kind') || '');
  if (!MURAL_KINDS[kind]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const out = await currentBoard(supabaseAdmin, kind);
    const b = out && out.board;
    if (!b) return NextResponse.json({ error: 'Not open' }, { status: 404, headers: MISS });
    const { data, error } = await supabaseAdmin.rpc('mural_state', { p_mural: b.id });
    if (error) {
      if (!muralTableMissing(error)) console.error('mural progress', error);
      return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    const cols = Number(b.cols) || 0;
    const rows = Number(b.rows) || 0;
    const total = Number(data && data.total) || cols * rows;
    const placed = String((data && data.placed) || '');
    const n = Number(data && data.n) || 0;
    if (!total || !cols || !rows) return NextResponse.json({ error: 'Not open' }, { status: 404, headers: MISS });
    // Pieces are row-major (r * cols + c). Each grid cell is the share of its
    // block of pieces that is placed, in quarters.
    const sum = new Array(GC * GR).fill(0);
    const cnt = new Array(GC * GR).fill(0);
    for (let r = 0; r < rows; r += 1) {
      const gr = Math.min(GR - 1, Math.floor((r * GR) / rows));
      for (let c = 0; c < cols; c += 1) {
        const k = gr * GC + Math.min(GC - 1, Math.floor((c * GC) / cols));
        cnt[k] += 1;
        if (placed.charCodeAt(r * cols + c) === 49) sum[k] += 1;
      }
    }
    const cells = sum.map((s, i) => (cnt[i] ? String(Math.min(4, Math.round((s / cnt[i]) * 4))) : '0')).join('');
    return NextResponse.json({ id: b.id, n, total, pct: Math.floor((n / total) * 100), done: !!b.completed_at, gc: GC, gr: GR, cells }, {
      headers: { 'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (e) {
    console.error('mural progress', e);
    return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
