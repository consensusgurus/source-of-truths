// Shared leaderboard identity helpers for the quiz routes.
//
// Email is OPTIONAL. A player can join with just a display name; that identity
// is keyed by the browser's anon_id (the token sent with every game).
//
// NAME-ONLY ACCOUNTS SIGN IN FROM ANYWHERE (owner ruling, 2026-09-16). Typing a
// display name that belongs to an account with NO email signs the caller in as
// that account, on any device, with no proof. That is a deliberate trade: a
// name-only account can offer no proof by construction, and the old answer (a
// support ticket and an admin relink) cost more than the impersonation risk.
// The join forms warn that a name-only account can be used by anyone who types
// the name (EmailLockNote), and adding an email closes the door: an account
// WITH an email still needs that email to be reached from a new device. resolveQuizIdentity
// finds-or-creates the identity; attributeAnonGames links a browser's earlier
// anonymous games so the display name back-fills onto the leaderboard.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validEmail(e) {
  return typeof e === 'string' && EMAIL_RE.test(e.trim()) && e.trim().length <= 120;
}

// A display name must never be an email address. An '@' is never part of a real
// display name and almost always means a pasted email, which we keep off the
// public leaderboard.
export function looksLikeEmail(s) {
  return typeof s === 'string' && s.includes('@');
}

function cleanName(u) {
  return (typeof u === 'string' ? u.trim() : '').slice(0, 40);
}
function cleanAnon(a) {
  return typeof a === 'string' && a.trim() ? a.trim().slice(0, 64) : null;
}

// Read-only lookup used when recording a result (never creates a row).
//
// viaResults: also resolve a browser through its own ATTRIBUTED games. Needed
// since name-only sign-in: quiz_users.anon_id records only the browser that
// signed in LAST, so a player's earlier device would otherwise start posting
// guest rows the moment they sign in on a new one. The two read helpers below
// run that same fallback themselves, so they pass false to skip the repeat.
export async function findQuizIdentity(admin, { email, anonId }, { viaResults = true } = {}) {
  const mail = validEmail(email) ? email.trim() : null;
  const anon = cleanAnon(anonId);
  if (mail) {
    const { data } = await admin.from('quiz_users').select('id, username').ilike('email', mail).maybeSingle();
    if (data) return data;
  }
  if (anon) {
    const { data, error } = await admin.from('quiz_users').select('id, username').eq('anon_id', anon).maybeSingle();
    if (!error && data) return data;
    if (viaResults) {
      try {
        const { data: rows } = await admin.from('quiz_results').select('user_id')
          .eq('anon_id', anon).not('user_id', 'is', null)
          .order('id', { ascending: false }).limit(1);
        const uid = Array.isArray(rows) && rows[0] ? rows[0].user_id : null;
        if (uid) {
          const { data: u } = await admin.from('quiz_users').select('id, username').eq('id', uid).maybeSingle();
          if (u) return u;
        }
      } catch (e) { /* pre-migration columns may be absent; stay a guest */ }
    }
  }
  return null;
}

// The DIFFERENT identity that already uses this display name, or null.
// ilike pre-filters case-insensitively; any % or _ in the name only widens the
// match, so the exact lowercase compare below is the authoritative test.
//
// Returns the ROW, not a boolean, because the caller has to tell two very
// different dead ends apart -- see takenBy() below.
async function usernameHolder(admin, uname, selfId) {
  const want = (uname || '').trim().toLowerCase();
  if (!want) return null;
  const { data } = await admin.from('quiz_users').select('id, username, email').ilike('username', uname);
  if (!Array.isArray(data)) return null;
  return data.find((r) => r.id !== selfId && (r.username || '').trim().toLowerCase() === want) || null;
}

// The username_taken answer, carrying WHY the caller is stuck.
//
// A holder with an email on file can be reconnected by its owner unaided: they
// type that email, the lookup at the top of resolveQuizIdentity matches, and
// they are in on any device. A holder with NO email cannot be reached by
// anything a player can type -- the row is keyed to one browser's anon_id and
// nothing else -- so "add the email you signed up with" is advice about an email
// that does not exist, and "pick another name" is what makes the real owner
// register steinn1 beside steinni1. The join surfaces branch on this to route
// that second case to a human instead. See /api/admin/quiz-relink.
function takenBy(holder) {
  return { error: 'username_taken', holderHasEmail: !!(holder && holder.email) };
}

