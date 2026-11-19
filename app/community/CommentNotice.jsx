'use client';

// THE COMMENT NOTICE (owner, 2026-11-19: "when your thread receives a comment,
// you get a pop-up notice, but more subtle than the new game notices, shown at
// bottom of screen with an x to exit").
//
// A small bar at the bottom of the screen, no scrim, nothing blocked behind it:
//   "Darrren1 commented on your idea "Music quiz""   [See It]  [x]
// One idea at a time (the newest); x or See It marks that idea's comments seen
// on the server, so the notice never comes back on another device.
//
// It is a reply to the player, not a pitch, so it does NOT take the one pop-up
// a visit (lib/pop-budget.js). It still keeps every timing rule:
//   - never while a puzzle is being played (gameActive());
//   - on a puzzle page, only once the finish card is up and nothing has been
//     pressed for 10 seconds, like every post-game card;
//   - never while another dialog is open, and never on the Idea Board itself
//     (the board opens and marks the thread instead);
//   - checked on arrival at a page and at most every three minutes after.

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStageTheme } from '@/lib/stage-theme';
import { gameActive, isRunPath } from '@/lib/game-active';
import { DAILY_GAMES } from '@/lib/daily-games';
import { readIdentity } from '../groups/GroupsShell';

const PLAY_PATHS = new Set(DAILY_GAMES.map((g) => g.href || `/${g.key}`));
const FINISH_SEL = '.stf, .loft-back, .dec-backdrop';
const SETTLE_MS = 4000;
const QUIET_MS = 10000;
const POLL_MS = 3 * 60 * 1000;

function onPlayRoute(path) {
  if (!path) return false;
  if (PLAY_PATHS.has(path) || isRunPath(path)) return true;
  return /^\/(quiz|kids|vs)\//.test(path);
}
function identity() {
  try { return readIdentity(); } catch (e) { return null; }
}
function otherDialogOpen() {
  try {
    if (document.documentElement.dataset.sotModal) return true;
    return !!document.querySelector('[role="dialog"], [aria-modal="true"]');
  } catch (e) { return false; }
}
async function markSeen(ids) {
  const me = identity() || {};
  try {
    await fetch('/api/community/ideas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ action: 'seen', ids, anonId: me.anonId, email: me.email || undefined }),
    });
  } catch (e) { /* the next load of the board marks it */ }
}

