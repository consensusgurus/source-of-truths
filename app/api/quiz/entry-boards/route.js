import { NextResponse } from 'next/server';
import { gamesForSuffix, etTodayServer, suffixOfDate } from '@/lib/daily-slate';
import { liveDailyKeys, DAILY_GAME_MAP } from '@/lib/daily-games';

// LAST MONDAY'S BOARDS, for the entry door's Sunday card (owner, 2026-10-18).
//
// A new visitor who arrives on a Sunday is offered last Monday's boards in
// place of the Sunday Editions, because most dailies build in difficulty
// through the week and Monday is the gentlest day. This answers one question:
// which board number did each live game publish on the Monday six days back,
// so the door can link straight to it with ?p=<num>. Nothing personal, so the
// answer is the same for everyone and is cached at the edge for the hour.
export const dynamic = 'force-dynamic';

const HEAD = { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' };

export async function GET() {
  const today = etTodayServer();
  const [y, m, d] = today.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  // The Monday that opened this week (six days back on a Sunday).
  const back = (t.getUTCDay() + 6) % 7;
  const mon = new Date(Date.UTC(y, m - 1, d - back)).toISOString().slice(0, 10);
  const boards = {};
  try {
    for (const g of gamesForSuffix(liveDailyKeys(today), suffixOfDate(mon), today)) {
      const href = (DAILY_GAME_MAP[g.key] && DAILY_GAME_MAP[g.key].href) || `/${g.key}`;
      boards[g.key] = { num: g.num, href: `${href}?p=${g.num}` };
    }
  } catch (e) { /* an empty map just hides the Monday option */ }
  return NextResponse.json({ date: mon, boards }, { headers: HEAD });
}
