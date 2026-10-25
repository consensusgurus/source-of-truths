'use client';

// THE TILE FLOOD (owner, 2026-10-25): tapping a puzzle tile on the phone home
// floods the screen from that tile in the colour the game's start page opens
// on, then loads the page, so the colour carries straight through to the
// start gate. The colour follows the stage look: the game's soft colour in
// Color, white in White and color or White and black, near-black in Black and
// white. A modified click, a desktop, or reduced motion just follows the link.

import { readLook, isDarkLook } from './stage-look';
import { softGround } from './category-ramp';

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
  d.style.cssText = `position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:${color};clip-path:circle(0px at ${x}px ${y}px);`;
  document.body.appendChild(d);
  let went = false;
  const go = () => { if (went) return; went = true; window.location.href = href; };
  try {
    const a = d.animate(
      [{ clipPath: `circle(${Math.max(r.width, r.height) / 2}px at ${x}px ${y}px)` }, { clipPath: `circle(${reach}px at ${x}px ${y}px)` }],
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
  // The header stays put (owner, 2026-10-25): the flood starts below it.
  let top = 0;
  try {
    const hd = opts && opts.below ? document.querySelector(opts.below) : null;
    if (hd) top = Math.max(0, Math.round(hd.getBoundingClientRect().bottom));
  } catch (er) {}
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2 - top;
  const w = window.innerWidth;
  const h = window.innerHeight - top;
  const reach = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 4;
  const d = document.createElement('div');
  d.className = 'sot-flood';
  d.setAttribute('aria-hidden', 'true');
  d.style.cssText = `position:fixed;left:0;right:0;bottom:0;top:${top}px;z-index:2147483000;pointer-events:none;background:${color};clip-path:circle(0px at ${x}px ${y}px);`;
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
  const done = () => { try { d.remove(); } catch (er) {} };
  const swap = () => {
    if (swapped) return; swapped = true;
    try { then(); } catch (er) {}
    setTimeout(land, 30);
    // Timers, not animation frames: a throttled tab can starve rAF, and the
    // flood must never be left covering the page. The hard removal always runs.
    setTimeout(done, 500);
    setTimeout(() => {
      try {
        const f = d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
        f.onfinish = done;
      } catch (er) { done(); }
    }, 16);
  };
  try {
    const a = d.animate(
      [{ clipPath: `circle(${Math.max(r.width, r.height) / 2}px at ${x}px ${y}px)` }, { clipPath: `circle(${reach}px at ${x}px ${y}px)` }],
      { duration: 300, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' },
    );
    a.onfinish = swap;
    setTimeout(swap, 450);
  } catch (err) { swap(); }
}
