import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { normCode, groupByCode } from '@/lib/groups';

// /api/groups/<code>/history  -> the group's last two weeks, one read.
//
// Built from the group's own daily boards (/api/quiz/daily-combined?group=),
// one per day, so every figure here is a sum of figures the day board already
// shows. Nothing is stored. A finished day is frozen and its board is cached,
// so the cost of a history view is mostly today's board.
//
// The window is WINDOW days ending today, and never earlier than the day the
// group was made: a day before the group existed is not part of its history.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const WINDOW = 14;

function etIso(ms) {
  try { return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}
function suffixOf(iso) { const [Y, M, D] = iso.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }

export async function GET(request, { params }) {
  const code = normCode(params.code);
  if (!code) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const origin = new URL(request.url).origin;
  let since = '';
  try {
    const group = await groupByCode(supabaseAdmin, code);
    if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    since = etIso(Date.parse(group.created_at));
  } catch (e) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  // Today in Eastern, then plain calendar arithmetic on that date, so a DST
  // change can neither skip nor repeat a day.
  const today = etIso(Date.now());
  const base = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const days = [];
  for (let i = 0; i < WINDOW; i++) {
    const iso = new Date(base - i * 86400000).toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(since) && iso < since) break;
    days.push(iso);
  }

  const boards = await Promise.all(days.map(async (iso) => {
    try {
      const r = await fetch(`${origin}/api/quiz/daily-combined?group=${code}&date=${suffixOf(iso)}`, { cache: 'no-store' });
      if (r.status === 404) return { iso, missing: true };
      if (!r.ok) return { iso, failed: true };
      const d = await r.json();
      return { iso, board: d };
    } catch (e) { return { iso, failed: true }; }
  }));
  if (boards.some((b) => b.missing)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Oldest first for the charts; the client reverses for the list.
  const ordered = boards.slice().reverse();
  const stats = new Map(); // userKey -> running figures
  const touch = (row) => {
    let s = stats.get(row.userKey);
    if (!s) { s = { userKey: row.userKey, username: row.username, days: 0, wins: 0, top3: 0, sum: 0, best: 0, series: [], gameWins: {} }; stats.set(row.userKey, s); }
    s.username = row.username;
    return s;
  };
  const dayList = [];
  for (const b of ordered) {
    const rows = (b.board && Array.isArray(b.board.overall)) ? b.board.overall.filter((r) => (r.total || 0) > 0) : [];
    const played = new Set(rows.map((r) => r.userKey));
    for (const r of rows) {
      const s = touch(r);
      s.days += 1;
      s.sum += r.total || 0;
      s.best = Math.max(s.best, r.total || 0);
      if (r.rank === 1) s.wins += 1;
      if (r.rank <= 3) s.top3 += 1;
    }
    for (const g of (b.board && b.board.games) || []) {
      const top = (g.board || []).filter((x) => x.rank === 1 && !x.abandoned);
      for (const x of top) { const s = touch(x); s.gameWins[g.key] = (s.gameWins[g.key] || 0) + 1; }
    }
    for (const s of stats.values()) s.series.push(played.has(s.userKey) ? Math.round((rows.find((r) => r.userKey === s.userKey) || {}).total || 0) : 0);
    const winners = rows.filter((r) => r.rank === 1).map((r) => r.username);
    dayList.push({
      date: b.iso,
      final: !!(b.board && b.board.frozen),
      failed: !!b.failed,
      winners,
      top: rows.length ? Math.round(rows[0].total * 10) / 10 : null,
      played: rows.length,
    });
  }

  // A member first seen partway through the window has a shorter series; pad
  // the front so every series lines up with `dayList`.
  const members = [...stats.values()].map((s) => {
    const series = Array(Math.max(0, dayList.length - s.series.length)).fill(0).concat(s.series);
    // Streak: consecutive days played, counting back from today. Today not yet
    // played does not break it, since the day is still open.
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i] > 0) streak += 1;
      else if (i === series.length - 1 && !dayList[i].final) continue;
      else break;
    }
    const bestGame = Object.entries(s.gameWins).sort((a, b) => b[1] - a[1])[0];
    return {
      userKey: s.userKey,
      username: s.username,
      days: s.days,
      wins: s.wins,
      top3: s.top3,
      avg: s.days ? Math.round(s.sum / s.days) : 0,
      best: Math.round(s.best),
      streak,
      bestGame: bestGame ? { key: bestGame[0], wins: bestGame[1] } : null,
      series,
    };
  }).sort((a, b) => (b.wins - a.wins) || (b.avg - a.avg) || String(a.username).localeCompare(String(b.username)));

  return NextResponse.json({ window: dayList.length, days: dayList, members }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
