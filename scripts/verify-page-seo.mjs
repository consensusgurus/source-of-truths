// EVERY DAILY AND EVERY RUN PAGE SHIPS ITS SEARCH FURNITURE (2026-10-13).
//
//   node scripts/verify-page-seo.mjs
//
// scripts/verify-game-seo.mjs proves the DERIVED half (lib/game-seo.js: the
// questions, the siblings, the category crumb). This proves the half each
// page writes by hand, which is the half a launch forgets: an audit on
// 2026-10-13 found 90 game pages whose Game schema had no image, Dario with no
// Game schema at all, 415 em dashes in titles and share text, a run tail that
// did not exist, and 16 of the newest descriptions running past what a search
// result shows. For every daily in the registry, and every run that owns an
// address, it checks:
//
//   1. the page exists at the registry href, with a static title of 70
//      characters or fewer ending "| Mind Loft", a description, and a
//      canonical equal to the href;
//   2. the description is 160 characters or fewer, unless the key is in
//      scripts/page-seo-baseline.json, the grandfathered long ones. That file
//      is a BURN-DOWN LIST: it may shrink and must never grow. A new game
//      starts under 160;
//   3. openGraph and twitter both name an image that exists under public/;
//   4. a Game schema with an image that exists under public/ or is a card
//      route;
//   5. no em dash in any title, description, alt or alternateName;
//   6. a daily mounts <StageTail self="key"> and its client prints crawlable
//      prose ("About <Name>" or "How <Name> works");
//   7. every circuit with its own path is a run page (lib/run-seo.js
//      RUN_PAGES) or a known landing (RUN_LANDINGS); every run page mounts
//      <StageTail run="id">, emits a BreadcrumbList, and its questions are
//      sentences with no em dash and links that resolve;
//   8. the sitemap's game segment carries every daily href and every run path.
//
// --baseline rewrites the baseline from the current state (only ever to
// shrink it; the diff will show if it grew).
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { DAILY_GAMES, REVIEW_HOLD } = await import('../lib/daily-games.js');
const { CIRCUITS } = await import('../lib/circuits.js');
const { RUN_PAGES, RUN_LANDINGS, runFaq } = await import('../lib/run-seo.js');
const { gamesEntries } = await import('../lib/sitemap-entries.js');

