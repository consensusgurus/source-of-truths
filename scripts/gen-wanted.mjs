// scripts/gen-wanted.mjs: adds days to Wanted, the daily hidden picture hunt
// (app/wanted/puzzles.js).
//
//   node scripts/gen-wanted.mjs --through 2026-12-31   add a scene for every day up to that date
//
// ONE SCENE A DAY (owner, 2026-11-26: "make each day a different scene"). A
// board is a DATE, A SEED AND ONE DISTRICT, nothing else: lib/wanted-engine.js
// builds the whole scene from them, in the browser, every time. This script
// picks each day's district, builds the scene once to count what is on it, and
// stores that count and a checksum so scripts/verify-wanted.mjs can tell if a
// district builder is ever changed under a scene that has opened.
//
// THE OWNER'S RULE FOR EVERY INVENTORY BUILD (2026-11-26: "every new inventory
// build will add some new districts"): each run of this script that adds
// scenes is one BUILD (`build` on every row), and every build after the
// first must bring in at least NEW_PER_BUILD districts that no earlier scene
// has used. So BEFORE running this to restock, write that many new districts
// in lib/wanted-engine.js (DISTRICTS, and read the three rules at the top of
// that file first). This script refuses to restock without them, and gives the
// new districts the first days of the new stretch. New shared scenes, lost
// things and one-of-a-kind people are welcome in the same pass: append them to
// the END of SCENES, THINGS and UNIQUES, never the middle.
//
// The same place never comes round again inside GAP days.
//
// APPEND-ONLY: a day already in app/wanted/puzzles.js is never rewritten.
import fs from 'fs';
import path from 'path';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { wantedBuild, wantedChecksum, wantedPools, wantedRng, WANTED_DISTRICTS } = await import('../lib/wanted-engine.js');
const { wantedQuizId, WANTED_FIRST_DAY } = await import('../lib/wanted.js');

export const NEW_PER_BUILD = 2;
const GAP = 10;

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const through = arg('--through', null);
if (!through) { console.error('usage: node scripts/gen-wanted.mjs --through YYYY-MM-DD'); process.exit(1); }
const dir = path.join('.', 'app', 'wanted');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'puzzles.js');

let PUZZLES = [];
if (fs.existsSync(file)) PUZZLES = (await import(path.resolve(file))).PUZZLES;
const rows = PUZZLES.map((b) => ({ ...b }));
function shuffled(a, R) { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const end = Date.parse(through + 'T00:00:00Z');
let t = rows.length ? Date.parse(rows[rows.length - 1].live + 'T00:00:00Z') + DAY : Date.parse(WANTED_FIRST_DAY + 'T00:00:00Z');
if (t > end) { console.log(`wanted: the bank already runs through ${rows[rows.length - 1].live}`); process.exit(0); }
const build = rows.length ? Math.max(...rows.map((b) => b.build)) + 1 : 1;
const used = new Set(rows.flatMap((b) => b.districts));
const fresh = WANTED_DISTRICTS.filter((d) => !used.has(d));
if (build > 1 && fresh.length < NEW_PER_BUILD) {
  console.error(`gen-wanted: build ${build} needs ${NEW_PER_BUILD} districts no earlier scene has used, and only ${fresh.length} exist.\nWrite new districts in lib/wanted-engine.js first (owner, 2026-11-26: "every new inventory build will add some new districts").`);
  process.exit(1);
}
const R = wantedRng((0x57a17ed ^ Math.imul(build, 0x9E3779B1)) | 0);
// the new districts lead the stretch; after that, whichever place has waited longest, with a shuffle among ties
const queue = build > 1 ? shuffled(fresh, R) : [];
const lastAt = new Map(); rows.forEach((b, k) => lastAt.set(b.districts[0], k));
for (; t <= end; t += DAY) {
  const num = rows.length + 1, live = iso(t);
  let d = queue.shift();
  if (!d) {
    const order = shuffled(WANTED_DISTRICTS, R).sort((a, b) => (lastAt.has(a) ? lastAt.get(a) : -1) - (lastAt.has(b) ? lastAt.get(b) : -1));
    d = order[0];
    if (lastAt.has(d) && rows.length - lastAt.get(d) <= Math.min(GAP, WANTED_DISTRICTS.length - 1)) throw new Error('gen-wanted: a place came round too soon');
  }
  lastAt.set(d, rows.length);
  const [y, m, dd] = live.split('-').map(Number);
  const seed = (0x0715d ^ Math.imul(num, 0x9E3779B1)) | 0;
  const spec = { num, quizId: wantedQuizId(live), live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, build, seed, cols: 1, districts: [d], pool: wantedPools() };
  const built = wantedBuild(spec);
  spec.n = built.targets.length; spec.sum = wantedChecksum(built);
  rows.push(spec);
  console.log(`${live} no. ${num}: ${d}, ${built.people.length} figures, ${spec.n} things to find, checksum ${spec.sum}`);
}
fs.writeFileSync(file, `// Puzzle data for Wanted, the daily hidden picture hunt (launched 2026-11-26):
// one scene per Eastern day. A row is a date, a seed and one district; the
// scene is built from them by lib/wanted-engine.js, in the browser. \`n\` is how
// many things are on the list and \`sum\` the checksum of the built scene, both
// stored when the row was generated (scripts/verify-wanted.mjs rebuilds and
// compares). \`pool\` pins how long the engine's lists were that day, so
// appending to them never moves an older scene. \`build\` is the inventory
// build that added the row: every build after the first brings in districts no
// earlier scene used (owner, 2026-11-26).
//
// Imported ONLY by server pages, which filter live<=today, so a future day's
// seed never reaches a browser. No Sunday Edition.
//
// GENERATED by scripts/gen-wanted.mjs (append-only). Never hand-edit a row.
export const PUZZLES = [
${rows.map((b) => '  ' + JSON.stringify(b) + ',').join('\n')}
];
`);
console.log(`wanted: ${rows.length} days through ${rows[rows.length - 1].live} (build ${build})`);
