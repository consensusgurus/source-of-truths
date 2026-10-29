// Lode — daily board generator.
//
// Lode is the open-ended letter hunt: seven letters, one CORE letter that every
// word must use, minimum four letters, letters reusable. A word using all seven
// is a PANGRAM.
//
// The Source of Truths twist is that points come from RARITY, not just length.
// Every scored word carries a tier derived from its real-world usage frequency
// (Zipf scale, computed offline by scripts/lode-words.py), so knowing one
// uncommon word beats grinding ten obvious ones:
//
//   base      = length - 2          (4 letters = 2 ... 8 letters = 6)
//   multiplier= 1 / 2 / 3           (common / uncommon / rare)
//   pangram   = +10
//
// The frequency data USED to double as the junk filter, and no longer does.
// As of 2026-08-17 there is NO frequency floor: every word in the shipped
// dictionaries (public/tuck-dict.txt for 4 to 8 letters, tuck-dict-long.txt for
// 9 to 15) is scored, except proper nouns, which scripts/lode-words.py vetoes
// with hunspell and which reach the player as tailings instead. Frequency now
// decides only the MULTIPLIER, not membership.
//
// Two holes closed on the way here, both of which reached players as "that is
// not a word": the 4-to-8 list was read alone until 2026-08-15, so no word of
// nine letters or more could appear on any board (BEGINNING, COHERENCE,
// INITIALLY, ABBREVIATE); and the floor itself was cutting ordinary vocabulary
// (rile, glob, clef, gild, dolt, kith, mien, riffraff, ogled) right up until it
// was removed.
//
// Each day carries a VEIN: the target score that counts the day as solved, set
// at a fixed share of the board's maximum. Ranks below it give the ladder
// something to climb, and MOTHER LODE (every word) is there for the obsessives.
//
// Usage:
//   python3 scripts/lode-words.py > scripts/.lode-freq.json   (once, or to refresh)
//   node scripts/gen-lode.mjs --from 2026-08-01 --days 400 > app/lode/puzzles.js
//
// Changing the word pool reshuffles the WHOLE bank, including boards already
// played, so a refresh regenerates future dates only and splices them under the
// boards that have gone live (--from tomorrow, --startnum after the last one).
//
// Regenerating is safe and idempotent: the day chosen for a given date is a
// pure function of the date seed, so re-running never reshuffles history.

import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';

const here = dirname(fileURLToPath(import.meta.url));

