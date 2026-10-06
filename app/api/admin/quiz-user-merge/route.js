// Admin action: MERGE one quiz account into another.
//
// WHY THIS EXISTS. The 2026-08-04 domain move signed every registered player out
// (the identity cache is localStorage, which is per-origin). Re-joining resolves by
// email first, then by anon_id — and the ?_ml handoff that carries the anon_id is
// refused by adoptable() for anyone who had already visited the new domain during
// the soft launch. Those players hit `username_taken`, whose advice is "add the
// email you signed up with". An account created with a display name only has no
// email, so there is no self-service way back and they make a SECOND account under
// a near-identical name (steinni1 -> steinn1). This reunites the two.
//
// WHY NOT /api/admin/reattribute: that only rescues rows with a NULL user_id. The
// duplicate account's rows carry ITS user_id, so they are not orphans.
//
// WHAT ACTUALLY RESTORES ACCESS is step 2: moving the duplicate's anon_id onto the
// kept account. That anon_id is the player's current browser, and resolveQuizIdentity
// looks accounts up by it. Without that they stay locked out no matter where the
// history sits. The kept account does not lose its own browsers: resolveAnonSet also
// collects anon_ids off attributed quiz_results rows, which the move preserves.
//
// Auth: the admin cookie (/admin) OR an "x-admin-token" header matching
// ADMIN_TASK_TOKEN. Mirrors quiz-user-rename and reattribute.
//
// DRY RUN BY DEFAULT. Nothing is written unless apply:true, so an operator always
// sees the exact plan first. Merging the wrong pair is not undoable.
//
// POST { from, into, apply?, force? }
//   from  duplicate to absorb   (username or email, case-insensitive)
//   into  account to keep       (username or email, case-insensitive)
//   force required when `from` has more results than `into`, which almost always
//         means the direction is backwards
// -> { from, into, willMove:{results,duels}, applied, moved:{...}, warnings:[] }

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { dropStoredSnapshots } from '@/lib/results-snapshot-store';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  if (!expected) return false;
  return request.headers.get('x-admin-token') === expected;
}

const lc = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

// ilike treats % and _ as wildcards so it can only return a SUPERSET; the exact
// lowercase compare below is the authoritative match. Same contract as
// usernameTaken in lib/quiz-identity.js and rowsNamed in quiz-user-rename.
async function findAccount(ref) {
  const want = lc(ref);
  if (!want) return { account: null, ambiguous: false };
  const col = want.includes('@') ? 'email' : 'username';
  const { data, error } = await supabaseAdmin
    .from('quiz_users')
    .select('id, username, email, anon_id')
    .ilike(col, ref.trim());
  if (error) return { account: null, ambiguous: false, error };
  const rows = (data || []).filter((r) => lc(r[col]) === want);
  if (rows.length > 1) return { account: null, ambiguous: true };
  return { account: rows[0] || null, ambiguous: false };
}

