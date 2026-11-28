// Generate new Warmer boards and append them to app/warmer/puzzles.js.
//
// WHAT A WARMER BOARD IS. One secret word a day. `order` is EVERY VOCAB index
// sorted by cosine similarity to that word, most-similar first, so order[0] is
// the answer itself and the client turns a guess into a rank by looking up its
// position. The answer is never stored as a string. That means a board is not
// a combinatorial object you can search for: it is 32,300 real similarity
// numbers, and they have to come from the real model or the game lies to the
// player about what is close to what.
//
// WHERE THE NUMBERS COME FROM. GloVe 6B 100d NATIVE vectors, exactly as the
// bank header and CLAUDE.md ("Regenerating a Warmer order") state. Stanford and
// HuggingFace are not reachable from the sandbox; registry.npmjs.org is, and
// `wink-embeddings-sg-100d` ships those very vectors as JSON. Despite the name
// it is GloVe 6B 100d: 341,479 words, `{ vectors: word -> [...100 dims, l2norm,
// index] }`, and its "the" row is byte-for-byte Stanford's glove.6B.100d "the".
// All 32,300 VOCAB words have a native vector in it — none has to be bridged or
// synthesized, which is the failure the July 2026 rebuild existed to remove.
//
//   npm pack wink-embeddings-sg-100d          # ~118MB tarball
//   tar xzf wink-embeddings-sg-100d-*.tgz     # ~307MB package/…json
//
// This script does both itself if the JSON is not already at $WARMER_EMB (or
// the default cache path below), then streams it — never JSON.parse of 307MB —
// pulling out only the 32,300 vectors VOCAB needs.
//
// PROOF THE PIPELINE IS THE ORIGINAL ONE. `--reproduce` recomputes the order of
// every FROZEN board from these vectors and diffs it against what shipped:
//
//   60 of the 74 frozen boards reproduce with ZERO differences.
//   The other 14 differ only in adjacent transpositions — 350 misplaced slots
//   out of 2,390,200 (0.0146%), every one of them a swap of two neighbouring
//   words whose cosine differs by less than 4.3e-8, i.e. last-bits rounding in
//   whatever numeric library the July 2026 rebuild summed with. Not one
//   mismatch is anything but an adjacent pair, and none is in a board's hot
//   zone in a way a player could feel.
//
// So new boards are on the same scale and from the same source as the frozen
// ones. Run --reproduce after ANY change here; if it stops reporting
// adjacent-only mismatches, the vectors or the metric have drifted and the bank
// would silently change difficulty. (Over the EXTENDED bank the same command
// reports 122/136 exact: the 62 boards this script wrote reproduce bit-for-bit,
// and the 350 residual slots are all still in those same 14 old boards.)
//
// HOW AN ANSWER IS CHOSEN. Not by search — by a hand-curated POOL below, every
// entry an ordinary word a general audience knows, each tagged with its part of
// speech and a broad semantic domain. The pool is deliberately far larger than
// the run needs (about 356 weekday and 125 Sunday words survive vetting for a
// 53/9 run) so the ceilings below have room to bite instead of just barely
// being satisfiable. On top of the tags, five machine gates run over the real
// vectors:
//
//   1. RANK BAND. Weekday answers land in vocab rank 460-3600 (the frozen bank
//      ran 453-3534). Sunday answers land past 5030 — verify-warmer's
//      RARE_FLOOR is 5000, and a floor is not a target, so both bands are split
//      into three sub-bands the run must spread across rather than parking just
//      above the floor: weekday 460-1200 / 1200-2300 / 2300-3600, Sunday
//      5030-6000 / 6000-7000 / 7000-9000.
//   2. PROPER-NOUN / NEIGHBOURHOOD GATE. At least 13 of an answer's top 15
//      neighbours must be real dictionary words (public/crux-words.txt). This
//      is the "eyeball the top 15" gate from CLAUDE.md turned into a check: it
//      is what rejects telescope (hubble, keck), beach (florida, newport),
//      apple (intel, dell, macintosh), chase (morgan, stanley), bell (smith,
//      johnson, shaw) and button (jenson, brawn). NECESSARY, NOT SUFFICIENT —
//      every survivor was then read with its neighbours in front of it, and
//      that pass is what cut hole (putt, birdie, bogey — golf), seat
//      (constituency, elected), memory (disk, computer), magnet (magnet
//      school), basket (layup, dunk), turf (racetrack) and a dozen more whose
//      hot zone is a different sense of the word than the player will assume.
//      There is no way to automate that; do it again for anything you add.
//   3. SEMANTIC SEPARATION, which is this game's real pool-variety rule, since
//      "domain" for a word game is ultimately a fact about vectors and not
//      about a label someone typed. Two floors, because the two jobs differ:
//        - past rank 150 in every OTHER NEW answer's order, both directions;
//        - past rank  80 in every FROZEN answer's order, both directions.
//      Per-board legality cannot see that the frozen bank already ran gold and
//      diamond as each other's #2 neighbour, mountain and canyon at #2, guitar
//      and piano at #3 — and that its MEDIAN board sits only 58 ranks from its
//      nearest other answer, with 38 of 74 inside 60. This segment does not do
//      that to itself or to the past. It also cannot promise a 300 floor
//      against a past that dense: at 300 the run dies after 30 boards, because
//      74 frozen answers have already claimed most of the ordinary semantic
//      space. 80 against the past is roughly 1.4x its own median and was the
//      widest floor that still reached 2026-11-30 without padding the pool with
//      words nobody would enjoy guessing.
//   4. NO REPEATED ANSWER (which verify-warmer also enforces) and no repeated
//      word FAMILY: no answer contains another or shares its five-letter
//      prefix, across the whole bank. Cosine does not catch this — "joy" and
//      "enjoy" cleared the rank floor comfortably and still landed on
//      consecutive days in an earlier run of this script.
//   5. US SPELLINGS, both ways. The shared scripts/us-spellings.mjs screen
//      rejects a British answer (VOCAB is an off-the-shelf list and carries
//      armour, colour, theatre, and the answer is revealed to the player, so it
//      is reader-facing copy). The mirror matters just as much: if one of the
//      three HOTTEST words is merely the other spelling of the answer, the
//      board's best clue is an orthography lesson, so it is rejected too. That
//      is what dropped behavior (behaviour at #1), recognize (recognise),
//      organization (organisation), center (centre), labor and armor.
//
// CEILINGS ACROSS THE RUN (nothing in the verifier caps these; they are this
// generator's own, and they are what stops 62 boards of the same idea):
//   - domain: at most 5 boards of the 62 in any one semantic domain (~8%), and
//     no domain may repeat inside a rolling window of 7 days, so no two boards
//     in the same week share one;
//   - part of speech: at most 40 nouns, at least 8 verbs and 8 adjectives, at
//     most 4 boards in a row sharing a part of speech, and the picker steers
//     each day towards a 58/21/21 noun/verb/adjective split rather than
//     spending all its non-nouns early and then stalling on the run rule;
//   - word length: no single length on more than 18 of the 62 boards, and at
//     least 5 distinct lengths must appear;
//   - rank sub-band: each of the three weekday sub-bands takes at least 14 of
//     the 53 weekday boards, and each Sunday sub-band at least 2 of the 9.
// The run prints all of these counts at the end. If a ceiling cannot be met the
// script STOPS at that date and says which ceiling failed, rather than shipping
// a flatter bank to reach a date.
//
// FROZEN. The script never parses-and-reprints the existing file: it appends
// text after the last existing board's closing brace, so every byte before it
// is untouched by construction, and it refuses to run if the bank's last date
// is not the one it expects.
//
// STORED FORM. A board is written as `board({ …, o })`, where `o` is the
// ranking packed three base64 characters per vocab index by
// app/warmer/order-codec.js — NOT as an array of 32,300 numeric literals. That
// is not a cosmetic choice: the array form is 32,300 AST nodes per board, five
// server modules import this bank for its dates alone, and at 136 boards
// `next build` was SIGKILLed parsing it. Every board is decoded and compared
// against the array it came from before this script writes anything.
//
// DETERMINISM. mulberry32 seeded with SEED_BASE + the first new board number,
// so an unchanged run reproduces byte-identically and the new segment cannot
// replay the frozen one's choices.
//
// Run: node scripts/gen-warmer.mjs --reproduce   check the pipeline vs frozen
//      node scripts/gen-warmer.mjs               plan the run, write nothing
//      node scripts/gen-warmer.mjs --write       append to app/warmer/puzzles.js
//      node scripts/verify-warmer.mjs            must pass afterwards
//
// Cache lives in /tmp/build/warmer-* and is cleared at the start of every run
// except the vector cache, which is a pure function of the pinned package and
// so cannot bleed stale boards; --fresh-vectors rebuilds that too. NOTE that
// the clear deletes anything else you park under /tmp/build/warmer-*, scratch
// scripts included.
//
// WHAT LIMITS THE NEXT EXTENSION. Not the calendar and not the search — the
// SEMANTIC SPACE. Every banked answer permanently removes its rank-80
// neighbourhood from the pool for everyone after it, and 136 answers now sit in
// there. Going much past this will mean either accepting a narrower frozen
// floor (say 60, still above the frozen bank's median) or curating a pool of
// ordinary words in neighbourhoods nobody has used yet. Do NOT reach for
// abstractions like "approximately" or "whatsoever" to make a date: they pass
// every gate here and make a bad puzzle.
//
// The other wall is file size, and it has already been hit once. Written as
// numeric arrays the bank reached 25MB / 4.4 million AST nodes at 136 boards
// and `next build` was SIGKILLed; boards are now stored packed (96,900 chars
// each, ~13.2MB for 136 — see app/warmer/order-codec.js), which builds with
// room to spare at a 3GB heap. That buys roughly another year of daily boards
// at ~97KB each before the question comes back; past that the answer is per-day
// files loaded by app/warmer/page.js, so the module graph never holds them all.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { VOCAB } from '../app/warmer/vocab.js';
import { PUZZLES } from '../app/warmer/puzzles.js';
import { encodeOrder, decodeOrder } from '../app/warmer/order-codec.js';
import { scanUS } from './us-spellings.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SRC = path.join(ROOT, 'app/warmer/puzzles.js');
const CRUX = path.join(ROOT, 'public/crux-words.txt');

