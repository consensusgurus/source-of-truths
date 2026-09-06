#!/usr/bin/env node
// verify-niche.mjs — the checker for the Niche bank (app/niche/puzzles.js)
// and the facts tables it stands on (app/niche/facts*.js).
//
// Per the daily-puzzle authoring standard in CLAUDE.md it RECOMPUTES rather
// than trusts: every cell of every banked board is re-derived and re-counted
// here, and the full-board distinct-answer requirement is re-proven with this
// file's OWN matching implementation, not the generator's.
//
// One deliberate sharing: the attribute TESTS and member tables in
// app/niche/facts.js are imported rather than restated. They are not a solver
// to be independently derived — they ARE the game's judge, the exact code the
// client scores picks with — so what this checker proves is that the BANK is
// sound against that judge, plus a battery of internal-consistency checks on
// the tables themselves (fixed memberships like the 27 EU states or the 13
// colonies are asserted by count, so a slipped flag fails loudly).
//
// Usage: node scripts/verify-niche.mjs
import { PUZZLES } from '../app/niche/puzzles.js';
import { UNIVERSES, UNIVERSE_MAP, universeForDate, attrById, cellMembers, normAnswer } from '../app/niche/facts.js';
import { COUNTRIES, G20, ARAB_LEAGUE, EURO, SPANISH, FRENCH, MONARCHY, OECD, OPEC, EQUATOR, BIGGEST, PORTUGUESE } from '../app/niche/facts-countries.js';
import { MUSICIANS, HALFTIME, ROTY, BEST_NEW } from '../app/niche/facts-musicians.js';

const fails = [];
const warns = [];
const F = (m) => fails.push(m);
const W = (m) => warns.push(m);

// ── 1. the schedule: consecutive days, ids, labels, weekday-universe map ────
const DAY_U = ['countries', 'states', 'animals', 'movies', 'tv', 'teams', 'musicians'];
function isoPlus(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const seenIds = new Set();
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.live})`;
  if (p.num !== PUZZLES[0].num + i) F(`${tag}: num out of sequence`);
  if (i > 0 && p.live !== isoPlus(PUZZLES[i - 1].live, 1)) F(`${tag}: not the day after ${PUZZLES[i - 1].live}`);
  const [y, m, d] = p.live.split('-').map(Number);
  const wantId = `niche-${m}-${d}-${String(y).slice(2)}`;
  if (p.quizId !== wantId) F(`${tag}: quizId ${p.quizId}, expected ${wantId}`);
  if (seenIds.has(p.quizId)) F(`${tag}: duplicate quizId`);
  seenIds.add(p.quizId);
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (p.universe !== DAY_U[dow]) F(`${tag}: universe ${p.universe}, expected ${DAY_U[dow]} for that weekday`);
  if (universeForDate(p.live).id !== p.universe) F(`${tag}: universeForDate disagrees with the stored universe`);
  if (!!p.sunday !== (dow === 0)) F(`${tag}: sunday flag is ${!!p.sunday} on weekday ${dow}`);
  const size = p.sunday ? 4 : 3;
  if (p.rows.length !== size || p.cols.length !== size) F(`${tag}: ${p.rows.length}x${p.cols.length} board, expected ${size}x${size}`);
  const wantLabel = new Date(`${p.live}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  if (p.dateLabel !== wantLabel) F(`${tag}: dateLabel "${p.dateLabel}", expected "${wantLabel}"`);
});

// ── 2. every board re-derived: attrs resolve, cells clear the floor, a full
//       distinct-answer fill exists (own matching code) ─────────────────────
const MIN_CELL = 3;
const TIGHT = 8;

// Independent bipartite matching: BFS-layered augmenting paths over the
// cell -> candidate-name graph. Written fresh here on purpose.
function fullFillExists(cellLists) {
  const owner = new Map(); // name -> cell index
  const augment = (cell, banned) => {
    for (const name of cellLists[cell]) {
      if (banned.has(name)) continue;
      banned.add(name);
      const holder = owner.get(name);
      if (holder === undefined || augment(holder, banned)) {
        owner.set(name, cell);
        return true;
      }
    }
    return false;
  };
  for (let i = 0; i < cellLists.length; i++) {
    if (!augment(i, new Set())) return false;
  }
  return true;
}

