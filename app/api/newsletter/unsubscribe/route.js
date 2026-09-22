// GET  /api/newsletter/unsubscribe?u=<user id>&t=<token>  -> opts the player out, shows a page
// POST /api/newsletter/unsubscribe?u=<user id>&t=<token>  -> the same, for one-click
//      List-Unsubscribe-Post (Gmail and Yahoo send this without loading a page)
//
// Idempotent: a second visit reads "already off the list". A bad or missing
// token changes nothing and says so, without confirming whether the id exists.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { unsubTokenOk } from '@/lib/newsletter';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

function page(title, body) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#eef1f6;font-family:Manrope,'Helvetica Neue',Arial,sans-serif;color:#0b0d12;">
<div style="max-width:520px;margin:48px auto;padding:0 16px;">
  <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:18px;">Mind&nbsp;<span style="color:#2563eb;font-style:italic;">Loft</span></div>
  <div style="background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:28px 30px;">
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">${title}</div>
    <div style="font-size:15px;line-height:1.55;color:#3f4757;margin-top:10px;">${body}</div>
    <div style="margin-top:20px;"><a href="${SITE_URL}/crux" style="display:inline-block;background:#2563eb;color:#fff;font-weight:800;font-size:14px;padding:11px 22px;border-radius:999px;text-decoration:none;">Back to today's puzzles</a></div>
  </div>
</div></body></html>`;
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

async function optOut(request) {
  const url = new URL(request.url);
  const u = url.searchParams.get('u') || '';
  const t = url.searchParams.get('t') || '';
  if (!unsubTokenOk(u, t)) return { ok: false, reason: 'bad-link' };
  const { data, error } = await supabaseAdmin
    .from('quiz_users')
    .select('id, newsletter_opt_out')
    .eq('id', u)
    .maybeSingle();
  if (error || !data) return { ok: false, reason: 'bad-link' };
  if (data.newsletter_opt_out) return { ok: true, already: true };
  const { error: e2 } = await supabaseAdmin
    .from('quiz_users')
    .update({ newsletter_opt_out: new Date().toISOString() })
    .eq('id', u);
  if (e2) return { ok: false, reason: 'error' };
  return { ok: true, already: false };
}

export async function GET(request) {
  const r = await optOut(request);
  if (!r.ok) {
    return page('That link did not work',
      'The unsubscribe link looks incomplete or has been altered. Reply to the email instead and we will take you off the list by hand.');
  }
  return page(r.already ? 'You are already off the list' : 'You are off the list',
    'No more newsletters to this address. Your leaderboard name and scores are unchanged, and you can keep playing exactly as before.');
}

export async function POST(request) {
  const r = await optOut(request);
  return NextResponse.json(r.ok ? { ok: true } : { ok: false }, { status: r.ok ? 200 : 400 });
}
