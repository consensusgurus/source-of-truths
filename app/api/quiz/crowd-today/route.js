import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity, resolveAnonSet } from '@/lib/quiz-identity';
import { PUZZLES as P_OUTWIT } from '@/app/outwit/puzzles';
import { PUZZLES as P_OUTRANK } from '@/app/outrank/puzzles';
import { PUZZLES as P_FEUD } from '@/app/feud/puzzles';
import { PUZZLES as P_HERD } from '@/app/herd/puzzles';
import { scoreOutwitField, HOUSE_CUTOFF as OUTWIT_CUTOFF } from '@/lib/outwit-score';
import { scoreOutrankField, HOUSE_CUTOFF as OUTRANK_CUTOFF } from '@/lib/outrank-score';
import { scoreFeudField, HOUSE_CUTOFF as FEUD_CUTOFF } from '@/lib/feud-score';
import { scoreHerdField, HOUSE_CUTOFF as HERD_CUTOFF } from '@/lib/herd-score';

// GET /api/quiz/crowd-today?game=outwit|outrank|feud&anonId=..&email=..
//
// The crowd-answer summary the daily tile panel shows in place of its score
// graph (owner, 2026-08-01). The three Crowd Psychology games are the only ones
// whose interesting artifact is what everybody ELSE said, so their panel leads
// with today's crowd instead of the viewer's own history.
//
// SPOILER GATE (owner rule, 2026-08-01): this route answers `{ played: false }`
// to anyone whose account has not locked in today's puzzle, and the panel then
// shows no crowd tab at all. A player who has not played must not be able to
// see the crowd answers, and must not be offered the option. "Played" is
// resolved by ACCOUNT (anon set + user id), exactly the way /api/feud and
// /api/outrank resolve it, so a play on another device still counts.
//
// The tallies here are the SAME live, adaptive numbers the game's own reveal
// shows: the shared field scorers in lib/*-score.js against the same pool
// (house crowd while at most HOUSE_CUTOFF real players are in, real ballots
// only after that), deduped to one ballot per account, and graded leave-one-out
// so the percentages agree with the points the player was paid. Nothing is
// cached: the key moves all day and so does this.
//
// The response is NORMALIZED across the three games so the panel renders one
// shape:
//   { ok, game, quizId, dateLabel, played, field, houseActive, headline,
//     groups: [ { q, note, text, rows: [ { label, pct, you, tag, sub } ] } ] }

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const GAMES = {
  outwit: { puzzles: P_OUTWIT, table: 'outwit_picks' },
  outrank: { puzzles: P_OUTRANK, table: 'outrank_picks' },
  feud: { puzzles: P_FEUD, table: 'feud_picks' },
  herd: { puzzles: P_HERD, table: 'outwit_picks' },
};

// How many rows a group shows. The panel is a compact strip, not the game's
// full reveal, so long boards are trimmed to their head.
const MAX_ROWS = 5;

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Today's drop = the newest puzzle already live, matching what the game pages
// render (they filter to live <= today and open the last one).
function todaysPuzzle(puzzles) {
  const today = etTodayServer();
  const live = (puzzles || []).filter((p) => p && p.live && p.live <= today);
  return live.length ? live[live.length - 1] : null;
}

async function loadRows(table, quizId) {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('id, anon_id, user_id, answers, created_at')
      .eq('quiz_id', quizId)
      .limit(20000);
    if (!error && Array.isArray(data)) return data;
  } catch (e) { /* table missing — house pool only, and nobody has played */ }
  return [];
}

// A stored ballot's owning account, resolved the way every other crowd route
// does it: a row with no user_id still resolves through quiz_users.anon_id.
async function resolveOwners(rows) {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const anonIds = [...new Set(rows.map((r) => r.anon_id).filter(Boolean))];
  const byUser = new Map();
  const byAnon = new Map();
  try {
    if (userIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds);
      for (const u of data || []) { byUser.set(u.id, u.id); if (u.anon_id) byAnon.set(u.anon_id, u.id); }
    }
    if (anonIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('anon_id', anonIds);
      for (const u of data || []) if (u.anon_id) byAnon.set(u.anon_id, u.id);
    }
  } catch (e) { /* unresolved owners simply stay distinct guests */ }
  return { byUser, byAnon };
}

// One ballot per account (earliest row wins), guests stay distinct — the same
// dedup the game routes apply, so this pool can never disagree with theirs.
function buildPool(rows, { byUser, byAnon }, anonSet, myUserId) {
  const anonHit = new Set(anonSet || []);
  const players = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => {
      const ownerId = r.user_id || (r.anon_id ? byAnon.get(r.anon_id) : null) || null;
      return {
        anonId: r.anon_id, userId: r.user_id, answers: r.answers,
        created: r.created_at || '', ownerId,
        isYou: (!!myUserId && ownerId === myUserId) || (!!r.anon_id && anonHit.has(r.anon_id)),
      };
    });
  const seen = new Set();
  const pool = [];
  for (const p of [...players].sort((a, b) => String(a.created).localeCompare(String(b.created)))) {
    if (p.ownerId) {
      if (seen.has(p.ownerId)) continue;
      seen.add(p.ownerId);
    }
    pool.push(p);
  }
  return { pool, mine: pool.find((p) => p.isYou) || null };
}

