import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET /api/quiz/blocks-best -> { rows: [{ name, score, shapes, quizId, day }] }
//
// Blocks' ALL-TIME board (owner, 2026-10-10): the best single run on any day,
// one row per registered player, ranked on rows cleared and then on fewest
// shapes used, the same order a day's board uses. Guests are left off, as on
// every named board. Runs from before the four-row bonus (2026-10-11) count at
// the score they posted. Cached briefly at the edge.
const LIMIT = 15;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayOf(quizId) {
  const m = /^blocks-(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(String(quizId || ''));
  if (!m) return null;
  return `${MON[Number(m[1]) - 1] || ''} ${Number(m[2])}`;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('quiz_results')
      .select('user_id, username, score, guesses_used, quiz_id')
      .like('quiz_id', 'blocks-%')
      .gt('score', 0)
      .not('user_id', 'is', null)
      .order('score', { ascending: false })
      .order('guesses_used', { ascending: true })
      .limit(800);
    if (error) throw error;
    const seen = new Set();
    const rows = [];
    for (const r of data || []) {
      if (!r.username || !r.user_id || seen.has(r.user_id)) continue;
      seen.add(r.user_id);
      rows.push({ name: r.username, score: Number(r.score), shapes: r.guesses_used == null ? null : Number(r.guesses_used), quizId: r.quiz_id, day: dayOf(r.quiz_id) });
      if (rows.length >= LIMIT) break;
    }
    return NextResponse.json({ rows }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (e) {
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