// Sign the caller in as a name-only account (see the header). Links THIS
// browser to it and, if the caller typed an email, back-fills it, which is what
// turns the account into one that needs proof from then on.
//
// anon_id is unique on quiz_users, so a browser that was already keyed to a
// different account (fromId) hands that link over first. The other account is
// not lost: its earlier browsers still resolve through their attributed games.
async function signInNameOnly(admin, holder, { anon, mail, fromId = null }) {
  const out = { id: holder.id, username: holder.username, email: holder.email || null };
  if (anon && fromId && fromId !== holder.id) {
    const { error } = await admin.from('quiz_users').update({ anon_id: null }).eq('id', fromId).eq('anon_id', anon);
    if (error) console.error('signInNameOnly unlink error', error);
  }
  if (anon) {
    const { error } = await admin.from('quiz_users').update({ anon_id: anon }).eq('id', holder.id);
    if (error && error.code !== '42703') console.error('signInNameOnly link error', error);
  }
  if (mail && !holder.email) {
    // 23505 = that email already belongs to another account; stay name-only.
    const { data, error } = await admin.from('quiz_users').update({ email: mail })
      .eq('id', holder.id).is('email', null).select('id, username, email').maybeSingle();
    if (!error && data) return data;
  }
  return out;
}

// Find-or-create the identity. Returns { id, username, email }, null on error,
// or { error: 'username_taken', holderHasEmail } when the display name belongs
// to someone else. holderHasEmail:false means that someone else has no email on
// file, so no email the caller types can ever reach them -- see takenBy().
export async function resolveQuizIdentity(admin, { username, email, anonId }) {
  const uname = cleanName(username);
  const mail = validEmail(email) ? email.trim() : null;
  const anon = cleanAnon(anonId);
  if (!uname) return null;

  let user = null;
  let viaMail = false;
  if (mail) {
    const { data } = await admin.from('quiz_users').select('id, username, email').ilike('email', mail).maybeSingle();
    user = data || null;
    viaMail = !!user;
  }
  if (!user && anon) {
    const { data, error } = await admin.from('quiz_users').select('id, username, email').eq('anon_id', anon).maybeSingle();
    if (!error) user = data || null;
  }

  if (user) {
    if ((user.username || '').trim().toLowerCase() !== uname.toLowerCase()) {
      const holder = await usernameHolder(admin, uname, user.id);
      if (holder) {
        // A browser signed in as one account asking for a name-only account's
        // name is switching to it. An EMAIL match is different: the caller
        // proved they own the email account, so they stay on it and the name
        // reads as someone else's.
        if (!holder.email && !viaMail) return signInNameOnly(admin, holder, { anon, mail, fromId: user.id });
        return viaMail ? { error: 'username_taken', holderHasEmail: true } : takenBy(holder);
      }
    }
    const patch = { username: uname };
    if (mail && !user.email) patch.email = mail; // back-fill an email onto a name-only account
    let { data, error } = await admin.from('quiz_users').update(patch).eq('id', user.id).select('id, username, email').single();
    if (error && error.code === '23505') {
      // that email is already taken by another account -> keep just the name change
      ({ data } = await admin.from('quiz_users').update({ username: uname }).eq('id', user.id).select('id, username, email').single());
    }
    return data || { id: user.id, username: uname, email: user.email };
  }

  // New identity (email may be null) -- unless the name is a name-only
  // account's, in which case the caller simply signs in as it.
  const holder = await usernameHolder(admin, uname, null);
  if (holder) return holder.email ? takenBy(holder) : signInNameOnly(admin, holder, { anon, mail });
  const insertRow = { username: uname, email: mail, anon_id: anon };
  let ins = await admin.from('quiz_users').insert(insertRow).select('id, username, email').single();
  if (ins.error && ins.error.code === '42703') {
    // anon_id column not present yet (pre-migration 23): insert without it
    const { anon_id, ...noAnon } = insertRow;
    ins = await admin.from('quiz_users').insert(noAnon).select('id, username, email').single();
  }
  let { data, error } = ins;
  if (error) {
    if (error.code === '23505') {
      // race: row created between the select and insert -> fetch and update name
      let q = admin.from('quiz_users').select('id, username, email');
      q = mail ? q.ilike('email', mail) : q.eq('anon_id', anon);
      const { data: d2 } = await q.maybeSingle();
      if (d2) {
        if ((d2.username || '').trim().toLowerCase() !== uname.toLowerCase()) {
          const h2 = await usernameHolder(admin, uname, d2.id);
          if (h2) return takenBy(h2);
        }
        const { data: d3 } = await admin.from('quiz_users').update({ username: uname }).eq('id', d2.id).select('id, username, email').single();
        return d3 || d2;
      }
    }
    console.error('resolveQuizIdentity insert error', error);
    return null;
  }
  return data;
}

// Link a browser's earlier anonymous games to the identity (best-effort; no-ops
// until migration 22 adds quiz_results.anon_id).
export async function attributeAnonGames(admin, anonId, user) {
  const anon = cleanAnon(anonId);
  if (!anon || !user || !user.id) return;
  const { error } = await admin
    .from('quiz_results')
    .update({ user_id: user.id, username: user.username })
    .eq('anon_id', anon)
    .is('user_id', null);
  if (error && error.code !== '42703') console.error('attributeAnonGames error', error);
}