const CACHE = '/tmp/build';
const EMB_DIR = path.join(CACHE, 'warmer-emb');
const VEC_BIN = path.join(CACHE, 'warmer-vectors.bin');
const PKG = 'wink-embeddings-sg-100d';

const LAST_FROZEN = '2026-12-29';   // the bank's current last day; asserted
const FIRST_NEW = '2026-12-30';
const LAST_NEW = '2026-12-31';   // run 5 (2026-11-27): Dec 30-31 at the loosened floor below
const SEED_BASE = 0x5741524d;       // "WARM"

const WK_BAND = [460, 3600];        // weekday answer vocab-rank band
const WK_SUB = [[460, 1200], [1200, 2300], [2300, 3600]];
const SU_SUB = [[5030, 6000], [6000, 7000], [7000, 9000]];
// Two separation floors, because the two jobs differ (see gate 3 in the header
// for the measurements behind these numbers). Inside this run the segment
// controls itself completely; against the 74 frozen answers it cannot, because
// the frozen bank's own median nearest-other-answer rank is 58, 38 of its 74
// boards sit inside 60, and its tightest pairs are at rank 2 (gold/diamond,
// mountain/canyon). Both floors are checked in BOTH directions.
// Run 5 (Dec 30-31, owner 2026-11-27: the gap can be loosened): 100, matching
// verify-warmer's SEP_LOOSE from LOOSE_FROM. Runs 2 to 4 were built at 150.
const SEP_NEW = 100;                // against another answer in this run
const SEP_FROZEN = 80;              // against a board that shipped before VARIETY_FROM
const VARIETY_FROM = '2026-09-30';  // verify-warmer's scope line
// verify-warmer's length cap over every board from VARIETY_FROM: 18 of the first 62,
// held as that share as the era grows (2026-11-22).
const eraLenCap = (n) => Math.ceil((18 / 62) * n);
// Vector distance does not catch word FAMILIES: "joy" and "enjoy" cleared the
// rank floor and still read as the same puzzle two days running. So no two
// answers in the bank may contain one another or share a five-letter prefix.
const STEM_PREFIX = 5;
const CLEAN_MIN = 13;               // of the top 15 neighbours, in the dictionary
// Run 3 (2026-11-22, Dec 1-15: 13 weekdays, 2 Sundays). The ceilings below were
// written for the 62-board run 2 and are scaled here to the same shares; run 2's
// values are in the comments. The header's numbers describe run 2.
const DOMAIN_CAP = 2;               // run 2: 5 of 62
const DOMAIN_WINDOW = 7;
const NOUN_CAP = 10;                // run 2: 40 of 62
const VERB_MIN = 0;                 // run 5 is two boards; run 4 (16 boards) had 2, run 2: 8
const ADJ_MIN = 0;                  // run 5 is two boards; run 4 had 2, run 2: 8
const POS_RUN_MAX = 4;
// Target share of the run per part of speech; the picker steers towards these
// every day rather than only checking the caps at the end.
const POS_TARGET = { n: 0.58, v: 0.21, a: 0.21 };
const LEN_CAP = 5;                  // run 2: 18 of 62
const LEN_DISTINCT_MIN = 2;         // run 5: two boards, two lengths; run 4: 4, run 2: 5
// Per sub-band. Run 3 found the 460-1200 band exhausted: against 136 banked
// answers at the 150-rank floor, two ordinary words in it survive vetting
// (forward, interested); everything else left is a function word.
const WK_SUB_MIN = [0, 0, 0];       // run 5 (two boards); run 4: [0, 3, 3] (460-1200 exhausted), run 3: [2, 3, 3]
const SU_SUB_MIN = 0;               // run 2: 2 of 9; two Sundays cannot fill three sub-bands

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------------------
// 2026-11-27 (run 4): the last 55 lines of WEEKDAY_POOL are candidates for Dec 16-31
// (45 verbs, then ten words a vocab scan found clear of every banked answer), each vetted by the gates below like every other line.
// 2026-11-22 (run 3): the first 27 lines of WEEKDAY_POOL were added after the
// 150-rank separation against the 62 run-2 boards left 20 weekday words; each was
// read with its top neighbours (auto-scan of VOCAB 460-3600, then hand-picked).
// The curated answer pool. `n` noun, `v` verb, `a` adjective. The second field
// is the broad semantic domain the ceilings count. Every word here was read
// with its top-15 GloVe neighbours in front of it; words whose neighbourhood
// turned out to be a brand, a surname or a different sense of the word are not
// in the list (see gate 2 above for the ones that were thrown out and why).
// ---------------------------------------------------------------------------
const WEEKDAY_POOL = `
trash n: waste
travel n: transport
keeping n: storage
network n: server
city n: downtown
chores n: cleaning
effort n: initiative
finance n: default
faith n: worship
company n: enterprise
meaning n: definition
screen v: click
leave v: quit
hit v: knock
motion v: shake
attention v: ignore
scarcity a: rare
quality a: pure
science a: chemical
chance a: random
time a: brief
feeling a: pleased
power a: electrical
speed a: rapid
law a: valid
direction a: forward
closed a: locked
interest a: interested
weather n: snow rain storm cloud wind
land n: valley village grass soil
material n: wood iron glass plastic coal salt crystal gas
plant n: tree flower
animal n: horse wolf chicken
food n: cheese butter rice bread sugar chocolate pizza
drink n: milk tea juice alcohol
meal n: kitchen dinner breakfast
body n: blood brain skin finger shoulder throat nose ear tongue
health n: therapy illness virus gene protein medicine surgery disease infection
home n: window roof door floor mirror furniture
building n: museum church prison factory library airport campus stadium
clothing n: shirt jacket dress
tool n: camera battery pen wire tape thread tube shield computer
vehicle n: truck plane trailer bike train ship boat
sport n: soccer tennis hockey football basketball baseball rugby golf swimming coach player player
art n: painting novel poetry photography dancing fashion picture photo image
media n: comedy movie magazine screen photo entertainment website
work n: student lawyer pilot writer journalist photographer teacher designer
law n: judge jury attorney election opinion
force n: army soldier gang cop volunteer
family n: uncle cousin crowd neighborhood marriage divorce
party n: holiday birthday wedding funeral anniversary celebration
feeling n: anger fear dream silence joy happiness comfort smile kiss laugh
money n: salary ticket bank fortune income
science n: laboratory satellite space physics chemistry psychology math
matter n: electricity carbon acid radiation agriculture
message n: letter map radio telephone mail paper prayer noise
thing n: box bag corner circle hero stranger joke
sense n: smell shock wisdom revenge sacrifice courage
idea n: answer evidence theory proof argument vision logic view
amount n: worth majority difference period
group n: base project respect
start n: action access born complete
option n: choice option selection draft advice comment
safety n: safety emergency insurance protection ambulance
trade n: contract purchase budget wealth license reform owner boss
study n: degree institute philosophy topic faculty method learning analysis
tech n: software equipment cable signal tool structure
place n: zone path edge facility background frame
plan n: schedule mission strike identity opportunity approach direction
person n: expert audience fan witness guide
trait n: attitude personality manner detail pattern
mark n: error sample tone image symbol
life n: environment household era labor lifestyle privacy
reward n: gift reward praise savings retirement
craft n: technique procedure experiment operation engineering skill
piece n: element component layer sequence angle dozen sum
goods n: kit pack tag trash resource hardware
show n: survey poll footage edition rating gaming
notion n: belief mood impression genius
route n: exit pace outcome input balance
pact n: treaty commitment proposal contrast comparison
civic n: principle liberty guidance certificate
case n: suit sport plot protest custom communication
speech v: listen explain teach promise swear speak describe argue reply suggest
making v: build repair collect print cook practice create develop operate
guard v: protect rescue hide save assist confirm
crime v: steal arrest hunt destroy capture
gather v: celebrate invite marry pray enjoy smile encourage introduce
change v: replace discover compete spend catch grab drive step improve handle choose
learn v: learn explore investigate recall reveal compare select identify reflect
offer v: offer provide obtain hire enable contribute contain aim prefer
mind v: admit deserve refuse deny remind engage prove perform
sound a: loud quiet
mood a: angry curious calm scary boring funny weird stupid awkward silly
manner a: honest wise secret polite fair personal
look a: bright cute gorgeous ugly odd elegant
scale a: massive tall rough rural wide quick
taste a: delicious brilliant excellent superb useful
grade a: legal professional powerful digital complex correct solid comfortable critical technical mobile
state a: negative positive permanent independent incredible similar likely private available essential accurate
speech v: whisper
collect v: gather
ascend v: climb
water v: swim
art v: paint
craft v: sew
garden v: plant
farm v: harvest
crease v: fold
mix v: stir
package v: wrap
pursuit v: chase
conceal v: hide
yell v: shout
prayer v: pray
election v: vote
song v: sing
dancing v: dance
humor v: laugh
rest v: sleep
excavate v: dig
liquid v: pour
boat v: sail
prey v: hunt
lease v: rent
fix v: repair
gauge v: measure
estimate v: guess
dispute v: argue
pardon v: forgive
guest v: invite
party v: celebrate
theft v: steal
discover v: explore
roam v: wander
loan v: borrow
lesson v: teach
kitchen v: cook
rinse v: wash
construct v: build
increase v: grow
lungs v: breathe
grin v: smile
posture v: kneel
cold v: shiver
refusal v: deny
annoyance v: bother
hush a: quiet
lesser a: minor
alliance n: partnership
suppose v: thinking
tend v: tendency
damaged a: damage
regime n: government
buried a: burial
`;

