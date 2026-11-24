'use client';

// HELP US GROW (owner, 2026-11-23): "If you like our site, please help us grow
// while boosting your odds at winning $500." Mocked up on the Design canvas
// "Mind Loft: Help Us Grow pop-up" and approved the same night with: "a few
// seconds after first load, in place of new game alert ... move it to front of
// queue for everyone."
//
// WHEN IT SHOWS
//   - while the drawing is live (lib/drawing.js), once a week per browser;
//   - FRONT OF THE QUEUE: on mount it holds the visit's one pop-up
//     (lib/pop-budget.js holdPop), so the new-game card (app/PremierePop.jsx)
//     and every other self-opening card stand down for this visit and keep
//     their turn for the next one (they never stamp);
//   - it opens OPEN_AT after load, never mid game (gameActive), never over the
//     entry door or another dialog, never inside a run, and not within 1.5s of
//     the reader's last click or key;
//   - if a game is already under way at that moment it lets the hold go and
//     waits for the game to finish, then opens after the usual ten quiet
//     seconds (lib/post-game-gate.js);
//   - a visit the entry door owns (first visit, then weekly) is left alone; the
//     card takes the next visit.
// `?grow=1` previews it anywhere without stamping.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import MindLoftMark from './MindLoftMark';
import { SHARE_URL } from '@/lib/site';
import { withRef, ensureMyRefCode } from '@/lib/referrals';
import { readRunParam } from '@/lib/circuits';
import { readStageTheme } from '@/lib/stage-theme';
import { afterGameConcludes, trackPostGame } from '@/lib/post-game-gate';
import { drawingIsLive, formatTickets } from '@/lib/drawing';
import { gameActive } from '@/lib/game-active';
import { claimPop, holdPop, releasePop, popSpent } from '@/lib/pop-budget';

const ID = 'grow';
const LAST_KEY = 'sot_grow_last';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_AT = 3500;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

function shownThisWeek() {
  try {
    const last = parseInt(localStorage.getItem(LAST_KEY) || '', 10);
    return Number.isFinite(last) && Date.now() - last < WEEK_MS;
  } catch (e) { return true; }
}

function identity() {
  try {
    const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
    return id && id.username ? id : null;
  } catch (e) { return null; }
}

function blockedHere() {
  try {
    const p = window.location.pathname || '/';
    if (readRunParam()) return true;
    if (/^\/(circuits|pricecheck|judged|dojo|dojocolor|crossed|room|spacecadet|duediligence|eagleeye|oddjobs|admin|daily-five|run)(\/|$)/.test(p)) return true;
  } catch (e) { return true; }
  return false;
}

function busy() {
  try {
    if (document.documentElement.dataset.sotModal) return true;
    return !!document.querySelector('.ent-door, .gpp-scrim, .stg-tpop, .gnp-bd, [role="dialog"][aria-modal="true"]');
  } catch (e) { return true; }
}

const bare = (u) => String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

