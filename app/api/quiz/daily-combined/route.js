import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadDailyResultsCached } from '@/lib/daily-results-cache';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { scoreGame, combineDaily, guestProvisional, rankByCorrect, rankByTime, DAILY_KEYS, DAILY_MAX, GAME_MAX, bestNForSuffix, usesLadder, dayIsFrozen, etDayEndMs, isoOfSuffix, rowsWithinDay, rescoreField } from '@/lib/daily-combined';
import { scoreOutwitGame } from '@/lib/outwit-score';
import { scoreOutrankGame } from '@/lib/outrank-score';
import { scoreFeudGame } from '@/lib/feud-score';
import { attemptsModeForQuizId, attemptsPlan, arcadeRanksForQuizId } from '@/lib/daily-games';
import { GAME_PUZZLES, etTodayServer, suffixOfDate, gamesForSuffix } from '@/lib/daily-slate';
import { groupByCode, membersOf, isMissingTable } from '@/lib/groups';
import { fiveForSuffix, FIVE_SIZE } from '@/lib/daily-five';
import { circuitKeysFor, circuitById, isMarquee, circuitScoreMode } from '@/lib/circuits';

// The day's slate (which puzzle each game published on a date) lives in
// lib/daily-slate.js, shared with /api/quiz/daily-me. This route used to carry
// its own copy of all 41 puzzle imports and the date helpers; they were
// identical, and one of them drifting silently would have put the two boards on
// different puzzles.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Per-player payload (the `me` block folds in the viewer's identity), so it is
// safe to cache briefly at the edge — the query string is the player's own
// identity and never crosses users. Same pattern as /api/quiz/daily-status.
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };
// The finish flow passes ?fresh=1 to force an authoritative read; that response
// must never be edge-cached or it could hand back a pre-insert snapshot.
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
// A group board names its members, so it is never cached at the shared edge.
// A finished day cannot change, so the browser may keep it a while.
const GROUP_HEADERS = { 'Cache-Control': 'private, max-age=20' };
const GROUP_FROZEN_HEADERS = { 'Cache-Control': 'private, max-age=600' };

const DISPLAY = 10; // overall rows returned (viewer's own row is always appended via `me`)
const BOARD = 10;   // per-game rows returned per tab

// GET /api/quiz/daily-combined?anonId=&email=&quizId=&date=
//   quizId (a daily quizId) or date ("M-D-YY") picks the day; default = today.
//   -> { date, maxTotal, gameMax, bestN, gameCount, games:[{key,quizId,field,board}], overall, me }
// Recompute Outwit's per-game board from outwit_picks (adaptive, live) instead of
// the frozen quiz_results snapshot, resolving registered names the same way
// /api/outwit does. Returns a scoreGame-shaped { field, plays, players:Map } or
// null if the picks table is unavailable (caller then falls back to quiz_results).
async function scoreOutwitLive(puzzle, cutoffMs) {
  let rows = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('outwit_picks')
      .select('anon_id, user_id, answers, created_at')
      .eq('quiz_id', puzzle.quizId)
      .limit(20000);
    if (error || !Array.isArray(data)) return null;
    rows = data;
  } catch (e) { return null; }

  // On a FROZEN day (see the day freeze in lib/daily-combined) the crowd pool
  // is cut off at Eastern midnight along with everything else, so an adaptive
  // game's final board cannot drift under a crown that is already awarded.
  if (cutoffMs) rows = rows.filter((r) => !r.created_at || Date.parse(r.created_at) < cutoffMs);

  const picks = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => ({ answers: r.answers, created: r.created_at || '', userId: r.user_id || null, anonId: r.anon_id || null }));

  // Resolve registered names (guests stay unnamed and rank out, but their picks
  // still count toward the pool — exactly like the live board).
  const userIds = [...new Set(picks.map((p) => p.userId).filter(Boolean))];
  const anonIds = [...new Set(picks.map((p) => p.anonId).filter(Boolean))];
  const nameByUser = new Map();
  const infoByAnon = new Map();
  try {
    if (userIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds);
      for (const u of data || []) if (u.username) { nameByUser.set(u.id, u.username); if (u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id }); }
    }
    if (anonIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('anon_id', anonIds);
      for (const u of data || []) if (u.username && u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id });
    }
  } catch (e) { /* no names — board empty, pool still scores */ }

  const named = picks.map((p) => {
    let name = null, userId = p.userId;
    if (p.userId && nameByUser.has(p.userId)) name = nameByUser.get(p.userId);
    else if (p.anonId && infoByAnon.has(p.anonId)) { const info = infoByAnon.get(p.anonId); name = info.username; userId = info.id; }
    return { answers: p.answers, created: p.created, anonId: p.anonId, userId, name };
  });

  const gr = scoreOutwitGame(puzzle, named);
  return { field: gr.field, plays: picks.length, players: gr.players };
}

