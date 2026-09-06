// scripts/gen-biz.mjs - appends authored days to the Biz bank (app/biz/
// questions.js and app/biz/puzzles.js) from the five per-lane files in
// scripts/biz-lanes/.
//
//   node scripts/gen-biz.mjs [laneDir] [--through YYYY-MM-DD] [--check]
//
// WHY A GENERATOR AND NOT A HAND ASSEMBLY. Four things about a Biz day are
// mechanical, and they are exactly the four a human gets wrong at 1,425
// questions: the interleave (five tier blocks, each cycling the same five
// business lanes in the same order), the ids, the identity fields, and the
// per-day correct-answer column spread. Lane authors therefore write only the
// question, its true answer and three distractors, always in that order, and
// never choose a column; this script owns everything else. Re-running it on
// unchanged lanes is byte-identical. Same shape as scripts/gen-atlas.mjs,
// which did this job for the Atlas bank; the differences are the lane list,
// the quizId prefix and the file paths.
//
// THE PAST IS FROZEN (CLAUDE.md authoring standard rule 10). This script does
// not regenerate the bank. It reads the two files as text, keeps every byte up
// to the closing bracket of each array, and splices the new days in before it,
// asserting afterwards that the frozen prefix came back unchanged. Day numbers
// and live dates continue from whatever the bank already ends with, so the
// starting point is derived rather than typed. A day already in the bank can
// never be reached by this script, which is the point.
//
// LANE FILES. scripts/biz-lanes/biz-<slug>.mjs, one per lane, each exporting
// LANE_DAYS: an array of N days, each day five questions in tier order 1..5,
// shaped
//
//   { c: '<lane>', t: 1..5, q: '...', a: '<true answer>', d: ['<wrong>' x3] }
//
// All five lanes must carry the same number of days. Day i of the assembled
// bank is lane-major within each tier block: slot 1 is tier 1 Brands &
// Products, slot 2 tier 1 Markets & Money, ... slot 25 tier 5 Business
// History, which is the order scripts/verify-biz.mjs enforces.
//
// COLUMNS. Each day gets a balanced no-3-run sequence over the four columns
// (6/6/6/7, the long column rotating by day) drawn from the day's own seed, so
// no day can pile its answers into one column and a rebuild reproduces the
// same bank. THE SEED IS OFFSET BY THE FIRST NEW DAY NUMBER, so an appended
// segment cannot replay the column pattern of the frozen days it follows.
//
// NO SUNDAY EDITION. Biz runs none, so new days carry no `sunday` field at all
// (CLAUDE.md, "Adding a BRAND NEW daily game"); the verifier fails any day
// that sets one. Days 1-39 shipped with an always-false `sunday` and keep it,
// because the past is frozen, not because the field means anything.
//
// --check RE-DERIVES the segment the bank already ends with and compares it to
// the file without writing anything, so CI can ask whether the shipped bank is
// still what these lanes say. It rewinds by the lane length rather than
// appending, which is the only difference between the two modes.
//
// AFTER RUNNING: node scripts/verify-biz.mjs
import fs from 'fs';
import path from 'path';
import url from 'url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const Q_FILE = path.join(ROOT, 'app/biz/questions.js');
const P_FILE = path.join(ROOT, 'app/biz/puzzles.js');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const thruIdx = argv.indexOf('--through');
const THROUGH = thruIdx >= 0 ? argv[thruIdx + 1] : null;
const laneArg = argv.find((a) => !a.startsWith('--') && a !== THROUGH);
const LANE_DIR = path.resolve(laneArg || path.join(HERE, 'biz-lanes'));

// The shape of the game: five lanes, always in this order inside every tier
// block. Same list, same order, as scripts/verify-biz.mjs.
const SUBJECTS = ['Brands & Products', 'Markets & Money', 'Founders & Bosses', 'Deals & Disasters', 'Business History'];
const LANE_FILE = {
  'Brands & Products': 'biz-brands-products.mjs',
  'Markets & Money': 'biz-markets-money.mjs',
  'Founders & Bosses': 'biz-founders-bosses.mjs',
  'Deals & Disasters': 'biz-deals-disasters.mjs',
  'Business History': 'biz-business-history.mjs',
};
const PER_TIER = SUBJECTS.length;   // 5
const TOTAL_Q = PER_TIER * 5;       // 25
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const die = (m) => { console.error(`gen-biz: ${m}`); process.exit(1); };

