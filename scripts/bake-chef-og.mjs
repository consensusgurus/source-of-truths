// scripts/bake-chef-og.mjs: the hand-built Chef share card. REDRAWN 2026-11-15 (owner: Pack, Chef, Seated
// and Bag looked like one card; give each its own world like Mop, Carmen and Tape). A red tiled kitchen
// wall, the Mop/Carmen header in white, an order ticket on the rail, and the kitchen drawn with the board's
// own art (lib/chef-art.js): lit heat lamps over a tray of three plates, the five stations
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
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;color:#fff;position:relative;background-color:#c8372d;
background-image:radial-gradient(700px 480px at 80% 40%,rgba(255,190,150,.28),transparent 70%),radial-gradient(600px 400px at 0% 100%,rgba(60,8,4,.45),transparent 70%),
linear-gradient(rgba(255,235,225,.30) 3px,transparent 3px),linear-gradient(90deg,rgba(255,235,225,.30) 3px,transparent 3px);
background-size:auto,auto,100% 52px,104px 52px}
.ck-l{fill:none;stroke:#141414;stroke-width:2.5;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.ck-b{fill:#fff}.ck-g{fill:#f1f1ef}.ck-a{fill:var(--ck-st)}.ck-i{fill:#141414}
.counter{position:absolute;left:0;right:0;bottom:0;height:70px;background:linear-gradient(#d9dde2,#aeb4bc);border-top:4px solid #141414}
.l{position:absolute;left:64px;top:54px;width:540px;z-index:2}
.brand{font-weight:800;font-size:23px;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:27px;height:23px;background:#fff;clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:44px;font-weight:800;font-size:17px;letter-spacing:.13em;text-transform:uppercase;color:#7a1710;background:#ffe2d6;border-radius:999px;padding:8px 17px}
h1{margin:12px 0 0;font-weight:800;font-size:176px;line-height:.92;letter-spacing:-.05em;text-shadow:0 6px 0 rgba(70,8,4,.35)}
.sub{margin-top:18px;font-weight:700;font-size:30px;line-height:1.24;color:#ffe9e1;max-width:450px}
.sub b{color:#fff;font-weight:800}
.go{position:absolute;left:64px;bottom:96px;font-weight:800;font-size:22px;color:#7a1710;background:#fff;border-radius:999px;padding:13px 26px;z-index:2}
.url{position:absolute;left:226px;bottom:110px;font-weight:700;font-size:20px;color:#ffe2d6;z-index:2}
.card{position:absolute;left:676px;top:84px;width:456px;height:430px;background:#fff;border:3px solid #141414;border-radius:24px;box-shadow:0 30px 40px rgba(60,8,4,.45);overflow:hidden;transform:rotate(-3deg)}
.wall{height:226px;border-bottom:8px solid #141414;background:linear-gradient(#e3e3df 2px,transparent 2px) 0 0/100% 38px,linear-gradient(90deg,#e3e3df 2px,transparent 2px) 0 0/76px 100%,#fff;position:relative}
.lamps{display:flex;justify-content:space-around;padding:0 30px;--ck-st:${C.lamp}}.lamps svg{width:96px;height:66px}
.glow{position:absolute;left:60px;right:60px;top:60px;height:60px;background:radial-gradient(ellipse at 50% 0,${C.lamp} 0,rgba(255,255,255,0) 70%)}
.tray{position:absolute;left:40px;right:40px;bottom:14px;height:108px;background:#e3e3df;border:3px solid #141414;border-radius:26px;box-shadow:0 6px 0 #141414;display:flex;align-items:center;justify-content:space-around;padding:0 14px}
.tray svg{width:108px;height:72px;display:block}
.line{display:flex;height:196px}
.stn{flex:1;border-right:3px solid #141414;background:var(--ck-st);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:15px;color:#141414}
.stn:last-child{border-right:0}.stn svg{width:80px;height:52px}
.rail{position:absolute;left:600px;right:-10px;top:28px;height:14px;background:linear-gradient(#f4f5f7,#9aa1aa);border:2px solid #141414;border-radius:7px;z-index:3}
.tk{position:absolute;top:34px;width:132px;background:#fffdf6;border:2px solid #141414;border-top:0;padding:16px 12px 12px;color:#141414;font-weight:800;font-size:15px;line-height:1.45;box-shadow:0 14px 18px rgba(60,8,4,.35);z-index:2}
.tk em{display:block;font-style:normal;font-size:12px;letter-spacing:.1em;color:#c8372d;margin-bottom:4px}
.ck-hat{position:absolute;left:1062px;top:430px;width:150px;height:auto;transform:rotate(-12deg);z-index:4;filter:drop-shadow(0 12px 10px rgba(60,8,4,.4))}
</style></head><body>
<div class="counter"></div>
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily kitchen puzzle</div><h1>Chef</h1>
<div class="sub">Run the line. <b>Time every dish</b> so the order goes out hot.</div></div>
<div class="go">Play free</div><div class="url">mindloftdaily.com/chef</div>
<div class="card"><div class="wall"><div class="glow"></div><div class="lamps">${LAMP(true).repeat(3)}</div><div class="tray">${plates}</div></div><div class="line">${line}</div></div>
<div class="rail"></div>
<div class="tk" style="left:618px;transform:rotate(-4deg)"><em>TABLE 4</em>2 Burger<br>1 Fries<br>1 Soup</div>
${HAT}
</body></html>`;
fs.writeFileSync(path.join(OUT, 'chef-og.html'), html);
console.log(path.join(OUT, 'chef-og.html'));
