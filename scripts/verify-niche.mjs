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
import { UNIVERSES, UNIVERSE_MAP, universeForDate, attrById, cellMembers, normAnswer, readingsOf } from '../app/niche/facts.js';
import { COUNTRIES, G20, ARAB_LEAGUE, EURO, SPANISH, FRENCH, MONARCHY, OECD, OPEC, EQUATOR, BIGGEST, PORTUGUESE, SOVIET, MEDITERRANEAN, ASEAN, WINTER_OLY, LEFT_DRIVE, WC_HOSTS, SCHENGEN, G7 } from '../app/niche/facts-countries.js';
import { MUSICIANS, HALFTIME, ROTY, BEST_NEW, CANADIAN } from '../app/niche/facts-musicians.js';

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
      // ONE BORDER READING PER ANSWER (2026-11-12, dec-g review): when row and
      // column are both border clues, every accepted country must satisfy BOTH on
      // a single neighbor set (narrow Span graph, or the wide overseas/Palestine
      // set). An answer that passes only by mixing readings fails the board.
      const ra = attrById(u, r), ca = attrById(u, c);
      if (ra.br && ca.br) {
        for (const t of names) {
          if (!readingsOf(t).some((nb) => ra.br(nb) && ca.br(nb))) F(`${tag}: cell "${ra.label}" x "${ca.label}" accepts ${t} only under mixed border readings`);
        }
      }
      if (names.length < MIN_CELL) F(`${tag}: cell "${attrById(u, r).label}" x "${attrById(u, c).label}" has only ${names.length} valid answers (floor ${MIN_CELL})`);
      if (names.length <= TIGHT) tight++;
    }
  }
  // TWIN CELLS (2026-11-12): at most two pairs of identical cells sharing a row
  // or a column, from 2026-12-01 (mirrors gen-niche MAX_TWINS).
  if (p.live >= '2026-12-01') {
    const key = (i) => cellLists[i].slice().sort().join('|');
    let twins = 0;
    for (let a = 0; a < cellLists.length; a++) for (let b = a + 1; b < cellLists.length; b++) {
      const sameLine = Math.floor(a / p.cols.length) === Math.floor(b / p.cols.length) || a % p.cols.length === b % p.cols.length;
      if (sameLine && key(a) === key(b)) twins++;
    }
    if (twins > 2) F(`${tag}: ${twins} pairs of identical cells share a row or column (at most 2)`);
  }
  const wantTight = size === 4 ? 2 : 1;
  if (tight < wantTight) F(`${tag}: only ${tight} tight cell(s), wanted ${wantTight}`);
  if (!fullFillExists(cellLists)) F(`${tag}: no full set of DISTINCT answers exists for this board`);
}

// Every border clue carries a per-reading predicate, or the check above is blind.
for (const a of UNIVERSE_MAP.countries.attrs) {
  if (/^(Borders |Has no land border)/.test(a.label) && typeof a.br !== 'function') F(`countries: border attribute "${a.id}" has no per-reading predicate (br)`);
}

