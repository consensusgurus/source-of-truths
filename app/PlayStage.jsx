'use client';

// THE PLAY STAGE (owner, 2026-10-25): the full-screen phone stage for the
// list, guess and crowd games (Listed, Clade, Dossier, Niche, Thread, Slot,
// Outrank, Feud). The same frame as the word stage: one soft category ground,
// one dark ink, the shared top bar, the prompt in the middle, the controls and
// one quiet line at the foot. Desktop never mounts it, and it keeps no state:
// the host game passes what to draw and wires every control to its own
// handlers, so scoring and saves are untouched.
//
// Classes the hosts use (all under .pst, so nothing leaks):
//   pst-eb      small uppercase eyebrow           pst-q     the big prompt
//   pst-end     "Longest ... Shortest" end labels  pst-row   an outlined row
//   pst-row.on  an ink-filled row                  pst-mv    up/down buttons in a row
//   pst-tag     dashed pill in a row               pst-tb    outlined pill button (.on = filled)
//   pst-tools   a centred row of pst-tb            pst-in    text input + pst-go
//   pst-sug     suggestion list (buttons)          pst-card  ink-filled card
//   pst-chip    small outlined chip (.on filled)   pst-chips a wrapping row of chips
//   pst-arr     round arrow button                 pst-note  centred small note

import React from 'react';
import { RAMP_INK, softGround } from '@/lib/category-ramp';
import { useStageLook, stagePalette, useStageChrome } from './GauntletScreens';
import { nextMainLook } from '@/lib/stage-look';
import StageTopBar from './StageTopBar';

export { usePhoneStage } from './WordStage';

