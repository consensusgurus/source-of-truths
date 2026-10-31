# Circuits, the Daily Five, THE RUN (/circuits/<id>/run), gauntlet runs, Dojo, Read the Room, skills

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Circuits, the Daily Five, THE RUN (/circuits/<id>/run), gauntlet runs, Dojo, Read the Room, skills

## The Daily Five: a five-game run with one combined board (owner, 2026-08-17)

Five dailies, one from each of five different categories, played as one sitting, with a
leaderboard that ranks on the **combined placement across all five**. The roster for each
date is a hand-picked, dated bank in **`lib/daily-five.js`**, which is the single source of
truth: the console band, the in-game strip and the board all read it, and adding a day means
adding one line there.

**It is a LENS OVER THE ROSTER, never a second content stream.** The five are the same
puzzles everybody else plays, on the same dates, scored by the same engine. Nothing about
the run is stored: no table, no flag on a row, no opt-in. A game played on its own still
counts toward the run, so there is no way to be locked out of it by playing in the wrong
order, and no way for the run and the per-game board to disagree about a result.

### The board is `/api/quiz/daily-combined?five=1`, not a route of its own

`?five=1` narrows that route's slate to `fiveForSuffix(suffix)` and drops `bestN` to 5.
**That is the entire difference.** Everything else runs untouched: the same `scoreGame`, the
same ladder, the same crowd recomputes for Outwit/Outrank/Feud, the same guest provisional,
the same day freeze, the same caches. A route of its own would have meant a second copy of a
comparator that this file already says twice must never be copied (`buildLeaderboard` and
`scoreGame` are the two mirrors), and it would have drifted the first time either moved.

- The response carries **`five: true`** so a client cannot mistake one payload for the other
  when both are in flight.
- An **unbanked date falls through to the full slate** rather than returning an empty board,
  which is why the flag is `fiveKeys.length >= 2` and not the raw query param.
- Max is `5 x GAME_MAX` = **75**, and it comes off `maxTotal` in the payload. Never hardcode
  it on a client: the day's real ceiling drops if a game did not publish.

### Why COMBINED PLACEMENT and not score

The five games do not share a unit. A mini crossword is 25 squares, Sixes is a clock, Dating
is five events in order, Four is binary. Raw scores are not comparable, so each game's FINISH
converts to the fixed ladder `gamePoints()` already pays (15/12/10/8/7/6/5/4/3/2/1 by
position, registered-only) and the run adds the five up. That also means a player who wins one
game and skips four cannot beat a player who came 4th in all five, which is the whole reason
to run a five rather than five separate boards.

### Four rules for the bank, all enforced by `scripts/verify-daily-five.mjs`

1. **Five different categories, every day.** That is what makes the run a spread rather than
   a genre, and what gives it five different boards and five different end screens. The shape
   is Word + Numbers + Logic (the three deep pools, 15/10/16 games, so the bank can always be
   filled) plus **two rotating** from Trivia, End Game, Geography, Cards, Arcade and Crowd,
   shared **in proportion to pool size**. Geography, Cards and Arcade hold two games each, so
   giving them a slot as often as Trivia would put the same two games in the run every seventh
   day forever.
2. **A time budget, and the day ascends: SHORTEST FIRST, LONGEST LAST** (owner, 2026-08-17).
   Two separate things, both measured rather than guessed. Over 14 days of leaderboard rows,
   Dating's median is 22 seconds and Sando's is 1,171, so a weekday five is banked to 600-1000
   seconds of top-10 median (the fast end of the field, so an ordinary player lands around 12
   to 18 minutes); Monday runs shorter. Without a budget the generator cheerfully produced
   30-minute Sundays. The ORDER then ascends by that same median, so the run opens with
   something you finish in half a minute and closes with the one that takes real time: a
   player who has banked four games has a reason to start the fifth, where the same five with
   the long one first loses people before they have anything invested. **The categories decide
   MEMBERSHIP, the clock decides SEQUENCE** — an earlier draft ordered each row by category
   (Word, Numbers, Logic, then the two rotating), which is why the array order in the bank is
   not that. The 2026-08-17 launch five is deliberately the shortest in the bank (5:42) because
   the run shipped mid-afternoon Eastern.
   The medians live in `scripts/verify-daily-five.mjs` as a DATED SNAPSHOT, not in the library:
   they are a measurement with a date on it rather than a fact about the games, and shipping
   them in `lib/daily-five.js` would invite a client to render them as one. Re-measure by
   pooling `timeElapsed` off `/api/quiz/daily-combined?date=<suffix>` over a couple of weeks.
   The order check carries 25% tolerance per step so drift cannot fail a good bank.
3. **At least seven days between repeats** of any one game.
4. **The bank is dated and hand-picked, never derived at read time.** A date with no entry
   simply has no run: `fiveFor` returns `[]`, every consumer renders nothing, and the site is
   exactly as it was. **Do NOT add a computed fallback** to cover a gap; check the runway
   instead. The verifier warns under 14 days left and fails when the bank is exhausted.

**THE CHECK THAT EARNED ITS KEEP: every game must have PUBLISHED a puzzle on the date it is
banked for.** A game with no puzzle that day is not an error anywhere. `gamesForSuffix`
silently skips it, so the run quietly becomes a four with a 60-point ceiling and nothing on
any surface says so. The first hand-written bank named four games (listed, deep, chain, babel)
on dates their own puzzle banks do not reach. Generate the bank against real publication data
and review it; never type one from memory.

