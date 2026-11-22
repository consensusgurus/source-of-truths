// lib/mega-server.js: the server side of Colossus and Mammoth, the massive
// sudokus (the schedule, the crowd, checking a sudoku, filing results).
// SERVER-ONLY: imports the service-role client and the boards with solutions.
// Modeled on lib/search-server.js; the two games share every line of it.
//
// STORAGE, no table of its own (all in outwit_picks, as Search and Poll do;
// every reader of that table filters by quiz_id, so the games never mix):
//   - a player's solves on a board: quiz_id = the board's key (colossus-b1),
//     anon_id = the player key (u:<user id> or a:<anon id>), answers =
//     { f: [sudoku index...], d: [Eastern day number of each solve], t0 }
//   - '#solved' on a board's key: answers.at = when its last sudoku was first
//     solved (the board then closes at max(open + 24h, that), capped at 72h)
//   - '#settled' on a board's key: the final results were filed after it closed
// The site day results (quiz_results, quiz ids <game>-M-D-YY from the game's
// ./puzzles.js) hold each player's points FOR SUDOKUS SOLVED THAT DAY, valued at
// the current split, one row per player per day, updated in place.
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-server';
import { BOARDS as COLOSSUS } from '@/app/colossus/boards';
import { BOARDS as MAMMOTH } from '@/app/mammoth/boards';
import { MEGA, megaLayout, megaWindows, megaValue, megaRank, megaQuizId, etDayNum, dayNumToIso, MEGA_POT } from '@/lib/mega';

export const MEGA_BOARDS = { colossus: COLOSSUS, mammoth: MAMMOTH };
export const megaBoard = (game, num) => (MEGA_BOARDS[game] || []).find((b) => b.num === Number(num)) || null;
export const pubId = (key) => createHash('sha256').update('mega|' + key).digest('base64url').slice(0, 10);

const layouts = new Map();
export function layoutOf(game, board) {
  const k = `${game}:${board.A}:${board.B}`;
  if (!layouts.has(k)) layouts.set(k, megaLayout(game, board.A, board.B));
  return layouts.get(k);
}
// What the browser may have of a board: everything but the solution.
export function publicBoard(game, board) {
  const { sol, ...rest } = board;
  return { ...rest, game };
}
// The digits of sudoku `id`, row by row, from a board string.
export function gridDigits(game, board, id, from = 'sol') {
  const L = layoutOf(game, board);
  return L.grids[id].map((x) => board[from][x]).join('');
}

// ---- schedule ---------------------------------------------------------------
const schedCache = {}; // game -> { at, solved }
export async function megaSolvedMap(game, fresh = false) {
  const c = schedCache[game];
  if (!fresh && c && Date.now() - c.at < 20000) return c.solved;
  const solved = {};
  try {
    const boards = MEGA_BOARDS[game];
    const { data } = await supabaseAdmin.from('outwit_picks').select('quiz_id, answers').eq('anon_id', '#solved').in('quiz_id', boards.map((b) => b.key));
    for (const r of data || []) {
      const b = boards.find((x) => x.key === r.quiz_id);
      if (b && r.answers && r.answers.at) solved[b.num] = Number(r.answers.at);
    }
  } catch (e) { /* no markers: every board runs its full window */ }
  schedCache[game] = { at: Date.now(), solved };
  return solved;
}
export async function megaSchedule(game, now = Date.now()) {
  if (!MEGA[game]) return [];
  const solved = await megaSolvedMap(game);
  return megaWindows(game, MEGA_BOARDS[game].length, solved, now);
}

