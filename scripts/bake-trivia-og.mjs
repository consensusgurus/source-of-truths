// scripts/bake-trivia-og.mjs: hand-built share cards for Resume, Tape and Carmen (owner, 2026-11-09: "I want
// cool share copy images for share links for this and for Carmen and for tape"). Same recipe as
// bake-sudoclue-og.mjs: each card is an HTML page drawn from the game's own look, screenshotted at 1200x630.
// Every board on a card is a DECOY (an invented profile, a made-up price walk, a pin trail no case uses), so a
// card never leaks an answer. bake-og.mjs skips these keys (HAND_BAKED in lib/og-stage-cards.js).
//
//   node scripts/bake-trivia-og.mjs           writes <tmp>/trivia-og/{resume,tape,carmen}.html
//   then screenshot each page at 1200x630 into public/og/<key>.png (scripts/shoot-og.py does all three)
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GEO } from '../lib/world-geo.js';

const OUT = path.join(os.tmpdir(), 'trivia-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));

const BASE = (accent) => `
@font-face{font-family:M;src:url(manrope-latin-800-normal.woff2);font-weight:800}
@font-face{font-family:M;src:url(manrope-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:M;src:url(manrope-latin-600-normal.woff2);font-weight:600}
*{box-sizing:border-box}body{margin:0}
#c{width:1200px;height:630px;position:relative;overflow:hidden;font-family:M,sans-serif;color:#e9edf4;background:#0b0f1a}
.l{position:absolute;left:64px;top:56px;width:540px;z-index:3}
.brand{font-weight:800;font-size:22px;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:26px;height:22px;background:${accent};clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:34px;font-weight:800;font-size:17px;letter-spacing:.12em;text-transform:uppercase;color:${accent};border:2px solid ${accent}88;border-radius:999px;padding:7px 16px}
h1{margin:14px 0 0;font-weight:800;font-size:112px;line-height:1.02;letter-spacing:-.045em;padding-bottom:6px}
.sub{margin-top:12px;font-weight:700;font-size:29px;max-width:520px;line-height:1.3;color:#cfd6e3}
.tag{margin-top:22px;font-weight:800;font-size:24px;color:${accent};line-height:1.3}
.url{position:absolute;left:64px;bottom:44px;font-weight:700;font-size:22px;color:#8b95a8;z-index:3}
.play{display:inline-block;margin-top:26px;font-weight:800;font-size:22px;color:#0b0f1a;background:${accent};border-radius:999px;padding:12px 26px}
`;
const LEFT = (chip, title, sub, tag, url) => `<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">${chip}</div><h1>${title}</h1><div class="sub">${sub}</div><div class="tag">${tag}</div><div class="play">Play free</div></div><div class="url">${url}</div>`;
const page = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div id="c">${body}</div></body></html>`;

// ---- Resume: a tilted career profile, every name blacked out. An invented profile, nobody's real resume.
{
  const A = '#93c5fd';
  const bar = (w, c = '#1f2328') => `<span class="bar" style="width:${w}px;background:${c}"></span>`;
  const row = (tw, ow, yr, tile) => `<div class="row"><span class="tile" style="background:${tile}"></span><div class="rt">${bar(tw, '#191919')}${bar(ow)}<span class="yr">${yr}</span></div></div>`;
  const css = BASE(A) + `
#c{background:radial-gradient(820px 520px at 86% 40%,rgba(147,197,253,.30),transparent 62%),radial-gradient(600px 420px at 0% 100%,rgba(125,211,252,.10),transparent 60%),#0b0f1a}
.stage{position:absolute;left:640px;top:-10px;width:620px;height:680px;perspective:1600px}
.card{position:absolute;left:40px;top:40px;width:470px;transform:rotateY(-16deg) rotateX(8deg) rotateZ(4deg);transform-origin:50% 50%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:40px 50px 90px rgba(0,0,0,.6);color:#191919}
.ban{height:96px;background:linear-gradient(120deg,#a0b4b7,#c7d6dc 45%,#dfe7ea)}
.av{position:absolute;left:26px;top:40px;width:124px;height:124px;border-radius:50%;border:6px solid #fff;background:#e9e5df;overflow:hidden}
.av svg{display:block}
.q{position:absolute;left:118px;top:128px;width:42px;height:42px;border-radius:50%;background:${A};color:#0b0f1a;font-weight:800;font-size:26px;display:flex;align-items:center;justify-content:center;border:4px solid #fff}
.top{padding:78px 26px 18px}
.bar{display:block;height:15px;border-radius:3px;margin:5px 0}
.sec{border-top:1px solid #e3e6ea;padding:14px 26px 6px}
.h{font-weight:800;font-size:21px;margin-bottom:4px}
.row{display:flex;gap:14px;padding:9px 0;align-items:center}
.tile{width:46px;height:46px;border-radius:6px;flex:none}
.rt{flex:1}
.yr{display:block;font-weight:700;font-size:14px;color:#5e5e5e;margin-top:3px}
.stamp{position:absolute;left:210px;top:500px;transform:rotate(-12deg);border:5px solid ${A};color:${A};font-weight:800;font-size:34px;letter-spacing:.12em;padding:6px 18px;border-radius:8px;background:rgba(11,15,26,.82)}
`;
  const sil = `<svg viewBox="0 0 96 96" width="112" height="112"><rect width="96" height="96" fill="#e9e5df"/><circle cx="48" cy="38" r="17" fill="#b9b2a8"/><path d="M14 96c2-20 16-31 34-31s32 11 34 31z" fill="#b9b2a8"/></svg>`;
  const card = `<div class="card"><div class="ban"></div><div class="av">${sil}</div><div class="q">?</div>
<div class="top">${bar(230, '#191919')}${bar(330, '#d6dbe2')}${bar(170, '#e3e6ea')}</div>
<div class="sec"><div class="h">Experience</div>${row(190, 150, '2014 on', '#dbe7f3')}${row(220, 120, '2006 to 2014', '#f1e4d4')}${row(160, 180, '1998 to 2006', '#e3ecdc')}</div>
<div class="sec"><div class="h">Education</div>${row(240, 110, 'MBA, 1996', '#e7def1')}${row(200, 130, 'BS, Economics, 1992', '#f3dde3')}</div></div>`;
  const body = `<div class="stage">${card}<div class="stamp">WHO IS IT?</div></div>` +
    LEFT('Trivia &middot; Daily Puzzle', 'Resume', 'A famous career, every name blacked out.', 'Name them in the fewest clues.', 'mindloftdaily.com/resume');
  fs.writeFileSync(path.join(OUT, 'resume.html'), page(css, body));
}

// ---- Tape: an unlabeled five-year chart of a made-up price walk, the ticker hidden.
{
  const A = '#7dd3fc';
  let s = 9 >>> 0; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const N = 120; const pts = []; let v = 40;
  for (let i = 0; i < N; i++) { v += (rnd() - 0.46) * 4 + (i > 70 && i < 82 ? -2.6 : 0) + (i > 95 ? 1.4 : 0); v = Math.max(12, v); pts.push(v); }
  const W = 600, H = 330, X0 = 0, Y0 = 0; const mn = Math.min(...pts), mx = Math.max(...pts);
  const xy = pts.map((p, i) => [X0 + (i / (N - 1)) * W, Y0 + H - ((p - mn) / (mx - mn)) * (H - 20) - 10]);
  const d = 'M' + xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
  const area = d + `L${W},${H}L0,${H}Z`;
  const grid = [0, 1, 2, 3].map((k) => `<line x1="0" x2="${W}" y1="${10 + k * ((H - 20) / 3)}" y2="${10 + k * ((H - 20) / 3)}" stroke="rgba(233,237,244,.10)" stroke-width="1"/>`).join('');
  const [lx, ly] = xy[xy.length - 1];
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A}" stop-opacity=".38"/><stop offset="1" stop-color="${A}" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#g)"/><path d="${d}" fill="none" stroke="${A}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lx}" cy="${ly}" r="9" fill="${A}"/><circle cx="${lx}" cy="${ly}" r="18" fill="${A}" fill-opacity=".25"/></svg>`;
  const css = BASE(A) + `
#c{background:radial-gradient(800px 520px at 84% 46%,rgba(125,211,252,.22),transparent 62%),#0b0f1a}
.panel{position:absolute;left:600px;top:78px;width:560px;height:430px;border-radius:20px;background:#111827;border:1px solid rgba(233,237,244,.14);box-shadow:30px 40px 80px rgba(0,0,0,.55);overflow:hidden}
.ph{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 6px}
.tk{font-weight:800;font-size:30px;letter-spacing:.08em}
.tk b{display:inline-block;background:#e9edf4;color:#111827;border-radius:6px;padding:0 10px;margin-left:4px}
.px{font-weight:800;font-size:26px;color:${A}}
.chart{position:absolute;left:-20px;top:64px;height:330px;overflow:hidden}
.yrs{position:absolute;left:24px;right:24px;bottom:16px;display:flex;justify-content:space-between;font-weight:700;font-size:16px;color:#8b95a8}
.strip{position:absolute;left:0;right:0;top:0;height:44px;background:#facc15;color:#111827;display:flex;align-items:center;gap:34px;padding:0 24px;font-weight:800;font-size:19px;letter-spacing:.06em;white-space:nowrap;transform:rotate(-3deg);transform-origin:0 0;top:572px;width:1300px;left:-30px;box-shadow:0 -6px 20px rgba(0,0,0,.35);z-index:2}
`;
  const strip = Array.from({ length: 9 }, (_, i) => `<span>???? ${i % 3 === 1 ? '&#9660;' : '&#9650;'} ${(1.2 + (i * 0.7) % 3).toFixed(1)}%</span>`).join('');
  const body = `<div class="panel"><div class="ph"><span class="tk">Ticker <b>????</b></span><span class="px">$???</span></div><div class="chart">${svg}</div><div class="yrs"><span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span><span>2026</span></div></div><div class="strip">${strip}</div>` +
    LEFT('Trivia &middot; Daily Puzzle', 'Tape', 'Five years of a stock chart. No name, no ticker.', 'Which company is it?', 'mindloftdaily.com/tape');
  fs.writeFileSync(path.join(OUT, 'tape.html'), page(css.replace('.url{position:absolute;left:64px;bottom:44px', '.url{position:absolute;right:46px;left:auto;top:28px;bottom:auto;font-size:18px'), body));
}

// ---- Carmen: a dark globe with a trail of pins and the last stop a question mark. A made-up route.
{
  const A = '#bef264';
  const land = GEO.paths.map((p) => `<path d="${p.d}"/>`).join('');
  // the world map is Mercator 900x572; show Europe, Africa and the Middle East inside a circular globe face
  const css = BASE(A) + `
#c{background:radial-gradient(820px 560px at 84% 44%,rgba(190,242,100,.16),transparent 62%),radial-gradient(500px 400px at 0% 100%,rgba(125,211,252,.10),transparent 60%),#0b0f1a}
.globe{position:absolute;left:630px;top:40px;width:540px;height:540px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 34% 30%,#1d3b57,#0d1b2c 60%,#070d16);box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(190,242,100,.35),0 0 80px rgba(190,242,100,.18)}
.globe svg{position:absolute;left:-560px;top:-330px;width:1700px;height:1080px}
.shade{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.22),rgba(255,255,255,0) 38%),radial-gradient(circle at 70% 78%,rgba(0,0,0,0),rgba(0,0,0,.55) 75%)}
.trail{position:absolute;left:630px;top:40px;width:540px;height:540px}
`;
  const map = `<svg viewBox="0 0 900 572"><g fill="#3f6b3a" stroke="#0d1b2c" stroke-width=".6">${land}</g></svg>`;
  // pins in globe-face pixels: a made-up chase
  const P = [[150, 190], [262, 150], [330, 262], [410, 210], [300, 390]];
  const arc = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 60; return `M${a[0]},${a[1]}Q${mx},${my} ${b[0]},${b[1]}`; };
  const paths = P.slice(0, -1).map((p, i) => `<path d="${arc(p, P[i + 1])}" fill="none" stroke="${A}" stroke-width="4" stroke-linecap="round" opacity="${0.45 + i * 0.15}"/>`).join('');
  const pin = ([x, y], last) => last
    ? `<g transform="translate(${x},${y})"><circle r="30" fill="${A}" fill-opacity=".22"/><circle r="22" fill="${A}"/><text y="10" text-anchor="middle" font-family="M" font-weight="800" font-size="28" fill="#0b0f1a">?</text></g>`
    : `<g transform="translate(${x},${y})"><circle r="12" fill="#0b0f1a" stroke="${A}" stroke-width="4"/></g>`;
  const trail = `<svg class="trail" viewBox="0 0 540 540">${paths}${P.map((p, i) => pin(p, i === P.length - 1)).join('')}</svg>`;
  const body = `<div class="globe">${map}<div class="shade"></div></div>${trail}` +
    LEFT('Geography &middot; Daily Puzzle', 'Carmen', 'A thief on the run. Clues at every stop.', 'Follow the trail across the globe.', 'mindloftdaily.com/carmen');
  fs.writeFileSync(path.join(OUT, 'carmen.html'), page(css, body));
}
console.log('wrote', ['resume', 'tape', 'carmen'].map((k) => path.join(OUT, k + '.html')).join(' '));
