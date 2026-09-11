// EVERY DAILY'S BREADCRUMB POINTS AT ITS CATEGORY PAGE, NOT AT /quizzes.
//
//   node scripts/wire-game-crumbs.mjs
//
// WHY (Search Console, 2026-09-11). All 92 game pages emitted
// Home > Quizzes > <Game> as BreadcrumbList schema, a leftover from when the
// dailies were listed as quizzes. The category landing pages
// (lib/puzzle-categories.js) are the pages meant to rank for "daily sudoku"
// and "daily word game", and a breadcrumb is one of the few signals a page
// sends about which hub it belongs to; pointing all 92 at /quizzes sent that
// signal to a page with nothing to do with them.
//
// Anchored and idempotent, the repo's convention for a many-file edit: each
// page is touched only where BOTH anchors match exactly once, so a page that
// has already been converted, or that was hand-edited into a different shape,
// is reported and left alone rather than half-rewritten.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CRUMB = "{ '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE_URL}/quizzes` },";
const IMPORT = "import { SITE_URL } from '@/lib/site';";
const NEW_IMPORT = "import { categoryCrumb } from '@/lib/game-seo';";

let done = 0; let already = 0; const skipped = [];
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const rel = join('app', d.name, 'page.js');
  if (!existsSync(rel)) continue;
  const src = readFileSync(rel, 'utf8');
  const m = src.match(/<StageTail self="([a-z]+)"/);
  if (!m) continue;                                   // not a daily game page
  const key = m[1];
  if (src.includes(`categoryCrumb('${key}')`)) { already++; continue; }
  const count = (s, needle) => s.split(needle).length - 1;
  if (count(src, CRUMB) !== 1 || count(src, IMPORT) !== 1 || src.includes(NEW_IMPORT)) {
    skipped.push(`${rel} (crumb x${count(src, CRUMB)}, import x${count(src, IMPORT)})`);
    continue;
  }
  const out = src
    .replace(IMPORT, `${IMPORT}\n${NEW_IMPORT}`)
    .replace(CRUMB, `categoryCrumb('${key}'),`);
  writeFileSync(rel, out);
  done++;
}
console.log(`wire-game-crumbs: ${done} converted, ${already} already converted, ${skipped.length} skipped`);
for (const s of skipped) console.log('  skipped', s);
process.exit(skipped.length ? 1 : 0);
