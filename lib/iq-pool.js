// SERVER ONLY. Resolves an /iq test's calibrated item pool from the gauntlet
// banks. Imported by app/iq/[slug]/page.js (and the hub, for counts), never by
// a client component: the five question banks are several megabytes and only
// the picked pool may reach a browser, the same rule every gauntlet page keeps.
import { QUESTION_MAP as STREAK } from '../app/streak/questions';
import { QUESTION_MAP as DEEP } from '../app/deep/questions';
import { QUESTION_MAP as ATLAS } from '../app/atlas/questions';
import { QUESTION_MAP as SPORT } from '../app/sport/questions';
import { QUESTION_MAP as BIZ } from '../app/biz/questions';
import { PUZZLES as DEEP_DAYS } from '../app/deep/puzzles';
import { IQ_ITEMS } from './iq-items';
import { IQ_TEST_MAP } from './iq-tests';

const BANKS = { streak: STREAK, deep: DEEP, atlas: ATLAS, sport: SPORT, biz: BIZ };

// Deep carries its subject on the DAY, not on the question, so a Deep item's
// lane is the topic of the day it was authored for. Its id is d<day>q<slot>.
const DEEP_TOPIC = {};
for (const p of DEEP_DAYS) for (const id of p.qids || []) DEEP_TOPIC[id] = p.topic;

const GAME_LABEL = { streak: 'Streak', deep: 'Deep', atlas: 'Atlas', sport: 'Sport', biz: 'Biz' };

function laneOf(game, q, id) {
  if (game === 'deep') return DEEP_TOPIC[id] || null;
  return q.cat || null;
}

function matches(src, game, lane) {
  if (src.game !== game) return false;
  if (src.all) return true;
  if (src.cats) return src.cats.includes(lane);
  if (src.topics) return src.topics.includes(lane);
  return false;
}

/** Every calibrated item a test may draw from, with its question attached. */
export function iqItemsFor(slug) {
  const test = IQ_TEST_MAP[slug];
  if (!test) return [];
  const out = [];
  const seen = new Set();
  for (const [game, id, b, n] of IQ_ITEMS) {
    const q = BANKS[game] && BANKS[game][id];
    if (!q || !Array.isArray(q.choices) || q.choices.length !== 4) continue;
    const lane = laneOf(game, q, id);
    if (!test.sources.some((s) => matches(s, game, lane))) continue;
    const key = String(q.q).trim().toLowerCase();
    if (seen.has(key)) continue; // the same stem authored twice is one item
    seen.add(key);
    out.push({ id: `${game}:${id}`, b, n, lane, src: GAME_LABEL[game], q: q.q, choices: q.choices, correct: q.correct });
  }
  return out;
}

/**
 * The pool one sitting is dealt from. The whole bank for a category runs to a
 * few thousand questions, so a sitting ships a STRATIFIED sample: the
 * difficulty range cut into bands and a random handful taken from each, so
 * the adaptive picker has somewhere to go at every level without the page
 * carrying the whole bank. Items with more play data behind them are
 * preferred inside a band, because their difficulty is measured rather than
 * borrowed from the tier.
 */
export function iqPoolFor(slug, { size = 200, bands = 20 } = {}) {
  const items = iqItemsFor(slug);
  if (!items.length) return [];
  const bs = items.map((x) => x.b).sort((a, b) => a - b);
  // Gimmes sit near b = -8 and tell a test almost nothing about anyone, so the
  // bands start at -3 and everything easier shares the first one.
  const lo = Math.max(-3, bs[Math.floor(bs.length * 0.01)]);
  const hi = bs[Math.floor(bs.length * 0.99)];
  const per = Math.ceil(size / bands);
  const buckets = Array.from({ length: bands }, () => []);
  for (const it of items) {
    const t = hi > lo ? (it.b - lo) / (hi - lo) : 0.5;
    const k = Math.max(0, Math.min(bands - 1, Math.floor(t * bands)));
    buckets[k].push(it);
  }
  const pool = [];
  for (const bucket of buckets) {
    // Random order, then the measured items first.
    const shuffled = bucket.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
    shuffled.sort((a, b) => (b.n >= 5) - (a.n >= 5));
    pool.push(...shuffled.slice(0, per));
  }
  // A small bank leaves the thin bands short, so top the pool up from what is
  // left, anything harder than a gimme first.
  if (pool.length < size) {
    const inPool = new Set(pool.map((x) => x.id));
    const rest = items.filter((x) => !inPool.has(x.id))
      .map((x) => [(x.b >= -3 ? 0 : 1) + Math.random(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
    pool.push(...rest.slice(0, size - pool.length));
  }
  return pool;
}

export function iqCount(slug) { return iqItemsFor(slug).length; }
