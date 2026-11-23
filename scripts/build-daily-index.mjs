// Builds lib/daily-index.json: the slim index of every daily puzzle (owner ask,
// 2026-11-23: the heavy API routes loaded every puzzle bank, about 36 MB, only
// to learn which puzzle ran on which day, which made every cold start slow).
//
// For each game key in lib/daily-slate.js GAME_PUZZLES, one row per puzzle:
//   [quizId, num, live, rev, sunday]   (rev 0 when absent, sunday 1 or 0)
// That is every field the light routes read (see lib/daily-index.js). The file
// is GENERATED and gitignored: `npm run build` runs this first (prebuild), as
// does `npm run dev`, so it can never fall behind a restocked bank.
import { register } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

register('./alias-loader.mjs', import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { GAME_PUZZLES } = await import('../lib/daily-slate.js');

const out = {};
let n = 0;
for (const [key, list] of Object.entries(GAME_PUZZLES)) {
  out[key] = (list || []).filter((p) => p && p.quizId).map((p) => {
    n++;
    return [p.quizId, p.num ?? null, p.live || null, p.rev || 0, p.sunday ? 1 : 0];
  });
}
if (Object.keys(out).length < 100 || n < 1000) {
  console.error(`daily-index: only ${Object.keys(out).length} games / ${n} puzzles, refusing to write`);
  process.exit(1);
}
writeFileSync(join(root, 'lib/daily-index.json'), JSON.stringify(out));
console.log(`daily-index: ${Object.keys(out).length} games, ${n} puzzles`);
