import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity, resolveAnonSet } from '@/lib/quiz-identity';
import { PUZZLES } from '@/app/feud/puzzles';
import { scoreFeudField, cleanBallot, HOUSE_CUTOFF } from '@/lib/feud-score';
import { roomReadFrom } from '@/lib/read-room';

// /api/feud  { quizId, answers:[[a1..a3] per prompt], anonId, email? }  (POST)
//            ?quizId=..&anonId=..&email=..                              (GET)
//
// Scores one Feud ballot — and the whole field — against the day's pool. Same
// adaptive contract as /api/outwit and /api/outrank: nothing is ever final.
// The answer key IS the live tally of what today's players say, recomputed
// from scratch on every request, so every new player re-scores everybody. The
// client re-asks this route on a timer while the result is on screen.
//
// LEAVE-ONE-OUT: every player is graded against the crowd MINUS their own
// answers, so an answer nobody else gives pays zero and a ballot never tips
// the tally it is scored on (see lib/feud-score.js).
//
// POOL RULE: the pre-written house pool (server-only, in app/feud/puzzles.js)
// is in the pool ONLY while at most HOUSE_CUTOFF real players have locked in;
// from the 11th real player on, the pool is real answers only, for EVERYONE.
//
// IDENTITY: same account resolution as /api/outrank — "already played" and the
// live standings are resolved by ACCOUNT, not by the single browser's anon_id,
// picks dedup to one ballot per account, and a returning player is graded on
// their canonical stored ballot on every device.
//
// Ballots are stored in `feud_picks` (migration 43), one row per (quiz_id,
// anon_id) — inserted once on first play and never re-inserted. If the table
// doesn't exist yet, the game still works: pool = house only, board empty.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

async function loadRows(quizId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('feud_picks')
      .select('id, anon_id, user_id, answers, created_at')
      .eq('quiz_id', quizId)
      .limit(20000);
    if (!error && Array.isArray(data)) return data;
  } catch (e) { /* table missing — house pool only */ }
  return [];
}

// Resolve display names + owning user ids for every stored pick, exactly like
// /api/outrank (see that route's header for why the anon_id path matters).
async function resolveNames(rows) {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const anonIds = [...new Set(rows.map((r) => r.anon_id).filter(Boolean))];
  const nameByUser = new Map();
  const infoByAnon = new Map();
  try {
    if (userIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('id', userIds);
      for (const u of data || []) if (u.username) { nameByUser.set(u.id, u.username); if (u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id }); }
    }
    if (anonIds.length) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, anon_id').in('anon_id', anonIds);
      for (const u of data || []) if (u.username && u.anon_id) infoByAnon.set(u.anon_id, { username: u.username, id: u.id });
    }
  } catch (e) { /* no names — board comes back empty, pool still scores */ }
  return { nameByUser, infoByAnon };
}

function ownerOf(p, nameByUser, infoByAnon) {
  const info = p.anonId ? infoByAnon.get(p.anonId) : null;
  const userId = p.userId || (info && info.id) || null;
  const name = (p.userId && nameByUser.get(p.userId)) || (info && info.username) || null;
  return { userId, name };
}