const pctOf = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

function fmtNum(x) {
  const v = Math.round(Number(x));
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1e6) return `${Math.round(v / 1e5) / 10}M`;
  if (Math.abs(v) >= 10000) return `${Math.round(v / 1000)}k`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(v);
}

// ── FEUD: five prompts, each a live tally of what players typed ──────────────
function feudGroups(puzzle, pool, mine) {
  const field = scoreFeudField(puzzle, pool, { houseCutoff: FEUD_CUTOFF });
  // The stored ballot was already cleaned by /api/feud on the way in, so it is
  // fed straight to the scorer. (Re-running cleanBallot here is not just
  // redundant, it is the read path's only trap: lib/feud-score re-exports
  // normAnswer without importing it, so cleanBallot throws outside the Next
  // bundle. Fixed in that file, and this stays independent of it either way.)
  const clean = Array.isArray(mine.answers) && mine.answers.length === puzzle.prompts.length
    ? mine.answers.map((a) => (Array.isArray(a) ? a : []))
    : null;
  if (!clean) return null;
  const detail = field.detailFor(clean);
  const groups = puzzle.prompts.map((pr, p) => {
    const d = detail.perPrompt[p] || { board: [], missed: [], pts: 0 };
    const rows = (d.board || []).slice(0, MAX_ROWS).map((r) => ({
      label: r.label, pct: r.pct, you: !!r.yours, tag: r.yours ? 'you' : null,
    }));
    const missed = (d.missed || []).map((m) => `${m.label} (#${m.rank})`).join(' · ');
    return {
      q: pr.q,
      note: `+${d.pts} pts`,
      text: missed ? `Off the board: ${missed}` : null,
      rows,
    };
  });
  return { groups, field: field.realCount, houseActive: field.useHouse, headline: `${detail.total} of ${puzzle.prompts.length * 100} matched` };
}

// ── OUTRANK: one slate, ordered by the crowd's favorite-vote share ───────────
function outrankGroups(puzzle, pool, mine) {
  const field = scoreOutrankField(puzzle, pool, { houseCutoff: OUTRANK_CUTOFF });
  const answers = (mine.answers || []).map(Number);
  const K = puzzle.items.length;
  const detail = field.detailFor(answers);
  // Same counts the order was sorted on (crowd minus your own vote).
  const graded = detail.counts || field.counts;
  const totalVotes = graded.reduce((a, b) => a + b, 0) || 1;
  const yourFav = answers[0];
  const predictedPos = new Array(K).fill(-1);
  answers.slice(1).forEach((item, pos) => { if (item >= 0 && item < K) predictedPos[item] = pos; });
  const rows = detail.actual.map((item, pos) => ({
    label: puzzle.items[item],
    pct: pctOf(graded[item], totalVotes),
    you: item === yourFav,
    tag: item === yourFav ? 'your fav' : null,
    sub: predictedPos[item] >= 0 ? `you had #${predictedPos[item] + 1}` : null,
    rank: pos + 1,
  }));
  return {
    groups: [{ q: puzzle.theme ? `The crowd's order: ${puzzle.theme}` : "The crowd's order", note: `+${detail.total} pts`, text: null, rows }],
    field: field.realCount,
    houseActive: field.useHouse,
    headline: `${fmtNum(field.poolSize)} votes in`,
  };
}

// ── HERD: ten calls, each a split the player was reading ───────────────────
function herdGroups(puzzle, pool, mine) {
  const { contexts, useHouse, realCount } = scoreHerdField(puzzle, pool, { houseCutoff: HERD_CUTOFF });
  const answers = (mine.answers || []).map(Number);
  let points = 0;
  const groups = puzzle.prompts.map((pr, i) => {
    const ctx = contexts[i];
    const you = answers[i];
    const pts = ctx.ptsFor(you);
    points += pts;
    const v = ctx.viewFor(you);
    const tot = v.counts.reduce((a, b) => a + b, 0) || 1;
    const herd = new Set(v.herd);
    const rows = pr.options.map((opt, oi) => ({
      label: opt, pct: pctOf(v.counts[oi], tot), you: you === oi,
      tag: you === oi ? 'you' : (herd.has(oi) ? 'herd' : null),
    }));
    return { q: pr.q, note: pts ? 'With the herd' : 'Off the herd', text: null, rows };
  });
  return { groups, field: realCount, houseActive: useHouse, headline: `${points} of ${puzzle.prompts.length} with the herd` };
}

