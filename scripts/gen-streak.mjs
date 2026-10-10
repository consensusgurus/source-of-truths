// scripts/gen-streak.mjs — extends the Streak bank (the 40-question daily
// trivia gauntlet) from the authored source in scripts/streak-source.mjs into
// the two files the game ships: app/streak/questions.js and
// app/streak/puzzles.js.
//
//   node scripts/gen-streak.mjs            # rewrite the future segment
//   node scripts/gen-streak.mjs --check    # build, diff, write nothing
//
// WHY A GENERATOR AND NOT HAND-WRITTEN DATA. Streak is 40 questions a day: five
// tiers of eight, each tier cycling the same eight lanes in the same order. At
// that volume the three things a human reliably gets wrong are the ids, the
// per-day correct-answer column spread and the choice order — so the author
// writes only the question, its true answer and three distractors, always in
// that order, and this script owns everything else. The correct answer is NEVER
// authored into a position: every day gets a balanced no-3-run column sequence
// derived from its own day number, so the bank cannot drift into a column bias
// and nobody is ever tempted to "fix" a choices array by hand. Re-running on an
// unchanged source is byte-identical.
//
// THE PAST IS FROZEN. Days 1..61 (2026-07-31 .. 2026-09-29) were authored by
// hand before this script existed and are never touched. The script rebuilds
// ONLY ids whose day number is >= FIRST_DAY and puzzle entries whose num is
// >= FIRST_DAY, splices them in place of whatever future segment is currently
// there, and then asserts byte-for-byte that the frozen prefix of both files
// came through unchanged. That assertion is not decoration: it is the check
// that a bad regex in this file cannot silently eat a live board.
//
// WHAT IT GUARANTEES (everything here is re-proved by scripts/verify-streak.mjs
// afterwards, which is the real gate; this list is what the generator makes
// true by construction rather than by luck):
//   * ids are d<NN>q<NN>, widening to d<NNN>q<NN> past day 99, slot always two
//     digits, and each day's qids all carry that day's own prefix
//   * the tier ramp is 8 questions per tier, 1..5, and the lane cycle is the
//     fixed eight in LANES order in every tier block
//   * every day's correct answers are exactly 10/10/10/10 across A-D with no
//     column three times running (the shipped bank's own shape; the legacy
//     verifier only asked for 5 of 40 per column, and a floor is not a target)
//   * no answer text repeats inside a day
//   * dates run one per day with no gap, with quizId and dateLabel derived from
//     the live date rather than typed
//   * copy is ASCII: curly quotes and en dashes are folded here, and the em
//     dash (banned outright by the site's writing rules) is folded to a comma
//     so a slipped one cannot ship
//
// NO SUNDAY EDITION. Streak's ramp is the tier ramp INSIDE a day, not a weekly
// one: every day is the same forty questions in the same five tiers, and the
// whole gauntlet family (atlas, sport, biz, quotes, script) ships `sunday:
// false` on every board for exactly that reason. So this script writes the flag
// false unconditionally, and verify-streak.mjs fails any future day that sets
// it. The field is vestigial, kept only because the shared daily consumers read
// the shape; do not start flagging Sundays here without also making a Sunday
// board actually bigger, which would mean a different day length.
//
// POOL VARIETY CEILING. Counted across the WHOLE new window, not per day: no
// single correct answer may be the answer more than ANSWER_CAP (4) times in
// days 62.. . A per-day duplicate check passes happily on a bank that answers
// "China" every other week — the shipped days 1..61 do exactly that, with
// "four" as the answer 16 times. verify-streak.mjs enforces the cap for real;
// this script only warns, because the author fixes it in the source.
//
// SEEDING. mulberry32 over an FNV-1a hash of a seed string that carries both
// the segment's first day and the day number, so the new segment cannot replay
// a column plan or a distractor order from the frozen one even by accident.
//
// LEARNED THE HARD WAY, so the next person does not rediscover it:
//   * app/streak/questions.js emits single-quoted JS strings, so the SOURCE
//     uses double-quoted strings and writes inner quotation with apostrophes.
//     Do not put a double quote in source copy; esc() would have to escape it
//     and the shipped file has none anywhere.
//   * The lane list is authored order, not alphabetical. Slot i in a day is
//     LANES[i % 8]; get that wrong and the verifier's tier-block coverage check
//     still passes while every question is in the wrong column of the ramp.
//   * Day 100 is the first three-digit id. Nothing in the shipped consumers
//     parses an id, but the shared checker's prefix rule does, so the padding
//     rule (pad to 2, widen naturally past 99) is load-bearing.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// RECYCLED QUESTIONS (owner, 2026-10-09): an entry carrying `from: '<game>:<id>'`
// repeats a question nobody has ever answered. The rules and the proof live in
// scripts/trivia-recycle.mjs; this only carries the field through to the
// shipped file, where the verifier checks it against the play snapshots.
const fromField = (entry) => {
  if (entry.from == null) return '';
  if (!/^(streak|deep|atlas|sport|biz|quotes|script):d\d{2,3}q\d\d$/.test(String(entry.from))) throw new Error(`bad from "${entry.from}" on "${entry.q}"`);
  return `, from: '${entry.from}'`;
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const QFILE = path.join(ROOT, 'app/streak/questions.js');
const PFILE = path.join(ROOT, 'app/streak/puzzles.js');

const CHECK_ONLY = process.argv.includes('--check');

const { DAYS, LANES, FIRST_DAY, FIRST_LIVE } = await import(path.join(HERE, 'streak-source.mjs'));

const PER_TIER = LANES.length;          // 8
const TOTAL_Q = PER_TIER * 5;           // 40
const ANSWER_CAP = 4;                   // pool-variety ceiling over the new window

// ---- deterministic RNG -----------------------------------------------------
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

// The day's correct-answer columns: 40 slots over 4 columns, exactly 10 each,
// and never the same column three times running. Rejection-sampled from the
// day's own seed; lands inside a handful of tries.
function columnPlan(dayNum) {
  const rnd = rng(seedOf(`streak:cols:${FIRST_DAY}:${dayNum}`));
  const bag = [];
  for (let c = 0; c < 4; c++) for (let i = 0; i < TOTAL_Q / 4; i++) bag.push(c);
  for (let attempt = 0; attempt < 20000; attempt++) {
    const p = shuffled(bag, rnd);
    let ok = true;
    for (let i = 2; i < p.length; i++) if (p[i] === p[i - 1] && p[i] === p[i - 2]) { ok = false; break; }
    if (ok) return p;
  }
  throw new Error(`day ${dayNum}: could not find a no-3-run column plan`);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dayInfo(i) {
  const d = new Date(Date.parse(`${FIRST_LIVE}T00:00:00Z`) + i * 86400000);
  const iso = d.toISOString().slice(0, 10);
  const [y, m, dd] = iso.split('-');
  return {
    live: iso,
    quizId: `streak-${Number(m)}-${Number(dd)}-${y.slice(2)}`,
    dateLabel: `${MONTHS[Number(m) - 1]} ${Number(dd)}, ${y}`,
  };
}

// Emitted copy is straight ASCII. Curly punctuation is folded rather than
// policed in the source; the em dash is banned by the site's writing rules and
// is folded to a comma so a slipped one cannot reach a reader.
const esc = (s) => String(s)
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/—/g, ',')
  .replace(/–/g, '-')
  .replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const idFor = (dayNum, slot) => `d${String(dayNum).padStart(2, '0')}q${String(slot).padStart(2, '0')}`;

// ---- build the future segment ---------------------------------------------
const qLines = [];
const pEntries = [];
const answerUse = new Map();
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^the /, '');

