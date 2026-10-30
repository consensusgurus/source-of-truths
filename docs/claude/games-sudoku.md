# The sudoku family

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: The sudoku family: Suds-adjacent variants (Cages, Sando, Knight, Diag, Frame/Rim, Arrow, Giant, Sumo, Window, Five/Racecar, Towers/Mercury/Polka) and the rotating Sudoku circuit

## The sudoku trio (Towers, Mercury, Polka) and the ROTATING Sudoku circuit (owner, 2026-08-23)

Three sudoku-family dailies launched 2026-08-24: **Towers** (skyscrapers: border clues count
the visible towers, taller hiding shorter; 5x5 weekdays, 7x7 Sundays; the ramp is the
printed-clue count and nothing else, Mon 14 down to Sat 9 of 20, Sunday 18 of 28),
**Mercury** (thermo sudoku: digits strictly increase along every thermometer from its bulb;
the ramp is the printed-given count, Mon 30 down to Sat 15; the Sunday Edition prints 8
under nine thermometers - zero-given was probed and is OUT OF REACH of the graded technique
set on random layouts, dig floors bottom at 7-13, so eight is stated rather than fudged),
and **Polka** (kropki: the full dot set and no digits at all; white = differ by 1, black =
double, no dot = neither, and a 1-2 pair may carry either dot, picked by position parity;
difficulty is a MEASURED COST like Sixes, bands Mon <=10 / Tue 11-24 / Wed 25-38 /
Thu 39-54 / Fri 55-78 / Sat 79-110 / Sunday 120+). All three: flat-10 solve, miss null on
the registry row, the day resolves on the clock. Banks run 2026-08-24 through 2026-10-04.
Generators scripts/gen-{towers,mercury,polka}.mjs with engines in the *-core.mjs files;
INDEPENDENT verifiers scripts/verify-{towers,mercury,polka}.mjs (no imports from the cores,
per the Cages/Sando rule; Mercury's and Polka's graded solvers police every elimination
against sol). scripts/sudoku-trio-mutation-test.mjs breaks each bank five ways via the
VERIFY_<GAME>_BANK override and requires every mutation caught. On Towers, a completed
propagation solve doubles as the uniqueness proof (line-sweep eliminations are sound, so an
all-singleton end state IS exactly-one-solution); the brute counter runs only on the 5x5s
because it explodes on a 7x7.

**The Sudoku circuit ROTATES - the only rotating skill circuit (owner, 2026-08-23).** Its
lib/circuits.js entry carries a POOL of eight keys plus a `rotate: 5` field: a sliding
window over the pool advances one game per ET day (deterministic from the date, no bank, no
storage), every pool member plays five days in every eight, and the day's five still run
shortest first because the pool is stored in ascending measured order and the window
re-sorts to it. The selection lives ONLY in circuitKeysFor, so the board route
(?circuit=sudoku), the trophies engine, the console band, the filter strip and the landing
page all follow with no edits of their own. scripts/verify-circuits.mjs recomputes the
window with its own day-index math and proves: five a day, in pool order, every member
exactly five appearances per eight-day cycle, and every one of the eight windows totalling
into the gold trophy tier.

## Five and Racecar are the LINE SUDOKUS, and they share one engine (launched 2026-10-15)

Five is German whispers (any two neighbours along a green line differ by at least 5, so 5 never sits
on a line and lows and highs alternate). Racecar is palindrome (every grey line reads the same from
either end, so paired squares never share a house). Routes `/five` and `/racecar`, keys of the same
names, legacy hues green #15803d and slate #475569.

- **One engine for both:** `scripts/lines-core.mjs` (generator, graded solver, uniqueness counter),
  `scripts/lines-bank.mjs` (appends, JSONL cache), wrapped by `gen-five.mjs` / `gen-racecar.mjs`.
  The INDEPENDENT checker is `scripts/lines-verify.mjs`, wrapped by `verify-five.mjs` /
  `verify-racecar.mjs`, sharing no code with the generator; `lines-mutation-test.mjs five|racecar`
  breaks each bank nine ways. Both proofs include LINE NECESSITY: with the lines off the clues fit
  more than one grid.
