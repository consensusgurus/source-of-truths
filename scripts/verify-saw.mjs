// verify-saw: the checker for the Saw bank (app/saw/puzzles.js). Discovered by
// scripts/verify-all.mjs as `saw`. Re-derives every rule from the rows:
//
//   - numbers run 1..n, one day apart from 2026-11-06 with no gap
//   - quizId and dateLabel agree with `live`
//   - the cut is TALL: 8x10 or 7x11, never more than 80 pieces
//   - every photo is a distinct Commons JPEG under a free licence (public
//     domain, CC0, CC BY, CC BY-SA; never GFDL-only), with a name and a credit,
//     and is not one of Jig's photos (the two games never show the same picture)
//   - seeds are whole numbers and never repeat
const { PUZZLES } = await import(new URL('../app/saw/puzzles.js', import.meta.url));
const { PUZZLES: JIG } = await import(new URL('../app/jig/puzzles.js', import.meta.url));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LIC = /^(Public domain|CC0|CC BY(-SA)? \d\.\d( [a-zA-Z]{2,4})?)$/;
let fails = 0;
const bad = (n, msg) => { fails++; console.log(`  #${n}: ${msg}`); };
const jigTitles = new Set(JIG.map((p) => p.t));
if (PUZZLES[0] && PUZZLES[0].live !== '2026-11-06') bad(1, `the bank should open 2026-11-06, not ${PUZZLES[0].live}`);
const seeds = new Set(), titles = new Set();
let prev = null;
PUZZLES.forEach((p, k) => {
  if (p.num !== k + 1) bad(p.num, `number out of sequence (expected ${k + 1})`);
  const d = new Date(p.live + 'T12:00:00Z');
  if (prev && (d - prev) !== 86400000) bad(p.num, `day gap before ${p.live}`);
  prev = d;
  const qid = `saw-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
  if (p.quizId !== qid) bad(p.num, `quizId ${p.quizId} should be ${qid}`);
  if (p.dateLabel !== `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`) bad(p.num, `dateLabel ${p.dateLabel}`);
  const cut = `${p.cols}x${p.rows}`;
  if (cut !== '8x10' && cut !== '7x11') bad(p.num, `cut ${cut} is not one of the tall cuts (8x10, 7x11)`);
  if (p.cols * p.rows > 80) bad(p.num, `${p.cols * p.rows} pieces, over the cap of 80`);
  if (!Number.isInteger(p.seed) || p.seed < 0) bad(p.num, `seed ${p.seed}`);
  if (seeds.has(p.seed)) bad(p.num, `seed ${p.seed} used twice`);
  seeds.add(p.seed);
  if (!p.t || !/\.(jpe?g)$/i.test(p.t)) bad(p.num, `photo title ${p.t} is not a JPEG file title`);
  if (titles.has(p.t)) bad(p.num, `photo ${p.t} used twice`);
  if (jigTitles.has(p.t)) bad(p.num, `photo ${p.t} is already one of Jig's`);
  titles.add(p.t);
  if (!LIC.test(p.lic || '')) bad(p.num, `licence "${p.lic}" is not a free licence this game accepts`);
  if (!p.name || p.name.length < 4) bad(p.num, 'no picture name');
  if (!p.by) bad(p.num, 'no photographer credit');
});
console.log(fails ? `verify-saw: ${fails} problem(s) in ${PUZZLES.length} boards` : `verify-saw: ${PUZZLES.length} boards OK (${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live})`);
process.exit(fails ? 1 : 0);
