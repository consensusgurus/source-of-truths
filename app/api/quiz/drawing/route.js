// GET /api/quiz/drawing: the $100 ticket drawing, for the pop-up and the
// community board panel. Public figures (drum size, holders, the latest
// tickets) plus the viewer's own tickets and share link when they can be
// identified. Read-only; tickets are derived in lib/drawing-server.js.
//
//   ?limit=N    holders returned (default 25, max 100)
//   ?anonId=    the viewer's browser id (falls back to the sot_vid cookie)
//   ?email=     lets a second device recognise the viewer
//   ?tree=1     also return the viewer's ticket tree (friends, their friends...)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { ensureRefCode } from '@/lib/referrals-server';
import { refShareUrl } from '@/lib/referrals';
import { DRAWING, drawingIsLive, drawingHasEnded, drawingDaysLeft, formatOdds } from '@/lib/drawing';
import { drawingField, ticketTree } from '@/lib/drawing-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Same viewer resolution as /api/quiz/contest: an identity by email or anon id,
// else the account a guest's plays were attributed to.
async function findViewer(admin, { anonId, email }) {
  const ident = await findQuizIdentity(admin, { email, anonId });
  let userId = ident && ident.id ? ident.id : null;
  if (!userId && anonId) {
    try {
      const { data } = await admin
        .from('quiz_results')
        .select('user_id')
        .eq('anon_id', anonId)
        .not('user_id', 'is', null)
        .limit(1);
      if (Array.isArray(data) && data[0] && data[0].user_id) userId = data[0].user_id;
    } catch { /* ignore */ }
  }
  if (!userId) return null;
  const { data: user } = await admin
    .from('quiz_users')
    .select('id, username, ref_code, email')
    .eq('id', userId)
    .maybeSingle();
  return user || null;
}

// The viewer's account and share code, remembered for a minute: the field is
// shared now, so these two reads were most of what was left of a request.
const VIEWER_MS = 60 * 1000;
const viewerMemo = new Map();
async function viewerWithCode(admin, anonId, email) {
  const key = `${email || ''}|${anonId || ''}`;
  const hit = viewerMemo.get(key);
  if (hit && Date.now() - hit.at < VIEWER_MS) return hit.val;
  const user = await findViewer(admin, { anonId, email });
  const val = user ? { user, code: await ensureRefCode(admin, user) } : null;
  viewerMemo.set(key, { at: Date.now(), val });
  while (viewerMemo.size > 5000) viewerMemo.delete(viewerMemo.keys().next().value);
  return val;
}

export async function GET(request) {
  const meta = {
    id: DRAWING.id,
    live: drawingIsLive(),
    ended: drawingHasEnded(),
    daysLeft: drawingDaysLeft(),
    prizeLabel: DRAWING.prizeLabel,
    startLabel: DRAWING.startLabel,
    endLabel: DRAWING.endLabel,
    deadlineLabel: DRAWING.deadlineLabel,
    drawLabel: DRAWING.drawLabel,
  };
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 25));
    const anonId =
      (searchParams.get('anonId') || '').trim().slice(0, 64) ||
      request.cookies.get('sot_vid')?.value || '';
    const email = (searchParams.get('email') || '').trim().slice(0, 120) || null;
    const wantTree = searchParams.get('tree') === '1';

    const field = await drawingField(supabaseAdmin);
    const total = field.total;

    const board = field.eligible.slice(0, limit).map((h) => ({
      rank: h.rank,
      username: h.username,
      refCode: h.refCode,
      tickets: h.count,
      odds: formatOdds(h.count, total),
    }));

    // Latest tickets, newest first. A guest friend shows as "a new player".
    const feed = field.tickets.slice(-8).reverse().map((t) => ({
      no: t.no,
      who: t.username,
      friend: t.referredName || null,
      at: t.at,
    }));

    let me = null;
    if (anonId || email) {
      const vw = await viewerWithCode(supabaseAdmin, anonId || null, email);
      const user = vw ? vw.user : null;
      if (user) {
        const code = vw.code;
        const hasEmail = !!(user.email && String(user.email).trim());
        const mine = field.holders.get(user.id) || null;
        const ranked = field.eligible.find((h) => h.referrerId === user.id) || null;
        const n = mine ? mine.count : 0;
        me = {
          username: user.username,
          code,
          shareUrl: code ? refShareUrl(code, '/') : null,
          eligible: hasEmail,
          count: n,
          // Where the count came from, for the board's breakdown.
          friends: mine ? mine.friends : 0,
          friendEmails: mine ? (mine.friendEmails || 0) : 0,
          friendTickets: mine ? (mine.friendTickets || 0) : 0,
          indirect: mine ? (mine.indirect || 0) : 0,
          indirectTickets: mine ? (mine.indirectTickets || 0) : 0,
          tree: wantTree ? ticketTree(field, user.id) : undefined,
          group: mine ? (mine.groupTicket || 0) : 0,
          play: mine && mine.play ? {
            streak: mine.play.streak, winDay: mine.play.winDay, winGame: mine.play.winGame,
            email: mine.play.email, raw: mine.play.raw, counted: mine.play.play,
            streakRuns: mine.play.streakRuns, dayWins: mine.play.dayWins, gameWins: mine.play.gameWins,
            startAt: mine.play.startAt,
          } : null,
          playCap: DRAWING.play.cap,
          tickets: mine ? mine.tickets.slice(-12).map((t) => ({ no: t.no, friend: t.friend })) : [],
          odds: hasEmail ? formatOdds(n, total) : null,
          rank: ranked ? ranked.rank : null,
        };
      }
    }

    return NextResponse.json({
      drawing: meta,
      total,
      holders: field.eligible.length,
      board,
      feed,
      me,
      ready: true,
    });
  } catch {
    return NextResponse.json({ drawing: meta, total: 0, holders: 0, board: [], feed: [], me: null, ready: false });
  }
}
