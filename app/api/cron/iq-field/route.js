// GET /api/cron/iq-field -> build the shared IQ field and store it in Supabase
// Storage (Vercel cost fix, 2026-10-27). Runs every ten minutes from vercel.json, so
// the hot player routes (iq-standing, me, daily-status, day-card, xp,
// xp-categories) download one stored copy instead of each function instance
// recomputing every player's IQ from the whole quiz_results table. See
// lib/iq-field.js.
//
// Same auth as the other crons. When no CRON_SECRET is set the route is open,
// so it refuses to rebuild a copy younger than RECENT_MS.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { buildIqField, storeIqField, iqFieldStoredAt } from '@/lib/iq-field';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const RECENT_MS = 4 * 60 * 1000;
const NO_STORE = { 'Cache-Control': 'no-store' };

function authed(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true;
  const tok = process.env.ADMIN_TASK_TOKEN;
  if (tok && request.headers.get('x-admin-token') === tok) return true;
  return !secret;
}

export async function GET(request) {
  if (!authed(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const at = await iqFieldStoredAt();
  const age = at ? Date.now() - at : Infinity;
  if (age < RECENT_MS) return NextResponse.json({ ok: true, skipped: 'recent', ageMs: age }, { headers: NO_STORE });
  try {
    const t0 = Date.now();
    const { data, error } = await loadQuizResultsCached(supabaseAdmin, { force: true });
    if (error || !Array.isArray(data) || !data.length) {
      return NextResponse.json({ ok: false, error: (error && error.message) || 'no rows' }, { status: 500, headers: NO_STORE });
    }
    const t1 = Date.now();
    const field = buildIqField(data);
    const t2 = Date.now();
    const bytes = JSON.stringify(field).length;
    const stored = await storeIqField(field);  // { ok, bytes }
    return NextResponse.json({
      ok: true,
      stored,
      rows: field.rowCount,
      players: field.players.rows.length,
      jsonBytes: bytes,
      loadMs: t1 - t0,
      buildMs: t2 - t1,
      writeMs: Date.now() - t2,
    }, { headers: NO_STORE });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e && e.message ? e.message : e) }, { status: 500, headers: NO_STORE });
  }
}
