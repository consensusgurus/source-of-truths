# Source of Truths / Mind Loft: Working Instructions (core)

This file auto-loads every session, so it is kept SHORT on purpose. It holds only the rules that apply
to nearly every task. Everything else lives in topic files that are just as binding but are read on
demand. **Before working in an area, read its topic file first** (do not work from memory). They were
split verbatim out of this file on 2026-10-29; nothing was dropped.

## Topic files: read the matching one BEFORE you start

| Working on | Read first |
|---|---|
| A list in `lib/data.js` (sources, Borda, ratings, links, descriptions, heroes, ledger, renames) | `docs/claude/lists.md` |
| Rankings boards (/nflrankings etc.) | `CLAUDE-RANKINGS.md` |
| A quiz (`lib/quizzes.js`, `/quiz/[id]`, `/quizzes`) | `CLAUDE-QUIZZES.md` + `docs/claude/quizzes.md` |
| Writing or extending ANY daily puzzle bank, Sunday Editions, or adding a new daily game | `docs/claude/daily-authoring.md` |
| Daily scoring, leaderboards, points, attempts, best-N, End Game, hints, IQ | `docs/claude/scoring.md` |
| Home page, slate, Loft, palette, light/dark registers, contrast, game-page chrome, endings, pop-ups | `docs/claude/home-and-ui.md` |
| Circuits, Daily Five, runs, gauntlet runs | `docs/claude/circuits-and-runs.md` |
| A sudoku variant | `docs/claude/games-sudoku.md` |
| A trivia gauntlet or trivia bank | `docs/claude/games-trivia.md` |
| Any other specific daily game | `docs/claude/games-other.md` (grep for the game name) |
| Caching, result posting, PWA/identity, SEO/noindex, share cards, admin, newsletter, archive | `docs/claude/platform.md` |

Find a rule fast: `grep -n '^## ' docs/claude/*.md` lists every section; `grep -rn '<game or term>' docs/claude/`.

**Where new rules go:** add a new or changed convention to the matching topic file, not here. Only add to
this core file if it truly applies to almost every session. Keep this file under ~400 lines.

## Always-on rules (one-line reminders; full text in the topic files)

- **Native voting is removed (2026-06-18).** No `vote` blocks; seed `ai.items` only. (lists.md)
- **No em dashes in any site copy.** (Writing Style, below)
- **The registry key is not always the route name:** Parker = `park`, Jesters = `jester`. Pass the registry key to every per-game hook/API. (platform.md)
- **Never rewrite a board that has gone live;** retrofits are date-gated to future boards. (daily-authoring.md)
- **A new daily ships with a verifier, both tile PNGs, a Sunday decision, and the SEO checklist.** (daily-authoring.md)
- **No pop-up mid game, ever.** (home-and-ui.md)
- **`node --check <file>` is a no-op on ESM; pipe it:** `node --input-type=module --check < file`. (Deploy, below)
- **Batch pushes:** one push per finished piece of work. (Deploy, below)

## Setup & site overview

- **Repo (the only folder):** the connected repo, currently `C:\dev\source-of-truths` (moved off OneDrive to
  stop sync/lock issues). Everything lives here: the Next.js app, `lib/data.js`, and this file.
- **Live data file to edit:** `lib/data.js` in this repo. That is the only file that deploys to Vercel.
- **Stack:** Next.js 14 on Vercel. Supabase stores live votes and view counts (fetched on page load via
  `fetchBootstrap()`). Magazine look: cream `#f4ede0`, Fraunces headlines, DM Sans / DM Mono body, red `#c0392b`.
- **Deploy:** Claude pushes `lib/data.js` straight to `origin/main` via the stored PAT (see the Deploy
  section); Vercel auto-deploys in ~1 minute. GitHub Desktop is the manual fallback.

## This file is a living document

These conventions have changed over time and will keep changing. Update this file in place whenever a
convention is added or revised, so future sessions inherit the latest version automatically.

---

## Writing Style

