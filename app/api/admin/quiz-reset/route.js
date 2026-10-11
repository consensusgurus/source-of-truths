import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Auth: the admin cookie (the /admin panel) OR an "x-admin-token" header
// matching ADMIN_TASK_TOKEN. Mirrors /api/admin/alerts.
function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  if (!expected) return false;
  return request.headers.get('x-admin-token') === expected;
}

// POST /api/admin/quiz-reset  { quizIds: string[], before?: ISO }  (or { quizId: string })
// Wipes recorded games (quiz_results) for the given quizzes, resetting their
// play count, average, and leaderboard. quiz_users identities are kept, so a
// signed-up player simply has no scores until they play again.
export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) || {};
    let quizIds = Array.isArray(body.quizIds)
      ? body.quizIds
      : (typeof body.quizId === 'string' ? [body.quizId] : []);
    quizIds = quizIds
      .filter((q) => typeof q === 'string' && q.trim())
      .map((q) => q.trim());
    if (!quizIds.length) {
      return NextResponse.json({ error: 'quizIds required' }, { status: 400 });
    }
    if (quizIds.length > 50) {
      return NextResponse.json({ error: 'too many quizIds' }, { status: 400 });
    }
    // Optional `before` (ISO timestamp): only rows filed before it are wiped,
    // so plays that landed after a rule change survive the reset.
    const before = typeof body.before === 'string' && !Number.isNaN(Date.parse(body.before)) ? new Date(body.before).toISOString() : null;
    const deleted = {};
    for (const qid of quizIds) {
      let q = supabaseAdmin
        .from('quiz_results')
        .delete()
        .eq('quiz_id', qid);
      if (before) q = q.lt('created_at', before);
      const { data, error } = await q.select('id');
      if (error) {
        console.error('quiz-reset delete error', qid, error);
        return NextResponse.json({ error: 'db error', quizId: qid }, { status: 500 });
      }
      deleted[qid] = (data || []).length;
    }
    return NextResponse.json({ ok: true, deleted, before });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
