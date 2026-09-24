// Structural gate for the Deep bank. Run after every authoring pass:
//
//   node scripts/verify-deep.mjs
//
// It checks only what a machine can check. The TRUTH of a fact is still a
// human job, and so is whether a tier-5 question is really hard. What this
// catches is the stuff that silently ships wrong: a question that hands over
// its own answer, a repeated question, a day whose correct answers pile into
// one column, a tier ramp out of order, a duplicated topic.
//
// Question ids are 'd<day>q<slot>', the day zero padded to two digits and
// widening to three past day 99, the slot always two. The day field was fixed
// at exactly two digits until 2026-08-21, which capped the bank at day 99;
// widening it here was the deliberate fix. No existing id changed. Each day's
// qids must also carry that day's own number as their prefix.
import { QUESTIONS, QUESTION_MAP } from '../app/deep/questions.js';
import { PUZZLES } from '../app/deep/puzzles.js';
import { isSportsRules, SPORT_TOPIC } from './sports-rules-classifier.mjs';

// AT MOST ONE SPORTS RULES-TYPE QUESTION ON A SPORTS DAY (owner ruling,
// 2026-09-23). A day whose topic is a sport (SPORT_TOPIC: Basketball, Golf,
// Tennis, Formula One, The Olympics, The World Cup...) had spent up to seven of
// its fifteen questions on how the sport works: points for a score, how many
// players or periods, what a score or violation is called, which club lifts a
// ball out of a bunker. The classifier, and what it does and does not count as
// rules-type, is documented in scripts/sports-rules-classifier.mjs; a rule's
// HISTORY (who wrote the first rules, when a device was introduced) is not
// rules-type. Scoped to days live on or after SPORTS_RULES_FROM, because days
// already played are frozen.
const SPORTS_RULES_FROM = '2026-09-24';
const SPORTS_RULES_CAP = 1;

const errs = [];
const warns = [];
const fail = (m) => errs.push(m);
const warn = (m) => warns.push(m);

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'is', 'it', 'its', 'his', 'her', 'their', 'was', 'were', 'by', 'from', 'about', 'as', 'or', 'no', 'not', 'one', 'two', 'three', 'four', 'five', 'six', 'ten']);

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
  if (!q.q || !q.q.trim().endsWith('?')) warn(`${q.id}: question does not end in a question mark`);
  for (const s of [q.q, ...q.choices]) if (String(s).includes('—')) fail(`${q.id}: em dash in copy`);

  // The giveaway check: a question may never contain its own answer, whole or
  // in its distinctive words. This is what caught real giveaways in Streak.
  const ans = q.choices[q.correct] || '';
  const qn = ` ${norm(q.q)} `;
  const an = norm(ans);
  if (an && qn.includes(` ${an} `)) fail(`${q.id}: question contains its own answer ("${ans}")`);
  const words = an.split(' ').filter((w) => w.length > 3 && !STOP.has(w));
  if (words.length && words.every((w) => qn.includes(` ${w} `))) fail(`${q.id}: question contains every distinctive word of its answer ("${ans}")`);
}

const seenText = new Map();
for (const q of QUESTIONS) {
  const k = norm(q.q);
  if (seenText.has(k)) fail(`${q.id}: repeats the question text of ${seenText.get(k)}`);
  seenText.set(k, q.id);
}

// ---- day-level ------------------------------------------------------------
const RAMP = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
const usedQids = new Map();
const topics = new Map();
const dates = new Set();

for (const p of PUZZLES) {
  const tag = `day ${p.num} (${p.topic})`;
  if (!p.topic) fail(`${tag}: no topic`);
  const tk = norm(p.topic);
  if (topics.has(tk)) fail(`${tag}: topic repeats day ${topics.get(tk)}`);
  topics.set(tk, p.num);
  if (dates.has(p.live)) fail(`${tag}: duplicate live date ${p.live}`);
  dates.add(p.live);
  if (p.quizId !== `deep-${Number(p.live.slice(5, 7))}-${Number(p.live.slice(8, 10))}-${p.live.slice(2, 4)}`) fail(`${tag}: quizId ${p.quizId} does not match live date ${p.live}`);
  if (!Array.isArray(p.qids) || p.qids.length !== 15) { fail(`${tag}: needs exactly 15 qids`); continue; }

  const qs = [];
  const wantPrefix = `d${String(p.num).padStart(2, '0')}q`;
  for (const id of p.qids) {
    if (!id.startsWith(wantPrefix)) fail(`${tag}: qid ${id} does not carry this day's prefix ${wantPrefix}`);
    if (usedQids.has(id)) fail(`${tag}: qid ${id} already used on day ${usedQids.get(id)}`);
    usedQids.set(id, p.num);
    const q = QUESTION_MAP[id];
    if (!q) { fail(`${tag}: qid ${id} is not in the bank`); continue; }
    qs.push(q);
  }
  if (qs.length !== 15) continue;

  qs.forEach((q, i) => { if (q.tier !== RAMP[i]) fail(`${tag}: slot ${i + 1} is tier ${q.tier}, the ramp wants ${RAMP[i]}`); });

  // Correct-answer column spread: 15 questions over 4 columns, so every column
  // carries at least 3 and no column repeats three times running.
  const pos = qs.map((q) => q.correct);
  for (let k = 0; k < 4; k++) {
    const n = pos.filter((x) => x === k).length;
    if (n < 3) fail(`${tag}: column ${String.fromCharCode(65 + k)} is correct only ${n} times`);
  }
  for (let i = 2; i < pos.length; i++) if (pos[i] === pos[i - 1] && pos[i] === pos[i - 2]) fail(`${tag}: three correct answers in a row in column ${String.fromCharCode(65 + pos[i])}`);

  // Sports rules-type cap on a sports-topic day.
  if (String(p.live) >= SPORTS_RULES_FROM && SPORT_TOPIC.test(p.topic || '')) {
    const hits = qs.filter((q) => isSportsRules(q.q));
    if (hits.length > SPORTS_RULES_CAP) fail(`${tag}: ${hits.length} sports rules-type questions (${hits.map((q) => q.id).join(', ')}), the cap on a sports day is ${SPORTS_RULES_CAP}; rewrite the rest about the sport's history, people, teams, records or events`);
  }

  // The same answer twice in one day makes the second one guessable.
  const answers = new Map();
  qs.forEach((q) => {
    const a = norm(q.choices[q.correct]);
    if (answers.has(a)) fail(`${tag}: "${q.choices[q.correct]}" is the answer to both ${answers.get(a)} and ${q.id}`);
    answers.set(a, q.id);
  });
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
console.log(`ok: ${QUESTIONS.length} questions, ${PUZZLES.length} days, ${topics.size} distinct topics, ${warns.length} warning${warns.length === 1 ? '' : 's'}.`);
