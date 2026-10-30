# Quizzes (lib/quizzes.js, /quiz/[id], /quizzes hub)

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Quizzes (lib/quizzes.js, /quiz/[id], /quizzes hub): formats, keys and matching audit, timing, blurbs, heroes, business-news hub, quiz Loft format, IQ tests

## Quizzes (paired "name them all" games)

A list can have a paired **quiz**: a timed "name them all" game at `/quiz/<id>` that mirrors the
list's look (same ink ribbon, Fraunces/DM Mono type, cream + ember palette). Quizzes live entirely as
data in `lib/quizzes.js` (the `QUIZZES` array). The pages are already built and render any entry
automatically (`app/quiz/[id]` for play, `app/quizzes` for the index), so authoring a quiz is **pure
data, no code**. The `/quizzes` index and per-list cross-link surface new entries on their own.

### When to build a quiz: ON REQUEST OR ON APPROVAL ONLY

Do NOT add a quiz to a list on your own initiative. Build a paired quiz only when:

- (a) the **owner explicitly notes** that a list should get a quiz (in the same request or after), OR
- (b) **Claude proposes** a quiz for a list and the **owner approves** it in the same session, before
  the push.

A list ships perfectly fine with no quiz. Absence of a quiz is the default, not a gap. (This mirrors
the SoT-source rule: judgment/extra layers are opt-in, never automatic.) When building a batch of new
lists, ask once which (if any) should get quizzes rather than quizzing all of them.

### Pairing and answer order

- **Pair by id.** Give the quiz the **same `id`** as the list and set **`listId`** to that id, so the
  quiz and list cross-link (the results card links back to `/list/<listId>`). Omit `listId` only for a
  standalone quiz with no underlying list.
- **Build the answer set from the list's live consensus order**, best-to-worst (slot `i` = rank
  `i+1`). For a `mode: 'facts'` (or other non-Borda) list the order is the `ai` seed order; for a
  normal list it is the Borda consensus top 10, computed exactly the way descriptions are computed
  (`getSources` in `lib/helpers.js`, absent = 0). Keep the quiz in lockstep with the list: if the
  list's order changes, re-derive the answers.

### Quiz object shape (see the airlines quiz for a worked example)

`id`, `listId`, `publishedDate`, `title` ("Name the ..."), `category`, `type`, `tags`, `blurb`,
`timeLimit` (seconds; scales with answer count, see "Time limit scales with answer count" below), and `answers`. Each answer is
`{ t, keys, anti? }`:

- **`t`** canonical display name, revealed on a miss. No scores or figures, just the name (e.g.
  `'Hartsfield-Jackson Atlanta (ATL)'`).
- **`keys`** lowercase substrings that count as a correct guess. The matcher (`keyHit` in
  `app/quiz/[id]/QuizClient.jsx`) is **order-independent**: a key hits when the normalized guess
  (lowercased, punctuation stripped, so `o'hare` -> `o hare`) **contains** the key as a substring,
  OR when the key is **two or more words and every one of those words appears as a whole token in
  the guess, in any order**. So the key `'tokyo disneyland'` is also satisfied by `disneyland tokyo`,
  and `'kansas city'` by `city kansas`. Single-word keys stay substring-only (preserving partial
  typing and the collision rules below). Word order never matters on any list (owner rule,
  2026-06-11) — author keys in their natural order and the matcher handles the rest.
- **`anti`** OPTIONAL substrings that BLOCK a match (disambiguation). Anti runs through the same
  `keyHit`, but since anti guards are single words it behaves as a plain substring block as before.

### Time limit scales with answer count (owner rule, 2026-06-11)

`timeLimit` is a function of how many answers the quiz asks for, not a fixed default: the more
responses a player must produce, the more time they get, on a 15-second-quantized scale.

- **Baseline, 10 answers = 90 seconds (1:30).** The standard floor. Quizzes with fewer than 10
  answers also use 90s; never go below it.
- **Hard-recall tier, 10 answers = 120 seconds (2:00).** Recall-heavy factual 10-answer quizzes
  (sports career/stat leaders, geography top-10s, hard trivia, multi-team/franchise lists) may use
  120s instead of 90s. This is the ONLY sanctioned deviation at the 10-answer level; pop-culture,
  food, film, and other lighter quizzes stay at the 90s baseline. Existing 120s quizzes keep their 120.
- **No ceiling, the clock keeps scaling up for longer quizzes (owner rule, 2026-06-30).** There is NO
  maximum time and the per-answer rate is FIXED: every answer above 10 adds a flat 7.5 seconds (the
  rate the old 54-answer = 420s point implied), extended without any cap. Longer quizzes simply get
  proportionally more time. `countries-of-africa` (54) stays 420s; a much longer quiz just gets more
  (e.g. 116 answers = 885s, 14:45). This RETIRES the earlier "ceiling pinned to the largest quiz,
  rescale every 11+-answer quiz against Nmax" mechanic: adding a longer quiz never rescales any other
  quiz, because the rate no longer depends on the largest quiz's size.
- **For 11+ answers, scale at the fixed rate and round to the nearest 15 seconds (halves round up),
  with no upper bound:**

  `seconds = roundTo15( 90 + (n - 10) * 7.5 )`

  where `n` is the quiz's answer count (unbounded: no Nmax, no cap). Worked values: 12 -> 1:45,
  23 -> 3:15, 25 -> 3:30, 46 -> 6:00, 47 -> 6:15, 54 -> 7:00, 80 -> 10:45, 116 -> 14:45.

- **Guess-in-order quizzes get 2x the scaled time (owner rule, 2026-06-13).** Any quiz with
  `ordered: true` (the labeled, guess-in-sequence format) is markedly harder than a free-order
  quiz: the player must produce the answers in a fixed sequence, not in any order, so a single
  early gap stalls the whole board. After computing `seconds` by the scale above, DOUBLE it for an
  ordered quiz. A 10-answer ordered quiz is therefore 180s (3:00) rather than 90s. Apply the
  doubling to the FINAL scaled value at whatever answer count the quiz has (re-derive it if the
  count changes). This stacks on top of the baseline / hard-recall / 11+ scaling rules and changes
  nothing for non-ordered quizzes. First applied 2026-06-13 to the seven 'Name the Last 10 ...'
  champion quizzes (World Cup, Super Bowl, College Football, NBA, Men's College Basketball, Stanley
  Cup, World Series), each bumped 90 -> 180.

Set `timeLimit` by this rule on every new quiz, and re-derive it whenever a quiz's answer count
changes. Do NOT hardcode the clock duration in the `blurb` ("seven minutes on the clock"); if the
time later rescales the blurb goes stale, so keep the blurb about the topic, not the timer.

### Blurb must NEVER name OR hint at an answer (hard rule, 2026-06-11)

The `blurb` is displayed on the quiz page BEFORE play starts. If it names any answer, it gives the
game away. **No answer's display text (`t`), and no answer key substring, may appear in the blurb.**
This applies to every quiz, including director/filmmaker filmographies where the temptation is to
write "From Memento to Oppenheimer..." or "Goodfellas is the obvious first answer." Write the blurb
in terms of the director/topic/genre/era, never the items themselves. Before shipping, scan every
blurb against its answer list and fix any hits. **Strip each answer's parenthetical figure first, then test its core NAME and every key as a substring of the blurb, multi-word names included** (a name like "blue whale" or "saturday night live" hides from a scan that only matches the full "Blue Whale (200 tons)" display string, which is how a batch of #1-naming blurbs slipped through once).

**Hints are banned too, not only named answers (owner rule, 2026-06-11).** The blurb must not even
NUDGE the player toward a specific answer. Beyond the ban on any answer's display text (`t`) or key
substring, do not describe an answer's defining trait, era, nationality, claim to fame, or rank
("the obvious #1," "a household name leads this one," "don't forget the British entry"), and do not
give away the count of a tricky disambiguation. Keep the blurb to the topic, category, era, genre, or
rules of the game, never the items or any clue pointing at them. When in doubt, cut it.

**Map quizzes are the one exception (owner ruling, 2026-06-11):** a `format: 'map'` quiz MAY name
countries in its blurb, because the player LOCATES each country on the map rather than typing its name,
so a named country is not a spoiler. The no-name / no-hint rule applies in full to every non-map quiz.

### A quiz's CLUES must never contain or give away their own answers (hard rule, 2026-06-13)

A quiz is pointless when the prompt the player reads already contains the answer they are supposed to
produce. This is the rule that retired nine matching games on 2026-06-13 (subway-system-to-city,
marathon-to-city, racing-game-to-series, novel-to-film-adaptation, constellation-to-zodiac,
tv-show-to-theme-song, stock-exchange-to-city, cathedral-to-city, tv-award-to-field): in each, the
clue text spelled out the answer (e.g. a clue naming the city whose subway the player must name, or a
cathedral named after the very city that was the answer). NEVER create such a quiz, and DELETE any
existing one outright rather than trying to salvage it.

**The rule:** for every quiz where the player reads a per-item clue and supplies a separate answer
(`format: 'bank'`, `'pairs'`, `'matched'`, `'type-it'`, and the default name-them-all when it uses
`label` clues), the clue/prompt string for an item MUST NOT contain that item's answer. Concretely,
normalize (lowercase, strip punctuation) and confirm the answer's display text (`t`) and every one of
its `keys` is NOT a substring of, and does not share its distinctive word(s) with, that item's own
clue. A clue that names the answer's city, person, brand, or defining proper noun when THAT is the
answer is a giveaway and disqualifies the item.

**Build-time gate (run before shipping any clue-and-answer quiz):** for each item, test
`norm(answer.t)` and each `norm(key)` against `norm(clue)`; any hit is a violation. Then judge the
softer giveaways a substring test misses (a clue that paraphrases or uniquely fingerprints the answer
without quoting it). **If even a few items give themselves away, fix those clues; if roughly half or
more of the items do, the quiz CONCEPT is broken, do not build it.** Map quizzes are exempt (the
player clicks a location, so a named place is not a spoiler), exactly as in the blurb rule above.

When this surfaces on a LIVE quiz, delete the whole quiz entry from `lib/quizzes.js` (and its
`QUIZ_DEPT` entry) in a normal deploy, rather than patching clue by clue, unless only one or two items
are affected and good non-giveaway clues exist.

### Key-design rules (the matcher is substring + any-order tokens, so collisions are the real risk)

- Give each answer its city/common name, its distinctive proper name, and its code, e.g.
  `['atlanta','hartsfield','atl']`. For airports the IATA code is a great key; normalize `o'hare`
  to `o hare`/`ohare`.
- **NEVER use a short key that is a substring of another answer's guess.** `'las'` (Las Vegas) is a
  substring of "dallas", so it would mis-credit a Dallas guess; use `'vegas'`. Likewise drop codes
  like `'can'` (Guangzhou) that are common substrings of unrelated words. When in doubt prefer the
  full name over a 3-letter code, or add an `anti` guard.