const SUNDAY_POOL = `
spice n: curry vanilla ginger lime chili cinnamon mustard mint sour
fruit n: peach pumpkin jelly crust cookie
kitchen n: spoon jar lid microwave scoop gum
home n: sofa balcony wallpaper foam hose envelope drain elevator dial
building n: altar shrine tile ceramic marble monument
ground n: gravel chalk vine sidewalk pond
animal n: owl ant goose squirrel worm insect snail puppy trout rabbit
body n: toe jaw kidney cheek limb skeleton thumb tooth pill vaccine
transport n: bicycle motorcycle ambulance runway wheelchair balloon
tool n: needle axe razor compass antenna bolt knot mesh backpack ladder
weapon n: shotgun pistol armor cannon
art n: painter dancer palette violet vinyl sculpture
people n: nephew cowboy sailor referee
game n: poker bingo cube puzzle hobby
thing n: coffin bracelet doll atom cement gallon trunk vitamin
weather n: tornado
sound v: whisper whistle shout cheer
action v: bounce float leap toss melt bake peel
give v: donate lend attach retire
watch v: stare glance
size a: delicate compact neat
charm a: adorable creepy eager
mood a: noisy polite messy elegant superb
taste a: tasty spicy salty thirsty
`;

// Two words that differ only by a US/British spelling convention.
const TWIN = [[/our$/, 'or'], [/re$/, 'er'], [/ise$/, 'ize'], [/isation$/, 'ization'],
  [/yse$/, 'yze'], [/ogue$/, 'og'], [/lling$/, 'ling'], [/lled$/, 'led'], [/ae/, 'e'], [/oe/, 'e']];
