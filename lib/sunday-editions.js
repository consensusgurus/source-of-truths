// Sunday Editions - the single registry of which daily games run a distinct,
// bigger/harder puzzle on Sundays (added 2026-07-20, owner ruling).
//
// TWO MECHANISMS, answering different questions:
//
//   1. `sunday: true` ON THE PUZZLE OBJECT is the source of truth for a
//      SPECIFIC drop. Every game client badges off `PUZZLE.sunday`, and the
//      /daily archive tags off it too, so a past Sunday in the archive stays
//      marked correctly regardless of what day it is now. Never infer a Sunday
//      Edition from board size, guess count, or any other proxy - Crux used to
//      key off `guesses === 27` and that heuristic was retired here.
//
//   2. SUNDAY_EDITION_GAMES (this file) answers "does this GAME have a Sunday
//      Edition at all", which the hub surfaces need because they render from a
//      static game registry and never load puzzle data. Combined with
//      isSundayET() it drives the "Sun" chip on the strip and the games grid.
//
// Keep the two in sync: a game listed here MUST set `sunday: true` on its
// Sunday puzzles, and a game that sets the flag MUST be listed here.

// The 12 dailies with a genuine Sunday variant, and what changes:
//   glyph   a 17x17 grid instead of 15x15, and only two given letters not three
//   crux    12 hidden words instead of 8 (27 guesses)
//   emcee   7x7 grid instead of the weekday mini
//   span    a via/avoid rule constrains the route
//   tally   6x6 board instead of 5x5
//   suds    harder grid, fewer givens
//   quilt   26 printed clues instead of the weekday 30-34
//   cages   27 cages instead of the weekday 29-34, and the only day that
//           prints a five-cell cage
//   sando   six printed digits instead of the weekday 10-20
//   extra   a trickier story to name
//   carve   7x7 board in nine blocks
//   stet    seven sentences, up to two errors each
//   ping    a trickier, more out-of-the-way city
//   jester  the hardest two-jester 10x10 of the week (Thu-Sat are two-jester too, from 2026-08-21)
//   sworn   six suspects sworn instead of five
//   garble  every answer is six letters instead of five (from 2026-07-26)
//   dating  six events to order instead of five (from 2026-07-26)
//   cipher  four addends stacked instead of two (from 2026-08-09; it was
//           three addends over a two-addend weekday from 2026-07-26, until
//           subtraction was retired and the addend count took over the ramp)
//   outwit  six prompts instead of five, the extra a second Rare Bird (from 2026-07-26)
//   tuck    a 15-letter rack instead of 14 (from 2026-07-26)
//   alibi   five suspects instead of four, 15 facts to confirm (from 2026-07-26)
//   warmer  a rarer secret word, deeper in the frequency-ordered vocab (from 2026-07-26)
//   links   four cross-category collisions instead of two (from 2026-07-26)
//   outrank seven items on the slate instead of six (from 2026-07-26)
//   axiom   28 tiles and seven candidate rules instead of 24 and five
//   hearsay a third voice joins, on a longer chain of statements
//   venn    fifteen words instead of twelve, and two region counts withheld
//   stands  a sixth club, so fifteen matches to rebuild instead of ten
//   bracket a field of 32 instead of 16, so 31 picks and five rounds
//   pricer  a field of 32 instead of 16, so 31 picks and five rounds
//   mate    a mate in three instead of a mate in two
//   defend  a hold for four instead of a hold for three, so a fourth white move
//           to survive and a longer attack to read before committing to the first
//   four    a forced win in five instead of a win in four
//   park    (Parker) a perfect line in the thirties instead of the high teens
//   junkyard a perfect line of 44 and up against a weekday 22 to 47, on the
//           same 8x8 lot, which is the largest board lib/jam-core can hold at
//           all: the two-word bitboard tops out at 64 cells, so depth is the
//           only knob this game has left
//   impound a perfect line of 34 to 50 against a weekday 16 to 35, on the same
//           7x7 lot. Depth is the knob rather than size, for the same reason
//           Parker's is: the board is already at the size its exact solver can
//           re-prove cheaply, and an 8x8 Sunday would take the verifier out of
//           reach for one board a week
//   check   a sweep in four moves instead of three
//   rung    a ladder of fifteen rungs or more instead of ten to twelve
//   crunch  a target that needs all six numbers instead of four or five
//   fib     a 6x6 grid instead of 5x5, a whole extra rank of deduction to get
//           through before the lying sign can be pinned down
//   chain   a 5 by 5 board instead of 3 by 5, so twenty five boxes instead
//           of fifteen and a good deal more chain to read before you commit
//   babel   six tiles a side instead of five, which adds a turn to the
//           endgame and roughly triples the number of lines to read
//   chomp   the whole cast of eight instead of a weekday six or seven, on the
//           smallest board of the week, tuned so the shortest legal route uses
//           88-100% of the squares against a Monday's 56-66%. Forced coverage is
//           the knob: because no leg can be walked in fewer moves than its
//           Manhattan distance, that share is a proven floor rather than an
//           estimate, and one banked Sunday needs literally every square.
//   sweep   the same field carries more mines, 18.5% against a weekday 15%.
//           Density is the knob because there is no clock to steepen and a
//           narrower strip would take away the very constraints deduction
//           needs, so a harder Sweep has to mean more to read, not less
//   docket  the stacked board: seven entities over seven slots PLUS a second
//           per-entity dimension, so fourteen open cells against a weekday's
//           twelve, and one extra condition. Size is the knob because the
//           difficulty proxy for the hybrid shape overlaps between six and seven
//           entities, and a fitted number that cannot separate them would be
//           worth less than the structural claim
//   blocks  the well narrows from ten columns to eight, which is the right
//           knob when there is no speed curve to steepen: two fewer columns
//           makes every shape harder to seat, the plus most of all
//   turn    twelve empty squares instead of ten, which is two more plies of
//           search and, more to the point, a second pass to see coming
//   taire   one free cell instead of two on the full twenty-card deal, which
//           is a far bigger difference than it sounds, and a perfect line that
//           runs half again as long as a weekday
//
//   paths   a 13x13 lattice instead of 9x9, eleven towns instead of eight, and
//           every element on one board: ridge, river, cliffs and old track
//   strata  a 6x7 grid instead of 5x5, and TWO categories running at once
//           instead of one, so a word you can read tells you far less about
//           which thread it belongs to
//   anon    a longer passage, so more answers to pull out of it and a longer
//           name to spell down their first letters
//   plot    a 12x12 board instead of 10x10, so about a third more plots to
//           survey, and every Sunday needs the harder deduction at least once
//   towers  a 7x7 skyline against the weekday 5x5
//   mercury nine thermometers and eight printed digits, against six
//           thermometers and fifteen to thirty digits on a weekday
//   polka   a deal from the top of the measured difficulty distribution
//   sixes   a grid in the top fraction of a percent of the difficulty
//           distribution: cost 56 and up, where the hardest weekday board in
//           the bank is 51. On a 6x6 that means ten to fourteen squares you can
//           only get by asking where a digit must go, against none on a Monday.
//   queen   a win in twelve, the longest walk against the weekday five to
//           nine (from launch, 2026-08-21)
//   race    a win in five, the longest race against the weekday three and
//           four (from launch, 2026-08-21)
//   shoe    seven hands of blackjack instead of five, dealt off the ENTIRE
//           52-card deck instead of a 36-card cut, so a perfect counter knows
//           exactly what is left (from launch, 2026-08-23)
//   niche   a 4x4 grid instead of the weekday 3x3, sixteen cells and twenty
//           guesses, always on Countries, the deepest universe (from launch,
//           2026-08-23)
//   barter  a 7x7 lattice of eight seven-letter words instead of the weekday
//           5x5 with six, and a deeper par (from launch; first Sunday 2026-08-16)
//
// Circa was RETIRED 2026-07-20 (archive stays playable); it no longer runs
// Sunday drops and is off this list.
//
// Extra retires 2026-09-29, the last front page in its bank, but it STAYS on
// this list, unlike Circa. This list also answers "was that archived day a
// Sunday Edition?", and Extra has real Sunday drops behind it, so pulling the
// key would strip the label off every one of them. A retired game simply never
// banks another Sunday.
//
// NOT listed (no Sunday variant exists in its bank): links.
// Do not add one
// here until its bank actually authors the variant - an unbacked entry would
// promise players a bigger puzzle that never arrives.
export const SUNDAY_EDITION_GAMES = [
  'anon', 'paths', 'strata', 'suffice', 'redact',
  'crux', 'emcee', 'span', 'tally', 'suds', 'quilt', 'cages', 'sando',
  'extra', 'carve', 'stet', 'ping', 'jester', 'sworn',
  'garble', 'dating', 'cipher', 'outwit', 'tuck', 'alibi', 'warmer', 'links', 'outrank', 'shards',
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' sunday registry
  // 'pricer' sat here. Its first Sunday is 2026-08-16, so leaving it listed would have
  // made /api/quiz/sunday-slate start offering a /pricer?p=N link to a page that 404s.
  'axiom', 'hearsay', 'venn', 'stands', 'bracket', 'lode', 'etch', 'hedge',
  'listed', 'mate', 'four', 'park', 'impound', 'junkyard', 'check', 'rung', 'hinge', 'sums', 'crunch', 'taire', 'finesse', 'fib',
  'babel', 'glyph', 'chain', 'turn', 'blocks', 'chomp', 'sweep', 'docket', 'defend',
  'barter', 'plot', 'sixes', 'niche', 'shoe', 'queen', 'towers', 'mercury', 'polka',
  'calc',
  'encore',
  'flank',
  'whittle',
  'diag',
  'frame',
  'rim',
  'knight',
  'thread',
  'slot',
];

const SET = new Set(SUNDAY_EDITION_GAMES);

// The one reader-facing wording. Every badge leads with this; a game may append
// a short detail after a middot (e.g. "Sunday Edition - 6x6"). Never invent a
// different phrase for the label itself.
export const SUNDAY_LABEL = 'Sunday Edition';
export const SUNDAY_SHORT = 'Sun';

export function hasSundayEdition(key) {
  return SET.has(key);
}

// Is it Sunday in Eastern time? Puzzles roll at midnight ET, so ET is the only
// correct clock here - a player in Tokyo or London still gets the ET day's
// puzzle. Falls back to the local weekday if the runtime lacks timezone data.
export function isSundayET(date = new Date()) {
  try {
    return date.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' }).startsWith('Sun');
  } catch (e) {
    return date.getDay() === 0;
  }
}

// Convenience for the hub surfaces: show the chip only when BOTH the game runs
// a Sunday Edition and today (ET) is Sunday.
export function showSundayChip(key, date) {
  return hasSundayEdition(key) && isSundayET(date);
}
