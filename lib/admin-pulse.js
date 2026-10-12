// The admin desk's Pulse view (2026-10-12): rolling actives, visitors, new
// players, new sign-ups and time played, each for the last day / week / month
// against the period before it, plus a 90-day trend and rolling referrers.
//
// WHY ITS OWN BUILD. The old Analytics build (lib/admin-data.js
// computeAnalytics) measured 5.6s on 2026-10-12, 2.7s loading 156k play rows
// and 2.9s deriving per-player stats, the player map, return play and the
// all-time charts, and the desk's first paint waited on all of it. Everything
// here comes from ONE pass over the same cached rows, one small read of
// quiz_users.created_at, and the site_view_trends() RPC (migration 59), so the
// default view no longer pays for tables it does not show.
//
// DEFINITIONS, matching /sitestats so the two pages agree:
//   - A player is the registered user_id, else the browser anon_id, else the
//     row id (playerKey, the rule used everywhere in the app).
//   - Windows are ROLLING and anchored on now: day = last 24h, week = last 7
//     days, month = last 30 days; "prev" is the same length immediately before.
//   - A visitor is a distinct non-null visitor_id across both page-view logs.
//   - A new player is one whose FIRST recorded play falls in the window.
//   - Time played is the sum of time_elapsed over completed games, uncapped,
//     the same figure /sitestats prints.

import { supabaseAdmin } from './supabase-server';
import { fetchAllRows } from './fetch-all';
import { loadAdminResultsCached } from './admin-results-cache';
import { playerKey } from './admin-plays';
import { readPayload, writePayload, withTimeout } from './stats-payloads';

const DAY = 24 * 60 * 60 * 1000;
const WINDOWS = { day: 1, week: 7, month: 30 };
const SERIES_DAYS = 90;
const SITE_HOSTS = ['mindloftdaily.com', 'sourceoftruths.com', 'consensusgurus.com', 'localhost', 'vercel.app'];

// ET calendar day for an instant, memoized by UTC hour (Eastern sits a whole
// number of hours off UTC and changes over on the hour, so every instant in one
// UTC hour has the same Eastern date). Same reasoning as admin-data etParts.
const ET_DAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
const DAY_CACHE = new Map();
function etDay(ms) {
  const h = Math.floor(ms / 3600000);
  let v = DAY_CACHE.get(h);
  if (v === undefined) {
    v = ET_DAY_FMT.format(new Date(h * 3600000));
    if (DAY_CACHE.size > 20000) DAY_CACHE.clear();
    DAY_CACHE.set(h, v);
  }
  return v;
}
function addDays(ymd, n) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 'https://www.google.com/search?q=x' -> 'google.com'. Our own sites, and
// anything unparseable, come back null.
export function refHost(ref) {
  if (!ref || typeof ref !== 'string') return null;
  let host = ref.trim().toLowerCase();
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//.test(host)) host = new URL(host).hostname;
    else host = host.split(/[/?#]/)[0];
  } catch (e) {
    return null;
  }
  host = host.replace(/^www\./, '').replace(/^m\./, '').replace(/^l\./, '').replace(/^lm\./, '');
  if (!host || !host.includes('.')) return null;
  if (SITE_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))) return null;
  // Fold the obvious families so one source reads as one row.
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/(^|\.)bing\.com$/.test(host)) return 'bing.com';
  if (host === 't.co' || host === 'x.com' || host === 'twitter.com') return 'x.com';
  if (/(^|\.)facebook\.com$/.test(host) || host === 'fb.com') return 'facebook.com';
  if (/(^|\.)reddit\.com$/.test(host)) return 'reddit.com';
  return host;
}

const pct = (now, prev) => (prev > 0 ? Math.round(((now - prev) / prev) * 1000) / 10 : null);
const cell = (now, prev) => ({ now, prev, pct: pct(now, prev) });

