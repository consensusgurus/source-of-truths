import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { resolvePlayerKeys } from '@/lib/quiz-identity';
import { etDayNum } from '@/lib/wanted';
import { BOARD_BY_NUM, wantedSchedule, wantedCrowd, publicCrowd, wantedFile, wantedSettle, findsOf, pubId } from '@/lib/wanted-server';

// /api/wanted: the crowd behind Wanted, the enormous hidden figure hunt (lib/wanted.js). The server side is Search's, word for word, with a thing to find where Search has an entry.
//
// GET  ?board=<n>
//   The board's crowd, the same for everyone, cached at the edge for a minute:
//   how many players found each entry (`counts`, in list order), the standings
//   (points first, total finds second: every entry is a 100 point pot split
//   among its finders), every player's [points, total] so a browser can place
//   itself, and the board's window (opens, closes once known, its 24 hour
//   minimum, when the crowd solved it; no cap since 2026-11-26). It also stamps a board
//   solved the moment the crowd has every entry, and files the final values
//   once a board has closed. See lib/wanted-server.js for the storage.
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
  const wins = await wantedSchedule();
  const win = wins.find((w) => w.num === board.num);
  if (!win) return null; // not open yet
  return { board, win, current: wins[wins.length - 1].num };
}

export async function GET(request) {
  const { wantedParams } = new URL(request.url);
  const bw = await boardAndWindow(wantedParams.get('board'));
  if (!bw) return NextResponse.json({ error: 'No board' }, { status: 404, headers: NO_STORE });
  try {
    const crowd = await wantedCrowd(bw.board, bw.win);
    if (crowd.closed) { try { await wantedSettle(bw.board, crowd); } catch (e) { /* next asker settles */ } }
    return NextResponse.json({ ...publicCrowd(crowd), current: bw.current }, { headers: EDGE });
  } catch (e) {
    return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
  }
}

// Who is syncing: the account when this browser resolves to one (by email, by
// the browser the name was claimed on, or by this browser's own attributed
// rows), else this browser as a guest. `anons` lists every browser tied to the
// account, so finds made on any of them fold into the one account row.
async function playerOf({ anonId, email }) {
  const anon = typeof anonId === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(anonId) ? anonId : null;
  let who = null;
  try { who = await resolvePlayerKeys(supabaseAdmin, { email, anonId: anon }); } catch (e) { who = null; }
  if (who && who.userId && who.username) return { key: `u:${who.userId}`, userId: who.userId, name: who.username, anon, anons: who.anons || [] };
  if (!anon) return null;
  return { key: `a:${anon}`, userId: null, name: null, anon, anons: [] };
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
  const N = board.n;
  // This player's row plus, for an account, the guest rows its other browsers
  // left (owner via the Idea Board, 2026-11-23: finds did not carry across
  // devices and one player showed as two). Those fold into the account row.
  const keys = [...new Set([who.key, ...(who.userId && who.anon ? [`a:${who.anon}`] : []), ...who.anons.map((a) => `a:${a}`)])];
  const { data: rows } = await supabaseAdmin.from('outwit_picks')
    .select('id, anon_id, answers').eq('quiz_id', board.key).in('anon_id', keys).limit(50);
  const row = (rows || []).find((r) => r.anon_id === who.key) || null;
  const strays = who.userId ? (rows || []).filter((r) => r.anon_id !== who.key) : [];
  const have = findsOf(row, N);
  let t0 = (row && row.answers && Number(row.answers.t0)) || Date.now();
  for (const r of strays) {
    for (const [i, d] of findsOf(r, N)) if (!have.has(i) || d < have.get(i)) have.set(i, d);
    const t = r.answers && Number(r.answers.t0);
    if (t && t < t0) t0 = t;
  }
  const known = new Set(have.keys()); // already counted by the crowd
  const open = !(win.closes && win.closes <= Date.now());
  let grew = false;
  if (open && Array.isArray(body.found)) {
    const today = etDayNum();
    for (const i of body.found.slice(0, N)) if (Number.isInteger(i) && i >= 0 && i < N && !have.has(i)) { have.set(i, today); grew = true; }
  }
  if (grew || strays.length || (open && !row)) {
    const f = [...have.keys()];
    const answers = { f, d: f.map((i) => have.get(i)), t0 };
    const res = row
      ? await supabaseAdmin.from('outwit_picks').update({ answers, user_id: who.userId }).eq('id', row.id)
      : await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: who.key, user_id: who.userId, answers });
    if (res && res.error) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
  }
  if (strays.length) {
    await supabaseAdmin.from('outwit_picks').delete().in('id', strays.map((r) => r.id));
    // Their guest day results go too; the account's are refiled below.
    const guestAnons = strays.map((r) => String(r.anon_id).slice(2));
    try { await supabaseAdmin.from('quiz_results').delete().like('quiz_id', 'wanted-%').is('user_id', null).in('anon_id', guestAnons); } catch (e) { /* refiled rows win */ }
  }
  const due = !lastFiled.has(who.key) || Date.now() - lastFiled.get(who.key) > 10 * 60 * 1000;
  if (have.size && (strays.length || (open && (body.force || (grew && due))))) {
    lastFiled.set(who.key, Date.now());
    try {
      const crowd = await wantedCrowd(board, win);
      // The counts were read a moment ago; count this player's new finds in.
      const counts = crowd.counts.slice();
      for (const i of have.keys()) if (!known.has(i)) counts[i] = Math.max(1, counts[i] + 1);
      await wantedFile(board, who, have, counts);
    } catch (e) { /* filed on the next sync or when the board settles */ }
  }
  const f = [...have.keys()].sort((a, b) => a - b);
  return NextResponse.json({ me: pubId(who.key), name: who.name, found: f, open }, { headers: NO_STORE });
}
