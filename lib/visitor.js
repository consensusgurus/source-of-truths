// Stable per-browser visitor identity for site-wide DAU/WAU/MAU analytics.
//
// We reuse the SAME id the quiz system already stores under localStorage
// 'sot_quiz_anon' (see getAnonId() in the quiz clients), so a person's page
// views and their quiz plays resolve to one identity. For visitors who have
// never played a quiz, the id is created on their first page view.
//
// The id is also mirrored into a first-party 'sot_vid' cookie, because the
// view-logging endpoints run on the server and can only read the identity from
// a cookie (localStorage is not sent with requests). Same-origin fetch()
// requests include the cookie automatically, so every view event — list, quiz,
// home, kids — gets attributed without threading the id through each caller.

const KEY = 'sot_quiz_anon';
const COOKIE = 'sot_vid';
// When we mint a brand-new id we stamp the time, so the domain-move handoff can tell an
// identity that was auto-created seconds ago on this very page load (safe to replace with a
// returning player's real one) from an established identity that has actually been playing
// here (must never be overwritten by a stale link). See lib/identity-handoff.js.
const BORN = 'sot_vid_born';
const FRESH_MS = 10 * 1000;
// Two years; the id is a rotating analytics identifier, not an auth token.
const MAX_AGE = 60 * 60 * 24 * 730;

export function getVisitorId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem(KEY);
    if (!a) {
      a =
        window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, a);
      try { localStorage.setItem(BORN, String(Date.now())); } catch { /* non-fatal */ }
    }
    return a;
  } catch {
    return null;
  }
}

// Ensure the sot_vid cookie carries the current visitor id. Safe to call on
// every page load; it only rewrites the cookie when needed.
// SEEN ON AN EARLIER DAY (owner, 2026-10-12: new arrivals get no new-game
// pop-ups). True only for a browser whose visitor id was minted before today's
// Eastern midnight. An id with no birth stamp predates the stamp or was adopted
// from another browser (adoptVisitorId clears it), and either way is
// established, so it counts. No id at all means this is the first page load.
// A NEWER VISITOR (owner, 2026-10-12): this browser's visitor id was minted
// within the last `days` days. An id with no birth stamp is established (see
// seenBeforeToday), so it is NOT newer; neither is a browser with no id at all
// (that cannot happen once a game has been played, which is when this is asked).
export function isNewerVisitor(days = 14) {
  if (typeof window === 'undefined') return false;
  try {
    if (!localStorage.getItem(KEY)) return false;
    const born = Number(localStorage.getItem(BORN));
    if (!born || !Number.isFinite(born)) return false;
    return Date.now() - born < days * 86400000;
  } catch {
    return false;
  }
}

export function seenBeforeToday() {
  if (typeof window === 'undefined') return false;
  try {
    if (!localStorage.getItem(KEY)) return false;
    const born = Number(localStorage.getItem(BORN));
    if (!born || !Number.isFinite(born)) return true;
    const et = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    return et(born) < et(Date.now());
  } catch {
    return false;
  }
}

export function ensureVisitorCookie() {
  if (typeof document === 'undefined') return null;
  const id = getVisitorId();
  if (!id) return null;
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
  } catch {
    /* cookies unavailable: analytics simply won't attribute this browser */
  }
  return id;
}

// True when this browser has no identity worth keeping: either none at all, or one minted
// moments ago by getVisitorId() on this same load. Anything older has real history here.
export function adoptable() {
  if (typeof window === 'undefined') return false;
  try {
    if (!localStorage.getItem(KEY)) return true;
    const born = Number(localStorage.getItem(BORN));
    return Number.isFinite(born) && Date.now() - born < FRESH_MS;
  } catch {
    return false;
  }
}

// Adopt an identity handed over from the old domain. Returns true if it was taken.
export function adoptVisitorId(id) {
  if (typeof window === 'undefined') return false;
  if (!id || !/^[\w-]{1,64}$/.test(id) || !adoptable()) return false;
  try {
    localStorage.setItem(KEY, id);
    localStorage.removeItem(BORN);   // this identity is now established, not fresh
    ensureVisitorCookie();
    return true;
  } catch {
    return false;
  }
}
