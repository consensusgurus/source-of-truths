#!/usr/bin/env node
// Chomp bank extender for the UNIQUENESS ERA, deterministic.
//
// scripts/bank-chomp-unique.mjs built the era's first 46 boards, but it seeds
// off the wall clock, stops on a time budget and measures variety only over its
// own checkpoint, so a re-run cannot reproduce a board and a second segment
// would not see the first one's start squares or cast orders. This script is
// the same carve (scripts/gen-chomp-unique.mjs) and the same gates, with three
// changes:
//
//   1. every attempt is seeded from the BOARD NUMBER and the attempt index,
//      and the search stops on an ATTEMPT budget, so a board is reproducible
//      and a new segment can never replay a frozen one
//   2. variety (start-square cap 5, distinct cast orders, no repeated layout,
//      the 45% mascot-square cap) is counted over EVERY uniqueness-era board
//      already in app/chomp/puzzles.js plus the boards this run has made
//   3. the checkpoint lives wherever CKPT points (default under /tmp), because
//      a restock runs beside other jobs and must not write into scripts/
//
//   CKPT=/tmp/claude-0/chomp/ckpt.json node scripts/gen-chomp-extend.mjs --to 2026-11-30
//   ... --write          splice the checkpoint's boards onto the bank
//
// Rungs are imported from bank-chomp-unique.mjs so the two cannot drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { carve, rng } from './gen-chomp-unique.mjs';
import { countRoutes } from './chomp-count.mjs';

const RUNGS = [
  { w: 8, h: 8, cast: 11, forks: 28, red: 1 },
  { w: 7, h: 7, cast: 10, forks: 18, red: 4 },
  { w: 7, h: 7, cast: 10, forks: 19, red: 4 },
  { w: 7, h: 7, cast: 9, forks: 20, red: 4 },
  { w: 7, h: 7, cast: 9, forks: 21, red: 4 },
  { w: 7, h: 7, cast: 9, forks: 22, red: 4 },
  { w: 7, h: 7, cast: 8, forks: 23, red: 1 },
];
const MASCOTS = ['bulldog', 'ibis', 'gamecock', 'tiger', 'eagle', 'longhorn', 'wildcat', 'seminole', 'knight', 'smokey', 'bull'];
const UNIQUE_FROM = '2026-09-01';
const START_CAP = 5, CELL_SHARE = 0.45;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'app/chomp/puzzles.js');
const args = process.argv.slice(2);
const TO = args[args.indexOf('--to') + 1];
const WRITE = args.includes('--write');
const CKPT = process.env.CKPT || '/tmp/chomp-extend.ckpt.json';
const ATTEMPTS = { 7: Number(process.env.ATT7 || 4000), 8: Number(process.env.ATT8 || 800) };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const { PUZZLES } = await import(FILE);
let done = {};
try { done = JSON.parse(fs.readFileSync(CKPT, 'utf8')); } catch (e) {}

const era = () => [...PUZZLES.filter((p) => p.live >= UNIQUE_FROM), ...Object.values(done)];
const last = PUZZLES[PUZZLES.length - 1];

function redundantCount(board) {
  let n = 0;
  for (let i = 0; i < board.pellets.length; i++) {
    const q = { ...board, pellets: board.pellets.filter((_, k) => k !== i) };
    const c = countRoutes(q, 2, 900000);
    if (!c.capped && c.n === 1) n += 1;
  }
  return n;
}

