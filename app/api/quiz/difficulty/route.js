import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { readPayload, writePayload } from '@/lib/stats-payloads';
import { rateDifficulty, ratingWeek, withSeeds } from '@/lib/daily-difficulty';

// EASY TO HARD (owner, 2026-10-18). Every daily's difficulty, 1 (gentle) to 5
// (tough), re-rated once a week: the rating for a week is computed from the
// seven ET days ending the Sunday before it, so it changes every Sunday night
// at midnight Eastern and holds still all week. The method lives in
// lib/daily-difficulty.js; this route only fetches, stores and serves.
//
// STORED, so a cold lambda answers at once and every lambda answers the same:
// the computed week sits in stats_payloads under KEY, and is rebuilt only when
// a new week has begun. Games with too few plays that week keep the rating
// they had (the previous stored week), so a quiet game does not jump tiers.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KEY = 'difficulty:v1';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

const HEAD = { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' };

export async function GET() {
  const week = ratingWeek(etToday());
  let stored = null;
  try { stored = await readPayload(KEY); } catch (e) { stored = null; }
  const prev = stored && stored.payload ? stored.payload : null;
  if (prev && prev.week === week.end && prev.ratings) {
    // The owner's starting ratings apply at serve time too, so a seed added
    // mid-week shows at once rather than at the next Sunday rebuild.
    return NextResponse.json({ ...prev, ratings: withSeeds(prev.ratings) }, { headers: HEAD });
  }
  try {
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) throw error;
    const out = rateDifficulty(data || [], week, prev && prev.ratings ? prev.ratings : {});
    const payload = { week: week.end, from: week.start, ratings: out.ratings, measured: out.measured };
    await writePayload(KEY, payload);
    return NextResponse.json(payload, { headers: HEAD });
  } catch (e) {
    if (prev && prev.ratings) return NextResponse.json({ ...prev, ratings: withSeeds(prev.ratings) }, { headers: HEAD });
    return NextResponse.json({ week: week.end, ratings: withSeeds({}), measured: 0 }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
