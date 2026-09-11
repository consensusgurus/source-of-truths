'use client';

// JamBoard — one sliding-block lot, drawn the way Parker, Impound and Junkyard
// draw theirs on the stage, for a surface that deals several of them in a row.
//
// THE VALET RUN NEEDS ONE BOARD THAT TAKES ITS SIZE AS A PROP. The three solo
// clients each carry a copy of this drawing bound to their own N and EXIT_ROW
// (app/parker/ParkerClient.jsx is the original; the other two are its
// siblings), and they carry the whole game around it: saves, stats, the end
// card, the share text. The run owns all of that itself, section by section,
// so what it wants from a board is only the LOT: the wall, the exit, the
// markings, the tap layer and the blocks, plus the one interaction the three
// games share, tap a block then tap where it goes.
//
// It is a NEW component rather than a refactor of the three clients on
// purpose. Those three are live daily games with frozen banks behind them; the
// board here copies their stage drawing line for line (the marked exit, the
// fleet on the region ramp, the target dots, the shake) and changes nothing
// about how a move is decided, which is lib/jam-core's `moves` and `apply`
// exactly as the solo clients call them.
//
// Selection is the board's own state. Moves are the caller's: `onMove([i, d])`
// is called with a legal slide and the caller applies it, so the caller keeps
// the move list, the clock and the save exactly where the solo clients keep
// theirs.

import React, { useMemo, useState, useEffect } from 'react';
import { grid, moves as legalSlides, apply } from '@/lib/jam-core';
import { regionStyle, REGION_INK } from '@/lib/category-ramp';
import { T } from '@/lib/theme';

const LOT = 'var(--stg-surf, #e7e2d8)';
const LOT_LINE = 'var(--stg-line, #c9c2b4)';
const WALL = 'var(--stg-line2, #2f2a24)';
const RED_BLOCK = T.danger;
const RED_EDGE = 'var(--stg-onramp, #7a2318)';
// THE FLEET WEARS THE RAMP, exactly as on the solo boards: never lime (the
// accent that marks the block you hold), never the red car's neighbours.
const FLEET = [0, 2, 1, 4, 7, 6];
const BLOCK_FILL = 'color-mix(in srgb, var(--hue) calc(var(--stg-tint-mix, 26%) * 2.2), var(--stg-cell, #1a1d28))';

function blockCells(p) {
  const out = [];
  for (let k = 0; k < p.len; k++) out.push(p.horiz ? [p.fixed, p.pos + k] : [p.pos + k, p.fixed]);
  return out;
}
// Which lift a block gets is decided by the STARTING board (see the solo
// clients): each block takes the step none of its neighbours holds and the
// board has used least, fixed for the whole game.
export function blockTones(pieces) {
  const cells = pieces.map(blockCells);
  const touch = pieces.map(() => []);
  for (let a = 0; a < pieces.length; a++) {
    for (let b = a + 1; b < pieces.length; b++) {
      const hit = cells[a].some((x) => cells[b].some((y) => Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) === 1));
      if (hit) { touch[a].push(b); touch[b].push(a); }
    }
  }
  const col = pieces.map(() => -1);
  const used = FLEET.map(() => 0);
  for (let i = 1; i < pieces.length; i++) {
    const taken = {};
    touch[i].forEach((j) => { if (col[j] >= 0) taken[col[j]] = 1; });
    let best = -1;
    for (let h = 0; h < FLEET.length; h++) {
      if (taken[h]) continue;
      if (best < 0 || used[h] < used[best]) best = h;
    }
    if (best < 0) best = 0;
    col[i] = best;
    used[best] += 1;
  }
  return col;
}

export { apply };

