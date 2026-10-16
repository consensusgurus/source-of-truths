import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { resolvePlayerKeys } from '@/lib/quiz-identity';
import { catalogQuizzes } from '@/lib/quiz-catalog';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';

// GET /api/quiz/next-quiz?dept=geography|travel&anonId=&email=
//   -> { quiz: { id, title, dept, label, href, plays } | null }
//
// THE QUIZ AFTER THE DAILIES (owner, 2026-10-16). Geography and Trivia carry a
// handful of dailies but as many as a hundred catalog quizzes each, so once a
// player has finished every daily in that category the end card's Play similar
// slot hands them the MOST PLAYED catalog quiz in the matching department that
// THIS player has not played yet (for most geography players: Europe, no
// borders). Read by app/useNextUnplayed.js; nothing else needs it.
//
// `dept` is TIERS separated by `|`, each a comma list of departments pooled
// together: the first tier with an unplayed quiz wins, and inside a tier the
// most played quiz across all its departments wins. So a Sports daily asks
// `sports|movies,music,...` and a general Trivia daily one pooled tier.
//
// Popularity is all-time plays off the shared results cache (no extra DB read,
// same source as /api/quiz/popular-by-category). "Played" is any row of this
// player's on the quiz id OR its -typed twin, abandoned rows included: a quiz
// they walked out of is not a fresh suggestion either.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const cleanTitle = (t) => (t || '').replace(/^Name (the )?/i, '').trim();
const base = (id) => String(id || '').replace(/-typed$/, '');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const tiers = (searchParams.get('dept') || '').split('|')
    .map((t) => t.split(',').map((s) => s.trim()).filter((d) => d && d !== 'misc' && d !== 'word'))
    .filter((t) => t.length);
  const depts = tiers.flat();
  const none = { quiz: null };
  const hdr = { headers: { 'Cache-Control': 'private, no-store' } };
  if (!depts.length) return NextResponse.json(none, hdr);
  try {
    let myKeys = new Set();
    if (anonId || email) {
      try { myKeys = (await resolvePlayerKeys(supabaseAdmin, { email, anonId })).keys || new Set(); }
      catch (e) { if (anonId) myKeys = new Set([`a:${anonId}`]); }
    }
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) return NextResponse.json(none, hdr);

    // Only the departments asked for, so the walk below counts a few hundred ids.
    const want = new Set(depts);
    const pool = new Map(); // id -> { q, dept }
    for (const q of catalogQuizzes()) {
      const dept = quizDept(q);
      if (want.has(dept)) pool.set(q.id, { q, dept });
    }
    if (!pool.size) return NextResponse.json(none, hdr);

    const plays = {};
    const mine = new Set();
    for (const r of (data || [])) {
      if (!r || !pool.has(r.quiz_id)) continue;
      plays[r.quiz_id] = (plays[r.quiz_id] || 0) + 1;
      if (myKeys.size && ((r.user_id && myKeys.has(`u:${r.user_id}`)) || (r.anon_id && myKeys.has(`a:${r.anon_id}`)))) {
        mine.add(base(r.quiz_id));
      }
    }

    for (const tier of tiers) {
      let best = null;
      for (const [id, e] of pool) {
        if (!tier.includes(e.dept) || mine.has(base(id))) continue;
        const n = plays[id] || 0;
        const title = e.q.navTitle || cleanTitle(e.q.title) || id;
        if (!best || n > best.plays || (n === best.plays && title.localeCompare(best.title) < 0)) {
          best = { id, title, dept: e.dept, label: DEPT_LABEL[e.dept] || e.dept, href: `/quiz/${id}`, plays: n };
        }
      }
      if (best) return NextResponse.json({ quiz: best }, hdr);
    }
    return NextResponse.json(none, hdr);
  } catch (e) {
    return NextResponse.json(none, hdr);
  }
}
