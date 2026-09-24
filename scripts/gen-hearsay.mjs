#!/usr/bin/env node
// Generator for the Hearsay bank (app/hearsay/puzzles.js).
//
// APPEND ONLY. Reads the bank, takes its last num and live date, and writes
// new boards for each day after it through --until (inclusive). Frozen boards
// are never regenerated; new rows are spliced in front of the closing `];`.
//
//   node scripts/gen-hearsay.mjs --until 2026-11-30            # dry run
//   node scripts/gen-hearsay.mjs --until 2026-11-30 --write    # append
//
// One DOMAIN per day (a noun, a list label, the attributes the voices are told
// and the pool of values each can take), hand-written below and never repeating
// a noun already in the bank. For each day: draw a shortlist from the domain's
// cartesian product and a script in the bank's grammar, simulate it with the
// same public-announcement engine the client and verifier use, and keep the
// board only when it meets the verifier's v2 bar:
//   - exactly one card survives, every line narrows the list,
//   - at most one line (three on Sunday) shaves a single card,
//   - >= 3 cards (4 on Sunday) are still alive before the final line,
//   - >= 1 higher-order line (2 on Sunday), weekdays 4+ lines, Sundays 5,
//   - the answer's value is shared by >= 2 cards in every attribute at the start.
// Plus grammar the verifier does not check: a voice opens with dontKnow (or a
// higher-order line), "still" is only said by a voice that has spoken, only the
// last line is `know`, and knowNowOtherStill sits just before the other voice's
// `know`. Weekdays take 11-14 cards, Sundays 14-17 (three voices).
// Deterministic, seeded off the board NUMBER.
import fs from 'node:fs';
import { PUZZLES } from '../app/hearsay/puzzles.js';
import { scanUS } from './us-spellings.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const UNTIL = arg('--until', '2026-11-30');
const WRITE = args.includes('--write');
const BANK = new URL('../app/hearsay/puzzles.js', import.meta.url);

