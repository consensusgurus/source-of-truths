#!/usr/bin/env node
// Generator for the Bracket bank (app/bracket/puzzles.js). Appends new boards after
// the last existing one and never touches a frozen board.
//
//   node scripts/gen-bracket.mjs              # dry run: prints the new boards
//   node scripts/gen-bracket.mjs --write      # appends them to app/bracket/puzzles.js
//
// Written 2026-09-23 for the Oct 14 to Nov 30 extension (the bank had no committed
// generator). Deterministic: each board is seeded from its own num, so rerunning
// reproduces the same boards and a new segment never replays a frozen one.
//
// WHAT MAKES A BOARD (the verifier, scripts/verify-bracket.mjs, is the spec):
//   - 16 items, 32 on a real Sunday, one metric, values all distinct
//   - every first-round matchup is a rout (relative gap >= 0.35, or >= 8 degrees
//     of latitude), and the true final is a coin flip (<= 0.22, or <= 6 degrees).
//     Built by sorting the chosen items best first and pairing rank i with rank
//     i + n/2, which is the most permissive pairing for a "rout" floor; the two
//     best items go into opposite halves so they meet in the final.
//   - the tree is then scrambled by random sibling swaps at every level, which
//     keeps who-meets-whom and moves the champion's slot around.
//
// CONTENT RULES (owner, restated for this extension):
//   - every value is a FROZEN, citable measurement. No active player's career
//     total, no current ranking, no live capacity, no population estimate. The
//     people boards use the 2020 US Census, a fixed count; the sport boards use
//     RETIRED players' final totals only, so none of them needs an `asOf`.
//   - schedule spacing, per the bank header: the same topic never lands within
//     four days of itself, and a broad family (area, height, length, latitude,
//     box office, people, sport) never lands two days running. Checked below,
//     including across the seam with the frozen boards.
//   - an item set may overlap an earlier board of the same topic by at most half.
//   - direction varies: some boards ask which is SMALLER / FARTHER SOUTH / FEWER.
//   - NO DISPUTED ORDER (fact-check 2026-09-24): every pair of values on a board
//     differs by at least the topic's `margin`, and pool items whose figure
//     depends on a definition (river systems, city vs county, total vs land
//     area) are either removed or the basis is stated in the question.
import fs from 'node:fs';
import * as P from './gen-bracket-pools.mjs';
import { PUZZLES as FROZEN } from '../app/bracket/puzzles.js';

