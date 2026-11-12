#!/usr/bin/env node
// gen-axiom — bank generator for Axiom, the daily rule-induction game.
//
// A board is 24 word tiles (28 on Sunday) and five candidate rules (seven on
// Sunday). EXACTLY ONE candidate agrees with every tile; the bank never stores
// which, so the client re-derives it. The puzzle is therefore not the words at
// all, it is the ELIMINATION STRUCTURE: which candidate the two gift reds kill,
// which survive to be decoys, and how many tests it takes to separate them.
// Everything below exists to get that structure exactly right and then to stop
// the bank from saying the same thing every day.
//
//   node scripts/gen-axiom.mjs --from 2026-09-30 --to 2026-11-30 \
//        --out /tmp/build/axiom-new.js
//   node scripts/_splice.mjs axiom /tmp/build/axiom-new.js
//   node scripts/verify-axiom.mjs
//
// --from defaults to the day after the live bank's last board and --num to the
// number after its last num, so the normal invocation is just --out. The bank
// is APPEND-ONLY: this script never reads a board back out to rewrite it, and
// _splice.mjs aborts if any date it is handed is already banked. There is no
// resume file and nothing cached between runs — 62 boards take about five
// seconds — so a stale cache can never bleed old boards into new output.
//
// ── WHERE THE MATHS COMES FROM ─────────────────────────────────────────────
// ruleFn, HIDDEN and SETS are not copied here. They are sliced out of
// app/axiom/AxiomClient.jsx at run time and evaluated, so the generator scores
// a tile with the CLIENT's own arithmetic and a third copy can never drift.
// The near-miss tables (C11) are sliced the same way out of
// scripts/verify-axiom.mjs, which is where they are curated. That leaves the
// verifier's own ruleFn as the one independent implementation, which is the
// point: it proves the bank against maths this script never ran.
//
// ── THE STRUCTURE, AS THE SEARCH SEES IT ───────────────────────────────────
// Fix an answer A and R-1 decoys. Every pool word w gets a verdict v = A(w) and
// a KILL MASK: the set of decoys that disagree with A on w. Then
//
//   green givens  mask empty AND v true      (C2: every candidate must call all
//                                             three gift greens true)
//   red givens    v false, and the decoys they call true are exactly the set D
//                 we chose to kill (C3: 1-2 of them, 1-3 on Sunday)
//   testable      any word whose mask ∩ live-decoys is a PROPER subset of the
//                 live decoys — a tile that kills every live decoy at once is a
//                 one-shot solve and C6 forbids it
//   trap          mask ∩ live = ∅ (C5 wants >= 6: testing one teaches nothing)
//
// So a board is chosen by picking counts per mask class, and every quantity the
// verifier measures falls straight out of those counts:
//   informative = tiles with a non-empty live mask   (C8: >= 8, 10 on Sunday)
//   perfect-2 pairs = Σ n_a·n_b over class pairs whose masks union to the whole
//   live set (C9: >= 12% of all testable pairs, 9% on Sunday)
// With two live decoys their killer sets must be DISJOINT (a shared tile would
// be a one-shot), so pairs = |K1|·|K2| and C9 forces |K1|+|K2| >= 10 on a
// weekday however comfortably C8's floor of 8 is met. That is the single most
// useful fact here: C8 is never the binding constraint, C9 is.
//
// ── WHAT THIS GUARANTEES PER BOARD ─────────────────────────────────────────
// selfCheck() re-derives C1-C11 from the finished tile list before a board is
// kept, with no reference to the buckets it was built from. Nothing is emitted
// on the generator's say-so.
//
// ── AND ACROSS THE BANK (the variety ceilings, which C10 does not check) ───
// C10 only asks that no rule kind is a free cross-out: every kind appearing
// four times or more has to be the answer between 8% and 75% of the time, and
// no candidate slot may hold 45% of the answers. That is a floor, and a bank
// can clear it while still being the same puzzle every day. So, on top:
//
//   * ANSWER KIND: a balanced schedule, built up front, shuffled, and treated
//     as a MULTISET — if today's kind will not build, the fallback comes from
//     the kinds still owed a board, so the finished counts equal the plan. No
//     kind is the answer on more than 6 of the new boards (~10%).
//   * ANSWER SPEC: a kind with several specs ("vowels 2", "no letter C") is
//     the answer at most 4 times, a topic or hidden-word spec at most 2.
//   * CANDIDATE QUOTAS: how often each kind may APPEAR is solved for, not
//     sampled. Given the schedule, n_k is fitted so the finished bank-wide
//     answer rate for every kind lands inside [0.14, 0.45]; the run then
//     asserts the realised rates against [0.13, 0.45] and exits non-zero if it
//     missed. This is what breaks the legacy bank's habit — "no letter X" was
//     70 of its 328 candidate slots, 21%, and it is the answer on 19% of them,
//     so it cannot simply be dropped; it is rationed to about 50 of the new
//     328 instead, and the freed slots go to the eight kinds the old bank used
//     under a dozen times each.
//   * TOPIC AND HIDDEN-WORD rules are capped harder still (<= 9 appearances
//     each over the run, at most one of each per board). They are a trivia
//     beat, and every board carrying one also has to survive C11, which bans
//     any tile a reasonable person would classify into the set when the array
//     leaves it out.
//   * PAIRINGS: no two boards may carry the same set of candidate specs, and no
//     ordered (answer spec, decoy spec) pairing recurs more than 4 times.
//   * TILES: a word appears on at most 2 new boards and at most 3 across the
//     whole bank counting the frozen ones, and no two boards share more than 5
//     words. Over 62 boards that is ~1,380 distinct words for ~1,520 tiles.
//   * SHAPE: trap count, informative count, perfect-2 density, how many
//     candidates the reds kill and how many decoys survive are each sampled
//     across a band rather than pinned to a floor. Realised over the 62: traps
//     6-11, informative 10-17, perfect-2 density 9-26%, live decoys 2-4.
//
// ── WORD POOL ──────────────────────────────────────────────────────────────
// public/crux-words.txt (the site dictionary), 4-9 letters, over a Zipf floor
// from scripts/.lode-freq.json that RISES for short words (3.5 at four letters,
// 3.3 at five, 3.2 above) because the junk in a Scrabble list crossed with a
// frequency table is concentrated in the short entries. Then out come the
// proper-noun and unsavoury blocklists from scripts/barter-core.mjs, anything
// scanUS() calls British, anything the systematic British screen below calls
// British, and this file's own AVOID / NOTWORDS / PEOPLE lists.
//
// Those three lists are hand-curated and always will be. There is no rule that
// separates BOKO, MEIN, ALBA and SAMA from TOFU, KIWI and FLEA — they sit at
// the same frequency — so the only honest method is to read what the run
// actually shipped and add what should not have been there. Five passes got
// the ~1,400 words this run emits down to names that are also words (MADDEN,
// SKINNER). Grow the lists whenever the bank is extended, the same way
// verify-axiom.mjs grows its near-miss tables.
//
// 3-letter words are excluded outright: .lode-freq.json carries no frequency
// under four letters, so there is nothing to screen them with, and a 3-letter
// tile on a hidden-word board is usually the hidden word itself, which C11
// bans. Country names are excluded from the general pool as proper nouns and
// unioned back in only for the boards whose candidates are about countries.
//
// ── THINGS THAT COST AN HOUR TO REDISCOVER ─────────────────────────────────
//   * The gift greens must satisfy EVERY candidate, so a rule set is only legal
//     if all R rules have a common true region with words in it. Two `len`
//     candidates, or `vowels 1` with `vowels 2`, have an empty one and can
//     never be a board. The search therefore GROWS a rule set one decoy at a
//     time, keeping the green region not just non-empty but with HEAD-ROOM for
//     the rules still to come, instead of sampling R rules and hoping.
//   * Quotas must STEER, never block. Three separate hard caps (the kind quota,
//     a per-spec cap applied to single-spec kinds, and a Sunday reserve) each
//     in turn emptied the catalogue and made every Sunday in the back half of
//     the run unbuildable, because seven candidates with a shared green region
//     can only be assembled out of the LOOSE rules. If a run stops short, the
//     line it prints names the stage every attempt died at; `grow` means the
//     rule set could not be assembled and the caps are the first suspect.
//   * `budget` is deliberately NOT varied. It is 6 on a weekday and 7 on
//     Sunday on every board the bank has ever shipped, C6 pins the true cost of
//     a board at exactly 2 tests, and the allowance is the daily contract
//     rather than a difficulty dial. The dials that DO vary are the ones above.
//   * `hides` matches with a plain includes(), so a tile that IS the hidden
//     word scores true and reads false to a player. Filter the pool, do not
//     tighten the evaluator: it is shared with boards already played.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanUS } from './us-spellings.mjs';
import { PUZZLES } from '../app/axiom/puzzles.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// ── CLI ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (f, d) => { const i = argv.indexOf(f); return i < 0 ? d : argv[i + 1]; };
const OUT = arg('--out', '/tmp/build/axiom-new.js');
const TO = arg('--to', '2026-11-30');
const VERBOSE = argv.includes('--verbose');

