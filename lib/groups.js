// GROUPS: the server-side data layer (owner, 2026-09-17).
//
// A group is a named set of accounts with a short invite code. It stores NO
// results: every board a group shows is the site's own board filtered to its
// members (see the `group` branch in app/api/quiz/daily-combined/route.js), so
// a group can never disagree with the site about who did what.
//
// SERVER ONLY. Every function takes the service-role client, because both
// tables have RLS on with no policies (migration 56). Never import this from a
// 'use client' file.
//
// MIGRATION SAFETY: until migration 56 is applied every read reports
// `available: false` rather than throwing, so the pages can say "Groups are
// being set up" instead of offering controls that cannot write. Same pattern as
// /api/quiz/favorites and migration 45.

export const GROUP_MEMBER_MAX = 50;   // members in one group
export const GROUPS_PER_PLAYER = 5;   // groups one player can be IN (made or joined)
export const GROUP_NAME_MAX = 40;

// No 0/O, 1/I/L: a code gets read aloud and typed off a flyer.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 5;
const CODE_RE = new RegExp(`^[${ALPHABET}]{${CODE_LEN}}$`);

export function normCode(raw) {
  const c = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return CODE_RE.test(c) ? c : null;
}

export function makeCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return s;
}

export function cleanGroupName(raw) {
  const s = String(raw || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, GROUP_NAME_MAX);
}

// PUBLIC OR PRIVATE (owner, 2026-09-17). Private is the default and is what
// every group made before today is: findable only through its code or link.
// Public also LISTS the group on /groups, where anyone can join it in one tap.
// Either way the board stays readable through a link, which is what makes an
// invite work before you have joined.
export const VISIBILITIES = ['private', 'public'];
export function cleanVisibility(v) { return VISIBILITIES.includes(v) ? v : 'private'; }

// The column arrives with migration 57, and this code has to run against a
// database that has not had it applied yet: a missing COLUMN is 42703, which
// isMissingTable does not (and must not) treat as a missing table. Every read
// falls back to the shape without it and every group then reads as private.
export function isMissingColumn(err) {
  return !!err && (err.code === '42703' || /column .* does not exist/i.test(err.message || ''));
}

export function isMissingTable(err) {
  if (!err) return false;
  return err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST204'
    || /does not exist|schema cache|relation/i.test(err.message || '');
}

class Unavailable extends Error {}

function check(error) {
  if (!error) return;
  if (isMissingTable(error)) throw new Unavailable('groups tables missing');
  throw error;
}

// Wraps a data call so a missing table reads as { available: false }.
export async function guard(fn) {
  try {
    const out = await fn();
    return { available: true, ...out };
  } catch (e) {
    if (e instanceof Unavailable) return { available: false };
    console.error('groups error', e);
    return { available: true, error: 'Something went wrong. Try again in a moment.', status: 500 };
  }
}

const GROUP_COLS = 'id, code, name, owner_id, created_at, visibility';
const GROUP_COLS_PRE57 = 'id, code, name, owner_id, created_at';

export async function groupByCode(admin, code) {
  const c = normCode(code);
  if (!c) return null;
  let { data, error } = await admin.from('quiz_groups')
    .select(GROUP_COLS).eq('code', c).limit(1);
  if (isMissingColumn(error)) {
    ({ data, error } = await admin.from('quiz_groups')
      .select(GROUP_COLS_PRE57).eq('code', c).limit(1));
  }
  check(error);
  const row = (data && data[0]) || null;
  return row ? { ...row, visibility: cleanVisibility(row.visibility) } : null;
}

export async function setVisibility(admin, group, raw) {
  const visibility = cleanVisibility(raw);
  const { error } = await admin.from('quiz_groups').update({ visibility }).eq('id', group.id);
  if (isMissingColumn(error)) return { error: 'Public groups are being set up. Try again soon.', status: 503 };
  check(error);
  return { visibility };
}

// THE PUBLIC LIST on /groups: every group its owner has opened up, newest
// first, with how many are in it. Full groups still show, marked full, because
// a name that vanishes at 50 members reads as a bug to the person who saw it
// yesterday.
export async function publicGroups(admin, limit = 60) {
  const { data, error } = await admin.from('quiz_groups')
    .select('id, code, name, owner_id, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 200));
  if (isMissingColumn(error)) return [];
  check(error);
  const rows = data || [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const { data: counts, error: cerr } = await admin.from('quiz_group_members')
    .select('group_id').in('group_id', ids).limit(GROUP_MEMBER_MAX * ids.length + 10);
  check(cerr);
  const n = new Map();
  for (const r of counts || []) n.set(r.group_id, (n.get(r.group_id) || 0) + 1);
  const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter(Boolean))];
  const byOwner = new Map();
  if (ownerIds.length) {
    const { data: users, error: uerr } = await admin.from('quiz_users')
      .select('id, username').in('id', ownerIds);
    check(uerr);
    for (const u of users || []) byOwner.set(u.id, u.username);
  }
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    members: n.get(r.id) || 0,
    full: (n.get(r.id) || 0) >= GROUP_MEMBER_MAX,
    owner: byOwner.get(r.owner_id) || null,
    createdAt: r.created_at,
  }));
}

