// verify-peg: the checker for Peg (app/peg/puzzles.js), discovered by
// scripts/verify-all.mjs. Recomputes every rule in the bank's header with the
// page's own engine (lib/peg-engine.js):
//   - one board a day from 2026-11-18, num in order, quizId / dateLabel read off
//     `live`, the band from the weekday (scripts/gen-peg.mjs), `sunday` exactly
//     on Sundays;
//   - seven rows of seven on the standard cross ('-' exactly off the board),
//     `count` pegs, inside the band's range;
//   - `sol` replays legally from the start to ONE peg in the centre;
//   - a fresh solve (an exhaustive search, not the stored line) also finds a win;
//   - `odds` recomputes and sits at or under the band's ceiling;
//   - no start repeats anywhere in the bank, mirror images included.
// Shown to fail on a sol with one jump changed, a count one off, and a
// Monday board marked tough.
//   node scripts/verify-peg.mjs
import { PUZZLES } from '../app/peg/puzzles.js';
import { isHole, parseBoard, pegsIn, replay, isSolved, solve, targetOf } from '../lib/peg-engine.js';
import { BANDS, bandOf, oddsOf } from './gen-peg.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const bad = (p, m) => { fails++; console.log(`  FAIL No. ${p.num} (${p.live}): ${m}`); };
let day = new Date('2026-11-18T12:00:00Z');
const ids = new Set(), seen = new Map();
for (const [i, p] of PUZZLES.entries()) {
  const ds = day.toISOString().slice(0, 10);
  day = new Date(day.getTime() + 86400000);
  if (p.num !== i + 1) bad(p, `num ${p.num}, expected ${i + 1}`);
  if (p.live !== ds) bad(p, `live ${p.live}, expected ${ds}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `peg-${m}-${d}-${String(y).slice(2)}`) bad(p, `quizId ${p.quizId}`);
  if (ids.has(p.quizId)) bad(p, 'duplicate quizId'); ids.add(p.quizId);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(p, `dateLabel ${p.dateLabel}`);
  const band = bandOf(p.live), B = BANDS[band];
  if (p.band !== band) { bad(p, `band ${p.band}, the ${p.live} weekday is ${band}`); continue; }
  if (!!p.sunday !== (band === 'sunday')) bad(p, `sunday flag ${!!p.sunday} on a ${band} day`);
  // the board
  if (!Array.isArray(p.pegs) || p.pegs.length !== 7 || !p.pegs.every((r) => r.length === 7)) { bad(p, 'not seven rows of seven'); continue; }
  let shape = true;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const ch = p.pegs[r][c]; if (isHole(r, c) ? !'o.'.includes(ch) : ch !== '-') shape = false; }
  if (!shape) { bad(p, 'not the 33-hole cross'); continue; }
  const s = parseBoard(p.pegs), n = pegsIn(s);
  if (n !== p.count) bad(p, `${n} pegs, count says ${p.count}`);
  if (n < B.pegs[0] || n > B.pegs[1]) bad(p, `${n} pegs outside the ${band} range ${B.pegs.join(' to ')}`);
  // the answer
  if (!isSolved(p, replay(p, p.sol))) bad(p, 'the stored line does not finish on one peg in the centre');
  let fresh = null;
  try { fresh = solve(s, targetOf(p), { nodes: 5e6 }); } catch (e) { bad(p, 'the fresh solve ran out of nodes'); }
  if (fresh != null && !isSolved(p, replay(p, fresh))) bad(p, 'the fresh solve returned a line that does not solve');
  if (fresh === null) bad(p, 'a fresh solve finds no win');
  // difficulty
  const odds = oddsOf(p);
  if (odds !== p.odds) bad(p, `odds recompute to ${odds}, stored ${p.odds}`);
  if (odds > B.odds) bad(p, `odds ${odds} over the ${band} ceiling ${B.odds}`);
  // no repeats, mirrors included
  const rows = p.pegs;
  for (const v of [rows.join('/'), [...rows].reverse().join('/'), rows.map((r) => [...r].reverse().join('')).join('/'), [...rows].reverse().map((r) => [...r].reverse().join('')).join('/')]) {
    if (seen.has(v)) bad(p, `same start as No. ${seen.get(v)} (or its mirror)`);
  }
  seen.set(rows.join('/'), p.num);
}
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const last = PUZZLES[PUZZLES.length - 1].live;
const left = Math.round((Date.parse(last) - Date.parse(today)) / 86400000);
if (left < 10) console.log(`  WARN the Peg bank ends ${last}, ${left} days out: node scripts/gen-peg.mjs --until <date>`);
console.log(`verify-peg: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${last}, ${fails ? `${fails} FAILURE(S)` : 'all good'}`);
process.exit(fails ? 1 : 0);
