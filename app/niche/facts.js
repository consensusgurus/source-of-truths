// Niche — the shared facts engine. One universe per day of the week, a closed
// member list per universe, and a pool of BROAD attributes per universe. A
// puzzle is three row attributes and three column attributes (four each on
// Sunday); a cell is satisfied by any member passing both its row and column
// attribute, each member usable once per board.
//
// This file is the single source of truth for what counts: the client
// validates picks with it, scripts/gen-niche.mjs builds boards from it, and
// scripts/verify-niche.mjs re-derives every cell from it. The facts tables it
// reads are authored under the GENEROUS-MATCH principle (see each table's
// header): where a fact has two defensible readings, the data says yes to
// both, because a false accept costs a shrug and a false reject costs the
// player a guess.
//
// It ships to the client on purpose. Nothing here is a spoiler: there is no
// answer key, only the public facts every valid answer is judged by.
// EXTENSIONS REQUIRED on these relative imports, like lib/daily-games.js:
// scripts/gen-niche.mjs and scripts/verify-niche.mjs import this file under
// plain node, where ESM does no extension guessing. Do not drop them.
import { PAIRS } from '../span/borders.js';
import { COUNTRIES, G20, ARAB_LEAGUE, EURO, SPANISH, FRENCH, MONARCHY, OECD, OPEC, EQUATOR, BIGGEST, PORTUGUESE, SOVIET, MEDITERRANEAN, ASEAN, WINTER_OLY, LEFT_DRIVE, WC_HOSTS, SCHENGEN, G7 } from './facts-countries.js';
import { STATES } from './facts-states.js';
import { ANIMALS } from './facts-animals.js';
import { MOVIES } from './facts-movies.js';
import { TVSHOWS } from './facts-tv.js';
import { MUSICIANS, HALFTIME, ROTY, BEST_NEW, CANADIAN } from './facts-musicians.js';
import { TEAMS } from './facts-teams.js';

