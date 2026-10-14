'use client';

// JamLot — the stage board shared by Parker (6x6), Impound (7x7) and Junkyard
// (8x8). Round six rebuild (owner, 2026-10-14). PRESENTATION ONLY: the three
// clients still own the state, the moves, the save, the hint and the scoring,
// and hand this component what to draw plus the handlers to call. The tap
// rule is exactly the one the clients always had: tapping a target square
// (the leading edge of a landing spot) slides the held block there, tapping a
// block picks it up, anything else drops the selection.
//
// What it draws: a moves meter with Perfect and Par ticks above the board; a
// walled lot whose wall, inset, corner radius and groove all scale with the
// lot size; neutral slate blocks (cars one tone, trucks a shade deeper) each
// carrying a groove along its axis; the red block as the only colour, with a
// white arrow; a dotted lane from the red block to the gap; an EXIT marker
// outside the wall; every landing spot as a full dashed accent outline of the
// held block; one status sentence and one muted helper line; Restart and Hint
// as outline buttons; Give up as a small link with the arm-to-confirm.
//
// The finish beat (lib/finish-beats.js `exit`) reads `.pk-lot` and `.pk-blk`,
// red first in DOM order, so both class names and that order are load-bearing.
//
// Colours are register-aware custom properties scoped to `.jl-board`, dark by
// default with a light override carrying the boot-stamp guard so a dark reader
// never sees one light frame.

import React, { useState } from 'react';
import { Lightbulb, RotateCcw, Eye } from 'lucide-react';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

// Sizes by lot width: [desktop, phone]. Bigger lots get thinner walls, tighter
// insets and smaller corners so the cells keep their share of the board.
const SIZE = {
  6: { w: [12, 8], ins: [4, 3], r: [10, 8], gt: [5, 4] },
  7: { w: [11, 7], ins: [3.5, 2.5], r: [9, 6], gt: [4.5, 3.5] },
  8: { w: [10, 6], ins: [3, 2], r: [7, 5], gt: [4, 3] },
};

