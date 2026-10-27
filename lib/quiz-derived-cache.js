// In-process memo for the DERIVED xp / trophy state (homepage + end-card
// latency fix, 2026-08-01).
//
// WHY: lib/quiz-results-cache stopped us re-FETCHING the whole quiz_results
// table on every request, but every hot route still re-DERIVES the entire
// site's state from it, per request, to answer a question about one player.
// computeXp sorts and walks all ~33,800 rows to build every player's IQ
// Points, then computeTrophies walks them again for all 34 trophy definitions.
// Measured on the live site: /api/quiz/me (the homepage player stats, called
// from ~50 places) 1,645ms, /api/quiz/iq-standing (the end card) 757ms. The
// inputs are identical between those calls and the answer is identical too.
//
// HOW: memoize by a fingerprint of the row set plus the options that actually
// change the output. Between two rows landing (the common case, seconds apart)
// every caller reuses one computation.
//
// ⚠️ THE RETURNED VALUES ARE SHARED ACROSS REQUESTS. Treat `players`, its
// player objects, and `difficulty` as READ-ONLY, exactly like the rows array
// from quiz-results-cache. Verified at the time of writing: buildProfile
// (lib/quiz-profile), rankPlayers (lib/quiz-xp) and computeTrophies
// (lib/quiz-trophies) all read only and build their own output objects. If a
// consumer ever needs to mutate a player, it must copy first.

import { computeXp, rankPlayers, computeQuizDifficulty, rankCompare } from './quiz-xp.js';
import { computeTrophies } from './quiz-trophies.js';
import { getIqField, iqFieldRanked, FIELD_MAX_AGE_MS } from './iq-field.js';

// Fingerprint of the row set. maxId alone would miss a deletion (admin
// quiz-reset); length alone would miss a delete plus insert. Together they are
// an O(1) read off the shared array and cannot collide in normal operation.
function versionOf(rows) {
  const n = rows ? rows.length : 0;
  const maxId = n ? (rows[n - 1].id || 0) : 0;
  return `${n}:${maxId}`;
}

// computeXp's xp7d / xp30d are clock-dependent, so a raw Date.now() would make
// every key unique and the memo useless. Bucket to the minute: the derived
// window shifts by under 60s, which is nothing against a 7-day or 30-day cut.
const NOW_BUCKET_MS = 60 * 1000;
function nowBucket(nowMs) {
  return Math.floor((nowMs || Date.now()) / NOW_BUCKET_MS) * NOW_BUCKET_MS;
}

// Two memos on purpose. `shared` holds the rankFor-less variants, which every
// player can reuse; `perPlayer` holds the rankFor variants, one per profiled
// player. Keeping them apart stops a burst of different players from evicting
// the shared entry that the homepage depends on.
const shared = new Map();
const perPlayer = new Map();
const trophies = new Map();
const standings = new Map();
const rankings = new Map();
// Every route now shares this memo, and they ask for different recentN:
// 1 (me light), 20 (xp / xp-categories / share-card), 200 (day-card,
// iq-standing), 400 (daily-status), 100000 (the full profile). Each is its own
// key, so a cap of 3 would thrash and hand most callers a miss.
// Bumped 6 -> 8 on 2026-08-08: `history` mode on /api/quiz/me added a sixth
// live recentN variant (100000 with NO rankFor), and sitting exactly at the cap
// means the homepage's light entry gets evicted by whichever request lands next.
const SHARED_MAX = 3;  // 8 -> 3 (2026-10-27): the hot routes left this map for the shared IQ field
// Bumped 4 -> 8 on 2026-08-08. 4 was smaller than the real concurrency of
// distinct players, so the 5th evicted the 1st and the map ran at roughly a 0%
// hit rate. Deliberately NOT raised further: each entry holds a full ~2,900
// player map with every player's recent list (~10MB at recentN 100000), and the
// instance runs at 529MB of 2GB. The real relief is `history` mode moving the
// 47 game clients OFF this map entirely, not a bigger cap here.
const PER_PLAYER_MAX = 2;  // 8 -> 2 (2026-10-27): each entry is a full-history copy of the table
const TROPHY_MAX = 2;
const STANDING_MAX = 2;
const RANKING_MAX = 4;

