#!/usr/bin/env node
// gen-queen — deal the Queen bank (the daily king-and-pawn promotion endgame).
//
//   node scripts/gen-queen.mjs [--days N] [--from YYYY-MM-DD] > /tmp/queen-puzzles.js
//
// Selection rules (the authoring rules live in app/queen/puzzles.js's header;
// this generator enforces the machine-checkable ones and verify-queen.mjs
// re-proves them with its own independent solver):
//   - every board is White to move with a tablebase-proven win in EXACTLY the
//     day's winIn White moves (the weekday ramp below, deeper on Sundays);
//   - EXACTLY ONE first move preserves the win inside that budget, at least
//     four legal first moves exist, and at least TWO of the alternatives throw
//     the win away outright (a draw, not merely a slower win);
//   - pool variety: a pawn file appears at most FILE_CAP times across the bank
//     (see below) and never two days running; no duplicate positions; roughly a
//     third of the keys are pawn moves and the rest king moves (opposition is
//     the lesson).
//
// EXTENDING, NOT REDEALING. The Queen bank is append-only: boards that already
// exist are frozen forever. So this script reads the live bank first, freezes
// every board whose `live` date is before --from, and deals only the days from
// --from onward, carrying the frozen segment's variety bookkeeping (used FENs,
// per-file counts, the previous day's file, the running pawn-key share) into
// the new deal. The frozen rows are re-emitted VERBATIM from the existing
// source text, so the past cannot drift even by a space. The RNG seed is
// offset by the number of frozen boards, so a new segment can never replay the
// deal that produced the old one. Because the frozen rows are copied rather
// than re-dealt, the file balancing below is free to be smarter than the pass
// that originally dealt boards 1-45: a from-scratch redeal of the whole
// calendar would now produce a different (equally legal) bank, which is exactly
// why no code path ever re-deals a day that has already shipped.
//
// THE CANDIDATE POOL IS ALREADY THE WHOLE UNIVERSE. The sweep below visits
// every legal K+P-vs-k position with White to move: all 8 pawn files x all 64
// White-king squares x all 64 Black-king squares x pawn ranks 2-7, scored by
// the exact per-file tablebase. There is no deeper or broader sweep to be had;
// when a day has no candidate it is a bank rule biting, not a search that gave
// up early. The rule that bites first is FILE_CAP -- see the note on it below.
import { tablebase, DRAW, whiteMoves, moveValue, legalState, toFen, sanOf, fileOf, rowOf, parseFen } from '../app/queen/kpk.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANK_PATH = join(HERE, '..', 'app', 'queen', 'puzzles.js');

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DAYS = Number(argOf('--days', 45));
const FROM = argOf('--from', '2026-08-21');

// Weekday ramp: getUTCDay() on the noon-UTC instant of the live date.
const RAMP = { 1: 5, 2: 6, 3: 7, 4: 8, 5: 8, 6: 9, 0: 12 };

// ─── how often one pawn file may carry the bank ────────────────────────────
// This used to be a bare `8`, which read as "at most 8 boards per bank" and was
// sized for the 45-board bank it was written against: 8 files x 8 boards = 64
// slots, comfortably more than 45. As an ABSOLUTE count it stops being a
// variety rule and becomes an impossibility the moment a bank outgrows 64
// boards -- at 102 boards the pigeonhole alone forces some file to 13. So it is
// expressed here as the rate it always meant: no file more than 40% above an
// even share of the bank, rounded up. That is exactly 8 at 45 boards (45/8 x
// 1.4 = 7.875), so the frozen bank's reading of the rule is unchanged, and 18
// at 102 boards (12.75 x 1.4 = 17.85), which is still a real cap -- an even
// deal is 12.75, so no file may run away with the bank. verify-queen.mjs
// carries the identical formula.
const fileCapFor = (bankLength) => Math.ceil((bankLength / 8) * 1.4);

