// Structural gate for the Atlas bank. Run after every authoring pass:
//
//   node scripts/verify-atlas.mjs
//
// It checks only what a machine can check. The TRUTH of a fact is still a
// human job, and so is whether a tier-5 question is really hard. What this
// catches is the stuff that silently ships wrong: a question that hands over
// its own answer, a repeated question, a day whose correct answers pile into
// one column, a tier or subject ramp out of order, the same answer twice in
// one run, and (as a warning) the same FACT asked twice on different days,
// which is the failure the first pass at this bank actually had.
//
// Question ids are 'd<day>q<slot>', the day zero padded to two digits and
// widening to three past day 99, the slot always two. Each day's qids must
// carry that day's own number as their prefix.
//
// TWO CHECKS THE STANDARD REQUIRES AND THIS FILE WENT WITHOUT (added with the
// 57-day extension of 2026-09-06). CLAUDE.md, "Daily puzzle authoring standard"
// rules 7 and 8, and "Extending a puzzle bank in bulk" rules 3 and 4:
//
//   US SPELLINGS. Every reader-facing string (the stem and all four choices)
//   is run through the shared screen in scripts/us-spellings.mjs. Real names
//   keep their own spelling, so SPELL_ALLOW below lists the proper nouns that
//   are skipped verbatim (rule 4 of the authoring brief: Pearl Harbor, the
//   Royal Festival Theatre, and here the Sydney Harbour Bridge).
//
//   ANSWER REUSE, COUNTED ACROSS THE WHOLE SEGMENT rather than per day. Per-day
//   legality passes happily on a bank that answers "France" forty times, which
//   is exactly how Rung, Listed, Mate, Four and Crux all degraded. The ceiling
//   is ANSWER_CAP: no answer may be correct more than four times in the copy
//   window. Answers are counted with a leading "the" stripped, so "The
//   Netherlands" and "Netherlands" are one answer.
//
// BOTH ARE SCOPED FROM A DATED COPY FLOOR (rule 10, "the past is frozen").
// ATLAS_COPY_FROM is the first live date the new rules apply to; days before it
// shipped under the old rules and are history, not a backlog. Days 1-41 spell
// "tricolour", "colour", "harbour" and "centre" throughout, and answer Italy
// eight times; retrofitting them would rewrite boards people have played.
import { QUESTIONS, QUESTION_MAP } from '../app/atlas/questions.js';
import { PUZZLES } from '../app/atlas/puzzles.js';
import { scanUS } from './us-spellings.mjs';

// The first live date the US-spelling screen and the answer-reuse ceiling
// apply to. Everything before it is frozen.
const ATLAS_COPY_FROM = '2026-10-05';
// No answer may be correct more than this many times at or after the floor.
const ANSWER_CAP = 4;
// Proper names that keep their own spelling; skipped verbatim by the screen.
const SPELL_ALLOW = ['Sydney Harbour Bridge', 'Sydney Harbour'];
// Three families of British form the authoring standard names by hand (rule 4:
// "...programme, grey, metre, centre, harbour, favourite, kilometre, tricolour")
// that the shared list in us-spellings.mjs does not carry: it has 'metre' and
// 'litre' but matches on word boundaries, so 'kilometre' slips through, and it
// has no 'tricolour' at all, which is the one word a flag lane writes most.
// 'spiralling' stands in for the doubled-l family the shared list samples but
// does not exhaust. Kept local rather than pushed into the shared file, because
// that file is screening several other games against their own dated floors and
// a new entry there can fail copy nobody is looking at.
const ATLAS_BRITISH = [['tricolours', 'tricolors'], ['tricolour', 'tricolor'],
  ['kilometres', 'kilometers'], ['kilometre', 'kilometer'],
  ['spiralling', 'spiraling'], ['spiralled', 'spiraled']]
  .map(([brit, us]) => [new RegExp(`\\b${brit}\\b`, 'i'), us]);

const errs = [];
const warns = [];
const fail = (m) => errs.push(m);
const warn = (m) => warns.push(m);

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
// A handful of capitals are literally named after their own country, so asking
// for one cannot avoid naming it: "which city is the capital of Panama" has to
// say Panama, and the answer is Panama City. That is the place's name, not a
// leaky question, and these are the only ids it applies to. Everything else
// that trips the giveaway check is a real bug.
const INHERENT = new Set(['d10q11', 'd18q11', 'd27q01']);
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'is', 'it', 'its', 'his', 'her', 'their', 'was', 'were', 'by', 'from', 'about', 'as', 'or', 'no', 'not', 'one', 'two', 'three', 'four', 'five', 'six', 'ten']);

// A day is five tiers of five, and every tier block runs the same five
// subjects in this order. Both are the shape of the game, not a convention.
const SUBJECTS = ['Capitals', 'Physical World', 'Flags & Borders', 'Places & Landmarks', 'Countries & Peoples'];
const PER_TIER = SUBJECTS.length;
const TOTAL_Q = 25;
const RAMP = [];
for (let t = 1; t <= 5; t++) for (let s = 0; s < PER_TIER; s++) RAMP.push(t);

