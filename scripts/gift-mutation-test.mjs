// Mutation test for scripts/verify-gift.mjs: break the real bank one way at a
// time and require the verifier to FAIL on every break. A checker that has
// never been shown to fail has not been tested.
//
//   node scripts/gift-mutation-test.mjs
//
// Each run points the verifier at a mutated copy (VERIFY_GIFT_BANK) and at the
// mutated board alone (VERIFY_GIFT_ONLY); the shape and bank-wide checks still
// read every board.
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUZZLES } from '../app/gift/puzzles.js';

const dir = mkdtempSync(join(tmpdir(), 'gift-mut-'));
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
const cells = (p) => p.board.split(' ');
const emptyAt = (p) => cells(p).map((c, i) => (c === '....' ? i : -1)).filter((i) => i >= 0);
const LET = [['T', 'S'], ['D', 'L'], ['Q', 'R'], ['H', 'O']];
const code = (n) => LET.map((pair, b) => pair[(n >> b) & 1 ? 0 : 1]).join('');
const offBoard = (p) => { const used = new Set([...cells(p).filter((c) => c !== '....'), p.hand]); return [...Array(16).keys()].map(code).filter((c) => !used.has(c)); };
const mon = PUZZLES.findIndex((p) => p.num > 1 && new Date(p.live + 'T12:00:00Z').getUTCDay() === 1);
const sat = PUZZLES.findIndex((p) => new Date(p.live + 'T12:00:00Z').getUTCDay() === 6);
const sun = PUZZLES.findIndex((p) => p.sunday);

const MUTATIONS = {
  'key square moved to another empty well': [mon, (b, i) => { b[i].keySq = emptyAt(b[i]).find((s) => s !== b[i].keySq); }],
  'key piece swapped for another off the board': [sat, (b, i) => { b[i].keyGive = offBoard(b[i]).find((c) => c !== b[i].keyGive); }],
  'key square on an occupied well': [mon, (b, i) => { b[i].keySq = cells(b[i]).findIndex((c) => c !== '....'); }],
  'winIn one too many': [sat, (b, i) => { b[i].winIn += 1; }],
  'winIn one too few': [sat, (b, i) => { b[i].winIn -= 1; }],
  'safe count off by one': [mon, (b, i) => { b[i].safe += 1; }],
  'total count off by one': [mon, (b, i) => { b[i].total -= 1; }],
  'gift swapped for another piece': [sun, (b, i) => { b[i].hand = offBoard(b[i]).find((c) => c !== b[i].keyGive); }],
  'a piece removed from the board': [sat, (b, i) => { const c = cells(b[i]); c[c.findIndex((x) => x !== '....')] = '....'; b[i].board = c.join(' '); }],
  'a piece on the board twice': [mon, (b, i) => { const c = cells(b[i]); const f = c.find((x) => x !== '....'); c[c.findIndex((x) => x === '....')] = f; b[i].board = c.join(' '); }],
  'bad piece code': [mon, (b, i) => { b[i].hand = 'XXXX'; }],
  'sunday flag on a weekday': [-1, (b) => { b.find((x) => !x.sunday).sunday = true; }],
  'sunday flag dropped': [-1, (b) => { b[sun].sunday = false; }],
  'quizId does not match its date': [-1, (b) => { b[20].quizId = b[21].quizId; }],
  'dates not contiguous': [-1, (b) => { b[30].live = b[29].live; }],
  'position repeats': [-1, (b) => { b[40].board = b[33].board; b[40].hand = b[33].hand; }],
  'bank cut short': [-1, (b) => { b.length = b.length - 3; }],
};

let caught = 0;
const missed = [];
for (const [name, [i, fn]] of Object.entries(MUTATIONS)) {
  const bank = clone();
  fn(bank, i);
  const file = join(dir, `${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(file, `export const PUZZLES = ${JSON.stringify(bank)};\n`);
  const only = i >= 0 ? String(bank[i].num) : '0';
  const res = spawnSync(process.execPath, [new URL('./verify-gift.mjs', import.meta.url).pathname], { env: { ...process.env, VERIFY_GIFT_BANK: file, VERIFY_GIFT_ONLY: only }, encoding: 'utf8' });
  const why = (res.stderr || '').split('\n').find((l) => l.startsWith('FAIL')) || '';
  if (res.status !== 0 && why) caught++; else missed.push(name);
  process.stderr.write(`${res.status !== 0 && why ? 'caught ' : 'MISSED '} ${name}${why ? '  <- ' + why.slice(0, 110) : ''}\n`);
}
console.log(`${caught}/${Object.keys(MUTATIONS).length} mutations caught`);
for (const m of missed) console.log(`MISSED  ${m}`);
process.exit(missed.length ? 1 : 0);
