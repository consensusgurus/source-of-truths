// Bank generator for Glyph, the daily codeword.
//
// A Glyph board is a FILLED crossword grid with every letter replaced by a
// number 1-26, the same number always meaning the same letter, plus a handful
// of revealed numbers (three on a weekday, two on the bigger Sunday Edition).
// There are no clues, so the whole puzzle is the deduction from word shapes,
// crossings and letter frequency. That makes the board's one real claim
// UNIQUENESS: exactly one assignment of the 26 letters to the 26 numbers may
// decode every across and down run into a dictionary word. A second valid
// mapping is not a harder puzzle, it is an unanswerable one.
//
// Two things follow, and they drive the whole design here:
//
//   1. The grid is built by PLACING WORDS, never by sprinkling blocks and
//      filling afterwards. Each new word must cross a word already on the
//      board, its two end caps must stay empty, and every fresh cell it lays
//      down must have both perpendicular neighbours empty. That set of rules
//      guarantees the finished grid's runs are EXACTLY the words placed: no
//      accidental two-letter run, no run over eight letters (the site
//      dictionary stops at eight), no stranded cell, one connected component.
//      It is also why the shape comes out like the live bank's, a loose
//      criss-cross with many singly-checked cells rather than a dense
//      American crossword.
//
//   2. Uniqueness is PROVED per board, against the FULL site dictionary, by
//      this script's own solver, and then proved again independently by
//      scripts/verify-glyph.mjs, which has its own. Two solvers is deliberate
//      (the Cages rule): a generator that certifies itself with the same code
//      the checker runs can only ever agree with itself.
//
// Quality rules the generator enforces beyond legality:
//
//   * ALL 26 LETTERS appear on every board. The key is a permutation, so a
//     letter absent from the grid is a number no run can ever pin down; two
//     absent letters is an automatic ambiguity. The word walk therefore
//     switches to hunting the missing letters (J, Q, X, Z, K, V, W, usually)
//     once the grid has body.
//   * FILL WORDS ARE COMMON WORDS. The site dictionary is a Scrabble list, so
//     "a real word" is a very low bar: fill drawn from it raw reads as a
//     vocabulary test. Words of 4-8 letters must clear Zipf 3.0 in
//     scripts/.lode-freq.json, which is the floor the live bank already sits
//     at (measured: its 1,292 longer answers have a minimum of exactly 3.0).
//     That file holds nothing under four letters, so the three-letter pool is
//     the curated list below.
//   * NO QUESTIONABLE FILL. scripts/glyph-blocklist.mjs (sexual and bodily
//     words, slurs and identity terms, weapons/disease/drug terms, proper
//     nouns and obscure abbreviations) is removed from the fill pool, and a
//     board whose recomputed runs decode to one is rejected. verify-glyph.mjs
//     fails on the same list for boards live on or after GLYPH_BLOCK_FROM.
//   * US SPELLINGS ONLY. The British list is filtered out of the fill pool as
//     well as failed by the verifier.
//   * NO WORD REPEATS INSIDE A BOARD, and no board repeats another board's
//     grid or key across the COMBINED bank (that is what --avoid is for).
//   * THE BOARD SOLVES BY PURE PROPAGATION. Uniqueness alone would allow a
//     board that only a search can crack; every board here is additionally
//     required to fall out of constraint propagation (permutation singles plus
//     dictionary pattern filtering) with no branching at all, which is the
//     machine version of "solvable by deduction and never by guesswork".
//     The givens are chosen to make that true: candidate triples are tried
//     until one of them propagates the whole alphabet out.
//
// Usage:
//   node scripts/gen-glyph.mjs --from 2026-09-20 --days 61 --startnum 50 \
//     --avoid app/glyph/puzzles.js --seed 20260920 --out /tmp/glyph-ext.js
//
//   --from      first live date (YYYY-MM-DD)
//   --days      how many consecutive dates to emit
//   --startnum  `num` of the first board, so a range spliced onto a live bank
//               continues its numbering instead of restarting at 1
//   --avoid     an existing puzzles.js whose grids and keys pre-seed the
//               duplicate check, so the new range is deduped against the
//               MERGED bank rather than only against itself
//   --seed      PRNG seed; the run is deterministic for a given seed
//   --out       destination file (a whole puzzles.js-shaped file; splice its
//               entries onto the live bank)
//   --probe     generate but write nothing, printing the distribution
//   --exclude   comma-separated words to keep off the range, on top of the
//               blocklist. Meant for a one-day regeneration: pass that day's
//               other answers (Clade animal, Dossier answer, Ping city, Focus,
//               trivia keys...) so the grid cannot spoil them. See the
//               cross-game rule in scripts/CONTENT-REVIEW.md.
//
// Sundays are 17x17 with 2 givens; weekdays are 15x15 with 3. Both are read off
// the true UTC weekday of the date, never from a flag passed in.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { isGlyphBlocked } from './glyph-blocklist.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FREQ_FLOOR = 3.0;          // Zipf floor for 4-8 letter fill words
const WORD_CEILING = 3;          // times one answer may appear across the range
// Boards live on or after this date are held to WORD_CEILING; everything before
// it is shipped history and is left alone. Keep it in step with the same
// constant in scripts/verify-glyph.mjs.
const WORD_CEILING_FROM = '2026-09-20';
const MIN_LEN = 3, MAX_LEN = 8;  // the site dictionary stops at 8