const END = '2026-11-30';
const BANK = new URL('../app/bracket/puzzles.js', import.meta.url);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TOPICS = {
  latN:      { fam: 'lat',    pool: P.CITY_LAT,        unit: 'lat',    dir: 'max', metric: 'Which is FARTHER NORTH?', short: 'Northern wins', alias: ['Which is FARTHER NORTH?'] , margin: 0.5 },
  latS:      { fam: 'lat',    pool: P.CITY_LAT,        unit: 'lat',    dir: 'min', metric: 'Which is FARTHER SOUTH?', short: 'Southern wins' , margin: 0.5 },
  country:   { fam: 'area',   pool: P.COUNTRY_AREA,    unit: 'km2',    dir: 'max', metric: 'Which COUNTRY is bigger?', short: 'Bigger country wins' , margin: 0.01 },
  small:     { fam: 'area',   pool: P.SMALL_COUNTRY_AREA, unit: 'km2', dir: 'min', metric: 'Which COUNTRY is SMALLER?', short: 'Smaller country wins' , margin: 0.01 },
  island:    { fam: 'area',   pool: P.ISLAND_AREA,     unit: 'km2',    dir: 'max', metric: 'Which ISLAND is bigger?', short: 'Bigger island wins' , margin: 0.02 },
  lake:      { fam: 'area',   pool: P.LAKE_AREA,       unit: 'km2',    dir: 'max', metric: 'Which LAKE is bigger?', short: 'Bigger lake wins' , margin: 0.03 },
  stateArea: { fam: 'area',   pool: P.STATE_AREA,      unit: 'km2',    dir: 'max', metric: 'Which STATE is bigger by total area (land and water)?', short: 'Bigger state wins', margin: 0.01 },
  tower:     { fam: 'height', pool: P.TOWER,           unit: 'm',      dir: 'max', metric: 'Which TOWER is taller?', short: 'Taller tower wins' , margin: 0.01 },
  taller:    { fam: 'height', pool: dedupe([...P.TALLER_BANK, ...P.VOLCANO]), unit: 'm', dir: 'max', metric: 'Which is TALLER?', short: 'Taller wins' , margin: 0.01 },
  volcano:   { fam: 'height', pool: P.VOLCANO,         unit: 'm',      dir: 'max', metric: 'Which VOLCANO rises higher?', short: 'Higher volcano wins' , margin: 0.01 },
  highpoint: { fam: 'height', pool: P.HIGHPOINT,       unit: 'm',      dir: 'max', metric: 'Which STATE HIGH POINT is higher?', short: 'Higher summit wins' , margin: 0.01 },
  bridge:    { fam: 'length', pool: P.BRIDGE_SPAN,     unit: 'm',      dir: 'max', metric: 'Which BRIDGE has the longer main span?', short: 'Longer span wins' , margin: 0.02 },
  river:     { fam: 'length', pool: P.RIVER,           unit: 'km',     dir: 'max', metric: 'Which RIVER is longer?', short: 'Longer river wins', alias: ['Which is LONGER?'] , margin: 0.05 },
  box:       { fam: 'box',    pool: P.BOX_OFFICE,      unit: 'usdm',   dir: 'max', metric: 'Which grossed MORE worldwide?', short: 'Bigger box office wins' , margin: 0.02 },
  statePop:  { fam: 'people', pool: P.STATE_POP_2020,  unit: 'people', dir: 'max', metric: 'Which STATE had more people in the 2020 Census?', short: 'More people wins' , margin: 0.005 },
  stateFew:  { fam: 'people', pool: P.STATE_POP_2020,  unit: 'people', dir: 'min', metric: 'Which STATE had FEWER people in the 2020 Census?', short: 'Fewer people wins' , margin: 0.005 },
  cityPop:   { fam: 'people', pool: P.CITY_POP_2020,   unit: 'people', dir: 'max', metric: 'Which US CITY had more people in the 2020 Census?', short: 'More people wins' , margin: 0.01 },
  hr:        { fam: 'sport',  pool: P.RETIRED_HR,      unit: 'hr',     dir: 'max', metric: 'Which RETIRED hitter had MORE career home runs?', short: 'More home runs wins', alias: ['Which hitter had MORE career home runs?'] },
  k:         { fam: 'sport',  pool: P.RETIRED_K,       unit: 'k',      dir: 'max', metric: 'Which RETIRED pitcher had MORE career strikeouts?', short: 'More strikeouts wins', alias: ['Which pitcher had MORE career strikeouts?'] },
  yards:     { fam: 'sport',  pool: P.RETIRED_YARDS,   unit: 'yards',  dir: 'max', metric: 'Which RETIRED quarterback threw for MORE career yards?', short: 'More passing yards wins', alias: ['Which quarterback threw for MORE career yards?'] },
};

// One topic per day from 2026-10-14. Sundays (Oct 18, 25, Nov 1, 8, 15, 22, 29)
// take a 32-item board, so they draw only on pools deep enough for one.
const SCHEDULE = [
  // from 2026-10-14
  'tower', 'k', 'river', 'box',
  // from 2026-10-18
  'statePop', 'lake', 'yards', 'river', 'small', 'hr', 'lake',
  // from 2026-10-25
  'latN', 'statePop', 'volcano', 'k', 'island', 'bridge', 'taller',
  // from 2026-11-01
  'hr', 'country', 'box', 'highpoint', 'latN', 'yards', 'taller',
  // from 2026-11-08
  'stateArea', 'stateFew', 'latN', 'volcano', 'bridge', 'yards', 'island',
  // from 2026-11-15
  'taller', 'k', 'cityPop', 'volcano', 'small', 'highpoint', 'hr',
  // from 2026-11-22
  'country', 'latS', 'river', 'box', 'stateArea', 'statePop', 'country',
  // from 2026-11-29
  'latS', 'lake',
];

