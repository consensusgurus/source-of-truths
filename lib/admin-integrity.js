// CHEAT WATCH (owner, 2026-11-07): the admin desk's queue of players whose
// daily results look too good to be human.
//
// THIS IS A QUEUE, NOT A VERDICT. Same stance as lib/contest-fraud: a strong
// player can trip one signal on their own, and a high number is a reason to
// open the player's plays and look, never a reason to act automatically.
// Nothing here hides anyone. Hiding is a manual line in lib/hidden-players.
//
// WHAT IT LOOKS FOR. Built from the case that prompted it (LoftyStandard,
// hidden 2026-11-07): over about ten days that player won 444 of 562 daily
// boards, often in a fraction of the next best time (Dossier 10/10 in 2s every
// day), and posted perfect scores on crowd games where the next best was far
// behind. Before 2026-10-28 the same player scored like anyone else. Each
// signal below is one of those tells, measured over the recent window:
//
//   winRate    share of their first-try daily boards (field of 5+) they top
//   blowouts   wins at the top score in under 40% of the next best time there
//   instant    perfect finishes faster than 0.6 seconds per point possible
//   soleTops   boards where they hold the top score and nobody else reaches it
//   jump       perfect-finish rate jumped (40% or less before, 80% or more after)
//   replays    days they posted 3+ results on one non-Arcade daily
//   scouted    boards someone looked at first through a throwaway guest (below)
//
// SCOUTING (owner, 2026-11-22). Built from schnabinator: a fresh private tab
// is a brand new guest, so a player can open a daily in one, see the answers
// on a throwaway first try, then play it "first try" signed in. On 11/22 one
// Sydney iPhone made 80+ guests, about one a minute, each 1 to 3 plays scored
// low in seconds, and the account then went 10/10 and 9/10 on those boards.
// A THROWAWAY GUEST is an anon-only player whose whole history is 3 rows or
// fewer inside an hour, all from one device fingerprint (city, region,
// country, phone or desktop, OS, browser, time zone, language). A board is
// SCOUTED for a player when a throwaway with the player's exact fingerprint
// played it in the 6 hours before the player's first try. Common fingerprints
// (a big city on iPhone Safari) give a few chance matches, so a player is
// only flagged at 3+ scouted boards AND 15%+ of their boards. BURSTS lists
// every fingerprint that made 10+ throwaway guests in one day, linked to an
// account or not, since those guests also pad new-player and DAU counts.
//
// THE FIRST TRY. A player's representative row on a board is their earliest
// row on it (the admin cache carries no `abandoned` flag), matching the
// first-try rule the public boards use for ordinary dailies. Arcade games are
// left out entirely: they are built for replays and score on the best run.

import { supabaseAdmin } from './supabase-server';
import { fetchAllRows } from './fetch-all';
import { loadAdminResultsCached } from './admin-results-cache';
import { playerKey } from './admin-plays';
import { isArcadeQuizId } from './daily-games';
import { HIDDEN_PLAYERS } from './hidden-players';

const DAY = 24 * 60 * 60 * 1000;
const DAILY_RE = /^[a-z0-9]+-\d{1,2}-\d{1,2}-\d{2}/;
export const WINDOW_DAYS = 14;
const MIN_FIELD = 5;        // a board needs this many players to count
const MIN_BOARDS = 10;      // a player needs this many counted boards to be scored
const BLOWOUT_RATIO = 0.4;  // my time <= 40% of the next best at the same score
const INSTANT_SEC_PER_POINT = 0.6;
const LIST_LIMIT = 60;
export const SCOUT = {
  maxGuestRows: 3,                 // a throwaway guest has this many rows or fewer, ever
  guestSpanMs: 60 * 60 * 1000,     // all inside this span
  leadMs: 6 * 60 * 60 * 1000,      // guest play must come this soon before the player's first try
  minBoards: 3,                    // flag at this many scouted boards
  minShare: 0.15,                  // and this share of the player's boards
  burstMin: 10,                    // a fingerprint making this many throwaways in a day is a burst
};
const BURST_LIMIT = 20;

// Device fingerprint from the traffic columns. No city, no fingerprint: too
// coarse to tie two browsers together.
export function fingerprint(r) {
  if (!r || !r.city) return null;
  const dev = r.is_mobile === true ? 'Mobile' : r.is_mobile === false ? 'Desktop' : '?';
  return [r.city, r.region || '', r.country || '', dev, r.ua_os || '', r.ua_browser || '', r.timezone || '', r.language || ''].join('|');
}

