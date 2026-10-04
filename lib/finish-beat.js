// THE FINISH BEAT (owner, 2026-10-03).
//
// A daily used to end in the same tick as its last move: the status flipped,
// the stage ending mounted, and StageFinish collapsed the board on its first
// effect. So the player never saw the move that finished the game. Barter was
// the report ("the screen cuts away before you can see what the final words
// were"), but every game without useEndHold behaved the same way.
//
// The beat fixes that in ONE place. LoftFinish holds the stage ending back for
// a moment after a FRESH finish (see useFinishBeat), the board stays on screen
// with its final state drawn, and the game's own short animation plays over it
// before the verdict arrives. Nothing about scoring moves: every client has
// already posted its result by the time LoftFinish mounts, so leaving the page
// during the beat loses nothing.
//
// THE ANIMATIONS ARE DRIVEN FROM THE DOM, NOT FROM CLIENT STATE. Eighty clients
// render eighty different boards, and threading an animation through each one's
// state would be eighty edits that drift. Instead lib/finish-beats.js names,
// per game, which elements to light and in what order, and the kinds below
// animate them with the Web Animations API. WAAPI is the right tool for three
// reasons: it outranks the inline styles every client sets, it adds no class a
// re-render could strip, and every animation can be cancelled outright, which
// is how the board comes back untouched when the player presses Return to
// board later.
//
// A game with no entry still gets the beat: its board stays up for BEAT_PLAIN
// with one gentle pulse, which is the fix for "it cut away" on its own.
//
// THE WIN BUZZ MOVES TO THE END OF THE BEAT. Each client calls its own
// vibrate(HAPT.win) inside finish(), which used to tell a phone the result
// before the board had shown anything. installBuzzDefer() wraps
// navigator.vibrate once, holds back exactly the win pattern, and the beat
// fires it when the verdict lands. Every other pattern passes straight through.

import { BEATS, LOSS_MISSES } from './finish-beats';

// A finish is FRESH when the page has been open longer than this. Same figure
// and same reasoning as FLOOD_FRESH in app/StageFinish.jsx: a page that opened
// on a board finished earlier must not replay anything.
export const BEAT_FRESH = 2000;
export const BEAT_PLAIN = 1000;
export const BEAT_REDUCED = 600;

// ---------------------------------------------------------------- end holds
// The End Game titles (and a few others) already hold their finished board
// through app/useEndHold.js. They play their beat INSIDE that hold, so
// LoftFinish must not add a second wait on top of it.
let holdAt = 0;
export function markEndHold() { holdAt = Date.now(); }
export function heldRecently() { return Date.now() - holdAt < 8000; }

// ---------------------------------------------------------------- the buzz
const WIN_BUZZ = '10,40,20,40,20,60';
let origVibrate = null;
let pendingBuzz = null;
let beatLive = false;
export function installBuzzDefer() {
  if (origVibrate || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    const orig = navigator.vibrate.bind(navigator);
    origVibrate = orig;
    navigator.vibrate = (p) => {
      if (Array.isArray(p) && p.join(',') === WIN_BUZZ) {
        pendingBuzz = p;
        // No beat claimed it (a page with no LoftFinish): buzz as before.
        setTimeout(() => { if (pendingBuzz && !beatLive) firePendingBuzz(); }, 450);
        return true;
      }
      return orig(p);
    };
  } catch (e) { origVibrate = null; }
}
export function setBeatLive(on) { beatLive = !!on; }
export function firePendingBuzz() {
  const p = pendingBuzz;
  pendingBuzz = null;
  if (p && origVibrate) { try { origVibrate(p); } catch (e) {} }
}

