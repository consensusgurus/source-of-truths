// Puzzle data for Blocks, the daily falling-shapes game. Imported ONLY by the
// server page (app/blocks/page.js), which filters live<=today before handing the
// bank to the client.
//
// Blocks has no authored board: the day's SHAPE ORDER is generated in the client
// from a seed derived from `quizId`, so every player on a given day gets the
// same 6,000-shape sequence in the same order, and nothing about tomorrow leaks
// by shipping today's row. A row therefore carries only the frame:
//
//   cols  width of the well. 10 on a weekday, 8 on a Sunday Edition.
//   rows  height of the well. Always 16. Short by design: the drop rate never
//         changes, so the squeeze has to come from the ceiling, not the clock.
//   par   the day's BENCHMARK row count, not a ceiling. Rows are the score
//         (owner, 2026-08-08): it is the thing you actually do, every player
//         gets the same shapes to do it with, and unlike a points total it
//         cannot be padded by soft-dropping. The posted score is the raw row
//         count, UNCAPPED, and par is only the denominator daily-combined uses
//         for its completion ratio (it clamps at 1, so clearing above par is
//         safe and still separates players on placement). Clearing par wins the
//         end card. Sunday's par is lower because the narrower well ends runs
//         sooner.
//
//         RETUNED 2026-08-08, the same day, off the real field. The launch
//         numbers (100 weekday, 60 Sunday) came off a crude solver that clears
//         a median 237 rows, and no human is anywhere near that: of day one's
//         ten plays the longest run reached 65 shapes, and every single play
//         landed on 0 or 1 out of 10. 15 and 9 are a strong-but-reachable human
//         run. Revisit them once a fortnight of real scores exists, and expect
//         them to RISE as players learn the well, rather than to be right now.
//
//   resetAt  OPTIONAL ISO stamp. A ONE-TIME REPLAY GRANT: any run on this
//         puzzle that FINISHED before the stamp is dropped from the player's
//         browser (board, recorded-result guard and local stats row alike) so
//         the well opens fresh and they get their life back. Used once, on day
//         one, when the switch to row scoring meant the stored results could
//         not be rescaled (rows cleared were never stored) and had to be
//         cleared server-side; without this the six players who had already
//         posted would simply have lost the day, since Blocks is one life a
//         day and the saved board reads as finished. An in-progress run is
//         NEVER dropped: it has posted nothing yet and will post on the new
//         scale when it ends. Leave this field off every other puzzle.
//
// SUNDAY EDITION (owner, 2026-08-08): Sundays narrow the well from 10 to 8.
// Width is the right knob here because there is no speed curve to steepen, and
// two fewer columns makes every shape harder to seat, the plus most of all.
// `sunday` must be true if and only if `live` really is a Sunday; the flag is
// the ONLY source of truth for the badge (see lib/sunday-editions.js).
export const PUZZLES = [
  { num: 1, quizId: 'blocks-8-8-26', live: '2026-08-08', dateLabel: 'August 8, 2026', sunday: false, cols: 10, rows: 16, par: 15, resetAt: '2026-08-08T16:11:30Z' },
  { num: 2, quizId: 'blocks-8-9-26', live: '2026-08-09', dateLabel: 'August 9, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 3, quizId: 'blocks-8-10-26', live: '2026-08-10', dateLabel: 'August 10, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 4, quizId: 'blocks-8-11-26', live: '2026-08-11', dateLabel: 'August 11, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 5, quizId: 'blocks-8-12-26', live: '2026-08-12', dateLabel: 'August 12, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 6, quizId: 'blocks-8-13-26', live: '2026-08-13', dateLabel: 'August 13, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 7, quizId: 'blocks-8-14-26', live: '2026-08-14', dateLabel: 'August 14, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 8, quizId: 'blocks-8-15-26', live: '2026-08-15', dateLabel: 'August 15, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 9, quizId: 'blocks-8-16-26', live: '2026-08-16', dateLabel: 'August 16, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 10, quizId: 'blocks-8-17-26', live: '2026-08-17', dateLabel: 'August 17, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 11, quizId: 'blocks-8-18-26', live: '2026-08-18', dateLabel: 'August 18, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 12, quizId: 'blocks-8-19-26', live: '2026-08-19', dateLabel: 'August 19, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 13, quizId: 'blocks-8-20-26', live: '2026-08-20', dateLabel: 'August 20, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 14, quizId: 'blocks-8-21-26', live: '2026-08-21', dateLabel: 'August 21, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 15, quizId: 'blocks-8-22-26', live: '2026-08-22', dateLabel: 'August 22, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 16, quizId: 'blocks-8-23-26', live: '2026-08-23', dateLabel: 'August 23, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 17, quizId: 'blocks-8-24-26', live: '2026-08-24', dateLabel: 'August 24, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 18, quizId: 'blocks-8-25-26', live: '2026-08-25', dateLabel: 'August 25, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 19, quizId: 'blocks-8-26-26', live: '2026-08-26', dateLabel: 'August 26, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 20, quizId: 'blocks-8-27-26', live: '2026-08-27', dateLabel: 'August 27, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 21, quizId: 'blocks-8-28-26', live: '2026-08-28', dateLabel: 'August 28, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 22, quizId: 'blocks-8-29-26', live: '2026-08-29', dateLabel: 'August 29, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 23, quizId: 'blocks-8-30-26', live: '2026-08-30', dateLabel: 'August 30, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 24, quizId: 'blocks-8-31-26', live: '2026-08-31', dateLabel: 'August 31, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 25, quizId: 'blocks-9-1-26', live: '2026-09-01', dateLabel: 'September 1, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 26, quizId: 'blocks-9-2-26', live: '2026-09-02', dateLabel: 'September 2, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 27, quizId: 'blocks-9-3-26', live: '2026-09-03', dateLabel: 'September 3, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 28, quizId: 'blocks-9-4-26', live: '2026-09-04', dateLabel: 'September 4, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 29, quizId: 'blocks-9-5-26', live: '2026-09-05', dateLabel: 'September 5, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 30, quizId: 'blocks-9-6-26', live: '2026-09-06', dateLabel: 'September 6, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 31, quizId: 'blocks-9-7-26', live: '2026-09-07', dateLabel: 'September 7, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 32, quizId: 'blocks-9-8-26', live: '2026-09-08', dateLabel: 'September 8, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 33, quizId: 'blocks-9-9-26', live: '2026-09-09', dateLabel: 'September 9, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 34, quizId: 'blocks-9-10-26', live: '2026-09-10', dateLabel: 'September 10, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 35, quizId: 'blocks-9-11-26', live: '2026-09-11', dateLabel: 'September 11, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 36, quizId: 'blocks-9-12-26', live: '2026-09-12', dateLabel: 'September 12, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 37, quizId: 'blocks-9-13-26', live: '2026-09-13', dateLabel: 'September 13, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 38, quizId: 'blocks-9-14-26', live: '2026-09-14', dateLabel: 'September 14, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 39, quizId: 'blocks-9-15-26', live: '2026-09-15', dateLabel: 'September 15, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 40, quizId: 'blocks-9-16-26', live: '2026-09-16', dateLabel: 'September 16, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 41, quizId: 'blocks-9-17-26', live: '2026-09-17', dateLabel: 'September 17, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 42, quizId: 'blocks-9-18-26', live: '2026-09-18', dateLabel: 'September 18, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 43, quizId: 'blocks-9-19-26', live: '2026-09-19', dateLabel: 'September 19, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 44, quizId: 'blocks-9-20-26', live: '2026-09-20', dateLabel: 'September 20, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 45, quizId: 'blocks-9-21-26', live: '2026-09-21', dateLabel: 'September 21, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 46, quizId: 'blocks-9-22-26', live: '2026-09-22', dateLabel: 'September 22, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 47, quizId: 'blocks-9-23-26', live: '2026-09-23', dateLabel: 'September 23, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 48, quizId: 'blocks-9-24-26', live: '2026-09-24', dateLabel: 'September 24, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 49, quizId: 'blocks-9-25-26', live: '2026-09-25', dateLabel: 'September 25, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 50, quizId: 'blocks-9-26-26', live: '2026-09-26', dateLabel: 'September 26, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 51, quizId: 'blocks-9-27-26', live: '2026-09-27', dateLabel: 'September 27, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 52, quizId: 'blocks-9-28-26', live: '2026-09-28', dateLabel: 'September 28, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 53, quizId: 'blocks-9-29-26', live: '2026-09-29', dateLabel: 'September 29, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 54, quizId: 'blocks-9-30-26', live: '2026-09-30', dateLabel: 'September 30, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 55, quizId: 'blocks-10-1-26', live: '2026-10-01', dateLabel: 'October 1, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 56, quizId: 'blocks-10-2-26', live: '2026-10-02', dateLabel: 'October 2, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 57, quizId: 'blocks-10-3-26', live: '2026-10-03', dateLabel: 'October 3, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 58, quizId: 'blocks-10-4-26', live: '2026-10-04', dateLabel: 'October 4, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 59, quizId: 'blocks-10-5-26', live: '2026-10-05', dateLabel: 'October 5, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 60, quizId: 'blocks-10-6-26', live: '2026-10-06', dateLabel: 'October 6, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 61, quizId: 'blocks-10-7-26', live: '2026-10-07', dateLabel: 'October 7, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 62, quizId: 'blocks-10-8-26', live: '2026-10-08', dateLabel: 'October 8, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 63, quizId: 'blocks-10-9-26', live: '2026-10-09', dateLabel: 'October 9, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 64, quizId: 'blocks-10-10-26', live: '2026-10-10', dateLabel: 'October 10, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 65, quizId: 'blocks-10-11-26', live: '2026-10-11', dateLabel: 'October 11, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 66, quizId: 'blocks-10-12-26', live: '2026-10-12', dateLabel: 'October 12, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 67, quizId: 'blocks-10-13-26', live: '2026-10-13', dateLabel: 'October 13, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 68, quizId: 'blocks-10-14-26', live: '2026-10-14', dateLabel: 'October 14, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 69, quizId: 'blocks-10-15-26', live: '2026-10-15', dateLabel: 'October 15, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 70, quizId: 'blocks-10-16-26', live: '2026-10-16', dateLabel: 'October 16, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 71, quizId: 'blocks-10-17-26', live: '2026-10-17', dateLabel: 'October 17, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 72, quizId: 'blocks-10-18-26', live: '2026-10-18', dateLabel: 'October 18, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 73, quizId: 'blocks-10-19-26', live: '2026-10-19', dateLabel: 'October 19, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 74, quizId: 'blocks-10-20-26', live: '2026-10-20', dateLabel: 'October 20, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 75, quizId: 'blocks-10-21-26', live: '2026-10-21', dateLabel: 'October 21, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 76, quizId: 'blocks-10-22-26', live: '2026-10-22', dateLabel: 'October 22, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 77, quizId: 'blocks-10-23-26', live: '2026-10-23', dateLabel: 'October 23, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 78, quizId: 'blocks-10-24-26', live: '2026-10-24', dateLabel: 'October 24, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 79, quizId: 'blocks-10-25-26', live: '2026-10-25', dateLabel: 'October 25, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 80, quizId: 'blocks-10-26-26', live: '2026-10-26', dateLabel: 'October 26, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 81, quizId: 'blocks-10-27-26', live: '2026-10-27', dateLabel: 'October 27, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 82, quizId: 'blocks-10-28-26', live: '2026-10-28', dateLabel: 'October 28, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 83, quizId: 'blocks-10-29-26', live: '2026-10-29', dateLabel: 'October 29, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 84, quizId: 'blocks-10-30-26', live: '2026-10-30', dateLabel: 'October 30, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 85, quizId: 'blocks-10-31-26', live: '2026-10-31', dateLabel: 'October 31, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 86, quizId: 'blocks-11-1-26', live: '2026-11-01', dateLabel: 'November 1, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 87, quizId: 'blocks-11-2-26', live: '2026-11-02', dateLabel: 'November 2, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 88, quizId: 'blocks-11-3-26', live: '2026-11-03', dateLabel: 'November 3, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 89, quizId: 'blocks-11-4-26', live: '2026-11-04', dateLabel: 'November 4, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 90, quizId: 'blocks-11-5-26', live: '2026-11-05', dateLabel: 'November 5, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 91, quizId: 'blocks-11-6-26', live: '2026-11-06', dateLabel: 'November 6, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 92, quizId: 'blocks-11-7-26', live: '2026-11-07', dateLabel: 'November 7, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 93, quizId: 'blocks-11-8-26', live: '2026-11-08', dateLabel: 'November 8, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 94, quizId: 'blocks-11-9-26', live: '2026-11-09', dateLabel: 'November 9, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 95, quizId: 'blocks-11-10-26', live: '2026-11-10', dateLabel: 'November 10, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 96, quizId: 'blocks-11-11-26', live: '2026-11-11', dateLabel: 'November 11, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 97, quizId: 'blocks-11-12-26', live: '2026-11-12', dateLabel: 'November 12, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 98, quizId: 'blocks-11-13-26', live: '2026-11-13', dateLabel: 'November 13, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 99, quizId: 'blocks-11-14-26', live: '2026-11-14', dateLabel: 'November 14, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 100, quizId: 'blocks-11-15-26', live: '2026-11-15', dateLabel: 'November 15, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 101, quizId: 'blocks-11-16-26', live: '2026-11-16', dateLabel: 'November 16, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 102, quizId: 'blocks-11-17-26', live: '2026-11-17', dateLabel: 'November 17, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 103, quizId: 'blocks-11-18-26', live: '2026-11-18', dateLabel: 'November 18, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 104, quizId: 'blocks-11-19-26', live: '2026-11-19', dateLabel: 'November 19, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 105, quizId: 'blocks-11-20-26', live: '2026-11-20', dateLabel: 'November 20, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 106, quizId: 'blocks-11-21-26', live: '2026-11-21', dateLabel: 'November 21, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 107, quizId: 'blocks-11-22-26', live: '2026-11-22', dateLabel: 'November 22, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 108, quizId: 'blocks-11-23-26', live: '2026-11-23', dateLabel: 'November 23, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 109, quizId: 'blocks-11-24-26', live: '2026-11-24', dateLabel: 'November 24, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 110, quizId: 'blocks-11-25-26', live: '2026-11-25', dateLabel: 'November 25, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 111, quizId: 'blocks-11-26-26', live: '2026-11-26', dateLabel: 'November 26, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 112, quizId: 'blocks-11-27-26', live: '2026-11-27', dateLabel: 'November 27, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 113, quizId: 'blocks-11-28-26', live: '2026-11-28', dateLabel: 'November 28, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
  { num: 114, quizId: 'blocks-11-29-26', live: '2026-11-29', dateLabel: 'November 29, 2026', sunday: true, cols: 8, rows: 16, par: 9 },
  { num: 115, quizId: 'blocks-11-30-26', live: '2026-11-30', dateLabel: 'November 30, 2026', sunday: false, cols: 10, rows: 16, par: 15 },
];
