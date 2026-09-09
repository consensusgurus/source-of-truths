// Independent re-derivation checks for the Stet bank (v2 format: per-sentence
// `errors` array of 0–2, clean sentences carry `cleanNote`). Run after ANY edit:
//   node scripts/verify-stet.mjs
import { PUZZLES } from '../app/stet/puzzles.js';
import { BRITISH } from './us-spellings.mjs';
import { sameWord } from '../lib/dialect-variants.js';

const strip = (w) => w.toLowerCase().replace(/^[^a-z0-9'’-]+|[^a-z0-9'’-]+$/g, '');
let fail = 0;
const GRAMMAR_FROM = '2026-08-11'; // every day on/after this must carry a kind:'grammar' error
// POSITIONAL VARIETY (owner rule 2026-09-09, after a reader wrote in about
// /stet: "I'm pretty sure #2 and #4 are clean every single time. Is there a
// randomizer that could get turned on"). He was right, and no per-item check
// could see it: from 2026-08-11 to 2026-09-29 EVERY weekday was authored to
// the identical shape — sentences 1, 3 and 5 carry one error each, 2 and 4 are
// clean, and the grammar error is always #1 — so 43 of 43 weekdays and 7 of 7
// Sundays ran the same template. A player who noticed could stamp 2 and 4 stet
// and tap 1, 3 and 5 without reading a word. There is no randomizer to turn on:
// items render in bank order (`const ITEMS = PUZZLE.items` in StetClient), so
// variety is an AUTHORING property and has to be checked across the bank rather
// than per day. Sentences within a day are independent, so the fix is to vary
// which position carries the clean copy and which carries the grammar slip.
const VARIETY_FROM = '2026-09-10'; // days before this are played history, and frozen
// Self-contained-error rule (owner ruling 2026-08-14). Boards live before this
// date are frozen history and are skipped; see the header of app/stet/puzzles.js.
const SELF_CONTAINED_FROM = '2026-08-14';
// A note that argues from house preference rather than from the sentence is the
// tell that the flagged word was not actually wrong.
// The bank speaks with a British voice (parish, lychgate, quayside, fells), so a
// stray Americanism reads as an error to a British player and lures a flag onto
// perfectly clean copy. That is what happened on 2026-08-15: "forced with a pry
// bar" was clean, an English player flagged "pry bar" because nobody there says
// it, and lost the item. The term itself is the bug, so it fails here rather
// than waiting for the next reader to write in. Frozen boards are skipped.
const BRITISH_VOICE_FROM = '2026-08-15';
const US_ONLY = [
  [/\bpry bar\b/i, 'crowbar'], [/\bsidewalks?\b/i, 'pavement'],
  [/\belevators?\b/i, 'lift'], [/\bfaucets?\b/i, 'tap'],
  [/\bflashlights?\b/i, 'torch'], [/\bgas stations?\b/i, 'petrol station'],
  [/\bparking lots?\b/i, 'car park'], [/\bgarbage\b/i, 'rubbish'],
  [/\btrash\b/i, 'rubbish'], [/\bdrugstores?\b/i, 'chemist'],
  [/\brealtors?\b/i, 'estate agent'], [/\bzip codes?\b/i, 'postcode'],
  [/\bdiapers?\b/i, 'nappy'], [/\bpacifiers?\b/i, 'dummy'],
  [/\bstrollers?\b/i, 'pushchair'], [/\bband-aids?\b/i, 'plaster'],
  [/\beggplants?\b/i, 'aubergine'], [/\bzucchinis?\b/i, 'courgette'],
  [/\bcilantro\b/i, 'coriander'], [/\barugula\b/i, 'rocket'],
  [/\bskillets?\b/i, 'frying pan'], [/\bdrywall\b/i, 'plasterboard'],
  [/\bbaseboards?\b/i, 'skirting board'], [/\brailroads?\b/i, 'railway'],
  [/\bstreetcars?\b/i, 'tram'], [/\bfreeways?\b/i, 'motorway'],
  [/\bapartments?\b/i, 'flat'], [/\bsoccer\b/i, 'football'],
  [/\bmailman\b/i, 'postman'], [/\bkerosene\b/i, 'paraffin'],
  [/\bwrenches?\b/i, 'spanner'], [/\bthumbtacks?\b/i, 'drawing pin'],
  [/\bfrench fries\b/i, 'chips'], [/\bgotten\b/i, 'got'],
  // US spellings. The bank must not PRINT one; a player may still TYPE either,
  // which lib/dialect-variants.js handles at grade time.
  [/\bcolors?\b/i, 'colour'], [/\bflavors?\b/i, 'flavour'],
  [/\bhonors?\b/i, 'honour'], [/\bneighbors?\b/i, 'neighbour'],
  [/\bbehaviors?\b/i, 'behaviour'], [/\bharbors?\b/i, 'harbour'],
  [/\brumors?\b/i, 'rumour'], [/\bcenters?\b/i, 'centre'],
  [/\btheaters?\b/i, 'theatre'], [/\bfibers?\b/i, 'fibre'],
  [/\bdefense\b/i, 'defence'], [/\boffense\b/i, 'offence'],
  [/\baluminum\b/i, 'aluminium'], [/\bairplanes?\b/i, 'aeroplane'],
  [/\btraveled\b/i, 'travelled'], [/\btraveling\b/i, 'travelling'],
  [/\bcanceled\b/i, 'cancelled'], [/\bjewelry\b/i, 'jewellery'],
  [/\bplowed?\b/i, 'ploughed'], [/\bcatalogs?\b/i, 'catalogue'],
  [/\bnormalcy\b/i, 'normality'], [/\bmath\b/i, 'maths'],
  [/\bvacations?\b/i, 'holiday'], [/\bcandy\b/i, 'sweets'],
  [/\bcookies?\b/i, 'biscuit'], [/\bpopsicles?\b/i, 'ice lolly'],
  [/\bsneakers?\b/i, 'trainers'], [/\bwindshields?\b/i, 'windscreen'],
  [/\bdumpsters?\b/i, 'skip'], [/\bcell ?phones?\b/i, 'mobile'],
  [/\bhardware stores?\b/i, 'ironmonger'], [/\bliquor stores?\b/i, 'off-licence'],
];
// FALSE FRIENDS (owner ruling 2026-08-28, after an English player wrote in about
// stet-8-28-26: "here in England a draft is a first copy of something: draught is
// a rush of air"). Item 4 was CLEAN copy — "a persistent draft under the door" —
// and every entry in US_ONLY above is a word that is American in ALL its senses,
// so a one-way list can never catch this shape. "Draft" is perfectly good British
// English for a first version; it is only an Americanism when the sentence means
// a current of air. So these fire on the word AND a context word from the US
// sense, which is exactly what keeps the correct British uses already in the bank
// out of the net: a porter's trunk (#35.3) and the fall of a drain (#44.3) carry
// no context word and pass, as they must.
const FALSE_FRIENDS = [
  [/\bdrafts?\b/i, /\b(air|door|doorway|window|chimney|flue|draughty|beer|ale|cask|hull|keel)\b/i, 'draught'],
  [/\bchecks?\b/i, /\b(bank|cashed|cheque|payable|signed|account|£)\b/i, 'cheque'],
  [/\bfall\b/i, /\b(semester|foliage|leaves turned|winter|spring|summer)\b/i, 'autumn'],
  [/\bcurbs?\b/i, /\b(pavement|kerb|gutter|roadside|parked|wheels?)\b/i, 'kerb'],
  [/\bfirst floor\b/i, /\b(stairs?|lift|ground floor|storey)\b/i, 'ground floor'],
];
// A clean item whose note argues from dialect is the bug stating itself: the
// whole point of clean copy is that a British reader wants to tap nothing in it.
const DIALECT_NOTE = /\b(british|american|americani[sz]ed?|US|U\.S\.|UK|transatlantic)\b/;
const PREFERENCE_NOTE = /\b(british|american)\b|\b(usual|normal|standard|customary|preferred|conventional|accepted|modern)(ly)?\s+(\w+\s+){0,2}(term|word|name|spelling|form|usage)\b|\bplain (term|word)\b|\bmore usual\b|\bin this trade\b|\b(written as |is )?(a )?(one|single) word\b|\bmodern usage\b|\bthe general term\b|\bdialect variant\b/i;
// ---------------------------------------------------------------------------
// THE FIX MUST BE FINDABLE (owner ruling 2026-08-15, after a second complaint
// of the same shape as the 08-14 one: "for #5 there are no context clues to
// indicate the cyclist was cautioned rather than fined, either would have been
// equally acceptable"). The 08-14 rule says the flagged word must be WRONG.
// This one says it must POINT AT THE FIX. A player can only produce the right
// word if the wrong one sounds like it, is a form of it, is a near-miss
// spelling of it, or the two are a confusable pair a copy desk is taught to
// watch for. Two unrelated words are a synonym swap: even a reader who spots
// the error cannot know which word the author had in mind.
// Boards live before FORCED_FIX_FROM are played history and are skipped.
const FORCED_FIX_FROM = '2026-08-16';
const relations = {};
// A rough phonetic key: enough to see that reign/rein, allowed/aloud and
// threw/through are one sound. Deliberately loose, since a near-miss that
// scores as a homophone is a real copy-desk error either way.
function pkey(s) {
  let w = String(s).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return '';
  w = w.replace(/^(kn|gn|pn|wr)/, (m) => m[1]);
  if (/^wh[ou]/.test(w)) w = w.slice(1);              // who, whole: the w is silent
  else if (w.startsWith('wh')) w = 'w' + w.slice(2);
  w = w.replace(/ough/g, 'o').replace(/ph/g, 'f').replace(/gh/g, '').replace(/gn/g, 'n');
  w = w.replace(/x/g, 'ks').replace(/ch(?=[rl])/g, 'k').replace(/sc(?=[lm])/g, 's');
  w = w.replace(/sh|ch|ti(?=[oa])|ci(?=[oa])/g, 'X').replace(/th/g, '0');
  w = w.replace(/ck/g, 'k').replace(/q/g, 'k').replace(/dg(?=[eiy])/g, 'j').replace(/g(?=[eiy])/g, 'j');
  w = w.replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k');
  w = w.replace(/z/g, 's').replace(/v/g, 'f').replace(/h/g, '');
  w = w.replace(/e$/, '');
  const lead = /^[aeiouy]/.test(w) ? 'V' : '';
  const rest = w.slice(lead ? 1 : 0).replace(/w/g, '').replace(/[aeiouy]/g, '');
  return (lead + rest).replace(/(.)\1+/g, '$1');
}
function editDistance(a, b) {
  const m = a.length, n = b.length;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}
