// THE HOME'S ORDER IS KNOWN BEFORE FIRST PAINT (owner, 2026-11-21: "very hard to
// click to the page you want because items move around so much while loading").
//
// The home's Popular order and its played-to-the-foot rule both used to wait on
// per-visitor reads (the day board, 1 to 6s; daily-status), so the tiles were
// painted in one order and reshuffled once or twice under the reader's thumb.
// This server-side seed hands StageToday both inputs in the HTML itself:
//   plays  today's plays per game, off the PREBUILT overall board
//          (boards-v1/overall, rebuilt every 2 minutes by app/api/cron/boards)
//   runs   each run's finishes and players today, off its prebuilt circuit-<id>
//          board, so the runs row is in its final order too
//   done   the games the reader had finished at their last home visit, from the
//          sot_dn cookie StageToday writes whenever daily-status answers
// StageToday orders by these for the whole visit and never reorders when the
// live reads land; the live reads only change figures and the played styling.
//
// One stored-object read per server instance per minute, and never more than
// SEED_WAIT_MS on the page's critical path: a slow or missing board just means
// no seed, and the page falls back to ordering off its own board read.

import { supabaseAdmin } from '@/lib/supabase-server';
import { readBoard } from '@/lib/boards-store';
import { DISPLAY_CIRCUITS } from '@/lib/circuits';

const TTL_MS = 60 * 1000;
const SEED_WAIT_MS = 350;
let memo = null; // { t, val } or { p }

export const DONE_COOKIE = 'sot_dn';

// Today's slate suffix in Eastern time, M-D-YY, the same shape as a quizId's
// tail and the board's `date`.
export function etSuffix(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: '2-digit', month: 'numeric', day: 'numeric' })
      .formatToParts(now);
    const v = (t) => (parts.find((p) => p.type === t) || {}).value;
    return `${Number(v('month'))}-${Number(v('day'))}-${Number(v('year'))}`;
  } catch (e) { return ''; }
}

// Today in Eastern time as YYYY-MM-DD, the client's etToday() shape.
export function etDay(now = new Date()) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now); } catch (e) { return ''; }
}

function playsOf(board) {
  if (!board || !Array.isArray(board.games)) return null;
  const out = {};
  for (const g of board.games) if (g && g.key && typeof g.plays === 'number') out[g.key] = g.plays;
  return out;
}

function loadBoard() {
  if (memo && memo.p) return memo.p;
  if (memo && Date.now() - memo.t < TTL_MS) return Promise.resolve(memo.val);
  const runIds = DISPLAY_CIRCUITS.map((c) => c.id);
  const p = Promise.all([
    readBoard(supabaseAdmin, 'overall'),
    ...runIds.map((id) => readBoard(supabaseAdmin, `circuit-${id}`).catch(() => null)),
  ]).then(
    ([b, ...cs]) => {
      let val = null;
      if (b) {
        const runs = {};
        cs.forEach((c, i) => {
          if (!c || c.date !== b.date) return;
          runs[runIds[i]] = { at: Array.isArray(c.doneAts) ? c.doneAts : [], p: Number(c.overallField) || 0 };
        });
        val = { date: b.date, plays: playsOf(b), runs };
      }
      memo = { t: Date.now(), val };
      return val;
    },
    () => { memo = null; return null; },
  );
  memo = { p };
  return p;
}

// cookie: "<M-D-YY>.<key>.<key>..." ; only today's counts.
export function doneFromCookie(raw, suffix) {
  if (!raw || !suffix) return [];
  const parts = String(raw).split('.');
  if (parts.shift() !== suffix) return [];
  return parts.filter((k) => /^[a-z0-9]{1,30}$/.test(k)).slice(0, 400);
}

export async function homeSeed(doneCookie) {
  const suffix = etSuffix();
  const done = doneFromCookie(doneCookie, suffix);
  let board = null;
  try {
    board = await Promise.race([
      loadBoard(),
      new Promise((r) => setTimeout(() => r(null), SEED_WAIT_MS)),
    ]);
  } catch (e) { board = null; }
  const fresh = board && board.date === suffix;
  const plays = fresh && board.plays ? board.plays : null;
  // A run's finishes in the last 24 hours (today's board only) and players.
  let runs = null;
  if (fresh && board.runs) {
    const cut = Date.now() - 864e5;
    runs = {};
    for (const [id, r] of Object.entries(board.runs)) {
      runs[id] = { d: r.at.filter((t) => Number(new Date(t)) >= cut || Number(t) >= cut).length, p: r.p };
    }
  }
  return { date: suffix, today: etDay(), plays, runs, done };
}
