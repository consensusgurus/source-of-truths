'use client';

// THE PHOTO REVIEW NOTICE (owner, 2026-11-27: how does a player know their Community Photo was
// approved? "use option 1": a notice on their next visit). The same quiet bottom bar as the
// Idea Board comment notice (app/community/CommentNotice.jsx), with an x:
//   "Jaz and Juno is now on Community Photos"            [See It]  [x]
//   "Jaz and Juno was not approved for Community Photos"  [Your Photos]  [x]
//
// Only on the device the puzzle was made on: it reads this device's uploads (sot_photo_puzzles)
// and what it last knew of each (sot_photo_status), checks only the ones last seen 'pending',
// and tells the player once when one is approved or turned down. Not in the one-pop-up-a-visit
// budget; keeps every timing rule of the comment notice (never mid game, never over a dialog,
// on a puzzle page only after the finish card and 10 quiet seconds). Checked on arrival and at
// most every five minutes after.

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStageTheme } from '@/lib/stage-theme';
import { gameActive, isRunPath } from '@/lib/game-active';
import { DAILY_GAMES } from '@/lib/daily-games';
import { MINE_KEY, readStatuses, noteStatus } from '@/lib/photo-puzzle-shared';

const PLAY_PATHS = new Set(DAILY_GAMES.map((g) => g.href || `/${g.key}`));
const FINISH_SEL = '.stf, .loft-back, .dec-backdrop';
const SETTLE_MS = 4000;
const QUIET_MS = 10000;
const POLL_MS = 5 * 60 * 1000;

function onPlayRoute(path) {
  if (!path) return false;
  if (PLAY_PATHS.has(path) || isRunPath(path)) return true;
  return /^\/(quiz|kids|vs)\//.test(path);
}
function otherDialogOpen() {
  try {
    if (document.documentElement.dataset.sotModal) return true;
    return !!document.querySelector('[role="dialog"], [aria-modal="true"]');
  } catch (e) { return false; }
}
function waitingCodes() {
  const st = readStatuses();
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem(MINE_KEY) || '[]'); if (!Array.isArray(mine)) mine = []; } catch (e) { mine = []; }
  return mine.filter((x) => x && x.code && st[x.code] === 'pending').map((x) => x.code);
}

export default function PhotoNotice() {
  const path = usePathname();
  const router = useRouter();
  const [theme] = useStageTheme();
  const [notice, setNotice] = useState(null);
  const [shown, setShown] = useState(false);
  const pending = useRef([]);       // decided ones, waiting for a safe moment
  const lastFetch = useRef(0);
  const arrived = useRef(Date.now());
  const lastInput = useRef(0);

  useEffect(() => {
    const on = () => { lastInput.current = Date.now(); };
    window.addEventListener('keydown', on, { capture: true, passive: true });
    window.addEventListener('pointerdown', on, { capture: true, passive: true });
    return () => {
      window.removeEventListener('keydown', on, { capture: true });
      window.removeEventListener('pointerdown', on, { capture: true });
    };
  }, []);

  useEffect(() => { arrived.current = Date.now(); }, [path]);

  useEffect(() => {
    if (!path || path.startsWith('/admin') || path.startsWith('/jigsaw/review')) return undefined;
    let alive = true;
    const t = setInterval(async () => {
      if (notice || document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (!pending.current.length && now - lastFetch.current > POLL_MS) {
        lastFetch.current = now;
        const codes = waitingCodes();
        if (codes.length) {
          try {
            const r = await fetch('/api/photo-puzzles', {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ action: 'mine', items: codes.map((code) => ({ code })) }),
            });
            const d = r.ok ? await r.json() : null;
            const decided = ((d && d.items) || []).filter((x) => x.status === 'approved' || x.status === 'declined');
            if (alive) pending.current = decided;
          } catch (e) { /* try again next poll */ }
        }
      }
      if (!alive || !pending.current.length) return;
      if (otherDialogOpen() || gameActive()) return;
      if (now - arrived.current < SETTLE_MS) return;
      if (onPlayRoute(path)) {
        if (!document.querySelector(FINISH_SEL)) return;
        if (now - lastInput.current < QUIET_MS) return;
      }
      const next = pending.current.shift();
      noteStatus(next.code, next.status);   // told once, on this device
      setNotice(next);
    }, 1000);
    return () => { alive = false; clearInterval(t); };
  }, [path, notice]);

  useEffect(() => {
    if (!notice) { setShown(false); return undefined; }
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [notice]);

  if (!notice) return null;
  const ok = notice.status === 'approved';
  const close = () => setNotice(null);
  const open = () => {
    setNotice(null);
    router.push(ok && notice.slug ? `/jigsaw/community/${notice.slug}` : '/jig/shelf?tab=yours');
  };
  const dark = theme === 'dark';
  return (
    <div className={'phn' + (dark ? ' dk' : '') + (shown ? ' in' : '')} role="status" aria-live="polite">
      <style>{CSS}</style>
      <span className="phn-dot" aria-hidden="true" />
      <p className="phn-t">
        <b>&ldquo;{notice.name}&rdquo;</b> {ok ? 'is now on Community Photos.' : 'was not approved for Community Photos, so its link is off.'}
      </p>
      <button type="button" className="phn-go" onClick={open}>{ok ? 'See It' : 'Your Photos'}</button>
      <button type="button" className="phn-x" onClick={close} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

const CSS = `
.phn{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom, 0px));z-index:8190;width:min(460px, calc(100vw - 24px));box-sizing:border-box;
  display:flex;align-items:center;gap:10px;padding:8px 8px 8px 14px;background:#ffffff;color:#0b1b2b;border:1px solid #0b1b2b;border-radius:12px;
  box-shadow:0 6px 20px rgba(11,27,43,.14);font-family:'Manrope',system-ui,-apple-system,sans-serif;
  transform:translate(-50%, 16px);opacity:0;transition:transform .22s ease-out, opacity .22s ease-out;}
.phn.in{transform:translate(-50%, 0);opacity:1;}
.phn.dk{background:#121826;color:#eef1f6;border-color:#eef1f6;box-shadow:0 6px 20px rgba(0,0,0,.4);}
.phn-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#f3d98b;box-shadow:0 0 0 1px #0b1b2b;}
.phn.dk .phn-dot{box-shadow:0 0 0 1px #eef1f6;}
.phn-t{flex:1;min-width:0;margin:0;font-size:13.5px;font-weight:600;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;padding-bottom:1px;}
.phn-t b{font-weight:800;}
.phn-go{flex:none;min-height:34px;padding:0 12px;border:1px solid currentColor;border-radius:8px;background:#f3d98b;color:#0b1b2b;font:inherit;font-size:13px;font-weight:800;cursor:pointer;line-height:1.3;}
.phn.dk .phn-go{background:color-mix(in srgb,#f3d98b 30%,transparent);color:#eef1f6;}
.phn-x{flex:none;width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer;opacity:.7;}
.phn-x:hover{opacity:1;background:rgba(127,127,127,.14);}
.phn-go:focus-visible,.phn-x:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
@media (prefers-reduced-motion: reduce){ .phn{transition:none;} }
`;