// ── deterministic PRNG ─────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── British-only spellings, kept in step with scripts/verify-glyph.mjs ──────
const BRITISH = new Set([
  'COLOUR', 'COLOURS', 'COLOURED', 'COLOURFUL', 'FAVOUR', 'FAVOURS', 'FAVOURITE', 'FAVOURABLE',
  'HONOUR', 'HONOURS', 'HONOURED', 'HONOURABLE', 'NEIGHBOUR', 'NEIGHBOURS', 'NEIGHBOURHOOD',
  'THEATRE', 'THEATRES', 'CENTRE', 'CENTRES', 'CENTRED', 'METRE', 'METRES', 'LITRE', 'LITRES',
  'DEFENCE', 'OFFENCE', 'LICENCE', 'LICENCED', 'PROGRAMME', 'PROGRAMMES', 'CHEQUE', 'CHEQUES',
  'TRAVELLED', 'TRAVELLING', 'TRAVELLER', 'TRAVELLERS', 'CANCELLED', 'CANCELLING', 'MODELLED',
  'MODELLING', 'LABELLED', 'LABELLING', 'JEWELLERY', 'ALUMINIUM', 'MOULD', 'MOULDY', 'MOULDING',
  'SMOULDER', 'PLOUGH', 'PLOUGHED', 'TYRE', 'TYRES', 'KERB', 'KERBS', 'ARTEFACT', 'ARTEFACTS',
  'MANOEUVRE', 'MANOEUVRES', 'ENCYCLOPAEDIA', 'AEROPLANE', 'AEROPLANES', 'PYJAMAS', 'LEARNT',
  'SPELT', 'DREAMT', 'REALISE', 'REALISED', 'REALISING', 'REALISATION', 'ORGANISE', 'ORGANISED',
  'ORGANISING', 'ORGANISATION', 'ANALYSE', 'ANALYSED', 'ANALYSING', 'APOLOGISE', 'APOLOGISED',
  'CRITICISE', 'CRITICISED', 'RECOGNISE', 'RECOGNISED', 'CATALOGUE', 'CATALOGUES', 'DIALOGUE',
  'DIALOGUES', 'STOREY', 'STOREYS', 'COSY', 'COSIER', 'COSIEST', 'SCEPTIC', 'SCEPTICS',
  'SCEPTICAL', 'PRACTISE', 'PRACTISED', 'PRACTISING', 'ENROL', 'ENROLLED', 'ENROLLING',
  'ENROLMENT', 'FULFIL', 'FULFILLED', 'FULFILLING', 'FULFILMENT', 'SKILFUL', 'WILFUL',
  'INSTALMENT', 'INSTALMENTS', 'GAOL', 'GAOLED', 'DRAUGHT', 'DRAUGHTS', 'HUMOUR', 'HUMOURED',
  'RUMOUR', 'RUMOURS', 'RUMOURED', 'LABOUR', 'LABOURS', 'LABOURED', 'LABOURER', 'LABOURERS',
  'VAPOUR', 'VAPOURS', 'ARMOUR', 'ARMOURED', 'ARMOURY', 'SAVOUR', 'SAVOURY', 'FLAVOUR',
  'FLAVOURS', 'FLAVOURFUL', 'FLAVOURED', 'ENDEAVOUR', 'ENDEAVOURS', 'HARBOUR', 'HARBOURS',
  'VIGOUR', 'VALOUR', 'BEHAVIOUR', 'BEHAVIOURAL', 'SULPHUR', 'OESTROGEN', 'FOETUS', 'FOETAL',
  'PAEDIATRIC', 'ORTHOPAEDIC', 'ANAEMIA', 'ANAEMIC', 'DIARRHOEA', 'HAEMOGLOBIN', 'MEDIAEVAL',
  // Extended 2026-08-21 while banking the Sep 20 - Nov 19 range, which surfaced
  // FIBRE from the Zipf 3.0 fill pool: the original list covered the famous
  // -our and -ise families but not the -re family beyond CENTRE/METRE/LITRE.
  'FIBRE', 'FIBRES', 'SABRE', 'SABRES', 'CALIBRE', 'CALIBRES', 'SPECTRE', 'SPECTRES', 'LUSTRE',
  'SOMBRE', 'MEAGRE', 'OCHRE', 'MITRE', 'GREY', 'GREYER', 'GREYISH', 'ODOUR', 'ODOURS', 'ARDOUR',
  'CLAMOUR', 'CANDOUR', 'FERVOUR', 'PARLOUR', 'PARLOURS', 'RANCOUR', 'SPLENDOUR', 'TUMOUR',
  'TUMOURS', 'DEMEANOUR', 'PRETENCE', 'PRETENCES', 'DEFENCES', 'OFFENCES', 'JEWELLER',
  'JEWELLERS', 'MARVELLED', 'MARVELLING', 'LEVELLED', 'LEVELLING', 'SIGNALLED', 'SIGNALLING',
  'TOTALLED', 'FUELLED', 'FUELLING', 'QUARRELLED', 'COUNSELLOR', 'COUNSELLORS', 'MOULDS',
  'MOULDED', 'SMOULDERS', 'SMOULDERING', 'PLOUGHS', 'PLOUGHING', 'KERBED', 'MOULTED',
  'EMPHASISE', 'EMPHASISED', 'MEMORISE', 'MEMORISED', 'MINIMISE', 'MINIMISED', 'MAXIMISE',
  'MAXIMISED', 'SUMMARISE', 'SUMMARISED', 'SPECIALISE', 'SPECIALISED', 'UTILISE', 'UTILISED',
  'PENALISE', 'PENALISED', 'CIVILISE', 'CIVILISED', 'MOBILISE', 'MOBILISED', 'PRIORITISE',
  'HYPNOTISE', 'FANTASISE', 'ORGANISES', 'RECOGNISES', 'APOLOGISES', 'CRITICISES', 'REALISES',
  'COLOURING', 'HONOURING', 'FAVOURING', 'LABOURING',
  // The whole -our family. These were generator-only until 2026-08-21, when
  // glyph-8-23-26 was regenerated to drop SAVIOUR and they all moved onto the
  // verifier's hard-fail list. Keep the two lists in step.
  'SAVIOUR', 'SAVIOURS', 'ARMOUR', 'ARMOURS', 'ARMOURED', 'ARMOURY', 'RUMOUR',
  'RUMOURS', 'RUMOURED', 'HUMOUR', 'HUMOURS', 'HUMOURED', 'HARBOUR', 'HARBOURS',
  'HARBOURED', 'ENDEAVOUR', 'ENDEAVOURS', 'BEHAVIOUR', 'BEHAVIOURS', 'SPLENDOUR',
  'SPLENDOURS', 'VAPOUR', 'VAPOURS', 'ODOUR', 'ODOURS', 'CLAMOUR', 'CLAMOURS',
  'PARLOUR', 'PARLOURS', 'SAVOUR', 'SAVOURS', 'SAVOURED', 'SAVOURY',
]);

