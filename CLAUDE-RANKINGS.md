# Sports Consensus Rankings — Working Instructions

The framework behind **The Sports Ranking Source of Truth**: weekly consensus rankings for college
football, the NFL and **MLB** (added 2026-09-04), built from results, betting markets and analytics
models, and rebuilt automatically every week.

> **Working on a LIST (`lib/data.js`) or a QUIZ (`lib/quizzes.js`)?** Those have their own rules in
> `CLAUDE.md` and `CLAUDE-QUIZZES.md`. This file governs the football rankings ONLY, which run on
> their own engine and their own route for the reasons in §1.

---

## 0. HARD RULES (read before touching anything)

1. **Never write a ranking from memory.** Every number ships from a live fetch performed in the same
   session. This is the `lib/data.js` no-guessing rule, and it matters more here because the data
   changes weekly and a plausible-looking wrong poll is undetectable by eye.
2. **A source that returns HTTP 200 is not a source that returns CURRENT data.** As of 2026-08-28,
   four of the sources below serve complete, well-formed, entirely plausible tables that are months
   old. Every ingest MUST parse an as-of date and refuse the source when it is stale (§5).
3. **An unresolvable team name is a hard failure, never a silent drop.** If a source lists 25 teams
   and only 24 resolve, the ranks below the missing one shift up by one and the whole column is
   quietly wrong. Fail the source, do not publish a short column.
4. **Never modify `getSources` in `lib/helpers.js` for this feature.** That engine is capped at a
   top ten and drives 500+ lists across four mirrors. Football rankings run on `lib/gridiron.js`
   (three pillars on a points scale, section 2) and `lib/gridiron-math.js` instead.
6. **No polls, no media, anywhere in the score (owner rule, 2026-09-01).** Results, betting
   markets and analytics models only. See section 2.
5. **The past is frozen.** A published week is history. Never rewrite a shipped week's composite;
   corrections go in the following week with a note.

---

## 0a. ⚠️ THESE PAGES ARE CANONICAL ON sourceoftruths.com

Owner decision, 2026-08-28. The Sports Ranking pages are a **Source of Truths** property and live
primarily on the OLD host, even though the rest of the site moved to mindloftdaily.com on 2026-08-04.

Three pieces make that work, and they must stay in agreement:

| Piece | Where |
|---|---|
| The two paths are SERVED on old hosts instead of 308ing | `middleware.js`, via `SOT_PATHS` |
| `alternates.canonical` and `openGraph.url` are absolute on the old host | both `page.js` files, via `SOT_URL` |
| The sitemap lists the same two absolute URLs | `lib/sitemap-entries.js` `pagesEntries` |

`SOT_URL` and `SOT_PATHS` are defined once in `lib/site.js`. **Adding a ranking page means adding
its path to `SOT_PATHS` and its canonical, or it will silently 308 to the new host.** `/mlbrankings`
(2026-09-04) is the worked example: the page, the `SOT_PATHS` entry, the absolute
`alternates.canonical` and `openGraph.url`, the `lib/sitemap-entries.js` row, the `SotHeader` nav
item and the reserved view id all land in ONE commit, because every one of them fails silently
rather than erroring.

**This is a deliberate exception to the rule stated at the top of `lib/site.js`**, which warns that
the sitemap, robots and `metadataBase` must all agree on one canonical host or the Change of Address
filed at cutover is undermined. The old property now says "I moved" for every path EXCEPT two.

**What to watch, and the cheap way out.** Check those two URLs in Search Console over the next few
weeks. Google may honour the carve-out, or it may fold them into mindloftdaily.com anyway because the
Change of Address is a sitewide signal and a self-referential canonical on a migrated domain is a
contradiction. **If it folds them, do not fight it**: delete the `SOT_PATHS` check in the middleware
and switch the two canonicals back to relative. The pages keep the Source of Truths masthead, titles
and share copy either way, because the branding never depended on the URL. Nothing else is at risk —
verified 2026-08-28 that every other old-host path still 308s (`sourceoftruths.com/lists` →
`mindloftdaily.com/lists`).

---

## 1. Why this is its own engine and its own route

The owner's call (2026-08-28) was "hybrid": the data reads like the existing sources shape so it is
familiar and the activity ledger can hook in later, but scoring and rendering are separate.

The existing consensus engine cannot express these rankings:

| | `lib/helpers.js` `getSources` | `lib/gridiron.js` |
|---|---|---|
| Depth | top 10, hardcoded | ALL 138 FBS (CFB) / 32 (NFL) |
| Weighting | per-source (`trueExpert`, `decisiveExpert`, `weight`) | per-TIER, split within tier |
| Sources | hand-authored, edited rarely | machine-gathered weekly |
| Mirrors to keep in sync | 4 | 0 |

Bending `getSources` to fit would mean a `SCORING_ENGINE_VERSION` bump and a four-mirror change that
touches every list on the site, to serve two pages. It stays separate.

**Files:**

```
lib/gridiron.js          scoring engine (computeComposite)
lib/gridiron-teams.js    canonical team registry + alias normalizer + logo URLs
lib/gridiron-sources.js  source registry: endpoint, tier, parser, freshness rule
data/gridiron/<sport>-<season>-w<week>.json   one frozen snapshot per published week
app/rankings/[sport]/page.js                  the route
app/api/cron/gridiron/route.js                the weekly job
```

---

## 2. The composite (v2, 2026-09-01: results + odds + analytics, no polls)

**Owner rule, 2026-09-01: the score contains NO media rankings and NO human polls.** Not the AP,
not the Coaches, not the CFP committee, not any outlet's power ranking. Three pillars, each
accountable to something real (a score, a price, a measurement), each expressed on ONE scale:
**points better than an average team in its league on a neutral field.** The composite is a
weighted sum of the three and the rank is its sort order. The page prints the points.

The engine is `lib/gridiron.js` with the numerics in `lib/gridiron-math.js`; the 2025 backtest in
`Consensus Gurus/football-rankings-results-odds-analytics.md` section 8 is why every number below
is what it is. Borda rank points, depth truncation, the solo-tier cap and poll vote tails are all
gone; a points scale needs none of them.

### Pillar R, Results: what actually happened

Input: every completed game this season (`block.games`, ESPN ids, scores, neutral flag, and from
2026-09-01 the box-score totals `hy / ay` yards and `hto / ato` turnovers from the ESPN summary
endpoint, `boxscore.teams[].statistics` totalYards and turnovers).

1. **Luck-adjusted margin (owner rule, 2026-09-01).** `madj = 0.5 * m + 0.5 * (beta * yardDiff + hf * site)`,
   with `beta` fit on every 2025 game (0.070 points per yard NFL, 0.105 CFB; turnovers were worth
   4.2 to 4.4 points each in the same regression and are deliberately NOT in the yards term).
   Turnovers move the score and barely move the yards, so a team that doubled its opponent's
   yardage and lost on fumbles is docked about half of what the scoreboard says, while a team
   that was out-gained and still failed to cover takes the full hit. A game with no box score
   falls back to its raw margin. On 2025 the 50/50 blend predicted marginally better than the raw
   margin (NFL results-only MAE 10.41 to 10.35, CFB SU 71.1 to 72.3) and yards alone predicted
   worse (NFL 61.5), so 50/50 is where it stays.
2. Capped `madj = clamp(madj, -C, C)`, `C = 28` CFB, `21` NFL. A 45-point win says nothing a
   28-point win does not, and uncapped margins reward running up the score.
3. Margin rating: ridge least squares, `minimize sum (madj - H*site - (r_h - r_a))^2 + lam sum r^2`,
   `lam = 1` (one phantom game against an average team, so a 1-0 team is not +40). A team's rating
   equals its average margin plus the average rating of its opponents, so schedule strength is
   built in. Every unregistered CFB opponent pools into ONE FCS node.
4. Win rating: Bradley-Terry with home field on the ACTUAL result, so a win counts beyond its
   margin. Scaled to points by matching its spread to the margin rating's.
