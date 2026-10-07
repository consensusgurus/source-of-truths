'use client';

// THANK YOU + SHARE (owner-approved, 2026-10-04). Mockup:
// https://claude.ai/artifact/XCciwm28gw4drBDTjJ4pVM
//
// ONE COMPONENT, TWO POP-UPS, and at most ONE showing per browser per week
// (see LAST_KEY below). An existing player gets the return version on arrival;
// anyone else gets the done version after a finished game.
//
//   RETURN ('return'). An EXISTING player, on the first page of a visit.
//   "Existing" is decided at the START of the browser session (sessionStorage
//   key sot_thanks_sess): a play footprint already on this device when the
//   session began. Same positive-signal test WelcomeOverlay uses, so the two
//   can never both apply. This one carries SHARE CREDIT: a registered player's
//   link is stamped with their referral code (lib/referrals withRef), and the
//   copy says the owner can see who shares. A guest has no code to stamp, so
//   the credit line becomes an invitation to pick a player name.
//
//   DONE ('done'). A RETURNING player not shown the return version this week, a few seconds
//   after a finished game is saved (the sot:result-saved event ResultQueue fires on a 2xx post
//   that is not an abandon row). No share credit: a plain link.
//
// RETURNING PLAYERS ONLY (owner, 2026-10-07). A brand-new player never sees it in
// their first session: both versions need sot_thanks_sess === 'r', and either one
// stamps LAST_KEY, so a returning player gets at most one showing a week.
//
// NEVER TWO IN ONE SESSION. An existing player who saw the return pop-up this
// session gets the done pop-up after a game in a LATER session instead.
//
// NEVER INSIDE A RUN. A circuit, the Daily Five and Price Check all chain games
// together, and a modal between them is the wrong moment; the done pop-up waits
// for the next game finished outside one.
//
// IT STOPS THE END CARD'S COUNTDOWN. While open it sets data-sot-modal on <html>
// and StageFinish's Play similar countdown stands down when it sees that, so a
// reader looking at this is never walked to another game underneath it.
//
// Preview without writing any key: ?thanks=return or ?thanks=done.
import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Copy, Check, MessageSquare, Mail, Share2, Plus, Wrench, Heart, Users } from 'lucide-react';
import { SHARE_URL } from '@/lib/site';
import { withRef, myRefCode, ensureMyRefCode } from '@/lib/referrals';
import { readRunParam } from '@/lib/circuits';
import { readStageTheme } from '@/lib/stage-theme';

// ONCE A WEEK (owner, 2026-10-04, same day it shipped as once ever): at most one
// thank-you pop-up per browser per seven days, whichever version. LAST_KEY holds
// the ms timestamp of the last showing. The two once-ever keys from the first
// release are read as "shown just now" so nobody who saw it today sees it again
// before next week.
const LAST_KEY = 'sot_thanks_last';
const OLD_KEYS = ['sot_thanks_return', 'sot_thanks_done'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function shownThisWeek() {
  try {
    let last = parseInt(localStorage.getItem(LAST_KEY) || '', 10);
    if (!Number.isFinite(last) && OLD_KEYS.some((k) => localStorage.getItem(k))) {
      last = Date.now();
      localStorage.setItem(LAST_KEY, String(last));
    }
    return Number.isFinite(last) && Date.now() - last < WEEK_MS;
  } catch (e) { return true; }
}
const SESS_KEY = 'sot_thanks_sess';      // 'r' returning at session start, 'n' new
const SHOWN_KEY = 'sot_thanks_shown';    // a pop-up already showed this session
export const RESULT_SAVED_EVENT = 'sot:result-saved';
const RETURN_WAIT_MS = 900;
const DONE_WAIT_MS = 5000;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

function isReturningPlayer() {
  try {
    if (localStorage.getItem('sot_quiz_identity')) return true;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i) || '';
      if (!k.startsWith('sot_')) continue;
      if (/^sot_.+_day$/.test(k)) return true;
      if (/^sot_(?!quiz_|vid_)[a-z]+_\d/.test(k)) return true;
    }
  } catch (e) { return false; }
  return false;
}