// Words a light daily should not surface, matched as stems. The Zipf 3.0 pool
// carries no profanity or slurs, but it does carry violence and clinical
// unpleasantness (SUICIDE, MURDERED, ABORTION), which is not what anyone opened
// a codeword for. Not a censorship list, a tone list.
// Words that are in the site dictionary and clear the frequency floor, but only
// because the corpus counts a NAME. A codeword gives no clue, so an answer a
// solver cannot arrive at by knowing English is a dead end for them: SPIEGEL,
// CARRICK and JACKMAN are all valid Scrabble entries and all unguessable. There
// is no reliable automated proper-noun veto available here (the frequency file
// is lowercased, and hunspell's case test both misses these and drops ordinary
// words), so this is a hand-checked list, extended whenever a run surfaces one.
// Texting shorthand (MERCH, VIDS, MAGS, DISS) goes here for the same reason.
const NAMEY = new Set(['SPIEGEL', 'CHAS', 'TIAN', 'CHAO', 'BUNDY', 'CARRICK', 'COWAN', 'POLLARD',
  'BETHEL', 'LISTER', 'JACKMAN', 'MEIN', 'DESI', 'TONGA', 'MALTESE', 'HOTSPUR', 'CHICO',
  'ZEPPELIN', 'TORI', 'TORY', 'CRAY', 'HIYA', 'DISS', 'HOMIE', 'MERCH', 'VIDS', 'MAGS', 'TELE',
  'PROG', 'LIBS', 'MYSPACE', 'FEDEX', 'JEDI', 'MUPPET', 'GOTH', 'HOLDEN', 'GARTH', 'BETH',
  'SAVANNAH', 'LABRADOR', 'AFRO', 'FLEMISH', 'NORDIC', 'JESUIT', 'PINOT', 'BANCO', 'BLANCO',
  'BASSETT', 'BURRELL', 'AXEL', 'ALFA', 'BOKO', 'BHAI', 'BIEN', 'BOIS', 'BEIN', 'CAMO', 'CARB',
  'CHAKRA', 'CHAI', 'AMIR', 'BADASS']);

