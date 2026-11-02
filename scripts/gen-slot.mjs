// scripts/gen-slot.mjs — builds app/slot/puzzles.js from scripts/slot-pool.mjs.
//
//   node scripts/gen-slot.mjs --from 2026-09-04 --days 61 [--seed 20260904] [--first countries-population]
//
// One subject per day, every subject at most once per bank, a Sunday only
// from a subject carrying twelve items (the Sunday Edition is twelve slots),
// and never the same family two days running. Then the REVEAL ORDER, which
// is the difficulty: for each board the sensible player of slot-sim.mjs is
// run over a seeded sample of 1,200 orders, and the weekday picks the order
// whose modelled par sits at that day's point in the subject's own range:
//
//   Mon .85  Tue .70  Wed .55  Thu .40  Fri .28  Sat .15  Sun .30
//
// as a fraction of [hardest, easiest] for that subject. Monday is the order
// that all but plays itself (the anchors arrive first); Saturday opens with
// the middle of the board, where a blind placement breaks. The fraction is
// per subject rather than an absolute par because subjects differ in how
// forgiving they are at all, and the ramp is what a week should feel like.
//
// `par` on the row is the modelled mean rounded; `parMean` keeps two
// decimals for the verifier, which recomputes it from the same seed. Deterministic:
// the same pool, seed and dates give the same file byte for byte.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { POOL } from './slot-pool.mjs';
import { rng, hashStr, orderRange } from './slot-sim.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FROM = opt('--from', '2026-09-04');
const DAYS = Number(opt('--days', '61'));
const SEED = Number(opt('--seed', '20260904'));
const FIRST = opt('--first', 'countries-population');
// --append (added 2026-11-02): extend the bank instead of rewriting it. Reads
// the banked boards, leaves every one of them byte for byte, draws only from
// subjects the bank has never used, keeps the family rule across the seam,
// and splices the new rows in before the closing bracket. --from must be the
// day after the last banked board.
const APPEND = args.includes('--append');
const OUT = opt('--out', path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'slot', 'puzzles.js'));

export const BAND = { 1: 0.85, 2: 0.70, 3: 0.55, 4: 0.40, 5: 0.28, 6: 0.15, 0: 0.30 };
export const SUNDAY_N = 12, WEEKDAY_N = 10;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function dow(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }
function dateLabel(iso) { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; }
function quizId(iso) { const [y, m, d] = iso.split('-').map(Number); return `slot-${m}-${d}-${String(y).slice(2)}`; }

// Assign subjects to dates: randomized greedy with restarts, seeded.
let BANKED = [];
if (APPEND) {
  BANKED = (await import(path.resolve(OUT))).PUZZLES;
  const last = BANKED[BANKED.length - 1];
  if (addDays(last.live, 1) !== FROM) throw new Error(`--append: --from must be ${addDays(last.live, 1)}`);
}
const USED = new Set(BANKED.map((b) => b.subject));
const SEAM_FAM = BANKED.length ? POOL.find((s) => s.id === BANKED[BANKED.length - 1].subject).fam : null;

function assign() {
  const dates = Array.from({ length: DAYS }, (_, i) => addDays(FROM, i));
  const r = rng(SEED);
  for (let attempt = 0; attempt < 2000; attempt++) {
    const left = POOL.filter((s) => !USED.has(s.id));
    const plan = [];
    let ok = true;
    for (let i = 0; i < dates.length; i++) {
      const sun = dow(dates[i]) === 0;
      const sundaysLeft = dates.slice(i).filter((d) => dow(d) === 0).length;
      const prevFam = plan.length ? plan[plan.length - 1].fam : SEAM_FAM;
      let cands = left.filter((s) => (!sun || s.items.length >= SUNDAY_N) && s.fam !== prevFam);
      if (i === 0 && FIRST && !APPEND) cands = cands.filter((s) => s.id === FIRST);
      // Keep enough twelve-item subjects back for the Sundays still to come.
      if (!sun) {
        const twelves = left.filter((s) => s.items.length >= SUNDAY_N).length;
        if (twelves <= sundaysLeft) cands = cands.filter((s) => s.items.length < SUNDAY_N);
      }
      if (!cands.length) { ok = false; break; }
      const pick = cands[Math.floor(r() * cands.length)];
      plan.push(pick);
      left.splice(left.indexOf(pick), 1);
    }
    if (ok) return { dates, plan };
  }
  throw new Error('could not assign subjects to dates under the constraints');
}

