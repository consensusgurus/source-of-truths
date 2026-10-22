// Server side of the $100 ticket drawing (lib/drawing.js holds the terms).
//
// Tickets are DERIVED, never stored: every quiz_referrals row credited inside
// the window is one ticket, numbered in the order it was credited, and it
// counts only if the person behind it was genuinely new (no finished game
// before the credit). Nothing is written by the drawing, so it cannot drift
// from the referral credits the rest of the site already shows.
//
// Source: quiz_contest_referrals() (migration 49), the same per-referral read
// the admin review page uses, because it already carries each referred
// person's first play and the referrer's email flag. It is not cheap, so the
// whole field is memoized per lambda for a minute; a pop-up and a board panel
// loading on the same page share one read. If the RPC is missing, the plain
// table read below keeps the drawing alive without the newness test.
//
// Every read is best-effort: a promo must never take down a page.

import { DRAWING } from './drawing.js';
import { computePlayTickets, ticketStartOf, emailAddedAt } from './drawing-play';
import { loadQuizResultsCached } from './quiz-results-cache';

// Five minutes, not one: the RPC scans quiz_results per referral and regularly
// hit the 8s statement timeout (about 80 failed calls a day, 2026-10-14).
const TTL_MS = 5 * 60 * 1000;
// After the RPC fails, skip it for this long and keep serving the last good
// read, rather than re-running a query that just timed out on every request.
const RPC_COOL_MS = 15 * 60 * 1000;
let memo = { at: 0, field: null };
let lastGood = null;      // last successful RPC result, mapped
let rpcCoolUntil = 0;

function okDate(v) {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? t : null;
}

async function readReferrals(admin) {
  if (Date.now() < rpcCoolUntil && lastGood) return lastGood;
  const { data, error } = Date.now() < rpcCoolUntil
    ? { data: null, error: { message: 'cooling down' } }
    : await admin.rpc('quiz_contest_referrals', {
      p_start: DRAWING.startsAt,
      p_end: DRAWING.endsAt,
    });
  if (error && !/cooling down/.test(error.message || '')) {
    rpcCoolUntil = Date.now() + RPC_COOL_MS;
    console.error('quiz_contest_referrals failed, cooling down', error.message || error);
  }
  // A stale but newness-checked read beats the unchecked fallback, which can
  // count a ticket the checked read would refuse and so make the board jump.
  if (error && lastGood) return lastGood;
  if (!error && Array.isArray(data)) {
    lastGood = data.map((r) => ({
      referrerId: r.referrer_user_id,
      username: r.username,
      refCode: r.ref_code,
      hasEmail: !!r.has_email,
      referredKey: r.referred_key,
      referredUserId: r.referred_user_id || null,
      referredName: r.referred_username || null,
      at: r.credited_at,
      firstPlay: r.first_play,
      checked: true,
    }));
    return lastGood;
  }
  // Fallback: the raw credits, no newness test.
  const { data: rows, error: rowErr } = await admin
    .from('quiz_referrals')
    .select('referrer_user_id, referred_key, referred_user_id, created_at, seeded')
    .gte('created_at', DRAWING.startsAt)
    .lte('created_at', DRAWING.endsAt)
    .limit(20000);
  if (rowErr || !rows) return [];
  const ids = [...new Set(rows.flatMap((r) => [r.referrer_user_id, r.referred_user_id]).filter(Boolean))];
  const users = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const { data: us } = await admin
      .from('quiz_users')
      .select('id, username, ref_code, email')
      .in('id', ids.slice(i, i + 200));
    for (const u of us || []) users.set(u.id, u);
  }
  return rows
    .filter((r) => !r.seeded)
    .map((r) => {
      const u = users.get(r.referrer_user_id) || {};
      const ru = r.referred_user_id ? users.get(r.referred_user_id) : null;
      return {
        referrerId: r.referrer_user_id,
        username: u.username || null,
        refCode: u.ref_code || null,
        hasEmail: !!(u.email && String(u.email).trim()),
        referredKey: r.referred_key,
        referredUserId: r.referred_user_id || null,
        referredName: ru ? ru.username : null,
        at: r.created_at,
        firstPlay: null,
        checked: false,
      };
    });
}