function isRegistered() {
  try {
    const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
    return !!(id && id.username);
  } catch (e) { return false; }
}

function blockedHere() {
  try {
    const p = window.location.pathname || '/';
    if (readRunParam()) return true;
    if (/^\/(circuits|pricecheck|admin|daily-five)(\/|$)/.test(p)) return true;
  } catch (e) { return true; }
  return false;
}

function anotherModalOpen() {
  try { return !!document.querySelector('.gnp-bd, [role="dialog"][aria-modal="true"]'); } catch (e) { return false; }
}

function ago(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

const bare = (u) => String(u || '').replace(/^https?:\/\//, '');

export default function ThanksPop() {
  const [kind, setKind] = useState(null);   // 'return' | 'done' | null
  const [link, setLink] = useState(SHARE_URL);
  const [credit, setCredit] = useState(false);
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [latest, setLatest] = useState(null);   // { username, at } of the most recent credited share
  const closeRef = useRef(null);
  const preview = useRef(false);

  const show = useCallback(async (which) => {
    let url = SHARE_URL;
    let cred = false;
    if (which === 'return' && isRegistered()) {
      // The code is normally cached already (VisitorBeacon resolves it once per
      // browser); a cold cache costs one request, capped so the pop-up never waits long.
      if (!myRefCode()) {
        try { await Promise.race([ensureMyRefCode(), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
      }
      const stamped = withRef(SHARE_URL);
      if (stamped !== SHARE_URL) { url = stamped; cred = true; }
    }
    if (!preview.current) {
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()));
        sessionStorage.setItem(SHOWN_KEY, '1');
      } catch (e) {}
    }
    try { setDark(readStageTheme() === 'dark'); } catch (e) {}
    try { setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'); } catch (e) {}
    try { window.__sotPopAt = Date.now(); } catch (e) {}
    // The most recent credited share, fetched without holding the pop-up up.
    fetch('/api/quiz/referrals?latest=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.latest && d.latest.username) setLatest(d.latest); })
      .catch(() => {});
    setLink(url);
    setCredit(cred);
    setCopied(false);
    setKind(which);
  }, []);

  const close = useCallback(() => setKind(null), []);

  // RETURN: decided once, on the first page of the session.
  useEffect(() => {
    let force = null;
    try { force = new URLSearchParams(window.location.search).get('thanks'); } catch (e) {}
    if (force === 'return' || force === 'done') {
      preview.current = true;
      const t = setTimeout(() => show(force), 400);
      return () => clearTimeout(t);
    }
    let sess = null;
    try {
      sess = sessionStorage.getItem(SESS_KEY);
      if (!sess) {
        sess = isReturningPlayer() ? 'r' : 'n';
        sessionStorage.setItem(SESS_KEY, sess);
      }
    } catch (e) { return undefined; }
    if (sess !== 'r') return undefined;
    try {
      if (shownThisWeek()) return undefined;
      if (sessionStorage.getItem(SHOWN_KEY)) return undefined;
    } catch (e) { return undefined; }
    const t = setTimeout(() => {
      if (blockedHere() || anotherModalOpen()) return;
      show('return');
    }, RETURN_WAIT_MS);
    return () => clearTimeout(t);
  }, [show]);

  // DONE: after a finished game is saved, anywhere outside a run.
  useEffect(() => {
    let timer = null;
    const onSaved = () => {
      try {
        if (sessionStorage.getItem(SESS_KEY) !== 'r') return;
        if (shownThisWeek()) return;
        if (sessionStorage.getItem(SHOWN_KEY)) return;
      } catch (e) { return; }
      if (blockedHere()) return;
      clearTimeout(timer);
      const attempt = () => {
        // Never over an ending that is still playing (the finish beat, or the
        // curtain's figures landing): wait for it to finish.
        if (document.documentElement.dataset.sotBeat || document.querySelector('.stf-flood')) { timer = setTimeout(attempt, 600); return; }
        if (document.visibilityState === 'hidden') return;
        if (blockedHere() || anotherModalOpen()) return;
        try { if (shownThisWeek() || sessionStorage.getItem(SHOWN_KEY)) return; } catch (e) { return; }
        show('done');
      };
      timer = setTimeout(attempt, DONE_WAIT_MS);
    };
    window.addEventListener(RESULT_SAVED_EVENT, onSaved);
    return () => { window.removeEventListener(RESULT_SAVED_EVENT, onSaved); clearTimeout(timer); };
  }, [show]);

  useEffect(() => {
    if (!kind) return undefined;
    const html = document.documentElement;
    html.dataset.sotModal = '1';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const f = setTimeout(() => { try { closeRef.current && closeRef.current.focus(); } catch (e) {} }, 30);
    return () => {
      clearTimeout(f);
      window.removeEventListener('keydown', onKey);
      delete html.dataset.sotModal;
    };
  }, [kind, close]);

  if (!kind) return null;

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
  const nativeShare = async () => {
    try { await navigator.share({ title: 'Mind Loft', text: "I've been playing the free daily puzzles on Mind Loft. Come play:", url: link }); } catch (e) {}
  };
  const smsHref = `sms:?&body=${encodeURIComponent(msg)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent('Free daily puzzles: Mind Loft')}&body=${encodeURIComponent(msg)}`;

  return (
    <div className={`typ-bd${dark ? ' dk' : ''}`} role="dialog" aria-modal="true" aria-labelledby="typ-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="typ" onClick={(e) => e.stopPropagation()}>
        <div className="typ-ramp" aria-hidden="true" />
        <div className="typ-grab" aria-hidden="true" />
        <button type="button" ref={closeRef} className="typ-x" onClick={close} aria-label="Close">
          <X size={20} strokeWidth={2.2} />
        </button>
        <div className="typ-in">
          <i className="typ-e">{kind === 'return' ? 'Welcome back' : 'A note from Mind Loft'}</i>
          <h2 className="typ-h" id="typ-h">Thank you for playing.</h2>
          <p className="typ-p">
            Every puzzle here is free, with no ads and no paywall. If Mind Loft has earned a spot in your day,
            the best thing you can do is pass it on to someone who would enjoy it too.
          </p>
          <ul className="typ-why">
            <li><Plus size={18} strokeWidth={2.2} aria-hidden="true" />More players means more new games</li>
            <li><Wrench size={18} strokeWidth={2.2} aria-hidden="true" />More feedback means better ones</li>
            <li><Check size={18} strokeWidth={2.2} aria-hidden="true" />And it stays free for everyone</li>
          </ul>

          {latest && (
            <div className="typ-last">
              <span className="typ-last-ic"><Share2 size={16} strokeWidth={2.4} aria-hidden="true" /></span>
              <span className="typ-last-tx"><i>Most recent share</i><b>{latest.username}</b><em>{ago(latest.at)}</em></span>
            </div>
          )}

          <label className="typ-lab" htmlFor="typ-link">{credit ? 'Your share link' : 'Share the link'}</label>
          <div className="typ-row">
            <input id="typ-link" className="typ-link" readOnly value={bare(link)} onFocus={(e) => e.target.select()} />
            <button type="button" className={`typ-copy${copied ? ' ok' : ''}`} onClick={copy}>
              {copied ? <Check size={17} strokeWidth={2.4} aria-hidden="true" /> : <Copy size={17} strokeWidth={2.2} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>

          {kind === 'return' && (
            <div className="typ-credit">
              <Heart size={18} strokeWidth={2.2} aria-hidden="true" />
              {credit ? (
                <span><b>You get share credit.</b> Your link carries your name, so I can see who shares, and I appreciate you!</span>
              ) : (
                <span><b>Want share credit?</b> <a href="/?signup=1">Pick a player name</a> and your link will carry it, so I can see who shares. I appreciate you!</span>
              )}
            </div>
          )}

          {copied && (
            <div className="typ-done" role="status">Link copied. Paste it to a friend who likes a good puzzle. Thank you!</div>
          )}

          <div className={`typ-btns${canShare ? '' : ' two'}`}>
            <a className="typ-b" href={smsHref}><MessageSquare size={17} strokeWidth={2} aria-hidden="true" />Text</a>
            <a className="typ-b" href={mailHref}><Mail size={17} strokeWidth={2} aria-hidden="true" />Email</a>
            {canShare && (
              <button type="button" className="typ-b" onClick={nativeShare}><Share2 size={17} strokeWidth={2} aria-hidden="true" />More</button>
            )}
          </div>

          <a className="typ-grp" href="/groups">
            <Users size={18} strokeWidth={2.2} aria-hidden="true" />
            <span><b>Playing with friends or family?</b> Start a private group and get your own leaderboard.</span>
          </a>

          <div className="typ-foot">
            <button type="button" className="typ-later" onClick={close}>Maybe later</button>
            <span className="typ-sig">Thanks for being here, <b>Marshall</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}


const CSS = `
.typ-bd{position:fixed;inset:0;z-index:4100;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(11,13,18,.5);animation:typfade .18s ease-out;
  --t-card:#fff;--t-ink:#0b0d12;--t-body:#3f4757;--t-mute:#5f6774;--t-line:#e7e9ee;--t-field:rgba(11,15,26,.24);
  --t-soft:#f4f6fa;--t-acc:#2563eb;--t-lastbg:#eef4ff;--t-lastline:#cfe0ff;--t-lastic:#7db0ff;--t-lastink:#1d4ed8;--t-cta:#2563eb;--t-good:#046c4e;--t-goodbg:#ecf7f2;--t-btn:#fff;}
.typ-bd.dk{background:rgba(0,0,0,.62);
  --t-card:#151b29;--t-ink:#eef2fa;--t-body:#b9c4d8;--t-mute:#9aa8c4;--t-line:rgba(255,255,255,.14);--t-field:rgba(255,255,255,.22);
  --t-soft:rgba(255,255,255,.05);--t-acc:#7db0ff;--t-lastbg:rgba(125,176,255,.12);--t-lastline:rgba(125,176,255,.35);--t-lastic:#7db0ff;--t-lastink:#7db0ff;--t-cta:#2f6fe4;--t-good:#9fe0c2;--t-goodbg:rgba(47,191,139,.10);--t-btn:transparent;}
.typ{position:relative;width:100%;max-width:540px;max-height:calc(100vh - 40px);overflow-y:auto;background:var(--t-card);
  border:1px solid var(--t-line);border-radius:16px;box-shadow:0 24px 60px rgba(11,13,18,.35);font-family:${SANS};color:var(--t-ink);
  animation:typrise .22s ease-out;}
/* One solid light blue across the top (owner, 2026-10-04): the dark register's accent, in both registers. */
.typ-ramp{height:6px;background:#7db0ff}
.typ-grab{display:none}
.typ-x{position:absolute;top:16px;right:14px;width:44px;height:44px;border:none;background:transparent;border-radius:10px;color:var(--t-mute);
  display:flex;align-items:center;justify-content:center;cursor:pointer}
.typ-x:hover{color:var(--t-ink);background:var(--t-soft)}
.typ-in{padding:32px 38px 24px;display:flex;flex-direction:column}
.typ-e{font-style:normal;font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--t-acc);font-weight:500}
.typ-h{margin:12px 44px 0 0;font-size:34px;line-height:1.1;font-weight:800;letter-spacing:-.02em;color:var(--t-ink)}
.typ-p{margin:14px 0 0;font-size:16px;line-height:1.6;color:var(--t-body)}
.typ-why{list-style:none;margin:16px 0 0;padding:14px 18px;background:var(--t-soft);border-radius:12px;display:flex;flex-direction:column;gap:9px}
.typ-why li{display:flex;align-items:center;gap:12px;font-size:14px;font-weight:600;color:var(--t-ink)}
.typ-why svg{color:var(--t-acc);flex:none}
.typ-lab{margin-top:18px;font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--t-mute)}
.typ-row{display:flex;gap:8px;margin-top:8px}
.typ-link{flex:1 1 auto;min-width:0;height:48px;box-sizing:border-box;border:1px solid var(--t-field);border-radius:10px;padding:0 14px;
  font-family:${MONO};font-size:15px;color:var(--t-ink);background:var(--t-card)}
.typ-copy{flex:none;height:48px;padding:0 20px;border:none;border-radius:10px;background:var(--t-cta);color:#fff;font-family:${SANS};
  font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;cursor:pointer}
.typ-copy.ok{background:#047857}
.typ-credit,.typ-done{margin-top:10px;display:flex;align-items:flex-start;gap:10px;font-size:14px;line-height:1.5;color:var(--t-good);
  background:var(--t-goodbg);border-radius:10px;padding:11px 14px}
.typ-done{font-weight:600}
.typ-credit svg{flex:none;margin-top:1px}
.typ-credit a{color:inherit;font-weight:700;text-decoration:underline}
.typ-btns{margin-top:10px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.typ-btns.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.typ-b{height:44px;box-sizing:border-box;border:1px solid var(--t-line);border-radius:10px;background:var(--t-btn);color:var(--t-ink);
  font-family:${SANS};font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none}
.typ-b:hover{border-color:var(--t-field)}
.typ-last{margin-top:16px;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;
  background:var(--t-lastbg);border:1px solid var(--t-lastline)}
.typ-last-ic{flex:none;width:34px;height:34px;border-radius:999px;background:var(--t-lastic);color:#0b1f4d;
  display:flex;align-items:center;justify-content:center}
.typ-last-tx{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:8px;row-gap:2px;min-width:0}
.typ-last-tx i{flex-basis:100%;font-style:normal;font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--t-lastink)}
.typ-last-tx b{font-size:17px;font-weight:800;color:var(--t-ink);letter-spacing:-.01em}
.typ-last-tx em{font-style:normal;font-size:13px;color:var(--t-mute)}
.typ-grp{margin-top:12px;display:flex;align-items:flex-start;gap:10px;font-size:14px;line-height:1.5;color:var(--t-body);
  text-decoration:none;border:1px dashed var(--t-field);border-radius:10px;padding:11px 14px}
.typ-grp b{color:var(--t-ink)}.typ-grp svg{flex:none;margin-top:1px;color:var(--t-acc)}
.typ-grp:hover{border-style:solid}
.typ-grp:focus-visible{outline:2px solid var(--t-acc);outline-offset:2px}
.typ-foot{margin-top:14px;padding-top:4px;border-top:1px solid var(--t-line);display:flex;align-items:center;justify-content:space-between;gap:10px}
.typ-later{height:44px;padding:0;border:none;background:transparent;color:var(--t-mute);font-family:${SANS};font-weight:600;font-size:14px;cursor:pointer}
.typ-later:hover{color:var(--t-ink)}
.typ-sig{font-size:14px;color:var(--t-body)}.typ-sig b{color:var(--t-ink)}
.typ-x:focus-visible,.typ-copy:focus-visible,.typ-b:focus-visible,.typ-later:focus-visible{outline:2px solid var(--t-acc);outline-offset:2px}
@keyframes typfade{from{opacity:0}to{opacity:1}}
@keyframes typrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:560px){
  .typ-bd{align-items:flex-end;padding:0}
  .typ{max-width:none;border-radius:20px 20px 0 0;border-bottom:none;max-height:92vh;animation:typup .24s ease-out}
  .typ-ramp{height:5px}
  .typ-grab{display:block;width:40px;height:4px;border-radius:4px;background:var(--t-line);margin:10px auto 0}
  .typ-x{top:12px;right:8px}
  .typ-in{padding:12px 22px calc(26px + env(safe-area-inset-bottom))}
  .typ-h{font-size:28px;margin-top:10px}
  .typ-p{font-size:15px;line-height:1.55}
  .typ-why{display:none}
  .typ-copy{padding:0 16px}
  .typ-b{height:64px;flex-direction:column;gap:5px;font-size:13px;border-radius:12px}
  .typ-sig{font-size:13px}
}
@keyframes typup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.typ-bd,.typ{animation:none}}
`;
