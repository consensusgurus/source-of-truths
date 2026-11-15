// scripts/bake-practical-og.mjs: the hand-built share cards for Seated and Errands (Bag has its own,
// bake-bag-og.mjs). One look for the family: a soft rose field (Logic), the name in a tilted black tag, a
// white card with the board, and pieces still to place along the floor. Every board drawn is a DECOY
// written here, never one from a bank. bake-og.mjs skips these keys (HAND_BAKED in lib/og-stage-cards.js).
//
//   node scripts/bake-practical-og.mjs      writes <tmp>/practical-og/{seated,errands}-og.html
// then screenshot each at 1200x630 with any headless Chromium into public/og/<key>.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
const OUT = path.join(os.tmpdir(), 'practical-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));
const col = (h) => `hsl(${h} 64% 83%)`;
const page = (title, size, tag, cta, card, floor) => `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;background:#fecdd3;color:#141414;position:relative}
.floor{position:absolute;left:0;right:0;bottom:0;height:78px;background:#fda4af;border-top:3px solid #141414}
.brand{position:absolute;left:64px;top:58px;font-weight:800;font-size:22px;letter-spacing:.12em}
.title{position:absolute;left:56px;top:112px;font-size:${size}px;font-weight:800;line-height:1.12;background:#141414;color:#fff;border-radius:28px;padding:0 34px 12px;transform:rotate(-4deg);box-shadow:10px 10px 0 #fff}
.tag{position:absolute;left:64px;top:330px;width:430px;font-size:33px;font-weight:700;line-height:1.28}
.cta{position:absolute;left:64px;top:474px;font-size:26px;font-weight:800;background:#fff;border:3px solid #141414;border-radius:999px;padding:9px 26px 11px;transform:rotate(2deg)}
.card{position:absolute;left:548px;top:38px;width:610px;height:424px;background:#fff;border:3px solid #141414;border-radius:30px;box-shadow:10px 10px 0 #141414;overflow:hidden}
.card svg{display:block;font-family:Manrope}
.rule{position:absolute;left:0;right:0;height:52px;display:flex;align-items:center;gap:14px;padding:0 22px;font-size:21px;font-weight:700;border-top:2.5px solid #141414}
.rule i{font-style:normal;flex:none;width:30px;height:30px;border-radius:99px;border:2.5px solid #141414;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800}
.rule b{font-weight:800}
.chip{position:absolute;bottom:26px;font-size:30px;font-weight:800;border:3px solid #141414;border-radius:999px;padding:10px 30px 12px;box-shadow:5px 5px 0 #141414}
</style></head><body><div class="floor"></div>
<div class="brand">MIND LOFT · DAILY PUZZLE</div><div class="title">${title}</div>
<div class="tag">${tag}</div><div class="cta">${cta}</div>
<div class="card">${card}</div>${floor}
</body></html>`;
const chip = (n, h, left, rot) => `<div class="chip" style="left:${left}px;background:${col(h)};transform:rotate(${rot}deg)">${n}</div>`;
const rule = (top, ok, text) => `<div class="rule" style="top:${top}px;background:${ok ? '#eaf7ed' : '#fbe4e4'}"><i style="background:${ok ? '#bfe6c8' : '#f3b0b0'}">${ok ? '✓' : '✕'}</i><span>${text}</span></div>`;

// ---- Seated: two tables part filled, one request met and one broken ----
const TABLES = [
  { cx: 152, cy: 156, name: 'Table 1', note: 'by the door', seats: [['Rose', 350], ['Bill', 205], ['Zoe', 265], null, ['Max', 20], ['May', 45]] },
  { cx: 452, cy: 156, name: 'Table 2', note: 'by the band', seats: [['Ted', 150], ['Hale', 180], null, ['Dana', 310], ['Joe', 95], null] },
];
const table = (t) => `<circle cx="${t.cx}" cy="${t.cy}" r="56" fill="#f1f1ef" stroke="#141414" stroke-width="2.5"/>
<text x="${t.cx}" y="${t.cy - 3}" text-anchor="middle" font-size="22" font-weight="800">${t.name}</text><text x="${t.cx}" y="${t.cy + 19}" text-anchor="middle" font-size="15" font-weight="700" fill="#6b6b6b">${t.note}</text>
${t.seats.map((s, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 3, x = t.cx + Math.cos(a) * 96, y = t.cy + Math.sin(a) * 96;
    return `<circle cx="${x}" cy="${y}" r="35" fill="${s ? col(s[1]) : '#ffffff'}" stroke="#141414" stroke-width="2.5"/>${s ? `<text x="${x}" y="${y + 7.5}" text-anchor="middle" font-size="21" font-weight="800">${s[0]}</text>` : ''}`; }).join('')}`;
fs.writeFileSync(path.join(OUT, 'seated-og.html'), page('Seated', 122, 'Seat the room. A dinner party on Monday, a wedding by Sunday.', 'A new guest list every day',
  `<svg viewBox="0 0 604 314" width="604" height="314">${TABLES.map(table).join('')}</svg>${rule(314, true, '<b>Rose and Bill</b> came together. <b>Side by side.</b>')}${rule(366, false, '<b>Ted and Joe</b> are not speaking. <b>Different tables.</b>')}`,
  chip('Finn', 240, 590, -3) + chip('Ivy', 120, 770, 2) + chip('Pearl', 30, 925, -2)));

// ---- Errands: a town, a route in progress, a shop that shuts ----
const X = (x) => 62 + x * 96, Y = (y) => 50 + y * 86;
const STOPS = [['Bank', 1, 0, 45, 1], ['Bakery', 3, 1, 20, 2], ['Cleaners', 5, 0, 205, 0], ['Creamery', 4, 2, 330, 0], ['Market', 1, 2, 120, 3]];
let town = '';
for (let y = 0; y < 2; y++) for (let x = 0; x < 5; x++) town += `<rect x="${X(x) + 12}" y="${Y(y) + 12}" width="72" height="62" rx="8" fill="#eef4ea"/>`;
for (let y = 0; y < 3; y++) town += `<line x1="${X(0)}" y1="${Y(y)}" x2="${X(5)}" y2="${Y(y)}" stroke="#dcdcd6" stroke-width="13" stroke-linecap="round"/>`;
for (let x = 0; x < 6; x++) town += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(2)}" stroke="#dcdcd6" stroke-width="13" stroke-linecap="round"/>`;
const route = [[0, 1], [0, 0], [1, 0], [1, 1], [3, 1], [3, 2], [1, 2]].map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)} ${Y(y)}`).join('');
town += `<path d="${route}" fill="none" stroke="#141414" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
town += `<rect x="${X(0) - 22}" y="${Y(1) - 22}" width="44" height="44" rx="9" fill="#141414"/><path d="M${X(0) - 12} ${Y(1) + 1}l12-11 12 11M${X(0) - 8} ${Y(1) - 1}v12h16v-12" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
for (const [n, x, y, h, k] of STOPS) town += `<circle cx="${X(x)}" cy="${Y(y)}" r="23" fill="${k ? '#fecdd3' : col(h)}" stroke="#141414" stroke-width="2.5"/><text x="${X(x)}" y="${Y(y) + 44}" text-anchor="middle" font-size="18" font-weight="800" stroke="#fff" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${n}</text>${k ? `<circle cx="${X(x) + 19}" cy="${Y(y) - 19}" r="12" fill="#141414"/><text x="${X(x) + 19}" y="${Y(y) - 13}" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">${k}</text>` : ''}`;
fs.writeFileSync(path.join(OUT, 'errands-og.html'), page('Errands', 112, 'Five stops, three rules. How soon can you be home?', 'A new round every day',
  `<svg viewBox="0 0 604 314" width="604" height="314">${town}</svg>${rule(314, true, 'The Bank <b>shuts at 9:45</b>. You arrive at 9:08.')}${rule(366, false, 'The ice cream must be <b>home within 30 minutes</b>.')}`,
  chip('9:00 Leave Home', 45, 560, -2) + chip('Home at 11:10', 150, 890, 2)));
console.log(OUT);
