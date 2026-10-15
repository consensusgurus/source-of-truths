// scripts/verify-scour.mjs — independent check of Scour's bank (app/scour/puzzles.js).
// Imports nothing from the generator. Re-derives every rule gen-scour.mjs deals by:
//
//   dates     contiguous from 2026-10-15, num 1.., quizId and dateLabel match live,
//             sunday flag exactly on real Sundays
//   ramp      size, word count, word length band and directions by weekday
//   grid      size rows of size capital letters
//   words     every list word in the grid EXACTLY ONCE counting all eight directions
//             (a palindrome's two readings of the same squares count once); its one
//             reading runs in a listed direction; every listed direction carries a
//             word; no list word inside another or inside another's reverse
//   variety   no word back inside 35 days; a theme waits 4 days; never the same
//             theme as that day's Scram, never a word from a Scram board within
//             three days
//   screen    no blocked string anywhere in the grid, any direction, except wholly
//             inside a list word's own squares
import { PUZZLES } from '../app/scour/puzzles.js';
import { PUZZLES as SCRAM } from '../app/scram/puzzles.js';

const START = '2026-10-15';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const V = { E: [0, 1], W: [0, -1], S: [1, 0], N: [-1, 0], SE: [1, 1], NW: [-1, -1], NE: [-1, 1], SW: [1, -1] };
const OPP = { E: 'W', W: 'E', S: 'N', N: 'S', SE: 'NW', NW: 'SE', NE: 'SW', SW: 'NE' };
const RAMP = {
  1: { size: 15, words: 14, dirs: 'E S', lens: [5, 11] },
  2: { size: 15, words: 15, dirs: 'E S SE', lens: [5, 11] },
  3: { size: 15, words: 16, dirs: 'E S SE NE', lens: [5, 12] },
  4: { size: 15, words: 16, dirs: 'E S SE NE W', lens: [5, 12] },
  5: { size: 15, words: 17, dirs: 'E S SE NE W N', lens: [5, 12] },
  6: { size: 15, words: 18, dirs: 'E S SE NE W N NW SW', lens: [5, 12] },
  0: { size: 18, words: 26, dirs: 'E S SE NE W N NW SW', lens: [5, 13] },
};
const BLOCK = ['FUCK', 'SHIT', 'CUNT', 'COCK', 'DICK', 'PISS', 'TWAT', 'SLUT', 'WHORE', 'BITCH', 'FAG', 'NIGGER', 'NIGGA', 'KIKE', 'SPIC', 'CHINK', 'GOOK', 'WANK', 'PUSSY', 'TITS', 'RAPE', 'DYKE', 'HOMO', 'PORN', 'JIZZ', 'CUM', 'NAZI', 'KKK', 'POOP', 'BOOB', 'ANUS', 'PENIS', 'SEX', 'DAMN', 'HELL', 'CRAP', 'TURD', 'ARSE', 'PUBE', 'NIPPLE', 'VAGINA', 'SEMEN', 'ORGASM'];

let fails = 0;
const fail = (m) => { console.error('✗ ' + m); fails++; };
const strip = (w) => w.replace(/ /g, '');
const back = (s) => [...s].reverse().join('');

// Every reading of `w`: [{ cells, dir }], a palindrome's reverse reading of the
// same squares folded into one.
function readings(grid, w) {
  const n = grid.length, out = [], keys = new Set();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const [dir, [dr, dc]] of Object.entries(V)) {
    let s = '';
    const cells = [];
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) break;
      s += grid[rr][cc]; cells.push(rr * n + cc);
    }
    if (s !== w) continue;
    const key = cells.slice().sort((a, b) => a - b).join(' ');
    if (keys.has(key)) continue;
    keys.add(key); out.push({ cells, dir });
  }
  return out;
}

const day = (s) => new Date(s + 'T12:00:00Z');
const gap = (a, b) => Math.round((day(a) - day(b)) / 864e5);
const scramBy = new Map(SCRAM.map((p) => [p.live, p]));
const lastWord = new Map(), lastTheme = new Map();

