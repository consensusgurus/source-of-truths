#!/usr/bin/env node
// verify-all — run EVERY daily-puzzle bank verifier and summarise.
//
// This is the gate. No bank extension, no rule change, and no new game ships
// until this is green. See "Daily puzzle authoring standard" in CLAUDE.md.
//
//   node scripts/verify-all.mjs             run everything
//   node scripts/verify-all.mjs rung glyph  run only the named games
//   node scripts/verify-all.mjs --changed   run every checker the working tree
//                                           reaches, computed by blast-radius
//   node scripts/verify-all.mjs --quiet     summary table only
//
// ⚠ A NAMED SUBSET IS NOT THE GATE. It is for iterating. The checker a change
// breaks is very often a checker for a game the change did not touch: on
// 2026-09-04, widening scripts/emcee-wordbank.txt turned verify-encore red on
// 226 boards while every game that actually changed stayed green, and it
// shipped. Use --changed while iterating and the FULL run before pushing.
//
// It discovers checkers on its own: every scripts/verify-<game>.mjs plus every
// game handled inside verify-daily-banks.mjs. A game with a puzzle bank and no
// checker here is reported as UNVERIFIED and fails the run, so a new game
// cannot quietly ship without one.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
let only = args.filter((a) => !a.startsWith('--'));

// --changed: ask blast-radius which checkers this working tree reaches, rather
// than guessing a subset by hand. Safe in the direction that matters, because
// blast-radius over-approximates.
if (args.includes('--changed')) {
  const ref = only[0] || 'origin/main';
  const r = spawnSync(process.execPath, [join(here, 'blast-radius.mjs'), ref, '--quiet'],
    { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || 'blast-radius failed'); process.exit(1); }
  only = (r.stdout || '').trim().split(/\s+/).filter(Boolean);
  if (!only.length) { console.log('verify-all --changed: nothing changed, nothing to check'); process.exit(0); }
  console.log(`verify-all --changed: ${only.length} checker(s) reached from ${ref}\n`);
}

// games covered by the shared multi-game checker
const banksSrc = readFileSync(join(here, 'verify-daily-banks.mjs'), 'utf8');
const bankGames = [...banksSrc.matchAll(/if \(RUN\('([a-z]+)'\)\)/g)].map((m) => m[1]);
// games with their own dedicated checker
const solo = readdirSync(here)
  .filter((f) => /^verify-[a-z0-9-]+\.mjs$/.test(f) && f !== 'verify-all.mjs' && f !== 'verify-daily-banks.mjs')
  .map((f) => ({ game: f.replace(/^verify-|\.mjs$/g, ''), file: f }));

// every game that actually has a bank on disk
const registry = readFileSync(join(root, 'lib/daily-games.js'), 'utf8');
const registered = [...new Set([...registry.matchAll(/key: '([a-z]+)'/g)].map((m) => m[1]))];
const covered = new Set([...bankGames, ...solo.map((s) => s.game)]);
const dirFor = (g) => (g === 'park' ? 'parker' : g);
const unverified = registered.filter((g) => !covered.has(g) && !covered.has(dirFor(g))
  && existsSync(join(root, 'app', dirFor(g), 'puzzles.js')));

const jobs = [];
const wantAllBanks = only.includes('daily-banks');
if (!only.length || wantAllBanks || only.some((o) => bankGames.includes(o))) {
  const pick = only.length && !wantAllBanks ? only.filter((o) => bankGames.includes(o)) : [];
  jobs.push({ name: pick.length ? `daily-banks (${pick.join(',')})` : 'daily-banks (14 games)', argv: ['scripts/verify-daily-banks.mjs', ...pick] });
}
for (const s of solo) {
  if (only.length && !only.includes(s.game)) continue;
  jobs.push({ name: s.game, argv: [`scripts/${s.file}`] });
}

const results = [];
for (const j of jobs) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, j.argv, { cwd: root, encoding: 'utf8' });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const fails = (out.match(/^✗/gm) || []).length;
  const notes = (out.match(/^…/gm) || []).length;
  results.push({ name: j.name, code: r.status, fails, notes, secs: ((Date.now() - t0) / 1000).toFixed(1), out });
  if (!quiet && (r.status !== 0 || notes)) {
    console.log(`\n──── ${j.name} ────`);
    console.log(out.split('\n').filter((l) => l.startsWith('✗') || l.startsWith('…')).join('\n'));
  }
}

console.log('\n════ verify-all ════');
for (const r of results) {
  const tag = r.code === 0 ? '✓ PASS' : `✗ FAIL (${r.fails})`;
  console.log(`${tag.padEnd(12)} ${r.name.padEnd(26)} ${r.secs}s${r.notes ? `  ${r.notes} note${r.notes === 1 ? '' : 's'}` : ''}`);
}
if (unverified.length) console.log(`✗ UNVERIFIED  ${unverified.join(', ')}  (a bank with no checker, see CLAUDE.md)`);
const bad = results.filter((r) => r.code !== 0).length + (unverified.length ? 1 : 0);
console.log(bad ? `\n${bad} checker${bad === 1 ? '' : 's'} failing. Do not ship a bank change until this is green.` : '\nAll banks verified.');
process.exit(bad ? 1 : 0);
