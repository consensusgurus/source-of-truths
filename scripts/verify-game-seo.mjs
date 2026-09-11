// THE SEARCH FACTS ON EVERY DAILY GAME PAGE ARE TRUE AND COMPLETE.
//
//   node scripts/verify-game-seo.mjs
//
// Guards lib/game-seo.js and the breadcrumb wiring (scripts/wire-game-crumbs.mjs):
//
//   1. every daily page.js that mounts <StageTail self="k"> builds its
//      breadcrumb with categoryCrumb('k') and no longer names /quizzes;
//   2. for every registry key, categoryCrumb resolves to a category page that
//      EXISTS as an app route, so the crumb never points at a 404;
//   3. gameFaq returns at least five answered questions per key, every answer
//      is a full sentence, none carries an em dash, and every link in an
//      answer or in relatedGames resolves to a real app route;
//   4. relatedGames never returns the game itself, a retired game, or a game
//      from another category, and every live game with a sibling gets at
//      least one;
//   5. the FAQPage schema round-trips as JSON with one Question per answer.
//
// No dependencies: runs in a fresh clone.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { DAILY_GAMES, DAILY_GAME_MAP, liveDailyKeys } = await import('../lib/daily-games.js');
const { gameFaq, gameFaqJsonLd, relatedGames, categoryCrumb, gameCategory } = await import('../lib/game-seo.js');

let bad = 0;
const fail = (msg) => { bad++; console.log('FAIL', msg); };
const routeExists = (href) => {
  const path = href.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  if (path === '/' || path === '') return true;
  return existsSync(join('app', ...path.split('/').filter(Boolean), 'page.js'));
};

// 1. the pages
let pages = 0;
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const rel = join('app', d.name, 'page.js');
  if (!existsSync(rel)) continue;
  const src = readFileSync(rel, 'utf8');
  const m = src.match(/<StageTail self="([a-z]+)"/);
  if (!m) continue;
  pages++;
  const key = m[1];
  if (!DAILY_GAME_MAP[key]) fail(`${rel}: self="${key}" is not a registry key`);
  if (!src.includes(`categoryCrumb('${key}')`)) fail(`${rel}: breadcrumb does not call categoryCrumb('${key}')`);
  if (!src.includes("import { categoryCrumb } from '@/lib/game-seo';")) fail(`${rel}: categoryCrumb not imported`);
  if (/name: 'Quizzes', item: `\$\{SITE_URL\}\/quizzes`/.test(src)) fail(`${rel}: still carries the Home > Quizzes crumb`);
}
if (pages < 80) fail(`only ${pages} daily pages found; expected the whole roster`);

// 2-5. the registry
const live = new Set(liveDailyKeys());
for (const g of DAILY_GAMES) {
  const k = g.key;
  const crumb = categoryCrumb(k);
  if (!crumb || crumb.position !== 2 || !crumb.name || !crumb.item) fail(`${k}: malformed crumb ${JSON.stringify(crumb)}`);
  else if (!routeExists(crumb.item)) fail(`${k}: crumb points at ${crumb.item}, which has no page.js`);
  const cat = gameCategory(k);
  if (!cat) fail(`${k}: no category page`);

  const faq = gameFaq(k);
  if (faq.length < 5) fail(`${k}: only ${faq.length} questions`);
  for (const [q, a, html] of faq) {
    if (!/\?$/.test(q)) fail(`${k}: question does not end in ?: ${q}`);
    if (!a || a.length < 20 || !/[.!]$/.test(a.trim())) fail(`${k}: answer is not a sentence: ${a}`);
    if (/[—–]/.test(q + a + (html || ''))) fail(`${k}: em dash in "${q}"`);
    if (/<[^>]+>/.test(a)) fail(`${k}: plain answer carries markup: ${a}`);
    for (const h of (html || '').matchAll(/href="([^"]+)"/g)) {
      if (!routeExists(h[1])) fail(`${k}: answer links ${h[1]}, which has no page.js`);
    }
  }

  const rel = relatedGames(k);
  for (const r of rel) {
    if (r.key === k) fail(`${k}: related to itself`);
    if (!live.has(r.key)) fail(`${k}: related to retired ${r.key}`);
    if (DAILY_GAME_MAP[r.key].cat !== g.cat) fail(`${k}: related across categories to ${r.key}`);
    if (!routeExists(r.href)) fail(`${k}: related link ${r.href} has no page.js`);
  }
  const siblings = DAILY_GAMES.filter((s) => s.key !== k && s.cat === g.cat && live.has(s.key)).length;
  if (live.has(k) && siblings > 0 && rel.length === 0) fail(`${k}: has ${siblings} live siblings but no related games`);
  if (rel.length > 4) fail(`${k}: ${rel.length} related games, max is 4`);

  const ld = gameFaqJsonLd(k);
  const back = JSON.parse(JSON.stringify(ld));
  if (back['@type'] !== 'FAQPage' || back.mainEntity.length !== faq.length) fail(`${k}: FAQPage schema does not match the questions`);
}

console.log(`verify-game-seo: ${pages} pages, ${DAILY_GAMES.length} registry keys, ${bad} failures`);
process.exit(bad ? 1 : 0);
