'use client';

// THE CROSSWORD CLUES WHILE PLAYING, shared by Emcee (app/emcee) and Encore
// (app/encore), owner-approved 2026-10-30 ("Emcee and Encore, Fully Mocked").
//
// One markup, two layouts, chosen by CSS alone so nothing flashes on load:
//
// - NARROW (a phone, or any window where the lists do not fit beside the
//   board): under the grid only TWO clues. The active one, large and bold on
//   the pale Word card with Back and Skip either side, and under it the
//   CROSSING clue (the other direction through the selected square), quiet,
//   with "Tap to switch". Tapping it turns the cursor without moving it, so
//   the two swap places.
// - WIDE (the host is at least 880px): the board on the left; on the right
//   the active clue on top and then the full Across and Down lists in two
//   columns. Active clue filled sky, crossing clue on the pale tint, filled
//   clues muted and struck, any clue clickable.
//
// The switch is a CONTAINER query on .xw-host, which wraps only the play
// panel (no fixed-position overlay lives inside it, because a size container
// is a containing block). The client puts .xw-host around its panel, gives
// the panel .xw-play, the grid wrapper .xw-board and the grid box .xw-gb, and
// widens its own page column with .xw-page.xw-on while a game is running.
//
// Presentation only: every handler is the client's own (selectWord, stepWord,
// the direction flip), so scoring, saves and the run embed are untouched.

import React from 'react';

const dirName = (d) => (d === 'A' ? 'Across' : 'Down');

export const XW_CLUE_CSS = `
.xw-host{width:100%;container-type:inline-size;container-name:xwhost;--xw-sky:#7dd3fc;--xw-sky-ink:#08222e;--xw-pale:#e0f4fe;}
.stage-page .xw-host{--xw-pale:#13202b;}
html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light'] .xw-host{--xw-pale:#e0f4fe;}
html:is([data-stage-tone='tint'],[data-stage-tone='color'],[data-stage-tone='plain'],[data-stage-pastel='tint'],[data-stage-pastel='color'],[data-stage-pastel='plain']) .xw-host{--xw-pale:#e0f4fe !important;}
html:is([data-stage-tone^='dark'],[data-stage-pastel^='dark']) .xw-host{--xw-pale:#13202b !important;}
.xw-board{width:100%;}
.xw-side{width:100%;margin:14px auto 0;display:flex;flex-direction:column;}
.xw-clues{display:flex;flex-direction:column;gap:6px;}
.xw-act{display:flex;align-items:center;gap:8px;box-sizing:border-box;border-radius:14px;background:var(--xw-pale);border:2px solid var(--stg-ink, #08222e);padding:6px;color:var(--stg-ink, #08222e);}
.xw-act-tx{flex:1;min-width:0;padding:2px 4px;font-size:17px;font-weight:800;line-height:1.25;overflow-wrap:anywhere;}
.xw-act-k{display:block;margin-bottom:1px;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-mute, #3b4656);}
.xw-nav{flex:none;height:40px;min-width:52px;padding:0 10px;box-sizing:border-box;border-radius:11px;border:2px solid var(--stg-ink, #08222e);background:transparent;color:var(--stg-ink, #08222e);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.xw-nav:hover{background:var(--stg-surf2, rgba(8,34,46,.08));}
.xw-x{display:flex;align-items:baseline;gap:10px;width:100%;min-height:44px;box-sizing:border-box;padding:9px 12px;border-radius:12px;border:2px solid color-mix(in srgb, var(--stg-ink, #08222e) 22%, transparent);background:transparent;color:var(--stg-mute, #3b4656);font-family:inherit;font-size:14px;font-weight:700;line-height:1.3;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.xw-x b{flex:none;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;}
.xw-x span{flex:1;min-width:0;overflow-wrap:anywhere;}
.xw-x em{flex:none;font-style:normal;font-size:11px;font-weight:800;white-space:nowrap;}
.xw-x:hover{border-color:color-mix(in srgb, var(--stg-ink, #08222e) 40%, transparent);}
.xw-lists{display:none;width:100%;margin-top:14px;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;}
.xw-lists.xw-show{display:grid;}
.xw-col{display:flex;flex-direction:column;gap:2px;min-width:0;}
.xw-hd{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-mute, #3b4656);padding:0 10px 4px;}
.xw-cl{display:flex;gap:10px;align-items:baseline;width:100%;box-sizing:border-box;padding:8px 10px;border:0;border-radius:10px;background:transparent;color:var(--stg-ink, #08222e);font-family:inherit;font-size:15px;font-weight:700;line-height:1.3;text-align:left;cursor:pointer;}
.xw-cl b{flex:none;min-width:22px;font-size:13px;font-weight:800;color:var(--stg-mute, #3b4656);}
.xw-cl span{min-width:0;overflow-wrap:anywhere;}
.xw-cl:hover{background:var(--stg-surf2, rgba(8,34,46,.08));}
.xw-cl.x,.xw-cl.x:hover{background:var(--xw-pale);}
.xw-cl.on,.xw-cl.on:hover{background:var(--xw-sky);color:var(--xw-sky-ink);}
.xw-cl.on b{color:var(--xw-sky-ink);}
.xw-cl.done{color:var(--stg-mute, #3b4656);}
.xw-cl.done span{text-decoration:line-through;text-decoration-thickness:1px;}
.xw-dense .xw-cl{padding:6px 10px;font-size:14px;}
/* INSIDE CROSSED UP the run allows only its page, black and greys (owner,
   2026-10-26), so the sky and the pale card take the frame's ink and paper. */
.gsx-play .cr-host .xw-host.xw-host{--xw-sky:var(--gsx-ink, #08222e) !important;--xw-sky-ink:var(--gsx-card-paper, #ffffff) !important;--xw-pale:color-mix(in srgb, var(--gsx-ink, #08222e) 10%, var(--gsx-card-paper, #ffffff)) !important;}
@container xwhost (max-width: 479px){
  .xw-lists{grid-template-columns:1fr;gap:10px;}
  .xw-clues{padding:0 4px;}
}
@container xwhost (min-width: 880px){
  .xw-play{display:grid !important;grid-template-columns:min(var(--xw-bcol, 480px), 50cqw) minmax(0,1fr);column-gap:36px;align-items:start !important;}
  .xw-play .xw-gb{max-width:none !important;}
  .xw-side{margin:0;max-width:none !important;}
  .xw-x{display:none !important;}
  .xw-lists{display:grid;}
  .xw-act{padding:8px;}
  .xw-act-tx{font-size:22px;padding:2px 6px;}
  .xw-act-k{font-size:12px;}
}
@media (min-width: 1000px){
  .xw-page.xw-on{max-width:1120px !important;}
}
`;

