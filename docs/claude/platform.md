# Platform and plumbing

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Platform and plumbing: registry key vs route, data caching layers, durable result posting, PWA/identity, deploy skew, SEO/noindex, share-card routes, admin desk, newsletter, archive

## No tab stays on an old deployment (owner rule, 2026-10-27)

Owner report: "initial load of page shows an old version ... all over the place." Measured on the live
site that day, **the HTML is never the stale part.** Every daily, `/`, `/today` and `/trivia` are served
`private, no-cache, no-store`; quiz and list pages `public, max-age=0, must-revalidate`; `/public` art
`max-age=0, must-revalidate`. A real page load always gets the live build. What goes stale is a tab
that was ALREADY OPEN when a deploy landed:

- a tab left open on a laptop, or a phone tab Safari restores from memory,
- **the installed home-screen app**, which resumes for days without ever reloading,
- a page restored from the back/forward cache.

From there every in-app link is a client-side navigation, and **Vercel Skew Protection is ON** (every
asset carries `?dpl=dpl_...`), which routes an old tab's navigations to the OLD deployment on purpose,
chunks and server render both. So the tab shows the old site page after page until a hard refresh.
Next 14's client router cache made it worse: it replayed a page's payload for 30s (dynamic) or 5 min
(static), so going back to the home after a game showed the pre-game home.

### The mechanisms (all shipped 2026-10-27)

1. **`app/VersionGuard.jsx`, mounted in `app/layout.js`.** `next.config.js` inlines the commit sha as
   `NEXT_PUBLIC_SOT_BUILD`; `/api/version` (edge, `no-store`) reports the live one. The guard checks on
   mount, every time the tab returns to the foreground, on a bfcache restore, and every 5 minutes. On a
   mismatch: a RESUMED page reloads at once; otherwise the next in-app link becomes a full page load,
   and a `router.push` that slips past is reloaded on arrival.
2. **It never reloads under a game in progress.** `useAbandonFlush` registers a probe in
   `window.__sotInPlay` (true while it would post an abandon row), and the guard checks it before every
   reload. A reload mid-game would fire `pagehide` and file the attempt as abandoned. A link clicked
   mid-game navigates softly as before, and the page it lands on (where the game has unmounted) reloads.
3. **Loop guard:** one reload per target build per two minutes (`sessionStorage.sot_vg_reload`), so a CDN
   that has not caught up cannot bounce a page.
4. **`experimental.staleTimes: { dynamic: 0, static: 30 }`** in `next.config.js`: a soft navigation always
   asks the server. Back/forward is still instant.
5. `ChunkReload.jsx` (2026-09-23) stays: it is the backstop for a chunk that has gone missing outright.

### Rules

- **NEVER add a service worker or Cache Storage**, for a PWA, offline mode or "speed". On a site that
  deploys this often it is the classic way to serve last week's site forever.
- **Never set a browser cache lifetime on a page** (`Cache-Control: max-age>0` on HTML, in `headers()`, a
  route, or middleware). Hashed `/_next/static` assets are already immutable; pages must revalidate.
  `s-maxage` (CDN) on an API is fine, because a deploy empties the CDN.
- **Do not raise `staleTimes`** or remove `VersionGuard`, its `/api/version`, or the `__sotInPlay` probe.
- **A new game board that is not built on `useAbandonFlush` must register its own probe** in
  `window.__sotInPlay` (a function returning true while a round is live), or the guard can reload a page
  under a player.
- **Never compute "today" or any versioned state during render** (that is the hydration flash, a
  different bug, handled by `HydrationMark.jsx`): read it in an effect.
- **Diagnosing "I see the old version":** first ask whether it was a tab already open or the home-screen
  app. A cold load from a new tab is always live; if it is NOT, check the response headers before
  touching any code.
- `node scripts/verify-freshness.mjs` (picked up by `verify-all`) fails if any mechanism above is removed,
  if a service worker appears, or if `headers()` puts a browser cache lifetime on anything.

## THE REGISTRY KEY IS NOT THE ROUTE NAME, and two games differ (owner bug, 2026-08-17)

Every per-game lookup on the site keys off the **registry key** in `lib/daily-games.js`, which is
also the quiz-id prefix (`park-8-17-26`) and the localStorage namespace. It is NOT the folder name,
the route, or the reader-facing name. For 63 of the 65 dailies all four happen to be the same word,
so passing the wrong one is invisible. **Two games are exceptions**, both because they were renamed
after launch while deliberately keeping their original key:

| Game | Registry key | Route / folder | Reader-facing name |
|---|---|---|---|
| Parker | **`park`** | `/parker`, `app/parker/` | Parker |
| Jesters | **`jester`** | `/jesters`, `app/jesters/` | Jesters |

**A wrong key does not throw, it returns an EMPTY ANSWER**, which is why this shipped and sat there.
`/api/quiz/daily-game` bails on `if (!DAILY_KEYS.includes(game)) return none`, and `none` is
`{ field: 0, plays: 0, myRank: null }`; `DAILY_GAME_MAP[key]` on an unknown key is `undefined`, so a
category lookup resolves to `cat: null` and reports itself `ready`. Both render as a dash next to a
plausible-looking label, so the card looks finished and is simply wrong. Found on the Parker end
card reading "**—** of **0** Parker all time" and "**—** category today"; `useGameAllTime({ game:
'parker' })` and `useCategoryRank({ self: 'parker' })` had been wired with the route name, and
Jesters carried the identical bug with `'jesters'`.

