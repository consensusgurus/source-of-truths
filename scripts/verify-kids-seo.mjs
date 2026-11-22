// Gate for lib/kids-seo.js (owner, 2026-11-22: SEO on every kids page).
// Every app/kids/<id>/page.js (and the hub) must take its metadata from
// kidsMetadata('<id>') and mount <KidsSeo id="<id>" />, every row needs a page,
// and titles / descriptions stay inside what a search result shows.
// Discovered by verify-all. Exit 1 on any failure.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { KIDS_SEO_ROWS } = await import(join(root, 'lib', 'kids-seo.js'));
let bad = 0;
const fail = (m) => { bad++; console.log('✗ kids-seo:', m); };
const RETIRED = new Set(['tall-jigsaw']); // redirects

const rows = new Map(KIDS_SEO_ROWS.map((r) => [r.id, r]));
const pages = [['kids', join(root, 'app', 'kids', 'page.js')]];
for (const d of readdirSync(join(root, 'app', 'kids'), { withFileTypes: true })) {
  if (!d.isDirectory() || RETIRED.has(d.name)) continue;
  const p = join(root, 'app', 'kids', d.name, 'page.js');
  if (existsSync(p)) pages.push([d.name, p]);
}
for (const [id, p] of pages) {
  const s = readFileSync(p, 'utf8');
  if (!rows.has(id)) fail(`${id}: page has no KIDS_SEO row`);
  if (!s.includes(`kidsMetadata('${id}')`)) fail(`${id}: metadata is not kidsMetadata('${id}')`);
  if (!s.includes(`<KidsSeo id="${id}"`)) fail(`${id}: no <KidsSeo id="${id}" />`);
}
const pageIds = new Set(pages.map(([id]) => id));
for (const r of KIDS_SEO_ROWS) {
  if (!pageIds.has(r.id)) fail(`${r.id}: row has no page`);
  if (r.title.length > 70) fail(`${r.id}: title ${r.title.length} chars (max 70)`);
  if (r.description.length > 160) fail(`${r.id}: description ${r.description.length} chars (max 160)`);
  if (/—/.test(r.title + r.description)) fail(`${r.id}: em dash`);
  if (!/free/i.test(r.title + r.description)) fail(`${r.id}: never says free`);
}
console.log(bad ? `kids-seo: ${bad} problem(s)` : `✓ kids-seo: ${pages.length} pages, metadata, structured data, sitemap rows\n\nkids-seo: all clean`);
process.exit(bad ? 1 : 0);
