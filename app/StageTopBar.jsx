'use client';

// THE PHONE STAGE'S TOP BAR (owner, 2026-10-24): the gauntlet entry card's
// header, shared by every phone stage (the word stage, Bracket, the sudokus).
// The Mind Loft mark and name on the left, then All Puzzles and the look
// switch on the right, all in the stage's one ink. It sits in the page's flow
// at the top of the column, so it scrolls away with the content.

import React from 'react';
import MindLoftMark from './MindLoftMark';
import { nextLook, LOOK_NAMES } from '@/lib/stage-look';

export default function StageTopBar({ look, onFlip, href = '/', ink = 'currentColor' }) {
  const next = LOOK_NAMES[nextLook(look)];
  return (
    <div className="stb" style={{ color: ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a className="stb-logo" href={href} aria-label="Mind Loft home">
        <MindLoftMark size={26} ink={ink} accent={ink} title="Mind Loft" />
        <span>Mind Loft</span>
      </a>
      <span className="stb-r">
        <a className="stb-back" href={href}><span aria-hidden="true">&larr;</span> All Puzzles</a>
        <button type="button" className="stb-look" onClick={onFlip}
          aria-label={`Look: ${LOOK_NAMES[look] || 'Color'}. Switch to ${next}`} title={`Switch to ${next}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" /></svg>
        </button>
      </span>
    </div>
  );
}

const CSS = `
.stb{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;}
.stb .stb-logo{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:inherit;font-weight:800;font-size:16px;letter-spacing:-.01em;}
.stb .stb-r{display:inline-flex;align-items:center;gap:8px;}
.stb .stb-back{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:2px solid currentColor;color:inherit;text-decoration:none;font-weight:800;font-size:14px;box-sizing:border-box;}
.stb .stb-look{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;flex:none;}
.stb .stb-back:hover,.stb .stb-logo:hover span{text-decoration:underline;text-underline-offset:3px;}
`;
