// verify-groups.mjs: the Groups data layer (lib/groups.js) against an
// in-memory PostgREST stand-in. No database, no env. Proves the rules the
// pages rely on: codes are well formed and unique, the two caps hold, a join
// is idempotent, an owner leaving hands the group on, the last member leaving
// deletes it, the owner cannot be removed, and a missing table reads as
// `available: false` instead of throwing.
import {
  normCode, makeCode, cleanGroupName, guard, createGroup, joinGroup, leaveGroup,
  removeMember, renameGroup, resetCode, groupByCode, membersOf, groupsOfUser,
  GROUP_MEMBER_MAX, GROUPS_PER_PLAYER,
} from '../lib/groups.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };

function fakeDb({ missing = false } = {}) {
  const t = { quiz_groups: [], quiz_group_members: [], quiz_users: [] };
  let seq = 0;
  function q(table) {
    const st = { op: 'select', filters: [], order: null, lim: null, head: false, count: false, payload: null, single: false };
    const api = {
      select(_c, opts) { if (st.op === 'select') st.op = 'select'; st.sel = true; if (opts && opts.count) { st.count = true; st.head = !!opts.head; } return api; },
      insert(p) { st.op = 'insert'; st.payload = p; return api; },
      update(p) { st.op = 'update'; st.payload = p; return api; },
      delete() { st.op = 'delete'; return api; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return api; },
      in(c, vs) { st.filters.push((r) => vs.includes(r[c])); return api; },
      order(c, o) { st.order = [c, o && o.ascending === false ? -1 : 1]; return api; },
      limit(n) { st.lim = n; return api; },
      single() { st.single = true; return api; },
      maybeSingle() { st.single = true; return api; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    function run() {
      if (missing) return { data: null, error: { code: '42P01', message: 'relation does not exist' } };
      const rows = t[table];
      const match = (r) => st.filters.every((f) => f(r));
      if (st.op === 'insert') {
        const p = { ...st.payload };
        if (table === 'quiz_groups') {
          if (rows.some((r) => r.code.toUpperCase() === p.code.toUpperCase())) return { data: null, error: { code: '23505' } };
          p.id = `g${++seq}`; p.created_at = new Date(Date.now() + seq).toISOString();
        }
        if (table === 'quiz_group_members') {
          if (rows.some((r) => r.group_id === p.group_id && r.user_id === p.user_id)) return { data: null, error: { code: '23505' } };
          p.role = p.role || 'member'; p.joined_at = new Date(Date.now() + ++seq).toISOString();
        }
        rows.push(p);
        return { data: st.single ? p : [p], error: null };
      }
      if (st.op === 'update') {
        if (table === 'quiz_groups' && st.payload.code && rows.some((r) => r.code === st.payload.code)) return { data: null, error: { code: '23505' } };
        rows.filter(match).forEach((r) => Object.assign(r, st.payload));
        return { data: null, error: null };
      }
      if (st.op === 'delete') {
        const keep = rows.filter((r) => !match(r));
        if (table === 'quiz_groups') {
          const gone = rows.filter(match).map((r) => r.id);
          t.quiz_group_members = t.quiz_group_members.filter((m) => !gone.includes(m.group_id));
        }
        t[table] = keep;
        return { data: null, error: null };
      }
      let out = rows.filter(match);
      if (st.order) { const [c, d] = st.order; out = out.slice().sort((a, b) => (a[c] < b[c] ? -d : a[c] > b[c] ? d : 0)); }
      if (st.lim != null) out = out.slice(0, st.lim);
      if (st.count && st.head) return { data: null, count: out.length, error: null };
      return { data: st.single ? (out[0] || null) : out, error: null };
    }
    return api;
  }
  return { t, from: q };
}

// codes
for (let i = 0; i < 200; i++) { const c = makeCode(); ok(normCode(c) === c, `makeCode ${c} normalizes to itself`); ok(!/[01OIL]/.test(c), `no ambiguous chars in ${c}`); }
ok(normCode(' k7q2x ') === 'K7Q2X', 'normCode uppercases and trims');
ok(normCode('K7Q2') === null && normCode('K7Q2O') === null, 'normCode rejects short and ambiguous');
ok(cleanGroupName('  a  <b>  c ') === 'a b c', 'cleanGroupName strips angle brackets and squashes space');
ok(cleanGroupName('x'.repeat(80)).length === 40, 'cleanGroupName caps length');

const db = fakeDb();
const users = Array.from({ length: GROUP_MEMBER_MAX + 3 }, (_, i) => ({ id: `u${i}`, username: `P${i}`, email: i % 2 ? `p${i}@x.co` : null }));
db.t.quiz_users.push(...users);

const made = await createGroup(db, users[0], 'Crew');
ok(made.group && normCode(made.group.code), 'create returns a code');
const g = await groupByCode(db, made.group.code.toLowerCase());
ok(g && g.owner_id === 'u0', 'groupByCode is case-insensitive and owner is the creator');
ok((await createGroup(db, users[0], '   ')).status === 400, 'blank name refused');

ok((await joinGroup(db, g, users[1])).joined, 'join works');
ok((await joinGroup(db, g, users[1])).already, 'second join is idempotent');
let ms = await membersOf(db, g.id);
ok(ms.length === 2 && ms[0].role === 'owner' && ms[0].userKey === 'u:u0', 'members listed oldest first with owner');
ok(ms[0].nameOnly === true && ms[1].nameOnly === false, 'nameOnly reflects email on file, never the address');
ok(!('email' in ms[1]), 'no email leaves the data layer');

for (let i = 2; i < GROUP_MEMBER_MAX; i++) await joinGroup(db, g, users[i]);
ok((await membersOf(db, g.id)).length === GROUP_MEMBER_MAX, 'group fills to the cap');
ok((await joinGroup(db, g, users[GROUP_MEMBER_MAX])).status === 409, 'join past the member cap refused');

// groups-per-player cap
const solo = users[GROUP_MEMBER_MAX + 1];
for (let i = 0; i < GROUPS_PER_PLAYER; i++) ok((await createGroup(db, solo, `G${i}`)).group, `solo makes group ${i}`);
ok((await createGroup(db, solo, 'one more')).status === 409, 'create past the per-player cap refused');
const other = await groupByCode(db, (await createGroup(db, users[GROUP_MEMBER_MAX + 2], 'Other')).group.code);
ok((await joinGroup(db, other, solo)).status === 409, 'join past the per-player cap refused');
const mine = await groupsOfUser(db, solo.id);
ok(mine.length === GROUPS_PER_PLAYER && mine.every((x) => x.role === 'owner' && x.members === 1), 'groupsOfUser lists them with counts');

// owner rules
ok((await removeMember(db, g, 'u0')).status === 400, 'owner cannot be removed');
ok((await removeMember(db, g, 'u5')).removed, 'owner removes a member');
ok(!(await membersOf(db, g.id)).some((m) => m.userId === 'u5'), 'removed member is gone');
ok((await renameGroup(db, g, 'New name')).name === 'New name', 'rename');
const before = g.code;
const rc = await resetCode(db, g);
ok(rc.code && rc.code !== before && !(await groupByCode(db, before)) && (await groupByCode(db, rc.code)), 'reset retires the old code');

// owner leaving hands on; last member leaving deletes
const g2 = await groupByCode(db, rc.code);
await leaveGroup(db, g2, 'u0');
const g3 = await groupByCode(db, rc.code);
ok(g3.owner_id === 'u1', 'owner leaving hands the group to the longest-standing member');
ok((await membersOf(db, g3.id)).find((m) => m.userId === 'u1').role === 'owner', 'heir role is owner');
const tiny = await groupByCode(db, (await createGroup(db, users[3], 'Tiny')).group.code);
// users[3] is already in the big group; that is fine, the cap is 5
const gone = await leaveGroup(db, tiny, 'u3');
ok(gone.deleted && !(await groupByCode(db, tiny.code)), 'last member leaving deletes the group');

// missing tables
const miss = fakeDb({ missing: true });
const r = await guard(() => groupsOfUser(miss, 'u0'));
ok(r.available === false, 'missing table reads as available:false');
const r2 = await guard(() => createGroup(miss, users[0], 'x'));
ok(r2.available === false, 'create on missing table reads as available:false');

if (fails) { console.log(`verify-groups: ${fails} failure(s)`); process.exit(1); }
console.log('verify-groups: clean');
