# Authoring brief: the Science Gauntlet (Orbit, Bond, Gene, Pulse, Eureka)

You are writing ONE LANE of ONE new daily game for mindloftdaily.com. Five new
dailies make up the Science Gauntlet. Each daily is TEN four-choice questions:
five rounds ("tiers") of two, one question from each of the game's two lanes per
tier. One life (a wrong answer ends the run), twenty seconds a question. Players
are smart adults, many of them older, playing for fun on a phone.

The site already has a 25-question daily called Sci that covers similar ground.
Your questions must be NEW: the checker warns "already in sci ..." when a fact
looks like one Sci already asks. Replace those.

## What you deliver

A file `scripts/<game>-lanes/<file>.mjs` (the repo is /home/claude/sot) exporting exactly:

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
and three wrong ones in `d`; a generator shuffles positions. Use double-quoted
JS strings whenever the text contains an apostrophe. The file must import
cleanly with `node`.

Write in three passes (days 1-12, 13-24, 25-36) and re-run the check after each.

## The tier ramp (tier is what the player feels, so calibrate honestly)

- **Tier 1, gimme.** Nearly every adult gets it (what planet is closest to the Sun).
- **Tier 2, easy.** A good high-school science student gets it.
- **Tier 3, medium.** A keen science reader gets it.
- **Tier 4, hard.** A science teacher or serious quiz player's question.
- **Tier 5, expert but fair.** A specialist knows it; others can reason toward it. Never a trick.

Distractors are the same KIND of thing as the answer (four planets, four elements,
four bones, four years), similar length and form, and plausible. Keep choices short
enough to read on a phone, ideally under about 40 characters.

## Hard rules (a checker enforces most of them)

1. **Exactly one defensible answer.** Settled textbook science only. No open
   questions, no "most scientists think", no contested history of who-was-first
   unless the standard credit is clear (e.g. telephone: ask about Bell's 1876 patent,
   not "who invented the telephone").
2. **FACTS ARE FROZEN.** Banned: any count or record that can change (number of
   known moons, exoplanets, largest known prime, most distant galaxy, fastest
   computer, oldest living person, current record holders, current holders of any
   role). A number that is settled by definition or by a dated event is fine; pin
   anything movable to its date ("as of its 2016 naming, element 118 was..."). The
   number of elements: only with "as of 2016". Pluto: it was reclassified in 2006,
   ask about that as a dated event, never "how many planets" without the date.
3. **The question must not give away its answer.** No distinctive word of the
   answer in the stem.
4. **Self-contained.** Never refer to another question.
5. **US spelling** in all copy (color, sulfur, aluminum, fetus, anemia, esophagus,
   center, liter, meter, gray). The checker fails British spellings anywhere.
6. **No em dashes or en dashes anywhere.** Commas, colons, parentheses. Hyphens fine.
7. **Every question ends with a question mark.**
8. **No answer string correct more than three times in your 180**, and never the
   same fact asked twice, including mirrored forms (asking X's symbol and later which
   element has symbol X).
9. **Stay inside your lane and its split** (given below). The other lane of your
   game is being written in parallel by someone else and the split is how you avoid
   overlap. Other games of the gauntlet cover the other sciences, so stay in yours.
10. Numbers as choices: use clearly separated values, and say the unit in the stem.
11. Vary the question forms and topics across the 36 days. Don't let one form or
    one sub-topic run the lane.
12. Health questions are facts, never advice. No diet fads, no supplements, nothing
    a doctor would argue about.

## The check (run until it prints 0 fail)

```
cd /home/claude/sot && node scripts/trivia-lane-check.mjs scripts/<game>-lanes/<file>.mjs --days 36 --lane '<Lane Name>'
```

FAIL lines must all be fixed. WARN lines need a judgement: the same fact twice in
your lane (replace one), "already in <bank>" (replace unless genuinely a different
fact), stem-word giveaways (fix unless the stem legitimately quotes a term the
answer defines).

Then do your OWN fact check of every answer, one by one, and fix anything you are
not certain of by replacing the question. Wrong-but-plausible numbers and dates
are the most common defect in banks like this.

Report the final summary line and two lines on coverage. Do not edit any other file.
