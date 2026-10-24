import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity, resolveAnonSet } from '@/lib/quiz-identity';
import { PUZZLES } from '@/app/aorb/puzzles';
import { scoreAorbField, cleanAorbBallot as cleanBallot, rankAorb, postedScore, HOUSE_CUTOFF } from '@/lib/aorb-score';

// /api/aorb  { quizId, answers:[10 x [me, call]], anonId, email? }       (POST, submit)
//            { quizId, peek:{ i, me, call }, answers?:[earlier pairs] }   (POST, one reveal)
//            ?quizId=..&anonId=..&email=..                            (GET)
//
// Scores one Aorb ballot, and the whole field, against the day's pool. Same
// adaptive contract as /api/herd: nothing is ever final, every request
// recomputes every score from all ballots (lib/aorb-score.js has the rule).
//
// PEEK: Aorb reveals each pair as it is answered (owner, 2026-10-23), so the
// client asks for ONE pair's split the moment both picks are in. A peek stores
// nothing and returns only that pair, scored against the pool as it stands with
// the requester's own picks counted in. The full ballot is stored once, on
// submit, and the finished screen is re-scored from it.
//
// IDENTITY: one ballot per account (earliest wins), like Herd. A returning
// player is graded on their stored ballot; GET works for any live day, which is
// how the next visit shows the PREVIOUS day's settled result before play.
//
// STORAGE: no table of its own. Ballots go in `outwit_picks` (one row per
// (quiz_id, anon_id), inserted once) under quiz ids aorb-M-D-YY, answers as ten
// [me, call] pairs. Every reader of that table filters by quiz_id.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

async function loadRows(quizId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('outwit_picks')
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

function buildAorb({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted, currentAnon, nameByUser, infoByAnon }) {
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
  const clean = alreadyPlayed ? cleanBallot(storedRow.answers, puzzle) : (submitted ? cleanBallot(submitted, puzzle) : null);
  if (!clean) return { played: false, alreadyPlayed: false, clean: null, payload: null };
  if (!alreadyPlayed) {
    poolPlayers.push({ anonId: currentAnon || null, userId: myUserId, answers: clean, created: '9999', isYou: true, ownerId: myUserId, ownerName: myName });
  }

  const { contexts, detailFor, useHouse, realCount, poolSize, early } = scoreAorbField(puzzle, poolPlayers, { houseCutoff: HOUSE_CUTOFF });
  const mine = detailFor({ answers: clean });

  // The reveal: each pair in the requester's leave-one-out view, so the
  // percentages always agree with the points beside them.
  const prompts = puzzle.prompts.map((pr, i) => {
    const r = mine.per[i];
    return { q: pr.q, options: pr.options, me: clean[i][0], call: clean[i][1], read: r.read, bonus: r.bonus, ...r.view };
  });

  const named = [];
  for (const p of poolPlayers) {
    const name = (p.isYou && myName) || p.ownerName || null;
    if (!name) continue;
    const d = p.isYou ? mine : detailFor(p);
    named.push({ name, total: d.total, readRaw: d.readRaw, created: p.created, isYou: p.isYou });
  }
  const ranked = rankAorb(named).map((e, i) => ({ ...e, rank: i + 1 }));
  const youEntry = ranked.find((e) => e.isYou) || null;
  const board = {
    field: realCount,
    registered: ranked.length,
    houseActive: useHouse,
    top: ranked.slice(0, 25).map((e) => ({ rank: e.rank, name: e.name, total: e.total, you: e.isYou })),
    you: youEntry ? { rank: youEntry.rank, total: youEntry.total } : null,
    youTotal: mine.total,
    youRegistered: !!youEntry,
    beat: youEntry && ranked.length > 1 ? Math.round(((ranked.length - youEntry.rank) / (ranked.length - 1)) * 100) : null,
  };
  const payload = {
    quizId, played: true, replay: alreadyPlayed,
    read: mine.read, bonus: mine.bonus, total: mine.total, posted: postedScore(mine.total),
    poolSize, realCount, houseActive: useHouse, early, answers: clean, prompts, board,
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
    if (body.peek && typeof body.peek === 'object') return peek(puzzle, quizId, body.peek);
    const submitted = answers ? cleanBallot(answers, puzzle) : null;
    if (!submitted) return NextResponse.json({ error: 'ballot invalid' }, { status: 400 });

    const rows = await loadRows(quizId);
    const [{ nameByUser, infoByAnon }, { myUserId, myName, anonSet }] = await Promise.all([
      resolveNames(rows),
      resolveViewer({ anonId, email }),
    ]);

    const res = buildAorb({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted, currentAnon: anonId, nameByUser, infoByAnon });
    if (!res.played) return NextResponse.json({ error: 'ballot invalid' }, { status: 400 });

    if (anonId && !res.alreadyPlayed) {
      try {
        await supabaseAdmin
          .from('outwit_picks')
          .upsert({ quiz_id: quizId, anon_id: anonId, user_id: myUserId, answers: res.clean }, { onConflict: 'quiz_id,anon_id', ignoreDuplicates: true });
      } catch (e) { /* table missing — scoring still returned */ }
    }

    return NextResponse.json({ ok: true, ...res.payload });
  } catch (e) {
    console.error('aorb POST error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// One pair's split for the reveal shown the moment both picks are in. Stores
// nothing. The requester's own picks are counted into the pool (as a 1-player
// add) and then taken out again by the leave-one-out view, exactly as the
// stored ballot will be scored on submit.
async function peek(puzzle, quizId, pk) {
  const i = Number(pk.i);
  const me = Number(pk.me), call = Number(pk.call);
  if (!Number.isInteger(i) || i < 0 || i >= puzzle.prompts.length) return NextResponse.json({ error: 'bad pair' }, { status: 400 });
  if (!(me === 0 || me === 1) || !(call === 0 || call === 1)) return NextResponse.json({ error: 'bad picks' }, { status: 400 });
  const rows = await loadRows(quizId);
  const players = rows.filter((r) => Array.isArray(r.answers)).map((r) => ({ answers: r.answers }));
  const ballot = puzzle.prompts.map((_, k) => (k === i ? [me, call] : [null, null]));
  players.push({ answers: ballot });
  const { contexts, useHouse, realCount, early } = scoreAorbField(puzzle, players, { houseCutoff: HOUSE_CUTOFF });
  const r = contexts[i].forPair(me, call);
  return NextResponse.json({ ok: true, i, me, call, read: r.read, bonus: r.bonus, ...r.view, field: realCount, houseActive: useHouse, early });
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

    const res = buildAorb({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted: null, currentAnon: anonId, nameByUser, infoByAnon });
    if (!res.played) return NextResponse.json({ ok: true, played: false });

    return NextResponse.json({ ok: true, ...res.payload });
  } catch (e) {
    console.error('aorb GET error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
