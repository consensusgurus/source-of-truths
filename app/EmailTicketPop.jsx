'use client';

// THE EMAIL TICKET POP-UP (owner, 2026-10-21): "Players who haven't given email
// should get a pop up offering them a ticket after a few seconds on the site,
// but not while actively playing a puzzle."
//
// Who sees it: anyone with no email in this browser's identity (guests and
// name-only players), while the drawing runs, at most once every three days
// after it is dismissed, and never again once an email is added.
//
// When:
//   - on an ordinary page, after SETTLE_MS on that page;
//   - on a puzzle page (a daily, a quiz, a run), ONLY once the game is over: the
//     finish card is up and nothing has been pressed for QUIET_MS, the same
//     rule as every post-game pop-up (lib/post-game-gate.js). A game that is
//     never finished never shows it.
//   - never on top of another dialog; it waits until that one closes.
//
// The form posts to /api/quiz/join, the site's one join route, which creates
// the account or back-fills the email onto a name-only one.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DRAWING, DRAWING_COPY, drawingIsLive } from '@/lib/drawing';
import { DAILY_GAMES } from '@/lib/daily-games';
import { useStageTheme } from '@/lib/stage-theme';
import { ensureMyRefCode } from '@/lib/referrals';
import { gameActive, isRunPath } from '@/lib/game-active';

const KEY = 'sot_email_ticket_until';
const HIDE_MS = 3 * 24 * 60 * 60 * 1000;
const SETTLE_MS = 6000;
const QUIET_MS = 10000;
const FINISH_SEL = '.stf, .loft-back, .dec-backdrop';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLAY_PATHS = new Set(DAILY_GAMES.map((g) => g.href));

function onPlayRoute(path) {
  if (!path) return false;
  if (PLAY_PATHS.has(path) || isRunPath(path)) return true;
  return /^\/(quiz|kids|vs)\//.test(path) || /^\/circuits\/[^/]+\/run/.test(path);
}
function identity() {
  try { return JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null') || null; } catch (e) { return null; }
}
function hasEmail() {
  const id = identity();
  return !!(id && id.email && String(id.email).trim());
}
function hiddenNow() {
  try { const u = Number(localStorage.getItem(KEY) || 0); return !!u && Date.now() < u; } catch (e) { return false; }
}
// ONLY AFTER ONE FULL GAME (owner, 2026-10-26): the offer waits until this
// browser has finished a game, flagged by app/ResultQueue.jsx when a finished
// (not abandoned) result is saved.
function finishedOne() {
  try { return localStorage.getItem('sot_finished_one') === '1'; } catch (e) { return false; }
}
function otherDialogOpen() {
  try {
    if (document.documentElement.dataset.sotModal) return true;
    return !!document.querySelector('[role="dialog"]:not(.etp), [aria-modal="true"]:not(.etp)');
  } catch (e) { return false; }
}

export default function EmailTicketPop() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [named, setNamed] = useState(false);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [theme] = useStageTheme();
  const arrived = useRef(Date.now());
  const lastInput = useRef(0);

  // Track input for the quiet rule.
  useEffect(() => {
    const on = () => { lastInput.current = Date.now(); };
    window.addEventListener('keydown', on, { capture: true, passive: true });
    window.addEventListener('pointerdown', on, { capture: true, passive: true });
    return () => {
      window.removeEventListener('keydown', on, { capture: true });
      window.removeEventListener('pointerdown', on, { capture: true });
    };
  }, []);

  // The clock restarts on every page.
  useEffect(() => { arrived.current = Date.now(); }, [path]);

  useEffect(() => {
    if (open || done) return undefined;
    if (!path || path.startsWith('/admin')) return undefined;
    const t = setInterval(() => {
      if (!drawingIsLive() || hasEmail() || hiddenNow() || !finishedOne()) return;
      if (document.visibilityState === 'hidden' || otherDialogOpen()) return;
      if (gameActive()) return;
      const now = Date.now();
      if (now - arrived.current < SETTLE_MS) return;
      if (onPlayRoute(path)) {
        if (!document.querySelector(FINISH_SEL)) return;
        if (now - lastInput.current < QUIET_MS) return;
      } else if (now - lastInput.current < 1500) return;
      const id = identity();
      setNamed(!!(id && id.username));
      setName(id && id.username ? id.username : '');
      setOpen(true);
    }, 1000);
    return () => clearInterval(t);
  }, [path, open, done]);

  useEffect(() => {
    if (!open) return undefined;
    const html = document.documentElement;
    html.dataset.sotModal = '1';
    const k = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); delete html.dataset.sotModal; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    try { localStorage.setItem(KEY, String(Date.now() + HIDE_MS)); } catch (e) { /* ignore */ }
    setOpen(false);
  }

  async function submit(e) {
    if (e) e.preventDefault();
    const n = name.trim();
    const m = email.trim();
    if (!n || n.length > 15) { setMsg('Pick a display name (max 15 characters).'); return; }
    if (!EMAIL_RE.test(m)) { setMsg('Enter a valid email.'); return; }
    setBusy(true);
    setMsg('');
    try {
      let anonId = '';
      try { anonId = localStorage.getItem('sot_quiz_anon') || ''; } catch (err) { /* ignore */ }
      const res = await fetch('/api/quiz/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: n, email: m, anonId: anonId || undefined }),
      });
      const d = await res.json();
      if (d.error) { setMsg(d.error); setBusy(false); return; }
      if (!d.email) { setMsg('That email is already on another account. Try a different one.'); setBusy(false); return; }
      try { localStorage.setItem('sot_quiz_identity', JSON.stringify({ username: d.username, email: d.email })); } catch (err) { /* ignore */ }
      ensureMyRefCode();
      setDone(true);
      setBusy(false);
      // The cap's ticket count re-reads on this event (app/ChallengeBack.jsx).
      try { window.dispatchEvent(new Event('sot:challenge-sent')); } catch (err) { /* ignore */ }
      setTimeout(() => setOpen(false), 2600);
    } catch (err) {
      setMsg('Could not save that right now. Try again in a moment.');
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="etp-scrim" data-etp-theme={theme} onClick={dismiss}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="etp" role="dialog" aria-modal="true" aria-labelledby="etp-h" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="etp-x" aria-label="Close" onClick={dismiss}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="etp-eb">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 17v2M13 11v2" /></svg>
          The {DRAWING.prizeLabel} Drawing · Through {DRAWING.endLabel}
        </div>
        {done ? (
          <>
            <h2 id="etp-h">Your ticket is in.</h2>
            <p className="etp-p">From now on your streaks, wins and the friends you bring in earn tickets too.</p>
          </>
        ) : (
          <>
            <h2 id="etp-h">Get a free ticket.</h2>
            <p className="etp-p">{DRAWING_COPY.emailOffer}</p>
            <form className="etp-f" onSubmit={submit} noValidate>
              {named ? (
                <p className="etp-as">Adding it to <b>{name}</b></p>
              ) : (
                <>
                  <label htmlFor="etp-n">Display name</label>
                  <input id="etp-n" type="text" maxLength={15} autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} />
                </>
              )}
              <label htmlFor="etp-e">Email</label>
              <input id="etp-e" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {msg ? <p className="etp-err" role="alert">{msg}</p> : null}
              <button type="submit" className="etp-go" disabled={busy}>{busy ? 'Saving...' : 'Add email, get my ticket'}</button>
              <button type="button" className="etp-no" onClick={dismiss}>Not now</button>
            </form>
            <p className="etp-fine">No purchase necessary. Free to enter, {DRAWING.minAge}+. Drawn {DRAWING.drawLabel}.</p>
          </>
        )}
      </div>
    </div>
  );
}