- **Ramps** (printed digits, level 1 Mon-Thu, level 2 Fri-Sun): Five 20/18/16/15/14/13, Sunday 11
  under eight lines (six on weekdays). Racecar 24/22/20/18/17/16, Sunday 14 under ten lines (eight
  on weekdays).
- **Clients forked from Arrow** by `scripts/mklines_client.py` + `mklines_page.py` (not committed):
  the arrow overlay is swapped for a plain translucent polyline (`LineOverlay`). Class prefixes
  `fv-` and `rc-`. Wiring is `scripts/wire-five-racecar.mjs`, which anchors on Window's entries and
  must be run ONCE (its key-list inserts are not idempotent).
- Banks 2026-10-15 to 2027-01-31. The boards first built for 10-13 and 10-14 were dropped unplayed
  and the bank renumbered, so No. 1 is launch day. Not in Enter the Dojo (not asked for).

## Window is the WINDOKU, and a window is a HOUSE (launched 2026-10-15)

An ordinary 9x9 plus four shaded 3x3 WINDOWS (rows 2-4 / 6-8 by columns 2-4 / 6-8, 1-based), each
holding 1 to 9 once: 31 houses, not 27. Route `/window` (owner named it Window, not Windoku), key
`window`, legacy hue rose #be185d. Careful: `window` is also the browser global, so never name a
variable `window`; as an object key and a string it is fine.

- **A fork of Diag**, made by `mkwin_client.py` / `mkwin_scripts.py` (not committed): the two
  diagonals swapped for the four windows in the peer set, tint and note scrub; the ruled X becomes
  four framed windows. Class prefix `wi-`.
- **The ramp is measured lower than Diag's** because the windows cover 36 squares (the diagonals 17):
  Mon 22, Tue 20, Wed 18, Thu 16 at level 1 (singles); Fri 15, Sat 14, Sunday Edition 13 at level 2
  (also locked candidates and subsets). Twelve did not come in 150 s of search, so 13 is the floor.
- Generator `scripts/gen-window.mjs` (appends only; `--until` to extend), independent verifier
  `scripts/verify-window.mjs` (unique, logic-only at the pinned level, window necessity),
  `window-mutation-test.mjs` (9 of 9). Bank 2026-10-15 to 2027-01-31.
- **Not in Enter the Dojo** (not asked for).

## Sumo is the GREATER-THAN SUDOKU, and its signs are the grid lines (launched 2026-10-13)

An ordinary 9x9 plus a sign on every edge INSIDE a 3x3 box (12 per box, 108 in all) saying
which square holds the larger digit. Route `/sumo`, key `sumo`, legacy hue ochre #8a6d0b.

- **The signs ARE the grid lines (owner pick E1, 2026-10-13).** No < or > glyphs: every in-box
  line is drawn as one SVG path that bends at its middle into a point aimed at the SMALLER
  square, in `--stg-cell-dot`, so it reads as a line in both registers. The cells' own in-box
  borders are transparent; only box borders are borders. Mockups: the "Greater-Than Sudoku
  Options" canvas artifact.
- **The ramp is digits, then technique, and that is measured** (`gen-sumo.mjs --measure`): the
  greedy floor is 0 to 7 printed digits and ~15% of grids are unique with none. Mon 8, Tue 6,
  Wed 4, Thu 2, Fri 0 at level 1 (sign reading + singles); Sat 2 and the Sunday Edition 0 at
  level 2 (also locked candidates and subsets). Sign reading is in BOTH levels: box chains
  (k squares chained below means at least k+1) and bound propagation along every sign.
- **In Enter the Dojo from 2026-10-14**, joining with Arrow the same day: the from-10-14 pool
  is eight, ordered so no two sum rules (Sando, Arrow, Frame) and no two order rules (Mercury,
  Sumo) are neighbours around the cycle. Sumo first deals 2026-10-15. Seed clock [520, 1500];
  the adapting clocks replace it as solves come in.
- **Groups:** Marked sudokus split when Sumo arrived (every Sudoku group was at the five-key
  ceiling): Marked keeps Quilt, Arrow, Knight; Order sudokus is Mercury, Polka, Sumo.
- Engine `scripts/sumo-core.mjs` (generator only); `verify-sumo.mjs` is independent and policed;
  `sumo-mutation-test.mjs` (10 of 10). Client is `mksumo.py` (not committed), a transform of
  DiagClient. Bank 2026-10-13 to 2026-12-31; extend with `gen-sumo.mjs --until` (appends only).

