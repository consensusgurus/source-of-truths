// verify-scales: the checker for Scales (app/scales/puzzles.js), discovered by
// scripts/verify-all.mjs. Recomputes every rule with the page's own engine
// (lib/scales-engine.js) and proves the answer a second, independent way:
//   - one board a day from 2026-11-26, num in order, quizId and dateLabel read
//     off `live`, the band from the weekday, `sunday` exactly on Sundays;
//   - the board equals buildBoard(seed, band) from its stored seed, so a hand
//     edit fails;
//   - n shapes and n scales at the band's size, weights distinct whole numbers
//     from 1 to max, every shape on at least one scale;
//   - every scale sits where the stored answer puts it: a '=' scale balances
//     and a tilted one tilts the way it is drawn;
//   - EXACTLY ONE ANSWER, twice over: the engine's solver counts one, and a
//     plain brute force over every weight from 1 to max for every shape (no
//     shortcuts, written here, not shared with the engine) finds the same one;
//   - the band's own rules: tilted scales and numbered weights inside the
//     band's limits, no arm over its size, Gentle with no shape on both arms
//     and solvable one unknown at a time, Moderate with a shape on both arms
//     somewhere, and on Tough and Sunday every tilted scale needed (without it
//     the board has more than one answer);
//   - no scale drawn twice, and none with the same thing on both arms.
// Shown to fail on a weight changed in `sol`, a numbered weight changed on a
// scale, a tilt flipped, and a Monday board marked tough.
//   node scripts/verify-scales.mjs
import { PUZZLES } from '../app/scales/puzzles.js';
import { BANDS, SHAPES, bandOf, buildBoard, countAnswers, tiltOf, isSolved } from '../lib/scales-engine.js';
import { FIRST } from './gen-scales.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const bad = (p, m) => { fails++; console.log(`  FAIL No. ${p.num} (${p.live}): ${m}`); };
const isNum = (t) => typeof t === 'number';
const sideKey = (s) => s.slice().sort().join(',');

// The independent count: every assignment, no pruning beyond the odometer.
function brute(p) {
  const n = p.n, max = p.max, x = new Array(n).fill(1);
  // each scale as plain counts, built here from the arms (not the engine's rows)
  const rows = p.scales.map((sc) => {
    const c = new Array(n).fill(0); let k = 0;
    for (const t of sc.L) { if (isNum(t)) k += t; else c[SHAPES.indexOf(t)]++; }
    for (const t of sc.R) { if (isNum(t)) k -= t; else c[SHAPES.indexOf(t)]--; }
    return { c, k, t: sc.t };
  });
  let count = 0, first = null;
  for (;;) {
    let ok = true;
    for (const r of rows) {
      let d = r.k;
      for (let i = 0; i < n; i++) d += r.c[i] * x[i];
      if (r.t === '=' ? d !== 0 : r.t === '>' ? d <= 0 : d >= 0) { ok = false; break; }
    }
    if (ok) { count++; if (!first) first = x.slice(); }
    let i = 0;
    while (i < n && x[i] === max) { x[i] = 1; i++; }
    if (i === n) break;
    x[i]++;
  }
  return { count, first };
}

