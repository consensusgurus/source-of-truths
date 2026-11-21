import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { etDayNum } from '@/lib/search';
import { BOARD_BY_NUM, searchSchedule, searchCrowd, publicCrowd, searchFile, searchSettle, findsOf, pubId } from '@/lib/search-server';

// /api/search: the crowd behind Search, the enormous word search.
//
// GET  ?board=<n>
//   The board's crowd, the same for everyone, cached at the edge for a minute:
//   how many players found each entry (`counts`, in list order), the standings
//   (points first, total finds second: every entry is a 100 point pot split
//   among its finders), every player's [points, total] so a browser can place
//   itself, and the board's window (opens, closes once known, its 24 hour
//   minimum and 72 hour cap, when the crowd solved it). It also stamps a board
//   solved the moment the crowd has every entry, and files the final values
//   once a board has closed. See lib/search-server.js for the storage.
//
// POST { board, anonId, email?, found: [entry index...], force? }
//   Merges this player's finds into their row (only while the board is open)
//   and answers with the merged list and the player's public id. The player's
//   points for each Eastern day are filed (quiz_results) when they have grown
//   and ten minutes have passed, or when the page forces it on leaving.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const EDGE = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' };
const str = (v, n = 120) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function boardAndWindow(n) {
  const board = BOARD_BY_NUM.get(Number(n));
  if (!board) return null;
  const wins = await searchSchedule();
  const win = wins.find((w) => w.num === board.num);
  if (!win) return null; // not open yet
  return { board, win, current: wins[wins.length - 1].num };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bw = await boardAndWindow(searchParams.get('board'));
  if (!bw) return NextResponse.json({ error: 'No board' }, { status: 404, headers: NO_STORE });
  try {
    const crowd = await searchCrowd(bw.board, bw.win);
    if (crowd.closed) { try { await searchSettle(bw.board, crowd); } catch (e) { /* next asker settles */ } }
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
  const bw = body && await boardAndWindow(body.board);
  if (!bw) return NextResponse.json({ error: 'No board' }, { status: 400, headers: NO_STORE });
  const { board, win } = bw;
  const who = await playerOf({ anonId: str(body.anonId, 64), email: str(body.email) || null });
  if (!who) return NextResponse.json({ error: 'No player' }, { status: 400, headers: NO_STORE });
  const N = board.items.length;
  const { data: rows } = await supabaseAdmin.from('outwit_picks')
    .select('id, answers').eq('quiz_id', board.key).eq('anon_id', who.key).limit(1);
  const row = rows && rows[0];
  const have = findsOf(row, N);
  const t0 = (row && row.answers && Number(row.answers.t0)) || Date.now();
  const open = !(win.closes && win.closes <= Date.now());
  let grew = false;
  if (open && Array.isArray(body.found)) {
    const today = etDayNum();
    for (const i of body.found.slice(0, N)) if (Number.isInteger(i) && i >= 0 && i < N && !have.has(i)) { have.set(i, today); grew = true; }
    if (grew || !row) {
      const f = [...have.keys()];
      const answers = { f, d: f.map((i) => have.get(i)), t0 };
      const res = row
        ? await supabaseAdmin.from('outwit_picks').update({ answers, user_id: who.userId }).eq('id', row.id)
        : await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: who.key, user_id: who.userId, answers });
      if (res && res.error) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
    }
    const due = !lastFiled.has(who.key) || Date.now() - lastFiled.get(who.key) > 10 * 60 * 1000;
    if (have.size && (body.force || (grew && due))) {
      lastFiled.set(who.key, Date.now());
      try {
        const crowd = await searchCrowd(board, win);
        // The counts were read a moment ago; count this player's new finds in.
        const counts = crowd.counts.slice();
        if (grew) for (const i of body.found) if (Number.isInteger(i) && i >= 0 && i < N && !findsOf(row, N).has(i)) counts[i] = Math.max(1, counts[i] + 1);
        await searchFile(board, who, have, counts);
      } catch (e) { /* filed on the next sync or when the board settles */ }
    }
  }
  const f = [...have.keys()].sort((a, b) => a - b);
  return NextResponse.json({ me: pubId(who.key), name: who.name, found: f, open }, { headers: NO_STORE });
}
