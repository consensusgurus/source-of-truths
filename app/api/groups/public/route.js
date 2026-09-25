import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { guard, publicGroups, privateGroups } from '@/lib/groups';

// /api/groups/public -> every group, for the list on /groups.
//
//   groups   the PUBLIC ones: name, size, owner and code, so they can be
//            opened and joined in one tap.
//   private  the PRIVATE ones (owner, 2026-09-25): name and size ONLY. The code
//            is a private group's key, so it never leaves the server here.
//
// ?anonId=&email= is optional. With it, private groups the viewer already
// belongs to are left out (they show under Your groups), and the response is
// per-viewer, so it is not shared-cached.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const SHARED = { 'Cache-Control': 'public, max-age=60' };
const PRIVATE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = str(searchParams.get('anonId'), 64) || null;
  const email = str(searchParams.get('email')) || null;
  const out = await guard(async () => {
    const user = (anonId || email) ? await findQuizIdentity(supabaseAdmin, { email, anonId }) : null;
    const [pub, priv] = await Promise.all([
      publicGroups(supabaseAdmin),
      privateGroups(supabaseAdmin, { excludeUserId: user ? user.id : null }),
    ]);
    return { groups: pub, private: priv };
  });
  const headers = (anonId || email) ? PRIVATE : SHARED;
  return NextResponse.json(out, { status: out.status || 200, headers });
}
