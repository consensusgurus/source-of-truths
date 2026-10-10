// scripts/gen-mcq.mjs — builds a 25-question gauntlet bank (the Atlas / Sport /
// Biz shape) from an authored source file into the two files the game ships:
// app/<key>/questions.js and app/<key>/puzzles.js.
//
//   node scripts/gen-mcq.mjs <key> <sourceFile> <outDir> <firstLiveDate>
//
// WHY A GENERATOR AND NOT HAND-WRITTEN DATA. Three things in this shape are
// mechanical and are exactly the things a human gets wrong at 750 questions:
// the ids, the per-day correct-answer column spread, and the choice order. So
// the author writes only the question, the true answer and three distractors,
// always in that order, and this script owns the rest. In particular the
// correct answer is NEVER authored into a position: every day gets a balanced
// no-3-run column sequence derived deterministically from its day number, so
// the bank cannot drift into a column bias and nobody is ever tempted to
// "fix" a choices array by hand. Re-running this on an unchanged source is
// byte-identical.
//
// Source shape (one array per day, tier-major and lane-minor, 25 entries):
//   export const DAYS = [[{ c: '<lane>', t: 1..5, q: '...', a: '<true>',
//                          d: ['<wrong>', '<wrong>', '<wrong>'] }, ...], ...];
//   export const LANES = ['<five lanes in cycle order>'];
import fs from 'fs';
import path from 'path';
// RECYCLED QUESTIONS (owner, 2026-10-09): an entry carrying `from: '<game>:<id>'`
// repeats a question nobody has ever answered. The rules and the proof live in
// scripts/trivia-recycle.mjs; this only carries the field through to the
// shipped file, where the verifier checks it against the play snapshots.
const fromField = (entry) => {
  if (entry.from == null) return '';
  if (!/^(streak|deep|atlas|sport|biz|quotes|script):d\d{2,3}q\d\d$/.test(String(entry.from))) throw new Error(`bad from "${entry.from}" on "${entry.q}"`);
  return `, from: '${entry.from}'`;
};

const [key, srcFile, outDir, firstLive] = process.argv.slice(2);
if (!key || !srcFile || !outDir || !firstLive) {
  console.error('usage: node gen-mcq.mjs <key> <sourceFile> <outDir> <YYYY-MM-DD>');
  process.exit(1);
}

const { DAYS, LANES } = await import(path.resolve(srcFile));
const PER_TIER = LANES.length;          // 5
const TOTAL_Q = PER_TIER * 5;           // 25

// A tiny deterministic PRNG, so a rebuild of an unchanged source is identical.
// mulberry32 over a seed made from the key and the day number.
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

// The day's correct-answer columns: 25 slots over 4 columns, every column at
// least 5 (so the spread is 6/6/6/7, the long column rotating by day) and never
// the same column three times running. Rejection-sampled from the day's own
// seed, which always lands inside a handful of tries.
function columnPlan(dayNum) {
  const rnd = rng(seedOf(`${key}:cols:${dayNum}`));
  const long = (dayNum - 1) % 4;
  const bag = [];
  for (let c = 0; c < 4; c++) for (let i = 0; i < (c === long ? 7 : 6); i++) bag.push(c);
  for (let attempt = 0; attempt < 5000; attempt++) {
    const p = shuffled(bag, rnd);
    let ok = true;
    for (let i = 2; i < p.length; i++) if (p[i] === p[i - 1] && p[i] === p[i - 2]) { ok = false; break; }
    if (ok) return p;
  }
  throw new Error(`day ${dayNum}: could not find a no-3-run column plan`);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dayInfo(i) {
  const d = new Date(Date.parse(`${firstLive}T00:00:00Z`) + i * 86400000);
  const iso = d.toISOString().slice(0, 10);
  const [y, m, dd] = iso.split('-');
  return {
    live: iso,
    quizId: `${key}-${Number(m)}-${Number(dd)}-${y.slice(2)}`,
    dateLabel: `${MONTHS[Number(m) - 1]} ${Number(dd)}, ${y}`,
  };
}

// Emitted copy is straight ASCII throughout: curly quotes and dashes are folded
// here rather than policed in the source, and the em dash is banned outright by
// the site's writing rules, so it is folded to a comma-free plain hyphen only
// where an author slipped one in. The verifier still fails on an em dash, which
// is the backstop for a source edit that reintroduces one in a place this pass
// cannot fold safely.
const esc = (s) => String(s)
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/–/g, '-')
  .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const qLines = [];
