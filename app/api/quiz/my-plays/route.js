import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { resolvePlayerKeys } from '@/lib/quiz-identity';
import { DAILY_KEYS } from '@/lib/daily-combined';

// PLAY VOLUME PER DAILY (owner, 2026-10-07). The home's "Your favorites" block
// under a short category: how many times this reader has played each daily,
// which of the last 14 days they played it, and the whole site's count per
// game for a reader with no history yet. One read for the whole page, off the
// results cache every other board already shares.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KEYS = new Set(DAILY_KEYS);
const RE = /^(.+)-(\d+)-(\d+)-(\d+)$/;
const DAYS = 14;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const empty = { mine: {}, site: {}, days: DAYS };
  try {
    let myKeys = new Set();
    if (anonId || email) {
      try { myKeys = (await resolvePlayerKeys(supabaseAdmin, { email, anonId })).keys || new Set(); }
      catch (e) { if (anonId) myKeys = new Set([`a:${anonId}`]); }
    }
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) return NextResponse.json(empty, { headers: { 'Cache-Control': 'no-store' } });

    // The last 14 ET days, oldest first, as the suffixes the quiz ids carry.
    const [Y, M, D] = etToday().split('-').map(Number);
    const slot = new Map();
    for (let i = 0; i < DAYS; i += 1) {
      const d = new Date(Date.UTC(Y, M - 1, D - (DAYS - 1 - i)));
      slot.set(`${d.getUTCMonth() + 1}-${d.getUTCDate()}-${d.getUTCFullYear() % 100}`, i);
    }
    const site = {};
    const mine = {};
    for (const r of (data || [])) {
      const m = r && r.quiz_id ? String(r.quiz_id).match(RE) : null;
      if (!m || !KEYS.has(m[1])) continue;
      const key = m[1];
      site[key] = (site[key] || 0) + 1;
      if (!myKeys.size) continue;
      const isMine = (r.user_id && myKeys.has(`u:${r.user_id}`)) || (r.anon_id && myKeys.has(`a:${r.anon_id}`));
      if (!isMine) continue;
      let me = mine[key];
      if (!me) { me = { plays: 0, recent: new Array(DAYS).fill(0) }; mine[key] = me; }
      me.plays += 1;
      const i = slot.get(`${Number(m[2])}-${Number(m[3])}-${Number(m[4])}`);
      if (i !== undefined) me.recent[i] = 1;
    }
    for (const k of Object.keys(mine)) mine[k].recent = mine[k].recent.join('');
    return NextResponse.json({ mine, site, days: DAYS }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (e) {
    return NextResponse.json(empty, { headers: { 'Cache-Control': 'no-store' } });
  }
}
