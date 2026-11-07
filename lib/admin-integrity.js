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
  for (const a of per.values()) {
    if (a.boards < MIN_BOARDS) continue;
    const winRate = a.wins / a.boards;
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
      + 0.05 * clamp01(a.replayDays / 5)));
    const flags = [];
    if (winRate >= 0.3) flags.push(`Won ${Math.round(winRate * 100)}% of ${a.boards} boards`);
    if (a.blowouts) flags.push(`${a.blowouts} wins in under 40% of the next best time`);
    if (a.instant) flags.push(`${a.instant} perfect finishes under ${INSTANT_SEC_PER_POINT}s a point`);
    if (a.soleTops) flags.push(`${a.soleTops} top scores nobody else reached`);
    if (jump) flags.push(`Perfect rate went ${Math.round(jump.before * 100)}% to ${Math.round(jump.after * 100)}% around ${jump.at}`);
    if (a.replayDays) flags.push(`${a.replayDays} dailies played 3+ times`);
    a.examples.sort((x, y) => (x.why === 'instant' ? 0 : 1) - (y.why === 'instant' ? 0 : 1));
    out.push({
      key: a.key,
      userId: a.key.startsWith('u:') ? a.key.slice(2) : null,
      hidden: a.key.startsWith('u:') && hiddenIds.has(a.key.slice(2)),
      risk, boards: a.boards, wins: a.wins, winRate: Math.round(winRate * 1000) / 10,
      blowouts: a.blowouts, instant: a.instant, soleTops: a.soleTops, replayDays: a.replayDays,
      jump, flags, examples: a.examples.slice(0, 8),
    });
  }
  out.sort((x, y) => y.risk - x.risk || y.winRate - x.winRate);
  return { windowDays, scored: out.length, players: out.slice(0, LIST_LIMIT) };
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
  for (const p of built.players) {
    const u = p.userId ? byId.get(p.userId) : null;
    p.name = u ? u.username : `Guest ${p.key.slice(2, 8)}`;
    p.email = u ? (u.email || null) : null;
  }
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
