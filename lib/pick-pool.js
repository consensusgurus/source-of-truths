// THE PICKS FROM THE PREBUILT DAY BOARD (owner, 2026-11-20, docs/claude/boards-rework.md).
// The puzzle ending's Up Next picks (Play Similar, Switch Gears) used to come from
// two uncached /api/quiz/daily-combined reads per finished puzzle. The day board the
// cron writes every two minutes (boards-v1/overall) now carries `pool`: per game,
// today's plays, named players, finishers, timed finishes and median finish time.
// This prices the picks from it, with the SAME rules as the route's picks loop
// (app/api/quiz/daily-combined/route.js, `stand.picks`). Change both together.
import { sameFamily, relativesOf } from './daily-families';

const LADDER = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2];
const ladderAt = (pos) => (pos >= 1 && pos <= LADDER.length ? LADDER[pos - 1] : 1);

// lessKeys: the games just played; keep: keys allowed (null = every game); pr: the
// player's place on the puzzle just played, 0 to 1, or null.
export function picksFromPool(pool, { lessKeys, keep = null, pr = null }) {
  const less = (lessKeys || []).filter(Boolean);
  const picks = [];
  for (const g of pool || []) {
    if (!g || !g.key || less.includes(g.key)) continue;
    if (keep && !keep.has(g.key)) continue;
    const plays = Number(g.plays) || 0, named = Number(g.named) || 0;
    const solved = Number(g.solved) || 0, clocks = Number(g.clocks) || 0;
    const secs = Number(g.secs) || 0;
    const sib = less.some((k) => sameFamily(k, g.key));
    if (plays < (sib ? 1 : 3)) continue;
    const rate = solved / plays;
    if (sib ? clocks < 1 : (rate < 0.5 || clocks < 2)) continue;
    if (!(secs > 0)) continue;
    if (!sib && secs > 600) continue;
    const mins = Math.max(1, Math.round(secs / 60));
    const pos = sib && pr != null ? Math.min(named + 1, Math.max(1, Math.ceil(pr * named))) : Math.floor(named / 2) + 1;
    const pts = ladderAt(pos);
    picks.push({ key: g.key, pts, mins, finish: Math.round(rate * 100), plays, sib, v: (pts * rate) / Math.max(1, secs / 60) });
  }
  picks.sort((a, b) => b.v - a.v || a.mins - b.mins);
  const shown = picks.slice(0, 8);
  const famNear = (key) => {
    let best = 99;
    for (const k of less) { const i = relativesOf(k).indexOf(key); if (i !== -1 && i < best) best = i; }
    return best;
  };
  const extra = picks.slice(8).filter((x) => x.sib).sort((a, b) => famNear(a.key) - famNear(b.key));
  const nearest = extra[0];
  for (const x of extra) if (shown.filter((y) => y.sib).length < 2) shown.push(x);
  if (nearest && !shown.includes(nearest)) {
    const sibsShown = shown.filter((y) => y.sib);
    if (!sibsShown.length || famNear(nearest.key) < Math.min(...sibsShown.map((y) => famNear(y.key)))) shown.push(nearest);
  }
  return shown.map((x) => ({ key: x.key, pts: x.pts, mins: x.mins, finish: x.finish, plays: x.plays, ...(x.sib ? { sib: true } : {}) }));
}

// Today's board suffix in New York time ("11-20-26"), to refuse yesterday's board.
export function todaySuffixET(now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric', year: '2-digit' })
      .format(now).replace(/\//g, '-');
  } catch (e) { return null; }
}
