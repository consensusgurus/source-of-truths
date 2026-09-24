// Puzzle data for Chomp, the daily route puzzle. Imported ONLY by the server
// page (app/chomp/page.js), which filters live<=today before handing the bank to
// the client, and by the daily API routes that need the day's row.
//
// TWO RULES CARRY THE GAME:
//
//   1. The body NEVER retracts. Every square the head touches belongs to it for
//      the rest of the run, so the trail is a permanent wall.
//   2. A mascot is SOLID until its turn. You cannot cross the tiger on the way to
//      the gamecock. That follows from rule 1: with a permanent trail, crossing
//      one early would leave it stranded under your own body forever, and a
//      visible wall is fairer than a board ruined twenty moves before anyone
//      notices.
//
// YOU DO NOT HAVE TO EAT THEM ALL. The score is how far down the cast you got,
// so a run that stalls on the fifth still counts for five.
//
// ⚠️ REBUILT 2026-08-11, THE THIRD DIFFICULTY REBUILD, AND IT REVERSES THE
// SECOND. The owner cleared the first board of the previous bank first try,
// having barely thought about it. Read this before touching the generator,
// because the previous two rebuilds each made the boards MEASURABLY harder and
// PLAYABLY easier, and the reason is not obvious.
//
// WHAT WENT WRONG. Coverage was the dial: the sum of the mascots' Manhattan
// separations is a proven lower bound on any route, so a high sum forces the
// player to fill the board, and the generator MAXIMISED it. That works, and it
// is precisely what made the boards trivial. Maximising leg length puts
// consecutive mascots in OPPOSITE CORNERS, and a long hop across open board is a
// corridor, not a decision: there is one obvious way to walk it and you walk it.
// Measured across the 67 boards this replaces:
//
//   longest leg   mean 10.2, out of a possible 12 on a 7x7
//   detour        min - floor was ZERO on 60 of 67 boards, so not one square
//                 anywhere on the bank ever required walking AWAY from a mascot
//   rim           half of every route ran along the outside edge
//   shape         mascots on a ring, route a lap around it, 3.1 squares per
//                 straight run
//
// The board the owner rejected had SEVEN optimal routes and 117 winning routes
// in total. That is not hard, it is a single visible snake you trace.
//
// WHY THE CHECKER NEVER SAW IT. Every gate, in all three rounds, asked "can this
// bot finish". Twelve player models have now been written against these boards
// (myopic lines, careful greedy, a 300- and a 2000-wide beam, wall-hugging
// sweepers, straight-preferring reflex players, one and two mascots of lookahead)
// and they clear the rejected bank roughly 0% of the time. A BOT IS NOT THE THING
// THE BOARD IS SHOWN TO. A model optimises the next square; a person sees a 7x7
// grid whole and reads the route off it before moving. Do not write a thirteenth.
//
// THE INVERSION. Difficulty now comes from mascots that are CLOSE TOGETHER and
// hard to get between, not far apart and easy:
//
//   longest leg  <= 6, and the leg BAND is targeted rather than capped, because
//                under a cap the generator drives the distance to its minimum,
//                the floor collapses and the board ends up 60% untouched, which
//                is loose in a new way rather than hard.
//   detour       >= 4 EVERYWHERE. This is the real dial: moves the optimum must
//                spend above the Manhattan bound, i.e. squares where the only way
//                to your target is away from it. It shipped at >= 2 first and the
//                owner played it and said it still looked easy, correctly: 2 on a
//                41-move route is about 5% of the board asking anything of you.
//                It is 4 and not 5 because 5 was MEASURED as unreachable at
//                Saturday's rung, and a band nobody can hit is not a stricter
//                gate, it is a build that starves and gets quietly relaxed.
//   turn density <= 2.4 squares per straight run, measured on the TIDIEST of all
//                shortest routes, never on whichever one the solver returned
//                first. A board can hold both a tangled optimum and a straight
//                one and the player walks whichever they find; gating on an
//                arbitrary route let three boards through at 3.0+ during this
//                very rebuild.
//   coverage     still forced, but by the NUMBER of legs rather than their
//                length. Ten short legs reach the same floor as six long ones.
//
// THE CAST IS THE RAMP, 8 on Monday to 11 on Sunday (Friday is 9, not 10: at cast
// 10 with spare 4-5 the rung is empty, because spare 4-5 means min 43-44, detour 4
// means floor <= 39-40, and ten legs cannot be that short without the optimum
// collapsing back onto the floor. Saturday is TIGHTER and easier to satisfy, since
// a higher min leaves more room above the floor), which is what the knight,
// smokey and the bull were drawn for (owner, 2026-08-11: "you can build a golden
// knight, another dog named smokey, a bull"). More mascots is more legs, more
// solid obstacles, and more of the board consumed. Spare squares still fall
// through the week and every band is at or BELOW the bank this replaces: a first
// pass put Monday at 12 spare against the old 9 and was thrown away rather than
// shipped, because loosening the one dial the owner had already signed off on
// while claiming to be harder is asking to be taken on trust.
//
// Boards are still built BACKWARDS from a self-avoiding walk with the mascots
// hung on it in walk order, so solvability is by construction. The waypoints are
// now chosen to maximise walk distance MINUS Manhattan distance, which is the
// detour, instead of maximising Manhattan distance, which was the corridor.
//
// Bands were MEASURED against what the generator can reach before being written
// down. Round one wrote bands about twenty points under the ceiling and that is
// how a Monday came to hand out twenty-four free squares.
//
// Fields, all re-derived by scripts/verify-chomp.mjs rather than trusted:
//
//   w, h      7 and 7 from 2026-08-11. The first three boards are live history
//             and keep the sizes they shipped on.
//   cast      the mascots in EATING ORDER; cast[i] sits on pellets[i]. Only the
//             BULLDOG is fixed, always first, so every run opens the same way.
//   floor     the Manhattan leg sum, a proven lower bound on any legal route.
//   min       the TRUE optimum, found by exhaustive search. min - floor is the
//             detour, and it is the number that matters most on this bank.
//   walls     bleacher cells, [x, y], from 2026-08-22. The head can never
//             enter one. Absent on every earlier board.
//
// SUNDAY EDITION: the whole cast of eleven, 0-2 spare squares. `sunday` must be
// true if and only if `live` really is a Sunday; the flag is the ONLY source of
// truth for the badge.
//
// ⚠️ BLEACHERS ERA, 2026-08-22 (the fourth rebuild, owner: "make this harder
// however you see fit - maybe introduce a barrier of some sort?"). Every board
// from that date carries `walls`: 5-7 bolted-down squares the head can NEVER
// enter, drawn as bleachers. Boards live on or before 2026-08-21 are played
// history, carry no walls, and keep their old gates.
//
// WHY WALLS, measured before writing a single band: on an OPEN 7x7 a detour
// floor of 5 was UNREACHABLE at Saturday's rung (that is why the old floor was
// 4), and the live solve data still ran 59% perfect with a 25-second median,
// i.e. the route was readable at a glance. Bleachers break the straight
// corridor structurally: going around one forces walking AWAY from the mascot
// you are chasing, and choosing the wrong side of it strands a later mascot.
// A 20-second measurement sweep per rung showed detour 8-18 reachable AT EVERY
// RUNG with walls in play, so the bands moved to the measured edge:
//
//   detour   >= 8 on every day of the week, DOUBLE the open-board bank's 4.
//            The banked boards run 8-20.
//   wall bite >= 2: recompute the optimum with the walls deleted, and the
//            walls must account for at least 2 of the detour. A wall set no
//            route ever feels is decoration, and decoration is banned.
//   turn density and max leg unchanged (<= 2.4 per straight run on the
//            TIDIEST optimum, legs <= 6).
//   spare    the shipped ramp bands, unchanged in NUMBER, but now measured
//            against PLAYABLE squares (49 minus the walls), so the same spare
//            is relatively tighter than the open-board era.
//   fill     fillOf in lib/chomp-engine.js divides by playable squares too.
//
// The generator (scripts/gen-chomp.mjs + scripts/bank-chomp.mjs) still builds
// backwards from a self-avoiding walk over the PLAYABLE cells, so solvability
// is by construction, then measures everything exactly and gates on the
// measurements. scripts/verify-chomp.mjs re-proves all of it era-aware.

export const MASCOTS = ["bulldog","ibis","gamecock","tiger","eagle","longhorn","wildcat","seminole","knight","smokey","bull"];

