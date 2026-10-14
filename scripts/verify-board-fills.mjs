// OPEN SQUARE vs BLOCK SQUARE, dark register (2026-10-14).
//
//   node scripts/verify-board-fills.mjs
//
// The other contrast checks measure TEXT on its ground, and the Sept 1 cell
// fix measured a square's BOUNDARY against the page. Neither ever compared one
// kind of square with another, so a crossword whose open squares are
// --stg-cell (#1a1d28) and whose blocks are near-black (#06080e, 1.3:1) passed
// everything and read on a phone as one dark slab (Encore, Emcee, Glyph, Sums).
//
// Rule: a client that paints a block / black / void square DARK on the stage
// must not paint its open squares with bare var(--stg-cell). Use the crossword
// fill, color-mix(in srgb, var(--stg-cell) 84%, #fff) (white in light mode,
// lifted in dark), or carry a pattern and list the game in PATTERNED below.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
// Blocks told apart by a hatch, an outline or a label rather than by fill,
// checked live 2026-10-14 at 390px dark: Shards, Snug, Tally.
const PATTERNED = new Set(['shards', 'snug', 'tally']);
const BLOCK_SEL = /\.(?:[a-z]+-)?(?:blk|black|block|void)\b[^{]*\{[^}]*background(?:-color)?:\s*([^;}]+)/g;
const BLOCK_JS = /if \((?:black|blk|isBlock|block)\)\s*bg\s*=\s*([^;]+);/g;
const DARK = /stg-ground|black|#0[0-9a-f]{5}\b|#1[0-9a-f]{5}\b|COLORS\.ink|--gl-blk|--mc-blk/;
let bad = 0, n = 0;
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory() || PATTERNED.has(d.name)) continue;
  for (const f of readdirSync(join('app', d.name))) {
    if (!/Client\.jsx$/.test(f)) continue;
    const src = readFileSync(join('app', d.name, f), 'utf8');
    if (!/stg-cell/.test(src)) continue;
    const fills = [...src.matchAll(BLOCK_SEL), ...src.matchAll(BLOCK_JS)].map((m) => m[1]);
    if (!fills.some((x) => DARK.test(x))) continue;
    n++;
    if (/var\(--xw-cell\)|var\(--stg-cell(?:, ?#fff)?\) 84%, #fff\)/.test(src)) continue;
    bad++;
    console.log(`FAIL ${d.name}/${f}: dark block squares, open squares on bare --stg-cell`);
  }
}
console.log(`${n} boards with dark block squares checked, ${bad} failing`);
process.exit(bad ? 1 : 0);
