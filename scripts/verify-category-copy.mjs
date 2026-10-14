// verify-category-copy — the category and set pages STATE their game counts
// in prose, and nothing derives that prose from the roster.
//
//   node scripts/verify-category-copy.mjs
//
// WHY (owner, 2026-10-14). lib/puzzle-categories.js and lib/puzzle-sets.js
// write "Five card games a day", "Twenty-two free daily logic puzzles" and
// "All four, every day" by hand, while the roster under them comes from the
// registry at render time. A launch adds a game to the roster the day its
// registry row lands and leaves the copy behind. The audit that wrote this
// found nine stale pages at once: card games (said five, had seven), logic
// (22 vs 23), number (13 vs 16), chess (3 vs 4), endgames (8 vs 9), crowd
// (FAQ said four, had three), and three sets (rule-finding, classic sudokus,
// board endgames) plus the marked sudokus set, whose copy still described
// two games that had moved to another set.
//
// WHAT IT CHECKS, per category and per set with copy:
//   * a description or lede that OPENS with a count ("Seven free daily...",
//     "Sixteen number puzzles...") must match the live roster;
//   * an FAQ answer of the form "All N, every day" must match it too.
// It cannot read whether the LIST of games in the prose is complete; that
// part stays a by-hand step (CLAUDE.md, "A new game changes the category
// copy"). Exit 1 on any mismatch.

import { PUZZLE_CATEGORIES, categoryGames } from '../lib/puzzle-categories.js';
import { PUZZLE_SETS, setGames } from '../lib/puzzle-sets.js';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const TENS = { twenty: 20, thirty: 30, forty: 40 };

function value(word) {
  const w = word.toLowerCase();
  if (/^\d+$/.test(w)) return Number(w);
  const i = WORDS.indexOf(w);
  if (i !== -1) return i;
  const m = w.match(/^(twenty|thirty|forty)-(one|two|three|four|five|six|seven|eight|nine)$/);
  if (m) return TENS[m[1]] + WORDS.indexOf(m[2]);
  if (TENS[w]) return TENS[w];
  return null;
}

const NUM = '(\\d+|(?:twenty|thirty|forty)(?:-(?:one|two|three|four|five|six|seven|eight|nine))?|' + WORDS.slice(1).join('|') + ')';
const OPENING = new RegExp(`^${NUM}\\b`, 'i');
const ALL_N = new RegExp(`\\bAll ${NUM}, every day`, 'i');

const today = new Date().toISOString().slice(0, 10);
let bad = 0;
let checked = 0;

function check(label, rec, n) {
  for (const f of ['description', 'lede']) {
    const m = String(rec[f] || '').match(OPENING);
    if (!m) continue;
    checked++;
    const v = value(m[1]);
    if (v !== n) { bad++; console.log(`✗ ${label}: ${f} opens "${m[1]}" but the roster has ${n}`); }
  }
  for (const [q, a] of rec.faq || []) {
    const m = String(a).match(ALL_N);
    if (!m) continue;
    checked++;
    const v = value(m[1]);
    if (v !== n) { bad++; console.log(`✗ ${label}: FAQ "${q}" says all ${m[1]} but the roster has ${n}`); }
  }
}

for (const c of PUZZLE_CATEGORIES) check(`/${c.slug}`, c, categoryGames(c, today).length);
for (const s of PUZZLE_SETS) check(`set ${s.slug || s.name}`, s, setGames(s, today).length);

if (bad) {
  console.log(`\n${bad} stale count(s) in category or set copy (${checked} checked). Update lib/puzzle-categories.js / lib/puzzle-sets.js.`);
  process.exit(1);
}
console.log(`category and set copy agrees with the roster (${checked} counts checked)`);
