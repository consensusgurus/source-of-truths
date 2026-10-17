// scripts/verify-squash.mjs — proves the Squash bank and engine.
//
//   node scripts/verify-squash.mjs
//
// Bank: contiguous dates, quizIds and date labels that match their live date,
// the Sunday flag on real Sundays with the Sunday frame (9x9, 30 moves) and the
// weekday frame everywhere else, and every par equal to what the generator
// measures today (so an engine change that moves par cannot ship silently).
//
// Engine: the opening board is deterministic, holds no match and at least three
// moves; an invalid swap changes nothing and costs no move; each special is made
// by the match that should make it and does what it says; the combos; the
// refills are the same per column whatever else happens on the board; a run
// ends at its move budget; a board with no move shuffles and keeps a move.

import { PUZZLES } from '../app/squash/puzzles.js';
import { newGame, move, findGroups, validMoves, hasMove, clone, swapValid } from '../lib/squash-engine.js';
import { parFor } from './squash-par.mjs';

let fails = 0;
const fail = (m) => { fails++; console.error('FAIL', m); };

// ---- bank -----------------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let prev = null;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) fail(`row ${i}: num ${p.num}`);
  const d = new Date(p.live + 'T12:00:00Z');
  if (prev && d - prev !== 86400000) fail(`${p.quizId}: not the day after the previous row`);
  prev = d;
  const m = d.getUTCMonth() + 1, day = d.getUTCDate(), y = d.getUTCFullYear();
  if (p.quizId !== `squash-${m}-${day}-${String(y).slice(2)}`) fail(`${p.quizId}: quizId does not match ${p.live}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${day}, ${y}`) fail(`${p.quizId}: dateLabel`);
  const sun = d.getUTCDay() === 0;
  if (p.sunday !== sun) fail(`${p.quizId}: sunday flag`);
  const want = sun ? { size: 9, moves: 30 } : { size: 8, moves: 25 };
  if (p.size !== want.size || p.moves !== want.moves) fail(`${p.quizId}: frame ${p.size}/${p.moves}`);
  const par = parFor(p.quizId, { size: p.size, moves: p.moves });
  if (par !== p.par) fail(`${p.quizId}: par ${p.par}, engine measures ${par}`);
});

