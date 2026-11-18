// verify-bot: the checker for Bot (app/bot/puzzles.js), discovered by
// scripts/verify-all.mjs. Recomputes every rule in the bank's header with the
// page's own engine (lib/bot-engine.js) and the exhaustive search
// (scripts/bot-search.mjs):
//   - one board a day from 2026-11-18, num in order, quizId / dateLabel read off
//     `live`, the band from the weekday (scripts/gen-bot.mjs), `sunday` exactly
//     on Sundays, the band's slots;
//   - a well-formed board: rows one width, digits and '.', the start and every
//     lamp on a tile, no two lamps on one tile, the band's size and lamp count;
//   - `sol` is a legal program for the slots, `par` commands long, and lights
//     every lamp in the engine;
//   - PROOF: the search tries every program of `proven` commands or fewer and
//     none wins (weekdays `proven` must be par - 1, Sunday 7), and no Main-only
//     program of 8 or fewer wins; par sits in the band's range;
//   - titles do not repeat within 30 days;
//   - VARIETY: Tuesday, Thursday and Saturday par programs are not the plain
//     self-call (Main = "1"), and Main is "1" on at most 60% of weekdays.
// The proofs are the slow part, so by default they run on boards from today to
// four weeks out (the past is frozen, and every board is proved again as it
// comes into that window); `--full` proves the whole bank.
// Shown to fail on a board whose par was one too high, a sol one command short,
// and a Tuesday board marked tough.
//   node scripts/verify-bot.mjs [--full]
import { PUZZLES } from '../app/bot/puzzles.js';
import { run, legalProgram, commandsIn, modelOf } from '../lib/bot-engine.js';
import { shortest } from './bot-search.mjs';
import { BANDS, bandOf, SUNDAY_PROOF, noPlainCall } from './gen-bot.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const full = process.argv.includes('--full');
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const horizon = new Date(Date.parse(today + 'T12:00:00Z') + 28 * 86400000).toISOString().slice(0, 10);
let fails = 0, proved = 0;
const bad = (p, m) => { fails++; console.log(`  FAIL No. ${p.num} (${p.live}): ${m}`); };
let day = new Date('2026-11-18T12:00:00Z');
const ids = new Set();
for (const [i, p] of PUZZLES.entries()) {
  const ds = day.toISOString().slice(0, 10);
  day = new Date(day.getTime() + 86400000);
  if (p.num !== i + 1) bad(p, `num ${p.num}, expected ${i + 1}`);
  if (p.live !== ds) bad(p, `live ${p.live}, expected ${ds}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `bot-${m}-${d}-${String(y).slice(2)}`) bad(p, `quizId ${p.quizId}`);
  if (ids.has(p.quizId)) bad(p, 'duplicate quizId'); ids.add(p.quizId);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(p, `dateLabel ${p.dateLabel}`);
  const band = bandOf(p.live), B = BANDS[band];
  if (p.band !== band) { bad(p, `band ${p.band}, the ${p.live} weekday is ${band}`); continue; }
  if (!!p.sunday !== (band === 'sunday')) bad(p, `sunday flag ${!!p.sunday} on a ${band} day`);
  if (JSON.stringify(p.slots) !== JSON.stringify(B.slots)) bad(p, `slots ${JSON.stringify(p.slots)}, a ${band} day has ${JSON.stringify(B.slots)}`);
  if (!p.title) bad(p, 'no title');
  const recent = PUZZLES.slice(Math.max(0, i - 30), i).map((q) => q.title);
  if (recent.includes(p.title)) bad(p, `title ${p.title} repeats within 30 days`);
  // the board
  const W = p.rows[0].length, H = p.rows.length;
  if (!p.rows.every((r) => r.length === W && /^[0-9.]+$/.test(r))) { bad(p, 'rows malformed'); continue; }
  if (W > B.size || H > B.size) bad(p, `${W}x${H} is bigger than ${B.size}x${B.size}`);
  const M = modelOf(p);
  const tile = (x, y) => x >= 0 && y >= 0 && x < W && y < H && p.rows[y][x] !== '.';
  if (!tile(p.start[0], p.start[1]) || ![0, 1, 2, 3].includes(p.start[2])) bad(p, 'start is not on a tile facing a way');
  const lk = p.lamps.map(([x, y]) => x + ',' + y);
  if (new Set(lk).size !== lk.length) bad(p, 'two lamps on one tile');
  if (!p.lamps.every(([x, y]) => tile(x, y))) bad(p, 'a lamp off the tiles');
  if (p.lamps.length < B.lamps[0] || p.lamps.length > B.lamps[1]) bad(p, `${p.lamps.length} lamps, a ${band} day has ${B.lamps.join(' to ')}`);
  // the answer
  if (!legalProgram(p, p.sol)) bad(p, 'sol is not a legal program for the slots');
  if (commandsIn(p.sol) !== p.par) bad(p, `sol is ${commandsIn(p.sol)} commands, par says ${p.par}`);
  if (!run(p, p.sol, { trace: false }).won) bad(p, 'sol does not light every lamp');
  if (p.par < B.par[0] || p.par > B.par[1]) bad(p, `par ${p.par} outside the ${band} range ${B.par.join(' to ')}`);
  const wantProven = band === 'sunday' ? SUNDAY_PROOF : p.par - 1;
  if (noPlainCall(p.live) && p.live >= '2026-11-19' && p.sol.main === '1') bad(p, 'a Tuesday, Thursday or Saturday whose par program is the plain self-call');
  if (p.proven !== wantProven) bad(p, `proven ${p.proven}, a ${band} board must prove ${wantProven}`);
  // the proof
  if (full || (p.live >= today && p.live <= horizon)) {
    const s = shortest(p, p.proven);
    if (s) bad(p, `a ${s.total}-command program wins: ${JSON.stringify(s.prog)}`);
    if (shortest({ ...p, slots: { main: 8 } }, 8)) bad(p, 'a Main-only program of 8 or fewer wins');
    proved++;
  }
}
// variety: Main is the single call "1" on at most 60% of weekday boards
const wk = PUZZLES.filter((p) => !p.sunday);
const plain = wk.filter((p) => p.sol.main === '1').length;
if (plain > wk.length * 0.6) { fails++; console.log(`  FAIL variety: Main is just "1" on ${plain} of ${wk.length} weekday boards (ceiling 60%)`); }
const last = PUZZLES[PUZZLES.length - 1].live;
const left = Math.round((Date.parse(last) - Date.parse(today)) / 86400000);
if (left < 10) console.log(`  WARN the Bot bank ends ${last}, ${left} days out: node scripts/gen-bot.mjs --until <date>`);
console.log(`verify-bot: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${last}, ${proved} proved${full ? ' (full)' : ' (today to four weeks out)'}, ${fails ? `${fails} FAILURE(S)` : 'all good'}`);
process.exit(fails ? 1 : 0);
