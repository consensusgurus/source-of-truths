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
export function setBeatLive(on) {
  beatLive = !!on;
  // Other pop-ups (ThanksPop) wait while an ending is playing.
  try { if (on) document.documentElement.dataset.sotBeat = '1'; else delete document.documentElement.dataset.sotBeat; } catch (e) {}
}
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
// Layout, never the animation. A beat measures the board while its own
// animations are already running: an element animated with a delay and
// fill 'backwards' (or at delay 0) is drawn at its FIRST keyframe the moment
// the animation starts, so getBoundingClientRect returns the shrunk, shifted
// or scaled box (Links measured each band at scaleX(.4) and drew its flash
// overlays at 40% width). box() lifts every live beat animation on the
// element or an ancestor for the length of one read, then puts it back.
// Animation.effect is writable and the animation keeps its own clock, so the
// playback is untouched. Every measurement in this file goes through it.
const LIVE = [];
function box(el) {
  const lifted = [];
  for (const a of LIVE) {
    const t = a.effect && a.effect.target;
    if (!t || (t !== el && !(t.contains && t.contains(el)))) continue;
    lifted.push([a, a.effect]);
  }
  if (!lifted.length) return el.getBoundingClientRect();
  lifted.forEach(([a]) => { try { a.effect = null; } catch (e) {} });
  const r = el.getBoundingClientRect();
  lifted.forEach(([a, e]) => { try { a.effect = e; } catch (e2) {} });
  return r;
}
function visible(el) {
  if (!el || !el.getBoundingClientRect) return false;
  const r = box(el);
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
  cells.map((el) => ({ el, r: box(el) }))
    .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left)
    .forEach((c) => {
      const row = rows.find((rw) => Math.abs(rw.top - c.r.top) < c.r.height * 0.5);
      if (row) row.items.push(c); else rows.push({ top: c.r.top, items: [c] });
    });
  return rows.map((rw) => rw.items.sort((a, b) => a.r.left - b.r.left).map((c) => c.el));
}
function asCols(cells) {
  const cols = [];
  cells.map((el) => ({ el, r: box(el) }))
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
  try { const a = el.animate(frames, { fill: 'forwards', easing: 'ease-out', ...opts }); ctx.anims.push(a); LIVE.push(a); } catch (e) {}
}
// The accent ring: a lit cell. Inset, so it never shifts layout.
function ring(ctx, el, delay, dur = 360, keep = true) {
  const on = `inset 0 0 0 3px ${ctx.acc}`;
  const b = baseT(el);
  anim(ctx, el, [
    { boxShadow: 'inset 0 0 0 0 transparent', transform: `${b}scale(1)` },
    { boxShadow: on, transform: `${b}scale(1.09)`, offset: 0.4 },
    { boxShadow: keep ? on : 'inset 0 0 0 0 transparent', transform: `${b}scale(1)` },
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
// An element positioned by its own transform (a centred badge, translate
// -50%) keeps it: the beat's transform is written after it, never instead.
function baseT(el) {
  try {
    const t = getComputedStyle(el).transform;
    return t && t !== 'none' ? `${t} ` : '';
  } catch (e) { return ''; }
}
function bump(ctx, el, delay, dur = 420) {
  const b = baseT(el);
  anim(ctx, el, [
    { transform: `${b}translateY(0) scale(1)` },
    { transform: `${b}translateY(-5px) scale(1.05)`, offset: 0.4 },
    { transform: `${b}translateY(0) scale(1)` },
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
  const pts = cells.map((el) => ({ el, r: box(el) })).filter((p) => p.r.width > 0);
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
    const tops = kids.map((k) => box(k).top);
    let stacked = true;
    for (let i = 1; i < tops.length; i++) if (tops[i] <= tops[i - 1] + 4) { stacked = false; break; }
    if (stacked && kids.every((k) => k.tagName === kids[0].tagName)) best = kids;
  });
  return best;
}

// ---------------------------------------------------------------- kinds
// Each kind animates the board and returns how long it runs, in ms.

// THE FINALE, the end of every win when the curtain follows (owner,
// 2026-10-05, picked from eight mocked endings: "the iris"). The finished
// board stays up for a beat, then a circle of the category colour opens from
// the square the player finished on and grows until it covers the screen.
// That colour IS the curtain: StageFinish's flood mounts over it in the same
// colour, and the flood's own queue waits for any figure still loading, so the
// figures land in their fixed order.
//
// ONE element and ONE animation, transform only, so it stays smooth on a phone
// while the page is busy (the lock-and-burst and the fill both stuttered or
// stalled). The origin is the player's LAST TAP on the board, recorded below;
// a finish made from the keyboard, or a tap that is stale or off the board,
// opens from the board's centre instead.
const FINALE_LEAD = 500;
const FINALE_IRIS = 800;
let lastTap = null;
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('pointerdown', (e) => { lastTap = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  } catch (e) {}
}
function finale(ctx, startAt) {
  ctx.timers.push(setTimeout(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const b = box(ctx.board);
    let x = b.left + b.width / 2;
    let y = Math.min(Math.max(b.top + b.height / 2, 0), vh);
    if (lastTap && Date.now() - lastTap.t < 20000
      && lastTap.x >= b.left && lastTap.x <= b.right && lastTap.y >= b.top && lastTap.y <= b.bottom) {
      x = lastTap.x; y = lastTap.y;
    }
    const R = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
    const s = 20;
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', left: (x - s / 2) + 'px', top: (y - s / 2) + 'px', width: s + 'px', height: s + 'px',
      borderRadius: '50%', background: ctx.acc, zIndex: '8999', pointerEvents: 'none',
      transform: 'scale(0)', willChange: 'transform',
    });
    el.__noFollow = true;
    document.body.appendChild(el);
    ctx.nodes.push(el);
    ctx.anims.push(el.animate([{ transform: 'scale(0)' }, { transform: `scale(${(2 * R) / s + 1})` }],
      { duration: FINALE_IRIS, easing: 'cubic-bezier(.55,0,.2,1)', fill: 'forwards' }));
  }, startAt));
  return startAt + FINALE_IRIS;
}

