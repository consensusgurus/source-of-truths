import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { PUZZLES } from '@/app/outwit/puzzles';
import { scoreOutwitField, HOUSE_CUTOFF } from '@/lib/outwit-score';

// POST /api/outwit  { quizId, answers:[5], anonId, email? }
//
// Scores one Outwit run — and the whole field — against the day's pool.
//
// ADAPTIVE SCORING (owner ruling 2026-07-18): nothing is ever final. Every
// score is a pure function of ALL picks in the pool as they stand RIGHT NOW, so
// it is recomputed from scratch on every request. There is no score "frozen at
// play time": when a new player locks in, the field changes and everybody's
// score and rank move with it. A player who looked dead last against a tiny
// early crowd can end up first once the field fills in, and vice-versa. Because
// the pool is identical for everyone and the scoring is order-independent,
// replaying — or simply re-opening the result — re-scores you against the live
// field. The client re-asks this route on a timer while the result is on screen.
//
// LEAVE-ONE-OUT: every player is scored against the field MINUS their own pick,
// so their own ballot never counts against them. This is what makes a perfect 10
// reachable — before it, on the "fewest/rarest" prompts (least, unique) your own
// vote bumped your pick out of the winning tier and the ceiling was 8-9. Only the
// count-based prompts need the adjustment (see buildContext); the closest-to-crowd
// prompts already never count a player as strictly closer to the target than
// themselves, and the target is meant to reflect the whole crowd, you included.
//
// POOL RULE: the pre-written ~48-answer "house crowd" (server-only, in
// app/outwit/puzzles.js) is in the pool ONLY while at most HOUSE_CUTOFF real
// players have locked in. From the 11th real player on, the pool is real picks
// only, for EVERYONE — the house retires pool-wide, and every earlier player is
// henceforth re-scored against the human field alone. This is a single
// pool-wide flag, never per-viewer, so the field one player sees is the field
// everyone sees.
//
// Picks are stored in `outwit_picks` (migration 35), one row per (quiz_id,
// anon_id) — a browser's pick is inserted once and never re-inserted, so nobody
// can stuff the ballot by replaying, but their score keeps updating as others
// arrive. If the table doesn't exist yet, the game still works: pool = house
// crowd only and the live board is empty.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const round1 = (x) => Math.round(x * 10) / 10;

function fmtNum(x) {
  const v = Math.round(x);
  if (Math.abs(v) >= 1e6) return `${Math.round(v / 1e5) / 10}M`;
  if (Math.abs(v) >= 10000) return `${Math.round(v / 1000)}k`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(v);
}

// Reveal histogram for numeric prompts: 8 equal buckets across the pool's
// 5th..95th percentile span (outliers clamp into the edge buckets).
function histogram(pool, you, target) {
  const s = [...pool].sort((a, b) => a - b);
  const lo = s[Math.floor(s.length * 0.05)];
  const hi = s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  const span = Math.max(1, hi - lo);
  const N = 8;
  const idxOf = (v) => Math.max(0, Math.min(N - 1, Math.floor(((v - lo) / span) * N)));
  const buckets = Array.from({ length: N }, (_, i) => ({
    label: `${fmtNum(lo + (span * i) / N)}–${fmtNum(lo + (span * (i + 1)) / N)}`,
    count: 0, you: false, target: false,
  }));
  for (const v of pool) buckets[idxOf(v)].count++;
  buckets[idxOf(you)].you = true;
  buckets[idxOf(target)].target = true;
  return buckets;
}