5. **Performance against the spread (owner rule, 2026-09-01).** For every played game with a
   closing line, `cover = madj - (-sp)`, the luck-adjusted margin minus what the line expected.
   A team's cover term is its mean cover, shrunk by `n / (n + 4)`. The line already prices the
   opponent and the site, so this is a schedule-adjusted measure that needs no solver. It adds
   NOTHING to prediction on 2025 (the market reprices after every game; results-only CFB MAE
   12.58 to 12.85 with it) and it is here as a resume term, what a team did against what was
   expected of it, at a quarter of the pillar. The page shows the ATS record (on the scoreboard's
   cover, since that is what "covered" means) with the luck-adjusted average on hover.
6. `R = 0.40 * margin + 0.20 * wins + 0.40 * cover` for CFB (owner rule, 2026-09-08; NFL and the
   pre-09-08 CFB weeks are 0.45 / 0.30 / 0.25). A team that has not played yet sits at the
   played teams' mean, which is zero after centring: no evidence reads as average, never as a
   penalty.

Home field is FIT only once there are three games per team (`fitHomeField`); before that it is
`hf` from `PARAMS` (2.5 CFB, 2.0 NFL). With fewer games the parameter is confounded with the
ratings: in week 1 nearly every home team is a favourite, and a free H fit at 12 to 14 points.

### Pillar O, Odds: what money says

1. **Spread-implied rating** from `block.lines` (one home-team spread per game, closing for played
   games, current for upcoming). Solved week by week in order: each week fits the last three
   weeks' lines with weights `1 / 0.6 / 0.35`, tethered (`tau = 0.5`) to the previous week's
   solution, which keeps the system determined (16 NFL lines cannot fix 32 unknowns), fills a bye,
   and stops one odd line swinging a team six points. Lines are capped like margins, and home field
   is never fit from lines (one to three lines per team is always too few); `hf` is subtracted.
   **First fitted week: tethered to the FUTURES-implied rating, not to zero** (fixed 2026-09-01,
   the Florida State case: a -30.5 line over New Mexico State floated FSU to +22 and 3rd on the
   lines column, because one line per team fixes a pair's difference and nothing else, so the
   pair's LEVEL was arbitrary and the market's actual opinion of FSU, 33rd on the futures board,
   never entered). The fit runs twice when lines are thin: once from zero to get a distribution
   the futures can be placed on, then again with that futures rating as the prior, so a single
   line only nudges a team from where the futures already put it. Until THREE weeks of lines
   exist the ratings are also rescaled so their spread is `sd(line) / sqrt 2` (a spread is the
   difference of two ratings), because a barely connected graph identifies order, not scale.
2. **Futures and the other market boards** (`tier: 'market'` sources, the ordinal boards): each
   team's rank is placed on the spread-implied distribution by POSITION (the 7th-ranked team takes
   the 7th-highest spread-implied value), then averaged across boards. The gaps come from the
   market's own distribution, never invented.
3. `O = 0.75 * lines + 0.25 * futures` for a team with a line in the window, futures alone
   without one. **Until two weeks of lines exist the split is 0.5 / 0.5**, because one week of
   lines is thin.

### Pillar A, Analytics: what the models say

Every live `tier: 'model'` source (30-day rule still applies), each team's rank placed on the ODDS
distribution by position, averaged across models, then rescaled to the odds pillar's spread. A
team below a model's published depth takes the mean of the odds values below that depth. Pure
results models (PFR SRS, Sagarin RATING in season) do not belong here, pillar R already is that
calculation; keep the predictive ones (FPI, SP+ when the CFBD key exists, F+, DRatings, Sagarin
PREDICTOR). The collinearity rule in section 3 stands.

**One model is not a tier (`soloScale`):** a lone live model carries HALF the pillar share and the
rest goes to the market. The old solo cap, kept for the same reason.

### Weights and the ramp

```
S = wR * R + wO * O + wA * A          full strength: results 40, markets 35, models 25
wR = 0.40 * min(1, W / G)             W = league weeks completed, G = 6 (CFB), 5 (NFL)
```

The rest splits between markets and models in their 35:25 ratio (after `soloScale`), and a pillar
with nothing to say this week hands its share to the others. Preseason is 0 / 58 / 42.

| Point in season | Results | Markets | Models |
|---|---|---|---|
| Preseason (W = 0) | 0 | 58 | 42 |
| Week 2 | 13 | 51 | 36 |
| Week 4 | 27 | 43 | 30 |
| Week 6 CFB / 5 NFL on | 40 | 35 | 25 |

Why 40 / 35 / 25: markets and models are both forecasts and correlate at about 0.9, so together
they are one signal counted twice; results are the only pillar that is not a forecast and the one a
reader holds a ranking accountable to. Markets over models per the 2026-08-28 ruling. Why the
ramp: in 2025 the results pillar alone predicted 60% of games in weeks 1 to 4 and matched the
market by week 10. **Prediction accuracy was flat across every split from 0/58/42 to 60/35/25 on
the 2025 backtest**, so the weight is an editorial choice about what a ranking is FOR and the data
cannot make it; what moves is how closely the board tracks the standings (each ten points toward
results buys about 0.01 of rank correlation with W-L).

Tie-break on composite, then results, then odds, then name. `SCORING_VERSION = 3`.

### ⚠️ MARGIN AND WINS MEASURE VOLUME UNTIL TEAMS SHARE AN OPPONENT (owner rule, 2026-09-08)

Two of the three results terms scale with games played and neither can see WHO you played until
the game graph connects, which it does not in week 1. Measured on the 2026-09-08 board:

- **In a one-game graph the ridge splits the capped margin symmetrically and carries no schedule
  information at all.** LSU's 51-10 over Clemson and Ohio State's 56-3 over Ball State both rated
  a margin of **exactly 8.50**, as did Texas, South Carolina, Pittsburgh and Mississippi State.
  Every one of those margins blew past the 28-point cap, and beating Clemson by 41 is the same
  solve that drives Clemson to -8.50, so the credit for the opponent cancels itself. "Schedule
  strength is built in" is true only from the week teams start sharing opponents.
- **Bradley-Terry counts a second win as a second win**, whoever it came against.
- **The ridge's phantom game (`lam = 1`) dilutes two games by a third and one game by a half**, so
  a 2-0 team out-rates a 1-0 one on margin before any quality is considered.

Together those put **2-0 USC at résumé rank 1** (1-1 ATS, +1.4 per game against the number, over
San José State and Fresno State) ahead of **1-0 LSU at +37.9** against the number over Clemson.
The cover term was the only one that disagreed, and it carried the smallest share AND the heaviest
shrinkage for the team with fewer games (`n / (n + 4)` is 0.20 at one game against 0.33 at two).

**The ruling: ten points come off `wins` and go to `cover`, CFB only.** Cover is the one term that
prices the opponent, because the closing line does. Week 1 then reads LSU, USC, Miami, Pittsburgh.
Two alternatives were measured and rejected: shrinking cover less early (`n0 = 1`) fixes the top
but is a narrower lever, and a cover-LED early mix (0.25 / 0.15 / 0.60) chases upsets, putting
Massachusetts second on one 29.5-point outright dog. Section 2c's own finding is that mix moves
prediction by under a point across this whole range, so this is an editorial choice about what a
résumé MEANS, not an accuracy claim.

**Still open: the NFL keeps 0.45 / 0.30 / 0.25.** It has played no games, so nothing on its board
moves either way, and aligning it is a free decision RIGHT UP UNTIL its week-1 results land.

### The 30-day rule (owner rule, 2026-08-28), unchanged

A source whose data is more than 30 days old is EXCLUDED: scores nothing, takes no share, keeps its
column struck through with the reason. An undated source must name the current season. A team
ranked only by an excluded source never reaches the board. The preseason trap still bites (FPI is
38 and 87 days old on 2026-09-01) and still resolves itself once the seasons start.

## 2a. What the page shows