## Giant is the 16x16 SUDOKU, and the phone plays it a quarter at a time (launched 2026-10-13)

An ordinary sudoku at sixteen: 16 rows, 16 columns and sixteen 4x4 boxes, each holding the
symbols 1 to 9 then A to G. The bank stores a symbol as 1..16; the client draws 10..16 as A..G
and the keyboard takes A-G. Route `/giant`, key `giant`, legacy hue slate indigo #3949ab.

- **NOT in Enter the Dojo (owner, 2026-10-13).** It joins the Sudoku category, `SUDOKU_POOL`
  (home Sudoku shelf, daily cap hue) and the 'Classic sudokus' set, but `lib/dojo.js` is untouched.
- **The ramp is CLUES, not technique, and that is measured.** `node scripts/gen-giant.mjs
  --measure 12`: a greedy dig under singles alone bottoms out at 90 to 98 clues (median 94), and
  under the full toolkit at 89 to 97 (median 94). The harder techniques buy almost nothing on a
  16x16, so a level-2 weekday above ~95 clues would be rejected forever. Weekdays run level 1:
  Mon 128, Tue 120, Wed 112, Thu 106, Fri 100, Sat 96. Only the **Sunday Edition (90)** is dug
  past the singles floor by local search and pinned to level 2.
- **Uniqueness is proved twice.** The verifier's policed logical solver only makes deductions
  that follow from the clues, so finishing the grid proves one solution; its exhaustive counter
  (per-cell option sets plus forced singles at every node) re-proves it on every weekday board.
  A Sunday costs the counter ~25s, so Sundays run it only under `verify-giant.mjs --full`.
  `scripts/giant-mutation-test.mjs` breaks the bank nine ways; all caught.
- **The phone has a WHOLE BOARD / ZOOM IN switch** (under 560px, remembered in
  `sot_giant_zoom`, zoom by default). Sixteen squares across 390px are ~22px, half a finger
  target, so the zoomed view plays one 8x8 quarter (two boxes each way) at full size with a
  minimap to move. Selecting a square anywhere brings its quarter into view. **A finished board
  always shows whole**: the finish ripple (`lib/finish-beats.js`, box [4, 4]) wants all 256.
- Client is `mkgiant.py` (not committed), a transform of DiagClient with the diagonal taken out.
- Bank 2026-10-13 to 2026-12-31 (80 boards). Extend with `gen-giant.mjs --until`; it only appends.

## Arrow (`/arrow`) is the ARROW SUDOKU, and a shaft is NOT a house (launched 2026-10-13)

Ordinary 9x9, ordinary boxes, ordinary printed digits, plus ARROWS: each runs from a circle through
a shaft of two to four squares (steps to any of the eight neighbours), and the circle holds the SUM
of the shaft. Key/route `arrow`, category **Sudoku**, `miss: null`, SOLVE_ONLY, first-play hint,
legacy accent fuchsia `#86198f` / navy `#f0abfc`. Wired by `scripts/wire-arrow.mjs` (beside
Mercury in every list). No PNG tiles; glyph in `lib/game-glyphs.js`; share card
`public/og/arrow.png` from `scripts/bake-og.mjs arrow`. Premiere 2026-10-13 to 10-17. The client
is a fork of Mercury with the thermometer overlay swapped for `ArrowOverlay` (a ring, a thin line
and an arrowhead, painted `currentColor` on a `--stg-mute` style colour per the SVG-paint rule),
and it carries Mercury's RunEmbed wiring.

- **A SHAFT IS NOT A HOUSE.** Digits may repeat along one arrow when the two squares share no row,
  column or box, so the arrow rule supplies sums and eliminations only, never a hidden single.
- **The ramp is the printed-given count** with the arrow count stepping up late in the week:
  Mon 28, Tue 25, Wed 22, Thu 19 (nine arrows, shafts 2-3), Fri 16, Sat 13 (ten), **Sunday 8**
  (twelve, shafts 2-4). Measured first: the greedy floor is 11 to 17 with nine arrows, 9 to 13
  with ten, 5 to 12 with twelve.