// ---------------------------------------------------------------- the last beat
// THE LAST BEAT (owner, 2026-10-10). A handful of games play an animation of
// their own BEFORE the iris: the sudokus and the crosswords ripple out from the
// last square and lock their boxes, Crux flips its words in like a departures
// board, Anon fills its passage with lamplight, Hedge runs a current round the
// loop, Etch develops its picture, Four drops every disc but the winning four,
// and the jam games drive the red block out of the gate. A def opts in with
// `last: true`; the iris then opens when the game's animation ends.
//
// Built for phones: the light is drawn on OVERLAY nodes laid over the board and
// moved by opacity and transform only, never by repainting the board's own
// cells, which is what made the lock-and-burst stutter. Cells themselves are
// only ever scaled. Every overlay goes in ctx.nodes, so cancel() removes it.
const OVERLAY_Z = '8990';
function isLight(ctx) {
  try { return (ctx.root.getAttribute('data-stage-theme') || '') === 'light'; } catch (e) { return false; }
}
// Overlays are position:fixed and measured once, so a page that scrolls
// during the beat (a focus, a late layout shift, the reader's own wheel) would
// leave them hanging where the board used to be. Each node is pinned to the
// scroll position it was measured at and follows the page with `translate`,
// which composes with the animated `transform`. The iris opts out: it covers
// the screen, wherever the page is.
function followScroll(ctx) {
  if (typeof window === 'undefined') return;
  let lx = window.scrollX, ly = window.scrollY;
  const on = () => {
    const x = window.scrollX, y = window.scrollY;
    ctx.nodes.forEach((n) => {
      if (!n || n.__noFollow || !n.style) return;
      if (n.__sy === undefined) { n.__sx = lx; n.__sy = ly; }
      n.style.translate = `${n.__sx - x}px ${n.__sy - y}px`;
    });
    lx = x; ly = y;
  };
  window.addEventListener('scroll', on, { passive: true });
  ctx.stopFollow = () => window.removeEventListener('scroll', on);
}
function overlay(ctx, rect, style) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px',
    pointerEvents: 'none', zIndex: OVERLAY_Z, opacity: '0', boxSizing: 'border-box', willChange: 'opacity, transform',
  }, style || {});
  document.body.appendChild(el);
  ctx.nodes.push(el);
  return el;
}
function rectOf(el) {
  const r = box(el);
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}
function unionRect(els, pad = 0) {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  els.forEach((el) => { const q = box(el); l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); });
  return { left: l - pad, top: t - pad, width: r - l + pad * 2, height: b - t + pad * 2 };
}
// Where the player finished: their last tap on the board, else its centre.
function originPoint(ctx) {
  const b = box(ctx.board);
  if (lastTap && Date.now() - lastTap.t < 20000
    && lastTap.x >= b.left && lastTap.x <= b.right && lastTap.y >= b.top && lastTap.y <= b.bottom) {
    return { x: lastTap.x, y: lastTap.y };
  }
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
}
// A ring that opens out from a point and fades: the drop, the spark.
// The first painted background at or above an element, for an overlay that
// has to hide what is under it (an overlay sits outside the stage, where the
// page's own colour variables do not resolve).
function solidBg(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const b = getComputedStyle(n).backgroundColor;
    if (b && b !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(b)) {
      const m = b.match(/rgba\(([^,]+),([^,]+),([^,]+),\s*([\d.]+)\)/);
      if (!m || parseFloat(m[4]) > 0.9) return b;
    }
  }
  return '#ffffff';
}
// A ring that spreads from a measured rectangle's centre.
function halo(ctx, r, delay, grow = 2) {
  burst(ctx, r.cx, r.cy, Math.max(14, Math.min(r.width, r.height)), ctx.acc, delay, grow, 620, 3);
}
function burst(ctx, x, y, size, color, delay, grow = 8, dur = 700, width = 3) {
  const el = overlay(ctx, { left: x - size / 2, top: y - size / 2, width: size, height: size },
    { borderRadius: '50%', border: `${width}px solid ${color}` });
  anim(ctx, el, [
    { opacity: 0, transform: 'scale(.4)' },
    { opacity: 1, transform: 'scale(.8)', offset: 0.12 },
    { opacity: 0, transform: `scale(${grow})` },
  ], { duration: dur, delay, easing: 'cubic-bezier(.2,.6,.3,1)' });
  return el;
}
// The boxes of an n by n grid, as lists of cells, or [] where it has none.
function boxGroups(cells, def) {
  if (def && def.box === null) return [];
  const n = Math.round(Math.sqrt(cells.length));
  if (n < 4 || n * n !== cells.length) return [];
  const box = (def && def.box) || (n === 9 ? [3, 3] : n === 6 ? [2, 3] : n === 4 ? [2, 2] : n === 8 ? [2, 4] : null);
  if (!box) return [];
  const rows = asRows(cells);
  if (rows.length !== n) return [];
  const out = [];
  for (let br = 0; br < n / box[0]; br++) {
    for (let bc = 0; bc < n / box[1]; bc++) {
      const g = [];
      for (let r = 0; r < box[0]; r++) for (let c = 0; c < box[1]; c++) {
        const row = rows[br * box[0] + r];
        if (row && row[bc * box[1] + c]) g.push(row[bc * box[1] + c]);
      }
      if (g.length) out.push(g);
    }
  }
  return out;
}
// Box order for the lock: a spiral when the boxes make a 3 by 3, else reading order.
function spiralOrder(len) {
  return len === 9 ? [0, 1, 2, 5, 8, 7, 6, 3, 4] : [...Array(len).keys()];
}
const WARM = '#ffe7a6';
// A hex or rgb() colour darkened toward black by f (0..1); anything else as is.
function shade(c, f) {
  let r, g, b;
  const s = String(c || '').trim();
  let m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) { r = parseInt(m[1].slice(0, 2), 16); g = parseInt(m[1].slice(2, 4), 16); b = parseInt(m[1].slice(4, 6), 16); }
  else if ((m = s.match(/^#([0-9a-f]{3})$/i))) { r = parseInt(m[1][0] + m[1][0], 16); g = parseInt(m[1][1] + m[1][1], 16); b = parseInt(m[1][2] + m[1][2], 16); }
  else if ((m = s.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i))) { r = +m[1]; g = +m[2]; b = +m[3]; }
  else return s;
  const k = 1 - f;
  return `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
}

const KINDS = {
  // RIPPLE AND LOCK (sudokus, crosswords). A wave of the category colour runs
  // out from the last square, every cell lifting as it passes, then each box
  // locks with a ring of light, in a spiral.
  ripple(ctx, def) {
    const cells = all(ctx.board, def.cell);
    if (cells.length < 4) return 0;
    const o = originPoint(ctx);
    const pts = cells.map((el) => ({ el, r: rectOf(el) }));
    const size = Math.max(12, pts[0].r.width || 30);
    let radius = '4px';
    try { radius = getComputedStyle(cells[0]).borderRadius || radius; } catch (e) {}
    const lead = 140;
    const per = def.per || 62;
    let far = 0;
    const bw = box(ctx.board).width || size * 9;
    burst(ctx, o.x, o.y, size, ctx.acc, lead - 60, Math.max(3, Math.min(8, (bw * 0.7) / size)), 760);
    pts.forEach((p) => {
      const d = Math.hypot(p.r.cx - o.x, p.r.cy - o.y) / size;
      const delay = lead + Math.round(d * per);
      far = Math.max(far, delay);
      const g = overlay(ctx, p.r, { background: ctx.acc, borderRadius: radius });
      anim(ctx, g, [{ opacity: 0 }, { opacity: 0.72, offset: 0.3 }, { opacity: 0.16 }], { duration: 560, delay });
      anim(ctx, p.el, [
        { transform: 'scale(1)' },
        { transform: 'scale(1.16)', offset: 0.35 },
        { transform: 'scale(1)' },
      ], { duration: 480, delay, fill: 'none', easing: 'ease-out' });
    });
    let t = far + 380;
    const boxes = boxGroups(cells, def);
    if (boxes.length) {
      const order = spiralOrder(boxes.length);
      order.forEach((bi, i) => {
        const rect = unionRect(boxes[bi], 2);
        const b = overlay(ctx, rect, { border: `3px solid ${ctx.ink}`, borderRadius: '8px', boxShadow: `0 0 16px 2px ${ctx.acc}, inset 0 0 12px ${ctx.acc}` });
        anim(ctx, b, [
          { opacity: 0, transform: 'scale(1.07)' },
          { opacity: 1, transform: 'scale(1)', offset: 0.35 },
          { opacity: 0.6, transform: 'scale(1)' },
        ], { duration: 460, delay: t + i * 85 });
      });
      t += boxes.length * 85 + 460;
    }
    return t + 160;
  },

  // SPLIT-FLAP (Crux). The words flip in one after another like a departures
  // board, and every crossing sparks when its second word lands on it.
  flap(ctx, def) {
    const runs = wordRuns(all(ctx.board, def.cell));
    if (!runs.length) return 0;
    const lead = 180;
    const step = Math.max(160, Math.min(380, Math.round(1500 / runs.length)));
    const times = new Map();
    runs.forEach((run, k) => run.forEach((el, j) => {
      if (!times.has(el)) times.set(el, []);
      times.get(el).push(lead + k * step + j * 55);
    }));
    let radius = '6px';
    const first = runs[0][0];
    try { radius = getComputedStyle(first).borderRadius || radius; } catch (e) {}
    let end = 0;
    times.forEach((ts, el) => {
      const t0 = Math.min(...ts);
      end = Math.max(end, ...ts);
      anim(ctx, el, [
        { transform: 'perspective(320px) rotateX(0deg)' },
        { transform: 'perspective(320px) rotateX(88deg)', offset: 0.45 },
        { transform: 'perspective(320px) rotateX(-88deg)', offset: 0.46 },
        { transform: 'perspective(320px) rotateX(0deg)' },
      ], { duration: 360, delay: t0, fill: 'none', easing: 'ease-in-out' });
      const r = rectOf(el);
      const g = overlay(ctx, r, { background: ctx.acc, borderRadius: radius });
      anim(ctx, g, [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0.7, offset: 0.6 }, { opacity: 0.2 }], { duration: 560, delay: t0 });
      if (ts.length > 1) {
        const tx = Math.max(...ts) + 200;
        burst(ctx, r.cx, r.cy, r.width, WARM, tx, 2.3, 560, 3);
      }
    });
    return end + 900;
  },

  // LAMPLIGHT (Anon). Light moves through the passage in reading order, each
  // letter flaring and settling lamplit, a glow rising behind the page; then the
  // spine's initials, the letters that name the author, light one by one.
  lamp(ctx, def) {
    const cells = asRows(all(ctx.board, def.cell)).flat();
    if (!cells.length) return 0;
    const light = isLight(ctx);
    const lead = 160;
    const step = Math.max(10, Math.min(38, Math.round(1500 / cells.length)));
    const halo = overlay(ctx, unionRect(cells, 60), {
      borderRadius: '40px',
      background: `radial-gradient(closest-side, rgba(255,214,130,${light ? 0.32 : 0.26}), rgba(255,214,130,0))`,
    });
    anim(ctx, halo, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1400, delay: lead + 300, easing: 'ease-out' });
    let radius = '4px';
    try { radius = getComputedStyle(cells[0]).borderRadius || radius; } catch (e) {}
    cells.forEach((el, i) => {
      const d = lead + i * step;
      const g = overlay(ctx, rectOf(el), {
        borderRadius: radius,
        background: `rgba(255,214,130,${light ? 0.55 : 0.4})`,
        boxShadow: `0 0 14px 4px rgba(255,214,130,${light ? 0.5 : 0.7})`,
      });
      anim(ctx, g, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0.5 }], { duration: 640, delay: d });
      anim(ctx, el, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 520, delay: d, fill: 'none' });
    });
    let t = lead + cells.length * step + 420;
    const spine = def.spine ? (def.spine(ctx.board, ctx) || []).filter(visible) : [];
    spine.forEach((el, i) => {
      const r = rectOf(el);
      const g = overlay(ctx, r, { borderRadius: radius, background: WARM, boxShadow: `0 0 18px 6px rgba(255,214,130,.85)`, mixBlendMode: light ? 'multiply' : 'screen' });
      anim(ctx, g, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.7 }], { duration: 520, delay: t + i * 95 });
      anim(ctx, el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-6px) scale(1.12)', offset: 0.35 }, { transform: 'translateY(0)' }], { duration: 520, delay: t + i * 95, fill: 'none' });
    });
    if (spine.length) t += spine.length * 95 + 520;
    return t + 240;
  },

  // CURRENT (Hedge). A pulse runs twice round the closed loop, the loop stays
  // lit, and the ground it encloses fills with the category colour. A board
  // whose pieces do not chain into one loop falls back to the trace.
  current(ctx, def) {
    const segs = all(ctx.board, def.piece).map((el) => {
      const r = box(el);
      const horiz = r.width >= r.height;
      const a = horiz ? [r.left, r.top + r.height / 2] : [r.left + r.width / 2, r.top];
      const b = horiz ? [r.right, r.top + r.height / 2] : [r.left + r.width / 2, r.bottom];
      return { a, b, sw: Math.min(r.width, r.height) };
    });
    if (segs.length < 4) return KINDS.trace(ctx, def);
    // The stroke's round caps add half the stroke width at each end; trim them.
    const cap = segs.reduce((m, s) => Math.max(m, s.sw), 0) / 2;
    segs.forEach((s) => {
      if (s.a[1] === s.b[1]) { s.a[0] += cap; s.b[0] -= cap; } else { s.a[1] += cap; s.b[1] -= cap; }
    });
    const tol = Math.max(3, cap * 1.5);
    const near = (p, q) => Math.abs(p[0] - q[0]) <= tol && Math.abs(p[1] - q[1]) <= tol;
    const used = new Array(segs.length).fill(false);
    const pts = [segs[0].a, segs[0].b];
    used[0] = true;
    for (let k = 1; k < segs.length; k++) {
      const tail = pts[pts.length - 1];
      let found = -1, next = null;
      for (let i = 0; i < segs.length; i++) {
        if (used[i]) continue;
        if (near(segs[i].a, tail)) { found = i; next = segs[i].b; break; }
        if (near(segs[i].b, tail)) { found = i; next = segs[i].a; break; }
      }
      if (found < 0) return KINDS.trace(ctx, def);
      used[found] = true;
      pts.push(next);
    }
    if (!near(pts[pts.length - 1], pts[0])) return KINDS.trace(ctx, def);
    pts.pop();
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    Object.assign(svg.style, { position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: OVERLAY_Z, overflow: 'visible' });
    const ptsAttr = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const mk = (attrs) => { const el = document.createElementNS(NS, 'polygon'); el.setAttribute('points', ptsAttr); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); svg.appendChild(el); return el; };
    const flood = mk({ fill: ctx.acc, stroke: 'none', opacity: '0' });
    const lit = mk({ fill: 'none', stroke: ctx.acc, 'stroke-width': String(Math.max(5, cap * 2.4)), 'stroke-linejoin': 'round', opacity: '0' });
    const pulse = mk({ fill: 'none', stroke: isLight(ctx) ? ctx.acc : '#ffffff', 'stroke-width': String(Math.max(7, cap * 3.2)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: '100', 'stroke-dasharray': '9 91', 'stroke-dashoffset': '100', opacity: '0' });
    document.body.appendChild(svg);
    ctx.nodes.push(svg);
    const lead = 200;
    const lap = def.lap || 850;
    anim(ctx, pulse, [
      { opacity: 1, strokeDashoffset: 100 },
      { opacity: 1, strokeDashoffset: -100, offset: 0.96 },
      { opacity: 0, strokeDashoffset: -100 },
    ], { duration: lap * 2, delay: lead, easing: 'linear' });
    anim(ctx, lit, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: lead + lap * 2 - 260 });
    anim(ctx, flood, [{ opacity: 0 }, { opacity: isLight(ctx) ? 0.32 : 0.42 }], { duration: 640, delay: lead + lap * 2 + 60, easing: 'ease-out' });
    return lead + lap * 2 + 900;
  },

  // DARKROOM (Etch). A bar of light sweeps up the board, the picture develops
  // row by row behind it from the bottom, the grid lines close, and the print
  // lifts off the page in a border.
  darkroom(ctx, def) {
    const grid = one(ctx.board, def.grid);
    if (!grid) return 0;
    const clueSet = new Set(all(ctx.board, def.clue));
    const cells = [...grid.children].filter((el) => visible(el)
      && !clueSet.has(el) && (!def.cellClass || el.classList.contains(def.cellClass)));
    if (!cells.length) return 0;
    const clues = [...clueSet];
    const gr = rectOf(grid);
    const light = isLight(ctx);
    const lead = 240;
    const scan = 1000;
    // The print: paper ground, the picture in the category colour, deepened on
    // the dark register so it reads on the paper.
    const paper = light ? '#ffffff' : '#fffaf0';
    const inkFill = light ? ctx.acc : shade(ctx.acc, 0.42);
    clues.forEach((el) => anim(ctx, el, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: lead }));
    const bar = overlay(ctx, { left: gr.left - 6, top: gr.bottom - 7, width: gr.width + 12, height: 14 }, {
      borderRadius: '7px', background: light ? ctx.acc : '#fffaf0', boxShadow: `0 0 22px 8px ${light ? ctx.acc : 'rgba(255,250,240,.65)'}`,
    });
    anim(ctx, bar, [
      { opacity: 0, transform: 'translateY(0)' },
      { opacity: 1, transform: 'translateY(0)', offset: 0.06 },
      { opacity: 1, transform: `translateY(${-gr.height}px)`, offset: 0.94 },
      { opacity: 0, transform: `translateY(${-gr.height}px)` },
    ], { duration: scan, delay: lead, easing: 'linear' });
    cells.forEach((el) => {
      const r = box(el);
      const frac = gr.height ? (gr.bottom - (r.top + r.height / 2)) / gr.height : 0;
      const d = lead + Math.round(Math.max(0, Math.min(1, frac)) * scan);
      const filled = def.filled(el);
      anim(ctx, el, filled
        ? [{}, { borderColor: inkFill, borderRadius: '0px', backgroundColor: inkFill, boxShadow: 'none', outlineColor: 'transparent' }]
        : [{}, { borderColor: paper, borderRadius: '0px', backgroundColor: paper, boxShadow: 'none', outlineColor: 'transparent', color: 'transparent' }],
      { duration: 360, delay: d });
    });
    const after = lead + scan + 120;
    anim(ctx, grid, [{ gap: getComputedStyle(grid).gap || '0px' }, { gap: '0px' }], { duration: 420, delay: after });
    // The print is the cells only: the clue gutters are clipped away and the
    // border is drawn round the cell block, turning with the grid about the
    // block's own centre so the two stay together.
    const frame = light ? '#ffffff' : '#fffaf0';
    const u = unionRect(cells, 0);
    const ox = u.left + u.width / 2 - gr.left, oy = u.top + u.height / 2 - gr.top;
    const uR = u.left + u.width, uB = u.top + u.height;
    const clipTo = `inset(${Math.max(0, u.top - gr.top)}px ${Math.max(0, gr.right - uR)}px ${Math.max(0, gr.bottom - uB)}px ${Math.max(0, u.left - gr.left)}px)`;
    const lift = { duration: 700, delay: after + 360, easing: 'cubic-bezier(.2,.8,.2,1)' };
    const turn = `scale(${def.zoom || 1.07}) rotate(-1.5deg)`;
    anim(ctx, grid, [
      { transform: 'scale(1) rotate(0deg)', transformOrigin: `${ox}px ${oy}px`, clipPath: clipTo },
      { transform: turn, transformOrigin: `${ox}px ${oy}px`, clipPath: clipTo },
    ], lift);
    const fw = 8;
    const ring = overlay(ctx, { left: u.left - fw, top: u.top - fw, width: u.width + fw * 2, height: u.height + fw * 2 }, {
      boxSizing: 'border-box', border: `${fw}px solid ${frame}`, background: 'transparent',
      boxShadow: '0 18px 44px rgba(0,0,0,.45)', borderRadius: '2px',
    });
    anim(ctx, ring, [
      { opacity: 0, transform: 'scale(1) rotate(0deg)' },
      { opacity: 1, transform: turn },
    ], lift);
    return after + 360 + 1100;
  },

  // GRAVITY (Four, on a win). The winning four glow and a beam of light cuts
  // through them, then every other disc lets go and falls out of the board.
  gravity(ctx, def) {
    const pieces = all(ctx.board, def.piece);
    const keep = (def.keep ? def.keep(ctx.board, ctx) : []) || [];
    if (!pieces.length || keep.length < 2) return 0;
    const lead = 160;
    const ks = keep.map((el) => ({ el, r: rectOf(el) })).sort((a, b) => a.r.cx - b.r.cx || a.r.cy - b.r.cy);
    ks.forEach((k, i) => anim(ctx, k.el, [
      { filter: 'none' },
      { filter: `drop-shadow(0 0 10px ${WARM}) brightness(1.25)`, offset: 0.4 },
      { filter: `drop-shadow(0 0 6px ${WARM})` },
    ], { duration: 480, delay: lead + i * 110 }));
    const a = ks[0].r, b = ks[ks.length - 1].r;
    const ext = a.width * 0.45;
    const ang = Math.atan2(b.cy - a.cy, b.cx - a.cx);
    const len = Math.hypot(b.cx - a.cx, b.cy - a.cy) + ext * 2;
    const sx = a.cx - Math.cos(ang) * ext, sy = a.cy - Math.sin(ang) * ext;
    const th = Math.max(5, Math.round(a.width * 0.14));
    const beam = overlay(ctx, { left: sx, top: sy - th / 2, width: len, height: th }, {
      borderRadius: th + 'px', background: '#fffbe9', boxShadow: `0 0 16px 5px rgba(255,231,166,.85)`, transformOrigin: `0 ${th / 2}px`,
    });
    const deg = (ang * 180) / Math.PI;
    anim(ctx, beam, [
      { opacity: 1, transform: `rotate(${deg}deg) scaleX(0)` },
      { opacity: 1, transform: `rotate(${deg}deg) scaleX(1)` },
    ], { duration: 360, delay: lead + ks.length * 110 + 60, easing: 'cubic-bezier(.3,.7,.3,1)' });
    const fallAt = lead + ks.length * 110 + 560;
    const vh = window.innerHeight;
    let end = fallAt;
    const xs = [...new Set(pieces.map((el) => Math.round(rectOf(el).cx)))].sort((p, q) => p - q);
    pieces.forEach((el) => {
      if (keep.includes(el)) return;
      const r = rectOf(el);
      const col = xs.indexOf(Math.round(r.cx));
      const d = fallAt + col * 55 + Math.round((vh - r.bottom) / vh * 120);
      const drop = vh - r.top + 40;
      const spin = ((col % 2) ? 1 : -1) * (25 + (col * 7) % 30);
      anim(ctx, el, [
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${drop * 0.45}px) rotate(${spin * 0.45}deg)`, opacity: 0.85, offset: 0.55 },
        { transform: `translateY(${drop}px) rotate(${spin}deg)`, opacity: 0 },
      ], { duration: 640, delay: d, easing: 'cubic-bezier(.5,0,.9,.45)' });
      end = Math.max(end, d + 640);
    });
    return end + 260;
  },

  // EXIT (Parker, Impound, Junkyard). The red block revs, drives out through
  // the gap in the wall with a streak behind it, and the lot gives a small hop.
  exit(ctx, def) {
    const blocks = all(ctx.board, def.piece);
    if (blocks.length < 2) return 0;
    const red = blocks[0];
    const rest = blocks.slice(1);
    const lot = one(ctx.board, def.lot) || ctx.board;
    const lr = rectOf(lot), rr = rectOf(red);
    const lead = 160;
    const drive = Math.max(80, lr.right - rr.left) + rr.width + 60;
    let redCol = '#dc4c3f';
    try { redCol = getComputedStyle(red).backgroundColor || redCol; } catch (e) {}
    anim(ctx, red, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-3px)', offset: 0.2 },
      { transform: 'translateX(2px)', offset: 0.45 },
      { transform: 'translateX(-4px)', offset: 0.7 },
      { transform: 'translateX(0)' },
    ], { duration: 340, delay: lead, fill: 'none' });
    const go = lead + 360;
    const lane = overlay(ctx, { left: rr.left, top: rr.top, width: Math.max(0, lr.right - rr.left) + 40, height: rr.height }, {
      borderRadius: '9px', background: WARM,
    });
    anim(ctx, lane, [{ opacity: 0 }, { opacity: isLight(ctx) ? 0.5 : 0.3, offset: 0.25 }, { opacity: isLight(ctx) ? 0.5 : 0.3, offset: 0.55 }, { opacity: 0 }], { duration: 1100, delay: go });
    anim(ctx, red, [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: `translateX(${drive}px)`, opacity: 1, offset: 0.85 },
      { transform: `translateX(${drive}px)`, opacity: 0 },
    ], { duration: 700, delay: go, easing: 'cubic-bezier(.6,0,.9,.35)' });
    const trailH = Math.round(rr.height * 0.55);
    const trail = overlay(ctx, { left: rr.left, top: rr.cy - trailH / 2, width: drive + rr.width, height: trailH }, {
      borderRadius: trailH + 'px', background: `linear-gradient(90deg, transparent, ${redCol})`, transformOrigin: 'left center',
    });
    anim(ctx, trail, [
      { opacity: 0.9, transform: 'scaleX(0)' },
      { opacity: 0.9, transform: 'scaleX(1)', offset: 0.6 },
      { opacity: 0, transform: 'scaleX(1)' },
    ], { duration: 900, delay: go + 80, easing: 'ease-out' });
    const hopAt = go + 560;
    rest.forEach((el, i) => anim(ctx, el, [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-6px) scale(1.05)', offset: 0.4 },
      { transform: 'translateY(0) scale(1)' },
    ], { duration: 380, delay: hopAt + i * 55, fill: 'none', easing: 'ease' }));
    return hopAt + rest.length * 55 + 640;
  },

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
    if (def.order === 'x') els = els.map((el) => ({ el, x: box(el).left })).sort((a, b) => a.x - b.x).map((a) => a.el);
    else if (def.order) els = def.order(els, ctx);
    else {
      const b = box(ctx.board);
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const ang = (el) => { const r = box(el); return Math.atan2(r.top + r.height / 2 - cy, r.left + r.width / 2 - cx); };
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
        const a = box(src), b = box(dst);
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


  // ---- the second batch of last beats (owner, 2026-10-10) ----

  // SWITCH-ON (Lamps). Each lamp clicks on in turn, its light runs along the
  // row and column to the walls, the numbered walls glow, a halo lifts the
  // whole board. def.role(el) names a cell 'lamp', 'wall', 'num' or 'lit'.
  switchon(ctx, def) {
    const cells = all(ctx.board, def.cell);
    if (cells.length < 9) return 0;
    const rows = asRows(cells);
    const pos = new Map();
    rows.forEach((row, r) => row.forEach((el, c) => pos.set(el, [r, c])));
    const at = (r, c) => (rows[r] ? rows[r][c] : null);
    const role = (el) => (el ? def.role(el) : 'wall');
    const lamps = cells.filter((el) => role(el) === 'lamp');
    if (!lamps.length) return 0;
    const lead = 160, step = Math.max(90, Math.min(220, 1700 / lamps.length)), run = 45;
    const light = new Map();
    lamps.forEach((el, i) => {
      const [r, c] = pos.get(el);
      const t0 = lead + i * step;
      light.set(el, Math.min(light.get(el) ?? Infinity, t0));
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        let rr = r + dr, cc = c + dc, k = 1;
        for (let q = at(rr, cc); q && role(q) !== 'wall' && role(q) !== 'num'; q = at(rr += dr, cc += dc), k++) {
          light.set(q, Math.min(light.get(q) ?? Infinity, t0 + k * run));
        }
      });
    });
    let last = 0;
    light.forEach((d, el) => {
      const isLamp = role(el) === 'lamp';
      const w = overlay(ctx, rectOf(el), { background: WARM, borderRadius: '3px', mixBlendMode: isLight(ctx) ? 'multiply' : 'normal' });
      anim(ctx, w, [{ opacity: 0 }, { opacity: 0.95, offset: 0.25 }, { opacity: isLamp ? 0.7 : 0.48 }], { duration: 420, delay: d });
      if (isLamp) {
        const r = rectOf(el), s = r.width * 0.5;
        const bulb = overlay(ctx, { left: r.cx - s / 2, top: r.cy - s / 2, width: s, height: s }, {
          borderRadius: '50%', background: '#fffbe9', boxShadow: '0 0 22px 9px rgba(255,236,170,.9)',
        });
        anim(ctx, bulb, [
          { opacity: 0, transform: 'scale(0)' },
          { opacity: 1, transform: 'scale(1.35)', offset: 0.45 },
          { opacity: 1, transform: 'scale(1)' },
        ], { duration: 360, delay: d, easing: 'cubic-bezier(.2,.8,.3,1)' });
      }
      last = Math.max(last, d + 420);
    });
    cells.filter((el) => role(el) === 'num').forEach((el, i) => {
      const r = rectOf(el);
      const g = overlay(ctx, r, { borderRadius: '4px', boxShadow: `inset 0 0 0 3px ${WARM}, 0 0 16px 3px rgba(255,231,166,.7)` });
      anim(ctx, g, [{ opacity: 0, transform: 'scale(1.15)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: last + i * 60 });
    });
    const b = rectOf(ctx.board);
    const R = Math.max(b.width, b.height) * 1.1;
    const halo = overlay(ctx, { left: b.cx - R / 2, top: b.cy - R / 2, width: R, height: R }, {
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,222,140,.32) 0%, rgba(255,222,140,.1) 45%, rgba(255,222,140,0) 70%)', zIndex: '8989',
    });
    anim(ctx, halo, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, delay: last });
    return last + 900;
  },

  // COIN FLIP (Duet; Turn's discs). Every token flips over in a diagonal wave,
  // then a line runs along each row and down each column to check it off.
  coinflip(ctx, def) {
    const cells = all(ctx.board, def.cell);
    if (cells.length < 4) return 0;
    const rows = asRows(cells), cols = asCols(cells);
    const lead = 140, wave = 60;
    let last = 0;
    rows.forEach((row, r) => row.forEach((el, c) => {
      const tok = def.token ? (el.querySelector(def.token) || null) : (el.firstElementChild || null);
      if (!tok) return;
      const d = lead + (r + c) * wave;
      anim(ctx, tok, [
        { transform: 'scaleX(1)', filter: 'none' },
        { transform: 'scaleX(.06)', filter: 'brightness(1.6)', offset: 0.4 },
        { transform: 'scaleX(1.16)', filter: 'brightness(1.3)', offset: 0.7 },
        { transform: 'scaleX(1)', filter: 'none' },
      ], { duration: 420, delay: d, fill: 'none' });
      last = Math.max(last, d + 420);
    }));
    const th = 3;
    const line = (rect, horiz, delay) => {
      const el = overlay(ctx, rect, {
        background: ctx.acc, borderRadius: th + 'px', boxShadow: `0 0 10px 2px ${ctx.acc}`,
        transformOrigin: horiz ? 'left center' : 'center top',
      });
      anim(ctx, el, [
        { opacity: 0, transform: horiz ? 'scaleX(0)' : 'scaleY(0)' },
        { opacity: 1, transform: horiz ? 'scaleX(.2)' : 'scaleY(.2)', offset: 0.1 },
        { opacity: 1, transform: 'none', offset: 0.7 },
        { opacity: 0, transform: 'none' },
      ], { duration: 520, delay });
    };
    rows.forEach((row, i) => {
      const u = unionRect(row, 0);
      line({ left: u.left + 4, top: u.top + u.height / 2 - th / 2, width: u.width - 8, height: th }, true, last + i * 70);
    });
    const colAt = last + rows.length * 70 + 120;
    cols.forEach((col, i) => {
      const u = unionRect(col, 0);
      line({ left: u.left + u.width / 2 - th / 2, top: u.top + 4, width: th, height: u.height - 8 }, false, colAt + i * 70);
    });
    return colAt + cols.length * 70 + 520;
  },

  // SNAP (Snug, Plot, Carve). The board's pieces, told apart by their colour,
  // lift and click home one after another; then the seams close into one
  // solid block and a gloss runs across it.
  snap(ctx, def) {
    const cells = all(ctx.board, def.cell);
    if (cells.length < 4) return 0;
    const groups = new Map();
    cells.forEach((el) => {
      const k = def.group ? def.group(el) : getComputedStyle(el).backgroundColor;
      if (!k || k === 'transparent' || k === 'rgba(0, 0, 0, 0)') return;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(el);
    });
    const pieces = [...groups.values()].filter((g) => g.length && g.length < cells.length)
      .sort((a, b) => rectOf(a[0]).top - rectOf(b[0]).top || rectOf(a[0]).left - rectOf(b[0]).left);
    if (pieces.length < 2) return 0;
    const lead = 140, step = Math.max(110, Math.min(240, 1500 / pieces.length));
    if (def.scatter) {
      // MOSAIC (Shards): every shard leaps off the grid at once and flies back
      // into its place, one shard after another.
      const u0 = unionRect(cells, 0);
      const seed = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
      pieces.forEach((g, i) => {
        const dx = (seed(i, 1) - 0.5) * u0.width * 0.75, dy = (seed(i, 2) - 0.5) * u0.height * 0.75, rot = (seed(i, 3) - 0.5) * 120;
        g.forEach((el) => {
          anim(ctx, el, [
            { transform: 'none', opacity: 1, offset: 0 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(.85)`, opacity: 0.35, offset: 0.12 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(.85)`, opacity: 0.35, offset: 0.4 + 0.45 * (i / pieces.length) },
            { transform: 'translate(0,0) scale(1.06)', opacity: 1, offset: Math.min(0.97, 0.52 + 0.45 * (i / pieces.length)) },
            { transform: 'none', opacity: 1 },
          ], { duration: 1900, delay: lead, fill: 'none', easing: 'ease-out' });
        });
      });
      const t2 = lead + 1900 + 60;
      pieces.forEach((g, i) => g.forEach((el) => {
        const t = overlay(ctx, rectOf(el), { background: ctx.acc });
        anim(ctx, t, [{ opacity: 0 }, { opacity: 0.6, offset: 0.4 }, { opacity: 0 }], { duration: 520, delay: t2 + i * 30 });
      }));
      return t2 + pieces.length * 30 + 700;
    }
    pieces.forEach((g, i) => g.forEach((el) => anim(ctx, el, [
      { transform: 'translateY(0) scale(1)', filter: 'none' },
      { transform: 'translateY(-8px) scale(1.04)', filter: 'brightness(1.25) drop-shadow(0 8px 8px rgba(0,0,0,.35))', offset: 0.4 },
      { transform: 'translateY(2px) scale(.98)', filter: 'none', offset: 0.75 },
      { transform: 'translateY(0) scale(1)', filter: 'none' },
    ], { duration: 420, delay: lead + i * step, fill: 'none', easing: 'ease-out' })));
    const merge = lead + pieces.length * step + 260;
    const u = unionRect(cells, 0);
    pieces.forEach((g) => g.forEach((el) => {
      const t = overlay(ctx, rectOf(el), { background: ctx.acc });
      anim(ctx, t, [{ opacity: 0 }, { opacity: 0.72 }], { duration: 420, delay: merge });
    }));
    const clip = overlay(ctx, u, { overflow: 'hidden', opacity: '1', zIndex: '8991' });
    const g = document.createElement('div');
    Object.assign(g.style, {
      position: 'absolute', top: '-20%', left: '-40%', width: '30%', height: '140%',
      background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))',
      transform: 'rotate(16deg)',
    });
    clip.appendChild(g);
    anim(ctx, g, [
      { transform: 'rotate(16deg) translateX(0)', opacity: 1 },
      { transform: `rotate(16deg) translateX(${u.width * 1.9}px)`, opacity: 1 },
    ], { duration: 720, delay: merge + 380, easing: 'ease-in-out' });
    return merge + 380 + 900;
  },

  // TOPPLE (Mate, Queen). A shock ring runs out from the beaten king, the
  // squares flash outward from it, the king rocks and goes over.
  topple(ctx, def) {
    const sqs = all(ctx.board, def.cell);
    const kingSq = sqs.find((el) => def.victim(el));
    if (!kingSq) return 0;
    const piece = kingSq.querySelector(def.piece) || kingSq.firstElementChild;
    const kr = rectOf(kingSq);
    const lead = 160;
    burst(ctx, kr.cx, kr.cy, kr.width, '#f4f6fb', lead, 9, 900, 3);
    sqs.forEach((el) => {
      const r = rectOf(el);
      const d = Math.max(Math.abs(r.cx - kr.cx), Math.abs(r.cy - kr.cy)) / (kr.width || 1);
      const f = overlay(ctx, r, { background: '#e2e8f0' });
      anim(ctx, f, [{ opacity: 0 }, { opacity: 0.55, offset: 0.3 }, { opacity: 0 }], { duration: 420, delay: lead + Math.round(d) * 80 });
    });
    const at = lead + 560;
    if (piece) {
      anim(ctx, piece, [
        { transform: 'rotate(0deg)', transformOrigin: '70% 92%' },
        { transform: 'rotate(-9deg)', transformOrigin: '70% 92%', offset: 0.15 },
        { transform: 'rotate(7deg)', transformOrigin: '70% 92%', offset: 0.3 },
        { transform: 'rotate(96deg)', transformOrigin: '70% 92%', offset: 0.78 },
        { transform: 'rotate(88deg)', transformOrigin: '70% 92%', offset: 0.9 },
        { transform: 'rotate(90deg)', transformOrigin: '70% 92%', opacity: 0.8 },
      ], { duration: 820, delay: at, easing: 'ease-in' });
    }
    if (def.word) {
      const b = rectOf(ctx.board);
      const h = Math.max(30, Math.min(56, b.width * 0.11));
      const w = overlay(ctx, { left: b.left, top: b.cy - h / 2, width: b.width, height: h }, {
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        font: `800 ${Math.round(h * 0.62)}px Manrope, system-ui, sans-serif`, letterSpacing: '.2em',
        textShadow: '0 2px 14px rgba(0,0,0,.65)', background: 'rgba(11,15,26,.55)',
      });
      w.textContent = def.word;
      anim(ctx, w, [
        { opacity: 0, letterSpacing: '.6em' },
        { opacity: 1, letterSpacing: '.2em' },
      ], { duration: 520, delay: at + 700, easing: 'cubic-bezier(.2,.8,.3,1)' });
    }
    return at + 700 + 900;
  },

  // CLIMB (Rung, Hinge). A light climbs the chain from the bottom word to the
  // top; each word lights as it passes and a changed letter flares gold.
  climb(ctx, def) {
    const rows = (def.rows(ctx.board) || []).filter((r) => r && r.length);
    if (rows.length < 2) return 0;
    const lead = 160, step = Math.max(220, Math.min(480, 2000 / rows.length));
    const u = unionRect(rows.flat(), 6);
    const sky = '#7dd3fc';
    [u.left - 10, u.left + u.width + 4].forEach((x) => {
      const rail = overlay(ctx, { left: x, top: u.top, width: 6, height: u.height }, {
        borderRadius: '3px', background: sky, boxShadow: `0 0 12px 2px ${sky}`, transformOrigin: 'center bottom',
      });
      anim(ctx, rail, [{ opacity: 1, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)' }],
        { duration: rows.length * step, delay: lead, easing: 'linear' });
    });
    const dot = overlay(ctx, { left: u.left + u.width / 2 - 11, top: u.top + u.height - 11, width: 22, height: 22 }, {
      borderRadius: '50%', background: '#fffbe9', boxShadow: `0 0 18px 6px ${sky}`,
    });
    anim(ctx, dot, [
      { opacity: 0, transform: 'translateY(0)' },
      { opacity: 1, transform: 'translateY(0)', offset: 0.05 },
      { opacity: 1, transform: `translateY(${-u.height + 22}px)`, offset: 0.92 },
      { opacity: 0, transform: `translateY(${-u.height + 22}px)` },
    ], { duration: rows.length * step + 200, delay: lead, easing: 'linear' });
    const n = rows.length;
    rows.forEach((row, i) => {
      const fromBottom = n - 1 - i;
      const d = lead + fromBottom * step;
      const below = rows[i + 1];
      row.forEach((el, k) => {
        const changed = def.changed !== false && below && below[k]
          && (el.textContent || '').trim() !== (below[k].textContent || '').trim();
        const f = overlay(ctx, rectOf(el), { borderRadius: '6px', background: changed ? '#fde68a' : sky,
          boxShadow: changed ? '0 0 16px 4px rgba(253,230,138,.8)' : 'none', mixBlendMode: isLight(ctx) ? 'multiply' : 'screen' });
        anim(ctx, f, [
          { opacity: 0, transform: 'scale(1)' },
          { opacity: changed ? 0.95 : 0.6, transform: changed ? 'scale(1.12)' : 'scale(1)', offset: 0.35 },
          { opacity: changed ? 0.6 : 0.28, transform: 'scale(1)' },
        ], { duration: 460, delay: d + k * 40 });
      });
    });
    return lead + n * step + 520;
  },

  // CASCADE (the card games). Every card leaps off the table and bounces away
  // down the screen with a short trail behind it. The cards are copied into
  // overlays (computed styles baked in) so no container clips them.
  cascade(ctx, def) {
    const cards = all(ctx.board, def.card).slice(0, def.max || 30);
    if (!cards.length) return 0;
    const vh = window.innerHeight, vw = window.innerWidth;
    const lead = 140, step = Math.max(55, Math.min(150, 1400 / cards.length));
    const PROPS = ['background-color', 'background-image', 'color', 'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-radius', 'box-shadow', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align',
      'display', 'flex-direction', 'align-items', 'justify-content', 'gap', 'padding', 'width', 'height', 'box-sizing',
      'position', 'top', 'left', 'right', 'bottom', 'fill', 'stroke', 'opacity', 'white-space', 'overflow'];
    const bake = (src, dst) => {
      const cs = getComputedStyle(src);
      PROPS.forEach((p) => { try { dst.style.setProperty(p, cs.getPropertyValue(p)); } catch (e) {} });
      const a = src.children, b = dst.children;
      for (let i = 0; i < a.length && i < b.length; i++) bake(a[i], b[i]);
    };
    let end = 0;
    cards.forEach((card, i) => {
      const r = rectOf(card);
      const floor = vh - r.bottom - 8;
      const dir = (i % 2 ? 1 : -1) * (0.6 + ((i * 37) % 10) / 20);
      const dx = Math.max(-r.left - r.width, Math.min(vw - r.left, dir * (140 + ((i * 53) % 120))));
      const rt = (i % 2 ? 1 : -1) * (16 + (i * 7) % 30);
      const path = [0, 0.18, 0.36, 0.54, 0.7, 0.84, 1];
      const ys = [0, floor, floor * 0.42, floor, floor * 0.7, floor, floor];
      const frames = (o) => path.map((p, k) => ({
        transform: `translate(${dx * p}px, ${ys[k]}px) rotate(${rt * p}deg)`,
        opacity: k === path.length - 1 ? 0 : o, offset: p,
      }));
      const d = lead + i * step;
      [0.18, 0.32, 1].forEach((o, g) => {
        const c = card.cloneNode(true);
        bake(card, c);
        Object.assign(c.style, {
          position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
          margin: '0', zIndex: String(8992 + g), pointerEvents: 'none', willChange: 'transform', opacity: '0',
        });
        c.setAttribute('aria-hidden', 'true');
        document.body.appendChild(c);
        ctx.nodes.push(c);
        anim(ctx, c, frames(o), { duration: 1500, delay: d + (2 - g) * 60, easing: 'linear', fill: 'both' });
      });
      anim(ctx, card, [{ opacity: 1 }, { opacity: 0 }], { duration: 60, delay: d + 120 });
      end = Math.max(end, d + 120 + 1500);
    });
    return Math.min(end, lead + cards.length * step + 1100);
  },

  // SKYLINE (Towers). Every digit rises as a tower in its own square, then the
  // light runs down the rows and picks out the towers each clue can see.
  skyline(ctx, def) {
    const cells = all(ctx.board, def.cell);
    const rows = asRows(cells);
    if (rows.length < 3) return 0;
    const val = (el) => parseInt((el.textContent || '').replace(/\D/g, '').slice(0, 1), 10) || 0;
    const max = Math.max(...cells.map(val), 1);
    const lead = 140;
    const towers = new Map();
    rows.forEach((row, r) => row.forEach((el, c) => {
      const v = val(el);
      if (!v) return;
      const q = rectOf(el);
      const h = (q.height - 6) * (v / max);
      const t = overlay(ctx, { left: q.left + q.width * 0.18, top: q.bottom - 3 - h, width: q.width * 0.64, height: h }, {
        borderRadius: '3px 3px 0 0', transformOrigin: 'center bottom',
        background: `linear-gradient(90deg, ${ctx.acc} 0 56%, ${shade(ctx.acc, 0.6)} 56% 100%)`,
      });
      anim(ctx, t, [
        { opacity: 1, transform: 'scaleY(0)' },
        { opacity: 1, transform: 'scaleY(1.12)', offset: 0.7 },
        { opacity: 1, transform: 'scaleY(1)' },
      ], { duration: 420, delay: lead + (r + c) * 70, easing: 'cubic-bezier(.2,.8,.3,1)' });
      towers.set(el, t);
    }));
    const look = lead + (rows.length * 2) * 70 + 420;
    const clues = all(ctx.board, def.clue);
    rows.forEach((row, r) => {
      const d = look + r * 220;
      let top = 0;
      row.forEach((el) => {
        const v = val(el);
        if (v > top) {
          top = v;
          const t = towers.get(el);
          if (t) anim(ctx, t, [{ filter: 'none' }, { filter: 'brightness(1.7) drop-shadow(0 0 6px #fde68a)', offset: 0.4 }, { filter: 'brightness(1.3)' }], { duration: 420, delay: d });
        }
      });
      const rr = rectOf(row[0]);
      const clue = clues.find((k) => { const q = rectOf(k); return q.right <= rr.left + 2 && Math.abs(q.cy - rr.cy) < rr.height / 2; });
      if (clue) anim(ctx, clue, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 420, delay: d, fill: 'none' });
    });
    return look + rows.length * 220 + 500;
  },

  // CROWNING (Jesters, Judges). A crown drops onto each seated piece, then
  // every court floods brighter in its own colour, outward from its seat.
  crowning(ctx, def) {
    const cells = all(ctx.board, def.cell);
    if (cells.length < 16) return 0;
    const rows = asRows(cells);
    const pos = new Map();
    rows.forEach((row, r) => row.forEach((el, c) => pos.set(el, [r, c])));
    const seats = cells.filter((el) => def.seat(el));
    if (!seats.length) return 0;
    const lead = 140, step = Math.max(80, Math.min(160, 1300 / seats.length));
    const NS = 'http://www.w3.org/2000/svg';
    seats.forEach((el, i) => {
      const r = rectOf(el);
      const w = r.width * 0.62, h = w * 0.72;
      const box = overlay(ctx, { left: r.cx - w / 2, top: r.top - h * 0.25, width: w, height: h }, { zIndex: '8993' });
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 22 16');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M2 14 L2 5 L7 9 L11 2 L15 9 L20 5 L20 14 Z');
      p.setAttribute('fill', '#fde68a');
      p.setAttribute('stroke', '#b45309');
      p.setAttribute('stroke-width', '1.5');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
      box.appendChild(svg);
      anim(ctx, box, [
        { opacity: 0, transform: 'translateY(-60px)' },
        { opacity: 1, transform: 'translateY(0) scale(1.15)', offset: 0.7 },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ], { duration: 380, delay: lead + i * step, easing: 'cubic-bezier(.3,.7,.4,1.2)' });
    });
    const flood = lead + seats.length * step + 200;
    const court = (el) => (def.court ? def.court(el) : getComputedStyle(el).backgroundColor);
    const seatOf = new Map(seats.map((s) => [court(s), s]));
    const courts = [...new Set(cells.map(court))];
    cells.forEach((el) => {
      const k = court(el);
      const s = seatOf.get(k);
      const [r, c] = pos.get(el) || [0, 0];
      const [sr, sc] = (s && pos.get(s)) || [r, c];
      const d = flood + courts.indexOf(k) * 90 + (Math.abs(r - sr) + Math.abs(c - sc)) * 45;
      const f = overlay(ctx, rectOf(el), { background: k, filter: 'saturate(1.7) brightness(1.3)' });
      anim(ctx, f, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 300, delay: d });
    });
    return flood + courts.length * 90 + 14 * 45 + 600;
  },

  // RISE (Mercury). Each thermometer fills with mercury from its bulb, and
  // every digit the column passes glows warm as the level reaches it.
  rise(ctx, def) {
    const svg = one(ctx.board, def.svg);
    if (!svg) return 0;
    const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    const n = vb[2] || 9;
    const cells = all(ctx.board, def.cell);
    const rows = asRows(cells);
    if (rows.length !== n) return 0;
    const lines = [...svg.querySelectorAll('polyline')];
    if (!lines.length) return 0;
    const box = rectOf(svg);
    const NS = 'http://www.w3.org/2000/svg';
    const lead = 140, per = 170, gapT = 240;
    let last = 0;
    lines.forEach((pl, i) => {
      const pts = (pl.getAttribute('points') || '').trim().split(/\s+/).map((q) => q.split(',').map(Number));
      if (!pts.length) return;
      const t0 = lead + i * gapT;
      const dur = Math.max(1, pts.length - 1) * per;
      const host = overlay(ctx, box, { zIndex: '8991' });
      const sv = document.createElementNS(NS, 'svg');
      sv.setAttribute('viewBox', `0 0 ${n} ${n}`);
      sv.setAttribute('width', '100%'); sv.setAttribute('height', '100%');
      const line = document.createElementNS(NS, 'polyline');
      line.setAttribute('points', pts.map(([x, y]) => `${x},${y}`).join(' '));
      line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#ef4444');
      line.setAttribute('stroke-width', '0.26'); line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round');
      line.setAttribute('pathLength', '1'); line.setAttribute('stroke-dasharray', '1 1'); line.setAttribute('stroke-dashoffset', '1');
      const bulb = document.createElementNS(NS, 'circle');
      bulb.setAttribute('cx', pts[0][0]); bulb.setAttribute('cy', pts[0][1]); bulb.setAttribute('r', '0.3'); bulb.setAttribute('fill', '#ef4444');
      bulb.style.transformBox = 'fill-box'; bulb.style.transformOrigin = 'center';
      sv.appendChild(line); sv.appendChild(bulb); host.appendChild(sv);
      anim(ctx, host, [{ opacity: 0 }, { opacity: 0.8 }], { duration: 120, delay: t0 });
      anim(ctx, bulb, [{ transform: 'scale(0)' }, { transform: 'scale(1.5)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 260, delay: t0 });
      if (pts.length > 1) anim(ctx, line, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: dur, delay: t0 + 120, easing: 'linear' });
      pts.forEach(([x, y], k) => {
        const row = rows[Math.floor(y)];
        const el = row && row[Math.floor(x)];
        if (!el) return;
        const d = t0 + 120 + (pts.length > 1 ? (k / (pts.length - 1)) * dur : 0);
        // The tube sits over the board, so the cell's digit is restamped on top
        // of it and glows as the level reaches it (it would be painted over).
        const tn = [...el.querySelectorAll('*')].reverse().find((x) => /^[1-9]$/.test((x.textContent || '').trim())) || el;
        const cs = getComputedStyle(tn);
        const g = overlay(ctx, rectOf(el), {
          boxShadow: 'inset 0 0 0 999px rgba(249,115,22,.28), inset 0 0 0 2px #fb923c', borderRadius: '2px', zIndex: '8992',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff7ed',
          fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: '800', textShadow: '0 0 6px #f97316, 0 0 2px #7c2d12',
        });
        const dig = (el.textContent || '').trim();
        if (/^[1-9]$/.test(dig)) g.textContent = dig;
        anim(ctx, g, [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0.7 }], { duration: 320, delay: d });
        bump(ctx, el, d, 360);
      });
      last = Math.max(last, t0 + 120 + dur + 360);
    });
    return last + 500;
  },

  // SEAL (Cages). Cage by cage, sweeping across the grid, the outline lights,
  // the cage floods, and its printed total pops.
  seal(ctx, def) {
    const cells = all(ctx.board, def.cell);
    const rows = asRows(cells);
    const pos = new Map();
    rows.forEach((row, r) => row.forEach((el, c) => pos.set(el, [r, c])));
    const groups = (def.groups ? def.groups(ctx.board) : []).filter((g) => g.cells && g.cells.length);
    if (groups.length < 2) return 0;
    const key = (g) => Math.min(...g.cells.map((el) => { const p = pos.get(el) || [0, 0]; return p[0] + p[1]; }));
    groups.sort((a, b) => key(a) - key(b));
    const lead = 140, step = Math.max(45, Math.min(110, 2000 / groups.length));
    let last = 0;
    groups.forEach((g, i) => {
      const d = lead + key(g) * 90 + (i % 3) * 25;
      const set = new Set(g.cells);
      const at = (r, c) => (rows[r] ? rows[r][c] : null);
      g.cells.forEach((el) => {
        const [r, c] = pos.get(el) || [0, 0];
        const edge = (q) => !q || !set.has(q);
        const line = `3px solid ${ctx.acc}`;
        const o = overlay(ctx, rectOf(el), {
          borderTop: edge(at(r - 1, c)) ? line : 'none', borderBottom: edge(at(r + 1, c)) ? line : 'none',
          borderLeft: edge(at(r, c - 1)) ? line : 'none', borderRight: edge(at(r, c + 1)) ? line : 'none',
          background: `color-mix(in srgb, ${ctx.acc} 30%, transparent)`,
        });
        anim(ctx, o, [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0.55 }], { duration: 420, delay: d });
      });
      if (g.sum) {
        anim(ctx, g.sum, [
          { transform: 'scale(1)', filter: 'none' },
          { transform: 'scale(1.7)', filter: 'brightness(1.6)', offset: 0.4 },
          { transform: 'scale(1)', filter: 'none' },
        ], { duration: 420, delay: d, fill: 'none' });
      }
      last = Math.max(last, d + 420);
    });
    return last + 500;
  },

  // ODOMETER (Cipher). Column by column from the right, each letter's digit
  // rolls through the dial and lands; carries hop over as their column lands.
  odometer(ctx, def) {
    const cells = all(ctx.board, def.cell).filter((el) => getComputedStyle(el).visibility !== 'hidden' && el.querySelector(def.digit));
    if (cells.length < 3) return 0;
    const cols = asCols(cells).reverse();
    const lead = 140, colStep = 380, roll = 620;
    const surf = getComputedStyle(ctx.root).getPropertyValue('--stg-surf').trim() || '#141b2b';
    const done = [];
    cols.forEach((col, ci) => {
      const t0 = lead + ci * colStep;
      col.forEach((el, k) => {
        const dg = el.querySelector(def.digit);
        const d = parseInt((dg.textContent || '').trim(), 10);
        if (!Number.isFinite(d)) return;
        const r = rectOf(dg);
        const cs = getComputedStyle(dg);
        const bg = getComputedStyle(el).backgroundColor;
        const o = overlay(ctx, r, { overflow: 'hidden', background: (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : surf });
        const strip = document.createElement('div');
        Object.assign(strip.style, { position: 'absolute', left: '0', top: '0', width: '100%' });
        for (let q = 1; q <= 10; q++) {
          const s = document.createElement('div');
          s.textContent = String((d + q) % 10);
          Object.assign(s.style, { height: r.height + 'px', lineHeight: r.height + 'px', textAlign: 'center', font: cs.font, color: cs.color, fontWeight: cs.fontWeight });
          strip.appendChild(s);
        }
        o.appendChild(strip);
        const t = t0 + k * 60;
        anim(ctx, o, [{ opacity: 1 }, { opacity: 1 }], { duration: roll, delay: t, fill: 'forwards' });
        anim(ctx, strip, [
          { transform: 'translateY(0)' },
          { transform: `translateY(${-9 * r.height - 4}px)`, offset: 0.85 },
          { transform: `translateY(${-9 * r.height}px)` },
        ], { duration: roll, delay: t, easing: 'cubic-bezier(.3,.1,.3,1)' });
        bump(ctx, el, t + roll - 80, 300);
      });
      const cx = col.length ? rectOf(col[0]).cx : 0;
      done.push({ cx, t: t0 + roll + col.length * 60 });
    });
    const carries = all(ctx.board, def.carry).filter((el) => (el.textContent || '').trim() && (el.textContent || '').trim() !== '0');
    carries.forEach((el) => {
      const r = rectOf(el);
      const right = done.filter((x) => x.cx > r.cx + 2).sort((a, b) => a.cx - b.cx)[0];
      const t = right ? right.t : lead;
      anim(ctx, el, [
        { transform: 'translate(40px, 30px) scale(.5)', opacity: 0 },
        { transform: 'translate(18px, -14px) scale(1.25)', opacity: 1, offset: 0.55 },
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
      ], { duration: 460, delay: t, easing: 'ease-out', fill: 'backwards' });
      burst(ctx, r.cx, r.cy, r.width * 0.8, ctx.acc, t + 400, 3, 500, 2);
    });
    all(ctx.board, def.mark).forEach((el) => {
      const r = rectOf(el);
      const near = done.slice().sort((a, b) => Math.abs(a.cx - r.cx) - Math.abs(b.cx - r.cx))[0];
      if (near) bump(ctx, el, near.t, 380);
    });
    return lead + cols.length * colStep + roll + 500;
  },

  // LOCKUP (Links). The solved bands slam in one after another and their
  // words rise into place, then each band flashes once in turn.
  lockup(ctx, def) {
    const bands = all(ctx.board, def.band);
    if (bands.length < 2) return 0;
    const lead = 140, step = 300;
    bands.forEach((b, i) => {
      const t = lead + i * step;
      anim(ctx, b, [
        { transform: 'translateX(-30px) scaleX(.4)', opacity: 0.2, filter: 'brightness(1.5)' },
        { transform: 'translateX(4px) scaleX(1.04)', opacity: 1, filter: 'brightness(1.3)', offset: 0.6 },
        { transform: 'none', opacity: 1, filter: 'none' },
      ], { duration: 460, delay: t, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
      [...b.querySelectorAll(def.words)].forEach((w) => anim(ctx, w, [
        { transform: 'translateY(12px)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ], { duration: 360, delay: t + 240, fill: 'backwards' }));
    });
    const flash = lead + bands.length * step + 260;
    bands.forEach((b, i) => {
      const o = overlay(ctx, rectOf(b), { borderRadius: getComputedStyle(b).borderRadius, boxShadow: `inset 0 0 0 3px ${ctx.ink}`, background: 'rgba(255,255,255,.18)' });
      anim(ctx, o, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 380, delay: flash + i * 110 });
    });
    return flash + bands.length * 110 + 600;
  },

  // TIMELINE (Dating). A line draws down through the events, and each one pins
  // in turn: its node pops, its year jumps, its card settles.
  timeline(ctx, def) {
    const nodes = all(ctx.board, def.node);
    if (nodes.length < 2) return 0;
    const cards = all(ctx.board, def.card);
    const a = rectOf(nodes[0]), z = rectOf(nodes[nodes.length - 1]);
    const lead = 140, step = 380;
    const total = (nodes.length - 1) * step;
    const rail = overlay(ctx, { left: a.cx - 2, top: a.cy, width: 4, height: Math.max(4, z.cy - a.cy) }, {
      background: ctx.acc, borderRadius: '2px', transformOrigin: 'center top', boxShadow: `0 0 10px 1px ${ctx.acc}`,
    });
    anim(ctx, rail, [{ opacity: 1, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)' }], { duration: total, delay: lead, easing: 'linear' });
    nodes.forEach((nd, i) => {
      const t = lead + i * step;
      const r = rectOf(nd);
      anim(ctx, nd, [{ transform: 'scale(1)' }, { transform: 'scale(1.6)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 360, delay: t, fill: 'none' });
      burst(ctx, r.cx, r.cy, r.width, ctx.acc, t, 3.5, 600, 3);
      const card = cards[i];
      if (card) {
        anim(ctx, card, [
          { transform: 'translateX(14px)', filter: 'brightness(1.35)' },
          { transform: 'translateX(-3px)', filter: 'brightness(1.2)', offset: 0.6 },
          { transform: 'none', filter: 'none' },
        ], { duration: 420, delay: t, fill: 'none' });
        const yr = card.querySelector(def.year);
        if (yr) anim(ctx, yr, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 380, delay: t + 60, fill: 'none' });
      }
    });
    return lead + total + 900;
  },

  // SONAR (Sweep). Pings roll out from the last square, every square flashes
  // as the ring passes, and each mine you flagged right turns to a tick.
  sonar(ctx, def) {
    const v = rectOf(ctx.board);
    const cells = all(ctx.board, def.cell).filter((el) => { const r = box(el); return r.bottom > v.top && r.top < v.bottom; });
    if (cells.length < 9) return 0;
    const o = originPoint(ctx);
    const lead = 120, speed = 0.7; // px per ms
    const R = Math.hypot(Math.max(o.x - v.left, v.right - o.x), Math.max(o.y - v.top, v.bottom - o.y));
    const clip = overlay(ctx, v, { overflow: 'hidden', opacity: '1', borderRadius: '10px' });
    [0, 420].forEach((off) => {
      const ring = document.createElement('div');
      const s = 24;
      Object.assign(ring.style, { position: 'absolute', left: (o.x - v.left - s / 2) + 'px', top: (o.y - v.top - s / 2) + 'px', width: s + 'px', height: s + 'px', borderRadius: '50%', border: `3px solid ${ctx.acc}`, opacity: '0' });
      clip.appendChild(ring);
      anim(ctx, ring, [
        { opacity: 1, transform: 'scale(.3)' },
        { opacity: 0.2, transform: `scale(${(R * 2) / s})` },
      ], { duration: R / speed, delay: lead + off, easing: 'linear' });
    });
    let last = 0;
    cells.forEach((el) => {
      const r = rectOf(el);
      const t = lead + Math.hypot(r.cx - o.x, r.cy - o.y) / speed;
      const good = def.good && def.good(el);
      const f = overlay(ctx, r, { borderRadius: '4px', background: good ? '#16a34a' : ctx.acc, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: Math.round(r.height * 0.6) + 'px' });
      if (good) {
        f.textContent = '✓';
        anim(ctx, f, [{ opacity: 0, transform: 'scale(1.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: t });
      } else {
        anim(ctx, f, [{ opacity: 0 }, { opacity: 0.35, offset: 0.3 }, { opacity: 0 }], { duration: 360, delay: t });
      }
      last = Math.max(last, t + 360);
    });
    return last + 500;
  },

  // CASE CLOSED (Alibi, Docket). Each confirmed fact gets a tick stamped on
  // it, then the file gets its verdict: a red stamp lands and the board jolts.
  stamp(ctx, def) {
    const yes = all(ctx.board, def.yes);
    if (!yes.length) return 0;
    const lead = 140, step = Math.max(90, Math.min(260, 2000 / yes.length));
    yes.forEach((el, i) => {
      const r = rectOf(el);
      const s = Math.min(r.width, r.height) * 0.9;
      const o = overlay(ctx, { left: r.cx - s / 2, top: r.cy - s / 2, width: s, height: s }, {
        borderRadius: '6px', background: ctx.acc, color: '#0b0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '800', fontSize: Math.round(s * 0.62) + 'px', zIndex: '8991',
      });
      o.textContent = '✓';
      anim(ctx, o, [
        { opacity: 0, transform: 'scale(2.2) rotate(-12deg)' },
        { opacity: 1, transform: 'scale(.9) rotate(0)', offset: 0.6 },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 320, delay: lead + i * step, easing: 'cubic-bezier(.3,.7,.4,1)' });
    });
    const t = lead + yes.length * step + 260;
    const b = rectOf(ctx.board);
    const w = Math.min(b.width * 0.86, 340);
    const fs = Math.round(w / 9.5);
    const st = overlay(ctx, { left: b.cx - w / 2, top: b.cy - fs, width: w, height: fs * 2 }, {
      border: '5px solid #ef4444', borderRadius: '10px', color: '#ef4444', background: isLight(ctx) ? 'rgba(255,255,255,.82)' : 'rgba(11,15,26,.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: fs + 'px',
      letterSpacing: '.08em', textTransform: 'uppercase', zIndex: '8993', whiteSpace: 'nowrap',
    });
    st.textContent = def.word || 'Case closed';
    anim(ctx, st, [
      { opacity: 0, transform: 'rotate(-14deg) scale(3)' },
      { opacity: 1, transform: 'rotate(-14deg) scale(.92)', offset: 0.7 },
      { opacity: 1, transform: 'rotate(-14deg) scale(1)' },
    ], { duration: 340, delay: t, easing: 'cubic-bezier(.5,0,.8,.6)' });
    anim(ctx, ctx.board, [
      { transform: 'translate(0,0)' }, { transform: 'translate(4px,-3px)' }, { transform: 'translate(-4px,3px)' },
      { transform: 'translate(2px,-1px)' }, { transform: 'translate(0,0)' },
    ], { duration: 260, delay: t + 230, fill: 'none' });
    return t + 1200;
  },

  // COUNT (Yose). The settled territory fills in, in waves out from where the
  // game ended: your side first, then theirs.
  count(ctx, def) {
    const svg = one(ctx.board, def.svg);
    if (!svg) return 0;
    const marks = [...svg.querySelectorAll(def.mark)].filter(visible);
    if (marks.length < 2) return 0;
    const o = originPoint(ctx);
    const unit = def.unit ? def.unit(svg) : 0;
    const sides = new Map();
    marks.forEach((m) => {
      const k = getComputedStyle(m).fill;
      if (!sides.has(k)) sides.set(k, []);
      sides.get(k).push(m);
    });
    const order = [...sides.entries()].sort((a, b) => (def.mine && def.mine(a[1][0]) ? -1 : 0) - (def.mine && def.mine(b[1][0]) ? -1 : 0));
    const lead = 140, speed = 0.5;
    let t0 = lead, last = 0;
    order.forEach(([fill, list]) => {
      let end = t0;
      list.forEach((m) => {
        const r = rectOf(m);
        const s = unit || r.width * 3.2;
        const d = t0 + Math.hypot(r.cx - o.x, r.cy - o.y) / speed;
        const f = overlay(ctx, { left: r.cx - s / 2, top: r.cy - s / 2, width: s, height: s }, { background: fill, borderRadius: '4px' });
        anim(ctx, f, [
          { opacity: 0, transform: 'scale(.2)' },
          { opacity: 0.75, transform: 'scale(1.08)', offset: 0.6 },
          { opacity: 0.55, transform: 'scale(1)' },
        ], { duration: 340, delay: d, easing: 'cubic-bezier(.3,.7,.4,1.2)' });
        end = Math.max(end, d + 340);
      });
      t0 = end + 200;
      last = end;
    });
    pulseBoard(ctx, ctx.board, last + 120, 600);
    return last + 800;
  },
  // ---- the fourth and fifth batches of last beats (2026-10-10) ----

  // FOUNTAIN (Lode). Every word you found springs up out of the letters and
  // lands back in the haul; rare words and pangrams land in gold.
  fountain(ctx, def) {
    const vh = window.innerHeight;
    const chips = all(ctx.board, def.chip).filter((c) => { const r = box(c); return r.bottom > 0 && r.top < vh; }).slice(0, 48);
    if (!chips.length) return 0;
    const src = one(ctx.board, def.from);
    const s = src ? rectOf(src) : rectOf(ctx.board);
    const lead = 160, step = Math.max(35, Math.min(110, 1800 / chips.length)), fly = 620;
    all(ctx.board, def.hex).forEach((h, i) => bump(ctx, h, 40 + i * 50, 380));
    chips.forEach((c, i) => {
      const r = rectOf(c);
      const d = lead + i * step;
      const gold = def.rare ? def.rare(c) : false;
      const o = overlay(ctx, r, { zIndex: '8991' });
      const k = c.cloneNode(true);
      // The overlay sits outside the stage, so the chip's stage tokens do not
      // resolve there: carry its computed look across.
      const cs = getComputedStyle(c);
      Object.assign(k.style, {
        margin: '0', width: '100%', height: '100%', boxSizing: 'border-box', outline: 'none',
        background: cs.backgroundColor, color: cs.color, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderRadius: cs.borderRadius, font: cs.font, padding: cs.padding, display: cs.display, alignItems: cs.alignItems, gap: cs.gap,
      });
      if (gold) Object.assign(k.style, { boxShadow: '0 0 0 2px #fbbf24, 0 0 14px 3px rgba(251,191,36,.7)' });
      o.appendChild(k);
      const dx = s.cx - r.cx, dy = s.cy - r.cy;
      anim(ctx, o, [
        { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(.35)` },
        { opacity: 1, transform: `translate(${dx * 0.45}px,${dy * 0.45 - 70}px) scale(1.12)`, offset: 0.5 },
        { opacity: 1, transform: 'translate(0,0) scale(1)' },
      ], { duration: fly, delay: d, easing: 'cubic-bezier(.3,.6,.4,1)' });
      anim(ctx, c, [{ opacity: 0 }, { opacity: 0 }], { duration: d + fly, fill: 'none' });
    });
    return lead + chips.length * step + fly + 400;
  },

  // VICTORY LAP (Snake). A light runs twice round the board, the body lights
  // up square by square, and the apple count stamps in over the board.
  lap(ctx, def) {
    const cv = one(ctx.board, 'canvas');
    if (!cv) return 0;
    const r = rectOf(cv);
    const dot = 16;
    const p = overlay(ctx, { left: r.left - dot / 2, top: r.top - dot / 2, width: dot, height: dot }, {
      borderRadius: '50%', background: '#fff7ed', boxShadow: `0 0 14px 6px ${ctx.acc}`, zIndex: '8992',
    });
    const corners = [[0, 0], [r.width, 0], [r.width, r.height], [0, r.height]];
    const kf = [];
    for (let lap = 0; lap < 2; lap++) corners.forEach(([x, y], i) => kf.push({ transform: `translate(${x}px,${y}px)`, offset: (lap * 4 + i) / 8 }));
    kf.push({ transform: 'translate(0,0)', offset: 1 });
    anim(ctx, p, [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.04 }, { opacity: 1, offset: 0.96 }, { opacity: 0, offset: 1 }], { duration: 1500, delay: 120, fill: 'none' });
    anim(ctx, p, kf, { duration: 1500, delay: 120, easing: 'linear' });
    const rim = overlay(ctx, r, { border: `3px solid ${ctx.acc}`, borderRadius: '6px' });
    anim(ctx, rim, [{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0.4 }], { duration: 700, delay: 1450 });
    // The body, read off the canvas: every square whose centre is not the
    // board's own colour.
    let lit = 0;
    try {
      const m = (cv.getAttribute('aria-label') || '').match(/(\d+) by (\d+)/);
      const n = m ? +m[1] : 15;
      const g = cv.getContext('2d');
      const kx = cv.width / n, ky = cv.height / n;
      const px = (c, q) => { const d = g.getImageData(Math.floor((c + 0.5) * kx), Math.floor((q + 0.5) * ky), 1, 1).data; return [d[0], d[1], d[2]]; };
      const cells = [];
      const seen = new Map();
      for (let q = 0; q < n; q++) for (let c = 0; c < n; c++) { const v = px(c, q); cells.push({ c, q, v }); const key = v.join(','); seen.set(key, (seen.get(key) || 0) + 1); }
      const bg = [...seen.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
      const far = (v) => Math.abs(v[0] - bg[0]) + Math.abs(v[1] - bg[1]) + Math.abs(v[2] - bg[2]) > 70;
      const cw = r.width / n, chh = r.height / n;
      cells.filter((x) => far(x.v)).slice(0, 220).forEach((x, i) => {
        const o = overlay(ctx, { left: r.left + x.c * cw, top: r.top + x.q * chh, width: cw, height: chh }, {
          borderRadius: '30%', background: '#fff7ed', boxShadow: `0 0 10px 2px ${ctx.acc}`,
        });
        anim(ctx, o, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 0.95, transform: 'scale(1.15)', offset: 0.4 }, { opacity: 0, transform: 'scale(1)' }],
          { duration: 520, delay: 1650 + (x.c + x.q) * 28 });
        lit = Math.max(lit, (x.c + x.q) * 28);
      });
    } catch (e) {}
    const m2 = (ctx.board.textContent || '').match(/Apples\s*(\d+)/i);
    const t = 1650 + lit + 420;
    if (m2) {
      const fs = Math.round(Math.min(r.width, r.height) * 0.28);
      const o = overlay(ctx, { left: r.left, top: r.cy - fs * 0.7, width: r.width, height: fs * 1.4 }, {
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: fs + 'px',
        color: ctx.acc, textShadow: '0 4px 24px rgba(0,0,0,.6)', zIndex: '8993',
      });
      o.textContent = m2[1];
      anim(ctx, o, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 420, delay: t, easing: 'cubic-bezier(.3,.7,.4,1.3)' });
    }
    return t + 900;
  },

  // BOX RUN (Chain). The boxes fill in a snaking order, yours in the category
  // colour and the engine's in grey, then the count stamps in.
  boxrun(ctx, def) {
    const boxes = all(ctx.board, def.box).filter(hasText);
    if (boxes.length < 2) return 0;
    const rows = asRows(boxes);
    const order = rows.flatMap((row, i) => (i % 2 ? [...row].reverse() : row));
    const lead = 140, step = Math.max(45, Math.min(140, 2200 / order.length));
    let mine = 0, theirs = 0;
    order.forEach((b, i) => {
      const me = def.mine(b);
      if (me) mine += 1; else theirs += 1;
      const o = overlay(ctx, rectOf(b), { borderRadius: '5px', background: me ? ctx.acc : (isLight(ctx) ? '#9ca3af' : '#4b5563') });
      anim(ctx, o, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 0.9, transform: 'scale(1.18)', offset: 0.5 }, { opacity: 0.6, transform: 'scale(1)' }],
        { duration: 360, delay: lead + i * step, easing: 'cubic-bezier(.3,.7,.4,1.2)' });
    });
    const t = lead + order.length * step + 200;
    const b = rectOf(ctx.board);
    const fs = Math.round(Math.min(b.width, 360) / 6);
    const o = overlay(ctx, { left: b.left, top: b.cy - fs * 0.7, width: b.width, height: fs * 1.4 }, {
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: fs + 'px', color: ctx.ink,
      textShadow: '0 4px 20px rgba(0,0,0,.55)', zIndex: '8993',
    });
    o.textContent = `${mine}–${theirs}`;
    anim(ctx, o, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 420, delay: t, easing: 'cubic-bezier(.3,.7,.4,1.3)' });
    return t + 900;
  },

  // DEVELOP (Focus). The crop pulls back to the whole picture and sharpens,
  // like a print coming up in the tray.
  develop(ctx, def) {
    const view = one(ctx.board, def.view);
    if (!view) return 0;
    const pic = view.querySelector('img') || view.querySelector('canvas');
    if (!pic) return 0;
    anim(ctx, pic, [
      { transform: 'scale(2.4)', filter: 'blur(9px) saturate(.35) sepia(.4)', transformOrigin: '50% 45%' },
      { transform: 'scale(1)', filter: 'blur(2px) saturate(.8) sepia(.15)', transformOrigin: '50% 45%', offset: 0.7 },
      { transform: 'scale(1)', filter: 'blur(0) saturate(1) sepia(0)', transformOrigin: '50% 45%' },
    ], { duration: 1700, delay: 100, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'none' });
    const r = rectOf(view);
    const tray = overlay(ctx, r, { background: `color-mix(in srgb, ${ctx.acc} 45%, transparent)`, borderRadius: getComputedStyle(view).borderRadius });
    anim(ctx, tray, [{ opacity: 1 }, { opacity: 0.6, offset: 0.4 }, { opacity: 0 }], { duration: 1500, delay: 100 });
    const flash = overlay(ctx, r, { background: '#fff', borderRadius: getComputedStyle(view).borderRadius });
    anim(ctx, flash, [{ opacity: 0 }, { opacity: 0.55, offset: 0.25 }, { opacity: 0 }], { duration: 500, delay: 1750 });
    return 2500;
  },

  // TRAVELER (Paths). A light walks the network you built, edge by edge, and
  // each road lights behind it.
  traveler(ctx, def) {
    const lines = all(ctx.board, def.piece);
    if (!lines.length) return 0;
    const pt = (ln, x, y) => {
      const m = ln.getScreenCTM();
      if (!m) return null;
      return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
    };
    const edges = lines.map((ln) => {
      const a = pt(ln, +ln.getAttribute('x1'), +ln.getAttribute('y1'));
      const b = pt(ln, +ln.getAttribute('x2'), +ln.getAttribute('y2'));
      return a && b ? { a, b } : null;
    }).filter(Boolean);
    if (!edges.length) return 0;
    const key = (p) => Math.round(p.x / 4) + ',' + Math.round(p.y / 4);
    const adj = new Map();
    edges.forEach((e, i) => { [e.a, e.b].forEach((p) => { const k = key(p); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); }); });
    const used = new Set();
    const walk = [];
    const start = [...adj.keys()].sort((x, y) => adj.get(x).length - adj.get(y).length || x.localeCompare(y))[0];
    const visit = (k, at) => {
      for (const i of adj.get(k) || []) {
        if (used.has(i)) continue;
        used.add(i);
        const e = edges[i];
        const fwd = key(e.a) === k;
        const from = fwd ? e.a : e.b, to = fwd ? e.b : e.a;
        walk.push({ from, to, fresh: true });
        visit(key(to), to);
        walk.push({ from: to, to: from, fresh: false });
      }
    };
    visit(start);
    while (walk.length && !walk[walk.length - 1].fresh) walk.pop();
    edges.forEach((e, i) => { if (!used.has(i)) walk.push({ from: e.a, to: e.b, fresh: true }); });
    const lens = walk.map((w) => Math.hypot(w.to.x - w.from.x, w.to.y - w.from.y) || 1);
    const total = lens.reduce((s, v) => s + v, 0);
    const dur = Math.max(1200, Math.min(2800, walk.length * 160));
    const lead = 140;
    const wPx = Math.max(5, Math.min(10, rectOf(ctx.board).width / 70));
    let acc = 0;
    walk.forEach((w, i) => {
      const t0 = lead + (acc / total) * dur, t1 = (lens[i] / total) * dur;
      acc += lens[i];
      if (!w.fresh) return;
      const len = lens[i];
      const ang = Math.atan2(w.to.y - w.from.y, w.to.x - w.from.x) * 180 / Math.PI;
      const o = overlay(ctx, { left: w.from.x, top: w.from.y - wPx / 2, width: len, height: wPx }, {
        background: '#fff7d6', borderRadius: wPx + 'px', boxShadow: `0 0 10px 3px ${ctx.acc}`, transformOrigin: '0 50%',
      });
      anim(ctx, o, [{ opacity: 1, transform: `rotate(${ang}deg) scaleX(0)` }, { opacity: 1, transform: `rotate(${ang}deg) scaleX(1)` }],
        { duration: Math.max(40, t1), delay: t0, easing: 'linear' });
      anim(ctx, o, [{ opacity: 0 }, { opacity: 0 }], { duration: t0, fill: 'none' });
    });
    const sz = wPx * 3;
    const dot = overlay(ctx, { left: walk[0].from.x - sz / 2, top: walk[0].from.y - sz / 2, width: sz, height: sz }, {
      borderRadius: '50%', background: '#fde68a', boxShadow: '0 0 16px 6px rgba(253,230,138,.85)', zIndex: '8992',
    });
    const kf = [{ transform: 'translate(0,0)', opacity: 1, offset: 0 }];
    acc = 0;
    walk.forEach((w, i) => { acc += lens[i]; kf.push({ transform: `translate(${w.to.x - walk[0].from.x}px,${w.to.y - walk[0].from.y}px)`, opacity: 1, offset: acc / total }); });
    anim(ctx, dot, kf, { duration: dur, delay: lead, easing: 'linear' });
    anim(ctx, dot, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: lead + dur + 200 });
    return lead + dur + 600;
  },

  // LINE CLEAR (Blocks). The stack is read off the canvas, then row by row from
  // the bottom it flashes white and bursts, and CLEAR floats up.
  lineclear(ctx, def) {
    const cv = one(ctx.board, 'canvas');
    if (!cv) return 0;
    const r = rectOf(cv);
    const rowsN = def.rows || 16;
    const cell = r.height / rowsN;
    const colsN = Math.round(r.width / cell);
    const kx = cv.width / r.width;
    let grid = [];
    let bgc = '';
    try {
      const g = cv.getContext('2d');
      const at = (x, y) => g.getImageData(Math.floor(x * kx), Math.floor(y * kx), 1, 1).data;
      const gap = at(cell - 0.4, cell * 0.5);
      bgc = `rgb(${gap[0]},${gap[1]},${gap[2]})`;
      for (let y = 0; y < rowsN; y++) {
        const row = [];
        for (let x = 0; x < colsN; x++) {
          const d = at((x + 0.5) * cell, (y + 0.5) * cell);
          const far = Math.abs(d[0] - gap[0]) + Math.abs(d[1] - gap[1]) + Math.abs(d[2] - gap[2]) > 50;
          row.push(far ? `rgb(${d[0]},${d[1]},${d[2]})` : null);
        }
        grid.push(row);
      }
    } catch (e) { return 0; }
    const filled = grid.map((row, y) => ({ y, row })).filter((x) => x.row.some(Boolean)).reverse();
    if (!filled.length) return 0;
    const well = overlay(ctx, r, { background: bgc, borderRadius: '12px' });
    anim(ctx, well, [{ opacity: 1 }, { opacity: 1 }], { duration: 10 });
    const lead = 200, step = Math.max(70, Math.min(150, 1600 / filled.length));
    filled.forEach(({ y, row }, i) => {
      const d = lead + i * step;
      row.forEach((c, x) => {
        if (!c) return;
        const o = overlay(ctx, { left: r.left + x * cell, top: r.top + y * cell, width: cell - 1, height: cell - 1 }, { background: c, borderRadius: Math.max(2, cell * 0.16) + 'px' });
        const dx = (x - colsN / 2) * cell * 0.8;
        anim(ctx, o, [
          { opacity: 1, transform: 'translate(0,0) scale(1)', filter: 'brightness(1)' },
          { opacity: 1, transform: 'translate(0,0) scale(1.08)', filter: 'brightness(2.4)', offset: 0.3 },
          { opacity: 0, transform: `translate(${dx}px,${-cell * 2.5}px) scale(.2) rotate(${dx > 0 ? 40 : -40}deg)`, filter: 'brightness(1.5)' },
        ], { duration: 520, delay: d, easing: 'cubic-bezier(.3,.5,.4,1)' });
        anim(ctx, o, [{ opacity: 1 }, { opacity: 1 }], { duration: d, fill: 'none' });
      });
      const bar = overlay(ctx, { left: r.left, top: r.top + y * cell, width: r.width, height: cell }, { background: '#fff', borderRadius: '4px' });
      anim(ctx, bar, [{ opacity: 0, transform: 'scaleY(.3)' }, { opacity: 0.9, transform: 'scaleY(1)', offset: 0.35 }, { opacity: 0, transform: 'scaleY(1.4)' }],
        { duration: 360, delay: d });
    });
    const t = lead + filled.length * step + 300;
    const fs = Math.round(r.width / 4.5);
    const o = overlay(ctx, { left: r.left - 40, top: r.cy - fs, width: r.width + 80, height: fs * 2 }, {
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: fs + 'px', color: ctx.acc,
      letterSpacing: '.04em', textShadow: '0 4px 20px rgba(0,0,0,.5)', zIndex: '8993',
    });
    o.textContent = def.word || 'CLEAR';
    anim(ctx, o, [{ opacity: 0, transform: 'translateY(30px) scale(.7)' }, { opacity: 1, transform: 'translateY(0) scale(1.06)', offset: 0.5 }, { opacity: 1, transform: 'translateY(-14px) scale(1)' }],
      { duration: 700, delay: t, easing: 'cubic-bezier(.3,.7,.4,1)' });
    return t + 1000;
  },

  // BALANCE (Tally). Row by row, then column by column, each line sweeps and
  // its target ticks; then a level ring settles round the board.
  balance(ctx, def) {
    const cells = all(ctx.board, def.cell);
    const tgts = all(ctx.board, def.tgt);
    if (cells.length < 4) return 0;
    const rows = asRows(cells), cols = asCols(cells);
    const lead = 140, per = 45, gap = 150;
    let t = lead;
    const tick = (tg, d) => {
      const q = rectOf(tg);
      const s = Math.min(q.width, q.height) * 0.62;
      const o = overlay(ctx, { left: q.right - s * 0.55, top: q.top - s * 0.45, width: s, height: s }, {
        borderRadius: '50%', background: ctx.acc, color: '#0b0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '800', fontSize: Math.round(s * 0.62) + 'px', zIndex: '8991',
      });
      o.textContent = '✓';
      anim(ctx, o, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.25)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: d });
      bump(ctx, tg, d, 360);
    };
    rows.forEach((row) => {
      row.forEach((el, i) => wash(ctx, el, t + i * per, 320));
      const u = unionRect(row);
      const tg = tgts.filter((q) => { const z = rectOf(q); return Math.abs(z.cy - (u.top + u.height / 2)) < u.height / 2 && z.left >= u.left + u.width - 2; })[0];
      if (tg) tick(tg, t + row.length * per);
      t += row.length * per * 0.5 + gap;
    });
    cols.forEach((col) => {
      col.forEach((el, i) => wash(ctx, el, t + i * per, 320));
      const u = unionRect(col);
      const tg = tgts.filter((q) => { const z = rectOf(q); return Math.abs(z.cx - (u.left + u.width / 2)) < u.width / 2 && z.top >= u.top + u.height - 2; })[0];
      if (tg) tick(tg, t + col.length * per);
      t += col.length * per * 0.5 + gap;
    });
    const ring = overlay(ctx, unionRect(cells, 10), { border: `4px solid ${ctx.acc}`, borderRadius: '14px' });
    anim(ctx, ring, [{ opacity: 0, transform: 'scale(1.12)' }, { opacity: 1, transform: 'scale(.98)', offset: 0.6 }, { opacity: 0.8, transform: 'scale(1)' }], { duration: 480, delay: t + 100 });
    return t + 900;
  },

  // DOT CHAIN (Polka). Every dot checks its pair in a wave across the grid,
  // white dots then black, and the digits lock in.
  dotchain(ctx, def) {
    const svg = one(ctx.board, def.svg);
    const cells = all(ctx.board, def.cell);
    if (!svg || cells.length < 4) return 0;
    const dots = [...svg.querySelectorAll('circle')].filter(visible);
    if (!dots.length) return 0;
    const isWhite = (c) => { const f = getComputedStyle(c).fill; return /255,\s*255,\s*255/.test(f); };
    const b = rectOf(svg);
    const lead = 140;
    const wave = (c) => { const r = rectOf(c); return ((r.cx - b.left) + (r.cy - b.top)) / (b.width + b.height); };
    let last = 0;
    dots.forEach((c) => {
      const r = rectOf(c);
      const d = lead + wave(c) * 1100 + (isWhite(c) ? 0 : 1000);
      const s = r.width * 2.2;
      const o = overlay(ctx, { left: r.cx - s / 2, top: r.cy - s / 2, width: s, height: s }, {
        borderRadius: '50%', border: `2px solid ${ctx.acc}`, boxShadow: `0 0 10px 3px ${ctx.acc}`, zIndex: '8991',
      });
      anim(ctx, o, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.2)', offset: 0.4 }, { opacity: 0.55, transform: 'scale(.9)' }], { duration: 380, delay: d });
      last = Math.max(last, d + 380);
    });
    const lockC = isLight(ctx) ? (getComputedStyle(ctx.root).getPropertyValue('--stg-acc-ink').trim() || ctx.acc) : ctx.acc;
    const rows = asRows(cells);
    rows.forEach((row, r) => row.forEach((el, c) => {
      const d = last + 100 + (r + c) * 35;
      anim(ctx, el, [{ color: getComputedStyle(el).color, transform: 'scale(1)' }, { color: lockC, transform: 'scale(1.12)', offset: 0.5 }, { color: lockC, transform: 'scale(1)' }], { duration: 320, delay: d });
    }));
    return last + 100 + 16 * 35 + 700;
  },

  // TALLY UP (Tuck). Every tile counts itself in with its points, and a meter
  // below climbs past the benchmark.
  tallyup(ctx, def) {
    const grid = one(ctx.board, def.grid);
    const tiles = asRows(all(ctx.board, def.cell).filter(hasText)).flat();
    if (!grid || !tiles.length) return 0;
    const pts = def.points || {};
    const txt = ctx.board.textContent || '';
    const score = +((txt.match(/score\s*(\d+)/i) || [])[1] || 0);
    const bench = +((txt.match(/benchmark\s*(\d+)/i) || [])[1] || 0);
    const lead = 160, step = Math.max(60, Math.min(170, 2200 / tiles.length));
    tiles.forEach((el, i) => {
      const d = lead + i * step;
      ring(ctx, el, d, 320, true);
      const r = rectOf(el);
      const o = overlay(ctx, { left: r.left - 10, top: r.top - 6, width: r.width + 20, height: r.height * 0.6 }, {
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: Math.round(r.height * 0.42) + 'px',
        color: '#fbbf24', textShadow: '0 2px 8px rgba(0,0,0,.6)', zIndex: '8992',
      });
      o.textContent = '+' + (pts[(el.textContent || '').trim().charAt(0).toUpperCase()] || 1);
      anim(ctx, o, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(-8px)', offset: 0.3 }, { opacity: 0, transform: 'translateY(-34px)' }], { duration: 760, delay: d });
    });
    const run = tiles.length * step;
    const g = rectOf(grid);
    const w = g.width * 0.84, h = 12;
    const top = Math.min(g.bottom + 14, window.innerHeight - 40);
    const track = overlay(ctx, { left: g.cx - w / 2, top, width: w, height: h }, { borderRadius: h + 'px', background: isLight(ctx) ? 'rgba(15,23,42,.14)' : 'rgba(255,255,255,.14)', zIndex: '8991' });
    anim(ctx, track, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: lead - 60 });
    const top2 = Math.max(score, bench) * 1.12 || 1;
    const fill = document.createElement('div');
    Object.assign(fill.style, { position: 'absolute', left: '0', top: '0', bottom: '0', width: (100 * score / top2) + '%', borderRadius: h + 'px', background: ctx.acc, transformOrigin: '0 50%' });
    track.appendChild(fill);
    const cross = bench && score >= bench ? Math.min(0.99, bench / score) : null;
    const fk = [{ transform: 'scaleX(0)', backgroundColor: ctx.acc }];
    if (cross) { fk.push({ transform: `scaleX(${cross})`, backgroundColor: ctx.acc, offset: cross }); fk.push({ transform: `scaleX(${Math.min(1, cross + 0.02)})`, backgroundColor: '#fbbf24', offset: Math.min(0.995, cross + 0.02) }); }
    fk.push({ transform: 'scaleX(1)', backgroundColor: cross ? '#fbbf24' : ctx.acc });
    anim(ctx, fill, fk, { duration: run, delay: lead, easing: 'linear' });
    if (bench) {
      const mk = document.createElement('div');
      Object.assign(mk.style, { position: 'absolute', left: `calc(${100 * bench / top2}% - 1.5px)`, top: '-7px', width: '3px', height: h + 14 + 'px', background: ctx.ink, borderRadius: '2px' });
      track.appendChild(mk);
      if (cross) anim(ctx, mk, [{ transform: 'scale(1)' }, { transform: 'scale(1.8)', backgroundColor: '#fbbf24', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 420, delay: lead + run * cross, fill: 'none' });
    }
    return lead + run + 900;
  },

  // HOMING (Ping). Rings close in on the city, the pin drops, and every
  // earlier guess draws its line home.
  homing(ctx, def) {
    const svg = one(ctx.board, def.svg);
    if (!svg) return 0;
    const dots = [...svg.querySelectorAll('circle')].filter(visible);
    if (!dots.length) return 0;
    const target = dots.reduce((a, c) => (+c.getAttribute('r') > +a.getAttribute('r') ? c : a), dots[dots.length - 1]);
    const t = rectOf(target);
    const lead = 140;
    for (let i = 0; i < 3; i++) {
      const s = 260;
      const o = overlay(ctx, { left: t.cx - s / 2, top: t.cy - s / 2, width: s, height: s }, { borderRadius: '50%', border: `3px solid ${ctx.acc}`, zIndex: '8991' });
      anim(ctx, o, [{ opacity: 0, transform: 'scale(1)' }, { opacity: 0.9, transform: 'scale(.8)', offset: 0.15 }, { opacity: 0, transform: 'scale(.04)' }], { duration: 900, delay: lead + i * 260, easing: 'cubic-bezier(.5,0,.7,1)' });
    }
    const pinAt = lead + 1150;
    const pin = overlay(ctx, { left: t.cx - 13, top: t.cy - 30, width: 26, height: 26 }, {
      borderRadius: '50% 50% 50% 0', background: ctx.acc, boxShadow: '0 0 0 3px #fff, 0 6px 14px rgba(0,0,0,.4)', zIndex: '8993',
    });
    anim(ctx, pin, [
      { opacity: 0, transform: 'translateY(-200px) rotate(-45deg)' },
      { opacity: 1, transform: 'translateY(0) rotate(-45deg)', offset: 0.55 },
      { opacity: 1, transform: 'translateY(-14px) rotate(-45deg)', offset: 0.75 },
      { opacity: 1, transform: 'translateY(0) rotate(-45deg)' },
    ], { duration: 520, delay: pinAt, easing: 'cubic-bezier(.5,0,.7,1)' });
    burst(ctx, t.cx, t.cy, 20, '#fff', pinAt + 290, 6, 600);
    let last = pinAt + 600;
    dots.filter((c) => c !== target).forEach((c, i) => {
      const q = rectOf(c);
      const len = Math.hypot(t.cx - q.cx, t.cy - q.cy);
      if (len < 4) return;
      const ang = Math.atan2(t.cy - q.cy, t.cx - q.cx) * 180 / Math.PI;
      const o = overlay(ctx, { left: q.cx, top: q.cy - 1.5, width: len, height: 3 }, { background: ctx.acc, borderRadius: '3px', transformOrigin: '0 50%', zIndex: '8992' });
      const d = pinAt + 600 + i * 160;
      anim(ctx, o, [{ opacity: 0.95, transform: `rotate(${ang}deg) scaleX(0)` }, { opacity: 0.95, transform: `rotate(${ang}deg) scaleX(1)` }], { duration: 480, delay: d, easing: 'cubic-bezier(.3,.6,.4,1)' });
      anim(ctx, o, [{ opacity: 0 }, { opacity: 0 }], { duration: d, fill: 'none' });
      last = Math.max(last, d + 480);
    });
    return last + 600;
  },

  // OVERLAP (Venn). The three circles slide together, every word drops into
  // its region from the outside in, and the middle lights up.
  overlap(ctx, def) {
    const svg = one(ctx.board, def.svg);
    const zones = all(ctx.board, def.zone);
    if (!svg || zones.length < 3) return 0;
    const circles = [...svg.querySelectorAll('circle')];
    const rs = circles.map(rectOf);
    const cx = rs.reduce((s, r) => s + r.cx, 0) / (rs.length || 1);
    const cy = rs.reduce((s, r) => s + r.cy, 0) / (rs.length || 1);
    circles.forEach((c, i) => {
      const r = rs[i];
      const dx = (r.cx - cx) * 0.45, dy = (r.cy - cy) * 0.45;
      anim(ctx, c, [{ transform: `translate(${dx}px,${dy}px)`, opacity: 0.4 }, { transform: 'translate(0,0)', opacity: 1 }], { duration: 700, delay: 100, easing: 'cubic-bezier(.3,.7,.4,1.15)', fill: 'none' });
    });
    const dist = (z) => { const r = rectOf(z); return Math.hypot(r.cx - cx, r.cy - cy); };
    const order = [...zones].sort((a, b) => dist(b) - dist(a));
    let t = 820;
    order.forEach((z) => {
      const ws = [...z.querySelectorAll(def.word)].filter(visible);
      ws.forEach((w, i) => {
        anim(ctx, w, [{ opacity: 0, transform: 'translateY(-16px) scale(.5)' }, { opacity: 1, transform: 'translateY(0) scale(1.15)', offset: 0.6 }, { opacity: 1, transform: 'none' }],
          { duration: 360, delay: t + i * 90, easing: 'cubic-bezier(.3,.7,.4,1.3)', fill: 'backwards' });
      });
      t += Math.max(1, ws.length) * 90 + 120;
    });
    const mid = order[order.length - 1];
    const m = rectOf(mid);
    const s = Math.max(m.width, m.height) * 1.6;
    const glow = overlay(ctx, { left: m.cx - s / 2, top: m.cy - s / 2, width: s, height: s }, {
      borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,.85), ${ctx.acc} 45%, transparent 70%)`,
    });
    anim(ctx, glow, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 0.9, transform: 'scale(1.2)', offset: 0.35 }, { opacity: 0.25, transform: 'scale(1)' }], { duration: 800, delay: t + 80 });
    return t + 1000;
  },

  // ADD UP (Sums). Each run lights in turn, across then down, and its printed
  // total pops when it checks; then the grid takes a frame.
  addup(ctx, def) {
    const cells = all(ctx.board, def.cell);
    const rows = asRows(cells);
    if (rows.length < 3) return 0;
    const black = (el) => el.matches(def.black);
    const runs = [];
    rows.forEach((row) => {
      let run = [];
      row.forEach((el, c) => {
        if (!black(el)) { if (!run.length) run.clue = row[c - 1]; run.push(el); }
        else { if (run.length > 1) runs.push({ cells: run, clue: run.clue && run.clue.querySelector(def.across) }); run = []; }
      });
      if (run.length > 1) runs.push({ cells: run, clue: run.clue && run.clue.querySelector(def.across) });
    });
    const W = Math.max(...rows.map((r) => r.length));
    for (let c = 0; c < W; c++) {
      let run = [];
      const col = rows.map((r) => r[c]).filter(Boolean);
      col.forEach((el, r) => {
        if (!black(el)) { if (!run.length) run.clue = col[r - 1]; run.push(el); }
        else { if (run.length > 1) runs.push({ cells: run, clue: run.clue && run.clue.querySelector(def.down) }); run = []; }
      });
      if (run.length > 1) runs.push({ cells: run, clue: run.clue && run.clue.querySelector(def.down) });
    }
    if (!runs.length) return 0;
    const lead = 140, step = Math.max(90, Math.min(260, 2600 / runs.length)), per = 50;
    runs.forEach((run, i) => {
      const d = lead + i * step;
      run.cells.forEach((el, k) => wash(ctx, el, d + k * per, 380, false, 0.6));
      if (run.clue) anim(ctx, run.clue, [{ transform: 'scale(1)', color: getComputedStyle(run.clue).color }, { transform: 'scale(1.5)', color: ctx.acc, offset: 0.4 }, { transform: 'scale(1)', color: ctx.acc }],
        { duration: 380, delay: d + run.cells.length * per });
    });
    const t = lead + runs.length * step + 200;
    const ring = overlay(ctx, unionRect(cells, 6), { border: `3px solid ${ctx.acc}`, borderRadius: '10px' });
    anim(ctx, ring, [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 400, delay: t });
    return t + 900;
  },

  // CLEAN SWEEP (Check). A shine runs across the cleared board, every one of
  // your pieces hops, and a crown glints where one was made.
  cleansweep(ctx, def) {
    const pieces = all(ctx.board, def.piece);
    const brd = one(ctx.board, def.grid) || ctx.board;
    const b = rectOf(brd);
    const sheen = overlay(ctx, b, { overflow: 'hidden', borderRadius: '6px' });
    const band = document.createElement('div');
    Object.assign(band.style, { position: 'absolute', top: '-50%', left: '0', width: '35%', height: '200%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)', transform: 'translateX(-120%) rotate(18deg)' });
    sheen.appendChild(band);
    anim(ctx, sheen, [{ opacity: 1 }, { opacity: 1 }], { duration: 1000, delay: 100 });
    anim(ctx, band, [{ transform: 'translateX(-120%) rotate(18deg)' }, { transform: `translateX(${b.width * 1.2 / (b.width * 0.35) * 100}%) rotate(18deg)` }], { duration: 900, delay: 120, easing: 'ease-in-out' });
    const order = [...pieces].sort((p, q) => rectOf(q).cy - rectOf(p).cy);
    order.forEach((p, i) => {
      const d = 900 + i * 140;
      anim(ctx, p, [
        { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-16px) scale(1.18)', offset: 0.4 },
        { transform: 'translateY(0) scale(1)', offset: 0.7 }, { transform: 'translateY(-5px) scale(1.05)', offset: 0.85 }, { transform: 'translateY(0) scale(1)' },
      ], { duration: 560, delay: d, easing: 'ease-out', fill: 'none' });
      const r = rectOf(p);
      burst(ctx, r.cx, r.cy, r.width, ctx.acc, d + 220, 2.2, 520, 3);
    });
    const crowns = all(ctx.board, def.crown);
    const t = 900 + order.length * 140 + 300;
    crowns.forEach((c, i) => {
      const r = rectOf(c);
      burst(ctx, r.cx, r.cy, r.width * 1.2, '#fbbf24', t + i * 120, 3.5, 700, 4);
      anim(ctx, c, [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(1.5)', filter: 'brightness(1.8)', offset: 0.4 }, { transform: 'scale(1)', filter: 'brightness(1)' }], { duration: 520, delay: t + i * 120, fill: 'none' });
    });
    pulseBoard(ctx, brd, t + crowns.length * 120 + 200, 600);
    return t + crowns.length * 120 + 900;
  },

  // TRICKS HOME (Finesse). Trick by trick, a card comes in from each hand to
  // the middle of the table and the four sweep home to your pile.
  tricks(ctx, def) {
    const hands = all(ctx.board, def.hand);
    const tbl = one(ctx.board, def.table) || ctx.board;
    if (hands.length < 4) return 0;
    const c = rectOf(tbl);
    const hs = hands.map((h) => ({ h, r: rectOf(h) }));
    const byTop = [...hs].sort((a, b) => a.r.cy - b.r.cy);
    const N = byTop[0], S = byTop[3];
    const mids = byTop.slice(1, 3).sort((a, b) => a.r.cx - b.r.cx);
    const seats = [N, mids[1], S, mids[0]];
    const off = [[0, -26], [30, 0], [0, 26], [-30, 0]];
    const cw = 38, ch = 54;
    const pile = { x: S.r.right + 26, y: S.r.cy };
    const n = def.count || 4;
    const per = 620, lead = 160;
    const back = `repeating-linear-gradient(45deg, ${ctx.acc} 0 6px, ${shade(ctx.acc, 0.25)} 6px 12px)`;
    for (let t = 0; t < n; t++) {
      const t0 = lead + t * per;
      seats.forEach((s, i) => {
        const o = overlay(ctx, { left: c.cx - cw / 2, top: c.cy - ch / 2, width: cw, height: ch }, {
          borderRadius: '5px', background: back, border: '2px solid #fff', boxShadow: '0 3px 8px rgba(0,0,0,.45)', zIndex: String(8991 + t),
        });
        const sx = s.r.cx - c.cx, sy = s.r.cy - c.cy;
        const [mx, my] = off[i];
        const px = pile.x - c.cx + t * 3, py = pile.y - c.cy - t * 3;
        const a = t0 + i * 70;
        anim(ctx, o, [
          { opacity: 0, transform: `translate(${sx}px,${sy}px) scale(.8)`, offset: 0 },
          { opacity: 1, transform: `translate(${mx}px,${my}px) scale(1)`, offset: 0.3 },
          { opacity: 1, transform: `translate(${mx}px,${my}px) scale(1)`, offset: 0.62 },
          { opacity: i === 0 ? 1 : 0, transform: `translate(${px}px,${py}px) scale(.8) rotate(${t * 4}deg)` },
        ], { duration: per + 200 - i * 70, delay: a, easing: 'cubic-bezier(.3,.6,.4,1)' });
        anim(ctx, o, [{ opacity: 0 }, { opacity: 0 }], { duration: a, fill: 'none' });
      });
    }
    const t = lead + n * per + 260;
    burst(ctx, pile.x, pile.y, 40, ctx.acc, t, 3, 600);
    return t + 700;
  },

  // FAMILY TREE (Clade). The branch draws itself down the tree rung by rung
  // and the answer leaf blooms; the guesses that went astray dim.
  tree(ctx, def) {
    const rungs = all(ctx.board, def.rung);
    if (!rungs.length) return 0;
    const lead = 140, step = 300;
    const line = isLight(ctx) ? shade(ctx.acc, 0.2) : ctx.acc;
    rungs.forEach((el, i) => {
      const d = lead + i * step;
      const r = rectOf(el);
      const o = overlay(ctx, r, { borderRadius: getComputedStyle(el).borderRadius || '6px', boxShadow: `inset 0 0 0 2px ${ctx.acc}`, background: `color-mix(in srgb, ${ctx.acc} 22%, transparent)` });
      anim(ctx, o, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: d });
      bump(ctx, el, d, 360);
      const nx = rungs[i + 1];
      if (nx) {
        const q = rectOf(nx);
        const x = Math.min(r.left + 8, q.left - 6);
        const v = overlay(ctx, { left: x - 1.5, top: r.bottom - 2, width: 3, height: Math.max(4, q.cy - r.bottom + 2) }, { background: line, transformOrigin: '50% 0' });
        anim(ctx, v, [{ opacity: 1, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)' }], { duration: 160, delay: d + 140 });
        anim(ctx, v, [{ opacity: 0 }, { opacity: 0 }], { duration: d + 140, fill: 'none' });
        const hw = Math.max(4, q.left - x);
        const hz = overlay(ctx, { left: x, top: q.cy - 1.5, width: hw, height: 3 }, { background: line, transformOrigin: '0 50%' });
        anim(ctx, hz, [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }], { duration: 120, delay: d + 290 });
        anim(ctx, hz, [{ opacity: 0 }, { opacity: 0 }], { duration: d + 290, fill: 'none' });
      }
    });
    const leaf = rungs[rungs.length - 1];
    const t = lead + rungs.length * step;
    const lr = rectOf(leaf);
    anim(ctx, leaf, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 520, delay: t, fill: 'none' });
    burst(ctx, lr.left + 14, lr.cy, 22, ctx.acc, t + 60, 5, 700);
    all(ctx.board, def.row).forEach((row, i) => {
      if (def.hit && def.hit(row)) {
        const o = overlay(ctx, rectOf(row), { borderRadius: '8px', boxShadow: `0 0 0 2px ${ctx.acc}, 0 0 16px 2px ${ctx.acc}` });
        anim(ctx, o, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: t + 300 });
      } else {
        anim(ctx, row, [{ opacity: 1 }, { opacity: 0.4 }], { duration: 400, delay: t + 200 + i * 40 });
      }
    });
    return t + 1100;
  },

  // BEDROCK (Strata). Each word you dug lifts out in the order you found it,
  // then layer lines rise through the empty pit and the bedrock glows.
  bedrock(ctx, def) {
    const words = all(ctx.board, def.word);
    const pit = one(ctx.board, def.pit);
    if (!words.length && !pit) return 0;
    const lead = 140, step = Math.max(90, Math.min(220, 1800 / Math.max(1, words.length)));
    words.forEach((w, i) => {
      const d = lead + i * step;
      anim(ctx, w, [
        { transform: 'translateY(0) scale(1)', backgroundColor: getComputedStyle(w).backgroundColor, color: getComputedStyle(w).color },
        { transform: 'translateY(-10px) scale(1.12)', backgroundColor: '#fbbf24', color: '#1b1b1b', offset: 0.4 },
        { transform: 'translateY(0) scale(1)', backgroundColor: '#fbbf24', color: '#1b1b1b' },
      ], { duration: 460, delay: d });
    });
    let t = lead + words.length * step + 120;
    if (pit) {
      const r = rectOf(pit);
      for (let k = 0; k < 4; k++) {
        const o = overlay(ctx, { left: r.left, top: r.bottom - 3, width: r.width, height: 3 }, { background: ctx.acc, borderRadius: '3px' });
        anim(ctx, o, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 0.9, transform: `translateY(${-r.height * 0.15}px)`, offset: 0.2 }, { opacity: 0, transform: `translateY(${-r.height}px)` }],
          { duration: 900, delay: t + k * 160, easing: 'cubic-bezier(.3,.5,.4,1)' });
      }
      const bed = overlay(ctx, { left: r.left, top: r.bottom - 8, width: r.width, height: 8 }, { background: ctx.acc, borderRadius: '4px', boxShadow: `0 0 18px 5px ${ctx.acc}` });
      anim(ctx, bed, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: t + 700 });
      t += 1100;
    }
    return t + 500;
  },
  // ROAD TRIP (Span). A marker drives the itinerary rail stop by stop, each
  // station lighting as it arrives, and the destination bursts when it lands.
  roadtrip(ctx, def) {
    const dots = all(ctx.board, def.dot).filter((d) => !d.classList.contains('todo'));
    if (dots.length < 2) return 0;
    const pts = dots.map((d) => rectOf(d));
    const lead = 160, leg = Math.max(180, Math.min(340, 1700 / (pts.length - 1)));
    const sz = Math.max(16, Math.min(24, pts[0].width * 0.8));
    const car = overlay(ctx, { left: pts[0].cx - sz / 2, top: pts[0].cy - sz / 2, width: sz, height: sz }, {
      borderRadius: '50%', background: ctx.acc, boxShadow: `0 0 0 4px ${isLight(ctx) ? 'rgba(255,255,255,.9)' : 'rgba(11,15,26,.85)'}, 0 0 18px 4px ${ctx.acc}`, zIndex: '8993',
    });
    const frames = pts.map((p, i) => ({ transform: `translate(${p.cx - pts[0].cx}px, ${p.cy - pts[0].cy}px)`, offset: i / (pts.length - 1) }));
    anim(ctx, car, [{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: lead - 120 });
    anim(ctx, car, frames, { duration: leg * (pts.length - 1), delay: lead, easing: 'linear' });
    const trail = overlay(ctx, { left: pts[0].cx - 3, top: pts[0].cy, width: 6, height: pts[pts.length - 1].cy - pts[0].cy }, { background: ctx.acc, borderRadius: '3px', transformOrigin: 'top', zIndex: '8991' });
    anim(ctx, trail, [{ opacity: 0.9, transform: 'scaleY(0)' }, { opacity: 0.9, transform: 'scaleY(1)' }], { duration: leg * (pts.length - 1), delay: lead, easing: 'linear', fill: 'both' });
    dots.forEach((d, i) => {
      const t = lead + i * leg;
      bump(ctx, d, t, 380);
      halo(ctx, pts[i], t, i === dots.length - 1 ? 2.4 : 1.6);
      const row = d.closest(def.row || '.sp-st, .sp-dest');
      const nm = row && one(row, def.name || '.sp-nm');
      if (nm) anim(ctx, nm, [{ transform: 'translateX(0)', color: '' }, { transform: 'translateX(6px)', offset: 0.4 }, { transform: 'translateX(0)' }], { duration: 420, delay: t, fill: 'none', easing: 'ease-out' });
    });
    const end = lead + (dots.length - 1) * leg;
    halo(ctx, pts[pts.length - 1], end + 60, 6);
    return end + 900;
  },

  // DIAL IN (Circa). The guesses light top down as the search narrows, then
  // the winning year rolls through the guessed years and locks on the answer.
  dialin(ctx, def) {
    const rows = all(ctx.board, def.row);
    if (!rows.length) return 0;
    const lead = 140, step = Math.max(110, Math.min(220, 900 / rows.length));
    rows.forEach((r, i) => bump(ctx, r, lead + i * step, 360));
    const win = rows[rows.length - 1];
    const yr = one(win, def.year);
    const t0 = lead + rows.length * step + 120;
    if (yr) {
      const target = parseInt((yr.textContent || '').trim(), 10);
      const first = parseInt((one(rows[0], def.year) || {}).textContent || '', 10);
      if (Number.isFinite(target)) {
        const from = Number.isFinite(first) && first !== target ? first : target - 60;
        const cs = getComputedStyle(yr);
        const r = rectOf(yr);
        const host = overlay(ctx, { left: r.left - 6, top: r.top - 2, width: r.width + 12, height: r.height + 4 }, {
          background: solidBg(win),
          color: cs.color, fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: '800', letterSpacing: cs.letterSpacing,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '8992', fontVariantNumeric: 'tabular-nums', borderRadius: '6px',
        });
        const N = 16, dur = 900;
        host.textContent = String(from);
        for (let k = 1; k <= N; k++) {
          const e = 1 - Math.pow(1 - k / N, 3);
          ctx.timers.push(setTimeout(() => { host.textContent = String(Math.round(from + (target - from) * e)); }, t0 + (k / N) * dur));
        }
        host.style.opacity = '0';
        anim(ctx, host, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: dur + 700, delay: t0 - 60, easing: 'linear' });
        const wr = rectOf(win);
        const glow = overlay(ctx, wr, { borderRadius: getComputedStyle(win).borderRadius, boxShadow: `inset 0 0 0 2px ${ctx.acc}, 0 0 22px ${ctx.acc}` });
        anim(ctx, glow, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.7 }], { duration: 600, delay: t0 + dur });
        halo(ctx, r, t0 + dur, 2.6);
        halo(ctx, r, t0 + dur + 40, 6);
        bump(ctx, win, t0 + dur, 460);
        return t0 + dur + 900;
      }
    }
    return t0 + 600;
  },

  // DECLASSIFIED (Redact). Every word the reader uncovered is inked over
  // again, then the bars peel away in reading order.
  declassify(ctx, def) {
    const words = all(ctx.board, def.word).filter(visible);
    const head = def.head ? all(ctx.board, def.head).filter(visible) : [];
    if (words.length + head.length < 3) return 0;
    const ink = def.ink || getComputedStyle(one(ctx.board, def.paper) || ctx.board).color;
    const order = words.map((el) => ({ el, r: rectOf(el) }));
    const lead = 220, step = Math.max(14, Math.min(60, 1500 / order.length));
    order.forEach(({ el, r }, i) => {
      const rr = el.getClientRects && el.getClientRects()[0];
      const q = rr ? { left: rr.left, top: rr.top, width: rr.width, height: rr.height } : r;
      const bar = overlay(ctx, { left: q.left - 1, top: q.top + q.height * 0.12, width: q.width + 2, height: q.height * 0.76 }, { background: ink, borderRadius: '2px', transformOrigin: 'right center', opacity: '1' });
      anim(ctx, bar, [{ opacity: 1, transform: 'scaleX(1)' }, { opacity: 1, transform: 'scaleX(0)' }], { duration: 260, delay: lead + i * step, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'both' });
    });
    // The headline is the win, so it is the last thing uncovered, alone.
    const hAt = lead + order.length * step + 320;
    head.forEach((el, i) => {
      const q = rectOf(el);
      const bar = overlay(ctx, { left: q.left - 2, top: q.top + q.height * 0.1, width: q.width + 4, height: q.height * 0.8 }, { background: ink, borderRadius: '3px', transformOrigin: 'right center', opacity: '1' });
      anim(ctx, bar, [{ opacity: 1, transform: 'scaleX(1)' }, { opacity: 1, transform: 'scaleX(0)' }], { duration: 420, delay: hAt + i * 260, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'both' });
      halo(ctx, q, hAt + i * 260 + 380, 1.6);
    });
    const end = head.length ? hAt + head.length * 260 + 420 : lead + order.length * step + 260;
    const paper = one(ctx.board, def.paper);
    if (paper) {
      const u = rectOf(paper);
      const w = overlay(ctx, u, { background: `linear-gradient(90deg, transparent, ${ctx.acc}, transparent)`, mixBlendMode: isLight(ctx) ? 'multiply' : 'screen' });
      anim(ctx, w, [{ opacity: 0, transform: 'translateX(-30%)' }, { opacity: 0.35, offset: 0.5 }, { opacity: 0, transform: 'translateX(30%)' }], { duration: 700, delay: end });
    }
    return end + 800;
  },

  // NEEDLE (Thread). A needle runs the thread knot to knot, each named film
  // lighting as it passes, and the thread ties off at the last knot.
  needle(ctx, def) {
    const svg = one(ctx.board, def.svg);
    const path = svg && one(svg, 'path');
    if (!path || !path.getTotalLength) return 0;
    const L = path.getTotalLength();
    if (!(L > 10)) return 0;
    const sr = rectOf(svg);
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const sx = vb && vb.width ? sr.width / vb.width : 1, sy = vb && vb.height ? sr.height / vb.height : 1;
    const S = 40;
    const samp = [];
    for (let k = 0; k <= S; k++) { const p = path.getPointAtLength((L * k) / S); samp.push({ x: sr.left + p.x * sx, y: sr.top + p.y * sy }); }
    const lead = 160, dur = Math.max(1200, Math.min(2200, L * 2.2));
    const NS = 'http://www.w3.org/2000/svg';
    const host = overlay(ctx, sr, { zIndex: '8991', overflow: 'visible' });
    host.style.opacity = '1';
    const sv = document.createElementNS(NS, 'svg');
    sv.setAttribute('viewBox', svg.getAttribute('viewBox') || `0 0 ${sr.width} ${sr.height}`);
    sv.setAttribute('width', '100%'); sv.setAttribute('height', '100%');
    sv.style.overflow = 'visible';
    const p2 = document.createElementNS(NS, 'path');
    p2.setAttribute('d', path.getAttribute('d'));
    p2.setAttribute('fill', 'none'); p2.setAttribute('stroke', isLight(ctx) ? ctx.acc : '#ffffff');
    p2.setAttribute('stroke-width', '4'); p2.setAttribute('stroke-linecap', 'round');
    p2.setAttribute('pathLength', '1'); p2.setAttribute('stroke-dasharray', '1 1'); p2.setAttribute('stroke-dashoffset', '1');
    p2.style.filter = `drop-shadow(0 0 4px ${ctx.acc})`;
    sv.appendChild(p2); host.appendChild(sv);
    anim(ctx, p2, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: dur, delay: lead, easing: 'linear' });
    const nd = overlay(ctx, { left: samp[0].x - 7, top: samp[0].y - 7, width: 14, height: 14 }, { borderRadius: '50%', background: '#ffffff', boxShadow: `0 0 0 3px ${ctx.acc}, 0 0 16px 4px ${ctx.acc}`, zIndex: '8993' });
    anim(ctx, nd, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: lead - 100 });
    anim(ctx, nd, samp.map((p, k) => ({ transform: `translate(${p.x - samp[0].x}px, ${p.y - samp[0].y}px)`, offset: k / S })), { duration: dur, delay: lead, easing: 'linear' });
    const knots = all(ctx.board, def.knot);
    knots.forEach((kn) => {
      const r = rectOf(kn);
      let best = 0, bd = Infinity;
      samp.forEach((p, k) => { const d = (p.x - r.cx) ** 2 + (p.y - r.cy) ** 2; if (d < bd) { bd = d; best = k; } });
      const t = lead + (best / S) * dur;
      halo(ctx, r, t, 1.8);
      const tile = kn.closest(def.tile);
      if (tile) {
        bump(ctx, tile, t, 420);
        const f = overlay(ctx, rectOf(tile), { borderRadius: getComputedStyle(tile).borderRadius, boxShadow: `inset 0 0 0 2px ${ctx.acc}, 0 0 20px ${ctx.acc}` });
        anim(ctx, f, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.55 }], { duration: 520, delay: t });
      }
    });
    const tail = samp[S];
    halo(ctx, { left: tail.x - 10, top: tail.y - 10, width: 20, height: 20, cx: tail.x, cy: tail.y }, lead + dur + 40, 6);
    return lead + dur + 900;
  },

  // BORDERS (Flank). A pulse runs out along every border to each neighbor you
  // named, the neighbor lights, then the country at the centre glows.
  borders(ctx, def) {
    const core = one(ctx.board, def.core);
    const slots = all(ctx.board, def.slot);
    if (!core || !slots.length) return 0;
    const c = rectOf(core);
    const lead = 160, step = Math.max(110, Math.min(220, 1400 / slots.length)), run = 340;
    slots.forEach((s, i) => {
      const r = rectOf(s);
      const t = lead + i * step;
      const dot = overlay(ctx, { left: c.cx - 6, top: c.cy - 6, width: 12, height: 12 }, { borderRadius: '50%', background: ctx.acc, boxShadow: `0 0 12px 3px ${ctx.acc}`, zIndex: '8993' });
      anim(ctx, dot, [
        { opacity: 1, transform: 'translate(0,0) scale(.6)' },
        { opacity: 1, transform: `translate(${r.cx - c.cx}px, ${r.cy - c.cy}px) scale(1)`, offset: 0.9 },
        { opacity: 0, transform: `translate(${r.cx - c.cx}px, ${r.cy - c.cy}px) scale(1.6)` },
      ], { duration: run, delay: t, easing: 'cubic-bezier(.4,0,.6,1)' });
      const f = overlay(ctx, r, { borderRadius: getComputedStyle(s).borderRadius, background: ctx.acc });
      anim(ctx, f, [{ opacity: 0 }, { opacity: 0.55, offset: 0.35 }, { opacity: 0.28 }], { duration: 520, delay: t + run * 0.85 });
      bump(ctx, s, t + run * 0.85, 400);
    });
    const end = lead + (slots.length - 1) * step + run;
    halo(ctx, c, end + 60, 2.2);
    halo(ctx, c, end + 260, 2.8);
    bump(ctx, core, end + 60, 520);
    const g = overlay(ctx, c, { borderRadius: '50%', boxShadow: `0 0 0 4px ${ctx.acc}, 0 0 40px 12px ${ctx.acc}` });
    anim(ctx, g, [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0.6 }], { duration: 700, delay: end + 60 });
    return end + 1000;
  },
};

// ---------------------------------------------------------------- the beat
// Plays the game's beat over the board and resolves when it is time for the
// verdict. `within` caps the beat (an End Game hold has its own clock).
export function playBeat(key, { within = null, force = false, finale: wantFinale = false, finaleOnly = false } = {}) {
  const ctx = { anims: [], timers: [], nodes: [] };
  const handle = {
    ms: 0,
    cancel() {
      ctx.timers.forEach((t) => clearTimeout(t));
      if (ctx.stopSpin) ctx.stopSpin();
      if (ctx.stopFollow) ctx.stopFollow();
      ctx.anims.forEach((a) => { try { a.cancel(); } catch (e) {} const i = LIVE.indexOf(a); if (i >= 0) LIVE.splice(i, 1); });
      ctx.nodes.forEach((n) => { try { n.remove(); } catch (e) {} });
      ctx.anims = []; ctx.timers = []; ctx.nodes = [];
    },
  };
  if (typeof document === 'undefined') return handle;
  if (reduced() && !force) { handle.ms = BEAT_REDUCED; return handle; }
  followScroll(ctx);
  const base = BEATS[key] || null;
  const root = stageRoot();
  ctx.root = root;
  // A def may carry a separate beat for a WIN, picked by looking at the board
  // (Four plays its losing beat and its winning one inside the same end hold).
  let def = base;
  try {
    if (base && base.win && base.isWin) {
      const b0 = boardOf(root, base);
      if (b0 && base.isWin(b0)) def = { ...base, ...base.win };
    }
  } catch (e) { def = base; }
  ctx.acc = accentOf(root);
  ctx.ink = inkOf(root);
  ctx.board = boardOf(root, def);
  // A client with no .stg-board: the page column (`<xx>-wrap`) stands in, for
  // the finale only.
  if (!ctx.board && wantFinale) ctx.board = one(root, '[class$="-wrap"]');
  ctx.util = { listRows, all, one, wordRuns };
  let ms = 0;
  handle.kind = 'plain';
  try {
    // THE SIMPLE ENDING (owner, 2026-10-05: "just a simpler animation", after
    // the lock-and-burst stuttered on phones). When the curtain follows, the
    // game's own beat is skipped and the finale alone plays: ONE element, moved
    // only by transform, so it runs on the graphics chip and stays smooth while
    // the verdict's reads load. Inside a circuit run (no curtain) the game's own
    // beat plays as before.
    if (wantFinale && ctx.board && within == null) {
      // A game with a last beat of its own plays it first, and the iris opens
      // as it ends (owner, 2026-10-10).
      let start = finaleOnly ? 0 : FINALE_LEAD;
      let lastKind = '';
      if (!finaleOnly && def && def.last && KINDS[def.kind]) {
        const m = KINDS[def.kind](ctx, def) || 0;
        if (m) { start = m; lastKind = def.kind + '+'; }
      }
      ms = finale(ctx, start);
      handle.finale = true;
      handle.kind = lastKind + 'iris';
    } else if (def && ctx.board && KINDS[def.kind]) {
      ms = KINDS[def.kind](ctx, def) || 0;
      if (ms) handle.kind = def.kind;
    }
    handle.count = ctx.anims.length;
  } catch (e) { handle.cancel(); ms = 0; ctx.hold = null; handle.error = String(e && e.message || e); }
  if (!ms) {
    if (ctx.board) pulseBoard(ctx, ctx.board, 200, 700);
    ms = BEAT_PLAIN;
  }
  if (within != null) ms = Math.min(ms, within);
  handle.ms = ms;
  // The last beat played, for review on a live page.
  try { window.__sotLastBeat = { key, kind: handle.kind, ms, finale: !!handle.finale, pieces: handle.pieces || 0, error: handle.error || null, want: !!wantFinale }; } catch (e) {}
  // A beat that holds (the sudokus' lock and burst) waits for release().
  if (ctx.hold) {
    handle.hold = true;
    handle.release = (onCovered) => { try { ctx.hold.release(onCovered); } catch (e) { if (onCovered) onCovered(); } };
    handle.setProgress = (p) => { try { if (ctx.hold.setProgress) ctx.hold.setProgress(p); } catch (e) {} };
  }
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
      ctx.anims.forEach((a) => { try { a.cancel(); } catch (e) {} const i = LIVE.indexOf(a); if (i >= 0) LIVE.splice(i, 1); });
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
    const h = playBeat(key, { force: true, finale: true });
    // A held beat (the sudokus) orbits for a second and a half, then bursts.
    if (h.hold) setTimeout(() => h.release(() => setTimeout(() => h.cancel(), 900)), h.ms + 2500);
    else setTimeout(() => h.cancel(), h.ms + 1200);
    return { ms: h.ms, kind: h.kind, anims: h.count || 0, pieces: h.pieces || 0, error: h.error || null };
  };
  window.__sotLoss = (key) => {
    const h = playLoss(key);
    setTimeout(() => h.cancel(), h.ms + 1500);
    return { ms: h.ms, kind: h.kind };
  };
}
