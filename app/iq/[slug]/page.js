import { notFound } from 'next/navigation';
import IqTestClient from './IqTestClient';
import { IQ_TEST_MAP } from '@/lib/iq-tests';
import { iqItemsFor, iqPoolFor } from '@/lib/iq-pool';
import { IQ_MODEL } from '@/lib/iq-items';
import { SITE_URL } from '@/lib/site';

// One /iq test. The pool is resolved HERE, on the server, and only one
// sitting's stratified sample ships to the browser, the same rule every
// gauntlet page keeps for its bank. force-dynamic so each load deals a fresh
// sample: a reader who retakes a test meets different questions.
export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const t = IQ_TEST_MAP[params.slug];
  if (!t) return {};
  const title = `${t.name} IQ Test: Free Adaptive Trivia Test | Mind Loft`;
  const description = `A free adaptive ${t.name.toLowerCase()} test. Twenty-five to thirty questions calibrated on real Mind Loft players, harder when you are right and easier when you are not, scored as a player-normed IQ with a percentile.`;
  return {
    title,
    description,
    alternates: { canonical: `/iq/${t.slug}` },
    openGraph: { title: `${t.name} IQ Test | Mind Loft`, description, url: `/iq/${t.slug}`, type: 'website', siteName: 'Mind Loft', images: [{ url: '/og/brand.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: `${t.name} IQ Test | Mind Loft`, description, images: ['/og/brand.png'] },
  };
}

export default function IqTestPage({ params }) {
  const test = IQ_TEST_MAP[params.slug];
  if (!test) notFound();
  const items = iqItemsFor(test.slug);
  const pool = iqPoolFor(test.slug).map(({ id, b, lane, src, q, choices, correct }) => ({ id, b, lane, src, q, choices, correct }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${test.name} IQ Test`,
    url: `${SITE_URL}/iq/${test.slug}`,
    about: test.name,
    educationalLevel: 'General',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: SITE_URL },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IqTestClient
        test={{ slug: test.slug, name: test.name, short: test.short, ramp: test.ramp }}
        pool={pool}
        model={IQ_MODEL}
        bankSize={items.length}
        measured={items.filter((x) => x.n >= 5).length}
      />
    </>
  );
}
