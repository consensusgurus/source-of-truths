// scripts/bake-pack-og.mjs: the hand-built Pack share card (owner, 2026-11-14: "Show me the share link
// image"). A soft magenta field (Visual), the name in a tilted black tag, and a card holding a moving van
// about three quarters loaded, drawn by the board's own drawing code (lib/pack-art.js drawPieces), with
// the four things still to load standing on the curb in front of it. The load is a DECOY dealt from its
// own seed, never a board from the bank, so the card leaks nothing. bake-og.mjs skips 'pack' (HAND_BAKED
// in lib/og-stage-cards.js) so a full re-bake keeps this.
//
//   node scripts/bake-pack-og.mjs        writes <tmp>/pack-og/pack-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/pack.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { deal, rng, hash } from './gen-pack.mjs';
import { SPEC } from './gen-pack-spec.mjs';
const OUT = path.join(os.tmpdir(), 'pack-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));
let got = null;
for (let salt = 0; !got; salt++) got = deal(SPEC[0], rng(hash(`pack-og-${salt}`)));
const P = { W: SPEC[0][2], D: SPEC[0][3], H: SPEC[0][4], items: got.items, sol: got.sol };
// the model and the drawing, inlined as one classic script (a file:// page cannot import modules)
const strip = (f) => fs.readFileSync(f, 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, '');
const FIELD = '#f3c4f5', ROAD = '#e7a9ea';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;background:${FIELD};color:#141414;position:relative}
.road{position:absolute;left:0;right:0;bottom:0;height:78px;background:${ROAD};border-top:3px solid #141414}
.brand{position:absolute;left:64px;top:58px;font-weight:800;font-size:22px;letter-spacing:.12em}
.title{position:absolute;left:56px;top:112px;font-size:156px;font-weight:800;line-height:1.12;background:#141414;color:#fff;border-radius:28px;padding:0 36px 10px;transform:rotate(-4deg);box-shadow:10px 10px 0 #fff}
.tag{position:absolute;left:64px;top:338px;width:450px;font-size:35px;font-weight:700;line-height:1.28}
.cta{position:absolute;left:64px;top:474px;font-size:26px;font-weight:800;background:#fff;border:3px solid #141414;border-radius:999px;padding:9px 26px 11px;transform:rotate(2deg)}
.card{position:absolute;left:548px;top:38px;width:610px;height:424px;background:#fff;border:3px solid #141414;border-radius:30px;box-shadow:10px 10px 0 #141414}
canvas{position:absolute}
</style></head><body><div class="road"></div>
<div class="brand">MIND LOFT · DAILY PUZZLE</div><div class="title">Pack</div>
<div class="tag">Load it all in. A car trunk on Monday, a moving van by Sunday.</div><div class="cta">A new load every day</div>
<div class="card"><canvas id="van" style="left:0;top:0;width:604px;height:418px"></canvas></div>
<script>
${strip('lib/pack-engine.js')}
${strip('lib/pack-art.js')}
const P = ${JSON.stringify(P)}, shapes = P.items.map(shapeOf), S = 3;
const n = P.sol.length - 4, placed = P.sol.slice(0, n), curb = P.sol.slice(n);
(function van() {
  const c = document.getElementById('van'), w = 604, h = 418, x = c.getContext('2d'); c.width = w * S; c.height = h * S; x.setTransform(S, 0, 0, S, 0, 0);
  const span = P.W + P.D, a = Math.min((w - 40) / span, (h - 30) / (span / 2 + P.H)), ox = (w - span * a) / 2 + P.D * a, oy = (h - (span * a / 2 + P.H * a)) / 2 + P.H * a;
  const Pf = (u, v, z) => [ox + (u - v) * a, oy + ((u + v) * a) / 2 - z * a];
  const seg = (p, q, st) => { x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.strokeStyle = st; x.lineWidth = 1.5; x.stroke(); };
  const quad = (pts, f) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = f; x.fill(); };
  const W = P.W, D = P.D, H = P.H;
  quad([Pf(0, 0, 0), Pf(0, D, 0), Pf(0, D, H), Pf(0, 0, H)], '#f1f1ef'); quad([Pf(0, 0, 0), Pf(W, 0, 0), Pf(W, 0, H), Pf(0, 0, H)], '#e7e7e3');
  for (let i = 0; i <= W; i++) { seg(Pf(i, 0, 0), Pf(i, D, 0), '#dcdad4'); seg(Pf(i, 0, 0), Pf(i, 0, H), '#dcdad4'); }
  for (let i = 0; i <= D; i++) { seg(Pf(0, i, 0), Pf(W, i, 0), '#dcdad4'); seg(Pf(0, i, 0), Pf(0, i, H), '#dcdad4'); }
  for (let i = 0; i <= H; i++) { seg(Pf(0, 0, i), Pf(0, D, i), '#dcdad4'); seg(Pf(0, 0, i), Pf(W, 0, i), '#dcdad4'); }
  [[Pf(0, 0, 0), Pf(W, 0, 0)], [Pf(W, 0, 0), Pf(W, D, 0)], [Pf(W, D, 0), Pf(0, D, 0)], [Pf(0, D, 0), Pf(0, 0, 0)], [Pf(0, 0, 0), Pf(0, 0, H)], [Pf(0, D, 0), Pf(0, D, H)], [Pf(W, 0, 0), Pf(W, 0, H)], [Pf(0, 0, H), Pf(0, D, H)], [Pf(0, 0, H), Pf(W, 0, H)]].forEach((e) => seg(e[0], e[1], '#141414'));
  drawPieces(x, placed.map((q) => ({ shape: shapes[q.i], r: q.r, pos: q.p })), { r: 0, W, D }, Pf, a, {});
})();
// the four still to load, standing on the curb
let left = 540;
curb.forEach((q, k) => {
  const sh = shapes[q.i], e = orient(sh, 0).ext, a = 40, w = (e[0] + e[1]) * a + 8, h = (e[0] + e[1]) * a / 2 + e[2] * a + 8;
  const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; c.style.width = w + 'px'; c.style.height = h + 'px'; c.style.left = left + 'px'; c.style.bottom = (10 + (k % 2) * 12) + 'px';
  const x = c.getContext('2d'); x.setTransform(S, 0, 0, S, 0, 0);
  const ox = 4 + e[1] * a, oy = 4 + e[2] * a;
  drawPieces(x, [{ shape: sh, r: 0, pos: [0, 0, 0] }], { r: 0, W: e[0], D: e[1] }, (u, v, z) => [ox + (u - v) * a, oy + ((u + v) * a) / 2 - z * a], a, {});
  document.body.appendChild(c); left += Math.max(120, w * 0.78);
});
</script></body></html>`;
fs.writeFileSync(path.join(OUT, 'pack-og.html'), html);
console.log(path.join(OUT, 'pack-og.html'), '·', got.items.length, 'items, on the curb:', P.sol.slice(-4).map((q) => P.items[q.i].n).join(', '));
