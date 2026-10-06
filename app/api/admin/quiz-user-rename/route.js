import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { dropStoredSnapshots } from '@/lib/results-snapshot-store';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Auth: the admin cookie (the /admin panel) OR an "x-admin-token" header
// matching ADMIN_TASK_TOKEN. Mirrors /api/admin/quiz-reset.
function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  if (!expected) return false;
  return request.headers.get('x-admin-token') === expected;
}

const lc = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

// ilike pre-filters case-insensitively but treats % and _ as wildcards, so it
// can only ever return a SUPERSET. Every caller below re-tests with an exact
// lowercase compare, which is the authoritative match. Same contract as
// usernameTaken in lib/quiz-identity.js.
async function rowsNamed(table, column, name, select) {
  const { data, error } = await supabaseAdmin.from(table).select(select).ilike(column, name);
  if (error) return { rows: null, error };
  const want = lc(name);
  return { rows: (data || []).filter((r) => lc(r[column]) === want), error: null };
}

// POST /api/admin/quiz-user-rename  { oldName, newName }
//
// Renames a quiz player's display name everywhere it is denormalized, so the
// account keeps every stat (all scoring is keyed by quiz_users.id / anon_id,
// never by the name) while nothing user-facing still shows the old one:
//
//   quiz_users.username   the canonical identity, so future games use it
//   quiz_results.username the leaderboard/Elo/IQ display name is read off the
//                         player's most recent result row
//   quiz_duels.*_name     the duel ladder stores its own copy per side
//   quiz_results_snapshot the gzipped cross-instance row cache embeds the old
//                         name, and an in-place UPDATE changes neither its row
//                         count nor its max id, so the delta check cannot see
//                         it. Dropping the snapshot forces a clean rebuild.
//
// Residual staleness: a warm lambda holding the in-process cache from before
// the rename self-heals on its next full reload (FULL_MS, 6h, in
// lib/quiz-results-cache.js). A deploy clears it immediately.
export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) || {};
    const oldName = typeof body.oldName === 'string' ? body.oldName.trim() : '';
    const newName = typeof body.newName === 'string' ? body.newName.trim() : '';

    if (!oldName || oldName.length > 120) {
      return NextResponse.json({ error: 'oldName required' }, { status: 400 });
    }
    if (!newName || newName.length > 40) {
      return NextResponse.json({ error: 'newName required (max 40 characters).' }, { status: 400 });
    }
    if (newName.includes('@')) {
      return NextResponse.json({ error: 'newName cannot be an email address.' }, { status: 400 });
    }
    if (oldName === newName) {
      return NextResponse.json({ ok: true, noop: true });
    }

    // Resolve the matching identity rows (there is normally exactly one).
    // Case-insensitive, so a name recorded as "gatorleo" is still found.
    const { rows: matched, error: selErr } = await rowsNamed('quiz_users', 'username', oldName, 'id, anon_id, username');
    if (selErr) {
      console.error('quiz-user-rename select error', selErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    const ids = (matched || []).map((r) => r.id);

    // Never rename onto a display name another account already holds. The join
    // path refuses this (usernameTaken) and there is no unique index on
    // username, so without this check an admin rename can silently create two
    // accounts sharing a name, which then collide on /player/<name>.
    const { rows: clash, error: clashErr } = await rowsNamed('quiz_users', 'username', newName, 'id, username');
    if (clashErr) {
      console.error('quiz-user-rename clash select error', clashErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    const owned = new Set(ids);
    const takenBy = (clash || []).filter((r) => !owned.has(r.id));
    if (takenBy.length) {
      return NextResponse.json(
        { error: `That display name is already taken (${takenBy.length} other account(s)).` },
        { status: 409 },
      );
    }

    let usersRenamed = 0;
    let resultsRenamed = 0;
    let duelsRenamed = 0;
    const anons = new Set();

    if (ids.length) {
      for (const r of matched) if (r.anon_id) anons.add(r.anon_id);

      const { data: u, error: uErr } = await supabaseAdmin
        .from('quiz_users')
        .update({ username: newName })
        .in('id', ids)
        .select('id');
      if (uErr) {
        console.error('quiz-user-rename users update error', uErr);
        return NextResponse.json({ error: 'db error' }, { status: 500 });
      }
      usersRenamed = (u || []).length;

      const { data: r, error: rErr } = await supabaseAdmin
        .from('quiz_results')
        .update({ username: newName })
        .in('user_id', ids)
        .select('id, anon_id');
      if (rErr) {
        console.error('quiz-user-rename results-by-user update error', rErr);
        return NextResponse.json({ error: 'db error' }, { status: 500 });
      }
      resultsRenamed = (r || []).length;
      // Every browser this account has ever played from. Needed to find the
      // account's duel rows, which are keyed by anon token, not by user_id.
      for (const row of (r || [])) if (row.anon_id) anons.add(row.anon_id);
    }

    // Also sweep any result rows still carrying the old display name (covers
    // anonymous-then-attributed rows whose username was stamped before the
    // identity was linked).
    const { rows: byName, error: r2Err } = await rowsNamed('quiz_results', 'username', oldName, 'id, anon_id, username');
    if (r2Err) {
      console.error('quiz-user-rename results-by-name select error', r2Err);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    const strayIds = (byName || []).map((r) => r.id);
    if (strayIds.length) {
      const { data: r2, error: u2Err } = await supabaseAdmin
        .from('quiz_results')
        .update({ username: newName })
        .in('id', strayIds)
        .select('id');
      if (u2Err) {
        console.error('quiz-user-rename results-by-name update error', u2Err);
        return NextResponse.json({ error: 'db error' }, { status: 500 });
      }
      resultsRenamed += (r2 || []).length;
      for (const row of (byName || [])) if (row.anon_id) anons.add(row.anon_id);
    }

    // Duels keep their own copy of each side's name. /api/duel/create and
    // /submit take it straight off the client body, so a stale localStorage
    // identity can also have written the old name with no anon match at all,
    // hence the by-name sweep alongside the anon-set one.
    const anonList = [...anons];
    for (const [anonCol, nameCol] of [['challenger_anon', 'challenger_name'], ['opponent_anon', 'opponent_name']]) {
      if (anonList.length) {
        const { data, error } = await supabaseAdmin
          .from('quiz_duels')
          .update({ [nameCol]: newName })
          .in(anonCol, anonList)
          .select('id');
        if (error) console.error('quiz-user-rename duels anon update error', nameCol, error);
        else duelsRenamed += (data || []).length;
      }
      const { rows: dRows, error: dSelErr } = await rowsNamed('quiz_duels', nameCol, oldName, `id, ${nameCol}`);
      if (dSelErr) { console.error('quiz-user-rename duels name select error', nameCol, dSelErr); continue; }
      const dIds = (dRows || []).map((r) => r.id);
      if (!dIds.length) continue;
      const { data, error } = await supabaseAdmin
        .from('quiz_duels')
        .update({ [nameCol]: newName })
        .in('id', dIds)
        .select('id');
      if (error) console.error('quiz-user-rename duels name update error', nameCol, error);
      else duelsRenamed += (data || []).length;
    }

    // Drop the cross-instance row snapshot so the next reader rebuilds it from
    // the renamed rows instead of serving the old name out of gzipped JSON.
    let snapshotCleared = 0;
    try {
      const { data, error } = await dropStoredSnapshots(supabaseAdmin);
      if (error) console.error('quiz-user-rename snapshot clear error', error);
      else snapshotCleared = (data || []).length;
    } catch (e) {
      console.error('quiz-user-rename snapshot clear skipped', e?.message || e);
    }

    return NextResponse.json({
      ok: true,
      usersRenamed,
      resultsRenamed,
      duelsRenamed,
      anonIds: anonList.length,
      snapshotCleared,
    });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
