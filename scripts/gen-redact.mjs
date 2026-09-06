// scripts/gen-redact.mjs - appends authored days to the Redact bank
// (app/redact/puzzles.js) from the three per-category lane files in
// scripts/redact-lanes/.
//
//   node scripts/gen-redact.mjs [laneDir] [--through YYYY-MM-DD] [--check]
//
// WHY A GENERATOR AND NOT A HAND ASSEMBLY. Three things about a Redact day are
// mechanical, and they are the three a human gets wrong across a two month
// drop: the identity fields, the WEEKDAY DIFFICULTY RAMP, and the category
// interleave. Lane authors therefore write only { cat, diff, answer, aka, text }
// and never choose a date; this script owns everything else. Re-running it on
// unchanged lanes is byte-identical. Same shape as scripts/gen-atlas.mjs,
// gen-biz.mjs and gen-sport.mjs; the differences are the lane list, the single
// output file, and the fact that placement here is a constraint problem rather
// than a fixed rotation.
//
// THE PAST IS FROZEN (CLAUDE.md authoring standard rule 10). This script does
// not regenerate the bank. It reads puzzles.js as text, keeps every byte up to
// the closing bracket of the exported array, and splices the new days in before
// it, asserting afterwards that the frozen prefix came back unchanged. Day
// numbers and live dates continue from whatever the bank already ends with, so
// the starting point is derived rather than typed. A day already in the bank can
// never be reached by this script, which is the point.
//
// LANE FILES. scripts/redact-lanes/redact-<slug>.mjs, one per category group,
// each exporting ARTICLES: an array of capsule articles shaped
//
//   { cat: 'Person'|'Place'|'Thing'|'Event'|'Work', diff: 2..5,
//     answer: '<display title>', aka: { <alias>: '<title word>' }, text: '...' }
//
// with NO identity fields. The lanes carry no dates and no order that matters;
// the pool is the union of all three files.
//
// THE RAMP IS THE PLACEMENT PROBLEM. app/redact/puzzles.js states it and
// scripts/verify-redact.mjs enforces it: Mon/Tue diff 2, Wed/Thu diff 3,
// Fri/Sat diff 4, Sunday diff 4-5. That makes the calendar, not the author,
// decide which difficulty each day needs, so the pool has to match the run of
// dates it is being placed on. This script COUNTS BOTH SIDES AND ASSERTS THEY
// AGREE before it places anything, and dies with both tallies printed if they
// do not. diff 5 is Sunday only. If the pool carries fewer diff 5 articles than
// there are Sundays, the shortfall is filled from diff 4, which the ramp allows
// (note that a diff 4 article promoted to a Sunday must still clear the Sunday
// word floor of 250, which verify-redact.mjs checks).
//
// INTERLEAVE. The `cat` chip is shown to the player from the first second, so a
// week of seven Persons is both a duller bank and, if the rotation is
// predictable, a hint. Within each difficulty band the articles are shuffled
// deterministically and then laid onto that band's days in date order, and the
// whole sequence is rejected and reshuffled until NO cat and NO source lane
// appears on more than two consecutive days. THE SEED IS OFFSET BY THE FIRST
// NEW DAY NUMBER, so an appended segment cannot replay the order of the frozen
// segment it follows.
//
// IDENTITY FIELDS come from the live date and nothing else (CLAUDE-QUIZZES
// section 7e): num is the previous num + 1, quizId is 'redact-M-D-YY' with no
// leading zeros, dateLabel is 'Month D, YYYY', and `sunday` is true exactly when
// the live date is a Sunday. Redact IS in lib/sunday-editions.js, so the flag is
// real and carries the longer word allowance.
//
// --check RE-DERIVES the segment the bank already ends with and compares it to
// the file without writing anything, so CI can ask whether the shipped bank is
// still what these lanes say. It rewinds by the lane pool size rather than
// appending, which is the only difference between the two modes.
//
// AFTER RUNNING: node scripts/verify-redact.mjs (and bump its hardcoded bank
// size in the same commit, per CLAUDE-QUIZZES section 7e).
import fs from 'fs';
import path from 'path';
import url from 'url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const P_FILE = path.join(ROOT, 'app/redact/puzzles.js');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const thruIdx = argv.indexOf('--through');
const THROUGH = thruIdx >= 0 ? argv[thruIdx + 1] : null;
const laneArg = argv.find((a) => !a.startsWith('--') && a !== THROUGH);
const LANE_DIR = path.resolve(laneArg || path.join(HERE, 'redact-lanes'));