// ── 3. bank-wide variety: caps, echo, near-duplicates, letter fills ─────────
const ATTR_CAP = 4;
const MAX_ECHO = 2;
const MAX_OVERLAP = 4;
// A letter attribute is any attribute about the first letter of the name: the
// generated n-/cap- fills plus "Name starts with a vowel", added 2026-09-06,
// which is the same gimmick and so counts against the same cap.
// Name-shape attributes (letter counts, last letter, double letters; 2026-11-12):
// with the letter fills, at most half of a board from GIMMICK_FROM, so a board
// stays trivia rather than a word game.
const NAME_SHAPE = new Set(['short5', 'mid67', 'long8', 'long9', 'long12', 'long14', 'short8', 'endvowel', 'dbl', 'dblw',
  'the', 'one', 'multi', 'w2', 'w3', 'w4', 'colon', 'num', 'hasz', 'endsa']);
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
// NESTED CELLS (added 2026-11-12, lane-d restock). A cell whose row attribute
// implies its column attribute, or the reverse (Invertebrate x Cold-blooded,
// Released in 2010 or later x Released in 2000 or later), is really one
// attribute: the second label adds nothing. Growing the pool with broad
// complements made these likely, so from NESTED_FROM no row x column pair may
// have one member set contained in the other. Earlier boards are frozen.
const NESTED_FROM = '2026-12-01';
const nested = (u, a, b) => {
  const A = memberSet(u, a), B = memberSet(u, b);
  const [S, L] = A.size <= B.size ? [A, B] : [B, A];
  // NEAR-NESTED (late review, same date): 90% or more of the smaller attribute
  // inside the larger one is refused too (Mammal x Does not lay eggs: 77 of 78).
  let hit = 0;
  for (const n of S) if (L.has(n)) hit++;
  return hit / S.size >= 0.85;
};
const usage = {};
const history = {};
// capKey: 'dblw' (word-by-word double letter, from 2026-12-01) and the retired
// 'dbl' are one attribute for the cap, echo and overlap rules.
const keyOf = (u, id) => (u.attrs.find((a) => a.id === id)?.capKey || id);
// BROAD (2026-12-01, lane-d review): an attribute true of 70% or more of its
// universe; at most one per board from NESTED_FROM.
const BROAD = 0.7;
const cellSeen = new Map();
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.live})`;
  const all = [...p.rows, ...p.cols];
  const U = UNIVERSE_MAP[p.universe];
  const allK = all.map((id) => keyOf(U, id));
  for (const id of all) { const a = U.attrs.find((x) => x.id === id); if (a?.retiredFrom && p.live >= a.retiredFrom) F(`${tag}: "${id}" is retired from ${a.retiredFrom}`); }
  const letters = all.filter(isLetter).length;
  const maxLetters = i < 7 ? 1 : 2;
  if (letters > maxLetters) F(`${tag}: ${letters} letter attributes, cap is ${maxLetters}${i < 7 ? ' in launch week' : ''}`);
  if (p.live >= '2026-12-01') { const g = all.filter((id) => isLetter(id) || NAME_SHAPE.has(id)).length; if (g > all.length / 2) F(`${tag}: ${g} of ${all.length} attributes are letter or name-shape gimmicks (at most half)`); }
  if (p.live >= '2026-12-01') {
    for (let x = 0; x < all.length; x++) for (let y = x + 1; y < all.length; y++) {
      const A = memberSet(U, all[x]), B = memberSet(U, all[y]);
      let both = 0; for (const n of A) if (B.has(n)) both++;
      if (both <= 0.1 * Math.min(A.size, B.size) && A.size + B.size - both >= 0.9 * U.members.length) F(`${tag}: "${all[x]}" and "${all[y]}" are near-complements`);
    }
    for (const r of p.rows) for (const c of p.cols) {
      const k = `${p.universe}|${[r, c].sort().join('|')}`;
      if (cellSeen.has(k) && (Date.parse(p.live) - Date.parse(cellSeen.get(k))) / 864e5 < 15) F(`${tag}: cell "${r}" x "${c}" repeats ${cellSeen.get(k)} within 15 days`);
    }
  }
  for (const r of p.rows) for (const c of p.cols) { cellSeen.set(`${p.universe}|${[r, c].sort().join('|')}`, p.live); }
  if (p.live >= '2026-12-01' && all.filter((id) => /^b[0-5]$/.test(id)).length > 1) F(`${tag}: more than one border-count attribute (a cell between two counts exists only through the overseas-border reading)`);
  const hist = history[p.universe] = history[p.universe] || [];
  if (hist.length) {
    const prev = hist[hist.length - 1];
    const echo = allK.filter((id) => prev.has(id)).length;
    if (echo > MAX_ECHO) F(`${tag}: ${echo} attributes echo the previous ${p.universe} board (cap ${MAX_ECHO})`);
  }
  for (const h of hist) {
    const overlap = allK.filter((id) => h.has(id)).length;
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
  if (p.live >= NESTED_FROM) {
    const u = UNIVERSE_MAP[p.universe];
    for (let x = 0; x < all.length; x++) for (let y = x + 1; y < all.length; y++) {
      if (nested(u, all[x], all[y])) F(`${tag}: "${all[x]}" and "${all[y]}" are nested (one attribute implies the other, or nearly: 85% or more)`);
    }
    const broad = all.filter((id) => memberSet(u, id).size / u.members.length >= BROAD);
    if (broad.length > 1) F(`${tag}: ${broad.length} broad attributes (${broad.join(', ')}), at most one`);
  }
  hist.push(new Set(allK));
  for (const id of allK) {
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
  ['countries', 'euro', 27, 'euro-using countries'],
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
  ['musicians', 'halftime', 45, 'Super Bowl halftime performers'],
  ['musicians', 'roty', 29, 'Grammy Record of the Year winners'],
  ['musicians', 'bna', 17, 'Grammy Best New Artist winners'],
  ['countries', 'lang-pt', 9, 'Portuguese-official countries'],
  ['countries', 'mon', 43, 'monarchies'],
  ['countries', 'oecd', 38, 'OECD members'],
  ['countries', 'opec', 12, 'OPEC members'],
  ['countries', 'eq', 13, 'countries on the Equator'],
  ['countries', 'big10', 10, 'ten largest countries'],
  // Added 2026-11-12 (lane-d restock pool growth).
  ['countries', 'ussr', 15, 'former Soviet republics'],
  ['countries', 'med', 21, 'Mediterranean coast countries in this table'],
  ['countries', 'asean', 11, 'ASEAN members'],
  ['countries', 'woly', 13, 'Winter Olympics hosts'],
  ['countries', 'b-austria', 8, 'countries bordering Austria'],
  ['countries', 'b-turkey', 8, 'countries bordering Turkey'],
  ['countries', 'b-tanzania', 8, 'countries bordering Tanzania'],
  ['countries', 'b-drc', 9, 'countries bordering DR Congo'],
  ['countries', 'left', 54, 'left-driving countries'],
  ['countries', 'wchost', 19, "men's World Cup hosts"],
  ['countries', 'schengen', 32, 'Schengen members plus the three de facto microstates'],
  ['countries', 'g7', 7, 'G7 members'],
  ['musicians', 'ca', 9, 'Canadian acts'],
  ['animals', 'bigcat', 6, 'big cats'],
  ['animals', 'primate', 6, 'primates'],
  ['animals', 'raptor', 5, 'birds of prey'],
  ['animals', 'rodent', 8, 'rodents'],
  ['animals', 'insect', 11, 'insects'],
  ['animals', 'flightless', 4, 'flightless birds'],
  ['states', 'nba', 21, 'states with an NBA team'],
  ['states', 'nhl', 18, 'states with an NHL team'],
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
  for (const [name, list] of [['G20', G20], ['ARAB_LEAGUE', ARAB_LEAGUE], ['EURO', EURO], ['SPANISH', SPANISH], ['FRENCH', FRENCH], ['PORTUGUESE', PORTUGUESE], ['MONARCHY', MONARCHY], ['OECD', OECD], ['OPEC', OPEC], ['EQUATOR', EQUATOR], ['BIGGEST', BIGGEST], ['SOVIET', SOVIET], ['MEDITERRANEAN', MEDITERRANEAN], ['ASEAN', ASEAN], ['WINTER_OLY', WINTER_OLY], ['LEFT_DRIVE', LEFT_DRIVE], ['WC_HOSTS', WC_HOSTS], ['SCHENGEN', SCHENGEN], ['G7', G7]]) {
    for (const c of list) if (!known.has(c)) F(`countries: ${name} names "${c}", which is not a member`);
  }
  const acts = new Set(MUSICIANS.map((m) => m.t));
  for (const [name, list] of [['HALFTIME', HALFTIME], ['ROTY', ROTY], ['BEST_NEW', BEST_NEW], ['CANADIAN', CANADIAN]]) {
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