let expect = day(START);
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live}`;
  const iso = expect.toISOString().slice(0, 10);
  if (p.live !== iso) fail(`${tag}: expected live ${iso}`);
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  const d = day(p.live);
  const qid = `scour-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
  if (p.quizId !== qid) fail(`${tag}: quizId ${p.quizId} != ${qid}`);
  if (p.dateLabel !== `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`) fail(`${tag}: dateLabel`);
  const dow = d.getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag wrong`);
  const R = RAMP[dow];
  if (p.size !== R.size) fail(`${tag}: size ${p.size}, want ${R.size}`);
  if ((p.dirs || []).join(' ') !== R.dirs) fail(`${tag}: dirs ${p.dirs} want ${R.dirs}`);
  if (p.words.length !== R.words) fail(`${tag}: ${p.words.length} words, want ${R.words}`);
  if (!p.theme || !p.themeId) fail(`${tag}: no theme`);

  const n = p.size;
  if (!Array.isArray(p.grid) || p.grid.length !== n || p.grid.some((row) => !new RegExp(`^[A-Z]{${n}}$`).test(row))) fail(`${tag}: grid malformed`);
  const grid = p.grid;
  const ws = p.words.map(strip);
  const usedDirs = new Set();
  const wordCells = [];
  for (let k = 0; k < ws.length; k++) {
    const w = ws[k];
    if (!/^[A-Z]+( [A-Z]+)*$/.test(p.words[k])) fail(`${tag}: bad word "${p.words[k]}"`);
    if (w.length < R.lens[0] || w.length > R.lens[1]) fail(`${tag}: ${w} length ${w.length} outside ${R.lens}`);
    const hits = readings(grid, w);
    if (hits.length !== 1) { fail(`${tag}: ${w} appears ${hits.length} times`); continue; }
    const h = hits[0];
    const pal = w === back(w);
    const dirOk = p.dirs.includes(h.dir) || (pal && p.dirs.includes(OPP[h.dir]));
    if (!dirOk) fail(`${tag}: ${w} runs ${h.dir}, not a listed direction`);
    usedDirs.add(p.dirs.includes(h.dir) ? h.dir : OPP[h.dir]);
    wordCells.push(new Set(h.cells));
    for (let j = 0; j < ws.length; j++) if (j !== k && (ws[j].includes(w) || back(ws[j]).includes(w))) fail(`${tag}: ${w} sits inside ${ws[j]}`);
  }
  for (const dn of p.dirs) if (!usedDirs.has(dn)) fail(`${tag}: no word runs ${dn}`);
  if (new Set(ws).size !== ws.length) fail(`${tag}: duplicate word`);

  for (const b of BLOCK) for (const h of readings(grid, b)) {
    if (!wordCells.some((set) => h.cells.every((c) => set.has(c)))) fail(`${tag}: blocked "${b}" reads in the grid`);
  }

  for (const w of ws) {
    const lw = lastWord.get(w);
    if (lw && gap(p.live, lw) < 35) fail(`${tag}: ${w} back after ${gap(p.live, lw)} days`);
    lastWord.set(w, p.live);
  }
  const lt = lastTheme.get(p.themeId);
  if (lt && gap(p.live, lt) < 4) fail(`${tag}: theme ${p.themeId} back after ${gap(p.live, lt)} days`);
  lastTheme.set(p.themeId, p.live);
  const sc = scramBy.get(p.live);
  if (sc && sc.themeId === p.themeId) fail(`${tag}: same theme as Scram today`);
  for (let k = -3; k <= 3; k++) {
    const sp = scramBy.get(new Date(d.getTime() + k * 864e5).toISOString().slice(0, 10));
    if (!sp) continue;
    for (const sw of sp.words) if (ws.includes(strip(sw.a))) fail(`${tag}: ${strip(sw.a)} is Scram's answer on ${sp.live}`);
  }
  expect = new Date(expect.getTime() + 864e5);
});

const last = PUZZLES[PUZZLES.length - 1];
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const left = gap(last.live, today);
if (left < 0) fail(`bank ran out on ${last.live}`);
else if (left < 14) console.warn(`… only ${left} days of Scour left (to ${last.live})`);

console.log(fails ? `\nverify-scour: ${fails} failure(s)` : `verify-scour: ${PUZZLES.length} boards ok, ${PUZZLES[0].live} to ${last.live}`);
process.exit(fails ? 1 : 0);