Per team: rank, composite in points, then the columns in pillar order: **Résumé** (results rank,
points on hover) and **W-L**; **Lines** (spread-implied rank) and each market board; **Models**
(analytics composite rank) and each model. Then **Résumé vs market** = results rank minus market
rank: a large positive number is a team whose record the market does not yet believe, a large
negative one is a favourite that keeps losing. These are the story rows. Deviation shading works
as before against the composite rank. `computeComposite` returns the column list (`columns`) so
the table, the PDF and the poster all render the same columns; never build a column list from
`sources` by hand.

## 2b. Ordering, and what was retired

The composite is continuous, so ties are near impossible. Retired in v2: `bordaFromRank`, depth
truncation for scoring (depth still caps the DISPLAY), the `official` and `media` tiers, the
`poll` source kind on the page (the `rankSource` parser keeps it for any priced or vote-tailed
board), the solo-tier cap (replaced by `soloScale` on models only), the CFP weighting question in
the old section 2 (moot: the committee ranking is a poll and is not scored). AP and CFP can be
shown as UNSCORED reference columns if the owner asks; today they are not in the snapshot at all.

## 2c. The 2025 backtest, in one table

Run 2026-09-01 on every 2025 game and ESPN BET closing line, analytics proxied by an Elo carried
from 2024 (no archive of weekly FPI/SP+ exists). Next-week prediction, full season:

| | NFL SU | NFL MAE | CFB SU | CFB MAE |
|---|---|---|---|---|
| Composite 40 / 35 / 25 | 63.1 | 9.98 | 73.6 | 12.16 |
| Odds pillar alone | 65.3 | 9.81 | 74.7 | 11.82 |
| Results pillar alone | 63.1 | 10.63 | 71.4 | 13.26 |
| The closing line itself | 64.9 | 9.71 | 77.3 | 11.92 |
| AP poll (249 CFB games with a ranked team) | | | 75.5 vs composite 78.7 | |

End of season: NFL composite 0.94 rank correlation with W-L (market alone 0.80), 11 of 14 playoff
teams in the top 14 (market 9). CFB 21 of the committee's 25, Spearman 0.87. Pillar internals
(cap 14 to 35, ridge 0.5 to 4, mix 40 to 100%, tether 0.1 to 2, one- to four-week windows) all
moved results by under a point. Full write-up in the Consensus Gurus folder.

## 2d. Depth: the whole FBS, and what going deep exposed

**CFB displays ALL 138 FBS TEAMS, every team that can play in a bowl** (owner rule, 2026-09-04,
raised from a top 50). `DEPTH.cfb` is READ OFF THE REGISTRY, not written as a number: the FBS
changes membership most years and a hardcoded 138 silently cuts the last team off the board the
season anyone is reclassified up.

Nothing about the scoring changed. v2 already rated every registered team and `computeComposite`
has always returned the full board in `all`; depth only ever sliced the DISPLAY. What changed is
that the bottom two thirds of the board is now on the page, and three things that were invisible at
depth 50 are load-bearing at 138:

**1. The futures board must be stored at FULL depth.** The snapshot used to keep the top 50 prices,
which was all depth 50 could show. Every team below that then had no market signal except a line,
and 29 teams with neither fell onto a shared floor. Storing all 138 prices cut the exactly-tied
teams from 29 to 13 and the largest tie from 9 teams to 3. **Never truncate a source to the display
depth.** The board is 38 distinct prices over 138 teams, so it cannot separate everyone by itself,
which is why the tie rendering below still matters.

**2. Ties are real and must render as ties.** Where teams remain identical on every live pillar they
share a rank and print `T<rank>`. The alternative is the alphabetical last resort of the sort
printing Army 68th and Old Dominion 69th on no evidence at all.

**3. THE MODELS USED TO RUN OUT LONG BEFORE THE BOARD DID. FIXED 2026-09-08.** The snapshot used to
store each analytics model's top 50, but F+ publishes 138, FPI 138 and Sagarin 266 (138 of them
FBS). A team below a model's stored depth correctly took that model's tail mean, so **80 of 138
teams shared ONE identical analytics value** while `rankDesc` handed them ranks 59 through 138 off
its index tiebreak. The MODELS column printed a confident, ordered, entirely fabricated opinion for
58% of the page under a header claiming the models carry 42%.

**All four CFB model columns are now stored at their published depth, 138 each**, gathered from a
browser tab that can reach `bcftoys.com`, `sagarin.com` and `dratings.com`. No team on the board
reads `off board` any more. **Store every future week the same way; never truncate a source to the
display depth** (the same rule the futures board is under, one paragraph up).

The `modelSeen` guard STAYS. It is what makes a future short column visible instead of silently
fabricated: a team no live model ranks is flagged, its MODELS cell reads `off board` instead of a
rank, it is excluded from the rank-range and spread, and a note computed from the board says how
deep the models actually reach this week. Do not "restore" model ranks by removing that check — the
numbers it suppresses are generated by array order, not by any model.

## 2e. MLB (added 2026-09-04): what transferred, and what did not

The engine is the same one. `lib/gridiron.js` gained `mlb` alongside `cfb` and `nfl`, the page is
`GridironTable` unchanged, and the three pillars mean what they always meant. Five things had to
change, and **every one of them is a measurement on the 2026 season rather than a preference**. The
harness walks the season forward: build every pillar from games strictly before week W, then score
what it says. It runs in a few hundred milliseconds, so re-measure rather than assume.

### The test that discriminates is NOT next-game accuracy

Football tuned on straight-up accuracy against the closing line. **That test is useless in
baseball.** The closing moneyline itself calls only **56.4%** of 2026 games (Brier 0.245 against
0.250 for a coin), because a baseball game is mostly one starting pitcher and a bullpen, and a
season-long TEAM rating cannot know who is pitching. Every configuration tried landed between 53.6%
and 55.0%, inside a 1.2-point standard error of each other. Tuning there is reading noise.

So MLB is tuned on the question a 162-game sport can actually answer: **build on the games before
week W and rank teams by how they go on to do for the REST of the season**, averaged over the eleven
splits from week 8 to week 18. That separates cleanly.

| Rater | Mean Spearman vs rest-of-season win rate |
|---|---|
| Betting market (moneyline fit) | **0.502** |
| Composite at 15% results | **0.508** |
| Composite at football's 40% results | 0.466 |
| Results pillar alone | 0.363 |
| W-L alone | 0.338 |
| Run differential per game | 0.327 |

### The five differences

**1. The market pillar fits a MONEYLINE, not a spread.** Baseball's runline is fixed at 1.5 with
the price doing all the work, so it carries almost no rating signal and is not stored at all. The
market rating is a Bradley-Terry fit whose target is the DEVIGGED WIN PROBABILITY
(`bradleyTerryFit` in `lib/gridiron-math.js` — the likelihood already took a fractional target, so
this is the same solver the win rating uses), and its logits are converted to runs by
`runsPerLogit`. **2.31**, fit by regressing actual run margin on the closing line's logit over all
2,109 games. The 2026 board runs about a 4.1% overround, so devigging is never a rounding detail.

**2. Home field is two different numbers.** MLB home teams win **52.7%** of games and outscore
their visitors by **0.06 runs a game**. That is not a contradiction, it is the home team not batting
in the ninth when it is already ahead. So `hf` (runs) is 0.06 and `hbt` (logits) is 0.108, and any
engine that assumes one home-field number for both terms is wrong in baseball.

**3. The luck adjustment does not transfer.** Football docks half the margin toward what the
yardage implied. The baseball analogue is BaseRuns, and it was gathered per game for all 2,109
(every box score, the Smyth formula, with the B-multiplier calibrated so league BaseRuns equals
league runs: **1.0174** for 2026, re-fit every January). It makes the ranking WORSE, on every split:

| Margin term | Mean Spearman |
|---|---|
| Actual margin | **0.363** |
| Half actual, half BaseRuns | 0.337 |
| BaseRuns only | 0.295 |

