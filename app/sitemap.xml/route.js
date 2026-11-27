// /sitemap.xml — the SITEMAP INDEX.
//
// Replaced the `app/sitemap.js` metadata convention on 2026-08-17. That convention emits a
// single flat <urlset>, which is what this site had: 2,511 urls in one 457KB file. Search
// Console reports index coverage PER SITEMAP, so one file could only ever report "130 of
// 2,511 indexed" and never say which kind of page was failing, when the answer (quizzes and
// lists, both shipping empty shells) was the whole story. Four segments report separately.
//
// It also stopped 1,852 static quiz urls from diluting the crawl signal on the ~64 game urls
// that genuinely change daily, which are the only pages currently earning search traffic.
//
// The old hosts are NOT served from here: middleware rewrites their /sitemap.xml to
// app/legacy-sitemap, which stays a single flat file of OLD urls on purpose (see that file).
//
// Segment list comes from SITEMAP_SEGMENTS, so adding a segment there adds it here too.

import { SITEMAP_SEGMENTS } from '@/lib/sitemap-entries';
import { sitemapIndexXml, xmlResponse } from '@/lib/sitemap-xml';
import { SITE_URL } from '@/lib/site';

// The games segment carries a lastmod that rolls at Eastern midnight, so this route must not
// be frozen into the build output.
export const dynamic = 'force-dynamic';

export function GET() {
  const children = SITEMAP_SEGMENTS.map((segment) => {
    const entries = segment.build(SITE_URL);
    const newest = entries.reduce((max, entry) => {
      const time = new Date(entry.lastModified).getTime();
      return Number.isNaN(time) ? max : Math.max(max, time);
    }, 0);
    return {
      url: `${SITE_URL}/sitemaps/${segment.name}.xml`,
      lastModified: newest ? new Date(newest) : new Date(),
    };
  });

  // The Community Photos segment (app/sitemaps/[file], 2026-11-27) is async and listed by hand.
  children.push({ url: `${SITE_URL}/sitemaps/photos.xml`, lastModified: new Date() });
  return xmlResponse(sitemapIndexXml(children));
}