export const PUZZLES = [
  { num: 1, quizId: 'chomp-8-8-26', live: '2026-08-08', dateLabel: 'August 8, 2026', sunday: false, w: 13, h: 13, start: [9,10], floor: 52, min: 52,
    cast: ['bulldog', 'tiger', 'gamecock', 'ibis', 'seminole', 'longhorn'],
    pellets: [[12,7], [0,0], [6,0], [1,2], [7,4], [3,2]] },
  { num: 2, quizId: 'chomp-8-9-26', live: '2026-08-09', dateLabel: 'August 9, 2026', sunday: true, w: 9, h: 9, start: [8,8], floor: 36, min: 36,
    cast: ['bulldog', 'ibis', 'longhorn', 'wildcat', 'seminole', 'tiger', 'gamecock', 'eagle'],
    pellets: [[3,7], [0,0], [4,1], [1,1], [2,3], [4,2], [6,3], [7,5]] },
  { num: 3, quizId: 'chomp-8-10-26', live: '2026-08-10', dateLabel: 'August 10, 2026', sunday: false, w: 8, h: 8, start: [7,5], floor: 37, min: 39,
    cast: ['bulldog', 'ibis', 'eagle', 'longhorn', 'gamecock', 'wildcat'],
    pellets: [[1,0], [2,7], [1,6], [3,1], [4,5], [6,7]] },
  { num: 4, quizId: 'chomp-8-11-26', live: '2026-08-11', dateLabel: 'August 11, 2026', sunday: false, w: 7, h: 7, start: [1,3], floor: 40, min: 40,
    cast: ['bulldog', 'ibis', 'wildcat', 'longhorn', 'eagle', 'tiger'],
    pellets: [[0,6], [3,2], [4,4], [0,0], [5,6], [6,0]] },
  { num: 5, quizId: 'chomp-8-12-26', live: '2026-08-12', dateLabel: 'August 12, 2026', sunday: false, w: 7, h: 7, start: [5,4], floor: 38, min: 42,
    cast: ['bulldog', 'ibis', 'longhorn', 'tiger', 'smokey', 'wildcat', 'bull', 'knight', 'gamecock'],
    pellets: [[6,1], [4,3], [3,0], [0,1], [3,2], [1,5], [3,3], [6,5], [2,5]] },
  { num: 6, quizId: 'chomp-8-13-26', live: '2026-08-13', dateLabel: 'August 13, 2026', sunday: false, w: 7, h: 7, start: [3,3], floor: 38, min: 42,
    cast: ['bulldog', 'eagle', 'ibis', 'gamecock', 'seminole', 'knight', 'tiger', 'longhorn', 'smokey'],
    pellets: [[2,6], [1,3], [0,6], [4,4], [6,6], [5,3], [6,0], [3,1], [0,0]] },
  { num: 7, quizId: 'chomp-8-14-26', live: '2026-08-14', dateLabel: 'August 14, 2026', sunday: false, w: 7, h: 7, start: [5,2], floor: 38, min: 44,
    cast: ['bulldog', 'longhorn', 'smokey', 'tiger', 'seminole', 'knight', 'bull', 'gamecock', 'ibis'],
    pellets: [[5,6], [4,3], [3,6], [0,5], [3,4], [1,1], [3,3], [6,1], [2,1]] },
  { num: 8, quizId: 'chomp-8-15-26', live: '2026-08-15', dateLabel: 'August 15, 2026', sunday: false, w: 7, h: 7, start: [2,5], floor: 40, min: 44,
    cast: ['bulldog', 'ibis', 'gamecock', 'tiger', 'eagle', 'seminole', 'wildcat', 'knight', 'smokey', 'longhorn'],
    pellets: [[6,5], [3,4], [6,3], [5,0], [4,3], [3,0], [0,1], [2,3], [1,6], [1,2]] },
  { num: 9, quizId: 'chomp-8-16-26', live: '2026-08-16', dateLabel: 'August 16, 2026', sunday: true, w: 7, h: 7, start: [1,3], floor: 42, min: 46,
    cast: ['bulldog', 'ibis', 'wildcat', 'tiger', 'seminole', 'longhorn', 'eagle', 'smokey', 'gamecock', 'knight', 'bull'],
    pellets: [[1,6], [1,2], [0,0], [2,1], [6,0], [6,4], [4,6], [2,5], [5,4], [3,1], [4,4]] },
  { num: 10, quizId: 'chomp-8-17-26', live: '2026-08-17', dateLabel: 'August 17, 2026', sunday: false, w: 7, h: 7, start: [6,5], floor: 33, min: 37,
    cast: ['bulldog', 'tiger', 'wildcat', 'longhorn', 'eagle', 'ibis', 'smokey', 'bull'],
    pellets: [[3,6], [5,4], [5,0], [4,3], [1,1], [3,3], [0,2], [1,5]] },
  { num: 11, quizId: 'chomp-8-18-26', live: '2026-08-18', dateLabel: 'August 18, 2026', sunday: false, w: 7, h: 7, start: [6,5], floor: 37, min: 41,
    cast: ['bulldog', 'wildcat', 'seminole', 'ibis', 'eagle', 'gamecock', 'bull', 'tiger'],
    pellets: [[0,5], [4,5], [6,3], [0,3], [3,2], [0,0], [3,1], [6,0]] },
  { num: 12, quizId: 'chomp-8-19-26', live: '2026-08-19', dateLabel: 'August 19, 2026', sunday: false, w: 7, h: 7, start: [1,2], floor: 37, min: 41,
    cast: ['bulldog', 'seminole', 'smokey', 'wildcat', 'tiger', 'bull', 'longhorn', 'knight', 'ibis'],
    pellets: [[1,6], [2,3], [0,1], [3,2], [2,5], [5,6], [4,3], [6,0], [5,3]] },
  { num: 13, quizId: 'chomp-8-20-26', live: '2026-08-20', dateLabel: 'August 20, 2026', sunday: false, w: 7, h: 7, start: [3,3], floor: 38, min: 42,
    cast: ['bulldog', 'bull', 'knight', 'wildcat', 'longhorn', 'smokey', 'gamecock', 'tiger', 'seminole'],
    pellets: [[6,4], [3,5], [6,6], [4,2], [6,0], [3,1], [0,0], [1,3], [0,6]] },
  { num: 14, quizId: 'chomp-8-21-26', live: '2026-08-21', dateLabel: 'August 21, 2026', sunday: false, w: 7, h: 7, start: [4,1], floor: 39, min: 43,
    cast: ['bulldog', 'gamecock', 'bull', 'longhorn', 'wildcat', 'knight', 'seminole', 'ibis', 'smokey'],
    pellets: [[0,2], [0,6], [1,3], [3,1], [3,6], [4,2], [6,0], [5,3], [4,6]] },
  { num: 15, quizId: 'chomp-8-22-26', live: '2026-08-22', dateLabel: 'August 22, 2026', sunday: false, w: 7, h: 7, start: [2,2], floor: 22, min: 38, walls: [[3,5], [5,3], [6,6], [5,6], [5,2], [4,4], [2,3]],
    cast: ['bulldog', 'seminole', 'gamecock', 'ibis', 'tiger', 'smokey', 'knight', 'wildcat', 'eagle', 'bull'],
    pellets: [[1,1], [1,3], [1,5], [2,4], [3,3], [4,2], [3,1], [4,0], [5,1], [2,0]] },
  { num: 16, quizId: 'chomp-8-23-26', live: '2026-08-23', dateLabel: 'August 23, 2026', sunday: true, w: 7, h: 7, start: [5,2], floor: 27, min: 39, walls: [[3,3], [4,1], [2,1], [5,5], [5,1], [4,5], [3,1]],
    cast: ['bulldog', 'bull', 'ibis', 'smokey', 'eagle', 'seminole', 'longhorn', 'knight', 'tiger', 'gamecock', 'wildcat'],
    pellets: [[5,4], [4,3], [3,2], [2,3], [1,2], [0,3], [1,5], [0,6], [2,6], [2,4], [0,0]] },
  { num: 17, quizId: 'chomp-8-24-26', live: '2026-08-24', dateLabel: 'August 24, 2026', sunday: false, w: 7, h: 7, start: [4,4], floor: 20, min: 30, walls: [[2,4], [1,3], [5,2], [1,2], [1,6], [1,4], [3,4]],
    cast: ['bulldog', 'gamecock', 'smokey', 'knight', 'ibis', 'eagle', 'bull', 'wildcat'],
    pellets: [[5,5], [5,3], [6,2], [5,1], [4,2], [3,3], [2,2], [6,4]] },
  { num: 18, quizId: 'chomp-8-25-26', live: '2026-08-25', dateLabel: 'August 25, 2026', sunday: false, w: 7, h: 7, start: [5,0], floor: 23, min: 35, walls: [[4,2], [5,4], [6,6], [4,5], [2,4]],
    cast: ['bulldog', 'wildcat', 'eagle', 'ibis', 'knight', 'longhorn', 'tiger', 'bull'],
    pellets: [[4,1], [3,0], [2,1], [1,2], [1,4], [4,4], [6,2], [1,1]] },
  { num: 19, quizId: 'chomp-8-26-26', live: '2026-08-26', dateLabel: 'August 26, 2026', sunday: false, w: 7, h: 7, start: [2,3], floor: 22, min: 36, walls: [[2,2], [1,6], [6,3], [0,1], [3,1], [4,1]],
    cast: ['bulldog', 'ibis', 'gamecock', 'knight', 'wildcat', 'longhorn', 'eagle', 'bull', 'smokey'],
    pellets: [[1,4], [3,4], [5,5], [5,3], [3,3], [4,2], [5,1], [6,0], [6,5]] },
  { num: 20, quizId: 'chomp-8-27-26', live: '2026-08-27', dateLabel: 'August 27, 2026', sunday: false, w: 7, h: 7, start: [4,3], floor: 23, min: 35, walls: [[0,5], [2,2], [5,0], [0,1], [2,1], [4,5], [0,6]],
    cast: ['bulldog', 'eagle', 'tiger', 'longhorn', 'bull', 'gamecock', 'seminole', 'wildcat', 'smokey'],
    pellets: [[5,4], [5,2], [3,2], [2,3], [1,4], [2,6], [2,4], [3,5], [0,2]] },
  { num: 21, quizId: 'chomp-8-28-26', live: '2026-08-28', dateLabel: 'August 28, 2026', sunday: false, w: 7, h: 7, start: [2,1], floor: 22, min: 36, walls: [[3,1], [4,5], [1,3], [1,1], [6,4], [4,2], [6,3]],
    cast: ['bulldog', 'eagle', 'ibis', 'smokey', 'tiger', 'knight', 'wildcat', 'seminole', 'longhorn'],
    pellets: [[3,2], [2,3], [1,4], [2,5], [3,4], [4,3], [5,4], [6,6], [6,1]] },
  { num: 22, quizId: 'chomp-8-29-26', live: '2026-08-29', dateLabel: 'August 29, 2026', sunday: false, w: 7, h: 7, start: [4,2], floor: 23, min: 39, walls: [[3,5], [3,2], [5,5], [4,5], [5,1]],
    cast: ['bulldog', 'longhorn', 'bull', 'ibis', 'seminole', 'knight', 'gamecock', 'wildcat', 'tiger', 'eagle'],
    pellets: [[5,3], [6,2], [6,0], [4,0], [3,1], [2,2], [1,3], [1,5], [2,3], [1,0]] },
  { num: 23, quizId: 'chomp-8-30-26', live: '2026-08-30', dateLabel: 'August 30, 2026', sunday: true, w: 7, h: 7, start: [4,4], floor: 25, min: 39, walls: [[5,4], [2,5], [1,3], [0,5], [5,1], [6,6], [2,4]],
    cast: ['bulldog', 'knight', 'gamecock', 'seminole', 'tiger', 'smokey', 'wildcat', 'ibis', 'longhorn', 'bull', 'eagle'],
    pellets: [[3,5], [3,3], [2,2], [1,1], [3,1], [4,2], [4,0], [6,0], [6,2], [5,3], [3,0]] },
  { num: 24, quizId: 'chomp-8-31-26', live: '2026-08-31', dateLabel: 'August 31, 2026', sunday: false, w: 7, h: 7, start: [4,2], floor: 18, min: 32, walls: [[2,5], [2,6], [5,2], [3,1], [6,5], [5,3]],
    cast: ['bulldog', 'seminole', 'bull', 'longhorn', 'knight', 'tiger', 'smokey', 'gamecock'],
    pellets: [[3,3], [2,2], [1,1], [1,3], [2,4], [1,5], [0,4], [3,5]] },
  { num: 25, quizId: 'chomp-9-1-26', live: '2026-09-01', dateLabel: 'September 1, 2026', sunday: false, w: 7, h: 7, start: [1,1], floor: 38, min: 48,
    cast: ['bulldog', 'eagle', 'seminole', 'tiger', 'wildcat', 'ibis', 'knight', 'longhorn', 'gamecock', 'bull'],
    pellets: [[0,0], [2,2], [6,6], [3,2], [4,2], [0,3], [3,6], [2,5], [0,5], [1,5]] },
  { num: 26, quizId: 'chomp-9-2-26', live: '2026-09-02', dateLabel: 'September 2, 2026', sunday: false, w: 7, h: 7, start: [0,0], floor: 32, min: 48,
    cast: ['bulldog', 'ibis', 'eagle', 'knight', 'longhorn', 'bull', 'gamecock', 'wildcat', 'tiger'],
    pellets: [[6,0], [5,4], [1,4], [4,0], [4,3], [2,3], [3,3], [2,1], [3,1]] },
  { num: 27, quizId: 'chomp-9-3-26', live: '2026-09-03', dateLabel: 'September 3, 2026', sunday: false, w: 7, h: 7, start: [2,6], floor: 36, min: 48,
    cast: ['bulldog', 'bull', 'smokey', 'longhorn', 'seminole', 'knight', 'wildcat', 'tiger', 'ibis'],
    pellets: [[6,1], [1,2], [3,6], [5,3], [4,4], [3,3], [1,4], [2,4], [1,5]] },
  { num: 28, quizId: 'chomp-9-4-26', live: '2026-09-04', dateLabel: 'September 4, 2026', sunday: false, w: 7, h: 7, start: [1,5], floor: 32, min: 48,
    cast: ['bulldog', 'tiger', 'longhorn', 'gamecock', 'smokey', 'eagle', 'bull', 'seminole', 'ibis'],
    pellets: [[0,6], [5,6], [2,1], [1,2], [4,3], [2,6], [3,5], [1,4], [2,4]] },
  { num: 29, quizId: 'chomp-9-5-26', live: '2026-09-05', dateLabel: 'September 5, 2026', sunday: false, w: 7, h: 7, start: [2,0], floor: 38, min: 48,
    cast: ['bulldog', 'ibis', 'eagle', 'tiger', 'bull', 'seminole', 'knight', 'longhorn'],
    pellets: [[6,1], [1,0], [0,6], [2,2], [6,2], [3,4], [4,2], [3,3]] },
  { num: 30, quizId: 'chomp-9-6-26', live: '2026-09-06', dateLabel: 'September 6, 2026', sunday: true, w: 8, h: 8, start: [3,7], floor: 53, min: 63,
    cast: ['bulldog', 'ibis', 'seminole', 'wildcat', 'tiger', 'bull', 'gamecock', 'smokey', 'knight', 'longhorn', 'eagle'],
    pellets: [[4,7], [0,1], [2,7], [1,4], [2,1], [6,6], [4,4], [4,1], [6,4], [6,1], [5,2]] },
  { num: 31, quizId: 'chomp-9-7-26', live: '2026-09-07', dateLabel: 'September 7, 2026', sunday: false, w: 7, h: 7, start: [0,2], floor: 38, min: 48,
    cast: ['bulldog', 'ibis', 'eagle', 'tiger', 'gamecock', 'seminole', 'smokey', 'knight', 'wildcat', 'bull'],
    pellets: [[1,6], [0,1], [6,2], [2,1], [5,2], [3,3], [5,3], [4,5], [3,4], [3,5]] },
  { num: 32, quizId: 'chomp-9-8-26', live: '2026-09-08', dateLabel: 'September 8, 2026', sunday: false, w: 7, h: 7, start: [0,0], floor: 44, min: 48,
    cast: ['bulldog', 'tiger', 'knight', 'longhorn', 'smokey', 'wildcat', 'gamecock', 'eagle', 'bull', 'seminole'],
    pellets: [[6,6], [1,5], [1,4], [6,3], [2,0], [2,2], [3,0], [5,2], [5,1], [4,2]] },
  { num: 33, quizId: 'chomp-9-9-26', live: '2026-09-09', dateLabel: 'September 9, 2026', sunday: false, w: 7, h: 7, start: [2,2], floor: 38, min: 48,
    cast: ['bulldog', 'tiger', 'gamecock', 'longhorn', 'ibis', 'wildcat', 'smokey', 'bull', 'seminole'],
    pellets: [[3,2], [0,4], [5,0], [4,5], [1,4], [4,0], [3,1], [1,2], [1,1]] },
  { num: 34, quizId: 'chomp-9-10-26', live: '2026-09-10', dateLabel: 'September 10, 2026', sunday: false, w: 7, h: 7, start: [5,5], floor: 28, min: 48,
    cast: ['bulldog', 'knight', 'wildcat', 'smokey', 'gamecock', 'bull', 'longhorn', 'eagle', 'seminole'],
    pellets: [[5,6], [2,6], [4,6], [1,4], [5,4], [1,1], [2,2], [5,2], [4,2]] },
  { num: 35, quizId: 'chomp-9-11-26', live: '2026-09-11', dateLabel: 'September 11, 2026', sunday: false, w: 7, h: 7, start: [0,2], floor: 36, min: 48,
    cast: ['bulldog', 'eagle', 'bull', 'wildcat', 'smokey', 'knight', 'gamecock', 'ibis', 'seminole'],
    pellets: [[6,4], [5,0], [3,5], [1,5], [0,0], [1,1], [2,1], [1,3], [2,2]] },
  { num: 36, quizId: 'chomp-9-12-26', live: '2026-09-12', dateLabel: 'September 12, 2026', sunday: false, w: 7, h: 7, start: [0,6], floor: 42, min: 48,
    cast: ['bulldog', 'knight', 'bull', 'ibis', 'gamecock', 'eagle', 'seminole', 'smokey'],
    pellets: [[1,6], [6,0], [1,5], [4,1], [2,5], [3,2], [3,4], [3,3]] },
  { num: 37, quizId: 'chomp-9-13-26', live: '2026-09-13', dateLabel: 'September 13, 2026', sunday: true, w: 8, h: 8, start: [1,3], floor: 47, min: 63,
    cast: ['bulldog', 'eagle', 'gamecock', 'knight', 'bull', 'smokey', 'ibis', 'tiger', 'wildcat', 'seminole', 'longhorn'],
    pellets: [[2,0], [7,0], [1,1], [7,2], [4,3], [2,4], [6,4], [1,5], [3,4], [4,5], [5,4]] },
  { num: 38, quizId: 'chomp-9-14-26', live: '2026-09-14', dateLabel: 'September 14, 2026', sunday: false, w: 7, h: 7, start: [5,1], floor: 36, min: 48,
    cast: ['bulldog', 'gamecock', 'wildcat', 'bull', 'seminole', 'longhorn', 'ibis', 'knight', 'smokey', 'tiger'],
    pellets: [[5,0], [0,6], [4,5], [5,4], [4,1], [1,3], [2,2], [3,3], [4,2], [5,3]] },
  { num: 39, quizId: 'chomp-9-15-26', live: '2026-09-15', dateLabel: 'September 15, 2026', sunday: false, w: 7, h: 7, start: [3,3], floor: 28, min: 48,
    cast: ['bulldog', 'longhorn', 'gamecock', 'smokey', 'wildcat', 'seminole', 'knight', 'ibis', 'eagle', 'bull'],
    pellets: [[2,3], [0,3], [6,1], [6,2], [1,3], [1,5], [3,4], [3,5], [5,4], [5,5]] },
  { num: 40, quizId: 'chomp-9-16-26', live: '2026-09-16', dateLabel: 'September 16, 2026', sunday: false, w: 7, h: 7, start: [3,5], floor: 34, min: 48,
    cast: ['bulldog', 'longhorn', 'bull', 'seminole', 'tiger', 'wildcat', 'smokey', 'knight', 'eagle'],
    pellets: [[0,1], [4,5], [4,2], [0,6], [0,5], [1,5], [1,2], [1,3], [2,2]] },
  { num: 41, quizId: 'chomp-9-17-26', live: '2026-09-17', dateLabel: 'September 17, 2026', sunday: false, w: 7, h: 7, start: [5,1], floor: 42, min: 48,
    cast: ['bulldog', 'smokey', 'bull', 'wildcat', 'knight', 'tiger', 'gamecock', 'ibis', 'longhorn'],
    pellets: [[6,0], [1,6], [1,1], [2,6], [4,1], [4,6], [5,4], [4,4], [5,3]] },
  { num: 42, quizId: 'chomp-9-18-26', live: '2026-09-18', dateLabel: 'September 18, 2026', sunday: false, w: 7, h: 7, start: [0,2], floor: 44, min: 48,
    cast: ['bulldog', 'gamecock', 'longhorn', 'eagle', 'ibis', 'wildcat', 'bull', 'tiger', 'knight'],
    pellets: [[0,0], [3,6], [6,0], [3,5], [1,4], [4,0], [2,1], [2,3], [2,2]] },
  { num: 43, quizId: 'chomp-9-19-26', live: '2026-09-19', dateLabel: 'September 19, 2026', sunday: false, w: 7, h: 7, start: [4,6], floor: 42, min: 48,
    cast: ['bulldog', 'gamecock', 'eagle', 'wildcat', 'ibis', 'longhorn', 'seminole', 'bull'],
    pellets: [[5,0], [4,5], [0,1], [3,2], [0,6], [3,3], [3,6], [3,5]] },
  { num: 44, quizId: 'chomp-9-20-26', live: '2026-09-20', dateLabel: 'September 20, 2026', sunday: true, w: 8, h: 8, start: [0,3], floor: 43, min: 63,
    cast: ['bulldog', 'gamecock', 'tiger', 'ibis', 'eagle', 'bull', 'longhorn', 'knight', 'wildcat', 'seminole', 'smokey'],
    pellets: [[0,7], [2,6], [6,1], [4,5], [4,1], [3,4], [0,5], [2,3], [1,3], [2,2], [1,1]] },
  { num: 45, quizId: 'chomp-9-21-26', live: '2026-09-21', dateLabel: 'September 21, 2026', sunday: false, w: 7, h: 7, start: [6,0], floor: 36, min: 48,
    cast: ['bulldog', 'seminole', 'bull', 'ibis', 'tiger', 'wildcat', 'longhorn', 'eagle', 'smokey', 'gamecock'],
    pellets: [[5,6], [5,5], [5,1], [5,0], [0,1], [4,1], [1,5], [2,4], [2,1], [2,2]] },
  { num: 46, quizId: 'chomp-9-22-26', live: '2026-09-22', dateLabel: 'September 22, 2026', sunday: false, w: 7, h: 7, start: [6,4], floor: 42, min: 48,
    cast: ['bulldog', 'eagle', 'gamecock', 'wildcat', 'tiger', 'longhorn', 'ibis', 'knight', 'smokey', 'bull'],
    pellets: [[6,0], [5,4], [0,0], [3,1], [4,6], [6,5], [3,5], [1,3], [2,5], [2,4]] },
  { num: 47, quizId: 'chomp-9-23-26', live: '2026-09-23', dateLabel: 'September 23, 2026', sunday: false, w: 7, h: 7, start: [6,0], floor: 34, min: 48,
    cast: ['bulldog', 'bull', 'gamecock', 'tiger', 'smokey', 'seminole', 'eagle', 'wildcat', 'knight'],
    pellets: [[6,6], [1,6], [2,1], [4,6], [3,5], [4,3], [3,2], [4,1], [3,1]] },
  { num: 48, quizId: 'chomp-9-24-26', live: '2026-09-24', dateLabel: 'September 24, 2026', sunday: false, w: 7, h: 7, start: [6,0], floor: 42, min: 48,
    cast: ['bulldog', 'tiger', 'eagle', 'longhorn', 'gamecock', 'ibis', 'seminole', 'smokey', 'knight'],
    pellets: [[0,5], [5,4], [0,4], [4,0], [0,0], [1,2], [2,1], [4,1], [3,1]] },
  { num: 49, quizId: 'chomp-9-25-26', live: '2026-09-25', dateLabel: 'September 25, 2026', sunday: false, w: 7, h: 7, start: [6,0], floor: 40, min: 48,
    cast: ['bulldog', 'bull', 'smokey', 'tiger', 'wildcat', 'longhorn', 'knight', 'eagle', 'ibis'],
    pellets: [[6,5], [0,0], [1,4], [1,5], [5,2], [3,0], [4,3], [4,1], [4,2]] },
  { num: 50, quizId: 'chomp-9-26-26', live: '2026-09-26', dateLabel: 'September 26, 2026', sunday: false, w: 7, h: 7, start: [2,6], floor: 36, min: 48,
    cast: ['bulldog', 'tiger', 'smokey', 'longhorn', 'eagle', 'bull', 'gamecock', 'knight'],
    pellets: [[2,0], [0,1], [5,5], [4,2], [1,6], [3,4], [2,5], [2,4]] },
  { num: 51, quizId: 'chomp-9-27-26', live: '2026-09-27', dateLabel: 'September 27, 2026', sunday: true, w: 8, h: 8, start: [7,5], floor: 61, min: 63,
    cast: ['bulldog', 'longhorn', 'tiger', 'eagle', 'knight', 'bull', 'wildcat', 'gamecock', 'smokey', 'ibis', 'seminole'],
    pellets: [[0,0], [6,1], [2,2], [0,7], [6,3], [2,4], [7,6], [4,6], [3,7], [3,6], [2,7]] },
  { num: 52, quizId: 'chomp-9-28-26', live: '2026-09-28', dateLabel: 'September 28, 2026', sunday: false, w: 7, h: 7, start: [4,2], floor: 26, min: 48,
    cast: ['bulldog', 'longhorn', 'smokey', 'bull', 'gamecock', 'ibis', 'knight', 'eagle', 'tiger', 'seminole'],
    pellets: [[5,0], [4,1], [4,4], [5,5], [4,5], [1,4], [3,3], [1,1], [3,2], [3,1]] },
  { num: 53, quizId: 'chomp-9-29-26', live: '2026-09-29', dateLabel: 'September 29, 2026', sunday: false, w: 7, h: 7, start: [0,0], floor: 40, min: 48,
    cast: ['bulldog', 'knight', 'bull', 'gamecock', 'wildcat', 'seminole', 'ibis', 'eagle', 'tiger', 'longhorn'],
    pellets: [[0,1], [6,6], [5,0], [1,2], [2,0], [4,3], [3,2], [4,2], [3,0], [4,0]] },
  { num: 54, quizId: 'chomp-9-30-26', live: '2026-09-30', dateLabel: 'September 30, 2026', sunday: false, w: 7, h: 7, start: [3,5], floor: 32, min: 48,
    cast: ['bulldog', 'gamecock', 'knight', 'tiger', 'eagle', 'longhorn', 'smokey', 'wildcat', 'seminole'],
    pellets: [[2,0], [2,5], [2,1], [2,4], [5,1], [4,2], [5,3], [4,4], [5,5]] },
  { num: 55, quizId: 'chomp-10-1-26', live: '2026-10-01', dateLabel: 'October 1, 2026', sunday: false, w: 7, h: 7, start: [4,6], floor: 40, min: 48,
    cast: ['bulldog', 'eagle', 'seminole', 'ibis', 'wildcat', 'bull', 'knight', 'smokey', 'longhorn'],
    pellets: [[0,0], [1,4], [5,6], [6,6], [2,4], [5,1], [4,2], [5,4], [4,4]] },
  { num: 56, quizId: 'chomp-10-2-26', live: '2026-10-02', dateLabel: 'October 2, 2026', sunday: false, w: 7, h: 7, start: [2,0], floor: 40, min: 48,
    cast: ['bulldog', 'smokey', 'gamecock', 'tiger', 'wildcat', 'knight', 'eagle', 'longhorn', 'bull'],
    pellets: [[4,6], [0,3], [1,0], [1,5], [3,1], [5,4], [4,3], [4,1], [4,2]] },
  { num: 57, quizId: 'chomp-10-3-26', live: '2026-10-03', dateLabel: 'October 3, 2026', sunday: false, w: 7, h: 7, start: [1,1], floor: 44, min: 48,
    cast: ['bulldog', 'wildcat', 'seminole', 'bull', 'tiger', 'eagle', 'gamecock', 'ibis'],
    pellets: [[1,0], [6,6], [1,5], [6,0], [1,3], [3,0], [3,1], [2,0]] },
  { num: 58, quizId: 'chomp-10-4-26', live: '2026-10-04', dateLabel: 'October 4, 2026', sunday: true, w: 8, h: 8, start: [0,3], floor: 53, min: 63,
    cast: ['bulldog', 'bull', 'smokey', 'knight', 'tiger', 'wildcat', 'gamecock', 'ibis', 'seminole', 'eagle', 'longhorn'],
    pellets: [[6,7], [6,1], [5,5], [0,7], [4,1], [0,4], [1,4], [2,4], [1,2], [2,2], [1,1]] },
  { num: 59, quizId: 'chomp-10-5-26', live: '2026-10-05', dateLabel: 'October 5, 2026', sunday: false, w: 7, h: 7, start: [2,2], floor: 34, min: 48,
    cast: ['bulldog', 'gamecock', 'ibis', 'bull', 'seminole', 'smokey', 'eagle', 'wildcat', 'longhorn', 'knight'],
    pellets: [[0,6], [1,3], [5,0], [3,4], [4,4], [3,2], [3,0], [2,1], [0,1], [1,1]] },
  { num: 60, quizId: 'chomp-10-6-26', live: '2026-10-06', dateLabel: 'October 6, 2026', sunday: false, w: 7, h: 7, start: [6,2], floor: 46, min: 48,
    cast: ['bulldog', 'tiger', 'ibis', 'bull', 'knight', 'smokey', 'wildcat', 'longhorn', 'gamecock', 'eagle'],
    pellets: [[5,6], [0,6], [6,0], [5,4], [5,5], [4,1], [1,5], [2,4], [2,1], [2,2]] },
  { num: 61, quizId: 'chomp-10-7-26', live: '2026-10-07', dateLabel: 'October 7, 2026', sunday: false, w: 7, h: 7, start: [4,6], floor: 40, min: 48,
    cast: ['bulldog', 'smokey', 'seminole', 'wildcat', 'eagle', 'ibis', 'bull', 'gamecock', 'knight'],
    pellets: [[0,0], [5,5], [3,2], [3,6], [0,5], [2,5], [1,4], [2,3], [1,3]] },
  { num: 62, quizId: 'chomp-10-8-26', live: '2026-10-08', dateLabel: 'October 8, 2026', sunday: false, w: 7, h: 7, start: [2,6], floor: 42, min: 48,
    cast: ['bulldog', 'gamecock', 'bull', 'eagle', 'tiger', 'seminole', 'smokey', 'wildcat', 'knight'],
    pellets: [[6,0], [1,6], [5,2], [2,2], [3,3], [4,3], [4,5], [2,4], [3,5]] },
  { num: 63, quizId: 'chomp-10-9-26', live: '2026-10-09', dateLabel: 'October 9, 2026', sunday: false, w: 7, h: 7, start: [0,6], floor: 42, min: 48,
    cast: ['bulldog', 'eagle', 'gamecock', 'seminole', 'knight', 'tiger', 'longhorn', 'bull', 'smokey'],
    pellets: [[6,4], [0,0], [0,1], [5,1], [1,5], [0,3], [3,4], [1,4], [2,4]] },
  { num: 64, quizId: 'chomp-10-10-26', live: '2026-10-10', dateLabel: 'October 10, 2026', sunday: false, w: 7, h: 7, start: [1,1], floor: 36, min: 48,
    cast: ['bulldog', 'gamecock', 'tiger', 'knight', 'eagle', 'seminole', 'ibis', 'wildcat'],
    pellets: [[0,0], [6,5], [1,2], [4,1], [4,4], [2,3], [3,1], [2,2]] },
  { num: 65, quizId: 'chomp-10-11-26', live: '2026-10-11', dateLabel: 'October 11, 2026', sunday: true, w: 8, h: 8, start: [2,7], floor: 57, min: 63,
    cast: ['bulldog', 'gamecock', 'bull', 'tiger', 'ibis', 'wildcat', 'longhorn', 'seminole', 'knight', 'smokey', 'eagle'],
    pellets: [[0,0], [2,6], [2,0], [7,0], [3,2], [7,6], [3,4], [6,4], [5,6], [5,5], [6,6]] },
  { num: 66, quizId: 'chomp-10-12-26', live: '2026-10-12', dateLabel: 'October 12, 2026', sunday: false, w: 7, h: 7, start: [0,6], floor: 34, min: 48,
    cast: ['bulldog', 'gamecock', 'tiger', 'bull', 'knight', 'eagle', 'longhorn', 'seminole', 'ibis', 'wildcat'],
    pellets: [[2,6], [6,6], [1,5], [2,0], [3,4], [1,4], [1,1], [4,1], [3,2], [3,1]] },
  { num: 67, quizId: 'chomp-10-13-26', live: '2026-10-13', dateLabel: 'October 13, 2026', sunday: false, w: 7, h: 7, start: [1,5], floor: 48, min: 48,
    cast: ['bulldog', 'ibis', 'knight', 'eagle', 'tiger', 'bull', 'gamecock', 'smokey', 'seminole', 'wildcat'],
    pellets: [[0,6], [6,6], [0,0], [6,1], [1,3], [2,2], [3,4], [6,2], [5,4], [5,3]] },
  { num: 68, quizId: 'chomp-10-14-26', live: '2026-10-14', dateLabel: 'October 14, 2026', sunday: false, w: 7, h: 7, start: [0,0], floor: 34, min: 48,
    cast: ['bulldog', 'wildcat', 'ibis', 'seminole', 'tiger', 'knight', 'eagle', 'smokey', 'gamecock'],
    pellets: [[0,5], [5,5], [0,3], [5,1], [3,2], [2,1], [1,2], [0,1], [0,2]] },
  { num: 69, quizId: 'chomp-10-15-26', live: '2026-10-15', dateLabel: 'October 15, 2026', sunday: false, w: 7, h: 7, start: [6,6], floor: 46, min: 48,
    cast: ['bulldog', 'gamecock', 'longhorn', 'ibis', 'wildcat', 'knight', 'tiger', 'smokey', 'seminole'],
    pellets: [[0,0], [0,6], [2,1], [2,6], [5,1], [4,3], [5,4], [5,6], [5,5]] },
  { num: 70, quizId: 'chomp-10-16-26', live: '2026-10-16', dateLabel: 'October 16, 2026', sunday: false, w: 7, h: 7, start: [6,2], floor: 40, min: 48,
    cast: ['bulldog', 'smokey', 'knight', 'bull', 'ibis', 'eagle', 'wildcat', 'tiger', 'seminole'],
    pellets: [[6,0], [4,2], [1,6], [6,3], [4,5], [1,1], [2,3], [3,5], [2,4]] },
  { num: 71, quizId: 'chomp-10-17-26', live: '2026-10-17', dateLabel: 'October 17, 2026', sunday: false, w: 7, h: 7, start: [4,0], floor: 32, min: 48,
    cast: ['bulldog', 'seminole', 'ibis', 'longhorn', 'knight', 'bull', 'tiger', 'eagle'],
    pellets: [[6,5], [1,5], [6,4], [2,1], [3,2], [3,1], [5,0], [5,1]] },
  { num: 72, quizId: 'chomp-10-18-26', live: '2026-10-18', dateLabel: 'October 18, 2026', sunday: true, w: 8, h: 8, start: [1,2], floor: 53, min: 63,
    cast: ['bulldog', 'longhorn', 'gamecock', 'ibis', 'wildcat', 'tiger', 'knight', 'smokey', 'bull', 'eagle', 'seminole'],
    pellets: [[0,7], [1,6], [0,1], [4,7], [2,6], [4,6], [6,1], [2,5], [4,3], [3,1], [4,2]] },
  { num: 73, quizId: 'chomp-10-19-26', live: '2026-10-19', dateLabel: 'October 19, 2026', sunday: false, w: 7, h: 7, start: [0,2], floor: 36, min: 48,
    cast: ['bulldog', 'knight', 'wildcat', 'gamecock', 'ibis', 'tiger', 'bull', 'eagle', 'longhorn', 'seminole'],
    pellets: [[5,0], [5,5], [4,0], [3,1], [1,5], [2,3], [1,3], [1,0], [1,1], [0,0]] },
  { num: 74, quizId: 'chomp-10-20-26', live: '2026-10-20', dateLabel: 'October 20, 2026', sunday: false, w: 7, h: 7, start: [6,0], floor: 42, min: 48,
    cast: ['bulldog', 'wildcat', 'smokey', 'ibis', 'longhorn', 'knight', 'seminole', 'eagle', 'tiger', 'gamecock'],
    pellets: [[1,6], [6,2], [2,2], [3,3], [6,4], [3,6], [4,5], [4,6], [6,5], [5,5]] },
  { num: 75, quizId: 'chomp-10-21-26', live: '2026-10-21', dateLabel: 'October 21, 2026', sunday: false, w: 7, h: 7, start: [6,6], floor: 44, min: 48,
    cast: ['bulldog', 'seminole', 'wildcat', 'gamecock', 'bull', 'tiger', 'smokey', 'eagle', 'knight'],
    pellets: [[0,0], [5,3], [0,5], [4,4], [0,4], [0,2], [2,3], [4,3], [3,3]] },
  { num: 76, quizId: 'chomp-10-22-26', live: '2026-10-22', dateLabel: 'October 22, 2026', sunday: false, w: 7, h: 7, start: [0,0], floor: 32, min: 48,
    cast: ['bulldog', 'seminole', 'knight', 'ibis', 'gamecock', 'bull', 'longhorn', 'eagle', 'wildcat'],
    pellets: [[1,6], [1,0], [3,1], [3,5], [1,4], [3,2], [3,3], [2,2], [1,3]] },
  { num: 77, quizId: 'chomp-10-23-26', live: '2026-10-23', dateLabel: 'October 23, 2026', sunday: false, w: 7, h: 7, start: [2,6], floor: 38, min: 48,
    cast: ['bulldog', 'ibis', 'wildcat', 'gamecock', 'seminole', 'smokey', 'longhorn', 'knight', 'bull'],
    pellets: [[0,6], [1,0], [1,5], [2,3], [6,1], [6,5], [4,2], [6,4], [5,3]] },
  { num: 78, quizId: 'chomp-10-24-26', live: '2026-10-24', dateLabel: 'October 24, 2026', sunday: false, w: 7, h: 7, start: [1,3], floor: 38, min: 48,
    cast: ['bulldog', 'smokey', 'longhorn', 'knight', 'gamecock', 'tiger', 'bull', 'eagle'],
    pellets: [[6,0], [4,5], [1,4], [3,0], [2,3], [0,0], [1,1], [0,2]] },
  { num: 79, quizId: 'chomp-10-25-26', live: '2026-10-25', dateLabel: 'October 25, 2026', sunday: true, w: 8, h: 8, start: [7,0], floor: 57, min: 63,
    cast: ['bulldog', 'smokey', 'eagle', 'gamecock', 'longhorn', 'knight', 'wildcat', 'tiger', 'bull', 'ibis', 'seminole'],
    pellets: [[7,7], [6,0], [0,1], [5,2], [5,7], [1,2], [2,7], [3,7], [3,3], [2,5], [3,5]] },
  { num: 80, quizId: 'chomp-10-26-26', live: '2026-10-26', dateLabel: 'October 26, 2026', sunday: false, w: 7, h: 7, start: [4,2], floor: 34, min: 48,
    cast: ['bulldog', 'longhorn', 'gamecock', 'knight', 'ibis', 'seminole', 'wildcat', 'tiger', 'bull', 'eagle'],
    pellets: [[6,0], [5,1], [0,4], [0,0], [4,3], [2,3], [3,3], [2,1], [3,0], [2,0]] },
  { num: 81, quizId: 'chomp-10-27-26', live: '2026-10-27', dateLabel: 'October 27, 2026', sunday: false, w: 7, h: 7, start: [6,4], floor: 36, min: 48,
    cast: ['bulldog', 'longhorn', 'wildcat', 'smokey', 'seminole', 'eagle', 'ibis', 'tiger', 'gamecock', 'knight'],
    pellets: [[5,6], [0,2], [1,6], [4,4], [5,1], [4,1], [3,4], [2,4], [3,2], [2,2]] },
  { num: 82, quizId: 'chomp-10-28-26', live: '2026-10-28', dateLabel: 'October 28, 2026', sunday: false, w: 7, h: 7, start: [6,2], floor: 40, min: 48,
    cast: ['bulldog', 'seminole', 'smokey', 'wildcat', 'longhorn', 'eagle', 'ibis', 'tiger', 'knight'],
    pellets: [[0,3], [0,6], [1,5], [5,1], [2,2], [6,6], [4,3], [6,3], [5,3]] },
  { num: 83, quizId: 'chomp-10-29-26', live: '2026-10-29', dateLabel: 'October 29, 2026', sunday: false, w: 7, h: 7, start: [2,0], floor: 48, min: 48,
    cast: ['bulldog', 'seminole', 'smokey', 'knight', 'gamecock', 'eagle', 'ibis', 'bull', 'longhorn'],
    pellets: [[6,6], [0,0], [2,6], [4,2], [3,3], [1,5], [2,4], [1,3], [2,2]] },
  { num: 84, quizId: 'chomp-10-30-26', live: '2026-10-30', dateLabel: 'October 30, 2026', sunday: false, w: 7, h: 7, start: [0,4], floor: 30, min: 48,
    cast: ['bulldog', 'ibis', 'wildcat', 'longhorn', 'seminole', 'bull', 'gamecock', 'knight', 'tiger'],
    pellets: [[1,6], [0,2], [1,0], [0,1], [5,1], [3,3], [5,5], [4,4], [3,5]] },
  { num: 85, quizId: 'chomp-10-31-26', live: '2026-10-31', dateLabel: 'October 31, 2026', sunday: false, w: 7, h: 7, start: [0,4], floor: 42, min: 48,
    cast: ['bulldog', 'longhorn', 'seminole', 'bull', 'knight', 'smokey', 'gamecock', 'tiger'],
    pellets: [[0,6], [6,0], [1,1], [6,6], [2,4], [3,6], [2,6], [3,5]] },
  { num: 86, quizId: 'chomp-11-1-26', live: '2026-11-01', dateLabel: 'November 1, 2026', sunday: true, w: 8, h: 8, start: [7,2], floor: 59, min: 63,
    cast: ['bulldog', 'knight', 'ibis', 'longhorn', 'smokey', 'eagle', 'gamecock', 'tiger', 'wildcat', 'bull', 'seminole'],
    pellets: [[0,0], [6,1], [1,7], [2,3], [7,7], [3,4], [5,3], [6,5], [6,4], [4,5], [4,4]] },
  { num: 87, quizId: 'chomp-11-2-26', live: '2026-11-02', dateLabel: 'November 2, 2026', sunday: false, w: 7, h: 7, start: [6,4], floor: 36, min: 48,
    cast: ['bulldog', 'ibis', 'wildcat', 'seminole', 'longhorn', 'knight', 'tiger', 'bull', 'eagle', 'gamecock'],
    pellets: [[6,0], [6,5], [6,6], [4,1], [1,1], [4,2], [4,5], [1,3], [2,4], [1,5]] },
  { num: 88, quizId: 'chomp-11-3-26', live: '2026-11-03', dateLabel: 'November 3, 2026', sunday: false, w: 7, h: 7, start: [5,5], floor: 44, min: 48,
    cast: ['bulldog', 'smokey', 'knight', 'wildcat', 'seminole', 'eagle', 'tiger', 'gamecock', 'ibis', 'longhorn'],
    pellets: [[6,6], [0,0], [1,3], [2,5], [2,0], [3,5], [6,3], [6,0], [5,2], [6,2]] },
  { num: 89, quizId: 'chomp-11-4-26', live: '2026-11-04', dateLabel: 'November 4, 2026', sunday: false, w: 7, h: 7, start: [6,6], floor: 46, min: 48,
    cast: ['bulldog', 'ibis', 'wildcat', 'knight', 'longhorn', 'eagle', 'tiger', 'bull', 'seminole'],
    pellets: [[5,0], [2,6], [0,0], [1,5], [4,1], [2,0], [3,2], [3,4], [3,3]] },
  { num: 90, quizId: 'chomp-11-5-26', live: '2026-11-05', dateLabel: 'November 5, 2026', sunday: false, w: 7, h: 7, start: [2,6], floor: 38, min: 48,
    cast: ['bulldog', 'knight', 'seminole', 'wildcat', 'ibis', 'eagle', 'smokey', 'gamecock', 'longhorn'],
    pellets: [[3,6], [5,0], [4,5], [0,3], [1,6], [3,2], [2,2], [3,5], [2,4]] },
  { num: 91, quizId: 'chomp-11-6-26', live: '2026-11-06', dateLabel: 'November 6, 2026', sunday: false, w: 7, h: 7, start: [4,0], floor: 28, min: 48,
    cast: ['bulldog', 'bull', 'ibis', 'seminole', 'tiger', 'smokey', 'eagle', 'knight', 'gamecock'],
    pellets: [[0,0], [5,0], [3,6], [4,6], [2,5], [3,4], [4,5], [5,5], [4,4]] },
  { num: 92, quizId: 'chomp-11-7-26', live: '2026-11-07', dateLabel: 'November 7, 2026', sunday: false, w: 7, h: 7, start: [6,4], floor: 32, min: 48,
    cast: ['bulldog', 'smokey', 'seminole', 'tiger', 'longhorn', 'bull', 'eagle', 'gamecock'],
    pellets: [[4,6], [6,5], [1,1], [3,4], [3,3], [5,1], [4,4], [5,3]] },
  { num: 93, quizId: 'chomp-11-8-26', live: '2026-11-08', dateLabel: 'November 8, 2026', sunday: true, w: 8, h: 8, start: [6,7], floor: 57, min: 63,
    cast: ['bulldog', 'tiger', 'ibis', 'longhorn', 'bull', 'knight', 'smokey', 'gamecock', 'wildcat', 'eagle', 'seminole'],
    pellets: [[6,0], [4,7], [0,0], [5,5], [2,5], [2,3], [5,2], [2,0], [4,1], [5,0], [4,0]] },
  { num: 94, quizId: 'chomp-11-9-26', live: '2026-11-09', dateLabel: 'November 9, 2026', sunday: false, w: 7, h: 7, start: [1,1], floor: 26, min: 48,
    cast: ['bulldog', 'seminole', 'ibis', 'bull', 'eagle', 'wildcat', 'longhorn', 'gamecock', 'tiger', 'knight'],
    pellets: [[1,0], [6,0], [5,3], [2,2], [4,3], [3,2], [4,1], [4,0], [2,1], [3,1]] },
  { num: 95, quizId: 'chomp-11-10-26', live: '2026-11-10', dateLabel: 'November 10, 2026', sunday: false, w: 7, h: 7, start: [1,1], floor: 40, min: 48,
    cast: ['bulldog', 'tiger', 'smokey', 'eagle', 'seminole', 'wildcat', 'longhorn', 'knight', 'ibis', 'gamecock'],
    pellets: [[0,0], [6,0], [2,2], [6,5], [5,6], [5,3], [1,2], [3,5], [2,3], [3,3]] },
  { num: 96, quizId: 'chomp-11-11-26', live: '2026-11-11', dateLabel: 'November 11, 2026', sunday: false, w: 7, h: 7, start: [5,3], floor: 32, min: 48,
    cast: ['bulldog', 'bull', 'seminole', 'eagle', 'tiger', 'knight', 'longhorn', 'ibis', 'smokey'],
    pellets: [[0,6], [1,1], [5,2], [3,3], [2,2], [2,3], [5,4], [3,4], [4,4]] },
  { num: 97, quizId: 'chomp-11-12-26', live: '2026-11-12', dateLabel: 'November 12, 2026', sunday: false, w: 7, h: 7, start: [0,6], floor: 34, min: 48,
    cast: ['bulldog', 'bull', 'gamecock', 'knight', 'seminole', 'longhorn', 'wildcat', 'ibis', 'eagle'],
    pellets: [[0,1], [0,5], [5,4], [1,1], [2,3], [5,1], [5,3], [4,3], [4,2]] },
  { num: 98, quizId: 'chomp-11-13-26', live: '2026-11-13', dateLabel: 'November 13, 2026', sunday: false, w: 7, h: 7, start: [3,1], floor: 28, min: 48,
    cast: ['bulldog', 'smokey', 'seminole', 'tiger', 'knight', 'bull', 'wildcat', 'ibis', 'gamecock'],
    pellets: [[0,2], [0,0], [2,1], [5,5], [5,1], [4,2], [3,4], [4,3], [3,3]] },
  { num: 99, quizId: 'chomp-11-14-26', live: '2026-11-14', dateLabel: 'November 14, 2026', sunday: false, w: 7, h: 7, start: [4,6], floor: 44, min: 48,
    cast: ['bulldog', 'gamecock', 'tiger', 'knight', 'eagle', 'longhorn', 'bull', 'ibis'],
    pellets: [[1,0], [6,6], [1,1], [4,2], [2,5], [2,4], [3,5], [4,4]] },
  { num: 100, quizId: 'chomp-11-15-26', live: '2026-11-15', dateLabel: 'November 15, 2026', sunday: true, w: 8, h: 8, start: [5,7], floor: 45, min: 63,
    cast: ['bulldog', 'eagle', 'smokey', 'tiger', 'wildcat', 'bull', 'seminole', 'ibis', 'longhorn', 'gamecock', 'knight'],
    pellets: [[4,7], [7,3], [6,7], [1,5], [5,5], [6,1], [1,2], [4,1], [4,3], [2,2], [2,3]] },
  { num: 101, quizId: 'chomp-11-16-26', live: '2026-11-16', dateLabel: 'November 16, 2026', sunday: false, w: 7, h: 7, start: [6,2], floor: 42, min: 48,
    cast: ['bulldog', 'gamecock', 'eagle', 'wildcat', 'knight', 'bull', 'seminole', 'ibis', 'tiger', 'longhorn'],
    pellets: [[0,1], [5,2], [1,6], [5,3], [6,4], [4,6], [3,4], [3,5], [4,4], [5,5]] },
  { num: 102, quizId: 'chomp-11-17-26', live: '2026-11-17', dateLabel: 'November 17, 2026', sunday: false, w: 7, h: 7, start: [6,4], floor: 30, min: 48,
    cast: ['bulldog', 'eagle', 'gamecock', 'tiger', 'wildcat', 'longhorn', 'seminole', 'bull', 'smokey', 'knight'],
    pellets: [[5,0], [5,1], [6,6], [0,6], [1,6], [3,6], [3,2], [2,3], [3,4], [2,4]] },
  { num: 103, quizId: 'chomp-11-18-26', live: '2026-11-18', dateLabel: 'November 18, 2026', sunday: false, w: 7, h: 7, start: [6,2], floor: 38, min: 48,
    cast: ['bulldog', 'eagle', 'smokey', 'ibis', 'knight', 'longhorn', 'bull', 'seminole', 'wildcat'],
    pellets: [[0,2], [6,0], [4,5], [4,1], [1,4], [2,3], [1,2], [2,1], [1,1]] },
  { num: 104, quizId: 'chomp-11-19-26', live: '2026-11-19', dateLabel: 'November 19, 2026', sunday: false, w: 7, h: 7, start: [6,6], floor: 34, min: 48,
    cast: ['bulldog', 'smokey', 'ibis', 'knight', 'eagle', 'longhorn', 'gamecock', 'seminole', 'bull'],
    pellets: [[6,0], [5,6], [0,6], [3,2], [2,3], [3,4], [2,4], [3,5], [2,6]] },
  { num: 105, quizId: 'chomp-11-20-26', live: '2026-11-20', dateLabel: 'November 20, 2026', sunday: false, w: 7, h: 7, start: [6,6], floor: 34, min: 48,
    cast: ['bulldog', 'tiger', 'eagle', 'knight', 'wildcat', 'bull', 'gamecock', 'seminole', 'smokey'],
    pellets: [[1,6], [2,1], [5,6], [3,5], [5,4], [3,3], [4,1], [5,2], [4,2]] },
  { num: 106, quizId: 'chomp-11-21-26', live: '2026-11-21', dateLabel: 'November 21, 2026', sunday: false, w: 7, h: 7, start: [0,2], floor: 36, min: 48,
    cast: ['bulldog', 'gamecock', 'ibis', 'smokey', 'bull', 'longhorn', 'tiger', 'knight'],
    pellets: [[1,0], [0,5], [5,1], [4,4], [1,1], [2,4], [1,3], [0,4]] },
  { num: 107, quizId: 'chomp-11-22-26', live: '2026-11-22', dateLabel: 'November 22, 2026', sunday: true, w: 8, h: 8, start: [0,7], floor: 55, min: 63,
    cast: ['bulldog', 'wildcat', 'gamecock', 'smokey', 'longhorn', 'ibis', 'tiger', 'seminole', 'eagle', 'bull', 'knight'],
    pellets: [[7,0], [3,1], [1,4], [7,2], [5,6], [4,2], [2,2], [4,4], [3,6], [3,5], [4,6]] },
  { num: 108, quizId: 'chomp-11-23-26', live: '2026-11-23', dateLabel: 'November 23, 2026', sunday: false, w: 7, h: 7, start: [2,0], floor: 42, min: 48,
    cast: ['bulldog', 'longhorn', 'eagle', 'knight', 'wildcat', 'ibis', 'tiger', 'seminole', 'bull', 'gamecock'],
    pellets: [[0,3], [0,6], [6,6], [1,4], [6,4], [2,1], [5,0], [4,1], [4,0], [3,1]] },
  { num: 109, quizId: 'chomp-11-24-26', live: '2026-11-24', dateLabel: 'November 24, 2026', sunday: false, w: 7, h: 7, start: [0,6], floor: 34, min: 48,
    cast: ['bulldog', 'gamecock', 'tiger', 'longhorn', 'smokey', 'bull', 'eagle', 'seminole', 'knight', 'wildcat'],
    pellets: [[2,0], [4,0], [1,1], [2,5], [3,1], [5,2], [4,3], [5,3], [4,4], [5,5]] },
  { num: 110, quizId: 'chomp-11-25-26', live: '2026-11-25', dateLabel: 'November 25, 2026', sunday: false, w: 7, h: 7, start: [5,5], floor: 40, min: 48,
    cast: ['bulldog', 'knight', 'tiger', 'wildcat', 'bull', 'ibis', 'eagle', 'seminole', 'longhorn'],
    pellets: [[6,6], [6,3], [0,1], [4,4], [0,5], [4,6], [1,3], [2,4], [1,5]] },
  { num: 111, quizId: 'chomp-11-26-26', live: '2026-11-26', dateLabel: 'November 26, 2026', sunday: false, w: 7, h: 7, start: [2,4], floor: 40, min: 48,
    cast: ['bulldog', 'gamecock', 'seminole', 'longhorn', 'knight', 'ibis', 'smokey', 'wildcat', 'tiger'],
    pellets: [[0,6], [2,5], [6,0], [3,5], [0,1], [2,3], [2,2], [0,3], [0,2]] },
  { num: 112, quizId: 'chomp-11-27-26', live: '2026-11-27', dateLabel: 'November 27, 2026', sunday: false, w: 7, h: 7, start: [5,1], floor: 36, min: 48,
    cast: ['bulldog', 'smokey', 'tiger', 'gamecock', 'bull', 'ibis', 'eagle', 'wildcat', 'knight'],
    pellets: [[5,0], [4,1], [1,6], [3,1], [6,5], [3,3], [4,4], [6,3], [6,4]] },
  { num: 113, quizId: 'chomp-11-28-26', live: '2026-11-28', dateLabel: 'November 28, 2026', sunday: false, w: 7, h: 7, start: [1,5], floor: 32, min: 48,
    cast: ['bulldog', 'eagle', 'smokey', 'seminole', 'tiger', 'ibis', 'longhorn', 'knight'],
    pellets: [[0,6], [5,6], [4,1], [2,6], [1,1], [2,2], [1,3], [2,4]] },
  { num: 114, quizId: 'chomp-11-29-26', live: '2026-11-29', dateLabel: 'November 29, 2026', sunday: true, w: 8, h: 8, start: [5,1], floor: 53, min: 63,
    cast: ['bulldog', 'tiger', 'seminole', 'gamecock', 'bull', 'ibis', 'smokey', 'wildcat', 'eagle', 'longhorn', 'knight'],
    pellets: [[2,0], [5,7], [6,0], [1,6], [3,1], [2,2], [1,1], [1,4], [3,3], [4,4], [4,3]] },
  { num: 115, quizId: 'chomp-11-30-26', live: '2026-11-30', dateLabel: 'November 30, 2026', sunday: false, w: 7, h: 7, start: [4,0], floor: 44, min: 48,
    cast: ['bulldog', 'tiger', 'eagle', 'seminole', 'gamecock', 'bull', 'longhorn', 'wildcat', 'ibis', 'knight'],
    pellets: [[0,4], [1,6], [2,1], [5,0], [2,5], [5,5], [2,2], [4,3], [5,2], [5,3]] },
];
