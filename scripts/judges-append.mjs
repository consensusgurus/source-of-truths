// scripts/judges-append.mjs: appends produced boards to app/judges/puzzles.js.
//
//   node scripts/judges-append.mjs <j10.json> <j12.json> <through YYYY-MM-DD>
//
// Picks up the day after the last banked board. Sundays take a 12x12 from
// <j12.json>; each Monday-to-Saturday week takes six 10x10 boards from
// <j10.json>, one per difficulty band, ordered so the week climbs on the same
// tier score scripts/verify-judges.mjs grades (tier2 + 4*tier3 + 6*tier4 +
// rounds/4, recomputed here with humanSolve2, never trusted from the json).
// Layouts already in the Judges or Jesters banks are skipped. Frozen boards
// are never touched: the new rows are spliced in before the closing bracket.
import fs from 'fs';
import { PUZZLES } from '../app/judges/puzzles.js';
import { PUZZLES as JESTERS } from '../app/jesters/puzzles.js';
import { humanSolve2 } from './jester2-human.mjs';

const [J10, J12, THROUGH] = process.argv.slice(2);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const qid = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `judges-${m}-${d}-${String(y).slice(2)}`; };

const seen = new Set([...PUZZLES, ...JESTERS].map((p) => JSON.stringify(p.regions)));
const grade = (b) => { const hs = humanSolve2(b.size, b.regions); if (!hs.solved) return null; return hs.tier[2] + hs.tier[3] * 4 + hs.tier[4] * 6 + hs.rounds * 0.25; };
const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8')).filter((b) => { const k = JSON.stringify(b.regions); if (seen.has(k)) return false; seen.add(k); return true; });
const ten = load(J10).map((b) => ({ ...b, g: grade(b) })).filter((b) => b.g != null).sort((a, b) => a.g - b.g);
const twelve = load(J12).filter((b) => grade(b) != null);

const dates = []; for (let d = addDays(PUZZLES[PUZZLES.length - 1].live, 1); d <= THROUGH; d = addDays(d, 1)) dates.push(d);
const weekdays = dates.filter((d) => dow(d) !== 0).length, sundays = dates.length - weekdays;
if (twelve.length < sundays) throw new Error(`need ${sundays} 12x12 boards, have ${twelve.length}`);
if (ten.length < weekdays) throw new Error(`need ${weekdays} 10x10 boards, have ${ten.length}`);

// six bands by score; the k-th weekday (Mon=1..Sat=6) draws from band k-1
const bands = [[], [], [], [], [], []];
ten.forEach((b, i) => bands[Math.min(5, Math.floor((i * 6) / ten.length))].push(b));
const rows = []; let num = PUZZLES.length, s12 = 0;
for (const d of dates) {
  const w = dow(d); let b;
  if (w === 0) b = twelve[s12++];
  else { const band = bands[w - 1]; if (!band.length) throw new Error(`band ${w} empty`); b = band.splice(Math.floor(band.length / 2), 1)[0]; }
  num++;
  rows.push(`  {\n    num: ${num}, quizId: "${qid(d)}", live: "${d}", dateLabel: "${label(d)}", sunday: ${w === 0}, stars: 2,\n    size: ${b.size},\n    regions: [\n${b.regions.map((r) => `      [${r.join(',')}],`).join('\n')}\n    ],\n    solution: [${b.solution.map((p) => `[${p.join(',')}]`).join(',')}],\n  },\n`);
}
const f = new URL('../app/judges/puzzles.js', import.meta.url);
const src = fs.readFileSync(f, 'utf8'); const end = src.lastIndexOf('];');
fs.writeFileSync(f, src.slice(0, end) + rows.join('') + src.slice(end));
console.log(`appended ${rows.length} boards (${sundays} Sundays) through ${THROUGH}`);
