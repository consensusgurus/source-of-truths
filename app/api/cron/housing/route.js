// Housing Watch daily data refresh (mindloftdaily.com/housing).
//
// GET /api/cron/housing?part=<part>   parts: macro, sec-builders, sec-distributors,
//                                      sec-products, metros
// Each part is its own Vercel cron (see vercel.json), a few minutes apart, so no
// single call has to download everything. Results land as JSON in the private
// Supabase Storage bucket "housing-watch" (lib/housing/store.js); the pages read
// them with hourly revalidation, so a refresh never needs a deploy.
//
// Auth: Vercel's cron bearer when CRON_SECRET is set, or the admin cookie, so
// the owner can run a part by hand from a logged-in browser. Without
// CRON_SECRET, Vercel's cron user agent is accepted.
//
// Needs SEC_USER_AGENT (a name plus contact email) for the sec-* parts.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { housingStore } from '@/lib/housing/store';
import { runPart, PARTS } from '@/lib/housing/pipeline.mjs';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 300;

function authorized(request) {
  if (isAdmin()) return true;
  const secret = process.env.CRON_SECRET;
  if (secret) return (request.headers.get('authorization') || '') === `Bearer ${secret}`;
  return /^vercel-cron\//i.test(request.headers.get('user-agent') || '');
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const part = new URL(request.url).searchParams.get('part') || 'macro';
  if (!PARTS.includes(part)) {
    return NextResponse.json({ error: `unknown part, use one of: ${PARTS.join(', ')}` }, { status: 400 });
  }
  try {
    const result = await runPart(part, housingStore);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ part, ok: false, error: e.message }, { status: 500 });
  }
}