// ---- bank-level -----------------------------------------------------------
const ids = new Set();
for (const q of QUESTIONS) {
  if (ids.has(q.id)) fail(`duplicate question id ${q.id}`);
  ids.add(q.id);
  if (!/^d\d{2,3}q\d\d$/.test(q.id)) fail(`${q.id}: id is not d<NN>q<NN> or d<NNN>q<NN>`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${q.id}: needs exactly 4 choices`);
  else if (new Set(q.choices.map(norm)).size !== 4) fail(`${q.id}: choices are not all distinct`);
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) fail(`${q.id}: correct index out of range`);
  if (![1, 2, 3, 4, 5].includes(q.tier)) fail(`${q.id}: tier must be 1..5`);
  if (!SUBJECTS.includes(q.cat)) fail(`${q.id}: cat "${q.cat}" is not one of the five subjects`);
  if (!q.q || !q.q.trim().endsWith('?')) warn(`${q.id}: question does not end in a question mark`);
  for (const s of [q.q, ...q.choices]) if (String(s).includes('—')) fail(`${q.id}: em dash in copy`);

  // The giveaway check: a question may never contain its own answer, whole or
  // in its distinctive words.
  const ans = q.choices[q.correct] || '';
  const qn = ` ${norm(q.q)} `;
  const an = norm(ans);
  if (an && qn.includes(` ${an} `)) fail(`${q.id}: question contains its own answer ("${ans}")`);
  const words = an.split(' ').filter((w) => w.length > 2 && !STOP.has(w));
  if (words.length && !INHERENT.has(q.id) && words.every((w) => qn.includes(` ${w} `))) fail(`${q.id}: question contains every distinctive word of its answer ("${ans}")`);
}

const seenText = new Map();
for (const q of QUESTIONS) {
  const k = norm(q.q);
  if (seenText.has(k)) fail(`${q.id}: repeats the question text of ${seenText.get(k)}`);
  seenText.set(k, q.id);
}

// The same fact asked twice, in two different lanes, on two different days.
// Two questions that share an ANSWER and any distinctive word are the shape of
// it (Angel Falls asked in both Physical World and Places & Landmarks). A
// warning rather than a failure: the same country is a fair answer to several
// genuinely different questions, so a human decides.
// NOTE THE IRONY, AND DO NOT REMOVE THE US FORMS BELOW. This list is the
// scaffolding vocabulary a geography stem is built from, and it was written in
// British spelling: "tricolour", "centre", "neighbour". Copy at or after
// ATLAS_COPY_FROM is required to be US spelled, so a new question writes
// "tricolor", "color" and "neighbors" instead, which are NOT on the list and so
// count as distinctive words. The effect is a pile of "share an answer and the
// word(s) tricolor" warnings on questions that share nothing but the standard
// flag-question skeleton. Both spellings therefore live here. The four generic
// words at the end (other, another, many, much) were doing the same damage.
const TEMPLATE = new Set(('which country countrys city cities river rivers island islands flag flags capital state states sea seas mountain mountains range lies lie stands stand found find would could world worlds largest smallest longest highest tallest deepest only these that this what name named known called from with along across through between above below over under near beside main major large small horizontal vertical bands band tricolour tricolor colour colours color colors field white black green blue yellow orange purple star stars cross canton hoist centre center middle emblem shows show carries carry border borders neighbours neighbour neighbors neighbor land coast coastal southern northern eastern western south north east west europe european continent official currency people nation nations there their they other another many much').split(' '));
const distinct = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3 && !TEMPLATE.has(w)));
const byAnswer = new Map();
for (const q of QUESTIONS) {
  const k = norm(q.choices[q.correct]).replace(/^the /, '');
  if (!byAnswer.has(k)) byAnswer.set(k, []);
  byAnswer.get(k).push(q);
}
for (const [, group] of byAnswer) {
  for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
    const b = distinct(group[j].q);
    const shared = [...distinct(group[i].q)].filter((w) => b.has(w));
    if (shared.length) warn(`${group[i].id} and ${group[j].id} share an answer and the word(s) ${shared.join(', ')} — check they are not the same fact twice`);
  }
}

// ---- day-level ------------------------------------------------------------
const usedQids = new Map();
const liveOf = new Map();   // qid -> the live date of the day that plays it
const dates = [];

for (const p of PUZZLES) {
  const tag = `day ${p.num}`;
  if (dates.includes(p.live)) fail(`${tag}: duplicate live date ${p.live}`);
  dates.push(p.live);
  if (p.quizId !== `atlas-${Number(p.live.slice(5, 7))}-${Number(p.live.slice(8, 10))}-${p.live.slice(2, 4)}`) fail(`${tag}: quizId ${p.quizId} does not match live date ${p.live}`);
  if (p.sunday) fail(`${tag}: Atlas runs no Sunday Edition, so no day may be flagged sunday`);
  if (!Array.isArray(p.qids) || p.qids.length !== TOTAL_Q) { fail(`${tag}: needs exactly ${TOTAL_Q} qids`); continue; }

  const qs = [];
  const wantPrefix = `d${String(p.num).padStart(2, '0')}q`;
  for (const id of p.qids) {
    if (!id.startsWith(wantPrefix)) fail(`${tag}: qid ${id} does not carry this day's prefix ${wantPrefix}`);
    if (usedQids.has(id)) fail(`${tag}: qid ${id} already used on day ${usedQids.get(id)}`);
    usedQids.set(id, p.num);
    liveOf.set(id, p.live);
    const q = QUESTION_MAP[id];
    if (!q) { fail(`${tag}: qid ${id} is not in the bank`); continue; }
    qs.push(q);
  }
  if (qs.length !== TOTAL_Q) continue;

  qs.forEach((q, i) => {
    if (q.tier !== RAMP[i]) fail(`${tag}: slot ${i + 1} is tier ${q.tier}, the ramp wants ${RAMP[i]}`);
    const want = SUBJECTS[i % PER_TIER];
    if (q.cat !== want) fail(`${tag}: slot ${i + 1} is ${q.cat}, the subject cycle wants ${want}`);
  });

  // Correct-answer column spread: 25 questions over 4 columns, so every column
  // carries at least 5 and no column repeats three times running.
  const pos = qs.map((q) => q.correct);
  for (let k = 0; k < 4; k++) {
    const n = pos.filter((x) => x === k).length;
    if (n < 5) fail(`${tag}: column ${String.fromCharCode(65 + k)} is correct only ${n} times`);
  }
  for (let i = 2; i < pos.length; i++) if (pos[i] === pos[i - 1] && pos[i] === pos[i - 2]) fail(`${tag}: three correct answers in a row in column ${String.fromCharCode(65 + pos[i])}`);

  // The same answer twice in one day makes the second one guessable.
  const answers = new Map();
  qs.forEach((q) => {
    const a = norm(q.choices[q.correct]);
    if (answers.has(a)) fail(`${tag}: "${q.choices[q.correct]}" is the answer to both ${answers.get(a)} and ${q.id}`);
    answers.set(a, q.id);
  });
}

