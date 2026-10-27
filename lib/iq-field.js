// THE IQ FIELD: every player's standing, computed ONCE and shared (Vercel cost
// fix, owner 2026-10-27).
//
// WHY: lib/quiz-derived-cache's IQ snapshot (2026-10-19) stopped the hot
// routes re-deriving the whole site per request, but every function INSTANCE
// still built it for itself: computeXp over the entire quiz_results table
// (~305k rows by late October, nine times what it was when the snapshot was
// designed), held with every player's full play history attached, plus a
// trophy pass, plus a copy of the field per `recentN`. On the October bill that
// was the largest line (Fluid Active CPU), and the instances it bloated are the
// ones that stalled into 300-second timeouts (Fluid Provisioned Memory).
//
// HOW: /api/cron/iq-field builds the field every ten minutes and stores it,
// compressed, in Supabase Storage (lib/results-snapshot-store; a table row
// this size rewritten every ten minutes is what drained the Disk IO budget in
// early October). An instance downloads it only when the stored
// copy is newer than the one it holds (a one-column check first), so most
// requests touch nothing at all. What is stored is COMPACT: each player's
// totals and per-category totals, never their play list. The ONE player a
// request is about is still recomputed fresh from their own rows by
// lib/quiz-derived-cache, exactly as before, so their "+N", total and today
// figure are live; everyone else, and so the asker's rank, is up to ten minutes
// old (it was up to thirty).
//
// SAFE WITHOUT THE CRON: if the stored copy is missing, older than
// FIELD_MAX_AGE_MS, or from an earlier Eastern day, an instance builds the field
// from the rows it already holds (the old behaviour) and stores it for others.
//
// ⚠️ SHARED AND READ-ONLY: the hydrated players map, its player objects, the
// ranked list and the trophy result are shared across requests.

import { computeXp, rankPlayers } from './quiz-xp.js';
import { computeTrophies } from './quiz-trophies.js';
import { supabaseAdmin } from './supabase-server.js';
import { readStoredObject, readStoredObjectAt, writeStoredObject } from './results-snapshot-store.js';

export const IQ_FIELD_KEY = 'iq-field-v1';
const KEY = IQ_FIELD_KEY;
const FULL_RECENT = 100000;
// How often an instance asks whether a newer stored copy exists (one tiny
// select). The cron writes every ten minutes, so a minute is plenty.
const CHECK_MS = 60 * 1000;
// A stored copy older than this is not trusted; the instance builds its own.
export const FIELD_MAX_AGE_MS = 25 * 60 * 1000;

const ET = 'America/New_York';
let ET_DAY = null;
export function etDayKey(ms) {
  try {
    if (!ET_DAY) ET_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: ET });
    return ET_DAY.format(new Date(ms));
  } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}

// Eastern midnight, to the second. Same boundary daily-status uses.
export function etDayStart(nowMs = Date.now()) {
  const ymd = etDayKey(nowMs);
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    if (etDayKey(guess) === ymd && etDayKey(guess - 1000) !== ymd) return guess;
  }
  return Date.parse(`${ymd}T04:00:00.000Z`);
}

// ── column encoding ───────────────────────────────────────────────────────────
// The field is ~16k players with the same keys; storing keys once per column
// rather than once per player is what keeps the payload small.
const DROP = new Set(['recent', 'playedIds', 'completedIds', 'byCategory']);

function encodePlayers(list) {
  const cols = [];
  const colIdx = new Map();
  const catCols = [];
  const catIdx = new Map();
  const col = (k, m, arr) => { if (!m.has(k)) { m.set(k, arr.length); arr.push(k); } return m.get(k); };
  const rows = [];
  for (const p of list) {
    const row = [];
    for (const k of Object.keys(p)) {
      if (DROP.has(k)) continue;
      const v = p[k];
      if (v !== null && typeof v === 'object') continue;
      row[col(k, colIdx, cols)] = v === undefined ? null : v;
    }
    const cats = {};
    for (const [c, cr] of Object.entries(p.byCategory || {})) {
      const cv = [];
      for (const k of Object.keys(cr)) {
        const v = cr[k];
        if (v !== null && typeof v === 'object') continue;
        cv[col(k, catIdx, catCols)] = v === undefined ? null : v;
      }
      cats[c] = cv;
    }
    rows.push([row, cats]);
  }
  return { cols, catCols, rows };
}