// Outrank is adaptive exactly like Outwit: recompute its per-game board from
// outrank_picks (the live crowd) instead of the frozen quiz_results snapshot.
// Same name-resolution flow as scoreOutwitLive above.
async function scoreOutrankLive(puzzle, cutoffMs) {
  let rows = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('outrank_picks')
      .select('anon_id, user_id, answers, created_at')
      .eq('quiz_id', puzzle.quizId)
      .limit(20000);
    if (error || !Array.isArray(data)) return null;
    rows = data;
  } catch (e) { return null; }

  if (cutoffMs) rows = rows.filter((r) => !r.created_at || Date.parse(r.created_at) < cutoffMs);

  const picks = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => ({ answers: r.answers, created: r.created_at || '', userId: r.user_id || null, anonId: r.anon_id || null }));

  const userIds = [...new Set(picks.map((p) => p.userId).filter(Boolean))];
  const anonIds = [...new Set(picks.map((p) => p.anonId).filter(Boolean))];
  const nameByUser = new Map();
  const infoByAnon = new Map();
  try {
    if (userIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds);
      for (const u of data || []) if (u.username) { nameByUser.set(u.id, u.username); if (u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id }); }
    }
    if (anonIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('anon_id', anonIds);
      for (const u of data || []) if (u.username && u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id });
    }
  } catch (e) { /* no names — board empty, pool still scores */ }

  const named = picks.map((p) => {
    let name = null, userId = p.userId;
    if (p.userId && nameByUser.has(p.userId)) name = nameByUser.get(p.userId);
    else if (p.anonId && infoByAnon.has(p.anonId)) { const info = infoByAnon.get(p.anonId); name = info.username; userId = info.id; }
    return { answers: p.answers, created: p.created, anonId: p.anonId, userId, name };
  });

  const gr = scoreOutrankGame(puzzle, named);
  return { field: gr.field, plays: picks.length, players: gr.players };
}

// Feud is adaptive exactly like Outwit/Outrank: recompute its per-game board
// from feud_picks (the live crowd) instead of the frozen quiz_results
// snapshot. Same name-resolution flow as scoreOutwitLive above.
async function scoreFeudLive(puzzle, cutoffMs) {
  let rows = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('feud_picks')
      .select('anon_id, user_id, answers, created_at')
      .eq('quiz_id', puzzle.quizId)
      .limit(20000);
    if (error || !Array.isArray(data)) return null;
    rows = data;
  } catch (e) { return null; }

  if (cutoffMs) rows = rows.filter((r) => !r.created_at || Date.parse(r.created_at) < cutoffMs);

  const picks = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => ({ answers: r.answers, created: r.created_at || '', userId: r.user_id || null, anonId: r.anon_id || null }));

  const userIds = [...new Set(picks.map((p) => p.userId).filter(Boolean))];
  const anonIds = [...new Set(picks.map((p) => p.anonId).filter(Boolean))];
  const nameByUser = new Map();
  const infoByAnon = new Map();
  try {
    if (userIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds);
      for (const u of data || []) if (u.username) { nameByUser.set(u.id, u.username); if (u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id }); }
    }
    if (anonIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('anon_id', anonIds);
      for (const u of data || []) if (u.username && u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id });
    }
  } catch (e) { /* no names — board empty, pool still scores */ }

  const named = picks.map((p) => {
    let name = null, userId = p.userId;
    if (p.userId && nameByUser.has(p.userId)) name = nameByUser.get(p.userId);
    else if (p.anonId && infoByAnon.has(p.anonId)) { const info = infoByAnon.get(p.anonId); name = info.username; userId = info.id; }
    return { answers: p.answers, created: p.created, anonId: p.anonId, userId, name };
  });

  const gr = scoreFeudGame(puzzle, named);
  return { field: gr.field, plays: picks.length, players: gr.players };
}

// The guest's single chosen row for a game (their anon rows only), mirroring
// scoreGame's selection: a completed attempt beats an abandoned one, then the
// first attempt (lowest id) wins, EXCEPT on an arcade game, where their best run
// wins. Returns { row, eg } so guestProvisional can place an End Game guest on
// the same tier/attempts order the board uses, or null when the guest has no
// row. `eg` is null on every other game.
function chooseGuestRow(rows, anonId, quizId) {
  const mine = (rows || []).filter((r) => r && !r.user_id && r.anon_id === anonId);
  if (!mine.length) return null;
  // END GAME: the run the win landed on represents them, and its attempt number
  // is what the board ranks, so the same plan the scoring uses picks it here
  // rather than a second copy of the rule. Attempt numbers are per player, so
  // running the plan over the guest's own rows is the whole computation.
  const attemptsMode_ = attemptsModeForQuizId(quizId);
  if (attemptsMode_) {
    const plan = attemptsPlan(mine, attemptsMode_);
    for (const r of mine) if (plan.chosen.has(r)) return { row: r, eg: plan.info.get(r) || null };
    return null;
  }
  // ARCADE: the best run represents them, not the first (owner, 2026-08-14).
  // scoreGame has picked the registered player's best run since 2026-08-08, and
  // this kept a guest's opening run, so the provisional standing the end card
  // quotes a guest disagreed with what registering would actually pay them. The
  // comparator is the shared one in lib/daily-games, bound ONCE here because
  // every row of this game is the same puzzle.
  const arcadeRank = arcadeRanksForQuizId(quizId);
  let chosen = null;
  for (const r of mine) {
    if (!chosen) { chosen = r; continue; }
    const rDone = !r.abandoned, cDone = !chosen.abandoned;
    if (rDone !== cDone) { if (rDone) chosen = r; continue; }
    // A dead heat falls back to the lower id on BOTH paths, so the answer never
    // depends on the order the rows arrived in.
    const wins = arcadeRank
      ? (arcadeRank(r, chosen) || ((r.id || 0) - (chosen.id || 0))) < 0
      : (r.id || 0) < (chosen.id || 0);
    if (wins) chosen = r;
  }
  return chosen ? { row: chosen, eg: null } : null;
}