**When adding or touching ANY per-game hook, prop or API call, pass the registry key.** As of
2026-08-17 the consumers are `useGameAllTime({ game })`, `useCategoryRank({ self })`,
`useNextUnplayed({ self })`, `useUnplayedSimilar({ self })`, `useIqStanding({ game })`,
`DailyBoardPanel self=`, `hintAllowed`/`spendHint`, `dailyAttemptRule`, `endGamePlan`, `dailyDept`,
`hasSundayEdition`, and every `/api/quiz/daily-*` route. The cheap audit, which is worth running
after any batch that touches the clients:

```bash
grep -rhoE "useGameAllTime\(\{ game: '[a-z]+'" app/*/*.jsx | grep -oE "'[a-z]+'" | tr -d "'" | sort -u > /tmp/used.txt
grep -oE "key: '[a-z]+'" lib/daily-games.js | sed "s/key: '//;s/'//" | sort -u > /tmp/keys.txt
comm -23 /tmp/used.txt /tmp/keys.txt   # anything printed is a dead key
```

A new game should be named so its key, folder and route match, precisely so this cannot recur.


**The failure is not always a visible dash.** `useNextUnplayed` / `useUnplayedSimilar` look the game
up with `DAILY_GAMES.find((g) => g.key === self)`; a wrong key makes `mine` null, so the
same-category preference silently dies and the player is offered a random unplayed daily instead of
another from the category they just played, AND the `g.key !== self` self-exclusion stops excluding.
`useIqStanding({ game, quizId })` gets away with it only because `quizId` is the primary matcher and
the `game` prefix test is a fallback. `isLoft` is the one caller that is safe by design: `lib/loft.js`
carries a `ROUTE_TO_KEY` map built off the registry's `href` overrides. Do not rely on that map
elsewhere, it is local to the Loft flag.

## Quiz data reads: the three caching layers (built 2026-08-01)

Every hot quiz route answers a question about ONE player or ONE day, but the
data all lives in `quiz_results` (33,800 rows and growing). Three layers sit
between a route and that table. Know which one you are touching.

**1. `lib/quiz-results-cache.js` — the whole table, per lambda.** Used by the
routes that genuinely need every row (`me`, `player`, `xp`, `xp-categories`,
`totals`, `recent`, `share-card`, `day-card`, `iq-standing`). A warm instance
runs an exact-count HEAD plus a delta of rows newer than its newest, so steady
state is near-zero egress. `{ force: true }` skips the burst TTL AND refuses to
join a refresh that started before the call, which is what makes a just-finished
player's own row visible.

**2. `quiz_results_snapshot` (migration 44) — the whole table, shared.** The
cold path. Layer 1 alone meant every route paged the table independently on a
cold deploy: measured 16.2s / 12.7s / 12.5s / 12.5s / 11.3s across five routes
at once, ~200,000 rows of concurrent egress for one page load. Paging strategy
cannot fix work duplicated across processes (parallel OFFSET paging made it
WORSE, 17.4s, because `.range()` is OFFSET pagination and Postgres walks and
discards `offset` rows per page). So the row set is persisted as one gzipped
JSON blob: 8.16MB of JSON becomes 0.38MB gzipped, 0.50MB base64, decoding in
29ms. A cold instance reads that row and asks only for ids above it. Written by
whichever request does a full load, refreshed at 30 minutes old or 2,000 rows
behind, two newest rows kept. It caches ROWS, never a derived figure, so no
scoring can drift. Every read and write is wrapped: if the table is missing the
code falls back to a plain keyset load.

**MOVED TO SUPABASE STORAGE (2026-10-06), and the table is retired.** By October
the blob was ~5MB and every refresh inserted a new 5MB row and deleted the old
one. pg_stat_statements put that insert + delete at ~29GB of WAL and ~2.5M
written blocks since May, against under 1GB for every real write on the site,
and it drained the project's Disk IO budget (Supabase warning email). The
snapshot now lives in the private bucket `results-snapshots` as
`<name>.json.gz` plus a tiny `<name>.meta.json` (`lib/results-snapshot-store.js`,
names `quiz-results` and `admin-results`), refreshed at 6 hours old or 10,000
rows behind. Admin routes that rewrite rows call `dropStoredSnapshots`. **Never
put a large or frequently rewritten blob in a Postgres row again**: every
rewrite is a full TOAST copy plus WAL, and Disk IO is the scarcest resource on
this project's compute tier.

**3. `lib/quiz-derived-cache.js` — the computed state, per lambda.** Layers 1
and 2 stop the re-FETCHING; this stops the re-DERIVING. `computeXp` sorts and
walks every row to build every player's IQ Points and `computeTrophies` walks
them again for all 34 trophies, per request, to answer a question about one
person. Memoized on a fingerprint of the row set (length + max id, so deletions
invalidate) plus the options that change the output, with `Date.now()` bucketed
to the minute so the clock-dependent 7/30-day windows do not make every key
unique. **The returned `players` map is SHARED ACROSS REQUESTS: treat it as
read-only.**

