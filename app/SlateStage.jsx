'use client';

// THE SLATE BOARD ON THE WHITE STAGE (owner, 2026-11-02, the End Game
// mockups Mate / Queen / Defend / Swindle / Check and their Dark pairs).
// One board for the four chess dailies and Check's draughts, so they stay
// identical: an 8 by 8 grid of real buttons inside a 2px ink frame, light
// squares #f4f6f9 and dark #d3dbe4 on the white page (the Slate dark squares
// #353d4f / #232a39 on the near-black page, framed in #5a6680), the picked
// square full End Game gold, the last move pale gold, a legal square a small
// gold dot with an ink ring, and the coordinates printed small INSIDE the
// edge squares (ranks top left of the first column, files bottom right of
// the last row), as drawn. Pieces are the mockup's two-tone set: white
// pieces white with an ink line, black pieces ink; in the dark looks the
// black pieces keep a near-black fill with the light Slate rim (#c9d1de).
//
// It only draws. The host passes a `cell(sq)` describer and every square's
// tap goes to the host's own handler, so rules, engines, scoring and saves
// never pass through here. The plain black-and-white looks (PlayStage's
// 'plain' / 'dark') drop the gold: the pick is a grey step, the dots ink.
//
// Usage (see app/mate/MateClient.jsx):
//   <SlateBoard label="Chess board" flipped={false} on={stageUp}
//     cell={(sq) => ({ piece: <SlatePiece code="K" />, sel, last, target, hint, check, label, onClick })} />
//   SlateMan({ mine, king }) is Check's draughts man.
//   SLATE_CSS is included by the board; hosts use .slb-chips over it, and
//   pass .slb-tag / .slb-leg rows as the board's children (they read the
//   board's piece colours, which are set on its wrapper).

import React, { useRef } from 'react';
import { useStageLook } from './GauntletScreens';
import usePlayStageFit from '@/lib/play-stage-fit';

export function useSlateLook() {
  const [look] = useStageLook();
  const dark = look === 'dark' || look === 'darktint';
  const mono = look === 'plain' || look === 'dark';
  return { look, dark, mono };
}

// Piece and square colours per look, as game-local variables.
export function slateVars(dark, mono) {
  const v = dark ? {
    '--slb-l': '#353d4f', '--slb-d': '#232a39', '--slb-frame': '#5a6680', '--slb-coord': '#a9b3c4',
    '--slb-wf': '#fbfaf6', '--slb-ws': '#1a1d24', '--slb-bf': '#1a1d24', '--slb-bs': '#c9d1de', '--slb-bd': '#ffffff',
    '--slb-ring': '#a9b3c4',
  } : {
    '--slb-l': '#f4f6f9', '--slb-d': '#d3dbe4', '--slb-frame': '#08222e', '--slb-coord': '#3b4656',
    '--slb-wf': '#ffffff', '--slb-ws': '#08222e', '--slb-bf': '#08222e', '--slb-bs': '#08222e', '--slb-bd': '#ffffff',
    '--slb-ring': '#3b4656',
  };
  if (mono) {
    Object.assign(v, dark
      ? { '--slb-sel': '#5a6680', '--slb-sel-ink': '#e9edf4', '--slb-last': '#2c3446', '--slb-dot': '#e9edf4', '--slb-dot-ring': '#0b0f1a' }
      : { '--slb-sel': '#9aa5b8', '--slb-sel-ink': '#08222e', '--slb-last': '#e3e8ee', '--slb-dot': '#08222e', '--slb-dot-ring': '#08222e' });
  } else {
    Object.assign(v, { '--slb-sel': 'var(--pst-acc)', '--slb-sel-ink': 'var(--pst-on-acc)', '--slb-last': 'var(--pst-pale)', '--slb-dot': 'var(--pst-acc)', '--slb-dot-ring': '#08222e' });
  }
  return v;
}

