# Authoring brief: Sci, Art and History (three new trivia gauntlets)

You are writing ONE LANE of ONE new daily trivia game for mindloftdaily.com. The game
has the same shape as Biz, Atlas and Sport: twenty-five four-choice questions a day,
five rounds ("tiers") of five, one question per lane per tier, one life (a wrong answer
ends the run), twenty seconds a question. Players are smart adults playing for fun.

## What you deliver

A file `scripts/<game>-lanes/<game>-<slug>.mjs` exporting exactly:

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

**48 days**, so 240 questions. `c` is the exact lane name you were given. `t` is the tier,
1 to 5, in that order inside every day. Write the TRUE answer in `a` and three wrong ones
in `d`; never think about which column the answer lands in, a generator shuffles that.
Escape apostrophes in single-quoted strings (`\'`) or use double quotes. The file must
import cleanly with `node`.

Write in several passes (days 1-12, then append 13-24, 25-36, 37-48) and re-run the
check after each pass.

## DURABILITY (mandatory, the machine you run on can be wiped without warning)

After EVERY pass, save a copy off this machine:
1. `mkdir -p /mnt/user-data/outputs/lanes && cp <your file> /mnt/user-data/outputs/lanes/`
2. Call the tool `mcp__remote-devices__device_commit_files` with
   `files: [{ stagedPath: "/mnt/user-data/outputs/lanes/<file name>", devicePath: "C:\\dev\\source-of-truths\\.cscratch\\lanes\\<file name>" }]`
   and `force: true`. If that tool is not available to you, skip step 2 and say so in your report.

## The tier ramp

- **Tier 1, gimme.** Nearly every adult gets it.
- **Tier 2, easy.** A casual fan or a good high-school student gets it.
- **Tier 3, medium.** Needs real interest in the subject.
- **Tier 4, hard.** An enthusiast's question.
- **Tier 5, expert but fair.** A specialist knows it; others can reason toward it. Never a trick.

Distractors are the same KIND of thing as the answer, similar length and form, plausible.

## Hard rules (a checker enforces most of them)

1. **Every fact is FROZEN.** Nothing later than 2024. Never ask who currently holds a record,
   title or job, any live "largest/most", rankings, current prices or populations, anything
   pending or disputed. Pin a worthwhile superlative to a date or completed event.
2. **Exactly one defensible answer.** If sources disagree, do not ask it.
3. **The question must not give away its answer.** No word of the answer in the stem, no
   choice named in the stem, no stem word that appears only in the correct choice.
4. **Self-contained.** Never refer to another question.
5. **US spelling** (color, center, theater, favorite, gray, honor, meter, jewelry). Real
   proper nouns keep their own spelling.
6. **No em dashes or en dashes anywhere.** Commas, colons, parentheses. Hyphens in compounds fine.
7. **Every question ends with a question mark.**
8. **No answer correct more than three times in your 240**, and never the same FACT twice,
   including the mirrored form ("Who painted the Mona Lisa?" vs "The Mona Lisa was painted by?").
9. **Stay inside your lane** (scope given to you). Other lanes are being written in parallel.
10. Short answers: a name, word, number, year or short phrase.
11. Vary question forms and subjects across the 48 days.

## The check (run until it prints 0 fail)

```
node scripts/trivia-lane-check.mjs scripts/<game>-lanes/<game>-<slug>.mjs --days 48 --lane '<Lane Name>'
```

FAIL lines must all be fixed. WARN lines need a judgement each: same fact twice in your lane
(replace one), "already in <bank>" (replace unless genuinely a different fact), stem-word
giveaways (fix unless harmless).

Report the final summary line, whether the device copy succeeded, and two lines on coverage.
Do not edit any other file.
