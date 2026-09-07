// lib/daily-groups.js against the registry. Every key real; every group 3 to 5
// keys sharing the group's category; no key in two groups; a category that has
// groups at all has EVERY live game in one (a game left out would render a
// category rack while its siblings render a set, which is the drift this
// exists to catch). Discovered by scripts/verify-all.mjs; ✗ fails, … warns.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { GROUPS, groupOf, groupsIn } = await import('../lib/daily-groups.js');
const { DAILY_GAMES, DAILY_GAME_MAP, liveDailyKeys } = await import('../lib/daily-games.js');

let fails = 0;
let warns = 0;
const fail = (m) => { console.error('✗ ' + m); fails += 1; };
const warn = (m) => { console.warn('… ' + m); warns += 1; };
const ok = (m) => console.log('ok    ' + m);

const seen = new Map();
for (const g of GROUPS) {
  if (!g.name || !g.cat || !Array.isArray(g.keys)) { fail(`malformed group ${JSON.stringify(g)}`); continue; }
  if (g.keys.length < 3 || g.keys.length > 5) fail(`${g.name}: ${g.keys.length} keys, must be 3 to 5`);
  for (const k of g.keys) {
    const row = DAILY_GAME_MAP[k];
    if (!row) { fail(`${g.name}: '${k}' is not a registry key`); continue; }
    if (row.cat !== g.cat) fail(`${g.name} (${g.cat}): '${k}' is ${row.cat}`);
    if (seen.has(k)) fail(`'${k}' is in both ${seen.get(k)} and ${g.name}`);
    seen.set(k, g.name);
  }
}
const names = GROUPS.map((g) => g.name);
if (new Set(names).size !== names.length) fail('duplicate group name');

const live = new Set(liveDailyKeys());
const groupedCats = new Set(GROUPS.map((g) => g.cat));
for (const cat of groupedCats) {
  const liveInCat = DAILY_GAMES.filter((g) => g.cat === cat && live.has(g.key)).map((g) => g.key);
  const missing = liveInCat.filter((k) => !groupOf(k));
  if (missing.length) fail(`${cat} is grouped but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} in no group`);
  else ok(`${cat}: ${liveInCat.length} live games in ${groupsIn(cat).length} groups`);
  for (const g of groupsIn(cat)) {
    const alive = g.keys.filter((k) => live.has(k)).length;
    if (alive < 2) warn(`${g.name} has only ${alive} live game${alive === 1 ? '' : 's'}; regroup before it hits one`);
  }
}
const ungrouped = [...new Set(DAILY_GAMES.map((g) => g.cat))].filter((c) => !groupedCats.has(c));
for (const cat of ungrouped) {
  const n = DAILY_GAMES.filter((g) => g.cat === cat && live.has(g.key)).length;
  if (n > 5) fail(`${cat} has ${n} live games and no groups (five is the ceiling for an ungrouped category)`);
  else ok(`${cat}: ${n} live, ungrouped by design`);
}

console.log(fails ? `\n${fails} failure(s), ${warns} warning(s)` : `\nall clear, ${warns} warning(s)`);
process.exit(fails ? 1 : 0);