// The mockup's piece drawings, on the 45 by 45 grid. `b` parts take the
// piece's fill and line, `d` parts are detail lines, `e` the knight's eye.
const BASE = <rect className="b" x="12" y="33" width="21" height="6" rx="2" />;
const SHAPES = {
  K: <><path className="b" d="M21 4.5h3v4h4v3h-4v5h-3v-5h-4v-3h4z" /><path className="b" d="M14.5 33c-3-8-2.5-14.5 8-15.5 10.5 1 11 7.5 8 15.5z" />{BASE}</>,
  Q: <><circle className="b" cx="10.5" cy="12.5" r="2.6" /><circle className="b" cx="18.5" cy="9.5" r="2.6" /><circle className="b" cx="26.5" cy="9.5" r="2.6" /><circle className="b" cx="34.5" cy="12.5" r="2.6" /><path className="b" d="M13.5 33L10.5 15l6.5 10 1.5-13 4 12.5 4-12.5 1.5 13 6.5-10-3 18z" />{BASE}</>,
  R: <><path className="b" d="M13 19V10h4.5v3.5h3V10h4v3.5h3V10H32v9z" /><path className="b" d="M15.5 19h14l1.5 14h-17z" />{BASE}</>,
  B: <><circle className="b" cx="22.5" cy="7.5" r="2.6" /><path className="b" d="M22.5 10c-6 4.5-7 10-4.2 14.5h8.4C29.5 20 28.5 14.5 22.5 10z" /><path className="b" d="M17 33c1-3.5 2-6 2.5-8.5h6c.5 2.5 1.5 5 2.5 8.5z" />{BASE}<path className="d" d="M22.5 15v6M19.5 18h6" /></>,
  N: <><path className="b" d="M13 39h20c.5-10-1.5-19-7-26l-2-5-3 4.5C15.5 14 11 19 10 24.5l2.6 3 5.2-3.2c.3 4.5-3.3 9-4.8 14.7z" /><circle className="e" cx="19" cy="16.5" r="1.4" /></>,
  P: <><circle className="b" cx="22.5" cy="13" r="5" /><path className="b" d="M17 34c1-7 2.2-11.5 3-15h5c.8 3.5 2 8 3 15z" />{BASE}</>,
};
export function SlatePiece({ code }) {
  const white = code === code.toUpperCase();
  return (
    <svg className={'slb-pc ' + (white ? 'w' : 'k')} viewBox="0 0 45 45" aria-hidden="true" focusable="false">
      {SHAPES[code.toUpperCase()] || null}
    </svg>
  );
}

const CROWN = <svg viewBox="0 0 24 18" aria-hidden="true" focusable="false"><path d="M2 15h20l-2-11-5 5-3-7-3 7-5-5z" /></svg>;
// Check's draughts man: yours white with an ink rim, black ink with an inner
// ring; a king carries the crown.
export function SlateMan({ mine, king }) {
  return <span className={'slb-man ' + (mine ? 'y' : 'b')}>{king ? CROWN : null}</span>;
}
export const SLATE_CROWN = CROWN;

const FILES = 'abcdefgh';
export function SlateBoard({ cell, label = 'Board', flipped = false, coords = true, on = true, kind = 'chess', children = null }) {
  const ref = useRef(null);
  const fit = usePlayStageFit(ref, '.slb-board', on);
  const { dark, mono } = useSlateLook();
  const out = [];
  for (let d = 0; d < 64; d++) {
    const sq = flipped ? 63 - d : d;
    const r = sq >> 3, f = sq & 7;
    const dr = d >> 3, df = d & 7;
    const c = cell(sq) || {};
    const isDark = (r + f) % 2 === 1;
    const cls = 'slb-sq ' + (isDark ? 'd' : 'l')
      + (c.sel ? ' sel' : c.last ? ' last' : '')
      + (c.check ? ' chk' : '') + (c.hint ? ' hint' : '') + (c.lift ? ' lift' : '') + (c.live ? ' live' : '');
    out.push(
      <button key={d} type="button" className={cls} onClick={c.onClick} aria-label={c.label}>
        {coords && df === 0 ? <i>{8 - r}</i> : null}
        {coords && dr === 7 ? <b>{FILES[f]}</b> : null}
        {c.piece || null}
        {c.target ? <span className={c.piece ? 'slb-cap' : 'slb-t'} aria-hidden="true" /> : null}
      </button>
    );
  }
  return (
    <div className={'slb-wrap ' + kind} ref={ref} style={slateVars(dark, mono)}>
      <style dangerouslySetInnerHTML={{ __html: SLATE_CSS }} />
      <div className="slb-board" role="grid" aria-label={label} style={fit ? { width: `min(100%, ${fit}px)` } : undefined}>
        {out}
      </div>
      {children}
    </div>
  );
}

