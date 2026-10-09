#!/usr/bin/env node
// Content review gate (2026-10-08). See scripts/CONTENT-REVIEW.md.
//
// Every other checker in this repo proves a board is SHAPED right. None proves
// its answers are TRUE, and on 2026-10-08 an audit found about 500 content
// defects in banks whose checkers were green. This gate makes the human-style
// review part of the process: scripts/content-reviewed.json records, per game,
// the last live date a separate reviewer has read. This script FAILS when a
// board goes live within LEAD_DAYS of today (Eastern) beyond that date, so an
// unreviewed board can never reach players without the gate going red first,
// and WARNS with the size of the unreviewed runway otherwise.
//
// Adding a game whose answers depend on facts or meaning? Add it to
// CONTENT_GAMES and to the ledger. Solver-proved games (sudokus, logic grids,
// chess, Parker, Sweep, Cipher, Docket, Alibi, Rung, Warmer) do not belong.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEAD_DAYS = 3;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ledger = JSON.parse(readFileSync(join(root, 'scripts/content-reviewed.json'), 'utf8'));
const CONTENT_GAMES = Object.keys(ledger).filter((k) => !k.startsWith('_'));

const etToday = (() => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return process.env.CONTENT_REVIEW_TODAY || p;
})();
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const horizon = addDays(etToday, LEAD_DAYS - 1);

let fail = 0;
for (const g of CONTENT_GAMES) {
  const f = join(root, 'app', g, 'puzzles.js');
  if (!existsSync(f)) { console.error(`FAIL ${g}: listed in the ledger but app/${g}/puzzles.js is missing`); fail++; continue; }
  const dates = [...readFileSync(f, 'utf8').matchAll(/["']?live["']?\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/g)].map((m) => m[1]);
  if (!dates.length) { console.error(`FAIL ${g}: no live dates found in app/${g}/puzzles.js`); fail++; continue; }
  const through = ledger[g].through;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(through || '')) { console.error(`FAIL ${g}: ledger 'through' is not a date`); fail++; continue; }
  const soon = [...new Set(dates)].filter((d) => d >= etToday && d <= horizon && d > through).sort();
  const later = [...new Set(dates)].filter((d) => d > horizon && d > through).sort();
  if (soon.length) {
    console.error(`FAIL ${g}: ${soon.length} unreviewed board(s) go live within ${LEAD_DAYS} days (${soon[0]}..${soon[soon.length - 1]}); reviewed through ${through}. Review them, fix what the review finds, then move 'through' in scripts/content-reviewed.json.`);
    fail++;
  } else if (later.length) {
    console.log(`warn ${g}: reviewed through ${through}; ${later.length} later board(s) unreviewed (${later[0]}..${later[later.length - 1]})`);
  } else {
    console.log(`ok   ${g}: reviewed through ${through}`);
  }
}
console.log(`content review gate: ${CONTENT_GAMES.length} games, today ${etToday}, horizon ${horizon}`);
console.log(fail ? `${fail} failure(s)` : 'OK');
process.exit(fail ? 1 : 0);
