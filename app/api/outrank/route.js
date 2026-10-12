import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity, resolveAnonSet } from '@/lib/quiz-identity';
import { PUZZLES } from '@/app/outrank/puzzles';
import { scoreOutrankField, validBallot, HOUSE_CUTOFF } from '@/lib/outrank-score';

// /api/outrank  { quizId, answers:[fav, r1..rN], anonId, email? }  (POST)
//               ?quizId=..&anonId=..&email=..                       (GET)
//
// Scores one Outrank ballot — and the whole field — against the day's pool.
// Same adaptive contract as /api/outwit (see that route's header): nothing is
// ever final. The crowd order is a pure function of ALL favorite votes in the
// pool as they stand RIGHT NOW, recomputed from scratch on every request, so
// every new player re-scores everybody. The client re-asks this route on a
// timer while the result is on screen.
//
// LEAVE-ONE-OUT: every player's prediction is graded against the crowd MINUS
// their own favorite vote, so their own ballot never shifts the order they are
// being scored on (see lib/outrank-score.js).
//
// POOL RULE: the pre-written 40-vote house crowd (server-only, in
// app/outrank/puzzles.js) is in the pool ONLY while at most HOUSE_CUTOFF real
// players have locked in; from the 11th real player on, the pool is real votes
// only, for EVERYONE. Pool-wide flag, never per-viewer.
//
// IDENTITY (2026-07-21): "already played" and the live standings are resolved by
// ACCOUNT, not by the single browser's anon_id. Each stored pick's anon_id is
// resolved to its owning quiz_users id THE SAME WAY the combined board does
// (lib .../daily-combined scoreOutrankLive: quiz_users.anon_id -> {username,id}),
// so an unattributed pick (user_id null) still resolves to its account, the live
// board matches the combined board exactly, and the viewer is recognized on any
// device signed into the same account. A returning player is graded on their
// canonical stored ballot and never inserted twice, so their favorite can't be
// double-counted; the board is deduped to one row per account.
//
// Ballots are stored in `outrank_picks` (migration 36), one row per (quiz_id,
// anon_id) — inserted once on first play and never re-inserted. If the table
// doesn't exist yet, the game still works: pool = house crowd only and the
// live board is empty.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

async function loadRows(quizId) {
  // Every real ballot so far. Table may not exist yet (migration 36 not run) —
  // the game degrades gracefully to the house pool alone, empty board.
  try {
    const { data, error } = await supabaseAdmin
      .from('outrank_picks')
      .select('id, anon_id, user_id, answers, created_at')
      .eq('quiz_id', quizId)
      .limit(20000);
    if (!error && Array.isArray(data)) return data;
  } catch (e) { /* table missing — house pool only */ }
  return [];
}

// Resolve display names + owning user ids for every stored pick, EXACTLY like the
// combined board's scoreOutrankLive: a pick's anon_id maps to its account via
// quiz_users.anon_id even when the pick row itself carries no user_id. This is
// what lets an unattributed pick still resolve to (and rank as) its owner.
async function resolveNames(rows) {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const anonIds = [...new Set(rows.map((r) => r.anon_id).filter(Boolean))];
  const nameByUser = new Map();       // userId -> username
  const infoByAnon = new Map();       // anon_id -> { username, id }
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

// The owning user id + display name for one pick, resolving an unattributed row
// through its anon. Mirrors scoreOutrankLive.
function ownerOf(p, nameByUser, infoByAnon) {
  const info = p.anonId ? infoByAnon.get(p.anonId) : null;
  const userId = p.userId || (info && info.id) || null;
  const name = (p.userId && nameByUser.get(p.userId)) || (info && info.username) || null;
  return { userId, name };
}

// Grade one requester (by account) against the current field and build the live
// board. `submitted` is the ballot the client sent (POST) or null (GET). Returns
// { played, alreadyPlayed, clean, payload }. When the account hasn't played and
// nothing was submitted, returns { played: false }.
function buildOutrank({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted, currentAnon, nameByUser, infoByAnon }) {
  const K = puzzle.items.length;
  const anonHit = new Set(anonSet || []);

  const players = rows
    .filter((r) => Array.isArray(r.answers))
    .map((r) => {
      const p = { anonId: r.anon_id, userId: r.user_id, answers: r.answers, created: r.created_at || '' };
      const owner = ownerOf(p, nameByUser, infoByAnon);
      // "You" = the pick resolves to my account (by resolved owner id) OR its
      // browser anon is one of my account's anons. The resolved-owner check is
      // what fixes an unattributed pick (user_id null) made on my other device.
      p.ownerId = owner.userId;
      p.ownerName = owner.name;
      p.isYou = (!!myUserId && owner.userId === myUserId) || (!!r.anon_id && anonHit.has(r.anon_id));
      return p;
    });

  // ONE BALLOT PER ACCOUNT. A player who locked in on two devices under the same
  // name leaves two rows; count only their earliest so their favorite is a single
  // crowd vote, never double-weighted. Guests (no resolved owner) each stay
  // distinct. This dedup feeds BOTH the crowd pool and the live board, so realCount
  // and the standings reflect distinct players, not raw ballots.
  const byOwner = new Set();
  const poolPlayers = [];
  for (const p of [...players].sort((a, b) => String(a.created).localeCompare(String(b.created)))) {
    if (p.ownerId) {
      if (byOwner.has(p.ownerId)) continue; // keep the earliest row for this account
      byOwner.add(p.ownerId);
    }
    poolPlayers.push(p);
  }

  // The account's canonical stored ballot for today = the EARLIEST row that
  // belongs to this account (grade this on every device so scores never differ).
  const storedRow = poolPlayers.find((p) => p.isYou) || null;
  const alreadyPlayed = !!storedRow;

  const clean = alreadyPlayed
    ? storedRow.answers.map(Number)
    : (submitted ? submitted.map(Number) : null);
  if (!clean) return { played: false, alreadyPlayed: false, clean: null, payload: null };

  // A brand-new ballot gets a synthetic "you" row so it joins the crowd + board.
  // A returning ballot is already in `poolPlayers` (the stored row), so don't add it.
  if (!alreadyPlayed) {
    poolPlayers.push({ anonId: currentAnon || null, userId: myUserId, answers: clean, created: '9999', isYou: true, ownerId: myUserId, ownerName: myName });
  }

  const field = scoreOutrankField(puzzle, poolPlayers, { houseCutoff: HOUSE_CUTOFF });
  const { counts, poolSize, detailFor, totalFor, useHouse, realCount } = field;

  const mine = detailFor(clean);
  const points = mine.total;
  // The reveal prints the counts the order was SORTED on (the crowd minus this
  // player's own vote), never the full pool, or the percentages contradict the
  // ranks whenever your vote decided a slot.
  const graded = mine.counts || counts;
  const gradedVotes = graded.reduce((a, b) => a + b, 0);
  const totalVotes = gradedVotes || 1;
  const yourFav = clean[0];
  const predicted = clean.slice(1);
  const predictedPos = new Array(K).fill(-1);
  predicted.forEach((item, pos) => { predictedPos[item] = pos; });
  // Reveal rows in the ACTUAL crowd order (leave-one-out view for this player,
  // so the reveal always agrees with their per-slot points).
  const reveal = mine.actual.map((item, pos) => ({
    item: puzzle.items[item],
    idx: item,
    rank: pos + 1,
    yourRank: predictedPos[item] + 1,
    votes: graded[item],
    pct: Math.round((graded[item] / totalVotes) * 100),
    tied: (pos > 0 && graded[mine.actual[pos - 1]] === graded[item]) || (pos < K - 1 && graded[mine.actual[pos + 1]] === graded[item]),
    yourFav: item === yourFav,
    pts: mine.pts[predictedPos[item]] ?? 0,
  }));
  const slotPts = mine.pts;

  // LIVE STANDINGS — registered players only, from the same deduped field as the
  // pool (already one row per account), so it can never disagree with the
  // combined board. Guests (no resolved name) rank out but still fed the pool.
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
  };

  const payload = {
    quizId,
    played: true,
    replay: alreadyPlayed,
    points,
    total: K * 2,
    poolSize,
    realCount,
    houseActive: useHouse,
    answers: clean,
    yourFav,
    gradedVotes,
    favPct: Math.round((graded[yourFav] / totalVotes) * 100),
    reveal,
    slotPts,
    board,
  };
  return { played: true, alreadyPlayed, clean, payload };
}

