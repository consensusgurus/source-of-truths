// Verifier for lib/gridiron-archive.js, the frozen boards behind the week
// switcher on /collegefootballrankings. Discovered by scripts/verify-all.mjs.
//
// Proves, for every archived week:
//   1. weeks are unique, ascending, below the live board's week, and each entry's
//      `week` / `builtAt` agree with its own block
//   2. today's engine, run with the board's OWN build date, reproduces the
//      published order and ratings exactly (to the second decimal). A scoring
//      change that fails this is rewriting history and must be date-gated.
//   3. the live board is NOT in the archive (it joins when it is replaced)
// Exit 1 on any failure.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { computeComposite } = await import('../lib/gridiron.js');
const { GRIDIRON } = await import('../lib/gridiron-data.js');
const { CFB_ARCHIVE } = await import('../lib/gridiron-archive.js');

let fails = 0;
const bad = (m) => { fails++; console.log('  FAIL ' + m); };
const live = GRIDIRON.cfb.week;
let prev = 0;
for (const e of CFB_ARCHIVE) {
  if (e.week <= prev) bad(`week ${e.week} is not ascending/unique`);
  prev = e.week;
  if (e.week >= live) bad(`week ${e.week} is not below the live week ${live}`);
  if (e.block.week !== e.week) bad(`week ${e.week}: block says week ${e.block.week}`);
  if (e.block.builtAt !== e.builtAt) bad(`week ${e.week}: builtAt disagrees with its block`);
  const out = computeComposite(e.block, 'cfb', { fetchedAt: e.builtAt });
  const got = out.ranked.map((r) => [r.team, r.rank, +r.score.toFixed(2)]);
  if (got.length !== e.published.length) bad(`week ${e.week}: ${got.length} rows against ${e.published.length} published`);
  let diff = 0;
  e.published.forEach(([t, r, s], i) => {
    const g = got[i];
    if (!g || g[0] !== t || g[1] !== r || Math.abs(g[2] - s) > 0.0051) diff++;
  });
  if (diff) bad(`week ${e.week}: ${diff} rows no longer match the published board`);
  else console.log(`  ok week ${e.week} (built ${e.builtAt}) reproduces as published, ${got.length} teams`);
}
if (CFB_ARCHIVE.some((e) => e.week === live)) bad(`the live week ${live} is already in the archive`);
if (fails) { console.log(`\n${fails} gridiron archive failure(s)`); process.exit(1); }
console.log('\nall gridiron archive checks pass');