The reason is sample size, and it is the whole point. Sequencing luck is enormous over fourteen
football games and largely washes out over 140 baseball ones, so by midseason BaseRuns and the
scoreboard rank teams almost identically (0.299 against 0.327 raw) and the extra step only adds
estimator noise. **BaseRuns is still gathered and still SHOWN**, as the unscored `Luck` column.

**4. The cover term is dropped.** In football it earns its place as a résumé measure despite adding
nothing to prediction. In baseball it is worse than nothing: 0.045 alone, and it drags the results
blend from 0.356 to 0.307. `mix.cover` is 0 and the results blend is **65 margin / 35 wins**.

⚠️ **The column it feeds had to be rebuilt, and the first version was a real bug.** Grading a run
margin against a moneyline-implied expectation is arithmetic that works and an answer that lies: the
conversion is linear and the truth is not, so a heavy favourite priced at +1.9 runs typically wins
by one and "fails to cover" every week. The first build had the Dodgers 62-78 against the line and
the Rockies 72-68, which is the bias, not the teams. **Baseball grades WINS against EXPECTED WINS**
instead: actual wins minus the sum of the win probabilities the market gave the team. Same question,
in the unit the market actually states. It sums to zero across the league, which is the cheap check.

**5. Futures are NOT scored** (`linesShare: 1`). This is the reverse of the CFB ruling in section 3
and for the same underlying reason, read the other way. CFB title futures keep discriminating deep
because 138 teams are priced. On 2026-09-04 the MLB boards had collapsed: ESPN BET's World Series
board separated all 30 teams into **15 distinct prices**, DraftKings had dropped to 25 teams, and
every division board was down to two to five (NL West: one team at -20000 and two at +8000). A
September futures board prices the PLAYOFF PATH, not the team. Meanwhile every team has a closing
moneyline in all six of its games a week, so the lines already carry everything the futures would
and carry it better. The board still renders, unscored, because a source considered and rejected
teaches a reader more than a source that is not there.

### Two settings that are choices, not findings

**The results share is 15%.** The measurement peaks there (0.508) and falls to 0.466 at football's
40%. Football set 40% as an editorial claim, that results are the pillar a reader holds a ranking
accountable to, and it could afford to because ITS backtest was flat across the whole range. MLB's
is not flat, so the same claim has a price, and the owner's call (2026-09-04) was to pay only what
it is worth. Full-strength shares are **results 15 / markets 50 / models 35**, keeping football's
35:25 market-to-model ratio on the remainder. **The ramp is 8 weeks** (about 50 games), not 5 or 6.

**The market window is ten weeks, not three.** Longer was monotonically better (0.478 at one week,
0.502 at ten, 0.519 at the whole season), because a baseball team's price is stable and more lines
is simply a better estimate. Ten weeks of geometric decay at 0.9 takes nearly all of that while
still moving on a July trade. Going to the full season would buy 0.017 and cost the page its claim
to describe who is best NOW; that is the trade, and it is worth re-examining if the page ever
becomes a pure forecast.

### The models cannot be backtested, and that is a known hole

Nobody archives weekly FanGraphs, PECOTA or DRatings values, exactly as section 2c records for FPI
and SP+. The 35% the models carry is therefore justified by the same reasoning football uses and by
nothing measured. Do not present it as tested.

## 3. Source registry (verified live 2026-08-28)

**v2 note (2026-09-01):** only `tier: 'market'` and `tier: 'model'` sources are scored, and the
snapshot carries only those. The poll and media entries below are kept as REFERENCE (endpoints,
parsers, traps) in case the owner ever asks for an unscored reference column; do not put them
back in `lib/gridiron-data.js` without that ask. Two ingests were ADDED, both from ESPN and both
already used by the 2025 backtest:

| Feed | Endpoint | Notes |
|---|---|---|
| Games (results) | `site.api.espn.com/apis/site/v2/sports/football/{college-football|nfl}/scoreboard?dates={yr}&seasontype=2&week={w}` (CFB add `&groups=80&limit=400`) | completed games only (`status.type.state === 'post'`); store `{ w, id, d, hid, aid, n, hs, as }` with ESPN team ids and `n = 1` on `neutralSite` |
| Box scores | `site.api.espn.com/apis/site/v2/sports/football/{college-football|nfl}/summary?event={id}` | `boxscore.teams[].statistics`, names `totalYards` and `turnovers` (`displayValue`, parse the leading number); `homeAway` on each team. Store as `hy, ay, hto, ato` on the game. CFB summaries often lack plays and yards per play, which is why the adjustment uses total yards |
| Lines | upcoming: same scoreboard, `competitions[0].odds[0].spread` (HOME-team spread, DraftKings); played: `sports.core.api.espn.com/v2/sports/football/leagues/{lg}/events/{id}/competitions/{id}/odds`, provider id 58 (ESPN BET), `homeTeamOdds.close.pointSpread.american`; **id 58 is absent from the provider list as of 2026-09-08, so this falls to `items[0]` = DraftKings (id 100) for all 99 CFB games** | keep the current week and the two before it; `sp` is the home spread, negative = home favoured |

Both endpoints are CORS-open, so a session gathers them with `fetch()` from a www.espn.com tab in
the connected Chrome (sandbox curl cannot reach ESPN). `$ref` links in core responses are `http://`
with a query string; convert to `https://` and strip the query before fetching. The FBS team list
(`.../seasons/{yr}/types/2/groups/80/teams?limit=200`) carries a few all-star pseudo-teams
(ids 3144 and up, 125290, 125291); ignore those.

### The one endpoint that matters

```
https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/
  seasons/{year}/types/{1|2}/weeks/{week}/rankings/{pollId}
```

Poll ids: **1 = AP**, **2 = AFCA Coaches**, **21 = CFP committee**, 20 = FCS Coaches, 12 = D-III.
**Preseason is season type 1; regular season is type 2.** Poll 21 does not exist in the index until
the committee's first release in early November, and appears automatically thereafter.

⚠️ **Do NOT use `site.api.espn.com/apis/site/v2/.../rankings`.** It returns valid JSON but serves
AP only and **silently ignores `season` and `week` parameters** — the same payload comes back for
every week requested. It never errors; it just hands you the wrong week forever.

### Confirmed sources

| Source | Sport | Tier | Endpoint | Updates | Notes |
|---|---|---|---|---|---|
| AP Top 25 | CFB | official | ESPN core, poll 1 | Sun | |
| AFCA Coaches | CFB | official | ESPN core, poll 2 | Sun | |
| CFP committee | CFB | official | ESPN core, poll 21 | Tue, Nov–Dec | 404s until the first release; tolerate it |
| ESPN FPI | both | model | `.../seasons/{yr}/powerindex` | Tue/Wed | **paginate at `limit=4&page=N`**; bigger limits truncate |
| Sagarin | CFB | model | `sagarin.com/sports/cfsend.htm` | Sun/Mon | fixed-width `<pre>`; header block reprints every 10 rows |
| BCF Toys F+ | CFB | model | `bcftoys.com/{year}-fplus` | weekly | clean table, all 138 FBS |
| DRatings | CFB | model | `dratings.com/sports/ncaa-fbs-football-ratings/` | ~daily | |
| Sagarin NFL | NFL | model | `sagarin.com/sports/nflsend.htm` | Tue | four sub-columns incl. STRONG RECENT |
| DRatings NFL | NFL | model | `dratings.com/sports/nfl-football-ratings/` | ~daily | parse its "Updated N ago" string |
| PFR SRS | NFL | model | `pro-football-reference.com/years/{year}/` | ~daily in season | **empty until Week 1**, then the most durable URL in the sport. Header casing is `SoS` / `MoV`, not `SOS` / `MOV` |
| Sharp Football | NFL | media | `sharpfootballanalysis.com/analysis/nfl-power-rankings/` | weekly | plain `<table>`, in-body "Last Updated". **The only NFL media ranking with a stable URL and an honest date** |
| CBS Sports | NFL | media | `cbssports.com/nfl/powerrankings/` | Tue | **serves stale editions; date check is mandatory** |
| Title futures | CFB | market | ESPN core `.../seasons/{yr}/futures/2758` | ~daily | DraftKings prices, 138 teams. See the CFB market note below — do NOT substitute win totals |
| Sportsbook futures | NFL | market | `vegasinsider.com/nfl/odds/futures/` | ~daily | median across five books → implied probability → rank. **The only source anywhere in the audit that prints its own edition date in the body** |
| Kalshi | NFL | market | `kalshi.com/nfl/power-rankings` | ~daily | prediction-market implied; explicit ET timestamp |
| Market win totals | NFL | market | `nfeloapp.com/nfl-power-ratings/nfl-win-totals/` | weekly | implied strength in points vs an average opponent |

