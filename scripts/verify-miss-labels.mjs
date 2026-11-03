#!/usr/bin/env node
// verify-miss-labels — the leaderboard's secondary column says what the game
// actually counts, on every surface, for every game.
//
// WHY THIS EXISTS. Every daily posts ONE figure in `guessesUsed`, and what that
// figure counts differs in every game: Hands posts busts, Sweep posts digs,
// Tuck posts unplaced tiles, Paths posts a cost, and sixteen games post nothing
// at all. `miss` in lib/daily-games.js is the word for it, and the three table
// surfaces have always headed their column with it — but `gameStats`, the
// helper the ENDING CURTAIN uses on all 80 dailies, welded on the word
// "guesses" instead. So the one leaderboard every player is guaranteed to see
// told a Hands player "3 guesses" while the column header beside it said
// "Busts" (owner, 2026-09-01).
//
// The registry was right the whole time. What was missing was anything
// asserting that the renderers use it, and that the 80 hand-copied `missLabel`
// props still agree with it. Both are mechanical, so both are checked here.
//
//   node scripts/verify-miss-labels.mjs
//
// Output convention matches the other checkers: lines starting with ✗ are
// failures and set a non-zero exit; lines starting with … are notes.
import { register } from 'node:module';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
// lib/daily-combined.js imports './daily-games' without an extension, which
// Next resolves and node does not. Same loader every other checker that reaches
// into the app uses; see CLAUDE.md, "scripts/alias-loader.mjs".
register('./alias-loader.mjs', import.meta.url);
let fails = 0, notes = 0;
const fail = (m) => { fails++; console.log('✗ ' + m); };
const note = (m) => { notes++; console.log('… ' + m); };

const { DAILY_GAMES } = await import(join(root, 'lib/daily-games.js'));
const { MISS_ONE, missWord, gameStats } = await import(join(root, 'lib/daily-row-stats.js'));

// ── 1. Every label the registry uses has a singular ────────────────────────
// missWord degrades to the plural for an unknown label, which is clumsy rather
// than wrong, so this is the check that stops a new game shipping "1 parries".
if (!MISS_ONE || typeof missWord !== 'function' || typeof gameStats !== 'function') {
  console.log('✗ lib/daily-row-stats.js does not export MISS_ONE, missWord and gameStats');
  console.log('FAIL 1');
  process.exit(1);
}
const labels = [...new Set(DAILY_GAMES.map((g) => g.miss).filter(Boolean))];
for (const l of labels) {
  if (!Object.prototype.hasOwnProperty.call(MISS_ONE, l)) {
    fail(`registry label "${l}" has no singular in MISS_ONE (lib/daily-row-stats.js)`);
  }
}
for (const l of Object.keys(MISS_ONE)) {
  if (!labels.includes(l)) note(`MISS_ONE carries "${l}", which no game uses any more`);
}

// ── 2. Display names are unique, and each client's name resolves to its own ─
// row. LoftFinish falls back to the registry BY DISPLAY NAME, so a duplicate
// name would silently hand one game another game's word.
const byName = new Map();
for (const g of DAILY_GAMES) {
  if (byName.has(g.name)) fail(`two games share the display name "${g.name}": ${byName.get(g.name).key} and ${g.key}`);
  else byName.set(g.name, g);
}