const lastLive = PUZZLES[PUZZLES.length - 1].live;
const nextDay = (iso) => new Date(Date.parse(iso + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10);
const FROM = arg('--from', nextDay(lastLive));
// Everything strictly before --from is the frozen past, and it is the ONLY
// thing the whole-bank ceilings, the answer-rate fit and the word counts are
// measured against. That is what makes a run reproducible after it has been
// spliced: re-running with the same --from over the bank this script's own
// output is already in re-derives the identical segment, because the boards at
// or after --from are ignored. It never writes to the bank; _splice.mjs does,
// and refuses any date already banked.
const PRIOR = PUZZLES.filter((p) => p.live < FROM);
if (!PRIOR.length) { console.error(`gen-axiom: --from ${FROM} leaves no banked history to measure against`); process.exit(1); }
const NUM0 = Number(arg('--num', PRIOR[PRIOR.length - 1].num + 1));
if (FROM <= lastLive) console.error(`gen-axiom: NOTE --from ${FROM} re-derives a segment the bank already holds through ${lastLive}; _splice.mjs will refuse it. THE PAST IS FROZEN.`);

// ── the client's own maths, sliced out rather than copied ──────────────────
function braceBlock(src, head, label) {
  const i = src.indexOf(head);
  if (i < 0) throw new Error(`gen-axiom: cannot find ${label} — has the source moved?`);
  let d = 0; const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}' && !--d) return src.slice(j, k + 1);
  }
  throw new Error(`gen-axiom: unbalanced ${label}`);
}
const CLIENT = readFileSync(join(ROOT, 'app/axiom/AxiomClient.jsx'), 'utf8');
const HIDDEN = new Function(`return ${braceBlock(CLIENT, 'const HIDDEN = {', 'HIDDEN')}`)();
const SETS = new Function(`return ${braceBlock(CLIENT, 'const SETS = {', 'SETS')}`)();
const ruleFn = new Function('HIDDEN', 'SETS', `
  const VOW = new Set(['A','E','I','O','U']);
  const nv = (w) => [...w].filter((c) => VOW.has(c)).length;
  return function ruleFn(r) ${braceBlock(CLIENT, 'function ruleFn(r) {', 'ruleFn')};
`)(HIDDEN, SETS);

// ── the verifier's curated near-miss tables, likewise ──────────────────────
const VERIFY = readFileSync(join(ROOT, 'scripts/verify-axiom.mjs'), 'utf8');
const nearSrc = VERIFY.slice(VERIFY.indexOf('const NEAR_FROM'), VERIFY.indexOf('PUZZLES.forEach((p) => {\n  if (p.live < NEAR_FROM)'));
if (!nearSrc.includes('HIDDEN_NEAR')) throw new Error('gen-axiom: cannot find the C11 near-miss tables in verify-axiom.mjs');
const { NEAR, HIDDEN_NEAR } = new Function('SETS', 'HIDDEN', `${nearSrc}; return { NEAR, HIDDEN_NEAR };`)(SETS, HIDDEN);

const keyOf = (r) => r.k + (r.n !== undefined ? r.n : '') + (r.c || '') + (r.set || '');

