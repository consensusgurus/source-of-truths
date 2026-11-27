// scripts/verify-wanted.mjs: checks Wanted, the daily hidden picture hunt.
//
// Every day is rebuilt from its seed and compared with what was stored when it
// was generated: the number of things to find and the checksum of the whole
// scene. A mismatch means a district builder, a shared scene or a helper that
// places things was changed under a scene that may have gone live. Put it back.
//
// Also: the same build twice gives the same scene; every scene has Otis, Mabel
// and Biscuit; every hit box is inside the scene and a tap on it lands; the
// days run in order with the right ids and labels; the same place never comes
// round inside ten days; every inventory build after the first brings in at
// least two districts no earlier scene used (owner, 2026-11-26: "every new
// inventory build will add some new districts"); and the engine never reaches
// for Math.random or the clock.
import fs from 'fs';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { PUZZLES } = await import('../app/wanted/puzzles.js');
const { wantedBuild, wantedChecksum, WANTED_DISTRICTS, WANTED_DW, WANTED_DH, wantedHit } = await import('../lib/wanted-engine.js');
const { wantedQuizId, WANTED_FIRST_DAY } = await import('../lib/wanted.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
const NEW_PER_BUILD = 2, GAP = 10;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const src = fs.readFileSync(new URL('../lib/wanted-engine.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
for (const bad of ['Math.random', 'Date.now', 'new Date', 'Math.sin', 'Math.cos', 'Math.log', 'Math.pow', 'Math.exp', 'Math.tan', 'Math.atan', 'Math.hypot']) if (src.includes(bad)) fail(`lib/wanted-engine.js uses ${bad}: a scene must build the same on every machine`);

if (!PUZZLES.length || PUZZLES[0].live !== WANTED_FIRST_DAY) fail('the first day');
const firstBuild = new Map(); // district -> the build that first used it
let figures = 0;
PUZZLES.forEach((b, k) => {
  const tag = `${b.live} no. ${b.num}`;
  if (b.num !== k + 1) fail(`${tag}: num`);
  if (b.quizId !== wantedQuizId(b.live)) fail(`${tag}: quizId`);
  if (k && Date.parse(b.live) - Date.parse(PUZZLES[k - 1].live) !== 86400000) fail(`${tag}: not the day after`);
  const [y, m, dd] = b.live.split('-').map(Number);
  if (b.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) fail(`${tag}: dateLabel`);
  if (b.cols !== 1 || !Array.isArray(b.districts) || b.districts.length !== 1) fail(`${tag}: a day is one district`);
  const d = b.districts[0];
  if (!WANTED_DISTRICTS.includes(d)) { fail(`${tag}: no district ${d}`); return; }
  if (!(b.build >= 1) || (k && b.build < PUZZLES[k - 1].build)) fail(`${tag}: build`);
  for (let j = Math.max(0, k - GAP); j < k; j++) if (PUZZLES[j].districts[0] === d) fail(`${tag}: ${d} again within ${GAP} days`);
  if (!firstBuild.has(d)) firstBuild.set(d, b.build);
  let built;
  try { built = wantedBuild(b); } catch (e) { fail(`${tag}: ${e.message}`); return; }
  const sum = wantedChecksum(built);
  if (built.targets.length !== b.n) fail(`${tag}: ${built.targets.length} things to find, stored ${b.n}`);
  if (sum !== b.sum) fail(`${tag}: checksum ${sum}, stored ${b.sum}. A frozen district moved.`);
  if (wantedChecksum(wantedBuild(b)) !== sum) fail(`${tag}: two builds differ`);
  if (built.W !== WANTED_DW || built.H !== WANTED_DH) fail(`${tag}: size`);
  const cast = {};
  built.targets.forEach((t, i) => {
    if (t.id !== i) fail(`${tag}: target ids`);
    const [x0, y0, x1, y1] = t.box;
    if (!(x0 < x1 && y0 < y1) || x0 < -2 || y0 < -2 || x1 > built.W + 2 || y1 > built.H + 2) fail(`${tag}: ${t.name} box off the scene`);
    if (!t.name || !t.hint) fail(`${tag}: target ${i} has no name or hint`);
    if (/\u2014/.test(t.name + t.hint)) fail(`${tag}: em dash in ${t.name}`);
    if (t.kind === 'cast') cast[t.name] = 1;
    // a tap in the middle of the box must land on something on the list
    const hit = wantedHit(built, (x0 + x1) / 2, (y0 + y1) / 2, 2);
    if (!hit || !hit.t) fail(`${tag}: a tap on ${t.name} misses`);
  });
  for (const who of ['Otis', 'Mabel', 'Biscuit']) if (!cast[who]) fail(`${tag}: no ${who}`);
  if (b.n < 12 || b.n > 24) fail(`${tag}: ${b.n} things to find`);
  if (built.people.length < 900) fail(`${tag}: thin crowd (${built.people.length})`);
  figures += built.people.length;
});
const builds = [...new Set(PUZZLES.map((b) => b.build))].sort((a, b) => a - b);
for (const bn of builds.slice(1)) {
  const fresh = [...firstBuild.entries()].filter(([, v]) => v === bn).length;
  if (fresh < NEW_PER_BUILD) fail(`build ${bn}: ${fresh} new district(s), needs ${NEW_PER_BUILD}`);
}

if (fails) { console.log(`verify-wanted: ${fails} failure(s)`); process.exit(1); }
console.log(`verify-wanted: ${PUZZLES.length} days through ${PUZZLES[PUZZLES.length - 1].live}, ${firstBuild.size} places, ${builds.length} build(s), about ${Math.round(figures / PUZZLES.length)} figures a scene, rules clean`);
