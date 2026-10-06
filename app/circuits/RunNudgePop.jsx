"use client";

// RunNudgePop — the hand-off from one finished run to the other (owner,
// 2026-10-01): finish Price Check and you are offered the Trivia Gauntlet,
// finish the Trivia Gauntlet and you are offered Price Check, each only if
// that other run has not been finished today on this device. Once per page
// load; the caller decides when (`ready`), after its own ending has settled.
// `fireOnLeave` (Price Check, owner 2026-10-01): once ready, the offer also
// opens the moment the player leaves the page (tab hidden, app switched), so
// it is waiting when they come back, instead of only after `delay`.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { T } from '@/lib/theme';
import { RUN_DOORS, runDoneToday } from './RunDoorPop';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

//
// `chain` (owner, 2026-10-06): a list of targets offered one after another.
// Declining one (Not now, the X, Escape, the backdrop) opens the next that
// has not been finished today; taking one navigates away. Used for the first
// Trivia Gauntlet a browser ever finishes: Price Check, then Passport.
// `fresh` drops the "you have not run it today" line, which reads oddly to
// someone who has never run anything. `onOpen` fires once, when the first
// card opens, so the caller can stamp a once-ever flag.
export default function RunNudgePop({ target = 'gauntlet', chain = null, ready = false, delay = 450, fireOnLeave = false, fresh = false, eyebrows = null, onOpen, onClose }) {
  const list = chain && chain.length ? chain : [target];
  const [idx, setIdx] = useState(-1);
  const cur = idx >= 0 ? list[idx] : null;
  const D = cur ? RUN_DOORS[cur] : null;
  const open = !!D;
  const fired = useRef(false);
  const nextFrom = useCallback((from) => {
    for (let i = from; i < list.length; i++) if (RUN_DOORS[list[i]] && !runDoneToday(list[i])) return i;
    return -1;
  }, [list.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = useCallback(() => {
    const n = nextFrom(idx + 1);
    setIdx(n);
    if (n < 0 && onClose) onClose();
  }, [idx, nextFrom, onClose]);

  useEffect(() => {
    if (!ready || fired.current) return undefined;
    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      const n = nextFrom(0);
      if (n < 0) return;
      setIdx(n);
      if (onOpen) onOpen();
    };
    const t = setTimeout(fire, delay);
    const onHide = () => { if (document.visibilityState === 'hidden') fire(); };
    if (fireOnLeave) document.addEventListener('visibilitychange', onHide);
    return () => { clearTimeout(t); if (fireOnLeave) document.removeEventListener('visibilitychange', onHide); };
  }, [ready, nextFrom, delay, fireOnLeave]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || !D) return null;
  return (
    <div className="rnp-bd" role="dialog" aria-modal="true" aria-labelledby="rnp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS(D.accent) }} />
      <div className="rnp" key={cur} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rnp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        <i className="rnp-e">{(eyebrows && eyebrows[idx]) || 'One more run today'}</i>
        <h2 className="rnp-h" id="rnp-h">{D.name}</h2>
        <p className="rnp-p">{D.body}{fresh ? '' : ' You have not run it today.'}</p>
        <div className="rnp-tags">{D.tags.map(([t, c]) => <span key={t} style={{ background: c }}>{t}</span>)}</div>
        <a className="rnp-go" href={D.href}>Start {D.name}</a>
        <button type="button" className="rnp-no" onClick={close}>Not now</button>
      </div>
    </div>
  );
}

const CSS = (acc) => `
.rnp-bd{position:fixed;inset:0;z-index:4100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,7,13,.72);backdrop-filter:blur(3px);animation:rnpfade .3s ease-out;}
.rnp{position:relative;width:100%;max-width:380px;background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:22px 20px 16px;text-align:center;font-family:${SANS};color:#eef2fa;animation:rnprise .45s cubic-bezier(.2,1.3,.4,1);}
.rnp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;cursor:pointer;padding:5px;line-height:0;border-radius:7px;}
.rnp-e{display:block;font-style:normal;font-family:${MONO};font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#8b95a8;}
.rnp-h{margin:6px 0 6px;font-size:26px;font-weight:800;letter-spacing:-.02em;color:#fff;}
.rnp-p{margin:0 auto 14px;color:#9aa8c4;font-weight:600;font-size:14px;line-height:1.45;max-width:310px;}
.rnp-tags{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:0 0 16px;}
.rnp-tags span{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:5px 8px;border-radius:5px;color:#0b0f1a;}
.rnp-go{display:block;font-size:15px;font-weight:800;padding:13px;border-radius:12px;background:${acc};color:#0b0f1a;text-decoration:none;position:relative;overflow:hidden;}
.rnp-go:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);animation:rnpsheen 2.6s .6s infinite;}
.rnp-no{margin-top:8px;background:none;border:0;color:#8b95a8;font-family:${SANS};font-weight:700;font-size:13px;cursor:pointer;padding:8px;}
@keyframes rnpfade{from{opacity:0}to{opacity:1}}
@keyframes rnprise{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
@keyframes rnpsheen{0%{left:-60%}40%,100%{left:130%}}
@media(prefers-reduced-motion:reduce){.rnp-bd,.rnp,.rnp-go:after{animation:none;}}
`;
