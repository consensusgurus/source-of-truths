// THE COMMUNITY PAGE: the server-side data layer (owner, 2026-11-18).
//
// Post-Game Talk, the feel poll, cheers, the Idea Board and reports. Tables in
// migration 66; RLS on with no policies, so SERVER ONLY: every function takes
// the service-role client. Never import this from a 'use client' file.
//
// MIGRATION SAFETY: until migration 66 is applied every call reports
// `available: false` (the same Unavailable pattern as lib/groups.js), and the
// pages say "The community is being set up" instead of offering controls that
// cannot write.
//
// THE SPOILER RULE. A discussion belongs to one daily puzzle on one day, and a
// player may read or post in it only once they have a result on that puzzle
// (a finish, a fail or a give-up all count: they have seen the board). That is
// checked here against the same quiz_results rows and the same player keys
// every board uses, so the community can never disagree with the leaderboard
// about who played.

import { nameBlocked } from '@/lib/name-filter';
import { resolvePlayerKeys, findQuizIdentity } from '@/lib/quiz-identity';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

// KEEP THIS MODULE LIGHT (2026-11-23). It used to import lib/daily-slate (every
// puzzles.js bank, ~18 MB) and the results cache, so the Idea Board, notices and
// summary routes loaded every puzzle bank on a cold start and the board took
// seconds to appear. The two helpers that need those (puzzleOf, resultOf) live
// in lib/community-talk.js, imported only by the Post-Game Talk route.
function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function suffixOfDate(dateStr) {
  const [Y, M, D] = dateStr.split('-').map(Number);
  return `${M}-${D}-${Y % 100}`;
}

export const POST_MAX = 600;          // characters in a post
export const IDEA_TITLE_MAX = 90;
export const IDEA_BODY_MAX = 800;
export const POSTS_PER_DAY = 30;      // one player, across every discussion
export const IDEAS_PER_DAY = 5;       // one player
export const COMMENT_MAX = 500;       // characters in an Idea Board comment
export const COMMENTS_PER_DAY = 40;   // one player, across every idea
export const HIDE_AT_REPORTS = 3;     // reports that hide an item until the admin looks
export const IDEA_KINDS = { puzzle: 'New Puzzle', variation: 'Variation', fix: 'Site Fix' };
export const IDEA_STAGES = { open: 'Open For Votes', review: 'Under Review', workshop: 'Building', built: 'Built' };
export const FEELS = { 1: 'Gentle', 2: 'Moderate', 3: 'Tough' };

// ── availability ──────────────────────────────────────────────────────────
export function isMissingTable(err) {
  if (!err) return false;
  return err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST204'
    || /does not exist|schema cache|relation/i.test(err.message || '');
}
class Unavailable extends Error {}
class Refused extends Error {
  constructor(msg, status = 400, code = null) { super(msg); this.status = status; this.code = code; }
}
function check(error) {
  if (!error) return;
  if (isMissingTable(error)) throw new Unavailable('community tables missing');
  throw error;
}
export function refuse(msg, status = 400, code = null) { throw new Refused(msg, status, code); }

// Wraps a data call: a missing table reads as { available: false }, a refusal
// as { error, status }, anything else as a 500 with a plain message.
export async function guard(fn) {
  try {
    const out = await fn();
    return { available: true, ...out };
  } catch (e) {
    if (e instanceof Unavailable) return { available: false };
    if (e instanceof Refused) return { available: true, error: e.message, status: e.status, code: e.code };
    console.error('community error', e);
    return { available: true, error: 'Something went wrong. Try again in a moment.', status: 500 };
  }
}

