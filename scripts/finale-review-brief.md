# Review brief: fact-check one Trivia Finale bank (2026-11-23)

You are the SEPARATE REVIEWER for one new daily trivia game on mindloftdaily.com. Other authors
wrote its five lane files; you did not. Your job is the content review the site requires before a
board goes live (scripts/CONTENT-REVIEW.md): read EVERY question with fresh eyes and make sure it is
true, has exactly one right answer, and is fair. Read scripts/finale-lanes-brief.md first; it is the
standard the authors were held to.

Your game's lanes are the five files in `scripts/<game>-lanes/`. Each holds 22 days of 5 questions:
`{ c, t, q, a, d }` where `a` is the correct answer and `d` the three wrong ones.

## What to check on every question

1. **Is `a` actually correct?** Check names, dates, numbers, titles and spellings against what you
   know for certain. If you cannot be certain a fact is right, treat it as wrong.
2. **Are all three distractors actually wrong?** A distractor that is also true, or arguably true,
   is a defect (for example a second person who also did the thing).
3. **Is the stem itself true?** A false premise in the question is a defect even when the answer
   matches it.
4. **Is anything contested, version-dependent or able to change?** Live records, "current", claims
   that sources dispute, measurements that vary by source. These must go or be pinned to a date.
5. **Does the question give away its answer**, or name a choice in the stem?
6. **Is it in the right lane and at a sensible tier** (tier 1 gimme to tier 5 expert but fair)? Fix
   a badly mis-tiered question by swapping it with a same-lane question of the right difficulty or
   by rewriting it; do not leave an expert question at tier 1.
7. **Same fact twice** anywhere across the five lanes of your game, including mirrored forms. Also
   no two questions on the same day (across the five lanes) with the same answer.
8. Tone: nothing crude, cruel or partisan; religions and living traditions treated factually and
   respectfully.

## How to fix

Edit the lane files in place. Prefer the smallest fix that makes the question right: correct a
date, swap a bad distractor, reword a stem. Replace a question outright when the fact itself is
wrong, contested or duplicated; the replacement must fit the same lane and tier and must itself be
something you are sure of. Keep the file shape exactly (22 days, five tiers in order, JSON-style
double-quoted strings). US spelling, no em or en dashes, every question ends with "?".

After editing a lane file run its check until it prints 0 fail:

```
node --no-warnings scripts/trivia-lane-check.mjs scripts/<game>-lanes/<file> --days 22 --lane '<Lane Name>' | grep -v "already in"
```

When all five lanes are reviewed, rebuild and gate the bank (it has never been live, so rebuilding
is allowed today; never do this to a live bank):

```
rm -f app/<game>/questions.js app/<game>/puzzles.js
node --no-warnings scripts/gen-<game>.mjs
node --no-warnings scripts/verify-<game>.mjs
```

`verify-<game>.mjs` must exit clean (FAIL lines fixed in the lane files, then rebuild again). Read
its WARN lines about the same fact on different days and fix the real ones.

Keep scratch files in a directory of your own from `mktemp -d`. Edit nothing outside
`scripts/<game>-lanes/` and `app/<game>/questions.js` / `puzzles.js` (through the generator only).
Run no git commands.

## Report

- How many questions you read (it must be all 550) and how many you changed, split into: wrong
  answer key, true distractor, false or contested stem, giveaway, duplicate, tier or lane, wording.
- The list of every change as one line each: lane, day, tier, what was wrong, what you did.
- Anything you were not sure about and left, so a person can look.
- The final line of verify-<game>.mjs.
