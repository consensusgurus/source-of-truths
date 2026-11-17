// scripts/bake-mow-og.mjs: the hand-built Mow share card (owner, 2026-11-16: "need cool share link image
// too"). A dark green lawn seen from above with a real Mow yard tilted on it, half of it mown in stripes, the
// corner of the house in its back corner, and the mower itself coming in big from the corner. The yard is
// drawn by lib/mow-art.js, the same code as the board. It is a DECOY yard, never one from the bank, so the
// card leaks nothing. bake-og.mjs skips 'mow' (HAND_BAKED in lib/og-stage-cards.js) so a full re-bake keeps it.
//
//   node scripts/bake-mow-og.mjs        writes <tmp>/mow-og/mow-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/mow.png:
//   google-chrome --headless --no-sandbox --hide-scrollbars --window-size=1200,630 --screenshot=public/og/mow.png file://<tmp>/mow-og/mow-og.html
import fs from 'fs';
import path from 'path';
import os from 'os';
import { mopModel } from '../lib/mop-engine.js';
import { U, MOWER, MOW_DEFS, drawYard, MOW_LIGHT, MOW_ART_CSS } from '../lib/mow-art.js';
const OUT = path.join(os.tmpdir(), 'mow-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));

// A decoy yard: 7 by 6, four sections, the corner of the house top left.
const W = 7, H = 6;
const P = {
  floors: [{ name: 'Yard', w: W, h: H,
    rooms: ['AAABBBB', 'AAABBBB', 'CCCBBBB', 'CCCDDDD', 'CCCDDDD', 'CCCDDDD'],
    names: { A: 'Garden', B: 'Back Yard', C: 'Side Yard', D: 'Front Yard' },
    pieces: [[0, 0, 2, 2, 'corner'], [5, 0, 2, 2, 'pond'], [4, 2, 1, 1, 'tree'], [1, 4, 1, 1, 'bush'], [5, 4, 2, 1, 'flowers'], [2, 0, 1, 1, 'birdbath'], [3, 3, 1, 1, 'tree']],
    doors: [[16, 17], [23, 24], [22, 29]], stairs: [], labels: [] }],
  start: [0, 39], end: [0, 4], sides: ['S', 'N'],
};
const M = mopModel(P), art = drawYard(P, M);
// the squares already mown (a plausible run, not a route to copy) and which way
const CUT = { 39: 'v', 38: 'h', 37: 'h', 36: 'h', 35: 'h', 29: 'v', 30: 'h', 31: 'h', 32: 'h', 33: 'h', 34: 'h', 27: 'v', 26: 'h', 25: 'h', 24: 'h', 18: 'v', 19: 'h', 20: 'h' };
const AT = 20;
let tiles = '';
for (let c = 0; c < W * H; c++) {
  const id = M.floors[0].node[c];
  tiles += `<rect class="g ${id < 0 ? 'f' : CUT[c] || 'u'}" x="${(c % W) * U}" y="${Math.floor(c / W) * U}" width="${U}" height="${U}"/>`;
}
const yard = `<svg viewBox="-34 -80 ${W * U + 68} ${H * U + 160}">${MOW_DEFS}${art.under}${tiles}${art.over}<g transform="translate(${(AT % W) * U + 50} ${Math.floor(AT / W) * U + 50})">${MOWER}</g></svg>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(manrope-latin-800-normal.woff2);font-weight:800}
@font-face{font-family:M;src:url(manrope-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:M;src:url(manrope-latin-600-normal.woff2);font-weight:600}
*{box-sizing:border-box}body{margin:0}
#c{width:1200px;height:630px;position:relative;overflow:hidden;font-family:M,sans-serif;color:#fff;
background-color:#1f6a35;
background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 90px,rgba(0,0,0,.06) 90px 180px),radial-gradient(760px 520px at 78% 52%,rgba(214,255,190,.30),transparent 64%),radial-gradient(520px 420px at 0% 0%,rgba(8,40,22,.55),transparent 70%)}
.mow{${MOW_LIGHT}}
${MOW_ART_CSS}
.mow .rm{font-size:19px}
.stage{position:absolute;left:470px;top:-150px;width:860px;height:860px;perspective:1700px}
.bd{position:absolute;inset:90px;transform:rotateX(48deg) rotateZ(-30deg);transform-origin:50% 50%;filter:drop-shadow(34px 54px 26px rgba(4,30,14,.55))}
.bd svg{width:100%;height:100%;display:block;overflow:hidden;border-radius:16px;font-family:M,sans-serif}
.big{position:absolute;right:-70px;bottom:-130px;width:380px;height:380px;transform:rotate(-122deg);filter:drop-shadow(-14px 22px 16px rgba(4,30,14,.5))}
.big svg{width:100%;height:100%;overflow:visible}
.l{position:absolute;left:64px;top:54px;width:520px;z-index:2}
.brand{font-weight:800;font-size:23px;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:27px;height:23px;background:#fff;clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:52px;font-weight:800;font-size:17px;letter-spacing:.13em;text-transform:uppercase;color:#0b3a1e;background:#d9f7c4;border-radius:999px;padding:8px 17px}
h1{margin:14px 0 0;font-weight:800;font-size:176px;line-height:.92;letter-spacing:-.05em;text-shadow:0 6px 0 rgba(8,40,22,.35)}
.sub{margin-top:20px;font-weight:700;font-size:31px;line-height:1.24;color:#eafbe0;max-width:470px}
.sub b{color:#fff;font-weight:800}
.go{position:absolute;left:64px;bottom:52px;font-weight:800;font-size:22px;color:#0b3a1e;background:#fff;border-radius:999px;padding:13px 26px;z-index:2}
.url{position:absolute;left:266px;bottom:66px;font-weight:700;font-size:20px;color:#d9f7c4;z-index:2}
</style></head><body><div id="c">
<div class="stage"><div class="bd mow">${yard}</div></div>
<div class="big mow"><svg viewBox="-70 -45 110 90">${MOWER}</svg></div>
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily lawn puzzle</div><h1>Mow</h1>
<div class="sub">Every square. <b>Exactly once.</b><br>Then out the gate.</div></div>
<div class="go">Play free</div><div class="url">mindloftdaily.com/mow</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'mow-og.html'), html);
console.log(path.join(OUT, 'mow-og.html'));