// ── text ──────────────────────────────────────────────────────────────────
// The display-name screen, run word by word over a post. A link is refused
// outright: the board is for talking about the puzzle, not for advertising.
const URL_RE = /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|net|org|io|co|ly|gg|xyz|info|biz|me)\b/i;
export function cleanText(raw, max) {
  return String(raw || '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f<>]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}
export function textProblem(text) {
  if (!text) return 'Write something first.';
  if (URL_RE.test(text)) return 'Links are not allowed here.';
  const words = text.split(/[^A-Za-z0-9@$*!|.]+/).filter(Boolean);
  for (const w of words) if (nameBlocked(w)) return 'Please keep it friendly. That wording is not allowed.';
  return null;
}

// ── the day and the puzzle ────────────────────────────────────────────────
export function cleanDay(raw, today = etTodayServer()) {
  const d = String(raw || '').trim();
  return /^\d{1,2}-\d{1,2}-\d{2}$/.test(d) ? d : suffixOfDate(today);
}
export function todayDay() { return suffixOfDate(etTodayServer()); }
export function gameOf(key) {
  const k = String(key || '').trim().toLowerCase();
  return DAILY_GAME_MAP[k] ? DAILY_GAME_MAP[k] : null;
}
// ── who is asking ─────────────────────────────────────────────────────────
// keys: every board key this browser owns (u:<id>, a:<anon>). user: the account
// row, or null for a guest. Posting, cheering, voting and pitching need the
// account; reading a discussion needs only a result.
// { lite: true } skips the board keys (the Idea Board and notices need only the
// account), and the two lookups otherwise run side by side.
export async function viewerOf(admin, { anonId, email }, { lite = false } = {}) {
  let keys = new Set();
  let user = null;
  if (!anonId && !email) return { keys, user };
  const [who, u] = await Promise.all([
    lite ? Promise.resolve(null) : resolvePlayerKeys(admin, { anonId, email }).catch(() => null),
    findQuizIdentity(admin, { email, anonId }).catch(() => null),
  ]);
  if (who && who.keys) keys = who.keys;
  else if (anonId) keys = new Set([`a:${anonId}`]);
  user = u;
  if (user && user.id) keys.add(`u:${user.id}`);
  return { keys, user: user && user.id && user.username ? user : null };
}

// ── Post-Game Talk ────────────────────────────────────────────────────────
const POST_COLS = 'id, game_key, day, user_id, username, body, result, maker, cheers, reports, hidden, created_at';

export async function postsOf(admin, gameKey, day, { includeHidden = false, limit = 200 } = {}) {
  let q = admin.from('community_posts').select(POST_COLS)
    .eq('game_key', gameKey).eq('day', day)
    .order('maker', { ascending: false }).order('created_at', { ascending: true }).limit(limit);
  if (!includeHidden) q = q.eq('hidden', false);
  const { data, error } = await q;
  check(error);
  return data || [];
}

export async function cheeredBy(admin, userId, postIds) {
  if (!userId || !postIds.length) return new Set();
  const { data, error } = await admin.from('community_post_cheers').select('post_id').eq('user_id', userId).in('post_id', postIds);
  check(error);
  return new Set((data || []).map((r) => r.post_id));
}

export async function feelOf(admin, gameKey, day, userId) {
  const { data, error } = await admin.from('community_feel').select('feel, user_id').eq('game_key', gameKey).eq('day', day).limit(20000);
  check(error);
  const tally = { 1: 0, 2: 0, 3: 0 };
  let mine = null;
  for (const r of (data || [])) {
    if (tally[r.feel] != null) tally[r.feel] += 1;
    if (userId && r.user_id === userId) mine = r.feel;
  }
  return { tally, mine };
}

export async function addPost(admin, { user, gameKey, day, body, result, maker = false }) {
  const text = cleanText(body, POST_MAX);
  const bad = textProblem(text);
  if (bad) refuse(bad);
  if (!maker) {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count, error } = await admin.from('community_posts').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', since);
    check(error);
    if ((count || 0) >= POSTS_PER_DAY) refuse('That is a lot of posts for one day. Try again tomorrow.', 429);
  }
  const { data, error } = await admin.from('community_posts').insert({
    game_key: gameKey, day, user_id: user.id, username: maker ? 'Mind Loft' : user.username,
    body: text, result: maker ? null : (result || null), maker: !!maker,
  }).select(POST_COLS).limit(1);
  check(error);
  return (data && data[0]) || null;
}

async function recount(admin, table, col, id, parentTable, parentCol) {
  const { count, error } = await admin.from(table).select(col, { count: 'exact', head: true }).eq(col, id);
  check(error);
  const { error: e2 } = await admin.from(parentTable).update({ [parentCol]: count || 0 }).eq('id', id);
  check(e2);
  return count || 0;
}

export async function cheerPost(admin, userId, postId, on = true) {
  if (on) {
    const { error } = await admin.from('community_post_cheers').upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
    check(error);
  } else {
    const { error } = await admin.from('community_post_cheers').delete().eq('post_id', postId).eq('user_id', userId);
    check(error);
  }
  return recount(admin, 'community_post_cheers', 'post_id', postId, 'community_posts', 'cheers');
}

export async function setFeel(admin, userId, gameKey, day, feel) {
  const f = Number(feel);
  if (!FEELS[f]) refuse('Pick Gentle, Moderate or Tough.');
  const { error } = await admin.from('community_feel').upsert({ game_key: gameKey, day, user_id: userId, feel: f }, { onConflict: 'game_key,day,user_id' });
  check(error);
}

function tableOf(target) {
  if (target === 'idea') return 'community_ideas';
  if (target === 'comment') return 'community_idea_comments';
  return 'community_posts';
}

export async function report(admin, userId, target, targetId) {
  const table = tableOf(target);
  const { error } = await admin.from('community_reports').upsert({ target, target_id: targetId, user_id: userId }, { onConflict: 'target,target_id,user_id', ignoreDuplicates: true });
  check(error);
  const { count, error: e2 } = await admin.from('community_reports').select('user_id', { count: 'exact', head: true }).eq('target', target).eq('target_id', targetId);
  check(e2);
  const patch = { reports: count || 0 };
  if ((count || 0) >= HIDE_AT_REPORTS) patch.hidden = true;
  const { error: e3 } = await admin.from(table).update(patch).eq('id', targetId);
  check(e3);
  return { reports: count || 0, hidden: !!patch.hidden };
}

export async function setHidden(admin, target, id, hidden) {
  const table = tableOf(target);
  const patch = hidden ? { hidden: true } : { hidden: false, reports: 0 };
  const { error } = await admin.from(table).update(patch).eq('id', id);
  check(error);
  if (!hidden) {
    const { error: e2 } = await admin.from('community_reports').delete().eq('target', target).eq('target_id', id);
    check(e2);
  }
}

// Today's discussions, busiest first: [{ game, posts }]. Hidden posts and the
// Maker's own post do not count toward "players talking".
export async function talkCounts(admin, day) {
  const { data, error } = await admin.from('community_posts').select('game_key, user_id, maker').eq('day', day).eq('hidden', false).limit(20000);
  check(error);
  const by = new Map();
  for (const r of (data || [])) {
    if (r.maker) continue;
    let e = by.get(r.game_key);
    if (!e) { e = { game: r.game_key, posts: 0, players: new Set() }; by.set(r.game_key, e); }
    e.posts += 1;
    if (r.user_id) e.players.add(r.user_id);
  }
  return [...by.values()].map((e) => ({ game: e.game, posts: e.posts, players: e.players.size }))
    .sort((a, b) => b.players - a.players || b.posts - a.posts);
}

// ── the Idea Board ────────────────────────────────────────────────────────
const IDEA_COLS = 'id, kind, title, body, game_key, user_id, username, votes, stage, reports, hidden, created_at, staged_at';

export async function ideasOf(admin, { stage = null, kind = null, sort = 'top', includeHidden = false, limit = 120 } = {}) {
  let q = admin.from('community_ideas').select(IDEA_COLS).limit(limit);
  if (stage && IDEA_STAGES[stage]) q = q.eq('stage', stage);
  if (kind && IDEA_KINDS[kind]) q = q.eq('kind', kind);
  if (!includeHidden) q = q.eq('hidden', false);
  q = sort === 'new' ? q.order('created_at', { ascending: false }) : q.order('votes', { ascending: false }).order('created_at', { ascending: false });
  const { data, error } = await q;
  check(error);
  return data || [];
}

export async function votedBy(admin, userId, ideaIds) {
  if (!userId || !ideaIds.length) return new Set();
  const { data, error } = await admin.from('community_idea_votes').select('idea_id').eq('user_id', userId).in('idea_id', ideaIds);
  check(error);
  return new Set((data || []).map((r) => r.idea_id));
}

export async function pitchIdea(admin, user, { kind, title, body, gameKey }) {
  if (!IDEA_KINDS[kind]) refuse('Pick New Puzzle, Variation or Site Fix.');
  const t = cleanText(title, IDEA_TITLE_MAX).replace(/\n/g, ' ');
  const b = cleanText(body, IDEA_BODY_MAX);
  if (t.length < 4) refuse('Give the idea a short title.');
  const bad = textProblem(t) || (b ? textProblem(b) : null);
  if (bad) refuse(bad);
  const g = kind === 'variation' ? gameOf(gameKey) : null;
  if (kind === 'variation' && !g) refuse('Pick the puzzle this is a variation of.');
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count, error: e0 } = await admin.from('community_ideas').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
  check(e0);
  if ((count || 0) >= IDEAS_PER_DAY) refuse('Five ideas a day is the limit. Pitch the next one tomorrow.', 429);
  const { data, error } = await admin.from('community_ideas').insert({
    kind, title: t, body: b || null, game_key: g ? g.key : null, user_id: user.id, username: user.username, votes: 1,
  }).select(IDEA_COLS).limit(1);
  check(error);
  const idea = (data && data[0]) || null;
  // The pitcher's own vote, so every idea starts at one.
  if (idea) {
    const { error: e2 } = await admin.from('community_idea_votes').upsert({ idea_id: idea.id, user_id: user.id }, { onConflict: 'idea_id,user_id', ignoreDuplicates: true });
    check(e2);
  }
  return idea;
}