export default function XwSide({ words, curIdx, crossIdx, playing, isFilled, onPick, onBack, onSkip, onSwitch, maxWidth, dense, children }) {
  const cw = words[curIdx] || words[0];
  const xw = crossIdx >= 0 ? words[crossIdx] : null;
  const row = (w, i) => {
    const active = playing && i === curIdx;
    const cross = playing && !active && i === crossIdx;
    const done = playing && !active && !cross && isFilled(w);
    return (
      <button key={`${w.dir}${w.n}`} type="button"
        className={`xw-cl${active ? ' on' : ''}${cross ? ' x' : ''}${done ? ' done' : ''}`}
        aria-current={active ? 'true' : undefined}
        onClick={() => { if (playing) onPick(i); }}>
        <b>{w.n}</b>
        <span>{w.clue}</span>
      </button>
    );
  };
  return (
    <div className={`xw-side${dense ? ' xw-dense' : ''}`} style={{ maxWidth }}>
      {playing && (
        <div className="xw-clues">
          <div className="xw-act">
            <button type="button" className="xw-nav" onClick={onBack}>Back</button>
            <div className="xw-act-tx" aria-live="polite">
              <span className="xw-act-k">{cw.n} {dirName(cw.dir)} {'·'} {cw.len} letters</span>
              {cw.clue}
            </div>
            <button type="button" className="xw-nav" onClick={onSkip}>Skip</button>
          </div>
          {xw && (
            <button type="button" className="xw-x" onClick={onSwitch}>
              <b>{xw.n} {dirName(xw.dir)}</b>
              <span>{xw.clue}</span>
              <em>Tap to switch</em>
            </button>
          )}
        </div>
      )}
      <div className={`xw-lists${playing ? '' : ' xw-show'}`}>
        <div className="xw-col">
          <div className="xw-hd">Across</div>
          {words.map((w, i) => (w.dir === 'A' ? row(w, i) : null))}
        </div>
        <div className="xw-col">
          <div className="xw-hd">Down</div>
          {words.map((w, i) => (w.dir === 'D' ? row(w, i) : null))}
        </div>
      </div>
      {children}
    </div>
  );
}