### Collinearity — do not double-count one analyst

**BCF Toys F+ already contains both FEI and SP+.** Shipping F+ *and* FEI *and* CFBD SP+ gives
Fremeau and Connelly roughly double weight while looking like three independent models. Pick **F+
alone**, or **the FEI/SP+ pair**, never both.

The same trap applies inside ESPN's `predictives` array: `epaoffense` / `epadefense` are components
*of* FPI, not independent signals. Do not add them as columns.

**Sagarin's PREDICTOR, GOLDEN MEAN, RECENT and STRONG RECENT columns are byte-identical to the main
RATING until games are played.** Weighting PREDICTOR as its own source in the preseason is
double-counting one number. Gate it on the word `STARTING` disappearing from the page header.
**That gate opened on 2026-09-08**: the CFB page now reads "through results of SEPTEMBER 7 MONDAY -
WEEK 1", PREDICTOR has separated from RATING, and the CFB Sagarin column IS PREDICTOR from this week
on — RATING in season is a pure results model that pillar R already computes. The FBS rows are the
ones whose division tag is `(A)`; there are exactly 138 of them against 128 `(AA)`. Sagarin writes
two names nothing else does, `Fla. International` and `LouisianaMonroe(ULM)`; both are aliases in the
registry now.

### ⚠️ THE ESPN MIRROR CAN SERVE PRE-GAME STATE FOR GAMES THAT ARE OVER (2026-09-04)

The worst instance of the freshness problem yet found, and it is in the endpoint family this
whole framework is built on. On 2026-09-04 both `site.api.espn.com` and `sports.core.api.espn.com`
answered normally, with well-formed JSON, and reported **games that finished a week earlier as not
yet played**:

- `summary?event=401864494` (USC vs San Jose State, played Aug 29) returned
  `STATUS_SCHEDULED`, `state: "pre"`, `completed: false`, `"Sat, August 29th at 3:00 PM EDT"`,
  and NO scores, for a game this repo's own snapshot already carried as a 42-26 final gathered
  live on 09-01.
- `scoreboard?dates=20260903` listed the right events on the right date with the right ids, and
  gave **every one of them a score of 0 and `completed: false`**, the night after they were played.

So the payload is not stale in the ordinary sense: the SCHEDULE is current and the RESULTS are
missing, which no row count, no header check and no date parse can catch. A weekly job that trusts
it does not ingest a wrong week, it ingests **no results at all** and reports success.

**Three rules follow.**

1. **The freshness gate must key off GAME STATUS, not the presence of an event.** A completed game
   must come back `completed: true` with a score. Assert it per game and fail the source otherwise.
2. **The 30-day rule cannot see this.** The futures board pulled the same day came back with all 50
   of its previously stored prices byte-identical, which is the signature of a frozen mirror rather
   than an unchanged market. It is stored dated **2026-08-28**, the board it actually is. Never
   stamp a source with the day you fetched it; stamp it with the day its content is from, and when
   those disagree, the content wins.
3. **Cross-check against something that is not ESPN before publishing a week.** One independent
   source naming a final score is enough to prove the mirror is behind.

### ⚠️ SCOREBOARD PAGES DO NOT SURVIVE A SUMMARIZING FETCH. Verify scores ONE GAME AT A TIME

Gathering the 2026-09-03 results, a whole-scoreboard fetch of CBS and of Fox each returned a clean,
plausible, complete-looking table, and **the two disagreed with each other on three of the six games
they shared**. Measured against values proved independently, CBS was wrong on 5 of 9 and Fox on 1 of
5; Fox had San Jose State at 14 where the verified figure is 26, and CBS had Minnesota at 45 where
it is 59. The pages are fine. What fails is reading a dense two-column score table through a
summarizer, which transposes and drops digits while preserving the shape.

**What works: the ESPN game-page TITLE**, e.g. `Massachusetts 37-21 Rutgers (Sep 3, 2026) Final
Score - ESPN`, reached through a search rather than a page fetch. It is server-rendered, carries
both scores and the date in one string, and is authoritative. Every score in this snapshot's
2026-09-03 block was taken that way and corroborated by a second independent source (a school
athletics site, a wire recap, Yahoo, or StatMuse).

**Do not bulk-transcribe scores.** One game, one title, one corroboration.

### ⚠️ `resolveTeam` MAPS FCS "Arkansas-Pine Bluff" ONTO FBS "Arkansas"

`resolveTeam` strips progressively shorter prefixes to remove a mascot (section 4), so a hyphenated
FCS school name collapses onto the FBS program it starts with. Adding the 09-03 games, it resolved
**Arkansas-Pine Bluff to Arkansas (id 8)**, which would have credited an SEC team with a 54-14 loss
it did not play, in a week it did not play at all.

**Never resolve an opponent name into a team id when an id is already available.** Take `hid`/`aid`
from the line row the snapshot already carries for that game id (gathered live, real ESPN ids), then
use `teamById` to CHECK that the home id names the team the score belongs to and that an FCS
opponent's id is genuinely absent from the registry. That check is what caught this; the name-based
path failed silently and looked right.

### ⚠️ Two sources that are actively dangerous, not merely useless

**Sumer Sports** stamps "Last Updated 08-27-2026" over a table whose own filter reads `Season: 2025`.
**Pro Football Network** prints "Last updated: August 28, 2026" from a **client-side clock** over a
table that says "Entering Week 12 • 2025 Season" with 2025 records.

Both would pass an HTTP-200 check, a row-count check, AND a naive date check, and would quietly
poison the ranking forever. They are the reason §5's freshness gate must key off a **content-derived**
signal — a parsed week or season label that must advance week over week — and never off a date string
that the page itself renders.

### Not usable (verified, do not retry without cause)

- **Blocklisted (HTTP 403):** usatoday.com, apnews.com, theathletic.com, sportingnews.com. The ESPN
  core API supplies both blocked polls anyway.
- **JavaScript-gated:** Massey, PFF, FTN/FO DVOA, TeamRankings, ESPN's own web power-ranking pages.
- **No discoverable weekly URL:** NFL.com, Yahoo, SI, Bleacher Report. Their content is readable but
  only at a per-week article slug, which adds a search step and a second failure point per outlet
  per week.
- **collegepolltracker.com `/football/coaches` serves the AP poll under a Coaches URL.** Never point
  at it.
- **NFL media, 15 outlets tested, 14 unusable.** They fail three ways: blocklisted (USA Today, AP,
  The Athletic, Sporting News), no stable path at all (NFL.com, B/R, PFF, SI, NBC, Fox — a new dated
  slug every week, and Fox does not keep a landing page), or JS-gated (ESPN, The Ringer). Sharp
  Football is the only survivor. This is why the NFL media tier is weighted smallest.
- **ESPN SOR (`accomplishmentrank`)** is `0` for every team until games are played. Wire the field,
  suppress the column until it populates (~Week 3), then it becomes a genuinely independent
  résumé-based signal.

### The CFB betting-market tier

**Use ESPN's national-title futures, not win totals.** This is counter-intuitive and worth stating
plainly, because win totals look like the better source:

- **Win totals price all 137 FBS teams** and discriminate beautifully down the board
  (`sportsbettingdime.com/college-football/futures/win-totals-best-odds/`). **But they are a
  PRESEASON market.** Books pull them once games begin, so a weekly cron pointed at win totals
  returns the same frozen July numbers every week for four months, and the market tier silently
  becomes a preseason prior wearing a live-data costume. That is worse than an empty tier, because
  it looks fresh and the 30-day rule would eventually catch it only if the page's date moved.
- **Title futures re-price weekly all season**, cover 138 teams, and — unlike the NFL — keep
  discriminating deep enough for a top 50: 29 distinct prices through rank 50, with the real
  collapse at rank 53 (15 teams share +80000).

```
https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/{yr}/futures/2758
```

Unauthenticated JSON, DraftKings prices, team `$ref`s that join on the ESPN ids already in the
registry. Ties are everywhere on a futures board, so it ranks through the same tie-averaging path as
a poll (source `kind: 'priced'`, `lowerIsBetter: true`).

**Two guards.** The market includes at least one FCS program (North Dakota State), so filter against
the FBS registry rather than trusting the board's membership. And for ranks 30-50 later in the
season, add the **conference-winner markets** (ids 4092 Big 12, 11071 ACC, 15225 AAC, 15226 Big Ten,
15227 CUSA, 15229 MAC, 15232 SEC, 15233 Sun Belt): when Toledo is +1000000 for the title in Week 8
it still carries a live, moving price to win the MAC. Id 15230 would not load and Mountain West /
Pac-12 coverage is unverified.

### Worth adding: collegefootballdata.com

The single biggest available expansion, and the only route to SP+. Free key at
`collegefootballdata.com/key` (email only, no card), 1,000 calls/month against a weekly job that
needs ~16. `Authorization: Bearer <key>`. Endpoints: `/ratings/sp`, `/ratings/srs`, `/ratings/elo`
(takes `week`, purpose-built for this), `/ratings/fpi`, `/ratings/core`, `/rankings`. It also
re-derives all three polls independently, which makes it the cross-check against ESPN.

---

### The MLB registry (verified live 2026-09-04)

| Source | Tier | Where | Reads | Notes |
|---|---|---|---|---|
| Games + box scores | results | ESPN `site.api` scoreboard by date range, then core `.../competitors/{teamId}/statistics` per side | daily | The per-side statistics endpoint is 48KB against the 816KB summary, and both teams of all 2,109 games pulled in **12 seconds**. Never page the summary endpoint for this. |
| Closing moneylines | market | ESPN core `.../events/{id}/competitions/{id}/odds` | daily | Provider **100 (DraftKings)** for MLB, not 58 as in football. `homeTeamOdds.close.moneyLine.american`, falling back to `current` then `open`. All 2,109 games had one. |
| World Series futures | market | ESPN core `.../seasons/{yr}/futures` | ~daily | **Not scored** (§2e). Keep the board that prices the most teams; on 2026-09-04 that is ESPN BET with 30. |
| FanGraphs | model | `fangraphs.com/api/playoff-odds/odds?...` from a fangraphs.com tab | daily | Take **`endData.rosW`**, the rest-of-season talent estimate. Do NOT take the playoff odds: those price the division and the schedule, not the team. |
| Baseball Prospectus PECOTA | model | `baseballprospectus.com/standings/` | daily | Free, and it prints its own **`AS OF MM/DD/YYYY`** in the body, which is the content-derived date §5 wants. Take Sim W%. |
| DRatings | model | `dratings.com/sports/mlb-baseball-ratings/` | ~daily | Take the **Inference** column, NOT Overall: Overall blends their own Vegas column, which would double-count the market pillar. Same collinearity rule as FPI's components. |

**Everything is fetched from a BROWSER TAB.** ESPN's APIs are open to a `www.espn.com` origin and
refused everywhere else, and the sandbox and the local shell are both blocked from all six hosts
above. The gather runs as `javascript_tool` against a live tab; `scripts/mlb-snapshot-to-data.mjs`
is the deterministic half that turns the resulting snapshot into the data block, so a week can be
rebuilt from its snapshot without re-fetching.

⚠️ **ESPN files the ALL-STAR GAME as season type 2.** It is played by two entities with their own
team ids (**31** AL, **32** NL) that are not clubs, so a "regular season" filter lets it through and
it then trips the unresolvable-team rule exactly as §0.3 says it should. It is dropped at the source
in `mlb-snapshot-to-data.mjs`, not taught to the registry: those are not teams.

⚠️ **Baseball Prospectus prints BARE CITY NAMES**, so "New York", "Chicago" and "Los Angeles" each
name two clubs. Its table is read with its DIVISION BLOCK, which is what disambiguates it (rows come
in blocks of five, AL East through NL West), and the ingest stores the resolved canonical name.
**Never add a bare-city alias to `MLB_TEAMS`** — it would silently hand one club the other's rating,
and `resolveTeam` deliberately refuses the prefix walk for MLB for the same reason.

**Not usable for MLB:** Sagarin publishes no baseball page (`sagarin.com/sports/mlbsend.htm` 404s,
verified 2026-09-04); Baseball-Reference SRS is a pure results model and is excluded by the same
rule that keeps PFR SRS out of football, since pillar R already is that calculation.

## 4. Teams, aliases, and logos

Every source names teams differently. Sagarin says `Miami-Florida`, `Southern California`,
`Mississippi`, and still says `Washington Redskins`. DRatings appends mascots. CBS prints bare
nicknames. Nothing works until they all resolve to one canonical name, so `lib/gridiron-teams.js` is
the join key for the whole framework.

`resolveTeam(sport, raw)` tries, in order: exact canonical match, explicit alias, NFL trailing-token
nickname (every NFL nickname is one token and unique league-wide), then progressively shorter
prefixes to strip a mascot. It returns `null` on failure, which the caller must treat as a hard
error per §0.3.

**Logos** come from ESPN's CDN and the two sports key differently — this is not interchangeable:

```
CFB:  https://a.espncdn.com/i/teamlogos/ncaa/500/{numeric_id}.png
NFL:  https://a.espncdn.com/i/teamlogos/nfl/500/{lowercase_abbr}.png
```

A `500-dark` variant exists for both. Every FBS and NFL team has a logo, so the no-logo case does not
arise in practice — but render an `onerror` fallback to an initials badge anyway, because some hosts
(artifact previews, strict CSPs) block external images entirely and a broken image reads as a bug.

⚠️ **Do not build the id map from `teams?limit=900`.** That response truncates partway through the
alphabet, and a missing team then looks like "team not found" rather than "response truncated."
Resolve per-id, or page it.

---

## 5. The weekly cron, and the guards that make automation safe

