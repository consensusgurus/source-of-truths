import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { readCrowdCode, CALL_IDX } from '@/lib/picks';
import { PUZZLES } from '@/app/picks/puzzles';

// THE CROWD ON THE DAY'S PICKS (owner, 2026-11-06). For each of the five calls,
// the share of finished players who got it right, and for the tag match the
// share who placed all three tags right. Read off first_guess, where a Picks row
// files what its player got right (lib/picks.js crowdCode). Never a price, never
// which item won: only how many players called it, which the reveal shows after
// the player's own call.

export const dynamic = 'force-dynamic';
const IDS = new Set((PUZZLES || []).map((p) => p.quizId));
const HEADERS = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const quizId = String(searchParams.get('quizId') || '');
  if (!IDS.has(quizId)) return NextResponse.json({ error: 'bad quizId' }, { status: 400 });
  try {
    const { data, error } = await supabaseAdmin.from('quiz_results').select('first_guess, abandoned').eq('quiz_id', quizId).limit(20000);
    if (error) {
      if (error.code === '42703' || error.code === 'PGRST204' || /column|schema cache/i.test(error.message || '')) return NextResponse.json({ n: 0 }, { headers: HEADERS });
      throw error;
    }
    const codes = (data || []).filter((r) => !r.abandoned).map((r) => readCrowdCode(r.first_guess)).filter(Boolean);
    const n = codes.length;
    if (!n) return NextResponse.json({ n: 0 }, { headers: HEADERS });
    const calls = CALL_IDX.map((_, k) => Math.round((codes.filter((c) => c.calls[k]).length / n) * 100));
    const tags3 = Math.round((codes.filter((c) => c.tags === 3).length / n) * 100);
    return NextResponse.json({ n, calls, tags3 }, { headers: HEADERS });
  } catch (e) {
    return NextResponse.json({ n: 0 }, { headers: HEADERS });
  }
}
