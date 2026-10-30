# Authoring daily puzzle banks

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Authoring daily puzzle banks: the authoring standard, bulk bank extension, Sunday Editions, adding a new daily game, Crux/Garble/Links/Warmer/Cipher rules, SEO for new dailies, restocks

## Daily word games (Crux + Garble) — design and authoring rules

These games live outside the quiz catalog engine (standalone pages at /crux
and /garble with their own PUZZLES arrays) but post to the same metrics rails.
Rules below exist because each one was learned the hard way. Follow them for
every new puzzle and every new game in this family.

**Cadence and shape**
- Crux weekdays: 4 categories × 2 words, score /16 (8 solves + 8 placements),
  18 guesses. Crux Sundays: 4 × 3, score /24, 27 guesses, flagged `sunday: true`
  on the puzzle and badged "Sunday Edition" in the title row (see the Sunday
  Editions section below — the flag is the source of truth, never the word or
  guess count). The engine derives everything from puzzle data — never hardcode
  counts in copy or UI.
- Garble: 5 scrambled words (5s and 6s), marked letters must exactly spell the
  finale; finale has a punny clue and ends the game when solved.
- Bank puzzles ahead: catalog entries carry publishedAt at ET midnight
  (T04:00:00Z); the hub and sitemap hide future-dated entries automatically.

**The uniqueness rule (Crux) — audit EVERY puzzle**
A puzzle is broken if more than one full assignment of words to categories is
semantically defensible. For every pair of categories, test whether any word
subset could swap and still read as correct (arch supports and boot calves
made ARCH/CALF interchangeable with HEEL/TONGUE; NEPTUNE/JUPITER/VENUS were
all both Roman gods and planets — both shipped broken and needed same-day
`rev` fixes). A trap word is only fair if it is PINNED: its tempting wrong
category must be provably full of words that fit nowhere else. Traps are
resolvable temptations; ambiguity is a broken answer key. Category names must
never contain any answer word, and should not echo a trap word.

**The anagram-twin rule (Garble)**
Every scramble word must have no common-English anagram twin (DUSTY↔STUDY,
THORN↔NORTH, ETHOS↔THOSE, DINGY↔DYING all caught in authoring). Check twins
against public/crux-words.txt by sorted-letters; obscure Scrabble-only twins
are acceptable, common words are not — a player who types a valid unscramble
must not be punished for the author's collision.

**Word hygiene**
- No answer-word reuse across a game's whole history (Crux and Garble pools
  are tracked separately).
- Crux answers must be typeable under the real-word guess gate: dictionary
  words pass via public/crux-words.txt; proper-noun answers (JUNO, MINERVA,
  URANUS) are covered by the ANSWER_WORDS union in the client — keep them in
  PUZZLES data or they become unguessable.
- **The GUESS SPACE matters as much as the answer, and it is checked per WORD
  LENGTH (owner rule, 2026-08-09).** A player types into a slot of a fixed
  length, so a length the dictionary does not carry rejects every word they can
  type, not just unusual ones. public/crux-words.txt shipped the rack games'
  2-to-8-letter Scrabble list, so crux-8-9-26's 9-letter TRIBUTARY slot had a
  guess space of FIVE words: a regular hit "Not in the word list" on every
  guess and abandoned the board. Making the answer itself pass (it always does,
  via ANSWER_WORDS) hides this completely, which is why hand-adding the long
  answers to the file in the past did not fix it. Two mechanics now:
  (a) the list runs 3 to 13 letters, 13 being the widest a Sunday grid can hold;
  (b) the client derives its covered lengths from the file and STANDS DOWN at
  any length holding fewer than 500 words, so a future truncation degrades to
  accepting anything rather than accepting nothing.
  `scripts/verify-daily-banks.mjs crux` fails the bank if any slot length in it
  falls under that floor.
- **The rack games get the same treatment through a SECOND file, never by
  editing tuck-dict.txt (2026-08-09).** Tuck (14-15 tiles) and Babel (11-wide
  board) had the identical hole: a long run was marked invalid whatever it
  spelled. But `public/tuck-dict.txt` is also the reference corpus the bank
  verifiers reason over — Glyph's uniqueness proof, Venn's hidden-word census,
  Garble's alternate-anagram check, the Shards solver, Tuck's benchmark solver —
  so widening it would silently move those proofs. Instead
  `public/tuck-dict-long.txt` carries 9 to 15 letters for PLAYER validation
  only, unioned in by `lib/rack-dict.js`, which also stands down at any length
  it cannot cover. tuck-dict.txt is frozen at 2 to 8; do not add to it.
  Tuck's benchmark solver stays on 2 to 8 deliberately, and MEASURING that was
  the point: rerunning it with the full 9-to-15 list moved not one benchmark
  across all 74 racks, because Tuck scores raw tile points and a long spine burns
  tiles that would otherwise sit at an intersection and score in two words. Do
  not "improve" it by widening the word list; that is a proven no-op. Shards
  needed nothing either: its grid is at most 8 wide, so no run can exceed the
  base list.
- **Lode had the SAME hole and it lasted longer, because Lode bakes its answer
  list into the bank (2026-08-15).** `scripts/lode-words.py` read only
  `public/tuck-dict.txt`, so no word of nine letters or more could reach any
  Lode board, ever. Seven reusable letters build long words constantly, so
  players typed BEGINNING, COHERENCE, INITIALLY, ABBREVIATE, INVALUABLE and
  ABOLITION and were told they were not words, and the complaint reached the
  owner as "the dictionary is too small". Note the shape: a hole in a length
  band is INVISIBLE to a spot check, because every word you think to test is a
  word you already saw on a board. Lode reads BOTH lists now; the pool went
  28,779 -> 49,189 words and the usable weekday board pool 4,528 -> 9,077.
  `MAX_WORDS` went 46 -> 60 and Sunday 70 -> 95 in the same pass (owner call),
  so the extra words are spent on giving players more to find rather than on
  rejecting the fuller boards.
- **Lode's dictionary gate is en_US THEN en_GB, and the order is the whole
  design (2026-08-15).** en_US hunspell is CASE SENSITIVE, which is what lets it
  veto proper nouns (`lard` is in it, `moby` and `texas` are not). en_GB is NOT:
  it answers yes to lowercase `broadway`, `canterbury`, `kirk` and `bonnie`, so
  it carries no proper-noun signal and can never be the gate. It runs only AFTER
  the en_US proper-noun veto, where its one job is recognising British spellings
  en_US genuinely does not know (gaol, moult, oedema, racoon, rouble, leant,
  paralyse, encyclopaedic, and the whole -ise / -isation family). Reversing the
  two, or ORing them, puts every lowercase name straight back on the boards.
  Both dictionaries are a hard requirement at refresh time (`apt install
  hunspell-en-us hunspell-en-gb`); the script exits rather than degrade to one,
  because degrading silently changes which words the game accepts.
- **THE REFRESH IS ADDITIVE, and that is now enforced rather than hoped for
  (2026-08-17).** `lode-words.py` reads its own previous `.lode-freq.json` back
  and unions it in, so a re-run can only ever ADD words. It used to be true only
  because the rules happened to widen each time, which made it a coincidence
  rather than a guarantee: a hunspell built by a different packager knows a
  different word list (the en_GB on npm as `dictionary-en-gb` does NOT know
  gaol, racoon or leant, which the Debian one does), so re-running on another
  machine would have quietly deleted real words from the game and nobody would
  have noticed until a player complained. The script now exits if a previously
  shipped word is missing from the corpus. To genuinely remove a word, delete it
  from the frozen file, or run a clean rebuild with `LODE_REBUILD=1`.