for (const p of PUZZLES) {
  const tag = `#${p.num} (${p.live})`;
  const u = UNIVERSE_MAP[p.universe];
  if (!u) { F(`${tag}: unknown universe ${p.universe}`); continue; }
  const all = [...p.rows, ...p.cols];
  if (new Set(all).size !== all.length) F(`${tag}: an attribute repeats within the board`);
  let bad = false;
  for (const id of all) {
    if (!attrById(u, id)) { F(`${tag}: attribute "${id}" does not resolve in ${u.id}`); bad = true; }
  }
  if (bad) continue;
  const size = p.rows.length;
  const cellLists = [];
  let tight = 0;
  for (const r of p.rows) {
    for (const c of p.cols) {
      const names = cellMembers(u, r, c).map((m) => m.t);
      cellLists.push(names);
      if (names.length < MIN_CELL) F(`${tag}: cell "${attrById(u, r).label}" x "${attrById(u, c).label}" has only ${names.length} valid answers (floor ${MIN_CELL})`);
      if (names.length <= TIGHT) tight++;
    }
  }
  const wantTight = size === 4 ? 2 : 1;
  if (tight < wantTight) F(`${tag}: only ${tight} tight cell(s), wanted ${wantTight}`);
  if (!fullFillExists(cellLists)) F(`${tag}: no full set of DISTINCT answers exists for this board`);
}