// ─── tunables ──────────────────────────────────────────────────────────────
// A junk floor scaled BY LENGTH was, for most of Lode's life, the only thing
// between a reader and the Scrabble tail. It was the wrong tool, and the reason
// is worth keeping: the dictionary is full of proper nouns (james, texas, paris,
// facebook), and a name is FREQUENT, so any floor high enough to stop names also
// stopped ordinary vocabulary nobody writes down (lard 2.98, howl 3.18, silt
// 2.96, coax 2.96, ruse 3.16). Frequency cannot tell "nobody knows it" from
// "nobody writes it"; only a dictionary can. The vocabulary gate therefore moved
// to hunspell in scripts/lode-words.py on 2026-07-30, the floor came down to 1.5
// once it no longer had to police names, and then came off entirely.
//
// THERE IS NO FREQUENCY FLOOR (owner call, 2026-08-17). A word needs four
// letters and to not be a proper noun; scripts/lode-words.py applies the second
// of those and nothing else. Every one of the 267,009 words it emits is scored.
// Do not reintroduce a floor here: this file used to hold a second gate that
// had to be kept in sync with the Python, and there is no longer anything to
// keep in sync.
const TIER_RARE = 2.4;       // < this is RARE (x3)
const TIER_UNCOMMON = 3.9;   // < this (and >= RARE) is UNCOMMON (x2)
// A frequency of 0 means wordfreq has NO entry for the word — about 167,300 of
// them (eild, pumy, skirrs, konbus, solpugids). They are real and they count,
// but they score at the BASE rate, and that branch is load-bearing rather than
// cosmetic: 0 is less than TIER_RARE, so without it every one of them would pay
// TREBLE. Measured, that took the median board's rare share from 0.25 to 0.49,
// i.e. half of every board would be a x3 word nobody knows, and memorising a
// Scrabble list would beat knowing real vocabulary — the exact inversion of
// what the rarity scoring exists to reward. With the branch, rare share sits at
// 0.28 and the treble still points at words a reader could actually place.
const NO_FREQ_TIER = 1;
const MIN_LEN = 4;
const LETTERS = 7;           // weekdays
const LETTERS_SUNDAY = 8;    // Sunday Edition deals an extra letter
// How many words a board may hold. Raised from 46/70 on 2026-08-15 (owner call)
// in the same pass that lifted the pool's eight-letter cap: with nine- to
// fifteen-letter words finally in the data the pool went 28,779 -> 49,189, and
// holding the old ceiling would have spent that entirely on REJECTING the
// fuller boards rather than on giving players more to find. At 60/95 the
// average weekday board carries about 39 words and the Sunday about 64.
//
// Raised again to 70/110 on 2026-08-17 for the same reason, when the 1.5 floor
// took the pool to 67,300: the median candidate board grew to 60 words, so a
// 60 cap would have thrown away half the field. The rise is deliberately much
// smaller than the pool's, because the VEIN is a share of the board maximum and
// Lode has to close in a few minutes against two dozen other dailies.
//
// And again to 110/150 later the same day, when the floor was removed outright
// and the pool went to 267,009. A 7-letter set now builds 138 words on average,
// so the old 70 cap left only the sparsest letter sets eligible and biased the
// deal toward awkward boards. This IS a materially longer day than the morning's
// 70/110 (weekday vein 119 -> 170), which was the owner's explicit call when the
// floor came off: fuller, more representative boards over a shorter close.
//
// SUNDAY IS 120, NOT the ~170 the weekday:Sunday ratio would imply, and the
// verifier is what set it. The vein is a share of the board maximum, so a bigger
// Sunday needs proportionally MORE words before the day closes, and past a point
// that trips "needs N words at best to reach the vein — a grind". Measured over
// the whole bank: cap 170 -> 23 grind Sundays, 150 -> 15, 140 -> 7, 130 -> 6,
// 120 -> 1. So Sunday sits at 120 (~88 words against the weekday's ~71) and the
// bank ships with a single grind board rather than a third of its Sundays.
//
// The remaining warning is a consequence of the owner's fuller-board call, not a
// regression: the >26-word threshold was calibrated when a weekday board held
// ~39 words and the vein was ~106, and boards are now roughly 1.8x that. If
// bigger Sundays are wanted, the lever is VEIN_SHARE — close the day at a lower
// share of a larger maximum — NOT a higher cap. That changes the rank ladder for
// every board, so it is an owner decision.
//
// ⚠️ verify-lode.mjs writes warnings with console.WARN (stderr). A sweep that
// redirects 2>/dev/null counts zero warnings at every cap and looks like a clean
// result; that mistake picked 150 here before it was caught. Capture 2>&1.
const MIN_WORDS = 20;
const MAX_WORDS = 110;
const MIN_WORDS_SUNDAY = 30;
const MAX_WORDS_SUNDAY = 120;
const MIN_PANGRAMS = 1;
const MAX_PANGRAMS = 4;
// The solve line, as a share of the board maximum. Deliberately reachable in a
// few minutes: Lode shares a reader's morning with two dozen other dailies, so
// the day has to close cleanly. Everything past it is for the obsessives.
const VEIN_SHARE = 0.38;