Site-facing copy — blurbs, titles, categories, and any prose shown on a list page — follows these rules:

- **Never use the em dash (—) in site copy.** Not in blurbs, not in titles, not anywhere a reader sees. Replace it with a comma, colon, or period. A colon fits when the second part labels or summarizes the first (`Tonkotsu, shio, tsukemen: the Tokyo ramen counters most worth the queue`); a comma fits a trailing modifier (`ranked on sound and craft, not value`); a period fits two independent clauses (`A sense of place raised to an art. Rosewood Hong Kong was named the world's best hotel for 2025.`). Hyphens (`-`) in compound words are fine.
- **Chain-city composite lists use parentheticals like every other list.** Chain item names are `address (neighborhood)` (e.g. `129 W 48th St (Midtown)`), NOT em-dash separators. The composite score is NOT part of the name (see the chain section below). So the em-dash ban applies to chain names too.

### The "Top N" header label must match the actual item count, never hardcode "Top Ten"

The list-page header's top-right label (`{category} · Top N`) must reflect the **actual number of ranked items**, not a hardcoded "Top Ten." A short list (e.g. Kyiv hotels with 8 items) must read `KYIV · TOP 8`, not `TOP TEN`. The count is the consensus length capped at 10 (`Math.min(items.length, 10)`): consensus is always at most 10, but lists with fewer items show fewer. This logic lives in **three** header spots that must stay in sync:

- `app/list/[id]/DetailClient.jsx` — the `topCount` constant (consensus length, else vote/active-source length, capped at 10) feeds the header label.
- `app/list/[id]/ListOverview.jsx` — **two** copies: the poster header and the main overview header, both `Top ${Math.min(items.length, 10)}` (the footer already did this).

Never reintroduce a literal `'Top Ten'` in any list header. The `top3` variant correctly stays `Top Three`.

---

## Deploy — Claude pushes directly via the stored PAT (DEFAULT)

Claude deploys by pushing the new `lib/data.js` straight to `origin/main` using a stored fine-grained
Personal Access Token. The repo now lives **outside OneDrive** (`C:\dev\source-of-truths`), which is what
makes direct sandbox pushes reliable: the OneDrive mount used to block ref updates and `.git/index.lock`
removal, and moving off it removes that blocker. Vercel auto-deploys on push (~1 minute).

**Direct push by Claude is the ONLY default deploy path. Do NOT use GitHub Desktop except as a true
last-resort emergency if the push pipeline itself is broken.** Claude carries out the push itself rather
than handing it back to the user.

### BATCH YOUR PUSHES. One push per finished piece of work, not per edit (owner rule, 2026-08-08)

Deploy volume is the single most expensive thing this project does, and it is the
main reason the site feels slow to a share of visitors. Measured 2026-08-08:

- **181 production deploys in 4.3 days**, ~42/day, at roughly **3.4 cents each**.
  Build CPU was **$6.12 of a $15.04 bill, 41%**, the largest line by far. Traffic
  was nowhere near any limit (edge requests 1M of 10M, transfer 12GB of 1TB).
- **Every deploy EMPTIES the CDN cache.** A warm homepage load is ~1.7s with most
  API calls served in 54-97ms; minutes after a deploy the same calls are misses at
  1.4-4.4s and the page takes 3-4s. At 42 deploys/day the cache is cold roughly
  every half hour. `stale-while-revalidate` does NOT save you: swr serves stale on
  EXPIRY, but a new deployment starts an empty cache namespace, so there is nothing
  stale to serve and the request blocks.

So: **group related edits into ONE commit and ONE push.** Finish the whole piece of
work, validate it, then push once. Do not push a tweak, look at it, push another
tweak. Iterate locally or in the sandbox instead. Shipping five separate one-line
polish commits costs five builds and five cache wipes for one visible change.

Corollary for measuring: **never diagnose page speed right after a push.** You will
measure a cold cache and chase a phantom. Load the page twice, or wait a few
minutes, then measure.

