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
    const b = ctx.board.getBoundingClientRect();
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
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}
function unionRect(els, pad = 0) {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  els.forEach((el) => { const q = el.getBoundingClientRect(); l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); });
  return { left: l - pad, top: t - pad, width: r - l + pad * 2, height: b - t + pad * 2 };
}
// Where the player finished: their last tap on the board, else its centre.
function originPoint(ctx) {
  const b = ctx.board.getBoundingClientRect();
  if (lastTap && Date.now() - lastTap.t < 20000
    && lastTap.x >= b.left && lastTap.x <= b.right && lastTap.y >= b.top && lastTap.y <= b.bottom) {
    return { x: lastTap.x, y: lastTap.y };
  }
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
}
// A ring that opens out from a point and fades: the drop, the spark.
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
    const bw = ctx.board.getBoundingClientRect().width || size * 9;
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
      const r = el.getBoundingClientRect();
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
      const r = el.getBoundingClientRect();
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
      ctx.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
      ctx.nodes.forEach((n) => { try { n.remove(); } catch (e) {} });
      ctx.anims = []; ctx.timers = []; ctx.nodes = [];
    },
  };
  if (typeof document === 'undefined') return handle;
  if (reduced() && !force) { handle.ms = BEAT_REDUCED; return handle; }
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
