import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { guard, publicGroups } from '@/lib/groups';

// /api/groups/public -> the groups whose owners have opened them to everyone.
//
// Names and member counts only: no board, no member names. Anyone can read it,
// signed in or not, because the whole point of a public group is being found by
// somebody who has not joined anything yet. An empty list is the normal state
// until owners start opening groups up, and it is also what a database without
// migration 57 returns.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Public data that changes only when an owner flips a switch or somebody joins,
// so a short shared cache is safe and keeps the Groups page quick.
const HEADERS = { 'Cache-Control': 'public, max-age=60' };

export async function GET() {
  const out = await guard(async () => ({ groups: await publicGroups(supabaseAdmin) }));
  return NextResponse.json(out, { status: out.status || 200, headers: HEADERS });
}