// ─── one board per SHAPE, not merely per FEN ───────────────────────────────
// A position and its left-right reflection are the same puzzle: same key, same
// opposition, same lesson, drawn on the other wing. The bank's no-duplicate
// rule only ever compared FENs, so a mirror pair reads to the verifier as two
// boards and to a solver as one. Deal on the mirror-canonical form instead --
// the lexicographically smaller of a position and its reflection -- so no shape
// is ever set twice. This is strictly stronger than the FEN rule, costs almost
// nothing (the pools run to hundreds of candidates per day), and it is what
// keeps the two win-in-12 pawn-key positions, which happen to be each other's
// mirror, from both landing in one bank.
const mirrorSq = (sq) => rowOf(sq) * 8 + (7 - fileOf(sq));
function shapeOf(state) {
  const a = toFen(state);
  const b = toFen({ wk: mirrorSq(state.wk), bk: mirrorSq(state.bk), p: mirrorSq(state.p), stm: 'w' });
  return a < b ? a : b;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── the frozen prefix ─────────────────────────────────────────────────────
// Every existing row whose live date is before --from, kept as raw source text
// so it is re-emitted byte for byte.
const bankSrc = readFileSync(BANK_PATH, 'utf8');
const rowRe = /^ {2}\{ num: \d+,.*\},$/;
const frozenRows = [];
for (const line of bankSrc.split('\n')) {
  if (!rowRe.test(line)) continue;
  const live = /live: '(\d{4}-\d{2}-\d{2})'/.exec(line)[1];
  if (live >= FROM) break;              // rows are in date order
  frozenRows.push({ line, live });
}
const frozen = frozenRows.map((r) => {
  const g = (k) => new RegExp(`${k}: '([^']*)'`).exec(r.line)[1];
  return { live: r.live, fen: g('fen'), keySan: g('keySan') };
});
if (frozenRows.length) {
  const expectedNext = new Date(new Date(`${frozen.at(-1).live}T12:00:00Z`).getTime() + 86400000)
    .toISOString().slice(0, 10);
  if (expectedNext !== FROM) {
    throw new Error(`--from ${FROM} does not continue the frozen bank (last frozen ${frozen.at(-1).live})`);
  }
}
const BANK_LENGTH = frozen.length + DAYS;
const FILE_CAP = fileCapFor(BANK_LENGTH);

// Seeded off the segment's starting board number, so an extension can never
// replay the deal that produced the frozen segment. Zero frozen boards gives
// back the original seed, so the bank's own first deal still reproduces.
const rnd = mulberry32(20260821 + frozen.length);

// ─── candidate pools, by dtp then key piece ────────────────────────────────
// Exhaustive over the K+P-vs-k universe: nothing here is a sample.
const pool = new Map(); // `${dtp}|${keyPiece}` -> [{ s, key, n, file }]
for (let file = 0; file < 8; file++) {
  const tb = tablebase(file);
  for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let pr = 1; pr <= 6; pr++) {
    const s = { wk, bk, p: pr * 8 + file, stm: 'w' };
    if (!legalState(s)) continue;
    const n = tb.w(s);
    if (n === DRAW || n < 5 || n > 13) continue;
    const mvs = whiteMoves(s);
    if (mvs.length < 4) continue;
    const opt = mvs.filter((m) => moveValue(s, m) === n);
    if (opt.length !== 1) continue;
    const draws = mvs.filter((m) => moveValue(s, m) === DRAW).length;
    if (draws < 2) continue;
    const key = opt[0];
    const k = `${n}|${key.piece}`;
    if (!pool.has(k)) pool.set(k, []);
    pool.get(k).push({ s, key, n, file });
  }
}

