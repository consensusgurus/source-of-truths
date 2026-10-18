// verify-placement: every live daily is PLACED, in both of its axes and on every
// surface that lists games by hand (owner rule, 2026-10-18, "Placing a new daily"
// in CLAUDE.md). A game left out of one of these does not error anywhere: it just
// is not on that shelf, page or archive, which is how a launch goes missing.
//
// For every daily live today:
//  1. its registry category is a real category with a slate filter list, and the
//     game is in that list in app/DailyGamesGrid.jsx (Atlas may also sit in Trivia)
//  2. one to four skills in lib/daily-skills.js (verify-skills checks the rest)
//  3. a row in the archive GAMES (app/archive/page.js)
//  4. a puzzle map entry in the three daily slate maps, and in the Sunday slate
//     when the game runs a Sunday Edition
//  5. at least one finish set (lib/finish-sets.js)
//  6. a glyph (lib/game-glyphs.js)
//  7. when its category has a landing page in lib/puzzle-categories.js, a key there
// Discovered by scripts/verify-all.mjs.
//
// GRANDFATHERED (gaps that predate this check, 2026-10-18; a burn-down list that
// may only shrink): games drawn with no stroke glyph, and Quilt's missing Sunday
// slate entry. A NEW daily never goes on either list.
const OLD_NO_GLYPH = new Set(['emcee', 'suds', 'etch', 'cages', 'sando', 'sixes', 'mercury', 'encore', 'whittle']);
const OLD_NO_SUNDAY_SLATE = new Set(['quilt']);
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { DAILY_GAME_MAP, liveDailyKeys } = await import('../lib/daily-games.js');
const { SKILL_TAGS } = await import('../lib/daily-skills.js');
const { FINISH_SETS } = await import('../lib/finish-sets.js').catch(() => ({}));
const { glyphFor } = await import('../lib/game-glyphs.js');
const { hasSundayEdition } = await import('../lib/sunday-editions.js');
const PC = await import('../lib/puzzle-categories.js');

const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const fails = [];
const fail = (m) => fails.push(m);

const grid = read('app/DailyGamesGrid.jsx');
const catLists = {};
for (const m of grid.matchAll(/\{ key: '([a-z-]+)', label: '([^']+)', keys: \[([^\]]*)\]/g)) {
  catLists[m[2]] = new Set([...m[3].matchAll(/'([a-z]+)'/g)].map((x) => x[1]));
}
const archive = read('app/archive/page.js');
const maps = ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js'].map((f) => [f, read(f)]);
const sets = FINISH_SETS || [];
const cats = (PC.PUZZLE_CATEGORIES || PC.CATEGORIES || PC.default || []).filter((c) => c && c.cat && Array.isArray(c.keys));

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const live = liveDailyKeys(today);
for (const k of live) {
  const g = DAILY_GAME_MAP[k];
  const list = catLists[g.cat];
  if (!list) fail(`${k}: category ${g.cat} has no slate list in DailyGamesGrid`);
  else if (!list.has(k)) fail(`${k}: not in the ${g.cat} list in DailyGamesGrid`);
  const t = SKILL_TAGS[k];
  if (!t || t.length < 1 || t.length > 4) fail(`${k}: needs one to four skills`);
  if (!new RegExp(`\\{ key: '${k}',[^\\n]*src: `).test(archive)) fail(`${k}: no row in the archive GAMES`);
  for (const [f, s] of maps) {
    if (f.includes('sunday-slate') && (!hasSundayEdition(k) || OLD_NO_SUNDAY_SLATE.has(k))) continue;
    if (!new RegExp(`\\b${k}: P_`).test(s)) fail(`${k}: missing from the puzzle map in ${f}`);
  }
  if (!sets.some((s) => s.keys.includes(k))) fail(`${k}: in no finish set`);
  if (!glyphFor(k) && !OLD_NO_GLYPH.has(k)) fail(`${k}: no glyph in lib/game-glyphs.js`);
  const pages = cats.filter((c) => c.cat === g.cat);
  if (pages.length && !pages.some((c) => c.keys.includes(k))) fail(`${k}: on no ${g.cat} landing page in puzzle-categories`);
}

if (fails.length) {
  console.log(`verify-placement: ${fails.length} failure(s)`);
  for (const m of fails) console.log('  FAIL ' + m);
  process.exit(1);
}
console.log(`verify-placement: ok (${live.length} live dailies placed)`);