Two things that will bite a future bank edit: **Pricer is excluded on purpose** (it is pulled
from the server slate in `lib/daily-slate` `GAME_PUZZLES`, so it has no board, no field and
no points, and a run cannot contain a game the scoring engine cannot see), and the puzzle
banks are **not written in one style** — hand-authored ones read `quizId: 'lode-8-2-26'` while
every generated one is JSON-stringified as `"quizId":"lode-8-2-26"`. A checker regex that
assumed the first form found ZERO puzzles in the generated banks, which reports as "published
no puzzle" on every date rather than as a parse failure, so the most useful test was also the
most confidently wrong one. Match both, and treat an empty set as unreadable, not as empty.

### The three surfaces

- **`app/DailyFiveBand.jsx`** — the console band, mounted in `DailyStrip.jsx` between the
  title band and the cap. First thing on the console, and it takes no slot away: the cap keeps
  all three cards. The only GOLD-ruled thing on the surface, because an open run is unfinished
  business and gold is what this console already paints unfinished business with; the rule
  turns green when all five are done. One request, `?five=1`, which answers every question it
  asks at once. On a phone the five-across track collapses to pips plus a list, because five
  cards side by side at 390px is unreadable.
- **`app/DailyFiveBar.jsx`** — the in-game strip, mounted ONCE in `DailyChrome.jsx` so one
  edit puts it on all 63 dailies. It shows **only during a run** (the `?five=1` flag), so
  opening `/suds` directly shows nothing and a player who did not ask for a run is never told
  they are behind on one. It renders on the Loft branch too: the slate rail is a browse
  surface, this is navigation for something already in progress. Costs no request of its own,
  riding the shared `daily-me` client.
- **The hand-off** is the `Next: <game>` control on that strip, which is what turns a finished
  game into the next game. It is also on the finish itself, in `LoftFinish.jsx` (the surface
  actually on screen) and its `DailyEndCard.jsx` mirror, which is the higher-attention moment.

`?five=1` is the ONLY state a run carries. No cookie, no localStorage, no row. A run therefore
survives a reload, a share and a cold browser, and leaving one is the same URL without the
flag, which is exactly what the strip's Leave control links to.

### A RUN IS EVERY CIRCUIT, and `readRunParam` is the only thing that decides (2026-08-18)

The Five is circuit #1 of fifteen (`lib/circuits.js`); the other fourteen are fixed skill
circuits carrying `?circuit=<id>` instead of `?five=1`. **Every in-run surface reads
`readRunParam()` from `lib/circuits.js`, which returns a circuit ID or null, and NOTHING
reads a run flag off the URL for itself.** The four surfaces are `DailyFiveBar.jsx` (the
in-game strip), `LoftFinish.jsx` (the finish, and the one on screen), `DailyEndCard.jsx`
(its mirror) and `app/daily-five/DailyFiveSummary.jsx` (where a run lands). Members come
from `circuitKeysFor(id, day)`, the next game's link from `circuitHref(key, id)`, the
heading from `circuitName(id)` and the summary from `runSummaryHref(id)`.

**This is written down because the circuits launch shipped without it and NOTHING ERRORED.**
The console band handed players into a skill circuit while all three in-run surfaces still
read `?five=1` alone, so each one silently concluded it was not in a run: no strip, no
hand-off, no suppression of the end card's 30-second auto-advance to an unrelated daily, and
nowhere to land at the end. The run simply evaporated on the first finish, and every
component involved looked correct in isolation. A surface that knows about one of the two
flags is the whole bug.

Three rules that fall out of it:

- **A circuit is not always five games.** Wordplay, Mental Math, Sorting, Chess & Board,
  Table Games, Recall and Ranking are FOURS. Never write "all five" into run copy; read
  `runMembers.length`. The same goes for a marquee day whose bank has run out.
- **`/daily-five` serves all fifteen.** The bare URL is the marquee, `?circuit=<id>` is a
  skill circuit, narrowed by the same query `/api/quiz/daily-combined` already takes. Never
  a second page component, for the same reason the board is never a second route.
- **Gold is the marquee, blue is a skill circuit, green is complete.** The band set that
  rule and all four run surfaces follow it, via a `circ` class rather than a second
  stylesheet.

**To rank on ANY run board you must have played every game in it** (`rankEligible` in the
daily-combined route, marquee included since 2026-08-18). That is exactly why the hand-off
is load-bearing rather than a convenience: a player who is not carried to the next game
scores points and takes no rank at all.

### The in-run card carries a board, and an unsolved End Game gates the hand-off (owner, 2026-08-18)

Two things sit between the pips and the exit on the minimal in-run card:

- **The board for the GAME JUST FINISHED**, top three plus the player's own row, rendered by
  the same `lbRow` the full card uses so the two cannot disagree about a column. Crossing five
  games, a player used to see no result but their own. The RUN's combined standings are
  deliberately NOT here: they are provisional until everyone finishes, and `/daily-five` exists
  to show them once, at the end.
