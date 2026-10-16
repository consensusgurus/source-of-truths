import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { catalogQuizzes } from '@/lib/quiz-catalog';
import { quizDept, DEPT_LABEL, DEPT_COLOR } from '@/lib/quiz-departments';
import { QUIZ_HEROES, DEPT_HERO } from '@/lib/quiz-heroes';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET /api/quiz/pane -> {
//   quizzes, plays,                       catalogue size and its all-time plays
//   banners: [{ id, title, dept, label, plays, img, pos, kind }]   the two photo banners
//   top:    [{ id, title, dept, label, plays, img?, pos? }]  the Most played tiles
//   topics: [{ id, label, color, count, plays, img?, pos?,
//              top: [{ id, title, plays }] }]               By category, most played first
//   pm:     { quizId: plays }      every played quiz, for a topic list sorted by plays
//   at:     ISO time the figures were counted
// }
//
// PHOTOS (owner, 2026-10-16: "picture header heroes where available"). A tile
// carries its quiz's OWN registry hero only, so a tile never wears a photo of a
// different quiz; a topic card takes its most-played quiz that has one, else the
// department photo (DEPT_HERO). Both are routed through /_next/image by the
// client, so a 1280px original is never what a 300px tile downloads.
//
// The home's Quizzes pane (app/today/StageToday.jsx, owner 2026-10-16). It is
// also the WHOLE quiz home since /quizzes became a redirect to it. One
// small payload, so the pane never pulls the 1.4MB /api/quiz/stats or counts
// anything in the browser.
//
// PLAY COUNTS ARE CACHED FOR A DAY (owner, 2026-10-16: quizzes are not played
// much, so a daily figure is plenty), at two layers:
//   - in-module (TTL_MS), so a warm lambda counts at most once a day;
//   - at the CDN (s-maxage=86400), so most visitors never reach a lambda at all.
// There is deliberately no "plays today" figure: a once-a-day count cannot say it.
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

const TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' };
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
    if (!error) {
      for (const r of (data || [])) {
        if (r.quiz_id) plays.set(r.quiz_id, (plays.get(r.quiz_id) || 0) + 1);
      }
    }

    const byDept = new Map();
    const all = [];
    for (const q of catalogQuizzes()) {
      const dept = quizDept(q);
      if (!dept) continue;
      const row = { id: q.id, title: q.title, dept, plays: plays.get(q.id) || 0, at: Date.parse(q.publishedAt || q.publishedDate || '') || 0 };
      all.push(row);
      if (!byDept.has(dept)) byDept.set(dept, []);
      byDept.get(dept).push(row);
    }
    const order = (a, b) => b.plays - a.plays || String(a.title).localeCompare(String(b.title));

    const hero = (id) => {
      const h = QUIZ_HEROES[id];
      return h && h.src ? { img: h.src, pos: h.pos || null } : null;
    };

    const perDept = new Map();
    const top = [];
    for (const r of all.slice().sort(order)) {
      if (top.length >= TOP_N) break;
      if (!r.plays) break;
      const n = perDept.get(r.dept) || 0;
      if (n >= TOP_PER_DEPT) continue;
      perDept.set(r.dept, n + 1);
      top.push({ id: r.id, title: r.title, dept: r.dept, label: DEPT_LABEL[r.dept] || r.dept, plays: r.plays, ...(hero(r.id) || {}) });
    }

    // THE TWO BANNERS carried over from the old /quizzes page: the most played
    // quiz that has a photo, and the newest Geo Guesser with a photo of its own
    // that is not the same picture.
    const banners = [];
    const lead = all.slice().sort(order).find((r) => r.plays && hero(r.id));
    if (lead) banners.push({ kind: 'Most played', id: lead.id, title: lead.title, dept: lead.dept, label: DEPT_LABEL[lead.dept] || lead.dept, plays: lead.plays, ...hero(lead.id) });
    const geo = all.slice().sort((a, b) => b.at - a.at)
      .find((r) => /geo guesser/i.test(r.title) && hero(r.id) && (!lead || hero(r.id).img !== hero(lead.id).img) && (!lead || r.id !== lead.id));
    if (geo) banners.push({ kind: 'Geo Guesser', id: geo.id, title: geo.title, dept: geo.dept, label: DEPT_LABEL[geo.dept] || geo.dept, plays: geo.plays, ...hero(geo.id) });

    const pm = {};
    for (const r of all) if (r.plays) pm[r.id] = r.plays;

    const topics = [...byDept.entries()].map(([id, rows]) => ({
      id,
      ...((rows.slice().sort(order).map((r) => hero(r.id)).find(Boolean)) || (DEPT_HERO[id] ? { img: DEPT_HERO[id], pos: null } : {})),
      label: DEPT_LABEL[id] || id,
      color: (DEPT_COLOR[id] || {}).c || '#4d6b8a',
      count: rows.length,
      plays: rows.reduce((a, r) => a + r.plays, 0),
      top: rows.slice().sort(order).slice(0, PER_TOPIC).map((r) => ({ id: r.id, title: r.title, plays: r.plays })),
    })).sort((a, b) => b.plays - a.plays || a.label.localeCompare(b.label));

    const payload = {
      quizzes: all.length,
      plays: all.reduce((a, r) => a + r.plays, 0),
      banners,
      top,
      topics,
      pm,
      at: new Date().toISOString(),
    };
    // Cache only a counted result, so a transient read error never pins a pane
    // full of zeroes for a day.
    if (!error && payload.plays > 0) CACHE = { at: Date.now(), payload };
    return NextResponse.json(payload, { headers: error ? { 'Cache-Control': 'no-store' } : CACHE_HEADERS });
  } catch (e) {
    console.error('quiz pane error', e);
    return NextResponse.json({ quizzes: 0, plays: 0, banners: [], top: [], topics: [], pm: {} }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
