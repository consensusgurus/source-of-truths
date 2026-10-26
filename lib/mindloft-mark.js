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
export const SKY = '#7dd3fc';

export const HOUSE = 'M60 10L113 43V109H93V63L60 86L27 63V109H7V43Z';

// The house's own bounds, stroke included. A mark set beside the wordmark uses this
// box rather than the padded 120 square, so its roof peak and wall feet can sit
// exactly on the cap line and baseline of the M in "Mind Loft".
export const TIGHT_BOX = '5.5 8.5 109 102';
export const TIGHT_ASPECT = 109 / 102;
// Manrope's cap height, read off the font (OS/2 sCapHeight 1440 of 2000 units).
export const CAP_RATIO = 0.72;
// OPTICAL OVERSHOOT (owner, 2026-10-26: "the top of the icon is not as high as the top
// of the M"). A roof is a POINT, and a point measured exactly to the cap line reads
// low, which is why type pushes A and V past it. The feet stay on the baseline; the
// mark grows upward by this factor so the peak reads level with the M's flat top.
export const CAP_OVERSHOOT = 1.1;

// THE COLOUR RULE (owner, 2026-10-26, "A2"): the house carries the colour (sky on the
// home and in print, the category hue on a game page) and the words are plain ink. A
// pastel house on a light ground is too faint on its own, so it gets a thin outline in
// a DEEPER shade of its own colour, but only when it needs one: the outline is drawn
// when the fill falls under 3:1 against the ground behind it. On the dark register, and
// for any deep fill, no outline is drawn.
export const OUTLINE_W = 6;      // extra stroke, in 120-grid units, outside the fill
export const MIN_CONTRAST = 3;   // WCAG non-text contrast

export function parseColor(c) {
  if (!c) return null;
  let m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) { const h = m[1]; return [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16)); }
  m = /^#([0-9a-f]{6})$/i.exec(c);
  if (m) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/i.exec(c);
  if (m) { if (m[4] !== undefined && +m[4] === 0) return null; return [+m[1], +m[2], +m[3]]; }
  return null;
}
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
export const luminance = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
// The same hue and saturation, taken down to 40% lightness: sky #7dd3fc -> ~#0389cf.
export function deepen(rgb) {
  let [r, g, b] = rgb.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0, sat = 0;
  const l = (mx + mn) / 2;
  if (d) {
    sat = d / (1 - Math.abs(2 * l - 1));
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const S = sat, L = 0.40;
  const C = (1 - Math.abs(2 * L - 1)) * S, X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m0 = L - C / 2;
  const [r1, g1, b1] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  const hex = (v) => Math.round((v + m0) * 255).toString(16).padStart(2, '0');
  return '#' + hex(r1) + hex(g1) + hex(b1);
}
// The outline a fill needs on a given ground, or null when it reads on its own.
export function outlineFor(fill, ground = '#ffffff') {
  const f = parseColor(fill), g = parseColor(ground);
  if (!f || !g) return null;
  return contrast(f, g) < MIN_CONTRAST ? deepen(f) : null;
}

export function markInner({ ink = SKY, ground = '#ffffff', outline } = {}) {
  const ol = outline === undefined ? outlineFor(ink, ground) : outline;
  return (ol ? '<path class="mlm-ol" d="' + HOUSE + '" fill="none" stroke="' + ol + '" stroke-width="' + (3 + OUTLINE_W) + '" stroke-linejoin="round"/>' : '')
    + '<path class="mlm-house" d="' + HOUSE + '" fill="' + ink + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>';
}

export function markSvg(opts = {}) {
  const size = opts.size;
  const dims = size ? ' width="' + size + '" height="' + size + '"' : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"' + dims + ' fill="none" overflow="visible">'
    + markInner(opts) + '</svg>';
}
