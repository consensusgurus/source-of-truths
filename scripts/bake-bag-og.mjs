// scripts/bake-bag-og.mjs: the hand-built Bag share card. A soft rose field (Logic), the name in a tilted
// black tag, and a card holding three bags part loaded, each with its weight bar, with three items still on
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
const FIELD = '#fecdd3', FLOOR = '#fda4af';
const col = (h) => `hsl(${h} 62% 84%)`;
const pill = (t, bg) => `<i style="background:${bg}">${t}</i>`;
const it = (n, h, w, c, cold) => `<div class="it" style="background:${col(h)}"><b>${n}</b><span>${pill(w + ' lb', '#fff')}${pill(c, c === '0' ? '#f3b0b0' : c === 'any' ? '#bfe6c8' : '#f6e3a8')}${cold ? pill('cold', '#bfe0f7') : ''}</span></div>`;
const bag = (n, w, rows, verd, cls) => `<div class="bag"><div class="nm"><b>Bag ${n}</b><span>${w}/9 lb</span></div><div class="g">${Array.from({ length: 9 }, (_, i) => `<u class="${i < w ? 'on' : ''}"></u>`).join('')}</div><div class="st">${rows.join('')}${'<div class="slot"></div>'.repeat(4 - rows.length)}</div><div class="v ${cls}">${verd}</div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;background:${FIELD};color:#141414;position:relative}
.floor{position:absolute;left:0;right:0;bottom:0;height:78px;background:${FLOOR};border-top:3px solid #141414}
.brand{position:absolute;left:64px;top:58px;font-weight:800;font-size:22px;letter-spacing:.12em}
.title{position:absolute;left:56px;top:106px;font-size:168px;font-weight:800;line-height:1.1;background:#141414;color:#fff;border-radius:28px;padding:0 40px 14px;transform:rotate(-4deg);box-shadow:10px 10px 0 #fff}
.tag{position:absolute;left:64px;top:346px;width:440px;font-size:34px;font-weight:700;line-height:1.28}
.cta{position:absolute;left:64px;top:474px;font-size:26px;font-weight:800;background:#fff;border:3px solid #141414;border-radius:999px;padding:9px 26px 11px;transform:rotate(2deg)}
.card{position:absolute;left:548px;top:38px;width:610px;height:424px;background:#fff;border:3px solid #141414;border-radius:30px;box-shadow:10px 10px 0 #141414;padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.bag{border:2.5px solid #141414;border-radius:12px 12px 20px 20px;padding:9px 8px 0;display:flex;flex-direction:column;overflow:hidden}
.nm{display:flex;justify-content:space-between;font-size:17px;font-weight:800}.nm span{color:#6b6b6b;font-weight:700}
.g{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin:6px 0 8px}.g u{height:12px;border:2px solid #141414;border-radius:3px}.g u.on{background:#141414}
.st{display:flex;flex-direction:column-reverse;gap:6px;flex:1}
.slot{height:60px;border:2px solid #e3e3df;border-radius:11px;background:#f1f1ef}
.it{height:60px;border:2.5px solid #141414;border-radius:11px;padding:4px 8px;display:flex;flex-direction:column;justify-content:center}
.it b{font-size:17px;font-weight:800;line-height:1.2}.it span{display:flex;gap:4px;margin-top:3px}
.it i{font-style:normal;font-size:12px;font-weight:800;border:2px solid #141414;border-radius:999px;padding:0 6px;line-height:1.5}
.v{margin:8px -8px 0;padding:8px 0;text-align:center;font-size:17px;font-weight:800;border-top:2.5px solid #141414}
.v.ok{background:#bfe6c8}.v.no{background:#f3b0b0}
.belt{position:absolute;bottom:14px;width:170px}.belt .it{box-shadow:5px 5px 0 #141414}
</style></head><body><div class="floor"></div>
<div class="brand">MIND LOFT · DAILY PUZZLE</div><div class="title">Bag</div>
<div class="tag">Heavy low, eggs on top, cold together. Bag it all.</div><div class="cta">A new shop every day</div>
<div class="card">
${bag(1, 8, [it('Potatoes', 28, 5, 'any'), it('Beans', 10, 3, 'any')], 'Tears: 10 lb', 'no')}
${bag(2, 7, [it('Milk', 205, 4, '5', 1), it('Ice Cream', 330, 2, '2', 1), it('Peas', 120, 1, '2', 1)], 'Fits here', 'ok')}
${bag(3, 4, [it('Soup', 150, 3, 'any'), it('Eggs', 45, 1, '0')], 'Crushes the Eggs', 'no')}
</div>
<div class="belt" style="left:600px;transform:rotate(-2deg)">${it('Yogurt', 285, 2, '2', 1)}</div>
<div class="belt" style="left:790px;transform:rotate(1.5deg)">${it('Bread', 32, 1, '0')}</div>
<div class="belt" style="left:980px;transform:rotate(-1deg)">${it('Tomatoes', 2, 1, '1')}</div>
</body></html>`;
fs.writeFileSync(path.join(OUT, 'bag-og.html'), html);
console.log(path.join(OUT, 'bag-og.html'));