// Every account, paged (PostgREST caps a plain select at 1,000 rows). Reads
// email_at (migration 61) when the column exists, and carries on without it
// (tickets then start at account creation) when it does not.
async function readUsersOnce(admin, cols) {
  const out = [];
  for (let from = 0; from < 200000; from += 1000) {
    const { data, error } = await admin
      .from('quiz_users')
      .select(cols)
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) return { error };
    if (!data) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return { data: out };
}
async function readUsers(admin) {
  let r = await readUsersOnce(admin, 'id, username, ref_code, email, created_at, anon_id, email_at');
  if (r.error) r = await readUsersOnce(admin, 'id, username, ref_code, email, created_at, anon_id');
  if (r.error) throw new Error(r.error.message || 'quiz_users read failed');
  return r.data;
}
let usersMemo = { at: 0, users: null };
async function usersCached(admin) {
  if (usersMemo.users && Date.now() - usersMemo.at < TTL_MS) return usersMemo.users;
  const users = await readUsers(admin);
  usersMemo = { at: Date.now(), users };
  return users;
}

const q4 = (n) => Math.round(n * 4) / 4;

// THE GROUP TICKET (owner, 2026-10-22): "create a group with 2+ users", one
// ticket. A group qualifies the moment its SECOND member joins (the owner's own
// row counts as the first), and its owner earns the ticket once, however many
// groups they make. A group that qualified before the owner's tickets started
// (before the drawing, or before their email) is credited at that start. Returns
// Map(ownerId -> earliest qualifying ms). Tables missing or unreadable -> empty.
async function readGroupQualifiers(admin) {
  const out = new Map();
  try {
    const owners = new Map();
    for (let from = 0; from < 100000; from += 1000) {
      const { data, error } = await admin.from('quiz_groups').select('id, owner_id').range(from, from + 999);
      if (error || !data) return out;
      for (const g of data) if (g.owner_id) owners.set(g.id, g.owner_id);
      if (data.length < 1000) break;
    }
    const joins = new Map();
    for (let from = 0; from < 500000; from += 1000) {
      const { data, error } = await admin.from('quiz_group_members').select('group_id, user_id, joined_at').range(from, from + 999);
      if (error || !data) return out;
      for (const m of data) {
        const t = Date.parse(m.joined_at || '');
        if (!Number.isFinite(t)) continue;
        let a = joins.get(m.group_id);
        if (!a) { a = []; joins.set(m.group_id, a); }
        a.push(t);
      }
      if (data.length < 1000) break;
    }
    for (const [gid, ts] of joins) {
      const owner = owners.get(gid);
      if (!owner || ts.length < 2) continue;
      ts.sort((x, y) => x - y);
      const prev = out.get(owner);
      out.set(owner, prev == null ? ts[1] : Math.min(prev, ts[1]));
    }
  } catch (e) { /* no group tickets this round */ }
  return out;
}
let groupMemo = { at: 0, map: null };
async function groupQualifiersCached(admin) {
  if (groupMemo.map && Date.now() - groupMemo.at < TTL_MS) return groupMemo.map;
  const map = await readGroupQualifiers(admin);
  groupMemo = { at: Date.now(), map };
  return map;
}

const PLAY_WAIT_MS = 4000;
let playMemo = { at: 0, play: null, byId: null };
let playBuilding = null;
let playBuildAt = 0;
function playTotals(admin, users) {
  if (!playBuilding || Date.now() - playBuildAt > 120000) {
    playBuildAt = Date.now();
    playBuilding = (async () => {
      const res = await loadQuizResultsCached(admin);
      // Never memoize play totals computed from no rows: that would read as
      // everyone's streaks and wins being zero for the next five minutes.
      if (!res || res.error || !Array.isArray(res.data)) throw new Error('results unavailable');
      const play = computePlayTickets(res.data, users);
      playMemo = { at: Date.now(), play, byId: new Map(users.map((u) => [u.id, u])) };
      return playMemo;
    })().finally(() => { playBuilding = null; });
  }
  return playBuilding;
}

// The whole field: every valid friend ticket, numbered, plus each holder's play
// tickets (lib/drawing-play.js, capped), and the holders ranked by the sum.
// STALE WHILE REVALIDATE (2026-10-21). Since play tickets, a rebuild reads the
// whole results table and scores every finished day, which on a cold instance
// held the header's ticket count back for about 30 seconds. So: a fresh memo is
// returned as is; a stale one is returned AT ONCE while one rebuild runs behind
// it; only an instance with nothing yet waits, and concurrent callers share
// that one build.
let building = null;
let buildAt = 0;
function rebuild(admin) {
  if (!building || Date.now() - buildAt > 120000) {
    buildAt = Date.now();
    building = buildField(admin).finally(() => { building = null; });
  }
  return building;
}

