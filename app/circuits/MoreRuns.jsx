"use client";

// MoreRuns — every other daily run, on one card (owner, 2026-10-09).
//
// The five runs are the Trivia Gauntlet, the Math Gauntlet, Price Check,
// Passport and Judged. Finishing one used to offer ONE other (RunNudgePop:
// the Gauntlet offered Price Check, Price Check and Passport offered the
// Gauntlet), so a player saw the rest one at a time, if at all. Now:
//
//   MoreRunsPop  one pop-up listing every other run NOT finished today on this
//                device, in one card. It shows the FIRST time a browser
//                finishes any of the five (`sot_runs_pop`, stamped when it
//                opens), and never again: from then on the list below does
//                the job without interrupting the ending.
//
//   MoreRunsList the same list, inline, on each run's end card, below the
//                result. It is always there, so a player who dismissed the
//                pop-up, or never saw it, still finds the rest.
//
// "Not finished today" is runDoneToday from RunDoorPop, which reads each
// run's own saved state (sot_run_<id>_<day>, or Passport's day breadcrumb), so
// it is the same test every door and nudge already uses. Both read storage in
// an effect, never during render, so the server and the first paint agree.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { T } from '@/lib/theme';
import { RUN_DOORS, runDoneToday } from './RunDoorPop';

export const RUN_ORDER = ['gauntlet', 'math', 'pricecheck', 'passport', 'judged'];
export const RUNS_POP_STORE = 'sot_runs_pop';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

export function otherRuns(self) {
  return RUN_ORDER.filter((id) => id !== self && RUN_DOORS[id]);
}

