import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { DAILY_KEYS } from '@/lib/daily-combined';

// GET /api/quiz/daily-order
//
// The daily games' DISPLAY order, driven by yesterday's popularity (owner
// ruling 2026-07-17): every player-facing daily surface (home strip, games
// grid, /daily hub, the home leaders bar) sorts by how many times each game
// was actually played YESTERDAY — total completions, guests and replays
// included, because popularity is about play volume, not the leaderboard.
//
// Ties (including brand-new games with no yesterday) fall back to the
// canonical DAILY_KEYS order, so launch day is never random. The payload is
// identity-free and changes once a day, so it caches hard at the edge.
//
// LAUNCH WINDOW (owner ruling 2026-07-18): brand-new games get the first
// three slots for their first FOUR days, popularity be damned, so players
// actually meet them. After the window closes the pin evaporates and pure
// popularity order resumes. Update LAUNCH_PIN when the next game ships.

// Pin these keys to the front of the order through the end date (ET,
// inclusive). The 2026-07-18 launch wave (Jester/Sworn/Warmer/Ping/Tuck/
// Alibi/Cipher) is pinned through 07-21.
const LAUNCH_PIN = { keys: ['frame', 'rim', 'diag', 'junkyard', 'slot', 'impound', 'whittle', 'finesse', 'sums', 'hinge', 'blitzed', 'thread', 'focus', 'script', 'quotes', 'knight', 'flank', 'biz', 'encore', 'calc', 'sport', 'atlas', 'towers', 'mercury', 'polka', 'queen', 'shoe', 'niche', 'sixes', 'plot', 'barter', 'sando', 'cages', 'quilt', 'defend', 'blitz', 'docket', 'sweep', 'chomp', 'blocks', 'anon', 'deep', 'paths', 'redact', 'strata', 'suffice', 'turn', 'chain', 'hands', 'glyph', 'babel'], until: '2026-10-15' };

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' };

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function etYesterdaySuffix() {
  // ET "today", minus one calendar day, as the quizId date suffix "M-D-YY".
  const today = etToday();
  const [Y, M, D] = today.split('-').map(Number);
  const y = new Date(Date.UTC(Y, M - 1, D) - 86400000);
  return `${y.getUTCMonth() + 1}-${y.getUTCDate()}-${y.getUTCFullYear() % 100}`;
}

export async function GET() {
  const suffix = etYesterdaySuffix();
  const canonical = [...DAILY_KEYS];
  const plays = {};
  for (const k of canonical) plays[k] = 0;
  try {
    const wanted = new Map(canonical.map((k) => [`${k}-${suffix}`, k]));
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (!error && Array.isArray(data)) {
      for (const r of data) {
        const k = r && wanted.get(r.quiz_id);
        if (k) plays[k] += 1;
      }
    }
  } catch (e) { /* fall through to canonical */ }
  let order = [...canonical].sort((a, b) => (plays[b] - plays[a]) || (canonical.indexOf(a) - canonical.indexOf(b)));
  // Launch-window pin: new games take the first slots through their fourth day.
  if (etToday() <= LAUNCH_PIN.until) {
    const pinned = LAUNCH_PIN.keys.filter((k) => canonical.includes(k));
    order = [...pinned, ...order.filter((k) => !pinned.includes(k))];
  }
  return NextResponse.json({ date: suffix, order, plays }, { headers: CACHE_HEADERS });
}
