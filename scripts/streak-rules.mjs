// scripts/streak-rules.mjs — every mechanical rule the Streak bank obeys, in
// one place, so scripts/verify-streak.mjs is a thin wrapper over it and
// scripts/streak-rules-selftest.mjs can feed it synthetic banks and watch each
// gate go red on purpose.
//
// WHY A SEPARATE MODULE. A check that has never gone red has not been tested,
// and "green" is indistinguishable from "not looking" until something has
// watched it fail. The 2026-09-04 restock shipped 72 British spellings past
// checkers that were all green because none of them was looking. Splitting the
// rules out of the verifier is what makes the selftest possible at all.
//
// Streak is NOT on scripts/mcq-gauntlet-check.mjs. That module is written for
// the 25-question / five-lane shape (its column rule is "at least 5 of 25", its
// messages say "one of the five lanes"), and it is deliberately not retrofitted
// over the four older banks whose days already shipped. This file is the
// 40-question / eight-lane sibling. It DOES import the shared US-spelling
// screen, because that list has no shape assumptions in it and a second copy of
// it is exactly the drift the shared module exists to stop.
import { scanUS } from './us-spellings.mjs';
import { isSportsRules } from './sports-rules-classifier.mjs';

// The lane cycle, in authored order. Slot i of a day is LANES[i % 8], in every
// tier block, on every day since day 1.
export const LANES = ['Geography', 'Science', 'History', 'Sports', 'Movies & TV', 'Music', 'Words & Books', 'Grab Bag'];

// THE PAST IS FROZEN. Days live before this date predate the 2026-09-04 bank
// standard and break several gates below on purpose; see the header of
// verify-streak.mjs for the count of each. Gates marked "scoped" run only at or
// after this date.
export const COPY_FROM = '2026-09-30';

// POOL VARIETY ACROSS THE WHOLE WINDOW, not per day. Days 1..61 answer "four"
// 16 times and "China" 10 times, and every per-day check they had passed.
export const ANSWER_CAP = 4;

// AT MOST ONE SPORTS RULES-TYPE QUESTION A DAY (owner ruling, 2026-09-23). The
// Sports lane had drifted into asking how a sport works (what you hit a tennis
// ball with, what a two-point tackle in the end zone is called) on two and three
// of a day's five Sports slots. "Rules-type" is decided by isSportsRules in
// scripts/sports-rules-classifier.mjs, whose header documents the classifier:
// scoring, counts and dimensions, terminology, officials, equipment, and naming a
// sport from its mechanics count; a rule's HISTORY and anything about a named
// person, team, venue, trophy or edition do not. Scoped to COPY_FROM like every
// gate below: the hand-authored days 1..61 carry up to three and are frozen.
export const SPORTS_RULES_CAP = 1;

const PER_TIER = LANES.length;   // 8
const TOTAL_Q = PER_TIER * 5;    // 40
const PER_COLUMN = TOTAL_Q / 4;  // 10

// Real titles and names keep their own spelling: these are works, not prose.
// Matching is case sensitive, so allowing the film "The Favourite" does not
// excuse a lowercase "favourite" in a sentence. Add a title only when it is
// genuinely spelled that way, never to silence a British form in your own copy.
export const ALLOW_PROPER = [
  'The Favourite', 'The Colour Purple', 'Labour Party', 'Theatre Royal', 'Pearl Harbor',
  "Ford's Theatre", 'Globe Theatre', 'Neighbours', 'Spectre', 'The Theatre', 'Grey Gardens',
  "Grey's Anatomy", 'Encyclopaedia Britannica', 'Earl Grey', 'Zane Grey', 'Grey Cup',
  'Jane Grey', 'Grey Poupon', 'Theatre of Dionysus', 'Old Vic Theatre', 'Labour and Wait',
  'Programme Music', 'Centre Court', 'Centre Pompidou', 'Colour Field', 'The Honourable',
  'Whitbread Literary Award', 'Aluminium Company of America',
  // The Phoenician city, not the rubber ring. Case sensitivity is what makes
  // this safe: a lowercase "tyre" in prose still fails.
  'Tyre',
  // Band and label names as their owners spell them.
  'Ocean Colour Scene', 'The Colour Field',
  // People keep the spelling of their own names.
  'Grey-Thompson', 'Lady Jane Grey',
];