const AVOID_STEMS = ['SUICID', 'ABORT', 'MURDER', 'RAPIST', 'MOLEST', 'SLAVE', 'NAZI', 'JIHAD',
  'CORPSE', 'SPERM', 'SEMEN', 'PENIS', 'VAGINA', 'QUEER', 'MORON', 'IDIOT', 'CRIPPLE', 'RETARD'];

// ── the curated three-letter pool ──────────────────────────────────────────
// scripts/.lode-freq.json carries nothing under four letters (Lode's own floor
// is four), so there is no frequency signal to filter three-letter Scrabble
// entries with, and raw they are full of things like AAL, BAS and DOP. This is
// a hand-checked list of ordinary English three-letter words; it is intersected
// with the site dictionary at load, so nothing here can smuggle in a non-word.
const THREE = `ace act add ado aft age ago aha aid ail aim air ale all amp and ant any ape apt arc arm art ash ask asp ate awe axe
bad bag ban bar bat bay bed bee beg bet bib bid big bin bit boa bob bog boo bow box boy bra bud bug bum bun bus but buy bye
cab cad cam can cap car cat caw cob cod cog con coo cop cot cow coy cry cub cud cue cup cur cut
dab dad dam day den dew did die dig dim din dip doe dog don dot dry dub dud due dug duo dye
ear eat ebb eel egg ego elf elk elm emu end eon era err eve ewe eye
fad fan far fat fax fed fee fen few fib fig fin fir fit fix flu fly foe fog for fox fry fun fur
gag gal gap gas gel gem get gig gin gnu goo got gum gun gut guy gym
had hag ham has hat hay hem hen her hew hex hey hid him hip his hit hoe hog hop hot how hub hue hug hum hut
ice icy ill imp ink inn ion ire irk its ivy
jab jag jam jar jaw jay jet jib jig job jog jot joy jug jut
keg ken key kid kin kit
lab lad lag lam lap law lax lay led leg lei let lid lie lip lit lob log lot low lug lye
mad man map mar mat maw may men met mew mid mix mob mod mom mop mow mud mug mum
nab nag nap net new nib nil nip nit nod nor not now nun nut
oaf oak oar oat odd ode off oft oil old one opt orb ore our out owe owl own
pad pal pan par pat paw pay pea peg pen pep per pet pew pie pig pin pit ply pod pop pot pro pry pub pug pun pup put
rag ram ran rap rat raw ray red ref rib rid rig rim rip rob rod roe rot row rub rue rug rum run rut rye
sac sad sag sap sat saw sax say sea see set sew she shy sin sip sir sit six ski sky sly sob sod son sop sow soy spa spy sty sub sue sum sun sup
tab tad tag tan tap tar tax tea ten the thy tic tie tin tip toe ton too top tot tow toy try tub tug tux two
ugh urn use van vat vet vex via vie vim vow
wad wag wan war was wax way web wed wee wet who why wig win wit woe wok won woo wow wry
yak yam yap yaw yea yen yes yet yew yin yip you zag zap zed zig zip zit zoo`
  .split(/\s+/).filter(Boolean).map((w) => w.toUpperCase());

// ── word pools ─────────────────────────────────────────────────────────────
// `dictByLen` is the FULL site dictionary and is what uniqueness is proved
// against: a solver that only knew the fill pool would call a board unique
// when a rival mapping spelled perfectly good words the fill pool happened to
// exclude. `fillByLen` is the smaller, common-word pool the grid is built out
// of.
const dictWords = readFileSync(join(here, '../public/tuck-dict.txt'), 'utf8')
  .trim().split('\n').map((w) => w.trim().toUpperCase()).filter(Boolean);
const freq = JSON.parse(readFileSync(join(here, '.lode-freq.json'), 'utf8'));

const dictByLen = new Map();
const dictSet = new Set(dictWords);
for (const w of dictWords) {
  if (w.length < 2) continue;
  if (!dictByLen.has(w.length)) dictByLen.set(w.length, []);
  dictByLen.get(w.length).push(w);
}

