// Referral capture: crediting a registered user when someone they invited
// finishes a quiz or a daily game.
//
// Flow:
//   1. A registered user shares https://mindloftdaily.com/quizzes?ref=<code>.
//   2. Any landing page runs captureRef() (mounted once via VisitorBeacon in the
//      root layout), which stores the code in the first-party 'sot_ref' cookie
//      and strips ?ref= back out of the URL so the code never leaks into the
//      visitor's own copied links, shares, or OG previews.
//   3. On the visitor's next finished game, /api/quiz/result reads that cookie
//      and writes ONE quiz_referrals row for them (see lib/referrals-server.js).
//
// A cookie is used rather than threading a prop through each board because every
// game board already posts to /api/quiz/result; the cookie rides along on that
// same-origin request automatically, so no board needs to know referrals exist.

import { SHARE_URL } from '@/lib/site';

export const REF_PARAM = 'ref';
export const REF_COOKIE = 'sot_ref';
// 30 days: long enough that an invite shared on a Friday still credits a player
// who gets around to it, short enough that the attribution stays meaningful.
export const REF_MAX_AGE = 60 * 60 * 24 * 30;

// Share codes are lowercase alphanumeric (plus - and _), which is what the
// migration's slug backfill produces. Anything else is not a code we issued.
export function normalizeRefCode(raw) {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  return code || null;
}

export function refShareUrl(code, path = '/') {
  const c = normalizeRefCode(code);
  if (!c) return null;
  return `${SHARE_URL}${path}?${REF_PARAM}=${encodeURIComponent(c)}`;
}

export function readRefCookie() {
  if (typeof document === 'undefined') return null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)sot_ref=([^;]*)/);
    return m ? normalizeRefCode(decodeURIComponent(m[1])) : null;
  } catch {
    return null;
  }
}

// Store ?ref= if present, then clean it out of the address bar. Safe to call on
// every page load. Returns the captured code, or null when there was none.
//
// First code wins: an existing cookie is NOT overwritten, so whoever actually
// introduced the visitor keeps the credit even if a later link reaches them.
export function captureRef() {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const code = normalizeRefCode(url.searchParams.get(REF_PARAM));
    if (!code) return null;
    if (!readRefCookie()) {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${REF_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${REF_MAX_AGE}; SameSite=Lax${secure}`;
    }
    url.searchParams.delete(REF_PARAM);
    const qs = url.searchParams.toString();
    window.history.replaceState({}, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
    return code;
  } catch {
    /* no cookies / no history API: referrals simply don't attribute here */
    return null;
  }
}

// ---------------------------------------------------------------------------
// The viewer's OWN code, for stamping their share links.
//
// Cached in localStorage so the ~24 share surfaces across the site can append it
// synchronously with no per-board network call. It is resolved once per browser
// (ensureMyRefCode, called from VisitorBeacon) and refreshed on join.
// ---------------------------------------------------------------------------
export const MY_CODE_KEY = 'sot_ref_code';

export function myRefCode() {
  if (typeof window === 'undefined') return null;
  try { return normalizeRefCode(localStorage.getItem(MY_CODE_KEY)); } catch { return null; }
}

export function setMyRefCode(code) {
  const c = normalizeRefCode(code);
  if (!c || typeof window === 'undefined') return null;
  try { localStorage.setItem(MY_CODE_KEY, c); } catch { /* private mode */ }
  return c;
}

// Stamp a share URL with the viewer's referral code. Returns the url untouched
// for a signed-out visitor, so share links keep working for everyone.
// Handles bare hosts ("mindloftdaily.com/carve"), existing query strings, and
// trailing hashes, and never double-stamps.
export function withRef(url) {
  const code = myRefCode();
  if (!code || !url || typeof url !== 'string') return url;
  if (/[?&]ref=/.test(url)) return url;
  const hashAt = url.indexOf('#');
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  return `${base}${base.includes('?') ? '&' : '?'}${REF_PARAM}=${encodeURIComponent(code)}${hash}`;
}

// Resolve and cache the viewer's code. No-ops for a signed-out visitor and for
// anyone already cached, so this costs at most one request per browser.
export async function ensureMyRefCode() {
  if (typeof window === 'undefined') return null;
  const cached = myRefCode();
  if (cached) return cached;
  let ident = null;
  try { ident = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); } catch { /* ignore */ }
  if (!ident || !ident.username) return null;
  let anon = '';
  try { anon = localStorage.getItem('sot_quiz_anon') || ''; } catch { /* ignore */ }
  try {
    const r = await fetch(`/api/quiz/referrals${anon ? `?anonId=${encodeURIComponent(anon)}` : ''}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d?.me?.code ? setMyRefCode(d.me.code) : null;
  } catch {
    return null;
  }
}
