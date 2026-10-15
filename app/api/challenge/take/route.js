import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { recordTake } from '@/lib/challenge-server';

// POST /api/challenge/take: see lib/challenge-server.js and migration 60.
// Fire-and-forget from the browser (keepalive fetch), so it always answers 200
// and reports failure in the body rather than as an error a page could see.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request) {
  let body = {};
  try { body = JSON.parse((await request.text()) || '{}') || {}; } catch (e) { body = {}; }
  if (!body.anonId) body.anonId = request.cookies.get('sot_vid')?.value || null;
  let out;
  try { out = await recordTake(supabaseAdmin, body); } catch (e) { out = { ok: false }; }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'private, no-store' } });
}