const EXCLUDE = new Set(String(arg('--exclude', '')).split(',').map((w) => w.trim().toUpperCase()).filter(Boolean));
const threeOk = THREE.filter((w) => dictSet.has(w) && !isGlyphBlocked(w) && !EXCLUDE.has(w));
const fillByLen = new Map();
for (const w of dictWords) {
  const L = w.length;
  if (L < MIN_LEN || L > MAX_LEN) continue;
  if (BRITISH.has(w)) continue;
  if (AVOID_STEMS.some((st) => w.includes(st))) continue;
  if (NAMEY.has(w)) continue;
  if (isGlyphBlocked(w)) continue;             // scripts/glyph-blocklist.mjs
  if (EXCLUDE.has(w)) continue;
  if (L === 3) continue;                       // three-letter pool is curated
  if ((freq[w.toLowerCase()] ?? 0) < FREQ_FLOOR) continue;
  if (!fillByLen.has(L)) fillByLen.set(L, []);
  fillByLen.get(L).push(w);
}
fillByLen.set(3, threeOk.slice());
const fillAll = [];
for (let L = MIN_LEN; L <= MAX_LEN; L++) for (const w of (fillByLen.get(L) || [])) fillAll.push(w);
// index: for each letter, the fill words containing it (used to hunt the rare
// letters the key needs).
const fillByLetter = new Map();
for (const L of ALPHABET) fillByLetter.set(L, []);
for (const w of fillAll) for (const L of new Set(w)) fillByLetter.get(L).push(w);

// ── grid construction ──────────────────────────────────────────────────────
const DIRS = [[0, 1], [1, 0]];   // across, down

function emptyGrid(N) { return Array.from({ length: N }, () => new Array(N).fill(null)); }

// Legal iff: in bounds, both end caps empty, every cell either matches (a
// crossing) or is empty with both perpendicular neighbours empty, and at least
// one crossing and one fresh cell.
function canPlace(g, N, word, r, c, dir) {
  const [dr, dc] = DIRS[dir];
  const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
  if (r < 0 || c < 0 || er >= N || ec >= N) return 0;
  const br = r - dr, bc = c - dc;
  if (br >= 0 && bc >= 0 && g[br][bc] !== null) return 0;
  const ar = er + dr, ac = ec + dc;
  if (ar < N && ac < N && g[ar][ac] !== null) return 0;
  let cross = 0, fresh = 0;
  for (let i = 0; i < word.length; i++) {
    const y = r + dr * i, x = c + dc * i;
    const cell = g[y][x];
    if (cell !== null) { if (cell !== word[i]) return 0; cross++; continue; }
    fresh++;
    const py = y + dc, px = x + dr;          // perpendicular neighbours
    const qy = y - dc, qx = x - dr;
    if (py >= 0 && px >= 0 && py < N && px < N && g[py][px] !== null) return 0;
    if (qy >= 0 && qx >= 0 && qy < N && qx < N && g[qy][qx] !== null) return 0;
  }
  if (fresh === 0) return 0;
  return cross;
}

function place(g, word, r, c, dir) {
  const [dr, dc] = DIRS[dir];
  for (let i = 0; i < word.length; i++) g[r + dr * i][c + dc * i] = word[i];
}

// All legal placements of `word` that cross something already on the board.
function placementsFor(g, N, word, cells) {
  const out = [];
  for (const [r, c, L] of cells) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== L) continue;
      for (let dir = 0; dir < 2; dir++) {
        const sr = r - DIRS[dir][0] * i, sc = c - DIRS[dir][1] * i;
        const cross = canPlace(g, N, word, sr, sc, dir);
        if (cross > 0) out.push({ word, r: sr, c: sc, dir, cross });
      }
    }
  }
  return out;
}