// Grade one requester (by account) against the current field and build the
// live board. Mirrors /api/outrank's buildOutrank.
function buildFeud({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted, currentAnon, nameByUser, infoByAnon }) {
  const P = puzzle.prompts.length;
  const TOTAL = P * 100;
  const anonHit = new Set(anonSet || []);

  const players = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => {
      const p = { anonId: r.anon_id, userId: r.user_id, answers: r.answers, created: r.created_at || '' };
      const owner = ownerOf(p, nameByUser, infoByAnon);
      p.ownerId = owner.userId;
      p.ownerName = owner.name;
      p.isYou = (!!myUserId && owner.userId === myUserId) || (!!r.anon_id && anonHit.has(r.anon_id));
      return p;
    });

  // ONE BALLOT PER ACCOUNT (earliest row wins), guests each stay distinct.
  const byOwner = new Set();
  const poolPlayers = [];
  for (const p of [...players].sort((a, b) => String(a.created).localeCompare(String(b.created)))) {
    if (p.ownerId) {
      if (byOwner.has(p.ownerId)) continue;
      byOwner.add(p.ownerId);
    }
    poolPlayers.push(p);
  }

  const storedRow = poolPlayers.find((p) => p.isYou) || null;
  const alreadyPlayed = !!storedRow;

  const clean = alreadyPlayed
    ? cleanBallot(storedRow.answers, puzzle)
    : (submitted ? cleanBallot(submitted, puzzle) : null);
  if (!clean) return { played: false, alreadyPlayed: false, clean: null, payload: null };

  if (!alreadyPlayed) {
    poolPlayers.push({ anonId: currentAnon || null, userId: myUserId, answers: clean, created: '9999', isYou: true, ownerId: myUserId, ownerName: myName });
  }

  const field = scoreFeudField(puzzle, poolPlayers, { houseCutoff: HOUSE_CUTOFF });
  const { detailFor, totalFor, useHouse, realCount } = field;

  const mine = detailFor(clean);
  const points = mine.total;

  // The reveal: one board per prompt, in the requester's leave-one-out view so
  // the percentages always agree with their per-answer points.
  const reveal = puzzle.prompts.map((pr, p) => ({
    q: pr.q,
    pts: mine.perPrompt[p].pts,
    answersIn: mine.perPrompt[p].answersIn,
    board: mine.perPrompt[p].board,
    missed: mine.perPrompt[p].missed,
    yours: mine.perPrompt[p].perAnswer,
  }));

  // LIVE STANDINGS — registered players only, deduped, exactly like Outrank.
  const named = [];
  for (const p of poolPlayers) {
    const name = (p.isYou && myName) || p.ownerName || null;
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
    // Read the Room (lib/read-room.js): where you stand among the named
    // players, a guest placed as if registered.
    read: roomReadFrom(ranked, youEntry, points),
  };

  const payload = {
    quizId,
    played: true,
    replay: alreadyPlayed,
    points,
    total: TOTAL,
    pctCrowd: Math.round(points / P),
    onBoard: mine.onBoard,
    realCount,
    houseActive: useHouse,
    answers: clean,
    reveal,
    board,
  };
  return { played: true, alreadyPlayed, clean, payload };
}

async function resolveViewer({ anonId, email }) {
  let ident = null;
  try { ident = await findQuizIdentity(supabaseAdmin, { email, anonId }); } catch (e) { /* best-effort */ }
  const myUserId = ident && ident.id ? ident.id : null;
  const myName = ident && ident.username ? ident.username : null;

  let anonSet = anonId ? [anonId] : [];
  try { anonSet = await resolveAnonSet(supabaseAdmin, { anonId, email }); } catch (e) { /* fall back */ }

  return { myUserId, myName, anonSet };
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
    const submitted = answers ? cleanBallot(answers, puzzle) : null;
    if (!submitted) return NextResponse.json({ error: 'ballot invalid' }, { status: 400 });

    const rows = await loadRows(quizId);
    const [{ nameByUser, infoByAnon }, { myUserId, myName, anonSet }] = await Promise.all([
      resolveNames(rows),
      resolveViewer({ anonId, email }),
    ]);

    const res = buildFeud({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted, currentAnon: anonId, nameByUser, infoByAnon });
    if (!res.played) return NextResponse.json({ error: 'ballot invalid' }, { status: 400 });

    if (anonId && !res.alreadyPlayed) {
      try {
        await supabaseAdmin
          .from('feud_picks')
          .upsert({ quiz_id: quizId, anon_id: anonId, user_id: myUserId, answers: res.clean }, { onConflict: 'quiz_id,anon_id', ignoreDuplicates: true });
      } catch (e) { /* table missing — scoring still returned */ }
    }

    return NextResponse.json({ ok: true, ...res.payload });
  } catch (e) {
    console.error('feud POST error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// GET — has this account already played today? If so, return the same graded
// payload as POST so a fresh device hydrates straight to the finished result.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = (searchParams.get('quizId') || '').trim();
    const anonId = (searchParams.get('anonId') || '').trim().slice(0, 64) || null;
    const email = (searchParams.get('email') || '').trim() || null;

    const puzzle = PUZZLES.find((p) => p.quizId === quizId);
    if (!puzzle) return NextResponse.json({ error: 'unknown quizId' }, { status: 400 });

    const rows = await loadRows(quizId);
    const [{ nameByUser, infoByAnon }, { myUserId, myName, anonSet }] = await Promise.all([
      resolveNames(rows),
      resolveViewer({ anonId, email }),
    ]);

    const res = buildFeud({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted: null, currentAnon: anonId, nameByUser, infoByAnon });
    if (!res.played) return NextResponse.json({ ok: true, played: false });

    return NextResponse.json({ ok: true, ...res.payload });
  } catch (e) {
    console.error('feud GET error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
