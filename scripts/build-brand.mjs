#!/usr/bin/env node
//
// DRAW EVERY BAKED COPY OF THE MARK.
//
// The mark is a component (app/MindLoftMark.jsx) and is drawn, never pasted, so
// almost nothing on the site needs a PNG of it. Five things do: the browser tab,
// the iOS home screen, the legacy .ico, and the two images X wants uploaded by
// hand. This is what draws them, so they are not five hand-made files nobody can
// regenerate — the same hole scripts/bake-og.mjs was written to close.
//
//   npm i --no-save playwright && npx playwright install chromium
//   node scripts/build-brand.mjs
//
// Playwright is deliberately NOT a dependency: Vercel installs devDependencies
// during a build, and a headless browser is a few hundred megabytes to carry for
// a script that runs maybe twice a year. Install it for the run and drop it.
//
// It renders the REAL mark geometry through headless Chromium, with Manrope and
// DM Mono read out of node_modules, so it needs no network. Run it after any
// change to the mark or to --stg-brand, and commit what it writes.
//
// Outputs:
//   app/icon.png            512   the tab icon on every page
//   app/apple-icon.png      180   iOS home screen
//   app/favicon.ico   16/32/48/64 the legacy fallback
//   public/brand/x-avatar.png     400   upload to X by hand
//   public/brand/x-banner.png    1500x500
//
// -- THE THREE THINGS THAT ARE NOT ARBITRARY --------------------------------
//
// 1. THE BRAIN IS --stg-brand ON THE DARK REGISTER (#7dd3fc), because that is
//    what the mark wears on every dark page. It was #60a5fa, half a step darker,
//    which muddied at 16px against a dark tab bar.
//
// 2. THE AVATAR IS PADDED FURTHER IN THAN THE FAVICON. X crops a profile photo
//    to a circle. The floor line is the widest thing in the mark (92 of 120
//    units) and it sits 85% of the way down, where the circle has already
//    narrowed to about 71% of its diameter, so a mark sized for a square tile
//    has its ends cut off. AVATAR_FILL is solved against that, not eyeballed.
//
// 3. THE BANNER'S BOTTOM LEFT IS EMPTY ON PURPOSE. X overlays the profile photo
//    there, roughly the left quarter of the bottom third, and crops the banner
//    vertically on narrow layouts. Everything that has to survive sits in the
//    middle band.

import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (rel) => readFileSync(join(ROOT, 'node_modules', rel)).toString('base64');

const GROUND = '#0b0f1a';   // --stg-ground
const INK = '#e9edf4';      // --stg-ink
const SKY = '#7dd3fc';      // --stg-brand, dark register
const MUTE = '#8b95a8';
const INK2 = '#aab5c7';

// CATEGORY_RAMP from lib/category-ramp.js, in ramp order.
const RAMP = ['#7dd3fc', '#6ee7b7', '#bef264', '#e8b43a', '#fb923c',
  '#fb7185', '#e879f9', '#c084fc', '#fbbf24', '#a5b4fc'];

const TILE_FILL = 0.92;
const AVATAR_FILL = 0.86;

const FONTS = `
@font-face{font-family:Manrope;font-weight:800;src:url(data:font/woff;base64,${b64('@fontsource/manrope/files/manrope-latin-800-normal.woff')}) format('woff');}
@font-face{font-family:Manrope;font-weight:600;src:url(data:font/woff;base64,${b64('@fontsource/manrope/files/manrope-latin-600-normal.woff')}) format('woff');}
@font-face{font-family:'DM Mono';font-weight:400;src:url(data:font/woff;base64,${b64('@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff')}) format('woff');}
`;

// Verbatim from app/MindLoftMark.jsx. If that moves, move this with it.
const BRAIN = 'M14 42C12 28 22 16 36 16C40 8 54 6 60 14C70 8 84 14 86 26C96 30 98 44 88 50'
  + 'C92 58 86 66 76 64C74 72 64 74 60 66C48 70 36 66 32 56C20 56 12 50 14 42Z';

const mark = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" style="display:block">
  <path d="M20 52l40-34 40 34" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 102h92" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <g transform="translate(31,48) scale(0.53)"><path d="${BRAIN}" fill="${SKY}"/></g>