// THE PRIVATE ONES, listed too (owner, 2026-09-25): /groups shows every group
// and marks the private ones, so a reader can see the room exists. A private
// group's CODE IS ITS KEY (the link is /groups/<code> and the code joins it),
// so this list carries NO code, NO id and NO owner: a name and a size only,
// and nothing on the page can open or join it. Groups the viewer is already
// in are left out, since they appear under Your groups.
export async function privateGroups(admin, { excludeUserId = null, limit = 120 } = {}) {
  const { data, error } = await admin.from('quiz_groups')
    .select('id, name, created_at')
    .eq('visibility', 'private')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 300));
  if (isMissingColumn(error)) return [];
  check(error);
  let rows = data || [];
  if (!rows.length) return [];
  if (excludeUserId) {
    const { data: mine, error: merr } = await admin.from('quiz_group_members')
      .select('group_id').eq('user_id', excludeUserId).limit(50);
    check(merr);
    const skip = new Set((mine || []).map((r) => r.group_id));
    rows = rows.filter((r) => !skip.has(r.id));
    if (!rows.length) return [];
  }
  const ids = rows.map((r) => r.id);
  const { data: counts, error: cerr } = await admin.from('quiz_group_members')
    .select('group_id').in('group_id', ids).limit(GROUP_MEMBER_MAX * ids.length + 10);
  check(cerr);
  const n = new Map();
  for (const r of counts || []) n.set(r.group_id, (n.get(r.group_id) || 0) + 1);
  return rows
    .map((r) => ({ name: r.name, members: n.get(r.id) || 0, full: (n.get(r.id) || 0) >= GROUP_MEMBER_MAX }))
    // An empty private group is somebody's abandoned start, not a room.
    .filter((r) => r.members > 0);
}

// Members with their CURRENT display names, oldest first.
export async function membersOf(admin, groupId) {
  const { data, error } = await admin.from('quiz_group_members')
    .select('user_id, role, joined_at').eq('group_id', groupId)
    .order('joined_at', { ascending: true }).limit(GROUP_MEMBER_MAX + 10);
  check(error);
  const rows = data || [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.user_id);
  const { data: users, error: uerr } = await admin.from('quiz_users')
    .select('id, username, email').in('id', ids);
  check(uerr);
  const byId = new Map((users || []).map((u) => [u.id, u]));
  return rows.map((r) => {
    const u = byId.get(r.user_id) || {};
    return {
      userId: r.user_id,
      userKey: `u:${r.user_id}`,
      username: u.username || 'Player',
      // Never the address itself: only whether one is on file, which is what
      // tells a reader the name cannot be taken over from another device.
      nameOnly: !u.email,
      role: r.role,
      joinedAt: r.joined_at,
    };
  });
}

export async function groupsOfUser(admin, userId) {
  const { data, error } = await admin.from('quiz_group_members')
    .select('group_id, role, joined_at').eq('user_id', userId).limit(50);
  check(error);
  const rows = data || [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.group_id);
  // VISIBILITY RIDES ALONG so /groups can mark each of your groups public or
  // private (owner, 2026-09-25). A database without migration 57 has no such
  // column; read again without it rather than failing the whole list.
  let { data: groups, error: gerr } = await admin.from('quiz_groups')
    .select('id, code, name, owner_id, created_at, visibility').in('id', ids);
  if (isMissingColumn(gerr)) {
    ({ data: groups, error: gerr } = await admin.from('quiz_groups')
      .select('id, code, name, owner_id, created_at').in('id', ids));
  }
  check(gerr);
  const { data: counts, error: cerr } = await admin.from('quiz_group_members')
    .select('group_id').in('group_id', ids).limit(GROUP_MEMBER_MAX * ids.length + 10);
  check(cerr);
  const n = new Map();
  for (const r of counts || []) n.set(r.group_id, (n.get(r.group_id) || 0) + 1);
  const byId = new Map((groups || []).map((g) => [g.id, g]));
  return rows
    .map((r) => {
      const g = byId.get(r.group_id);
      if (!g) return null;
      return { code: g.code, name: g.name, role: r.role, members: n.get(g.id) || 0, joinedAt: r.joined_at,
        visibility: cleanVisibility(g.visibility) };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.joinedAt).localeCompare(String(b.joinedAt)));
}

