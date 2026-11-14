// scripts/bake-chef-og.mjs: the hand-built Chef share card (owner, 2026-11-13: "give me really cool share
// link image", for the base game). A rose field, the name in a tilted black tag, and a kitchen card drawn
// with the board's own art (lib/chef-art.js): lit heat lamps over a tray of three plates, the five stations
// in their pastels, a chef's hat on the corner and a checkered floor along the bottom. It shows no ticket
// from the bank, so the card leaks nothing. bake-og.mjs skips 'chef' (HAND_BAKED in lib/og-stage-cards.js)
// so a full re-bake keeps this.
//
//   node scripts/bake-chef-og.mjs        writes <tmp>/chef-og/chef-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/chef.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { STATIONS } from '../lib/chef-engine.js';
import { ART, LAMP, PLATE, HAT, CHEF_HEX } from '../lib/chef-art.js';
const OUT = path.join(os.tmpdir(), 'chef-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));
const C = CHEF_HEX;
const line = STATIONS.map(([st, nm]) => `<div class="stn" style="--ck-st:${C[st]}"><div style="--ck-st:#ffffff;display:contents">${ART[st](true)}</div>${nm}</div>`).join('');
const plates = ['grill', 'fryer', 'stove'].map((st) => `<span style="--ck-st:${C[st]}">${PLATE}</span>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${[600, 700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;background:${C.acc};color:#141414;position:relative}
.ck-l{fill:none;stroke:#141414;stroke-width:2.5;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.ck-b{fill:#fff}.ck-g{fill:#f1f1ef}.ck-a{fill:var(--ck-st)}.ck-i{fill:#141414}
.floor{position:absolute;left:0;right:0;bottom:0;height:60px;background:repeating-conic-gradient(#141414 0 25%,#fff 0 50%) 0 0/60px 60px;border-top:3px solid #141414}
.left{position:absolute;left:64px;top:52px;width:570px}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:22px;letter-spacing:.12em}
.pill{border:3px solid #141414;border-radius:999px;padding:5px 16px;background:#fff;letter-spacing:.06em;font-size:19px}
.title{font-size:168px;font-weight:800;line-height:1;margin-top:26px;letter-spacing:-.02em}
.title span{background:#141414;color:#fff;border-radius:30px;padding:0 34px 16px;display:inline-block;transform:rotate(-3deg);transform-origin:left;box-shadow:10px 10px 0 #fff}
.tag{font-size:34px;font-weight:700;line-height:1.25;margin-top:34px}
.cta{position:absolute;left:64px;top:468px;font-size:36px;font-weight:800;background:#fff;border:3px solid #141414;border-radius:18px;padding:10px 28px 13px;box-shadow:7px 7px 0 #141414}
.card{position:absolute;left:672px;top:70px;width:468px;height:440px;background:#fff;border:3px solid #141414;border-radius:30px;box-shadow:10px 10px 0 #141414;overflow:hidden}
.wall{height:230px;border-bottom:8px solid #141414;background:linear-gradient(#e3e3df 2px,transparent 2px) 0 0/100% 38px,linear-gradient(90deg,#e3e3df 2px,transparent 2px) 0 0/76px 100%,#fff;position:relative}
.lamps{display:flex;justify-content:space-around;padding:0 30px;--ck-st:${C.lamp}}.lamps svg{width:96px;height:66px}
.glow{position:absolute;left:60px;right:60px;top:60px;height:60px;background:radial-gradient(ellipse at 50% 0,${C.lamp} 0,rgba(255,255,255,0) 70%)}
.tray{position:absolute;left:44px;right:44px;bottom:14px;height:112px;background:#e3e3df;border:3px solid #141414;border-radius:26px;box-shadow:0 6px 0 #141414;display:flex;align-items:center;justify-content:space-around;padding:0 14px}
.tray svg{width:112px;height:74px;display:block}
.line{display:flex;height:202px}
.stn{flex:1;border-right:3px solid #141414;background:var(--ck-st);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:15px}
.stn:last-child{border-right:0}.stn svg{width:84px;height:54px}
.ck-hat{position:absolute;left:1058px;top:14px;width:132px;height:auto;transform:rotate(14deg)}
</style></head><body>
<div class="floor"></div>
<div class="left"><div class="brand">MIND LOFT <span class="pill">DAILY PUZZLE</span></div>
<div class="title"><span>Chef</span></div>
<div class="tag">Run the line. Time every dish<br>so the whole order goes out hot.</div></div>
<div class="cta">A new kitchen every day</div>
<div class="card"><div class="wall"><div class="glow"></div><div class="lamps">${LAMP(true).repeat(3)}</div><div class="tray">${plates}</div></div><div class="line">${line}</div></div>
${HAT}
</body></html>`;
fs.writeFileSync(path.join(OUT, 'chef-og.html'), html);
console.log(path.join(OUT, 'chef-og.html'));
