// GROUPS ACTIVITY for the admin desk (owner, 2026-09-17).
//
// Every group with its owner, size and newest join, plus the most recent joins
// across all groups and the headline counts. Read on demand when the Groups tab
// opens, so it costs the admin page nothing until it is looked at.
//
// Auth: the admin cookie only. This names players and their groups, so there is
// no shared-token path, the same reasoning /api/admin/player-plays gives.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isMissingTable, isMissingColumn } from '@/lib/groups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY = 86400000;

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const [{ data: groups, error: gerr }, { data: members, error: merr }] = await Promise.all([
      // `visibility` arrives with migration 57; see the fallback below.
      supabaseAdmin.from('quiz_groups').select('id, code, name, owner_id, created_at, visibility').order('created_at', { ascending: false }).limit(2000),
      supabaseAdmin.from('quiz_group_members').select('group_id, user_id, role, joined_at').order('joined_at', { ascending: false }).limit(20000),
    ]);
    let list = groups;
    let gerr2 = gerr;
    if (isMissingColumn(gerr)) {
      const again = await supabaseAdmin.from('quiz_groups')
        .select('id, code, name, owner_id, created_at').order('created_at', { ascending: false }).limit(2000);
      list = again.data; gerr2 = again.error;
    }
    const err = gerr2 || merr;
    if (err) {
      if (isMissingTable(err)) return NextResponse.json({ available: false });
      throw err;
    }
    const userIds = [...new Set([...(members || []).map((m) => m.user_id), ...(list || []).map((g) => g.owner_id).filter(Boolean)])];
    const names = new Map();
    for (let i = 0; i < userIds.length; i += 500) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username, email').in('id', userIds.slice(i, i + 500));
      for (const u of data || []) names.set(u.id, { username: u.username, hasEmail: !!u.email });
    }

    const now = Date.now();
    const byGroup = new Map();
    for (const m of members || []) {
      let g = byGroup.get(m.group_id);
      if (!g) { g = { count: 0, lastJoin: null }; byGroup.set(m.group_id, g); }
      g.count += 1;
      if (!g.lastJoin || m.joined_at > g.lastJoin) g.lastJoin = m.joined_at;
    }
    const groupById = new Map((list || []).map((g) => [g.id, g]));
    const within = (iso, ms) => iso && now - Date.parse(iso) <= ms;
    // A join at the moment the group was made is its owner, not a new member.
    const realJoins = (members || []).filter((m) => m.role !== 'owner');
    const players = new Set((members || []).map((m) => m.user_id));

    return NextResponse.json({
      available: true,
      totals: {
        groups: (list || []).length,
        memberships: (members || []).length,
        players: players.size,
        groups24h: (list || []).filter((g) => within(g.created_at, DAY)).length,
        groups7d: (list || []).filter((g) => within(g.created_at, 7 * DAY)).length,
        joins24h: realJoins.filter((m) => within(m.joined_at, DAY)).length,
        joins7d: realJoins.filter((m) => within(m.joined_at, 7 * DAY)).length,
        avgSize: (list || []).length ? Math.round(((members || []).length / list.length) * 10) / 10 : 0,
      },
      groups: (list || []).map((g) => {
        const s = byGroup.get(g.id) || { count: 0, lastJoin: null };
        const o = names.get(g.owner_id) || {};
        return { code: g.code, name: g.name, owner: o.username || null, members: s.count, createdAt: g.created_at, lastJoin: s.lastJoin, visibility: g.visibility || 'private' };
      }),
      recentJoins: (members || []).slice(0, 60).map((m) => {
        const g = groupById.get(m.group_id) || {};
        const u = names.get(m.user_id) || {};
        return { at: m.joined_at, username: u.username || 'Player', nameOnly: !u.hasEmail, role: m.role, group: g.name || '(deleted)', code: g.code || null };
      }),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('admin groups error', e);
    return NextResponse.json({ error: 'Could not load groups.' }, { status: 500 });
  }
}