function buildBoard(subject, iso, num) {
  const sun = dow(iso) === 0;
  const n = sun ? SUNDAY_N : WEEKDAY_N;
  const items = subject.items.slice(0, n);
  const range = orderRange(subject.id, n);
  const target = range.lo + (range.hi - range.lo) * BAND[dow(iso)];
  let best = range.sample[0];
  for (const o of range.sample) if (Math.abs(o.mean - target) < Math.abs(best.mean - target)) best = o;
  return {
    num, quizId: quizId(iso), live: iso, dateLabel: dateLabel(iso), sunday: sun,
    subject: subject.id, axis: subject.axis, top: subject.top, bottom: subject.bottom, unit: subject.unit, dir: subject.dir, source: subject.source,
    items, reveal: best.reveal, par: Math.round(best.mean), parMean: Math.round(best.mean * 100) / 100,
    range: [Math.round(range.lo * 100) / 100, Math.round(range.hi * 100) / 100],
  };
}

const { dates, plan } = assign();
const boards = dates.map((iso, i) => buildBoard(plan[i], iso, BANKED.length + i + 1));

const header = `// Puzzle data for Slot, the daily blind ranking: ten things arrive one at a
// time and each has to be placed in a slot before the next is shown.
//
// GENERATED by scripts/gen-slot.mjs from scripts/slot-pool.mjs. Do not hand
// edit a board: the reveal order is chosen by simulation and the par on it is
// what the verifier re-proves, so an edited board fails the gate. Edit the
// pool and regenerate from the first unplayed day.
//
// SHAPE. One row a day. \`items\` are [name, value, display] in TRUE order,
// index 0 being slot 1 (\`top\`). \`reveal\` is the order the items are shown, as
// indices into \`items\`. \`par\` is the rounded mean score of the modelled
// sensible player (scripts/slot-sim.mjs) on that reveal order, \`parMean\`
// the same to two decimals, \`range\` the [hardest, easiest] means the
// subject admits over the sampled orders. Weekdays are ten slots, a Sunday
// Edition (\`sunday: true\`) is twelve.
//
// The server page ships only the picked day's items and reveal to the
// browser (page.js); the shared daily consumers read only
// num/quizId/live/dateLabel/sunday.
//
// AUTHORING RULES (enforced by scripts/verify-slot.mjs): every value strictly
// monotonic in \`dir\` with no ties; \`reveal\` a permutation; the stored par
// equal to the recomputed one; a weekday board ten items and a Sunday twelve
// on a real Sunday; no subject twice in the bank and no family two days
// running; dates consecutive, numbered from 1, quizIds slot-M-D-YY.

export const PUZZLES = [
`;
const rows = boards.map((b) => '  ' + JSON.stringify(b) + ',').join('\n');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
if (APPEND) {
  const src = fs.readFileSync(OUT, 'utf8');
  const end = src.lastIndexOf('];');
  fs.writeFileSync(OUT, src.slice(0, end) + rows + '\n' + src.slice(end));
} else fs.writeFileSync(OUT, header + rows + '\n];\n');
console.log(`gen-slot: ${boards.length} boards, ${dates[0]} to ${dates[dates.length - 1]}, written to ${path.relative(process.cwd(), OUT)}`);
for (const b of boards) console.log(`  ${b.live} ${b.sunday ? 'SUN' : '   '} ${b.subject.padEnd(26)} par ${b.parMean} of ${b.items.length}  range ${b.range.join('..')}`);
