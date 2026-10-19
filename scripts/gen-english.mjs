// scripts/gen-english.mjs - builds, then appends authored days to, one of the
// five English Gauntlet banks (app/<game>/questions.js and puzzles.js) from its
// two lane files in scripts/<game>-lanes/. Cloned from scripts/gen-sci.mjs
// (2026-10-19); the differences are a game argument, two lanes instead of five,
// ten questions a day (five tiers of two) and a 3/3/2/2 column plan.
//
//   node scripts/gen-english.mjs <gram|vocab|spell|origin|idiom> [--through YYYY-MM-DD] [--check]
//
// CREATE, THEN APPEND, exactly as gen-sci: the first run writes both files with
// day 1 live on FIRST_LIVE; every later run splices new days after the last one
// and proves the frozen prefix came back unchanged. Re-running on unchanged
// lanes is byte-identical (--check). No game carries a Sunday Edition.
//
// AFTER RUNNING: node scripts/verify-english.mjs <game>
import fs from 'fs';
import path from 'path';
import url from 'url';
// RECYCLED QUESTIONS (owner, 2026-10-09): an entry carrying `from: '<game>:<id>'`
// repeats a question nobody has ever answered. The rules and the proof live in
// scripts/trivia-recycle.mjs; this only carries the field through to the
// shipped file, where the verifier checks it against the play snapshots.
const fromField = (entry) => {
  if (entry.from == null) return '';
  if (!new RegExp(`^(${GAME}):d\\d{2,3}q\\d\\d$`).test(String(entry.from))) throw new Error(`bad from "${entry.from}" on "${entry.q}"`);
  return `, from: '${entry.from}'`;
};

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
import { ENGLISH_GAMES, FIRST_LIVE as FIRST } from './english-games.mjs';
const argv = process.argv.slice(2);
const GAME = argv.find((a) => ENGLISH_GAMES[a]);
if (!GAME) { console.error('usage: node scripts/gen-english.mjs <' + Object.keys(ENGLISH_GAMES).join('|') + '> [--through YYYY-MM-DD] [--check]'); process.exit(2); }
const CFG = ENGLISH_GAMES[GAME];
const Q_FILE = path.join(ROOT, `app/${GAME}/questions.js`);
const P_FILE = path.join(ROOT, `app/${GAME}/puzzles.js`);

const CHECK = argv.includes('--check');
const thruIdx = argv.indexOf('--through');
const THROUGH = thruIdx >= 0 ? argv[thruIdx + 1] : null;
const LANE_DIR = path.join(HERE, `${GAME}-lanes`);

const SUBJECTS = CFG.lanes.map(([n]) => n);
const LANE_FILE = Object.fromEntries(CFG.lanes);
const FIRST_LIVE = FIRST;
const QUIZ_PREFIX = GAME;
const PER_TIER = SUBJECTS.length;   // 2
const TOTAL_Q = PER_TIER * 5;       // 10
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const die = (m) => { console.error(`gen-english ${GAME}: ${m}`); process.exit(1); };

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