function occupied(g, N) {
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] !== null) cells.push([r, c, g[r][c]]);
  return cells;
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// Build one grid. Returns null when the walk stalls short of the targets.
function buildGrid(rng, N, wantWords, fillLo, fillHi) {
  const g = emptyGrid(N);
  const words = [];
  const used = new Set();
  const cellCount = () => { let n = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] !== null) n++; return n; };
  const missing = () => ALPHABET.split('').filter((L) => !words.some((w) => w.word.includes(L)));

  // seed: a long word across the middle
  const seed = pick(rng, fillByLen.get(7 + (rng() < 0.5 ? 0 : 1)));
  const sr = Math.floor(N / 2), sc = Math.floor((N - seed.length) / 2);
  place(g, seed, sr, sc, 0);
  words.push({ word: seed, r: sr, c: sc, dir: 0 });
  used.add(seed);

  const cap = N * N;
  let stall = 0;
  // Length preference shifts as the board fills: long words early to lay the
  // spine, short ones late because a crowded grid has room for little else.
  // Without this the walk stalls at the low end of the word band every time.
  const lengthPool = (ratio) => (ratio < 0.34 ? [6, 6, 7, 7, 8, 5]
    : ratio < 0.46 ? [4, 5, 5, 6, 6, 7]
    : [3, 3, 4, 4, 5, 6]);
  while (words.length < wantWords && stall < 2600) {
    const need = missing();
    const cells = occupied(g, N);
    const filled = cells.length;
    // late in the walk, hunt the letters the key still needs
    const hunt = need.length > 0 && (words.length > wantWords * 0.45 || filled > cap * fillLo * 0.75);
    let cand = null;
    if (hunt) {
      const L = need[Math.floor(rng() * need.length)];
      const pool = fillByLetter.get(L);
      cand = pick(rng, pool);
    } else {
      const want = pick(rng, lengthPool(filled / cap));
      cand = pick(rng, fillByLen.get(want));
    }
    if (!cand || used.has(cand)) { stall++; continue; }
    // do not overshoot the density target
    const opts = placementsFor(g, N, cand, cells).filter((p) => {
      let add = 0;
      for (let i = 0; i < cand.length; i++) {
        const y = p.r + DIRS[p.dir][0] * i, x = p.c + DIRS[p.dir][1] * i;
        if (g[y][x] === null) add++;
      }
      return filled + add <= Math.floor(cap * fillHi);
    });
    if (!opts.length) { stall++; continue; }
    // prefer more crossings (a tighter, more deducible board), break ties randomly
    const best = Math.max(...opts.map((o) => o.cross));
    const shortlist = opts.filter((o) => o.cross === best);
    const chosen = pick(rng, shortlist);
    place(g, cand, chosen.r, chosen.c, chosen.dir);
    words.push({ word: cand, r: chosen.r, c: chosen.c, dir: chosen.dir });
    used.add(cand);
    stall = 0;
  }
  const filled = cellCount();
  if (missing().length) return null;
  if (filled < cap * fillLo || filled > cap * fillHi) return null;
  return { g, words, filled };
}

// ── runs, recomputed from the finished grid (never from the word list) ─────
function runsOf(rows, w, h) {
  const runs = [];
  for (let r = 0; r < h; r++) {
    let c = 0;
    while (c < w) {
      if (rows[r][c] !== '.') { const a = []; while (c < w && rows[r][c] !== '.') { a.push(rows[r][c]); c++; } if (a.length >= 2) runs.push(a); } else c++;
    }
  }
  for (let c = 0; c < w; c++) {
    let r = 0;
    while (r < h) {
      if (rows[r][c] !== '.') { const a = []; while (r < h && rows[r][c] !== '.') { a.push(rows[r][c]); r++; } if (a.length >= 2) runs.push(a); } else r++;
    }
  }
  return runs;
}

// ── uniqueness solver (this script's own; verify-glyph.mjs has another) ────
// Bitmask over the 26 letters per number, plus a live candidate-word list per
// run. Propagation is: eliminate assigned letters from other numbers, promote a
// letter that fits only one number, then filter each run's word list against
// the current masks and intersect the surviving letters back. Search branches
// on the tightest number.
const FULL = (1 << 26) - 1;
const bit = (L) => 1 << (L.charCodeAt(0) - 65);
const popcount = (x) => { let n = 0; while (x) { x &= x - 1; n++; } return n; };
const lowLetter = (x) => ALPHABET[31 - Math.clz32(x & -x)];

function encodeRuns(runNums, poolByLen) {
  return runNums.map((nums) => ({
    nums,
    pool: (poolByLen.get(nums.length) || []).map((w) => { const a = new Array(w.length); for (let i = 0; i < w.length; i++) a[i] = bit(w[i]); return { w, a }; }),
  }));
}

function propagate(mask, runs, runPools) {
  for (;;) {
    let changed = false;
    // assigned letters cannot be used twice
    let assigned = 0;
    for (let n = 1; n <= 26; n++) if (popcount(mask[n]) === 1) assigned |= mask[n];
    for (let n = 1; n <= 26; n++) {
      if (popcount(mask[n]) === 1) continue;
      const nm = mask[n] & ~assigned;
      if (nm !== mask[n]) { if (!nm) return false; mask[n] = nm; changed = true; }
    }
    // a letter that fits exactly one number belongs to it
    for (let b = 0; b < 26; b++) {
      const L = 1 << b;
      let fits = 0, who = -1;
      for (let n = 1; n <= 26; n++) if (mask[n] & L) { fits++; who = n; if (fits > 1) break; }
      if (fits === 0) return false;
      if (fits === 1 && mask[who] !== L) { mask[who] = L; changed = true; }
    }
    // dictionary pattern filtering per run
    for (let ri = 0; ri < runs.length; ri++) {
      const { nums } = runs[ri];
      const pool = runPools[ri];
      const keep = [];
      const seen = new Array(nums.length).fill(0);
      for (let k = 0; k < pool.length; k++) {
        const e = pool[k];
        let ok = true;
        for (let i = 0; i < nums.length; i++) if (!(mask[nums[i]] & e.a[i])) { ok = false; break; }
        if (!ok) continue;
        keep.push(e);
        for (let i = 0; i < nums.length; i++) seen[i] |= e.a[i];
      }
      if (!keep.length) return false;
      if (keep.length !== pool.length) runPools[ri] = keep;
      for (let i = 0; i < nums.length; i++) {
        const nm = mask[nums[i]] & seen[i];
        if (!nm) return false;
        if (nm !== mask[nums[i]]) { mask[nums[i]] = nm; changed = true; }
      }
    }
    if (!changed) return true;
  }
}

