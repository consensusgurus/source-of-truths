import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { QUIZZES } from '@/lib/quizzes';
import { quizDept, DEPT_LABEL, DEPT_COLOR } from '@/lib/quiz-departments';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET /api/quiz/popular-by-category -> { cats: [{ dept, label, color, tint, id, title, href, plays }] }
//
// The single most-played LISTED quiz in each department, ordered by that quiz's
// all-time play count. Powers the "you've cleared today's dailies, try a quiz"
// suggestion block on the daily end card (DailyEndCard). Aggregating quiz_results
// is the same full-table scan /api/quiz/totals does, and popularity moves slowly,
// so the result is cached in-module for 10 minutes.

const TTL_MS = 10 * 60 * 1000;
let CACHE = { at: 0, payload: null };

const cleanTitle = (t) => (t || '').replace(/^Name (the )?/i, '').trim();
const MAX_CATS = 8; // one row per category; cap so the block stays a tidy grid

export async function GET() {
  try {
    if (CACHE.payload && Date.now() - CACHE.at < TTL_MS) {
      return NextResponse.json(CACHE.payload);
    }
    // Counted off the shared results cache (Disk IO fix, 2026-10-14). This used
    // to page the WHOLE quiz_results table by OFFSET every 10 minutes per lambda
    // just to count plays; the cache is already warm for the board, history and
    // status routes and refreshes by delta, so this costs almost no DB reads.
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    const byQuiz = {};
    if (!error) {
      for (const r of (data || [])) byQuiz[r.quiz_id] = (byQuiz[r.quiz_id] || 0) + 1;
    }
    // Most-played listed quiz per department (tie-break by title).
    const best = {}; // dept -> { id, title, href, plays }
    for (const q of (QUIZZES || [])) {
      if (!q || !q.id || q.unlisted) continue;
      const dept = quizDept(q);
      // Skip 'misc', and skip 'word' (the daily games ARE word games, so a past
      // daily Crux/Emcee is a redundant suggestion right after finishing one).
      if (!dept || dept === 'misc' || dept === 'word') continue;
      const plays = byQuiz[q.id] || 0;
      const title = q.navTitle || cleanTitle(q.title) || q.id;
      const cur = best[dept];
      if (!cur || plays > cur.plays || (plays === cur.plays && title.localeCompare(cur.title) < 0)) {
        best[dept] = { id: q.id, title, href: `/quiz/${q.id}`, plays };
      }
    }
    const cats = Object.entries(best)
      .map(([dept, b]) => ({
        dept,
        label: DEPT_LABEL[dept] || dept,
        color: (DEPT_COLOR[dept] || {}).c || '#4d6b8a',
        tint: (DEPT_COLOR[dept] || {}).t || '#dbe4ee',
        ...b,
      }))
      .sort((a, z) => z.plays - a.plays || a.label.localeCompare(z.label))
      .slice(0, MAX_CATS);

    // Bonus 9th tile so the grid fills a tidy 3x3: the most-played Geo Guesser
    // quiz NOT already picked above. Geo Guessers span several departments, so it
    // gets its own "Geo Guesser" label rather than a department badge.
    const used = new Set(cats.map((c) => c.id));
    let geo = null;
    for (const q of (QUIZZES || [])) {
      if (!q || !q.id || q.unlisted || used.has(q.id)) continue;
      if (!/geo-?guesser/i.test(q.id) && !/geo\s*guesser/i.test(q.title || '')) continue;
      const plays = byQuiz[q.id] || 0;
      const title = q.navTitle || cleanTitle(q.title) || q.id;
      if (!geo || plays > geo.plays || (plays === geo.plays && title.localeCompare(geo.title) < 0)) {
        geo = { dept: 'geoguesser', label: 'Geo Guesser', color: '#1f7a8c', tint: '#d4e9ee', id: q.id, title, href: `/quiz/${q.id}`, plays };
      }
    }
    const payload = { cats: geo ? [...cats, geo] : cats };
    // Only cache a genuinely populated result so a transient read error doesn't
    // pin an empty block for 10 minutes.
    if (cats.length) CACHE = { at: Date.now(), payload };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ cats: [] });
  }
}