- **THE FREQUENCY FLOOR IS GONE ENTIRELY (owner call, 2026-08-17, same day).**
  This SUPERSEDES the 1.5 entry below, which lasted a few hours. The only bars a
  word clears now are **four letters** and the **proper-noun veto**; every other
  word in the shipped corpus is scored. Pool **67,300 -> 267,009**. The reasoning
  is that a curated pool always omits SOMETHING, and every omission reads to a
  player as "that is not a word", so no floor setting ends the complaint.
  - **The zero-frequency branch in `tierOf` is load-bearing, not cosmetic.**
    167,286 of the added words have NO wordfreq entry (eild, pumy, skirrs,
    konbus, solpugids). Zero is less than `TIER_RARE`, so without the branch each
    would pay TREBLE: measured, the median board's rare share goes 0.25 -> 0.49,
    half of every board becomes a x3 word nobody knows, and memorising a Scrabble
    list beats knowing English — the exact inversion of what rarity scoring is
    for. They score at the BASE rate (`NO_FREQ_TIER = 1`), which holds the rare
    share at 0.307 on the shipped bank. A frequency of 0 means "no recorded
    usage", NEVER "vanishingly rare"; do not collapse the two.
  - **The proper-noun veto SURVIVED the floor removal** and is now the only
    exclusion (1,419 words). It is a dictionary gate, not a frequency one. Drop
    it and india, michael, jordan and texas land on the boards. Vetoed words are
    not refused to the player either: they fall through to `extra` as tailings,
    so the "no real word is ever called a non-word" property still holds — 0
    buildable dictionary words are refused across all 500 boards.
  - **Caps went to 110 weekday / 120 Sunday**, and Sunday is NOT proportional on
    purpose. The vein is a share of the maximum, so a bigger board needs more
    words before the day closes: cap 170 -> 23 grind Sundays, 150 -> 15, 140 -> 7,
    130 -> 6, 120 -> 1. The bank ships with ONE grind board rather than a third of
    its Sundays. To make Sundays bigger the lever is `VEIN_SHARE`, not the cap,
    and that changes the rank ladder everywhere, so it is an owner decision.
  - **`buildBoard` had to be rewritten to finish at all.** It scanned every
    signature in the pool per board, which at 267,009 words ran over 25 minutes
    without producing a bank. It now walks the **subsets** of the board's letters
    (64 or 128 lookups) — provably equivalent, since a bucket belongs to a board
    iff its letter set is a subset containing the core, and `words` is sorted by a
    total order before return. Verified byte-identical against the old scan on a
    sample of generated boards. Runtime 25+ min -> **9 seconds**.
  - ⚠️ **`verify-lode.mjs` writes warnings with `console.warn` (STDERR).** A cap
    sweep that redirects `2>/dev/null` counts zero warnings at every setting and
    looks clean; that is how Sunday was briefly set to 150. Capture `2>&1`.

- **The floor is 1.5 and flat, and the RARE tier moved with it (2026-08-17).**
  Owner call after complaints kept coming in. Measured first: of every corpus
  word a player could build from a day's letters, 68% was refused, and the
  refusals between Zipf 1.5 and 2.5 were ordinary English that hunspell confirms
  (rile, glob, clef, ream, gild, rend, dolt, kith, mien, jamb, blab, clod,
  riffraff, ogled, fawned, tiptop, catcall). The per-length shape (4 letters
  2.7, 5 letters 2.25, 6 letters 2.1, 2.05 beyond) existed because frequency was
  policing proper nouns before the dictionary gate took that job, so it had
  outlived its reason. Pool 49,189 -> 67,300. **`TIER_RARE` had to drop 2.9 ->
  2.4 in the same pass**: every newly admitted word is rarer than the old floor,
  so leaving the boundary alone shoved all 18,111 of them into the x3 tier and
  took the median board's rare share from 0.20 to 0.34. A prize a third of the
  board earns is not a prize. At 2.4 the distribution lands back on the old one
  (rare share 0.257 -> 0.246). `MAX_WORDS` went 60 -> 70 and Sunday 95 -> 110,
  deliberately a much smaller rise than the pool's, because the VEIN is a share
  of the board maximum and the day still has to close in a few minutes: weekday
  boards went 39.0 -> 45.4 words and the vein 106 -> 119. Do NOT scale the caps
  with the pool one-for-one.
- **A REAL WORD IS NEVER CALLED A NON-WORD: every board carries `extra`
  (2026-08-17).** The scored pool is curated on purpose, so a board will always
  omit words that are in the dictionary, and "Not in today's lode" read to
  players as "that is not a word". Each board now also ships `extra`, every
  corpus word buildable from its letters that the pool does not score; typing
  one banks it as a **tailing**, acknowledged and worth zero. Verified across
  all 500 boards: **0 buildable dictionary words are refused anywhere.**
  - It touches NOTHING that scores: not the score, the found count, the rank,
    the board maximum, or the fewest-words tiebreak. That is precisely what made
    it safe to **backfill onto the 24 boards already played and ranked**, which
    is how the owner chose to fix them rather than regenerating and invalidating
    their leaderboards. BEGINNING, ABOLITION, PARAGRAPH, INITIALLY, COHERENCE
    and INVALUABLE are accepted on those boards now.
  - **`app/lode/page.js` strips `extra` from every board except the one being
    played.** All live boards ship to the browser so the archive works, and
    `extra` averages 66 words a board, so sending them all would add about
    0.75 KB per board per day forever for data that is dead weight on all but
    one (179 KB by mid-2027). The strip mirrors `pickPuzzle` in the client;
    if the two ever disagree the board just refuses unscored words again, which
    is the old behaviour rather than a break.
  - A board with no `extra` (anything generated before this date, or any board
    the page stripped) simply behaves the old way, so the field is optional.
- **A Lode regeneration passes `--avoid` at the boards it is keeping.** Boards
  already live are frozen and the new deal is spliced underneath them, so the
  fresh deal has to know their letter sets or it will hand out a board a player
  saw a few weeks ago (it did, on the first attempt at this change). Full
  refresh: rebuild `scripts/.lode-freq.json`, then
  `node scripts/gen-lode.mjs --from <tomorrow> --startnum <last+1> --days N
  --avoid app/lode/puzzles.js`, splice under the live boards, confirm those are
  byte-identical to origin, and `node scripts/verify-lode.mjs` must report 0
  failures AND no new warnings against the pre-change bank.
