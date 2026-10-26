#!/usr/bin/env node
// THE PRINT AND SHARE MASTERS of the Mind Loft mark (owner, 2026-10-26, "A2"):
// the house carries the colour, the words beside it are plain ink, and a pale house
// gets a thin outline in a deeper shade of its own colour ONLY where it needs one
// (under 3:1 against its ground). Run from the repo root:
//
//   npm i --no-save @resvg/resvg-js && node scripts/build-brand-marks.mjs
//
// Writes, all with TRANSPARENT backgrounds:
//   public/brand/mindloft-mark.svg / -1024.png         sky + outline: for white or light paper
//   public/brand/mindloft-mark-sky.svg / -sky-1024.png sky, no outline: for dark grounds
//   public/brand/mindloft-mark-black.svg / -black-1024.png
//   public/brand/mindloft-mark-white.svg / -white-1024.png
//   public/brand/marks/mindloft-mark-<category>.svg / .png   each pastel, outlined for light paper
//   public/brand/marks/mindloft-mark-<category>-dark.svg / .png  each pastel, no outline, for dark
//
// The favicon and app icons are NOT drawn here; scripts/build-app-icons.mjs owns those.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { register } from 'node:module';
import { markSvg, SKY, MARK_INK } from '../lib/mindloft-mark.js';
register('./alias-loader.mjs', import.meta.url);
const { CATEGORY_RAMP, RAMP_ORDER } = await import('../lib/category-ramp.js');

// a 120 box with room for the outline (it sits 4.5 units outside the house)
const pad = (svg) => svg.replace('viewBox="0 0 120 120"', 'viewBox="0 0 120 120" overflow="visible"');
const png = (svg) => new Resvg(svg.replace('viewBox="0 0 120 120"', 'viewBox="-2 -2 124 124"'), { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
const out = (base, svg) => { writeFileSync(base + '.svg', pad(svg)); writeFileSync(base + '-1024.png', png(svg)); console.log(base); };

mkdirSync('public/brand/marks', { recursive: true });
out('public/brand/mindloft-mark', markSvg({ ink: SKY, ground: '#ffffff' }));
out('public/brand/mindloft-mark-sky', markSvg({ ink: SKY, outline: null }));
out('public/brand/mindloft-mark-black', markSvg({ ink: MARK_INK, outline: null }));
out('public/brand/mindloft-mark-white', markSvg({ ink: '#ffffff', outline: null }));
const slug = (c) => c.toLowerCase().replace(/[^a-z]+/g, '-');
RAMP_ORDER.forEach((cat, i) => {
  out(`public/brand/marks/mindloft-mark-${slug(cat)}`, markSvg({ ink: CATEGORY_RAMP[i], ground: '#ffffff' }));
  out(`public/brand/marks/mindloft-mark-${slug(cat)}-dark`, markSvg({ ink: CATEGORY_RAMP[i], outline: null }));
});