- **ARROW NECESSITY is checked**: on every board the printed digits read as a plain sudoku admit
  more than one grid. Layout rules: no shared squares, no turn of 90 degrees or more, no shaft
  touching itself, no two diagonal steps crossing.
- `scripts/arrow-core.mjs` + `gen-arrow.mjs` (deterministic, resumable through
  `/tmp/build/arrow-bank.jsonl`) build the bank: 111 days, 2026-10-13 to 2027-01-31.
  `scripts/verify-arrow.mjs` shares no code with the core and `scripts/arrow-mutation-test.mjs`
  breaks the bank eleven ways.
- **The uniqueness counter MUST propagate.** A cell-by-cell search with only a running-sum bound took
  78 seconds on one twelve-arrow Sunday; arrow support plus singles at every node takes milliseconds.
- **In Enter the Dojo's variant pool from 2026-10-14** (owner, 2026-10-13), between Quilt and
  Mercury. The pool's `before` is now a CHAIN (`before.before`), walked by `dojoPoolFor` and by
  verify-circuits, so 10-12 keeps its eight-game pool and 10-13 its six-game pool. Its seed clock
  [470, 1900] is an estimate the adaptive clocks replace.

## Frame and Rim are the GUTTER SUDOKUS, and they share one engine (launched 2026-09-08)

Two sudokus built on Sando's border-clue layout with the gutter on all FOUR sides (an 11x11
grid, the 9x9 in the middle). Both read the same thing, a line's first three cells counting in
from an edge (thirty-six such triples), and print different facts about it:

- **Frame** prints the SUM of the three (6 to 24), all thirty-six of them on every board, the
  way Sando prints all eighteen. The ramp is the digits printed INSIDE the grid: Mon 14 / Tue
  12 / Wed 10 / Thu 8 / Fri 6 / Sat 4 / **Sun 2**. Measured before choosing: under all 36 sums
  a random 8-digit board falls to logic 4 times in 5, a 2-digit board 1 in 7, a 0-digit board
  1 in 50. The verifier also proves the gutter is load-bearing (the digits alone admit >1 grid).
- **Rim** prints the three DIGITS as an unordered set and prints NOTHING inside the grid, ever
  (`given` is all zeros, kept for shape). A full set of 36 triples pins the grid every time with
  singles alone, so the ramp is how many are printed and the blank gutters are the puzzle: Mon
  30 / Tue 27 / Wed 24 / Thu 21 / Fri 18 / Sat 16 / **Sun 13** of 36. Measured: a greedy dig
  bottoms out at 13 to 17 (mode 15), so Sunday is the floor of the rulebook.
- **Neither has a `level` field**, and that is a measured finding as with Sando: every trial and
  banked board falls to the gutter deduction plus naked and hidden singles or does not fall at
  all. Both verifiers assert level 1 exactly. A printed Rim triple is a naked triple handed to
  the player, which is why it is the gentler of the two.
- **One generator, `scripts/gen-gutter.mjs frame|rim`**, on `scripts/gutter-core.mjs`; one
  independent solver library, `scripts/gutter-check-lib.mjs` (Set candidates, house/digit
  branching, policed against the truth), behind `verify-frame.mjs` and `verify-rim.mjs` (a
  file named `verify-*.mjs` is a checker to verify-all, which is why the shared library is not).
  `scripts/gutter-mutation-test.mjs frame|rim` breaks each bank nine ways; all caught.
- **Clients are one transform of DiagClient** (`mkgutter.py`, not committed): the diagonal rule
  out, a `gutterCell` renderer in, the heavy rules moved onto the outer cells since the
  container now wraps the gutter. Selecting a square lights the gutters that speak about it; a
  gutter whose three squares are filled marks itself right or wrong (Frame shows the
  difference, Rim a tick or a cross). Frame's gutter track is 0.66 of a square, Rim's 0.8
  because it carries three digits.
- **Both joined the rotating Sudoku circuit**, pool ten -> TWELVE, `rotate` still 5, so each
  member plays five days in every twelve. Medians are ESTIMATES (rim 600, frame 850). Both sit
  in the 'Edge clue sudokus' set, which is now at its five-key ceiling.
- **Legacy slate hues:** Frame amber #b45309, Rim moss #4d7c0f. The pages wear the Sudoku ramp.

## Diag is the DIAGONAL SUDOKU (Sudoku X), and a diagonal IS a house (launched 2026-09-08)

