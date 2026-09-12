// verify-quiz-identity — the leaderboard sign-in rules, checked.
//
// WHY THIS EXISTS. lib/quiz-identity.js decides who a player IS, and until
// 2026-09-12 it had no checker at all, so the one thing it can get wrong was
// only ever found by a player reporting it. That is how "steinni1" spent a
// support ticket on a 409: a display name registered WITHOUT an email is keyed
// to one browser's anon_id and nothing else, so on a second device the email
// they type matches no row, the anon matches no row, and the name reads as
// someone else's. The route then told them to pick another name, which is the
// exact funnel that produces steinn1 beside steinni1 (see the header of
// /api/admin/quiz-user-merge, which exists to clean that up).
//
// The checks below cover BOTH directions: the reported case now exits to the
// reconnect form, and every path that already worked is byte-for-byte
// unchanged. Confirmed to FAIL (5 failures) against the pre-2026-09-12
// resolveQuizIdentity, which is what makes it a test rather than a comment.
//
// Runs against a fake PostgREST over an in-memory quiz_users table, so it needs
// no database, no network and no env. Auto-discovered by verify-all.mjs.
import { resolveQuizIdentity } from '../lib/quiz-identity.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(join(root, p), 'utf8');

function makeAdmin(rows) {
  let nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
  const lc = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
  return {
    from() {
      const q = { filters: [], _upd: null, _ins: null };
      const run = () => {
        let out = rows.filter((r) => q.filters.every(([k, v, ci]) =>
          ci ? lc(r[k]) === lc(v) : r[k] === v));
        if (q._ins) { const row = { id: nextId++, ...q._ins }; rows.push(row); out = [row]; }
        if (q._upd) { out.forEach((r) => Object.assign(r, q._upd)); }
        return out;
      };
      const api = {
        select() { return api; },
        ilike(col, val) { q.filters.push([col, val, true]); return api; },
        eq(col, val) { q.filters.push([col, val, false]); return api; },
        is(col, val) { q.filters.push([col, val, false]); return api; },
        update(p) { q._upd = p; return api; },
        insert(p) { q._ins = p; return api; },
        maybeSingle() { const o = run(); return Promise.resolve({ data: o[0] || null, error: null }); },
        single() { const o = run(); return Promise.resolve({ data: o[0] || null, error: o[0] ? null : { code: 'PGRST116' } }); },
        then(res) { return Promise.resolve({ data: run(), error: null }).then(res); },
      };
      return api;
    },
  };
}

// The join route's branch, lifted from app/api/quiz/join/route.js so a copy
// here cannot drift from what ships.
const src = read('app/api/quiz/join/route.js');
const UNCLAIM = /That display name is already registered to an account with no email on file/;
const PICK = /That display name belongs to a different account\. Pick another name\./;
const ADDMAIL = /That display name is already registered\. If it is yours, add the email/;
function branch(user, email) {
  const unclaimable = user.holderHasEmail === false;
  return {
    error: unclaimable ? 'unclaimable' : email ? 'pick' : 'addmail',
    code: unclaimable ? 'username_taken_unclaimable' : 'username_taken',
    recoverable: !email && !unclaimable,
    relink: unclaimable,
  };
}

let fail = 0;
const t = (name, cond) => { if (!cond) { fail++; console.log(`\u2717 ${name}`); } else console.log(`\u2713 ${name}`); };

// The route really does carry all three strings and the three flags.
t('route carries the unclaimable copy', UNCLAIM.test(src));
t('route keeps the pick-another-name copy', PICK.test(src));
t('route keeps the add-your-email copy', ADDMAIL.test(src));
t('unclaimable copy matches isLockedOut()', /already registered|belongs to a different account/i
  .test('That display name is already registered to an account with no email on file, so only we can move it.'));

const STEINNI = () => [{ id: 1, username: 'steinni1', email: null, anon_id: 'browser-A' }];
const WITHMAIL = () => [{ id: 1, username: 'gator85', email: 'g@x.com', anon_id: 'browser-A' }];

// THE REPORTED CASE. New browser, right email typed, name held by a name-only
// account: the email reaches nothing, so this must route to a human.
let r = await resolveQuizIdentity(makeAdmin(STEINNI()), {
  username: 'steinni1', email: 'nsteiner_2000@yahoo.com', anonId: 'ee60cfc8',
});
t('reported case: taken', r.error === 'username_taken');
t('reported case: holder has no email', r.holderHasEmail === false);
let b = branch(r, 'nsteiner_2000@yahoo.com');
t('reported case: exits to the reconnect form', b.error === 'unclaimable' && b.relink === true);
t('reported case: does NOT ask for the email again', b.recoverable === false);
t('reported case: no longer says pick another name', b.error !== 'pick');

// A holder WITH an email is reachable by its owner unaided: old copy, unchanged.
r = await resolveQuizIdentity(makeAdmin(WITHMAIL()), {
  username: 'gator85', email: 'someone@else.com', anonId: 'new-browser',
});
t('reachable holder: taken', r.error === 'username_taken');
t('reachable holder: holderHasEmail true', r.holderHasEmail === true);
t('reachable holder: still pick another name', branch(r, 'someone@else.com').error === 'pick');
t('reachable holder, no email typed: still recoverable', branch(r, '').recoverable === true);

// Case-insensitive, so STEINNI1 cannot slip past the holder lookup.
r = await resolveQuizIdentity(makeAdmin(STEINNI()), { username: 'STEINNI1', email: 'a@b.com', anonId: 'x' });
t('case-insensitive holder match', r.error === 'username_taken' && r.holderHasEmail === false);

// Unchanged path 1: the owner on their ORIGINAL browser adds an email.
let rows = STEINNI();
r = await resolveQuizIdentity(makeAdmin(rows), {
  username: 'steinni1', email: 'nsteiner_2000@yahoo.com', anonId: 'browser-A',
});
t('same browser: signs in, not taken', !r.error && r.username === 'steinni1');
t('same browser: email is back-filled', rows[0].email === 'nsteiner_2000@yahoo.com');

// Unchanged path 2: a free name still creates an account.
rows = STEINNI();
r = await resolveQuizIdentity(makeAdmin(rows), { username: 'brandnew', email: '', anonId: 'z' });
t('free name: creates', !r.error && r.username === 'brandnew' && rows.length === 2);

// Unchanged path 3: an account keeping its own name is never "taken" by itself.
rows = WITHMAIL();
r = await resolveQuizIdentity(makeAdmin(rows), { username: 'gator85', email: 'g@x.com', anonId: 'other' });
t('own name: not taken by self', !r.error && r.username === 'gator85');

// The join and claim routes must stay identical on this branch.
const claim = read('app/api/quiz/claim/route.js');
const grab = (s) => s.slice(s.indexOf('const unclaimable'), s.indexOf('}, { status: 409 });'));
t('join and claim branch byte-identical', grab(src) === grab(claim));

console.log(fail ? `\nquiz-identity: ${fail} FAILURE(S)` : '\nquiz-identity: all clean');
process.exit(fail ? 1 : 0);