**Day-scoped reads use `lib/daily-results-cache.js` instead**, the same
count+delta design filtered to one day's quiz ids via the `quiz_results_quiz`
index. `/api/quiz/daily-me` answers the end card's question (one game's rank,
plus the day's completion set) and `/api/quiz/daily-combined` builds the full
combined board; the day's slate is shared in `lib/daily-slate.js`.

**Rule of thumb when adding a route:** if it needs one day, use
`loadDailyResultsCached`. If it needs one player's standing in one game, call
`/api/quiz/daily-me` rather than the combined board. Only reach for
`loadQuizResultsCached` when the answer genuinely depends on every row, and if
you then derive XP or trophies from it, go through `quiz-derived-cache` so the
work is shared.

### The IQ field and request deadlines (Vercel cost fix, 2026-10-27)

Measured that day: 24h of `/api/quiz/iq-standing` was 4.1K calls, **8 hours of
Active CPU and 57-60% of calls dying at "Task timed out after 300 seconds"**,
with daily-me, board, daily-save, daily-combined and me timing out too. Each
timeout held an instance and its memory for five minutes, which is the Fluid
Provisioned Memory jump on the bill. Supabase itself answered everything in
under 3s, so the stalls were on our side: oversized instances (quiz_results had
grown to ~305k rows, nine times the size the per-instance IQ snapshot was
designed for, and every instance held a full-history copy of it per `recentN`)
and promises with no deadline. Four rules came out of it:

1. **Every Supabase request has a deadline.** `lib/supabase-server.js` passes a
   `fetch` with `AbortSignal.timeout` (20s, 45s for Storage). Never create a
   server client without it.
2. **No cache refresh can wedge an instance.** `quiz-results-cache` and
   `daily-results-cache` race each refresh against a deadline and serve the rows
   they hold past it; a forced read queues at most 8s behind an older refresh.
3. **The IQ field is built ONCE, by `/api/cron/iq-field` every 10 minutes**, and
   stored compressed in Supabase Storage (`results-snapshots/iq-field-v1.json.gz`,
   never a table row: a big row rewritten every 10 minutes is the Disk IO trap). Instances download it
   only when a newer copy exists, and build it locally only if it is missing,
   older than 25 minutes or from an earlier ET day. It holds every player's
   TOTALS and per-category totals, trophies and today's gain, never a play list.
   The asker is still recomputed fresh from their own rows, so their own figures
   are live and everyone else is at most ~10 minutes old.
   `iqSnapshot` / `iqPlayersFresh` are **async** now. Routes on it: iq-standing,
   me (except `full=1`), daily-status, day-card, xp, xp-categories. Equivalence
   with the old per-instance snapshot was checked on synthetic data (ranking,
   fresh player, profile, trophies, day standings, every category board: zero
   diffs).
4. **`vercel.json` caps `app/api/quiz`, `challenge` and `groups` at 60s.** A
   route that genuinely needs longer must export its own `maxDuration`.
5. **A request never waits on Storage for the field once its instance holds
   one** (stale-while-revalidate in `getIqField`); a cold instance waits at most
   4s + 12s, then builds locally.
6. **Measured at production scale (305k rows, 16.6k players), the whole-site
   build was 19s and 1.3GB RSS** before two fixes: `etTodayISO` (lib/daily-games)
   built a new Intl formatter per call and the trophy pass hit it ~2.7M times,
   so it now reuses one formatter with a 1s cache; and `computeXp` takes
   `recentSinceMs`, so the field keeps only today's plays as `recent`. Live cron
   after both: load 2.2s, build 6.8s, write 2.5s, payload 1.5MB gzipped.
   **Any per-instance pass over every row of quiz_results now blocks an
   instance for tens of seconds and freezes every request sharing it.** That,
   not Supabase, is what the 300s timeouts were. Put such work in a cron.
7. **After a deploy, check that the field is fresh** (`/api/cron/iq-field`
   reports its age when it skips). A deploy that lands while the stored field is
   older than 25 minutes makes every cold instance build its own, which is a
   burst of 60s timeouts (seen twice on 2026-10-27 while the cron was failing).

---

## Opening a game is not starting it: t0 is the started signal (owner rule, 2026-08-10)

A daily game is "in progress" only once the player has actually MOVED. Clicking into a
game and leaving is not a start, and must not put the row into the paused block on the
slate.

The trap is that the save file says otherwise. Every daily client seeds its state as
`{ ..., t0: null, status: 'playing' }` and persists it in an effect that runs as soon as
hydration finishes, so merely loading `/<game>` writes `sot_<key>_<num>` with
`status: 'playing'` and no interaction of any kind. **A save whose status is 'playing'
therefore proves nothing.** `DailyStrip`'s per-puzzle detection read status alone and
labelled every game the player had merely opened today as paused (owner report: clicked
into Docket, never pressed start, got an in-progress label). Fixed 2026-08-10 by gating
the 'playing' branch on `sv.t0`.

- **`t0` is the signal, and it is universal.** All 55 clients that seed `status: 'playing'`
  seed `t0: null` alongside it and stamp `t0: Date.now()` on the first real move; several
  name the state directly (`const preStart = playing && !g.t0` in `DocketClient`). Any NEW
  daily game must keep that contract, or it will report itself paused the moment it loads.