- **Tuck's benchmark is CALIBRATED to real play from 2026-08-10, not equal to the
  solver's best line (owner ruling, 2026-08-09).** `benchmark = round(1.06 x
  solverBest)`. The solver can only build ONE SHAPE (a single horizontal spine
  with verticals hung off non-adjacent columns), while humans build dense
  interlocking grids where far more letters cross and score twice, so they beat
  it by 10 to 22 points routinely. Over 246 real attempts on the first 23 boards,
  HALF of every serious attempt cleared the benchmark. A much stronger search of
  the SAME shape (bigger spine pool, beam over vertical choices, full dictionary)
  gained only +1 on average, which is what proves the gap is the shape and not
  the search or the vocabulary. 1.06 was fitted to put the win rate near 37%.
  The solver line still sets the scale, since it tracks rack strength; the
  multiplier only moves the bar. `scripts/verify-tuck.mjs` asserts the exact
  calibrated value from that date and mere achievability before it (played boards
  are frozen). To refit: pull each board's `scoreDist` from `/api/quiz/board`,
  drop attempts under half the benchmark as walk-aways, solve for the multiplier
  that hits the win rate you want, and restamp FUTURE boards only. Raising the
  benchmark also lowers IQ earned, since Tuck posts `total: benchmark` and IQ
  credit is score / total.
- Changing a LIVE puzzle's words or grid requires bumping its `rev` field so
  in-flight localStorage saves reset cleanly instead of corrupting.

**Crux variety is a property of the BANK, not of a board (owner ruling, 2026-08-19)**

Reported by the owner as "today's crux reuses a lot of categories and answers
from yesterday." It was much wider than two days. The Aug 11 to Sep 29 batch put
**Colors on 25 of its 50 boards and Metals on 23**, ran BRONZE 19 times and SAGE
14, and repeated **30 category+wordset pairs outright** (`Metals: BRONZE/SILVER`
nine times, on Aug 18 and Aug 19 back to back; `Roof parts: SOFFIT/RIDGE` on
those same two days). Every per-board check passed the whole time, because every
one of them is per board: the collision floor, the filing uniqueness, the
lattice. Variety only exists across the bank, so it has to be counted across the
bank. This is §7 of the bank-extension rules ("check pool variety, not just
per-board legality") applied to crux.

The cause is worth remembering, because it is the same shape as the Crux
collision-pool collapse and the Rung start-word collapse before it: a generator
optimizes for whatever is machine-checkable and ignores everything else. Only
2.7% of four-category draws from a natural pool clear the weekday collision
floor, so a generator that samples-and-tests inevitably converges on the handful
of categories that collide easily. Colors and Metals collide with nearly
everything, which is exactly why they ate the bank.

- **The rules, enforced in `scripts/verify-daily-banks.mjs` (crux section) and
  in the generator:** a category name may not return inside **7 days**; an
  answer word may not return inside **14 days**; a category+wordset pair may
  **never** repeat; and whole-bank ceilings scale with bank length (7 category
  uses and 4 answer uses per 50 boards). `CRUX_VARIETY_FROM` for the
  collision-pair rule tightened to the same date, so no trap runs more than
  twice either.
- **A violation is flagged when the LATER board is fresh**, which is what makes
  a new board answer for what a FROZEN board just used. Boards live before
  `CRUX_FRESH_FROM` (2026-08-20) are played history and are never rewritten.
- **`scripts/gen-crux.mjs` is the generator, and it is COMMITTED.** The batch
  that broke was built by a script nobody checked in, so nobody could re-run it,
  read what it optimized for, or fix it. A bank you cannot regenerate is a bank
  you cannot correct. It is deterministic (`--seed`), it reads the existing bank
  first so spacing is measured against the frozen boards too, and it prints
  objects ready to splice.
- **`scripts/crux-pool.mjs` is the vocabulary**: categories with their words,
  plus `READS`, the map of which words plausibly read as which OTHER category.
  `READS` does two jobs — it supplies the traps AND it is what filing
  uniqueness is proved against — so **an unannotated real reading is a second
  solution the check cannot see**. Annotate honestly, including readings that
  make a board harder to place. The generator GROWS a board along the collision
  graph rather than sampling and testing, which is what lets the pool stay wide
  while every board still clears its floor.
- **Both directions were regression-tested before shipping**: the checks report
  zero violations on the rebuilt bank and **336** on the batch they were written
  for. A check that has never been shown to fail has not been tested.

Aug 20 to Sep 29 2026 was rebuilt under these rules in the same push: 58
distinct categories over 164 slots (most used 5) and 254 distinct answers over
352 (most used 3), against 74 and 229 before.

**Naming and copy**
- Never name Wordle, Connections, or Jumble in user-facing copy or metadata —
  describe mechanics generically (NYT and Tribune enforce these marks).
  Categories are visible on the board, so never call them "secret".
- New game names get a collision search before anything ships (Tangle and
  Muddle were both taken; Crux and Garble were verified clear).

**Lattice generation (Crux)**
Machine-search layouts (random-restart assembly): crossings letter-matched,
word ends open, no orthogonally adjacent cells without a shared slot, all
slots connected, minimize max(rows, cols); keep ≤12 columns for mobile cells.
Validate every bank with the full structural sweep before pushing.

---

## Sunday Editions — the flag, the label, and which games have one (owner rule, 2026-07-20)

Twelve of the twenty daily games run a bigger/harder **Sunday Edition**. Eight do not.
This section is the whole rule set; it was written after an audit found the labeling
inconsistent across surfaces and one badge that could never render.

### `sunday: true` on the puzzle is the ONLY source of truth

Every game that runs a Sunday Edition sets `sunday: true` on that day's puzzle object in
its `app/<game>/puzzles.js`. Every badge, tag, and archive chip reads that flag and
nothing else.

- **NEVER infer a Sunday Edition from a proxy.** Crux used to badge off
  `PUZZLE.categories[0].words.length === 3` and the `/daily` archive off `guesses === 27`.
  Both were retired 2026-07-20 and Crux's four Sunday puzzles were given real flags. A
  proxy silently breaks the first time a weekday puzzle happens to match it.
- **The flag must reach the client.** Several games strip fields in `app/<game>/page.js`
  before passing puzzles to the client (Outwit, Alibi, Jester and Sworn hide their
  solutions); `sunday` must survive that strip or the badge dies silently. This is not
  hypothetical: Outwit's `clientSafe()` dropped `sunday` and had to be fixed when its
  edition shipped (2026-07-20). Check the strip FIRST when a badge won't render.
- **Generalizing a fixed-size game (the Alibi pattern).** When the Sunday changes the
  SIZE of a puzzle, the whole engine must take the size as a parameter. Alibi went from
  4 suspects to 5 by replacing `PERMS4` with a memoized `permsOf(n)`, `freshMarks()` /
  `freshState()` with `(n)` versions, every `< 4` loop with `< N` where
  `N = PUZZLE.suspects.length`, and the module-level `const TOTAL = 12` with
  `const TOTAL = 3 * N` inside the component (`mergeServerStats` sits OUTSIDE the
  component and had to derive its own total from `p.suspects.length`). The verifier's
  brute force AND its no-guessing propagation solver both had to take `n` too. Budget
  for the solver, the state model, the render and the validator together — a partial
  generalization mis-scores silently.
- **A size-changing Sunday changes `total`, and that is fine.** Alibi Sundays score out
  of 15 rather than 12. `scoreGame` in `lib/daily-combined.js` normalizes completion as
  `score / total` using the day's field-max total, so a different total on one day is
  handled — as long as EVERY player that day sees the same one. What is NOT fine is a
  stale literal that leaves half the code scoring against the old total.
- **Derive counts from data, never a literal.** A game whose Sunday changes a size must
  read that size off the puzzle: Tuck now uses `const RACK = PUZZLE.letters.length` in
  place of eleven hardcoded `14`s (scoring bonus, tiles-placed copy, share text), and
  Outwit's `TOTAL = PROMPTS.length * 2` was already correct. A stray literal is what
  makes a Sunday silently mis-score.
- **A game listed in `lib/sunday-editions.js` MUST flag its Sunday puzzles, and a game
  that flags them MUST be listed there.** The two drifting apart is the bug this section
  exists to prevent.

### The label is always "Sunday Edition"

One wording, everywhere a player can see it. A game may append ONE short detail after a
middot; it may not replace the label with flavor.

- Correct: `Sunday Edition`, `Sunday Edition · 6×6`, `Sunday Edition · Hard`,
  `Sunday Edition · Grand Inquest`.
- Wrong (all of these shipped and were fixed 2026-07-20): `Sunday 6×6`, `Sunday · Hard`,
  `The Sunday Jubilee · 9×9`, and worst of all `The Grand Inquest · 6 sworn`, which never
  contained the word "Sunday" at all.

The badge sits in the game's **title row**, next to `No. N · <date>`, styled with that
game's own accent (the palette is per-game; only the wording is standardized). The
archive and hub chips use the short form `Sun`.

### Which games have one, and what changes

| Game | Sunday Edition |
|---|---|
| Crux | 12 hidden words instead of 8 (27 guesses) |
| Emcee | 7×7 grid instead of the weekday mini |
| Encore | 11x11 grid instead of the weekday 9x9, around 44 answers against 26 |
| Span | a via/avoid rule constrains the route |
| Tally | 6×6 board instead of 5×5 |
| Suds | harder grid, fewer givens |
| Quilt | 26 printed clues instead of the weekday 30 to 34 (from 2026-08-11) |
| Cages | 27 cages instead of the weekday 29 to 34, and the only day that prints a five-cell cage (from 2026-08-12) |
| Sando | six printed digits instead of the weekday 10 to 20 (from 2026-08-13) |
| Knight | thirteen printed digits instead of the weekday 16 to 28 (from 2026-08-28) |
| Diag | fourteen printed digits instead of the weekday 16 to 26 (from 2026-09-08) |
| Frame | two printed digits instead of the weekday 4 to 14, under all thirty-six sums (from 2026-09-08) |
| Rim | thirteen of the thirty-six gutters printed instead of the weekday 16 to 30 (from 2026-09-08) |
| Arrow | eight printed digits under twelve arrows, against twenty-eight under nine on a Monday (from launch, 2026-10-13) |
| Giant | ninety of 256 clues and the only day that needs more than singles, against 96 to 128 on weekdays (from 2026-10-18) |
| Sumo | no digits at all, only the 108 signs, and it needs more than singles (from 2026-10-18) |
| Window | thirteen clues against 22 on Mondays, and it needs more than singles (from 2026-10-18) |
| Five | eight green lines and eleven printed digits, against six lines and twenty on Mondays (from 2026-10-18) |
| Racecar | ten grey lines and fourteen printed digits, against eight lines and twenty-four on Mondays (from 2026-10-18) |
| Circa | a trickier moment to place |
| Extra | a trickier story to name |
| Carve | 7×7 board in nine blocks |
| Stet | seven sentences, up to two errors each |
| Ping | a trickier, more out-of-the-way city |
| Jester | an 11x11 one-jester board against the weekday 8x8 / 9x9 / 10x10 ramp (from 2026-10-04; 2026-08-21 to 10-03 ran two-jester Thu-Sun, which moved to Judges) |
| Sworn | six suspects sworn instead of five |
| Garble | every answer is six letters instead of five (from 2026-07-26) |
| Scram | every answer eight to twelve letters, often two words, from themes deep enough in long answers (from launch, 2026-10-18) |
| Arcos | five- and six-letter hidden words and answers of five to seven letters, against four letters on weekdays (from launch, 2026-10-18) |
| Topple | a bigger board with a perfect line of 30 to 38 rolls, against 15 to 28 on weekdays (from launch, 2026-10-25) |
| Roll | six numbered squares and cracked squares on a bigger floor, a perfect line of 36 to 44 rolls against 9 to 32 on weekdays (from launch, 2026-10-25) |
| Scour | an 18x18 grid with twenty-six words in all eight directions, against the weekday 15x15 (from 2026-10-18) |
| Dating | six events to order instead of five (from 2026-07-26) |
| Cipher | four addends stacked instead of two (from 2026-08-09) |
| Outwit | six prompts instead of five, the extra a second Rare Bird (from 2026-07-26) |
| Tuck | a 15-letter rack instead of 14 (from 2026-07-26) |
| Alibi | five suspects instead of four, 15 facts to confirm (from 2026-07-26) |
| Warmer | a rarer secret word, deeper in the frequency-ordered vocab (from 2026-07-26) |
| Links | four cross-category collisions instead of two (from 2026-07-26) |
| Turn | twelve empty squares instead of ten (from 2026-08-05) |
| Yose | a 9x9 board with eleven open points against the weekday 7x7 and 8x8 (from launch, 2026-09-20) |
| Crib | seven hands instead of five, three of them decided by the crib (from launch, 2026-09-20) |
| Hold | fifteen hands instead of ten, at least five of them traps where the rule of thumb is wrong (from launch, 2026-10-18) |
| Cell | forty cards (ace to ten) in seven columns on two free cells, against the weekday thirty-two in six (from launch, 2026-10-18) |
| Mahj | the classic Pyramid layout, and the hardest deal of the week by measured ease (from launch, 2026-10-25) |
| Swindle | the deepest draw of the week, five White moves or more (from launch, 2026-10-18) |
| Gift | a win in five where the last piece on the board decides it, against the weekday wins in two to four (from launch, 2026-10-16) |
| Duet | a 10x10 board against the weekday 6x6 and 8x8 (from launch, 2026-10-03) |
| Lamps | a 10x10 board against the weekday 7x7 and 8x8 (from launch, 2026-10-04) |
| Ergo | twelve statements to sort instead of nine, under seven rules (from launch, 2026-10-11) |
| Snake | every apple grew the snake by two instead of one, par 15 against the weekday 20 (2026-10-11 to 2026-10-25 only; Arcade plays the same every day from 2026-10-26) |
| Clade | a rarer animal, tier 4 of the list (from launch, 2026-10-04) |
| Dossier | six guesses instead of eight (from launch, 2026-10-04) |
| Judges | a 12x12 two-judge board against the weekday 10x10 (from launch, 2026-10-04) |
| Pricer | a field of 32 instead of 16, so 31 picks and five rounds (from 2026-08-16) |
| Docket | seven entities over seven slots plus the second dimension, so fourteen open cells against a weekday's twelve, and one extra condition (from 2026-08-10) |
| Defend | a hold for four instead of a hold for three, so a fourth white move to survive before the attack is spent (from 2026-08-12) |
| Barter | eight seven-letter words on a 7x7 lattice instead of six five-letter words on 5x5, and a deeper par (from launch, 2026-08-16) |
| Snug | a 7x7 board with four holes and eight pieces against the weekday 6x6 with six or seven, still one way to fit (from launch, 2026-09-13) |
| Jig | the 80-piece cut, the biggest of the week against Saturday's 77 (2026-10-15 to 2026-10-25; from 2026-10-30 every day is 80 pieces and there is no Sunday Edition) |
| Sixes | a grid in the top fraction of a percent of the difficulty distribution: ten to fourteen squares reachable only by a hidden single, against none on a Monday (from launch, 2026-08-14) |
| Etch | a 20x20 picture instead of Saturday's 15x15 and the weekday 10x10 (from 2026-08-23) |
| Hedge | a 10x10 loop lattice instead of the weekday 7x7 |
| Flank | a giant country with 8 to 14 borders instead of the weekday ramp's 1 to 7, and a fourth strike to spend (from launch, 2026-08-28) |
| Passport | to 2026-10-14 a country with eight or more land neighbors for the borders round; from 2026-10-15 the run carries Span's, Flank's and Ping's own Sunday Editions |
| Chomp | the full cast of eleven mascots and 0-2 spare squares (and from 2026-08-22 every Chomp board carries 5-7 bolted-down bleacher walls; see app/chomp/puzzles.js) |
| Niche | a 4x4 grid instead of the weekday 3x3, sixteen cells and twenty guesses, always on Countries, the deepest universe (from launch, 2026-08-23) |
| Shoe | fourteen hands of blackjack instead of ten, dealt off the entire 104-card double deck instead of a 72-card cut, so a perfect counter knows exactly what is left (from 2026-10-04; before 2026-09-30 it was single-deck, seven hands off 52 against five off 36) |
| Queen | a win in twelve, the longest walk against the weekday five to nine (from launch, 2026-08-21) |
| Race | a win in five, the longest race against the weekday three and four (from launch, 2026-08-21) |
| Towers | a 7x7 skyline instead of the weekday 5x5 (from launch, 2026-08-24) |
| Mercury | nine thermometers and eight printed digits, against six thermometers and fifteen to thirty digits on weekdays (from launch, 2026-08-24) |
| Polka | a deal from the top of the measured difficulty distribution (from launch, 2026-08-24) |

**Every daily on the roster runs a Sunday Edition.** A new daily game should decide at launch
whether it has one (see "Adding a BRAND NEW daily game" below).

### Etch runs a THREE-tier size ramp, and every size shown is read off the board (2026-08-17)

Etch is the first daily whose grid grows twice in a week: **Mon-Fri 10x10, Saturday 15x15,
Sunday a 20x20 Edition** (from 2026-08-18). The 15x15 boards that used to run on Sunday were
moved to Saturday rather than thrown away, and the 10x10 boards they displaced took the next
free weekdays at the end of the bank, which is why the bank ends 2026-10-07 rather than 09-29.

- **Boards live before 2026-08-18 are FROZEN and ran the old schedule** (weekday 10x10, Sunday
  15x15). `scripts/verify-etch.mjs` carries `SIZES_FROM = '2026-08-18'` and checks each board
  against the rule it shipped under. Never resize a played board.
- **NEVER write a grid size as a literal in reader-facing copy.** Both Sunday badges, the
  post-game note, and the gallery caption derive from `PUZZLE.w`, because `/etch?p=N` replays
  the archive and a hardcoded "15x15" lies on every board from the other era. Schedule
  descriptions (the rules footer, the SEO prose, page metadata) state all three sizes and are
  the only place a literal belongs.
- **The bank is generated, not hand edited.** `scripts/etch-art.mjs` holds the big boards as
  drawing primitives (rects, ellipses, polygons, thick segments) rasterised at 5x5 supersampling;
  `scripts/gen-etch.mjs` derives the clues, proves each board twice, and owns the re-slotting and
  the numbering. Editing a date or a `num` by hand will desync it from the schedule walk.
- **Two independent solvers, as with Cages and Quilt.** The generator proves no-guessing with
  constraint propagation AND uniqueness with a capped DFS that never looks at a single-cell
  deduction; `verify-etch.mjs` then re-proves both over the committed bank with its own solver.
  A subject that fails is DROPPED, never nudged into passing. Helicopter, Seahorse and Crab were
  all cut this way at 20x20.
- **Look at every picture before shipping it.** Line-solvability is machine-checkable;
  recognisability is not. Render each candidate as ASCII and judge it as a picture. Tractor and
  Lantern both passed the solver and were cut for reading as speckle and as a hollow box.

### Links collisions and the pinning proof (owner rule, 2026-07-20)

Links is format-locked at 4 groups × 16 words, so its Sunday cannot get bigger — it gets
**trappier**. A *collision* is a word that plausibly reads as a DIFFERENT group on the
same board (ROOK reads as chess while living in Corvids). Ordinary days need at least
two; **Sunday Editions need at least four**.

Collisions are also exactly how a board ends up with TWO defensible solutions, so the
count alone is not enough. **Uniqueness is proved by counting.** Treat each word's
plausible memberships as its home group plus every annotated collision, then count the
assignments of the 16 words to the 4 groups where every group gets exactly four. Exactly
one is required.

This replaced a "pinning" heuristic on 2026-07-20 (a tempted group had to contain no
colliding word). Pinning is *sufficient* for uniqueness but not *necessary*, and it
wrongly rejects the best boards — the ones built on MUTUAL temptation. On 2026-07-21 FORD
reads as a car brand and DODGE reads as avoid, but if FORD leaves, US presidents has only
three members, so FORD must stay and DODGE follows it home. One solution; pinning called
it ambiguous. Six of the ten annotated boards fail pinning and are provably fine.

Puzzles carry authoring metadata:

```javascript
collisions: [ { word: 'ROOK', reads: 'Chess pieces' }, ... ]   // `reads` = group NAME
```

`scripts/verify-daily-banks.mjs links` verifies, for every collision, that the word is on
the board, that `reads` names a real group, and that the word does not already live in
it; then it counts groupings and fails anything other than exactly one. It also enforces
the count floor (4 on Sunday, 2 otherwise) and fails a Sunday that declares no collisions.
Verified against deliberately broken boards, including a clean swap-pair (annotating
SCARLET as a gemstone and PEARL as a shade of red makes 7/27 genuinely two-solution, and
the check catches it).

**Annotation is the authoring step that finds bugs.** Doing it for 2026-07-21..07-30
surfaced that `links-7-23-26` looked like it had only ONE collision (AMAZON reads as a
river) until NILE was recognised as reading straight to Ancient Egypt, which is what puts
it over the two-collision floor. Write the annotations while authoring, not after.

`collisions` is stripped in `app/links/page.js` before puzzles reach the client. The
groups themselves must ship (the client checks guesses), but the trap map need not.

**Every board from 2026-07-21 on is annotated and proved unique.** Boards up to and
including 2026-07-20 are live or historical and are deliberately left alone — they are
skipped with an explicit "semantic audit manual" note. Annotate each new board as you
bank it.

**Regenerating a Warmer order (the only pipeline-backed edition).** Warmer stores
`order`: every VOCAB index sorted by cosine similarity to that day's secret word,
most-similar first, with `order[0]` the answer itself. Changing the answer means
recomputing all 32,300 ranks, so it needs the real vectors:

1. `npm pack wink-embeddings-sg-100d` in the sandbox (registry.npmjs.org is
   allowlisted; Stanford/HF/github-release hosts are NOT). Despite the name the JSON
   is GloVe 6B 100d, 341k words, `{ vectors: word -> [...100 dims, l2norm, index] }`.
2. Cosine against every VOCAB word, sort descending, tie-break by vocab index so the
   build is deterministic. Assert `VOCAB[order[0]] === answer`, `order.length ===
   VOCAB.length`, and that it is a true permutation before writing.
3. **Eyeball the top 15 neighbours before committing to an answer.** This is the
   quality gate the 2026-07-19 rebuild exists for: a clean neighbourhood (lighthouse →
   tower, breakwater, cove, observatory, pier, beacon) gives players a real gradient,
   while proper-noun-heavy ones (telescope → hubble, keck; volcano → etna, vesuvius)
   are worse. NEVER synthesize or bridge a vector for a missing word.
4. Sunday answers must clear `RARE_FLOOR` (vocab rank 5000) in
   `scripts/verify-warmer.mjs`. Weekday answers have run rank 453-3534; the first
   Sunday answer, `lighthouse`, is rank 10489.

**GRANDFATHERING — never retrofit a live puzzle.** Garble, Dating and Cipher gained
their editions on 2026-07-26, so their EARLIER Sunday drops (Garble 7/12 and 7/19,
Dating 7/19, Cipher 7/19) stayed exactly as shipped: they are already played, scored,
and frozen on the daily leaderboard, and rewriting one would invalidate real results.
Where a validator enforces the edition, it carries a `SUNDAY_FROM` launch-date constant
and skips anything earlier (see `scripts/verify-cipher.mjs`). Apply a new edition to
FUTURE Sundays only.

Every game that carries a `sunday` field now backs it with a real edition. Do not treat
the presence of a `sunday` field as evidence a game has one — check for `sunday: true`.

### Never infer the edition from a side effect of it (owner rule, 2026-07-20)

`PUZZLE.sunday` is the gate. Do NOT OR in whatever the Sunday happens to change. Span
gated its badge on `PUZZLE.sunday || VIA || AVOID`, which broke both ways: a weekday that
ever carried a route rule would have announced a Sunday Edition, and a Sunday authored
WITHOUT a via/avoid rule fell through to the AVOID branch and rendered "**undefined** is
closed today". Fixed 2026-07-20 to gate on the flag alone, with the rule text rendered
only when a rule actually exists. Any game whose Sunday twist is optional needs the same
two-part split: `isSundayEd` from the flag, the detail line from the detail's presence.

### `lib/sunday-editions.js` — the game-level registry

The four surfaces that render from a static game registry and never load puzzle data
(`DailyStrip`, `DailyGamesGrid`, `DailyGamesPromo`, `DailyEndCard`) cannot read
`PUZZLE.sunday`. They use this module instead:
`hasSundayEdition(key)` plus `isSundayET()` (Eastern, because puzzles roll at ET midnight)
gate a `Sun` chip on the tile. Compute the Sunday check in a `useEffect`, never during
render, or the server and client renders disagree and React throws a hydration error.
`DailyTopNav` is deliberately excluded: it is site nav plus the player chip, not a game
surface.

**Verifying a Sunday without waiting for Sunday.** The badges only appear one day in
seven, so check them off-cycle rather than shipping blind: (a) assert every badge's
`COLORS.*` and font constants are actually defined IN THAT FILE (an undefined token
renders an invisible chip, and each game has its own palette); (b) run each game's 7/26
puzzle through its own `page.js` strip and assert `sunday === true` survives; (c) call
`isSundayET()` on fixed UTC instants either side of ET midnight. All three were run
across all 20 games on 2026-07-20.

### Adding a Sunday Edition to a game that lacks one

1. Author the harder variant in that game's `puzzles.js` for FUTURE Sunday dates and set
   `sunday: true`. Never rewrite a Sunday that already went live (see grandfathering
   above). Run that game's validator (`scripts/verify-<game>.mjs`, or
   `scripts/verify-daily-banks.mjs <game>`) — a Sunday variant usually changes a size or
   count the validator asserts, so update the assertion to branch on `p.sunday` rather
   than deleting it (Dating's event count and Garble's answer length both do this).
2. Confirm the flag survives any field strip in `app/<game>/page.js`.
3. Add the badge to the title row of the game client, gated on `PUZZLE.sunday`, wording
   per the label rule above.
4. Add the game key to `SUNDAY_EDITION_GAMES` in `lib/sunday-editions.js` and to the
   table in this section.
5. Update the game's own how-to-play copy and its `page.js` metadata description, which
   both describe the weekly cadence to players and to search engines.

## Game copy DEFINES its jargon before it leans on it (owner rule, 2026-08-13)

A daily game's rules panel is read once, by someone who does not yet know the game. So
the FIRST sentence has to define any word the game invented, and the definition cannot
live three steps down the list where only a reader who is already sold will reach it.

Sando shipped breaking this and the owner caught it by simply reading the panel: the lead
read "every line's sandwich adds up to the number printed beside it", where "line" and
"sandwich" were both undefined, and the actual explanation sat at step 3. Two questions
came straight back, "what does every line's sandwich mean" and "how could a sandwich add
to 0", and both answers were already written, just in the wrong place.

The checks, for every new game and every copy edit:

1. **Read the lead sentence as someone who has never played.** Every noun in it must be
   either ordinary English or defined in that same sentence. "Line", "cage", "crust",
   "filling", "region", "sandwich" are all invented for the reader's purposes and none of
   them is free.
2. **Name the degenerate case for what it is, not for its number.** A clue of 0 in Sando
   is an EMPTY sandwich; a two-cell cage in Cages is a PAIR. A reader who meets a bare 0
   with no name for it assumes they have misunderstood the rule, because "a sandwich that
   adds to nothing" is a contradiction until you tell them the sandwich can be empty.
3. **The extremes are the teaching examples.** 0 and 35 in Sando, 3-in-two and 24-in-three
   in Cages: the cases with one possible arrangement are both the clearest explanation of
   the mechanic AND the best opening move, so put them in the rules rather than saving
   them for the knack line.
4. **The same wording goes everywhere the game speaks**: the rules panel, the start-gate
   blurb, the knack line, the SEO prose at the foot of the page, the `page.js` metadata
   and OpenGraph descriptions, the share card, and any per-item tooltips. A definition
   that is right in one of those and stale in the other five is worse than none.

## Cipher has NO Check button: the board ends the day itself (owner rule, 2026-08-10)

The scored Check was REMOVED. Do not reintroduce it. The reasoning is that the board already
auto-calculates: the carry row derives itself as far as the assignment allows, and every column
marks itself ✓ or ✗ the moment it is decided. Pressing a button to confirm what the board had
just shown you was a formality that could only cost a point, so the day now ends the instant the
assignment is right.

**The win test is three conditions, not one.** Every column landing is necessary but NOT
sufficient, and this is the part that is easy to get wrong. The columns test the ARITHMETIC only,
while the digit pad merely DIMS a digit another letter has taken and GREYS a leading zero without
blocking either, so a player can hold an assignment whose columns are all green but which breaks a
rule of the puzzle. Measured on the banked bank: `EAT + THAT = APPLE` has TEN assignments that turn
every column green and only ONE is legal, the other nine repeating a digit; `BEAR + DEER = ZEBRA`
has ten, of which seven repeat a digit and two put a zero under a leading letter. So the client
requires all columns landing AND every assigned digit distinct AND no leading letter at zero
(`solvedNow = playing && colsSolved && !blocked` in `CipherClient.jsx`). Ship any change to that
test only after re-running the brute force above; auto-winning on a duplicate-digit board would
hand out a solve for a wrong answer.

**When an all-green board is blocked, SAY SO.** Otherwise the player sits on a full row of ticks
with nothing happening and no way to know why. `blocked` names the offending pair ("A and E are
both 3. Every letter needs its own digit.") or the leading zero, and it renders in the desktop
status line and the mobile dock.

**Scoring.** A solve is a flat 10 of 10 and a reveal is still 0. Nothing can be failed, so
`guessesUsed` posts 0, the registry's `miss` for cipher is `null` (was `'Checks'`), and the daily
board falls through to time: it is a straight race on the clock. Historical rows keep their real
failed-check counts and their sub-10 scores, so no already-played day is reordered. Reveal used to
unlock after three failed checks; with no checks to fail it now unlocks after three minutes on the
clock (`revealOk`).

**No numerals inside a letter box.** The old key rack printed the digits still open to each
letter as a 0-9 strip under every letter, and the mobile strip printed the COUNT of them as a
pill. Players read both as "this letter is a 7". All of it is gone: an unassigned letter shows a
dot, and every piece of that bookkeeping now lives on the DIGIT PAD keys, where a number in a box
means that box's digit. A pad key dims and names its owner when another letter takes it, greys
out at 0 under a leading letter, and strikes through when Notes crosses it off. Keep it that way,
one number per box.

**Carries scale with the addend count.** `maxCarry(op, n)` returns `n - 1` for addition (two
addends carry 0-1, three 0-2, the four-addend Sunday 0-3) and 2 for the legacy subtraction
boards. Both the ✗ test in `deriveColumns` and the pencil cycle in `cycleCarry` read it. Never
hardcode a carry ceiling: a literal 2 shows a false ✗ on a correct column the first time a Sunday
genuinely carries 3, and a free mark that lies is worse than no mark.

### Daily puzzle authoring standard (applies to EVERY game)

Twelve games shipped banks with no checker at all, and every defect the 2026-08-02 audit
turned up lived in one of them: Crunch storing a solution count above its own documented
cap of 400 on 26 of 62 boards, two Glyph boards that admit two valid letter mappings, a
Glyph board that is 15x14 on a 15x15 day, Rung opening with the same two words on 39% of
its days, Listed running History 2:1 against its own promised two-domain alternation, Four spelling
"defence" on 13 boards. None of it was exotic. All of it was mechanically checkable and
nobody had written the check. These twelve rules are how that stops.

1. **A rule that is not written down is not a rule.** Every game states its authoring
   rules in the header comment of `app/<game>/puzzles.js`: what each field means, what
   range it may take, what the Sunday Edition scales, and what makes a board good rather
   than merely legal. An instruction that lives only in a chat thread does not count.

2. **Every game has a verifier, and no bank change ships until it passes.** The gate is
   `node scripts/verify-all.mjs`, which discovers checkers automatically and reports any
   registered game whose bank has no checker as UNVERIFIED, failing the run. A new game
   therefore cannot quietly ship without one. The full sweep takes a couple of minutes;
   pass game names to run a subset while iterating.

3. **The verifier recomputes, it never trusts a stored field.** Re-derive the answer, the
   par, the solution count, the ladder, the winning line from the board state using your
   own search or the game's own engine, then assert it matches what is stored. A checker
   that reads `p.par` and prints it has verified nothing. Recomputation is what caught
   Crunch's over-cap counts and its one wrong `need`.

4. **Uniqueness is proved wherever the game claims it.** If the copy promises one
   solution, count solutions with a cap of 2 and fail at 2. Two Glyph boards have two
   valid mappings and shipped anyway.

4b. **The state walk applies the move the PLAYER makes, never the move the bank
   describes.** A verifier that advances the game by its own answer key is proving a
   different game, and every state reachable only through a real move is outside the
   proof entirely. Strata modelled a found word as losing the cells its `owners` map
   said it owned; the game deletes the cells the player TRACED, and those differ the
   moment a word's one readable trace runs through a letter still owned by another
   word. Board #5 (2026-08-10) shipped stranding half its play-throughs, and the
   verifier reported it clean the whole time, because the stranded state was never in
   the graph. Note the shape of the mistake, since it generalizes: the file asserted
   "one placement per word per state" and then treated that as proof the placement was
   the OWNED one. Uniqueness is not identity. Where a claim rests on an assumption
   like that, assert the assumption too rather than reasoning to it in a comment.

5. **The Sunday Edition proves its own scaling.** Assert that the knob which is supposed
   to grow actually grew on every `sunday: true` board, and that the flag lands on a real
   Sunday.

6. **Every documented numeric field has a range, and the checker enforces it.**

7. **Pool variety has a ceiling, checked across the WHOLE bank rather than per board.**
   Count how often each answer, start word, subject, motif, theme or trap repeats, and
   fail above a ceiling documented in the checker's header. Per-board legality checks pass
   happily on a bank that says the same thing every day, which is exactly how Rung, Listed,
   Mate, Four and Crux all degraded.

7b. **POSITION is a variety axis, and it is the one everybody forgets.** A game whose board
   is a fixed set of numbered slots leaks through WHERE a thing sits, not only through what
   the thing is. Stet ran 50 straight days (2026-08-11 to 2026-09-29) where sentences 2 and
   4 were the clean ones and the grammar slip was always sentence 1, so a player could stamp
   2 and 4 "stet" and tap 1, 3 and 5 without reading a word; a reader wrote in on 2026-09-09
   asking whether "a randomizer could get turned on" (there is none, items render in bank
   order, so variety is an authoring property). Every per-item rule in that bank passed on
   all 50 days. Note the near miss too: a later generator had already spotted that the COUNT
   of clean sentences was fixed and varied it, and STILL put every Sunday's clean copy last
   and its grammar slip first, because varying how many is a different property from varying
   where. So for any slotted game, check the per-slot distribution across the bank exactly
   the way you check the answer pool: no slot past a ceiling on any role, no slot shut out
   of a role entirely, no slot holding the same role four days running, and no day repeating
   the previous day's shape. Enforced for Stet in both `scripts/verify-stet.mjs` (bank-wide,
   from `VARIETY_FROM`) and `scripts/gen-stet.mjs` (per segment, at authoring time).

8. **US spellings.** A generator drawing on an off-the-shelf word list imports British
   forms; scan reader-facing strings and board words for them.

9. **Reader-facing rules copy is checked against the data it describes.** Rung tells
   players its ladder uses "1,846 common five-letter words"; the vocabulary is 1,292.

10. **The past is frozen.** Never rewrite a board that has gone live. Scope both retrofits
    and any newly added check to future boards with an explicit dated constant, and name
    it in the checker's header (crux uses `CRUX_FLOOR_FROM = '2026-08-03'`).

11. **A floor is not a target, and a rule retrofit sweeps to the last day of the bank.**
    The full version is the next section.

12. **A new game ships BOTH pieces of tile art, because the missing one fails
    silently.** Every daily needs `public/games/btn-<key>.png` (76x76 RGBA, the
    full-colour drawing) AND `public/games/blue/btn-<key>.png`, the same drawing
    remapped onto the brand blue ramp. **76x76 is load-bearing, not a
    suggestion:** Bracket shipped 88x76 and its icon rendered 28px wide in the
    home Daily Mastery rail, which pushed its NAME out of line with every other
    row in the column (fixed 2026-08-08 by re-canvassing both files and giving
    `.hr-mic` a square `object-fit:contain` box). The blue copy is what the HOMEPAGE uses:
    `blueTile()` in `app/DailyStrip.jsx` rewrites `/games/btn-` to
    `/games/blue/btn-` for the slate rows and both cap tiles, so the home surface
    reads as one palette instead of forty-five. **`tileFallback` then quietly
    swaps a missing blue file back to the full-colour original, so there is no
    broken image and no error: the only symptom is one garish tile in a blue
    table, which is exactly how Hands shipped on 2026-08-04.** Do not rely on
    noticing it. Ship both files, and check the homepage after deploying, not
    just the game page.

    Making the blue copy: keep the drawing identical and remap the palette, do
    not re-draw. The family in use runs the whole blue ramp rather than one
    value, so each game stays tellable apart: a deep navy ground (`#16306e`,
    `#182f71`) or a mid blue (`#214bb2`, `#245edf`) or a pale ground
    (`#c2ddfe`, `#cbe2fe`), with the drawing's light parts going to
    `#dbe9ff`/`#e8f2ff` and its dark parts to `#0f1f4d`/`#10214f`. Where the
    original uses two accent colours to carry meaning, map them to two DIFFERENT
    blue steps rather than collapsing both (Hands keeps its black suits at
    `#0f1f4d` and its red suits at `#4a8cf0` so the pips still read as two
    colours). Pick a ground that is not already worn by a game sitting next to it
    in the same category on the slate.

    (The old `/daily` archive drew `/games/tile/<key>.png` art; it was retired
    2026-10-09 and the new `/archive` draws the stroke glyph, so that art is no
    longer read anywhere.)