export default function CommentNotice() {
  const path = usePathname();
  const router = useRouter();
  const [theme] = useStageTheme();
  const [notice, setNotice] = useState(null);
  const [shown, setShown] = useState(false);
  const pending = useRef(null);     // fetched, waiting for a safe moment
  const lastFetch = useRef(0);
  const arrived = useRef(Date.now());
  const lastInput = useRef(0);
  const gone = useRef(new Set());   // ideas dismissed on this page load

  useEffect(() => {
    const on = () => { lastInput.current = Date.now(); };
    window.addEventListener('keydown', on, { capture: true, passive: true });
    window.addEventListener('pointerdown', on, { capture: true, passive: true });
    const seen = (e) => {
      const ids = (e && e.detail && e.detail.ids) || [];
      ids.forEach((id) => gone.current.add(Number(id)));
      if (pending.current && gone.current.has(pending.current.idea)) pending.current = null;
      setNotice((n) => (n && gone.current.has(n.idea) ? null : n));
    };
    window.addEventListener('sot:idea-comments-seen', seen);
    return () => {
      window.removeEventListener('keydown', on, { capture: true });
      window.removeEventListener('pointerdown', on, { capture: true });
      window.removeEventListener('sot:idea-comments-seen', seen);
    };
  }, []);

  useEffect(() => { arrived.current = Date.now(); lastFetch.current = 0; }, [path]);

  useEffect(() => {
    if (!path || path.startsWith('/admin') || path.startsWith('/community/ideas')) return undefined;
    let alive = true;
    const t = setInterval(async () => {
      if (notice || document.visibilityState === 'hidden') return;
      const me = identity();
      if (!me || !me.username || (!me.anonId && !me.email)) return;
      const now = Date.now();
      if (!pending.current && now - lastFetch.current > POLL_MS) {
        lastFetch.current = now;
        const q = new URLSearchParams();
        if (me.anonId) q.set('anonId', me.anonId);
        if (me.email) q.set('email', me.email);
        try {
          const r = await fetch(`/api/community/notices?${q.toString()}`, { cache: 'no-store' });
          const d = r.ok ? await r.json() : null;
          const list = ((d && d.notices) || []).filter((n) => !gone.current.has(n.idea));
          if (alive) pending.current = list[0] || null;
        } catch (e) { /* try again next poll */ }
      }
      if (!alive || !pending.current) return;
      if (otherDialogOpen() || gameActive()) return;
      if (now - arrived.current < SETTLE_MS) return;
      if (onPlayRoute(path)) {
        if (!document.querySelector(FINISH_SEL)) return;
        if (now - lastInput.current < QUIET_MS) return;
      }
      setNotice(pending.current);
      pending.current = null;
    }, 1000);
    return () => { alive = false; clearInterval(t); };
  }, [path, notice]);

  // Slide in on the frame after mount.
  useEffect(() => {
    if (!notice) { setShown(false); return undefined; }
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [notice]);

  if (!notice) return null;
  const close = () => {
    gone.current.add(notice.idea);
    markSeen([notice.idea]);
    setNotice(null);
  };
  const open = () => {
    gone.current.add(notice.idea);
    markSeen([notice.idea]);
    setNotice(null);
    router.push(`/community/ideas#idea-${notice.idea}`);
  };
  const who = notice.count === 1 || notice.names.length === 1
    ? `${notice.names[0]} ${notice.count === 1 ? 'commented' : `left ${notice.count} comments`}`
    : notice.names.length === 2 ? `${notice.names[0]} and ${notice.names[1]} commented` : `${notice.names[0]} and ${notice.names.length - 1} others commented`;
  const dark = theme === 'dark';

  return (
    <div className={'cmn' + (dark ? ' dk' : '') + (shown ? ' in' : '')} role="status" aria-live="polite">
      <style>{CSS}</style>
      <span className="cmn-dot" aria-hidden="true" />
      <p className="cmn-t"><b>{who}</b> on your idea <span className="cmn-q">&ldquo;{notice.title}&rdquo;</span></p>
      <button type="button" className="cmn-go" onClick={open}>See It</button>
      <button type="button" className="cmn-x" onClick={close} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

const CSS = `
.cmn{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom, 0px));z-index:8200;width:min(460px, calc(100vw - 24px));box-sizing:border-box;
  display:flex;align-items:center;gap:10px;padding:8px 8px 8px 14px;background:#ffffff;color:#0b1b2b;border:1px solid #0b1b2b;border-radius:12px;
  box-shadow:0 6px 20px rgba(11,27,43,.14);font-family:'Manrope',system-ui,-apple-system,sans-serif;
  transform:translate(-50%, 16px);opacity:0;transition:transform .22s ease-out, opacity .22s ease-out;}
.cmn.in{transform:translate(-50%, 0);opacity:1;}
.cmn.dk{background:#121826;color:#eef1f6;border-color:#eef1f6;box-shadow:0 6px 20px rgba(0,0,0,.4);}
.cmn-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#c5cdfd;box-shadow:0 0 0 1px #0b1b2b;}
.cmn.dk .cmn-dot{box-shadow:0 0 0 1px #eef1f6;}
.cmn-t{flex:1;min-width:0;margin:0;font-size:13.5px;font-weight:600;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;padding-bottom:1px;}
.cmn-t b{font-weight:800;}
.cmn-q{font-weight:700;}
.cmn-go{flex:none;min-height:34px;padding:0 12px;border:1px solid currentColor;border-radius:8px;background:#c5cdfd;color:#0b1b2b;font:inherit;font-size:13px;font-weight:800;cursor:pointer;line-height:1.3;}
.cmn.dk .cmn-go{background:color-mix(in srgb,#c5cdfd 30%,transparent);color:#eef1f6;}
.cmn-x{flex:none;width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer;opacity:.7;}
.cmn-x:hover{opacity:1;background:rgba(127,127,127,.14);}
.cmn-go:focus-visible,.cmn-x:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
@media (prefers-reduced-motion: reduce){ .cmn{transition:none;} }
`;