// 10 slots over 4 columns: 3/3/2/2, the two long columns rotating by day, and
// never the same column three times running. Rejection sampled from the day's
// own seed, offset by the first new day number.
function columnPlan(dayNum, offset) {
  const rnd = rng(seedOf(`${GAME}:cols:${offset}:${dayNum}`));
  const a = (dayNum + offset - 1) % 4, b = (a + 2) % 4;
  const bag = [];
  for (let c = 0; c < 4; c++) for (let i = 0; i < (c === a || c === b ? 3 : 2); i++) bag.push(c);
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
// verifier screens them from its COPY_FROM onward and a lane that imports one
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
// CREATE MODE: no bank yet. Both files are written whole from the headers
// below, and from then on every run appends.
const EXISTS = fs.existsSync(Q_FILE) && fs.existsSync(P_FILE);
if (fs.existsSync(Q_FILE) !== fs.existsSync(P_FILE)) die('one of questions.js / puzzles.js exists without the other; restore both or remove both');
if (CHECK && !EXISTS) die('--check needs a bank to compare against; there is none yet');
const qText = EXISTS ? fs.readFileSync(Q_FILE, 'utf8') : '';
const pText = EXISTS ? fs.readFileSync(P_FILE, 'utf8') : '';
const { QUESTIONS } = EXISTS ? await import(url.pathToFileURL(Q_FILE).href) : { QUESTIONS: [] };
const { PUZZLES } = EXISTS ? await import(url.pathToFileURL(P_FILE).href) : { PUZZLES: [] };
if (EXISTS && !PUZZLES.length) die('the bank file exists but is empty; restore it or remove both files to create afresh');

const Q_HEAD = `// Question bank for ${CFG.name}, the daily ${CFG.what} gauntlet in the English
// Gauntlet. Imported ONLY by the server page (app/${GAME}/page.js), which resolves
// the picked day's ten questions and hands the client just that day, so the rest
// of the bank never reaches a browser. GENERATED by scripts/gen-english.mjs from
// scripts/${GAME}-lanes/.
//
//   id       'd<day>q<slot>' - authored day and play order (slot 1..10)
//   cat      one of two lanes; each tier block covers both, always in the same
//            order: ${SUBJECTS.join(', ')}
//   tier     1 (gimme) .. 5 (expert); a day ramps 2 questions per tier
//   choices  exactly four, one defensibly correct; the correct position came
//            from a per-day balanced no-3-run sequence at build time, so do NOT
//            hand-reorder choices here
//
// ONE DEFENSIBLE ANSWER. The standard is edited American English where
// Merriam-Webster, AP and Chicago agree; anything they dispute is not asked.
//
// Extending the bank: author new days in the lane files, run
// scripts/gen-english.mjs ${GAME} (it appends, never rewrites), then
// scripts/verify-english.mjs ${GAME}.
export const QUESTIONS = [
];

export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
`;
const P_HEAD = `// Puzzle data for ${CFG.name}, the daily ${CFG.what} gauntlet. Each day is ten
// question ids from questions.js in play order: five tiers of two, gimme to
// expert, each tier cycling the same two lanes. Imported by the server page
// (which resolves and gates by Eastern date), the archive map, the circuit run
// and the daily APIs. No day carries a \`sunday\` field: no Sunday Edition.
// GENERATED by scripts/gen-english.mjs; append only, the past is frozen.
export const PUZZLES = [
];
`;

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
// FRESH: the output is the whole file (create mode, or --check on a bank that
// is exactly one lane-set long). Otherwise it is a splice after an anchor day.
const FRESH = !EXISTS || (CHECK && PUZZLES.length === nDays);
const anchor = FRESH ? null : PUZZLES[PUZZLES.length - 1 - (CHECK ? nDays : 0)];
const startDay = FRESH ? 1 : anchor.num + 1;
const startLive = FRESH ? FIRST_LIVE : new Date(Date.parse(`${anchor.live}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
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
    const rnd = rng(seedOf(`${GAME}:choices:${startDay}:${id}`));
    const wrong = shuffled(entry.d, rnd);
    const correct = cols[slot - 1];
    const choices = [];
    for (let c = 0, w = 0; c < 4; c++) choices.push(c === correct ? entry.a : wrong[w++]);

    qids.push(id);
    qLines.push(`  { id: '${id}', cat: '${esc(subject)}', tier: ${t}, q: '${esc(entry.q)}', choices: [${choices.map((c) => `'${esc(c)}'`).join(', ')}], correct: ${correct}${fromField(entry)} },`);
  }
  if (qids.length !== TOTAL_Q) die(`day ${num}: built ${qids.length} questions, need ${TOTAL_Q}`);

  dates.push(live);
  pEntries.push([
    '  {',
    `    num: ${num},`,
    `    quizId: '${QUIZ_PREFIX}-${Number(m)}-${Number(dd)}-${y.slice(2)}',`,
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
  // FRESH: splice into the empty header, so the bytes are exactly what a
  // create run writes.
  if (FRESH) text = file === 'questions.js' ? Q_HEAD : P_HEAD;
  // The tail is always the `\n];` that closes the exported array and whatever
  // follows it. On an append the head is everything before that, so the new
  // days land at the end. On --check the head instead stops where the segment
  // being re-derived begins, so the rebuild replaces the bytes already there
  // and can be compared against the file byte for byte.
  const close = text.lastIndexOf('\n];');
  if (close < 0) die(`${file}: cannot find the closing bracket of the exported array`);
  let at = close;
  if (CHECK && !FRESH) {
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
  if (qSame && pSame) { console.log(`gen-english ${GAME} --check: days ${startDay}..${startDay + nDays - 1} in the bank are byte-identical to what the lanes produce`); process.exit(0); }
  console.error(`gen-english ${GAME} --check: the bank DIFFERS from the lanes (questions.js ${qSame ? 'ok' : 'differs'}, puzzles.js ${pSame ? 'ok' : 'differs'})`);
  process.exit(1);
}

fs.writeFileSync(Q_FILE, qOut);
fs.writeFileSync(P_FILE, pOut);
console.log(`gen-english ${GAME}: ${EXISTS ? '+' : 'created, '}${qLines.length} questions, +${pEntries.length} days (${startDay}..${startDay + nDays - 1}), ${dates[0]} to ${dates[dates.length - 1]}`);
console.log(`         bank is now ${QUESTIONS.length + qLines.length} questions across ${PUZZLES.length + pEntries.length} days`);
