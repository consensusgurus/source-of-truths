// THE PAST QUESTION LIBRARY, server only (owner, 2026-11-21). Every question
// or problem from the gauntlet banks that has ALREADY RUN as a daily (its day
// is before today, Eastern), grouped by each database's topics and lanes
// (lib/qdb.js). A question that has not run yet never leaves the server, so
// replaying the archive cannot spoil a coming day.
//
// Read by /api/trivia/set (the set a game plays, for all three databases) and
// the database pages (counts and sample questions with answers, for search).
// Was lib/trivia-library.js until the Math and English Databases joined.

import { QDBS, DIFF_TIERS, laneSlug, laneLabel, laneHasPage } from './qdb.js';
import { LANE_MAP, deepParent, DEEP_SCIENCE } from './trivia-topics.js';
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
import * as musicQ from '@/app/music/questions'; import * as musicP from '@/app/music/puzzles';
import * as booksQ from '@/app/books/questions'; import * as booksP from '@/app/books/puzzles';
import * as natureQ from '@/app/nature/questions'; import * as natureP from '@/app/nature/puzzles';
import * as techQ from '@/app/tech/questions'; import * as techP from '@/app/tech/puzzles';
import * as mythQ from '@/app/myth/questions'; import * as mythP from '@/app/myth/puzzles';
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
import * as hiredQ from '@/app/hired/questions'; import * as hiredP from '@/app/hired/puzzles';