**Do NOT bother switching the build machine off Elastic.** Checked the real pricing
2026-08-08: Elastic bills **$0.0035 per CPU minute** and fixed Standard (4 vCPU) bills
$0.014 per BUILD minute, which is the same $0.0035 per CPU minute, just charged on 4
cores whether you use them or not. Our $6.12 of build spend is 1,740 CPU-minutes at
exactly that rate. Elastic also right-sizes itself (the settings page was already
saying "your next deployment will build with a Standard machine"), so pinning it can
easily cost MORE by making builds run longer on fewer cores. The number of builds is
the lever, not the machine.

`vercel.json` sets `ignoreCommand: bash scripts/vercel-ignore-build.sh`, which skips
the build when a commit touches ONLY markdown. That covers doc-only pushes (this
file included) and nothing else, on purpose: the script exits 1 (build) for merge
commits, shallow clones, and any changed path that is not `*.md`. It is a backstop,
not a substitute for batching.

### Build-time pass (2026-09-01): what is on, and what is still owed

Shipped as one commit, none of it visible to a reader:

- `eslint.ignoreDuringBuilds: true` in `next.config.js`. `next build` no longer lints the tree;
  the `no-undef` sweep and `scripts/verify-all.mjs` are the pre-push gate, so run them.
- `experimental.webpackBuildWorker: true` (Next 14.2.35). Server, client and edge compilations
  run in parallel workers. Output is identical.
- `scripts/vercel-ignore-build.sh` now also skips a commit whose changed paths are ALL markdown
  or under `scripts/`. Audited that day: no file in app/, lib/, middleware.js or next.config.js
  imports or reads anything under scripts/. Re-run that audit before widening further, and
  pull scripts/ back out if a script ever becomes a build input.

