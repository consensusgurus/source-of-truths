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
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadRecipients, unsubUrl } from '@/lib/newsletter';
import * as tenDays from '@/lib/newsletters/ten-days-2026-09-22';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAILY_CAP = 99;
const CAMPAIGNS = { [tenDays.CAMPAIGN.id]: tenDays };
const CURRENT = tenDays.CAMPAIGN.id;

function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  return !!expected && request.headers.get('x-admin-token') === expected;
}

async function ledger(campaign) {
  const { data, error } = await supabaseAdmin
    .from('newsletter_sends')
    .select('email, status')
    .eq('campaign', campaign);
  if (error) throw error;
  const byEmail = new Map();
  for (const r of data || []) byEmail.set(r.email.toLowerCase(), r.status);
  return byEmail;
}

async function status(campaign) {
  const [recips, sent] = await Promise.all([loadRecipients(supabaseAdmin), ledger(campaign)]);
  let done = 0, failed = 0, queued = 0;
  for (const s of sent.values()) { if (s === 'sent') done++; else if (s === 'failed') failed++; else queued++; }
  const remaining = recips.filter((r) => !sent.has(r.email)).length;
  return {
    campaign, eligible: recips.length, sent: done, failed, queued, remaining,
    cap: DAILY_CAP, daysLeft: Math.ceil(remaining / DAILY_CAP),
  };
}

async function sendOne(mod, r) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM;
  if (!key || !from) throw new Error('RESEND_API_KEY / NEWSLETTER_FROM not set');
  const unsub = unsubUrl(r.id);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [r.email],
      subject: mod.CAMPAIGN.subject,
      html: mod.render({ unsubUrl: unsub, username: r.username }),
      text: mod.text({ unsubUrl: unsub, username: r.username }),
      headers: {
        'List-Unsubscribe': `<${unsub}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [{ name: 'campaign', value: mod.CAMPAIGN.id }],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `resend ${res.status}`);
  return body?.id || null;
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
    const campaign = body.campaign || CURRENT;
    const mod = CAMPAIGNS[campaign];
    if (!mod) return NextResponse.json({ error: 'unknown campaign' }, { status: 400 });
    const limit = Math.max(1, Math.min(DAILY_CAP, Number(body.limit) || DAILY_CAP));

    // Proof: one address, no ledger. The unsubscribe link points at the owner's
    // own row when the address is on file, else at a placeholder id.
    if (body.to) {
      const recips = await loadRecipients(supabaseAdmin);
      const me = recips.find((r) => r.email === String(body.to).toLowerCase())
        || { id: '00000000-0000-0000-0000-000000000000', email: String(body.to), username: '' };
      const id = await sendOne(mod, me);
      return NextResponse.json({ ok: true, proof: me.email, providerId: id });
    }

    const [recips, sent] = await Promise.all([loadRecipients(supabaseAdmin), ledger(campaign)]);
    const batch = recips
      .filter((r) => !sent.has(r.email) || (body.retryFailed && sent.get(r.email) !== 'sent'))
      .slice(0, limit);

    if (body.dryRun) {
      return NextResponse.json({ dryRun: true, wouldSend: batch.length, sample: batch.slice(0, 5).map((r) => r.email), ...(await status(campaign)) });
    }

    const results = { sent: 0, failed: 0, skipped: 0, errors: [] };
    for (const r of batch) {
      // Claim the row first (see header). A conflict means another run has it.
      const claim = await supabaseAdmin
        .from('newsletter_sends')
        .upsert({ campaign, user_id: r.id, email: r.email, status: 'queued', error: null }, { onConflict: 'campaign,email', ignoreDuplicates: !body.retryFailed })
        .select('id')
        .maybeSingle();
      if (claim.error || (!claim.data && !body.retryFailed)) { results.skipped++; continue; }
      try {
        const id = await sendOne(mod, r);
        await supabaseAdmin.from('newsletter_sends')
          .update({ status: 'sent', provider_id: id, sent_at: new Date().toISOString() })
          .eq('campaign', campaign).eq('email', r.email);
        results.sent++;
      } catch (e) {
        await supabaseAdmin.from('newsletter_sends')
          .update({ status: 'failed', error: String(e?.message || e).slice(0, 500) })
          .eq('campaign', campaign).eq('email', r.email);
        results.failed++;
        if (results.errors.length < 5) results.errors.push(`${r.email}: ${e?.message || e}`);
        // A rate-limit or auth failure will repeat on every row; stop early.
        if (/429|401|403|not set/.test(String(e?.message || e))) break;
      }
    }
    return NextResponse.json({ ok: true, ...results, ...(await status(campaign)) });
  } catch (e) {
    console.error('newsletter send error', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