// Words too generic to make two questions "the same fact".
const TEMPLATE = new Set(('which what who whom whose where when how many name named known called nickname year years decade century first last later early famous popular common often usually still large largest biggest small these that this from with their they there only into over under after before more most best worst other another said says say line word term country city river state film movie series show book novel play band album song sport game team player capital element planet').split(' '));

const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'is', 'it', 'its', 'his', 'her', 'their', 'was', 'were', 'by', 'from', 'about', 'as', 'or', 'no', 'not', 'one', 'two', 'three', 'four', 'five', 'six', 'ten']);

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const answerKey = (s) => norm(s).replace(/^(the|a|an) /, '');

// Wording whose answer moves with the calendar. A superlative worth asking gets
// pinned to a year or an event in the stem instead.
const EXPIRING = [
  [/\bcurrently\b/i, 'says "currently"'],
  [/\bas of\b/i, 'says "as of"'],
  [/\bso far\b/i, 'says "so far"'],
  [/\bto date\b/i, 'says "to date"'],
  [/\bat present\b/i, 'says "at present"'],
  [/\bnowadays\b/i, 'says "nowadays"'],
  [/\bthese days\b/i, 'says "these days"'],
  [/\bright now\b/i, 'says "right now"'],
  [/\bthe reigning\b/i, 'asks about "the reigning" holder of something'],
  [/\bcurrent (champion|holder|record|leader|president|prime minister|monarch|ceo|title)/i, 'asks who currently holds a post or record'],
  [/\bholds? the record\b/i, 'asks who holds a record, which a later record breaks'],
  [/\bis the current\b/i, 'asks what something currently is'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function checkStreak({ QUESTIONS, QUESTION_MAP, PUZZLES }) {
  const errs = [];
  const warns = [];
  const fail = (m) => errs.push(m);
  const warn = (m) => warns.push(m);

  // ---- bank-level, WHOLE BANK ---------------------------------------------
  const ids = new Set();
  const seenQ = new Map();
  for (const q of QUESTIONS) {
    if (ids.has(q.id)) fail(`dup id ${q.id}`);
    ids.add(q.id);
    if (!/^d\d{2,3}q\d\d$/.test(q.id)) fail(`${q.id}: id is not d<NN>q<NN> or d<NNN>q<NN>`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${q.id}: needs 4 choices`);
    else if (new Set(q.choices.map(norm)).size !== 4) fail(`${q.id}: duplicate choices`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) fail(`${q.id}: correct out of range`);
    if (!Number.isInteger(q.tier) || q.tier < 1 || q.tier > 5) fail(`${q.id}: tier out of range`);
    if (!LANES.includes(q.cat)) fail(`${q.id}: cat "${q.cat}" is not one of the eight lanes`);
    if (!q.q || q.q.length < 8) fail(`${q.id}: question text too short`);
    if (q.q && !q.q.trim().endsWith('?')) fail(`${q.id}: question does not end in a question mark`);
    // The site's writing rules ban the em dash in anything a reader sees, and
    // curly punctuation is folded at generation time, so either one here means
    // the generated file was hand-edited.
    for (const s of [q.q, ...(q.choices || [])]) {
      if (String(s).includes('—')) fail(`${q.id}: em dash in copy`);
      if (/[‘’“”]/.test(String(s))) fail(`${q.id}: curly quote in copy, rebuild from source`);
    }
    const nq = norm(q.q);
    if (seenQ.has(nq)) fail(`${q.id}: duplicate question text of ${seenQ.get(nq)}`);
    seenQ.set(nq, q.id);
    // Legacy giveaway rule (whole bank): the answer sitting in the stem whole.
    const ans = answerKey((q.choices || [])[q.correct] || '');
    if (ans.length >= 4 && nq.includes(ans)) fail(`${q.id}: question text contains its own answer ("${ans}")`);
  }

  // ---- day-level, WHOLE BANK ----------------------------------------------
  const usedAcross = new Map();
  const dates = [];
  PUZZLES.forEach((p, pi) => {
    const tag = p.quizId || `day ${p.num}`;
    if (p.num !== pi + 1) fail(`${tag}: num ${p.num} is not ${pi + 1}, the bank must run contiguously in date order`);
    if (p.sunday) fail(`${tag}: Streak runs no Sunday Edition, so no day may be flagged sunday`);
    const m = /^streak-(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(p.quizId || '');
    if (!m) fail(`${tag}: bad quizId shape`);
    else {
      const [, mo, dy, yr] = m.map(Number);
      const [ly, lm, ld] = String(p.live).split('-').map(Number);
      if (lm !== mo || ld !== dy || ly !== 2000 + yr) fail(`${tag}: live ${p.live} does not match quizId date`);
      const wantLabel = `${MONTHS[lm - 1]} ${ld}, ${ly}`;
      if (p.dateLabel !== wantLabel) fail(`${tag}: dateLabel "${p.dateLabel}" is not the live date ("${wantLabel}")`);
    }
    dates.push(p.live);

    // The qid checks below run over whatever qids the day has, so that a day of
    // the wrong length still gets its lanes, prefixes and reuse checked rather
    // than falling out of the proof entirely on one bad count.
    if (!Array.isArray(p.qids)) { fail(`${tag}: qids is not an array`); return; }
    if (p.qids.length !== TOTAL_Q) fail(`${tag}: needs ${TOTAL_Q} qids, has ${p.qids.length}`);

    const wantPrefix = `d${String(p.num).padStart(2, '0')}q`;
    const qs = p.qids.map((id) => QUESTION_MAP[id]);
    p.qids.forEach((id, i) => {
      if (!id.startsWith(wantPrefix)) fail(`${tag}: qid ${id} does not carry this day's prefix ${wantPrefix}`);
      if (!qs[i]) fail(`${tag}: qid ${id} does not resolve`);
      if (usedAcross.has(id)) fail(`${tag}: qid ${id} already used by ${usedAcross.get(id)}`);
      usedAcross.set(id, tag);
    });
    if (qs.some((q) => !q)) return;

    // Tier ramp and lane cycle: 8 per tier, in order, same eight lanes.
    qs.forEach((q, i) => {
      const wantTier = Math.floor(i / PER_TIER) + 1;
      if (q.tier !== wantTier) fail(`${tag}: slot ${i + 1} is tier ${q.tier}, wanted ${wantTier}`);
      const wantLane = LANES[i % PER_TIER];
      if (q.cat !== wantLane) fail(`${tag}: slot ${i + 1} is ${q.cat}, the lane cycle wants ${wantLane}`);
    });
    if (qs.length !== TOTAL_Q) return;
    for (let b = 0; b < 5; b++) {
      const cats = new Set(qs.slice(b * PER_TIER, (b + 1) * PER_TIER).map((q) => q.cat));
      if (cats.size !== PER_TIER) fail(`${tag}: tier block ${b + 1} covers ${cats.size} categories, wanted ${PER_TIER}`);
    }

    // Legacy correct-position spread (whole bank): at least 5 of 40 per column,
    // no run of 4. The scoped block below tightens this for new days.
    const pos = qs.map((q) => q.correct);
    for (let k = 0; k < 4; k++) {
      const n = pos.filter((x) => x === k).length;
      if (n < 5) fail(`${tag}: position ${'ABCD'[k]} correct only ${n} times (< 5)`);
    }
    let run = 1;
    for (let i = 1; i < pos.length; i++) {
      run = pos[i] === pos[i - 1] ? run + 1 : 1;
      if (run >= 4) fail(`${tag}: 4+ consecutive answers at position ${'ABCD'[pos[i]]} ending slot ${i + 1}`);
    }
  });

  // The bank drops one day at a time, so the dates must be contiguous.
  for (let i = 1; i < dates.length; i++) {
    const prev = Date.parse(`${dates[i - 1]}T00:00:00Z`);
    const cur = Date.parse(`${dates[i]}T00:00:00Z`);
    if (cur - prev !== 86400000) fail(`day ${i + 1}: ${dates[i]} does not follow ${dates[i - 1]} by one day`);
  }

  // ---- gates scoped to COPY_FROM, because the past is frozen ---------------
  const futureIds = new Set();
  for (const p of PUZZLES) if (String(p.live) >= COPY_FROM) (p.qids || []).forEach((id) => futureIds.add(id));
  const future = QUESTIONS.filter((q) => futureIds.has(q.id));

  // US spellings in reader-facing copy (authoring standard rule 8).
  for (const q of future) {
    for (const [label, txt] of [['question', q.q], ...(q.choices || []).map((c, i) => [`choice ${i + 1}`, c])]) {
      for (const hit of scanUS(txt, ALLOW_PROPER)) fail(`${q.id}: British form "${hit.found}" in ${label} (US: ${hit.us})`);
    }
  }

  // POOL VARIETY across the whole new window.
  const use = new Map();
  for (const q of future) {
    const a = answerKey((q.choices || [])[q.correct] || '');
    if (!use.has(a)) use.set(a, []);
    use.get(a).push(q.id);
  }
  for (const [a, list] of use) {
    if (list.length > ANSWER_CAP) fail(`"${a}" is the answer ${list.length} times, over the ${ANSWER_CAP}-use cap (${list.slice(0, 5).join(', ')}...)`);
  }

  // The full giveaway rule: every distinctive word of the answer in the stem.
  for (const q of future) {
    const qn = ` ${norm(q.q)} `;
    const an = answerKey((q.choices || [])[q.correct] || '');
    const words = an.split(' ').filter((w) => w.length > 2 && !STOP.has(w));
    if (words.length && words.every((w) => qn.includes(` ${w} `))) {
      fail(`${q.id}: question contains every distinctive word of its answer ("${(q.choices || [])[q.correct]}")`);
    }
  }

  // Nothing that expires.
  for (const q of future) {
    for (const [re, why] of EXPIRING) if (re.test(q.q)) fail(`${q.id}: ${why}, so the answer moves with the calendar; pin it to a year or an event`);
  }

  // At most one sports rules-type question a day, on the Sports lane.
  for (const p of PUZZLES) {
    if (String(p.live) < COPY_FROM) continue;
    const hits = (p.qids || []).map((id) => QUESTION_MAP[id]).filter((q) => q && q.cat === 'Sports' && isSportsRules(q.q));
    if (hits.length > SPORTS_RULES_CAP) fail(`${p.quizId}: ${hits.length} sports rules-type questions (${hits.map((q) => q.id).join(', ')}), the cap is ${SPORTS_RULES_CAP} a day; rewrite the rest about a sport's history, people, teams, records or events`);
  }

  // Tighter per-day shape for the new window.
  for (const p of PUZZLES) {
    if (String(p.live) < COPY_FROM) continue;
    const qs = (p.qids || []).map((id) => QUESTION_MAP[id]).filter(Boolean);
    // The same answer twice in a day is checked over whatever resolved, so a
    // day of the wrong length still gets it.
    const answers = new Map();
    for (const q of qs) {
      const a = answerKey(q.choices[q.correct]);
      if (answers.has(a)) fail(`${p.quizId}: "${q.choices[q.correct]}" is the answer to both ${answers.get(a)} and ${q.id}`);
      answers.set(a, q.id);
    }
    if (qs.length !== TOTAL_Q) continue;
    const pos = qs.map((q) => q.correct);
    for (let k = 0; k < 4; k++) {
      const n = pos.filter((x) => x === k).length;
      if (n !== PER_COLUMN) fail(`${p.quizId}: position ${'ABCD'[k]} correct ${n} times, the new window is exactly ${PER_COLUMN} of each`);
    }
    for (let i = 2; i < pos.length; i++) {
      if (pos[i] === pos[i - 1] && pos[i] === pos[i - 2]) fail(`${p.quizId}: three correct answers in a row at position ${'ABCD'[pos[i]]}, ending slot ${i + 1}`);
    }
  }

  // ---- the same FACT asked twice (warning, human decides) -----------------
  // Reported only for pairs that touch the new window: a past-past pair is
  // frozen history and there is nothing anyone can do about it.
  const distinct = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3 && !TEMPLATE.has(w)));
  const byAnswer = new Map();
  for (const q of QUESTIONS) {
    const k = answerKey((q.choices || [])[q.correct] || '');
    if (!byAnswer.has(k)) byAnswer.set(k, []);
    byAnswer.get(k).push(q);
  }
  for (const [, group] of byAnswer) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (!futureIds.has(group[i].id) && !futureIds.has(group[j].id)) continue;
        const b = distinct(group[j].q);
        const shared = [...distinct(group[i].q)].filter((w) => b.has(w));
        if (shared.length >= 2) warn(`${group[i].id} and ${group[j].id} share an answer and the words ${shared.join(', ')}, check they are not the same fact twice`);
      }
    }
  }

  const orphans = QUESTIONS.filter((q) => !usedAcross.has(q.id));
  if (orphans.length) warn(`${orphans.length} questions in the bank are used by no day (${orphans.slice(0, 5).map((q) => q.id).join(', ')}...)`);

  return { errs, warns, dates };
}
