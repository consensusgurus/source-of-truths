// Generates the Mind Loft app icon set from the brand mark. Run from the repo root:
//
//   npm i --no-save @resvg/resvg-js && node scripts/build-app-icons.mjs
//
// resvg is deliberately NOT a package.json dependency: this runs by hand when the mark or the
// palette changes, never in the Vercel build. Outputs overwrite app/icon.png, app/apple-icon.png,
// app/favicon.ico and the three public/web-app-manifest-* files in place.
//
// WHY THIS FILE EXISTS. The icons used to be a straight export of the logo SVG on a TRANSPARENT
// ground, full bleed. Three things were wrong with that, and all three are structural rather
// than matters of taste:
//
//   1. iOS has no alpha in home-screen icons, so it composited the mark onto BLACK. The
//      installed app was a black square with a nearly invisible dark caret in it.
//   2. The mark ran to the edges. Both the iOS squircle and the Android adaptive-icon circle
//      clipped the caret tips and the ends of the floor rule.
//   3. One drawing was used at every size. A 7px stroke on a 120 grid is a hairline by 32px.
//
// A logo and an app icon are not the same drawing. This file keeps the mark from
// lib/mindloft-mark.js but cuts it twice, on an opaque field, inside the platform safe zones.

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { markInner, MARK_INK } from '../lib/mindloft-mark.js';
import { register } from 'node:module';
// category-ramp imports extensionless siblings, which plain node needs the alias loader for.
register('./alias-loader.mjs', import.meta.url);
const { CATEGORY_RAMP, RAMP_ORDER } = await import('../lib/category-ramp.js');

// THE HOUSE MARK (owner, 2026-10-26): a black house whose lower half is the M, the M's
// opening a true transparent cutout. Icons sit on the PASTELS (owner: "one each for our
// different pastels"). The site's own icons use sky, the owner's reference; the other
// nine are written to public/brand/icons/ for share, print and per-surface use.
// The site's own icons sit on the LIGHT sky of the owner's reference (#b1e5fd), not
// the full ramp step: #7dd3fc read too dark at favicon size (owner, 2026-10-26).
const SITE_FIELD = '#b1e5fd';
let INK = SITE_FIELD; // the field. Reassigned per pastel below.

// LARGE cut (>=48px): the mark at ~72% of the tile, inside the platform safe zones.
const largeCut = `<g transform="translate(60,61) scale(0.74) translate(-60,-61)">${markInner({ ink: MARK_INK, outline: null })}</g>`;
// SMALL cut (16/32px): nearly full bleed; at 16px a generous mark beats a padded one.
const smallCut = `<g transform="translate(60,61) scale(0.98) translate(-60,-61)">${markInner({ ink: MARK_INK, outline: null })}</g>`;

function svg(inner, scale) {
  const art = scale === 1 ? inner : `<g transform="translate(60,60) scale(${scale}) translate(-60,-60)">${inner}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">`
    + `<rect width="120" height="120" fill="${INK}"/>${art}</svg>`;
}

const png = (source, size) =>
  new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();

const LARGE = svg(largeCut, 1);
const SMALL = svg(smallCut, 1);
// Android crops a maskable icon to the inner 80% circle, so the art is pulled in a further 15%.
const MASKABLE = svg(largeCut, 0.85);

// No baked corner radius anywhere: every platform applies its own mask, and a pre-rounded icon
// under a squircle mask shows the tell-tale double corner.
const targets = [
  ['app/icon.png', LARGE, 512],
  ['app/apple-icon.png', LARGE, 180],
  ['public/web-app-manifest-192x192.png', LARGE, 192],
  ['public/web-app-manifest-512x512.png', LARGE, 512],
  ['public/web-app-manifest-512x512-maskable.png', MASKABLE, 512],
];

for (const [path, source, size] of targets) {
  const buf = png(source, size);
  writeFileSync(path, buf);
  console.log(path, size + 'px', buf.length + ' bytes');
}

// favicon.ico as PNG-in-ICO (Vista+, and every current browser). 16 and 32 use the SMALL cut,
// 48 uses the LARGE cut. That mixture is the entire point of a multi-size ico: each entry is
// the drawing that works at that size, not one drawing resampled three times.
function ico(entries) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.data.length;
  });
  return Buffer.concat([head, dir, ...entries.map((e) => e.data)]);
}

const icoBuf = ico([
  { size: 16, data: png(SMALL, 16) },
  { size: 32, data: png(SMALL, 32) },
  { size: 48, data: png(LARGE, 48) },
]);
writeFileSync('app/favicon.ico', icoBuf);
console.log('app/favicon.ico', icoBuf.length + ' bytes');

// One full set per pastel, plus the transparent master for print and share.
mkdirSync('public/brand/icons', { recursive: true });
const slug = (c) => c.toLowerCase().replace(/[^a-z]+/g, '-');
RAMP_ORDER.forEach((cat, i) => {
  INK = CATEGORY_RAMP[i];
  const L = svg(largeCut, 1), S = svg(smallCut, 1);
  for (const [sz, src] of [[512, L], [180, L], [32, S]]) {
    writeFileSync(`public/brand/icons/mindloft-${slug(cat)}-${sz}.png`, png(src, sz));
  }
});
INK = SITE_FIELD;
// The transparent print and share masters live in scripts/build-brand-marks.mjs.
console.log('public/brand/icons/ (10 pastels x 3 sizes)');

// Proof sheet for eyeballing every size at once, including the Android circle crop and the
// small sizes magnified. Not shipped; .gitignore keeps it out.
mkdirSync('.icon-proof', { recursive: true });
const u = (b) => 'data:image/png;base64,' + b.toString('base64');
const at = (source, size, x, y, draw, pix) =>
  `<image href="${u(png(source, size))}" x="${x}" y="${y}" width="${draw}" height="${draw}"`
  + `${pix ? ' image-rendering="optimizeSpeed"' : ''}/>`;
const lbl = (t, x, y) => `<text x="${x}" y="${y}" font-family="sans-serif" font-size="11" fill="#5f5e5a">${t}</text>`;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="470" viewBox="0 0 900 470">
<rect width="900" height="470" fill="#ffffff"/>
${lbl('512', 20, 18)}${at(LARGE, 512, 20, 26, 180)}
${lbl('512 maskable, Android circle crop', 230, 18)}${at(MASKABLE, 512, 230, 26, 180)}
<circle cx="320" cy="116" r="90" fill="none" stroke="#e24b4a" stroke-width="2" stroke-dasharray="5 4"/>
${lbl('180 apple-touch', 440, 18)}${at(LARGE, 180, 440, 26, 180)}
${lbl('192', 650, 18)}${at(LARGE, 192, 650, 26, 96)}
${lbl('actual pixel sizes', 20, 250)}
${at(LARGE, 48, 20, 260, 48)}${at(SMALL, 32, 84, 260, 32)}${at(SMALL, 16, 132, 260, 16)}
${lbl('48', 20, 326)}${lbl('32', 84, 326)}${lbl('16', 132, 326)}
${lbl('16px magnified 8x', 220, 250)}${at(SMALL, 16, 220, 260, 128, true)}
${lbl('32px magnified 4x', 380, 250)}${at(SMALL, 32, 380, 260, 128, true)}
${lbl('48px magnified 4x', 540, 250)}${at(LARGE, 48, 540, 260, 192, true)}
</svg>`;
writeFileSync('.icon-proof/proof.png', new Resvg(sheet, { fitTo: { mode: 'width', value: 900 } }).render().asPng());
console.log('.icon-proof/proof.png');
