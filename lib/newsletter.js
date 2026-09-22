// The player newsletter: opt-out tokens and the recipient query.
//
// Server only (reads secrets). The unsubscribe link carries the user's id and
// an HMAC of it, so the link works with no login, cannot be guessed for
// another user, and needs nothing stored. NEWSLETTER_SECRET signs it; if that
// is unset we fall back to ADMIN_TASK_TOKEN so the feature works with the
// env vars the site already has, but set NEWSLETTER_SECRET on Vercel anyway
// so the two can rotate independently.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from '@/lib/site';

function secret() {
  return process.env.NEWSLETTER_SECRET || process.env.ADMIN_TASK_TOKEN || '';
}

export function unsubToken(userId) {
  return createHmac('sha256', secret()).update(String(userId)).digest('hex').slice(0, 32);
}

export function unsubTokenOk(userId, token) {
  if (!secret() || !userId || !token) return false;
  const want = Buffer.from(unsubToken(userId));
  const got = Buffer.from(String(token));
  return want.length === got.length && timingSafeEqual(want, got);
}

export function unsubUrl(userId) {
  return `${SITE_URL}/api/newsletter/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`;
}

// Everyone who can receive a campaign: a real email on file, no opt-out.
// Ordered oldest account first so the earliest supporters hear first and the
// daily batches walk the list in a stable order.
export async function loadRecipients(supabaseAdmin, opts = {}) {
  const out = [];
  out.migrationApplied = !opts.noOptOutColumn;
  const page = 1000;
  for (let from = 0; ; from += page) {
    let q = supabaseAdmin
      .from('quiz_users')
      .select('id, username, email, created_at')
      .not('email', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + page - 1);
    if (!opts.noOptOutColumn) q = q.is('newsletter_opt_out', null);
    const { data, error } = await q;
    if (error) {
      // Migration 54 not applied yet: count without the opt-out filter so the
      // status read still answers, and say so. Sending refuses in that state.
      if (!opts.noOptOutColumn && /newsletter_opt_out/.test(error.message || '')) {
        return loadRecipients(supabaseAdmin, { noOptOutColumn: true });
      }
      throw error;
    }
    for (const r of data || []) {
      const email = (r.email || '').trim().toLowerCase();
      if (email && email.includes('@')) out.push({ ...r, email });
    }
    if (!data || data.length < page) break;
  }
  // One row per address: a merged or renamed account can leave two ids on
  // one inbox, and the ledger's unique index would reject the second anyway.
  const seen = new Set();
  const uniq = out.filter((r) => (seen.has(r.email) ? false : (seen.add(r.email), true)));
  uniq.migrationApplied = out.migrationApplied;
  return uniq;
}