export async function drawingField(admin, { force = false } = {}) {
  if (!force && memo.field && Date.now() - memo.at < TTL_MS) return memo.field;
  if (!force && memo.field) { rebuild(admin).catch(() => {}); return memo.field; }
  return rebuild(admin);
}

async function buildField(admin) {

  let refs = [];
  try { refs = await readReferrals(admin); } catch { refs = []; }
  // Every account, for the email rule: tickets need an email and start when it
  // was added. If accounts cannot be read, fall back to the referral rows' own
  // email flag with tickets starting at the drawing's start.
  let users = null;
  try { users = await usersCached(admin); } catch { users = null; }
  const byId = new Map((users || []).map((u) => [u.id, u]));
  const byAnon = new Map((users || []).filter((u) => u.anon_id).map((u) => [u.anon_id, u]));
  const drawStart = Date.parse(DRAWING.startsAt);
  const startFor = (uid, hasEmailFlag) => {
    const u = byId.get(uid);
    if (u) return ticketStartOf(u);
    return users ? null : (hasEmailFlag ? drawStart : null);
  };

  // THE FALLBACK GETS THE SAME NEWNESS TEST (2026-10-21). When the RPC times
  // out, readReferrals returns raw credits with no first-play check, which
  // counted more tickets than the checked read and made two surfaces disagree
  // (18 1/4 in the banner, 22 1/4 in the header). The RPC's first_play is the
  // earliest finished game by the referred anon id or account, which the shared
  // results cache can answer just as well.
  if (refs.some((r) => !r.checked)) {
    try {
      const res = await Promise.race([
        loadQuizResultsCached(admin),
        new Promise((r) => setTimeout(() => r(null), PLAY_WAIT_MS)),
      ]);
      if (res && Array.isArray(res.data)) {
        const firstA = new Map();
        const firstU = new Map();
        for (const q of res.data) {
          if (!q || q.abandoned) continue;
          const t = Date.parse(q.created_at || '');
          if (!Number.isFinite(t)) continue;
          if (q.anon_id) { const p = firstA.get(q.anon_id); if (p == null || t < p) firstA.set(q.anon_id, t); }
          if (q.user_id) { const p = firstU.get(q.user_id); if (p == null || t < p) firstU.set(q.user_id, t); }
        }
        refs = refs.map((r) => {
          if (r.checked) return r;
          const c = [firstA.get(r.referredKey), r.referredUserId ? firstU.get(r.referredUserId) : undefined].filter((v) => v != null);
          return c.length ? { ...r, checked: true, firstPlay: new Date(Math.min(...c)).toISOString() } : r;
        });
      }
    } catch { /* keep the unchecked credits */ }
  }
  const refsPartial = refs.some((r) => !r.checked);

  const tickets = refs
    .filter((r) => {
      if (!r.username) return false;
      // An UNCHECKED credit (the newness test could not run in time on a cold
      // instance) is left out rather than counted: the field then rebuilds in
      // 15 seconds with it checked. Counting it showed a player 4 extra friends
      // for one request (38 1/2 against the real 30 1/2, 2026-10-22).
      if (!r.checked) return false;
      if (!r.firstPlay) return true;
      const at = okDate(r.at);
      const fp = okDate(r.firstPlay);
      if (at == null || fp == null) return true;
      return fp >= at - DRAWING.NEW_PLAYER_SLACK_MS;
    })
    // Credited after the referrer's tickets started (they had an email by then).
    .filter((r) => {
      const s = startFor(r.referrerId, r.hasEmail);
      const at = okDate(r.at);
      return s != null && at != null && at >= s;
    })
    .sort((a, b) => (okDate(a.at) || 0) - (okDate(b.at) || 0) || String(a.referredKey).localeCompare(String(b.referredKey)))
    .map((r, i) => ({ ...r, no: i + 1 }));

  const holders = new Map();
  for (const t of tickets) {
    const key = t.referrerId;
    const h = holders.get(key) || {
      referrerId: key, username: t.username, refCode: t.refCode, hasEmail: t.hasEmail,
      tickets: [], first: t.no,
    };
    h.hasEmail = h.hasEmail || t.hasEmail;
    // THE FRIEND'S EMAIL: a half more once the person brought in adds an email
    // of their own, counted from the later of that and the credit, and only if
    // that falls inside the referrer's ticket window and the drawing.
    let friendEmail = false;
    const fr = t.referredUserId ? byId.get(t.referredUserId) : byAnon.get(t.referredKey);
    const fAt = fr ? emailAddedAt(fr) : null;
    if (fAt != null) {
      const when = Math.max(fAt, okDate(t.at) || 0);
      const s = startFor(key, t.hasEmail);
      friendEmail = s != null && when >= s && when <= Date.parse(DRAWING.endsAt);
    }
    h.tickets.push({ no: t.no, friend: t.referredName, at: t.at, friendEmail });
    holders.set(key, h);
  }

  // Play tickets, from their own memo. Never allowed to hold the drawing up:
  // if they are not ready within PLAY_WAIT_MS the field is built from friend
  // tickets (or the last play totals) and marked to rebuild shortly, while the
  // play computation finishes behind it.
  let pm = playMemo.play ? playMemo : null;
  if (!pm || Date.now() - pm.at >= TTL_MS) {
    const p = users ? playTotals(admin, users).catch(() => null) : Promise.resolve(null);
    const got = await Promise.race([p, new Promise((r) => setTimeout(() => r(null), PLAY_WAIT_MS))]);
    if (got) pm = got;
  }
  const partial = refsPartial || !pm || Date.now() - pm.at >= TTL_MS;
  try {
    const play = pm ? pm.play : new Map();
    for (const [uid, p] of play) {
      if (!(p.earned > 0)) continue;
      let h = holders.get(uid);
      if (!h) {
        const u = byId.get(uid) || (pm && pm.byId.get(uid));
        if (!u || !u.username) continue;
        h = { referrerId: uid, username: u.username, refCode: u.ref_code || null,
          hasEmail: !!(u.email && String(u.email).trim()), tickets: [], first: Infinity };
        holders.set(uid, h);
      }
      h.play = p;
    }
  } catch (e) {
    console.error('drawing play tickets failed', e && e.message ? e.message : e);
  }
  // Group tickets: one per qualifying owner, counted from their ticket start.
  let groupsQ = new Map();
  try { groupsQ = await groupQualifiersCached(admin); } catch { groupsQ = new Map(); }
  for (const [uid, at] of groupsQ) {
    // A group that already had 2+ members counts too, the way an email added
    // before the drawing does: it is credited when the owner's tickets start.
    const s = startFor(uid, false);
    if (s == null || Math.max(at, s) > Date.parse(DRAWING.endsAt)) continue;
    let h = holders.get(uid);
    if (!h) {
      const u = byId.get(uid);
      if (!u || !u.username) continue;
      h = { referrerId: uid, username: u.username, refCode: u.ref_code || null,
        hasEmail: !!(u.email && String(u.email).trim()), tickets: [], first: Infinity };
      holders.set(uid, h);
    }
    h.groupTicket = DRAWING.group;
  }
  for (const h of holders.values()) {
    const u = byId.get(h.referrerId);
    if (u) h.hasEmail = !!(u.email && String(u.email).trim());
    h.groupTicket = h.groupTicket || 0;
    h.friends = h.tickets.length;
    h.friendEmails = h.tickets.filter((t) => t.friendEmail).length;
    h.friendTickets = h.friends * DRAWING.friendTickets + h.friendEmails * DRAWING.friendEmail;
    h.playTickets = h.play ? h.play.earned : 0;
    h.count = q4(h.friendTickets + h.playTickets + h.groupTicket);
  }

  // The drum holds only tickets whose holder can be contacted and paid.
  const eligible = [...holders.values()]
    .filter((h) => h.hasEmail)
    .sort((a, b) => b.count - a.count || a.first - b.first)
    .map((h, i) => ({ ...h, rank: i + 1 }));
  const total = q4(eligible.reduce((s, h) => s + h.count, 0));

  const field = { tickets, holders, eligible, total, ready: true };
  // A field built without fresh play totals expires in 15 seconds, not 5 minutes.
  memo = { at: partial ? Date.now() - TTL_MS + 15000 : Date.now(), field };
  return field;
}
