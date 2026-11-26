// /cognitive-health: the Mind Loft and Cognitive Health hub (owner,
// 2026-11-26). Articles grouped by audience. Content and the honesty rule:
// lib/cognitive-health.js. Linked from its own footer column (app/Footer.jsx).

import { HealthHub } from './HealthViews';
import { ARTICLES, AUDIENCES, COGNITIVE_HEALTH_NOTE, COGNITIVE_HEALTH_UPDATED } from '@/lib/cognitive-health';
import { SITE_URL } from '@/lib/site';

const TITLE = 'Puzzles, Reading, and Brain Health: What Research Says | Mind Loft';
const H1 = 'Mind Loft and Cognitive Health';
const DESCRIPTION = 'Plain-language articles on research about puzzles, jigsaws, reading, and games and the brain, for kids, adults, and older adults. Sources included.';
const LEDE = 'What scientists have actually found about puzzles, reading, jigsaws, and games and the brain, from toddlers to people in their nineties. Each article says how strong the evidence is, reports the disappointing results as well as the encouraging ones, and links every study.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/cognitive-health' },
  openGraph: { title: H1, description: DESCRIPTION, url: '/cognitive-health', type: 'website', siteName: 'Mind Loft' },
  twitter: { card: 'summary_large_image', title: H1, description: DESCRIPTION },
};

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

export default function CognitiveHealthPage() {
  // Each article is listed once, under its first audience.
  const groups = AUDIENCES
    .map((aud) => [aud, ARTICLES.filter((a) => a.audience[0] === aud).map((a) => ({ slug: a.slug, short: a.short, description: a.description, minutes: a.minutes }))])
    .filter(([, l]) => l.length);
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: H1,
        url: `${SITE_URL}/cognitive-health`,
        hasPart: ARTICLES.map((a) => ({ '@type': 'Article', headline: a.h1, url: `${SITE_URL}/cognitive-health/${a.slug}` })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Cognitive Health', item: `${SITE_URL}/cognitive-health` },
        ],
      })}
      <HealthHub h1={H1} lede={LEDE} note={COGNITIVE_HEALTH_NOTE} groups={groups} updated={COGNITIVE_HEALTH_UPDATED} />
    </>
  );
}