// The rank ladder, as a share of the board maximum. Reaching `Lode` solves the
// day; `Mother Lode` means every EVERYDAY word on the board (owner, 2026-10-29):
// its cutoff is the points of the words with recorded usage, so the words marked
// `o` (no recorded usage: kreplech, reperepe) are a bonus, never a requirement.
const RANKS = [
  { name: 'Speck', at: 0.03 },
  { name: 'Trace', at: 0.09 },
  { name: 'Seam', at: 0.18 },
  { name: 'Vein', at: 0.27 },
  { name: 'Lode', at: VEIN_SHARE },
  { name: 'Mother Lode', at: 1 },
];

// Inflections are real words and are accepted, but they are not DISCOVERIES:
// "ganging" is only rare because nobody writes it, not because it is a prize.
// Capping them below the top tier keeps the rare bonus pointed at genuine
// vocabulary (ennui, granary, fandango) instead of padded verb forms.
const INFLECTED = /(ING|ED|ER|IER|IEST|LY)$/;

// ─── word data ─────────────────────────────────────────────────────────────
const freq = JSON.parse(readFileSync(join(here, '.lode-freq.json'), 'utf8'));

// EVERY board also carries `extra`: the real dictionary words a player can build
// from its letters that the curated pool does NOT score. They are accepted for
// zero points rather than refused, because "that is not a word" is a lie when
// the word is in the dictionary, and it is the single thing players complain
// about. The scored pool stays curated — a board should be winnable on words a
// reader recognises — so the two lists do different jobs: `words` is the game,
// `extra` is the apology.
//
// This is read from the shipped Scrabble corpus rather than the frequency file,
// because the frequency file is by definition the filtered thing. Words below
// 4 letters, and words missing the core letter, are excluded by the same rules
// the client applies before it ever consults a list.
const CORPUS = [];
for (const f of ['tuck-dict.txt', 'tuck-dict-long.txt']) {
  const txt = readFileSync(join(here, '..', 'public', f), 'utf8');
  for (const line of txt.split('\n')) {
    const w = line.trim().toUpperCase();
    if (w.length >= MIN_LEN) CORPUS.push(w);
  }
}
const corpusBySig = new Map();
for (const w of CORPUS) {
  const sig = [...new Set(w)].sort().join('');
  if (!corpusBySig.has(sig)) corpusBySig.set(sig, []);
  corpusBySig.get(sig).push(w);
}
export function extraFor(core, outer, scored) {
  // Same subset walk as buildBoard, for the same reason.
  const letters = [core, ...outer].sort();
  const on = new Set(scored);
  const out = [];
  const n = letters.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    let sig = '';
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sig += letters[i];
    if (!sig.includes(core)) continue;
    const ws = corpusBySig.get(sig);
    if (!ws) continue;
    for (const w of ws) if (!on.has(w)) out.push(w);
  }
  out.sort();
  return out;
}

function tierOf(z, upper) {
  // z === 0 is "no recorded usage", NOT "vanishingly rare". See NO_FREQ_TIER.
  const t = z === 0 ? NO_FREQ_TIER : z < TIER_RARE ? 3 : z < TIER_UNCOMMON ? 2 : 1;
  return INFLECTED.test(upper) ? Math.min(t, 2) : t;
}
function pointsOf(word, isPangram, tier) {
  return (word.length - 2) * tier + (isPangram ? 10 : 0);
}

const WORDS = [];
for (const [w, z] of Object.entries(freq)) {
  if (w.length < MIN_LEN) continue;   // the letter minimum is the only bar left
  const up = w.toUpperCase();
  WORDS.push({ w: up, set: new Set(up), tier: tierOf(z, up), o: z === 0 });
}
// Bucket by letter-set signature so board assembly is a lookup, not a scan.
const bySig = new Map();
for (const it of WORDS) {
  const sig = [...it.set].sort().join('');
  if (!bySig.has(sig)) bySig.set(sig, []);
  bySig.get(sig).push(it);
}

