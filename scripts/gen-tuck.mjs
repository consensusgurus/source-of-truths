#!/usr/bin/env node
// gen-tuck — build racks for Tuck, the daily tile-tucking word game
// (app/tuck/puzzles.js).
//
//   node scripts/gen-tuck.mjs --selfcheck --avoid app/tuck/puzzles.js
//        re-solves every banked rack with the mirror solver and diffs against the
//        stored benchmark. Run this FIRST, always: it is the proof that the fast
//        solver in here still agrees with scripts/verify-tuck.mjs.
//   node scripts/gen-tuck.mjs --probe --from 2026-09-30 --days 62 --startnum 75 \
//       --avoid app/tuck/puzzles.js
//        full search, prints the variety report and the live rude list, writes
//        nothing.
//   node scripts/gen-tuck.mjs --from 2026-09-30 --days 62 --startnum 75 \
//       --avoid app/tuck/puzzles.js --append
//        the real thing: appends the new rows to app/tuck/puzzles.js, refusing
//        unless the first new date is after the bank's last and the first new num
//        follows the bank's last. Nothing before the closing `];` is rewritten.
//        Use --out PATH instead to write the rows to a file for inspection.
//   other flags: --seed N (default 20260930), --tries N (deals per day, default
//        20000), --premcap N (the per-letter premium ceiling; 99 measures the
//        natural pressure).
//
//   ALWAYS finish with `node scripts/verify-tuck.mjs`. It takes about 90 seconds
//   for 136 boards and it is the gate, not this script.
//
// WHAT A BOARD IS. A Tuck day is fourteen letters (fifteen on Sunday) and one
// number. The number is the whole contract: `benchmark = round(1.06 x the
// ladder solver's best line)`, where the ladder solver is the one in
// scripts/verify-tuck.mjs. So the generator's only unforgeable output is the
// rack; everything else is computed from it, twice — once here and once by the
// verifier, which is the gate.
//
// THE SOLVER IN HERE IS A MIRROR, NOT A SECOND OPINION. `ladder()` below
// reproduces scripts/verify-tuck.mjs's `ladder()` exactly — the same 2-to-8
// letter corpus from public/tuck-dict.txt, the same top-250 spines by points,
// the same two column orders, the same greedy first-fitting vertical, the same
// +10 for a full tuck. It is only ~100x faster (a rack costs ~12ms instead of
// ~1.2s), which is what makes a rejection-sampling search affordable at all.
// The speed comes from three things and nothing else:
//   * one pass per rack that computes each word's DEFICIT against the rack, so
//     `formable` and all 26 `nearFormable` lists fall out together (a word fits
//     rack+L exactly when its deficit is empty or is exactly {L:1});
//   * the dictionary pre-sorted once by points DESC then original index ASC,
//     which is byte-for-byte what `dict.filter(...).sort((a,b)=>b.p-a.p)`
//     produces under V8's stable sort, so no per-rack sorting is needed and the
//     greedy fill picks the same candidate the verifier picks;
//   * a letter-bitmask reject (`out & (out-1)`) that throws out ~95% of the
//     list in one integer test.
// If verify-tuck's solver ever changes, THIS MUST CHANGE WITH IT. The proof
// that they still agree is `--selfcheck`, which re-solves every rack already in
// the bank and diffs against the stored benchmark.
//
// WHAT MAKES A GOOD DAY (the part a machine has to be told). A legal rack is
// not a good rack. Four failure modes are real and all four are screened:
//
//   1. UNPLAYABLE / THIN. A rack the solver cannot get a line out of. Floors:
//      the solver line must land inside the band dealt to the day (below), and
//      the rack must form at least MIN_FORMABLE words over the verifier's
//      corpus. The thinnest rack ever banked (AAAUUUCFFHSVWW) forms 124, so 120
//      is a wall the shipped bank has already leaned on.
//   2. DOMINATED BY ONE WORD. If the single best word a player can find is most
//      of the day's score, the "build your own grid" game collapses into "spot
//      the anagram". Measured as dominance = topWordPoints / solverBest over
//      the FULL player dictionary (base + extra + long, which is what the client
//      validates against). The calibrated-era bank runs 0.289 to 0.489, median
//      0.362; the ceiling here is 0.44, i.e. stricter than what has shipped.
//   3. AN UNPLEASANT WORD AS THE OBVIOUS PLAY. See the next block.
//   4. A BENCHMARK THAT WILL NOT FIT ON THE BOARD. The verifier's solver counts
//      points and never asks whether its spine-plus-verticals shape fits in the
//      client's nine rows, and in the worst case it does not (two 8-letter
//      verticals crossing at their first and last letters want fifteen). This
//      generator only banks a rack whose best line is geometrically realisable.
//      Worth knowing: over the 15,345 deals of the shipping run it rejected
//      exactly ZERO racks — the greedy fill's verticals are short and cross near
//      their middles — so the gate is cheap insurance, not a live constraint.
//
// THE RUDE SCREEN. public/tuck-dict.txt was screened for slurs by EXACT MATCH
// (20 scrubbed 2026-07-18) and public/tuck-dict-extra.txt deliberately puts
// some of the mild casualties back for player validation, so the dictionary a
// player actually plays against still contains COCK, TITS, PRICK, SNATCH, MUFF,
// NUDE, POOP, and — an exact-match screen having missed the singular — WOG and
// GYP in the base file itself. None of that is a reason to touch the
// dictionaries: they are frozen because every bank verifier on the site reasons
// over them. It IS a reason to refuse racks that make one of those words the
// day's obvious best play. So a rack is refused when any of its top
// SCREEN_TOP highest-scoring plays over the player dictionary is screened, or
// when any word in the solver's own best line is screened. The list is stems +
// ordinary suffixes (never substrings — CLASS, TITLE and ASSIST are words),
// covering profanity, slurs, sexual and bodily terms, and the violence /
// clinical register a breakfast-table daily should not surface. `--probe`
// prints exactly which dictionary entries the screen catches, so it stays a
// real list rather than a theoretical one.
//
// THE RAMP. Sunday is the Sunday Edition: fifteen letters, 5-7 vowels (weekdays
// are fourteen and 4-6), and here also a higher floor on the solver line —
// SUNDAY_BANDS starts at 52 where WEEKDAY_BANDS starts at 46. That is a real
// step up: the shipped calibrated-era Sundays run as low as 46, i.e. no higher
// than a Tuesday.
//
// A FLOOR IS NOT A TARGET. Days are not simply accepted for clearing 46. Each
// day is dealt a target BAND from a deterministic, shuffled schedule with fixed
// proportions, and the rack must land INSIDE that band — a closed interval, so
// a day dealt 46-50 cannot be quietly satisfied with a 64. Bands and shares:
//   weekday  46-50 (32%) · 51-55 (32%) · 56-61 (26%) · 62-72 (10%)
//   sunday   52-57 (44%) · 58-63 (34%) · 64-76 (22%)
// The tops of both ladders are deliberately thin: a bag deal clears 62 about 4%
// of the time on a weekday and 64 about 5% on a Sunday, and every one of those
// racks is carrying a Q, a Z or an X. Widen the top band and the premium-letter
// ceiling below is the thing that breaks — that is not a coincidence, it is the
// variety trap arriving from the other direction.
//
// POOL VARIETY, enforced here and reported by --probe. Scope is the COMBINED
// bank (the frozen boards seed the duplicate sets through --avoid); the
// counting ceilings are scoped to the new run, which is the segment this script
// is responsible for:
//   * no rack repeats another rack as a multiset of letters                (0)
//   * no top word repeats another day's top word — over the whole 136-board
//     bank, not just this run                                              (0)
//   * the vowel/consonant split is SCHEDULED, not sampled: the three legal
//     weekday splits (4, 5 and 6 vowels) are dealt in equal thirds and so are
//     the three Sunday ones (5, 6, 7), then the schedule is reshuffled until no
//     count runs more than 3 days in a row across the merged calendar. Left to
//     the sampler this clusters badly: the same generator with the schedule off
//     dealt nine Sundays without a single 5-vowel rack among them.
//   * no single top-word LENGTH takes more than 30% of the new run
//   * per rack: at most 4 tiles worth 4+ points, at most 2 of J/Q/X/Z, at most
//     4 copies of a vowel and 3 of a consonant
//   * across the new run: at most 15 boards carrying each of J, Q, X and Z, and
//     17 carrying K (--premcap). A fair bag deals about 9 of each over 62
//     boards; the shipped bank drifted to the equivalent of 16 Z, 16 J and 19 K
//     because rerolling for a high solver line quietly rewards premium tiles,
//     and this generator's own uncapped probe run drifted to 21 Q. The cap
//     BINDS — J, Q and Z all finish the shipping run at exactly 15 — which is
//     what a ceiling is for. Raising it is the wrong lever if a future run runs
//     short; lower the top band instead.
//
// WHY BAG SAMPLING AND NOT LETTER-FREQUENCY SAMPLING. Racks are dealt from the
// real 98-tile Scrabble bag WITHOUT replacement, so duplicate letters are
// self-limiting and the racks read like deals rather than like a generator's
// idea of English. 64% of bag deals inside the vowel band already clear 45, so
// there is no need to tilt the bag toward premium letters — and tilting it is
// exactly how every rack starts to feel the same.
//
// DETERMINISM. One xorshift32 seeded with SEED offset by STARTNUM, so an
// unchanged run reproduces byte-identically and a segment starting at a
// different board number can never replay the frozen segment's deals.
//
// WHAT THE RUNWAY LOOKS LIKE. Nothing about the rack space runs out: the bag is
// memoryless, top-word collisions with the existing bank cost 8 deals in 15,345,
// and 62 boards take 26 seconds. What DOES bind is the premium-letter ceiling,
// because the top band and the ceiling pull against each other — J, Q and Z all
// finish this run exactly at 15. A longer run is fine (the ceilings scale with
// DAYS), but a run that also widens the top band is not. If a future extension
// fails to fill a day, read the per-day rejection line the failure prints: a
// `premium-cap` majority means the bands are too hot for the ceiling, and a
// `band` majority means the band itself is too narrow.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');

