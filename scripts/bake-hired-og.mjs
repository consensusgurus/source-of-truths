// scripts/bake-hired-og.mjs: the hand-built share cards for Hired and the Careers
// Database (owner, 2026-11-25: "Also need great share link image"). Same recipe as
// bake-trivia-og.mjs: an HTML page in the game's own world, screenshotted at
// 1200x630. Hired's world is a desk with the offer letter on it, stamped HIRED.
// The letter is a DECOY (no day's real result), so the card leaks nothing.
//
//   node scripts/bake-hired-og.mjs     writes <tmp>/hired-og/{hired,career-questions}.html
//   then screenshot each at 1200x630 into public/og/<name>.png
import fs from 'fs';
import path from 'path';
import os from 'os';

const OUT = path.join(os.tmpdir(), 'hired-og');
fs.mkdirSync(OUT, { recursive: true });
for (const w of [600, 700, 800]) fs.copyFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`, path.join(OUT, `manrope-latin-${w}-normal.woff2`));

const TEAL = '#5eead4', INK = '#08222e';
const BASE = `
@font-face{font-family:M;src:url(manrope-latin-800-normal.woff2);font-weight:800}
@font-face{font-family:M;src:url(manrope-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:M;src:url(manrope-latin-600-normal.woff2);font-weight:600}
*{box-sizing:border-box}body{margin:0}
#c{width:1200px;height:630px;position:relative;overflow:hidden;font-family:M,sans-serif;color:#f3efe6;
background:#6b4428;background-image:
 radial-gradient(900px 520px at 78% 46%,rgba(255,214,160,.28),transparent 62%),
 radial-gradient(640px 460px at 0% 100%,rgba(20,8,0,.55),transparent 70%),
 repeating-linear-gradient(176deg,rgba(255,255,255,.035) 0 3px,transparent 3px 19px),
 repeating-linear-gradient(178deg,rgba(0,0,0,.07) 0 2px,transparent 2px 31px),
 linear-gradient(160deg,#7a4e2e,#5a3820 60%,#4a2e1a)}
.l{position:absolute;left:62px;top:54px;width:470px;z-index:3}
.brand{font-weight:800;font-size:22px;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
.brand i{display:inline-block;width:26px;height:22px;background:${TEAL};clip-path:polygon(0 35%,50% 0,100% 35%,100% 100%,72% 100%,72% 55%,50% 75%,28% 55%,28% 100%,0 100%)}
.chip{display:inline-block;margin-top:32px;font-weight:800;font-size:17px;letter-spacing:.12em;text-transform:uppercase;color:${TEAL};border:2px solid ${TEAL}99;border-radius:999px;padding:7px 16px}
h1{margin:12px 0 0;font-weight:800;font-size:118px;line-height:1.02;letter-spacing:-.045em;padding-bottom:6px;text-shadow:0 6px 24px rgba(0,0,0,.35)}
.sub{margin-top:8px;font-weight:700;font-size:30px;line-height:1.3;color:#f6ead8;max-width:450px}
.jobs{margin-top:26px;display:flex;flex-wrap:wrap;gap:9px;max-width:470px}
.jobs span{font-weight:800;font-size:17px;color:${INK};background:#fdf6e9;border-radius:8px;padding:6px 11px;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.env{position:absolute;left:610px;top:150px;width:520px;height:330px;background:#e9dcc2;border-radius:10px;transform:rotate(4deg);box-shadow:0 30px 40px rgba(20,8,0,.45);overflow:hidden}
.env:before{content:'';position:absolute;left:0;right:0;top:0;height:190px;background:#dccca9;clip-path:polygon(0 0,100% 0,50% 100%)}
.paper{position:absolute;left:628px;top:40px;width:460px;height:560px;background:#fffdf7;border-radius:8px;transform:rotate(-5deg);box-shadow:0 26px 40px rgba(20,8,0,.5);padding:34px 36px;color:${INK};z-index:2}
.ph{display:flex;justify-content:space-between;font-weight:800;font-size:14px;letter-spacing:.1em;text-transform:uppercase;opacity:.7}
.pt{margin-top:20px;font-weight:800;font-size:30px}
.pp{margin-top:12px;font-weight:600;font-size:18px;line-height:1.45}
.pj{margin-top:8px;font-weight:800;font-size:36px;line-height:1.1}
.pay{margin-top:6px;font-weight:800;font-size:46px;letter-spacing:-.01em}
.pay small{font-size:18px;font-weight:700;margin-left:6px;letter-spacing:0}
.rec{margin-top:18px;padding-top:14px;border-top:1.5px solid rgba(8,34,46,.25);display:flex;flex-direction:column;gap:7px}
.row{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:16px}
.pips{display:flex;gap:6px}.pips i{width:17px;height:17px;border-radius:4px;border:1.5px solid ${INK}}.pips i.on{background:${INK}}
.sig{margin-top:14px;font-weight:700;font-size:15px}
.sig svg{display:block;width:170px;height:38px;fill:none;stroke:${INK};stroke-width:2.4;stroke-linecap:round}
.stamp{position:absolute;right:22px;bottom:18px;border:5px solid #0f766e;color:#0f766e;border-radius:12px;padding:6px 18px;font-weight:800;font-size:46px;letter-spacing:.1em;transform:rotate(-12deg);opacity:.92;mix-blend-mode:multiply}
.pen{position:absolute;left:470px;top:588px;width:300px;height:16px;border-radius:8px;background:linear-gradient(#1b2a33,#0b141a);transform:rotate(-24deg);box-shadow:0 10px 14px rgba(0,0,0,.4);z-index:4}
.pen:after{content:'';position:absolute;right:-22px;top:3px;border-left:24px solid #c9a24a;border-top:5px solid transparent;border-bottom:5px solid transparent}
`;
const pips = (n) => [0, 1, 2, 3].map((k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('');
const hired = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}</style></head><body><div id="c">
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Daily job interview</div><h1>Hired</h1>
<div class="sub">One job a day. Five interview rounds. Can you get the offer?</div>
<div class="jobs"><span>Accountant</span><span>Chef</span><span>Pilot</span><span>Excel Tutor</span><span>Bartender</span><span>Developer</span></div></div>
<div class="env"></div>
<div class="paper"><div class="ph"><span>Mind Loft · Hiring</span><span>Offer</span></div>
<div class="pt">Offer of Employment</div>
<div class="pp">After five rounds for the Chef role, we are pleased to offer you the position of</div>
<div class="pj">Executive Chef</div>
<div class="pay">$140,000<small>a year</small></div>
<div class="rec">
<div class="row"><span>Phone Screen</span><span class="pips">${pips(4)}</span></div>
<div class="row"><span>Technical</span><span class="pips">${pips(4)}</span></div>
<div class="row"><span>Case Study</span><span class="pips">${pips(4)}</span></div>
<div class="row"><span>Panel</span><span class="pips">${pips(4)}</span></div>
<div class="row"><span>Final Round</span><span class="pips">${pips(4)}</span></div></div>
<div class="sig"><svg viewBox="0 0 170 38"><path d="M4 28c10-14 18-20 22-16s-8 14-2 14 12-16 18-16-4 14 2 14 10-10 16-10 2 8 8 8 14-12 22-12 4 10 12 10 22-8 34-12"/></svg>The Hiring Committee</div>
<div class="stamp">HIRED</div></div>
<div class="pen"></div>
</div></body></html>`;

const fields = ['Accounting', 'Finance', 'Coding', 'Excel', 'Engineering', 'Chemistry', 'Medicine', 'Trades', 'Marketing', 'Culinary', 'Bartending', 'Aviation'];
const careers = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
.grid{position:absolute;left:640px;top:70px;width:500px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;transform:rotate(-3deg)}
.grid span{background:#fffdf7;color:${INK};border-radius:10px;height:98px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:21px;box-shadow:0 10px 18px rgba(20,8,0,.4)}
.grid span:nth-child(3n+2){background:#d9f7f1}
</style></head><body><div id="c">
<div class="l"><div class="brand"><i></i>Mind Loft</div><div class="chip">Free job skills questions</div><h1 style="font-size:96px">Careers Database</h1>
<div class="sub">Every past Hired interview question, by field, with answers.</div></div>
<div class="grid">${fields.map((f) => `<span>${f}</span>`).join('')}</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'hired.html'), hired);
fs.writeFileSync(path.join(OUT, 'career-questions.html'), careers);
console.log(`bake-hired-og: wrote ${OUT}/hired.html and career-questions.html`);
