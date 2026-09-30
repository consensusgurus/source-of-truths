import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchAllRows } from '@/lib/fetch-all';
import { loadAdminResultsCached } from '@/lib/admin-results-cache';
import { playerKey, playMeta, playRow } from '@/lib/admin-plays';
import { buildQuizTitles, TRACKED_PAGES } from '@/lib/admin-quiz-titles';
import { IQ_TESTS } from '@/lib/iq-tests';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';
import { LISTS } from '@/lib/data';
import { QUIZZES } from '@/lib/quizzes';
import { buildAnonPlayers } from '@/lib/quiz-anon';
import { buildGeoMapData } from '@/lib/geo-locate';
import { DESCRIPTIONS } from '@/lib/descriptions';
import { DAILY_KEYS, DAILY_DATED_RE, dailyGameName } from '@/lib/daily-games';
import { HERO_IMAGES } from '@/lib/hero-images';

export const dynamic = 'force-dynamic';

// quiz_results is read through lib/admin-results-cache.js (2026-08-28). It was
// read here with fetchAllRows on every single load: ~73 sequential 1000-row
// round trips, no reuse between loads, and a column-tier probe that re-paged the
// whole table from scratch for each tier it had to drop. Measured on the live
// site: 34.9s TTFB, identical across three consecutive loads. The cache keeps
// the rows in-process and refreshes with a count plus a delta, which is what
// every /api/quiz/* route has done since July.
//
// playMeta and the player-key rule now live in lib/admin-plays.js, shared with
// /api/admin/player-plays so the summary here and the detail behind an expanded
// row cannot disagree.

// Distinct non-null values of a field across a player's plays, preserving the
// plays' order (which arrives newest-first), so the admin MultiCell shows the
// most-recent value first with a "+N" for the rest.
function distinctNewestFirst(plays, field) {
  const seen = new Set();
  const out = [];
  for (const p of plays || []) {
    const v = p[field];
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

// Aggregate a player's whole play history into the engagement / tenure /
// behavioral stats the admin surfaces (and the distinct device/os/geo/etc sets).
// Works for registered and anonymous players alike, from the same play-row shape.
// Bucket play timestamps in US Eastern so "Peak time" and active-day counts use
// the admin's (Eastern) clock, matching the client-rendered "Last" column. This
// page renders server-side in UTC, so Date.getHours()/getDay() would report UTC.
const ET_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
});
const ET_DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function etParts(d) {
  const parts = ET_FMT.formatToParts(d);
  const get = (t) => { const p = parts.find((x) => x.type === t); return p ? p.value : ''; };
  return { hour: parseInt(get('hour'), 10) % 24, dow: ET_DOW[get('weekday')] ?? 0, day: `${get('year')}-${get('month')}-${get('day')}` };
}
// A session is a sitting, not a day: a new session starts when the gap since
// the player's previous play exceeds SESSION_GAP_MS (30 minutes). Mirrored by
// sessionsFromPlays in AdminClient.jsx.
const SESSION_GAP_MS = 30 * 60 * 1000;
function playerStats(plays) {
  const list = plays || [];
  let bestScore = null, timeSum = 0, timeN = 0, accSum = 0, accN = 0, perfect = 0, firstSeen = '', lastSeen = '';
  const quizCount = new Map();
  const days = new Set();
  const hours = new Array(24).fill(0);
  const dows = new Array(7).fill(0);
  for (const p of list) {
    if (typeof p.score === 'number') bestScore = bestScore == null ? p.score : Math.max(bestScore, p.score);
    if (typeof p.timeElapsed === 'number' && p.timeElapsed >= 0) { timeSum += p.timeElapsed; timeN += 1; }
    // Accuracy = score as a fraction of the max possible (score/total), averaged
    // over plays. This is the ONLY consistent measure across formats: typed
    // "name them all" quizzes don't record correct_count, and the timed
    // multiple-choice / survival quizzes store total as MAX POINTS (e.g. 300)
    // while correct_count is a question count (e.g. 9) — so correct_count/total
    // would read ~3%. score is always 0..total, so score/total is 0..1 for every
    // quiz and matches the "perfect" definition (score === total).
    if (typeof p.score === 'number' && typeof p.total === 'number' && p.total > 0) {
      accSum += Math.max(0, Math.min(1, p.score / p.total));
      accN += 1;
    }
    if (typeof p.total === 'number' && p.total > 0 && p.score === p.total) perfect += 1;
    const label = p.title || p.quizId;
    if (label) quizCount.set(label, (quizCount.get(label) || 0) + 1);
    const c = String(p.createdAt || '');
    if (c) {
      if (!firstSeen || c < firstSeen) firstSeen = c;
      if (!lastSeen || c > lastSeen) lastSeen = c;
      const d = new Date(p.createdAt);
      if (!Number.isNaN(d.getTime())) { const et = etParts(d); days.add(et.day); hours[et.hour] += 1; dows[et.dow] += 1; }
    }
  }
  const times = [];
  for (const p of list) { const t = Date.parse(p.createdAt); if (!Number.isNaN(t)) times.push(t); }
  times.sort((a, b) => a - b);
  let sessions = 0;
  for (let i = 0; i < times.length; i++) if (i === 0 || times[i] - times[i - 1] > SESSION_GAP_MS) sessions += 1;
  let mostPlayed = null, mostN = 0;
  for (const [q, cnt] of quizCount) if (cnt > mostN) { mostN = cnt; mostPlayed = q; }
  const anyTime = hours.some((v) => v > 0);
  const peakHour = anyTime ? hours.reduce((b, v, i, a) => (v > a[b] ? i : b), 0) : null;
  const peakDow = anyTime ? dows.reduce((b, v, i, a) => (v > a[b] ? i : b), 0) : null;
  return {
    plays: list.length,
    quizzes: quizCount.size,
    accuracy: accN ? Math.round((accSum / accN) * 100) : null,
    bestScore,
    avgTime: timeN ? Math.round(timeSum / timeN) : null,
    perfect,
    firstSeen: firstSeen || null,
    lastSeen: lastSeen || null,
    activeDays: days.size,
    sessions,
    mostPlayed: mostPlayed ? { title: mostPlayed, count: mostN } : null,
    peakHour,
    peakDow,
    devices: distinctNewestFirst(list, 'device'),
    oses: distinctNewestFirst(list, 'os'),
    browsers: distinctNewestFirst(list, 'browser'),
    geos: distinctNewestFirst(list, 'geo'),
    timezones: distinctNewestFirst(list, 'timezone'),
    languages: distinctNewestFirst(list, 'language'),
    referrers: distinctNewestFirst(list, 'referrer'),
  };
}