// Throwaway guests in the window, indexed by fingerprint+board, plus bursts.
export function findThrowaways(rows, { since }) {
  const guests = new Map();
  for (const r of rows) {
    if (!r || r.user_id || !r.anon_id) continue;
    const k = `a:${r.anon_id}`;
    let g = guests.get(k);
    if (!g) { g = { n: 0, first: Infinity, last: -Infinity, fps: new Set(), plays: [] }; guests.set(k, g); }
    g.n += 1;
    if (g.n > SCOUT.maxGuestRows) continue;
    const t = Date.parse(r.created_at || '');
    if (Number.isFinite(t)) { g.first = Math.min(g.first, t); g.last = Math.max(g.last, t); }
    g.fps.add(fingerprint(r));
    g.plays.push({ q: r.quiz_id, t, score: num(r.score), total: num(r.total) });
  }
  const throwaway = new Set();
  const byFpBoard = new Map(); // fp|quizId -> [{ key, t, score, total }]
  const bursts = new Map();    // fp|day -> { fp, day, keys:Set, games: Map, first, last }
  for (const [k, g] of guests) {
    if (g.n > SCOUT.maxGuestRows || g.fps.size !== 1 || !Number.isFinite(g.first)) continue;
    if (g.first < since || g.last - g.first > SCOUT.guestSpanMs) continue;
    const fp = [...g.fps][0];
    if (!fp) continue;
    throwaway.add(k);
    for (const x of g.plays) {
      if (!x.q || !DAILY_RE.test(x.q) || !Number.isFinite(x.t)) continue;
      const bk = `${fp}|${x.q}`;
      let list = byFpBoard.get(bk);
      if (!list) { list = []; byFpBoard.set(bk, list); }
      list.push({ key: k, t: x.t, score: x.score, total: x.total });
    }
    const day = new Date(g.first).toISOString().slice(0, 10);
    const dk = `${fp}|${day}`;
    let b = bursts.get(dk);
    if (!b) { b = { fp, day, keys: new Set(), games: new Map(), first: g.first, last: g.first }; bursts.set(dk, b); }
    b.keys.add(k);
    b.first = Math.min(b.first, g.first);
    b.last = Math.max(b.last, g.last);
    for (const x of g.plays) {
      const game = String(x.q || '').split('-')[0];
      if (game) b.games.set(game, (b.games.get(game) || 0) + 1);
    }
  }
  return { throwaway, byFpBoard, bursts };
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const num = (v) => (v == null || v === '' ? null : Number(v));

// Pure: rows -> scored players. Exported for the unit check.
export function buildIntegrity(rows, { nowMs = Date.now(), windowDays = WINDOW_DAYS } = {}) {
  const since = nowMs - windowDays * DAY;
  // 1. Per board, every player's first row; and per player-board, attempt counts.
  const boards = new Map(); // quizId -> Map(key -> row)
  const attempts = new Map(); // key|quizId -> count
  const history = new Map(); // key -> [{ t, perfect }] all-time first tries, for the jump test
  const sorted = rows.slice().sort((a, b) => (a.id || 0) - (b.id || 0));
  for (const r of sorted) {
    const q = r && r.quiz_id;
    if (!q || !DAILY_RE.test(q) || isArcadeQuizId(q)) continue;
    const k = playerKey(r);
    const ak = `${k}|${q}`;
    attempts.set(ak, (attempts.get(ak) || 0) + 1);
    let b = boards.get(q);
    if (!b) { b = new Map(); boards.set(q, b); }
    if (b.has(k)) continue;
    b.set(k, r);
    const total = num(r.total);
    const t = Date.parse(r.created_at || '');
    if (Number.isFinite(t) && total > 0) {
      let h = history.get(k);
      if (!h) { h = []; history.set(k, h); }
      h.push({ t, perfect: num(r.score) >= total });
    }
  }

  // 1b. Throwaway guests, then scouted boards for everyone else.
  const { throwaway, byFpBoard, bursts } = findThrowaways(sorted, { since });
  const scout = new Map(); // key -> { boards, scouted, guests:Set, fps:Set, examples:[] }
  for (const [q, b] of boards) {
    for (const [k, r] of b) {
      if (throwaway.has(k)) continue;
      const t = Date.parse(r.created_at || '');
      if (!Number.isFinite(t) || t < since) continue;
      let s = scout.get(k);
      if (!s) { s = { boards: 0, scouted: 0, guests: new Set(), fps: new Set(), examples: [] }; scout.set(k, s); }
      s.boards += 1;
      const fp = fingerprint(r);
      const list = fp && byFpBoard.get(`${fp}|${q}`);
      if (!list) continue;
      const before = list.filter((x) => x.key !== k && x.t < t && t - x.t <= SCOUT.leadMs);
      if (!before.length) continue;
      s.scouted += 1;
      s.fps.add(fp);
      for (const x of before) s.guests.add(x.key);
      const guestBest = Math.max(...before.map((x) => x.score || 0));
      s.examples.push({ q, why: 'scouted', score: num(r.score), total: num(r.total), time: num(r.time_elapsed), guests: before.length, guestBest, lead: Math.round((t - Math.min(...before.map((x) => x.t))) / 60000) });
    }
  }
  const scoutFlag = (s) => !!s && s.scouted >= SCOUT.minBoards && s.scouted / s.boards >= SCOUT.minShare;

  // 2. Score every in-window board.
  const per = new Map(); // key -> aggregate
  const agg = (k) => {
    let a = per.get(k);
    if (!a) { a = { key: k, boards: 0, wins: 0, blowouts: 0, instant: 0, soleTops: 0, replayDays: 0, examples: [] }; per.set(k, a); }
    return a;
  };
  for (const [q, b] of boards) {
    const field = [...b.values()];
    const inWindow = field.filter((r) => { const t = Date.parse(r.created_at || ''); return Number.isFinite(t) && t >= since; });
    if (field.length < MIN_FIELD || !inWindow.length) continue;
    let best = -Infinity;
    for (const r of field) best = Math.max(best, num(r.score) || 0);
    const atBest = field.filter((r) => (num(r.score) || 0) === best)
      .map((r) => ({ r, t: num(r.time_elapsed) }))
      .sort((x, y) => (x.t ?? 1e12) - (y.t ?? 1e12));
    const leader = atBest[0] && atBest[0].r;
    for (const r of inWindow) {
      const k = playerKey(r);
      const a = agg(k);
      a.boards += 1;
      const score = num(r.score) || 0;
      const total = num(r.total);
      const time = num(r.time_elapsed);
      if (total >= 5 && score >= total && time != null && time >= 0 && time <= total * INSTANT_SEC_PER_POINT) {
        a.instant += 1;
        a.examples.push({ q, why: 'instant', score, total, time, field: field.length });
      }
      if (r !== leader) continue;
      a.wins += 1;
      if (atBest.length === 1) {
        a.soleTops += 1;
        const second = Math.max(...field.filter((x) => x !== r).map((x) => num(x.score) || 0));
        a.examples.push({ q, why: 'alone', score, total, time, field: field.length, next: second });
      } else {
        const nextT = atBest[1].t;
        if (time != null && nextT != null && nextT > 0 && time <= nextT * BLOWOUT_RATIO) {
          a.blowouts += 1;
          a.examples.push({ q, why: 'blowout', score, total, time, field: field.length, nextTime: nextT });
        }
      }
    }
  }
  for (const [ak, n] of attempts) {
    if (n < 3) continue;
    const k = ak.slice(0, ak.indexOf('|'));
    const q = ak.slice(ak.indexOf('|') + 1);
    const b = boards.get(q);
    const r = b && b.get(k);
    const t = r ? Date.parse(r.created_at || '') : NaN;
    if (Number.isFinite(t) && t >= since) agg(k).replayDays += 1;
  }

  // 3. Composite and plain-English flags.
  const hiddenIds = new Set(HIDDEN_PLAYERS.map((h) => h.userId));
  const out = [];
  for (const [k, s] of scout) if (scoutFlag(s)) agg(k);
  for (const a of per.values()) {
    const sc = scout.get(a.key);
    const scouted = scoutFlag(sc);
    if (a.boards < MIN_BOARDS && !scouted) continue;
    const winRate = a.boards ? a.wins / a.boards : 0;
    const h = (history.get(a.key) || []).sort((x, y) => x.t - y.t);
    let jump = null;
    if (h.length >= 20) {
      const mid = Math.floor(h.length / 2);
      const rate = (xs) => xs.filter((x) => x.perfect).length / xs.length;
      const before = rate(h.slice(0, mid)), after = rate(h.slice(mid));
      if (before <= 0.4 && after >= 0.8) jump = { before, after, at: new Date(h[mid].t).toISOString().slice(0, 10) };
    }
    const risk = Math.round(100 * Math.min(1,
      0.35 * clamp01((winRate - 0.15) / 0.45)
      + 0.20 * clamp01(a.blowouts / 10)
      + 0.20 * clamp01(a.instant / 5)
      + 0.10 * clamp01(a.soleTops / 10)
      + 0.10 * (jump ? 1 : 0)
      + 0.05 * clamp01(a.replayDays / 5)
      + (scouted ? 0.4 + 0.3 * clamp01(sc.scouted / 10) : 0)));
    const flags = [];
    if (winRate >= 0.3) flags.push(`Won ${Math.round(winRate * 100)}% of ${a.boards} boards`);
    if (a.blowouts) flags.push(`${a.blowouts} wins in under 40% of the next best time`);
    if (a.instant) flags.push(`${a.instant} perfect finishes under ${INSTANT_SEC_PER_POINT}s a point`);
    if (a.soleTops) flags.push(`${a.soleTops} top scores nobody else reached`);
    if (jump) flags.push(`Perfect rate went ${Math.round(jump.before * 100)}% to ${Math.round(jump.after * 100)}% around ${jump.at}`);
    if (a.replayDays) flags.push(`${a.replayDays} dailies played 3+ times`);
    if (scouted) flags.unshift(`Scouted ${sc.scouted} of ${sc.boards} boards with ${sc.guests.size} throwaway guests on the same device`);
    if (scouted) a.examples = sc.examples.slice(-6).reverse().concat(a.examples);
    const rank = (e) => (e.why === 'scouted' ? 0 : e.why === 'instant' ? 1 : 2);
    a.examples.sort((x, y) => rank(x) - rank(y));
    out.push({
      key: a.key,
      userId: a.key.startsWith('u:') ? a.key.slice(2) : null,
      hidden: a.key.startsWith('u:') && hiddenIds.has(a.key.slice(2)),
      risk, boards: a.boards, wins: a.wins, winRate: Math.round(winRate * 1000) / 10,
      blowouts: a.blowouts, instant: a.instant, soleTops: a.soleTops, replayDays: a.replayDays,
      scouted: scouted ? sc.scouted : 0,
      scoutGuests: scouted ? sc.guests.size : 0,
      device: scouted ? [...sc.fps][0].split('|').filter(Boolean).join(', ') : null,
      jump, flags, examples: a.examples.slice(0, 8),
    });
  }
  out.sort((x, y) => y.risk - x.risk || y.winRate - x.winRate);

  // 4. Bursts: fingerprints that made many throwaway guests in a day, and
  // which accounts (if any) they scouted for.
  const linkedByFp = new Map();
  for (const [k, s] of scout) {
    if (!s.scouted) continue;
    for (const fp of s.fps) {
      let m = linkedByFp.get(fp);
      if (!m) { m = new Map(); linkedByFp.set(fp, m); }
      m.set(k, s.scouted);
    }
  }
  const burstList = [...bursts.values()]
    .filter((b) => b.keys.size >= SCOUT.burstMin)
    .map((b) => ({
      day: b.day,
      device: b.fp.split('|').filter(Boolean).join(', '),
      guests: b.keys.size,
      first: new Date(b.first).toISOString(),
      last: new Date(b.last).toISOString(),
      games: [...b.games.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([g, n]) => ({ game: g, plays: n })),
      linked: [...((linkedByFp.get(b.fp)) || new Map()).entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([key, boards]) => ({ key, boards })),
    }))
    .sort((x, y) => (x.day < y.day ? 1 : x.day > y.day ? -1 : y.guests - x.guests))
    .slice(0, BURST_LIMIT);
  return { windowDays, scored: out.length, players: out.slice(0, LIST_LIMIT), bursts: burstList, throwawayGuests: throwaway.size };
}

async function computeIntegrity({ force = false } = {}) {
  const t0 = Date.now();
  const [res, users] = await Promise.all([
    loadAdminResultsCached(supabaseAdmin, { force }),
    fetchAllRows(supabaseAdmin, 'quiz_users', 'id, username, email', ['id']),
  ]);
  const rows = (res && res.data) || [];
  const byId = new Map(((users && users.data) || []).map((u) => [u.id, u]));
  const built = buildIntegrity(rows);
  const nameOf = (key) => {
    const u = key && key.startsWith('u:') ? byId.get(key.slice(2)) : null;
    return u ? u.username : `Guest ${String(key || '').slice(2, 8)}`;
  };
  for (const p of built.players) {
    const u = p.userId ? byId.get(p.userId) : null;
    p.name = nameOf(p.key);
    p.email = u ? (u.email || null) : null;
  }
  for (const b of built.bursts || []) for (const l of b.linked) l.name = nameOf(l.key);
  return { ...built, builtAt: new Date().toISOString(), rowCount: rows.length, timings: { total: Date.now() - t0 } };
}

const MEMO_MS = 5 * 60 * 1000;
let memo = null;
let inflight = null;

// Same modes as the other admin parts: 'force' rebuilds, otherwise a copy
// under five minutes old is served.
export async function loadIntegrity(mode) {
  if (mode !== 'force' && memo && Date.now() - memo.at < MEMO_MS) return memo.data;
  if (!inflight) {
    inflight = computeIntegrity({ force: mode === 'force' })
      .then((data) => { memo = { data, at: Date.now() }; return data; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}