// ─── args ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const FROM = arg('--from', '2026-09-30');
const DAYS = Number(arg('--days', '62'));
const STARTNUM = Number(arg('--startnum', '75'));
const SEED = Number(arg('--seed', '20260930'));
const AVOID = arg('--avoid', '');
const OUT = arg('--out', '');
const APPEND = has('--append');
const PROBE = has('--probe');
const SELFCHECK = has('--selfcheck');
const MAX_TRIES = Number(arg('--tries', '20000'));

// ─── scoring, shared with the client and the verifier ──────────────────────
const PTS = { A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10 };
const CA = 'A'.charCodeAt(0);
const PTSA = new Int32Array(26);
for (const k in PTS) PTSA[k.charCodeAt(0) - CA] = PTS[k];
const VOWELS = 'AEIOU';

// ─── the verifier's corpus: public/tuck-dict.txt, 2 to 8 letters ───────────
const rawFile = readFileSync(join(ROOT, 'public/tuck-dict.txt'), 'utf8').trim().split('\n').map((w) => w.toUpperCase());
const DICT = rawFile.filter((w) => w.length >= 2 && w.length <= 8);
const N = DICT.length;
const W_len = new Int32Array(N);
const W_p = new Int32Array(N);
const W_cnt = new Uint8Array(N * 26);
const W_ltr = new Int32Array(N * 8);
const W_mask = new Int32Array(N);
const W_dist = [];
for (let i = 0; i < N; i++) {
  const w = DICT[i];
  W_len[i] = w.length;
  const base = i * 26;
  let p = 0;
  for (let j = 0; j < w.length; j++) {
    const c = w.charCodeAt(j) - CA;
    W_cnt[base + c]++; W_ltr[i * 8 + j] = c; p += PTSA[c];
  }
  W_p[i] = p;
  const d = []; let mk = 0;
  for (let c = 0; c < 26; c++) if (W_cnt[base + c]) { d.push(c); mk |= 1 << c; }
  W_dist.push(d); W_mask[i] = mk;
}
// points DESC then original index ASC — identical to what
// dict.filter(...).sort((a,b)=>b.p-a.p) yields under V8's stable sort.
const ORD = new Int32Array(N);
{
  const idx = []; for (let i = 0; i < N; i++) idx.push(i);
  idx.sort((a, b) => (W_p[b] - W_p[a]) || (a - b));
  for (let i = 0; i < N; i++) ORD[i] = idx[i];
}
const MASK_ORD = new Int32Array(N);
for (let oi = 0; oi < N; oi++) MASK_ORD[oi] = W_mask[ORD[oi]];