### Extending a puzzle bank in bulk (the "bank to N days" job)

Every mass bank extension so far has quietly degraded the game it extended, because a
generator optimizes for whatever is machine-checkable and ignores everything that is not.
Crux is the worked example: commit `0ea717a` banked 50 boards at once, met the letter of
the two-collision rule on every one of them, and shipped six weeks of boards whose traps
were the same two words over and over (BRONZE reads Colors, 18 times). The structural
verifier passed the whole time. Rules for every bulk extension:

1. **Read the game's own authoring rules first**, in the header comment of its
   `puzzles.js` and in its client, and list which of them a script can actually check.
   Everything on that list must be enforced in `scripts/verify-daily-banks.mjs` or
   `scripts/verify-<game>.mjs` BEFORE the bank ships, not after.
2. **A floor is not a target.** If a rule says "at least N", a bank where every single
   board carries exactly N is a failure, not a pass. Vary it, and vary it upward on
   Sundays, which run bigger and harder by design.
3. **Check pool variety, not just per-board legality.** Count how often each answer,
   trap, start word, theme or category repeats across the whole bank and put a ceiling on
   it. Rung opens with `suite` or `shock` on 39% of its banked days, and Listed ran
   History over Geography 2:1 despite promising an alternating rotation; both passed
   every per-puzzle check they had. Listed is now three domains (History, Geography,
   Trivia, owner ruling 2026-08-04) with the rotation stated as numbers and checked.
   THE CHECK MUST FOLLOW THE RULING: verify-listed.mjs kept enforcing the superseded
   two-domain rule and hard-failed all 15 legitimate Trivia boards from 2026-07-27 to
   2026-08-26, which left `verify-all` red for over a week and so stopped being a
   signal at all. When an owner ruling changes a game's rules, update its checker in
   the SAME pass.
