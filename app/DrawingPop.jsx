'use client';

// The $100 ticket drawing pop-up (owner, 2026-10-09).
//
// Shows ONCE A WEEK per browser, a few seconds after a finished game is saved
// (the same `sot:result-saved` event ThanksPop listens for), only while the
// drawing is live. While it runs, ThanksPop stands down entirely, because this
// card carries the share link and the share credit that one did.
//
// Never inside a run or on the run-adjacent pages, never over another modal,
// never twice in a session. `?drawing=1` previews it on any page without
// writing a key. All terms come from lib/drawing.js.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Copy, Check, MessageSquare, Mail, Share2, Ticket, Plus } from 'lucide-react';
import { SHARE_URL } from '@/lib/site';
import { withRef, ensureMyRefCode } from '@/lib/referrals';
import { readRunParam } from '@/lib/circuits';
import { readStageTheme } from '@/lib/stage-theme';
import { DRAWING_COPY, drawingIsLive, drawingDaysLeft, formatOdds, ticketLabel } from '@/lib/drawing';

const LAST_KEY = 'sot_drawing_last';
const SHOWN_KEY = 'sot_drawing_shown';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RESULT_SAVED_EVENT = 'sot:result-saved';
const DONE_WAIT_MS = 5000;
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
    if (/^\/(circuits|pricecheck|judged|admin|daily-five)(\/|$)/.test(p)) return true;
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

function TicketGlyph({ size = 16 }) {
  return <Ticket size={size} strokeWidth={2.2} aria-hidden="true" />;
}

