// scripts/verify-herd.mjs: checks Herd's bank (app/herd/puzzles.js) and its
// scorer (lib/herd-score.js). Shares no code with scripts/gen-herd.mjs.
//
// Bank: contiguous dates from day 1, quizId/num/dateLabel agree with the date,
// ten questions a day, every one A or B (two options), a house crowd of exactly 48 votes laid out as counts with a strict
// leader and no option under 1, at least two easy and two close calls a day,
// no question dealt twice, copy limits, US spelling, no dashes.
// Scorer: leave-one-out, ties at the top count, the house retires after ten.
//   node scripts/verify-herd.mjs
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { PUZZLES } = await import('../app/herd/puzzles.js');
const { POOL } = await import('./herd-pool.mjs');
const { scoreHerdField, rankHerd, cleanHerdBallot, HOUSE_CUTOFF } = await import('../lib/herd-score.js');

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const BRIT = /\b(colour|favour|flavour|honour|neighbour|centre|theatre|grey|organis|realis|travell|cosy|mum|pyjama)/i;
const DASH = /[–—]/;

function iso(d) { return d.toISOString().slice(0, 10); }
let day = new Date(`${PUZZLES[0].live}T12:00:00Z`);
const seen = new Set();
PUZZLES.forEach((p, k) => {
  const want = iso(day);
  if (p.num !== k + 1) fail(`#${p.num}: num should be ${k + 1}`);
  if (p.live !== want) fail(`#${p.num}: live ${p.live}, expected ${want}`);
  const [y, m, d] = want.split('-').map(Number);
  if (p.quizId !== `herd-${m}-${d}-${String(y).slice(2)}`) fail(`#${p.num}: quizId ${p.quizId}`);
  const label = new Date(`${want}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (p.dateLabel !== label) fail(`#${p.num}: dateLabel ${p.dateLabel}`);
  if (p.sunday) fail(`#${p.num}: Herd has no Sunday Edition`);
  if (!Array.isArray(p.prompts) || p.prompts.length !== 10) fail(`#${p.num}: ${p.prompts && p.prompts.length} questions, want 10`);
  let two = 0, easy = 0, close = 0;
  for (const pr of p.prompts || []) {
    const K = pr.options && pr.options.length;
    if (K !== 2) fail(`#${p.num}: "${pr.q}" has ${K} options, every Herd question is A or B`);
    if (K === 2) two++;
    if (new Set(pr.options.map((o) => o.toLowerCase())).size !== K) fail(`#${p.num}: "${pr.q}" repeats an option`);
    if (pr.q.length > 64) fail(`#${p.num}: question too long: ${pr.q}`);
    for (const o of pr.options) if (o.length > 18) fail(`#${p.num}: option too long: ${o}`);
    const text = JSON.stringify(pr);
    if (BRIT.test(text)) fail(`#${p.num}: British spelling in "${pr.q}"`);
    if (DASH.test(text)) fail(`#${p.num}: dash in "${pr.q}"`);
    if (!Array.isArray(pr.house) || pr.house.length !== K) fail(`#${p.num}: "${pr.q}" house length`);
    else {
      const sum = pr.house.reduce((a, b) => a + b, 0);
      if (sum !== 48) fail(`#${p.num}: "${pr.q}" house sums to ${sum}`);
      if (Math.min(...pr.house) < 1) fail(`#${p.num}: "${pr.q}" has an empty option`);
      const s = pr.house.slice().sort((a, b) => b - a);
      if (s[0] === s[1]) fail(`#${p.num}: "${pr.q}" house leader is tied`);
      const lead = s[0] / sum, gap = (s[0] - s[1]) / sum;
      if (K === 2 ? lead >= 0.69 : gap >= 0.24) easy++;
      if (K === 2 ? lead <= 0.58 : gap <= 0.09) close++;
    }
    if (seen.has(pr.q)) fail(`#${p.num}: "${pr.q}" was already dealt`);
    seen.add(pr.q);
  }
  if (easy < 2) fail(`#${p.num}: only ${easy} easy calls`);
  if (close < 2) fail(`#${p.num}: only ${close} close calls`);
  day.setUTCDate(day.getUTCDate() + 1);
});

// The house leader must not always sit in the same position.
const pos = {};
for (const p of PUZZLES) for (const pr of p.prompts) { const i = pr.house.indexOf(Math.max(...pr.house)); pos[i] = (pos[i] || 0) + 1; }
const total = Object.values(pos).reduce((a, b) => a + b, 0);
for (const [i, n] of Object.entries(pos)) if (n / total > 0.55) fail(`house leader sits in position ${i} on ${n} of ${total} questions`);

// Every pool entry is well formed.
for (const x of POOL) {
  const s = x.h.reduce((a, b) => a + b, 0);
  if (s !== 100 || x.h.length !== x.o.length) fail(`pool: "${x.q}" shares`);
}

// ---- scorer ----
const pz = { quizId: 'herd-10-17-26', prompts: [{ q: 'A or B?', options: ['A', 'B'], house: [30, 18] }, { q: 'X, Y or Z?', options: ['X', 'Y', 'Z'], house: [10, 20, 18] }] };
const pl = (a) => ({ answers: a, created: '1' });
// house active: A leads, Y leads
let f = scoreHerdField(pz, [pl([0, 1])]);
if (f.totalFor(pl([0, 1])) !== 2) fail('scorer: house majority should pay 2');
if (f.totalFor(pl([1, 2])) !== 0) fail('scorer: minority should pay 0');
// leave-one-out: Y 20 vs Z 18 -> a Z voter sees Y 20, Z 18 (own vote out) and loses; a tie counts
f = scoreHerdField({ ...pz, prompts: [{ q: 'q', options: ['A', 'B'], house: [24, 23] }] }, [pl([1])]);
if (f.totalFor(pl([1])) !== 0) fail('scorer: own vote must not lift you level');
f = scoreHerdField({ ...pz, prompts: [{ q: 'q', options: ['A', 'B'], house: [24, 24] }] }, [pl([1])]);
if (f.totalFor(pl([1])) !== 1) fail('scorer: a tie at the top should pay');
// house retires after the cutoff
const many = Array.from({ length: HOUSE_CUTOFF + 1 }, () => pl([1, 0]));
f = scoreHerdField(pz, many);
if (f.useHouse) fail('scorer: house should retire past the cutoff');
if (f.totalFor(many[0]) !== 2) fail('scorer: real crowd should decide once the house retires');
// ranking: points, then share, then time
const r = rankHerd([{ total: 1, share: 0.4, created: '1' }, { total: 1, share: 0.6, created: '2' }, { total: 2, share: 0, created: '3' }]);
if (r.map((e) => e.created).join() !== '3,2,1') fail('scorer: ranking order');
if (cleanHerdBallot([0, 3], pz) !== null) fail('scorer: out-of-range answer accepted');

console.log(`verify-herd: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ${fails} failures`);
process.exit(fails ? 1 : 0);