4. **US spellings.** A generator drawing on an off-the-shelf word list imports British
   forms. Crux shipped a `Colours` category on 25 boards and a `PARLOUR`.
5. **A rule retrofit sweeps the WHOLE bank, to its last day.** The Crux collision rule
   landed 2026-07-15 and the retrofit stopped at Jul 31, which is exactly how a flat
   Sunday reached players on Aug 2. When an authoring rule changes, fix every future
   board in that same pass and state in the commit message how far the sweep got.
6. **Grandfather the past, never rewrite it.** Boards already live are frozen history:
   scope both the retrofit and the new verifier check to `live >= today` and say so in
   the checker (Crux uses `CRUX_FLOOR_FROM`, outrank grandfathers frozen ties).
7. **A game with no verifier gets one before its next bank extension.** As of 2026-08-02
   twelve games have banks and no checker at all (etch, hedge, listed, mate, four,
   parker, check, rung, taire, fib, crunch, glyph), which is why Crunch storing a
   `solutions` count above its own documented cap of 400 on 26 of 62 boards, and the Rung
   start-word collapse, both went unnoticed.
8. **Trivia gauntlets recycle before they author (owner, 2026-10-09).** For Streak, Atlas,
   Sport, Biz, Quotes and Script, fill hard-tier slots from the never-answered pool first
   and author only what the pool cannot cover. Deep recycles into Streak's tier 5 only.
   See [Recycling unanswered trivia questions](#recycling-unanswered-trivia-questions-owner-2026-10-09).

### Adding a BRAND NEW daily game

Decide up front whether it runs a Sunday Edition. If yes, do all five steps above in the
launch push. If no, do not add a `sunday` field at all — an always-false flag reads as an
unfinished feature to the next session, which is exactly how the five vestigial ones
above came to be.

### Placing a new daily: one category, one to four skills (owner rule, 2026-10-18)

Every daily is placed on TWO axes, and both are decided in the launch push, never later:

1. **One registry category** (`cat` in `lib/daily-games.js`): Word, Numbers, Logic, Sudoku,
   Trivia, Geography, End Game, Cards, Arcade or Crowd Psychology. Pick by what the game LOOKS
   like and how it plays, because the category drives the shelves, page colour, archive shelf and
   every scoring rule keyed off `cat` (End Game and Arcade especially). Do not invent a category
   for one game.
2. **One to four skills** (`SKILL_TAGS` in `lib/daily-skills.js`), primary first: what the game
   makes you DO. Tag liberally but honestly: a skill the game genuinely exercises, never a skill
   added to fill a thin pane.

Then place it on every hand-kept list for that category, in the same push:

- the category's key list in `app/DailyGamesGrid.jsx`, and the archive `GAMES` row;
- the three daily slate maps, plus the Sunday slate when it runs a Sunday Edition;
- its daily group in `lib/daily-groups.js` (a category with groups must group every game, 3 to 5 keys
  a group) and at least one set in `lib/finish-sets.js` (2 to 4 keys a set);
- a glyph in `lib/game-glyphs.js`;
- every landing page of its category in `lib/puzzle-categories.js` (keys, `generic`, and the copy:
  see the next section), plus any sub-page whose roster it belongs on (a crossword-like game on
  `/crosswords` too).

**`node scripts/verify-placement.mjs` is the gate** (found by verify-all): it fails a live daily
missing from any of these. `verify-skills`, `verify-daily-groups`, `verify-finish-sets` and
`verify-category-copy` check the rest. A wire script anchors on an existing game in the same
category so every list gets the new key beside its nearest sibling (`scripts/wire-arcos.mjs` is
the most recent example).

### A new game changes the category and set COPY too (owner rule, 2026-10-14)

The category pages (`/card-games`, `/logic-puzzles`, ...) and the set pages under them take
their ROSTER from the registry at render time, so a new game appears there the day its row
lands. Their PROSE does not. `lib/puzzle-categories.js` and `lib/puzzle-sets.js` state the
count and list the games by hand ("Seven free daily card games: a solitaire and a FreeCell
deal...", "All seven, every day"), and nothing derives them. The 2026-10-14 audit found 25
stale counts across nine pages at once: card games said five and had seven, logic 22 vs 23,
numbers 13 vs 16, chess 3 vs 4, endgames 8 vs 9, the crowd FAQ said four with three games,
and the rule-finding, classic-sudoku and board-endgame sets were each one short. The marked
sudokus set still described Mercury and Polka after both had moved to the order sudokus.

**Whenever a game launches, moves between sets, or retires, in the SAME push:**

1. Update every count in that category's record AND its set's record: `description`, `lede`,
   the "All N, every day" FAQ answer, and any count in `title` / `h1` / `start`. Numbers are
   spelled out as words in this copy.
2. Add the game to the LIST in the prose (description, lede, and the `how` paragraph that
   walks the games), and to the `title` / `h1` if they name the members (chess, card games,
   board endgames do). A "deepest of the five" or "hardest of the three" line goes stale the
   same way; rewrite it so it does not carry a count.
3. A game that MOVED sets comes out of the old set's prose and FAQ too.
4. Run `node scripts/verify-category-copy.mjs`. It fails on any description or lede that
   OPENS with a count that disagrees with the live roster, and on any "All N" FAQ answer that
   does. It cannot see whether the list of games in the prose is complete; step 2 is by hand.
   `verify-all` picks it up automatically.

---

## The 2026-09-24 restock: 27 banks to Nov 30, and the sports rules cap (owner, 2026-09-23)

Every bank that ended between Oct 11 and Oct 31 now runs to **2026-11-30**, lining it up with the
big block of banks that already ended there: links, blocks, bracket, docket, suffice, chomp, focus,
venn, encore, and the Oct 31 wall (alibi, carve, cipher, crunch, crux, flank, garble, hearsay, hedge,
ping, rung, shards, span, stands, suds, sworn, tally). Pricer (off the roster) and Extra (retires
2026-09-29) were skipped on purpose. Built by the process in the daily-bank-restock skill, the same
one as the 2026-09-04 restock (dd11712 / 71b27f9).

**Most of those banks had NO committed generator** (their 2026-08-28 extensions were built by
scripts nobody checked in). They have one now, each deterministic, seeded off the board number,
append-only, and refusing to rewrite a frozen board: `gen-alibi`, `gen-sworn`, `gen-hearsay`,
`gen-stands`, `gen-suds`, `gen-tally`, `gen-carve`, `gen-hedge`, `gen-garble`, `gen-rung`,
`gen-cipher`, `gen-crunch`, `gen-span`, `gen-ping`, `gen-blocks`, `gen-bracket` (+ `gen-bracket-pools`),
`gen-chomp-extend`, `gen-venn-bank`, `gen-encore-extend`. `gen-docket` and `gen-suffice` gained an
`--append` mode for the same reason (a whole-bank rerun with a wider pool would rewrite the past).
Links and Focus stay hand-authored.

**Next-restock warnings the agents measured:** Crux's collision pool is thin again (4 of 8 seeds
built November); Encore's 3- and 4-letter answers are nearing the 3-use cap (widen by re-screening
shapes, never by editing the shared clue banks); Suffice's MOD templates are at 40 of 41 uses;
Docket used its new themes to 64 of 64 at max reuse 2.