The tenth fill-in sudoku, after Suds, Quilt, Cages, Sando, Sixes, Mercury, Polka, Knight and
Towers (Whittle, the eleventh Sudoku row, is played backwards). Ordinary 9x9, ordinary boxes,
ordinary printed digits, plus one rule: each of the two long diagonals, corner to corner, also
holds every digit exactly once. The diagonals are tinted and ruled across the grid.

- **A DIAGONAL IS A HOUSE, which is the whole difference from Knight.** The nine cells of a
  diagonal all see each other and between them hold 1 to 9, so hidden singles, locked candidates
  and subsets read off a diagonal exactly as off a row. Generator, verifier and client all carry
  the two diagonals in UNITS (29 houses, not 27) as well as in the peer set. The centre cell sits
  on both and sees 24 cells, more than any other.
- **DIAGONAL NECESSITY is a checked property.** On every board the same clues read as an
  ORDINARY sudoku admit more than one grid, so the rule is never decoration. `scripts/verify-diag.mjs`
  counts solutions a second time with the diagonals off and fails at one.
- **The ramp is TWO measured axes, both pinned per weekday.** `printed` runs Mon 26, Tue 24,
  Wed 22, Thu 20, Fri 18, Sat 16 and **Sunday 14**. `level` is 1 Mon-Thu and 2 Fri-Sun, pinned
  (an easy day must NOT need the harder toolkit, a hard day must). The Sunday count is what the
  rulebook can prove, not a round number: measured on 180 random digs at level 2 the greedy floor
  is 17 to 23 clues (the diagonals touch only 17 of 81 cells, so the rule bites far less than the
  knight rule), and the generator reaches 16 and 14 by ITERATED LOCAL SEARCH, putting two to five
  clues back and re-digging in a fresh order. Thirteen was not reached at level 2 in 2,500
  iterations on six grids. Do not lower the Sunday count without a harder-technique solver.
- **Generator and verifier share NO code**, as with Knight and Cages. `gen-diag.mjs` uses bitmask
  candidates and branches on the emptiest cell; `verify-diag.mjs` uses Set candidates and
  branches on the house-and-digit with the fewest placements, POLICING its logical solver against
  the known solution. `scripts/diag-mutation-test.mjs` breaks the bank nine ways (a diagonal
  repeat at r1c1/r2c2 among them, two cells that share no row, column or box) and every one
  must be caught.
- **Diag joined the rotating Sudoku circuit**, pool nine -> TEN, `rotate` still 5, so each pool
  member plays five days in every ten. Its median (550s, between Suds and Quilt) is an ESTIMATE in
  verify-circuits; replace it at the next re-measure. It sits in the 'Classic sudokus' set.
- **Legacy slate hue is cyan #0e7490.** The page itself wears the Sudoku category ramp.

## Knight is the ANTI-KNIGHT SUDOKU, and the rule has to be LOAD-BEARING (launched 2026-08-28)

The eighth sudoku, after Suds (classic), Quilt (jigsaw), Cages (killer), Sando (sandwich),
Sixes (mini), Mercury (thermo) and Polka (kropki). Ordinary 9x9, ordinary boxes, ordinary
printed digits, plus one rule: no digit may repeat a chess knight's move away from itself,
so a 5 at r4c4 also rules out a 5 at r2c3, r2c5, r3c2, r3c6, r5c2, r5c6, r6c3 and r6c5.

It is the first sudoku here whose extra rule is a **cell-to-cell exclusion** rather than a
region shape, an arithmetic clue on a group, or a relation between neighbours. Nothing is
drawn on the grid and there is no arithmetic anywhere: the constraint reaches ACROSS boxes
instead of inside them, which is why the board can print as few as thirteen digits.

- **⚠️ A KNIGHT SET IS NOT A HOUSE.** The eight cells a knight's move from a given cell do
  NOT see each other, so they carry no "these cells hold every digit" guarantee. The rule
  supplies **eliminations only**: never a hidden single, never a locked candidate, never a
  naked or hidden subset. Rows, columns and boxes stay the only 27 houses. This is the same
  trap Cages documents for cages, and conflating the two produces a solver that calls every
  legal board contradictory. Note that a knight peer CAN share the selection's box (r4c4 and
  r5c6 are both in the middle box), which is why the client paints the knight tint AFTER the
  ordinary peer tint rather than instead of it.
