import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { dropStoredSnapshots } from '@/lib/results-snapshot-store';
import { PUZZLES } from '@/app/thread/puzzles';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 120;

// POST /api/admin/thread-rescore  { dryRun? }
//
// One-off repair for the Thread bonus inversion (2026-09-01 to 2026-10-14).
// The client paid +6 for a thread called with FEW films open and +2 for one
// called with MANY open, the reverse of the rules. Fixed in 2dda09c18. This
// recomputes every stored Thread row IN PLACE (id and created_at untouched, so
// first-attempt order and the day freeze are unaffected).
//
// Each row classifies itself, so no cutoff time is needed and a row posted by
// the fixed client is never touched:
//   bonus = score - correct_count     (the thread part of the score)
//   progress = films open at the right call (summed over both calls on Sunday)
// If the bonus matches the OLD rule at that progress and not the new one, the
// row is rescored to correct_count + new bonus. Sundays carry two calls folded
// into one progress figure, so every split of it consistent with the old
// bonus is tried; the row is rescored only if every split agrees on the new
// score, otherwise it is reported and left alone.
//
// Auth: admin cookie or x-admin-token (ADMIN_TASK_TOKEN). Run dryRun first.

function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  if (!expected) return false;
  return request.headers.get('x-admin-token') === expected;
}

const oldBonus = (open, n) => (open <= Math.floor(n / 3) ? 6 : open <= Math.floor(2 * n / 3) ? 4 : 2);
const newBonus = (open, n) => (open > Math.floor(2 * n / 3) ? 6 : open > Math.floor(n / 3) ? 4 : 2);

// Every multiset of call opens (one per right call, at most `nth`) summing to
// `prog`, each 0..n.
function splits(prog, n, nth) {
  const out = [];
  if (prog >= 0 && prog <= n) out.push([prog]);
  if (nth >= 2) for (let a = 0; a <= n; a++) { const b = prog - a; if (b >= a && b <= n) out.push([a, b]); }
  return out;
}

export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) || {};
  const dryRun = body.dryRun !== false;
  const byQuiz = new Map(PUZZLES.map((p) => [p.quizId, p]));

  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from('quiz_results')
      .select('id, quiz_id, username, score, total, correct_count, progress, abandoned, created_at')
      .like('quiz_id', 'thread-%').order('id', { ascending: true }).range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  const changes = [], skipped = [], tally = { rows: rows.length, unchanged: 0, noThread: 0, alreadyNew: 0, rescored: 0, skipped: 0 };
  for (const r of rows) {
    const p = byQuiz.get(r.quiz_id);
    const why = (reason) => { tally.skipped++; skipped.push({ id: r.id, quiz: r.quiz_id, user: r.username, score: r.score, correct: r.correct_count, progress: r.progress, reason }); };
    if (!p) { why('quiz not in bank'); continue; }
    if (!Number.isInteger(r.correct_count) || !Number.isInteger(r.score)) { why('no correct_count'); continue; }
    const n = p.tiles.length, nth = p.threads.length;
    const bonus = r.score - r.correct_count;
    if (bonus === 0) { tally.noThread++; continue; }
    if (!Number.isInteger(r.progress)) { why('no progress'); continue; }
    const sp = splits(r.progress, n, nth);
    const oldFit = sp.filter((s) => s.reduce((t, o) => t + oldBonus(o, n), 0) === bonus);
    const newFit = sp.filter((s) => s.reduce((t, o) => t + newBonus(o, n), 0) === bonus);
    if (!oldFit.length && newFit.length) { tally.alreadyNew++; continue; }
    if (!oldFit.length) { why(`bonus ${bonus} fits neither rule`); continue; }
    const targets = [...new Set(oldFit.map((s) => r.correct_count + s.reduce((t, o) => t + newBonus(o, n), 0)))];
    if (targets.length !== 1) { why(`ambiguous Sunday split, could be ${targets.join(' or ')}`); continue; }
    if (newFit.length && targets[0] !== r.score) { why('fits both rules with different results'); continue; }
    if (targets[0] === r.score) { tally.unchanged++; continue; }
    changes.push({ id: r.id, quiz: r.quiz_id, user: r.username, from: r.score, to: targets[0], total: r.total, progress: r.progress, abandoned: !!r.abandoned });
  }

  if (!dryRun) {
    for (const c of changes) {
      const { error } = await supabaseAdmin.from('quiz_results').update({ score: c.to }).eq('id', c.id).eq('score', c.from);
      if (error) return NextResponse.json({ error: error.message, done: tally.rescored, changes }, { status: 500 });
      tally.rescored++;
    }
    if (changes.length) await dropStoredSnapshots(supabaseAdmin);
  }
  return NextResponse.json({ dryRun, tally, changes, skipped });
}