export default function GrowPop() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [who, setWho] = useState(null);
  const [link, setLink] = useState(SHARE_URL);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const closeRef = useRef(null);
  const preview = useRef(false);
  const lastInput = useRef(0);

  const show = useCallback(async () => {
    const id = identity();
    setWho(id);
    if (!preview.current) { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {} }
    try { setDark(readStageTheme() === 'dark'); } catch (e) {}
    try { setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'); } catch (e) {}
    try { window.__sotPopAt = Date.now(); } catch (e) {}
    setCopied(false);
    setOpen(true);
    if (id) {
      try { await Promise.race([ensureMyRefCode(), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
      setLink(withRef(SHARE_URL + '/'));
    }
    const qs = new URLSearchParams({ limit: '1' });
    try {
      const anon = localStorage.getItem('sot_quiz_anon') || '';
      if (anon) qs.set('anonId', anon);
      if (id && id.email) qs.set('email', id.email);
    } catch (e) {}
    fetch(`/api/quiz/drawing?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!d) return; setData(d); if (d.me && d.me.shareUrl) setLink(d.me.shareUrl); })
      .catch(() => {});
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Input clock, for the 1.5s quiet rule.
  useEffect(() => {
    const on = () => { lastInput.current = Date.now(); };
    window.addEventListener('keydown', on, { capture: true, passive: true });
    window.addEventListener('pointerdown', on, { capture: true, passive: true });
    return () => {
      window.removeEventListener('keydown', on, { capture: true });
      window.removeEventListener('pointerdown', on, { capture: true });
    };
  }, []);

  // A few seconds after load, first in the queue.
  useEffect(() => {
    trackPostGame();
    let q = null;
    try { q = new URLSearchParams(window.location.search).get('grow'); } catch (e) {}
    if (q === '1') {
      preview.current = true;
      const t = setTimeout(() => show(), 400);
      return () => clearTimeout(t);
    }
    if (q === '0' || !drawingIsLive() || shownThisWeek() || blockedHere()) return undefined;
    // The entry door already owns this visit: leave it, take the next one.
    if (popSpent(ID)) return undefined;
    holdPop(ID, 15000);
    let alive = true;
    let cancel = null;
    const timers = [];
    const started = Date.now();
    const tick = () => {
      if (!alive) return;
      if (shownThisWeek() || blockedHere()) { releasePop(ID); return; }
      if (gameActive()) {
        // Already playing: wait for the game to end (ten quiet seconds after).
        releasePop(ID);
        cancel = afterGameConcludes(() => {
          if (!alive || shownThisWeek() || blockedHere() || busy()) return;
          if (!claimPop(ID)) return;
          show();
        });
        return;
      }
      const quiet = Date.now() - lastInput.current >= 1500;
      if ((busy() || !quiet) && Date.now() - started < 15000) { timers.push(setTimeout(tick, 400)); return; }
      if (busy() || !quiet) { releasePop(ID); return; }
      releasePop(ID);
      if (!claimPop(ID)) return;   // one pop-up a visit
      show();
    };
    timers.push(setTimeout(tick, OPEN_AT));
    return () => { alive = false; timers.forEach(clearTimeout); if (cancel) cancel(); releasePop(ID); };
  }, [show]);

  useEffect(() => {
    if (!open) return undefined;
    const html = document.documentElement;
    html.dataset.sotModal = '1';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const f = setTimeout(() => { try { closeRef.current && closeRef.current.focus(); } catch (e) {} }, 30);
    return () => { clearTimeout(f); window.removeEventListener('keydown', onKey); delete html.dataset.sotModal; };
  }, [open, close]);

  if (!open) return null;

  const me = data && data.me;
  const total = data ? data.total : null;
  const mine = me ? me.count : 0;

  const msg = `I've been playing the free daily puzzles on Mind Loft. Come play: ${link}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = link; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); setCopied(true);
      } catch (e2) {}
    }
  };
  const share = async () => {
    if (canShare) {
      try { await navigator.share({ title: 'Mind Loft', text: "I've been playing the free daily puzzles on Mind Loft. Come play:", url: link }); return; } catch (e) { return; }
    }
    window.location.href = `sms:?&body=${encodeURIComponent(msg)}`;
  };

  return (
    <div className={`grw-bd${dark ? ' dk' : ''}`} onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="grw" role="dialog" aria-modal="true" aria-labelledby="grw-h" onClick={(e) => e.stopPropagation()}>
        <button type="button" ref={closeRef} className="grw-x" onClick={close} aria-label="Close">
          <X size={18} strokeWidth={2.4} />
        </button>
        <div className="grw-brand"><MindLoftMark size={20} ink={dark ? '#e9edf4' : '#0b0c0e'} accent="#7dd3fc" title="" /><span>Mind Loft</span></div>

        <div className="grw-tk">
          <span className="grw-notch l" aria-hidden="true" />
          <span className="grw-notch r" aria-hidden="true" />
          <div>
            <div className="grw-tk-e">The year end drawing</div>
            <div className="grw-tk-p">$500</div>
          </div>
          <div className="grw-tk-r">
            <div className="grw-tk-s">{who ? 'Your tickets' : 'Tickets so far'}</div>
            <div className="grw-tk-n">{who ? formatTickets(mine) : (total == null ? ' ' : formatTickets(total))}</div>
            <div className="grw-tk-s">Drawn Dec 31</div>
          </div>
        </div>

        <h2 className="grw-h" id="grw-h">Like Mind Loft? Help it grow.</h2>
        <p className="grw-p">Every friend you bring in is two more chances at $500. It is free, and it is the best way to keep the puzzles coming.</p>

        <ul className="grw-ways">
          <li><div><b>Invite a friend</b><i>Counts once they play their first game</i></div><em>+2</em></li>
          <li><div><b>They add an email</b><i>A thank you for sticking around</i></div><em>+{'\u00bd'}</em></li>
          <li><div><b>Their friends join too</b><i>Every link down the chain, as far as it goes</i></div><em>+{'\u00bc'} each</em></li>
        </ul>

        {who ? (
          <>
            <label className="grw-lab" htmlFor="grw-link">Your invite link</label>
            <div className="grw-row">
              <input id="grw-link" className="grw-link" readOnly value={bare(link)} onFocus={(e) => e.target.select()} />
              <button type="button" className="grw-copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
            {me && !me.eligible ? <p className="grw-warn">Add an email to your account so your tickets go in the drum.</p> : null}
            <button type="button" className="grw-cta" onClick={share}>Share with a friend</button>
          </>
        ) : (
          <a className="grw-cta" href="/?signup=1">Pick a player name to get your link</a>
        )}

        <div className="grw-foot">
          <a href="/quizzes/community#drawing">See all ways to earn</a>
          <button type="button" onClick={close}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.grw-bd{position:fixed;inset:0;z-index:4100;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;
  background:rgba(11,12,14,.55);animation:grwfade .18s ease-out;font-family:${SANS};
  --g-card:#fff;--g-ink:#0b0c0e;--g-ink2:#4a5160;--g-line:#0b0c0e;--g-rule:rgba(11,15,26,.14);--g-field:#f4f6f9;
  --g-tk:#b1e5fd;--g-tkink:#08222e;--g-btn:#0b0c0e;--g-btnink:#fff;--g-mark:#0b0c0e;--g-warn:#9a3412}
.grw-bd.dk{background:rgba(0,0,0,.6);
  --g-card:#141a28;--g-ink:#e9edf4;--g-ink2:#aab5c7;--g-line:rgba(255,255,255,.17);--g-rule:rgba(255,255,255,.11);--g-field:rgba(255,255,255,.045);
  --g-btn:#b1e5fd;--g-btnink:#08222e;--g-mark:#b1e5fd;--g-warn:#fdba74}
.grw{position:relative;width:100%;max-width:440px;max-height:calc(100vh - 48px);overflow-y:auto;box-sizing:border-box;
  background:var(--g-card);color:var(--g-ink);border:1px solid var(--g-line);border-radius:18px;padding:28px 28px 20px;
  box-shadow:0 24px 60px rgba(0,0,0,.28);animation:grwrise .22s ease-out}
.grw-x{position:absolute;top:12px;right:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  background:transparent;border:0;border-radius:10px;color:var(--g-ink2);cursor:pointer}
.grw-x:hover{color:var(--g-ink)}
.grw-brand{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:13px;font-weight:800;color:var(--g-ink)}
.grw-tk{position:relative;overflow:hidden;background:var(--g-tk);color:var(--g-tkink);border-radius:14px;padding:18px 22px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
.grw-notch{position:absolute;top:50%;width:22px;height:22px;margin-top:-11px;border-radius:50%;background:var(--g-card)}
.grw-notch.l{left:-11px}.grw-notch.r{right:-11px}
.grw-tk-e{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;line-height:1.4}
.grw-tk-p{font-size:56px;font-weight:800;letter-spacing:-.03em;line-height:1.1}
.grw-tk-r{text-align:right}
.grw-tk-s{font-size:11.5px;font-weight:700;line-height:1.4}
.grw-tk-n{font-size:30px;font-weight:800;line-height:1.15}
.grw-h{margin:0 40px 0 0;font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.2;color:var(--g-ink)}
.grw-p{margin:8px 0 6px;font-size:15px;line-height:1.5;color:var(--g-ink2)}
.grw-ways{list-style:none;margin:4px 0 18px;padding:0}
.grw-ways li{display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid var(--g-rule)}
.grw-ways li:last-child{border-bottom:0}
.grw-ways li div{flex:1;min-width:0}
.grw-ways b{display:block;font-size:14.5px;font-weight:700;line-height:1.35;color:var(--g-ink)}
.grw-ways i{display:block;font-style:normal;font-size:12.5px;line-height:1.45;margin-top:2px;color:var(--g-ink2)}
.grw-ways em{flex:none;font-style:normal;font-size:14px;font-weight:800;line-height:1.3;color:var(--g-tkink);background:var(--g-tk);border-radius:999px;padding:5px 11px}
.grw-lab{display:block;font-size:12px;font-weight:700;color:var(--g-ink2);margin-bottom:6px}
.grw-row{display:flex;gap:8px;margin-bottom:12px}
.grw-link{flex:1;min-width:0;height:46px;box-sizing:border-box;border:1px solid var(--g-line);border-radius:10px;background:var(--g-field);
  color:var(--g-ink);font-family:${SANS};font-size:14px;font-weight:600;padding:0 12px}
.grw-copy{flex:none;height:46px;padding:0 16px;border:1px solid var(--g-line);border-radius:10px;background:var(--g-card);color:var(--g-ink);
  font-family:${SANS};font-size:14px;font-weight:800;cursor:pointer}
.grw-warn{margin:-4px 0 12px;font-size:13px;line-height:1.5;font-weight:600;color:var(--g-warn)}
.grw-cta{display:flex;align-items:center;justify-content:center;width:100%;height:52px;box-sizing:border-box;border:0;border-radius:12px;
  background:var(--g-btn);color:var(--g-btnink);font-family:${SANS};font-size:16px;font-weight:800;cursor:pointer;text-decoration:none;text-align:center;padding:0 16px}
.grw-foot{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
.grw-foot a,.grw-foot button{font-family:${SANS};font-size:13px;font-weight:700;color:var(--g-ink2);padding:12px 0;background:transparent;border:0;cursor:pointer}
.grw-foot a:hover,.grw-foot button:hover{color:var(--g-ink)}
.grw-x:focus-visible,.grw-copy:focus-visible,.grw-cta:focus-visible,.grw-foot a:focus-visible,.grw-foot button:focus-visible{outline:2px solid var(--g-ink);outline-offset:2px}
@keyframes grwfade{from{opacity:0}to{opacity:1}}
@keyframes grwrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:560px){
  .grw-bd{align-items:flex-end;padding:0 10px 10px}
  .grw{max-width:none;padding:22px 20px calc(16px + env(safe-area-inset-bottom));max-height:92vh;animation:grwup .24s ease-out}
  .grw-h{font-size:26px}
  .grw-tk-p{font-size:48px}
}
@keyframes grwup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.grw-bd,.grw{animation:none}}
`;
