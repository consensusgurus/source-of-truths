# Content review is a required gate for every bank extension (2026-10-08)

## Why this file exists

On 2026-10-08 a player reported that Stet marked "had shrunk" as an error with
the fix "shrank". The answer key was backwards. An audit that day found the same
class of problem across every authored bank:

- Stet: 36 bad keys
- Streak: 107 questions (wrong keys, false premises, second right answers)
- Feud: 170+ prompts missing obvious US answers
- Outwit: wrong herd truths
- Outrank: off-theme items
- Emcee: 18 bad clues
- Encore: 133 bad clues, some belonging to a different answer

Nearly all of it came from two bulk commits, cd3867e1 (2026-09-06, six games to
11-30) and 993640eb (2026-07-31, Stet), each reporting "verify-all green".

The root cause: every verifier here checks STRUCTURE (counts, uniqueness,
column spread, grid legality). None checks MEANING: is the answer true, is a
wrong choice also right, does the clue fit its word. A green run says nothing
about content, and generators print whatever was authored.

## The rule

Any change that adds or edits authored content (questions, answers, clues,
sentences, prompts, aliases, prices, categories) ships only after a SEPARATE
review pass that did not write the content. The review covers every new item,
not a sample. Solver-proved games (sudokus, logic grids, chess, Parker, Sweep,
Cipher, Docket, Alibi, Rung, Warmer) are exempt.

A RECYCLED trivia question (`from: '<game>:<id>'`, owner 2026-10-09) is new
content for this rule: nobody has answered it, so nobody has ever caught an
error in it. Review it like a new item, and for a Deep question moved into
Streak tier 5 also check the rewritten stem stands on its own without Deep's
day topic.

## What the reviewer checks, by game type

| Game type | Check |
|---|---|
| Trivia (Streak, Deep, Atlas, Sport, Biz, Script, Quotes) | Keyed answer true. No distractor also defensible (the most common defect). No false premise in the stem. Nothing that expires. No stem giving away its answer. |
| Proofreading (Stet) | `wrong` really is wrong in context. `fix` is grammatical in place. No second equally right correction (add `alts`). Clean sentences really clean. Notes true. |
| Crosswords (Emcee, Encore) | Clue defines THIS answer, not a neighbour. POS, tense and number match. Clue doesn't contain the answer. Two answers in one grid don't clue each other. |
| Crowd (Feud) | Probe each prompt's obvious US answers through lib/feud-match.js; any that land in no bucket get aliases or a bucket. |
| Crowd (Outwit, Outrank) | Herd truths correct and unambiguous. Every option fits its prompt or theme. No duplicate options. |
| Category boards (Crux, Links) | Every word fits its category's literal name. |
| Cross-game | No board spoils another game's answer the same day (e.g. Atlas flag vs Passport country). |

## The gate that enforces it (added 2026-10-09)

- `scripts/content-reviewed.json` is the ledger. For each content game it holds
  `through`, the last live date a separate reviewer has read item by item.
- `scripts/verify-content-reviewed.mjs` is picked up by verify-all and preflight
  automatically. It FAILS when any board goes live within 3 days (Eastern) past
  that game's `through`, and warns with the size of the unreviewed runway
  otherwise. An unreviewed board can no longer reach players without the gate
  going red first.
- A bank extension may ship unreviewed boards that are far in the future, but
  the gate turns red 3 days before the first of them goes live. Either review
  the whole extension at authoring time (preferred, cheapest per item) or review
  in rolling windows.
- **Move `through` forward only after the review is done and its fixes are
  applied.** Moving it to silence the gate defeats the only content check the
  repo has. A new content game gets a ledger entry the day it launches.
- `scripts/content-review-dump.mjs FROM TO [game...]` writes the boards for a
  date range to /tmp/content-review/<date>.json, with trivia ids expanded. Hand
  one file to a reviewer per date.

## Same-day spoilers are a real defect class

The 10-10 to 10-12 reviews found a run of them. They are invisible to any
single-game check:
- Atlas, Biz and Quotes naming Passport's country, capital or landmark
- Crux's APHID handing Clade its answer (Clade accepts short aliases)
- Deep and Sport asking the same Navratilova question on the same day
- Script naming Dossier's state

Review each DATE across games, not each game across dates.

## How to run it cheaply

1. Dump the new items to JSON: question, keyed answer and the other choices, or
   clue and answer.
2. Split into chunks of about 400 items.
3. Give each chunk to a fresh agent with the checklist above and ask for
   defects only, with exact replacement strings.
4. Apply fixes in the SOURCE file the generator reads, then regenerate.
5. Re-run the game's verifier. Verifiers also enforce answer caps, so a
   replacement answer may need to change.

## Mechanical checks added so far

- verify-stet.mjs `VERB_DIRECTION_FROM`: a verb-form key must point to the
  participle after have/be and to the simple past otherwise.
- feud: the generator's --lint coverage probes.

Add a mechanical check whenever a defect class can be caught by rule. Every
remaining class needs the human-style review above.
