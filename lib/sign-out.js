// LOG OUT (owner, 2026-11-06: a player typed the wrong details and had no way
// to start over on that device).
//
// A signed-in browser is two things, and BOTH have to go:
//   * sot_quiz_identity, the { username, email } every client reads to show
//     who is playing and to prefill forms.
//   * sot_quiz_anon (mirrored into the sot_vid cookie), the browser id sent
//     with every game. The server finds an account by that id on its own
//     (findQuizIdentity / resolveQuizIdentity match quiz_users.anon_id), so
//     clearing only the identity would leave every next game still credited to
//     the old account, and the next join would RENAME that account instead of
//     starting a fresh one. So the browser gets a brand new id.
//
// The cached referral code belongs to the old account too, so it goes.
//
// What stays: the boards on this device (sot_<key>_<num>), the page look and
// every other preference. Games already played stay on the old account, which
// is the honest outcome: they were played signed in as it.
const IDENTITY = 'sot_quiz_identity';
const ANON = 'sot_quiz_anon';
const BORN = 'sot_vid_born';
const REF_CODE = 'sot_ref_code';
const COOKIE = 'sot_vid';
const MAX_AGE = 60 * 60 * 24 * 730;

function freshId() {
  try {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) { /* fall through */ }
  return `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function signOut() {
  if (typeof window === 'undefined') return false;
  try {
    const ls = window.localStorage;
    ls.removeItem(IDENTITY);
    ls.removeItem(REF_CODE);
    const id = freshId();
    ls.setItem(ANON, id);
    // No birth stamp: this browser is not a new visitor (lib/visitor.js reads
    // an unstamped id as established), so it keeps the pop-up treatment it had.
    ls.removeItem(BORN);
    try {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
    } catch (e) { /* cookies unavailable */ }
    return true;
  } catch (e) {
    return false;
  }
}

export default signOut;