// [noun, listLabel, attrs, value pools]. Sundays need three attributes.
const DOMAINS = [
  ['stamp', 'the album page', ['country', 'year', 'perforation'], [['Iceland', 'Malta', 'Peru', 'Fiji', 'Chile', 'Nepal'], ['1921', '1934', '1948', '1952', '1967'], ['a line perf', 'a comb perf', 'an imperf edge']]],
  ['violin', 'the repair ticket', ['workshop', 'wood'], [['the Aldine shop', 'the Brook shop', 'the Cellini shop', 'the Dorn shop', 'the Ember shop', 'the Fisk shop'], ['maple', 'spruce', 'willow', 'poplar', 'cherry', 'walnut']]],
  ['canal barge', 'the wharf tally', ['basin', 'cargo'], [['Hollin Basin', 'Stoke Basin', 'Ferry Basin', 'Mill Basin', 'Gas Basin', 'Wey Basin'], ['coal', 'timber', 'grain', 'bricks', 'lime', 'salt']]],
  ['chess game', 'the club scoresheet', ['board', 'opening'], [['board one', 'board two', 'board three', 'board four', 'board five', 'board six'], ['the Sicilian', 'the French', 'the Caro-Kann', 'the English', 'the Dutch', 'the Ruy Lopez']]],
  ['tent pitch', 'the campsite map', ['field', 'shelter'], [['the Upper Field', 'the Lower Field', 'the Orchard Field', 'the River Field', 'the Beech Field', 'the Top Field'], ['a bell tent', 'a dome tent', 'a tipi', 'a yurt', 'a hammock', 'a tarp']]],
  ['relay leg', 'the race sheet', ['team', 'leg'], [['the Harriers', 'the Striders', 'the Pacers', 'the Flyers', 'the Rovers', 'the Dashers'], ['the first leg', 'the second leg', 'the third leg', 'the fourth leg', 'the anchor leg']]],
  ['hat', 'the fitting book', ['shop', 'trim'], [['the Bond Street shop', 'the Hill Street shop', 'the King Street shop', 'the Queen Street shop', 'the Duke Street shop', 'the Park Street shop'], ['a feather', 'a ribbon', 'a veil', 'a flower', 'a buckle']]],
  ['sculpture', 'the foundry list', ['foundry', 'patina', 'plinth'], [['Arden', 'Belmont', 'Corbett', 'Dallow', 'Easton', 'Fenby'], ['a green patina', 'a brown patina', 'a black patina', 'a gilt finish', 'a blue patina'], ['a stone plinth', 'an oak plinth', 'a steel plinth']]],
  ['kayak', 'the boathouse rack', ['rack', 'hull'], [['rack A', 'rack B', 'rack C', 'rack D', 'rack E', 'rack F'], ['a red hull', 'a yellow hull', 'a green hull', 'an orange hull', 'a blue hull', 'a white hull']]],
  ['bicycle', 'the repair tags', ['frame', 'gears'], [['a steel frame', 'an alloy frame', 'a carbon frame', 'a bamboo frame', 'a titanium frame', 'a wooden frame'], ['one speed', 'three speeds', 'seven speeds', 'eleven speeds', 'twenty-one speeds', 'twenty-seven speeds']]],
  ['jam jar', 'the pantry shelf', ['fruit', 'year'], [['damson', 'quince', 'apricot', 'gooseberry', 'rhubarb', 'plum', 'cherry'], ['2019', '2020', '2021', '2022', '2023', '2024']]],
  ['map', 'the chart drawer', ['coast', 'scale'], [['the Cornish coast', 'the Welsh coast', 'the Kent coast', 'the Norfolk coast', 'the Devon coast', 'the Fife coast'], ['one inch to a mile', 'two inches to a mile', 'four inches to a mile', 'six inches to a mile', 'half an inch to a mile']]],
  ['tulip bulb', 'the bulb catalog', ['bed', 'variety'], [['the north bed', 'the south bed', 'the east bed', 'the west bed', 'the long bed', 'the round bed'], ['Queen of Night', 'Apricot Beauty', 'Black Parrot', 'Ballerina', 'Angelique', 'Spring Green']]],
  ['sundial', 'the garden inventory', ['garden', 'gnomon'], [['the rose garden', 'the herb garden', 'the walled garden', 'the water garden', 'the knot garden', 'the kitchen garden'], ['a brass gnomon', 'a bronze gnomon', 'a slate gnomon', 'an iron gnomon', 'a copper gnomon']]],
  ['weathervane', 'the smithy order book', ['church', 'figure', 'metal'], [['St Anne', 'St Bride', 'St Clement', 'St Denys', 'St Elmo', 'St Giles'], ['a rooster', 'a fox', 'a fish', 'a ship', 'an arrow'], ['copper', 'iron', 'brass']]],
  ['puppet', 'the theater cast list', ['show', 'strings'], [['the Pirate Show', 'the Dragon Show', 'the Circus Show', 'the Castle Show', 'the Forest Show', 'the Moon Show'], ['four strings', 'six strings', 'eight strings', 'nine strings', 'twelve strings']]],
  ['snow globe', 'the shop window list', ['scene', 'base'], [['a village', 'a lighthouse', 'a carousel', 'a forest', 'a bridge', 'a castle'], ['a walnut base', 'an oak base', 'a glass base', 'a brass base', 'a resin base']]],
  ['hot air balloon', 'the launch roster', ['field', 'envelope'], [['Meadow Field', 'Hill Field', 'Church Field', 'Barn Field', 'Lake Field', 'Mill Field'], ['a striped envelope', 'a checked envelope', 'a plain envelope', 'a starry envelope', 'a patchwork envelope']]],
  ['fishing fly', 'the tackle box card', ['river', 'hook'], [['the Test', 'the Itchen', 'the Wye', 'the Tay', 'the Spey', 'the Dee'], ['a size 10 hook', 'a size 12 hook', 'a size 14 hook', 'a size 16 hook', 'a size 18 hook']]],
  ['marble', 'the playground tally', ['swirl', 'size'], [['a red swirl', 'a blue swirl', 'a green swirl', 'a gold swirl', 'a white swirl', 'a black swirl'], ['a shooter', 'a peewee', 'a boulder', 'a standard', 'a mib']]],
  ['carousel horse', 'the fairground inventory', ['carver', 'saddle'], [['the Looff shop', 'the Dentzel shop', 'the Illions shop', 'the Carmel shop', 'the Stein shop', 'the Parker shop'], ['a red saddle', 'a blue saddle', 'a green saddle', 'a gold saddle', 'a purple saddle']]],
  ['lantern', 'the festival list', ['street', 'shape', 'color'], [['Mill Street', 'Bank Street', 'Church Street', 'Castle Street', 'Market Street', 'Bridge Street'], ['a star', 'a moon', 'a fish', 'a dragon', 'a lotus'], ['red', 'gold', 'white']]],
  ['teapot', 'the pottery shelf', ['kiln', 'glaze'], [['the Ashby kiln', 'the Brook kiln', 'the Cole kiln', 'the Dale kiln', 'the Elm kiln', 'the Ford kiln'], ['a celadon glaze', 'a tenmoku glaze', 'a shino glaze', 'an ash glaze', 'a salt glaze']]],
  ['crossword', 'the puzzle folder', ['setter', 'grid'], [['Aldo', 'Bexley', 'Crane', 'Dimmock', 'Estes', 'Fairfax'], ['a 9 by 9 grid', 'a 13 by 13 grid', 'a 15 by 15 grid', 'a 17 by 17 grid', 'a 21 by 21 grid']]],
  ['model ship', 'the museum case list', ['gallery', 'rig'], [['the east gallery', 'the west gallery', 'the long gallery', 'the upper gallery', 'the harbor gallery', 'the river gallery'], ['a brig', 'a schooner', 'a ketch', 'a sloop', 'a bark']]],
  ['music box', 'the repair list', ['maker', 'tune'], [['Aldridge', 'Birch', 'Coulter', 'Dewhurst', 'Eaton', 'Frome'], ['a waltz', 'a lullaby', 'a march', 'a hymn', 'a jig']]],
  ['toboggan', 'the hill roster', ['hill', 'runners'], [['Beacon Hill', 'Crown Hill', 'Pike Hill', 'Summer Hill', 'Windy Hill', 'Rook Hill'], ['steel runners', 'ash runners', 'brass runners', 'plastic runners', 'oak runners']]],
  ['rowing eight', 'the regatta draw', ['club', 'lane'], [['the Blues', 'the Greens', 'the Cherwell crew', 'the Tideway crew', 'the Thames crew', 'the Cam crew'], ['lane one', 'lane two', 'lane three', 'lane four', 'lane five', 'lane six']]],
  ['mosaic panel', 'the chapel survey', ['wall', 'border', 'stone'], [['the north wall', 'the south wall', 'the east wall', 'the west wall', 'the apse', 'the porch'], ['a key border', 'a vine border', 'a wave border', 'a rope border'], ['marble', 'glass', 'slate']]],
  ['weather balloon', 'the launch sheet', ['site', 'payload'], [['Cold Point', 'High Moor', 'Long Reach', 'Dry Ridge', 'Wet Hollow', 'Far Crag'], ['a camera', 'a thermometer', 'a barometer', 'a radiosonde', 'a light meter']]],
];