if (!WRITE) {
  let num = last.num;
  for (let d = new Date(`${last.live}T12:00:00Z`); ;) {
    d = new Date(d.getTime() + 86400000);
    const live = d.toISOString().slice(0, 10);
    if (live > TO) break;
    num += 1;
    if (done[live]) continue;
    const rung = RUNGS[d.getUTCDay()];
    const rows = era();
    const startCount = {}, orders = new Set(), keys = new Set(), cells = {};
    for (const r of rows) {
      startCount[String(r.start)] = (startCount[String(r.start)] || 0) + 1;
      orders.add(r.cast.join('|'));
      keys.add(JSON.stringify([r.start, r.pellets]));
      for (const c of r.pellets) cells[String(c)] = (cells[String(c)] || 0) + 1;
    }
    const cellCap = Math.ceil((rows.length + 1) * CELL_SHARE);
    let got = null, att = 0;
    const t0 = Date.now();
    for (; att < ATTEMPTS[rung.w] && !got; att++) {
      const rnd = rng((num * 7919 + att * 104729 + 17) >>> 0);
      const r = carve(rung.w, rung.h, 0, 0, rung.cast, rnd);
      if (!r || r.tooTight || r.short) continue;
      if (r.forks < rung.forks) continue;
      if ((startCount[String(r.board.start)] || 0) >= START_CAP) continue;
      if (keys.has(JSON.stringify([r.board.start, r.board.pellets]))) continue;
      if (r.board.pellets.some((c) => (cells[String(c)] || 0) + 1 > cellCap)) continue;
      if (redundantCount(r.board) > rung.red) continue;
      got = r;
    }
    if (!got) { console.log(`${live}  STARVED after ${att} attempts (${rung.w}x${rung.h}, cast ${rung.cast})`); break; }
    const crnd = rng((num * 31337 + 5) >>> 0);
    let cast = null;
    for (let t = 0; t < 400 && !cast; t++) {
      const rest = MASCOTS.filter((m) => m !== 'bulldog');
      for (let i = rest.length - 1; i > 0; i--) { const j = (crnd() * (i + 1)) | 0; [rest[i], rest[j]] = [rest[j], rest[i]]; }
      const c = ['bulldog', ...rest.slice(0, rung.cast - 1)];
      if (!orders.has(c.join('|'))) cast = c;
    }
    const proof = countRoutes(got.board, 2, 6000000);
    if (!cast || proof.capped || proof.n !== 1) { console.log(`${live}  re-proof or cast failed`); break; }
    done[live] = {
      num, live,
      quizId: `chomp-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`,
      dateLabel: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
      sunday: d.getUTCDay() === 0, w: rung.w, h: rung.h,
      start: got.board.start, floor: got.floor, min: got.min,
      cast, pellets: got.board.pellets, forks: got.forks, attempts: att,
    };
    fs.writeFileSync(CKPT, JSON.stringify(done, null, 1));
    console.log(`${live}  #${num} ${rung.w}x${rung.h} cast ${rung.cast} forks ${got.forks} min ${got.min} attempt ${att} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  process.exit(0);
}

// --write: splice the checkpoint onto the bank, in date order, contiguous.
const rows = Object.values(done).sort((a, b) => a.live.localeCompare(b.live));
let expect = last.num + 1, day = new Date(`${last.live}T12:00:00Z`);
for (const r of rows) {
  day = new Date(day.getTime() + 86400000);
  if (r.num !== expect++ || r.live !== day.toISOString().slice(0, 10)) throw new Error(`gap at ${r.live}`);
}
const js = (a) => `[${a.map((c) => `[${c[0]},${c[1]}]`).join(', ')}]`;
const text = rows.map((r) =>
  `  { num: ${r.num}, quizId: '${r.quizId}', live: '${r.live}', dateLabel: '${r.dateLabel}', sunday: ${r.sunday}, w: ${r.w}, h: ${r.h}, start: [${r.start[0]},${r.start[1]}], floor: ${r.floor}, min: ${r.min},\n`
  + `    cast: [${r.cast.map((m) => `'${m}'`).join(', ')}],\n`
  + `    pellets: ${js(r.pellets)} },\n`).join('');
const src = fs.readFileSync(FILE, 'utf8');
const cut = src.lastIndexOf('];');
fs.writeFileSync(FILE, src.slice(0, cut) + text + src.slice(cut));
console.error(`appended ${rows.length} boards (${rows[0].num}-${rows[rows.length - 1].num}, ${rows[0].live} to ${rows[rows.length - 1].live})`);