- **This is the same definition two other systems already use**, so do not invent a third:
  the `sot_<key>_day` breadcrumb is written only `if (done || g.t0)` and REMOVED otherwise,
  and `useAbandonFlush` files a row only once a real answer exists ("opening the page and
  leaving is not" a start).
- **Anything that reads a per-puzzle save must gate the same way.** As of 2026-08-10
  `app/DailyStrip.jsx` is the only reader outside the clients themselves; a second reader
  copying the old status-only test reintroduces the bug.
- **Do not fix this by making the clients write later.** The save has to exist from the
  first render for the archive and for crash recovery; the reader is what needs to be
  strict.

## Results post DURABLY: the ResultQueue retry (added 2026-08-02)

A finished game used to be recorded by exactly one fire-and-forget
`fetch('/api/quiz/result', { keepalive: true })` from the board, with no retry
and no record of a failure. If that request never landed (a second offline, the
tab closed mid-fetch, a 5xx), the play was lost from `quiz_results` FOREVER,
while the board's own localStorage save still showed the finished board. The
player then opens the puzzle and sees it completed, but `/daily`'s archive, the
leaderboard, and their IQ total all say they never played it. That is the bug a
player reported for Crux July 9 (every other Crux day 7/6 to 8/2 recorded, that
one missing entirely, board still solved on their device).

`app/ResultQueue.jsx`, mounted once in `app/layout.js`, wraps `window.fetch` and
watches ONLY POSTs to `/api/quiz/result`. A request that rejects or returns 5xx
is stashed in `localStorage.sot_result_queue` and retried on the next page load
and on the browser's `online` event. Rules that matter:

- **No duplicate rows.** Before re-posting, the queue asks `GET /api/quiz/result
  ?quizId=&anonId=&email=` (which matches `user_id` OR `anon_id`) whether this
  identity already has a stored attempt; if so the queue entry is dropped. That
  covers the case where the row landed but the response was lost.
- **Abandon rows are never queued** (`abandoned: true` is skipped). They post on
  pagehide via sendBeacon, and replaying one later could file an "abandoned" row
  for a game the player went on to finish.
- **4xx is not retried** (the server rejected that payload; a retry cannot fix
  it); entries expire after 7 days or 8 attempts, and the queue holds 25 items,
  one per quizId (newest finish wins).
- Because it patches fetch centrally, **every board gets this for free** - do
  NOT add per-board retry logic, and keep posting results with a plain
  `fetch('/api/quiz/result', ...)` carrying a JSON string body, which is what the
  wrapper recognises.

Known remaining gap, worth fixing if it ever surfaces: `/api/quiz/daily-status`
resolves the player to `u:<id>` when an email resolves and then ignores rows
carrying only this browser's `anon_id`, so a play made as a guest and never
claimed stays invisible in the archive. `GET /api/quiz/result` already matches
either key and is the model to follow.

## First-visit funnel, guest claim band, and the site install prompt (2026-08-20)

Three onboarding/account surfaces, all client-only (server renders null, everything decided in
effects, per the readRunParam rule):

- **`app/WelcomeOverlay.jsx`** (mounted in `app/page.js`): a one-time welcome for a browser with
  NO play footprint, funneling straight into today's Daily Five via `fiveHref` (falls back to the
  Spatial circuit when `fiveFor` returns []). Returning-player detection is POSITIVE signals only
  (`sot_quiz_identity`, any `sot_<key>_day` breadcrumb, any per-puzzle save) because
  `sot_quiz_anon` is minted on first paint and proves nothing. Shows once ever, keyed
  `sot_welcome_seen`, written the moment it renders. `?welcome=1` forces a preview without
  writing the key.
- **Guest claim band in `app/LoftFinish.jsx`**: a guest's FULL end card carries the canonical
  `JoinLeaderboardForm` inline (collapsed band; the first guest finish auto-opens it, keyed
  `sot_claim_nudged`, consumed only when the band actually renders). The run card and fast-retry
  panel stay minimal by design and never render it; DailyEndCard was deliberately not touched
  (LoftFinish is the live surface). ⚠️ The form's inline ink reads `--join-*`, which `.loft-page`
  sets to navy-ground values while this card is WHITE, so the wrapper resets them to light-page
  values; removing that reset ships a white-on-white heading.
- **`app/InstallPrompt.jsx`** (homepage): install card for ENGAGED visitors (identity or a day
  breadcrumb, the opposite audience from the overlay, so the two never stack). Chromium uses the
  stashed `beforeinstallprompt`; iOS gets an Add-to-Home-Screen sheet; one dismissal
  (`sot_install_dismissed`) or a completed install retires it. `?install=1` forces a preview.
  **There is deliberately NO service worker**: modern Chrome does not require one for
  installability, the per-game installs already work without one, and a SW cache on a site that
  deploys this often is a staleness risk with no payoff. Do not add one as a side effect of a
  future PWA change.

### PWA installs carry the player's identity through the manifest (2026-08-21)

