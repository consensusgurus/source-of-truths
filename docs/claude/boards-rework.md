# Prebuilt boards rework (owner, 2026-11-20)

## Why

Every server instance loaded the whole quiz_results table (645,000 rows, ~4.5s, hundreds of MB)
to compute leaderboards that are the same for every visitor. `daily-combined` and `board` were
about 45% of function CPU and 38% of calls in a 12-hour sample (2026-11-20). Estimated saving once
pages read prebuilt boards: about $60 to $85 a month of a ~$200 Vercel bill, plus a much lighter
database (Micro, near its Disk IO budget) and faster home and end screens.

## How it works (phase 1, live 2026-11-20, nothing reads it yet)

- `app/api/cron/boards` runs every 2 minutes (vercel.json). It builds, with the SAME code the live
  routes use, so a prebuilt board equals the live no-identity answer:
  - `overall`: the day's board, `daily-combined?all=1&top=30`
  - `circuit-<id>`: each DISPLAY_CIRCUITS run, `daily-combined?circuit=<id>&all=1&top=30`
  - `game-<quizId>`: each of today's puzzles, `summarize()` from `/api/quiz/board`
- Each board is one stored object in the `results-snapshots` bucket under `boards-v1/`
  (lib/boards-store.js). Only boards whose content hash changed are rewritten; `boards-v1/index`
  holds the hashes, the run time and any errors.
- `GET /api/boards?name=<board>` serves one board (CDN 60s, memory 60s). It never touches
  quiz_results. Every response carries `asOf` (epoch ms): the board's last confirmed-current time.

## Owner rulings (2026-11-20)

- The home page shows the overall leaderboard from the prebuilt board, with an "as of 9:54" time.
  The leaderboard page does the same.
- The END CARD shows only the puzzle just played: the player's result and that puzzle's standings.
  The overall (day) rank and the category rankings come OFF the end card.
- END SCREENS MUST BE REBUILT for that smaller set of information, not just rewired.
- The player's own fresh result is merged into the prebuilt board on the client, so they see it
  at once (keeps the 2026-11-13 rule: own score right after finishing, without errors).

## Switched over

- 2026-11-20: the desktop home's right-rail day board (All Puzzles tab) reads `overall`, with "as of"
  beside Everyone; the reader's own row comes from the board the page already fetched (`board.me`).
  Falls back to the live read when the stored board is missing, over 10 minutes old or another day.
  Category tabs still read live (no prebuilt category boards).
- Owner rulings later that morning: end screens show ONLY that puzzle's standings. Keep the group
  standing on that puzzle and Vs your <weekday>; delete the All-Time tab, the Today's Puzzles pill and
  the category boxes. Phone Full Results: show the rank once (no second set of boxes) and move Show
  Board below the standings. Mockups: https://claude.ai/artifact/9eZ5UsdbQxDMD9S2dABjqn

- 2026-11-20 (second push): END SCREENS SHOW THAT PUZZLE ONLY. StageStick draws `viewRows` (the
  game row) everywhere: no Today's Puzzles pill, no category / Today's Puzzles / All time tabs, no day
  rank on EndDay, EndNext or the standing GIF caption. `standRows` (game + category + day) still feeds
  the next-play picks, so the two daily-combined reads in usePuzzleStandings STAY until the picks come
  from a prebuilt board. Phone (StageRoll): standings open right under the bar, its chips hide while
  open, Show Board sits below. Runs: useRunStandings RUN_ONLY = true, so the day and category reads
  (fresh=1, uncached) are gone; GauntletScreens shows the run's own card from one row.
- Home rail header: "#70 of 88" (no "You"), the as-of time small at the end. Everything Else order:
  community first (Community, Post-Game Talk, Groups, Loft Shop, Puzzle Peers), then Quizzes, Runs,
  Build a Run, then the rest; same on the phone tiles and the puzzle-page sidebar.

- 2026-11-23 (data audit, docs: claude/data-usage-audit-2026-11-23.md in the Mind Loft project):
  - `runs` board: the cron writes every run's tile figures (players, site leader, doneAts) for today,
    plus yesterday's doneAts (computed once per day, carried forward, a failed run retried). The home
    reads it once instead of 16 public per-run reads and 16 yesterday reads. Falls back to the old
    per-run reads when missing, over 10 minutes old or another day.
  - `/api/quiz/run-stats?ids=..&group=..&<identity>`: the reader's own and group run figures in ONE
    read, by calling daily-combined's GET in process per run (same output as the per-run reads, one
    instance instead of up to 16 cold ones). Group members now also get today's finish times from
    `runs`, which the group payload never carried.
  - `/api/boards?name=overall&part=overall`: the rail's slim read (no games, pool, overallAll).
  - `/api/quiz/totals?view=home` (day figures only) and `?view=leaders&ids=` (permanent picks);
    `/api/quiz/recent?limit=150` on the home; `/api/quiz/me?ids=0` from app/quizMeClient.js (no
    playedIds/completedIds; /quizzes and Stat Hub fetch the full profile themselves) and an in-flight
    join so a second identical read never fires while the first is on the wire.

## Next phases (one page at a time, evenings, watch logs 15 minutes after each)

1. Home overall leaderboard and the leaderboard page read `/api/boards?name=overall`, show `asOf`.
2. Rebuild the end card around `game-<quizId>` plus the client-merged own row; drop day and
   category ranks from it.
3. Run end screens read `circuit-<id>` with the own row merged in.
4. Retire the per-visitor `daily-combined` / `board` / `daily-me` calls those pages made; then
   measure function CPU, memory and invocations against the 2026-11-20 baseline.

Do not move routes off the full-table cache by other means: see the 2026-11-20 incident in
platform.md.

## Up Next picks from the day board (2026-11-20)

The puzzle ending's Play Similar / Switch Gears picks no longer cost two uncached
`/api/quiz/daily-combined` reads per finish. The cron requests the overall board with
`pool=1`, so `boards-v1/overall` carries `pool`: per game `{key, plays, named, solved,
clocks, secs}`. `usePuzzleStandings` (app/WhereYouStand.jsx) prices the picks on the client
with `lib/pick-pool.js`, a copy of the route's picks loop (same floors, sibling rule, ladder,
nearest-relative extras). **Change the two together.** If the board is missing, older than
15 minutes or another ET day, the hook falls back to the old two live reads. The picks no
longer carry `after` (a day-board rank), so the "moves you to #N in Today's Puzzles" lines
drop out, which matches the puzzle-only ending ruling.