// Map preserves insertion order, so the first key is the oldest. Re-inserting on
// a hit would make this a true LRU; FIFO is enough here because entries are
// invalidated by new rows long before they age out.
function trim(map, max) {
  while (map.size > max) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

// computeXp(rows, opts), memoized. Same arguments, same return shape.
export function computeXpCached(rows, { recentN = 20, rankFor = null, nowMs = null } = {}) {
  const now = nowBucket(nowMs);
  const version = versionOf(rows);
  const map = rankFor ? perPlayer : shared;
  const key = rankFor
    ? `${version}|${recentN}|${now}|${rankFor}`
    : `${version}|${recentN}|${now}`;

  const hit = map.get(key);
  if (hit) return hit;

  const value = computeXp(rows, { recentN, rankFor, nowMs: now });
  map.set(key, value);
  trim(map, rankFor ? PER_PLAYER_MAX : SHARED_MAX);
  return value;
}

// computeTrophies(rows, players), memoized on the ROW SET ALONE.
//
// That is deliberate and safe: trophies are derived from the rows plus the
// player identity map (key / anonId), and those identity fields are identical
// across every computeXp variant of the same rows. recentN and rankFor only
// affect `recent`, which trophies never read. So a trophy result computed
// alongside one variant is correct for any other variant of the same rows.
// Today's IQ gain per player, and the whole field's ranking both now and as it
// stood before today, memoized per row set + day.
//
// /api/quiz/daily-status needs three things that are IDENTICAL for every player
// against the same rows: how much each player earned today, everyone's rank now,
// and everyone's rank on the IQ they held before today. Only the final lookup is
// personal. It was recomputing all of it per request: two sorts of the ~2,600
// player field plus a scan of every player's recent list. Measured 1,050ms
// median warm after the Intl fix, with a spread from 261ms to 2,968ms depending
// on instance warmth.
//
// The day boundary is part of the key, so the entry rolls over on its own at ET
// midnight without any invalidation.
//
// recentN is in the key because `gained` reads p.recent, which computeXp
// truncates to recentN: a players map built with a different recentN is a
// different input and must not share this entry.
export function dailyStandingCached(rows, players, { dayStartMs, recentN }) {
  const key = `${versionOf(rows)}|${recentN}|${dayStartMs}`;
  const hit = standings.get(key);
  if (hit) return hit;

  const all = [...players.values()];

  const gained = new Map();
  for (const p of all) {
    let sum = 0;
    for (const r of (p.recent || [])) {
      if (!r.createdAt) continue;
      const ts = Date.parse(r.createdAt);
      if (ts >= dayStartMs) sum += Number(r.xp) || 0;
    }
    gained.set(p.key, sum);
  }
  const core = standingCore(all, gained);

  // THE FIELD IS EVERYONE WHO PLAYED TODAY, NOT EVERYONE WHO BANKED (owner,
  // 2026-09-04). dayField above is the size of the board this rank is taken on,
  // which is only the players whose gain is above zero; the home's own board
  // prints /api/quiz/totals.todayPlayers, which is every distinct player with a
  // row since ET midnight. On one page load that read "#23/132" in the cap and
  // "Top 10 of 140 players" below it.
  //
  // COUNTED OFF THE RAW ROWS, BY THE SAME RULE THAT ROUTE USES, and not derived
  // from the map above: computeXp drops every row with total <= 0, so a player
  // whose only play today is one of those never enters it, and an xp-derived
  // count could never be made to agree. Same shared rows, same ET cutoff, same
  // u:/a: keying, so the two figures now move together.
  //
  // It belongs here because this memo is already keyed on the row set and the
  // day start, so the pass is paid once per row set rather than per request.
  const dayPlayers = new Set();
  for (const r of rows || []) {
    if (!r || !r.created_at) continue;
    if (new Date(r.created_at).getTime() < dayStartMs) continue;
    if (r.user_id) dayPlayers.add(`u:${r.user_id}`);
    else if (r.anon_id) dayPlayers.add(`a:${r.anon_id}`);
  }
  const dayFieldAll = dayPlayers.size;

  const value = { ...core, dayFieldAll };
  standings.set(key, value);
  trim(standings, STANDING_MAX);
  return value;
}

// The viewer-independent day standings over a field: rank now, rank on IQ held
// before today, and today's board (all players, and registered-only numbering).
// `gained` maps player key -> IQ earned since ET midnight (absent = 0). Shared
// by dailyStandingCached (rows in hand) and iqSnapshotStanding (stored field).
function standingCore(all, gained) {
  // Player key as the final tiebreak so both orderings are deterministic and a
  // tie can never register as phantom movement.
  const rankMap = (val) => {
    const sorted = all.slice().sort((a, b) => val(b) - val(a) || (a.key < b.key ? -1 : 1));
    const m = new Map();
    for (let i = 0; i < sorted.length; i++) m.set(sorted[i].key, i + 1);
    return m;
  };
  const posNow = rankMap((p) => p.xp);
  const posThen = rankMap((p) => p.xp - (gained.get(p.key) || 0));

  // TODAY'S board (owner, 2026-08-08): the same field ranked by IQ earned since
  // ET midnight, which is what the header's Daily rank box reports. Only players
  // who actually banked something today are on it, so the field size means "how
  // many people played today" rather than "how many accounts exist". Ranking the
  // whole roster instead would hand every idle account a shared last place and
  // make a good day read as #1,900 of 2,952.
  const dayRanked = all
    .filter((p) => (gained.get(p.key) || 0) > 0)
    .sort((a, b) => (gained.get(b.key) || 0) - (gained.get(a.key) || 0) || (a.key < b.key ? -1 : 1));
  const posDay = new Map();
  for (let i = 0; i < dayRanked.length; i++) posDay.set(dayRanked[i].key, i + 1);
  const dayField = dayRanked.length;

  // THE DAY'S NUMBERING IS THE REGISTERED BOARD'S (owner, 2026-09-04), which is
  // the rule every other standing on this site already follows: rank among the
  // NAMED players, renumbered 1,2,3 with no gaps, printed against a field that
  // still counts everyone who played. posDay above interleaves guests, so the
  // cap was reporting a position no board on the site would confirm -- a player
  // reading #14 of 48 in the header and #9 of 48 on their own tiles, with the
  // difference being five guests the public boards do not show. dayField is
  // deliberately NOT narrowed: the denominator is the whole pool, exactly as
  // the per-game "of N" is.
  //
  // dayRanked is already ordered by today's gain, so the filter preserves it
  // and regDayGained comes out descending, which is what the guest slot-in
  // below can walk and stop early on.
  const dayReg = dayRanked.filter((p) => !p.isAnon && p.username);
  const posDayReg = new Map();
  const regDayGained = [];
  for (let i = 0; i < dayReg.length; i++) {
    posDayReg.set(dayReg[i].key, i + 1);
    regDayGained.push(gained.get(dayReg[i].key) || 0);
  }

  return { gained, posNow, posThen, posDay, dayField, posDayReg, regDayGained };
}

// rankPlayers(players, metric), memoized. The full field sort is IDENTICAL for
// every caller against the same rows, but /api/quiz/iq-standing was running it
// twice per request on the blocking post-game path (~2,900 players, and the end
// card's retry ladder can fire it six times for one finished game).
//
// recentN is in the key because the players map is built per recentN; two maps
// of the same rows at different recentN are different inputs.
//
// ⚠️ The returned array is SHARED. Read it, slice it, findIndex it. Never sort
// or mutate it in place.
export function rankPlayersCached(rows, players, metric = 'all', recentN = 20) {
  const key = `${versionOf(rows)}|${metric}|${recentN}`;
  const hit = rankings.get(key);
  if (hit) return hit;
  const value = rankPlayers(players, metric);
  rankings.set(key, value);
  trim(rankings, RANKING_MAX);
  return value;
}

export function computeTrophiesCached(rows, players) {
  const key = versionOf(rows);
  const hit = trophies.get(key);
  if (hit) return hit;
  const value = computeTrophies(rows, players);
  trophies.set(key, value);
  trim(trophies, TROPHY_MAX);
  return value;
}


// ─── THE IQ SNAPSHOT (Vercel cost fix, owner 2026-10-19) ─────────────────────
//
// WHY: every memo above is keyed on versionOf(rows), the exact row count. A play
// lands every few seconds, so on the live site almost every request missed and
// re-derived the whole site: /api/quiz/iq-standing, /api/quiz/me and
// /api/quiz/daily-status measured ~3s of CPU per call each and together were
// ~60% of all function CPU on the October bill.
//
// HOW: the whole-site pass (every player's IQ, the ranked field, trophies, the
// day standings) is built at most once per IQ_SNAPSHOT_TTL_MS per instance and
// shared. The ONE player a request is about is then recomputed FRESH from only
// their own rows, scored against the snapshot's difficulty map. That is exact:
// a quiz's difficulty depends only on that quiz's rows, and everything else in
// computeXp (attempts, replay discount, caps, windows) is per player. So the
// asker's own "+N", total and today figure are live; everyone ELSE, and so the
// asker's rank, is up to 30 minutes old. Trophies are snapshot-only (owner: a
// new trophy may appear on a later visit rather than the moment it is earned).
//
// The Stat Hub asks /api/quiz/me with full=1 and keeps the old exact path.
//
// ⚠️ SHARED AND READ-ONLY, like everything else in this file: snap.players,
// snap.ranked, every view and every player object.
// SUPERSEDED 2026-10-27: the snapshot is no longer built per instance. It is
// the shared IQ field (lib/iq-field.js), built by /api/cron/iq-field and
// downloaded only when a newer copy exists, holding every player's TOTALS but
// no player's play list. That cut both the CPU each instance spent rebuilding
// it and the memory it held (the full-history map was a second copy of every
// row). The asker is still recomputed fresh, below, exactly as before.
export const IQ_SNAPSHOT_TTL_MS = FIELD_MAX_AGE_MS;

// -> the hydrated field. ASYNC since 2026-10-27 (it may download the stored
// copy). `rows` is the shared quiz_results array the caller already holds; it
// is used to score the asker and, only when no stored copy is usable, to build
// the field locally.
export async function iqSnapshot(rows, { nowMs = Date.now() } = {}) {
  const snap = await getIqField(rows || [], { nowMs });
  if (snap) return snap;
  // Unreachable in practice (getIqField builds from rows), but never hand a
  // caller null: an empty field ranks the asker alone.
  return { at: nowMs, dayKey: '', dayStartMs: 0, players: new Map(), difficulty: new Map(), trophies: { earnedByKey: new Map(), holders: {}, totalPlayers: 0 }, gained: new Map(), dayFieldAll: 0, ranked: null, standing: null };
}

// computeXp's playerKey, inverted: does this row belong to `key`?
function rowMatcher(key) {
  if (typeof key !== 'string') return null;
  if (key.startsWith('u:')) { const id = key.slice(2); return (r) => r.user_id != null && String(r.user_id) === id; }
  if (key.startsWith('a:')) { const id = key.slice(2); return (r) => !r.user_id && r.anon_id === id; }
  return null;
}

// One player, recomputed from their own rows. undefined = not a player key;
// null = no rows (so drop them from the map).
function freshPlayer(rows, key, snap, nowMs, recentN) {
  const match = rowMatcher(key);
  if (!match) return undefined;
  const mine = [];
  for (const r of rows) if (r && match(r)) mine.push(r);
  if (!mine.length) return null;
  // A quiz first played since the snapshot has no difficulty in it yet: derive
  // just those quizzes from the current rows, by the same rule.
  let difficulty = snap.difficulty;
  const missing = new Set();
  for (const r of mine) if (Number(r.total) > 0 && !difficulty.has(r.quiz_id)) missing.add(r.quiz_id);
  if (missing.size) {
    const extra = computeQuizDifficulty(rows.filter((r) => r && missing.has(r.quiz_id)));
    difficulty = new Map(difficulty);
    for (const [q, d] of extra) difficulty.set(q, d);
  }
  const { players } = computeXp(mine, { recentN, nowMs, difficulty });
  return players.get(key) || null;
}

// The players map a route reads: the snapshot, with each of `keys` swapped for
// a fresh computation. A NEW Map per call (cheap: references only), so the
// overlay never leaks into another request.
export async function iqPlayersFresh(rows, { recentN = 20, keys = [], nowMs = Date.now() } = {}) {
  const list = rows || [];
  const snap = await iqSnapshot(list, { nowMs });
  const players = new Map(snap.players);
  const fresh = new Map();
  for (const k of keys) {
    if (!k || fresh.has(k)) continue;
    const p = freshPlayer(list, k, snap, nowMs, recentN);
    if (p === undefined) continue;
    fresh.set(k, p);
    if (p) players.set(k, p); else players.delete(k);
  }
  return { players, snap, fresh };
}

// The ranked field (rankPlayers 'all') with each fresh player removed from the
// snapshot order and slotted back in by the SAME comparator. One sort per
// snapshot instead of one per request.
export function rankWithFresh(snap, players, keys = []) {
  iqFieldRanked(snap);
  const ks = [...new Set((keys || []).filter(Boolean))];
  if (!ks.length) return snap.ranked;
  const drop = new Set(ks);
  const out = snap.ranked.filter((e) => !drop.has(e.key));
  for (const k of ks) {
    const p = players.get(k);
    if (!p) continue;
    const entry = rankPlayers(new Map([[k, p]]), 'all')[0];
    if (!entry) continue;
    let i = 0;
    while (i < out.length && rankCompare(out[i], entry) <= 0) i++;
    out.splice(i, 0, entry);
  }
  return out;
}

// Trophies for the field, computed when the field was built.
export function iqSnapshotTrophies(snap) {
  return snap.trophies;
}

// The day standings daily-status reads (same shape as dailyStandingCached),
// from the field's stored per-player gain, once per field + ET day. A field
// from an earlier ET day is never returned by getIqField, so `gained` is today's.
export function iqSnapshotStanding(snap, dayStartMs) {
  if (snap.standing && snap.standing.dayStartMs === dayStartMs) return snap.standing;
  const value = { ...standingCore([...snap.players.values()], snap.gained), dayFieldAll: snap.dayFieldAll || 0, dayStartMs };
  snap.standing = value;
  return value;
}