// Build the requester's reveal object for one prompt from its context.
function reveal(pr, ctx, you, poolSize) {
  const base = { type: pr.type, tag: pr.tag, q: pr.q, yourAnswer: you, pts: ctx.ptsFor(you), poolSize };
  if (ctx.kind === 'num') {
    const out = {
      ...base,
      target: round1(ctx.target),
      median: round1(ctx.med),
      beatPct: ctx.beatPctFor(you),
      buckets: histogram(ctx.pool, you, ctx.target),
    };
    if (pr.type === 'herd' && pr.truth != null) { out.truth = pr.truth; out.truthNote = pr.truthNote || null; }
    return out;
  }
  // Choice-style reveals print the leave-one-out view the points were scored on.
  const v = ctx.viewFor ? ctx.viewFor(you) : null;
  const view = v ? { counts: v.counts, winSet: v.winIdx == null ? [] : [v.winIdx], tied: v.tied, looCounts: true } : { counts: ctx.counts };
  if (ctx.kind === 'choice') return { ...base, options: pr.options, ...view, winner: v && v.winIdx != null ? v.winIdx : ctx.winner };
  // unique: themed (winner is an option index) or legacy numeric (winner is a number)
  if (ctx.options) return { ...base, options: ctx.options, ...view, winner: v && v.winIdx != null ? v.winIdx : ctx.winner };
  return { ...base, min: pr.min, max: pr.max, ...view, winner: v && v.winner != null ? v.winner : ctx.winner };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const anonId = typeof body.anonId === 'string' && body.anonId.trim() ? body.anonId.trim().slice(0, 64) : null;
    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : null;
    const answers = Array.isArray(body.answers) ? body.answers : null;

    const puzzle = PUZZLES.find((p) => p.quizId === quizId);
    if (!puzzle) return NextResponse.json({ error: 'unknown quizId' }, { status: 400 });
    if (puzzle.live > etTodayServer()) return NextResponse.json({ error: 'not live yet' }, { status: 400 });
    if (!answers || answers.length !== puzzle.prompts.length) {
      return NextResponse.json({ error: 'answers required' }, { status: 400 });
    }
    // validate each answer against its prompt
    const clean = [];
    for (let i = 0; i < puzzle.prompts.length; i++) {
      const pr = puzzle.prompts[i];
      const v = Number(answers[i]);
      if (!Number.isInteger(v)) return NextResponse.json({ error: `answer ${i + 1} invalid` }, { status: 400 });
      if (pr.options) {
        if (v < 0 || v >= pr.options.length) return NextResponse.json({ error: `answer ${i + 1} out of range` }, { status: 400 });
      } else if (v < pr.min || v > pr.max) {
        return NextResponse.json({ error: `answer ${i + 1} out of range` }, { status: 400 });
      }
      clean.push(v);
    }

    // Resolve the requester's identity once — used for both live-board
    // attribution and (if new) the stored row's user_id.
    let ident = null;
    try { ident = await findQuizIdentity(supabaseAdmin, { email, anonId }); } catch (e) { /* best-effort */ }
    const myUserId = ident && ident.id ? ident.id : null;
    const myName = ident && ident.username ? ident.username : null;

    // Every real pick so far. Table may not exist yet (migration 35 not run) —
    // the game degrades gracefully to the house pool alone with an empty board.
    let rows = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('outwit_picks')
        .select('id, anon_id, user_id, answers, created_at')
        .eq('quiz_id', quizId)
        .limit(20000);
      if (!error && Array.isArray(data)) rows = data;
    } catch (e) { /* table missing — house pool only */ }

    // One player object per stored row. Then make sure the requester is in the
    // field exactly once: an existing player (replay) already is; a brand-new
    // player (or a no-anonId ephemeral play) is added so they are scored as part
    // of the live field, symmetric with everyone else.
    const players = rows
      .filter((r) => Array.isArray(r.answers))
      .map((r) => ({ anonId: r.anon_id, userId: r.user_id, answers: r.answers, created: r.created_at || '', isYou: !!anonId && r.anon_id === anonId }));
    const alreadyPlayed = !!anonId && players.some((p) => p.isYou);
    if (!alreadyPlayed) {
      players.push({ anonId: anonId || null, userId: myUserId, answers: clean, created: '9999', isYou: true });
    }

    // Score the whole field with the shared adaptive scorer (the same code the
    // daily/combined board uses, so the two boards can never disagree).
    const { contexts, totalFor, useHouse, realCount } = scoreOutwitField(puzzle, players, { houseCutoff: HOUSE_CUTOFF });

    // The requester's detailed, revealed result.
    const prompts = puzzle.prompts.map((pr, i) => reveal(pr, contexts[i].ctx, clean[i], contexts[i].poolSize));
    const points = prompts.reduce((s, p) => s + p.pts, 0);

    // LIVE STANDINGS: recompute every player's total against the same pool and
    // rank them. This is the board that visibly re-shuffles as picks arrive.
    // Names: registered players only (resolved by user_id or by anon_id), the
    // same population the rest of the daily leaderboards show.
    const userIds = [...new Set(players.map((p) => p.userId).filter(Boolean))];
    const anonIds = [...new Set(players.map((p) => p.anonId).filter(Boolean))];
    const nameByUser = new Map();
    const nameByAnon = new Map();
    try {
      if (userIds.length) {
        const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds);
        for (const u of data || []) { if (u.username) { nameByUser.set(u.id, u.username); if (u.anon_id) nameByAnon.set(u.anon_id, u.username); } }
      }
      if (anonIds.length) {
        const { data } = await supabaseAdmin.from('quiz_users').select('username, anon_id').in('anon_id', anonIds);
        for (const u of data || []) { if (u.username && u.anon_id) nameByAnon.set(u.anon_id, u.username); }
      }
    } catch (e) { /* no names — board just comes back empty */ }

    const named = [];
    for (const p of players) {
      const name = (p.isYou && myName) || (p.userId && nameByUser.get(p.userId)) || (p.anonId && nameByAnon.get(p.anonId)) || null;
      if (!name) continue;
      named.push({ name, total: totalFor(p), created: p.created, isYou: p.isYou });
    }
    named.sort((a, b) => b.total - a.total || String(a.created).localeCompare(String(b.created)));
    const ranked = named.map((e, i) => ({ ...e, rank: i + 1 }));
    const youEntry = ranked.find((e) => e.isYou) || null;
    const board = {
      field: realCount,
      registered: ranked.length,
      houseActive: useHouse,
      top: ranked.slice(0, 25).map((e) => ({ rank: e.rank, name: e.name, total: e.total, you: e.isYou })),
      you: youEntry ? { rank: youEntry.rank, total: youEntry.total } : null,
      youTotal: points,
      youRegistered: !!youEntry,
    };

    // Record the pick (first submission per browser only; replays never insert).
    if (anonId && !alreadyPlayed) {
      try {
        await supabaseAdmin
          .from('outwit_picks')
          .upsert({ quiz_id: quizId, anon_id: anonId, user_id: myUserId, answers: clean }, { onConflict: 'quiz_id,anon_id', ignoreDuplicates: true });
      } catch (e) { /* table missing — scoring still returned */ }
    }

    return NextResponse.json({
      ok: true,
      quizId,
      points,
      total: puzzle.prompts.length * 2,
      poolSize: prompts[0] ? prompts[0].poolSize : 0,
      realCount,
      houseActive: useHouse,
      replay: alreadyPlayed,
      prompts,
      board,
    });
  } catch (e) {
    console.error('outwit error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
