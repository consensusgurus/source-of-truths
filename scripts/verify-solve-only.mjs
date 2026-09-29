// verify-solve-only: every game in SOLVE_ONLY (lib/daily-games.js) must post
// only two scores, 0 and the full total, because every result surface drops
// the fraction on these games and says Solved / Not solved instead
// (owner, 2026-09-28). A flagged game that can post a partial score would
// lose that score from every board, the end card and the home.
//
// Checks, per flagged key: the key is live in the registry; it is not a
// graded, trades, or solve-on-score game (those have a real scale); its
// client exists; and every literal handed to postResult is 0, 10 or TOTAL.
// Then the helper itself: a flagged solve reads without a fraction, a flagged
// miss reads Not solved, and an unflagged game is byte-identical to before.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { DAILY_GAME_MAP, SOLVE_ONLY } = await import(join(root, 'lib/daily-games.js'));
const { gameStats, gameStatsShort, scoreFig } = await import(join(root, 'lib/daily-row-stats.js'));

const fails = [];
for (const key of SOLVE_ONLY) {
  const g = DAILY_GAME_MAP[key];
  if (!g) { fails.push(`${key}: not in the registry`); continue; }
  if (g.attempts || g.solvesOnScore) fails.push(`${key}: has a real score scale (attempts/solvesOnScore) and cannot be solve-or-not`);
  const route = (g.href || '/' + key).replace(/^\//, '').split('?')[0];
  const dir = join(root, 'app', route);
  const client = existsSync(dir) ? readdirSync(dir).find((f) => /Client\.jsx$/.test(f)) : null;
  if (!client) { fails.push(`${key}: no client under app/${route}`); continue; }
  const src = readFileSync(join(dir, client), 'utf8');
  for (const m of src.matchAll(/postResult\(\s*[A-Za-z0-9_]+\s*,\s*([^)]+?)\s*\)/g)) {
    const arg = m[1];
    if (/^\d+$/.test(arg) && arg !== '0' && arg !== '10') fails.push(`${key}: posts a literal score of ${arg}`);
  }
  if (/total:\s*(?!10\b|TOTAL\b)\d+/.test(src)) fails.push(`${key}: posts a total other than 10 / TOTAL`);
}

const row = (score, total, g, t) => ({ score, total, guessesUsed: g, timeElapsed: t, tries: null });
const eq = (label, got, want) => { if (got !== want) fails.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };
eq('suds solve', gameStats(row(10, 10, 0, 251), null, 'suds'), '4:11');
eq('suds miss', gameStats(row(0, 10, 0, 300), null, 'suds'), 'Not solved · 5:00');
eq('solve with no clock', gameStats(row(10, 10, 0, null), null, 'cages'), 'Solved');
eq('crux unchanged', gameStats(row(14, 16, 3, 200), 'Guesses', 'crux'), '14/16 · 3 guesses · 3:20');
eq('no key unchanged', gameStats(row(10, 10, 0, 251), null), '10/10 · 4:11');
eq('short suds', gameStatsShort(row(10, 10, 0, 251), 'suds'), '4:11');
eq('fig parker', scoreFig(row(8, 10), 'park'), '8/10');
eq('fig suds miss', scoreFig(row(0, 10), 'suds'), 'Not solved');

if (fails.length) { console.log(`verify-solve-only: ${fails.length} failure(s)`); for (const f of fails) console.log('  ' + f); process.exit(1); }
console.log(`verify-solve-only: OK, ${SOLVE_ONLY.size} solve-or-not games, helper reads correctly`);