const KEYS = ['a', 'b', 'c'];
const NAMES = [...new Set(PUZZLES.flatMap((p) => p.who))];
const HIGHER = new Set(['knowOtherDoesnt', 'knowNowOtherStill']);

// The engine, as in app/hearsay/HearsayClient.jsx and scripts/verify-hearsay.mjs.
const countBy = (S, cards, attr, val) => S.filter((i) => cards[i][attr] === val).length;
function apply(S, cards, st) {
  const a = st.who, b = st.other;
  if (st.type === 'dontKnow' || st.type === 'stillDontKnow') return S.filter((i) => countBy(S, cards, a, cards[i][a]) >= 2);
  if (st.type === 'know') return S.filter((i) => countBy(S, cards, a, cards[i][a]) === 1);
  if (st.type === 'knowOtherDoesnt') return S.filter((i) => countBy(S, cards, a, cards[i][a]) >= 2 && S.filter((j) => cards[j][a] === cards[i][a]).every((j) => countBy(S, cards, b, cards[j][b]) >= 2));
  if (st.type === 'knowNowOtherStill') return S.filter((i) => countBy(S, cards, a, cards[i][a]) === 1 && countBy(S, cards, b, cards[i][b]) >= 2);
  return null;
}

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, R) => a[Math.floor(R() * a.length)];

