import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadDailyResultsCached } from '@/lib/daily-results-cache';
import { resolvePlayerKeys } from '@/lib/quiz-identity';
import { scoreGame, DAILY_KEYS, GAME_MAX } from '@/lib/daily-combined';
import { scoreOutwitGame } from '@/lib/outwit-score';
import { scoreOutrankGame } from '@/lib/outrank-score';
import { scoreFeudGame } from '@/lib/feud-score';
import { scoreHerdGame } from '@/lib/herd-score';
import { GAME_PUZZLES, etTodayServer, suffixFromRequest, gamesForSuffix } from '@/lib/daily-slate';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

const BOARD = 10;

// The end card's question, answered directly (2026-08-01).
//
// WHY THIS EXISTS: the card only ever needed "where did I place in the game I
// just finished, and which of today's puzzles have I done". It was reading that
// out of /api/quiz/daily-combined, which answers a much larger question: it
// scores all ~40 of the day's games, re-scores the three adaptive ones live
// against their picks tables (nine sequential round trips), computes every
// player's best-N combined total, and builds display boards for all of it. The
// card used one rank and one denominator out of that payload, and waited
// 1.2-1.9s warm (8-12s on a cold instance) to get them, on the blocking
// post-game path.
//
// scoreGame() takes ONE game's rows and nothing else, so the rank the card wants
// is local to the puzzle just played. This route does exactly that work: score
// the player's own game properly (including a live re-score if it is one of the
// adaptive three), and for the other games only COUNT rows, which is what the
// "easiest leaderboard today" card and the completion grid actually consume.
// No combined totals, no boards for games the player did not open.
//
// GET /api/quiz/daily-me?game=<key>&quizId=<id>&date=<M-D-YY>&anonId=&email=&fresh=1
//   -> { date, gameCount, self, game, me, perGame, games, slate }

const ADAPTIVE = {
  outwit: { table: 'outwit_picks', score: scoreOutwitGame },
  outrank: { table: 'outrank_picks', score: scoreOutrankGame },
  feud: { table: 'feud_picks', score: scoreFeudGame },
  // Herd stores its ballots in outwit_picks under herd-* quiz ids.
  herd: { table: 'outwit_picks', score: scoreHerdGame },
};

// Outwit / Outrank / Feud are scored against the live crowd, so their frozen
// quiz_results snapshot disagrees with the board the player sees on the results
// page. daily-combined re-scores all three on every request; this route only
// re-scores the ONE the player actually played, and only when they played it.
// Returns a scoreGame-shaped { field, players } or null to fall back to the
// snapshot.
async function scoreAdaptiveLive(key, puzzle) {
  const cfg = ADAPTIVE[key];
  if (!cfg || !puzzle) return null;
  let rows = [];
  try {
    const { data, error } = await supabaseAdmin
      .from(cfg.table)
      .select('anon_id, user_id, answers, created_at')
      .eq('quiz_id', puzzle.quizId)
      .limit(20000);
    if (error || !Array.isArray(data)) return null;
    rows = data;
  } catch (e) { return null; }

  const picks = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => ({ answers: r.answers, created: r.created_at || '', userId: r.user_id || null, anonId: r.anon_id || null }));

  const userIds = [...new Set(picks.map((p) => p.userId).filter(Boolean))];
  const anonIds = [...new Set(picks.map((p) => p.anonId).filter(Boolean))];
  const nameByUser = new Map();
  const infoByAnon = new Map();
  try {
    // Both lookups at once: daily-combined awaits these serially, three games
    // deep, which is most of its round-trip count.
    const [byId, byAnon] = await Promise.all([
      userIds.length ? supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds) : Promise.resolve({ data: [] }),
      anonIds.length ? supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('anon_id', anonIds) : Promise.resolve({ data: [] }),
    ]);
    for (const u of (byId.data || [])) if (u.username) { nameByUser.set(u.id, u.username); if (u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id }); }
    for (const u of (byAnon.data || [])) if (u.username && u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id });
  } catch (e) { /* no names: board empty, pool still scores */ }

  const named = picks.map((p) => {
    let name = null, userId = p.userId;
    if (p.userId && nameByUser.has(p.userId)) name = nameByUser.get(p.userId);
    else if (p.anonId && infoByAnon.has(p.anonId)) { const info = infoByAnon.get(p.anonId); name = info.username; userId = info.id; }
    return { answers: p.answers, created: p.created, anonId: p.anonId, userId, name };
  });

  const gr = cfg.score(puzzle, named);
  return { field: gr.field, plays: picks.length, players: gr.players };
}