export const SLATE_CSS = `
/* The shared top bar's phone rule (.stb.has-t{flex:1 1 auto}) is meant for a row; in the
   stage's column it grew the bar tall and pushed the header down on a short board. */
.pst-col > .stb.has-t{flex:none;}
.pst .slb-q{font-size:clamp(20px,6vw,23px);}
.slb-wrap{display:flex;flex-direction:column;align-items:center;gap:12px;}
.slb-board{width:100%;aspect-ratio:1/1;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));border:2px solid var(--slb-frame);border-radius:8px;overflow:hidden;container-type:inline-size;touch-action:manipulation;box-sizing:border-box;}
.pst .slb-sq{position:relative;border:0;border-radius:0;margin:0;padding:0;box-shadow:none;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;font:inherit;color:var(--pst-ink);cursor:default;-webkit-tap-highlight-color:transparent;}
.pst .slb-sq.live{cursor:pointer;}
.slb-sq.l{background:var(--slb-l);}
.slb-sq.d{background:var(--slb-d);}
.slb-sq.last{background:var(--slb-last);}
.slb-sq.sel{background:var(--slb-sel);}
.slb-sq.chk{background:var(--pst-bad-bg);box-shadow:inset 0 0 0 3px var(--pst-bad);}
.slb-sq.hint{box-shadow:inset 0 0 0 3px var(--slb-dot),inset 0 0 0 5px var(--slb-dot-ring);}
.slb-sq.sel.hint{box-shadow:inset 0 0 0 2px var(--slb-dot-ring);}
.slb-sq.lift{box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--slb-ring) 55%, transparent);}
.pst .slb-sq i,.pst .slb-sq b{position:absolute;font-style:normal;font-size:clamp(8px,2.6cqw,11px);font-weight:800;line-height:1;color:var(--slb-coord);pointer-events:none;}
.pst .slb-sq i{left:3px;top:3px;}
.pst .slb-sq b{right:3px;bottom:2px;}
.pst .slb-sq.sel i,.pst .slb-sq.sel b{color:var(--slb-sel-ink);}
.slb-pc{width:77%;height:77%;display:block;pointer-events:none;overflow:visible;}
.slb-pc .b{stroke-width:2;stroke-linejoin:round;}
.slb-pc.w .b{fill:var(--slb-wf);stroke:var(--slb-ws);}
.slb-pc.k .b{fill:var(--slb-bf);stroke:var(--slb-bs);}
.slb-pc .d{fill:none;stroke-width:2;}
.slb-pc.w .d{stroke:var(--slb-ws);}
.slb-pc.k .d{stroke:var(--slb-bd);}
.slb-pc.w .e{fill:var(--slb-ws);}
.slb-pc.k .e{fill:var(--slb-bd);}
.slb-t{width:32%;aspect-ratio:1/1;border-radius:50%;background:var(--slb-dot);box-shadow:inset 0 0 0 2px var(--slb-dot-ring);pointer-events:none;}
.slb-cap{position:absolute;inset:5%;border-radius:50%;border:3px solid var(--slb-dot);box-shadow:0 0 0 1.5px var(--slb-dot-ring),inset 0 0 0 1.5px var(--slb-dot-ring);pointer-events:none;}
.slb-man{width:77%;height:77%;border-radius:50%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;pointer-events:none;}
.slb-man.y{background:var(--slb-wf);border:2.5px solid var(--slb-ws);}
.slb-man.b{background:var(--slb-bf);border:2.5px solid var(--slb-bs);box-shadow:inset 0 0 0 4px var(--slb-bf),inset 0 0 0 6px var(--slb-ring);}
.slb-man svg{width:53%;height:auto;display:block;}
.slb-man.y svg path{fill:var(--slb-ws);}
.slb-man.b svg path{fill:var(--slb-bd);}
.slb-man.b svg{position:relative;z-index:1;}
.slb-tag{align-self:center;display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:4px 12px;border-radius:999px;background:var(--pst-pale);font-size:13px;font-weight:800;text-align:center;}
.slb-tag .slb-dk{width:12px;height:12px;border-radius:6px;background:var(--slb-bf);box-shadow:0 0 0 2px var(--slb-bs);flex:none;display:inline-block;}
.slb-chips{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;}
.slb-chips span{display:inline-flex;align-items:center;height:28px;padding:0 11px;border-radius:999px;background:var(--pst-cell);font-size:12px;font-weight:800;}
.slb-leg{display:flex;gap:16px;justify-content:center;align-items:center;font-size:13px;font-weight:700;color:var(--pst-mute);flex-wrap:wrap;}
.slb-leg span{display:inline-flex;align-items:center;gap:6px;}
.slb-leg .slb-sw{display:inline-block;width:14px;height:14px;border-radius:7px;box-sizing:border-box;}
.slb-leg .slb-sw.y{background:var(--slb-wf);border:2.5px solid var(--slb-ws);}
.slb-leg .slb-sw.b{background:var(--slb-bf);border:2px solid var(--slb-bs);}
.slb-leg svg{width:16px;height:12px;}
.slb-leg svg path{fill:var(--pst-ink);}
.pst .slb-tl.on{background:var(--pst-ink);color:var(--pst-bg);}
.slb-note{text-align:center;font-size:13px;font-weight:700;color:var(--pst-mute);line-height:1.4;}
`;

// The tool row under the board: Hint (when the game still offers it) and a
// two-tap Restart; both call the host's own handlers.
export function SlateTools({ hint = null, restartArmed = false, onRestart }) {
  return (
    <div className="pst-tools">
      {hint ? (
        <button type="button" className="pst-tb slb-tl" onClick={hint}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.6 1 2.5h6c0-.9.2-1.7 1-2.5A6 6 0 0 0 12 3z" /></svg>
          Hint
        </button>
      ) : null}
      <button type="button" className={'pst-tb slb-tl' + (restartArmed ? ' on' : '')} onClick={onRestart}
        aria-label={restartArmed ? 'Tap again to restart. This records a 0' : 'Restart this board'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
        {restartArmed ? 'Tap again' : 'Restart'}
      </button>
    </div>
  );
}

export const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const PIECE_NAMES = { K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn' };
