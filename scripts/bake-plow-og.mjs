// scripts/bake-plow-og.mjs: the hand-built Plow share card (owner, 2026-11-17: "Push to live now with good
// share link image"). A winter-blue night sky full of snow, a real Plow town tilted on it, half its streets
// plowed to asphalt, and the orange plow truck itself coming in big from the corner, blade first. The town is
// drawn by lib/plow-art.js, the same code as the board. It is a DECOY town dealt for a date far outside the
// bank, so the card leaks nothing. bake-og.mjs skips 'plow' (HAND_BAKED in lib/og-stage-cards.js) so a full
// re-bake keeps it.
//
//   node scripts/bake-plow-og.mjs        writes <tmp>/plow-og/plow-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/plow.png:
//   google-chrome --headless --no-sandbox --hide-scrollbars --window-size=1200,630 --screenshot=public/og/plow.png file://<tmp>/plow-og/plow-og.html
// and cut the Details-card tile from it: crop 620,20 to 1200,600, 224px, into public/og/tile/plow.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { plowModel, pathD } from '../lib/plow-engine.js';
import { drawTown, TRUCK, PLOW_LIGHT, PLOW_ART_CSS } from '../lib/plow-art.js';
import { dealDay } from './gen-plow.mjs';
const OUT = path.join(os.tmpdir(), 'plow-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));

// A decoy town: a Wednesday-sized deal for a date the bank will never reach.
const T = { num: 0, ...dealDay('2031-02-12', 7) };
const M = plowModel(T), art = drawTown(T, M);
const half = new Set(T.sol.slice(0, Math.round(T.sol.length * 0.55)));
const at = (() => { const e = T.edges[T.sol[Math.round(T.sol.length * 0.55) - 1]]; return e; })();
let plowed = '';
M.E.forEach((e) => { if (half.has(e.i)) plowed += `<path class="g-asph" d="${pathD(e.P)}" stroke-width="23"/><path class="g-cl" d="${pathD(e.P)}" stroke-width="1.8"/>`; });
const nodesOn = new Set(); T.sol.slice(0, half.size).forEach((i) => { nodesOn.add(T.edges[i].a); nodesOn.add(T.edges[i].b); });
nodesOn.forEach((n) => { const p = T.nodes[n]; plowed += `<circle class="g-asphf" cx="${p[0]}" cy="${p[1]}" r="11.5"/>`; });
// the little truck on the board, at the end of the plowed run
const walkTo = (() => { let cur = T.start; for (const i of T.sol.slice(0, half.size)) { const e = T.edges[i]; cur = e.a === cur ? e.b : e.a; } return cur; })();
const nx = T.edges[T.sol[half.size]], nxt = nx.a === walkTo ? T.nodes[nx.b] : T.nodes[nx.a], here = T.nodes[walkTo];
const ang = Math.atan2(nxt[1] - here[1], nxt[0] - here[0]) * 180 / Math.PI + 90;
void at;
const [vx, vy, vw, vh] = M.vb;
const town = `<svg viewBox="${vx} ${vy} ${vw} ${vh}">${art.town}${plowed}${art.islands}<g transform="translate(${here[0]} ${here[1]}) rotate(${ang.toFixed(1)}) scale(1.1)">${TRUCK.replace('class="night"', 'style="display:none"').replace('class="spray"', 'class="spray" style="display:none"')}</g></svg>`;
let flakes = '';
const R = (() => { let a = 99; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
for (let i = 0; i < 120; i++) { const r = 1 + R() * 3.4; flakes += `<circle cx="${(R() * 1200).toFixed(0)}" cy="${(R() * 630).toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(0.25 + R() * 0.55).toFixed(2)}"/>`; }
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(manrope-latin-800-normal.woff2);font-weight:800}
@font-face{font-family:M;src:url(manrope-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:M;src:url(manrope-latin-600-normal.woff2);font-weight:600}
*{box-sizing:border-box}body{margin:0}
#c{width:1200px;height:630px;position:relative;overflow:hidden;font-family:M,sans-serif;color:#fff;
background-color:#173352;
background-image:radial-gradient(820px 560px at 80% 55%,rgba(170,205,240,.35),transparent 66%),radial-gradient(560px 460px at 0% 0%,rgba(6,18,36,.6),transparent 70%),linear-gradient(160deg,#16304e 0%,#22476f 55%,#2f5f8f 100%)}
.plow{${PLOW_LIGHT}}
${PLOW_ART_CSS}
.stage{position:absolute;left:455px;top:-160px;width:880px;height:880px;perspective:1700px}
.bd{position:absolute;inset:90px;transform:rotateX(48deg) rotateZ(-28deg);transform-origin:50% 50%;filter:drop-shadow(34px 54px 26px rgba(4,14,30,.6))}
.bd svg{width:100%;height:100%;display:block;overflow:hidden;border-radius:16px;font-family:M,sans-serif}
.big{position:absolute;right:-40px;bottom:-150px;width:330px;height:440px;transform:rotate(-38deg);filter:drop-shadow(-14px 22px 16px rgba(4,14,30,.55))}
.big svg{width:100%;height:100%;overflow:visible}
.flk{position:absolute;inset:0;width:1200px;height:630px}
.l{position:absolute;left:64px;top:54px;width:520px;z-index:2}
.brand{font-weight:800;font-size:23px;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:27px;height:23px;background:#fff;clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:52px;font-weight:800;font-size:17px;letter-spacing:.13em;text-transform:uppercase;color:#14304f;background:#dbeafe;border-radius:999px;padding:8px 17px}
h1{margin:14px 0 0;font-weight:800;font-size:176px;line-height:.92;letter-spacing:-.05em;text-shadow:0 6px 0 rgba(6,18,36,.35)}
.sub{margin-top:20px;font-weight:700;font-size:31px;line-height:1.24;color:#e3eefc;max-width:470px}
.sub b{color:#fff;font-weight:800}
.go{position:absolute;left:64px;bottom:52px;font-weight:800;font-size:22px;color:#14304f;background:#fff;border-radius:999px;padding:13px 26px;z-index:2}
.url{position:absolute;left:266px;bottom:66px;font-weight:700;font-size:20px;color:#dbeafe;z-index:2}
</style></head><body><div id="c">
<div class="stage"><div class="bd plow">${town}</div></div>
<div class="big plow"><svg viewBox="-34 -50 68 86">${TRUCK.replace('class="night"', 'style="display:none"')}</svg></div>
<svg class="flk" viewBox="0 0 1200 630">${flakes}</svg>
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily snow puzzle</div><h1>Plow</h1>
<div class="sub">Every street. <b>Exactly once.</b><br>Then back to the barn.</div></div>
<div class="go">Play free</div><div class="url">mindloftdaily.com/plow</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'plow-og.html'), html);
console.log(path.join(OUT, 'plow-og.html'));
