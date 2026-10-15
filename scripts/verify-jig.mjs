// verify-jig: the checker for the Jig bank (app/jig/puzzles.js).
// Discovered by scripts/verify-all.mjs as `jig`. Imports nothing from
// scripts/gen-jig.mjs: every rule below is re-derived from the rows.
//
//   - numbers run 1..n and days run one a day with no gap
//   - quizId and dateLabel are derived from `live` and must agree with it
//   - the cut is the weekday's (owner, 2026-10-15): Mon 8x6, Tue 9x6, Wed 10x6,
//     Thu 9x7, Fri 10x7, Sat 11x7, Sunday Edition 10x8, never more than 80
//   - `sunday` is true exactly on Sundays
//   - every photo is a distinct Commons file under a free licence (public
//     domain, CC0, CC BY, CC BY-SA; never GFDL-only), with a name and a credit
//   - the seed is a whole number, so the cut is the same on every device
const BANK = process.env.VERIFY_JIG_BANK || 'app/jig/puzzles.js';
const { PUZZLES } = await import(new URL('../' + BANK, import.meta.url));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CUT = { 1: [8, 6], 2: [9, 6], 3: [10, 6], 4: [9, 7], 5: [10, 7], 6: [11, 7], 0: [10, 8] };
const LIC = /^(Public domain|CC0|CC BY(-SA)? \d\.\d( [a-zA-Z]{2,4})?)$/;
let fails = 0;
const bad = (n, msg) => { fails++; console.log(`  #${n}: ${msg}`); };

const titles = new Set();
let prev = null;
PUZZLES.forEach((p, k) => {
  if (p.num !== k + 1) bad(p.num, `number out of sequence (expected ${k + 1})`);
  const d = new Date(p.live + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) { bad(p.num, `bad date ${p.live}`); return; }
  if (prev && (d - prev) !== 86400000) bad(p.num, `day gap before ${p.live}`);
  prev = d;
  const qid = `jig-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
  if (p.quizId !== qid) bad(p.num, `quizId ${p.quizId} should be ${qid}`);
  const lab = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  if (p.dateLabel !== lab) bad(p.num, `dateLabel ${p.dateLabel} should be ${lab}`);
  const dow = d.getUTCDay();
  if (!!p.sunday !== (dow === 0)) bad(p.num, `sunday flag ${p.sunday} on a ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]}`);
  const [c, r] = CUT[dow];
  if (p.cols !== c || p.rows !== r) bad(p.num, `cut ${p.cols}x${p.rows}, the weekday's is ${c}x${r}`);
  if (p.cols * p.rows > 80) bad(p.num, `${p.cols * p.rows} pieces, over the cap of 80`);
  if (!Number.isInteger(p.seed) || p.seed < 0) bad(p.num, `seed ${p.seed} is not a whole number`);
  if (!p.t || !/\.(jpe?g)$/i.test(p.t)) bad(p.num, `photo title ${p.t} is not a JPEG file title`);
  if (titles.has(p.t)) bad(p.num, `photo ${p.t} used twice`);
  titles.add(p.t);
  if (!LIC.test(p.lic || '')) bad(p.num, `licence "${p.lic}" is not a free licence this game accepts`);
  if (!p.name || p.name.length < 4) bad(p.num, 'no picture name');
  if (!p.by) bad(p.num, 'no credit');
  if (/[—]/.test(p.name)) bad(p.num, 'em dash in the picture name');
});
const last = PUZZLES[PUZZLES.length - 1];
const left = Math.round((new Date(last.live + 'T12:00:00Z') - Date.now()) / 86400000);
if (left < 14) console.log(`  warning: the bank ends ${last.live}, ${left} days away`);
console.log(`jig: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${last.live}`);
console.log(fails ? `\n${fails} failure(s)` : 'jig: all clean');
process.exit(fails ? 1 : 0);