const SUFFIX = /^(s|es|d|ed|ing|en|n|er|est|ly|ies|ied)$/;
function sameLemma(a, b) {
  const [x, y] = a.length <= b.length ? [a, b] : [b, a];
  if (y.startsWith(x) && x.length >= 3 && SUFFIX.test(y.slice(x.length))) return true;
  const stem = x.replace(/e$/, '');
  if (stem.length >= 3 && y.startsWith(stem)) {
    const tail = y.slice(stem.length).replace(/^(.)\1/, '$1');
    if (SUFFIX.test(tail)) return true;
  }
  return false;
}
// Irregular principal parts: any two forms of one verb are the same word, which
// is what makes "had ran" and "was drove" grammar errors rather than swaps.
const IRREGULAR = `arise arose arisen|awake awoke awoken|be am is are was were been being|
bear bore borne|beat beat beaten|become became become|begin began begun|bid bade bidden|
bind bound|bite bit bitten|bleed bled|blow blew blown|break broke broken|breed bred|
bring brought|build built|burst burst|buy bought|catch caught|choose chose chosen|
cling clung|come came|cost cost|creep crept|cut cut|deal dealt|dig dug|dive dived dove|
do does did done doing|draw drew drawn|drink drank drunk|drive drove driven|dwell dwelt|
eat ate eaten|fall fell fallen|feed fed|feel felt|fight fought|find found|flee fled|
fling flung|fly flew flown|forbid forbade forbidden|forget forgot forgotten|
forgive forgave forgiven|forsake forsook forsaken|freeze froze frozen|get got gotten|
give gave given|go went gone|grind ground|grow grew grown|hang hung hanged|
have has had having|hear heard|hide hid hidden|hold held|keep kept|kneel knelt|
know knew known|lay laid|lead led|leave left|lend lent|lie lay lain|light lit|lose lost|
make made|mean meant|meet met|mistake mistook mistaken|overtake overtook overtaken|
pay paid|prove proved proven|put put|read read|ride rode ridden|ring rang rung|
rise rose risen|run ran run|say said|see saw seen|seek sought|sell sold|send sent|
set set|shake shook shaken|shine shone|shoot shot|show showed shown|shrink shrank shrunk|
sing sang sung|sink sank sunk|sit sat|slay slew slain|sleep slept|slide slid|sling slung|
speak spoke spoken|speed sped|spend spent|spin spun|spit spat|split split|spread spread|
spring sprang sprung|stand stood|steal stole stolen|stick stuck|sting stung|
stink stank stunk|strew strewed strewn|stride strode stridden|strike struck stricken|
string strung|strive strove striven|swear swore sworn|sweep swept|swell swelled swollen|
swim swam swum|swing swung|take took taken|teach taught|tear tore torn|tell told|
think thought|thrive throve thriven|throw threw thrown|tread trod trodden|
undertake undertook undertaken|wake woke woken|wear wore worn|weave wove woven|
weep wept|win won|wind wound|withdraw withdrew withdrawn|wring wrung|write wrote written`;
// Closed-class forms: case, number, agreement. Same word, different slot.
const FORMS = `i me my mine|he him his|she her hers|we us our ours|they them their theirs|
who whom whose|whoever whomever|this that these those|it its|there their|much many|
another other`;
const GROUPS = [...IRREGULAR.split('|'), ...FORMS.split('|')]
  .map((g) => new Set(g.trim().split(/\s+/))).filter((g) => g.size > 1);