// The bank drops one day at a time, so the dates must be contiguous.
for (let i = 1; i < dates.length; i++) {
  const prev = Date.parse(`${dates[i - 1]}T00:00:00Z`);
  const cur = Date.parse(`${dates[i]}T00:00:00Z`);
  if (cur - prev !== 86400000) fail(`day ${PUZZLES[i].num}: ${dates[i]} does not follow ${dates[i - 1]} by one day`);
}

// ---- copy window: US spellings and the answer-reuse ceiling ---------------
// Both are scoped to days live on or after ATLAS_COPY_FROM, so the frozen past
// is not retroactively failed. A question no day plays has no live date and so
// is outside the window; the orphan warning below is what catches those.
const inWindow = QUESTIONS.filter((q) => (liveOf.get(q.id) || '') >= ATLAS_COPY_FROM);

for (const q of inWindow) {
  for (const s of [q.q, ...(q.choices || [])]) {
    for (const hit of scanUS(s, SPELL_ALLOW)) fail(`${q.id}: British spelling "${hit.found}" in copy (US: ${hit.us})`);
    for (const [re, us] of ATLAS_BRITISH) {
      const m = String(s).match(re);
      if (m) fail(`${q.id}: British spelling "${m[0]}" in copy (US: ${us})`);
    }
  }
}

const answerUse = new Map();
for (const q of inWindow) {
  const a = norm(q.choices[q.correct]).replace(/^the /, '');
  if (!a) continue;
  if (!answerUse.has(a)) answerUse.set(a, []);
  answerUse.get(a).push(q.id);
}
for (const [, ids] of answerUse) {
  if (ids.length > ANSWER_CAP) {
    const q = QUESTION_MAP[ids[0]];
    fail(`"${q.choices[q.correct]}" is the correct answer ${ids.length} times since ${ATLAS_COPY_FROM}, over the ceiling of ${ANSWER_CAP} (${ids.join(', ')})`);
  }
}

const orphans = QUESTIONS.filter((q) => !usedQids.has(q.id));
if (orphans.length) warn(`${orphans.length} questions in the bank are not used by any day (${orphans.slice(0, 5).map((q) => q.id).join(', ')}...)`);

// ---- report ---------------------------------------------------------------
for (const w of warns) console.warn(`warn  ${w}`);
if (errs.length) {
  for (const e of errs) console.error(`FAIL  ${e}`);
  console.error(`\n${errs.length} problem${errs.length === 1 ? '' : 's'} in ${QUESTIONS.length} questions across ${PUZZLES.length} days.`);
  process.exit(1);
}
console.log(`ok: ${QUESTIONS.length} questions, ${PUZZLES.length} days, ${dates[0]} to ${dates[dates.length - 1]}, ${warns.length} warning${warns.length === 1 ? '' : 's'}.`);
console.log(`    copy window from ${ATLAS_COPY_FROM}: ${inWindow.length} questions screened for British spellings, ${answerUse.size} distinct answers, none over ${ANSWER_CAP}.`);