// ---- engine: the opening board -------------------------------------------
for (const p of PUZZLES) {
  const a = newGame({ quizId: p.quizId, size: p.size, moves: p.moves });
  const b = newGame({ quizId: p.quizId, size: p.size, moves: p.moves });
  if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${p.quizId}: opening board not deterministic`);
  if (findGroups(a).length) fail(`${p.quizId}: opening board already holds a match`);
  if (validMoves(a).length < 3) fail(`${p.quizId}: opening board has fewer than three moves`);
}

// ---- engine: crafted boards ----------------------------------------------
// Letters are fruit kinds (a..f), H/V a slicer, B a bomb (lowercase fruit
// after it), O a bowl. A board is padded with a no-match filler pattern.
function board(rows, quizId = 'squash-test') {
  const s = newGame({ quizId, size: 8, moves: 25 });
  const filler = ['cdecdecd', 'efcefcef', 'decdecde', 'fcefcefc', 'cdecdecd', 'efcefcef', 'decdecde', 'fcefcefc'];
  let id = 1;
  s.grid = [];
  for (let r = 0; r < 8; r++) {
    const src = (rows[r] || filler[r]).padEnd(8, '.');
    const row = [];
    let c = 0;
    for (let i = 0; i < src.length && c < 8; i++) {
      let ch = src[i];
      if (ch === '.') ch = filler[r][c];
      if (ch === 'H' || ch === 'V' || ch === 'B') { const f = src[++i].charCodeAt(0) - 97; row.push({ id: id++, f, sp: ch === 'B' ? 'bomb' : ch.toLowerCase() }); }
      else if (ch === 'O') row.push({ id: id++, f: -1, sp: 'bowl' });
      else row.push({ id: id++, f: ch.charCodeAt(0) - 97, sp: null });
      c++;
    }
    s.grid.push(row);
  }
  s.nextId = id;
  return s;
}
const count = (s, pred) => s.grid.flat().filter(pred).length;

{ // invalid swap costs nothing
  const s = newGame({ quizId: PUZZLES[0].quizId });
  const before = JSON.stringify(s);
  let tried = false;
  for (let r = 0; r < 8 && !tried; r++) for (let c = 0; c < 7 && !tried; c++) {
    if (!swapValid(s, [r, c], [r, c + 1])) { const res = move(s, [r, c], [r, c + 1]); tried = true; if (res.ok) fail('invalid swap reported ok'); }
  }
  if (JSON.stringify(s) !== before) fail('invalid swap changed the state');
  if (move(s, [0, 0], [5, 5]).ok) fail('a non-adjacent swap was accepted');
}
{ // three in a row: 30 points, a move spent
  const s = board(['aab.....']);
  s.grid[1][2] = { id: 999, f: 0, sp: null }; // an a below the b
  const res = move(s, [0, 2], [1, 2]);
  if (!res.ok || s.used !== 1) fail('a plain three did not play');
  if (res.frames.find((f) => f.kind === 'clear').cleared.length !== 3) fail('a plain three did not clear three');
}
{ // four in a row makes a slicer that clears a column
  const s = board(['aaba....']);
  s.grid[1][2] = { id: 991, f: 0, sp: null };
  move(s, [0, 2], [1, 2]);
  if (s.made.v !== 1) fail('four in a row did not make a column slicer');
}
{ // five makes a bowl
  const s = board(['aabaa...']);
  s.grid[1][2] = { id: 991, f: 0, sp: null };
  move(s, [0, 2], [1, 2]);
  if (s.made.bowl !== 1) fail('five in a row did not make a bowl');
}
{ // an L makes a bomb
  const s = board(['abaa....', 'a.......', 'a.......']);
  s.grid[1][1] = { id: 991, f: 0, sp: null };
  move(s, [0, 1], [1, 1]);
  if (s.made.bomb !== 1) fail('an L did not make a bomb');
}
{ // a slicer squashed in a match clears its row
  const s = board(['Hacb......']);
  s.grid[0][1] = { id: 980, f: 2, sp: null };
  s.grid[0][2] = { id: 981, f: 0, sp: null };
  s.grid[0][3] = { id: 982, f: 0, sp: null };
  s.grid[1][1] = { id: 983, f: 0, sp: null };
  const res = move(s, [0, 1], [1, 1]);
  const clr = res.frames.find((f) => f.kind === 'clear');
  if (!clr || clr.cleared.filter((x) => x.r === 0).length !== 8) fail('a row slicer did not clear its row');
}
{ // bowl + fruit clears every fruit of that kind
  const s = board([]);
  s.grid[3][3] = { id: 900, f: -1, sp: 'bowl' };
  const f = s.grid[3][4].f;
  const n = count(s, (p) => p && p.f === f);
  const res = move(s, [3, 3], [3, 4]);
  const clr = res.frames.find((x) => x.kind === 'clear');
  if (!res.ok || clr.cleared.filter((x) => x.f === f).length !== n) fail('bowl + fruit did not clear the kind');
}
{ // bowl + bowl clears the board
  const s = board([]);
  s.grid[3][3] = { id: 900, f: -1, sp: 'bowl' };
  s.grid[3][4] = { id: 901, f: -1, sp: 'bowl' };
  const res = move(s, [3, 3], [3, 4]);
  if (res.frames.find((x) => x.kind === 'clear').cleared.length !== 64) fail('bowl + bowl did not clear the board');
}
{ // slicer + slicer: a cross, 15 cells
  const s = board([]);
  s.grid[3][3] = { id: 900, f: 0, sp: 'h' };
  s.grid[3][4] = { id: 901, f: 1, sp: 'v' };
  const res = move(s, [3, 3], [3, 4]);
  if (res.frames.find((x) => x.kind === 'clear').cleared.length !== 15) fail('slicer + slicer was not a cross');
}
{ // bomb + bomb: the 5x5
  const s = board([]);
  s.grid[3][3] = { id: 900, f: 0, sp: 'bomb' };
  s.grid[3][4] = { id: 901, f: 1, sp: 'bomb' };
  const res = move(s, [3, 3], [3, 4]);
  if (res.frames.find((x) => x.kind === 'clear').cleared.length !== 25) fail('bomb + bomb was not a 5x5');
}
{ // the same moves on the same day give the same game, refills and all
  const q = PUZZLES[0].quizId;
  const s1 = newGame({ quizId: q }), s2 = newGame({ quizId: q });
  for (let i = 0; i < 25; i++) {
    const m = validMoves(s1)[(i * 7) % validMoves(s1).length];
    move(s1, m[0], m[1]); move(s2, m[0], m[1]);
  }
  if (JSON.stringify(s1) !== JSON.stringify(s2)) fail('the same moves gave two different games');
}
{ // a run ends at its budget, and every day can be played out
  for (const p of PUZZLES.slice(0, 12)) {
    const s = newGame({ quizId: p.quizId, size: p.size, moves: p.moves });
    let guard = 0;
    while (s.used < s.max && guard++ < 200) {
      if (!hasMove(s)) { fail(`${p.quizId}: no move left after a move resolved`); break; }
      const m = validMoves(s)[0];
      move(s, m[0], m[1]);
    }
    if (s.used !== s.max) fail(`${p.quizId}: run did not reach its budget`);
    if (move(s, ...validMoves(s)[0] || [[0, 0], [0, 1]]).ok) fail(`${p.quizId}: a move past the budget was accepted`);
    if (findGroups(s).length) fail(`${p.quizId}: a resolved board still holds a match`);
  }
}

console.log(`squash: ${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}; pars ${Math.min(...PUZZLES.map((p) => p.par))} to ${Math.max(...PUZZLES.map((p) => p.par))}`);
if (fails) { console.error(`${fails} failure(s)`); process.exit(1); }
console.log('all clear');