// Registered-only board with a FRESH sequential rank, so the public board never
// shows gaps where unshown guests sit in the full-field order. Same treatment as
// daily-combined (owner rule 2026-07-26): field/plays still count everyone.
function registeredBoard(players) {
  const named = [...players.values()]
    .filter((p) => !!p.username)
    .sort((a, b) => a.rank - b.rank || b.points - a.points || String(a.username || '').localeCompare(String(b.username || '')));
  const rankByKey = new Map();
  let dr = 0, prev = null, seen = 0;
  for (const p of named) {
    seen += 1;
    const p10 = Math.round(p.points * 10);
    if (prev === null || p10 !== prev) { dr = seen; prev = p10; }
    rankByKey.set(p.userKey, dr);
  }
  return { named, rankByKey };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const self = (searchParams.get('game') || '').trim() || null;
  const quizId = (searchParams.get('quizId') || '').trim() || null;
  const fresh = searchParams.get('fresh') === '1' || searchParams.get('fresh') === 'true';

  const today = etTodayServer();
  const suffix = suffixFromRequest({ date: searchParams.get('date'), quizId, today });
  const games = gamesForSuffix(DAILY_KEYS, suffix, today);
  const gameCount = games.length;
  const empty = {
    date: suffix, gameCount, self, gameMax: GAME_MAX,
    game: null, me: null, perGame: {}, games: [], slate: { done: 0, total: gameCount },
  };
  if (!gameCount) return NextResponse.json(empty, { headers: fresh ? NO_STORE_HEADERS : CACHE_HEADERS });

  try {
    const ids = games.map((g) => g.quizId);
    const { data, error } = await loadDailyResultsCached(supabaseAdmin, ids, { force: fresh });
    if (error) {
      console.error('daily-me error', error);
      return NextResponse.json(empty);
    }

    const rowsByQuiz = new Map();
    for (const r of (data || [])) {
      if (!r) continue;
      let arr = rowsByQuiz.get(r.quiz_id);
      if (!arr) { arr = []; rowsByQuiz.set(r.quiz_id, arr); }
      arr.push(r);
    }

    let myKey = null;
    let myKeys = new Set();
    try {
      const who = await resolvePlayerKeys(supabaseAdmin, { email, anonId });
      myKey = who.primary;
      myKeys = who.keys;
    } catch (e) {
      // identity is best-effort; guests still score by anon key
      if (anonId) { myKey = `a:${anonId}`; myKeys = new Set([myKey]); }
    }

    // One player's rows for a single day can be filed under u:<id> or a:<anon>
    // depending on which device played it, so check every key they own instead
    // of the account key alone.
    const mineIn = (players) => {
      if (!players) return null;
      if (myKey && players.has(myKey)) return { key: myKey, value: players.get(myKey) };
      for (const k of myKeys) if (players.has(k)) return { key: k, value: players.get(k) };
      return null;
    };

    // Score every game from the day's rows. This is pure in-memory work over the
    // ~780 rows the scoped loader returned, no extra queries, and it is what
    // yields both the completion set and the per-game counts the easiest-board
    // card sorts on.
    const perGame = {};
    const gameCounts = [];
    let selfResult = null, selfGame = null;
    for (const g of games) {
      const rows = rowsByQuiz.get(g.quizId) || [];
      const gr = scoreGame(rows);
      const { rankByKey } = registeredBoard(gr.players);
      const hit = mineIn(gr.players);
      if (hit) {
        const mine = hit.value;
        perGame[g.key] = {
          rank: rankByKey.has(hit.key) ? rankByKey.get(hit.key) : mine.rank,
          field: gr.field,
          points: Math.round(mine.points * 10) / 10,
          score: mine.score,
          total: mine.total,
          abandoned: !!mine.abandoned,
        };
      }
      gameCounts.push({
        key: g.key, quizId: g.quizId, num: g.num, rev: g.rev, href: g.href,
        field: gr.field,
        plays: rows.length,
        registered: [...gr.players.values()].filter((p) => !!p.username).length,
      });
      if (self && g.key === self) { selfResult = gr; selfGame = g; }
    }

    // The player's own game gets the full treatment: a live re-score if it is
    // adaptive, plus the top-10 board the Today tile expands to.
    let out = null;
    if (selfGame) {
      let gr = selfResult;
      if (ADAPTIVE[selfGame.key]) {
        const puzzle = (GAME_PUZZLES[selfGame.key] || []).find((p) => p && p.quizId === selfGame.quizId);
        const live = await scoreAdaptiveLive(selfGame.key, puzzle);
        if (live) gr = live;
      }
      const { named, rankByKey } = registeredBoard(gr.players);
      const rows = rowsByQuiz.get(selfGame.quizId) || [];
      out = {
        key: selfGame.key, quizId: selfGame.quizId, num: selfGame.num, rev: selfGame.rev, href: selfGame.href,
        field: gr.field,
        plays: gr.plays != null ? gr.plays : rows.length,
        registered: named.length,
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
        })),
      };
      const hit = mineIn(gr.players);
      if (hit) {
        const mine = hit.value;
        perGame[selfGame.key] = {
          rank: rankByKey.has(hit.key) ? rankByKey.get(hit.key) : mine.rank,
          field: gr.field,
          points: Math.round(mine.points * 10) / 10,
          score: mine.score,
          total: mine.total,
          abandoned: !!mine.abandoned,
        };
      }
    }

    const me = myKey ? { userKey: myKey, ...(perGame[self] || {}) } : null;

    return NextResponse.json({
      date: suffix,
      gameCount,
      gameMax: GAME_MAX,
      self,
      game: out,
      me: me && me.rank != null ? me : (myKey ? { userKey: myKey } : null),
      perGame,
      games: gameCounts,
      slate: { done: Object.keys(perGame).length, total: gameCount },
    }, { headers: fresh ? NO_STORE_HEADERS : CACHE_HEADERS });
  } catch (e) {
    console.error('daily-me exception', e);
    return NextResponse.json(empty);
  }
}
