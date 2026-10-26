'use client';

// THE PHONE STAGE'S TOP BAR (owner, 2026-10-24; reshaped 2026-10-25): the one
// header every phone stage shares (the puzzle pages, the word stage, Bracket,
// the sudokus). On the left a back button that carries the Mind Loft mark and
// name and goes home; then, when the page passes one, its title and a line
// under it (the game and its date), the same shape as the home's category
// header; the look switch on the right, all in the stage's one ink. It sits in
// the page's flow at the top of the column, so it scrolls away with the content.

import React from 'react';
import MindLoftMark from './MindLoftMark';
import { nextLook, LOOK_NAMES } from '@/lib/stage-look';
import { soakNav } from '@/lib/tile-flood';

export default function StageTopBar({ look, onFlip, href = '/', ink = 'currentColor', title = null, sub = null }) {
  const next = LOOK_NAMES[nextLook(look)];
  return (
    <div className="stb" style={{ color: ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a className="stb-home" href={href} aria-label="Back to Mind Loft home" onClick={(e) => soakNav(e, href)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        <MindLoftMark size={18} ink={ink} accent="var(--stg-brand,#7dd3fc)" />
        <span>Mind <span style={{ color: 'var(--stg-brand,#7dd3fc)' }}>Loft</span></span>
      </a>
      {title ? (
        <span className="stb-tx">
          <span className="stb-t"><i className="stb-dot" aria-hidden="true" /><h1>{title}</h1></span>
          {sub ? <em>{sub}</em> : null}
        </span>
      ) : <span className="stb-sp" />}
      <button type="button" className="stb-look" onClick={onFlip}
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
.stb .stb-home:hover > span{text-decoration:underline;text-underline-offset:3px;}
`;
