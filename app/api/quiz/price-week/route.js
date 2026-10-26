import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadDailyResultsCached } from '@/lib/daily-results-cache';
import { resolvePlayerKeys } from '@/lib/quiz-identity';
import { PRICE_KEYS } from '@/lib/price-games';

// THE SHOPPING WEEK (owner, 2026-10-25): Price Check's weekly shopper rank.
//
// A week runs Monday to Sunday, Eastern. A player's day is a RUN when all five
// tags were filed that day; the day's total is the five counted scores added
// (each tag's first row, abandoned = 0), exactly what the daily board adds.
// The week is the BEST FIVE runs: their sum ranks the board and their sum / 5
// is the weekly average the card is graded on, so a sixth or seventh run can
// only replace a weaker day, and one missed day costs nothing.
//
// Per-player, so it is never CDN-cached. ?date=YYYY-MM-DD picks the week that
// holds that day (default today, ET).

export const dynamic = 'force-dynamic';
const BEST = 5;
const keyOf = (r) => (r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
// The Monday that opens the week holding `ymd`, and its seven days.
function weekOf(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday 0
  const mon = new Date(d.getTime() - dow * 86400000);
  return Array.from({ length: 7 }, (_, i) => new Date(mon.getTime() + i * 86400000).toISOString().slice(0, 10));
}
const qidOf = (key, ymd) => { const [y, m, d] = ymd.split('-').map(Number); return `${key}-${m}-${d}-${String(y).slice(2)}`; };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const today = etToday();
  const want = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get('date') || '') ? searchParams.get('date') : today;
  const days = weekOf(want).filter((d) => d <= today);
  const ids = [];
  const dayOfQid = new Map();
  for (const d of days) for (const k of PRICE_KEYS) { const q = qidOf(k, d); ids.push(q); dayOfQid.set(q, [d, k]); }
  try {
    const [{ data, error }, me] = await Promise.all([
      loadDailyResultsCached(supabaseAdmin, ids),
      resolvePlayerKeys(supabaseAdmin, { anonId: searchParams.get('anonId'), email: searchParams.get('email') }).catch(() => null),
    ]);
    if (error) throw error;
    const mine = me && me.keys ? me.keys : new Set();
    const myKey = me && me.primary ? me.primary : null;
    // player -> day -> key -> first row
    const seen = new Map();
    const names = new Map();
    for (const r of (data || []).slice().sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const dk = dayOfQid.get(r.quiz_id);
      if (!dk) continue;
      let pk = keyOf(r);
      if (myKey && mine.has(pk)) pk = myKey;
      if (r.username && !names.has(pk)) names.set(pk, r.username);
      let p = seen.get(pk); if (!p) { p = new Map(); seen.set(pk, p); }
      let dd = p.get(dk[0]); if (!dd) { dd = {}; p.set(dk[0], dd); }
      if (!(dk[1] in dd)) dd[dk[1]] = r.abandoned ? 0 : Math.max(0, Number(r.score) || 0);
    }
    const rows = [];
    for (const [pk, p] of seen) {
      const runs = [];
      for (const [d, dd] of p) if (PRICE_KEYS.every((k) => k in dd)) runs.push({ d, total: PRICE_KEYS.reduce((a, k) => a + dd[k], 0) });
      if (!runs.length) continue;
      const best = runs.map((x) => x.total).sort((a, b) => b - a).slice(0, BEST);
      const sum = best.reduce((a, b) => a + b, 0);
      rows.push({ pk, sum, avg: Math.round((sum / BEST) * 10) / 10, runs: runs.length, name: names.get(pk) || null, days: Object.fromEntries(runs.map((x) => [x.d, x.total])) });
    }
    rows.sort((a, b) => b.sum - a.sum || b.runs - a.runs);
    let rank = 0, prev = null;
    rows.forEach((x, i) => { if (x.sum !== prev) { rank = i + 1; prev = x.sum; } x.rank = rank; });
    const meRow = myKey ? rows.find((x) => x.pk === myKey) : null;
    const fieldAvg = rows.length ? Math.round((rows.reduce((a, x) => a + x.avg, 0) / rows.length) * 10) / 10 : null;
    const pub = (x) => ({ rank: x.rank, name: x.name || 'Guest', avg: x.avg, runs: x.runs });
    return NextResponse.json({
      week: weekOf(want), today, field: rows.length, fieldAvg,
      top: rows.slice(0, 10).map(pub),
      me: meRow ? { ...pub(meRow), name: meRow.name || null, days: meRow.days } : null,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    return NextResponse.json({ error: 'db error' }, { status: 500 });
  }
}
