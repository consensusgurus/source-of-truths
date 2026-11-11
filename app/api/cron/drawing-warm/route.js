// GET /api/cron/drawing-warm -> rebuild the ticket drawing and store it in one
// shared row (2026-10-27). Runs every five minutes from vercel.json, so every
// server reads one stored copy instead of rebuilding the drawing itself (each
// build reads every account, group, referral and result: 5 to 12 seconds on a
// fresh server). See drawingField in lib/drawing-server.js.
//
// Same auth as the other crons. When no CRON_SECRET is set the route is open,
// so it refuses to rebuild a copy younger than RECENT_MS.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { refreshDrawingShared, drawingSharedAge } from '@/lib/drawing-server';
import { drawingIsLive } from '@/lib/drawing';

export const dynamic = 'force-dynamic';
// NEVER SERVE A CACHED DATABASE READ (2026-11-11). `dynamic = 'force-dynamic'`
// alone did NOT stop Next 14 from storing this route's Supabase GETs in Vercel's
// Data Cache, which outlives deploys. The drawing rebuilt every five minutes from
// a copy of quiz_users frozen on 2026-11-06 (Data Cache hit rate 100%), so no
// email added after that earned a ticket. force-no-store is what opts out.
export const fetchCache = 'force-no-store';
export const maxDuration = 120;

const RECENT_MS = 3 * 60 * 1000;

function authed(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true;
  const tok = process.env.ADMIN_TASK_TOKEN;
  if (tok && request.headers.get('x-admin-token') === tok) return true;
  return !secret;
}

export async function GET(request) {
  if (!authed(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!drawingIsLive()) return NextResponse.json({ ok: true, skipped: 'drawing not live' }, { headers: { 'Cache-Control': 'no-store' } });
  const age = await drawingSharedAge();
  if (age < RECENT_MS) return NextResponse.json({ ok: true, skipped: 'recent', ageMs: age }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const out = await refreshDrawingShared(supabaseAdmin);
    return NextResponse.json({ ok: true, ...out }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e && e.message ? e.message : e) }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
