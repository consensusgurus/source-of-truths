'use client';

// THE TILE FLOOD (owner, 2026-10-25): tapping a puzzle tile on the phone home
// floods the screen from that tile in the colour the game's start page opens
// on, then loads the page, so the colour carries straight through to the
// start gate. The colour follows the stage look: the game's soft colour in
// Color, white in White and color or White and black, near-black in Black and
// white. A modified click, a desktop, or reduced motion just follows the link.
// THE DESKTOP FLOODS TOO (owner, 2026-10-25): a caller passes { desk: true }
// and the width gate is skipped, so the desktop home runs the same motion.

import { flushSync } from 'react-dom';
import { readLook, isDarkLook } from './stage-look';
import { softGround } from './category-ramp';
import { holdRootPaint } from './root-paint';
import { holdThemeColor } from './theme-color-hold';

// THE WHOLE SCREEN (owner, 2026-10-25): a flood fills the header, the footer
// and the browser's own bars too. The fixed layer alone cannot reach the
// scrollbar gutter, an iPhone's status bar or the strip under Safari's toolbar,
// so for as long as the colour is up the root is painted with it (root-paint)
// and the theme-color meta, which tints the browser's bars, takes it as well.
function paintBars(color) {
  // Both are stacks shared with the play stages (root-paint, theme-color-hold),
  // so whatever the page underneath holds takes over the moment this lets go.
  const a = holdRootPaint(color);
  const b = holdThemeColor(color);
  let off = false;
  return () => { if (off) return; off = true; a(); b(); };
}

export function floodColor(hex) {
  const l = readLook();
  if (isDarkLook(l)) return '#0b0f1a';
  if (l === 'plain' || l === 'tint') return '#ffffff';
  return softGround(hex);
}

let bound = false;
function clearOnReturn() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  // Coming back with the Back button can restore this page from the cache with
  // the flood still on top; take it off.
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.sot-flood').forEach((n) => n.remove());
  });
}


// THE TILE OPENS (owner, 2026-10-25, "cleaner"): the colour starts as the tile
// itself, its own corners and all, and opens out to the edges of the screen,
// rather than a circle that already spills past the tile on its first frame.
function tileClip(el, r, top) {
  let rad = 12;
  try { rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0; } catch (e) {}
  const w = window.innerWidth;
  const h = window.innerHeight - top;
  const t = Math.max(0, r.top - top);
  const b = Math.max(0, h - (r.bottom - top));
  const l = Math.max(0, r.left);
  const rr = Math.max(0, w - r.right);
  return [`inset(${t}px ${rr}px ${b}px ${l}px round ${rad}px)`, 'inset(0px 0px 0px 0px round 0px)'];
}

export function floodNav(e, href, hex, opts) { floodTo(e, href, floodColor(hex), opts); }

// THE SOAK (owner, 2026-10-25): leaving a game for the home runs the flood the
// other way, the home's own ground spreading from the button and soaking the
// game's colour out, so the two directions read as one motion.
export function soakNav(e, href) {
  floodTo(e, href, isDarkLook(readLook()) ? '#0b0f1a' : '#f4f6f9');
}

