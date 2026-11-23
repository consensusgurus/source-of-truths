import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { countryFromRequest } from '@/lib/ua';
import { parseRunKeys } from '@/lib/daily-run';
import { etTodayISO } from '@/lib/daily-games';

// POST /api/mld/event   (owner, 2026-11-22: see who builds a Mind Loft Daily)
//
//   { event: 'saved' | 'edited' | 'opened', keys: [...], done, anonId, email, name }
//
// Upserts the player's row for today's Eastern day in mld_days (migration 76),
// which the admin desk's Mind Loft Daily tab reads. Best effort on both ends:
// the browser fires and forgets, and a missing table answers ok so nothing a
// player sees ever waits on this.

export const dynamic = 'force-dynamic';

const EVENTS = new Set(['saved', 'edited', 'opened']);
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

function missing(err) {
  if (!err) return false;
  return err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || '');
}

export async function POST(request) {
  let body;
  try { body = (await request.json()) || {}; } catch (e) { return NextResponse.json({ error: 'invalid request' }, { status: 400 }); }
  const event = str(body.event, 12);
  if (!EVENTS.has(event)) return NextResponse.json({ error: 'bad event' }, { status: 400 });
  const anon = /^[A-Za-z0-9_-]{6,64}$/.test(str(body.anonId, 64)) ? str(body.anonId, 64) : null;
  const email = str(body.email, 200) || null;
  if (!anon && !email) return NextResponse.json({ ok: false, error: 'no player' }, { status: 400 });
  const keys = parseRunKeys(Array.isArray(body.keys) ? body.keys.map(String).join(',') : '');
  const done = Math.max(0, Math.min(keys.length, Number.parseInt(body.done, 10) || 0));

  let user = null;
  try { user = await findQuizIdentity(supabaseAdmin, { email, anonId: anon }); } catch (e) { user = null; }
  const player = user && user.id ? `u:${user.id}` : anon ? `a:${anon}` : null;
  if (!player) return NextResponse.json({ ok: false, error: 'no player' }, { status: 400 });

  const day = etTodayISO();
  const now = new Date().toISOString();
  try {
    const { data: prev, error: rerr } = await supabaseAdmin.from('mld_days')
      .select('setup, edits, done, opened_at, finished_at, created_at').eq('player', player).eq('day', day).maybeSingle();
    if (rerr) throw rerr;
    const p = prev || {};
    const row = {
      player, day,
      user_id: user && user.id ? user.id : null,
      username: (user && user.username) || str(body.name, 40) || null,
      anon_id: anon,
      country: countryFromRequest(request),
      updated_at: now,
      setup: event === 'saved' ? 'new' : event === 'edited' ? (p.setup === 'new' ? 'new' : 'edit') : (p.setup || null),
      edits: (p.edits || 0) + (event === 'edited' ? 1 : 0),
      opened_at: p.opened_at || (event === 'opened' ? now : null),
      finished_at: p.finished_at || null,
    };
    if (keys.length) {
      row.keys = keys;
      row.pages = keys.length;
    }
    // The browser counts what is played of the list it sends, so its number is
    // the truth for that list (a save of a new list can lower it).
    row.done = keys.length ? done : (p.done || 0);
    if (keys.length >= 2 && done >= keys.length && !row.finished_at) row.finished_at = now;
    const { error } = await supabaseAdmin.from('mld_days').upsert(row, { onConflict: 'player,day' });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (missing(e)) return NextResponse.json({ ok: false, available: false });
    console.error('mld event error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
