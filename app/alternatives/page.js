// /alternatives: the hub over the NYT Games, Sporcle and Puzzmo alternative
// pages (owner, 2026-11-28). Linked from the footer. See lib/alternatives.js.

import { AltHub } from './AltViews';
import { ALTERNATIVES, ALT_HUB, NOT_AFFILIATED } from '@/lib/alternatives';
import { SITE_URL } from '@/lib/site';

export const metadata = {
  title: ALT_HUB.title,
  description: ALT_HUB.description,
  alternates: { canonical: ALT_HUB.href },
  openGraph: { title: ALT_HUB.h1, description: ALT_HUB.description, url: ALT_HUB.href, type: 'website', siteName: 'Mind Loft' },
  twitter: { card: 'summary_large_image', title: ALT_HUB.h1, description: ALT_HUB.description },
};

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

export default function AlternativesPage() {
  const pages = ALTERNATIVES.map((a) => ({ slug: a.slug, h1: a.h1, theirs: a.matches.slice(0, 4).map((m) => m.theirs) }));
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: ALT_HUB.h1,
        url: `${SITE_URL}${ALT_HUB.href}`,
        hasPart: ALTERNATIVES.map((a) => ({ '@type': 'Article', headline: a.h1, url: `${SITE_URL}/${a.slug}` })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Alternatives', item: `${SITE_URL}${ALT_HUB.href}` },
        ],
      })}
      <AltHub hub={ALT_HUB} pages={pages} footnote={NOT_AFFILIATED} />
    </>
  );
}