const BASE_FILE = 'scripts/page-seo-baseline.json';
const baseline = new Set(existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')).longDescription : []);
const writeBaseline = process.argv.includes('--baseline');
const longNow = [];

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
const pageFile = (href) => join('app', ...href.split('/').filter(Boolean), 'page.js');
const routeExists = (href) => {
  const path = href.replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0];
  if (path === '/' || !path) return true;
  if (existsSync(pageFile(path))) return true;
  // One dynamic segment (/circuits/<id>, /quiz/<id>): the [param] folder.
  const segs = path.split('/').filter(Boolean);
  const parent = join('app', ...segs.slice(0, -1));
  return existsSync(parent) && readdirSync(parent).some((d) => /^\[[a-z]+\]$/i.test(d) && existsSync(join(parent, d, 'page.js')));
};
const publicOk = (u) => {
  if (!u) return false;
  const path = u.replace(/^https?:\/\/[^/]+/, '').replace(/^\$\{SITE_URL\}/, '').split('?')[0];
  if (path === '/icon.png') return existsSync('app/icon.png');
  if (/\/card$/.test(path)) return existsSync(join('app', ...path.split('/').filter(Boolean), 'route.js'));
  return existsSync(join('public', path));
};
const str = (re, s) => { const m = s.match(re); return m ? m[1] : null; };
const metaStrings = (s) => [...s.matchAll(/(?:title|description|alt|alternateName)\s*:\s*\n?\s*(['"`])((?:(?!\1).)*)\1/gs)].map((m) => m[2]);

function checkCommon(label, src, href, { title, desc }) {
  if (!title) fail(`${label}: no static title`);
  else {
    if (title.length > 70) fail(`${label}: title is ${title.length} characters (70 max): ${title}`);
    if (!/\| Mind Loft$/.test(title)) fail(`${label}: title does not end "| Mind Loft"`);
  }
  if (!desc) fail(`${label}: no static description`);
  else if (desc.length > 160) {
    longNow.push(label);
    if (!baseline.has(label)) fail(`${label}: description is ${desc.length} characters (160 max)`);
  }
  if (!new RegExp(`canonical:\\s*['"\`]${href.replace(/\//g, '\\/')}['"\`]`).test(src)) fail(`${label}: canonical is not ${href}`);
  if (!/openGraph:\s*\{/.test(src)) fail(`${label}: no openGraph`);
  if (!/twitter:\s*\{/.test(src)) fail(`${label}: no twitter`);
  const ogImgs = [...src.matchAll(/url:\s*['"`](\/[^'"`]+?\.png)['"`]/g)].map((m) => m[1]);
  for (const u of ogImgs) if (!publicOk(u)) fail(`${label}: image ${u} is not in public/`);
  if (!/'@type':\s*'Game'/.test(src)) fail(`${label}: no Game schema`);
  const ldImg = str(/image:\s*`([^`]+)`/, src);
  if (!ldImg) fail(`${label}: Game schema has no image`);
  else if (!publicOk(ldImg)) fail(`${label}: Game schema image ${ldImg} does not resolve`);
  for (const t of metaStrings(src)) if (/—/.test(t)) fail(`${label}: em dash in "${t.slice(0, 60)}"`);
}

// 1-6. the dailies
let dailies = 0;
const priceSrc = readFileSync('app/price/PricePage.jsx', 'utf8');
for (const g of DAILY_GAMES) {
  if (REVIEW_HOLD.has(g.key)) continue;
  const f = pageFile(g.href);
  if (!existsSync(f)) { fail(`${g.key}: no page at ${f}`); continue; }
  dailies++;
  let src = readFileSync(f, 'utf8');
  const label = g.key;
  if (/priceMetadata\(/.test(src)) {
    // The five price games share one server half; its metadata is a template.
    if (!/image:\s*`\$\{SITE_URL\}\/og\/\$\{gameKey\}\.png`/.test(priceSrc)) fail(`${label}: PricePage Game schema has no image`);
    if (!existsSync(join('public', 'og', `${g.key}.png`))) fail(`${label}: public/og/${g.key}.png missing`);
    continue;
  }
  if (g.key === 'passport') {
    // Run-only: its page is the run, checked below as a run page.
    continue;
  }
  const title = str(/\n  title:\s*'([^']*)'/, src) || str(/\n  title:\s*"([^"]*)"/, src);
  const desc = str(/\n  description:\s*\n?\s*'((?:[^'\\]|\\.)*)'/, src) || str(/\n  description:\s*\n?\s*"([^"]*)"/, src);
  checkCommon(label, src, g.href, { title, desc });
  if (!new RegExp(`<StageTail self="${g.key}"`).test(src)) fail(`${label}: no <StageTail self="${g.key}">`);
  const dir = join('app', ...g.href.split('/').filter(Boolean));
  const client = readdirSync(dir).filter((x) => /Client\.jsx$/.test(x)).map((x) => readFileSync(join(dir, x), 'utf8')).join('\n');
  if (client && !new RegExp(`(About ${g.name}\\b|How ${g.name} works|About \\{NAME\\})`).test(client)) fail(`${label}: client prints no "About ${g.name}" or "How ${g.name} works" prose`);
}

// 7. the runs
const runPaths = [];
for (const c of CIRCUITS) {
  if (!c.path) continue;
  if (RUN_LANDINGS.includes(c.id)) continue;
  if (!RUN_PAGES[c.id]) { fail(`circuit ${c.id} owns ${c.path} but is in neither RUN_PAGES nor RUN_LANDINGS (lib/run-seo.js)`); continue; }
  if (RUN_PAGES[c.id].path !== c.path) fail(`run ${c.id}: RUN_PAGES path ${RUN_PAGES[c.id].path} is not the circuit path ${c.path}`);
}
for (const [id, r] of Object.entries(RUN_PAGES)) {
  runPaths.push(r.path);
  const f = pageFile(r.path);
  if (!existsSync(f)) { fail(`run ${id}: no page at ${f}`); continue; }
  const src = readFileSync(f, 'utf8');
  const title = str(/const title = '([^']*)'/, src);
  const desc = str(/const description = '((?:[^'\\]|\\.)*)'/, src);
  checkCommon(`run ${id}`, src, r.path, { title, desc: desc && desc.replace(/\\'/g, "'") });
  if (!new RegExp(`<StageTail run="${id}"`).test(src)) fail(`run ${id}: no <StageTail run="${id}">`);
  if (!/runBreadcrumbJsonLd\(|'@type': 'BreadcrumbList'/.test(src)) fail(`run ${id}: no BreadcrumbList`);
  const faq = runFaq(id);
  if (faq.length < 5) fail(`run ${id}: only ${faq.length} questions`);
  for (const [q, a, html] of faq) {
    if (!/\?$/.test(q)) fail(`run ${id}: question does not end in ?: ${q}`);
    if (!a || !/[.!]$/.test(a.trim())) fail(`run ${id}: answer is not a sentence: ${a}`);
    if (/[—–]/.test(q + a + (html || ''))) fail(`run ${id}: em dash in "${q}"`);
    for (const h of (html || '').matchAll(/href="([^"]+)"/g)) if (!routeExists(h[1])) fail(`run ${id}: answer links ${h[1]}, which has no page`);
  }
}

// 8. the sitemap
const inMap = new Set(gamesEntries('https://x.test').map((e) => e.url.replace('https://x.test', '')));
for (const g of DAILY_GAMES) if (!REVIEW_HOLD.has(g.key) && !inMap.has(g.href)) fail(`sitemap: ${g.href} missing`);
for (const p of runPaths) if (!inMap.has(p)) fail(`sitemap: run ${p} missing`);
for (const p of inMap) if (!routeExists(p)) fail(`sitemap: ${p} has no page`);

if (writeBaseline) {
  const grew = longNow.filter((k) => !baseline.has(k));
  writeFileSync(BASE_FILE, `${JSON.stringify({ note: 'Burn-down list: pages whose meta description runs past 160 characters, grandfathered 2026-10-13. Shrink it, never grow it.', longDescription: longNow.sort() }, null, 1)}\n`);
  console.log(`baseline written: ${longNow.length} long descriptions${grew.length ? `, NEW: ${grew.join(', ')}` : ''}`);
}
const stale = [...baseline].filter((k) => !longNow.includes(k));
if (stale.length) console.log(`note: ${stale.length} baseline entries are now short enough; run --baseline to shrink it (${stale.join(', ')})`);
console.log(`verify-page-seo: ${dailies} daily pages, ${runPaths.length} run pages, ${longNow.length} grandfathered long descriptions, ${bad} failures`);
process.exit(bad ? 1 : 0);
