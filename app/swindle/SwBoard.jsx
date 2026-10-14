'use client';

// The Swindle board, White at the bottom.

import React from 'react';
import { squareName, colorOf } from '../mate/chess';

const PIECE_PATH = {
  K: 'M22.5 3.2 h4.6 v4.4 h4.4 v4.6 h-4.4 v3.1 a7.4 7.4 0 0 1 4.9 6.9 c0 2.6 -1.4 4.4 -3.1 6.6 l-1.9 2.4 h6.9 a3 3 0 0 1 3 3 v3.6 h-27 v-3.6 a3 3 0 0 1 3 -3 h6.9 l-1.9 -2.4 c-1.7 -2.2 -3.1 -4 -3.1 -6.6 a7.4 7.4 0 0 1 4.9 -6.9 v-3.1 h-4.4 v-4.6 h4.4 v-4.4 z',
  Q: 'M8.4 12.6 a2.7 2.7 0 1 1 2.7 2.7 l2.3 8.2 l3.4 -9.9 a2.7 2.7 0 1 1 3.1 -0.1 l3.6 10.4 l3.6 -10.4 a2.7 2.7 0 1 1 3.1 0.1 l3.4 9.9 l2.3 -8.2 a2.7 2.7 0 1 1 2.7 -2.7 a2.7 2.7 0 0 1 -1.6 2.5 l-3.4 12.4 h-19.6 l-3.4 -12.4 a2.7 2.7 0 0 1 -1.6 -2.5 z M12.8 30.5 h19.4 l0.9 3.2 h-21.2 z M10.5 35.6 h24 a2.6 2.6 0 0 1 2.6 2.6 v3.2 h-29.2 v-3.2 a2.6 2.6 0 0 1 2.6 -2.6 z',
  R: 'M10.2 8 h4.9 v3.4 h4.6 v-3.4 h5.6 v3.4 h4.6 v-3.4 h4.9 v8.4 l-3.2 3 v12.6 l3.2 3.1 v3.7 h-24.6 v-3.7 l3.2 -3.1 v-12.6 l-3.2 -3 z',
  B: 'M22.5 4.6 a2.9 2.9 0 0 1 1.9 5.1 c2.9 2.3 6.2 6.3 6.2 11 c0 2.8 -1.2 4.8 -2.6 6.6 h-11 c-1.4 -1.8 -2.6 -3.8 -2.6 -6.6 c0 -4.7 3.3 -8.7 6.2 -11 a2.9 2.9 0 0 1 1.9 -5.1 z M13.6 29.3 h17.8 a2 2 0 0 1 0 4 h-17.8 a2 2 0 0 1 0 -4 z M10 35.3 h25 a2.6 2.6 0 0 1 2.6 2.6 v3.5 h-30.2 v-3.5 a2.6 2.6 0 0 1 2.6 -2.6 z',
  N: 'M15.4 41.4 c0.6 -6.6 3.4 -10.2 7.4 -13.6 c2.1 -1.8 2.9 -3 2.8 -4.4 l-3.8 2.6 c-1.9 1.3 -3.6 1.6 -5 0.9 c-1.9 -1 -2.4 -3.3 -1.6 -5.6 l-2.4 0.7 c-1.2 0.3 -2.1 -0.6 -1.7 -1.8 c1.6 -4.9 4.6 -9 8.6 -11.6 l0.7 -2.9 a1.3 1.3 0 0 1 2.4 -0.2 l0.8 1.8 c4.3 0.3 8.3 2.6 10.6 6.6 c2 3.4 2.6 7.6 2.6 12.6 c0 6 -0.7 10.6 -1.4 14.9 z',
  P: 'M22.5 8.4 a5.6 5.6 0 0 1 3.6 9.9 c2.4 1.5 4.1 4 4.1 7.1 c0 2.3 -0.9 4 -1.9 5.6 h-11.6 c-1 -1.6 -1.9 -3.3 -1.9 -5.6 c0 -3.1 1.7 -5.6 4.1 -7.1 a5.6 5.6 0 0 1 3.6 -9.9 z M11.6 35.7 h21.8 a2.6 2.6 0 0 1 2.6 2.6 v3.1 h-27 v-3.1 a2.6 2.6 0 0 1 2.6 -2.6 z',
};

