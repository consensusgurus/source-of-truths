// CHALLENGE RETURN LEG, server half (owner, 2026-10-15). Tables: migration 60.
//
// Every route that uses this is fire-and-forget from the browser's point of
// view: a send, an open and a take are recorded so the SENDER can be told what
// happened, and nothing a player sees mid-game waits on them. So every helper
// here swallows its own errors (a missing table before migration 60 is applied,
// a network blip) and reports { ok: false } rather than throwing.
//
// NOTHING HERE SCORES. Leaderboards never read these rows; drawing tickets come
// from quiz_referrals only (lib/drawing-server.js).

import { findQuizIdentity } from '@/lib/quiz-identity';

export const CID_RE = /^[a-z0-9]{6,16}$/;

export const cleanCid = (v) => {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  return CID_RE.test(s) ? s : null;
};
// Browser ids are uuids (or the a_<time>_<rand> fallback). Anything else is
// refused, which also keeps the value safe inside a PostgREST or() filter.
export const cleanAnon = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^[A-Za-z0-9_-]{6,64}$/.test(s) ? s : null;
};
export const cleanKey = (v) => {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  return /^[a-z0-9-]{1,32}$/.test(s) ? s : null;
};
const cleanName = (v) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40) || null;

// The figures a result is compared on, and nothing else: score, total, clock,
// the game's own metric, solved, and a run's status line.
export function cleanFig(f) {
  if (!f || typeof f !== 'object') return null;
  const num = (v, max = 1e7) => { const n = Number(v); return Number.isFinite(n) && Math.abs(n) < max ? Math.round(n * 10) / 10 : null; };
  const out = {
    s: num(f.s),
    o: num(f.o),
    t: num(f.t, 86400 * 7),
    m: num(f.m),
    won: !!f.won,
  };
  if (typeof f.x === 'string' && f.x.trim()) out.x = f.x.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
  return out;
}

// Who is asking: the account when one resolves, and always the browser id.
export async function whoIs(admin, { anonId, email }) {
  const anon = cleanAnon(anonId);
  let user = null;
  if (anon || email) {
    try { user = await findQuizIdentity(admin, { email, anonId: anon }); } catch (e) { user = null; }
  }
  return { anon, userId: user && user.id ? user.id : null, username: user && user.username ? user.username : null };
}

export async function challengeByCid(admin, cid) {
  const { data, error } = await admin.from('quiz_challenges').select('*').eq('cid', cid).maybeSingle();
  if (error) throw error;
  return data || null;
}

export function sameAsSender(ch, who) {
  if (!ch || !who) return false;
  if (who.anon && ch.sender_anon && who.anon === ch.sender_anon) return true;
  if (who.userId && ch.sender_user_id && who.userId === ch.sender_user_id) return true;
  return false;
}