// Resolve the viewer's identity + the account's full anon set. Shared by POST/GET.
async function resolveViewer({ anonId, email }) {
  let ident = null;
  try { ident = await findQuizIdentity(supabaseAdmin, { email, anonId }); } catch (e) { /* best-effort */ }
  const myUserId = ident && ident.id ? ident.id : null;
  const myName = ident && ident.username ? ident.username : null;

  let anonSet = anonId ? [anonId] : [];
  try { anonSet = await resolveAnonSet(supabaseAdmin, { anonId, email }); } catch (e) { /* fall back to current anon */ }

  return { myUserId, myName, anonSet };
}

export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const anonId = typeof body.anonId === 'string' && body.anonId.trim() ? body.anonId.trim().slice(0, 64) : null;
    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : null;
    const answers = Array.isArray(body.answers) ? body.answers.map(Number) : null;

    const puzzle = PUZZLES.find((p) => p.quizId === quizId);
    if (!puzzle) return NextResponse.json({ error: 'unknown quizId' }, { status: 400 });
    if (puzzle.live > etTodayServer()) return NextResponse.json({ error: 'not live yet' }, { status: 400 });
    const K = puzzle.items.length;
    if (!answers || !validBallot(answers, K)) {
      return NextResponse.json({ error: 'ballot invalid' }, { status: 400 });
    }
    const submitted = answers.map(Number);

    const rows = await loadRows(quizId);
    const [{ nameByUser, infoByAnon }, { myUserId, myName, anonSet }] = await Promise.all([
      resolveNames(rows),
      resolveViewer({ anonId, email }),
    ]);

    const res = buildOutrank({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted, currentAnon: anonId, nameByUser, infoByAnon });

    // Record the ballot exactly once per ACCOUNT (first play only; replays from
    // any device never insert). onConflict keeps the one-row-per-browser guard.
    if (anonId && !res.alreadyPlayed) {
      try {
        await supabaseAdmin
          .from('outrank_picks')
          .upsert({ quiz_id: quizId, anon_id: anonId, user_id: myUserId, answers: res.clean }, { onConflict: 'quiz_id,anon_id', ignoreDuplicates: true });
      } catch (e) { /* table missing — scoring still returned */ }
    }

    return NextResponse.json({ ok: true, ...res.payload });
  } catch (e) {
    console.error('outrank POST error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// GET — has this account already played today? If so, return the same graded
// payload as POST (so a fresh device can hydrate straight to the finished
// result + live board). Never inserts anything.
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

    const res = buildOutrank({ puzzle, quizId, rows, anonSet, myUserId, myName, submitted: null, currentAnon: anonId, nameByUser, infoByAnon });
    if (!res.played) return NextResponse.json({ ok: true, played: false });

    return NextResponse.json({ ok: true, ...res.payload });
  } catch (e) {
    console.error('outrank GET error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