// ── name normalization (matching is by SELECTION from the type-ahead, so this
// only has to make search forgiving, never to disambiguate) ──────────────────
export function normAnswer(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Land borders, symmetrized from Span's verified graph.
const ADJ = (() => {
  const m = {};
  for (const [a, b] of PAIRS) {
    (m[a] = m[a] || new Set()).add(b);
    (m[b] = m[b] || new Set()).add(a);
  }
  return m;
})();
const borders = (name) => ADJ[name] || new Set();
// OVERSEAS AND EXCLAVE LAND BORDERS (2026-11-12, late review, generous match).
// Span's graph leaves these out on purpose, but a player who counts them is right
// on a defensible reading: Spain meets Morocco at Ceuta and Melilla and the UK at
// Gibraltar, France meets the Netherlands on Saint Martin and Brazil and Suriname
// in French Guiana. Count and named-border attributes accept either reading.
const EXTRA_BORDERS = (() => {
  const m = {};
  for (const [a, b] of [['Spain', 'Morocco'], ['Spain', 'United Kingdom'], ['Cyprus', 'United Kingdom'], ['France', 'Netherlands'], ['France', 'Brazil'], ['France', 'Suriname']]) {
    (m[a] = m[a] || new Set()).add(b); (m[b] = m[b] || new Set()).add(a);
  }
  return m;
})();
const bordersWide = (name) => new Set([...borders(name), ...(EXTRA_BORDERS[name] || [])]);
// Palestine sits out of the table (matching Span), so Egypt (Gaza), Israel and
// Jordan count it as one more neighbor on the wide reading.
const PALESTINE_NEIGHBORS = new Set(['Egypt', 'Israel', 'Jordan']);
// ONE READING PER ANSWER (2026-11-12, dec-g review). A country has a narrow
// reading (Span's graph) and, where they differ, a wide one (overseas and exclave
// borders, plus Palestine). Every border attribute is a predicate on ONE neighbor
// set (br), a single border attribute accepts either reading, and a cell whose row
// and column are both border attributes accepts a country only when a single
// reading satisfies both (pairFits). So Netherlands and Suriname no longer pass
// "Borders exactly two countries" x "Borders France" by counting French overseas
// land for one clue and not the other.
const readingsOf = (name) => {
  const narrow = borders(name);
  const wide = bordersWide(name);
  if (PALESTINE_NEIGHBORS.has(name)) wide.add('Palestine');
  return wide.size === narrow.size ? [narrow] : [narrow, wide];
};
const bAttr = (id, label, w, br) => ({ id, label, w, br, test: (m) => readingsOf(m.t).some(br) });
const bNamed = (id, country, w = 2) => bAttr(id, `Borders ${country === 'Democratic Republic of the Congo' ? 'DR Congo' : country}`, w, (nb) => nb.has(country));
// Does m fit both clues on ONE border reading? Non-border clues read as usual.
export function pairFits(ra, ca, m) {
  if (!ra.test(m) || !ca.test(m)) return false;
  if (!ra.br || !ca.br) return true;
  return readingsOf(m.t).some((nb) => ra.br(nb) && ca.br(nb));
}
export { readingsOf };

const strip = (t) => String(t).replace(/^The /, '');
// Words as a player counts them: an ampersand is the word it stands for (Law &
// Order, Deadpool & Wolverine are three words), and an apostrophe, a period or
// an asterisk never splits a word (Schindler's List and Ocean's Eleven are two,
// E.T. and M*A*S*H are one).
const words = (t) => normAnswer(String(t).replace(/&/g, ' and ').replace(/['\u2019.*]/g, '')).split(' ').filter(Boolean);
// Word counts accept a hyphenated compound read either way (2026-11-12, late
// review): E.T. the Extra-Terrestrial is three words or four, Spider-Man one or two.
const wordCounts = (t) => [words(t).length, words(String(t).replace(/-/g, '')).length];
const wc = (t, f) => wordCounts(t).some(f);
const NUM_WORDS = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|twenty|fifty|hundred|thousand|million)\b/;
const hasNumber = (t) => /\d/.test(t) || NUM_WORDS.test(normAnswer(t));
const hasDouble = (t) => /([a-z])\1/i.test(String(t).replace(/[^A-Za-z]/g, ''));
const capList = (m) => (Array.isArray(m.cap) ? m.cap : [m.cap]).filter(Boolean);
// Word count for a place name: spaces and hyphens break a word, an apostrophe
// does not, so Porto-Novo and Saint John's are two words and N'Djamena is one.
const placeWords = (t) => String(t).trim().split(/[\s-]+/).filter(Boolean).length;
// First letter is a vowel, ignoring a leading "The" the same way the letter
// attributes do.
const startsVowel = (t) => /^[aeiou]/i.test(strip(t));

// The Census Bureau's four US regions, keyed by postal code. Every state
// carries its own `reg`; this map is for the TEAMS universe, which stores a
// state code rather than a state, and adds DC (which the Bureau puts in the
// South) for the three Washington franchises. Canadian provinces are in no
// region, so a Canadian team answers none of the four.
const US_REGION = (() => {
  const m = {};
  const put = (r, codes) => { for (const c of codes.split(',')) m[c] = r; };
  put('ne', 'CT,ME,MA,NH,RI,VT,NJ,NY,PA');
  put('mw', 'IL,IN,MI,OH,WI,IA,KS,MN,MO,NE,ND,SD');
  put('s', 'DE,DC,FL,GA,MD,NC,SC,VA,WV,AL,KY,MS,TN,AR,LA,OK,TX');
  put('w', 'AZ,CO,ID,MT,NV,NM,UT,WY,AK,CA,HI,OR,WA');
  return m;
})();

// Letter attributes are generated from a template against real coverage, so
// only letters with enough members ever reach a board (gen + verify both
// enforce the cell floor anyway; MIN_LETTER keeps the pool sensible).
const MIN_LETTER = 6;
function letterAttrs(members, id, labelFor, getter) {
  const seen = {};
  for (const m of members) {
    for (const L of new Set(getter(m).map((x) => strip(x).charAt(0).toUpperCase()).filter((ch) => /[A-Z]/.test(ch)))) {
      seen[L] = (seen[L] || 0) + 1;
    }
  }
  return Object.keys(seen)
    .filter((L) => seen[L] >= MIN_LETTER)
    .sort()
    .map((L) => ({
      id: `${id}-${L.toLowerCase()}`,
      label: labelFor(L),
      test: (m) => getter(m).some((x) => strip(x).charAt(0).toUpperCase() === L),
    }));
}

// ── the seven universes ─────────────────────────────────────────────────────
// Each: { id, name, noun, members, attrs }. Attribute `w` is a pick weight for
// the generator (broad, famous facts carry more weight than letter fills).
const U_COUNTRIES = {
  id: 'countries',
  name: 'Countries',
  noun: 'country',
  members: COUNTRIES,
  attrs: [
    { id: 'cont-eu', label: 'In Europe', w: 3, test: (m) => m.c.includes('eu') },
    { id: 'cont-af', label: 'In Africa', w: 3, test: (m) => m.c.includes('af') },
    { id: 'cont-as', label: 'In Asia', w: 3, test: (m) => m.c.includes('as') },
    { id: 'cont-na', label: 'In North or Central America', w: 3, test: (m) => m.c.includes('na') },
    { id: 'cont-sa', label: 'In South America', w: 3, test: (m) => m.c.includes('sa') },
    { id: 'cont-oc', label: 'In Oceania', w: 2, test: (m) => m.c.includes('oc') },
    { id: 'll', label: 'Landlocked', w: 3, test: (m) => !!m.ll },
    { id: 'isl', label: 'An island nation', w: 3, test: (m) => !!m.isl },
    { id: 'pop100', label: 'Population over 100 million', w: 3, test: (m) => m.pop === 100 },
    { id: 'tiny', label: 'Population under 1 million', w: 2, test: (m) => m.pop === -1 },
    { id: 'eu', label: 'In the European Union', w: 3, test: (m) => !!m.eu },
    { id: 'oly', label: 'Has hosted a Summer Olympics', w: 2, test: (m) => !!m.oly },
    { id: 'nato', label: 'In NATO', w: 3, test: (m) => !!m.nato },
    { id: 'cw', label: 'In the Commonwealth', w: 3, test: (m) => !!m.cw },
    { id: 'wc', label: "Has won the men's soccer World Cup", w: 2, test: (m) => !!m.wc },
    { id: 'south', label: 'Capital in the Southern Hemisphere', w: 2, test: (m) => !!m.sh },
    bNamed('b-russia', 'Russia'),
    bNamed('b-china', 'China'),
    bNamed('b-brazil', 'Brazil'),
    bNamed('b-germany', 'Germany'),
    bNamed('b-france', 'France'),
    bNamed('b-india', 'India'),
    bAttr('b5', 'Borders five or more countries', 2, (nb) => { const n = nb.size; return n >= 5; }),
    { id: 'hasz', label: 'Name contains a Z', w: 1, test: (m) => /z/i.test(m.t) },
    { id: 'multi', label: 'Name has more than one word', w: 1, test: (m) => wc(m.t, (n) => n > 1) },
    { id: 'endsa', label: 'Name ends in A', w: 2, test: (m) => /a$/i.test(m.t) },
    { id: 'cap2', label: 'Capital city name has more than one word', w: 2, test: (m) => capList(m).some((c) => placeWords(c) > 1) },
    { id: 'coastal', label: 'Has a sea coast', w: 2, test: (m) => !m.ll },
    { id: 'north', label: 'Capital in the Northern Hemisphere', w: 2, test: (m) => !m.sh },
    bAttr('b0', 'Has no land border', 2, (nb) => { const n = nb.size; return n === 0; }),
    bAttr('b1', 'Borders exactly one country', 2, (nb) => { const n = nb.size; return n === 1; }),
    { id: 'g20', label: 'In the G20', w: 2, test: (m) => G20.has(m.t) },
    { id: 'arab', label: 'In the Arab League', w: 2, test: (m) => ARAB_LEAGUE.has(m.t) },
    { id: 'euro', label: 'Uses the euro', w: 2, test: (m) => EURO.has(m.t) },
    { id: 'lang-es', label: 'Spanish is an official language', w: 2, test: (m) => SPANISH.has(m.t) },
    { id: 'lang-fr', label: 'French is an official language', w: 2, test: (m) => FRENCH.has(m.t) },
    { id: 'lang-pt', label: 'Portuguese is an official language', w: 2, test: (m) => PORTUGUESE.has(m.t) },
    { id: 'mon', label: 'A monarchy', w: 3, test: (m) => MONARCHY.has(m.t) },
    { id: 'oecd', label: 'In the OECD', w: 3, test: (m) => OECD.has(m.t) },
    { id: 'opec', label: 'In OPEC', w: 2, test: (m) => OPEC.has(m.t) },
    { id: 'eq', label: 'The Equator runs through it', w: 2, test: (m) => EQUATOR.has(m.t) },
    { id: 'big10', label: 'One of the ten largest countries', w: 2, test: (m) => BIGGEST.has(m.t) },
    // Added 2026-11-12 (lane-d restock): the Sunday 4x4 had used the pool to its
    // cap. Closed rosters, asserted by size and by name in verify-niche.mjs;
    // the four border attributes derive from the same Span graph as the rest.
    { id: 'ussr', label: 'A former Soviet republic', w: 2, test: (m) => SOVIET.has(m.t) },
    { id: 'med', label: 'Has a Mediterranean Sea coast', w: 2, test: (m) => MEDITERRANEAN.has(m.t) },
    { id: 'asean', label: 'In ASEAN', w: 2, test: (m) => ASEAN.has(m.t) },
    { id: 'woly', label: 'Has hosted a Winter Olympics', w: 2, test: (m) => WINTER_OLY.has(m.t) },
    bNamed('b-austria', 'Austria'),
    bNamed('b-turkey', 'Turkey'),
    bNamed('b-tanzania', 'Tanzania'),
    bNamed('b-drc', 'Democratic Republic of the Congo'),
    { id: 'left', label: 'Drives on the left', w: 3, test: (m) => LEFT_DRIVE.has(m.t) },
    { id: 'wchost', label: "Has hosted the men's soccer World Cup", w: 2, test: (m) => WC_HOSTS.has(m.t) },
    { id: 'schengen', label: 'In the Schengen Area', w: 2, test: (m) => SCHENGEN.has(m.t) },
    { id: 'g7', label: 'In the G7', w: 2, test: (m) => G7.has(m.t) },
    bAttr('b3', 'Borders three or more countries', 3, (nb) => { const n = nb.size; return n >= 3; }),
    bAttr('b4', 'Borders four or more countries', 2, (nb) => { const n = nb.size; return n >= 4; }),
    bAttr('b2', 'Borders exactly two countries', 2, (nb) => { const n = nb.size; return n === 2; }),
    { id: 'long9', label: 'Name of nine letters or more', w: 1, test: (m) => m.t.replace(/[^A-Za-z]/g, '').length >= 9 },
    { id: 'right', label: 'Drives on the right', w: 2, test: (m) => !LEFT_DRIVE.has(m.t) },
    { id: 'noneu', label: 'Not in the European Union', w: 1, test: (m) => !m.eu },
    { id: 'nonato', label: 'Not in NATO', w: 1, test: (m) => !m.nato },
    { id: 'nocw', label: 'Not in the Commonwealth', w: 1, test: (m) => !m.cw },
    { id: 'vowel', label: 'Name starts with a vowel', w: 1, test: (m) => startsVowel(m.t) },
    { id: 'dbl', label: 'Name has a double letter', w: 1, test: (m) => hasDouble(m.t) },
    ...letterAttrs(COUNTRIES, 'n', (L) => `Name starts with ${L}`, (m) => [m.t]),
    ...letterAttrs(COUNTRIES, 'cap', (L) => `Capital city starts with ${L}`, capList),
  ],
};

// Which states host a franchise, derived from the TEAMS table rather than
// authored twice, so the Monday and Friday universes cannot disagree. The
// generous state readings in facts-teams.js carry over: the Giants and Jets
// make New York, the Commanders make Maryland. New Jersey is added on top:
// the Giants and Jets play their home games there, and a player who names it
// for an NFL state is right.
const teamStates = (lg) => new Set(TEAMS.filter((t) => t.lg === lg).map((t) => t.st));
const NFL_STATES = new Set([...teamStates('nfl'), 'NJ']);
const MLB_STATES = teamStates('mlb');
// Added 2026-11-12 (lane-d restock, pool growth for US States): NBA and NHL
// states from the same TEAMS table. The Wizards and Capitals play in DC, which
// is not a state, so neither league's DC team puts Maryland or Virginia in;
// Canadian franchises carry a province code and answer no state.
const NBA_STATES = teamStates('nba');
const NHL_STATES = teamStates('nhl');
const STATE_BY_AB = Object.fromEntries(STATES.map((m) => [m.ab, m]));

const U_STATES = {
  id: 'states',
  name: 'US States',
  noun: 'state',
  members: STATES,
  attrs: [
    { id: 'can', label: 'Borders Canada', w: 3, test: (m) => !!m.can },
    { id: 'mex', label: 'Borders Mexico', w: 2, test: (m) => !!m.mex },
    { id: 'oc', label: 'Has an ocean coastline', w: 3, test: (m) => !!m.oc },
    { id: 'inland', label: 'No ocean coastline', w: 3, test: (m) => !m.oc },
    { id: 'gulf', label: 'On the Gulf of Mexico', w: 2, test: (m) => !!m.gulf },
    { id: 'lakes', label: 'Touches a Great Lake', w: 3, test: (m) => !!m.lakes },
    { id: 'col', label: 'One of the thirteen colonies', w: 3, test: (m) => !!m.col },
    { id: 'pop5', label: 'Population over 5 million', w: 3, test: (m) => !!m.pop5 },
    { id: 'riv', label: 'Borders the Mississippi River', w: 2, test: (m) => !!m.riv },
    { id: 'y1700s', label: 'Joined the Union in the 1700s', w: 2, test: (m) => m.y < 1800 },
    { id: 'y1900s', label: 'Joined the Union in 1900 or later', w: 2, test: (m) => m.y >= 1900 },
    { id: 'pop2', label: 'Fewer than two million people', w: 2, test: (m) => !!m.pop2 },
    { id: 'west', label: 'West of the Mississippi', w: 3, test: (m) => !!m.west },
    { id: 'endsa', label: 'Name ends in A', w: 2, test: (m) => /a$/i.test(m.t) },
    { id: 'multi', label: 'Name has two words', w: 1, test: (m) => wc(m.t, (n) => n > 1) },
    { id: 'dbl', label: 'Name has a double letter', w: 1, test: (m) => hasDouble(m.t) },
    { id: 'y1800s', label: 'Joined the Union in the 1800s', w: 3, test: (m) => m.y >= 1800 && m.y < 1900 },
    { id: 'east', label: 'East of the Mississippi', w: 3, test: (m) => !m.west },
    { id: 'atl', label: 'On the Atlantic Ocean', w: 3, test: (m) => !!m.atl },
    { id: 'pres', label: 'Birthplace of a US president', w: 3, test: (m) => !!m.pres },
    { id: 'caplg', label: 'Its capital is its largest city', w: 3, test: (m) => !!m.caplg },
    { id: 'park', label: 'Has a national park', w: 3, test: (m) => !!m.park },
    { id: 'reg-ne', label: 'In the Northeast (Census region)', w: 2, test: (m) => m.reg === 'ne' },
    { id: 'reg-mw', label: 'In the Midwest (Census region)', w: 2, test: (m) => m.reg === 'mw' },
    { id: 'reg-s', label: 'In the South (Census region)', w: 2, test: (m) => m.reg === 's' },
    { id: 'reg-w', label: 'In the West (Census region)', w: 2, test: (m) => m.reg === 'w' },
    { id: 'a10', label: 'One of the ten largest by area', w: 2, test: (m) => !!m.a10 },
    { id: 's10', label: 'One of the ten smallest by area', w: 2, test: (m) => !!m.s10 },
    { id: 'nfl', label: 'Home to an NFL team', w: 3, test: (m) => NFL_STATES.has(m.ab) },
    { id: 'mlb', label: 'Home to a Major League Baseball team', w: 3, test: (m) => MLB_STATES.has(m.ab) },
    { id: 'nba', label: 'Home to an NBA team', w: 3, test: (m) => NBA_STATES.has(m.ab) },
    { id: 'nhl', label: 'Home to an NHL team', w: 2, test: (m) => NHL_STATES.has(m.ab) },
    { id: 'nonfl', label: 'No NFL team', w: 1, test: (m) => !NFL_STATES.has(m.ab) },
    { id: 'nomlb', label: 'No Major League Baseball team', w: 1, test: (m) => !MLB_STATES.has(m.ab) },
    // Negations keep the generous readings of their positives (late review): Idaho's
    // sliver of Yellowstone and South Carolina's claim on Andrew Jackson are
    // arguable, so a player may file either state on both sides.
    { id: 'nopark', label: 'No national park', w: 1, test: (m) => !m.park || m.t === 'Idaho' },
    { id: 'nopres', label: 'No US president was born there', w: 1, test: (m) => !m.pres || m.t === 'South Carolina' },
    { id: 'cap2', label: 'Capital city name has more than one word', w: 2, test: (m) => capList(m).some((c) => placeWords(c) > 1) },
    { id: 'vowel', label: 'Name starts with a vowel', w: 1, test: (m) => startsVowel(m.t) },
    ...letterAttrs(STATES, 'n', (L) => `Name starts with ${L}`, (m) => [m.t]),
    ...letterAttrs(STATES, 'cap', (L) => `Capital city starts with ${L}`, capList),
  ],
};

// 'A fish or other sea creature' read literally includes the marine mammals,
// sea turtles and penguins that 'sea' left out (late review 2026-11-12). Boards
// already played keep 'sea'; from 2026-12-01 boards use 'seaw', same label,
// sharing its usage cap.
const SEA_EXTRA = new Set(['Dolphin', 'Orca', 'Blue Whale', 'Humpback Whale', 'Walrus', 'Seal', 'Sea Lion', 'Manatee', 'Otter', 'Sea Turtle', 'Penguin']);
const BIG_CATS = new Set(['Lion', 'Tiger', 'Cheetah', 'Leopard', 'Jaguar', 'Cougar']);
const PRIMATES = new Set(['Gorilla', 'Chimpanzee', 'Baboon', 'Orangutan', 'Gibbon', 'Lemur']);
const RAPTORS = new Set(['Bald Eagle', 'Hawk', 'Falcon', 'Owl', 'Vulture']);
const RODENTS = new Set(['Hamster', 'Guinea Pig', 'Mouse', 'Rat', 'Squirrel', 'Chipmunk', 'Porcupine', 'Beaver']);
const INSECTS = new Set(['Butterfly', 'Moth', 'Honeybee', 'Wasp', 'Dragonfly', 'Ladybug', 'Mosquito', 'Grasshopper', 'Cricket', 'Beetle', 'Ant']);
const U_ANIMALS = {
  id: 'animals',
  name: 'Animals',
  noun: 'animal',
  members: ANIMALS,
  attrs: [
    { id: 'mammal', label: 'A mammal', w: 3, test: (m) => m.cls === 'mammal' },
    { id: 'bird', label: 'A bird', w: 3, test: (m) => m.cls === 'bird' },
    { id: 'herp', label: 'A reptile or amphibian', w: 2, test: (m) => m.cls === 'reptile' || m.cls === 'amphibian' },
    { id: 'sea', label: 'A fish or other sea creature', w: 2, retiredFrom: '2026-12-01', test: (m) => m.cls === 'fish' || (m.cls === 'invert' && m.aqua) },
    { id: 'seaw', label: 'A fish or other sea creature', w: 2, capKey: 'sea', test: (m) => m.cls === 'fish' || (m.cls === 'invert' && m.aqua) || SEA_EXTRA.has(m.t) },
    { id: 'bug', label: 'An insect or bug', w: 2, test: (m) => m.cls === 'bug' },
    { id: 'fly', label: 'Can fly', w: 3, test: (m) => !!m.fly || !!m.flyp },
    { id: 'aqua', label: 'Lives mostly in the water', w: 3, test: (m) => !!m.aqua },
    { id: 'afr', label: 'Found in the wild in Africa', w: 3, test: (m) => !!m.afr },
    { id: 'legs4', label: 'Walks on four legs', w: 3, test: (m) => !!m.legs4 },
    { id: 'eggs', label: 'Lays eggs', w: 3, test: (m) => !!m.eggs },
    { id: 'big', label: 'Heavier than a grown man', w: 3, test: (m) => !!m.big },
    { id: 'dom', label: 'A pet or farm animal', w: 3, test: (m) => !!m.dom },
    { id: 'hunt', label: 'Hunts other animals', w: 3, test: (m) => !!m.hunt },
    { id: 'fish', label: 'A fish', w: 2, test: (m) => m.cls === 'fish' },
    { id: 'rept', label: 'A reptile', w: 2, test: (m) => m.cls === 'reptile' },
    { id: 'invert', label: 'An invertebrate', w: 2, test: (m) => m.cls === 'bug' || m.cls === 'invert' },
    { id: 'mb', label: 'A mammal or a bird', w: 2, test: (m) => m.cls === 'mammal' || m.cls === 'bird' },
    { id: 'land', label: 'Lives mostly on land', w: 3, test: (m) => !m.aqua },
    { id: 'nofly', label: 'Cannot fly', w: 2, test: (m) => !m.fly },
    { id: 'nohunt', label: 'Does not hunt other animals', w: 2, test: (m) => !m.hunt },
    { id: 'noeggs', label: 'Does not lay eggs', w: 2, test: (m) => !m.eggs },
    { id: 'wild', label: 'Not a pet or farm animal', w: 2, test: (m) => !m.dom },
    // Added 2026-11-12 (lane-d restock pool growth): read off cls.
    { id: 'cold', label: 'Cold-blooded', w: 2, test: (m) => m.cls !== 'mammal' && m.cls !== 'bird' },
    { id: 'vert', label: 'A vertebrate (has a backbone)', w: 2, test: (m) => m.cls !== 'bug' && m.cls !== 'invert' },
    { id: 'notmammal', label: 'Not a mammal', w: 1, test: (m) => m.cls !== 'mammal' },
    // Added 2026-11-12 (lane-d review pass): closed, crisp groups by name,
    // asserted by size in verify-niche.
    { id: 'bigcat', label: 'A big cat', w: 2, test: (m) => BIG_CATS.has(m.t) },
    { id: 'primate', label: 'A primate', w: 2, test: (m) => PRIMATES.has(m.t) },
    { id: 'raptor', label: 'A bird of prey', w: 2, test: (m) => RAPTORS.has(m.t) },
    { id: 'rodent', label: 'A rodent', w: 2, test: (m) => RODENTS.has(m.t) },
    { id: 'insect', label: 'An insect', w: 2, test: (m) => INSECTS.has(m.t) },
    { id: 'flightless', label: 'A bird that cannot fly', w: 2, test: (m) => m.cls === 'bird' && !m.fly },
    { id: 'seamammal', label: 'A mammal that lives mostly in the water', w: 2, test: (m) => m.cls === 'mammal' && !!m.aqua },
    { id: 'short5', label: 'Name of five letters or fewer', w: 1, test: (m) => m.t.replace(/[^A-Za-z]/g, '').length <= 5 },
    { id: 'long8', label: 'Name of eight letters or more', w: 1, test: (m) => m.t.replace(/[^A-Za-z]/g, '').length >= 8 },
    { id: 'mid67', label: 'Name of six or seven letters', w: 1, test: (m) => [6, 7].includes(m.t.replace(/[^A-Za-z]/g, '').length) },
    { id: 'endvowel', label: 'Name ends in a vowel', w: 1, test: (m) => /[aeiou]$/i.test(m.t) },
    { id: 'notbird', label: 'Not a bird', w: 1, test: (m) => m.cls !== 'bird' },
    { id: 'multi', label: 'Name has more than one word', w: 1, test: (m) => wc(m.t, (n) => n > 1) },
    { id: 'vowel', label: 'Name starts with a vowel', w: 1, test: (m) => startsVowel(m.t) },
    { id: 'dbl', label: 'Name has a double letter', w: 1, test: (m) => hasDouble(m.t) },
    ...letterAttrs(ANIMALS, 'n', (L) => `Name starts with ${L}`, (m) => [m.t]),
  ],
};

// anyY: a show with two debut readings (Jeopardy! 1964 on NBC, 1984 the
// syndicated version everyone watches) answers a year attribute on either.
const anyY = (m, f) => [m.y, m.y2].filter((v) => v != null).some(f);
const decadeAttrs = (spec) => spec.map(([id, label, lo, hi]) => ({ id, label, w: 3, test: (m) => anyY(m, (y) => y >= lo && y <= hi) }));

const U_MOVIES = {
  id: 'movies',
  name: 'Movies',
  noun: 'movie',
  members: MOVIES,
  attrs: [
    ...decadeAttrs([
      ['dec-old', 'Released before 1970', 0, 1969],
      ['dec-70s', 'Released in the 1970s', 1970, 1979],
      ['dec-80s', 'Released in the 1980s', 1980, 1989],
      ['dec-90s', 'Released in the 1990s', 1990, 1999],
      ['dec-00s', 'Released in the 2000s', 2000, 2009],
      ['dec-10s', 'Released in the 2010s', 2010, 2019],
      ['dec-20s', 'Released in the 2020s', 2020, 2029],
    ]),
    { id: 'ani', label: 'An animated movie', w: 3, test: (m) => !!m.ani },
    { id: 'bp', label: 'Won the Best Picture Oscar', w: 3, test: (m) => !!m.bp },
    { id: 'live', label: 'A live-action movie', w: 2, test: (m) => !m.ani },
    { id: 'nobp', label: 'Did not win Best Picture', w: 1, test: (m) => !m.bp },
    { id: 'bil', label: 'Made $1 billion at the box office', w: 3, test: (m) => !!m.bil },
    { id: 'r', label: 'Rated R', w: 3, test: (m) => !!m.r },
    { id: 'fr', label: 'Part of a film franchise', w: 3, test: (m) => !!m.fr },
    { id: 'one', label: 'One-word title', w: 2, test: (m) => wc(m.t, (n) => n === 1) },
    { id: 'num', label: 'A number in the title', w: 2, test: (m) => hasNumber(m.t) },
    { id: 'c20', label: 'Released before 2000', w: 3, test: (m) => m.y < 2000 },
    { id: 'c21', label: 'Released in 2000 or later', w: 3, test: (m) => m.y >= 2000 },
    // Added 2026-11-12 (lane-d restock pool growth): year windows read off the
    // same release year as the decade attributes.
    { id: 'pre90', label: 'Released before 1990', w: 2, test: (m) => m.y < 1990 },
    { id: 'y8099', label: 'Released from 1980 to 1999', w: 2, test: (m) => m.y >= 1980 && m.y < 2000 },
    { id: 'y0019', label: 'Released from 2000 to 2019', w: 2, test: (m) => m.y >= 2000 && m.y < 2020 },
    { id: 'y2010', label: 'Released in 2010 or later', w: 2, test: (m) => m.y >= 2010 },
    { id: 'nofr', label: 'Not part of a film franchise', w: 2, test: (m) => !m.fr },
    { id: 'notr', label: 'Not rated R', w: 2, test: (m) => !m.r },
    { id: 'the', label: 'Title starts with "The"', w: 2, test: (m) => /^The /.test(m.t) },
    { id: 'w2', label: 'Two-word title', w: 2, test: (m) => wc(m.t, (n) => n === 2) },
    { id: 'w3', label: 'Three-word title', w: 2, test: (m) => wc(m.t, (n) => n === 3) },
    { id: 'w4', label: 'Title of four or more words', w: 2, test: (m) => wc(m.t, (n) => n >= 4) },
    { id: 'colon', label: 'Title contains a colon', w: 1, test: (m) => /:/.test(m.t) || !!m.colon },
    { id: 'vowel', label: 'Title starts with a vowel ("The" doesn\'t count)', w: 1, test: (m) => startsVowel(m.t) },
    { id: 'dbl', label: 'Title has a double letter', w: 1, test: (m) => hasDouble(strip(m.t)) },
    ...letterAttrs(MOVIES, 'n', (L) => `Title starts with ${L} ("The" doesn't count)`, (m) => [m.t]),
  ],
};

const U_TV = {
  id: 'tv',
  name: 'TV Shows',
  noun: 'show',
  members: TVSHOWS,
  attrs: [
    ...decadeAttrs([
      ['dec-old', 'Debuted before 1990', 0, 1989],
      ['dec-90s', 'Debuted in the 1990s', 1990, 1999],
      ['dec-00s', 'Debuted in the 2000s', 2000, 2009],
      ['dec-10s', 'Debuted in the 2010s', 2010, 2019],
      ['dec-20s', 'Debuted in the 2020s', 2020, 2029],
    ]),
    { id: 'ani', label: 'Animated', w: 3, test: (m) => !!m.ani },
    { id: 'emmy', label: 'Won the best-series Emmy', w: 3, test: (m) => !!m.emmy },
    { id: 'ten', label: 'Ran ten or more seasons', w: 3, test: (m) => !!m.ten },
    { id: 'str', label: 'A streaming original', w: 3, test: (m) => !!m.str },
    { id: 'nyc', label: 'Set in New York City', w: 3, test: (m) => !!m.nyc },
    { id: 'live', label: 'Live-action', w: 2, test: (m) => !m.ani },
    { id: 'nonyc', label: 'Not set in New York City', w: 1, test: (m) => !m.nyc },
    { id: 'net', label: 'First aired on ABC, CBS, NBC or Fox', w: 3, test: (m) => !!m.net },
    { id: 'cable', label: 'First aired on a cable channel', w: 3, test: (m) => !!m.cable },
    { id: 'book', label: 'Adapted from a book, comic or video game', w: 2, test: (m) => !!m.book },
    { id: 'the', label: 'Title starts with "The"', w: 2, test: (m) => /^The /.test(m.t) },
    { id: 'one', label: 'One-word title ("The" doesn\'t count)', w: 2, test: (m) => wc(strip(m.t), (n) => n === 1) },
    { id: 'num', label: 'A number in the title', w: 2, test: (m) => hasNumber(m.t) },
    { id: 'c20', label: 'Debuted before 2000', w: 3, test: (m) => anyY(m, (y) => y < 2000) },
    { id: 'c21', label: 'Debuted in 2000 or later', w: 3, test: (m) => anyY(m, (y) => y >= 2000) },
    { id: 'y2010', label: 'Debuted in 2010 or later', w: 2, test: (m) => anyY(m, (y) => y >= 2010) },
    // Added 2026-11-12 (lane-d restock pool growth): debut-year windows.
    { id: 'y8099', label: 'Debuted from 1980 to 1999', w: 2, test: (m) => anyY(m, (y) => y >= 1980 && y < 2000) },
    { id: 'y0019', label: 'Debuted from 2000 to 2019', w: 2, test: (m) => anyY(m, (y) => y >= 2000 && y < 2020) },
    { id: 'short8', label: 'Title of eight letters or fewer ("The" doesn\'t count)', w: 1, test: (m) => strip(m.t).replace(/[^A-Za-z]/g, '').length <= 8 },
    { id: 'long14', label: 'Title of fourteen letters or more ("The" doesn\'t count)', w: 1, test: (m) => strip(m.t).replace(/[^A-Za-z]/g, '').length >= 14 },
    { id: 'cablestr', label: 'First aired on cable or streaming', w: 3, test: (m) => !!m.cable || !!m.str },
    { id: 'noemmy', label: 'Never won the best-series Emmy', w: 2, test: (m) => !m.emmy },
    { id: 'short', label: 'Ran fewer than ten seasons', w: 2, test: (m) => !m.ten },
    { id: 'nobook', label: 'Not adapted from a book, comic or game', w: 1, test: (m) => !m.book },
    { id: 'multi', label: 'Title has more than one word ("The" doesn\'t count)', w: 2, test: (m) => wc(strip(m.t), (n) => n > 1) },
    { id: 'w3', label: 'Title of three or more words ("The" doesn\'t count)', w: 2, test: (m) => wc(strip(m.t), (n) => n >= 3) },
    { id: 'vowel', label: 'Title starts with a vowel ("The" doesn\'t count)', w: 1, test: (m) => startsVowel(m.t) },
    { id: 'dbl', label: 'Title has a double letter', w: 1, test: (m) => hasDouble(strip(m.t)) },
    ...letterAttrs(TVSHOWS, 'n', (L) => `Title starts with ${L} ("The" doesn't count)`, (m) => [m.t]),
  ],
};

const U_MUSICIANS = {
  id: 'musicians',
  name: 'Musicians',
  noun: 'act',
  members: MUSICIANS,
  attrs: [
    { id: 'band', label: 'A band or group', w: 3, test: (m) => !!m.band },
    { id: 'solo', label: 'A solo act', w: 3, test: (m) => !m.band },
    { id: 'uk', label: 'A British act', w: 3, test: (m) => !!m.uk },
    { id: 'us', label: 'An American act', w: 3, test: (m) => !!m.us },
    { id: 'intl', label: 'Neither an American nor a British act', w: 2, test: (m) => (!m.us || !!m.pr) && !m.uk },
    { id: 'aoty', label: 'Won the Grammy Album of the Year', w: 3, test: (m) => !!m.aoty },
    { id: 'hall', label: 'In the Rock & Roll Hall of Fame', w: 3, test: (m) => !!m.hall },
    { id: 'fem', label: 'A solo female artist', w: 3, test: (m) => !!m.fem },
    { id: 'rap', label: 'A hip-hop or rap act', w: 3, test: (m) => !!m.rap },
    { id: 'ctry', label: 'A country act', w: 2, test: (m) => !!m.ctry },
    { id: 'one', label: 'A one-word name ("The" doesn\'t count)', w: 2, test: (m) => wc(strip(m.t), (n) => n === 1) },
    { id: 'num', label: 'A number in the name', w: 2, test: (m) => hasNumber(m.t) || !!m.num },
    { id: 'male', label: 'A solo male artist', w: 3, test: (m) => !m.band && !m.fem && !m.nb },
    { id: 'halftime', label: 'Has played a Super Bowl halftime show', w: 3, test: (m) => HALFTIME.has(m.t) },
    { id: 'roty', label: 'Won the Grammy Record of the Year', w: 3, test: (m) => ROTY.has(m.t) },
    { id: 'bna', label: 'Won the Grammy Best New Artist', w: 2, test: (m) => BEST_NEW.has(m.t) },
    // Added 2026-11-12 (lane-d restock pool growth).
    { id: 'ca', label: 'A Canadian act', w: 2, test: (m) => CANADIAN.has(m.t) },
    { id: 'short5', label: 'A name of five letters or fewer ("The" doesn\'t count)', w: 1, test: (m) => strip(m.t).replace(/[^A-Za-z]/g, '').length <= 5 },
    { id: 'long12', label: 'A name of twelve letters or more ("The" doesn\'t count)', w: 1, test: (m) => strip(m.t).replace(/[^A-Za-z]/g, '').length >= 12 },
    { id: 'usuk', label: 'An American or British act', w: 1, test: (m) => !!m.us || !!m.uk },
    { id: 'noroty', label: 'Never won the Grammy Record of the Year', w: 1, test: (m) => !ROTY.has(m.t) },
    { id: 'nobna', label: 'Never won the Grammy Best New Artist', w: 1, test: (m) => !BEST_NEW.has(m.t) },
    { id: 'nohalftime', label: 'Never played a Super Bowl halftime show', w: 1, test: (m) => !HALFTIME.has(m.t) },
    { id: 'norap', label: 'Not a hip-hop or rap act', w: 1, test: (m) => !m.rap },
    { id: 'nohall', label: 'Not in the Rock & Roll Hall of Fame', w: 2, test: (m) => !m.hall },
    { id: 'nonus', label: 'Not an American act', w: 2, test: (m) => !m.us || !!m.pr },
    { id: 'nonuk', label: 'Not a British act', w: 1, test: (m) => !m.uk },
    { id: 'noaoty', label: 'Never won the Grammy Album of the Year', w: 1, test: (m) => !m.aoty },
    { id: 'the', label: 'Name starts with "The"', w: 2, test: (m) => /^The /.test(m.t) },
    { id: 'multi', label: 'A name of more than one word ("The" doesn\'t count)', w: 2, test: (m) => wc(strip(m.t), (n) => n > 1) },
    { id: 'w3', label: 'A name of three or more words ("The" doesn\'t count)', w: 1, test: (m) => wc(strip(m.t), (n) => n >= 3) },
    { id: 'vowel', label: 'Name starts with a vowel ("The" doesn\'t count)', w: 1, test: (m) => startsVowel(m.t) },
    { id: 'dbl', label: 'Name has a double letter', w: 1, test: (m) => hasDouble(strip(m.t)) },
    ...letterAttrs(MUSICIANS, 'n', (L) => `Name starts with ${L} ("The" doesn't count)`, (m) => [m.t]),
  ],
};

// Home time zone by state or province. Every state and province with a big
// four team sits wholly in one zone for the city that carries the team
// (Nashville and Memphis are both Central, so Tennessee is Central), so the
// map is by state rather than by team. Arizona, Colorado, Utah and Alberta
// are Mountain, which TZ_MT claims (Arizona keeps MST year round).
const TZ_ET = new Set(['CT', 'DC', 'DE', 'FL', 'GA', 'IN', 'MA', 'MD', 'ME', 'MI', 'NC', 'NH', 'NJ', 'NY', 'OH', 'ON', 'PA', 'QC', 'RI', 'SC', 'VA', 'VT', 'WV']);
const TZ_CT = new Set(['AL', 'AR', 'IA', 'IL', 'KS', 'LA', 'MB', 'MN', 'MO', 'MS', 'ND', 'NE', 'OK', 'SD', 'TN', 'TX', 'WI']);
const TZ_PT = new Set(['BC', 'CA', 'NV', 'OR', 'WA']);
const TZ_MT = new Set(['AZ', 'CO', 'UT', 'AB']);

const U_TEAMS = {
  id: 'teams',
  name: 'Pro Sports Teams',
  noun: 'team',
  members: TEAMS,
  attrs: [
    { id: 'lg-nfl', label: 'An NFL team', w: 3, test: (m) => m.lg === 'nfl' },
    { id: 'lg-nba', label: 'An NBA team', w: 3, test: (m) => m.lg === 'nba' },
    { id: 'lg-mlb', label: 'A Major League Baseball team', w: 3, test: (m) => m.lg === 'mlb' },
    { id: 'lg-nhl', label: 'An NHL team', w: 3, test: (m) => m.lg === 'nhl' },
    { id: 'champ', label: 'Won a championship since 2000', w: 3, test: (m) => !!m.champ },
    { id: 'animal', label: 'Named after a creature', w: 3, test: (m) => !!m.animal },
    { id: 'ca', label: 'Based in California', w: 3, test: (m) => m.st === 'CA' },
    { id: 'tx', label: 'Based in Texas', w: 2, test: (m) => m.st === 'TX' },
    { id: 'fl', label: 'Based in Florida', w: 2, test: (m) => m.st === 'FL' },
    { id: 'ny', label: 'A New York team', w: 2, test: (m) => m.st === 'NY' },
    { id: 'can', label: 'Based in Canada', w: 3, test: (m) => !!m.can },
    { id: 'et', label: 'Plays in the Eastern time zone', w: 3, test: (m) => TZ_ET.has(m.st) },
    { id: 'ct', label: 'Plays in the Central time zone', w: 3, test: (m) => TZ_CT.has(m.st) },
    { id: 'pac', label: 'Plays in the Pacific time zone', w: 2, test: (m) => TZ_PT.has(m.st) },
    { id: 'bird', label: 'Named after a bird', w: 2, test: (m) => !!m.bird },
    { id: 'old', label: 'Franchise founded before 1950', w: 3, test: (m) => !!m.old },
    // Added 2026-11-12 (lane-d restock pool growth): read off the team's home
    // state in facts-states.js, so a Canadian club answers none of them and the
    // two DC clubs answer the original-states and Atlantic attributes on the
    // generous reading (DC was carved out of Maryland), never the Canada one.
    { id: 'st-col', label: 'Based in one of the thirteen original states', w: 2, test: (m) => STATE_BY_AB[m.st]?.col === 1 || m.st === 'DC' },
    { id: 'st-atl', label: 'Based in a US state on the Atlantic', w: 2, test: (m) => STATE_BY_AB[m.st]?.atl === 1 || m.st === 'DC' },
    { id: 'st-can', label: 'Based in a US state that borders Canada', w: 2, test: (m) => STATE_BY_AB[m.st]?.can === 1 },
    { id: 'nk2', label: 'Nickname of two or more words', w: 2, test: (m) => (m.nk || 1) >= 2 },
    { id: 'nos', label: 'Nickname doesn\'t end in S', w: 2, test: (m) => !/s$/i.test(words(m.t).slice(-1)[0] || '') },
    { id: 'city2', label: 'Two-word place name', w: 2, test: (m) => words(m.t).length - (m.nk || 1) >= 2 },
    { id: 'allit', label: 'Alliterative name', w: 2, test: (m) => { const w2 = words(m.t); return w2.length >= 2 && w2[0][0] === w2[w2.length - 1][0]; } },
    { id: 'mt', label: 'Plays in the Mountain time zone', w: 2, test: (m) => TZ_MT.has(m.st) },
    { id: 'nochamp', label: 'No championship since 2000', w: 2, test: (m) => !m.champ },
    { id: 'newfr', label: 'Franchise founded in 1950 or later', w: 2, test: (m) => !m.old },
    { id: 'noanimal', label: 'Not named after a creature', w: 2, test: (m) => !m.animal },
    { id: 'city1', label: 'One-word place name', w: 2, test: (m) => words(m.t).length - (m.nk || 1) === 1 },
    { id: 'reg-ne', label: 'Based in the Northeast (Census region)', w: 2, test: (m) => US_REGION[m.st] === 'ne' },
    { id: 'reg-mw', label: 'Based in the Midwest (Census region)', w: 2, test: (m) => US_REGION[m.st] === 'mw' },
    { id: 'reg-s', label: 'Based in the South (Census region)', w: 2, test: (m) => US_REGION[m.st] === 's' },
    { id: 'reg-w', label: 'Based in the West (Census region)', w: 2, test: (m) => US_REGION[m.st] === 'w' },
    { id: 'color', label: 'Name contains a color word', w: 1, test: (m) => /\b(Red|White|Blue|Black|Green|Brown|Gold|Golden|Silver|Orange)/.test(m.t) },
    { id: 'vowel', label: 'Full name starts with a vowel', w: 1, test: (m) => startsVowel(m.t) },
    { id: 'dbl', label: 'Full name has a double letter', w: 1, test: (m) => hasDouble(m.t) },
    ...letterAttrs(TEAMS, 'n', (L) => `Full name starts with ${L}`, (m) => [m.t]),
  ],
};

export const UNIVERSES = [U_COUNTRIES, U_STATES, U_ANIMALS, U_MOVIES, U_TV, U_MUSICIANS, U_TEAMS];

// DOUBLE LETTERS INSIDE A WORD (2026-11-12, lane-d review). hasDouble strips
// spaces and punctuation before it tests, so a letter repeated across a word
// break counts ("Mr. Robot", "The Dark Knight", "New Orleans Saints"). Boards
// already live keep 'dbl' exactly as played; from DBL_RETIRED every board uses
// 'dblw', the same label tested word by word. The two share one usage cap
// (capKey), and verify-niche refuses 'dbl' on any board from DBL_RETIRED.
export const DBL_RETIRED = '2026-12-01';
const hasDoubleInWord = (t) => String(t).split(/[^A-Za-z]+/).some((w) => /([a-z])\1/i.test(w));
for (const u of UNIVERSES) {
  const i = u.attrs.findIndex((a) => a.id === 'dbl');
  if (i < 0) continue;
  const old = u.attrs[i];
  old.retiredFrom = DBL_RETIRED;
  u.attrs.splice(i + 1, 0, { id: 'dblw', label: old.label, w: old.w, capKey: 'dbl', test: (m) => hasDoubleInWord(m.t) });
}
export const UNIVERSE_MAP = Object.fromEntries(UNIVERSES.map((u) => [u.id, u]));

// One universe per ET day of the week, fixed so players learn the rhythm.
// Countries is the Sunday marquee: the deepest universe carries the 4x4.
export const DAY_UNIVERSE = ['countries', 'states', 'animals', 'movies', 'tv', 'teams', 'musicians'];
export function universeForDate(iso) {
  // iso is an ET 'YYYY-MM-DD'; noon UTC of that date has the same weekday.
  const d = new Date(`${iso}T12:00:00Z`);
  return UNIVERSE_MAP[DAY_UNIVERSE[d.getUTCDay()]];
}

export function attrById(universe, id) {
  return universe.attrs.find((a) => a.id === id) || null;
}

// Every member satisfying one attribute (by attr id).
export function validSet(universe, attrId) {
  const a = attrById(universe, attrId);
  if (!a) return [];
  return universe.members.filter((m) => a.test(m));
}

// Every member satisfying BOTH a row and a column attribute — the cell.
export function cellMembers(universe, rowId, colId) {
  const ra = attrById(universe, rowId);
  const ca = attrById(universe, colId);
  if (!ra || !ca) return [];
  return universe.members.filter((m) => pairFits(ra, ca, m));
}

// Can the whole board be filled with DISTINCT members? Straight augmenting-path
// bipartite matching, cells on one side, members on the other. Small boards
// (at most 16 cells) so no fancier algorithm is warranted.
export function boardMatchable(universe, rows, cols) {
  const cells = [];
  for (const r of rows) for (const c of cols) cells.push(cellMembers(universe, r, c).map((m) => m.t));
  const match = {}; // member name -> cell index
  const tryCell = (i, seen) => {
    for (const name of cells[i]) {
      if (seen.has(name)) continue;
      seen.add(name);
      if (!(name in match) || tryCell(match[name], seen)) { match[name] = i; return true; }
    }
    return false;
  };
  for (let i = 0; i < cells.length; i++) {
    if (!tryCell(i, new Set())) return false;
  }
  return true;
}

// Type-ahead search over a universe: canonical names plus aliases, prefix and
// word-prefix matches first. Returns member objects, capped.
export function searchMembers(universe, q, cap = 8) {
  const n = normAnswer(q);
  if (!n) return [];
  const starts = [];
  const contains = [];
  for (const m of universe.members) {
    const names = [m.t, ...(m.a || [])].map(normAnswer);
    if (names.some((x) => x.startsWith(n) || x.split(' ').some((wd) => wd.startsWith(n)))) starts.push(m);
    else if (names.some((x) => x.includes(n))) contains.push(m);
  }
  return [...starts, ...contains].slice(0, cap);
}
