// GET /api/cron/stats-warm -> rebuild and store the admin analytics payload
// and the /sitestats payload (2026-10-02).
//
// Wired to a daily Vercel cron (vercel.json). Both surfaces answer from a
// stored copy first and refresh behind it, so this is what guarantees the
// stored copy is never more than a day old even when nobody has opened either
// page. The admin build also refreshes the wide quiz_results snapshot as a
// side effect of loading the table, which keeps the next cold load short.
//
// Same auth as the other crons: if CRON_SECRET is set the request must carry
// "Authorization: Bearer <CRON_SECRET>"; the admin task token header is
// accepted too. Read-only apart from the stored copies.

import { NextResponse } from 'next/server';
import { warmAnalytics, storedAge } from '@/lib/admin-data';
import { buildSiteStats } from '@/lib/sitestats-build';
import { readPayload, writePayload } from '@/lib/stats-payloads';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authed(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true;
  const tok = process.env.ADMIN_TASK_TOKEN;
  if (tok && request.headers.get('x-admin-token') === tok) return true;
  return !secret;   // no secret configured: open, like consensus-check
}

export async function GET(request) {
  if (!authed(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const out = { ok: true };
  // The route is open when no CRON_SECRET is set, so it refuses to rebuild a
  // copy that is already recent. A second hit inside the window does nothing.
  const RECENT_MS = 10 * 60 * 1000;
  const [adminAge, siteAge] = await Promise.all([storedAge(), storedAge('sitestats:v1')]);
  const [admin, site] = await Promise.allSettled([
    adminAge < RECENT_MS ? Promise.resolve({ skipped: 'recent' }) : warmAnalytics(),
    siteAge < RECENT_MS ? Promise.resolve({ skipped: 'recent' }) : (async () => {
      const prev = await readPayload('sitestats:v1');
      const payload = await buildSiteStats(prev ? prev.payload : null);
      const stored = await writePayload('sitestats:v1', payload);
      return { stored, held: payload.held, timings: payload.timings };
    })(),
  ]);
  out.admin = admin.status === 'fulfilled' ? admin.value : { error: String(admin.reason?.message || admin.reason) };
  out.sitestats = site.status === 'fulfilled' ? site.value : { error: String(site.reason?.message || site.reason) };
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
