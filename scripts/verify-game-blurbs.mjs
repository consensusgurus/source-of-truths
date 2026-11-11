// Every live daily needs a Details blurb in lib/game-blurbs.js, 30 to 56
// characters (two lines at most on the narrowest card; owner, 2026-11-10),
// no em dash.
import { DAILY_GAMES } from '../lib/daily-games.js';
import { GAME_BLURBS } from '../lib/game-blurbs.js';
const bad = [];
for (const g of DAILY_GAMES) {
  const b = GAME_BLURBS[g.key];
  if (!b) { bad.push(`${g.key}: missing`); continue; }
  if (b.length < 30 || b.length > 56) bad.push(`${g.key}: ${b.length} chars`);
  if (b.includes('—')) bad.push(`${g.key}: em dash`);
}
if (bad.length) { console.error('game-blurbs FAIL\n  ' + bad.join('\n  ')); process.exit(1); }
console.log(`game-blurbs OK (${DAILY_GAMES.length} games)`);
