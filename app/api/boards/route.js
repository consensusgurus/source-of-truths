// GET /api/boards?name=<board> -> one prebuilt leaderboard (owner, 2026-11-20).
// See lib/boards-store.js for the names and app/api/cron/boards for how they are
// built. This route never touches quiz_results: it reads one small stored
// object, keeps it in memory for a minute, and lets the CDN hold it for a minute.
//
// `asOf` is when the board was last confirmed current: the job's latest run if
// the board has not changed since, otherwise the time it was rewritten. Pages
// print it as "as of 9:54" (owner, 2026-11-20).

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { BOARD_NAME_RE, readBoard } from '@/lib/boards-store';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const TTL_MS = 60 * 1000;
const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };
const MISS = { 'Cache-Control': 'public, s-maxage=30' };
const memo = new Map(); // name -> { t, val } or { p }

function cached(name) {
  const hit = memo.get(name);
  if (hit && hit.p) return hit.p;
  if (hit && Date.now() - hit.t < TTL_MS) return Promise.resolve(hit.val);
  const p = readBoard(supabaseAdmin, name).then(
    (val) => { memo.set(name, { t: Date.now(), val }); return val; },
    () => { memo.delete(name); return null; },
  );
  memo.set(name, { p });
  while (memo.size > 400) memo.delete(memo.keys().next().value);
  return p;
}

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const name = (sp.get('name') || '').trim();
  // part=overall (data audit, 2026-11-23): just the day's ranked list, for the
  // home rail. The full overall board also carries every game's standings and the
  // picks pool (about 90% of its 361 KB), which the rail never reads.
  const part = sp.get('part') || '';
  if (!BOARD_NAME_RE.test(name)) return NextResponse.json({ error: 'unknown board' }, { status: 400, headers: MISS });
  const [board, index] = await Promise.all([cached(name), cached('index')]);
  if (!board) return NextResponse.json({ error: 'not built yet', name }, { status: 404, headers: MISS });
  const current = index && index.names && board.h && index.names[name] === board.h;
  const asOf = current ? Math.max(Number(index.at) || 0, Number(board.at) || 0) : (Number(board.at) || 0);
  const { h, ...out } = board;
  if (part === 'overall') { delete out.games; delete out.pool; delete out.overallAll; delete out.priceField; delete out.stageField; }
  return NextResponse.json({ ...out, asOf }, { headers: CACHE });
}