// ── word pool ──────────────────────────────────────────────────────────────
// Zipf floor, by length. The junk in a Scrabble dictionary crossed with a
// frequency table is concentrated in the short entries — BOKO, MEIN, ALBA,
// MANA, RAJA, TORO and BOIS all clear 3.2 — because a four-letter string gets
// its count from every proper noun, foreign word and abbreviation that happens
// to be spelled that way. Longer entries are self-selecting. This costs a few
// good short words (TOFU, KIWI, PLOW) and is worth it.
const ZIPF_FLOOR = { 4: 3.5, 5: 3.3 };
const ZIPF_DEFAULT = 3.2;
const FREQ = JSON.parse(readFileSync(join(HERE, '.lode-freq.json'), 'utf8'));
const DICT = readFileSync(join(ROOT, 'public/crux-words.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const BARTER = readFileSync(join(HERE, 'barter-core.mjs'), 'utf8');
const blocklist = (name) => {
  const i = BARTER.indexOf(`const ${name} = new Set([`);
  if (i < 0) throw new Error(`gen-axiom: barter-core.mjs has no ${name}`);
  return new Set(new Function(`return [${BARTER.slice(BARTER.indexOf('[', i) + 1, BARTER.indexOf(']);', i))}]`)());
};
const NAMES = blocklist('NAMES'); const NASTY = blocklist('NASTY'); const BRITISH = blocklist('BRITISH');
// The shared blocklists in barter-core.mjs were written for a five- and
// seven-letter pool and miss plenty at 4-9 letters. These are the additions
// this bank's own word list turned up, kept HERE rather than pushed into
// barter-core: that file gates a live bank of its own and widening it there
// would move boards that are already banked.
//
// Stems no daily should print. Checked as substrings, so one entry covers a
// family (ABUS covers ABUSE/ABUSED/ABUSERS).
const AVOID = ['SUICID', 'RAPE', 'RAPIST', 'MOLEST', 'MURDER', 'CORPSE', 'SLAVE', 'NAZI', 'JIHAD', 'SPERM',
  'SEMEN', 'PENIS', 'VAGINA', 'NIPPLE', 'QUEER', 'MORON', 'IDIOT', 'CRIPPL', 'RETARD', 'WHORE', 'GYPS',
  'BITCH', 'SHIT', 'PISS', 'FUCK', 'CRAP', 'DAMN', 'ABUS', 'ABORT', 'CANCER', 'TUMOR', 'LYNCH', 'GENOCID',
  'SHOOTER', 'SHOOTIN', 'SHOOTOUT', 'FIREARM', 'GUNMAN', 'MASSACR', 'TERRORI', 'HOSTAGE', 'ASSAULT',
  'CONDOM', 'BISEXUAL', 'SEXUAL', 'ORGASM', 'STRIPPER', 'DIARRH', 'AUTOPSY', 'OVERDOSE', 'ANOREX',
  'OBESIT', 'AMPUTA', 'STILLBORN', 'MISCARR',
  'GENITAL', 'HEROIN', 'COCAINE', 'GHETTO', 'KIDNAP', 'KILLING', 'SEDUC', 'OBESE', 'OBITUAR', 'CARCASS',
  'SUPREMAC', 'RACIAL', 'BOOTY', 'NUDE', 'PORN', 'INCEST', 'ANTHRAX', 'EBOLA', 'HEPATIT', 'LEPROS',
  'THUG', 'LOOTER', 'UNDERWEAR', 'BROTHEL', 'CASKET', 'MORGUE',
  'HOLOCAUST', 'GUNFIRE', 'MILITANT', 'GUERRILLA', 'STABB', 'SLAYING', 'CARNAGE', 'SAVAGE', 'CYANIDE',
  'ECSTASY', 'PSYCHO', 'SPANK', 'SEXES', 'VOODOO', 'BOWEL', 'BIOPSY', 'CERVICAL', 'ARSON', 'BOOZE',
  'PARALYZ', 'ASYLUM', 'DEPORT', 'MIGRANT', 'REFUGEE',
  'HOMICID', 'APARTHEID', 'FASCIST', 'ANARCHIST', 'JUNTA', 'METH', 'UNBORN', 'VIRGIN', 'INDECENT',
  'SLAYER', 'GUNPOWDER', 'GUNNER', 'SMUGGL', 'TORTURE', 'HANGING', 'NOOSE',
  'BEHEAD', 'MARTYR', 'RANSOM', 'ERECTION', 'CLEAVAGE', 'ONCOLOG', 'FETAL', 'FOETAL', 'AUTISM', 'AUTISTIC',
  // December 2026 restock, read off the run's output
  'ASSASSIN', 'KILLER', 'ABDUCT', 'RIFLE', 'REVOLVER', 'VODKA', 'OVARIAN', 'OPIOID', 'ADDICT',
  'DEMENTIA', 'SCLEROSIS', 'SECTARIAN', 'REDSKIN', 'MENSTRU', 'BOMBING', 'DROWN',
  'RACISM', 'GUNMEN', 'PISTOL', 'SMALLPOX', 'FETUS', 'WHISKEY', 'SEXISM', 'BULLET',
  'ALCOHOLIC', 'CANNABIS', 'CRUCIF', 'OPIUM', 'STUPID', 'INSANE', 'CORONER',
  'LESBIAN', 'ORIENTAL', 'KILLED', 'MARGARITA', 'SLAIN', 'FASCISM', 'UTERUS', 'COCKTAIL',
  'GUNSHOT', 'HANDGUN', 'RACIST', 'INSANITY', 'HERPES', 'CHOLERA', 'PUBERT',
  'LINGERIE', 'MALARIA', 'MALIGNAN', 'SHOTGUN', 'SNIPER', 'URINARY',
  'CATHETER', 'PROSTATE', 'COFFIN', 'BIGOT', 'MILITIA', 'BLASPHEM', 'VICTIM', 'NARCOTIC', 'MEASLES', 'SATANIC', 'EXTREMIS', 'DEATH',
  'ARSENIC', 'GANGSTER', 'CASTE', 'PELVIC', 'LESION', 'MORPHINE', 'SEXIEST', 'DRUGGED',
  'ADULTER', 'BOMBS', 'LOOTING', 'MARTINI', 'TORTURING', 'HIJACK'];
// Words the frequency floor calls common that are proper nouns, brands, bound
// forms, foreign borrowings or plain not English. A Scrabble dictionary crossed
// with a web-frequency table produces these steadily; there is no rule that
// catches them, so they are listed.
const NOTWORDS = new Set([
  // reads as a person or a place
  'bailey', 'beth', 'billings', 'christie', 'emery', 'greenwood', 'hicks', 'holt', 'jane', 'kris', 'kyle',
  'lang', 'lulu', 'morris', 'napoleon', 'noel', 'otto', 'pearce', 'phoebe', 'scotia', 'shri', 'ulster',
  'manila', 'alps', 'amazon', 'apache', 'phoenix', 'hydra', 'tory', 'gaga', 'berg', 'harlem', 'brooklyn',
  // brands, teams and platforms
  'adobe', 'arsenal', 'mavericks', 'pistons', 'photoshop', 'yahoo', 'wiki', 'ecommerce', 'myspace',
  // not standalone English: bound forms, prefixes, borrowings, chat spellings
  'bein', 'bois', 'sama', 'toro', 'avant', 'capita', 'quasi', 'pseudo', 'para', 'mono', 'aero', 'thru',
  'wanna', 'gonna', 'kinda', 'outta', 'olds', 'someones', 'anyones', 'synth', 'infra', 'proto', 'pseudo',
  // British forms scanUS does not carry
  'catalogue', 'analogue', 'tonne', 'tonnes', 'downwards', 'upwards', 'towards', 'forwards', 'swedes',
  // reads as a racial or ethnic label rather than a word
  'whites', 'blacks', 'orientals',
  // second pass, after reading the words the first run actually shipped. This
  // list grows every time the bank is extended; there is no rule that finds
  // these, so the only way to keep it honest is to read the output.
  'baba', 'nana', 'mama', 'gimme', 'thee', 'thou', 'sans', 'cant', 'khan', 'sierra', 'madras', 'pueblo',
  'fulham', 'spence', 'wright', 'homer', 'trumps', 'yuan', 'mecca', 'boro', 'sharia', 'shalom', 'guru',
  'anime', 'manga', 'samba', 'mambo', 'zulu', 'inca', 'maori', 'sioux', 'creole',
  'offs', 'olds', 'thru', 'wanna',
  // third pass
  'clarence', 'fletcher', 'franklin', 'geneva', 'manhattan', 'michaels', 'mike', 'miller', 'hoover',
  'seahawks', 'orioles', 'emirates', 'airbus', 'medicare', 'jong', 'stein', 'stiles', 'pierce', 'squire',
  'dale', 'casa', 'mars', 'jeep', 'bowman', 'hahn', 'reuters', 'nato', 'opec',
  'haha', 'thingy', 'shes', 'anyways', 'gonna',
  'chilli', 'cancelled', 'marvellous', 'signalling', 'travelled', 'labelled', 'modelling', 'fuelled',
  // fourth pass
  'barbie', 'batman', 'coca', 'gladstone', 'java', 'murphy', 'peters', 'rancho', 'veronica', 'victoria',
  'valentine', 'episcopal', 'dolly', 'papa', 'mayo', 'boomer', 'nokia', 'vespa', 'tesco',
  'maths', 'dodgy', 'gotta', 'hath', 'legit', 'shorty', 'telly', 'chippy',
  // fifth pass. Each round turns up fewer; this is the tail, not the head.
  'apollo', 'bach', 'bates', 'broncos', 'cooper', 'gators', 'hong', 'john', 'knicks', 'oilers', 'huskies',
  'soviets', 'german', 'bologna', 'nasdaq', 'dallas', 'denver', 'boston',
  'dammit', 'fart', 'gotcha', 'wannabe', 'junkie', 'cutie', 'kiddo', 'homie', 'weirdo',
  'badass', 'dunno', 'hubby', 'fella', 'google', 'caliphate', 'bloodshed', 'afghan', 'lunatic',
  'delusions', 'browns', 'godfather', 'ebook',
  // sixth pass (December 2026 restock): a name, a brand, an apostrophe-less
  // contraction and chat forms
  'weiner', 'sanders', 'coke', 'theres', 'momma', 'blah', 'whoa', 'nope',
  'brit', 'dell', 'democrat', 'psych', 'dodgers', 'vikings', 'overwatch', 'sawyer', 'monsieur', 'madame',
  'screwed', 'forex', 'motorway', 'yeah', 'barney', 'johns', 'pascal', 'waterloo', 'wheeler', 'gore',
  'smackdown', 'titans', 'graham', 'ford', 'thankyou', 'fellas', 'freaking',
  'wellbeing', 'ripper', 'mommy', 'daddy', 'cricketer', 'wingers', 'slater', 'rand', 'laguna',
  'backside', 'midland', 'whoops', 'muller', 'pence', 'pavement', 'socialist', 'unionist', 'admin',
  'modi', 'whats', 'scum', 'woke', 'gays', 'babe', 'scooby', 'padres', 'petrol', 'mains', 'guineas',
  'modelled', 'surrey', 'frankfurt', 'hooper', 'hawking', 'liberals', 'doggy', 'poly', 'boomers',
  'barton', 'carter', 'spiderman', 'yorker', 'congrats', 'peeing', 'bourne', 'davenport', 'french',
  'ness', 'vita', 'sizeable', 'bruins', 'holden', 'jedi', 'wales', 'sept', 'wont', 'lite', 'dope',
  'warcraft', 'contra', 'cain', 'somerset', 'pharma', 'bloke', 'beck', 'android', 'feminists', 'franks', 'venetian',
  'centenary', 'butts', 'burton', 'sears', 'semi', 'walker', 'barker', 'inter', 'alright', 'lads', 'scotch', 'brits', 'superman', 'catholic', 'ethnic', 'barrister', 'ageing', 'hurley', 'jess', 'pics', 'prof', 'socialism',
  'haram', 'zack', 'stoner', 'centric', 'heller', 'winger',
  'colourful', 'cutler', 'shaw', 'sims', 'stab', 'mistress', 'storey', 'railways', 'dodger',
  'batsman', 'ebooks', 'kaiser', 'dumbest', 'smokey', 'atheists', 'reeves', 'rubbish', 'enquiries', 'kang', 'fulfil', 'democrats', 'mets', 'wicket',
]);
// Given names and surnames that are also dictionary words. barter-core's NAMES
// list is 700 entries built for a five- and seven-letter pool and this bank
// keeps meeting the ones it missed, so the category gets its own list rather
// than another round of one-offs. It is nowhere near complete and does not need
// to be: it only has to cover the names common enough to clear Zipf 3.2.
const PEOPLE = new Set(`abbey abby ada adele adrian alan albert alec alexis alfie alice alison allan allen alvin amanda amber amy
andrea andy angela angie anita ann anne annie april archie arnold ashley audrey austin autumn barb barry basil beatrice becky bella
belle bennett benjamin bernie bert bertha bessie betsy bev beverly bianca bill billie blair blake bobbie bonnie brad brady brandy
brett brianna brooke bruce bryan buddy caleb calvin candace candy carla carlton carly carmen carol carrie casey cassie catherine
cecil cecile chad chandler charity charlotte chase chelsea cheryl chester chris christian christina christine chuck cindy claire
clara clare clarence claude claudia clay clayton clifford clint cody cole colin connie conrad cooper cora corey cornelia craig
crystal curtis daisy dale dallas dalton damon dana dane daniel danielle daphne darcy darla darlene darrell darryl daryl dave dawn
dean deanna dee delia della delores denise dennis derek derrick desmond dexter diana diane dick dixie dolly dominic don donald
donna donnie doreen dorothy dot doug drew duane dudley duncan dustin dwayne dwight earl earnest ed eddie eden edgar edith edna
edward edwin eileen elaine eleanor elena elias elise eliza ella ellen ellie elmer eloise elsie emil emily emma enid eric erica
erik erin ernest esther ethel eugene eunice eva evan eve evelyn faith fay faye felicia felix fern fletcher flo flora florence
floyd forrest frances francis frank frankie franklin fred freda freddie freeman gail garrett garth gary gavin gayle gene geneva
george georgia gerald geraldine gilbert gina ginger gladys glen glenda glenn gloria gordon grace gracie grant greg gregory gretchen
griffin gus gwen hal hank hannah harlan harold harriet harrison harry harvey hattie hazel heath heather hector heidi helen helena
herbert herman hilda hollis holly homer hope horace howard hoyt hubert hugh hugo ian ida ike ina ira irene iris irma irvin irving
isaac isabel ivan ivy jack jackie jacob jacqueline jade jake james jamie jan jane janet janice jared jasmine jason jasper jay
jean jeanne jeff jeffrey jenna jennie jenny jeremy jerome jerry jesse jessica jill jim jimmie jimmy joan joann jocelyn jodie joe
joel joey johnny jolene jon jonathan jordan joseph josephine josh joshua joy joyce juanita judith judy julia julian julie june
justin kara karen kari karl kate kathleen kathryn kathy katie katrina kay kayla keith kelly kelvin ken kendall kenneth kenny kerry
kevin kim kimberly kirk kris kristen kristi kurt kyle lacey lamar lana lance larry laura lauren laurie lavern lawrence lee leigh
lena lenora leo leon leona leonard leroy leslie lester lewis lila lillian lily linda lindsay lionel lloyd lois lola lonnie lora
loren lorena lorene loretta lori lorraine lou louie louis louise lucas lucia lucille lucy luella luke lula lulu luther lydia lyle
lynn mabel mack madeline madge mae maggie malcolm mamie mandy manuel marc marcia marcus margaret marge margie maria marian marie
marilyn marion marjorie mark marla marlene marsha marshall marta martha martin marty marvin mary mason mathew matt matthew maude
maureen maurice max maxine may maynard megan mel melanie melba melinda melissa melody melvin mercedes meredith merle merlin
michele michelle mickey mildred miles millie milton mindy minnie miranda miriam misty mitchell molly mona monica monroe morgan
morris moses murray myra myrna myron myrtle nadine nan nancy naomi natalie nathan neal ned neil nelda nell nellie nelson nettie
nicholas nick nicole nina noah noel nolan nora norma norman norris odell ola olga olive oliver ollie opal ora oscar otis owen
pam pamela pat patricia patrick patsy patti paul paula pauline pearl peggy penny percy perry pete peters phil philip phillip
phyllis polly preston priscilla queenie rachel ralph ramona randall randy raymond reba rebecca reggie regina renee reuben rex
rhoda rhonda richard rick rickey ricky rita robbie robert roberta robin rodney roger roland rolland roman ron ronald ronnie
rosa rosalie rose rosemary rosie ross roxanne roy ruby rudolph rudy russell rusty ruth ryan sabrina sadie sally salvador sam
samuel sandra sandy sara sarah saul scott sean selma serena seth shane shannon shari sharon shaun shawn sheila shelby shelly
sheridan sherman sherri sherry sheryl shirley sidney silas simon sonia sonya sophia spencer stacey stacy stan stanley stella
stephanie stephen sterling steve steven stewart stuart sue susan susie suzanne sybil sylvester sylvia tabitha tami tammy tanya
tara ted teddy terence teresa teri terrance terrell terrence terri terry tess thelma theodore theresa thomas tia tiffany tim
timmy timothy tina toby todd tom tommie tommy toni tony tonya tracey traci tracy travis trent trevor tricia trina trish troy
trudy tyler tyrone ursula valerie vanessa vaughn velma vera verna vernon veronica vicki vickie vicky victor victoria vince
vincent viola violet virgil virginia vivian wade wallace wally walter wanda ward warren waylon wayne wendell wendy wesley
whitney wilbur wiley wilfred willard willie willis wilma wilson winifred winston woodrow wyatt yolanda yvonne zachary zane`
  .split(/\s+/).filter(Boolean));
// A SYSTEMATIC British screen on top of scanUS, which is a hand list and stops
// where its author stopped: TUMOUR, OFFENCES, LITRE and SPECTRE all sailed
// through it. A word is British when the obvious US respelling is ALSO in the
// dictionary and is used about as much or more. The soft patterns are the ones
// with no ordinary-English collisions, so they only need the US form to be
// roughly as common; the doubled-L, -ould and -ae/-oe patterns collide with
// real pairs (FILLED/FILED, COULD/COLD) and demand the US form be clearly more
// common. Costs TIMBRE, which respells to TIMBER. Worth it.
const ZIPF = (w) => FREQ[w] ?? 0;
const DICTSET = new Set(DICT);
function britishTwin(w) {
  const soft = [], hard = [];
  const add = (list, re, to) => { const x = w.replace(re, to); if (x !== w) list.push(x); };
  add(soft, /is(e|ed|es|ing|ation|ations|able)$/, 'iz$1');
  add(soft, /ys(e|ed|es|ing)$/, 'yz$1');
  if (w.length >= 6) add(soft, /our(s|ed|ing|able)?$/, 'or$1');
  if (w.length >= 5) add(soft, /re(s|d)?$/, 'er$1');
  add(soft, /ence(s)?$/, 'ense$1');
  add(soft, /ogue(s)?$/, 'og$1');
  add(soft, /mme(s)?$/, 'm$1');
  add(soft, /gement(s)?$/, 'gment$1');
  add(soft, /que$/, 'ck');
  add(hard, /ll(ed|ing|er|ers|est)$/, 'l$1');
  add(hard, /ould$/, 'old');
  add(hard, /ae/, 'e');
  add(hard, /oe/, 'e');
  return soft.find((x) => DICTSET.has(x) && ZIPF(x) >= ZIPF(w) - 0.4)
      || hard.find((x) => DICTSET.has(x) && ZIPF(x) >= ZIPF(w) + 0.3)
      || null;
}

const clean = (W) => {
  const w = W.toLowerCase();
  if (NAMES.has(w) || NASTY.has(w) || BRITISH.has(w) || NOTWORDS.has(w) || PEOPLE.has(w)) return false;
  if (scanUS(w).length || britishTwin(w)) return false;
  return !AVOID.some((s) => W.includes(s));
};
const COUNTRY = new Set(SETS.country);
const POOL = DICT
  .filter((w) => /^[a-z]{4,9}$/.test(w) && (FREQ[w] ?? 0) >= (ZIPF_FLOOR[w.length] ?? ZIPF_DEFAULT))
  .map((w) => w.toUpperCase())
  // A country name is a proper noun. It belongs on a board about countries and
  // nowhere else, so it is unioned back in by SETWORDS when a topic rule asks.
  .filter((w) => clean(w) && !COUNTRY.has(w));
// Set members are proper nouns and rarities the frequency floor drops; a topic
// board needs them, and only a topic board may see them.
const SETWORDS = {};
for (const [s, list] of Object.entries(SETS)) SETWORDS[s] = list.filter((w) => /^[A-Z]{4,9}$/.test(w) && clean(w));

// ── candidate catalogue ────────────────────────────────────────────────────
const CATALOGUE = [
  { k: 'alpha' }, { k: 'norepeat' }, { k: 'dbl' }, { k: 'onevowel' }, { k: 'sameends' },
  { k: 'startvowel' }, { k: 'endvowel' }, { k: 'altvc' }, { k: 'twinvowel' },
  ...[4, 5, 6, 7, 8].map((n) => ({ k: 'len', n })),
  ...[1, 2, 3, 4].map((n) => ({ k: 'vowels', n })),
  ...'ABCDEFGHILMNOPRSTUW'.split('').map((c) => ({ k: 'nolet', c })),
  ...['animal', 'body', 'number'].map((set) => ({ k: 'hides', set })),
  ...['mammal', 'bird', 'fish', 'fruit', 'vegetable', 'drink', 'country', 'ballsport'].map((set) => ({ k: 'in', set })),
];
const KINDS = [...new Set(CATALOGUE.map((r) => r.k))];
const byKind = {}; KINDS.forEach((k) => { byKind[k] = CATALOGUE.filter((r) => r.k === k); });
// How much of the pool each KIND calls true, averaged over its specs. This is
// the single most load-bearing number in the file: the gift greens have to
// satisfy every candidate at once, so a board is only possible when the product
// of its rules' densities still leaves words standing. 14,261 pool words times
// seven rules at 0.2 each is 0.9 of a word — which is why a Sunday is mostly
// built out of loose rules and why the quotas below have to reserve them.
const DENSITY = {};
for (const k of KINDS) {
  DENSITY[k] = byKind[k].reduce((s, r) => { const f = ruleFn(r); return s + POOL.filter(f).length / POOL.length; }, 0) / byKind[k].length;
}
// A rule loose enough to sit on a seven-candidate Sunday without emptying the
// green region. Reserved below so the weekdays cannot spend the whole quota.
const LOOSE = new Set(KINDS.filter((k) => DENSITY[k] >= 0.15));

// ── C11: which words a rule set is allowed to put on a board ───────────────
// Mirrors verify-axiom.mjs exactly, run as a POOL FILTER so a near-miss can
// never be picked in the first place.
function c11ok(rules, w) {
  for (const r of rules) {
    if (r.k === 'in') {
      if (!SETS[r.set].includes(w) && (NEAR[r.set] || []).includes(w)) return false;
    } else if (r.k === 'hides') {
      if (HIDDEN[r.set].includes(w)) return false;
      if (HIDDEN[r.set].some((h) => w.includes(h))) continue;
      const near = (HIDDEN_NEAR[r.set] || []).filter((h) => !HIDDEN[r.set].includes(h));
      if (near.some((h) => h.length < w.length && w.includes(h))) return false;
    }
  }
  return true;
}

// ── rng: seeded, and offset by the first board number so a new segment can
// never replay the frozen one ──────────────────────────────────────────────
const BASE_SEED = 0x41584d20;   // "AXM "
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(BASE_SEED + NUM0 * 7919);
const rint = (n) => Math.floor(rng() * n);
const pick = (a) => a[rint(a.length)];
const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = rint(i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; };
// Draw without replacement, probability proportional to weight. The catalogue
// is 19 "no letter X" entries against one `alpha`, so a flat shuffle spends the
// scarce quotas on the crowded kind and starves the bank of everything else —
// which is precisely how the legacy bank ended up 21% "no letter X".
const weightedOrder = (items, w) => {
  const left = items.slice(); const out = [];
  while (left.length) {
    let tot = 0; for (const it of left) tot += Math.max(1e-6, w(it));
    let r = rng() * tot, idx = left.length - 1;
    for (let i = 0; i < left.length; i++) { r -= Math.max(1e-6, w(left[i])); if (r <= 0) { idx = i; break; } }
    out.push(left.splice(idx, 1)[0]);
  }
  return out;
};

// ── dates ──────────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = [];
for (let d = FROM; d <= TO; d = nextDay(d)) {
  const [y, m, dd] = d.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, dd));
  DAYS.push({ live: d, quizId: `axiom-${m}-${dd}-${String(y).slice(2)}`, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, sunday: dt.getUTCDay() === 0 });
}
if (!DAYS.length) {
  console.log(`gen-axiom: nothing to do — the bank already runs to ${lastLive} and --to is ${TO}. Pass a later --to.`);
  process.exit(0);
}
const SLOTS = DAYS.reduce((s, d) => s + (d.sunday ? 7 : 5), 0);

