// THE ALTERNATIVES PAGES SHIP COMPLETE (2026-11-28). node scripts/verify-alternatives.mjs
//
// For lib/alternatives.js: every Mind Loft key is a live registry daily, every
// quiz id is in the catalogue, titles are 70 or fewer and end "| Mind Loft",
// descriptions 160 or fewer, no em dash anywhere, a route file per slug, and
// the link paths (footer, StageTail, sitemap) are wired.
import { readFileSync, existsSync } from 'node:fs';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { ALTERNATIVES, ALT_HUB } = await import('../lib/alternatives.js');
const { DAILY_GAME_MAP } = await import('../lib/daily-games.js');
const quizSrc = readFileSync('lib/quizzes.js', 'utf8');

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
const checkMeta = (L, o) => {
  if (!o.title || o.title.length > 70) fail(`${L}: title ${o.title?.length} chars (70 max)`);
  if (!/\| Mind Loft$/.test(o.title || '')) fail(`${L}: title must end "| Mind Loft"`);
  if (!o.description || o.description.length > 160) fail(`${L}: description ${o.description?.length} chars (160 max)`);
  if (/[—]/.test(JSON.stringify(o))) fail(`${L}: em dash in copy`);
};
checkMeta('hub', ALT_HUB);
for (const a of ALTERNATIVES) {
  const L = a.slug;
  checkMeta(L, a);
  if (!existsSync(`app/${a.slug}/page.js`)) fail(`${L}: app/${a.slug}/page.js missing`);
  for (const m of a.matches) {
    for (const k of m.keys || []) if (!DAILY_GAME_MAP[k]) fail(`${L} / ${m.theirs}: ${k} is not in the registry`);
    for (const [id] of m.quizzes || []) if (!new RegExp(`["']?id["']?\\s*:\\s*["']${id}["']`).test(quizSrc)) fail(`${L} / ${m.theirs}: quiz ${id} not in lib/quizzes.js`);
    for (const [href] of m.more || []) if (!existsSync(`app${href}/page.js`) && !existsSync(`app${href}`)) fail(`${L} / ${m.theirs}: ${href} has no route`);
    if (!(m.keys || []).length && !(m.quizzes || []).length && !(m.more || []).length) fail(`${L} / ${m.theirs}: no links`);
  }
  if (!a.faq?.length || !a.differences?.length) fail(`${L}: faq and differences required`);
}
const must = [
  ['app/Footer.jsx', "href: '/alternatives'"],
  ['app/StageTail.jsx', 'ALT_FOR_GAME[self]'],
  ['lib/sitemap-entries.js', 'ALTERNATIVES.map'],
];
for (const [f, needle] of must) if (!readFileSync(f, 'utf8').includes(needle)) fail(`${f}: missing ${needle}`);
console.log(bad ? `verify-alternatives: ${bad} failure(s)` : `verify-alternatives: ${ALTERNATIVES.length} pages and the hub OK`);
process.exit(bad ? 1 : 0);