// ---- deterministic PRNG (mulberry32 over an FNV-1a seed) -------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffled(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 25 slots over 4 columns: every column at least 5 (so 6/6/6/7, the long one
// rotating), and never the same column three times running. Rejection sampled
// from the day's own seed, offset by the first new day number so an appended
// segment cannot repeat the frozen segment's sequence.
function columnPlan(dayNum, offset) {
  const rnd = rng(seedOf(`biz:cols:${offset}:${dayNum}`));
  const long = (dayNum + offset - 1) % 4;
  const bag = [];
  for (let c = 0; c < 4; c++) for (let i = 0; i < (c === long ? 7 : 6); i++) bag.push(c);
  for (let attempt = 0; attempt < 5000; attempt++) {
    const p = shuffled(bag, rnd);
    let ok = true;
    for (let i = 2; i < p.length; i++) if (p[i] === p[i - 1] && p[i] === p[i - 2]) { ok = false; break; }
    if (ok) return p;
  }
  throw new Error(`day ${dayNum}: no no-3-run column plan found`);
}

// ---- emitted copy is straight ASCII ---------------------------------------
// Curly quotes and en dashes are folded here rather than policed in the lanes.
// The em dash is banned outright by the site's writing rules and the verifier
// fails on one, so it is left alone: a lane that contains one should fail,
// not be quietly repaired. British spellings are likewise NOT folded: the
// verifier screens them from BIZ_COPY_FROM onward and a lane that imports one
// should fail loudly rather than be silently Americanized here.
const esc = (s) => String(s)
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/–/g, '-')
  .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const pad2 = (n) => String(n).padStart(2, '0');
// 'd<day>q<slot>': the day zero padded to two digits and widening to three past
// day 99, the slot always two. Same rule as the verifier's id regex.
const qidFor = (day, slot) => `d${day < 100 ? pad2(day) : String(day)}q${pad2(slot)}`;

// ---- read the bank we are extending ---------------------------------------
const qText = fs.readFileSync(Q_FILE, 'utf8');
const pText = fs.readFileSync(P_FILE, 'utf8');
const { QUESTIONS } = await import(url.pathToFileURL(Q_FILE).href);
const { PUZZLES } = await import(url.pathToFileURL(P_FILE).href);
if (!PUZZLES.length) die('the bank is empty; this script appends, it does not create');

// --check re-derives the segment the bank ALREADY ends with and compares it to
// the file, so CI can ask "is the bank still what these lanes say?" without
// writing anything. It therefore anchors nDays earlier than a real append does.

// ---- read the lanes -------------------------------------------------------
const lanes = [];
for (const subject of SUBJECTS) {
  const f = path.join(LANE_DIR, LANE_FILE[subject]);
  if (!fs.existsSync(f)) die(`lane file not found: ${f}`);
  const { LANE_DAYS } = await import(url.pathToFileURL(f).href);
  if (!Array.isArray(LANE_DAYS)) die(`${f}: no LANE_DAYS array`);
  lanes.push(LANE_DAYS);
}
const nDays = lanes[0].length;
lanes.forEach((L, i) => { if (L.length !== nDays) die(`${LANE_FILE[SUBJECTS[i]]} has ${L.length} days, ${LANE_FILE[SUBJECTS[0]]} has ${nDays}`); });
if (!nDays) die('the lanes carry no days');

