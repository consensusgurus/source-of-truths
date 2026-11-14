// scripts/bake-mop-og.mjs: the hand-built Mop share card (owner, 2026-11-13: "should be cool and not our
// standard ones"). The stock card from bake-og.mjs is a flat colour panel; this one is a lawn seen from above
// with a real Mop house tilted on it, half its tiles mopped clean, its walkway running off the card, and the
// mop itself leaning in from the corner. The house is drawn by lib/mop-art.js, the same code as the board.
// It is a DECOY house, never a board from the bank, so the card leaks nothing. bake-og.mjs skips 'mop'
// (HAND_BAKED in lib/og-stage-cards.js) so a full re-bake keeps this.
//
//   node scripts/bake-mop-og.mjs        writes <tmp>/mop-og/mop-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/mop.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { mopModel } from '../lib/mop-engine.js';
import { U, MOP, drawFloor, MOP_LIGHT, MOP_ART_CSS } from '../lib/mop-art.js';
const OUT = path.join(os.tmpdir(), 'mop-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));

// A decoy house: 7 by 6, five rooms.
const W = 7, H = 6;
const P = {
  floors: [{ name: 'House', w: W, h: H,
    rooms: ['AAAABBB', 'AAAABBB', 'AAAABBB', 'CCDDDEE', 'CCDDDEE', 'CCDDDEE'],
    names: { A: 'Living', B: 'Kitchen', C: 'Bath', D: 'Bedroom', E: 'Study' },
    pieces: [[1, 1, 2, 1, 1], [0, 0, 1, 1], [5, 1, 1, 1, 1], [6, 0, 1, 1], [0, 4, 1, 2], [3, 4, 2, 1, 1], [5, 5, 2, 1]],
    doors: [[10, 11], [14, 21], [17, 24], [20, 27], [29, 30], [25, 26]], stairs: [], labels: [] }],
  start: [0, 37], end: [0, 4], sides: ['S', 'N'],
};
const M = mopModel(P), art = drawFloor(P, M, 0);
// the tiles already mopped (a plausible sweep, not a route to copy), and where the mop stands
const WET = new Set([37, 36, 29, 22, 21, 23, 30, 24, 31, 38, 39, 32, 25, 18, 17, 16, 15, 14, 7]);
const AT = 7;
let tiles = '';
for (let c = 0; c < W * H; c++) {
  const id = M.floors[0].node[c], x = (c % W) * U, y = Math.floor(c / W) * U;
  tiles += `<rect class="t${id < 0 ? ' f' : WET.has(c) ? ' c' : ''}" x="${x}" y="${y}" width="${U}" height="${U}"/>`;
  if (id >= 0 && WET.has(c)) tiles += `<path class="shine" d="M${x + 18} ${y + 62}L${x + 44} ${y + 22}M${x + 40} ${y + 76}L${x + 58} ${y + 48}"/>`;
}
const house = `<svg viewBox="-40 -40 ${W * U + 80} ${H * U + 80}">${art.under}${tiles}${art.over}<g class="bot" transform="translate(${(AT % W) * U + 50} ${Math.floor(AT / W) * U + 50})">${MOP}</g></svg>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(manrope-latin-800-normal.woff2);font-weight:800}
@font-face{font-family:M;src:url(manrope-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:M;src:url(manrope-latin-600-normal.woff2);font-weight:600}
*{box-sizing:border-box}body{margin:0}
#c{width:1200px;height:630px;position:relative;overflow:hidden;font-family:M,sans-serif;color:#fff;
background-color:#2f7d43;
background-image:radial-gradient(760px 520px at 78% 52%,rgba(214,255,190,.42),transparent 64%),radial-gradient(520px 420px at 0% 0%,rgba(8,40,22,.55),transparent 70%),
radial-gradient(ellipse 3px 9px at 12px 16px,rgba(15,70,34,.55) 98%,transparent),radial-gradient(ellipse 3px 9px at 19px 20px,rgba(15,70,34,.45) 98%,transparent),radial-gradient(ellipse 3px 8px at 50px 54px,rgba(190,240,160,.35) 98%,transparent),radial-gradient(ellipse 3px 8px at 57px 57px,rgba(15,70,34,.45) 98%,transparent);
background-size:auto,auto,78px 78px,78px 78px,78px 78px,78px 78px}
.mop{${MOP_LIGHT}--mop-dirt:#b9c1cf;}
${MOP_ART_CSS}
.mop .shine{stroke:#bfe3fb;stroke-width:7;stroke-linecap:round;fill:none;opacity:.9}
.mop .rm{font-size:19px}
.stage{position:absolute;left:470px;top:-150px;width:860px;height:860px;perspective:1700px}
.bd{position:absolute;inset:70px;transform:rotateX(50deg) rotateZ(-32deg);transform-origin:50% 50%;filter:drop-shadow(34px 54px 26px rgba(4,30,14,.55))}
.bd svg{width:100%;height:100%;display:block;overflow:visible;font-family:M,sans-serif}
.big{position:absolute;right:-26px;bottom:-150px;width:470px;height:560px;filter:drop-shadow(-14px 22px 16px rgba(4,30,14,.5))}
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
<div class="stage"><div class="bd mop">${house}</div></div>
<div class="big mop"><svg viewBox="-60 -80 130 150"><g transform="rotate(-14)">${MOP}</g></svg></div>
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily route puzzle</div><h1>Mop</h1>
<div class="sub">Every tile. <b>Exactly once.</b><br>Then get out.</div></div>
<div class="go">Play free</div><div class="url">mindloftdaily.com/mop</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'mop-og.html'), html);
console.log(path.join(OUT, 'mop-og.html'));