Fully automated with no human in the loop (owner's call, 2026-08-28). That decision is only
defensible with the guards below, because **the dominant failure mode here is not an error, it is a
successful fetch of stale or wrong data.** Six sources in the audit fail by returning HTTP 200 with
either zero bytes or a months-old table.

`app/api/cron/gridiron/route.js`, Tuesdays ~09:00 UTC (after Sunday's polls and Tuesday's power
rankings), plus a Wednesday retry.

### Per-source gate — a source publishes only if it passes ALL of these

1. **Non-empty body.** Six sources fail by returning 200 with zero bytes, which a naive parser reads
   as "zero ranked teams" rather than as an error.
2. **A CONTENT-DERIVED freshness signal matches the week being built, and the source is within
   `MAX_AGE_DAYS` (30).** Prefer a parsed week/season label from the payload's own body over any
   rendered date string, because two sources print today's date over last season's table (see §3).
   This is the only guard that catches ESPN's `site.api` serving preseason data in November, CBS
   serving an April edition at a live URL, and the two poisoned sources above. See §2's 30-day rule
   for the exclusion behaviour and the preseason trap.
3. **Expected header.** The payload's own poll name must be the poll requested. The only thing that
   catches collegepolltracker serving AP under a Coaches URL.
4. **Expected depth.** The source must parse to the depth it is known to publish — 25 ranked plus a
   populated `others[]` for a poll, `depth` teams for a model. A short column means a broken parser.
   **The AP endpoint returns an empty body on first call and populates only on retry**, so ingest
   needs a retry plus a non-empty assertion, or the week silently ships with no AP column.
5. **Every team name resolves.** Per §0.3.
6. **Week-over-week sanity.** No team may move more than 15 spots, and at least 70% of last week's
   ranked teams must still appear. A parser that silently reverses or offsets a column trips this.

A source failing the gate is **excluded from this week's composite**, not substituted with last
week's. Tier renormalization (§2) absorbs the loss cleanly. The exclusion is recorded in the
snapshot and shown on the page, so a reader can see which outlet went missing and why.

### Publish gate — the week publishes only if

- At least **three** sources passed, across at least **two** tiers. Fewer than that is not a
  consensus and the previous week stands with a "not yet updated" stamp.
- The new composite's top 10 shares at least 6 teams with last week's. A wholesale change means a
  systemic parse failure, not a wild football weekend.

On a publish failure the job writes no snapshot, leaves the previous week live, and reports. **A
stale week clearly labelled is always better than a wrong week presented as current.**

### Deploy discipline

Per `CLAUDE.md`'s batching rule: **one push per week, not one per source.** The job assembles the
whole week, validates, and pushes once. Every deploy empties the CDN cache, and this is the only
recurring automated writer in the repo.

---

## 6. Layout rules

Live tokens from `lib/theme.js`; Manrope; the dark `--ground` page with a white console, matching
the Loft surfaces.

- **Masthead: these pages are a SOURCE OF TRUTHS property, not a Mind Loft one** (owner rule,
  2026-08-28). They render `app/SotHeader.jsx` instead of the site-wide `SiteHeader`: the Source of
  Truths wordmark, a two-item nav, and a quiet link back to Mind Loft. Titles and `og:siteName` read
  "Source of Truths". The Mind Loft **footer stays** — it carries the legal links and is the site's
  real internal-link registry, and a sub-brand inside a parent site is the normal shape for that.
  Branding only: the visual system is unchanged (Midnight blue, Manrope), NOT the pre-rebrand
  cream/Fraunces identity.
- **v2 (2026-09-01): rank, team (record beneath), RATING in points, then the three pillars in
  order results / markets / models, each pillar's own column first and its sources beside it, then
  Résumé vs market.** `PILLAR_ORDER` in `lib/gridiron.js`; the table, PDF and poster all read
  `columns` off `computeComposite`. The two rules below describe the same shape and still hold.
- **Column order is fixed: rank, team, CONSENSUS SCORE, then every source, then spread** (owner
  rule, 2026-08-28). The composite score sits immediately beside the team name, ahead of every
  source column, in a filled `--accent` box. It is the answer the page exists to give, so it is
  never pushed to the far right past a horizontal scroll.
- **Source columns are grouped under their tier and ordered HEAVIEST TIER FIRST** (owner rule,
  2026-08-28): market, model, media, official, left to right, so reading order matches how much each
  tier moves the consensus. `TIER_ORDER` in `app/GridironTable.jsx`. The tier's live weight sits in
  the group header and each source's own weight under its name: the weighting is the methodology, so
  it belongs on the page rather than in a footnote.
- **The header above the board is kept short** so the #1 team is visible on load (owner rule,
  2026-08-28). The intro is two sentences carrying the bias argument; the full methodology lives in
  the notes UNDER the table, where there is room for it. Do not grow the intro back.
- **Sticky columns (desktop).** Rank, team and score are pinned so the source columns scroll under
  a labelled row.
- **PHONE IS NOT THE TABLE. Below 760px the table is replaced by ONE CARD PER TEAM** (owner rule,
  2026-08-28). A ten-column table behind a horizontal scrollbar is not a mobile layout: comparing
  sources is the entire point of this page, and every source column started off-screen, so the page
  showed a ranking and hid its own argument. The card carries rank, logo, name and the consensus
  score on one line; then EVERY source as a wrapped chip, tinted by its deviation from the consensus
  and edged in its tier colour (the tier grouping is a column header on desktop, so on a phone the
  chip has to say it); then the rank range and spread. Nothing scrolls sideways and no source is
  hidden. A tier key sits above the list, phone only.
  - **Both renders sit in the DOM at once and CSS picks one** (`.gr-scroll` vs `.gr-cards`). That is
    what keeps the pages server components with no client JS, and `display:none` keeps the hidden
    one out of the accessibility tree. It is the same approach `HomeRails` uses for its phone hero.
  - **Anything added to one render must be added to the other.** They are two views of the same row,
    and a source added to the table but not the card silently disappears on mobile.
- **An excluded source keeps its column**, struck through on a hatched ground, weight replaced by
  `EXCLUDED`, its numbers greyed, plus a banner naming each one and its age. Never let a dropped
  source silently disappear.
- **Coverage counts SCORING sources only.** `ranked by only N of M` and the header's source count
  both use the live count, not the total. Counting an excluded column in the denominator put
  "ranked by only 6 of 7" on every single row, which is noise rather than information.
- **EVERY source column shows its last-updated date under the name** (owner rule, 2026-08-28), not
  just the stale ones. A reader comparing six columns needs to know one of them is four months old,
  and a date that appears only when something is wrong never teaches anyone what current looks like.
  A stale source turns that stamp red with a ▲ marker and adds a banner naming how many days old it
  is. Render an ISO date as `Aug 17`; pass a source's own coarser phrase (`2026 preseason`) through
  untouched rather than inventing a precision it never claimed.
- **`RV` is rendered as a label, not a number** (§2a), in a smaller, quieter style than a rank.
- **Deviation shading scales with depth.** A 3-spot gap means much less on a 138-deep board than on
  a 32-deep one. The thresholds are `hi = max(3, round(depth/10))` and `lo = max(5, round(hi*1.8))`,
  a ratio rather than a ladder of magic numbers, which reproduces the original 3/5 at depth 32 and
  5/9 at depth 50 and gives 14/25 across the FBS. `app/GridironTable.jsx` and `lib/gridiron-pdf.js`
  must use the SAME formula or the sheet and the page shade different cells.
- **Tied teams share a rank and print `T<rank>`** in all three renderers (page, PDF, poster). The
  composite is continuous, so a tie means the teams are identical on every pillar that exists this
  week, and the sort's last resort is alphabetical: without this the board invents an order. Never
  reintroduce a silent tiebreak. See §2d.
- **Callouts under the table are computed from the board, never hand-written**, so they cannot go
  stale against the data the following week.
- **`ranked by only N of M`** appears under a team's name only when a source left them off. When
  every source ranks them it is noise on every row.

- **Team logos render on the board and on the phone cards, and NOT on the poster** (owner rule,
  2026-09-04). Every row carries `logo` from ESPN's CDN with an initials badge behind an `onerror`,
  because some hosts block external images and a broken image reads as a bug. The one-pager stays
  text-only: Satori fetches every remote image at render time, so thirty logos would be thirty new
  ways for that route to fail and thirty 26px marks that read as noise at poster size. MLB keys its
  logo off the lowercase abbreviation like the NFL, `.../teamlogos/mlb/500/{abbr}.png`; all 30 were
  loaded and confirmed before shipping, as was the `500-dark` variant.

**LIVE as of 2026-09-04** at `/collegefootballrankings`, `/nflrankings` and `/mlbrankings`, rendered
by `app/GridironTable.jsx`. That component is a **server component on purpose**: the sports have
their own URLs rather than sharing a toggle, so nothing needs client state and the whole board ships
as HTML, which is what puts the ranking in the source for search engines. Keep it that way.

`football-rankings-mockup.html` in the repo root is the design prototype the live pages were built
from; it is not wired to anything and may drift. The live pages are the truth.

---

## 6a. View tracking, and the one-pager

### Tracking

