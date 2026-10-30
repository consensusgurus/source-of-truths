# Trivia gauntlets and banks

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Trivia gauntlets and banks: Atlas, Sport, Biz, Foodie, Quotes, Valet, Math, English, Polymath, Sci/Art/History, Potluck, recycling, the gauntlet stage

## EVERY GAUNTLET QUESTION PLAYS ON THE GAUNTLET STAGE (owner, 2026-10-23)

Owner, 2026-10-23, after Aorb's play screen: "I want all gauntlet questions to look just like this. A
counter can run below, but otherwise this simple." Then: "each color category of the gauntlet itself will
match background", "it needs to use the pastel colors", counter "clock and standing but subtly".

- `app/GauntletStage.jsx` draws one full-viewport stage: the question, the answers as cards, and one quiet
  line below (a thin clock bar plus text). Ground = the bank's PASTEL ladder step (`rampFor` in
  `lib/circuits.js`), and every element is `RAMP_INK`, never white. It only draws: the host keeps timing,
  scoring, keys 1 to 4 and what a wrong answer does, and the old board still renders underneath it.
- The runs (`app/circuits/[id]/run/RunClient.jsx`, TOWERS circuits: Trivia Gauntlet, Trivia Encore, Math,
  English) draw it from `rampFor(sec.slot)`, with the clock, the section count and "if you stopped here
  #N of M" below.
- The twenty gauntlet dailies (Streak, Atlas, Sport, Biz, Quotes, Script, Sci, Art, History, Deep; Gram,
  Vocab, Spell, Origin, Idiom; Gap, Series, Back, Blitz, Blitzed) draw it from
  `rampFor(circuitSlotFor(<run>, <key>))`, with the clock and the question count below (no live standing
  on a daily yet). Wired by `scripts/wire-gauntlet-stage.mjs`; a new gauntlet daily gets the same block.

## Atlas: the daily geography gauntlet (launched 2026-08-25)

Streak's shape at twenty-five: five tiers of five, one life, twenty seconds a question,
everyone plays the same twenty-five in the same order. Key `atlas`, route `/atlas`.

- **Every tier block cycles the SAME five subjects in the SAME order:** Capitals, Physical
  World, Flags and Borders, Places and Landmarks, Countries and Peoples.
  `scripts/verify-atlas.mjs` enforces the tier ramp AND the subject cycle, so a day cannot be
  authored out of order.
- **It is filed in TWO categories on purpose (owner, 2026-08-25).** `lib/daily-games.js` gives
  each game exactly one `cat`, and Atlas's is `Geography`, which is what the slate filter strip
  and the tile chip read. It is ALSO listed in the `trivia` key list in `app/DailyGamesGrid.jsx`
  and `app/daily/DailyArchiveClient.jsx`, so the more-games grid and the archive surface it
  under Geography and Trivia both. A game can sit in two of those key lists; it cannot yet sit
  in two registry categories, and nobody has needed that engine change. It is also in the
  **Gauntlet** circuit, which is now four games rather than three (share copy counted).
- **No Sunday Edition**, matching its two siblings Streak and Deep, so no entry in
  `lib/sunday-editions.js` and the verifier FAILS any day flagged `sunday`.
- **Scoring follows Streak exactly:** Atlas is in `XP_LINEAR_DAILIES` (a battery of independent
  questions pays linearly, so twenty right is twenty right) and shares Streak's `dailyAnswered`
  branch in `lib/quiz-scoring.js`, graded out of cleared + 1 because the player also faced the
  question that killed them. Deep and Blitz are in NEITHER, which reads as an oversight rather
  than a decision; both were left alone because changing them re-scores history.
- **Bank: 30 days, 2026-08-25 to 2026-09-23, 750 questions.** Extend it by authoring days in the
  same shape and re-running the verifier.

**How the bank was built, and the two things worth repeating.** It was authored one SUBJECT at a
time (five passes of 150, one per lane) rather than one day at a time, which is what keeps a lane
free of internal duplicates. Then:

1. **The day a question lands on is free, so optimize it.** Within a lane, the tier-N questions
   are interchangeable across days, so a local search permuted the day assignment until no day
   carried the same answer twice. Twelve same-day collisions went to zero without rewriting a
   single question.
2. **The real defect was the same FACT asked twice in two different lanes**, on two different
   days: Angel Falls, the Nile at Cairo, Victoria Falls, Kilimanjaro, Pompeii and nine more, all
   invisible to a duplicate-STEM check because the wording differed. The verifier now WARNS on
   any two questions that share an answer and one distinctive word. Most of those warnings are
   false positives, since the same country is a fair answer to several genuinely different
   questions, so read them rather than chasing zero.

## Sport: the daily sports gauntlet (launched 2026-08-25)

The third game on Streak's shape, alongside [Atlas](#atlas-the-daily-geography-gauntlet-launched-2026-08-25).
Twenty-five questions, five tiers of five, one life, twenty seconds each. Key `sport`, route
`/sport`, launched the same day as Atlas.

- **Five lanes, cycled in the same order every round:** NFL, NBA, MLB, Soccer, Everything Else.
  The fifth lane carries the Olympics, tennis, golf, hockey, boxing, motorsport, cycling,
  athletics, college sports, cricket and rugby, and the other four authors are fenced out of it.
  `scripts/verify-sport.mjs` enforces the tier ramp AND the lane cycle.
- **It is a TRIVIA game in the registry, not a Sports one (owner ruling, 2026-08-25).** The roster
  has no Sports category and one game does not make one, so Sport files under Trivia everywhere:
  the registry `cat`, the slate filter, the grid and the archive. If a second and third sports
  daily ever ship, that is the moment to add the category, and the work is the same shape as any
  other: `CAT_COLOR`, `CAT_GLYPH`, `catBlue` in lib/home-blues, the two key lists, and `FILL_DEPT`.
- **No Sunday Edition**, matching Streak, Deep and Atlas. The verifier fails any day flagged
  `sunday`.
- **Scoring matches Streak and Atlas:** in `XP_LINEAR_DAILIES`, and in the shared `dailyAnswered`
  branch graded out of cleared + 1. That branch now reads `key === 'streak' ? 40 : 25`, so a
  fourth game of this shape only needs its key added to the two conditions.
- **The Gauntlet circuit is now at its cap of five** (deep, atlas, sport, blitz, streak) and its
  share copy counts them, so a sixth game of this shape cannot join without converting the
  circuit to a rotating pool.
- **Bank: 30 days, 2026-08-25 to 2026-09-23, 750 questions.**

