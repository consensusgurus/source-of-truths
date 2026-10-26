// THE RUN SHARE CARDS' WHITE FRAME (owner, 2026-10-25: "redo those too").
//
// The seven run cards (Dojo, Judged, Passport, Polymath, Price Check, Read the
// Room, Crossed Up) each draw their own picture: belts, a crowd, a week of
// squares, school colours, passports, a price board, a title ladder. That
// picture stays. What changes is everything around it, which now matches the
// rest of the share set (lib/og-stage-card.js): a white ground, the Mind Loft
// mark and name top left with the address top right, the pitch on white with a
// black Play Free button, and the picture on the run's soft category pastel.
// Manrope only, no uppercase mono labels, no dark board.
//
// Satori rules apply here as there: literal colours only, every multi-child
// div is display flex (the `d` helper does it).

import { createElement as h } from 'react';
import { markURI } from './og-stage-card.js';
import { categoryColor, softGround } from './category-ramp.js';

export const W = Object.freeze({
  ground: '#ffffff',
  ink: '#0b0d12',
  ink2: '#3f4757',
  mute: '#5f6774',
  faint: 'rgba(11,13,18,0.32)',
  line: 'rgba(11,13,18,0.14)',
  rest: 'rgba(255,255,255,0.62)', // an unlit rung on the pastel panel
});

export const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

export function runHue(cat) { return categoryColor(cat); }
export function runSoft(cat) { return softGround(categoryColor(cat)); }

const svgURI = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const ARROW = svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>');

// The chip that names the run, on the run's soft pastel.
export function chip(text, cat) {
  return d({ alignSelf: 'flex-start', fontSize: 19, fontWeight: 800, color: W.ink, background: runSoft(cat), padding: '9px 18px', borderRadius: 999 }, text);
}

// A small label above a headline: Title Case, mute, no tracking.
export function label(text, extra) {
  return d({ fontSize: 21, fontWeight: 700, color: W.ink2, ...(extra || {}) }, text);
}

// The button: black, white words, an arrow.
export function cta(text = 'Play Free') {
  return d({ marginTop: 'auto', alignSelf: 'flex-start', alignItems: 'center', gap: 12, padding: '14px 24px 14px 28px', borderRadius: 999, background: W.ink, color: '#ffffff', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 },
    text, h('img', { src: ARROW, width: 24, height: 24 }));
}

// One rung's look on the pastel panel. `state` is mine, up (the next one up),
// above (further up, quiet) or below.
export function rungLook(state) {
  if (state === 'mine') return { row: { background: '#ffffff', border: `3px solid ${W.ink}` }, ink: W.ink, num: W.ink };
  if (state === 'up') return { row: { border: `2px solid ${W.ink}` }, ink: W.ink, num: W.ink };
  if (state === 'above') return { row: { border: '2px solid transparent', opacity: 0.5 }, ink: W.ink, num: W.ink2 };
  return { row: { background: W.rest, border: '2px solid transparent' }, ink: W.ink2, num: W.ink2 };
}

export function youTag() {
  return d({ fontSize: 14, fontWeight: 800, color: '#ffffff', background: W.ink, padding: '4px 10px', borderRadius: 999, flexShrink: 0 }, 'You');
}
export function shortTag(n) {
  return d({ fontSize: 14, fontWeight: 800, color: W.ink, flexShrink: 0 }, `${n} Short`);
}

// The frame: brand row, then the white left column beside the pastel panel.
export function frame({ cat, url, left, right, rightW = 560, rightPad = '18px 20px', rightStyle = null }) {
  return d({ width: 1200, height: 630, flexDirection: 'column', background: W.ground, color: W.ink, fontFamily: 'Manrope', padding: '40px 56px 46px' },
    d({ alignItems: 'center', justifyContent: 'space-between', flex: 'none' },
      d({ alignItems: 'center', gap: 12 },
        h('img', { src: markURI(runHue(cat), W.ink), width: 44, height: 44 }),
        d({ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }, 'Mind Loft')),
      d({ fontSize: 21, fontWeight: 700, color: W.mute }, url)),
    d({ flex: 1, marginTop: 22, gap: 36, minHeight: 0 },
      d({ flexDirection: 'column', flex: 1, minWidth: 0 }, ...[].concat(left)),
      d({ flexDirection: 'column', width: rightW, flexShrink: 0, background: runSoft(cat), borderRadius: 28, padding: rightPad, justifyContent: 'center', ...(rightStyle || {}) }, ...[].concat(right))));
}