// ── the legacy baseline: what the bank-wide rates already are ──────────────
const legacy = { appears: {}, answers: {}, words: {}, pairings: {}, ruleSets: new Set() };
for (const p of PRIOR) {
  p.tiles.forEach((t) => { legacy.words[t.w] = (legacy.words[t.w] || 0) + 1; });
  if (p.num <= 6) continue;                       // v1 boards; C10 does not measure them
  const fns = p.rules.map(ruleFn);
  const ans = p.rules.map((r, i) => i).filter((i) => p.tiles.every((t) => (fns[i](t.w) ? 1 : 0) === t.t));
  if (ans.length !== 1) throw new Error(`gen-axiom: banked board #${p.num} is not uniquely solvable`);
  p.rules.forEach((r) => { legacy.appears[r.k] = (legacy.appears[r.k] || 0) + 1; });
  const ak = p.rules[ans[0]].k;
  legacy.answers[ak] = (legacy.answers[ak] || 0) + 1;
  const akey = keyOf(p.rules[ans[0]]);
  p.rules.forEach((r, i) => { if (i !== ans[0]) { const P = `${akey}|${keyOf(r)}`; legacy.pairings[P] = (legacy.pairings[P] || 0) + 1; } });
  legacy.ruleSets.add(p.rules.map(keyOf).sort().join('+'));
}

