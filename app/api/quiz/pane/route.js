import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { catalogQuizzes } from '@/lib/quiz-catalog';
import { quizDept, DEPT_LABEL, DEPT_COLOR } from '@/lib/quiz-departments';
import { easternYmd } from '@/lib/challenges';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET /api/quiz/pane -> {
//   quizzes, plays,                       catalogue size and its all-time plays
//   top:    [{ id, title, dept, label, plays }]            the Most played tiles
//   topics: [{ id, label, color, count, plays, today,
//              top: [{ id, title, plays }] }]               By category, most played first
//   at:     ISO time the figures were counted
// }
//
// The home's Quizzes pane (app/today/StageToday.jsx, owner 2026-10-16). One
// small payload, so the pane never pulls the 1.4MB /api/quiz/stats or counts
// anything in the browser.
//
// PLAY COUNTS ARE CACHED FOR AN HOUR, at two layers, because they move slowly
// and the owner asked that they not be re-pulled on every load:
//   - in-module (TTL_MS), so a warm lambda counts at most once an hour;
//   - at the CDN (s-maxage=3600), so most visitors never reach a lambda at all.
// The count reads the shared results cache (lib/quiz-results-cache), the same one
// the board and stats routes keep warm, so even a miss is a delta read rather than
// a table scan.
//
// THE CATALOGUE IS catalogQuizzes(), the set the sitemap and /quizzes/all derive
// from, and quizDept is the one department map, so every quiz counted here is a
// quiz a reader can open and file under the topic the index files it under.
//
// MOST PLAYED TAKES AT MOST TWO PER TOPIC (TOP_PER_DEPT). Geography's map quizzes
// hold roughly four fifths of all quiz plays, so a straight ranking is eight map
// quizzes and tells a reader nothing about the rest of the catalogue.

const TTL_MS = 60 * 60 * 1000;
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' };
const TOP_N = 12;
const TOP_PER_DEPT = 2;
const PER_TOPIC = 4;
let CACHE = { at: 0, payload: null };

export async function GET() {
  try {
    if (CACHE.payload && Date.now() - CACHE.at < TTL_MS) {
      return NextResponse.json(CACHE.payload, { headers: CACHE_HEADERS });
    }
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    const plays = new Map();
    const today = new Map();
    if (!error) {
      const ymd = easternYmd();
      // Only rows from the last ~26 hours can be "today" in Eastern, so the
      // date formatting (the expensive part) runs on a few thousand rows rather
      // than every row in the table.
      const near = Date.now() - 26 * 60 * 60 * 1000;
      for (const r of (data || [])) {
        const id = r.quiz_id;
        if (!id) continue;
        plays.set(id, (plays.get(id) || 0) + 1);
        const t = r.created_at ? Date.parse(r.created_at) : 0;
        if (t >= near && easternYmd(new Date(t)) === ymd) today.set(id, (today.get(id) || 0) + 1);
      }
    }

    const byDept = new Map();
    const all = [];
    for (const q of catalogQuizzes()) {
      const dept = quizDept(q);
      if (!dept) continue;
      const row = { id: q.id, title: q.title, dept, plays: plays.get(q.id) || 0, today: today.get(q.id) || 0 };
      all.push(row);
      if (!byDept.has(dept)) byDept.set(dept, []);
      byDept.get(dept).push(row);
    }
    const order = (a, b) => b.plays - a.plays || String(a.title).localeCompare(String(b.title));

    const perDept = new Map();
    const top = [];
    for (const r of all.slice().sort(order)) {
      if (top.length >= TOP_N) break;
      if (!r.plays) break;
      const n = perDept.get(r.dept) || 0;
      if (n >= TOP_PER_DEPT) continue;
      perDept.set(r.dept, n + 1);
      top.push({ id: r.id, title: r.title, dept: r.dept, label: DEPT_LABEL[r.dept] || r.dept, plays: r.plays });
    }

    const topics = [...byDept.entries()].map(([id, rows]) => ({
      id,
      label: DEPT_LABEL[id] || id,
      color: (DEPT_COLOR[id] || {}).c || '#4d6b8a',
      count: rows.length,
      plays: rows.reduce((a, r) => a + r.plays, 0),
      today: rows.reduce((a, r) => a + r.today, 0),
      top: rows.slice().sort(order).slice(0, PER_TOPIC).map((r) => ({ id: r.id, title: r.title, plays: r.plays })),
    })).sort((a, b) => b.plays - a.plays || a.label.localeCompare(b.label));

    const payload = {
      quizzes: all.length,
      plays: all.reduce((a, r) => a + r.plays, 0),
      top,
      topics,
      at: new Date().toISOString(),
    };
    // Cache only a counted result, so a transient read error never pins a pane
    // full of zeroes for an hour.
    if (!error && payload.plays > 0) CACHE = { at: Date.now(), payload };
    return NextResponse.json(payload, { headers: error ? { 'Cache-Control': 'no-store' } : CACHE_HEADERS });
  } catch (e) {
    console.error('quiz pane error', e);
    return NextResponse.json({ quizzes: 0, plays: 0, top: [], topics: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
