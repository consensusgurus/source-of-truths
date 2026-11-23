# Authoring brief: Music, Books, Nature, Tech and Myth (five new trivia gauntlets, 2026-11-23)

You are writing ONE LANE of ONE new daily trivia game for mindloftdaily.com. The game has the
same shape as Foodie, Sci, Art and History: twenty-five four-choice questions a day, five rounds
("tiers") of five, one question per lane per tier, one life (a wrong answer ends the run),
twenty seconds a question. Players are smart adults playing for fun. The five games feed a new
daily run, the Trivia Finale.

## What you deliver

A file `scripts/<game>-lanes/<game>-<slug>.mjs` (the exact path is in your assignment) exporting:

```js
export const LANE_DAYS = [
  // day 1
  [
    { c: '<Lane Name>', t: 1, q: '...?', a: '<correct answer>', d: ['<wrong>', '<wrong>', '<wrong>'] },
    { c: '<Lane Name>', t: 2, ... },
    { c: '<Lane Name>', t: 3, ... },
    { c: '<Lane Name>', t: 4, ... },
    { c: '<Lane Name>', t: 5, ... },
  ],
  // day 2 ...
];
```

**22 days**, so 110 questions. `c` is the exact lane name you were given. `t` is the tier, 1 to 5,
in that order inside every day. Write the TRUE answer in `a` and three wrong ones in `d`; never
think about which column the answer lands in, a generator shuffles that. Use double-quoted
strings (JSON style). The file must import cleanly with `node`.

Write in passes (days 1-6, then 7-12, 13-18, 19-22), saving the file and re-running the check
after each pass. If your file already exists with some days in it, those days are a first draft:
re-check every one of them against these rules, fix or replace what fails, then append the rest.

## The tier ramp

- **Tier 1, gimme.** Nearly every adult gets it.
- **Tier 2, easy.** A casual fan or a good high-school student gets it.
- **Tier 3, medium.** Needs real interest in the subject.
- **Tier 4, hard.** An enthusiast's question.
- **Tier 5, expert but fair.** A specialist knows it; others can reason toward it. Never a trick.

Distractors are the same KIND of thing as the answer, similar length and form, plausible, and
clearly wrong to someone who knows the subject.

## Hard rules (a checker enforces most of them)

1. **Every fact is FROZEN.** Nothing later than 2024. Never ask who currently holds a record,
   title or job, any live "largest/most/best-selling", rankings, current prices or populations,
   anything pending or disputed. Pin a worthwhile superlative to a date or a completed event.
2. **Exactly one defensible answer.** If sources disagree, do not ask it. No distractor may also
   be true.
3. **The question must not give away its answer.** No word of the answer in the stem, no choice
   named in the stem, no stem word that appears only in the correct choice.
4. **Self-contained.** Never refer to another question.
5. **US spelling** (color, center, theater, favorite, gray, honor, meter, jewelry). Real proper
   nouns keep their own spelling.
6. **No em dashes or en dashes anywhere.** Commas, colons, parentheses. Hyphens in compounds fine.
7. **Every question ends with a question mark.**
8. **No answer correct more than three times in your 110**, and never the same FACT twice,
   including the mirrored form ("Who painted the Mona Lisa?" vs "The Mona Lisa was painted by?").
9. **Stay inside your lane** (scope given to you). The other four lanes of your game are being
   written in parallel by other authors; do not stray into their scope.
10. Short answers: a name, word, number, year or short phrase.
11. Vary question forms and subjects across the 22 days. No two questions on one day about the
    same person, work or thing.
12. Nothing crude, cruel or partisan. Questions about religions and living traditions are
    respectful and strictly factual.

## Facts already asked elsewhere (owner ruling, 2026-11-23)

The site's other trivia banks already hold about 37,000 questions, so most famous facts have been
asked somewhere. The owner's ruling: **a fact asked in another game may be asked again here in new
words; never the same wording, and never twice inside these five new banks.** So:

- A checker line `WARN already in <bank> <id>: ...` shows your question beside the banked one.
  If the two are the same wording or near it, REWRITE yours from a different angle or replace it.
  If yours is plainly a different question that merely shares the answer, leave it.
- At tiers 3 to 5, prefer a fresh fact over a famous one wherever you can.
- `WARN possible repeat` / `possible mirror` lines are about your own lane: fix every real one.

## The check (run until it prints 0 fail)

```
node --no-warnings scripts/trivia-lane-check.mjs <your file> --days 22 --lane '<Lane Name>'
```

FAIL lines must all be fixed. Each WARN needs a judgement as above. The WARN output is long;
pipe it through `grep -v "already in"` first to see the fails and in-lane warns, then read the
"already in" lines separately.

## Accuracy

You are the author, and a separate reviewer will fact-check every question after you. Still:
write only what you are sure of. If you are not certain of a fact, a date, a spelling or that the
three wrong answers are all wrong, pick a different question. A wrong answer key is the worst
defect this game can ship.

Report: the final summary line of the check, and two lines on what your lane covers. Do not edit
any file but your own lane file. Do not run git commands.
