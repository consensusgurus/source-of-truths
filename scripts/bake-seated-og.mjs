// scripts/bake-seated-og.mjs: the hand-built Seated share card. A soft rose field (Logic), the name in a
// tilted black tag, and a card holding two round tables from above, most chairs taken, with three guests
// still standing on the floor in front. The guests are a DECOY written here, never a board from the bank,
// so the card leaks nothing. bake-og.mjs skips 'seated' (HAND_BAKED in lib/og-stage-cards.js) so a full
// re-bake keeps this.
//
//   node scripts/bake-seated-og.mjs      writes <tmp>/seated-og/seated-og.html beside the Manrope woff2 files
// then screenshot that page at 1200x630 with any headless Chromium into public/og/seated.png.
import fs from 'fs';
import path from 'path';
import os from 'os';
const OUT = path.join(os.tmpdir(), 'seated-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));
const FIELD = '#fecdd3', FLOOR = '#fda4af';
const col = (h) => `hsl(${h} 64% 83%)`;
const TABLES = [
  { cx: 160, cy: 205, name: 'Table 1', note: 'by the door', seats: [['Rose', 350], ['Bill', 205], ['Zoe', 265], null, ['Max', 20], ['May', 45]] },
  { cx: 445, cy: 205, name: 'Table 2', note: 'by the band', seats: [['Ted', 150], ['Hale', 180], null, ['Dana', 310], null, ['Joe', 95]] },
];
const table = (t) => `<circle cx="${t.cx}" cy="${t.cy}" r="62" fill="#f1f1ef" stroke="#141414" stroke-width="2.5"/>
<text x="${t.cx}" y="${t.cy - 4}" text-anchor="middle" font-size="23" font-weight="800">${t.name}</text><text x="${t.cx}" y="${t.cy + 20}" text-anchor="middle" font-size="16" font-weight="700" fill="#6b6b6b">${t.note}</text>
${t.seats.map((s, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 3, x = t.cx + Math.cos(a) * 104, y = t.cy + Math.sin(a) * 104;
    return `<circle cx="${x}" cy="${y}" r="38" fill="${s ? col(s[1]) : '#ffffff'}" stroke="#141414" stroke-width="2.5"/>${s ? `<text x="${x}" y="${y + 8}" text-anchor="middle" font-size="22" font-weight="800">${s[0]}</text>` : ''}`; }).join('')}`;
const chip = (n, h, left, rot) => `<div class="chip" style="left:${left}px;background:${col(h)};transform:rotate(${rot}deg)">${n}</div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${[700, 800].map((w) => `@font-face{font-family:Manrope;font-weight:${w};src:url(manrope-latin-${w}-normal.woff2)}`).join('')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope;background:${FIELD};color:#141414;position:relative}
.floor{position:absolute;left:0;right:0;bottom:0;height:78px;background:${FLOOR};border-top:3px solid #141414}
.brand{position:absolute;left:64px;top:58px;font-weight:800;font-size:22px;letter-spacing:.12em}
.title{position:absolute;left:52px;top:118px;font-size:128px;font-weight:800;line-height:1.12;background:#141414;color:#fff;border-radius:28px;padding:0 32px 10px;transform:rotate(-4deg);box-shadow:10px 10px 0 #fff}
.tag{position:absolute;left:64px;top:330px;width:440px;font-size:34px;font-weight:700;line-height:1.28}
.cta{position:absolute;left:64px;top:474px;font-size:26px;font-weight:800;background:#fff;border:3px solid #141414;border-radius:999px;padding:9px 26px 11px;transform:rotate(2deg)}
.card{position:absolute;left:548px;top:38px;width:610px;height:424px;background:#fff;border:3px solid #141414;border-radius:30px;box-shadow:10px 10px 0 #141414;overflow:hidden}
.card svg{display:block;font-family:Manrope}
.chip{position:absolute;bottom:26px;font-size:30px;font-weight:800;border:3px solid #141414;border-radius:999px;padding:10px 30px 12px;box-shadow:5px 5px 0 #141414}
</style></head><body><div class="floor"></div>
<div class="brand">MIND LOFT · DAILY PUZZLE</div><div class="title">Seated</div>
<div class="tag">Seat the room. A dinner party on Monday, a wedding by Sunday.</div><div class="cta">A new guest list every day</div>
<div class="card"><svg viewBox="0 0 604 418" width="604" height="418">${TABLES.map(table).join('')}</svg></div>
${chip('Finn', 240, 590, -3)}${chip('Ivy', 120, 770, 2)}${chip('Pearl', 30, 925, -2)}
</body></html>`;
fs.writeFileSync(path.join(OUT, 'seated-og.html'), html);
console.log(path.join(OUT, 'seated-og.html'));