export default function JamBoard({
  n, exitRow, blocks, tones, playing = true, onMove, onRefuse, onFirstTap, maxWidth = 430,
}) {
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(0);
  const cellPct = 100 / n;

  const occ = useMemo(() => grid(blocks, n), [blocks, n]);
  const slides = useMemo(() => (playing ? legalSlides(blocks, n) : []), [blocks, n, playing]);

  // The cell you tap to send the selected block a given distance: the leading
  // edge of where it would land, so a tap is never ambiguous.
  const targets = useMemo(() => {
    if (sel == null || !playing) return new Map();
    const p = blocks[sel];
    const m = new Map();
    if (!p) return m;
    for (const [i, d] of slides) {
      if (i !== sel) continue;
      const np = p.pos + d;
      const lead = d < 0 ? np : np + p.len - 1;
      const cell = p.horiz ? p.fixed * n + lead : lead * n + p.fixed;
      m.set(cell, [i, d]);
    }
    return m;
  }, [sel, blocks, slides, playing, n]);

  // A new board (the next lot) starts with nothing held.
  useEffect(() => { setSel(null); }, [n, exitRow]);

  function onCell(cell) {
    if (!playing) return;
    if (onFirstTap) onFirstTap();
    const mv = targets.get(cell);
    if (mv) { setSel(null); onMove(mv); return; }
    const r = Math.floor(cell / n), c = cell % n;
    const b = occ ? occ[r][c] : -1;
    if (b >= 0) {
      if (!slides.some(([i]) => i === b)) {
        setSel(null);
        setShake((k) => k + 1);
        if (onRefuse) onRefuse(b === 0 ? 'The red block is wedged in. Clear its lane first.' : 'That one is boxed in. Nothing can move it yet.');
        return;
      }
      setSel((v) => (v === b ? null : b));
      return;
    }
    setSel(null);
  }

  return (
    <div className="jb-wrap" style={{ maxWidth, margin: '0 auto', position: 'relative' }}>
      <style>{CSS}</style>
      <div key={shake} className={`jb-lot${shake ? ' shake' : ''}`}>
        {/* THE EXIT, marked rather than merely left empty, inside the wall's
            own band so nothing hangs past the lot on a narrow phone. */}
        <div style={{ position: 'absolute', right: -10, top: `${exitRow * cellPct}%`, width: 10, height: `${cellPct}%`, background: `color-mix(in srgb, var(--stg-acc, ${LOT}) 26%, var(--stg-ground, ${LOT}))` }} />
        <div aria-hidden="true" style={{ position: 'absolute', right: -10, top: `${exitRow * cellPct}%`, width: 10, height: 3, background: 'var(--stg-acc, transparent)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', right: -10, top: `calc(${(exitRow + 1) * cellPct}% - 3px)`, width: 10, height: 3, background: 'var(--stg-acc, transparent)' }} />
        {Array.from({ length: n - 1 }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: `${(i + 1) * cellPct}%`, top: 0, bottom: 0, width: 1, background: LOT_LINE }} />
            <div style={{ position: 'absolute', top: `${(i + 1) * cellPct}%`, left: 0, right: 0, height: 1, background: LOT_LINE }} />
          </React.Fragment>
        ))}
        {Array.from({ length: n * n }).map((_, cell) => {
          const r = Math.floor(cell / n), c = cell % n;
          const isTarget = targets.has(cell);
          return (
            <div key={cell} className="jb-cell" onClick={() => onCell(cell)} role="button" tabIndex={-1}
              aria-label={`row ${r + 1} column ${c + 1}`}
              style={{ left: `${c * cellPct}%`, top: `${r * cellPct}%`, width: `${cellPct}%`, height: `${cellPct}%`, zIndex: 3 }}>
              {isTarget && <span className="jb-dot" />}
            </div>
          );
        })}
        {blocks.map((p, i) => {
          const isRed = i === 0;
          const truck = p.len >= 3;
          const tone = (tones && tones[i]) || 0;
          const top = p.horiz ? p.fixed : p.pos;
          const left = p.horiz ? p.pos : p.fixed;
          const w = p.horiz ? p.len : 1, h = p.horiz ? 1 : p.len;
          const on = sel === i;
          return (
            <div key={i} className="jb-blk"
              style={{
                ...(!isRed ? regionStyle(FLEET[tone]) : null),
                left: `calc(${left * cellPct}% + 3px)`, top: `calc(${top * cellPct}% + 3px)`,
                width: `calc(${w * cellPct}% - 6px)`, height: `calc(${h * cellPct}% - 6px)`,
                background: isRed ? RED_BLOCK : BLOCK_FILL, zIndex: 2,
                outline: on ? '3px solid var(--stg-acc, #bef264)' : 'none',
                outlineOffset: on ? '1px' : 0,
                border: isRed ? `2px solid ${RED_EDGE}` : `${truck ? 2 : 1}px solid color-mix(in srgb, ${REGION_INK} 70%, transparent)`,
              }} />
          );
        })}
      </div>
    </div>
  );
}

const CSS = `
.jb-lot{position:relative;width:100%;aspect-ratio:1 / 1;background:${LOT};border:10px solid ${WALL};border-radius:12px;touch-action:manipulation;overflow:visible;}
.jb-cell{position:absolute;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.jb-blk{position:absolute;border-radius:9px;pointer-events:none;box-shadow:inset 0 -3px 6px rgba(0,0,0,0.22), inset 0 2px 3px rgba(255,255,255,0.28);transition:left .18s cubic-bezier(.3,.7,.4,1), top .18s cubic-bezier(.3,.7,.4,1);}
/* The lot is --stg-surf, which is #ffffff on the light register, so a white
   literal here put a white pip on a white square and the cells the selected
   car could move to showed nothing. Same token, same reason, as Turn's legal
   squares -- see --stg-cell-dot in globals.css. */
.jb-dot{position:absolute;width:26%;height:26%;border-radius:50%;background:var(--stg-cell-dot, rgba(255,255,255,0.42));pointer-events:none;left:37%;top:37%;}
.jb-lot.shake{animation:jbshake .34s ease;}
@keyframes jbshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
@media(prefers-reduced-motion:reduce){.jb-blk{transition:none;}.jb-lot.shake{animation:none;}}
`;