export async function voteIdea(admin, userId, ideaId, on = true) {
  if (on) {
    const { error } = await admin.from('community_idea_votes').upsert({ idea_id: ideaId, user_id: userId }, { onConflict: 'idea_id,user_id', ignoreDuplicates: true });
    check(error);
  } else {
    const { error } = await admin.from('community_idea_votes').delete().eq('idea_id', ideaId).eq('user_id', userId);
    check(error);
  }
  return recount(admin, 'community_idea_votes', 'idea_id', ideaId, 'community_ideas', 'votes');
}

export async function setStage(admin, ideaId, stage) {
  if (!IDEA_STAGES[stage]) refuse('Unknown stage.');
  const { error } = await admin.from('community_ideas').update({ stage, staged_at: new Date().toISOString() }).eq('id', ideaId);
  check(error);
}

// ── comments on ideas (migration 67, owner 2026-11-19) ────────────────────
// Comments live in their own table so the Idea Board keeps working, with no
// comments, until migration 67 is applied: commentsOf answers null then, and
// the board hides the comment controls.
const COMMENT_COLS = 'id, idea_id, user_id, username, body, reports, hidden, owner_seen, created_at, edited_at';

export async function commentsOf(admin, ideaIds, { includeHidden = false } = {}) {
  const by = new Map();
  if (!ideaIds.length) return by;
  try {
    let q = admin.from('community_idea_comments').select(COMMENT_COLS).in('idea_id', ideaIds)
      .order('created_at', { ascending: true }).limit(3000);
    if (!includeHidden) q = q.eq('hidden', false);
    const { data, error } = await q;
    check(error);
    for (const c of (data || [])) {
      if (!by.has(c.idea_id)) by.set(c.idea_id, []);
      by.get(c.idea_id).push(c);
    }
    return by;
  } catch (e) {
    if (e instanceof Unavailable) return null;
    throw e;
  }
}