// ── the plan: answers first, then appearance quotas fitted to them ─────────
// Balanced answer schedule. 14 kinds over DAYS.length boards, dealt round-robin
// from a shuffled kind order so no kind runs away with the answer slot.
// How much of the pool each kind calls true decides how often it can be on a
// board at all: the three gift greens must satisfy EVERY candidate, so a rule
// set only exists if all of its rules share a true region. `alpha` is true of
// 134 of the 14,261 pool words (0.9%), `sameends` 6%, a hidden-word rule 3%.
// Put two of those on one board and the green region is empty. These are the
// resulting ceilings, in APPEARANCES over the run, and they are the reason the
// quota fit below cannot simply hand the under-used kinds everything.
const APPEAR_CAP = { alpha: 8, sameends: 15, altvc: 18, in: 9, hides: 9 };
// Kinds too tight to carry a seven-candidate Sunday: they are answers on
// weekdays only, and the plan is rewritten below to put them there.
const TIGHT = new Set(['alpha', 'sameends', 'in', 'hides']);
const ANSWER_CAP = { alpha: 2, sameends: 4, in: 3, hides: 3 };
const FLAVOUR = new Set(['in', 'hides']);          // trivia beats: rationed
const answerPlan = [];
{
  const cap = Math.max(3, Math.ceil(DAYS.length / KINDS.length) + 1);
  let order = shuffle(KINDS);
  const count = {}; KINDS.forEach((k) => { count[k] = 0; });
  let stuck = 0;
  while (answerPlan.length < DAYS.length && stuck < 200) {
    const before = answerPlan.length;
    for (const k of order) {
      if (answerPlan.length >= DAYS.length) break;
      if (count[k] >= Math.min(cap, ANSWER_CAP[k] ?? 1e9)) continue;
      answerPlan.push(k); count[k]++;
    }
    order = shuffle(order);
    stuck = answerPlan.length === before ? stuck + 1 : 0;
  }
  if (answerPlan.length < DAYS.length) throw new Error('gen-axiom: answer plan cannot fill the run under its own caps');
  // Keep the tight kinds off Sunday, where seven candidates have to share one
  // green region and a 0.9%-true rule cannot.
  for (let i = 0; i < DAYS.length; i++) {
    if (!DAYS[i].sunday || !TIGHT.has(answerPlan[i])) continue;
    const swap = DAYS.map((d, j) => j).filter((j) => !DAYS[j].sunday && !TIGHT.has(answerPlan[j]));
    if (!swap.length) throw new Error('gen-axiom: nowhere to move a tight answer kind off Sunday');
    const j = pick(swap);
    [answerPlan[i], answerPlan[j]] = [answerPlan[j], answerPlan[i]];
  }
}
const planAnswers = {}; answerPlan.forEach((k) => { planAnswers[k] = (planAnswers[k] || 0) + 1; });

// Appearance quotas. For each kind pick n_k so the FINAL bank-wide rate
// (legacyAnswers + planAnswers) / (legacyAppears + n_k) lands in [RATE_LO,
// RATE_HI]; distribute the SLOTS budget inside those bounds by weight.
const RATE_LO = 0.14, RATE_HI = 0.45;
const quota = {};
const floor = {};      // the fewest appearances a kind needs for its rate to stay under RATE_HI
const ceiling = {};    // and the most it may have before the rate drops under RATE_LO
{
  const lo = floor, hi = ceiling, wt = {};
  for (const k of KINDS) {
    const A = (legacy.answers[k] || 0) + (planAnswers[k] || 0);
    const N = legacy.appears[k] || 0;
    lo[k] = Math.max(planAnswers[k] || 0, Math.ceil(A / RATE_HI) - N);
    hi[k] = Math.min(APPEAR_CAP[k] ?? 1e9, Math.max(lo[k], Math.floor(A / RATE_LO) - N));
    // Two pulls. Density, because a kind no board can actually carry must not
    // be handed a quota it will never spend (that starved every Sunday from
    // 2026-11-01 on until it was fixed). And a damping term on how heavily the
    // legacy bank already leaned on the kind, so the new segment reads
    // differently from a bank that was 21% "no letter X".
    wt[k] = Math.sqrt(DENSITY[k]) / (1 + (legacy.appears[k] || 0) / 40);
    if (FLAVOUR.has(k)) wt[k] *= 0.5;
  }
  const sumLo = KINDS.reduce((s, k) => s + lo[k], 0);
  const sumHi = KINDS.reduce((s, k) => s + hi[k], 0);
  if (SLOTS < sumLo || SLOTS > sumHi) throw new Error(`gen-axiom: ${SLOTS} candidate slots do not fit the rate band [${sumLo}, ${sumHi}]`);
  KINDS.forEach((k) => { quota[k] = lo[k]; });
  let left = SLOTS - sumLo;
  while (left > 0) {
    const room = KINDS.filter((k) => quota[k] < hi[k]);
    const tot = room.reduce((s, k) => s + wt[k], 0);
    let r = rng() * tot, got = room[room.length - 1];
    for (const k of room) { r -= wt[k]; if (r <= 0) { got = k; break; } }
    quota[got]++; left--;
  }
}
if (VERBOSE) console.error('quota', JSON.stringify(quota), '\nplanAnswers', JSON.stringify(planAnswers));

// ── running ledger ─────────────────────────────────────────────────────────
const used = {
  appears: {}, answers: {}, answerKey: {}, ruleKey: {},
  words: { ...legacy.words }, newWords: {}, pairings: { ...legacy.pairings },
  ruleSets: new Set(legacy.ruleSets), boards: [],
};
// 'vowels2' may be the answer four times where 'vowels' may be five. Kinds with
// a single spec are governed by the answer schedule instead — capping them here
// too left kinds owed a fifth board that could never be built, and the run
// deadlocked on the last week.
const ANSWER_KEY_CAP = 4;
const FLAVOUR_KEY_CAP = 3;     // and one topic ('in mammal') may appear on three boards
// A cap on the SPEC, so a kind with nineteen of them ("no letter X", the five
// lengths, the four vowel counts, the eight topics) cannot spend its whole
// quota on one of them. Kinds with a single spec are governed by the kind quota
// instead: capping `norepeat` here once held it to 14 boards against a quota of
// 31 and silently starved every late Sunday of loose candidates.
const RULE_KEY_CAP = 12;
const WORD_CAP_NEW = 2, WORD_CAP_BANK = 3, OVERLAP_CAP = 5, PAIRING_CAP = 4;