const EMPTY = Object.freeze([]);
function decodePlayers(enc) {
  const { cols, catCols, rows } = enc;
  const players = new Map();
  for (const [row, cats] of rows) {
    // computeXp gives every player (and every category) the same keys, so
    // every column is assigned; a hole (JSON writes it as null) is a null.
    const p = {};
    for (let i = 0; i < cols.length; i++) p[cols[i]] = row[i] == null ? null : row[i];
    const byCategory = {};
    for (const [c, cv] of Object.entries(cats || {})) {
      const o = {};
      for (let i = 0; i < catCols.length; i++) o[catCols[i]] = cv[i] == null ? null : cv[i];
      byCategory[c] = o;
    }
    p.byCategory = byCategory;
    // Only a FRESH player ever carries a play list; these empties keep any
    // reader that maps over them safe.
    p.recent = EMPTY;
    p.playedIds = EMPTY;
    p.completedIds = EMPTY;
    players.set(p.key, p);
  }
  return players;
}

// ── build ─────────────────────────────────────────────────────────────────────
// The whole-site pass, exactly as the old per-instance snapshot did it, reduced
// to what the routes read about players OTHER than the asker.
export function buildIqField(rows, { nowMs = Date.now() } = {}) {
  const list = rows || [];
  const dayStartMs = etDayStart(nowMs);
  // Only today's plays are kept as `recent` (all `gained` below reads): the
  // totals are identical, and the build no longer holds a second copy of every
  // row, which is what pushed a 2GB function into minutes of GC.
  const { players, difficulty } = computeXp(list, { recentN: FULL_RECENT, nowMs, recentSinceMs: dayStartMs });

  // Today's IQ per player, by the rule daily-status's day standings use.
  const gained = {};
  for (const p of players.values()) {
    let sum = 0;
    for (const r of (p.recent || [])) {
      if (!r.createdAt) continue;
      if (Date.parse(r.createdAt) >= dayStartMs) sum += Number(r.xp) || 0;
    }
    if (sum) gained[p.key] = sum;
  }
  // Everyone with a row since ET midnight, guests included, counted off the RAW
  // rows (computeXp drops total <= 0 rows). Same rule as /api/quiz/totals.
  const dayPlayers = new Set();
  for (const r of list) {
    if (!r || !r.created_at) continue;
    if (new Date(r.created_at).getTime() < dayStartMs) continue;
    if (r.user_id) dayPlayers.add(`u:${r.user_id}`);
    else if (r.anon_id) dayPlayers.add(`a:${r.anon_id}`);
  }

  const t = computeTrophies(list, players);
  const earned = {};
  for (const [k, s] of t.earnedByKey) if (s && s.size) earned[k] = [...s];

  return {
    v: 1,
    at: nowMs,
    dayKey: etDayKey(nowMs),
    dayStartMs,
    rowCount: list.length,
    maxId: list.length ? (list[list.length - 1].id || 0) : 0,
    players: encodePlayers([...players.values()]),
    difficulty: [...difficulty],
    trophies: { holders: t.holders, totalPlayers: t.totalPlayers, earned },
    gained,
    dayFieldAll: dayPlayers.size,
  };
}

// ── hydrate ───────────────────────────────────────────────────────────────────
export function hydrateIqField(field) {
  const players = decodePlayers(field.players);
  const earnedByKey = new Map();
  for (const [k, ids] of Object.entries(field.trophies.earned || {})) earnedByKey.set(k, new Set(ids));
  return {
    at: field.at,
    dayKey: field.dayKey,
    dayStartMs: field.dayStartMs,
    rowCount: field.rowCount,
    players,
    difficulty: new Map(field.difficulty || []),
    trophies: { earnedByKey, holders: field.trophies.holders || {}, totalPlayers: field.trophies.totalPlayers || 0 },
    gained: new Map(Object.entries(field.gained || {})),
    dayFieldAll: field.dayFieldAll || 0,
    ranked: null,
    standing: null,
  };
}