// The pure part: rows + signups in, figures out. Exported for the verifier.
export function buildPulse(rows, signupTimes, nowMs = Date.now()) {
  const keys = Object.keys(WINDOWS);
  const span = (k) => WINDOWS[k] * DAY;
  const acc = {};
  for (const k of keys) {
    acc[k] = {
      players: [new Set(), new Set()],
      plays: [0, 0],
      seconds: [0, 0],
      newPlayers: [0, 0],
      signups: [0, 0],
    };
  }
  // Which window half (0 = current, 1 = previous) an age falls in, or -1.
  const half = (age, k) => (age < 0 ? -1 : age < span(k) ? 0 : age < 2 * span(k) ? 1 : -1);

  const today = etDay(nowMs);
  const firstDay = addDays(today, -(SERIES_DAYS - 1));
  const padDay = addDays(firstDay, -29); // MAU on the first charted day needs 29 days before it
  const dayIdx = new Map();
  const dayList = [];
  for (let d = padDay; d <= today; d = addDays(d, 1)) { dayIdx.set(d, dayList.length); dayList.push(d); }
  const daySets = dayList.map(() => new Set());
  const dayPlays = dayList.map(() => 0);
  const daySecs = dayList.map(() => 0);
  const dayNew = dayList.map(() => 0);
  const daySign = dayList.map(() => 0);
  const padStartMs = nowMs - (dayList.length + 1) * DAY;

  const firstSeen = new Map(); // playerKey -> earliest play ms (whole history)
  const refPlayers = [new Map(), new Map()]; // host -> Set(playerKey), week now / prev
  const maxSpan = 2 * span('month');

  for (const r of rows || []) {
    const t = r.created_at ? Date.parse(r.created_at) : NaN;
    if (Number.isNaN(t)) continue;
    const pk = playerKey(r);
    const f = firstSeen.get(pk);
    if (f === undefined || t < f) firstSeen.set(pk, t);
    const age = nowMs - t;
    if (age > maxSpan && t < padStartMs) continue;
    const te = typeof r.time_elapsed === 'number' && r.time_elapsed > 0 ? r.time_elapsed : 0;
    for (const k of keys) {
      const h = half(age, k);
      if (h < 0) continue;
      acc[k].players[h].add(pk);
      acc[k].plays[h] += 1;
      acc[k].seconds[h] += te;
    }
    if (t >= padStartMs) {
      const i = dayIdx.get(etDay(t));
      if (i !== undefined) { daySets[i].add(pk); dayPlays[i] += 1; daySecs[i] += te; }
    }
    const hw = half(age, 'week');
    if (hw >= 0 && r.referrer) {
      const host = refHost(r.referrer);
      if (host) {
        const m = refPlayers[hw];
        if (!m.has(host)) m.set(host, new Set());
        m.get(host).add(pk);
      }
    }
  }

  for (const t of firstSeen.values()) {
    const age = nowMs - t;
    for (const k of keys) { const h = half(age, k); if (h >= 0) acc[k].newPlayers[h] += 1; }
    if (t >= padStartMs) { const i = dayIdx.get(etDay(t)); if (i !== undefined) dayNew[i] += 1; }
  }
  for (const t of signupTimes || []) {
    if (!Number.isFinite(t)) continue;
    const age = nowMs - t;
    for (const k of keys) { const h = half(age, k); if (h >= 0) acc[k].signups[h] += 1; }
    if (t >= padStartMs) { const i = dayIdx.get(etDay(t)); if (i !== undefined) daySign[i] += 1; }
  }

  const metric = (name) => Object.fromEntries(keys.map((k) => {
    const v = acc[k][name];
    const a = v[0] instanceof Set ? v[0].size : v[0];
    const b = v[1] instanceof Set ? v[1].size : v[1];
    return [k, cell(a, b)];
  }));
  const players = metric('players');
  const out = {
    players,
    plays: metric('plays'),
    seconds: metric('seconds'),
    newPlayers: metric('newPlayers'),
    signups: metric('signups'),
  };
  // Derived: time per active player and the share of
  // new players who signed up.
  const ratio = (a, b) => (b > 0 ? a / b : null);
  const ratioCell = (a, b) => {
    const now = ratio(a.now, b.now), prev = ratio(a.prev, b.prev);
    return { now, prev, pct: now != null && prev ? Math.round(((now - prev) / prev) * 1000) / 10 : null };
  };
  out.secondsPerPlayer = Object.fromEntries(keys.map((k) => [k, ratioCell(out.seconds[k], players[k])]));
  out.signupRate = Object.fromEntries(keys.map((k) => [k, ratioCell(out.signups[k], out.newPlayers[k])]));

  // Rolling series, one row per ET day, today last (partial).
  const win = (w) => {
    const counts = new Map();
    const res = [];
    for (let i = 0; i < dayList.length; i += 1) {
      for (const pk of daySets[i]) counts.set(pk, (counts.get(pk) || 0) + 1);
      if (i - w >= 0) for (const pk of daySets[i - w]) { const c = counts.get(pk) - 1; if (c) counts.set(pk, c); else counts.delete(pk); }
      res.push(counts.size);
    }
    return res;
  };
  const wau = win(7), mau = win(30);
  const start = dayIdx.get(firstDay);
  const series = [];
  for (let i = start; i < dayList.length; i += 1) {
    series.push({
      day: dayList[i],
      dau: daySets[i].size,
      wau: wau[i],
      mau: mau[i],
      plays: dayPlays[i],
      seconds: daySecs[i],
      newPlayers: dayNew[i],
      signups: daySign[i],
    });
  }

  const hosts = new Set([...refPlayers[0].keys(), ...refPlayers[1].keys()]);
  const referrers = [...hosts]
    .map((host) => {
      const a = refPlayers[0].get(host), b = refPlayers[1].get(host);
      return { host, ...cell(a ? a.size : 0, b ? b.size : 0) };
    })
    .sort((x, y) => y.now - x.now || y.prev - x.prev || x.host.localeCompare(y.host))
    .slice(0, 12);

  return { metrics: out, series, referrers, today };
}

