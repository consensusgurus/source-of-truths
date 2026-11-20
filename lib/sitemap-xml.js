// Shared XML writers for the sitemap index and its segments.
//
// Hand-rolled rather than using Next's `sitemap.js` metadata convention, because that
// convention emits ONE file and this site needs four plus an index (see
// lib/sitemap-entries.js for why). app/legacy-sitemap already writes its XML by hand for
// the same reason, so this is the established shape in the repo, not a new one.

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const iso = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

// Long enough that Googlebot's fetches are cheap, short enough that a page published today
// appears tomorrow. Matches the cadence app/legacy-sitemap already uses.
export const SITEMAP_CACHE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

export function xmlResponse(xml) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE,
    },
  });
}

// A <urlset> of entries in the shape lib/sitemap-entries.js returns.
export function urlsetXml(entries) {
  const body = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.url)}</loc>`];
      const lastmod = iso(entry.lastModified);
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      if (entry.changeFrequency) parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      if (entry.priority != null) parts.push(`    <priority>${entry.priority}</priority>`);
      // Image sitemap extension (2026-11-19): the jigsaw photos, so they can
      // appear in Google Images. Only entries that carry `images` get the tags.
      for (const img of entry.images || []) {
        const ip = [`      <image:loc>${escapeXml(img.loc)}</image:loc>`];
        if (img.title) ip.push(`      <image:title>${escapeXml(img.title)}</image:title>`);
        parts.push(`    <image:image>\n${ip.join('\n')}\n    </image:image>`);
      }
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

// A <sitemapindex> pointing at the segment files.
export function sitemapIndexXml(children) {
  const body = children
    .map((child) => {
      const lastmod = iso(child.lastModified);
      const parts = [`    <loc>${escapeXml(child.url)}</loc>`];
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      return `  <sitemap>\n${parts.join('\n')}\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
