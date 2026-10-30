# Per-game notes for every other daily (Shards, Pricer, Encore, Scour, Jig, Scram, Shoe, Thread, Finesse, Kids, Snug, Yose, Crib, Duet, Passport, Mahj, Crossed Up, Arcade games, etc.)

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Per-game notes for every other daily (Shards, Pricer, Encore, Scour, Jig, Scram, Shoe, Thread, Finesse, Kids, Snug, Yose, Crib, Duet, Passport, Mahj, Crossed Up, Arcade games, etc.)

## Shards: EVERY MOVE IS FREE (owner rule, 2026-10-13)

Player report: "The accidental locking removing all my points make it not worth it, let us move them OUT of the whole thing again." Both halves were real. Placing any piece silently locked the previously placed one ("wet" -> locked), and moving a locked piece cost a 5-point miss; dragging a placed piece off the board did nothing, so the only way off was tap-tap, which also cost 5. Undo refunded the miss, so the penalty only ever hit players who did not know that.

- **There is no wet/locked state and no miss.** Moving, removing, Undo and Clear are all free. Score = start minus hints, ties break on the clock. Applied from 2026-10-13 itself (owner chose same-day): rows already posted that day keep their misses.
- **Dragging a placed piece anywhere off the board sends it back to the tray**, which lights up as a drop zone while a board piece is dragged. Tapping a selected piece a second time, or the Send back button, does the same.
- **Ticks now read every placed piece.** The wet window existed to stop ticks becoming an oracle; the owner accepted that ticks only report dictionary validity, which a player can judge anyway.
- `misplaced` stays on the saved state and the share/result copy shows misses only when non-zero, so pre-change saves still read correctly. Registry `miss` is now 'Hints'.

## Shards: NO RUN SHORTER THAN THREE, and the word list is a Scrabble list (owner rule, 2026-08-19)

A player asked how ST was a word. It is, in the list Shards validates against, and that
was the whole problem: nothing told them which list that is, and the board was full of
entries only that list would accept.

**Shards checks every run against `public/tuck-dict.txt`, the Collins Scrabble list shared
with Tuck and Babel.** It carries 124 two-letter words, `st ja pe ky xu fy gu ny ch` among
them. So ST validates legitimately, by the code's rule. The rules panel said "a real word"
and no reader-facing string anywhere named the list.

**The generator was supposed to prevent this and could not.** `scripts/gen-shards/common.py`
fills from common words only (wordfreq zipf >= 3.5), which at any ordinary length works
fine. At length 2 it does nothing: **108 of the 124 two-letter words clear it** (st 5.20,
et 4.66, ky 3.77, pe 3.72, ja 3.71), because two-letter strings are inflated by
abbreviations (st = Street/Saint) and by foreign text in an English corpus (ja, si, ka).
Only 16 fall below the bar. Worse, the two-letter slots were the crutch that made the dense
templates fillable at all, so the generator depended on them: the 6x6 templates WITHOUT
short runs filled 0 times in 6 tries, the one with six two-letter slots filled 6 of 6.

**The fix is geometric, because a filter cannot fix a slot that only junk fits.** Three
rules now, all machine-enforced:

1. **No template may contain a run shorter than three letters, or longer than seven** (the
   common pool tops out at 7). Checked at import in `gen.py` (`MIN_RUN`, raises on load) and
   re-proven per board in `scripts/verify-daily-banks.mjs` from `MINRUN_FROM = '2026-08-20'`.
   New templates are machine-searched by `scripts/gen-shards/tsearch.py`, which also SCREENS
   them by filling them: legal is not the same as usable.
2. **The same failure repeats one size up, so length 3 got its own bar.** ING, ONS, ENG,
   REC, TAE, ISH and HEH all clear zipf 3.5. A three-letter fill word must now also be a
   LOWERCASE entry in `/usr/share/hunspell/en_US.dic` and clear zipf 4.0. Pool 505 -> 275.
3. **wordfreq is case-insensitive, so it scores first names like vocabulary** (dan 4.51,
   ted, lee). Only a case-sensitive dictionary separates them, so every length now drops
   words hunspell knows ONLY capitalised, plus explicit `NAMES` and `BRITISH` sets (the
   standing US-spelling rule: HONOUR, CENTRE, DEFENCE and LITRE were all in the pool).

**Two traps worth knowing before touching this again:**

- **`CAP` had to go 900 -> 2100** (the whole zipf>=3.5 pool, not its 900 most frequent
  members). Removing the two-letter slots removes the pressure valve, and at 900 the 7x7
  templates filled 10 times in 48 tries; at 2100, 40.
- **`build_ladder.py` RECYCLES vetted fills from the days it replaces, and a recycled fill
  carries its old vocabulary with it.** The first rebuild came out with 2026-08-21 still
  reading MUD ISH ANA LEE ANN ONS MAS UNI ING, untouched, because that fill was lifted whole
  from the old board and only its PATTERN was checked. A recycled fill must be re-tested
  against the CURRENT pool word by word (`words_current`), not just against the geometry.

**Reader-facing copy now names the list** (`ShardsClient.jsx` rules step and the SEO prose):
answers are checked against a Scrabble word list, it is broader than everyday English, and
archive grids before 2026-08-20 can still turn up ST, JA or PE. **Boards through 2026-08-19
are played and frozen** and keep their two-letter answers; the verifier check and the copy
are both worded for the two eras, per the standing grandfathering rule.

## Herd is the DAILY CROWD SELECTION, and it opens Read the Room (launched 2026-10-17)

Route `/herd`, key `herd`, Crowd Psychology, `miss: null`, legacy hue saddle brown #92400e / #fcd34d. Owner,
2026-10-16: "a series of crowd selections... seeded with answers until 10 reached... rescores throughout the
day... the first puzzle in read the room... A or B, or A or B or C, or A or B or C or D, weighted towards A or B.
10 per day."

