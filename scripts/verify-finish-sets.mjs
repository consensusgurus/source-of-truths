// lib/finish-sets.js against the registry, and the pick against a few cases.
// Discovered by scripts/verify-all.mjs; ✗ fails, … warns.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { FINISH_SETS, finishPick } = await import('../lib/finish-sets.js');
const { DAILY_GAME_MAP, liveDailyKeys } = await import('../lib/daily-games.js');

let fails = 0;
let warns = 0;
const fail = (m) => { console.error('✗ ' + m); fails += 1; };
const warn = (m) => { console.warn('… ' + m); warns += 1; };
const ok = (m) => console.log('ok    ' + m);

const live = liveDailyKeys();
const liveSet = new Set(live);
const sigs = new Map();
const names = new Set();
for (const s of FINISH_SETS) {
  if (names.has(s.name)) fail(`duplicate set name ${s.name}`);
  names.add(s.name);
  if (s.keys.length < 2 || s.keys.length > 4) fail(`${s.name}: ${s.keys.length} keys, must be 2 to 4`);
  if (new Set(s.keys).size !== s.keys.length) fail(`${s.name}: repeats a key`);
  for (const k of s.keys) {
    const row = DAILY_GAME_MAP[k];
    if (!row) fail(`${s.name}: '${k}' is not a registry key`);
    else if (row.cat !== s.cat) fail(`${s.name} (${s.cat}): '${k}' is ${row.cat}`);
  }
  const sig = [...s.keys].sort().join(',');
  if (sigs.has(sig)) fail(`${s.name} holds the same games as ${sigs.get(sig)}`);
  sigs.set(sig, s.name);
  const alive = s.keys.filter((k) => liveSet.has(k)).length;
  if (alive < 2) warn(`${s.name} has ${alive} live game(s) and will not show`);
}
const cover = new Map(live.map((k) => [k, 0]));
for (const s of FINISH_SETS) for (const k of s.keys) if (cover.has(k)) cover.set(k, cover.get(k) + 1);
const none = [...cover].filter(([, n]) => n === 0).map(([k]) => k);
if (none.length) fail(`in no set: ${none.join(', ')}`);
const once = [...cover].filter(([, n]) => n === 1).map(([k]) => k);
ok(`${FINISH_SETS.length} sets over ${live.length} live games; ${once.length} game(s) in only one set`);

// The pick.
const done = (list) => { const s = new Set(list); return (k) => s.has(k); };
let p = finishPick('crux', done([]), live);
if (!p || p.complete || !p.set.keys.includes('crux') || p.open.length !== 2) fail(`fresh crux: ${JSON.stringify(p)}`);
p = finishPick('crux', done(['anon']), live);
if (!p || p.set.name !== 'Clueless crosswords' || p.open.join() !== 'glyph') fail(`crux after anon should push Clueless crosswords with glyph open: ${JSON.stringify(p && { n: p.set.name, o: p.open })}`);
p = finishPick('crux', done(['emcee', 'glyph', 'anon']), live);
if (!p || !p.complete || !p.next || p.next.set.cat !== 'Word' || !p.next.open.length) fail(`crux with both its sets done should hand to another Word set: ${JSON.stringify(p && { c: p.complete, n: p.next && p.next.set.name })}`);
p = finishPick('crux', done(live), live);
if (!p || !p.complete || p.next) fail('everything done should have no next');
p = finishPick('sweep', done([]), live);
if (!p || p.open.join() !== 'blocks') fail('sweep should push blocks');
ok('pick cases');

console.log(fails ? `\n${fails} failure(s), ${warns} warning(s)` : `\nall clear, ${warns} warning(s)`);
process.exit(fails ? 1 : 0);