</svg>`;

const page = (w, h, body, css = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:Manrope,sans-serif;background:${GROUND};color:${INK};-webkit-font-smoothing:antialiased}
${css}
</style></head><body>${body}</body></html>`;

const tile = (px, fill) => page(px, px,
  `<div class="t">${mark(Math.round(px * fill))}</div>`,
  `.t{width:${px}px;height:${px}px;display:flex;align-items:center;justify-content:center;background:${GROUND}}`);

// THE BANNER (owner, 2026-10-12): the three lines in their fixed order, each on
// a ramp step, then every category as a chip so the banner shows the width of
// the site. Kept clear of the bottom-left quarter, where X lays the avatar.
const LINES = [['Sharpen your mind.', RAMP[0]], ['Gain IQ points.', RAMP[1]], ['Elevate your thinking.', RAMP[2]]];
// [name, ramp index] in the order the home shelves run.
const CATS = [['Word', 0], ['Numbers', 1], ['Logic', 2], ['Sudoku', 9], ['Trivia', 4],
  ['Geography', 5], ['End Game', 3], ['Cards', 6], ['Arcade', 8], ['Crowd', 7]];
const lines = LINES.map(([t, c]) => `<div class="ln"><i style="background:${c}"></i>${t}</div>`).join('');
const chip = ([n, i]) => `<span><i style="background:${RAMP[i]}"></i>${n}</span>`;
// Three rows, 4/3/3, so no category is left on a line by itself.
const chips = [CATS.slice(0, 4), CATS.slice(4, 7), CATS.slice(7)].map((r) => `<div class="row">${r.map(chip).join('')}</div>`).join('');
const band = RAMP.map((c) => `<i style="background:${c}"></i>`).join('');

const banner = page(1500, 500, `
<div class="band">${band}</div>
<div class="wrap">
  <div class="left">
    <div class="brand">${mark(50)}<b>Mind <em>Loft</em></b></div>
    ${lines}
  </div>
  <div class="cats">${chips}</div>
</div>`, `
.band{display:flex;height:8px}.band i{flex:1}
.wrap{width:1500px;height:492px;display:flex;align-items:center;justify-content:space-between;padding:0 96px 70px 96px}
.left{display:flex;flex-direction:column;align-items:flex-start}
.brand{display:flex;align-items:center;gap:14px;margin-bottom:22px}
.brand b{font-size:34px;font-weight:800;letter-spacing:-.01em}
.brand b em{font-style:normal;color:${SKY}}
.ln{display:flex;align-items:center;font-size:62px;font-weight:800;letter-spacing:-.035em;line-height:1.12}
.ln i{display:block;width:9px;height:46px;border-radius:5px;margin-right:22px}
.cats{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.cats .row{display:flex;gap:10px}
.cats span{display:flex;align-items:center;gap:9px;font-size:21px;font-weight:600;color:${INK};background:#151922;border:1px solid #252b36;border-radius:999px;padding:9px 16px}
.cats span i{display:block;width:10px;height:10px;border-radius:5px}
`);

mkdirSync(join(ROOT, 'public', 'brand'), { recursive: true });

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
async function shot(rel, w, h, html) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(250);
  await p.screenshot({ path: join(ROOT, rel) });
  await p.close();
  console.log('  ' + rel + '  ' + w + 'x' + h);
}

// `--banner` redraws the banner alone, so a copy change does not re-render the icons.
if (!process.argv.includes('--banner')) {
  await shot('app/icon.png', 512, 512, tile(512, TILE_FILL));
  await shot('app/apple-icon.png', 180, 180, tile(180, TILE_FILL));
  await shot('public/brand/x-avatar.png', 400, 400, tile(400, AVATAR_FILL));
}
await shot('public/brand/x-banner.png', 1500, 500, banner);
await browser.close();

// The .ico is downsampled from the 512 rather than rendered per size: Chromium
// hints a 16px render for the screen, which is the wrong trade for an icon that
// also has to hold up at 64.
console.log('\nNow write the .ico from app/icon.png, e.g.:');
console.log("  python3 -c \"from PIL import Image; Image.open('app/icon.png').save('app/favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64)])\"");
