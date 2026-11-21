// THE PAST QUESTION LIBRARY, server only (owner, 2026-11-21). Every question
// or problem from the gauntlet banks that has ALREADY RUN as a daily (its day
// is before today, Eastern), grouped by each database's topics and lanes
// (lib/qdb.js). A question that has not run yet never leaves the server, so
// replaying the archive cannot spoil a coming day.
//
// Read by /api/trivia/set (the set a game plays, for all three databases) and
// the database pages (counts and sample questions with answers, for search).
// Was lib/trivia-library.js until the Math and English Databases joined.

import { QDBS, DIFF_TIERS } from './qdb.js';
import { LANE_MAP } from './trivia-topics.js';
import * as streakQ from '@/app/streak/questions'; import * as streakP from '@/app/streak/puzzles';
import * as deepQ from '@/app/deep/questions'; import * as deepP from '@/app/deep/puzzles';
import * as atlasQ from '@/app/atlas/questions'; import * as atlasP from '@/app/atlas/puzzles';
import * as sportQ from '@/app/sport/questions'; import * as sportP from '@/app/sport/puzzles';
import * as bizQ from '@/app/biz/questions'; import * as bizP from '@/app/biz/puzzles';
import * as scriptQ from '@/app/script/questions'; import * as scriptP from '@/app/script/puzzles';
import * as quotesQ from '@/app/quotes/questions'; import * as quotesP from '@/app/quotes/puzzles';
import * as sciQ from '@/app/sci/questions'; import * as sciP from '@/app/sci/puzzles';
import * as artQ from '@/app/art/questions'; import * as artP from '@/app/art/puzzles';
import * as historyQ from '@/app/history/questions'; import * as historyP from '@/app/history/puzzles';
import * as foodieQ from '@/app/foodie/questions'; import * as foodieP from '@/app/foodie/puzzles';
import * as gramQ from '@/app/gram/questions'; import * as gramP from '@/app/gram/puzzles';
import * as vocabQ from '@/app/vocab/questions'; import * as vocabP from '@/app/vocab/puzzles';
import * as spellQ from '@/app/spell/questions'; import * as spellP from '@/app/spell/puzzles';
import * as originQ from '@/app/origin/questions'; import * as originP from '@/app/origin/puzzles';
import * as idiomQ from '@/app/idiom/questions'; import * as idiomP from '@/app/idiom/puzzles';
import * as orbitQ from '@/app/orbit/questions'; import * as orbitP from '@/app/orbit/puzzles';
import * as bondQ from '@/app/bond/questions'; import * as bondP from '@/app/bond/puzzles';
import * as geneQ from '@/app/gene/questions'; import * as geneP from '@/app/gene/puzzles';
import * as pulseQ from '@/app/pulse/questions'; import * as pulseP from '@/app/pulse/puzzles';
import * as eurekaQ from '@/app/eureka/questions'; import * as eurekaP from '@/app/eureka/puzzles';
import * as blitzQ from '@/app/blitz/problems'; import * as blitzP from '@/app/blitz/puzzles';
import * as blitzedQ from '@/app/blitzed/problems'; import * as blitzedP from '@/app/blitzed/puzzles';
import * as gapQ from '@/app/gap/problems'; import * as gapP from '@/app/gap/puzzles';
import * as seriesQ from '@/app/series/problems'; import * as seriesP from '@/app/series/puzzles';
import * as backQ from '@/app/back/problems'; import * as backP from '@/app/back/puzzles';