const rackCounts = (rack) => { const r = new Int32Array(26); for (const ch of rack) r[ch.charCodeAt(0) - CA]++; return r; };

// ─── the ladder solver, a mirror of scripts/verify-tuck.mjs ────────────────
// One horizontal spine with vertical words hung off non-adjacent columns. The
// shape is realisable on the client's 9x9 board: the spine is at most 8 wide
// and a vertical is at most 8 tall, and non-adjacent columns can never touch,
// so no unintended run is ever formed. Returns { best, line, formable }.
function ladder(rack) {
  const rc = rackCounts(rack);
  let rackMask = 0;
  for (let c = 0; c < 26; c++) if (rc[c] > 0) rackMask |= 1 << c;
  const notRack = ~rackMask;
  const formable = [];
  const near = []; for (let c = 0; c < 26; c++) near.push([]);
  for (let oi = 0; oi < N; oi++) {
    // a word short of two or more of the rack's letters can never sit within
    // deficit 1 — one integer test throws out ~95% of the list
    const out = MASK_ORD[oi] & notRack;
    if (out & (out - 1)) continue;
    const i = ORD[oi];
    const base = i * 26;
    const d = W_dist[i];
    let defL = -1, over = 0;
    for (let k = 0; k < d.length; k++) {
      const c = d[k];
      const need = W_cnt[base + c] - rc[c];
      if (need > 0) { over += need; if (over > 1) { defL = -2; break; } defL = c; }
    }
    if (defL === -2) continue;
    if (defL === -1) { formable.push(i); for (let k = 0; k < d.length; k++) near[d[k]].push(i); }
    else near[defL].push(i);
  }
  const spines = [];
  for (const i of formable) { if (W_len[i] >= 4) { spines.push(i); if (spines.length === 250) break; } }

  const rem = new Int32Array(26);
  const usedCols = new Int32Array(16);
  const colsCh = new Int32Array(16), colsI = new Int32Array(16);
  const ordCh = new Int32Array(16), ordI = new Int32Array(16);
  let best = 0, bestLine = [];
  for (const h of spines) {
    const L = W_len[h], hb = h * 26;
    for (let j = 0; j < L; j++) { colsCh[j] = W_ltr[h * 8 + j]; colsI[j] = j; }
    for (let o = 0; o < 2; o++) {
      if (o === 0) { for (let j = 0; j < L; j++) { ordCh[j] = colsCh[j]; ordI[j] = colsI[j]; } }
      else {
        const idx = []; for (let j = 0; j < L; j++) idx.push(j);
        idx.sort((a, b) => PTSA[colsCh[b]] - PTSA[colsCh[a]]);
        for (let j = 0; j < L; j++) { ordCh[j] = colsCh[idx[j]]; ordI[j] = colsI[idx[j]]; }
      }
      let ok = true;
      for (let c = 0; c < 26; c++) { const v = rc[c] - W_cnt[hb + c]; if (v < 0) { ok = false; break; } rem[c] = v; }
      if (!ok) continue;
      let remSum = 0; for (let c = 0; c < 26; c++) remSum += rem[c];
      let score = W_p[h], used = L;
      const line = [{ i: h, ch: -1 }];
      for (let k = 0; k < 16; k++) usedCols[k] = 0;
      for (let j = 0; j < L; j++) {
        if (remSum === 0) break;
        const ch = ordCh[j], i0 = ordI[j];
        if (usedCols[i0] || (i0 > 0 && usedCols[i0 - 1]) || usedCols[i0 + 1]) continue;
        const cands = near[ch];
        let avail = 1 << ch;
        for (let c = 0; c < 26; c++) if (rem[c] > 0) avail |= 1 << c;
        const notAvail = ~avail;
        for (let q = 0; q < cands.length; q++) {
          const v = cands[q];
          if (W_mask[v] & notAvail) continue;
          const vb = v * 26, dv = W_dist[v];
          let fit = true;
          for (let k = 0; k < dv.length; k++) {
            const c = dv[k];
            const need = W_cnt[vb + c] - (c === ch ? 1 : 0);
            if (need > 0 && rem[c] < need) { fit = false; break; }
          }
          if (!fit) continue;
          for (let k = 0; k < dv.length; k++) {
            const c = dv[k];
            const need = W_cnt[vb + c] - (c === ch ? 1 : 0);
            if (need > 0) { rem[c] -= need; remSum -= need; }
          }
          score += W_p[v]; used += W_len[v] - 1; usedCols[i0] = 1; line.push({ i: v, ch });
          break;
        }
      }
      if (used === rack.length) score += 10;
      if (score > best) { best = score; bestLine = line.slice(); }
    }
  }
  return { best, line: bestLine.map((x) => ({ w: DICT[x.i], ch: x.ch < 0 ? null : String.fromCharCode(CA + x.ch) })), formable: formable.length };
}

