// THE PUZZLE GUIDES SHIP COMPLETE (2026-11-25). node scripts/verify-guides.mjs
//
// For every entry in lib/guides.js: a unique slug, a live registry game,
// `also` keys that exist, a title of 70 characters or fewer ending
// "| Mind Loft" and leading "How to Solve", a description of 160 or fewer,
// rules / steps / tips / faq present, an og image that exists, and no em dash
// anywhere in the copy. Also checks the four link paths (footer, StageTail,
// category related rows, sitemap) are wired, so no guide is an orphan.
import { readFileSync, existsSync } from 'node:fs';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { GUIDES, guideForGame } = await import('../lib/guides.js');
const { DAILY_GAME_MAP } = await import('../lib/daily-games.js');
const { PUZZLE_CATEGORIES } = await import('../lib/puzzle-categories.js');

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
const seen = new Set();
for (const g of GUIDES) {
  const L = `guide ${g.slug}`;
  if (seen.has(g.slug)) fail(`${L}: duplicate slug`); seen.add(g.slug);
  if (!/^how-to-solve-[a-z0-9-]+$/.test(g.slug)) fail(`${L}: slug should be how-to-solve-...`);
  if (!DAILY_GAME_MAP[g.game]) fail(`${L}: game ${g.game} is not in the registry`);
  for (const k of g.also || []) if (!DAILY_GAME_MAP[k]) fail(`${L}: also ${k} is not in the registry`);
  if (!g.title || g.title.length > 70) fail(`${L}: title ${g.title?.length} chars (70 max)`);
  if (!/^How to Solve /.test(g.title || '') || !/\| Mind Loft$/.test(g.title || '')) fail(`${L}: title must start "How to Solve" and end "| Mind Loft"`);
  if (!g.description || g.description.length > 160) fail(`${L}: description ${g.description?.length} chars (160 max)`);
  for (const f of ['rules', 'steps', 'tips', 'faq']) if (!Array.isArray(g[f]) || !g[f].length) fail(`${L}: no ${f}`);
  if (!existsSync(`public/og/${g.game}.png`)) fail(`${L}: public/og/${g.game}.png missing`);
  if (/[—]/.test(JSON.stringify(g))) fail(`${L}: em dash in copy`);
  if (guideForGame(g.game) !== g) fail(`${L}: ${g.game} already belongs to another guide`);
  const cat = PUZZLE_CATEGORIES.find((c) => c.cat === g.cat);
  if (!cat || !(cat.related || []).some(([h]) => h === `/guides/${g.slug}`)) fail(`${L}: not linked from its category page`);
}
const must = [
  ['app/Footer.jsx', "href: '/guides'"],
  ['app/StageTail.jsx', 'guideForGame(self)'],
  ['lib/sitemap-entries.js', '/guides/${g.slug}'],
];
for (const [f, s] of must) if (!readFileSync(f, 'utf8').includes(s)) fail(`${f}: guides link path missing (${s})`);
console.log(bad ? `${bad} problem(s)` : `ok: ${GUIDES.length} guides`);
process.exit(bad ? 1 : 0);
