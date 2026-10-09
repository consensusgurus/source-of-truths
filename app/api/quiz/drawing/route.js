// GET /api/quiz/drawing: the $100 ticket drawing, for the pop-up and the
// community board panel. Public figures (drum size, holders, the latest
// tickets) plus the viewer's own tickets and share link when they can be
// identified. Read-only; tickets are derived in lib/drawing-server.js.
//
//   ?limit=N    holders returned (default 25, max 100)
//   ?anonId=    the viewer's browser id (falls back to the sot_vid cookie)
//   ?email=     lets a second device recognise the viewer

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { ensureRefCode } from '@/lib/referrals-server';
import { refShareUrl } from '@/lib/referrals';
import { DRAWING, drawingIsLive, drawingHasEnded, drawingDaysLeft, formatOdds } from '@/lib/drawing';
import { drawingField } from '@/lib/drawing-server';

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

    const field = await drawingField(supabaseAdmin);
    const total = field.total;

    const board = field.eligible.slice(0, limit).map((h) => ({
      rank: h.rank,
      username: h.username,
      refCode: h.refCode,
      tickets: h.tickets.length,
      odds: formatOdds(h.tickets.length, total),
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
      const user = await findViewer(supabaseAdmin, { anonId: anonId || null, email });
      if (user) {
        const code = await ensureRefCode(supabaseAdmin, user);
        const hasEmail = !!(user.email && String(user.email).trim());
        const mine = field.holders.get(user.id) || null;
        const ranked = field.eligible.find((h) => h.referrerId === user.id) || null;
        const n = mine ? mine.tickets.length : 0;
        me = {
          username: user.username,
          code,
          shareUrl: code ? refShareUrl(code, '/') : null,
          eligible: hasEmail,
          count: n,
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
