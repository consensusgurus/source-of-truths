// THE PAST TRIVIA LIBRARY (owner, 2026-11-21), server only. Every question from
// the twenty-one gauntlet banks that has ALREADY RUN as a daily (its day is
// before today, Eastern), grouped by the portal's topics and lanes
// (lib/trivia-topics.js). A question that has not run yet never leaves the
// server, so replaying the archive cannot spoil a coming day.
//
// Read by /api/trivia/set (the questions a practice game plays) and the
// /trivia-questions pages (counts and sample questions for search).

import { TRIVIA_TOPICS, LANE_MAP } from './trivia-topics.js';
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

const BANKS = {
  streak: [streakQ, streakP], deep: [deepQ, deepP], atlas: [atlasQ, atlasP], sport: [sportQ, sportP],
  biz: [bizQ, bizP], script: [scriptQ, scriptP], quotes: [quotesQ, quotesP], sci: [sciQ, sciP],
  art: [artQ, artP], history: [historyQ, historyP], foodie: [foodieQ, foodieP], gram: [gramQ, gramP],
  vocab: [vocabQ, vocabP], spell: [spellQ, spellP], origin: [originQ, originP], idiom: [idiomQ, idiomP],
  orbit: [orbitQ, orbitP], bond: [bondQ, bondP], gene: [geneQ, geneP], pulse: [pulseQ, pulseP], eureka: [eurekaQ, eurekaP],
};

export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function laneOf(bank, q, day) {
  if (bank === 'deep') return day.topic || 'Deep Cuts';
  const m = LANE_MAP[bank];
  if (typeof m === 'string') return m.slice(1);
  if (m && m[q.cat]) return m[q.cat];
  return q.cat || 'Mixed';
}

// { [topic]: [{ k, lane, tier, q, c, a, d }] } for days before `today`, oldest first.
let cache = { day: null, pool: null };
export function pastPool(today = etToday()) {
  if (cache.day === today) return cache.pool;
  const pool = {};
  for (const t of TRIVIA_TOPICS) {
    const out = [];
    const seen = new Set();
    for (const bank of t.banks) {
      const [Q, P] = BANKS[bank];
      const map = Q.QUESTION_MAP || Object.fromEntries((Q.QUESTIONS || []).map((x) => [x.id, x]));
      for (const day of P.PUZZLES) {
        if (!(day.live < today)) continue;
        for (const id of day.qids || []) {
          const k = `${bank}:${id}`;
          if (seen.has(k)) continue;
          const q = map[id];
          if (!q || !Array.isArray(q.choices) || !Number.isInteger(q.correct)) continue;
          seen.add(k);
          out.push({ k, t: t.slug, lane: laneOf(bank, q, day), tier: q.tier || 3, q: q.q, c: q.choices.map((x) => (typeof x === 'number' ? x.toLocaleString('en-US') : String(x))), a: q.correct, d: day.live });
        }
      }
    }
    pool[t.slug] = out;
  }
  cache = { day: today, pool };
  return pool;
}

// Counts for the pages: { [topic]: { n, lanes: [[lane, n], ...] } }, lanes biggest first.
export function poolStats(today = etToday()) {
  const pool = pastPool(today);
  const out = {};
  for (const t of TRIVIA_TOPICS) {
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

// A playable set. `topic` 'mix' draws from every topic; `lanes` narrows a topic;
// `level` 'ramp' climbs gimme to expert in five even steps, or a tier 1..5.
// Same arguments, same set: the route caches by URL.
export function pickSet({ topic, lanes = [], level = 'ramp', n = 25, seed = 1, today = etToday() }) {
  const pool = pastPool(today);
  const rnd = rng(seed * 2654435761);
  let src;
  if (topic === 'mix') src = Object.values(pool).flat();
  else src = (pool[topic] || []).filter((x) => !lanes.length || lanes.includes(x.lane));
  if (!src.length) return [];
  const want = Math.max(1, Math.min(120, n | 0));
  if (level !== 'ramp') {
    const t = Number(level);
    const hit = src.filter((x) => x.tier === t);
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
export function byKeys(keys, today = etToday()) {
  const pool = pastPool(today);
  const all = new Map(Object.values(pool).flat().map((x) => [x.k, x]));
  return keys.map((k) => all.get(k)).filter(Boolean);
}

// Sample questions with their answers for a topic's page: a stable pick that
// moves on once a week, spread over the lanes.
export function samples(topic, n = 12, today = etToday()) {
  const src = pastPool(today)[topic] || [];
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
export function topicCards(stats) {
  return TRIVIA_TOPICS.map((t) => ({ slug: t.slug, label: t.label, icon: t.icon, color: t.color, n: stats[t.slug].n, lanes: stats[t.slug].lanes }));
}