function usable(snap, nowMs) {
  return !!snap && nowMs - snap.at < FIELD_MAX_AGE_MS && snap.dayKey === etDayKey(nowMs);
}

let local = null;     // hydrated field
let checkedAt = 0;
let pending = null;

// Store a freshly built field unless a newer one is already there.
// -> { ok, bytes }
export async function storeIqField(field) {
  try {
    const at = await readStoredObjectAt(supabaseAdmin, KEY);
    if (at && at >= field.at) return { ok: false, bytes: 0, skipped: 'newer stored' };
    return await writeStoredObject(supabaseAdmin, KEY, field, field.at);
  } catch (e) { return { ok: false, bytes: 0 }; }
}

export async function iqFieldStoredAt() {
  return readStoredObjectAt(supabaseAdmin, KEY);
}

// Storage reads on the request path get short leashes: a slow Storage minute
// must never hold a player's request (the old per-instance build had no network
// step at all). Past these, the instance keeps what it has or builds locally.
const META_WAIT_MS = 4 * 1000;
const BODY_WAIT_MS = 12 * 1000;
function within(promise, ms, fallback) {
  let timer;
  const gate = new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); });
  return Promise.race([promise.catch(() => fallback), gate]).finally(() => clearTimeout(timer));
}

async function refreshField(rows, nowMs) {
  try {
    // `at` is the stored payload's own build time, so a copy this instance
    // built (and wrote) itself is never downloaded again.
    const at = await within(readStoredObjectAt(supabaseAdmin, KEY), META_WAIT_MS, 0);
    if (at && (!local || at > local.at) && nowMs - at < FIELD_MAX_AGE_MS) {
      const t = Date.now();
      const got = await within(readStoredObject(supabaseAdmin, KEY), BODY_WAIT_MS, null);
      if (got && got.v === 1 && got.players) {
        const snap = hydrateIqField(got);
        if (usable(snap, nowMs)) local = snap;
        console.log('[iq-field] downloaded stored copy, age', nowMs - at, 'ms, took', Date.now() - t, 'ms');
      }
    }
  } catch (e) { /* fall through to a local build */ }
  checkedAt = nowMs;
  if (!usable(local, nowMs) && Array.isArray(rows) && rows.length) {
    const tb = Date.now();
    const field = buildIqField(rows, { nowMs });
    local = hydrateIqField(field);
    console.log('[iq-field] built locally', rows.length, 'rows in', Date.now() - tb, 'ms');
    // Not awaited on the request path: storing is for the other instances.
    storeIqField(field).then((st) => console.log('[iq-field] stored local build', JSON.stringify(st)));
  }
  return local;
}

// The shared field as this instance sees it. `rows` (the shared quiz_results
// array the caller already holds) is used only when there is no usable stored
// copy. Never throws.
//
// STALE-WHILE-REVALIDATE: an instance that holds a usable field answers from it
// at once and checks for a newer copy in the background, so no request ever
// waits on Storage except the very first one on a cold instance.
export async function getIqField(rows, { nowMs = Date.now() } = {}) {
  if (local && usable(local, nowMs)) {
    if (nowMs - checkedAt >= CHECK_MS && !pending) {
      checkedAt = nowMs;
      pending = refreshField(rows, nowMs).catch(() => local).finally(() => { pending = null; });
    }
    return local;
  }
  if (pending) return pending;
  pending = refreshField(rows, nowMs).catch(() => local).finally(() => { pending = null; });
  return pending;
}

// The ranked field (rankPlayers 'all'), once per hydrated field.
export function iqFieldRanked(snap) {
  if (!snap.ranked) snap.ranked = rankPlayers(snap.players, 'all');
  return snap.ranked;
}