// Returns { count, propagated } where count is capped at `cap` and
// `propagated` says the board fell out of propagation alone with no branching.
function solve(runs, givens, key, cap = 2, nodeCap = 200000) {
  const mask0 = new Array(27).fill(FULL);
  for (const n of givens) mask0[n] = bit(key[n - 1]);
  const pools0 = runs.map((r) => r.pool);
  if (!propagate(mask0, runs, pools0)) return { count: 0, propagated: false };
  let solved = true;
  for (let n = 1; n <= 26; n++) if (popcount(mask0[n]) !== 1) solved = false;
  const found = [];
  let nodes = 0, capped = false;
  const rec = (mask, pools) => {
    if (found.length >= cap || capped) return;
    if (++nodes > nodeCap) { capped = true; return; }
    if (!propagate(mask, runs, pools)) return;
    let best = -1, bestSize = 99;
    for (let n = 1; n <= 26; n++) { const s = popcount(mask[n]); if (s > 1 && s < bestSize) { bestSize = s; best = n; } }
    if (best === -1) { found.push(Array.from({ length: 26 }, (_, i) => lowLetter(mask[i + 1])).join('')); return; }
    let bits = mask[best];
    while (bits) {
      const L = bits & -bits; bits ^= L;
      const m2 = mask.slice(); m2[best] = L;
      rec(m2, pools.slice());
      if (found.length >= cap || capped) return;
    }
  };
  const m = new Array(27).fill(FULL);
  for (const n of givens) m[n] = bit(key[n - 1]);
  rec(m, runs.map((r) => r.pool));
  return { count: capped ? cap + 1 : found.length, propagated: solved, solutions: found, capped };
}

// ── one board ──────────────────────────────────────────────────────────────
function makeBoard(rng, sunday, seenGrids, seenKeys, wordUse) {
  const N = sunday ? 17 : 15;
  const wantWords = sunday ? 39 + Math.floor(rng() * 7) : 32 + Math.floor(rng() * 9);
  const built = buildGrid(rng, N, wantWords, 0.50, 0.60);
  if (!built) return null;
  const { g, words } = built;

  // key: a random permutation, key[i-1] is the letter number i stands for
  const letters = ALPHABET.split('');
  for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
  const key = letters.join('');
  const numOf = new Map();
  for (let i = 0; i < 26; i++) numOf.set(key[i], i + 1);

  const rows = [];
  for (let r = 0; r < N; r++) {
    let s = '';
    for (let c = 0; c < N; c++) s += g[r][c] === null ? '.' : String.fromCharCode(96 + numOf.get(g[r][c]));
    rows.push(s);
  }
  const gridKey = rows.join('|');
  if (seenGrids.has(gridKey) || seenKeys.has(key)) return null;

  // recompute the runs from the ENCODED rows, so what is checked is what ships
  const runNums = runsOf(rows, N, N).map((a) => a.map((ch) => ch.charCodeAt(0) - 96));
  if (runNums.some((a) => a.length < MIN_LEN || a.length > MAX_LEN)) return null;
  // The word count is the RECOMPUTED run count, not the number of words the
  // walk placed: a later word may legally swallow an earlier one whole (CAT
  // inside SCATTER), which leaves the grid correct but one run shorter. Bands
  // are the live bank's own, 28-40 words on a weekday and 36-44 on a Sunday.
  const loWords = sunday ? 38 : 30, hiWords = sunday ? 45 : 40;
  if (runNums.length < loWords || runNums.length > hiWords) return null;
  const decoded = runNums.map((a) => a.map((n) => key[n - 1]).join(''));
  if (decoded.some((w) => !dictSet.has(w) || BRITISH.has(w) || isGlyphBlocked(w) || EXCLUDE.has(w))) return null;
  if (new Set(decoded).size !== decoded.length) return null;   // no repeat inside a board
  // cross-bank variety: no answer may appear more than WORD_CEILING times over
  // the boards this rule governs (see WORD_CEILING_FROM), counted across the
  // MERGED bank when --avoid supplies one.
  if (decoded.some((w) => (wordUse.get(w) || 0) >= WORD_CEILING)) return null;
  const onBoard = new Set(); for (const a of runNums) for (const n of a) onBoard.add(n);
  if (onBoard.size !== 26) return null;

  const runs = encodeRuns(runNums, dictByLen);
  const wantGiven = sunday ? 2 : 3;
  const nums = Array.from({ length: 26 }, (_, i) => i + 1);
  // try given sets until one propagates the whole board out
  let chosen = null, fallback = null;
  for (let t = 0; t < 90 && !chosen; t++) {
    const shuffled = nums.slice();
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const given = shuffled.slice(0, wantGiven).sort((a, b) => a - b);
    const res = solve(runs.map((r) => ({ ...r })), given, key);
    if (res.count !== 1) continue;
    if (res.solutions[0] !== key) continue;
    if (res.propagated) chosen = given;
    else if (!fallback) fallback = given;
  }
  const given = chosen || null;      // pure-propagation boards only
  if (!given) return null;
  return { w: N, h: N, words: runNums.length, given, key, rows, decoded };
}