// ─── does the solver's own line actually fit the client's 9x9 board? ──────
// The ladder is one horizontal spine with verticals hung off non-adjacent
// columns, and nothing in verify-tuck's solver checks that the result fits in
// nine rows. It usually does and occasionally does not: put the spine on row r,
// and a vertical crossing it at index p of a word of length n needs p rows above
// and n-1-p below, so an 8-letter vertical crossing at its first letter and
// another crossing at its last would want fifteen rows. A benchmark nobody can
// physically reach is not a mark to beat, so this generator only banks racks
// whose best line is realisable — columns are non-adjacent by construction, so
// no unintended run is ever formed and the fit is purely vertical.
const BOARD = 9;
function lineFitsBoard(line) {
  const spine = line[0];
  if (spine.w.length > BOARD) return false;
  const verticals = line.slice(1);
  for (let r = 0; r < BOARD; r++) {
    let all = true;
    for (const v of verticals) {
      let ok = false;
      for (let p = 0; p < v.w.length; p++) {
        if (v.w[p] !== v.ch) continue;
        if (p <= r && (v.w.length - 1 - p) <= BOARD - 1 - r) { ok = true; break; }
      }
      if (!ok) { all = false; break; }
    }
    if (all) return true;
  }
  return false;
}

// ─── the PLAYER's dictionary: what the client actually validates against ───
// lib/rack-dict.js loads base + extra + long, so this is the list a player's
// "obvious best play" is drawn from — wider than the solver's corpus in both
// directions (9-15 letter runs, and the ordinary short words the rude screen
// took out of the base file).
const readList = (rel) => {
  try { return readFileSync(join(ROOT, rel), 'utf8').trim().split('\n').map((w) => w.trim().toUpperCase()).filter(Boolean); }
  catch (e) { return []; }
};
const PLAYER_WORDS = [...new Set([
  ...readList('public/tuck-dict.txt'),
  ...readList('public/tuck-dict-extra.txt'),
  ...readList('public/tuck-dict-long.txt'),
])].filter((w) => /^[A-Z]+$/.test(w));
const M = PLAYER_WORDS.length;
const P_cnt = new Uint8Array(M * 26);
const P_p = new Int32Array(M);
const P_mask = new Int32Array(M);
for (let i = 0; i < M; i++) {
  const w = PLAYER_WORDS[i]; const base = i * 26; let p = 0;
  for (let j = 0; j < w.length; j++) { const c = w.charCodeAt(j) - CA; P_cnt[base + c]++; p += PTSA[c]; }
  P_p[i] = p;
  let mk = 0; for (let c = 0; c < 26; c++) if (P_cnt[base + c]) mk |= 1 << c;
  P_mask[i] = mk;
}
const P_ORD = new Int32Array(M);
{
  const idx = []; for (let i = 0; i < M; i++) idx.push(i);
  idx.sort((a, b) => (P_p[b] - P_p[a]) || (PLAYER_WORDS[b].length - PLAYER_WORDS[a].length) || (PLAYER_WORDS[a] < PLAYER_WORDS[b] ? -1 : 1));
  for (let i = 0; i < M; i++) P_ORD[i] = idx[i];
}
const P_MASK_ORD = new Int32Array(M);
for (let oi = 0; oi < M; oi++) P_MASK_ORD[oi] = P_mask[P_ORD[oi]];

// the K highest-scoring words a player can build from the rack, points DESC
function topPlays(rack, k) {
  const rc = rackCounts(rack);
  let rackMask = 0; for (let c = 0; c < 26; c++) if (rc[c] > 0) rackMask |= 1 << c;
  const notRack = ~rackMask;
  const out = [];
  for (let oi = 0; oi < M && out.length < k; oi++) {
    if (P_MASK_ORD[oi] & notRack) continue;
    const i = P_ORD[oi], base = i * 26;
    let fit = true;
    for (let c = 0; c < 26; c++) if (P_cnt[base + c] > rc[c]) { fit = false; break; }
    if (fit) out.push({ w: PLAYER_WORDS[i], p: P_p[i] });
  }
  return out;
}