// Where the new segment starts. A real run appends after the last day in the
// bank; --check rewinds nDays and rebuilds the segment already there.
if (CHECK && PUZZLES.length < nDays) die(`--check needs a bank of at least ${nDays} days to rewind into; it has ${PUZZLES.length}`);
const anchor = PUZZLES[PUZZLES.length - 1 - (CHECK ? nDays : 0)];
const startDay = anchor.num + 1;
const startLive = new Date(Date.parse(`${anchor.live}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const haveIds = new Set(CHECK ? [] : QUESTIONS.map((q) => q.id));

// ---- build ----------------------------------------------------------------
const qLines = [];
const pEntries = [];
const dates = [];

for (let d = 0; d < nDays; d++) {
  const num = startDay + d;
  const cols = columnPlan(num, startDay);
  const live = new Date(Date.parse(`${startLive}T00:00:00Z`) + d * 86400000).toISOString().slice(0, 10);
  const [y, m, dd] = live.split('-');
  const qids = [];

  for (let t = 1; t <= 5; t++) for (let s = 0; s < PER_TIER; s++) {
    const subject = SUBJECTS[s];
    const entry = lanes[s][d][t - 1];
    const slot = (t - 1) * PER_TIER + s + 1;
    const id = qidFor(num, slot);
    if (!entry) die(`${LANE_FILE[subject]} day ${d + 1}: no tier ${t} question`);
    if (entry.c !== subject) die(`${id}: lane says "${entry.c}", the lane cycle wants "${subject}"`);
    if (entry.t !== t) die(`${id}: lane says tier ${entry.t}, the ramp wants ${t}`);
    if (!entry.q || !entry.a || !Array.isArray(entry.d) || entry.d.length !== 3) die(`${id}: needs q, a and exactly 3 distractors`);
    if (haveIds.has(id)) die(`${id} is already in the bank; the past is frozen`);   // (empty set under --check, which rebuilds ids that are there on purpose)

    // The correct answer is never authored into a position: the day's plan
    // says which column it lands in, and the three wrong answers fill the rest
    // in an order drawn from the question's own seed.
    const rnd = rng(seedOf(`biz:choices:${startDay}:${id}`));
    const wrong = shuffled(entry.d, rnd);
    const correct = cols[slot - 1];
    const choices = [];
    for (let c = 0, w = 0; c < 4; c++) choices.push(c === correct ? entry.a : wrong[w++]);

    qids.push(id);
    qLines.push(`  { id: '${id}', cat: '${esc(subject)}', tier: ${t}, q: '${esc(entry.q)}', choices: [${choices.map((c) => `'${esc(c)}'`).join(', ')}], correct: ${correct} },`);
  }
  if (qids.length !== TOTAL_Q) die(`day ${num}: built ${qids.length} questions, need ${TOTAL_Q}`);

  dates.push(live);
  pEntries.push([
    '  {',
    `    num: ${num},`,
    `    quizId: 'biz-${Number(m)}-${Number(dd)}-${y.slice(2)}',`,
    `    live: '${live}',`,
    `    dateLabel: '${MONTHS[Number(m) - 1]} ${Number(dd)}, ${y}',`,
    `    qids: [${qids.map((i) => `'${i}'`).join(', ')}],`,
    '  },',
  ].join('\n'));
}

if (THROUGH && dates[dates.length - 1] !== THROUGH) {
  die(`the lanes carry ${nDays} days, which runs ${dates[0]} to ${dates[dates.length - 1]}, not through ${THROUGH}`);
}

// ---- splice, keeping every frozen byte ------------------------------------
function splice(text, file, marker) {
  // The tail is always the `\n];` that closes the exported array and whatever
  // follows it. On an append the head is everything before that, so the new
  // days land at the end. On --check the head instead stops where the segment
  // being re-derived begins, so the rebuild replaces the bytes already there
  // and can be compared against the file byte for byte.
  const close = text.lastIndexOf('\n];');
  if (close < 0) die(`${file}: cannot find the closing bracket of the exported array`);
  let at = close;
  if (CHECK) {
    at = text.indexOf(marker);
    if (at < 0) die(`${file}: cannot find the start of day ${startDay} (${marker.trim()})`);
  }
  return { head: text.slice(0, at + 1), tail: text.slice(close + 1) };
}
const q = splice(qText, 'questions.js', `\n  { id: '${qidFor(startDay, 1)}',`);
const p = splice(pText, 'puzzles.js', `\n  {\n    num: ${startDay},\n`);
const qOut = `${q.head}${qLines.join('\n')}\n${q.tail}`;
const pOut = `${p.head}${pEntries.join('\n')}\n${p.tail}`;

// Prove the freeze rather than trusting it: everything before the insertion
// point must come back exactly as it went in.
if (!qOut.startsWith(q.head)) die('questions.js: the frozen prefix changed');
if (!pOut.startsWith(p.head)) die('puzzles.js: the frozen prefix changed');

if (CHECK) {
  const qSame = qText === qOut;
  const pSame = pText === pOut;
  if (qSame && pSame) { console.log(`gen-biz --check: days ${startDay}..${startDay + nDays - 1} in the bank are byte-identical to what the lanes produce`); process.exit(0); }
  console.error(`gen-biz --check: the bank DIFFERS from the lanes (questions.js ${qSame ? 'ok' : 'differs'}, puzzles.js ${pSame ? 'ok' : 'differs'})`);
  process.exit(1);
}

fs.writeFileSync(Q_FILE, qOut);
fs.writeFileSync(P_FILE, pOut);
console.log(`gen-biz: +${qLines.length} questions, +${pEntries.length} days (${startDay}..${startDay + nDays - 1}), ${dates[0]} to ${dates[dates.length - 1]}`);
console.log(`         bank is now ${QUESTIONS.length + qLines.length} questions across ${PUZZLES.length + pEntries.length} days`);