The site has **no path-based view tracking**. Every view is keyed on an opaque string in
`views.list_id` or `quiz_views.quiz_id`, and an ordinary page is counted by reserving a pseudo-id,
which is what `home`, `daily`, `kids` and `exam-*` already do. `app/PageViewBeacon.jsx` is that
idiom generalised, so a server page opts in with one line and stays a server component.

- **Reserved ids: `cfb-rankings`, `nfl-rankings`.** Never create a real quiz with either.
- **It posts to `/api/quiz/view`, not `/api/views`, deliberately.** The admin's quiz row set unions
  the ALL-TIME views map as well as the 24h one, so the page keeps its row on a quiet day; the list
  row set unions only 24h, so it would vanish. And `PageViewsPanel` honours a quiz row's `href` but
  hardcodes `/list/<id>` for list rows, which is why the existing `home` and `daily` rows are dead
  links in the panel.
- **The once-per-session flag is set only AFTER the write lands.** Setting it up front means one
  failed request suppresses the count for the whole session with nothing recorded.
- `TRACKED_PAGES` in `app/admin/page.js` (renamed from `KIDS_PAGES`, which was no longer accurate)
  gives each id a title and a real href. It is **cosmetic**: a tracked id appears in the panel with
  or without an entry, just as a raw id linking to a dead `/quiz/<id>`.

⚠️ **`/api` must never be redirected on the old hosts.** A 308 to another origin is not a redirect a
browser follows for an XHR: it returns an `opaqueredirect` and the call fails. Carving the pages out
of the redirect without carving out `/api` silently killed both the beacon and the footer's visitor
count on sourceoftruths.com. `middleware.js` exempts `/api/` for this reason. Likewise the SOT_PATHS
check is a PREFIX match, so a page's sub-routes (the poster) stay on the same host.

### The breakdown PDF

`/<page>/breakdown` is the whole board with every source column, built by hand in
`lib/gridiron-pdf.js` (no PDF library; see the file header for why). **It PAGINATES rather than
shrinking to fit** (2026-09-04): row height is a fixed 12pt and the board runs onto as many US
Letter pages as it takes, 3 for the FBS and 1 for the NFL. The old single page worked only because
50 rows needed a 14pt row; 138 would need 4.6pt, smaller than the type sitting in it. Page 1 carries
the full masthead, later pages a slim repeat, and **every page repeats the column header**, because
a source column with no name over it is unreadable on page 3. Each page's footer states the rank
range and `page N of M`.

### The one-pager

`/<page>/poster-image` renders the entire board as a single PNG, linked from a Download button on
each page. Shared renderer in `app/gridiron-poster.jsx`.

**The sheet grows SIDEWAYS, not downwards** (2026-09-04). The column is a fixed 600px and the sheet
takes `min(4, max(2, ceil(n/50)))` of them, so a row renders identically at any depth: 1200x1140 for
the NFL's 32, 1800x2608 for the FBS's 138. Two columns at 138 would be 69 rows a side and a
1200x3758 ribbon, which no feed renders and nobody reads. Do not "fix" the tall sheet by shrinking
the rows.

- **No team logos, deliberately.** Satori fetches every remote image at render time, so fifty of
  them make the route slow and give it fifty ways to fail, and fifty 26px marks read as noise at
  this size. Rank, team and score carry the sheet.
- **Colours are literal hex, never `var()`.** Satori does not resolve CSS custom properties and
  drops them silently. Same constraint the list poster route documents.
- Satori is **flex-only**: no CSS grid, and every element with children needs an explicit
  `display: flex`.

---

## 7. Weekly build checklist

0. **v2:** pull this season's completed games and the current week's lines (section 3, the two
   added feeds), splice them into `block.games` / `block.lines`, set `block.week` to the ESPN week
   whose games are NEXT, stamp `gamesAt` / `linesAt`, and run `node scripts/verify-gridiron.mjs`.
   The verifier fails on an unresolved NFL id, a duplicate game, a CFB game with no registered
   team on either side, a pillar share that does not follow the ramp, or a composite that is not
   the weighted sum the shares say it is. A brand-new FBS program needs a registry row with its
   ESPN id first; anything unregistered pools into the FCS node and never reaches the board.
1. Fetch every registered market and model source; run the per-source gate (§5) on each.
2. Resolve all team names; abort any source with an unresolved name.
3. Compute the composite (`lib/gridiron.js`), including tier renormalization and the solo cap.
4. Diff against last week's snapshot; run the publish gate (§5).
5. Write `data/gridiron/<sport>-<season>-w<week>.json` with the composite, every source's raw
   column, each source's as-of date, and the list of excluded sources with reasons.
6. Validate: `node --input-type=module --check < <file>` on any edited `lib/*.js` (plain
   `node --check` is a **no-op on an ESM file** — see `CLAUDE.md`). **A page script built inside a
   template literal is parsed by nothing at build time**: a duplicate `const` shipped a completely
   blank table once, with no error raised anywhere. Any builder that emits a `<script>` must
   `new Function(script)` it and refuse to write on a throw.
7. One commit, one push, spliced onto a `FETCH_HEAD` copy taken in the same step (the stale-base
   rule in `CLAUDE.md` applies here exactly as it does to `lib/data.js`).
8. After the Vercel deploy is live, ping IndexNow for `/rankings/cfb` and `/rankings/nfl`.
9. Verify on the live site that the week stamp advanced and no source shows an unexpected stale flag.

---

## 8. Open items

- [ ] **MLB: re-fit `runsPerLogit`, `brK`, `hf` and `hbt` every January** from the completed season.
      All four are run-environment constants and all four move with the ball.
- [ ] **MLB: the models pillar carries 35% on reasoning alone** (§2e). Nobody archives weekly
      FanGraphs / PECOTA / DRatings, so it has never been backtested. If an archive ever exists, or
      if one is started now by keeping each week's snapshot, measure it.
- [ ] **MLB: revisit the market window in the preseason.** Ten weeks of decaying lines is right in
      September and undefined in April; the first three weeks of a season will need the same kind of
      thin-graph care the football spread path already documents.
- [ ] **MLB: the futures board is unscored but still fetched.** If it stays collapsed all season,
      consider dropping the column rather than rendering a source that separates 30 teams into 15
      prices. Re-check it in April, when a futures board is at its widest.
- [ ] **A fourth MLB model would end the solo risk.** Three are live (FanGraphs, PECOTA, DRatings);
      two going stale at once would trip `soloScale` and hand half the models' share to the market.

- [x] ~~Store the analytics models at their PUBLISHED depth, not the top 50~~ **DONE 2026-09-08**:
      all four CFB models ship 138 deep and nothing reads `off board` (§2d). Keep it that way.
- [ ] Re-verify the futures board stays at 138 entries on the next weekly build; it is the only
      market signal most of the board has.

- [ ] Register a collegefootballdata.com key and add SP+, SRS and Elo (§3). Drop F+ if SP+ is added.
- [ ] Wire CFP poll 21 with a tolerated 404 before the committee's first release in early November.
- [ ] Re-test CBS NFL power rankings in the first week of September; it has not refreshed past its
      April post-draft edition.
- [ ] Wire PFR SRS for the NFL — it is empty until Week 1 and then becomes the most durable model
      source available.
- [x] ~~Rule the CFP weighting question~~ Moot since v2 (2026-09-01): polls are not scored.
- [ ] Decide whether AP / CFP return as UNSCORED reference columns (owner call; off by default).
- [ ] Register the collegefootballdata.com key: it also supplies `/games` and `/lines` in one call
      each, which would replace the two ESPN ingests for CFB and add SP+.
- [ ] Re-run the 2025 backtest with real weekly FPI / SP+ once an archive exists (the Elo proxy is
      the one substitution in the numbers above).
- [ ] Un-suppress the ESPN SOR column once `accomplishmentrank` populates, ~Week 3.
- [ ] Re-verify the CFP official site parser in early November; it was redesigned 2026-08-27 and its
      record strings render mangled (rank and team name are clean; records are not).