// The stage's own values for both registers, mirrored (this sits outside any
// .stage-page). Gold is the colour the site gives tickets.
const CSS = `
.etp-scrim{--b-raise:#0e131f;--b-line:hsla(0,0%,100%,.11);--b-line2:hsla(0,0%,100%,.24);--b-surf:hsla(0,0%,100%,.045);--b-surf2:hsla(0,0%,100%,.08);--b-ink:#e9edf4;--b-ink2:#aab5c7;--b-mute:#8b95a8;--b-acc:#e9edf4;--b-acc-ink:#0b0f1a;--b-gold:#f5c84c;--b-bad:#fb7185;
  position:fixed;inset:0;z-index:8300;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(11,15,26,.55);font-family:'Manrope',system-ui,-apple-system,sans-serif}
html:not([data-stage-boot='dark']) .etp-scrim[data-etp-theme='light']{--b-raise:#ffffff;--b-line:rgba(11,15,26,.14);--b-line2:rgba(11,15,26,.24);--b-surf:#ffffff;--b-surf2:#e4e9f1;--b-ink:#0b0d12;--b-ink2:#3f4757;--b-mute:#5f6774;--b-acc:#0b0d12;--b-acc-ink:#ffffff;--b-gold:#8a5a00;--b-bad:#be123c}
.etp{position:relative;width:min(420px,100%);max-height:calc(100vh - 36px);overflow:auto;background:var(--b-raise);color:var(--b-ink);border:2px solid var(--b-ink);border-top:6px solid #e8b43a;border-radius:16px;padding:20px 22px 16px;box-shadow:0 24px 60px -20px rgba(0,0,0,.45);animation:etp-in .24s ease-out}
@keyframes etp-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.etp{animation:none}}
.etp-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:var(--b-mute);cursor:pointer;display:flex;align-items:center;justify-content:center}
.etp-x:hover{background:var(--b-surf2);color:var(--b-ink)}
.etp-eb{display:flex;align-items:center;gap:8px;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--b-gold);padding-right:36px}
.etp h2{margin:10px 0 6px;font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.15}
.etp-p{margin:0 0 14px;font-size:13.5px;line-height:1.5;color:var(--b-ink2)}
.etp-f{display:flex;flex-direction:column;gap:6px}
.etp-f label{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--b-mute);margin-top:4px}
.etp-f input{height:46px;box-sizing:border-box;border:2px solid var(--b-ink);border-radius:10px;padding:0 12px;font-family:inherit;font-size:16px;color:var(--b-ink);background:var(--b-surf)}
.etp-f input:focus{outline:2px solid var(--b-acc);outline-offset:1px}
.etp-as{margin:0 0 2px;font-size:13px;color:var(--b-ink2)}
.etp-as b{color:var(--b-ink)}
.etp-err{margin:4px 0 0;font-size:13px;font-weight:700;color:var(--b-bad)}
.etp-go{margin-top:10px;height:46px;border:0;border-radius:10px;background:var(--b-acc);color:var(--b-acc-ink);font-family:inherit;font-size:15px;font-weight:800;cursor:pointer}
.etp-go:disabled{opacity:.6;cursor:default}
.etp-no{height:40px;border:0;border-radius:10px;background:transparent;color:var(--b-mute);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}
.etp-no:hover{background:var(--b-surf2);color:var(--b-ink)}
.etp-fine{margin:6px 0 0;font-size:11.5px;line-height:1.5;color:var(--b-mute);text-align:center}
`;
