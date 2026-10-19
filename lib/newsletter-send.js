// Env on Vercel (2026-09-22): RESEND_API_KEY, NEWSLETTER_FROM, NEWSLETTER_SECRET; NEWSLETTER_CRON=1 arms the cron.
// The newsletter send machinery, shared by /api/admin/newsletter (manual) and
// /api/cron/newsletter (the daily batch). See the admin route header for the
// ledger-before-send rule; this file is where it is enforced.

import { supabaseAdmin } from '@/lib/supabase-server';
import { loadRecipients, unsubUrl } from '@/lib/newsletter';
import * as tenDays from '@/lib/newsletters/ten-days-2026-09-22';
import * as fourWeeks from '@/lib/newsletters/four-weeks-2026-10-19';

export const DAILY_CAP = 99;
export const CAMPAIGNS = { [tenDays.CAMPAIGN.id]: tenDays, [fourWeeks.CAMPAIGN.id]: fourWeeks };
export const CURRENT = fourWeeks.CAMPAIGN.id;

// THE SCHEDULED RUN (owner, 2026-10-19): one batch of 99 a day at 8am Eastern
// until every recipient of this campaign has it, then stop. The audience is
// frozen at the run's start (accounts created before joinedBefore), so new
// sign-ups do not stretch it out, and nothing sends for a later campaign until
// a new RUN is set here. The cron sends it whether or not NEWSLETTER_CRON is
// set; set RUN to null to stop it.
export const RUN = { campaign: fourWeeks.CAMPAIGN.id, joinedBefore: '2026-10-19T21:00:00Z', hourET: 8 };

// Midnight Eastern today, as a UTC Date (DST-safe).
export function etMidnight(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = asUtc - Math.floor(now.getTime() / 1000) * 1000;   // ET minus UTC
  return { midnight: new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset), hour: +p.hour };
}

// Rows this campaign has claimed since `since` (any status), so the cron never
// sends twice in one Eastern day however often the route is hit.
export async function claimedSince(campaign, since) {
  const { count, error } = await supabaseAdmin
    .from('newsletter_sends')
    .select('email', { count: 'exact', head: true })
    .eq('campaign', campaign)
    .gte('sent_at', since.toISOString());
  if (error) throw error;
  return count || 0;
}


export async function ledger(campaign) {
  const { data, error } = await supabaseAdmin
    .from('newsletter_sends')
    .select('email, status')
    .eq('campaign', campaign);
  if (error) {
    if (/newsletter_sends/.test(error.message || '')) return new Map();   // migration 58 not applied
    throw error;
  }
  const byEmail = new Map();
  for (const r of data || []) byEmail.set(r.email.toLowerCase(), r.status);
  return byEmail;
}

export async function status(campaign, opts = {}) {
  const [all, sent] = await Promise.all([loadRecipients(supabaseAdmin), ledger(campaign)]);
  const recips = frozen(all, opts.joinedBefore);
  let done = 0, failed = 0, queued = 0;
  for (const s of sent.values()) { if (s === 'sent') done++; else if (s === 'failed') failed++; else queued++; }
  const remaining = recips.filter((r) => !sent.has(r.email)).length;
  return {
    campaign, migrationApplied: recips.migrationApplied !== false, eligible: recips.length, sent: done, failed, queued, remaining,
    cap: DAILY_CAP, daysLeft: Math.ceil(remaining / DAILY_CAP),
  };
}

export async function sendOne(mod, r) {
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

function frozen(recips, joinedBefore) {
  if (!joinedBefore) return recips;
  const out = recips.filter((r) => !r.created_at || r.created_at < joinedBefore);
  out.migrationApplied = recips.migrationApplied;
  return out;
}

export function providerConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM);
}

// The batch. Returns a plain object the caller serialises; throws on a
// configuration or database error so nothing is claimed in that state.
export async function sendBatch(body = {}) {
  const campaign = body.campaign || CURRENT;
  const mod = CAMPAIGNS[campaign];
  if (!mod) throw new Error('unknown campaign');
  const limit = Math.max(1, Math.min(DAILY_CAP, Number(body.limit) || DAILY_CAP));

  // Proof: one address, no ledger. The unsubscribe link points at the owner's
  // own row when the address is on file, else at a placeholder id.
  if (body.to) {
    const recips = await loadRecipients(supabaseAdmin);
    const me = recips.find((r) => r.email === String(body.to).toLowerCase())
      || { id: '00000000-0000-0000-0000-000000000000', email: String(body.to), username: '' };
    const id = await sendOne(mod, me);
    return { ok: true, proof: me.email, providerId: id };
  }

  const [allRecips, sent] = await Promise.all([loadRecipients(supabaseAdmin), ledger(campaign)]);
  const recips = frozen(allRecips, body.joinedBefore);
  if (recips.migrationApplied === false) throw new Error('migration 58 not applied: no opt-out column, refusing to send');
  const batch = recips
    .filter((r) => !sent.has(r.email) || (body.retryFailed && sent.get(r.email) !== 'sent'))
    .slice(0, limit);

  if (body.dryRun) {
    return { dryRun: true, wouldSend: batch.length, sample: batch.slice(0, 8).map((r) => ({ email: r.email, joined: r.created_at, lastActive: r.lastActive })), last: batch.slice(-3).map((r) => ({ email: r.email, lastActive: r.lastActive })), ...(await status(campaign, { joinedBefore: body.joinedBefore })) };
  }
  if (!providerConfigured()) throw new Error('RESEND_API_KEY / NEWSLETTER_FROM not set');

  const results = { sent: 0, failed: 0, skipped: 0, errors: [] };
  for (const r of batch) {
    // Claim the row first (see the admin route header). A conflict means another run has it.
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
  return { ok: true, ...results, ...(await status(campaign, { joinedBefore: body.joinedBefore })) };
}