const LANE_FILES = ['redact-person.mjs', 'redact-place-event.mjs', 'redact-thing-work.mjs'];
const CATS = new Set(['Person', 'Place', 'Thing', 'Event', 'Work']);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Which difficulty band each weekday demands. Same table as the RAMP in
// scripts/verify-redact.mjs, expressed as the band a day belongs to.
const BAND_OF_DOW = ['sun', 'b2', 'b2', 'b3', 'b3', 'b4', 'b4'];
// Longest run of the same cat, or of the same source lane, the interleave will
// accept anywhere in the new segment.
const MAX_RUN = 2;

const die = (m) => { console.error(`gen-redact: ${m}`); process.exit(1); };

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

// ---- emitted copy is straight ASCII ---------------------------------------
// Curly quotes and en dashes are folded here rather than policed in the lanes.
// The em dash is banned outright by the site's writing rules and the verifier
// fails on one, so it is left alone: a lane that contains one should fail, not
// be quietly repaired.
const esc = (s) => String(s)
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/–/g, '-')
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/\n/g, '\\n');

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

// ---- read the bank we are extending ---------------------------------------
const pText = fs.readFileSync(P_FILE, 'utf8');
const { PUZZLES } = await import(url.pathToFileURL(P_FILE).href);
if (!PUZZLES.length) die('the bank is empty; this script appends, it does not create');

// ---- read the lanes -------------------------------------------------------
const pool = [];
for (const f of LANE_FILES) {
  const full = path.join(LANE_DIR, f);
  if (!fs.existsSync(full)) die(`lane file not found: ${full}`);
  const { ARTICLES } = await import(url.pathToFileURL(full).href);
  if (!Array.isArray(ARTICLES) || !ARTICLES.length) die(`${f}: no ARTICLES array`);
  ARTICLES.forEach((a, i) => {
    const where = `${f}[${i}] ${a.answer || '(no answer)'}`;
    if (!CATS.has(a.cat)) die(`${where}: bad cat ${a.cat}`);
    if (!(a.diff >= 2 && a.diff <= 5)) die(`${where}: diff ${a.diff} outside 2-5 (diff 1 is retired)`);
    if (typeof a.answer !== 'string' || !a.answer.trim()) die(`${where}: no answer`);
    if (typeof a.text !== 'string' || !a.text.trim()) die(`${where}: no text`);
    if (a.num !== undefined || a.live !== undefined || a.quizId !== undefined || a.sunday !== undefined) {
      die(`${where}: carries an identity field; lanes never set num/quizId/live/dateLabel/sunday`);
    }
    pool.push({ ...a, lane: f, laneIdx: i });
  });
}
const nDays = pool.length;

const dup = pool.map((a) => a.answer.toLowerCase()).filter((v, i, arr) => arr.indexOf(v) !== i);
if (dup.length) die(`the lanes repeat a subject: ${[...new Set(dup)].join(', ')}`);

// ---- where the new segment starts -----------------------------------------
// A real run appends after the last day in the bank; --check rewinds nDays and
// rebuilds the segment already there.
if (CHECK && PUZZLES.length < nDays) die(`--check needs a bank of at least ${nDays} days to rewind into; it has ${PUZZLES.length}`);
const anchor = PUZZLES[PUZZLES.length - 1 - (CHECK ? nDays : 0)];
const startDay = anchor.num + 1;
const startMs = Date.parse(`${anchor.live}T00:00:00Z`) + 86400000;