// ─── the rude / tone screen ────────────────────────────────────────────────
// Stems, expanded by ordinary suffixes and matched WHOLE-WORD only. Substring
// matching is what ruins these lists (ASS is in CLASS, TIT is in TITLE, COON is
// in COCOON, and the base dictionary's own exact-match screen already proved
// the point by taking KNOB and PAWN with it).
const RUDE_STEMS = `
arse ass bastard bitch bollock bonk boob bugger cock cocksucker cum cunt
dick dildo dyke fag faggot fart felch fuck goolie gyp hooker horny jism jizz
minge muff nads nookie nutsack piss poof poop porn prick pube puke queef queer quim
rimjob schlong scrote shag shat shit skank slut smegma sperm spunk testicle tit titty
todger tosser turd twat wank wanker whore wog
gook kike coon dago honky jap negro nigger paki raghead spic towelhead wetback
retard spastic mong cripple midget tranny imbecile moron idiot
rape rapist molest incest paedo pedo pervert
suicide murder manslaughter genocide jihad nazi lynch massacre
abortion euthanasia anthrax cyanide corpse cadaver carcase carcass entrail feces faeces
mucus phlegm pustule pus smallpox syphilis gonorrhea leprosy vomit urine urinal
anus anal areola penis phallus scrotum testis vagina vulva clitoris orgasm
`.trim().split(/\s+/);
const SUFFIXES = ['', 'S', 'ES', 'ED', 'D', 'ER', 'ERS', 'ING', 'Y', 'IES', 'IER', 'IEST'];
// Ordinary words the suffix expansion sweeps up, put back by hand. This is the
// same mistake in miniature that the base dictionary's exact-match screen made
// when it took KNOB and PAWN with it: a screen that refuses BUTTER because BUTT
// is on a list is not protecting anyone. The stems the repo has already ruled
// ORDINARY (knob, pawn, hell, damn, butt, bum, crap, suck, flange, escort) are
// not on the stem list at all — see public/tuck-dict-extra.txt and the owner
// report of 2026-09-02 — and neither are gash, prat, spook, randy, slag, git,
// jape, snatch, nude, sex, feck, knacker, willy, fanny, scab or nonce, all of
// which are ordinary English before they are anything else.
const ALLOW = new Set(`
BOOBY BOOBIES BOOBED BOOBING BASTARDY BASTARDIES
COCKED COCKING COCKER COCKERS COCKY COCKIES COCKIER COCKIEST
DICKER DICKERS DICKY DICKIES DICKIER DICKIEST
PRICKED PRICKING PRICKER PRICKERS PRICKY PRICKIER PRICKIEST
SPICE SPICED SPICES SPICER SPICERS SPICING SPICY SPICIER SPICIEST
SPUNKY SPUNKIES SPUNKIER SPUNKIEST
TITER TITERS TITERED TITERING
MONGER MONGERS MONGED MONGING
PUSS PUSSES QUEERED QUEERING JAPE JAPED JAPER JAPERS JAPES JAPING GOOKY
CORPSED CORPSING CUMBER CUMBERS CUMBERED CUMBERING
ANALS ARSED ARSES ARSING ASSES ASSED ASSING ASSY
`.trim().split(/\s+/));
const RUDE = new Set();
for (const stem of RUDE_STEMS) { const S = stem.toUpperCase(); for (const suf of SUFFIXES) { const w = S + suf; if (!ALLOW.has(w)) RUDE.add(w); } }
const PLAYER_SET = new Set(PLAYER_WORDS);
const RUDE_LIVE = [...RUDE].filter((w) => PLAYER_SET.has(w)).sort();
const SCREEN_TOP = 8;
const isRude = (w) => RUDE.has(w);

// ─── quality gates ─────────────────────────────────────────────────────────
const MIN_FORMABLE = 120;      // the thinnest rack ever banked forms 124
const DOMINANCE_MAX = 0.44;    // topWordPoints / solverBest; shipped range is 0.289-0.489
const WEEKDAY_BANDS = [[46, 50, 0.32], [51, 55, 0.32], [56, 61, 0.26], [62, 72, 0.10]];
const SUNDAY_BANDS = [[52, 57, 0.44], [58, 63, 0.34], [64, 76, 0.22]];
const MAX_HIGH_PER_RACK = 4;   // tiles worth 4 or more points
const MAX_PREMIUM_PER_RACK = 2; // of J / Q / X / Z
const MAX_VOWEL_COPIES = 4;
const MAX_CONS_COPIES = 3;
const PREM_CAP = Number(arg('--premcap', '15'));   // --premcap 99 to measure the natural pressure
const PREMIUM_RUN_CAP = { J: PREM_CAP, Q: PREM_CAP, X: PREM_CAP, Z: PREM_CAP, K: PREM_CAP + 2 };
const TOPLEN_SHARE_MAX = 0.30; // any one top-word length, whole new run
const MAX_SAME_VOWEL_RUN = 3;  // consecutive days sharing a vowel count
const LEGAL_W_SPLITS = [4, 5, 6];  // vowels in a 14-tile weekday rack
const LEGAL_S_SPLITS = [5, 6, 7];  // vowels in a 15-tile Sunday rack

// ─── the bag: the real 98-tile Scrabble distribution, no blanks ────────────
const BAG_SPEC = { A:9,B:2,C:2,D:4,E:12,F:2,G:3,H:2,I:9,J:1,K:1,L:4,M:2,N:6,O:8,P:2,Q:1,R:6,S:4,T:6,U:4,V:2,W:2,X:1,Y:2,Z:1 };
const BAG = [];
for (const k in BAG_SPEC) for (let i = 0; i < BAG_SPEC[k]; i++) BAG.push(k);

