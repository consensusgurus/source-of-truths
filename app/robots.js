import { SITEMAP_SEGMENTS } from '@/lib/sitemap-entries';
import { SITE_URL } from '@/lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        // The jigsaw photo routes are images, not API calls: Google Images may
        // fetch them (2026-11-19). The more specific Allow wins over /api/.
        // Each refuses a day that is not live, so no surprise leaks.
        allow: ['/', '/api/jig/img', '/api/saw/img'],
        disallow: ['/admin', '/api/'],
      },
    ],
    // Always the CANONICAL host, whichever domain served this robots.txt. Pointing each host
    // at its own sitemap would advertise two competing sites during the soft launch.
    //
    // The index comes first, then each segment explicitly (2026-08-17). An index alone is
    // enough for Google, but listing the segments means Bing, DuckDuckGo and the IndexNow
    // consumers pick up all four without following the index, and it costs one line.
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      ...SITEMAP_SEGMENTS.map((segment) => `${SITE_URL}/sitemaps/${segment.name}.xml`),
      `${SITE_URL}/sitemaps/photos.xml`,
    ],
  };
}
