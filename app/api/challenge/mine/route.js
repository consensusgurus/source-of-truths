import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { listMine } from '@/lib/challenge-server';
import { drawingField } from '@/lib/drawing-server';
import { drawingIsLive } from '@/lib/drawing';

// GET /api/challenge/mine?anonId=&email=
// The viewer's challenges, newest first, each with who opened and who finished
// it, plus their $100 drawing ticket count (tickets themselves come from
// quiz_referrals; this only reads the count the drawing already derives).

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim().slice(0, 64) || request.cookies.get('sot_vid')?.value || null;
  const email = (searchParams.get('email') || '').trim().slice(0, 120) || null;
  let mine = { who: { anon: null, userId: null, username: null }, challenges: [] };
  let ready = true;
  try { mine = await listMine(supabaseAdmin, { anonId, email }); } catch (e) { ready = false; }
  let tickets = null;
  const live = drawingIsLive();
  if (live && mine.who && mine.who.userId) {
    try {
      const field = await drawingField(supabaseAdmin);
      const h = field.holders.get(mine.who.userId);
      tickets = h ? h.tickets.length : 0;
    } catch (e) { tickets = null; }
  }
  return NextResponse.json({
    ready,
    named: !!(mine.who && mine.who.userId),
    username: mine.who ? mine.who.username : null,
    drawingLive: live,
    tickets,
    challenges: mine.challenges,
  }, { headers: NO_STORE });
}
