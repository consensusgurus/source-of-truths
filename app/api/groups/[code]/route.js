import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import {
  guard, groupByCode, membersOf, joinGroup, leaveGroup, removeMember, renameGroup, resetCode,
  GROUP_MEMBER_MAX, GROUPS_PER_PLAYER,
} from '@/lib/groups';

// /api/groups/<code>
//   GET  ?anonId=&email=  -> the group, its members, and what the viewer is in it
//   POST { action, anonId, email, ... }
//        action: 'join' | 'leave' | 'remove' (userId) | 'rename' (name) | 'reset'
//
// Anyone holding the code can SEE the group: the board is visible before
// joining, which is what makes a one-tap join possible. Only the owner can
// rename, reset the code, or remove a member.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }

async function viewerOf({ anonId, email }) {
  if (!anonId && !email) return null;
  try { return await findQuizIdentity(supabaseAdmin, { email, anonId }); } catch (e) { return null; }
}

function shape(group, members, viewer) {
  const mine = viewer ? members.find((m) => m.userId === viewer.id) : null;
  return {
    group: { code: group.code, name: group.name, createdAt: group.created_at },
    members: members.map((m) => ({
      userKey: m.userKey,
      userId: m.userId,
      username: m.username,
      nameOnly: m.nameOnly,
      owner: m.userId === group.owner_id,
      joinedAt: m.joinedAt,
    })),
    owner: (members.find((m) => m.userId === group.owner_id) || {}).username || null,
    viewer: viewer
      ? { registered: true, username: viewer.username, userKey: `u:${viewer.id}`, member: !!mine, owner: viewer.id === group.owner_id }
      : { registered: false, member: false, owner: false },
    memberMax: GROUP_MEMBER_MAX,
    groupsMax: GROUPS_PER_PLAYER,
  };
}

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const anonId = str(searchParams.get('anonId'), 64) || null;
  const email = str(searchParams.get('email')) || null;
  const out = await guard(async () => {
    const group = await groupByCode(supabaseAdmin, params.code);
    if (!group) return { error: 'No group has that code. Check it and try again.', status: 404 };
    const [members, viewer] = await Promise.all([membersOf(supabaseAdmin, group.id), viewerOf({ anonId, email })]);
    return shape(group, members, viewer);
  });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}

export async function POST(request, { params }) {
  let body = {};
  try { body = (await request.json()) || {}; } catch (e) { /* empty body */ }
  const action = str(body.action, 20);
  const anonId = str(body.anonId, 64) || null;
  const email = str(body.email) || null;
  const out = await guard(async () => {
    const group = await groupByCode(supabaseAdmin, params.code);
    if (!group) return { error: 'No group has that code. Check it and try again.', status: 404 };
    const viewer = await viewerOf({ anonId, email });
    if (!viewer) return { error: 'Pick a name first.', code: 'no_account', status: 401 };
    const isOwner = viewer.id === group.owner_id;

    let res;
    if (action === 'join') res = await joinGroup(supabaseAdmin, group, viewer);
    else if (action === 'leave') res = await leaveGroup(supabaseAdmin, group, viewer.id);
    else if (action === 'remove') {
      if (!isOwner) return { error: 'Only the group owner can remove members.', status: 403 };
      res = await removeMember(supabaseAdmin, group, str(body.userId, 64));
    } else if (action === 'rename') {
      if (!isOwner) return { error: 'Only the group owner can rename the group.', status: 403 };
      res = await renameGroup(supabaseAdmin, group, body.name);
    } else if (action === 'reset') {
      if (!isOwner) return { error: 'Only the group owner can reset the code.', status: 403 };
      res = await resetCode(supabaseAdmin, group);
    } else {
      return { error: 'Unknown action.', status: 400 };
    }
    if (res.error || res.deleted) return res;

    const fresh = await groupByCode(supabaseAdmin, res.code || group.code);
    if (!fresh) return res;
    const members = await membersOf(supabaseAdmin, fresh.id);
    return { ...res, ...shape(fresh, members, viewer) };
  });
  if (!out.available) return NextResponse.json({ ...out, error: 'Groups are being set up. Try again soon.' }, { status: 503, headers: NO_STORE });
  return NextResponse.json(out, { status: out.status || 200, headers: NO_STORE });
}
