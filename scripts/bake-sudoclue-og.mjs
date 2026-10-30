// scripts/bake-sudoclue-og.mjs: the hand-built Sudoclue share card (owner, 2026-10-30: "this one needs a
// really, really cool share link image"). The stock card from bake-og.mjs is a flat colour panel; this one
// draws the real Central Park board tilted on a dark ground, under a magnifier and crime-scene tape, with the
// cast's faces marked "?". The tokens are a DECOY arrangement, never a board's answer, so the card leaks
// nothing. bake-og.mjs skips 'sudoclue' (HAND_BAKED in lib/og-stage-cards.js) so a full re-bake keeps this.
//
//   node scripts/bake-sudoclue-og.mjs        writes <tmp>/sudoclue-og/sudoclue-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/sudoclue.png.
import { renderBoard, portraitSVG } from '../lib/sudoclue-art.js';
import { PLACES } from '../lib/sudoclue-places.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
const OUT = path.join(os.tmpdir(), 'sudoclue-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));
// A decoy arrangement, not any board's answer.
const board=renderBoard(PLACES['central-park'],{place:{Taylor:[0,2],Ted:[2,6],Serena:[4,0],Brad:[6,4],Meryl:[5,5]},cross:{"3,1":1,"1,6":1,"6,3":1},hl:[[4,0],[6,4]]});
const cast=['Donald','Joe','Taylor','Brad','Serena','Ted','Meryl'];
const ring={Donald:"#c2410c",Joe:"#0e7490",Taylor:"#1d4ed8",Brad:"#4d7c0f",Serena:"#b45309",Ted:"#a21caf",Meryl:"#9d174d"};
const faces=cast.map(n=>`<div class="f"><div class="pt" style="box-shadow:0 0 0 3px ${ring[n]}">${portraitSVG(n)}</div><div class="q">?</div></div>`).join('');
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(manrope-latin-800-normal.woff2);font-weight:800}
@font-face{font-family:M;src:url(manrope-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:M;src:url(manrope-latin-600-normal.woff2);font-weight:600}
*{box-sizing:border-box}body{margin:0}
#c{width:1200px;height:630px;position:relative;overflow:hidden;font-family:M,sans-serif;color:#e9edf4;
background:radial-gradient(900px 520px at 88% 45%,rgba(251,113,133,.28),transparent 60%),radial-gradient(700px 500px at 0% 100%,rgba(125,211,252,.10),transparent 60%),#0b0f1a}
.stage{position:absolute;left:640px;top:-40px;width:720px;height:720px;perspective:1500px}
.bd{position:absolute;inset:60px;transform:rotateX(46deg) rotateZ(-28deg);transform-origin:50% 50%;border-radius:14px;overflow:hidden;box-shadow:40px 60px 80px rgba(0,0,0,.65),0 0 0 6px #08222e}
.bd svg{width:100%;height:100%;display:block}
.lens{position:absolute;left:850px;top:310px;width:200px;height:200px;border-radius:50%;border:16px solid #111827;box-shadow:0 0 0 4px #fb7185,0 30px 50px rgba(0,0,0,.55), inset 0 0 40px rgba(255,255,255,.35);background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.45),rgba(255,255,255,.06) 45%,rgba(251,113,133,.10) 70%)}
.handle{position:absolute;left:1008px;top:480px;width:150px;height:30px;border-radius:15px;background:linear-gradient(#2b2f3a,#111827);transform:rotate(42deg);transform-origin:0 50%;box-shadow:0 18px 30px rgba(0,0,0,.5)}
.l{position:absolute;left:64px;top:56px;width:560px;z-index:2}
.brand{font-weight:800;font-size:22px;letter-spacing:.02em;color:#e9edf4;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:26px;height:22px;background:#fb7185;clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:44px;font-weight:800;font-size:17px;letter-spacing:.12em;text-transform:uppercase;color:#fb7185;border:2px solid rgba(251,113,133,.55);border-radius:999px;padding:7px 16px}
h1{margin:16px 0 0;font-weight:800;font-size:118px;line-height:.95;letter-spacing:-.045em}
h1 b{color:#fb7185}
.sub{margin-top:18px;font-weight:700;font-size:28px;max-width:520px;line-height:1.25;color:#cfd6e3}
.faces{display:flex;gap:12px;margin-top:30px}
.f{position:relative}
.pt{width:54px;height:54px;border-radius:50%;overflow:hidden;background:#fff}
.q{position:absolute;right:-6px;bottom:-6px;width:24px;height:24px;border-radius:50%;background:#fb7185;color:#08222e;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;border:2px solid #0b0f1a}
.tag{margin-top:16px;font-weight:800;font-size:24px;letter-spacing:.01em;color:#fb7185}
.url{position:absolute;left:64px;bottom:44px;font-weight:700;font-size:22px;color:#8b95a8}
.play{position:absolute;left:64px;bottom:88px;display:none}
.tape{position:absolute;right:-60px;top:36px;transform:rotate(18deg);background:#fde047;color:#111827;font-weight:800;font-size:18px;letter-spacing:.24em;padding:8px 90px;box-shadow:0 8px 20px rgba(0,0,0,.35)}
</style></head><body><div id="c">
<div class="stage"><div class="bd">${board}</div></div>
<div class="lens"></div><div class="handle"></div>
<div class="tape">CRIME SCENE · DO NOT CROSS</div>
<div class="l"><div class="brand"><svg width="30" height="28" viewBox="5.5 8.5 109 102"><path d="M60 10L113 43V109H93V63L60 86L27 63V109H7V43Z" fill="#fb7185"/></svg>Mind Loft</div>
<div class="chip">Daily Murder Mystery</div>
<h1>Sudo<b>clue</b></h1>
<div class="sub">One suspect per row and column.<br>Every role hidden. One killer.</div>
<div class="faces">${faces}</div><div class="tag">Realish people. Real places.</div></div>
<div class="url">mindloftdaily.com/sudoclue · play free</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'sudoclue-og.html'), html);
console.log('wrote ' + path.join(OUT, 'sudoclue-og.html'));
