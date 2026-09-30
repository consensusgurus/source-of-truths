// Gate for the /iq tests (lib/iq-tests.js, lib/iq-items.js, app/iq/IqEngine.js).
//
//   node scripts/verify-iq.mjs
//
// 1. Every calibrated row resolves to a real four-choice question in its bank.
// 2. No row comes from a day that had not been played when the snapshot was
//    taken, so a test can never show a question a daily is still to ask.
// 3. Every test has a usable bank (at least 250 items) and a dealt pool that
//    spans the difficulty range.
// 4. The engine recovers ability: simulated readers answering by the model
//    itself are placed in the right order, and close to where they are.
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
register('./alias-loader.mjs', import.meta.url);
const root = path.resolve(here, '..');
const imp = (p) => import(path.join(root, p));

const { IQ_ITEMS, IQ_MODEL, IQ_SNAPSHOT } = await imp('lib/iq-items.js');
const { IQ_TESTS, MIN_ITEMS, MAX_ITEMS, TARGET_SE } = await imp('lib/iq-tests.js');
const { iqItemsFor, iqPoolFor } = await imp('lib/iq-pool.js');
const E = await imp('app/iq/IqEngine.js');

let fails = 0;
const fail = (m) => { fails += 1; console.log('FAIL', m); };

const banks = {};
const days = {};
for (const g of ['streak', 'deep', 'atlas', 'sport', 'biz']) {
  banks[g] = (await imp(`app/${g}/questions.js`)).QUESTION_MAP;
  const P = (await imp(`app/${g}/puzzles.js`)).PUZZLES;
  for (const p of P) for (const id of p.qids || []) days[`${g}:${id}`] = p.live;
}

// 1 and 2
const seen = new Set();
for (const [g, id, b, n] of IQ_ITEMS) {
  const key = `${g}:${id}`;
  if (seen.has(key)) fail(`duplicate row ${key}`);
  seen.add(key);
  const q = banks[g] && banks[g][id];
  if (!q) { fail(`${key} is not in its bank`); continue; }
  if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${key} does not have four choices`);
  if (!(q.correct >= 0 && q.correct < 4)) fail(`${key} has no valid correct index`);
  if (!Number.isFinite(b)) fail(`${key} has no difficulty`);
  const live = days[key];
  if (!live) fail(`${key} is on no day`);
  else if (live >= IQ_SNAPSHOT) fail(`${key} is from ${live}, on or after the snapshot ${IQ_SNAPSHOT}`);
}
console.log(`rows ${IQ_ITEMS.length}, snapshot ${IQ_SNAPSHOT}`);

// 3
for (const t of IQ_TESTS) {
  const items = iqItemsFor(t.slug);
  const pool = iqPoolFor(t.slug);
  if (items.length < 250) fail(`${t.slug} has only ${items.length} items`);
  if (pool.length < 120) fail(`${t.slug} deals only ${pool.length}`);
  const bs = pool.map((x) => x.b).sort((a, b) => a - b);
  const hard = bs.filter((b) => b > 1).length;
  if (hard < 15) fail(`${t.slug} pool has only ${hard} items above b = 1`);
  console.log(`${t.slug.padEnd(11)} bank ${String(items.length).padStart(4)} pool ${pool.length} hard ${hard}`);
}
if (!(MIN_ITEMS >= 10 && MAX_ITEMS >= MIN_ITEMS && TARGET_SE > 0)) fail('test length constants are not sane');

// 4. Seeded simulation.
let seed = 12345;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
function sitting(pool, theta) {
  const used = new Set();
  const answers = [];
  let est = { mean: 0.3, sd: 1 };
  let lastLane = null;
  while (answers.length < MAX_ITEMS) {
    const it = E.nextItem(IQ_MODEL, pool, answers.length ? est.mean : 0.3, used, lastLane, rand);
    if (!it) break;
    used.add(it.id);
    lastLane = it.lane;
    answers.push({ b: it.b, right: rand() < E.pCorrect(IQ_MODEL, theta, it.b) });
    est = E.estimate(IQ_MODEL, answers);
    if (answers.length >= MIN_ITEMS && est.sd <= TARGET_SE) break;
  }
  return { est, n: answers.length };
}
for (const t of IQ_TESTS) {
  const pool = iqPoolFor(t.slug);
  const levels = [-2, -1, 0, 1, 2];
  const means = [];
  let err = 0, cnt = 0, sds = 0;
  for (const th of levels) {
    let m = 0;
    for (let k = 0; k < 30; k += 1) { const s = sitting(pool, th); m += s.est.mean; err += Math.abs(s.est.mean - th); sds += s.est.sd; cnt += 1; }
    means.push(m / 30);
  }
  for (let i = 1; i < means.length; i += 1) if (!(means[i] > means[i - 1])) fail(`${t.slug} does not order readers: ${means.map((x) => x.toFixed(2)).join(' ')}`);
  const mae = err / cnt;
  if (mae > 0.6) fail(`${t.slug} misplaces readers by ${mae.toFixed(2)} SD on average`);
  console.log(`${t.slug.padEnd(11)} recovery ${means.map((x) => x.toFixed(2)).join(' ')}  mae ${mae.toFixed(2)}  sd ${(sds / cnt).toFixed(2)}`);
}

// The printed reading.
if (E.ordinalPct(99.7) !== '99th' || E.ordinalPct(1.2) !== '1st' || E.ordinalPct(42.9) !== '42nd' || E.ordinalPct(13) !== '13th') fail('ordinal percentile');
if (Math.abs(E.normCdf(1) - 0.8413) > 0.001 || Math.abs(E.normCdf(-2) - 0.0228) > 0.001) fail('normal cdf');

console.log(fails ? `\n${fails} failure(s)` : '\nverify-iq: clean');
process.exit(fails ? 1 : 0);
