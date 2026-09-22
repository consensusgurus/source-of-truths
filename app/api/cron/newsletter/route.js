// GET /api/cron/newsletter  -> sends today's batch of the current campaign (99 max).
//
// Wired to a daily Vercel cron (vercel.json, 14:00 UTC, 10am Eastern, a time
// people read email). Same auth as consensus-check: if CRON_SECRET is set the
// request must carry "Authorization: Bearer <CRON_SECRET>"; the admin task
// token header is accepted too so a manual run needs no cookie.
//
// Two safeties on top of the ledger: it does nothing unless NEWSLETTER_CRON=1
// is set on Vercel (so a deploy never starts a send by itself), and it does
// nothing once `remaining` is 0, so the cron can stay wired between campaigns.

import { NextResponse } from 'next/server';
import { CURRENT, status, sendBatch } from '@/lib/newsletter-send';

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
  try {
    if (process.env.NEWSLETTER_CRON !== '1') return NextResponse.json({ ok: true, skipped: 'NEWSLETTER_CRON is not 1' });
    const s = await status(CURRENT);
    if (s.migrationApplied === false || s.remaining === 0) return NextResponse.json({ ok: true, skipped: 'nothing to send', ...s });
    return NextResponse.json(await sendBatch({}));
  } catch (e) {
    console.error('newsletter cron error', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
