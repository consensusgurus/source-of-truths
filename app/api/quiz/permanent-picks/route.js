import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { catalogQuizzes } from '@/lib/quiz-catalog';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';

// GET /api/quiz/permanent-picks -> { geography: [pick], trivia: [pick] }
//   pick = { id, title, sub, fam, plays }
//
// "Also try our permanent quizzes:" under the daily puzzles in the home's
// Geography and Trivia panes (owner, 2026-10-16). The rows show each quiz's
// all-time play count; the all-time leader is joined on the client from the
// /api/quiz/totals read the home already makes, so it always matches the
// crown that page prints.
//
// GEOGRAPHY is the most played geography quizzes. TRIVIA is every topic that
// is not geography or math (owner, 2026-10-16): the most played quiz in each
// topic, so one topic can never fill the list, ordered by plays. Word puzzles,
// standardized tests and IQ tests are not trivia and stay out.
//
// IT IS A ROUTE because lib/quizzes.js is 4.4MB of source and StageToday is a
// client component; the payload here is seventeen rows.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' };

const GEO_N = 8;
const TRIVIA_N = 9;
const NOT_TRIVIA = new Set(['geography', 'word', 'school']);
const MATHISH = /math|arithmetic|multiplic|times-table|fraction|algebra|geometry|calculus|equation|^iq-/;

// The family decides the row's glyph and the way the row describes the play.
function famOf(q) {
  const f = q.format || '';
  if (f === 'map' || f === 'place-map' || f === 'globe' || f === 'geo-aerial' || f === 'street-map') return 'map';
  if (f === 'photo' || f === 'posters' || f === 'logos' || f === 'images' || f === 'photo-match') return 'photo';
  if (f === 'order-bank' || q.ordered) return 'order';
  if (f === 'bank' || f === 'pairs' || f === 'matched') return 'match';
  if (f === 'timed-mcq') return 'mcq';
  return 'name';
}
const FAM_WORD = { map: 'Map', photo: 'From the picture', order: 'Put in order', match: 'Match', mcq: 'Multiple choice', name: 'Name them all' };

function countOf(q) {
  if (Array.isArray(q.questions) && q.questions.length) return q.questions.length;
  if (Array.isArray(q.answers) && q.answers.length) return q.answers.length;
  if (Array.isArray(q.pairs) && q.pairs.length) return q.pairs.length;
  return 0;
}

export async function GET() {
  try {
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) return NextResponse.json({ geography: [], trivia: [] });
    const plays = {};
    for (const r of data || []) plays[r.quiz_id] = (plays[r.quiz_id] || 0) + 1;

    const geo = [];
    const bestByDept = new Map();
    for (const q of catalogQuizzes()) {
      const n = plays[q.id] || 0;
      if (!n) continue;
      const dept = quizDept(q);
      const fam = famOf(q);
      if (dept === 'geography') {
        const c = countOf(q);
        geo.push({ id: q.id, title: q.title, sub: FAM_WORD[fam] + (c ? ` · ${c} ${fam === 'mcq' ? 'questions' : 'answers'}` : ''), fam, plays: n });
        continue;
      }
      if (NOT_TRIVIA.has(dept) || MATHISH.test(q.id)) continue;
      const prev = bestByDept.get(dept);
      if (!prev || n > prev.plays) {
        bestByDept.set(dept, { id: q.id, title: q.title, sub: `${DEPT_LABEL[dept] || 'Trivia'} · ${FAM_WORD[fam]}`, fam, plays: n });
      }
    }
    const byPlays = (a, b) => b.plays - a.plays || String(a.title).localeCompare(String(b.title));
    return NextResponse.json({
      geography: geo.sort(byPlays).slice(0, GEO_N),
      trivia: [...bestByDept.values()].sort(byPlays).slice(0, TRIVIA_N),
    }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('permanent picks error', e);
    return NextResponse.json({ geography: [], trivia: [] });
  }
}