export async function addComment(admin, user, ideaId, body) {
  const text = cleanText(body, COMMENT_MAX);
  const bad = textProblem(text);
  if (bad) refuse(bad);
  const { data: rows, error: e0 } = await admin.from('community_ideas').select('id, user_id, hidden').eq('id', ideaId).limit(1);
  check(e0);
  const idea = rows && rows[0];
  if (!idea || idea.hidden) refuse('That idea is no longer on the board.', 404);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count, error: e1 } = await admin.from('community_idea_comments').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', since);
  check(e1);
  if ((count || 0) >= COMMENTS_PER_DAY) refuse('That is a lot of comments for one day. Try again tomorrow.', 429);
  const { data, error } = await admin.from('community_idea_comments').insert({
    idea_id: ideaId, user_id: user.id, username: user.username, body: text,
    owner_seen: idea.user_id === user.id,
  }).select(COMMENT_COLS).limit(1);
  check(error);
  return (data && data[0]) || null;
}

// The bottom-of-screen notice: comments by other players on this player's
// ideas that the player has not seen yet, one entry per idea, newest first.
export async function noticesFor(admin, userId) {
  if (!userId) return [];
  const { data: mine, error } = await admin.from('community_ideas').select('id, title').eq('user_id', userId).eq('hidden', false).limit(500);
  check(error);
  if (!mine || !mine.length) return [];
  const titles = new Map(mine.map((i) => [i.id, i.title]));
  const { data, error: e2 } = await admin.from('community_idea_comments').select('id, idea_id, user_id, username, created_at')
    .in('idea_id', [...titles.keys()]).eq('owner_seen', false).eq('hidden', false)
    .order('created_at', { ascending: false }).limit(200);
  check(e2);
  const by = new Map();
  for (const c of (data || [])) {
    if (c.user_id === userId) continue;
    let n = by.get(c.idea_id);
    if (!n) { n = { idea: c.idea_id, title: titles.get(c.idea_id) || '', count: 0, names: [], at: c.created_at }; by.set(c.idea_id, n); }
    n.count += 1;
    if (!n.names.includes(c.username)) n.names.push(c.username);
  }
  return [...by.values()];
}