// ── 3. The clients ─────────────────────────────────────────────────────────
// Each game's client hardcodes `missLabel`, which is 80 copies of one registry
// field. They may not drift, and a game entitled to a column may not omit it.
const folderOf = (g) => String(g.href || '/' + g.key).replace(/^\//, '');
const clientOf = (folder) => {
  const dir = join(root, 'app', folder);
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((x) => /Client\.jsx$/.test(x));
  return f ? join(dir, f) : null;
};

let checked = 0;
for (const g of DAILY_GAMES) {
  const path = clientOf(folderOf(g));
  if (!path) { note(`${g.key}: no client found under app/${folderOf(g)}`); continue; }
  const src = readFileSync(path, 'utf8');
  if (!/<LoftFinish/.test(src)) { note(`${g.key}: client has no LoftFinish`); continue; }
  checked++;

  const nameM = /<LoftFinish\s*\n\s*name="([^"]*)"/.exec(src);
  if (!nameM) fail(`${g.key}: LoftFinish has no literal name= to resolve the registry by`);
  else if (nameM[1] !== g.name) fail(`${g.key}: LoftFinish name="${nameM[1]}" but the registry says "${g.name}"`);

  const missM = /missLabel=\{?"([^"]*)"\}?/.exec(src);
  if (g.miss) {
    if (!missM) fail(`${g.key}: registry says the column is "${g.miss}" but the client passes no missLabel`);
    else if (missM[1] !== g.miss) fail(`${g.key}: client missLabel="${missM[1]}" but the registry says "${g.miss}"`);
  } else if (missM) {
    fail(`${g.key}: registry says this game posts no miss figure, but the client passes missLabel="${missM[1]}"`);
  }
}

// ── 4. No renderer may weld a word on ──────────────────────────────────────
// The bug, stated as a check: a hardcoded count-word in shared render code.
const SHARED = ['lib/daily-row-stats.js', 'app/StageFinish.jsx', 'app/LoftFinish.jsx',
  'app/DailyTilePanel.jsx', 'app/DailyEndCard.jsx', 'app/quiz/[id]/DailyBoardPanel.jsx'];
for (const rel of SHARED) {
  const p = join(root, rel);
  if (!existsSync(p)) { note(`${rel} is gone; drop it from SHARED`); continue; }
  const src = readFileSync(p, 'utf8').split('\n');
  src.forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return;                       // a comment may say "guesses"
    if (rel.endsWith('daily-row-stats.js') && /MISS_ONE|Guesses:/.test(line)) return;
    if (/'\s(guess|guesses)'|"\s(guess|guesses)"/.test(line)) {
      fail(`${rel}:${i + 1} welds the word "guess" onto a figure; use missWord(label, n)`);
    }
  });
}

// ── 5. What a player actually reads ────────────────────────────────────────
// The behavioural test, because everything above could pass while gameStats
// still ignored its argument.
const row = (o) => ({ score: 4, total: 10, timeElapsed: 131, ...o });
const cases = [
  // PROGRESS_FIG games print the figure that ranks (owner, 2026-11-03).
  ['hands',  row({ guessesUsed: 3, progress: 142 * 100 + 96 }), '142 points'],
  ['hands',  row({ guessesUsed: 3, progress: 1 * 100 + 99 }), '1 point'],
  ['whittle', row({ guessesUsed: 2, progress: (500 - 14) * 100 + 97 }), '14 clues left'],
  ['span',   row({ guessesUsed: 1, progress: (500 - 7) * 100 + 98 }), '7 hops'],
  ['shoe',   row({ guessesUsed: 2, progress: 1040 }), '+40 chips'],
  ['sweep',  row({ guessesUsed: 7 }), '7 digs'],
  ['tuck',   row({ guessesUsed: 2 }), '2 unused'],
  ['crux',   row({ guessesUsed: 5 }), '5 guesses'],
  ['mate',   row({ tries: 1 }),       '1 try'],
  ['mate',   row({ tries: 3 }),       '3 tries'],
];
for (const [key, r, want] of cases) {
  const g = DAILY_GAMES.find((x) => x.key === key);
  if (!g) { note(`sample game ${key} is not in the registry any more`); continue; }
  const out = gameStats(r, g.miss, key);
  if (!out || !out.includes(want)) fail(`gameStats for ${key} reads "${out}" — expected it to contain "${want}"`);
}
// A game that posts no miss figure says nothing rather than something borrowed.
for (const key of ['suds', 'cages', 'bracket']) {
  const g = DAILY_GAMES.find((x) => x.key === key);
  if (!g) continue;
  if (g.miss) { note(`${key} now carries a miss label; drop it from this sample`); continue; }
  const out = gameStats(row({ guessesUsed: 4 }), g.miss);
  if (/\b4\b/.test(String(out).replace('4/10', ''))) {
    fail(`gameStats for ${key} prints a miss figure, but the registry says it has none: "${out}"`);
  }
}
// A caller that passes no label at all must also say nothing.
{
  const out = gameStats(row({ guessesUsed: 3 }));
  if (/guess|bust|3 /.test(String(out).replace('4/10', ''))) {
    fail(`gameStats with no label invented a middle term: "${out}"`);
  }
}
if (missWord('Tries', 1) !== 'try' || missWord('Tries', 2) !== 'tries') fail('missWord mishandles Tries');
if (missWord(null, 2) !== null) fail('missWord should return null with no label');

