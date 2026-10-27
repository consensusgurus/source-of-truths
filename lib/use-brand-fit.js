'use client';

// THE MARK GOES ALL INK WHEN ITS BLUE WOULD VANISH (owner, 2026-10-25: "when
// mindloft logo colors conflict with background too much, make logo / name
// all black"). The brand blue (--stg-brand) is chosen for the page ground,
// but a run paints its own pastel ground (sky on Pricer), and sky on sky
// cannot be read. After every render this measures the brand colour against
// the first painted background behind the element; under 3:1 it stamps
// data-brand-mono, and the CSS rule below turns --stg-brand into the ink.

import React, { useLayoutEffect, useRef } from 'react';

function rgb(s) {
  const m = String(s || '').match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (p.length >= 4 && p[3] === 0) return null;
  return p.slice(0, 3);
}
function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function groundOf(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const c = rgb(getComputedStyle(n).backgroundColor);
    if (c) return c;
  }
  return [255, 255, 255];
}

// THE WARM STEPS GO INK TOO (owner, 2026-10-26: "the orange tint on the icon
// sucks for the trivia / orange page"). On the light register a warm category
// publishes its TEXT ink as the brand colour (lib/category-ramp.js
// CATEGORY_RAMP_INK_LIGHT): Trivia's orange deepens to a rust, End Game's gold
// and the Arcade's amber to browns. They pass the contrast check and still
// read as mud on the house, so the mark takes the ink instead.
const MUD = [[0xa3, 0x48, 0x0d], [0x7c, 0x51, 0x04], [0x8a, 0x5a, 0x00]];
function isMud(c) {
  return MUD.some((m) => Math.abs(m[0] - c[0]) + Math.abs(m[1] - c[1]) + Math.abs(m[2] - c[2]) <= 12);
}

export function measureBrand(el) {
  if (!el || typeof window === 'undefined') return;
  try {
    el.removeAttribute('data-brand-mono');
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;color:var(--stg-brand,#7dd3fc)';
    el.appendChild(probe);
    const brand = rgb(getComputedStyle(probe).color);
    probe.remove();
    if (!brand) return;
    if (ratio(brand, groundOf(el.parentElement || el)) < 3 || isMud(brand)) el.setAttribute('data-brand-mono', '');
  } catch (e) {}
}

export default function useBrandFit(ref) {
  useLayoutEffect(() => { measureBrand(ref.current); });
}

// The rule itself lives in app/globals.css: [data-brand-mono] sets the brand vars to currentColor.

// Wrap a brand mark in this; it draws no box of its own.
export function BrandFit({ children }) {
  const ref = useRef(null);
  useBrandFit(ref);
  return React.createElement('span', { ref, style: { display: 'contents' } }, children);
}
