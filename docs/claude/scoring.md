# Daily scoring and leaderboards

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Daily scoring and leaderboards: points ladder, best-N, attempts/progress/tiers, End Game play-out and hold, replay rules, miss labels, hints, IQ snapshot, result display

## Daily-game hints: FIRST PLAY ONLY (owner rule, 2026-08-01)

The one free hint on a daily game is offered ONLY on a player's very first ever play of
that game, and never again: not on a later day, not on a replay of that same first board.
**Play history is the only test.** Signed in or anonymous makes no difference (this replaced
the old `!identity` gate, which handed a hint to every unregistered player forever, and it
closed the eight games that had no gate at all).

- **Shared helper: `lib/hint-gate.js`** (`hintAllowed(game, stats)`, `spendHint(game)`).
  Eligibility = the game's local stats record holds ZERO plays (`stats.rec` empty) AND the
  persisted flag `sot_hint_spent_<game>` is unset. The stats record is the same per-puzzle
  `rec` map each daily client already keeps, and `mergeServerStats` back-fills it from server
  history, so a signed-in player who returns on a NEW DEVICE has the hint revoked once the
  merge lands. The spent flag is written the moment the hint is actually used, so reloading
  or resetting the first board cannot hand out a second one.
- **Wiring in a daily client (identical in all 24, copy it verbatim for a new game):**
  import from `@/lib/hint-gate`; declare `const [hintOk, setHintOk] = useState(false);` right
  after the `stats` state; `useEffect(() => { if (stats) setHintOk(hintAllowed('<key>', stats)); }, [stats]);`
  and `useEffect(() => { if (g.hintUsed) spendHint('<key>'); }, [g.hintUsed]);`; guard the
  handler with `if (!hintOk) return;` as its first line; and gate the button JSX on
  `hintOk && !g.hintUsed`. `<key>` is the registry key from `lib/daily-games.js` (Parker is
  `park`).
- **PAID hints are OUT of scope.** Shards (three hints costing 10/15/20 points) and Stands
  (2-point nudges) keep their hints for everyone, because the point cost already prices them
  in and gating them would change the scoring design rather than remove an assist. Only the
  free hint is first-play-only.
- **Crux carries BOTH, and it is the reference for pricing an assist (owner rule, 2026-08-12).**
  The free first-play hint is unchanged. On top of it Crux sells ONE letter reveal per puzzle to
  everyone, priced at **1 guess plus 1 point** off the final score, so a first-timer can use two
  reveals on that one board and everybody else has the paid one only. Three things make it work,
  and any future priced hint needs all three:
  (a) **The win test reads the RAW solve, never the penalized score.** Crux scores
  `solved + placements`, so a player who cracks the whole grid having bought a hint scores
  total - 1; testing `score === total` for the win would hand them a defeat screen on a solved
  board. `scoreOf()` is the score, `raw === total` is the verdict, and the local stats record's
  `won` follows the verdict rather than the score.
  (b) **The guess cost belongs to no slot,** so `guessesUsed` is derived from the remaining
  budget (`puzzle.guesses - left`) rather than by summing `slotGuesses`. That is the only way
  the leaderboard's guess tiebreak sees the spend, and the two are identical on any save written
  before the paid hint existed.
  (c) **Buying needs TWO guesses in the budget, not one.** Spending the last guess trips the
  out-of-guesses rule and ends the puzzle on the spot, which is not what a player buying a letter
  is asking for.
  The paid flag is its OWN state field (`hintPaid`, separate from the free `hintUsed`), so
  in-flight saves keep playing and only `hintUsed` burns the site-wide gate. A reveal can
  auto-solve its word, which is exactly why the price includes a point: solving by reveal nets
  zero, so there is no way to farm score out of hints.
- **Copy must match the behavior.** Rules prose reads "One free <b>hint</b>, on your first
  ever play, ..." and button titles read "(one hint, first play only)". A new game that ships
  a free hint carries the same wording. A PRICED hint states its price in four places: the
  button face, the rules footer, the toast when it fires, and the end card, because a full
  solve that reads 15/16 has to explain itself.
- **A brand-new daily game grants its own first-play hint** to everyone, since eligibility is
  per game, not per site.

Applied 2026-08-01 across all 24 free-hint games: carve, check, circa, crunch, crux, dating,
emcee, etch, extra, fib, four, hedge, jester, listed, mate, parker, ping, rung, span, suds,
sworn, taire, tally, warmer.

## How a replay counts is THREE rules, and every surface must say which (owner rule, 2026-08-12)

A daily's leaderboard treats a second run one of three ways, and until this date not one
reader-facing surface said which:

| Kind | Predicate | The board keeps |
|---|---|---|
| Ordinary daily (51 of them, Babel included) | neither | your FIRST attempt |
| End Game (mate, four, check, chain, turn, defend) | `isEndGame` | the solving run, ranked on how many runs it took |
| Arcade (sweep, blocks) | `isArcade` | your BEST run of the day |

Worse than silence, the two replay controls ASSERTED the wrong one: both said "Practice run"
on every game, which stopped being true for End Game the day its board moved to attempts
(2026-08-12, commit c4b08b8).

**The copy lives in ONE place, `dailyAttemptRule(key)` in `lib/daily-games.js`**, beside the two
predicates that decide it, for the same reason `endGamePlan` does: a sentence maintained in four
components is four mirrors that drift, and a leaderboard caption that disagrees with
`buildLeaderboard` is worse than no caption. It returns `{ board, replay, chip }`. An unknown or
null key falls to the first-attempt rule.

Rendered in SIX places, all of which take the game key already:

- `app/DailyGamesGrid.jsx` and `app/DailyEndCard.jsx` (`.rs` chip) - the two "play again" controls,
  which is the moment a player decides, so this is the one that matters most.
- `app/quiz/[id]/DailyBoardPanel.jsx` (`.dbp-note`) and `app/DailyEndCard.jsx` (`.dec-note`) - the
  existing "Points reflect results from unregistered users." footnote, one edit each covering all
  55 dailies.
- `app/quiz/[id]/DailyCombinedLeaderboard.jsx` - the scoring caption. The Overall tab mixes all
  three kinds, so it states the general shape rather than picking one; a per-game tab states its own.
- `app/LoftFinish.jsx` - the sub-label on the Replay option, which the component REWRITES rather
  than rendering what the client passed. All 65 clients hardcode `'This puzzle again, unscored'`,
  which stopped being true for End Game on 2026-08-12 and was never true for Arcade, so the card
  spent months telling players a retry was pointless on precisely the two categories built around
  retrying. Do not "fix" this by editing the clients: the rewrite is what stops it recurring.

**A new daily game inherits this for free**, since the branch reads `cat` off the registry. A new
CATEGORY that counts attempts differently needs a branch added to `dailyAttemptRule` and nowhere
else. Never restate the rule inline in a component.

## NOTHING TELLS YOU THE ROUND IS LOST WHILE YOU CAN STILL PLAY (owner rule, 2026-08-11)

All six End Game titles knew the position was decided before the player did, and all six said so.
Two different ways, and both are gone:

- **Four, Chain, Turn and Check** played the game out but ANNOUNCED the blunder: a toast ("That drop
  loses the win, and the position with it", "That hands it over. No take-back."), a status line that
  flipped to "Your move. The win is gone now" in red, an errors counter ticking up beside the clock,
  and in Four a header that counted the win down and then read **gone**.
- **Mate and Defend** did not play out at all. The first move off the bank's key ENDED the round on
  the spot, with the end card up before the player had played a move of the line.

The rule: **the only things that end an End Game round are the game's own conclusion and the Give up
button.** Nothing on the board may tell a player the position is decided while they still have a
move to make. The verdict waits for the mate, the last box, a full board, or the budget running out.

What to know before touching one of these:

- **The absence of a readout is itself a readout.** Four's "win in N" header and Chain's and Turn's
  "you are still winning it" were not verdicts, but they stop the moment the win goes, and stopping
  IS the announcement. So the live evaluation came out entirely rather than being softened: Four's
  header prints the puzzle's own `winIn` and the status lines read "Your move." Do not reintroduce a
  position-value readout in any form.
- **The tally is kept; only the display moved.** `errors` still increments, still posts as
  `guessesUsed`, still feeds `progress`, still prints on the end card. It is wrapped in
  `{!playing && ...}` in the stat bar, nothing more. Haptics count as a notice you can feel, so the
  blunder no longer buzzes `HAPT.wrong` or shakes the board: every move gets the same neutral tick
  and `HAPT.wrong` fires only from `finish`.
- **Playing on needs an engine for positions the bank never saw.** Mate's bank stores a Black reply
  for every position ON the solution tree and nothing off it, so off-book Black defends live through
  `stubbornestDefence` in `MateClient.jsx`, the mirror of Defend's `stubbornestReply` and built on
  the SAME `makeMateSearch` from `app/defend/defense.js` rather than a second engine. Defend's White
  stops defending stubbornly once `doomedAt` is set and collects the mate through `firstMatingMove`;
  `stubbornestReply` cannot do that job, because it scores a move leaving Black no reply as Infinity
  so the engine can never hand over a stalemate, which rules out the mating move along with it.
- **THE TREE WALK COVERS WHITE'S MOVES, not just Black's, and that is what routes a
  deviation to the live engine.** `nodeAfter` in `MateClient.jsx` followed only the odd
  indices, so an off-key White move left the walk sitting on the node it started from and
  Black was handed a SCRIPTED reply belonging to a line nobody had played. On the 8-11
  board that reply is Kf3, the answer to 1.Ke5, and after 1.Qh5+ it is not even legal: it
  puts the king back on the queen's h5-g4-f3 diagonal. The board went illegal and then
  demanded a mate in one that did not exist (owner report, 2026-08-11). Swept over the
  whole bank the old walk produced an ILLEGAL reply on 324 of 1,986 off-key first moves,
  across 61 of the 62 boards, and `stubbornestDefence` could never run on move one at all,
  because the tree lookup never failed. Two mechanics now: the walk returns null the moment
  a White move is not the tree's, and any stored reply is legality-checked against the
  actual board before it is played. The miss count came right with it, since `tryMove`
  tallies only while the node is non-null, i.e. on the move that LEAVES the line rather
  than on every move after it.
- **Ties among equally stubborn defences break on MATERIAL first, then UCI.** Depth alone
  let Black walk past a free piece: 1.Qh5+ hangs the queen, both Kxh5 and Kf4 dodge mate
  inside the budget, and the bare lowest-UCI tie-break took g4f4. Material never outranks
  survival, it only settles a tie, so a capture that walks into mate is still refused
  (1.Qg2+ Kxf5 2.Rf2#, so Black plays Kh5 and leaves the knight). Deterministic either way,
  which is what keeps the leaderboard comparing like with like. The values live INSIDE
  `stubbornestDefence` because the verifier lifts that one function out by brace-matching.
- **The same tie-break bug lived in CHECK, and the same fix applies (2026-08-26).** Player
  feedback read "it seems the AI prioritizes capturing pieces over sensible movement", which
  is half a rules misunderstanding and half a real defect, and it is worth knowing which
  half is which. Captures are COMPULSORY in English draughts, so black cannot prefer a jump
  over a quiet move: across all 429 positions reachable after any red first move on the
  62-board bank, black was never once offered that choice, and the forced jump is the very
  mechanism the puzzle rests on (every key is a sacrifice). But `blackReply` maximized the
  clear distance and then fell through to the puzzle's hash order, and that primary term
  ties on 780 of the 1,270 black replies in a full playout, so black slid a man into a free
  capture 257 times, 168 of them avoidable at the identical score. Tied replies now sort on
  net material, then crowning and how far up the board the piece lands, then the hash.
  Hangs fell to 80 (the rest are positions where every tied move hangs something) and black
  went from giving away a net 24 pieces to winning 213. Same reasoning as the Mate rule
  above: sense settles a tie and NEVER outranks the primary term, so `clearIn` is a maximin
  and the value of every position is untouched. Verified by replaying all 62 boards against
  the new defence, every key still sweeps in its stated number of moves and no non-key first
  move wins, plus `scripts/verify-check.mjs` clean. Note the consequence: 35% of black's
  replies change, so an archived board replayed now meets a different defence than the
  person who played it live. Scores, keys and clear distances are unaffected.
- **A HARNESS THAT SKIPS THE TREE CERTIFIES A DECISION ORDER THE GAME DOES NOT USE.**
  `verify-endgame-playout.mjs` called `stubbornestDefence` directly for every off-key run,
  so it proved the defence the client MEANT to play and reported clean through all 324
  illegal replies above. It now picks Black the way `scheduleReply` picks it, tree first
  and search second, and fails outright on a scripted reply that is illegal in the position
  (checked BEFORE the client's own backstop discards it, or the backstop hides the bug).
  Re-run against the pre-fix client it raises 346 failures; against the fix it is clean.
  This is the §4b trap in the authoring standard, walk the move the player MEETS.
- **A round must be PROVEN to conclude, on every board, from every wrong move.** This is the one
  thing that can strand a player forever, so it is not an eyeball check.
  `scripts/verify-endgame-playout.mjs` walks all 1,924 off-key Mate lines and all 801 losing Defend
  lines against a player that squirms as long as it can, asserts every run ends and every engine
  reply is legal, and replays the winning line on all 118 boards to prove a solve is unchanged. It
  LIFTS both searches out of the client files rather than retyping them, so it cannot drift from
  what it certifies. Run it before shipping any change to these two.
- **Cost is a real constraint: these searches run on a phone inside the reply timeout.**
  `firstMatingMove` early-exits on the first mating move in `legalMoves` order rather than scanning
  them all, which is exactly as deterministic and takes the worst case on the bank from 1386ms to
  516ms, 774 of the 801 under 100ms. Defend only searches at all once `doomedAt` is set, so a player
  who is holding never pays for it.
- **Scoring did not move.** A loss still posts 0 and `endgame-loss-scores-zero` stands untouched.
  What DID move is `progress`, because a run that plays on past its mistake can no longer read its
  depth off the move count: see the table in the next section.

One thing fell out of this that is worth having. A Mate move the bank does not store as the key but
which forces mate anyway now WINS on its merits, because the player gets to play it out instead of
being stopped on the spot. Duals were previously only credited when the alternative mate landed
immediately.

Babel was the one End Game title untouched by this: it has no loss state at all, scoring a spread
against a benchmark instead. That is also why it LEFT the category on 2026-08-12 (see the Babel move
below), so the six titles this section covers are Mate, Defend, Four, Check, Chain and Turn.

## THE BOARD IS HELD UP AFTER THE LAST MOVE, and every end-of-game surface waits for it (owner, 2026-08-18)

A loss in an End Game title arrives on the OPPONENT's move, in the same tick that
sets the status, so the player has seen nothing when the round stops. `useEndHold`
(`app/useEndHold.js`) exists to hold the finish card back for a beat while the
finished board, deciding move lit, stays on screen.

**It did nothing for most of its life.** Only the legacy pre-Loft card was gated on
`!endHold.held`; the Loft flip is gated on `!playing`, so the card turned over the
instant the game ended and the hold expired behind it, unseen, on all seven games
that call it. The player's report was "Four auto-ends after one wrong drop", which
is a rendering complaint, not a rules one. Fixed 2026-08-18.

- **FOUR THINGS WAIT ON THE HOLD, and a new one must join them:** the three
  `loft-flip` / `loft-flip-in` / `loft-face` wrappers, the `loft-showopts` button,
  `LoftFinish`, and the `.loft-sol` post-game panel. Anything added later that
  appears when a game ends belongs behind the same gate, or it covers the board and
  the hook goes quiet again exactly as it did before.
- **What does NOT wait:** the six data hooks (`useIqStanding`, `useNextUnplayed`,
  `useUnplayedSimilar`, `useDailyBoard`, `useGameAllTime`, `useCategoryRank`) keep
  their `active: LOFT && !playing`, so the card's figures are already fetched when
  it flips in and the hold costs no loading time.
- **`HOLD_LONG` (3s) on a loss, `HOLD_SHORT` (1.2s) on a win, a give-up or a
  reveal.** A win is your own move and you knew it was coming; a give-up you chose.
  A DRAW takes the long hold, because a draw in these positions is the win thrown
  away and reads like a loss. Pass the delay at every `hold()` call site; the hook's
  `ms` argument is only a fallback.
- **The verdict copy already existed, in every End Game title.** Each has a
  `statusLine()` (Mate and Defend inline the same ternary) that names the outcome
  the moment play stops, and those lines are better than any shared string because
  they carry the real figures ("Boxes counted. The engine takes it 13 to 11."). They
  were simply never readable. So do NOT add a second announcement: the hold makes
  the existing one visible, and it is amplified for the beat (15px, ink instead of
  faded). **Babel is the one exception** and passes a note to `EndHoldNote`, because
  its verdict lives in the `.loft-sol` panel, which is held back with the card, so
  it has nothing on the board to read.
- **A note never names what was missed.** These positions are replayable and the key
  is deliberately withheld from a player who did not find it, so the note states the
  opponent's own move ("Your opponent went out.") and never the column, the line or
  the word, exactly as `.loft-sol` is careful not to.
- **`release()` on replay still clears the hold**, so a restarted board is never
  stuck behind one.

Verifying this off-cycle is the same problem as a Sunday Edition: the hold is one
second of one ending. Assert it structurally instead. Every `hold()` call names a
delay, every one of the six gates carries `!endHold.held`, `release()` survives in
`resetGame`, and the data hooks still prefetch.

## DAILY POINTS ARE A FIXED LADDER BY FINISH, not a field-scaled split (owner rule, 2026-08-12)

Every daily game pays the SAME table, whatever the field:

| Finish | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th+ | did not play |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Points | 15 | 12 | 10 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | **1** | 0 |

This replaced `completion (5 x score/total) + placement (10 x field-scaled)`, which was
fair but unreadable. On the 2026-08-12 board a 94-player Crux field paid its top four
15 / 14.9 / 14.6 / 14.5, while 5th of an 8-player field paid 4.3 for the same "5th
place". Nobody could look at a board and say what a finish was worth, which is the
whole job of a leaderboard.

- **`GAME_MAX` stays 15 and the best-25 / 375 daily ceiling stays**, so nothing
  downstream rescales and every board still prints `x / 15`.
- **The 11th+ floor is deliberately non-zero.** Finishing a game has to beat skipping
  it, or best-N quietly rewards ducking anything hard.
- **Completion is not paid separately any more.** How much you solved already decides
  where you finish; paying for it twice is what let a weak finish in an empty field
  out-earn a strong one in a stacked field.

### The position is counted over REGISTERED players only (owner, 2026-08-13)

The public board has renumbered registered players 1, 2, 3... since 2026-07-26 so guests
leave no gaps in it. The POINTS never got that memo: they were paid on the player's
position in the FULL field. Under the ladder that surfaced immediately as a Four board
reading **#1 next to 6 points**, because the top registered player was genuinely 6th of
12 and collected the 6th rung.

A guest cannot win, hold a crown, or take the prize, so paying a registered player by a
position that counts guests pays them for a race they were not in. **Removing guests
never REORDERS the registered players, it only closes the gaps between them**, which is
exactly what the board's own renumbering already does. Replaying the 2026-08-13 board
confirmed it: identical order top to bottom, totals up 10 to 20%, top-10 spread slightly
wider.

- **A GUEST is paid the position they WOULD hold if they registered**, which is the same
  number `guestProvisional` previews to them on the end card. The preview and the payout
  now agree; before, they were two different formulas.
- **`field` / `plays` / `uniquePlayers` still count EVERYONE.** The owner chose to leave
  the "of 15 players" denominator on the full pool, so a card can read "#1 of 15" while
  the 15 includes guests who were not ranked. The leaderboard footnote says so.
- **The three crowd scorers already did this** (`players.filter((p) => p.name)`), so
  outwit, outrank and feud have always been registered-only. This aligned everything else
  with them rather than the other way round.
- Each scored player carries **`rankedPos`**, the position the ladder actually paid.
  `points === ladderAt(rankedPos)` is the invariant any board render must satisfy, and
  the cheapest thing to assert when something looks wrong.

### A CROWN IS DECIDED ONCE AND NEVER RE-DECIDED (owner, 2026-08-13)

`attributeAnonGames` stamps a registering player's name onto **every play they have ever
made**, with no date limit. Under registered-only scoring that means a stranger signing up
today can rewrite a champion crowned three weeks ago, two ways: by winning that day
outright, or just by joining its registered field and shifting the points of everyone who
was already in it.

`app/api/quiz/daily-history/route.js` therefore scores a COMPLETED day against the
registered field **that existed at Eastern midnight**. A row whose owning account's
`quiz_users.created_at` is later than that day's end is demoted to a guest (`user_id` and
`username` blanked) for the crown computation only. It pairs with the row-level
`created_at >= dayEnd` cutoff already there: rows that arrived late do not count, and
neither do names that arrived late.

- **No migration.** `quiz_users.created_at` has existed since migration 20.
- **Only rows that still carry an `anon_id` are demoted**, since a row posted while
  logged in cannot predate its own account. So a genuine registered play is never stripped.
- **Accepted cost (owner):** a past day's displayed POINTS still recompute when someone
  registers, so a day's points and its crown can disagree about who was best. The owner
  chose this over freezing the points, so the new player's history is still credited.
- **IQ Points are untouched either way**, per the section above.
- **An admin fraud removal still corrects history**, which is the specific reason the
  2026-08-08 freeze note refused to store a snapshot row. Deleting rows re-derives the
  crown; only the passage of time cannot change it.

### `gamePoints()` is the ONLY place points are computed

`gamePoints(quizIdOrSuffix, { lo, hi = lo, field, ratio })` in `lib/daily-combined.js`.
It replaced FIVE hand-kept copies of the formula: `scoreGame`, `guestGameResult`, and
the three crowd scorers (`lib/outwit-score.js`, `lib/outrank-score.js`,
`lib/feud-score.js`). Five copies of a scoring rule is exactly how a per-game board and
the combined board drift apart, which this file warns about repeatedly elsewhere. Never
re-inline the math into a scorer; add the call.

- **`lo`/`hi` are the 1-based span of the TIE GROUP** (`lo === hi` when nothing ties).
  A tie pays the **mean of the rungs it spans**, never the rung at the mean position:
  two tied for 1st share (15+12)/2 = 13.5, three tied for 1st share 12.33. The crowd
  scorers break ties on submission time, so they always pass a single position.
- A new scorer passes the day's `quizId` (or bare suffix); `suffixOfQuizId` accepts
  either.

### Date-gated, never retroactive

`LADDER_CUTOVER = { y: 2026, m: 8, d: 13 }`. `usesLadder(id)` compares the quizId's
`M-D-YY` suffix against it; anything earlier runs the old split **byte for byte**, so no
already-crowned day recomputes and the day-freeze rule above still holds. An unparseable
id reads as the CURRENT rule, matching how `bestNForSuffix` already treats one. Same
cutover pattern as `BESTN_CUTOVER`; when the ladder next changes, add another dated
constant rather than editing this one.

**IQ Points are NOT affected and must stay that way.** `lib/quiz-xp` scores a daily from
its own `score/total` fraction and never reads these points, so no player's IQ total,
rank or trophy moved. If a future change makes IQ read placement points, it becomes
retroactive across all history and needs its own gate.

**Reader-facing copy branches on a `ladder` boolean** returned by
`/api/quiz/daily-combined`, so an archived day prints the explainer for the rule it was
PLAYED under (`DailyCombinedLeaderboard.jsx`). Any new surface that explains scoring
reads that flag rather than hardcoding today's table.

**Accepted trade-off (owner, 2026-08-12):** 5th of 94 and 5th of 8 both pay 7, so beating
89 people is no longer worth more than beating 3. That is the price of a table a player
can read, and it is not a new hole: the old rule already paid the full placement max to
whoever topped a two-player field. If farming tiny fields ever becomes real, the guard
to reach for is a minimum-field cap on the top rungs, not a return to field scaling.

**Before changing any of this, rebuild the verification harness** (it was scratch, not
committed). The load-bearing checks are: pre-cutover parity against the old formula across
a full sweep of (lo, hi, field, ratio); every tie paying inside the span it covers; the
points order never disagreeing with the per-game rank order; `points === ladderAt(rankedPos)`
on random mixed registered/guest fields; and the guest preview equaling what registering
would actually pay.

**Fixture warning, this cost a debugging round:** build any score-ordered test fixture on a
PLAIN game id such as `crux-8-14-26`. The End Game titles (`four`, `mate`, `check`,
`defend`, `chain`, `turn`) rank on tier then attempts then depth, NOT on raw score, so a
synthetic score fixture on one of those silently orders by something else and the test
proves nothing about what you meant to test. Keep one End Game case in the suite
deliberately, with realistic solved/lost rows.

## ONE CIRCUIT RANKS ON QUESTIONS RIGHT, and only one may (owner rule, 2026-08-30)

The **Trivia Gauntlet**'s board is the plain count of questions a player answered right
across the whole run, with the **combined clock as the only tiebreak**. Every other circuit,
the marquee included, still sums the 0..15 placement ladder.

The reason is the roster. The Gauntlet's seven games are seven banks of four-choice
questions, one life each, where the score already IS the number you got right, so the ladder
was a translation nobody asked for: a player who answered 61 correctly read a board that said
74.5, and the only way to learn whether 74.5 was good was to go and read the scoring rules.

**IT IS A BOARD RULE, NOT A SCORING CHANGE, and that is the whole safety of it.** Every game
in it still pays the same ladder on its own board, into best-N, into the crown, into the
trophies and into IQ Points, exactly as before. Nothing outside a `?circuit=gauntlet`
payload changes, so no played day moves and no player's IQ total moves.

- **Declared as `score: 'correct'`** on the circuit in `lib/circuits.js`, read through
  `circuitScoreMode(id)` (default `'points'`). The conversion is `rankByCorrect` in
  `lib/daily-combined.js`, applied by `/api/quiz/daily-combined` after `combineDaily`: a
  row's `total` becomes the sum of its member scores, `timeTotal` the sum of the clocks,
  and the ladder total is kept as `pointsTotal`. It **mutates in place**, because the route
  hands the viewer their own row out of that same array by reference.
- **The payload carries `scoreMode`**, and every surface that prints a circuit total reads
  it rather than assuming a unit (the run's finish card, the run summary, the circuit landing
  page, the home page's Circuits board, the share line). Do not hardcode "pts" on any of them.
- **`maxTotal` on a questions-right board is the day's own question count**, summed from the
  largest `total` any player recorded per bank, the same self-correcting denominator
  `scoreGame` already uses. A bank nobody has opened contributes nothing and it comes right
  the moment somebody plays it, so a surface must handle a zero ceiling rather than printing one.
- **A SECOND CIRCUIT MAY ONLY TAKE THIS RULE IF ITS MEMBERS SHARE A UNIT.** Adding scores
  across a sudoku, a crossword and a word ladder ranks whoever played the game with the
  biggest numbers. `scripts/verify-circuits.mjs` check 12 enforces it: a circuit declaring
  `'correct'` must hold only `RUN_GAMES` members.
- **The rank gate is unchanged**: you still need every game in the circuit played that day to
  take a rank on its board.
- No reader-facing copy on this circuit describes the ladder any more ("15 points for a win
  down to 1 for finishing" is gone from the landing page, the run's fine print and the summary's
  board note). Say what the board counts, not what a game pays.

## A LOSS RANKS ON HOW FAR YOU GOT, not on how fast you lost (owner rule, 2026-08-09)

The End Game titles are binary: you either solve the position or you do not, and a loss posts
`score: 0`. That left the entire losing cohort tied at zero, so the board fell through to its next
terms, `guesses_used` then `time_elapsed`, and effectively **ranked the losers by who lost FASTEST**.
Two things the owner caught:

- On a day nobody solves it, whoever threw it away in four seconds **tops the leaderboard**.
- A **give-up outranks a genuine loss**, because revealing records no errors and a player who fought
  on and missed by one move records one.

### `progress`: the depth term (migration 51)

`quiz_results.progress` is an integer measuring how far into the puzzle the run actually got, in
whatever unit that game already measures itself in. It sits in the comparator **between score and
the clock**:

```
score DESC → (pricer) → progress DESC → time ASC
```

**It is a RANKING term ONLY.** The score is untouched, so a loss still earns zero completion points
and zero IQ Points, and the `endgame-loss-scores-zero` ruling stands exactly as written. Progress
only orders the losers among themselves, deepest run first, with the clock settling genuine ties.
Per the owner's call, a give-up and a played-out loss that reached the same depth are treated the
same; quitting is not separately penalised beyond the depth it stopped at.

### The rules

1. **`progress` REPLACES the guesses tiebreak, it does not stack with it.** When either row carries a
   value, the comparator runs progress then time and skips `guesses_used` entirely (errors are close
   to meaningless in End Game: in Mate and Check a single error IS the loss, so every loser has one).
   When NEITHER row carries a value the old guesses term runs untouched.
2. **Null means "this game does not post it", not "last".** Every historical row and every game that
   does not send the field is null, and a null-vs-null pair falls back to the old comparator, so **no
   already-played day can be reordered by this**. A null row inside a game that DOES post it counts
   as depth 0, which is what a pre-migration row for that game honestly represents.
3. **Each game defines its own unit, and it must be a non-negative integer where higher is further.**
   Currently:

   | Game | `progress` | Why that measure |
   |---|---|---|
   | Mate | moves played on the line, `ceil(moves.length / 2) - errors` | it was `floor(moves.length / 2)` while the first wrong move ended the puzzle, which made every White move in the list correct by construction. The round plays on from 2026-08-11, so the miss has to come back off |
   | Check | black pieces swept, `PUZZLE.blk - countPieces(board, false)` | the sweep IS the puzzle, and the share squares already grade on it |
   | Four | correct drops, `ceil(moves.length / 2) - errors` | you move first, and a drop that threw the win away was already counted as an error |
   | Chain | boxes taken, `stateAfter(moves).score.mine` | a capture keeps the turn, so the move list has no parity to read your own moves off |
   | Turn | discs held, `stateAfter(moves).score.mine` | same as Chain, and it is the number the game already reports to you |
   | Defend | saves made, `doomedAt` once the position has gone | the move list keeps growing after the save is lost, but those moves are the mate being collected rather than saves, so the depth is frozen at the save you were on when it went |
   | Babel | **none** | its score is already a graded spread against a benchmark, so it needs no tiebreak. Moved to Word 2026-08-12; the row stays because its archived days still score |

4. **Post it from the abandon flush too**, not just the finish path, or a bailed run ranks as depth 0
   when it was not.
5. **THE COMPARATOR HAS TWO MIRRORS THAT MUST STAY BYTE-IDENTICAL:** `lib/quiz-anon.js`
   `buildLeaderboard` and `lib/daily-combined.js` `scoreGame`. A change to one without the other makes
   the per-game board and the combined board disagree on order. Four more places carry a copy of the
   ordering and were updated in the same pass: the `perfKey` tie group in `scoreGame` (two runs the
   comparator SEPARATES must not then share averaged placement points), `guestGameResult`'s hand-rolled
   "who beats me" test, the board row output map in `buildLeaderboard`, and the tied-rank display test
   in `app/quiz/[id]/QuizLeaderboard.jsx`.
6. **Verify with a real field before shipping a change here.** Import the actual modules and assert:
   a deep loss outranks a fast shallow one, a win still beats every loss, a game posting no progress
   sorts byte-identically to before, both mirrors agree across a few thousand random fields, and a
   losing run still shows `completion === 0`.

### Adding progress to another game

Any binary daily where a loss is currently score 0 and players can get partway is a candidate. Pick
the unit the game already shows the player (that is the one they will find fair), compute it inside
`postResult` from the game state rather than from render-scope memos, send it on BOTH the finish and
the abandon paths, and add a row to the table above. No comparator change is needed: the term is
already there and keys off the field being present.

**Turn's stray consolation point was removed in the same pass.** Turn shipped after the ruling that
zeroed Four, Chain, Check and Mate and carried `SCORE = { won: 10, lost: 1 }`, so a losing Turn player
collected completion and IQ Points nobody else got. It is `lost: 0` now, and how far they got is
carried by `progress` instead, which ranks without paying.

## END GAME BOARDS RANK ON ATTEMPTS TO SOLVE (owner rule, 2026-08-12)

Every other daily keeps a player's **first attempt**, because a replay there is playing a puzzle
whose answer you already know and letting it score would make the board a test of who replayed. The
six End Game titles are the one family where that reasoning does not hold: they never hand over the
answer (`KEEPS_ANSWER` in `lib/daily-games.js`), a loss scores 0, and the whole design invites
another run at the same position. So their boards answer a different question. Not "did you get it
first time" but **"how many runs did it take you"**, and the player who solved Four in 24 tries ranks
above the one who needed 25.

**The order, per puzzle.** Three tiers, then attempts, then the clock:

| Tier | | Ordered by |
|---|---|---|
| 0 | **Solved** (`score === total`) | the attempt number the win landed on, then the time of THAT run |
| 1 | **Drawn** (`0 < score < total`) | the attempt number the draw landed on, then that run's time |
| 2 | **Never finished** (0 on every run) | `depth` (progress, then guesses), then time. Attempts are IGNORED |

- **Any solver beats any drawer beats anyone who never finished**, however many runs it took.
- **The clock is the SOLVING run's**, never the sum of the failed ones (owner, 2026-08-12). A slow
  loser is already ranked down by the extra attempt; charging them the time twice is double counting.
- **The unsolved are NOT ranked on attempts**, in either direction. Fewest would put the player who
  gave up once above the one who fought through five; most would pay for grinding. How far they got
  is the only honest separator, which is the `progress` term migration 51 already added.
- **Four is the only End Game game with a middle tier.** A draw posts 4 of 10; the other five are
  binary 10 or 0. A draw is its own tier by owner ruling: the position was already won, so holding a
  draw is not solving it, but it is not the same as losing either.
- **A player who drew and then went on to win is a solver**, at the attempt the win landed on. The
  draw only represents them if they never won.

**Attempts come from the rows, with nothing new stored.** Every End Game run already posts exactly
one `quiz_results` row (a win, a loss, a give-up, a Restart, or the `useAbandonFlush` pagehide row),
so attempt N is simply the Nth row that player posted for that puzzle, in id order. Nothing was
migrated and no client changed.

**THIS IS ORDER ONLY (owner, 2026-08-12).** A solve is worth full completion whatever try it landed
on, so **IQ Points and the combined-daily completion term are untouched** and no already-played day
is worth anything different. Attempts move `placement`, which already carries 10 of the 15.

**One implementation, not two mirrors.** The rule lives in **`endGamePlan` in `lib/daily-games.js`**,
the registry both scoring files already import, and is read by `scoreGame` (`lib/daily-combined.js`)
and `buildLeaderboard` (`lib/quiz-anon.js`). The standing rule that those two comparators must stay
byte-identical was kept until now by maintaining two hand-written copies; a shared function cannot
drift, and any future ordering term should go the same way. `endGamePlan` returns `{ chosen, info }`:
`chosen` is the ONE row representing each player (the winning run, not the first), and `info` covers
**every** row so the all-attempts views (`filter: 'all'`, `playerPlacement`) still sort.

**The places that had to move with it**, all in the same push, and the list to re-check if the rule
changes again:

- `scoreGame`: the per-player row selection, `ranks`, and **`perfKey`** (tie groups must include
  `tries`, or two runs the comparator separates get handed the same averaged placement points).
- `buildLeaderboard`: the same two, plus `tries` / `egTier` on the row payload.
- `guestGameResult` / `guestProvisional` and `chooseGuestRow` in `app/api/quiz/daily-combined/route.js`
  (the hand-rolled "who beats me" test), which now take the guest's `{ tier, tries }` verdict.
- The board payloads in the `daily-combined` and `daily-me` routes carry `tries` / `egTier`.
- **The registry `miss` label for the six is `'Tries'`**, and four render surfaces print the attempt
  in that column instead of the per-run error count: `DailyBoardPanel`, `DailyEndCard`,
  `QuizLeaderboard` (which also had to add `tries` to its tied-rank test, exactly as `progress` was
  added), and `gameStats` in `DailyTilePanel`. A run that never solved has no attempt number to
  report and reads as a dash.

**Verifier: `node scripts/verify-endgame-board.mjs`.** It IMPORTS the real modules rather than
restating their logic, so it cannot drift from what it certifies, and it proves all six claims
including that **400 random non-End-Game fields sort byte-identically to the pre-change engine**.
Confirmed to FAIL on a reversed attempts term, on ranking the unsolved by attempts, and on Babel
being left in the category. It needs `scripts/alias-loader.mjs` (below) to run under plain node.

### `scripts/alias-loader.mjs` — importing app modules from a plain-node script

The scoring modules are ordinary ESM, but two things Next resolves and node does not kept a checker
from importing them: the **`@/` path alias** (`lib/quiz-xp` reaches for `@/lib/theme`) and
**extensionless relative imports** (`lib/daily-combined` imports `./daily-games`). One alias and one
missing `.js` put the entire comparator out of reach, which is a large part of why the scoring code
had no checker. Register the loader, then dynamic-import (the hook must be installed before the
import resolves):

```js
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { scoreGame } = await import('../lib/daily-combined.js');
```

Prefer this to lifting logic out of the app into a checker. A verifier that restates the rule can
agree with itself while the app is wrong.

### Babel moved from End Game to Word (owner, 2026-08-12)

Babel is a word-tile endgame, and its scoring has nothing in common with the other six: it is
`solvesOnScore`, it grades a **spread against a solver benchmark** rather than solving a position,
and it has no loss state at all, so "attempts to solve" is not a question it can answer. It sits in
**Word** now and is excluded from everything in this section. The category lists in `DailyStrip`,
`DailyGamesGrid`, `DailyArchiveClient` and `DailyEndCard` moved with it; the registry `cat` is the
source of truth and `isEndGame` reads it, so nothing keys off a hardcoded list of six.

One knock-on worth knowing: `dailyDept` maps `Word -> 'word'`, so Babel's plays now file under the
**word** department in the IQ category breakdown instead of `entertainment`. That is the category
move doing what it says, not a bug, but it does move historical rows between category buckets.

## THE ATTEMPTS RULE IS A STRUCTURE, NOT A CATEGORY (owner, 2026-08-26)

"Rank on how many runs it took" was written for End Game and gated on the End Game
CATEGORY, which is the same mistake `wantsFastRetry` made and had to undo: the category
was where the structure happened to live, not what the structure IS. Three properties make
a board rankable on attempts, and none of them is a category:

1. **The game never hands over its answer** (`KEEPS_ANSWER`), so a replay is not a
   re-execution of something the board just showed you.
2. **A replay of the SAME board is the design**, not a loophole.
3. **There is one honest verdict per run** to rank.

Five games pass all three and are not End Game titles: **Barter, Chomp, Parker, Rung and
Taire**. Every one of them prints a proven minimum you are being invited to walk back
toward. So `isEndGame` stopped being the test and `attemptsMode(key)` became it, returning
one of two modes:

| Mode | Games | Order |
|---|---|---|
| `'binary'` | the seven End Game titles | tier (solved / drawn / unfinished), then attempts, then depth, then the clock. **Unchanged, byte for byte.** |
| `'graded'` | barter, chomp, park, rung, taire | **score**, then attempts, then depth, then the clock |

**Score leads on graded and that is the whole difference.** A graded game's score is a
SCALE, not a verdict: Barter is 10 at par down to 1, and the `lib/par.js` family is 10 at
perfect, 8 at par, floor 1. The binary comparator deliberately REPLACES the score term with
the tier, which is right when the tier carries the score (10 / 4 / 0) and catastrophic when
it does not, since a graded tier can only say finished-or-not and would flatten a 9 onto a 2.

**The attempts term was DEAD on four of the five, which is the argument for the change.** A
graded board's second term was `guesses_used`, and on Barter, Parker, Rung and Taire that
figure is a pure function of the score (Barter's score IS `10 - 2 x trades over par`), so it
could never break a tie it was asked to break and the board fell straight through to the
clock. Attempts fill a term that was doing nothing. Chomp is the exception, where moves are
independent of the score, so there it displaces a live tiebreak down one place rather than
replacing a dead one.

**Nobody who scored zero is ranked on attempts.** Same reason binary exempts its tier 2:
fewest-first would put the player who gave up once above the one who fought through five.
They fall to the depth term every other board uses.

**A graded player is represented by their BEST run**, not their first and not the one they
won on, since every finish is a win of some size. A dead heat keeps the EARLIER run, so
replaying to the same result gains nothing.

### It is DATE-GATED, and End Game deliberately is not

`ATTEMPTS_CUTOVER = { y: 2026, m: 8, d: 26 }` in `lib/daily-games.js`. Turning the rule on
re-ranks days already played: an unscored replay somebody took last week would suddenly
count, and a crown is decided once. `attemptsModeForQuizId` applies the gate; `attemptsMode`
(by KEY) does not, which is correct for reader-facing copy, since that describes the run a
player is about to take rather than an archived day. Same shape as `bestNForSuffix` and
`usesLadder`, but kept in `daily-games.js` because `daily-combined` imports it and the other
direction would be circular.

**End Game is NOT gated.** Its rule went live 2026-08-12 and every End Game day since has
been scored under it, so gating it now would BE the retroactive change the constant exists
to prevent.

### One comparator, not two mirrors

The standing rule that `scoreGame` (`lib/daily-combined.js`) and `buildLeaderboard`
(`lib/quiz-anon.js`) must stay byte-identical was kept until now by two hand-maintained
copies of the same twelve lines. Both now BUILD the comparator from **`attemptsRanker(plan,
mode, depth)`** in `lib/daily-games.js`, beside `attemptsPlan` and for the same reason: a
shared factory cannot drift. `depth` is passed in rather than reimplemented, because each
caller already owns its own and it folds in the tally rule, which is a property of the board
and not of this rule.

`endGamePlan(rows)` survives as `attemptsPlan(rows, 'binary')` for every caller and checker
written against it.

**The places that had to move with it**, and the list to re-check if the rule changes again:

- `scoreGame` and `buildLeaderboard`: the mode, the plan, and the built comparator.
- `guestGameResult` (`lib/daily-combined.js`), which holds a hand-rolled copy of the order
  because it only ever sees ONE row. Its `eg` verdict now carries `graded`, and the graded
  branch tests score first. A copy of a comparator is exactly what the verifier's guest
  section exists to police.
- `chooseGuestRow` in `app/api/quiz/daily-combined/route.js`.
- `wantsFastRetry`, so a graded game gets the retry panel, and `dailyAttemptRule`, so its
  replay control says **Replays count** rather than Practice run.
- The `runRetry` / `runUnsolvedEG` gates in `app/LoftFinish.jsx` AND `app/DailyEndCard.jsx`.
  LoftFinish is the live one (see the fifth-mirror note); DailyEndCard keeps its copy.

### The miss column becomes Tries on all five

The board renders `r.tries` whenever `egTier` is present, so the five registry rows moved to
`miss: 'Tries'` and their clients' `missLabel` props with them. On four of them nothing is
lost, since the old figure was redundant with the score. **Chomp is the one real cost**: its
Moves is independent of its score and is still a live tiebreak, it just no longer has the
column. It stays on the end card, the share and the local stats.

### Barter had to stop revealing its answer first

`BarterClient` `finish()` used to do `g2.cells = TARGET.slice()` the moment the trade budget
ran out, with a comment saying Barter is not an End Game title so a finished board always
shows its solution. That is the one thing a board ranked on attempts cannot do: a busted
player would be handed the target and could re-execute it for a perfect 10, which makes the
board a test of who busted first. The auto-fill is gone, Barter joined `KEEPS_ANSWER`, and
the end card's tile is now always **Return to board** rather than Reveal answer. The explicit
Reveal control in the play area is untouched: it always was the give-up.

**Any future game added to the graded mode needs the same audit.** Paths and Span are the
next two candidates by structure (both grade you against a proven optimum) and both fail
property 1 today, because each shows the optimal route on give-up. Fix that first or the rule
is dishonest on them.

### Verifier

`node scripts/verify-endgame-board.mjs` covers both modes. It IMPORTS the real modules
rather than restating them, so it cannot drift from what it certifies (it needs
`scripts/alias-loader.mjs`, and `node_modules` on the path). The load-bearing checks: the
graded order is score-then-attempts; the best run represents the player and a dead heat keeps
the earlier; the zero-score cohort is not ranked on attempts; the date gate leaves a
pre-cutover day alone; **400 random non-attempts fields sort byte-identically to the old
engine**; and the guest's hand-rolled copy agrees with the board it is quoting. Confirmed to
FAIL on each of: attempts before score, ranking the zero cohort on attempts, dropping the
cutover, and letting a tie keep the later run.

## A LEADERBOARD REPORTS THE GAME'S OWN UNITS, NEVER "guesses" (owner rule, 2026-09-01)

Every daily posts ONE figure in `guessesUsed`, and what that figure COUNTS is
different in every game. `miss` in `lib/daily-games.js` is the word for it:
Hands posts **Busts**, Sweep **Digs**, Tuck **Unused**, Paths **Cost**, Strata
**Hints**, Jester **Placed**, Babel **Stuck**, and sixteen games post nothing at
all and carry `miss: null`. Twenty-one distinct words across seventy-nine games,
and only five of them are "Guesses".

The three TABLE surfaces have always headed their column with it
(`DailyBoardPanel`, `DailyEndCard`, `LoftFinish`, all reading the registry by
key). `gameStats` in **`lib/daily-row-stats.js`** did not: it welded on the word
"guesses". That helper is what the **ending curtain** prints — `StageFinish`, the
page every daily finishes on, the one leaderboard a player is guaranteed to see —
so a Hands player was told "3 guesses" about a game that takes no guesses, with
the column header a few hundred pixels away reading "Busts" the whole time
(owner report). It was wrong on all fifty-eight games whose word is not
"Guesses", and it had been since the helper was extracted.

**The rules, and the second matters as much as the first:**

1. **The word is the registry's.** `gameStats(row, missLabel)` takes the game's
   `miss` and inflects it through `MISS_ONE`, an explicit singular table (the
   labels are not all plural nouns: Asked, Wrong, Stuck, Unused and Placed do
   not inflect, and Tries and Guesses are exactly the two a trailing-s rule gets
   wrong). End Game still reports `tries` in preference to `guessesUsed`; its
   registry label is 'Tries', so it reads "1 try" exactly as before.
2. **NO LABEL MEANS NO TERM.** `miss: null` drops the term rather than filling
   it with a zero or a borrowed noun, which is the same rule the tables follow.
   **A caller that passes no label also gets no term**, deliberately: saying less
   is the honest failure, and saying "guesses" is how this lasted.
3. **`combineDaily` carries the figure through BOTH hops.** `scoreGame`'s player
   -> `u.games` -> `perGame`. The first attempt at this added it to the second
   hop only, so the home's standing table silently lost its middle term while
   every other surface kept it. That is a bug no page throws on and no reader can
   report except as "it used to say something", so `verify-miss-labels.mjs`
   checks both hops through the real module.
4. **A mixed-game table heads the column with NOTHING.** No single header is true
   of busts, digs and unplaced tiles at once, so on any surface listing several
   games the word travels in the CELL with its own number ("3 busts") and
   `gameStats` produces the whole run in one column. Heading such a column
   "Guesses" is the original bug in a new place.

**`scripts/verify-miss-labels.mjs`** is the gate, auto-discovered by
`verify-all`. It asserts: every registry label has a singular; display names are
unique (LoftFinish resolves the registry by NAME, so a duplicate would hand one
game another game's word); every client's hardcoded `missLabel` equals its
registry `miss`, and a game entitled to a column does not omit it; no shared
renderer welds a count-word onto a figure; and, behaviourally, that Hands reads
"3 busts", Suds reads nothing, and Mate reads "1 try". Confirmed to FAIL on the
pre-fix helper, on a `gameStats` that ignores its argument (11 failures), on
Calc's missing prop, and on either half of the combine carry-through.

**`missLabel` now falls back to the registry in `LoftFinish`.** All eighty
clients hardcode that prop, which is eighty hand-kept copies of one field, and
**Calc** proved the cost: it passed nothing, so its board silently dropped the
Tries column it was entitled to. The prop still wins where given (all sixty-three
that pass it match the registry exactly), so no existing game changed; the
fallback only fills a gap. Resolved by DISPLAY NAME because that is what the card
is handed, and guessing a key there would be the registry-key-is-not-route-name
trap. Calc was given its prop in the same push regardless.

## A BOARD READ WAITS FOR THIS TAB'S OWN RESULT ROWS (owner report, 2026-09-20)

Reported as "data almost never shows correctly on the end screen for the trivia gauntlet",
with a screenshot: the run said **46 of 180** and the board under it said **43**, with the
rank a **dash**. The gap was exactly Deep's 3, and Deep was the run's LAST quiz.

`finishSection` posts the section's result **fire-and-forget** and sets `phase: 'done'` in
the same synchronous tick; `useCircuitBoard(circuitId, done)` fires on exactly that flag. So
the POST and the board GET left together and the GET won essentially every time, which is
why the complaint was "almost never" rather than "sometimes": a read beats a write. The
board then described a seven-game day with six games on it, and since a circuit ranks nobody
who has not finished every game in it (`rankEligible`), the rank collapsed to a dash on a run
that was in fact complete.

**`fresh=1` cannot fix this and never could.** It forces an authoritative read of the
database; it cannot force the database to hold a row that is still in flight. The same goes
for any cache-busting: every layer below was behaving correctly.

- **The registry lives in `app/ResultQueue.jsx`**, whose fetch wrapper already identifies
  exactly these POSTs, so every reader inherits it with no wiring and a future run client
  cannot forget. `resultPostsSettled(capMs)` resolves when every result POST issued so far
  has come back, or at an 8s ceiling. **`useCircuitBoard` awaits it before asking**, which
  covers the run scorecard, the Broadcast and the Valet run at once.
- **A tracked post EVICTS ITSELF at the ceiling.** Without that, one hung request sits in the
  set for the rest of the session and every later read in the tab pays the full ceiling
  waiting on it. The ceiling is the longest one reader will wait, not a debt the next reader
  inherits. This was caught by unit-testing the registry, not by reading it.
- **With nothing in flight it resolves at once**, so the gate read and the summary page are
  not delayed by a millisecond.
- **The solo end card already solved this, differently**: `fetchDailyMe({ fresh: true })`
  RETRIES until the player's own row lands (see `app/dailyMeClient.js`). Either shape is
  fine; a board read with NEITHER is the bug. When adding any read that runs at the end of a
  game, say which of the two it uses.

**The same screen had a second, milder staleness**: `useGauntletField(sections, hydrated)`
read once at hydration, which on a run page is before the player has answered anything, so
every "of N on this bank" in the ending described the field as it stood several minutes and
everyone-else's-run ago, over a shared-cacheable response on top. It re-reads when the run
ends, CDN skipped. It deliberately does NOT wait on this tab's own post: a player's own row
cannot change their own place (nobody outranks themselves), so the only thing it adds there
is one to the play count.

## Daily best-N is 50 from 2026-10-12

`bestNForSuffix` returns 50 (750 ceiling) from `BESTN_CUTOVER_3`, 25 for 07-27..10-11,
and the older steps before that. Days before the cutover never recompute. Surfaces read
`bestN` / `maxTotal` off the payload; never hardcode 25, 375, 50 or 750 in copy.

## IQ is a 30-minute SNAPSHOT plus a fresh asker (Vercel cost fix, owner 2026-10-19)

The October bill was $60 on-demand at mid-cycle, and Fluid Active CPU was the biggest line. Three
routes were ~60% of it: `/api/quiz/iq-standing`, `/api/quiz/me` and `/api/quiz/daily-status`, each
burning ~3s of CPU per call re-deriving every player's IQ. The memos in `lib/quiz-derived-cache.js`
were keyed on the EXACT row count, so with a play every few seconds they missed almost every time.

- **`iqSnapshot(rows)`** builds the whole-site state (every player's IQ, the ranked field, trophies,
  day standings) at most once per `IQ_SNAPSHOT_TTL_MS` (30 min) per instance, or immediately if the
  table shrinks (an admin reset).
- **`iqPlayersFresh(rows, { recentN, keys })`** returns the snapshot's players with each asking key
  recomputed FRESH from that player's own rows, scored against the snapshot's difficulty map. That is
  exact, not an estimate: a quiz's difficulty depends only on that quiz's rows and every other term
  in `computeXp` is per player (verified: identical to the full computation for every player). So the
  asker's "+N", total and today figure are live; the rest of the field, and therefore the asker's
  rank, is up to 30 minutes old. A quiz first played since the snapshot gets its difficulty derived
  from current rows on the spot.
- **`rankWithFresh(snap, players, keys)`** slots the fresh player into the snapshot's sorted field
  with `rankCompare` from `lib/quiz-xp.js`, the same comparator `rankPlayers` uses. Never re-sort the
  field per request.
- **Trophies are snapshot-only** (`iqSnapshotTrophies`). Owner ruling: a new trophy may appear on a
  later visit rather than the instant it is earned.
- **The Stat Hub keeps the exact path**: it calls `/api/quiz/me?full=1`, which runs the old
  `computeXpCached(..., rankFor)` (per-game rank movement, live trophies). Every other `/me` caller
  reads the snapshot. Do NOT add `full=1` anywhere else; it is the expensive path by design.
- `computeXp` gained an optional `difficulty` argument and parses each timestamp once before sorting
  (the comparator was calling `Date.parse` ~2 n log n times). Output is byte-identical; the full pass
  runs about twice as fast.

Other `computeXpCached` callers (`xp`, `xp-categories`, `share-card`, `day-card`, `player`) are still
on the exact-version memo. They are low-traffic; move them to the snapshot the same way if they ever
show up near the top of Observability > Functions sorted by Active CPU.

## End-card headlines and par (owner rule, 2026-10-25)

Every daily's end-card headline comes from `lib/end-verdict.js`, never a hand-written string:
`endGrade(score, total, top?)` (Solved! / Great job! / Good job! / Good effort), `endSolved(won)`,
`endStreak(depth, total)` for the one-life gauntlets ("14 in a row!", "Flawless!", never "of 25"),
`endEfficiency(won, finalScore)` for the move-budget games (Perfect! / Solved! / Good job!), and
`ARCADE_RUN` ("Good run!"), which StageFinish upgrades to "Personal best!" on a PB. No headline
starts with "Not"; a miss reads "Good effort", and in-board sublines read "Not yet ...".

**Par appears only in instructions** (rules panel props, the start-gate how-to-play paragraph,
the SEO prose). Never in stat tiles, meters, Sunday chips, done lines, the LoftFinish `detail`,
the old end card, or share text. Detail lines carry the raw measure (moves, trades, rows, points,
cells, apples). The ending compares against the FIELD instead: `/api/quiz/board` returns
`guessMid` (median guesses_used over runs that scored, 5+ runs), printed as "Typical player 14
moves" for games whose `CHALLENGE_METRIC` entry carries `field: 'guesses'`; and the self track
adds a "Typical player" marker from the median of `scoreDist`. A miss on a SCORED game goes to the
score track (average / best / typical / today), never the "0 of your last 7 solved" strip; a
solve-only miss with zero solves shows the field's solve share instead. A new daily follows all
of this from launch.

## No arbitrary fractions, and the scale comes off the move boards (owner, 2026-10-26)

"I don't want to see 10/10 anywhere unless there are 10 items to guess or fill." A daily's
posted `total` is a real count on some games (25 questions, 16 Crux marks, 9 Niche cells) and an
invented scale on the rest (10 down to 1 for efficiency, a 100-point read, a benchmark).

- **`SCORE_VIEW` in `lib/daily-games.js` classifies every scaled game**, read off each client's
  postResult on 2026-10-26: `verdict` games read **Solved / Unfinished** (`min` is the lowest score
  that is a solve; Ping, Warmer, Crunch and Redact post partial credit on a give-up, Chomp is solved
  only on a full clear, Four reads Won / Drew), `points` games read **"N points"** with no
  denominator. A game NOT in the table keeps its fraction, which is the honest default for a count.
- **`scoreText(key, score, total)` is the one string every surface prints**, and `rowSolved(key, score,
  total)` the one solve test. `dailyScoreText`, `scoreFig`, `gameStats` and `gameStatsShort` route
  through it. A new surface that prints a daily result must call it, never `${score}/${total}`.
- **A new daily game decides at launch** whether its total is a count. If it is a scale, add it to
  `SCORE_VIEW` in the same push.

**The rankings that went with it** (`attemptsModeForQuizId`, from `SCALE_OFF_CUTOVER` = 2026-10-26,
so a day already crowned keeps its order):

| Games | Mode | Order among solvers |
|---|---|---|
| Barter | `tries` | runs, then the clock (any solve is a solve; Barter now posts 10 on every solve) |
| Parker, Junkyard, Impound, Topple, Roll, Chomp | `timed` | the clock, then moves |
| Taire, Cell, Rung | `moves` | moves, then the clock |

A solve always ranks above a run that never solved; the unsolved fall to depth, never to attempts.
The player's representative run is their best by that order. Moves are `guesses_used`. The nine
move games' registry `miss` is now **Moves** (their rows print "14 moves · 1:20", not their run
count), and `endEfficiency` reads **Solved!** for any solve, **Perfect!** only at the proven
minimum. The comparator lives once in `attemptsRanker`; the guest copy in `guestGameResult` mirrors
it under `eg.order`. Gate: `node scripts/verify-scale-off.mjs`, shown to fail on a swapped order.