const CSS = `
.jl{font-family:${SANS};}
.jl-board{
  --jl-lot:color-mix(in srgb, #000 32%, var(--stg-cell, #1a1d28));
  --jl-grid:color-mix(in srgb, var(--stg-ink, #e9edf4) 9%, var(--jl-lot));
  --jl-wallc:color-mix(in srgb, var(--stg-ink, #e9edf4) 26%, var(--stg-cell, #1a1d28));
  --jl-car:color-mix(in srgb, #7a879e 52%, var(--stg-cell, #1a1d28));
  --jl-truck:color-mix(in srgb, #7a879e 36%, var(--stg-cell, #1a1d28));
  --jl-edge:color-mix(in srgb, var(--stg-ink, #e9edf4) 24%, var(--jl-car));
  --jl-groove:color-mix(in srgb, #05070c 52%, var(--jl-car));
  --jl-red:#ef4444;
  --jl-red-edge:#fca5a5;
  --jl-ghost:var(--stg-acc, #a3e635);
  --jl-ghost-fill:color-mix(in srgb, var(--stg-acc, #a3e635) 15%, transparent);
  --jl-ghost-hot:color-mix(in srgb, var(--stg-acc, #a3e635) 30%, transparent);
  --jl-ring:var(--stg-acc, #a3e635);
}
html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light'] .jl-board{
  --jl-lot:color-mix(in srgb, #0b0d12 5%, var(--stg-cell, #ffffff));
  --jl-grid:#d4dae3;
  --jl-wallc:#1e2433;
  --jl-car:#a3adc0;
  --jl-truck:#8793a8;
  --jl-edge:#4f596d;
  --jl-groove:#3f4859;
  --jl-red:#dc2626;
  --jl-red-edge:#991b1b;
  --jl-ghost:var(--stg-acc-ink, #0369a1);
  --jl-ghost-fill:color-mix(in srgb, var(--stg-acc-ink, #0369a1) 12%, transparent);
  --jl-ghost-hot:color-mix(in srgb, var(--stg-acc-ink, #0369a1) 26%, transparent);
  --jl-ring:var(--stg-acc-ink, #0369a1);
}
.jl-meter{max-width:560px;margin:0 auto 14px;}
.jl-mhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.jl-mhead b{font-weight:800;color:var(--stg-ink,#e9edf4);}
.jl-mhead .jl-mv{font-size:16px;color:var(--stg-acc-ink,var(--stg-acc));}
.jl-mtrack{position:relative;height:10px;border-radius:3px;background:var(--stg-line2,rgba(255,255,255,.17));margin-top:8px;}
.jl-mfill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width .18s ease-out;}
.jl-mtick{position:absolute;top:-4px;width:2px;height:18px;}
.jl-mlabs{position:relative;height:14px;margin-top:3px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
.jl-mlabs span{position:absolute;white-space:nowrap;}
.jl-panel{max-width:560px;margin:0 auto;background:var(--stg-surf,rgba(255,255,255,.045));border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:20px;padding:24px 20px 16px;}
.jl-stage{display:flex;align-items:stretch;justify-content:center;}
.jl-wall{position:relative;flex:0 1 456px;min-width:0;padding:var(--jl-w);border-radius:calc(var(--jl-r) + var(--jl-w) * .5);background:var(--jl-wallc);}
.jl-gap{position:absolute;right:0;width:var(--jl-w);background:var(--jl-lot);}
.jl-exit{position:relative;flex:0 0 36px;}
.jl-exit-in{position:absolute;left:6px;display:flex;flex-direction:column;align-items:center;gap:2px;transform:translateY(-50%);color:var(--jl-red);}
.jl-exit-in span{font-size:10px;font-weight:800;letter-spacing:.1em;}
.jl-board .pk-lot{position:relative;width:100%;aspect-ratio:1 / 1;border:0;background:var(--jl-lot);border-radius:calc(var(--jl-r) * .6);touch-action:manipulation;overflow:visible;}
.jl-board .pk-lot.shake{animation:jlshake .34s ease;}
@keyframes jlshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
.jl-cell{position:absolute;cursor:pointer;-webkit-tap-highlight-color:transparent;z-index:3;}
.jl-board .pk-blk{position:absolute;box-sizing:border-box;border-radius:var(--jl-r);pointer-events:none;display:flex;align-items:center;justify-content:center;z-index:2;transition:left .18s cubic-bezier(.3,.7,.4,1), top .18s cubic-bezier(.3,.7,.4,1), box-shadow .12s;}
.jl-ghost{position:absolute;box-sizing:border-box;border-radius:var(--jl-r);border:2.5px dashed var(--jl-ghost);background:var(--jl-ghost-fill);pointer-events:none;z-index:1;transition:background .1s;}
.jl-ghost.hot{background:var(--jl-ghost-hot);}
.jl-groove{border-radius:3px;background:var(--jl-groove);}
.jl-lane{position:absolute;right:0;height:0;border-top:3px dotted var(--jl-red);opacity:.6;pointer-events:none;z-index:0;}
.jl-status{display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid var(--stg-line,rgba(255,255,255,.11));flex-wrap:wrap;}
.jl-say{flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:3px;}
.jl-say1{font-size:15px;font-weight:700;line-height:1.4;color:var(--stg-ink,#e9edf4);}
.jl-say2{font-size:12px;font-weight:600;line-height:1.45;color:var(--stg-mute,#8b95a8);}
.jl-acts{display:flex;gap:8px;flex-wrap:wrap;}
.jl-btn{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2,#aab5c7);border:1.5px solid var(--stg-mute2,#78859d);border-radius:12px;padding:0 16px;min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;}
.jl-btn:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.jl-btn:disabled{opacity:.45;cursor:default;}
.jl-btn.hint{border-color:var(--stg-acc-ink,var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.jl-foot{max-width:560px;margin:10px auto 0;display:flex;justify-content:space-between;align-items:center;gap:12px;}
.jl-rule{font-size:12px;font-weight:600;color:var(--stg-mute,#8b95a8);line-height:1.45;}
.jl-giveup{min-height:44px;background:none;border:none;cursor:pointer;font-family:${SANS};font-weight:700;font-size:12.5px;text-decoration:underline;text-underline-offset:3px;display:inline-flex;align-items:center;gap:5px;padding:0 4px;flex:0 0 auto;}
@media(max-width:560px){
  .jl-board{--jl-w:var(--jl-wm) !important;--jl-r:var(--jl-rm) !important;--jl-in:var(--jl-inm) !important;--jl-gt:var(--jl-gtm) !important;}
  .jl-panel{background:transparent;border:0;border-radius:0;padding:4px 0 0;}
  .jl-exit{flex-basis:28px;}
  .jl-exit-in{left:3px;}
  .jl-exit-in svg{width:22px;height:16px;}
  .jl-exit-in span{font-size:8px;letter-spacing:.08em;}
  .jl-meter{margin-bottom:16px;}
  .jl-mhead{font-size:10px;}
  .jl-mhead .jl-mv{font-size:15px;}
  .jl-mtrack{height:7px;}
  .jl-mtick{top:-3px;height:13px;}
  .jl-status{border-top:0;margin-top:14px;padding:0 8px;}
  .jl-say1{font-size:14px;}
  .jl-acts{flex:1 1 100%;}
  .jl-acts .jl-btn{flex:1 1 0;}
  .jl-rule{display:none;}
  .jl-foot{justify-content:flex-end;margin-top:4px;}
}
`;