- **The game.** Ten questions a day, EVERY ONE A OR B (owner, 2026-10-16: the three- and four-answer
  questions were taken out before launch; `verify-herd` fails any other option count).
  Pick what you think MOST of today's players picked. One point per call that lands with the herd, out of 10.
  No Sunday Edition (owner's ten a day), and no `sunday` field.
- **Scoring is `lib/herd-score.js`**, the one rule for every surface: the herd is the most-picked option counted
  LEAVE-ONE-OUT (your own vote removed), ties at the top pay everyone in them. Board order: points, then herd
  share (summed leave-one-out share of your picks), then earliest (`rankHerd`). Adaptive like the other crowd
  games: recomputed from every pick on every request.
- **House crowd**: each question's `house` is VOTE COUNTS per option (48 in all), from the pool's estimated
  split. In the pool while at most 10 real players are in (`HOUSE_CUTOFF`), then retired for everyone.
- **No table of its own**: ballots go in `outwit_picks` under `herd-M-D-YY` quiz ids. Every reader of that table
  filters by quiz_id. Wired into `/api/quiz/daily-me` (ADAPTIVE), `/api/quiz/crowd-today` (herdGroups) and
  `/api/quiz/daily-combined` (scoreHerdLive, which reuses scoreFeudLive's read with Herd's table and scorer).
- **The bank**: `scripts/herd-pool.mjs` (566 two-way questions written 2026-10-16 in three topics, home / social / world,
  each with an ESTIMATED split) dealt by `scripts/gen-herd.mjs --until <date> --write` (append-only): at least two
  easy and two close calls a day, no topic over five, no two overlapping questions on one day, first question an
  easy two-way, nothing dealt twice. Bank 2026-10-17 to 2026-11-30 leaves 116 pool questions: write more before
  extending. `scripts/verify-herd.mjs` checks the bank and the scorer (mutation-tested on leave-one-out).
- **Read the Room is four rooms from 2026-10-17**: Herd, Outwit, Outrank, Feud, a quarter of 100 each.
  `lib/read-room.js` `HERD_FROM`, `roomKeysFor(iso)`, `roomPartFor(iso)`, `roomScorerFor(iso)`; the circuit carries
  `before: { until: '2026-10-16', keys: [the old three] }` and its scorer is per day, so settled three-room days
  keep a third each. Share codes carry three or four shares; the card names the rooms by count.
- Client `app/herd/HerdClient.jsx` is built off OutwitClient's frame (class prefix `hd-`); a pick on any question
  but the last moves straight on. Wired by `scripts/wire-herd.mjs`; tiles `scripts/gen-herd-tile.py`.

## Aorb (DELETED 2026-10-27, owner: removed from the site completely; /aorb redirects to /crowd-psychology-games). Kept for history only.

## Aorb is the A-OR-B CROWD GAME, two picks a pair, and it plays FULL SCREEN (launched 2026-10-23)

Route `/aorb`, key `aorb`, Crowd Psychology, skill Reading People, `miss: null`, no Sunday Edition (no
`sunday` field). Owner, 2026-10-23: "pick better / more attractive / better value, ten daily, try to match
the crowd. Everyone has to pick both: personal, crowd."

- **The game.** Ten A-or-B pairs a day. On each the player taps **Me** (their own pick) and **Crowd** (the
  side they think most players picked as their own). The CROWD READ pays the leave-one-out share of
  players whose own pick sits on the side called (call the 72 side, earn 72), averaged over ten and
  rounded. The SURPRISE BONUS pays +1 on a pair when the player's own pick is more popular among own
  picks than among crowd calls (both leave-one-out). Day score = read + bonus, posted capped at 100.
  `lib/aorb-score.js` is the one rule for every surface; rank is total, then unrounded read, then earliest.
- **House crowd**: 50 votes per pair as counts [A, B], an authored estimate; it counts as both a pick and a
  call on the same side, so the house alone never pays a bonus. In the pool while at most 10 real players
  are in (`HOUSE_CUTOFF`). An "early read" note shows while fewer than 50 real players are in (owner).
- **No table of its own**: ballots go in `outwit_picks` under `aorb-M-D-YY`, answers as ten `[me, call]`
  pairs. Wired into `/api/quiz/daily-me` (ADAPTIVE), `/api/quiz/crowd-today` (aorbGroups) and
  `/api/quiz/daily-combined` (scoreAorbLive). `/api/aorb` also takes a PEEK (`{ quizId, peek: { i, me,
  call } }`) that stores nothing and returns one pair's split: each pair is revealed as it is answered.
- **The stage (owner, 2026-10-23)**: play is a FIXED full-viewport overlay in the category colour
  (`--stg-acc` ground, `--stg-onramp` ink), phone and desktop, showing ONLY the question and the two
  answers. Each reveal plays a run-end light show (sweep, fills, count-up, burst on the crowd's side) and
  waits for a tap; never auto-advance. A first-time player gets one hint line on pair one only
  (`sot_aorb_hint_seen`). A player who played an EARLIER Aorb first sees their last room SETTLED (final
  score vs score at finish, rank, best read, biggest miss) before today's first pair (owner: only if they
  played one before). Aorb is not in Read the Room.
- **The bank**: `scripts/aorb-pool.mjs` (437 pairs written 2026-10-23 in lanes people, brand, movie, tv,
  book, food, travel, life, sports, music, misc, each with an ESTIMATED split) dealt by
  `scripts/gen-aorb.mjs --until <date> --write` (append-only). Owner rules: exactly ONE "Who is more
  attractive?" pair a day about famous adults, never first; only TWO brand pairs; movies and books in the
  mix (two or three media pairs); nothing an instant reflex (dog or cat was rejected), so no house leader
  past 36 of 50. Day one (2026-10-23) is the owner's own list, pinned in the generator. Bank to
  2026-11-27; brands and everyday lanes run out first, so write more of those before extending.
  `scripts/verify-aorb.mjs` checks the bank and the scorer. Wired by `scripts/wire-aorb.mjs`; tiles by
  `scripts/gen-aorb-tile.py`.

## Scour is the THEMED WORD SEARCH, 15x15 every day (launched 2026-10-15)

Route `/scour`, key `scour`, Word, legacy hue sky #0369a1. Owner, 2026-10-15: "make even the normal day
large, maybe 15x15 daily". One theme a day from Scram's pools (`scripts/scram-pools.mjs`), never Scram's
theme that day and never a word from a Scram board within three days.

- **The ramp is directions, word count and decoys, never size**: Mon 14 words across and down, Tue 15
  adding diagonal down, Wed 16 adding diagonal up, Thu 16 adding backward, Fri 17 adding up, Sat 18 in all
  eight; the **Sunday Edition is 18x18 with 26 words** in all eight. Decoys (a list word's first letters
  planted elsewhere) and overlap rise through the week. Every list word reads in the grid EXACTLY ONCE
  counting all eight directions, so the client checks a line by its letters and no answer key ships.
- **Race the clock**: score is words found, time breaks ties, `miss: null`, `guessesUsed: 0`, in
  `XP_LINEAR_DAILIES`. A wrong line costs nothing.
- **A line is checked on LIFT**: drag (snaps to the nearest of eight directions) or tap first letter then
  last; releasing off the board or Escape throws a line away; tapping the anchor again lets go.
- `scripts/gen-scour.mjs` deals `app/scour/puzzles.js` (`--until` extends and keeps every board,
  `--rebuild` only before launch); `scripts/verify-scour.mjs` is independent. Bank 2026-10-15 to
  2026-12-31. A Scram redeal can clash with Scour's ±3-day word rule; re-run the verifier after one.
  Tile art `scripts/gen-scour-tile.py`; wired by `scripts/wire-scour.mjs`.

## Jig is the DAILY JIGSAW, one Commons photo cut the same way for everyone (launched 2026-10-15)

Route `/jig`, key `jig`, Logic, legacy hue cyan #0e7490. Owner rulings 2026-10-15, all from the mockup
canvas "Daily Jigsaw Mockup":

- **The cut is capped at 80 and kept close to it all week**: Mon 8x6 48, Tue 9x6 54, Wed 10x6 60, Thu 9x7 63,
  Fri 10x7 70, Sat 11x7 77, Sunday Edition 10x8 80. Pieces are drawn LARGE on screen; on a phone the tray is a
  two-row horizontal strip.
- **Real photos**: every day is a Wikimedia Commons FEATURED picture under a free licence (never GFDL-only),
  landscape, scored for detail (no more than a fifth flat) and approved on a contact sheet. The pool is
  `scripts/jig-photos.mjs`; `scripts/gen-jig.mjs` deals it from launch, deterministic from the pool's ORDER,
  so extend the bank by appending to the pool, never reordering. Photos are fetched through `/api/jig/img?n=`
  (Focus's design: Special:FilePath, one-year edge cache, 404 for a day not yet live), which also makes them
  same-origin for the canvas colour read.
- **The empty board shows nothing.** No outline of an empty spot is ever drawn: an outline is its piece's shape.
- **The tray is All, or Sort into two bins**, by Edges (edge pieces / middle) or by Colors (one of four colour
  groups k-means'd from the photo's per-piece averages, named by hue / the rest). Same on the phone.
- **Drag to place**, snap within 0.42 of a piece of its own spot; a wrong drop goes back to the tray for nothing.
  A tap picks a piece for a tap on the board. Pieces never rotate. Placed pieces lock.
- **Scoring is Snug's**: flat 10 on a solve, `miss: null`, the clock decides. Peek shows the picture for a
  moment and adds 15 seconds to the clock (`pen` in the save, included in `timeElapsed`). The free first-play
  hint drops a corner in. In SOLVE_ONLY.
- Wired by `scripts/wire-jig.mjs`. Tile art `scripts/gen-jig-tile.py`. Checker `scripts/verify-jig.mjs`.

## Scram is the THEMED WORD SCRAMBLE, raced on the clock (launched 2026-10-14)

One broad theme a day (Cities, Countries, U.S. States, Food, Animals, Men's Names, Women's Names, Jobs,
Around the House, Sports and Games, Clothing, Nature, Music, The Human Body) and ten scrambled answers from
it. Route `/scram`, key `scram`, Word category, legacy hue rose #be123c. Look: option B of the "Scram
Input Options" canvas, the LIT KEYBOARD.

- **Only the scramble's letters are live.** The keyboard dims every other letter, and a small count marks a
  letter the answer needs more than once. So every full entry uses exactly the right letters, and a full
  wrong entry can only be a wrong ORDER: it shakes and clears. A full answer checks itself; there is no Enter.
- **Back, Next, numbered pips and Skip** (owner, 2026-10-14). The ten can be played in any order; letters
  typed into an answer stay when you leave it. Skip jumps to the next answer still open. On desktop the
  physical keyboard types and the arrow keys move.
- **Race the clock: score is answers solved out of ten, time breaks ties.** Registry `miss: null`, the
  client posts `guessesUsed: 0`, so the board goes straight from score to time. Wrong orders are counted
  locally only. In `XP_LINEAR_DAILIES`: ten independent answers pay linearly.
- **One right answer per scramble.** A word whose letters also spell another member of its theme is never
  dealt (LEMON/MELON, DIANA/NADIA, TOKYO/KYOTO). `scram-pools.mjs` carries an `alsoValid` list per theme of
  real members never dealt, so a clash whose other side the pool does not otherwise carry is still caught.
- **The ramp is answer length**: Mon 5-6, Tue 5-7, Wed 6-7, Thu 6-8, Fri 7-8, Sat 7-9, Sunday Edition 8-12,
  dealt only from themes flagged `sunday` (the names pools are too thin in long names). No answer is dealt
  twice in the bank, and a theme waits five days before it returns.
- **The scramble hides the answer**: never the answer, never its first letter first, at most a quarter of the
  letters in place, and no three-letter run of the answer intact. A word no shuffle can hide (REFEREE) is
  dropped from the pool rather than dealt weakly.
- `scripts/gen-scram.mjs` deals `app/scram/puzzles.js` from `scripts/scram-pools.mjs`; extend with
  `--until <date>`, which keeps every existing board byte for byte. `scripts/verify-scram.mjs` is independent
  (imports nothing from the generator) and re-checks every rule above. Bank 2026-10-14 to 2026-12-31.
- Client `app/scram/ScramClient.jsx` is built off GarbleClient's frame. Tile art `scripts/gen-scram-tile.py`.

## Encore is the BIG crossword, and its entries stop at 7 letters (launched 2026-08-27)

Emcee is the 5x5 mini you finish in a minute. Encore is the one you sit down with: a
**9x9 on weekdays** (24 to 30 answers) and an **11x11 Sunday Edition** (around 44).
Same engine and same scoring as Emcee, so what follows is only what differs.

**It inherits Emcee's hard rule: THE CLUE COMES FIRST.** A word can only enter a grid
if a hand-written crossword clue for it already exists in a bank file, and there is no
code path that invents one. Two banks are read, `scripts/emcee-wordbank.txt` (3, 4, 5
and 7 letters, shared with Emcee) and `scripts/encore-wordbank.txt` (the lengths the
mini never needed), for a union of about 9,970 clued answers.

**NO ENTRY IS LONGER THAN 7 LETTERS, and that is a measured decision rather than a
shortfall.** A fully checked 9x9 is legal far more often than it is fillable from a
bank this size, and the binding constraint is the longest entry: shapes whose longest
answer is 7 fill 9 times in 10, shapes carrying a 9-letter spanner fill 0 times in 10.
A nine-letter answer crosses nine downs, and ten thousand words is an order of
magnitude thinner than the lists commercial fill software runs on. Seven is where this
bank is deepest (3,193 answers, more than any other length). The 8 and 9 letter entries
are authored and sitting in the bank for a future, deeper version; do not raise the
ceiling without widening the pool first, and re-screen the shapes if you do.

**Shapes are SCREENED, and the screen is the expensive half of the build.**
`scripts/screen-encore-shapes.mjs` enumerates every symmetric, fully checked, connected
shape in range and then tries to FILL each one, keeping only those that come out inside
a small budget; the survivors live in `scripts/encore-shapes.json`. Screening does not
depend on the calendar, so it is done once and kept, and `build-encore-bank.mjs` only
ever fills shapes already known to be fillable. Roughly half the legal shapes are worth
keeping, so widen the pool by re-running the screener, never by loosening the geometry
checks.

**The build is RESUMABLE** (`scripts/.encore-progress.jsonl`, gitignored), because
filling sixty boards is minutes of work and it gets harder as it goes: answers reach
their use cap and drop out of the pool. Re-running picks up where it stopped.

**The filler is bitset constraint propagation with arc consistency, and both halves are
load-bearing.** Intersecting only the slots that directly cross the word just placed is
nowhere near enough on a 9x9, the pressure has to travel: whenever a slot's candidate
set shrinks, the letters still possible at each of its squares are recomputed and
pushed out to everything crossing them. Without that the search does not finish a
single 9x9 in two hundred thousand nodes; with it most boards fall in a few thousand.
Two traps worth knowing, both of which cost real time here. A `Uint32Array` element is
an unsigned NUMBER, so the standard popcount needs `| 0` first or every word with bit
31 set returns nonsense and the search reports every slot dead at depth zero. And
truncating a candidate list makes the search INCOMPLETE, so a truncated branch that
dies is not evidence the shape is unfillable, which is how a perfectly good shape pool
came to look like a dead one.

**Verify with `node scripts/verify-encore.mjs`**, which imports nothing from the
generator on purpose. It re-derives the geometry, the numbering, the slot list and
every answer from the raw grid rows with its own code, then checks: symmetry, full
checking (every run 3 to 7 in both directions), connectivity, that each stored clue is
the bank's clue FOR ITS OWN ANSWER, no answer twice in a grid, the use cap, the
shared-answer ceiling between boards, no shape repeat inside a week, and that the
quizId, dateLabel, size and sunday flag all agree with the live date.

**Not in a circuit.** `lib/circuits.js` caps the Crosswords circuit at five games and
it is already full, so Encore sits outside it; its blurb was changed at launch from
"every crossword on the site" to "five crosswords", because the claim stopped being
true. Whether Encore should take a slot there is an owner call.

## Cipher is ADDITION ONLY, and the addend count carries the week (owner rule, 2026-08-08)

Subtraction was RETIRED from Cipher and the per-letter candidate rack came off the board.
Both changes are permanent; do not reintroduce either.

**No more subtraction.** Never author another `op: "sub"` puzzle. A borrow column reads as an
error rather than a step, and the minuend/subtrahend framing buried the one thing the game is
actually about, which is carrying. The eight subtraction drops that already went live (nums 8
through 22) are GRANDFATHERED: they are played, scored, and still replayable from `/cipher?p=N`,
so `CipherClient.jsx` KEEPS its subtraction renderer, its `opGlyph`/`opWord`/`carryWord`
branches, and the `sub` branch in `solveCount`. Deleting that code would break the archive.

**The addend count is the new variety axis, and it ramps by weekday:**

| Day | Addends |
|---|---|
| Mon / Tue / Wed | 2 (`WORD + WORD = WORD`) |
| Thu / Fri / Sat | 3 |
| Sunday Edition | 4 |

Inside each band the days still ramp by measured difficulty, so Monday is the easiest two-addend
board of the week and Saturday the hardest three-addend one. `scripts/verify-cipher.mjs` enforces
all of it from `ADDITION_ONLY_FROM = '2026-08-09'`: op must be `add`, and the addend count must
match `ADDENDS_BY_DOW`. Everything before that date is grandfathered, including the old strict
add/sub alternation rule, which now applies only inside its own window.

**Theme rule.** Every word in an equation comes from ONE theme (animals, weather, land, plants,
food, house, town, time, space, craft). That is what makes a board read as a phrase, URANUS +
EARTH + SUN = SATURN, rather than a bag of letters. No theme two days running, no theme past 7
slots in a bank, no word more than 3 times, no two boards sharing 2+ words, and no board holding
two words that share a four-letter stem (no ROAD + ROADS, no LATE + LATER).

## Pricer (`/pricer`): eligibility, pricing basis, and the reveal rolodex

Pricer is the daily price bracket: sixteen real things from one category (thirty-two on Sunday),
one money question for the whole day, and picks that propagate like a pool sheet. The engine is
forked from Bracket. What follows is what makes a Pricer BOARD correct, which is a different
problem from what makes the bracket work.

The whole section exists because the launch bank, built 2026-08, shipped fabricated NFL salaries
(Kyler Murray at $51M against a real $1.3M), a Volvo priced two different ways four days apart,
three discontinued game consoles, and thirty consecutive boards asking the same question. Every
one of those was mechanically checkable. `scripts/verify-pricer.mjs` now checks all of them.

### The eligibility rule: buyable AND observable (owner rule, 2026-08-09)

**Every Pricer item must be a thing a person can buy, at an observable price.** Two tests, and an
item has to pass both.

- **Buyable.** Could you put it in a cart, book it, or sign up for it? A salary, a net worth, a
  market cap or a median home price is a number *about* a thing, not a price tag on one. BANNED:
  athlete salaries, contracts, earnings, revenues, box office, endowments, and any median or index.
- **Observable.** Is the price printed on a page the SELLER controls, and will it still be that
  number tomorrow? BANNED: resale and auction figures (Pappy Van Winkle's $4,200 secondary price
  against a ~$300 shelf price), dynamic event pricing (concert and Broadway tickets, ski lift day
  rates, movie tickets. Verified 2026-08: no major US cinema chain publishes a rate card, and all
  five Vail Resorts properties publish pass marketing and no day rate), quote-only pricing (Equinox
  publishes no membership rate), and headline rates (the $100,000-a-night Palms suite is a press
  release, not a booking).

**This is the line between Pricer and Bracket.** Bracket compares measurements: lake area,
population, home runs. Pricer compares price tags. A board of big numbers about things is a Bracket
board wearing a dollar sign. Eligibility is NOT machine-checkable; enforce it at review.

### Values are CENTS (`unit: 'usdc'`)

`value` is an integer number of cents, never dollars. This is not cosmetic. The cheapest boards to
gather are single-source ones (a chain menu, a transit fare table, a subscription pricing page), and
those live inside a narrow band where whole dollars collide constantly: the entire Starbucks menu
holds only 8 distinct whole-dollar prices, Dunkin' 9, and every US transit base fare sits between
$1.25 and $3.00. A tie makes a matchup unanswerable and hard-fails the verifier, so whole dollars
would cost the game its whole cheap tier. `fmtValue` shows cents only when the figure has them, so
$40.00 renders as `$40`.

### One pricing basis per board, declared (`basis`)

`basis` is REQUIRED and is one of `'msrp'` (the brand's own list price), `'street'` (current retail),
`'rate'` (a published rate or fee), `'delivery'` (a marketplace menu price). **Never mix two bases
inside one board.** A drip coffee board that mixed list price for some items with street price for
others came out with 12 of 16 wrong and its entire podium inverted; that was not carelessness, it is
what mixing bases does, because the two produce different orderings. The basis renders to the reader.

`'delivery'` exists because McDonald's, Starbucks, Chipotle, Dunkin' and Cheesecake Factory publish
no prices on any site they control. Their boards are gathered from DoorDash at a pinned market and
labelled as such. That is honest and observable; it is just not the menu price.

### `gathered` is the real date, and it is reader-facing

`gathered: 'YYYY-MM-DD'` is the date the prices were actually read. It renders on the board and on
the reveal as "Prices checked <date>", not just in the rules panel where nobody looks. **`asOf` was
retired and the verifier hard-fails any board still carrying it**: two date fields where one is real
and one is a hand-written label is exactly how a board came to say "August 2026" over year-old NBA
figures. The verifier fails a board going live more than 90 days after it was gathered and warns
past 45, which is what forces a re-gather rather than letting a banked board rot to its live date.

### Gathering: cost, and the shortcuts that cut it

Measured 2026-08-09: a 16-item multi-brand Amazon board costs **~26 minutes and ~114 fetches**. The
cost is not the sixteen prices, it is the sixteen different page structures. Shortcuts, in order of
saving:

- **One-source boards.** A chain menu, a fee table, a subscription pricing page or one brand's whole
  lineup is 1 to 15 fetches instead of 114. Measured: 19 such boards cost ~130 fetches TOTAL.
- **Shopify `/products.json`** returns a DTC brand's entire catalogue with prices in one call.
- **Variant boards** (one product line across sizes or configs) beat competitor boards, and play
  better: everyone knows a Ferrari beats a Miata, nobody knows what the 512GB step costs.
- **Skip the separate ASIN pass** on non-Amazon boards; a brand page gives price and link together.
- **Author for spread.** Items 2x apart tolerate a 10% price error without flipping the order.

Maintenance matters more than the build: MSRP moves yearly, Amazon street price moves daily. Weight
the bank toward `msrp` and `rate` boards. Cap shoppable boards (Amazon or brand-linked) at **2 to 3
per week** (owner rule, 2026-08-09); the rest come from menus, fees and tier tables.

**Amazon blocks `web_fetch` entirely** (empty body). The only route is the connected Chrome running
same-origin `fetch('/dp/<ASIN>')` from inside an amazon.com tab, which is also ~10x cheaper on
context. **Never trust an Amazon search title to identify a SKU**: only the `Item model number` on
the `/dp/` page settles it. And read the SELLER's page, never a tracker. A re-verify pass against
provider pages changed nine figures, including three Dropbox/Box "monthly" prices that were annual
rates and two Google One tiers that no longer exist.

### The reveal rolodex (`app/pricer/PricerRolodex.jsx`)

The reveal renders every item on the board as a card you can step through: rank, name, real price,
where it landed on your sheet, and a buy link. The spine rail doubles as a bust map. It replaced a
three-item "Shop these on Amazon" strip that named only the top three by price (which on a `min`
board recommended the three most EXPENSIVE items on a board about cheapness) and that rendered on
no board at all, because the launch bank shipped 560 items and zero ASINs.

Links come from `shop` on the board plus a per-item key: `shop: 'amazon'` with `asin`, or
`shop: 'brand'` with `url`. Affiliate links carry `rel="noopener sponsored"` and the `cgurus-20` tag.
A board with neither still renders; the cards just carry no buy button. **Never guess an ASIN.**

### `family` caps topic repetition

Every board declares a `family`. At most 2 boards per family per bank, never two within 10 days, and
no two boards may share more than 3 items. The first bank ran four car boards, three footwear boards
and a Luxury SUVs board that was largely a subset of Cars, Full Range.

### Direction variety

At least 15% of boards must ask "which costs LESS" (`dir: 'min'`) and no run of one direction may
exceed 4. Cheap categories carry `min` best: groceries, drugstore basics, fast food, transit fares.

### The moved-on chip lane (Pricer only, since 2026-08-11)

The "Beaten so far" column and the two contender cards are separate flex lanes that must stay
visually aligned. Four things keep them so, and all four were broken until 2026-08-09: the history
lane needs the SAME `gap:10px` the bout lane has (without it the two chip groups split the lane
height evenly while the cards split it with a gap, so they sit ~5px off in opposite directions);
`.hgroup` needs `min-height:54px` to match `.card`; `.lane` needs `padding-top:12px` because the
lane header is absolutely positioned at `top:-2px` and otherwise sits over the first chip; and the
chips clamp to two lines rather than `nowrap` + ellipsis, because Pricer's item names are product
names and truncated to ~16 characters in the old 132px column. Pricer's history column is 150px.

**This lane is Pricer's alone now.** It was shared with Bracket until 2026-08-11, when Bracket's
board was reverted to the full visible bracket tree (owner call: seeing the whole bracket is the
point of that game). The zoomed-in arena went with it, and the chip lane was part of the arena, so
there is no Bracket copy of this CSS to keep in sync. Do NOT go looking for one, and do not
reintroduce the arena into Bracket to restore the pairing. Pricer keeps the layout unchanged.

## Shoe deals at least TEN hands a day, off TWO decks (owner rule, 2026-09-29)

From 2026-09-30 a weekday Shoe is **10 hands off a 72-card cut of a two-deck shoe** (32 cards
never in play) and the Sunday Edition is **14 hands off the entire 104-card double deck**.
Boards through 2026-09-29 are single-deck (5 off 36, 7 off 52) and frozen; they carry no
`decks` field, and `shoeFor(seed, count, decks = 1)` still deals them byte for byte.

- **One deck cannot hold ten hands.** Measured over 300 shuffles, the worst legal line of a
  ten-hand day needs 51 to 67 cards (p90 62), fourteen hands need up to 89. Every banked
  shoe is still PROVEN to fit every legal line by the exact ceiling search.
- A two-deck shoe holds every card code twice, so nothing may assume a code is unique.
- **Every size the client prints is read off the board** (`PUZZLE.hands`, `.shoe.length`,
  `.decks`), because the archive replays both eras.
- `scripts/verify-shoe.mjs` checks each board against its era (`TEN_HANDS_FROM`) and fails
  any day from that date with fewer than ten hands. Extend the bank with
  `node scripts/gen-shoe.mjs --from <next day> --days N --startnum <next num> --seed <above the last> --keep`,
  which carries every earlier board and proof over untouched.
- Doubling the length pushed Table Games to ~450s, so Shoe moved to the back of that
  circuit and **Full Table went bronze -> silver** (owner ruling, same day). Its clock in
  `verify-circuits` is an ESTIMATE (200s); replace it at the next snapshot re-measure.

### Shoe splits pairs from 2026-10-17, and the table never reflows (owner, 2026-10-16)

- **Split** is a fourth action on boards carrying `split: true` (every board from
  `SPLIT_FROM = '2026-10-17'`; earlier boards have no flag and replay byte for byte, proved by
  replaying every banked line and 40,000 random strings through the old and new engine). A
  same-RANK pair splits once into two 10-chip seats played in order (the first takes its second
  card at once, the second when the first finishes), double after split allowed, split aces one
  card each, a 21 after a split pays even money, no resplit. The action string uses `P`; no
  separator is needed because a finished seat cannot act. The dealer draws only if a seat stands.
- **Engine:** `replay(shoe, nHands, acts, { split })`, `playPolicy(..., opts)`, and
  `basicAction(p, up, canDouble, canSplit)` with the S17 DAS pair chart (`splitsPair`). A split
  hand's record carries `split`, `parts` (the seats) and `active`; `rec.p` is the seat in play.
- **Generator and verifier both search splits** (`ceilingOf(shoe, n, allowSplit)` and the
  verifier's own `exactCeiling`, plus a literal `PAIR` matrix). Boards 2026-10-17 to 11-19 were
  regenerated with `--from 2026-10-17 --keep`. A future extension must keep `SPLIT_FROM`.
- **The table is steady by construction.** One card size per viewport (`cardSize`); a long row
  FANS (`Fan`) instead of shrinking; the dealer's total and yours are matching fixed-width chips
  on one line between the two rows (dealer in ink, you in the accent); the action area is a fixed
  status line plus a fixed button row in every phase. Measured: the felt and the action area hold
  one height across a whole day of hits, stands and deals. Do not reintroduce per-count card
  widths or chips beside the cards.

## Thread (`/thread`) — nine films described badly, one hidden thread (launched 2026-09-01)

Key/route/folder `thread`, category **Trivia**, registry `miss: 'Wrong calls'`, accent
`#8b2c6b` / navy `#e9a3d0`. Day 1 is 2026-09-01 (the Tom Hanks board from the design
study, https://claude.ai/code/artifact/a844b779-3b92-4318-bc73-47ec73b9503a), bank runs to
**2026-09-13**, with Sunday Editions on 9/6 and 9/13. Wired by `scripts/wire-thread.mjs`
(anchored on the `focus` rows, idempotent) off a same-step `git archive FETCH_HEAD` export.

**The game.** Nine tiles, each a LOGLINE: a true, useless one-sentence description of a
film by someone who watched it and missed the point ("A delivery man takes four years to
deliver one package"). Type titles in any order, no penalty for a miss; the box matches on
every keystroke through `app/thread/match.js` and clears on a hit. Every film is a point.
The tenth answer is the THREAD, what all nine share (an actor, a director, a year, a city,
a way of ending), called at any moment: **+6 with a third or fewer of the board still
open, +4 with up to two thirds, +2 after that**; three wrong calls lock it at 0 and the
films still score. Score /15. Part of every board is PLANTED to read as a false thread,
and a wrong call that names a planted one says how many tiles it covers ("Spielberg covers
3 of the 9"), which is information, so it is worth a strike. **No hints of any kind**
(owner, 2026-09-01): the letter-pattern reveal shipped at launch and was pulled the same
evening, because an underscore count gives a title away; the sentence is all a player
gets. Give up locks an uncalled thread; once every thread has landed the same control
reads "Reveal the rest" and keeps the score.

**Sunday Edition:** sixteen tiles, two threads of eight, interleaved. A call names either
thread and its eight light up. Score /28, tiers by thirds of sixteen (0-5 / 6-10 / 11-16).
The design study's "assign the eight before a thread pays" sort step was NOT built; a
landed thread reveals its own tiles.

**Ranking.** The board posts `progress` = tiles still open when the thread was called
(summed over both calls on a Sunday), so the comparator runs score, then earlier call,
then clock, with the wrong-call count skipped as the standing `progress` rule requires.
First attempt stands. The abandon flush is gated on `acted` (a tile solved or a call
made), so opening the page and leaving files nothing.

**Authoring, all enforced by `scripts/verify-thread.mjs`:** a logline never contains its
own title, any of its keys, or any thread key; the true thread covers every tile and every
decoy strictly fewer; no film returns inside 60 days and no thread ever returns; the
collision audit runs each title through the REAL matcher and requires it to credit its own
tile and nothing else (that caught 'e t' firing inside "the third", so a multi-word key
under four characters is token-only); Sunday flags sit on real Sundays. No facts to
freeze, no dictionary. The sentence is the craft: a flat summary is a dead tile.

**Two things done on the way.** Links' registry tag and rules copy said "hidden threads";
two games cannot both mean "thread" with only one called that, so Links says **groups**
everywhere a reader sees it (registry, grid, strip, promo, end card, archive card, its own
page metadata and share text, the OG card). And `lib/game-glyphs.js` gained `thread` (a
strand with one loop) plus the `focus` glyph Focus had shipped without; the PNG tiles
under `public/games/` are single-colour fallbacks for the legacy grid only, the stage
surfaces draw the glyph.

**Not in a circuit** (Gauntlet is at its cap and Thread is not a question bank), not in
the Daily Five bank. Share text carries one logline and never a title or the thread.

## Finesse (`/finesse`) — the daily double dummy (launched 2026-09-03)

Key/route/folder `finesse`, category **Cards** (the fourth, after Taire, Hands and Shoe), registry
`keepsAnswer: true` and `miss: 'Tries'` (Check and Turn manners: a deal cannot be failed, only paid
for), legacy accent `#4c1d95` violet / navy `#c4b5fd`. **That pair is NOT the page colour.**
`cat: 'Cards'` resolves through `lib/category-ramp.js` to magenta, `#e879f9` dark and `#a21caf`
light, and that is what paints the stage, the CTA and the table edge; the `color` pair is only the
legacy slate-row hue every registry row still carries, chosen to sit apart from Hands `#7f1d1d` and
Shoe `#0c4a6e` in that one table. Day 1 is **2026-09-03**, bank runs to **2026-11-19** (78 days,
seed 20260903). Wired by `scripts/wire-finesse.mjs` (33 anchored edits, idempotent). Premiere window
9/3 to 9/7. No PNG tile; `lib/game-glyphs.js` has `finesse` — four hands round an empty middle,
which is the one card board Hands, Taire and Shoe do not already draw. Share card is a static
`public/og/finesse.png`.

**The game.** All four hands face up, one suit trumps, and a contract naming how many of the tricks
South must take. The player holds South AND the dummy at North; East and West are played by an exact
double-dummy solver. Three rules and no bidding: follow suit if you can, the highest card of the
suit led wins, a trump beats anything that is not one. Coming up short rewinds the board to trick
one and costs a try; the clock keeps running and is the tiebreak. Points 10 / 8 / 6 / 4 by try.
Finesse stays OUT of `DEFEAT_GAMES`, like Hands.

**THE DECK IS THE WEEK, and it is the idea worth keeping.** A reduced, exactly-dealt deck: ace down
to the day's lowest rank, four suits, R cards a hand and 4R in the deck, so every card a player can
see is every card there is. Mon 4 ranks (J Q K A) and no trumps, an entry problem; Tue 5 no trumps,
order and unblocking; Wed 5 with trumps, the first ruff; Thu and Fri 6, with a REAL finesse required
(the generator checks the geometry: South leads a card West can beat and North holds one card above
West's honour and one below); Sat 7; **Sunday Edition the full 8** (`sunday: true`, listed in
`lib/sunday-editions.js`). The ramp adds cards, never rules.

**One engine, three consumers.** `lib/finesse-core.js` holds the solver and is imported by the
generator, the verifier AND the browser. That is deliberate: the defence a player meets and the
defence a contract was proved against must be the same program, or "proved" means nothing. It is
also why **the winning line is never banked** — the client re-derives it with the same solver when
the archive asks for it, so there is no second copy of the answer to drift.

**⚠️ EVERY JS BITWISE OPERATOR IS 32-BIT SIGNED, and a Sunday deck is exactly 32 cards.** A full
32-card mask fills bit 31 and comes out as `-1`. The solver is fine with that (it only ever tests
and clears bits, and `bits()` shifts with `>>>`), but any check comparing a mask to a positive
literal silently fails on Sundays and passes the rest of the week. The verifier's completeness
check therefore works on card NAMES, never on masks.

**Banking is a search and the cost is all Sundays.** Keep a deal only if, with South on lead, best
play against best defence takes exactly `target`; South has at least four distinct choices at trick
one and EXACTLY ONE of them still makes it; and at least two decision points have a single answer.
The order of those tests is the whole runtime: the trick-one test runs off the SAME solver instance
the target came from, so its table is warm and each card is a lookup, and the full line analysis
only ever runs on a deal that already passed. A 6-card deal solves in ~15ms and an 8-card one in
~220ms, so a weekday banks in seconds and a Sunday takes minutes.

**`sep` is the difficulty dial and it is MEASURED**: the trick at which the only winning play first
separates from the alternatives. 1 is the hardest a deal can be.

**Exactly one opening CHOICE, not one opening card.** Leading the eight or the nine from a bare 8-9
is one decision, and the fast solver collapses touching cards into one move. `scripts/verify-
finesse.mjs` rebuilds those equivalence classes from scratch and asserts every card in a class
scores the same, which is what proves the reduction is sound on each deal. It re-solves all 78
boards with a solver that has NEITHER the equivalence reduction NOR the move ordering, and on the
4- and 5-card decks a third time with no pruning at all. 1,740 checks, ~35 minutes, run it alone:
it and `next build` together will OOM an 8GB box.

**The client warms the table while the player reads.** One `makeSolver` per deal, and a `boundary()`
call on mount. The expensive search is the FIRST one; a double dummy is stared at for several
seconds before the first tap, so by the time a card is played the defence answers instantly for the
rest of the hand. Without it a Sunday pauses about a second in the middle of trick one.

## Sums (`/sums`) — the daily kakuro (launched 2026-09-03)

Key/route/folder `sums`, category **Numbers**, registry `miss: null` (nothing counts against you,
a solve is a flat 10, the clock decides the day, exactly Sixes' manners), legacy accent `#be185d`
rose / navy `#f472b6` (the one hue the Numbers row lacked; the stage paints the category step).
Day 1 is **2026-09-03**, bank runs to **2026-11-19** (78 days, seed 20260903). Wired by
`scripts/wire-sums-hinge.mjs` (anchored on the `blitzed` rows, idempotent, shared with Hinge).
Premiere window 9/3 to 9/7. No PNG tile; `lib/game-glyphs.js` has `sums`. Share card is a static
`public/og/sums.png` from `renderSumsCard()`. Design study with both games:
https://claude.ai/code/artifact/54faaf20-7b2a-4f48-83bf-444b1388c924.

**The game.** A crossword-shaped grid. Row 0 and column 0 are black; a black square prints the
total of the run to its right (top right) and/or the run beneath it (bottom left). Fill every run
with digits 1 to 9 that add to its total, no digit repeated inside a run. Weekdays 7x7, the
**Sunday Edition 11x11** (`sunday: true`, listed in `lib/sunday-editions.js`). Selecting a square
lights its two RUNS, not its row and column; the pad greys digits already placed in either run;
and the **combo line** under the board lists, for each run the square sits in, the digit sets
that can still finish it given what is placed (a set is live only if it contains every placed
digit). That line is the whole tutorial: 3 in two is 1+2, 24 in three is 7+8+9.

**The bank** (`app/sums/puzzles.js`, `sol` with 0 for black, `across` and `down` totals at the
run heads, measured `whites` / `fixed` / `runs`). `scripts/sums-core.mjs` is the engine and
`scripts/gen-sums.mjs` the generator: draw a symmetric black pattern and REPAIR it (random
blackening is illegal 97 times in 100), fill the whites, then **search the filling** (`refine`):
change one digit at a time and keep the change when run-by-run candidate propagation leaves fewer
cells undecided. A random filling is unique about once in 700 at 7x7; the search reaches zero
undecided cells, which is both the no-guessing proof and the uniqueness proof, in about a fifth of
a second (bitmask candidates plus a memoised per-run enumeration; the Set-based first draft was
50x slower). An independent counting solver then confirms exactly one filling.
`scripts/verify-sums.mjs` shares NO code with the core: it re-derives geometry, totals, symmetry,
connectivity, uniqueness (cell-by-cell counter) and no-guessing (array-based deduction), and the
ramp. Ramp, whites / fixed runs: Mon 22 / >=4, Tue 22-24 / >=4, Wed 24-26 / >=3, Thu 26 / >=3,
Fri 28 / <=5, Sat 30 / <=5, Sun 62-72 / <=12. The bands were set from a measured distribution
(the search lands 2 to 9 fixed runs on 12 to 20 at 7x7). Not in a circuit, not in the Daily Five.

## Hinge (`/hinge`) — the daily compound-word chain (launched 2026-09-03)

Key/route/folder `hinge`, category **Word**, registry `miss: 'Detours'` (`MISS_ONE` has
`Detours: 'detour'`), legacy accent `#4f46e5` indigo / navy `#a5b4fc`. Day 1 is **2026-09-03**
(FIRE > PLACE > MAT > BOARD > GAME > PLAN, the chain from the design study, pinned by `--first`),
bank to **2026-11-19**. Wired by `scripts/wire-sums-hinge.mjs` (anchored on the `rung` rows).
Sunday Edition: eight words, six to fill, one middle word printed (`reveal`, index 3 or 4).
Share card `public/og/hinge.png` from `renderHingeCard()`.

**The game.** Six words in a chain; the first and last are given with the letter count of every
word between; every neighbouring pair must be a compound word or a common two-word phrase read
downward. **ANY chain the vocabulary accepts counts**, not only the setter's, and the end card
shows yours beside the setter's. A real word that does not hinge is a **detour**: it stays on the
board struck through on the link and is the tiebreak (`guessesUsed`); the clock is the score. A
string not in the word list (`/crux-words.txt` unioned with the vocabulary, with Crux's
stand-down rule for a thin length), the wrong length, or a word already in the chain costs
nothing. **Tapping a placed word clears it and everything below it for free**, and the board says
the moment no chain can reach the end from where you are (`completion()` in the client), so a
dead end is never a trap. The hint places the next word of a chain that reaches the end, and on a
dead end names the problem instead of spending itself.

**The vocabulary is `scripts/hinge-pairs.txt`**, one `FIRST SECOND` pair a line, hand curated
(about 1,880 pairs). `node scripts/gen-hinge.mjs --pairs > lib/hinge-pairs.js` is the client's
copy and the verifier fails when the two drift. A pair belongs only if an ordinary reader would
say the two words go together unprompted; a false split (MUSH ROOM, KID NAP, CAT NIP) was cut.
`scripts/gen-hinge.mjs` walks the pair graph at random, counts every chain between the same
endpoints under the same letter counts (and the Sunday reveal), and keeps a day only at **1 to 4
chains**; variety is no word inside 7 days, no hinge inside 21, no endpoint inside 21. The first
draft ran 14 / 30 / 30 and exhausted a 700-pair vocabulary after 24 days, which is why the list
doubled and the windows narrowed. `scripts/verify-hinge.mjs` re-parses the text file, rebuilds
the graph, recomputes `paths` with its own search and re-checks every window. Not in a circuit,
not in the Daily Five.

## Blitzed (`/blitzed`) — Blitz with a third number on every line (launched 2026-09-03)

Key/route/folder `blitzed`, category **Numbers**, registry `miss: 'Asked'`, legacy accent
`#3f6d1f` / navy `#a8e063` (the stage paints the Numbers category step, like every daily;
the pair only feeds pre-stage surfaces). Day 1 is **2026-09-03**, bank runs to
**2026-11-19** (78 days, the same end date as Blitz), seed 20260903. Wired by
`scripts/wire-blitzed.mjs` (anchored on the `blitz` rows so the two sit together in every
ordered list, idempotent) off a same-step `git archive FETCH_HEAD` export. Premiere window
9/3 to 9/7 in `PREMIERES`. **No PNG tile** (owner, 2026-09-03: icons are gone, the glyph is
the icon), so `public/games/btn-blitzed.png` does not exist and the `img` fields the legacy
rows carry point at nothing; `lib/game-glyphs.js` has `blitzed` (Blitz's bolt over three dots).

**The game.** `app/blitz/BlitzClient.jsx` with the key, the copy and the clock changed:
same twenty problems in five rounds of four, same one life, **twenty seconds** a problem
where Blitz gives fifteen (owner's call; a second operation earns five more). The rule that
makes it a different game: **every line has exactly three operands and two binary
operations**, `5 + 10 × 2` and never `47 × 6`. A square, a cube or a root decorates an
operand and is not an operation, so `13² + 4 × 7` is a line and `13² + 8` is not. "p% of x"
and "n/d of x" are two operands joined by "of". The verifier counts all of this on every
problem, from the printed string.

**The bank** (`scripts/gen-blitzed.mjs`, `app/blitzed/problems.js`, ids `z<day>p<slot>`,
quizIds `blitzed-M-D-YY`). Thirty-four families, each in exactly one tier, four per round
from different families with one operation per round (the `sig` rule from Blitz). Round one
is chains that read left to right and mean it (`a + b + c`, `a − b − c`, and `a × b + c`,
which gives the same answer under either rule so precedence is not yet demanded); round
two brings `a + b × c` and `a − b × c`; three adds brackets, `a ÷ b ÷ c`, `a + b ÷ c`, a
percentage with a tail and `n² + a × b`; four has `(a − b) × c`, structured two-digit
products with a tail, fractions, `a × b ÷ c`, `a × b × c`; five is awkward two-digit
products, `n³ + a × b`, big squares, `√n + a × b`, `(a + b) ÷ c`. Blitz's anti-sieve rules
(tight / sane / digit), sorted-position balance and per-day A-D balance all carry over
unchanged. The distractor Blitz does not have is **the dropped third term**: doing the first
operation and stopping. It is listed first on most families because it is the mistake a
third element invites, and the About prose says so. Guards added on the first read of the
output: no `43 + 5 − 5` (equal second and third terms are refused), no `40 ÷ 2 ÷ 2` in
round three (`divChain` needs a dividend of 60+ and not 2 ÷ 2), `a × b × c` products under
60 are refused. `scripts/verify-blitzed.mjs` re-derives every answer through its own
tokeniser and shunting-yard evaluator, shares no code with the generator, and is clean.

**Not in a circuit** (Mental Math is at its cap of five) and not in the Daily Five bank.
No Sunday Edition, and no `sunday` field, matching Blitz. The share card is a static
`public/og/blitzed.png` rendered from `renderBlitzedCard()`; its demo line `5 + 10 x 2` is
below anything round three ever generates, so it hands nobody a live answer.

## Junkyard (`/junkyard`) — the 8x8 jam, and A FAMILY IS A LADDER (launched 2026-09-04)

Key/route/folder `junkyard`, category **Logic**, `keepsAnswer: true`, `attempts: 'graded'`,
`miss: 'Tries'` — Parker's and Impound's shape exactly. Legacy accent `#5c3a16` / `#d9b070`, a
third step down the same brown ramp so the three read as a family on a slate row. Bank **150
boards, 2026-09-04 to 2027-01-31**, seed 20260904/771103, generated in two halves. Wired by
`scripts/wire-junkyard.mjs` (51 anchored edits, idempotent). No PNG tile; the glyph is the icon.

**EIGHT BY EIGHT IS THE LAST RUNG THIS FAMILY CAN HAVE.** `lib/jam-core` packs occupancy into two
32-bit words and a position into three bits, so 64 cells and n <= 8 are both hard ceilings and
`compile()` throws above them. A fourth size is a different engine, not a bigger argument. Say
"the biggest lot" in copy rather than "a bigger one", because it is the end of the line.

**⚠️ "8x8 IS OUT OF REACH" WAS MEASURED ON RANDOM BOARDS, AND THAT IS THE WRONG POPULATION.** The
finding recorded when Impound was built (a 400-board sample that did not finish in ten minutes) is
true of RANDOM packings and irrelevant to a generator that CLIMBS. Random 8x8 boards sprawl: over
half exhaust a 40,000-state cap, and half of THOSE are still unresolved at six million states,
twelve seconds apiece, because an unsolvable board has to exhaust its whole reachable component
before it can be called unsolvable. The climb never goes there. It walks toward tightly jammed
boards, which are deep AND narrow, so only **4% of the candidates it actually evaluates hit the
cap**, and it reaches **par 54 in the wall clock that gets 7x7 to 38**. Before re-deriving a
"this size is impossible" conclusion, measure the population the generator actually visits.

**THE LADDER'S STEP SHORTENS AT THE THIRD RUNG, on purpose.** Impound's Monday opens exactly where
Parker's hardest weekday rung begins, and repeating that step would put Junkyard's Monday at 28
and, compounded through the within-week floor, its Sunday floor near 50 against a measured ceiling
of about 54 — the coin toss Impound's own Sunday floor had to be measured down twice to avoid. So
Junkyard opens at 22 to 28: clear of Impound's whole Monday band, deeper than any Parker board
short of a Sunday, and reachable every week. Rungs: Mon 22-28, Tue 25-32, Wed 28-35, Thu 31-39,
Fri 34-43, Sat 37-47, **Sunday 44 and up**. `scripts/verify-junkyard.mjs` check 8 asserts the
claim that is TRUE of the bank rather than the one that would have been tidy, which is the third
time this family's "bigger game" check has had to be weakened to match reality.

### A FAMILY IS A LADDER, and finishing one rung offers the next (owner, 2026-09-04)

`GAME_FAMILIES` in `lib/daily-games.js` is the ONLY place a family is declared:
`{ jam: ['park', 'impound', 'junkyard'] }`, in ascending board size. `familyAfter(key)` returns the
rest of that family CYCLICALLY from the rung after the one just finished, so the offer always moves
up and wraps at the top; every other daily is in no family and gets `[]`, so a caller uses it
unconditionally.

**`app/useNextUnplayed.js` prefers a family member over a mere category-mate**, in both hooks
(`useNextUnplayed` for the one Up next pick, `useUnplayedSimilar` for the tile list). That one file
covers all 80 clients, because every one of them already routes its finish through those hooks into
`StageFinish`'s `forward` slot. Do NOT add a per-game next-up prop.

**⚠️ A MISSING FAMILY KEY IS DROPPED SILENTLY.** The pick resolves each key against a roster before
offering it, so a member absent from that roster does not error, does not warn, and does not render:
the ladder just loses a rung. And there are TWO rosters — `lib/daily-games.js` and the independent
copy in `app/DailyEndCard.jsx`, which is the one `useNextUnplayed` actually reads. `verify-junkyard`
check 10 requires every member in BOTH, requires the ladder to be in ascending board size, requires
the hook to still import and use `familyAfter`, and exercises the offer across all eight
played-combinations of the three games. All four mutations were confirmed to fail it.

**A second family needs only a line in `GAME_FAMILIES`** plus its sizes in check 10. Nothing else
in the pick is jam-specific.

## Kids dailies (`/kids/<game>`): a SEPARATE track with NO stats (owner, 2026-09-11)

Six daily puzzles for kids, each a gentle translation of a grown-up daily, live at `/kids/sixes`
(Shape Sixes, from Sixes), `/kids/mixup` (Mix-Up, from
Garble), `/kids/sortit` (Sort It, from Links), `/kids/ladder` (Ladder, from Rung), `/kids/unpark`
(Unpark, from Parker) and `/kids/mathdash` (Math Dash, from Blitz). The hub at `/kids` lists them
under "Today's puzzles" above the existing match games. Owner choices at launch, all three
deliberate and none of them a gap to fill later:

- **NOT in `lib/daily-games.js`.** No registry row, no leaderboard, no IQ Points, no circuits, no
  archive, no end card, no `/api/quiz/result`. Progress is local only (`sot_kids_<key>`, one day's
  state, overwritten at the next ET day). Nothing a child does reaches the server. Do not add a
  kids game to the roster "for consistency"; the whole point is that it is not scored.
- **Its own registry, `lib/kids-daily.js`** (`KIDS_DAILIES`, `KIDS_EPOCH`, `kidsDayNumber`,
  `pickCycle`, `seeded`). Banks CYCLE, `bank[(dayNumber - 1) % bank.length]`, so a bank never runs
  out and never needs extending on a schedule. Sixes and Unpark reuse the grown-up banks filtered
  gentle (Sixes: live, `level === 1`, weekday; Unpark: live, weekday, `par <= 14`), so they grow
  as those banks grow. Mix-Up, Sort It and Ladder have their own generated banks
  (`scripts/gen-kids-*.mjs`, guarded by `isMain` so importing one for its vocabulary does not
  regenerate); Math Dash is generated from the day number at request time (`lib/kids-mathdash.js`).
- **Recycling, confirmed 2026-10-14 (owner: "recycle the puzzles back through upon completion of
  the inventory").** Mix-Up, Sort It, Ladder and Fit It hold 60 boards each from `KIDS_EPOCH`, so
  their first lap ends 2026-11-09 and puzzle 61 is board 1 again, with no extension needed. Sixes
  and Unpark cut their growing pool at the day SHOWN (`p.live <= day.dateIso`), never at today:
  a pool cut at today grows daily, every archive number slides onto a different board, and the
  date-keyed save slot then holds another board's state. Once the grown-up bank stops publishing
  (Parker 2026-11-30, Sixes 2027-01-31 today) the pool freezes and simply loops. `verify-kids`
  fails a page that cuts at today or picks without `pickCycleAt`, and prints each bank's lap.
- **Its own look, `app/kids/KidsShell.jsx`**: Fredoka and Nunito, a butter ground, candy hues,
  `.kd-*` classes, the shared `KidsShell` layout, `useKidsSave`, `Confetti` and the six inline SVG
  `SHAPES`. Deliberately not the stage tokens or the Loft. Nothing on a kids page counts against
  the player: a conflict shakes, a wrong bin hops back, hints are unlimited and unscored.
- **Every kids `<style>` is `dangerouslySetInnerHTML`.** React escapes quotes and ampersands in a
  `<style>` text child, which breaks `@import url('...')`, `content:''` and `&` selectors. The
  first build shipped fallback fonts for exactly this reason.
- **The board's grid column is `minmax(0,5fr) minmax(0,4fr)` with `min-width:0` on the children.**
  A percentage-width board with absolutely-positioned children (Unpark's lot) collapsed to 12px
  inside an `auto` track. Boards are `width:100%;max-width:420px`.
- **`scripts/verify-kids.mjs` is the gate**, discovered by `verify-all`. It re-proves every kids
  bank with its own solvers (BFS for
  ladders, category disjointness and AVOID pairs for Sort It, the Mix-Up spacing rules, 400 days of
  Math Dash determinism and range), checks the reused pools are non-empty today, and that every
  registry entry has a `force-dynamic` page and a hub tile. Mutation-tested at launch.
- **Every kids daily has a LOCAL archive strip directly under the board** (owner, 2026-09-12).
  `KidsArchive` in `KidsShell.jsx` lists every past puzzle number as a chip linking to
  `/kids/<game>?p=<n>`; the page resolves it through `resolveKidsDay(searchParams)` in
  `lib/kids-daily.js` (missing, malformed, ahead of today or below 1 all fall back to today) and
  picks `pickCycleAt(bank, n)`. A past board saves to its own slot (`sot_kids_<key>_<date>`) so
  replaying #3 never wipes today's board, and finished dates are kept in `sot_kids_<key>_done` so
  a chip wears its check. Still nothing leaves the browser. Every page MUST pass `todayNum` and
  resolve `?p`; `verify-kids` checks both.
- **Shape Sixes shades EXACTLY like grown-up Sixes**: the armed shape lights the squares that already
  hold it and the selected square's row, column and box shade lightly. It does NOT grey the squares
  the shape cannot go in; that shipped once and the owner pulled it the same day ("gives away
  answers too easily"). A conflicting tap just shakes.
- **Pixel Pals (the Etch translation) was REMOVED 2026-09-13** (owner call). `app/kids/pals`,
  `scripts/gen-kids-pals.mjs`, its registry row, hub glyph and verifier block are gone; the
  Etch-to-kids translation is not coming back as a backfill.
- **The page behind a kids page is BUTTER, not navy.** `html:has(.kd)` / `body:has(.kd)` in
  `app/globals.css` paint `#fff6e0` (the value of `.kd`'s `--kbg`; keep the two in step), the
  `body::before` safe-area strip too, and the hub and the six daily pages export a `viewport`
  with `themeColor: '#fff6e0'`. Owner, 2026-09-13: no navy top or bottom around Mind Loft Kids.
- **The kids track is also counted in `lib/kids.js` `KIDS_GAMES`** (the hub header's game count).
  A new kids daily is: a `KIDS_DAILIES` row, `app/kids/<key>/page.js` + client, a bank or a
  generator, a `verify-kids` section, and a `DAILY_ART` glyph in `KidsHubClient.jsx`.

## Snug (`/snug`) and Fit It (`/kids/fitit`): fit the pieces, one way only (launched 2026-09-13)

Key/route/folder `snug`, category **Logic**, registry `miss: null` (Sixes' manners: a solve is a
flat 10, nothing counts against you, the clock decides the day, one free first-play hint through
`lib/hint-gate`), legacy accent `#3b5bdb` / navy `#91a7ff`. Day 1 is **2026-09-13**, a Sunday, so
No. 1 is a Sunday Edition. Bank runs 78 days to **2026-11-29**. Wired by `scripts/wire-snug.mjs`
(anchored on the Junkyard rows, idempotent). No PNG tile; `lib/game-glyphs.js` has `snug`. Share
card is the static `public/og/snug.png` from `scripts/bake-og.mjs snug`. Design study with the
grown-up and kids boards: https://claude.ai/code/artifact/a9c7b827-5af7-4c1a-8fef-7db991b253dc.

**The game.** A board with a few squares missing and a handful of polyomino pieces whose areas add
up to the board exactly. Tap a piece on the pad to arm it, R or the Rotate chip turns it, F or Flip
mirrors it, tap a board square where one of its squares goes and it drops in if it fits (the piece's
row-major first square is preferred when several placements fit; a tap that fits nowhere flashes and
costs nothing). Tap a placed piece to lift it. The pad shows every piece SCRAMBLED (a fixed rotation
and flip per slot), never in its solution orientation. THE BANK ONLY SHIPS BOARDS WITH ONE TILING
under all eight orientations, so a full board is always the right board.

**Uniqueness by FILTERING, and difficulty is MEASURED.** `scripts/gen-snug.mjs` makes a region (a
square minus a few holes, connected), floods it into k pieces, and keeps the board only when the
tiling count under rotations and reflections is exactly one; it does not design toward uniqueness.
`nodes` is the size of the search tree the canonical counting solver walks (defined in the bank
header: row-major first empty square, every unused piece, every deduplicated orientation anchored by
its row-major first cell, every entry counted). Each weekday draws a POOL of unique boards and takes
the quantile its day asks for (Monday easiest, Saturday hardest), then a second pass re-picks any
weekday whose nodes fall below the day before, so `nodes` never falls inside a Mon-Sat run.

**The shape ramp is pinned per weekday and was measured before it was chosen:** Mon 6x6, 3 holes,
6 pieces of 4-7; Tue 3 holes, 6 of 4-6; Wed 3 holes, 7 of 4-6; Thu 2 holes, 7 of 4-6; Fri 1 hole,
7 of 4-6; Sat 1 hole, 7 of 4-6 from the HARD end of its pool; **Sunday 7x7, 4 holes, 8 pieces of
4-7.** A hole is a constraint, so the week takes them away. A Saturday of seven pieces of 3-6 was
tried first and measured EASIER than Friday (median nodes about 2,800 against 5,000: a tromino
constrains less than a tetromino), so Saturday shares Friday's shape and the quantile does the work. Eight pieces of 3-5 on a 6x6, or a full 6x6 with no hole, almost never
come out unique (0 to 1 in 1,500 tries), which is why the weekday count stops at seven. No two pieces
on a board are congruent under the free symmetry, and no two boards share a region and piece set.

**⚠️ A ONE-HOLE 6x6 HAS ONLY 36 REGIONS, and fewer than twenty of them admit a unique tiling at
all.** The first run keyed board identity on the region alone and reserved every pool candidate's, so
it ran out on the third Friday (2026-10-02); reserving only the chosen board's region moved the
failure to the sixth. A board's identity is therefore its region PLUS its piece set (`rkey` in the
generator, the same key in the verifier), which is what a player actually sees.

**`scripts/verify-snug.mjs` shares no code with the generator.** It re-derives the spec per
weekday, connectivity, piece normalisation and pairwise non-congruence, that `sol` tiles the region
exactly, uniqueness with a DIFFERENT solver (most-constrained empty square first, cap 2), `nodes`
by a fresh walk of the canonical definition, the weekday climb, the Sunday flag on real Sundays, and
that no mask repeats. 78 boards in a few seconds.

**Fit It is Snug for kids, on the kids track and NOT in the registry** (per the kids rules above):
5x5, two or three holes, four or five pieces of 3-6, and EVERY PIECE PRINTED THE WAY IT GOES IN.
There is no rotation on the kids board, so uniqueness is proved with the pieces FIXED, and
`scripts/gen-kids-fitit.mjs` keeps only boards with exactly one fixed-orientation tiling (sixty
boards, cycling). Tap a piece, tap the board; a piece that will not fit wobbles; "Show me one" drops
the next piece home for free, unlimited; Undo and Start over. `scripts/verify-kids.mjs` re-proves
every board with its own piece-driven solver.

## Yose (`/yose`) and Crib (`/crib`): a Go endgame and a cribbage throw (launched 2026-09-17)

Wired by `scripts/wire-yose-crib.mjs` (anchored on the Turn and Finesse rows, idempotent). No PNG
tiles; `lib/game-glyphs.js` has both. Share cards are static `public/og/<key>.png` from
`scripts/bake-og.mjs yose crib`. Premiere window 2026-09-17 to 09-21. Banks run 78 days,
2026-09-17 to 2026-12-03.

**Yose** — key/route `yose`, category **End Game** (the eighth), `keepsAnswer: true`,
`miss: 'Tries'`, legacy accent `#44403c` / navy `#d6d3d1`, in DEFEAT_GAMES and the
'Board endgames' set. A Go board whose walls are built and whose territories are settled; a few
OPEN POINTS (the only playable points) and a few LOOSE enemy stones decide it. Go rules with the
simple ko rule, suicide banned, a pass is a move, two passes end the game, AREA scoring. Every fixed
stone belongs to a group touching its own territory, so only loose stones can ever be captured.

- `lib/yose-core.js` is the engine, shared by the generator and the browser. It solves every
  position with NO pruning (the ko ban is part of the memo key) and the generator THROWS A BOARD
  AWAY if any line repeats a whole position, so no superko rule is ever needed and the value table
  is exact. `komi` is (root value - 0.5), so perfect play wins by exactly half a point.
- The engine's reply tie-break (lowest value, then most captures, then a real move before a pass,
  then the lowest point) is deterministic, so everybody who plays a line meets the same replies.
- **The ramp** (measured, a few hundred boards per shape): Mon 7x7 6 open, 1 or 2 winning first
  moves, >=1 forced decision; Tue 7x7 7 open, same; Wed 7x7 8 open, exactly one winner, >=2 forced;
  Thu 7x7 9 open, >=2; Fri 8x8 10 open, >=2; Sat 8x8 10 open, >=3; **Sunday 9x9 11 open, >=3**.
  A forced decision is a Black turn on the main line with two or more choices and exactly one that
  keeps the win. Passing is never the winning first move, at least two first moves lose, and the
  komi stays within 9 (11 on Sunday). Each day is generated from a seed off its date
  (`gen-yose.mjs day`), so days run in parallel and any one can be regenerated alone.
- `scripts/verify-yose.mjs` carries its OWN engine (2D grid, recursive groups, string keys,
  negamax) and re-derives everything, including that its memo size equals the stored `nodes`.
  A full run is about three and a half minutes; `--quick` skips solving the Sundays.
- The client counts an error for every Black move that lowers the position's value and SHOWS it
  only once the stones are counted. `progress` = Black moves that kept the value. The key point
  is ringed only for a player who won. The value table is warmed on mount, because a Sunday is up
  to a hundred thousand positions and the first search is the only expensive one.

**Crib** — key/route `crib`, category **Cards** (the fifth, still ungrouped), `miss: null`
(first attempt stands, the clock breaks ties), legacy accent `#a16207` / navy `#fcd34d`. Five
six-card hands a day (seven on Sunday), each one a choice of the two cards to throw, the crib
alternating yours / theirs starting with yours. A throw's value is the kept four's average over all
46 cut cards, plus the crib's average (over every cut and every pair of the 45 cards the opponent
might throw) when the crib is yours, minus it when it is theirs. 2 points for the best throw, 1
within 0.75 of it, so the score is out of 10 (14 on Sunday).

- `lib/crib-core.js` is the scorer and valuation (client and generator). `scripts/gen-crib.mjs`
  values random hands into pools (`pool`, both cribs per hand) and deals the calendar (`bank`).
- **The ramp is the GAP** between the best and second-best throw, measured (median 1.24 on random
  hands): Mon >=2.0; Tue 1.3-2.6; Wed 0.9-1.7 with >=1 crib-decided hand; Thu 0.6-1.15 >=1; Fri
  0.4-0.85 >=2; Sat 0.2-0.6 >=2; **Sunday 0.2-1.0, seven hands, >=3 crib-decided**. A hand is
  crib-decided (`flip`) when the four best cards to keep are NOT the best throw. No six-card set
  repeats; no rank pattern (plus crib side) inside 21 days.
- `scripts/verify-crib.mjs` has its own rank-pattern cached scorer, checks known hands (29, 28,
  24, flushes, nobs), and recomputes every value (tolerance 0.0015). Full run about five minutes;
  `--quick` recomputes the first hand per day.
- The reveal after each hand shows the top throws with hand, crib and value, and a deterministic
  cut (`cutFor`) with its breakdown, which is flavour and scores nothing.
- **Launch pop-up: `app/GroupsPop.jsx`** on the home (StageToday), once per
  browser for everyone (`sot_groups_pop`, stamped on render), skipped for anyone
  already in a group. It waits for the theme demo, the arrival screen, the
  welcome overlay and PremierePop, and PremierePop now waits for it too
  (`.gpp-scrim` in its `arrivalBusy`), so two cards never open at once. Its
  feedback face posts to `/api/complaints` as `groups-feedback`.
  `?groupspop=1` previews without stamping.
- **Group standings everywhere (owner, 2026-09-17).** One read,
  `/api/groups/standing?anonId=&email=&day=today|yesterday`, built from each
  group's own `daily-combined?group=` board (nothing stored). One client,
  `app/groups/groupStanding.js` (shared promise + 45s sessionStorage copy;
  a browser with no `sot_quiz_identity` never asks). Seven surfaces read it:
  - finish screen: `app/groups/FinishGroupLine.jsx` inside StageFinish
    (dailies only; retries until this game's points land; the arrow is
    "before this game" = best-N total without it; no arrow on `?p=` replays);
  - home band: `app/groups/HomeGroupsBand.jsx` above the slate heading;
  - Groups link badge in the home cap (`.sty-gpos`: word on desktop, number on phone);
  - Everyone / group switch (`app/groups/GroupSwitch.jsx`, remembered in
    `sot_grp_scope`) on the stage Rankings panel (`DailyBoardPanel`, today's
    puzzle only, checked through `quizIds`), the legacy GamePanel, and the Stat
    Hub Today board (`app/groups/StatHubGroupBoard.jsx`, shows site place too);
  - arrival: StageWelcome's `grp` figure, "Yesterday in <group>", cross-day
    arrivals only, its own `grpDone` flag in the queue gates;
  - copy board: `CopyBoard` on the group page's Today tab (share sheet on touch,
    clipboard otherwise);
  - home tiles: member dots (`GroupDots` in StageToday) for the first group,
    drawn only once a member has played that game.
  `daily-combined?group=` rows now carry `siteRank` (named-player rank).
- **Public or private groups (owner, 2026-09-17), migration 57.**
  `quiz_groups.visibility` is `'private'` (default, invite only) or `'public'`
  (also listed on /groups, joinable by anyone). The owner's call: the flag
  decides where a group can be FOUND, never who may read the board, because an
  invite link has to be readable before it is accepted. Owner switches it in
  Members -> Owner settings (`action: 'visibility'`); the create form has a
  "List it publicly" checkbox. `/api/groups/public` is the list (names, sizes,
  owner names, `full` flag; 60s shared cache) and `/groups` shows it as "Open
  groups", minus the groups the reader is already in. `lib/groups.js` tolerates
  a database without the column (`isMissingColumn`, 42703): every read falls
  back and everything is private, so code and migration can ship in either
  order. Admin's Groups table and CSV carry a Listing column.
  Removing a member was already there: owner-only Remove on each member card.
- **A group board is scored as its OWN field (owner, 2026-09-17: "if im first i
  assume i should get 15").** `rescoreField(quizId, rows)` in
  lib/daily-combined.js pays one game's rows by THIS field's positions with the
  site's own formula (same ladder, same tie rule = the mean of the rungs a tie
  spans, same pre-cutover split on an old day); `groupPayload` in
  /api/quiz/daily-combined runs it per game over the members, keeps the site's
  figure as `sitePoints`, and recombines best-N for the group total. So topping a
  group is worth 15 even if that run came 2nd sitewide, and each row still
  carries `siteRank`. Gate: scripts/verify-group-scoring.mjs.
- **Home top row (owner, 2026-09-17):** above 1100px the Your groups band and
  the day's progress ladder share one row (`.sty-toprow.two`: `auto minmax(0,1fr)`,
  band left, ladder right); they stack below that. The band is ONE CHIP wide with
  arrows to step through the rest (owner: "only take up the size necessary, the
  size of one chip at a time"). A game a group member has played FILLS its tile
  with the category step (`.sty-g.grp`, ink via `--stg-onramp`), with the member
  initials as small discs on the title row so every tile keeps its height. Two
  traps, both hit live: `.sty-g.done.res .sty-gn` mutes a finished tile's own
  name, so the filled tile re-states the ink at higher specificity, and the star
  is pinned to the tile's corner, so `.sty-g.pin .sty-gdots` leaves it room.
- **Choose a name actually opens a form (owner report, 2026-09-17).** Three
  controls pointed at `/?signup=1` (the stage home's guest cap chip, its My games
  tile, and the Quizzes landing link) and nothing on the home ever read that
  parameter, so the link reloaded the page, replayed the arrival ("flicking") and
  offered nothing. `app/ChooseNamePop.jsx` is the form: it opens on `?signup=1`
  or on the `sot:choose-name` window event (the two home controls fire the event
  instead of navigating), wraps the site's one JoinLeaderboardForm, and on
  success reloads without the parameter and with `welcome=0`. Its own heading and
  lede replace the form's, which it hides — the form's heading row sets
  `display:flex` INLINE, so that one rule needs `!important`.
- **My games also carries the games the reader's group has played that day**
  (owner, 2026-09-17), appended after the starred ones and drawn filled. The
  band's "N of M played" counts MEMBERS with a score today; it was spelled out
  as "members played" for a day and the owner asked for the short form back, so
  the noun lives in the chip's title attribute instead.


## Duet (`/duet`): the daily balanced grid (launched 2026-10-03)

A variant of the balanced binary puzzle (binairo / takuzu, the family LinkedIn's Tango belongs to)
with WALLED ROOMS: dots and rings, half of each in every row, column and room, never three alike in
a line, '=' / 'x' marks between neighbours. Key/route `duet`, category **Logic**, `miss: null`,
SOLVE_ONLY (flat 10, the clock decides), first-play hint via hint-gate, legacy accent `#1a7f37` /
`#bef264` (the Logic step; on the stage the ramp paints it). Wired by `scripts/wire-duet.mjs`
(anchored on the Snug rows, idempotent). No PNG tiles; glyph in `lib/game-glyphs.js`. Share card
`public/og/duet.png` from `scripts/bake-og.mjs duet`. Premiere window 2026-10-03 to 10-07.

- `scripts/duet-core.mjs` is the generator's engine: full grid, rooms grown to balanced even sizes
  (2 to 6), then clues (printed squares and marks) stripped while a GRADED solver still finishes.
  Level 0 is pencil work (marks, the pair and gap rules, a full line or room); level 1 is a line read
  (every legal pattern for a row or column). `cost` = squares first settled by a line read.
- **The ramp**: Mon 6x6 cost 0, Tue 6x6 2-6, Wed 6x6 7+, Thu 8x8 0-6, Fri 8x8 7-13, Sat 8x8 the
  hardest of a pool (14+), **Sunday 10x10** the hardest of a pool (16+). Day 1 (2026-10-03, a
  Saturday) is the launch board and takes the Monday spec. Bank 78 days to 2026-12-19,
  `node scripts/gen-duet.mjs > app/duet/puzzles.js` (deterministic, seeded off each date).
- `scripts/verify-duet.mjs` imports nothing from the core: its own backtracking counter proves
  exactly one solution, its own logical solver proves no guessing, and it checks rooms (connected,
  even, balanced), marks and givens against the solution, sizes by weekday, Monday finishing on
  pencil work, the other days needing a line read, dates, quizIds and no repeated board.
- The client flags RULE BREAKS live (three alike, a line or room over half, a broken mark) but
  never a square that is merely wrong. Tap cycles empty, dot, ring.

## Passport (`/passport`): the daily geography run (launched 2026-10-03)

One mystery country a day, played in five rounds of 10 points, one score out of 50, ending on a
real passport. Key/route `passport`, registered in `lib/daily-games.js` (category Geography,
`miss: null`) so its rows score, rank and pay IQ Points, but **RUN_ONLY** (owner, 2026-10-03):
players see it only as a circuit. `liveDailyKeys` leaves it out, so no daily list, category page,
grid, strip, archive, count or "play similar" offers it; `circuitKeysFor` still deals it. The
circuit tile is `lib/circuits.js` id `passport` (`solo: true`, engine `passport`, path
`/passport`, score `correct`), and it took the Daily Five's place in the home's lead three
(CIRC_LEAD, pinCircs, TodayClient LEAD_CIRCUITS, LEAD_ORDER). Premiere is a RUN premiere
(PREMIERE_RUNS), 2026-10-03 to 10-07. `scripts/wire-passport.mjs` is superseded (it would re-add
the daily listings) and refuses to run without `--force`. Share card `public/og/passport.png`.

- **The page is a run, not a daily** (owner, 2026-10-03): `app/passport/PassportClient.jsx`
  wears the Price Check / Trivia Gauntlet register (Midnight ground, sky call to action, its own
  cap with a Leaderboard link). Pregame is `Launch`: a split-flap departures board that hunts
  and never lands, a boarding-pass Board now button, the flight map, the visa page stamping its
  five rounds, the six-passport ladder. The ending is the Finale curtain, then a settled screen
  (cover, figures, the five stamps, Share / Leaderboard / Replay the ending / Back to main) and
  the Gauntlet nudge. Never LoftFinish. The board is `/passport/leaderboard`, the Price Check
  board component (`app/pricecheck/leaderboard/PriceCheckBoard.jsx`) with circuit `passport`.
- **Rounds** (`lib/passport.js`): Landmark (a Commons photo zoomed 5.2x, 3.2x, 1.9x, 1x; 10/8/5/3
  for the country named at each frame), Flag (colors, layout, then the real flag; 10 less 3 a miss,
  never below 1), Borders (share of land neighbors named, out of 10, three strikes; island days name
  the nearest countries across the water instead), Capital (a pin on a baked map; full marks within
  one step, a point off per step, the step scaling with the country's size), Numbers (five
  bigger-or-smaller land-area calls, 2 points each). The country stays hidden until the landmark
  round ends.
- **The ladder** (owner): one real passport per inhabited continent in true Henley Passport Index
  2026 order: Sierra Leone 0+, Mexico 30+, Brazil 38+, Australia 44+, Switzerland 48+, Japan 50. The
  share line names the passport and the round scores, never the day's country.
- **The bank**: `scripts/passport-facts.mjs` (schedule, landmarks, flags, capitals),
  `scripts/passport-factbook.mjs` (areas and capital points, CIA World Factbook), borders from
  `app/flank/borders.js`. `node scripts/gen-passport.mjs` writes `app/passport/puzzles.js` (the light
  index) and `app/passport/days.js` (the full days, maps baked as SVG paths in a rotated Mercator,
  which needs `d3-geo topojson-client world-atlas` installed with `--no-save`). Stocked 31 days
  2026-10-03 to 2026-11-02. `scripts/verify-passport.mjs` checks it. Sundays are countries with 8+ neighbors.
- The page resolves the day on the server and ships only that day, with the Commons title
  stripped; the photo comes from `/api/passport/img?n=`, which refuses a day not yet live. Flags are
  flag-icons SVGs (MIT) in `public/passport/flags/`.

### Passport became a four-leg run on 2026-10-15 (owner, 2026-10-14)

Getting the landmark photo and the flag right every day was too much process, so from 2026-10-15
(`LEGS_FROM` in `lib/passport.js`) a day is **the day's Span, Flank and Ping, then nine
bigger-or-smaller calls on land area**, still out of 50 on the same six passports. Days up to
2026-10-14 stay the five-round game, frozen, and the five-round client still plays them.

- **The three games are the real games**, mounted through `app/RunEmbed.jsx` like the Judged and
  Dojo runs (`app/passport/PassportRunClient.jsx`). Each files its own ordinary row; a game already
  finished today on its own page is banked off its save and stats and not replayed. Span, Flank and
  Ping read `useRunEmbed()` and hide their cap, finish card, join form and tail inside the run.
- **Points**: `legPoints(key, score, total)` scales each game to 10 and the sizes to 20, rounded.
  The circuit board adds the four rows with `passportScorer` (circuit `scorer: 'passport'`,
  `scoreFrom: '2026-10-15'`); the passport row itself is calls right out of 9.
- **The sizes** (`lib/passport-sizes.js`, areas in `lib/country-areas.js`): three calls per game,
  drawn from Span's road, Flank's country and its ring, and Ping's city's country. A pair is dealt
  only when the two are 1.3 times apart and a second area table agrees by 1.15, so no call turns on
  a disputed figure; no country is asked twice. `lib/passport-run.js` builds a day from the three
  banks and is what the page and `verify-passport.mjs` both read.
- **The calls cover AREA AND POPULATION (owner, 2026-10-14).** Each call carries `m` ('area' or
  'pop') and `aVal`/`bVal` for that measure; a day alternates them, five of one and four of the
  other, the lead seeded off the date. Population is `lib/country-pops.js`: `POP` from the CIA
  World Factbook (2024-25 estimates, Palestine = West Bank + Gaza) and `POP_ALT` from country-json
  (World Bank 2018) as the agreement check, the same 1.3 / 1.15 rule. A population call reads
  "Does B have more or fewer people than A?" with More / Fewer buttons; `verify-passport` fails a
  day with no measure on a call or a population count outside 4 to 5. `lib/passport-run.js` builds a day from the three
  banks and is what the page and `verify-passport.mjs` both read.
- **The circuit roster is dated**: `keys: ['span','flank','ping','passport']` with
  `before: { until: '2026-10-14', keys: ['passport'] }`. `solo: true` stays, for the old days.
- **The bank** keeps nums 1 to 12 in `days.js`; from num 13 the light index carries `v: 2` and no
  day file. Stocked to 2026-11-30, the end of the Span, Flank and Ping banks: extend those first,
  then rerun `gen-passport.mjs` with a later `RUN_UNTIL`.
- The share line and the card carry four scores (`?s=a-b-c-d`) and never name a country.
- **PING, SIZES, FLANK, SPAN from 2026-10-17 (owner, 2026-10-17; this replaced a Sizes-first order that never reached a live day).** `LEGS` stays the STORAGE order (saved `sc`, the `?s=` share code and the card index it); `legOrderFor(iso)` in lib/passport.js is the PLAY order (`[2,3,1,0]` from `LEG_ORDER_PING_FROM`) and the client reads `ORD[g.round]` everywhere a leg is meant. A save carries `ord`; a run started on 10-17 before the switch has no `ord` and keeps `legOrderBefore` ([0,1,2,3]). Because the sizes come before Flank and Span, from `SIZES_OPEN_FROM` (2026-10-17, switched mid-day by the owner) they no longer draw on the day's countries: `passportSizesOpen` picks both sides of all nine calls from every named country, unweighted, nobody in two calls (`src: 'open'`). A save keeps each call's result by index, so a run mid-sizes carries on with the new calls. The passport row posts the moment the sizes end when they are not the last leg.
- **Span, Flank and Ping offer the run** (`RunDoorPop id="passport"`, gated `!EMBED`, today's start gate). The door is `once: 'game'` with `everyone: true` (shown once per game even to players who already know that game, since it announces the change) and `from: '2026-10-15'`; `runDoneToday('passport')` silences it.

## Judges (`/judges`): two per row, and Jesters back to one (2026-10-04)

Owner ruling 2026-10-04: **Jesters is one jester per row, column and court every day again**, and its
week ramps by BOARD SIZE (Mon/Tue 8x8, Wed/Thu 9x9, Fri/Sat 10x10, Sunday Edition 11x11, the second day
of each size pair grading harder). The two-per-unit boards it ran Thursday to Sunday from 2026-08-21
became their own daily, **Judges**: key/route `judges`, category **Logic**, `miss: 'Placed'`,
SOLVE_ONLY, legacy accent `#7c2d12` / `#fdba74`, forked from JesterClient (gavel mark, `STARS`
defaults to 2). 10x10 Monday to Saturday dealt from six difficulty bands of the jester2-human tier
score, a 12x12 Sunday Edition. Wired by `scripts/wire-judges.mjs`. No PNG tiles; glyph in
`lib/game-glyphs.js`.

- **Jesters #79 (2026-10-04) was swapped in place** from a two-jester 10x10 to the first 11x11 a few
  minutes into its day (owner: everything live today). A save for the old board is discarded on load
  because the grid size no longer matches. Boards 2026-08-21 to 10-03 are frozen in their two-jester era,
  and `scripts/verify-jester.mjs` checks each era by its own rule (`ONE_FROM = '2026-10-04'`).
- **Generators.** One-jester boards: `scripts/jester1-produce.mjs <size>` (seeded seating, uneven court
  growth, boundary repair, the graded human solver). Judges boards: `scripts/judges-produce.mjs <size>`.
  Even court growth almost never converges to a unique 12x12 two-star board; what works is UNEVEN
  appetites (a few sprawling courts, many tight ones, skew 6 to 8) plus GREEDY repair that keeps the
  boundary move leaving the fewest rival seatings. Even so a 12x12 takes minutes of CPU each, so bank
  Sundays in a long job, not interactively. Courts must hold 4+ cells.
- **Hue collisions.** The stage paints court k with REGION_RAMP[k % 10], so on an 11x11 or 12x12 courts
  k and k+10 share a hue; the banks are labelled so those never touch (verify-judges checks it).
- **The client solver** (JudgesClient `solveBoard`) gained a one-seat-per-row column prune and a
  court-reach suffix prune; a 12x12 two-star board resolves in under 100ms.
- `scripts/verify-judges.mjs` shares no search code with the generator: its own cell-by-cell
  exhaustive count proves one seating, jester2-human proves no guessing, and it checks sizes by weekday,
  4+ cell contiguous courts, the hue rule, the Mon<...<Sat ramp, and no layout reused from Jesters.

## Lamps, Clade and Dossier (`/lamps`, `/clade`, `/dossier`): launched 2026-10-04

Three dailies in one push, wired by `scripts/wire-clade-dossier-lamps.mjs` (anchored on the Duet and
Niche rows, idempotent). Day 1 is 2026-10-04, a Sunday, so every No. 1 is a Sunday Edition. Banks
run 78 days to 2026-12-20. No PNG tiles; glyphs in `lib/game-glyphs.js`; share cards
`public/og/<key>.png` from `scripts/bake-og.mjs lamps clade dossier`. Premiere 10-04 to 10-08.

**Lamps** (Logic, `miss: null`, SOLVE_ONLY, first-play hint): the light-placement puzzle (akari).
`grid[r]` is a string of `.` white, `#` blank wall, `0`-`4` numbered wall; `sol` is the lamp
squares as `r*n+c`. `scripts/lamps-core.mjs` + `gen-lamps.mjs` build a unique board and strip wall
numbers while a graded solver (pencil rules, then ONE look-ahead; `cost` = squares settled by a
look-ahead) still finishes. Ramp: Mon 7x7 cost 0, Tue 1-2, Wed 3-9, Thu 8x8 0-1, Fri 2-5, Sat 6-16,
**Sunday 10x10** 6-40. `scripts/verify-lamps.mjs` shares no code with the core. The client flags
two lamps that see each other and an over-full numbered wall, never a lamp that is merely wrong.

**Clade** (Trivia, `miss: 'Guesses'`): one hidden animal, eight guesses, each answered with the
closest branch of the tree it shares with the answer. `app/clade/animals.js` is the list (name,
`path` from Animals down, tier 1-4, optional `alt` names). Tier by weekday: Mon/Tue 1, Wed/Thu 2,
Fri/Sat 3, Sunday 4. Score `11 - guesses` (floor 1), 0 when the guesses run out. THE TAXONOMY WAS
WRITTEN FROM MEMORY and simplified to common-name branches; treat a reader report of a wrong branch
as likely right and fix the path.

**Dossier** (Trivia, `miss: 'Guesses'`): one hidden item from the day's universe
(`app/dossier/universes.js`: US presidents, chemical elements, US states), eight guesses (six on
Sunday), each compared with the answer on five attributes (match, higher, lower, no). Rotation Mon
presidents, Tue elements, Wed states, Thu presidents, Fri elements, Sat states; Sundays cycle.
Same score as Clade. A president who served two separate terms is one entry. Facts are frozen
(nothing that changes with an election or a discovery is an attribute).

Both guessing games use the three-tier word type-ahead (`matchNames`) and say so when nothing
matches, per the type-ahead rule above. The answer never reaches the browser for a future day:
each page filters `live <= today`.

## Snake (`/snake`): the third Arcade daily (launched 2026-10-07)

The classic snake game as a daily. Key/route `snake`, category **Arcade** (beside Blocks and
Sweep), `miss: 'Moves'`, `unit: 'apples'` (a tally game: the score is the raw apple count,
uncapped, and a zero-apple run ranks on moves survived), legacy accent `#65a30d` / `#bef08a`.
Arcade rules throughout: unlimited runs, the board and the local record keep the BEST run, and
`XP_DAILY_CAP.snake = 1`. Wired by `scripts/wire-snake.mjs` (anchored on the Blocks rows).
**No PREMIERES row on purpose (owner, 2026-10-07): it launched without the new-puzzle pop-up.**
Not in the Arcade circuit (still Blocks and Sweep); whether it joins is an owner call.

- **The day's apples are generated, not banked.** `lib/snake-engine.js` `dayPlan(quizId)` is a
  seeded list of 800 squares; apple k lands on the k-th, or slides to the next free square in
  reading order when the snake is lying there. The same file is the engine the client plays and
  the verifier proves, so the two cannot drift. `app/snake/puzzles.js` carries only the frame
  (size 15, grow, par) and is written by `scripts/gen-snake.mjs`.
- **Rules:** a 15x15 board with WRAPPING edges and no wall, one square every 150ms for the whole
  run (`STEP_MS`, picked as "Relaxed" off the mockup), two turns may queue between ticks, a
  turn straight back is ignored, moving into the square the tail is leaving is legal, and only
  your own body ends a run. The first turn starts the clock; `timeElapsed` is moves x 150ms,
  so it is play time with pauses excluded.
- **Weekday par 20, Sunday Edition par 15 with every apple growing the snake by two.** A greedy
  solver eats a median 27 a weekday; par sits below it on the Blocks lesson that a solver is no
  guide to a human. Revisit once a fortnight of real scores exists.
- **The look (mockup v2, owner-approved):** no outer barrier, only a light grid; the snake is
  one tapering tube in the category accent (`--stg-acc-ink`) fading toward the ground, with a
  sheen, a darker head and eyes that look where it is going; the apple is ink with an accent
  stem; a faint dashed ring marks where the NEXT apple will land. Colours are read off the
  stage tokens through a probe element, so the canvas follows both registers.
- **A run in progress survives the tab:** leaving the page pauses and saves it
  (`sot_snake_<num>`, the engine snapshot without its plan), and the same run resumes.
- `scripts/verify-snake.mjs` checks the bank (contiguous dates, quizIds, Sunday frames) and
  the engine (determinism, wrap, reversal, tail-chase, self-bite, Sunday growth, and that a
  greedy run on every banked day eats apples).

## Dario (`/dario`): the daily side-scroller (launched 2026-10-07)

A three-level platformer run (The Valley, The Data Center, The Launch Site), a send-up of the AI
race told through parody billboards (ClosedAI, Goggle, Teslo, Nvideo, DeepSink, Qwan, Space-Y).
Key/route `dario`, category **Arcade**, `miss: null`. Wired by `scripts/wire-dario.mjs`.

- **Launched 2026-10-07** after a same-day review hold. `REVIEW_HOLD` in `lib/daily-games.js` is left in
  place, empty, as the mechanism for holding the next game: a key in it scores and ranks but is offered
  on no slate, grid, category, count or sitemap (it rides the run-only filters). Wired into the display
  lists the Snake way; in the Arcade grid, archive, category page and finish set beside Snake.
- **NO new-puzzle pop-up (owner, 2026-10-07), an explicit exception to the launch rule.** Dario is in
  `NO_PREMIERE` (`lib/daily-games.js`), which `app/PremierePop.jsx` filters before anything else, so it is
  never announced even if a `PREMIERES` line for it is added later. Do not add one.
- **Seeded daily remix, fixed geometry.** `lib/dario-engine.js buildLevels(quizId)` keeps every
  level's layout fixed (so every day is beatable) and seeds where the bots, robotaxis, chips and the
  one shield crate sit, plus rocket and platform timing. The client and `scripts/verify-dario.mjs`
  share the function. `app/dario/puzzles.js` is a calendar written by `scripts/gen-dario.mjs`.
- **Ranked on SPEED.** A full clear posts score 10/10 and its run time in TENTHS of a second as
  `guessesUsed` (cap 10000), so the arcade tiebreak ranks clears by time to a tenth; `timeElapsed`
  carries whole seconds for display. An unfinished run scores 3 per level cleared plus up to 2, and
  posts `10000 - tiles travelled`, so going further ranks higher. Best run of the day counts (Arcade).
  The run clock counts play only: it stops for pauses and level cards and runs while dying.
- **All-time fastest list:** `/api/quiz/dario-fastest`, best full clear per registered player across
  every day, read off `guesses_used`. Rendered under the board.
- **Music (owner, 2026-10-07):** original chiptune arrangements of public-domain pieces, in the engine:
  1-1 Mountain King (speeds up each loop), 1-2 Flight of the Bumblebee, 1-3 Ride of the Valkyries, the win
  screen Pomp and Circumstance No. 1, game over Funeral March of a Marionette (once). M toggles it.
- **Mobile (owner, 2026-10-07): controls never cover the screen.** Portrait: the pad sits under the screen.
  Landscape on any coarse pointer (phone or iPad): the pad moves to the SIDES of the screen, which shrinks to
  fit, and starting a run scrolls the game into view. Full screen uses the same side layout.

## Rung's word list has TWO ERAS (owner, 2026-10-09)

Rung refused ordinary English (PRONE, PRUNE, AFTER, FIRST, MUSIC) because its
list was 1,294 words. The lists now live in `app/rung/vocab.js`:
`VOCAB_CLASSIC` (the frozen 1,294, never edit it) for boards live before
`VOCAB_FROM` = 2026-10-10, and `VOCAB` (3,942: the classic list plus words at
zipf >= 2.3 in `scripts/.lode-freq.json` that en_US hunspell knows in lower
case, minus a slur/profanity screen and a hand pass for names) from then on.
**Validate and measure a board only through `vocabFor(board)`**: the client,
the hint, `verify-rung.mjs` and `gen-rung.mjs` all do. Today's 10-09 board
would collapse from perfect 12 to 5 on the new list, which is why played boards
stay on the classic one. Boards 10-10 to 11-30 were regenerated with
`gen-rung.mjs --keep-through 2026-10-09`, which now enumerates every fresh
familiar pair (no plural or -ed start/target), picks the reveal ladder whose
least familiar word is most familiar, and lets a late Sunday relax to 12 routes
and a 2.7 reveal floor when the fresh pool is thin.

## Ergo (`/ergo`): the daily if-then sort, and it leads Judged (launched 2026-10-11)

A small cast, a handful of if-then rules about who does what, and ONE FACT FOR TODAY; sort nine
statements (twelve on the Sunday Edition) into must be true, could be true and cannot be true.
Key/route `ergo`, category **Logic**, `miss: 'Wrong'`, score = statements filed right, first
attempt stands, legacy accent `#5b3a9e` / navy `#c4b5fd`. Wired by `scripts/wire-ergo.mjs`
(beside Docket in every list). Glyph in `lib/game-glyphs.js`, share card `public/og/ergo.png`
from `scripts/bake-og.mjs ergo`. Premiere 2026-10-11 to 10-15. Like Docket, NO reader-facing copy
names the standardized test this reasoning comes from.

- **Rules are 2-SAT implications** (`if`, `onlyif`, `unless`, `never`, `least`), each a pair of
  literals `a -> b` with its contrapositive as a "flip". Weekday ramp: Mon 5 people / 4 rules
  (if, never), Tue 6/5 adds only if, Wed 6/5 adds unless, Thu 6/6 adds at least one, Fri 7/6,
  Sat 7/7, Sunday 7/7 with twelve statements. Each verdict appears at least twice (three times on
  Sunday). Traps are converses and inverses of a rule chain.
- **No answer key ships.** `app/ergo/engine.js` enumerates every lineup the rules and the fact
  allow (at most 128) and classifies each statement in the browser; each statement carries a
  `why` proof chain with rule labels (R3, R3 flip) shown after the ruling.
- Bank 63 days, 2026-10-11 to 2026-12-12, from `scripts/gen-ergo.mjs`;
  `scripts/verify-ergo.mjs` shares no code with it and re-derives every verdict, label and proof.

**JUDGED ROSTER, DATED (owner, 2026-10-10).** From 2026-10-11 Judged is Ergo (leads), Sworn,
Hearsay, Docket, Alibi; STANDS left. Days up to 2026-10-10 keep Docket, Sworn, Hearsay, Alibi,
Stands through the circuit's `before: { until, opener, keys }` field, which `circuitKeysFor`
honours, so no played day changes its cases. `app/judged/page.js` deals the day's roster through
`circuitKeysFor`, not `LAW_KEYS`; the pregame lede is built from each case's `phrase` in
`LAW_CASES`. `LAW_CLOCK.ergo` [45, 180] is an ESTIMATE; re-measure after two weeks of boards.

**JUDGED IS FOUR CASES from 2026-10-17 (owner): Alibi out**, roster Ergo, Sworn, Hearsay, Docket, each worth
25 (`lawCaseMaxFor(iso)`, `lawScorerFor(iso)`, still out of 100). `before` is now a CHAIN (five cases to
10-16, the Stands roster to 10-10), walked by `circuitKeysFor` for non-split circuits. Alibi no longer
mounts the Judged door; inside the run it carries Give up. A finished case stays mounted under its ruling
card and every case, the last included, waits for a button.
Stands no longer mounts the Judged door; Ergo does.

**ALIBI BACK from 2026-10-18 (owner, 2026-10-17): Ergo, Docket, Alibi, Sworn, Hearsay, 20 each.** 2026-10-17 alone
ran four at 25 (`LAW_FIVE_AGAIN_FROM`). The order is the owner's, not shortest first, so the circuit carries
`ownerOrder: true` and verify-circuits skips its order check. Alibi mounts the Judged door again.

**Every run's end screen carries "Return to all daily puzzles"** (owner, 2026-10-17): `app/circuits/RunBackLink.jsx`,
a plain text link with an arrow, centred in the run's cap, rendered only when the run is done (`{done && <RunBackLink />}`)
in RunClient, Valet, Price Check, Passport (both clients), Judged, Dojo and Read the Room. A new run adds the same line
to its cap and its cap class to the component's position:relative rule. Never give a run cap the class `vf`: Judged's
verdict container is `.vf` with a 980px max-width, which is why its header shrank on the verdict.


## Price Check scores the FIRST guess, three guesses an item (owner, 2026-10-11)

From 2026-10-11 (`V2_FROM` in `lib/price-games.js`) every price game, solo and in the run,
gives THREE guesses worth up to 10, 6 and 3 (`CAPS`); an item scores its best capped guess,
a bullseye (within 1%) ends it, and so does a state where no later guess can beat the score.
The board's `priceTiebreak` is the FIRST guess's error in basis points (it was the closest
guess's). Everything branches on `isV2(live or quizId)`, so archived days replay and score
under the five-guess rule they were played under. `scoreGuesses()` is the one scorer; never
re-derive a score from `scoreOf` alone.

- **The card ladder was recut** (`RUN_RANKS_V2`, read through `ranksFor(when)`): Black 40+,
  Gold 34, Credit 29, Debit 22, Prepaid below. Same five cards in the same order, so every
  card drawing indexes both ladders. A share link carries `&r=2` and the card route grades it
  on the new ladder; a link without it is an old run.
- **Saves carry `rule: 2`** (per-puzzle save and the run store). A v2-day save without it is
  discarded on load (`readDoneSave(key, num, when)`, PriceGame's stale check, the run store),
  and `ItemsPop`'s `resetOldRuleSaves` cleared every old-rule save of the 10-11 boards once,
  on that day only. Today's five boards were wiped with `/api/admin/quiz-reset`, which now
  takes `before` (ISO) so plays filed after the switch survive.
- **The finale has a field panel** (`FieldPanel`, v2 only): the field's runs by card worst to
  best with you marked, the top five game by game (score, first-guess miss, which guess earned
  it, inferred from score and first-guess error by `earnedAt`), and a shelf per item. Its data
  is `priceField` on `/api/quiz/daily-combined?circuit=pricecheck` plus `perGame.bps`, which
  `lib/daily-combined` now carries through every hop for display only.
- **A locked item keeps playing (owner, 2026-10-11, same day).** Reaching a score no later guess
  can beat no longer ends the item; it stamps `lockG` (guess count) and `lockT` (time) on the save,
  the player may keep guessing for fun or press "Stop here", and a bullseye or the third guess still
  ends it. The board's tiebreaks read the lock moment: `guessesUsed` posts `lockG` and the clock
  stops at `lockT`, so playing on never costs rank. Leaving during the free guesses files the locked
  score whole through the abandon flush, never a 0.
- **On a phone the board follows the keyboard.** While the guess input has focus on a coarse
  pointer, `pinAsk` scrolls so the newest guess row (or the hint line) sits just above the
  keyboard, never pushing the input off the top; it re-runs on visualViewport resize and after each
  guess, and a 45vh spacer gives the page room to scroll. The Guess button prevents mousedown so
  tapping it never blurs the input and bounces the keyboard.

## Tally: one way in, solvable by deduction, no notes (owner, 2026-10-13)

Owner: "most days it is too hard to deduce", and the locking and sliding was more machinery
than the game needed. Measured first: only 30 of the 92 boards already played could be
finished by line sums and the rack count alone; the rest needed trial and error.

- **From 2026-10-14 (`LOGIC_FROM` in `scripts/gen-tally.mjs`, `TALLY_LOGIC_FROM` in
  `scripts/verify-daily-banks.mjs`)** every board opens with EXACTLY ONE row or column holding
  a single empty square, and is solvable by the human solver in `lib/tally-logic.js`:
  single-square lines, line sweeps (every way to fill a line from the tiles left), and the
  rack count, nothing else. The verifier proves it with a separately written solver and
  failed 35 of the 46 old future boards (10-15 on). Boards before 10-14 are frozen.
- **The week ramps by rack size** (Mon 12, Tue/Wed 13, Thu/Fri 14, Sat 15, Sunday 6x6 17-18)
  and then by measured difficulty, taking the weekday's quantile from a pool of 14.
  `node scripts/gen-tally.mjs --regen-from <date> --write [--until <date>]` rebuilds from a
  date; a plain run appends.
- **The client has no notes, no tap cycle, no hold-to-lift and no slide.** Tap a digit then
  squares, or a square then a digit; tap a placed tile to pick it up, then an empty square to
  move it (one move) or the same tile to send it home (free); drag to move or swap, drag off
  the board to send home; keyboard arrows, 1-9, Backspace, Escape. A tap on a placed tile only
  ever picks it up, so a stray tap never costs a move. The rack is one key per digit with its
  count. Each target shows what its line still needs (`7 in 2`).
- **Scoring did not change**: 10 minus one point per two moves over the fewest, ties on extra
  moves then time. The hint fills the next square the human solver settles.

## Hold (`/hold`), Cell (`/cell`) and Swindle (`/swindle`): launched 2026-10-14

Wired by `scripts/wire-hold-cell-swindle.mjs` (anchored after Crib and Defend, idempotent). Glyphs in
`lib/game-glyphs.js`, share cards `public/og/<key>.png` from `scripts/bake-og.mjs hold cell swindle`.
Premiere 2026-10-14 to 10-18. Banks run 110 days, 2026-10-14 to 2027-01-31.

**Hold** (Cards, `miss: null`, first attempt stands, clock breaks ties): ten Jacks or Better hands a
day (fifteen on Sunday), 9/6 full pay. A hold's value is its exact expected return over every draw
from the 47 unseen cards; one point when the player's hold ties the best. The flavour draw after each
hand comes from a fixed per-day order and scores nothing. `lib/hold-core.js` values all 32 holds;
`scripts/gen-hold.mjs` (pool with worker threads, resumable in /tmp/build, then bank);
`scripts/verify-hold.mjs` has its own sort-based evaluator over all 2,598,960 hands. The ramp is the
GAP between best and second-best hold plus a count of TRAPS (the best hold differs from a stated
naive rule): Mon gap >= 0.30 no traps, rising to Sat 5 to 6 traps, Sunday 5 to 7 of 15.

**Cell** (Cards, keepsAnswer, attempts 'graded', `miss: 'Tries'`, scored with lib/par.js like Taire):
FreeCell on 32 cards (ace to eight) in six columns, free cells Mon/Tue 4, Wed/Thu 3, Fri/Sat 2;
Sunday 40 cards in seven columns on two cells. Every player move counts one; safe autoplay is free
and the solver models it, so `perfect` is the exact minimum. No solution ships. `lib/cell-core.js`
is the rules engine; `scripts/gen-cell.mjs` an exact A*; `scripts/verify-cell.mjs` re-proves every
minimum with its own engine (about 8 minutes; `--quick`). Posts `progress` = cards home.

**Swindle** (End Game, keepsAnswer, `miss: 'Tries'`, SOLVE_ONLY): White is badly lost; exactly one
first move forces a draw (stalemate, threefold, insufficient material), every other is mate within
three. The bank stores a BOOK of every holding line; a move off the book throws the draw away and is
counted silently. `lib/swindle-core.js` holds the deterministic defence; `scripts/verify-swindle.mjs`
re-derives everything with its own 10x12 chess. **Swindle debuted the "Slate" chess board (owner
pick A, 2026-10-14, canvas "Chess Boards and Gift")** in `app/swindle/SwBoard.jsx`: cool grey squares
that follow the register, two-tone pieces with a hairline, gold last move and selection, coordinates
outside the board. Mate, Defend and Queen moved onto the same squares the same day: the board tokens
are `--stg-chess-l` / `--stg-chess-d` / `--stg-chess-bstroke` in app/globals.css (both registers),
and selection and the hint are a gold ring. Check keeps its own `--stg-sq-*` pair.


## Gift (`/gift`): the daily Quarto endgame (launched 2026-10-16)

Key/route `gift`, category **End Game** (the tenth), `keepsAnswer: true`, `miss: 'Tries'`,
SOLVE_ONLY, in DEFEAT_GAMES, legacy accent violet `#7c3aed` / navy `#c4b5fd`. Built from the
"Chess Boards and Gift" canvas mockup (round board of sixteen wells, the gift in a gold-ringed
well, the pieces still off the board in a tray, Hand it over). Wired by `scripts/wire-gift.mjs`
(anchored after Swindle, idempotent). Tiles `public/games/btn-gift.png` and the blue copy, PWA
icons in `public/gift-icons/`, `public/gift.webmanifest`, share card `public/og/gift.png`.

- **The game.** Sixteen pieces, one bit per trait (bit 0 tall, 1 dark, 2 square, 3 hollow;
  codes T/S D/L Q/R H/O). Place the piece you were handed, then hand over one still off the
  board. Four in a row, column or long diagonal sharing ANY trait wins for whoever placed the
  fourth; a full board with no line is a draw (scores 0).
- **The claim per board:** no line finished, the gift wins nowhere on the spot, the player
  forces a win on placement `winIn` (the gift is the first) and not sooner, and EXACTLY ONE
  first move (`keySq` plus `keyGive`) forces a win at all. The page strips `keyGive` from every
  board and `keySq` from every board but the one played (the first-play hint rings the square).
- **The ramp** (pieces on the board before the gift, winIn): Mon 9/2, Tue 8/2, Wed 8/3, Thu 8/4,
  Fri 7/3, Sat 7/4, **Sunday Edition 7/5**, where the last piece decides it. No. 1 (a Friday)
  took the Monday shape. Within a weekday the board is a quantile band of `safe` (first moves
  that do not hand over an immediate win). Bank 2026-10-16 to 2027-01-31.
- **Engine `lib/gift-core.js`**, shared by the generator and the browser: two bounded
  questions with memo (`win(n)`, `lose(m)`), exact `value`, `moveWins`, and `reply()`, the
  deterministic defence (best value, then lowest square, then lowest piece). Never more than
  ~100ms a reply on the bank. Moves are stored as `'sq:CODE'` strings; an off-key move plays on
  and is counted silently (`threw`), `progress` = your turns played while the win was there.
- **Checks:** `scripts/verify-gift.mjs` (own per-line search, no shared code, a few seconds),
  `scripts/gift-mutation-test.mjs` (17/17), `scripts/verify-gift-playout.mjs` (plays the key
  and every other first move out with the shipped engine: 6,576 games, about 15s).
- **Extend** with `node scripts/gen-gift.mjs pool <k> [chunks] [workers]` per board size (cache
  in /tmp/build), then raise `LAST` in the generator and `bank`. Boards already live are frozen:
  splice new days under them rather than re-dealing.
- **Board endgames split** when Gift made End Game ten: 'Board endgames' is Four, Gift, Check
  (set page rewritten) and the new 'Territory endgames' is Chain, Turn, Yose (its own set page).
- Not in a circuit yet (Board Games is a four-game circuit with a measured clock); an owner call.


### The Quizzes pane IS the quiz home; /quizzes redirects to it (owner, 2026-10-16)

The standalone `/quizzes` page (`QuizLandingClient.jsx`, deleted) was folded into the
home's Quizzes pane: its two photo banners (most played + newest Geo Guesser, picked by
`/api/quiz/pane`), search, "Your best topics", and every topic's FULL list, which opens in
place under the topic card ("Show all N", sortable Newest / Most played / A to Z, 24 then
"Show the other N"). Tiles wear their quiz's own `QUIZ_HEROES` photo; a topic card wears
its most-played quiz's photo, else `DEPT_HERO`; photos go through `/_next/image`.

- **`/quizzes` is a temporary redirect to `/#sty-quizzes`** that keeps the query string
  (referral `?ref=`, `?theme=`). It is out of the sitemap. Every in-site link that pointed
  at `/quizzes` now points at `/#sty-quizzes` (the home opens the pane from the hash), and
  `refShareUrl` defaults to `/`.
- **`/quizzes/all` stays live and in the sitemap, but nothing on the site links to it**
  (owner: keep the pages that help SEO, do not link them). Do not re-add it to the footer,
  the SEO prose, the archive or the pane. Note the trade: the pane's quiz links are drawn
  client-side, so the sitemap is now the crawler's only path to most `/quiz/<id>` pages.

## Squash (`/squash`): the daily match-three (launched 2026-10-17)

A match-three with fruit as a daily. Key/route `squash`, category **Arcade**, `miss: null`,
`unit: 'points'` (a tally game: the score is raw points, uncapped, against the day's par), legacy
accent `#db2777` / `#f9a8d4`. Arcade rules throughout: unlimited runs, the board and the local
record keep the BEST run, `XP_DAILY_CAP.squash = 1`. Wired by `scripts/wire-squash.mjs`.
**No new-game pop-up (owner, 2026-10-17): `squash` is in NO_PREMIERE and has no PREMIERES row.**
Not in the Arcade circuit; whether it joins is an owner call.

- **The day is generated, not banked.** `lib/squash-engine.js` deals the opening board off the
  quizId and gives every COLUMN its own seeded stream of fruit, so the k-th fruit to drop into a
  column is the same for everybody. The same file is the engine the client plays and the verifier
  proves. `app/squash/puzzles.js` carries the frame (size, seconds) and a MEASURED par, written by
  `scripts/gen-squash.mjs`: the midpoint of a greedy bot and three random swappers
  (`scripts/squash-par.mjs`) at a blitz pace of 75 swaps, rounded to 100. Any engine change moves par; the verifier fails
  until the bank is regenerated.
- **Rules:** a FIVE-MINUTE BLITZ (owner, 2026-10-17; it launched an hour earlier as 25 moves):
  the clock starts on the first swap, swaps are unlimited until it runs out, and fruit already
  falling at zero still lands. Weekday 8x8, Sunday Edition 9x9; six fruit. Pausing (or hiding
  the tab) stops the clock and COVERS the board, so a pause cannot be used to plan. A swap that
  makes no match slides back and costs nothing. Four in a line makes a slicer (clears the line it
  cuts across), an L or T a bomb (3x3), five a punch bowl (clears a fruit kind). Special pairs
  combo with no match. Points: 10 a fruit times the cascade wave, plus 60 / 100 / 200 for making a
  slicer / bomb / bowl. A board with no move shuffles off a seeded stream.
- **Input:** drag onto a neighbour, or tap then tap; arrows + Enter on a keyboard. After 9 idle
  seconds the first valid swap in reading order wiggles (a nudge, never the best move).
- **Ties break on fewer swaps** (every run is five minutes). A run in progress is saved after
  every swap and every few seconds, and comes back paused.
- `scripts/verify-squash.mjs` checks the bank and the engine (every special and combo, the
  shuffle, determinism of the same moves, and that each par still matches the engine).

## Arcos (`/arcos`): the daily set of acrostics (launched 2026-10-18)

Three small clued acrostics a day and a finale. Key/route `arcos`, category **Word**, `miss: null`,
legacy accent `#1e40af` / `#93c5fd`. Wired by `scripts/wire-arcos.mjs` (beside Scram everywhere).
Skills Language, Memory, Deduction. Daily group and finish set Crosswords, plus the Word chains set.

- **The day:** a FRONT acrostic (first letters spell a hidden word), a BACK one (last letters), a
  DIAGONAL one (letter N of row N; every row one length, the word plus one), then the FINALE: one word
  that pairs with all three hidden words from `scripts/hinge-pairs.txt` (CHECK, STAND, BREAK + POINT).
- **Scoring:** each acrostic is worth 3, minus 1 per row shown with "Show this answer" (armed by a second
  tap), and counts only when complete; the finale is worth 1 within three tries. Out of 10, time breaks
  ties, `guessesUsed: 0`. A wrong entry shakes, clears and costs nothing. In `XP_LINEAR_DAILIES`.
  The free first-play hint ghosts the spine letter.
- **Clues are never invented:** every answer and clue comes from the Emcee and Encore clue banks.
  `scripts/gen-arcos.mjs` (deterministic, append with `--until`) and the independent
  `scripts/verify-arcos.mjs`: the finale must be the ONLY word pairing with all three on either side,
  no clue carries any word of the day, nothing repeats in the bank. Bank 2026-10-18 to 2026-11-30.
- **Ramp:** hidden words Mon-Wed 4 letters, Thu-Sat 4-5 with a 5, Sunday Edition 5-6; answers Mon 4-5,
  Tue-Sat 4-6, Sunday 5-7.
- **The finale accepts EVERY real fit (owner, 2026-10-18).** CHECK, STAND, BREAK took POINT and also UP and
  OUT, which the old uniqueness rule could not see (its only source was hinge-pairs). Each board carries
  `also`: every other word that goes with all three on EITHER side, from the Scrabble lists (closed words:
  CHECKUP, STARLIGHT), hinge-pairs and `scripts/arcos-phrases.txt` (two-word WordNet lemmas, STAND BY,
  CHECK IN), under `scripts/arcos-accept-rules.json` (no affixes like ER or LESS, no plural beside its
  word). `scripts/arcos-accept.mjs` computes it; `node scripts/gen-arcos.mjs --also` rewrites every board's
  list; `verify-arcos` recomputes it word by word and fails a missing real fit or a listed non-fit. The
  generator no longer rejects a trio with rivals. The finale is an OPEN LINE with no length shown, checked
  on Enter (an ENTER key joins the on-screen keyboard at the finale); a word already tried costs nothing.
  A solve with another word reads "OUT works. The setter had POINT." and every finish lists the rest as
  "Also accepted".
- **Ending:** the `arcband` beat in `lib/finish-beat.js`: the three hidden words slide in as bands in the
  ramp's sky, mint and lime, then the finale drops in gold, before the iris.

## Topple (`/topple`): the daily block-rolling puzzle (launched 2026-10-20)

Owner, 2026-10-19: "a block rolling clone of Bloxorz", Logic, scored on moves against par. Key/route
`topple`, category **Logic**, `miss: 'Tries'`, legacy accent `#3f6212` / `#bef264`. On the stage it
wears the Logic ramp (the block is `--stg-acc`). Wired by `scripts/wire-topple.mjs` (beside Junkyard).
Skills Spatial and Planning. Daily group Roll and route (new, with Chomp and Paths, which left Sorting
puzzles), finish set Slide and shift.

- **The rules** (`lib/topple-engine.js`, shared by client and generator): a 1x1x2 block, four rolls, each a
  quarter turn over an edge. Any part over empty space: it falls, back to the start. Standing on an orange
  FRAGILE tile: it cracks, back to the start. **No switches and no bridges** (owner, 2026-10-19).
- **The goal is a SPRING, not a hole** (owner, 2026-10-19): it fires the block off the top of the board. A
  spring is ONE tile (land standing) or TWO side by side (land LYING FLAT across both). Monday is always one
  tile; other days about half and half off the date's seed.
- **Scoring is Parker's** (`lib/par.js`): `perfect` is the exact BFS minimum and scores 10, par is
  a cushion above it and scores 8. **Every roll counts**, including those before a fall and a restart (a
  restart is an `'X'` in the move list, not a roll): a fall is the only undo, so a free one would let a
  player search the board by hand. Give up posts 0. One free hint on a first play lights the next roll.
- **The bank is GROWN** by `scripts/gen-topple.mjs` (deterministic off the date; extend with
  `--until <date> --append --write`): rooms and corridors, then a hill climb for a longer perfect line,
  more reachable positions and a blocky floor; fragile tiles must change the answer; dead floor is trimmed.
  Ramp: Mon plain 12-16, Tue 14-18, Wed 16-20, Thu 18-23, Fri 20-25, Sat 22-28, Sunday Edition 30-38 on a
  bigger board. `scripts/verify-topple.mjs` re-solves every board with an INDEPENDENT cube-rotation solver.
  Bank 2026-10-20 to 2027-01-31.
- **The board** (`app/topple/ToppleBoard.jsx`) is a canvas in a three-quarter view where up on the screen
  is up on the board (the isometric mockup made the arrow keys read as diagonals). Colours are stage tokens
  resolved through a hidden probe at draw time, so it follows the light switch. Arrows/WASD, swipe, or the pad.

## Roll (`/roll`): the daily die-rolling puzzle (launched 2026-10-20)

Topple's sibling (owner, 2026-10-20: "could it use the same engine as topple? ... touch 3 or 4 or 5 in
order with numbers matching across a grid"). Key/route `roll`, category **Logic**, `miss: 'Tries'`,
`attempts: 'graded'`, `keepsAnswer`, legacy accent `#166534` / `#86efac`; on the stage it wears the
Logic ramp like Topple (the die is `--stg-acc`, pips `--stg-onramp`). Wired by `scripts/wire-roll.mjs`
(beside Topple). Skills Spatial and Planning, daily group Roll and route, finish set Rolling puzzles.

- **The rules** (`lib/roll-engine.js`, shared by client and generator): a die, four rolls, each a quarter turn
  over an edge, tracked as top/north/east (opposites sum to seven). Squares numbered 1 to N must be LIT IN
  ORDER: a square lights when the die lands on it with that number on top. **A numbered square is BLOCKED
  (owner ruling, 2026-10-20)** unless it is next AND the roll would land its number on top; a blocked roll,
  or a roll off the floor, is refused and costs nothing (the die tips and settles back). Lit squares are
  ordinary floor. Orange CRACKED squares crumble once the die rolls off them.
- **No hint** (owner, 2026-10-20). Undo ('Z') and Restart ('X', which also mends the cracks) are free moves in
  the list but never refund a roll: rolls = every U/D/L/R recorded. Scoring is Topple's (`lib/par.js`),
  Give up posts 0. The pad marks the key that would light the next square and dims blocked ones.
- **The bank** (`scripts/gen-roll.mjs`, deterministic off the date, extend with `--until <date> --append
  --write`): random-walk floors, kept only when the BFS perfect is in the day's band, the blocked rule costs
  rolls (crossing numbers freely is at least 2 shorter, 3 from four numbers), cracks change the answer, and
  the die never starts showing 1; the best of 24 legal boards is kept and dead floor trimmed. Ramp: Mon 3
  numbers 9-12, Tue 3 13-17, Wed 4 17-21, Thu 4 + cracks 19-24, Fri 5 23-28, Sat 5 + cracks 26-32, Sunday
  Edition 6 + cracks 36-44. `scripts/verify-roll.mjs` re-solves every board with an INDEPENDENT six-face
  permutation solver. Bank 2026-10-20 to 2027-01-31.
- **The board** (`app/roll/RollBoard.jsx`) is Topple's canvas with a LEAN (`KX`) so the die shows its top,
  front and right faces (owner, 2026-10-20: "a diagonal view so can see 3 sides at once"); rows and columns
  stay square to the screen so the arrows read straight.

## Crossed Up (`/crossed`): the crossword run, and only designed runs remain (owner, 2026-10-20)

**Every plain skill circuit and the Daily Five were RETIRED 2026-10-20**, with their trophies and
landing pages (crosswords, word-building, wordplay, mental-math, pencil, spatial, sorting,
chess-board, chess, table, recall, ranking, arcade, and the marquee five). `lib/daily-five.js`,
`DailyFiveBand`, `WelcomeOverlay` and the daily-five scripts are deleted. Trophies are computed on
read, so the retired ones simply vanish. Old `/circuits/<id>` URLs 308 to the nearest category page
(`next.config.js`). `isMarquee()` survives and returns false so its callers need no edit;
`/daily-five?circuit=<id>` still serves the summary for kept runs, and a bare `/daily-five`
redirects to `/circuits`. The runs left are the designed ones: Judged, Enter the Dojo, Crossed Up,
Read the Room, the Trivia Gauntlet, the Trivia Encore, the English and Math Gauntlets, Price Check
and Passport.

**Crossed Up** is circuit id `crossed` (reader-facing "Crossed Up"; `/crossedup` and `/crossed-up`
redirect), engine `crossed`, scorer `crossed`, `scoreFrom: '2026-10-20'`, `ownerOrder`, trophy "In
Pen" (gold, PenTool). Four crosswords in the owner's order: Emcee, Encore, Arcos, Glyph, embedded
through RunEmbed like the Dojo (`app/crossed/CrossedClient.jsx`, each client reads `useRunEmbed()`
and mounts `RunDoorPop id="crossed"` on today's gate). Out of 100: Emcee 15, Encore 25, Arcos 30,
Glyph 30 (Encore 35, Arcos and Glyph 25 on launch day; owner moved weight off Encore 2026-10-20), and of each a FIFTH for finishing and four fifths for speed (owner: "most all will
finish"), with clocks from `lib/crossed-clocks.js` (adaptive, like the Dojo's). Ranks are the
weekday ladder, Monday Solver up to Saturday Solver and Solves in Pen. Ending is
`CrossedCurtain.jsx` (the Dojo's grading-curtain shape with the four finished grids), share card
`/crossed/card`.

**Crossed Up wears its OWN elements, never the Dojo's** (owner, 2026-10-20): the start button is a
1 Across entry (CROSSED UP, (7, 2)) that types itself in pencil and inks on press; the four puzzles are
clippings on a puzzle page, each showing its day's grid SHAPE (no letters, via `gridOf` from the
curtain); the rank mark is THE WEEK (`app/crossed/Week.jsx`, `WEEK_CSS`): seven squares MON to PEN,
inked up to the rank and the landed one circled in red pen, used on the card, the curtain's climb and
the share card. Tags and ink come from `crossedDayTag` / `crossedInkOn` in lib/crossed.js.

### Full-screen colour never leaves a dark scrollbar strip: `lib/root-paint.js`

`globals.css` sets `scrollbar-gutter: stable` and the root is painted the dark ground, so a
`position: fixed` overlay (the win iris, the curtain flood, every run's ending curtain) covered
everything but the reserved gutter, which showed as a black bar down the right edge. Any
full-screen colour must call `holdRootPaint(color)` while it is up (it returns a release; holds
stack): it paints `<html>` and `<body>` that colour through `html[data-sot-paint]` and recolours
the scrollbar to match. Wired in `lib/finish-beat.js` (the iris), `StageFinish`'s flood,
`DyeCurtain`, `CrossedCurtain`, `GauntletFinale`, Price Check's `PriceScanner`, Read the
Room's `HouseLights` and Passport's `Departures`. A new curtain adds the same one-line effect.

## Crossed Up is five crosswords from 2026-10-24 (owner, 2026-10-23)

Anon joined as the FINAL puzzle. `lib/crossed.js`: `CROSSED_ANON_FROM`, the five-way
weights (Emcee 12, Encore 20, Arcos 22, Glyph 22, Anon 24; Arcos and Glyph still
above Encore) and `CROSSED_WEIGHT_BEFORE` for the four-game days, chosen by
`crossedWeight(key, iso)`. The circuit carries a `before` roster through 2026-10-23,
so no crowned day re-scores. AnonClient reads `useRunEmbed` like the other four.

## ARCADE PLAYS THE SAME EVERY DAY (owner, 2026-10-25)

Sweep, Squash, Snake and Blocks no longer run a Sunday variant. Through Sunday 2026-10-25 their
Sundays were different games (an 18.5% mine field, a 9x9 board, double growth, an 8-wide well);
from 2026-10-26 every Arcade day is the weekday game, Sundays included. Dario never had one.

- **The past is frozen.** The Sundays already played keep `sunday: true` and their Sunday frame,
  so the archive and the badges still describe them truthfully. Every Sunday from 2026-11-01 was
  re-dealt with the weekday frame (Squash pars re-measured, Sweep fields re-proven at 15%).
- **`SUNDAY_UNTIL` in `lib/sunday-editions.js` closes an edition without deleting it.** The four
  keys stay on `SUNDAY_EDITION_GAMES` (the list also answers "was that archived day a Sunday
  Edition?"), and `hasSundayEdition(key, on)` now takes the day being described: after a game's
  `SUNDAY_UNTIL` date it answers false, so no hub chip, FAQ line or dated title promises a Sunday
  Edition that no longer runs. Callers that describe a specific day pass it (dated titles in
  `lib/daily-games.js` and `QuizHomeClient`, the slate's back-fill chips); everything else asks
  about today in Eastern time by default. Retiring another game's Sunday Edition is one line here.
- **The generators and verifiers carry the same date** (`SAME_FROM = '2026-10-26'` in
  gen/verify for snake, squash and sweep, and the inline test in gen/verify-blocks): a Sunday frame
  is required before it and forbidden after it.
- Reader copy says "Every day plays the same, Sundays included" where it used to describe the
  Sunday twist; the in-game badges stay keyed on `PUZZLE.sunday`, which is false from 2026-10-26.

## Mahj (`/mahj`): the daily 144-tile mahjong solitaire (launched 2026-10-25)

Key/route `mahj`, category **Cards**, `miss: null`, legacy accent magenta `#a21caf` / `#e879f9`,
skills Spatial, Planning (verify-skills allows two at most). Built from the "Mahj Mockup" canvas
(https://claude.ai/artifact/Ej8gVeF1PZo3JYWAGN4rH4). Wired by `scripts/wire-mahj.mjs` (anchored
beside Hold). Tiles `public/games/btn-mahj.png` and the blue copy from
`node scripts/gen-tile-art.mjs mahj`; share card `public/og/mahj.png` from `scripts/bake-og.mjs mahj`.

- **The full 144 every day** (owner), on a layout that changes with the weekday
  (`lib/mahj-core.js` `LAYOUT_BY_DOW`): Monday Bridge, Tuesday Fortress, Wednesday Cross, Thursday
  Towers, Friday Wide, Saturday Arena, Sunday Pyramid (the Sunday Edition). Every layout is 144
  positions, none overlapping on a layer, every raised tile resting on one below.
- **Rules:** a tile is FREE when nothing on the layer above overlaps it and its left or right side
  is open. Two free tiles with the same face clear; any flower with any flower, any season with
  any season. **Look Under** (layer pills) hides the upper layers as dashed outlines so the tiles
  beneath can be read: the deal holds no secrets (owner approved the open-information design).
- **TIMED (owner, 2026-10-25).** A full clear scores 10/10 and ranks on `timeElapsed`. Undo is
  free; **Shuffle** redeals the tiles left into a clearable layout (seeded by the day and the
  shuffle count, so it is the same redeal for everyone in the same spot) and adds 30 seconds to the
  posted time (`SHUFFLE_PENALTY_S`). A run that stops short (give up, abandon) scores
  `floor(9 x pairs / 72)` and posts `progress` = pairs cleared, so it ranks on depth then clock.
  First attempt stands; one free first-play hint (a pair the search proves keeps the board
  clearable when it can within budget).
- **Print, not tiles, carries colour** (owner, mockup rounds): white faces, gray when blocked, and
  the marks in the site's category pastels (dots sky, bamboo mint, characters rose, winds
  periwinkle, flowers magenta, seasons orange, dragons rose / mint / periwinkle frame), each mark
  outlined in the one dark ink `#08222e` so a pastel reads on white. A dark corner index on every
  tile (number or E/S/W/N, R/G/W, F/S) so no one needs to read the characters.
- **Solvable by construction.** `dealOver` walks a removal order over the full layout, always
  taking two tiles free at that moment, and hands each step a matching pair. The order goes to
  `scripts/mahj-orders.json` (never shipped). The week ramps by **measured ease** (`easeOf`: the
  mean share a random player clears, 40 seeded runs) over 16 candidate deals a day: Monday takes the
  gentlest, Sunday the hardest. `node scripts/gen-mahj.mjs` rebuilds the whole bank byte for byte.
- `scripts/verify-mahj.mjs` re-derives the cover and side relations with its own code, checks the
  frame, the layout and the full tile set, and **replays every day's clearing order** to an empty
  board with its own free rule. Bank runs 2026-10-25 to 2027-01-31.
- On a phone (640px and under) a **Zoom** control doubles the board width inside a scroller; the
  14 to 16 column layouts are otherwise small at 360px.
- Phone play runs on the full-screen **PlayStage** (`usePhoneStage`): stats row (Time, Pairs, Open),
  a minimap with a viewport box (tap to jump), Whole board / Big tiles (46px tiles, the default), the
  board in a scroll port, and a tray of Undo, Hint, Shuffle +30s and Look under. Owner rule: the
  port's scrollbar is INVISIBLE (scrollbar-width none plus ::-webkit-scrollbar display none); the
  minimap is how a player sees where they are.
