import { markSvg as markSvgShared } from './mindloft-mark';
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

// The Mind Loft mark as an SVG string: the black house with the sky M, from
// lib/mindloft-mark.js. `brain` is kept in the signature for the callers; the M is
// always sky now (owner, 2026-10-26). The card route base64s it; the GIF draws it
// through an Image.
// eslint-disable-next-line no-unused-vars
export function markSvg(ink, brain) {
  return markSvgShared({ ink, size: 120 });
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