// ---------------------------------------------------------------- helpers
function reduced() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function stageRoot() {
  return document.querySelector('.stage-page') || document.body;
}
function accentOf(root) {
  let a = '';
  try { a = getComputedStyle(root).getPropertyValue('--stg-acc').trim(); } catch (e) {}
  return a || '#7dd3fc';
}
function inkOf(root) {
  let a = '';
  try { a = getComputedStyle(root).getPropertyValue('--stg-ink').trim(); } catch (e) {}
  return a || '#e9edf4';
}
function visible(el) {
  if (!el || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect();
  // OR, not AND: a straight SVG line drawn along an axis has no height (or no
  // width) and is still on screen. display:none zeroes both.
  return r.width > 0 || r.height > 0;
}
function hasText(el) { return !!(el && (el.textContent || '').trim()); }
const all = (root, sel) => (sel ? [...root.querySelectorAll(sel)].filter(visible) : []);
const one = (root, sel) => all(root, sel)[0] || null;

// The board a beat works on. Every stage board carries .stg-board; a few games
// put the grid in a second panel, so a config may name its own container.
function boardOf(root, def) {
  if (def && def.board) return (root.matches && root.matches(def.board)) ? root : one(root, def.board);
  return one(root, '.stg-board');
}

// Cells in reading order, laid out as rows by their on-screen position, so a
// grid can be read whatever its markup is. Rows are clustered on top edge.
function asRows(cells) {
  const rows = [];
  cells.map((el) => ({ el, r: el.getBoundingClientRect() }))
    .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left)
    .forEach((c) => {
      const row = rows.find((rw) => Math.abs(rw.top - c.r.top) < c.r.height * 0.5);
      if (row) row.items.push(c); else rows.push({ top: c.r.top, items: [c] });
    });
  return rows.map((rw) => rw.items.sort((a, b) => a.r.left - b.r.left).map((c) => c.el));
}
function asCols(cells) {
  const cols = [];
  cells.map((el) => ({ el, r: el.getBoundingClientRect() }))
    .forEach((c) => {
      const col = cols.find((cl) => Math.abs(cl.left - c.r.left) < c.r.width * 0.5);
      if (col) col.items.push(c); else cols.push({ left: c.r.left, items: [c] });
    });
  return cols.sort((a, b) => a.left - b.left).map((cl) => cl.items.sort((a, b) => a.r.top - b.r.top).map((c) => c.el));
}

