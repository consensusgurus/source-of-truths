// scripts/english-check-lib.mjs - the structural gate shared by the five English
// Gauntlet banks (verify-gram, verify-vocab, verify-spell, verify-origin,
// verify-idiom). Cloned from scripts/verify-sci.mjs (2026-10-19) and shares no
// code with scripts/gen-english.mjs: it re-reads the shipped files and checks
// ids, four distinct choices, no stem carrying its own answer, the tier ramp
// (five tiers of two), the lane cycle, contiguous dates and quizIds, no Sunday
// flag, the column spread (every column at least twice, no three in a row), no
// answer twice in a day, US spellings, and an answer-reuse ceiling of four.
// Named *-lib so verify-all does not mistake it for a game's checker.
import url from 'url';
import path from 'path';
import { scanUS } from './us-spellings.mjs';
import { ENGLISH_GAMES, FIRST_LIVE } from './english-games.mjs';

export async function verifyEnglish(GAME) {
const CFG = ENGLISH_GAMES[GAME];
if (!CFG) throw new Error(`unknown English Gauntlet game ${GAME}`);
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const { QUESTIONS, QUESTION_MAP } = await import(url.pathToFileURL(path.join(ROOT, `app/${GAME}/questions.js`)).href);
const { PUZZLES } = await import(url.pathToFileURL(path.join(ROOT, `app/${GAME}/puzzles.js`)).href);

// The first live date the US-spelling screen and the answer-reuse ceiling
// apply to: day 1, the launch.
const SCI_COPY_FROM = FIRST_LIVE;
// No answer may be correct more than this many times at or after the floor.
const ANSWER_CAP = 4;
// Proper names that keep their own spelling; skipped verbatim by the screen
// before either word list runs over the string.
const SPELL_ALLOW = [
  'The International Labour Organization', 'International Labour Organization',
  'Australian Labor Party', "Lloyd's", 'Labour Party',
];
// Families of British form the authoring brief names by hand (rule 4:
// "...programme, grey, metre, centre, harbour, favourite, kilometre,
// tricolour") that the shared list in us-spellings.mjs does not carry: it has
// 'metre' and 'litre' but matches on word boundaries, so 'kilometre' slips
// through, and it has no 'tricolour' at all. The doubled-l family is sampled
// there rather than exhausted, so the common forms ('modelled', 'signalled',
// 'labelling', 'fuelling') are listed here too. Kept local rather than pushed into the shared file,
// because that file screens several other games against their own dated floors
// and a new entry there can fail copy nobody is looking at.
const LOCAL_BRITISH = [
  ['tricolours', 'tricolors'], ['tricolour', 'tricolor'],
  ['kilometres', 'kilometers'], ['kilometre', 'kilometer'],
  ['modelled', 'modeled'], ['unravelled', 'unraveled'], ['marshalled', 'marshaled'],
  ['counselling', 'counseling'], ['signalling', 'signaling'], ['spiralling', 'spiraling'],
  ['cancelling', 'canceling'], ['labelling', 'labeling'], ['fuelling', 'fueling'],
].map(([brit, us]) => [new RegExp(`\\b${brit}\\b`, 'i'), us]);

const errs = [];
const warns = [];
const fail = (m) => errs.push(m);
const warn = (m) => warns.push(m);

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
// Ids where the answer is unavoidably in the wording. Empty on this bank:
// every giveaway the check found here was a real bug and was rewritten. Add an
// id only when the thing asked about is literally named after the answer,
// never to silence a leak.
const INHERENT = new Set([]);
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'is', 'it', 'its', 'his', 'her', 'their', 'was', 'were', 'by', 'from', 'about', 'as', 'or', 'no', 'not', 'one', 'two', 'three', 'four', 'five', 'six', 'ten']);