**The bug this fixes (owner report, day after the install prompt shipped): adding the site to the
home screen SIGNED THE PLAYER OUT with no way back.** An iOS home-screen web app runs in its own
storage partition, with different localStorage AND cookies from Safari, and the entire identity is
localStorage (`sot_quiz_anon` + `sot_quiz_identity`). So the installed app opened as a stranger,
re-joining hit `username_taken`, and a name-only account had NO self-service path back at all
(the 409's own advice, "add the email you signed up with", is a dead end without an email).
Android shares the Chrome profile's storage, so this was iOS-specific.

The fix reuses the domain-move handoff machinery; the one channel that crosses the partition is
the URL baked into the manifest's `start_url`, which browsers read at install time:

**v3 (2026-08-21, final): the manifest link is set in SERVER METADATA, nothing else works.**
Two client-side attempts failed the same day and are documented here so nobody repeats them:
v1 swapped the link href post-hydration in VisitorBeacon (Safari resolves the manifest from the
link present at load, so a user who deleted and re-added the app was still signed out), and v2
rewrote it with a parse-time inline script (React OWNS the metadata-rendered <link>, so hydration
re-applied the original href and quietly reverted the rewrite; the homepage link also streams in
AFTER body start, so the script often ran before the link even existed). The rule that falls out:
**anything that must be true about the manifest link must be expressed in Next metadata, never in
client JS.** Helpfully, Next emits `crossorigin="use-credentials"` on manifest links by itself,
which is what puts the `sot_vid` cookie on the manifest fetch.

- **Root `app/layout.js` sets `metadata.manifest = '/api/pwa-manifest'`.** The old file-convention
  `app/manifest.js` was DELETED (a file route outranks config metadata, and its link points at a
  static manifest that cannot mint). The manifest OBJECT moved to `lib/site-manifest.js`;
  `public/manifest.webmanifest` is a static mirror so stale cached HTML that still links the old
  URL keeps a working (token-less) manifest.
- **Every game page's `metadata.manifest` is `/api/pwa-manifest?game=<key>`** (key = the public
  manifest FILENAME, so jesters uses `game=jester`). A NEW game page must do the same; linking a
  static `/<key>.webmanifest` ships installs that sign the player out.
- **`/api/pwa-manifest`** (GET) mints the `_ml` handoff token ITSELF from the `sot_vid` cookie at
  the moment the engine fetches the manifest (install time on Safari) and bakes it into
  `start_url`. `PWA_TTL_MS` = 60 days (`mintHandoff` takes an optional ttl; the redirect handoff
  keeps its 5 minutes); `adoptable()` still gates the claim, so later launches no-op. No `game`
  param = the root manifest object; `?game=<key>` fetches `public/<key>.webmanifest` and patches
  it, keeping the game's id/name/icons so an existing install updates in place. Always `no-store`.
- **`/api/identity/claim` resolves the ACCOUNT** the anon belongs to (`quiz_users` by `anon_id`,
  falling back to `quiz_results` attribution because `anon_id` on the user row only records the
  first browser) and returns `{ id, username, email }`. `VisitorBeacon.claimHandoff` writes
  `sot_quiz_identity` when the claim resolves an account and the browser holds none, then
  **reloads once** so the app renders signed in (components mounted before the async claim and
  read empty storage). Loop-safe: adoption clears the freshness stamp. The claim route moved from
  edge to node runtime for the supabase client; only the minting middleware must stay edge.
- **Diagnostics in Vercel function logs:** `[pwa-manifest] {game, cookie, minted}` on every
  manifest fetch and `[identity-claim] {valid, account}` on every claim. On the next
  install-signout report these two lines say whether the fetch carried a cookie, whether a token
  was minted, and whether the launch claimed it. Tokens are never logged.

Verifying: the RAW HTML of `/` and any game page must show
`<link rel="manifest" href="/api/pwa-manifest[?game=<key>]" crossorigin="use-credentials">`, and
the DOM must still show it after hydration settles. A credentialed fetch of the route must return
`start_url` carrying `_ml=`; an uncredentialed one degrades to the plain manifest. Installs made
BEFORE v3 are stranded (their frozen start_url has no token): the player deletes the icon and
re-adds it from Safari, or goes through SigninHelp.

## Groups: a private daily board for the people you play with (owner, 2026-09-17)

A player starts a group, shares one link (`/g/<code>`) or a five-letter code, and
everyone in it gets a private daily board, per-game boards, member stats and a
two-week history at `/groups/<code>`. `/groups` lists the reader's groups with
today's place in each, a code box and "start a group". The home cap links to it.

**A GROUP IS A LENS, NEVER A SECOND SCORING PATH.** Nothing about a result is
stored. `/api/quiz/daily-combined?group=<code>` runs the same `scoreGame`, the
same ladder, the same crowd recomputes and the same day freeze as the site
board, then keeps only the members (`groupPayload` in that route). The daily
order is the site's own daily points; a game's order is that game's own rank.
So a group can never disagree with the site about a result. A group board names
its members, so it is cached `private` only, never at the shared edge.

- **Tables (migration 56):** `quiz_groups` (id, code, name, owner_id) and
  `quiz_group_members` (group_id, user_id, role). RLS on, no policies, service
  role only, exactly like `quiz_users`. **Every read tolerates the tables being
  absent** and the pages say "Groups are being set up" rather than offering
  controls that cannot write.
- **Members are accounts.** A guest joining from a link gets the same name-only
  account `/api/quiz/join` makes, so every member has a `user_id` and every
  board row keys as `u:<id>`. The join bar is pre-filled with a suggested name
  (`suggestName`, always 15 characters or fewer), so joining is one tap.
- **The rules live in `lib/groups.js`:** 50 members a group, 5 groups a player
  (made or joined), codes from an alphabet with no 0/O/1/I/L. An owner leaving
  hands the group to the longest-standing member; the last member leaving
  deletes it; the owner cannot be removed; a new code retires the old link.
  Only the owner renames, removes or resets.