const pEntries = [];

DAYS.forEach((day, di) => {
  const num = di + 1;
  if (day.length !== TOTAL_Q) throw new Error(`day ${num}: ${day.length} questions, need ${TOTAL_Q}`);
  const cols = columnPlan(num);
  const dp = String(num).padStart(2, '0');
  const qids = [];
  day.forEach((entry, si) => {
    const wantTier = Math.floor(si / PER_TIER) + 1;
    const wantLane = LANES[si % PER_TIER];
    if (entry.t !== wantTier) throw new Error(`day ${num} slot ${si + 1}: tier ${entry.t}, ramp wants ${wantTier}`);
    if (entry.c !== wantLane) throw new Error(`day ${num} slot ${si + 1}: lane "${entry.c}", cycle wants "${wantLane}"`);
    if (!Array.isArray(entry.d) || entry.d.length !== 3) throw new Error(`day ${num} slot ${si + 1}: needs exactly 3 distractors`);
    const id = `d${dp}q${String(si + 1).padStart(2, '0')}`;
    qids.push(id);
    const rnd = rng(seedOf(`${key}:choices:${id}`));
    const wrong = shuffled(entry.d, rnd);
    const correct = cols[si];
    const choices = [];
    for (let c = 0, w = 0; c < 4; c++) choices.push(c === correct ? entry.a : wrong[w++]);
    qLines.push(`  { id: '${id}', cat: '${esc(entry.c)}', tier: ${entry.t}, q: '${esc(entry.q)}', choices: [${choices.map((c) => `'${esc(c)}'`).join(', ')}], correct: ${correct}${fromField(entry)} },`);
  });
  const info = dayInfo(di);
  pEntries.push(`  {\n    num: ${num},\n    quizId: '${info.quizId}',\n    live: '${info.live}',\n    dateLabel: '${info.dateLabel}',\n    sunday: false,\n    qids: [${qids.map((i) => `'${i}'`).join(', ')}],\n  },`);
});

const TITLE = key.charAt(0).toUpperCase() + key.slice(1);
const laneList = LANES.join(', ');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'questions.js'), `// Question bank for ${TITLE}, one of the daily gauntlets. Imported ONLY by the
// server page (app/${key}/page.js), which resolves the picked day's twenty-five
// questions and hands the client just that day, so the rest of the bank never
// reaches a browser.
//
//   id       'd<day>q<slot>' - authored day and play order (slot 1..25)
//   cat      one of five lanes; each tier block covers all five, always in the
//            same order: ${laneList}
//   tier     1 (gimme) .. 5 (expert); a day ramps 5 questions per tier
//   choices  exactly four, one defensibly correct; the correct position came
//            from a per-day balanced no-3-run sequence at build time, so do NOT
//            hand-reorder choices here
//
// GENERATED by scripts/gen-mcq.mjs from scripts/${key}-source.mjs. Author the
// question, its true answer and three distractors there and rebuild; never edit
// this file by hand, because the column spread is computed across the whole day
// and a hand edit silently breaks it.
//
// EVERY FACT IS FROZEN. The bank asks only about settled things: nothing whose
// answer moves when somebody is cast, recast, renewed, cancelled, promoted or
// overtaken. A superlative worth asking gets pinned in the stem instead ("the
// highest grossing film of the 1990s", "what was then the longest running").
export const QUESTIONS = [
${qLines.join('\n')}
];

export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
`);

fs.writeFileSync(path.join(outDir, 'puzzles.js'), `// Puzzle data for ${TITLE}, one of the daily gauntlets. Each day is twenty-five
// question ids from questions.js in play order: five tiers of five, gimme to
// expert, each tier cycling the same five lanes. Imported by the server page
// (which resolves and gates by Eastern date), the archive map, and the daily
// APIs. The extra qids field is ignored by the shared daily consumers.
//
// GENERATED by scripts/gen-mcq.mjs. Extend the bank in scripts/${key}-source.mjs.
export const PUZZLES = [
${pEntries.join('\n')}
];
`);

console.log(`gen-mcq ${key}: ${qLines.length} questions, ${pEntries.length} days, ${dayInfo(0).live} to ${dayInfo(DAYS.length - 1).live}`);