**THE RULE THIS BANK LIVES BY: EVERY FACT IS FROZEN.** A sports question is the easiest kind to
write and the easiest kind to rot, because the answer sits in the world and keeps moving. Banned
outright when authoring: a career total or "most ever" held by anyone still competing, a current
champion, a current record holder, a team's current coach or roster, and any league's live team
count. Allowed: a completed dated event, a retired player's final total, a franchise founding or
relocation, and a rule that has stood for years. The two league-size questions that did ship were
pinned to their expansions ("since the 1998 expansion", "since the Houston Texans joined in 2002")
rather than left live, and that phrasing is the pattern to copy.

The fact-check pass over the first bank found thirteen problems in 750 questions, and the useful
thing is WHICH kinds: two live league counts, four wrong numbers or dates that read perfectly
plausibly (Shula's 347 is his total including playoffs, not his regular-season 328; Frank Robinson
was hired in October 1974 for the 1975 season; Penarol won the first TWO Libertadores, not three in
a row; the USA's 1950 win over England was not its first World Cup), one wrong superlative (Eusebio,
born in Mozambique, beat Weah to the first African-born Ballon d'Or by thirty years), and three
questions whose stem referred to "that championship" with no antecedent. None of those is visible
without checking each figure, so budget for the pass rather than trusting the authoring.

## Biz (`/biz`) — the daily business gauntlet (launched 2026-08-27)

The fourth game on Streak's shape, after Deep, Atlas and Sport, and the eleventh Trivia daily.
Twenty-five business questions a day in **five tiers of five**, one life, twenty seconds a question,
score = questions cleared. Key `biz`, route `/biz`, category **Trivia**, accent `#0f5132` (ledger
green), navy `#4fbf8b`. Bank: **30 days, 2026-08-27 to 2026-09-25**, 750 questions.

**The five lanes, cycled in this order inside every tier block:** Brands & Products, Markets &
Money, Founders & Bosses, Deals & Disasters, Business History. The lane set is the owner's
("all of the above" across three proposed sets, 2026-08-27), folded into the five slots the shape
allows: advertising and logos sit in Brands, Wall Street and economics in Markets, tech founders in
Founders, antitrust and frauds in Deals, and industry, labor and trade in History.

**No Sunday Edition** (matching Streak, Deep, Atlas and Sport), and `scripts/verify-biz.mjs` FAILS
any day flagged `sunday`. It is deliberately absent from `lib/sunday-editions.js`.

**THE RULE THIS BANK LIVES BY: EVERY FACT IS FROZEN, and business needs it more than any other
category**, because the answer keeps moving in more ways than one. Banned at authoring: who
currently runs or owns anything, current prices, revenues, market caps, rankings or store counts,
any present-tense superlative, any pending deal, any case still on appeal, and any index membership.
A superlative worth asking gets pinned in the stem instead ("what was then the second largest",
"the best selling model of the 1990s"). Nothing later than the 2024 calendar year.

**The authoring pipeline is Atlas's and Sport's**, and it is worth repeating exactly:

1. **Five subagents, one per LANE** (150 questions each, 30 per tier), never one per day, so no lane
   can duplicate itself. They return `{tier, q, answer, wrong[3]}` with the answer kept SEPARATE
   from the distractors, so the build assigns positions and no authoring bias reaches the columns.
2. **A mechanical audit before assembly.** The leak check that matters is not "is an answer word in
   the stem" but "is an answer word in the stem AND not shared by all three distractors": the first
   flags every legitimate "what kind of X" question, the second flags only real giveaways. That
   distinction cut 36 flags to about 20 real ones. Also dedupe answers, and separate a same-ANSWER
   pair (fine, Apple is the fair answer to five different questions) from a same-FACT pair (a defect:
   two questions both saying Disney bought Pixar).
3. **Day assignment is free**, so a local search permutes it until no day carries the same answer
   twice and no day carries one question's answer inside another's stem. Cost 572 to 76, zero hard
   collisions, without rewriting a question.
4. **Correct positions from a per-day balanced no-3-run sequence** (7/6/6/6 over the four columns),
   never independent shuffles.
5. **Two fact-check subagents over halves of the bank.** They found **24 real problems in 750**, and
   the KINDS are the lesson: nine plausible-looking wrong facts (Tab Clear 1992 not 1993, KKR won
   RJR Nabisco in 1988 not 1989, Knight Capital lost 440 not 460 million, Goizueta 1981 not 1980,
   Bradham was a North Carolina pharmacist not a Virginia one), four ownership claims that had
   quietly rotted (Toblerone is Mondelez not Cadbury, and the December 2025 Unilever ice cream
   demerger took Ben and Jerry's and Magnum out of Unilever), three questions with a second
   defensible answer, and one stem that answered itself. None is visible without checking each
   figure. **Always budget for the pass.**

`scripts/verify-biz.mjs` is Sport's verifier retargeted, and it gates the same things: unique ids,
four distinct choices, no stem containing every distinctive word of its answer, the tier ramp, the
lane cycle, contiguous dates, the quizId matching its live date, the column spread and no 3-run, and
no day carrying the same answer twice. It WARNS on any two questions sharing an answer and a
distinctive word, which on this bank is 17 pairs, all read and all genuinely different facts.

Wiring ran as `scripts/wire-biz.mjs` (34 anchored edits across 21 files) off a same-step
`git archive FETCH_HEAD` export, copied from `wire-encore.mjs` with the corrected idempotency
helper. Beyond the standard registries it also needs the two SCORING ones that the gauntlet shape
implies, which are easy to miss: `XP_LINEAR_DAILIES` in `lib/quiz-xp.js` and the `dailyAnswered`
branch in `lib/quiz-scoring.js` (`asked = key === 'streak' ? 40 : 25`).

**Not in a circuit.** Gauntlet is the circuit Biz belongs to by shape and it is AT ITS CAP of five
(deep, atlas, sport, blitz, streak) on a fixed roster, so a sixth cannot join without converting it
to a rotating pool. Its copy does not claim to be exhaustive, so nothing goes stale. Whether Biz
should take a slot is an owner call. Also NOT in `lib/daily-five.js`, whose hand-picked bank ran out
on 2026-09-13.

## Foodie (`/foodie`) and the nine-bank trivia rotation (owner, 2026-10-26)

Food and drink left Art and became its own daily trivia gauntlet, **Foodie**, live
**2026-10-27**. Same shape as Art, Sci and History: twenty-five questions, five tiers of five,
one life, twenty seconds a question. Key `foodie`, Trivia, accent `#c2410c`, no Sunday Edition.

- **Lanes:** World Dishes, Ingredients, Drinks, Kitchen Craft, Food History, in that order in
  every tier block. Bank built by `scripts/gen-foodie.mjs` from `scripts/foodie-lanes/`, gated by
  `scripts/verify-foodie.mjs`. 35 days to 2026-11-30.
- **It began with Art's 240 Food & Drink questions**, every one reused verbatim and tagged
  `was: 'art:<id>'`; the rest were authored new. The ones players had already seen on Art
  (10-14 to 10-26) were placed on Foodie's later days.
- **Art's fifth slot is no longer food.** From 2026-10-27 (`ART_FIFTH_FROM` in gen-art and
  verify-art) the fifth question of each round comes from Art, Music, Books or Architecture &
  Design, drawn from new questions (`scripts/art-lanes/art-fill.mjs`) and the unseen arts
  reserve. The lane file keeps its name, `art-food.mjs`, so the frozen days rebuild byte for byte.
- **The rotation is NINE banks from 2026-10-27** (`TRIVIA_POOL`, `FOODIE_FROM` in lib/circuits.js):
  the Gauntlet still deals Streak, Deep and five of the pool; the **Encore now takes four**. The
  window restarts on 10-27 over the nine; days before keep the eight-bank cycle (`TRIVIA_POOL_V1`).
  `scripts/verify-circuits.mjs` mirrors both eras. Foodie sits LAST in both circuits' `keys` so
  no other bank changed its stage colour; it takes an eleventh ladder step (peach `#fdba74`).
- **`LAUNCH_DAILY` in lib/daily-games.js** keeps a game shipped ahead of its first drop off every
  roster until that Eastern date (`isUnlaunchedDaily`, folded into `isRetiredDaily`; the archive
  skips it rather than shelving it as retired). Use it for any future game pushed a day early.
- Encore copy everywhere says four (the run page metadata, RunDoorPop, EntryDoor, the circuit
  blurb and share lines, the Encore title ladder rescaled to 100 asked, the trophy reads "every quiz").

**Deep's topic on the stage (same push):** `GauntletStage` takes a `kicker`, a faint uppercase line
above the question. Deep passes its day topic, on its own stage and inside the Gauntlet run.

## Atlas: a geography question needs a PLACE in it (owner, 2026-09-02)

Reported as "why was there a question about precipitation in Atlas today?" Day 9 served
*"Rain, snow, sleet and hail are all forms of what?"* in the Physical World lane. It is
meteorology vocabulary: no place, no map, no landform, nothing a geography player knows that
a general-knowledge player does not. It was not a one-off. An audit of all 1,025 questions
found the same shape four more times (ocean tides, plate movement, epicentre, divergent
boundary), all in the same lane and all at tier 1 or 2.

**The test, for this bank and any future one: does answering it require knowing something
about a PLACE, a MAP, a LANDFORM, a COUNTRY, or the shape of the Earth's surface?** Genuine
physical-geography vocabulary passes and is what the lane is for (isthmus, fjord, delta,
atoll, tundra, savanna, glacier, peninsula, equator, prime meridian). A weather word, a
physical cause or a seismology term with no place attached does not. Note the contrast the
bank already gets right: `d18q17` (the Nazca Plate subducting under South America) and
`d19q17` (the Pacific Plate and the Ring of Fire) are the same subject done properly,
because they name a place and are map facts.

**Days 1 to 9 are played and FROZEN, the reported question included.** Eleven questions on
day 10 onward were replaced in the same pass: the three remaining off-subject ones, one whose
answer has rotted (Malabo, with Equatorial Guinea's seat of government moving inland to
Ciudad de la Paz, so the question is at best contested and picking a side of it is not ours
to do), four that gave themselves away (`the leone` → Sierra Leone, `Namibia` → Namib,
`Transjordan` → Jordan, `carved out of Sudan` → South Sudan), and three phrased as live
rankings (busiest port in Europe, busiest port in Germany, largest city in Central Asia).
Every replacement keeps its slot's cat, tier and **correct index**, because `verify-atlas`
checks each day's column balance and its no-three-in-a-row rule and moving an answer between
columns breaks both; where the fault was only in the wording the choices were kept too, which
is also what guarantees no new same-day answer collision.

**What the machine cannot check, and what this cost.** `verify-atlas.mjs` passed on every one
of these the whole time: none of them is a structural fault. Off-subject, rotted and
self-answering are all judgement, and the only gate for judgement is somebody reading all
1,025. Do that as part of authoring a bank, not after a player reports one.

## The 2026-09-02 gauntlet sweep, and the four checks every bank is missing

The Atlas precipitation report was not one bad question. Auditing all six other gauntlet banks
question by question (8,540 in total: atlas 1,025, sport 1,025, biz 975, deep 1,575, streak
2,440, script 750, quotes 750) turned up the same four defect classes in every one of them, and
**every bank's verifier passed the whole time**, because all four are semantic and none is
structural. 92 questions on future days were replaced in one pass.

**What the sweep found, in order of how often it appears:**

1. **DUPLICATE FACT, usually asked from opposite sides.** By far the commonest defect: 23 pairs
   in Biz, 13 in Sport, 8 in Deep, 8 in Atlas. "Which league do the San Francisco Giants play
   in?" on one day and "Which National League team plays in San Francisco?" on another. No
   verifier catches these: the exact-text check needs identical wording, and the shared-answer
   warning only fires when the two ANSWERS match, which is precisely what a mirrored pair breaks.
2. **ROTTING FACT.** A present-tense superlative, a live record, a current holder or an ownership
   claim. Sport and Biz both have a written "every fact is frozen" rule in their own headers and
   both broke it: "the most in NFL history", "the world's largest container line", "which country
   has won the most World Cups". The fix is almost always a STEM rewrite that pins the same answer
   to a completed event, which is also the cheapest kind of fix (see below).
3. **SELF-ANSWERING.** The answer's distinctive word sits in the stem, or a category word appears
   in only the correct choice. The existing giveaway checks catch a stem containing the answer
   whole; they miss a stem sharing ONE proper noun with it, which is the real-world case.
4. **OFF-SUBJECT.** A question that does not belong to its bank or its lane at all: a weather
   word in a geography lane, a nuclear accident in a business lane, a hockey question in a
   soccer-and-everything-else lane, 88 plain-history questions in a bank about quotations.

**Two hard errors in 8,540, both worth knowing.** Deep asked which player holds the World Cup
goalscoring record and keyed Klose; Messi passed him seven weeks before that day was played, and
the true answer was not among the four choices, so the question was unanswerable on the day it
ran. Streak asked for the largest country in the Americas "by land area" and keyed Canada, which
is the standard gotcha: Canada leads on TOTAL area, the United States on LAND area, and the United
States was one of the choices. Both are the same shape, a stem whose wording the author did not
check as carefully as the answer.

### The rules for fixing one

- **THE PAST IS FROZEN.** Every bank's played days are left exactly as they shipped, the reported
  precipitation question included. Fix from the first unplayed day forward and say so.
- **KEEP THE `correct` INDEX.** Each bank's verifier checks the day's answer-column balance and a
  no-three-in-a-row rule, so moving an answer between columns breaks the day. `scripts/` has no
  helper for this; the one used here asserts it and refuses an edit that moves the index.
- **PREFER A STEM REWRITE THAT KEEPS THE ANSWER.** It cannot introduce a same-day answer
  collision, it cannot move the column, and it is the whole fix for every rotting fact and every
  self-answering question. Reserve a full replacement for off-subject and duplicate questions,
  where the fact itself has to go.
- **A NEW QUESTION MUST BE CHECKED AGAINST THE BANK BEFORE IT IS WRITTEN, NOT AFTER.** Six of the
  eight fresh Atlas questions written in this pass duplicated something already in the bank on
  the first attempt (Christ the Redeemer, the Silk Road at Bukhara, Lithuania between Poland and
  Latvia, the capital of Norway, Panama between Costa Rica and Colombia, the yen). These banks are
  dense: at 1,000 questions the obvious fact about a country is already in there. Grep the
  distinctive word first.
- **A REPEATED ANSWER IS FINE; A REPEATED FACT IS NOT.** "France" is the honest answer to five
  different questions. What is banned is the same nugget twice, and the tell is a shared
  distinctive word in the two stems rather than a shared answer.
- **FACT-CHECK THE REPLACEMENTS AS A SEPARATE PASS.** 12 of the 93 questions written in this pass
  had a problem, found only because they were checked by fresh eyes against sources afterwards:
  a false stem (the Philippines' official language is Filipino, not Tagalog; the ICC was founded
  in Atlantic City and only based in Paris; the Sky Tower was the tallest FREESTANDING structure),
  a second defensible answer (Nepal also lies between India and China), and twice a choice list
  still containing the city the new stem now named, so the question offered an impossible option.
  Writing the fix and checking the fix are two different jobs; do not merge them.

### The four checks worth adding

None of these exists in any bank's verifier today, and each would have caught a whole class above:

1. **Cross-day mirrored duplicates.** For every pair of questions, warn when one's ANSWER appears
   in the other's STEM. That is the mirrored-pair signature and it is a two-line check.
2. **One-choice-only stem words.** For each word in the stem longer than three characters, warn if
   it appears in exactly one choice and that choice is the correct one. About 30 hits per 1,500
   questions, of which a third are real.
3. **A live-superlative word list.** Warn on a stem carrying "holds the record", "the most", "is
   the largest / longest / highest", "remains", "currently", "as of", unless a year or a date
   range also appears in the stem. That alone flags the Klose question before it ships.
4. **A choice that the stem already names.** Fail when any choice string appears verbatim in its
   own stem: it is never a real option and it tells the player the setter was padding.

## Quotes had a 12% tail with no quotation in it, and the tail is where a bank rots

The same 2026-09-02 sweep found the worst single defect on the site's newest bank. **88 of the
750 Quotes questions, 11.7%, contain no quotation, no paraphrased utterance and no written
work.** They are plain history, science and biography trivia sitting in a bank whose entire
premise is the attribution of words: *"Which president appears on the American one dollar
bill?"*, *"Which barrier divided a German city from 1961 until 1989?"*, *"Which war ended with
the armistice signed on 11 November 1918?"*

**The distribution is the whole lesson.** Days 1 to 25 are 94% on subject. Days 26 to 30 are
**42% off subject, 52 of 125**. The author did not lose the plot; they ran out of quotations and
padded the tail. That is what a bank's last days look like whenever the supply of the thing the
game is actually about runs thinner than the schedule, and it is invisible to every checker,
because a padded question is perfectly well formed.

**So: audit a bank's LAST days first.** The tail is where the authoring effort was thinnest and
where the off-subject padding collects, and it is also the part nobody has played yet, so it is
the only part that can still be fixed. Days 26 to 30 were rebuilt here; the 36 scattered through
days 1 to 25 are mostly played and frozen.

**The subject almost always has a real line available.** Every replacement kept its lane, its
tier and usually its subject, and only changed what the question turns on: the dollar-bill
question became Washington's letter to the Newport synagogue, Mendeleev became the dream he is
SAID to have described to a friend, Nightingale became her line about never giving or taking an
excuse. Where no unbanked quotation existed for a subject (the Berlin Wall, the Anglo-Zulu war),
the subject changed rather than the question staying padded.

### Script and Quotes are GENERATED. Never edit their questions.js

Both banks are built by `scripts/gen-mcq.mjs` from `scripts/script-source.mjs` and
`scripts/quotes-source.mjs`, and their headers say so. Edit the SOURCE and rebuild:

```
node scripts/gen-mcq.mjs script scripts/script-source.mjs app/script 2026-08-30
node scripts/gen-mcq.mjs quotes scripts/quotes-source.mjs app/quotes 2026-08-30
```

Two properties make this safe, and both are worth knowing before touching either file. The
correct answer's POSITION is never authored: the generator derives it from a per-day column plan
that depends on the day number and slot alone. And the distractor shuffle is seeded on the
question's ID, not its text. So **rewriting `q`, `a` and `d` leaves every correct index exactly
where it was**, which is what lets a source edit pass the column-balance and no-three-in-a-row
checks with no thought at all. A rebuild of an unchanged source is byte-identical, so the
generated diff is exactly the entries you edited and nothing else.

**The source has no ids**, which makes anchoring an edit awkward. Key the edit by the GENERATED
id, look that id's question text up in `app/<key>/questions.js`, and use that text to find the
source entry. Anchoring on the generator's own output is the only anchor that cannot drift,
and normalise both sides: `esc` folds curly quotes and en dashes on the way out, so the source
and the bank do not always read identically.

## The Valet Gauntlet (`/valet`, `/circuits/valet/run`): the jam ladder on ONE CLOCK (launched 2026-09-05)

Circuit id **`valet`**, name **Valet Gauntlet**, roster `park`, `impound`, `junkyard` in ascending
board size, `run: true`, **`engine: 'jam'`**, **`score: 'time'`**, trophy `circuit-valet` ("Keys,
Please", silver, `Car`). It is a circuit in the code and "the Valet Gauntlet" to a reader, exactly
as the Trivia Gauntlet is; `/valet` forwards to the run like `/trivia` does.

- **A SECOND RUN ENGINE.** `RUN_ENGINES` in `lib/circuits.js` maps `quiz` to `RUN_GAMES` and `jam`
  to `JAM_RUN_GAMES`; `runEngine(id)` / `runGamesFor(id)` answer which engine deals a circuit and
  what it can hold. `app/circuits/[id]/run/page.js` branches on the engine: the jam branch resolves
  the three banks (`LOTS`), ships only today's boards, and renders `app/circuits/ValetRunClient.jsx`.
  `scripts/verify-circuits.mjs` check 1 fails a runnable circuit holding a game its engine cannot
  deal, and check 12 requires a `'time'` circuit to be the jam run over `JAM_RUN_GAMES` only.
- **THE BOARD IS THE CLOCK, NOT THE MOVES.** `rankByTime` in `lib/daily-combined.js`: `total`
  becomes LOTS PARKED (a row not abandoned and scored above zero; a give-up files 0), `timeTotal`
  the combined clock, `parkedAll` whether every member parked; sort parked desc, clock asc. Applied
  by `/api/quiz/daily-combined` and `/api/quiz/daily-history` when `circuitScoreMode(id) === 'time'`,
  payload `scoreMode: 'time'`, `maxTotal` = member count. The registered board's tie key folds in
  `timeTotal` on `time` AND `correct` boards (every full Valet run has the same `total`). The
  all-games rank gate also requires `score > 0` per member on the clock board, and a clock day is
  crowned by a FULL run only. Each lot still pays its own ladder, best-N, crown and IQ Points: this
  is a board rule, not a scoring change, same safety as the questions-right rule above it.
- **THE RUN FILES EXACTLY THE SOLO ROWS**, one per lot: par-graded `score`, `guessesUsed` = moves,
  `timeElapsed` = that lot's own clock (dealt to parked; the handover is not on the clock), and the
  four local writes in the solo client's own save shape (`sot_<key>_<num>` with `moves`/`status`/
  `t0`/`tEnd`, the day breadcrumb, `_rec_`, the stats record), so `/parker` opened afterwards
  restores the finished board. A lot already finished today is banked off its save (`tEnd - t0`).
- **`app/circuits/JamBoard.jsx`** is the shared lot drawing (size and exit row as props, selection
  its own state, moves the caller's via lib/jam-core). The three solo clients keep their own copies
  deliberately; the run needed one board that takes its size as a prop, not a refactor of three
  live games. **`app/circuits/ValetScene.jsx`** is the picture, and THE PICTURE IS THE BOARD
  (owner, 2026-09-05, after calling the first valet-and-car cartoon corny): a miniature lot with a
  few muted blocks, the red bar and the lit exit, stepping up 6 to 7 to 8 between lots, with the
  valet reduced to a corner mark (circle plus sunglasses bar). `arrive` rises the lot in and pulses
  the exit, `depart` clears the blocker and slides the red bar out through the exit, `park` lights
  the three lots in turn; every mode has a resting pose under prefers-reduced-motion. It takes
  `sizes` and `step` from the run so the ladder is the real one. One SVG on a fixed viewBox scaled by
  width is what makes it render at every size; travel distances are per-element custom properties
  read inside the keyframes. CSS animation REPLACES an element's `transform` attribute, so anything
  positioned by attribute is wrapped in a plain `<g>` before it is animated.
- **THE POP-UP (`app/circuits/ValetDoorPop.jsx`)** on Parker, Impound and Junkyard fires on the
  START GATE of today's board, when none of the three lots has been started today on this device
  (the `sot_<key>_day` breadcrumb), and **TWICE EVER** (`sot_valet_pop` counts showings; taking the
  run spends both), never while a run is open today. Owner ruling 2026-09-05.
- Unit-aware surfaces read `scoreMode === 'time'` / `circuitScoreMode(id) === 'time'`: the circuit
  landing, `/daily-five?circuit=valet` (`CircuitScorecard` takes `board.clock`), the legacy home's
  circuit board, and `circuitShareResult` (`secs` stat, `fmtClock`). Medians for impound (150) and
  junkyard (240) in `verify-circuits` are ESTIMATES; re-measure at the next snapshot.

## Recycling unanswered trivia questions (owner, 2026-10-09)

Every trivia gauntlet is one life in a fixed order, so a question deep in a day is seen only by
the players who get that far, and on most days nobody does. On the 2026-10-09 snapshot about
**2,450 questions already dealt on played days had never been answered by anyone**: Streak 867,
Quotes 456, Biz 336, Sport 252, Script 254, Atlas 204, Deep 83, nearly all in tiers 3 to 5. To
every player those are new questions. **They are dealt again instead of authoring replacements.**

**Never answered, exactly.** `/api/quiz/board` reports `best`, the top score anyone recorded on
the day (daily, archive and Gauntlet run plays all post under one quizId). On a day whose best is
B, questions 1..B were answered right and B+1 was the miss that ended the best run, so it was
SEEN. Only positions **B+2 and later** are in the pool. The day must be at least 14 days old on
the snapshot, because a day still being played has not finished showing its questions.

**The rules** (enforced by `scripts/trivia-recycle.mjs`, called from each game's verifier):

1. A recycled entry carries `from: '<game>:<id>'` in the authored source (streak-source.mjs,
   quotes-source.mjs, script-source.mjs, the atlas/sport/biz lane files). The generators carry
   it into `questions.js`. It is the ONLY repeated question text a verifier allows.
2. **Same game, same lane, same tier.** The tier is the difficulty the question was written to;
   the lane keeps the day's lane cycle.
3. **Same stem, same answer** as the original as it stands now. Distractors may be improved.
   A wrong original is fixed in place too (content errors on played boards are fixed, owner
   2026-10-08).
4. **Each original is recycled once.** If the copy also goes unanswered, recycle the copy.
5. **Deep is the exception.** Deep is one topic a day, so its unanswered questions cannot go
   back into Deep. They go to **Streak, tier 5 only (the very end of the forty), at most two a
   Streak day**, in whichever Streak lane fits. The stem may be rewritten and usually must be:
   Deep stems lean on the day's topic ("the weighing of the heart", "the city on the Tiber").
   The answer may not change.
6. **Every rule of the receiving bank still applies**: US spellings, the sports rules cap, no
   expiring facts, the answer cap. Old frozen days predate several of these, so some pooled
   questions will fail. Skip them; never loosen the rule for a recycle.
7. **Content review still applies.** A recycled question is re-read like new copy
   (scripts/CONTENT-REVIEW.md); the 2026-10-08 audit found wrong keys on played days, and a
   recycle must not carry one forward. It counts toward the reviewed range like any new board.

**The workflow at restock time:**

1. Pull a fresh snapshot in the browser (the board route is unreachable from a sandbox): fetch
   `/api/quiz/board?quizId=<id>` for every played day of the seven games from any mindloftdaily.com
   page, six at a time, and write `scripts/trivia-recycle/play-snapshot-<YYYY-MM-DD>.txt`, one
   `<quizId>=<best>` per line. Return values from the page in chunks under about 1,000 characters,
   grouped per game (`9.14:22 9.15:17 ...`), or the browser tool truncates them.
   **Never delete an old snapshot**: each recycle is proved against a snapshot dated before its
   copy went live, and an archive player who reaches the original later must not turn a live
   board red.
2. `node scripts/trivia-recycle-pool.mjs` for the summary; `node scripts/trivia-recycle-pool.mjs
   <game> [--tier N] [--lane X]` prints the pool in source shape with `from` filled in;
   `node scripts/trivia-recycle-pool.mjs streak --deep` prints Deep's pool for Streak tier 5 with
   `c: '?'` (the generator refuses `?`, so a lane has to be chosen). Originals already claimed by
   any `from` in scripts/ or a shipped bank are left out. It refuses a snapshot over a week old
   without `--stale`.
3. Fill the hard tiers from the pool, author the rest (mostly tiers 1 and 2, where the pool is
   empty because everyone answers those), generate, verify, content-review.

**Where this changes authoring.** The binding constraint was already tiers 1 and 2 (streak-source.mjs,
"Where the runway ends"). Recycling makes it the only one: the pool refills the hard tiers every
day the field fails to reach them, so authoring effort goes to warm-ups and easy questions.

**Gates.** `scripts/verify-trivia-recycle.mjs` (run by verify-all) parses every snapshot and runs a
selftest proving each rule fires on synthetic banks. Each game verifier runs `checkRecycled` on its
own bank. IQ tests are unaffected: they calibrate only answered questions, and a recycled copy is
a new item under its new day's id.

## The Math Gauntlet (`/math`, `/circuits/math/run`) and Gap, Series, Back (launched 2026-10-09)

The math answer to the Trivia Gauntlet: five Blitz-family dailies dealt as ONE continuous run on
the same run page and RunClient as the trivia run. Circuit id `math`, engine `math`
(`MATH_RUN_GAMES` in lib/circuits.js: blitz, gap, series, back, blitzed; Blitz opens by owner ruling), `score: 'correct'`
(problems right, clock tiebreak), trophy `circuit-math` "Human Calculator" (bronze, Zap). `/math`
forwards to the run like `/trivia` does.

- **Three new dailies, all Numbers, all Blitzed's shape** (problems.js with PROBLEMS/PROBLEM_MAP,
  puzzles.js with twenty qids a day, five rounds of four, one life, twenty seconds, `miss: 'Asked'`,
  no Sunday Edition and no `sunday` field):
  - **Gap**: an equation with one number taken out (`7 × ? = 56`); verify-gap substitutes all four
    options and requires exactly one to hold, every step whole.
  - **Series**: five or six terms then `?`, NO thousands separators (a comma would read as two terms).
    verify-series carries its own rule library (constant step, ratio, second/third differences,
    alternating steps, interleaved, sum of two/three, x·p+q, alternating ×p/+q, growing steps by
    ratio); every fitting rule must predict the answer or nothing on the board.
  - **Back**: `? = <target>` with four LINES of the same shape (same operators in the same order);
    exactly one evaluates to the target. Wrong lines prefer a misread that makes the target (left
    to right, a bracket ignored), then a same-last-digit line, then near misses.
- **Generators** `scripts/gen-gap.mjs`, `gen-series.mjs`, `gen-back.mjs` on `scripts/mathrun-core.mjs`
  (PRNG, Blitzed's anti-sieve chooser, balanced answer columns, day loop, writer). Verifiers share
  NO code with them; their common checks live in `scripts/mathrun-check-lib.mjs` (deliberately not
  named verify-*). Banks run 2026-10-09 to 2026-12-25. Extend with `--from/--days/--startnum --out`
  into scratch and splice; never rebuild a live bank.
- **Clients** are BlitzedClient.jsx transformed (key, copy, a `?` drawn as a dashed blank box, string
  options for Back at 17px, long lines at a smaller size).
- **The run deals each game at its OWN clock**: sections carry `seconds` (Blitz 15, the rest 20) and
  RunClient reads `sec.seconds`. Math sections set the line in figures with the `?` as a blank.
- **Blitz and Blitzed banks end 2026-11-19.** The run drops a game with no puzzle that day, so
  restock both before then or the Math Gauntlet shrinks to three.

## The Trivia Gauntlet race bar scales to the BEST score, not the question count (owner, 2026-10-09)

The track under each run question used to run out of the run's whole question count (~180), so the
field bunched in the left third. Its scale is now `max(best finished total, your live total) / 0.92`:
the leader sits near the right edge, and once you pass them the scale follows you, live, so the You
marker never runs off the bar. Before anyone has finished it falls back to the question count.

## Potluck (`/potluck`): three catalog quizzes a day, turned in when you choose (launched 2026-10-10)

Owner, 2026-10-09: one daily that serves quizzes from the catalog, rotating, a VARIETY of them, and
you do not have to play all three; a Turn it in button rather than a countdown. Key/route `potluck`,
category **Trivia**, `miss: null`, accent `#b4532a` / navy `#f4a582`. Replaced Quiz of the Day and the
Daily Challenge, both unplugged in the same push.

- **The bank** is dated: `app/potluck/puzzles.js`, built by `scripts/gen-potluck.mjs`, checked by
  `scripts/verify-potluck.mjs` (auto-discovered by verify-all). Each day is three quiz ids from three
  different FORMAT FAMILIES (typed / match / visual, `POTLUCK_FAMILY` in `lib/potluck.js`) and three
  different departments, factual only (the Daily Challenge rule), 8 to 50 answers, no quiz twice in
  the bank. The visual family is the scarce one (~94 quizzes), which is what bounds a bank to about
  90 days; extend by re-running the generator with `--from` after the last day and splicing, never by
  rewriting a live day. Stocked 2026-10-10 to 2027-01-07.
- **Only QuizClient formats.** A Potluck quiz plays on its own page as
  `/quiz/<id>?potluck=<num>&i=<slot>`; `QuizClient.endGame` records it with `recordPotluck()` and sends
  the player back. The full-page boards (timed-mcq, place-map, globe, geo-aerial, logic-*, survive,
  higher-lower, closer, connections, grid-fill) post on their own and never report back, so
  `potluckEligible` refuses them. Adding a format family means teaching that board the same hook.
- **Scoring**: each quiz is worth 10, scaled `round(10 x score / total)`, the day is out of 30, the
  summed quiz clocks break ties. One row, `potluck-M-D-YY`, posted ONCE by `turnInPotluck()`
  (the Turn it in button, or automatically when the third finishes). The three ordinary quiz rows
  QuizClient posts are left alone. Graded out of its total in `quiz-scoring` (like Crux) and paid
  linearly in `quiz-xp` (`XP_LINEAR_DAILIES`).
- **Run state** lives in `sot_potluck_run_<num>` and the usual daily contract keys
  (`sot_potluck_<num>` with t0, `sot_potluck_day`, `sot_potluck_stats`), all written by lib/potluck.js.
- Wired by `scripts/wire-potluck.mjs` (beside Quotes in every list) and
  `scripts/wire-potluck-quizclient.mjs`. No Sunday Edition.

## Sci, Art, History and the Trivia Encore (launched 2026-10-14)

Three new trivia gauntlets on Biz's shape (25 questions, five tiers of five, one life, twenty
seconds, `miss: 'Asked'`, no Sunday Edition): **Sci** (`/sci`: Human Body, Space, Chemistry &
Physics, Life Science, Inventions), **Art** (`/art`: Art, Music, Books, Architecture & Design,
Food & Drink) and **History** (`/history`: Ancient World, Middle Ages, Empires & Revolutions,
War & Conflict, Modern Era). Banks 2026-10-14 to 2026-11-30 from `scripts/<key>-lanes/`,
built by `scripts/gen-<key>.mjs` (append-only, `--check`), verified by `scripts/verify-<key>.mjs`.
Wired by `scripts/wire-sci-art-history.mjs`. Every lane was written against
`scripts/trivia-lane-check.mjs`, which fails dashes, British spelling, self-answering stems and
answer overuse, and WARNS on facts already asked in any other trivia bank. Read its warns: the
existing banks already hold most textbook gimmes, so a new lane is mostly a dedupe exercise.

**THE GAUNTLET ROTATES (owner, 2026-10-14).** Still seven a day: Streak and Deep every day plus
FIVE of the eight banks in `TRIVIA_POOL` (lib/circuits.js), a sliding window that moves one bank
a day from `TRIVIA_SPLIT_FROM` (2026-10-15), so each bank plays the Gauntlet five days in eight.
`triviaSplit(day)` is the only copy of the selection; `circuitKeysFor` reads it for any circuit
carrying `split: 'in'` or `split: 'out'`. Days up to 2026-10-14 deal the old fixed seven through
`before`. `keys` on the Gauntlet is now ten long (the canonical colour list), `cap: 10`, and
`LADDER_RAMP` grew to ten steps so no two banks share a colour. `scripts/verify-circuits.mjs`
recomputes the split with its own date math (`splitLocal`) and proves 7 + 3 every day, no bank in
both, the pair covering the pool, and five-in-eight fairness.

**THE TRIVIA ENCORE** (circuit `triviaencore`, served at `/triviaencore` by a rewrite like
`/trivia`; never create `app/triviaencore/page.js`) is the three banks that sat out the day's
Gauntlet (on launch day, 2026-10-14, the Encore's `before` dealt Sci, Art and History while the
Gauntlet kept its old seven), played on the same run page and RunClient with the towers layout. Its own board,
`score: 'correct'`, trophy "Curtain Call" (bronze). Its rankings panel and end-card board carry a
**combined Gauntlet + Encore** figure per player (joined by userKey from a second
`useCircuitBoard('gauntlet')` read), sorted on the Encore by default with a switch to sort on the
combined total. Nothing about it is stored: each bank still posts its ordinary row.

**The finish order on the Gauntlet:** `app/circuits/EncorePop.jsx` (stage-and-curtain art) opens
after the curtain when an Encore exists today and has not been run on this device, and the
end card leads with a "Take the Trivia Encore" door. The more-runs and more-trivia cards
(`MoreRunsPop`, `MoreRunsList`, `GauntletMorePop`) now show on the ENCORE's finish instead; on the
Gauntlet they only show when there is no Encore left to offer (`afterCards` in RunClient).
`?encore=preview` forces the pop-up for review.
The Encore shows everywhere the other runs do (owner, 2026-10-14): `SHOWN` and `LEAD_ORDER` in
lib/circuits.js, `CIRC_LEAD`, `PILL_CIRCUITS` and `RUN_SHORT` ('Encore') in StageToday,
`LEAD_CIRCUITS` in TodayClient, its card drawing in app/CircuitArt.jsx, and a second CTA on the
Trivia category page through `alsoCircuit` in lib/puzzle-categories.js.

## The English Gauntlet (`/english`) and Gram, Vocab, Spell, Origin, Idiom (launched 2026-10-19)

Five new Word dailies on the gauntlet shape, TEN questions a day each (five tiers of two, one life,
twenty seconds, `miss: 'Asked'`, no Sunday Edition and no `sunday` field), and the run that plays
all fifty back to back. Owner, 2026-10-19: "new dailies will be Gram, Vocab, Spell, Origin, Idiom",
named the English Gauntlet.

- **Lanes, two per game, cycled in order inside every tier:** Gram (Word Choice; Punctuation &
  Structure), Vocab (Definitions; Synonyms & Opposites), Spell (Spelled Right; Spot the Error),
  Origin (Word Origins; Named After), Idiom (What It Means; Finish the Saying). Config is
  `scripts/english-games.mjs`; lane sources `scripts/<game>-lanes/`, written to
  `scripts/english-lanes-brief.md` and checked with `scripts/trivia-lane-check.mjs`.
- **One generator, one checker:** `node scripts/gen-english.mjs <game>` (append-only, `--check`),
  `scripts/english-check-lib.mjs` behind `verify-<game>.mjs`. Spell's stems are templates, so a
  repeat is the stem plus the same four choices. Banks 2026-10-19 to 2026-11-23.
- **The rules every question lives by:** one defensible answer under Merriam-Webster / AP /
  Chicago, nothing contested (no usage the guides disagree on, no folk etymology, no disputed
  meaning), US spelling, no dashes. Each lane was fact-checked by a separate pass before launch.
- **Clients** are SciClient transformed (mkenglish.py, not committed): long choices drop to one
  column (`.sp-grid.wide` past 30 characters). Category **Word**, group "Word gauntlets", sets Copy
  desk / Word lore / Word nerds.
- **The run** is circuit `english` on the quiz engine (the keys are in RUN_GAMES), served at
  `/english` by a rewrite like `/trivia` (never create `app/english/page.js`), `score: 'correct'`,
  `ownerOrder`, towers presentation and the Gauntlet ending, title ladder in lib/run-titles.js,
  trophy "Plain English" (bronze). The five clients mount `RunDoorPop id="english"` on today's gate.
- **THE ONLY POP-UP IS THE RUN'S (owner, 2026-10-19):** a PREMIERE_RUNS line for `english` and no
  PREMIERES line for any of the five.

## The Science Gauntlet (`/science`) and Orbit, Bond, Gene, Pulse, Eureka (launched 2026-10-30)

Five new Trivia dailies on the English Gauntlet's shape, TEN questions a day each (five tiers of
two, one life, twenty seconds, `miss: 'Asked'`, no Sunday Edition and no `sunday` field), and the
run that plays all fifty back to back. Owner, 2026-10-30: build it with title ladder option A
("Lab to Laureate") and the filled flask ending.

- **Lanes, two per game, cycled in order inside every tier:** Orbit (Forces & Energy; Space), Bond
  (Elements; Compounds & Reactions), Gene (Animals & Plants; Cells & Evolution), Pulse (Anatomy;
  Health & Medicine), Eureka (Inventions; Scientists & Discoveries). Config is
  `scripts/science-games.mjs`; lane sources `scripts/<game>-lanes/`, written to
  `scripts/science-lanes-brief.md` and checked with `scripts/trivia-lane-check.mjs`. The brief bans
  anything already asked by Sci (the 25-question science daily) and every fact that can change.
- **Scaffolded, not hand-forked:** `scripts/mkscience.mjs` writes the config, `gen-science.mjs` and
  `science-check-lib.mjs` (sed clones of the English ones), the five `verify-<game>.mjs`, and the five
  clients and pages from Vocab's. Re-run it only before the banks diverge from the template; after
  launch, edit the clients directly. `scripts/wire-science.mjs` is the anchored site wiring (Trivia
  lists, beside Sci).
- **The run** is circuit `science` on the quiz engine, at `/science` by a rewrite (never create
  `app/science/page.js`), `score: 'correct'`, `ownerOrder` (Pulse, Gene, Orbit, Eureka, Bond),
  towers presentation, trophy "Lab Coat" (bronze). Title ladder `science` in lib/run-titles.js:
  Safety Goggles On, Lab Partner, Science Fair Winner, Grad Student, Professor, Nobel Laureate
  (0/10/18/26/35/44, provisional).
- **The ending is the filled flask** (`mode === 'science'` in app/circuits/GauntletFinale.jsx): each
  quiz pours into a test tube as its count climbs, then the total fills an Erlenmeyer flask whose
  graduation marks are the titles, the liquid taking each title's colour and wobbling on the earned
  one. Polymath still ties only Trivia, Math and English.
- **Only the run gets a pop-up** (PREMIERE_RUNS `science`), as with English.

## The run ladder ramp is OFF the category colours (owner, 2026-10-30)

`LADDER_RAMP` in lib/circuits.js colours every run's per-quiz stage (Trivia Gauntlet, Encore,
English, Math, Science, and the Dojo/Judged/Passport/Room/Crossed ladders that share `rampFor`). Its
first eight steps used to BE the category colours, so Atlas played on the Numbers mint and Sci on the
Logic lime. Each step is now a near neighbour of the colour it replaced ("familiar to existing"),
moved so its stage pastel sits at least 7 delta-E from every category pastel and every other step,
while carrying RAMP_INK at 6:1 or better raw and soft. `scripts/verify-ladder-ramp.mjs` is the gate.
A run's ENTRY and ENDING ground still wears its category on purpose (gateColour).