- **KNIGHT NECESSITY is a checked property, not an aspiration.** On every board, the same
  clues read as an ORDINARY sudoku admit more than one grid, so the knight rule is never
  decoration and a board can never be a plain sudoku that happens to have been dug under a
  knight solver. `scripts/verify-knight.mjs` proves it by counting solutions a second time
  with the rule switched off and failing at one. Measured while designing the ramp: this
  holds at every clue count up to 30, so the ramp is not bounded by it.
- **The ramp is TWO measured axes, both pinned per weekday, neither merely capped.**
  `printed` runs Mon 28, Tue 25, Wed 22, Thu 20, Fri 18, Sat 16 and **Sunday 13**, the
  fewest of the week. `level` is 1 (naked and hidden singles) Mon-Thu and 2 (also locked
  candidates and naked/hidden subsets) Fri, Sat and Sun. Level had to be pinned rather than
  capped because at 18 clues a board comes out singles-only about two times in three, which
  is a Tuesday wearing Friday's clue count. The greedy logic floor is 12 to 19 clues
  depending on the dig order, so a Sunday is found by re-digging the same grid rather than
  by regenerating.
- **Generator and verifier share NO code**, as with Cages and Quilt. The generator uses
  bitmask candidates and branches on the emptiest cell; `verify-knight.mjs` uses Set-based
  candidates and branches on the house-and-digit with the fewest placements, and it POLICES
  its logical solver against the known solution so an unsound elimination is reported rather
  than trusted. `scripts/knight-mutation-test.mjs` breaks the bank nine ways and every one
  must be caught.
- **Knight joined the rotating Sudoku circuit**, taking its pool from eight to NINE. `rotate`
  stays 5, so the circuit still plays five a day and each pool member now appears five days
  in every nine. Its estimated median (800s, between Polka and Mercury) is an ESTIMATE in
  verify-circuits; replace it at the next snapshot re-measure.
- **Accent is indigo #3730a3**, the one step left between Sixes' royal blue and Cages'
  purple on the Numbers row.

## Sando is the SANDWICH SUDOKU, and the sums are the whole point (launched 2026-08-13)

The fourth sudoku on the slate, after Suds (classic), Quilt (jigsaw) and Cages (killer).
Ordinary grid, ordinary boxes, ordinary printed digits, plus one rule: the number
printed outside each row and column is the total of the digits lying strictly BETWEEN
that line's 1 and its 9. The 1 and the 9 are the crusts, everything between is the
filling. A clue of 0 says the crusts are adjacent; 35 says they sit at the two ends.

- **Every board carries all EIGHTEEN border sums.** The sums are the game, and a board
  with only a handful of them is a sudoku wearing a costume. So the ramp is the printed
  digits and nothing else: Mon 20, Tue 18, Wed 16, Thu 14, Fri 12, Sat 10, and the
  **Sunday Edition at 6**, so nearly the whole grid has to come out of the clues.
- **There is NO difficulty-level field, and that is a measured finding rather than an
  omission.** The sandwich deduction is a full line-level propagation, and across
  thousands of trial boards it never once needed locked candidates or naked and hidden
  subsets to finish: a board either falls to the sandwich rule plus singles, or it does
  not fall at all. The bank therefore claims the simpler thing, and the verifier asserts
  exactly that. Do not add a `level` field to Sando by analogy with Cages.
- **The deduction, in one sentence:** for a clued line, enumerate every way the sandwich
  could sit (both crust positions, both orientations, every filling that totals the
  clue), keep only the layouts whose digits can actually be dealt to the cells given
  their candidates, and let each cell keep only the digits some surviving layout gives
  it. That is what a person does with a sandwich clue and nothing beyond it.
- **Generator and verifier use SEPARATE solvers**, as with Cages. The generator's
  counter propagates candidates and branches on the tightest cell; the verifier's walks
  cell by cell with a partial-line bound (where could the crusts sit, what is already
  down, can the remaining holes still reach the clue). **Without that bound a six-given
  Sunday board does not finish in three minutes**, so do not "simplify" the verifier's
  counter to test lines only when they close.