- **Typed quizzes auto-match on EVERY keystroke, so a short code that is a PREFIX of another answer is
  unsafe even WITH an `anti` guard (owner rule, 2026-06-24).** The default/photo/matched/ordered formats
  accept a guess the MOMENT the field matches an unsolved answer (`autoName`/`autoSlot`/`autoOrdered` in
  `QuizClient.jsx`), not on Enter, so the guess is tested at every PREFIX of what the player types. An
  `anti` only fires once the full blocking word is present, which is too late: a key that completes
  inside a prefix of a DIFFERENT answer banks the wrong slot before the guard can block. Adding `'san'`
  to San Diego steals the answer from someone typing "san francisco" (matches at "san"); `'ath'` on
  Athens steals from "heathrow" (matches at "heath"); the `anti: ['san francisco']` / `anti: ['heathrow']`
  guard cannot help because the field auto-clears at the prefix. (`'las'` for Las Vegas is the rare safe
  case: "las" only completes inside the FULL word "dallas", at which same keystroke Dallas's own earlier
  slot matches first, and the `anti` covers the residual already-solved case.) **Rule: never add a
  3-letter code (or any short key) that is a substring of another answer in the same quiz. On airport
  quizzes the canonical answer a player types is the CITY or AIRPORT NAME, not the IATA code; keep a
  code as a key only where it is not a substring of any other answer or key in that quiz.**
- **Verify before shipping:** run each answer's own `t` (and every other answer's `t`) through the
  matcher and confirm nothing cross-matches the wrong slot. Because matching is now any-order, also
  check that a multi-word key's words don't all coincidentally appear in another default-format
  answer's name. A tiny node loop simulating `keyHit` (substring OR all-tokens-present) against the
  array catches this (it caught the `las`/`dallas` clash on the airports quizzes). Order-independence
  is slot-isolated in `matched`/`ordered` quizzes, so repeated-franchise year slots are unaffected.
