// MIND LOFT DAILY for the admin desk (owner, 2026-11-22: see who created a day
// with Build Your Day). Reads mld_days (migration 76): who set up or edited a
// day, which puzzles it holds, how far they got, plus the headline counts and
// the most picked puzzles. Loaded only when the tab opens.
//
// Auth: the admin cookie only. This names players, so there is no token path.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { DAILY_GAME_MAP, etTodayISO } from '@/lib/daily-games';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function missing(err) {
  if (!err) return false;
  return err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || '');
}
function shiftDay(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const today = etTodayISO();
    const since = shiftDay(today, -60);
    const { data, error } = await supabaseAdmin.from('mld_days')
      .select('player, day, user_id, username, anon_id, keys, pages, done, setup, edits, opened_at, finished_at, country, created_at, updated_at')
      .gte('day', since).order('updated_at', { ascending: false }).limit(5000);
    if (error) throw error;
    const rows = data || [];
    const week = shiftDay(today, -6);
    const players = new Set();
    const builders = new Set();
    const t = { today: 0, setupsToday: 0, finishedToday: 0, week: 0, setups7d: 0, finished7d: 0 };
    const picks = new Map();
    for (const r of rows) {
      players.add(r.player);
      if (r.setup === 'new') builders.add(r.player);
      const fin = !!r.finished_at;
      if (r.day === today) { t.today++; if (r.setup) t.setupsToday++; if (fin) t.finishedToday++; }
      if (r.day >= week) {
        t.week++; if (r.setup) t.setups7d++; if (fin) t.finished7d++;
        for (const k of r.keys || []) picks.set(k, (picks.get(k) || 0) + 1);
      }
    }
    const name = (k) => (DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].name) || k;
    return NextResponse.json({
      available: true,
      today,
      totals: { ...t, players: players.size, builders: builders.size },
      top: [...picks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, c]) => ({ key: k, name: name(k), count: c })),
      rows: rows.map((r) => ({
        player: r.player,
        name: r.username || null,
        signedIn: !!r.user_id,
        anon: r.anon_id ? String(r.anon_id).slice(0, 8) : '',
        day: r.day,
        puzzles: (r.keys || []).map(name),
        keys: r.keys || [],
        pages: r.pages || 0,
        done: r.done || 0,
        setup: r.setup || null,
        edits: r.edits || 0,
        opened: !!r.opened_at,
        finished: !!r.finished_at,
        country: r.country || '',
        updatedAt: r.updated_at,
      })),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    if (missing(e)) return NextResponse.json({ available: false });
    console.error('admin my-day error', e);
    return NextResponse.json({ error: 'Could not load Mind Loft Daily.' }, { status: 500 });
  }
}
