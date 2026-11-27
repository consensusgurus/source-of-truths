// scripts/gen-wanted.mjs: adds boards to Wanted, the enormous hidden figure hunt,
// and writes the site days its results are filed under.
//
//   node scripts/gen-wanted.mjs --boards 3            append boards until the bank holds 3
//   node scripts/gen-wanted.mjs --days 2027-12-31     extend the site days
//
// A board is a SEED AND A LIST OF DISTRICTS, nothing else: lib/wanted-engine.js
// builds the whole scene from them, in the browser, every time. This script
// picks the districts, builds the board once to count what is on it, and stores
// that count and a checksum so scripts/verify-wanted.mjs can tell if a district
// builder is ever changed under a board that has opened.
//
// THE OWNER'S RULE FOR EVERY INVENTORY BUILD (2026-11-26: "every new inventory
// build will add some new districts"): a new board must carry at least
// NEW_PER_BOARD districts that no earlier board has used. So BEFORE running this
// for a new board, write that many new districts in lib/wanted-engine.js
// (DISTRICTS, and read the three rules at the top of that file first). This
// script refuses to build a board without them. New shared scenes, lost things
// and one-of-a-kind people are welcome in the same pass: append them to the END
// of SCENES, THINGS and UNIQUES, never the middle.
//
// APPEND-ONLY: a board already in app/wanted/boards.js is never rewritten.
import fs from 'fs';
import path from 'path';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { wantedBuild, wantedChecksum, wantedPools, wantedRng, WANTED_DISTRICTS } = await import('../lib/wanted-engine.js');
const { wantedQuizId, WANTED_LAUNCH } = await import('../lib/wanted.js');

export const NEW_PER_BOARD = 2;
const PER_BOARD = 16, COLS = 4;
// Board 1's sixteen, in the order they sit on the page.
const FIRST = ['fairground', 'beach', 'market', 'harbor', 'slopes', 'zoo', 'camp', 'sportsday', 'station', 'castle', 'farm', 'downtown', 'airfield', 'museum', 'waterpark', 'parade'];

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const want = Number(arg('--boards', 0));
const daysTo = arg('--days', null);
const dir = path.join('.', 'app', 'wanted');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'boards.js');

let BOARDS = [];
if (fs.existsSync(file)) BOARDS = (await import(path.resolve(file))).BOARDS;
const boards = BOARDS.map((b) => ({ ...b }));
function shuffled(a, R) { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }

while (boards.length < want) {
  const num = boards.length + 1;
  const seed = (0x57a17ed ^ Math.imul(num, 0x9E3779B1)) | 0;
  let districts;
  if (num === 1) districts = FIRST.slice();
  else {
    const used = new Set(boards.flatMap((b) => b.districts));
    const fresh = WANTED_DISTRICTS.filter((d) => !used.has(d));
    if (fresh.length < NEW_PER_BOARD) {
      console.error(`gen-wanted: board ${num} needs ${NEW_PER_BOARD} districts no earlier board has used, and only ${fresh.length} exist.\nWrite new districts in lib/wanted-engine.js first (owner, 2026-11-26: "every new inventory build will add some new districts").`);
      process.exit(1);
    }
    const R = wantedRng(seed ^ 0x51ed);
    const old = shuffled(WANTED_DISTRICTS.filter((d) => used.has(d)), R).slice(0, PER_BOARD - Math.min(fresh.length, 4));
    districts = shuffled([...shuffled(fresh, R).slice(0, 4), ...old], R).slice(0, PER_BOARD);
  }
  const spec = { num, key: `wanted-b${num}`, seed, cols: COLS, districts, pool: wantedPools() };
  const built = wantedBuild(spec);
  spec.n = built.targets.length; spec.sum = wantedChecksum(built);
  boards.push(spec);
  console.log(`board ${num}: ${districts.length} districts, ${built.people.length} figures, ${spec.n} things to find, checksum ${spec.sum}`);
}
if (boards.length !== BOARDS.length) {
  fs.writeFileSync(file, `// The boards for Wanted, the enormous hidden figure hunt (launched 2026-11-26), in
// the order they open. A board is a seed and a list of districts; the scene is
// built from them by lib/wanted-engine.js, in the browser. \`n\` is how many
// things are on the list and \`sum\` the checksum of the built scene, both stored
// when the board was generated (scripts/verify-wanted.mjs rebuilds and compares).
// \`pool\` pins how long the engine's lists were that day, so appending to them
// never moves an older board.
//
// A board opens when the one before it closes, and it closes only when the
// crowd has found everything on it (lib/wanted.js: no automatic turnover).
//
// Written by scripts/gen-wanted.mjs (append-only). SERVER-ONLY: the page hands
// the browser just the one board being played.
export const BOARDS = [
${boards.map((b) => '  ' + JSON.stringify(b) + ',').join('\n')}
];
`);
}

const daysFile = path.join(dir, 'puzzles.js');
if (daysTo || !fs.existsSync(daysFile)) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const start = Date.parse(new Date(WANTED_LAUNCH).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) + 'T00:00:00Z');
  const end = Date.parse((daysTo || '2027-06-30') + 'T00:00:00Z');
  const rows = [];
  for (let t = start, n = 1; t <= end; t += 86400000, n++) {
    const iso = new Date(t).toISOString().slice(0, 10);
    const [y, m, d] = iso.split('-').map(Number);
    rows.push(`  ${JSON.stringify({ num: n, quizId: wantedQuizId(iso), live: iso, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}` })},`);
  }
  fs.writeFileSync(daysFile, `// The site days for Wanted: one row per Eastern day, the day a player's Wanted
// points are filed under (as Search's day list). There are no boards here; the
// boards are in ./boards.js and open one after another as each is solved.
// GENERATED by scripts/gen-wanted.mjs --days; extend the dates as needed.
export const PUZZLES = [
${rows.join('\n')}
];
`);
  console.log(`wanted: ${rows.length} site days through ${daysTo || '2027-06-30'}`);
}
