'use client';

// THE PHONE STAGE'S TOP BAR (owner, 2026-10-24; reshaped 2026-10-25): the one
// header every phone stage shares (the puzzle pages, the word stage, Bracket,
// the sudokus). On the left a back button that carries the Mind Loft mark and
// name and goes home; then, when the page passes one, its title and a line
// under it (the game and its date), the same shape as the home's category
// header; the look switch on the right, all in the stage's one ink. It sits in
// the page's flow at the top of the column, so it scrolls away with the content.

import { BrandFit } from '@/lib/use-brand-fit';
import React from 'react';
import MindLoftMark from './MindLoftMark';
import { nextLook, nextMainLook, LOOK_NAMES } from '@/lib/stage-look';
import { soakNav } from '@/lib/tile-flood';
import { useStageHelp } from '@/lib/stage-help';
import { shareForCredit } from '@/lib/share-credit';

// `allLooks` is for the gauntlet and run stages, which keep all five looks;
// every other page flips between light with color and dark with color.
export default function StageTopBar({ look, onFlip, href = '/', ink = 'currentColor', title = null, sub = null, allLooks = false, onHelp = null, helpHere = null, nav = null, share = true, dot = null }) {
  // SIZES MATCH THE HOME'S HEADER (owner, 2026-10-28): 34px controls, 13px type.
  // THE NEW STANDARD (owner, 2026-10-28): the header carries the way back, the
  // game's name with its colour dot, Share and the look switch, nothing else.
  // The clock and How to play moved to the foot row under the board
  // (app/StageFoot.jsx) so the board gets the room. Only the runs (allLooks),
  // which have no foot row, still draw the ? up here; `helpHere` forces it.
  const registered = useStageHelp();
  const help = (helpHere ?? allLooks) ? (onHelp || registered) : null;
  // SHARE (owner, 2026-10-28: "a share button with an arrow. That prompts share
  // link"). The phone's share sheet where there is one, otherwise the link is
  // copied, stamped with the player's referral code (lib/share-credit.js).
  const [shareMsg, setShareMsg] = React.useState('');
  const shareTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(shareTimer.current), []);
  const doShare = () => shareForCredit((m) => {
    setShareMsg(m);
    clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShareMsg(''), 3600);
  });
  // SHARE SHOWS ITS WORD ONLY WHEN IT FITS (owner, 2026-10-28). The back pill
  // always keeps the Mind Loft mark and name; when the game's name would be cut
  // short, Share drops to its arrow alone, and gets its word back as soon as
  // there is room again. Measured, so a long name and a short one both work.
  const barRef = React.useRef(null);
  const [tight, setTight] = React.useState(false);
  const labW = React.useRef(0);
  React.useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || !title || !share) return undefined;
    const fit = () => {
      const h = bar.querySelector('.stb-t h1');
      const tx = bar.querySelector('.stb-t');
      const lab = bar.querySelector('.stb-share-l');
      if (!h || !tx) return;
      // What the word costs: the full button's width over the 40px arrow-only
      // one, plus a little slack so it can never flip back and forth at the edge.
      const btn = bar.querySelector('.stb-share');
      if (lab && btn && !btn.classList.contains('tight')) labW.current = btn.offsetWidth - 34 + 4;
      setTight((t) => {
        if (!t) return h.scrollWidth > h.clientWidth + 1;
        const room = tx.clientWidth - (h.offsetLeft - tx.offsetLeft) - h.scrollWidth;
        return room < (labW.current || 64);
      });
    };
    fit();
    let ro;
    try { ro = new ResizeObserver(fit); ro.observe(bar); } catch (e) {}
    try { document.fonts && document.fonts.ready.then(fit); } catch (e) {}
    return () => { try { ro && ro.disconnect(); } catch (e) {} };
  }, [title, share, tight]);
  // THE PHONE TITLE IS CENTRED ON THE SCREEN (owner, 2026-10-30): under 900px
  // the name sits on the true centre of the bar, not in the space left between
  // the pills. Both sides reserve the wider of the two button groups
  // (--stb-side), so the name never runs under a button; a long name shrinks
  // with the screen and then ends in an ellipsis. Desktop is unchanged.
  React.useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || !title) return undefined;
    const measure = () => {
      const home = bar.querySelector('.stb-home');
      const kids = Array.from(bar.children).filter((c) => c.tagName !== 'STYLE' && !c.classList.contains('stb-tx') && !c.contains(home));
      if (!home) return;
      const hr = home.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      const left = hr.right - br.left;
      let minL = br.right;
      for (const k of kids) { const r = k.getBoundingClientRect(); if (r.width) minL = Math.min(minL, r.left); }
      const right = br.right - minL;
      const side = Math.ceil(Math.max(left, right) + 4);
      bar.style.setProperty('--stb-side', side + 'px');
      // Shrink to fit before the ellipsis: 19px down to 13px, then truncate.
      const h1 = bar.querySelector('.stb-t h1');
      if (!h1) return;
      h1.style.fontSize = '';
      if (!window.matchMedia || !window.matchMedia('(max-width: 899px)').matches) return;
      const base = parseFloat(getComputedStyle(h1).fontSize) || 19;
      if (h1.scrollWidth > h1.clientWidth + 1) {
        const fs = Math.max(13, Math.floor(base * (h1.clientWidth / h1.scrollWidth) * 10) / 10);
        h1.style.fontSize = fs + 'px';
      }
    };
    measure();
    let ro;
    try { ro = new ResizeObserver(measure); ro.observe(bar); Array.from(bar.children).forEach((c) => ro.observe(c)); } catch (e) {}
    try { document.fonts && document.fonts.ready.then(measure); } catch (e) {}
    return () => { try { ro && ro.disconnect(); } catch (e) {} };
  }, [title, share, tight, nav, shareMsg]);
  const next = LOOK_NAMES[allLooks ? nextLook(look) : nextMainLook(look)];
  return (
    <div ref={barRef} className={'stb' + (title ? ' has-t' : '')} style={{ color: ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <BrandFit><a className="stb-home" href={href} aria-label="Back to Mind Loft home" onClick={(e) => soakNav(e, href)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        <MindLoftMark size={16} ink={ink} accent="var(--stg-brand,#7dd3fc)" />
        <span>Mind <span>Loft</span></span>
      </a></BrandFit>
      {title ? (
        <span className="stb-tx">
          <span className="stb-t"><i className="stb-dot" aria-hidden="true" style={dot ? { background: dot } : undefined} /><h1>{title}</h1></span>
          {sub ? <em>{sub}</em> : null}
        </span>
      ) : <span className="stb-sp" />}
      {/* DESKTOP FULL SCREEN (owner, 2026-10-27): a phone stage drawn over the
          desktop page carries the page's Show Site Navigation control, since the
          stage covers the header that normally holds it. `nav` = { label, onPress }. */}
      {nav ? (
        <button type="button" className="stb-nav" onClick={(e) => { e.stopPropagation(); nav.onPress && nav.onPress(); }}>{nav.label}</button>
      ) : null}
      {share ? (
        <button type="button" className={'stb-share' + (shareMsg ? ' on' : '') + (tight ? ' tight' : '')} onClick={(e) => { e.stopPropagation(); doShare(); }}
          aria-label="Share" title={shareMsg || 'Share this puzzle'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></svg>
          {tight ? null : <span className="stb-share-l">{shareMsg ? 'Copied' : 'Share'}</span>}
          {shareMsg ? <span className="stb-sr" role="status">{shareMsg}</span> : null}
        </button>
      ) : null}
      {help ? (
        <button type="button" className="stb-look stb-help" onClick={(e) => { e.stopPropagation(); help(); }}
          aria-label="How to play" title="How to play">?</button>
      ) : null}
      <button type="button" className="stb-look" onClick={(e) => { e.stopPropagation(); onFlip && onFlip(); }}
        aria-label={`Look: ${LOOK_NAMES[look] || 'Color'}. Switch to ${next}`} title={`Switch to ${next}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" /></svg>
      </button>
    </div>
  );
}

const CSS = `
.stb{display:flex;align-items:center;gap:10px;flex:none;}
.stb .stb-home{flex:none;display:inline-flex;align-items:center;gap:5px;height:34px;box-sizing:border-box;padding:0 11px 0 7px;border-radius:999px;border:2px solid currentColor;color:inherit;text-decoration:none;font-weight:800;font-size:13px;line-height:1;white-space:nowrap;}
.stb .stb-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.stb .stb-t{display:flex;align-items:center;gap:7px;min-width:0;}
.stb .stb-t h1{margin:0;font:inherit;font-size:19px;font-weight:800;line-height:1.3;letter-spacing:-.01em;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:2px;margin-bottom:-2px;}
.stb .stb-dot{flex:none;width:11px;height:11px;border-radius:50%;background:var(--sp-g,#b1e5fd);box-shadow:inset 0 0 0 1.5px currentColor;}
.stb .stb-tx em{font-style:normal;font-size:12px;font-weight:600;line-height:1.3;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:1px;}
.stb .stb-sp{flex:1;}
.stb .stb-look{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:17px;border:2px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;flex:none;}
.stb .stb-help{font:inherit;font-size:16px;font-weight:800;line-height:1;}
.stb .stb-share{position:relative;flex:none;display:inline-flex;align-items:center;justify-content:center;gap:5px;height:34px;box-sizing:border-box;padding:0 11px 0 9px;border-radius:999px;border:2px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;line-height:1;cursor:pointer;white-space:nowrap;}
.stb .stb-share.tight{width:34px;padding:0;}
.stb .stb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.stb .stb-nav{flex:none;height:34px;box-sizing:border-box;padding:0 12px;border-radius:999px;border:2px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;}
.stb .stb-home:hover > span{text-decoration:underline;text-underline-offset:3px;}
@media (max-width:899px){
  .stb.has-t{position:relative;flex:1 1 auto;width:100%;min-width:0;}
  .stb.has-t .stb-tx{position:absolute;left:var(--stb-side,124px);right:var(--stb-side,124px);top:50%;transform:translateY(-50%);align-items:center;text-align:center;pointer-events:none;}
  .stb.has-t .stb-tx > *{max-width:100%;pointer-events:auto;}
  .stb.has-t .stb-t{justify-content:center;max-width:100%;gap:5px;}
  .stb.has-t .stb-t h1{font-size:clamp(15px, 4.9vw, 19px);}
  .stb.has-t .stb-tx + *{margin-left:auto;}
  .stb .stb-share{width:34px;padding:0;}
  .stb .stb-share .stb-share-l{display:none;}
}
`;