function floodTo(e, href, color, opts) {
  if (typeof window === 'undefined') return;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (!(opts && opts.desk) && !window.matchMedia('(max-width: 899px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  e.preventDefault();
  clearOnReturn();
  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const reach = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 4;
  const d = document.createElement('div');
  d.className = 'sot-flood';
  d.setAttribute('aria-hidden', 'true');
  d.style.cssText = `position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:${color};clip-path:${tileClip(e.currentTarget, r, 0)[0]};`;
  document.body.appendChild(d);
  let painted = false;
  let went = false;
  // THE LANDING (owner, 2026-10-25): the next page opens under the same colour
  // and fades it off (app/layout.js boot script, html[data-sot-land] in
  // globals.css), so its header and board come up through the colour instead
  // of popping in when the new document paints.
  const go = () => {
    if (went) return; went = true;
    if (!painted) { painted = true; paintBars(color); }
    try {
      const u = new URL(href, window.location.href);
      window.sessionStorage.setItem('sot_land', JSON.stringify({ c: color, p: u.pathname.replace(/\/+$/, '') || '/', t: Date.now() }));
    } catch (er) {}
    window.location.href = href;
  };
  try {
    const a = d.animate(
      tileClip(e.currentTarget, r, 0).map((c) => ({ clipPath: c })),
      { duration: 420, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' },
    );
    a.onfinish = go;
    setTimeout(go, 700);
  } catch (err) { go(); }
}

// THE CATEGORY SEEP (owner, 2026-10-25, replacing the full-screen flood):
// tapping a category or skill tile commits the new pane AT ONCE, so its tiles
// and outlines show up straight away, and the pane's colour then seeps out
// from the tile that was tapped, BEHIND the tiles, until it fills the page.
// The page keeps its old ground under the seep (data-sot-seep on the stage
// root, rules below) and the seep itself is the root's own ::before, painted
// under every child (the root is isolated). Same gates as the game flood: a
// desktop without { desk: true }, or reduced motion, just switches the pane.
const SEEP_CSS = `
.stage-page[data-sot-seep]{--stg-ground:var(--sot-seep0) !important;--stg-raise:var(--sot-seep0) !important;background:var(--sot-seep0) !important;isolation:isolate;}
.stage-page[data-sot-seep]::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:var(--sot-seep1);
  clip-path:circle(var(--sot-sr0) at var(--sot-sx) var(--sot-sy));animation:sotSeep var(--sot-sd) cubic-bezier(.45,0,.3,1) forwards;}
@keyframes sotSeep{to{clip-path:circle(var(--sot-sr) at var(--sot-sx) var(--sot-sy));}}
`;
function seepStyle() {
  if (document.getElementById('sot-seep-css')) return;
  const st = document.createElement('style');
  st.id = 'sot-seep-css';
  st.textContent = SEEP_CSS;
  document.head.appendChild(st);
}
function plainColor(c) {
  const m = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(c || '');
  if (!m) return c;
  return '#' + [m[1], m[2], m[3]].map((v) => Math.round(Math.min(1, Math.max(0, +v)) * 255).toString(16).padStart(2, '0')).join('');
}
let seepT = 0;
export function floodIn(e, then, opts) {
  if (typeof window === 'undefined') { then(); return; }
  const el = e && e.currentTarget;
  const plain = !el || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    || (!(opts && opts.desk) && !window.matchMedia('(max-width: 899px)').matches)
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = el && el.closest ? el.closest('.stage-page') : null;
  if (plain || !root) { then(); return; }
  let color = plainColor((opts && opts.color) || '');
  if (!color) { try { color = plainColor(getComputedStyle(el).backgroundColor); } catch (er) {} }
  if (!color || color === 'transparent' || /rgba\(.*,\s*0\)$/.test(color)) { then(); return; }
  let from = '';
  try { from = getComputedStyle(root).backgroundColor; } catch (er) {}
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  // THE NAME TRAVELS (owner, 2026-10-25): the tile's label lifts off and lands
  // on the header's title once the pane is up.
  let fly = null;
  let fromR = null;
  try {
    const lab = opts && opts.label ? el.querySelector(opts.label) : null;
    if (lab) {
      fromR = lab.getBoundingClientRect();
      const cs = getComputedStyle(lab);
      fly = document.createElement('div');
      fly.className = 'sot-flood';
      fly.setAttribute('aria-hidden', 'true');
      fly.textContent = lab.textContent;
      fly.style.cssText = `position:fixed;left:${fromR.left}px;top:${fromR.top}px;z-index:2147483001;pointer-events:none;white-space:nowrap;margin:0;transform-origin:0 0;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};color:${cs.color};`;
      document.body.appendChild(fly);
    }
  } catch (er) { fly = null; }
  // The new pane goes in first, so its tiles are on screen before any colour moves.
  try { flushSync(() => { then(); }); } catch (er) { try { then(); } catch (er2) {} }
  let sy = y;
  try {
    if (opts && opts.toTop) { const before = window.scrollY; window.scrollTo(0, 0); sy = y + before; }
  } catch (er) {}
  if (fly) {
    const f0 = fly;
    let tgt = null;
    try { tgt = opts && opts.target ? document.querySelector(opts.target) : null; } catch (er) {}
    const kill = () => { try { f0.remove(); } catch (er) {} if (tgt) tgt.style.opacity = ''; };
    if (!tgt || !fromR) { kill(); } else {
      const tr = tgt.getBoundingClientRect();
      const tcs = getComputedStyle(tgt);
      const k = parseFloat(tcs.fontSize) / Math.max(1, parseFloat(getComputedStyle(f0).fontSize));
      tgt.style.opacity = '0';
      try {
        const a3 = f0.animate(
          [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${tr.left - fromR.left}px,${tr.top - fromR.top}px) scale(${k})`, color: tcs.color }],
          { duration: 320, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' },
        );
        a3.onfinish = kill;
      } catch (er) { kill(); }
      setTimeout(kill, 700);
    }
  }
  if (!from || from === color) return;
  seepStyle();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cy = Math.min(Math.max(sy, 0), h);
  const reach = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(cy, h - cy))) + 4;
  const dur = 650;
  const id = ++seepT;
  root.removeAttribute('data-sot-seep');
  void root.offsetWidth;
  root.style.setProperty('--sot-seep0', from);
  root.style.setProperty('--sot-seep1', color);
  root.style.setProperty('--sot-sx', x + 'px');
  root.style.setProperty('--sot-sy', cy + 'px');
  root.style.setProperty('--sot-sr0', Math.round(Math.min(r.width, r.height) / 2) + 'px');
  root.style.setProperty('--sot-sr', reach + 'px');
  root.style.setProperty('--sot-sd', dur + 'ms');
  root.setAttribute('data-sot-seep', '');
  // Timers, not animation frames: the old ground must never be left in place.
  setTimeout(() => {
    if (id !== seepT) return;
    root.removeAttribute('data-sot-seep');
    ['--sot-seep0', '--sot-seep1', '--sot-sx', '--sot-sy', '--sot-sr0', '--sot-sr', '--sot-sd'].forEach((k) => root.style.removeProperty(k));
  }, dur + 40);
}