// A day is five tiers of five, and every tier block runs the same five
// lanes in this order. Both are the shape of the game, not a convention.
const SUBJECTS = CFG.lanes.map(([n]) => n);
const PER_TIER = SUBJECTS.length;
const TOTAL_Q = 10;
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
  if (!SUBJECTS.includes(q.cat)) fail(`${q.id}: cat "${q.cat}" is not one of the two lanes`);
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
  // Spell's stems are templates ("Which word is spelled correctly?"), so a
  // repeat is the stem AND the same four choices, not the stem alone.
  const k = norm(q.q) + ' | ' + q.choices.map(norm).sort().join(' / ');
  if (seenText.has(k)) fail(`${q.id}: repeats the question text of ${seenText.get(k)}`);
  seenText.set(k, q.id);
}

// The same fact asked twice, in two different lanes, on two different days.
// Two questions that share an ANSWER and any distinctive word are the shape of
// it (a merger asked from both ends, both answering the same acquirer). A
// warning rather than a failure: a famous name is the fair answer to several
// genuinely different questions, so a human decides.
const TEMPLATE = new Set(('which what who whom whose where when many name named known called nickname company companies firm firms brand brands group business businesses maker makers chain chains retailer store stores product products line lines year years decade first last later founded launched introduced sold sells sell owns owned bought buy acquired merged deal deals price prices term takes states united american british french german japanese swiss dutch italian swedish chinese indian korean european country city these that this from with their they there only into over under after before famous popular common often usually still large largest biggest small').split(' '));
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
  if (p.quizId !== `${GAME}-${Number(p.live.slice(5, 7))}-${Number(p.live.slice(8, 10))}-${p.live.slice(2, 4)}`) fail(`${tag}: quizId ${p.quizId} does not match live date ${p.live}`);
  if ('sunday' in p) fail(`${tag}: the English Gauntlet runs no Sunday Edition, so no day may be flagged sunday`);
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
    if (n < 2) fail(`${tag}: column ${String.fromCharCode(65 + k)} is correct only ${n} times`);
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
// Both are scoped to days live on or after SCI_COPY_FROM, so the frozen past is
// not retroactively failed. A question no day plays has no live date and so is
// outside the window; the orphan warning below is what catches those.
const inWindow = QUESTIONS.filter((q) => (liveOf.get(q.id) || '') >= SCI_COPY_FROM);

for (const q of inWindow) {
  for (const s of [q.q, ...(q.choices || [])]) {
    for (const hit of scanUS(s, SPELL_ALLOW)) fail(`${q.id}: British spelling "${hit.found}" in copy (US: ${hit.us})`);
    // The local supplement gets the same proper-name exemption as the shared
    // screen, so a real name is skipped once rather than twice.
    let bare = String(s);
    for (const a of SPELL_ALLOW) if (a && bare.includes(a)) bare = bare.split(a).join(' ');
    for (const [re, us] of LOCAL_BRITISH) {
      const m = bare.match(re);
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
    fail(`"${q.choices[q.correct]}" is the correct answer ${ids.length} times since ${SCI_COPY_FROM}, over the ceiling of ${ANSWER_CAP} (${ids.join(', ')})`);
  }
}

const orphans = QUESTIONS.filter((q) => !usedQids.has(q.id));
if (orphans.length) warn(`${orphans.length} questions in the bank are not used by any day (${orphans.slice(0, 5).map((q) => q.id).join(', ')}...)`);

// ---- report ---------------------------------------------------------------
for (const w of warns) console.warn(`warn  ${w}`);
if (errs.length) {
  for (const e of errs) console.error(`FAIL  ${e}`);
  console.error(`\n${errs.length} problem${errs.length === 1 ? '' : 's'} in ${QUESTIONS.length} questions across ${PUZZLES.length} days.`);
  return false;
}
console.log(`${GAME} ok: ${QUESTIONS.length} questions, ${PUZZLES.length} days, ${dates[0]} to ${dates[dates.length - 1]}, ${warns.length} warning${warns.length === 1 ? '' : 's'}.`);
console.log(`    copy window from ${SCI_COPY_FROM}: ${inWindow.length} questions screened for British spellings, ${answerUse.size} distinct answers, none over ${ANSWER_CAP}.`);
return true;
}