// Active-user counts (DAU/WAU/MAU) from completed quiz games. A player's
// identity is their registered user_id, else their browser anon_id, else the
// row id (a lone anonymous play). A player counts once per rolling window if
// they finished any game inside it. This is the "active players" signal,
// available from existing data with full history; the broader "unique visitors"
// signal comes from visitor_active_counts() once migration 30 is applied.
function activePlayerCounts(rows) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const dau = new Set(), wau = new Set(), mau = new Set();
  for (const r of rows || []) {
    const t = r.created_at ? new Date(r.created_at).getTime() : NaN;
    if (Number.isNaN(t)) continue;
    const age = now - t;
    if (age > 30 * DAY) continue;
    const key = playerKey(r);
    mau.add(key);
    if (age <= 7 * DAY) wau.add(key);
    if (age <= DAY) dau.add(key);
  }
  return { dau: dau.size, wau: wau.size, mau: mau.size };
}

// Daily-games return play (Analytics -> Return Play). For each of the four
// daily games (Links, Span, Crux, Garble), bucket players by how many DISTINCT
// days they have completed it — each daily puzzle has a unique quiz_id per date
// (e.g. links-7-13-26), so distinct quiz_ids == distinct days a player came
// back. Also a cross-game breadth histogram: how many of the four games each
// player has ever touched. Player identity is the same rule the active-user
// counts use (registered user_id, else browser anon_id, else the lone row id),
// so anonymous browsers — the bulk of daily-game players — are counted.
const DAILY_GAMES = DAILY_KEYS.map((k) => ({ key: k, title: dailyGameName(k) }));
const DAILY_PREFIX_RE = new RegExp('^(' + DAILY_KEYS.join('|') + ')-');
function buildDailyRetention(rows) {
  const perGame = new Map(DAILY_GAMES.map((g) => [g.key, new Map()])); // key -> (playerKey -> Set(quizId))
  const breadth = new Map(); // playerKey -> Set(gameKey)
  for (const r of rows || []) {
    const qid = r.quiz_id || '';
    const m = DAILY_PREFIX_RE.exec(qid);
    if (!m) continue;
    const gk = m[1];
    const pkey = playerKey(r);
    const gmap = perGame.get(gk);
    let set = gmap.get(pkey);
    if (!set) { set = new Set(); gmap.set(pkey, set); }
    set.add(qid);
    let gs = breadth.get(pkey);
    if (!gs) { gs = new Set(); breadth.set(pkey, gs); }
    gs.add(gk);
  }
  const games = DAILY_GAMES.map((g) => {
    const gmap = perGame.get(g.key);
    const counts = new Map(); // distinct-days -> number of players
    let players = 0, dayPlays = 0, returning = 0, maxDays = 0;
    for (const [, set] of gmap) {
      const d = set.size;
      counts.set(d, (counts.get(d) || 0) + 1);
      players += 1;
      dayPlays += d;
      if (d >= 2) returning += 1;
      if (d > maxDays) maxDays = d;
    }
    const histogram = [];
    for (let d = 1; d <= maxDays; d++) histogram.push({ days: d, count: counts.get(d) || 0 });
    return { key: g.key, title: g.title, players, dayPlays, returning, maxDays, histogram };
  });
  const bcounts = new Map();
  let bTotal = 0;
  for (const [, gs] of breadth) { const n = gs.size; bcounts.set(n, (bcounts.get(n) || 0) + 1); bTotal += 1; }
  const bhist = [];
  for (let n = 1; n <= DAILY_GAMES.length; n++) bhist.push({ games: n, count: bcounts.get(n) || 0 });
  return { games, breadth: { total: bTotal, histogram: bhist } };
}