function dedupe(pairs) { const s = new Set(); return pairs.filter(([n]) => (s.has(n) ? false : s.add(n))); }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const addDays = (iso, k) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);

const rout = (unit, a, b) => unit === 'lat' ? Math.abs(a - b) >= 8 : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1) >= 0.35;
const flip = (unit, a, b) => unit === 'lat' ? Math.abs(a - b) <= 6 : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1) <= 0.22;

function topicOfFrozen(p) {
  for (const [id, t] of Object.entries(TOPICS)) if (t.metric === p.metric || (t.alias || []).includes(p.metric)) return id;
  return null;
}
const famOfFrozen = (p) => ({ km2: 'area', m: 'height', km: 'length', lat: 'lat', usdm: 'box', people: 'people' }[p.unit] || 'sport');

// ---- schedule checks -------------------------------------------------------
const last = FROZEN[FROZEN.length - 1];
const start = addDays(last.live, 1);
const days = dayDiff(start, END) + 1;
if (SCHEDULE.length !== days) throw new Error(`schedule has ${SCHEDULE.length} topics, need ${days}`);
const timeline = FROZEN.map((p) => ({ live: p.live, topic: topicOfFrozen(p) || 'frozen:' + p.metric, fam: famOfFrozen(p) }));
SCHEDULE.forEach((id, k) => {
  const t = TOPICS[id]; if (!t) throw new Error('unknown topic ' + id);
  const live = addDays(start, k);
  const sunday = new Date(live + 'T00:00:00Z').getUTCDay() === 0;
  const prev = timeline[timeline.length - 1];
  if (prev.fam === t.fam) throw new Error(`${live}: family ${t.fam} two days running`);
  for (const q of timeline) if (q.topic === id && dayDiff(q.live, live) <= 4) throw new Error(`${live}: ${id} within four days of ${q.live}`);
  timeline.push({ live, topic: id, fam: t.fam, sunday });
});

// ---- boards ------------------------------------------------------------------
const history = {};            // topic -> array of Set(names), frozen boards included
for (const p of FROZEN) { const id = topicOfFrozen(p); if (id) (history[id] ||= []).push(new Set(p.items.map((x) => x.name))); }
const uses = {};               // name -> times used in this new segment, to spread items