// Mark the comments on these ideas seen, but only on ideas this player owns.
export async function markSeen(admin, userId, ideaIds) {
  if (!userId) return;
  const ids = (ideaIds || []).map(Number).filter((n) => n > 0).slice(0, 200);
  let q = admin.from('community_ideas').select('id').eq('user_id', userId).limit(500);
  if (ids.length) q = q.in('id', ids);
  const { data, error } = await q;
  check(error);
  const own = (data || []).map((r) => r.id);
  if (!own.length) return;
  const { error: e2 } = await admin.from('community_idea_comments').update({ owner_seen: true }).in('idea_id', own).eq('owner_seen', false);
  check(e2);
}

// The author edits their own comment (migration 68). Same text rules as a new
// comment; the row is matched on its author, so nobody edits another's words.
export async function editComment(admin, userId, commentId, body) {
  const text = cleanText(body, COMMENT_MAX);
  const bad = textProblem(text);
  if (bad) refuse(bad);
  const { data, error } = await admin.from('community_idea_comments')
    .update({ body: text, edited_at: new Date().toISOString() })
    .eq('id', commentId).eq('user_id', userId).select(COMMENT_COLS).limit(1);
  check(error);
  const c = data && data[0];
  if (!c) refuse('That comment is not yours to edit.', 403);
  return c;
}

// The author removes their own comment.
export async function deleteOwnComment(admin, userId, commentId) {
  const { data, error } = await admin.from('community_idea_comments').delete()
    .eq('id', commentId).eq('user_id', userId).select('id');
  check(error);
  if (!data || !data.length) refuse('That comment is not yours to delete.', 403);
  await admin.from('community_reports').delete().eq('target', 'comment').eq('target_id', commentId);
}

// ADMIN DELETE (owner, 2026-11-19: "I need ability to delete posts and
// comments from admin"). Gone for good, unlike Hide. An idea takes its votes
// and comments with it (on delete cascade), a Talk post its cheers. Reports
// on the item are cleared too.
export async function deleteItem(admin, target, id) {
  const table = tableOf(target);
  const { error } = await admin.from(table).delete().eq('id', id);
  check(error);
  await admin.from('community_reports').delete().eq('target', target).eq('target_id', id);
}

export function publicComment(c, { mine = false, fresh = false } = {}) {
  return {
    id: c.id, name: c.username, body: c.body, mine: !!mine, fresh: !!fresh,
    hidden: !!c.hidden, reports: c.reports || 0, at: c.created_at, edited: !!c.edited_at,
  };
}

// The public shape of a row: never the user id.
export function publicPost(p, { cheered = false, mine = false } = {}) {
  return {
    id: p.id, name: p.username, body: p.body, result: p.result || null, maker: !!p.maker,
    cheers: p.cheers || 0, cheered: !!cheered, mine: !!mine, hidden: !!p.hidden, reports: p.reports || 0, at: p.created_at,
  };
}
export function publicIdea(i, { voted = false, mine = false } = {}) {
  const g = i.game_key ? gameOf(i.game_key) : null;
  return {
    id: i.id, kind: i.kind, kindLabel: IDEA_KINDS[i.kind] || '', title: i.title, body: i.body || '',
    game: g ? { key: g.key, name: g.name } : null, name: i.username, votes: i.votes || 0, voted: !!voted, mine: !!mine,
    stage: i.stage, stageLabel: IDEA_STAGES[i.stage] || '', hidden: !!i.hidden, reports: i.reports || 0, at: i.created_at,
  };
}
