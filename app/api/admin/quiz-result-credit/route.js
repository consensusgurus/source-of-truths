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

// ilike prefilters case-insensitively but treats % and _ as wildcards, so it can
// only ever return a SUPERSET; the exact lowercase re-test is authoritative.
// Same contract as rowsNamed in /api/admin/quiz-user-rename.
async function rowsNamed(table, column, name, select) {
  const { data, error } = await supabaseAdmin.from(table).select(select).ilike(column, name);
  if (error) return { rows: null, error };
  const want = lc(name);
  return { rows: (data || []).filter((r) => lc(r[column]) === want), error: null };
}

const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);

// POST /api/admin/quiz-result-credit
//   { quizId, username, score, total, correct?, guessesUsed?, timeElapsed?, dryRun?, force? }
//
// Writes a result row on a player's behalf, for the one case that justifies it:
// they really finished the drop and a DEFECT ON OUR SIDE recorded the wrong
// thing. First use: the 2026-08-08 Mate board, where the game accepted only the
// single mating move its tree stored and scored a player's genuine, different
// checkmate as a miss (see /api/admin/quiz-result-clear).
//
// This is deliberately NOT the general fix for "my play is missing". That is
// lib/daily-credits.js (MANUAL_CREDITS), which moves the calendar and invents no
// score, and it stays the default. Reach for this route only when the score
// itself is what we got wrong, and log the reason.
//
// REFUSES BY DEFAULT IF THE PLAYER ALREADY HAS A ROW FOR THIS QUIZ. The daily
// board (scoreGame in lib/daily-combined.js) picks each player's FIRST attempt
// by lowest row id, so a row inserted after theirs is simply never chosen and
// the credit would silently do nothing. Clear the old row first
// (/api/admin/quiz-result-clear) or pass force to insert anyway.
export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) || {};
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const dryRun = body.dryRun === true;
    const force = body.force === true;

    if (!quizId || quizId.length > 120) return NextResponse.json({ error: 'quizId required' }, { status: 400 });
    if (!username || username.length > 120) return NextResponse.json({ error: 'username required' }, { status: 400 });

    const total = int(body.total, 1, 1000);
    if (total == null) return NextResponse.json({ error: 'total required (1..1000)' }, { status: 400 });
    const score = int(body.score, 0, total);
    if (score == null) return NextResponse.json({ error: 'score required (0..total)' }, { status: 400 });
    const correct = body.correct == null ? (score >= total ? 1 : 0) : int(body.correct, 0, 1000);
    const guessesUsed = body.guessesUsed == null ? 0 : int(body.guessesUsed, 0, 10000);
    const timeElapsed = body.timeElapsed == null ? 1 : int(body.timeElapsed, 1, 36000);
    if (correct == null || guessesUsed == null || timeElapsed == null) {
      return NextResponse.json({ error: 'correct/guessesUsed/timeElapsed must be non-negative integers' }, { status: 400 });
    }

    // Resolve the identity. The row must carry user_id (and the account's
    // anon_id) or the daily routes cannot key it to the player.
    const { rows: users, error: uErr } = await rowsNamed('quiz_users', 'username', username, 'id, username, anon_id');
    if (uErr) {
      console.error('quiz-result-credit users select error', uErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    if (!users || !users.length) return NextResponse.json({ error: 'no such player' }, { status: 404 });
    if (users.length > 1) {
      return NextResponse.json({ error: `ambiguous: ${users.length} accounts share that display name` }, { status: 409 });
    }
    const user = users[0];

    // Existing rows for this player on this quiz, by id and by stamped name.
    const existing = new Map();
    {
      const { data, error } = await supabaseAdmin
        .from('quiz_results').select('id, score, total, time_elapsed, created_at')
        .eq('quiz_id', quizId).eq('user_id', user.id);
      if (error) {
        console.error('quiz-result-credit existing select error', error);
        return NextResponse.json({ error: 'db error' }, { status: 500 });
      }
      for (const r of data || []) existing.set(r.id, r);
    }
    const priorRows = [...existing.values()].map((r) => ({ id: r.id, score: r.score, total: r.total, timeElapsed: r.time_elapsed, at: r.created_at }));

    const row = {
      quiz_id: quizId,
      user_id: user.id,
      username: user.username,
      score,
      total,
      time_elapsed: timeElapsed,
    };
    const preview = { ...row, anon_id: user.anon_id || null, correct_count: correct, guesses_used: guessesUsed, abandoned: false };

    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, wouldInsert: preview, priorRows, blocked: priorRows.length > 0 && !force });
    }
    if (priorRows.length && !force) {
      return NextResponse.json({
        error: 'player already has a row for this quiz; the daily board takes the FIRST attempt by row id, so this credit would be ignored. Clear the old row, or pass force.',
        priorRows,
      }, { status: 409 });
    }

    // Progressive column fallbacks, same reasoning as the attempts ladder in
    // /api/quiz/result: a database missing a migration must degrade, not 500.
    const attempts = [
      { ...row, anon_id: user.anon_id || null, correct_count: correct, guesses_used: guessesUsed, abandoned: false },
      { ...row, anon_id: user.anon_id || null, correct_count: correct, guesses_used: guessesUsed },
      { ...row, anon_id: user.anon_id || null, correct_count: correct },
      { ...row, anon_id: user.anon_id || null },
      { ...row },
    ];
    let inserted = null, lastErr = null;
    for (const attempt of attempts) {
      const { data, error } = await supabaseAdmin.from('quiz_results').insert(attempt).select('id').single();
      if (!error) { inserted = data; break; }
      lastErr = error;
    }
    if (!inserted) {
      console.error('quiz-result-credit insert error', lastErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    // The gzipped row cache keys off (count, max id) and pulls ids above its
    // newest, so an INSERT would normally be picked up. Dropped anyway so the
    // credit is visible on the very next read rather than at the next delta.
    let snapshotCleared = 0;
    try {
      const { data, error } = await dropStoredSnapshots(supabaseAdmin);
      if (error) console.error('quiz-result-credit snapshot clear error', error);
      else snapshotCleared = (data || []).length;
    } catch (e) {
      console.error('quiz-result-credit snapshot clear skipped', e?.message || e);
    }

    return NextResponse.json({ ok: true, insertedId: inserted.id, row: preview, priorRows, snapshotCleared });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