function useOpenRuns(self, ready = true) {
  const [ids, setIds] = useState(null);
  useEffect(() => {
    if (!ready) return undefined;
    const read = () => setIds(otherRuns(self).filter((id) => !runDoneToday(id)));
    read();
    const onShow = () => { if (document.visibilityState === 'visible') read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [self, ready]);
  return ids;
}

function Row({ id, cls = 'mr' }) {
  const D = RUN_DOORS[id];
  return (
    <a className={`${cls}-row`} href={D.href} style={{ '--mr-acc': D.accent }}>
      <span className={`${cls}-tx`}>
        <span className={`${cls}-nm`}>{D.name}</span>
        <span className={`${cls}-sb`}>{D.tags.map((t) => t[0]).join(' · ')}</span>
      </span>
      <span className={`${cls}-go`}>Start <span aria-hidden="true">&rsaquo;</span></span>
    </a>
  );
}

// THE INLINE LIST. Colours come in as props because the five endings do not
// share a ground: the runs and Passport are near black, Judged paints its own
// tokens. The defaults are the dark run stage's.
export function MoreRunsList({ self, ink = '#eef2fa', mute = '#9aa8c4', line = 'rgba(255,255,255,.14)', style }) {
  const ids = useOpenRuns(self);
  if (!ids) return null;
  return (
    <div className="mr" style={{ '--mr-ink': ink, '--mr-mute': mute, '--mr-line': line, ...style }}>
      <style dangerouslySetInnerHTML={{ __html: LIST_CSS }} />
      <div className="mr-cap">{ids.length ? 'More runs today' : 'Every run done today'}</div>
      {ids.length ? (
        <div className="mr-rows">{ids.map((id) => <Row key={id} id={id} />)}</div>
      ) : (
        <p className="mr-done">You have finished all five of today&rsquo;s runs. New ones open at midnight Eastern.</p>
      )}
    </div>
  );
}

// THE POP-UP. The caller decides when (`ready`), after its own ending has
// settled; `fireOnLeave` also opens it the moment the player leaves the page,
// so it is waiting when they come back.
export default function MoreRunsPop({ self, ready = false, delay = 3500, fireOnLeave = false }) {
  const [ids, setIds] = useState(null);
  const fired = useRef(false);
  const close = useCallback(() => setIds(null), []);

  useEffect(() => {
    if (!ready || fired.current) return undefined;
    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      try {
        if (localStorage.getItem(RUNS_POP_STORE)) return;
        const q = new URLSearchParams(window.location.search);
        if (q.get('circuit') || q.get('five') === '1') return;
      } catch (e) { return; }
      const open = otherRuns(self).filter((id) => !runDoneToday(id));
      if (!open.length) return;
      try { localStorage.setItem(RUNS_POP_STORE, new Date().toISOString().slice(0, 10)); } catch (e) {}
      setIds(open);
    };
    const t = setTimeout(fire, delay);
    const onHide = () => { if (document.visibilityState === 'hidden') fire(); };
    if (fireOnLeave) document.addEventListener('visibilitychange', onHide);
    return () => { clearTimeout(t); if (fireOnLeave) document.removeEventListener('visibilitychange', onHide); };
  }, [ready, delay, fireOnLeave, self]);

  useEffect(() => {
    if (!ids) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ids, close]);

  if (!ids) return null;
  const self0 = RUN_DOORS[self];
  return (
    <div className="mrp-bd" role="dialog" aria-modal="true" aria-labelledby="mrp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: POP_CSS }} />
      <div className="mrp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mrp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        <i className="mrp-e">{self0 ? `${self0.name}, done` : 'Run done'}</i>
        <h2 className="mrp-h" id="mrp-h">{ids.length === 1 ? 'One more run today' : `${ids.length} more runs today`}</h2>
        <p className="mrp-p">Each is a few daily games played back to back as one sitting, with one score and its own leaderboard.</p>
        <div className="mrp-rows">{ids.map((id) => <Row key={id} id={id} cls="mrp" />)}</div>
        <button type="button" className="mrp-no" onClick={close}>Not now</button>
      </div>
    </div>
  );
}

const ROW_CSS = (c) => `
.${c}-rows{display:flex;flex-direction:column;gap:7px;}
.${c}-row{display:flex;align-items:center;gap:12px;padding:11px 12px 11px 14px;border-radius:10px;text-decoration:none;
          border:1px solid var(--mr-line,rgba(255,255,255,.14));position:relative;overflow:hidden;color:var(--mr-ink,#eef2fa);}
.${c}-row:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--mr-acc);}
.${c}-row:hover{border-color:var(--mr-acc);}
.${c}-tx{display:flex;flex-direction:column;min-width:0;flex:1;}
.${c}-nm{font-size:15px;font-weight:800;letter-spacing:-.01em;}
.${c}-sb{font-size:11.5px;font-weight:700;color:var(--mr-mute,#9aa8c4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.${c}-go{flex:none;font-size:12.5px;font-weight:800;color:#0b0f1a;background:var(--mr-acc);border-radius:7px;padding:7px 11px;}
`;

const LIST_CSS = `
.mr{font-family:${SANS};margin:22px 0 0;text-align:left;color:var(--mr-ink);}
.mr-cap{font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--mr-mute);margin:0 0 8px;}
.mr-done{margin:0;font-size:13.5px;font-weight:600;line-height:1.5;color:var(--mr-mute);}
${ROW_CSS('mr')}
`;

const POP_CSS = `
.mrp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.74);backdrop-filter:blur(2px);animation:mrpfade .18s ease-out;}
.mrp{position:relative;width:100%;max-width:390px;max-height:calc(100vh - 40px);overflow-y:auto;scrollbar-width:none;
     background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:13px;
     padding:18px 20px 18px;font-family:${SANS};color:#eef2fa;box-shadow:0 24px 64px rgba(0,0,0,.6);animation:mrprise .2s ease-out;}
.mrp::-webkit-scrollbar{display:none;}
.mrp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;cursor:pointer;padding:5px;line-height:0;border-radius:7px;}
.mrp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.mrp-e{display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#66748f;margin-bottom:3px;}
.mrp-h{font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;margin:0;}
.mrp-p{margin:10px 0 14px;font-size:13.5px;line-height:1.5;color:#9aa8c4;font-weight:600;}
.mrp-no{display:block;width:100%;margin-top:12px;background:transparent;border:1px solid rgba(255,255,255,.14);color:#9aa8c4;border-radius:9px;padding:10px 18px;font-family:${SANS};font-size:13px;font-weight:800;cursor:pointer;}
.mrp-no:hover{color:#fff;border-color:rgba(255,255,255,.3);}
${ROW_CSS('mrp')}
@keyframes mrpfade{from{opacity:0}to{opacity:1}}
@keyframes mrprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.mrp-bd,.mrp{animation:none;}}
`;
