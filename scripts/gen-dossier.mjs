// scripts/gen-dossier.mjs: deals the Dossier calendar into app/dossier/puzzles.js.
//
//   node scripts/gen-dossier.mjs > app/dossier/puzzles.js
//
// Deterministic (a seeded shuffle per universe). scripts/verify-dossier.mjs
// re-proves the bank and imports nothing from this file.
import { UNIVERSES } from '../app/dossier/universes.js';

const FIRST = '2026-10-04';
const DAYS = 78;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BY_DOW = { 1: 'presidents', 2: 'elements', 3: 'states', 4: 'presidents', 5: 'elements', 6: 'states' };
const SUNDAYS = ['presidents', 'elements', 'states'];

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function addDays(iso, k) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }

// one queue of eligible answers per universe; presidents keep a second,
// better-known queue for Mondays
const queues = {};
let seed = 20261004;
for (const u of Object.values(UNIVERSES)) {
  const pool = u.rows.filter((r) => u.every || r.easy).map((r) => r.name);
  queues[u.id] = shuffle(pool, rng(seed++));
}
const easyPres = new Set(UNIVERSES.presidents.rows.filter((r) => r.easy).map((r) => r.name));
const used = new Set();
function take(uid, wantEasy) {
  const q = queues[uid];
  let i = q.findIndex((nm) => !used.has(nm) && (!wantEasy || easyPres.has(nm)));
  if (i < 0) i = q.findIndex((nm) => !used.has(nm));
  if (i < 0) throw new Error(`universe ${uid} ran out`);
  used.add(q[i]);
  return q[i];
}

const out = [];
let sun = 0;
for (let k = 0; k < DAYS; k++) {
  const live = addDays(FIRST, k);
  const dow = new Date(`${live}T12:00:00Z`).getUTCDay();
  const sunday = dow === 0;
  const universe = sunday ? SUNDAYS[sun++ % 3] : BY_DOW[dow];
  const answer = take(universe, universe === 'presidents' && dow === 1);
  const [y, m, d] = live.split('-').map(Number);
  out.push({ num: k + 1, quizId: `dossier-${m}-${d}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, sunday, universe, guesses: sunday ? 6 : 8, answer });
}

const head = `// Puzzle data for Dossier, the daily attribute-feedback guessing game.
// Imported ONLY by the server page (app/dossier/page.js), which filters
// live<=today before handing puzzles to the client, so future answers never
// reach a browser.
//
// One hidden subject a day from that day's universe (app/dossier/universes.js).
// Rotation: Mon US presidents, Tue chemical elements, Wed US states, Thu
// presidents, Fri elements, Sat states; Sundays cycle the three in turn.
// guesses is 8 on a weekday and 6 on the Sunday Edition. No answer repeats.
// Element answers come only from the well-known (easy) elements; Monday's
// president is one of the better-known ones.
//
// Do NOT hand-edit. Regenerate with scripts/gen-dossier.mjs and re-run
// scripts/verify-dossier.mjs.
export const PUZZLES = [
`;
process.stdout.write(head + out.map((p) => '  ' + JSON.stringify(p) + ',').join('\n') + '\n];\n');
