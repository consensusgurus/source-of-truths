// scripts/verify-aorb.mjs: checks Aorb's bank (app/aorb/puzzles.js) and its
// scorer (lib/aorb-score.js). Shares no code with scripts/gen-aorb.mjs.
//
// Bank: contiguous dates from day 1, quizId/num/dateLabel agree with the date,
// ten A-or-B pairs a day, a house crowd of exactly 50 votes as counts [A, B]
// with a strict leader no larger than 36 (no instant reflex), EXACTLY ONE
// "Who is more attractive?" pair a day and never first, EXACTLY TWO brand pairs,
// two or three movie, TV or book pairs, no other lane past two, no option twice
// on a day, no pair dealt twice in the bank, copy limits, US spelling, no
// dashes, and the house leader not parked in one position.
// Scorer: the read pays the leave-one-out split of the side called, the bonus
// fires only when an own pick beats its predicted share, the house never pays a
// bonus, the house retires after ten, ranking order, ballot cleaning, and a
// peek's null slots never count.
//   node scripts/verify-aorb.mjs
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { PUZZLES } = await import('../app/aorb/puzzles.js');
const { POOL } = await import('./aorb-pool.mjs');
const { scoreAorbField, rankAorb, cleanAorbBallot, postedScore, HOUSE, HOUSE_CUTOFF } = await import('../lib/aorb-score.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const BRIT = /\b(colour|favour|flavour|honour|neighbour|centre|theatre|grey|organis|realis|travell|cosy|mum|pyjama|favourite)/i;
const DASH = /[–—]/;
const MEDIA = new Set(['movie', 'tv', 'book']);
const LANES = new Set(['people', 'brand', 'movie', 'tv', 'book', 'food', 'travel', 'life', 'sports', 'music', 'misc']);
const pairKey = (o) => o.map((x) => x.toLowerCase()).sort().join('|');

function iso(d) { return d.toISOString().slice(0, 10); }
let day = new Date(`${PUZZLES[0].live}T12:00:00Z`);
const seen = new Set();
const pos = [0, 0];
PUZZLES.forEach((p, k) => {
  const want = iso(day);
  if (p.num !== k + 1) fail(`#${p.num}: num should be ${k + 1}`);
  if (p.live !== want) fail(`#${p.num}: live ${p.live}, expected ${want}`);
  const [y, m, d] = want.split('-').map(Number);
  if (p.quizId !== `aorb-${m}-${d}-${String(y).slice(2)}`) fail(`#${p.num}: quizId ${p.quizId}`);
  const label = new Date(`${want}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (p.dateLabel !== label) fail(`#${p.num}: dateLabel ${p.dateLabel}`);
  if ('sunday' in p) fail(`#${p.num}: Aorb has no Sunday Edition and carries no sunday field`);
  if (!Array.isArray(p.prompts) || p.prompts.length !== 10) { fail(`#${p.num}: ${p.prompts && p.prompts.length} pairs, want 10`); return; }
  const lanes = {};
  const opts = new Set();
  p.prompts.forEach((pr, i) => {
    if (!LANES.has(pr.lane)) fail(`#${p.num}: "${pr.q}" unknown lane ${pr.lane}`);
    lanes[pr.lane] = (lanes[pr.lane] || 0) + 1;
    if (!Array.isArray(pr.options) || pr.options.length !== 2) { fail(`#${p.num}: "${pr.q}" is not A or B`); return; }
    if (pr.options[0].toLowerCase() === pr.options[1].toLowerCase()) fail(`#${p.num}: "${pr.q}" repeats an option`);
    if (!pr.q.endsWith('?') || pr.q.length > 40) fail(`#${p.num}: question shape: ${pr.q}`);
    if (pr.lane === 'people' && pr.q !== 'Who is more attractive?') fail(`#${p.num}: people pair must ask "Who is more attractive?"`);
    if (pr.lane !== 'people' && /attractive/i.test(pr.q)) fail(`#${p.num}: attractiveness outside the people lane: ${pr.q}`);
    for (const o of pr.options) {
      if (o.length > 30) fail(`#${p.num}: option too long: ${o}`);
      if (opts.has(o.toLowerCase())) fail(`#${p.num}: option twice on one day: ${o}`);
      opts.add(o.toLowerCase());
    }
    // Proper names keep their own spelling (Grey's Anatomy is a title).
    const text = JSON.stringify(pr).replace(/Grey's Anatomy/g, '');
    if (BRIT.test(text)) fail(`#${p.num}: British spelling in "${pr.q}"`);
    if (DASH.test(text)) fail(`#${p.num}: dash in "${pr.q}"`);
    if (!Array.isArray(pr.house) || pr.house.length !== 2) fail(`#${p.num}: "${pr.q}" house shape`);
    else {
      const [a, b] = pr.house;
      if (a + b !== HOUSE) fail(`#${p.num}: "${pr.q}" house sums to ${a + b}`);
      if (a === b) fail(`#${p.num}: "${pr.q}" house leader is tied`);
      if (Math.max(a, b) > 36) fail(`#${p.num}: "${pr.q}" house ${a}/${b} is an instant reflex`);
      if (Math.min(a, b) < 7) fail(`#${p.num}: "${pr.q}" has a near-empty side`);
      pos[a > b ? 0 : 1]++;
    }
    const key = pairKey(pr.options);
    if (seen.has(key)) fail(`#${p.num}: "${pr.options.join(' or ')}" was already dealt`);
    seen.add(key);
  });
  if (lanes.people !== 1) fail(`#${p.num}: ${lanes.people || 0} people pairs, want exactly 1`);
  if (p.prompts[0].lane === 'people') fail(`#${p.num}: the people pair opens the day`);
  if (lanes.brand !== 2) fail(`#${p.num}: ${lanes.brand || 0} brand pairs, want exactly 2`);
  const media = (lanes.movie || 0) + (lanes.tv || 0) + (lanes.book || 0);
  if (media < 2 || media > 3) fail(`#${p.num}: ${media} movie/TV/book pairs, want 2 or 3`);
  for (const [l, n] of Object.entries(lanes)) if (!['people', 'brand'].includes(l) && !MEDIA.has(l) && n > 2) fail(`#${p.num}: ${n} ${l} pairs, at most 2`);
  day.setUTCDate(day.getUTCDate() + 1);
});
const tot = pos[0] + pos[1];
if (tot && Math.max(...pos) / tot > 0.6) fail(`house leader sits in position ${pos[0] > pos[1] ? 'A' : 'B'} on ${Math.max(...pos)} of ${tot} pairs`);

for (const x of POOL) {
  if (!LANES.has(x.c)) fail(`pool: "${x.o.join(' or ')}" lane ${x.c}`);
  if (x.h.length !== 2 || x.h[0] + x.h[1] !== 100 || x.h[0] === x.h[1]) fail(`pool: "${x.o.join(' or ')}" shares`);
}

// ---- scorer ----
const pz = { quizId: 'aorb-10-23-26', prompts: [{ q: 'A or B?', options: ['A', 'B'], house: [36, 14] }] };
const pl = (me, call, created = '1') => ({ answers: [[me, call]], created });
let f = scoreAorbField(pz, [pl(0, 0)]);
// House 36/14 plus one real A pick. Leave-one-out for that player: 36/14 again.
let d = f.detailFor(pl(0, 0));
if (d.read !== 72) fail(`scorer: calling the 72 side should pay 72, got ${d.read}`);
if (d.bonus !== 0) fail('scorer: the house alone must never pay a bonus');
d = f.detailFor(pl(0, 1));
if (d.read !== 28) fail(`scorer: calling the 28 side should pay 28, got ${d.read}`);
// Own pick removed: a lone real B picker against an empty house is not scored on themself.
f = scoreAorbField({ quizId: 'x', prompts: [{ q: 'q', options: ['A', 'B'], house: [0, 0] }] }, [pl(1, 1)]);
if (f.detailFor(pl(1, 1)).read !== 50) fail('scorer: an empty pool after leave-one-out reads 50');
// Bonus: a real crowd past the cutoff where B is liked 60% but called by only 30%.
const crowd = [];
for (let k = 0; k < 6; k++) crowd.push(pl(1, k < 3 ? 1 : 0, String(k)));
for (let k = 0; k < 4; k++) crowd.push(pl(0, 0, String(10 + k)));
crowd.push(pl(1, 0, '99'));
f = scoreAorbField(pz, crowd);
if (f.useHouse) fail('scorer: the house should retire past the cutoff');
const bPicker = f.detailFor(crowd[10]);
if (bPicker.bonus !== 1) fail('scorer: an own pick more popular than predicted should pay the bonus');
const aPicker = f.detailFor(crowd[6]);
if (aPicker.bonus !== 0) fail('scorer: an own pick less popular than predicted must not pay');
if (f.realCount !== 11 || HOUSE_CUTOFF !== 10) fail('scorer: cutoff bookkeeping');
// A peek's unanswered slots must not count as A.
const two = { quizId: 'x', prompts: [{ q: 'q', options: ['A', 'B'], house: [25, 25 - 1] }, { q: 'r', options: ['A', 'B'], house: [10, 39] }] };
f = scoreAorbField(two, [{ answers: [[1, 1], [null, null]] }]);
if (f.contexts[1].picks[0] !== 10) fail('scorer: a null slot was counted as a pick');
// Ranking: total, then read, then time.
const r = rankAorb([{ total: 60, readRaw: 59.4, created: '1' }, { total: 60, readRaw: 59.9, created: '2' }, { total: 70, readRaw: 66, created: '3' }]);
if (r.map((e) => e.created).join() !== '3,2,1') fail('scorer: ranking order');
if (cleanAorbBallot([[0, 2]], pz) !== null) fail('scorer: out-of-range pick accepted');
if (cleanAorbBallot([[0, 1]], pz) === null) fail('scorer: a valid ballot was refused');
if (postedScore(104) !== 100 || postedScore(63) !== 63) fail('scorer: posted score cap');

console.log(`verify-aorb: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ${fails} failures`);
process.exit(fails ? 1 : 0);