export async function recordSend(admin, body) {
  const cid = cleanCid(body.cid);
  const key = cleanKey(body.gameKey);
  if (!cid || !key) return { ok: false, error: 'bad request' };
  const who = await whoIs(admin, body);
  const row = {
    cid,
    game_key: key,
    num: Number.isFinite(Number(body.num)) ? Math.round(Number(body.num)) : null,
    day: typeof body.day === 'string' ? body.day.replace(/[^0-9-]/g, '').slice(0, 10) || null : null,
    sender_user_id: who.userId,
    sender_anon: who.anon,
    sender_name: who.username || cleanName(body.name),
    fig: cleanFig(body.fig),
    source: typeof body.source === 'string' ? body.source.slice(0, 16) : null,
  };
  const { error } = await admin.from('quiz_challenges').upsert(row, { onConflict: 'cid', ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function recordOpen(admin, body) {
  const cid = cleanCid(body.cid);
  const anon = cleanAnon(body.anonId);
  if (!cid || !anon) return { ok: false, error: 'bad request' };
  const ch = await challengeByCid(admin, cid);
  if (!ch) return { ok: false, error: 'unknown challenge' };
  const who = await whoIs(admin, body);
  if (sameAsSender(ch, who)) return { ok: true, self: true };
  const { error } = await admin.from('quiz_challenge_takes').upsert({
    challenge_id: ch.id,
    taker_anon: anon,
    taker_user_id: who.userId,
    taker_name: who.username,
  }, { onConflict: 'challenge_id,taker_anon', ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Was this person playing here before they opened the link? A play on record
// before the open means they were already a player; none means the link brought
// them in.
async function playedBefore(admin, { anon, userId }, at) {
  try {
    const q = admin.from('quiz_results').select('id').lt('created_at', at).limit(1);
    const { data } = userId ? await q.or(`anon_id.eq.${anon},user_id.eq.${userId}`) : await q.eq('anon_id', anon);
    return Array.isArray(data) && data.length > 0;
  } catch (e) { return null; }
}

export async function recordTake(admin, body) {
  const cid = cleanCid(body.cid);
  const anon = cleanAnon(body.anonId);
  if (!cid || !anon) return { ok: false, error: 'bad request' };
  const ch = await challengeByCid(admin, cid);
  if (!ch) return { ok: false, error: 'unknown challenge' };
  const who = await whoIs(admin, body);
  if (sameAsSender(ch, who)) return { ok: true, self: true };

  const { data: existing } = await admin.from('quiz_challenge_takes')
    .select('id, opened_at, finished_at').eq('challenge_id', ch.id).eq('taker_anon', anon).maybeSingle();
  if (existing && existing.finished_at) return { ok: true, already: true };
  const openedAt = existing && existing.opened_at ? existing.opened_at : new Date().toISOString();
  const before = await playedBefore(admin, { anon, userId: who.userId }, openedAt);
  const outcome = ['win', 'loss', 'tie'].includes(body.outcome) ? body.outcome : null;
  const row = {
    challenge_id: ch.id,
    taker_anon: anon,
    taker_user_id: who.userId,
    taker_name: who.username || cleanName(body.name),
    finished_at: new Date().toISOString(),
    fig: cleanFig(body.fig),
    outcome,
    new_player: before == null ? null : !before,
  };
  const { error } = existing
    ? await admin.from('quiz_challenge_takes').update(row).eq('id', existing.id)
    : await admin.from('quiz_challenge_takes').insert({ ...row, opened_at: openedAt });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// The sender's view: their challenges, newest first, each with its takes.
export async function listMine(admin, { anonId, email }, { limit = 60 } = {}) {
  const who = await whoIs(admin, { anonId, email });
  if (!who.anon && !who.userId) return { who, challenges: [] };
  let q = admin.from('quiz_challenges').select('id, cid, game_key, num, day, fig, sender_name, created_at')
    .order('created_at', { ascending: false }).limit(limit);
  q = who.userId && who.anon ? q.or(`sender_user_id.eq.${who.userId},sender_anon.eq.${who.anon}`)
    : who.userId ? q.eq('sender_user_id', who.userId) : q.eq('sender_anon', who.anon);
  const { data: chs, error } = await q;
  if (error) throw error;
  const ids = (chs || []).map((c) => c.id);
  let takes = [];
  if (ids.length) {
    const { data, error: e2 } = await admin.from('quiz_challenge_takes')
      .select('id, challenge_id, taker_name, opened_at, finished_at, fig, outcome, new_player, seen_at')
      .in('challenge_id', ids).order('opened_at', { ascending: false });
    if (e2) throw e2;
    takes = data || [];
  }
  const byCh = new Map();
  for (const t of takes) {
    const arr = byCh.get(t.challenge_id) || [];
    arr.push({
      id: t.id,
      name: t.taker_name || 'A friend',
      openedAt: t.opened_at,
      finishedAt: t.finished_at,
      fig: t.fig,
      outcome: t.outcome,
      newPlayer: t.new_player === true,
      seen: !!t.seen_at,
    });
    byCh.set(t.challenge_id, arr);
  }
  return {
    who,
    challenges: (chs || []).map((c) => ({
      cid: c.cid,
      game: c.game_key,
      num: c.num,
      day: c.day,
      fig: c.fig,
      sentAt: c.created_at,
      takes: byCh.get(c.id) || [],
    })),
  };
}

export async function markSeen(admin, { anonId, email, ids }) {
  const who = await whoIs(admin, { anonId, email });
  const list = (Array.isArray(ids) ? ids : []).filter((x) => typeof x === 'string' && /^[0-9a-f-]{36}$/.test(x)).slice(0, 50);
  if (!list.length || (!who.anon && !who.userId)) return { ok: false };
  // Only takes on the caller's own challenges.
  const { data: rows } = await admin.from('quiz_challenge_takes')
    .select('id, challenge_id, quiz_challenges!inner(sender_user_id, sender_anon)').in('id', list);
  const mine = (rows || []).filter((r) => {
    const c = r.quiz_challenges || {};
    return (who.userId && c.sender_user_id === who.userId) || (who.anon && c.sender_anon === who.anon);
  }).map((r) => r.id);
  if (!mine.length) return { ok: true, n: 0 };
  const { error } = await admin.from('quiz_challenge_takes').update({ seen_at: new Date().toISOString() }).in('id', mine);
  return error ? { ok: false } : { ok: true, n: mine.length };
}

// The admin funnel: every step a link goes through, for a window of days.
export async function funnel(admin, { days = 7 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: chs, error } = await admin.from('quiz_challenges')
    .select('id, game_key, source, sender_user_id, created_at').gte('created_at', since).limit(20000);
  if (error) throw error;
  const ids = (chs || []).map((c) => c.id);
  let takes = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data, error: e2 } = await admin.from('quiz_challenge_takes')
      .select('challenge_id, opened_at, finished_at, new_player, outcome').in('challenge_id', ids.slice(i, i + 300));
    if (e2) throw e2;
    takes = takes.concat(data || []);
  }
  const opened = new Set(takes.map((t) => t.challenge_id));
  const finished = takes.filter((t) => t.finished_at);
  const games = new Map();
  for (const c of chs || []) games.set(c.game_key, (games.get(c.game_key) || 0) + 1);
  const sources = new Map();
  for (const c of chs || []) sources.set(c.source || 'unknown', (sources.get(c.source || 'unknown') || 0) + 1);
  return {
    days,
    sent: (chs || []).length,
    senders: new Set((chs || []).map((c) => c.sender_user_id || c.id)).size,
    linksOpened: opened.size,
    opens: takes.length,
    finishes: finished.length,
    newPlayers: finished.filter((t) => t.new_player).length,
    senderWins: finished.filter((t) => t.outcome === 'loss').length,
    takerWins: finished.filter((t) => t.outcome === 'win').length,
    games: [...games.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
    sources: [...sources.entries()].sort((a, b) => b[1] - a[1]),
  };
}