// ── 3. bank-wide variety: caps, echo, near-duplicates, letter fills ─────────
const ATTR_CAP = 4;
const MAX_ECHO = 2;
const MAX_OVERLAP = 4;
// A letter attribute is any attribute about the first letter of the name: the
// generated n-/cap- fills plus "Name starts with a vowel", added 2026-09-06,
// which is the same gimmick and so counts against the same cap.
const isLetter = (id) => /^(n|cap)-[a-z]$/.test(id) || id === 'vowel';
// No board may pair two attributes that are exact complements over the
// universe: together they only split the universe in half. Scoped from the
// first board authored under the rule, because #17 (2026-09-05) shipped a
// band / solo pair and the past is frozen.
const COMPLEMENT_FROM = '2026-10-05';
const memberSet = (u, id) => new Set(u.members.filter((m) => attrById(u, id).test(m)).map((m) => m.t));
const complementary = (u, a, b) => {
  const A = memberSet(u, a);
  const B = memberSet(u, b);
  if (A.size + B.size !== u.members.length) return false;
  for (const n of A) if (B.has(n)) return false;
  return true;
};
const usage = {};
const history = {};
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.live})`;
  const all = [...p.rows, ...p.cols];
  const letters = all.filter(isLetter).length;
  const maxLetters = i < 7 ? 1 : 2;
  if (letters > maxLetters) F(`${tag}: ${letters} letter attributes, cap is ${maxLetters}${i < 7 ? ' in launch week' : ''}`);
  const hist = history[p.universe] = history[p.universe] || [];
  if (hist.length) {
    const prev = hist[hist.length - 1];
    const echo = all.filter((id) => prev.has(id)).length;
    if (echo > MAX_ECHO) F(`${tag}: ${echo} attributes echo the previous ${p.universe} board (cap ${MAX_ECHO})`);
  }
  for (const h of hist) {
    const overlap = all.filter((id) => h.has(id)).length;
    if (overlap > MAX_OVERLAP) F(`${tag}: shares ${overlap} attributes with an earlier ${p.universe} board (cap ${MAX_OVERLAP})`);
  }
  if (p.live >= COMPLEMENT_FROM) {
    const u = UNIVERSE_MAP[p.universe];
    for (let x = 0; x < all.length; x++) {
      for (let y = x + 1; y < all.length; y++) {
        if (complementary(u, all[x], all[y])) F(`${tag}: "${all[x]}" and "${all[y]}" are exact complements on one board`);
      }
    }
  }
  hist.push(new Set(all));
  for (const id of all) {
    const k = `${p.universe}:${id}`;
    usage[k] = (usage[k] || 0) + 1;
    if (usage[k] > ATTR_CAP) F(`${tag}: "${id}" appears ${usage[k]} times in ${p.universe} boards (cap ${ATTR_CAP})`);
  }
});

// ── 4. the facts tables: internal consistency + fixed-membership counts ─────
for (const u of UNIVERSES) {
  const names = new Set();
  for (const m of u.members) {
    const n = normAnswer(m.t);
    if (names.has(n)) F(`${u.id}: duplicate member "${m.t}"`);
    names.add(n);
  }
  // alias collisions across members are allowed on purpose (two Cardinals);
  // the type-ahead disambiguates by selection. But an alias identical to
  // ANOTHER member's canonical name is a trap — flag it.
  const canon = new Set([...u.members].map((m) => normAnswer(m.t)));
  for (const m of u.members) {
    for (const a of m.a || []) {
      if (canon.has(normAnswer(a)) && normAnswer(a) !== normAnswer(m.t)) {
        F(`${u.id}: "${m.t}" carries alias "${a}", which is another member's exact name`);
      }
    }
  }
  for (const attr of u.attrs) {
    const n = u.members.filter((m) => attr.test(m)).length;
    if (n === 0) F(`${u.id}: attribute "${attr.id}" matches nobody`);
  }
}
const count = (uid, attrId) => {
  const u = UNIVERSE_MAP[uid];
  const a = attrById(u, attrId);
  return u.members.filter((m) => a.test(m)).length;
};
const FIXED = [
  ['countries', 'eu', 27, 'EU members'],
  ['countries', 'pop100', 16, 'countries over 100M'],
  ['states', 'col', 13, 'thirteen colonies'],
  ['states', 'can', 13, 'states bordering Canada'],
  ['states', 'mex', 4, 'states bordering Mexico'],
  ['states', 'gulf', 5, 'Gulf states'],
  ['states', 'lakes', 8, 'Great Lakes states'],
  ['states', 'riv', 10, 'Mississippi River states'],
  ['countries', 'nato', 32, 'NATO members'],
  ['countries', 'cw', 56, 'Commonwealth members'],
  ['countries', 'wc', 8, 'World Cup winning nations'],
  ['teams', 'bird', 12, 'teams named after a bird'],
  // Attributes added 2026-09-06 when the pool was grown for the run to
  // 2026-11-30. Each is a closed roster or a closed count, so it is asserted
  // by size here rather than eyeballed: a slipped flag or a mistyped name in
  // one of the facts-countries.js lists fails loudly instead of quietly
  // shrinking a cell.
  ['countries', 'g20', 19, 'G20 sovereign members'],
  ['countries', 'arab', 21, 'Arab League members in this table'],
  ['countries', 'euro', 26, 'euro-using countries'],
  ['countries', 'lang-es', 20, 'Spanish-official countries'],
  ['countries', 'lang-fr', 29, 'French-official countries'],
  ['states', 'atl', 14, 'states on the Atlantic'],
  ['states', 'pres', 21, 'presidential birth states'],
  ['states', 'caplg', 17, 'states whose capital is their largest city'],
  ['states', 'park', 30, 'states with a national park'],
  ['states', 'a10', 10, 'ten largest states'],
  ['states', 's10', 10, 'ten smallest states'],
  ['states', 'reg-ne', 9, 'Census Northeast states'],
  ['states', 'reg-mw', 12, 'Census Midwest states'],
  ['states', 'reg-s', 16, 'Census South states'],
  ['states', 'reg-w', 13, 'Census West states'],
  ['states', 'east', 26, 'states east of the Mississippi'],
  ['teams', 'mt', 11, 'Mountain time zone teams'],
  ['musicians', 'halftime', 44, 'Super Bowl halftime performers'],
  ['musicians', 'roty', 28, 'Grammy Record of the Year winners'],
  ['musicians', 'bna', 17, 'Grammy Best New Artist winners'],
  ['countries', 'lang-pt', 9, 'Portuguese-official countries'],
  ['countries', 'mon', 43, 'monarchies'],
  ['countries', 'oecd', 38, 'OECD members'],
  ['countries', 'opec', 12, 'OPEC members'],
  ['countries', 'eq', 13, 'countries on the Equator'],
  ['countries', 'big10', 10, 'ten largest countries'],
];
for (const [uid, attrId, want, what] of FIXED) {
  const got = count(uid, attrId);
  if (got !== want) F(`${uid}: ${got} ${what}, expected ${want}`);
}
if (UNIVERSE_MAP.states.members.length !== 50) F(`states: ${UNIVERSE_MAP.states.members.length} members, expected 50`);
// The named country rosters in facts-countries.js are matched by NAME, so one
// typo silently drops a member and no count above would notice if the typo
// merely moved the total. Assert every name resolves.
{
  const known = new Set(COUNTRIES.map((m) => m.t));
  for (const [name, list] of [['G20', G20], ['ARAB_LEAGUE', ARAB_LEAGUE], ['EURO', EURO], ['SPANISH', SPANISH], ['FRENCH', FRENCH], ['PORTUGUESE', PORTUGUESE], ['MONARCHY', MONARCHY], ['OECD', OECD], ['OPEC', OPEC], ['EQUATOR', EQUATOR], ['BIGGEST', BIGGEST]]) {
    for (const c of list) if (!known.has(c)) F(`countries: ${name} names "${c}", which is not a member`);
  }
  const acts = new Set(MUSICIANS.map((m) => m.t));
  for (const [name, list] of [['HALFTIME', HALFTIME], ['ROTY', ROTY], ['BEST_NEW', BEST_NEW]]) {
    for (const c of list) if (!acts.has(c)) F(`musicians: ${name} names "${c}", which is not a member`);
  }
}
// The Census regions are the Bureau's own four-way split, so they must
// partition all fifty states: exhaustive and disjoint.
{
  const regs = ['reg-ne', 'reg-mw', 'reg-s', 'reg-w'];
  for (const m of UNIVERSE_MAP.states.members) {
    const hit = regs.filter((id) => attrById(UNIVERSE_MAP.states, id).test(m)).length;
    if (hit !== 1) F(`states: "${m.t}" is in ${hit} Census regions, expected exactly 1`);
  }
  // Every US team sits in exactly one region and every Canadian team in none.
  for (const m of UNIVERSE_MAP.teams.members) {
    const hit = regs.filter((id) => attrById(UNIVERSE_MAP.teams, id).test(m)).length;
    if (hit !== (m.can ? 0 : 1)) F(`teams: "${m.t}" is in ${hit} Census regions, expected ${m.can ? 0 : 1}`);
  }
  // A team plays in ONE time zone: the Mountain set must not overlap the other
  // three, which the zone walk above already proves disjoint.
  for (const m of UNIVERSE_MAP.teams.members) {
    const zones = ['et', 'ct', 'pac', 'mt'].filter((id) => attrById(UNIVERSE_MAP.teams, id).test(m)).length;
    if (zones > 1) F(`teams: "${m.t}" answers ${zones} time-zone attributes`);
  }
}
// A solo act is judged male, female or neither, never two of them, and never
// none: "male" is defined by omission, so an unflagged non-binary act would be
// judged male, and this is the check that stops that.
for (const m of UNIVERSE_MAP.musicians.members) {
  if (m.fem && m.nb) F(`musicians: "${m.t}" is flagged both fem and nb`);
  if (m.band && (m.fem || m.nb)) F(`musicians: "${m.t}" is a band carrying a solo-artist flag`);
  const solo = ['male', 'fem'].filter((id) => attrById(UNIVERSE_MAP.musicians, id).test(m)).length;
  if (!m.band && solo !== (m.nb ? 0 : 1)) F(`musicians: solo act "${m.t}" answers ${solo} of male/fem`);
  if (m.band && solo !== 0) F(`musicians: band "${m.t}" answers ${solo} of male/fem`);
}
// A bird is a creature: bird must be a strict subset of animal, or a board
// pairing the two would judge the same team two ways.
for (const m of UNIVERSE_MAP.teams.members) {
  if (m.bird && !m.animal) F(`teams: "${m.t}" is flagged bird but not animal`);
  const zones = ['CT,DC,DE,FL,GA,IN,MA,MD,ME,MI,NC,NH,NJ,NY,OH,ON,PA,QC,RI,SC,VA,VT,WV',
    'AL,AR,IA,IL,KS,LA,MB,MN,MO,MS,ND,NE,OK,SD,TN,TX,WI',
    'BC,CA,NV,OR,WA'].filter((z) => z.split(',').includes(m.st)).length;
  if (zones > 1) F(`teams: "${m.t}" (${m.st}) is in ${zones} time zones`);
}
// A band is not a solo act, and rap and country are the act's own genre, so
// neither may land on a group flagged as a solo female artist.
for (const m of UNIVERSE_MAP.musicians.members) {
  if (m.band && m.fem) F(`musicians: "${m.t}" is a band and also flagged a solo female artist`);
}
// A show has ONE first home: the three-way net / cable / str split must not
// double-count, or the same show answers a cell two different ways.
for (const m of UNIVERSE_MAP.tv.members) {
  const homes = ['net', 'cable', 'str'].filter((k) => m[k]);
  if (homes.length > 1) F(`tv: "${m.t}" is flagged ${homes.join(' and ')}; a show has one first home`);
}
for (const [lg, want] of [['nfl', 32], ['nba', 30], ['mlb', 30], ['nhl', 32]]) {
  const got = UNIVERSE_MAP.teams.members.filter((m) => m.lg === lg).length;
  if (got !== want) F(`teams: ${got} ${lg} teams, expected ${want}`);
}
for (const m of UNIVERSE_MAP.countries.members) {
  if (!Array.isArray(m.c) || !m.c.length) F(`countries: "${m.t}" has no continent`);
  if (m.ll && m.isl) F(`countries: "${m.t}" is both landlocked and an island nation`);
  if (!m.cap || (Array.isArray(m.cap) && !m.cap.length)) F(`countries: "${m.t}" has no capital`);
}

