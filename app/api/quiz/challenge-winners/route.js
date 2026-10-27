import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchAllRows } from '@/lib/fetch-all';
import { challengeMenu, getChallenge, challengeQuizIds } from '@/lib/challenges';
import { correctAnswersOf } from '@/lib/quiz-scoring';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Viewer-independent answer, so the CDN may hold it briefly (Vercel cost fix,
// 2026-10-27): repeat reads within the window never start a function.
const EDGE = { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' };


// GET /api/quiz/challenge-winners
// The #1 finisher of EVERY challenge in the selector menu (the recent daily
// challenges plus the static events), computed with the same best/first-attempt
// rules as /api/quiz/challenge-leaderboard, but in ONE quiz_results read shared
// across all the windows. Powers the Stat Hub's Winners' Circle view.
export async function GET() {
  try {
    const menu = challengeMenu();
    const items = menu.map((it) => ({ it, ch: getChallenge(it.id) })).filter((x) => x.ch);
    const allQuizIds = [...new Set(items.flatMap(({ ch }) => challengeQuizIds(ch)))];
    if (!allQuizIds.length) return NextResponse.json({ winners: [] });
    const { data, error } = await fetchAllRows(
      supabaseAdmin,
      'quiz_results',
      'id, quiz_id, user_id, username, score, time_elapsed, created_at',
      ['id'],
      (q) => q.in('quiz_id', allQuizIds).not('user_id', 'is', null),
    );
    if (error) {
      console.error('challenge-winners error', error);
      return NextResponse.json({ winners: [] });
    }
    const rows = data || [];
    const now = Date.now();
    const winners = items.map(({ it, ch }) => {
      const quizSet = new Set(challengeQuizIds(ch));
      const sinceMs = Date.parse(ch.since);
      const untilMs = ch.until ? Date.parse(ch.until) : null;
      const firstOnly = !!ch.firstAttemptOnly;
      const best = new Map();      // `${user}::${quiz}` -> best/first attempt
      const nameById = new Map();
      const nameRowId = new Map();
      for (const r of rows) {
        if (!quizSet.has(r.quiz_id)) continue;
        const t = Date.parse(r.created_at);
        if (!Number.isFinite(t) || t < sinceMs || (untilMs != null && t > untilMs)) continue;
        const uid = r.user_id;
        const sc = Number(r.score) || 0;
        const co = correctAnswersOf(r);
        const tm = Number.isFinite(Number(r.time_elapsed)) ? Number(r.time_elapsed) : Infinity;
        const k = `${uid}::${r.quiz_id}`;
        const cur = best.get(k);
        if (firstOnly) {
          if (!cur || t < cur.ct) best.set(k, { score: sc, correct: co, time: tm, ct: t });
        } else if (!cur || sc > cur.score || (sc === cur.score && tm < cur.time)) {
          best.set(k, { score: sc, correct: co, time: tm, ct: t });
        }
        const rid = r.id || 0;
        if (rid >= (nameRowId.get(uid) || -1)) { nameRowId.set(uid, rid); nameById.set(uid, r.username || 'Player'); }
      }
      const byUser = new Map();
      for (const [k, v] of best) {
        const uid = k.slice(0, k.indexOf('::'));
        let u = byUser.get(uid);
        if (!u) { u = { username: nameById.get(uid) || 'Player', totalCorrect: 0, totalTime: 0, quizzesPlayed: 0 }; byUser.set(uid, u); }
        u.totalCorrect += v.correct;
        u.totalTime += Number.isFinite(v.time) ? v.time : 0;
        u.quizzesPlayed += 1;
      }
      const ranked = [...byUser.values()].sort(
        (a, b) => b.totalCorrect - a.totalCorrect || a.totalTime - b.totalTime || (a.username || '').localeCompare(b.username || ''),
      );
      const closed = untilMs != null && untilMs <= now;
      return {
        id: ch.id,
        daily: !!it.daily,
        date: it.date || '',
        label: it.label,
        title: it.title || ch.title,
        closed,
        players: ranked.length,
        winner: ranked.length ? ranked[0] : null,
      };
    });
    return NextResponse.json({ generatedAt: new Date().toISOString(), winners }, { headers: EDGE });
  } catch (e) {
    console.error('challenge-winners exception', e);
    return NextResponse.json({ winners: [] });
  }
}
