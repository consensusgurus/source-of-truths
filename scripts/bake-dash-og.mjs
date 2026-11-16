// scripts/bake-dash-og.mjs: the hand-built share card for Dash (owner, 2026-11-15: "Also need cool share
// link image"). Its own world, not the family card of Seated and Errands: a town at night from above, lit
// windows, a glowing route from two restaurants to their doors, tips popping where the food landed, and
// three order tickets along the bottom. The board drawn is a DECOY written here, never one from the bank.
// bake-og.mjs skips this key (HAND_BAKED in lib/og-stage-cards.js).
//
//   node scripts/bake-dash-og.mjs      writes <tmp>/dash-og/dash-og.html
// then screenshot it at 1200x630 with any headless Chromium into public/og/dash.png, and cut the map
// (the right-hand 470px square from y 40; a 224px square) into public/og/tile/dash.png for the Details card.
import fs from 'fs';
import path from 'path';
import os from 'os';
const OUT = path.join(os.tmpdir(), 'dash-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));

// the town: 6 by 5 corners
const G = 96, X = (x) => 60 + x * G, Y = (y) => 62 + y * G;
let town = '';
const lit = [[0, 0, 1], [1, 0, 0], [2, 0, 1], [3, 0, 0], [4, 0, 1], [0, 1, 0], [1, 1, 1], [2, 1, 0], [3, 1, 1], [4, 1, 0], [0, 2, 1], [1, 2, 0], [2, 2, 1], [3, 2, 0], [4, 2, 1], [0, 3, 0], [1, 3, 1], [2, 3, 0], [3, 3, 1], [4, 3, 0]];
for (const [x, y, k] of lit) {
  town += `<rect x="${X(x) + 13}" y="${Y(y) + 13}" width="${G - 26}" height="${G - 26}" rx="10" fill="#2d2438"/>`;
  // windows: a few lit, most dark
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const on = (x * 7 + y * 5 + i * 3 + j * 2 + k) % 4 === 0; town += `<rect x="${X(x) + 25 + i * 17}" y="${Y(y) + 25 + j * 17}" width="10" height="10" rx="2" fill="${on ? '#fde68a' : '#3b3047'}"${on ? ' filter="url(#win)"' : ''}/>`; }
}
const route = [[0, 3], [0, 1], [2, 1], [2, 0], [4, 0], [4, 2], [5, 2], [5, 4], [3, 4]].map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)} ${Y(y)}`).join('');
town += `<path d="${route}" fill="none" stroke="#fb7185" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" opacity=".28" filter="url(#glow)"/>`;
town += `<path d="${route}" fill="none" stroke="#fda4af" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
const rest = (x, y, e, c) => `<circle cx="${X(x)}" cy="${Y(y)}" r="30" fill="${c}" stroke="#141414" stroke-width="3"/><text x="${X(x)}" y="${Y(y) + 13}" text-anchor="middle" font-size="36">${e}</text>`;
const door = (x, y, c, done) => `<rect x="${X(x) - 27}" y="${Y(y) - 27}" width="54" height="54" rx="12" fill="${done ? '#bbf7d0' : c}" stroke="#141414" stroke-width="3"/><path d="M${X(x) - 14} ${Y(y) + 2}l14-13 14 13M${X(x) - 10} ${Y(y) - 1}v14h20v-14" fill="none" stroke="#141414" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>`;
const tip = (x, y, t, c, r) => `<g transform="translate(${X(x)} ${Y(y)}) rotate(${r})"><rect x="-58" y="-74" width="116" height="44" rx="22" fill="${c}" stroke="#141414" stroke-width="3"/><text x="0" y="-43" text-anchor="middle" font-size="27" font-weight="800" fill="#141414">${t}</text></g>`;
town += rest(0, 1, '🍜', '#fde68a') + rest(2, 0, '🍣', '#bae6fd') + rest(1, 3, '🌮', '#fed7aa') + rest(3, 2, '🍕', '#ddd6fe');
town += door(4, 0, '#fde68a', true) + door(5, 2, '#bae6fd', true) + door(2, 4, '#fed7aa', false) + door(1, 2, '#ddd6fe', false);
town += tip(4, 0, '+$9', '#bbf7d0', -5) + tip(5, 2, '+$10', '#bbf7d0', 4);
town += `<circle cx="${X(0)}" cy="${Y(3)}" r="11" fill="#1a1423" stroke="#fda4af" stroke-width="6"/>`;
// the car, headlights first
town += `<g transform="translate(${X(3)} ${Y(4)})"><path d="M-20 0L-150 -34V34z" fill="#fde68a" opacity=".22"/><circle r="26" fill="#ffffff" stroke="#141414" stroke-width="3"/><text x="0" y="12" text-anchor="middle" font-size="30">🚗</text></g>`;

const ticket = (left, rot, e, n, t, hot) => `<div class="tk" style="left:${left}px;transform:rotate(${rot}deg)"><span class="e">${e}</span><span><b>${n}</b><small>${hot}</small></span><i>${t}</i></div>`;
fs.writeFileSync(path.join(OUT, 'dash-og.html'), `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;background:#1a1423;color:#fff;position:relative}
.sky{position:absolute;inset:0;background:radial-gradient(900px 520px at 78% 40%,#3a2440 0%,#1a1423 70%)}
.map{position:absolute;left:590px;top:34px;width:560px;height:467px;transform:rotate(-5deg)}
.map svg{display:block;font-family:Manrope}
.brand{position:absolute;left:64px;top:58px;font-weight:800;font-size:22px;letter-spacing:.12em;color:#fda4af}
.title{position:absolute;left:150px;top:104px;font-size:168px;font-weight:800;line-height:1.1;letter-spacing:-.03em;font-style:italic}
.spd{position:absolute;left:40px;height:12px;border-radius:99px;background:#fb7185}
.tag{position:absolute;left:64px;top:322px;width:510px;font-size:31px;font-weight:700;line-height:1.26}
.tag b{color:#fda4af;font-weight:800}
.cta{position:absolute;left:64px;top:436px;font-size:26px;font-weight:800;background:#fb7185;color:#141414;border-radius:999px;padding:9px 26px 11px;transform:rotate(-2deg)}
.floor{position:absolute;left:0;right:0;bottom:0;height:64px;background:#fb7185}
.tk{position:absolute;bottom:22px;display:flex;align-items:center;gap:12px;background:#fff;color:#141414;border:3px solid #141414;border-radius:18px;padding:9px 16px 10px 12px;box-shadow:6px 6px 0 #141414}
.tk .e{font-size:38px;line-height:1}
.tk b{display:block;font-size:23px;font-weight:800;line-height:1.2}
.tk small{display:block;font-size:16px;font-weight:700;color:#6b6b6b;line-height:1.3}
.tk i{font-style:normal;font-size:25px;font-weight:800;background:#bbf7d0;border:3px solid #141414;border-radius:999px;padding:1px 13px 3px;margin-left:6px}
</style></head><body><div class="sky"></div>
<div class="map"><svg viewBox="0 -40 600 500" width="560" height="467" overflow="visible"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter><filter id="win" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${town}</svg></div>
<div class="floor"></div>
<div class="brand">MIND LOFT · DAILY PUZZLE</div>
<div class="spd" style="top:152px;width:96px"></div><div class="spd" style="top:196px;width:70px;left:66px"></div><div class="spd" style="top:240px;width:92px;left:28px"></div>
<div class="title">Dash</div>
<div class="tag">Too many orders. One shift. <b>How much can you make in tips?</b></div>
<div class="cta">A new shift every night</div>
${ticket(540, -3, '🌮', 'Luna Tacos', '$7', 'Hot until 6:48')}${ticket(840, 2, '🍕', "Sal's Slice", '$5', 'Hot until 6:46')}
</body></html>`);
console.log(OUT);