- **History** (`/api/groups/<code>/history`) is fourteen day boards read through
  the same route and summed, never earlier than the day the group was made.
  Nothing is stored for it either.
- **Not built in v1 (owner's open questions):** a "nudge" to members who have not
  played (needs email sending), approval before joining, and group lines on the
  game finish card.
- **Gate:** `node scripts/verify-groups.mjs` runs the data layer against an
  in-memory PostgREST stand-in (no database, no env). Confirmed to fail when the
  member cap or the last-member delete is broken.
- **Sign up and join in one step (2026-09-17).** A guest on a group page gets
  `app/groups/SignupJoin.jsx`: name (pre-filled), optional email, and a "New
  here / Already signed up" switch. Both sides are the same `/api/quiz/join`
  request, which signs a returning player in, and the page action (join, or
  create on `/groups`) runs straight after. Account errors show `SigninHelp`;
  a missing group name is checked before any account is made (`precheck`).
- **Admin: Groups tab** in `/admin`, fed by `/api/admin/groups` (admin cookie
  only): totals, every group with owner and size, and the latest joins.

## The quiz tail is NOINDEX, and indexability lives in lib/quiz-seo.js (Search Console pass, 2026-09-20)

The quiz sitemap segment submitted **1,853 URLs**. Over the 90 days to 2026-09-20 those
pages earned **12 clicks** between them, 206 of them earned a single impression, and **136
of the site's 175 "Duplicate without user-selected canonical" pages were /quiz/ URLs**.
Meanwhile the 95 game URLs, which are 5% of the sitemap, took 605 of the site's 725 clicks
at a 27% CTR. The tail was spending the crawl budget of the pages that convert.

The cause of the clustering was the empty server render fixed on 2026-09-17 (see
QuizStageShell): until then every quiz page shipped the same near-empty body, so Google
had ~1,850 identical documents. The shell fixed the render. It did not make a page whose
unique text is a title plus a blurb worth indexing.

**`lib/quiz-seo.js` is the one place that decides.** A quiz stays indexable when it has
either DEMAND or INVESTMENT: an impression in the observed window, a curated hero in
`QUIZ_HEROES`, a place in the QOTD pool or overrides, a `COMPANY_META` entry, or a
Business News hub pattern (news recap, `-NqNN-earnings-quiz`, `-sector-update`). That is
**451 of 1,853**; the other 1,402 render `robots: { index: false, follow: true }` and are
dropped from the sitemap. Total sitemap URLs went 2,598 to 1,196.

- **noindex, not 404 and not a redirect.** The pages are real and worth playing. They stay
  linked from `/quizzes/all` and stay in `catalogQuizzes()`, so `follow` keeps their links
  flowing. Only the index entry goes.
- **Never re-inline the filter.** `lib/sitemap-entries.js` and `app/quiz/[id]/page.js` both
  read `quizIndexable()`, the same invariant `lib/quiz-catalog.js` keeps for the
  sitemap-and-index pair. A sitemapped quiz URL cannot exist without an indexable page.
- **It is not permanent and not a blocklist.** Hero a quiz, add it to the QOTD pool, or give
  it real content, and it is indexable again on the next deploy.
- **Refreshing the observed set:** read the /quiz/ rows out of the Search Console page
  report over 90 days, drop the dated daily-game stubs (they canonicalize to their game
  page), and replace `OBSERVED`.

## Share-card routes are ASSETS: noindex them, never Disallow them (2026-09-20)

All five of Search Console's "Server error (5xx)" rows were share-card routes
(`/opengraph-image`, `/twitter-image`) crawled 10 to 15 Sep. The cause was the Satori fonts
missing from the function bundle, fixed by `outputFileTracingIncludes` in c3b2ee18c on
2026-09-17, i.e. after those crawls. Three things on top of that fix:

1. **`X-Robots-Tag: noindex` via `headers()` in `next.config.js`** on `opengraph-image`,
   `twitter-image`, `share-image` and `poster-image`. **Do NOT use a robots.txt Disallow
   for this.** Facebook and LinkedIn honour robots.txt when they fetch `og:image`, so a
   Disallow would cost link previews. A header keeps them fetchable and out of the index.
2. **A singleton card that is already baked has no dynamic route.** `public/og/` carries
   brand, daily, lists, quizzes and every game card (`scripts/bake-og.mjs --site`), so the
   routes beside them were paying for a Satori render of a picture already on disk. The
   root, `/daily`, `/lists`, `/quizzes`, alibi, shoe, span and sweep routes are deleted and
   their metadata names the file. **Delete both kinds together**: `twitter-image.js`
   re-exports the OG route's default, so removing one alone breaks the build.
3. **A per-item card falls back, it does not throw.** The quiz, list, circuit, run, kids,
   player and contest routes cannot be baked (2,400+ of them), so each wraps its render in
   try/catch and 302s to the matching `public/og/` card on failure. A generic share image
   beats a 5xx.

## A dated game stub canonicalizes from the REGISTRY, not a hand-kept map (2026-09-20)

`GAME_URLS` in `app/quiz/[id]/page.js` listed 21 formats while `WORD_GAME_FORMATS` knows
95, so a stub for any game launched after that map was written (encore, knight, towers,
atlas, biz and the rest) canonicalized to itself and competed with its own game page. It
now falls back to `DAILY_GAME_MAP[format].href`, which carries the route overrides
(`/jesters`, `/parker`), so a new game needs no edit here.

## The player newsletter: daily batches under the free tier, and the opt-out (2026-09-22)

Registered players with an email on file can be sent a campaign, 99 a day, through Resend's free
tier. Everything lives in four files plus migration `58_newsletter.sql` (adds
`quiz_users.newsletter_opt_out` and the `newsletter_sends` ledger; apply it in the Supabase SQL
editor before the first send).

- **A campaign is a module in `lib/newsletters/`** exporting `CAMPAIGN {id, subject, preheader}`,
  `render({unsubUrl})` and `text({unsubUrl})`, registered in the `CAMPAIGNS` map of
  `app/api/admin/newsletter/route.js`. The HTML is the same table-based, inline-styled email that
  was proofed as a Gmail draft; `{{UNSUB}}` is the only placeholder.
- **`GET /api/admin/newsletter`** reports eligible / sent / failed / remaining / daysLeft for the
  current campaign. **`POST`** sends the next batch: `{ dryRun: true }` to preview, `{ to }` to proof
  one address, `{ limit }` under the 99 cap, `{ retryFailed: true }` to retry failed or stranded rows.
  Auth is the admin cookie or `x-admin-token`, like the alerts route. The machinery is
  `lib/newsletter-send.js`; **`GET /api/cron/newsletter`** (Vercel cron, 14:00 UTC daily) sends the
  day's batch on its own once `NEWSLETTER_CRON=1` is set on Vercel, and skips once `remaining` is 0,
  so it stays wired between campaigns.
- **The ledger row is claimed BEFORE the send**, on a unique `(campaign, email)` index, so a double
  run, a cron that fires twice, or a retry after a timeout can never send one person the same
  campaign twice. Emails are stored lowercased for exactly that reason.
- **Opt-out is `GET|POST /api/newsletter/unsubscribe?u=<id>&t=<hmac>`**, signed with
  `NEWSLETTER_SECRET` (falls back to `ADMIN_TASK_TOKEN`). No login, nothing stored per link, and
  the same URL goes in the footer AND the `List-Unsubscribe` / `List-Unsubscribe-Post` headers, so
  Gmail's and Yahoo's one-click unsubscribe works. Idempotent; a second visit says so.
- **Env on Vercel:** `RESEND_API_KEY`, `NEWSLETTER_FROM` (e.g. `Mind Loft <news@mindloftdaily.com>`,
  domain verified in Resend with the DKIM and SPF records it hands out), `NEWSLETTER_CRON=1` to arm
  the daily cron, optional `NEWSLETTER_SECRET`.
- **The first campaign says why the reader is getting it** ("you joined the Mind Loft leaderboard
  with this address"). Keep that line on every campaign: these people registered for a leaderboard,
  not a newsletter, and the opt-out is one click for that reason.

## The admin desk and /sitestats answer first and refresh second (2026-10-02)

Measured on the live site before this: `/admin` took 10.0s and returned **18 MB**; an
uncached `/api/sitestats` took **28.6s** (71ms on a CDN hit, but every deploy empties the CDN).
The table read was not the cause (that was fixed 2026-08-28 by `lib/admin-results-cache.js`).
The causes were: every tab's data built before anything painted and all of it rendered into
the HTML, nothing reused between loads, and a cold lambda having nothing to show.

- **`app/admin/page.js` is a shell.** It checks the cookie and renders `<AdminClient />` with no
  props. Do not add data back to it.
- **`lib/admin-data.js` holds the builders** (moved from the page verbatim) and serves them in
  parts through **`GET /api/admin/data?part=`**: `editorial` (the action queues, always live),
  `analytics` (first paint, player tables cut to the `PLAYERS_TOP` most recently active),
  `players` (the full tables, on demand), `pageviews`, `retention`, `map`. The desk fetches a
  part the first time the view that draws it opens (`useAdminPart` in `AdminClient.jsx`).
- **One build, many slices.** `computeAnalytics()` runs once and is memoized in the lambda for
  90s; `sliceAnalytics()` cuts it. A request past 90s gets the older build flagged `stale` at
  once and the desk follows with `mode=fresh`; the Refresh button sends `mode=force`.
- **`stats_payloads` (migration 59)** stores the last built payload per key (`sitestats:v1`,
  `admin:analytics:v1`), so a cold lambda answers from the stored copy. Service-role only: the
  admin payload carries emails. Every read and write is wrapped, so the code works before the
  migration is applied; it just builds while the caller waits, as it used to.
- **The full player tables load when the desk sorts, searches, exports the users CSV or presses
  "Load all"** (`useNeedAll`, `PartialNote`). While trimmed, the totals in the copy come from
  `counts` in the analytics part, never from the rows in hand.
- **`etParts` is memoized by UTC hour.** Eastern time is a whole number of hours off UTC, so one
  lookup per hour replaces a formatter call per row (builders measured 4.4x faster on 60,000
  rows). `scripts/verify-admin-data.mjs` proves it across six daylight-saving changes and checks
  the slicing. The returned object is shared: never write to it.
- **The desk no longer imports `lib/data.js`** (4.5 MB of source in the browser bundle, for a
  list picker). The editorial part sends `listOptions`. `GeoMapPanel` is a dynamic import.
- **`/api/sitestats`** returns the last built payload at once: fresh under 5 minutes, otherwise
  flagged `stale`, and `SiteStatsClient` then calls `?refresh=1` and swaps the new figures in.
  `?refresh=1` never rebuilds a copy under a minute old. The build lives in
  `lib/sitestats-build.js`: the player half and the viewer half run together, each with a 40s
  limit, and a half that fails keeps the previous figures (`held` in the payload). With
  migration 59 the player half is three SQL aggregates (`site_play_trends`,
  `site_play_hourly_today`, `site_play_top_today`) instead of a whole-table load; without it,
  it falls back to the shared row cache. `timings` in the payload says where a slow build went.
- **`/api/cron/stats-warm`** (daily, 09:20 UTC) rebuilds and stores both payloads. It skips a
  copy under ten minutes old, because the route is open when no `CRON_SECRET` is set.
- **`/api/admin/data` runs with `maxDuration = 300`, and that is load-bearing.** A cold lambda's
  first analytics build includes the full admin row load, and at 60s it was killed before the
  cache warmed, so every retry started cold again and the Analytics view never loaded
  (measured on the first deploy, 2026-10-03). The old page had no limit set. Do not lower it.
- **Migration 59 also rewrites `site_view_trends()` and `visitor_active_counts()`** to group page
  views by visitor once instead of running one `count(distinct)` sort per window. The viewer
  half was 25 to 27s of a 28s /sitestats build. Checked equal to the old functions on two
  million local rows.
- **Not done, on purpose:** a per-day rollup table. The Analytics view is mostly per-player
  figures, which a per-day table cannot supply, so the stored payload plus the memo does the
  job a rollup was meant to do. Revisit only if the row load itself becomes the cost.

## The puzzle archive is `/archive`; `/daily` is gone (owner, 2026-10-09)

The old `/daily` hub (navy cards, a leaderboard per row, one `daily-game` read per game, so about
130 requests a load) was removed and replaced by **`/archive`**, built in the home's stage style:
`CircuitFrame` (cap, register switch, stage footer), a hero, category chips and a search box, then
one shelf per category in the home's fixed order (Words, Numbers, Logic, Sudoku, Trivia, Geography,
then the rest), games A to Z, with a Retired shelf at the foot. `next.config.js` 308s `/daily` (and
`/daily?archive=<key>`) to it.

- **`app/archive/page.js` holds the bank imports**, the same list `/daily` had: one `import` per
  game's `puzzles.js` plus a `GAMES` row with `src`. **A NEW DAILY GAME ADDS ITSELF THERE**, or it
  has no archive. The old wire scripts anchor on `app/daily/page.js`; point new ones at the new path.
  Name, tag, category and route come from `lib/daily-games.js`, so only `key` and `src` matter.
- **The payload is lean on purpose** (`{n, d, q?, r?, s?}` per board): the quizId is derived as
  `<key>-M-D-YY` on the client and sent only where it differs. Nothing that could name an answer
  ever leaves the server.
- **One request**, `fetchDayStatus()` (the shared cached client), merged with this device's
  per-puzzle saves. Solved fills the square, played rings it, started dashes it; started follows the
  t0 rule (a save with a first move, never a page merely opened).
- A card shows the played count and bar, the last fourteen boards as day squares, Today's board, and
  "All N days", which opens the card across the row with a two-month calendar and a link to the
  newest board the viewer has not played. `?game=<key>` opens and scrolls to that card.
- Linked from the footer (Puzzle Archive, in `FOOTER_COLS`), the home's side index (a door beside
  Top 10 Lists), every game's end-of-game links ("Puzzle archive"), `DailyRoster`, the category
  pages, the game FAQ, and the sitemap. Page views post as `archive` (`TRACKED_PAGES`).