**Per-game share cards are static PNGs (2026-09-02).** The 2026-09-01 build log showed 348 pages
in "Generating static pages" (54s, the largest phase), and 177 of them were `/<game>/opengraph-image`
+ `/<game>/twitter-image`: satori re-rendering the same fixed demo card for every daily on every
deploy, each also a separate edge bundle carrying `lib/og-brand-card.js`. Those cards are now rendered
ONCE into `public/og/<game>.png` (1200x630) and referenced from each game's `metadata.openGraph.images`
/ `metadata.twitter.images` (and the game's JSON-LD `image` where it pointed at the route). The route
files are deleted. Rules: a NEW daily game ships `public/og/<key>.png` plus the two `images` lines, not
an `opengraph-image.js`. To regenerate a card, render the `render<Game>Card()` from `og-brand-card.js`
in node (`next/og` ImageResponse works in plain node; serve the Manrope woffs from
`npm pack @fontsource/manrope@5.1.0` when the sandbox cannot reach jsdelivr) and overwrite the PNG.
STILL ON ROUTES, deliberately: `alibi`, `shoe`, `span`, `sweep` (their cards use glyphs satori fetches
from Google Fonts / twemoji at render time, unreachable from the sandbox, so they could not be
rendered faithfully offline) and the three hub cards `daily`, `lists`, `quizzes` (they read live
counts). Converting those four games is a 15-minute follow-up from any environment with network.

Still owed, each needing its own careful pass: convert the pure-data modules (`app/*/puzzles.js`
at 18 MB total, `descriptions.js`, `hero-images.js`, `rating-data.js`) to JSON or fs reads so
webpack stops parsing them as code; consolidate the per-route OG image entries (each bundles
`lib/og-brand-card.js`); check the build summary for pages prerendered at build that should be
dynamic. Measure each against the phase timings in a Vercel build log first.

### Session-start preflight (run this first, every new chat)

1. Confirm the connected folder is `C:\dev\source-of-truths` — the repo that actually contains `.git` and
   `lib/data.js`. It is NOT the OneDrive "Source of Truths" project folder (that one has no `.git` and is the
   wrong target). The connection persists between sessions; re-connect via the folder picker if it dropped.
2. Verify the git mount is healthy BEFORE touching anything: in the bash mount run
   `cd /sessions/<session>/mnt/source-of-truths && GIT_DISCOVERY_ACROSS_FILESYSTEM=1 git rev-parse HEAD`.
   If that errors, or `ls .git` shows nothing (the known "broken mount" state where `.git` isn't exposed to
   the sandbox), **restart the session** so the mount remaps cleanly, then re-check. Never push from a
   half-mounted state — the commit could be based on stale or empty tree state.
3. So the bash/git/web steps don't pause for an approval click, run the session in **"Act without asking"**
   mode (mode selector on the chat input, or set it as the default in Settings > Cowork). File deletions
   still prompt by design and can't be turned off.

Then run the push procedure below.

### One-time setup (already in place)

- **Repo connected to Cowork:** `C:\dev\source-of-truths` (re-connect it at the start of a session if needed).
- **`.deploy-secrets`** holds the PAT and config and lives OUTSIDE the repo so it is never committed. Format:
  `GITHUB_PAT=...`, `GITHUB_REPO=consensusgurus/source-of-truths`, `GITHUB_DEFAULT_BRANCH=main`,
  `GIT_AUTHOR_NAME=...`, `GIT_AUTHOR_EMAIL=...`. Keep it readable from a connected folder (the Projects folder,
  or a gitignored copy in the repo root). Never commit it.

### The procedure (run in the bash mount of the repo)

Never run `git add` / `git commit` (they touch the index and can jam on a `.git/index.lock`). Use git
plumbing on the object store and refs instead:

**⚠️ STALE-BASE RULE — the #1 way to silently erase deployed data.** The new `lib/data.js` MUST be
built by splicing the edit into the file from the fetch performed in the SAME deploy step
(`git show FETCH_HEAD:lib/data.js`), immediately before the push. Never splice into a data.js copy
captured earlier in the session (or in a parallel session): any commits that landed in between get
silently overwritten, because the push replaces the whole file. This happened on 2026-06-04 — commit
`f775229` (kids board games edit) was built from a copy ~10 minutes stale and erased the just-deployed
`spindrift-flavors` list plus the caesar-wraps-nyc and best-wings-nyc `itemYelp` blocks; the restore
itself then repeated the mistake once (`86de7df`) before being rebuilt on the fresh base (`71dc7a6`).
Safety checks: (a) re-fetch and re-splice if ANY time passed between building the file and pushing;
(b) after the push, diff the parent's data.js against the pushed one and confirm the diff contains
ONLY the intended change (`git diff BASE_COMMIT NEW_COMMIT -- lib/data.js`); (c) if the list count
(`grep -c publishedDate`) went DOWN and you didn't intentionally remove a list, stop and investigate.

**⚠️ STALE-BASE RULE applies to ANY file, not just `lib/data.js` — the Edit tool reads the
working-tree copy, which is stale after a push.** A direct `git push` updates `.git` but does NOT
fast-forward the working tree, so the file on disk in `C:\\dev\\source-of-truths` keeps its
pre-push content. The next Read/Edit on that file then operates on a stale base, and pushing the
result silently overwrites whatever landed in between. This bit twice on 2026-06-10 in one session:
commit `3c59f47` truncated `CLAUDE.md` (lost lines 1406–1545: image attribution, consensus alerts/
cron docs, full example list entry, chrome tab hygiene) AND truncated `app/list/[id]/ActivityFeed.jsx`
mid-line at 847 (broke the Vercel build), because both files had been written by intervening
commits and the Edit tool re-read them from the stale working tree. **The rule: for ANY file edit
that will be pushed (`CLAUDE.md`, `*.jsx`, `*.js`, migration SQL, anything), splice off
`git show FETCH_HEAD:<path>` from a fetch performed in the SAME deploy step — never the working
tree or a copy from earlier in the session.** Same safety checks apply: after the push, diff parent
vs new commit to confirm the change is only what was intended; if line count drops unexpectedly,
stop and investigate. The Read tool is fine for reference but not authoritative for splice bases.

```bash
set -e
cd /sessions/<session>/mnt/source-of-truths            # bash mount of C:\dev\source-of-truths
source "/path/to/.deploy-secrets"                     # load GITHUB_PAT, GITHUB_REPO, etc.

# 1. Base the new commit on origin/main (a direct push does not move local refs, so always fetch first).
git fetch "https://${GITHUB_PAT}@github.com/${GITHUB_REPO}.git" "${GITHUB_DEFAULT_BRANCH}"
BASE_COMMIT=$(git rev-parse FETCH_HEAD)
git show ${BASE_COMMIT}:lib/data.js > /tmp/data_orig.js

# 2. Build the new lib/data.js (splice the new entry in before the closing '];' of LISTS), then:
node --input-type=module --check < /tmp/new_data.js   # non-negotiable syntax check

# 3. blob -> tree -> tree -> commit -> push, all based on $BASE_COMMIT.
NEW_BLOB=$(git hash-object -w /tmp/new_data.js)
LIB_TREE_SHA=$(git ls-tree $BASE_COMMIT lib | awk '{print $3}')
NEW_LIB_TREE=$(git ls-tree $LIB_TREE_SHA | awk -v b="$NEW_BLOB" '{ if ($4=="data.js") print $1" "$2" "b"\t"$4; else print $1" "$2" "$3"\t"$4 }' | git mktree)
NEW_TOP_TREE=$(git ls-tree $BASE_COMMIT  | awk -v t="$NEW_LIB_TREE" '{ if ($4=="lib")     print $1" "$2" "t"\t"$4; else print $1" "$2" "$3"\t"$4 }' | git mktree)
NEW_COMMIT=$(GIT_AUTHOR_NAME="$GIT_AUTHOR_NAME" GIT_AUTHOR_EMAIL="$GIT_AUTHOR_EMAIL" \
             GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL" \
             git commit-tree $NEW_TOP_TREE -p $BASE_COMMIT -m "Add <list name>")

# 4. Push straight to origin/main via Smart HTTP. (api.github.com REST is blocked; only this push works.)
git -c credential.helper= push "https://${GITHUB_PAT}@github.com/${GITHUB_REPO}.git" "$NEW_COMMIT:refs/heads/${GITHUB_DEFAULT_BRANCH}"
```

To commit more than `lib/data.js` in one push (e.g. updating this file too), add each changed file as its own
blob and fold it into the tree the same way before `commit-tree`.

### ⚠️ `node --check <file>` IS A NO-OP ON AN ESM FILE. Pipe it instead (measured 2026-08-10)

Node 22 detects a file carrying `import` / `export` as an ES module and **exits 0 without
parsing it**. Verified in the sandbox on node v22.22.3: a copy of `lib/daily-games.js` with a
literal `const x = ;` appended passes `node --check` cleanly, and so does a two-line file that
is nothing but an `import` and a syntax error. The same broken code piped in fails correctly.
So EVERY "node --check the file before pushing" step in this document has been silently doing
nothing on the ESM half of the repo, which is every `lib/*.js` and every `app/**/*.jsx`. Only
`lib/data.js`-style files that happen to parse as CommonJS were ever really checked.

Use the stdin form on any file that imports or exports:

```bash
node --input-type=module --check < /tmp/new_file.js   # real check, non-zero exit on a syntax error
```

It reads the file as a module explicitly, so there is no detection to fall through. `node --check`
by path is still fine for a genuinely script-shaped file, but there is no cost to piping
everything, so pipe everything. A file that would have failed the check is a Vercel build
failure the moment it lands, which is exactly what the check exists to catch before the push.

**Critical: always use two separate steps to build the new lib tree** — never combine them into one pipe, or you get a double-nested `lib/lib/` tree that breaks Vercel:

```bash
# CORRECT — two steps:
LIB_TREE_SHA=$(git ls-tree $BASE_COMMIT lib | awk '{print $3}')       # get SHA of lib tree
NEW_LIB_TREE=$(git ls-tree $LIB_TREE_SHA | awk -v b="$NEW_BLOB" \
  '{ if ($4=="data.js") print $1" "$2" "b"\t"$4; else print $1" "$2" "$3"\t"$4 }' | git mktree)

# WRONG — one combined pipe (git ls-tree $BASE_COMMIT lib returns the lib entry itself, not its contents):
# LIB_TREE=$(git ls-tree $BASE_COMMIT lib | awk ... | git mktree)   ← DO NOT DO THIS
```

### Notes & fallback

- **Repo reads can lag right after an edit.** Trust `git show HEAD:lib/data.js` (or `FETCH_HEAD:lib/data.js`)
  over `cat` when verifying repo content.
- **If a fresh session's bash mount looks broken** right after the folder was moved or re-connected (can't see
  `.git` or subfiles, contradictory `ls`), restart the session so the mount remaps cleanly before pushing.
