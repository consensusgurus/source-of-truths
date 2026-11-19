import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';
import {
  guard, refuse, viewerOf, ideasOf, votedBy, pitchIdea, voteIdea, setStage, report, setHidden, publicIdea,
  commentsOf, addComment, markSeen, publicComment, IDEA_KINDS, IDEA_STAGES,
} from '@/lib/community';

// /api/community/ideas: the Idea Board (owner, 2026-11-18).
//   GET  ?stage=&kind=&sort=top|new&anonId=&email=
//        -> { ideas[], username, admin, kinds, stages, counts }
//   POST { action, anonId, email, ... }
//        pitch { kind, title, body, game }   needs an account
//        vote  { id, on }                    needs an account; one vote per idea
//        report{ id }                        needs an account
//        stage { id, stage }                 admin only
//        hide  { id, hidden }                admin only
//        comment       { id, body }          needs an account (migration 67)
//        reportComment { id }                needs an account
//        hideComment   { id, hidden }        admin only
//        seen          { ids }               marks comments on YOUR ideas seen
// GET also returns each idea's comments (oldest first) and `commentsOn`, false
// until migration 67 is applied.
// Anyone can read the board; it is not a spoiler surface.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = str(searchParams.get('anonId'), 64) || null;
  const email = str(searchParams.get('email')) || null;
  const stage = str(searchParams.get('stage'), 20) || null;
  const kind = str(searchParams.get('kind'), 20) || null;
  const sort = searchParams.get('sort') === 'new' ? 'new' : 'top';
  const admin = isAdmin();
  const out = await guard(async () => {
    const viewer = await viewerOf(supabaseAdmin, { anonId, email });
    const uid = viewer.user ? viewer.user.id : null;
    const all = await ideasOf(supabaseAdmin, { sort, includeHidden: admin, limit: 300 });
    const counts = { all: 0 };
    for (const s of Object.keys(IDEA_STAGES)) counts[s] = 0;
    for (const i of all) if (!i.hidden) { counts.all += 1; counts[i.stage] = (counts[i.stage] || 0) + 1; }
    const shown = all.filter((i) => (!stage || i.stage === stage) && (!kind || i.kind === kind));
    const voted = await votedBy(supabaseAdmin, uid, shown.map((i) => i.id));
    const cm = await commentsOf(supabaseAdmin, shown.map((i) => i.id), { includeHidden: admin });
    return {
      ideas: shown.map((i) => {
        const mine = !!uid && i.user_id === uid;
        const list = cm ? (cm.get(i.id) || []) : [];
        return {
          ...publicIdea(i, { voted: voted.has(i.id), mine }),
          comments: list.map((c) => publicComment(c, { mine: !!uid && c.user_id === uid, fresh: mine && !c.owner_seen && c.user_id !== uid })),
        };
      }),
      commentsOn: !!cm,
      username: viewer.user ? viewer.user.username : null, admin, counts,
      kinds: IDEA_KINDS, stages: IDEA_STAGES,
    };
  });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}

export async function POST(request) {
  let body = {};
  try { body = (await request.json()) || {}; } catch (e) { /* empty */ }
  const action = str(body.action, 20);
  const admin = isAdmin();
  const out = await guard(async () => {
    const id = Number(body.id) || 0;
    if (action === 'stage') {
      if (!admin) refuse('Not allowed.', 403);
      await setStage(supabaseAdmin, id, str(body.stage, 20));
      return { ok: true };
    }
    if (action === 'hide') {
      if (!admin) refuse('Not allowed.', 403);
      await setHidden(supabaseAdmin, 'idea', id, body.hidden !== false);
      return { ok: true };
    }
    if (action === 'hideComment') {
      if (!admin) refuse('Not allowed.', 403);
      await setHidden(supabaseAdmin, 'comment', id, body.hidden !== false);
      return { ok: true };
    }
    const viewer = await viewerOf(supabaseAdmin, { anonId: str(body.anonId, 64) || null, email: str(body.email) || null });
    if (action === 'seen') {
      if (viewer.user) await markSeen(supabaseAdmin, viewer.user.id, Array.isArray(body.ids) ? body.ids : []);
      return { ok: true };
    }
    if (!viewer.user) refuse('Pick a name first.', 401, 'no_account');
    if (action === 'comment') {
      const c = await addComment(supabaseAdmin, viewer.user, id, body.body);
      return { ok: true, comment: c ? publicComment(c, { mine: true }) : null };
    }
    if (action === 'reportComment') {
      const r = await report(supabaseAdmin, viewer.user.id, 'comment', id);
      return { ok: true, ...r };
    }
    if (action === 'pitch') {
      const idea = await pitchIdea(supabaseAdmin, viewer.user, { kind: str(body.kind, 20), title: body.title, body: body.body, gameKey: str(body.game, 40) });
      return { ok: true, idea: idea ? publicIdea(idea, { voted: true, mine: true }) : null };
    }
    if (action === 'vote') {
      const n = await voteIdea(supabaseAdmin, viewer.user.id, id, body.on !== false);
      return { ok: true, votes: n };
    }
    if (action === 'report') {
      const r = await report(supabaseAdmin, viewer.user.id, 'idea', id);
      return { ok: true, ...r };
    }
    refuse('Unknown action.');
    return {};
  });
  if (out.available === false) return NextResponse.json({ ...out, error: 'The community is being set up. Try again soon.' }, { status: 503, headers: NO_STORE });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}