// Confusable pairs a copy desk is taught to watch for, plus malaprops whose
// context forces one reading. ADDING AN ENTRY IS A DELIBERATE ACT: write the
// reason, and only after reading the sentence cold and confirming that a
// careful editor could not land anywhere else. If the reason will not write,
// the item is a synonym swap and must be re-cut instead.
const FORCED_PAIRS = [
  ['fewer', 'less', 'count nouns take fewer, mass nouns less: the noun decides'],
  ['amount', 'number', 'the same rule, decided by the noun'],
  ['uninterested', 'disinterested', 'impartial vs bored'],
  ['incredulous', 'incredible', 'the hearer is incredulous, the claim incredible'],
  ['exasperate', 'exacerbate', 'to worsen vs to annoy'],
  ['comprise', 'compose', 'the whole comprises the parts'],
  ['flaunt', 'flout', 'to show off vs to defy a rule'],
  ['adverse', 'averse', 'unfavourable vs unwilling'],
  ['historic', 'historical', 'momentous vs merely in the past'],
  ['jibe', 'jive', 'to agree with vs to dance'],
  ['gambit', 'gamut', 'an opening move vs the whole range'],
  ['curb', 'curve', 'to restrain vs to bend'],
  ['tack', 'tact', 'a course taken vs delicacy'],
  ['cache', 'cachet', 'a hidden store vs prestige'],
  ['hardy', 'hearty', 'tough vs warm, and they sound close'],
  ['pour', 'pore', 'to pore over a document; pour tips a liquid'],
  ['poise', 'pour', 'composure vs tipping a liquid'],
  ['passed', 'past', 'verb vs preposition, and they sound alike'],
  ['muscle', 'mussel', 'homophone the phonetic key misses on the silent c'],
  ['yolk', 'yoke', 'homophone the phonetic key misses on the silent l'],
  ['deaf', 'death', 'near homophone, and the sentence takes only one'],
  ['they', 'those', 'a relative clause takes the demonstrative: those who'],
  ['vernier', 'veneer', 'a measuring scale vs a surface layer'],
  ['spectator', 'speculative', 'spec development is the trade term the sentence needs'],
  ['principal', 'principle', 'the head, or the sum, vs a rule'],
  ['stationary', 'stationery', 'standing still vs paper'],
  ['complement', 'compliment', 'to complete vs to praise'],
  ['discreet', 'discrete', 'tactful vs separate'],
  ['elicit', 'illicit', 'to draw out vs unlawful'],
  ['prescribe', 'proscribe', 'to recommend vs to forbid'],
  ['militate', 'mitigate', 'to weigh against vs to soften'],
  ['venal', 'venial', 'bribable vs pardonable'],
  ['appraise', 'apprise', 'to value vs to inform'],
  ['censor', 'censure', 'to suppress vs to condemn'],
];
const stemOf = (w) => w.replace(/(ed|ing|es|s|d|n)$/, '').replace(/e$/, '');
const PAIRS = new Set();
for (const [a, b] of FORCED_PAIRS) {
  PAIRS.add([a, b].sort().join('|'));
  PAIRS.add([stemOf(a), stemOf(b)].sort().join('|'));
}
const sharedPrefix = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
// The relation that makes the fix findable, or null for a synonym swap.
function relation(wrong, fix) {
  const w = String(wrong).toLowerCase().replace(/[^a-z']/g, '');
  const f = String(fix).toLowerCase().replace(/[^a-z']/g, '');
  if (!w || !f) return null;
  if (pkey(w) === pkey(f)) return 'homophone';
  if (sameLemma(w, f)) return 'inflection';
  if (GROUPS.some((g) => g.has(w) && g.has(f))) return 'form';
  const ed = editDistance(w, f), max = Math.max(w.length, f.length), min = Math.min(w.length, f.length);
  if (ed <= 2 && min >= 4 && (ed <= 0.25 * max || min >= 6)) return 'misspelling';
  if (sharedPrefix(w, f) >= 5 && ed <= 0.35 * max) return 'near-miss';
  if (PAIRS.has([w, f].sort().join('|')) || PAIRS.has([stemOf(w), stemOf(f)].sort().join('|'))) return 'confusable';
  return null;
}
// ---------------------------------------------------------------------------
// THE SHARED US-SPELLING SCREEN, wired in the only direction that is true for
// this game (CLAUDE.md "Daily puzzle authoring standard" rule 8, "Extending a
// puzzle bank in bulk" rule 4). Read this before changing it, because the
// obvious wiring is the wrong one here.
//
// The standard's rule 8 exists because generators pulling off-the-shelf word
// lists import BRITISH forms into copy that is meant to read American. Stet is
// the one game where that direction is inverted by an owner ruling: two English
// readers wrote in (2026-08-15 "never heard of a pry bar", 2026-08-28 "here in
// England a draft is a first copy of something") and the ruling is that the
// printed copy is British, enforced above by US_ONLY and FALSE_FRIENDS from
// BRITISH_VOICE_FROM. So scanUS's own direction — fail a British form in the
// copy — cannot be run over stet's sentences: it would fail `colour`,
// `practise` and `metre`, which this bank is REQUIRED to print, and the two
// checks would deadlock.
//
// It cannot be run inverted either, i.e. "fail the US form of every pair".
// Half of us-spellings' US column is ordinary British English in another sense
// — while, among, learned, spelled, story, practice (the noun), license (the
// verb), curb (the verb), draft (a first version) — which is the exact
// false-friend trap that already cost this bank one item. US_ONLY above is
// hand-curated precisely to avoid it, and widening it mechanically would
// reintroduce it.
//
// What the shared table CAN prove, and what nothing here proved before, is the
// rule the puzzles.js header states and no code enforced: NO ERROR MAY TURN ON
// THE DIALECT AXIS, in either direction. That rule has teeth beyond style. The
// grader folds dialect spellings together through lib/dialect-variants.js, so
// an item whose `wrong` and `fix` are two spellings of one word is UNPLAYABLE:
// a player who types the "wrong" word back scores the point, because
// sameWord() says it is the same answer. That is a dead board, not a taste
// call, and it is mechanically checkable from the two shared files.
//
// Scoped from DIALECT_AXIS_FROM so the past stays frozen (rule 10). The floor
// is load-bearing rather than ceremonial, and it was tested: with the floor
// dropped to the start of the bank this check fails board #31 (2026-08-16),
// which banks kerb -> curb, a pair us-spellings lists as one word in two
// dialects. That board is played history and stays exactly as it is.
const DIALECT_AXIS_FROM = '2026-09-30';   // first board of the Sep 30 - Nov 30 extension
const VARIANT = new Map();
for (const [brit, us] of BRITISH) { VARIANT.set(brit, us); VARIANT.set(us, brit); }
function dialectAxis(wrong, fix) {
  const w = String(wrong).toLowerCase(), f = String(fix).toLowerCase();
  if (VARIANT.get(w) === f) return `us-spellings.mjs lists "${w}"/"${f}" as one word in two dialects`;
  if (sameWord(w, f)) return `lib/dialect-variants.js grades "${w}" and "${f}" as the same word, so a player typing the flagged word back would SCORE`;
  return null;
}
let grammarErrors = 0;
const err = (m) => { console.error('FAIL:', m); fail++; };

const seenPairs = new Set();
let prev = 0, cleanDays = 0, totalErrors = 0, cleanItems = 0, doubles = 0;
for (const p of PUZZLES) {
  if (p.num !== prev + 1) err(`#${p.num}: nums not sequential`);
  prev = p.num;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `stet-${m}-${d}-${y % 100}`) err(`#${p.num}: quizId ${p.quizId} != live ${p.live}`);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const isSun = dt.getUTCDay() === 0;
  if (!!p.sunday !== isSun) err(`#${p.num}: sunday flag ${p.sunday} but ${p.live} getUTCDay=${dt.getUTCDay()}`);
  const want = p.sunday ? 7 : 5;
  if (p.items.length !== want) err(`#${p.num}: ${p.items.length} items, want ${want}`);
  const label = dt.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  if (p.dateLabel !== label) err(`#${p.num}: dateLabel "${p.dateLabel}" != "${label}"`);
  if (p.live >= BRITISH_VOICE_FROM) {
    p.items.forEach((it, i) => {
      for (const [re, uk] of US_ONLY) {
        const m = it.text.match(re);
        if (m) err(`#${p.num}.${i + 1}: "${m[0]}" is American. The bank reads British, so it lures a flag onto correct copy — use "${uk}"`);
      }
      for (const [re, ctx, uk] of FALSE_FRIENDS) {
        const m = it.text.match(re);
        if (m && ctx.test(it.text)) err(`#${p.num}.${i + 1}: "${m[0]}" is the American sense here. It is good British English elsewhere, which is why US_ONLY misses it — use "${uk}"`);
      }
    });
  }
  let dayClean = 0, dayErrors = 0, dayGrammar = 0;
  p.items.forEach((it, i) => {
    if (!Array.isArray(it.errors)) { err(`#${p.num}.${i + 1}: errors not an array`); return; }
    const maxErr = p.sunday ? 2 : 1;
    if (it.errors.length > maxErr) err(`#${p.num}.${i + 1}: ${it.errors.length} errors exceeds ${maxErr}`);
    const toks = it.text.split(/\s+/).map(strip).filter(Boolean);
    if (it.errors.length === 0) {
      dayClean++; cleanItems++;
      if (!it.cleanNote || it.cleanNote.length < 15 || it.cleanNote.length > 140) err(`#${p.num}.${i + 1}: clean item needs a cleanNote (15–140 chars)`);
      if (p.live >= BRITISH_VOICE_FROM) {
        const d = (it.cleanNote || '').match(DIALECT_NOTE);
        if (d) err(`#${p.num}.${i + 1}: cleanNote defends the sentence on dialect grounds ("${d[0]}") — clean copy a British reader would flag is not clean, so re-cut the sentence rather than excusing it in the note`);
      }
      return;
    }
    if (it.errors.length === 2) doubles++;
    const wrongs = new Set();
    for (const [j, e] of it.errors.entries()) {
      dayErrors++; totalErrors++;
      if (e.kind !== undefined && e.kind !== 'grammar' && e.kind !== 'wordchoice' && e.kind !== 'spelling') err(`#${p.num}.${i + 1}.${j + 1}: bad kind "${e.kind}"`);
      if (e.kind === 'grammar') { dayGrammar++; grammarErrors++; }
      const w = strip(e.wrong);
      if (wrongs.has(w)) err(`#${p.num}.${i + 1}: duplicate wrong token "${e.wrong}" within sentence`);
      wrongs.add(w);
      const hits = toks.filter((t) => t === w).length;
      if (hits !== 1) err(`#${p.num}.${i + 1}.${j + 1}: wrong "${e.wrong}" appears ${hits}x in "${it.text}"`);
      if (!e.fix || strip(e.fix) === w) err(`#${p.num}.${i + 1}.${j + 1}: bad fix "${e.fix}"`);
      if (/\s/.test((e.fix || '').trim())) err(`#${p.num}.${i + 1}.${j + 1}: fix "${e.fix}" is multi-word`);
      if (!e.note || e.note.length < 15 || e.note.length > 140) err(`#${p.num}.${i + 1}.${j + 1}: note length ${(e.note || '').length}`);
      const pair = `${w}>${strip(e.fix)}`;
      if (seenPairs.has(pair)) err(`#${p.num}.${i + 1}.${j + 1}: duplicate pair ${pair}`);
      seenPairs.add(pair);
      if (toks.includes(strip(e.fix))) err(`#${p.num}.${i + 1}.${j + 1}: fix "${e.fix}" already appears in text`);
      if (p.live >= SELF_CONTAINED_FROM) {
        // (a) the fix must not swallow a neighbouring word. A closed-compound
        // "fix" renders as "fire ~~proof~~ fireproof safe" in the reveal, and is
        // a style call rather than an error. Real inflections (hid→hidden,
        // slow→slowly) only add a short grammatical tail, so 4+ added
        // characters at either end means a compound was joined.
        const f = strip(e.fix).replace(/-/g, '');
        if (f !== w && f.length - w.length >= 4 && (f.startsWith(w) || f.endsWith(w))) {
          err(`#${p.num}.${i + 1}.${j + 1}: fix "${e.fix}" joins a compound onto "${e.wrong}" — renders broken, and is a style call, not an error`);
        }
        // (b) preference language in the note means the flagged word was fine.
        const m = (e.note || '').match(PREFERENCE_NOTE);
        if (m) err(`#${p.num}.${i + 1}.${j + 1}: note argues house preference ("${m[0]}") — an error must be wrong in THIS sentence, not merely less usual`);
      }
      if (p.live >= DIALECT_AXIS_FROM) {
        const why = dialectAxis(w, strip(e.fix));
        if (why) err(`#${p.num}.${i + 1}.${j + 1}: "${e.wrong}" -> "${e.fix}" turns on the dialect axis - ${why}. No error may sit on that axis in either direction; re-cut the item.`);
      }
      if (p.live >= FORCED_FIX_FROM) {
        // (c) the flagged word must POINT at the fix. Unrelated words mean the
        // sentence cannot choose between them and the player is guessing which
        // synonym the author meant: the fined→cautioned failure.
        const rel = relation(w, strip(e.fix));
        if (rel) relations[rel] = (relations[rel] || 0) + 1;
        else err(`#${p.num}.${i + 1}.${j + 1}: "${e.wrong}" → "${e.fix}" are unrelated words. Nothing in the sentence chooses between them, so the item is a guess: re-cut it, or add the pair to FORCED_PAIRS with the reason a careful editor could not land anywhere else`);
      }
    }
  });
  if (dayClean) cleanDays++;
  if (dayErrors === 0) err(`#${p.num}: a day with NO errors at all`);
  if (p.live >= GRAMMAR_FROM && dayGrammar === 0) err(`#${p.num} (${p.live}): no kind:'grammar' error — every day on/after ${GRAMMAR_FROM} needs one`);
  if (!p.sunday && p.items.length - dayClean !== 5 - dayClean) { /* structural, covered above */ }
}
// ── positional variety, weekdays and Sundays scored separately ──────────────
// The sequence is built from the WHOLE bank so a fresh day is measured against
// the frozen day before it, but only a day on/after VARIETY_FROM can fail.
for (const [kind, isSun, n] of [['weekday', false, 5], ['Sunday', true, 7]]) {
  const days = PUZZLES.filter((p) => !!p.sunday === isSun);
  const scored = days.filter((p) => p.live >= VARIETY_FROM);
  const cleanAt = Array(n).fill(0), gramAt = Array(n).fill(0);
  const runC = Array(n).fill(0), runG = Array(n).fill(0);
  let lastSig = null;
  for (const p of days) {
    const live = p.live >= VARIETY_FROM;
    const cl = p.items.map((it) => !(it.errors || []).length);
    const gr = p.items.map((it) => (it.errors || []).some((e) => e.kind === 'grammar'));
    const sig = cl.map((c) => (c ? '.' : 'x')).join('');
    if (live && sig === lastSig) err(`#${p.num} (${p.live}): same clean/error shape "${sig}" as the ${kind} before it — vary which sentences are clean`);
    lastSig = sig;
    for (let i = 0; i < n; i++) {
      runC[i] = cl[i] ? runC[i] + 1 : 0;
      runG[i] = gr[i] ? runG[i] + 1 : 0;
      if (live && runC[i] > 3) err(`#${p.num} (${p.live}): sentence #${i + 1} has been clean on ${runC[i]} straight ${kind}s — a reader can stamp it stet unread`);
      if (live && runG[i] > 3) err(`#${p.num} (${p.live}): sentence #${i + 1} has carried the grammar error on ${runG[i]} straight ${kind}s`);
      if (live) { if (cl[i]) cleanAt[i]++; if (gr[i]) gramAt[i]++; }
    }
  }
  const N = scored.length;
  if (!N) continue;
  for (let i = 0; i < n; i++) {
    const c = cleanAt[i] / N, g = gramAt[i] / N;
    if (c > 0.6) err(`variety: sentence #${i + 1} is clean on ${(100 * c).toFixed(0)}% of ${kind}s from ${VARIETY_FROM} (max 60%) — the position gives the answer away`);
    if (g > 0.6) err(`variety: sentence #${i + 1} carries the grammar error on ${(100 * g).toFixed(0)}% of ${kind}s from ${VARIETY_FROM} (max 60%)`);
    if (N >= 10 && !cleanAt[i]) err(`variety: sentence #${i + 1} is NEVER clean across ${N} ${kind}s from ${VARIETY_FROM} — every position must run clean copy sometimes`);
    if (N >= 10 && !gramAt[i]) err(`variety: sentence #${i + 1} NEVER carries the grammar error across ${N} ${kind}s from ${VARIETY_FROM}`);
  }
  console.log(`variety ${kind} (${N} days from ${VARIETY_FROM}): clean ${cleanAt.map((v) => `${(100 * v / N).toFixed(0)}%`).join('/')} · grammar ${gramAt.map((v) => `${(100 * v / N).toFixed(0)}%`).join('/')}`);
}

console.log('relations:', Object.entries(relations).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`stats: ${PUZZLES.length} puzzles, ${totalErrors} errors (${grammarErrors} grammar), ${cleanItems} clean sentences across ${cleanDays} days, ${doubles} two-error sentences`);
console.log(fail ? `${fail} failure(s)` : 'OK — all checks passed');
process.exit(fail ? 1 : 0);