// Candidate letter sets = the distinct-letter signatures of real words, which
// guarantees at least one pangram exists. 'S' is excluded so a board is not
// padded out with trivial plurals (the same reason Spelling Bee drops it).
function rootSets(size) {
  const out = [];
  for (const sig of bySig.keys()) {
    if (sig.length !== size || sig.includes('S')) continue;
    out.push(sig);
  }
  return out;
}

// Enumerate the SUBSETS of the board's letters and look each one up, rather than
// scanning every signature in the pool and testing it. The two are exactly
// equivalent — a bucket belongs to a board iff its letter set is a subset of the
// board's letters and contains the core — but the scan is O(all signatures) per
// board and the subset walk is O(2^letters), which is 64 or 128 lookups.
//
// This stopped being an optimisation and became a requirement when the floor was
// removed: at 267,009 words the pool holds ~10x the distinct signatures, and the
// scan version ran over 25 minutes without finishing a single bank. It is a pure
// performance change and the output is byte-identical: `words` is sorted by a
// total order (points desc, then alphabetical) before it is returned, and
// `pangrams` and `max` are order-independent, so nothing downstream can observe
// the iteration order. The OUTER loops in poolFor are deliberately untouched, so
// the pool order — and therefore the seeded deal — is unchanged too.
function buildBoard(sig, core) {
  const letters = [...sig];
  const words = [];
  let pangrams = 0;
  const n = letters.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    let s = '';
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s += letters[i];
    if (!s.includes(core)) continue;
    const items = bySig.get(s);
    if (!items) continue;
    const isPan = s.length === sig.length;
    for (const it of items) {
      if (isPan) pangrams++;
      words.push({ w: it.w, p: pointsOf(it.w, isPan, it.tier), t: it.tier, g: isPan ? 1 : 0, ...(it.o ? { o: 1 } : {}) });
    }
  }
  if (!words.length) return null;
  words.sort((a, b) => (b.p - a.p) || a.w.localeCompare(b.w));
  const max = words.reduce((s, x) => s + x.p, 0);
  return { sig, core, words, pangrams, max };
}

function boardOk(b, sunday) {
  if (!b) return false;
  const lo = sunday ? MIN_WORDS_SUNDAY : MIN_WORDS;
  const hi = sunday ? MAX_WORDS_SUNDAY : MAX_WORDS;
  if (b.words.length < lo || b.words.length > hi) return false;
  if (b.pangrams < MIN_PANGRAMS || b.pangrams > MAX_PANGRAMS) return false;
  // A board with no rare words is a grind; one that is all rare is unplayable.
  const rare = b.words.filter((x) => x.t === 3).length / b.words.length;
  if (rare < 0.15 || rare > 0.72) return false;
  return true;
}

// ─── deterministic shuffle (mulberry32) ────────────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const START = arg('from', '2026-08-01');
const DAYS = Number(arg('days', 400));
const SEED = Number(arg('seed', 20260801));
// Boards already played must not be renumbered or reshuffled, so a regeneration
// that changes the word pool covers only future dates and picks up the
// numbering where the surviving bank left off:
//   node scripts/gen-lode.mjs --from 2026-07-31 --startnum 7 --days 494
const START_NUM = Number(arg('startnum', 1));
// A regeneration keeps the boards that have already gone live and deals fresh
// ones underneath them, so the new deal has to know what those kept boards
// used or it can hand out a letter set a player saw a few weeks ago. Point
// --avoid at the bank being spliced into and those boards leave the pool:
//   node scripts/gen-lode.mjs --from 2026-08-16 --startnum 23 --days 478 \
//     --avoid app/lode/puzzles.js
// Filtering happens before the shuffle, so a re-run still reproduces exactly.
const AVOID = arg('avoid', '');
const avoidKeys = new Set();
if (AVOID) {
  const mod = await import(pathToFileURL(resolve(AVOID)).href);
  // Only the boards the splice KEEPS matter: anything dated on or after --from
  // is being replaced by this run, so excluding it would shrink the pool for
  // no reason.
  for (const p of mod.PUZZLES || []) {
    if (p.live >= START) continue;
    avoidKeys.add([p.core, ...p.outer].sort().join('') + '/' + p.core);
  }
}
const boardKey = (b) => [...b.sig].sort().join('') + '/' + b.core;