**Flank Sunday giants may now repeat (owner ruling, 2026-09-23).** Only nine countries have 8+
borders and are not `noSubject`, and all nine were used by 2026-10-25, so the never-repeat rule made
Nov 1 unbankable. From 2026-11-01 a Sunday giant may return once 63+ days have passed since its last
Sunday; weekday countries still never repeat. Enforced in `gen-flank.mjs` and `verify-flank.mjs`.

**Bracket's rules for new pools:** a board may not contain any pair whose order published sources
dispute (river lengths by system definition, city vs consolidated-county populations, total vs land
area, summits within a few metres), and the generator refuses pairs inside a per-topic minimum gap.
Retired players' totals only. Figures in the new pools are from memory and were fact-checked once;
rivers remain the least certain pool.

**New checks, each proved by injection:** Links runs the US-spelling screen on group names and words
from 2026-10-12; Shards fails a board that reprints an earlier board's letter grid from 2026-11-01
(five October boards already do, frozen); plus dated US-spelling screens in the alibi, sworn,
hearsay, docket, suffice, venn, encore and bracket verifiers, and new variety checks in
verify-cipher (word ceiling, shared words, stems, weekly climb) and verify-venn.

### Sports trivia carries at most ONE basic-rules question a day (owner, 2026-09-23)