- **GitHub Desktop — emergency only.** Not a normal path. Use it solely if the direct-push pipeline is down
  (e.g. PAT revoked, GitHub Smart HTTP unreachable): edit `lib/data.js`, save, then in GitHub Desktop commit
  to `main` and push origin. Otherwise always push directly per the procedure above.

## Chrome tab hygiene (universal rule, owner-requested 2026-06-05)

Close every Chrome MCP tab as soon as it is no longer needed: reuse ONE tab per session (navigate in
place rather than opening new tabs), and call `tabs_close_mcp` on every tab in the session's group when
the task or session ends. Parallel Cowork sessions were proliferating tabs in the owner's browser; never
leave stale MCP tabs behind.

---

## Source of truth is origin/main, NOT the local working copy or the bash mount (owner rule, 2026-06-11)

The local working tree can be silently STALE or TRUNCATED relative to origin/main, and acting on it
loses the latest files with the latest counts. Two distinct failure modes, both seen on 2026-06-11
while building the homepage quiz tile:

1. **Local HEAD behind origin.** A parallel session / GitHub Desktop can push the newest work to
   origin without advancing the local HEAD ref or working tree. Local HEAD lacked the entire quiz
   feature while origin/main already had `lib/quizzes.js` (151 quizzes), `app/quizzes/QuizHomeClient.jsx`,
   and the quiz pages. Reading the local tree showed a feature that looked half-built and absent.