- **On the six End Game titles, an unsolved position GATES the hand-off.** There is no Next
  control until the position falls; Replay takes its place. Those boards rank on attempts-to-
  solve and never give the answer away, so a retry is the next attempt rather than a practice
  run, and `postResult` was already ungated on every one of them, so this was a UI gap and not
  a scoring change.

Four rules the gate must keep:

- **LEAVING THE RUN IS THE ONLY WAY PAST, and it must never leave the alt row.** A player who
  cannot crack a mate-in-3 genuinely cannot finish that circuit; the owner accepted that when
  choosing the gate over merely offering both. Removing the Leave link turns an accepted cost
  into a trap with no exit.
- **Arcade gets the Replay control but NOT the gate.** It takes the best run of the day, so
  another go can only help, but there is nothing to solve. Every other category keeps the FIRST
  attempt, so offering a replay there would promise something the board does not honour.
- **A run whose LAST game is an unsolved End Game does not auto-advance to the summary.**
  Bouncing the player off the board six seconds after telling them to play it again is the card
  arguing with itself. The summary control stays, it just waits to be pressed.
- **A draw is not a solve.** Four is the one End Game title with a middle tier, and a drawn Four
  gates exactly like a lost one: the position was already won, so holding a draw is not solving
  it. `outcome === 'won'` is the test, not "did the game end".

Implemented in `LoftFinish.jsx` (the surface on screen) and mirrored in `DailyEndCard.jsx`.

### Rules it must not break

- **PLAYED, not SOLVED.** An abandoned row is a started-and-left run and is not a tick, the
  same test the slate rail uses. Solved-versus-failed needs data these payloads do not carry
  per game, and navigation only needs to know what is left.
- **Which attempt counts is each game's own rule.** `dailyAttemptRule()` is the only source:
  ordinary dailies keep the first attempt, End Game titles rank on attempts to solve, Arcade
  keeps the best run. No surface here restates it per game.
- **Guests play the run** and are scored into `overallFull` exactly as they are on the full
  board. Only registered positions pay, per `gamePoints`.
- **IQ Points are untouched.** The run changes what a player is shown, not what a play is
  worth.
- **The five roll at Eastern midnight** with the puzzles, and a completed day freezes.
- **The day is read in an EFFECT on both clients, never during render.** The server has no
  idea what today is in Eastern, so computing it during render makes the first client paint
  disagree with the server's and React throws. Same rule `isSundayET` follows.
- **The board below the band is measured to the fold** (`--dh-fit`), and the fit effect
  re-runs on resize, on a ResizeObserver on the CAP, and on two late timers. The band is
  neither the cap nor a resize, so opening its leaderboard dispatches a resize rather than
  adding a second observer above the board, which is another way to build the loop that
  effect's own comment warns about.

### Inside a run you get ONE end card, at the end (owner, 2026-08-17)

A player who opts into the Daily Five must **not** be handed five ordinary end cards. Each
one is a full page of furniture: an IQ hero, rank tiles, a share bar, "up next", "easiest
leaderboard", the whole of today's slate, a popular quiz per category, a footer. Five in a
row is the same page five times, and **every one of those blocks points AWAY from the run
the player is in the middle of**.

