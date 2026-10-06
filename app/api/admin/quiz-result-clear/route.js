import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { dropStoredSnapshots } from '@/lib/results-snapshot-store';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Auth: the admin cookie (the /admin panel) OR an "x-admin-token" header
// matching ADMIN_TASK_TOKEN. Mirrors /api/admin/quiz-reset.
function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  if (!expected) return false;
  return request.headers.get('x-admin-token') === expected;
}

const lc = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

// ilike pre-filters case-insensitively but treats % and _ as wildcards, so it
// can only ever return a SUPERSET. Every caller re-tests with an exact
// lowercase compare, which is the authoritative match. Same contract as
// rowsNamed in /api/admin/quiz-user-rename.
async function rowsNamed(table, column, name, select) {
  const { data, error } = await supabaseAdmin.from(table).select(select).ilike(column, name);
  if (error) return { rows: null, error };
  const want = lc(name);
  return { rows: (data || []).filter((r) => lc(r[column]) === want), error: null };
}

// POST /api/admin/quiz-result-clear  { quizId, username, dryRun? }
//
// Deletes ONE player's recorded games for ONE quiz, so they can replay it for a
// real score. This is the surgical counterpart to /api/admin/quiz-reset, which
// wipes a quiz for EVERY player: the case this exists for is a bug that cost one
// or two players a solve while everyone else's scores are legitimate and must
// survive (first use: the 2026-08-08 Mate board, where the game accepted only
// the one mating move its tree stored and told a player who had found a
// different, equally real checkmate that he had missed it).
//
// Rows are matched two ways, because a result row can carry the display name
// without being linked to an identity yet:
//   quiz_results.username   matched case-insensitively, like the rename route
//   quiz_results.user_id    every id whose quiz_users.username matches
// Pass dryRun to see exactly what would go before anything is deleted.
//
// The gzipped cross-instance row cache (quiz_results_snapshot) is dropped after
// a real delete: its delta check only asks for ids ABOVE its newest, so a
// deletion is invisible to it and it would keep serving the removed row. A warm
// lambda holding lib/quiz-results-cache.js in process self-heals on its next
// full reload (FULL_MS, 6h); a deploy clears it immediately.
export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) || {};
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const dryRun = body.dryRun === true;

    if (!quizId || quizId.length > 120) {
      return NextResponse.json({ error: 'quizId required' }, { status: 400 });
    }
    if (!username || username.length > 120) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    // Identity rows for this display name, so results stamped with a user_id but
    // a stale or missing username are still found.
    const { rows: users, error: uErr } = await rowsNamed('quiz_users', 'username', username, 'id, username');
    if (uErr) {
      console.error('quiz-result-clear users select error', uErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    const userIds = (users || []).map((r) => r.id);

    // Progressive column fallbacks, same reasoning as COL_TIERS in
    // lib/quiz-results-cache.js: a database that predates a migration must not
    // turn this route into a 500. correct_count is migration 24, guesses_used
    // 33, abandoned 37, so the newest drops first.
    const COLS_FULL = 'id, quiz_id, username, user_id, anon_id, score, total, correct_count, guesses_used, abandoned, time_elapsed, created_at';
    const COL_TIERS = [
      COLS_FULL,
      COLS_FULL.replace(', abandoned', ''),
      COLS_FULL.replace(', abandoned', '').replace(', guesses_used', ''),
      COLS_FULL.replace(', abandoned', '').replace(', guesses_used', '').replace(', correct_count', ''),
    ];

    const found = new Map();
    let lastErr = null;
    let gotRows = false;

    for (const cols of COL_TIERS) {
      found.clear();
      const { rows: byName, error: nErr } = await rowsNamed('quiz_results', 'username', username, cols);
      if (nErr) { lastErr = nErr; continue; }
      for (const r of byName || []) if (r.quiz_id === quizId) found.set(r.id, r);

      if (userIds.length) {
        const { data, error } = await supabaseAdmin
          .from('quiz_results')
          .select(cols)
          .eq('quiz_id', quizId)
          .in('user_id', userIds);
        if (error) { lastErr = error; continue; }
        for (const r of data || []) found.set(r.id, r);
      }
      gotRows = true;
      break;
    }
    if (!gotRows) {
      console.error('quiz-result-clear select error', lastErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    const matched = [...found.values()].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const preview = matched.map((r) => ({
      id: r.id,
      score: r.score,
      total: r.total,
      correct: r.correct_count,
      guessesUsed: r.guesses_used,
      abandoned: r.abandoned,
      timeElapsed: r.time_elapsed,
      at: r.created_at,
    }));

    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, quizId, username, matched: matched.length, rows: preview });
    }
    if (!matched.length) {
      return NextResponse.json({ ok: true, quizId, username, deleted: 0, rows: [] });
    }

    const { data: gone, error: dErr } = await supabaseAdmin
      .from('quiz_results')
      .delete()
      .in('id', matched.map((r) => r.id))
      .select('id');
    if (dErr) {
      console.error('quiz-result-clear delete error', dErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    let snapshotCleared = 0;
    try {
      const { data, error } = await dropStoredSnapshots(supabaseAdmin);
      if (error) console.error('quiz-result-clear snapshot clear error', error);
      else snapshotCleared = (data || []).length;
    } catch (e) {
      console.error('quiz-result-clear snapshot clear skipped', e?.message || e);
    }

    return NextResponse.json({
      ok: true,
      quizId,
      username,
      deleted: (gone || []).length,
      rows: preview,
      snapshotCleared,
    });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