- **`Array.prototype.every` passes the VALUE first.** The generator's first logic solver
  ended on `cand.every(solved)` where `solved` takes a CELL INDEX, so `cand[512]` was
  undefined, every wide-open cell reported itself solved, and it certified a board with
  three solutions. Any `solved`/`done` helper that indexes an array must never be handed
  to `every`/`some`/`filter` directly.
- **The board is a 10x10 grid**: the eighteen sums live in the first row and column and
  the 9x9 sits in the corner, with the gutter tracks at `0.66fr` so the grid still reads
  as the subject. The heavy outer rule moved off the container and onto the edge cells,
  because the container now wraps the gutters too.
- **A 0 is an EMPTY SANDWICH, and the copy has to say so.** Zero is not an edge case or a
  quirk, it is the single most useful clue on the board: it says the 1 and the 9 are side
  by side, which cuts that line's possibilities from thirty-six pairs to eight. Every
  reader-facing string that mentions 0 says "the sandwich is empty" rather than leaving
  the reader to work out how a total can be nothing. 35 gets the same treatment from the
  other end: the two at opposite ends with everything else inside.

## Cages is the KILLER SUDOKU, and its clue set is arithmetic only (launched 2026-08-12)

The third sudoku on the slate, after Suds (classic) and Quilt (jigsaw). It keeps the
ordinary 9x9 grid and the ordinary 3x3 boxes, and takes away every printed digit: the
81 cells are partitioned into connected cages of 2 to 5 cells, each printed with the
total of the digits inside it, no digit repeating within a cage, and those totals are
the ENTIRE clue set. A board therefore opens completely empty.

- **The difficulty ramp is the partition, because there is nothing else to turn.**
  Many small cages is generous (a 2-cell cage totalling 4 is 1+3 and nothing else);
  few large ones give the arithmetic room to hide in. Mon 34 cages capped at 3 cells,
  Tue 33/3, Wed 32/4, Thu 31/4, Fri 30/4, Sat 29/4, **Sun 27/5**. Sunday is the only
  day under 29 cages and the only day that prints a five-cell cage.
- **`level` is pinned per day, not merely capped.** 1 = cage combinations, singles and
  the 45 rule; 2 = also locked candidates, naked and hidden subsets, and the 45 rule
  over two leftover cells. Mon/Tue are always 1, Thu-Sun always 2, Wed is the
  crossover. Left as a ceiling, about a tenth of the Saturday boards came out
  solvable with the beginner toolkit, which is a Monday wearing Saturday's cage count.
- **A one-cell cage is banned**: it prints its own digit, which is a given by another
  name, and the whole point of the game is that there are none.
- **The generator and the verifier do NOT share solvers, on purpose.**
  `scripts/cages-core.mjs` is the generator's engine; `scripts/verify-cages.mjs`
  writes its own, with a different counting algorithm (propagate and branch on the
  tightest cell, against the generator's cage-by-cage walk). This is the Quilt rule,
  not the End Game one, and it earned its keep immediately: the verifier's first
  hidden-pair rule was unsound and its first 45 rule was too weak, and a shared solver
  would have agreed with itself about both.
- **The verifier POLICES the logical solver against the known solution.** Every
  elimination is checked: removing the true digit from a cell, or writing a false one,
  is reported as an unsound rule rather than quietly trusted. That is what makes a
  single logical solver enough to certify "no guessing" without a second one.
- **A CAGE IS NOT A HOUSE.** A house holds all nine digits, so a digit missing from it
  is a contradiction and a digit with one spot left is a hidden single. A cage holds a
  SUBSET, so neither inference is available and the only guarantee is that no digit
  repeats. Cages therefore join the naked-subset groups (which need only uniqueness)
  and stay out of every hidden or locked deduction, except for the digits their own
  arithmetic forces them to contain. Conflating the two makes a solver that calls
  every legal board contradictory, which is exactly what the first draft did.

## Sudoku auto-move is the plain next empty square again (owner, 2026-10-27)

The "next most logical square" auto-move (`logicalNext`, 2026-10-26) was reverted on all 18 grids after
player complaints that the cursor "jumps all over the place". Every grid calls its own `nextEmpty(...)`
again, exactly as before that change. `logicalNext` is left exported in `lib/sudoku-auto-advance.js` and
unused; do not wire it back in without the owner asking.