const BANKS = {
  streak: [streakQ, streakP], deep: [deepQ, deepP], atlas: [atlasQ, atlasP], sport: [sportQ, sportP],
  biz: [bizQ, bizP], script: [scriptQ, scriptP], quotes: [quotesQ, quotesP], sci: [sciQ, sciP],
  art: [artQ, artP], history: [historyQ, historyP], foodie: [foodieQ, foodieP], gram: [gramQ, gramP],
  vocab: [vocabQ, vocabP], spell: [spellQ, spellP], origin: [originQ, originP], idiom: [idiomQ, idiomP],
  orbit: [orbitQ, orbitP], bond: [bondQ, bondP], gene: [geneQ, geneP], pulse: [pulseQ, pulseP], eureka: [eurekaQ, eurekaP],
  blitz: [blitzQ, blitzP], blitzed: [blitzedQ, blitzedP], gap: [gapQ, gapP], series: [seriesQ, seriesP], back: [backQ, backP],
};
const MATH = new Set(['blitz', 'blitzed', 'gap', 'series', 'back']);

export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Math lanes come from each problem's operation (its `sig`), named for a reader.
const SERIES_LANE = {
  step: 'Steps', ar: 'Steps', down: 'Steps', big: 'Steps',
  geo: 'Doubling and Growing', dgeo: 'Doubling and Growing', grow: 'Doubling and Growing', halve: 'Doubling and Growing',
  sq: 'Squares and Cubes', cube: 'Squares and Cubes', sqdiff: 'Squares and Cubes', quad: 'Squares and Cubes',
  fib: 'Running Sums', trib: 'Running Sums', rec: 'Running Sums',
  alt: 'Two Patterns at Once', altop: 'Two Patterns at Once', inter: 'Two Patterns at Once',
};
function mathLane(bank, sig) {
  if (bank === 'series') return SERIES_LANE[sig] || 'Patterns';
  const s = String(sig || '');
  if (/^oo|paren|bracket/.test(s)) return 'Order of Operations';
  if (/^pct/.test(s)) return 'Percentages';
  if (/^(pow|sq|cube|root)/.test(s)) return 'Powers and Roots';
  const ops = (s.match(/add|sub|mul|div/gi) || []).map((x) => x.toLowerCase());
  if (new Set(ops).size > 1) return 'Mixed Operations';
  return { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division' }[ops[0]] || 'Mixed Operations';
}
function laneOf(bank, q, day) {
  if (MATH.has(bank)) return mathLane(bank, q.sig);
  if (bank === 'deep') return day.topic || 'Deep Cuts';
  const m = LANE_MAP[bank];
  if (m && m[q.cat]) return m[q.cat];
  return q.cat || 'Mixed';
}
const num = (x) => (typeof x === 'number' ? x.toLocaleString('en-US') : String(x));
// A math problem as a question: the prompt a reader needs, then the problem.
function mathItem(bank, q) {
  if (bank === 'back') { const target = String(q.q).replace(/^\?\s*=\s*/, ''); return { q: `Which one makes ${target}?`, p: null }; }
  if (bank === 'gap') return { q: q.q, p: 'Find the missing number' };
  if (bank === 'series') return { q: q.q, p: 'What comes next?' };
  return { q: `${q.q} = ?`, p: null };
}

// { [db]: { [topic]: [{ k, t, lane, tier, q, p, c, a, d }] } } for days before `today`, oldest first.
let cache = { day: null, pools: null };
function build(today) {
  const pools = {};
  for (const [db, cfg] of Object.entries(QDBS)) {
    const pool = {};
    for (const t of cfg.topics) {
      const out = [];
      const seen = new Set();
      for (const bank of t.banks) {
        const [Q, P] = BANKS[bank];
        const map = Q.QUESTION_MAP || Q.PROBLEM_MAP || Object.fromEntries((Q.QUESTIONS || Q.PROBLEMS || []).map((x) => [x.id, x]));
        for (const day of P.PUZZLES) {
          if (!(day.live < today)) continue;
          for (const id of day.qids || []) {
            const k = `${bank}:${id}`;
            if (seen.has(k)) continue;
            const q = map[id];
            if (!q || !Array.isArray(q.choices) || !Number.isInteger(q.correct)) continue;
            seen.add(k);
            const m = MATH.has(bank) ? mathItem(bank, q) : { q: q.q, p: null };
            out.push({ k, t: t.slug, lane: laneOf(bank, q, day), tier: q.tier || 3, q: m.q, ...(m.p ? { p: m.p } : {}), c: q.choices.map(num), a: q.correct, d: day.live });
          }
        }
      }
      pool[t.slug] = out;
    }
    pools[db] = pool;
  }
  return pools;
}
export function pastPool(db = 'trivia', today = etToday()) {
  if (cache.day !== today) cache = { day: today, pools: build(today) };
  return cache.pools[db] || {};
}

// Counts for the pages: { [topic]: { n, lanes: [[lane, n], ...] } }, lanes biggest first.
export function poolStats(db = 'trivia', today = etToday()) {
  const pool = pastPool(db, today);
  const out = {};
  for (const t of QDBS[db].topics) {
    const lanes = new Map();
    for (const x of pool[t.slug]) lanes.set(x.lane, (lanes.get(x.lane) || 0) + 1);
    out[t.slug] = { n: pool[t.slug].length, lanes: [...lanes.entries()].sort((a, b) => b[1] - a[1]) };
  }
  return out;
}

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// A playable set. `topic` 'mix' draws from every topic of the database; `lanes`
// narrows a topic; `level` 'ramp' (Mixed) climbs the five tiers in even steps,
// 'g' / 'm' / 't' hold one band. Same arguments, same set: the route caches by URL.
export function pickSet({ db = 'trivia', topic, lanes = [], level = 'ramp', n = 25, seed = 1, today = etToday() }) {
  const pool = pastPool(db, today);
  const rnd = rng(seed * 2654435761);
  let src;
  if (topic === 'mix') src = Object.values(pool).flat();
  else src = (pool[topic] || []).filter((x) => !lanes.length || lanes.includes(x.lane));
  if (!src.length) return [];
  const want = Math.max(1, Math.min(120, n | 0));
  if (DIFF_TIERS[level]) {
    const tiers = DIFF_TIERS[level];
    const hit = src.filter((x) => tiers.includes(x.tier));
    return shuffle(hit.length >= want ? hit.slice() : src.slice(), rnd).slice(0, want);
  }
  const byTier = [1, 2, 3, 4, 5].map((t) => shuffle(src.filter((x) => x.tier === t), rnd));
  const out = [];
  for (let i = 0; i < want; i++) {
    const t = Math.min(4, Math.floor((i * 5) / want));
    let pickFrom = byTier[t];
    if (!pickFrom.length) pickFrom = byTier.find((b) => b.length) || [];
    if (!pickFrom.length) break;
    out.push(pickFrom.pop());
  }
  return out;
}

// Questions by key, for retrying misses. Unknown or not-yet-run keys are dropped.
export function byKeys(db, keys, today = etToday()) {
  const pool = pastPool(db, today);
  const all = new Map(Object.values(pool).flat().map((x) => [x.k, x]));
  return keys.map((k) => all.get(k)).filter(Boolean);
}

// Sample questions with their answers for a topic's page: a stable pick that
// moves on once a week, spread over the lanes.
export function samples(db, topic, n = 12, today = etToday()) {
  const src = pastPool(db, today)[topic] || [];
  const week = Math.floor(Date.parse(today + 'T12:00:00Z') / (7 * 86400000));
  const rnd = rng(week * 97 + topic.length * 13);
  const lanes = new Map();
  for (const x of src) { if (!lanes.has(x.lane)) lanes.set(x.lane, []); lanes.get(x.lane).push(x); }
  const groups = [...lanes.values()].map((g) => shuffle(g.slice(), rnd));
  const out = [];
  for (let i = 0; out.length < n && i < n * 4; i++) {
    const g = groups[i % groups.length];
    if (g && g.length) out.push(g.pop());
  }
  return out.sort((a, b) => a.tier - b.tier);
}

// The topic cards the pages hand the client: no question text, only counts.
export function topicCards(db, stats) {
  return QDBS[db].topics.map((t) => ({ slug: t.slug, label: t.label, color: t.color, n: stats[t.slug].n, lanes: stats[t.slug].lanes, daily: t.daily || null }));
}
