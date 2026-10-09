// Server side of the $100 ticket drawing (lib/drawing.js holds the terms).
//
// Tickets are DERIVED, never stored: every quiz_referrals row credited inside
// the window is one ticket, numbered in the order it was credited, and it
// counts only if the person behind it was genuinely new (no finished game
// before the credit). Nothing is written by the drawing, so it cannot drift
// from the referral credits the rest of the site already shows.
//
// Source: quiz_contest_referrals() (migration 49), the same per-referral read
// the admin review page uses, because it already carries each referred
// person's first play and the referrer's email flag. It is not cheap, so the
// whole field is memoized per lambda for a minute; a pop-up and a board panel
// loading on the same page share one read. If the RPC is missing, the plain
// table read below keeps the drawing alive without the newness test.
//
// Every read is best-effort: a promo must never take down a page.

import { DRAWING } from './drawing.js';

const TTL_MS = 60 * 1000;
let memo = { at: 0, field: null };

function okDate(v) {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? t : null;
}

async function readReferrals(admin) {
  const { data, error } = await admin.rpc('quiz_contest_referrals', {
    p_start: DRAWING.startsAt,
    p_end: DRAWING.endsAt,
  });
  if (!error && Array.isArray(data)) {
    return data.map((r) => ({
      referrerId: r.referrer_user_id,
      username: r.username,
      refCode: r.ref_code,
      hasEmail: !!r.has_email,
      referredKey: r.referred_key,
      referredName: r.referred_username || null,
      at: r.credited_at,
      firstPlay: r.first_play,
      checked: true,
    }));
  }
  // Fallback: the raw credits, no newness test.
  const { data: rows, error: rowErr } = await admin
    .from('quiz_referrals')
    .select('referrer_user_id, referred_key, referred_user_id, created_at, seeded')
    .gte('created_at', DRAWING.startsAt)
    .lte('created_at', DRAWING.endsAt)
    .limit(20000);
  if (rowErr || !rows) return [];
  const ids = [...new Set(rows.flatMap((r) => [r.referrer_user_id, r.referred_user_id]).filter(Boolean))];
  const users = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const { data: us } = await admin
      .from('quiz_users')
      .select('id, username, ref_code, email')
      .in('id', ids.slice(i, i + 200));
    for (const u of us || []) users.set(u.id, u);
  }
  return rows
    .filter((r) => !r.seeded)
    .map((r) => {
      const u = users.get(r.referrer_user_id) || {};
      const ru = r.referred_user_id ? users.get(r.referred_user_id) : null;
      return {
        referrerId: r.referrer_user_id,
        username: u.username || null,
        refCode: u.ref_code || null,
        hasEmail: !!(u.email && String(u.email).trim()),
        referredKey: r.referred_key,
        referredName: ru ? ru.username : null,
        at: r.created_at,
        firstPlay: null,
        checked: false,
      };
    });
}

// The whole field: every valid ticket, numbered, plus the holders ranked.
export async function drawingField(admin, { force = false } = {}) {
  if (!force && memo.field && Date.now() - memo.at < TTL_MS) return memo.field;

  let refs = [];
  try { refs = await readReferrals(admin); } catch { refs = []; }

  const tickets = refs
    .filter((r) => {
      if (!r.username) return false;
      if (!r.checked || !r.firstPlay) return true;
      const at = okDate(r.at);
      const fp = okDate(r.firstPlay);
      if (at == null || fp == null) return true;
      return fp >= at - DRAWING.NEW_PLAYER_SLACK_MS;
    })
    .sort((a, b) => (okDate(a.at) || 0) - (okDate(b.at) || 0) || String(a.referredKey).localeCompare(String(b.referredKey)))
    .map((r, i) => ({ ...r, no: i + 1 }));

  const holders = new Map();
  for (const t of tickets) {
    const key = t.referrerId;
    const h = holders.get(key) || {
      referrerId: key, username: t.username, refCode: t.refCode, hasEmail: t.hasEmail,
      tickets: [], first: t.no,
    };
    h.hasEmail = h.hasEmail || t.hasEmail;
    h.tickets.push({ no: t.no, friend: t.referredName, at: t.at });
    holders.set(key, h);
  }

  // The drum holds only tickets whose holder can be contacted and paid.
  const eligible = [...holders.values()]
    .filter((h) => h.hasEmail)
    .sort((a, b) => b.tickets.length - a.tickets.length || a.first - b.first)
    .map((h, i) => ({ ...h, rank: i + 1 }));
  const total = eligible.reduce((s, h) => s + h.tickets.length, 0);

  const field = { tickets, holders, eligible, total, ready: true };
  memo = { at: Date.now(), field };
  return field;
}
