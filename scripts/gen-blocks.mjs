#!/usr/bin/env node
// Extend the Blocks bank (app/blocks/puzzles.js). Append only.
//
//   node scripts/gen-blocks.mjs --until 2026-11-30 [--dry]
//
// Blocks authors no board. The day's 6,000-shape order is dealt in the client
// by lib/blocks-seq.js from a seed derived from `quizId`, so a bank row is only
// the FRAME: num, quizId, live, dateLabel, sunday, cols, rows, par. That makes
// this generator deterministic with no rng of its own: the date decides every
// field, and the per-day deal is already seeded off the quizId (and so off the
// board's own date), which is what keeps a new day from replaying a frozen one.
// scripts/verify-blocks.mjs proves every day deals a different opening.
//
// THE FRAME RULES, copied from the bank's own convention rather than restated:
//   cols  10 on a weekday, 8 on a Sunday Edition (the well narrows)
//   rows  always 16
//   par   the bank's CURRENT benchmark for that shape, read off the last banked
//         weekday and the last banked Sunday. Par is a human benchmark retuned
//         off the live field (see the bank header), not a difficulty knob, so a
//         restock carries the latest value forward and never invents a new one.
//   resetAt  never written: it was a one-time replay grant for day one.
//
// THE PAST IS FROZEN. The new file is the old file up to its closing `];`, byte
// for byte, plus the new rows; the script checks that before writing.
import { readFileSync, writeFileSync } from 'node:fs';

const BANK = new URL('../app/blocks/puzzles.js', import.meta.url);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const args = process.argv.slice(2);
const ui = args.indexOf('--until');
const UNTIL = ui >= 0 ? args[ui + 1] : null;
const DRY = args.includes('--dry');
if (!UNTIL || !/^\d{4}-\d{2}-\d{2}$/.test(UNTIL)) { console.error('usage: node scripts/gen-blocks.mjs --until YYYY-MM-DD [--dry]'); process.exit(1); }

const old = readFileSync(BANK, 'utf8');
const { PUZZLES } = await import(BANK.href);
PUZZLES.forEach((p, i) => { if (p.num !== i + 1) { console.error(`banked row ${i + 1} carries num ${p.num}`); process.exit(1); } });
const last = PUZZLES[PUZZLES.length - 1];
const lastWeek = [...PUZZLES].reverse().find((p) => !p.sunday);
const lastSun = [...PUZZLES].reverse().find((p) => p.sunday);
const SHAPE = {
  week: { cols: lastWeek.cols, rows: lastWeek.rows, par: lastWeek.par },
  sun: { cols: lastSun.cols, rows: lastSun.rows, par: lastSun.par },
};

const rows = [];
const d = new Date(`${last.live}T12:00:00Z`);
let num = last.num;
for (;;) {
  d.setUTCDate(d.getUTCDate() + 1);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const live = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (live > UNTIL) break;
  num++;
  const sunday = d.getUTCDay() === 0;
  const s = sunday ? SHAPE.sun : SHAPE.week;
  rows.push(`  { num: ${num}, quizId: 'blocks-${m}-${day}-${String(y).slice(2)}', live: '${live}', dateLabel: '${MONTHS[m - 1]} ${day}, ${y}', sunday: ${sunday}, cols: ${s.cols}, rows: ${s.rows}, par: ${s.par} },`);
}
if (!rows.length) { console.log(`blocks: bank already runs to ${last.live}`); process.exit(0); }

const close = old.lastIndexOf('];');
if (close < 0 || old.slice(close).trim() !== '];') { console.error('bank does not end in ];'); process.exit(1); }
const next = old.slice(0, close) + rows.join('\n') + '\n];\n';
if (!next.startsWith(old.slice(0, close))) { console.error('frozen prefix changed; nothing written'); process.exit(1); }

console.log(`blocks: +${rows.length} rows, #${last.num + 1} to #${num}, through ${UNTIL} (weekday par ${SHAPE.week.par}, Sunday par ${SHAPE.sun.par})`);
if (DRY) { console.log(rows.slice(0, 3).join('\n')); process.exit(0); }
writeFileSync(BANK, next);