- **During a run** (`?five=1`, and this game is in today's five) `DailyEndCard` renders
  `runInner` instead of `inner`: the verdict, where you are in the five, and one control
  (`Next · <game>`). Nothing else.
- **On the fifth finish** it becomes "See how the run went" and auto-advances to
  `/daily-five` after six seconds, with a Stay here escape.
- **`/daily-five`** is where the summary arrives once: the board for the five, then one
  **abridged** result card per game. Abridged means the result and nothing else, no per-game
  next-up, play-similar, share bar, archive or back-to-main, because those are page-level
  things and this is one page. It is also the run's permalink, and a half-done run renders
  honestly with the unplayed games as empty cards. `noindex`: every word on it is either an
  hourly leaderboard or one viewer's own results.

**THE SURFACE IS `LoftFinish`, NOT `DailyEndCard`.** Every one of the 65 dailies is on the
Loft format, so the run branch lives in `LoftFinish.jsx`, NOT `DailyEndCard.jsx`. The run
card was written into `DailyEndCard` first and never appeared once, on any game: it is the
component everything in this file is documented against, and it is not the one on screen.
This is the fifth-mirror trap already recorded above under LoftFinish. When changing what a
player sees after a daily, change `LoftFinish`, and **verify on the live page rather than on
the component you edited**. `DailyEndCard` keeps its own copy of the run branch for any
surface still rendering it, which is why both exist.

`LoftFinish` is handed a display `name`, not a key, so the run matches on it against
`DAILY_GAMES` (names are unique). The branch is an EARLY RETURN placed after every hook in
the component (showAll, openArchive, browse, the IQ ceiling effect, useDailyRoster, pickCat,
and the three the run adds), so the ordinary path is untouched and rules of hooks hold. Any
hook added to that component later must go ABOVE it.

**THE GENERIC AUTO-ADVANCE MUST BE SUPPRESSED IN A RUN.** `autoRun` in `DailyEndCard` sends
the player to the most similar unplayed daily after 30 seconds. Inside a run that walks them
out of it and into an unrelated game, so `autoRun` carries `&& !runActive` and the run has
its own hand-off. Anything else added to that card which navigates on a timer needs the same
gate.

Two implementation notes that will bite otherwise. The run block is computed **above**
`autoRun` in the file, because `autoRun` reads `runActive`. And `runComplete` is gated on
`combinedResolved`: until the day's completions land, `doneKeys` holds only the game just
finished, so an ungated test calls a one-game run complete and bounces the player to the
summary after their first game.

`runInner` carries **its own stylesheet**, including `.dec-backdrop` and `.dec-x`. The end
card's styles live INSIDE `inner`, so a branch that renders instead of it renders unstyled,
and in modal mode loses the backdrop and the close button with it.

### The band's right edge is a rule, not decoration

The console band's ground (`--ground` #14264f) is DARKER than the page behind the console
(`--accent` #1e3a8a), and every other part of that console is defined by contrast rather than
by a border: the title band is the page colour, the cap cards are blue, the board is white.
So the band's right edge met the page navy with nothing between them and the section read as
a hole in the card. It carries `border-right:1.5px solid #2c437c`, the same colour it draws
its own game cards in, which is lighter than both the band and the page and so reads against
either. Dropped on a phone, where the console is full-bleed and a right rule would be a stray
line down the screen.

### Wiring is applied by `scripts/patch-daily-five.mjs`, as anchored edits

The three files the run touches (`DailyStrip.jsx` at 4,769 lines, `DailyChrome.jsx`, the
combined route) are patched by anchor + insertion against a copy taken from a fetch in the
SAME deploy step, never from the working tree. Every anchor must match **exactly once**: zero
means origin moved, two means the anchor is not specific enough and the patch would land
twice, and both throw. That is the deploy section's stale-base rule applied to a change too
large to re-write whole.

## THE RUN: a circuit played as ONE LONG QUIZ (owner, 2026-08-27)

`/circuits/<id>/run` deals every game in a runnable circuit as a single continuous board.
No hand-off between games, no start gate on each, no end card between them: you answer, a
line tells you when a quiz has ended for you, and the next quiz starts on its own after
four seconds. It is the same games in the same order with the furniture between them taken
out, and it is the first circuit surface that is not five separate pages.

**IT IS A PRESENTATION, NOT A SCORING CHANGE, and that is the whole design.** The run files
exactly the rows the five clients file: one ordinary `POST /api/quiz/result` per section,
carrying that game's own `quizId`, score, total, guesses and clock. So every per-game
leaderboard, the circuit board, IQ Points, the trophies, the archive and the slate all see a
player who played those five games, because they did. There is no run row, no run table, no
run scoring and nothing new to rank. The combined placement is computed exactly as before by
`/api/quiz/daily-combined?circuit=<id>`. **Never add a score of its own here.** A second
scoring path for the same plays is the trap this file warns about in five other places.

**THE SECTION CLOCK IS PER SECTION.** Each game posts the time from its own first question
to its own last, so a run player's row is comparable with a solo player's on that game's
board. The run's total clock is the sum of the sections actually played, it is a display
figure on the scorecard, and it is posted nowhere. Do not post a run-wide time to any game.

**EVERY LOCAL WRITE THE SOLO CLIENT MAKES IS MADE HERE TOO** (`finishSection` in
`RunClient.jsx`), and this is the part that fails silently if it is missed: the per-puzzle
save `sot_<key>_<num>`, the day breadcrumb `sot_<key>_day`, the write-once stats record
`sot_<key>_stats`, and the abandon-dedupe key `sot_<key>_rec_<num>`. Miss any one and the
slate shows a game as unplayed that the server holds a row for, which is a disagreement
nothing errors on. The abandon row is filed through the shared `useAbandonFlush`, using that
game's own dedupe key, so leaving mid-section is a started game rather than a game with no
trace and a section can never post twice.

**A GAME ALREADY PLAYED TODAY IS BANKED, NOT REPLAYED.** The daily board keeps a player's
first attempt, so re-serving a game they finished this morning could only produce a row that
does not count. Those sections are marked banked at the start, their recorded score is read
out of that game's own local stats, and the run steps over them. A banked game that was run
clean still counts as cleared on the scorecard: it is the same feat whichever surface it
happened on.

**WHAT MAKES A CIRCUIT RUNNABLE.** `run: true` on the circuit, and every member listed in
`RUN_GAMES` (`lib/circuits.js`), which today is deep, atlas, sport, biz and streak. A game
can be dealt into a continuous board only if its day is a bank of four-choice questions in
play order, which is exactly what those five are: the same client five times over different
banks. `scripts/verify-circuits.mjs` asserts a circuit flagged `run` holds nothing else, so
a sixth game added to the roster and not to the bank map fails the checker rather than
silently vanishing from the run. Adding a quiz of the same shape means adding its key to
`RUN_GAMES` and to `BANKS` in `app/circuits/[id]/run/page.js`, and nothing else. The marquee
can never be runnable: its roster crosses every category by construction.

**Gauntlet's roster changed in the same pass.** Blitz left and Biz joined. Blitz ends on a
miss like the rest, but it is mental arithmetic against a clock rather than a bank of
questions, so it was the one member that could not be dealt into a continuous board; it
keeps its home in Mental Math and stops being double listed. The roster is now exactly the
five one-life trivia quizzes, which is both what the title says and what the run needs.

**A SKILL CIRCUIT NOW SCORES OVER ITS WHOLE ROSTER.** `dayBestN` in the daily-combined route
was pinned at `FIVE_SIZE` for every circuit, which is right for the marquee and right for a
five and wrong for every other size: the Arcade pair could only ever reach 30 while its own
board announced a ceiling of 75, and the circuit landing page has always said `n * 15`. The
ladder pays per game either way, so no player's points moved; only the ceiling and the
fraction printed beside them came right.

**The end of a run is its scorecard**, rendered in place by the run client: total questions
cleared out of the day's total, quizzes cleared, the run clock, then a row per game with its
tile art, its own colour off the daily registry, its score and a bar. It links to the board
at `/daily-five?circuit=<id>`, which is unchanged and remains the run's permalink. The share
text carries figures and a pip per game and never a question or an answer, per the standing
rule that share art leaks no solutions.

**Reading the code:** `app/circuits/[id]/run/page.js` resolves every bank on the SERVER and
ships only the picked day's questions, exactly as each game's own page does, so four banks
never reach a browser that is playing the fifth. Question shape, tier size and the twenty
second clock are derived rather than restated; the name, tag and colour come out of the
daily registry. The one thing copied is each client's `TIER_NAMES`, which is display only.

---

## THE RUN SHOWS WHERE YOU STAND WHILE YOU PLAY, and says it is a projection (owner, 2026-09-02)

The run's footer counted the questions you had right and stopped there, so the only question
a player actually has mid-run, whether this run is going anywhere, could not be answered
until it was over. The footer now carries the count set large plus a standing:
**`IF YOU STOPPED HERE · #4 of 37 · +2 passes 3rd · +9 takes the lead`.**

- **It is a FLOOR, and the label is part of the readout rather than a tooltip.** Every row on
  the board is a FINISHED total and the player's own climbs with each answer, so the position
  can only improve. A number that can only be beaten is honest; the same number presented as
  a rank would not be.
- **It costs no request.** `useCircuitBoard` was already read at the gate. What changed is
  that it is now held open through the run (`hydrated && !done`): it used to go inactive the
  moment the first question came up, and the hook's cleanup DROPS an in-flight response, so a
  player who pressed Start briskly ran the whole way with no board at all. The hook does not
  refetch while `active` stays true, so it is the same single call it always was.
- **Ties take the competition rank** (everyone strictly above, plus one), which is what the
  board itself does, and "+N passes" is what it takes to PASS rather than to tie, because
  that is the number a player can act on.

## The five runs offer each other on ONE card (owner, 2026-10-09)

The five daily runs are the Trivia Gauntlet, the Math Gauntlet, Price Check, Passport and
Judged. `app/circuits/MoreRuns.jsx` replaced the one-at-a-time RunNudgePop hand-offs:

- **`MoreRunsPop`**: the FIRST time a browser finishes any of the five (`sot_runs_pop`, stamped
  when it opens, never again), one pop-up lists every other run not finished today on this device.
  Mounted in RunClient (gauntlet and math, waits for the /trivia door), PriceCheckClient and
  ItemsPop (after the items pop-up), PassportClient (after the finale) and JudgedClient (after the
  verdict settles, via Verdict's `onSettled`).
- **`MoreRunsList`**: the same list inline on every run's end card, under the result, always. Done
  runs drop off; when all are done it says so. Judged passes its own `--ls-*` colours.
- "Done today" is `runDoneToday` from RunDoorPop. A new run joins by adding a `RUN_DOORS` entry and
  its id to `RUN_ORDER`.

**The Math Gauntlet door.** `RUN_DOORS.math` is `once: 'game'` like Judged: Blitz, Blitzed, Gap,
Series and Back each offer the whole run on the start gate of a player's first ever play of that
game (no plays in its local stats record), once per game.

**The Math Gauntlet share card.** `gauntlet-card.js` maps the five math banks too, and
`gauntletCardProps` / `renderGauntletCard` are circuit-aware (`kind: 'math'`: MIND LOFT · MATH,
"N problems, 5 games.", the Numbers hue). Before this the math circuit had no banks there and fell
back to the plain quiz card. A new runnable circuit's banks must be added to `DAYS` there.

**Phone home index order (owner, 2026-10-09):** under Circuits / Quizzes and Leaderboards + Stats,
Puzzle Archive full width (`.sty-ixar`), then Most Appreciated (`.sty-ixma`), then IQ Tests, School
Tests, Kids and Top 10 Lists (`.sty-ixm4`), all by CSS `order` inside the 900px block.

## The Gauntlet runs live at /trivia and /math (owner, 2026-10-12)

`/trivia` and `/math` SERVE the run page through `rewrites()` in next.config.js, and
`/circuits/gauntlet/run` and `/circuits/math/run` 308 to them, query string intact.
One page, one address, one analytics row. Both circuits carry `path` (so every
`runHref` link uses the short address) and `shareHref` (so every share does). The
landing pages stay at `/circuits/gauntlet` and `/circuits/math`.

- **A rewrite only works if no page file claims the path.** `app/trivia/page.js`,
  `app/math/page.js` and `MathDoor.jsx` were deleted for exactly that reason; a
  filesystem route outranks an ordinary rewrite. Do not recreate them.
- **Never hardcode `/circuits/<id>/run`.** Link through `runHref(id)`.
- **The /trivia door card (TriviaDoorPop) is no longer mounted.** It was replaced
  the same day by GauntletMorePop (below). The file stays, unreferenced.

## More-of-the-same card after a gauntlet (owner, 2026-10-12)

`app/circuits/GauntletMorePop.jsx`, mounted by the run for `gauntlet` and `math`. Shows
to a player whose WHOLE history is the two gauntlets' twelve games (local footprint AND
daily-status archive), once per ET day, at most 5 days per gauntlet, 2s into the
scorecard; `?more=preview` forces it. It leads with the games most like the quiz they went
furthest in (CONFIG per gauntlet). Sport has no sports daily, so the run page passes
TODAY's Bracket metric and Listed title with a sports flag (`todayBoards`, SPORT_RE) and
the card leads with whichever is a sports board today. The more-runs card waits for a later
finish if this one showed. Every key named in CONFIG must be live: re-check when a game
retires (Circa did).

## Enter the Dojo (`/dojo`): the daily sudoku run (owner, 2026-10-12)

Judged's machinery with a sudoku roster. Sixes, Suds, then ONE variant dealt by the
Eastern date from `DOJO_POOL` in `lib/dojo.js` (sando, quilt, mercury, cages, knight,
polka, frame, diag: 9x9 sudokus with one extra rule; Towers and Rim left out on purpose).
Circuit id `dojo`, engine `dojo`, scorer `dojo`, `scoreFrom: '2026-10-12'`.

- **A DEALT SLOT is a new circuit shape.** `keys` is the fixed head (`['sixes','suds']`,
  shortest first) and `slot: { pool }` is what the third grid is dealt from; `circuitKeysFor`
  appends the day's pick, so the board route, trophies and every surface see three games.
  `scripts/verify-circuits.mjs` recomputes the pick with its own day math (check 7), proves
  every pool member is dealt once per pool-length cycle (7b), and tiers the trophy off the
  AVERAGE day (fixed medians plus the pool's mean).
- **Clocks ADAPT (owner, 2026-10-12 night):** a day's [PAR, CAP] per grid come from `lib/dojo-clocks.js`, which reads EVERY solve of that game over the 28 days before the day (25th / 90th percentile, first filed row per player, rows filed before the day began) and blends with the seed `DOJO_CLOCK` (top-10 boards' 25th / 75th) by solve count, measured-only at 80 solves. Fixed per day, so finish verdict and board agree and archived days never re-score. The routes call `primeCircuitClocks` before `circuitScorer`; `/dojo` primes and passes `clocks` to the client.
- **Scoring:** out of 100, Sixes 25, Suds 35, the variant 40 (each form worth more than the last); each half solving, half speed
  (speed 1 at PAR, 0 at CAP, PAR = fastest tenth of solves, CAP = 75th percentile, measured
  2026-09-17 to 10-11; Cages' CAP held at an hour). A sudoku is right or not, so this is a race.
- **Belts:** Black 96, Brown 90, Purple 84, Blue 77, Green 70, Orange 62, Yellow 50, White.
- **The ten sudoku clients read `useRunEmbed()`** exactly as the five Judged clients do, and each
  carries a once-per-game `RunDoorPop id="dojo"` gated `!EMBED`.
- Files: `app/dojo/{page.js,DojoClient.jsx,leaderboard/page.js,card/route.js}`, `lib/dojo.js`.
  Pregame: paper doors that are the Start button and three hanging scrolls. Ending: a grading
  sheet scores form by form while the belt is dyed up the ladder, then the seal and the knot.
- **Same evening (owner, 2026-10-12):** Cages and Polka left the variant pool from 2026-10-13
  (`DOJO_POOL_BEFORE` keeps launch day's eight, mirrored as `slot.before` for the verifier);
  the rotating **Sudoku circuit was retired** (trophy row removed, `/circuits/sudoku` 308s to
  `/dojo`, categories and sets point at `dojo`, the family list is `SUDOKU_POOL` in
  lib/circuits.js); `SudokuCircuitPop` became `app/circuits/DojoPop.jsx`, shown two seconds onto
  the end card of ANY Sudoku-category game, once a day, unless the page is inside another run. It is
  mounted on the stage curtain branch too (it was missing there, so most players never saw it), waits
  for the flood to clear, and holds the hand-off countdown. NEWER players (visitor id under 14 days old,
  `isNewerVisitor`) also get up to four unplayed sudokus on the same card; with the Dojo done today they
  get only those. The pregame Dojo doors on the sudoku clients came out. Dojo is a `lead`
  circuit (5), so it sits with the other popular runs.

## Read the Room (`/room`): the daily crowd run (owner, 2026-10-13)

Outwit, Outrank and Feud back to back on one page, then a verdict on how well you read the
people in the room. Circuit id `room`, engine `room`, scorer `room`, `scoreFrom: '2026-10-13'`,
`lead: 6`, trophy `circuit-room` "Room Reader" (bronze, Users). Files: `lib/read-room.js`,
`app/room/{page.js,RoomClient.jsx,leaderboard/page.js,card/route.js}`.

- **Scored on WHERE YOU STAND, never on points.** The three games' points mean different things
  (Outwit /10, Outrank /12, Feud /500), so each room pays a third of 100 times the share of the
  other players in it you out-read: `beat = (field - rank) / (field - 1)`, alone in a room pays
  the whole third. Ranks are the crowd games' own registered-only standings, so the verdict and
  the circuit board can never disagree. Ladder (titles only, lowered 2026-10-16 because
  the typical player reads about half the room): Mind Reader 85, The Host 65, Life of the Party 40,
  Plus-One 25, Wallflower 10, Wrong Party 0.
- **The crowd APIs return `board.read: { rank, field }`** (`roomReadFrom`): a registered player's
  own rank, a guest placed as if registered, after everyone who scored the same or more.
- **IT MOVES (owner: "let it move").** The verdict shows at the finish as a reading of the room
  at that moment, says it is still filling, re-reads every 30s while the page is open (re-POSTing
  the saved answers, which the crowd APIs answer without filing a second row), and the next
  morning a card shows where the room settled and the final board rank.
- **Embedded like Judged and the Dojo**: each crowd client reads `useRunEmbed()`, hides its cap,
  finish card and tail inside the run, and reports `{score,total,read,field}` through
  `EMBED.onResult`. A played game is banked off its own `sot_<key>_<num>` save.
- **Between rooms the handover WAITS for Next** (owner, 2026-10-16): no countdown, the crowd's answers stay
  on screen until the player presses on. **The verdict's room tiles open the answers**: each tile is a
  button ("See results") that mounts that game below the tiles inside RunEmbed (onResult a no-op), so the
  game's own finished view shows what the room said. The $100 drawing card sits full width.
- **The door**: Outwit, Outrank and Feud each mount `RunDoorPop id="room"` on today's start gate
  (once per day). Placed in the home's lead circuits, MoreRuns (seven runs), the crowd category
  page and the sitemap.

## Skills: the second axis, and the entry page runs on it (owner, 2026-10-16)

Every live daily carries one or two SKILLS in `lib/daily-skills.js` (`SKILL_TAGS`, primary first):
Language, Mental math, Deduction, Spatial reasoning, Grid logic, Planning, Memory, Estimation, Focus
and speed, Reading people. **The categories do not change** (owner: they stay the same in name): they
still run the home shelves, page colours, archive, circuits and every scoring rule (End Game and
Arcade key off `cat`). Skills drive only the entry door (`app/EntryDoor.jsx`).

- **A skill tile opens a home pane, never a run** (owner, 2026-10-16: runs are only the developed
  circuits). Each skill names its `pane` (a category): Language Word, Mental math and Estimation
  Numbers, Deduction and Spatial reasoning Logic, Grid logic Sudoku, Planning End Game, Memory Trivia,
  Focus and speed Arcade, Reading people Crowd Psychology. The tile shows the count of live games that
  list that skill.
- **A NEW DAILY ADDS ITSELF TO `SKILL_TAGS` in the launch push.** `scripts/verify-skills.mjs`
  (found by verify-all) fails a live daily with no tag, an unknown skill, a skill listed twice, more
  than four skills, a skill with fewer than three live games, or a run that deals a played, dead or off-skill game.
- Reading people has three games and Focus and speed five, so both still fill a run but cannot rotate
  much. Use plain "sharpen" and "practice" in copy about skills, never claims of improvement.

## Runs sit in the puzzle grid as deck tiles, and in the list as rows (owner, 2026-10-19)

On a desktop, All Puzzles and every category or skill pane carry the day's runs
(`PILL_CIRCUITS` filtered as the pills were) in place of the run pills, in BOTH
views. TILE view: deck tiles in the same `.sty-games` grid (`deckGrid` in
app/today/StageToday.jsx), a button drawn as a small card stack in the run's hue
with a pip per game. Open runs lead and flow straight across like any tile (8 in
7 columns is 7 then 1, games following, never split evenly); a run finished today
goes to the very END of the grid, after the played games. The drawer (games in
play order, linked, and the way into the run) opens under whatever row its deck
sits on, found by walking the grid as CSS places it (a band heading takes a row
of its own). LIST view: `runRow` ledger rows in the ledger's columns, open runs
above the games and finished runs below them; a row opens the same drawer under
itself, and its Play chip is a link into the run. Full color fills an open deck
with `--phf` and dark ink like the game tiles. The phone keeps its runs block.
Mockup: canvas "Runs in the All Puzzles Grid", option D.

READER-FACING, CIRCUITS ARE CALLED RUNS (owner, 2026-10-19): the home index
button and pane heading, the footer, the /circuits page title and eyebrow, the
breadcrumbs, the roster/archive/category links and the trophy group all say
"Runs". The code, the ids and the /circuits URL are unchanged.

## The challenge card is ONE quiet card, and it carries send-back, run ranks and the group invite (owner, 2026-10-22)

`app/TicketDoor.jsx` is option A of the "Quieter Challenge Card" canvas: no animations, a ticket
stub with the count (a fraction is drawn small and raised by `StubCount`, so "35½" stays on the
stub), one headline, one line, one button, and a footer with the drawing terms. It is used by the
daily end card (`StageFinish`), every run (`RunChallengeButton`) and Polymath.

- **Send it back:** pass `vs = { name, res, mine, theirs }` when the player came in on a friend's
  link for this board. The headline becomes the result ("You beat Gator85, 78 points to 64 points")
  and the button reads "Send it back". StageFinish builds it as `duelVs`; RunChallengeButton
  builds it from `readChallenge` + `challengeResult`.
- **Run ranks:** `title` puts a run's earned rank on the card ("To beat: Brown belt · 84 of 100").
  `RunChallengeButton` falls back to `titleFor(gameKey, score)` when no `status` is passed, so the
  Gauntlets name their title; that same rank rides in the link's `x`. The /vs preview card prints
  `x` for questions-right runs too, except an old "N of 7 cleared" x.
- **Group invite:** `GroupInvite` in the footer shows "Invite a friend to <group>" only to a member
  (first group from `useGroupStanding`), sharing `/g/<code>` with the referral code on it.
- Do not add animations back or re-split the terms into their own lines: the owner called the old
  card too noisy.

## Two looks off the runs (owner, 2026-10-26)

The home, site pages and every daily page flip between **light with color** (`tint`) and **dark with
color** (`darktint`) only (`lib/stage-look.js`: `MAIN_LOOKS`, `mainLook`, `nextMainLook`). Stored
`color`/`plain` read as `tint` and `dark` as `darktint`, including in the pre-paint script in
`app/layout.js`. The gauntlet and run stages (Trivia Gauntlet etc.) keep all five looks on their own key
(`GAUNTLET_LOOK_KEY`); `StageTopBar` takes `allLooks` there. In those two looks `--stg-acc` is ink, so a
grid's selected cell must not use it alone: the crossword cursor (Emcee, Encore) takes `--sp-g`.

## The run finale: one centred screen, then the glide (owner, 2026-10-31)

Every run's fresh finish now opens on `app/RunFinale.jsx`, mounted BY `GauntletEndStage`
(app/GauntletScreens.jsx) when it is handed a `finale` prop, `sweep` is on, the run has a ladder
and motion is allowed. Approved on the "Run Ending Mockups" artifact (option A, the Ring). It
replaced the end page's own sweep + count-up + climb, Crossed Up's ripple curtain
(`curtainOn` is forced false) and, for the gauntlets, nothing else (they had no curtain since
2026-10-25).

- **Part one, the recap ring.** One arc per leg, sized by `finale.legMax[i]` (the gauntlets use
  the section's question count; Dojo `dojoWeight`, Crossed `crossedWeight`, Judged
  `lawCaseMaxFor`, Room the part, Price Check 10, Passport the leg's `max`). The ground takes
  each leg's colour in the Color look only (`pal.look === 'color' && !paper`); every other look,
  and Judged's white page, keep the page ground. The total counts up DEAD CENTRE (nothing else
  sits under it in part one). One-life runs (`oneLife`, the RunClient gauntlets) get the red
  miss tick; `legRanks` (RunClient only) draws "#14 of 218 on History today" under the ring.
- **Part two, the run's own title piece** (`FINALE_PIECE` in RunFinale): books (Trivia
  Gauntlet, Encore), flask (Science), calculator (Math), dictionary (English), belt (Dojo, belt
  colours from the ladder `chip`), name tag (Room), school letters (Judged, `short` + `chip`),
  wallet (Price Check, card colours), passport (Passport, `chip` cover + `vf` visa-free count),
  morning papers (Crossed Up). The ring clears, the score rises to the top, the piece climbs the
  ladder, then the title and standing land under it.
- **The glide.** Score, unit, title and standing fly to `[data-rf="score|unit|title|rank"]` on
  the desktop page (the title target is the earned rung's name in TitleClimb / FlaskClimb), or
  into the rolled bar `[data-rf="bar"]` on a phone (RunRoll starts rolled, `arrived`). While the
  finale plays the page underneath is `.gsx-held` (rises paused) and `.gsx-fly` (targets hidden);
  the glide releases the rises, the end hides the targets no more. The page arrives LANDED: no
  second count, no second climb.
- **Any tap or key skips to the glide.** Pop-ups (MoreRunsPop, GauntletMorePop, EncorePop,
  RunNudgePop) are hidden while `html.rfx-on` is set and show once the finale hands over.
- **Fresh finishes only.** Each client passes `finale` only when `doneAtLoad.current === false`;
  the gauntlets also on `?ending=1` (review). Practice passes never get it.
- **Adding a run:** pass `finale={{ key, legWord, legMax }}` on its GauntletEndStage and add its
  piece to `FINALE_PIECE` (anything unlisted gets the books).

## Sport and Deep questions carry a tag (owner, 2026-10-31)

`GauntletStage`'s kicker is a full-ink pill now (it was 12px at 42% ink and nobody saw it).
Deep shows its day topic as before. Sport shows its sport: NFL, NBA, MLB and Soccer from the
question's lane, and the "Everything Else" lane from `app/sport/sport-tags.js` (`SPORT_TAG`, one
entry per question id; F1, Snooker, Olympics, College football...). `sportTagFor(q)` never gives
the answer away: a question that asks which sport it is, or whose choices contain the sport (for
a lane, a choice that IS the lane), reads "Other sports" (or "Sports" for a lane). New Everything
Else questions read "Other sports" until they are added to the map. Both the Sport daily
(SportClient) and the runs (run page.js sets `question.sub`) show it.
