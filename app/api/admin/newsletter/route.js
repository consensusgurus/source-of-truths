// The player newsletter, sent in daily batches under the sender's free tier.
//
// GET  /api/admin/newsletter?campaign=<id>
//      -> { eligible, sent, failed, remaining, cap, daysLeft } for that campaign
//         (omit campaign to get the current one). Nothing is sent.
//
// POST /api/admin/newsletter  { campaign?, limit?, dryRun?, to? }
//      -> sends the next batch. `limit` defaults to DAILY_CAP (99: Resend's free
//         tier is 100 a day and one is kept back for a test). `dryRun: true`
//         returns the batch it WOULD send and touches nothing. `to` sends the
//         campaign to that one address only, ignoring the ledger, for proofing.
//
// Auth: the admin cookie or the x-admin-token header, same as /api/admin/alerts.
//
// Provider: Resend's REST API, RESEND_API_KEY + NEWSLETTER_FROM on Vercel
// (e.g. "Mind Loft <news@mindloftdaily.com>", the domain verified in Resend).
// No SDK: one fetch per message, so nothing was added to package.json.
//
// WHY THE LEDGER ROW IS WRITTEN BEFORE THE SEND: the unique index on
// (campaign, email) is what makes this route safe to run twice, from a cron
// that fires twice, or after a timeout. Inserting first means a crash between
// insert and send loses ONE email (row stays 'queued', visible in GET) rather
// than sending one twice. A failed provider call marks the row 'failed' with
// the error, and a later run can retry those (and any stranded 'queued' row) with { retryFailed: true }.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { CAMPAIGNS, CURRENT, status, sendBatch } from '@/lib/newsletter-send';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  return !!expected && request.headers.get('x-admin-token') === expected;
}

export async function GET(request) {
  if (!isAdmin() && !tokenOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const campaign = new URL(request.url).searchParams.get('campaign') || CURRENT;
    if (!CAMPAIGNS[campaign]) return NextResponse.json({ error: 'unknown campaign' }, { status: 400 });
    return NextResponse.json(await status(campaign));
  } catch (e) {
    console.error('newsletter status error', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) || {};
    return NextResponse.json(await sendBatch(body));
  } catch (e) {
    const msg = String(e?.message || e);
    console.error('newsletter send error', e);
    return NextResponse.json({ error: msg }, { status: /unknown campaign/.test(msg) ? 400 : /migration 54/.test(msg) ? 409 : 500 });
  }
}