function randomScript(nWho, lines, R) {
  const who = KEYS.slice(0, nWho);
  const spoken = new Set();
  const script = [];
  let prev = null;
  for (let i = 0; i < lines; i++) {
    const last = i === lines - 1;
    const sp = pick(who.filter((w) => w !== prev), R);
    if (last) { script.push({ who: sp, type: 'know' }); break; }
    const penult = i === lines - 2;
    const opts = [];
    opts.push(spoken.has(sp) ? 'stillDontKnow' : 'dontKnow', spoken.has(sp) ? 'stillDontKnow' : 'dontKnow');
    opts.push('knowOtherDoesnt', 'knowOtherDoesnt', 'knowOtherDoesnt');
    if (penult && nWho === 2) opts.push('knowNowOtherStill');
    const type = pick(opts, R);
    const st = { who: sp, type };
    if (type === 'knowOtherDoesnt') st.other = pick(who.filter((w) => w !== sp), R);
    if (type === 'knowNowOtherStill') st.other = who.find((w) => w !== sp);
    script.push(st);
    spoken.add(sp);
    prev = sp;
  }
  // knowNowOtherStill must hand the last word to the other voice
  const pen = script[script.length - 2];
  if (pen.type === 'knowNowOtherStill' && script[script.length - 1].who !== pen.other) return null;
  // a voice who has said it knows says nothing more
  return script;
}

function makeBoard(dom, sunday, R) {
  const nWho = sunday ? 3 : 2;
  const pools = dom[3];
  const product = [];
  if (nWho === 2) for (const a of pools[0]) for (const b of pools[1]) product.push({ a, b });
  else for (const a of pools[0]) for (const b of pools[1]) for (const c of pools[2]) product.push({ a, b, c });
  // Shape chosen ONCE per board (the bank runs about one weekday in six at five
  // lines and about one in six on a knowNowOtherStill line), then searched for.
  const want = [sunday ? 5 : (R() < 0.18 ? 5 : 4), !sunday && R() < 0.2];
  // If the chosen shape does not fit this domain, fall back to the plain one.
  for (const [lines, wantKnos] of [want, [sunday ? 5 : 4, false]])
  for (let attempt = 0; attempt < 150000; attempt++) {
    const nCards = sunday ? 14 + Math.floor(R() * 4) : 11 + Math.floor(R() * 4);
    const cards = shuffle(product.slice(), R).slice(0, nCards);
    const script = randomScript(nWho, lines, R);
    if (!script) continue;
    if (wantKnos !== script.some((s) => s.type === 'knowNowOtherStill')) continue;
    if (script.filter((s) => HIGHER.has(s.type)).length < (sunday ? 2 : 1)) continue;
    let S = cards.map((_, i) => i);
    const trace = [S.length];
    let ok = true;
    for (const st of script) { S = apply(S, cards, st); trace.push(S.length); if (trace.at(-1) >= trace.at(-2)) { ok = false; break; } }
    if (!ok || S.length !== 1) continue;
    let weak = 0;
    for (let i = 1; i < trace.length; i++) if (trace[i - 1] - trace[i] < 2) weak++;
    if (weak > (sunday ? 3 : 1)) continue;
    if (trace[trace.length - 2] < (sunday ? 4 : 3)) continue;
    const ans = cards[S[0]];
    if (KEYS.slice(0, nWho).some((k) => cards.filter((c) => c[k] === ans[k]).length < 2)) continue;
    return { cards, script, trace };
  }
  throw new Error(`no board for ${dom[0]}`);
}

