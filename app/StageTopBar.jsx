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
import { useRevealPref, REVEAL } from '@/lib/reveal-pref';

// `allLooks` is for the gauntlet and run stages, which keep all five looks;
// every other page flips between light with color and dark with color.
export default function StageTopBar({ look, onFlip, href = '/', ink = 'currentColor', title = null, sub = null, allLooks = false, onHelp = null, nav = null, clock = null }) {
  // THE ? (owner, 2026-10-27): every gameplay page's stage carries How to play.
  // A host may pass onHelp; otherwise the game's cap registered its own (lib/stage-help.js).
  // THE CLOCK (owner, 2026-10-28): every puzzle page carries the timer as a
  // header button. Hidden by default (players found the running clock made
  // them nervous, 2026-10-13); one tap shows it, one tap hides it, and the
  // choice is the same site-wide sot_clock_shown the figures strip uses.
  // Rendered only when the page passes its elapsed time as `clock`.
  const [clockShown, toggleClock] = useRevealPref(REVEAL.clock);
  const registered = useStageHelp();
  const help = onHelp || registered;
  const next = LOOK_NAMES[allLooks ? nextLook(look) : nextMainLook(look)];
  return (
    <div className="stb" style={{ color: ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <BrandFit><a className="stb-home" href={href} aria-label="Back to Mind Loft home" onClick={(e) => soakNav(e, href)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        <MindLoftMark size={18} ink={ink} accent="var(--stg-brand,#7dd3fc)" />
        <span>Mind <span>Loft</span></span>
      </a></BrandFit>
      {title ? (
        <span className="stb-tx">
          <span className="stb-t"><i className="stb-dot" aria-hidden="true" /><h1>{title}</h1></span>
          {sub ? <em>{sub}</em> : null}
        </span>
      ) : <span className="stb-sp" />}
      {/* DESKTOP FULL SCREEN (owner, 2026-10-27): a phone stage drawn over the
          desktop page carries the page's Show Site Navigation control, since the
          stage covers the header that normally holds it. `nav` = { label, onPress }. */}
      {nav ? (
        <button type="button" className="stb-nav" onClick={(e) => { e.stopPropagation(); nav.onPress && nav.onPress(); }}>{nav.label}</button>
      ) : null}
      {clock != null ? (
        <button type="button" className={'stb-clock' + (clockShown ? ' on' : '')} onClick={(e) => { e.stopPropagation(); toggleClock(); }}
          aria-pressed={clockShown} aria-label={clockShown ? `Time ${clock}. Hide the clock` : 'Show the clock'} title={clockShown ? 'Hide the clock' : 'Show the clock'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5" /><path d="M9.5 2.5h5" /></svg>
          {clockShown ? <span>{clock}</span> : null}
        </button>
      ) : null}
      {help ? (
        <button type="button" className="stb-look stb-help" onClick={(e) => { e.stopPropagation(); help(); }}
          aria-label="How to play" title="How to play">?</button>
      ) : null}
      <button type="button" className="stb-look" onClick={(e) => { e.stopPropagation(); onFlip && onFlip(); }}
        aria-label={`Look: ${LOOK_NAMES[look] || 'Color'}. Switch to ${next}`} title={`Switch to ${next}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" /></svg>
      </button>
    </div>
  );
}

const CSS = `
.stb{display:flex;align-items:center;gap:10px;flex:none;}
.stb .stb-home{flex:none;display:inline-flex;align-items:center;gap:6px;height:40px;box-sizing:border-box;padding:0 12px 0 8px;border-radius:999px;border:2px solid currentColor;color:inherit;text-decoration:none;font-weight:800;font-size:14px;line-height:1;white-space:nowrap;}
.stb .stb-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.stb .stb-t{display:flex;align-items:center;gap:7px;min-width:0;}
.stb .stb-t h1{margin:0;font:inherit;font-size:19px;font-weight:800;line-height:1.3;letter-spacing:-.01em;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:2px;margin-bottom:-2px;}
.stb .stb-dot{flex:none;width:11px;height:11px;border-radius:50%;background:var(--sp-g,#b1e5fd);box-shadow:inset 0 0 0 1.5px currentColor;}
.stb .stb-tx em{font-style:normal;font-size:12px;font-weight:600;line-height:1.3;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:1px;}
.stb .stb-sp{flex:1;}
.stb .stb-look{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;flex:none;}
.stb .stb-help{font:inherit;font-size:19px;font-weight:800;line-height:1;}
.stb .stb-clock{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:40px;height:40px;box-sizing:border-box;padding:0 11px;border-radius:20px;border:2px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;cursor:pointer;}
.stb .stb-clock:not(.on){padding:0;width:40px;}
.stb .stb-nav{flex:none;height:40px;box-sizing:border-box;padding:0 14px;border-radius:999px;border:2px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;}
.stb .stb-home:hover > span{text-decoration:underline;text-underline-offset:3px;}
`;
