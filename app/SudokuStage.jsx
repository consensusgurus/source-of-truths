'use client';

// THE SUDOKU STAGE (owner, 2026-10-31: the round 8 periwinkle mockups for the
// nineteen sudokus). One shared board, digit pad, tools row and status line on
// the white PlayStage, so every sudoku looks the same and only its variant
// marks differ. It keeps NO game state: each client passes what to draw and
// wires every control to its own handlers, so scoring, saves, timers, hints,
// auto-move, posting, archives and the finish are untouched.
//
// The board is ONE painted SVG under a CSS grid of real <button> cells,
// drawn in CELL UNITS (cell r,c spans x c..c+1, y r..r+1), so a variant's marks
// are written once and scale with the board. Layer order, bottom to top:
//   base -> cell fills -> `under` (thermos, arrows, lines) -> thin separators
//   -> region / box walls -> `over` (dots, cages, anything on top) -> frame.
// Strokes that must stay a fixed pixel width use vector-effect non-scaling.
// Outside clues (Sando, Frame, Rim, Towers) sit in gutters measured in cells.
// SOLID strokes only, anywhere (owner: no dotted or dashed lines).

import React, { useRef } from 'react';
import PlayStage from './PlayStage';
import { useStageLook, isDarkLook } from '@/lib/stage-look';
import usePlayStageFit from '@/lib/play-stage-fit';
import { gameColor } from '@/lib/category-ramp';

