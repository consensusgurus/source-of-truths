// Puzzle data for Queen, the daily king-and-pawn promotion endgame. Imported
// ONLY by the server page (app/queen/page.js), which filters live<=today and
// STRIPS keyUci/keySan before handing boards to the client, so neither
// tomorrow's position nor any day's key move ever ships to the browser.
//
// Each puzzle is a position with WHITE TO MOVE: a king and one pawn against a
// bare king, with a tablebase-proven promotion in exactly `winIn` White moves.
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
  { num: 1, quizId: 'queen-8-21-26', live: '2026-08-21', dateLabel: 'August 21, 2026', sunday: false, winIn: 8, fen: '5k2/8/7K/8/8/8/5P2/8 w - - 0 1', keyUci: 'h6g6', keySan: 'Kg6' },
  { num: 2, quizId: 'queen-8-22-26', live: '2026-08-22', dateLabel: 'August 22, 2026', sunday: false, winIn: 9, fen: '8/7k/5K2/8/8/6P1/8/8 w - - 0 1', keyUci: 'g3g4', keySan: 'g4' },
  { num: 3, quizId: 'queen-8-23-26', live: '2026-08-23', dateLabel: 'August 23, 2026', sunday: true, winIn: 12, fen: '8/8/2k5/8/8/5P2/4K3/8 w - - 0 1', keyUci: 'e2e3', keySan: 'Ke3' },
  { num: 4, quizId: 'queen-8-24-26', live: '2026-08-24', dateLabel: 'August 24, 2026', sunday: false, winIn: 5, fen: 'k7/8/1K6/8/4P3/8/8/8 w - - 0 1', keyUci: 'b6c7', keySan: 'Kc7' },
  { num: 5, quizId: 'queen-8-25-26', live: '2026-08-25', dateLabel: 'August 25, 2026', sunday: false, winIn: 6, fen: '6K1/8/8/8/8/8/6P1/5k2 w - - 0 1', keyUci: 'g2g4', keySan: 'g4' },
  { num: 6, quizId: 'queen-8-26-26', live: '2026-08-26', dateLabel: 'August 26, 2026', sunday: false, winIn: 7, fen: '2k5/8/8/1K2P3/8/8/8/8 w - - 0 1', keyUci: 'b5c6', keySan: 'Kc6' },
  { num: 7, quizId: 'queen-8-27-26', live: '2026-08-27', dateLabel: 'August 27, 2026', sunday: false, winIn: 8, fen: '2k5/8/8/5P2/8/4K3/8/8 w - - 0 1', keyUci: 'e3f4', keySan: 'Kf4' },
  { num: 8, quizId: 'queen-8-28-26', live: '2026-08-28', dateLabel: 'August 28, 2026', sunday: false, winIn: 8, fen: '8/8/1K6/8/5k2/3P4/8/8 w - - 0 1', keyUci: 'd3d4', keySan: 'd4' },
  { num: 9, quizId: 'queen-8-29-26', live: '2026-08-29', dateLabel: 'August 29, 2026', sunday: false, winIn: 9, fen: '3k4/8/8/4K3/8/1P6/8/8 w - - 0 1', keyUci: 'e5d6', keySan: 'Kd6' },
  { num: 10, quizId: 'queen-8-30-26', live: '2026-08-30', dateLabel: 'August 30, 2026', sunday: true, winIn: 12, fen: '8/7k/8/8/8/8/2P5/6K1 w - - 0 1', keyUci: 'g1f2', keySan: 'Kf2' },
  { num: 11, quizId: 'queen-8-31-26', live: '2026-08-31', dateLabel: 'August 31, 2026', sunday: false, winIn: 5, fen: '8/8/8/8/1K6/8/6Pk/8 w - - 0 1', keyUci: 'g2g4', keySan: 'g4' },
  { num: 12, quizId: 'queen-9-1-26', live: '2026-09-01', dateLabel: 'September 1, 2026', sunday: false, winIn: 6, fen: '4k3/8/8/2K5/3P4/8/8/8 w - - 0 1', keyUci: 'c5d6', keySan: 'Kd6' },
  { num: 13, quizId: 'queen-9-2-26', live: '2026-09-02', dateLabel: 'September 2, 2026', sunday: false, winIn: 7, fen: '8/K7/8/3k4/8/8/P7/8 w - - 0 1', keyUci: 'a7b6', keySan: 'Kb6' },
  { num: 14, quizId: 'queen-9-3-26', live: '2026-09-03', dateLabel: 'September 3, 2026', sunday: false, winIn: 8, fen: '8/8/8/2K5/8/8/1kP5/8 w - - 0 1', keyUci: 'c2c4', keySan: 'c4' },
  { num: 15, quizId: 'queen-9-4-26', live: '2026-09-04', dateLabel: 'September 4, 2026', sunday: false, winIn: 8, fen: '8/5k2/8/8/1P6/4K3/8/8 w - - 0 1', keyUci: 'e3d4', keySan: 'Kd4' },
  { num: 16, quizId: 'queen-9-5-26', live: '2026-09-05', dateLabel: 'September 5, 2026', sunday: false, winIn: 9, fen: '4k3/8/3K4/8/6P1/8/8/8 w - - 0 1', keyUci: 'd6e6', keySan: 'Ke6' },
  { num: 17, quizId: 'queen-9-6-26', live: '2026-09-06', dateLabel: 'September 6, 2026', sunday: true, winIn: 12, fen: '8/8/1k6/8/1K6/8/1P6/8 w - - 0 1', keyUci: 'b2b3', keySan: 'b3' },
  { num: 18, quizId: 'queen-9-7-26', live: '2026-09-07', dateLabel: 'September 7, 2026', sunday: false, winIn: 5, fen: '8/8/6K1/8/6Pk/8/8/8 w - - 0 1', keyUci: 'g6f5', keySan: 'Kf5' },
  { num: 19, quizId: 'queen-9-8-26', live: '2026-09-08', dateLabel: 'September 8, 2026', sunday: false, winIn: 6, fen: '8/8/6K1/8/8/6k1/3P4/8 w - - 0 1', keyUci: 'g6f5', keySan: 'Kf5' },
  { num: 20, quizId: 'queen-9-9-26', live: '2026-09-09', dateLabel: 'September 9, 2026', sunday: false, winIn: 7, fen: 'k7/4K3/8/8/8/2P5/8/8 w - - 0 1', keyUci: 'c3c4', keySan: 'c4' },
  { num: 21, quizId: 'queen-9-10-26', live: '2026-09-10', dateLabel: 'September 10, 2026', sunday: false, winIn: 8, fen: 'k7/8/8/8/3P4/5K2/8/8 w - - 0 1', keyUci: 'f3e4', keySan: 'Ke4' },
  { num: 22, quizId: 'queen-9-11-26', live: '2026-09-11', dateLabel: 'September 11, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/P2k4/K7/8/8 w - - 0 1', keyUci: 'a3b4', keySan: 'Kb4' },
  { num: 23, quizId: 'queen-9-12-26', live: '2026-09-12', dateLabel: 'September 12, 2026', sunday: false, winIn: 9, fen: '8/8/3k4/1K6/8/8/2P5/8 w - - 0 1', keyUci: 'c2c4', keySan: 'c4' },
  { num: 24, quizId: 'queen-9-13-26', live: '2026-09-13', dateLabel: 'September 13, 2026', sunday: true, winIn: 12, fen: '8/2k5/8/8/1K6/8/5P2/8 w - - 0 1', keyUci: 'b4c5', keySan: 'Kc5' },
  { num: 25, quizId: 'queen-9-14-26', live: '2026-09-14', dateLabel: 'September 14, 2026', sunday: false, winIn: 5, fen: '8/K2k4/8/8/P7/8/8/8 w - - 0 1', keyUci: 'a7b7', keySan: 'Kb7' },
  { num: 26, quizId: 'queen-9-15-26', live: '2026-09-15', dateLabel: 'September 15, 2026', sunday: false, winIn: 6, fen: '8/2K1k3/8/8/8/8/2P5/8 w - - 0 1', keyUci: 'c2c4', keySan: 'c4' },
  { num: 27, quizId: 'queen-9-16-26', live: '2026-09-16', dateLabel: 'September 16, 2026', sunday: false, winIn: 7, fen: '1k6/8/8/8/3P1K2/8/8/8 w - - 0 1', keyUci: 'f4e5', keySan: 'Ke5' },
  { num: 28, quizId: 'queen-9-17-26', live: '2026-09-17', dateLabel: 'September 17, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/1P2k3/2K5/8/8 w - - 0 1', keyUci: 'c3c4', keySan: 'Kc4' },
  { num: 29, quizId: 'queen-9-18-26', live: '2026-09-18', dateLabel: 'September 18, 2026', sunday: false, winIn: 8, fen: '8/8/4K3/8/k7/8/2P5/8 w - - 0 1', keyUci: 'c2c4', keySan: 'c4' },
  { num: 30, quizId: 'queen-9-19-26', live: '2026-09-19', dateLabel: 'September 19, 2026', sunday: false, winIn: 9, fen: '8/k7/8/8/4P3/8/7K/8 w - - 0 1', keyUci: 'h2g3', keySan: 'Kg3' },
  { num: 31, quizId: 'queen-9-20-26', live: '2026-09-20', dateLabel: 'September 20, 2026', sunday: true, winIn: 12, fen: '8/2k5/8/8/8/3P1K2/8/8 w - - 0 1', keyUci: 'f3e4', keySan: 'Ke4' },
  { num: 32, quizId: 'queen-9-21-26', live: '2026-09-21', dateLabel: 'September 21, 2026', sunday: false, winIn: 5, fen: '8/8/1K6/8/8/8/k1P5/8 w - - 0 1', keyUci: 'c2c4', keySan: 'c4' },
  { num: 33, quizId: 'queen-9-22-26', live: '2026-09-22', dateLabel: 'September 22, 2026', sunday: false, winIn: 6, fen: '8/8/8/1K2k3/8/P7/8/8 w - - 0 1', keyUci: 'b5c6', keySan: 'Kc6' },
  { num: 34, quizId: 'queen-9-23-26', live: '2026-09-23', dateLabel: 'September 23, 2026', sunday: false, winIn: 7, fen: '4k3/8/8/3K2P1/8/8/8/8 w - - 0 1', keyUci: 'd5e6', keySan: 'Ke6' },
  { num: 35, quizId: 'queen-9-24-26', live: '2026-09-24', dateLabel: 'September 24, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/1K6/2Pk4/8/8 w - - 0 1', keyUci: 'c3c4', keySan: 'c4' },
  { num: 36, quizId: 'queen-9-25-26', live: '2026-09-25', dateLabel: 'September 25, 2026', sunday: false, winIn: 8, fen: '8/8/8/1k6/4P3/5K2/8/8 w - - 0 1', keyUci: 'f3f4', keySan: 'Kf4' },
  { num: 37, quizId: 'queen-9-26-26', live: '2026-09-26', dateLabel: 'September 26, 2026', sunday: false, winIn: 9, fen: '8/7k/8/4K3/8/8/6P1/8 w - - 0 1', keyUci: 'e5f6', keySan: 'Kf6' },
  { num: 38, quizId: 'queen-9-27-26', live: '2026-09-27', dateLabel: 'September 27, 2026', sunday: true, winIn: 12, fen: '8/6k1/8/8/8/6K1/5P2/8 w - - 0 1', keyUci: 'g3f4', keySan: 'Kf4' },
  { num: 39, quizId: 'queen-9-28-26', live: '2026-09-28', dateLabel: 'September 28, 2026', sunday: false, winIn: 5, fen: '8/6k1/4P3/8/5K2/8/8/8 w - - 0 1', keyUci: 'f4e5', keySan: 'Ke5' },
  { num: 40, quizId: 'queen-9-29-26', live: '2026-09-29', dateLabel: 'September 29, 2026', sunday: false, winIn: 6, fen: '8/7K/8/8/4k3/8/7P/8 w - - 0 1', keyUci: 'h7g6', keySan: 'Kg6' },
  { num: 41, quizId: 'queen-9-30-26', live: '2026-09-30', dateLabel: 'September 30, 2026', sunday: false, winIn: 7, fen: '8/8/1K6/8/8/1P6/k7/8 w - - 0 1', keyUci: 'b3b4', keySan: 'b4' },
  { num: 42, quizId: 'queen-10-1-26', live: '2026-10-01', dateLabel: 'October 1, 2026', sunday: false, winIn: 8, fen: '8/8/2k5/8/3K4/8/7P/8 w - - 0 1', keyUci: 'd4e5', keySan: 'Ke5' },
  { num: 43, quizId: 'queen-10-2-26', live: '2026-10-02', dateLabel: 'October 2, 2026', sunday: false, winIn: 8, fen: '8/4k3/8/8/2KP4/8/8/8 w - - 0 1', keyUci: 'c4c5', keySan: 'Kc5' },
  { num: 44, quizId: 'queen-10-3-26', live: '2026-10-03', dateLabel: 'October 3, 2026', sunday: false, winIn: 9, fen: '8/8/4k3/6K1/8/5P2/8/8 w - - 0 1', keyUci: 'f3f4', keySan: 'f4' },
  { num: 45, quizId: 'queen-10-4-26', live: '2026-10-04', dateLabel: 'October 4, 2026', sunday: true, winIn: 12, fen: '8/4k3/8/8/8/5K2/6P1/8 w - - 0 1', keyUci: 'f3g4', keySan: 'Kg4' },
  { num: 46, quizId: 'queen-10-5-26', live: '2026-10-05', dateLabel: 'October 5, 2026', sunday: false, winIn: 5, fen: '3k4/8/4K3/8/7P/8/8/8 w - - 0 1', keyUci: 'e6f7', keySan: 'Kf7' },
  { num: 47, quizId: 'queen-10-6-26', live: '2026-10-06', dateLabel: 'October 6, 2026', sunday: false, winIn: 6, fen: 'K7/8/8/8/8/8/P1k5/8 w - - 0 1', keyUci: 'a2a4', keySan: 'a4' },
  { num: 48, quizId: 'queen-10-7-26', live: '2026-10-07', dateLabel: 'October 7, 2026', sunday: false, winIn: 7, fen: '3K4/8/2k5/8/8/7P/8/8 w - - 0 1', keyUci: 'd8e7', keySan: 'Ke7' },
  { num: 49, quizId: 'queen-10-8-26', live: '2026-10-08', dateLabel: 'October 8, 2026', sunday: false, winIn: 8, fen: '8/5k2/8/8/4K3/8/P7/8 w - - 0 1', keyUci: 'e4d5', keySan: 'Kd5' },
  { num: 50, quizId: 'queen-10-9-26', live: '2026-10-09', dateLabel: 'October 9, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/7K/8/6kP/8 w - - 0 1', keyUci: 'h2h3', keySan: 'h3' },
  { num: 51, quizId: 'queen-10-10-26', live: '2026-10-10', dateLabel: 'October 10, 2026', sunday: false, winIn: 9, fen: '8/8/7K/8/8/6k1/1P6/8 w - - 0 1', keyUci: 'h6g5', keySan: 'Kg5' },
  { num: 52, quizId: 'queen-10-11-26', live: '2026-10-11', dateLabel: 'October 11, 2026', sunday: true, winIn: 12, fen: '8/8/8/7k/8/8/K3P3/8 w - - 0 1', keyUci: 'a2b3', keySan: 'Kb3' },
  { num: 53, quizId: 'queen-10-12-26', live: '2026-10-12', dateLabel: 'October 12, 2026', sunday: false, winIn: 5, fen: '8/8/8/8/1k6/8/K6P/8 w - - 0 1', keyUci: 'h2h4', keySan: 'h4' },
  { num: 54, quizId: 'queen-10-13-26', live: '2026-10-13', dateLabel: 'October 13, 2026', sunday: false, winIn: 6, fen: '8/8/8/8/8/kP6/2K5/8 w - - 0 1', keyUci: 'c2c3', keySan: 'Kc3' },
  { num: 55, quizId: 'queen-10-14-26', live: '2026-10-14', dateLabel: 'October 14, 2026', sunday: false, winIn: 7, fen: '8/8/8/8/K7/2k5/P7/8 w - - 0 1', keyUci: 'a4b5', keySan: 'Kb5' },
  { num: 56, quizId: 'queen-10-15-26', live: '2026-10-15', dateLabel: 'October 15, 2026', sunday: false, winIn: 8, fen: '8/8/2K5/8/6k1/4P3/8/8 w - - 0 1', keyUci: 'e3e4', keySan: 'e4' },
  { num: 57, quizId: 'queen-10-16-26', live: '2026-10-16', dateLabel: 'October 16, 2026', sunday: false, winIn: 8, fen: '2K5/8/8/8/1k6/8/5P2/8 w - - 0 1', keyUci: 'c8d7', keySan: 'Kd7' },
  { num: 58, quizId: 'queen-10-17-26', live: '2026-10-17', dateLabel: 'October 17, 2026', sunday: false, winIn: 9, fen: '8/8/8/8/4k3/7K/7P/8 w - - 0 1', keyUci: 'h3g4', keySan: 'Kg4' },
  { num: 59, quizId: 'queen-10-18-26', live: '2026-10-18', dateLabel: 'October 18, 2026', sunday: true, winIn: 12, fen: '7K/4k3/8/8/8/5P2/8/8 w - - 0 1', keyUci: 'h8g7', keySan: 'Kg7' },
  { num: 60, quizId: 'queen-10-19-26', live: '2026-10-19', dateLabel: 'October 19, 2026', sunday: false, winIn: 5, fen: '1k6/8/1K6/1P6/8/8/8/8 w - - 0 1', keyUci: 'b6a6', keySan: 'Ka6' },
  { num: 61, quizId: 'queen-10-20-26', live: '2026-10-20', dateLabel: 'October 20, 2026', sunday: false, winIn: 6, fen: '8/8/7K/8/8/6k1/4P3/8 w - - 0 1', keyUci: 'h6g5', keySan: 'Kg5' },
  { num: 62, quizId: 'queen-10-21-26', live: '2026-10-21', dateLabel: 'October 21, 2026', sunday: false, winIn: 7, fen: '8/8/1K4k1/8/8/8/3P4/8 w - - 0 1', keyUci: 'd2d4', keySan: 'd4' },
  { num: 63, quizId: 'queen-10-22-26', live: '2026-10-22', dateLabel: 'October 22, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/8/1K2k3/P7/8 w - - 0 1', keyUci: 'b3c4', keySan: 'Kc4' },
  { num: 64, quizId: 'queen-10-23-26', live: '2026-10-23', dateLabel: 'October 23, 2026', sunday: false, winIn: 8, fen: '4K3/8/8/8/3k4/8/7P/8 w - - 0 1', keyUci: 'e8f7', keySan: 'Kf7' },
  { num: 65, quizId: 'queen-10-24-26', live: '2026-10-24', dateLabel: 'October 24, 2026', sunday: false, winIn: 9, fen: '8/8/6k1/4K3/8/8/5P2/8 w - - 0 1', keyUci: 'f2f4', keySan: 'f4' },
  { num: 66, quizId: 'queen-10-25-26', live: '2026-10-25', dateLabel: 'October 25, 2026', sunday: true, winIn: 12, fen: '8/8/8/1k6/8/4P3/2K5/8 w - - 0 1', keyUci: 'c2d3', keySan: 'Kd3' },
  { num: 67, quizId: 'queen-10-26-26', live: '2026-10-26', dateLabel: 'October 26, 2026', sunday: false, winIn: 5, fen: '2k5/8/1K6/8/1P6/8/8/8 w - - 0 1', keyUci: 'b6a7', keySan: 'Ka7' },
  { num: 68, quizId: 'queen-10-27-26', live: '2026-10-27', dateLabel: 'October 27, 2026', sunday: false, winIn: 6, fen: '8/1k6/3K4/8/2P5/8/8/8 w - - 0 1', keyUci: 'c4c5', keySan: 'c5' },
  { num: 69, quizId: 'queen-10-28-26', live: '2026-10-28', dateLabel: 'October 28, 2026', sunday: false, winIn: 7, fen: '8/8/4k3/6P1/6K1/8/8/8 w - - 0 1', keyUci: 'g4h5', keySan: 'Kh5' },
  { num: 70, quizId: 'queen-10-29-26', live: '2026-10-29', dateLabel: 'October 29, 2026', sunday: false, winIn: 8, fen: '8/5k2/8/8/4K3/P7/8/8 w - - 0 1', keyUci: 'e4d5', keySan: 'Kd5' },
  { num: 71, quizId: 'queen-10-30-26', live: '2026-10-30', dateLabel: 'October 30, 2026', sunday: false, winIn: 8, fen: '8/8/1k6/5K2/8/3P4/8/8 w - - 0 1', keyUci: 'd3d4', keySan: 'd4' },
  { num: 72, quizId: 'queen-10-31-26', live: '2026-10-31', dateLabel: 'October 31, 2026', sunday: false, winIn: 9, fen: '8/8/8/8/4k3/6KP/8/8 w - - 0 1', keyUci: 'g3g4', keySan: 'Kg4' },
  { num: 73, quizId: 'queen-11-1-26', live: '2026-11-01', dateLabel: 'November 1, 2026', sunday: true, winIn: 12, fen: '8/k7/8/8/8/5P2/8/1K6 w - - 0 1', keyUci: 'b1c2', keySan: 'Kc2' },
  { num: 74, quizId: 'queen-11-2-26', live: '2026-11-02', dateLabel: 'November 2, 2026', sunday: false, winIn: 5, fen: '8/3K4/5k2/8/3P4/8/8/8 w - - 0 1', keyUci: 'd4d5', keySan: 'd5' },
  { num: 75, quizId: 'queen-11-3-26', live: '2026-11-03', dateLabel: 'November 3, 2026', sunday: false, winIn: 6, fen: '8/5k2/8/6K1/6P1/8/8/8 w - - 0 1', keyUci: 'g5h6', keySan: 'Kh6' },
  { num: 76, quizId: 'queen-11-4-26', live: '2026-11-04', dateLabel: 'November 4, 2026', sunday: false, winIn: 7, fen: '8/3k4/8/1P6/1K6/8/8/8 w - - 0 1', keyUci: 'b4a5', keySan: 'Ka5' },
  { num: 77, quizId: 'queen-11-5-26', live: '2026-11-05', dateLabel: 'November 5, 2026', sunday: false, winIn: 8, fen: '8/8/8/6K1/2k5/8/4P3/8 w - - 0 1', keyUci: 'e2e4', keySan: 'e4' },
  { num: 78, quizId: 'queen-11-6-26', live: '2026-11-06', dateLabel: 'November 6, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/K2k4/8/P7/8 w - - 0 1', keyUci: 'a4b5', keySan: 'Kb5' },
  { num: 79, quizId: 'queen-11-7-26', live: '2026-11-07', dateLabel: 'November 7, 2026', sunday: false, winIn: 9, fen: '8/8/8/8/8/K1Pk4/8/8 w - - 0 1', keyUci: 'a3b4', keySan: 'Kb4' },
  { num: 80, quizId: 'queen-11-8-26', live: '2026-11-08', dateLabel: 'November 8, 2026', sunday: true, winIn: 12, fen: '8/3k4/8/8/1P6/K7/8/8 w - - 0 1', keyUci: 'a3a4', keySan: 'Ka4' },
  { num: 81, quizId: 'queen-11-9-26', live: '2026-11-09', dateLabel: 'November 9, 2026', sunday: false, winIn: 5, fen: '8/8/3k4/5K2/7P/8/8/8 w - - 0 1', keyUci: 'f5f6', keySan: 'Kf6' },
  { num: 82, quizId: 'queen-11-10-26', live: '2026-11-10', dateLabel: 'November 10, 2026', sunday: false, winIn: 6, fen: '8/8/8/8/6K1/6P1/7k/8 w - - 0 1', keyUci: 'g4h4', keySan: 'Kh4' },
  { num: 83, quizId: 'queen-11-11-26', live: '2026-11-11', dateLabel: 'November 11, 2026', sunday: false, winIn: 7, fen: '8/k7/8/K1P5/8/8/8/8 w - - 0 1', keyUci: 'c5c6', keySan: 'c6' },
  { num: 84, quizId: 'queen-11-12-26', live: '2026-11-12', dateLabel: 'November 12, 2026', sunday: false, winIn: 8, fen: '8/8/7k/8/4P3/3K4/8/8 w - - 0 1', keyUci: 'd3d4', keySan: 'Kd4' },
  { num: 85, quizId: 'queen-11-13-26', live: '2026-11-13', dateLabel: 'November 13, 2026', sunday: false, winIn: 8, fen: '4K3/2k5/8/8/3P4/8/8/8 w - - 0 1', keyUci: 'e8e7', keySan: 'Ke7' },
  { num: 86, quizId: 'queen-11-14-26', live: '2026-11-14', dateLabel: 'November 14, 2026', sunday: false, winIn: 9, fen: '8/8/6k1/4K3/8/5P2/8/8 w - - 0 1', keyUci: 'f3f4', keySan: 'f4' },
  { num: 87, quizId: 'queen-11-15-26', live: '2026-11-15', dateLabel: 'November 15, 2026', sunday: true, winIn: 12, fen: '7k/8/8/8/8/4P3/5K2/8 w - - 0 1', keyUci: 'f2f3', keySan: 'Kf3' },
  { num: 88, quizId: 'queen-11-16-26', live: '2026-11-16', dateLabel: 'November 16, 2026', sunday: false, winIn: 5, fen: '2K5/8/3k4/8/P7/8/8/8 w - - 0 1', keyUci: 'c8b7', keySan: 'Kb7' },
  { num: 89, quizId: 'queen-11-17-26', live: '2026-11-17', dateLabel: 'November 17, 2026', sunday: false, winIn: 6, fen: '8/8/4k1K1/8/8/7P/8/8 w - - 0 1', keyUci: 'h3h4', keySan: 'h4' },
  { num: 90, quizId: 'queen-11-18-26', live: '2026-11-18', dateLabel: 'November 18, 2026', sunday: false, winIn: 7, fen: '2K5/5k2/8/8/8/8/3P4/8 w - - 0 1', keyUci: 'c8d7', keySan: 'Kd7' },
  { num: 91, quizId: 'queen-11-19-26', live: '2026-11-19', dateLabel: 'November 19, 2026', sunday: false, winIn: 8, fen: '8/4k3/8/8/1P6/K7/8/8 w - - 0 1', keyUci: 'a3a4', keySan: 'Ka4' },
  { num: 92, quizId: 'queen-11-20-26', live: '2026-11-20', dateLabel: 'November 20, 2026', sunday: false, winIn: 8, fen: '8/8/8/8/6K1/8/5kP1/8 w - - 0 1', keyUci: 'g2g3', keySan: 'g3' },
  { num: 93, quizId: 'queen-11-21-26', live: '2026-11-21', dateLabel: 'November 21, 2026', sunday: false, winIn: 9, fen: '4k2K/8/8/8/8/8/5P2/8 w - - 0 1', keyUci: 'h8g7', keySan: 'Kg7' },
  { num: 94, quizId: 'queen-11-22-26', live: '2026-11-22', dateLabel: 'November 22, 2026', sunday: true, winIn: 12, fen: '8/8/8/8/2P3k1/8/8/4K3 w - - 0 1', keyUci: 'e1d2', keySan: 'Kd2' },
  { num: 95, quizId: 'queen-11-23-26', live: '2026-11-23', dateLabel: 'November 23, 2026', sunday: false, winIn: 5, fen: '7K/8/8/8/7P/5k2/8/8 w - - 0 1', keyUci: 'h4h5', keySan: 'h5' },
  { num: 96, quizId: 'queen-11-24-26', live: '2026-11-24', dateLabel: 'November 24, 2026', sunday: false, winIn: 6, fen: '8/K7/8/8/3k4/P7/8/8 w - - 0 1', keyUci: 'a7b6', keySan: 'Kb6' },
  { num: 97, quizId: 'queen-11-25-26', live: '2026-11-25', dateLabel: 'November 25, 2026', sunday: false, winIn: 7, fen: '2K5/k7/8/1P6/8/8/8/8 w - - 0 1', keyUci: 'c8c7', keySan: 'Kc7' },
  { num: 98, quizId: 'queen-11-26-26', live: '2026-11-26', dateLabel: 'November 26, 2026', sunday: false, winIn: 8, fen: '8/8/5K1k/8/6P1/8/8/8 w - - 0 1', keyUci: 'g4g5', keySan: 'g5' },
  { num: 99, quizId: 'queen-11-27-26', live: '2026-11-27', dateLabel: 'November 27, 2026', sunday: false, winIn: 8, fen: '8/8/1k6/8/4P3/3K4/8/8 w - - 0 1', keyUci: 'd3d4', keySan: 'Kd4' },
  { num: 100, quizId: 'queen-11-28-26', live: '2026-11-28', dateLabel: 'November 28, 2026', sunday: false, winIn: 9, fen: '8/8/8/8/3P3k/8/6K1/8 w - - 0 1', keyUci: 'g2f3', keySan: 'Kf3' },
  { num: 101, quizId: 'queen-11-29-26', live: '2026-11-29', dateLabel: 'November 29, 2026', sunday: true, winIn: 12, fen: '1k6/8/8/8/5P2/8/8/3K4 w - - 0 1', keyUci: 'd1e2', keySan: 'Ke2' },
  { num: 102, quizId: 'queen-11-30-26', live: '2026-11-30', dateLabel: 'November 30, 2026', sunday: false, winIn: 5, fen: '8/4K3/8/8/4k2P/8/8/8 w - - 0 1', keyUci: 'e7f6', keySan: 'Kf6' },
];