function spellingTwin(a, b) {
  if (a === b) return false;
  const fold = (w) => { let x = w; for (const [re, to] of TWIN) x = x.replace(re, to); return x; };
  return fold(a) === fold(b);
}

function parsePool(text) {
  const out = [];
  for (const line of text.trim().split('\n')) {
    const m = line.match(/^(\w+) ([nva]): (.+)$/);
    if (!m) throw new Error(`bad pool line: ${line}`);
    for (const w of m[3].trim().split(/\s+/)) out.push({ w, pos: m[2], dom: m[1] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vectors
// ---------------------------------------------------------------------------
function embJson() {
  if (process.env.WARMER_EMB && fs.existsSync(process.env.WARMER_EMB)) return process.env.WARMER_EMB;
  const p = path.join(EMB_DIR, 'package', `${PKG}.json`);
  if (fs.existsSync(p)) return p;
  fs.mkdirSync(EMB_DIR, { recursive: true });
  console.log(`fetching ${PKG} from registry.npmjs.org (~118MB) …`);
  execFileSync('npm', ['pack', PKG], { cwd: EMB_DIR, stdio: 'inherit' });
  const tgz = fs.readdirSync(EMB_DIR).find((f) => f.startsWith(PKG) && f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack produced no tarball');
  console.log('extracting …');
  execFileSync('tar', ['xzf', tgz], { cwd: EMB_DIR, stdio: 'inherit' });
  if (!fs.existsSync(p)) throw new Error(`expected ${p} after extract`);
  return p;
}

const N = VOCAB.length, D = 100;

// Stream the 307MB JSON and keep only the VOCAB rows. Regex over a sliding
// window; a full JSON.parse here needs well over a gigabyte and this box is
// shared.
function buildVectorCache() {
  const src = embJson();
  const idx = new Map(); VOCAB.forEach((w, i) => idx.set(w, i));
  const vec = new Float64Array(N * D);
  const got = new Uint8Array(N);
  const fd = fs.openSync(src, 'r');
  const CH = 1 << 24;
  const buf = Buffer.alloc(CH);
  const RE = /"((?:[^"\\]|\\.)*)":\[([^\]]*)\]/g;
  let pos = 0, tail = '', started = false, hits = 0;
  for (;;) {
    const n = fs.readSync(fd, buf, 0, CH, pos);
    if (!n) break;
    pos += n;
    let s = tail + buf.toString('latin1', 0, n);
    if (!started) {
      const k = s.indexOf('"vectors":{');
      if (k < 0) { tail = s.slice(-64); continue; }
      s = s.slice(k + 11); started = true;
    }
    RE.lastIndex = 0;
    let last = 0, m;
    while ((m = RE.exec(s))) {
      last = RE.lastIndex;
      const i = idx.get(m[1]);
      if (i === undefined || got[i]) continue;
      const parts = m[2].split(',');
      if (parts.length < D + 1) continue;
      for (let d = 0; d < D; d++) vec[i * D + d] = +parts[d];
      got[i] = 1; hits++;
    }
    tail = s.slice(last);
    if (tail.length > (1 << 20)) tail = tail.slice(-(1 << 20));
  }
  fs.closeSync(fd);
  if (hits !== N) {
    const miss = []; for (let i = 0; i < N; i++) if (!got[i]) miss.push(VOCAB[i]);
    throw new Error(`${miss.length} VOCAB words have no native vector (${miss.slice(0, 10).join(', ')}…). ` +
      'NEVER synthesize or bridge one — that is the bug the July 2026 rebuild removed.');
  }
  const out = Buffer.alloc(8 + N * D * 8);
  out.writeUInt32LE(N, 0); out.writeUInt32LE(D, 4);
  for (let i = 0; i < N * D; i++) out.writeDoubleLE(vec[i], 8 + i * 8);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(VEC_BIN, out);
  console.log(`vector cache: ${N} words x ${D} dims -> ${VEC_BIN}`);
  return vec;
}

function loadVectors(fresh) {
  if (!fresh && fs.existsSync(VEC_BIN)) {
    const raw = fs.readFileSync(VEC_BIN);
    if (raw.readUInt32LE(0) === N && raw.readUInt32LE(4) === D) {
      const vec = new Float64Array(N * D);
      for (let i = 0; i < N * D; i++) vec[i] = raw.readDoubleLE(8 + i * 8);
      return vec;
    }
  }
  return buildVectorCache();
}

// ---------------------------------------------------------------------------
// The metric. Ordering only depends on dot(answer, w) / |w|, but the full
// cosine is computed anyway so the printed numbers are the real thing.
// Ties break on ascending vocab index, which is what makes the build
// deterministic.
// ---------------------------------------------------------------------------
function makeSim(vec) {
  const norm = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0; for (let d = 0; d < D; d++) { const v = vec[i * D + d]; s += v * v; }
    norm[i] = Math.sqrt(s);
  }
  const sims = (a) => {
    const s = new Float64Array(N), q = a * D;
    for (let i = 0; i < N; i++) {
      let t = 0; const o = i * D;
      for (let d = 0; d < D; d++) t += vec[o + d] * vec[q + d];
      s[i] = t / (norm[i] * norm[a]);
    }
    return s;
  };
  const order = (a) => {
    const s = sims(a);
    const arr = new Array(N); for (let i = 0; i < N; i++) arr[i] = i;
    arr.sort((x, y) => (s[y] - s[x]) || (x - y));
    return arr;
  };
  return { sims, order };
}

// ---------------------------------------------------------------------------
// --reproduce: recompute every frozen board and diff
// ---------------------------------------------------------------------------
function reproduce(order) {
  let perfect = 0, total = 0, nonAdjacent = 0, maxGap = 0, worst = null;
  for (const p of PUZZLES) {
    const mine = order(p.order[0]);
    let d = 0;
    for (let i = 0; i < N; i++) if (mine[i] !== p.order[i]) d++;
    for (let i = 0; i < N; i++) if (mine[i] !== p.order[i]) {
      const ok = (i + 1 < N && mine[i] === p.order[i + 1] && mine[i + 1] === p.order[i])
              || (i > 0 && mine[i] === p.order[i - 1] && mine[i - 1] === p.order[i]);
      if (!ok) nonAdjacent++;
    }
    if (!d) perfect++; else if (!worst || d > worst.d) worst = { id: p.quizId, d };
    total += d;
  }
  console.log(`frozen boards reproduced exactly: ${perfect}/${PUZZLES.length}`);
  console.log(`misplaced slots: ${total} of ${PUZZLES.length * N} (${(100 * total / (PUZZLES.length * N)).toFixed(5)}%)`);
  console.log(`mismatches not explained by an adjacent transposition: ${nonAdjacent}`);
  if (worst) console.log(`worst board: ${worst.id} (${worst.d} slots)`);
  if (nonAdjacent) { console.error('PIPELINE DRIFT: a mismatch is not a near-tie swap. Do NOT ship.'); process.exit(1); }
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const dayMs = 86400000;
function dates(from, to) {
  const out = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += dayMs) out.push(iso(t));
  return out;
}
const isSunday = (d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 0;
function quizId(d) { const [Y, M, DD] = d.split('-').map(Number); return `warmer-${M}-${DD}-${String(Y).slice(2)}`; }
function dateLabel(d) { const [Y, M, DD] = d.split('-').map(Number); return `${MONTHS[M - 1]} ${DD}, ${Y}`; }

// ---------------------------------------------------------------------------
// Round-trip guard: the bank stores `o`, so a board is only as good as its
// encoding. Checked here at write time and again, on the whole bank, by
// scripts/verify-warmer.mjs.
function decodeCheck(o, order, id) {
  const back = decodeOrder(o);
  if (back.length !== order.length) throw new Error(`${id}: encoded length ${back.length} != ${order.length}`);
  for (let i = 0; i < order.length; i++) {
    if (back[i] !== order[i]) throw new Error(`${id}: encoded order differs at ${i}`);
  }
  return back;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const doReproduce = args.includes('--reproduce');
  const fresh = args.includes('--fresh-vectors');

  // Clear the board cache at the start of every run so a resumed cache cannot
  // bleed old boards into new output. The vector cache is a pure function of
  // the pinned package, so it survives unless --fresh-vectors.
  for (const f of fs.existsSync(CACHE) ? fs.readdirSync(CACHE) : []) {
    if (f.startsWith('warmer-') && f !== 'warmer-emb' && path.join(CACHE, f) !== VEC_BIN) {
      fs.rmSync(path.join(CACHE, f), { recursive: true, force: true });
    }
  }

  const vec = loadVectors(fresh);
  const { order } = makeSim(vec);

  if (doReproduce) { reproduce(order); return; }

  // ---- frozen-bank assertions ---------------------------------------------
  const last = PUZZLES[PUZZLES.length - 1];
  if (last.live !== LAST_FROZEN) throw new Error(`bank ends ${last.live}, expected ${LAST_FROZEN}; update LAST_FROZEN deliberately`);
  const startNum = last.num + 1;

  const crux = new Set(fs.readFileSync(CRUX, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean));
  const vidx = new Map(); VOCAB.forEach((w, i) => vidx.set(w, i));

  // Frozen answers, and their orders, for the separation rule.
  const frozen = PUZZLES.map((p) => ({ a: p.order[0], w: VOCAB[p.order[0]], live: p.live, rank: (() => {
    const r = new Int32Array(N); for (let i = 0; i < p.order.length; i++) r[p.order[i]] = i; return r;
  })() }));
  const frozenWords = new Set(frozen.map((f) => f.w));

  // ---- vet the pool --------------------------------------------------------
  const cache = new Map();       // word -> { i, order, rank, clean }
  function vet(entry, band) {
    const i = vidx.get(entry.w);
    if (i === undefined) return { ...entry, reject: 'not in VOCAB' };
    if (frozenWords.has(entry.w)) return { ...entry, reject: 'already a frozen answer' };
    if (i < band[0] || i > band[1]) return { ...entry, reject: `rank ${i} outside ${band[0]}-${band[1]}` };
    let c = cache.get(entry.w);
    if (!c) {
      const ord = order(i);
      const rank = new Int32Array(N); for (let k = 0; k < N; k++) rank[ord[k]] = k;
      const clean = ord.slice(1, 16).filter((j) => crux.has(VOCAB[j])).length;
      c = { i, order: ord, rank, clean };
      cache.set(entry.w, c);
    }
    if (c.clean < CLEAN_MIN) return { ...entry, reject: `neighbourhood ${c.clean}/15 in dictionary` };
    // Rule 8 of the authoring standard: the answer IS reader-facing (it is
    // revealed at the end of the round), and VOCAB is an off-the-shelf list
    // that carries British forms — armour, colour, theatre all live in it.
    const brit = scanUS(entry.w);
    if (brit.length) return { ...entry, reject: `British spelling (US: ${brit[0].us})` };
    // …and the mirror of that: if the HOTTEST word on the board is just the
    // other side of the Atlantic spelling the answer, the board's best clue is
    // an orthography lesson. "behavior" led with "behaviour", "recognize" with
    // "recognise", "organization" with "organisation", "center" with "centre".
    for (const j of c.order.slice(1, 4)) {
      if (spellingTwin(entry.w, VOCAB[j])) return { ...entry, reject: `hot word "${VOCAB[j]}" is the same word, other spelling` };
    }
    // separation from every frozen answer, both directions
    for (const f of frozen) {
      // verify-warmer holds every board from VARIETY_FROM to the in-run floor,
      // so a banked board of an earlier extension is "new" to it, not frozen.
      const sep = f.live >= VARIETY_FROM ? SEP_NEW : SEP_FROZEN;
      if (c.rank[f.a] <= sep) return { ...entry, reject: `too close to banked "${f.w}" (rank ${c.rank[f.a]}, floor ${sep})` };
      if (f.rank[i] <= sep) return { ...entry, reject: `banked "${f.w}" ranks it ${f.rank[i]} (floor ${sep})` };
      if (entry.w.includes(f.w) || f.w.includes(entry.w)) return { ...entry, reject: `same word family as frozen "${f.w}"` };
    }
    return { ...entry, i, ...c };
  }

  const wkAll = parsePool(WEEKDAY_POOL).map((e) => vet(e, WK_BAND));
  const suAll = parsePool(SUNDAY_POOL).map((e) => vet(e, [SU_SUB[0][0], SU_SUB[2][1]]));
  const wk = wkAll.filter((e) => !e.reject);
  const su = suAll.filter((e) => !e.reject);
  console.log(`pool: weekday ${wk.length}/${wkAll.length} vetted, sunday ${su.length}/${suAll.length} vetted`);
  for (const e of [...wkAll, ...suAll]) if (e.reject) console.log(`   drop ${e.w.padEnd(13)} ${e.reject}`);

  // ---- the run -------------------------------------------------------------
  const days = dates(FIRST_NEW, LAST_NEW);
  const rnd = mulberry32(SEED_BASE + startNum);
  const nSun = days.filter(isSunday).length;
  const nWk = days.length - nSun;

  // Deterministic sub-band schedule: rotate 0,1,2 and shuffle within each block
  // of three, so the run walks the whole band instead of clustering.
  function subSchedule(count, rnd) {
    const out = [];
    while (out.length < count) out.push(...shuffle([0, 1, 2], rnd));
    return out.slice(0, count);
  }
  const wkSched = subSchedule(nWk, rnd);
  const suSched = subSchedule(nSun, rnd);

  const picked = [];
  const domCount = new Map(), lenCount = new Map(), posCount = { n: 0, v: 0, a: 0 };
  const eraLen = new Map();
  PUZZLES.filter((p) => p.live >= VARIETY_FROM).forEach((p) => { const L = VOCAB[p.order[0]].length; eraLen.set(L, (eraLen.get(L) || 0) + 1); });
  const ERA_LEN_CAP = eraLenCap(PUZZLES.filter((p) => p.live >= VARIETY_FROM).length + days.length);
  const wkSubCount = [0, 0, 0], suSubCount = [0, 0, 0];
  let wkSeen = 0, suSeen = 0;

  const family = (a, b) => a.includes(b) || b.includes(a) ||
    (a.length >= STEM_PREFIX && b.length >= STEM_PREFIX && a.slice(0, STEM_PREFIX) === b.slice(0, STEM_PREFIX));

  function separated(cand) {
    for (const p of picked) {
      if (cand.rank[p.i] <= SEP_NEW) return false;
      if (p.rank[cand.i] <= SEP_NEW) return false;
      if (family(cand.w, p.w)) return false;
    }
    return true;
  }

  for (const d of days) {
    const sun = isSunday(d);
    const pool = sun ? su : wk;
    const sub = sun ? SU_SUB[suSched[suSeen]] : WK_SUB[wkSched[wkSeen]];
    const left = days.length - picked.length;

    // Quota pressure: if the remaining days are exactly what the POS minimums
    // still need, restrict to those parts of speech.
    const needV = Math.max(0, VERB_MIN - posCount.v);
    const needA = Math.max(0, ADJ_MIN - posCount.a);
    const forced = (needV + needA >= left) ? (needV && needA ? ['v', 'a'] : needV ? ['v'] : ['a']) : null;

    const recentDoms = picked.slice(-DOMAIN_WINDOW).map((p) => p.dom);
    const posRun = (() => {
      let k = 0; for (let i = picked.length - 1; i >= 0; i--) { if (picked[i].pos === picked[picked.length - 1].pos) k++; else break; }
      return picked.length ? { pos: picked[picked.length - 1].pos, k } : null;
    })();

    const eligible = shuffle(pool, rnd).filter((c) => {
      if (picked.some((p) => p.w === c.w)) return false;
      if ((domCount.get(c.dom) || 0) >= DOMAIN_CAP) return false;
      if (recentDoms.includes(c.dom)) return false;
      if (c.pos === 'n' && posCount.n >= NOUN_CAP) return false;
      if ((lenCount.get(c.w.length) || 0) >= LEN_CAP) return false;
      if ((eraLen.get(c.w.length) || 0) + (lenCount.get(c.w.length) || 0) >= ERA_LEN_CAP) return false;
      if (posRun && posRun.k >= POS_RUN_MAX && c.pos === posRun.pos) return false;
      if (forced && !forced.includes(c.pos)) return false;
      if (!separated(c)) return false;
      return true;
    });

    // Choose deterministically: the day's rank sub-band first, then whichever
    // part of speech is furthest behind its target share of the run, then the
    // seeded shuffle order. Balancing here rather than only capping at the end
    // is what keeps a noun-heavy pool from spending every non-noun early and
    // then stalling against the run-length rule.
    const scored = eligible.map((c, ix) => ({
      c, ix,
      band: (c.i >= sub[0] && c.i < sub[1]) ? 0 : 1,
      deficit: posCount[c.pos] - POS_TARGET[c.pos] * (picked.length + 1),
    }));
    scored.sort((x, y) => x.band - y.band || x.deficit - y.deficit || x.ix - y.ix);
    let choice = scored.length ? scored[0].c : null;
    if (!choice) {
      console.error(`\nSTOPPED at ${d}: no candidate satisfies the ceilings. ` +
        `${picked.length} boards planned (through ${picked.length ? days[picked.length - 1] : 'none'}).`);
      break;
    }
    const band = sun ? SU_SUB : WK_SUB;
    const which = band.findIndex(([lo, hi]) => choice.i >= lo && choice.i < hi);
    if (sun) { suSubCount[Math.max(0, which)]++; suSeen++; } else { wkSubCount[Math.max(0, which)]++; wkSeen++; }

    picked.push({ ...choice, date: d, sunday: sun });
    domCount.set(choice.dom, (domCount.get(choice.dom) || 0) + 1);
    lenCount.set(choice.w.length, (lenCount.get(choice.w.length) || 0) + 1);
    posCount[choice.pos]++;
  }

  // ---- ceilings report + hard checks ---------------------------------------
  console.log(`\nplanned ${picked.length} boards, ${picked[0].date} .. ${picked[picked.length - 1].date}`);
  console.log(`part of speech: nouns ${posCount.n} (cap ${NOUN_CAP}), verbs ${posCount.v} (min ${VERB_MIN}), adjectives ${posCount.a} (min ${ADJ_MIN})`);
  console.log(`lengths: ${[...lenCount.entries()].sort((a, b) => a[0] - b[0]).map(([l, c]) => `${l}:${c}`).join('  ')} (cap ${LEN_CAP} each, ${lenCount.size} distinct, min ${LEN_DISTINCT_MIN})`);
  console.log(`domains (cap ${DOMAIN_CAP}): ${[...domCount.entries()].sort((a, b) => b[1] - a[1]).map(([d, c]) => `${d}:${c}`).join('  ')}`);
  console.log(`weekday rank sub-bands: ${wkSubCount.join('/')} (min ${WK_SUB_MIN} each)   sunday: ${suSubCount.join('/')} (min ${SU_SUB_MIN} each)`);
  const ranks = picked.filter((p) => !p.sunday).map((p) => p.i).sort((a, b) => a - b);
  const sranks = picked.filter((p) => p.sunday).map((p) => p.i).sort((a, b) => a - b);
  console.log(`weekday answer ranks ${ranks[0]}..${ranks[ranks.length - 1]}   sunday ${sranks[0]}..${sranks[sranks.length - 1]}`);

  const fail = [];
  if (posCount.n > NOUN_CAP) fail.push('noun cap');
  if (posCount.v < VERB_MIN) fail.push('verb minimum');
  if (posCount.a < ADJ_MIN) fail.push('adjective minimum');
  if (lenCount.size < LEN_DISTINCT_MIN) fail.push('distinct lengths');
  for (const [l, c] of lenCount) if (c > LEN_CAP) fail.push(`length ${l} cap`);
  for (const [d, c] of domCount) if (c > DOMAIN_CAP) fail.push(`domain ${d} cap`);
  if (picked.length === days.length) {
    wkSubCount.forEach((c, k) => { if (c < WK_SUB_MIN[k]) fail.push('weekday sub-band minimum'); });
    for (const c of suSubCount) if (c < SU_SUB_MIN) fail.push('sunday sub-band minimum');
  }
  if (fail.length) { console.error(`\nCEILINGS NOT MET: ${fail.join(', ')}`); process.exit(1); }

  // ---- build the boards ----------------------------------------------------
  const boards = picked.map((p, k) => {
    const ord = p.order;
    if (ord.length !== N) throw new Error(`order length ${ord.length}`);
    if (ord[0] !== p.i) throw new Error(`order[0] is not the answer for ${p.w}`);
    const seen = new Uint8Array(N);
    for (const v of ord) { if (!Number.isInteger(v) || v < 0 || v >= N || seen[v]) throw new Error(`order not a permutation for ${p.w}`); seen[v] = 1; }
    if (p.sunday && ord[0] < 5000) throw new Error(`sunday answer ${p.w} is rank ${ord[0]}, under RARE_FLOOR`);
    return {
      num: startNum + k,
      quizId: quizId(p.date),
      live: p.date,
      dateLabel: dateLabel(p.date),
      sunday: p.sunday,
      order: ord,
      word: p.w, pos: p.pos, dom: p.dom,
    };
  });

  console.log('');
  for (const b of boards) {
    const hot = b.order.slice(1, 7).map((j) => VOCAB[j]).join(', ');
    console.log(`${String(b.num).padStart(3)} ${b.live} ${b.sunday ? 'SUN' : '   '} ${b.word.padEnd(13)} rank ${String(b.order[0]).padStart(5)}  ${b.pos}/${b.dom.padEnd(10)} hot: ${hot}`);
  }

  if (!write) { console.log('\n(dry run — pass --write to append)'); return; }

  const text = fs.readFileSync(SRC, 'utf8');
  if (!text.endsWith('];\n')) throw new Error('puzzles.js does not end with "];\\n"; refusing to splice');
  const before = text.slice(0, text.length - 3);
  const chunks = boards.map((b) => {
    const o = encodeOrder(b.order);
    // Never write a board whose stored string does not read back as what we meant.
    const back = (0, decodeCheck)(o, b.order, b.quizId);
    return `  board({\n    num: ${b.num},\n    quizId: '${b.quizId}',\n    live: '${b.live}',\n` +
      `    dateLabel: '${b.dateLabel}',\n    sunday: ${b.sunday},\n    o: '${o}',\n  }),\n`;
  });
  fs.writeFileSync(SRC, before + chunks.join('') + '];\n');
  console.log(`\nappended ${boards.length} boards to ${SRC} (bytes before the splice are untouched)`);
  console.log('now run: node scripts/verify-warmer.mjs');
}

main();
