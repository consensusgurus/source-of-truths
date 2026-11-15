// scripts/bake-pack-og.mjs: the hand-built Pack share card. REDRAWN 2026-11-15 (owner: Pack, Chef, Seated
// and Bag looked like one card; give each its own world like Mop, Carmen and Tape). Moving day: a blue sky
// over a driveway, the name in the Mop/Carmen header, and the moving van about three quarters loaded, drawn by the board's own drawing code (lib/pack-art.js drawPieces), with
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
const FIELD = '#7cc2ef';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;color:#0e2a47;position:relative;
background:radial-gradient(150px 46px at 900px 60px,#fff 96%,transparent),radial-gradient(110px 40px at 990px 44px,#fff 96%,transparent),radial-gradient(130px 40px at 330px 520px,rgba(255,255,255,.0) 96%,transparent),
radial-gradient(120px 34px at 610px 96px,rgba(255,255,255,.85) 96%,transparent),linear-gradient(#bfe6fb 0,#7cc2ef 62%,#7cc2ef 100%)}
.drive{position:absolute;left:0;right:0;bottom:0;height:132px;background:#5d6470;border-top:8px solid #eef1f4}
.l{position:absolute;left:64px;top:54px;width:520px;z-index:2}
.brand{font-weight:800;font-size:23px;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:27px;height:23px;background:#0e2a47;clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:44px;font-weight:800;font-size:17px;letter-spacing:.13em;text-transform:uppercase;color:#fff;background:#0e2a47;border-radius:999px;padding:8px 17px}
h1{margin:12px 0 0;font-weight:800;font-size:176px;line-height:.92;letter-spacing:-.05em;color:#0e2a47;text-shadow:0 6px 0 rgba(255,255,255,.55)}
.sub{margin-top:18px;font-weight:700;font-size:30px;line-height:1.24;max-width:440px}
.sub b{font-weight:800}
.go{position:absolute;left:64px;bottom:34px;font-weight:800;font-size:22px;color:#0e2a47;background:#fff;border-radius:999px;padding:13px 26px;z-index:2}
.url{position:absolute;left:226px;bottom:48px;font-weight:700;font-size:20px;color:#eef1f4;z-index:2}
.van{position:absolute;left:520px;top:34px;width:680px;height:470px;filter:drop-shadow(18px 26px 14px rgba(14,42,71,.35))}
canvas{position:absolute}
.curb{filter:drop-shadow(6px 10px 6px rgba(0,0,0,.35))}
</style></head><body><div class="drive"></div>
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily packing puzzle</div><h1>Pack</h1>
<div class="sub">Load it all in. <b>A trunk on Monday,</b> a moving van by Sunday.</div></div>
<div class="go">Play free</div><div class="url">mindloftdaily.com/pack</div>
<div class="van"><canvas id="van" style="left:0;top:0;width:680px;height:470px"></canvas></div>
<script>
${strip('lib/pack-engine.js')}
${strip('lib/pack-art.js')}
const P = ${JSON.stringify(P)}, shapes = P.items.map(shapeOf), S = 3;
const n = P.sol.length - 4, placed = P.sol.slice(0, n), curb = P.sol.slice(n);
(function van() {
  const c = document.getElementById('van'), w = 680, h = 470, x = c.getContext('2d'); c.width = w * S; c.height = h * S; x.setTransform(S, 0, 0, S, 0, 0);
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
let left = 640;
curb.forEach((q, k) => {
  const sh = shapes[q.i], e = orient(sh, 0).ext, a = 40, w = (e[0] + e[1]) * a + 8, h = (e[0] + e[1]) * a / 2 + e[2] * a + 8;
  const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; c.style.width = w + 'px'; c.style.height = h + 'px'; c.style.left = left + 'px'; c.style.bottom = (20 + (k % 2) * 14) + 'px'; c.className = 'curb';
  const x = c.getContext('2d'); x.setTransform(S, 0, 0, S, 0, 0);
  const ox = 4 + e[1] * a, oy = 4 + e[2] * a;
  drawPieces(x, [{ shape: sh, r: 0, pos: [0, 0, 0] }], { r: 0, W: e[0], D: e[1] }, (u, v, z) => [ox + (u - v) * a, oy + ((u + v) * a) / 2 - z * a], a, {});
  document.body.appendChild(c); left += Math.max(110, w * 0.72);
});
</script></body></html>`;
fs.writeFileSync(path.join(OUT, 'pack-og.html'), html);
console.log(path.join(OUT, 'pack-og.html'), '·', got.items.length, 'items, on the curb:', P.sol.slice(-4).map((q) => P.items[q.i].n).join(', '));