2. **Bash mount serves a truncated read.** `mcp__workspace__bash` (`grep`, `wc`, `cat`, `node`,
   `esbuild`) can return a STABLY truncated copy of a working-tree file. The local `lib/quizzes.js`
   read as 24 quizzes via the mount and 31 via the Read tool, when origin actually had 151 (82
   factual). A `node`/parse error at a suspiciously round line number, or a count lower than expected,
   is a TRUNCATION TELL, not a real result.

**Rules:**

- **The Read and Grep tools are authoritative for LOCAL file contents; `mcp__workspace__bash`
  grep/wc/cat/node reads are NOT — never make a decision or quote a count from a bash read of a
  source/data file.** If the shell must be used, cross-check its `wc -l` against the Read tool's
  reported total; a mismatch = truncated mount = stop.
- **For any count of lists/quizzes/items, or any file used to BUILD a deploy, read from origin, not
  local.** `git fetch` origin and read the file out of `FETCH_HEAD`, hash-verified
  (`git hash-object <extracted> == git rev-parse FETCH_HEAD:<path>`); retry until it matches. Treat
  that blob as the current truth. This is how "151 quizzes / 82 factual" was established after the
  local copy lied.
- **Deploy by splicing the intended edit into the FETCH_HEAD blob in the SAME step (existing
  stale-base rule), and NEVER push a local/stale copy over origin.** After the push, `git diff BASE
  NEW --stat` must show ONLY the files you intended, and item counts (quizzes, lists) must not drop
  (`grep -c` the relevant id pattern on `BASE` vs `NEW`). If a count fell unexpectedly, STOP and
  investigate before the deploy is considered done.
- **To resync a stale local tree** (so the editor isn't working against truncated files), fetch and
  reset/checkout to origin/main once the deploy lands, rather than editing the stale copy.


---