// ── per-spec truth vectors, cached PER POOL ARRAY ──────────────────────────
// Keyed by the array itself, never by a fingerprint of it. The pool is rebuilt
// for every board (word ceilings, C11 filtering, topic-set unions), and a cache
// keyed by length-plus-endpoints silently hands one board another board's
// verdicts: it cost an afternoon, and the symptom was a C6 one-shot tile that
// the mask arithmetic said could not exist.
const truthCache = new WeakMap();
function truth(spec, words) {
  let per = truthCache.get(words);
  if (!per) { per = new Map(); truthCache.set(words, per); }
  const k = keyOf(spec);
  let v = per.get(k);
  if (!v) { const f = ruleFn(spec); v = new Uint8Array(words.length); for (let i = 0; i < words.length; i++) v[i] = f(words[i]) ? 1 : 0; per.set(k, v); }
  return v;
}

// ── board search ───────────────────────────────────────────────────────────
// One pool per DAY, not per attempt. The pool only moves when the word
// ceilings do (once a board is banked) or when a flavour rule filters it for
// C11, so building it inside the attempt loop threw away every cached truth
// vector and made the search ~40x slower than it needed to be.
function dayContext() {
  const base = POOL.filter((w) => (used.words[w] || 0) < WORD_CAP_BANK && (used.newWords[w] || 0) < WORD_CAP_NEW);
  const cache = new Map([['', base]]);
  return (flav) => {
    const key = flav.map(keyOf).sort().join('+');
    let p = cache.get(key);
    if (!p) {
      const sets = flav.filter((r) => r.k === 'in').map((r) => r.set);
      let b = base;
      if (sets.length) {
        const extra = sets.flatMap((x) => SETWORDS[x]).filter((w) => (used.words[w] || 0) < WORD_CAP_BANK && (used.newWords[w] || 0) < WORD_CAP_NEW);
        b = [...new Set([...base, ...extra])].sort();
      }
      p = b.filter((w) => c11ok(flav, w));
      cache.set(key, p);
    }
    return p;
  };
}

// Why an attempt died, so a run that stops short says which constraint ran out
// rather than leaving the next person to guess.
let sundaysLeft = 0;
const DIAG = {};
const diag = (k) => { DIAG[k] = (DIAG[k] || 0) + 1; };

function buildBoard(day, answerKind, tries, poolFor) {
  const R = day.sunday ? 7 : 5;
  const T = day.sunday ? 28 : 24;
  const TEST = T - 5;
  const maxKill = day.sunday ? 3 : 2;
  const trapMin = 6;
  const informMin = day.sunday ? 10 : 8;
  const pctMin = day.sunday ? 0.09 : 0.12;
  const totPairs = (TEST * (TEST - 1)) / 2;
  const trueLo = day.sunday ? 9 : 8, trueHi = day.sunday ? 16 : 14;

  for (let attempt = 0; attempt < tries; attempt++) {
    // 1. the answer, from the kind the plan asked for
    const keyCap = FLAVOUR.has(answerKind) ? 2 : ANSWER_KEY_CAP;
    const cand = byKind[answerKind].filter((r) => byKind[answerKind].length === 1 || (used.answerKey[keyOf(r)] || 0) < keyCap);
    if (!cand.length) return null;
    const A = pick(cand);

    // 2. decide the flavour rules UP FRONT. A topic or hidden-word candidate
    //    changes which words the board may legally use (C11, and SETS members
    //    the frequency floor drops), so the pool has to be settled before any
    //    verdict is computed rather than shrinking under the search. At most one
    //    of each per board: two trivia beats on one board is not a deduction.
    const flav = [];
    if (FLAVOUR.has(A.k)) flav.push(A);
    for (const fk of ['in', 'hides']) {
      if (flav.some((f) => f.k === fk)) continue;
      const left = quota[fk] - (used.appears[fk] || 0);
      if (left <= 0) continue;
      if (rng() >= left / Math.max(1, DAYS.length - out.length)) continue;
      const opts = byKind[fk].filter((r) => (used.ruleKey[keyOf(r)] || 0) < FLAVOUR_KEY_CAP);
      if (opts.length) flav.push(pick(opts));
    }

    // 3. the word pool this rule set may draw on, fixed for the whole attempt
    const words = poolFor(flav);
    if (words.length < 400) { diag('pool'); continue; }

    // 4. grow the rule set one decoy at a time, keeping the green region alive.
    //    Sampling R rules outright almost never leaves a common true region: two
    //    `len` candidates, or `vowels 1` beside `vowels 2`, have none at all.
    // Head-room, not just legality: a rule that leaves exactly six green words
    // has nothing left for the rules still to come, and a Sunday needs six more.
    // Demand slack proportional to the candidates still unplaced.
    const need = (placed) => 6 + 4 * (R - placed);
    let rules = [A];
    let green = words.map((_, i) => i).filter((i) => truth(A, words)[i]);
    let ok = green.length >= need(1);
    const usedKeys = new Set([keyOf(A)]);
    for (const f of flav) {
      if (!ok || f === A) continue;
      const t = truth(f, words);
      const g = green.filter((i) => t[i]);
      if (g.length < need(rules.length + 1)) { ok = false; break; }
      rules.push(f); green = g; usedKeys.add(keyOf(f));
    }
    for (let step = rules.length; ok && step < R; step++) {
      const nolet = rules.filter((r) => r.k === 'nolet').length;
      const lens = rules.filter((r) => r.k === 'len').length;
      const onBoard = {}; rules.forEach((r) => { onBoard[r.k] = (onBoard[r.k] || 0) + 1; });
      const spent = (k) => (used.appears[k] || 0) + (onBoard[k] || 0);
      // Quotas STEER, they do not block. A hard block starves the search: with
      // the loose kinds spent, no set of seven candidates shares a green region
      // and every Sunday from 2026-11-01 on came out empty. So the ceiling is
      // soft (weight collapses past it, a hard stop only far beyond), and the
      // FLOOR is chased hard — a kind that ends up below its floor is a kind
      // whose answer rate breaches RATE_HI, which is what C10 fails on.
      // Weekdays also step back from the loose kinds the remaining Sundays need,
      // because a Sunday wants six or seven of them and a weekday only four.
      const kinds = KINDS.filter((k) => !FLAVOUR.has(k) && spent(k) < ceiling[k]);
      const weigh = (k) => {
        const belowFloor = Math.max(0, floor[k] - spent(k));
        const room = Math.max(0, quota[k] - spent(k));
        let w = 0.05 + room + 5 * belowFloor;
        if (!day.sunday && LOOSE.has(k) && room < sundaysLeft) w *= 0.35;
        return w;
      };
      const pool = weightedOrder(kinds, weigh).flatMap((k) => shuffle(byKind[k])).filter((r) => {
        if (usedKeys.has(keyOf(r))) return false;
        if (r.k === 'nolet' && nolet >= (day.sunday ? 2 : 1)) return false;
        if (r.k === 'len' && lens >= 1) return false;
        if (r.k === A.k && (r.k === 'vowels' || r.k === 'len')) return false;   // no common green with the answer
        if (byKind[r.k].length > 1 && (used.ruleKey[keyOf(r)] || 0) >= RULE_KEY_CAP) return false;
        if ((used.pairings[`${keyOf(A)}|${keyOf(r)}`] || 0) >= PAIRING_CAP) return false;
        return true;
      });
      let placed = null;
      const want = need(step + 1);
      for (const r of pool) {
        const t = truth(r, words);
        const g = green.filter((i) => t[i]);
        if (g.length >= want) { placed = r; rules.push(r); green = g; usedKeys.add(keyOf(r)); break; }
      }
      if (!placed) { ok = false; break; }
    }
    if (!ok || rules.length !== R) { diag('grow'); continue; }
    const setKey = rules.map(keyOf).sort().join('+');
    if (used.ruleSets.has(setKey)) { diag('duplicate rule set'); continue; }

    // 5. choose which decoys the gift reds kill
    const decoys = rules.slice(1);
    const tA = truth(A, words);
    const tD = decoys.map((r) => truth(r, words));
    // How many candidates the gift reds take out. Sunday runs six decoys, so a
    // small kill leaves five live ones and no pair of tests can separate five
    // rules at once; bias hard toward leaving three, and let four through
    // occasionally for shape.
    const kdMax = Math.min(maxKill, decoys.length - 2);
    const kd = day.sunday ? (rng() < 0.8 ? kdMax : Math.max(1, kdMax - 1)) : 1 + rint(kdMax);
    const D = shuffle(decoys.map((_, i) => i)).slice(0, kd);
    const L = decoys.map((_, i) => i).filter((i) => !D.includes(i));
    if (L.length < 2) { diag('live decoys'); continue; }

    // 6. gift reds: A false, no LIVE decoy true (it would die for free), and
    //    between the two of them every decoy in D is called true.
    const redCand = [];
    for (let i = 0; i < words.length; i++) {
      if (tA[i]) continue;
      if (L.some((l) => tD[l][i])) continue;
      let m = 0; D.forEach((d, b) => { if (tD[d][i]) m |= 1 << b; });
      if (m) redCand.push([i, m]);
    }
    if (redCand.length < 2) { diag('no red candidates'); continue; }
    const full = (1 << kd) - 1;
    let reds = null;
    for (let t = 0; t < 200 && !reds; t++) {
      const a = pick(redCand), b = pick(redCand);
      if (a[0] !== b[0] && (a[1] | b[1]) === full) reds = [a[0], b[0]];
    }
    if (!reds) { diag('no red pair'); continue; }

    // 7. classify every remaining word by (verdict, live-decoy kill mask)
    const taken = new Set(reds);
    const classes = new Map();                       // "mask:v" -> [indices]
    for (let i = 0; i < words.length; i++) {
      if (taken.has(i)) continue;
      let mask = 0;
      L.forEach((l, b) => { if ((tD[l][i] ? 1 : 0) !== tA[i]) mask |= 1 << b; });
      if (mask === (1 << L.length) - 1) continue;     // one-shot tile: C6 bans it
      const key = `${mask}:${tA[i]}`;
      if (!classes.has(key)) classes.set(key, []);
      classes.get(key).push(i);
    }
    const greenPool = green.filter((i) => !taken.has(i));
    if (greenPool.length < 3) { diag('green pool'); continue; }

    const board = fillTiles({ classes, greenPool, reds, words, L, TEST, T, trapMin, informMin, pctMin, totPairs, trueLo, trueHi, sunday: day.sunday });
    if (!board) { diag('tile fill'); continue; }

    // 8. tile-overlap ceiling. Checked HERE, inside the attempt loop, so a
    //    collision costs one retry instead of ending the run.
    const ws = new Set(board.tiles.map((t) => t.w));
    if (out.some((q) => q.tiles.filter((t) => ws.has(t.w)).length > OVERLAP_CAP)) { diag('tile overlap'); continue; }

    // 9. shuffle the answer into a random slot and hand back a whole board
    const order = shuffle(rules.map((_, i) => i));
    const outRules = order.map((i) => rules[i]);
    return { rules: outRules, tiles: board.tiles, answerIdx: order.indexOf(0) };
  }
  return null;
}