// ── dates ──────────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iso = (d) => d.toISOString().slice(0, 10);
const label = (s) => { const d = new Date(`${s}T12:00:00Z`); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (s) => { const d = new Date(`${s}T12:00:00Z`); return `glyph-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
const isSunday = (s) => new Date(`${s}T12:00:00Z`).getUTCDay() === 0;

// ── build the range ────────────────────────────────────────────────────────
const from = arg('--from');
const days = Number(arg('--days', 1));
const startNum = Number(arg('--startnum', 1));
const seed = Number(arg('--seed', 1));
if (!from) { console.error('need --from YYYY-MM-DD'); process.exit(1); }
if (!Number.isInteger(startNum) || startNum < 1) { console.error('--startnum must be a positive integer'); process.exit(1); }

const seenGrids = new Set(), seenKeys = new Set(), wordUse = new Map();
const avoidPath = arg('--avoid');
if (avoidPath) {
  const mod = await import(pathToFileURL(resolvePath(avoidPath)).href);
  const prior = mod.PUZZLES || [];
  for (const p of prior) {
    seenGrids.add(p.rows.join('|'));
    seenKeys.add(p.key);
    if (p.live >= WORD_CEILING_FROM) {
      for (const a of runsOf(p.rows, p.w, p.h)) {
        const w = a.map((ch) => p.key[ch.charCodeAt(0) - 97]).join('');
        wordUse.set(w, (wordUse.get(w) || 0) + 1);
      }
    }
  }
  console.error(`avoiding ${prior.length} existing boards from ${avoidPath} (${wordUse.size} answers already counted against the ${WORD_CEILING}-use ceiling)`);
}

const rng = mulberry32(seed);
const out = [];
for (let d = 0; d < days; d++) {
  const date = new Date(`${from}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + d);
  const live = iso(date);
  const sun = isSunday(live);
  let board = null;
  const t0 = Date.now();
  for (let tries = 0; tries < 4000 && !board; tries++) {
    board = makeBoard(rng, sun, seenGrids, seenKeys, wordUse);
    if (Date.now() - t0 > 240000) break;
  }
  if (!board) { console.error(`no board for ${live} inside the budget`); process.exit(1); }
  seenGrids.add(board.rows.join('|'));
  seenKeys.add(board.key);
  for (const w of board.decoded) wordUse.set(w, (wordUse.get(w) || 0) + 1);
  out.push({ num: startNum + d, quizId: quizIdOf(live), live, dateLabel: label(live), sunday: sun, ...board });
  console.error(`${live}${sun ? ' (Sunday)' : ''}  ${board.w}x${board.h}, ${board.words} words, given ${board.given.join(',')}, ${Date.now() - t0}ms`);
}

if (has('--probe')) {
  const lens = {};
  for (const p of out) for (const w of p.decoded) lens[w.length] = (lens[w.length] || 0) + 1;
  console.log('word lengths', lens);
  process.exit(0);
}

const header = `// Puzzle data for Glyph, the daily codeword. Generated by scripts/gen-glyph.mjs
// and checked by scripts/verify-glyph.mjs.
`;
const body = out.map((p) => `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    w: ${p.w}, h: ${p.h}, words: ${p.words},
    given: [${p.given.join(', ')}],
    key: '${p.key}',
    rows: [
${p.rows.map((r) => `      '${r}',`).join('\n')}
    ],
  },`).join('\n');

const dest = arg('--out', '/tmp/glyph-ext.js');
writeFileSync(dest, `${header}export const PUZZLES = [\n${body}\n];\n`);
console.error(`\nwrote ${out.length} boards to ${dest}`);