function build(id, num, n) {
  const t = TOPICS[id];
  const rnd = mulberry32(0xB2AC7E7 ^ Math.imul(num, 2654435761));
  const better = (a, b) => (t.dir === 'max' ? a[1] - b[1] : b[1] - a[1]);
  const prior = history[id] || [];
  let best = null;
  for (let attempt = 0; attempt < 200000 && !(best && attempt > 400); attempt++) {
    // weighted sample without replacement, favoring items used least in this segment
    const cand = t.pool.map((x) => ({ x, key: Math.pow(rnd(), 1 / (1 / (1 + 2 * (uses[x[0]] || 0)))) }));
    cand.sort((a, b) => b.key - a.key);
    const pick = []; const vals = new Set();
    const near = (a, b) => (t.unit === 'lat' ? Math.abs(a - b) < t.margin : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) < t.margin);
    for (const { x } of cand) {
      if (vals.has(x[1])) continue;
      if (t.margin && pick.some((y) => near(x[1], y[1]))) continue; // skip, never sample a near-tie
      pick.push(x); vals.add(x[1]); if (pick.length === n) break;
    }
    if (pick.length < n) throw new Error(`${id}: pool too small`);
    pick.sort((a, b) => -better(a, b));
    const h = n / 2;
    let ok = flip(t.unit, pick[0][1], pick[1][1]);
    // No near-ties anywhere on the board: sources disagree at small margins
    // (fact-check 2026-09-24), so every pair must differ by at least `margin`
    // (degrees for latitude, a relative gap otherwise).
    for (let i = 1; ok && t.margin && i < n; i++) {
      const a = pick[i - 1][1], b = pick[i][1];
      ok = t.unit === 'lat' ? Math.abs(a - b) >= t.margin : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) >= t.margin;
    }
    for (let i = 0; ok && i < h; i++) ok = rout(t.unit, pick[i][1], pick[i + h][1]);
    if (!ok) continue;
    const names = new Set(pick.map((x) => x[0]));
    const overlap = Math.max(0, ...prior.map((s) => [...names].filter((nm) => s.has(nm)).length));
    if (overlap > n / 2) continue;
    const score = overlap * 3 + pick.reduce((s, x) => s + (uses[x[0]] || 0), 0);
    if (!best || score < best.score) best = { pick, score, names };
  }
  if (!best) throw new Error(`${id} #${num}: no valid field found`);
  const { pick } = best; const h = n / 2;
  // pairs: pair i = (rank i, rank i + h). Pair 0 holds the champion, pair 1 the runner-up.
  const pairs = []; for (let i = 0; i < h; i++) pairs.push([pick[i], pick[i + h]]);
  const rest = pairs.slice(2);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const half = h / 2;
  const left = [pairs[0], ...rest.slice(0, half - 1)];
  const right = [pairs[1], ...rest.slice(half - 1)];
  let order = [...left, ...right].flat();
  // scramble: random sibling swaps at every level of the tree
  for (let size = 1; size < n; size *= 2) {
    const next = [];
    for (let k = 0; k < n; k += 2 * size) {
      const a = order.slice(k, k + size), b = order.slice(k + size, k + 2 * size);
      next.push(...(rnd() < 0.5 ? [...a, ...b] : [...b, ...a]));
    }
    order = next;
  }
  for (const x of pick) uses[x[0]] = (uses[x[0]] || 0) + 1;
  (history[id] ||= []).push(best.names);
  return order;
}

const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const out = [];
timeline.slice(FROZEN.length).forEach((d, k) => {
  const num = last.num + 1 + k;
  const t = TOPICS[d.topic];
  const n = d.sunday ? 32 : 16;
  const items = build(d.topic, num, n);
  const [y, m, dd] = d.live.split('-').map(Number);
  const lines = [];
  lines.push('  {');
  lines.push(`    num: ${num}, quizId: 'bracket-${m}-${dd}-${String(y).slice(2)}', live: '${d.live}', dateLabel: '${MONTHS[m - 1]} ${dd}, ${y}', sunday: ${d.sunday},`);
  lines.push(`    metric: ${q(t.metric)}, metricShort: ${q(t.short)}, unit: '${t.unit}', dir: '${t.dir}',`);
  lines.push('    items: [');
  for (let i = 0; i < n; i += 2) lines.push(`      { name: ${q(items[i][0])}, value: ${items[i][1]} }, { name: ${q(items[i + 1][0])}, value: ${items[i + 1][1]} },`);
  lines.push('    ],');
  lines.push('  },');
  out.push(lines.join('\n'));
});

const text = out.join('\n');
if (process.argv.includes('--write')) {
  const bank = fs.readFileSync(BANK, 'utf8');
  const close = bank.lastIndexOf('];');
  if (!/\},\s*$/.test(bank.slice(0, close))) throw new Error('bank does not end with a closed board');
  fs.writeFileSync(BANK, bank.slice(0, close) + text + '\n' + bank.slice(close));
  console.log(`gen-bracket: appended ${out.length} boards (${start} to ${END})`);
} else {
  console.log(text);
  console.error(`gen-bracket: ${out.length} boards (${start} to ${END}), dry run`);
}