async function countResults(userId) {
  const { count, error } = await supabaseAdmin
    .from('quiz_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return null;
  return count || 0;
}

export async function POST(request) {
  if (!isAdmin() && !tokenOk(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json()) || {};
    const fromRef = typeof body.from === 'string' ? body.from.trim() : '';
    const intoRef = typeof body.into === 'string' ? body.into.trim() : '';
    const apply = body.apply === true;
    const force = body.force === true;
    if (!fromRef || !intoRef) {
      return NextResponse.json({ error: 'from and into are both required' }, { status: 400 });
    }

    const a = await findAccount(fromRef);
    const b = await findAccount(intoRef);
    if (a.ambiguous || b.ambiguous) {
      return NextResponse.json({ error: 'reference matched more than one account' }, { status: 409 });
    }
    if (!a.account) return NextResponse.json({ error: `no account for "${fromRef}"` }, { status: 404 });
    if (!b.account) return NextResponse.json({ error: `no account for "${intoRef}"` }, { status: 404 });
    const from = a.account;
    const into = b.account;
    if (from.id === into.id) {
      return NextResponse.json({ error: 'from and into are the same account' }, { status: 400 });
    }

    const fromCount = await countResults(from.id);
    const intoCount = await countResults(into.id);
    const warnings = [];

    // The damaging mistake is running this backwards and folding the big account
    // into the small one. Refuse unless the operator says so explicitly.
    if (fromCount != null && intoCount != null && fromCount > intoCount) {
      warnings.push(`"${from.username}" has MORE results (${fromCount}) than "${into.username}" (${intoCount}). This is usually the wrong direction.`);
      if (apply && !force) {
        return NextResponse.json({
          error: 'refusing: the absorbed account has more results than the kept one. Re-check the direction, or pass force:true.',
          from: { ...from, results: fromCount },
          into: { ...into, results: intoCount },
        }, { status: 409 });
      }
    }
    if (!from.anon_id) warnings.push('The absorbed account has no anon_id, so this will not by itself restore the player\'s current browser.');
    if (into.email && from.email && lc(into.email) !== lc(from.email)) {
      warnings.push(`Both accounts carry an email (${into.email} / ${from.email}). The kept one is retained.`);
    }

    // Duel rows are keyed by name as well as anon token, so count by name.
    let duelCount = 0;
    for (const nameCol of ['challenger_name', 'opponent_name']) {
      const { data } = await supabaseAdmin.from('quiz_duels').select(`id, ${nameCol}`).ilike(nameCol, from.username || '');
      duelCount += (data || []).filter((r) => lc(r[nameCol]) === lc(from.username)).length;
    }

    const plan = {
      from: { id: from.id, username: from.username, email: from.email, anon_id: from.anon_id, results: fromCount },
      into: { id: into.id, username: into.username, email: into.email, anon_id: into.anon_id, results: intoCount },
      willMove: { results: fromCount, duels: duelCount },
      willSetAnonIdOnKept: from.anon_id || null,
      willBackfillEmail: (!into.email && from.email) ? from.email : null,
      warnings,
    };

    if (!apply) return NextResponse.json({ ...plan, applied: false, dryRun: true });

    // 1. Move the results FIRST, so nothing references the row about to go.
    const { data: moved, error: mErr } = await supabaseAdmin
      .from('quiz_results')
      .update({ user_id: into.id, username: into.username })
      .eq('user_id', from.id)
      .select('id');
    if (mErr) {
      console.error('quiz-user-merge results move error', mErr);
      return NextResponse.json({ error: 'db error moving results' }, { status: 500 });
    }

    // 2. FREE THE anon_id BEFORE CLAIMING IT. quiz_users.anon_id is unique, so
    //    assigning the duplicate's anon_id to the kept account while the duplicate
    //    still holds it violates the constraint. Doing this in the other order is
    //    what failed on the first live run: the results had already moved, so the
    //    history was safe, but the player stayed locked out.
    let removed = false;
    const { error: dErr } = await supabaseAdmin.from('quiz_users').delete().eq('id', from.id);
    if (dErr) {
      console.error('quiz-user-merge delete error', dErr);
      warnings.push(`Could not delete the absorbed row (${dErr.message}); clearing its anon_id instead.`);
      const { error: cErr } = await supabaseAdmin.from('quiz_users').update({ anon_id: null }).eq('id', from.id);
      if (cErr) {
        console.error('quiz-user-merge anon clear error', cErr);
        return NextResponse.json({
          error: 'db error freeing the duplicate anon_id; results were moved but access is NOT restored',
          movedResults: (moved || []).length,
        }, { status: 500 });
      }
    } else {
      removed = true;
    }

    // 3. Now the kept account can take it. This is the step that actually gives
    //    the player their account back: resolveQuizIdentity looks up by anon_id.
    const patch = {};
    if (from.anon_id) patch.anon_id = from.anon_id;
    if (!into.email && from.email) patch.email = from.email;
    if (Object.keys(patch).length) {
      const { error: pErr } = await supabaseAdmin.from('quiz_users').update(patch).eq('id', into.id);
      if (pErr) {
        console.error('quiz-user-merge kept-account patch error', pErr);
        // The duplicate is already gone, so say plainly what still needs doing.
        return NextResponse.json({
          error: 'db error updating the kept account. Results moved and the duplicate is gone, but the anon_id was NOT reassigned.',
          setThisAnonIdOnKeptAccountManually: from.anon_id,
          keptAccountId: into.id,
          movedResults: (moved || []).length,
        }, { status: 500 });
      }
    }

    // 4. Duels keep their own copy of each side's display name.
    let duelsRenamed = 0;
    for (const nameCol of ['challenger_name', 'opponent_name']) {
      const { data: sel } = await supabaseAdmin.from('quiz_duels').select(`id, ${nameCol}`).ilike(nameCol, from.username || '');
      const ids = (sel || []).filter((r) => lc(r[nameCol]) === lc(from.username)).map((r) => r.id);
      if (!ids.length) continue;
      const { data, error } = await supabaseAdmin
        .from('quiz_duels').update({ [nameCol]: into.username }).in('id', ids).select('id');
      if (error) console.error('quiz-user-merge duel rename error', nameCol, error);
      else duelsRenamed += (data || []).length;
    }

    // 5. The gzipped cross-instance row cache embeds usernames, and an in-place
    //    UPDATE changes neither its row count nor its max id, so a delta check
    //    cannot see this. Drop it and let the next reader rebuild.
    let snapshotCleared = 0;
    try {
      const { data, error } = await dropStoredSnapshots(supabaseAdmin);
      if (error) console.error('quiz-user-merge snapshot clear error', error);
      else snapshotCleared = (data || []).length;
    } catch (e) {
      console.error('quiz-user-merge snapshot clear skipped', e?.message || e);
    }

    return NextResponse.json({
      ...plan,
      applied: true,
      moved: { results: (moved || []).length, duels: duelsRenamed },
      absorbedRowRemoved: removed,
      snapshotCleared,
      warnings,
    });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
