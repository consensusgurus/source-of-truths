// The /sitestats payload builder (moved out of the route 2026-10-02 so the
// route, the daily warm cron and the stored-payload refresh share one copy).
//
// What changed with the move, and why:
//   - The player half and the viewer half used to run one after the other.
//     They are independent, so they run together now.
//   - The player half no longer loads the whole quiz_results table when
//     migration 59 is applied: three small SQL aggregates answer it. Without
//     the migration it falls back to the shared in-process cache, i.e. exactly
//     what it did before.
//   - Each half has a time limit. Measured 2026-10-02, an uncached build took
//     28.6s and a second one was still running at two minutes, with nothing
//     on the page to show for it. A half that runs out of time keeps the last
//     stored figures for that half (flagged) instead of failing the build.
//   - `timings` reports where the time went, so the next slow build names its
//     own cause.

import { supabaseAdmin } from './supabase-server';
import { loadQuizResultsCached } from './quiz-results-cache';
import { fetchAllRows } from './fetch-all';
import { guestHandleFromAnon } from './quiz-xp';
import { QUIZZES } from './quizzes';
import { DAILY_KEYS } from './daily-combined';
import { withTimeout } from './stats-payloads';

const TZ = 'America/New_York';
const DAY = 24 * 60 * 60 * 1000;

// quiz_id -> display title. Regular quizzes resolve from QUIZZES; daily-game
// plays carry ids like `crux-7-18-26`, which fold to the game's proper name.
const QUIZ_TITLE = new Map((QUIZZES || []).map((q) => [q.id, q.navTitle || q.title || q.id]));
const HIDDEN = new Set((QUIZZES || []).filter((q) => q && (q.unlisted || q.mobilePreview)).map((q) => q.id));
const DAILY_NAME = Object.fromEntries(DAILY_KEYS.map((k) => [k, k.charAt(0).toUpperCase() + k.slice(1)]));
const DAILY_RE = new RegExp('^(' + DAILY_KEYS.join('|') + ')-(\\d+)-(\\d+)-(\\d+)$');

function titleOf(id) {
  if (!id) return 'Unknown';
  if (QUIZ_TITLE.has(id)) return QUIZ_TITLE.get(id);
  const m = id.match(DAILY_RE);
  if (m) return DAILY_NAME[m[1]] || id;
  return id;
}

