// Puzzle data for Tuck, the daily tile-tucking word game. Imported ONLY by the
// server page (app/tuck/page.js), which filters live<=today before passing
// puzzles to the client — future racks never ship to the browser.
//
// Each day is a RACK of 14 letters (Scrabble-weighted bag, 4-6 vowels) plus a
// BENCHMARK. It is a mark to beat, NOT an average round, which is why it is not
// called par. Racks are rerolled at authoring time until the solver line is >= 45.
//
// THE BENCHMARK IS CALIBRATED TO REAL PLAY, from 2026-08-10 (owner ruling
// 2026-08-09). It used to be exactly the ladder solver's best line, and that
// solver can only build ONE SHAPE: a single horizontal spine with verticals hung
// off non-adjacent columns. Human players build dense interlocking grids where
// far more letters sit at intersections and score in two words at once, so they
// routinely beat the solver by 10 to 22 points. Measured over 246 real attempts
// on the first 23 boards, HALF of every serious attempt cleared the benchmark,
// which is not much of a mark. (This is not a vocabulary gap: rerunning the
// solver with the full 9-to-15 letter list moved not one benchmark, because a
// long spine burns tiles that would otherwise cross twice.)
//
//   benchmark = round(1.06 x solverBest)
//
// 1.06 was fitted against those 246 attempts to put the win rate near 37%.
// The solver line still sets the scale, because it tracks how strong a rack is;
// the multiplier only moves the bar. Boards live before 2026-08-10 are played
// history and keep their original solver-equal benchmark.
//
// Validate with scripts/verify-tuck.mjs after ANY edit: it recomputes the solver
// line from public/tuck-dict.txt and fails if a stored benchmark is not the
// calibrated value (or, for a frozen board, not achievable).
//
// To RECALIBRATE: pull each board's scoreDist from /api/quiz/board, drop
// attempts under half the benchmark (walk-aways), and solve for the multiplier
// that hits the win rate you want. Then restamp future boards only.
// ─── AUTHORING RULES FOR NEW RACKS (from 2026-09-30, scripts/gen-tuck.mjs) ──
// Everything above still holds; this is what a rack must now clear before it is
// banked, and the generator that enforces it. Boards before 2026-09-30 predate
// these rules and are frozen history — do not restate them against this list.
//
//   node scripts/gen-tuck.mjs --selfcheck --avoid app/tuck/puzzles.js
//   node scripts/gen-tuck.mjs --from <next day> --days N --startnum <last+1> \
//     --avoid app/tuck/puzzles.js --append
//   node scripts/verify-tuck.mjs        <- the gate, run it after every append
//
// * Racks are DEALT from the real 98-tile Scrabble bag without replacement, not
//   sampled from letter frequencies, so a rack reads like a deal.
// * A FLOOR IS NOT A TARGET. The old rule ("reroll until the solver line is
//   >= 45") let every rack sit on the floor. Each day is now dealt a target
//   BAND and the solver line must land inside it:
//     weekday  46-50 (32%) · 51-55 (32%) · 56-61 (26%) · 62-72 (10%)
//     sunday   52-57 (44%) · 58-63 (34%) · 64-76 (22%)
//   The Sunday floor of 52 is part of the Sunday ramp, alongside the 15 tiles.
// * A rack is refused if one word carries too much of the day: dominance
//   (best single play over the PLAYER dictionary / solver line) must be <= 0.44.
//   The shipped bank runs 0.289-0.489, so this is stricter than history.
// * A rack is refused if any of its 8 best plays, or any word in the solver's
//   own line, is on the generator's rude/tone screen. This is not theoretical:
//   the base list's exact-match slur screen left WOG and GYP in
//   public/tuck-dict.txt, and tuck-dict-extra.txt deliberately re-adds COCK,
//   TITS, PRICK and friends for player validation. The dictionaries stay frozen
//   (every bank verifier on the site reasons over them); the screen lives in the
//   generator and picks the racks instead.
// * A rack is refused if the solver's best line cannot physically fit the
//   client's 9x9 board (the verifier's solver counts points and never checks
//   the geometry).
// * POOL VARIETY CEILINGS, counted across the run: the vowel split is scheduled
//   in equal thirds over the three legal counts (4/5/6 weekday, 5/6/7 Sunday)
//   rather than sampled, no count runs more than 3 days in a row, no top-word
//   LENGTH takes more than 30% of a run, no rack or top word repeats another
//   day's anywhere in the bank, and at most 15 boards per run may carry each of
//   J, Q, X and Z (17 for K) against a bag-fair ~9. Per rack: at most 4 tiles
//   worth 4+ points, at most 2 of J/Q/X/Z, at most 4 copies of a vowel and 3 of
//   a consonant.
export const PUZZLES = [
  { num: 1, quizId: "tuck-7-18-26", live: "2026-07-18", dateLabel: "July 18, 2026", sunday: false, letters: ["N","I","B","F","E","Q","L","E","M","J","E","S","U","L"], benchmark: 59 },
  { num: 2, quizId: "tuck-7-19-26", live: "2026-07-19", dateLabel: "July 19, 2026", sunday: false, letters: ["E","B","S","B","I","S","O","L","E","M","R","S","Z","E"], benchmark: 52 },
  { num: 3, quizId: "tuck-7-20-26", live: "2026-07-20", dateLabel: "July 20, 2026", sunday: false, letters: ["U","F","N","R","R","P","I","A","Q","D","W","T","R","U"], benchmark: 54 },
  { num: 4, quizId: "tuck-7-21-26", live: "2026-07-21", dateLabel: "July 21, 2026", sunday: false, letters: ["D","Y","N","U","O","E","J","K","A","N","A","R","A","H"], benchmark: 59 },
  { num: 5, quizId: "tuck-7-22-26", live: "2026-07-22", dateLabel: "July 22, 2026", sunday: false, letters: ["D","S","G","N","B","R","Y","D","R","A","O","U","Q","E"], benchmark: 49 },
  { num: 6, quizId: "tuck-7-23-26", live: "2026-07-23", dateLabel: "July 23, 2026", sunday: false, letters: ["I","H","W","B","S","A","F","N","I","R","L","M","I","T"], benchmark: 46 },
  { num: 7, quizId: "tuck-7-24-26", live: "2026-07-24", dateLabel: "July 24, 2026", sunday: false, letters: ["P","T","R","R","R","A","W","G","A","U","E","L","R","X"], benchmark: 47 },
  { num: 8, quizId: "tuck-7-25-26", live: "2026-07-25", dateLabel: "July 25, 2026", sunday: false, letters: ["C","W","L","Y","A","Z","E","F","E","U","N","H","R","U"], benchmark: 66 },
  { num: 9, quizId: "tuck-7-26-26", live: "2026-07-26", dateLabel: "July 26, 2026", sunday: true, letters: ["A","I","C","C","E","Y","Z","O","V","B","D","R","T","E","U"], benchmark: 62 },
  { num: 10, quizId: "tuck-7-27-26", live: "2026-07-27", dateLabel: "July 27, 2026", sunday: false, letters: ["P","W","B","A","Z","I","X","A","E","T","I","E","N","N"], benchmark: 62 },
  { num: 11, quizId: "tuck-7-28-26", live: "2026-07-28", dateLabel: "July 28, 2026", sunday: false, letters: ["Y","D","I","E","N","E","F","T","M","A","V","I","R","T"], benchmark: 45 },
  { num: 12, quizId: "tuck-7-29-26", live: "2026-07-29", dateLabel: "July 29, 2026", sunday: false, letters: ["I","J","A","E","E","R","S","F","L","M","F","H","O","A"], benchmark: 55 },
  { num: 13, quizId: "tuck-7-30-26", live: "2026-07-30", dateLabel: "July 30, 2026", sunday: false, letters: ["I","I","I","U","B","I","W","A","T","M","H","C","H","Q"], benchmark: 63 },
  { num: 14, quizId: "tuck-7-31-26", live: "2026-07-31", dateLabel: "July 31, 2026", sunday: false, letters: ["C","S","D","R","E","I","A","E","L","Q","G","H","E","G"], benchmark: 52 },
  { num: 15, quizId: "tuck-8-1-26", live: "2026-08-01", dateLabel: "August 1, 2026", sunday: false, letters: ["T","O","E","S","M","A","H","S","U","E","Q","I","S","G"], benchmark: 54 },
  { num: 16, quizId: "tuck-8-2-26", live: "2026-08-02", dateLabel: "August 2, 2026", sunday: true, letters: ["R","E","T","A","I","L","S","O","N","D","B","U","C","G","E"], benchmark: 38 },
  { num: 17, quizId: "tuck-8-3-26", live: "2026-08-03", dateLabel: "August 3, 2026", sunday: false, letters: ["R","E","T","A","I","L","S","O","N","D","B","U","C","G"], benchmark: 37 },
  { num: 18, quizId: "tuck-8-4-26", live: "2026-08-04", dateLabel: "August 4, 2026", sunday: false, letters: ["A","E","I","O","U","R","S","T","N","L","D","K","P","Z"], benchmark: 56 },
  { num: 19, quizId: "tuck-8-5-26", live: "2026-08-05", dateLabel: "August 5, 2026", sunday: false, letters: ["E","A","O","I","B","G","H","K","L","N","R","S","T","W"], benchmark: 47 },
  { num: 20, quizId: "tuck-8-6-26", live: "2026-08-06", dateLabel: "August 6, 2026", sunday: false, letters: ["A","E","E","I","O","F","M","P","R","S","T","V","Y","D"], benchmark: 49 },
  { num: 21, quizId: "tuck-8-7-26", live: "2026-08-07", dateLabel: "August 7, 2026", sunday: false, letters: ["A","A","E","I","U","C","H","K","L","N","R","T","Z","S"], benchmark: 58 },
  { num: 22, quizId: "tuck-8-8-26", live: "2026-08-08", dateLabel: "August 8, 2026", sunday: false, letters: ["E","O","U","A","B","D","K","G","L","M","N","R","S","T"], benchmark: 43 },
  { num: 23, quizId: "tuck-8-9-26", live: "2026-08-09", dateLabel: "August 9, 2026", sunday: true, letters: ["A","E","I","O","U","E","B","K","D","L","M","N","R","S","W"], benchmark: 49 },
  { num: 24, quizId: "tuck-8-10-26", live: "2026-08-10", dateLabel: "August 10, 2026", sunday: false, letters: ["I","O","U","E","A","J","K","P","R","S","T","L","N","D"], benchmark: 55 },
  { num: 25, quizId: "tuck-8-11-26", live: "2026-08-11", dateLabel: "August 11, 2026", sunday: false, letters: ["A","E","E","O","B","C","D","H","N","T","V","W","Y","Z"], benchmark: 68 },
  { num: 26, quizId: "tuck-8-12-26", live: "2026-08-12", dateLabel: "August 12, 2026", sunday: false, letters: ["E","I","I","O","U","C","D","K","N","N","P","T","V","Y"], benchmark: 52 },
  { num: 27, quizId: "tuck-8-13-26", live: "2026-08-13", dateLabel: "August 13, 2026", sunday: false, letters: ["A","A","A","A","E","O","F","G","L","M","N","N","Q","R"], benchmark: 50 },
  { num: 28, quizId: "tuck-8-14-26", live: "2026-08-14", dateLabel: "August 14, 2026", sunday: false, letters: ["A","E","I","I","O","D","H","H","K","M","S","S","S","T"], benchmark: 50 },
  { num: 29, quizId: "tuck-8-15-26", live: "2026-08-15", dateLabel: "August 15, 2026", sunday: false, letters: ["A","A","A","U","U","U","C","F","F","H","S","V","W","W"], benchmark: 56 },
  { num: 30, quizId: "tuck-8-16-26", live: "2026-08-16", dateLabel: "August 16, 2026", sunday: true, letters: ["A","E","I","I","O","O","U","D","G","H","K","L","N","N","Z"], benchmark: 64 },
  { num: 31, quizId: "tuck-8-17-26", live: "2026-08-17", dateLabel: "August 17, 2026", sunday: false, letters: ["A","A","A","E","D","F","G","L","N","R","R","T","V","Z"], benchmark: 56 },
  { num: 32, quizId: "tuck-8-18-26", live: "2026-08-18", dateLabel: "August 18, 2026", sunday: false, letters: ["E","I","I","O","B","G","H","J","M","R","S","S","T","Y"], benchmark: 57 },
  { num: 33, quizId: "tuck-8-19-26", live: "2026-08-19", dateLabel: "August 19, 2026", sunday: false, letters: ["A","A","A","O","O","B","C","D","F","L","M","R","V","W"], benchmark: 52 },
  { num: 34, quizId: "tuck-8-20-26", live: "2026-08-20", dateLabel: "August 20, 2026", sunday: false, letters: ["A","E","E","I","U","B","D","D","G","J","K","R","R","Y"], benchmark: 60 },
  { num: 35, quizId: "tuck-8-21-26", live: "2026-08-21", dateLabel: "August 21, 2026", sunday: false, letters: ["A","E","I","I","O","D","D","G","H","K","L","N","Q","W"], benchmark: 59 },
  { num: 36, quizId: "tuck-8-22-26", live: "2026-08-22", dateLabel: "August 22, 2026", sunday: false, letters: ["E","E","I","O","U","B","C","C","D","J","M","N","S","W"], benchmark: 59 },
  { num: 37, quizId: "tuck-8-23-26", live: "2026-08-23", dateLabel: "August 23, 2026", sunday: true, letters: ["A","A","E","I","O","U","D","F","P","P","R","S","T","T","Y"], benchmark: 49 },
  { num: 38, quizId: "tuck-8-24-26", live: "2026-08-24", dateLabel: "August 24, 2026", sunday: false, letters: ["A","E","E","I","I","O","C","H","J","M","M","R","S","T"], benchmark: 56 },
  { num: 39, quizId: "tuck-8-25-26", live: "2026-08-25", dateLabel: "August 25, 2026", sunday: false, letters: ["A","O","O","O","U","H","K","P","P","R","R","R","S","V"], benchmark: 50 },
  { num: 40, quizId: "tuck-8-26-26", live: "2026-08-26", dateLabel: "August 26, 2026", sunday: false, letters: ["A","E","I","I","I","U","C","F","J","P","R","S","T","V"], benchmark: 56 },
  { num: 41, quizId: "tuck-8-27-26", live: "2026-08-27", dateLabel: "August 27, 2026", sunday: false, letters: ["A","E","O","O","O","C","C","D","F","L","R","T","T","X"], benchmark: 55 },
  { num: 42, quizId: "tuck-8-28-26", live: "2026-08-28", dateLabel: "August 28, 2026", sunday: false, letters: ["A","E","E","U","B","C","C","F","G","K","R","R","T","W"], benchmark: 54 },
  { num: 43, quizId: "tuck-8-29-26", live: "2026-08-29", dateLabel: "August 29, 2026", sunday: false, letters: ["A","I","O","O","O","U","B","B","D","D","F","P","P","T"], benchmark: 48 },
  { num: 44, quizId: "tuck-8-30-26", live: "2026-08-30", dateLabel: "August 30, 2026", sunday: true, letters: ["A","A","I","I","I","I","O","F","K","L","L","M","N","P","W"], benchmark: 52 },
  { num: 45, quizId: "tuck-8-31-26", live: "2026-08-31", dateLabel: "August 31, 2026", sunday: false, letters: ["A","O","O","U","D","G","J","K","L","M","N","P","R","V"], benchmark: 57 },
  { num: 46, quizId: "tuck-9-1-26", live: "2026-09-01", dateLabel: "September 1, 2026", sunday: false, letters: ["A","A","E","E","I","I","D","G","M","Q","R","S","T","V"], benchmark: 55 },
  { num: 47, quizId: "tuck-9-2-26", live: "2026-09-02", dateLabel: "September 2, 2026", sunday: false, letters: ["E","I","I","O","O","O","B","B","K","L","N","T","V","W"], benchmark: 51 },
  { num: 48, quizId: "tuck-9-3-26", live: "2026-09-03", dateLabel: "September 3, 2026", sunday: false, letters: ["A","A","E","O","O","U","H","L","M","Q","R","T","W","X"], benchmark: 67 },
  { num: 49, quizId: "tuck-9-4-26", live: "2026-09-04", dateLabel: "September 4, 2026", sunday: false, letters: ["E","E","E","E","U","B","B","F","G","J","N","N","R","T"], benchmark: 52 },
  { num: 50, quizId: "tuck-9-5-26", live: "2026-09-05", dateLabel: "September 5, 2026", sunday: false, letters: ["A","I","I","I","U","D","H","K","Q","R","T","V","W","Y"], benchmark: 70 },
  { num: 51, quizId: "tuck-9-6-26", live: "2026-09-06", dateLabel: "September 6, 2026", sunday: true, letters: ["A","A","E","U","U","B","L","L","L","M","M","R","S","V","Y"], benchmark: 50 },
  { num: 52, quizId: "tuck-9-7-26", live: "2026-09-07", dateLabel: "September 7, 2026", sunday: false, letters: ["E","E","O","O","U","C","G","H","N","N","R","T","W","X"], benchmark: 56 },
  { num: 53, quizId: "tuck-9-8-26", live: "2026-09-08", dateLabel: "September 8, 2026", sunday: false, letters: ["A","E","E","I","O","B","B","D","G","L","N","Q","S","Z"], benchmark: 64 },
  { num: 54, quizId: "tuck-9-9-26", live: "2026-09-09", dateLabel: "September 9, 2026", sunday: false, letters: ["E","E","E","E","O","U","G","K","N","P","R","R","W","Z"], benchmark: 63 },
  { num: 55, quizId: "tuck-9-10-26", live: "2026-09-10", dateLabel: "September 10, 2026", sunday: false, letters: ["A","E","E","E","O","U","C","H","L","M","N","R","S","Y"], benchmark: 48 },
  { num: 56, quizId: "tuck-9-11-26", live: "2026-09-11", dateLabel: "September 11, 2026", sunday: false, letters: ["A","E","E","I","O","B","C","D","G","H","J","N","T","Y"], benchmark: 61 },
  { num: 57, quizId: "tuck-9-12-26", live: "2026-09-12", dateLabel: "September 12, 2026", sunday: false, letters: ["A","A","E","E","B","D","F","F","H","N","N","R","V","V"], benchmark: 51 },
  { num: 58, quizId: "tuck-9-13-26", live: "2026-09-13", dateLabel: "September 13, 2026", sunday: true, letters: ["A","A","E","E","E","E","E","C","F","L","L","N","P","T","X"], benchmark: 55 },
  { num: 59, quizId: "tuck-9-14-26", live: "2026-09-14", dateLabel: "September 14, 2026", sunday: false, letters: ["E","E","O","O","U","U","D","D","G","H","J","S","S","T"], benchmark: 52 },
  { num: 60, quizId: "tuck-9-15-26", live: "2026-09-15", dateLabel: "September 15, 2026", sunday: false, letters: ["A","A","E","O","U","D","F","G","L","N","P","R","S","Z"], benchmark: 58 },
  { num: 61, quizId: "tuck-9-16-26", live: "2026-09-16", dateLabel: "September 16, 2026", sunday: false, letters: ["A","E","I","O","B","H","L","L","P","Q","R","R","S","T"], benchmark: 57 },
  { num: 62, quizId: "tuck-9-17-26", live: "2026-09-17", dateLabel: "September 17, 2026", sunday: false, letters: ["A","A","E","I","O","C","D","F","J","N","R","S","T","Z"], benchmark: 69 },
  { num: 63, quizId: "tuck-9-18-26", live: "2026-09-18", dateLabel: "September 18, 2026", sunday: false, letters: ["A","E","I","O","D","F","F","H","M","T","T","T","X","Y"], benchmark: 63 },
  { num: 64, quizId: "tuck-9-19-26", live: "2026-09-19", dateLabel: "September 19, 2026", sunday: false, letters: ["A","E","I","I","B","D","F","G","J","L","R","T","W","Z"], benchmark: 69 },
  { num: 65, quizId: "tuck-9-20-26", live: "2026-09-20", dateLabel: "September 20, 2026", sunday: true, letters: ["A","A","E","E","O","O","B","D","N","S","S","T","W","X","Z"], benchmark: 70 },
  { num: 66, quizId: "tuck-9-21-26", live: "2026-09-21", dateLabel: "September 21, 2026", sunday: false, letters: ["A","A","E","O","O","U","C","K","L","L","R","S","T","X"], benchmark: 52 },
  { num: 67, quizId: "tuck-9-22-26", live: "2026-09-22", dateLabel: "September 22, 2026", sunday: false, letters: ["I","I","O","O","O","U","F","G","J","L","N","N","R","Z"], benchmark: 63 },
  { num: 68, quizId: "tuck-9-23-26", live: "2026-09-23", dateLabel: "September 23, 2026", sunday: false, letters: ["E","E","O","U","D","F","G","L","L","M","T","W","Y","Z"], benchmark: 65 },
  { num: 69, quizId: "tuck-9-24-26", live: "2026-09-24", dateLabel: "September 24, 2026", sunday: false, letters: ["A","E","E","I","O","U","J","K","M","R","R","S","S","T"], benchmark: 54 },
  { num: 70, quizId: "tuck-9-25-26", live: "2026-09-25", dateLabel: "September 25, 2026", sunday: false, letters: ["A","A","A","E","I","C","H","K","L","P","S","S","T","Z"], benchmark: 64 },
  { num: 71, quizId: "tuck-9-26-26", live: "2026-09-26", dateLabel: "September 26, 2026", sunday: false, letters: ["A","E","I","I","O","U","M","N","R","S","T","V","Y","Z"], benchmark: 61 },
  { num: 72, quizId: "tuck-9-27-26", live: "2026-09-27", dateLabel: "September 27, 2026", sunday: true, letters: ["E","E","E","E","E","E","U","D","H","M","N","R","T","T","X"], benchmark: 55 },
  { num: 73, quizId: "tuck-9-28-26", live: "2026-09-28", dateLabel: "September 28, 2026", sunday: false, letters: ["E","I","I","O","O","F","H","M","Q","R","R","T","T","T"], benchmark: 53 },
  { num: 74, quizId: "tuck-9-29-26", live: "2026-09-29", dateLabel: "September 29, 2026", sunday: false, letters: ["A","A","E","I","O","O","G","H","N","P","S","T","V","Y"], benchmark: 49 },
  { num: 75, quizId: "tuck-9-30-26", live: "2026-09-30", dateLabel: "September 30, 2026", sunday: false, letters: ["E","E","E","I","O","O","B","C","G","P","T","T","V","X"], benchmark: 59 },
  { num: 76, quizId: "tuck-10-1-26", live: "2026-10-01", dateLabel: "October 1, 2026", sunday: false, letters: ["A","A","I","O","O","B","D","G","H","K","L","T","T","W"], benchmark: 53 },
  { num: 77, quizId: "tuck-10-2-26", live: "2026-10-02", dateLabel: "October 2, 2026", sunday: false, letters: ["E","E","I","O","O","O","D","D","G","J","T","V","Y","Y"], benchmark: 63 },
  { num: 78, quizId: "tuck-10-3-26", live: "2026-10-03", dateLabel: "October 3, 2026", sunday: false, letters: ["E","I","O","U","C","C","G","N","N","Q","T","T","V","Y"], benchmark: 54 },
  { num: 79, quizId: "tuck-10-4-26", live: "2026-10-04", dateLabel: "October 4, 2026", sunday: true, letters: ["E","E","I","O","O","B","H","N","N","N","Q","S","S","Y","Z"], benchmark: 67 },
  { num: 80, quizId: "tuck-10-5-26", live: "2026-10-05", dateLabel: "October 5, 2026", sunday: false, letters: ["A","A","E","E","E","I","N","N","N","Q","R","S","V","W"], benchmark: 51 },
  { num: 81, quizId: "tuck-10-6-26", live: "2026-10-06", dateLabel: "October 6, 2026", sunday: false, letters: ["A","I","I","O","D","F","H","N","N","P","Q","S","T","T"], benchmark: 60 },
  { num: 82, quizId: "tuck-10-7-26", live: "2026-10-07", dateLabel: "October 7, 2026", sunday: false, letters: ["A","A","E","E","O","O","D","M","P","S","T","T","V","X"], benchmark: 55 },
  { num: 83, quizId: "tuck-10-8-26", live: "2026-10-08", dateLabel: "October 8, 2026", sunday: false, letters: ["A","A","A","O","B","H","K","M","N","P","R","T","W","Y"], benchmark: 60 },
  { num: 84, quizId: "tuck-10-9-26", live: "2026-10-09", dateLabel: "October 9, 2026", sunday: false, letters: ["E","I","O","O","D","G","N","P","R","S","S","V","W","Y"], benchmark: 49 },
  { num: 85, quizId: "tuck-10-10-26", live: "2026-10-10", dateLabel: "October 10, 2026", sunday: false, letters: ["A","A","I","I","O","C","F","G","L","M","Q","R","S","W"], benchmark: 63 },
  { num: 86, quizId: "tuck-10-11-26", live: "2026-10-11", dateLabel: "October 11, 2026", sunday: true, letters: ["A","A","E","E","E","O","D","D","G","H","J","R","T","T","X"], benchmark: 61 },
  { num: 87, quizId: "tuck-10-12-26", live: "2026-10-12", dateLabel: "October 12, 2026", sunday: false, letters: ["A","A","I","O","O","C","G","G","H","J","N","R","T","W"], benchmark: 57 },
  { num: 88, quizId: "tuck-10-13-26", live: "2026-10-13", dateLabel: "October 13, 2026", sunday: false, letters: ["A","E","E","E","I","D","F","F","G","N","N","P","R","Z"], benchmark: 59 },
  { num: 89, quizId: "tuck-10-14-26", live: "2026-10-14", dateLabel: "October 14, 2026", sunday: false, letters: ["A","A","E","E","O","U","B","D","F","L","L","P","Q","T"], benchmark: 58 },
  { num: 90, quizId: "tuck-10-15-26", live: "2026-10-15", dateLabel: "October 15, 2026", sunday: false, letters: ["A","A","E","E","I","O","B","D","F","H","R","S","V","Z"], benchmark: 65 },
  { num: 91, quizId: "tuck-10-16-26", live: "2026-10-16", dateLabel: "October 16, 2026", sunday: false, letters: ["A","A","E","E","C","F","L","N","R","S","S","T","T","Z"], benchmark: 53 },
  { num: 92, quizId: "tuck-10-17-26", live: "2026-10-17", dateLabel: "October 17, 2026", sunday: false, letters: ["E","E","I","O","B","C","G","L","N","Q","R","T","Y","Z"], benchmark: 68 },
  { num: 93, quizId: "tuck-10-18-26", live: "2026-10-18", dateLabel: "October 18, 2026", sunday: true, letters: ["E","E","E","I","U","B","D","G","J","M","P","T","V","V","Y"], benchmark: 68 },
  { num: 94, quizId: "tuck-10-19-26", live: "2026-10-19", dateLabel: "October 19, 2026", sunday: false, letters: ["A","A","E","I","O","U","J","L","N","N","P","T","W","Z"], benchmark: 68 },
  { num: 95, quizId: "tuck-10-20-26", live: "2026-10-20", dateLabel: "October 20, 2026", sunday: false, letters: ["E","I","O","O","U","B","D","F","J","L","L","N","Q","T"], benchmark: 61 },
  { num: 96, quizId: "tuck-10-21-26", live: "2026-10-21", dateLabel: "October 21, 2026", sunday: false, letters: ["A","E","I","I","O","D","F","G","M","N","T","T","W","Z"], benchmark: 61 },
  { num: 97, quizId: "tuck-10-22-26", live: "2026-10-22", dateLabel: "October 22, 2026", sunday: false, letters: ["E","E","E","I","O","O","D","J","P","T","T","W","Y","Z"], benchmark: 68 },
  { num: 98, quizId: "tuck-10-23-26", live: "2026-10-23", dateLabel: "October 23, 2026", sunday: false, letters: ["A","I","I","O","O","O","D","F","K","L","N","P","W","Y"], benchmark: 56 },
  { num: 99, quizId: "tuck-10-24-26", live: "2026-10-24", dateLabel: "October 24, 2026", sunday: false, letters: ["E","O","O","O","O","U","D","D","H","K","L","S","S","Y"], benchmark: 50 },
  { num: 100, quizId: "tuck-10-25-26", live: "2026-10-25", dateLabel: "October 25, 2026", sunday: true, letters: ["A","E","E","I","I","L","M","N","Q","R","R","T","T","V","W"], benchmark: 57 },
  { num: 101, quizId: "tuck-10-26-26", live: "2026-10-26", dateLabel: "October 26, 2026", sunday: false, letters: ["A","E","E","I","O","D","D","F","J","K","L","N","P","T"], benchmark: 57 },
  { num: 102, quizId: "tuck-10-27-26", live: "2026-10-27", dateLabel: "October 27, 2026", sunday: false, letters: ["A","E","I","U","D","J","L","M","N","N","N","Q","T","W"], benchmark: 61 },
  { num: 103, quizId: "tuck-10-28-26", live: "2026-10-28", dateLabel: "October 28, 2026", sunday: false, letters: ["A","A","E","I","U","C","C","D","G","J","K","L","P","T"], benchmark: 58 },
  { num: 104, quizId: "tuck-10-29-26", live: "2026-10-29", dateLabel: "October 29, 2026", sunday: false, letters: ["A","I","O","O","O","B","C","D","H","K","N","R","R","X"], benchmark: 58 },
  { num: 105, quizId: "tuck-10-30-26", live: "2026-10-30", dateLabel: "October 30, 2026", sunday: false, letters: ["A","E","O","O","O","B","D","F","J","L","M","P","R","V"], benchmark: 59 },
  { num: 106, quizId: "tuck-10-31-26", live: "2026-10-31", dateLabel: "October 31, 2026", sunday: false, letters: ["A","I","I","U","B","B","C","L","N","P","R","T","W","Y"], benchmark: 52 },
  { num: 107, quizId: "tuck-11-1-26", live: "2026-11-01", dateLabel: "November 1, 2026", sunday: true, letters: ["A","A","E","E","E","U","U","C","M","N","Q","T","T","W","Y"], benchmark: 63 },
  { num: 108, quizId: "tuck-11-2-26", live: "2026-11-02", dateLabel: "November 2, 2026", sunday: false, letters: ["I","I","O","U","C","D","D","H","J","M","R","S","S","Z"], benchmark: 67 },
  { num: 109, quizId: "tuck-11-3-26", live: "2026-11-03", dateLabel: "November 3, 2026", sunday: false, letters: ["A","E","O","U","B","D","F","M","M","R","R","V","V","Y"], benchmark: 55 },
  { num: 110, quizId: "tuck-11-4-26", live: "2026-11-04", dateLabel: "November 4, 2026", sunday: false, letters: ["A","E","I","I","U","C","D","J","L","N","N","N","S","Y"], benchmark: 53 },
  { num: 111, quizId: "tuck-11-5-26", live: "2026-11-05", dateLabel: "November 5, 2026", sunday: false, letters: ["A","I","I","O","O","C","D","H","N","R","T","T","V","Y"], benchmark: 50 },
  { num: 112, quizId: "tuck-11-6-26", live: "2026-11-06", dateLabel: "November 6, 2026", sunday: false, letters: ["A","A","E","E","O","O","D","G","N","N","R","S","X","Z"], benchmark: 58 },
  { num: 113, quizId: "tuck-11-7-26", live: "2026-11-07", dateLabel: "November 7, 2026", sunday: false, letters: ["A","I","O","O","O","U","H","N","N","P","R","R","W","Z"], benchmark: 59 },
  { num: 114, quizId: "tuck-11-8-26", live: "2026-11-08", dateLabel: "November 8, 2026", sunday: true, letters: ["A","E","E","I","I","U","U","D","F","G","L","L","Q","T","T"], benchmark: 55 },
  { num: 115, quizId: "tuck-11-9-26", live: "2026-11-09", dateLabel: "November 9, 2026", sunday: false, letters: ["E","E","E","I","I","O","C","D","J","N","R","T","Y","Z"], benchmark: 65 },
  { num: 116, quizId: "tuck-11-10-26", live: "2026-11-10", dateLabel: "November 10, 2026", sunday: false, letters: ["A","O","U","U","G","H","H","M","N","N","R","R","T","W"], benchmark: 49 },
  { num: 117, quizId: "tuck-11-11-26", live: "2026-11-11", dateLabel: "November 11, 2026", sunday: false, letters: ["A","E","E","O","O","C","D","J","L","L","M","N","R","W"], benchmark: 54 },
  { num: 118, quizId: "tuck-11-12-26", live: "2026-11-12", dateLabel: "November 12, 2026", sunday: false, letters: ["A","A","O","O","D","D","G","R","S","S","T","W","X","Z"], benchmark: 61 },
  { num: 119, quizId: "tuck-11-13-26", live: "2026-11-13", dateLabel: "November 13, 2026", sunday: false, letters: ["A","A","A","E","U","G","M","N","P","P","R","S","V","X"], benchmark: 54 },
  { num: 120, quizId: "tuck-11-14-26", live: "2026-11-14", dateLabel: "November 14, 2026", sunday: false, letters: ["E","I","O","O","D","H","M","N","N","P","S","S","T","X"], benchmark: 55 },
  { num: 121, quizId: "tuck-11-15-26", live: "2026-11-15", dateLabel: "November 15, 2026", sunday: true, letters: ["E","E","E","I","O","U","D","F","G","L","N","N","Q","T","W"], benchmark: 58 },
  { num: 122, quizId: "tuck-11-16-26", live: "2026-11-16", dateLabel: "November 16, 2026", sunday: false, letters: ["A","E","I","O","D","G","L","N","N","P","P","W","X","Z"], benchmark: 67 },
  { num: 123, quizId: "tuck-11-17-26", live: "2026-11-17", dateLabel: "November 17, 2026", sunday: false, letters: ["A","E","E","I","U","B","D","D","F","G","H","P","R","T"], benchmark: 49 },
  { num: 124, quizId: "tuck-11-18-26", live: "2026-11-18", dateLabel: "November 18, 2026", sunday: false, letters: ["A","A","A","I","U","C","G","K","M","P","R","R","S","V"], benchmark: 50 },
  { num: 125, quizId: "tuck-11-19-26", live: "2026-11-19", dateLabel: "November 19, 2026", sunday: false, letters: ["A","E","E","O","O","D","F","G","G","H","N","R","R","W"], benchmark: 49 },
  { num: 126, quizId: "tuck-11-20-26", live: "2026-11-20", dateLabel: "November 20, 2026", sunday: false, letters: ["E","E","I","U","B","D","F","G","L","L","N","Q","R","T"], benchmark: 55 },
  { num: 127, quizId: "tuck-11-21-26", live: "2026-11-21", dateLabel: "November 21, 2026", sunday: false, letters: ["E","E","I","O","O","U","B","D","F","M","P","P","S","V"], benchmark: 51 },
  { num: 128, quizId: "tuck-11-22-26", live: "2026-11-22", dateLabel: "November 22, 2026", sunday: true, letters: ["A","E","E","I","I","U","F","L","N","N","R","S","W","X","Y"], benchmark: 60 },
  { num: 129, quizId: "tuck-11-23-26", live: "2026-11-23", dateLabel: "November 23, 2026", sunday: false, letters: ["E","I","I","O","G","L","M","P","R","S","T","W","Y","Y"], benchmark: 52 },
  { num: 130, quizId: "tuck-11-24-26", live: "2026-11-24", dateLabel: "November 24, 2026", sunday: false, letters: ["A","I","I","U","U","B","B","F","G","L","L","Q","R","T"], benchmark: 58 },
  { num: 131, quizId: "tuck-11-25-26", live: "2026-11-25", dateLabel: "November 25, 2026", sunday: false, letters: ["E","I","O","O","G","L","M","P","R","R","S","T","T","Z"], benchmark: 55 },
  { num: 132, quizId: "tuck-11-26-26", live: "2026-11-26", dateLabel: "November 26, 2026", sunday: false, letters: ["A","E","I","I","O","U","C","D","F","K","N","N","R","W"], benchmark: 51 },
  { num: 133, quizId: "tuck-11-27-26", live: "2026-11-27", dateLabel: "November 27, 2026", sunday: false, letters: ["A","A","E","I","I","I","C","D","M","M","N","N","Y","Y"], benchmark: 50 },
  { num: 134, quizId: "tuck-11-28-26", live: "2026-11-28", dateLabel: "November 28, 2026", sunday: false, letters: ["A","E","I","O","O","O","D","G","M","M","R","R","W","X"], benchmark: 57 },
  { num: 135, quizId: "tuck-11-29-26", live: "2026-11-29", dateLabel: "November 29, 2026", sunday: true, letters: ["A","A","E","I","O","O","U","D","K","L","M","P","W","X","Y"], benchmark: 68 },
  { num: 136, quizId: "tuck-11-30-26", live: "2026-11-30", dateLabel: "November 30, 2026", sunday: false, letters: ["A","A","E","U","H","K","M","N","N","P","R","R","R","W"], benchmark: 50 },
  { num: 137, quizId: "tuck-12-1-26", live: "2026-12-01", dateLabel: "December 1, 2026", sunday: false, letters: ["E","E","E","E","O","G","J","M","N","N","S","T","T","V"], benchmark: 50 },
  { num: 138, quizId: "tuck-12-2-26", live: "2026-12-02", dateLabel: "December 2, 2026", sunday: false, letters: ["A","A","E","U","C","F","H","J","L","L","L","T","T","V"], benchmark: 54 },
  { num: 139, quizId: "tuck-12-3-26", live: "2026-12-03", dateLabel: "December 3, 2026", sunday: false, letters: ["A","A","E","E","I","D","L","P","R","R","S","T","X","Y"], benchmark: 53 },
  { num: 140, quizId: "tuck-12-4-26", live: "2026-12-04", dateLabel: "December 4, 2026", sunday: false, letters: ["A","A","E","I","O","O","C","D","H","K","R","S","W","Z"], benchmark: 66 },
  { num: 141, quizId: "tuck-12-5-26", live: "2026-12-05", dateLabel: "December 5, 2026", sunday: false, letters: ["A","E","I","U","U","D","G","M","T","T","T","V","W","X"], benchmark: 56 },
  { num: 142, quizId: "tuck-12-6-26", live: "2026-12-06", dateLabel: "December 6, 2026", sunday: true, letters: ["A","A","I","O","U","C","D","L","L","N","Q","S","T","W","Z"], benchmark: 68 },
  { num: 143, quizId: "tuck-12-7-26", live: "2026-12-07", dateLabel: "December 7, 2026", sunday: false, letters: ["A","A","A","E","E","I","B","J","R","R","T","V","X","Y"], benchmark: 67 },
  { num: 144, quizId: "tuck-12-8-26", live: "2026-12-08", dateLabel: "December 8, 2026", sunday: false, letters: ["A","A","E","E","G","L","M","N","N","R","R","S","W","X"], benchmark: 50 },
  { num: 145, quizId: "tuck-12-9-26", live: "2026-12-09", dateLabel: "December 9, 2026", sunday: false, letters: ["A","E","E","I","O","C","D","D","F","L","N","Q","S","Z"], benchmark: 65 },
  { num: 146, quizId: "tuck-12-10-26", live: "2026-12-10", dateLabel: "December 10, 2026", sunday: false, letters: ["A","E","E","E","I","U","D","F","G","J","L","N","N","P"], benchmark: 54 },
  { num: 147, quizId: "tuck-12-11-26", live: "2026-12-11", dateLabel: "December 11, 2026", sunday: false, letters: ["A","A","E","I","D","D","H","N","Q","R","R","S","T","Y"], benchmark: 56 },
  { num: 148, quizId: "tuck-12-12-26", live: "2026-12-12", dateLabel: "December 12, 2026", sunday: false, letters: ["A","A","E","E","I","I","B","D","H","J","Q","R","S","V"], benchmark: 65 },
  { num: 149, quizId: "tuck-12-13-26", live: "2026-12-13", dateLabel: "December 13, 2026", sunday: true, letters: ["A","A","E","E","I","O","U","B","H","N","N","P","R","T","X"], benchmark: 57 },
  { num: 150, quizId: "tuck-12-14-26", live: "2026-12-14", dateLabel: "December 14, 2026", sunday: false, letters: ["A","A","E","I","U","B","F","G","G","J","N","R","S","T"], benchmark: 53 },
  { num: 151, quizId: "tuck-12-15-26", live: "2026-12-15", dateLabel: "December 15, 2026", sunday: false, letters: ["A","E","I","O","G","L","Q","R","R","S","T","T","W","Z"], benchmark: 61 },
  { num: 152, quizId: "tuck-12-16-26", live: "2026-12-16", dateLabel: "December 16, 2026", sunday: false, letters: ["E","E","I","O","C","D","F","N","N","P","R","W","X","Y"], benchmark: 61 },
  { num: 153, quizId: "tuck-12-17-26", live: "2026-12-17", dateLabel: "December 17, 2026", sunday: false, letters: ["E","E","I","I","U","H","J","P","R","T","T","T","V","W"], benchmark: 58 },
  { num: 154, quizId: "tuck-12-18-26", live: "2026-12-18", dateLabel: "December 18, 2026", sunday: false, letters: ["A","E","E","I","I","D","G","P","Q","S","T","T","T","Y"], benchmark: 51 },
  { num: 155, quizId: "tuck-12-19-26", live: "2026-12-19", dateLabel: "December 19, 2026", sunday: false, letters: ["A","E","E","I","C","D","F","G","K","N","S","T","T","W"], benchmark: 51 },
  { num: 156, quizId: "tuck-12-20-26", live: "2026-12-20", dateLabel: "December 20, 2026", sunday: true, letters: ["E","O","O","O","U","B","G","H","N","P","R","R","T","W","X"], benchmark: 61 },
  { num: 157, quizId: "tuck-12-21-26", live: "2026-12-21", dateLabel: "December 21, 2026", sunday: false, letters: ["E","E","E","I","I","O","B","G","H","K","P","T","T","Y"], benchmark: 54 },
  { num: 158, quizId: "tuck-12-22-26", live: "2026-12-22", dateLabel: "December 22, 2026", sunday: false, letters: ["A","E","E","I","O","O","H","K","L","M","N","N","P","S"], benchmark: 50 },
  { num: 159, quizId: "tuck-12-23-26", live: "2026-12-23", dateLabel: "December 23, 2026", sunday: false, letters: ["A","E","I","O","D","F","G","H","J","L","M","N","R","S"], benchmark: 57 },
  { num: 160, quizId: "tuck-12-24-26", live: "2026-12-24", dateLabel: "December 24, 2026", sunday: false, letters: ["A","E","E","I","O","F","G","P","R","R","T","V","Y","Z"], benchmark: 64 },
  { num: 161, quizId: "tuck-12-25-26", live: "2026-12-25", dateLabel: "December 25, 2026", sunday: false, letters: ["A","E","E","E","O","U","B","F","G","K","Q","R","T","V"], benchmark: 56 },
  { num: 162, quizId: "tuck-12-26-26", live: "2026-12-26", dateLabel: "December 26, 2026", sunday: false, letters: ["A","A","E","U","D","F","G","H","L","L","N","T","X","Y"], benchmark: 58 },
  { num: 163, quizId: "tuck-12-27-26", live: "2026-12-27", dateLabel: "December 27, 2026", sunday: true, letters: ["E","I","O","O","U","U","C","L","L","M","N","Q","R","T","W"], benchmark: 58 },
  { num: 164, quizId: "tuck-12-28-26", live: "2026-12-28", dateLabel: "December 28, 2026", sunday: false, letters: ["E","E","E","I","O","O","B","B","M","R","R","Y","Y","Z"], benchmark: 64 },
  { num: 165, quizId: "tuck-12-29-26", live: "2026-12-29", dateLabel: "December 29, 2026", sunday: false, letters: ["A","A","E","E","E","U","B","C","D","F","G","N","T","Z"], benchmark: 61 },
  { num: 166, quizId: "tuck-12-30-26", live: "2026-12-30", dateLabel: "December 30, 2026", sunday: false, letters: ["A","A","I","I","O","F","G","H","M","P","R","R","S","T"], benchmark: 49 },
  { num: 167, quizId: "tuck-12-31-26", live: "2026-12-31", dateLabel: "December 31, 2026", sunday: false, letters: ["A","E","I","O","D","F","G","G","L","R","R","T","V","Y"], benchmark: 49 },
];
