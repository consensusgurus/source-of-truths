import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralPlayer, currentBoard } from '@/lib/mural';
import { parseMuralId, MURAL_TOTAL } from '@/lib/mural-shared';

// POST /api/mural/place { id, piece, anonId, email? }
//
// One placement. mural_place() (migration 69) settles it in one call: whether
// this player is the first on the site to place the piece, and what it is
// worth at this moment. The answer is { points, first, dup }; `dup` means this
// player had already placed the piece and nothing changed.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function POST(request) {
  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const id = str(body && body.id, 40);
  const piece = Number(body && body.piece);
  if (!parseMuralId(id) || !Number.isInteger(piece) || piece < 0) return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  // A page opened before the mural changed size (10,000 to 4,000 pieces on
  // 2026-11-19) numbers its pieces differently, so its placements would land in
  // the wrong spots. It sends no total, or the old one: answer as a closed
  // mural, which makes that page stop and reload.
  if (Number(body.total) !== MURAL_TOTAL) return NextResponse.json({ error: 'closed' }, { status: 409, headers: NO_STORE });
  const who = await muralPlayer(supabaseAdmin, { anonId: str(body.anonId, 64) || null, email: str(body.email) || null });
  if (!who) return NextResponse.json({ error: 'No player' }, { status: 400, headers: NO_STORE });
  const args = { p_mural: id, p_piece: piece, p_player: who.player, p_user: who.userId, p_name: who.name };
  let { data, error } = await supabaseAdmin.rpc('mural_place', args);
  // RUN UNTIL FINISHED (2026-11-19): a board made under the old noon-to-noon rule
  // still carries its old close until someone loads the page. If that is what
  // refused this placement, push the close out (currentBoard does) and try once more.
  if (!error && data && data.error === 'closed') {
    try {
      const cur = await currentBoard(supabaseAdmin, parseMuralId(id).kind);
      if (cur && cur.board && cur.board.id === id && !cur.board.completed_at) ({ data, error } = await supabaseAdmin.rpc('mural_place', args));
    } catch (e) { console.error('mural extend on place', e); }
  }
  if (error) { console.error('mural place', error); return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE }); }
  if (data && data.error) return NextResponse.json({ error: data.error }, { status: data.error === 'closed' ? 409 : 400, headers: NO_STORE });
  // SITE POINTS (owner, 2026-11-19): the points count toward the Eastern day
  // they are earned in, as that day's Mural or MuralToo result. mural_credit()
  // (migration 70) appends the running total, at most every ten minutes here;
  // the page forces the last one through /api/mural/credit. A failure here never fails
  // the placement, which is already saved.
  if (data && !data.dup && !data.taken) {
    try {
      const anon = str(body.anonId, 64) || null;
      const c = await supabaseAdmin.rpc('mural_credit', { p_mural: id, p_player: who.player, p_user: who.userId, p_name: who.name, p_anon: anon, p_force: false });
      if (c.error) console.error('mural credit', c.error);
    } catch (e) { console.error('mural credit', e); }
  }
  return NextResponse.json(data || {}, { headers: NO_STORE });
}
