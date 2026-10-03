// The admin desk's data, one part at a time (2026-10-02).
// GET /api/admin/data?part=<part>[&mode=fresh|force]
//
//   editorial  the action queues (submissions, extras, feedback, research)
//   analytics  the default Analytics view, player tables cut to the most recent
//   players    the full player tables (on demand)
//   pageviews  list and quiz page views
//   retention  daily-game return play
//   map        the player map
//
// Auth: the admin cookie, or the x-admin-token header (ADMIN_TASK_TOKEN), the
// same pair every other read-only admin route accepts. Never cached anywhere
// shared: the payload carries player emails.
//
// See lib/admin-data.js for why the desk is served this way.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { loadEditorial, loadAnalyticsPart } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

const ANALYTICS_PARTS = new Set(['analytics', 'players', 'pageviews', 'retention', 'map']);
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  if (!expected) return false;
  return request.headers.get('x-admin-token') === expected;
}

export async function GET(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }
  const { searchParams } = new URL(request.url);
  const part = searchParams.get('part') || '';
  const modeRaw = searchParams.get('mode');
  const mode = modeRaw === 'fresh' || modeRaw === 'force' ? modeRaw : undefined;
  const t0 = Date.now();
  try {
    let data = null;
    if (part === 'editorial') data = await loadEditorial();
    else if (ANALYTICS_PARTS.has(part)) data = await loadAnalyticsPart(part, mode);
    else return NextResponse.json({ error: 'unknown part' }, { status: 400, headers: NO_STORE });
    if (!data) return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: NO_STORE });
    return NextResponse.json({ ...data, servedMs: Date.now() - t0 }, { headers: NO_STORE });
  } catch (e) {
    console.error('admin data error', part, e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500, headers: NO_STORE });
  }
}