export default function PlayStage({ bg, label = 'Puzzle', eyebrow = null, top = null, bottom = null, foot = null, frac = null, giveUp = null, topKey = 0 }) {
  const [look, setLook] = useStageLook();
  // WHITE PAGE, COLOURED TILES (owner, 2026-10-25).
  const pal = stagePalette(bg, look);
  useStageChrome(pal.bg);
  return (
    <div className="pst" role="dialog" aria-label={label} style={{ '--pst-bg': pal.bg, '--pst-ink': pal.ink, ...(pal.tile ? { '--pst-tint': pal.tile } : null) }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pst-col">
        <StageTopBar look={look} onFlip={() => setLook(nextMainLook(look))} ink={pal.ink} />
        <div className="pst-top" key={topKey}>
          {eyebrow ? <div className="pst-eb">{eyebrow}</div> : null}
          {top}
        </div>
        {bottom}
        {(foot || frac != null || giveUp) ? (
          <div className="pst-foot">
            {frac != null ? <span className="pst-bar"><span style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} /></span> : null}
            {foot ? <span className="pst-line">{foot}</span> : null}
            {giveUp ? <button type="button" className={'pst-give' + (giveUp.armed ? ' on' : '')} onClick={giveUp.onPress}>{giveUp.armed ? (giveUp.armedLabel || 'Tap again to end and see the answers') : (giveUp.label || 'Give up')}</button> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const CSS = `
.pst{position:fixed;inset:0;z-index:85;background:var(--pst-bg);color:var(--pst-ink);display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;font-family:'Manrope',system-ui,sans-serif;-webkit-tap-highlight-color:transparent;--pst-tint:color-mix(in srgb, var(--pst-ink) 8%, transparent);--pst-rule:color-mix(in srgb, var(--pst-ink) 25%, transparent);}
.pst *{color:inherit;box-sizing:border-box;}
.pst button{font:inherit;color:var(--pst-ink);cursor:pointer;-webkit-tap-highlight-color:transparent;}
.pst-col{width:100%;max-width:520px;padding:max(12px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;min-height:100%;}
.pst-top{flex:1 0 auto;display:flex;flex-direction:column;justify-content:safe center;gap:12px;animation:pstRise .3s ease-out both;}
.pst-eb{text-align:center;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.75;line-height:1.3;}
.pst-q{margin:0;text-align:center;font-size:clamp(21px,6.4vw,26px);line-height:1.22;font-weight:800;letter-spacing:-.02em;padding-bottom:.08em;}
.pst-end{display:flex;justify-content:space-between;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.7;padding:0 4px;}
.pst-list{display:flex;flex-direction:column;gap:5px;}
.pst-row{display:flex;align-items:center;gap:8px;min-height:48px;border-radius:14px;border:2px solid var(--pst-ink);background:var(--pst-tint);padding:0 6px 0 10px;text-align:left;width:100%;}
.pst-row .n{width:22px;font-size:15px;font-weight:800;opacity:.7;flex:none;}
.pst-row .t{flex:1;min-width:0;font-size:16px;font-weight:800;line-height:1.18;padding:4px 0;}
.pst-row .t small{display:block;font-size:12px;font-weight:700;opacity:.8;}
.pst-row.on{background:var(--pst-ink);color:var(--pst-bg);}
.pst-row.on .n{opacity:1;}
.pst-row.on .pst-mv button{border-color:var(--pst-bg);color:var(--pst-bg);}
.pst-row.e{border-style:solid;background:transparent;}
.pst-row.e .t{opacity:.6;font-weight:700;}
.pst-row.sel{box-shadow:0 0 0 3px var(--pst-bg),0 0 0 5px var(--pst-ink);}
.pst-tag{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;border:2px solid currentColor;border-radius:999px;padding:2px 8px;flex:none;}
.pst-tag.f{border-style:solid;background:var(--pst-ink);color:var(--pst-bg);}
.pst-row.on .pst-tag.f{background:var(--pst-bg);color:var(--pst-ink);}
.pst-mv{display:flex;gap:4px;flex:none;}
.pst-mv button{width:44px;height:44px;border-radius:12px;border:2px solid var(--pst-ink);background:transparent;padding:0;display:flex;align-items:center;justify-content:center;}
.pst-mv button:disabled{opacity:.3;cursor:default;}
.pst-tools{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}
.pst-tb{min-height:44px;padding:0 16px;border-radius:999px;border:2px solid var(--pst-ink);background:transparent;font-size:14px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.pst-tb.on{background:var(--pst-ink);color:var(--pst-bg);}
.pst-tb:disabled{opacity:.4;cursor:default;}
.pst-tb.wide{width:100%;min-height:56px;border-radius:14px;font-size:17px;}
.pst-in{display:flex;gap:8px;}
.pst-in input{flex:1;min-width:0;min-height:52px;border-radius:14px;border:2px solid var(--pst-ink);background:var(--pst-tint);padding:0 14px;font:inherit;font-size:18px;font-weight:800;color:var(--pst-ink);outline:none;}
.pst-in input::placeholder{color:var(--pst-ink);opacity:.55;font-weight:700;}
.pst-in input:focus{box-shadow:0 0 0 3px var(--pst-bg),0 0 0 5px var(--pst-ink);}
.pst-go{min-height:52px;padding:0 18px;border-radius:14px;border:2px solid var(--pst-ink);background:var(--pst-ink);color:var(--pst-bg) !important;font-size:16px;font-weight:800;flex:none;}
.pst-go:disabled{opacity:.45;cursor:default;}
.pst-sug{display:flex;flex-direction:column;border:2px solid var(--pst-ink);border-radius:14px;overflow:hidden;}
.pst-sug button{min-height:46px;border:0;background:transparent;text-align:left;padding:0 14px;font-size:16px;font-weight:700;}
.pst-sug button+button{border-top:1px solid var(--pst-rule);}
.pst-sug button.on{background:var(--pst-ink);color:var(--pst-bg);}
.pst-sug .none{padding:12px 14px;font-size:14px;font-weight:700;opacity:.8;}
.pst-card{border-radius:18px;background:var(--pst-ink);color:var(--pst-bg);padding:16px;text-align:center;}
.pst-card small{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.85;}
.pst-card b{display:block;font-size:24px;font-weight:800;margin-top:4px;line-height:1.2;}
.pst-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}
.pst-chip{border:2px solid var(--pst-ink);border-radius:999px;padding:5px 12px;font-size:13px;font-weight:800;background:var(--pst-tint);}
.pst-chip.on{background:var(--pst-ink);color:var(--pst-bg);}
.pst-arr{width:44px;height:44px;border-radius:22px;border:2px solid var(--pst-ink);background:transparent;display:flex;align-items:center;justify-content:center;padding:0;flex:none;}
.pst-note{text-align:center;font-size:13px;font-weight:700;opacity:.8;line-height:1.4;}
.pst-foot{display:flex;flex-direction:column;align-items:center;gap:6px;opacity:.75;}
.pst-bar{display:block;width:120px;height:4px;border-radius:2px;background:color-mix(in srgb, var(--pst-ink) 22%, transparent);overflow:hidden;}
.pst-bar>span{display:block;height:100%;background:var(--pst-ink);transition:width .25s;}
.pst-line{font-size:13px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;line-height:1.35;}
.pst-give{background:none;border:none;padding:4px 8px;font-size:12px;font-weight:700;text-decoration:underline;text-underline-offset:3px;}
.pst-give.on{font-weight:800;}
@keyframes pstRise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){.pst-top{animation:none}}
`;

// Small inline icons the hosts share.
export const ICON = {
  up: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
  down: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>,
  left: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>,
  right: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>,
  bulb: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" /></svg>,
};
