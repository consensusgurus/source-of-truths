import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { guard, groupsOfUser, createGroup, GROUP_MEMBER_MAX, GROUPS_PER_PLAYER } from '@/lib/groups';

// /api/groups
//   GET  ?anonId=&email=           -> the viewer's groups
//   POST { name, anonId, email, visibility } -> start a group (the viewer owns it)
//
// The viewer is resolved exactly the way every quiz route resolves one:
// email first, then this browser's anon id. A browser with no account gets
// `registered: false`; the client makes a name-only account through
// /api/quiz/join first and then calls again.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const LIMITS = { memberMax: GROUP_MEMBER_MAX, groupsMax: GROUPS_PER_PLAYER };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = str(searchParams.get('anonId'), 64) || null;
  const email = str(searchParams.get('email')) || null;
  const out = await guard(async () => {
    const user = (anonId || email) ? await findQuizIdentity(supabaseAdmin, { email, anonId }) : null;
    if (!user) return { registered: false, groups: [] };
    return { registered: true, username: user.username, groups: await groupsOfUser(supabaseAdmin, user.id) };
  });
  return NextResponse.json({ ...LIMITS, ...out }, { status: out.status || 200, headers: NO_STORE });
}

export async function POST(request) {
  let body = {};
  try { body = (await request.json()) || {}; } catch (e) { /* empty body */ }
  const anonId = str(body.anonId, 64) || null;
  const email = str(body.email) || null;
  const out = await guard(async () => {
    const user = (anonId || email) ? await findQuizIdentity(supabaseAdmin, { email, anonId }) : null;
    if (!user) return { error: 'Pick a name first.', code: 'no_account', status: 401 };
    return createGroup(supabaseAdmin, user, body.name, body.visibility);
  });
  if (!out.available) return NextResponse.json({ ...out, error: 'Groups are being set up. Try again soon.' }, { status: 503, headers: NO_STORE });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}
