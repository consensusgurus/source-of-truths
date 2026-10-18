import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// The same for every reader, so the CDN holds it like /api/quiz/totals.
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET /api/quiz/pulse (owner, 2026-10-13). The figures behind the home's
// Leaderboards + Stats pane, kept OUT of /api/quiz/totals on purpose: totals is
// read on every home load, this only when a reader opens that pane.
//
// Every comparison is against the SAME STRETCH of each of the last seven days
// (Eastern midnight to this clock time), so a morning is never judged against a
// whole day. Per daily game: today's plays, players, average score (finished
// runs only), perfect runs and median clock, plus its plays over the same
// stretch of the previous seven days. Hours are Eastern.
//
// Shape: { elapsed, hourToday[24], hourYest[24], plays[8], time[8], players[8],
//          gameToday: { key: { plays, players, avg, perfect, graded, med } },
//          gameWeek: { key: plays over days 1..7 } }  (index 0 = today)

const DATED = /^([a-z0-9]+)-\d{1,2}-\d{1,2}-\d{2}$/;
const dailyKeyOf = (qid) => { const m = DATED.exec(qid || ''); return m && DAILY_GAME_MAP[m[1]] ? m[1] : null; };

function startOfEasternTodayUTC() {
  const tz = 'America/New_York';
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(new Date(guess))
      .reduce((a, x) => { a[x.type] = x.value; return a; }, {});
    if (`${p.year}-${p.month}-${p.day}` === ymd && p.hour === '00') return guess;
  }
  return Date.parse(`${ymd}T04:00:00.000Z`);
}

const EMPTY = { elapsed: 0, hourToday: [], hourYest: [], plays: [], time: [], players: [], gameToday: {}, gameWeek: {} };

export async function GET() {
  try {
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) return NextResponse.json(EMPTY);
    const rows = data || [];
    const DAY = 24 * 60 * 60 * 1000;
    const HOUR = 60 * 60 * 1000;
    const now = Date.now();
    const cutoffToday = startOfEasternTodayUTC();
    const elapsed = Math.max(0, now - cutoffToday);
    const from = cutoffToday - 7 * DAY;
    const hourToday = new Array(24).fill(0);
    const hourYest = new Array(24).fill(0);
    const swPlays = new Array(8).fill(0);
    const swTime = new Array(8).fill(0);
    const swPlayers = Array.from({ length: 8 }, () => new Set());
    const gameWeek = {};
    const gToday = new Map();
    for (const r of rows) {
      const t = Date.parse(r.created_at);
      if (!(t >= from && t <= now)) continue;
      const d = t >= cutoffToday ? 0 : Math.floor((cutoffToday - t - 1) / DAY) + 1;
      if (d < 0 || d > 7) continue;
      const off = t - (cutoffToday - d * DAY);
      const hr = Math.min(23, Math.max(0, Math.floor(off / HOUR)));
      if (d === 0) hourToday[hr] += 1; else if (d === 1) hourYest[hr] += 1;
      const te = Number(r.time_elapsed);
      const who = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
      const gk = dailyKeyOf(r.quiz_id);
      if (off < elapsed) {
        swPlays[d] += 1;
        if (Number.isFinite(te) && te > 0) swTime[d] += te;
        if (who) swPlayers[d].add(who);
        if (gk && d > 0) gameWeek[gk] = (gameWeek[gk] || 0) + 1;
      }
      if (gk && d === 0) {
        let a = gToday.get(gk);
        if (!a) { a = { plays: 0, who: new Set(), graded: 0, sumFrac: 0, perfect: 0, times: [] }; gToday.set(gk, a); }
        a.plays += 1;
        if (who) a.who.add(who);
        if (r.total > 0 && !r.abandoned) {
          a.graded += 1;
          a.sumFrac += Math.min(1, (Number(r.score) || 0) / Number(r.total));
          if (Number(r.score) >= Number(r.total)) a.perfect += 1;
        }
        if (Number.isFinite(te) && te > 0 && !r.abandoned) a.times.push(te);
      }
    }
    const gameToday = {};
    for (const [k, a] of gToday) {
      const ts = a.times.sort((x, y) => x - y);
      gameToday[k] = {
        plays: a.plays,
        players: a.who.size,
        avg: a.graded ? Math.round((a.sumFrac / a.graded) * 1000) / 1000 : null,
        perfect: a.perfect,
        graded: a.graded,
        med: ts.length ? ts[Math.floor(ts.length / 2)] : null,
      };
    }
    return NextResponse.json({
      elapsed, hourToday, hourYest,
      plays: swPlays, time: swTime, players: swPlayers.map((x) => x.size),
      gameToday, gameWeek,
    }, { headers: CACHE_HEADERS });
  } catch (e) {
    return NextResponse.json(EMPTY);
  }
}