// A PROGRESS_FIG row from before the switch carries busts/slips/misses in guessesUsed and
// no figure. It must print no middle term, never the old count under the new word.
for (const key of ['hands', 'whittle', 'span']) {
  const g = DAILY_GAMES.find((x) => x.key === key);
  const out = gameStats(row({ guessesUsed: 3 }), g.miss, key);
  if (/\b3\b/.test(String(out))) fail(`gameStats for a pre-switch ${key} row prints "${out}"`);
}

// ── 6. The figure has to SURVIVE THE COMBINE ───────────────────────────────
// "Your standing" on the home reads board.me.perGame, which combineDaily builds
// in two hops: scoreGame's player -> u.games -> perGame. The first version of
// this change added the field to the second hop only, so every row on the home
// silently lost its middle term while every other surface kept it. Both hops
// are checked here, through the real module, because that is a bug no page
// throws on and no reader can report except as "it used to say something".
{
  const { combineDaily } = await import(join(root, 'lib/daily-combined.js'));
  const p = (o) => ({ userKey: 'a:me', username: null, registered: false, score: o.s, total: 10,
    guessesUsed: o.g ?? 0, tries: o.tries ?? null, egTier: null, timeElapsed: 131, progress: null,
    completion: 0, placement: o.pts, points: o.pts, rank: o.rank, rankedPos: o.rank,
    field: o.field, abandoned: false });
  const rows = combineDaily([
    { key: 'hands', quizId: 'hands-9-1-26', field: 94, players: new Map([['a:me', { ...p({ s: 4, g: 3, pts: 8, rank: 4, field: 94 }), progress: 14296 }]]) },
    { key: 'mate',  quizId: 'mate-9-1-26',  field: 40, players: new Map([['a:me', p({ s: 10, tries: 2, pts: 15, rank: 1, field: 40 })]]) },
  ], 25);
  const me = rows.find((r) => r.userKey === 'a:me');
  if (!me) fail('combineDaily lost the player entirely');
  else {
    const h = me.perGame.hands, m = me.perGame.mate;
    if (!h || h.guessesUsed !== 3) fail(`combineDaily drops guessesUsed from perGame (got ${h && h.guessesUsed}); Your standing loses its middle term`);
    if (!m || m.tries !== 2) fail(`combineDaily drops tries from perGame (got ${m && m.tries})`);
    const hands = DAILY_GAMES.find((g) => g.key === 'hands');
    if (h && hands && h.progress !== 14296) fail(`combineDaily drops progress from perGame (got ${h && h.progress}); Hands points vanish from Your standing`);
    if (h && hands && !String(gameStats(h, hands.miss, 'hands')).includes('142 points')) {
      fail(`the home would print "${gameStats(h, hands.miss, 'hands')}" for a Hands row of 142 points`);
    }
  }
}

console.log(`\nmiss-labels: ${DAILY_GAMES.length} games, ${labels.length} distinct labels, ${checked} clients checked`);
console.log(fails ? `FAIL ${fails}` : 'PASS' + (notes ? ` (${notes} note${notes === 1 ? '' : 's'})` : ''));
process.exit(fails ? 1 : 0);