const weekday = rootSets(LETTERS);
const sunday = rootSets(LETTERS_SUNDAY);

// Pre-build every acceptable (set, core) board once, then deal them out in a
// seeded order. Building up front means the day-to-day dealing is trivial and
// a re-run with the same seed reproduces the identical bank.
function poolFor(sigs, isSunday) {
  const pool = [];
  for (const sig of sigs) {
    for (const core of sig) {
      const b = buildBoard(sig, core);
      if (boardOk(b, isSunday) && !avoidKeys.has(boardKey(b))) pool.push(b);
    }
  }
  return pool;
}
const poolWeek = poolFor(weekday, false);
const poolSun = poolFor(sunday, true);

function shuffled(arr, seed) {
  const r = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const dealWeek = shuffled(poolWeek, SEED);
const dealSun = shuffled(poolSun, SEED + 1);

if (!dealWeek.length || !dealSun.length) {
  console.error(`No boards survived the filters (weekday ${poolWeek.length}, sunday ${poolSun.length}). Loosen the tunables.`);
  process.exit(1);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function ranksFor(max, everyday = max) {
  // Thresholds are absolute points, rounded, and strictly increasing so two
  // ranks can never share a cutoff on a small board.
  const out = [];
  let last = 0;
  for (const r of RANKS) {
    const at = r.at === 1 ? Math.max(last + 1, everyday) : Math.max(last + 1, Math.round(max * r.at));
    out.push({ n: r.name, at });
    last = at;
  }
  return out;
}

const lines = [];
let iw = 0, is = 0;
const start = new Date(START + 'T12:00:00Z');
for (let i = 0; i < DAYS; i++) {
  const d = new Date(start.getTime() + i * 86400000);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, da = d.getUTCDate();
  const isSun = d.getUTCDay() === 0;
  const b = isSun ? dealSun[is++ % dealSun.length] : dealWeek[iw++ % dealWeek.length];
  const rk = ranksFor(b.max, b.words.filter((x) => !x.o).reduce((a, x) => a + x.p, 0));
  const vein = rk.find((x) => x.n === 'Lode').at;
  const others = [...b.sig].filter((c) => c !== b.core).sort();
  lines.push(JSON.stringify({
    num: START_NUM + i,
    quizId: `lode-${mo}-${da}-${String(y).slice(2)}`,
    live: `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`,
    dateLabel: `${MONTHS[mo - 1]} ${da}, ${y}`,
    sunday: isSun,
    core: b.core,
    outer: others,
    vein,
    max: b.max,
    pangrams: b.pangrams,
    ranks: rk,
    words: b.words,
    extra: extraFor(b.core, others, b.words.map((x) => x.w)),
  }));
}

process.stdout.write(`// Puzzle data for Lode, the daily letter-mining word game. Imported ONLY by
// the server page (app/lode/page.js), which filters live<=today before passing
// puzzles to the client — so future boards (and their word lists) never reach
// the browser bundle.
//
// GENERATED by scripts/gen-lode.mjs — do not hand-edit. Every field is derived:
// \`words\` is the complete scored answer list (p = points, t = rarity tier 1/2/3,
// g = 1 for a pangram), \`max\` is their sum, \`vein\` is the solve line, and
// \`ranks\` is the ladder in absolute points. Validate with scripts/verify-lode.mjs.
export const PUZZLES = [
${lines.map((l) => '  ' + l + ',').join('\n')}
];
`);

console.error(`lode: ${DAYS} days from ${START} · weekday pool ${poolWeek.length} · sunday pool ${poolSun.length}` + (AVOID ? ` · avoiding ${avoidKeys.size} kept boards` : ''));