let day = new Date(`${FIRST}T12:00:00Z`);
const ids = new Set();
for (const [i, p] of PUZZLES.entries()) {
  const ds = day.toISOString().slice(0, 10);
  day = new Date(day.getTime() + 86400000);
  if (p.num !== i + 1) bad(p, `num ${p.num}, expected ${i + 1}`);
  if (p.live !== ds) bad(p, `live ${p.live}, expected ${ds}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `scales-${m}-${d}-${String(y).slice(2)}`) bad(p, `quizId ${p.quizId}`);
  if (ids.has(p.quizId)) bad(p, 'duplicate quizId'); ids.add(p.quizId);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(p, `dateLabel ${p.dateLabel}`);
  const band = bandOf(p.live), B = BANDS[band];
  if (p.band !== band) { bad(p, `band ${p.band}, the weekday is ${band}`); continue; }
  if (p.sunday !== (band === 'sunday')) bad(p, `sunday ${p.sunday} on a ${band} day`);
  const built = buildBoard(p.seed, band);
  if (!built || JSON.stringify({ n: built.n, max: built.max, sol: built.sol, scales: built.scales }) !== JSON.stringify({ n: p.n, max: p.max, sol: p.sol, scales: p.scales })) bad(p, 'the board differs from buildBoard(seed, band): hand-edited or the engine changed');
  if (p.n !== B.n || p.max !== B.max || p.scales.length !== B.n) { bad(p, `${p.n} shapes, ${p.scales.length} scales, max ${p.max}: the band wants ${B.n}, ${B.n}, ${B.max}`); continue; }
  if (p.sol.length !== p.n || new Set(p.sol).size !== p.n || !p.sol.every((v) => Number.isInteger(v) && v >= 1 && v <= p.max)) bad(p, `weights ${p.sol}`);
  const letters = SHAPES.slice(0, p.n);
  const seen = new Set(), pairs = new Set();
  let tilted = 0, nums = 0, both = 0;
  p.scales.forEach((sc, k) => {
    const at = `scale ${k + 1}`;
    if (!['=', '>', '<'].includes(sc.t)) bad(p, `${at}: t ${sc.t}`);
    for (const side of [sc.L, sc.R]) {
      if (!Array.isArray(side) || side.length > B.side) bad(p, `${at}: an arm of ${side && side.length}, the band allows ${B.side}`);
      for (const t of side) {
        if (isNum(t)) { nums++; if (!Number.isInteger(t) || t < 1 || t > 60) bad(p, `${at}: numbered weight ${t}`); if (sc.t !== '=') bad(p, `${at}: a numbered weight on a tilted scale`); }
        else if (!letters.includes(t)) bad(p, `${at}: shape ${t} is not on this board`);
        else seen.add(t);
      }
      if (side.filter(isNum).length > 1) bad(p, `${at}: two numbered weights on one arm`);
    }
    if (!sc.L.length || (!sc.R.length)) bad(p, `${at}: an empty arm`);
    if (sc.L.some(isNum) && sc.R.some(isNum)) bad(p, `${at}: numbered weights on both arms`);
    if (sideKey(sc.L) === sideKey(sc.R)) bad(p, `${at}: the same on both arms`);
    const a = `${sideKey(sc.L)}|${sideKey(sc.R)}`, b = `${sideKey(sc.R)}|${sideKey(sc.L)}`;
    if (pairs.has(a) || pairs.has(b)) bad(p, `${at}: drawn twice`); pairs.add(a);
    if (tiltOf(sc, p.sol) !== sc.t) bad(p, `${at}: drawn ${sc.t}, the answer puts it ${tiltOf(sc, p.sol)}`);
    if (sc.t !== '=') tilted++;
    const shared = new Set(sc.L.filter((t) => !isNum(t) && sc.R.includes(t)));
    if (shared.size) both++;
    if (shared.size > 1) bad(p, `${at}: more than one kind of shape on both arms`);
  });
  if (seen.size !== p.n) bad(p, `only ${seen.size} of ${p.n} shapes appear`);
  if (tilted < B.tilted[0] || tilted > B.tilted[1]) bad(p, `${tilted} tilted scales, the band allows ${B.tilted}`);
  if (nums < B.nums[0] || nums > B.nums[1]) bad(p, `${nums} numbered weights, the band allows ${B.nums}`);
  if (!B.both && both) bad(p, 'a shape on both arms on a Gentle day');
  if (band === 'moderate' && !both) bad(p, 'no scale with a shape on both arms on a Moderate day');
  if (both > 2) bad(p, `${both} scales with a shape on both arms`);
  if (!isSolved(p, p.sol)) bad(p, 'the stored answer does not solve the board');
  const eng = countAnswers(p.n, p.max, p.scales);
  if (eng.count !== 1 || JSON.stringify(eng.first) !== JSON.stringify(p.sol)) bad(p, `the engine counts ${eng.count} answer(s)`);
  const br = brute(p);
  if (br.count !== 1 || JSON.stringify(br.first) !== JSON.stringify(p.sol)) bad(p, `brute force finds ${br.count} answer(s)`);
  if (band === 'gentle' && countAnswers(p.n, p.max, p.scales, { chain: true }).stuck) bad(p, 'a Gentle board that one-unknown-at-a-time reading does not solve');
  p.scales.forEach((sc, k) => {
    if (sc.t === '=') return;
    if (countAnswers(p.n, p.max, p.scales.filter((_, j) => j !== k)).count < 2) bad(p, `scale ${k + 1} is tilted but not needed`);
  });
}
const last = PUZZLES[PUZZLES.length - 1];
const left = Math.round((new Date(`${last.live}T12:00:00Z`) - Date.now()) / 86400000);
if (left < 10) console.log(`  WARN Scales bank ends ${last.live}, ${left} days left: node scripts/gen-scales.mjs --through <date>`);
console.log(fails ? `verify-scales: ${fails} failure(s) in ${PUZZLES.length} boards` : `verify-scales: ${PUZZLES.length} boards OK (to ${last.live})`);
process.exit(fails ? 1 : 0);