// All browser anon_ids that belong to the same account as (anonId or email).
// Always includes the passed anonId. This is what lets a duel follow the ACCOUNT
// across devices instead of being stranded on the single browser that created
// it: a player who challenged from one browser (anon A) can see and play that
// duel from another browser (anon B) once both browsers' games are attributed
// to the same quiz_users id. Resolution order: email -> the current browser's
// attributed games -> quiz_users.anon_id, then every attributed browser anon.
export async function resolveAnonSet(admin, { anonId, email } = {}) {
  const anon = cleanAnon(anonId);
  const set = new Set();
  if (anon) set.add(anon);
  let userId = null;
  try {
    const ident = await findQuizIdentity(admin, { email, anonId: anon }, { viaResults: false });
    if (ident && ident.id) userId = ident.id;
  } catch (e) { /* ignore */ }
  if (!userId && anon) {
    try {
      const { data } = await admin.from('quiz_results').select('user_id').eq('anon_id', anon).not('user_id', 'is', null).limit(1);
      if (Array.isArray(data) && data[0] && data[0].user_id) userId = data[0].user_id;
    } catch (e) { /* pre-migration: user_id/anon_id may be absent */ }
  }
  if (userId) {
    try {
      const { data: u } = await admin.from('quiz_users').select('anon_id').eq('id', userId).maybeSingle();
      if (u && u.anon_id) set.add(u.anon_id);
    } catch (e) { /* ignore */ }
    try {
      const { data: rows } = await admin.from('quiz_results').select('anon_id').eq('user_id', userId).not('anon_id', 'is', null).limit(2000);
      for (const r of (rows || [])) if (r.anon_id) set.add(r.anon_id);
    } catch (e) { /* ignore */ }
  }
  return [...set];
}

// Every player key that belongs to the caller (2026-08-09).
//
// A result row is keyed `u:<user_id>` once it has been attributed to an account
// and `a:<anon_id>` while it has not, so ONE person's rows can carry BOTH
// shapes: the games they played on a browser they had joined from, and the games
// they played as a guest on some other device. The read routes used to resolve
// the caller to a SINGLE key (`u:` when an email resolved, else `a:`) and then
// discard every row of the other shape. That is precisely what made a game
// played on the phone show up as unplayed on the laptop.
//
// So return the whole key set rather than one key. `primary` is the key the
// caller's own standing is filed under (the account key when there is one), kept
// separate because a RANK is field-relative and can only be looked up under a
// single key; membership tests ("is this row mine?") should use `keys`.
// Deliberately does NOT delegate to resolveAnonSet: that would repeat the
// findQuizIdentity lookup this function has already done, and these three read
// routes are among the hottest on the site. Two queries when signed in (the
// identity, then the account's attributed browsers), one when not.
export async function resolvePlayerKeys(admin, { anonId, email } = {}) {
  const anon = cleanAnon(anonId);
  let ident = null;
  try {
    ident = await findQuizIdentity(admin, { email, anonId: anon }, { viaResults: false });
  } catch (e) { /* identity is best-effort; a guest still keys by anon */ }
  let userId = ident && ident.id ? ident.id : null;
  // A browser whose games were attributed to an account but whose anon_id was
  // never recorded on the user row still resolves, through its own rows.
  if (!userId && anon) {
    try {
      const { data } = await admin.from('quiz_results').select('user_id').eq('anon_id', anon).not('user_id', 'is', null).limit(1);
      if (Array.isArray(data) && data[0] && data[0].user_id) userId = data[0].user_id;
    } catch (e) { /* pre-migration: user_id/anon_id may be absent */ }
  }
  const anons = new Set();
  if (anon) anons.add(anon);
  const keys = new Set();
  if (userId) {
    keys.add(`u:${userId}`);
    try {
      const { data: rows } = await admin.from('quiz_results').select('anon_id').eq('user_id', userId).not('anon_id', 'is', null).limit(2000);
      for (const r of (rows || [])) if (r.anon_id) anons.add(r.anon_id);
    } catch (e) { /* ignore */ }
  }
  for (const a of anons) keys.add(`a:${a}`);
  return {
    userId,
    username: ident ? (ident.username || null) : null,
    primary: userId ? `u:${userId}` : (anon ? `a:${anon}` : null),
    keys,
    anons: [...anons],
  };
}

// Pick the caller's entry out of a map keyed by player key, whichever of their
// keys it happens to be filed under. `primary` wins when present, so a
// registered player's account row is preferred over a stray guest row left on
// the same browser.
export function pickMine(map, { primary, keys } = {}) {
  if (!map) return null;
  if (primary && map.has(primary)) return { key: primary, value: map.get(primary) };
  for (const k of (keys || [])) if (map.has(k)) return { key: k, value: map.get(k) };
  return null;
}

// PostgREST OR-filter matching a duel to any of the account's anon_ids on either
// side. anon_ids are UUID-ish; quote each so any stray character stays literal.
export function duelOrFilter(anons) {
  const list = (anons || []).map((a) => `"${String(a).replace(/"/g, '')}"`).join(',');
  return `challenger_anon.in.(${list}),opponent_anon.in.(${list})`;
}
