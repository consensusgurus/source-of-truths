import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';
import {
  guard, refuse, cleanDay, gameOf, viewerOf, postsOf, cheeredBy, feelOf,
  addPost, cheerPost, setFeel, report, setHidden, deleteItem, publicPost, POST_MAX,
} from '@/lib/community';
import { puzzleOf, resultOf } from '@/lib/community-talk';

// /api/community/talk: one puzzle's Post-Game Talk (owner, 2026-11-18).
//   GET  ?game=<key>&date=<M-D-YY>&anonId=&email=
//        -> { game, day, played, result, canPost, username, posts[], feel, count, admin }
//        A viewer with no result on that puzzle gets { played: false } and the
//        COUNT only: the discussion stays closed until they have seen the board.
//   POST { action, game, date, anonId, email, ... }
//        post  { body }            needs an account and a result
//        cheer { id, on }          needs an account and a result
//        feel  { feel: 1|2|3 }     needs an account and a result
//        report{ id }              needs an account
//        hide  { id, hidden }      admin only
//        delete{ id }              admin only: removes the post for good
//        maker { body }            admin only: the pinned Maker post
// Never cached: every answer depends on who is asking.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

async function context(params) {
  const g = gameOf(params.game);
  if (!g) refuse('Unknown puzzle.', 404);
  const day = cleanDay(params.date);
  const puzzle = puzzleOf(g.key, day);
  if (!puzzle) refuse('That puzzle has not run yet.', 404);
  const viewer = await viewerOf(supabaseAdmin, { anonId: params.anonId || null, email: params.email || null });
  const res = await resultOf(supabaseAdmin, puzzle.quizId, viewer.keys);
  return { g, day, puzzle, viewer, res };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = {
    game: str(searchParams.get('game'), 40), date: str(searchParams.get('date'), 12),
    anonId: str(searchParams.get('anonId'), 64), email: str(searchParams.get('email')),
  };
  const admin = isAdmin();
  const out = await guard(async () => {
    const { g, day, viewer, res } = await context(params);
    const open = res.played || admin;
    const all = await postsOf(supabaseAdmin, g.key, day, { includeHidden: admin });
    const count = all.filter((p) => !p.maker && !p.hidden).length;
    const talkers = new Set(all.filter((p) => !p.maker && !p.hidden && p.user_id).map((p) => p.user_id)).size;
    const base = {
      game: { key: g.key, name: g.name, cat: g.cat, href: g.href }, day, played: !!res.played,
      result: res.played ? res.label : null, username: viewer.user ? viewer.user.username : null,
      count, talkers, admin, max: POST_MAX,
    };
    if (!open) return { ...base, posts: [], feel: null, canPost: false };
    const uid = viewer.user ? viewer.user.id : null;
    const cheered = await cheeredBy(supabaseAdmin, uid, all.map((p) => p.id));
    const feel = await feelOf(supabaseAdmin, g.key, day, uid);
    return {
      ...base,
      canPost: !!(uid && res.played) || admin,
      posts: all.map((p) => publicPost(p, { cheered: cheered.has(p.id), mine: !!uid && p.user_id === uid })),
      feel,
    };
  });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}

export async function POST(request) {
  let body = {};
  try { body = (await request.json()) || {}; } catch (e) { /* empty */ }
  const params = { game: str(body.game, 40), date: str(body.date, 12), anonId: str(body.anonId, 64), email: str(body.email) };
  const action = str(body.action, 20);
  const admin = isAdmin();
  const out = await guard(async () => {
    const { g, day, viewer, res } = await context(params);
    const id = Number(body.id) || 0;
    if (action === 'hide') {
      if (!admin) refuse('Not allowed.', 403);
      await setHidden(supabaseAdmin, 'post', id, body.hidden !== false);
      return { ok: true };
    }
    if (action === 'delete') {
      if (!admin) refuse('Not allowed.', 403);
      await deleteItem(supabaseAdmin, 'post', id);
      return { ok: true };
    }
    if (action === 'maker') {
      if (!admin) refuse('Not allowed.', 403);
      const user = viewer.user || { id: null, username: 'Mind Loft' };
      const p = await addPost(supabaseAdmin, { user, gameKey: g.key, day, body: body.body, maker: true });
      return { ok: true, post: p ? publicPost(p, {}) : null };
    }
    if (!viewer.user) refuse('Pick a name first.', 401, 'no_account');
    if (action === 'report') {
      const r = await report(supabaseAdmin, viewer.user.id, 'post', id);
      return { ok: true, ...r };
    }
    if (!res.played) refuse('Finish the puzzle to join its discussion.', 403, 'not_played');
    if (action === 'post') {
      const p = await addPost(supabaseAdmin, { user: viewer.user, gameKey: g.key, day, body: body.body, result: res.label });
      return { ok: true, post: p ? publicPost(p, { mine: true }) : null };
    }
    if (action === 'cheer') {
      const n = await cheerPost(supabaseAdmin, viewer.user.id, id, body.on !== false);
      return { ok: true, cheers: n };
    }
    if (action === 'feel') {
      await setFeel(supabaseAdmin, viewer.user.id, g.key, day, body.feel);
      return { ok: true, feel: await feelOf(supabaseAdmin, g.key, day, viewer.user.id) };
    }
    refuse('Unknown action.');
    return {};
  });
  if (out.available === false) return NextResponse.json({ ...out, error: 'The community is being set up. Try again soon.' }, { status: 503, headers: NO_STORE });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}
