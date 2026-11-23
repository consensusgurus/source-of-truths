import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { MEGA, etDayNum } from '@/lib/mega';
import { megaBoard, megaSchedule, megaCrowd, publicCrowd, megaFile, megaSettle, megaWall, solvesOf, timesOf, pubId, layoutOf, gridDigits } from '@/lib/mega-server';

// /api/mega: the crowd behind Colossus and Mammoth, the massive sudokus.
//
// GET  ?game=<colossus|mammoth>&board=<n>
//   The board's crowd, the same for everyone, cached at the edge for a minute:
//   how many players solved each sudoku (`counts`), the first few of them
//   (`by`), the standings (points first, sudokus solved second: every sudoku
//   is a 100 point pot split among its solvers), every player's [points,
//   total], and the board's window. It also stamps a board solved the moment
//   every sudoku has a solver, and files the final values once it has closed.
//   THE PAGE shows a sudoku's count and names only once its own player has
//   solved it (owner, 2026-11-21: hidden until solved).
//
// POST { game, board, anonId, email?, solve?: { g, d }, force? }
//   `solve` offers one FULL sudoku: g its index, d its digits row by row. The
//   server compares them with the solution (which never reaches a browser) and
//   (GET ?wall=1 is the closing screen's data, served for a closed board only.)
//   answers `ok` true or false and nothing more about it: no square is marked
//   right or wrong (owner, 2026-11-21). A correct one is added to the player's
//   row while the board is open. Every answer carries the player's solved list
//   and those sudokus' digits, so a second device can draw them.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const EDGE = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' };
const str = (v, n = 120) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function boardAndWindow(game, n) {
  if (!MEGA[game]) return null;
  const board = megaBoard(game, n);
  if (!board) return null;
  const wins = await megaSchedule(game);
  const win = wins.find((w) => w.num === board.num);
  if (!win) return null; // not open yet
  return { board, win, current: wins[wins.length - 1].num };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = str(searchParams.get('game'), 20);
  const bw = await boardAndWindow(game, searchParams.get('board'));
  if (!bw) return NextResponse.json({ error: 'No board' }, { status: 404, headers: NO_STORE });
  if (searchParams.get('wall')) {
    // The closing wall: a closed board only (who solved what stays hidden until then).
    try {
      const wall = await megaWall(game, bw.board, bw.win);
      if (!wall) return NextResponse.json({ error: 'Still open' }, { status: 403, headers: NO_STORE });
      return NextResponse.json(wall, { headers: { 'Cache-Control': 'public, max-age=600, s-maxage=86400, stale-while-revalidate=86400' } });
    } catch (e) {
      return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
    }
  }
  try {
    const crowd = await megaCrowd(game, bw.board, bw.win);
    if (crowd.closed) { try { await megaSettle(game, bw.board, crowd); } catch (e) { /* next asker settles */ } }
    return NextResponse.json({ ...publicCrowd(crowd), current: bw.current }, { headers: EDGE });
  } catch (e) {
    return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
  }
}

async function playerOf({ anonId, email }) {
  const anon = typeof anonId === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(anonId) ? anonId : null;
  let user = null;
  try { user = await findQuizIdentity(supabaseAdmin, { email, anonId: anon }); } catch (e) { user = null; }
  if (user && user.id && user.username) return { key: `u:${user.id}`, userId: user.id, name: user.username, anon };
  if (!anon) return null;
  return { key: `a:${anon}`, userId: null, name: null, anon };
}

const lastFiled = new Map(); // player key -> ms, per server instance

export async function POST(request) {
  let body = null;
  try { body = JSON.parse(await request.text()); } catch (e) { body = null; }
  const game = body && str(body.game, 20);
  const bw = body && await boardAndWindow(game, body.board);
  if (!bw) return NextResponse.json({ error: 'No board' }, { status: 400, headers: NO_STORE });
  const { board, win } = bw;
  const who = await playerOf({ anonId: str(body.anonId, 64), email: str(body.email) || null });
  if (!who) return NextResponse.json({ error: 'No player' }, { status: 400, headers: NO_STORE });
  const L = layoutOf(game, board);
  const N = L.grids.length;
  const { data: rows } = await supabaseAdmin.from('outwit_picks')
    .select('id, answers').eq('quiz_id', board.key).eq('anon_id', who.key).limit(1);
  const row = rows && rows[0];
  const have = solvesOf(row, N);
  const times = timesOf(row, N);
  const t0 = (row && row.answers && Number(row.answers.t0)) || Date.now();
  const open = !(win.closes && win.closes <= Date.now());

  // One full sudoku offered: right or not, and no more than that.
  let ok = null, g = null;
  const s = body.solve;
  if (s && Number.isInteger(s.g) && s.g >= 0 && s.g < N && typeof s.d === 'string' && s.d.length === L.N * L.N) {
    g = s.g;
    ok = s.d === gridDigits(game, board, g);
  }
  let grew = false;
  if (open) {
    if (ok && !have.has(g)) { have.set(g, etDayNum()); times.set(g, Date.now()); grew = true; }
    if (grew || (!row && ok)) {
      const f = [...have.keys()];
      const answers = { f, d: f.map((i) => have.get(i)), t: f.map((i) => times.get(i) || t0), t0 };
      const res = row
        ? await supabaseAdmin.from('outwit_picks').update({ answers, user_id: who.userId }).eq('id', row.id)
        : await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: who.key, user_id: who.userId, answers });
      if (res && res.error) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
    }
    const due = !lastFiled.has(who.key) || Date.now() - lastFiled.get(who.key) > 10 * 60 * 1000;
    if (have.size && (body.force || grew && due)) {
      lastFiled.set(who.key, Date.now());
      try {
        const crowd = await megaCrowd(game, board, win);
        const counts = crowd.counts.slice();
        if (grew) counts[g] = Math.max(1, counts[g] + 1); // the counts were read a moment ago
        await megaFile(game, board, who, have, counts);
      } catch (e) { /* filed on the next sync or when the board settles */ }
    }
  }
  const solved = [...have.keys()].sort((a, b) => a - b);
  // A closed board still tells a visitor whether a sudoku is right (for fun),
  // and hands back its digits; it is just not added to anyone's row.
  const digits = {};
  for (const i of solved) digits[i] = gridDigits(game, board, i);
  if (ok && !have.has(g)) digits[g] = gridDigits(game, board, g);
  return NextResponse.json({ me: pubId(who.key), name: who.name, solved, digits, ok, g, open }, { headers: NO_STORE });
}