// Pick the tile counts. Everything C4-C9 measures is a function of how many
// tiles land in each (mask, verdict) class, so the counts are sampled and
// scored before a single word is drawn.
function fillTiles(S) {
  const { classes, greenPool, reds, words, L, TEST, trapMin, informMin, pctMin, totPairs, trueLo, trueHi } = S;
  const keys = [...classes.keys()];
  const maskOf = (k) => Number(k.split(':')[0]);
  const vOf = (k) => Number(k.split(':')[1]);
  const trapKeys = keys.filter((k) => maskOf(k) === 0);
  const infKeys = keys.filter((k) => maskOf(k) !== 0);
  if (!trapKeys.length || infKeys.length < L.length) return null;

  const trapAvail = trapKeys.reduce((s, k) => s + classes.get(k).length, 0);
  const infAvail = infKeys.reduce((s, k) => s + classes.get(k).length, 0);

  for (let t = 0; t < 400; t++) {
    // A floor is not a target: sample the trap count across the whole legal
    // band, then let C9 push informative up from its own floor.
    const trapHi = Math.min(trapAvail, TEST - Math.max(informMin, 10));
    if (trapHi < trapMin) return null;
    const trapN = trapMin + rint(trapHi - trapMin + 1);
    const infN = TEST - trapN;
    if (infN > infAvail || infN < informMin) continue;

    const cnt = {};
    keys.forEach((k) => { cnt[k] = 0; });
    const deal = (ks, n) => {
      const room = () => ks.filter((k) => cnt[k] < classes.get(k).length);
      for (let i = 0; i < n; i++) { const r = room(); if (!r.length) return false; cnt[pick(r)]++; }
      return true;
    };
    if (!deal(trapKeys, trapN)) continue;
    if (!deal(infKeys, infN)) continue;

    // every live decoy exposed by >= 2 tiles (C4)
    let bad = false;
    for (let b = 0; b < L.length; b++) {
      const n = infKeys.reduce((s, k) => s + ((maskOf(k) >> b) & 1 ? cnt[k] : 0), 0);
      if (n < 2) { bad = true; break; }
    }
    if (bad) continue;

    // perfect-2 density (C9). No class alone covers L, so same-class pairs
    // never count and the sum is over distinct class pairs only.
    const FULL = (1 << L.length) - 1;
    let pairs = 0;
    for (let a = 0; a < infKeys.length; a++) {
      for (let b = a + 1; b < infKeys.length; b++) {
        if ((maskOf(infKeys[a]) | maskOf(infKeys[b])) === FULL) pairs += cnt[infKeys[a]] * cnt[infKeys[b]];
      }
    }
    if (pairs / totPairs < pctMin) continue;

    // verdict balance: a board that is 3 true and 21 false reads as a trick
    const trueTest = keys.reduce((s, k) => s + (vOf(k) ? cnt[k] : 0), 0);
    const trueTot = trueTest + 3;                 // the three gift greens
    if (trueTot < trueLo || trueTot > trueHi) continue;

    // draw the words
    const tiles = [];
    const g = shuffle(greenPool).slice(0, 3);
    g.forEach((i) => tiles.push({ w: words[i], t: 1, g: 1 }));
    reds.forEach((i) => tiles.push({ w: words[i], t: 0, g: 1 }));
    for (const k of keys) {
      if (!cnt[k]) continue;
      const src = shuffle(classes.get(k).filter((i) => !g.includes(i))).slice(0, cnt[k]);
      if (src.length < cnt[k]) { tiles.length = 0; break; }
      src.forEach((i) => tiles.push({ w: words[i], t: vOf(k) }));
    }
    if (tiles.length !== TEST + 5) continue;
    if (new Set(tiles.map((x) => x.w)).size !== tiles.length) continue;
    return { tiles: shuffle(tiles) };
  }
  return null;
}

// ── selfCheck: re-derive every condition from the finished board ───────────
function selfCheck(p) {
  const errs = [];
  const fns = p.rules.map(ruleFn);
  const wantTiles = p.sunday ? 28 : 24, wantRules = p.sunday ? 7 : 5;
  if (p.tiles.length !== wantTiles) errs.push(`${p.tiles.length} tiles`);
  if (p.rules.length !== wantRules) errs.push(`${p.rules.length} rules`);
  if (new Set(p.tiles.map((t) => t.w)).size !== p.tiles.length) errs.push('duplicate tile');
  if (p.tiles.some((t) => !/^[A-Z]{3,9}$/.test(t.w))) errs.push('bad tile word');
  const givens = p.tiles.filter((t) => t.g);
  const greens = givens.filter((t) => t.t), reds = givens.filter((t) => !t.t);
  if (greens.length !== 3 || reds.length !== 2) errs.push('given split');
  const consistent = p.rules.map((r, i) => i).filter((i) => p.tiles.every((t) => (fns[i](t.w) ? 1 : 0) === t.t));
  if (consistent.length !== 1) { errs.push(`C1 ${consistent.length} consistent`); return errs; }
  const answer = consistent[0];
  p.rules.forEach((r, i) => { if (!greens.every((t) => fns[i](t.w))) errs.push(`C2 candidate ${i}`); });
  const killed = p.rules.map((r, i) => i).filter((i) => i !== answer && reds.some((t) => fns[i](t.w)));
  if (killed.length < 1 || killed.length > (p.sunday ? 3 : 2)) errs.push(`C3 kills ${killed.length}`);
  if (reds.some((t) => fns[answer](t.w))) errs.push('C3 answer contradicts a red');
  const live = p.rules.map((r, i) => i).filter((i) => i !== answer && !killed.includes(i));
  if (live.length < 2) errs.push(`C4 ${live.length} decoys`);
  const testable = p.tiles.map((t, i) => i).filter((i) => !p.tiles[i].g);
  const killers = live.map((i) => new Set(testable.filter((ti) => (fns[i](p.tiles[ti].w) ? 1 : 0) !== p.tiles[ti].t)));
  killers.forEach((s, k) => { if (s.size < 2) errs.push(`C4 decoy ${live[k]} exposed by ${s.size}`); });
  const traps = testable.filter((ti) => live.every((i) => (fns[i](p.tiles[ti].w) ? 1 : 0) === p.tiles[ti].t));
  if (traps.length < 6) errs.push(`C5 ${traps.length} traps`);
  if (testable.some((ti) => killers.every((s) => s.has(ti)))) errs.push('C6 one-shot');
  let pairs = 0, tot = 0;
  for (let a = 0; a < testable.length; a++) for (let b = a + 1; b < testable.length; b++) {
    tot++; if (killers.every((s) => s.has(testable[a]) || s.has(testable[b]))) pairs++;
  }
  if (!pairs) errs.push('C6 no perfect-2 pair');
  if (p.rules.filter((r) => r.k === 'nolet').length > (p.sunday ? 2 : 1)) errs.push('C7 nolet');
  if (p.rules.filter((r) => r.k === 'len').length > 1) errs.push('C7 len');
  const inform = testable.length - traps.length;
  if (inform < (p.sunday ? 10 : 8)) errs.push(`C8 ${inform} informative`);
  if (pairs / tot < (p.sunday ? 0.09 : 0.12)) errs.push(`C9 ${pairs}/${tot}`);
  for (const r of p.rules) for (const t of p.tiles) if (!c11ok([r], t.w)) errs.push(`C11 ${t.w} vs ${keyOf(r)}`);
  return errs;
}

