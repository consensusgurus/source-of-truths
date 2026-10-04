// Verify the Judges bank (app/judges/puzzles.js) from scratch:
//   - structure: nums sequential, quizId/live/dateLabel agree, sunday flag
//     matches the weekday, no gaps or duplicate dates, stars: 2 on every board
//   - size: Monday to Saturday 10x10, the Sunday Edition 12x12
//   - regions: an n x n partition into n contiguous courts of 4+ cells; on a
//     12x12 the courts that share a stage hue (k and k+10) never touch
//   - EXACTLY ONE seating by its own exhaustive two-star search, equal to the
//     stored solution (no code shared with the generator)
//   - no guessing: scripts/jester2-human.mjs must finish it and land on it
//   - the weekday ramp: on the tier score, Monday < Tuesday < ... < Saturday
//   - no layout repeats, here or in the Jesters bank
// Run: node scripts/verify-judges.mjs
import { PUZZLES } from '../app/judges/puzzles.js';
import { PUZZLES as JESTERS } from '../app/jesters/puzzles.js';
import { humanSolve2 } from './jester2-human.mjs';

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SIZE_BY_DOW = { 0: 12, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };
const CUTOVER = '2026-10-04'; // boards on or before this are frozen (none exist yet)
let fails = 0;
const fail = (m) => { console.error('FAIL:', m); fails++; };

// cell-by-cell search: fill rows left to right, two per row, column and court
function countSeatings(n, reg, cap = 2) {
  const col = Array(n).fill(0), court = Array(n).fill(0), seat = Array.from({ length: n }, () => Array(n).fill(false));
  const courtCells = Array(n).fill(0);
  for (const row of reg) for (const x of row) courtCells[x]++;
  const left = courtCells.slice(); // cells of each court not yet decided
  const found = [];
  const touches = (r, c) => { for (let dr = -1; dr <= 0; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && dc >= 0) continue; const a = r + dr, b = c + dc; if (a >= 0 && b >= 0 && b < n && seat[a][b]) return true; } return false; };
  const go = (r, c, inRow) => {
    if (found.length >= cap) return;
    if (c === n) {
      if (inRow !== 2) return;
      for (let k = 0; k < n; k++) if (2 - col[k] > n - r - 1) return;
      if (r === n - 1) { if (court.every((x) => x === 2)) found.push(seat.map((row) => row.flatMap((v, j) => (v ? [j] : [])))); return; }
      go(r + 1, 0, 0); return;
    }
    if (n - c < 2 - inRow) return; // not enough cells left in the row
    const id = reg[r][c];
    left[id]--;
    // seat here
    if (inRow < 2 && col[c] < 2 && court[id] < 2 && !touches(r, c)) {
      seat[r][c] = true; col[c]++; court[id]++;
      go(r, c + 1, inRow + 1);
      seat[r][c] = false; col[c]--; court[id]--;
    }
    // leave empty (only if the court can still reach 2)
    if (court[id] + left[id] >= 2) go(r, c + 1, inRow);
    left[id]++;
  };
  go(0, 0, 0);
  return found;
}
function contiguous(n, reg, id) {
  const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (reg[r][c] === id) cells.push(r * n + c);
  if (!cells.length) return false;
  const set = new Set(cells), seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const cur = st.pop(), r = Math.floor(cur / n), c = cur % n;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc, k = a * n + b; if (a >= 0 && a < n && b >= 0 && b < n && set.has(k) && !seen.has(k)) { seen.add(k); st.push(k); } } }
  return seen.size === cells.length;
}

