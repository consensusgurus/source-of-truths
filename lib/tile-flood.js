'use client';

// THE TILE FLOOD (owner, 2026-10-25): tapping a puzzle tile on the phone home
// floods the screen from that tile in the colour the game's start page opens
// on, then loads the page, so the colour carries straight through to the
// start gate. The colour follows the stage look: the game's soft colour in
// Color, white in White and color or White and black, near-black in Black and
// white. A modified click, a desktop, or reduced motion just follows the link.

import { flushSync } from 'react-dom';
import { readLook, isDarkLook } from './stage-look';
import { softGround } from './category-ramp';
import { holdRootPaint } from './root-paint';

// THE WHOLE SCREEN (owner, 2026-10-25): a flood fills the header, the footer
// and the browser's own bars too. The fixed layer alone cannot reach the
// scrollbar gutter, an iPhone's status bar or the strip under Safari's toolbar,
// so for as long as the colour is up the root is painted with it (root-paint)
// and the theme-color meta, which tints the browser's bars, takes it as well.
function paintBars(color) {
  const release = holdRootPaint(color);
  const metas = typeof document === 'undefined' ? [] : [...document.querySelectorAll('meta[name="theme-color"]')];
  const was = metas.map((m) => m.getAttribute('content'));
  let added = null;
  try {
    if (metas.length) metas.forEach((m) => m.setAttribute('content', color));
    else { added = document.createElement('meta'); added.name = 'theme-color'; added.content = color; document.head.appendChild(added); }
  } catch (e) {}
  let off = false;
  return () => {
    if (off) return; off = true;
    release();
    try { metas.forEach((m, i) => { if (was[i] == null) m.removeAttribute('content'); else m.setAttribute('content', was[i]); }); if (added) added.remove(); } catch (e) {}
  };
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

export function floodNav(e, href, hex) { floodTo(e, href, floodColor(hex)); }

// THE SOAK (owner, 2026-10-25): leaving a game for the home runs the flood the
// other way, the home's own ground spreading from the button and soaking the
// game's colour out, so the two directions read as one motion.
export function soakNav(e, href) {
  floodTo(e, href, isDarkLook(readLook()) ? '#0b0f1a' : '#f4f6f9');
}

function floodTo(e, href, color) {
  if (typeof window === 'undefined') return;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (!window.matchMedia('(max-width: 899px)').matches) return;
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

// THE CATEGORY FLOOD (owner, 2026-10-25): tapping a category or skill tile on
// the phone home floods the screen from that tile in the tile's own colour,
// swaps the pane in underneath at full cover, then fades the colour away so the
// pane appears through it. Same gates as the game flood: a desktop or reduced
// motion just switches the pane.
export function floodIn(e, then, opts) {
  if (typeof window === 'undefined') { then(); return; }
  const el = e && e.currentTarget;
  const plain = !el || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    || !window.matchMedia('(max-width: 899px)').matches
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (plain) { then(); return; }
  let color = '';
  try { color = getComputedStyle(el).backgroundColor; } catch (er) {}
  if (!color || color === 'transparent' || /rgba\(.*,\s*0\)$/.test(color)) { then(); return; }
  // The flood fills the whole screen, header and footer included (owner,
  // 2026-10-25, replacing the first version that stopped under the header).
  const top = 0;
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2 - top;
  const w = window.innerWidth;
  const h = window.innerHeight - top;
  const reach = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 4;
  const d = document.createElement('div');
  d.className = 'sot-flood';
  d.setAttribute('aria-hidden', 'true');
  d.style.cssText = `position:fixed;left:0;right:0;bottom:0;top:${top}px;z-index:2147483000;pointer-events:none;background:${color};clip-path:${tileClip(el, r, top)[0]};`;
  document.body.appendChild(d);
  // THE NAME TRAVELS (owner, 2026-10-25): the tile's label lifts off with the
  // flood and lands on the header's title once the pane is up.
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
  const land = () => {
    if (!fly) return;
    const f0 = fly;
    fly = null;
    let tgt = null;
    try { tgt = opts && opts.target ? document.querySelector(opts.target) : null; } catch (er) {}
    const kill = () => { try { f0.remove(); } catch (er) {} if (tgt) tgt.style.opacity = ''; };
    if (!tgt || !fromR) {
      try { const a2 = f0.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }); a2.onfinish = kill; } catch (er) { kill(); }
      setTimeout(kill, 400);
      return;
    }
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
  };
  let swapped = false;
  let unpaint = null;
  const done = () => { try { d.remove(); } catch (er) {} if (unpaint) { unpaint(); unpaint = null; } };
  const swap = () => {
    if (swapped) return; swapped = true;
    // Covered: the bars and the root take the colour until the fade is done.
    unpaint = paintBars(color);
    // The pane is committed BEFORE anything moves (flushSync), and the page is
    // at the top, so the fade never shows the old pane for a frame and the
    // name measures the header where it will actually be.
    try { flushSync(() => { then(); }); } catch (er) { try { then(); } catch (er2) {} }
    try { if (opts && opts.toTop) window.scrollTo(0, 0); } catch (er) {}
    land();
    // Timers, not animation frames: a throttled tab can starve rAF, and the
    // flood must never be left covering the page. The hard removal always runs.
    setTimeout(done, 700);
    setTimeout(() => {
      try {
        const f = d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
        f.onfinish = done;
      } catch (er) { done(); }
    }, 40);
  };
  try {
    const a = d.animate(
      tileClip(el, r, top).map((c) => ({ clipPath: c })),
      { duration: 340, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' },
    );
    a.onfinish = swap;
    setTimeout(swap, 450);
  } catch (err) { swap(); }
}
