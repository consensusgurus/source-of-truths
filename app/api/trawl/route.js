import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { PUZZLES } from '@/app/trawl/puzzles';
import { trawlRank } from '@/lib/trawl';

// /api/trawl: the crowd behind Trawl, the enormous daily word search.
//
// GET  ?quizId=trawl-M-D-YY
//   The day's crowd, the same for everyone, cached at the edge for a minute:
//   how many players have found each entry (`counts`, in list order), the
//   standings (unique finds first, total finds second; owner, 2026-11-20), and
//   every player's [unique, total] so a browser can place itself.
//
// POST { quizId, anonId, email?, found: [entry index...], force? }
//   Merges this player's finds into their row and answers with the merged list
//   and the player's public id (so the page can pick itself out of the
//   standings). Only the live day takes finds; an archive board is read-only.
//   The running total is filed as a daily result (quiz_results) when it has
//   grown and ten minutes have passed since the last one, or when the page
//   forces it on leaving, exactly as Mural files its points (migration 70).
//
// STORAGE: no table of its own. One row per player per day in `outwit_picks`
// (unique on quiz_id, anon_id) under quiz ids trawl-M-D-YY, as Poll does. The
// anon_id column holds the PLAYER key, u:<user id> for an account (so two
// devices merge) or a:<anon id> for a guest; answers is { f: [indices], t0 }.
// Every reader of that table filters by quiz_id, so the games never mix.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const EDGE = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' };
const BY_QUIZ = new Map(PUZZLES.map((p) => [p.quizId, p]));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const str = (v, n = 120) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const pub = (key) => createHash('sha256').update('trawl|' + key).digest('base64url').slice(0, 10);

async function loadRows(quizId) {
  const out = [];
  for (let from = 0; from < 40000; from += 1000) {
    const { data, error } = await supabaseAdmin.from('outwit_picks')
      .select('anon_id, user_id, answers').eq('quiz_id', quizId).range(from, from + 999);
    if (error || !Array.isArray(data)) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

function foundOf(row, N) {
  const a = row && row.answers;
  const f = a && Array.isArray(a.f) ? a.f : [];
  const s = new Set();
  for (const i of f) if (Number.isInteger(i) && i >= 0 && i < N) s.add(i);
  return s;
}

async function crowd(p) {
  const N = p.items.length;
  const rows = await loadRows(p.quizId);
  const counts = new Array(N).fill(0);
  const sets = rows.map((r) => ({ r, s: foundOf(r, N) })).filter((x) => x.s.size > 0);
  for (const { s } of sets) for (const i of s) counts[i]++;
  const userIds = [...new Set(sets.map((x) => x.r.user_id).filter(Boolean))];
  const names = new Map();
  for (let k = 0; k < userIds.length; k += 200) {
    try {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username').in('id', userIds.slice(k, k + 200));
      for (const u of data || []) if (u.username) names.set(u.id, u.username);
    } catch (e) { /* no names: guests' labels */ }
  }
  const players = sets.map(({ r, s }) => {
    let unique = 0;
    for (const i of s) if (counts[i] === 1) unique++;
    const id = pub(r.anon_id);
    const name = (r.user_id && names.get(r.user_id)) || `Guest ${id.slice(0, 4).toUpperCase()}`;
    return { id, name, guest: !names.get(r.user_id), unique, total: s.size };
  }).sort((a, b) => trawlRank(a, b) || a.name.localeCompare(b.name));
  let place = 0;
  players.forEach((pl, i) => { if (i === 0 || trawlRank(players[i - 1], pl) !== 0) place = i + 1; pl.place = place; });
  return {
    quizId: p.quizId, at: Date.now(), live: p.live === etToday(), N,
    players: players.length,
    counts,
    standings: players.slice(0, 100),
    field: players.map((pl) => [pl.unique, pl.total]),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const p = BY_QUIZ.get(str(searchParams.get('quizId'), 40));
  if (!p || p.live > etToday()) return NextResponse.json({ error: 'No board' }, { status: 404, headers: NO_STORE });
  try {
    return NextResponse.json(await crowd(p), { headers: EDGE });
  } catch (e) {
    return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
  }
}

async function playerOf({ anonId, email }) {
  const anon = typeof anonId === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(anonId) ? anonId : null;
  let user = null;
  try { user = await findQuizIdentity(supabaseAdmin, { email, anonId: anon }); } catch (e) { user = null; }
  if (user && user.id && user.username) return { key: `u:${user.id}`, userId: user.id, name: user.username, anon };
  if (!anon) return null;
  return { key: `a:${anon}`, userId: null, name: null, anon };
}

async function fileResult(p, who, total, t0, force) {
  if (!total) return;
  let last = null;
  try {
    let q = supabaseAdmin.from('quiz_results').select('score, created_at').eq('quiz_id', p.quizId).order('id', { ascending: false }).limit(1);
    q = who.userId ? q.eq('user_id', who.userId) : q.is('user_id', null).eq('anon_id', who.anon);
    const { data } = await q;
    last = data && data[0];
  } catch (e) { last = null; }
  const stale = !last || Date.parse(last.created_at) < Date.now() - 10 * 60 * 1000;
  if (last && !(total > Number(last.score) && (force || stale))) return;
  const secs = Math.max(1, Math.min(36000, Math.round((Date.now() - (Number(t0) || Date.now())) / 1000)));
  try {
    await supabaseAdmin.from('quiz_results').insert({
      quiz_id: p.quizId, user_id: who.userId, username: who.name, score: total, total: p.items.length,
      time_elapsed: secs, anon_id: who.anon, correct_count: 1, guesses_used: 0, abandoned: false,
    });
  } catch (e) { /* the next sync files it */ }
}

export async function POST(request) {
  let body = null;
  try { body = JSON.parse(await request.text()); } catch (e) { body = null; }
  const p = body && BY_QUIZ.get(str(body.quizId, 40));
  if (!p) return NextResponse.json({ error: 'No board' }, { status: 400, headers: NO_STORE });
  const who = await playerOf({ anonId: str(body.anonId, 64), email: str(body.email) || null });
  if (!who) return NextResponse.json({ error: 'No player' }, { status: 400, headers: NO_STORE });
  const N = p.items.length;
  const { data: rows } = await supabaseAdmin.from('outwit_picks')
    .select('id, answers').eq('quiz_id', p.quizId).eq('anon_id', who.key).limit(1);
  const row = rows && rows[0];
  const have = foundOf(row, N);
  const t0 = (row && row.answers && Number(row.answers.t0)) || Date.now();
  if (p.live === etToday() && Array.isArray(body.found)) {
    const before = have.size;
    for (const i of body.found.slice(0, N)) if (Number.isInteger(i) && i >= 0 && i < N) have.add(i);
    if (have.size > before || !row) {
      const answers = { f: [...have].sort((a, b) => a - b), t0 };
      const res = row
        ? await supabaseAdmin.from('outwit_picks').update({ answers, user_id: who.userId }).eq('id', row.id)
        : await supabaseAdmin.from('outwit_picks').insert({ quiz_id: p.quizId, anon_id: who.key, user_id: who.userId, answers });
      if (res && res.error) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
    }
    await fileResult(p, who, have.size, t0, !!body.force);
  }
  return NextResponse.json({ me: pub(who.key), name: who.name, found: [...have].sort((a, b) => a - b) }, { headers: NO_STORE });
}
