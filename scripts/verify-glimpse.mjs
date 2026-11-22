// verify-glimpse: the checker for Glimpse (app/glimpse/puzzles.js), discovered
// by scripts/verify-all.mjs. Recomputes every rule with the page's own engine
// (lib/glimpse-engine.js):
//   - one board a day from 2026-11-22, num in order, quizId and dateLabel read
//     off `live`, the band from the weekday, `sunday` exactly on Sundays;
//   - the board equals buildBoard(seed, band) from its stored seed, so a hand
//     edit fails;
//   - five flashes (six on Sunday) at the FLASH_MS timings; flash 1 fills Dots
//     and Grid, flash 2 Clock and String, the rest all four;
//   - every dot cloud fits at its count, red only from flash 3 and between a
//     quarter and under half of the dots, counts inside the band;
//   - lit squares distinct, 0 to 15, as many as the band says; the clock on a
//     five-minute mark; the string from CHARS with no repeated character, at
//     the band's length;
//   - flashes 1 to 4 ask about each quadrant exactly once, flash 5 (and 6) ask
//     two different quadrants, and nothing asks about an empty quadrant;
//   - the truth scores 100 on every question, and a blank scores 0.
// Shown to fail on a dot count one off, a lit square changed, and a Monday
// board marked tough.
//   node scripts/verify-glimpse.mjs
import { PUZZLES } from '../app/glimpse/puzzles.js';
import { BANDS, FLASH_MS, QUADS, CHARS, bandOf, buildBoard, placeDots, askPoints, truthOf, maxPoints } from '../lib/glimpse-engine.js';
import { FIRST } from './gen-glimpse.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const bad = (p, m) => { fails++; console.log(`  FAIL No. ${p.num} (${p.live}): ${m}`); };
let day = new Date(`${FIRST}T12:00:00Z`);
const ids = new Set();
for (const [i, p] of PUZZLES.entries()) {
  const ds = day.toISOString().slice(0, 10);
  day = new Date(day.getTime() + 86400000);
  if (p.num !== i + 1) bad(p, `num ${p.num}, expected ${i + 1}`);
  if (p.live !== ds) bad(p, `live ${p.live}, expected ${ds}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `glimpse-${m}-${d}-${String(y).slice(2)}`) bad(p, `quizId ${p.quizId}`);
  if (ids.has(p.quizId)) bad(p, 'duplicate quizId'); ids.add(p.quizId);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(p, `dateLabel ${p.dateLabel}`);
  const band = bandOf(p.live), B = BANDS[band];
  if (p.band !== band) { bad(p, `band ${p.band}, the weekday is ${band}`); continue; }
  if (p.sunday !== (band === 'sunday')) bad(p, `sunday ${p.sunday} on a ${band} day`);
  if (JSON.stringify(buildBoard(p.seed, band)) !== JSON.stringify(p.flashes)) bad(p, 'flashes differ from buildBoard(seed, band): hand-edited or the engine changed');
  if (p.flashes.length !== B.dots.length) { bad(p, `${p.flashes.length} flashes, the band has ${B.dots.length}`); continue; }
  if (maxPoints(p) !== p.flashes.length * 100) bad(p, 'maxPoints');
  const early = [];
  p.flashes.forEach((f, k) => {
    const at = `flash ${k + 1}`;
    if (f.ms !== FLASH_MS[k]) bad(p, `${at}: ${f.ms}ms, expected ${FLASH_MS[k]}`);
    const want = k === 0 ? ['dots', 'grid'] : k === 1 ? ['dial', 'string'] : QUADS;
    if (JSON.stringify(f.quads) !== JSON.stringify(want)) bad(p, `${at}: quads ${f.quads}`);
    if (f.dots < B.dots[k][0] || f.dots > B.dots[k][1]) bad(p, `${at}: ${f.dots} dots outside ${B.dots[k]}`);
    if (k < 2 ? f.red !== 0 : (f.red < f.dots * 0.25 - 0.5 || f.red >= f.dots * 0.45 + 0.5)) bad(p, `${at}: ${f.red} red of ${f.dots}`);
    const cloud = placeDots(f.seed, f.dots, f.red);
    if (!cloud) bad(p, `${at}: the dot cloud does not fit`);
    else if (cloud.pts.length !== f.dots || cloud.pts.filter((q) => q.red).length !== f.red) bad(p, `${at}: the cloud draws ${cloud.pts.length} dots, ${cloud.pts.filter((q) => q.red).length} red`);
    if (new Set(f.lit).size !== f.lit.length || f.lit.length !== B.lit[k] || !f.lit.every((c) => Number.isInteger(c) && c >= 0 && c < 16)) bad(p, `${at}: lit ${f.lit}`);
    if (!(f.h >= 1 && f.h <= 12) || f.m % 5 !== 0 || f.m < 0 || f.m > 55) bad(p, `${at}: clock ${f.h}:${f.m}`);
    if (f.str.length !== B.len[k] || new Set(f.str).size !== f.str.length || ![...f.str].every((c) => CHARS.includes(c))) bad(p, `${at}: string ${f.str}`);
    const n = k < 4 ? 1 : 2;
    if (f.asks.length !== n) bad(p, `${at}: ${f.asks.length} questions, expected ${n}`);
    if (new Set(f.asks.map((a) => a.kind)).size !== f.asks.length) bad(p, `${at}: asks the same quadrant twice`);
    for (const a of f.asks) {
      if (!f.quads.includes(a.kind)) bad(p, `${at}: asks about ${a.kind}, which it does not show`);
      if (a.red && (a.kind !== 'dots' || k < 2)) bad(p, `${at}: a red-dots question where there are none`);
      if (askPoints(f, a, truthOf(f, a)) !== 100) bad(p, `${at}: the truth does not score 100 on ${a.kind}`);
      if (askPoints(f, a, null) !== 0) bad(p, `${at}: a blank scores on ${a.kind}`);
      if (k < 4) early.push(a.kind);
    }
  });
  if (JSON.stringify(early.slice().sort()) !== JSON.stringify(QUADS.slice().sort())) bad(p, `flashes 1 to 4 ask ${early}, not each quadrant once`);
}
const last = PUZZLES[PUZZLES.length - 1];
const left = Math.round((new Date(`${last.live}T12:00:00Z`) - Date.now()) / 86400000);
if (left < 10) console.log(`  WARN Glimpse bank ends ${last.live}, ${left} days left: node scripts/gen-glimpse.mjs --through <date>`);
console.log(fails ? `verify-glimpse: ${fails} failure(s) in ${PUZZLES.length} boards` : `verify-glimpse: ${PUZZLES.length} boards OK (to ${last.live})`);
process.exit(fails ? 1 : 0);