## The admin desk opens on PULSE (owner, 2026-10-12)

`/admin` -> Analytics opens on **Pulse** (`app/admin/PulsePanel.jsx`, served as
`/api/admin/data?part=pulse` by `lib/admin-pulse.js`): active players (DAU/WAU/MAU),
visitors, the share of visitors who played, new players, new sign-ups, sign-up rate,
time played, time per player, games finished and page views, each for the last 24h /
7 days / 30 days against the same span just before; a 90-day rolling DAU/WAU/MAU chart;
and rolling referrers (7 days vs the week before).

- **It is its own light build, on purpose.** The old Analytics build measured 5.6s and
  497KB on 2026-10-12 (156k play rows), and the desk's first paint waited on it. Pulse
  is one pass over the same cached rows plus `quiz_users.created_at` and the
  `site_view_trends()` RPC: ~0.5s of derive and ~11KB. The heavy build now runs only
  when Players, Page Views or the Daily Games tab is opened. Do not fold Pulse back into
  `computeAnalytics`.
- **Definitions match /sitestats**: rolling now-anchored windows, a player is playerKey,
  a visitor is a distinct visitor_id, time played is uncapped time_elapsed. Visitors are
  never called DAU.
- **Dropped as drains, 2026-10-12:** the all-time totals panel, the all-time view
  columns (and their `views` / `quiz_views` reads), `visitor_active_counts()`, Return
  Play, the Player Map, and the full-history Time Played / New Users charts. The
  builders stay in `lib/admin-data.js` for `scripts/verify-admin-data.mjs`.
