// MIND LOFT AND COGNITIVE HEALTH SHIPS HONEST AND COMPLETE (2026-11-26).
// node scripts/verify-cognitive-health.mjs
//
// For every article in lib/cognitive-health.js: unique slug, title of 70 or
// fewer ending "| Mind Loft", description of 160 or fewer, intro, sections,
// bottom line, at least one https source, resolvable play links and related
// slugs, and no em dash. Then the honesty scan: any sentence that uses a
// claim verb (prevent, cure, reverse, treat, protect, boost, ward off, proven)
// must also carry a negation or a hedge, so a positive health claim cannot
// slip in. Finally the footer column must list FOOTER_ARTICLES, in order,
// with each article's `short` as its label.
import { readFileSync, existsSync } from 'node:fs';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const M = await import('../lib/cognitive-health.js');
const { DAILY_GAME_MAP } = await import('../lib/daily-games.js');
const { ARTICLES, ARTICLE_MAP, FOOTER_ARTICLES, COGNITIVE_HEALTH_NOTE } = M;

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
const seen = new Set();
const CLAIM = /\b(prevent(s|ed|ing)?|cure[sd]?|revers(e|es|ed|ing)|treat(s|ed|ing|ment)?|protect(s|ed|ing|ive)?|boost(s|ed|ing)?|ward(s|ed)? off|proven)\b/i;
const HEDGE = /\b(no|not|never|nor|cannot|can't|isn't|without|neither|may|might|could|in principle|linked|associated|estimated|whether|lower risk|risk factors?|asked|claims?|weak)\b/i;

for (const a of ARTICLES) {
  const L = `article ${a.slug}`;
  if (seen.has(a.slug)) fail(`${L}: duplicate slug`); seen.add(a.slug);
  if (!/^[a-z0-9-]+$/.test(a.slug)) fail(`${L}: bad slug`);
  if (!a.title || a.title.length > 70 || !/\| Mind Loft$/.test(a.title)) fail(`${L}: title (${a.title?.length}) must be 70 max, end "| Mind Loft"`);
  if (!a.description || a.description.length > 160) fail(`${L}: description ${a.description?.length} chars (160 max)`);
  for (const f of ['h1', 'short', 'intro', 'bottomLine']) if (!a[f]) fail(`${L}: no ${f}`);
  if (!Array.isArray(a.sections) || !a.sections.length) fail(`${L}: no sections`);
  if (!Array.isArray(a.sources) || !a.sources.length || a.sources.some(([, u]) => !/^https:\/\//.test(u))) fail(`${L}: sources missing or not https`);
  for (const p of a.play || []) {
    if (p.length === 2 && !DAILY_GAME_MAP[p[0]]) fail(`${L}: play key ${p[0]} not in registry`);
    if (p.length === 3 && !p[0].startsWith('/')) fail(`${L}: play href ${p[0]} must be a site path`);
  }
  for (const r of a.related || []) if (!ARTICLE_MAP[r]) fail(`${L}: related ${r} does not exist`);
  // PROTECT is a study name, not a claim verb.
  const text = [a.title, a.description, a.intro, a.bottomLine, ...a.sections.flatMap(([h, ps]) => [h, ...ps])]
    .join(' \n ').replace(/\bPROTECT\b/g, 'the study');
  if (/—/.test(text)) fail(`${L}: em dash in copy`);
  for (const sent of text.split(/(?<=[.!?])\s+/)) {
    if (CLAIM.test(sent) && !HEDGE.test(sent)) fail(`${L}: unhedged claim word: "${sent.trim().slice(0, 140)}"`);
    if (/mind loft/i.test(sent) && CLAIM.test(sent)) fail(`${L}: Mind Loft named beside a claim word: "${sent.trim().slice(0, 140)}"`);
  }
}
if (!/not medical advice/i.test(COGNITIVE_HEALTH_NOTE)) fail('COGNITIVE_HEALTH_NOTE must say it is not medical advice');

const footer = readFileSync('app/Footer.jsx', 'utf8');
const col = footer.slice(footer.indexOf("head: 'Mind Loft and Cognitive Health'"), footer.indexOf("head: 'Lists'"));
if (!col) fail('footer: no Mind Loft and Cognitive Health column');
const hrefs = [...col.matchAll(/href: '\/cognitive-health\/([a-z0-9-]+)'/g)].map((m) => m[1]);
if (JSON.stringify(hrefs) !== JSON.stringify(FOOTER_ARTICLES)) fail(`footer: links ${hrefs.join(',')} do not match FOOTER_ARTICLES`);
for (const s of FOOTER_ARTICLES) {
  const a = ARTICLE_MAP[s];
  if (!a) { fail(`FOOTER_ARTICLES: ${s} missing`); continue; }
  if (!col.includes(`label: '${a.short.replace(/'/g, "\\'")}'`)) fail(`footer: label for ${s} should be "${a.short}"`);
}
if (!col.includes("href: '/cognitive-health' }")) fail('footer: hub link missing');
if (!readFileSync('lib/sitemap-entries.js', 'utf8').includes('/cognitive-health/${a.slug}')) fail('sitemap: articles missing');

console.log(bad ? `${bad} problem(s)` : `ok: ${ARTICLES.length} articles`);
process.exit(bad ? 1 : 0);