const last = PUZZLES[PUZZLES.length - 1];
const dates = [];
for (let d = new Date(`${last.live}T12:00:00Z`); ;) { d.setUTCDate(d.getUTCDate() + 1); const iso = d.toISOString().slice(0, 10); if (iso > UNTIL) break; dates.push(iso); }
if (dates.length > DOMAINS.length) throw new Error(`need ${dates.length} domains, have ${DOMAINS.length}`);

const usedNouns = new Set(PUZZLES.map((p) => p.noun.toLowerCase()));
DOMAINS.forEach(([noun, label, attrs, pools]) => {
  if (usedNouns.has(noun.toLowerCase())) throw new Error(`noun repeats: ${noun}`);
  usedNouns.add(noun.toLowerCase());
  if (attrs.length !== pools.length) throw new Error(`attr/pool mismatch: ${noun}`);
  for (const t of [noun, label, ...attrs, ...pools.flat()]) {
    for (const h of scanUS(t)) throw new Error(`British form ${h.found} in ${t}`);
    if (/[–—]/.test(t)) throw new Error(`dash in ${t}`);
  }
  pools.forEach((p) => { if (new Set(p).size !== p.length) throw new Error(`duplicate value in ${noun}`); });
});

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const rows = [];
dates.forEach((iso, i) => {
  const num = last.num + 1 + i;
  const R = mulberry32(0x4ea75 + num * 7727);
  const [y, m, d] = iso.split('-').map(Number);
  const sunday = new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
  const dom = DOMAINS[i];
  if ((dom[2].length === 3) !== sunday) throw new Error(`domain ${dom[0]} has ${dom[2].length} attrs on ${iso}`);
  const { cards, script, trace } = makeBoard(dom, sunday, R);
  const who = shuffle(NAMES.slice(), R).slice(0, sunday ? 3 : 2);
  const cardRows = [];
  for (let c = 0; c < cards.length; c += 3) cardRows.push('      ' + cards.slice(c, c + 3).map((cd) => `{ ${Object.entries(cd).map(([k, v]) => `${k}: ${q(v)}`).join(', ')} }`).join(', ') + ',');
  rows.push(`  {
    num: ${num}, quizId: 'hearsay-${m}-${d}-${String(y).slice(2)}', live: '${iso}', dateLabel: '${MONTHS[m - 1]} ${d}, ${y}', sunday: ${sunday},
    noun: ${q(dom[0])}, listLabel: ${q(dom[1])},
    attrs: [${dom[2].map(q).join(', ')}],
    who: [${who.map(q).join(', ')}],
    cards: [
${cardRows.join('\n')}
    ],
    script: [
${script.map((s) => `      { who: '${s.who}', type: '${s.type}'${s.other ? `, other: '${s.other}'` : ''} },`).join('\n')}
    ],
  },`);
  console.error(`#${num} ${iso}${sunday ? ' SUN' : ''} ${dom[0]}: ${cards.length} cards, trace ${trace.join('>')}, ${script.map((s) => s.who + ':' + s.type).join(' ')}`);
});

if (WRITE) {
  const bank = fs.readFileSync(BANK, 'utf8');
  const close = bank.lastIndexOf('];');
  fs.writeFileSync(BANK, bank.slice(0, close) + rows.join('\n') + '\n' + bank.slice(close));
  console.error(`appended ${rows.length} boards`);
} else console.error(`dry run: ${rows.length} boards (pass --write to append)`);