// ── 5. reader-facing copy: US spellings, no em dashes in labels ─────────────
const EM = /[—–]/;
const BRIT = /\b(colour|favourite|theatre|honour|neighbour|grey\b|centre|litre|metre|travelled|defence|offence|licence)\b/i;
for (const u of UNIVERSES) {
  for (const attr of u.attrs) {
    if (EM.test(attr.label)) F(`${u.id}: label "${attr.label}" carries an em or en dash`);
    if (BRIT.test(attr.label)) F(`${u.id}: label "${attr.label}" carries a British spelling`);
  }
  for (const m of u.members) {
    if (BRIT.test(m.t) && u.id !== 'movies' && u.id !== 'tv' && u.id !== 'musicians') W(`${u.id}: member "${m.t}" looks British-spelled`);
  }
}

// ── 6. runway ───────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const last = PUZZLES[PUZZLES.length - 1].live;
const daysLeft = Math.round((new Date(`${last}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000);
if (daysLeft < 0) F(`the bank ran OUT on ${last}`);
else if (daysLeft < 14) W(`only ${daysLeft} day(s) of runway left (bank ends ${last}) — extend with scripts/gen-niche.mjs`);

// ── report ──────────────────────────────────────────────────────────────────
console.log(`niche: ${PUZZLES.length} boards, ${PUZZLES[0].live} through ${last}; ${PUZZLES.filter((p) => p.sunday).length} Sunday Editions`);
for (const w of warns) console.log(`… WARN  ${w}`);
for (const f of fails) console.log(`✗ FAIL  ${f}`);
console.log(fails.length ? `\n${fails.length} failure(s).` : `\nOK — ${warns.length} warning(s).`);
process.exit(fails.length ? 1 : 0);