// ── run ────────────────────────────────────────────────────────────────────
const out = [];
const remaining = answerPlan.slice();
for (let i = 0; i < DAYS.length; i++) {
  const day = DAYS[i];
  sundaysLeft = DAYS.slice(i + 1).filter((d) => d.sunday).length;
  // The schedule is a MULTISET, not a list of appointments. When today's
  // planned kind will not build, the fallback is drawn from the kinds still
  // owed a board rather than from the catalogue at large, and the one that
  // works is struck off. That keeps the finished answer counts equal to the
  // plan, which is what the appearance quotas were fitted against: letting the
  // fallback wander put `endvowel` a whole answer under plan and dropped its
  // bank-wide rate to 12.5%.
  let board = null, kind = null;
  const poolFor = dayContext();
  const owed = [...new Set(remaining)].filter((k) => !(day.sunday && TIGHT.has(k)));
  const first = remaining[0];
  const spare = shuffle(KINDS.filter((k) => !owed.includes(k) && !FLAVOUR.has(k) && !(day.sunday && TIGHT.has(k))));
  const order = [...(owed.includes(first) ? [first] : []), ...shuffle(owed.filter((k) => k !== first)), ...spare];
  for (const k of order) {
    board = buildBoard(day, k, k === first ? 400 : 80, poolFor);
    if (board) { kind = k; break; }
  }
  if (!board) { console.error(`gen-axiom: no board for ${day.live}; stopping at ${out.length}. attempts died at: ${JSON.stringify(DIAG)}`); break; }
  const p = { num: NUM0 + i, quizId: day.quizId, live: day.live, dateLabel: day.dateLabel, sunday: day.sunday, budget: day.sunday ? 7 : 6, rules: board.rules, tiles: board.tiles };
  const errs = selfCheck(p);
  if (errs.length) { console.error(`gen-axiom: ${day.live} failed selfCheck: ${errs.join(', ')}`); process.exit(1); }
  // book it
  const akey = keyOf(p.rules[board.answerIdx]);
  used.answers[p.rules[board.answerIdx].k] = (used.answers[p.rules[board.answerIdx].k] || 0) + 1;
  used.answerKey[akey] = (used.answerKey[akey] || 0) + 1;
  p.rules.forEach((r, j) => {
    used.appears[r.k] = (used.appears[r.k] || 0) + 1;
    used.ruleKey[keyOf(r)] = (used.ruleKey[keyOf(r)] || 0) + 1;
    if (j !== board.answerIdx) { const P = `${akey}|${keyOf(r)}`; used.pairings[P] = (used.pairings[P] || 0) + 1; }
  });
  used.ruleSets.add(p.rules.map(keyOf).sort().join('+'));
  p.tiles.forEach((t) => { used.words[t.w] = (used.words[t.w] || 0) + 1; used.newWords[t.w] = (used.newWords[t.w] || 0) + 1; });
  // Off-plan only ever happens on the last day or two, when the kinds still
  // owed a board cannot be built beside the quotas that are left. Retire the
  // front of the queue so the schedule keeps its length.
  remaining.splice(Math.max(0, remaining.indexOf(kind)), 1);
  out.push(p);
  if (VERBOSE) console.error(`${day.live} ${day.sunday ? 'SUN' : '   '} answer ${akey} slot ${board.answerIdx}`);
}

// ── report and write ───────────────────────────────────────────────────────
const fmtRule = (r) => `{ k: '${r.k}'${r.n !== undefined ? `, n: ${r.n}` : ''}${r.c ? `, c: '${r.c}'` : ''}${r.set ? `, set: '${r.set}'` : ''} }`;
const fmtTile = (t) => `{ w: '${t.w}', t: ${t.t}${t.g ? ', g: 1' : ''} }`;
let body = '';
for (const p of out) {
  const rows = [];
  for (let i = 0; i < p.tiles.length; i += 4) rows.push('      ' + p.tiles.slice(i, i + 4).map(fmtTile).join(', ') + ',');
  body += `  {\n    num: ${p.num}, quizId: '${p.quizId}', live: '${p.live}', dateLabel: '${p.dateLabel}', sunday: ${p.sunday},\n` +
    `    budget: ${p.budget},\n    rules: [${p.rules.map(fmtRule).join(', ')}],\n    tiles: [\n${rows.join('\n')}\n    ],\n  },\n`;
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `export const PUZZLES = [\n${body}];\n`);

// ── bank-wide guard ────────────────────────────────────────────────────────
// The ceilings this generator documents, asserted rather than hoped for. C10
// only fails a kind outside [8%, 75%]; these are the tighter bands the header
// claims, and a run that breaches one is a bug, not a board to ship.
const RATE_GUARD = [0.13, 0.45];
const SLOT_GUARD = 0.40;
{
  const bad = [];
  for (const k of KINDS) {
    const N = (legacy.appears[k] || 0) + (used.appears[k] || 0);
    const A = (legacy.answers[k] || 0) + (used.answers[k] || 0);
    if (N < 4) continue;
    if (A / N < RATE_GUARD[0] || A / N > RATE_GUARD[1]) bad.push(`"${k}" is the answer ${A} of ${N} (${(100 * A / N).toFixed(0)}%)`);
  }
  const slots = {};
  const legacySlots = {};
  for (const q of PRIOR) {
    if (q.num <= 6) continue;
    const f = q.rules.map(ruleFn);
    const i = q.rules.map((r, j) => j).filter((j) => q.tiles.every((t) => (f[j](t.w) ? 1 : 0) === t.t))[0];
    legacySlots[i] = (legacySlots[i] || 0) + 1;
  }
  Object.assign(slots, legacySlots);
  for (const q of out) {
    const f = q.rules.map(ruleFn);
    const i = q.rules.map((r, j) => j).filter((j) => q.tiles.every((t) => (f[j](t.w) ? 1 : 0) === t.t))[0];
    slots[i] = (slots[i] || 0) + 1;
  }
  const tot = Object.values(slots).reduce((a, b) => a + b, 0);
  if (Math.max(...Object.values(slots)) / tot > SLOT_GUARD) bad.push(`one candidate slot holds ${Math.max(...Object.values(slots))} of ${tot} answers`);
  const topKey = Math.max(0, ...Object.values(used.answerKey));
  if (topKey > 6) bad.push(`one rule spec is the answer on ${topKey} new boards (cap 6)`);
  const topWord = Math.max(0, ...Object.values(used.newWords));
  if (topWord > WORD_CAP_NEW) bad.push(`a tile word appears on ${topWord} new boards (cap ${WORD_CAP_NEW})`);
  if (bad.length) { console.error('gen-axiom: bank-wide ceilings breached —\n  ' + bad.join('\n  ')); process.exit(1); }
}

const rate = {};
for (const k of KINDS) {
  const N = (legacy.appears[k] || 0) + (used.appears[k] || 0);
  const A = (legacy.answers[k] || 0) + (used.answers[k] || 0);
  if (N) rate[k] = `${A}/${N}=${(100 * A / N).toFixed(0)}%`;
}
const slotHist = {}; out.forEach((p, i) => { const s = p.rules.findIndex((r, j) => { const fns = p.rules.map(ruleFn); return p.tiles.every((t) => (fns[j](t.w) ? 1 : 0) === t.t); }); slotHist[s] = (slotHist[s] || 0) + 1; });
console.log(`gen-axiom: ${out.length} boards, ${out[0]?.live} .. ${out[out.length - 1]?.live} -> ${OUT}`);
console.log('bank-wide answer rate by kind:', JSON.stringify(rate));
console.log('answer slot spread (new):', JSON.stringify(slotHist));
console.log('answer keys (new):', Object.entries(used.answerKey).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
console.log('most-reused tile word (new):', Object.entries(used.newWords).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${v}`).join(' '), `| distinct ${Object.keys(used.newWords).length}`);
if (out.length < DAYS.length) process.exitCode = 2;
