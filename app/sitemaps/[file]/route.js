// /sitemaps/<segment>.xml — one file per segment (games, lists, quizzes, pages).
//
// Referenced by the index at /sitemap.xml, and each is submitted to Search Console
// SEPARATELY so its index rate is readable on its own. See lib/sitemap-entries.js.
//
// One dynamic route rather than four folders, so a new segment needs no new file: add it to
// SITEMAP_SEGMENTS and it is served here and listed in the index automatically. An unknown
// segment 404s rather than returning an empty urlset, so a typo in the index is loud.

import { SITEMAP_SEGMENTS } from '@/lib/sitemap-entries';
import { urlsetXml, xmlResponse } from '@/lib/sitemap-xml';
import { SITE_URL } from '@/lib/site';
import { photoSitemapEntries } from '@/lib/photo-puzzles';

// The games segment's lastmod rolls at Eastern midnight; never freeze this into the build.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const name = String(params.file || '').replace(/\.xml$/, '');
  // Approved Community Photos (YOUR PHOTO JIGSAWS, 2026-11-27): async, read from Storage.
  if (name === 'photos') return xmlResponse(urlsetXml(await photoSitemapEntries(SITE_URL)));
  const segment = SITEMAP_SEGMENTS.find((candidate) => candidate.name === name);
  if (!segment) return new Response('Not found', { status: 404 });

  return xmlResponse(urlsetXml(segment.build(SITE_URL)));
}
