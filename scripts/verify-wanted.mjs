// scripts/verify-wanted.mjs: checks Wanted, the enormous hidden figure hunt.
//
// Every board is rebuilt from its seed and compared with what was stored when
// it was generated: the number of things to find and the checksum of the whole
// scene. A mismatch means a district builder, a shared scene or a helper that
// places things was changed under a board that may have opened. Put it back.
//
// Also: the same build twice gives the same scene; every district on a board
// has Otis, Mabel and Biscuit; every hit box is inside the board; every board
// after the first carries at least two districts no earlier board used (owner,
// 2026-11-26: "every new inventory build will add some new districts"); the
// engine never reaches for Math.random or the clock; the site days are in
// order; and the schedule has no automatic turnover.
import fs from 'fs';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { BOARDS } = await import('../app/wanted/boards.js');
const { PUZZLES } = await import('../app/wanted/puzzles.js');
const { wantedBuild, wantedChecksum, WANTED_DISTRICTS, WANTED_DW, WANTED_DH, wantedHit } = await import('../lib/wanted-engine.js');
const { wantedWindows, wantedValue, wantedQuizId, WANTED_LAUNCH, WANTED_MIN_MS } = await import('../lib/wanted.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
const NEW_PER_BOARD = 2;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const src = fs.readFileSync(new URL('../lib/wanted-engine.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
for (const bad of ['Math.random', 'Date.now', 'new Date', 'Math.sin', 'Math.cos', 'Math.log', 'Math.pow', 'Math.exp', 'Math.tan', 'Math.atan', 'Math.hypot']) if (src.includes(bad)) fail(`lib/wanted-engine.js uses ${bad}: a board must build the same in every browser`);

const used = new Set();
BOARDS.forEach((b, k) => {
  if (b.num !== k + 1) fail(`board ${k + 1}: num`);
  if (b.key !== `wanted-b${b.num}`) fail(`board ${b.num}: key`);
  for (const d of b.districts) if (!WANTED_DISTRICTS.includes(d)) fail(`board ${b.num}: no district ${d}`);
  if (new Set(b.districts).size !== b.districts.length) fail(`board ${b.num}: a district twice`);
  if (b.num > 1) { const fresh = b.districts.filter((d) => !used.has(d)); if (fresh.length < NEW_PER_BOARD) fail(`board ${b.num}: ${fresh.length} new district(s), needs ${NEW_PER_BOARD}`); }
  b.districts.forEach((d) => used.add(d));
  let built;
  try { built = wantedBuild(b); } catch (e) { fail(`board ${b.num}: ${e.message}`); return; }
  const sum = wantedChecksum(built);
  if (built.targets.length !== b.n) fail(`board ${b.num}: ${built.targets.length} things to find, stored ${b.n}`);
  if (sum !== b.sum) fail(`board ${b.num}: checksum ${sum}, stored ${b.sum}. A frozen district moved.`);
  if (wantedChecksum(wantedBuild(b)) !== sum) fail(`board ${b.num}: two builds differ`);
  if (built.W !== b.cols * WANTED_DW || built.H !== Math.ceil(b.districts.length / b.cols) * WANTED_DH) fail(`board ${b.num}: size`);
  const cast = b.districts.map(() => ({}));
  built.targets.forEach((t, i) => {
    if (t.id !== i) fail(`board ${b.num}: target ids`);
    const [x0, y0, x1, y1] = t.box;
    if (!(x0 < x1 && y0 < y1) || x0 < -2 || y0 < -2 || x1 > built.W + 2 || y1 > built.H + 2) fail(`board ${b.num}: ${t.name} box off the board`);
    if (!t.name || !t.hint) fail(`board ${b.num}: target ${i} has no name or hint`);
    if (/—/.test(t.name + t.hint)) fail(`board ${b.num}: em dash in ${t.name}`);
    if (t.kind === 'cast') cast[t.d][t.name] = 1;
    // a tap in the middle of the box must land on something on the list
    const hit = wantedHit(built, (x0 + x1) / 2, (y0 + y1) / 2, 2);
    if (!hit || !hit.t) fail(`board ${b.num}: a tap on ${t.name} misses`);
  });
  cast.forEach((c, d) => { for (const who of ['Otis', 'Mabel', 'Biscuit']) if (!c[who]) fail(`board ${b.num}: no ${who} in ${b.districts[d]}`); });
  const per = b.districts.map(() => 0); built.targets.forEach((t) => per[t.d]++);
  per.forEach((n, d) => { if (n < 12) fail(`board ${b.num}: only ${n} things in ${b.districts[d]}`); });
  if (built.people.length < 900 * b.districts.length) fail(`board ${b.num}: thin crowd (${built.people.length})`);
  console.log(`board ${b.num}: ${b.districts.length} districts, ${built.people.length} figures, ${b.n} things to find`);
});

PUZZLES.forEach((d, i) => {
  if (d.num !== i + 1) fail(`site day ${i + 1}: num`);
  if (d.quizId !== wantedQuizId(d.live)) fail(`site day ${d.num}: quizId`);
  if (i && Date.parse(d.live) - Date.parse(PUZZLES[i - 1].live) !== 86400000) fail(`site day ${d.num}: not the day after`);
  const [y, m, dd] = d.live.split('-').map(Number);
  if (d.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) fail(`site day ${d.num}: dateLabel`);
});

if (wantedValue(1) !== 100 || wantedValue(2) !== 50 || wantedValue(40) !== 3 || wantedValue(3) !== 33) fail('the 100 point split');
const H = 3600000, L = WANTED_LAUNCH;
const w1 = wantedWindows(4, {}, L + 9000 * H);
if (w1.length !== 1 || w1[0].closes !== null) fail('no turnover: an unsolved board stays open however long it takes');
const w2 = wantedWindows(4, { 1: L + 5 * H }, L + 30 * H);
if (w2[0].closes !== L + WANTED_MIN_MS || w2[1].opens !== L + WANTED_MIN_MS) fail('a board solved early still runs 24 hours');
const w3 = wantedWindows(4, { 1: L + 400 * H }, L + 401 * H);
if (w3[0].closes !== L + 400 * H || w3.length !== 2) fail('a board closes the moment the crowd has everything');
const w5 = wantedWindows(1, { 1: L + 30 * H }, L + 500 * H);
if (w5[0].closes !== null) fail('the last board in the bank stays open');

if (fails) { console.log(`verify-wanted: ${fails} failure(s)`); process.exit(1); }
console.log(`verify-wanted: ${BOARDS.length} board(s), ${PUZZLES.length} site days, rules clean`);