// Direction A, "Slate" (owner mockup, Chess Boards and Gift canvas,
// 2026-10-14): cool grey squares that follow the register, two-tone pieces
// with a hairline, a gold last move and gold selection, quiet dots, and the
// coordinates OUTSIDE the board so no square carries a label.
const SW_CSS = `
.sw-bd{--sw-l:var(--stg-chess-l,#e8ecf3);--sw-d:var(--stg-chess-d,#a7b3c6);--sw-dot:rgba(11,13,18,.24);--sw-bstroke:#1a1d24;--sw-frame:0 0 0 1px rgba(11,15,26,.10),0 10px 28px rgba(11,15,26,.16);}
.stage-page:not([data-stage-theme='light']) .sw-bd,
html[data-stage-boot='dark'] .stage-page .sw-bd{--sw-l:#353d4f;--sw-d:#232a39;--sw-dot:rgba(233,237,244,.30);--sw-bstroke:#c9d1de;--sw-frame:0 0 0 1px rgba(255,255,255,.10),0 12px 30px rgba(0,0,0,.45);}
.sw-bd{width:100%;max-width:460px;box-sizing:border-box;margin:0 auto;display:grid;grid-template-columns:14px minmax(0,1fr);grid-template-rows:minmax(0,1fr) 16px;gap:4px 6px;}
.sw-rk{display:grid;grid-template-rows:repeat(8,minmax(0,1fr));}
.sw-fl{grid-column:2;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));}
.sw-rk span,.sw-fl span{display:flex;align-items:center;justify-content:center;font:700 10px Manrope,system-ui,sans-serif;color:var(--stg-mute,#5f6774);}
.sw-rk span{justify-content:flex-end;}
.sw-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));aspect-ratio:1/1;touch-action:manipulation;border-radius:10px;overflow:hidden;box-shadow:var(--sw-frame);}
.sw-sq{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}
`;

export function SwBoard({ pos, sel, targets, lastMove, hintSq, whiteInCheck, blackInCheck, onSquare }) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return (
    <div className="sw-bd">
      <style dangerouslySetInnerHTML={{ __html: SW_CSS }} />
      <div className="sw-rk" aria-hidden="true">{[8, 7, 6, 5, 4, 3, 2, 1].map((n) => <span key={n}>{n}</span>)}</div>
      <div className="sw-grid">
        {Array.from({ length: 64 }).map((_, sq) => {
          const r = sq >> 3, f = sq & 7;
          const dark = (r + f) % 2 === 1;
          const piece = pos[sq];
          const white = piece && colorOf(piece) === 'w';
          const isTarget = targets.includes(sq);
          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const checked = piece && piece.toUpperCase() === 'K' && ((white && whiteInCheck) || (!white && blackInCheck));
          const base = dark ? 'var(--sw-d)' : 'var(--sw-l)';
          let bg = base;
          if (isLast) bg = `linear-gradient(rgba(232,180,58,0.55), rgba(232,180,58,0.55)), ${base}`;
          if (checked) bg = `radial-gradient(circle, rgba(225,29,72,0.9) 14%, rgba(225,29,72,0.35) 58%, transparent 74%), ${base}`;
          const ring = sel === sq || hintSq === sq ? 'inset 0 0 0 3px #e8b43a' : undefined;
          return (
            <div key={sq} className="sw-sq" onClick={() => onSquare(sq)} role="button" tabIndex={-1}
              aria-label={squareName(sq) + (piece ? ` ${white ? 'white' : 'black'} ${piece.toUpperCase()}` : ' empty')}
              style={{ background: bg, boxShadow: ring }}>
              {piece && (
                <svg viewBox="0 0 45 45" aria-hidden="true" style={{ width: '88%', height: '88%', pointerEvents: 'none', filter: 'drop-shadow(0 1.5px 0 rgba(0,0,0,0.22))' }}>
                  <path d={PIECE_PATH[piece.toUpperCase()]} fill={white ? '#fbfaf6' : '#1a1d24'} style={white ? undefined : { stroke: 'var(--sw-bstroke)' }} stroke={white ? '#1a1d24' : undefined} strokeWidth={white ? 1.9 : 1.1} strokeLinejoin="round" />
                </svg>
              )}
              {isTarget && <span style={{ position: 'absolute', pointerEvents: 'none', borderRadius: '50%', ...(piece ? { inset: '6%', border: '4px solid var(--sw-dot)' } : { width: '30%', height: '30%', background: 'var(--sw-dot)' }) }} />}
            </div>
          );
        })}
      </div>
      <div className="sw-fl" aria-hidden="true">{files.map((x) => <span key={x}>{x}</span>)}</div>
    </div>
  );
}
