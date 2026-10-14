// Mutation test for scripts/verify-swindle.mjs: break the real bank one way at a
// time and require the verifier to FAIL on every break. A checker that has
// never been shown to fail has not been tested.
//
//   node scripts/swindle-mutation-test.mjs
//
// Each run points the verifier at a mutated copy (VERIFY_SWINDLE_BANK) and, to
// keep the searches short, at the mutated board alone (VERIFY_SWINDLE_ONLY):
// the shape and bank-wide checks still read every board.
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUZZLES } from '../app/swindle/puzzles.js';
import { parseFen, legalMoves, toSan } from '../app/mate/chess.js';

const dir = mkdtempSync(join(tmpdir(), 'swindle-mut-'));
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
// the first board whose book goes past the root, and the first shallow one
const deep = PUZZLES.find((p) => Array.isArray(p.book[p.key]) && p.book[p.key][1] && Object.keys(p.book[p.key][1]).length >= 1 && !p.sunday);
const deepI = PUZZLES.indexOf(deep);
const shallowI = PUZZLES.findIndex((p) => p.drawIn <= 2);
// a Friday at drawIn 4, where 3 is still inside the band, so only the proof catches it
const fri4I = PUZZLES.findIndex((p) => p.drawIn === 4 && new Date(p.live + 'T12:00:00Z').getUTCDay() === 5);
const firstNode = (p) => p.book[p.key][1];

const MUTATIONS = {
  'key swapped for a losing move': [shallowI, (b, i) => {
    const bd = parseFen(b[i].fen).board;
    const mv = legalMoves(bd, 'w').find((m) => m.uci !== b[i].key);
    const e = b[i].book[b[i].key]; delete b[i].book[b[i].key]; b[i].book[mv.uci] = e;
    b[i].key = mv.uci; b[i].keySan = toSan(bd, mv.from, mv.to); b[i].line[0] = mv.uci;
  }],
  'drawIn one too many': [deepI, (b, i) => { b[i].drawIn += 1; b[i].budget = b[i].drawIn + (b[i].drawIn <= 3 ? 2 : 1); }],
  'drawIn one too few': [fri4I, (b, i) => { b[i].drawIn -= 1; b[i].budget = b[i].drawIn + (b[i].drawIn <= 3 ? 2 : 1); }],
  'budget changed': [shallowI, (b, i) => { b[i].budget += 1; }],
  'theme swapped': [shallowI, (b, i) => { b[i].theme = b[i].theme === 'stalemate' ? 'material' : 'stalemate'; }],
  'legal count off by one': [shallowI, (b, i) => { b[i].legal += 1; }],
  'decoys off by one': [shallowI, (b, i) => { b[i].decoys += 1; }],
  'holding move dropped from the book': [deepI, (b, i) => { const n = firstNode(b[i]); delete n[Object.keys(n)[0]]; }],
  'book reply changed': [deepI, (b, i) => { const e = b[i].book[b[i].key]; e[0] = e[0].slice(0, 2) + (e[0][2] === 'a' ? 'b' : 'a') + e[0][3]; }],
  'a losing first move added to the root': [shallowI, (b, i) => { b[i].book['a2a3'] = 0; }],
  'principal line altered': [deepI, (b, i) => { b[i].line = b[i].line.slice(0, -1); }],
  'pawn moved onto its home rank': [shallowI, (b, i) => { const f = b[i].fen.split(' '); const rows = f[0].split('/'); rows[6] = 'P7'; f[0] = rows.join('/'); b[i].fen = f.join(' '); }],
  'sunday flag on a weekday': [-1, (b) => { const p = b.find((x) => !x.sunday); p.sunday = true; }],
  'quizId does not match its date': [-1, (b) => { b[20].quizId = b[21].quizId; }],
  'dates not contiguous': [-1, (b) => { b[30].live = b[29].live; }],
  'position repeats': [-1, (b) => { b[40].fen = b[39].fen; }],
  'weekday off its band': [-1, (b) => { const p = b.find((x) => !x.sunday && x.drawIn <= 2 && new Date(x.live + 'T12:00:00Z').getUTCDay() === 1); p.drawIn = 6; }],
};

let caught = 0;
const missed = [];
for (const [name, [i, fn]] of Object.entries(MUTATIONS)) {
  const bank = clone();
  fn(bank, i);
  const file = join(dir, `${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(file, `export const PUZZLES = ${JSON.stringify(bank)};\n`);
  const only = i >= 0 ? String(bank[i].num) : '0';
  const res = spawnSync(process.execPath, [new URL('./verify-swindle.mjs', import.meta.url).pathname], { env: { ...process.env, VERIFY_SWINDLE_BANK: file, VERIFY_SWINDLE_ONLY: only }, encoding: 'utf8' });
  // a crash is not a catch: the verifier has to have said FAIL
  const why = (res.stderr || '').split('\n').find((l) => l.startsWith('FAIL')) || '';
  if (res.status !== 0 && why) caught++; else missed.push(name);
  process.stderr.write(`${res.status !== 0 && why ? 'caught ' : 'MISSED '} ${name}${why ? '  <- ' + why.slice(0, 110) : ''}\n`);
}
console.log(`${caught}/${Object.keys(MUTATIONS).length} mutations caught`);
for (const m of missed) console.log(`MISSED  ${m}`);
process.exit(missed.length ? 1 : 0);
