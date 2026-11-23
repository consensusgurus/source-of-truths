import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { guard, viewerOf, noticesFor } from '@/lib/community';

// /api/community/notices (owner, 2026-11-19): the bottom-of-screen notice that
// someone commented on your idea. GET ?anonId=&email= -> { notices: [{ idea,
// title, count, names[], at }] }, comments by other players on your ideas you
// have not seen yet. Dismissing or opening one posts `seen` to
// /api/community/ideas. Guests and a missing migration 67 get an empty list.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = str(searchParams.get('anonId'), 64) || null;
  const email = str(searchParams.get('email')) || null;
  if (!anonId && !email) return NextResponse.json({ notices: [] }, { headers: NO_STORE });
  const out = await guard(async () => {
    const viewer = await viewerOf(supabaseAdmin, { anonId, email }, { lite: true });
    if (!viewer.user) return { notices: [] };
    return { notices: await noticesFor(supabaseAdmin, viewer.user.id) };
  });
  if (!out.notices) out.notices = [];
  return NextResponse.json(out, { status: out.status && out.status !== 500 ? out.status : 200, headers: NO_STORE });
}
