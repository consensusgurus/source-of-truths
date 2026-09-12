// Admin action: RELINK an existing quiz account to a browser and/or an email.
//
// WHY THIS EXISTS (2026-09-12, player "steinni1"). An account created with a
// display name only is keyed by one browser's anon_id and nothing else, so on a
// second device resolveQuizIdentity matches neither the email (the row has none)
// nor the anon_id (new browser), and the name reads as taken. There was no admin
// action for that case:
//
//   /api/admin/quiz-user-merge needs a DUPLICATE account to absorb, and the
//     players who REPORT the problem instead of registering steinn1 beside
//     steinni1 have no duplicate to merge.
//   /api/admin/reattribute only rescues quiz_results rows whose user_id is NULL.
//     A locked-out player's history is not orphaned, it sits on the account they
//     already own.
//
// So the one thing that actually restores access, putting the player's CURRENT
// browser id and an email on the row they already own, had to be done by hand in
// the SQL editor. This is that action, with the merge route's guard rails.
//
// WHAT ACTUALLY RESTORES ACCESS is anonId: resolveQuizIdentity looks accounts up
// by it, so that is the field that signs them back in on the device they are
// holding. The email is what stops them needing us again: it is the only key that
// crosses devices, and a name-only account has no self-service path at all.
//
// Auth: the admin cookie (/admin) OR an "x-admin-token" header matching
// ADMIN_TASK_TOKEN. Mirrors quiz-user-merge and quiz-user-rename.
//
// DRY RUN BY DEFAULT. Nothing is written unless apply:true, so an operator always
// sees the exact plan, and every warning, before anything changes.
//
// POST { account, email?, anonId?, apply?, force? }
//   account  username or email of the row to fix (case-insensitive)
//   email    email to put on the account. `force` is required to REPLACE a
//            DIFFERENT email already on the row: that edit can lock the real
//            owner out of their own account, so it never happens by accident.
//   anonId   the player's current browser id, straight off the sign-in report
//            ("Browser id: ..." in the SigninHelp context block).
//   -> { account, willSet, warnings[], applied, attributedResults }
//
// REFUSES rather than forces when another account already holds the email or the
// anon_id. Both mean a SECOND account exists, which is quiz-user-merge's job, and
// merging is not something to approximate here: it moves results and duels too.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { attributeAnonGames, validEmail } from '@/lib/quiz-identity';

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
// usernameHolder in lib/quiz-identity.js and findAccount in quiz-user-merge.
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
    const ref = typeof body.account === 'string' ? body.account.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const anonId = typeof body.anonId === 'string' ? body.anonId.trim().slice(0, 64) : '';
    const apply = body.apply === true;
    const force = body.force === true;

    if (!ref) {
      return NextResponse.json({ error: 'account is required (a username or an email)' }, { status: 400 });
    }
    if (!email && !anonId) {
      return NextResponse.json({ error: 'nothing to set: pass an email, an anonId, or both' }, { status: 400 });
    }
    if (email && !validEmail(email)) {
      return NextResponse.json({ error: `"${email}" is not a valid email` }, { status: 400 });
    }

    const found = await findAccount(ref);
    if (found.ambiguous) {
      return NextResponse.json({ error: 'reference matched more than one account' }, { status: 409 });
    }
    if (!found.account) {
      return NextResponse.json({ error: `no account for "${ref}"` }, { status: 404 });
    }
    const acct = found.account;
    const warnings = [];

    // An email or an anon_id held by ANOTHER row means a second account exists.
    // That is a merge, not a relink: merging moves results and duel names too,
    // and quiz_users has a unique constraint on both columns, so a write here
    // would fail anyway. Refuse and name the tool.
    if (email) {
      const other = await findAccount(email);
      if (other.ambiguous) {
        return NextResponse.json({ error: `"${email}" matched more than one account` }, { status: 409 });
      }
      if (other.account && other.account.id !== acct.id) {
        return NextResponse.json({
          error: `"${email}" already belongs to another account ("${other.account.username}"). That is a merge, not a relink: POST /api/admin/quiz-user-merge { from, into }.`,
          holder: { id: other.account.id, username: other.account.username },
        }, { status: 409 });
      }
    }
    if (anonId) {
      const { data: anonRows } = await supabaseAdmin
        .from('quiz_users')
        .select('id, username, email')
        .eq('anon_id', anonId);
      const clash = (anonRows || []).find((r) => r.id !== acct.id);
      if (clash) {
        return NextResponse.json({
          error: `that browser already belongs to another account ("${clash.username}"), which usually means the player registered a second name from it. That is a merge: POST /api/admin/quiz-user-merge { from: "${clash.username}", into: "${acct.username}" }.`,
          holder: { id: clash.id, username: clash.username },
        }, { status: 409 });
      }
    }

    // Replacing a DIFFERENT email is the one edit that can lock the real owner
    // out, since the email is the key that reconnects them on any device.
    const replacingEmail = !!(email && acct.email && lc(acct.email) !== lc(email));
    if (replacingEmail) {
      warnings.push(`This REPLACES the email already on the account (${acct.email} -> ${email}). Whoever holds ${acct.email} loses their way back in.`);
      if (apply && !force) {
        return NextResponse.json({
          error: 'refusing: the account already carries a different email. Confirm the player owns this account, then pass force:true.',
          account: { id: acct.id, username: acct.username, email: acct.email },
        }, { status: 409 });
      }
    }
    if (anonId && acct.anon_id && acct.anon_id !== anonId) {
      warnings.push(`The account's recorded browser changes (${acct.anon_id} -> ${anonId}). Their old browser keeps working: resolveAnonSet also collects anon_ids off attributed quiz_results rows.`);
    }
    if (!acct.email && !email) {
      warnings.push('The account still has NO email, so this fixes today\'s device and nothing else. The player hits the same wall on their next one.');
    }

    const patch = {};
    if (email && lc(acct.email || '') !== lc(email)) patch.email = email;
    if (anonId && acct.anon_id !== anonId) patch.anon_id = anonId;

    const results = await countResults(acct.id);
    const plan = {
      account: { id: acct.id, username: acct.username, email: acct.email, anon_id: acct.anon_id, results },
      willSet: patch,
      warnings,
    };

    if (!Object.keys(patch).length) {
      return NextResponse.json({ ...plan, applied: false, noop: true, note: 'The account already carries these values.' });
    }
    if (!apply) return NextResponse.json({ ...plan, applied: false, dryRun: true });

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('quiz_users')
      .update(patch)
      .eq('id', acct.id)
      .select('id, username, email, anon_id')
      .single();
    if (uErr) {
      console.error('quiz-relink update error', uErr);
      return NextResponse.json({ error: `db error updating the account: ${uErr.message}` }, { status: 500 });
    }

    // Any games the player finished as a guest on this browser belong to them.
    // Same call /api/quiz/join makes, and it only ever touches rows whose
    // user_id is still NULL, so it can never take someone else's history.
    let attributedResults = 0;
    if (anonId) {
      const { count: before } = await supabaseAdmin
        .from('quiz_results')
        .select('id', { count: 'exact', head: true })
        .eq('anon_id', anonId)
        .is('user_id', null);
      await attributeAnonGames(supabaseAdmin, anonId, updated);
      attributedResults = before || 0;
    }

    return NextResponse.json({
      ...plan,
      account: updated,
      applied: true,
      attributedResults,
    });
  } catch (e) {
    console.error('quiz-relink error', e);
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