// ── OUTWIT: five prompts, each a distribution the player was aiming at ───────
function outwitGroups(puzzle, pool, mine) {
  const { contexts, useHouse, realCount } = scoreOutwitField(puzzle, pool, { houseCutoff: OUTWIT_CUTOFF });
  const answers = (mine.answers || []).map(Number);
  let points = 0;
  const groups = puzzle.prompts.map((pr, i) => {
    const ctx = contexts[i].ctx;
    const you = answers[i];
    const pts = ctx.ptsFor(you);
    points += pts;
    const base = { q: pr.q, note: `+${pts} pts`, text: null, rows: [] };

    // Numeric prompts have no options to list, so they collapse to one line:
    // where the crowd landed and how close the player got.
    if (ctx.kind === 'num') {
      return {
        ...base,
        text: `Crowd target ${fmtNum(ctx.target)} (median ${fmtNum(ctx.med)}). You said ${fmtNum(you)}, closer than ${ctx.beatPctFor(you)}% of players.`,
      };
    }

    const options = ctx.options || pr.options || null;
    // The leave-one-out view the points were scored on (your vote removed).
    const view = ctx.viewFor ? ctx.viewFor(you) : null;
    const counts = (view && view.counts) || ctx.counts || [];
    // Legacy numeric "rare bird" days ship a min/max range instead of options,
    // so there is no bar list to show — just the winning number.
    if (!options) {
      return { ...base, text: `Rarest pick: ${fmtNum(ctx.winner)}. You said ${fmtNum(you)}.` };
    }
    const tot = counts.reduce((a, b) => a + b, 0) || 1;
    const best = Math.max(...counts);
    // "Fewest / rarest" prompts are won by the rarest option SOMEONE picked, so
    // a zero-vote option never wins — same rule the game's own reveal uses.
    const picked = counts.filter((c) => c > 0);
    const rarest = picked.length ? Math.min(...picked) : 0;
    const winLabel = pr.type === 'least' ? 'fewest' : (pr.type === 'unique' ? 'rarest' : 'crowd');
    const rows = options.map((opt, oi) => {
      const isWin = view && view.winIdx != null ? oi === view.winIdx : ((pr.type === 'least' || pr.type === 'unique')
        ? (counts[oi] > 0 && counts[oi] === rarest)
        : (counts[oi] === best && best > 0));
      return {
        label: opt,
        pct: pctOf(counts[oi], tot),
        you: you === oi,
        tag: you === oi ? 'you' : (isWin ? winLabel : null),
      };
    });
    return { ...base, rows };
  });
  return {
    groups,
    field: realCount,
    houseActive: useHouse,
    headline: `${points} of ${puzzle.prompts.length * 2} points`,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = (searchParams.get('game') || '').trim();
    const anonId = (searchParams.get('anonId') || '').trim().slice(0, 64) || null;
    const email = (searchParams.get('email') || '').trim() || null;

    const cfg = GAMES[game];
    if (!cfg) return NextResponse.json({ error: 'unknown game' }, { status: 400 });

    const puzzle = todaysPuzzle(cfg.puzzles);
    if (!puzzle) return NextResponse.json({ ok: true, game, played: false });

    // No identity at all = definitely not played. Answer before touching the
    // pool so an anonymous viewer can never pull today's answers out of here.
    if (!anonId && !email) return NextResponse.json({ ok: true, game, played: false });

    const rows = await loadRows(cfg.table, puzzle.quizId);

    let ident = null;
    try { ident = await findQuizIdentity(supabaseAdmin, { email, anonId }); } catch (e) { /* best-effort */ }
    const myUserId = ident && ident.id ? ident.id : null;
    let anonSet = anonId ? [anonId] : [];
    try { anonSet = await resolveAnonSet(supabaseAdmin, { anonId, email }); } catch (e) { /* fall back */ }

    const { byUser, byAnon } = await resolveOwners(rows);
    const { pool, mine } = buildPool(rows, { byUser, byAnon }, anonSet, myUserId);

    // THE GATE: no stored ballot for this account today = no crowd data, full
    // stop. Nothing about the tallies is included in this response.
    if (!mine) return NextResponse.json({ ok: true, game, played: false });

    const built = game === 'feud' ? feudGroups(puzzle, pool, mine)
      : game === 'herd' ? herdGroups(puzzle, pool, mine)
      : game === 'outrank' ? outrankGroups(puzzle, pool, mine)
        : outwitGroups(puzzle, pool, mine);
    if (!built) return NextResponse.json({ ok: true, game, played: false });

    return NextResponse.json({
      ok: true,
      game,
      quizId: puzzle.quizId,
      dateLabel: puzzle.dateLabel || null,
      played: true,
      field: built.field,
      houseActive: built.houseActive,
      headline: built.headline,
      groups: built.groups,
    });
  } catch (e) {
    console.error('crowd-today error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