export function JamMeter({ used, par, perfect }) {
  const max = Math.max(par + (par - perfect), used, par + 1);
  const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100));
  const over = used > par;
  return (
    <div className="jl-meter" role="meter" aria-label="Moves" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used}>
      <div className="jl-mhead">
        <span>Moves <b className="jl-mv" style={over ? { color: 'var(--stg-warn, #fbbf24)' } : undefined}>{used}</b></span>
        <span>Perfect <b>{perfect}</b> &middot; Par <b>{par}</b></span>
      </div>
      <div className="jl-mtrack">
        <div className="jl-mfill" style={{ width: `${pct(used)}%`, background: over ? 'var(--stg-warn, #fbbf24)' : 'var(--stg-acc-ink, var(--stg-acc))' }} />
        <span className="jl-mtick" style={{ left: `calc(${pct(perfect)}% - 1px)`, background: 'var(--stg-ink, #e9edf4)' }} />
        <span className="jl-mtick" style={{ left: `calc(${pct(par)}% - 1px)`, background: 'var(--stg-mute, #8b95a8)' }} />
      </div>
      <div className="jl-mlabs">
        <span style={{ right: `calc(${100 - pct(perfect)}% + 5px)`, color: 'var(--stg-ink, #e9edf4)' }}>Perfect</span>
        <span style={{ left: `calc(${pct(par)}% + 5px)`, color: 'var(--stg-mute, #8b95a8)' }}>Par</span>
      </div>
    </div>
  );
}

