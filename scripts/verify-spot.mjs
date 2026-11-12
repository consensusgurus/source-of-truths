// scripts/verify-spot.mjs: re-proves app/spot/puzzles.js against the photo
// files themselves.
//
//   node scripts/verify-spot.mjs
//
// What it enforces (docs/claude/daily-authoring.md, the authoring standard):
//   - num, quizId and dateLabel from the live date; dates run day after day
//     from the launch, 2026-11-12. No Sunday Edition flag on any board.
//   - THE PHOTO PAIR IS THE ONE THE KEY WAS BUILT FROM. public/spot/<img>-a.jpg
//     and -b.jpg exist, their SHA-256 match scripts/spot-grid.json, and each
//     JPEG's own header gives the stored w and h. The file stem is 12 hex
//     characters and no two boards share one.
//   - THE KEY COVERS EVERY CHANGE AND NOTHING ELSE (rule 3, recompute). The
//     grid in spot-grid.json is the 80-column map of cells where the two files
//     really differ, measured from the saved JPEGs by scripts/spot/spotkit.py.
//     Every changed cell must fall inside a listed difference, and every listed
//     difference must hold changed cells. A difference with nothing changed
//     under it, or a change nobody is asked to find, fails.
//   - EVERY DIFFERENCE CAN BE TAPPED. The tap rule (smallest region under the
//     finger wins) is re-implemented here; at least 35% of each difference's
//     own ellipse must resolve to it, so a small one sitting on a big one is
//     fine and a difference buried under others is not.
//   - seven differences a board (the rules copy says seven), centres on the
//     photo, no radius under 0.021 (visible on a phone at 1x) or over 0.3.
//   - THE CREDIT IS JIG'S OWN. name, lic and by equal the row of app/jig/puzzles.js
//     that `jig` names; the license allows altered copies (CC BY, CC BY-SA or
//     CC0); the photo ran on Jig strictly BEFORE its Spot day; no photo twice.
//   - labels: one plain sentence fragment each, unique on the board, US
//     spelling, no em dash, no closing period.
//   - variety: no two days in a row made only of color changes.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUZZLES } from '../app/spot/puzzles.js';
import { PUZZLES as JIG } from '../app/jig/puzzles.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRID = JSON.parse(readFileSync(join(root, 'scripts', 'spot-grid.json'), 'utf8'));
const START = '2026-11-12';
const DIFFS = 7;
const GW = 80;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const fail = (m) => { fails++; console.error('FAIL ' + m); };
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

// The width and height a JPEG states for itself (the first SOF segment).
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
// The client's tap rule, written again here on purpose (app/spot/SpotBoard.jsx spotHit).
function hit(P, nx, ny) {
  const k = P.h / P.w;
  let best = -1, key = Infinity;
  P.diffs.forEach((d, i) => {
    const rx = d.rx * 1.1, ry = d.ry * 1.1;
    const dx = (nx - d.x) / rx, dy = ((ny - d.y) * k) / ry;
    if (dx * dx + dy * dy > 1) return;
    if (rx * ry < key) { key = rx * ry; best = i; }
  });
  return best;
}
const inside = (P, d, nx, ny, pad) => { const k = P.h / P.w; const dx = (nx - d.x) / (d.rx * pad), dy = ((ny - d.y) * k) / (d.ry * pad); return dx * dx + dy * dy <= 1; };

