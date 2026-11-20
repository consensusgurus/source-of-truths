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

## Next phases (one page at a time, evenings, watch logs 15 minutes after each)

1. Home overall leaderboard and the leaderboard page read `/api/boards?name=overall`, show `asOf`.
2. Rebuild the end card around `game-<quizId>` plus the client-merged own row; drop day and
   category ranks from it.
3. Run end screens read `circuit-<id>` with the own row merged in.
4. Retire the per-visitor `daily-combined` / `board` / `daily-me` calls those pages made; then
   measure function CPU, memory and invocations against the 2026-11-20 baseline.

Do not move routes off the full-table cache by other means: see the 2026-11-20 incident in
platform.md.