export default function JamLot({
  N, exitRow, blocks, sel, targets, hintBlock, shake,
  onCell, playing, used, par, perfect, restarts,
  onRestart, hintAvail, onHint, armed, onGiveUp, doneLine,
}) {
  const [hot, setHot] = useState(null);
  const sz = SIZE[N] || SIZE[6];
  const cp = 100 / N;
  const vars = {
    '--jl-w': `${sz.w[0]}px`, '--jl-wm': `${sz.w[1]}px`,
    '--jl-in': `${sz.ins[0]}px`, '--jl-inm': `${sz.ins[1]}px`,
    '--jl-r': `${sz.r[0]}px`, '--jl-rm': `${sz.r[1]}px`,
    '--jl-gt': `${sz.gt[0]}px`, '--jl-gtm': `${sz.gt[1]}px`,
  };

  // Landing spots for the held block, one per legal slide, each drawn as the
  // block's full footprint. The leading cell is the tap target, as before.
  const ghosts = [];
  if (sel != null && playing && blocks[sel]) {
    const p = blocks[sel];
    targets.forEach(([, d], cell) => {
      const np = p.pos + d;
      ghosts.push({ cell, top: p.horiz ? p.fixed : np, left: p.horiz ? np : p.fixed, w: p.horiz ? p.len : 1, h: p.horiz ? 1 : p.len });
    });
  }
  const red = blocks[0];
  const laneLeft = red && red.horiz ? (red.pos + red.len) * cp : null;
  const holding = sel != null && playing;

  const say1 = !playing ? doneLine
    : holding ? (sel === 0 ? 'Red block picked up. Tap an outlined space to slide it there.' : 'Block picked up. Tap an outlined space to slide it there.')
      : 'Tap a block to pick it up.';
  const say2 = playing
    ? `The groove shows which way a block slides. One slide, any distance, is one move. No undo.${restarts > 0 ? ` Restarts so far: ${restarts}.` : ''}`
    : null;

  return (
    <div className="jl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <JamMeter used={used} par={par} perfect={perfect} />
      <div className="stg-board jl-board" style={vars}>
        <div className="jl-panel">
          <div className="jl-stage">
            <div className="jl-wall">
              <div key={shake} className={`pk-lot${shake ? ' shake' : ''}`}>
                {Array.from({ length: N - 1 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: `${(i + 1) * cp}%`, top: 0, bottom: 0, width: 1, background: 'var(--jl-grid)' }} />
                    <span aria-hidden="true" style={{ position: 'absolute', top: `${(i + 1) * cp}%`, left: 0, right: 0, height: 1, background: 'var(--jl-grid)' }} />
                  </React.Fragment>
                ))}
                {playing && laneLeft != null && laneLeft < 100 && (
                  <span aria-hidden="true" className="jl-lane" style={{ left: `${laneLeft}%`, top: `calc(${(exitRow + 0.5) * cp}% - 1.5px)` }} />
                )}
                {ghosts.map((g) => (
                  <span key={g.cell} aria-hidden="true" className={`jl-ghost${hot === g.cell ? ' hot' : ''}`}
                    style={{ left: `calc(${g.left * cp}% + var(--jl-in))`, top: `calc(${g.top * cp}% + var(--jl-in))`, width: `calc(${g.w * cp}% - var(--jl-in) * 2)`, height: `calc(${g.h * cp}% - var(--jl-in) * 2)` }} />
                ))}
                {Array.from({ length: N * N }).map((_, cell) => {
                  const r = Math.floor(cell / N), c = cell % N;
                  return (
                    <div key={cell} className="jl-cell" onClick={() => onCell(cell)} role="button" tabIndex={-1}
                      aria-label={targets.has(cell) ? `Slide here, row ${r + 1} column ${c + 1}` : `row ${r + 1} column ${c + 1}`}
                      onMouseEnter={targets.has(cell) ? () => setHot(cell) : undefined}
                      onMouseLeave={targets.has(cell) ? () => setHot((v) => (v === cell ? null : v)) : undefined}
                      style={{ left: `${c * cp}%`, top: `${r * cp}%`, width: `${cp}%`, height: `${cp}%` }} />
                  );
                })}
                {blocks.map((p, i) => {
                  const isRed = i === 0;
                  const truck = p.len >= 3;
                  const top = p.horiz ? p.fixed : p.pos;
                  const left = p.horiz ? p.pos : p.fixed;
                  const w = p.horiz ? p.len : 1, h = p.horiz ? 1 : p.len;
                  const on = sel === i && playing;
                  const hinted = hintBlock === i && playing;
                  return (
                    <div key={i} className="pk-blk"
                      style={{
                        left: `calc(${left * cp}% + var(--jl-in))`, top: `calc(${top * cp}% + var(--jl-in))`,
                        width: `calc(${w * cp}% - var(--jl-in) * 2)`, height: `calc(${h * cp}% - var(--jl-in) * 2)`,
                        background: isRed ? 'var(--jl-red)' : truck ? 'var(--jl-truck)' : 'var(--jl-car)',
                        border: `1.5px solid ${isRed ? 'var(--jl-red-edge)' : 'var(--jl-edge)'}`,
                        boxShadow: on ? '0 0 0 3px var(--jl-ring), 0 6px 14px rgba(0,0,0,.35)'
                          : hinted ? '0 0 0 3px var(--stg-warn, #fbbf24)'
                            : 'inset 0 -3px 0 rgba(0,0,0,.18)',
                        zIndex: on ? 4 : 2,
                      }}>
                      {isRed ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ height: '58%', maxHeight: 26, aspectRatio: '1 / 1' }}>
                          <path d="M5 12h13M13 6l6 6-6 6" />
                        </svg>
                      ) : (
                        <span className="jl-groove" style={p.horiz ? { width: `${Math.round(45)}%`, height: 'var(--jl-gt)' } : { width: 'var(--jl-gt)', height: '45%' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <span aria-hidden="true" className="jl-gap" style={{ top: `calc(var(--jl-w) + (100% - var(--jl-w) * 2) * ${exitRow / N})`, height: `calc((100% - var(--jl-w) * 2) / ${N})` }} />
            </div>
            <div className="jl-exit" aria-hidden="true">
              <div className="jl-exit-in" style={{ top: `calc(var(--jl-w) + (100% - var(--jl-w) * 2) * ${(exitRow + 0.5) / N})` }}>
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10h22M17 3l7 7-7 7" /></svg>
                <span>EXIT</span>
              </div>
            </div>
          </div>

          <div className="jl-status">
            <div className="jl-say">
              <span className="jl-say1" aria-live="polite">{say1}</span>
              {say2 && <span className="jl-say2">{say2}</span>}
            </div>
            {playing && (
              <div className="jl-acts">
                <button type="button" className="jl-btn" onClick={onRestart} disabled={!used} title="Put every block back and zero the move count">
                  <RotateCcw size={16} strokeWidth={2.2} /> Restart board
                </button>
                {hintAvail && (
                  <button type="button" className="jl-btn hint" onClick={onHint} title="Name the block that moves next (one hint, first play only)">
                    <Lightbulb size={16} strokeWidth={2.2} /> Hint
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {playing && (
        <div className="jl-foot">
          <span className="jl-rule">Get the red block out through the gap on the right. Restart keeps the clock running.</span>
          <button type="button" className="jl-giveup" onClick={onGiveUp}
            style={{ color: armed ? 'var(--stg-bad, #fb7185)' : 'var(--stg-ink2, #aab5c7)' }}>
            <Eye size={13} /> {armed ? 'Tap again to give up and score nothing' : 'Give up'}
          </button>
        </div>
      )}
    </div>
  );
}