DAYS.forEach((day, di) => {
  const num = FIRST_DAY + di;
  if (day.length !== TOTAL_Q) throw new Error(`day ${num}: ${day.length} questions, need ${TOTAL_Q}`);
  const cols = columnPlan(num);
  const qids = [];
  const dayAnswers = new Set();
  day.forEach((entry, si) => {
    const wantTier = Math.floor(si / PER_TIER) + 1;
    const wantLane = LANES[si % PER_TIER];
    if (entry.t !== wantTier) throw new Error(`day ${num} slot ${si + 1}: tier ${entry.t}, the ramp wants ${wantTier}`);
    if (entry.c !== wantLane) throw new Error(`day ${num} slot ${si + 1}: lane "${entry.c}", the cycle wants "${wantLane}"`);
    if (!Array.isArray(entry.d) || entry.d.length !== 3) throw new Error(`day ${num} slot ${si + 1}: needs exactly 3 distractors`);
    const na = norm(entry.a);
    if (dayAnswers.has(na)) throw new Error(`day ${num} slot ${si + 1}: "${entry.a}" is already an answer on this day`);
    dayAnswers.add(na);
    answerUse.set(na, (answerUse.get(na) || 0) + 1);
    const id = idFor(num, si + 1);
    qids.push(id);
    const rnd = rng(seedOf(`streak:choices:${FIRST_DAY}:${id}`));
    const wrong = shuffled(entry.d, rnd);
    const correct = cols[si];
    const choices = [];
    for (let c = 0, w = 0; c < 4; c++) choices.push(c === correct ? entry.a : wrong[w++]);
    qLines.push(`  { id: '${id}', cat: '${esc(entry.c)}', tier: ${entry.t}, q: '${esc(entry.q)}', choices: [${choices.map((c) => `'${esc(c)}'`).join(', ')}], correct: ${correct}${fromField(entry)} },`);
  });
  const info = dayInfo(di);
  pEntries.push(`  {\n    num: ${num},\n    quizId: '${info.quizId}',\n    live: '${info.live}',\n    dateLabel: '${info.dateLabel}',\n    sunday: false,\n    qids: [${qids.map((i) => `'${i}'`).join(', ')}],\n  },`);
});

