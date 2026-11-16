// scripts/verify-poll.mjs: checks Poll's bank (app/poll/puzzles.js), its pool
// (scripts/poll-pool.mjs) and its scorer (lib/poll-score.js). Shares no code
// with scripts/gen-poll.mjs.
//
// Bank: contiguous dates from day 1, quizId/num/dateLabel agree with the date,
// five questions a day, every one A or B, a house crowd of exactly 48 votes as
// counts with neither side empty, at most two brand pairs, one question a
// topic otherwise (so at least four topics a day), a work question at most
// once every three days, at least one lopsided and one close split, a
// brand or food opener, no question dealt twice or shared with Herd's bank,
// seasonal questions inside their windows, copy limits, US spelling, no dashes.
// Across the bank: A is not the bigger side too often, and no topic dominates.
// Scorer: one point a percentage point, leave-one-out, the ballot encoding, the
// house retiring after ten, ranking, and the lean.
//   node scripts/verify-poll.mjs
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { PUZZLES } = await import('../app/poll/puzzles.js');
const { PUZZLES: HERD } = await import('../app/herd/puzzles.js');
const { POOL } = await import('./poll-pool.mjs');
const { scorePollField, rankPoll, cleanPollBallot, encodePoll, decodePoll, scorePollGame, HOUSE_CUTOFF, POLL_TOTAL } = await import('../lib/poll-score.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const BRIT = /\b(colour|favour|flavour|honour|neighbour|centre|theatre|grey|organis|realis|travell|cosy|mum\b|pyjama|doughnut)/i;
const DASH = /[–—]/;
const TOPICS = new Set(['food', 'brand', 'home', 'travel', 'screen', 'tech', 'money', 'work', 'social', 'sport', 'nature', 'would', 'misc']);

// ---- pool ----
const poolQ = new Map();
for (const row of POOL) {
  const [t, q, a, b, e, f] = row;
  if (!TOPICS.has(t)) fail(`pool: "${q}" has unknown topic ${t}`);
  if (typeof q !== 'string' || q.length > 64) fail(`pool: question too long (${q.length}): ${q}`);
  for (const o of [a, b]) if (typeof o !== 'string' || !o || o.length > 18) fail(`pool: option too long or empty in "${q}": ${o}`);
  if (a.toLowerCase() === b.toLowerCase()) fail(`pool: "${q}" repeats an option`);
  if (!Number.isInteger(e) || e < 6 || e > 94) fail(`pool: "${q}" est ${e} outside 6..94`);
  if (BRIT.test(row.join(' '))) fail(`pool: British spelling in "${q}"`);
  if (DASH.test(row.join(' '))) fail(`pool: dash in "${q}"`);
  if (!!(f && f.b) !== (t === 'brand')) fail(`pool: "${q}" brand flag and topic disagree`);
  if (f && f.w && !(Array.isArray(f.w) && f.w.length === 2 && f.w.every((x) => /^\d\d-\d\d$/.test(x)) && f.w[0] <= f.w[1])) fail(`pool: "${q}" bad window`);
  if (poolQ.has(q.toLowerCase())) fail(`pool: "${q}" appears twice`);
  poolQ.set(q.toLowerCase(), { t, a, b, e, w: (f && f.w) || null });
}
{
  const big = POOL.filter((r) => r[4] > 50).length;
  if (big / POOL.length > 0.6 || big / POOL.length < 0.4) fail(`pool: A is the bigger side on ${big} of ${POOL.length}`);
}

// ---- bank ----
const iso = (d) => d.toISOString().slice(0, 10);
const herdQ = new Set(); for (const p of HERD) for (const pr of p.prompts) herdQ.add(pr.q.toLowerCase());
let day = new Date(`${PUZZLES[0].live}T12:00:00Z`);
const seen = new Set();
const topicTotals = {};
let aBig = 0, qTotal = 0;
PUZZLES.forEach((p, k) => {
  const want = iso(day);
  if (p.num !== k + 1) fail(`#${p.num}: num should be ${k + 1}`);
  if (p.live !== want) fail(`#${p.num}: live ${p.live}, expected ${want}`);
  const [y, m, d] = want.split('-').map(Number);
  if (p.quizId !== `poll-${m}-${d}-${String(y).slice(2)}`) fail(`#${p.num}: quizId ${p.quizId}`);
  const label = new Date(`${want}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (p.dateLabel !== label) fail(`#${p.num}: dateLabel ${p.dateLabel}`);
  if ('sunday' in p) fail(`#${p.num}: Poll has no Sunday Edition and carries no sunday field`);
  if (!Array.isArray(p.prompts) || p.prompts.length !== 5) { fail(`#${p.num}: ${p.prompts && p.prompts.length} questions, want 5`); day.setUTCDate(day.getUTCDate() + 1); return; }
  let brands = 0, lop = 0, close = 0;
  const byT = {};
  p.prompts.forEach((pr, i) => {
    const text = JSON.stringify(pr);
    if (!Array.isArray(pr.options) || pr.options.length !== 2) fail(`#${p.num}: "${pr.q}" is not A or B`);
    if (pr.q.length > 64) fail(`#${p.num}: question too long: ${pr.q}`);
    for (const o of pr.options) if (o.length > 18) fail(`#${p.num}: option too long: ${o}`);
    if (BRIT.test(text)) fail(`#${p.num}: British spelling in "${pr.q}"`);
    if (DASH.test(text)) fail(`#${p.num}: dash in "${pr.q}"`);
    if (!TOPICS.has(pr.topic)) fail(`#${p.num}: "${pr.q}" topic ${pr.topic}`);
    if (!!pr.brand !== (pr.topic === 'brand')) fail(`#${p.num}: "${pr.q}" brand flag and topic disagree`);
    if (!Array.isArray(pr.house) || pr.house.length !== 2) fail(`#${p.num}: "${pr.q}" house shape`);
    else {
      const sum = pr.house[0] + pr.house[1];
      if (sum !== 48) fail(`#${p.num}: "${pr.q}" house sums to ${sum}`);
      if (Math.min(...pr.house) < 1) fail(`#${p.num}: "${pr.q}" has an empty side`);
      const share = Math.round((pr.house[0] / sum) * 100);
      if (share <= 31 || share >= 69) lop++;
      if (share >= 40 && share <= 60) close++;
      if (pr.house[0] > pr.house[1]) aBig++;
      qTotal++;
      // The house must be the pool estimate laid out as votes, recomputed here.
      const src = poolQ.get(pr.q.toLowerCase());
      if (!src) fail(`#${p.num}: "${pr.q}" is not in the pool`);
      else {
        const a = Math.max(1, Math.min(47, Math.round((src.e * 48) / 100)));
        if (pr.house[0] !== a) fail(`#${p.num}: "${pr.q}" house ${pr.house[0]} does not match est ${src.e} (${a})`);
        if (src.a !== pr.options[0] || src.b !== pr.options[1]) fail(`#${p.num}: "${pr.q}" options differ from the pool`);
        if (src.t !== pr.topic) fail(`#${p.num}: "${pr.q}" topic differs from the pool`);
        if (src.w && !(want.slice(5) >= src.w[0] && want.slice(5) <= src.w[1])) fail(`#${p.num}: "${pr.q}" dealt outside its window ${src.w.join('..')}`);
      }
    }
    if (pr.brand) brands++;
    byT[pr.topic] = (byT[pr.topic] || 0) + 1;
    topicTotals[pr.topic] = (topicTotals[pr.topic] || 0) + 1;
    if (i === 0 && pr.topic !== 'brand' && pr.topic !== 'food') fail(`#${p.num}: opens on ${pr.topic}, want a brand or food pair`);
    if (seen.has(pr.q.toLowerCase())) fail(`#${p.num}: "${pr.q}" was already dealt`);
    if (herdQ.has(pr.q.toLowerCase())) fail(`#${p.num}: "${pr.q}" is also a Herd question`);
    seen.add(pr.q.toLowerCase());
  });
  if (byT.work && k > 0 && PUZZLES.slice(Math.max(0, k - 2), k).some((b) => b.prompts.some((x) => x.topic === 'work'))) fail(`#${p.num}: a work question within three days of the last`);
  if (brands > 2) fail(`#${p.num}: ${brands} brand pairs, at most two`);
  for (const [t, n] of Object.entries(byT)) if (n > (t === 'brand' ? 2 : 1)) fail(`#${p.num}: ${n} questions from ${t}`);
  if (Object.keys(byT).length < 4) fail(`#${p.num}: only ${Object.keys(byT).length} topics, want at least four of the five different`);
  if (lop < 1) fail(`#${p.num}: no lopsided question`);
  if (close < 1) fail(`#${p.num}: no close question`);
  day.setUTCDate(day.getUTCDate() + 1);
});
if (PUZZLES[0].prompts[0].q !== 'Cheez-Its or Goldfish?') fail('day 1 must open on Cheez-Its or Goldfish?');
if (qTotal && (aBig / qTotal > 0.62 || aBig / qTotal < 0.38)) fail(`A is the bigger side on ${aBig} of ${qTotal} banked questions`);
for (const [t, n] of Object.entries(topicTotals)) if (n / qTotal > 0.3) fail(`topic ${t} is ${n} of ${qTotal} banked questions`);
if (Object.keys(topicTotals).length < 10) fail(`only ${Object.keys(topicTotals).length} topics in the bank, want a wide range`);

// ---- scorer ----
const pz = { quizId: 'poll-11-16-26', prompts: [{ q: 'A or B?', options: ['A', 'B'], house: [36, 12] }, { q: 'C or D?', options: ['C', 'D'], house: [24, 24] }] };
const pl = (a, c = '1') => ({ answers: a, created: c });
if (JSON.stringify(decodePoll(encodePoll(1, 37))) !== JSON.stringify({ pick: 1, pct: 37 })) fail('scorer: encode/decode round trip');
if (decodePoll(101) !== null || decodePoll(1101) !== null || decodePoll(-1) !== null || decodePoll(2.5) !== null) fail('scorer: out-of-range ballot decoded');
// two questions -> 50 a question. House 36/12: an A voter sees 36 of 48 = 75.
let me = pl([encodePoll(0, 75), encodePoll(0, 50)]);
let f = scorePollField(pz, [me]);
if (f.per !== 50) fail(`scorer: per-question should be 50, got ${f.per}`);
if (f.totalFor(me) !== 100) fail(`scorer: a dead-on ballot should pay 100, got ${f.totalFor(me)}`);
// one point a percentage point
me = pl([encodePoll(0, 65), encodePoll(0, 50)]);
f = scorePollField(pz, [me]);
if (f.totalFor(me) !== 90) fail(`scorer: ten points off should pay 90, got ${f.totalFor(me)}`);
if (f.missFor(me) !== 10) fail('scorer: miss should be 10');
// never below zero on a question
me = pl([encodePoll(0, 0), encodePoll(0, 50)]);
f = scorePollField(pz, [me]);
if (f.totalFor(me) !== 50) fail(`scorer: a 75-point miss floors at 0, got ${f.totalFor(me)}`);
// leave-one-out: a B voter's own vote is not in the split they are scored on
{
  const one = { quizId: 'x', prompts: [{ q: 'q', options: ['A', 'B'], house: [1, 1] }] };
  const b = pl([encodePoll(1, 50)]);
  const g = scorePollField(one, [b]);
  if (g.contexts[0].viewFor(b.answers[0]).actual !== 50) fail('scorer: own vote must be left out of the split');
  if (g.totalFor(b) !== 100) fail('scorer: leave-one-out 50 should pay in full');
}
// the house retires past the cutoff, and then real picks decide
{
  const many = Array.from({ length: HOUSE_CUTOFF + 1 }, (_, i) => pl([encodePoll(1, 0), encodePoll(1, 0)], String(i)));
  const g = scorePollField(pz, many);
  if (g.useHouse) fail('scorer: house should retire past the cutoff');
  if (g.totalFor(many[0]) !== 100) fail('scorer: an all-B room is 0 percent A');
}
// the lean: picked A and guessed A too high = overrates agreement
me = pl([encodePoll(0, 95), encodePoll(1, 30)]);
f = scorePollField(pz, [me]);
if (f.leanFor(me) !== 20) fail(`scorer: lean ${f.leanFor(me)}`);
// ranking: points, then smaller miss, then earliest
const r = rankPoll([{ total: 50, miss: 80, created: '1' }, { total: 50, miss: 60, created: '2' }, { total: 70, miss: 90, created: '3' }, { total: 50, miss: 60, created: '0' }]);
if (r.map((e) => e.created).join() !== '3,0,2,1') fail('scorer: ranking order');
if (cleanPollBallot([encodePoll(0, 50)], pz) !== null) fail('scorer: short ballot accepted');
if (cleanPollBallot([50, 1101], pz) !== null) fail('scorer: out-of-range answer accepted');
if (cleanPollBallot([50, [1, 2]], pz) !== null) fail('scorer: non-number answer accepted');
// the combined-board adapter ranks named players only and reports out of 100
{
  const g = scorePollGame(pz, [{ ...pl([encodePoll(0, 75), encodePoll(0, 50)]), name: 'a', userId: 'u1' }, { ...pl([encodePoll(0, 10), encodePoll(0, 50)], '2'), name: null, anonId: 'x' }, { answers: ['junk'], name: 'bad', userId: 'u2' }]);
  if (g.field !== 1) fail(`scorer: combined field ${g.field}, want 1`);
  const row = g.players.get('u:u1');
  if (!row || row.total !== POLL_TOTAL || row.rank !== 1) fail('scorer: combined row');
}

console.log(`verify-poll: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ${POOL.length} pool questions, ${fails} failures`);
process.exit(fails ? 1 : 0);
