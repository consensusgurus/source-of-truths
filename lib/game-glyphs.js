// ONE GLYPH PER GAME, ONE COLOUR, DRAWN FROM THE BOARD.
//
// The existing tile art (public/games/btn-<key>.png) is a small full-colour
// illustration, and it needs a second hand-maintained copy in the brand blue
// (public/games/blue/btn-<key>.png) for any surface with one palette — a copy
// that silently falls back to the garish original when it is missing, so the
// only symptom is one loud tile in a quiet table.
//
// These are the opposite: a single stroke drawing per game on a 24x24 box,
// painted in `currentColor`. That means ONE asset tints to whatever the
// surface asks for — the stage paints them in the game's CATEGORY STEP, which
// flips with the register for free, and there is no second file to drift.
//
// DRAW THE BOARD, NOT THE GENRE. Six of the word games are crosswords of some
// kind; a crossword grid for each would make six identical icons. So each glyph
// is that game's own board or its own move: Crux is its four category bars,
// Anon is an acrostic's spine, Shards is a piece being fitted back in.
//
// House rules, so the set reads as a set:
//   - viewBox 0 0 24 24, stroke 2, round caps and joins, fill none.
//   - Between one and five primitives. If it needs six it is too clever.
//   - Nothing smaller than ~2 units: at 16px anything finer turns to mud.
//   - No text. A letterform is not a glyph, and it breaks in every locale.

export const GLYPH_BOX = '0 0 24 24';

// A grid helper, since a dozen games are played on one.
const grid = (x, y, w, h, cols, rows) => {
  const r = (n) => Math.round(n * 100) / 100;
  let d = `M${x} ${y}h${w}v${h}h${-w}z`;
  for (let i = 1; i < cols; i += 1) d += `M${r(x + (w / cols) * i)} ${y}v${h}`;
  for (let i = 1; i < rows; i += 1) d += `M${x} ${r(y + (h / rows) * i)}h${w}`;
  return d;
};