async function countFor(admin, column, value) {
  const { count, error } = await admin.from('quiz_group_members')
    .select('group_id', { count: 'exact', head: true }).eq(column, value);
  check(error);
  return count || 0;
}

export async function createGroup(admin, user, rawName, rawVisibility = 'private') {
  const name = cleanGroupName(rawName);
  const visibility = cleanVisibility(rawVisibility);
  if (!name) return { error: 'Give the group a name.', status: 400 };
  if (await countFor(admin, 'user_id', user.id) >= GROUPS_PER_PLAYER) {
    return { error: `You are already in ${GROUPS_PER_PLAYER} groups, which is the most one player can be in. Leave one to start another.`, status: 409 };
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = makeCode();
    let { data, error } = await admin.from('quiz_groups')
      .insert({ code, name, owner_id: user.id, visibility }).select('id, code, name').single();
    // Before migration 57 the column is not there; a private group is the same
    // row without it, so the insert simply goes again without the field.
    if (isMissingColumn(error)) {
      ({ data, error } = await admin.from('quiz_groups')
        .insert({ code, name, owner_id: user.id }).select('id, code, name').single());
    }
    if (error) {
      if (error.code === '23505') continue; // code collision, deal another
      check(error);
    }
    const { error: merr } = await admin.from('quiz_group_members')
      .insert({ group_id: data.id, user_id: user.id, role: 'owner' });
    check(merr);
    return { group: { code: data.code, name: data.name, visibility } };
  }
  return { error: 'Could not make a code just now. Try again.', status: 500 };
}

export async function joinGroup(admin, group, user) {
  const { data: have, error } = await admin.from('quiz_group_members')
    .select('user_id').eq('group_id', group.id).eq('user_id', user.id).limit(1);
  check(error);
  if (have && have.length) return { joined: true, already: true };
  if (await countFor(admin, 'group_id', group.id) >= GROUP_MEMBER_MAX) {
    return { error: `This group is full (${GROUP_MEMBER_MAX} members).`, status: 409 };
  }
  if (await countFor(admin, 'user_id', user.id) >= GROUPS_PER_PLAYER) {
    return { error: `You are already in ${GROUPS_PER_PLAYER} groups, which is the most one player can be in. Leave one to join this.`, status: 409 };
  }
  const { error: ierr } = await admin.from('quiz_group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' });
  if (ierr && ierr.code === '23505') return { joined: true, already: true };
  check(ierr);
  return { joined: true };
}

// Leaving as the owner hands the group to the longest-standing member, and the
// last member leaving deletes it. A group is never left without an owner.
export async function leaveGroup(admin, group, userId) {
  const { error } = await admin.from('quiz_group_members')
    .delete().eq('group_id', group.id).eq('user_id', userId);
  check(error);
  if (group.owner_id !== userId) return { left: true };
  const { data: next, error: nerr } = await admin.from('quiz_group_members')
    .select('user_id').eq('group_id', group.id).order('joined_at', { ascending: true }).limit(1);
  check(nerr);
  if (!next || !next.length) {
    const { error: derr } = await admin.from('quiz_groups').delete().eq('id', group.id);
    check(derr);
    return { left: true, deleted: true };
  }
  const heir = next[0].user_id;
  const { error: oerr } = await admin.from('quiz_groups').update({ owner_id: heir }).eq('id', group.id);
  check(oerr);
  const { error: rerr } = await admin.from('quiz_group_members')
    .update({ role: 'owner' }).eq('group_id', group.id).eq('user_id', heir);
  check(rerr);
  return { left: true };
}

export async function removeMember(admin, group, userId) {
  if (userId === group.owner_id) return { error: 'The owner cannot be removed. Leave the group instead.', status: 400 };
  const { error } = await admin.from('quiz_group_members')
    .delete().eq('group_id', group.id).eq('user_id', userId);
  check(error);
  return { removed: true };
}

export async function renameGroup(admin, group, rawName) {
  const name = cleanGroupName(rawName);
  if (!name) return { error: 'Give the group a name.', status: 400 };
  const { error } = await admin.from('quiz_groups').update({ name }).eq('id', group.id);
  check(error);
  return { name };
}

// A fresh code retires the old one, so an invite that went too far stops working.
export async function resetCode(admin, group) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = makeCode();
    const { error } = await admin.from('quiz_groups').update({ code }).eq('id', group.id);
    if (error && error.code === '23505') continue;
    check(error);
    return { code };
  }
  return { error: 'Could not make a code just now. Try again.', status: 500 };
}