const playerKey = (r) => (r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`));

// US-Eastern date + hour parts for a Date, so buckets roll over on the same
// clock the rest of the site uses.
const ET_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
});
function etParts(d) {
  const p = {};
  for (const x of ET_FMT.formatToParts(d)) p[x.type] = x.value;
  return p;
}

// Midnight "today" in US Eastern as a UTC epoch ms (handles EST/EDT), matching
// /api/quiz/today so this page's "today" rolls over with the rest of the site.
function startOfEasternTodayUTC() {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(new Date(guess))
      .reduce((a, x) => { a[x.type] = x.value; return a; }, {});
    if (`${p.year}-${p.month}-${p.day}` === ymd && p.hour === '00') return guess;
  }
  return Date.parse(`${ymd}T04:00:00.000Z`);
}

// Distinct players + play count + total seconds played for quiz_results rows
// in [start, end).
function aggPlays(rows, start, end) {
  const s = new Set();
  let plays = 0;
  let time = 0;
  for (const r of rows) {
    const t = r.created_at ? new Date(r.created_at).getTime() : 0;
    if (t >= start && t < end) {
      plays += 1;
      s.add(playerKey(r));
      const te = Number(r.time_elapsed);
      if (Number.isFinite(te) && te > 0) time += te;
    }
  }
  return { people: s.size, plays, time };
}

// Percent change vs a prior period. null == no baseline to compare against
// (prev was 0 but current is not), which the UI renders as "NEW".
function pct(cur, prev) {
  if (prev > 0) return Math.round(((cur - prev) / prev) * 100);
  if (cur > 0) return null;
  return 0;
}
const cell = (cur, prev) => ({ now: cur, prev, pct: pct(cur, prev) });

function isMissingFn(err) {
  if (!err) return false;
  return err.code === 'PGRST202' || err.code === '42883' || /function|schema cache|does not exist/i.test(err.message || '');
}

// Fallback when migration 36 has not been applied yet: pull the minimal
// (visitor_id, created_at) columns for the trailing window and aggregate in JS.
// Bounded to 40 days so the 30-60d "previous month" baseline is unavailable
// (its % change shows "—" until the SQL function exists). Heavy relative to the
// RPC but rare — the whole route is CDN-cached for 5 minutes.
async function viewersFallback(now, startToday) {
  const sinceIso = new Date(now - 40 * DAY).toISOString();
  const [ve, qve] = await Promise.all([
    fetchAllRows(supabaseAdmin, 'view_events', 'visitor_id,created_at', ['id'], (q) => q.gte('created_at', sinceIso)),
    fetchAllRows(supabaseAdmin, 'quiz_view_events', 'visitor_id,created_at', ['id'], (q) => q.gte('created_at', sinceIso)),
  ]);
  const rows = [...(ve.data || []), ...(qve.data || [])];

  const uniq = (start, end) => {
    const s = new Set();
    let views = 0;
    for (const r of rows) {
      const t = r.created_at ? new Date(r.created_at).getTime() : 0;
      if (t >= start && t < end) { views += 1; if (r.visitor_id) s.add(r.visitor_id); }
    }
    return { people: s.size, views };
  };
  const d = uniq(now - DAY, now + 1), dp = uniq(now - 2 * DAY, now - DAY);
  const w = uniq(now - 7 * DAY, now + 1), wp = uniq(now - 14 * DAY, now - 7 * DAY);
  const m = uniq(now - 30 * DAY, now + 1); // 30-60d prev is outside the 40d window

  const hourly = Array.from({ length: 24 }, () => ({ set: new Set(), views: 0 }));
  for (const r of rows) {
    const t = r.created_at ? new Date(r.created_at).getTime() : 0;
    if (t < startToday) continue;
    const h = Number(etParts(new Date(r.created_at)).hour) % 24;
    hourly[h].views += 1;
    if (r.visitor_id) hourly[h].set.add(r.visitor_id);
  }

  return {
    viewers: {
      unique: {
        d: cell(d.people, dp.people),
        w: cell(w.people, wp.people),
        m: { now: m.people, prev: null, pct: null },
      },
      views: {
        d: cell(d.views, dp.views),
        w: cell(w.views, wp.views),
        m: { now: m.views, prev: null, pct: null },
      },
    },
    hourly: hourly.map((x) => ({ viewers: x.set.size, views: x.views })),
    source: 'fallback',
  };
}

const N = (v) => Number(v) || 0;
const SECTION_MS = 40 * 1000;

function nameOf(r) {
  return r.user_id ? (r.username || 'Player') : (r.username || guestHandleFromAnon(r.anon_id || `r:${r.id}`));
}

// ---- players, SQL path (migration 59) ----
async function playersFromSql() {
  const { data: t, error } = await supabaseAdmin.rpc('site_play_trends');
  if (error) return { missing: isMissingFn(error), error };
  if (!Array.isArray(t) || !t.length) return { missing: false, error: { message: 'empty' } };
  const row = t[0];
  const players = {
    unique: { d: cell(N(row.people_d), N(row.people_dp)), w: cell(N(row.people_w), N(row.people_wp)), m: cell(N(row.people_m), N(row.people_mp)) },
    plays: { d: cell(N(row.plays_d), N(row.plays_dp)), w: cell(N(row.plays_w), N(row.plays_wp)), m: cell(N(row.plays_m), N(row.plays_mp)) },
    time: { d: cell(N(row.secs_d), N(row.secs_dp)), w: cell(N(row.secs_w), N(row.secs_wp)), m: cell(N(row.secs_m), N(row.secs_mp)) },
  };
  const [hr, top, last] = await Promise.all([
    supabaseAdmin.rpc('site_play_hourly_today', { p_tz: TZ }),
    supabaseAdmin.rpc('site_play_top_today', { p_tz: TZ, p_limit: 40 }),
    supabaseAdmin
      .from('quiz_results')
      .select('id, quiz_id, user_id, username, anon_id, score, total, created_at')
      .order('id', { ascending: false })
      .limit(60),
  ]);
  const hourlyPlayers = Array.from({ length: 24 }, () => ({ people: 0, plays: 0 }));
  if (!hr.error && Array.isArray(hr.data)) {
    for (const r of hr.data) {
      const h = Number(r.hour);
      if (h >= 0 && h < 24) hourlyPlayers[h] = { people: N(r.people), plays: N(r.plays) };
    }
  }
  const topToday = ((!top.error && top.data) || [])
    .filter((r) => r.quiz_id && !HIDDEN.has(r.quiz_id))
    .map((r) => ({ quizId: r.quiz_id, title: titleOf(r.quiz_id), plays: N(r.plays) }))
    .sort((a, b) => b.plays - a.plays || a.title.localeCompare(b.title))
    .slice(0, 5);
  const lastPlayed = ((!last.error && last.data) || [])
    .filter((r) => r.quiz_id && !HIDDEN.has(r.quiz_id) && r.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((r) => ({ quizId: r.quiz_id, title: titleOf(r.quiz_id), name: nameOf(r), score: r.score, total: r.total, playedAt: r.created_at }));
  return { players, hourlyPlayers, topToday, lastPlayed, source: 'sql' };
}

// ---- players, in-process path (the pre-migration behaviour, unchanged) ----
async function playersFromRows(now, startToday) {
  const { data, error } = await loadQuizResultsCached(supabaseAdmin);
  const rows = error ? [] : (data || []);

  const pD = aggPlays(rows, now - DAY, now + 1), pDp = aggPlays(rows, now - 2 * DAY, now - DAY);
  const pW = aggPlays(rows, now - 7 * DAY, now + 1), pWp = aggPlays(rows, now - 14 * DAY, now - 7 * DAY);
  const pM = aggPlays(rows, now - 30 * DAY, now + 1), pMp = aggPlays(rows, now - 60 * DAY, now - 30 * DAY);
  const players = {
    unique: { d: cell(pD.people, pDp.people), w: cell(pW.people, pWp.people), m: cell(pM.people, pMp.people) },
    plays: { d: cell(pD.plays, pDp.plays), w: cell(pW.plays, pWp.plays), m: cell(pM.plays, pMp.plays) },
    time: { d: cell(pD.time, pDp.time), w: cell(pW.time, pWp.time), m: cell(pM.time, pMp.time) },
  };

  const todayRows = rows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= startToday);
  const byQuizToday = new Map();
  for (const r of todayRows) {
    if (!r.quiz_id || HIDDEN.has(r.quiz_id)) continue;
    byQuizToday.set(r.quiz_id, (byQuizToday.get(r.quiz_id) || 0) + 1);
  }
  const topToday = [...byQuizToday.entries()]
    .map(([id, plays]) => ({ quizId: id, title: titleOf(id), plays }))
    .sort((a, b) => b.plays - a.plays || a.title.localeCompare(b.title))
    .slice(0, 5);

  const hourSets = Array.from({ length: 24 }, () => new Set());
  const hourPlays = new Array(24).fill(0);
  for (const r of todayRows) {
    const h = Number(etParts(new Date(r.created_at)).hour) % 24;
    hourPlays[h] += 1;
    hourSets[h].add(playerKey(r));
  }
  const hourlyPlayers = hourPlays.map((plays, h) => ({ people: hourSets[h].size, plays }));

  const visible = rows.filter((r) => r.quiz_id && !HIDDEN.has(r.quiz_id) && r.created_at);
  const lastPlayed = visible.slice(-60)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((r) => ({ quizId: r.quiz_id, title: titleOf(r.quiz_id), name: nameOf(r), score: r.score, total: r.total, playedAt: r.created_at }));
  return { players, hourlyPlayers, topToday, lastPlayed, source: 'rows' };
}

async function buildPlayers(now, startToday) {
  const sql = await playersFromSql().catch((e) => ({ missing: false, error: e }));
  if (sql && sql.players) return sql;
  if (sql && sql.error && !sql.missing) console.error('sitestats players rpc error', sql.error);
  return playersFromRows(now, startToday);
}

// ---- site viewers (RPC first; JS fallback until migration 36 is applied) ----
async function buildViewers(now, startToday) {
  const hourlyViewers = Array.from({ length: 24 }, () => ({ viewers: 0, views: 0 }));
  const [tr, hv] = await Promise.all([
    supabaseAdmin.rpc('site_view_trends'),
    supabaseAdmin.rpc('site_view_hourly_today', { p_tz: TZ }),
  ]);
  if (!tr.error && Array.isArray(tr.data) && tr.data.length) {
    const row = tr.data[0];
    const viewers = {
      unique: { d: cell(N(row.viewers_d), N(row.viewers_dp)), w: cell(N(row.viewers_w), N(row.viewers_wp)), m: cell(N(row.viewers_m), N(row.viewers_mp)) },
      views: { d: cell(N(row.views_d), N(row.views_dp)), w: cell(N(row.views_w), N(row.views_wp)), m: cell(N(row.views_m), N(row.views_mp)) },
    };
    if (!hv.error && Array.isArray(hv.data)) {
      for (const r of hv.data) {
        const h = Number(r.hour);
        if (h >= 0 && h < 24) hourlyViewers[h] = { viewers: N(r.viewers), views: N(r.views) };
      }
    }
    return { viewers, hourlyViewers, viewerSource: 'rpc' };
  }
  if (isMissingFn(tr.error)) {
    const fb = await viewersFallback(now, startToday);
    return { viewers: fb.viewers, hourlyViewers: fb.hourly, viewerSource: fb.source };
  }
  if (tr.error) console.error('sitestats viewers rpc error', tr.error);
  return { viewers: null, hourlyViewers, viewerSource: 'none' };
}

// Build the whole payload. `prev` is the last stored payload (or null): a half
// that fails or runs out of time keeps prev's figures for that half.
export async function buildSiteStats(prev = null) {
  const t0 = Date.now();
  const now = t0;
  const startToday = startOfEasternTodayUTC();
  const nowP = etParts(new Date(now));
  const todayET = `${nowP.year}-${nowP.month}-${nowP.day}`;
  const timings = {};
  const held = [];

  const timed = async (name, fn) => {
    const s = Date.now();
    try {
      return await withTimeout(fn(), SECTION_MS, `${name} timed out`);
    } catch (e) {
      console.error(`sitestats ${name} error`, e?.message || e);
      held.push(name);
      return null;
    } finally {
      timings[name] = Date.now() - s;
    }
  };

  const [p, v] = await Promise.all([
    timed('players', () => buildPlayers(now, startToday)),
    timed('viewers', () => buildViewers(now, startToday)),
  ]);

  // A held half reuses the previous payload's figures. Its hourly bars only
  // carry over when prev is from the same Eastern day.
  const sameDay = prev && prev.today === todayET;
  const prevHourly = sameDay && Array.isArray(prev.hourly) ? prev.hourly : null;

  const players = p ? p.players : (prev ? prev.players : null);
  const topToday = p ? p.topToday : (sameDay ? prev.topToday || [] : []);
  const lastPlayed = p ? p.lastPlayed : (prev ? prev.lastPlayed || [] : []);
  const viewers = v ? v.viewers : (prev ? prev.viewers : null);
  const viewerSource = v ? v.viewerSource : (prev ? prev.viewerSource : 'none');

  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    players: p ? p.hourlyPlayers[h].people : (prevHourly ? N(prevHourly[h]?.players) : 0),
    plays: p ? p.hourlyPlayers[h].plays : (prevHourly ? N(prevHourly[h]?.plays) : 0),
    viewers: v ? v.hourlyViewers[h].viewers : (prevHourly ? N(prevHourly[h]?.viewers) : 0),
    views: v ? v.hourlyViewers[h].views : (prevHourly ? N(prevHourly[h]?.views) : 0),
  }));

  timings.total = Date.now() - t0;
  return {
    generatedAt: new Date().toISOString(),
    tz: TZ,
    today: todayET,
    players,
    viewers,
    viewerSource,
    playerSource: p ? p.source : 'held',
    topToday,
    lastPlayed,
    hourly,
    held,
    timings,
  };
}