// ─── carry the frozen segment's bookkeeping forward ────────────────────────
const seen = new Set(frozen.map((p) => p.fen));
const seenShape = new Set(frozen.map((p) => shapeOf(parseFen(p.fen))));
// How often each key move has already been the answer. Queen's key vocabulary
// is tiny -- three pieces on an empty board give about forty distinct keys over
// a hundred boards -- so without this the deal happily answers "c4" nine times.
const keyUse = new Map();
for (const p of frozen) keyUse.set(p.keySan, (keyUse.get(p.keySan) || 0) + 1);
const fileCount = new Array(8).fill(0);
for (const p of frozen) fileCount[fileOf(parseFen(p.fen).p)]++;
let lastFile = frozen.length ? fileOf(parseFen(frozen.at(-1).fen).p) : -1;
for (let f = 0; f < 8; f++) {
  if (fileCount[f] > FILE_CAP) throw new Error(`frozen bank already has file ${f} ${fileCount[f]} times, over the ${FILE_CAP} cap`);
}

const days = [];
const d0 = new Date(`${FROM}T12:00:00Z`);
for (let i = 0; i < DAYS; i++) {
  const d = new Date(d0.getTime() + i * 86400000);
  const iso = d.toISOString().slice(0, 10);
  const dow = d.getUTCDay();
  // The key-piece rota runs on the BANK's board number, not the segment's, so
  // an extension continues the pattern instead of restarting it.
  const boardIdx = frozen.length + i;
  const wantPiece = boardIdx % 3 === 1 ? 'P' : 'K';
  const dtp = RAMP[dow];
  // preferred key piece first, the other as the fallback when every preferred
  // candidate fails a variety gate. Among the candidates that pass, take one on
  // the LEAST-USED pawn file, breaking ties on the LEAST-USED key move rather
  // than simply the first that fits. Taking the first fit lets the middle files
  // -- the only ones carrying any win-in-11/12/13 candidates at all -- get spent
  // on easy weekdays, and the bank then runs out of legal Sunday files long
  // before it runs out of positions. Spreading the demand deals 102 boards at
  // 12-13 per file, an even eighth of the bank, instead of pinning three files
  // to the cap and starving two others; spreading the key move as the tie-break
  // takes the bank from 39 distinct keys in 102 boards to 57.
  let picked = null;
  for (const piece of [wantPiece, wantPiece === 'P' ? 'K' : 'P']) {
    const cands = (pool.get(`${dtp}|${piece}`) || []).concat();
    for (let j = cands.length - 1; j > 0; j--) { const k = Math.floor(rnd() * (j + 1)); [cands[j], cands[k]] = [cands[k], cands[j]]; }
    for (const c of cands) {
      const fen = toFen(c.s);
      if (seen.has(fen)) continue;
      if (seenShape.has(shapeOf(c.s))) continue;
      if (c.file === lastFile) continue;
      if (fileCount[c.file] >= FILE_CAP) continue;
      const san = sanOf(c.s, c.key);
      const use = keyUse.get(san) || 0;
      if (!picked
        || fileCount[c.file] < fileCount[picked.file]
        || (fileCount[c.file] === fileCount[picked.file] && use < picked.use)) picked = { ...c, fen, san, use };
      if (fileCount[picked.file] === 0 && picked.use === 0) break; // cannot do better
    }
    if (picked) break;
  }
  if (!picked) throw new Error(`no candidate for ${iso} (dtp ${dtp}, piece ${wantPiece})`);
  seen.add(picked.fen);
  seenShape.add(shapeOf(picked.s));
  keyUse.set(picked.san, (keyUse.get(picked.san) || 0) + 1);
  fileCount[picked.file]++;
  lastFile = picked.file;
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  days.push({
    num: frozen.length + i + 1,
    quizId: `queen-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`,
    live: iso,
    dateLabel: `${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
    sunday: dow === 0,
    winIn: dtp,
    fen: picked.fen,
    keyUci: picked.key.uci,
    keySan: sanOf(picked.s, picked.key),
  });
}

const HEADER = `// Puzzle data for Queen, the daily king-and-pawn promotion endgame. Imported
// ONLY by the server page (app/queen/page.js), which filters live<=today and
// STRIPS keyUci/keySan before handing boards to the client, so neither
// tomorrow's position nor any day's key move ever ships to the browser.
//
// Each puzzle is a position with WHITE TO MOVE: a king and one pawn against a
// bare king, with a tablebase-proven promotion in exactly \`winIn\` White moves.
//
//   fen      full FEN. Only K, P and k ever appear; castling and en passant are
//            structurally impossible and the engine (app/queen/kpk.js) plays
//            the position perfectly from a per-file tablebase built in the
//            browser.
//   winIn    White's whole budget, in White moves. EXACTLY ONE first move
//            preserves the win inside it; at least two of the alternatives
//            throw the win away outright (a draw, not a slower win). Winning
//            means promoting SAFELY: a queen the Black king can take back, or a
//            push that delivers stalemate, is the draw it deserves to be.
//   keyUci / keySan  the key move, for the verifier and the reveal-to-solvers
//            line. Stripped server-side, never sent to the browser.
//
// Weekday ramp (win in N White moves): Mon 5, Tue 6, Wed 7, Thu 8, Fri 8,
// Sat 9, and the Sunday Edition at 12, the long walk. Bank rules, all enforced
// by scripts/verify-queen.mjs with its own independent solver: exact winIn,
// unique key, at least two outright refutations, at least four legal first
// moves, no duplicate position and no duplicate SHAPE, a pawn file never twice
// running and never over its share of the bank, no key move over-used, and
// roughly a third of the keys pawn moves.
//
// THE PAWN-FILE SHARE is a rate, not a tally: ceil(bankLength / 8 * 1.4), i.e.
// no file more than 40% above an even eighth of the bank. It reads 8 at the
// 45 boards this bank first shipped with and 18 at 102, where an even deal is
// 12.75. It was written as a bare 8 while the bank was 45 long; at any bank
// over 64 boards a fixed 8 is not a variety rule but an arithmetic
// impossibility, since 8 files x 8 boards cannot cover a longer bank. The deal
// itself spreads far tighter than the cap, at 12-13 boards per file.
//
// A SHAPE IS A POSITION AND ITS MIRROR. With three pieces on an empty board a
// position reflected left-to-right is the same puzzle -- same key, same
// opposition, same lesson, other wing -- so the no-duplicate rule is checked on
// the mirror-canonical form, not on the FEN. All 102 boards are distinct shapes.
//
// KEY MOVES ARE CAPPED at 5% of the boards dealt from 2026-10-05 on, floor 3
// (the boards before that were dealt without the rule and answer c4 seven
// times; the past is frozen, so the cap is scoped forward per the repo's
// grandfathering rule). It is a rate rather than a count for the same reason
// the pawn-file share is. From that date the deal peaks at 2 of any one key,
// over 57 distinct keys in the bank.
//
// THE DEEP KEYS ARE SCARCE BY NATURE. Over the whole K+P-vs-k universe only 2
// positions are a win in exactly 12 with a unique PAWN key (both already in
// this bank), and only 10 are a win in exactly 9. Sunday and Saturday keys are
// therefore nearly always king moves; the pawn-key third is carried by Monday
// through Friday, where the win-in-5 pool alone runs to thousands.
export const PUZZLES = [
`;
const rows = days.map((p) => `  { num: ${p.num}, quizId: '${p.quizId}', live: '${p.live}', dateLabel: '${p.dateLabel}', sunday: ${p.sunday}, winIn: ${p.winIn}, fen: '${p.fen}', keyUci: '${p.keyUci}', keySan: '${p.keySan}' },`);
process.stdout.write(HEADER + frozenRows.map((r) => r.line).concat(rows).join('\n') + '\n];\n');
const pawnKeys = frozen.concat(days).filter((p) => !p.keySan.startsWith('K')).length;
console.error(`kept ${frozen.length} frozen, dealt ${days.length} new (bank ${BANK_LENGTH}, file cap ${FILE_CAP})`);
console.error(`files used: ${fileCount.join(',')}; pawn keys ${pawnKeys}/${BANK_LENGTH}`);