for (const [a, n] of answerUse) {
  if (n > ANSWER_CAP) console.warn(`warn  "${a}" answers ${n} questions in the new window, over the ${ANSWER_CAP}-use ceiling`);
}

// ---- splice, keeping the frozen prefix byte-identical -----------------------
// A line belongs to the future segment iff its day number is >= FIRST_DAY. The
// id is the only thing consulted, so a hand edit anywhere in the frozen region
// survives untouched and the after-the-fact hash check proves it.
const dayOfId = (line) => { const m = /^\s*\{ id: 'd(\d+)q\d\d'/.exec(line); return m ? Number(m[1]) : null; };
const dayOfEntry = (block) => { const m = /num: (\d+),/.exec(block); return m ? Number(m[1]) : null; };

function spliceQuestions(src) {
  const open = src.indexOf('export const QUESTIONS = [\n');
  if (open < 0) throw new Error('questions.js: cannot find the QUESTIONS array');
  const bodyStart = open + 'export const QUESTIONS = [\n'.length;
  const bodyEnd = src.indexOf('\n];\n', bodyStart);
  if (bodyEnd < 0) throw new Error('questions.js: cannot find the end of the QUESTIONS array');
  const kept = src.slice(bodyStart, bodyEnd).split('\n').filter((l) => {
    const d = dayOfId(l);
    if (d === null) throw new Error(`questions.js: unrecognised line in the bank: ${l.slice(0, 60)}`);
    return d < FIRST_DAY;
  });
  return { out: src.slice(0, bodyStart) + [...kept, ...qLines].join('\n') + src.slice(bodyEnd), frozen: kept };
}

function splicePuzzles(src) {
  const open = src.indexOf('export const PUZZLES = [\n');
  if (open < 0) throw new Error('puzzles.js: cannot find the PUZZLES array');
  const bodyStart = open + 'export const PUZZLES = [\n'.length;
  const bodyEnd = src.indexOf('\n];\n', bodyStart);
  if (bodyEnd < 0) throw new Error('puzzles.js: cannot find the end of the PUZZLES array');
  const blocks = src.slice(bodyStart, bodyEnd).split(/(?<=\n  \},)\n/);
  const kept = blocks.filter((b) => {
    const d = dayOfEntry(b);
    if (d === null) throw new Error(`puzzles.js: unrecognised entry: ${b.slice(0, 60)}`);
    return d < FIRST_DAY;
  });
  return { out: src.slice(0, bodyStart) + [...kept, ...pEntries].join('\n') + src.slice(bodyEnd), frozen: kept };
}

const qSrc = fs.readFileSync(QFILE, 'utf8');
const pSrc = fs.readFileSync(PFILE, 'utf8');
const q = spliceQuestions(qSrc);
const p = splicePuzzles(pSrc);

// The frozen-prefix proof: every byte of both files up to the first future
// entry must be identical to what was on disk before this run.
const prefixOf = (src, marker) => {
  const i = src.indexOf(marker);
  return i < 0 ? null : src.slice(0, i);
};
const firstFutureQ = `  { id: '${idFor(FIRST_DAY, 1)}',`;
const firstFutureP = `    num: ${FIRST_DAY},\n`;
for (const [label, before, after, marker] of [
  ['questions.js', qSrc, q.out, firstFutureQ],
  ['puzzles.js', pSrc, p.out, firstFutureP],
]) {
  const a = prefixOf(before, marker);
  const b = prefixOf(after, marker);
  if (a !== null && a !== b) throw new Error(`${label}: the frozen prefix changed, refusing to write`);
}

if (CHECK_ONLY) {
  console.log(`gen-streak --check: ${qSrc === q.out && pSrc === p.out ? 'files already match the source' : 'files DIFFER from the source'}`);
} else {
  fs.writeFileSync(QFILE, q.out);
  fs.writeFileSync(PFILE, p.out);
}

const last = dayInfo(DAYS.length - 1);
console.log(`gen-streak: ${q.frozen.length} frozen questions kept, ${qLines.length} new questions across ${pEntries.length} days, ${dayInfo(0).live} to ${last.live}`);