// The day line over the board: "Saturday · No. 110 · classic".
export function sudokuEyebrow(puzzle, tag) {
  let day = '';
  try { day = new Date(`${puzzle.live}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }); } catch (e) {}
  const head = puzzle.sunday ? 'Sunday Edition' : day;
  return [head, `No. ${puzzle.num}`, tag].filter(Boolean).join(' · ');
}

// Standard box index for an n x n board with boxes bw wide and bh tall.
export const boxRegion = (bw, bh, n) => (r, c) => Math.floor(r / bh) * Math.ceil(n / bw) + Math.floor(c / bw);

// Tool icons (18px, stroke 2.3), as drawn in the mockups.
const sv = (d) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
export const SK_ICON = {
  notes: sv(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>),
  auto: sv(<><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></>),
  undo: sv(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>),
  erase: sv(<><path d="M20 20H9L4 15l10-10 7 7-8 8" /><path d="M8.5 10.5l6 6" /></>),
  clear: sv(<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>),
  hint: sv(<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />),
  zoom: sv(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /><path d="M11 8.5v5M8.5 11h5" /></>),
  whole: sv(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16M4 12h16" /></>),
};

// Board tokens per look. Light: white base, #8e9aab thin rules, ink walls,
// player digits deep periwinkle. Dark: a lifted near-black base, slate rules,
// player digits the periwinkle itself (PlayStage's --pst-deep).
function boardVars(dark) {
  return dark
    ? { '--sks-base': '#0f1420', '--sks-thin': '#4b566a', '--sks-wall': 'var(--pst-ink)', '--sks-note': '#a9b3c4', '--sks-mark': '#5b6680', '--sks-mark2': '#8592a4', '--sks-off': '#1a2130', '--sks-off-line': '#3a4458', '--sks-off-ink': '#6b7588', '--sks-halo': '#0f1420' }
    : { '--sks-base': '#ffffff', '--sks-thin': '#8e9aab', '--sks-wall': 'var(--pst-ink)', '--sks-note': '#3b4656', '--sks-mark': '#c9d1dc', '--sks-mark2': '#8592a4', '--sks-off': '#f1f4f8', '--sks-off-line': '#c5cdd8', '--sks-off-ink': '#8e9aab', '--sks-halo': '#ffffff' };
}

/**
 * SudokuBoard: the painted board alone (usable without the stage).
 *   n            board size (9, 6, 16 ...)
 *   region(r,c)  region / box index; walls are drawn between different regions
 *   given[i]     printed digit (0 none)       cells[i]  player digit (0 none)
 *   notes[i]     pencil bitmask (bit d = candidate d)   noteCols (default ceil(sqrt n))
 *   sel          selected index (-1 none)     hl  digit whose copies get the ring
 *   peer(i)      optional: true when i is lit pale for the selection (default row/col/region)
 *   fill(i)      optional: a CSS colour that replaces the cell's fill (null = default)
 *   cellClass(i) optional extra class on a cell button ('bad', 'halo', ...)
 *   cellProps(i) optional extra props (handlers) spread on the cell button
 *   onCell(i)    tap handler                  glyph(d) display text for a digit
 *   gutter       { t, r, b, l } gutter sizes in cells (outside clues)
 *   outside      [{ side: 't'|'r'|'b'|'l', i, content, state: 'on'|'done'|'ok'|'bad', label }]
 *   under / over SVG children in cell units, or (geom) => children
 *   thin         false to skip the thin separators (Sumo draws its own)
 *   cellLabel(i) optional aria-label
 *   noteN        optional: candidates per note grid (default n; Giant's zoomed quarter passes 16)
 */
export function SudokuBoard({
  n = 9, region = null, given = [], cells = [], notes = [], noteCols = null, noteN = null,
  sel = -1, hl = 0, peer = null, fill = null, cellClass = null, cellProps = null, onCell = null,
  glyph = null, gutter = null, outside = null, under = null, over = null, thin = true,
  cellLabel = null, disabled = false, digitScale = 0.56, noteScale = 0.26, className = '', style = null, boardRef = null,
}) {
  const reg = region || boxRegion(n === 6 ? 3 : Math.round(Math.sqrt(n)), n === 6 ? 2 : Math.round(Math.sqrt(n)), n);
  const gt = (gutter && gutter.t) || 0, gr = (gutter && gutter.r) || 0, gb = (gutter && gutter.b) || 0, gl = (gutter && gutter.l) || 0;
  const W = gl + n + gr, H = gt + n + gb;
  const N = n * n;
  const selR = sel >= 0 ? Math.floor(sel / n) : -1, selC = sel >= 0 ? sel % n : -1;
  const selG = sel >= 0 ? reg(selR, selC) : -1;
  const isPeer = (i) => {
    if (sel < 0 || i === sel) return false;
    if (peer) return !!peer(i);
    const r = Math.floor(i / n), c = i % n;
    return r === selR || c === selC || reg(r, c) === selG;
  };
  const geom = { n, W, H, gt, gr, gb, gl, region: reg };
  const fills = [];
  for (let i = 0; i < N; i++) {
    const custom = fill ? fill(i) : null;
    const col = i === sel ? 'var(--pst-acc)' : (custom || (isPeer(i) ? 'var(--pst-pale)' : null));
    if (col) fills.push(<rect key={i} x={i % n} y={Math.floor(i / n)} width="1" height="1" fill={col} />);
  }
  const thinD = [], wallD = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (c < n - 1) ((reg(r, c) !== reg(r, c + 1)) ? wallD : thinD).push(`M${c + 1} ${r}V${r + 1}`);
    if (r < n - 1) ((reg(r, c) !== reg(r + 1, c)) ? wallD : thinD).push(`M${c} ${r + 1}H${c + 1}`);
  }
  const pct = (v, of) => `${(v / of) * 100}%`;
  // noteN: how many candidates a note grid holds (default n). Giant's zoomed
  // quarter is an 8 by 8 board whose notes still run 1 to G.
  const nd = noteN || n;
  const nc = noteCols || Math.ceil(Math.sqrt(nd));
  const nr = Math.ceil(nd / nc);
  const g = glyph || ((d) => d);
  const kids = (x) => (typeof x === 'function' ? x(geom) : x);
  return (
    <div className={'sks-bd ' + className} ref={boardRef} role="grid" aria-label={`Sudoku grid, ${n} by ${n}`}
      style={{ '--sks-w': W, '--sks-h': H, aspectRatio: `${W} / ${H}`, ...style }}>
      <svg className="sks-paint" viewBox={`${-gl} ${-gt} ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width={n} height={n} fill="var(--sks-base)" />
        {fills}
        {kids(under)}
        {thin ? <path d={thinD.join('')} stroke="var(--sks-thin)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" /> : null}
        <path d={wallD.join('')} stroke="var(--sks-wall)" strokeWidth="2.2" fill="none" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
        {kids(over)}
        <rect x="0" y="0" width={n} height={n} rx={0.12} fill="none" stroke="var(--sks-wall)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="sks-cells" style={{ left: pct(gl, W), top: pct(gt, H), width: pct(n, W), height: pct(n, H), gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`, '--sks-dg': digitScale, '--sks-ng': noteScale }}>
        {Array.from({ length: N }).map((_, i) => {
          const gv = given[i] || 0;
          const v = gv || cells[i] || 0;
          const nm = !v ? (notes[i] || 0) : 0;
          const r = Math.floor(i / n), c = i % n;
          const cls = ['sks-cl', gv ? 'giv' : (v ? 'ent' : ''), i === sel ? 'sel' : '', hl && v === hl && i !== sel ? 'same' : '', cellClass ? (cellClass(i) || '') : ''].filter(Boolean).join(' ');
          const extra = cellProps ? (cellProps(i) || null) : null;
          return (
            <button key={i} type="button" className={cls} disabled={disabled}
              aria-label={cellLabel ? cellLabel(i) : `Row ${r + 1}, column ${c + 1}, ${gv ? `printed ${g(gv)}` : v ? g(v) : 'empty'}${i === sel ? ', selected' : ''}`}
              onClick={onCell ? () => onCell(i) : undefined} {...extra}>
              {v ? <span className="d">{g(v)}</span> : nm ? (
                <span className="nt" style={{ gridTemplateColumns: `repeat(${nc}, 1fr)`, gridTemplateRows: `repeat(${nr}, 1fr)` }}>
                  {Array.from({ length: nd }).map((__, k) => <i key={k}>{nm & (1 << (k + 1)) ? g(k + 1) : ''}</i>)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {outside ? outside.map((o, k) => {
        const horiz = o.side === 't' || o.side === 'b';
        const x = horiz ? gl + o.i : (o.side === 'l' ? 0 : gl + n);
        const y = horiz ? (o.side === 't' ? 0 : gt + n) : gt + o.i;
        const w = horiz ? 1 : (o.side === 'l' ? gl : gr);
        const h = horiz ? (o.side === 't' ? gt : gb) : 1;
        return (
          <div key={k} className={'sks-gut ' + o.side} style={{ left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H) }} aria-label={o.label || undefined} role={o.label ? 'note' : undefined}>
            <span className={'sks-chip' + (o.state ? ' ' + o.state : '')}>{o.content}</span>
          </div>
        );
      }) : null}
    </div>
  );
}

/**
 * SudokuPad: the digit pad. keys = [{ d, left, done, armed, label }], onDigit(d), cols (default keys.length).
 * Square keys, digit big, squares-left small: in the corner when there are 8 or
 * more keys across, "N left" under the digit when fewer. A finished digit greys
 * out and is struck. The armed digit is full periwinkle.
 */
export function SudokuPad({ keys = [], onDigit, cols = null, note = false, glyph = null }) {
  const k = cols || keys.length;
  const g = glyph || ((d) => d);
  return (
    <div className={'sks-pad' + (k >= 8 ? ' wide' : '')} style={{ gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))` }} aria-label="Numbers, with squares left">
      {keys.map((x) => (
        <button key={x.d} type="button" className={'sks-dk' + (x.done ? ' done' : '') + (x.armed ? ' armed' : '') + (note ? ' note' : '')}
          onClick={() => { if (!x.done && onDigit) onDigit(x.d); }} aria-disabled={x.done || undefined}
          aria-label={x.label || `${note ? 'Pencil' : 'Enter'} ${g(x.d)}${x.left != null ? `, ${x.left} left` : ''}${x.done ? ', all placed' : ''}`}>
          <b>{g(x.d)}</b>
          {x.left != null && !x.done ? <small>{k >= 8 ? x.left : `${x.left} left`}</small> : (k < 8 ? <small>{x.done ? 'done' : ''}</small> : null)}
        </button>
      ))}
    </div>
  );
}

/**
 * SudokuTools: one row, equal columns, icon over label, in a fixed order.
 * tools = { notes: {on, onPress}, auto: {on, onPress}, undo: {onPress, disabled},
 *           erase: {onPress, disabled}, clear: {armed, onPress, disabled}, hint: {onPress} }
 * Any entry left out (or null) is not drawn. `extra` = [{ key, label, icon, onPress, on, disabled }] appended.
 */
export function SudokuTools({ tools = {}, extra = null }) {
  const row = [];
  const t = tools || {};
  if (t.notes) row.push({ key: 'notes', label: 'Notes', icon: SK_ICON.notes, on: !!t.notes.on, pressed: !!t.notes.on, onPress: t.notes.onPress, title: 'Pencil candidates (N)' });
  if (t.auto) row.push({ key: 'auto', label: 'Auto-move', icon: SK_ICON.auto, on: !!t.auto.on, pressed: !!t.auto.on, onPress: t.auto.onPress, title: 'Move to the next empty square after each number you enter' });
  if (t.undo) row.push({ key: 'undo', label: 'Undo', icon: SK_ICON.undo, onPress: t.undo.onPress, disabled: !!t.undo.disabled, title: 'Undo (Ctrl+Z)' });
  if (t.erase) row.push({ key: 'erase', label: 'Erase', icon: SK_ICON.erase, onPress: t.erase.onPress, disabled: !!t.erase.disabled, title: 'Erase the selected square (Backspace)' });
  if (t.clear) row.push({ key: 'clear', label: t.clear.armed ? 'Sure?' : 'Clear', icon: SK_ICON.clear, onPress: t.clear.onPress, disabled: !!t.clear.disabled, warn: !!t.clear.armed, title: t.clear.armed ? 'Tap again to clear every number you entered' : 'Clear every number you entered (two taps)' });
  if (t.hint) row.push({ key: 'hint', label: 'Hint', icon: SK_ICON.hint, onPress: t.hint.onPress, soft: true, title: 'Fill one correct square (one hint, first play only)' });
  if (extra) for (const x of extra) if (x) row.push(x);
  if (!row.length) return null;
  return (
    <div className="sks-tools" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`, '--sks-tn': row.length }}>
      {row.map((x) => (
        <button key={x.key} type="button" className={'sks-tb' + (x.on ? ' on' : '') + (x.soft ? ' soft' : '') + (x.warn ? ' warn' : '')}
          onClick={x.onPress} disabled={x.disabled} title={x.title} aria-pressed={x.pressed != null ? x.pressed : undefined}>
          {x.icon}<span className="l">{x.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * SudokuStage: PlayStage + board + pad + tools + status line + foot.
 *   gameKey, label   the registry key (accent) and the page name
 *   eyebrow          the day line (sudokuEyebrow)
 *   board            props for SudokuBoard
 *   pad              props for SudokuPad, or null for no pad (Whittle)
 *   tools / extraTools  see SudokuTools
 *   playing          false hides pad and tools (the finished board stays)
 *   line             the one status line ("N of M filled ...")
 *   giveUp, clock, done   passed to PlayStage's foot (two-tap Give up)
 *   above / between / below   optional nodes: above the board, between board and pad, under the tools
 *   wide             a wider desktop column (PlayStage wide)
 */
export default function SudokuStage({
  gameKey, label, eyebrow = null, board = {}, pad = null, tools = null, extraTools = null,
  playing = true, line = null, giveUp = null, clock = null, done = null,
  above = null, between = null, below = null, wide = false, nav = null, look = null,
}) {
  const [storedLook] = useStageLook();
  const lk = look || storedLook;
  const dark = isDarkLook(lk);
  // The black-and-white looks keep the board colourless; the player's digits
  // then read as the muted ink rather than the printed ink.
  const mono = lk === 'plain' || lk === 'dark';
  const ref = useRef(null);
  const fit = usePlayStageFit(ref, '.sks-bd', true);
  const W = (board.gutter ? (board.gutter.l || 0) + (board.gutter.r || 0) : 0) + (board.n || 9);
  const H = (board.gutter ? (board.gutter.t || 0) + (board.gutter.b || 0) : 0) + (board.n || 9);
  const fitW = fit ? Math.floor(fit * W / H) : null;
  return (
    <PlayStage bg={gameColor(gameKey)} label={label} eyebrow={eyebrow} nav={nav} look={look} wide={wide}
      top={(
        <div className="sks" ref={ref} style={{ ...boardVars(dark), '--sks-ent': mono ? 'var(--pst-mute)' : 'var(--pst-deep)', ...(fitW ? { '--sks-fit': `${fitW}px` } : null) }}>
          <style dangerouslySetInnerHTML={{ __html: SKS_CSS }} />
          {above}
          <SudokuBoard {...board} disabled={board.disabled != null ? board.disabled : !playing} />
          {between}
          {playing && pad ? <SudokuPad {...pad} /> : null}
          {playing && (tools || extraTools) ? <SudokuTools tools={tools} extra={extraTools} /> : null}
          {below}
        </div>
      )}
      foot={line}
      giveUp={giveUp}
      clock={clock}
      done={done} />
  );
}

export const SKS_CSS = `
.pst-top:has(> .sks){justify-content:flex-start;}
.pst-col:has(.sks) > .stb.has-t{flex:none;}
.pst-col:has(.sks) .pst-foot{opacity:1;color:var(--pst-mute);}
.pst-col:has(.sks) .pst-eb{font-size:12px;opacity:1;color:var(--pst-mute);}
.sks{display:flex;flex-direction:column;gap:12px;width:100%;min-width:0;}
.sks-bd{position:relative;flex:none;align-self:center;width:min(100%, var(--sks-fit, 100%));container-type:inline-size;user-select:none;-webkit-user-select:none;}
.sks-paint{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible;}
.sks-cells{position:absolute;display:grid;}
.pst .sks-cl{position:relative;border:0;margin:0;padding:0;background:transparent;font:inherit;color:var(--pst-ink);display:flex;align-items:center;justify-content:center;font-weight:800;line-height:1;min-width:0;min-height:0;font-variant-numeric:tabular-nums;touch-action:manipulation;font-size:calc(100cqw / var(--sks-w) * var(--sks-dg, .56));}
.pst .sks-cl:disabled{cursor:default;}
.pst .sks-cl:focus-visible{outline:2px solid var(--pst-ink);outline-offset:-4px;}
.sks-cl.ent{color:var(--sks-ent, var(--pst-deep));font-weight:700;}
.sks-cl.sel,.sks-cl.sel.ent{color:var(--pst-on-acc);}
.sks-cl.same::after{content:'';position:absolute;inset:3px;border:2px solid var(--pst-deep);border-radius:5px;pointer-events:none;}
.sks-cl.bad{color:var(--pst-bad);}
.sks-cl.halo .d{text-shadow:0 0 2px var(--sks-halo),0 0 3px var(--sks-halo),0 0 4px var(--sks-halo);}
.sks-cl .nt{position:absolute;inset:2px;display:grid;font-weight:800;color:var(--sks-note);line-height:1;font-size:calc(100cqw / var(--sks-w) * var(--sks-ng, .26));}
.sks-cl.sel .nt{color:var(--pst-on-acc);}
.sks-cl .nt i{font-style:normal;display:flex;align-items:center;justify-content:center;}
.sks-gut{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--pst-ink);line-height:1;font-variant-numeric:tabular-nums;font-size:min(calc(100cqw / var(--sks-w) * .42), 15px);}
.sks-chip{display:inline-flex;align-items:center;justify-content:center;min-width:min(calc(100cqw / var(--sks-w) * .7), 26px);min-height:min(calc(100cqw / var(--sks-w) * .7), 26px);padding:0 3px;border-radius:7px;box-sizing:border-box;}
.sks-chip.on{background:var(--pst-pale);box-shadow:inset 0 0 0 2px var(--pst-deep);color:var(--pst-deep);}
.sks-chip.done{color:var(--sks-off-ink);}
.sks-chip.ok{background:var(--pst-acc);box-shadow:inset 0 0 0 2px var(--pst-ink);color:var(--pst-on-acc);border-radius:999px;}
.sks-chip.bad{color:var(--pst-bad);}
.sks-tri{display:flex;gap:1px;font-size:calc(100cqw / var(--sks-w) * .32);font-weight:800;line-height:1;}
.sks-tri.v{flex-direction:column;gap:0;line-height:1.05;}
.sks-pad{display:grid;gap:3px;}
.pst .sks-dk{position:relative;aspect-ratio:1/1;min-width:0;border-radius:10px;border:2px solid var(--pst-ink);background:var(--sks-base);color:var(--pst-ink);padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;touch-action:manipulation;}
.sks-dk b{font-size:clamp(18px, 6.4vw, 26px);font-weight:800;line-height:1;}
.sks-dk small{font-size:11px;font-weight:800;line-height:1;color:var(--pst-deep);}
.sks-pad.wide .sks-dk b{margin-right:4px;}
.sks-pad.wide .sks-dk small{position:absolute;right:5px;bottom:4px;}
.pst .sks-dk.armed{background:var(--pst-acc);color:var(--pst-on-acc);}
.sks-dk.armed small{color:var(--pst-on-acc);}
.pst .sks-dk.done{background:var(--sks-off);border-color:var(--sks-off-line);color:var(--sks-off-ink);cursor:default;}
.sks-dk.done b{text-decoration:line-through;}
.sks-dk.done small{color:var(--sks-off-ink);}
.sks-tools{display:grid;gap:4px;container-type:inline-size;}
/* The label fits its button (no clipping): sized from the button's own width,
   which is the row's width over the number of tools (--sks-tn), so "Auto-move"
   (about 5.15em in Manrope 800 at -.03em) fits a 360px phone as well as a 390px one. */
.sks-tb .l{display:block;font-size:min(11px, max(8.5px, calc((100cqw / var(--sks-tn, 6) - 8px) / 5.2)));}
.pst .sks-tb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;height:54px;min-width:0;border-radius:12px;border:2px solid var(--pst-ink);background:var(--sks-base);color:var(--pst-ink);font-size:11px;font-weight:800;letter-spacing:-.03em;padding:0;white-space:nowrap;overflow:visible;touch-action:manipulation;}
.pst .sks-tb.on{background:var(--pst-acc);color:var(--pst-on-acc);}
.pst .sks-tb.soft{background:var(--pst-pale);}
.pst .sks-tb.warn{background:var(--pst-bad-bg);color:var(--pst-bad);border-color:var(--pst-bad);}
.pst .sks-tb:disabled{opacity:.4;cursor:default;}
@media (hover:hover) and (pointer:fine){.pst .sks-dk:not(.done):hover,.pst .sks-tb:not(:disabled):not(.on):not(.warn):hover{background:var(--pst-pale);}}
@media (max-height:740px){.sks{gap:9px;}.pst .sks-tb{height:48px;}}
`;