// ─── deterministic RNG, offset by the starting board number ────────────────
function rng(seed) {
  let s = seed >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const rnd = rng((SEED + STARTNUM * 7919) >>> 0);
function deal(n) {
  const b = BAG.slice(); const out = [];
  for (let i = 0; i < n; i++) { const k = Math.floor(rnd() * b.length); out.push(b[k]); b.splice(k, 1); }
  return out;
}
function shuffleInPlace(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ─── calendar ──────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isSunday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
const dateLabel = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const quizId = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `tuck-${m}-${d}-${String(y).slice(2)}`; };

// rack display order: vowels A-Z then consonants A-Z, the convention the bank
// has used since board 25 (tuck-8-11-26).
const orderRack = (r) => {
  const v = r.filter((c) => VOWELS.includes(c)).sort();
  const c = r.filter((c2) => !VOWELS.includes(c2)).sort();
  return [...v, ...c];
};
const rackSig = (r) => r.slice().sort().join('');

// ─── seed the variety counters from the frozen bank ────────────────────────
const prior = { racks: new Set(), tops: new Set(), letters: {}, n: 0, lastDate: null, lastNum: 0 };
if (AVOID) {
  const mod = await import(pathToFileURL(resolvePath(AVOID)).href);
  for (const p of mod.PUZZLES) {
    prior.racks.add(rackSig(p.letters));
    const t = topPlays(p.letters, 1);
    if (t.length) prior.tops.add(t[0].w);
    for (const c of p.letters) prior.letters[c] = (prior.letters[c] || 0) + 1;
    prior.n++;
    prior.lastDate = p.live; prior.lastNum = p.num;
  }
}

if (SELFCHECK) {
  if (!AVOID) { console.error('--selfcheck needs --avoid <puzzles.js>'); process.exit(1); }
  const mod = await import(pathToFileURL(resolvePath(AVOID)).href);
  let bad = 0;
  for (const p of mod.PUZZLES) {
    const { best } = ladder(p.letters);
    const want = Math.round(1.06 * best);
    const ok = p.live >= '2026-08-10' ? p.benchmark === want : p.benchmark <= best;
    if (!ok) { bad++; console.log(`MIRROR DRIFT ${p.quizId} ${p.letters.join('')} stored ${p.benchmark} mirror-solver ${best}`); }
  }
  console.log(bad ? `\n${bad} board(s) disagree — the mirror has drifted from scripts/verify-tuck.mjs` : `\nmirror agrees with all ${mod.PUZZLES.length} banked benchmarks`);
  process.exit(bad ? 1 : 0);
}

// ─── the band schedule ─────────────────────────────────────────────────────
// Deterministic: build the exact multiset of bands the proportions call for,
// then shuffle it, so the run's spread is a fact rather than a hope.
function bandSchedule(bands, count) {
  const out = [];
  let filled = 0;
  bands.forEach((b, i) => {
    const n = i === bands.length - 1 ? count - filled : Math.round(b[2] * count);
    for (let k = 0; k < n; k++) out.push(b);
    filled += n;
  });
  while (out.length > count) out.pop();
  while (out.length < count) out.push(bands[0]);
  return shuffleInPlace(out);
}

const dates = [];
for (let i = 0; i < DAYS; i++) dates.push(addDays(FROM, i));
const sundayDates = dates.filter(isSunday);
const weekdayDates = dates.filter((d) => !isSunday(d));
const wkBands = bandSchedule(WEEKDAY_BANDS, weekdayDates.length);
const sunBands = bandSchedule(SUNDAY_BANDS, sundayDates.length);
const bandFor = new Map();
weekdayDates.forEach((d, i) => bandFor.set(d, wkBands[i]));
sundayDates.forEach((d, i) => bandFor.set(d, sunBands[i]));

// ─── the vowel-split schedule ──────────────────────────────────────────────
// The vowel count is SCHEDULED, not sampled. Left to rejection sampling it
// clusters hard — the uncapped probe run of this same generator produced nine
// Sundays with not one 5-vowel rack among them, and the shipped bank runs
// 5-vowel weekdays at 51% against 4-vowel at 30%. Dealing the three legal
// splits in equal thirds makes the spread a fact of the schedule instead of a
// hope about the sampler, and it is also what stops a week of racks all feeling
// like the same deal. The schedule is then reshuffled until no vowel count runs
// more than MAX_SAME_VOWEL_RUN days in a row ACROSS THE MERGED CALENDAR, which
// is where a run would actually be visible (weekdays and Sundays share the
// counts 5 and 6, so the check cannot be done on either list alone).
function evenSchedule(values, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(values[i % values.length]);
  return out;
}
let vowelFor = new Map();
{
  const wk = evenSchedule(LEGAL_W_SPLITS, weekdayDates.length);
  const sn = evenSchedule(LEGAL_S_SPLITS, sundayDates.length);
  let ok = false;
  for (let attempt = 0; attempt < 500 && !ok; attempt++) {
    shuffleInPlace(wk); shuffleInPlace(sn);
    vowelFor = new Map();
    let wi = 0, si = 0;
    for (const d of dates) vowelFor.set(d, isSunday(d) ? sn[si++] : wk[wi++]);
    const seq = dates.map((d) => vowelFor.get(d));
    ok = true;
    for (let i = MAX_SAME_VOWEL_RUN; i < seq.length; i++) {
      let same = true;
      for (let k = 1; k <= MAX_SAME_VOWEL_RUN; k++) if (seq[i - k] !== seq[i]) { same = false; break; }
      if (same) { ok = false; break; }
    }
  }
  if (!ok) { console.error(`could not build a vowel schedule with no run over ${MAX_SAME_VOWEL_RUN}`); process.exit(1); }
}

// ─── per-rack legality, independent of the run ─────────────────────────────
function rackShapeOk(rack, sunday, wantVowels) {
  const want = sunday ? 15 : 14;
  if (rack.length !== want) return false;
  const v = rack.filter((c) => VOWELS.includes(c)).length;
  const [vMin, vMax] = sunday ? [5, 7] : [4, 6];
  if (v < vMin || v > vMax) return false;
  if (wantVowels != null && v !== wantVowels) return false;
  const m = {}; for (const c of rack) m[c] = (m[c] || 0) + 1;
  for (const c in m) {
    if (VOWELS.includes(c) ? m[c] > MAX_VOWEL_COPIES : m[c] > MAX_CONS_COPIES) return false;
  }
  if (rack.filter((c) => PTS[c] >= 4).length > MAX_HIGH_PER_RACK) return false;
  if (rack.filter((c) => 'JQXZ'.includes(c)).length > MAX_PREMIUM_PER_RACK) return false;
  return true;
}

// ─── the run ───────────────────────────────────────────────────────────────
const run = {
  splitW: {}, splitS: {}, topLen: {}, letters: {},
  tries: 0, rejected: { shape: 0, dup: 0, band: 0, thin: 0, dominant: 0, rude: 0, unfittable: 0, variety: 0 },
};

function varietyOk(rack, sunday, top) {
  // top-word length share
  const capLen = Math.max(2, Math.floor(TOPLEN_SHARE_MAX * DAYS));
  if ((run.topLen[top.w.length] || 0) >= capLen) return 'toplen-cap';
  // premium letters across the run
  for (const c of rack) {
    if (PREMIUM_RUN_CAP[c] && (run.letters[c] || 0) >= PREMIUM_RUN_CAP[c]) return 'premium-cap';
  }
  return null;
}

const t0 = Date.now();
const boards = [];
for (let i = 0; i < DAYS; i++) {
  const iso = dates[i];
  const sunday = isSunday(iso);
  const [lo, hi] = bandFor.get(iso);
  const wantV = vowelFor.get(iso);
  const size = sunday ? 15 : 14;
  let found = null;
  const day = { shape: 0, dup: 0, band: 0, thin: 0, dominant: 0, rude: 0, unfittable: 0, variety: {} };
  for (let t = 0; t < MAX_TRIES && !found; t++) {
    run.tries++;
    const rack = orderRack(deal(size));
    if (!rackShapeOk(rack, sunday, wantV)) { run.rejected.shape++; day.shape++; continue; }
    const sig = rackSig(rack);
    if (prior.racks.has(sig)) { run.rejected.dup++; day.dup++; continue; }
    const { best, line, formable } = ladder(rack);
    if (best < lo || best > hi) { run.rejected.band++; day.band++; continue; }
    if (formable < MIN_FORMABLE) { run.rejected.thin++; day.thin++; continue; }
    const plays = topPlays(rack, SCREEN_TOP);
    if (!plays.length) { run.rejected.thin++; day.thin++; continue; }
    const top = plays[0];
    if (top.p / best > DOMINANCE_MAX) { run.rejected.dominant++; day.dominant++; continue; }
    if (plays.some((x) => isRude(x.w)) || line.some((x) => isRude(x.w))) { run.rejected.rude++; day.rude++; continue; }
    if (!lineFitsBoard(line)) { run.rejected.unfittable++; day.unfittable++; continue; }
    if (prior.tops.has(top.w)) { run.rejected.dup++; day.dup++; continue; }
    const why = varietyOk(rack, sunday, top);
    if (why) { run.rejected.variety++; day.variety[why] = (day.variety[why] || 0) + 1; continue; }
    found = { rack, best, top, line, formable, sig };
  }
  if (!found) {
    console.error(`FAILED to build ${iso} (band ${lo}-${hi}, ${wantV} vowels) in ${MAX_TRIES} deals`);
    console.error(`  rejections: shape ${day.shape} dup ${day.dup} band ${day.band} thin ${day.thin} dominant ${day.dominant} rude ${day.rude} unfittable ${day.unfittable} variety ${JSON.stringify(day.variety)}`);
    process.exit(1);
  }
  const { rack, best, top, formable } = found;
  const v = rack.filter((c) => VOWELS.includes(c)).length;
  prior.racks.add(found.sig);
  prior.tops.add(top.w);
  if (sunday) run.splitS[v] = (run.splitS[v] || 0) + 1; else run.splitW[v] = (run.splitW[v] || 0) + 1;
  run.topLen[top.w.length] = (run.topLen[top.w.length] || 0) + 1;
  for (const c of rack) run.letters[c] = (run.letters[c] || 0) + 1;
  boards.push({
    num: STARTNUM + i,
    quizId: quizId(iso),
    live: iso,
    dateLabel: dateLabel(iso),
    sunday,
    letters: rack,
    benchmark: Math.round(1.06 * best),
    _best: best, _top: top.w, _topP: top.p, _dom: top.p / best, _formable: formable, _v: v,
  });
  if (!PROBE) {
    console.log(`${iso}${sunday ? ' [SUN]' : '     '} #${STARTNUM + i}  ${rack.join('')}  v${v}  solver ${best} (band ${lo}-${hi})  benchmark ${Math.round(1.06 * best)}  top ${top.w} ${top.p} dom ${(top.p / best).toFixed(3)}  formable ${formable}`);
  }
}

// ─── report ────────────────────────────────────────────────────────────────
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(f * (s.length - 1))]; };
const bests = boards.map((b) => b._best);
console.error(`\n${boards.length} boards in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${run.tries} deals (${(run.tries / boards.length).toFixed(1)} per board)`);
console.error(`rejected: ${Object.entries(run.rejected).map(([k, n]) => `${k} ${n}`).join(', ')}`);
console.error(`solver line: min ${Math.min(...bests)} p25 ${q(bests, .25)} med ${q(bests, .5)} p75 ${q(bests, .75)} max ${Math.max(...bests)}`);
{
  const sb = boards.filter((b) => b.sunday).map((b) => b._best);
  const wb = boards.filter((b) => !b.sunday).map((b) => b._best);
  console.error(`  weekday min ${Math.min(...wb)} med ${q(wb, .5)} max ${Math.max(...wb)}   sunday min ${Math.min(...sb)} med ${q(sb, .5)} max ${Math.max(...sb)}`);
}
console.error(`vowel splits — weekday ${JSON.stringify(run.splitW)}  sunday ${JSON.stringify(run.splitS)}`);
console.error(`top-word lengths ${JSON.stringify(run.topLen)} (cap ${Math.max(2, Math.floor(TOPLEN_SHARE_MAX * DAYS))} each)`);
console.error(`dominance med ${q(boards.map((b) => b._dom), .5).toFixed(3)} max ${Math.max(...boards.map((b) => b._dom)).toFixed(3)} (cap ${DOMINANCE_MAX})`);
console.error(`premium letters this run: ${['J','Q','X','Z','K'].map((c) => `${c} ${run.letters[c] || 0}/${PREMIUM_RUN_CAP[c]}`).join('  ')}`);
console.error(`distinct top words ${new Set(boards.map((b) => b._top)).size}/${boards.length}; none repeats a banked one`);
{
  // the schedule guarantees these; assert it rather than reasoning to it
  const seq = boards.map((b) => b._v);
  let worst = 1, cur = 1;
  for (let i = 1; i < seq.length; i++) { cur = seq[i] === seq[i - 1] ? cur + 1 : 1; if (cur > worst) worst = cur; }
  const wShare = Math.max(...LEGAL_W_SPLITS.map((v) => (run.splitW[v] || 0))) / Math.max(1, weekdayDates.length);
  const missing = LEGAL_W_SPLITS.filter((v) => !(run.splitW[v] > 0)).concat(LEGAL_S_SPLITS.filter((v) => !(run.splitS[v] > 0)));
  console.error(`longest same-vowel-count streak ${worst} (cap ${MAX_SAME_VOWEL_RUN}); largest weekday split share ${(100 * wShare).toFixed(0)}%${missing.length ? `; MISSING SPLITS ${missing.join(',')}` : '; every legal split used'}`);
  if (worst > MAX_SAME_VOWEL_RUN || missing.length) { console.error('variety assertion FAILED'); process.exit(1); }
}
if (PROBE) {
  console.error(`\nrude screen: ${RUDE.size} generated forms, ${RUDE_LIVE.length} of them actually in the player dictionary:`);
  console.error('  ' + RUDE_LIVE.join(' '));
  process.exit(0);
}