const seenLayouts = new Set(JESTERS.map((p) => JSON.stringify(p.regions)));
const seenDates = new Set(); let prev = null;
const grades = [];
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.quizId})`;
  if (p.num !== i + 1) fail(`${tag}: num out of sequence`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `judges-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live`);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const label = `${dt.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${d}, ${y}`;
  if (p.dateLabel !== label) fail(`${tag}: dateLabel "${p.dateLabel}" != "${label}"`);
  const dow = dt.getUTCDay();
  if (p.sunday !== (dow === 0)) fail(`${tag}: sunday flag disagrees with the weekday`);
  if (seenDates.has(p.live)) fail(`${tag}: duplicate date`); seenDates.add(p.live);
  if (prev && (dt - prev) / 86400000 !== 1) fail(`${tag}: gap before this board`); prev = dt;
  if (p.stars !== 2) fail(`${tag}: every Judges board seats two (stars: 2)`);
  const n = p.size;
  if (n !== SIZE_BY_DOW[dow]) fail(`${tag}: a ${DOW[dow]} is ${SIZE_BY_DOW[dow]}x${SIZE_BY_DOW[dow]}, got ${n}`);
  if (p.regions.length !== n || p.regions.some((row) => row.length !== n)) fail(`${tag}: regions not ${n}x${n}`);
  const sizes = Array(n).fill(0); let idsOK = true;
  for (const row of p.regions) for (const id of row) { if (!Number.isInteger(id) || id < 0 || id >= n) idsOK = false; else sizes[id]++; }
  if (!idsOK) { fail(`${tag}: bad court id`); return; }
  if (sizes.some((s) => s < 4)) fail(`${tag}: a court is too small to seat two`);
  for (let id = 0; id < n; id++) if (!contiguous(n, p.regions, id)) fail(`${tag}: court ${id} not contiguous`);
  for (let k = 10; k < n; k++) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (p.regions[r][c] !== k) continue;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc; if (a >= 0 && a < n && b >= 0 && b < n && p.regions[a][b] === k - 10) { fail(`${tag}: courts ${k - 10} and ${k} share a stage hue and touch`); r = n; c = n; break; } }
  }
  const key = JSON.stringify(p.regions);
  if (seenLayouts.has(key)) fail(`${tag}: duplicate layout`); seenLayouts.add(key);
  const sol = p.solution;
  if (!Array.isArray(sol) || sol.length !== n || sol.some((x) => !Array.isArray(x) || x.length !== 2)) { fail(`${tag}: solution is not ${n} column pairs`); return; }
  const found = countSeatings(n, p.regions, 2);
  if (found.length !== 1) fail(`${tag}: seating count != 1 (got ${found.length})`);
  else if (JSON.stringify(found[0]) !== JSON.stringify(sol)) fail(`${tag}: stored solution is not THE seating`);
  const hs = humanSolve2(n, p.regions);
  if (!hs.solved) fail(`${tag}: NOT solvable by pure deduction`);
  else {
    const human = Array.from({ length: n }, (_, r) => { const cs = []; for (let c = 0; c < n; c++) if (hs.star[r][c]) cs.push(c); return cs; });
    if (JSON.stringify(human) !== JSON.stringify(sol)) fail(`${tag}: deduction lands somewhere else`);
    if (p.live > CUTOVER && dow !== 0) grades.push({ dow, score: hs.tier[2] * 1 + hs.tier[3] * 4 + hs.tier[4] * 6 + hs.rounds * 0.25 });
  }
});
const means = {};
for (const w of [1, 2, 3, 4, 5, 6]) { const a = grades.filter((g) => g.dow === w).map((g) => g.score); if (!a.length) { fail(`no ${DOW[w]} boards`); continue; } means[w] = a.reduce((x, y) => x + y, 0) / a.length; }
for (let w = 2; w <= 6; w++) if (means[w] !== undefined && means[w - 1] !== undefined && means[w] <= means[w - 1]) fail(`ramp breaks: ${DOW[w]} (${means[w].toFixed(1)}) is not harder than ${DOW[w - 1]} (${means[w - 1].toFixed(1)})`);
if (fails) { console.error(`\nverify-judges: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-judges: all ${PUZZLES.length} boards pass (unique + pure-deduction, structure OK)`);
console.log('  10x10 ramp: ' + [1, 2, 3, 4, 5, 6].map((w) => `${DOW[w]} ${means[w].toFixed(1)}`).join('  ->  ') + `   Sundays 12x12: ${PUZZLES.filter((p) => p.sunday).length}`);
