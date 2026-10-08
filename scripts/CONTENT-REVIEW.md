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