// ---- the crowd ----------------------------------------------------------------
async function loadRows(key) {
  const out = [];
  for (let from = 0; from < 40000; from += 1000) {
    const { data, error } = await supabaseAdmin.from('outwit_picks')
      .select('id, anon_id, user_id, answers').eq('quiz_id', key).range(from, from + 999);
    if (error || !Array.isArray(data)) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out.filter((r) => !String(r.anon_id).startsWith('#'));
}

export function solvesOf(row, N) {
  const a = row && row.answers;
  const f = a && Array.isArray(a.f) ? a.f : [];
  const d = a && Array.isArray(a.d) ? a.d : [];
  const fallback = a && a.t0 ? etDayNum(Number(a.t0)) : etDayNum();
  const out = new Map();
  f.forEach((i, k) => { if (Number.isInteger(i) && i >= 0 && i < N && !out.has(i)) out.set(i, Number.isInteger(d[k]) ? d[k] : fallback); });
  return out; // sudoku index -> Eastern day number of the solve
}

async function namesFor(userIds) {
  const names = new Map();
  for (let k = 0; k < userIds.length; k += 200) {
    try {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username').in('id', userIds.slice(k, k + 200));
      for (const u of data || []) if (u.username) names.set(u.id, u.username);
    } catch (e) { /* guests' labels */ }
  }
  return names;
}

const crowdCache = new Map(); // board key -> { at, value }
export async function megaCrowd(game, board, win, { fresh = false } = {}) {
  const hit = crowdCache.get(board.key);
  if (!fresh && hit && Date.now() - hit.at < 30000) return hit.value;
  const N = layoutOf(game, board).grids.length;
  const rows = await loadRows(board.key);
  const counts = new Array(N).fill(0);
  const sets = rows.map((r) => ({ r, s: solvesOf(r, N) })).filter((x) => x.s.size > 0);
  for (const { s } of sets) for (const i of s.keys()) counts[i]++;
  const names = await namesFor([...new Set(sets.map((x) => x.r.user_id).filter(Boolean))]);
  const players = sets.map(({ r, s }) => {
    let points = 0;
    for (const i of s.keys()) points += megaValue(counts[i]);
    const id = pubId(r.anon_id);
    const named = r.user_id && names.get(r.user_id);
    return { id, name: named || `Guest ${id.slice(0, 4).toUpperCase()}`, points, total: s.size, _row: r, _s: s, _named: named || null };
  }).sort((a, b) => megaRank(a, b) || a.name.localeCompare(b.name));
  let place = 0;
  players.forEach((pl, i) => { if (i === 0 || megaRank(players[i - 1], pl) !== 0) place = i + 1; pl.place = place; });
  // Who solved each sudoku, the first few (a browser shows them only for a
  // sudoku its own player has solved).
  const by = Array.from({ length: N }, () => []);
  for (const pl of players) for (const i of pl._s.keys()) if (by[i].length < 5) by[i].push([pl.id, pl.name]);
  const crowdSolved = counts.filter((c) => c > 0).length;

  // The moment every sudoku has been solved by somebody, stamp it.
  if (crowdSolved === N && !(win && win.solvedAt)) {
    try { await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: '#solved', answers: { at: Date.now() } }); } catch (e) { /* stamped already */ }
    if (schedCache[game]) schedCache[game].at = 0;
  }
  const closed = !!(win && win.closes && win.closes <= Date.now());
  const value = {
    game, board: board.num, at: Date.now(), N, closed,
    opens: win ? win.opens : null, closes: win ? win.closes : null, min: win ? win.min : null, cap: win ? win.cap : null,
    solvedAt: win ? win.solvedAt : null, crowdSolved,
    players: players.length, counts, by,
    standings: players.slice(0, 100).map(({ id, name, points, total, place: p }) => ({ id, name, points, total, place: p })),
    field: players.map((pl) => [pl.points, pl.total]),
    _players: players,
  };
  crowdCache.set(board.key, { at: Date.now(), value });
  return value;
}
export function publicCrowd(c) { const { _players, ...rest } = c; return rest; }

// ---- filing site results ---------------------------------------------------------
// One quiz_results row per player per Eastern day: the points from sudokus
// solved that day, at the current split. Updated in place, never duplicated.
async function upsertDay(game, day, who, points, solves, N) {
  const quizId = megaQuizId(game, dayNumToIso(day));
  let q = supabaseAdmin.from('quiz_results').select('id, score').eq('quiz_id', quizId).order('id', { ascending: false }).limit(1);
  q = who.userId ? q.eq('user_id', who.userId) : q.is('user_id', null).eq('anon_id', who.anon);
  const { data } = await q;
  const row = data && data[0];
  if (row && Number(row.score) === points) return;
  const fields = { score: points, total: N * MEGA_POT, correct_count: points > 0 ? 1 : 0, guesses_used: solves, time_elapsed: 60, abandoned: false };
  if (row) await supabaseAdmin.from('quiz_results').update(fields).eq('id', row.id);
  else await supabaseAdmin.from('quiz_results').insert({ quiz_id: quizId, user_id: who.userId, username: who.name, anon_id: who.anon, ...fields });
}

export async function megaFile(game, board, who, solves, counts) {
  const N = layoutOf(game, board).grids.length;
  const byDay = new Map();
  for (const [i, day] of solves) {
    const e = byDay.get(day) || { points: 0, n: 0 };
    e.points += megaValue(counts[i]); e.n++;
    byDay.set(day, e);
  }
  for (const [day, e] of byDay) {
    try { await upsertDay(game, day, who, e.points, e.n, N); } catch (e2) { /* the next sync files it */ }
  }
}

// Once a board closes, file everyone's final values, once.
export async function megaSettle(game, board, crowd) {
  if (!crowd.closed) return;
  const { data } = await supabaseAdmin.from('outwit_picks').select('id').eq('quiz_id', board.key).eq('anon_id', '#settled').limit(1);
  if (data && data.length) return;
  const { error } = await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: '#settled', answers: { at: Date.now() } });
  if (error) return; // another request is settling it
  for (const pl of crowd._players.slice(0, 3000)) {
    const key = String(pl._row.anon_id);
    const who = key.startsWith('u:')
      ? { userId: pl._row.user_id || key.slice(2), name: pl._named, anon: null }
      : { userId: null, name: null, anon: key.slice(2) };
    await megaFile(game, board, who, pl._s, crowd.counts);
  }
}
