#!/usr/bin/env node
// scripts/gen-listed.mjs: appends an authored segment to the Listed bank
// (app/listed/puzzles.js).
//
//   node scripts/gen-listed.mjs <segment.mjs>            # print the boards
//   node scripts/gen-listed.mjs <segment.mjs> --check    # bank already carries it?
//   node scripts/gen-listed.mjs <segment.mjs> --append   # splice onto the bank
//
// Listed is written, not searched: every board in a segment file was authored
// and fact-checked by hand (see the segment's header for sources). What is
// mechanical lives here, because those are the fields a human mistypes across
// a month of boards: num, quizId, live, dateLabel and sunday are DERIVED from
// the calendar, one day at a time from the segment's START, and the segment
// must carry a ninth item on exactly the real Sundays. The domain rotation,
// value order, ties and spellings are proved by scripts/verify-listed.mjs,
// which is the gate.
//
// APPEND-ONLY. --append refuses unless the bank ends on the day before START
// with the number before FIRST_NUM, so a frozen board can never be rewritten
// and a segment can never land twice. The frozen prefix is asserted unchanged.
import fs from 'fs';
import path from 'path';
import url from 'url';

const argv = process.argv.slice(2);
const segArg = argv.find((a) => !a.startsWith('--'));
if (!segArg) { console.error('usage: gen-listed.mjs <segment.mjs> [--check|--append]'); process.exit(2); }
const SEG = await import(url.pathToFileURL(path.resolve(segArg)).href);
const { START, FIRST_NUM, BOARDS } = SEG;
const BANK = new URL('../app/listed/puzzles.js', import.meta.url);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const die = (m) => { console.error(`gen-listed: ${m}`); process.exit(1); };
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const q = (s) => JSON.stringify(String(s));

const out = [];
BOARDS.forEach((b, i) => {
  const dt = new Date(`${START}T12:00:00Z`); dt.setUTCDate(dt.getUTCDate() + i);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
  const sunday = dt.getUTCDay() === 0;
  const where = `${iso(dt)} ${b.title}`;
  if (b.items.length !== (sunday ? 9 : 8)) die(`${where}: ${b.items.length} items on a ${sunday ? 'Sunday (needs 9)' : 'weekday (needs 8)'}`);
  for (const k of ['cat', 'title', 'metric', 'hi', 'lo', 'source']) if (!b[k]) die(`${where}: missing ${k}`);
  for (const it of b.items) if (it.length !== 3 || it.some((x) => !x)) die(`${where}: item must be [t, v, d]: ${JSON.stringify(it)}`);
  const txt = [b.title, b.metric, b.hi, b.lo, b.source, ...b.items.flat()].join(' ');
  if (/[—–]/.test(txt)) die(`${where}: em or en dash in copy`);
  out.push([
    '  {',
    `    num: ${FIRST_NUM + i},`,
    `    quizId: "listed-${m}-${d}-${String(y).slice(2)}",`,
    `    live: "${iso(dt)}",`,
    `    dateLabel: "${MONTHS[m - 1]} ${d}, ${y}",`,
    ...(sunday ? ['    sunday: true,'] : []),   // the bank flags Sundays only; weekdays carry no field
    `    cat: ${q(b.cat)},`,
    `    title: ${q(b.title)},`,
    `    metric: ${q(b.metric)},`,
    `    hi: ${q(b.hi)},`,
    `    lo: ${q(b.lo)},`,
    `    source: ${q(b.source)},`,
    '    items: [',
    ...b.items.map(([t, v, dd]) => `      { t: ${q(t)}, v: ${q(v)}, d: ${q(dd)} },`),
    '    ],',
    '  },',
  ].join('\n'));
});
const segText = out.join('\n');
const last = new Date(`${START}T12:00:00Z`); last.setUTCDate(last.getUTCDate() + BOARDS.length - 1);

if (argv.includes('--check')) {
  const bank = fs.readFileSync(BANK, 'utf8');
  if (!bank.includes(segText + '\n')) die(`the bank does NOT carry segment ${START} as rendered`);
  console.log(`gen-listed --check: ${START} .. ${iso(last)} (#${FIRST_NUM} .. #${FIRST_NUM + BOARDS.length - 1}) is byte-identical in the bank`);
} else if (argv.includes('--append')) {
  const bank = fs.readFileSync(BANK, 'utf8');
  const { PUZZLES } = await import(BANK.href);
  const tail = PUZZLES[PUZZLES.length - 1];
  const before = new Date(`${START}T12:00:00Z`); before.setUTCDate(before.getUTCDate() - 1);
  if (tail.live !== iso(before) || tail.num !== FIRST_NUM - 1) die(`refusing to append: the bank ends #${tail.num} ${tail.live}, the segment needs #${FIRST_NUM - 1} ${iso(before)}`);
  const close = bank.lastIndexOf('\n];');
  if (close < 0) die('cannot find the closing bracket of PUZZLES');
  const head = bank.slice(0, close + 1);
  const next = head + segText + '\n' + bank.slice(close + 1);
  if (!next.startsWith(head)) die('frozen prefix changed');
  fs.writeFileSync(BANK, next);
  console.log(`gen-listed --append: +${BOARDS.length} boards #${FIRST_NUM} .. #${FIRST_NUM + BOARDS.length - 1}, ${START} .. ${iso(last)}`);
} else console.log(segText);