export const GLYPHS = {
  // ── Word ────────────────────────────────────────────────────────────────
  crux: 'M3 9h18v6H3zM9 3h6v18H9z',                    // four category bars
  emcee: grid(4, 4, 16, 16, 3, 3),                            // the mini grid
  garble: 'M4 8h9M4 16h9M20 8l-4 4 4 4M16 12H8',              // letters being swapped
  links: 'M7 9a3 3 0 0 0 0 6h3M17 15a3 3 0 0 0 0-6h-3M9 12h6', // a chain link
  stet: 'M4 18h16M7 14l4-8 4 8M8.5 11h5',                     // a proofreader's caret
  tuck: 'M3 15h18v4H3zM6 7h4v6H6zM13 5h4v8h-4z',              // tiles on a rack
  warmer: 'M12 4v9M12 16a2 2 0 1 0 0.01 0M12 16V13M9 19a5 5 0 0 0 6 0', // a thermometer bulb
  shards: 'M4 4h7v7H4zM13 13h7v7h-7zM13 4l7 7M11 13l-7 7',    // pieces refitted
  lode: 'M12 3l7 4.5v9L12 21l-7-4.5v-9zM12 10a2 2 0 1 0 .01 0',               // a pick striking a vein
  rung: 'M8 3v18M16 3v18M8 8h8M8 12h8M8 16h8',                // a ladder
  babel: 'M7 9h10l1 11H6zM10 9V6a2 2 0 0 1 4 0v3',            // an empty bag
  glyph: 'M4 3h16v12H4zM4 9h16M9.33 3v12M14.67 3v12M6 19h3M11 19h3M16 19h3M7.5 17v4', // symbols for letters
  anon: 'M8 4v16M8 7h9M8 12h7M8 17h9',                        // an acrostic spine
  strata: 'M3 9h18M3 14h18M3 19h18M12 3v4M9 6l3 3 3-3',                   // layers, dug through
  barter: 'M4 9h13l-3-3M20 15H7l3 3',                         // a trade
  encore: `${grid(4, 4, 16, 16, 3, 3)}M4 4h5.33v5.33H4zM14.67 14.67H20V20h-5.33z`, // grid with blocks

  // ── Geography ───────────────────────────────────────────────────────────
  span: 'M4 12a2 2 0 1 0 .01 0M20 12a2 2 0 1 0 .01 0M8 12h2M12 12h2M16 12h2',       // a crossing
  ping: 'M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11zM12 8a2 2 0 1 0 .01 0', // a pin
  flank: 'M12 12a2.5 2.5 0 1 0 .01 0M12 4a1.8 1.8 0 1 0 .01 0M12 20a1.8 1.8 0 1 0 .01 0M4 12a1.8 1.8 0 1 0 .01 0M20 12a1.8 1.8 0 1 0 .01 0', // a centre and its neighbours
  atlas: 'M12 3a9 9 0 1 0 .01 0M3 12h18M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18', // a globe

  // ── Trivia ──────────────────────────────────────────────────────────────
  dating: 'M4 7h16v13H4zM4 12h16M8 3v4M16 3v4M9 16l2 2 4-4',  // a dated calendar
  circa: 'M12 3a9 9 0 1 0 .01 0M12 7v5l3 3',                  // a clock
  extra: 'M4 5h16v14H4zM7 9h6M7 13h10M7 17h4',                // a headline, part hidden
  bracket: 'M4 5h6v6H4zM4 13h6v6H4zM10 8h4v8h-4M14 12h6',     // a bracket
  listed: 'M5 6h1M9 6h10M5 12h1M9 12h10M5 18h1M9 18h10',            // a ranked list
  redact: 'M5 3h14v18H5zM8 7h8M8 11h4M14 11h2M8 15h8M8 19h5', // struck-out copy
  niche: 'M4 4h16v16H4zM4 9h16M9 4v16M12 12a1.5 1.5 0 1 0 .01 0M16 16a1.5 1.5 0 1 0 .01 0', // two overlapping sets
  focus: 'M3 8h4l2-3h6l2 3h4v11H3zM9 13.5a3 3 0 1 0 6 0a3 3 0 1 0-6 0', // a camera
  streak: 'M13 3l-7 10h5l-1 8 7-10h-5z',                      // a bolt, one life
  deep: 'M3 4h18l-7 8v9l-4-3v-6z',                     // drilling one topic
  sport: 'M12 3a9 9 0 1 0 .01 0M4 8c5 3 11 3 16 0M4 16c5-3 11-3 16 0', // a ball
  biz: 'M4 20h16M7 20V9M12 20V5M17 20v-8M4 9l3-4 5 4 5-3',    // a chart
  script: 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h3',             // a page of dialogue
  quotes: 'M8 15c-2 0-3-1-3-3s1-3 3-3 3 1 3 3c0 3-2 4-4 5M18 15c-2 0-3-1-3-3s1-3 3-3 3 1 3 3c0 3-2 4-4 5',
  thread: 'M2 18C7 18 7 4 13 4C19 4 18 14 12 14C7 14 8 6 14 7C20 8 20 18 22 20', // a strand with one loop
  // Slot draws one card landing between two rails: the item in hand and the
  // slots above and below it, which is the whole decision.
  slot: 'M3 5h18M3 19h18M5 8h14v8H5z',                          // the card between the rails

  // ── Numbers ─────────────────────────────────────────────────────────────
  tally: 'M12 4v15M4 8h16M4 8l-2 5h4zM20 8l-2 5h4zM8 20h8',  // a balanced ledger
  suds: grid(4, 4, 16, 16, 3, 3),                             // the sudoku box
  quilt: 'M4 4h16v16H4zM4 10h6l2 4h8M10 4v6M14 20v-6',        // crooked regions
  carve: 'M4 4h16v16H4zM4 11h8v9M12 4v7h8M14 15h4M14 18h4',                   // equal blocks
  cipher: 'M9 5h9M5 11h2M6 10v2M9 11h9M4 15h16M11 19h7',        // stacked letter sums
  pricer: 'M12 4v16M8 8h6a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h6',  // a price
  crunch: 'M12 12a9 9 0 1 0 .01 0M12 12a4.5 4.5 0 1 0 .01 0M12 11.5a1 1 0 1 0 .01 0',          // six numbers, one target
  blitz: 'M4 7h5M6.5 4.5v5M15 7h5M5 16l4 4M9 16l-4 4M15 18h5M17.5 15v.01M17.5 21v.01',    // speed, one life
  blitzed: 'M13 2L5 13h6l-1 9 8-11h-6z M4 21h.01M20 21h.01',                             // the bolt, three numbers wide
  sums: 'M3 3h18v18H3zM3 9h18M9 3v18M3 3l6 6M15 15v.01M15 9v.01M9 15v.01',                // a kakuro corner, the clue cell split
  hinge: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1', // two links of a chain
  cages: `${grid(4, 4, 16, 16, 3, 3)}M6 6h6v6H6z`,            // a cage on the grid
  sando: `${grid(6, 6, 14, 14, 3, 3)}M3 6v14M6 3h14`,         // sums outside the grid
  sixes: grid(6, 6, 12, 12, 2, 3),                            // the mini sudoku
  towers: 'M4 20h16M6 20v-5M11 20v-9M16 20v-13M20 20v-3',     // a skyline
  mercury: `${grid(4, 4, 16, 16, 3, 3)}M8 8a2 2 0 1 0 .01 0M10 8h8`, // a thermometer run
  calc: 'M5 4h14v16H5zM5 9.33h14M5 14.67h14M9.67 4v16M14.33 4v16M7.3 6.7l4.7 4.6 4.7-4.6M12 11.3v6', // a calculator
  knight: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M7 7v5h5',        // a knight
  diag: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M4 4l16 16M20 4L4 20', // the X across the grid
  frame: 'M2 2h20v20H2zM7 7h10v10H7zM12 2v5M12 17v5M2 12h5M17 12h5',                    // the grid inside its gutter
  rim: 'M6 6h12v12H6zM6 3v3M12 3v3M18 3v3M3 6h3M3 12h3M3 18h3M21 6h-3M21 12h-3M21 18h-3M6 21v-3M12 21v-3M18 21v-3', // clues at the rim
  polka: 'M8 8a1.5 1.5 0 1 0 .01 0M16 8a1.5 1.5 0 1 0 .01 0M8 16a1.5 1.5 0 1 0 .01 0M16 16a1.5 1.5 0 1 0 .01 0M12 12a1.5 1.5 0 1 0 .01 0',
  whittle: `${grid(2, 8, 12, 13, 2, 3)}M17 4h5v5h-5z`,          // a clue lifted off the board

  // ── Crowd Psychology ────────────────────────────────────────────────────
  outwit: 'M6 10a3 3 0 1 0 .01 0M18 10a3 3 0 1 0 .01 0M12 6a3 3 0 1 0 .01 0M3 20c0-3 2-4 3-4M21 20c0-3-2-4-3-4M8 20c0-3 2-5 4-5s4 2 4 5',
  outrank: 'M4 20h16M9 20v-6h6v6M4 20v-3h5v3M15 20v-9h5v9',               // calling the field
  feud: 'M4 6h7v4H4zM4 14h7v4H4zM13 6h7v4h-7zM13 14h7v4h-7zM11 8h2M11 16h2',

  // ── Logic ───────────────────────────────────────────────────────────────
  alibi: 'M11 11a6 6 0 1 0 .01 0M15.5 15.5L21 21M4 5h5M4 8h3', // a magnifier over notes
  sworn: 'M12 3l7 3v6c0 5-3 7-7 9-4-2-7-4-7-9V6z M9 12l2 2 4-4', // an oath, checked
  axiom: 'M15 6a4 4 0 1 0 .01 0M13 11l-8 8v3h3l8-8',            // a rule emerging
  hearsay: 'M3 4h11v8H7l-4 4zM10 10h11v8h-4l-4 4v-4h-3z',                              // a speech bubble
  venn: 'M9.5 12a5 5 0 1 0 .01 0M14.5 12a5 5 0 1 0 .01 0',    // two circles
  stands: 'M4 4h16v16H4zM4 9h16M4 14h16M9 4v16M14 4v16M5 5l3 3M10 10l3 3M15 15l3 3',              // rebuilt results
  etch: `${grid(7, 7, 13, 13, 3, 3)}M3 9h3M3 13h3M3 17h3M9 3v3M13 3v3M17 3v3`, // a nonogram
  hedge: 'M6 6h6v6h6v6H6z',                                   // one closed loop
  fib: 'M6 5l4 3-4 3M14 5l4 3-4 3M10 16l-4 3 4 3M18 16l-4 3 4 3',                  // one clue struck out
  suffice: 'M5 12l4 4 10-10M5 6h6',                           // enough, checked
  paths: 'M6 7a2 2 0 1 0 .01 0M18 7a2 2 0 1 0 .01 0M6 17a2 2 0 1 0 .01 0M18 17a2 2 0 1 0 .01 0M6 9v6M8 7h8M8 17h8M18 9v6',
  chomp: 'M11 11l8-4a9 9 0 1 0 0 8zM11 11a1 1 0 1 0 .01 0',              // eaten in order
  docket: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h4M9 4v3',          // a docket
  plot: 'M4 4h16v16H4zM4 12h7V4M11 12h9M15 12v8M7 8a1 1 0 1 0 .01 0M17 16a1 1 0 1 0 .01 0',             // the board divided
  jester: 'M6 10a6 6 0 0 1 12 0v6H6zM6 16v3h12v-3M9 8V5M15 8V5', // the court seated
  park: 'M4 8h9v4H4zM15 8h5v4M4 14h5v4M11 14h9v4M20 10v8',    // the red one out
  // Impound draws the WALL, which Parker's glyph leaves out, because the wall
  // and its one gap are what the bigger lot is about: the same red block, more
  // traffic around it, and the only way out cut through the right-hand side.
  impound: 'M20 9V4H4v16h16v-5M7 10h6v4H7zM16 5v5M7 16h9',    // a fuller lot, one gap
  junkyard: 'M21 11V3H3v18h18v-5M8 11h6v5H8zM6 6h9M18 6v4M6 18h10',  // the biggest lot, one gap

  // ── End Game ────────────────────────────────────────────────────────────
  mate: 'M8 20h8M9 17h6l1-8-3 2-1-4-1 4-3-2zM12 4v3',         // a king
  four: 'M4 4h16v16H4zM9 9a1.5 1.5 0 1 0 .01 0M15 9a1.5 1.5 0 1 0 .01 0M9 15a1.5 1.5 0 1 0 .01 0M15 15a1.5 1.5 0 1 0 .01 0',
  check: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16M7 7l0 0', // the board swept
  chain: 'M6 8a2 2 0 1 0 .01 0M18 8a2 2 0 1 0 .01 0M6 16a2 2 0 1 0 .01 0M18 16a2 2 0 1 0 .01 0M8 8h8M8 16h8M6 10v4',
  turn: 'M12 3a9 9 0 1 0 .01 0M12 3a9 9 0 0 1 0 18z',         // a flipped disc
  defend: 'M6 21h12M8 18h8l1-8-3 2-2-4-2 4-3-2zM4 3h16v3H4z',         // a shield
  queen: 'M6 19h12M7 16h10l2-8-4 3-3-6-3 6-4-3zM12 3v2',      // a promotion

  // ── Cards ───────────────────────────────────────────────────────────────
  taire: 'M4 5h9v14H4zM9 8h9v3M15 5l4 12-6 2',                // a tableau
  hands: 'M4 4h6v7H4zM12 4h6v7h-6zM4 13h6v7H4zM12 13h6v7h-6zM21 5v14',      // a poker hand
  finesse: 'M9 2h6v6H9zM16 9h6v6h-6zM9 16h6v6H9zM2 9h6v6H2z',                // four hands round a trick
  shoe: 'M4 7h14a2 2 0 0 1 2 2v8H6a2 2 0 0 1-2-2zM8 7v10M12 7v10', // a dealing shoe

  // ── Arcade ──────────────────────────────────────────────────────────────
  sweep: 'M12 12a4.5 4.5 0 1 0 .01 0M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M17.5 17.5L15 15',    // a screen, no floor
  blocks: 'M4 13h5v5H4zM9 13h5v5H9zM9 18h5v3H9zM14 3h5v5h-5zM19 3v5', // the same shapes
};

// Every live game must have one, so a missing glyph is a build-time question
// rather than a blank square nobody notices.
export function glyphFor(key) {
  return GLYPHS[key] || null;
}
