import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { markSeen } from '@/lib/challenge-server';

// POST /api/challenge/seen { ids, anonId, email }: the sender has seen (or
// closed) these results, so the home stops showing them.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request) {
  let body = {};
  try { body = JSON.parse((await request.text()) || '{}') || {}; } catch (e) { body = {}; }
  if (!body.anonId) body.anonId = request.cookies.get('sot_vid')?.value || null;
  let out;
  try { out = await markSeen(supabaseAdmin, body); } catch (e) { out = { ok: false }; }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'private, no-store' } });
}