// ---------------------------------------------------------------- primitives
// Each returns nothing; the animations are collected in ctx.anims so the beat
// can cancel every one of them once the board is out of sight.
function anim(ctx, el, frames, opts) {
  if (!el || !el.animate) return;
  try { ctx.anims.push(el.animate(frames, { fill: 'forwards', easing: 'ease-out', ...opts })); } catch (e) {}
}
// The accent ring: a lit cell. Inset, so it never shifts layout.
function ring(ctx, el, delay, dur = 360, keep = true) {
  const on = `inset 0 0 0 3px ${ctx.acc}`;
  anim(ctx, el, [
    { boxShadow: 'inset 0 0 0 0 transparent', transform: 'scale(1)' },
    { boxShadow: on, transform: 'scale(1.09)', offset: 0.4 },
    { boxShadow: keep ? on : 'inset 0 0 0 0 transparent', transform: 'scale(1)' },
  ], { duration: dur, delay });
}
// A wash: tints the cell under its text (an inset shadow paints over the
// background and under the content), then lets go unless kept.
function wash(ctx, el, delay, dur = 240, keep = false, alpha = 0.55) {
  const tint = `inset 0 0 0 999px color-mix(in srgb, ${ctx.acc} ${Math.round(alpha * 100)}%, transparent)`;
  anim(ctx, el, keep
    ? [{ boxShadow: 'inset 0 0 0 0 transparent' }, { boxShadow: tint }]
    : [{ boxShadow: 'inset 0 0 0 0 transparent' }, { boxShadow: tint, offset: 0.3 }, { boxShadow: 'inset 0 0 0 0 transparent' }],
  { duration: dur, delay });
}
function bump(ctx, el, delay, dur = 420) {
  anim(ctx, el, [
    { transform: 'translateY(0) scale(1)' },
    { transform: 'translateY(-5px) scale(1.05)', offset: 0.4 },
    { transform: 'translateY(0) scale(1)' },
  ], { duration: dur, delay, easing: 'ease', fill: 'none' });
}
function pulseBoard(ctx, board, delay = 120, dur = 700) {
  anim(ctx, board, [
    { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
    { transform: 'scale(1.015)', boxShadow: `0 0 0 3px ${ctx.acc}`, offset: 0.35 },
    { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
  ], { duration: dur, delay, fill: 'none' });
}

// Every across and down run of two or more cells in a crossword-shaped grid,
// read off the cells' positions on screen, so it works whatever the markup
// (Barter renders blanks as empty divs, Crux renders only its live squares).
function wordRuns(cells) {
  const pts = cells.map((el) => ({ el, r: el.getBoundingClientRect() })).filter((p) => p.r.width > 0);
  if (pts.length < 2) return [];
  const w = pts[0].r.width, h = pts[0].r.height;
  const xs = [...new Set(pts.map((p) => Math.round(p.r.left)))].sort((a, b) => a - b);
  const ys = [...new Set(pts.map((p) => Math.round(p.r.top)))].sort((a, b) => a - b);
  const pitch = (vals, size) => {
    let best = Infinity;
    for (let i = 1; i < vals.length; i++) { const d = vals[i] - vals[i - 1]; if (d > size * 0.5 && d < best) best = d; }
    return best === Infinity ? size : best;
  };
  const px = pitch(xs, w), py = pitch(ys, h);
  const x0 = xs[0], y0 = ys[0];
  const at = new Map();
  pts.forEach((p) => at.set(Math.round((p.r.top - y0) / py) + ',' + Math.round((p.r.left - x0) / px), p.el));
  const keys = [...at.keys()].map((k) => k.split(',').map(Number));
  const R = Math.max(...keys.map((k) => k[0])) + 1, C = Math.max(...keys.map((k) => k[1])) + 1;
  const runs = [];
  for (let r = 0; r < R; r++) {
    let run = [];
    for (let c = 0; c <= C; c++) { const el = at.get(r + ',' + c); if (el) run.push(el); else { if (run.length > 1) runs.push(run); run = []; } }
  }
  for (let c = 0; c < C; c++) {
    let run = [];
    for (let r = 0; r <= R; r++) { const el = at.get(r + ',' + c); if (el) run.push(el); else { if (run.length > 1) runs.push(run); run = []; } }
  }
  return runs;
}
// The stacked rows of a list on the board: the element holding the most
// same-tag children that sit one under the next.
function listRows(board, min = 3) {
  let best = [];
  board.querySelectorAll('*').forEach((el) => {
    const kids = [...el.children].filter(visible);
    if (kids.length < min || kids.length <= best.length) return;
    const tops = kids.map((k) => k.getBoundingClientRect().top);
    let stacked = true;
    for (let i = 1; i < tops.length; i++) if (tops[i] <= tops[i - 1] + 4) { stacked = false; break; }
    if (stacked && kids.every((k) => k.tagName === kids[0].tagName)) best = kids;
  });
  return best;
}

// ---------------------------------------------------------------- kinds
// Each kind animates the board and returns how long it runs, in ms.
const KINDS = {
  // WORDS: a crossword-shaped grid read as its across and down words, then
  // swept like any other group list. Long grids step faster.
  words(ctx, def) {
    const runs = wordRuns(all(ctx.board, def.cell));
    if (!runs.length) return 0;
    const step = Math.max(70, Math.min(260, Math.round(1700 / runs.length)));
    return KINDS.sweep(ctx, { ...def, step, groups: () => runs });
  },
  // SWEEP CHECK. Every group (a word, a category, a row) lights in turn, and the
  // LAST one waits a beat longer than the rest. Groups come from def.groups.
  sweep(ctx, def) {
    const groups = (def.groups(ctx.board, ctx) || []).filter((g) => g && g.length);
    if (!groups.length) return 0;
    const step = def.step || 260;
    const lastHold = def.lastHold == null ? 560 : def.lastHold;
    let t = def.lead || 250;
    groups.forEach((g, i) => {
      if (i === groups.length - 1 && groups.length > 1) t += lastHold;
      g.forEach((el, j) => ring(ctx, el, t + j * 28));
      t += step;
    });
    const tiles = groups.flat();
    t += 160;
    tiles.forEach((el, i) => bump(ctx, el, t + (i % 12) * 22));
    return t + 520;
  },

  // GRID AUDIT. A light runs the rows, then the columns, then the boxes; the
  // last box is the one it lingers on. Then the whole grid settles lit.
  audit(ctx, def) {
    const cells = all(ctx.board, def.cell);
    const n = Math.round(Math.sqrt(cells.length));
    if (n < 4 || n * n !== cells.length) return 0;
    const rows = asRows(cells);
    const cols = asCols(cells);
    const box = def.box || (n === 9 ? [3, 3] : n === 6 ? [2, 3] : n === 4 ? [2, 2] : n === 8 ? [2, 4] : null);
    const boxes = [];
    if (box && rows.length === n) {
      for (let br = 0; br < n / box[0]; br++) {
        for (let bc = 0; bc < n / box[1]; bc++) {
          const g = [];
          for (let r = 0; r < box[0]; r++) for (let c = 0; c < box[1]; c++) {
            const row = rows[br * box[0] + r];
            if (row && row[bc * box[1] + c]) g.push(row[bc * box[1] + c]);
          }
          boxes.push(g);
        }
      }
    }
    const step = def.step || Math.max(60, Math.round(560 / n));
    let t = def.lead || 220;
    const pass = (groups, hold) => groups.forEach((g, i) => {
      const last = hold && i === groups.length - 1;
      if (last) t += 120;
      g.forEach((el) => wash(ctx, el, t, last ? 520 : step * 2.4));
      t += last ? 520 : step;
    });
    pass(rows, false);
    pass(cols, false);
    pass(boxes, true);
    t += 80;
    cells.forEach((el, i) => wash(ctx, el, t + (i % n) * 18, 320, true, 0.32));
    return t + 460;
  },

  // PATH TRACE. The path's pieces light one after another, ordered by angle
  // around the board's centre, so the light runs AROUND a loop. A route that is
  // not a loop passes its own order through def.order.
  trace(ctx, def) {
    let els = all(ctx.board, def.piece);
    if (!els.length) return 0;
    if (def.order === 'x') els = els.map((el) => ({ el, x: el.getBoundingClientRect().left })).sort((a, b) => a.x - b.x).map((a) => a.el);
    else if (def.order) els = def.order(els, ctx);
    else {
      const b = ctx.board.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const ang = (el) => { const r = el.getBoundingClientRect(); return Math.atan2(r.top + r.height / 2 - cy, r.left + r.width / 2 - cx); };
      els = els.map((el) => ({ el, a: ang(el) })).sort((x, y) => x.a - y.a).map((x) => x.el);
    }
    const dur = def.dur || 1500;
    const lead = def.lead || 200;
    const glow = def.glow || ((el, d) => anim(ctx, el, [
      { filter: 'none' },
      { filter: `drop-shadow(0 0 5px ${ctx.acc}) brightness(1.6)`, offset: 0.3 },
      { filter: `drop-shadow(0 0 3px ${ctx.acc})` },
    ], { duration: 360, delay: d }));
    els.forEach((el, i) => glow(el, lead + Math.round((i / els.length) * dur)));
    pulseBoard(ctx, ctx.board, lead + dur + 120, 600);
    return lead + dur + 700;
  },

  // PICTURE REVEAL. The clues fade, the grid lines melt, the picture is framed
  // a size larger, and only then does the verdict come up.
  reveal(ctx, def) {
    const clues = all(ctx.board, def.clue);
    const grid = one(ctx.board, def.grid);
    if (!grid) return 0;
    const cells = [...grid.children];
    const lead = 280;
    clues.forEach((el) => anim(ctx, el, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: lead }));
    anim(ctx, grid, [{ gap: getComputedStyle(grid).gap || '0px' }, { gap: '0px' }], { duration: 600, delay: lead + 200 });
    cells.forEach((el) => {
      const filled = def.filled(el);
      anim(ctx, el, filled
        ? [{}, { borderColor: 'transparent', borderRadius: '0px', outlineColor: 'transparent' }, { borderColor: 'transparent', borderRadius: '0px', backgroundColor: ctx.acc, boxShadow: 'none', outlineColor: 'transparent' }]
        : [{}, { borderColor: 'transparent', borderRadius: '0px', backgroundColor: 'transparent', boxShadow: 'none', outlineColor: 'transparent' }],
      { duration: filled ? 1200 : 600, delay: lead + 200 });
    });
    anim(ctx, grid, [{ transform: 'scale(1)' }, { transform: `scale(${def.zoom || 1.08})` }],
      { duration: 800, delay: lead + 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
    return lead + 1700;
  },

  // LETTERS HOME. Each finale letter flies back to the letter it came from,
  // which lights; the last one leaves a beat behind the rest.
  fly(ctx, def) {
    const pairs = (def.pairs(ctx.board, ctx) || []).filter((p) => p && p[0] && p[1]);
    if (!pairs.length) return 0;
    const step = def.step || 330;
    const flyMs = 380;
    let t = def.lead || 260;
    pairs.forEach(([src, dst], i) => {
      if (i === pairs.length - 1 && pairs.length > 1) t += 380;
      const start = t;
      ctx.timers.push(setTimeout(() => {
        const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
        const f = document.createElement('div');
        f.textContent = (src.textContent || '').trim().slice(0, 2);
        f.setAttribute('aria-hidden', 'true');
        const sz = Math.min(a.width, a.height, 40);
        Object.assign(f.style, {
          position: 'fixed', left: `${a.left + (a.width - sz) / 2}px`, top: `${a.top + (a.height - sz) / 2}px`,
          width: `${sz}px`, height: `${sz}px`, zIndex: 9999, pointerEvents: 'none', display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: '7px', fontWeight: 900,
          fontSize: `${Math.round(sz * 0.52)}px`, background: ctx.acc, color: 'var(--stg-onramp, #08222e)',
          fontFamily: 'inherit', textTransform: 'uppercase',
        });
        document.body.appendChild(f);
        ctx.nodes.push(f);
        const dx = b.left + (b.width - sz) / 2 - (a.left + (a.width - sz) / 2);
        const dy = b.top + (b.height - sz) / 2 - (a.top + (a.height - sz) / 2);
        try {
          const an = f.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 30}px) scale(1.15)`, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(.9)` }],
            { duration: flyMs, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
          an.onfinish = () => { try { f.remove(); } catch (e) {} };
        } catch (e) { try { f.remove(); } catch (e2) {} }
      }, start));
      ring(ctx, dst, start + flyMs - 40, 380);
      if (def.lightRow) (def.lightRow(dst) || []).forEach((el) => wash(ctx, el, start + flyMs, 300, true, 0.25));
      t += step;
    });
    t += 300;
    pairs.forEach(([src], i) => bump(ctx, src, t + i * 50));
    return t + 560;
  },

  // LOCK IN. The board goes neutral (every colour drained out of it, so a green
  // or red answer reads as grey) with the last answer ringed; a second later
  // the colour comes back, which IS the reveal.
  lock(ctx, def) {
    const target = def.target ? def.target(ctx.board, ctx) : null;
    const lockMs = def.lockMs || 1000;
    const lead = 120;
    anim(ctx, ctx.board, [
      { filter: 'saturate(0) brightness(.92)' },
      { filter: 'saturate(0) brightness(.92)', offset: 0.85 },
      { filter: 'none' },
    ], { duration: lockMs + 260, delay: 0, fill: 'backwards', easing: 'linear' });
    if (def.hideText) {
      ctx.board.querySelectorAll('div,p,span').forEach((el) => {
        if (el.children.length > 3) return;
        if (!def.hideText.test((el.textContent || '').trim())) return;
        if ([...el.children].some((k) => def.hideText.test((k.textContent || '').trim()))) return;
        anim(ctx, el, [{ opacity: 0 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: lockMs + 260, fill: 'backwards', easing: 'linear' });
      });
    }
    if (target) {
      anim(ctx, target, [
        { boxShadow: `0 0 0 0 transparent` },
        { boxShadow: `0 0 0 4px ${ctx.ink}`, offset: 0.25 },
        { boxShadow: `0 0 0 2px ${ctx.ink}`, offset: 0.6 },
        { boxShadow: `0 0 0 4px ${ctx.ink}` },
      ], { duration: lockMs, delay: lead, easing: 'ease-in-out', fill: 'none' });
      bump(ctx, target, lead + lockMs + 120, 460);
    }
    return lead + lockMs + 760;
  },

  // SLOW FLIP. The deciding card wobbles, then turns over slowly from its edge.
  flip(ctx, def) {
    const els = def.target(ctx.board, ctx) || [];
    if (!els.length) return 0;
    let t = def.lead || 200;
    els.forEach((el, i) => {
      anim(ctx, el, [
        { transform: 'rotate(0deg) translateY(0)' },
        { transform: 'rotate(-4deg) translateY(-3px)', offset: 0.3 },
        { transform: 'rotate(4deg) translateY(-3px)', offset: 0.7 },
        { transform: 'rotate(0deg) translateY(0)' },
      ], { duration: 320, delay: t, fill: 'none' });
      anim(ctx, el, [
        { transform: 'perspective(500px) rotateY(90deg)', filter: 'brightness(.3)' },
        { transform: 'perspective(500px) rotateY(90deg)', filter: 'brightness(.3)', offset: 0.05 },
        { transform: 'perspective(500px) rotateY(0deg)', filter: 'none' },
      ], { duration: 900, delay: t + 340, easing: 'cubic-bezier(.3,.1,.2,1)', fill: 'backwards' });
      t += i === els.length - 1 ? 1300 : 500;
    });
    if (def.after) (def.after(ctx.board, ctx) || []).forEach((el, i) => ring(ctx, el, t + i * 80, 420));
    return t + 520;
  },

  // ORDER SETTLE. Each row arrives in turn, the marks that grade it appearing
  // as it lands; the last row waits a beat before it lands.
  rows(ctx, def) {
    const rows = typeof def.row === 'function' ? (def.row(ctx.board, ctx) || []) : all(ctx.board, def.row);
    if (!rows.length) return 0;
    const step = def.step || 380;
    let t = def.lead || 220;
    rows.forEach((el) => anim(ctx, el, [{ opacity: 0.25, transform: 'translateX(-10px)' }, { opacity: 0.25, transform: 'translateX(-10px)' }], { duration: 1, delay: 0, fill: 'backwards' }));
    rows.forEach((el, i) => {
      if (i === rows.length - 1 && rows.length > 1) t += 380;
      anim(ctx, el, [{ opacity: 0.25, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 340, delay: t, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'both' });
      ring(ctx, el, t + 200, 380, false);
      t += step;
    });
    return t + 520;
  },

  // THE LOSING BEAT, played inside an End Game hold. Everything on the board
  // dims except the pieces def.keep picks out (the line that beat you), which
  // pulse one by one.
  loss(ctx, def) {
    const keep = (def.keep ? def.keep(ctx.board, ctx) : []) || [];
    const pieces = all(ctx.board, def.piece);
    if (!pieces.length) return 0;
    const lead = def.lead || 350;
    pieces.forEach((el) => {
      if (keep.includes(el)) return;
      anim(ctx, el, [{ opacity: 1 }, { opacity: 0.28 }], { duration: 420, delay: lead });
    });
    keep.forEach((el, i) => anim(ctx, el, [
      { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
      { transform: 'scale(1.18)', boxShadow: `0 0 0 4px ${ctx.ink}`, offset: 0.5 },
      { transform: 'scale(1)', boxShadow: `0 0 0 3px ${ctx.ink}` },
    ], { duration: 320, delay: lead + 300 + i * 260 }));
    return lead + 300 + keep.length * 260 + 400;
  },
};

// ---------------------------------------------------------------- the beat
// Plays the game's beat over the board and resolves when it is time for the
// verdict. `within` caps the beat (an End Game hold has its own clock).
export function playBeat(key, { within = null, force = false } = {}) {
  const ctx = { anims: [], timers: [], nodes: [] };
  const handle = {
    ms: 0,
    cancel() {
      ctx.timers.forEach((t) => clearTimeout(t));
      ctx.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
      ctx.nodes.forEach((n) => { try { n.remove(); } catch (e) {} });
      ctx.anims = []; ctx.timers = []; ctx.nodes = [];
    },
  };
  if (typeof document === 'undefined') return handle;
  if (reduced() && !force) { handle.ms = BEAT_REDUCED; return handle; }
  const def = BEATS[key] || null;
  const root = stageRoot();
  ctx.root = root;
  ctx.acc = accentOf(root);
  ctx.ink = inkOf(root);
  ctx.board = boardOf(root, def);
  ctx.util = { listRows, all, one, wordRuns };
  let ms = 0;
  handle.kind = 'plain';
  try {
    if (def && ctx.board && KINDS[def.kind]) ms = KINDS[def.kind](ctx, def) || 0;
    if (ms) handle.kind = def.kind;
    handle.count = ctx.anims.length;
  } catch (e) { handle.cancel(); ms = 0; handle.error = String(e && e.message || e); }
  if (!ms) {
    if (ctx.board) pulseBoard(ctx, ctx.board, 200, 700);
    ms = BEAT_PLAIN;
  }
  if (within != null) ms = Math.min(ms, within);
  handle.ms = ms;
  return handle;
}

// ---------------------------------------------------------------- the loss
// THE GAPS GO DARK (owner, 2026-10-04). A loss never plays the win beat: a
// sweep that rings every word reads as "you got them". Instead every square
// or letter the player did NOT get dims in reading order while the ones they
// got stay lit, then the whole board settles back. It shows how close they
// came and never what goes in the gaps (the client keeps the answer off the
// board until Reveal answer is pressed). A game with no known misses just
// settles. `keep` leaves the last frame standing, for the retry hold.
export function playLoss(key, { keep = false, instant = false } = {}) {
  const ctx = { anims: [], timers: [], nodes: [] };
  const handle = {
    ms: 0,
    kind: 'gaps',
    cancel() {
      ctx.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
      ctx.anims = [];
    },
  };
  if (typeof document === 'undefined') return handle;
  const def = BEATS[key] || null;
  const root = stageRoot();
  const board = boardOf(root, def) || one(root, '.stg-board');
  if (!board) { handle.ms = BEAT_PLAIN; handle.kind = 'none'; return handle; }
  let misses = [];
  try {
    const pick = LOSS_MISSES[key];
    if (pick) misses = (pick(board, { all, one }) || []).filter(visible);
    else if (def && def.cell) misses = all(board, def.cell).filter((el) => !hasText(el));
  } catch (e) { misses = []; }
  misses = asRows(misses).flat();
  const lead = 160;
  const step = misses.length ? Math.min(70, 1100 / misses.length) : 0;
  misses.forEach((el, i) => {
    try {
      ctx.anims.push(el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0.18, transform: 'scale(.9)' }],
        { duration: 260, delay: lead + i * step, fill: 'forwards', easing: 'ease-in-out' }));
    } catch (e) {}
  });
  const settle = lead + misses.length * step + (misses.length ? 260 : 0);
  try {
    ctx.anims.push(board.animate([{ filter: 'saturate(1)', opacity: 1 }, { filter: 'saturate(.35)', opacity: 0.55 }],
      { duration: 520, delay: settle, fill: 'forwards', easing: 'ease-in-out' }));
  } catch (e) {}
  handle.ms = settle + 620;
  if (instant || reduced()) ctx.anims.forEach((a) => { try { a.finish(); } catch (e) {} });
  return handle;
}

// For review on a live page: plays a game's beat on whatever board is on screen
// without ending anything. window.__sotBeat('barter') in the console.
if (typeof window !== 'undefined') {
  window.__sotBeat = (key) => {
    const h = playBeat(key, { force: true });
    setTimeout(() => h.cancel(), h.ms + 1200);
    return { ms: h.ms, kind: h.kind, anims: h.count || 0, error: h.error || null };
  };
  window.__sotLoss = (key) => {
    const h = playLoss(key);
    setTimeout(() => h.cancel(), h.ms + 1500);
    return { ms: h.ms, kind: h.kind };
  };
}