// Analytics -> New Users. Two daily acquisition series, bucketed by calendar day
// in US Eastern (matching the rest of the admin's clock):
//   players  - distinct players whose FIRST recorded quiz play fell on that day.
//              Identity is the same rule used everywhere else: registered
//              user_id, else browser anon_id, else the lone row id. Counts
//              registered and anonymous alike, over the full quiz_results
//              history. This is "new players acquired" per day.
//   signups  - quiz_users rows (the /quiz join-form email signups) created that
//              day. A much smaller number, since most players never register.
// The series is gap-filled across the union of both sources' date ranges, so a
// quiet day still plots. Rows with no/unparseable timestamp are skipped.
function buildNewUsersByDay(results, users) {
  // Earliest play timestamp per player identity.
  const firstMs = new Map(); // playerKey -> epoch ms of first play
  for (const r of results || []) {
    if (!r.created_at) continue;
    const t = new Date(r.created_at).getTime();
    if (Number.isNaN(t)) continue;
    const key = playerKey(r);
    const prev = firstMs.get(key);
    if (prev == null || t < prev) firstMs.set(key, t);
  }
  const playersByDay = new Map(); // 'YYYY-MM-DD' (ET) -> count
  for (const ms of firstMs.values()) {
    const day = etParts(new Date(ms)).day;
    playersByDay.set(day, (playersByDay.get(day) || 0) + 1);
  }
  const signupsByDay = new Map();
  for (const u of users || []) {
    if (!u.created_at) continue;
    const d = new Date(u.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const day = etParts(d).day;
    signupsByDay.set(day, (signupsByDay.get(day) || 0) + 1);
  }
  const allKeys = Array.from(new Set([...playersByDay.keys(), ...signupsByDay.keys()])).sort();
  const series = [];
  let totalPlayers = 0, totalSignups = 0, busiest = null;
  if (allKeys.length) {
    const cur = new Date(`${allKeys[0]}T00:00:00Z`);
    const stop = new Date(`${allKeys[allKeys.length - 1]}T00:00:00Z`);
    while (cur.getTime() <= stop.getTime()) {
      const day = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}-${String(cur.getUTCDate()).padStart(2, '0')}`;
      const players = playersByDay.get(day) || 0;
      const signups = signupsByDay.get(day) || 0;
      series.push({ day, players, signups });
      totalPlayers += players;
      totalSignups += signups;
      if (players > 0 && (!busiest || players > busiest.players)) busiest = { day, players, signups };
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  const activeDays = playersByDay.size;
  return {
    series,
    totals: {
      totalPlayers,
      totalSignups,
      activeDays,
      daysTracked: series.length,
      firstDay: allKeys[0] || null,
      lastDay: allKeys.length ? allKeys[allKeys.length - 1] : null,
      busiestDay: busiest,
      avgActiveDayPlayers: activeDays ? Math.round((totalPlayers / activeDays) * 10) / 10 : 0,
    },
  };
}

// The measured SHAPE of play, used by the admin's Time Played chart to project
// the still-running bucket (today / this week / this month). Straight clock-time
// extrapolation assumes play is spread evenly through a period, which it is not:
// the overnight hours are near dead and the evening carries the load, so a
// linear projection reads far too low at breakfast and too high after midnight.
// Two curves fix that. hourCum says what share of a typical day's seconds has
// landed by the end of each ET hour; dow says what share of a typical week lands
// on each weekday (Sun=0).
//
// Both are built from the SHAPE_WINDOW_DAYS most recent COMPLETE days. Today is
// excluded because it is partial, and folding it in would bend the curve toward
// whatever hour it currently happens to be.
const SHAPE_WINDOW_DAYS = 28;
const SHAPE_MIN_DAYS = 5;
const SHAPE_MIN_DOW_DAYS = 7;
function buildPlayShape(byDay, todayKey) {
  const complete = Array.from(byDay.entries())
    .filter(([day, v]) => day !== todayKey && v.seconds > 0 && Array.isArray(v.hours))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-SHAPE_WINDOW_DAYS);
  if (complete.length < SHAPE_MIN_DAYS) return null;

  // Drop the window's near-empty days before measuring anything. Their shape is
  // one or two games' worth of noise, not a curve.
  const secsSorted = complete.map(([, v]) => v.seconds).sort((a, b) => a - b);
  const medSec = secsSorted[secsSorted.length >> 1] || 0;
  let keep = complete.filter(([, v]) => v.seconds >= medSec * 0.1);
  if (keep.length < SHAPE_MIN_DAYS) keep = complete;

  // Hour curve: normalize EACH day to its own total first, then take the
  // pointwise MEDIAN across days. Summing raw seconds instead would let the
  // single busiest day dictate the curve (across a window with heavy growth the
  // last few days carry most of the weight), so one front-loaded outlier would
  // drag every projection down with it. Equal say per day, and a median rather
  // than a mean, keeps one odd day from moving the whole shape.
  const dayCums = [];
  let total = 0;
  for (const [, v] of keep) {
    if (!(v.seconds > 0)) continue;
    const cum = [];
    let run = 0;
    for (let h = 0; h < 24; h++) { run += v.hours[h]; cum.push(run / v.seconds); }
    cum[23] = 1;
    dayCums.push(cum);
    total += v.seconds;
  }
  if (dayCums.length < SHAPE_MIN_DAYS || !(total > 0)) return null;
  const median = (xs) => {
    const s = xs.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const hourCum = [];
  for (let h = 0; h < 24; h++) hourCum.push(median(dayCums.map((cum) => cum[h])));
  // Pointwise medians of monotone series are themselves monotone, but a float
  // wobble should never let the curve tick backwards.
  for (let h = 1; h < 24; h++) hourCum[h] = Math.max(hourCum[h], hourCum[h - 1]);
  hourCum[23] = 1;

  // Weekday curve has to survive a growth trend: raw weekday sums would mostly
  // rank the weekdays by how recently each last occurred. So express each day as
  // a ratio to the centered 7-day average around it (which cancels the trend),
  // then average those ratios per weekday.
  let dow = new Array(7).fill(1 / 7);
  if (keep.length >= SHAPE_MIN_DOW_DAYS) {
    const vals = keep.map(([, v]) => v.seconds);
    const ratios = new Array(7).fill(null).map(() => []);
    for (let i = 0; i < keep.length; i++) {
      const lo = Math.max(0, i - 3);
      const hi = Math.min(vals.length - 1, i + 3);
      let sum = 0;
      for (let j = lo; j <= hi; j++) sum += vals[j];
      const local = sum / (hi - lo + 1);
      if (local > 0) ratios[keep[i][1].dow].push(vals[i] / local);
    }
    const avg = ratios.map((xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0));
    const sum = avg.reduce((a, b) => a + b, 0);
    // Every weekday must have been observed, else the shares are not comparable.
    if (sum > 0 && avg.every((x) => x > 0)) dow = avg.map((x) => x / sum);
  }

  return {
    hourCum,
    dow,
    basisDays: dayCums.length,
    basisSeconds: Math.round(total),
    firstDay: keep[0][0],
    lastDay: keep[keep.length - 1][0],
  };
}

// Analytics -> Time Played. Total wall-clock time players spent COMPLETING
// quizzes, bucketed by calendar day in US Eastern (matching the rest of the
// admin's clock), across the FULL quiz_results history — this is the earliest
// data available, so it goes back as far as the table does. time_elapsed is the
// seconds from Play to finish on each completed game; we sum it per day and also
// count the plays that contributed. Registered and anonymous plays both count.
// The returned series is gap-filled: every calendar day from the first recorded
// play to the last is present (zeros included) so quiet days still plot on the
// chart. Rows with no/blank time (or unparseable timestamps) are skipped.
function buildTimeByDay(rows) {
  const byDay = new Map(); // 'YYYY-MM-DD' (ET) -> { seconds, plays, dow, hours[24] }
  for (const r of rows || []) {
    const t = r.time_elapsed;
    if (!r.created_at || typeof t !== 'number' || !(t >= 0)) continue;
    const d = new Date(r.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const p = etParts(d); // hour / dow / YYYY-MM-DD in America/New_York
    const cur = byDay.get(p.day) || { seconds: 0, plays: 0, dow: p.dow, hours: new Array(24).fill(0) };
    cur.seconds += t;
    cur.plays += 1;
    cur.hours[p.hour] += t;
    byDay.set(p.day, cur);
  }
  const keys = Array.from(byDay.keys()).sort();
  const series = [];
  let totalSeconds = 0, totalPlays = 0, busiest = null;
  if (keys.length) {
    // Walk every calendar day between the first and last recorded play. We hold
    // the cursor at UTC midnight and step it with UTC date math so the YYYY-MM-DD
    // labels are pure calendar arithmetic, immune to DST hour shifts.
    const cur = new Date(`${keys[0]}T00:00:00Z`);
    const stop = new Date(`${keys[keys.length - 1]}T00:00:00Z`);
    while (cur.getTime() <= stop.getTime()) {
      const day = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}-${String(cur.getUTCDate()).padStart(2, '0')}`;
      const v = byDay.get(day) || { seconds: 0, plays: 0 };
      series.push({ day, seconds: v.seconds, plays: v.plays });
      totalSeconds += v.seconds;
      totalPlays += v.plays;
      if (v.seconds > 0 && (!busiest || v.seconds > busiest.seconds)) busiest = { day, seconds: v.seconds, plays: v.plays };
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  const activeDays = keys.length;
  return {
    series,
    shape: buildPlayShape(byDay, etParts(new Date()).day),
    totals: {
      totalSeconds,
      totalPlays,
      activeDays,
      daysTracked: series.length,
      firstDay: keys[0] || null,
      lastDay: keys.length ? keys[keys.length - 1] : null,
      busiestDay: busiest,
      avgActiveDaySeconds: activeDays ? Math.round(totalSeconds / activeDays) : 0,
    },
  };
}

// Analytics -> Quiz Plays: today's ten most engaged players.
//
// "Engaged time" is the sum of time_elapsed over the games a player finished
// TODAY (Eastern, by when they played, not by which puzzle date they played).
// A few rows record implausible times because a tab sat idle on a finished
// puzzle, so each play is CAPPED at ENGAGED_CAP seconds before summing; one
// abandoned tab can no longer buy the top spot. The uncapped total is returned
// alongside as rawSeconds so nothing is hidden.
//
// Players are keyed the same way as everywhere else in the admin (registered
// user_id, else browser anon_id, else the lone row id). Labels come from the
// signup rows for registered players and from buildAnonPlayers' stable Guest
// handles for anonymous browsers.
const ENGAGED_CAP = 20 * 60;
function buildTopPlayersToday(rows, signups, anonBase, quizTitles, limit = 10) {
  const today = etParts(new Date()).day;
  const nameById = new Map((signups || []).map((u) => [u.id, u.username || '(no name)']));
  const emailById = new Map((signups || []).map((u) => [u.id, u.email || null]));
  const labelByKey = new Map((anonBase || []).map((p) => [p.key, p.label]));
  // A daily-game play's quiz_id is the dated puzzle id ('crux-8-7-26'), which is
  // not in QUIZZES, so fall back to the game's own name rather than showing the
  // raw slug.
  const titleOf = (quizId) => {
    const t = quizTitles && quizTitles.get(quizId);
    if (t) return t;
    const m = DAILY_DATED_RE.exec(quizId || '');
    return m ? dailyGameName(m[1]) : quizId;
  };

  const byPlayer = new Map();
  let playsToday = 0, secondsToday = 0, rawToday = 0;

  for (const r of rows || []) {
    if (!r.created_at) continue;
    const d = new Date(r.created_at);
    if (Number.isNaN(d.getTime())) continue;
    if (etParts(d).day !== today) continue;

    const key = playerKey(r);
    let g = byPlayer.get(key);
    if (!g) {
      g = {
        key,
        type: r.user_id ? 'Registered' : 'Anonymous',
        name: r.user_id ? (nameById.get(r.user_id) || '(deleted user)') : (labelByKey.get(key) || 'Guest'),
        email: r.user_id ? (emailById.get(r.user_id) || null) : null,
        seconds: 0, rawSeconds: 0, plays: 0, capped: 0,
        games: new Set(), firstAt: '', lastAt: '', topGame: null,
        device: null, geo: null,
      };
      byPlayer.set(key, g);
    }
    const t = r.time_elapsed;
    const has = typeof t === 'number' && t >= 0;
    const capped = has ? Math.min(t, ENGAGED_CAP) : 0;
    g.seconds += capped;
    g.rawSeconds += has ? t : 0;
    if (has && t > ENGAGED_CAP) g.capped += 1;
    g.plays += 1;
    g.games.add(r.quiz_id);
    const at = String(r.created_at);
    if (!g.firstAt || at < g.firstAt) g.firstAt = at;
    if (at > g.lastAt) g.lastAt = at;
    const meta = playMeta(r);
    if (!g.device && meta.device) g.device = meta.device;
    if (!g.geo && meta.geo) g.geo = meta.geo;
    if (!g.topGame || capped > g.topGame.seconds) {
      g.topGame = { quizId: r.quiz_id, title: titleOf(r.quiz_id), seconds: capped };
    }

    playsToday += 1;
    secondsToday += capped;
    rawToday += has ? t : 0;
  }

  const players = Array.from(byPlayer.values())
    .map((g) => ({
      key: g.key,
      type: g.type,
      name: g.name,
      email: g.email,
      seconds: g.seconds,
      rawSeconds: g.rawSeconds,
      plays: g.plays,
      capped: g.capped,
      games: g.games.size,
      firstAt: g.firstAt || null,
      lastAt: g.lastAt || null,
      topGame: g.topGame,
      device: g.device,
      geo: g.geo,
    }))
    .sort((a, b) => b.seconds - a.seconds || b.plays - a.plays || (a.name || '').localeCompare(b.name || ''))
    .slice(0, limit);

  return {
    day: today,
    capSeconds: ENGAGED_CAP,
    players,
    totals: {
      playersToday: byPlayer.size,
      playsToday,
      secondsToday,
      rawSecondsToday: rawToday,
      avgSecondsPerPlayer: byPlayer.size ? Math.round(secondsToday / byPlayer.size) : 0,
    },
  };
}

// Daily Games tab (top-level "Daily Games"). Every daily-game play lands in
// quiz_results under a per-puzzle quiz_id shaped "<game>-<M>-<D>-<YY>"
// (e.g. crux-7-6-26), so the trailing date is the PUZZLE's own date.
//
// A player's identity is the same rule the rest of the admin uses: registered
// user_id, else the browser anon_id, else the lone row id, so anonymous
// browsers (the bulk of daily-game players) are counted. time_elapsed is the
// seconds from Play to finish; the average skips rows with no/blank time. Rows
// whose id does not parse as a dated daily puzzle are ignored.
// Per-game stats for the daily games. Every completed play carries its own
// puzzle date in the quiz_id ('links-7-6-26'), so day counts come from the
// quiz_id, not the row timestamp. Each game reports its all-time averages
// (plays per active day, time per play), its unique-player count, and the same
// figures for TODAY's puzzle (Eastern date).
function buildDailyByGame(rows) {
  const today = etParts(new Date()).day; // YYYY-MM-DD in America/New_York
  const playerKeyOf = playerKey;
  const stats = new Map(
    DAILY_GAMES.map((g) => [
      g.key,
      { key: g.key, title: g.title, plays: 0, timeSum: 0, timeN: 0, players: new Set(), days: new Set(), tPlays: 0, tTimeSum: 0, tTimeN: 0, tPlayers: new Set() },
    ])
  );
  const allPlayers = new Set();
  const allDays = new Set();
  const todayPlayers = new Set();
  let grandPlays = 0, grandTimeSum = 0, grandTimeN = 0;
  let todayPlays = 0, todayTimeSum = 0, todayTimeN = 0;

  for (const r of rows || []) {
    const m = DAILY_DATED_RE.exec(r.quiz_id || '');
    if (!m) continue;
    const [, gk, mm, dd, yy] = m;
    const s = stats.get(gk);
    if (!s) continue;
    const day = `20${yy}-${String(Number(mm)).padStart(2, '0')}-${String(Number(dd)).padStart(2, '0')}`;
    const pkey = playerKeyOf(r);
    const t = r.time_elapsed;
    const hasTime = typeof t === 'number' && t >= 0;

    s.plays += 1;
    s.players.add(pkey);
    s.days.add(day);
    if (hasTime) { s.timeSum += t; s.timeN += 1; }

    allPlayers.add(pkey);
    allDays.add(day);
    grandPlays += 1;
    if (hasTime) { grandTimeSum += t; grandTimeN += 1; }

    if (day === today) {
      s.tPlays += 1;
      s.tPlayers.add(pkey);
      if (hasTime) { s.tTimeSum += t; s.tTimeN += 1; }
      todayPlays += 1;
      todayPlayers.add(pkey);
      if (hasTime) { todayTimeSum += t; todayTimeN += 1; }
    }
  }

  // Days LIVE, not days active: the span from a game's first puzzle to today,
  // so a game with quiet days is not flattered by dividing through a smaller
  // denominator. This is the divisor behind the chart's "per day live" basis.
  const daysBetween = (from, to) => {
    const a = Date.parse(`${from}T00:00:00Z`), b = Date.parse(`${to}T00:00:00Z`);
    if (!(a >= 0) || !(b >= 0)) return 0;
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  };
  const games = DAILY_GAMES.map((g) => {
    const s = stats.get(g.key);
    const dayList = Array.from(s.days).sort();
    const firstDay = dayList[0] || null;
    const lastDay = dayList.length ? dayList[dayList.length - 1] : null;
    const daysLive = firstDay ? daysBetween(firstDay, today) : 0;
    return {
      key: s.key,
      title: s.title,
      plays: s.plays,
      players: s.players.size,
      daysActive: s.days.size,
      firstDay,
      lastDay,
      daysLive,
      avgPlays: s.days.size ? Math.round((s.plays / s.days.size) * 10) / 10 : null,
      avgTime: s.timeN ? Math.round(s.timeSum / s.timeN) : null,
      today: {
        plays: s.tPlays,
        players: s.tPlayers.size,
        avgTime: s.tTimeN ? Math.round(s.tTimeSum / s.tTimeN) : null,
      },
    };
  }).sort((a, b) => b.plays - a.plays || a.title.localeCompare(b.title));

  const dayKeys = Array.from(allDays).sort();
  return {
    games,
    totals: {
      today,
      totalPlays: grandPlays,
      totalPlayers: allPlayers.size,
      daysTracked: dayKeys.length,
      avgPlays: dayKeys.length ? Math.round((grandPlays / dayKeys.length) * 10) / 10 : null,
      avgTime: grandTimeN ? Math.round(grandTimeSum / grandTimeN) : null,
      todayPlays,
      todayPlayers: todayPlayers.size,
      todayAvgTime: todayTimeN ? Math.round(todayTimeSum / todayTimeN) : null,
      firstDay: dayKeys.length ? dayKeys[0] : null,
      lastDay: dayKeys.length ? dayKeys[dayKeys.length - 1] : null,
    },
  };
}

export const metadata = {
  title: 'Editor\'s Desk | Mind Loft',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!isAdmin()) {
    redirect('/admin/login');
  }

  const [submissionsRes, extrasRes, votesRes, complaintsRes, alertsRes, trendingRes, totalViewsRes, listCommentsRes, voteCountsRes, editorNotesRes, quizUsersRes, quizTrendingRes, quizTotalViewsRes, quizResultsRes, visitorActiveRes] = await Promise.all([
    fetchAllRows(supabaseAdmin, 'user_lists', '*', [['submitted_at', false], 'id']),
    fetchAllRows(supabaseAdmin, 'extras', 'list_id, item_name, added_at', [['added_at', false], 'list_id', 'item_name']),
    fetchAllRows(supabaseAdmin, 'votes', 'list_id, item_name, score, updated_at', [['updated_at', false], 'list_id', 'item_name']),
    fetchAllRows(supabaseAdmin, 'complaints', '*', [['created_at', false], 'id']),
    supabaseAdmin
      .from('consensus_alerts')
      .select('id, list_id, item_name, change_type, rank, detected_at')
      .eq('resolved', false)
      .order('detected_at', { ascending: false }),
    supabaseAdmin.rpc('trending_views', { p_hours: 24 }),
    fetchAllRows(supabaseAdmin, 'views', 'list_id, count', ['list_id']),
    fetchAllRows(supabaseAdmin, 'list_comments', 'id, list_id, name, body, created_at, editor_response', [['created_at', false], 'id']),
    fetchAllRows(supabaseAdmin, 'vote_events', 'id, list_id, item_name, delta, created_at', ['id']),
    fetchAllRows(supabaseAdmin, 'list_editor_notes', 'id, list_id, note, created_at', [['created_at', false], 'id']),
    // Quiz email signups (the /quiz join form). Service-role read; quiz_users
    // has RLS with no policies, so only the admin key can see the emails.
    fetchAllRows(supabaseAdmin, 'quiz_users', 'id, username, email, created_at', [['created_at', false], 'id']),
    // Quiz analytics: rolling-24h views (quiz_view_events), all-time view
    // totals (quiz_views), and every completed game (quiz_results) for play
    // counts + average score per quiz.
    supabaseAdmin.rpc('quiz_trending_views', { p_hours: 24 }),
    fetchAllRows(supabaseAdmin, 'quiz_views', 'quiz_id, count', ['quiz_id']),
    loadAdminResultsCached(supabaseAdmin),
    // Site-wide distinct-visitor DAU/WAU/MAU (migration 30). Best-effort:
    // returns an error if the RPC/columns aren't applied yet, handled below.
    supabaseAdmin.rpc('visitor_active_counts'),
  ]);

  if (submissionsRes.error) {
    console.error('admin user_lists fetch error', submissionsRes.error);
  }
  if (extrasRes.error) {
    console.error('admin extras fetch error', extrasRes.error);
  }
  if (votesRes.error) {
    console.error('admin votes fetch error', votesRes.error);
  }

  const lists = (submissionsRes.data || []).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    type: row.type,
    blurb: row.blurb,
    items: (row.sources?.ai?.items) || row.vote_items || [],
    published: row.published,
    submittedAt: row.submitted_at,
  }));

  // Build a (list_id, item_name) -> score map for fast lookup
  const scoreMap = new Map();
  for (const v of votesRes.data || []) {
    scoreMap.set(`${v.list_id} ${v.item_name}`, v.score);
  }

  // Group extras by list_id
  const extrasByList = new Map();
  for (const row of extrasRes.data || []) {
    if (!extrasByList.has(row.list_id)) extrasByList.set(row.list_id, []);
    extrasByList.get(row.list_id).push({
      name: row.item_name,
      score: scoreMap.get(`${row.list_id} ${row.item_name}`) || 0,
      addedAt: row.added_at,
    });
  }

  const extras = Array.from(extrasByList.entries())
    .map(([listId, items]) => ({ listId, items }))
    .sort((a, b) => {
      // Most recent submission first (items are already newest-first per group)
      const aNewest = a.items[0]?.addedAt || '';
      const bNewest = b.items[0]?.addedAt || '';
      return bNewest.localeCompare(aNewest);
    });

  if (complaintsRes && complaintsRes.error) {
    console.error('admin complaints fetch error', complaintsRes.error);
  }
  const complaints = ((complaintsRes && complaintsRes.data) || []).map((row) => ({
    id: row.id,
    listId: row.list_id,
    listTitle: row.list_title,
    message: row.message,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    editorResponse: row.editor_response || null,
  }));

  if (voteCountsRes && voteCountsRes.error) {
    console.error('admin vote_events fetch error', voteCountsRes.error);
  }
  const voteCountMap = new Map();
  for (const ev of (voteCountsRes && voteCountsRes.data) || []) {
    const k = `${ev.list_id}::${ev.item_name}`;
    voteCountMap.set(k, (voteCountMap.get(k) || 0) + 1);
  }
  const voteStandings = (votesRes.data || []).map((row) => ({
    listId: row.list_id,
    itemName: row.item_name,
    score: row.score,
    votes: voteCountMap.get(`${row.list_id}::${row.item_name}`) || 0,
    updatedAt: row.updated_at,
  }));
  const comments = ((listCommentsRes && listCommentsRes.data) || []).map((row) => ({
    id: row.id,
    listId: row.list_id,
    name: row.name,
    body: row.body,
    createdAt: row.created_at,
    editorResponse: row.editor_response || null,
  }));
  // vote_events was read TWICE: once as select('*') limited to the newest 200
  // for display, and again in full for the per-item counts. One read of the
  // five columns either use serves both. Native voting was removed 2026-06-18,
  // so this table no longer grows.
  const voteEvents = ((voteCountsRes && voteCountsRes.data) || [])
    .slice()
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 200)
    .map((row) => ({
      id: row.id,
      listId: row.list_id,
      itemName: row.item_name,
      delta: row.delta,
      createdAt: row.created_at,
    }));

  if (alertsRes && alertsRes.error) {
    console.error('admin consensus_alerts fetch error', alertsRes.error);
  }
  const listTitles = new Map(LISTS.map((l) => [l.id, l.title]));
  const alerts = ((alertsRes && alertsRes.data) || []).map((row) => {
    const descs = DESCRIPTIONS[row.list_id] || {};
    const imgs = HERO_IMAGES[row.list_id] || {};
    return {
      id: row.id,
      listId: row.list_id,
      listTitle: listTitles.get(row.list_id) || row.list_id,
      itemName: row.item_name,
      changeType: row.change_type,
      rank: row.rank,
      detectedAt: row.detected_at,
      hasDescription: Boolean(descs[row.item_name]),
      hasHeroImage: Boolean(imgs[row.item_name]),
    };
  });

  // Per-list visitor counts over the past 24 hours (from view_events),
  // plus all-time totals (from views) for context. Covers every curated
  // list and any published user list that logged a view.
  if (trendingRes && trendingRes.error) {
    console.error('admin trending_views fetch error', trendingRes.error);
  }
  if (totalViewsRes && totalViewsRes.error) {
    console.error('admin views fetch error', totalViewsRes.error);
  }
  const views24Map = new Map(
    ((trendingRes && trendingRes.data) || []).map((row) => [row.list_id, Number(row.cnt) || 0])
  );
  const totalViewsMap = new Map(
    ((totalViewsRes && totalViewsRes.data) || []).map((row) => [row.list_id, Number(row.count) || 0])
  );
  const viewListIds = new Set([
    ...LISTS.map((l) => l.id),
    ...views24Map.keys(),
  ]);
  const views24h = Array.from(viewListIds)
    .map((listId) => ({
      listId,
      title: listTitles.get(listId) || listId,
      views24h: views24Map.get(listId) || 0,
      viewsTotal: totalViewsMap.get(listId) || 0,
    }))
    .sort(
      (a, b) =>
        b.views24h - a.views24h ||
        b.viewsTotal - a.viewsTotal ||
        a.title.localeCompare(b.title)
    );

  const editorNotes = ((editorNotesRes && editorNotesRes.data) || []).map((row) => ({ id: row.id, listId: row.list_id, note: row.note, createdAt: row.created_at }));

  if (quizUsersRes && quizUsersRes.error) {
    console.error('admin quiz_users fetch error', quizUsersRes.error);
  }
  const quizSignups = ((quizUsersRes && quizUsersRes.data) || []).map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
  }));

  // Per-quiz analytics: 24h views, all-time views, plays, and average score.
  if (quizTrendingRes && quizTrendingRes.error) {
    console.error('admin quiz_trending_views fetch error', quizTrendingRes.error);
  }
  if (quizTotalViewsRes && quizTotalViewsRes.error) {
    console.error('admin quiz_views fetch error', quizTotalViewsRes.error);
  }
  if (quizResultsRes && quizResultsRes.error) {
    console.error('admin quiz_results fetch error', quizResultsRes.error);
  }
  const quizViews24Map = new Map(
    ((quizTrendingRes && quizTrendingRes.data) || []).map((row) => [row.quiz_id, Number(row.cnt) || 0])
  );
  const quizTotalViewsMap = new Map(
    ((quizTotalViewsRes && quizTotalViewsRes.data) || []).map((row) => [row.quiz_id, Number(row.count) || 0])
  );
  // plays + score sum per quiz, from completed games, plus a mobile-play count
  // (is_mobile === true) so Quiz Stats can show the mobile share per quiz.
  const quizPlaysMap = new Map();
  const quizPlays24Map = new Map();
  const quizScoreSumMap = new Map();
  const quizMobileMap = new Map();
  const quizPlaysCutoff24 = Date.now() - 24 * 60 * 60 * 1000;
  for (const r of (quizResultsRes && quizResultsRes.data) || []) {
    quizPlaysMap.set(r.quiz_id, (quizPlaysMap.get(r.quiz_id) || 0) + 1);
    if (r.created_at && new Date(r.created_at).getTime() >= quizPlaysCutoff24) {
      quizPlays24Map.set(r.quiz_id, (quizPlays24Map.get(r.quiz_id) || 0) + 1);
    }
    quizScoreSumMap.set(r.quiz_id, (quizScoreSumMap.get(r.quiz_id) || 0) + (Number(r.score) || 0));
    if (r.is_mobile === true) quizMobileMap.set(r.quiz_id, (quizMobileMap.get(r.quiz_id) || 0) + 1);
  }
  // TRACKED_PAGES and this map moved to lib/admin-quiz-titles.js, shared with
  // /api/admin/player-plays so a play is titled the same way in the summary
  // here and in the detail the route serves behind an expanded row.
  const quizTitles = buildQuizTitles();
  // Per-signup play history: every completed game attributed to each user
  // (quiz_results.user_id -> quiz_users.id), newest first, with the quiz title
  // resolved. Lets the Quiz Signups panel show which quizzes a person played
  // and how many times.
  const playsByUser = new Map();
  for (const r of (quizResultsRes && quizResultsRes.data) || []) {
    if (!r.user_id) continue;
    if (!playsByUser.has(r.user_id)) playsByUser.set(r.user_id, []);
    playsByUser.get(r.user_id).push(playRow(r, quizTitles.get(r.quiz_id)));
  }
  // Anonymous players: completed games with no signed-up user_id, batched by
  // browser (anon_id) under a stable random number. Mirrors the signups table.
  const anonPlayersBase = buildAnonPlayers((quizResultsRes && quizResultsRes.data) || []);
  // Per-player game history (which quizzes a browser played and when), keyed the
  // same way buildAnonPlayers batches rows (a:<anon_id>, else r:<row id>), so the
  // Anonymous Players panel can expand a row to its individual plays, the same
  // detail the Quiz Signups panel shows for registered users.
  const anonHistoryByKey = new Map();
  for (const r of (quizResultsRes && quizResultsRes.data) || []) {
    if (r.user_id) continue;
    const key = playerKey(r);
    if (!anonHistoryByKey.has(key)) anonHistoryByKey.set(key, []);
    anonHistoryByKey.get(key).push(playRow(r, quizTitles.get(r.quiz_id)));
  }
  // NOTE the absence of `history` / `plays` in what these two hand back. The
  // per-play detail used to ship inside this page so an expanded row had it
  // ready: measured 2026-08-28 that was 72,254 play objects and ~34MB of a
  // 35.7MB response, to serve rows the admin opens one at a time. The collapsed
  // tables render `stats` alone, which is a couple of dozen scalars, so the
  // detail now comes from /api/admin/player-plays on expand. The arrays are
  // still built here because playerStats is computed from them; they simply
  // stop at the network boundary.
  const anonPlayers = anonPlayersBase.map((p) => {
    const history = (anonHistoryByKey.get(p.key) || []).sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
    const stats = playerStats(history);
    return {
      ...p,
      playCount: history.length,
      stats,
      devices: stats.devices,
      browsers: stats.browsers,
      geos: stats.geos,
      oses: stats.oses,
    };
  });

  const quizSignupsWithPlays = quizSignups.map((s) => {
    const plays = (playsByUser.get(s.id) || []).sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
    const stats = playerStats(plays);
    return {
      ...s,
      playCount: plays.length,
      stats,
      devices: stats.devices,
      browsers: stats.browsers,
      geos: stats.geos,
      oses: stats.oses,
    };
  });
  const quizIds = new Set([
    ...(Array.isArray(QUIZZES) ? QUIZZES.map((q) => q.id) : []),
    ...quizViews24Map.keys(),
    ...quizTotalViewsMap.keys(),
    ...quizPlaysMap.keys(),
  ]);
  // THE IQ TESTS COUNT AS QUIZZES (owner, 2026-09-29). They post no result
  // rows (standalone, no board), so a test's PLAYS are its finish pings,
  // iq-<slug>-finished on the view rail, folded into the test's own row, and
  // the finish rows themselves are not listed. Every test is listed even
  // before its first view, the way every quiz in QUIZZES is.
  const IQ_ROWS = new Map(IQ_TESTS.map((t) => [`iq-${t.slug}`, t]));
  for (const id of IQ_ROWS.keys()) quizIds.add(id);
  for (const id of [...quizIds]) if (/^iq-.+-finished$/.test(id)) quizIds.delete(id);
  const quizStats = Array.from(quizIds)
    .map((quizId) => {
      const iqTest = IQ_ROWS.get(quizId);
      if (iqTest) {
        const fin = `${quizId}-finished`;
        return {
          quizId,
          title: `${iqTest.name} IQ Test`,
          href: `/iq/${iqTest.slug}`,
          views24h: quizViews24Map.get(quizId) || 0,
          viewsTotal: quizTotalViewsMap.get(quizId) || 0,
          plays: quizTotalViewsMap.get(fin) || 0,
          plays24h: quizViews24Map.get(fin) || 0,
          mobilePlays: 0,
          avgScore: null,
        };
      }
      const plays = quizPlaysMap.get(quizId) || 0;
      const scoreSum = quizScoreSumMap.get(quizId) || 0;
      return {
        quizId,
        title: quizTitles.get(quizId) || quizId,
        href: TRACKED_PAGES[quizId] ? TRACKED_PAGES[quizId].href : `/quiz/${encodeURIComponent(quizId)}`,
        views24h: quizViews24Map.get(quizId) || 0,
        viewsTotal: quizTotalViewsMap.get(quizId) || 0,
        plays,
        plays24h: quizPlays24Map.get(quizId) || 0,
        mobilePlays: quizMobileMap.get(quizId) || 0,
        avgScore: plays > 0 ? Math.round((scoreSum / plays) * 10) / 10 : null,
      };
    })
    .sort(
      (a, b) =>
        b.views24h - a.views24h ||
        b.plays - a.plays ||
        b.viewsTotal - a.viewsTotal ||
        a.title.localeCompare(b.title)
    );

  // DAU/WAU/MAU. players = distinct quiz players (works now, full history);
  // visitors = distinct site visitors from visitor_active_counts() (fills in
  // once migration 30 is applied, else null so the UI shows a "pending" note).
  const activePlayers = activePlayerCounts((quizResultsRes && quizResultsRes.data) || []);
  if (visitorActiveRes && visitorActiveRes.error) {
    console.error('admin visitor_active_counts fetch error', visitorActiveRes.error);
  }
  const vRow = (visitorActiveRes && Array.isArray(visitorActiveRes.data) && visitorActiveRes.data[0]) || null;
  const activeVisitors = vRow
    ? { dau: Number(vRow.dau) || 0, wau: Number(vRow.wau) || 0, mau: Number(vRow.mau) || 0 }
    : null;
  const activeUsers = { players: activePlayers, visitors: activeVisitors };

  // Player-location maps (Analytics -> Player Map): users + games played by
  // location over the full located-play history (migrations 26/27), resolved
  // server-side so the ~2MB coordinate index never ships to the client.
  const geoMap = buildGeoMapData((quizResultsRes && quizResultsRes.data) || []);

  // Daily-games return-play distribution (Analytics -> Return Play).
  const dailyRetention = buildDailyRetention((quizResultsRes && quizResultsRes.data) || []);

  // Total time spent playing quizzes per day (Analytics -> Time Played), full
  // history, gap-filled.
  const timeByDay = buildTimeByDay((quizResultsRes && quizResultsRes.data) || []);

  // New users per day (Analytics -> Time Played, below the time chart): new
  // first-play players and new registered signups, gap-filled ET series.
  const newUsers = buildNewUsersByDay(
    (quizResultsRes && quizResultsRes.data) || [],
    (quizUsersRes && quizUsersRes.data) || [],
  );

  // Daily Games tab: the daily games' plays bucketed by puzzle date, with
  // unique players / total plays / avg time per play, per day and per game.
  const dailyByGame = buildDailyByGame((quizResultsRes && quizResultsRes.data) || []);

  // Analytics -> Quiz Plays: today's ten most engaged players, per-play time
  // capped so an idle tab cannot top the board.
  const topPlayersToday = buildTopPlayersToday(
    (quizResultsRes && quizResultsRes.data) || [],
    quizSignups,
    anonPlayersBase,
    quizTitles,
  );

  return (
    <AdminClient
      initialLists={lists}
      initialExtras={extras}
      initialComplaints={complaints}
      initialVoteStandings={voteStandings}
      initialVoteEvents={voteEvents}
      initialComments={comments}
      initialEditorNotes={editorNotes}
      initialAlerts={alerts}
      initialViews24h={views24h}
      initialQuizSignups={quizSignupsWithPlays}
      initialQuizStats={quizStats}
      initialAnonPlayers={anonPlayers}
      initialActiveUsers={activeUsers}
      initialGeoMap={geoMap}
      initialDailyRetention={dailyRetention}
      initialTimeByDay={timeByDay}
      initialNewUsers={newUsers}
      initialDailyByGame={dailyByGame}
      initialTopPlayersToday={topPlayersToday}
    />
  );
}