const jigBy = new Map(JIG.map((r) => [r.num, r]));
const seenImg = new Set(), seenJig = new Set();
let prevAllColor = false;
PUZZLES.forEach((P, idx) => {
  const tag = `#${P.num} (${P.live})`;
  if (P.num !== idx + 1) fail(`${tag}: num out of order`);
  const want = new Date(day(START) + idx * 86400000);
  const iso = want.toISOString().slice(0, 10);
  if (P.live !== iso) fail(`${tag}: live should be ${iso}`);
  const [y, m, d] = iso.split('-').map(Number);
  if (P.quizId !== `spot-${m}-${d}-${y % 100}`) fail(`${tag}: quizId ${P.quizId}`);
  if (P.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel ${P.dateLabel}`);
  if ('sunday' in P) fail(`${tag}: Spot has no Sunday Edition, drop the sunday field`);

  // the files
  if (!/^[0-9a-f]{12}$/.test(P.img || '')) fail(`${tag}: img is not a 12-hex stem`);
  if (seenImg.has(P.img)) fail(`${tag}: img ${P.img} used twice`);
  seenImg.add(P.img);
  const g = GRID[P.img];
  if (!g) { fail(`${tag}: no entry in scripts/spot-grid.json for ${P.img}`); return; }
  for (const side of ['a', 'b']) {
    const f = join(root, 'public', 'spot', `${P.img}-${side}.jpg`);
    if (!existsSync(f)) { fail(`${tag}: missing public/spot/${P.img}-${side}.jpg`); continue; }
    if (sha(f) !== g[side]) fail(`${tag}: ${P.img}-${side}.jpg is not the file the key was built from`);
    const sz = jpegSize(readFileSync(f));
    if (!sz || sz.w !== P.w || sz.h !== P.h) fail(`${tag}: ${side} is ${sz ? `${sz.w}x${sz.h}` : 'unreadable'}, row says ${P.w}x${P.h}`);
  }
  if (g.a === g.b) fail(`${tag}: the two photos are the same file`);

  // the differences
  if (!Array.isArray(P.diffs) || P.diffs.length !== DIFFS) fail(`${tag}: ${P.diffs ? P.diffs.length : 0} differences, the rules say ${DIFFS}`);
  const labels = new Set();
  P.diffs.forEach((q, i) => {
    const t = `${tag} diff ${i + 1}`;
    if (!(q.x > 0.01 && q.x < 0.99 && q.y > 0.01 && q.y < 0.99)) fail(`${t}: centre off the photo`);
    for (const r of [q.rx, q.ry]) if (!(r >= 0.021 && r <= 0.3)) fail(`${t}: radius ${r} outside 0.021..0.3`);
    if (typeof q.t !== 'string' || q.t.length < 8 || q.t.length > 70) fail(`${t}: label length`);
    else {
      if (/[—–]/.test(q.t)) fail(`${t}: dash in label`);
      if (/\.$/.test(q.t)) fail(`${t}: label ends in a period`);
      if (/\b(colou?red|colour|grey|centre|harbour|theatre)\b/i.test(q.t) && /colour|grey|centre|harbour|theatre/i.test(q.t)) fail(`${t}: British spelling in "${q.t}"`);
      if (!/^[A-Z]/.test(q.t)) fail(`${t}: label does not start with a capital`);
      if (labels.has(q.t)) fail(`${t}: label repeated`);
      labels.add(q.t);
    }
  });

  // the grid: every changed cell is inside a difference, every difference holds changed cells
  const GH = Math.round((GW * P.h) / P.w);
  if (!Array.isArray(g.rows) || g.rows.length !== GH || g.rows.some((r) => r.length !== GW || /[^01]/.test(r))) { fail(`${tag}: grid is not ${GW}x${GH}`); return; }
  let ones = 0, stray = 0;
  const held = P.diffs.map(() => 0);
  for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
    if (g.rows[r][c] !== '1') continue;
    ones++;
    const nx = (c + 0.5) / GW, ny = (r + 0.5) / GH;
    let any = false;
    P.diffs.forEach((q, i) => { if (inside(P, q, nx, ny, 1.4)) { any = true; held[i]++; } });
    if (!any) stray++;
  }
  if (!ones) fail(`${tag}: the two photos do not differ anywhere`);
  if (stray > Math.max(4, ones * 0.04)) fail(`${tag}: ${stray} of ${ones} changed cells lie outside every listed difference`);
  held.forEach((n, i) => { if (!n) fail(`${tag} diff ${i + 1}: nothing in the photo changes there ("${P.diffs[i].t}")`); });

  // every difference can be tapped
  P.diffs.forEach((q, i) => {
    let mine = 0, all = 0;
    for (let a = 0; a < 24; a++) for (let s = 1; s <= 5; s++) {
      const ang = (a / 24) * Math.PI * 2, rad = s / 5.5;
      const nx = q.x + Math.cos(ang) * q.rx * rad, ny = q.y + (Math.sin(ang) * q.ry * rad) * (P.w / P.h);
      if (nx <= 0 || nx >= 1 || ny <= 0 || ny >= 1) continue;
      all++;
      if (hit(P, nx, ny) === i) mine++;
    }
    if (!all || mine / all < 0.35) fail(`${tag} diff ${i + 1}: only ${all ? Math.round((mine / all) * 100) : 0}% of it can be tapped ("${q.t}")`);
  });

  // the credit
  const j = jigBy.get(P.jig);
  if (!j) fail(`${tag}: jig ${P.jig} is not a Jig board`);
  else {
    if (P.name !== j.name || P.lic !== j.lic || P.by !== j.by) fail(`${tag}: credit differs from Jig No. ${P.jig}`);
    if (!/^(CC BY(-SA)? \d|CC0|Public domain)/.test(j.lic)) fail(`${tag}: license "${j.lic}" may not allow an altered copy`);
    if (!(j.live < P.live)) fail(`${tag}: Jig No. ${P.jig} runs ${j.live}, not before this Spot day`);
  }
  if (seenJig.has(P.jig)) fail(`${tag}: photo (Jig No. ${P.jig}) used twice`);
  seenJig.add(P.jig);

  // variety
  const allColor = P.diffs.every((q) => /turned|changed color/.test(q.t));
  if (allColor && prevAllColor) fail(`${tag}: two days in a row of color changes only`);
  prevAllColor = allColor;
});

// the rules copy says seven
const client = readFileSync(join(root, 'app', 'spot', 'SpotClient.jsx'), 'utf8');
if (!client.includes('changed in seven places') || DIFFS !== 7) fail('SpotClient about copy and DIFFS disagree on the count');

console.log(fails ? `\nverify-spot: ${fails} failure(s)` : `verify-spot: ok (${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ${DIFFS} differences each)`);
process.exit(fails ? 1 : 0);
