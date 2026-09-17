// verify-group-scoring.mjs: a group board is the SITE's scoring rule run over
// the members alone (owner, 2026-09-17: "if im first i assume i should get 15").
//
// It certifies rescoreField (lib/daily-combined.js), which is the one place a
// smaller field is paid: the same ladder, the same tie rule (a tie is paid the
// mean of the rungs it spans), the same pre-cutover formula on an old day, and
// the site's own points kept on the row as `sitePoints`.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { rescoreField, LADDER, LADDER_FLOOR, gamePoints } = await import('../lib/daily-combined.js');

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const near = (a, b) => Math.abs(a - b) < 0.051;

// A LADDER DAY (any day from 2026-08-13 on).
const TODAY = 'emcee-9-17-26';
const row = (siteRank, score = 10, total = 10, points = 0) => ({ siteRank, score, total, points });

// The owner's own case: 2nd sitewide on a tie, alone at the top of a group.
{
  const rows = [row(2, 10, 10, 13.5), row(5, 9, 10, 7)];
  rescoreField(TODAY, rows);
  ok(near(rows[0].points, LADDER[0]), `group leader is paid the top rung (${rows[0].points})`);
  ok(rows[0].rank === 1 && rows[1].rank === 2, 'group ranks are 1 and 2');
  ok(near(rows[0].sitePoints, 13.5), 'the site points it replaced are kept on the row');
  ok(near(rows[1].points, LADDER[1]), 'second in the group is paid the second rung');
}

// A tie inside the group is paid the mean of the rungs it spans, exactly as the
// site pays one: two tied for first share (15 + 12) / 2.
{
  const rows = [row(3), row(3), row(9, 8, 10)];
  rescoreField(TODAY, rows);
  ok(near(rows[0].points, (LADDER[0] + LADDER[1]) / 2) && near(rows[1].points, rows[0].points),
    `a tie for first shares 13.5 (${rows[0].points})`);
  ok(rows[0].rank === 1 && rows[1].rank === 1 && rows[2].rank === 3, 'a tie shares the rank and the next rank skips');
  ok(near(rows[2].points, LADDER[2]), 'the row under a two-way tie is paid the third rung');
}

// Three tied for first: (15 + 12 + 10) / 3.
{
  const rows = [row(1), row(1), row(1)];
  rescoreField(TODAY, rows);
  ok(near(rows[0].points, (LADDER[0] + LADDER[1] + LADDER[2]) / 3), 'three tied for first share 12.33');
}

// A group of one is still a field of one: it tops it.
{
  const rows = [row(40, 6, 10)];
  rescoreField(TODAY, rows);
  ok(near(rows[0].points, LADDER[0]), 'the only member to play is first');
}

// Past the ladder, every finisher earns the floor, group or not.
{
  const rows = Array.from({ length: LADDER.length + 2 }, (_, i) => row(i + 1));
  rescoreField(TODAY, rows);
  ok(near(rows[LADDER.length].points, LADDER_FLOOR) && near(rows[LADDER.length + 1].points, LADDER_FLOOR),
    'outside the top ten everyone gets the floor');
}

// AN OLD DAY (before the 2026-08-13 cutover) keeps the scaled split, so a
// group board of an archived day is scored by that day's rule, not today's.
{
  const OLD = 'emcee-8-01-26';
  const rows = [row(4, 10, 10), row(7, 5, 10)];
  rescoreField(OLD, rows);
  const want = gamePoints(OLD, { lo: 1, hi: 1, field: 2, ratio: 1 });
  ok(near(rows[0].points, Math.round(want.points * 10) / 10),
    `a pre-cutover day uses the old formula (${rows[0].points} vs ${want.points})`);
  ok(rows[0].points > rows[1].points, 'and still orders the field');
}

// The site order is never re-sorted: rescoreField pays the rows as handed to it.
{
  const rows = [row(2), row(4), row(6)];
  const keys = rows.map((r) => r.siteRank);
  rescoreField(TODAY, rows);
  ok(rows.map((r) => r.siteRank).join() === keys.join(), 'site ranks are left alone');
}

if (fails) { console.log(`verify-group-scoring: ${fails} failure(s)`); process.exit(1); }
console.log('verify-group-scoring: clean');
