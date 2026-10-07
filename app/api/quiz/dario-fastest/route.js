import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET /api/quiz/dario-fastest -> { rows: [{ name, tenths, quizId }] }
//
// Dario's master list: the fastest FULL CLEARS ever posted, one row per
// registered player (their best), across every day's remix. A clear posts
// score 10 of 10 and its run time in tenths of a second as guesses_used (see
// lib/dario-engine.js), which is what this sorts on. Guests are left off, as on
// every named board. Cached briefly at the edge.
const LIMIT = 15;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('quiz_results')
      .select('user_id, username, score, total, guesses_used, quiz_id')
      .like('quiz_id', 'dario-%')
      .gte('score', 10)
      .not('guesses_used', 'is', null)
      .not('user_id', 'is', null)
      .order('guesses_used', { ascending: true })
      .limit(500);
    if (error) throw error;
    const seen = new Set();
    const rows = [];
    for (const r of data || []) {
      if (!r.username || !r.user_id || seen.has(r.user_id)) continue;
      if (r.total && r.score < r.total) continue;
      seen.add(r.user_id);
      rows.push({ name: r.username, tenths: Number(r.guesses_used), quizId: r.quiz_id });
      if (rows.length >= LIMIT) break;
    }
    return NextResponse.json({ rows }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
  } catch (e) {
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