A "rules-type" question asks how a sport works rather than about its history, people, teams,
records or events: points for a score, how many players/periods/innings/sets, what a play, term,
violation, position or official is called, what a stat abbreviation stands for, equipment or field
dimensions. A question about a rule's HISTORY ("which league adopted the DH in 1973") is not one.
The Sport daily had 477 of them on its 68 unplayed days (2 to 11 a day); Streak's Sports lane and
Deep's sports-topic days had the same problem at smaller scale.

- **Cap 1 a day, enforced:** `verify-sport.mjs` from `RULES_CAP_FROM = '2026-09-24'`,
  `verify-streak.mjs` (via `scripts/streak-rules.mjs`, `SPORTS_RULES_CAP`) from 2026-09-30 on the
  Sports lane, and `verify-deep.mjs` from 2026-09-24 on topics matching `SPORT_TOPIC`. The shared
  classifier is `scripts/sports-rules-classifier.mjs`; Sport carries its own pattern list in its
  verifier header. **The classifiers are deliberately cautious**: they caught about 80% of the
  hand-labelled rules questions and flagged nothing that was not one, so they guard the count but
  do not replace reading.
- **409 Sport, 50 Streak and 27 Deep questions were rewritten in place** (same id, lane, tier and
  `correct` index) as history, player, team and record questions, then fact-checked by a separate
  pass. Sport days 42+ and Streak days 62+ are generated from lane/source files, which were updated
  to match (`gen-sport.mjs --check` and `gen-streak.mjs --check` report byte-identical).