// GROUPS (owner, 2026-09-17). ?group=<code> returns the SAME day's board kept
// to that group's members, and nothing else changes: the same scoreGame, the
// same ladder, the same crowd recomputes, the same day freeze. A group ranks
// its members on the site's own daily points and on each game's own order, so
// it can never disagree with the site board about a result. Only the full slate
// is grouped; a run flag alongside it is ignored.
function groupRank(rows, keyOf) {
  let rank = 0, prev = null, seen = 0;
  for (const r of rows) {
    seen += 1;
    const k = keyOf(r);
    if (prev === null || k !== prev) { rank = seen; prev = k; }
    r.rank = rank;
  }
  return rows;
}

// A GROUP IS SCORED AS ITS OWN FIELD (owner, 2026-09-17: "if im first i assume
// i should get 15"). The board used to be the site board FILTERED: the member
// who led their group still carried whatever the site paid them, so topping a
// group of five with a run that came 2nd sitewide read 13.5 out of 15 with
// nobody above it. The points are the site's own points formula, run again over
// the members alone: the same ladder, the same tie rule (a tie is paid the mean
// of the rungs it spans), the same best-N combine. Nothing is stored and the
// site board is untouched; each member's site place travels with the row as
// `siteRank`, so both places can be read at once.
function groupPayload({ suffix, frozen, maxTotal, gameCount, gameResults, overallFull, group, members, bestN }) {
  const keys = new Set(members.map((m) => m.userKey));
  const nameOf = new Map(members.map((m) => [m.userKey, m.username]));
  // THE SITE PLACE, as the site board prints it: named players only, shared
  // rank on the one-decimal total. overallFull's own rank counts guests too.
  const siteRankOf = new Map();
  {
    let rk = 0, prev = null, seen = 0;
    for (const r of overallFull) {
      if (!r.username) continue;
      seen += 1;
      const k = Math.round((r.total || 0) * 10);
      if (prev === null || k !== prev) { rk = seen; prev = k; }
      siteRankOf.set(r.userKey, rk);
    }
  }
  const games = gameResults.map((g) => {
    const rows = [...g.players.values()]
      .filter((p) => keys.has(p.userKey))
      .sort((a, b) => (a.rank - b.rank) || (b.points - a.points)
        || String(nameOf.get(a.userKey) || '').localeCompare(String(nameOf.get(b.userKey) || '')))
      .map((p) => ({
        userKey: p.userKey,
        username: nameOf.get(p.userKey) || p.username,
        siteRank: p.rank,
        score: p.score,
        total: p.total,
        guessesUsed: p.guessesUsed,
        tries: p.tries ?? null,
        egTier: p.egTier ?? null,
        timeElapsed: p.timeElapsed,
        abandoned: !!p.abandoned,
        // The home's group feed orders on this; see scoreGame (2026-09-22).
        playedAt: p.playedAt ?? null,
        points: Math.round(p.points * 10) / 10,
      }));
    // Re-scored over the members alone; this also sets each row's group rank.
    rescoreField(g.quizId, rows);
    return { key: g.key, quizId: g.quizId, href: g.href, field: g.field, board: rows };
  });

  // THE DAY, recombined on those points: best-N per member, exactly the rule
  // the site board uses, so the two boards differ only in who is in the field.
  const byUser = new Map();
  for (const g of games) {
    for (const r of g.board) {
      let u = byUser.get(r.userKey);
      if (!u) { u = { userKey: r.userKey, username: r.username, pts: [], finished: 0 }; byUser.set(r.userKey, u); }
      u.pts.push(r.points);
      if (!r.abandoned) u.finished += 1;
    }
  }
  const N = Math.max(1, bestN || 25);
  const overall = groupRank(
    [...byUser.values()]
      .map((u) => {
        const best = u.pts.slice().sort((a, b) => b - a).slice(0, N);
        return {
          userKey: u.userKey,
          username: nameOf.get(u.userKey) || u.username,
          total: Math.round(best.reduce((s, v) => s + v, 0) * 10) / 10,
          // Where this member sits on the SITE board today, so a group board
          // can show both places at once (2026-09-17).
          siteRank: siteRankOf.get(u.userKey) ?? null,
          gamesPlayed: u.pts.length,
          gamesFinished: u.finished,
          bestSingle: best.length ? best[0] : 0,
        };
      })
      .sort((a, b) => b.total - a.total
        || b.gamesPlayed - a.gamesPlayed
        || b.bestSingle - a.bestSingle
        || String(a.username || '').localeCompare(String(b.username || ''))),
    (r) => Math.round((r.total || 0) * 10),
  );
  return {
    date: suffix,
    frozen,
    maxTotal,
    gameCount,
    group: { code: group.code, name: group.name },
    memberCount: members.length,
    overall,
    games,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  // `fresh=1` (sent by the just-finished flow) bypasses BOTH caches so the
  // player's own row is authoritative at once: force the in-process results
  // cache to run its delta, and return no-store so the edge CDN can't serve a
  // stale pre-insert snapshot. Routine background polls omit it and keep the
  // 30s edge cache, preserving the egress fix.
  const fresh = searchParams.get('fresh') === '1' || searchParams.get('fresh') === 'true';
  const today = etTodayServer();

  // Which day's board? Prefer an explicit date suffix, else parse it off a passed
  // quizId, else today. This is the ONLY thing that decides the slate.
  let suffix = (searchParams.get('date') || '').trim();
  const qidParam = (searchParams.get('quizId') || '').trim();
  if (!/^\d+-\d+-\d+$/.test(suffix)) {
    const m = qidParam.match(/-(\d+-\d+-\d+)$/);
    suffix = m ? m[1] : suffixOfDate(today);
  }

  // The games that ran on that date (skip any that didn't publish that day). Each
  // game gets a play href for THAT date: today's slate links to the live game
  // (streak-counting), an archived day links to that exact puzzle via ?p=<num>.
  // THE DAILY FIVE IS THIS SAME BOARD OVER A FIVE-GAME SLATE (owner,
  // 2026-08-17). ?five=1 narrows the day's games to lib/daily-five's roster and
  // drops best-N to five, and that is the ENTIRE difference. Everything else
  // here runs untouched: the same scoreGame, the same ladder, the same crowd
  // recomputes, the same guest provisional, the same day freeze. That is the
  // point of doing it here rather than in a route of its own, which would have
  // meant a second copy of a comparator this file's own comments say must never
  // be copied. An unbanked date has no roster, so the flag falls through to the
  // full slate rather than returning an empty board.
  // A SKILL CIRCUIT IS THE SAME NARROWING, on a fixed roster instead of the
  // day's banked five (owner, 2026-08-18). ?circuit=<id> narrows the slate to
  // lib/circuits' roster for that id and drops best-N to five in exactly the
  // same way, so both run kinds share every line of scoring below this point.
  // ?five=1 wins if both are passed: the marquee is the marquee.
  const circuitId = (searchParams.get('circuit') || '').trim();
  const circuitDef = circuitId && !isMarquee(circuitId) ? circuitById(circuitId) : null;
  const fiveFlag = searchParams.get('five') === '1';
  const fiveKeys = fiveFlag
    ? fiveForSuffix(suffix)
    : (circuitDef ? circuitKeysFor(circuitId, isoOfSuffix(suffix)) : []);
  const fiveOnly = fiveKeys.length >= 2;
  // Is this payload a SKILL circuit rather than the marquee? Kept separate from
  // fiveOnly because fiveOnly answers "is this a run at all", which is what
  // every scoring line below cares about, while this answers "which run", which
  // is what the completion gate and the client's labels care about.
  const circuitOn = fiveOnly && !fiveFlag && !!circuitDef;
  // ONE CIRCUIT RANKS ON QUESTIONS RIGHT (owner, 2026-08-30). The Trivia
  // Gauntlet's seven games are seven banks of four-choice questions, so its
  // board is the plain count of answers a player got right across the run and
  // the shorter clock takes a tie. Everything above this line is untouched:
  // each game is still scored by the same scoreGame and still pays the same
  // ladder into its own board, its crown and IQ Points. Only the combined rows
  // this payload sorts and prints are converted, by rankByCorrect below.
  const rawScore = circuitOn && circuitScoreMode(circuitId) === 'correct';
  // ONE CIRCUIT RANKS ON THE CLOCK (owner, 2026-09-05): the Valet Gauntlet's
  // rows are converted by rankByTime the same way, lots parked then the
  // combined clock, and the payload says so in scoreMode.
  const byTime = circuitOn && circuitScoreMode(circuitId) === 'time';
  const scoreMode = rawScore ? 'correct' : (byTime ? 'time' : 'points');
  const games = gamesForSuffix(fiveOnly ? fiveKeys : DAILY_KEYS, suffix, today);
  const wanted = new Set(games.map((g) => g.quizId));
  // FROZEN: the Eastern day is over, so this board is final. Rows that landed
  // after midnight still count for their own game's leaderboard (read straight
  // out of /api/quiz/board and /api/quiz/daily-me, neither of which is cut off)
  // but never re-open the combined day or its crown.
  const frozen = dayIsFrozen(suffix, today);
  const cutoffMs = frozen ? etDayEndMs(isoOfSuffix(suffix)) : 0;
  // Best-N and the ceiling scale to how many games existed that day (1..10).
  const gameCount = games.length;
  // best-N is per-day: best 10 from the 2026-07-24 slate on, best 5 before.
  // A SKILL CIRCUIT SCORES OVER ITS WHOLE ROSTER (owner, 2026-08-27). Best-N
  // was pinned at FIVE_SIZE for every circuit, which is right for the marquee
  // and right for a five, and wrong for every other size: the Arcade pair could
  // only ever reach 30 while its own board announced a ceiling of 75, and the
  // circuit's landing page has always said n * 15. The ladder pays per game
  // either way, so not one player's points move; only the ceiling and the
  // fraction printed beside them come right. effBestN below still caps this at
  // the number of games that actually published that day.
  const dayBestN = circuitOn ? fiveKeys.length : (fiveOnly ? FIVE_SIZE : bestNForSuffix(suffix));
  // Which points rule this day pays, so the client can print the matching
  // explainer on an archived day instead of describing today's rule.
  const ladder = usesLadder(suffix);
  const effBestN = gameCount ? Math.min(dayBestN, gameCount) : dayBestN;
  // `let`, because a questions-right circuit replaces this with the day's own
  // question count once the banks' totals are in hand (below).
  let maxTotal = byTime ? fiveKeys.length : effBestN * GAME_MAX;

  // The group is resolved BEFORE the rows are read, so a bad code or a
  // missing table costs one small query and never a board computation.
  const groupCode = (searchParams.get('group') || '').trim();
  let groupRef = null;
  if (groupCode && !fiveOnly) {
    try {
      const group = await groupByCode(supabaseAdmin, groupCode);
      if (!group) return NextResponse.json({ date: suffix, group: null, error: 'not_found' }, { status: 404, headers: NO_STORE_HEADERS });
      groupRef = { group, members: await membersOf(supabaseAdmin, group.id) };
    } catch (e) {
      const missing = isMissingTable(e) || /groups tables missing/.test(String(e && e.message));
      return NextResponse.json({ date: suffix, group: null, available: !missing }, { status: missing ? 503 : 500, headers: NO_STORE_HEADERS });
    }
  }

  const empty = { date: suffix, five: fiveOnly && !circuitOn, circuit: circuitOn ? circuitId : null, rankRequiresAll: fiveOnly, partial: 0, frozen, maxTotal, scoreMode, gameMax: GAME_MAX, ladder, bestN: effBestN, gameCount, uniquePlayers: 0, games: [], overall: [], me: null, meProvisional: null };
  try {
    // Read ONLY this day's quizIds (indexed by quiz_results_quiz, migration 20)
    // rather than the whole table. This route never looks at a row outside
    // `wanted`, so the rows are identical to what the full-table read produced
    // after its filter, but a cold lambda now fetches ~780 rows in one request
    // instead of paging all 33,800. That cold path was measured at 8.5s and
    // 11.7s on live instances, and it sits directly on the end-of-game wait.
    const { data, error } = await loadDailyResultsCached(supabaseAdmin, [...wanted], { force: fresh });
    if (error) {
      console.error('daily-combined error', error);
      return NextResponse.json(empty);
    }

    // Bucket the day's quizIds' rows in one pass. The loader is already scoped
    // to `wanted`, so the guard below is now belt-and-braces rather than a real
    // filter, and is kept so the pass stays correct if the loader ever widens.
    const rowsByQuiz = new Map();
    const dayRows = frozen ? rowsWithinDay(data || [], suffix) : (data || []);
    for (const r of dayRows) {
      if (!r || !wanted.has(r.quiz_id)) continue;
      let arr = rowsByQuiz.get(r.quiz_id);
      if (!arr) { arr = []; rowsByQuiz.set(r.quiz_id, arr); }
      arr.push(r);
    }

    // Unique players who touched ANY of today's daily games, guests included:
    // distinct by account (u:<user_id>) or, for a guest, by browser (a:<anon_id>).
    // A player who cleared ten games counts once. This is the headline "N players
    // today" number and intentionally includes non-registered guests.
    const uniqueSet = new Set();
    for (const arr of rowsByQuiz.values()) {
      for (const r of arr) {
        const k = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
        if (k) uniqueSet.add(k);
      }
    }
    const uniquePlayers = uniqueSet.size;

    // OUTWIT OVERRIDE: Outwit is adaptively re-scored on every view (see
    // lib/outwit-score); its quiz_results snapshot is frozen at submission and
    // would disagree with the live result-page board. Recompute it from
    // outwit_picks so the per-game tab and the overall total track the live board.
    let outwitLive = null;
    const outwitGame = games.find((g) => g.key === 'outwit');
    if (outwitGame) {
      const op = (GAME_PUZZLES.outwit || []).find((x) => x && x.quizId === outwitGame.quizId);
      if (op) outwitLive = await scoreOutwitLive(op, cutoffMs);
    }
    // Same override for Outrank (also adaptive; see lib/outrank-score).
    let outrankLive = null;
    const outrankGame = games.find((g) => g.key === 'outrank');
    if (outrankGame) {
      const op = (GAME_PUZZLES.outrank || []).find((x) => x && x.quizId === outrankGame.quizId);
      if (op) outrankLive = await scoreOutrankLive(op, cutoffMs);
    }
    // Same override for Feud (live crowd-survey key; see lib/feud-score).
    let feudLive = null;
    const feudGame = games.find((g) => g.key === 'feud');
    if (feudGame) {
      const fp = (GAME_PUZZLES.feud || []).find((x) => x && x.quizId === feudGame.quizId);
      if (fp) feudLive = await scoreFeudLive(fp, cutoffMs);
    }

    const gameResults = games.map((g) => {
      if (g.key === 'outwit' && outwitLive) {
        return { key: g.key, quizId: g.quizId, num: g.num, rev: g.rev, href: g.href, field: outwitLive.field, plays: outwitLive.plays, players: outwitLive.players };
      }
      if (g.key === 'outrank' && outrankLive) {
        return { key: g.key, quizId: g.quizId, num: g.num, rev: g.rev, href: g.href, field: outrankLive.field, plays: outrankLive.plays, players: outrankLive.players };
      }
      if (g.key === 'feud' && feudLive) {
        return { key: g.key, quizId: g.quizId, num: g.num, rev: g.rev, href: g.href, field: feudLive.field, plays: feudLive.plays, players: feudLive.players };
      }
      const gameRows = rowsByQuiz.get(g.quizId) || [];
      const gr = scoreGame(gameRows);
      // field = all traceable first-attempt players (registered + guests); plays
      // = EVERY completion for that puzzle (repeats included).
      return { key: g.key, quizId: g.quizId, num: g.num, rev: g.rev, href: g.href, field: gr.field, plays: gameRows.length, players: gr.players };
    });

    const overallFull = combineDaily(gameResults, dayBestN);

    // QUESTIONS RIGHT, for the one circuit that ranks that way. The rows keep
    // every per-game figure they already carried (each game's own points, rank
    // and clock are all still on them); their combined `total` becomes the sum
    // of the scores and `timeTotal` the sum of the clocks.
    if (byTime) {
      // LOTS PARKED, then the clock. The ceiling is simply the member count.
      rankByTime(overallFull, games.map((g) => g.key));
      maxTotal = games.length;
    }
    if (rawScore) {
      rankByCorrect(overallFull, games.map((g) => g.key));
      // The ceiling is the day's own question count, read off the banks the way
      // scoreGame reads a game's denominator: the largest `total` any player
      // recorded for that puzzle. A bank nobody has opened yet contributes
      // nothing and the ceiling comes right the moment somebody plays it, which
      // is the same self-correcting rule the per-game denominator already uses.
      maxTotal = gameResults.reduce((sum, g) => {
        let t = 0;
        for (const p of g.players.values()) t = Math.max(t, Number(p.total) || 0);
        return sum + t;
      }, 0);
    }

    if (groupRef) {
      return NextResponse.json(
        groupPayload({ suffix, frozen, maxTotal, gameCount, gameResults, overallFull, group: groupRef.group, members: groupRef.members, bestN: effBestN }),
        { headers: frozen ? GROUP_FROZEN_HEADERS : GROUP_HEADERS },
      );
    }

    // Resolve the viewer so we can always surface THEIR standing, even outside
    // the top DISPLAY. email -> account, else this browser's anon.
    let myKey = null;
    try {
      const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
      if (ident && ident.id) myKey = `u:${ident.id}`;
      else if (anonId) myKey = `a:${anonId}`; // guests are scored into overallFull; myKey finds them directly
    } catch (e) { /* identity is best-effort */ }
    const me = myKey ? (overallFull.find((row) => row.userKey === myKey) || null) : null;

    // Fallback provisional standing: only reached when a guest is absent from
    // overallFull (e.g. no scored rows yet). After Part 3 guests appear in
    // overallFull directly via scoreGame(), so me is non-null for them.
    let meProvisional = null;
    if (!me && anonId) {
      const guestByGame = new Map();
      for (const g of games) {
        const gr = chooseGuestRow(rowsByQuiz.get(g.quizId) || [], anonId, g.quizId);
        if (gr) guestByGame.set(g.key, gr);
      }
      if (guestByGame.size) meProvisional = guestProvisional(guestByGame, gameResults, overallFull, dayBestN);
      // On a questions-right circuit the guest's provisional standing has to be
      // quoted in the same unit as the board it previews, or the end card tells
      // them registering would earn them a points figure the board never shows.
      // Their per-game ranks above are unchanged; only the combined total and
      // the position it would take are recomputed, against the same rows.
      if (meProvisional && byTime) {
        let parked = 0, secs = 0;
        for (const entry of guestByGame.values()) {
          const row = entry.row || entry;
          if (row.abandoned || !(Number(row.score) > 0)) continue;
          parked += 1;
          secs += Number(row.time_elapsed) || 0;
        }
        meProvisional.total = parked;
        meProvisional.timeTotal = secs;
        meProvisional.rank = overallFull.filter((r) => (r.total || 0) > parked
          || ((r.total || 0) === parked && (r.timeTotal || 0) < secs)).length + 1;
      }
      if (meProvisional && rawScore) {
        let right = 0, secs = 0;
        for (const entry of guestByGame.values()) {
          const row = entry.row || entry;
          right += Number(row.score) || 0;
          secs += Number(row.time_elapsed) || 0;
        }
        meProvisional.total = right;
        meProvisional.timeTotal = secs;
        meProvisional.rank = overallFull.filter((r) => (r.total || 0) > right
          || ((r.total || 0) === right && (r.timeTotal || 0) < secs)).length + 1;
      }
    }

    // Per-game display boards. Rows are the registered (named) players only, but
    // they are renumbered with a FRESH sequential competition rank (1,2,3...) so
    // the public board never shows gaps where unshown anonymous guests sit in the
    // full-field order (that produced boards reading #3, #9, #14...). `field`/
    // `plays` still count EVERYONE (guests included), so the "of today"
    // denominator stays the full pool. (owner rule 2026-07-26)
    const perGameRegRank = new Map(); // g.key -> Map(userKey -> registered board rank)
    const gameBoards = gameResults.map((g) => {
      const named = [...g.players.values()]
        .filter((p) => !!p.username)    // public board: named (registered) players only
        .sort((a, b) => a.rank - b.rank || b.points - a.points || String(a.username || '').localeCompare(String(b.username || '')));
      const rankByKey = new Map();
      let dr = 0, prevPts = null, seenN = 0;
      for (const p of named) {
        seenN += 1;
        const p10 = Math.round(p.points * 10); // one-decimal points; genuine ties share a rank
        if (prevPts === null || p10 !== prevPts) { dr = seenN; prevPts = p10; }
        rankByKey.set(p.userKey, dr);
      }
      perGameRegRank.set(g.key, rankByKey);
      return {
        key: g.key,
        quizId: g.quizId,
        num: g.num,
        rev: g.rev,
        href: g.href,
        field: g.field,
        plays: g.plays,
        registered: named.length,   // named (registered) players only, uncapped
        board: named.slice(0, BOARD).map((p) => ({
          userKey: p.userKey,
          username: p.username,
          rank: rankByKey.get(p.userKey),
          score: p.score,
          total: p.total,
          guessesUsed: p.guessesUsed,
          // Attempts to solve, and the tier that attempt reached. End Game only
          // (null elsewhere); the board panel prints it in place of the per-run
          // error count, which is no longer what the ranking turns on.
          tries: p.tries ?? null,
          egTier: p.egTier ?? null,
          timeElapsed: p.timeElapsed,
          points: Math.round(p.points * 10) / 10,
          completion: Math.round(p.completion * 10) / 10,
          placement: Math.round(p.placement * 10) / 10,
        })),
      };
    });

    // Combined-today board: same treatment. Registered players only, renumbered
    // sequentially by best-N total, with the full pool still behind the "of N".
    // TO RANK ON A CIRCUIT BOARD YOU MUST HAVE PLAYED EVERY GAME IN IT (owner,
    // 2026-08-18). A skill circuit is a fixed roster that is open all day, so
    // partial credit would let a player top it by playing the one game they are
    // best at and skipping the other four, which is the opposite of what a
    // circuit is for. Incomplete players still SCORE — their points, their
    // per-game rows and the plays counts are all untouched — they simply carry
    // no rank until the circuit is finished.
    //
    // PLAYED, not SOLVED, and an abandoned row is not played: the same test the
    // band and the slate rail use. Deliberately NOT applied to the marquee: the
    // Daily Five's board is live and ranks partial runs today, and the owner's
    // rule that the Five persists as it is covers its board too. Extending it
    // there is one word here (drop the !fiveFlag from circuitOn above) and an
    // owner call, not an implementation detail.
    // THE MARQUEE IS GATED TOO (owner, 2026-08-18, reversing the same day's
    // carve-out). It was excluded on the reasoning that the Daily Five's board
    // was already live and ranking partial runs, so changing it mid-day would
    // move a board people were already on. The owner's call is that the Five is
    // a circuit and the rule is the rule: a combined placement across five
    // games means nothing from somebody who played two of them. So the gate is
    // now every run, marquee included, and only the full slate is ungated.
    const memberKeys = fiveOnly ? games.map((g) => g.key) : null;
    const rankEligible = (r) => {
      if (!memberKeys) return true;
      const pg = r && r.perGame;
      if (!pg) return false;
      // On the clock board a lot given up (score 0) is not parked, and a run
      // takes a rank only once every lot is (owner, 2026-09-05).
      return memberKeys.every((k) => pg[k] && !pg[k].abandoned && (!byTime || Number(pg[k].score) > 0));
    };
    const overallNamed = overallFull.filter((r) => !!r.username && rankEligible(r));
    const overallRankByKey = new Map();
    {
      let dr = 0, prevT = null, seenN = 0;
      for (const r of overallNamed) {
        seenN += 1;
        // A tie needs BOTH terms on a board the clock separates (correct,
        // time): every full Valet run has the same `total` (three lots), so a
        // total-only key would hand the whole board rank 1.
        const t10 = (rawScore || byTime)
          ? `${Math.round((r.total || 0) * 10)}|${Math.round(r.timeTotal || 0)}`
          : Math.round((r.total || 0) * 10);
        if (prevT === null || t10 !== prevT) { dr = seenN; prevT = t10; }
        overallRankByKey.set(r.userKey, dr);
      }
    }
    const overallBoardOut = overallNamed.slice(0, DISPLAY).map((r) => ({ ...r, rank: overallRankByKey.get(r.userKey) }));

    // THE RIVAL (owner, 2026-08-14). The named player immediately AHEAD of the
    // viewer on this board, or immediately BEHIND when the viewer is already
    // first. The home rail's challenge tile offers a duel against them, and it
    // cannot read this off `overall`: that is the top 10, so a viewer sitting
    // at #16 has no neighbour anywhere in the payload. Computed here because
    // the full named board and the viewer's own row are both already in hand.
    let rival = null;
    if (me && me.userKey) {
      const ix = overallNamed.findIndex((r) => r.userKey === me.userKey);
      if (ix >= 0) {
        const pick = ix > 0 ? overallNamed[ix - 1] : (overallNamed[1] || null);
        if (pick && pick.userKey !== me.userKey) {
          const behind = ix === 0;
          const diff = behind
            ? (me.total || 0) - (pick.total || 0)
            : (pick.total || 0) - (me.total || 0);
          rival = {
            username: pick.username,
            userKey: pick.userKey,
            rank: overallRankByKey.get(pick.userKey) || null,
            total: pick.total,
            // Always the distance BETWEEN the two, never signed: `behind` says
            // which side of the viewer it is on.
            gap: Math.round(Math.abs(diff) * 10) / 10,
            behind,
            anon: null,
          };
        }
      }
    }
    // The duel composer keys an opponent on their browser anon, so resolve it
    // here (one row) rather than making the client guess the rival by a name
    // search that can match the wrong player. A failure just leaves anon null
    // and the tile falls back to the open composer.
    if (rival) {
      if (rival.userKey.startsWith('a:')) rival.anon = rival.userKey.slice(2);
      else if (rival.userKey.startsWith('u:')) {
        try {
          const { data: ru } = await supabaseAdmin
            .from('quiz_users').select('anon_id').eq('id', rival.userKey.slice(2)).limit(1);
          if (ru && ru[0] && ru[0].anon_id) rival.anon = ru[0].anon_id;
        } catch (e) { /* best effort */ }
      }
      delete rival.userKey;
    }

    // Personal rank tiles use the SAME registered board rank as the player's own
    // row, while the denominator (field/plays/uniquePlayers) stays the full pool,
    // so a registered player reads e.g. "#9 of 28" instead of a gappy "#23 of 28".
    if (me) {
      if (me.perGame) {
        for (const key of Object.keys(me.perGame)) {
          const rk = perGameRegRank.get(key);
          if (rk && me.userKey && rk.has(me.userKey)) me.perGame[key].rank = rk.get(me.userKey);
        }
      }
      if (me.userKey && overallRankByKey.has(me.userKey)) me.rank = overallRankByKey.get(me.userKey);
      // combineDaily already stamped a rank over the whole field, so without
      // this an incomplete circuit player would keep it and read as ranked.
      if (memberKeys && !rankEligible(me)) me.rank = null;
    }

    return NextResponse.json({
      date: suffix,
      // Whether this payload is the five-game run or the full slate, so a
      // client cannot mistake one for the other when both are in flight.
      five: fiveOnly && !circuitOn,
      // Which skill circuit this payload is, or null for the marquee and for
      // the full slate, so a client cannot mistake one narrowed board for
      // another when more than one is in flight.
      circuit: circuitOn ? circuitId : null,
      // Whether this board ranks only players who finished every game in it.
      rankRequiresAll: fiveOnly,
      // Named players who have STARTED the run but not finished it. The gate
      // makes an early-in-the-day circuit board legitimately empty, and an
      // empty board with no explanation reads as broken rather than as strict,
      // so the client can say how many people are partway instead.
      partial: memberKeys ? overallFull.filter((r) => r.username && !rankEligible(r)).length : 0,
      // The day is over and this board is final. Clients label it, and nothing
      // posted since Eastern midnight is in it.
      frozen,
      maxTotal,
      // How this board is ranked and what its numbers ARE: 'points' is the
      // 0..15 ladder summed over the roster, 'correct' is questions answered
      // right with the clock as the tiebreak. Every client that prints a total
      // reads this rather than assuming a unit.
      scoreMode,
      gameMax: GAME_MAX,
      ladder,
      bestN: effBestN,
      gameCount,
      uniquePlayers,
      // overallField = EVERYONE WHO PLAYED, guests and partial runs included
      // (owner, 2026-09-03: "#1 of 24 on the Trivia Gauntlet should be out of
      // all plays"). It used to count only players eligible to be ranked on a
      // circuit, i.e. those who had finished every member game, which read as
      // a smaller crowd than the one the reader had actually beaten. The RANK
      // beside it is unchanged: a registered player's position among
      // registered, rank-eligible players, so guests ahead of you never move
      // your number, only the denominator. Ten guests who played and five who
      // placed ahead therefore read "#1 of 34", not "#6 of 34" and not
      // "#1 of 24". `partial` still counts the named players who are not yet
      // eligible, so a strict board can explain itself.
      overallField: overallFull.length,
      games: gameBoards,
      overall: overallBoardOut,
      me,
      meProvisional,
      rival,
    }, { headers: fresh ? NO_STORE_HEADERS : CACHE_HEADERS });
  } catch (e) {
    console.error('daily-combined exception', e);
    return NextResponse.json(empty);
  }
}