// ---- the calendar decides which difficulty every day needs ----------------
const days = [];
for (let i = 0; i < nDays; i++) {
  const ms = startMs + i * 86400000;
  const dow = new Date(ms).getUTCDay();
  days.push({ num: startDay + i, ms, live: iso(ms), dow, band: BAND_OF_DOW[dow], sunday: dow === 0 });
}

// ASSERT THE POOL AGAINST THE CALENDAR. This is the whole placement problem, so
// it is checked rather than assumed, and both tallies are printed on failure.
const demand = { b2: 0, b3: 0, b4: 0, sun: 0 };
for (const d of days) demand[d.band]++;
const supply = { 2: 0, 3: 0, 4: 0, 5: 0 };
for (const a of pool) supply[a.diff]++;
const tally = () =>
  `\n  calendar ${days[0].live}..${days[nDays - 1].live} (${nDays} days) needs` +
  ` Mon/Tue(diff 2) ${demand.b2}, Wed/Thu(diff 3) ${demand.b3}, Fri/Sat(diff 4) ${demand.b4}, Sun(diff 4-5) ${demand.sun}` +
  `\n  lanes supply ${nDays} articles: diff 2 ${supply[2]}, diff 3 ${supply[3]}, diff 4 ${supply[4]}, diff 5 ${supply[5]}`;
if (supply[2] !== demand.b2) die(`the pool has ${supply[2]} diff 2 articles but the run has ${demand.b2} Mon/Tue slots.${tally()}`);
if (supply[3] !== demand.b3) die(`the pool has ${supply[3]} diff 3 articles but the run has ${demand.b3} Wed/Thu slots.${tally()}`);
if (supply[5] > demand.sun) die(`the pool has ${supply[5]} diff 5 articles but only ${demand.sun} Sundays, and diff 5 is Sunday only.${tally()}`);
if (supply[4] !== demand.b4 + (demand.sun - supply[5])) {
  die(`the pool has ${supply[4]} diff 4 articles but the run needs ${demand.b4 + (demand.sun - supply[5])} of them (${demand.b4} Fri/Sat plus ${demand.sun - supply[5]} Sunday slots the diff 5 pool does not fill).${tally()}`);
}

// Which articles are eligible for each band. Sundays take every diff 5 first,
// then as many diff 4 as the shortfall requires; Fri/Sat take what is left.
const byDiff = { 2: [], 3: [], 4: [], 5: [] };
for (const a of pool) byDiff[a.diff].push(a);
// Order inside byDiff is lane-file order, which is stable input; the shuffle
// below is what actually decides placement.
const sundayFill = demand.sun - supply[5];
const bandPool = {
  b2: byDiff[2],
  b3: byDiff[3],
  b4: byDiff[4].slice(sundayFill),
  sun: byDiff[5].concat(byDiff[4].slice(0, sundayFill)),
};
for (const k of ['b2', 'b3', 'b4', 'sun']) {
  if (bandPool[k].length !== demand[k]) die(`internal: band ${k} got ${bandPool[k].length} articles for ${demand[k]} slots.${tally()}`);
}

// ---- interleave: shuffle inside each band, reject cat/lane runs ------------
const slotsOf = (band) => days.map((d, i) => (d.band === band ? i : -1)).filter((i) => i >= 0);
const SLOTS = { b2: slotsOf('b2'), b3: slotsOf('b3'), b4: slotsOf('b4'), sun: slotsOf('sun') };