// ─── emit ──────────────────────────────────────────────────────────────────
const line = (p) => `  { num: ${p.num}, quizId: ${JSON.stringify(p.quizId)}, live: ${JSON.stringify(p.live)}, dateLabel: ${JSON.stringify(p.dateLabel)}, sunday: ${p.sunday}, letters: [${p.letters.map((c) => `"${c}"`).join(',')}], benchmark: ${p.benchmark} },`;
const body = boards.map(line).join('\n') + '\n';

if (APPEND) {
  const bankPath = join(ROOT, 'app/tuck/puzzles.js');
  const src = readFileSync(bankPath, 'utf8');
  const close = src.lastIndexOf('];');
  if (close < 0) { console.error('no closing "];" in app/tuck/puzzles.js'); process.exit(1); }
  // THE PAST IS FROZEN: everything before the closing bracket is copied byte
  // for byte, and the new rows are the only thing this writes.
  if (prior.lastDate && boards[0].live <= prior.lastDate) {
    console.error(`refusing to append: first new date ${boards[0].live} is not after the bank's last date ${prior.lastDate}`);
    process.exit(1);
  }
  if (prior.lastNum && boards[0].num !== prior.lastNum + 1) {
    console.error(`refusing to append: first new num ${boards[0].num} does not follow the bank's last num ${prior.lastNum}`);
    process.exit(1);
  }
  writeFileSync(bankPath, src.slice(0, close) + body + src.slice(close));
  console.error(`\nappended ${boards.length} boards to app/tuck/puzzles.js (${boards[0].live} .. ${boards[boards.length - 1].live})`);
} else if (OUT) {
  writeFileSync(resolvePath(OUT), body);
  console.error(`\nwrote ${boards.length} boards to ${OUT}`);
} else {
  process.stdout.write(body);
}
