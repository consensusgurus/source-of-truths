import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { muralPlayer, muralTableMissing, privatePhotoOptions, createPrivateMural } from '@/lib/mural';
import { PRIVATE_SIZES, PRIVATE_OPEN_MAX } from '@/lib/mural-shared';

// /api/mural/private   (owner, 2026-11-19: murals "with your group or with A group")
//
//   GET  ?anonId=&email=&seed=   the start page: whether the viewer has a name,
//                                their groups, three pictures to choose from and
//                                the private murals they started or can join
//                                through a group
//   POST { size, photo, group? (a group's code), anonId, email }   start one -> { code, id }
//
// Starting one needs a name (an account, even a name-only one): the wall shows
// who built it, and each start decodes a photo, which should not be open to
// anyone at all. JOINING a link-only mural needs nothing but the link.
// A player may have PRIVATE_OPEN_MAX open at once, and a group one at a time.
// A player id is `u:<uuid>`: the colon is reserved in a PostgREST or() filter, so
// the value is quoted there.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function str(v, n = 120) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }
const SIZES = PRIVATE_SIZES.map((s) => ({ key: s.key, pieces: s.cols * s.rows }));

// The viewer's groups with their ids. lib/groups hands the browser a group's code,
// never its id, and so does this route: ids stay on the server.
async function myGroups(userId) {
  const m = await supabaseAdmin.from('quiz_group_members').select('group_id').eq('user_id', userId).limit(50);
  if (m.error) throw m.error;
  const ids = (m.data || []).map((r) => r.group_id);
  if (!ids.length) return [];
  const g = await supabaseAdmin.from('quiz_groups').select('id, code, name').in('id', ids);
  if (g.error) throw g.error;
  return (g.data || []).map((x) => ({ id: x.id, code: x.code, name: x.name }));
}

async function listFor(who, groups) {
  const gids = groups.map((g) => g.id);
  let q = supabaseAdmin.from('mural_private').select('mural_id, code, owner, owner_name, group_id, created_at').order('created_at', { ascending: false }).limit(40);
  q = gids.length ? q.or(`owner.eq."${who.player}",group_id.in.(${gids.join(',')})`) : q.eq('owner', who.player);
  const m = await q;
  if (m.error) throw m.error;
  const rows = m.data || [];
  if (!rows.length) return [];
  const b = await supabaseAdmin.from('mural_boards').select('id, name, cols, rows, completed_at').in('id', rows.map((r) => r.mural_id));
  if (b.error) throw b.error;
  const boards = new Map((b.data || []).map((x) => [x.id, x]));
  const gname = new Map(groups.map((g) => [g.id, g.name]));
  const out = [];
  for (const r of rows) {
    const bd = boards.get(r.mural_id);
    if (!bd) continue;
    const c = await supabaseAdmin.from('mural_places').select('piece', { count: 'exact', head: true }).eq('mural_id', r.mural_id).eq('first', true);
    out.push({
      code: r.code, id: r.mural_id, title: bd.name || '', total: bd.cols * bd.rows,
      placed: c.error ? 0 : (c.count || 0), complete: !!bd.completed_at,
      group: r.group_id ? (gname.get(r.group_id) || 'A Group') : null,
      by: r.owner_name || 'A player', mine: r.owner === who.player,
    });
  }
  return out;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const who = await muralPlayer(supabaseAdmin, { anonId: str(searchParams.get('anonId'), 64) || null, email: str(searchParams.get('email')) || null });
  const seed = str(searchParams.get('seed'), 24) || String(Date.now());
  const base = { available: true, sizes: SIZES, max: PRIVATE_OPEN_MAX, options: privatePhotoOptions(seed, 3) };
  if (!who || !who.userId) return NextResponse.json({ ...base, registered: false, groups: [], murals: [] }, { headers: NO_STORE });
  try {
    const groups = await myGroups(who.userId);
    const murals = await listFor(who, groups);
    return NextResponse.json({ ...base, registered: true, username: who.name, groups: groups.map((g) => ({ code: g.code, name: g.name })), murals }, { headers: NO_STORE });
  } catch (e) {
    if (muralTableMissing(e)) return NextResponse.json({ ...base, available: false, registered: true, username: who.name, groups: [], murals: [] }, { headers: NO_STORE });
    console.error('mural private list', e);
    return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request) {
  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  const who = await muralPlayer(supabaseAdmin, { anonId: str(body.anonId, 64) || null, email: str(body.email) || null });
  if (!who || !who.userId) return NextResponse.json({ error: 'name', message: 'Pick a name first, then start your mural.' }, { status: 401, headers: NO_STORE });
  const groupCode = str(body.group, 12).toUpperCase() || null;
  try {
    const groups = await myGroups(who.userId);
    const grp = groupCode ? groups.find((g) => String(g.code).toUpperCase() === groupCode) : null;
    const groupId = grp ? grp.id : null;
    if (groupCode && !grp) return NextResponse.json({ error: 'group', message: 'You are not in that group.' }, { status: 403, headers: NO_STORE });
    const mine = await supabaseAdmin.from('mural_private').select('mural_id, group_id').or(groupId ? `owner.eq."${who.player}",group_id.eq.${groupId}` : `owner.eq."${who.player}"`).limit(60);
    if (mine.error) throw mine.error;
    const ids = (mine.data || []).map((r) => r.mural_id);
    if (ids.length) {
      const open = await supabaseAdmin.from('mural_boards').select('id').in('id', ids).is('completed_at', null);
      if (open.error) throw open.error;
      const openIds = new Set((open.data || []).map((r) => r.id));
      const openRows = (mine.data || []).filter((r) => openIds.has(r.mural_id));
      if (groupId && openRows.some((r) => r.group_id === groupId)) return NextResponse.json({ error: 'group_open', message: 'That group already has a mural open. Finish it first.' }, { status: 409, headers: NO_STORE });
      const own = await supabaseAdmin.from('mural_private').select('mural_id').eq('owner', who.player).in('mural_id', [...openIds]);
      if (!own.error && (own.data || []).length >= PRIVATE_OPEN_MAX) return NextResponse.json({ error: 'max', message: `You have ${PRIVATE_OPEN_MAX} private murals open. Finish one first.` }, { status: 409, headers: NO_STORE });
    }
    const made = await createPrivateMural(supabaseAdmin, {
      size: str(body.size, 4), photoNum: Number(body.photo),
      owner: who.player, ownerUser: who.userId, ownerName: who.name, groupId,
    });
    if (made.error === 'unavailable') return NextResponse.json({ error: 'unavailable', message: 'Private murals are not switched on yet.' }, { status: 503, headers: NO_STORE });
    if (made.error === 'photo') return NextResponse.json({ error: 'photo', message: 'That picture could not be cut. Pick another.' }, { status: 502, headers: NO_STORE });
    if (made.error) return NextResponse.json({ error: made.error, message: 'That did not work. Try again.' }, { status: 400, headers: NO_STORE });
    return NextResponse.json(made, { headers: NO_STORE });
  } catch (e) {
    if (muralTableMissing(e)) return NextResponse.json({ error: 'unavailable', message: 'Private murals are not switched on yet.' }, { status: 503, headers: NO_STORE });
    console.error('mural private start', e);
    return NextResponse.json({ error: 'Try again in a moment.', message: 'Try again in a moment.' }, { status: 503, headers: NO_STORE });
  }
}
