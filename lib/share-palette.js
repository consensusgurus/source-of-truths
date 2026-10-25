// SHARE PALETTE (owner, 2026-10-23): the meme GIF, the sheet's preview and the
// challenge link's preview card all draw from one set per register, so the
// GIF and the card beside it always match, and both match the page they came
// from.
//
// WHITE WITH COLOR, ONE SET (owner, 2026-10-25): "I like the white ones but
// stick to the light pastel palettes." Every share surface now draws on a white
// ground with the category's softened pastel (softGround, 40% toward white) as
// its fill, near-black ink on it, and a black button. The light/dark pair of
// 2026-10-23 is retired: `dark` is still accepted so old callers and old links
// (t=d) keep working, and it is ignored.
//
// Pure data, safe on the server (the card route) and in the browser (the GIF).

import { CATEGORY_RAMP, rampIndexFor, softGround } from './category-ramp.js';

export const SHARE_LIGHT = { ground: '#ffffff', ink: '#0b0d12', mute: '#5f6774', line: '#e3e7ee' };

export function sharePalette(cat) {
  const i = Math.max(0, rampIndexFor(cat || 'Word'));
  return {
    ...SHARE_LIGHT,
    dark: false,
    hue: CATEGORY_RAMP[i],             // the full pastel step: the mark's brain
    fill: softGround(CATEGORY_RAMP[i]), // the soft pastel panel
    onFill: '#0b0d12',
    cta: '#0b0d12',                     // the button: black, white words
    onCta: '#ffffff',
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
// One white set now, so a link no longer carries the sharer's register.
export function themeParam() {
  return '';
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
