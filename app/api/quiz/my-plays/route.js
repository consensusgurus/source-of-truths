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
//
// PERSONAL BESTS RIDE THE SAME WALK (owner, 2026-10-10). The block grew best
// time, average time, solve rate and streak per game. Every one of them is a
// fold over the reader's own rows, which this loop already visits, so it costs
// no read at all: no extra query, no per-day board. A "solve" is a finished run
// at full marks (score === total), and only solved runs feed the two clocks.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KEYS = new Set(DAILY_KEYS);
const RE = /^(.+)-(\d+)-(\d+)-(\d+)$/;
const DAYS = 14;
// The home's Popular sort reads the site's plays over the trailing seven ET
// days (owner, 2026-10-12), off the same walk.
const WEEK = 7;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const empty = { mine: {}, site: {}, week: {}, days: DAYS };
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
    const week = {};
    const mine = {};
    for (const r of (data || [])) {
      const m = r && r.quiz_id ? String(r.quiz_id).match(RE) : null;
      if (!m || !KEYS.has(m[1])) continue;
      const key = m[1];
      site[key] = (site[key] || 0) + 1;
      const wi = slot.get(`${Number(m[2])}-${Number(m[3])}-${Number(m[4])}`);
      if (wi !== undefined && wi >= DAYS - WEEK) week[key] = (week[key] || 0) + 1;
      if (!myKeys.size) continue;
      const isMine = (r.user_id && myKeys.has(`u:${r.user_id}`)) || (r.anon_id && myKeys.has(`a:${r.anon_id}`));
      if (!isMine) continue;
      let me = mine[key];
      if (!me) { me = { plays: 0, recent: new Array(DAYS).fill(0), runs: 0, solved: 0, best: 0, times: [], days: new Set() }; mine[key] = me; }
      me.plays += 1;
      me.days.add(Date.UTC(2000 + Number(m[4]), Number(m[2]) - 1, Number(m[3])));
      if (!r.abandoned) {
        me.runs += 1;
        const sc = Number(r.score); const tot = Number(r.total); const t = Number(r.time_elapsed) || 0;
        if (tot > 0 && sc === tot) {
          me.solved += 1;
          if (t > 0) { me.times.push(t); if (!me.best || t < me.best) me.best = t; }
        }
      }
      const i = slot.get(`${Number(m[2])}-${Number(m[3])}-${Number(m[4])}`);
      if (i !== undefined) me.recent[i] = 1;
    }
    const today = Date.UTC(Y, M - 1, D); const DAY = 86400000;
    for (const k of Object.keys(mine)) {
      const me = mine[k];
      // The streak runs back from today, or from yesterday when today is not
      // played yet, so an unplayed morning does not read as a broken streak.
      let d = me.days.has(today) ? today : today - DAY; let streak = 0;
      while (me.days.has(d)) { streak += 1; d -= DAY; }
      mine[k] = {
        plays: me.plays, recent: me.recent.join(''), streak,
        best: me.best || 0, // The MEDIAN, not the mean: a board left open in a tab overnight is one
        // solve with a twelve-hour clock, and a mean lets it swamp every other.
        avg: me.times.length ? (() => { const a = me.times.slice().sort((x, y) => x - y); const h = a.length >> 1; return Math.round(a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2); })() : 0,
        solveRate: me.runs ? Math.round((me.solved / me.runs) * 100) : null,
      };
    }
    return NextResponse.json({ mine, site, week, days: DAYS }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (e) {
    return NextResponse.json(empty, { headers: { 'Cache-Control': 'no-store' } });
  }
}
