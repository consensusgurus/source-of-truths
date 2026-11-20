// GET /api/cron/boards -> rebuild the day's prebuilt leaderboards (owner,
// 2026-11-20). Runs every two minutes from vercel.json. See lib/boards-store.js.
//
// Each board is computed by the SAME code the live routes use, so a prebuilt
// board is identical to what that route returns with no identity:
//   overall / circuit-<id>  the daily-combined GET, called in process
//   game-<quizId>           summarize() from /api/quiz/board over that quiz's rows
// Only boards whose content changed are rewritten (hash in the index), so a
// quiet game costs nothing after its first write.
//
// Nothing reads these yet: pages switch over one at a time (docs/claude/boards-rework.md).

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { DAILY_KEYS } from '@/lib/daily-combined';
import { etTodayServer, suffixOfDate, gamesForSuffix } from '@/lib/daily-slate';
import { DISPLAY_CIRCUITS } from '@/lib/circuits';
import { GET as combinedGET } from '../../quiz/daily-combined/route';
import { summarize } from '../../quiz/board/route';
import { boardHash, readBoard, writeBoard } from '@/lib/boards-store';

export const dynamic = 'force-dynamic';
// force-no-store, not just force-dynamic: without it Next 14 keeps this route's
// Supabase GETs in Vercel's Data Cache across deploys (see cron/drawing-warm).
export const fetchCache = 'force-no-store';
// 300 (was 120, 2026-11-20): a cold run loads the results table first and ran
// into the 120s limit twice on its first morning.
export const maxDuration = 300;

// A run that started this recently means another one is (or was just) going.
// A run claimed this recently is still going (or just finished): skip.
const RECENT_MS = 100 * 1000;
const NO_STORE = { 'Cache-Control': 'no-store' };

function authed(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true;
  const tok = process.env.ADMIN_TASK_TOKEN;
  if (tok && request.headers.get('x-admin-token') === tok) return true;
  return !secret;
}

async function combined(qs) {
  const res = await combinedGET(new Request(`https://mindloftdaily.com/api/quiz/daily-combined?${qs}`));
  if (!res || res.status !== 200) throw new Error(`daily-combined ${res ? res.status : 'no response'} for ${qs}`);
  const d = await res.json();
  if (!d || d.error) throw new Error(`daily-combined error for ${qs}`);
  return d;
}

export async function GET(request) {
  if (!authed(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const t0 = Date.now();
  const prev = (await readBoard(supabaseAdmin, 'index')) || null;
  if (prev && prev.startedAt && t0 - prev.startedAt < RECENT_MS && !new URL(request.url).searchParams.get('force')) {
    return NextResponse.json({ ok: true, skipped: 'recent', ageMs: t0 - prev.startedAt }, { headers: NO_STORE });
  }
  // CLAIM THE RUN FIRST (2026-11-20): the index used to be written only at the
  // end, so a slow run never told the next one it was still going and two could
  // overlap. The hashes are kept, so nothing is rewritten because of the claim.
  await writeBoard(supabaseAdmin, 'index', { ...(prev || {}), startedAt: t0 }, (prev && prev.at) || t0);
  const today = etTodayServer();
  const suffix = suffixOfDate(today);
  const hashes = prev && prev.date === suffix && prev.names ? { ...prev.names } : {};
  const built = {};
  const errors = [];

  // 1. The day's board and every run's board, through the live route itself.
  try { built.overall = await combined('all=1&top=30&pool=1'); } catch (e) { errors.push(String(e.message || e)); }
  for (const c of DISPLAY_CIRCUITS) {
    try { built[`circuit-${c.id}`] = await combined(`circuit=${encodeURIComponent(c.id)}&all=1&top=30`); }
    catch (e) { errors.push(String(e.message || e)); }
  }

  // 2. Every one of today's puzzles, from one pass over the shared results cache.
  try {
    const games = gamesForSuffix(DAILY_KEYS, suffix, today);
    const want = new Map(games.map((g) => [g.quizId, []]));
    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) throw new Error('results: ' + (error.message || 'error'));
    for (const r of (data || [])) { const a = r && want.get(r.quiz_id); if (a) a.push(r); }
    for (const [qid, rows] of want) built[`game-${qid}`] = summarize(rows);
  } catch (e) { errors.push(String(e.message || e)); }

  // 3. Write only what changed. `at` is not part of the hash.
  const at = Date.now();
  let wrote = 0, same = 0, bytes = 0, failed = 0;
  for (const [name, board] of Object.entries(built)) {
    const h = boardHash(board);
    if (hashes[name] === h) { same += 1; continue; }
    const r = await writeBoard(supabaseAdmin, name, { ...board, at, h }, at);
    if (r.ok) { hashes[name] = h; wrote += 1; bytes += r.bytes || 0; } else failed += 1;
  }
  await writeBoard(supabaseAdmin, 'index', { startedAt: t0, at, date: suffix, names: hashes, errors: errors.slice(0, 10) }, at);
  return NextResponse.json({ ok: !errors.length && !failed, date: suffix, boards: Object.keys(built).length, wrote, same, failed, bytes, errors: errors.slice(0, 10), ms: Date.now() - t0 }, { headers: NO_STORE });
}
