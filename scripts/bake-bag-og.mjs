// scripts/bake-bag-og.mjs: the hand-built Bag share card. REDRAWN 2026-11-15 (owner: Pack, Chef, Seated
// and Bag looked like one card; give each its own world like Mop, Carmen and Tape). Kraft paper, the
// Mop/Carmen header in ink, a paper grocery bag, and a card holding three bags part loaded, each with its weight bar, with three items still on
// the belt along the floor. The shop is a DECOY written here, never a board from the bank, so the card
// leaks nothing. bake-og.mjs skips 'bag' (HAND_BAKED in lib/og-stage-cards.js) so a full re-bake keeps this.
//
//   node scripts/bake-bag-og.mjs      writes <tmp>/bag-og/bag-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/bag.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
const OUT = path.join(os.tmpdir(), 'bag-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));
const KRAFT = '#cf9c5e', INK = '#2b1a0a';
const col = (h) => `hsl(${h} 62% 84%)`;
const pill = (t, bg) => `<i style="background:${bg}">${t}</i>`;
const it = (n, h, w, c, cold) => `<div class="it" style="background:${col(h)}"><b>${n}</b><span>${pill(w + ' lb', '#fff')}${pill(c, c === '0' ? '#f3b0b0' : c === 'any' ? '#bfe6c8' : '#f6e3a8')}${cold ? pill('cold', '#bfe0f7') : ''}</span></div>`;
const bag = (n, w, rows, verd, cls) => `<div class="bag"><div class="nm"><b>Bag ${n}</b><span>${w}/9 lb</span></div><div class="g">${Array.from({ length: 9 }, (_, i) => `<u class="${i < w ? 'on' : ''}"></u>`).join('')}</div><div class="st">${rows.join('')}${'<div class="slot"></div>'.repeat(4 - rows.length)}</div><div class="v ${cls}">${verd}</div></div>`;
// the big paper bag, with a baguette and greens standing out of it
const SACK = `<svg viewBox="0 0 300 340" width="300" height="340"><path d="M150 18c-8 0-14 6-14 14v90h28V32c0-8-6-14-14-14z" fill="#f2d39a" stroke="#141414" stroke-width="4"/><path d="M146 40l12-6M146 64l12-6M146 88l12-6" stroke="#b5854a" stroke-width="4" stroke-linecap="round"/>
<path d="M196 92c-4-34 18-58 40-62-6 22-10 40-22 62zM214 96c8-28 34-40 56-36-14 16-26 30-44 40z" fill="#7ccf7a" stroke="#141414" stroke-width="4" stroke-linejoin="round"/>
<path d="M40 110h220l-18 222H58z" fill="#d9a865" stroke="#141414" stroke-width="4" stroke-linejoin="round"/><path d="M40 110l14-20h192l14 20z" fill="#e8bd7d" stroke="#141414" stroke-width="4" stroke-linejoin="round"/>
<path d="M58 150l-6 170M242 150l6 170" stroke="#b5854a" stroke-width="3"/><path d="M96 196h108M96 216h70" stroke="#a9773e" stroke-width="5" stroke-linecap="round"/></svg>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;color:${INK};position:relative;background-color:${KRAFT};
background-image:radial-gradient(700px 480px at 78% 40%,rgba(255,232,190,.45),transparent 70%),repeating-linear-gradient(88deg,rgba(120,72,24,.07) 0 2px,transparent 2px 9px),repeating-linear-gradient(-3deg,rgba(255,240,210,.10) 0 1px,transparent 1px 13px)}
.belt{position:absolute;left:0;right:0;bottom:0;height:96px;background:#26272b;border-top:6px solid #141414}
.belt::before{content:'';position:absolute;left:0;right:0;top:10px;height:3px;background:#3c3e44}
.l{position:absolute;left:64px;top:54px;width:500px;z-index:2}
.brand{font-weight:800;font-size:23px;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:27px;height:23px;background:${INK};clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:44px;font-weight:800;font-size:17px;letter-spacing:.13em;text-transform:uppercase;color:#f7e3bd;background:${INK};border-radius:999px;padding:8px 17px}
h1{margin:12px 0 0;font-weight:800;font-size:176px;line-height:.92;letter-spacing:-.05em;text-shadow:0 6px 0 rgba(255,232,190,.5)}
.sub{margin-top:44px;font-weight:700;font-size:30px;line-height:1.24;max-width:430px}
.go{position:absolute;left:64px;bottom:20px;font-weight:800;font-size:22px;color:${INK};background:#f7e3bd;border-radius:999px;padding:13px 26px;z-index:2}
.url{position:absolute;left:226px;bottom:34px;font-weight:700;font-size:20px;color:#f7e3bd;z-index:2}
.card{position:absolute;left:520px;top:40px;width:520px;height:400px;background:#fffaf0;border:3px solid #141414;border-radius:26px;box-shadow:0 26px 34px rgba(80,44,10,.38);padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;transform:rotate(3deg)}
.bag{border:2.5px solid #141414;border-radius:12px 12px 20px 20px;padding:9px 8px 0;display:flex;flex-direction:column;overflow:hidden;background:#fff}
.nm{display:flex;justify-content:space-between;font-size:16px;font-weight:800}.nm span{color:#6b6b6b;font-weight:700}
.g{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin:6px 0 8px}.g u{height:11px;border:2px solid #141414;border-radius:3px}.g u.on{background:#141414}
.st{display:flex;flex-direction:column-reverse;gap:6px;flex:1}
.slot{height:54px;border:2px solid #e3e3df;border-radius:11px;background:#f1f1ef}
.it{height:54px;border:2.5px solid #141414;border-radius:11px;padding:4px 8px;display:flex;flex-direction:column;justify-content:center;color:#141414}
.it b{font-size:16px;font-weight:800;line-height:1.2}.it span{display:flex;gap:4px;margin-top:3px}
.it i{font-style:normal;font-size:12px;font-weight:800;border:2px solid #141414;border-radius:999px;padding:0 6px;line-height:1.5}
.v{margin:8px -8px 0;padding:7px 0;text-align:center;font-size:15px;font-weight:800;border-top:2.5px solid #141414;color:#141414}
.v.ok{background:#bfe6c8}.v.no{background:#f3b0b0}
.onbelt{position:absolute;bottom:22px;width:160px;z-index:3}.onbelt .it{box-shadow:0 10px 10px rgba(0,0,0,.45)}
.sack{position:absolute;left:925px;top:206px;transform:rotate(7deg) scale(.86);transform-origin:50% 100%;z-index:4;filter:drop-shadow(-10px 18px 14px rgba(80,44,10,.45))}
</style></head><body><div class="belt"></div>
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily bagging puzzle</div><h1>Bag</h1>
<div class="sub">Heavy low, eggs on top, cold together. Bag it all.</div></div>
<div class="go">Play free</div><div class="url">mindloftdaily.com/bag</div>
<div class="card">
${bag(1, 8, [it('Potatoes', 28, 5, 'any'), it('Beans', 10, 3, 'any')], 'Tears: 10 lb', 'no')}
${bag(2, 7, [it('Milk', 205, 4, '5', 1), it('Ice Cream', 330, 2, '2', 1), it('Peas', 120, 1, '2', 1)], 'Fits here', 'ok')}
${bag(3, 4, [it('Soup', 150, 3, 'any'), it('Eggs', 45, 1, '0')], 'Crushes the Eggs', 'no')}
</div>
<div class="onbelt" style="left:470px;transform:rotate(-2deg)">${it('Yogurt', 285, 2, '2', 1)}</div>
<div class="onbelt" style="left:650px;transform:rotate(1.5deg)">${it('Bread', 32, 1, '0')}</div>
<div class="onbelt" style="left:830px;transform:rotate(-1deg)">${it('Tomatoes', 2, 1, '1')}</div>
<div class="sack">${SACK}</div>
</body></html>`;
fs.writeFileSync(path.join(OUT, 'bag-og.html'), html);
console.log(path.join(OUT, 'bag-og.html'));
