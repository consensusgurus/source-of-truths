# Authoring brief: the English Gauntlet (Gram, Vocab, Spell, Origin, Idiom)

You are writing ONE LANE of ONE new daily game for mindloftdaily.com. Five new
dailies make up the English Gauntlet. Each daily is TEN four-choice questions:
five rounds ("tiers") of two, one question from each of the game's two lanes per
tier. One life (a wrong answer ends the run), twenty seconds a question. Players
are smart adults, many of them older, playing for fun on a phone.

## What you deliver

A file `scripts/<game>-lanes/<file>.mjs` exporting exactly:

```js
export const LANE_DAYS = [
  // day 1
  [
    { c: '<Lane Name>', t: 1, q: '...?', a: '<correct answer>', d: ['<wrong>', '<wrong>', '<wrong>'] },
    { c: '<Lane Name>', t: 2, ... },  // ... t: 3, t: 4, t: 5
  ],
  // day 2 ...
];
```

**36 days, so 180 questions.** `c` is the exact lane name you were given. `t` is
the tier, 1 to 5, in that order inside every day. Write the TRUE answer in `a`
and three wrong ones in `d`; a generator shuffles positions. Many stems quote a
word or sentence: write those entries as DOUBLE-quoted JS strings and put the
quoted word in single quotes inside, e.g. `q: "What does 'gregarious' mean?"`.
The file must import cleanly with `node`.

Write in three passes (days 1-12, 13-24, 25-36) and re-run the check after each.

## DURABILITY

After EVERY pass, save a copy off this machine:
1. `mkdir -p /mnt/user-data/outputs/lanes && cp <your file> /mnt/user-data/outputs/lanes/`
2. If the tool `mcp__remote-devices__device_commit_files` is available, call it with
   `files: [{ stagedPath: "/mnt/user-data/outputs/lanes/<file name>", devicePath: "C:\\dev\\source-of-truths\\.cscratch\\lanes\\<file name>" }]`
   and `force: true`. If not, skip it and say so.

## The tier ramp (tier is what the player feels, so calibrate honestly)

- **Tier 1, gimme.** Nearly every adult gets it.
- **Tier 2, easy.** A careful reader gets it.
- **Tier 3, medium.** A strong reader or a word lover gets it.
- **Tier 4, hard.** A copy editor, crossword solver or English teacher's question.
- **Tier 5, expert but fair.** A specialist knows it; others can reason toward it. Never a trick.

Distractors are the same KIND of thing as the answer, similar length and form, plausible.
Keep choices short enough to read on a phone (a full sentence choice is fine, but
keep it under about 70 characters).

## Hard rules (a checker enforces most of them)

1. **Exactly one defensible answer.** If dictionaries or style guides disagree, do not
   ask it. The standard is edited American English, as Merriam-Webster, AP and
   Chicago agree. BANNED as questions because they are contested: the Oxford comma,
   singular "they", split infinitives, ending a sentence with a preposition, starting
   with "and"/"but", "data" singular vs plural, "hopefully", "literally" for emphasis,
   "irregardless" (it is in dictionaries), and any word with two accepted US spellings.
2. **The question must not give away its answer.** No word of the answer in the stem
   unless the stem is quoting the target word itself and the answer is a meaning.
3. **Self-contained.** Never refer to another question.
4. **US spelling** in all copy (color, center, theater, gray, traveled). Never use a
   British spelling even as a wrong choice (the checker fails "colour" anywhere).
5. **No em dashes or en dashes anywhere.** Commas, colons, parentheses. Hyphens fine.
6. **Every question ends with a question mark.**
7. **No answer string correct more than three times in your 180**, and never the same
   item (word, idiom, rule instance) asked twice, including mirrored forms.
8. **Stay inside your lane and its split** (given below). The other lane of your game is
   being written in parallel by someone else and the split is how you avoid overlap.
9. Facts are FROZEN: etymology only where the origin is well documented. No folk
   etymologies (posh, "rule of thumb", sincere "without wax", OK as "oll korrect" only
   if asked with care, golf, SOS, tips, cop as "constable on patrol", etc.). If the origin is
   "uncertain" in Merriam-Webster or Etymonline, do not ask it.
10. Vary the question forms and the items across the 36 days. Don't let one form run
    the whole lane.

## The check (run until it prints 0 fail)

```
node scripts/trivia-lane-check.mjs scripts/<game>-lanes/<file>.mjs --days 36 --lane '<Lane Name>'
```

The check expects 5 entries per day (it was written for 25-question games; your day
is 5 entries, one per tier, so it fits). FAIL lines must all be fixed. WARN lines need a judgement:
same item twice in your lane (replace one), "already in <bank>" (replace unless
genuinely a different fact), stem-word giveaways (fix unless the stem is legitimately
quoting the target word).

Report the final summary line, whether the device copy succeeded, and two lines on coverage.
Do not edit any other file.
