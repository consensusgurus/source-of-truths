// SHARE PALETTE (owner, 2026-10-23): the meme GIF, the sheet's preview and the
// challenge link's preview card all draw from one set per register, so the
// GIF and the card beside it always match, and both match the page they came
// from.
//
//   light: the pale stage ground, deep category step carrying white ink
//   dark:  the near-black stage ground, pastel category step carrying RAMP_INK
//
// Pure data, safe on the server (the card route) and in the browser (the GIF).

import { CATEGORY_RAMP, CATEGORY_RAMP_INK_LIGHT, RAMP_INK, rampIndexFor } from './category-ramp.js';

export const SHARE_LIGHT = { ground: '#f4f6f9', ink: '#0b0d12', mute: '#5f6774', line: '#dfe3ea' };
export const SHARE_DARK = { ground: '#0b0f1a', ink: '#e9edf4', mute: '#aab5c7', line: '#252b36' };

export function sharePalette(cat, dark) {
  const i = Math.max(0, rampIndexFor(cat || 'Word'));
  const base = dark ? SHARE_DARK : SHARE_LIGHT;
  return {
    ...base,
    dark: !!dark,
    fill: dark ? CATEGORY_RAMP[i] : CATEGORY_RAMP_INK_LIGHT[i],
    onFill: dark ? RAMP_INK : '#ffffff',
  };
}

// The Mind Loft mark as an SVG string: caret and floor in ink, brain in the
// category fill. The card route base64s it; the GIF draws it through an Image.
const BRAIN = 'M14 42C12 28 22 16 36 16C40 8 54 6 60 14C70 8 84 14 86 26C96 30 98 44 88 50'
  + 'C92 58 86 66 76 64C74 72 64 74 60 66C48 70 36 66 32 56C20 56 12 50 14 42Z';
export function markSvg(ink, brain) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">'
    + '<path d="M20 52l40-34 40 34" stroke="' + ink + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    + '<path d="M14 102h92" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/>'
    + '<g transform="translate(31,48) scale(0.53)"><path d="' + BRAIN + '" fill="' + brain + '"/></g></svg>';
}

// A challenge link carries the sharer's register (t=d) so its preview card
// is drawn in the same set as the GIF it travels with. Browser only.
export function themeParam() {
  try {
    return isDarkPage() ? '&t=d' : '';
  } catch (e) { return ''; }
}

// The register the reader is looking at: the live stage root first, then the
// boot stamp on <html>. Browser only.
export function isDarkPage() {
  try {
    const el = document.querySelector('.stage-page[data-stage-theme]');
    const t = el ? el.getAttribute('data-stage-theme') : document.documentElement.getAttribute('data-stage-boot');
    return t === 'dark';
  } catch (e) { return false; }
}