function layout(attempt) {
  const out = new Array(nDays);
  for (const band of ['b2', 'b3', 'b4', 'sun']) {
    const rnd = rng(seedOf(`redact:place:${startDay}:${band}:${attempt}`));
    const order = shuffled(bandPool[band], rnd);
    SLOTS[band].forEach((slot, i) => { out[slot] = order[i]; });
  }
  return out;
}
function runsOk(seq) {
  for (let i = MAX_RUN; i < seq.length; i++) {
    let sameCat = true, sameLane = true;
    for (let k = 1; k <= MAX_RUN; k++) {
      if (seq[i].cat !== seq[i - k].cat) sameCat = false;
      if (seq[i].lane !== seq[i - k].lane) sameLane = false;
    }
    if (sameCat || sameLane) return false;
  }
  return true;
}
let placed = null;
const MAX_ATTEMPTS = 20000;
for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
  const seq = layout(attempt);
  if (runsOk(seq)) { placed = seq; break; }
}
if (!placed) die(`no arrangement found in ${MAX_ATTEMPTS} shuffles that keeps every cat and every lane to at most ${MAX_RUN} days in a row; the pool is too concentrated in one category for this calendar`);

// Belt and braces: the ramp is re-derived from the placement, not trusted.
for (let i = 0; i < nDays; i++) {
  const d = days[i], a = placed[i];
  const want = { b2: [2, 2], b3: [3, 3], b4: [4, 4], sun: [4, 5] }[d.band];
  if (a.diff < want[0] || a.diff > want[1]) die(`internal: ${d.live} is a ${DOW[d.dow]} and needs diff ${want[0] === want[1] ? want[0] : want.join('-')}, got ${a.diff} (${a.answer})`);
}

// ---- emit -----------------------------------------------------------------
const entries = [];
for (let i = 0; i < nDays; i++) {
  const d = days[i], a = placed[i];
  const dt = new Date(d.ms);
  const y = dt.getUTCFullYear(), mo = dt.getUTCMonth() + 1, dd = dt.getUTCDate();
  const akaBody = Object.entries(a.aka || {}).map(([k, v]) => `${k}: '${esc(v)}'`).join(', ');
  entries.push([
    '  {',
    `    num: ${d.num}, quizId: 'redact-${mo}-${dd}-${String(y).slice(2)}', live: '${d.live}', dateLabel: '${MONTHS[mo - 1]} ${dd}, ${y}', sunday: ${d.sunday},`,
    `    cat: '${esc(a.cat)}', diff: ${a.diff}, answer: '${esc(a.answer)}', aka: ${akaBody ? `{ ${akaBody} }` : '{}'},`,
    `    text: '${esc(a.text)}',`,
    '  },',
  ].join('\n'));
}

if (THROUGH && days[nDays - 1].live !== THROUGH) {
  die(`the lanes carry ${nDays} articles, which runs ${days[0].live} to ${days[nDays - 1].live}, not through ${THROUGH}`);
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
const p = splice(pText, 'puzzles.js', `\n  {\n    num: ${startDay}, `);
const pOut = `${p.head}${entries.join('\n')}\n${p.tail}`;

// Prove the freeze rather than trusting it: everything before the insertion
// point must come back exactly as it went in.
if (!pOut.startsWith(p.head)) die('puzzles.js: the frozen prefix changed');

if (CHECK) {
  if (pText === pOut) { console.log(`gen-redact --check: days ${startDay}..${startDay + nDays - 1} in the bank are byte-identical to what the lanes produce`); process.exit(0); }
  console.error('gen-redact --check: the bank DIFFERS from what the lanes produce');
  process.exit(1);
}

fs.writeFileSync(P_FILE, pOut);
console.log(`gen-redact: +${nDays} boards (${startDay}..${startDay + nDays - 1}), ${days[0].live} to ${days[nDays - 1].live}`);
console.log(`            bank is now ${PUZZLES.length + nDays} boards`);
for (let i = 0; i < nDays; i++) {
  const d = days[i], a = placed[i];
  console.log(`            #${d.num} ${d.live} ${DOW[d.dow]}${d.sunday ? ' SUN' : '    '} d${a.diff} ${a.cat.padEnd(6)} ${a.answer}`);
}
