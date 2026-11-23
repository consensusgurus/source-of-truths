import { NextResponse } from 'next/server';
import { dropsOf, INDEX_KEYS } from '@/lib/daily-index';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { DAILY_KEYS } from '@/lib/daily-combined';


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Per-player answer, keep it fresh (a play should immediately drop that puzzle).
const CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Every daily's drops, from the slim index (lib/daily-index.js), not the
// puzzle banks: this route reads only quizId, num and live (2026-11-23).
const GAME_PUZZLES = Object.fromEntries(INDEX_KEYS.map((k) => [k, dropsOf(k)]));

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function suffixOfDate(dateStr) { const [Y, M, D] = dateStr.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }

// GET /api/quiz/daily-unplayed?game=<key>&anonId=&email=
//   -> { game, num, href } for the MOST-RECENT past drop of <game> the viewer has
//      not submitted a result for, or { game, num:null, href:null } when none remain
//      (the end-card's "Play a past <Game>" button hides on null). Today's puzzle and
//      any not-yet-live drop are excluded. "Played" = a quiz_results row for that
//      exact archived quizId under the viewer's identity (account, else this anon).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = (searchParams.get('game') || '').trim();
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const none = { game, num: null, href: null };
  if (!DAILY_KEYS.includes(game)) return NextResponse.json(none);

  const today = etTodayServer();
  const todayQuizId = `${game}-${suffixOfDate(today)}`;
  const puzzles = GAME_PUZZLES[game] || [];
  const archive = puzzles
    .filter((p) => p && p.quizId && p.quizId !== todayQuizId && (!p.live || p.live <= today))
    .sort((a, b) => (b.num || 0) - (a.num || 0));
  if (!archive.length) return NextResponse.json(none);

  let myKey = null;
  try {
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) myKey = `u:${ident.id}`;
    else if (anonId) myKey = `a:${anonId}`;
  } catch (e) { /* identity best-effort */ }

  const played = new Set();
  if (myKey) {
    try {
      const { data } = await loadQuizResultsCached(supabaseAdmin, { includeHidden: true }); // own record: see lib/hidden-players
      const prefix = game + '-';
      for (const r of (data || [])) {
        const qid = r && r.quiz_id;
        if (!qid || qid.indexOf(prefix) !== 0) continue;
        const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
        if (pk === myKey) played.add(qid);
      }
    } catch (e) { /* no history -> treat all as unplayed */ }
  }

  const pick = archive.find((p) => !played.has(p.quizId));
  if (!pick) return NextResponse.json(none);
  return NextResponse.json({ game, num: pick.num, href: `/${game}?p=${pick.num}` }, { headers: CACHE_HEADERS });
}