- **Played days are frozen**, and so are Streak's six hand-authored days 9/24 to 9/29, which its own
  header declares frozen; four of those still carry 2 or 3 rules questions.
- **When authoring new sports questions, write the history question in the first place.** A tier-1
  gimme can be a famous team, city, or legend; it does not have to be "how many points is a
  touchdown".

## SEO for every new daily and every new run: the launch checklist (2026-10-13)

An audit of every game and run page on 2026-10-13 found the furniture a launch forgets: 90 Game
schemas with no image (two pointing at files that did not exist), Dario with no Game schema at
all, 415 em dashes in titles, share text and alt text, five run pages with no footer, no
questions and no links into the games they are made of, and the sixteen newest descriptions
running past the ~160 characters a search result shows. All fixed in one pass, and
**`node scripts/verify-page-seo.mjs` is now the gate** (auto-discovered by verify-all). It
fails a launch that skips any of these, so a new page cannot quietly ship without them.

**A new DAILY ships, in its `app/<route>/page.js`:**

1. A static `title` of **70 characters or fewer** ending `| Mind Loft`, leading with the
   searcher's words ("Free Daily Arrow Sudoku: Arrow | Mind Loft"), not the brand name alone.
2. A `description` of **160 characters or fewer**: what kind of puzzle it is in plain words,
   the one rule that defines it, and "free" and "daily". `scripts/page-seo-baseline.json`
   grandfathers the older long ones and is a burn-down list: it may shrink, never grow.
3. `alternates.canonical` equal to the registry href, `openGraph` and `twitter` naming
   `public/og/<key>.png` (bake it with `scripts/bake-og.mjs <key>`).
4. A `gameJsonLd` (`'@type': 'Game'`) with `image: \`${SITE_URL}/og/<key>.png\``, plus the
   BreadcrumbList through `categoryCrumb(key)` and `<StageTail self="<key>">` after the client.
5. Crawlable prose in the client: an "About <Name>" or "How <Name> works" section.
6. **No em dash** in any title, description, alt or alternateName (the site copy rule; share
   cards and search results are site copy).

**Nothing else to register.** The sitemap's game segment is DERIVED from `lib/daily-games.js`
(every registry href, REVIEW_HOLD excluded) and from `lib/run-seo.js` RUN_PAGES, so a new
daily or run is submitted by existing. The FAQ, sibling links and FAQPage schema come from
`lib/game-seo.js`. After the deploy, ping IndexNow for the new url
(`https://api.indexnow.org/indexnow?url=https://mindloftdaily.com/<route>&key=598abff60a4ec1cbbe4ae6fc007be9a0`).

**A new RUN with its own address** (a circuit with `path`, like `/dojo`) also needs an entry in
`RUN_PAGES` in `lib/run-seo.js`: its path, an accent game, the kind of run, and ONE plain
sentence on how it is scored. That entry is what prints the run's questions, links every member
game and every other run, and puts it in the sitemap. The page then mounts
`<StageTail run="<id>" theme="dark" />` after the client (drop `theme` if the run follows the
reader's register, as Price Check does), emits `runBreadcrumbJsonLd('<id>')`, and gives its
Game schema an image (its `/card` route is fine). A run whose page is deliberately noindex
(the Trivia and Math Gauntlets, whose landing pages rank instead) goes in `RUN_LANDINGS`.