export default function DrawingPop() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [who, setWho] = useState(null);
  const [link, setLink] = useState(SHARE_URL);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [days, setDays] = useState(0);
  const closeRef = useRef(null);
  const preview = useRef(false);

  const show = useCallback(async () => {
    const id = identity();
    setWho(id);
    if (!preview.current) {
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()));
        sessionStorage.setItem(SHOWN_KEY, '1');
      } catch (e) {}
    }
    try { setDark(readStageTheme() === 'dark'); } catch (e) {}
    try { setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'); } catch (e) {}
    try { window.__sotPopAt = Date.now(); } catch (e) {}
    setDays(drawingDaysLeft());
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
      .then((d) => {
        if (!d) return;
        setData(d);
        if (d.me && d.me.shareUrl) setLink(d.me.shareUrl);
      })
      .catch(() => {});
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Preview.
  useEffect(() => {
    let force = null;
    try { force = new URLSearchParams(window.location.search).get('drawing'); } catch (e) {}
    if (force === '1') {
      preview.current = true;
      const t = setTimeout(() => show(), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [show]);

  // After a finished game, once a week.
  useEffect(() => {
    let timer = null;
    const onSaved = () => {
      if (!drawingIsLive()) return;
      try {
        if (shownThisWeek()) return;
        if (sessionStorage.getItem(SHOWN_KEY)) return;
      } catch (e) { return; }
      if (blockedHere()) return;
      clearTimeout(timer);
      const attempt = () => {
        // Let the finish beat and the curtain flood play out first.
        if (document.documentElement.dataset.sotBeat || document.querySelector('.stf-flood')) { timer = setTimeout(attempt, 600); return; }
        if (document.visibilityState === 'hidden') return;
        if (blockedHere() || anotherModalOpen()) return;
        try { if (shownThisWeek() || sessionStorage.getItem(SHOWN_KEY)) return; } catch (e) { return; }
        show();
      };
      timer = setTimeout(attempt, DONE_WAIT_MS);
    };
    window.addEventListener(RESULT_SAVED_EVENT, onSaved);
    return () => { window.removeEventListener(RESULT_SAVED_EVENT, onSaved); clearTimeout(timer); };
  }, [show]);

  useEffect(() => {
    if (!open) return undefined;
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
  }, [open, close]);

  if (!open) return null;

  const me = data && data.me;
  const total = data ? data.total : null;
  const count = me ? me.count : 0;
  const tickets = me ? me.tickets.slice(-3) : [];
  const extra = me ? Math.max(0, me.count - tickets.length) : 0;
  const latest = data && data.feed && data.feed[0];

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
    <div className={`drw-bd${dark ? ' dk' : ''}`} role="dialog" aria-modal="true" aria-labelledby="drw-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="drw" onClick={(e) => e.stopPropagation()}>
        <div className="drw-ramp" aria-hidden="true" />
        <div className="drw-grab" aria-hidden="true" />
        <button type="button" ref={closeRef} className="drw-x" onClick={close} aria-label="Close">
          <X size={20} strokeWidth={2.2} />
        </button>
        <div className="drw-in">
          <i className="drw-e">{DRAWING_COPY.eyebrow}{days ? ` · ${days} day${days === 1 ? '' : 's'} left` : ''}</i>
          <h2 className="drw-h" id="drw-h">{DRAWING_COPY.headline}</h2>
          <p className="drw-p drw-long">{DRAWING_COPY.pitch}</p>
          <p className="drw-p drw-short">{DRAWING_COPY.pitchShort}</p>

          <div className="drw-tk">
            <div className="drw-tkh">
              <div className="drw-tkn">
                <b>{who ? `${count} ticket${count === 1 ? '' : 's'}` : (total == null ? 'The drum' : `${total} ticket${total === 1 ? '' : 's'}`)}</b>
                <span>{who ? (total == null ? '' : `of ${total} in the drum`) : 'in the drum so far'}</span>
              </div>
              {who && me && me.eligible && total ? <em className="drw-odds">{formatOdds(count, total)} odds</em> : null}
            </div>
            {who ? (
              <div className="drw-stubs">
                {tickets.map((t) => (
                  <div className="drw-stub" key={t.no}>
                    <span className="drw-stub-ic"><TicketGlyph /></span>
                    <span className="drw-stub-tx"><b>{ticketLabel(t.no)}</b><i>{t.friend || 'a new player'}</i></span>
                  </div>
                ))}
                {extra ? <div className="drw-more">+{extra} more</div> : null}
                <div className="drw-next"><Plus size={14} strokeWidth={2.4} aria-hidden="true" />Next ticket</div>
              </div>
            ) : null}
            {who && me && !me.eligible ? (
              <p className="drw-warn">Add an email to your account to put your tickets in the drum. Your tickets still count once you do.</p>
            ) : null}
          </div>

          {who ? (
            <>
              <label className="drw-lab" htmlFor="drw-link">Your ticket link</label>
              <div className="drw-row">
                <input id="drw-link" className="drw-link" readOnly value={bare(link)} onFocus={(e) => e.target.select()} />
                <button type="button" className={`drw-copy${copied ? ' ok' : ''}`} onClick={copy}>
                  {copied ? <Check size={17} strokeWidth={2.4} aria-hidden="true" /> : <Copy size={17} strokeWidth={2.2} aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
              {copied && <div className="drw-done" role="status">Link copied. Every friend who finishes a game from it is a ticket.</div>}
              <div className={`drw-btns${canShare ? '' : ' two'}`}>
                <a className="drw-b" href={smsHref}><MessageSquare size={17} strokeWidth={2} aria-hidden="true" />Text</a>
                <a className="drw-b" href={mailHref}><Mail size={17} strokeWidth={2} aria-hidden="true" />Email</a>
                {canShare && <button type="button" className="drw-b" onClick={nativeShare}><Share2 size={17} strokeWidth={2} aria-hidden="true" />Share</button>}
              </div>
            </>
          ) : (
            <a className="drw-join" href="/?signup=1">Pick a player name to get your ticket link</a>
          )}

          {latest ? (
            <div className="drw-last">
              <span className="drw-last-ic"><TicketGlyph size={14} /></span>
              <span><b>{latest.who}</b> earned a ticket {ago(latest.at)}</span>
            </div>
          ) : null}

          <div className="drw-foot">
            <button type="button" className="drw-later" onClick={close}>Maybe later</button>
            <a className="drw-rules" href="/quizzes/community#drawing">See the board and rules</a>
          </div>
          <p className="drw-legal">{DRAWING_COPY.legalShort}</p>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.drw-bd{position:fixed;inset:0;z-index:4100;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(11,13,18,.5);animation:drwfade .18s ease-out;
  --d-card:#fff;--d-ink:#0b0d12;--d-body:#3f4757;--d-mute:#5f6774;--d-line:#e7e9ee;--d-field:rgba(11,15,26,.24);
  --d-soft:#f4f6fa;--d-acc:#2563eb;--d-cta:#2563eb;--d-good:#046c4e;--d-goodbg:#ecf7f2;--d-btn:#fff;
  --d-goldbg:#fff8e6;--d-goldline:#f0d48a;--d-goldink:#8a5a00;--d-warn:#9a3412;}
.drw-bd.dk{background:rgba(0,0,0,.62);
  --d-card:#151b29;--d-ink:#eef2fa;--d-body:#b9c4d8;--d-mute:#9aa8c4;--d-line:rgba(255,255,255,.14);--d-field:rgba(255,255,255,.22);
  --d-soft:rgba(255,255,255,.05);--d-acc:#7db0ff;--d-cta:#2f6fe4;--d-good:#9fe0c2;--d-goodbg:rgba(47,191,139,.10);--d-btn:transparent;
  --d-goldbg:rgba(245,200,76,.10);--d-goldline:rgba(245,200,76,.40);--d-goldink:#f5c84c;--d-warn:#fdba74;}
.drw{position:relative;width:100%;max-width:540px;max-height:calc(100vh - 40px);overflow-y:auto;background:var(--d-card);
  border:1px solid var(--d-line);border-radius:16px;box-shadow:0 24px 60px rgba(11,13,18,.35);font-family:${SANS};color:var(--d-ink);
  animation:drwrise .22s ease-out}
.drw-ramp{height:6px;background:#7db0ff}
.drw-grab{display:none}
.drw-x{position:absolute;top:16px;right:14px;width:44px;height:44px;border:none;background:transparent;border-radius:10px;color:var(--d-mute);
  display:flex;align-items:center;justify-content:center;cursor:pointer}
.drw-x:hover{color:var(--d-ink);background:var(--d-soft)}
.drw-in{padding:30px 38px 22px;display:flex;flex-direction:column}
.drw-e{font-style:normal;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--d-acc);font-weight:700}
.drw-h{margin:12px 44px 0 0;font-size:34px;line-height:1.1;font-weight:800;letter-spacing:-.02em;color:var(--d-ink)}
.drw-p{margin:12px 0 0;font-size:16px;line-height:1.55;color:var(--d-body)}
.drw-short{display:none}
.drw-tk{margin-top:18px;padding:16px 18px;border-radius:12px;background:var(--d-goldbg);border:1px solid var(--d-goldline)}
.drw-tkh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
.drw-tkn{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.drw-tkn b{font-size:30px;font-weight:800;letter-spacing:-.02em;color:var(--d-ink)}
.drw-tkn span{font-size:14px;font-weight:600;color:var(--d-mute)}
.drw-odds{font-style:normal;font-size:14px;font-weight:800;color:var(--d-goldink)}
.drw-stubs{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}
.drw-stub{display:flex;align-items:stretch;height:40px;border-radius:8px;overflow:hidden;background:#e8b43a;color:#0b0d12}
.drw-stub-ic{display:flex;align-items:center;padding:0 10px;border-right:2px dashed rgba(11,13,18,.35)}
.drw-stub-tx{display:flex;flex-direction:column;justify-content:center;padding:0 12px;line-height:1.15}
.drw-stub-tx b{font-size:13px;font-weight:800}
.drw-stub-tx i{font-style:normal;font-size:11px;font-weight:600;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drw-more{display:flex;align-items:center;height:40px;padding:0 6px;font-size:13px;font-weight:800;color:var(--d-goldink)}
.drw-next{display:flex;align-items:center;gap:6px;height:40px;box-sizing:border-box;padding:0 14px;border-radius:8px;
  border:2px dashed var(--d-goldline);font-size:13px;font-weight:700;color:var(--d-mute)}
.drw-warn{margin:12px 0 0;font-size:13px;line-height:1.5;font-weight:600;color:var(--d-warn)}
.drw-lab{margin-top:18px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--d-mute);font-weight:700}
.drw-row{display:flex;gap:8px;margin-top:8px}
.drw-link{flex:1 1 auto;min-width:0;height:48px;box-sizing:border-box;border:1px solid var(--d-field);border-radius:10px;padding:0 14px;
  font-family:${SANS};font-size:15px;color:var(--d-ink);background:var(--d-card)}
.drw-copy{flex:none;height:48px;padding:0 20px;border:none;border-radius:10px;background:var(--d-cta);color:#fff;font-family:${SANS};
  font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;cursor:pointer}
.drw-copy.ok{background:#047857}
.drw-done{margin-top:10px;font-size:14px;line-height:1.5;font-weight:600;color:var(--d-good);background:var(--d-goodbg);border-radius:10px;padding:11px 14px}
.drw-btns{margin-top:10px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.drw-btns.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.drw-b{height:44px;box-sizing:border-box;border:1px solid var(--d-line);border-radius:10px;background:var(--d-btn);color:var(--d-ink);
  font-family:${SANS};font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none}
.drw-b:hover{border-color:var(--d-field)}
.drw-join{margin-top:18px;height:48px;border-radius:10px;background:var(--d-cta);color:#fff;font-weight:800;font-size:15px;
  display:flex;align-items:center;justify-content:center;text-decoration:none;padding:0 16px;text-align:center}
.drw-last{margin-top:12px;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;background:var(--d-soft);font-size:13.5px;color:var(--d-body)}
.drw-last b{color:var(--d-ink)}
.drw-last-ic{flex:none;width:28px;height:28px;border-radius:999px;background:#7db0ff;color:#0b1f4d;display:flex;align-items:center;justify-content:center}
.drw-foot{margin-top:14px;padding-top:6px;border-top:1px solid var(--d-line);display:flex;align-items:center;justify-content:space-between;gap:10px}
.drw-later{height:44px;padding:0;border:none;background:transparent;color:var(--d-mute);font-family:${SANS};font-weight:600;font-size:14px;cursor:pointer}
.drw-later:hover{color:var(--d-ink)}
.drw-rules{font-size:14px;font-weight:700;color:var(--d-acc);text-decoration:none}
.drw-rules:hover{text-decoration:underline}
.drw-legal{margin:6px 0 0;font-size:11.5px;line-height:1.5;color:var(--d-mute)}
.drw-x:focus-visible,.drw-copy:focus-visible,.drw-b:focus-visible,.drw-later:focus-visible,.drw-rules:focus-visible,.drw-join:focus-visible{outline:2px solid var(--d-acc);outline-offset:2px}
@keyframes drwfade{from{opacity:0}to{opacity:1}}
@keyframes drwrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:560px){
  .drw-bd{align-items:flex-end;padding:0}
  .drw{max-width:none;border-radius:20px 20px 0 0;border-bottom:none;max-height:92vh;animation:drwup .24s ease-out}
  .drw-ramp{height:5px}
  .drw-grab{display:block;width:40px;height:4px;border-radius:4px;background:var(--d-line);margin:10px auto 0}
  .drw-x{top:12px;right:8px}
  .drw-in{padding:12px 22px calc(26px + env(safe-area-inset-bottom))}
  .drw-h{font-size:28px;margin-top:10px}
  .drw-long{display:none}.drw-short{display:block;font-size:15px}
  .drw-tkn b{font-size:26px}
  .drw-copy{padding:0 16px}
  .drw-b{height:64px;flex-direction:column;gap:5px;font-size:13px;border-radius:12px}
}
@keyframes drwup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.drw-bd,.drw{animation:none}}
`;