## Polymath (`/polymath`): one title for the three gauntlets (launched 2026-10-19)

Owner, 2026-10-19: the Trivia, Math and English Gauntlets tied together as "Polymath", legs weighted
the same. **A lens, never a new score**: the three runs play and post exactly as before; nothing is
stored, no IQ Points move, no gauntlet board changes.

- **Scoring (`lib/polymath.js`)**: each leg 0 to 100 = questions right against that run's TOP TITLE's
  mark, read off `lib/run-titles.js` (95 Trivia, 80 Math, 44 English today), capped at 100, rounded.
  Score = the mean of the three, rounded; combined clock breaks ties; a player ranks only once all
  three are finished that day. Tiers (provisional, recut from real scores): Dabbler 0, Apprentice 25,
  Journeyman 45, Scholar 60, Savant 75, Polymath 90.
- **`/api/quiz/polymath`** calls the daily-combined GET in process three times with `?all=1`, which
  makes daily-combined return `overallAll` (every ranked named row, slimmed); the capped `overall`
  (30) cannot be joined across circuits. The join is by userKey. Never add a stored score here.
- **Surfaces**: `/polymath` (`app/polymath/PolymathClient.jsx` in CircuitFrame: title, legs with Play
  doors, board, ladder, challenge via TicketDoor while the drawing is live, how the score works,
  Return to all daily puzzles, Share your score); the meter on the three runs' end screens
  (`app/circuits/PolymathMeter.jsx`, reveal once a day when the third lands, `sot_polymath_rev`);
  the home Runs pane card (`app/today/PolymathRunCard.jsx`, local saves only, no request).
- **The share link** is `/polymath?s=75-65-70&t=70&d=<day>` (`shareQuery` / `parseShare`); the page's
  OG image is `/polymath/card` with the same query (no query = the invite card). Names no question.
- Local legs read `sot_run_<id>_<day>` (phase 'done', results[].score summed), so the meter and the
  home card draw instantly; the rank waits on `resultPostsSettled()` then a fresh read.
