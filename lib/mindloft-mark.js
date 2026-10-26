// THE MIND LOFT MARK, as geometry (owner, 2026-10-26): a solid black house whose
// lower half IS the M. The two walls are the M's legs and the roof hangs down
// into the M's middle V. The opening under the V is a TRUE CUTOUT, transparent,
// so it always shows whatever the mark sits on (owner: "the cutout should match
// the background always").
//
// This file is the ONE copy of the drawing. app/MindLoftMark.jsx renders it as a
// React SVG, and every string-built SVG (share cards, OG images, the kids shell,
// the icon scripts) calls markSvg() here. Do not paste the path anywhere else:
// the last rebrand missed six hand-inlined copies for exactly that reason.
//
// 120 x 120 grid, traced from the owner's reference. ONE path, in `ink`.

export const MARK_INK = '#0b0d12';

export const HOUSE = 'M60 10L113 43V109H93V63L60 86L27 63V109H7V43Z';

// The house's own bounds, stroke included. A mark set beside the wordmark uses this
// box rather than the padded 120 square, so its roof peak and wall feet can sit
// exactly on the cap line and baseline of the M in "Mind Loft".
export const TIGHT_BOX = '5.5 8.5 109 102';
export const TIGHT_ASPECT = 109 / 102;
// Manrope's cap height, read off the font (OS/2 sCapHeight 1440 of 2000 units).
export const CAP_RATIO = 0.72;

export function markInner({ ink = MARK_INK } = {}) {
  return '<path class="mlm-house" d="' + HOUSE + '" fill="' + ink + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>';
}

export function markSvg(opts = {}) {
  const size = opts.size;
  const dims = size ? ' width="' + size + '" height="' + size + '"' : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"' + dims + ' fill="none">'
    + markInner(opts) + '</svg>';
}