- **The engine now auto-accepts an answer's own NAME (added 2026-06-12, after "Moscow" was rejected on
  the college-towns quiz).** `buildImplicitNameKeys` in `app/quiz/[id]/QuizClient.jsx` accepts, in
  addition to the authored `keys`, each answer's full normalized `t` AND its **parenthetical-stripped
  base name** ("Moscow (Idaho)" -> `moscow`) -- but ONLY when that candidate is UNAMBIGUOUS across the
  quiz (it matches no other answer's keys, is not a substring of any other answer's name, and is not
  another answer's base name). The unambiguity guard means an implicit key can only ever credit its own
  slot, so it never steals a guess from a sibling (sequel/substring cases like Frozen/Frozen 2 are NOT
  auto-added and still need the authored `anti`). The bug it fixes: an answer whose `keys` only list
  disambiguated multi-word forms (`['moscow idaho','moscow id']`) silently rejected the bare name a
  player actually types, because a multi-word key needs every word present. You should STILL author a
  clean primary key (the bare name) on every answer -- the implicit layer is a safety net, not a license
  to omit keys -- but a parenthetical-disambiguated place name no longer breaks when you forget it.

### Accepted-answer collision audit (run before EVERY quiz ships, owner rule, 2026-06-11)

Because `keyHit` accepts a key as a SUBSTRING (and a multi-word key as any-order tokens), and the
default single-input game credits the FIRST unfound slot that matches, loose keys silently mis-credit
or shadow answers. Run the collision audit on every new or edited default-format quiz and fix all hits
before shipping (matched/ordered quizzes are slot-isolated and map quizzes are click-based, so they
are exempt). The recurring failure modes, all found and fixed 2026-06-11:

- **Two-letter abbreviations that are substrings of other answers.** Postal/locale codes like `us`
  (inside "russia", "australia"), `la` ("philadelphia", "dallas"), `ca` ("north carolina"), `ga`
  ("michigan"), `or` ("california", "colorado"), `co` ("new mexico"), nicknames like `rock` ("brock"),
  and initials like `to` ("tony") wrongly credit another slot. Drop the code, or keep it only where it
  collides with nothing in that quiz; never ship a 2-3 char key that is a substring of any other
  answer's normalized name.
- **A shared name across two answers** (same author, franchise, family): an author key on one novel
  grabs the other by the same author (`le carré`), a generic series key matches a sibling
  (`ctf finance centre`, `chinese` across two Chinese languages, `elephant` across two elephants). Key
  each answer by its DISTINCTIVE title/name only, never by the shared element.
- **A base name that is a substring of a sequel** ("Frozen" in "Frozen 2", "Avatar" in "Avatar: The
  Way of Water", "Black Panther" in "Wakanda Forever", "Game Boy" in "Game Boy Advance", "Diablo II"
  in "Diablo III", "Arctic" in "Antarctic"). Guard the base with an `anti` on the distinguishing
  word/year (`anti: ["way of water"]`, `anti: ["advance"]`, `anti: ["2013"]`) so the fuller name falls
  through to its own slot.
- **Short substrings of common words** (`er` inside "frasier"/"cheers"; `e.t.` normalizes to `e t`,
  which is inside "th**e t**hird"): replace with the full distinctive token or add a targeted `anti`.
- **Accent loss in `norm`** ("Khloé" -> "khlo", "Beyoncé" -> "beyonc"): `norm` strips accented letters
  to a space, so add a key that matches the STRIPPED form (`khlo`, `beyonc`) or the answer undermatches
  its own name.

The audit is mechanical: mirror `keyHit`/`anyKey` AND `buildImplicitNameKeys` from
`app/quiz/[id]/QuizClient.jsx` (the matcher now ORs each answer's implicit name keys into the hit), then
for every answer run **BOTH its full `t` AND its parenthetical-stripped base name** (`baseName(t)`,
e.g. "Moscow" from "Moscow (Idaho)") -- and every other answer's `t` and base name -- through the
matcher against the full set, and confirm each probe credits ITS OWN slot first and nothing else.
Testing only the full `t` is what let the "Moscow" bug ship: "Moscow (Idaho)" normalizes to
"moscow idaho", which matched its `moscow idaho` key, so the full-name probe passed while the bare
"Moscow" a player types matched nothing. ALWAYS probe the base name too. Classify hits as UNDERMATCH
(name matches no slot), MISCREDIT (name credits an earlier slot), or EXTRA (name also hits another slot
and would mis-credit on a re-guess). Zero findings is the ship gate.

### Timestamps: every quiz needs a distinct `publishedAt`

Every quiz MUST carry a `publishedAt` ISO-8601 UTC timestamp (e.g. `'2026-06-11T17:00:00Z'`), exactly
like a list. The `/quizzes` index "Most Recently Added" sort keys off `publishedAt` (falling back to
`publishedDate` at noon). Quizzes that share only a `publishedDate` therefore tie and fall back to raw
array order, which silently buries a newly added quiz at the BOTTOM of the index instead of the top.
So give each quiz its own distinct timestamp, and when adding one to an existing set stamp it LATER
than every existing quiz so it sorts newest. Sort logic lives in `app/quizzes/QuizHomeClient.jsx`
(the `'recent'` branch). Backfilled across all quizzes 2026-06-11.

**HARD GATE (owner, 2026-06-11, after the five career-scoring quizzes shipped with only a `publishedDate` and sorted to the BOTTOM of Recent): a new quiz may NOT be pushed until it carries its own `publishedAt`. Stamp it in the SAME deploy step as the push via `date -u` (never the research/build time), and when adding it to the existing set make it LATER than every existing quiz's `publishedAt` so it sorts newest. Adding several at once: give each a DISTINCT timestamp one second apart, newest-first in the order you want them at the top. Shipping a quiz with only `publishedDate` is a rule violation, not a deferrable detail. Pre-push verification, run on the spliced file before pushing and confirm BOTH pass: (1) every new quiz entry has a `publishedAt` line immediately after its `publishedDate` line (no new id may lack one), and (2) the new timestamps exceed the prior maximum, `grep -oE 'publishedAt: "[^"]+"' lib/quizzes.js | sort | tail`. This is the same gate as the list `publishedAt` rule, applied to quizzes.**

### Quiz formats: `format: 'matched'` and `ordered`

The default quiz is the single-input "name them all" game (answers accepted in any order). Two opt-in
variants, both data-only flags on the quiz object:

- **`format: 'matched'`**: each answer carries a **`label`** (e.g. a year) that renders in place of the
  rank number, turning the board into a labeled grid ("2022 -> Argentina"). Use it when the slots are
  keyed by something other than rank (years, categories, positions). Every answer needs a `label`.
- **`ordered: true`** (only meaningful together with `matched`): the slots must be guessed IN SEQUENCE
  from the top. There is ONE fixed input box that does not move; the current target row is HIGHLIGHTED
  (ember rule plus a left accent) and the input placeholder names it ("Type the country for 2022..."),
  and a correct guess advances the highlight to the next row. Use this whenever the labeled list has an
  inherent order (chronological, ranked) and the player should work through it in that order. Without
  `ordered`, a `matched` quiz renders one input per slot and accepts them in any order.

Worked example: `world-cup-winners` (standalone, no `listId`) is `format: 'matched'` + `ordered: true`
with year labels 2022 down to 1986. Implemented in `app/quiz/[id]/QuizClient.jsx`.

**Keep `ordered` RARE, it is a deliberate exception and never a default.** Only turn it on when the
answers genuinely must be produced in sequence AND the owner has asked for in-order play. As of June
2026 the ONLY quiz with `ordered: true` is `world-cup-winners`; every other quiz stays unordered
(a `matched` quiz without `ordered` shows one input per slot, any order).

### Quiz formats: matching / fill-in-the-blank games use `format: 'bank'` (NOT `pairs`)

**The standard matching game on the site is `format: 'bank'`, rendered by
`app/quiz/[id]/BankQuizBoard.jsx`.** It shows ONE prompt at a time at the top (the clue, e.g. a
country, or a book title with a `____` blank) and a SINGLE alphabetical bank of clickable answer
tiles below (e.g. capitals, or the missing words). You tap the tile that matches the current prompt;
a Next button cycles to the next unmatched prompt. This is the "the bank below" layout the owner
means by "our matching format". Every live matching quiz uses it (`novels-to-authors`,
`company-slogans`, `movie-quotes-to-movies`, `companies-to-headquarters`, the capitals/geography
matchers, etc.).

- **Data shape:** `pairs: [[answer, prompt], ...]` — `pairs[i][0]` = the answer TILE shown in the
  bank, `pairs[i][1]` = the PROMPT shown one at a time at the top (same `[answer, prompt]` order as
  the legacy pairs format). Also include the mirror `answers: [{ t: answer, keys: [lowercased] }, ...]`
  (QuizClient reads `answers.length` for the total). `leftLabel` = the small eyebrow over the prompt,
  `rightLabel` = the bank label. Set `format: 'bank'`, a `timeLimit`, a spoiler-free `blurb`, and a
  distinct `publishedAt` like any quiz.
- **Scoring is a GUESS-BUDGET, not strike-out.** You start with one guess per item. Every tap, right
  or wrong, spends a guess; a wrong tap removes/reveals NOTHING and the missed prompt keeps looping so
  you can retry it later (at the cost of another guess). The game ends on running out of guesses,
  matching everything, or the clock. Score = number matched. Write the `blurb` to describe THIS (one
  guess per item, misses loop back), never "struck out for good" — that is the `pairs` board's model,
  not bank's.

**DO NOT use `format: 'pairs'` for a new matching quiz.** `pairs` is the OLD two-column
`MatchQuizBoard` (clues on the left, answers on the right, wrong pick struck out for good). It still
renders for back-compat, but the site moved to `bank`; building a new matcher as `pairs` is wrong and
has been mistaken for "the matching format we use" before. When in doubt, copy an existing live `bank`
quiz byte-for-byte and change the data.

⚠️ **Source-of-truth-is-origin, again:** the `bank` format and `BankQuizBoard.jsx` exist on
origin/main but were ABSENT from a stale local working tree, which led to a wrong `pairs` build
(2026-06-12). Always read the quiz boards and an existing `bank` quiz from `git show FETCH_HEAD:...`
(origin), not the local copy, before building any matching quiz.

First book `bank` quizzes: `fill-in-the-blank-book-titles-pt-1` / `-pt-2` / `-pt-3` (2026-06-12) —
famous book titles with one word blanked at the top, the missing words as the answer bank.


### Source attribution (`source`)

A STANDALONE quiz (one with no paired `listId`) should carry a **`source`** object `{ label, url }`
citing where the answers come from. It renders as a small caption at the **BOTTOM** of the quiz page,
never the top, so it never crowds or spoils the prompt. Quizzes paired with a list inherit credibility
from that list and usually omit `source`.

### Deploy

Add the entry to `lib/quizzes.js`, `node --check` it, and ship it in the **same multi-file push** as
the list (`data.js` + `descriptions.js` + `hero-images.js` + `quizzes.js`). Quizzes do NOT affect
Borda consensus, so they need **no** `consensus-check` trigger and **no** IndexNow ping beyond the
paired list's own. First built alongside `busiest-airports-world` / `-us` / `-outside-us`
(2026-06-11); the original example is `best-airlines-north-america`.


## Quizzes (`/quiz/[id]`) and paired top-grossing film lists (workflow, added 2026-06-12)

The site has a timed "name them all" quiz system at `/quiz/[id]`, indexed at `/quizzes`. Quizzes live
in **`lib/quizzes.js`** (`export const QUIZZES = [...]`, plus `getQuiz(id)`). Each quiz usually pairs
with a facts-mode `/list/[id]` of the same id (the "See the full list" button uses `listId`). This
section documents the quiz format AND the established **top-grossing film-list** pattern (decade lists
like `top-grossing-films-1990` and the per-actor `top-grossing-<actor>-movies` lists), so future
sessions can build more without re-deriving it.

### Quiz object shape (typed "name them all" quiz)

```javascript
{
  id: 'top-grossing-tom-hanks-movies',          // kebab slug -> /quiz/<id>
  source: { label: 'Box Office Mojo · Worldwide Gross' }, // shown as the data source
  listId: 'top-grossing-tom-hanks-movies',      // OPTIONAL paired /list/<id> (omit for standalone)
  publishedDate: '2026-06-12',
  publishedAt: '2026-06-12T08:01:00Z',          // REQUIRED for "Recent" sort (same rule as lists)
  title: 'Name the Highest-Grossing Tom Hanks Movies', // starts with "Name the ..."
  category: 'Movies · Tom Hanks',               // eyebrow label
  type: 'entertainment',
  tags: ['entertainment'],
  timeLimit: 90,                                // seconds on the clock (90 for a 10-item quiz)
  noun: 'film',                                 // placeholder/leniency noun ("Type the film...")
  blurb: 'The highest-grossing films starring Tom Hanks, by worldwide box office. Name all ten.',
  answers: [                                    // ranked slots, best-to-worst (top 10)
    { t: 'Toy Story 4', keys: ['toy story 4'] },
    { t: 'Men in Black', keys: ['men in black'], anti: ['men in black ii','men in black 2','men in black 3'] },
    // ...10 total
  ],
}
```

### How answer matching works (sets `keys` / `anti` correctly)

`QuizClient.jsx` normalizes a guess with `norm()` (lowercase, every non-alphanumeric becomes a space,
collapse spaces) and scans the **unsolved answer slots in array order**; the first slot whose keys hit
and whose `anti` does NOT hit wins. A key hits when the normalized guess **contains the key as a
substring**, OR (for a 2+ word key) **every word of the key appears as a token in the guess**. So:

- **Default key** = `norm(title)`. Add aliases generously (`'mission impossible fallout'`, `'fallout'`,
  `'gotg 2'`, `'t2'`, `'godfather 3'`, `'godfather part iii'`). `noun: 'film'` plus the title key means
  the bare title alone is accepted.
- **Sequel collision rule (the one thing that bites):** when a SHORTER title is a substring of a longer
  sequel AND the shorter title's slot comes BEFORE the sequel's slot (higher gross), a guess for the
  sequel would wrongly satisfy the shorter slot first. Fix it with `anti` on the SHORTER slot listing
  the sequel forms, e.g. on bare `Men in Black`: `anti: ['men in black ii','men in black 2','men in black 3']`;
  on bare `The Equalizer`: `anti: ['the equalizer 2','the equalizer 3']`; on bare `Jurassic World`:
  `anti: ['fallen kingdom','dominion']`; on bare `The Godfather`: `anti: ['godfather part ii','godfather part iii','godfather 2','godfather 3','coda']`.
  When the bare title comes AFTER its sequels in gross order (e.g. `Shrek` below `Shrek 2/3`, `Toy Story`
  below `Toy Story 2/3/4`, the bare `Guardians of the Galaxy` below the Vols), no `anti` is needed.
  Always simulate the tricky cases against the `keyHit`/`anyKey` logic before shipping.

### Layout & the answered-item cycling system (UNIVERSAL) — answered tiles always sink

The name-them-all board has a built-in **answered-item cycling** behaviour: as you solve slots, the
solved rows slide to the BOTTOM so the next unsolved row is always near the input bar (this is what
makes a long list playable without scrolling). Implemented via `displayOrder` + the FLIP slide in
`QuizClient.jsx`, gated on `cyclingOn`.

**HARD RULE (owner, 2026-06-18): answered tiles sinking to the bottom is UNIVERSAL and AUTOMATIC for
every name-them-all quiz — single-column AND auto-wrapped multi-column alike. You do NOT need to set
any flag to get it.** Previously a long list that auto-wrapped into 2-4 columns silently turned cycling
OFF (rows pinned in a fixed grid); that was the bug behind `states-with-the-most-appalachian-trail`
(14 states auto-wrapped to two columns, answered tiles stuck). Fixed in `QuizClient.jsx` 2026-06-18:
`cyclingOn` is now blocked ONLY by an explicit fixed grid, and the auto-wrap render branch lays
`displayOrder` out column-major so solved items sink toward the last column's bottom while the next
unsolved one stays near the input. `cyclingOn = started && !ended && !matched && !mapMode && !tileMode
&& !explicitCols`.

Mechanics:
- **Auto-wrap (default for long/short-label lists): cycles automatically.** No flag needed. The columns
  exist purely for fit; answered tiles still sink.
- **`singleColumn: true`: forces ONE column** (no auto-wrap) and cycles. Use it only when you want the
  classic single tall column instead of auto-wrapped columns; it is no longer required to get cycling.
- **Explicit `columnSplit: [n, n, ...]` (must sum to `answers.length`): a deliberate FIXED reference
  grid** (periodic-table style). This is the ONLY layout where rows stay put by design — cycling is off.
- Do NOT set both `singleColumn` and `columnSplit`; `singleColumn` wins. Each row/tile always shows its
  ORIGINAL index as the rank number even after it sinks, so never bake the number into `t`.

### Quiz department / icon (id naming matters)

`deptOf` and `iconOf` in `app/quizzes/QuizHomeClient.jsx` (and the `relatedQuizzes` copy in
`QuizClient.jsx`) key off the quiz **id** by regex. An id matching `/film|movie|box-office|director|actor|animated|franchise/`
files under the **Movies** department with the Clapperboard icon. So name film quizzes with `movie`/
`film` in the id (e.g. `top-grossing-<actor>-movies`). Other depts: `song|album|...` -> Music,
`games|video-games` -> Gaming, `book` -> Literature, `format:'map'` -> Geography, sports regex -> Sports.

### Paired facts-mode list (`lib/data.js`)

The quiz's `listId` points to a normal `mode: 'facts'` list. The top-grossing pattern:

```javascript
{
  "id": "top-grossing-tom-hanks-movies",
  "publishedDate": "2026-06-12", "publishedAt": "2026-06-12T08:01:00Z",
  "title": "Highest-Grossing Tom Hanks Movies",  // "Highest-Grossing" / "Top-Grossing" descriptor
  "category": "Movies · Tom Hanks",
  "type": "entertainment", "tags": ["entertainment"],
  "linkType": "imdb", "mode": "facts",           // facts mode = no voting, Sources tab only
  "blurb": "...one or two sentences, no em dash...",
  "defaultSource": "ai",
  "links": { "Toy Story 4": "https://www.amazon.com/dp/<ASIN>?tag=cgurus-20", ... },
  "sources": { "ai": { "label": "Box Office Mojo · Worldwide Gross",
                       "url": "https://www.boxofficemojo.com/", "items": [ ...10 titles... ] } }
}
```

- **`linkType: 'imdb'`** auto-links every title to its IMDb page. The `links` map OVERRIDES that per item
  with an Amazon Video affiliate link (`/dp/<ASIN>?tag=cgurus-20`). A film that has **no purchasable
  Amazon Video page** (some Disney/Marvel-pulled titles, e.g. the 2008 `Iron Man`) is simply OMITTED from
  `links` and falls back cleanly to the IMDb auto-link. Never ship an `s?k=` search link.
- Only the `ai` seed source is needed (it is excluded from Borda anyway, and facts mode does no scoring).
  The overview tile order for a facts list is the `ai` seed order, so seed it in true gross-descending order.
- Still REQUIRED like any new list: a **description for all 10 items** in `lib/descriptions.js` and a
  **hero image for the top 3** in `lib/hero-images.js`.

### Descriptions and hero images

- **Descriptions** (`lib/descriptions.js`, keyed `listId -> exact title -> text`): 1-2 sentences, lead with
  the worldwide gross figure and a memorable hook, no em dashes. One per item for all 10.
- **Hero images** (`lib/hero-images.js`, top 3): use the film's **TMDB backdrop** (landscape):
  `{ "src": "https://image.tmdb.org/t/p/original/<backdrop>.jpg", "credit": "TMDB", "creditUrl": "https://www.themoviedb.org/movie/<id>" }`.
  These resolve to JPEG (satisfies the no-WebP hero rule) and are the established source the decade
  film lists already use.

### Gathering, live (no guessing)

- **Worldwide gross + ranking (the "fact"):** the standard "actor box office" convention credits the FULL
  film gross to the actor, INCLUDING voice, supporting, and credited cameo roles (Toy Story counts for
  Hanks, Shrek for Murphy, Kung Fu Panda for Hoffman, Joker for De Niro). EXCLUDE uncredited/blink cameos
  and off-screen narrator-only credits (e.g. Morgan Freeman's War of the Worlds narration was dropped).
  Use current cumulative nominal worldwide gross (re-releases included). Box Office Mojo person pages are
  now IMDbPro-gated, so gather title-by-title / via research and cross-check two sources.
- **Amazon Video ASINs:** from an amazon.com tab, `fetch('/s?k=<title>&i=instant-video')`, parse anchors
  matching `/(dp|gp/video/detail)/([A-Z0-9]{10})/`, strip trailing parentheticals from the result title
  (`(4K UHD)`, `(Bonus X-Ray Edition)` ARE the movie; `Trailer`/`Sneak Peek`/`Making of`/`Collection`/
  `2-Movie` are NOT), and pick the candidate whose base title contains all the title's tokens with the
  fewest extras. For same-name films (Aladdin, The Mummy, King Kong, Mulan, Total Recall, Robin Hood)
  verify the year by fetching `/dp/<ASIN>` and reading the release year.
- **TMDB backdrops:** from a themoviedb.org tab, `fetch('/search/movie?query=<title>')` for candidate
  `/movie/<id>` links, then `fetch('/movie/<id>')` and read the `t/p/w1920_and_h800_multi_faces/<file>.jpg`
  path (that is the landscape backdrop; the og:image is the portrait poster). Disambiguate same-name films
  by reading the `(YYYY)` in the page `<title>`.

### Build / deploy

Build all four files' fragments programmatically and splice into FETCH_HEAD copies (quizzes.js + data.js
+ descriptions.js + hero-images.js), `node --check` each, then deploy as ONE multi-file commit per the
Deploy section. Facts-mode lists have no consensus movement, so SKIP the consensus-check cron ping; DO
ping IndexNow for each new `/list/<id>` (and the `/quiz/<id>`) URL after the Vercel deploy is live.

## Picture-text-input quizzes: image research (Wikimedia-first, verify live) (owner rule, 2026-06-14)

The picture "name them all" quizzes (`format: 'images'`, plus the visually identical `posters` and
`logos`) show one image per answer and the player types the name. Each answer is
`{ t, img, keys, anti? }` where `img` is a remote https image URL. The hero-image discipline applies
to gathering these quiz images, plus a few quiz-specific rules:

- **Wikimedia Commons is the FIRST source, gathered LIVE, never guessed.** For any subject with a
  Wikipedia article (people, places, flags, public-domain art), pull the canonical image straight
  from the MediaWiki pageimages API instead of hand-writing a Commons URL:
  `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail|original&pithumbsize=600&redirects=1&titles=<A>|<B>|...`
  (up to 50 titles per call; `thumbnail.source` is the lead image, `original.source` when the file is
  narrower than the requested width). Run it through the connected Chrome (`fetch().then(r=>r.json())`),
  the API URL is too long for `web_fetch`. The lead image of a person's article is essentially always
  their canonical portrait, exactly what these quizzes want.
- **When Wikimedia has no usable image, broaden the search** to a stable source: TMDB for film
  posters/backdrops (`image.tmdb.org`), the brand's own site for a logo, an editorial CDN, Pexels.
  The no-guessing rule holds: open the candidate and confirm it is the right subject before use.
- **Verify EVERY image loads AND shows the correct subject before shipping.** Load-test each final
  `img` URL (an `Image()` onload/onerror sweep in the connected Chrome is fastest) and confirm zero
  failures. For portraits also confirm orientation (taller than wide) and that the face matches the
  intended person, the same attribution care used for hero photos (multi-subject brands and same-named
  people surface the wrong image at the top of search).
- **Format and host: JPEG or PNG on a stable host, downscaled.** Apply the hero no-WebP/no-AVIF rule
  (`upload.wikimedia.org` thumbs and TMDB serve JPEG/PNG). Prefer a `~500px` thumb, not the multi-MB
  original. A Wikimedia thumb URL is `.../wikipedia/commons/thumb/<X>/<XY>/<File>/<W>px-<File>`; when
  the API returns the original (file narrower than `<W>`), use that original URL as-is.
- **Tile shape: `imgTall: true` for portrait subjects** (people, book covers, movie posters), which
  renders the same tall tile as `format: 'posters'`; `imgSquare: true` for square art (album covers);
  neither for wide logos. Set `noun` to what the player types (`'president'`, `'artist'`, `'film'`).
- **Sampling a large historical set across two or more parts: split evenly and INTERLEAVE eras** so
  each part carries a balanced mix of old and recent, never a chronological first-half/second-half
  split (interleaving by every-other keeps both parts spanning the full timeline). Together the parts
  must cover the whole set with no overlap.
- **Run the accepted-answer collision audit** (the same one every default/`images` quiz needs): two
  subjects sharing a surname in the SAME part need first-name keys + `anti` guards (the two Adamses,
  the two Harrisons, the two Roosevelts, the two Johnsons among presidents), and watch for a name that
  is a substring of another answer (Gerald **Ford** inside "ruther**ford**" needed `anti: ['rutherford']`).
- **`timeLimit`** follows the standard scaling rule (`roundTo15(90 + (n-10)*7.5)`, halves round UP;
  a 19- or 20-image quiz is 165s), and the **blurb must not name or hint at any pictured subject**.
- **Department:** add each new image quiz id to `QUIZ_DEPT` in `lib/quiz-departments.js` (the
  `quizDept` id heuristics do not cover every topic, so an unlisted id falls to `misc`).

First applied 2026-06-14 to `name-the-president-from-the-portrait` Pt. 1/2 (every president from
Washington through Reagan, official Wikimedia Commons portraits, interleaved so each part mixes
founding-era and modern presidents).


## Quiz formats: adding a new one (e.g. timed multiple-choice)

Quizzes live in `lib/quizzes.js` (the `QUIZZES` array, read by `getQuiz`) and render at `/quiz/[id]`
through `app/quiz/[id]/QuizClient.jsx`. QuizClient is the shared shell: header, sticky ribbon tabs
(Play / Stats / Share / Join the Leaderboard / Critique), the personal-stats + leaderboard panel, the
share UI, the join form, and the "Comments? Questions?" modal that posts to `/api/complaints`. A quiz's
`format` field selects how the Play area renders. Default (no `format`) is the name-them-all text quiz;
specialised formats dispatch to a dedicated board:

- `format: 'map'` -> `MapQuizBoard` (click-the-country geography board)
- `format: 'bank'` -> `BankQuizBoard` (one prompt at top, single clickable answer bank below) -- THE standard matching / fill-in-the-blank format
- `format: 'matched'` -> `MatchQuizBoard` (labeled grid, typed input)
- `format: 'pairs'` -> `MatchQuizBoard` (LEGACY two-column matcher; do NOT use for new quizzes, see the bank-format section above)
- `format: 'timed-mcq'` -> `TimedMcqClient` (full-page timed multiple-choice; first added 2026-06-12)

The shared quiz APIs (reuse them, do not invent new ones): POST `/api/quiz/view` once per page load
(analytics); GET `/api/quiz/board?quizId=<id>` -> `{ plays, best, leaderboard }`; POST
`/api/quiz/result { quizId, score, total, timeElapsed, email? }` to record a finished game; POST
`/api/quiz/join { username, email }` for the leaderboard sign-up; POST `/api/complaints` for the
critique modal. The leaderboard ranks by `score` DESC then `timeElapsed` ASC, and `best` is the high
score, so any format that maps its result onto an integer `score` (with `0 <= score <= total <= 1000`)
slots into the existing board with no backend change. The page identity is stored in
`localStorage.sot_quiz_identity`; personal stats live under `sot_quiz_<id>`.

### Steps to add a format

1. **Build the board/component in `app/quiz/[id]/`.** Two patterns: a *partial board* (rendered inside
   the QuizClient shell, like `MapQuizBoard`) when the format reuses the shell's clock and scoreboard;
   or a *full-page client* (like `TimedMcqClient`) when the format needs its own scoreboard, timer, and
   flow. The full-page client renders its own `Grain`/`Footer`/header/ribbon and reuses the same APIs
   and visual tokens (the `COLORS`/`MONO`/`SERIF`/`SANS` constants), so it stays on-brand.
2. **Dispatch in `QuizClient.jsx`.** Dynamic-import the component next to the other boards
   (`const TimedMcqBoard = dynamic(() => import('./TimedMcqClient'), { ssr: false, loading: () => null });`)
   and add an early return for the format placed with the `if (!quiz)` return, BEFORE the line
   `const answers = quiz.answers;` (that line throws for any format without an `answers` array):
   `if (quiz.format === 'timed-mcq') return <TimedMcqBoard quizId={quizId} />;`. The early return is
   safe with rules-of-hooks because `format` is stable for a mounted quizId, exactly like the existing
   `if (!quiz)` return.
3. **Metadata and social cards need no change.** `app/quiz/[id]/page.js` (`generateMetadata`) and
   `opengraph-image.js` are already format-agnostic, they use only `quiz.title` and `quiz.blurb`. As
   long as a new format object carries a title and blurb, the share card and `<head>` are correct.
4. **No separate registration.** `/quizzes` lists every entry in `QUIZZES` automatically.
5. **Wire the abandon flush (every board, no exceptions) (owner rule, 2026-06-27: abandon = count).**
   A quiz only records a result when the game FINISHES; a mid-quiz exit (back button, tab/window
   close) would otherwise be lost. Every board calls `useAbandonFlush` from `./useAbandonFlush` so an
   in-progress exit still posts a NORMAL result via `pagehide` (partial score and all, which DOES enter
   averages/leaderboard, per the owner's choice). In a new board: add
   `const abandon = useAbandonFlush(() => <payload-or-null>)` near the other hooks, returning the
   `/api/quiz/result` body (the same shape that board's finish posts) ONLY when the game is started and
   not yet finished (return null when idle/done, and gate on first-attempt where the finish path does);
   then call `abandon.markFlushed()` at the top of the finish handler so the exit never double-posts.
   Delivery is sendBeacon with a keepalive-fetch fallback; `pagehide` (not `visibilitychange`) avoids
   false abandons from a tab-switch-and-return. All 9 existing boards already do this (QuizClient,
   TimedMcqClient, GeoAerialClient, MapPlaceClient, GlobePlaceClient, LogicGameClient, LogicGridClient,
   GridFillBoard, SurviveStateBoard).

### Timed multiple-choice (`format: 'timed-mcq'`) data shape and scoring

```
{
  id, publishedDate, publishedAt, title, category, type, tags,
  format: 'timed-mcq',
  perQuestionTime: 30,        // seconds per question
  maxPerQuestion: 30,         // points for an instant-correct answer
  timeLimit: 300,             // = perQuestionTime * questions (kept for legacy readers)
  blurb,
  source,                     // optional attribution line
  questions: [
    { q: 'Question text?', choices: ['A','B','C','D'], correct: 2, note: 'One-line reveal explainer.' },
    // ...exactly the count you want; 10 is the house default
  ],
}
```

- **Scoring is linear time-decay.** Each question is worth up to `maxPerQuestion`, falling linearly
  over `perQuestionTime`: answer instantly and bank the full points, answer at the buzzer and bank ~1
  (correct answers are floored at 1 so a slow-but-right answer still beats a wrong one), a wrong pick
  or a timeout banks 0. The game maximum is `questions * maxPerQuestion` (300 for the standard 10 x 30)
  and is reachable only in theory. The final point total is what gets posted as `score`, with `total`
  set to that maximum, so the leaderboard reads e.g. `247/300`.
- **`correct` is the 0-based index into `choices`.** VARY it across questions, never leave every answer
  at the same position (all-A is an instant tell). Shuffle each question's options before shipping.
- **News quizzes are dated.** Use a dated `id` and `title` (e.g. `weekly-business-quiz-2026-06-12`,
  "Weekly Business Quiz 6/12/26") so each week's leaderboard stays separate; set `publishedAt` at push
  time per the Deploy rules. Gather every fact from live, citable sources (filings, Bloomberg, Reuters)
  and write a one-line `note` per question so the reveal teaches.
- **Component reference:** `app/quiz/[id]/TimedMcqClient.jsx`. It owns the per-question countdown, the
  decaying live point meter, the four-option board with correct/wrong reveal, the per-question recap on
  the results card, and the Stats/Share/Join/Critique tabs. Posts `score` (points) / `total` (max) to
  the shared result API.

## Survival quizzes (`format: 'survive-state'`) — one strike, name the state

Board: `app/quiz/[id]/SurviveStateBoard.jsx` (full-page board, no timeLimit countdown — the clock
counts up; the stored `timeLimit` field is vestigial series convention). One prompt at a time in a
random order every run; typing the complete correct answer auto-advances with no Enter; typing a
complete
WRONG U.S. state name (or pressing Enter on any wrong text) ends the run instantly. Score = prompts
cleared. Only the first attempt posts to the leaderboard. Data shape:
`answers: [{ stadium, team, t, alt? }]` — the prompt renders `stadium` (whatever the venue type,
the field name stays `stadium`), `promptLabel` captions it ('Stadium' / 'Arena' / 'Ballpark'), `t` is
the canonical answer, and optional `alt: []` lists extra accepted forms. The auto-strike list is the
50 states + District of Columbia only; a complete state name that is a PREFIX of any accepted form
never auto-strikes (so `t: 'District of Columbia', alt: ['Washington DC', 'DC']` lets a player type
"washington dc" without dying at "washington"). `noun` is the answer word used in the copy
('state', or 'state or province' for leagues with a Toronto team), and `regionWord` (added
2026-07-02) replaces the idle screen's default "U.S. <noun>" phrase for quizzes whose answers are
not all U.S. states. Non-US answers (e.g. 'Ontario') are typed exactly; they are not in the
auto-strike set, so a wrong province only strikes on Enter. Series: `nfl-stadium-state-1-strike`,
`college-stadium-state-1-strike` (Pt 1-3), `nba-arena-state-1-strike`, `mlb-ballpark-state-1-strike`
(the NBA/MLB pair carry Ontario + District of Columbia answers and say "state or province" in the
blurb, which is rules copy, not an answer hint).

## Quiz page formatting and consistency rules (owner rule, 2026-06-12)

EVERY quiz page, regardless of `format` (name-them-all, `map`, `pairs`, `matched`, `timed-mcq`, and any
future board), MUST present IDENTICAL page chrome. The canonical implementation is
`app/quiz/[id]/QuizClient.jsx`; it is the source of truth. When you add a new format or touch any quiz
board, diff your component's user-facing strings and layout against QuizClient and reconcile EVERY
difference before shipping. A new board that renders its own full page (like `TimedMcqClient.jsx`)
re-implements this chrome, so it is the easiest place to drift, audit it against this list.

Shared chrome that must match QuizClient exactly:

- **Back link (top left):** the ArrowLeft icon plus the text "Back to all quizzes". NOT "Back to all
  lists".
- **Header:** the Fraunces h1 `quiz.title`; the right-aligned eyebrow `{quiz.category} · Quiz` (ember,
  uppercase) with the two divider rules under it (1px ink, then 2px ember); then the italic Fraunces
  `quiz.blurb`. The eyebrow is `· Quiz` for every format (do NOT vary it, e.g. no "· Timed Quiz"). Do
  NOT place the source line in the header.
- **Ribbon tabs, in this exact order and wording:** Play; Stats & Leaderboard; Join the Leaderboard
  (Trophy icon); Share (Share2 icon); then the Critique? button (HelpCircle icon) opening the critique
  modal. Labels are exact: "Stats & Leaderboard" (not "Stats"), "Join the Leaderboard" (not "Join").
- **Critique modal:** heading "Comments? Critique?"; body "Spot an answer that should count, or
  something off about this quiz? Tell the editors."; optional Name / Email / message fields; posts to
  `/api/complaints` with `listTitle` prefixed `[Quiz] `. Success state: heading "Thanks, noted." with
  "Your question went to the editors' desk. We read every one."
- **Source line:** rendered ONCE, at the BASE of the page content (just before the modal / `<Footer />`),
  with a top border, MONO 11px, faded color, as `Source: <label>` (label links in rust when a URL is
  present). Support `quiz.source` as EITHER a string OR a `{ label, url }` object.
- **Page frame:** background `COLORS.cream` with `<Grain />`, shared `<Footer />` at the bottom.
- **Styling tokens:** reuse the same `COLORS` (cream/paper/ink/ember/rust/forest/faded) and
  `MONO`/`SERIF`/`SANS` font constants. Never hardcode a different palette or font stack.
- **Stats/leaderboard:** read `/api/quiz/board` and `/api/quiz/result`, shape `{ plays, best,
  leaderboard }` (best = high score; rows `{ username, score, timeElapsed, tryNum }`). Stats tab heading
  "Your record"; empty state "Play a round and your record shows up here. It stays on this device."

Format-specific parts that MAY differ (because gameplay differs), everything else above stays identical:
the Play-area board itself (text input + answer slots vs the clickable map vs the timed question card),
the scoreboard metrics (names found vs points), the in-board action control (e.g. "Give up" vs
"End now"), and the Share/results microcopy.

**The "you beat X% of players" results line is a MODELED percentile of the score itself** (the
`percentile()` curve), NOT a tally of real players, so it shows even on the first/only play. This is
intentional and shared by every quiz. Keep it consistent across formats; if it should ever reflect real
play data, change it in QuizClient AND every board in the SAME pass.

## Typed quizzes derived from matching games: the clue must have exactly one answer (owner rule, 2026-06-13)

A `format: 'type-it'` quiz shows the clue (`answers[].label`) and the player types the answer
(`answers[].t`). When such a quiz is DERIVED from a two-column matching/`bank` game, the matching game
is bidirectional and fine, but the typed version is one-directional: it is valid ONLY in the direction
where **each clue has exactly ONE correct answer**. Choose that direction; flip the pair if the chosen
clue is a container with many members.

- BROKEN (one-to-many in the shown direction): `Country -> city` ("Name the City for Each Country") — a
  country has many cities and the player isn't told which is wanted. FLIP to `city -> country` ("Name
  the Country for Each City"): a city is in exactly one country. Same failure class, all flipped
  2026-06-13: `Industry -> company` -> `company -> industry`; `Game (fighting) -> fighter` ->
  `fighter -> game`; `Region -> wine` -> `wine -> region` (appellation makes a named wine resolve to one
  region). The reverse side is the hard one-to-one fact, so flip to it.
- FINE as-is (clue already fixes the answer; do NOT flip — the reverse is the many-valued side):
  `country -> capital/currency/continent/official language/national sport/highest peak`, `capital -> river`
  (one main river), `desert -> continent`, `empire -> capital`, `hotel/bridge/skyscraper/sandwich/street -> city`,
  `sitcom/novel -> setting city/opening city`, `achievement -> pharaoh`, `author -> genre`, `game -> protagonist`.
- METADATA-ONLY fix (data is already one-to-one but the title/leftLabel/noun describe the reverse): e.g.
  `river-to-continent-typed` carried river->continent data under a "Name the River for Each Continent"
  title; corrected the title/leftLabel/noun to "Name the Continent for Each River" with no data flip.
- FUZZY in BOTH directions (signature relationships, neither side a hard fact): `region <-> grape`,
  `actor <-> director`, `setting <-> novel`. Do NOT force a flip; FLAG to the owner. Also flag a broken
  quiz that cannot flip without duplicating an existing one (`scientist-to-field-bank-typed` is the
  broken `field -> scientist` twin of the already-correct `match-scientist-nobel-field-typed`).
- When you flip: swap `label`/`t`, REGENERATE `keys` for the new `t`, update `title`/`leftLabel`/`noun`,
  run the accepted-answer collision audit, and KEEP the quiz `id` unchanged (it is the leaderboard/URL
  key) even though the id then reads backwards. `node --check` before deploy. The paired matching/`bank`
  game is left untouched (a two-column match is bidirectional and not subject to this rule).

## Series titles: the first entry carries (Part 1) (owner rule, 2026-06-13)

When a quiz or list series has any `(Part 2)`+ entries, the FIRST entry MUST be labeled `(Part 1)`, never
left unnumbered. Title is display-only (the `id` is the key), so this is a pure title edit with no
vote/key migration. Applied 2026-06-13 to the quiz series Opening Line to the Novel, Tagline to the
Movie, Name the Brand From the Logo, Name the Movie From the Poster, and Name the Missing Word in Each
Book Title (lib/data.js had no Part-numbered series).

## Quiz-page ribbon mobile scroll cue must exist in EVERY render path (owner rule, 2026-06-13)

The sticky quiz ribbon's mobile horizontal-scroll cue (the ember `<`/`>` chips shown when the ribbon
overflows on viewports <760px, driven by `ribbonRef` + `ribScroll` state + the `.qz-cue` CSS) must be
present in every quiz-page render path, matching the other ribbons site-wide. `QuizClient.jsx` has it;
the FULL-PAGE board clients that re-implement the ribbon each need their own copy. Added 2026-06-13 to
`TimedMcqClient.jsx`, `LogicGridClient.jsx`, and `PhotoQuizClient.jsx`. The PARTIAL boards rendered
inside QuizClient (`TypeItBoard`, `MapQuizBoard`, `MatchQuizBoard`, `BankQuizBoard`) inherit QuizClient's
ribbon and need no change. Any future full-page board must include the cue too.

## Typed quizzes auto-accept on type, and the score+input pin to the top (owner rule, 2026-06-15)

Two interaction rules for EVERY typed "name them all" quiz format, including any new full-page board
(the cross-fill `grid-fill` board, first quiz `biggest-us-companies-by-year`, was corrected to follow them):

- **Live auto-accept, no Enter.** A correct answer is taken the INSTANT it is typed: the input is
  matched on every keystroke (`onChange`/`onType`), and on a hit the answer is accepted and the box
  cleared, with NO Enter press required. Enter and the Guess button stay only as a fallback for
  explicit submission, but typing alone must score. Never require Enter to accept a correct answer.
  In the live every-keystroke matcher, GUARD short aliases/tickers: a 1-2 character exact match (e.g.
  the tickers T, V, C, GE) is accepted ONLY on explicit submit, never during auto-accept, or typing
  "tesla" would grab AT&T on the first "t". Full names and 3+ char tickers auto-accept normally.
  Implemented as `onType` + `matchCompany(raw, companies, autoMode)` in `GridFillBoard.jsx`.

- **The score block + input pin to the top.** The scoreboard and the answer input live in ONE sticky
  container at `top: 0` (z-index above the board, cream background) so they stay visible while the
  board scrolls; the nav RIBBON is NOT sticky and scrolls away. This mirrors QuizClient's shared shell
  (the `scoreRef` sticky block, ribbon non-sticky). Any full-page board that re-implements the chrome
  must pin its input the same way.

Also: duration ("time spent") labels roll into days, not raw hours. `fmtDur` on the quizzes homepage
renders e.g. `1d 1h 1m`, never `25h 1m` (days/hours/minutes, omitting leading zero units).

## Quiz mobile vs desktop rendering — board-level branching only (owner rule, 2026-06-19)

Quiz pages adapt to mobile at the BOARD level only; page chrome stays consistent across desktop
and mobile (owner decision, 2026-06-19).

- **Header and footer are identical on desktop and mobile.** Do NOT swap in a slim header or drop
  the footer on mobile. (An earlier slim-header / no-footer experiment was reverted on this rule.)
- A `useIsMobile()` hook lives at `app/quiz/[id]/useIsMobile.js` (true at viewport <= 760px; null
  until mounted, boards are `ssr:false` so no hydration mismatch). `QuizClient.jsx` computes
  `const mobile = useIsMobile()` and passes `mobile` to every board; full-page boards (TimedMcq,
  LogicGrid, GridFill) receive it via their early-return props.
- **Only boards whose desktop layout genuinely breaks on a phone branch on `mobile`:** map
  (`MapQuizBoard`: hide the desktop Map size controls, full-width, marker tap targets 9px->13px);
  matching (`MatchQuizBoard`, formats `matched`/`pairs`: two-column grid collapses to one);
  grid-fill (`GridFillBoard`: five-across year blocks -> two-across, four-col stat -> two-col).
- **All other formats already reflow and take NO mobile branch:** default name-them-all, photo,
  posters, logos, images, bank, photo-match (auto-fit/wrapping grids), timed-mcq (single-column),
  logic-grid (horizontal-scroll).
- **Future quizzes inherit this automatically** (branching lives in the shared board components);
  a new map/matched/pairs/grid-fill quiz is mobile-ready with no extra work. When adding a NEW
  board format that renders poorly on a phone, add the same `mobile`-gated branch INSIDE that board
  component only; never reintroduce header/footer branching.

---

## Business News quiz hub (`/quizzes/business-news`) — maintenance (built 2026-06-23)

The Business News hub is a curated landing page for the site's business/markets quizzes. It lives at
`app/quizzes/business-news/page.js` (server, metadata/share copy) + `BusinessNewsClient.jsx` (client).
Three sections, each auto-populated from data so adding a quiz is a one-line registry edit:

- **News Recaps** — every quiz whose id matches `NEWS_RE`
  (`/^(daily-market-news|daily-business|weekly-business|earnings-reporter)/`, excluding `mobile-preview`),
  newest first, displayed with a NORMALIZED label `"<Type> m/d/yy"` derived from the id (the underlying
  quiz `title` is NOT renamed). Capped at 6 (`NEWS_MAX`, sized to match three thematic buttons) with a
  "Show all" expander.
- **Thematic Updates** — sector quizzes registered in `SECTOR_META` (inline in `BusinessNewsClient.jsx`):
  `{ name, emoji, sub, date }`, rendered as row buttons with the date chip for relevancy. Reserves
  `SECTOR_SLOTS` (3) slots; unused slots show muted "Coming soon" placeholders.
- **Company Earnings** — quizzes in `COMPANY_META` OR matching `EARN_RE`
  (`/-\dq\d\d-earnings-quiz$/i`), shown as favicon cards (ticker chip + question count), with a
  company search box, capped at 24 (`CO_MAX`) with expander.

**`COMPANY_META` is shared, in `lib/company-quiz-meta.js`** (`{ id: { ticker, name, domain } }`), imported by
BOTH the hub (favicon + ticker) and the share-image routes (favicon baked into the card). Add a company
there to wire both at once. Favicons come from Google s2 (`google.com/s2/favicons?domain=<domain>&sz=...`)
with a letter-badge fallback.

### Business-news quizzes are timed-mcq, category `Business`

All hub quizzes use `format: 'timed-mcq'`, `category: 'Business'`, `maxPerQuestion: 10`, `perQuestionTime: 20`,
`graceSeconds: 4`. Company earnings quizzes are 20 Q (200 pts); sector quizzes are 30 Q (`timeLimit: 600`,
300 pts). The timed-mcq intro headline reads **"Test your knowledge."** (in `TimedMcqClient.jsx`), never
"Beat the clock." Always **shuffle each question's choices before shipping** so the correct index is evenly
spread (no all-B); keep the curated lead question at array index 0 (it is not reordered by the shuffle).

**Lead question = the single BEST question, ideally subjectively framed (with a real factual answer), at
index 0.** It is FEATURED on the share card. Curate it per quiz (e.g. "Which software giant has been the
biggest casualty of the 2025 SaaS selloff?" -> Atlassian). To keep the count, replace the now-duplicate
factual question rather than adding a 31st.

### Share images (featured-question card)

`lib/og-brand-card.js` `renderQuizQuestionCard` renders a card showing the quiz's FIRST question + its four
options (answer not revealed), the quiz title (right-aligned, dark, on the "Question 1 of N" line), the
company favicon top-right (company quizzes), and a "PLAY FREE, TOP THE LEADERBOARD" CTA. The OG route
(`opengraph-image.js`, reused by `twitter-image.js`) and the promo route (`share-image/route.js`) use it for
any quiz where `category === 'Business' && format === 'timed-mcq'`; everything else uses the normal title
card. `result-image/route.js` keeps the score card but adds the company favicon. Favicon fetch is wrapped in
try/catch (returns null -> renders without it), so a fetch failure never breaks the static OG generation.

### Completion popup (every timed-mcq quiz)

The results card in `TimedMcqClient.jsx` shows, under the score box, two equal-size cards side by side:
**Leaderboard** snippet on the LEFT (top 3, then the finishing place if outside the top 3, highlighted) and
**Your standing** (ELO rating + global/category ranks, with smaller text) on the RIGHT, then all three
buttons (Quiz Summary, Post to Leaderboard, Challenge a friend) UNDERNEATH.

### Daily Challenge: OBJECTIVE/FACTUAL quizzes only, never consensus lists (owner rule, 2026-06-25)

Every quiz placed in `DAILY_SCHEDULE` (lib/challenges.js) must have a single, defensible correct
order that is a matter of FACT, not editorial taste. The Daily Challenge scores players on a "name
them all / in order" basis, so a subjectively ranked list has no honest answer key and must never be
used.

- **ALLOWED:** facts-mode lists and standalone factual quizzes whose order is data, e.g. best-selling,
  top-grossing, biggest/largest/most, capitals, champions/title counts, stat leaders, awards-by-year,
  box-office filmographies (tarantino-films, coen-brothers-films), and matched/bank/map/photo quizzes
  built on a cited objective source.
- **BANNED:** any quiz derived from a subjective "Best X" editorial CONSENSUS list, i.e. a quiz whose
  paired `listId` points to a Borda/vote list (anything that is NOT `mode: 'facts'`), or whose quiz
  `source` reads "Based on the consensus of <publications>". Critic-consensus director rankings
  (hitchcock-movies, kubrick-movies, john-hughes-movies, bigelow-movies) are banned even though
  box-office filmographies of the same directors are fine.
- **How to check before adding an entry:** open lib/quizzes.js, find the quiz id. If it has a
  `listId` whose lib/data.js list is not `mode: 'facts'`, or its `source` contains "consensus of",
  do NOT use it. There is a matching HARD-RULE comment block directly above `DAILY_SCHEDULE` in
  lib/challenges.js.
- **Editing the schedule:** you may swap today's or any NOT-YET-OCCURRED index, but NEVER edit an
  index whose Eastern date has already passed (it would rewrite that day's frozen leaderboard). A
  past entry that happens to contain a now-banned consensus quiz is left as frozen history; the ban
  applies to today and all future selections. (First applied 2026-06-25: idx 6,13,16,17,30,42,43,45,
  58,65,95 were scrubbed of consensus quizzes; idx 3, already past, was deliberately left untouched.)

### Daily Challenge toggle (`DAILY_CHALLENGE_ON` in `lib/challenges.js`) — OFF since 2026-10-09

**UNPLUGGED 2026-10-09 (owner), together with Quiz of the Day: Potluck (`/potluck`, see its section
at the end of this file) is the daily quiz pick now.** The paragraph below is the history.

`DAILY_CHALLENGE_ON = true` as of 2026-07-02 (this section previously said OFF and had gone stale;
verify the flag on origin before relying on this file). When true, the daily challenge appears in
`openChallenges`, `challengeMenu`, and the `/quizzes` board rotation, governed by the factual-only
`DAILY_SCHEDULE` rule above. Setting it to false suppresses all of that and collapses the rotating
button to a static "Business News / Quiz Hub" link (it rotates `openChallenges()` + a
`business-news` entry).

### Adding a quiz to the hub

- **Company earnings quiz:** build a `timed-mcq` quiz with id `<company>-<q>q<yy>-earnings-quiz` (20 Q), add a
  `QUIZ_DEPT` entry -> `'business'`, and add `COMPANY_META[id] = { ticker, name, domain }`. It auto-appears in
  Company Earnings, gets a favicon on its share card, and a featured-question share card.
- **Sector/thematic quiz:** build a `timed-mcq` quiz id `<topic>-sector-update`, title `"... Update Quiz (Month YYYY)"`,
  30 Q / 300 pts, curated subjective Q1, add `QUIZ_DEPT` -> `'business'`, and add
  `SECTOR_META[id] = { name, emoji, sub, date }`.
- **News recap quiz:** id matching `NEWS_RE`; it auto-lists, no registry edit needed.
- Every new quiz needs a distinct `publishedAt` stamped at push time and a `QUIZ_DEPT` entry. After deploy,
  IndexNow-ping the new `/quiz/<id>` URLs (the hub URL is already live).

## Quiz hub hero system: per-quiz registry + QOTD rotation (2026-07-01)

**QUIZ OF THE DAY WAS UNPLUGGED 2026-10-09 (owner).** The `/quizzes` featured row lost its QOTD tile
(Most played leads it now) and `QuizHomeClient`'s qotd memo returns null behind `QOTD_ON = false`.
`QOTD_POOL` / `qotdIdFor` remain in `lib/quiz-heroes.js` but nothing reader-facing calls them.

The featured photos on `/quizzes` are driven by ONE per-quiz registry,
`lib/quiz-heroes.js` (`QUIZ_HEROES`, keyed by quiz id -> `{ src, pos? }`). This
SUPERSEDES the old `lib/quiz-category-heroes.js` (`CATEGORY_HEROES`), which is now
unused (left in the tree, do not add to it). `QuizHomeClient.jsx` imports
`QUIZ_HEROES` + `qotdIdFor` from `lib/quiz-heroes.js`.

All three featured slots only ever show a quiz that is IN `QUIZ_HEROES`, so no slot
is ever heroless:
- **Category card** = the most-PLAYED quiz in that category that has a registry hero
  (falls back to the department photo `DEPT_HERO` only if the category has zero heroed
  quizzes). It follows live plays but never hands off to a challenger without a hero.
- **Newest tile** = the actual newest quiz; its registry hero is preferred, else the
  live Wikipedia lookup, else `DEPT_HERO` (never blank).
- **Quiz of the Day** = `qotdIdFor(easternYmd())`: a per-date pin in `QOTD_OVERRIDES`
  wins; otherwise it auto-rotates each Eastern midnight over `QOTD_POOL`. Title,
  eyebrow, and blurb come from the chosen quiz; the photo from the registry. It flips
  on its own at ET midnight with NO deploy.

To feature a quiz on a specific day: add `QOTD_OVERRIDES['YYYY-MM-DD'] = '<id>'` (the
id MUST be in `QUIZ_HEROES`). To make any quiz eligible for a featured slot: add it to
`QUIZ_HEROES` (JPEG/PNG only, verified through `/_next/image`) and, for QOTD rotation,
to `QOTD_POOL`. Heroes must never be WebP/AVIF.

Audit before shipping hero changes: `node scripts/audit-quiz-heroes.mjs` (checks the
QOTD schedule for the next 14 days, hero-id orphans, and JPEG/PNG format). Category
leaders and the newest tile also depend on LIVE play counts, so those aren't
build-checkable.

**HARD RULE (owner, 2026-07-03): the newest quiz ALWAYS needs a real registry hero.** The quiz with the latest `publishedAt` drives the `/quizzes` **Newest tile**, so whenever you publish a quiz (or a batch), the newest-stamped id MUST get a `QUIZ_HEROES` entry (JPEG/PNG, verified through `/_next/image`) in the SAME push that ships the quiz — never leave the newest quiz to the Wikipedia-lookup / `DEPT_HERO` fallback. When shipping several quizzes at once, at a minimum the newest one is heroed (ideally hero every new quiz). After deploy, VERIFY the Newest tile on `/quizzes` renders the intended photo.

## Quiz home layout: search + tool row moved out of the header (owner rule, 2026-07-29)

The blue command header on `/quizzes` (`app/quizzes/QuizCommandHeader.jsx`) no longer carries the
search box. Search now lives in a **full-width tool row** (`.qz-toolrow` in
`app/quizzes/QuizHomeClient.jsx`) that spans the content width directly BELOW the three-column daily
section and ABOVE the browse row. Rules for anyone touching this area:

- **The header keeps only:** brand, "Exercise Your Mind", the welcome/rank block, Stat Hub, and the
  Puzzles & Quizzes / Top 10 Lists toggle. Do NOT reintroduce a search input, the `SearchIcon`
  helper, or the mobile `focusListSearch` icon button. `QuizCommandHeader` takes
  `{ me, onSignup, ticker }` and no longer accepts `search` / `onSearch`.
- **Header identity block reads "Welcome <name>"** ("Welcome" is the lighter `.qch-hi` span, hidden
  under 620px), with the rank detail below it on the right as before, now carrying the **completed
  percent next to the raw count**: `Rank #1 · 157 completed · 7%`. The percent is
  `me.activity.completed / QUIZ_COUNT` (the whole catalogue), one decimal under 10%, `<0.1%` when it
  would round to nothing.
- **The tool row is search + three actions.** The search input (`#qz-hero-search`) grows to fill and
  is bound to the SAME `search` state as the browse-row field (`#qz-main-search`) further down, so
  typing in either filters the same feed. Beside it, flush right: **Report an issue**, **Talk to the
  manager**, **Request a quiz** (accent-filled CTA).
- **Report an issue and Talk to the manager share ONE form and ONE pipeline.** Both open
  `FeedbackModal` in `QuizHomeClient.jsx`, which POSTs `/api/complaints` (the same `complaints` table
  and admin Notices tab that list feedback and the per-quiz Critique modal use). Only the heading,
  blurb, and the stored `listId` / `list_title` differ (`quiz-home-issue` /
  `Quiz home: issue report` vs `quiz-home-manager` / `Quiz home: talk to the manager`) so the editors
  can tell a bug report from a note to the manager. Never fork this into a second endpoint.
- **Request a quiz links to the existing `/request` form** (`app/request/RequestClient.jsx`, "Request
  a List or Quiz"). It is NOT wired to the complaints pipeline and needs no new route or table.
- Responsive: at <=1024px the search takes its own line and the three buttons split it evenly; at
  <=560px the buttons go two-up with the CTA full width.

---

## Quiz home search + browse: direction B, same as the console above it (owner, 2026-08-14)

The search row and the browse columns were the last part of the quiz home still on
the pre-direction-B look while everything above them (the cap cards, the slate, the
rails) had moved. They now use the same vocabulary, and the two things direction B
banned outright are gone from this surface as well: **pastel tinted icon squares and
chevrons**.

Per card, in `BrowseColumn` (and `CategoryMastery`, which borrows the same
`catcard` + `cc-head` shell so it gets the same treatment):

- **The category colour is a 4px left rule**, `--cc`, set inline on the section and
  drawn by `.catcard::before`. The 24px `colicon` square that used to carry that
  colour is NOT rendered at all in a card header.
- **The header is a tinted strip** (`--cct`, the colour's palest tint) carrying an
  uppercase eyebrow over the 800-weight name. The category COUNT lives in the
  eyebrow (`Category / 467`), not in the CTA.
- **One control on the right edge**: `.cc-head .viewall` is a chip filled with
  `--cc`, white ink. No `>` in any cta string.
- **Hero photos are untouched** — photo, plays/leader caption, title, Play arrow.

The tool row takes the same left rule (in the CTA blue) so the search reads as the
same kind of object as the cards under it, and **Request a quiz** is its one accent
(`.qz-toolcta`); Report an issue stays outline.

Four things worth knowing before touching this:

- **The rule is a `::before`, NOT `border-left`.** A border reflows every grid track
  by 4px and curves into the 12px corner radius instead of reading as a straight bar.
  The pseudo-element is clipped to the radius for free by the card's own
  `overflow:hidden`, and sits at **z-index 3** so it reads PAST the hero photo
  (`.cc-ov` is 1, `.cc-stat`/`.cc-btm` are 2). It survives the phone edge-to-edge
  treatment (`border-radius:0` under 900px) unchanged.
- **Do not hide the icon square with CSS.** `.colicon` carries an INLINE
  `display:flex`, which outranks the stylesheet, so `.cc-head .colicon{display:none}`
  silently does nothing — that shipped once and every square was still rendering
  beside its new rule. The node is not rendered when the header is a card header.
  The CSS rule stays only as a guard for a future `cc-head` that renders one.
- **The `<=560` colhead overrides are scoped `:not(.cc-head)`.** They were written for
  the boards' accent-filled header (`background:var(--white) !important`,
  `.viewall{color:var(--muted) !important}`) and unscoped they flatten the tinted
  browse header and grey out its filled chip.
- **A new BrowseColumn call site passes `eyebrow` and a chevron-free `cta`**, plus
  `color`/`tint` as before (those two now feed `--cc`/`--cct`). A column with neither
  simply renders no rule and falls back to `--surface` / the accent chip.

VERIFY ON THE LIVE SITE, not from the rule: read `getComputedStyle` for the
`::before` width/colour, the header background, the chip fill, and confirm
`document.querySelectorAll('.cc-head .colicon').length === 0` and zero `>` in the
body text. The inline-display bug above passed every read of the CSS and was only
caught by measuring the rendered element.

## Quizzes move onto the Loft format (started 2026-08-20, behind ?loft=1)

The dailies finished their Loft rollout on 2026-08-15: navy ground, the blue cap in place of a
title block, the board as the one lit sheet, and a flip to `LoftFinish`. The ~1,200 QUIZZES were
left on the old light page with their own inline results block, so the two halves of the site read
as two different products (owner, 2026-08-20: "I want our quizzes to utilize the same elements as
our daily puzzles, notably the header, footer, and end game card").

**The header and footer were already the same COMPONENTS and that was exactly the problem.** Both
surfaces render `QuizNavHeader` and `Footer`; what differed was the treatment around them, so the
fix is not a new header, it is putting the quiz page in the frame that treats them. A loft quiz
page now renders `DailyChrome` itself, which is the dailies' own header, so the two cannot drift
apart again. The footer needs no work at all: `.loft-page footer` re-inks it for a dark ground.

### The switch: `app/useQuizLoft.js`

The quiz twin of `app/useLoft.js`, same three ways in, same order: an explicit prop, then
`QUIZ_LOFT_ON`, then `?loft=1` read IN AN EFFECT (never during render, or the server and client
disagree and React throws). **`QUIZ_LOFT_ON` is false**, so nothing has changed for a reader; the
format is reachable only at `?loft=1` while the owner reviews it.

**THERE IS DELIBERATELY NO PER-QUIZ LIST**, and this is the one place the quiz rollout is a
different shape from the daily one. A daily game is a hand-written client, so `LOFT_GAMES` earned
its keep one line per game. Every quiz renders through one of TWELVE shared clients, so the unit of
rollout is the CLIENT: converting `QuizClient` moved roughly a thousand quizzes at once and there
is nothing per-id to gate.

### What is converted, and what is not

| Client | Quizzes | State |
|---|---|---|
| `QuizClient` (bank, type-it, photo, matched, map, word-scramble, posters, logos, order-bank, photo-match, street-map) | ~1,000 | **converted** |
| `TimedMcqClient` | 46 (the business-news set) | not yet |
| `GeoAerialClient` | 29 | not yet |
| `MapPlaceClient` | 20 | not yet |
| `LogicGameClient`, `ConnectionsBoard` | 10 each | not yet |
| `SurviveStateBoard` | 6 | not yet |
| `CloserBoard`, `HigherLowerBoard`, `LogicGridClient`, `GlobePlaceClient`, `GridFillBoard` | a handful each | not yet |

The eleven outstanding ones each render their own full page (header, ribbon, footer) rather than
going through the shell, which is why they need converting individually. Do them in the same shape
as the shell: they are the same five structural edits.

### The five edits, in order (the conversion recipe)

1. `const LOFT = useQuizLoft();` with the other state. In `QuizClient` this sits AFTER the
   `if (!quiz)` early return that already sits above every hook, so the hook order stays stable for
   a given quizId exactly as it was.
2. `className={LOFT ? 'loft-page' : undefined}` on the root div. The `!important` in
   `.loft-page{background:var(--accent)!important}` is load-bearing: the background is an inline
   style and a plain rule can never win against it.
3. `{LOFT ? <DailyChrome loft /> : <QuizNavHeader />}`, then `<LoftCap>` immediately after it and
   OUTSIDE the page column so the band bleeds. Gate the page's own serif `<h1>` behind `{!LOFT &&`,
   or the cap and the title say the same thing twice.
4. Wrap the play area: `loft-stage` > `loft-flip` > `loft-flip-in` > `loft-face` > `loft-sheet`.
5. Gate the old inline results block behind `&& !LOFT` (gate it, do not delete it: it is what every
   quiz still renders with the flag off) and hang `<QuizLoftFinish>` as a sibling of `loft-face`.

Two things that come free and are worth knowing rather than rediscovering:

- **`.loft-page > [class$="-wrap"]:not(.dch-wrap)` zeroes the page column's padding**, and it
  matches on the `-wrap` SUFFIX. `qz-pagewrap` is already caught by it. A converted client whose
  wrapper carries a SECOND class, or no wrapper class at all, silently falls outside it.
- **`LoftCap` measures `--loft-col` off `.loft-sheet`**, so the cap lines up with the board rather
  than the site header without anything being passed to it.

### `QuizLoftFinish` is an ADAPTER, not a second end card

`app/quiz/[id]/QuizLoftFinish.jsx` renders the shared `LoftFinish`, the same object all 65 dailies
flip to, so anything that improves one improves the other. It is its own component rather than a
block inside `QuizClient` for a specific reason: it needs `useDayStats`, which has **no `active`
gate** and fires its fetch the moment it mounts. Calling it in `QuizClient` would put one extra
request on every one of the ~1,200 quiz page loads whether or not the player ever finishes; a child
mounted only once the round is over pays for it only when the card is shown, and hooks cannot be
called conditionally.

Three things a quiz does not have, each handled rather than left to print a dash: no ARCHIVE (omit
the prop and no archive button renders), no MISS COLUMN (quizzes count nothing against you, so
`missLabel` is omitted and the board shows score and time), and no DAY-shaped tiles. The IQ bar is
NOT one of them: IQ Points are site-wide and a quiz banks them exactly as a daily does, so
`useIqStanding({ quizId })` and `useDayStats` are the same reads here as there.

**`LoftFinish` gained exactly three props, all defaulting to null**, so every daily renders byte for
byte what it did before: `boardLabel` (the heading over the leaderboard, because a quiz's board is
its all-time board and not "today's"), `replaySub` (because a replay does not put a daily streak at
stake) and `dayTiles` (`[{value, label}]`, replacing the four daily tiles; the strip is flex-wrap,
so any count from one to four lays out with no CSS change and the `d1..d4` colours are reused in
positional order). **Do not fork this component.** If a fourth override is needed, add it the same
way, default null.

### The flip maps onto Reveal, and that is why it fits

A quiz already had the two states the flip needs. The end card is the turned-over board; pressing
**Reveal the answers** or **Return to the board** turns it back, and because the flip is a SWAP and
not a 3D turn (the front leaves the flow, the back rejoins it) the board and the card then sit one
above the other, which is what a player wants when checking what they missed. `boardShown` is that
state, and `restartRound` resets it. The swap also means nothing inside the sheet is inside a
transformed ancestor, so the sticky score bar keeps working, which a real 3D flip would have broken.

A player with no display name cannot be shown the answers, because revealing them is what posting
the score buys, so the reveal option reads honestly in each of its three states and an unregistered
player gets a **Post to the leaderboard** option that opens the join tab instead.

### Verifying it

**Render the page and read the DOM, never the server HTML.** The 64-route sweep during the daily
rollout passed while three games were throwing a temporal-dead-zone error, because the error happens
after hydration and the server markup looks perfect. Load `/quiz/<id>?loft=1`, then check: the cap
band lines up with the board, the footer is re-inked on navy, the finish flips, the console is
clean, and the SAME quiz without the flag is unchanged.

---

## A QUIZ NAMES ITS SUBJECT ON THE QUESTION, not only on the gate (owner, 2026-09-02)

Reported as "the 'deep' category on our trivia gauntlet does not display the category of
depth... today it is Japan but that is not shown anywhere i can see."

Deep is one topic a day, fifteen questions deep. Its own page prints the topic on the start
gate and again on every question card. THE RUN did neither: `app/circuits/[id]/run/RunClient.jsx`
drew a chip from `question.cat`, which four of the seven runnable banks set and Deep does
not, because on Deep the subject is the DAY rather than the question. So a Gauntlet player
answered fifteen questions about Japan without ever being told they were about Japan, and
the one thing that makes those questions answerable was the thing missing.

The chip now falls through to the section's `topic`, which the run page already carried and
only the roster and the hand-off card were using (`lineFor`). No special casing by key: a
game whose day has no topic is unaffected, and a future one-topic bank gets this free.

**The general rule: whatever a reader needs in order to answer belongs ON the question, not
on a screen they passed three minutes ago.** A start gate is read once, and in a run it is
read once for the whole sitting.

## Trivia IQ tests (`/iq`, `/iq/<slug>`): adaptive tests on played gauntlet questions (owner, 2026-09-29)

Nine adaptive trivia tests, one per category (general, geography, history, science, screen,
music, literature, sports, business), linked from the footer ("Trivia IQ Tests") and listed in
the sitemap. Owner calls at launch: **IQ-shaped but player-normed** (100 = the typical Mind Loft
player, 15 = one SD of that field, labelled as a percentile among Mind Loft players; the
"not a clinical IQ" line was removed at the owner's request, 2026-09-29); **standalone,
no board** (nothing is posted, no IQ Points, the result is kept on the device in
`sot_iq_results`); **stage register**, framed by `CircuitFrame`, accent from the ramp step in
`IQ_TESTS[].ramp`.

- **Only questions already PLAYED on the gauntlets** (Streak, Deep, Atlas, Sport, Biz). Those are
  one life in a fixed order, so a day's `scoreDist` from `/api/quiz/board` is its item response
  matrix. `scripts/iq/calibrate.mjs` fits a difficulty per question from a snapshot of those
  distributions (`scripts/iq/play-snapshot-<date>.txt`) and writes `lib/iq-items.js`. Model:
  4PL with slope 1.1, guess .25, lapse .95, only `b` free; players N(0,1) per game (runs carry no
  id to link games), difficulties shrunk to learned game-and-tier means, runs scoring 0 dropped
  (they are page-opens), tier 1-2 items fitting 2.2+ above their tier mean dropped as flawed.
- **Refresh:** pull every played day's `scoreDist` (in the browser; the board route is ~30s cold),
  save a new snapshot file (`S`/`D`/`A`/`P`/`B` + `M-D=score:count,...`), re-run calibrate, and
  `node scripts/verify-iq.mjs`, which checks every row resolves, none is from an unplayed day, every
  test has a bank, and a seeded simulation places readers in order (mean error under 0.6 SD).
- **Categories are declared in `lib/iq-tests.js`** as sources: a game plus its lanes, or Deep day
  TOPICS (Deep carries its subject on the day, so an item's lane is its day's topic, and the test
  shows it on the question per the names-its-subject rule). A new Deep topic joins a test only when
  it is added to that list.
- **The pool** (`lib/iq-pool.js`, server only): a stratified random 200 per sitting, bands from
  b = -3 up (gimmes near -8 inform nobody), topped up for the small banks. The engine
  (`app/iq/IqEngine.js`, pure) is EAP on a grid, max-information picks drawn among the best five,
  25 questions and up to 30 while the SD is over .42, 20 seconds a question (the clock the
  difficulties were measured under), opening at theta .3.
- **Views are tracked** with `PageViewBeacon` (`iq`, `iq-<slug>`) and a finish ping
  (`iq-<slug>-finished`), all titled in `TRACKED_PAGES` (lib/admin-quiz-titles.js).
- **The result card fills the viewport** so a screenshot is the card: ring (percentile), IQ with
  its plus or minus, right of asked, and the site name. Share, retake, the
  next daily puzzle (a fitting unplayed daily first, via `daily-me`) and the other tests sit BELOW
  the fold, out of any screenshot (owner, 2026-09-29).
- **The reveal** (owner-approved mockup, 2026-09-29): one pip per answer spins into the ring, the
  arc sweeps to the percentile as the IQ counts up, a pulse lands it (two at 130+), then a bell of
  the player field draws in with a "You" pin. About three seconds, once, nothing moves after, and
  reduced motion jumps to the last frame (`useReveal` in IqTestClient).
- **Every sitting is dealt fresh.** The page is force-dynamic and `iqPoolFor` samples a new random
  200 per load, and each pick is drawn at random among the five most informative, so two players
  see different questions. A retake also skips questions this browser was already dealt
  (`sot_iq_seen_<slug>`, last 240 ids) while at least 120 of the pool are left.
- **THE DAILY RUN.** Below the fold the finish offers up to three of today's unplayed dailies
  (`NEXT_FOR` first, then the same category), started on an 8s countdown that ticks only while the
  run card is at least 60% on screen and pauses on any touch or Not now; a sticky Continue bar rises
  once the card scrolls off. The run is carried in the URL, `?run=a,b,c` (`lib/daily-run.js`), and
  `app/DailyRunRail.jsx`, mounted once in StageChrome, draws a thin band under every daily's cap
  and, once that game's day breadcrumb says finished, a fixed Next bar. Nothing about a run is
  stored or scored; played is read from the `sot_<key>_day` breadcrumbs, so it costs no request.
- **Admin counts them as quizzes, in Quiz Plays too (owner, 2026-09-30).** A finished test posts an
  ordinary `/api/quiz/result` row: quizId `iq-<slug>`, score = right, total = asked, `progress` =
  the IQ reading. So it shows in Quiz Plays like any quiz, titled "<Name> IQ Test". It still pays NO
  IQ Points: `computeXp` skips `iq-` ids, keeping the original standalone ruling. The Page Views
  row takes the larger of result rows and finish pings (`iq-<slug>-finished`, the only record
  before 2026-09-30), and the finish rows are folded in rather than listed (`app/admin/page.js`).
