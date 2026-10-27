import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchAllRows } from '@/lib/fetch-all';
import { getChallenge, challengeQuizIds, DEFAULT_CHALLENGE_ID } from '@/lib/challenges';
import { correctAnswersOf } from '@/lib/quiz-scoring';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Viewer-independent answer, so the CDN may hold it briefly (Vercel cost fix,
// 2026-10-27): repeat reads within the window never start a function.
const EDGE = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };


// GET /api/quiz/challenge-leaderboard?id=<challengeId>
// Public read. For the named challenge (default if absent), returns every
// REGISTERED player's BEST attempt per quiz (highest score, tie -> fastest
// time) across the challenge's quizzes since its `since` window, plus total
// correct and total time. Sorted by total correct desc, then total time asc.
//
// Reads quiz_results with the service-role client SERVER-SIDE only (the key is
// never exposed). Mirrors the public /api/quiz/board and /api/quiz/totals.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || DEFAULT_CHALLENGE_ID;
  const ch = getChallenge(id);
  if (!ch) return NextResponse.json({ error: 'unknown challenge' }, { status: 404 });

  const quizIds = challengeQuizIds(ch);
  const sinceMs = Date.parse(ch.since);
  const untilMs = ch.until ? Date.parse(ch.until) : null;
  const firstOnly = !!ch.firstAttemptOnly;

  try {
    const { data, error } = await fetchAllRows(
      supabaseAdmin,
      'quiz_results',
      'id, quiz_id, user_id, username, score, time_elapsed, created_at',
      ['id'],
      (q) => q.in('quiz_id', quizIds).not('user_id', 'is', null),
    );
    if (error) {
      console.error('challenge-leaderboard error', error);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    const rows = (data || []).filter((r) => {
      const t = Date.parse(r.created_at);
      return Number.isFinite(t) && t >= sinceMs && (untilMs == null || t <= untilMs);
    });

    const best = new Map();      // `${user}::${quiz}` -> { score, time }
    const nameById = new Map();
    const nameRowId = new Map();
    for (const r of rows) {
      const uid = r.user_id;
      const sc = Number(r.score) || 0;
      const co = correctAnswersOf(r); // points-quiz aware (timed-mcq -> estimated correct count)
      const tm = Number.isFinite(Number(r.time_elapsed)) ? Number(r.time_elapsed) : Infinity;
      const k = `${uid}::${r.quiz_id}`;
      const cur = best.get(k);
      if (firstOnly) {
        const ctn = Date.parse(r.created_at);
        const ct = Number.isFinite(ctn) ? ctn : Infinity;
        if (!cur || ct < cur.ct) best.set(k, { score: sc, correct: co, time: tm, ct });
      } else if (!cur || sc > cur.score || (sc === cur.score && tm < cur.time)) {
        best.set(k, { score: sc, correct: co, time: tm });
      }
      const rid = r.id || 0;
      if (rid >= (nameRowId.get(uid) || -1)) { nameRowId.set(uid, rid); nameById.set(uid, r.username || 'Player'); }
    }

    const byUser = new Map();
    for (const [k, v] of best) {
      const sep = k.indexOf('::');
      const uid = k.slice(0, sep);
      const quizId = k.slice(sep + 2);
      let u = byUser.get(uid);
      if (!u) { u = { userKey: 'u:' + uid, username: nameById.get(uid) || 'Player', scores: {}, times: {}, totalCorrect: 0, totalTime: 0, quizzesPlayed: 0 }; byUser.set(uid, u); }
      u.scores[quizId] = v.correct;
      u.times[quizId] = Number.isFinite(v.time) ? v.time : 0;
      u.totalCorrect += v.correct;
      u.totalTime += Number.isFinite(v.time) ? v.time : 0;
      u.quizzesPlayed += 1;
    }

    const users = [...byUser.values()].sort(
      (a, b) => b.totalCorrect - a.totalCorrect || a.totalTime - b.totalTime || (a.username || '').localeCompare(b.username || ''),
    );

    return NextResponse.json({
      challengeId: ch.id,
      generatedAt: new Date().toISOString(),
      since: ch.since,
      until: ch.until || null,
      totalRegisteredPlayers: users.length,
      users,
    }, { headers: EDGE });
  } catch (e) {
    console.error('challenge-leaderboard exception', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