const BANKS = {
  streak: [streakQ, streakP], deep: [deepQ, deepP], atlas: [atlasQ, atlasP], sport: [sportQ, sportP],
  biz: [bizQ, bizP], script: [scriptQ, scriptP], quotes: [quotesQ, quotesP], sci: [sciQ, sciP],
  art: [artQ, artP], history: [historyQ, historyP], foodie: [foodieQ, foodieP], music: [musicQ, musicP], books: [booksQ, booksP], nature: [natureQ, natureP], tech: [techQ, techP], myth: [mythQ, mythP], gram: [gramQ, gramP],
  vocab: [vocabQ, vocabP], spell: [spellQ, spellP], origin: [originQ, originP], idiom: [idiomQ, idiomP],
  orbit: [orbitQ, orbitP], bond: [bondQ, bondP], gene: [geneQ, geneP], pulse: [pulseQ, pulseP], eureka: [eurekaQ, eurekaP],
  hired: [hiredQ, hiredP],
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
function laneOf(bank, q, day, db) {
  if (MATH.has(bank)) return mathLane(bank, q.sig);
  if (bank === 'deep') return day.topic || 'Deep Cuts';
  // Hired: a field's subtopic is its lane. In the Science Database its chemistry
  // folds into Bond's two lanes so the topic keeps one set of subtopics.
  if (bank === 'hired') return db === 'science' ? (q.sub === 'Periodic Table' ? 'Elements' : 'Compounds & Reactions') : (q.sub || q.cat);
  // Trivia folds the science banks into Science's five lanes; the Science Database keeps their own.
  const m = db === 'trivia' ? LANE_MAP[bank] : null;
  if (m && m[q.cat]) return m[q.cat];
  return q.cat || 'Mixed';
}
const num = (x) => (typeof x === 'number' ? x.toLocaleString('en-US') : String(x));
// The lane a Deep subject takes under a parent topic.
export const deepLaneName = (subject, nativeLanes) => (nativeLanes.has(subject) ? `${subject}: Deep Cut` : subject);
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
            // A topic may take one field of a bank (the Careers topics, lib/qdb.js `only`).
            if (t.only && t.only[bank] && q.cat !== t.only[bank]) continue;
            seen.add(k);
            const m = MATH.has(bank) ? mathItem(bank, q) : { q: q.q, p: null };
            out.push({ k, t: t.slug, lane: laneOf(bank, q, day, db), tier: q.tier || 3, q: m.q, ...(m.p ? { p: m.p } : {}), c: q.choices.map(num), a: q.correct, d: day.live });
          }
        }
      }
      // DEEP SUBJECTS UNDER THEIR PARENT TOPIC (owner, 2026-11-23). A Deep day whose
      // subject maps here joins this topic as a subtopic named for the subject.
      // In Trivia the same question is already under Deep Cuts, so the copy carries
      // x: 1 and stays out of totals, mixes of everything and the printed samples;
      // the Science Database has no Deep Cuts, so there it is the only copy. Either
      // way the lane is `deep: 1`: it plays here, and its page stays under Deep Cuts.
      const parentOf = db === 'trivia' ? deepParent : db === 'science' ? (subject) => DEEP_SCIENCE[subject] || null : null;
      if (parentOf && !t.banks.includes('deep')) {
        const [Q, P] = BANKS.deep;
        const map = Q.QUESTION_MAP || Object.fromEntries((Q.QUESTIONS || []).map((x) => [x.id, x]));
        // A subject that shares its name with one of the topic's own lanes (Deep's
        // "Television" under Movies and TV) is told apart, so the two never merge.
        const native = new Set(out.map((x) => x.lane));
        for (const day of P.PUZZLES) {
          if (!(day.live < today) || !day.topic || parentOf(day.topic) !== t.slug) continue;
          const lane = deepLaneName(day.topic, native);
          for (const id of day.qids || []) {
            const k = `deep:${id}`;
            if (seen.has(k)) continue;
            const q = map[id];
            if (!q || !Array.isArray(q.choices) || !Number.isInteger(q.correct)) continue;
            seen.add(k);
            out.push({ k, t: t.slug, lane, tier: q.tier || 3, q: q.q, c: q.choices.map(num), a: q.correct, d: day.live, deep: 1, ...(db === 'trivia' ? { x: 1 } : {}) });
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

// Counts for the pages: { [topic]: { n, own, lanes: [[lane, n], ...], deep: [lane, ...] } }, lanes biggest first.
// `own` leaves out the Deep copies a topic shares with Deep Cuts (so a database's
// total counts each question once); `deep` names the lanes that are Deep subjects.
export function poolStats(db = 'trivia', today = etToday()) {
  const pool = pastPool(db, today);
  const out = {};
  for (const t of QDBS[db].topics) {
    const lanes = new Map();
    for (const x of pool[t.slug]) lanes.set(x.lane, (lanes.get(x.lane) || 0) + 1);
    out[t.slug] = { n: pool[t.slug].length, own: pool[t.slug].filter((x) => !x.x).length, lanes: [...lanes.entries()].sort((a, b) => b[1] - a[1]), deep: [...new Set(pool[t.slug].filter((x) => x.deep).map((x) => x.lane))] };
  }
  return out;
}

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// A playable set (owner, 2026-11-21). `topic` 'mix' draws from every topic of the
// database; `lanes` narrows a topic (several lanes mix). `level` 'ramp' (Mixed)
// climbs the five tiers in even steps, 'g' / 'm' / 't' hold one band.
//
// OLDEST FIRST, UNSEEN FIRST (owner: "make the oldest questions first so that
// users dont play gauntlet and then immediately get served the same questions in
// the database"). `seen` is the keys this browser has already answered here; they
// go to the back. The rest is dealt oldest day first, round robin across the
// topics (a mix of everything) or the lanes (one topic) so a mix stays mixed, with a seeded shuffle only to
// break ties inside one day. Yesterday's gauntlet questions come last.
export function pickSet({ db = 'trivia', topic, topics = [], lanes = [], level = 'ramp', n = 25, seed = 1, today = etToday(), seen = null }) {
  const pool = pastPool(db, today);
  const rnd = rng(seed * 2654435761);
  let src;
  // `topics` narrows a mix to the picked few (owner: "a way to select multiple topics").
  // A mix deals each question once: a Deep copy filed under a parent topic sits out
  // whenever Deep Cuts itself is in the mix (always, in a mix of everything).
  if (topic === 'mix') {
    const withDeepCuts = !topics.length || topics.includes('deep-cuts');
    src = (topics.length ? topics.map((t) => pool[t] || []) : Object.values(pool)).flat().filter((x) => !(x.x && withDeepCuts));
  }
  else src = (pool[topic] || []).filter((x) => !lanes.length || lanes.includes(x.lane));
  if (!src.length) return [];
  const want = Math.max(1, Math.min(120, n | 0));
  const isSeen = (x) => !!(seen && seen.has(x.k));
  // Deal a list oldest first, unseen before seen, round robin over the groups.
  const deal = (list) => {
    const tie = new Map(list.map((x) => [x.k, rnd()]));
    const by = (a, b) => (isSeen(a) - isSeen(b)) || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || (tie.get(a.k) - tie.get(b.k));
    const groups = new Map();
    for (const x of list.slice().sort(by)) { const g = topic === 'mix' ? x.t : x.lane; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(x); }
    const gs = shuffle([...groups.values()], rnd);
    const out = [];
    // Each round takes the best remaining head of every group, best first.
    while (gs.some((g) => g.length)) {
      const heads = gs.filter((g) => g.length).sort((a, b) => by(a[0], b[0]));
      for (const g of heads) out.push(g.shift());
    }
    return out;
  };
  if (DIFF_TIERS[level]) {
    const tiers = DIFF_TIERS[level];
    const hit = src.filter((x) => tiers.includes(x.tier));
    const got = deal(hit.length >= want ? hit : src).slice(0, want);
    return shuffle(got, rnd);
  }
  const byTier = [1, 2, 3, 4, 5].map((t) => deal(src.filter((x) => x.tier === t)));
  const out = [];
  for (let i = 0; i < want; i++) {
    const t = Math.min(4, Math.floor((i * 5) / want));
    let pickFrom = byTier[t];
    if (!pickFrom.length) pickFrom = byTier.find((b) => b.length) || [];
    if (!pickFrom.length) break;
    out.push(pickFrom.shift());
  }
  return out;
}

// Questions by key, for retrying misses. Unknown or not-yet-run keys are dropped.
export function byKeys(db, keys, today = etToday()) {
  const pool = pastPool(db, today);
  const all = new Map(Object.values(pool).flat().map((x) => [x.k, x]));
  return keys.map((k) => all.get(k)).filter(Boolean);
}

// The printed questions of a topic's page (or, with `lane`, a subtopic's page),
// spread over the lanes. MOSTLY STABLE, PARTLY WEEKLY (2026-11-22): the first
// n - fresh come from a fixed seed, so a page keeps the questions it ranks for,
// and the last `fresh` move on once a week, so a crawler still finds it changed.
export function samples(db, topic, n = 12, today = etToday(), { lane = null, fresh = Math.min(10, Math.floor(n / 5)) } = {}) {
  let src = pastPool(db, today)[topic] || [];
  // A topic's own page prints its own questions; the Deep subjects filed under it print on their Deep Cuts pages.
  // (A topic whose own bank has not run a day yet has nothing else, so it prints those.)
  if (lane) src = src.filter((x) => x.lane === lane); else if (src.some((x) => !x.deep)) src = src.filter((x) => !x.deep);
  const week = Math.floor(Date.parse(today + 'T12:00:00Z') / (7 * 86400000));
  // Each question gets a fixed rank from its own key (and a salt), so a pick is
  // the lowest ranks of each lane: new questions joining the pool barely move it.
  const rank = (k, salt) => { let h = 2166136261 ^ salt; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pick = (list, want, salt) => {
    const lanes = new Map();
    for (const x of list) { if (!lanes.has(x.lane)) lanes.set(x.lane, []); lanes.get(x.lane).push(x); }
    const groups = [...lanes.keys()].sort().map((l) => lanes.get(l).slice().sort((p, q) => rank(q.k, salt) - rank(p.k, salt)));
    const out = [];
    for (let i = 0; out.length < want && groups.some((g) => g.length); i++) {
      const g = groups[i % groups.length];
      if (g.length) out.push(g.pop());
    }
    return out;
  };
  const stable = pick(src, Math.max(0, n - fresh), 7);
  const got = new Set(stable.map((x) => x.k));
  const weekly = pick(src.filter((x) => !got.has(x.k)), fresh, week);
  return [...stable, ...weekly].sort((a, b) => a.tier - b.tier);
}

// Every subtopic page of a database: [{ topic, lane, slug, n, href }], in the
// topics' order, a topic's lanes biggest first. A lane earns a page by size and
// by not repeating another page (lib/qdb.js laneHasPage).
export function lanePages(db, today = etToday()) {
  const cfg = QDBS[db];
  const stats = poolStats(db, today);
  const out = [];
  for (const t of cfg.topics) {
    const used = new Set();
    const deepLanes = new Set(stats[t.slug].deep);
    for (const [lane, n] of stats[t.slug].lanes) {
      const slug = laneSlug(lane);
      // A Deep subject filed under a parent topic has its one page under Deep Cuts.
      if (!slug || used.has(slug) || deepLanes.has(lane) || !laneHasPage(db, t.slug, lane, n)) continue;
      used.add(slug);
      out.push({ topic: t.slug, lane, slug, n, label: laneLabel(lane), href: `${cfg.base}/${t.slug}/${slug}` });
    }
  }
  return out;
}

// The topic cards the pages hand the client: no question text, only counts.
export function topicCards(db, stats) {
  return QDBS[db].topics.map((t) => ({ slug: t.slug, label: t.label, color: t.color, n: stats[t.slug].n, own: stats[t.slug].own, lanes: stats[t.slug].lanes, daily: t.daily || null }));
}