// site_view_trends() is the slowest read here. Its figures move slowly, so one
// answer is kept for ten minutes and a call past 20s hands back the last one.
const VIS_MEMO_MS = 10 * 60 * 1000;
let visMemo = null; // { row, at }
async function visitorTrends() {
  if (visMemo && Date.now() - visMemo.at < VIS_MEMO_MS) return { row: visMemo.row, at: visMemo.at };
  try {
    const res = await withTimeout(Promise.resolve(supabaseAdmin.rpc('site_view_trends')), 20000, 'site_view_trends timed out');
    if (res && res.error) throw res.error;
    const row = (Array.isArray(res.data) ? res.data[0] : res.data) || null;
    if (row) visMemo = { row, at: Date.now() };
    return { row, at: Date.now() };
  } catch (e) {
    if (visMemo) return { row: visMemo.row, at: visMemo.at, error: String(e.message || e) };
    return { row: null, error: String(e.message || e) };
  }
}
function visitorMetrics(row) {
  if (!row) return null;
  const N = (v) => Number(v) || 0;
  return {
    visitors: { day: cell(N(row.viewers_d), N(row.viewers_dp)), week: cell(N(row.viewers_w), N(row.viewers_wp)), month: cell(N(row.viewers_m), N(row.viewers_mp)) },
    pageViews: { day: cell(N(row.views_d), N(row.views_dp)), week: cell(N(row.views_w), N(row.views_wp)), month: cell(N(row.views_m), N(row.views_mp)) },
  };
}

async function computePulse({ force = false } = {}) {
  const t0 = Date.now();
  const [res, users, vis] = await Promise.all([
    loadAdminResultsCached(supabaseAdmin, { force }),
    fetchAllRows(supabaseAdmin, 'quiz_users', 'id, created_at', ['id']),
    visitorTrends(),
  ]);
  const tLoaded = Date.now();
  const rows = (res && res.data) || [];
  const signupTimes = ((users && users.data) || []).map((u) => Date.parse(u.created_at || '')).filter(Number.isFinite);
  const nowMs = Date.now();
  const built = buildPulse(rows, signupTimes, nowMs);
  const v = visitorMetrics(vis.row);
  if (v) {
    built.metrics.visitors = v.visitors;
    built.metrics.pageViews = v.pageViews;
    // Share of the week's visitors who finished at least one game.
    const p = built.metrics.players, vv = v.visitors;
    built.metrics.playerShare = Object.fromEntries(Object.keys(WINDOWS).map((k) => {
      const now = vv[k].now ? p[k].now / vv[k].now : null;
      const prev = vv[k].prev ? p[k].prev / vv[k].prev : null;
      return [k, { now, prev, pct: now != null && prev ? Math.round(((now - prev) / prev) * 1000) / 10 : null }];
    }));
  }
  return {
    ...built,
    visitorsAt: vis.at ? new Date(vis.at).toISOString() : null,
    visitorsError: vis.error || null,
    builtAt: new Date(nowMs).toISOString(),
    rowCount: rows.length,
    timings: { load: tLoaded - t0, derive: Date.now() - tLoaded, total: Date.now() - t0 },
  };
}

const STORE_KEY = 'admin:pulse:v1';
const MEMO_MS = 60 * 1000;
const FRESH_FLOOR_MS = 15 * 1000;
let memo = null;  // { data, at }
let inflight = null;
let storedAt = 0;

function build(force) {
  if (!inflight) {
    inflight = (async () => {
      const data = await computePulse({ force });
      memo = { data, at: Date.now() };
      if (Date.now() - storedAt > 5 * 60 * 1000) { storedAt = Date.now(); await writePayload(STORE_KEY, data); }
      return memo;
    })().finally(() => { inflight = null; });
  }
  return inflight;
}

// Same modes as loadAnalyticsPart: undefined answers fastest (possibly a stale
// copy, flagged), 'fresh' wants a build under 15s old, 'force' rebuilds now.
export async function loadPulse(mode) {
  const age = memo ? Date.now() - memo.at : Infinity;
  if (mode === 'force') return (await build(true)).data;
  if (mode === 'fresh') return age < FRESH_FLOOR_MS ? memo.data : (await build(false)).data;
  if (age < MEMO_MS) return memo.data;
  if (memo) return { ...memo.data, stale: true };
  const stored = await readPayload(STORE_KEY);
  if (stored && stored.payload) return { ...stored.payload, stale: true };
  return (await build(false)).data;
}

export async function warmPulse() {
  const m = await build(false);
  storedAt = Date.now();
  const stored = await writePayload(STORE_KEY, m.data);
  return { stored, timings: m.data.timings };
}
